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
    sendMail: async () => {
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
