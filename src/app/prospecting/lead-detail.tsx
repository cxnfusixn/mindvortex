"use client";
import { useState } from "react";
import { offers, statuses, type Lead, type Act } from "./types";
export function LeadDetail({
  lead,
  act,
  busy,
  close,
}: {
  lead: Lead;
  act: Act;
  busy: boolean;
  close: () => void;
}) {
  const [copied, setCopied] = useState("");
  const blocked = [
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
      <p>{lead.address || lead.area}</p>
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
      <button
        className="p-primary p-full"
        disabled={
          busy || blocked || lead.status === "auditing" || !lead.canAudit
        }
        onClick={() => void act({ action: "audit", id: lead.id })}
      >
        {lead.audit ? "Zleć nowy audyt" : "Zleć audyt strony"} ↗
      </button>
      {lead.website && !lead.canAudit && (
        <p className="p-muted">
          Profil platformy zewnętrznej. Do audytu potrzebny jest adres własnej
          strony firmy lub osobny materiał wizualny.
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
            <p role="status">{copied}</p>
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
          <h3>Zgoda na kontakt handlowy</h3>
          <p>Samo udostępnienie adresu na stronie nie potwierdza zgody.</p>
          {lead.consent_at && (
            <p className="p-positive">
              ✓ Zgoda zapisana{" "}
              {new Date(lead.consent_at).toLocaleDateString("pl-PL")}
            </p>
          )}
          <form
            action={async (form) => {
              await act({
                action: "consent",
                id: lead.id,
                email: form.get("email"),
                evidence: form.get("evidence"),
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
            <label>
              Źródło, data i zakres zgody
              <textarea
                name="evidence"
                defaultValue={lead.consent}
                required
                minLength={12}
                maxLength={2000}
                placeholder="Gdzie i kiedy odbiorca zgodził się na e-mail z ofertą MindVortex?"
              />
            </label>
            <button disabled={busy}>Zapisz zgodę</button>
          </form>
        </section>
      )}
      <div className="p-detail-actions">
        <button
          disabled={
            busy || lead.status === "suppressed" || lead.status === "replied"
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
