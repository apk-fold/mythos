// Protocole de synchronisation, indépendant du transport (WebRTC, dossier, fichier).
// Échange des vecteurs d'état Yjs puis des différences : les CRDT fusionnent sans conflit,
// sans serveur et dans n'importe quel ordre.
import * as Y from 'yjs';
import { getDoc, onDocOpened, allDocIds, deviceId } from '../store.js';
import { toB64, fromB64 } from '../util.js';

export function createSession(send) {
  // `remote: true` signale au stockage que ces modifications viennent d'ailleurs.
  const session = { closed: false, remote: true };
  const offs = [];
  const attached = new Set();

  const attach = (id, doc) => {
    if (attached.has(id)) return;
    attached.add(id);
    const onUpdate = (u, origin) => {
      if (origin === session || session.closed) return;
      send({ t: 'u', id, u: toB64(u) });
    };
    doc.on('update', onUpdate);
    offs.push(() => doc.off('update', onUpdate));
  };

  (async () => {
    const ids = await allDocIds();
    const sv = {};
    for (const id of ids) {
      const e = getDoc(id);
      await e.ready;
      sv[id] = toB64(Y.encodeStateVector(e.doc));
    }
    if (session.closed) return;
    send({ t: 'hello', device: deviceId, sv });
    offs.push(onDocOpened(attach));
  })();

  session.receive = async (m) => {
    if (session.closed) return;
    if (m.t === 'hello') {
      for (const id of await allDocIds()) {
        const e = getDoc(id);
        await e.ready;
        const theirs = m.sv[id];
        const u = theirs ? Y.encodeStateAsUpdate(e.doc, fromB64(theirs)) : Y.encodeStateAsUpdate(e.doc);
        if (u.length > 2) send({ t: 'u', id, u: toB64(u) });
      }
    } else if (m.t === 'u') {
      const e = getDoc(m.id);
      await e.ready;
      Y.applyUpdate(e.doc, fromB64(m.u), session);
    }
  };

  session.close = () => {
    session.closed = true;
    offs.forEach((f) => f());
  };
  return session;
}

// ---- Paquet de synchronisation (.mythos) : état complet de tous les documents ----

export const BUNDLE_ORIGIN = { remote: true, bundle: true };

export async function exportBundle() {
  const docs = {};
  for (const id of await allDocIds()) {
    const e = getDoc(id);
    await e.ready;
    docs[id] = toB64(Y.encodeStateAsUpdate(e.doc));
  }
  return JSON.stringify({ format: 'mythos-bundle', version: 1, device: deviceId, exported: Date.now(), docs });
}

export async function importBundle(text) {
  const b = JSON.parse(text);
  if (b.format !== 'mythos-bundle') throw new Error('Fichier de synchronisation invalide');
  // La bibliothèque d'abord, pour que les documents apparaissent avec leur titre.
  const ids = Object.keys(b.docs).sort((a, z) => (a === 'library' ? -1 : z === 'library' ? 1 : 0));
  for (const id of ids) {
    const e = getDoc(id);
    await e.ready;
    Y.applyUpdate(e.doc, fromB64(b.docs[id]), BUNDLE_ORIGIN);
  }
  return ids.length - 1;
}
