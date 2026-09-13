import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import nodemailer from "nodemailer";
import { openStore } from "../lib/store.mjs";
import { deliver } from "../lib/delivery.mjs";
test("SMTP is never repeated after an ambiguous result and stays gated by consent", async () => {
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
    await assert.rejects(deliver(s, lead.id));
    assert.equal(calls, 0);
    s.saveConsent(
      lead.id,
      "test@example.com",
      "Zgoda testowa na e-mail handlowy, formularz, 2026-09-13.",
    );
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
