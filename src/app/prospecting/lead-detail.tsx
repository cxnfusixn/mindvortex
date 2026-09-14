"use client";
import { useState } from "react";
import { offers, statuses, type Lead, type Act } from "./types";
export function LeadDetail({
  lead,
  job,
  workerOnline,
  actionError,
  visionAvailable,
  history,
  act,
  busy,
  close,
}: {
  lead: Lead;
  job?: {status:string;error:string};
  workerOnline: boolean;
  actionError: string;
  visionAvailable: boolean;
  history: {id:string;phase:string;created_at:string}[];
  act: Act;
  busy: boolean;
  close: () => void;
}) {
  const [copied, setCopied] = useState("");
  const [auditNotice, setAuditNotice] = useState("");
  const [sendNotice, setSendNotice] = useState("");
  const pending = job?.status === "queued" || job?.status === "running";
  const blocked = [
    "rejected",
    "suppressed",
    "replied",
    "sent",
    "sending",
    "uncertain",
  ].includes(lead.status);
  return (
    <aside className="p-detail" aria-label={`Szczegóły firmy ${lead.name}`}>
      <div className="p-detail-head">
        <span className="p-eyebrow">KARTA FIRMY</span>
        <button aria-label="Zamknij szczegóły" onClick={close}>
          ✕
        </button>
      </div>
      <h2>{lead.name}</h2>
      <p className="p-muted">Dodano do bazy: <time dateTime={lead.created_at}>{new Date(lead.created_at).toLocaleString("pl-PL", {timeZone: "Europe/Warsaw"})}</time></p>
      {history.length > 0 && <section><h3>Historia audytów</h3><p className="p-muted">Wersja wstępna może zawierać ustalenia odrzucone przy weryfikacji.</p>{history.map((item) => <p key={item.id}><a className="p-site-link" href={`/prospecting/api?audit=${encodeURIComponent(item.id)}`} target="_blank" rel="noreferrer">{new Date(item.created_at).toLocaleString("pl-PL")} · {item.phase === "reviewed" ? "Po przeglądzie" : item.phase === "verified" ? "Po weryfikacji" : "Wstępny"} ↗</a></p>)}</section>}
      <p>{lead.address || lead.area}</p>
      {lead.email && <p>E-mail: {lead.email}</p>}
      {lead.phone && <p>Telefon: {lead.phone}</p>}
      {lead.website ? (
        <a
          className="p-site-link"
          href={lead.website}
          target="_blank"
          rel="noreferrer"
        >
          {new URL(lead.website).hostname} ↗
        </a>
      ) : (
        <p className="p-muted">
          Brak strony w źródle. Nie można wykonać audytu UX.
        </p>
      )}
      <div className="p-detail-meta">
        <span className={`p-status s-${lead.status}`}>
          {statuses[lead.status]}
        </span>
        {lead.source.startsWith("https://www.openstreetmap.org/") && (
          <a href={lead.source} target="_blank" rel="noreferrer">
            Źródło ↗
          </a>
        )}
      </div>
      {lead.previously_contacted && <section aria-label="Historia kontaktu">
        <h3>Historia kontaktu</h3>
        <p>{lead.sent_at ? `Wysłano: ${new Date(lead.sent_at).toLocaleString("pl-PL")}` : lead.status === "sent" ? "Wiadomość wysłana wcześniej. Brak dokładnej daty w starszym zapisie." : lead.send_attempt_at ? `Próba wysyłki: ${new Date(lead.send_attempt_at).toLocaleString("pl-PL")}` : "Odnotowano wcześniejszy kontakt z firmą lub próbę wysyłki na ten adres."}</p>
        <p>Adres: {lead.send_email || lead.email}</p>
        <p className="p-muted">Ponowna wysyłka jest zablokowana. Przyjęcie przez serwer pocztowy nie oznacza potwierdzenia dostarczenia odbiorcy.</p>
      </section>}
      <button
        className="p-primary p-full"
        disabled={
          busy || pending || blocked || lead.status === "auditing" || !lead.canAudit
        }
        onClick={async () => {
          setAuditNotice("");
          const ok = await act({ action: "audit", id: lead.id });
          setAuditNotice(ok ? "Audyt został zlecony." : "Nie udało się zlecić audytu. Szczegóły błędu są nad listą firm.");
        }}
      >
        {pending ? (job?.status === "running" ? "Trwa audyt…" : "Audyt w kolejce…") : lead.audit ? "Zleć nowy audyt" : "Zleć audyt strony"} ↗
      </button>
      <p role="status" className="p-muted">{pending ? (!workerOnline ? "Zadanie czeka na uruchomienie procesu audytującego." : job?.status === "running" ? "Trwa analiza. Wynik pojawi się tutaj automatycznie." : !visionAvailable ? "Zadanie czeka na konfigurację klucza modelu." : "Zadanie czeka na wolny proces audytujący.") : auditNotice || "Ręczny audyt działa również przy wstrzymanej automatyzacji."}</p>
      {job?.status === "failed" && <p role="alert" className="p-error">{job.error}</p>}
      {actionError && <p role="alert" className="p-error">{actionError}</p>}
      {lead.website && !lead.canAudit && (
        <p className="p-muted">
          Audyt wymaga własnej strony firmy oraz poprawnego e-maila.
        </p>
      )}
      {lead.audit ? (
        <>
          <section>
            <p className="p-eyebrow">DOPASOWANA PROPOZYCJA</p>
            <h3>{offers[lead.audit.offer]}</h3>
            <p>{lead.audit.offerReason}</p>
            <small>
              Pewność oceny:{" "}
              {{ high: "wysoka", medium: "średnia", low: "niska" }[
                lead.audit.confidence
              ] || lead.audit.confidence}
            </small>
          </section>
          <section>
            <h3>Wnioski z analizy</h3>
            <p>{lead.audit.summary}</p>
            {lead.audit.findings.map((f) => (
              <article className="p-finding" key={f.id}>
                <small>
                  {f.id} · Ważność {f.severity}/4 · {f.heuristic}
                </small>
                <h4>{f.title}</h4>
                <p>{f.evidence}</p>
                <p>
                  <strong>Propozycja:</strong> {f.recommendation}
                </p>
              </article>
            ))}
            {lead.audit.positives.map((p, i) => (
              <p className="p-positive" key={i}>
                ✓ {p.description}
              </p>
            ))}
          </section>
          {lead.share_token && (
            <div className="p-detail-links">
              <a
                className="p-primary"
                href={`/prospecting/report/${lead.share_token}`}
                target="_blank"
                rel="noreferrer"
              >
                Otwórz raport ↗
              </a>
              <a href={`/prospecting/api/assets/${lead.id}/report.html`}>
                Pobierz raport HTML ↓
              </a>
              <small>
                Link ważny do{" "}
                {new Date(lead.share_expires!).toLocaleDateString("pl-PL")}.
                Wyłączenie firmy unieważnia link.
              </small>
            </div>
          )}
          <section>
            <h3>Zatwierdzenie audytu</h3>
            {lead.audit.manualApprovedAt && lead.audit.manualApprovedDraft === lead.draft && lead.audit.manualApprovedEmail === lead.email ? <p role="status">Zatwierdzono ręcznie: {new Date(lead.audit.manualApprovedAt).toLocaleString("pl-PL")}</p> : <>
              <p>Przejrzyj raport i, jeśli przygotowano wiadomość, jej podgląd. Zatwierdzenie zapisuje Twój przegląd bez zmiany oceny modelu. Wynik „Bez propozycji” można zatwierdzić, ale wysyłka nadal wymaga gotowej oferty.</p>
              <button className="p-primary p-full" disabled={busy || pending || Boolean(lead.approvalBlock)} onClick={() => void act({action:"approveAudit",id:lead.id,updatedAt:lead.updated_at})}>Zatwierdź audyt</button>
              {lead.approvalBlock && <p className="p-muted">{lead.approvalBlock}</p>}
              <p className="p-muted">Zatwierdzenie nie wysyła wiadomości.</p>
            </>}
          </section>
          <section>
            <h3>Wiadomość do firmy</h3>
            <label className="p-sr-only" htmlFor="draft">
              Przygotowana wiadomość
            </label>
            <textarea
              id="draft"
              className="p-draft"
              readOnly
              value={lead.draft}
            />
            <button
              disabled={!lead.draft}
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(lead.draft);
                  setCopied("Skopiowano wiadomość.");
                } catch {
                  setCopied("Zaznacz tekst i skopiuj go ręcznie.");
                }
              }}
            >
              Kopiuj wiadomość
            </button>
            {lead.draft && <p><a className="p-site-link" href={`/prospecting/api?email=${encodeURIComponent(lead.id)}`} target="_blank" rel="noreferrer">Podgląd maila HTML ↗</a></p>}
            <p role="status">{copied}</p>
            <button className="p-primary p-full" disabled={busy || !lead.canSend} onClick={async () => {
              setSendNotice("");
              const ok = await act({action:"send",id:lead.id,email:lead.email,draft:lead.draft});
              setSendNotice(ok ? "Serwer pocztowy przyjął wiadomość." : "Nie potwierdzono wysyłki. Sprawdź komunikat poniżej.");
            }}>Wyślij wiadomość do {lead.email}</button>
            <p className="p-muted">Przycisk wysyła wiadomość z podglądu HTML. Ręczna wysyłka nie włącza automatycznych wiadomości.</p>
            {!lead.canSend && <p className="p-muted">{lead.status === "sent" ? "Wiadomość została już przekazana do poczty." : lead.status === "uncertain" ? "Wynik poprzedniej wysyłki wymaga sprawdzenia w poczcie. Ponowienie jest zablokowane." : lead.sendBlock}</p>}
            <p role="status">{sendNotice}</p>
            {actionError && <p role="alert" className="p-error">{actionError}</p>}
          </section>
        </>
      ) : (
        <section className="p-detail-empty">
          <h3>Najpierw dowody, potem propozycja.</h3>
          <p>
            Po audycie pojawią się tutaj wnioski, raport ze zrzutami ekranu i
            dopasowana wiadomość.
          </p>
        </section>
      )}
      {!blocked && (
        <section>
          <h3>Kontakt e-mail</h3>
          <form
            action={async (form) => {
              await act({
                action: "contact",
                id: lead.id,
                email: form.get("email"),
              });
            }}
          >
            <label>
              E-mail odbiorcy
              <input
                key={lead.email}
                name="email"
                type="email"
                defaultValue={lead.email}
                required
                maxLength={254}
              />
            </label>
            <button disabled={busy}>Zapisz kontakt</button>
          </form>
        </section>
      )}
      <div className="p-detail-actions">
        <button disabled={busy || blocked} onClick={() => void act({action:"reject",id:lead.id})}>Odrzuć — strona jest OK</button>
        {lead.status === "rejected" && <p className="p-muted">Odrzucono po przeglądzie: strona jest OK. Audyty i wysyłka są zablokowane.</p>}
        <button
          disabled={
            busy || lead.status === "rejected" || lead.status === "suppressed" || lead.status === "replied"
          }
          onClick={() => void act({ action: "replied", id: lead.id })}
        >
          Oznacz otrzymaną odpowiedź
        </button>
        <button
          className="p-danger"
          disabled={busy || lead.status === "suppressed"}
          onClick={() => void act({ action: "suppress", id: lead.id })}
        >
          Wyłącz firmę z automatyzacji
        </button>
      </div>
    </aside>
  );
}
