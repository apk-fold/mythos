# Rétro-ingénierie : comment fonctionnent Word, Excel et PowerPoint

Cette analyse s'appuie sur la structure publique des fichiers Office Open XML (norme ECMA-376 / ISO 29500)
et sur le comportement observable des logiciels. Elle explique les choix faits dans Mythos.

## 1. Point commun : le conteneur OOXML

Un `.docx`, `.xlsx` ou `.pptx` est une **archive ZIP** (renommez-le en `.zip` pour l'ouvrir) contenant :

- `[Content_Types].xml` : le type MIME de chaque partie ;
- `_rels/.rels` et `*/_rels/*.rels` : un graphe de relations (`rId1 → media/image1.png`) ;
- des parties XML par application, plus `docProps/` (auteur, dates) et `media/` (images).

Les trois logiciels séparent donc **contenu**, **styles/thème** et **ressources**, reliés par des identifiants.
Mythos reprend cette idée : chaque document est un arbre de données, et les conversions dans `src/io/`
traduisent vers et depuis ces parties XML.

## 2. Word : un flux de paragraphes

`word/document.xml` :

```xml
<w:body>
  <w:p>                                   <!-- paragraphe -->
    <w:pPr><w:pStyle w:val="Heading1"/><w:jc w:val="center"/></w:pPr>
    <w:r>                                 <!-- « run » : segment de mise en forme homogène -->
      <w:rPr><w:b/><w:color w:val="FF0000"/><w:sz w:val="28"/></w:rPr>  <!-- taille en demi-points -->
      <w:t>Bonjour</w:t>
    </w:r>
  </w:p>
  <w:tbl>…</w:tbl>                        <!-- tableaux : w:tr / w:tc contenant des w:p -->
  <w:sectPr>…</w:sectPr>                  <!-- format de page, marges -->
</w:body>
```

- **Modèle** : une suite linéaire de blocs (paragraphes, tableaux), chaque paragraphe étant une suite de *runs*.
  La mise en forme s'hérite : style du document → style de paragraphe → propriétés directes.
- **Listes** : pas de balise « liste » ; un paragraphe porte `w:numPr` pointant vers `word/numbering.xml`.
- **Mise en page** : calculée à l'affichage (coupure des lignes et des pages), elle n'est pas stockée dans le fichier.

**Dans Mythos** : ProseMirror/Tiptap utilise le même modèle (nœuds blocs → texte avec *marks*). L'arbre est stocké dans
un `Y.XmlFragment` (CRDT), ce qui permet la fusion à plusieurs. L'export (`src/io/docx.js`) produit `w:p`/`w:r`/`w:rPr`
et une numérotation ; l'import passe par mammoth (docx → HTML sémantique).

## 3. Excel : une grille creuse et un graphe de calcul

`xl/worksheets/sheet1.xml` :

```xml
<sheetData>
  <row r="4">
    <c r="B4"><f>SUM(B2:B3)</f><v>20.5</v></c>   <!-- formule + dernière valeur calculée -->
    <c r="A4" t="s"><v>3</v></c>                  <!-- t="s" : index dans sharedStrings.xml -->
  </row>
</sheetData>
```

- **Stockage creux** : seules les cellules non vides existent. Les textes sont dédupliqués dans `xl/sharedStrings.xml`,
  les styles sont des index vers `xl/styles.xml`.
- **Formules** : stockées en anglais, avec la virgule comme séparateur, quelle que soit la langue de l'interface
  (`SOMME(A1;A2)` à l'écran donne `SUM(A1,A2)` dans le fichier).
- **Calcul** : Excel maintient un graphe de dépendances (`calcChain.xml`) et ne recalcule que les cellules touchées ;
  les références circulaires sont détectées.
- **Affichage** : la grille n'est pas faite de millions d'éléments ; seules les cellules visibles sont dessinées.

**Dans Mythos** : cellules dans une `Y.Map` clé `"ligne,colonne"` (creuse) ; moteur de formules maison
(`src/apps/formula.js`) avec analyseur à précédence Excel (`-2^2 = 4`), noms français et anglais, cache et détection
des cycles (`#CIRC!`) ; la grille est dessinée sur un `<canvas>` (seule la zone visible est rendue). À l'export,
les formules sont traduites en anglais avec des virgules.

## 4. PowerPoint : des formes positionnées sur un canevas

`ppt/slides/slide1.xml` :

```xml
<p:spTree>
  <p:sp>                                         <!-- forme -->
    <p:nvSpPr><p:nvPr><p:ph type="title"/></p:nvPr></p:nvSpPr>   <!-- espace réservé -->
    <p:spPr>
      <a:xfrm><a:off x="457200" y="274638"/><a:ext cx="8229600" cy="1143000"/></a:xfrm>  <!-- EMU -->
      <a:prstGeom prst="rect"/><a:solidFill><a:srgbClr val="E8590C"/></a:solidFill>
    </p:spPr>
    <p:txBody><a:bodyPr anchor="ctr"/><a:p><a:r><a:rPr sz="4400" b="1"/><a:t>Titre</a:t></a:r></a:p></p:txBody>
  </p:sp>
  <p:pic>…<a:blip r:embed="rId2"/>…</p:pic>      <!-- image → relation vers ppt/media -->
</p:spTree>
```

- **Modèle** : chaque diapositive est une liste ordonnée de formes à position absolue (l'ordre définit le premier/arrière-plan).
  Unité : l'EMU (914 400 par pouce, 12 700 par point).
- **Héritage** : diapositive → disposition (`slideLayout`) → masque (`slideMaster`) → thème. Une forme sans position
  hérite de l'espace réservé correspondant de sa disposition.
- **Notes** : partie séparée `notesSlideN.xml` reliée à la diapositive.

**Dans Mythos** : diapositive = `Y.Map` avec une liste d'éléments (`Y.Map` par forme : x, y, w, h, texte, styles)
dans un repère 960×540 ; les propriétés d'un élément fusionnent indépendamment (deux personnes peuvent déplacer
et recolorer la même forme en même temps). Export via PptxGenJS, import en lisant directement `p:spTree`
(`src/io/pptx.js`), avec repli sur des positions par défaut pour les espaces réservés hérités.

## 5. Synchronisation : ce qu'Office fait, et ce qu'Mythos fait autrement

Office co-édite via un serveur (OneDrive/SharePoint) qui ordonne les modifications. Sans serveur, il faut une structure
de données qui converge quel que soit l'ordre de réception : un **CRDT**. Mythos utilise Yjs : chaque appareil
annonce son *vecteur d'état*, l'autre lui renvoie exactement les modifications manquantes, et le résultat final est
identique partout. Le transport est interchangeable : WebRTC direct, dossier partagé ou fichier.
