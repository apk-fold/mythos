// Coquille de l'application : accueil (bibliothèque), routage et ouverture des éditeurs.
import './styles.css';
import { h, toast, ask, confirmBox, pickFile, modal } from './util.js';
import { library, libMap, listDocs, getDoc, getMeta, createDoc, updateMeta, deleteDoc, duplicateDoc, TYPES, deviceName } from './store.js';
import { icon } from './ui/toolbar.js';
import { openSyncPanel } from './sync/ui.js';
import { peers, onPeersChange } from './sync/p2p.js';
import { startFolderSync, status as folderStatus } from './sync/folder.js';
import { importBundle } from './sync/engine.js';
import * as S from './settings.js';

const app = document.getElementById('app');
let current = null;

const loaders = {
  doc: () => import('./apps/writer.js').then((m) => m.mountWriter),
  sheet: () => import('./apps/sheet.js').then((m) => m.mountSheet),
  slides: () => import('./apps/slides.js').then((m) => m.mountSlides),
};
const initers = {
  sheet: () => import('./apps/sheet.js').then((m) => m.initSheet),
  slides: () => import('./apps/slides.js').then((m) => m.initSlides),
};

async function newDoc(type) {
  const init = initers[type] ? await initers[type]() : null;
  const id = await createDoc(type, null, init);
  location.hash = '#/d/' + id;
}

async function importFile(file) {
  if (!file) return;
  const name = file.name.replace(/\.[^.]+$/, '');
  const ext = (file.name.split('.').pop() || '').toLowerCase();
  try {
    if (ext === 'mythos') {
      const n = await importBundle(await file.text());
      return toast(`${n} document(s) fusionné(s)`);
    }
    if (['docx', 'html', 'htm', 'txt', 'md'].includes(ext)) {
      let html;
      if (ext === 'docx') {
        const mammoth = await import('mammoth');
        const r = await (mammoth.default || mammoth).convertToHtml({ arrayBuffer: await file.arrayBuffer() }, {
          styleMap: ['p[style-name=\'Title\'] => h1:fresh', 'p[style-name=\'Subtitle\'] => h2:fresh', 'br[type=\'page\'] => div.page-break'],
        });
        html = r.value.replace(/<div class="page-break"><\/div>/g, '<div data-page-break></div>');
      } else if (ext === 'html' || ext === 'htm') html = await file.text();
      else html = (await file.text()).split(/\r?\n/).map((l) => `<p>${l.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</p>`).join('');
      const { pendingImports } = await import('./apps/writer.js');
      const id = await createDoc('doc', name);
      pendingImports.set(id, html);
      location.hash = '#/d/' + id;
    } else if (['xlsx', 'xls', 'ods', 'csv', 'tsv'].includes(ext)) {
      const { importSpreadsheet } = await import('./io/xlsx.js');
      const id = await createDoc('sheet', name, null);
      await importSpreadsheet(file, getDoc(id).doc);
      location.hash = '#/d/' + id;
    } else if (ext === 'pptx') {
      const { importPptx } = await import('./io/pptx.js');
      const id = await createDoc('slides', name, null);
      await importPptx(file, getDoc(id).doc);
      location.hash = '#/d/' + id;
    } else toast('Format non pris en charge : .' + ext);
  } catch (e) {
    console.error(e);
    toast('Impossible d\'importer ce fichier : ' + (e.message || e), 5000);
  }
}

// ---- En-tête commun ----
function syncButton() {
  const count = h('span', { class: 'badge' });
  const b = h('button', { class: 'btn ghost sync-btn', title: 'Synchronisation', onclick: openSyncPanel }, icon('sync'), h('span', { class: 'hide-sm' }, 'Synchroniser'), count);
  const upd = () => {
    const n = [...peers.values()].filter((p) => p.state === 'connecté').length;
    count.textContent = n ? String(n) : '';
    b.classList.toggle('live', n > 0 || !!folderStatus.folder);
  };
  upd();
  const off = onPeersChange(upd);
  b.cleanup = off;
  return b;
}

// ---- Accueil ----
function fmtDate(t) {
  const d = new Date(t), now = new Date();
  if (d.toDateString() === now.toDateString()) return 'aujourd\'hui ' + d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: d.getFullYear() === now.getFullYear() ? undefined : 'numeric' });
}

function renderHome() {
  let filter = localStorage.getItem('mythos.filter') || 'all';
  let query = '';
  const list = h('div', { class: 'doc-list' });
  const tabsEl = h('div', { class: 'filter-tabs' });
  const search = h('input', { class: 'field search', placeholder: 'Rechercher…', oninput: () => { query = search.value.toLowerCase(); draw(); } });
  const sb = syncButton();

  const stats = h('div', { class: 'hero-stats' });
  const draw = () => {
    stats.replaceChildren(...['doc', 'sheet', 'slides'].map((t) => h('span', { class: 'stat', title: TYPES[t].label + 's', style: { '--c': TYPES[t].color } },
      icon(t, 16), h('b', null, String(listDocs().filter((d) => d.type === t).length)))));
    tabsEl.replaceChildren(...[['all', 'Tout'], ['doc', 'Documents'], ['sheet', 'Classeurs'], ['slides', 'Présentations']].map(([k, l]) =>
      h('button', { class: 'chip' + (filter === k ? ' on' : ''), onclick: () => { filter = k; localStorage.setItem('mythos.filter', k); draw(); } }, l)));
    const order = { modified: (a, b) => b.modified - a.modified, title: (a, b) => a.title.localeCompare(b.title, 'fr'), type: (a, b) => a.type.localeCompare(b.type) || b.modified - a.modified }[S.get('homeSort')];
    const docs = listDocs().filter((d) => (filter === 'all' || d.type === filter) && (!query || d.title.toLowerCase().includes(query)));
    if (order) docs.sort(order);
    list.className = 'doc-list' + (S.get('homeView') === 'grid' ? ' grid' : '');
    list.replaceChildren(...(docs.length ? docs.map((d) => h('div', { class: 'doc-row', style: { '--c': TYPES[d.type]?.color }, role: 'link', tabindex: 0, onclick: () => (location.hash = '#/d/' + d.id), onkeydown: (e) => e.key === 'Enter' && (location.hash = '#/d/' + d.id) },
      h('span', { class: 'doc-icon', style: { background: TYPES[d.type]?.color } }, icon(d.type, 20)),
      h('div', { class: 'doc-info' }, h('div', { class: 'doc-title' }, d.title), h('div', { class: 'doc-sub' }, `${TYPES[d.type]?.label} · modifié ${fmtDate(d.modified)}${d.by ? ' · ' + d.by : ''}`)),
      h('button', { class: 'icon-btn', title: 'Actions', onclick: (e) => { e.stopPropagation(); docMenu(d, e.currentTarget); } }, icon('more'))))
      : [h('div', { class: 'empty' }, h('p', null, query ? 'Aucun résultat.' : 'Aucun fichier pour l\'instant.'), !query && h('p', { class: 'muted' }, 'Créez un document ci-dessus ou importez un fichier Word, Excel ou PowerPoint.'))]));
  };

  const card = (type, title, sub) => h('button', { class: 'new-card', style: { '--c': TYPES[type].color }, onclick: () => newDoc(type) },
    h('span', { class: 'new-icon', style: { background: TYPES[type].color } }, icon(type, 26)),
    h('span', { class: 'new-text' }, h('b', null, title), h('span', null, sub)));

  const view = h('div', { class: 'home' },
    h('header', { class: 'topbar' },
      h('div', { class: 'brand' }, h('span', { class: 'logo' }, logo()), 'Mythos'),
      h('div', { class: 'grow' }),
      sb,
      h('a', { class: 'btn ghost', href: '#/settings', title: 'Paramètres' }, icon('gear'), h('span', { class: 'hide-sm' }, 'Paramètres'))),
    h('main', { class: 'home-main' },
      h('section', { class: 'hero' },
        h('div', null,
          h('h1', null, greeting()),
          h('p', null, 'Écrivez, calculez et présentez. Tout reste sur vos appareils et se synchronise sans serveur.')),
        stats),
      h('section', { class: 'new-row' },
        card('doc', 'Document', 'Traitement de texte'),
        card('sheet', 'Classeur', 'Tableur et formules'),
        card('slides', 'Présentation', 'Diapositives'),
        h('button', { class: 'new-card import', onclick: async () => importFile(await pickFile('.docx,.xlsx,.xls,.ods,.csv,.pptx,.txt,.md,.html,.mythos')) },
          h('span', { class: 'new-icon' }, icon('upload', 26)), h('span', { class: 'new-text' }, h('b', null, 'Importer'), h('span', null, '.docx · .xlsx · .csv · .pptx')))),
      h('section', { class: 'library' },
        h('div', { class: 'lib-head' }, h('h2', null, 'Fichiers récents'), search),
        tabsEl, list)));

  const off = () => libMap.unobserve(draw);
  libMap.observe(draw);
  draw();
  // Glisser-déposer de fichiers sur l'accueil
  view.addEventListener('dragover', (e) => { e.preventDefault(); view.classList.add('drop'); });
  view.addEventListener('dragleave', () => view.classList.remove('drop'));
  view.addEventListener('drop', (e) => { e.preventDefault(); view.classList.remove('drop'); [...e.dataTransfer.files].forEach(importFile); });
  return { el: view, destroy: () => { off(); sb.cleanup(); } };
}

function greeting() {
  const hr = new Date().getHours();
  return hr < 5 ? 'Bonne nuit' : hr < 12 ? 'Bonjour' : hr < 18 ? 'Bon après-midi' : 'Bonsoir';
}

function docMenu(d, anchor) {
  const close = () => back.remove();
  const item = (ic, label, fn, cls) => h('button', { class: cls, onclick: () => { close(); fn(); } }, icon(ic, 16), label);
  const m = h('div', { class: 'menu-pop' },
    item('text', 'Renommer', async () => { const t = await ask('Renommer', d.title); if (t && t.trim()) updateMeta(d.id, { title: t.trim() }); }),
    item('copy', 'Dupliquer', () => duplicateDoc(d.id)),
    item('trash', 'Supprimer', async () => { if (!S.get('confirmDelete') || await confirmBox('Supprimer', `Supprimer « ${d.title} » sur tous les appareils synchronisés ?`, 'Supprimer')) deleteDoc(d.id); }, 'danger'));
  const back = h('div', { class: 'menu-back', onclick: (e) => e.target === back && close() }, m);
  document.body.append(back);
  const r = anchor.getBoundingClientRect();
  Object.assign(m.style, { top: Math.min(r.bottom + 4, innerHeight - 160) + 'px', left: Math.max(8, r.right - 190) + 'px' });
}

function logo() {
  const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  s.setAttribute('viewBox', '0 0 32 32');
  s.innerHTML = '<defs><linearGradient id="lg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="var(--accent)"/><stop offset="1" stop-color="var(--c-slides)"/></linearGradient></defs><rect x="3" y="3" width="26" height="26" rx="7" fill="url(#lg)"/><rect x="9" y="9" width="6" height="14" rx="2" fill="#fff"/><rect x="17" y="9" width="6" height="6" rx="2" fill="#fff" opacity=".85"/><rect x="17" y="17" width="6" height="6" rx="2" fill="#fff" opacity=".6"/>';
  return s;
}

// ---- Éditeur ----
async function renderEditor(id) {
  await library.ready;
  const meta = () => getMeta(id);
  if (!meta() || meta().deleted) {
    // Le document peut arriver un peu plus tard par la synchronisation.
    return { el: h('div', { class: 'home' }, h('div', { class: 'empty' }, h('p', null, 'Document introuvable.'), h('a', { href: '#/' }, 'Retour à l\'accueil'))), destroy() {} };
  }
  const type = meta().type;
  const title = h('input', { class: 'title-input', value: meta().title, spellcheck: false, 'aria-label': 'Titre du document' });
  title.addEventListener('change', () => title.value.trim() && updateMeta(id, { title: title.value.trim() }));
  title.addEventListener('keydown', (e) => e.key === 'Enter' && title.blur());
  const sb = syncButton();
  const body = h('div', { class: 'editor-body app-' + type });
  const el = h('div', { class: 'editor', style: { '--app': TYPES[type].color } },
    h('header', { class: 'topbar app-bar' },
      h('a', { class: 'btn ghost', href: '#/', title: 'Accueil' }, icon('arrowLeft')),
      h('span', { class: 'doc-icon small', style: { background: TYPES[type].color } }, icon(type, 16)),
      title, h('div', { class: 'grow' }), h('span', { class: 'saved muted hide-sm' }, 'Enregistré localement'), sb),
    body);
  const onMeta = () => { const m = meta(); if (m && document.activeElement !== title) title.value = m.title; };
  libMap.observe(onMeta);
  const entry = getDoc(id);
  await entry.ready;
  const mount = await loaders[type]();
  document.title = meta().title + ' — Mythos';
  const inst = mount(body, { doc: entry.doc, id, meta });
  return { el, destroy: () => { inst.destroy(); libMap.unobserve(onMeta); sb.cleanup(); document.title = 'Mythos'; } };
}

// ---- Routage ----
let routeSeq = 0;
async function route() {
  const seq = ++routeSeq;
  const m = /^#\/d\/(\w+)/.exec(location.hash);
  const view = m ? await renderEditor(m[1])
    : location.hash.startsWith('#/settings') ? (await import('./ui/settingsPage.js')).renderSettings()
    : renderHome();
  if (seq !== routeSeq) return view.destroy();
  current?.destroy();
  current = view;
  app.replaceChildren(view.el);
}
addEventListener('hashchange', route);
S.apply();
library.ready.then(route);
startFolderSync();
if (navigator.storage?.persist) navigator.storage.persist().catch(() => {});
