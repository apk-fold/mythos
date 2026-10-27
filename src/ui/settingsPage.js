// Page « Paramètres » : apparence, éditeurs, synchronisation, données. Tout s'applique immédiatement.
import { h, toast, confirmBox, saveFile, pickFile, isElectron } from '../util.js';
import { icon } from './toolbar.js';
import * as S from '../settings.js';
import { deviceName, libMap, updateMeta, TYPES } from '../store.js';
import { openSyncPanel } from '../sync/ui.js';
import { exportBundle, importBundle } from '../sync/engine.js';
import { status as folderStatus, chooseFolder, forgetFolder, startFolderSync, onFolderStatus } from '../sync/folder.js';
import { THEMES } from '../apps/slides.js';

const field = (label, hint, control) =>
  h('div', { class: 'set-field' }, h('div', { class: 'set-label' }, h('b', null, label), hint && h('span', null, hint)), h('div', { class: 'set-control' }, control));

function seg(key, options) {
  const wrap = h('div', { class: 'seg' });
  const draw = () => wrap.replaceChildren(...options.map(([v, l]) =>
    h('button', { class: S.get(key) === v ? 'on' : '', onclick: () => { S.set({ [key]: v }); draw(); } }, l)));
  draw();
  return wrap;
}
function toggle(key, after) {
  const i = h('input', { type: 'checkbox', checked: !!S.get(key), onchange: () => { S.set({ [key]: i.checked }); after?.(); } });
  return h('label', { class: 'switch' }, i, h('span'));
}
function select(key, options, cast = String) {
  const s = h('select', { class: 'field', onchange: () => S.set({ [key]: cast(s.value) }) },
    options.map(([v, l]) => h('option', { value: v, selected: String(S.get(key)) === String(v) }, l)));
  return s;
}
function range(key, min, max, step, unit) {
  const out = h('span', { class: 'range-val' }, S.get(key) + unit);
  const r = h('input', { type: 'range', min, max, step, value: S.get(key), oninput: () => { out.textContent = r.value + unit; S.set({ [key]: +r.value }); } });
  return h('div', { class: 'range' }, r, out);
}
function color(key, after) {
  const i = h('input', { type: 'color', value: S.get(key), oninput: () => { S.set({ [key]: i.value, palette: 'perso' }); after?.(); } });
  return h('label', { class: 'color-pick', style: { '--c': S.get(key) } }, i, h('span', null, S.get(key)));
}

export function renderSettings() {
  const sections = {
    apparence: ['theme', 'Apparence', appearance],
    editeurs: ['text', 'Éditeurs', editors],
    synchro: ['sync', 'Synchronisation', sync],
    donnees: ['doc', 'Données', data],
    apropos: ['more', 'À propos', about],
  };
  let current = sessionStorage.getItem('mythos.setTab') || 'apparence';
  const nav = h('nav', { class: 'set-nav' });
  const body = h('div', { class: 'set-body' });
  const cleanups = [];
  const show = (k) => {
    current = k;
    sessionStorage.setItem('mythos.setTab', k);
    cleanups.splice(0).forEach((f) => f());
    nav.replaceChildren(...Object.entries(sections).map(([id, [ic, label]]) =>
      h('button', { class: 'set-tab' + (id === k ? ' on' : ''), onclick: () => show(id) }, icon(ic, 18), h('span', null, label))));
    body.replaceChildren(h('h2', { class: 'set-title' }, sections[k][1]), ...[sections[k][2](() => show(k), cleanups)].flat());
    body.scrollTop = 0;
  };
  show(current);
  const el = h('div', { class: 'home settings' },
    h('header', { class: 'topbar' },
      h('a', { class: 'btn ghost', href: '#/', title: 'Accueil' }, icon('arrowLeft')),
      h('div', { class: 'brand' }, 'Paramètres'), h('div', { class: 'grow' }),
      h('button', { class: 'btn ghost', onclick: async () => { if (await confirmBox('Réinitialiser', 'Remettre tous les réglages par défaut ? Vos documents ne sont pas touchés.', 'Réinitialiser')) { S.reset(); show(current); } } }, 'Réinitialiser')),
    h('div', { class: 'set-main' }, nav, body));
  return { el, destroy: () => cleanups.forEach((f) => f()) };
}

function appearance(redraw) {
  const palettes = h('div', { class: 'palettes' }, Object.entries(S.PALETTES).map(([id, p]) =>
    h('button', { class: 'palette' + (S.get('palette') === id ? ' on' : ''), onclick: () => { S.usePalette(id); redraw(); } },
      h('span', { class: 'dots' }, [p.accent, p.doc, p.sheet, p.slides].map((c) => h('i', { style: { background: c } }))),
      h('span', null, p.name))));
  return [
    h('section', { class: 'set-card' },
      h('h3', null, 'Thème'),
      field('Mode', 'Clair, sombre, ou selon le système', seg('theme', [['auto', 'Auto'], ['light', 'Clair'], ['dark', 'Sombre']])),
      field('Arrière-plan', 'Décor derrière l\'accueil et les menus', seg('background', [['aurora', 'Aurore'], ['gradient', 'Dégradé'], ['plain', 'Uni']]))),
    h('section', { class: 'set-card' },
      h('h3', null, 'Couleurs'),
      palettes,
      h('div', { class: 'color-grid' },
        field('Accent', 'Boutons, liens, sélection', color('accent', redraw)),
        field('Documents', null, color('cDoc', redraw)),
        field('Classeurs', null, color('cSheet', redraw)),
        field('Présentations', null, color('cSlides', redraw)))),
    h('section', { class: 'set-card' },
      h('h3', null, 'Affichage'),
      field('Police de l’interface', null, select('uiFont', Object.entries(S.UI_FONTS).map(([k, [n]]) => [k, n]))),
      field('Taille du texte', 'Interface uniquement', range('fontScale', 85, 125, 5, ' %')),
      field('Arrondi des angles', null, range('radius', 0, 22, 2, ' px')),
      field('Densité', 'Espacement des barres d\'outils', seg('density', [['compact', 'Compacte'], ['normal', 'Normale'], ['comfort', 'Aérée']])),
      field('Animations', 'Transitions et effets de survol', toggle('animations'))),
    h('section', { class: 'set-card' },
      h('h3', null, 'Accueil'),
      field('Affichage des fichiers', null, seg('homeView', [['list', 'Liste'], ['grid', 'Grille']])),
      field('Trier par', null, seg('homeSort', [['modified', 'Date'], ['title', 'Nom'], ['type', 'Type']])),
      field('Confirmer avant de supprimer', null, toggle('confirmDelete'))),
  ];
}

function editors() {
  return [
    h('section', { class: 'set-card' },
      h('h3', null, h('span', { class: 'chip-dot', style: { background: 'var(--c-doc)' } }), 'Traitement de texte'),
      field('Police par défaut', null, select('docFont', [['Calibri, Carlito, Inter, sans-serif', 'Calibri'], ['Inter, system-ui, sans-serif', 'Sans-serif moderne'], ['Georgia, serif', 'Georgia'], ['"Times New Roman", serif', 'Times New Roman'], ['Arial, sans-serif', 'Arial'], ['Verdana, sans-serif', 'Verdana']])),
      field('Taille par défaut', null, range('docSize', 9, 16, 0.5, ' pt')),
      field('Interligne', null, range('docLine', 1, 2.5, 0.05, '')),
      field('Format de page', null, seg('pageSize', Object.entries(S.PAGE_SIZES).map(([k, [n]]) => [k, n]))),
      field('Marges', 'Gauche et droite', range('pageMargin', 0.5, 4, 0.1, ' cm')),
      field('Couleur de la page', null, color('pageColor')),
      field('Correcteur orthographique', 'Souligne les fautes (navigateur)', toggle('spellcheck'))),
    h('section', { class: 'set-card' },
      h('h3', null, h('span', { class: 'chip-dot', style: { background: 'var(--c-sheet)' } }), 'Tableur'),
      field('Quadrillage', 'Lignes entre les cellules', toggle('sheetGrid')),
      field('Largeur des colonnes', 'Par défaut', range('sheetColW', 60, 200, 10, ' px')),
      field('Hauteur des lignes', 'Par défaut', range('sheetRowH', 18, 48, 2, ' px')),
      field('Taille du texte', null, range('sheetFont', 11, 18, 1, ' px'))),
    h('section', { class: 'set-card' },
      h('h3', null, h('span', { class: 'chip-dot', style: { background: 'var(--c-slides)' } }), 'Présentations'),
      field('Thème des nouvelles présentations', null, select('slidesTheme', Object.entries(THEMES).map(([k, t]) => [k, t.name]))),
      field('Transition en mode présentation', null, seg('transition', [['fade', 'Fondu'], ['slide', 'Glissement'], ['zoom', 'Zoom'], ['none', 'Aucune']]))),
  ];
}

function sync(redraw, cleanups) {
  const name = h('input', { class: 'field', value: deviceName(), onchange: () => { localStorage.setItem('mythos.deviceName', name.value.trim()); toast('Nom enregistré'); } });
  const relay = h('input', { class: 'field', value: S.get('relay'), onchange: () => S.set({ relay: relay.value.trim() || S.DEFAULTS.relay }) });
  const stunTa = h('textarea', { class: 'field code', rows: 3, onchange: () => S.set({ stunServers: stunTa.value }) }, S.get('stunServers'));
  const folderInfo = h('div', { class: 'stack' });
  const drawFolder = () => folderInfo.replaceChildren(
    isElectron()
      ? h('div', { class: 'row' }, folderStatus.folder ? h('code', { class: 'path' }, folderStatus.folder) : h('span', { class: 'muted' }, 'Aucun dossier'),
          h('button', { class: 'btn', onclick: chooseFolder }, folderStatus.folder ? 'Changer' : 'Choisir un dossier'),
          folderStatus.folder && h('button', { class: 'btn', onclick: forgetFolder }, 'Arrêter'))
      : h('p', { class: 'muted' }, 'Disponible sur Windows et Linux.'));
  drawFolder();
  cleanups.push(onFolderStatus(drawFolder));
  return [
    h('section', { class: 'set-card' },
      h('h3', null, 'Cet appareil'),
      field('Nom', 'Affiché sur les autres appareils', name),
      h('div', { class: 'row' }, h('button', { class: 'btn primary', onclick: openSyncPanel }, icon('sync'), 'Ouvrir le panneau de synchronisation'))),
    h('section', { class: 'set-card' },
      h('h3', null, 'Appairage par code'),
      field('Longueur du code', '6 chiffres : plus difficile à deviner', seg('codeDigits', [[4, '4 chiffres'], [6, '6 chiffres']])),
      field('Demander confirmation', 'Accepter chaque appareil qui saisit le code', toggle('pairConfirm')),
      field('Relais de rendez-vous', 'Sert à échanger l\'invitation chiffrée, jamais vos documents. Compatible ntfy, auto-hébergeable.', relay)),
    h('section', { class: 'set-card' },
      h('h3', null, 'Appairage direct'),
      field('Connexion via Internet', 'Utilise un serveur STUN pour trouver l\'adresse publique ; vos données n\'y transitent jamais', toggle('stun', redraw)),
      S.get('stun') && field('Serveurs STUN', 'Un par ligne', stunTa)),
    h('section', { class: 'set-card' },
      h('h3', null, 'Dossier partagé'),
      folderInfo,
      field('Fréquence', 'Vérification des fichiers des autres appareils', select('folderInterval', [[2, 'Toutes les 2 s'], [5, 'Toutes les 5 s'], [15, 'Toutes les 15 s'], [60, 'Chaque minute']], Number))),
  ];
}

function data(redraw) {
  const usage = h('span', { class: 'muted' }, '…');
  navigator.storage?.estimate?.().then((e) => (usage.textContent = `${(e.usage / 1048576).toFixed(1)} Mo utilisés`)).catch(() => (usage.textContent = ''));
  const trash = [...libMap.values()].filter((d) => d?.deleted).sort((a, b) => b.modified - a.modified);
  return [
    h('section', { class: 'set-card' },
      h('h3', null, 'Sauvegarde'),
      h('p', { class: 'muted' }, 'Tout est enregistré sur cet appareil. ', usage),
      h('div', { class: 'row' },
        h('button', { class: 'btn', onclick: async () => saveFile(`mythos-sauvegarde-${new Date().toISOString().slice(0, 10)}.mythos`, new Blob([await exportBundle()])) }, icon('download', 16), 'Exporter tout'),
        h('button', { class: 'btn', onclick: async () => { const f = await pickFile('.mythos,application/json'); if (f) { try { toast(`${await importBundle(await f.text())} document(s) fusionné(s)`); } catch (e) { toast('Erreur : ' + e.message); } } } }, icon('upload', 16), 'Importer une sauvegarde'))),
    h('section', { class: 'set-card' },
      h('h3', null, 'Réglages'),
      h('p', { class: 'muted' }, 'Enregistrez vos réglages dans un fichier pour les reporter sur un autre appareil.'),
      h('div', { class: 'row' },
        h('button', { class: 'btn', onclick: () => saveFile('mythos-reglages.json', new Blob([S.exportJSON()], { type: 'application/json' })) }, icon('download', 16), 'Exporter les réglages'),
        h('button', { class: 'btn', onclick: async () => { const f = await pickFile('.json,application/json'); if (f) { try { S.importJSON(await f.text()); toast('Réglages importés'); redraw(); } catch (e) { toast('Erreur : ' + e.message); } } } }, icon('upload', 16), 'Importer des réglages'))),
    h('section', { class: 'set-card' },
      h('h3', null, 'Corbeille'),
      trash.length
        ? h('div', { class: 'trash' }, trash.map((d) => h('div', { class: 'trash-row' },
            h('span', { class: 'doc-icon small', style: { background: TYPES[d.type]?.color } }, icon(d.type, 16)),
            h('span', { class: 'grow' }, d.title),
            h('button', { class: 'btn small', onclick: () => { updateMeta(d.id, { deleted: false, modified: Date.now() }); toast('Restauré'); redraw(); } }, 'Restaurer'))))
        : h('p', { class: 'muted' }, 'La corbeille est vide.')),
    h('section', { class: 'set-card danger-zone' },
      h('h3', null, 'Zone dangereuse'),
      h('p', { class: 'muted' }, 'Efface tous les documents et réglages de cet appareil uniquement. Les autres appareils ne sont pas touchés.'),
      h('button', { class: 'btn danger', onclick: async () => {
        if (!(await confirmBox('Tout effacer', 'Effacer définitivement tous les documents de cet appareil ? Exportez d\'abord une sauvegarde si besoin.', 'Tout effacer'))) return;
        const dbs = (await indexedDB.databases?.()) || [];
        await Promise.all(dbs.filter((d) => d.name?.startsWith('mythos:')).map((d) => new Promise((r) => { const q = indexedDB.deleteDatabase(d.name); q.onsuccess = q.onerror = q.onblocked = r; })));
        Object.keys(localStorage).filter((k) => k.startsWith('mythos.')).forEach((k) => localStorage.removeItem(k));
        location.hash = '#/';
        location.reload();
      } }, 'Effacer cet appareil')),
  ];
}

function about() {
  return [
    h('section', { class: 'set-card about' },
      h('div', { class: 'about-logo' }, h('img', { src: './icon.svg', alt: '' })),
      h('h3', null, 'Mythos 1.1.0'),
      h('p', null, 'Traitement de texte, tableur et présentations, synchronisés directement entre vos appareils, sans serveur.'),
      h('p', { class: 'muted' }, 'Formats : .docx, .xlsx, .csv, .pptx. Vos fichiers restent sur vos appareils.'),
      h('p', null, h('a', { href: 'https://github.com/apk-fold/mythos', target: '_blank', rel: 'noopener' }, 'github.com/apk-fold/mythos'))),
  ];
}
