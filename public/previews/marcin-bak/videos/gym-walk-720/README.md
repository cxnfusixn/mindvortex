# Filmy do spaceru po sali

Pliki `1.mp4`–`9.mp4` to kopie do wyświetlania w witrynie, przygotowane z filmów o tych samych nazwach w `public/images/generated-walk-final`.

- Rozdzielczość: **1080 × 720 px**, proporcje **3:2**, 24 kl./s.
- Format: MP4 / H.264, yuv420p, bez dźwięku, faststart.
- Kadr: usunięte około 8,16% dolnej części i po 4,08% z boków. Watermark w prawym dolnym rogu znajduje się poza wynikowym kadrem. Obraz nie jest rozciągnięty.
- Wyjściowe filmy 1–3 mają 1764 × 1176 px, a 4–9 mają 1176 × 784 px. Wszystkie kopie mają jednakową rozdzielczość.
- Oryginały pozostają w katalogu źródłowym.
- `manifest.json` zawiera ścieżki filmów, plakatów i przypisanie przejść `n → n+1` według numeracji plików.

Podgląd: otwórz `index.html` w tym folderze lub `/videos/gym-walk-720/index.html` na lokalnej stronie.

Ponowne przygotowanie: `py scripts/prepare-walk-videos.py` (wymaga `imageio-ffmpeg`, alternatywnie parametr `--ffmpeg ŚCIEŻKA`).

Filmy są podłączone do przewijania przez `components/walk-background.tsx`.
Każdy klip prowadzi od początku jednej głównej sekcji do początku następnej.
Łączenie scen zajmuje maksymalnie 80 px przewijania (do 12% krótkiego odcinka)
i miesza poprzednią klatkę końcową z początkiem nowego filmu.
Kontakt zatrzymuje ostatnią klatkę klipu 9.
Pozycja klatki nie zależy od upływu czasu. Odtwarzanie automatyczne jest wyłączone.
Krótkie wygładzenie wejścia (stała czasowa 110 ms) łagodzi skoki kółka myszy
i całkowicie wygasa po zatrzymaniu scrolla. Ruch kamery jest liniowy względem
wygładzonej pozycji scrolla. Każda klatka H.264 jest klatką kluczową,
co ułatwia dekodowanie podczas przewijania w obie strony. Sąsiednie klipy
przygotowują odpowiednio ostatnią i pierwszą klatkę przed przejściem.
Podsekcje treningowe należą do przejścia 3, a galeria i FAQ do przejścia 9.
Treningi tworzą jedną sekcję z pełnymi opisami dziesięciu dyscyplin
(`components/training-sequence.tsx`). Numerowana lista ma dwie kolumny na
komputerze i jedną na telefonie. Nie zatrzymuje przewijania ani nie ukrywa tekstu.
Film 3 nadal kończy się na początku ringu. Adresy `#sekcja-*` prowadzą do
odpowiedniej dyscypliny.
Przy ograniczeniu animacji lub błędzie pobierania widoczne są nieruchome kadry.

Weryfikacja: `npm run build`, następnie `npm exec playwright -- test`.
