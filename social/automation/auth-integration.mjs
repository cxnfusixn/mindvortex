import {randomBytes,createHmac} from 'node:crypto';
import {init,pool} from './lib/db.mjs';
import {digest,finishLogin,authorized,sessionCookie} from './lib/auth.mjs';
import assert from 'node:assert/strict';
await init();
try{const token=randomBytes(32).toString('hex'),code='123456';const h=createHmac('sha256',process.env.SOCIAL_AUTH_KEY).update(token+':'+code).digest('hex');
await pool.query("INSERT INTO social_challenges(token_hash,code_hash,expires_at) VALUES($1,$2,now()+interval '10 minutes')",[digest(token),h]);
await assert.rejects(finishLogin(token,'000000'));
const session=await finishLogin(token,code);const req=new Request('https://mindvortex.pro',{headers:{cookie:sessionCookie+'='+session}});assert(await authorized(req));await assert.rejects(finishLogin(token,code));
await pool.query('DELETE FROM social_sessions WHERE token_hash=$1',[digest(session)]);assert(!await authorized(req));
console.log('Wrong OTP rejected; correct OTP accepted; replay blocked; revoked session rejected.');
}finally{await pool.end();}
