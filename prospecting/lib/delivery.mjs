import nodemailer from "nodemailer";
export function canSend(lead) {
  return Boolean(
    lead &&
    lead.status === "ready" &&
    lead.consent.length >= 12 &&
    lead.consent_at &&
    lead.email === lead.consent_email &&
    lead.email &&
    lead.draft &&
    lead.audit?.confidence === "high" &&
    lead.audit.verifiedAt &&
    lead.audit.offer !== "none" &&
    lead.audit.findings.some((f) => f.severity >= 2) &&
    lead.share_token &&
    new Date(lead.share_expires) > new Date(),
  );
}
export async function deliver(store, id) {
  if (
    process.env.PROSPECTING_SEND_ENABLED !== "true" ||
    !store.settings().autoSend ||
    store.settings().paused
  )
    throw Error("Wysyłka automatyczna jest wyłączona.");
  if (!process.env.SMTP_HOST || !process.env.SMTP_FROM)
    throw Error("Brak konfiguracji poczty.");
  const lead = store.transaction(() => {
    const row = store.lead(id);
    if (!canSend(row))
      throw Error(
        "Kontakt nie spełnia warunków wysyłki (zgoda, raport, pewność lub status).",
      );
    store.setStatus(id, "sending");
    return row;
  });
  try {
    const transport = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 465),
      secure: Number(process.env.SMTP_PORT || 465) === 465,
      connectionTimeout: 10000,
      socketTimeout: 20000,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
    });
    try {
      const result = await transport.sendMail({
        from: process.env.SMTP_FROM,
        to: lead.email,
        subject: `${lead.name} — propozycje usprawnień od MindVortex`,
        text: lead.draft,
        messageId: `<prospecting-${id}@mindvortex.pro>`,
        headers: { "Auto-Submitted": "auto-generated" },
      });
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
