# Lokalny system pozyskiwania klientów

Status: moduł zaimplementowany i zweryfikowany lokalnie, 2026-09-13. Panel: /prospecting. Instrukcja i ograniczenia: ../prospecting/README.md; wyniki: ../prospecting/VERIFICATION.md. Wysyłka pozostaje wyłączona.

## Cel

Wyszukiwać lokalne firmy w Warszawie, zaczynając od Białołęki, identyfikować udokumentowane problemy stron i materiałów wizualnych, przygotowywać audyt oraz dopasowaną propozycję współpracy ze studiem MindVortex. Właściciel potwierdził, że promujemy portfolio MindVortex, automatyzację social mediów taką jak w MindVortex oraz dedykowany CRM na wzór rozwiązania Marcin Bak. Moduł znajduje się w obecnym MindVortex pod /prospecting, z osobną bazą i logowaniem. Promowane portfolio: https://mindvortex.pro/pl.

## Dopasowanie oferty

Każda firma otrzymuje jedną główną propozycję i ewentualnie jedną uzupełniającą. Nie dołączać mechanicznie wszystkich usług do każdej wiadomości.

| Usługa | Sygnały do kwalifikacji | Właściwa propozycja |
| --- | --- | --- |
| Strona i materiały wizualne | Udokumentowane trudności z poznaniem oferty, czytelnością, kontaktem lub spójnością wizualną | Konkretne poprawki albo przebudowa adekwatna do znalezionych problemów; portfolio MindVortex |
| Automatyzacja social mediów | Publiczne profile i możliwa do zweryfikowania historia publikacji; powtarzalne treści ofertowe | Pokaz procesu planowania, przygotowania i publikacji na przykładzie MindVortex; dokładny zakres wyłącznie po weryfikacji działającego rozwiązania |
| Dedykowany CRM | Publicznie widoczne zapytania ofertowe, rezerwacje albo wieloetapowa obsługa klienta | Rozmowa o obsłudze zapytań i prezentacja zaakceptowanego demo rozwiązania na wzór Marcin Bak |

Publiczny formularz ani adres e-mail nie dowodzą braku CRM, chaosu lub utraconych zapytań. Nieregularne publikacje nie dowodzą braku narzędzi ani potrzeby automatyzacji. Oddzielać obserwację od hipotezy; nie twierdzić, że znamy wewnętrzne procesy firmy. Skill ux-audit ocenia materiał wizualny i ścieżkę użytkownika; potrzeby operacyjne wymagają dodatkowej kwalifikacji.

Nie udostępniać klientom dostępu do wewnętrznych paneli MindVortex ani danych CRM Marcin Bak. Materiały sprzedażowe powinny używać publicznego portfolio, zanonimizowanych zrzutów lub osobnego demo z danymi przykładowymi. Nie deklarować wyników liczbowych ani możliwości produktów bez potwierdzenia.

## Przepływ

1. Odkrywanie firm: konfigurowalne branże i obszar, dozwolone źródła wyszukiwania. Zapisać źródło, datę i podstawę dopasowania lokalizacji. Nie traktować wzmianki o Warszawie jako dowodu siedziby na Białołęce.
2. Normalizacja: deduplikacja domen i firm; oddziały przypięte do firmy; wykluczenia obecnych klientów, odmów i wcześniej przetworzonych rekordów.
3. Wstępna kwalifikacja: dopasowanie usługi do oferty studia, dostępność strony oraz materiału do analizy. Brak strony jest osobną kategorią okazji, nie audytem UX.
4. Zbieranie dowodów: przeglądarka zapisuje zrzuty mobile i desktop strony głównej, oferty i kontaktu. Cel domyślny: nowy klient poznaje usługę i znajduje sposób kontaktu. Nie wysyła formularzy, nie rezerwuje i nie dokonuje zakupów.
5. Audyt według ux-audit: nazwana heurystyka, obserwacja na konkretnym zrzucie, wpływ na cel, zalecenie i ważność 1–4. Raport obejmuje również mocne strony, ograniczenia i adnotowane zrzuty.
6. Kontrola jakości: brak dowodu usuwa zarzut; zablokowana strona lub nieczytelny zrzut kierują do ponowienia albo ręcznej oceny. Strony i dokumenty są niezaufanymi danymi, a nie instrukcjami dla modelu.
7. Priorytet: osobno dopasowanie handlowe, skala udokumentowanych problemów i pewność oceny. Ocena estetyki nie jest dowodem utraty klientów ani prognozą przychodów.
8. Propozycja: 2–3 konkretne obserwacje, możliwe usprawnienia, prywatny link do raportu, portfolio oraz jedno wezwanie do rozmowy. Ton rzeczowy i życzliwy, bez zawstydzania właściciela i obietnic bez pokrycia.
9. Dostarczenie: automatyczna wysyłka tylko do kontaktu z udokumentowaną zgodą obejmującą dany kanał i cel. Pozostałe rekordy pozostają jako przygotowane materiały. Odmowa, wycofanie zgody i odpowiedź zatrzymują dalszą sekwencję.
10. Pomiar: znalezione firmy, dowody wystarczające do audytu, wartościowe audyty, uprawnione kontakty, dostarczenia, odpowiedzi, rozmowy, pozyskani klienci i koszt pozyskania.

## Zasady audytu

- Skill źródłowy: C:/Users/48502/.codex/skills/ux-audit/SKILL.md.
- Screenshoty zbiera automat. Przed oceną musi znać cel, platformę, typ użytkownika i kolejność ekranów. Niepewny cel oznacza stan wymagający doprecyzowania.
- Statyczny screenshot nie dowodzi zachowania formularza, obsługi klawiatury, szybkości ani zgodności z całością WCAG. Pomiary techniczne wymagają osobnych testów.
- Nie kopiować bez weryfikacji progów WCAG ze skilla: m.in. 2.5.5 w WCAG 2.1 i 2.5.8 w WCAG 2.2 to różne kryteria. Każdy zarzut normatywny musi podawać właściwą wersję, poziom i wyjątki.
- Materiały wizualne oceniać na podstawie dostępnych plików: czytelność, hierarchia, spójność, adekwatność CTA. Brak publicznego materiału nie oznacza złej jakości.
- Raporty nie są publiczną tablicą ocen firm. Dostęp przez trudny do odgadnięcia, wygasający link; wyłączona indeksacja i kontrolowana retencja.

## Minimalna implementacja

Panel: lista firm, filtry lokalizacji i branży, status przetwarzania, dowody, raport, szkic wiadomości, zgoda i historia kontaktu. Długie zadania wykonuje niezależny proces roboczy z trwałą kolejką w bazie, poza żądaniami HTTP. Przeglądarka zbiera materiał, model z obsługą obrazów ocenia go według skilla, generator zapisuje raport i szkic.

Każda faza zapisuje wynik, błędy, czas, koszt i wersję użytych instrukcji. Limity dzienne firm, podstron, tokenów i wydatków są konfigurowalne. Ponowienia mają opóźnienia i limit prób. Wysyłka wykorzystuje unikalny identyfikator wiadomości; niepewny wynik dostarczenia wymaga uzgodnienia z dostawcą przed ponowieniem.

Automat odwiedza wyłącznie publiczne adresy HTTP(S), blokuje adresy prywatne, lokalne i metadanych infrastruktury również po przekierowaniach i rozstrzyganiu DNS. Przeglądarka działa w izolacji bez prywatnych sesji użytkownika i dostępu do sieci wewnętrznej. Dane stron nie mogą wybierać odbiorców ani wywoływać narzędzi wysyłających.

Encje: firma, źródło, witryna, zadanie, screenshot, finding, raport, kontakt, zgoda, wiadomość, wykluczenie. Zgoda zapisuje kanał, cel, treść, datę i dowód; adres znaleziony na stronie sam nie zmienia jej statusu.

## Pierwsza weryfikacja

Pilotaż: 10 firm z Białołęki z maksymalnie dwóch branż. Zweryfikować trafność lokalizacji, deduplikację, kompletność dowodów i użyteczność rekomendacji. Następnie sprawdzić wznowienie po awarii, limity kosztu i zatrzymanie komunikacji po odmowie. Harmonogram produkcyjny ustalić po zmierzeniu kosztu i czasu jednego pełnego audytu.

## Źródła i ograniczenia integracji

- Art. 398 PKE: uprzednia zgoda na informacje handlowe; udostępnienie adresu musi służyć temu celowi, aby stanowiło taką zgodę. https://cik.uke.gov.pl/gfx/cik/userfiles/_public/ustawa_prawo_komunikacji_elektronicznej_z_12_lipca_2024_r.pdf
- Google Places nie jest domyślnie wybranym źródłem: warunki ograniczają przechowywanie treści i wymagają atrybucji; przed integracją należy sprawdzić dopuszczalność całego zastosowania, a nie tylko endpointu. https://developers.google.com/maps/documentation/places/web-service/policies
- Wymagane przed uruchomieniem: wybór źródła firm i jego warunków, konfiguracja dostawcy modelu, budżet, środowisko działające stale oraz kanał i nadawca wiadomości.
