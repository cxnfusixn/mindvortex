import { randomUUID } from "node:crypto";
import { validateAudit } from "./audit.mjs";

export function approvalBlock(lead) {
  if (!lead || lead.status !== "ready") return "Firma musi mieć zakończony audyt i aktywny kontakt.";
  if (lead.previously_contacted) return "Do tej firmy lub na ten adres już wysyłano wiadomość. Ponowna wysyłka jest zablokowana.";
  if (!lead.canAudit) return "Uzupełnij własną stronę firmy i poprawny e-mail.";
  if (!lead.audit?.verifiedAt) return "Brak zakończonej weryfikacji audytu. Zleć nowy audyt.";
  if (!lead.share_token || !(new Date(lead.share_expires) > new Date())) return "Raport wygasł. Zleć nowy audyt.";
  return "";
}

export function sendBlock(lead) {
  const blocked = approvalBlock(lead);
  if (blocked) return blocked;
  if (lead.audit.offer === "none") return "Audyt ma wynik „Bez propozycji”. Zatwierdzenie audytu nie tworzy oferty ani nie odblokowuje wysyłki.";
  if (!lead.draft) return "Brak przygotowanej wiadomości.";
  if (!lead.audit.findings?.some(f => f.severity >= 2)) return "Brak istotnych ustaleń uzasadniających wysyłkę propozycji.";
  return (lead.audit.confidence !== "high" && !(lead.audit.manualApprovedAt && lead.audit.manualApprovedDraft === lead.draft && lead.audit.manualApprovedEmail === lead.email)
    ? "Pewność modelu jest niższa niż wysoka. Przejrzyj raport i zatwierdź audyt ręcznie." : "");
}

export function approveAudit(store, id, updatedAt) {
  return store.transaction(() => {
    const lead = store.lead(id);
    if (!lead || typeof updatedAt !== "string" || lead.updated_at !== updatedAt)
      throw Error("Audyt lub wiadomość zmieniły się. Odśwież i przejrzyj aktualną wersję.");
    const blocked = approvalBlock(lead);
    if (blocked) throw Error(blocked);
    if (store.db.prepare("SELECT 1 FROM jobs WHERE lead_id=? AND kind='audit' AND status IN ('queued','running')").get(id))
      throw Error("Poczekaj na zakończenie nowego audytu.");
    if (lead.audit.manualApprovedAt && lead.audit.manualApprovedDraft === lead.draft && lead.audit.manualApprovedEmail === lead.email) return;
    validateAudit(lead.audit, lead.screens);
    const audit = {...lead.audit, manualApprovedAt: new Date().toISOString(), manualApprovedBy: "panel", manualApprovedDraft: lead.draft, manualApprovedEmail: lead.email};
    const source = store.auditHistory().filter(row => row.lead_id === id && row.phase === "verified")
      .map(row => store.auditRecord(row.id)).find(row => row.audit.verifiedAt === lead.audit.verifiedAt);
    store.recordAudit(randomUUID(), lead, "reviewed", audit, source?.screens || lead.screens);
    store.db.prepare("UPDATE leads SET audit=?,updated_at=? WHERE id=?").run(JSON.stringify(audit), audit.manualApprovedAt, id);
    store.event(`Ręcznie zatwierdzono audyt i wiadomość: ${lead.name}.`);
  });
}
