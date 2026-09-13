import { ImapFlow } from "imapflow";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export function imapConfig() {
  const host = process.env.IMAP_HOST || (process.env.SMTP_HOST === "smtp.mail.ovh.net" ? "imap.mail.ovh.net" : "");
  if (!host) throw Error("Brak konfiguracji IMAP.");
  const port = Number(process.env.IMAP_PORT || 993);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw Error("Nieprawidłowy port IMAP.");
  return {host, port, secure:true, auth:{user:process.env.IMAP_USER || process.env.SMTP_USER, pass:process.env.IMAP_PASSWORD || process.env.SMTP_PASSWORD}, logger:false, connectionTimeout:10000, greetingTimeout:10000, socketTimeout:20000};
}

export async function appendSentCopy(raw, messageId, date, client = new ImapFlow(imapConfig())) {
  client.on("error", () => {});
  const timeout = setTimeout(() => client.close(), 30000);
  try {
    await client.connect();
    const folders = await client.list();
    const folder = process.env.IMAP_SENT_FOLDER || folders.find(f => f.specialUse === "\\Sent")?.path;
    if (!folder) throw Error("Nie znaleziono folderu Wysłane; ustaw IMAP_SENT_FOLDER.");
    const lock = await client.getMailboxLock(folder);
    try {
      const existing = await client.search({header:{"Message-ID":messageId}}, {uid:true});
      if (!Array.isArray(existing)) throw Error("Nie udało się sprawdzić istniejącej kopii.");
      if (!existing.length && !await client.append(folder, raw, ["\\Seen"], new Date(date))) throw Error("Brak potwierdzenia zapisu kopii.");
    } finally { lock.release(); }
  } finally { clearTimeout(timeout); client.close(); }
}

// Only the worker archives copies, so HTTP requests cannot race with its IMAP search/append.
export async function syncSentCopies(store) {
  const rows = store.db.prepare("SELECT key,value FROM runtime WHERE key LIKE 'sent-copy:%'").all();
  for (const row of rows) {
    const state = JSON.parse(row.value);
    if (state.status !== "pending" || state.nextAttempt > Date.now()) continue;
    const id = row.key.slice("sent-copy:".length);
    if (store.lead(id)?.status !== "sent") continue;
    try {
      const raw = await readFile(join(store.directory,"assets",id,"sent.eml"));
      await appendSentCopy(raw,state.messageId,state.date);
      store.runtime(row.key,JSON.stringify({...state,status:"saved"}));
      store.event("Zapisano kopię wiadomości w folderze Wysłane: " + store.lead(id).name);
    } catch {
      store.runtime(row.key,JSON.stringify({...state,nextAttempt:Date.now()+300000}));
      store.event("Wiadomość wysłana; kopia w folderze Wysłane czeka na zapis IMAP: " + store.lead(id).name);
    }
    break;
  }
}
