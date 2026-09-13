import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { DatabaseSync } from "node:sqlite";
import { join } from "node:path";
import { openStore } from "../lib/store.mjs";
import {
  hashPassword,
  login,
  authorized,
  sessionCookie,
  digest,
  sameOrigin,
  loginSource,
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
    const otherToken = await login(store, "test-password", "198.51.100.2");
    assert.match(otherToken, /^[a-f0-9]{64}$/);
  } finally {
    store.close();
  }
});
test("login uses only an explicitly trusted proxy address", () => {
  const oldTrust = process.env.PROSPECTING_TRUST_PROXY, oldEnv = process.env.NODE_ENV;
  try {
    process.env.NODE_ENV = "production";
    delete process.env.PROSPECTING_TRUST_PROXY;
    const req = new Request("https://example.test", {headers:{"x-real-ip":"198.51.100.1", "x-forwarded-for":"forged"}});
    assert.throws(() => loginSource(req), /proxy/);
    process.env.PROSPECTING_TRUST_PROXY = "true";
    assert.equal(loginSource(req), "198.51.100.1");
    assert.throws(() => loginSource(new Request("https://example.test", {headers:{"x-real-ip":"1.2.3.4,5.6.7.8"}})));
  } finally {
    if (oldTrust === undefined) delete process.env.PROSPECTING_TRUST_PROXY; else process.env.PROSPECTING_TRUST_PROXY = oldTrust;
    if (oldEnv === undefined) delete process.env.NODE_ENV; else process.env.NODE_ENV = oldEnv;
  }
});
test("legacy login attempts migrate without locking out new sources", async () => {
  const directory = mkdtempSync(join(tmpdir(), "mv-auth-migration-"));
  const db = new DatabaseSync(join(directory,"prospecting.sqlite"));
  db.exec("CREATE TABLE login_attempts(at TEXT NOT NULL)");
  for (let i=0;i<10;i++) db.prepare("INSERT INTO login_attempts VALUES(?)").run(new Date().toISOString());
  db.close();
  const store = openStore(directory);
  try {
    process.env.PROSPECTING_PASSWORD_HASH = await hashPassword("migration-fixture");
    assert.match(await login(store,"migration-fixture","203.0.113.1"), /^[a-f0-9]{64}$/);
  } finally {store.close();}
});
test("daily budget, atomic recovery and share revocation", () => {
  const store = makeStore();
  try {
    store.saveSettings({ dailyLimit: 1 });
    store.reserveUsage("one");
    assert.throws(() => store.reserveUsage("two"), /limit/);
    const lead = store.addLead({
      name: "Example",
      email: "test@example.com",
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
    assert.equal(canSend(saved), true);
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
test("client diagnosis hides implementation advice while internal audit retains it", () => {
  const lead={name:"Firma",screens:[],audit:{summary:"Diagnoza",offer:"website",findings:[{title:"Problem",evidence:"Obserwacja",impact:"Trudniejszy odbiór",recommendation:"INTERNAL_FIX_ONLY",effort:"S"}],positives:[],limitations:[],coverage:[],opportunities:["INTERNAL_IDEA_ONLY"]}};
  const client=reportHtml(lead,()=>"","https://mindvortex.pro/pl");
  const internal=reportHtml(lead,()=>"","https://mindvortex.pro/pl",true);
  assert.doesNotMatch(client,/INTERNAL_FIX_ONLY|INTERNAL_IDEA_ONLY/);
  assert.match(client,/Trudniejszy odbiór/);
  assert.match(internal,/INTERNAL_FIX_ONLY/);
});
