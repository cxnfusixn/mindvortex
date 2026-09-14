import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {openStore} from '../lib/store.mjs';
import {approveAudit, sendBlock} from '../lib/approval.mjs';
import {canSend} from '../lib/delivery.mjs';

test('manual review preserves model confidence, records history and binds approval to the current message', () => {
  const dir=mkdtempSync(join(tmpdir(),'mv-approval-')),s=openStore(dir);
  try {
    const {id}=s.addLead({name:'QA',website:'https://example.com',email:'qa@example.com',area:'Białołęka',category:'beauty'});
    const audit={assessable:true,confidence:'medium',offer:'website',summary:'Test',goal:'Test',offerReason:'Test',journey:'Test',verifiedAt:new Date().toISOString(),coverage:[],limitations:[],positives:[1,2].map(()=>({screen:'home.jpg',description:'Czytelna oferta',heuristic:'Spójność'})),findings:[{screen:'home.jpg',severity:2,effort:'S',title:'Tytuł',check:'Test',heuristic:'Spójność',evidence:'Dowód',impact:'Wpływ',recommendation:'Zalecenie',box:{x:0,y:0,width:0.2,height:0.2}}]};
    s.saveAudit(id,[{file:'home.jpg'}],audit,'Przykładowy mail');
    const before=s.lead(id);
    assert.equal(canSend(before,true),false);
    assert.match(sendBlock(before),/zatwierdź/);
    assert.throws(()=>approveAudit(s,id,'old'),/zmieniły/);
    approveAudit(s,id,before.updated_at);
    const approved=s.lead(id);
    assert.equal(approved.audit.confidence,'medium');
    assert.equal(canSend(approved,true),true);
    assert.equal(canSend(approved),false);
    assert.equal(s.auditHistory()[0].phase,'reviewed');
    approveAudit(s,id,approved.updated_at);
    assert.equal(s.auditHistory().length,1);
    s.setDraft(id,'Zmieniony mail');
    assert.equal(canSend(s.lead(id),true),false);
    s.saveAudit(id,[{file:'home.jpg'}],audit,'Nowy audyt');
    assert.equal(canSend(s.lead(id),true),false);
    s.enqueue('audit',id);
    assert.throws(()=>approveAudit(s,id,s.lead(id).updated_at),/zakończenie/);
    s.suppress(id);
    assert.throws(()=>approveAudit(s,id,s.lead(id).updated_at),/aktywny kontakt/);
  } finally {s.close();rmSync(dir,{recursive:true,force:true});}
});
