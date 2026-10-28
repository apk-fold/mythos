<div align="center">

[English](README_en.md) · [简体中文](README_zh.md) · [繁體中文](README_zh-TW.md) · [日本語](README_ja.md) · [한국어](README_ko.md) · [Türkçe](README_tr.md) · [Русский](README_ru.md) · [Tiếng Việt](README_vi.md) · [ไทย](README_th.md) · [Deutsch](README_de.md) · [Español](README_es.md) · [Français](../../README.md) · [Українська](README_uk.md) · [Polski](README_pl.md) · [Português (Brasil)](README_pt-BR.md) · [العربية](README_ar.md) · [فارسی](README_fa.md) · [Bahasa Indonesia](README_id.md) · **Italiano**
· [Ελληνικά](README_el.md) · [മലയാളം](README_ml.md) · [Roman Urdu](README_ur-Latn.md) · [Română](README_ro.md)

</div>

# Mythos — suite per ufficio locale, sincronizzata senza server

![Home](../../docs/screenshots/home.png)

| Testo | Foglio di calcolo | Presentazioni |
|---|---|---|
| ![](../../docs/screenshots/writer.png) | ![](../../docs/screenshots/sheet.png) | ![](../../docs/screenshots/slides.png) |

| Impostazioni | Modalità scura |
|---|---|
| ![](../../docs/screenshots/settings.png) | ![](../../docs/screenshots/home-dark.png) |

**Sincronizzazione con un codice a 4 cifre**: su un dispositivo, *Sincronizzazione → Mostra un codice*; sull'altro, *Inserisci un codice*. Il codice serve solo a ritrovarsi su un relay (ntfy.sh, modificabile nelle Impostazioni), e l'invito vi è cifrato. I documenti passano poi direttamente da un dispositivo all'altro.

Videoscrittura, foglio di calcolo e presentazioni in un'unica applicazione, per **Windows, Linux e Android**.
I file restano sui vostri dispositivi; la sincronizzazione avviene direttamente da dispositivo a dispositivo.

## Installazione

| Sistema | File | Posizione |
|---|---|---|
| Windows | `Mythos-Setup-1.1.0.exe` (programma di installazione) o `Mythos-Portable-1.1.0.exe` | `release/` |
| Linux | `Mythos-1.1.0-x64.tar.gz` (estrarre e avviare `./mythos`); l'AppImage si compila da Linux con `npm run dist:linux` | `release/` |
| Android | `app-debug.apk` | `android/app/build/outputs/apk/debug/` |

I file non sono firmati: Windows SmartScreen chiederà «Ulteriori informazioni → Esegui comunque»,
e Android chiederà di consentire l'installazione di app da origini sconosciute.

## Ricompilare

```sh
npm install
npm run dev          # versione browser per sviluppare (http://localhost:5173)
npm start            # applicazione desktop
npm run dist:win     # programma di installazione Windows → release/
npm run dist:linux   # AppImage + tar.gz → release/ (da eseguire preferibilmente su Linux)
npm run android      # copia il sito in android/, poi:
cd android && gradlew assembleDebug   # JAVA_HOME = JDK 21
```

## Sincronizzazione senza server

Ogni documento è un **CRDT Yjs** salvato in IndexedDB. Due dispositivi che hanno modificato lo stesso documento offline
uniscono automaticamente le loro modifiche, senza conflitti e senza «vince l'ultima versione».

Tre modi per collegare i dispositivi (pannello **Sincronizza**):

1. **Associazione diretta (WebRTC)**: il dispositivo A mostra un codice QR di invito, B lo scansiona (o incolla il codice)
   e mostra un codice QR di risposta che A scansiona a sua volta. La connessione è poi cifrata end-to-end (DTLS),
   in tempo reale. Sul Wi-Fi locale non si usa alcun server; l'opzione «via Internet» usa un server STUN pubblico
   solo per scoprire l'indirizzo pubblico (nessun dato vi transita). Va ripetuta a ogni apertura dell'applicazione.
2. **Cartella condivisa** (Windows / Linux): scegliete una cartella sincronizzata da Syncthing, una chiavetta USB o una condivisione di rete.
   Ogni dispositivo vi scrive il proprio file `mythos-<id>.mythos` e legge quelli degli altri ogni 5 s.
3. **File `.mythos`**: esportazione/importazione manuale di tutto lo spazio (e-mail, chiavetta USB…). L'importazione unisce, non sovrascrive nulla.

I dispositivi si ritrasmettono le modifiche: se A è collegato a B e B a C, le modifiche di A arrivano a C.

## Formati supportati

| | Importazione | Esportazione |
|---|---|---|
| Testo | .docx, .html, .txt, .md | .docx, PDF (stampa) |
| Foglio di calcolo | .xlsx, .xls, .ods, .csv | .xlsx, .csv |
| Presentazioni | .pptx | .pptx, PDF (stampa) |

Vedi [docs/ANALYSE.md](../../docs/ANALYSE.md) (in francese) per l'analisi del funzionamento di Word, Excel e PowerPoint che ha guidato la progettazione.

## Struttura

```
src/main.js            home, instradamento, importazione di file
src/store.js           archiviazione locale (Y.Doc + IndexedDB), libreria
src/sync/              protocollo di sincronizzazione, WebRTC, cartella condivisa, interfaccia
src/apps/writer.js     videoscrittura (ProseMirror/Tiptap)
src/apps/sheet.js      foglio di calcolo (griglia canvas)
src/apps/formula.js    motore delle formule
src/apps/slides.js     presentazioni
src/io/                conversioni docx / xlsx / pptx
electron/              applicazione desktop (Windows, Linux)
android/               progetto Android (Capacitor)
```

## Limiti noti

- Testo: niente revisioni, commenti, intestazioni/piè di pagina né vera impaginazione a schermo
  (le interruzioni di pagina sono rispettate in stampa e nel .docx).
- Foglio di calcolo: niente grafici, unione di celle, formattazione condizionale né tabelle pivot;
  l'importazione .xlsx recupera valori, formule, larghezze delle colonne e grassetto, non tutti gli stili.
- Presentazioni: uno stile per casella di testo (niente formattazione parola per parola), niente animazioni;
  l'importazione .pptx riprende testi, forme, immagini, colori e note, ma non gli schemi né i temi.
- L'associazione diretta va ripetuta a ogni avvio (non c'è un server per ritrovare i dispositivi).
