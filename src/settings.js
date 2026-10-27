// Paramètres de l'application : stockés par appareil, appliqués en direct via des variables CSS.

export const PALETTES = {
  mythos: { name: 'Mythos', accent: '#7048e8', doc: '#4263eb', sheet: '#0ca678', slides: '#f76707' },
  aurore: { name: 'Aurore', accent: '#d6336c', doc: '#7950f2', sheet: '#12b886', slides: '#fd7e14' },
  ocean: { name: 'Océan', accent: '#1098ad', doc: '#1c7ed6', sheet: '#0ca678', slides: '#4c6ef5' },
  sunset: { name: 'Coucher de soleil', accent: '#f76707', doc: '#e64980', sheet: '#f59f00', slides: '#fa5252' },
  foret: { name: 'Forêt', accent: '#2b8a3e', doc: '#2f9e44', sheet: '#5c940d', slides: '#e67700' },
  bonbon: { name: 'Bonbon', accent: '#f06595', doc: '#845ef7', sheet: '#20c997', slides: '#ff8787' },
  classique: { name: 'Classique', accent: '#3b5bdb', doc: '#3b5bdb', sheet: '#0f9d77', slides: '#e8590c' },
  graphite: { name: 'Graphite', accent: '#495057', doc: '#495057', sheet: '#495057', slides: '#495057' },
};

export const DEFAULTS = {
  // Apparence
  theme: 'auto', palette: 'mythos',
  accent: PALETTES.mythos.accent, cDoc: PALETTES.mythos.doc, cSheet: PALETTES.mythos.sheet, cSlides: PALETTES.mythos.slides,
  background: 'aurora', radius: 12, uiFont: 'inter', fontScale: 100, density: 'normal', animations: true,
  // Éditeurs
  docFont: 'Calibri, Carlito, Inter, sans-serif', docSize: 11, pageColor: '#ffffff', spellcheck: true,
  docLine: 1.55, pageSize: 'a4', pageMargin: 2.2,
  sheetGrid: true, sheetColW: 100, sheetRowH: 24, sheetFont: 13,
  slidesTheme: 'clair', transition: 'fade',
  // Accueil
  homeSort: 'modified', homeView: 'list', confirmDelete: true,
  // Synchronisation
  relay: 'https://ntfy.sh', codeDigits: 4, pairConfirm: true,
  stun: true, stunServers: 'stun:stun.l.google.com:19302\nstun:stun.cloudflare.com:3478', folderInterval: 5,
};

const KEY = 'mythos.settings';
let values = { ...DEFAULTS };
try { Object.assign(values, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch {}
const listeners = new Set();

export const get = (k) => values[k];
export const all = () => ({ ...values });
export const onSettings = (fn) => { listeners.add(fn); return () => listeners.delete(fn); };

export function set(patch) {
  Object.assign(values, patch);
  localStorage.setItem(KEY, JSON.stringify(values));
  apply();
  listeners.forEach((f) => f(values, patch));
}
export function reset(keys) {
  set(Object.fromEntries((keys || Object.keys(DEFAULTS)).map((k) => [k, DEFAULTS[k]])));
}
export function usePalette(id) {
  const p = PALETTES[id];
  set({ palette: id, accent: p.accent, cDoc: p.doc, cSheet: p.sheet, cSlides: p.slides });
}

export const UI_FONTS = {
  inter: ['Inter', 'Inter, "Segoe UI", system-ui, -apple-system, Roboto, sans-serif'],
  system: ['Système', 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif'],
  rounded: ['Arrondie', '"Nunito", "Varela Round", "Segoe UI", system-ui, sans-serif'],
  serif: ['Serif', 'Georgia, "Times New Roman", serif'],
  mono: ['Machine à écrire', '"Cascadia Code", Consolas, "Courier New", monospace'],
};
export const PAGE_SIZES = { a4: ['A4', '21cm', '29.7cm'], letter: ['Lettre US', '21.59cm', '27.94cm'], a5: ['A5', '14.8cm', '21cm'], legal: ['Légal US', '21.59cm', '35.56cm'] };

export function apply() {
  const r = document.documentElement;
  const v = values;
  if (v.theme === 'auto') delete r.dataset.theme; else r.dataset.theme = v.theme;
  r.dataset.bg = v.background;
  r.dataset.density = v.density;
  r.dataset.anim = v.animations ? 'on' : 'off';
  const css = {
    '--accent': v.accent, '--c-doc': v.cDoc, '--c-sheet': v.cSheet, '--c-slides': v.cSlides,
    '--font-ui': (UI_FONTS[v.uiFont] || UI_FONTS.inter)[1], '--doc-line': v.docLine, '--page-m': v.pageMargin + 'cm',
    '--page-w': (PAGE_SIZES[v.pageSize] || PAGE_SIZES.a4)[1], '--page-h': (PAGE_SIZES[v.pageSize] || PAGE_SIZES.a4)[2],
    '--radius': v.radius + 'px', '--doc-font': v.docFont, '--doc-size': v.docSize + 'pt', '--page-bg': v.pageColor,
  };
  for (const [k, x] of Object.entries(css)) r.style.setProperty(k, x);
  r.style.setProperty('--ui-scale', v.fontScale / 100);
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', v.accent);
}

// Sauvegarde / restauration des réglages seuls (fichier JSON).
export const exportJSON = () => JSON.stringify({ mythosSettings: 1, values }, null, 2);
export function importJSON(text) {
  const o = JSON.parse(text);
  if (!o || o.mythosSettings !== 1) throw new Error('Ce fichier ne contient pas de réglages Mythos');
  set(Object.fromEntries(Object.entries(o.values).filter(([k]) => k in DEFAULTS)));
}

export const stunList = () => (values.stun ? values.stunServers.split(/\s+/).filter((s) => /^stuns?:/.test(s)).map((urls) => ({ urls })) : []);
