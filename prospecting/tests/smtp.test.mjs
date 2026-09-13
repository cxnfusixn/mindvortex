import test from 'node:test';
import assert from 'node:assert/strict';
import net from 'node:net';
import {mkdtempSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {deliver} from '../lib/delivery.mjs';
test('prospecting refuses SMTP without STARTTLS before authentication', async () => {
  let authenticated=false,requestedTLS=false;const sockets=new Set();
  const server=net.createServer(s=>{sockets.add(s);s.on('close',()=>sockets.delete(s));s.write('220 local fixture\r\n');s.on('data',b=>{const command=b.toString();if(command.startsWith('EHLO'))s.write('250-localhost\r\n250 AUTH PLAIN\r\n');else {if(command.startsWith('AUTH'))authenticated=true;if(command.startsWith('STARTTLS'))requestedTLS=true;s.write('500 Not supported\r\n');}});});
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  const saved={...process.env};process.env.SMTP_HOST='127.0.0.1';process.env.SMTP_PORT=String(server.address().port);process.env.SMTP_FROM='synthetic@example.com';process.env.SMTP_USER='fixture';process.env.SMTP_PASSWORD='fixture';
  const lead={id:'fixture',email:'synthetic@example.com',draft:'fixture',name:'Fixture',status:'ready',canAudit:true,audit:{confidence:'high',verifiedAt:'2026-01-01',offer:'website',findings:[{severity:2}]},share_token:'fixture',share_expires:'2999-01-01'};
  const store={directory:mkdtempSync(join(tmpdir(),'mv-tls-')),runtime(){},transaction:fn=>fn(),lead:()=>lead,setStatus:(_id,status)=>{lead.status=status;},event(){}};
  try {await assert.rejects(deliver(store,lead.id,{email:lead.email,draft:lead.draft}));assert.equal(requestedTLS,true);assert.equal(authenticated,false);assert.equal(lead.status,'uncertain');}
  finally {for(const k of ['SMTP_HOST','SMTP_PORT','SMTP_FROM','SMTP_USER','SMTP_PASSWORD']){if(saved[k]===undefined)delete process.env[k];else process.env[k]=saved[k];}for(const s of sockets)s.destroy();await new Promise(r=>server.close(r));}
});
