# Wiadomość MindVortex

Wysyłka zawiera wersję HTML w stylistyce strony MindVortex i alternatywną wersję tekstową. Renderer `lib/email.mjs` używa kolorów z `src/app/globals.css`, układu tabelowego i stylów inline. Podgląd dostępny w karcie firmy przy gotowym szkicu. Bez zewnętrznych fontów i obrazków; wygląd sprawdzony w przeglądarce, nie w klientach poczty. Przycisk raportu pojawia się, gdy szkic zawiera link do gotowego audytu.

Temat: {{firma}} — propozycje usprawnień od MindVortex

Dzień dobry,

przeglądałem stronę {{firma}}. Przyjrzałem się temu, jak może odbierać ją osoba, która po raz pierwszy poznaje Państwa ofertę.

• {{konkretna obserwacja i jej wpływ na odbiór marki}}

• {{kolejna obserwacja i jej wpływ na doświadczenie odbiorcy, jeśli jest uzasadniona}}

W MindVortex mogę zaprojektować nową stronę, która spójnie przedstawi Państwa ofertę i poprowadzi odbiorcę do kontaktu. W ramach takiej współpracy możemy też przyjrzeć się identyfikacji wizualnej — od typografii i kolorów po sposób prezentowania marki. Zakres przebudowy warto oprzeć na Państwa celach i tym, co już działa dobrze.

Tutaj zebrałem uwagi ze zrzutami ekranu: {{link do gotowego raportu}}

Moje realizacje: https://mindvortex.pro/pl
Instagram: https://www.instagram.com/mindvortex.pro/
TikTok: https://www.tiktok.com/@mindvortex.pro

Czy są Państwo otwarci na rozmowę o nowej odsłonie marki w internecie?

Pozdrawiam,
Patryk Pyrka
MindVortex
patryk.pyrka@mindvortex.pro

Jeśli nie chcą Państwo kolejnych wiadomości, wystarczy odpowiedź „nie”.

---

To opis szablonu używanego przez `draftMessage` w `lib/audit.mjs`. Akapit oferty zmienia się zależnie od audytu: strona, social media lub CRM. Obserwacje pochodzą wyłącznie z zatwierdzonych ustaleń audytu; maksymalnie cztery, bez nazw heurystyk i punktacji. Profile można zmienić lub wyłączyć, pozostawiając puste pola w ustawieniach.
