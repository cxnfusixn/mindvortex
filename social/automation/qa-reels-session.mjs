// Short-lived deployment QA session. Token never goes to stdout.
import {randomBytes,createHash} from 'node:crypto';
import fs from 'node:fs/promises';
import {pool} from './lib/db.mjs';
const file='/var/lib/mindvortex-social/.reels-qa-token';
try{if(process.argv[2]==='remove'){const t=await fs.readFile(file,'utf8');await pool.query('DELETE FROM social_sessions WHERE token_hash=$1',[createHash('sha256').update(t).digest('hex')]);await fs.rm(file);}
else{const t=randomBytes(32).toString('hex');await pool.query("INSERT INTO social_sessions(token_hash,expires_at) VALUES($1,now()+interval '10 minutes')",[createHash('sha256').update(t).digest('hex')]);await fs.writeFile(file,t,{mode:0o600});}}
finally{await pool.end();}
