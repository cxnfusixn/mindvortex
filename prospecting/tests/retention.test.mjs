import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,existsSync,readFileSync,symlinkSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {openStore} from '../lib/store.mjs';
import {expiredLeads,eraseLead} from '../lib/retention.mjs';
import {execFileSync} from 'node:child_process';

const input = {name:'Synthetic company',email:'fixture@example.com',website:'https://example.com',area:'Białołęka',category:'beauty'};
test('180-day retention removes contact, history, jobs and files; journal prevents reimport', () => {
  const root=mkdtempSync(join(tmpdir(),'mv-retention-')),store=openStore(root);
  try {
    const lead=store.addLead(input);
    store.db.prepare('UPDATE leads SET updated_at=? WHERE id=?').run('2000-01-01T00:00:00.000Z',lead.id);
    store.recordAudit('run',lead,'initial',{summary:'Private data'},[]);
    const folder=join(root,'assets',lead.id);mkdirSync(folder,{recursive:true});writeFileSync(join(folder,'report.html'),'private report');
    assert.equal(expiredLeads(store).length,1);
    assert.equal(eraseLead(store,lead.id),true);
    assert.equal(store.lead(lead.id),undefined);assert.equal(store.auditHistory().length,0);assert.equal(store.events().length,0);
    assert.equal(existsSync(folder),false);assert.equal(eraseLead(store,lead.id),false);
    assert.throws(()=>store.addLead(input),/wyłączona/);
    assert.throws(()=>store.addLead({...input,website:'https://www.example.com.'}),/wyłączona/);
    const journal=readFileSync(join(root,'erasures.jsonl'),'utf8');assert.ok(!journal.includes(input.email));assert.ok(!journal.includes(input.name));
  } finally {store.close();}
});
test('offline export includes evidence; replay erases a restored backup', () => {
  const root=mkdtempSync(join(tmpdir(),'mv-retention-cli-')),store=openStore(root);
  const lead=store.addLead(input);
  const folder=join(root,'assets',lead.id);mkdirSync(folder,{recursive:true});writeFileSync(join(folder,'desktop-1.jpg'),'synthetic image');
  store.close();
  const run=(...args)=>execFileSync(process.execPath,['prospecting/retention.mjs',...args],{encoding:'utf8',env:{...process.env,PROSPECTING_DATA_DIR:root}});
  const exported=JSON.parse(run('export',lead.id));assert.equal(Buffer.from(exported.assets['desktop-1.jpg'],'base64').toString(),'synthetic image');
  run('erase',lead.id);let restored=openStore(root);assert.ok(restored.lead(lead.id));restored.close();
  run('erase',lead.id,'--apply','--services-stopped');
  // Simulate a backup created before the erasure journal was recorded.
  restored=openStore(root);restored.db.exec('DELETE FROM excluded_domains');
  const replacement=restored.addLead(input);restored.db.prepare('UPDATE leads SET id=? WHERE id=?').run(lead.id,replacement.id);restored.close();
  run('replay',join(root,'erasures.jsonl'),'--apply','--services-stopped');
  restored=openStore(root);try{assert.equal(restored.lead(lead.id),undefined);assert.throws(()=>restored.addLead(input),/wyłączona/);}finally{restored.close();}
});
test('recent and active contacts are not retention candidates; deletion rejects path escapes', () => {
  const root=mkdtempSync(join(tmpdir(),'mv-retention-')),store=openStore(root);
  try {
    const lead=store.addLead(input);assert.equal(expiredLeads(store).length,0);
    store.enqueue('audit',lead.id);store.claim();
    assert.throws(()=>eraseLead(store,lead.id),/active work/);
    store.db.exec("UPDATE jobs SET status='failed'");
    const outside=mkdtempSync(join(tmpdir(),'mv-retention-outside-'));writeFileSync(join(outside,'keep'),'safe');
    symlinkSync(outside,join(root,'assets'),'junction');
    assert.throws(()=>eraseLead(store,lead.id),/Unsafe/);
    assert.equal(store.lead(lead.id).email,input.email);assert.equal(readFileSync(join(outside,'keep'),'utf8'),'safe');
  } finally {store.close();}
});
