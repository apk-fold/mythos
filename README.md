# Mythos — suite bureautique locale, synchronisée sans serveur

![Accueil](docs/screenshots/home.png)

| Texte | Tableur | Présentations |
|---|---|---|
| ![](docs/screenshots/writer.png) | ![](docs/screenshots/sheet.png) | ![](docs/screenshots/slides.png) |

| Paramètres | Mode sombre |
|---|---|
| ![](docs/screenshots/settings.png) | ![](docs/screenshots/home-dark.png) |

**Synchronisation par code à 4 chiffres** : sur un appareil, *Synchronisation → Afficher un code*, sur l'autre, *Saisir un code*. Le code ne sert qu'à se retrouver sur un relais (ntfy.sh, modifiable dans les Paramètres), et l'invitation y est chiffrée. Vos documents passent ensuite directement d'un appareil à l'autre.


Traitement de texte, tableur et présentations dans une seule application, pour **Windows, Linux et Android**.
Les fichiers restent sur vos appareils ; la synchronisation se fait directement d'appareil à appareil.

## Installer

| Système | Fichier | Emplacement |
|---|---|---|
| Windows | `Mythos-Setup-1.1.0.exe` (installeur) ou `Mythos-Portable-1.1.0.exe` | `release/` |
| Linux | `Mythos-1.1.0-x64.tar.gz` (extraire puis lancer `./mythos`) ; l'AppImage se compile depuis Linux avec `npm run dist:linux` | `release/` |
| Android | `app-debug.apk` | `android/app/build/outputs/apk/debug/` |

Les fichiers ne sont pas signés : Windows SmartScreen demandera « Informations complémentaires → Exécuter quand même »,
et Android demandera d'autoriser l'installation d'applications de source inconnue.

## Recompiler

```sh
npm install
npm run dev          # version navigateur pour développer (http://localhost:5173)
npm start            # application de bureau
npm run dist:win     # installeur Windows → release/
npm run dist:linux   # AppImage + tar.gz → release/ (à lancer de préférence sous Linux)
npm run android      # copie le site dans android/, puis :
cd android && gradlew assembleDebug   # JAVA_HOME = JDK 21
```

## Synchronisation sans serveur

Chaque document est un **CRDT Yjs** stocké dans IndexedDB. Deux appareils qui ont modifié le même document hors ligne
fusionnent leurs changements automatiquement, sans conflit et sans « dernière version gagnante ».

Trois façons de relier les appareils (panneau **Synchroniser**) :

1. **Appairage direct (WebRTC)** : l'appareil A affiche un QR code d'invitation, B le scanne (ou colle le code)
   et affiche un QR code réponse que A scanne à son tour. La connexion est ensuite chiffrée (DTLS) de bout en bout,
   en temps réel. En Wi-Fi local, aucun serveur n'est utilisé ; l'option « via Internet » utilise un serveur STUN public
   uniquement pour découvrir l'adresse publique (aucune donnée n'y transite). À refaire à chaque ouverture de l'application.
2. **Dossier partagé** (Windows / Linux) : choisissez un dossier synchronisé par Syncthing, une clé USB ou un partage réseau.
   Chaque appareil y écrit son propre fichier `mythos-<id>.mythos` et lit ceux des autres toutes les 5 s.
3. **Fichier `.mythos`** : export/import manuel de tout l'espace (e-mail, clé USB…). L'import fusionne, il n'écrase rien.

Les appareils relaient les modifications : si A est relié à B et B à C, les changements de A arrivent sur C.

## Formats pris en charge

| | Import | Export |
|---|---|---|
| Texte | .docx, .html, .txt, .md | .docx, PDF (impression) |
| Tableur | .xlsx, .xls, .ods, .csv | .xlsx, .csv |
| Présentations | .pptx | .pptx, PDF (impression) |

Voir [docs/ANALYSE.md](docs/ANALYSE.md) pour l'analyse de fonctionnement de Word, Excel et PowerPoint qui a guidé la conception.

## Structure

```
src/main.js            accueil, routage, import de fichiers
src/store.js           stockage local (Y.Doc + IndexedDB), bibliothèque
src/sync/              protocole de synchro, WebRTC, dossier partagé, interface
src/apps/writer.js     traitement de texte (ProseMirror/Tiptap)
src/apps/sheet.js      tableur (grille canvas)
src/apps/formula.js    moteur de formules
src/apps/slides.js     présentations
src/io/                conversions docx / xlsx / pptx
electron/              application de bureau (Windows, Linux)
android/               projet Android (Capacitor)
```

## Limites connues

- Texte : pas de suivi des modifications, de commentaires, d'en-têtes/pieds de page ni de pagination réelle à l'écran
  (les sauts de page sont respectés à l'impression et dans le .docx).
- Tableur : pas de graphiques, de fusion de cellules, de mise en forme conditionnelle ni de tableaux croisés ;
  l'import .xlsx récupère valeurs, formules, largeurs de colonnes et gras, pas tous les styles.
- Présentations : un style par zone de texte (pas de mise en forme mot par mot), pas d'animations ;
  l'import .pptx reprend textes, formes, images, couleurs et notes, mais pas les masques ni les thèmes.
- L'appairage direct doit être refait à chaque lancement (pas de serveur pour retrouver les appareils).
