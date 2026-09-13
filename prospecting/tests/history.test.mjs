import test from "node:test";
import assert from "node:assert/strict";
import {mkdtempSync} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {openStore} from "../lib/store.mjs";
test("initial and verified audits remain retrievable after restart and later runs", () => {
 const dir=mkdtempSync(join(tmpdir(),"mv-history-")); let s=openStore(dir);
 const lead=s.addLead({name:"Firma",website:"https://example.com",email:"a@example.com",category:"beauty",area:"Białołęka"});
 s.recordAudit("run1",lead,"initial",{summary:"First"},[{file:"desktop-1.jpg",image:"data:image/jpeg;base64,AA=="}]);
 s.recordAudit("run1",lead,"verified",{summary:"Checked"},[]);
 s.recordAudit("run2",lead,"initial",{summary:"Later"},[]);
 s.close();s=openStore(dir);
 try {assert.equal(s.auditHistory().length,3);const first=s.auditHistory().find(r=>r.run_id==="run1" && r.phase==="initial");assert.equal(s.auditRecord(first.id).audit.summary,"First");assert.equal(s.auditRecord(first.id).screens[0].image,"data:image/jpeg;base64,AA==");}finally{s.close();}
});
