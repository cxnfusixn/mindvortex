# Historia kontaktu i blokada duplikatów

Panel pokazuje adres i datę próby wysyłki oraz datę przyjęcia wiadomości przez SMTP. Są filtry wysłanych wiadomości, wcześniejszego kontaktu, niepewnych prób i odpowiedzi. Przyjęcie przez SMTP nie jest potwierdzeniem doręczenia.

SQLite przechowuje send_attempt_at, sent_at i send_email niezależnie od bieżącego statusu firmy. Wysyłka rezerwuje adres w tej samej transakcji, która zmienia status na sending. Ponowienie jest blokowane również dla innej firmy z tym samym adresem (bez rozróżniania wielkości liter). Odpowiedź i ponowny audyt nie usuwają zapisu kontaktu. Zapis znika przy obowiązującym usunięciu danych firmy; dotychczasowy rejestr wykluczonych domen zapobiega jej ponownemu importowi.

Migracja starszych statusów sent/sending/uncertain/replied zachowuje adres jako wcześniej kontaktowany, ale nie dorabia daty wysyłki. Historia dotyczy wiadomości obsłużonych przez moduł; nie importuje wcześniejszych maili wysłanych osobno w Zimbrze.

Weryfikacja: pełne 37 istniejących testów modułu, dodatkowy test historii i wspólnego adresu (4 testy delivery), TypeScript, ESLint, przeglądarka desktop/mobile z kontrolowanymi danymi. Bez wysyłania wiadomości.
