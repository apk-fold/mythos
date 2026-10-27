// Stockage local : chaque document est un Y.Doc (CRDT) persisté dans IndexedDB.
// La « bibliothèque » est elle-même un Y.Doc, ce qui la rend synchronisable comme le reste.
import * as Y from 'yjs';
import { IndexeddbPersistence } from 'y-indexeddb';
import { uid } from './util.js';

export const deviceId = (() => {
  let id = localStorage.getItem('mythos.device');
  if (!id) localStorage.setItem('mythos.device', (id = uid()));
  return id;
})();

export const deviceName = () => localStorage.getItem('mythos.deviceName') || defaultDeviceName();
function defaultDeviceName() {
  const ua = navigator.userAgent;
  const os = /Android/.test(ua) ? 'Android' : /Windows/.test(ua) ? 'Windows' : /Linux/.test(ua) ? 'Linux' : /Mac/.test(ua) ? 'Mac' : 'Appareil';
  return `${os} ${deviceId.slice(0, 4)}`;
}

const open = new Map();
const openListeners = new Set();

export function getDoc(id) {
  let e = open.get(id);
  if (!e) {
    const doc = new Y.Doc({ guid: id });
    const persistence = new IndexeddbPersistence('mythos:' + id, doc);
    e = { id, doc, persistence, ready: persistence.whenSynced.then(() => doc) };
    open.set(id, e);
    if (id !== 'library') {
      let t = 0;
      doc.on('update', (_u, origin) => {
        // Seules les modifications faites sur cet appareil changent la date « modifié ».
        if (origin === persistence || origin?.remote) return;
        const now = Date.now();
        if (now - t > 4000) { t = now; touch(id); }
      });
    }
    for (const fn of openListeners) fn(id, doc);
  }
  return e;
}

export function onDocOpened(fn) {
  openListeners.add(fn);
  for (const [id, e] of open) fn(id, e.doc);
  return () => openListeners.delete(fn);
}

export const library = getDoc('library');
export const libMap = library.doc.getMap('docs');

export const TYPES = {
  doc: { label: 'Document', app: 'Texte', ext: '.docx', color: 'var(--c-doc)' },
  sheet: { label: 'Classeur', app: 'Tableur', ext: '.xlsx', color: 'var(--c-sheet)' },
  slides: { label: 'Présentation', app: 'Diapos', ext: '.pptx', color: 'var(--c-slides)' },
};

export const getMeta = (id) => libMap.get(id);
export const listDocs = () => [...libMap.values()].filter((d) => d && !d.deleted).sort((a, b) => b.modified - a.modified);

export function updateMeta(id, patch) {
  const m = libMap.get(id);
  if (m) libMap.set(id, { ...m, ...patch });
}
function touch(id) {
  const m = libMap.get(id);
  if (m && !m.deleted) libMap.set(id, { ...m, modified: Date.now(), by: deviceName() });
}

// Crée le document et son contenu initial sur cet appareil uniquement,
// pour que deux appareils n'initialisent jamais le même document en double.
export async function createDoc(type, title, init) {
  await library.ready;
  const id = uid();
  const e = getDoc(id);
  await e.ready;
  if (init) e.doc.transact(() => init(e.doc), 'init');
  const now = Date.now();
  libMap.set(id, { id, type, title: title || `${TYPES[type].label} sans titre`, created: now, modified: now, by: deviceName() });
  return id;
}

export async function duplicateDoc(id) {
  const src = getDoc(id);
  await src.ready;
  const meta = getMeta(id);
  const update = Y.encodeStateAsUpdate(src.doc);
  return createDoc(meta.type, meta.title + ' (copie)', (doc) => Y.applyUpdate(doc, update));
}

// Corbeille : on garde une pierre tombale pour que la suppression se propage aux autres appareils.
export const deleteDoc = (id) => updateMeta(id, { deleted: true, modified: Date.now() });

export async function allDocIds() {
  await library.ready;
  return ['library', ...libMap.keys()];
}
