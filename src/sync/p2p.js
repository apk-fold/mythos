// Connexion directe entre appareils via WebRTC, sans serveur de signalisation :
// l'offre et la réponse sont échangées à la main (code texte ou QR code).
import { createSession } from './engine.js';
import { uid } from '../util.js';
import { deviceName } from '../store.js';
import { stunList } from '../settings.js';

const CHUNK = 15000;

export const peers = new Map();
const listeners = new Set();
export const onPeersChange = (fn) => { listeners.add(fn); return () => listeners.delete(fn); };
const emit = () => listeners.forEach((f) => f([...peers.values()]));

async function pipe(text, stream) {
  return new Response(new Blob([text]).stream().pipeThrough(stream));
}
async function encodeSignal(desc) {
  const json = JSON.stringify({ t: desc.type, s: desc.sdp, n: deviceName() });
  const buf = new Uint8Array(await (await pipe(json, new CompressionStream('deflate-raw'))).arrayBuffer());
  let s = '';
  buf.forEach((b) => (s += String.fromCharCode(b)));
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
async function decodeSignal(code) {
  const b64 = code.trim().replace(/\s+/g, '').replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(b64 + '==='.slice((b64.length + 3) % 4));
  const u8 = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  const o = JSON.parse(await (await pipe(u8, new DecompressionStream('deflate-raw'))).text());
  return { desc: { type: o.t, sdp: o.s }, name: o.n };
}

function waitIce(pc) {
  return new Promise((res) => {
    if (pc.iceGatheringState === 'complete') return res();
    const t = setTimeout(res, 5000);
    pc.addEventListener('icegatheringstatechange', () => {
      if (pc.iceGatheringState === 'complete') { clearTimeout(t); res(); }
    });
  });
}

function wire(pc, dc, name) {
  const id = uid();
  const peer = { id, name: name || 'Appareil', state: 'connexion…', pc };
  peers.set(id, peer);
  emit();

  const queue = [];
  const flush = () => {
    while (queue.length && dc.readyState === 'open' && dc.bufferedAmount < 1 << 20) dc.send(queue.shift());
  };
  dc.bufferedAmountLowThreshold = 1 << 18;
  dc.onbufferedamountlow = flush;
  const send = (obj) => {
    const s = JSON.stringify(obj);
    if (s.length <= CHUNK) queue.push(s);
    else {
      const cid = uid();
      const n = Math.ceil(s.length / CHUNK);
      for (let i = 0; i < n; i++) queue.push(JSON.stringify({ t: 'c', cid, i, n, d: s.slice(i * CHUNK, (i + 1) * CHUNK) }));
    }
    flush();
  };

  let session = null;
  const parts = new Map();
  dc.onopen = () => {
    peer.state = 'connecté';
    emit();
    session = createSession(send);
  };
  dc.onmessage = (e) => {
    let m = JSON.parse(e.data);
    if (m.t === 'c') {
      const arr = parts.get(m.cid) || [];
      arr[m.i] = m.d;
      parts.set(m.cid, arr);
      if (arr.filter((x) => x != null).length < m.n) return;
      parts.delete(m.cid);
      m = JSON.parse(arr.join(''));
    }
    session?.receive(m);
  };
  const close = () => {
    session?.close();
    peers.delete(id);
    emit();
  };
  dc.onclose = close;
  pc.onconnectionstatechange = () => {
    if (['failed', 'closed', 'disconnected'].includes(pc.connectionState)) {
      if (pc.connectionState !== 'disconnected') close();
      else { peer.state = 'interrompu…'; emit(); }
    } else if (pc.connectionState === 'connected' && session) { peer.state = 'connecté'; emit(); }
  };
  peer.disconnect = () => { try { dc.close(); pc.close(); } catch {} close(); };
  if (dc.readyState === 'open') dc.onopen();
  return peer;
}

// Étape 1 (appareil A) : créer une invitation.
export async function createInvite() {
  const pc = new RTCPeerConnection({ iceServers: stunList() });
  const dc = pc.createDataChannel('mythos', { ordered: true });
  await pc.setLocalDescription(await pc.createOffer());
  await waitIce(pc);
  return {
    code: await encodeSignal(pc.localDescription),
    // Étape 3 (appareil A) : coller la réponse de B.
    async accept(answerCode) {
      const { desc, name } = await decodeSignal(answerCode);
      if (desc.type !== 'answer') throw new Error("Ce code n'est pas une réponse");
      wire(pc, dc, name);
      await pc.setRemoteDescription(desc);
    },
    cancel: () => pc.close(),
  };
}

// Étape 2 (appareil B) : rejoindre avec le code de A, renvoie le code réponse.
export async function joinInvite(code) {
  const { desc, name } = await decodeSignal(code);
  if (desc.type !== 'offer') throw new Error("Ce code n'est pas une invitation");
  const pc = new RTCPeerConnection({ iceServers: stunList() });
  pc.ondatachannel = (e) => wire(pc, e.channel, name);
  await pc.setRemoteDescription(desc);
  await pc.setLocalDescription(await pc.createAnswer());
  await waitIce(pc);
  return { code: await encodeSignal(pc.localDescription), cancel: () => pc.close() };
}
