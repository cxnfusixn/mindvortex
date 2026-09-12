import fs from 'node:fs';
import {parseEnv} from 'node:util';
import {randomBytes,scryptSync} from 'node:crypto';
const file='/etc/mindvortex-social.env';
const social=parseEnv(fs.readFileSync(file,'utf8')),site=parseEnv(fs.readFileSync('/etc/mindvortex.env','utf8'));
if(!social.SOCIAL_PASSWORD_HASH){const salt=randomBytes(16).toString('hex');social.SOCIAL_PASSWORD_HASH=salt+':'+scryptSync(social.SOCIAL_ADMIN_PASSWORD,salt,64).toString('hex');}
if(!social.SOCIAL_AUTH_KEY)social.SOCIAL_AUTH_KEY=randomBytes(32).toString('hex');
delete social.SOCIAL_ADMIN_PASSWORD;
for(const k of ['SMTP_HOST','SMTP_PORT','SMTP_USER','SMTP_PASSWORD','SMTP_FROM'])social[k]=site[k];
fs.writeFileSync(file,Object.entries(social).map(([k,v])=>k+'='+JSON.stringify(v)).join('\n')+'\n',{mode:0o640});
console.log('Credentials migrated; no secrets printed.');
