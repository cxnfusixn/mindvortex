import {randomBytes,randomInt,createHash,createHmac,scryptSync,timingSafeEqual} from 'node:crypto';
import {pool} from './db.mjs';
import nodemailer from 'nodemailer';
export const sessionCookie='__Secure-mv-social-session',challengeCookie='__Secure-mv-social-challenge';
export const cookieOptions={httpOnly:true,secure:true,sameSite:'strict',path:'/studio-social'};
export const digest=s=>createHash('sha256').update(s).digest('hex');
export function passwordHash(s,salt=randomBytes(16).toString('hex')){return salt+':'+scryptSync(s,salt,64).toString('hex');}
export function passwordMatches(s,stored){if(typeof s!=='string'||s.length>256||!stored)return false;const [salt,hash]=stored.split(':');if(!/^[a-f0-9]{128}$/.test(hash||''))return false;return timingSafeEqual(scryptSync(s,salt,64),Buffer.from(hash,'hex'));}
export function cookie(req,name){return (req.headers.get('cookie')||'').split(';').map(x=>x.trim()).find(x=>x.startsWith(name+'='))?.slice(name.length+1)||'';}
export async function authorized(req){const token=cookie(req,sessionCookie);if(!/^[a-f0-9]{64}$/.test(token))return false;return !!(await pool.query('SELECT 1 FROM social_sessions WHERE token_hash=$1 AND expires_at>now()',[digest(token)])).rowCount;}
export async function sendMail(subject,text){if(!process.env.SMTP_HOST||!process.env.SOCIAL_ALERT_EMAIL)throw Error('Mail configuration missing');const result=await nodemailer.createTransport({host:process.env.SMTP_HOST,port:Number(process.env.SMTP_PORT||465),secure:process.env.SMTP_PORT!=='587',connectionTimeout:10000,socketTimeout:20000,auth:{user:process.env.SMTP_USER,pass:process.env.SMTP_PASSWORD}}).sendMail({from:process.env.SMTP_FROM,to:process.env.SOCIAL_ALERT_EMAIL,subject,text});if(!result.accepted?.length)throw Error('Mail not accepted');}
export async function startLogin(password,ip){
 const key=digest(ip),c=await pool.connect();
 try{await c.query('BEGIN');await c.query('SELECT pg_advisory_xact_lock(hashtext($1))',['auth:'+key]);
 const n=(await c.query("SELECT count(*)::int AS n FROM social_login_attempts WHERE ip_hash=$1 AND at>now()-interval '15 minutes'",[key])).rows[0].n;
 if(n>=8){await c.query('ROLLBACK');throw Error('Odczekaj 15 minut przed kolejną próbą.');}
 await c.query('INSERT INTO social_login_attempts(ip_hash) VALUES($1)',[key]);await c.query('COMMIT');
 }finally{c.release();}
 if(!passwordMatches(password,process.env.SOCIAL_PASSWORD_HASH))throw Error('Nieprawidłowe dane logowania.');
 const token=randomBytes(32).toString('hex'),code=String(randomInt(100000,1000000));
 const codeHash=createHmac('sha256',process.env.SOCIAL_AUTH_KEY).update(token+':'+code).digest('hex');
 await pool.query("INSERT INTO social_challenges(token_hash,code_hash,expires_at) VALUES($1,$2,now()+interval '10 minutes')",[digest(token),codeHash]);
 try{await sendMail('Mind Vortex — kod logowania',`Kod logowania: ${code}\n\nWażny przez 10 minut. Jeśli nie logujesz się do panelu, zignoruj tę wiadomość.`);}catch{await pool.query('DELETE FROM social_challenges WHERE token_hash=$1',[digest(token)]);throw Error('Nie udało się wysłać kodu. Spróbuj później.');}
 return token;
}
export async function finishLogin(token,code){
 if(!/^[a-f0-9]{64}$/.test(token)||!/^\d{6}$/.test(code))throw Error('Nieprawidłowy kod.');
 const c=await pool.connect();try{await c.query('BEGIN');const row=(await c.query('SELECT * FROM social_challenges WHERE token_hash=$1 FOR UPDATE',[digest(token)])).rows[0];
 if(!row||new Date(row.expires_at)<=new Date()||row.attempts>=5){await c.query('ROLLBACK');throw Error('Kod wygasł. Zaloguj się ponownie.');}
 const hash=createHmac('sha256',process.env.SOCIAL_AUTH_KEY).update(token+':'+code).digest('hex');
 if(!timingSafeEqual(Buffer.from(hash),Buffer.from(row.code_hash))){await c.query('UPDATE social_challenges SET attempts=attempts+1 WHERE token_hash=$1',[digest(token)]);await c.query('COMMIT');throw Error('Nieprawidłowy kod.');}
 await c.query('DELETE FROM social_challenges WHERE token_hash=$1',[digest(token)]);
 const session=randomBytes(32).toString('hex');await c.query("INSERT INTO social_sessions(token_hash,expires_at) VALUES($1,now()+interval '8 hours')",[digest(session)]);await c.query('COMMIT');return session;
 }catch(e){await c.query('ROLLBACK');throw e;}finally{c.release();}
}
