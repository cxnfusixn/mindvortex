import fs from 'node:fs/promises';
import pg from 'pg';
import {sendMail} from './lib/auth.mjs';
import {pool as authPool} from './lib/db.mjs';
import {diagnose,alertMessage} from './lib/monitor.mjs';
const pool=new pg.Pool({connectionString:process.env.SOCIAL_DATABASE_URL,max:1,connectionTimeoutMillis:5000,query_timeout:5000,statement_timeout:5000});
const state='/var/lib/mindvortex-social/monitor-alert.json';
try {
 const report=await diagnose({query:(sql)=>pool.query(sql)}),failed=report.checks.some(c=>c.ok===false),fingerprint=report.checks.filter(c=>c.ok===false).map(c=>c.component).sort().join('|');
 const message=alertMessage(report);
 if(process.argv.includes('--dry-run'))console.log(JSON.stringify({failed,...message},null,2));
 else {
 let previous={};try{previous=JSON.parse(await fs.readFile(state,'utf8'));}catch{}
 if(failed&&(!previous.failed||previous.fingerprint!==fingerprint||Date.now()-previous.sent>6*3600000)){
 await sendMail(message.subject,message.text);await fs.writeFile(state,JSON.stringify({failed:true,sent:Date.now(),fingerprint}),{mode:0o600});
 }
 if(!failed&&previous.failed){await sendMail('Mind Vortex: system znów działa',`Poprzedni problem: ${previous.fingerprint||'starszy alert bez rozpoznanego komponentu'}\n\n${report.checks.map(c=>`${c.component}: ${c.detail}`).join('\n')}`);await fs.writeFile(state,JSON.stringify({failed:false}),{mode:0o600});}
 console.log(JSON.stringify(report));if(failed)process.exitCode=1;
 }
}finally{await pool.end();await authPool.end();}
