import fs from 'node:fs/promises';
import {pool} from './lib/db.mjs';
import {sendMail} from './lib/auth.mjs';
const state='/var/lib/mindvortex-social/monitor-alert.json';
try{
 let failed=false;try{const r=await fetch(process.env.SOCIAL_PUBLIC_URL+'/login',{signal:AbortSignal.timeout(10000)});if(!r.ok)failed=true;
 const row=(await pool.query("SELECT checked_at FROM social_health WHERE name='worker'")).rows[0];if(!row||Date.now()-new Date(row.checked_at)>600000)failed=true;
 const stat=await fs.statfs('/var/lib/mindvortex-social');if(stat.bavail/stat.blocks<.1)failed=true;
 }catch{failed=true;}
 let previous={};try{previous=JSON.parse(await fs.readFile(state,'utf8'));}catch{}
 if(failed&&(!previous.failed||Date.now()-previous.sent>6*3600000)){await sendMail('Mind Vortex: awaria systemu publikacji','Panel, baza, worker lub dostępne miejsce wymagają sprawdzenia. Zaloguj się na serwer i sprawdź usługi mindvortex-social.');await fs.writeFile(state,JSON.stringify({failed:true,sent:Date.now()}));}
 if(!failed&&previous.failed){await sendMail('Mind Vortex: system znów działa','Monitor potwierdził powrót panelu i workera.');await fs.writeFile(state,JSON.stringify({failed:false}));}
 console.log(failed?'Health check failed':'Health check passed');if(failed)process.exitCode=1;
}finally{await pool.end();}
