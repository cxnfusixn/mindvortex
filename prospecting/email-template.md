# Wiadomość MindVortex

Wysyłka zawiera wersję HTML w stylistyce strony MindVortex i alternatywną wersję tekstową. Renderer `lib/email.mjs` używa kolorów z `src/app/globals.css`, układu tabelowego i stylów inline. Podgląd dostępny w karcie firmy przy gotowym szkicu. Bez zewnętrznych fontów i obrazków; wygląd sprawdzony w przeglądarce, nie w klientach poczty. Przycisk raportu pojawia się, gdy szkic zawiera link do gotowego audytu.

Temat: {{firma}} — propozycje usprawnień od MindVortex

Dzień dobry,

przeglądałem stronę {{firma}}. Spisałem kilka uwag, które mogą pomóc osobie odwiedzającej ją po raz pierwszy.

• {{konkretna obserwacja i propozycja zmiany}}

• {{druga obserwacja i propozycja zmiany, jeśli jest uzasadniona}}

W MindVortex projektuję i wdrażam strony. Mogę pomóc wprowadzić te zmiany i dopasować je do Państwa oferty.

Tutaj zebrałem uwagi ze zrzutami ekranu: {{link do gotowego raportu}}

Moje realizacje: https://mindvortex.pro/pl
Instagram: https://www.instagram.com/mindvortex.pro/
TikTok: https://www.tiktok.com/@mindvortex.pro

Czy mogę przesłać propozycję zakresu prac?

Pozdrawiam,
Patryk Pyrka
MindVortex
patryk.pyrka@mindvortex.pro

Jeśli nie chcą Państwo kolejnych wiadomości, wystarczy odpowiedź „nie”.

---

To opis szablonu używanego przez `draftMessage` w `lib/audit.mjs`. Akapit oferty zmienia się zależnie od audytu: strona, social media lub CRM. Obserwacje pochodzą wyłącznie z zatwierdzonych ustaleń audytu; maksymalnie cztery, bez nazw heurystyk i punktacji. Profile można zmienić lub wyłączyć, pozostawiając puste pola w ustawieniach.
