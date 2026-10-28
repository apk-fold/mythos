<div align="center">

**English** · [简体中文](README_zh.md) · [繁體中文](README_zh-TW.md) · [日本語](README_ja.md) · [한국어](README_ko.md) · [Türkçe](README_tr.md) · [Русский](README_ru.md) · [Tiếng Việt](README_vi.md) · [ไทย](README_th.md) · [Deutsch](README_de.md) · [Español](README_es.md) · [Français](../../README.md) · [Українська](README_uk.md) · [Polski](README_pl.md) · [Português (Brasil)](README_pt-BR.md) · [العربية](README_ar.md) · [فارسی](README_fa.md) · [Bahasa Indonesia](README_id.md) · [Italiano](README_it.md)
· [Ελληνικά](README_el.md) · [മലയാളം](README_ml.md) · [Roman Urdu](README_ur-Latn.md) · [Română](README_ro.md)

</div>

# Mythos — local office suite, synced without a server

![Home](../../docs/screenshots/home.png)

| Text | Spreadsheet | Presentations |
|---|---|---|
| ![](../../docs/screenshots/writer.png) | ![](../../docs/screenshots/sheet.png) | ![](../../docs/screenshots/slides.png) |

| Settings | Dark mode |
|---|---|
| ![](../../docs/screenshots/settings.png) | ![](../../docs/screenshots/home-dark.png) |

**Sync with a 4-digit code**: on one device, *Sync → Show a code*; on the other, *Enter a code*. The code is only used to find each other on a relay (ntfy.sh, changeable in Settings), and the invitation is encrypted there. Your documents then travel directly from one device to the other.

Word processor, spreadsheet and presentations in a single app, for **Windows, Linux and Android**.
Files stay on your devices; syncing happens directly from device to device.

## Install

| System | File | Location |
|---|---|---|
| Windows | `Mythos-Setup-1.1.0.exe` (installer) or `Mythos-Portable-1.1.0.exe` | `release/` |
| Linux | `Mythos-1.1.0-x64.tar.gz` (extract, then run `./mythos`); the AppImage is built on Linux with `npm run dist:linux` | `release/` |
| Android | `app-debug.apk` | `android/app/build/outputs/apk/debug/` |

The files are not signed: Windows SmartScreen will ask for "More info → Run anyway",
and Android will ask you to allow installing apps from unknown sources.

## Rebuild

```sh
npm install
npm run dev          # browser version for development (http://localhost:5173)
npm start            # desktop app
npm run dist:win     # Windows installer → release/
npm run dist:linux   # AppImage + tar.gz → release/ (preferably run on Linux)
npm run android      # copies the site into android/, then:
cd android && gradlew assembleDebug   # JAVA_HOME = JDK 21
```

## Serverless sync

Each document is a **Yjs CRDT** stored in IndexedDB. Two devices that edited the same document offline
merge their changes automatically, with no conflict and no "last version wins".

Three ways to link devices (**Sync** panel):

1. **Direct pairing (WebRTC)**: device A shows an invitation QR code, B scans it (or pastes the code)
   and shows a reply QR code that A scans in turn. The connection is then end-to-end encrypted (DTLS),
   in real time. On local Wi-Fi no server is used; the "over the Internet" option uses a public STUN server
   only to discover the public address (no data goes through it). Must be redone each time the app is opened.
2. **Shared folder** (Windows / Linux): choose a folder synced by Syncthing, a USB stick or a network share.
   Each device writes its own `mythos-<id>.mythos` file there and reads the others' files every 5 s.
3. **`.mythos` file**: manual export/import of the whole workspace (email, USB stick…). Importing merges; it never overwrites anything.

Devices relay changes: if A is linked to B and B to C, A's changes reach C.

## Supported formats

| | Import | Export |
|---|---|---|
| Text | .docx, .html, .txt, .md | .docx, PDF (print) |
| Spreadsheet | .xlsx, .xls, .ods, .csv | .xlsx, .csv |
| Presentations | .pptx | .pptx, PDF (print) |

See [docs/ANALYSE.md](../../docs/ANALYSE.md) (in French) for the analysis of how Word, Excel and PowerPoint work that guided the design.

## Structure

```
src/main.js            home screen, routing, file import
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

## Known limitations

- Text: no track changes, comments, headers/footers or true on-screen pagination
  (page breaks are respected when printing and in the .docx).
- Spreadsheet: no charts, merged cells, conditional formatting or pivot tables;
  .xlsx import brings back values, formulas, column widths and bold, not every style.
- Presentations: one style per text box (no word-by-word formatting), no animations;
  .pptx import keeps texts, shapes, images, colors and notes, but not masters or themes.
- Direct pairing has to be redone at every launch (there is no server to find the devices).
