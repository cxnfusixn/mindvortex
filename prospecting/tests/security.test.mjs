import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { openStore } from "../lib/store.mjs";
import {
  hashPassword,
  login,
  authorized,
  sessionCookie,
  digest,
  sameOrigin,
} from "../lib/auth.mjs";
import { canSend } from "../lib/delivery.mjs";
import { reportHtml } from "../lib/report.mjs";
const makeStore = () =>
  openStore(mkdtempSync(join(tmpdir(), "mv-prospecting-security-")));
test("login rejects bad credentials, creates bounded session and supports revocation", async () => {
  const store = makeStore();
  process.env.PROSPECTING_PASSWORD_HASH = await hashPassword("test-password");
  process.env.PROSPECTING_PUBLIC_URL = "https://mindvortex.pro";
  try {
    await assert.rejects(login(store, "wrong"));
    const token = await login(store, "test-password");
    const req = new Request("https://mindvortex.pro/prospecting/api", {
      headers: { cookie: sessionCookie(token) },
    });
    assert.equal(authorized(store, req), true);
    assert.match(sessionCookie(token), /HttpOnly.*SameSite=Strict.*Secure/);
    assert.equal(
      sameOrigin(
        new Request(req, { headers: { origin: "https://evil.example" } }),
      ),
      false,
    );
    store.db.prepare("DELETE FROM sessions WHERE hash=?").run(digest(token));
    assert.equal(authorized(store, req), false);
    for (let i = 0; i < 8; i++) await assert.rejects(login(store, "wrong"));
    await assert.rejects(login(store, "test-password"), /Odczekaj/);
  } finally {
    store.close();
  }
});
test("daily budget, atomic recovery and share revocation", () => {
  const store = makeStore();
  try {
    store.saveSettings({ dailyLimit: 1 });
    store.reserveUsage("one");
    assert.throws(() => store.reserveUsage("two"), /limit/);
    const lead = store.addLead({
      name: "Example",
      website: "https://example.com",
      area: "Białołęka",
      category: "beauty",
    });
    store.saveAudit(
      lead.id,
      [],
      {
        confidence: "high",
        verifiedAt: new Date().toISOString(),
        offer: "website",
        findings: [{ severity: 2 }],
      },
      "draft",
    );
    const saved = store.lead(lead.id);
    assert.equal(store.share(saved.share_token).id, lead.id);
    assert.equal(canSend(saved), false);
    store.saveContact(
      lead.id,
      "test@example.com",
    );
    assert.equal(canSend(store.lead(lead.id)), true);
    store.enqueue("send", lead.id);
    const job = store.claim();
    store.setStatus(lead.id, "sending");
    store.db
      .prepare("UPDATE jobs SET started_at=? WHERE id=?")
      .run("2000-01-01T00:00:00.000Z", job.id);
    store.recover();
    assert.equal(store.lead(lead.id).status, "uncertain");
    assert.throws(() => store.enqueue("send", lead.id));
    store.suppress(lead.id);
    assert.equal(store.share(saved.share_token), undefined);
    assert.equal(canSend(store.lead(lead.id)), false);
  } finally {
    store.close();
  }
});
test("report escapes business and model-controlled content", () => {
  const html = reportHtml(
    {
      name: "<script>alert(1)</script>",
      screens: [],
      audit: {
        summary: "<img onerror=alert(1)>",
        findings: [],
        positives: [],
        limitations: [],
        coverage: [],
      },
    },
    () => "",
    "https://mindvortex.pro/pl",
  );
  assert.ok(!html.includes("<script>"));
  assert.ok(html.includes("&lt;script&gt;"));
  assert.ok(!html.includes("<img onerror"));
});
