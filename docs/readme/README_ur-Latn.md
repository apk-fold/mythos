<div align="center">

[English](README_en.md) · [简体中文](README_zh.md) · [繁體中文](README_zh-TW.md) · [日本語](README_ja.md) · [한국어](README_ko.md) · [Türkçe](README_tr.md) · [Русский](README_ru.md) · [Tiếng Việt](README_vi.md) · [ไทย](README_th.md) · [Deutsch](README_de.md) · [Español](README_es.md) · [Français](../../README.md) · [Українська](README_uk.md) · [Polski](README_pl.md) · [Português (Brasil)](README_pt-BR.md) · [العربية](README_ar.md) · [فارسی](README_fa.md) · [Bahasa Indonesia](README_id.md) · [Italiano](README_it.md)
· [Ελληνικά](README_el.md) · [മലയാളം](README_ml.md) · **Roman Urdu** · [Română](README_ro.md)

</div>

# Mythos — local office suite, server ke baghair sync

![Home](../../docs/screenshots/home.png)

| Text | Spreadsheet | Presentations |
|---|---|---|
| ![](../../docs/screenshots/writer.png) | ![](../../docs/screenshots/sheet.png) | ![](../../docs/screenshots/slides.png) |

| Settings | Dark mode |
|---|---|
| ![](../../docs/screenshots/settings.png) | ![](../../docs/screenshots/home-dark.png) |

**4 hindson wale code se sync**: ek device par *Sync → Code dikhayein*, doosre par *Code darj karein*. Code sirf ek relay (ntfy.sh, Settings mein badla ja sakta hai) par ek doosre ko dhoondne ke liye istemal hota hai, aur invitation wahan encrypted hoti hai. Us ke baad aap ke documents seedhe ek device se doosre par jaate hain.

Word processor, spreadsheet aur presentations ek hi app mein, **Windows, Linux aur Android** ke liye.
Files aap ke devices par hi rehti hain; sync seedha device se device hota hai.

## Install karna

| System | File | Jagah |
|---|---|---|
| Windows | `Mythos-Setup-1.1.0.exe` (installer) ya `Mythos-Portable-1.1.0.exe` | `release/` |
| Linux | `Mythos-1.1.0-x64.tar.gz` (extract karein phir `./mythos` chalayein); AppImage Linux par `npm run dist:linux` se build hota hai | `release/` |
| Android | `app-debug.apk` | `android/app/build/outputs/apk/debug/` |

Files signed nahin hain: Windows SmartScreen "More info → Run anyway" chunne ko kahega,
aur Android anjaan sources se apps install karne ki ijazat maangega.

## Dobara build karna

```sh
npm install
npm run dev          # development ke liye browser version (http://localhost:5173)
npm start            # desktop app
npm run dist:win     # Windows installer → release/
npm run dist:linux   # AppImage + tar.gz → release/ (behtar hai Linux par chalayein)
npm run android      # site ko android/ mein copy karta hai, phir:
cd android && gradlew assembleDebug   # JAVA_HOME = JDK 21
```

## Server ke baghair sync

Har document IndexedDB mein save hone wala ek **Yjs CRDT** hai. Agar do devices ne offline ek hi document badla ho,
to woh apni tabdeeliyan khud-ba-khud mila dete hain, baghair takraao ke aur baghair "aakhri version jeetta hai" ke.

Devices jorne ke teen tareeqe (**Sync** panel):

1. **Seedhi pairing (WebRTC)**: device A ek invitation QR code dikhata hai, B use scan karta hai (ya code paste karta hai)
   aur ek jawabi QR code dikhata hai jise A scan karta hai. Us ke baad connection end-to-end encrypted (DTLS) hota hai,
   real time mein. Local Wi-Fi par koi server istemal nahin hota; "Internet ke zariye" wala option ek public STUN server
   sirf public address maloom karne ke liye istemal karta hai (koi data us se nahin guzarta). App har baar kholne par dobara karna padta hai.
2. **Shared folder** (Windows / Linux): Syncthing se sync hone wala folder, USB stick ya network share chunein.
   Har device wahan apni `mythos-<id>.mythos` file likhta hai aur doosron ki files har 5 second baad parhta hai.
3. **`.mythos` file**: poore workspace ka manual export/import (email, USB stick…). Import milata hai, kuch overwrite nahin karta.

Devices tabdeeliyan aage pohnchate hain: agar A, B se aur B, C se jura ho, to A ki tabdeeliyan C tak pohnch jaati hain.

## Supported formats

| | Import | Export |
|---|---|---|
| Text | .docx, .html, .txt, .md | .docx, PDF (print) |
| Spreadsheet | .xlsx, .xls, .ods, .csv | .xlsx, .csv |
| Presentations | .pptx | .pptx, PDF (print) |

Design ki rehnumai karne wale Word, Excel aur PowerPoint ke kaam ke tajziye ke liye [docs/ANALYSE.md](../../docs/ANALYSE.md) (French mein) dekhein.

## Structure

```
src/main.js            home, routing, files ka import
src/store.js           local storage (Y.Doc + IndexedDB), library
src/sync/              sync protocol, WebRTC, shared folder, interface
src/apps/writer.js     word processor (ProseMirror/Tiptap)
src/apps/sheet.js      spreadsheet (canvas grid)
src/apps/formula.js    formula engine
src/apps/slides.js     presentations
src/io/                docx / xlsx / pptx conversions
electron/              desktop app (Windows, Linux)
android/               Android project (Capacitor)
```

## Maloom hadood

- Text: track changes, comments, header/footer ya screen par asal page bandi nahin
  (page breaks print karte waqt aur .docx mein qaim rehte hain).
- Spreadsheet: charts, cells merge karna, conditional formatting ya pivot tables nahin;
  .xlsx import values, formulas, column ki chaurai aur bold wapas lata hai, tamam styles nahin.
- Presentations: har text box ka ek style (lafz-ba-lafz formatting nahin), animations nahin;
  .pptx import texts, shapes, images, rang aur notes le aata hai, lekin masters aur themes nahin.
- Seedhi pairing har launch par dobara karni padti hai (devices dhoondne ke liye koi server nahin).
