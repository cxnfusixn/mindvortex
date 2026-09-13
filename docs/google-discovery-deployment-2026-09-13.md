# Google Places — wdrożenie

Kod `37a1d387b0c66c569991c007b758689a65930981` wdrożony do
`/opt/mindvortex/releases/20260913165850/.next/standalone`.

Klucz zapisany lokalnie w `.env.prospecting.local`, na serwerze w
`/etc/mindvortex-prospecting.env` i w prywatnym Obsidianie
`Secrets/Google Places.md`. Wartość klucza nie trafiła do repozytorium ani odpowiedzi API panelu.

Test Places API: HTTP 200. Test lokalny Białołęka/beauty: 10 własnych stron,
7 nowych kontaktów. Test produkcyjny z przycisku: odpowiedź uruchamiająca po
118 ms, 9 sprawdzonych stron, 5 nowych firm, 3 bez e-maila, 1 istniejąca.
Proces zakończył się statusem done. Google może zwracać inne wyniki przy kolejnych zapytaniach.

Weryfikacja: 36 testów prospectingu; dodatkowo po rozszerzeniu listy platform
14 testów filtrów i Google. Lint bez błędów (jedno wcześniejsze ostrzeżenie),
TypeScript i produkcyjny build poprawne. Przeglądarka: brak błędów JS,
postęp i wynik widoczne, brak poziomego przepełnienia na telefonie.
Web i worker aktywne, healthcheck poprawny. Lokalny web i worker uruchomione ponownie z kluczem.

Wyszukiwanie sprawdza pierwsze maksymalnie 20 wyników Google. Nie oznacza
pełnej listy firm dzielnicy. Pobranie pola websiteUri korzysta z płatnego
SKU Text Search Enterprise, zgodnie z rozliczeniami konta Google.
Nazwy i kontakty przechowywane w bazie odczytywane są ze stron firm;
odpowiedzi Places pozostają w pamięci procesu.
