# Wyszukiwanie dzielnic i postów branżowych

Wdrożenie 2026-09-13:

- Prospecting: `2f55f208b59be70a6d9b41189274e6ec447ec2e1`, wydanie `/opt/mindvortex/releases/20260913135000/.next/standalone`.
- Social Studio: `245a103`, wydanie `/opt/mindvortex-social/releases/20260913135645`.
- Obie aplikacje i oba workery aktywne. Lokalny worker prospectingu uruchomiony ponownie z bieżącego kodu.

Prospecting udostępnia wszystkie 18 dzielnic oraz całą Warszawę. Nazwy i poziomy granic potwierdzono w podstawowym API OpenStreetMap (Warszawa: relacja 336074, poziom 8; dzielnice: 18 relacji podrzędnych, poziom 9). Ręczne wyszukiwanie działa przy pauzie; inny obszar przy istniejącym zleceniu daje jawny błąd. Publiczne instancje Overpass podczas sprawdzania zwracały HTTP 504, więc nie potwierdzono aktualnego importu z tego źródła.

Social: Wzrost → Posty branżowe i komentarze. Osobny przełącznik codziennego wyszukiwania (domyślnie wyłączony), przycisk Szukaj teraz, trwałe statusy oraz błędy. Worker obsługuje kolejkę niezależnie od publikowania. Dane: PostgreSQL `social_discovery` oraz `social_engagement`. Faktyczne prompty: `social/automation/lib/engagement.mjs`. Komentarze po polsku lub angielsku, zgodnie z językiem publikacji. Zatwierdzenie nie publikuje komentarza; automatyczne polubienia nie są zaimplementowane.

Test produkcyjny ujawnił przekazywanie JSON-a jako dosłownego zapytania wyszukiwarki. Naprawiono wejście i dodano regresję. Po poprawce produkcyjne zlecenie przeszło queued → running → done, ale nie znalazło dostępnych, cytowanych postów. Nie potwierdzono skutecznego pozyskiwania postów ani generowania komentarzy z automatycznie znalezionych źródeł. Ograniczenie dostępności źródła pozostaje; ręczne dostarczenie linku i kontekstu jest dostępne. Codzienny automat pozostał wyłączony.

Weryfikacja: 33 testy prospectingu, 31 testów Social Studio, integracja PostgreSQL z wycofaniem danych testowych, lint i TypeScript głównej aplikacji, oba produkcyjne buildy. Przeglądarka: wybór dzielnic, obie platformy, zlecenie wyszukiwania, blokada ponownego kliknięcia, ochrona origin, brak błędów JavaScript i poziomego przepełnienia na desktopie oraz telefonie. Pozostały wcześniejsze ostrzeżenia renderowania wideo Turbopack i jedno ostrzeżenie lint w generatorze grafik.

Podczas tej weryfikacji nie wysłano maili, nie opublikowano komentarzy ani polubień. Tymczasowa sesja QA została usunięta po testach.
