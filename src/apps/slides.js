// Éditeur de présentations : diapositives 16:9 en coordonnées logiques 960×540,
// éléments positionnés librement (texte, formes, images), mode présentation plein écran.
import * as Y from 'yjs';
import { h, uid, saveFile, safeName, pickFile, readAsDataURL, downscaleImage, toast } from '../util.js';
import { tbtn, sep, sel, colorBtn, icon } from '../ui/toolbar.js';
import { exportPptx } from '../io/pptx.js';
import * as S from '../settings.js';

export const SW = 960, SH = 540;

export const THEMES = {
  clair: { name: 'Clair', bg: '#ffffff', title: '#1c2433', text: '#343a40', accent: '#e8590c' },
  sombre: { name: 'Nuit', bg: '#141821', title: '#f8f9fa', text: '#ced4da', accent: '#ffa94d' },
  ocean: { name: 'Océan', bg: '#0b3954', title: '#ffffff', text: '#d0ebff', accent: '#4dabf7' },
  sable: { name: 'Sable', bg: '#f8f1e5', title: '#5c3b1e', text: '#6b4f36', accent: '#c4561d' },
  foret: { name: 'Forêt', bg: '#eef5ef', title: '#1d3b2a', text: '#2f4f3a', accent: '#2f9e44' },
};
const FONTS = [['Inter, system-ui, sans-serif', 'Sans-serif'], ['Georgia, serif', 'Georgia'], ['"Times New Roman", serif', 'Times'], ['Arial, sans-serif', 'Arial'], ['Verdana, sans-serif', 'Verdana'], ['"Courier New", monospace', 'Courier']];
const SIZES = [12, 14, 16, 18, 20, 24, 28, 32, 36, 40, 48, 56, 64, 72, 96].map((s) => [String(s), String(s)]);

export function elMap(o) {
  const m = new Y.Map();
  for (const [k, v] of Object.entries({ id: uid(), ...o })) m.set(k, v);
  return m;
}
export function slideMap(o = {}, els = []) {
  const m = new Y.Map();
  m.set('id', uid());
  m.set('bg', o.bg || '#ffffff');
  m.set('notes', o.notes || '');
  const arr = new Y.Array();
  arr.push(els);
  m.set('els', arr);
  return m;
}

const text = (o) => ({ type: 'text', font: FONTS[0][0], bold: false, italic: false, underline: false, align: 'left', valign: 'top', text: '', ...o });

function layout(kind, t) {
  switch (kind) {
    case 'title': return [
      elMap(text({ x: 80, y: 170, w: 800, h: 120, fs: 56, bold: true, align: 'center', valign: 'bottom', color: t.title, ph: 'Cliquez pour ajouter un titre' })),
      elMap(text({ x: 80, y: 300, w: 800, h: 70, fs: 26, align: 'center', color: t.text, ph: 'Sous-titre' })),
    ];
    case 'content': return [
      elMap(text({ x: 60, y: 36, w: 840, h: 80, fs: 40, bold: true, valign: 'middle', color: t.title, ph: 'Titre de la diapositive' })),
      elMap(text({ x: 60, y: 130, w: 840, h: 370, fs: 24, bullets: true, color: t.text, ph: 'Cliquez pour ajouter du texte' })),
    ];
    case 'two': return [
      elMap(text({ x: 60, y: 36, w: 840, h: 80, fs: 40, bold: true, valign: 'middle', color: t.title, ph: 'Titre de la diapositive' })),
      elMap(text({ x: 60, y: 130, w: 405, h: 370, fs: 22, bullets: true, color: t.text, ph: 'Colonne de gauche' })),
      elMap(text({ x: 495, y: 130, w: 405, h: 370, fs: 22, bullets: true, color: t.text, ph: 'Colonne de droite' })),
    ];
    case 'section': return [
      elMap({ type: 'rect', x: 0, y: 0, w: 14, h: 540, fill: t.accent, stroke: null, strokeW: 0, text: '' }),
      elMap(text({ x: 80, y: 200, w: 800, h: 100, fs: 48, bold: true, valign: 'middle', color: t.title, ph: 'Titre de section' })),
    ];
    default: return [];
  }
}

export function initSlides(doc) {
  const key = THEMES[S.get('slidesTheme')] ? S.get('slidesTheme') : 'clair';
  doc.getMap('props').set('theme', key);
  doc.getArray('slides').push([slideMap({ bg: THEMES[key].bg }, layout('title', THEMES[key]))]);
}

// ---- Rendu d'une diapositive (partagé : éditeur, miniatures, présentation, export PDF) ----
export function applyEl(div, m, { editable = false, editing = false } = {}) {
  const t = m.get('type');
  div.className = 'el el-' + t;
  Object.assign(div.style, { left: m.get('x') + 'px', top: m.get('y') + 'px', width: m.get('w') + 'px', height: m.get('h') + 'px' });
  if (t === 'image') {
    let img = div.querySelector('img');
    if (!img) div.append((img = h('img', { draggable: 'false', alt: '' })));
    if (img.getAttribute('src') !== m.get('src')) img.src = m.get('src');
    return;
  }
  if (t === 'line') {
    div.innerHTML = '';
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '100%'); svg.setAttribute('height', '100%');
    svg.setAttribute('viewBox', `0 0 ${Math.max(1, m.get('w'))} ${Math.max(1, m.get('h'))}`);
    svg.setAttribute('preserveAspectRatio', 'none');
    svg.innerHTML = `<line x1="0" y1="${m.get('flip') ? m.get('h') : 0}" x2="${m.get('w')}" y2="${m.get('flip') ? 0 : m.get('h')}" stroke="${m.get('stroke') || '#343a40'}" stroke-width="${m.get('strokeW') || 3}" vector-effect="non-scaling-stroke"/>`;
    div.append(svg);
    return;
  }
  div.style.background = m.get('fill') || 'transparent';
  div.style.border = m.get('stroke') && m.get('strokeW') ? `${m.get('strokeW')}px solid ${m.get('stroke')}` : 'none';
  div.style.borderRadius = t === 'ellipse' ? '50%' : t === 'rect' && m.get('radius') ? m.get('radius') + 'px' : '0';
  div.style.justifyContent = { top: 'flex-start', middle: 'center', bottom: 'flex-end' }[m.get('valign') || (t === 'text' ? 'top' : 'middle')];
  let inner = div.querySelector('.el-text');
  if (!inner) div.append((inner = h('div', { class: 'el-text' })));
  Object.assign(inner.style, {
    fontFamily: m.get('font') || FONTS[0][0], fontSize: (m.get('fs') || 24) + 'px', color: m.get('color') || '#222',
    fontWeight: m.get('bold') ? '700' : '400', fontStyle: m.get('italic') ? 'italic' : 'normal',
    textDecoration: m.get('underline') ? 'underline' : 'none', textAlign: m.get('align') || (t === 'text' ? 'left' : 'center'),
  });
  const txt = m.get('text') || '';
  inner.classList.toggle('bullets', !!m.get('bullets') && !editing);
  if (!editing) {
    if (m.get('bullets') && txt) inner.replaceChildren(...txt.split('\n').map((l) => h('div', { class: l.trim() ? 'li' : 'li empty' }, l || '​')));
    else inner.textContent = txt;
  }
  inner.dataset.ph = editable && !txt && m.get('ph') ? m.get('ph') : '';
}

export function renderSlide(slide, container, opts = {}) {
  container.style.background = slide.get('bg') || '#fff';
  const cache = opts.cache || new Map();
  const seen = new Set();
  let prev = null;
  for (const m of slide.get('els').toArray()) {
    const id = m.get('id');
    seen.add(id);
    let div = cache.get(id);
    if (!div) { div = h('div', { 'data-id': id }); cache.set(id, div); }
    applyEl(div, m, { editable: opts.editable, editing: opts.editingId === id });
    if (opts.selectedId === id) {
      div.classList.add('selected');
      if (!div.querySelector('.handle')) for (const p of ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w']) div.append(h('span', { class: 'handle h-' + p, 'data-h': p }));
    } else div.querySelectorAll('.handle').forEach((x) => x.remove());
    const expected = prev ? prev.nextSibling : container.firstChild;
    if (expected !== div) container.insertBefore(div, expected);
    prev = div;
  }
  for (const [id, div] of cache) if (!seen.has(id)) { div.remove(); cache.delete(id); }
  return cache;
}

export function mountSlides(root, { doc, meta }) {
  const yslides = doc.getArray('slides');
  const props = doc.getMap('props');
  if (yslides.length === 0) doc.transact(() => initSlides(doc));
  const um = new Y.UndoManager([yslides, props], { captureTimeout: 500 });
  const theme = () => THEMES[props.get('theme')] || THEMES.clair;

  let cur = yslides.get(0);
  let selectedId = null, editingId = null;
  const els = () => cur.get('els');
  const selEl = () => els().toArray().find((m) => m.get('id') === selectedId) || null;

  // ---- DOM ----
  const thumbs = h('div', { class: 'thumbs' });
  const slideEl = h('div', { class: 'slide editable' });
  const stage = h('div', { class: 'stage' }, h('div', { class: 'slide-frame' }, slideEl));
  const notes = h('textarea', { class: 'notes', placeholder: 'Notes du présentateur…' });
  const layoutSel = sel([['', '＋ Nouvelle diapo'], ['content', 'Titre et contenu'], ['title', 'Diapo de titre'], ['two', 'Deux colonnes'], ['section', 'Section'], ['blank', 'Vide']], (v) => { if (v) addSlide(v); layoutSel.value = ''; }, 'Nouvelle diapositive');
  const themeSel = sel(Object.entries(THEMES).map(([k, t]) => [k, 'Thème : ' + t.name]), (v) => applyTheme(v), 'Thème');

  const ribbon = h('div', { class: 'ribbon' },
    tbtn('undo', 'Annuler (Ctrl+Z)', () => um.undo()), tbtn('redo', 'Rétablir (Ctrl+Y)', () => um.redo()), sep(),
    layoutSel, tbtn('copy', 'Dupliquer la diapositive', duplicateSlide), tbtn('trash', 'Supprimer la diapositive', deleteSlide), sep(),
    tbtn('text', 'Zone de texte', () => addEl(text({ x: 330, y: 230, w: 300, h: 80, fs: 24, color: theme().text, text: 'Texte' })), 'Texte'),
    tbtn('rect', 'Rectangle', () => addEl({ type: 'rect', x: 380, y: 195, w: 200, h: 150, fill: theme().accent, stroke: null, strokeW: 0, text: '', color: '#ffffff', fs: 20 })),
    tbtn('ellipse', 'Ellipse', () => addEl({ type: 'ellipse', x: 405, y: 195, w: 150, h: 150, fill: theme().accent, stroke: null, strokeW: 0, text: '', color: '#ffffff', fs: 20 })),
    tbtn('line', 'Ligne', () => addEl({ type: 'line', x: 330, y: 270, w: 300, h: 1, stroke: theme().text, strokeW: 3 })),
    tbtn('image', 'Image', addImage), sep(),
    themeSel,
    colorBtn('fill', 'Arrière-plan de la diapositive', '#ffffff', (c) => cur.set('bg', c || '#ffffff'), { allowNone: false }), sep(),
    tbtn('play', 'Présenter (F5)', () => present(yslides.toArray().indexOf(cur)), 'Présenter'),
    tbtn('download', 'Exporter en .pptx (PowerPoint)', async () => saveFile(safeName(meta().title) + '.pptx', await exportPptx(yslides.toArray(), meta().title))),
    tbtn('print', 'Imprimer / PDF', printSlides));

  const ctx = {};
  const ctxBar = h('div', { class: 'ribbon sub' },
    (ctx.font = sel(FONTS, (v) => setProp('font', v), 'Police')),
    (ctx.size = sel(SIZES, (v) => setProp('fs', +v), 'Taille')),
    (ctx.bold = tbtn('bold', 'Gras', () => setProp('bold', !selEl()?.get('bold')))),
    (ctx.italic = tbtn('italic', 'Italique', () => setProp('italic', !selEl()?.get('italic')))),
    (ctx.underline = tbtn('underline', 'Souligné', () => setProp('underline', !selEl()?.get('underline')))),
    colorBtn('textColor', 'Couleur du texte', '#c92a2a', (c) => setProp('color', c || '#222222')), sep(),
    (ctx.left = tbtn('alignLeft', 'Gauche', () => setProp('align', 'left'))),
    (ctx.center = tbtn('alignCenter', 'Centre', () => setProp('align', 'center'))),
    (ctx.right = tbtn('alignRight', 'Droite', () => setProp('align', 'right'))),
    (ctx.top = tbtn('valignTop', 'Haut', () => setProp('valign', 'top'))),
    (ctx.middle = tbtn('valignMiddle', 'Milieu', () => setProp('valign', 'middle'))),
    (ctx.bottom = tbtn('valignBottom', 'Bas', () => setProp('valign', 'bottom'))),
    (ctx.bullets = tbtn('bulletList', 'Puces', () => setProp('bullets', !selEl()?.get('bullets')))), sep(),
    colorBtn('fill', 'Remplissage', '#4dabf7', (c) => setProp('fill', c || null)),
    colorBtn('rect', 'Contour', '#1c2433', (c) => { setProp('stroke', c || null); if (c && !selEl()?.get('strokeW')) setProp('strokeW', 2); }), sep(),
    tbtn('front', 'Premier plan', () => reorder(1)), tbtn('back', 'Arrière-plan', () => reorder(-1)),
    tbtn('copy', 'Dupliquer (Ctrl+D)', duplicateEl), tbtn('trash', 'Supprimer (Suppr)', deleteEl));

  root.append(ribbon, ctxBar, h('div', { class: 'slides-main' }, thumbs, h('div', { class: 'slides-center' }, stage, notes)));

  // ---- Rendu ----
  let cache = new Map();
  let scale = 1;
  function fit() {
    const W = stage.clientWidth - 32, H = stage.clientHeight - 32;
    scale = Math.max(0.1, Math.min(W / SW, H / SH));
    slideEl.style.transform = `scale(${scale})`;
    slideEl.parentElement.style.width = SW * scale + 'px';
    slideEl.parentElement.style.height = SH * scale + 'px';
  }
  let raf = 0;
  const schedule = () => { if (!raf) raf = requestAnimationFrame(() => { raf = 0; render(); }); };
  let thumbRaf = 0;
  const scheduleThumbs = () => { clearTimeout(thumbRaf); thumbRaf = setTimeout(renderThumbs, 120); };

  function render() {
    if (!yslides.toArray().includes(cur)) { cur = yslides.get(Math.min(yslides.length - 1, 0)); selectedId = editingId = null; }
    if (!cur) return;
    if (selectedId && !selEl()) selectedId = editingId = null;
    cache = renderSlide(cur, slideEl, { editable: true, cache, selectedId, editingId });
    if (document.activeElement !== notes) notes.value = cur.get('notes') || '';
    const m = selEl();
    ctxBar.style.display = m && m.get('type') !== 'image' ? '' : 'none';
    if (m) {
      ctx.font.value = m.get('font') || FONTS[0][0];
      ctx.size.value = String(m.get('fs') || 24);
      const on = (b, v) => b.classList.toggle('on', !!v);
      on(ctx.bold, m.get('bold')); on(ctx.italic, m.get('italic')); on(ctx.underline, m.get('underline')); on(ctx.bullets, m.get('bullets'));
      const al = m.get('align') || (m.get('type') === 'text' ? 'left' : 'center');
      on(ctx.left, al === 'left'); on(ctx.center, al === 'center'); on(ctx.right, al === 'right');
      const va = m.get('valign') || (m.get('type') === 'text' ? 'top' : 'middle');
      on(ctx.top, va === 'top'); on(ctx.middle, va === 'middle'); on(ctx.bottom, va === 'bottom');
    }
    themeSel.value = props.get('theme') || 'clair';
  }
  function renderThumbs() {
    const list = yslides.toArray();
    thumbs.replaceChildren(...list.map((s, i) => {
      const mini = h('div', { class: 'slide' });
      renderSlide(s, mini, {});
      const t = h('div', { class: 'thumb' + (s === cur ? ' on' : ''), onclick: () => go(s) },
        h('span', { class: 'num' }, i + 1), h('div', { class: 'thumb-frame' }, mini),
        s === cur && h('div', { class: 'thumb-tools' },
          i > 0 && h('button', { class: 'icon-btn', title: 'Monter', onclick: (e) => { e.stopPropagation(); move(i, -1); } }, icon('up', 14)),
          i < list.length - 1 && h('button', { class: 'icon-btn', title: 'Descendre', onclick: (e) => { e.stopPropagation(); move(i, 1); } }, icon('down', 14))));
      return t;
    }), h('button', { class: 'thumb add', onclick: () => addSlide('content') }, icon('plus'), ' Diapositive'));
    thumbs.querySelector('.thumb.on')?.scrollIntoView({ block: 'nearest' });
  }
  function go(s) {
    finishEdit();
    cur = s; selectedId = null;
    cache = new Map(); slideEl.replaceChildren();
    render(); renderThumbs();
  }

  // ---- Opérations ----
  function addSlide(kind) {
    const t = theme();
    const i = yslides.toArray().indexOf(cur) + 1;
    const s = slideMap({ bg: t.bg }, layout(kind, t));
    yslides.insert(i, [s]);
    go(s);
  }
  function cloneEl(m, dx = 0) {
    const o = m.toJSON();
    delete o.id;
    return elMap({ ...o, x: o.x + dx, y: o.y + dx });
  }
  function duplicateSlide() {
    const i = yslides.toArray().indexOf(cur);
    const s = slideMap({ bg: cur.get('bg'), notes: cur.get('notes') }, els().toArray().map((m) => cloneEl(m)));
    yslides.insert(i + 1, [s]);
    go(s);
  }
  function deleteSlide() {
    if (yslides.length === 1) return toast('Une présentation contient au moins une diapositive');
    const i = yslides.toArray().indexOf(cur);
    yslides.delete(i);
    go(yslides.get(Math.max(0, i - 1)));
  }
  function move(i, d) {
    const s = yslides.get(i);
    const copy = slideMap({ bg: s.get('bg'), notes: s.get('notes') }, s.get('els').toArray().map((m) => { const o = m.toJSON(); return elMap(o); }));
    doc.transact(() => { yslides.delete(i); yslides.insert(i + d, [copy]); });
    go(copy);
  }
  function addEl(o) {
    const m = elMap(o);
    els().push([m]);
    selectedId = m.get('id');
    render();
    if (o.type === 'text') editText(selectedId);
  }
  async function addImage() {
    const f = await pickFile('image/*');
    if (!f) return;
    const { src, w, h: ih } = await downscaleImage(await readAsDataURL(f));
    const k = Math.min(1, 600 / w, 400 / ih);
    addEl({ type: 'image', src, x: Math.round((SW - w * k) / 2), y: Math.round((SH - ih * k) / 2), w: Math.round(w * k), h: Math.round(ih * k) });
  }
  function setProp(k, v) { const m = selEl(); if (m) m.set(k, v); }
  function deleteEl() {
    const i = els().toArray().findIndex((m) => m.get('id') === selectedId);
    if (i >= 0) els().delete(i);
    selectedId = editingId = null;
  }
  function duplicateEl() {
    const m = selEl();
    if (!m) return;
    const c = cloneEl(m, 20);
    els().push([c]);
    selectedId = c.get('id');
    render();
  }
  function reorder(dir) {
    const arr = els();
    const i = arr.toArray().findIndex((m) => m.get('id') === selectedId);
    if (i < 0) return;
    const c = cloneEl(arr.get(i));
    c.set('id', selectedId);
    doc.transact(() => { arr.delete(i); dir > 0 ? arr.push([c]) : arr.insert(0, [c]); });
  }
  function applyTheme(key) {
    const t = THEMES[key];
    const old = theme();
    doc.transact(() => {
      props.set('theme', key);
      for (const s of yslides.toArray()) {
        if (s.get('bg') === old.bg || !s.get('bg')) s.set('bg', t.bg);
        for (const m of s.get('els').toArray()) {
          if (m.get('color') === old.title) m.set('color', t.title);
          else if (m.get('color') === old.text) m.set('color', t.text);
          if (m.get('fill') === old.accent) m.set('fill', t.accent);
          if (m.get('stroke') === old.text) m.set('stroke', t.text);
        }
      }
    });
  }

  // ---- Édition du texte ----
  function editText(id) {
    const m = els().toArray().find((x) => x.get('id') === id);
    if (!m || m.get('type') === 'image' || m.get('type') === 'line') return;
    editingId = id;
    selectedId = id;
    render();
    const inner = cache.get(id).querySelector('.el-text');
    inner.textContent = m.get('text') || '';
    inner.dataset.ph = '';
    inner.contentEditable = 'plaintext-only';
    if (inner.contentEditable !== 'plaintext-only') inner.contentEditable = 'true';
    inner.focus();
    const r = document.createRange();
    r.selectNodeContents(inner);
    const s = getSelection();
    s.removeAllRanges();
    s.addRange(r);
    inner.oninput = () => m.set('text', inner.innerText.replace(/\n$/, ''));
    inner.onblur = () => finishEdit();
    inner.onkeydown = (e) => { if (e.key === 'Escape') { e.preventDefault(); inner.blur(); } e.stopPropagation(); };
  }
  function finishEdit() {
    if (!editingId) return;
    const div = cache.get(editingId);
    const inner = div?.querySelector('.el-text');
    if (inner) { inner.contentEditable = 'false'; inner.oninput = inner.onblur = inner.onkeydown = null; }
    editingId = null;
    render();
    scheduleThumbs();
  }

  // ---- Souris / tactile ----
  let drag = null;
  const pt = (e) => { const b = slideEl.getBoundingClientRect(); return { x: (e.clientX - b.left) / scale, y: (e.clientY - b.top) / scale }; };
  slideEl.addEventListener('pointerdown', (e) => {
    const target = e.target.closest('.el');
    if (target && target.dataset.id === editingId) return;
    finishEdit();
    if (!target) { selectedId = null; render(); return; }
    e.preventDefault();
    const m = els().toArray().find((x) => x.get('id') === target.dataset.id);
    selectedId = target.dataset.id;
    const p = pt(e);
    drag = { m, p, x: m.get('x'), y: m.get('y'), w: m.get('w'), h: m.get('h'), handle: e.target.dataset.h || null, moved: false };
    slideEl.setPointerCapture(e.pointerId);
    um.stopCapturing();
    render();
  });
  slideEl.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const p = pt(e);
    let dx = p.x - drag.p.x, dy = p.y - drag.p.y;
    if (!drag.moved && Math.hypot(dx, dy) < 3) return;
    drag.moved = true;
    const { m } = drag;
    const snap = (v) => (e.altKey ? v : Math.round(v / 5) * 5);
    if (!drag.handle) {
      let nx = snap(drag.x + dx), ny = snap(drag.y + dy);
      // Aimantation au centre de la diapositive
      if (Math.abs(nx + drag.w / 2 - SW / 2) < 8) nx = SW / 2 - drag.w / 2;
      if (Math.abs(ny + drag.h / 2 - SH / 2) < 8) ny = SH / 2 - drag.h / 2;
      doc.transact(() => { m.set('x', Math.round(nx)); m.set('y', Math.round(ny)); });
      return;
    }
    const hd = drag.handle;
    let { x, y, w, h: hh } = drag;
    if (hd.includes('e')) w = drag.w + dx;
    if (hd.includes('s')) hh = drag.h + dy;
    if (hd.includes('w')) { w = drag.w - dx; x = drag.x + dx; }
    if (hd.includes('n')) { hh = drag.h - dy; y = drag.y + dy; }
    if ((m.get('type') === 'image' || e.shiftKey) && hd.length === 2) {
      const ratio = drag.w / drag.h;
      if (w / hh > ratio) w = hh * ratio; else hh = w / ratio;
      if (hd.includes('w')) x = drag.x + drag.w - w;
      if (hd.includes('n')) y = drag.y + drag.h - hh;
    }
    const minH = m.get('type') === 'line' ? 1 : 10;
    doc.transact(() => {
      m.set('x', Math.round(x)); m.set('y', Math.round(y));
      m.set('w', Math.round(Math.max(10, w))); m.set('h', Math.round(Math.max(minH, hh)));
    });
  });
  const endDrag = () => { if (drag?.moved) um.stopCapturing(); drag = null; };
  slideEl.addEventListener('pointerup', endDrag);
  slideEl.addEventListener('pointercancel', endDrag);
  slideEl.addEventListener('dblclick', (e) => {
    const target = e.target.closest('.el');
    if (target) editText(target.dataset.id);
  });

  notes.addEventListener('input', () => cur.set('notes', notes.value));

  // ---- Clavier ----
  const onKey = (e) => {
    if (!root.isConnected || editingId) return;
    const tag = document.activeElement?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || document.activeElement?.isContentEditable) return;
    if (document.querySelector('.modal-back, .present')) return;
    const mod = e.ctrlKey || e.metaKey;
    const k = e.key.toLowerCase();
    if (mod && k === 'z') { e.preventDefault(); e.shiftKey ? um.redo() : um.undo(); return; }
    if (mod && k === 'y') { e.preventDefault(); um.redo(); return; }
    if (mod && k === 'd') { e.preventDefault(); duplicateEl(); return; }
    if (e.key === 'F5') { e.preventDefault(); present(e.shiftKey ? yslides.toArray().indexOf(cur) : 0); return; }
    const m = selEl();
    if (!m) {
      const i = yslides.toArray().indexOf(cur);
      if (e.key === 'ArrowDown' || e.key === 'PageDown') { e.preventDefault(); if (i < yslides.length - 1) go(yslides.get(i + 1)); }
      if (e.key === 'ArrowUp' || e.key === 'PageUp') { e.preventDefault(); if (i > 0) go(yslides.get(i - 1)); }
      return;
    }
    const step = e.shiftKey ? 20 : 2;
    const nudge = (dx, dy) => { e.preventDefault(); doc.transact(() => { m.set('x', m.get('x') + dx); m.set('y', m.get('y') + dy); }); };
    switch (e.key) {
      case 'Delete': case 'Backspace': e.preventDefault(); deleteEl(); break;
      case 'ArrowLeft': nudge(-step, 0); break;
      case 'ArrowRight': nudge(step, 0); break;
      case 'ArrowUp': nudge(0, -step); break;
      case 'ArrowDown': nudge(0, step); break;
      case 'Enter': case 'F2': e.preventDefault(); editText(selectedId); break;
      case 'Escape': selectedId = null; render(); break;
    }
  };
  document.addEventListener('keydown', onKey);

  // ---- Présentation ----
  function present(start = 0) {
    const list = yslides.toArray();
    let i = Math.max(0, start);
    const inner = h('div', { class: 'slide' });
    const frame = h('div', { class: 'present-frame' }, inner);
    const counter = h('div', { class: 'present-count' });
    const ov = h('div', { class: 'present', tabindex: 0, 'data-transition': S.get('transition') }, frame, counter);
    const show = () => {
      inner.replaceChildren();
      renderSlide(list[i], inner, {});
      inner.style.animation = 'none'; void inner.offsetWidth; inner.style.animation = '';
      counter.textContent = `${i + 1} / ${list.length}`;
    };
    const fitP = () => {
      const k = Math.min(innerWidth / SW, innerHeight / SH);
      inner.style.transform = `scale(${k})`;
      frame.style.width = SW * k + 'px'; frame.style.height = SH * k + 'px';
    };
    const next = () => { if (i < list.length - 1) { i++; show(); } else close(); };
    const prev = () => { if (i > 0) { i--; show(); } };
    const key = (e) => {
      if (['ArrowRight', 'ArrowDown', 'PageDown', ' ', 'Enter'].includes(e.key)) { e.preventDefault(); next(); }
      else if (['ArrowLeft', 'ArrowUp', 'PageUp', 'Backspace'].includes(e.key)) { e.preventDefault(); prev(); }
      else if (e.key === 'Escape') close();
      else if (e.key === 'Home') { i = 0; show(); }
      else if (e.key === 'End') { i = list.length - 1; show(); }
    };
    let sx = null;
    ov.addEventListener('pointerdown', (e) => (sx = e.clientX));
    ov.addEventListener('pointerup', (e) => {
      if (sx == null) return;
      const dx = e.clientX - sx; sx = null;
      if (dx < -40) next(); else if (dx > 40) prev(); else if (e.clientX < innerWidth / 4) prev(); else next();
    });
    function close() {
      document.removeEventListener('keydown', key, true);
      removeEventListener('resize', fitP);
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
      ov.remove();
    }
    document.addEventListener('keydown', key, true);
    addEventListener('resize', fitP);
    document.addEventListener('fullscreenchange', () => { if (!document.fullscreenElement && ov.isConnected && ov.dataset.fs) close(); }, { once: false });
    document.body.append(ov);
    ov.requestFullscreen?.().then(() => (ov.dataset.fs = '1')).catch(() => {});
    fitP(); show(); ov.focus();
  }

  function printSlides() {
    const frame = h('iframe', { class: 'print-frame' });
    document.body.append(frame);
    const d = frame.contentDocument;
    d.open();
    d.write(`<!doctype html><html><head><meta charset="utf-8"><style>
      @page{size:254mm 142.875mm;margin:0} body{margin:0}
      .slide{position:relative;width:960px;height:540px;overflow:hidden;break-after:page;transform-origin:0 0;zoom:1.0}
      ${SLIDE_CSS}</style></head><body></body></html>`);
    d.close();
    for (const s of yslides.toArray()) {
      const div = d.createElement('div');
      div.className = 'slide';
      d.body.append(div);
      renderSlide(s, div, {});
    }
    setTimeout(() => { try { frame.contentWindow.print(); } catch { toast('Impression indisponible'); } setTimeout(() => frame.remove(), 2000); }, 400);
  }

  // ---- Observateurs ----
  const onChange = (events) => {
    schedule();
    scheduleThumbs();
  };
  yslides.observeDeep(onChange);
  props.observe(onChange);
  const ro = new ResizeObserver(fit);
  ro.observe(stage);
  fit(); render(); renderThumbs();

  return {
    destroy() {
      finishEdit();
      yslides.unobserveDeep(onChange);
      props.unobserve(onChange);
      document.removeEventListener('keydown', onKey);
      ro.disconnect();
      um.destroy();
    },
  };
}

// Styles minimaux d'une diapositive, réutilisés pour l'impression.
export const SLIDE_CSS = `
.el{position:absolute;box-sizing:border-box;display:flex;flex-direction:column;overflow:visible}
.el-text{white-space:pre-wrap;word-wrap:break-word;line-height:1.25;padding:6px 10px;outline:none;min-height:1em}
.el-text.bullets .li{padding-left:1.1em;position:relative}
.el-text.bullets .li:not(.empty)::before{content:"•";position:absolute;left:.15em}
.el-image img{width:100%;height:100%;object-fit:fill;display:block}
.el-line svg{overflow:visible;display:block}
`;
