import nodemailer from "nodemailer";
import { emailHtml } from "./email.mjs";
import MailComposer from "nodemailer/lib/mail-composer/index.js";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
export function canSend(lead, manual = false) {
  return Boolean(
    lead &&
    lead.status === "ready" &&
    !lead.previously_contacted &&
    lead.canAudit &&
    /^[^\s@<>;,]+@[^\s@<>;,]+\.[^\s@<>;,]+$/.test(lead.email || "") &&
    lead.email.length <= 254 &&
    lead.draft &&
    (lead.audit?.confidence === "high" || (manual && lead.audit?.manualApprovedAt && lead.audit.manualApprovedDraft === lead.draft && lead.audit.manualApprovedEmail === lead.email)) &&
    lead.audit.verifiedAt &&
    lead.audit.offer !== "none" &&
    lead.audit.findings.some((f) => f.severity >= 2) &&
    lead.share_token &&
    new Date(lead.share_expires) > new Date(),
  );
}
/** @param {{email: string, draft: string} | null} manual */
export async function deliver(store, id, manual = null) {
  if (
    !manual && (process.env.PROSPECTING_SEND_ENABLED !== "true" ||
    !store.settings().autoSend ||
    store.settings().paused)
  )
    throw Error("Wysyłka automatyczna jest wyłączona.");
  if (!process.env.SMTP_HOST || !process.env.SMTP_FROM)
    throw Error("Brak konfiguracji poczty.");
  const port = Number(process.env.SMTP_PORT || 465);
  if (!Number.isInteger(port) || port < 1 || port > 65535)
    throw Error("Nieprawidłowy port SMTP.");
  const lead = store.transaction(() => {
    const row = store.lead(id);
    if (manual && (row?.email !== manual.email || row?.draft !== manual.draft))
      throw Error("Adres lub treść wiadomości zmieniły się. Odśwież podgląd przed wysyłką.");
    if (!canSend(row, Boolean(manual)))
      throw Error(
        "Kontakt nie spełnia warunków wysyłki (własna strona, e-mail, raport, pewność lub status).",
      );
    store.setStatus(id, "sending");
    return row;
  });
  try {
    const transport = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: port === 465,
      requireTLS: port !== 465,
      disableFileAccess: true,
      disableUrlAccess: true,
      connectionTimeout: 10000,
      socketTimeout: 20000,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
    });
    try {
      const message = {
        from: process.env.SMTP_FROM,
        to: lead.email,
        subject: `${lead.name} — propozycje usprawnień od MindVortex`,
        text: lead.draft,
        html: emailHtml(lead),
        messageId: `<prospecting-${id}@mindvortex.pro>`,
        headers: { "Auto-Submitted": "auto-generated" },
        date: new Date(),
        disableFileAccess: true,
        disableUrlAccess: true,
      };
      const raw = await new MailComposer(message).compile().build();
      const folder = join(store.directory,"assets",id);
      await mkdir(folder,{recursive:true,mode:0o700});
      await writeFile(join(folder,"sent.eml"),raw,{mode:0o600});
      store.runtime("sent-copy:"+id,JSON.stringify({status:"pending",messageId:message.messageId,date:message.date.toISOString(),nextAttempt:0}));
      const result = await transport.sendMail({...message,raw});
      if (!result.accepted?.length)
        throw Error("Brak potwierdzenia przyjęcia wiadomości.");
      store.setStatus(id, "sent");
      store.event(`Serwer pocztowy przyjął wiadomość do ${lead.name}.`);
    } finally {
      transport.close();
    }
  } catch {
    store.setStatus(id, "uncertain");
    throw Error(
      "Wynik wysyłki wymaga sprawdzenia w poczcie. Automatyczne ponowienie zablokowane.",
    );
  }
}
