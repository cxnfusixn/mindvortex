# Zatwierdzone zasady wiadomości MindVortex

Zatwierdzone przez użytkownika 2026-09-13 po wspólnej pracy nad przykładem Fenice. Obowiązują przy wszystkich kolejnych firmach. Personalizujemy treść i ofertę, zachowując poniższe zasady. Nie kopiujemy ustaleń Fenice do innych klientów.

## Kwalifikacja i audyt

- Zapisujemy wyłącznie firmy z własną stroną i poprawnym e-mailem. Sam telefon nie wystarcza. Odrzucamy profile Booksy i innych platform, również przekierowania do nich.
- Przed przygotowaniem propozycji wykonujemy rzeczywisty audyt wizualny i UX według `ux-audit`, na desktopie i mobile. Odczyty techniczne są osobną częścią analizy. Nie przedstawiamy przykładowego tekstu jako wykonanego audytu.
- Zapisujemy w SQLite wynik wstępny, zweryfikowany i ewentualny dodatkowy przegląd wraz z datą, modelem i oryginalnymi zrzutami. Kolejne audyty nie zastępują historii.
- Raport może zawierać do 12 udokumentowanych ustaleń. Nie wymuszamy liczby problemów, nie wymyślamy skutków biznesowych i nie uznajemy hipotez za fakty.

## Cel i treść maila

- Piszemy naturalnie, rzeczowo i z perspektywy pierwszego odbiorcy strony: co trudno zauważyć, odczytać lub zrozumieć i jak wpływa to na odbiór marki czy kontakt.
- Do 4 najważniejszych punktów: diagnoza i znaczenie dla odbiorcy. Bez instrukcji wykonawczych, parametrów CSS, współrzędnych, nazw heurystyk, punktacji i technicznego żargonu.
- Nie piszemy o zrzutach, screenshotach, modelach, AI, ograniczeniach statycznej analizy ani o tym, że „nie oceniamy klikalności”. Takie informacje należą wyłącznie do audytu wewnętrznego.
- Nie przekazujemy klientowi gotowej listy napraw. Celem jest rozmowa o współpracy: nowej stronie, spójnej warstwie wizualnej oraz potencjalnym odświeżeniu identyfikacji. Zakres opieramy na ustaleniach i celach klienta; nie twierdzimy bez dowodów, że pełna przebudowa jest konieczna.
- Social media i dedykowany CRM proponujemy, kiedy pasują do firmy, jako temat do rozmowy — nie udajemy wiedzy o jej systemach wewnętrznych.
- Przy propozycji nowej strony dodajemy krótki akapit o automatyzacji przygotowywania, planowania i publikacji treści social media, z odniesieniem do rozwiązań używanych w MindVortex. To dodatkowa możliwość, warunkowo odniesiona do potrzeb firmy; nie obietnica wyników ani diagnoza jej obecnego procesu. Nie powtarzamy akapitu, gdy social media są główną ofertą.
- Jeden naturalny wstęp, konkretne punkty, dopasowana oferta i jedno pytanie końcowe. Bez nacisku, obietnic wzrostu sprzedaży i określania strony jako „kiepskiej”.
- Nie dodajemy linku ani przycisku do raportu, w szczególności „Zobacz uwagi do strony”. Raporty i zrzuty są wewnętrzne i wymagają logowania.
- Nie dodajemy zdania „Jeśli nie chcą Państwo kolejnych wiadomości…” ani wariantów prośby o odpowiedź „nie”. To zatwierdzona preferencja redakcyjna; nie oznacza oceny podstawy prawnej wysyłki.
- Zachowujemy podpis Patryka Pyrki i linki do portfolio, Instagrama oraz TikToka MindVortex.

## Warstwa wizualna

- HTML spójny ze stroną MindVortex: tło `#050706`, powierzchnia `#101411`, akcent `#35f46a`, tekst `#f2f4f3`.
- Treść akapitów i punktów wyjustowana; ostatnia linia do lewej. Powitanie, nagłówek, linki i podpis wyrównane do lewej.
- Układ tabelowy do 600 px, style inline, czytelne odstępy i wersja mobilna. Fonty systemowe, bez zewnętrznych obrazów, skryptów i pikseli śledzących.
- Wiadomość ma wersję HTML i alternatywną tekstową. Linki społecznościowe są edytowalne w ustawieniach.

## Źródła obowiązującego wzorca

- Tekst: `email-template.md`; generator: `lib/audit.mjs` → `draftMessage`.
- HTML: `lib/email.mjs` → `emailHtml`.
- Portfolio: https://mindvortex.pro/pl
- Instagram: https://www.instagram.com/mindvortex.pro/
- TikTok: https://www.tiktok.com/@mindvortex.pro
- Lokalny przykład zatwierdzonego wyglądu: `qa/prospecting/fenice-audited-email.html`. To przykład dla Fenice, nie treść do kopiowania innym firmom.

Przed uznaniem nowej wiadomości za gotową sprawdź tekst i wyrenderowany HTML: personalizację, oparcie w audycie, brak wewnętrznych komentarzy i instrukcji naprawy, brak linku do raportu oraz zgodność stylu. Samo przygotowanie lub zatwierdzenie szablonu nie uruchamia wysyłki.
