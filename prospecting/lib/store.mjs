import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { resolve, join } from "node:path";
import { randomUUID, randomBytes } from "node:crypto";
import { publicUrl, isProfileUrl } from "./network.mjs";

export const categories = {
  beauty: "Uroda i fryzjerstwo",
  health: "Zdrowie i fizjoterapia",
  food: "Restauracje i kawiarnie",
  services: "Usługi lokalne",
  shops: "Sklepy",
};
export const areas = ["Białołęka", "Targówek", "Bielany", "Warszawa"];
export const defaults = {
  paused: true,
  autoDiscover: false,
  autoSend: false,
  area: "Białołęka",
  category: "beauty",
  dailyLimit: 5,
  dailyHour: 9,
  portfolioUrl: "https://mindvortex.pro/pl",
  instagramUrl: "https://www.instagram.com/mindvortex.pro/",
  tiktokUrl: "https://www.tiktok.com/@mindvortex.pro",
};
export const dataDirectory = () =>
  resolve(
    /* turbopackIgnore: true */ process.env.PROSPECTING_DATA_DIR ||
      ".prospecting-data",
  );
const now = () => new Date().toISOString();
export const validEmail = (email) => typeof email === "string" && email.length <= 254 &&
  /^[^\s@<>;,]+@[^\s@<>;,]+\.[^\s@<>;,]+$/.test(email);
export const warsawDay = (date = new Date()) =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Warsaw",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
const decode = (row) =>
  row
    ? {
        ...row,
        canAudit: Boolean(row.website && !isProfileUrl(row.website) && validEmail(row.email)),
        screens: JSON.parse(row.screens),
        audit: row.audit ? JSON.parse(row.audit) : null,
      }
    : undefined;
export function openStore(directory = dataDirectory()) {
  mkdirSync(directory, { recursive: true, mode: 0o700 });
  const db = new DatabaseSync(join(directory, "prospecting.sqlite"), {
    timeout: 5000,
  });
  db.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;
    CREATE TABLE IF NOT EXISTS settings (id INTEGER PRIMARY KEY CHECK(id=1), value TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS leads (id TEXT PRIMARY KEY,dedupe TEXT UNIQUE NOT NULL,name TEXT NOT NULL,website TEXT NOT NULL,category TEXT NOT NULL,area TEXT NOT NULL,source TEXT NOT NULL,address TEXT NOT NULL DEFAULT '',email TEXT NOT NULL DEFAULT '',status TEXT NOT NULL DEFAULT 'new',screens TEXT NOT NULL DEFAULT '[]',audit TEXT,draft TEXT NOT NULL DEFAULT '',share_token TEXT,share_expires TEXT,consent TEXT NOT NULL DEFAULT '',consent_email TEXT NOT NULL DEFAULT '',consent_at TEXT,created_at TEXT NOT NULL,updated_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS jobs (id TEXT PRIMARY KEY,kind TEXT NOT NULL,lead_id TEXT REFERENCES leads(id),payload TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'queued',created_at TEXT NOT NULL,started_at TEXT,finished_at TEXT,error TEXT NOT NULL DEFAULT '');
    CREATE UNIQUE INDEX IF NOT EXISTS pending_job ON jobs(kind,COALESCE(lead_id,'')) WHERE status IN ('queued','running');
    CREATE TABLE IF NOT EXISTS events (id INTEGER PRIMARY KEY,at TEXT NOT NULL,message TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS runtime (key TEXT PRIMARY KEY,value TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS usage (id TEXT PRIMARY KEY,day TEXT NOT NULL,input_tokens INTEGER NOT NULL DEFAULT 0,output_tokens INTEGER NOT NULL DEFAULT 0);
    CREATE TABLE IF NOT EXISTS sessions (hash TEXT PRIMARY KEY,expires TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS login_attempts (at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS audit_history (id TEXT PRIMARY KEY,run_id TEXT NOT NULL,lead_id TEXT NOT NULL,phase TEXT NOT NULL,created_at TEXT NOT NULL,lead_json TEXT NOT NULL,audit_json TEXT NOT NULL,screens_json TEXT NOT NULL,UNIQUE(run_id,phase));
  `);
  if (!db.prepare("PRAGMA table_info(leads)").all().some((column) => column.name === "phone"))
    db.exec("ALTER TABLE leads ADD COLUMN phone TEXT NOT NULL DEFAULT ''");
  db.prepare("INSERT OR IGNORE INTO settings VALUES(1,?)").run(
    JSON.stringify(defaults),
  );
  const event = (message) =>
    db
      .prepare("INSERT INTO events(at,message) VALUES(?,?)")
      .run(now(), message);
  const settings = () => ({ ...defaults,
    ...JSON.parse(db.prepare("SELECT value FROM settings WHERE id=1").get().value) });
  const lead = (id) =>
    decode(db.prepare("SELECT * FROM leads WHERE id=?").get(id));
  const transaction = (fn) => {
    db.exec("BEGIN IMMEDIATE");
    try {
      const result = fn();
      db.exec("COMMIT");
      return result;
    } catch (error) {
      db.exec("ROLLBACK");
      throw error;
    }
  };
  return {
    db,
    directory,
    close: () => db.close(),
    settings,
    event,
    lead,
    transaction,
    recordAudit(runId, row, phase, audit, screens) {
      if (!["initial", "verified", "reviewed"].includes(phase)) throw Error("Nieznany etap audytu.");
      db.prepare("INSERT INTO audit_history VALUES(?,?,?,?,?,?,?,?)").run(
        randomUUID(),runId,row.id,phase,now(),JSON.stringify({id:row.id,name:row.name,website:row.website}),JSON.stringify(audit),JSON.stringify(screens));
    },
    auditHistory: () => db.prepare("SELECT id,run_id,lead_id,phase,created_at FROM audit_history ORDER BY created_at DESC").all(),
    auditRecord(id) {
      const row=db.prepare("SELECT * FROM audit_history WHERE id=?").get(id);
      return row ? {...row,phase:String(row.phase),lead:JSON.parse(row.lead_json),audit:JSON.parse(row.audit_json),screens:JSON.parse(row.screens_json)} : undefined;
    },
    leads: () =>
      db
        .prepare("SELECT * FROM leads ORDER BY created_at DESC")
        .all()
        .filter((row) => row.website && !isProfileUrl(row.website) && validEmail(row.email))
        .slice(0, 1000)
        .map(decode),
    jobs: () =>
      db.prepare("SELECT * FROM jobs ORDER BY created_at DESC LIMIT 30").all(),
    events: () =>
      db.prepare("SELECT * FROM events ORDER BY id DESC LIMIT 30").all(),
    getRuntime: (key) =>
      db.prepare("SELECT value FROM runtime WHERE key=?").get(key)?.value,
    runtime: (key, value) =>
      db
        .prepare(
          "INSERT INTO runtime VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value",
        )
        .run(key, value),
    saveSettings(value) {
      const next = { ...settings(), ...value };
      if (
        !areas.includes(next.area) ||
        !Object.hasOwn(categories, next.category) ||
        !Number.isInteger(next.dailyLimit) ||
        next.dailyLimit < 1 ||
        next.dailyLimit > 20 ||
        !Number.isInteger(next.dailyHour) ||
        next.dailyHour < 0 ||
        next.dailyHour > 23
      )
        throw Error("Nieprawidłowe ustawienia. Limit: 1–20 audytów na dobę.");
      for (const key of ["paused", "autoDiscover", "autoSend"])
        if (typeof next[key] !== "boolean")
          throw Error("Nieprawidłowe ustawienia.");
      next.portfolioUrl = publicUrl(next.portfolioUrl).href;
      for (const [key, domain] of [["instagramUrl", "instagram.com"], ["tiktokUrl", "tiktok.com"]]) {
        const value = String(next[key] || "").trim();
        if (!value) { next[key] = ""; continue; }
        const url = publicUrl(value);
        if (url.hostname !== domain && url.hostname !== `www.${domain}`)
          throw Error(`Podaj adres profilu w ${domain}.`);
        next[key] = url.href;
      }
      db.prepare("UPDATE settings SET value=? WHERE id=1").run(
        JSON.stringify(next),
      );
      event("Zapisano ustawienia automatyzacji.");
      return next;
    },
    addLead(input) {
      const name = String(input.name || "")
        .trim()
        .slice(0, 180);
      if (
        !name ||
        !areas.includes(input.area) ||
        !Object.hasOwn(categories, input.category)
      )
        throw Error("Podaj nazwę, obszar i branżę firmy.");
      const website = input.website ? publicUrl(input.website).href : "";
      const email = String(input.email || "").trim();
      if (!website || isProfileUrl(website) || !validEmail(email))
        throw Error("Firma musi mieć własną stronę internetową i poprawny e-mail.");
      const dedupe = website
        ? new URL(website).hostname.replace(/^www\./, "") +
          (isProfileUrl(website)
            ? new URL(website).pathname.replace(/\/$/, "") +
              new URL(website).search
            : "")
        : `${name.toLocaleLowerCase("pl")}:${input.area}`;
      const existing = db
        .prepare("SELECT id FROM leads WHERE dedupe=?")
        .get(dedupe);
      if (existing) {
        db.prepare("UPDATE leads SET email=CASE WHEN email='' THEN ? ELSE email END,phone=CASE WHEN phone='' THEN ? ELSE phone END WHERE id=?")
          .run(String(input.email || "").trim().slice(0, 254), String(input.phone || "").trim().slice(0, 80), existing.id);
        return lead(existing.id);
      }
      const id = randomUUID();
      db.prepare(
        "INSERT INTO leads(id,dedupe,name,website,category,area,source,address,email,phone,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)",
      ).run(
        id,
        dedupe,
        name,
        website,
        input.category,
        input.area,
        String(input.source || "manual").slice(0, 400),
        String(input.address || "").slice(0, 300),
        String(input.email || "").trim().slice(0, 254),
        String(input.phone || "").trim().slice(0, 80),
        now(),
        now(),
      );
      event(`Dodano firmę: ${name}.`);
      return lead(id);
    },
    enqueue(kind, id = null, payload = {}) {
      if (!["discover", "audit", "send"].includes(kind))
        throw Error("Nieznane zadanie.");
      if (kind !== "discover") {
        const row = lead(id);
        if (
          !row ||
          ["suppressed", "sent", "sending", "uncertain", "replied"].includes(
            row.status,
          )
        )
          throw Error("Ta firma jest wyłączona z automatyzacji.");
        if (kind === "audit" && !row.canAudit)
          throw Error(
            "Audyt wymaga własnej strony firmy oraz poprawnego e-maila.",
          );
      }
      const jobId = randomUUID();
      if (kind === "audit" && payload.manual === true)
        db.prepare("UPDATE jobs SET payload=json_set(payload,'$.manual',json('true')) WHERE kind='audit' AND lead_id=? AND status='queued'").run(id);
      const result = db
        .prepare(
          "INSERT OR IGNORE INTO jobs(id,kind,lead_id,payload,created_at) VALUES(?,?,?,?,?)",
        )
        .run(jobId, kind, id, JSON.stringify(payload), now());
      if (result.changes)
        event(
          kind === "discover"
            ? "Zlecono wyszukanie firm."
            : `Zlecono zadanie: ${kind}.`,
        );
      return jobId;
    },
    claim(kinds = ["discover", "audit", "send"], manualOnly = false, auditBudget = true) {
      return transaction(() => {
        const row = db
          .prepare(
            `SELECT * FROM jobs WHERE status='queued' AND kind IN (${kinds.map(() => "?").join(",")}) ${manualOnly ? "AND kind='audit' AND json_extract(payload,'$.manual')=1" : ""} ${auditBudget ? "" : "AND (kind!='audit' OR json_extract(payload,'$.manual')=1)"} ORDER BY created_at LIMIT 1`,
          )
          .get(...kinds);
        if (!row) return undefined;
        db.prepare(
          "UPDATE jobs SET status='running',started_at=? WHERE id=?",
        ).run(now(), row.id);
        return { ...row, payload: JSON.parse(row.payload) };
      });
    },
    finish(id, error = "") {
      db.prepare(
        "UPDATE jobs SET status=?,finished_at=?,error=? WHERE id=?",
      ).run(error ? "failed" : "done", now(), error.slice(0, 500), id);
      if (error) event(error.slice(0, 500));
    },
    recover() {
      const cutoff = new Date(Date.now() - 15 * 60_000).toISOString();
      // Manual HTTP delivery has no worker job; a crashed request must never be retried blindly.
      db.prepare("UPDATE leads SET status='uncertain',updated_at=? WHERE status='sending' AND updated_at<?").run(now(), cutoff);
      for (const job of db
        .prepare("SELECT * FROM jobs WHERE status='running' AND started_at<?")
        .all(cutoff)) {
        if (job.kind === "send")
          db.prepare(
            "UPDATE leads SET status='uncertain' WHERE id=? AND status='sending'",
          ).run(job.lead_id);
        else if (job.lead_id)
          db.prepare(
            "UPDATE leads SET status='error' WHERE id=? AND status NOT IN ('suppressed','replied')",
          ).run(job.lead_id);
        db.prepare(
          "UPDATE jobs SET status='failed',finished_at=?,error='Przerwane zadanie. Wymaga sprawdzenia przed ponowieniem.' WHERE id=?",
        ).run(now(), job.id);
      }
    },
    setStatus(id, status) {
      db.prepare(
        "UPDATE leads SET status=?,updated_at=? WHERE id=? AND status NOT IN ('suppressed','replied')",
      ).run(status, now(), id);
    },
    saveAudit(id, screens, audit, draft) {
      const token = randomBytes(24).toString("hex");
      db.prepare(
        "UPDATE leads SET screens=?,audit=?,draft=?,status='ready',share_token=?,share_expires=?,updated_at=? WHERE id=? AND status NOT IN ('suppressed','replied')",
      ).run(
        JSON.stringify(screens),
        JSON.stringify(audit),
        draft,
        token,
        new Date(Date.now() + 30 * 86400_000).toISOString(),
        now(),
        id,
      );
    },
    setDraft: (id, draft) =>
      db
        .prepare("UPDATE leads SET draft=?,updated_at=? WHERE id=?")
        .run(draft, now(), id),
    saveContact(id, email) {
      if (
        !/^[^\s@<>;,]+@[^\s@<>;,]+\.[^\s@<>;,]+$/.test(email) ||
        email.length > 254
      )
        throw Error(
          "Podaj jeden poprawny adres e-mail.",
        );
      if (!lead(id) || ["suppressed", "replied", "sending", "sent", "uncertain"].includes(lead(id).status))
        throw Error("Kontakt wyłączony.");
      db.prepare(
        "UPDATE leads SET email=?,updated_at=? WHERE id=?",
      ).run(email, now(), id);
      event("Zapisano adres e-mail kontaktu.");
    },
    suppress(id, status = "suppressed") {
      if (!["suppressed", "replied"].includes(status))
        throw Error("Nieprawidłowy status.");
      transaction(() => {
        db.prepare(
          "UPDATE leads SET status=?,consent='',consent_email='',share_token=NULL,share_expires=NULL,updated_at=? WHERE id=?",
        ).run(status, now(), id);
        db.prepare(
          "UPDATE jobs SET status='cancelled' WHERE lead_id=? AND status='queued'",
        ).run(id);
      });
      event(
        status === "replied"
          ? "Zapisano odpowiedź; automatyzacja kontaktu zatrzymana."
          : "Wyłączono firmę i unieważniono link do raportu.",
      );
    },
    share: (token) =>
      decode(
        db
          .prepare(
            "SELECT * FROM leads WHERE share_token=? AND share_expires>? AND status IN ('ready','sent','sending','uncertain')",
          )
          .get(token, now()),
      ),
    reserveUsage(id) {
      return transaction(() => {
        const count = db
          .prepare("SELECT count(*) AS n FROM usage WHERE day=?")
          .get(warsawDay()).n;
        const job = db.prepare("SELECT payload FROM jobs WHERE id=? AND kind='audit'").get(id);
        const manual = job && JSON.parse(job.payload).manual === true;
        if (!manual && count >= settings().dailyLimit)
          throw Error("Osiągnięto dzienny limit audytów.");
        db.prepare("INSERT INTO usage(id,day) VALUES(?,?)").run(
          id,
          warsawDay(),
        );
      });
    },
    usage: () =>
      db
        .prepare(
          "SELECT count(*) AS calls,COALESCE(sum(input_tokens),0) AS inputTokens,COALESCE(sum(output_tokens),0) AS outputTokens FROM usage WHERE day=?",
        )
        .get(warsawDay()),
  };
}
