# MindVortex / Prospecting

Osobny moduł głównej aplikacji pod `/prospecting`, niezależny od Social Studio. Next.js obsługuje panel i chronione API, a proces Node 24 wykonuje wyszukiwanie, zbieranie zrzutów i analizę. SQLite w trybie WAL przechowuje firmy, zadania, zgody i historię. Wymagany jeden serwer ze wspólnym dyskiem lokalnym; nie uruchamiać bazy na NFS ani w wielu replikach.

## Lokalnie

```sh
npm ci
npm run prospecting:setup
npx playwright install chromium
npm run prospecting:dev
```

Otwórz `http://localhost:3000/prospecting`. Wygenerowane hasło znajduje się w ignorowanym `.prospecting-credentials.txt`; przenieś je do menedżera haseł. Konfiguracja zawiera jedynie hash scrypt. Setup nie nadpisuje istniejących plików. Dla innego adresu: `npm run prospecting:setup -- --origin http://127.0.0.1:3035`.

W drugim terminalu:

```sh
npm run prospecting:worker
```

Panel startuje z pauzą. W zakładce Automatyzacja włącz proces. Do wyszukiwania nie jest potrzebny klucz API. Audyty wymagają `PROSPECTING_OPENAI_API_KEY` w `.env.prospecting.local` i ponownego uruchomienia aplikacji/procesu. Domyślny model obsługujący obrazy i structured output to `gpt-5.4`, konfigurowalny przez `PROSPECTING_MODEL`. Limit 5 analiz dziennie jest limitem wywołań, nie kwoty; także przerwane płatne wywołanie zużywa slot. Ustaw limit wydatków projektu u dostawcy API.

## Działanie

- OSM/Overpass wyszukuje branżę w granicach administracyjnych Białołęki, Targówka, Bielan lub Warszawy; źródło i adres są zapisane. Pokrycie nie jest pełne. Firmy bez strony zostają w bazie, lecz nie otrzymują fikcyjnego audytu. Zapisane dane OSM podlegają ODbL i wymagają atrybucji.
- Deduplikacja na poziomie domeny (bez `www`), a bez strony: nazwy i obszaru. Profile Facebook, Instagram i Booksy zachowują identyfikator profilu i nie są automatycznie audytowane jako własne strony. Wspólna domena oddziałów daje jedną propozycję. Inne platformy współdzielone należy kwalifikować ręcznie.
- Niezależny Chromium z proxy blokującym prywatne IP, także po zmianie DNS i przekierowaniach. Brak prywatnych sesji, formularzy, płatności i wykonywania instrukcji ze strony. Sandbox Chromium domyślnie włączony.
- Materiał: widoczne fragmenty strony głównej i do dwóch podstron oferty/kontaktu przy 1440×1000 i 390×844. Limit 6 obrazów. Audyt nie obejmuje całej strony poniżej kadru ani dynamicznych interakcji. Blokada dostępu oznacza błąd, a nie złą ocenę.
- `ux-audit.md` jest kopią wskazanego przez użytkownika skilla. Cel i intake są przekazywane automatycznie. Model ocenia wszystkie obrazy, zwraca wnioski z dowodami, cytowaniami heurystyk i regionami adnotacji. Drugi, niezależny przebieg ocenia dowody, usuwa niepotwierdzone zarzuty i sprawdza regiony adnotacji. Dodatkowa walidacja odrzuca rozpoznane twierdzenia o klikalności i awarii map, których nie można potwierdzić screenshotem. Raport HTML używa nakładek SVG na oryginałach zamiast wymagania Pythona. Jedna analiza zużywa dwa wywołania modelu; limit dzienny dotyczy pełnych analiz. To automatyczna kontrola jakości, nie gwarancja trafności każdej oceny.
- Portfolio: `https://mindvortex.pro/pl`. Trzy kierunki: strona/identyfikacja, social automation, dedykowany CRM. Potrzeby operacyjne są hipotezami, a nie zarzutem braku systemu. Żadne prywatne dane CRM Marcin Bak nie są pobierane.
- Raport udostępniany przez losowy token ważny 30 dni; noindex, no-store, no-referrer i CSP. Pobierany HTML zawiera obrazy i adnotacje, działa samodzielnie. Ujawnienie linku daje dostęp do raportu. Wyłączenie firmy unieważnia link.
- Harmonogram działa w procesie roboczym, raz dziennie o ustawionej godzinie Europe/Warsaw. Po pauzie nie nadrabia wcześniejszych dni. Błędne zadania wymagają sprawdzenia i świadomego ponowienia; nie ma nieograniczonego retry płatnych wywołań.

## Komunikacja

Wysyłka wymaga łącznie `PROSPECTING_SEND_ENABLED=true`, ustawienia autoSend, aktywnego procesu, poprawnej konfiguracji SMTP, zgody na konkretny adres i cel, gotowego raportu o wysokiej pewności oraz co najmniej jednego problemu ważności 2+. Bez zgody powstaje wyłącznie szkic. SMTP używa `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM`; worker musi otrzymać te zmienne osobno, nie odczytuje automatycznie `.env.local`.

Jedna wiadomość na firmę, bez follow-upów. Stan `sending` zapisywany jest przed SMTP; niepewny wynik blokuje ponowienie. Status `sent` oznacza przyjęcie przez serwer SMTP, nie dowód dostarczenia do skrzynki. Odpowiedzi oznacza się w panelu; automatyczne odczytywanie skrzynki nie jest zaimplementowane. Nie wysyłamy dodatkowych wiadomości po pierwszej, więc odpowiedź nie uruchamia sekwencji. Zatrzymanie zadania już przekazanego do SMTP może nie cofnąć wysyłki.

## Wdrożenie

Wymagane Node 24, HTTPS, stały dysk i osobny proces. Aplikacja oraz worker muszą używać identycznego `PROSPECTING_DATA_DIR` (zalecane `/var/lib/mindvortex-prospecting`) oraz `PROSPECTING_PUBLIC_URL=https://mindvortex.pro`. Dane i `.env` trzymaj poza katalogiem wydań. Nie włączaj konfiguracji deweloperskiej na produkcji.

Standardowy build strony: `npm run build`. Przy wydaniu standalone skopiuj `prospecting/` oraz zapewnij workerowi zależności `playwright` i `nodemailer` z lockfile. Next nie musi importować Chromium ani skilla do procesu HTTP. Zainstaluj Chromium przez `npx playwright install --with-deps chromium` w środowisku użytkownika usługi. Użyj jednostki `deploy/mindvortex-prospecting-worker.service`; dodaj `EnvironmentFile=/etc/mindvortex-prospecting.env` również do usługi strony. Nie trzeba dodawać proxy do Social Studio ani zmieniać publicznego portfolio.

Backup musi obejmować SQLite (wraz z WAL albo spójną kopię wykonaną SQLite backup) oraz katalog `assets`. Link wygasa po 30 dniach, ale pliki pozostają na dysku do administracyjnego usunięcia; retencja dyskowa nie jest automatycznie egzekwowana. Monitoruj rozmiar katalogu, sygnał procesu i błędne zadania. Pełne awarie procesu są widoczne w systemd/journal, panel sygnalizuje brak heartbeat.

## Weryfikacja

```sh
npm run prospecting:test
npm run typecheck
npx eslint src/app/prospecting prospecting
npm run build
```

Testy logiki korzystają z tymczasowych baz, bez wiadomości i płatnych wywołań. Test przeglądarki `prospecting/tests/browser.mjs` wymaga `PROSPECTING_TEST_ORIGIN` i `PROSPECTING_TEST_PASSWORD`; uruchamiać wyłącznie z testowym katalogiem danych. Rzeczywisty pilotaż modelu jest osobnym sprawdzeniem po konfiguracji klucza.

Źródła implementacji: lokalna dokumentacja Next.js w `node_modules/next/dist/docs`, https://developers.openai.com/api/docs/guides/images-vision, https://developers.openai.com/api/docs/guides/structured-outputs, https://wiki.openstreetmap.org/wiki/Overpass_API/Language_Guide, https://nodejs.org/api/sqlite.html.
