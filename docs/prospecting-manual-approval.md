# Ręczne zatwierdzanie audytu

W karcie firmy sekcja „Zatwierdzenie audytu” pozwala zatwierdzić aktualny raport i wiadomość przed ręczną wysyłką. Zapis w audit_history (reviewed) oraz manualApprovedAt zachowuje ślad przeglądu, bez zmiany pewności modelu. Zatwierdzenie jest związane z adresem i treścią wiadomości; nowy audyt wymaga nowego przeglądu. Akcja nie wysyła maila.

Audyt musi być zakończony, zweryfikowany, zawierać uzasadnioną ofertę i istotne ustalenia. Raport musi być aktualny, kontakt aktywny. Ręczny przegląd pozwala zaakceptować niższą pewność modelu; automatyczna wysyłka nadal wymaga wysokiej pewności. Panel pokazuje konkretny powód blokady.

Implementacja: prospecting/lib/approval.mjs, delivery.mjs, src/app/prospecting/api/route.ts i lead-detail.tsx. Weryfikacja: 37 testów modułu, TypeScript, ESLint oraz test przycisku w przeglądarce z kontrolowanymi danymi (bez wysyłki).
