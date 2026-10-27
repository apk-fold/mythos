// Appairage par code court (4 ou 6 chiffres). Le code sert à se retrouver sur un relais public
// (ntfy.sh par défaut, modifiable) le temps d'échanger l'offre et la réponse WebRTC, chiffrées
// avec une clé dérivée du code. Ensuite, les données circulent directement entre les appareils.
import { createInvite, joinInvite } from './p2p.js';
import * as S from '../settings.js';

const TTL = 3 * 60 * 1000;
const enc = new TextEncoder();
const b64 = (u8) => btoa(String.fromCharCode(...u8));
const unb64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

async function channel(code) {
  const base = S.get('relay').replace(/\/+$/, '');
  const hash = new Uint8Array(await crypto.subtle.digest('SHA-256', enc.encode('mythos-pair-v1:' + code)));
  const topic = 'mythos_' + [...hash.slice(0, 12)].map((b) => b.toString(16).padStart(2, '0')).join('');
  const raw = await crypto.subtle.importKey('raw', enc.encode(code), 'PBKDF2', false, ['deriveKey']);
  const key = await crypto.subtle.deriveKey({ name: 'PBKDF2', salt: enc.encode(topic), iterations: 200000, hash: 'SHA-256' },
    raw, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
  const url = base + '/' + topic;

  async function send(obj) {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(JSON.stringify(obj))));
    const body = b64(iv) + '.' + b64(ct);
    if (body.length > 4000) throw new Error('Invitation trop volumineuse pour le relais');
    const r = await fetch(url, { method: 'POST', body });
    if (!r.ok) throw new Error('Relais injoignable (' + r.status + ')');
  }
  async function open(text) {
    try {
      const [iv, ct] = text.split('.');
      return JSON.parse(new TextDecoder().decode(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(iv) }, key, unb64(ct))));
    } catch { return null; }
  }
  // Écoute les messages du sujet (depuis `since` secondes Unix) jusqu'à ce que `onMsg` renvoie true.
  function listen(since, onMsg) {
    let es, stopped = false, done;
    const finished = new Promise((r) => (done = r));
    const stop = () => { stopped = true; es?.close(); done(); };
    const handle = async (raw) => {
      if (stopped) return;
      let m;
      try { m = JSON.parse(raw); } catch { return; }
      if (m.event && m.event !== 'message') return;
      const o = await open(m.message || '');
      if (o && !stopped && (await onMsg(o))) stop();
    };
    es = new EventSource(`${url}/sse?since=${since}`);
    es.onmessage = (e) => handle(e.data);
    return { stop, finished };
  }
  return { send, listen };
}

export function newCode() {
  const n = S.get('codeDigits') === 6 ? 6 : 4;
  const v = crypto.getRandomValues(new Uint32Array(1))[0] % 10 ** n;
  return String(v).padStart(n, '0');
}

// Appareil A : publie une invitation sous un code et attend qu'un appareil la rejoigne.
// `confirm(name)` peut refuser un appareil ; `onStatus(texte)` informe l'interface.
export async function hostWithCode(code, { confirm, onStatus }) {
  const ch = await channel(code);
  const sid = crypto.randomUUID();
  let linked = false;
  const inv = await createInvite();
  await ch.send({ t: 'offer', sid, code: inv.code, exp: Date.now() + TTL });
  onStatus?.('En attente de l\'autre appareil…');
  const timer = setTimeout(() => { l.stop(); inv.cancel(); onStatus?.('Code expiré. Générez-en un nouveau.'); }, TTL);
  const l = ch.listen(Math.floor(Date.now() / 1000) - 5, async (m) => {
    if (m.t !== 'answer' || m.sid !== sid) return false;
    if (confirm && !(await confirm(m.name || 'Appareil'))) { await ch.send({ t: 'refused', sid }).catch(() => {}); return false; }
    clearTimeout(timer);
    linked = true;
    await inv.accept(m.code);
    onStatus?.('Connexion en cours…');
    return true;
  });
  // Une fois l'appareil accepté, annuler ne fait qu'arrêter l'écoute : la connexion reste ouverte.
  return { cancel: () => { clearTimeout(timer); l.stop(); if (!linked) inv.cancel(); }, finished: l.finished };
}

// Appareil B : retrouve l'invitation publiée sous ce code et y répond.
export async function joinWithCode(code, { onStatus } = {}) {
  const ch = await channel(code);
  onStatus?.('Recherche de l\'appareil…');
  const offer = await new Promise((res, rej) => {
    const t = setTimeout(() => { l.stop(); rej(new Error('Aucun appareil trouvé avec ce code. Vérifiez-le ou générez-en un nouveau.')); }, 15000);
    let best = null;
    const l = ch.listen(Math.floor((Date.now() - TTL) / 1000), (m) => {
      if (m.t !== 'offer' || m.exp < Date.now()) return false;
      best = m;
      // Laisse une seconde pour recevoir une éventuelle invitation plus récente sous le même code.
      setTimeout(() => { clearTimeout(t); l.stop(); res(best); }, 1000);
      return false;
    });
  });
  onStatus?.('Appareil trouvé, connexion…');
  const j = await joinInvite(offer.code);
  await ch.send({ t: 'answer', sid: offer.sid, code: j.code, name: (await import('../store.js')).deviceName() });
  onStatus?.('En attente de la confirmation sur l\'autre appareil…');
  const l = ch.listen(Math.floor(Date.now() / 1000) - 5, (m) => {
    if (m.t === 'refused' && m.sid === offer.sid) { j.cancel(); onStatus?.('L\'autre appareil a refusé la connexion.'); return true; }
    return false;
  });
  setTimeout(l.stop, TTL);
  return { cancel: () => l.stop() };
}
