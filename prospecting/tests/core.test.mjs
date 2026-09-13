import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { isPublicIP, publicUrl } from "../lib/network.mjs";
import { isProfileUrl } from "../lib/network.mjs";

test("social profiles remain separate companies and are not audited as websites", () => {
  const s = openStore(mkdtempSync(join(tmpdir(), "mv-profiles-")));
  try {
    const first = s.addLead({
      name: "A",
      website: "https://facebook.com/firm-a",
      category: "beauty",
      area: "Białołęka",
    });
    const second = s.addLead({
      name: "B",
      website: "https://facebook.com/firm-b",
      category: "beauty",
      area: "Białołęka",
    });
    assert.notEqual(first.id, second.id);
    assert.equal(first.canAudit, false);
    assert.throws(() => s.enqueue("audit", first.id));
    assert.equal(isProfileUrl("https://example.com"), false);
  } finally {
    s.close();
  }
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
test("audits require an own website and valid email or phone", () => {
  const s = openStore(mkdtempSync(join(tmpdir(), "mv-contact-")));
  try {
    for (const [i, contact, expected] of [
      [0, {}, false],
      [1, { email: "invalid" }, false],
      [2, { email: "office@example.com" }, true],
      [3, { phone: "+48 500 600 700" }, true],
      [4, { phone: "123" }, false],
    ]) {
      const lead = s.addLead({ name: "Firma", website: `https://firm${i}.example.com`, category: "beauty", area: "Białołęka", ...contact });
      assert.equal(lead.canAudit, expected);
      if (expected) assert.doesNotThrow(() => s.enqueue("audit", lead.id));
      else assert.throws(() => s.enqueue("audit", lead.id));
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
      findings: [],
      summary: "",
      offerReason: "Formularz zapytania.",
    },
    "https://mindvortex.pro/pl",
    "https://mindvortex.pro/prospecting/report/abc",
  );
  assert.match(draft, /mindvortex.pro\/pl/);
  assert.match(draft, /Czy/);
  assert.doesNotMatch(draft, /tracicie klientów|nie macie CRM/);
});
