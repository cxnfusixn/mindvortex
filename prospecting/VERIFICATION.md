# Weryfikacja modułu / 2026-09-13

- Build Next.js: przeszedł, oddzielne trasy `/prospecting`, API, raporty i pliki. Sprawdzono manifest zależności: prywatny katalog danych nie jest dołączany do standalone.
- TypeScript i ESLint modułu: przeszły.
- Testy logiki: adresy prywatne, profile współdzielone, deduplikacja, kolejka, zgody, sesje, CSRF, limit analiz, odzyskanie przerwanego zadania, blokada ponownej wysyłki i kodowanie HTML.
- Test przeglądarki: logowanie, odmowa dostępu do API bez sesji, odmowa obcego Origin, dodanie firmy, zlecenie audytu, zapis ustawień, wyłączenie firmy i wylogowanie. Bez wysyłania wiadomości. Sprawdzono szerokości 320, 390, 768, 1024 i 1440 px.
- OSM/Overpass: rzeczywiste wyszukanie firm beauty w Białołęce. Po deduplikacji pierwszego pobrania 74 firmy, 18 własnych witryn. Profile zewnętrzne i brak URL nie są traktowane jako dowód złej strony.
- Chromium z publicznym proxy: 6 screenshotów strony głównej, kontaktu i usług rzeczywistej witryny. Naprawiono obsługę kotwic na jednej stronie oraz zbyt mały łączny limit zasobów dla 6 ekranów.
- Pilotaż modelu: pierwszy model powtarzał niepotwierdzone zarzuty o mapie i klikalności. Dodano niezależną weryfikację, walidację tych twierdzeń i wybrano konfigurowalny GPT-5.4. Finalny raport zawiera 3 obserwacje o czytelności, datowanej zapowiedzi i widoczności ikon, bez twierdzeń o klikalności. Sprawdzono wszystkie 6 obrazów i położenie adnotacji.
- Żadna wiadomość do firm nie została wysłana. Konfiguracja poczty pozostaje wyłączona. Domyślnie automat ma pauzę; proces roboczy działa i pokazuje heartbeat.

## Istniejące testy portfolio

Pełny `npm test -- --workers=2`: **38 przeszło, 5 nie przeszło**.

Niezgodności dotyczą plików niezmienionych przez moduł:

1. `tests/discovery.spec.ts:49` oczekuje słowa „API” w metadanych, a obecny tekst `src/data/seo.ts` go nie zawiera.
2. Trzy przypadki `tests/live-projects.spec.ts` oczekują dawnego nagłówka „NIE TRENUJĘ EGO.” w podglądzie Marcin Bak; istniejący podgląd wyświetla „TRENING PERSONALNY. TWOJA SIŁA I SPRAWNOŚĆ.”.
3. `tests/live-projects.spec.ts:106` oczekuje 10 elementów treningu, a istniejący podgląd ma 6.

Nie zmieniano tych testów, tekstów ani eksportów w ramach prospectingu. Wynik pełnego zestawu nie jest zielony; nie należy przedstawiać go jako takiego.

## Granice uruchomienia

Zweryfikowano lokalne działanie. Produkcyjna instalacja procesu roboczego, trwałego dysku i konfiguracji aplikacji nie została wykonana. Brak automatycznego odczytu odpowiedzi z poczty i egzekwowania retencji dyskowej. Automatyczna weryfikacja modelu ogranicza błędy, lecz nie gwarantuje poprawności wszystkich ocen; limit jest limitem analiz, nie budżetem walutowym.
