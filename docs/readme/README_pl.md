<div align="center">

[English](README_en.md) · [简体中文](README_zh.md) · [繁體中文](README_zh-TW.md) · [日本語](README_ja.md) · [한국어](README_ko.md) · [Türkçe](README_tr.md) · [Русский](README_ru.md) · [Tiếng Việt](README_vi.md) · [ไทย](README_th.md) · [Deutsch](README_de.md) · [Español](README_es.md) · [Français](../../README.md) · [Українська](README_uk.md) · **Polski** · [Português (Brasil)](README_pt-BR.md) · [العربية](README_ar.md) · [فارسی](README_fa.md) · [Bahasa Indonesia](README_id.md) · [Italiano](README_it.md)
· [Ελληνικά](README_el.md) · [മലയാളം](README_ml.md) · [Roman Urdu](README_ur-Latn.md) · [Română](README_ro.md)

</div>

# Mythos — lokalny pakiet biurowy synchronizowany bez serwera

![Ekran główny](../../docs/screenshots/home.png)

| Tekst | Arkusz | Prezentacje |
|---|---|---|
| ![](../../docs/screenshots/writer.png) | ![](../../docs/screenshots/sheet.png) | ![](../../docs/screenshots/slides.png) |

| Ustawienia | Tryb ciemny |
|---|---|
| ![](../../docs/screenshots/settings.png) | ![](../../docs/screenshots/home-dark.png) |

**Synchronizacja 4-cyfrowym kodem**: na jednym urządzeniu wybierz *Synchronizacja → Pokaż kod*, na drugim *Wpisz kod*. Kod służy wyłącznie do odnalezienia się na przekaźniku (ntfy.sh, do zmiany w Ustawieniach), a zaproszenie jest tam zaszyfrowane. Potem dokumenty przechodzą bezpośrednio z jednego urządzenia na drugie.

Edytor tekstu, arkusz kalkulacyjny i prezentacje w jednej aplikacji na **Windows, Linuksa i Androida**.
Pliki zostają na twoich urządzeniach; synchronizacja odbywa się bezpośrednio między urządzeniami.

## Instalacja

| System | Plik | Lokalizacja |
|---|---|---|
| Windows | `Mythos-Setup-1.1.0.exe` (instalator) lub `Mythos-Portable-1.1.0.exe` | `release/` |
| Linux | `Mythos-1.1.0-x64.tar.gz` (rozpakuj i uruchom `./mythos`); AppImage kompiluje się pod Linuksem poleceniem `npm run dist:linux` | `release/` |
| Android | `app-debug.apk` | `android/app/build/outputs/apk/debug/` |

Pliki nie są podpisane: Windows SmartScreen poprosi o wybranie „Więcej informacji → Uruchom mimo to”,
a Android poprosi o zezwolenie na instalację aplikacji z nieznanych źródeł.

## Ponowna kompilacja

```sh
npm install
npm run dev          # wersja przeglądarkowa do programowania (http://localhost:5173)
npm start            # aplikacja desktopowa
npm run dist:win     # instalator Windows → release/
npm run dist:linux   # AppImage + tar.gz → release/ (najlepiej uruchamiać pod Linuksem)
npm run android      # kopiuje stronę do android/, a potem:
cd android && gradlew assembleDebug   # JAVA_HOME = JDK 21
```

## Synchronizacja bez serwera

Każdy dokument to **CRDT Yjs** przechowywany w IndexedDB. Dwa urządzenia, które zmieniły ten sam dokument offline,
automatycznie scalają swoje zmiany, bez konfliktów i bez zasady „wygrywa ostatnia wersja”.

Trzy sposoby łączenia urządzeń (panel **Synchronizuj**):

1. **Bezpośrednie parowanie (WebRTC)**: urządzenie A pokazuje kod QR z zaproszeniem, B go skanuje (lub wkleja kod)
   i pokazuje kod QR z odpowiedzią, który z kolei skanuje A. Połączenie jest potem szyfrowane end-to-end (DTLS)
   i działa w czasie rzeczywistym. W lokalnej sieci Wi-Fi nie jest używany żaden serwer; opcja „przez Internet” używa publicznego serwera STUN
   wyłącznie do ustalenia adresu publicznego (żadne dane przez niego nie przechodzą). Trzeba to powtarzać przy każdym otwarciu aplikacji.
2. **Folder współdzielony** (Windows / Linux): wybierz folder synchronizowany przez Syncthing, pendrive lub udział sieciowy.
   Każde urządzenie zapisuje tam własny plik `mythos-<id>.mythos` i co 5 s odczytuje pliki pozostałych.
3. **Plik `.mythos`**: ręczny eksport/import całej przestrzeni (e-mail, pendrive…). Import scala dane, niczego nie nadpisuje.

Urządzenia przekazują sobie zmiany: jeśli A jest połączone z B, a B z C, zmiany z A docierają do C.

## Obsługiwane formaty

| | Import | Eksport |
|---|---|---|
| Tekst | .docx, .html, .txt, .md | .docx, PDF (drukowanie) |
| Arkusz | .xlsx, .xls, .ods, .csv | .xlsx, .csv |
| Prezentacje | .pptx | .pptx, PDF (drukowanie) |

Analizę działania Worda, Excela i PowerPointa, która ukierunkowała projekt, znajdziesz w [docs/ANALYSE.md](../../docs/ANALYSE.md) (po francusku).

## Struktura

```
src/main.js            ekran główny, routing, import plików
src/store.js           pamięć lokalna (Y.Doc + IndexedDB), biblioteka
src/sync/              protokół synchronizacji, WebRTC, folder współdzielony, interfejs
src/apps/writer.js     edytor tekstu (ProseMirror/Tiptap)
src/apps/sheet.js      arkusz kalkulacyjny (siatka canvas)
src/apps/formula.js    silnik formuł
src/apps/slides.js     prezentacje
src/io/                konwersje docx / xlsx / pptx
electron/              aplikacja desktopowa (Windows, Linux)
android/               projekt Android (Capacitor)
```

## Znane ograniczenia

- Tekst: brak śledzenia zmian, komentarzy, nagłówków/stopek i prawdziwego podziału na strony na ekranie
  (podziały stron są zachowywane przy drukowaniu i w pliku .docx).
- Arkusz: brak wykresów, scalania komórek, formatowania warunkowego i tabel przestawnych;
  import .xlsx przenosi wartości, formuły, szerokości kolumn i pogrubienie, ale nie wszystkie style.
- Prezentacje: jeden styl na pole tekstowe (bez formatowania pojedynczych słów), brak animacji;
  import .pptx przenosi teksty, kształty, obrazy, kolory i notatki, ale nie wzorce slajdów ani motywy.
- Bezpośrednie parowanie trzeba powtarzać przy każdym uruchomieniu (nie ma serwera, który odnalazłby urządzenia).
