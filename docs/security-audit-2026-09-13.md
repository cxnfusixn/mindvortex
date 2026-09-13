# Audyt bezpieczeństwa MindVortex — 2026-09-13

Stan historyczny przed poprawkami. Implementacja napraw i kroki aktywacji: [security-fixes-2026-09-13.md](security-fixes-2026-09-13.md).

Przegląd obejmuje repozytorium główne, prospecting, aplikację `social/automation`, narzędzia `social/instagram/tools`, skrypty budowania podglądów i wdrożenia oraz publiczne artefakty tekstowe. Wykryto **4 problemy P2 (średni priorytet)**, potwierdzone testami lokalnymi. Nie potwierdzono podatności krytycznej ani przejęcia konta.

Kod aplikacji nie został zmieniony. Nie wykonywano wdrożenia, testów obciążeniowych produkcji, wysyłki wiadomości ani wywołań płatnych modeli. Repozytorium zmieniało się podczas przeglądu wskutek pracy poza tym audytem; lokalizacje ustaleń sprawdzono ponownie przy HEAD `be5960c708935e5e18857d669141b2bc50acec07`. Katalogi `graphify-out` zawierają częściowe artefakty, bez gotowego `graph.json`; wnioski oparto na kodzie.

## Granice zaufania i chronione zasoby

| Granica | Dane niezaufane | Chronione zasoby / sprawdzone mechanizmy |
| --- | --- | --- |
| Formularz kontaktowy | JSON, nagłówki, adres odpowiedzi | Konto SMTP; limit strumienia 16 KiB, walidacja, escaping HTML, stały odbiorca, wymagany TLS |
| Panel prospectingu | Logowanie, akcje API | Kontakty, raporty, wysyłka; scrypt, sesje w SQLite, cookies HttpOnly/Secure/SameSite, kontrola Origin |
| Worker prospectingu | Dane OSM, HTML/JS stron, DNS, odpowiedzi modelu | Sieć lokalna, proces workera, koszt API; filtrowanie IP i portów, proxy z przypiętym IP, izolowany kontekst Chromium, walidacja wyników i limit tokenów |
| Panel social | Logowanie i OTP, akcje API, żądania mediów | Konta publikacji, dane PostgreSQL, dostępność; scrypt, jednorazowy OTP, sesje w DB, kontrola Origin i autoryzacji w handlerach |
| Integracje i rendering | Wyniki modeli, źródła redakcyjne, obrazy | Integralność publikacji; walidacja treści, parametryzowane SQL, ograniczone źródła URL, argumenty procesów bez powłoki |
| Wdrożenia | Archiwum, lockfile i skrypty zależności | Sekrety produkcji, kod wykonywalny, konta usług; osobne konta systemowe, systemd, nginx, polityka instalacji |
| Podglądy portfolio | Skopiowany kod i treść innych projektów | Wspólny origin z panelami; istotna zależność zaufania przy publikacji kolejnych podglądów |

## Potwierdzone problemy

### SEC-01 — P2: jedna osoba może wyczerpać limit logowania wszystkich użytkowników

**Kod:** `prospecting/lib/auth.mjs:49–61`, endpoint `src/app/prospecting/api/session/route.ts`.

`login()` zlicza wszystkie wpisy w `login_attempts`, bez przypisania do źródła żądania. Po 10 próbach odrzuca następne żądanie przed sprawdzeniem hasła. Osoba bez sesji może więc wysłać 10 błędnych haseł i zablokować także poprawne logowanie właściciela na pozostałą część 15-minutowego okna. Nagłówek Origin nie zatrzymuje klienta HTTP, który ustawia go samodzielnie. Istniejące sesje nadal działają.

**Dowód:** wywołano rzeczywisty `login()` z bazą SQLite `:memory:` i syntetycznym hasłem. Po 10 błędnych próbach poprawne hasło zostało odrzucone komunikatem `Zbyt wiele prób. Odczekaj 15 minut.` Istniejący test bezpieczeństwa również potwierdza współdzielenie limitu.

**Poprawka:** ograniczać próby według źródła ustalonego przez zaufany reverse proxy; nie pozwalać jednemu źródłu wyłączyć logowania całego panelu. Zachować osobną ochronę przed rozproszonym brute force. Test regresyjny powinien wykazać, że wyczerpanie limitu przez klienta A nie blokuje prawidłowego logowania klienta B. Nie ufać dowolnemu nagłówkowi `X-Forwarded-For` przy bezpośrednio dostępnym serwerze.

### SEC-02 — P2: małe żądanie mediów powoduje pełny odczyt filmu

**Kod:** `social/automation/app/media/[file]/route.js:6–13`, publiczny wyjątek w `social/automation/proxy.js`.

Handler najpierw wykonuje `fs.readFile()` całego pliku, a dopiero później analizuje Range. `HEAD` wywołuje ten sam `GET`. Znając URL istniejącego filmu, osoba bez sesji może powodować pełne odczyty i alokacje pamięci nawet przy `Range: bytes=0-0`, błędnym Range lub HEAD. Koszt rośnie wraz z wielkością filmu i współbieżnością żądań. Samo publiczne udostępnianie pliku jest zamierzone i potrzebne integracjom; problemem jest koszt obsługi.

**Dowód:** bez sesji wywołano rzeczywisty handler, zastępując jedynie `fs.readFile` atrapą zwracającą 8 MiB:

| Żądanie | Status | Bajty odpowiedzi | Bajty wczytane przez handler |
| --- | --- | ---: | ---: |
| GET, `Range: bytes=0-0` | 206 | 1 | 8 388 608 |
| HEAD | 200 | 0 | 8 388 608 |

Nie wykonywano testu wyczerpania pamięci. Limity nginx i `MemoryMax=1G` ograniczają zasięg, ale nie usuwają amplifikacji; osiągnięcie limitu pamięci może zatrzymać usługę panelu.

**Poprawka:** metadane przez `stat`, walidacja zakresu przed odczytem, HEAD bez odczytywania treści; GET strumieniowo, a Range tylko dla wskazanego fragmentu. Alternatywnie serwowanie plików przez nginx. Testować również niepoprawne zakresy i przerwanie pobierania przez klienta.

### SEC-03 — P2: JavaScript audytowanej strony może zatrzymać kolejkę prospectingu

**Kod:** `prospecting/lib/capture.mjs:75`, `prospecting/worker.mjs:68,134–146`.

`await page.evaluate(() => document.fonts.ready)` nie ma własnego limitu czasu. `page.setDefaultTimeout(12000)` nie ogranicza oczekiwania `evaluate()` na Promise. Audytowana strona kontroluje swój JavaScript i może podmienić getter `document.fonts.ready`, tak aby zwracał Promise, który nigdy się nie kończy. Worker sekwencyjnie czeka na `capture()`, więc kolejne zadania nie ruszą. Niezależny timer nadal aktualizuje heartbeat, przez co panel może pokazywać workera jako dostępnego.

**Dowód:** w lokalnym Chromium ustawiono syntetyczną stronę z getterem zwracającym nierozwiązywany Promise. Przy `setDefaultTimeout(250)` wywołanie nadal oczekiwało po 1506 ms; przerwano je przez zamknięcie przeglądarki. Test nie łączył się z badaną firmą ani produkcją.

**Warunek:** kontrolowana przez napastnika strona zostaje dodana do audytu lub trafia do niego przez discovery. Napastnik nie musi mieć konta panelu, jeśli jego witryna zostanie zakwalifikowana przez operatora lub discovery.

**Poprawka:** nieograniczone oczekiwanie zastąpić ograniczonym czasowo krokiem oraz wprowadzić nadrzędny deadline całego zadania, egzekwowany poza stroną. Po przekroczeniu czasu faktycznie zamknąć kontekst/przeglądarkę i oznaczyć zadanie jako nieudane. Sam `Promise.race` bez sprzątania pozostawia pracę w tle. Monitorować też postęp kolejki, nie tylko żywotność procesu.

### SEC-04 — P2, warunkowe: SMTP na porcie 587 nie wymaga szyfrowania

**Kod:** `prospecting/lib/delivery.mjs:41–48`, `social/automation/lib/auth.mjs:11`.

Oba adaptery przy ustawieniu `SMTP_PORT=587` używają `secure:false`, ale nie ustawiają `requireTLS:true`. To pozostawia STARTTLS opcjonalnym. Serwer, który nie reklamuje STARTTLS, może otrzymać uwierzytelnienie bez szyfrowania. Napastnik na ścieżce sieciowej może wykorzystać downgrade do przechwycenia danych SMTP, a w ścieżce social także treści wiadomości z kodem logowania.

**Dowód:** lokalny serwer SMTP reklamował AUTH PLAIN i nie reklamował STARTTLS. Zainstalowany Nodemailer, przy tej samej polityce TLS (`secure:false`, brak `requireTLS`), wykonał `verify()` i wysłał syntetyczne dane uwierzytelnienia w nieszyfrowanym połączeniu. Test nie wysyłał maila. Sprawdzono również implementację Nodemailera w `node_modules/nodemailer/dist/cjs/smtp-connection/index.js`.

**Ograniczenie:** domyślna konfiguracja i `.env.example` wskazują port 465, który korzysta z TLS od początku i nie jest objęty tym scenariuszem. Nie odczytywano aktywnych sekretów ani konfiguracji VPS, więc nie stwierdzono aktywnego wycieku na produkcji.

**Poprawka:** dla połączeń bez implicit TLS wymagać STARTTLS i walidować konfigurację portu. W repozytorium jest już poprawny wzorzec: `src/app/api/contact/route.ts:90–91`. Test powinien odrzucać serwer bez STARTTLS, zanim zostanie wysłane AUTH.

## Dodatkowe zalecenia dotyczące zabezpieczeń

Te punkty nie są dowodem zdalnego wykorzystania podatności:

1. **Oddzielić instalację zależności od sekretów produkcji.** `deploy/release.sh:22–25` uruchamia `npm ci` i build z `EnvironmentFile=/etc/mindvortex.env`. Skrypty zależności otrzymują sekrety. Wdrożenia social również wykonują instalację bez polityki blokowania skryptów i jako konto, które w działającym wdrożeniu ma dostęp do pliku środowiska. Budować jako odrębny użytkownik bez dostępu do sekretów, początkowo wyłączyć skrypty instalacji i dopuścić tylko przejrzane, potrzebne kroki. Dodać kontrolę audytu zależności do wdrożenia; `--no-audit` w social nie stanowi kontroli bezpieczeństwa. W tej sesji nie wykryto złośliwej zależności.
2. **Utrzymać kod głównej aplikacji tylko do odczytu dla usługi.** `deploy/release.sh:19,39` nadaje własność kodu kontu `mindvortex`, a `deploy/mindvortex.service:22–24` nie blokuje mu zapisu do katalogu aplikacji. Ewentualne przejęcie procesu umożliwia utrwalenie zmian w kodzie. Aplikacja social ma już lepszy wzorzec: kod `root:mv-social`, `ProtectSystem=strict`, zapis tylko do stanu. Nie potwierdzono RCE.
3. **Wprowadzić zasady retencji i usuwania kontaktów prospectingu.** `suppress()` zatrzymuje automat i unieważnia link, ale zachowuje e-mail, telefon, adres, szkice, audyty i obrazy. To nie jest usunięcie danych. Ustalić cel i okres przechowywania oraz procedurę obejmującą `leads`, historię, pliki i kopie. Nie utożsamiać TTL linku raportu z TTL danych. To ustalenie techniczne, bez oceny zgodności prawnej kampanii.
4. **Ograniczać strumień request body również w handlerach social.** `app/api/auth/route.js` i `app/api/route.js` sprawdzają wielkość po `req.text()`. Limit nginx 24k ogranicza ryzyko w opisanym wdrożeniu, więc nie zakwalifikowano tego jako niezależnej podatności produkcji. Przy zmianie hostingu ochrona powinna pozostać w aplikacji; wzorzec czytania strumienia istnieje w `prospecting/lib/auth.mjs`.
5. **Ujednolicić nagłówki i świadomie zarządzać zaufaniem do podglądów.** Główny `next.config.ts` dodaje nagłówki ochronne tylko dla prospectingu. CSP social jest dodawane skryptem nginx, nie konfiguracją aplikacji. Pełny stan HSTS/CSP na VPS nie został zweryfikowany. Podglądy portfolio wykonują skrypty pod tym samym originem co panele; przy publikowaniu niezaufanej zawartości rozważyć osobny origin, ponieważ cookies HttpOnly i SameSite nie powstrzymają żądań wykonywanych przez skrypt z tego samego originu. Nie potwierdzono XSS w obecnych podglądach.

## Wyniki weryfikacji

| Kontrola | Wynik |
| --- | --- |
| `npm audit --json --ignore-scripts` — repozytorium główne | 0 zgłoszonych podatności; 460 zależności wg raportu npm |
| Ta sama kontrola — `social/automation` | 0 zgłoszonych podatności; 83 zależności |
| Ta sama kontrola — `social/instagram/tools` | 0 zgłoszonych podatności; 13 zależności |
| `node --test prospecting/tests/*.test.mjs` | 19/19 testów przeszło |
| `node --test tests/security.test.mjs tests/content.test.mjs tests/engagement-source.test.mjs tests/tiktok.test.mjs` w social | 14/14 testów przeszło |
| Wzorcowy skan sekretów w bieżących śledzonych plikach tekstowych | 1950 plików, brak trafień zastosowanych wzorców |
| Izolowane sprawdzenia SEC-01…SEC-04 | Potwierdziły opisane mechanizmy |

Skan sekretów szukał formatów kluczy prywatnych, wybranych tokenów dostawców i literałów danych uwierzytelnienia. Nie obejmował pełnej historii Git ani prywatnych plików `.env`; brak trafień nie dowodzi braku wszystkich możliwych sekretów. Nie skanowano treści binariów ani dostawców zewnętrznych. Audyt npm dotyczy znanych zgłoszeń, nie pochodzenia i bezpieczeństwa wszystkich paczek.

W przeglądanych ścieżkach chronione API sprawdza sesję także w handlerach; raporty i obrazy prospectingu wymagają logowania. Zapytania używają parametrów, HTML raportów i maili jest escapowany, JSON-LD koduje `<`, a proxy Chromium weryfikuje adresy i łączy się z uprzednio zatwierdzonym IP. Nie znaleziono potwierdzonego obejścia tych mechanizmów w wykonanym zakresie.

Nie uruchamiano pełnych testów z PostgreSQL, produkcyjnego przepływu OTP, całego zestawu przeglądarkowego ani prób obciążeniowych. Nie sprawdzano rzeczywistych uprawnień na VPS, aktualnego nginx ani odtwarzania backupów. Przegląd źródeł i lokalne próby nie zastępują testu wdrożonego systemu.

## Kolejność napraw

1. SEC-01 i SEC-03: przywrócić odporność logowania i kolejki na blokadę przez jedno źródło.
2. SEC-02: zastąpić pełne odczyty obsługą strumieniową i bezkosztowym HEAD.
3. SEC-04: wymusić STARTTLS; jeśli produkcja używa portu 587, nadać temu pierwszeństwo.
4. Odseparować sekrety od buildu i ograniczyć zapis do kodu; następnie wdrożyć retencję i przenośne zabezpieczenia konfiguracji.
