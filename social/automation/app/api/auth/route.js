import {readJson} from '../../../lib/request.mjs';
import {NextResponse} from 'next/server';
import {startLogin,finishLogin,cookie,sessionCookie,challengeCookie,cookieOptions,digest} from '../../../lib/auth.mjs';
import {pool,event} from '../../../lib/db.mjs';
export async function POST(req){
 if(req.headers.get('origin')!==new URL(process.env.SOCIAL_PUBLIC_URL).origin)return new Response(null,{status:403});
 try{const b=await readJson(req,2048),r=NextResponse.json({ok:true},{headers:{'Cache-Control':'no-store'}});
 if(b.action==='login')r.cookies.set(challengeCookie,await startLogin(b.password,req.headers.get('x-forwarded-for')||'unknown'),{...cookieOptions,maxAge:600});
 else if(b.action==='verify'){r.cookies.set(sessionCookie,await finishLogin(cookie(req,challengeCookie),b.code),{...cookieOptions,maxAge:28800});r.cookies.set(challengeCookie,'',{...cookieOptions,maxAge:0});await event('Owner login completed');}
 else if(b.action==='logout'){await pool.query('DELETE FROM social_sessions WHERE token_hash=$1',[digest(cookie(req,sessionCookie))]);r.cookies.set(sessionCookie,'',{...cookieOptions,maxAge:0});}
 else return new Response(null,{status:400});return r;
 }catch(e){return NextResponse.json({error:/kod|Kod|logowania|minut|wysłać/.test(e.message)?e.message:'Logowanie niedostępne. Spróbuj później.'},{status:e.status||400,headers:{'Cache-Control':'no-store'}});}
}
