import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import nodemailer from "nodemailer";
import { openStore } from "../lib/store.mjs";
import { deliver, canSend } from "../lib/delivery.mjs";
test("email without consent qualifies, but ambiguous SMTP is never repeated", async () => {
  const s = openStore(mkdtempSync(join(tmpdir(), "mv-mail-"))),
    original = nodemailer.createTransport;
  process.env.PROSPECTING_SEND_ENABLED = "true";
  process.env.SMTP_HOST = "unused.invalid";
  process.env.SMTP_FROM = "test@example.com";
  let calls = 0;
  nodemailer.createTransport = () => ({
    sendMail: async (message) => {
      assert.equal(message.text, "draft");
      assert.match(message.html, /#35f46a/);
      assert.match(message.html, /draft/);
      calls++;
      throw Error("simulated timeout");
    },
    close() {},
  });
  try {
    s.saveSettings({ paused: false, autoSend: true });
    const lead = s.addLead({
      name: "Test",
      email: "test@example.com",
      website: "https://example.com",
      area: "Białołęka",
      category: "beauty",
    });
    s.saveAudit(
      lead.id,
      [],
      {
        confidence: "high",
        offer: "website",
        verifiedAt: new Date().toISOString(),
        findings: [{ severity: 2 }],
      },
      "draft",
    );
    s.db.prepare("UPDATE leads SET email='' WHERE id=?").run(lead.id);
    await assert.rejects(deliver(s, lead.id));
    assert.equal(calls, 0);
    s.saveContact(lead.id, "test@example.com");
    assert.equal(canSend(s.lead(lead.id)), true);
    assert.equal(canSend({ ...s.lead(lead.id), email: "a@example.com,b@example.com" }), false);
    assert.equal(canSend({ ...s.lead(lead.id), canAudit: false }), false);
    await assert.rejects(deliver(s, lead.id));
    assert.equal(s.lead(lead.id).status, "uncertain");
    assert.equal(calls, 1);
    await assert.rejects(deliver(s, lead.id));
    assert.equal(calls, 1);
  } finally {
    nodemailer.createTransport = original;
    s.close();
  }
});

test('manual delivery works while paused, rejects stale drafts and prevents duplicate sends', async () => {
 const s=openStore(mkdtempSync(join(tmpdir(),'mv-manual-mail-'))),original=nodemailer.createTransport;
 const saved={...process.env};let calls=0;
 process.env.PROSPECTING_SEND_ENABLED='false';process.env.SMTP_HOST='unused.invalid';process.env.SMTP_FROM='test@example.com';
 nodemailer.createTransport=()=>({sendMail:async m=>{calls++;assert.equal(m.to,'test@example.com');assert.equal(m.text,'reviewed draft');return {accepted:[m.to]};},close(){}});
 try {const l=s.addLead({name:'Test',email:'test@example.com',website:'https://example.com',area:'Białołęka',category:'beauty'});
 s.saveAudit(l.id,[],{confidence:'high',offer:'website',verifiedAt:new Date().toISOString(),findings:[{severity:2}]},'reviewed draft');
 await assert.rejects(deliver(s,l.id));
 await assert.rejects(deliver(s,l.id,{email:l.email,draft:'stale'}));assert.equal(calls,0);
 const results=await Promise.allSettled([deliver(s,l.id,{email:l.email,draft:'reviewed draft'}),deliver(s,l.id,{email:l.email,draft:'reviewed draft'})]);
 assert.equal(results.filter(r=>r.status==='fulfilled').length,1);assert.equal(calls,1);assert.equal(s.lead(l.id).status,'sent');assert.equal(s.settings().paused,true);
 }finally{nodemailer.createTransport=original;for(const k of ['PROSPECTING_SEND_ENABLED','SMTP_HOST','SMTP_FROM']){if(saved[k]===undefined)delete process.env[k];else process.env[k]=saved[k];}s.close();}
});

test('interrupted manual delivery becomes uncertain without allowing another send', () => {
 const s=openStore(mkdtempSync(join(tmpdir(),'mv-mail-recovery-')));
 try {const l=s.addLead({name:'Test',email:'test@example.com',website:'https://example.com',area:'Białołęka',category:'beauty'});
 s.db.prepare("UPDATE leads SET status='sending',updated_at=? WHERE id=?").run(new Date(Date.now()-16*60000).toISOString(),l.id);s.recover();assert.equal(s.lead(l.id).status,'uncertain');assert.equal(canSend(s.lead(l.id)),false);
 }finally{s.close();}
});

test('contact history persists across status changes and blocks the same email on another domain', () => {
 const dir=mkdtempSync(join(tmpdir(),'mv-contact-history-')),s=openStore(dir);
 try {
  const input={name:'QA',email:'shared@example.com',website:'https://one.example.com',area:'Białołęka',category:'beauty'};
  const first=s.addLead(input),second=s.addLead({...input,email:'SHARED@example.com',website:'https://two.example.com'});
  const audit={confidence:'high',offer:'website',verifiedAt:new Date().toISOString(),findings:[{severity:2}]};
  s.saveAudit(first.id,[],audit,'mail');s.saveAudit(second.id,[],audit,'mail');
  assert.equal(canSend(s.lead(second.id),true),true);
  s.setStatus(first.id,'sending');
  assert.ok(s.lead(first.id).send_attempt_at);
  assert.equal(s.lead(first.id).send_email,input.email);
  assert.equal(canSend(s.lead(second.id),true),false);
  s.setStatus(first.id,'sent');const sentAt=s.lead(first.id).sent_at;assert.ok(sentAt);
  s.suppress(first.id,'replied');
  assert.equal(s.lead(first.id).sent_at,sentAt);
  s.saveAudit(second.id,[],audit,'new mail');assert.equal(canSend(s.lead(second.id),true),false);
  assert.equal(s.leads().find(l=>l.id===second.id).previously_contacted,true);
 }finally{s.close();}
 const reopened=openStore(dir);try {assert.equal(reopened.leads().every(l=>l.previously_contacted),true);}finally{reopened.close();}
});
