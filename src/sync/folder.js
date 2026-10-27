// Synchronisation par dossier partagé (Syncthing, clé USB, partage réseau, cloud…).
// Chaque appareil écrit uniquement son propre fichier et lit ceux des autres :
// aucun conflit d'écriture possible, la fusion est assurée par les CRDT.
import { exportBundle, importBundle, BUNDLE_ORIGIN } from './engine.js';
import { deviceId, onDocOpened } from '../store.js';
import { get as setting, onSettings } from '../settings.js';

const KEY = 'mythos.syncFolder';
const own = `mythos-${deviceId}.mythos`;
let timer = null;
let dirty = true;
let seen = {};
const listeners = new Set();
export const status = { folder: localStorage.getItem(KEY) || '', last: 0, error: '', peers: 0 };
export const onFolderStatus = (fn) => { listeners.add(fn); return () => listeners.delete(fn); };
const emit = () => listeners.forEach((f) => f(status));

onDocOpened((_id, doc) => doc.on('update', (_u, origin) => { if (origin !== BUNDLE_ORIGIN) dirty = true; }));

async function tick() {
  const native = window.mythosNative;
  if (!native || !status.folder) return;
  try {
    const files = await native.listDir(status.folder);
    const others = files.filter((f) => /^mythos-[\w-]+\.mythos$/.test(f.name) && f.name !== own);
    for (const f of others) {
      if (seen[f.name] === f.mtime) continue;
      await importBundle(await native.readText(status.folder, f.name));
      seen[f.name] = f.mtime;
    }
    if (dirty) {
      dirty = false;
      await native.writeText(status.folder, own, await exportBundle());
    }
    status.peers = others.length;
    status.last = Date.now();
    status.error = '';
  } catch (e) {
    status.error = String(e.message || e);
  }
  emit();
}

export function startFolderSync() {
  stopFolderSync();
  if (!status.folder || !window.mythosNative) return;
  seen = {};
  dirty = true;
  tick();
  timer = setInterval(tick, setting('folderInterval') * 1000);
}
export function stopFolderSync() { clearInterval(timer); timer = null; }

export async function chooseFolder() {
  const f = await window.mythosNative.pickFolder();
  if (!f) return;
  status.folder = f;
  localStorage.setItem(KEY, f);
  startFolderSync();
  emit();
}
export function forgetFolder() {
  stopFolderSync();
  status.folder = '';
  localStorage.removeItem(KEY);
  emit();
}
export const syncNow = tick;

onSettings((_v, patch) => { if ('folderInterval' in patch && timer) startFolderSync(); });
