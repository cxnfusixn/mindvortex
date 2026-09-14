"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { LeadDetail } from "./lead-detail";
import { SettingsForm } from "./settings-form";
import { offers, statuses, type Snapshot, type Act } from "./types";

export function ProspectingPanel() {
  const [data, setData] = useState<Snapshot | null>(null),
    [auth, setAuth] = useState<"loading" | "login" | "ready">("loading");
  const [configured, setConfigured] = useState(true),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [busy, setBusy] = useState(false);
  const [tab, setTab] = useState("firms"),
    [selected, setSelected] = useState(""),
    [query, setQuery] = useState(""),
    [filter, setFilter] = useState("all"),
    [showAdd, setShowAdd] = useState(false);
  const [pageIndex, setPageIndex] = useState(0);
  const [now,setNow] = useState(0);
  const refresh = useCallback(async () => {
    setNow(Date.now());
    try {
      const response = await fetch("/prospecting/api", { cache: "no-store" });
      const body = await response.json();
      if (response.status === 401) {
        setAuth("login");
        setConfigured(body.configured);
        setData(null);
        return;
      }
      if (!response.ok) throw Error("Nie udało się pobrać danych.");
      setData(body);
      setAuth("ready");
    } catch {
      setError("Nie udało się połączyć z panelem. Spróbuj odświeżyć.");
    }
  }, []);
  useEffect(() => {
    const initial = setTimeout(() => void refresh(), 0);
    const timer = setInterval(() => {
      if (!document.hidden) void refresh();
    }, data?.discovery?.status === 'running' || busy ? 2000 : 10000);
    return () => {
      clearTimeout(initial);
      clearInterval(timer);
    };
  }, [refresh, data?.discovery?.status, busy]);
  const act: Act = async (payload) => {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/prospecting/api", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await response.json();
      if (!response.ok) throw Error(body.error || "Operacja nie powiodła się.");
      await refresh();
      setNotice(payload.action === "discover" ? (body.started ? "Uruchomiono wyszukiwanie: " : "Trwa już wyszukiwanie: ") + body.job.payload.area + ". Postęp widoczny poniżej." : "Zapisano.");
      return true;
    } catch (e) {
      await refresh();
      setError(e instanceof Error ? e.message : "Operacja nie powiodła się.");
      return false;
    } finally {
      setBusy(false);
    }
  };
  const logIn = async (form: FormData) => {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/prospecting/api/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: form.get("password") }),
      });
      const body = await response.json();
      if (!response.ok) throw Error(body.error);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Nie udało się zalogować.");
    } finally {
      setBusy(false);
    }
  };
  if (auth !== "ready" || !data)
    return (
      <main className="p-login">
        <div className="p-login-content">
          <Link className="p-brand" href="/pl">
            MIND VORTEX<span>PROSPECTING</span>
          </Link>
          <p className="p-eyebrow">TWÓJ LOKALNY ROZWÓJ</p>
          <h1>
            Dobre firmy.
            <br />
            <em>Nowe możliwości.</em>
          </h1>
          <p>
            Wyszukuj lokalne biznesy, analizuj ich strony i przygotowuj
            propozycje współpracy.
          </p>
          {auth === "loading" ? (
            <p role="status">Łączenie z panelem…</p>
          ) : configured ? (
            <form action={logIn}>
              <label htmlFor="password">Hasło do modułu</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                maxLength={256}
              />
              <button className="p-primary" disabled={busy}>
                {busy ? "Logowanie…" : "Otwórz panel →"}
              </button>
            </form>
          ) : (
            <div className="p-alert">
              Moduł jest zainstalowany. Logowanie wymaga skonfigurowania hasła
              przez administratora.
            </div>
          )}
          {error && (
            <p role="alert" className="p-error">
              {error}
              <button onClick={() => void refresh()}>Ponów połączenie</button>
            </p>
          )}
          <small>Oddzielna przestrzeń do pozyskiwania klientów.</small>
        </div>
      </main>
    );
  const active = data.leads.find((l) => l.id === selected);
  const leads = data.leads.filter(
    (l) =>
      (filter === "all" || (filter === "contacted" && l.previously_contacted) || (filter === "sent" && Boolean(l.sent_at)) || l.status === filter || l.audit?.offer === filter) &&
      `${l.name} ${l.area} ${l.website}`
        .toLocaleLowerCase("pl")
        .includes(query.toLocaleLowerCase("pl")),
  );
  const workerOnline = data.workerOnline;
  const lastPage = Math.max(0, Math.ceil(leads.length / 20) - 1);
  const currentPage = Math.min(pageIndex, lastPage);
  return (
    <div className="p-shell">
      <aside className="p-sidebar">
        <Link className="p-brand" href="/pl">
          MIND VORTEX<span>PROSPECTING</span>
        </Link>
        <nav aria-label="Moduł prospectingu">
          {[
            ["firms", "01", "Firmy i propozycje"],
            ["settings", "02", "Automatyzacja"],
            ["activity", "03", "Historia pracy"],
          ].map(([key, n, label]) => (
            <button
              key={key}
              aria-current={tab === key ? "page" : undefined}
              onClick={() => setTab(key)}
            >
              <span>{n}</span>
              {label}
            </button>
          ))}
        </nav>
        <div className="p-sidebar-bottom">
          <span className="p-dot" /> Warszawa i okolice
          <small>Portfolio · Social · CRM</small>
          <button
            onClick={async () => {
              await fetch("/prospecting/api/session", { method: "DELETE" });
              await refresh();
            }}
          >
            Wyloguj się ↗
          </button>
        </div>
      </aside>
      <main className="p-main">
        <header className="p-topbar">
          <span>
            PRZESTRZEŃ ROZWOJU /{" "}
            {tab === "firms"
              ? "BAZA FIRM"
              : tab === "settings"
                ? "AUTOMATYZACJA"
                : "HISTORIA"}
          </span>
          <span className="p-chip">
            {data.settings.paused
              ? "Automat wstrzymany"
              : workerOnline
                ? "Automat aktywny"
                : "Proces roboczy offline"}
          </span>
          <button
            className="p-mobile-logout"
            aria-label="Wyloguj się"
            onClick={async () => {
              await fetch("/prospecting/api/session", { method: "DELETE" });
              await refresh();
            }}
          >
            Wyloguj ↗
          </button>
        </header>
        <div className="p-heading">
          <div>
            <p className="p-eyebrow">MINDVORTEX / LOKALNIE</p>
            <h1>
              {tab === "firms"
                ? "Znajdź kolejną współpracę."
                : tab === "settings"
                  ? "Praca w Twoim rytmie."
                  : "Każdy krok zapisany."}
            </h1>
            <p>
              {tab === "firms"
                ? "Od pierwszej obserwacji do trafnej propozycji."
                : tab === "settings"
                  ? "Ustaw obszar, tempo i warunki automatyzacji."
                  : "Wyniki wyszukiwania, audytów i komunikacji."}
            </p>
          </div>
          {tab === "firms" && (
            <button
              className="p-primary"
              onClick={() => setShowAdd(!showAdd)}
              aria-expanded={showAdd}
            >
              {showAdd ? "Zamknij formularz" : "＋ Dodaj firmę"}
            </button>
          )}
        </div>
        <div className="p-feedback" aria-live="polite">
          {error && (
            <p role="alert" className="p-error">
              {error}
            </p>
          )}
          {notice && !error && <p className="p-success">{notice}</p>}
        </div>
        {!workerOnline && (
          <div className="p-alert">
            Proces roboczy nie jest połączony. Zlecone zadania pozostaną w
            kolejce do jego uruchomienia.
          </div>
        )}
        {tab === "firms" && (
          <>
            <section className="p-stats" aria-label="Podsumowanie">
              <div>
                <span>Firmy w bazie</span>
                <strong>{data.leads.length.toString().padStart(2, "0")}</strong>
              </div>
              <div>
                <span>Gotowe propozycje</span>
                <strong>
                  {data.leads
                    .filter((l) => l.status === "ready")
                    .length.toString()
                    .padStart(2, "0")}
                </strong>
              </div>
              <div>
                <span>Otrzymane odpowiedzi</span>
                <strong>
                  {data.leads
                    .filter((l) => l.status === "replied")
                    .length.toString()
                    .padStart(2, "0")}
                </strong>
              </div>
              <div>
                <span>Analizy dzisiaj</span>
                <strong>
                  {data.usage.calls}
                  <small> / {data.settings.dailyLimit}</small>
                </strong>
              </div>
            </section>
            {showAdd && (
              <form
                className="p-card p-add-form"
                action={async (form) => {
                  if (
                    await act({
                      action: "add",
                      name: form.get("name"),
                      website: form.get("website"),
                      email: form.get("email"),
                      phone: form.get("phone"),
                      area: form.get("area"),
                      category: form.get("category"),
                    })
                  )
                    setShowAdd(false);
                }}
              >
                <h2>Dodaj lokalną firmę</h2>
                <div className="p-form-grid">
                  <label>
                    Nazwa firmy
                    <input name="name" required maxLength={180} />
                  </label>
                  <label>
                    Adres strony
                    <input
                      name="website"
                      required
                      type="url"
                      placeholder="https://firma.pl"
                    />
                  </label>
                  <label>E-mail kontaktowy<input name="email" type="email" required maxLength={254} /></label>
                  <label>Telefon kontaktowy<input name="phone" type="tel" maxLength={80} /></label>
                  <label>
                    Obszar
                    <select name="area" defaultValue={data.settings.area}>
                      {data.areas.map((a) => (
                        <option key={a}>{a}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Branża
                    <select
                      name="category"
                      defaultValue={data.settings.category}
                    >
                      {Object.entries(data.categories).map(([k, v]) => (
                        <option key={k} value={k}>
                          {v}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <button disabled={busy} className="p-primary">
                  Zapisz firmę
                </button>
              </form>
            )}
            <form
              className="p-discovery"
              action={async (form) => {
                await act({
                  action: "discover",
                  area: form.get("area"),
                  category: form.get("category"),
                });
              }}
            >
              <div>
                <h2>Rozszerz swoją bazę</h2>
                <p>
                  {data.integrations.googlePlaces ? 'Google Maps · do 20 wyników na wyszukiwanie. Dane kontaktowe potwierdzamy na stronach firm.' : 'Publiczne dane OpenStreetMap. Każda firma ma zapisane źródło.'}
                </p>
              </div>
              <label>
                <span>Dzielnica lub cała Warszawa</span>
                <select name="area" defaultValue={data.settings.area}>
                  {data.areas.map((a) => (
                    <option key={a}>{a}</option>
                  ))}
                </select>
              </label>
              <label>
                <span>Branża</span>
                <select name="category" defaultValue={data.settings.category}>
                  {Object.entries(data.categories).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
              </label>
              <button disabled={busy || Boolean(data.discovery?.status==='running' && data.discovery.started_at && now-Date.parse(data.discovery.started_at)<120000)}>Wyszukaj teraz ↗</button>
            </form>
            {data.discovery && <section className="p-discovery" style={{gridTemplateColumns:'1fr'}} aria-label="Postęp wyszukiwania" role="status" aria-live="polite">
              <div>
                <h3>{data.discovery.payload.area} · {data.categories[data.discovery.payload.category]}</h3>
                <p>{data.discovery.status==='failed' ? data.discovery.error : data.discovery.status==='running' && data.discovery.started_at && now-Date.parse(data.discovery.started_at)>=120000 ? 'Brak zakończenia procesu. Możesz uruchomić wyszukiwanie ponownie.' : data.discovery.payload.progress?.message || (data.discovery.status==='queued' ? 'Stare zlecenie oczekuje w kolejce. Kliknij „Wyszukaj teraz”, aby rozpocząć od razu.' : data.discovery.status==='done' ? 'Wyszukiwanie zakończone.' : 'Pobieranie firm ze źródła…')}</p>
                {data.discovery.status==='running' && data.discovery.started_at && <p>Czas od uruchomienia: {Math.max(0,Math.floor((now-Date.parse(data.discovery.started_at))/1000))} s. {data.integrations.googlePlaces ? 'Wyszukiwanie i sprawdzanie stron może potrwać około minuty.' : 'Odpowiedź źródła może potrwać do 55 sekund.'}</p>}
              </div>
            </section>}
            {data.settings.paused && (
              <p className="p-muted">
                Ręczne wyszukiwanie działa również przy wstrzymanej automatyzacji.
              </p>
            )}
            <section className={`p-workspace ${active ? "has-detail" : ""}`}>
              <div className="p-list">
                <div className="p-list-tools">
                  <label className="p-search">
                    <span className="p-sr-only">Szukaj firmy</span>
                    <input
                      type="search"
                      value={query}
                      onChange={(e) => {
                        setQuery(e.target.value);
                        setPageIndex(0);
                      }}
                      placeholder="Szukaj firmy, domeny lub obszaru…"
                    />
                  </label>
                  <label>
                    <span className="p-sr-only">Filtr firm</span>
                    <select
                      value={filter}
                      onChange={(e) => {
                        setFilter(e.target.value);
                        setPageIndex(0);
                      }}
                    >
                      <option value="all">Wszystkie firmy</option>
                      <option value="contacted">Już kontaktowane / próby wysyłki</option>
                      <option value="sent">Wysłane wiadomości</option>
                      <option value="uncertain">Niepewny wynik wysyłki</option>
                      <option value="replied">Otrzymane odpowiedzi</option>
                      <option value="ready">Gotowe propozycje</option>
                      <option value="new">Nowe firmy</option>
                      <option value="error">Wymaga sprawdzenia</option>
                      {Object.entries(offers).map(([k, v]) => (
                        <option key={k} value={k}>
                          {v}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                {!leads.length ? (
                  <div className="p-empty">
                    <div className="p-orbit" aria-hidden="true">
                      ↗
                    </div>
                    <h2>
                      {data.leads.length
                        ? "Brak pasujących firm"
                        : "Pierwsza współpraca zaczyna się tutaj."}
                    </h2>
                    <p>
                      {data.leads.length
                        ? "Zmień filtr lub wpisaną frazę."
                        : "Wyszukaj firmy z Białołęki lub dodaj znany adres. Automat zbierze dowody i przygotuje analizę."}
                    </p>
                  </div>
                ) : (
                  <ul className="p-leads">
                    {leads
                      .slice(currentPage * 20, currentPage * 20 + 20)
                      .map((l) => (
                        <li key={l.id}>
                          <button
                            className={l.id === selected ? "selected" : ""}
                            onClick={() => setSelected(l.id)}
                            aria-pressed={l.id === selected}
                          >
                            <span className="p-monogram">
                              {l.name.slice(0, 1).toUpperCase()}
                            </span>
                            <span className="p-firm-name">
                              <strong>{l.name}</strong>
                              <small>
                                {l.area} · {data.categories[l.category]}
                              </small>
                              <small>Dodano: <time dateTime={l.created_at}>{new Date(l.created_at).toLocaleString("pl-PL", {timeZone: "Europe/Warsaw"})}</time></small>
                              <small>{l.sent_at ? `Wysłano: ${new Date(l.sent_at).toLocaleString("pl-PL", {timeZone: "Europe/Warsaw"})}` : l.status === "sent" ? "Wysłano wcześniej · brak daty" : l.status === "sending" ? "Wysyłanie w toku" : l.status === "uncertain" ? "Wynik wysyłki wymaga sprawdzenia" : l.previously_contacted ? "Wcześniejszy kontakt / próba wysyłki — nie ponawiaj" : "Jeszcze nie wysłano"}</small>
                              {l.audit && (
                                <small className="p-offer">
                                  {offers[l.audit.offer]}
                                </small>
                              )}
                            </span>
                            <span className={`p-status s-${l.status}`}>
                              {statuses[l.status] || l.status}
                            </span>
                            <span aria-hidden="true">↗</span>
                          </button>
                        </li>
                      ))}
                  </ul>
                )}
                {leads.length > 20 && (
                  <nav className="p-pagination" aria-label="Strony wyników">
                    <button
                      disabled={currentPage === 0}
                      onClick={() => setPageIndex(currentPage - 1)}
                    >
                      ← Poprzednie
                    </button>
                    <span>
                      {currentPage + 1} / {lastPage + 1} · {leads.length} firm
                    </span>
                    <button
                      disabled={currentPage === lastPage}
                      onClick={() => setPageIndex(currentPage + 1)}
                    >
                      Następne →
                    </button>
                  </nav>
                )}
                <p className="p-source">
                  Źródło wyszukiwania:{" "}
                  <a
                    href="https://www.openstreetmap.org/copyright"
                    target="_blank"
                    rel="noreferrer"
                  >
                    © OpenStreetMap contributors · ODbL
                  </a>
                  . Baza może być niepełna.
                </p>
              </div>
              {active && (
                <LeadDetail
                  key={active.id}
                  lead={active}
                  job={data.jobs.find((job) => job.lead_id === active.id && job.kind === "audit")}
                  workerOnline={data.workerOnline}
                  actionError={error}
                  visionAvailable={data.integrations.vision}
                  history={(data.auditHistory || []).filter((item) => item.lead_id === active.id)}
                  act={act}
                  busy={busy}
                  close={() => setSelected("")}
                />
              )}
            </section>
          </>
        )}
        {tab === "settings" && (
          <SettingsForm
            key={JSON.stringify(data.settings)}
            data={data}
            act={act}
            busy={busy}
          />
        )}
        {tab === "activity" && (
          <div className="p-activity">
            <section className="p-card">
              <h2>Kolejka zadań</h2>
              {!data.jobs.length && <p>Nie zlecono jeszcze żadnych zadań.</p>}
              {data.jobs.map((j) => (
                <article key={j.id}>
                  <strong>
                    {{
                      discover: "Wyszukanie firm",
                      audit: "Audyt strony",
                      send: "Wiadomość",
                    }[j.kind] || j.kind}
                  </strong>
                  <span className="p-chip">
                    {{
                      queued: "W kolejce",
                      running: "W toku",
                      done: "Zakończono",
                      failed: "Błąd",
                      cancelled: "Anulowano",
                    }[j.status] || j.status}
                  </span>
                  {j.error && <p className="p-error">{j.error}</p>}
                </article>
              ))}
            </section>
            <section className="p-card">
              <h2>Dziennik</h2>
              {!data.events.length && (
                <p>Historia pojawi się po pierwszej operacji.</p>
              )}
              {data.events.map((e) => (
                <article key={e.id}>
                  <small>
                    {new Date(e.at).toLocaleString("pl-PL", {
                      timeZone: "Europe/Warsaw",
                    })}
                  </small>
                  <p>{e.message}</p>
                </article>
              ))}
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
