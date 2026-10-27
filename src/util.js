// Petits utilitaires partagés : DOM, encodage, fichiers, boîtes de dialogue.

export const uid = () =>
  (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2)).replace(/-/g, '').slice(0, 16);

export function h(tag, props, ...children) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(props || {})) {
    if (v == null || v === false) continue;
    if (k.startsWith('on') && typeof v === 'function') e.addEventListener(k.slice(2).toLowerCase(), v);
    else if (k === 'class') e.className = v;
    else if (k === 'style' && typeof v === 'object') Object.assign(e.style, v);
    else if (k === 'html') e.innerHTML = v;
    else if (k === 'value' || k === 'checked' || k === 'selected') e[k] = v;
    else e.setAttribute(k, v === true ? '' : v);
  }
  for (const c of children.flat(Infinity)) if (c != null && c !== false) e.append(c.nodeType ? c : String(c));
  return e;
}

export function toB64(u8) {
  let s = '';
  for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000));
  return btoa(s);
}
export function fromB64(b64) {
  const s = atob(b64);
  const u8 = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) u8[i] = s.charCodeAt(i);
  return u8;
}
export const blobToB64 = async (blob) => toB64(new Uint8Array(await blob.arrayBuffer()));
export const readAsDataURL = (blob) =>
  new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(blob); });

export function debounce(fn, ms) {
  let t;
  return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
}

export const isNativeAndroid = () => !!window.Capacitor?.isNativePlatform?.();
export const isElectron = () => !!window.mythosNative;

// Enregistre un fichier : boîte de dialogue native (Electron), partage Android, ou téléchargement navigateur.
export async function saveFile(name, blob) {
  if (isElectron()) return window.mythosNative.saveFile(name, await blobToB64(blob));
  if (isNativeAndroid()) {
    const { Filesystem, Directory } = await import('@capacitor/filesystem');
    const { Share } = await import('@capacitor/share');
    const r = await Filesystem.writeFile({ path: name, data: await blobToB64(blob), directory: Directory.Cache });
    await Share.share({ title: name, url: r.uri, dialogTitle: 'Enregistrer ou partager' });
    return true;
  }
  const a = h('a', { href: URL.createObjectURL(blob), download: name });
  document.body.append(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  return true;
}

export function pickFile(accept) {
  return new Promise((res) => {
    const i = h('input', { type: 'file', accept, style: { display: 'none' } });
    i.onchange = () => { res(i.files[0] || null); i.remove(); };
    document.body.append(i);
    i.click();
  });
}

export const safeName = (s) => (s || 'sans-titre').replace(/[\\/:*?"<>|]+/g, '_').trim() || 'sans-titre';

// ---- Notifications et boîtes de dialogue (window.prompt n'existe pas sous Electron) ----

export function toast(msg, ms = 2600) {
  let wrap = document.querySelector('.toasts');
  if (!wrap) document.body.append((wrap = h('div', { class: 'toasts' })));
  const t = h('div', { class: 'toast' }, msg);
  wrap.append(t);
  setTimeout(() => t.remove(), ms);
}

export function modal(title, body, { wide = false, onClose } = {}) {
  const close = () => { back.remove(); onClose?.(); };
  const back = h('div', { class: 'modal-back', onmousedown: (e) => e.target === back && close() },
    h('div', { class: 'modal' + (wide ? ' wide' : ''), role: 'dialog' },
      h('div', { class: 'modal-head' }, h('h2', null, title), h('button', { class: 'icon-btn', title: 'Fermer', onclick: close }, '✕')),
      h('div', { class: 'modal-body' }, body)));
  document.body.append(back);
  return { close, el: back };
}

export function ask(title, value = '', label = '') {
  return new Promise((res) => {
    const input = h('input', { class: 'field', value });
    let done = false;
    const finish = (v) => { if (done) return; done = true; m.close(); res(v); };
    const m = modal(title, h('form', { class: 'stack', onsubmit: (e) => { e.preventDefault(); finish(input.value); } },
      label && h('label', null, label), input,
      h('div', { class: 'row end' },
        h('button', { type: 'button', class: 'btn', onclick: () => finish(null) }, 'Annuler'),
        h('button', { type: 'submit', class: 'btn primary' }, 'Valider'))), { onClose: () => finish(null) });
    setTimeout(() => { input.focus(); input.select(); }, 30);
  });
}

export function confirmBox(title, text, okLabel = 'Confirmer') {
  return new Promise((res) => {
    let done = false;
    const finish = (v) => { if (done) return; done = true; m.close(); res(v); };
    const m = modal(title, h('div', { class: 'stack' }, h('p', null, text),
      h('div', { class: 'row end' },
        h('button', { class: 'btn', onclick: () => finish(false) }, 'Annuler'),
        h('button', { class: 'btn danger', onclick: () => finish(true) }, okLabel))), { onClose: () => finish(false) });
  });
}

// Normalise une couleur CSS (#abc, #aabbcc, rgb()) en "RRGGBB" ; null si inconnue.
export function toHex(c) {
  if (!c) return null;
  c = String(c).trim();
  let m = /^#([0-9a-f]{3})$/i.exec(c);
  if (m) return m[1].split('').map((x) => x + x).join('').toUpperCase();
  m = /^#([0-9a-f]{6})/i.exec(c);
  if (m) return m[1].toUpperCase();
  m = /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i.exec(c);
  if (m) return [m[1], m[2], m[3]].map((x) => (+x).toString(16).padStart(2, '0')).join('').toUpperCase();
  return null;
}

// Réduit une image (data URL) pour garder les documents légers à synchroniser.
export function downscaleImage(dataUrl, max = 1600) {
  return new Promise((res) => {
    const img = new Image();
    img.onload = () => {
      const k = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
      if (k === 1 && dataUrl.length < 1.5e6) return res({ src: dataUrl, w: img.naturalWidth, h: img.naturalHeight });
      const cv = h('canvas', { width: Math.round(img.naturalWidth * k), height: Math.round(img.naturalHeight * k) });
      cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
      const isPng = /^data:image\/(png|gif|svg)/.test(dataUrl);
      res({ src: cv.toDataURL(isPng ? 'image/png' : 'image/jpeg', 0.86), w: cv.width, h: cv.height });
    };
    img.onerror = () => res({ src: dataUrl, w: 400, h: 300 });
    img.src = dataUrl;
  });
}
