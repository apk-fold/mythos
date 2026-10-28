<div align="center">

[English](README_en.md) · [简体中文](README_zh.md) · [繁體中文](README_zh-TW.md) · [日本語](README_ja.md) · [한국어](README_ko.md) · [Türkçe](README_tr.md) · [Русский](README_ru.md) · [Tiếng Việt](README_vi.md) · [ไทย](README_th.md) · [Deutsch](README_de.md) · [Español](README_es.md) · [Français](../../README.md) · [Українська](README_uk.md) · [Polski](README_pl.md) · [Português (Brasil)](README_pt-BR.md) · [العربية](README_ar.md) · [فارسی](README_fa.md) · [Bahasa Indonesia](README_id.md) · [Italiano](README_it.md)
· [Ελληνικά](README_el.md) · [മലയാളം](README_ml.md) · [Roman Urdu](README_ur-Latn.md) · **Română**

</div>

# Mythos — suită de birou locală, sincronizată fără server

![Acasă](../../docs/screenshots/home.png)

| Text | Foaie de calcul | Prezentări |
|---|---|---|
| ![](../../docs/screenshots/writer.png) | ![](../../docs/screenshots/sheet.png) | ![](../../docs/screenshots/slides.png) |

| Setări | Mod întunecat |
|---|---|
| ![](../../docs/screenshots/settings.png) | ![](../../docs/screenshots/home-dark.png) |

**Sincronizare cu un cod din 4 cifre**: pe un dispozitiv, *Sincronizare → Afișează un cod*; pe celălalt, *Introdu un cod*. Codul servește doar ca dispozitivele să se găsească pe un releu (ntfy.sh, modificabil în Setări), iar invitația este criptată acolo. Apoi documentele dumneavoastră trec direct de pe un dispozitiv pe altul.

Procesor de text, foaie de calcul și prezentări într-o singură aplicație, pentru **Windows, Linux și Android**.
Fișierele rămân pe dispozitivele dumneavoastră; sincronizarea se face direct de la dispozitiv la dispozitiv.

## Instalare

| Sistem | Fișier | Locație |
|---|---|---|
| Windows | `Mythos-Setup-1.1.0.exe` (program de instalare) sau `Mythos-Portable-1.1.0.exe` | `release/` |
| Linux | `Mythos-1.1.0-x64.tar.gz` (dezarhivați, apoi porniți `./mythos`); AppImage-ul se compilează pe Linux cu `npm run dist:linux` | `release/` |
| Android | `app-debug.apk` | `android/app/build/outputs/apk/debug/` |

Fișierele nu sunt semnate: Windows SmartScreen va cere „Mai multe informații → Rulați oricum”,
iar Android va cere permisiunea de a instala aplicații din surse necunoscute.

## Recompilare

```sh
npm install
npm run dev          # versiunea de browser pentru dezvoltare (http://localhost:5173)
npm start            # aplicația desktop
npm run dist:win     # program de instalare Windows → release/
npm run dist:linux   # AppImage + tar.gz → release/ (de preferat pe Linux)
npm run android      # copiază site-ul în android/, apoi:
cd android && gradlew assembleDebug   # JAVA_HOME = JDK 21
```

## Sincronizare fără server

Fiecare document este un **CRDT Yjs** stocat în IndexedDB. Două dispozitive care au modificat același document offline
își combină automat modificările, fără conflicte și fără „câștigă ultima versiune”.

Trei moduri de a lega dispozitivele (panoul **Sincronizare**):

1. **Asociere directă (WebRTC)**: dispozitivul A afișează un cod QR de invitație, B îl scanează (sau lipește codul)
   și afișează un cod QR de răspuns pe care A îl scanează la rândul său. Conexiunea este apoi criptată end-to-end (DTLS),
   în timp real. Pe Wi-Fi local nu se folosește niciun server; opțiunea „prin Internet” folosește un server STUN public
   doar pentru a afla adresa publică (nicio dată nu trece prin el). Trebuie refăcută la fiecare deschidere a aplicației.
2. **Dosar partajat** (Windows / Linux): alegeți un dosar sincronizat de Syncthing, un stick USB sau o partajare de rețea.
   Fiecare dispozitiv scrie acolo propriul fișier `mythos-<id>.mythos` și le citește pe ale celorlalte la fiecare 5 s.
3. **Fișier `.mythos`**: export/import manual al întregului spațiu (e-mail, stick USB…). Importul combină, nu suprascrie nimic.

Dispozitivele transmit mai departe modificările: dacă A e legat de B și B de C, modificările lui A ajung la C.

## Formate acceptate

| | Import | Export |
|---|---|---|
| Text | .docx, .html, .txt, .md | .docx, PDF (tipărire) |
| Foaie de calcul | .xlsx, .xls, .ods, .csv | .xlsx, .csv |
| Prezentări | .pptx | .pptx, PDF (tipărire) |

Vedeți [docs/ANALYSE.md](../../docs/ANALYSE.md) (în franceză) pentru analiza modului de funcționare a Word, Excel și PowerPoint care a ghidat proiectarea.

## Structură

```
src/main.js            acasă, rutare, import de fișiere
src/store.js           stocare locală (Y.Doc + IndexedDB), bibliotecă
src/sync/              protocol de sincronizare, WebRTC, dosar partajat, interfață
src/apps/writer.js     procesor de text (ProseMirror/Tiptap)
src/apps/sheet.js      foaie de calcul (grilă canvas)
src/apps/formula.js    motor de formule
src/apps/slides.js     prezentări
src/io/                conversii docx / xlsx / pptx
electron/              aplicația desktop (Windows, Linux)
android/               proiect Android (Capacitor)
```

## Limitări cunoscute

- Text: fără urmărirea modificărilor, comentarii, antete/subsoluri sau paginare reală pe ecran
  (sfârșiturile de pagină sunt respectate la tipărire și în .docx).
- Foaie de calcul: fără diagrame, îmbinare de celule, formatare condiționată sau tabele pivot;
  importul .xlsx recuperează valori, formule, lățimi de coloane și aldine, nu toate stilurile.
- Prezentări: un stil per casetă de text (fără formatare cuvânt cu cuvânt), fără animații;
  importul .pptx preia texte, forme, imagini, culori și note, dar nu și machetele sau temele.
- Asocierea directă trebuie refăcută la fiecare pornire (nu există un server care să găsească dispozitivele).
