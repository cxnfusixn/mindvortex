# Poprawki po audycie bezpieczeństwa

## Zmiany w aplikacji

- SEC-01: limit logowania prospectingu dotyczy hasha adresu klienta otrzymanego od zaufanego proxy. Stara tabela jest migrowana; dawne próby nie blokują nowych klientów. Równoległe obliczenia scrypt mają osobny limit, bez wspólnej 15-minutowej blokady.
- SEC-02: HEAD odczytuje wyłącznie metadane. GET strumieniuje plik z ograniczonym buforem; Range czyta tylko wybrany fragment, obsługuje też sufiks. Nieprawidłowe zakresy nie odczytują treści. Anulowanie żądania zamyka strumień i plik.
- SEC-03: oczekiwanie na fonty ma limit 5 sekund, zbieranie materiału 180 sekund po uruchomieniu przeglądarki. Start Chromium i połączenie z nim mają osobne limity 30 i 10 sekund. Nadrzędny timer jest poza stroną i zabija proces przeglądarki. Wszystkie ścieżki sprzątają proxy. Zadanie trwające ponad 10 minut nie jest prezentowane jako sprawny worker tylko dlatego, że nadal wysyła heartbeat.
- SEC-04: oba adaptery SMTP wymagają STARTTLS, jeśli nie używają implicit TLS na porcie 465. Nieprawidłowy port jest odrzucany. Wyłączono pobieranie plików i URL przez Nodemailera.
- Handlery social odczytują JSON strumieniowo, ograniczając liczbę bajtów także bez Content-Length. Zachowano dotychczasową autoryzację i kontrolę Origin.
- Nagłówki ochronne są w obu konfiguracjach Next, także poza nginx. CSP w produkcji nie dopuszcza `unsafe-eval`; skrypty inline pozostają wymagane przez obecny rendering Next i statyczne podglądy. HSTS nie obejmuje automatycznie innych subdomen.

## Uruchomienie na serwerze

To zmiany w repozytorium; samo ich przygotowanie nie aktualizuje VPS.

1. Główna usługa musi być dostępna tylko przez loopback i nginx musi nadpisywać `X-Real-IP` wartością `$remote_addr`. Nowa jednostka ustawia `PROSPECTING_TRUST_PROXY=true`. Nie włączać tej flagi przy bezpośrednim dostępie klientów do portu Node. Bez tej konfiguracji produkcyjne logowanie odmawia działania, zamiast ufać nagłówkom od klienta.
2. `deploy/release.sh` instaluje nowe jednostki z kopii zachowanej przed buildem. Aktualizując ręcznie, zainstalować obie jednostki `mindvortex*.service` i wykonać `systemctl daemon-reload`. Dodatkowy plik środowiska prospectingu jest opcjonalnie ładowany przez jednostkę strony.
3. Buildy działają jako `mv-site-build` / `mv-social-build`, z osobnym katalogiem cache i bez dostępu do sekretów ani stanu produkcji. Wszystkie trzy instalacje npm mają `ignore-scripts=true`; wdrożenia wykonują `npm ci --ignore-scripts` i audyt z progiem high. Nie ma wyjątków dla skryptów instalacji: root ma wyłącznie skrypt `unrs-resolver`, a jego prekompilowane zależności opcjonalne nie wymagają wykonania tego skryptu. Nie należy automatycznie znosić blokady po zmianie lockfile — najpierw przejrzeć wymagany krok i przetestować czystą instalację.
4. Kod głównej aplikacji i przeglądarki po buildzie ma właściciela root. Runtime zapisuje tylko stan i cache. Ścieżka `current` oraz katalog `releases` również nie należą do konta runtime. Preview-only release zachowuje te uprawnienia. Jednostki systemd ograniczają zapis; worker ma limit pamięci i liczby zadań systemowych.
5. W social uprzywilejowana migracja środowiska i pliki jednostek są kopiowane do prywatnego katalogu `/run` przed buildem, aby zależność uruchomiona podczas budowania nie mogła ich podmienić przed wykonaniem jako root. Katalog znika przy restarcie systemu.

Składnię skryptów można sprawdzić lokalnie, ale reguły systemd, uprawnienia użytkowników i nginx wymagają sprawdzenia na docelowym Linuksie. Nowe jednostki pozostają przy rollbacku kodu; są zgodne ze starszym układem aplikacji, z wyjątkiem konieczności posiadania zapisywalnego katalogu `.next/cache` dla funkcji, które z niego korzystają.

## Retencja zatwierdzona przez użytkownika: 180 dni

Okres liczymy od `leads.updated_at`. Nowy kontakt, zmiana danych, statusu, audytu lub szkicu odnawia aktywność. Zlecenie nowego zadania odnawia aktywność; zadania w trakcie pracy są pomijane. Stare, niewykonane kolejki również wygasają po 180 dniach. Ręczne usunięcie odmawia działania dla kontaktu właśnie audytowanego lub wysyłanego.

Polecenia uruchamiać z katalogu aplikacji, z właściwym `PROSPECTING_DATA_DIR`. Podgląd nie usuwa danych:

```sh
node prospecting/retention.mjs preview
node prospecting/retention.mjs erase IDENTYFIKATOR
```

Po zatrzymaniu web i workera można zastosować listę lub usunąć pojedynczy kontakt:

```sh
node prospecting/retention.mjs prune --apply --services-stopped
node prospecting/retention.mjs erase IDENTYFIKATOR --apply --services-stopped
```

Kasowane są kontakt, audyty, zadania, powiązane zużycie i katalog jego dowodów. Ponieważ starszy dziennik zdarzeń nie zawiera powiązań z kontaktem i może zawierać nazwy, przy usunięciu czyszczony jest również ten dziennik operacyjny. Symlinki i junctions do zewnętrznych katalogów powodują odmowę. SQLite używa secure_delete; tryb administracyjny dodatkowo wykonuje checkpoint, VACUUM i obcięcie WAL.

Pozostaje minimalny rejestr wykluczeń: hash domeny, UUID i data usunięcia, bez nazwy firmy, adresu e-mail i raportów. To dane pseudonimowe służące wyłącznie blokadzie ponownego importu i odtwarzaniu usunięć po przywróceniu backupu; nie są przedstawiane jako anonimowe.

Automatyczne egzekwowanie jest dostępne po ustawieniu `PROSPECTING_RETENTION_ENABLED=true` dla workera i jego restarcie. Wówczas raz dziennie usuwa kwalifikujące się rekordy. Nowa jednostka workera ustawia tę flagę, więc retencja zacznie działać po jej wdrożeniu. Nie zmieniono istniejącej instalacji. Przed wdrożeniem sprawdzić podgląd i kopie zapasowe; świadome odroczenie jest możliwe przez PROSPECTING_RETENTION_ENABLED=false w pliku środowiska. Przegląd dzienny nie przesuwa dat aktywności zachowanych kontaktów.

Eksport danych kontaktu, historii oraz bieżących plików jako base64:

```sh
umask 077
node prospecting/retention.mjs export IDENTYFIKATOR > /prywatny/katalog/export.json
```

Eksport zawiera dane prywatne — podlega tym samym zasadom dostępu i usuwania.

### Kopie zapasowe i odtwarzanie

Po usunięciu zachować najnowszy `PROSPECTING_DATA_DIR/erasures.jsonl` osobno od starszych backupów, z dostępem tylko dla administratora. Nie nadpisywać go starszą wersją przy odtwarzaniu. Dotychczasowych zaszyfrowanych kopii nie można wybiórczo wyczyścić samą operacją SQL; nadać im krótki cykl życia (zalecane 14 dni) i usunąć kopie wykraczające poza zatwierdzony okres. Wdrożenie nie usuwa istniejących backupów automatycznie.

Odtwarzać wyłącznie offline, przed uruchomieniem web i workera. Na odtworzonej bazie odtworzyć najnowszy rejestr usunięć:

```sh
node prospecting/retention.mjs replay /prywatny/katalog/najnowsze-erasures.jsonl
node prospecting/retention.mjs replay /prywatny/katalog/najnowsze-erasures.jsonl --apply --services-stopped
node prospecting/retention.mjs prune --apply --services-stopped
```

Dopiero potem udostępnić usługę. Backup, który zawiera usunięte dane, pozostaje prywatny i nie może być używany do analizy ani komunikacji. Retencja 180 dni nie uzasadnia ponownego kontaktowania firm z rejestru wykluczeń.

## Osobny origin dla podglądów

Dodano konfigurację `deploy/previews-nginx.conf` dla `previews.mindvortex.pro`. Po skonfigurowaniu DNS i HTTPS ustawić przy buildzie `NEXT_PUBLIC_PREVIEW_ORIGIN=https://previews.mindvortex.pro`. To ustawienie publiczne, nie sekret. Przekazać origin jako trzeci argument `deploy/release.sh ARCHIWUM COMMIT ORIGIN`; skrypt przekazuje wyłącznie tę jawną wartość, bez ładowania sekretów.

Główna aplikacja przekieruje `/previews/*` na ten host, a ramki będą korzystać bezpośrednio z nowego originu. Podglądy mają wyłącznie statyczne pliki; nie przekierowywać z nowego hosta do API, logowania ani usługi Node. CSP pozwala osadzać je na głównej stronie. Cookies paneli są host-only, więc przeglądarka nie wysyła ich do subdomeny.

Bez ustawienia tej zmiennej pozostaje obecny, działający układ podglądów. Izolacja originu wymaga więc aktywacji DNS/nginx i nowego buildu; nie została pozornie oznaczona jako wdrożona. Do tego czasu publikowane podglądy należy traktować jak kod z pełnym zaufaniem do originu aplikacji.

Statyczny nginx czyta osobny katalog `/var/www/mindvortex-previews/previews`, nie prywatny katalog kodu `root:mindvortex`. Przed aktywacją skopiować tam zatwierdzone `public/previews`, nadać plikom grupę `www-data` i wyłącznie odczyt (katalogi 0750, pliki 0640). Po każdej aktualizacji podglądów odświeżyć tę kopię. Nie dodawać użytkownika nginx do grupy `mindvortex`, ponieważ ta grupa ma dostęp do sekretów aplikacji.

W trakcie prac repozytorium otrzymało niezależną integrację kopii wysłanych wiadomości z IMAP. Retencja usuwa także lokalne `sent.eml` i stan `sent-copy:ID`; eksport obejmuje plik EML. Kopia już zapisana na zewnętrznym serwerze poczty nie jest kasowana przez operację lokalną. Jej retencję należy skonfigurować w skrzynce, a indywidualne usunięcie odnaleźć po `Message-ID: <prospecting-ID@mindvortex.pro>`. Nie uruchamiano usuwania z poczty ani zmiany jej polityki.

## Weryfikacja lokalna

- Prospecting: 32 testy przeszły, w tym migracja starego limitera, TLS z lokalnym serwerem bez STARTTLS, zakończenie procesu Chromium, retencja, eksport i replay po odtworzeniu bazy.
- Social: 30 testów przeszło, w tym ograniczone odczyty Range/HEAD, anulowanie strumienia, limit JSON i TLS poczty OTP.
- Przeglądarka: 4 testy formularza i zabezpieczeń przeszły. Strony wszystkich trzech podglądów renderują się bez zgłoszeń naruszeń CSP.
- TypeScript oraz lint zmienianych modułów: poprawne. Oba buildy produkcyjne przeszły. Social nadal zgłasza ostrzeżenia Turbopack o dynamicznych ścieżkach w rendererach wideo.
- Czyste instalacje npm z wyłączonymi skryptami przeszły; przetestowano ładowanie modułów natywnych. Audyt bieżącego głównego lockfile po równoległym dodaniu IMAP: zero zgłoszonych podatności.
- Składnia czterech zmienionych skryptów Bash: poprawna.
- Cztery wcześniejsze testy `tests/live-projects.spec.ts` nie przeszły: oczekują tekstu „NIE TRENUJĘ EGO.” i 10 sekcji treningowych, podczas gdy zapisany podgląd zawiera „TRENING PERSONALNY.” i 6 sekcji. Pliki tych testów i `public/previews` są niezmienione względem HEAD; nie zmieniano ich, aby ukryć rozbieżność.

Nie wykonywano wdrożenia, kasowania danych produkcyjnych, usuwania wiadomości z IMAP ani testów z rzeczywistymi danymi logowania. Osobny origin podglądów i retencja starych kopii wymagają opisanych kroków operacyjnych.
