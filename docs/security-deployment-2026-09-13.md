# Wdrożenie poprawek bezpieczeństwa — 2026-09-13

Wdrożony kod: `359e6909d0edcdc1d446c2f3c7955e402fed78c3`, gałąź `codex/prospecting-module`, wypchnięty do origin.

- Główna aplikacja: `/opt/mindvortex/releases/20260913133812/.next/standalone`.
- Studio Social: `/opt/mindvortex-social/releases/20260913133954`.
- Prywatna kopia konfiguracji, danych prospectingu, stanu Social i zrzutu PostgreSQL: `/root/mindvortex-before-security-20260913133750` (dostęp administratora).
- Poprzednia główna wersja: `/opt/mindvortex/releases/20260913124320/.next/standalone`; poprzednie Social: `/opt/mindvortex-social/releases/20260913080340`.

Buildy wykonano z archiwów commita przez izolowane konta bez dostępu do sekretów produkcyjnych. Instalacje npm i audyty zakończyły się bez podatności. Lint głównej aplikacji: zero błędów, jedno istniejące ostrzeżenie o nieużywanej zmiennej w generatorze grafik. TypeScript i oba buildy przeszły. Social: 30/30 testów; pozostały wcześniejsze ostrzeżenia Turbopack o dynamicznych ścieżkach rendererów wideo.

Po wdrożeniu wszystkie cztery usługi (web i worker obu aplikacji) były aktywne, z zerowym licznikiem restartów awaryjnych. HTTPS: `/pl`, `/prospecting`, `/studio-social/login` i healthcheck odpowiadały 200; API obu paneli bez sesji odpowiadały 401. Potwierdzono CSP i nosniff. HEAD rzeczywistego publicznego wideo zwrócił metadane bez treści, Range `bytes=0-127` zwrócił 206 i dokładnie 128 bajtów. Syntetyczny test Chromium jako użytkownik aplikacji, z ograniczeniami systemd i włączonym sandboxem, przeszedł.

Retencja 180 dni jest aktywna. Worker zapisał pierwszy przegląd na 2026-09-13; pięć kontaktów pozostało w bazie, żaden nie kwalifikował się do usunięcia. Wysyłka prospectingu pozostała wyłączona (`PROSPECTING_SEND_ENABLED=false`). Nie wykonywano testowej wysyłki ani wymuszonej publikacji Social.

Z powodu 97% zajętości dysku usunięto odtwarzalne katalogi `node_modules` i `.next` ze starszych wydań głównej aplikacji, zachowując pięć najnowszych wydań oraz źródła starszych. Przed buildami dostępne miejsce wzrosło z 1,4 GB do 19 GB.

## Pozostałe zależności operacyjne

`previews.mindvortex.pro` nie rozwiązuje się w DNS. Nie aktywowano osobnego originu ani przekierowań; aktualne podglądy pozostają dostępne w dotychczasowej konfiguracji. Aktywacja wymaga DNS, HTTPS i kroków z `security-fixes-2026-09-13.md`.

Lokalna retencja nie usuwa kopii wiadomości na zewnętrznym serwerze IMAP. Polityka skrzynki i retencja starych backupów pozostają osobnymi zadaniami operacyjnymi; prywatna kopia sprzed wdrożenia nie otrzymała automatycznego harmonogramu usuwania.
