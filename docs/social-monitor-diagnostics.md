# Diagnostyka alertów Social Studio — 2026-09-14

Monitor rozdziela panel HTTP, PostgreSQL, heartbeat workera i miejsce na dysku. Błąd jednej kontroli nie przerywa pozostałych. Niedostępna baza oznacza nieznany stan workera, zamiast fałszywego rozpoznania jego awarii. Mail zawiera nazwy uszkodzonych komponentów, czas, wartości pomiarów, analizę możliwych skutków oraz do ośmiu ostatnich zdarzeń aplikacji z 30 minut. Znane sekrety środowiska i nagłówki Bearer są usuwane z diagnostyki.

Zmiana zestawu uszkodzonych komponentów wywołuje nowy alert; powtórzenia tego samego zestawu pozostają ograniczone do sześciu godzin. Mail o poprawie wymienia poprzedni problem i bieżące wyniki. Flaga --dry-run nie wysyła maila ani nie zmienia stanu powiadomień. Monitor ma własną pulę PostgreSQL z limitami połączenia i zapytania 5 sekund.

Diagnoza incydentu: dysk miał 424 MB wolnego (1%), podczas gdy usługi panelu i workera były aktywne. Usunięto trzy nieaktywne, odtwarzalne wydania 20260914051218, 20260914075541, 20260914080144; pozostało 5,2 GB (13%). Nie usuwano danych aplikacji ani aktualnego/poprzedniego wydania.

Wdrożono bez przebudowy panelu: monitor.mjs oraz lib/monitor.mjs w aktywnym wydaniu Social Studio. Monitor jest uruchamiany przez istniejący timer. Poprzedni plik zachowano jako monitor.mjs.before-diagnostics. Testy diagnostyki: 3/3, składnia Node i ESLint bez błędów. Końcowy odczyt --dry-run przez SSH nie został potwierdzony z powodu timeoutów połączenia; publiczny healthcheck aplikacji zwraca OK.

