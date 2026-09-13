"use client";
import type { Snapshot, Act } from "./types";
export function SettingsForm({
  data,
  act,
  busy,
}: {
  data: Snapshot;
  act: Act;
  busy: boolean;
}) {
  const s = data.settings;
  return (
    <div className="p-settings">
      <form
        className="p-card"
        action={async (form) => {
          await act({
            action: "settings",
            area: form.get("area"),
            category: form.get("category"),
            dailyLimit: Number(form.get("dailyLimit")),
            dailyHour: Number(form.get("dailyHour")),
            portfolioUrl: form.get("portfolioUrl"),
            paused: !form.has("enabled"),
            autoDiscover: form.has("autoDiscover"),
            autoSend: form.has("autoSend"),
          });
        }}
      >
        <h2>Obszar i tempo pracy</h2>
        <p>
          Wyszukiwanie raz dziennie. Audyty w kolejce, w granicach ustawionego
          limitu.
        </p>
        <div className="p-form-grid">
          <label>
            Obszar
            <select name="area" defaultValue={s.area}>
              {data.areas.map((a) => (
                <option key={a}>{a}</option>
              ))}
            </select>
          </label>
          <label>
            Branża
            <select name="category" defaultValue={s.category}>
              {Object.entries(data.categories).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </label>
          <label>
            Maksymalnie analiz na dobę
            <input
              name="dailyLimit"
              type="number"
              min={1}
              max={20}
              required
              defaultValue={s.dailyLimit}
            />
          </label>
          <label>
            Godzina wyszukiwania (Warszawa)
            <input
              name="dailyHour"
              type="number"
              min={0}
              max={23}
              required
              defaultValue={s.dailyHour}
            />
          </label>
        </div>
        <label>
          Portfolio w propozycjach
          <input
            name="portfolioUrl"
            type="url"
            required
            defaultValue={s.portfolioUrl}
          />
        </label>
        <div className="p-switches">
          <label>
            <input name="enabled" type="checkbox" defaultChecked={!s.paused} />
            <span>
              <strong>Włącz automat</strong>
              <small>
                Proces realizuje wyszukiwanie, audyty i dozwoloną wysyłkę. Pauza
                zatrzymuje nowe zadania.
              </small>
            </span>
          </label>
          <label>
            <input
              name="autoDiscover"
              type="checkbox"
              defaultChecked={s.autoDiscover}
            />
            <span>
              <strong>Codziennie wyszukuj nowe firmy</strong>
              <small>
                Nowe domeny trafiają do kolejki. Istniejące wpisy są pomijane.
              </small>
            </span>
          </label>
          <label>
            <input
              name="autoSend"
              type="checkbox"
              defaultChecked={s.autoSend}
            />
            <span>
              <strong>Wysyłaj gotowe propozycje</strong>
              <small>
                Tylko zapisana zgoda, wysoka pewność audytu i aktywna integracja
                pocztowa. Jedna wiadomość na firmę.
              </small>
            </span>
          </label>
        </div>
        <button className="p-primary" disabled={busy}>
          Zapisz ustawienia →
        </button>
      </form>
      <aside>
        <section className="p-card">
          <p className="p-eyebrow">GOTOWOŚĆ MODUŁU</p>
          <h2>Połączenia</h2>
          <dl className="p-connections">
            <div>
              <dt>Wyszukiwanie firm</dt>
              <dd>OpenStreetMap</dd>
            </div>
            <div>
              <dt>Analiza obrazów</dt>
              <dd>
                {data.integrations.vision
                  ? "Klucz skonfigurowany"
                  : "Brak klucza"}
              </dd>
            </div>
            <div>
              <dt>Wysyłka e-mail</dt>
              <dd>
                {data.integrations.delivery ? "Skonfigurowana" : "Wyłączona"}
              </dd>
            </div>
            <div>
              <dt>Ostatni sygnał procesu</dt>
              <dd>
                {data.heartbeat
                  ? new Date(data.heartbeat).toLocaleString("pl-PL", {
                      timeZone: "Europe/Warsaw",
                    })
                  : "Brak połączenia"}
              </dd>
            </div>
          </dl>
        </section>
        <section className="p-card">
          <h2>Zużycie dzisiaj</h2>
          <p>{data.usage.calls} rozpoczętych analiz</p>
          <p>
            {data.usage.inputTokens.toLocaleString("pl-PL")} tokenów wejściowych
            <br />
            {data.usage.outputTokens.toLocaleString("pl-PL")} tokenów
            wyjściowych
          </p>
          <small>
            Limit dotyczy liczby analiz, nie kwoty. Limit wydatków ustaw również
            u dostawcy modelu.
          </small>
        </section>
        <section className="p-card">
          <h2>Trzy kierunki współpracy</h2>
          <p>01 / Strony i identyfikacja wizualna</p>
          <p>02 / Automatyzacja social mediów</p>
          <p>03 / Dedykowane systemy CRM</p>
          <small>
            Oferta wynika z obserwacji. Potrzeby procesowe są hipotezami do
            rozmowy.
          </small>
        </section>
      </aside>
    </div>
  );
}
