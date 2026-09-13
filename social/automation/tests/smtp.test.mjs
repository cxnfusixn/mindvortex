import test from 'node:test';
import assert from 'node:assert/strict';
import net from 'node:net';
import {sendMail} from '../lib/auth.mjs';
test('OTP mail refuses SMTP without STARTTLS before authentication', async () => {
  let authenticated=false;const sockets=new Set();
  const server=net.createServer(s=>{sockets.add(s);s.on('close',()=>sockets.delete(s));s.write('220 local fixture\r\n');s.on('data',b=>{const command=b.toString();if(command.startsWith('EHLO'))s.write('250-localhost\r\n250 AUTH PLAIN\r\n');else {if(command.startsWith('AUTH'))authenticated=true;s.write('500 Not supported\r\n');}});});
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  const saved={...process.env};process.env.SMTP_HOST='127.0.0.1';process.env.SMTP_PORT=String(server.address().port);process.env.SMTP_FROM='synthetic@example.com';process.env.SMTP_USER='fixture';process.env.SMTP_PASSWORD='fixture';process.env.SOCIAL_ALERT_EMAIL='synthetic@example.com';
  try {await assert.rejects(sendMail('Fixture','Fixture'));assert.equal(authenticated,false);}
  finally {for(const k of ['SMTP_HOST','SMTP_PORT','SMTP_FROM','SMTP_USER','SMTP_PASSWORD','SOCIAL_ALERT_EMAIL']){if(saved[k]===undefined)delete process.env[k];else process.env[k]=saved[k];}for(const s of sockets)s.destroy();await new Promise(r=>server.close(r));}
});
