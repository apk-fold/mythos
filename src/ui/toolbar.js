// Barre d'outils (« ruban ») : boutons à icônes, sélecteurs et pastilles de couleur.
import { h } from '../util.js';

const P = {
  undo: '<path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/>',
  redo: '<path d="m15 14 5-5-5-5"/><path d="M20 9H9.5a5.5 5.5 0 0 0 0 11H13"/>',
  bold: '<path d="M7 5h6a3.5 3.5 0 0 1 0 7H7zM7 12h7a3.5 3.5 0 0 1 0 7H7z"/>',
  italic: '<path d="M14 5h-4M14 19h-4M15 5 9 19"/>',
  underline: '<path d="M7 4v7a5 5 0 0 0 10 0V4M5 20h14"/>',
  strike: '<path d="M16 6.5C15 5 13.6 4.5 12 4.5c-2.5 0-4 1.3-4 3 0 4 8 2.5 8 7 0 1.8-1.7 3-4 3-1.8 0-3.4-.7-4.3-2.2M4 12h16"/>',
  textColor: '<path d="m6 16 6-13 6 13M8.3 11h7.4"/>',
  fill: '<path d="m4 12 7-7 7 7-7 7z"/><path d="M19 15s2 2.2 2 3.5a2 2 0 0 1-4 0c0-1.3 2-3.5 2-3.5"/>',
  highlight: '<path d="m9 11-5 5v3h3l5-5M14 6l4 4M9 11l5-5 4 4-5 5"/>',
  alignLeft: '<path d="M4 6h16M4 10h10M4 14h16M4 18h10"/>',
  alignCenter: '<path d="M4 6h16M7 10h10M4 14h16M7 18h10"/>',
  alignRight: '<path d="M4 6h16M10 10h10M4 14h16M10 18h10"/>',
  alignJustify: '<path d="M4 6h16M4 10h16M4 14h16M4 18h16"/>',
  bulletList: '<path d="M9 6h11M9 12h11M9 18h11"/><circle cx="4.5" cy="6" r="1"/><circle cx="4.5" cy="12" r="1"/><circle cx="4.5" cy="18" r="1"/>',
  orderedList: '<path d="M10 6h10M10 12h10M10 18h10M4 4h1.5v4M4 8h3M4 14.5c0-1 2.8-1.2 2.8.2 0 1-2.8 2.3-2.8 3.3h3"/>',
  quote: '<path d="M7 7h4v4c0 3-1.5 5-4 6M14 7h4v4c0 3-1.5 5-4 6"/>',
  code: '<path d="m8 8-4 4 4 4M16 8l4 4-4 4"/>',
  table: '<rect x="3" y="4" width="18" height="16" rx="1.5"/><path d="M3 10h18M3 15h18M9 4v16M15 4v16"/>',
  image: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="1.8"/><path d="m21 16-5-5-9 9"/>',
  hr: '<path d="M3 12h18"/><path d="M8 7h8M8 17h8" opacity=".35"/>',
  clearFormat: '<path d="M6 5h12M12 5l-3 14M15 15l5 5M20 15l-5 5"/>',
  rowAdd: '<rect x="3" y="11" width="18" height="9" rx="1"/><path d="M12 3v6M9 6h6"/>',
  rowDel: '<rect x="3" y="11" width="18" height="9" rx="1"/><path d="M9 6h6"/>',
  colAdd: '<rect x="11" y="3" width="9" height="18" rx="1"/><path d="M3 12h6M6 9v6"/>',
  colDel: '<rect x="11" y="3" width="9" height="18" rx="1"/><path d="M3 12h6"/>',
  sortAsc: '<path d="M7 4v16M3 16l4 4 4-4M14 5h3l-3 6h3M14 14h4M14 19h4M16 14v5" />',
  sortDesc: '<path d="M7 4v16M3 8l4-4 4 4M14 5h3l-3 6h3M14 14h4M14 19h4M16 14v5" />',
  sum: '<path d="M18 5H6l6 7-6 7h12"/>',
  download: '<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>',
  csv: '<path d="M14 3H6v18h12V7z"/><path d="M14 3v4h4M9 13h6M9 17h6"/>',
  print: '<path d="M7 9V3h10v6M7 17H4v-7h16v7h-3"/><rect x="7" y="14" width="10" height="7"/>',
  play: '<path d="M7 4v16l13-8z"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  text: '<path d="M5 6V4h14v2M12 4v16M9 20h6"/>',
  rect: '<rect x="4" y="6" width="16" height="12" rx="1"/>',
  ellipse: '<ellipse cx="12" cy="12" rx="8.5" ry="6.5"/>',
  line: '<path d="M5 19 19 5"/>',
  trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',
  copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/>',
  front: '<rect x="8" y="8" width="12" height="12" rx="1" fill="currentColor"/><path d="M16 4H4v12"/>',
  back: '<rect x="4" y="4" width="12" height="12" rx="1" fill="currentColor"/><path d="M20 8v12H8"/>',
  up: '<path d="m6 15 6-6 6 6"/>',
  down: '<path d="m6 9 6 6 6-6"/>',
  sync: '<path d="M20 11a8 8 0 0 0-14.5-4.5L4 8M4 4v4h4M4 13a8 8 0 0 0 14.5 4.5L20 16M20 20v-4h-4"/>',
  arrowLeft: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
  upload: '<path d="M12 20V9M7 14l5-5 5 5M5 4h14"/>',
  link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
  pageBreak: '<path d="M6 3v5h12V3M6 21v-5h12v5M3 12h3M9 12h2M13 12h2M18 12h3"/>',
  valignTop: '<path d="M4 4h16M12 20V8M8 12l4-4 4 4"/>',
  valignMiddle: '<path d="M4 12h16M12 3v5M12 21v-5M9 6l3 2 3-2M9 18l3-2 3 2"/>',
  valignBottom: '<path d="M4 20h16M12 4v12M8 12l4 4 4-4"/>',
  notes: '<path d="M5 4h14v16H5zM8 9h8M8 13h8M8 17h5"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2"/>',
  doc: '<path d="M14 3H6v18h12V7z"/><path d="M14 3v4h4M9 12h6M9 16h6"/>',
  sheet: '<rect x="3.5" y="4" width="17" height="16" rx="1.5"/><path d="M3.5 9.5h17M3.5 14.5h17M9.5 4v16"/>',
  slides: '<rect x="3" y="4" width="18" height="12" rx="1.5"/><path d="M12 16v4M8 20h8"/>',
  more: '<circle cx="5" cy="12" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="19" cy="12" r="1.4"/>',
  theme: '<circle cx="12" cy="12" r="8"/><path d="M12 4a8 8 0 0 0 0 16z" fill="currentColor"/>',
  fullscreen: '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>',
};

export function icon(name, size = 18) {
  const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  s.setAttribute('viewBox', '0 0 24 24');
  s.setAttribute('width', size);
  s.setAttribute('height', size);
  s.setAttribute('fill', 'none');
  s.setAttribute('stroke', 'currentColor');
  s.setAttribute('stroke-width', '1.8');
  s.setAttribute('stroke-linecap', 'round');
  s.setAttribute('stroke-linejoin', 'round');
  s.setAttribute('aria-hidden', 'true');
  s.innerHTML = P[name] || '';
  return s;
}

export const tbtn = (ic, title, onclick, label) =>
  h('button', { class: 'tb' + (label ? ' wide' : ''), title, 'aria-label': title, onmousedown: (e) => e.preventDefault(), onclick }, icon(ic), label && h('span', null, label));

export const sep = () => h('span', { class: 'tb-sep' });

export function sel(options, onchange, title) {
  const s = h('select', { class: 'tb-select', title, 'aria-label': title, onchange: () => onchange(s.value) },
    options.map(([v, l]) => h('option', { value: v }, l)));
  return s;
}

const SWATCHES = ['#000000', '#495057', '#868e96', '#ffffff', '#c92a2a', '#e8590c', '#f08c00', '#2f9e44', '#0c8599', '#1971c2', '#5f3dc4', '#a61e4d',
  '#ffc9c9', '#ffd8a8', '#ffec99', '#b2f2bb', '#99e9f2', '#a5d8ff', '#d0bfff', '#fcc2d7'];

// Bouton couleur : clic = applique la dernière couleur, flèche = palette.
export function colorBtn(ic, title, initial, apply, { allowNone = true } = {}) {
  let current = initial;
  const bar = h('span', { class: 'swatch-bar', style: { background: current } });
  const main = h('button', { class: 'tb color', title, 'aria-label': title, onmousedown: (e) => e.preventDefault(), onclick: () => apply(current) }, icon(ic), bar);
  const custom = h('input', { type: 'color', value: initial.length === 7 ? initial : '#000000', oninput: () => pick(custom.value) });
  const pop = h('div', { class: 'swatches' },
    SWATCHES.map((c) => h('button', { class: 'sw', title: c, style: { background: c }, onmousedown: (e) => e.preventDefault(), onclick: () => pick(c) })),
    allowNone && h('button', { class: 'sw none', title: 'Aucune', onmousedown: (e) => e.preventDefault(), onclick: () => pick(null) }, '∅'),
    h('label', { class: 'sw custom', title: 'Personnalisée' }, '+', custom));
  const arrow = h('button', { class: 'tb arrow', title: title + ' : choisir', onmousedown: (e) => e.preventDefault(), onclick: (e) => {
    e.stopPropagation();
    const open = pop.classList.toggle('open');
    if (open) { const off = () => { pop.classList.remove('open'); document.removeEventListener('pointerdown', out); }; const out = (ev) => { if (!wrap.contains(ev.target)) off(); }; document.addEventListener('pointerdown', out); }
  } }, '▾');
  function pick(c) {
    pop.classList.remove('open');
    if (c) { current = c; bar.style.background = c; }
    apply(c || undefined);
  }
  const wrap = h('span', { class: 'color-wrap' }, main, arrow, pop);
  return wrap;
}
