import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { isPublicIP, publicUrl } from "../lib/network.mjs";
import { isProfileUrl } from "../lib/network.mjs";
import { discover } from "../lib/discover.mjs";
test("existing platform profiles disappear from the list and discovery skips new profiles", async () => {
  const s = openStore(mkdtempSync(join(tmpdir(), "mv-profile-list-")));
  const originalFetch = globalThis.fetch;
  try {
    const old = s.addLead({ name: "Old Booksy", website: "https://old.example.com", email: "old@example.com", category: "beauty", area: "Białołęka" });
    s.db.prepare("UPDATE leads SET website=? WHERE id=?").run("https://booksy.com/pl-pl/old",old.id);
    const missing = s.addLead({ name: "Old without website", website: "https://missing.example.com", email: "a@example.com", category: "beauty", area: "Białołęka" });
    s.db.prepare("UPDATE leads SET website='' WHERE id=?").run(missing.id);
    globalThis.fetch = async () => ({ ok: true, json: async () => ({ elements: [
      { type: "node", id: 1, tags: { name: "New Booksy", website: "https://booksy.com/pl-pl/new" } },
      { type: "node", id: 2, tags: { name: "Own website", website: "https://salon.example.com", email: "office@example.com" } },
      { type: "node", id: 3, tags: { name: "Without website", email: "office@example.com" } },
      { type: "node", id: 5, tags: { name: "Phone only", website: "https://phone.example.com", phone: "+48 500 600 700" } },
      { type: "node", id: 4, tags: { name: "Invalid website", website: "http://localhost" } },
    ] }) });
    await discover(s, { area: "Białołęka", category: "beauty" });
    assert.deepEqual(s.leads().map((lead) => lead.name), ["Own website"]);
    assert.equal(s.db.prepare("SELECT count(*) AS n FROM leads").get().n, 3);
    assert.equal(s.lead(old.id).name, "Old Booksy");
  } finally {
    globalThis.fetch = originalFetch;
    s.close();
  }
});
test("Booksy domains are excluded even with contact and a trailing DNS dot", () => {
  const s = openStore(mkdtempSync(join(tmpdir(), "mv-booksy-")));
  try {
    for (const website of ["https://booksy.com/pl-pl/123_salon", "https://www.booksy.com/pl-pl/123_salon", "https://booksy.com./pl-pl/123_salon", "https://booksy.pl/salon"]) {
      assert.equal(isProfileUrl(website), true);
      assert.throws(() => s.addLead({ name: "Salon", website, email: "salon@example.com", category: "beauty", area: "Białołęka" }));
    }
    assert.equal(isProfileUrl("https://salon-booksy.example.com"), false);
  } finally { s.close(); }
});

import { openStore } from "../lib/store.mjs";
import { tick } from "../worker.mjs";
test("worker rejects legacy queued audits without contact before capture or paid analysis", async () => {
  const s = openStore(mkdtempSync(join(tmpdir(), "mv-legacy-contact-")));
  const previousKey = process.env.PROSPECTING_OPENAI_API_KEY;
  try {
    const lead = s.addLead({ name: "Firma", website: "https://example.com", email: "office@example.com", area: "Białołęka", category: "beauty" });
    s.enqueue("audit", lead.id);
    s.db.prepare("UPDATE leads SET email='' WHERE id=?").run(lead.id);
    s.saveSettings({ paused: false });
    process.env.PROSPECTING_OPENAI_API_KEY = "test-only";
    await tick(s);
    assert.equal(s.jobs()[0].status, "failed");
    assert.equal(s.usage().calls, 0);
  } finally {
    if (previousKey === undefined) delete process.env.PROSPECTING_OPENAI_API_KEY;
    else process.env.PROSPECTING_OPENAI_API_KEY = previousKey;
    s.close();
  }
});
test("audits require an own website and valid email", () => {
  const s = openStore(mkdtempSync(join(tmpdir(), "mv-contact-")));
  try {
    for (const [i, contact, expected] of [
      [0, {}, false],
      [1, { email: "invalid" }, false],
      [2, { email: "office@example.com" }, true],
      [3, { phone: "+48 500 600 700" }, false],
      [4, { phone: "123" }, false],
    ]) {
      const input = { name: "Firma", website: `https://firm${i}.example.com`, category: "beauty", area: "Białołęka", ...contact };
      if (expected) assert.equal(s.addLead(input).canAudit, true);
      else assert.throws(() => s.addLead(input));
    }
  } finally { s.close(); }
});
import { validateAudit, draftMessage } from "../lib/audit.mjs";
import { validateEvidenceClaims } from "../lib/audit.mjs";

test("screenshot audits cannot assert link behavior or failed map behavior", () => {
  for (const title of [
    "Dane kontaktowe nie są aktywne (brak linkowania tel:)",
    "Niewyświetlająca się mapa z lokalizacją",
    "Mapa nie działa",
  ])
    assert.throws(() =>
      validateEvidenceClaims({
        findings: [{ title, evidence: "Na zrzucie jest tekst." }],
      }),
    );
  assert.doesNotThrow(() =>
    validateEvidenceClaims({
      findings: [
        {
          title: "Mało czytelny tekst",
          evidence: "Szary opis na czarnym tle.",
        },
      ],
    }),
  );
});

test("rejects local, mapped and reserved destinations", () => {
  for (const ip of [
    "127.0.0.1",
    "10.1.2.3",
    "169.254.169.254",
    "192.168.1.1",
    "100.64.0.1",
    "0.0.0.0",
    "::1",
    "::ffff:127.0.0.1",
    "fe80::1",
    "fc00::1",
    "2001:db8::1",
  ])
    assert.equal(isPublicIP(ip), false, ip);
  assert.equal(isPublicIP("1.1.1.1"), true);
  for (const url of [
    "file:///etc/passwd",
    "http://localhost",
    "https://u:p@example.com",
    "http://2130706433",
    "http://example.com:3020",
  ])
    assert.throws(() => publicUrl(url));
});

test("deduplicates domains, claims jobs once and persists suppression", () => {
  const dir = mkdtempSync(join(tmpdir(), "mv-prospecting-"));
  const s = openStore(dir);
  const one = s.addLead({
    name: "Firma",
    email: "office@example.com",
    website: "https://www.example.com/",
    category: "beauty",
    area: "Białołęka",
    source: "manual",
  });
  const two = s.addLead({
    name: "Oddział",
    email: "office@example.com",
    website: "https://example.com/oferta",
    category: "beauty",
    area: "Białołęka",
    source: "manual",
  });
  assert.equal(one.id, two.id);
  assert.equal(s.leads().length, 1);
  s.enqueue("audit", one.id);
  s.enqueue("audit", one.id);
  const job = s.claim();
  assert.equal(job.kind, "audit");
  assert.equal(s.claim(), undefined);
  s.suppress(one.id);
  assert.throws(() => s.enqueue("audit", one.id));
  s.close();
  const restored = openStore(dir);
  assert.equal(restored.leads()[0].status, "suppressed");
  restored.close();
});

test("rejects unsupported evidence instead of producing an accusation", () => {
  assert.throws(() =>
    validateAudit({ findings: [{ screen: "invented.png", severity: 4 }] }, [
      { file: "home.png" },
    ]),
  );
});

test("CRM proposal is a question, and links use the configured portfolio", () => {
  const draft = draftMessage(
    { name: "Przykład" },
    {
      offer: "crm",
      findings: [{evidence:"Jasne napisy na białym tle.",impact:"Odczytanie oferty wymaga więcej uwagi. Ze zrzutu nie oceniamy klikalności.",recommendation:"INTERNAL_IMPLEMENTATION_ONLY"}],
      summary: "",
      offerReason: "Formularz zapytania.",
    },
    "https://mindvortex.pro/pl",
    "https://mindvortex.pro/prospecting/report/abc",
    { instagramUrl: "https://www.instagram.com/mindvortex.pro/", tiktokUrl: "https://www.tiktok.com/@test-profile" },
  );
  assert.match(draft, /mindvortex.pro\/pl/);
  assert.match(draft, /Czy/);
  assert.match(draft, /Instagram: https:\/\/www.instagram.com\/mindvortex.pro\//);
  assert.match(draft, /TikTok: https:\/\/www.tiktok.com\/@test-profile/);
  assert.doesNotMatch(draft, /z perspektywy klienta poznającego ofertę|Propozycja:/);
  assert.doesNotMatch(draft, /tracicie klientów|nie macie CRM/);
  assert.doesNotMatch(draft, /INTERNAL_IMPLEMENTATION_ONLY/);
  assert.doesNotMatch(draft, /prospecting\/report|kolejnych wiadomości|odpowiedź „nie”/);
  assert.doesNotMatch(draft, /zrzut|klikalności/);
  assert.match(draft, /Odczytanie oferty wymaga więcej uwagi/);
});

test('paused automation executes only explicitly requested audits and preserves other queues', async () => {
  const s=openStore(mkdtempSync(join(tmpdir(),'mv-manual-')));
  const key=process.env.PROSPECTING_OPENAI_API_KEY;
  try {
    const a=s.addLead({name:'Manual',website:'https://manual.example.com',email:'a@example.com',area:'Białołęka',category:'beauty'});
    const b=s.addLead({name:'Auto',website:'https://auto.example.com',email:'b@example.com',area:'Białołęka',category:'beauty'});
    s.enqueue('audit',a.id);s.enqueue('audit',a.id,{manual:true});s.enqueue('audit',b.id);s.enqueue('discover');s.enqueue('send',b.id);
    // Reject before capture; reaching this validation proves that the manual job was consumed.
    s.db.prepare("UPDATE leads SET email='' WHERE id=?").run(a.id);
    process.env.PROSPECTING_OPENAI_API_KEY='test-only';
    await tick(s);
    assert.equal(s.jobs().find(j=>j.lead_id===a.id).status,'failed');
    assert.equal(s.jobs().filter(j=>j.status==='queued').length,3);
    assert.equal(s.settings().paused,true);assert.equal(s.usage().calls,0);
    await tick(s);assert.equal(s.jobs().filter(j=>j.status==='queued').length,3);
  } finally {if(key===undefined)delete process.env.PROSPECTING_OPENAI_API_KEY;else process.env.PROSPECTING_OPENAI_API_KEY=key;s.close();}
});
