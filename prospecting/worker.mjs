import { setTimeout as delay } from "node:timers/promises";
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { openStore, warsawDay } from "./lib/store.mjs";
import { discover } from "./lib/discover.mjs";
import { capture } from "./lib/capture.mjs";
import { auditScreens, draftMessage } from "./lib/audit.mjs";
import { reportHtml, reportMarkdown } from "./lib/report.mjs";
import { canSend, deliver } from "./lib/delivery.mjs";
import { publicOrigin } from "./lib/auth.mjs";

export async function tick(store) {
  store.runtime("heartbeat", new Date().toISOString());
  store.recover();
  const settings = store.settings();
  if (settings.paused) return;
  const day = warsawDay(),
    hour = Number(
      new Intl.DateTimeFormat("en-GB", {
        timeZone: "Europe/Warsaw",
        hour: "2-digit",
        hourCycle: "h23",
      }).format(new Date()),
    );
  if (
    settings.autoDiscover &&
    hour >= settings.dailyHour &&
    store.getRuntime("discoveryDay") !== day
  )
    store.transaction(() => {
      if (store.getRuntime("discoveryDay") === day) return;
      store.enqueue("discover", null, {
        area: settings.area,
        category: settings.category,
      });
      store.runtime("discoveryDay", day);
    });
  const hasBudget = store.usage().calls < settings.dailyLimit;
  if (process.env.PROSPECTING_OPENAI_API_KEY && hasBudget)
    for (const lead of store
      .leads()
      .filter((l) => l.status === "new" && l.canAudit)
      .slice(0, settings.dailyLimit))
      store.enqueue("audit", lead.id);
  if (settings.autoSend && process.env.PROSPECTING_SEND_ENABLED === "true")
    for (const lead of store.leads().filter(canSend))
      store.enqueue("send", lead.id);
  const kinds = [
    "discover",
    ...(hasBudget && process.env.PROSPECTING_OPENAI_API_KEY ? ["audit"] : []),
    ...(settings.autoSend && process.env.PROSPECTING_SEND_ENABLED === "true"
      ? ["send"]
      : []),
  ];
  const job = store.claim(kinds);
  if (!job) return;
  try {
    if (job.kind === "discover") await discover(store, job.payload);
    else if (job.kind === "send") await deliver(store, job.lead_id);
    else {
      const lead = store.lead(job.lead_id);
      if (
        !lead || !lead.canAudit ||
        ["suppressed", "replied", "sent", "uncertain"].includes(lead.status)
      )
        throw Error("Firma wyłączona z analizy.");
      store.setStatus(lead.id, "auditing");
      const evidence = await capture(lead, store.directory);
      if (
        store.settings().paused ||
        ["suppressed", "replied"].includes(store.lead(lead.id).status)
      )
        throw Error("Zadanie wstrzymane przed płatną analizą.");
      const audit = await auditScreens(store, job, lead, evidence);
      store.saveAudit(lead.id, evidence.screens, audit, "");
      const saved = store.lead(lead.id);
      if (saved.status === "ready") {
        const draft = draftMessage(
          saved,
          audit,
          settings.portfolioUrl,
          `${publicOrigin()}/prospecting/report/${saved.share_token}`,
        );
        store.setDraft(lead.id, draft);
        const embedded = {};
        for (const screen of evidence.screens)
          embedded[screen.file] =
            "data:image/jpeg;base64," +
            (
              await readFile(
                join(store.directory, "assets", lead.id, screen.file),
              )
            ).toString("base64");
        await writeFile(
          join(store.directory, "assets", lead.id, "report.html"),
          reportHtml(
            saved,
            (screen) => embedded[screen.file],
            settings.portfolioUrl,
          ),
        );
        await writeFile(
          join(store.directory, "assets", lead.id, "audit.json"),
          JSON.stringify(audit, null, 2),
        );
        await writeFile(
          join(store.directory, "assets", lead.id, "report.md"),
          reportMarkdown(saved),
        );
        store.event(`Gotowy audyt i propozycja: ${lead.name}.`);
      }
    }
    store.finish(job.id);
  } catch (error) {
    if (job.kind === "audit" && job.lead_id)
      store.setStatus(job.lead_id, "error");
    // Errors from providers are sanitized by adapters; never persist response bodies or keys.
    const message = error instanceof Error ? error.message : "Błąd zadania.";
    store.finish(
      job.id,
      message.includes("api_key")
        ? "Błąd konfiguracji integracji."
        : message.slice(0, 400),
    );
  }
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const store = openStore();
  let stopped = false;
  const heartbeat = setInterval(
    () => store.runtime("heartbeat", new Date().toISOString()),
    15000,
  );
  process.on("SIGTERM", () => {
    stopped = true;
  });
  process.on("SIGINT", () => {
    stopped = true;
  });
  try {
    do {
      await tick(store);
      if (process.argv.includes("--once")) break;
      await delay(5000);
    } while (!stopped);
  } finally {
    clearInterval(heartbeat);
    store.close();
  }
}
