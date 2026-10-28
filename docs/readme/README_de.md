<div align="center">

[English](README_en.md) · [简体中文](README_zh.md) · [繁體中文](README_zh-TW.md) · [日本語](README_ja.md) · [한국어](README_ko.md) · [Türkçe](README_tr.md) · [Русский](README_ru.md) · [Tiếng Việt](README_vi.md) · [ไทย](README_th.md) · **Deutsch** · [Español](README_es.md) · [Français](../../README.md) · [Українська](README_uk.md) · [Polski](README_pl.md) · [Português (Brasil)](README_pt-BR.md) · [العربية](README_ar.md) · [فارسی](README_fa.md) · [Bahasa Indonesia](README_id.md) · [Italiano](README_it.md)
· [Ελληνικά](README_el.md) · [മലയാളം](README_ml.md) · [Roman Urdu](README_ur-Latn.md) · [Română](README_ro.md)

</div>

# Mythos — lokale Office-Suite, ohne Server synchronisiert

![Startseite](../../docs/screenshots/home.png)

| Text | Tabelle | Präsentationen |
|---|---|---|
| ![](../../docs/screenshots/writer.png) | ![](../../docs/screenshots/sheet.png) | ![](../../docs/screenshots/slides.png) |

| Einstellungen | Dunkelmodus |
|---|---|
| ![](../../docs/screenshots/settings.png) | ![](../../docs/screenshots/home-dark.png) |

**Synchronisierung per 4-stelligem Code**: auf einem Gerät *Synchronisierung → Code anzeigen*, auf dem anderen *Code eingeben*. Der Code dient nur dazu, sich über ein Relay (ntfy.sh, in den Einstellungen änderbar) zu finden, und die Einladung ist dort verschlüsselt. Danach gehen Ihre Dokumente direkt von einem Gerät zum anderen.

Textverarbeitung, Tabellenkalkulation und Präsentationen in einer einzigen Anwendung, für **Windows, Linux und Android**.
Die Dateien bleiben auf Ihren Geräten; die Synchronisierung läuft direkt von Gerät zu Gerät.

## Installieren

| System | Datei | Ort |
|---|---|---|
| Windows | `Mythos-Setup-1.1.0.exe` (Installer) oder `Mythos-Portable-1.1.0.exe` | `release/` |
| Linux | `Mythos-1.1.0-x64.tar.gz` (entpacken, dann `./mythos` starten); das AppImage wird unter Linux mit `npm run dist:linux` gebaut | `release/` |
| Android | `app-debug.apk` | `android/app/build/outputs/apk/debug/` |

Die Dateien sind nicht signiert: Windows SmartScreen verlangt „Weitere Informationen → Trotzdem ausführen“,
und Android fragt, ob die Installation von Apps aus unbekannten Quellen erlaubt werden soll.

## Neu bauen

```sh
npm install
npm run dev          # Browser-Version zum Entwickeln (http://localhost:5173)
npm start            # Desktop-Anwendung
npm run dist:win     # Windows-Installer → release/
npm run dist:linux   # AppImage + tar.gz → release/ (am besten unter Linux ausführen)
npm run android      # kopiert die Website nach android/, dann:
cd android && gradlew assembleDebug   # JAVA_HOME = JDK 21
```

## Synchronisierung ohne Server

Jedes Dokument ist ein **Yjs-CRDT**, das in IndexedDB gespeichert wird. Zwei Geräte, die dasselbe Dokument offline bearbeitet haben,
führen ihre Änderungen automatisch zusammen – ohne Konflikt und ohne „die letzte Version gewinnt“.

Drei Wege, Geräte zu verbinden (Bereich **Synchronisieren**):

1. **Direkte Kopplung (WebRTC)**: Gerät A zeigt einen Einladungs-QR-Code, B scannt ihn (oder fügt den Code ein)
   und zeigt einen Antwort-QR-Code, den wiederum A scannt. Die Verbindung ist danach Ende-zu-Ende-verschlüsselt (DTLS)
   und in Echtzeit. Im lokalen WLAN wird kein Server genutzt; die Option „über das Internet“ nutzt einen öffentlichen STUN-Server
   nur, um die öffentliche Adresse zu ermitteln (es laufen keine Daten darüber). Muss bei jedem Öffnen der Anwendung wiederholt werden.
2. **Gemeinsamer Ordner** (Windows / Linux): Wählen Sie einen von Syncthing synchronisierten Ordner, einen USB-Stick oder eine Netzwerkfreigabe.
   Jedes Gerät schreibt dort seine eigene Datei `mythos-<id>.mythos` und liest die der anderen alle 5 s.
3. **`.mythos`-Datei**: manueller Export/Import des gesamten Arbeitsbereichs (E-Mail, USB-Stick…). Der Import führt zusammen, er überschreibt nichts.

Die Geräte leiten Änderungen weiter: Ist A mit B und B mit C verbunden, kommen die Änderungen von A auch bei C an.

## Unterstützte Formate

| | Import | Export |
|---|---|---|
| Text | .docx, .html, .txt, .md | .docx, PDF (Druck) |
| Tabelle | .xlsx, .xls, .ods, .csv | .xlsx, .csv |
| Präsentationen | .pptx | .pptx, PDF (Druck) |

Siehe [docs/ANALYSE.md](../../docs/ANALYSE.md) (auf Französisch) für die Analyse der Funktionsweise von Word, Excel und PowerPoint, die den Entwurf geleitet hat.

## Struktur

```
src/main.js            Startseite, Routing, Dateiimport
src/store.js           lokale Speicherung (Y.Doc + IndexedDB), Bibliothek
src/sync/              Sync-Protokoll, WebRTC, gemeinsamer Ordner, Oberfläche
src/apps/writer.js     Textverarbeitung (ProseMirror/Tiptap)
src/apps/sheet.js      Tabellenkalkulation (Canvas-Raster)
src/apps/formula.js    Formel-Engine
src/apps/slides.js     Präsentationen
src/io/                Konvertierung docx / xlsx / pptx
electron/              Desktop-Anwendung (Windows, Linux)
android/               Android-Projekt (Capacitor)
```

## Bekannte Einschränkungen

- Text: keine Änderungsverfolgung, keine Kommentare, keine Kopf-/Fußzeilen und keine echte Seitenaufteilung am Bildschirm
  (Seitenumbrüche werden beim Drucken und in der .docx berücksichtigt).
- Tabelle: keine Diagramme, verbundenen Zellen, bedingte Formatierung oder Pivot-Tabellen;
  der .xlsx-Import übernimmt Werte, Formeln, Spaltenbreiten und Fettdruck, aber nicht alle Stile.
- Präsentationen: ein Stil pro Textfeld (keine Formatierung Wort für Wort), keine Animationen;
  der .pptx-Import übernimmt Texte, Formen, Bilder, Farben und Notizen, aber keine Master und Designs.
- Die direkte Kopplung muss bei jedem Start wiederholt werden (es gibt keinen Server, der die Geräte findet).
