// Tableur : grille dessinée sur un <canvas> (seules les cellules visibles sont rendues),
// zone de défilement transparente par-dessus, et éditeur de cellule superposé.
import * as Y from 'yjs';
import { h, toast, ask, confirmBox, saveFile, safeName } from '../util.js';
import { createEngine, formatValue, colName, cellName, parseRef, mapRefs, shiftFormula, FORMATS, FUNCTION_NAMES } from './formula.js';
import { newSheetMap, exportSpreadsheet } from '../io/xlsx.js';
import { icon, tbtn, colorBtn, sep, sel } from '../ui/toolbar.js';

const DW = 100, DH = 24, HW = 48, HH = 24;
const key = (r, c) => r + ',' + c;

export function initSheet(doc) {
  doc.getArray('sheets').push([newSheetMap('Feuille 1')]);
}

export function mountSheet(root, { doc, meta }) {
  const ysheets = doc.getArray('sheets');
  if (ysheets.length === 0) doc.transact(() => initSheet(doc));
  const um = new Y.UndoManager(ysheets, { captureTimeout: 400 });

  let sheet = ysheets.get(0);
  const cells = () => sheet.get('cells');
  const raw = (r, c) => cells().get(key(r, c))?.v ?? '';
  const styleOf = (r, c) => cells().get(key(r, c))?.s || {};

  const engine = createEngine({
    id: (s) => s.get('id'),
    raw: (s, r, c) => s.get('cells').get(key(r, c))?.v,
    sheetByName: (n) => ysheets.toArray().find((s) => s.get('name').toLowerCase() === n.toLowerCase()),
  });

  // ---- Sélection ----
  let act = { r: 0, c: 0 }, ext = { r: 0, c: 0 };
  const range = () => ({ r1: Math.min(act.r, ext.r), c1: Math.min(act.c, ext.c), r2: Math.max(act.r, ext.r), c2: Math.max(act.c, ext.c) });
  const eachInRange = (fn, rg = range()) => { for (let r = rg.r1; r <= rg.r2; r++) for (let c = rg.c1; c <= rg.c2; c++) fn(r, c); };

  // ---- DOM ----
  const canvas = h('canvas', { class: 'grid-canvas' });
  const spacer = h('div', { class: 'grid-spacer' });
  const scroller = h('div', { class: 'grid-scroller', tabindex: 0 }, spacer);
  const editor = h('input', { class: 'cell-editor', spellcheck: false, autocomplete: 'off' });
  const wrap = h('div', { class: 'grid-wrap' }, canvas, scroller, editor);
  const nameBox = h('input', { class: 'name-box', spellcheck: false });
  const fbar = h('input', { class: 'formula-input', spellcheck: false, placeholder: 'Valeur ou formule (ex. =SOMME(A1:A10))' });
  const tabs = h('div', { class: 'sheet-tabs' });
  const status = h('div', { class: 'sheet-status' });
  const fmtSel = sel(FORMATS, (v) => setStyle({ fmt: v === 'general' ? undefined : v }), 'Format des nombres');
  const fnSel = sel([['', 'ƒx Fonction…'], ...['SOMME', 'MOYENNE', 'MIN', 'MAX', 'NB', 'SI', 'SOMME.SI', 'NB.SI', 'RECHERCHEV', 'ARRONDI', 'CONCATENER', 'AUJOURDHUI'].map((f) => [f, f])], (v) => {
    if (!v) return;
    fnSel.value = '';
    startEdit('=' + v + '(', true);
  }, 'Insérer une fonction');

  const btn = {};
  const ribbon = h('div', { class: 'ribbon' },
    tbtn('undo', 'Annuler (Ctrl+Z)', () => um.undo()), tbtn('redo', 'Rétablir (Ctrl+Y)', () => um.redo()), sep(),
    (btn.b = tbtn('bold', 'Gras (Ctrl+B)', () => toggle('b'))), (btn.i = tbtn('italic', 'Italique (Ctrl+I)', () => toggle('i'))), (btn.u = tbtn('underline', 'Souligné (Ctrl+U)', () => toggle('u'))),
    colorBtn('textColor', 'Couleur du texte', '#000000', (c) => setStyle({ color: c })),
    colorBtn('fill', 'Couleur de remplissage', '#fff3bf', (c) => setStyle({ bg: c })), sep(),
    (btn.al = tbtn('alignLeft', 'Aligner à gauche', () => setStyle({ align: 'left' }))), (btn.ac = tbtn('alignCenter', 'Centrer', () => setStyle({ align: 'center' }))), (btn.ar = tbtn('alignRight', 'Aligner à droite', () => setStyle({ align: 'right' }))), sep(),
    fmtSel, tbtn('clearFormat', 'Effacer la mise en forme', () => eachCellWrite((o) => ({ v: o.v }))), sep(),
    tbtn('rowAdd', 'Insérer une ligne au-dessus', () => insertLines('r', 1)), tbtn('rowDel', 'Supprimer la ligne', () => insertLines('r', -1)),
    tbtn('colAdd', 'Insérer une colonne à gauche', () => insertLines('c', 1)), tbtn('colDel', 'Supprimer la colonne', () => insertLines('c', -1)), sep(),
    tbtn('sortAsc', 'Trier de A à Z', () => sortRange(1)), tbtn('sortDesc', 'Trier de Z à A', () => sortRange(-1)), tbtn('sum', 'Somme automatique', autoSum), fnSel, sep(),
    tbtn('download', 'Exporter en .xlsx', () => saveFile(safeName(meta().title) + '.xlsx', exportSpreadsheet(doc, engine))),
    tbtn('csv', 'Exporter la feuille en .csv', () => saveFile(safeName(meta().title) + '.csv', exportCsv())));

  root.append(ribbon, h('div', { class: 'formula-bar' }, nameBox, h('span', { class: 'fx' }, 'ƒx'), fbar), wrap, h('div', { class: 'sheet-foot' }, tabs, status));

  // ---- Géométrie ----
  let colX = [0], rowY = [0], nCols = 26, nRows = 100, extraRows = 0, extraCols = 0, resizing = null;
  function computeGeom() {
    let maxR = 0, maxC = 0;
    cells().forEach((_v, k) => { const i = k.indexOf(','); maxR = Math.max(maxR, +k.slice(0, i)); maxC = Math.max(maxC, +k.slice(i + 1)); });
    nRows = Math.max(100, maxR + 50, act.r + 20) + extraRows;
    nCols = Math.max(26, maxC + 6, act.c + 4) + extraCols;
    const cw = sheet.get('cols'), rh = sheet.get('rows');
    colX = new Float64Array(nCols + 1);
    for (let c = 0; c < nCols; c++) colX[c + 1] = colX[c] + (resizing?.t === 'c' && resizing.i === c ? resizing.size : cw.get(String(c)) ?? DW);
    rowY = new Float64Array(nRows + 1);
    for (let r = 0; r < nRows; r++) rowY[r + 1] = rowY[r] + (resizing?.t === 'r' && resizing.i === r ? resizing.size : rh.get(String(r)) ?? DH);
    spacer.style.width = HW + colX[nCols] + 'px';
    spacer.style.height = HH + rowY[nRows] + 'px';
  }
  const find = (arr, pos) => { let lo = 0, hi = arr.length - 2; while (lo < hi) { const m = (lo + hi + 1) >> 1; if (arr[m] <= pos) lo = m; else hi = m - 1; } return Math.max(0, lo); };

  // ---- Rendu ----
  let raf = 0;
  const schedule = () => { if (!raf) raf = requestAnimationFrame(() => { raf = 0; render(); }); };
  const css = (n) => getComputedStyle(root).getPropertyValue(n).trim();

  function render() {
    const W = wrap.clientWidth, H = wrap.clientHeight;
    if (!W || !H) return;
    const dpr = window.devicePixelRatio || 1;
    if (canvas.width !== Math.round(W * dpr) || canvas.height !== Math.round(H * dpr)) {
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
    }
    const sl = scroller.scrollLeft, st = scroller.scrollTop;
    if (st + H > HH + rowY[nRows] - 300) { extraRows += 200; computeGeom(); }
    if (sl + W > HW + colX[nCols] - 300) { extraCols += 10; computeGeom(); }
    const g = canvas.getContext('2d');
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    const C = { bg: css('--grid-bg'), line: css('--grid-line'), text: css('--text'), head: css('--grid-head'), headText: css('--muted'), acc: css('--c-sheet') };
    g.fillStyle = C.bg;
    g.fillRect(0, 0, W, H);
    const c0 = find(colX, sl), r0 = find(rowY, st);
    let c1 = c0; while (c1 < nCols && colX[c1] - sl < W - HW) c1++;
    let r1 = r0; while (r1 < nRows && rowY[r1] - st < H - HH) r1++;
    const X = (c) => HW + colX[c] - sl, Yp = (r) => HH + rowY[r] - st;

    g.save();
    g.beginPath(); g.rect(HW, HH, W - HW, H - HH); g.clip();
    // fonds
    for (let r = r0; r < r1; r++) for (let c = c0; c < c1; c++) {
      const s = cells().get(key(r, c))?.s;
      if (s?.bg) { g.fillStyle = s.bg; g.fillRect(X(c), Yp(r), colX[c + 1] - colX[c], rowY[r + 1] - rowY[r]); }
    }
    // quadrillage
    g.strokeStyle = C.line; g.lineWidth = 1; g.beginPath();
    for (let c = c0; c <= c1; c++) { const x = Math.round(X(c)) + 0.5; g.moveTo(x, HH); g.lineTo(x, H); }
    for (let r = r0; r <= r1; r++) { const y = Math.round(Yp(r)) + 0.5; g.moveTo(HW, y); g.lineTo(W, y); }
    g.stroke();
    // textes
    g.textBaseline = 'middle';
    for (let r = r0; r < r1; r++) {
      for (let c = Math.max(0, c0 - 3); c < c1; c++) {
        const cell = cells().get(key(r, c));
        if (!cell || cell.v === '' || cell.v == null) continue;
        const s = cell.s || {};
        const v = engine.value(sheet, r, c);
        const txt = s.fmt === 'text' ? String(cell.v) : formatValue(v, s.fmt);
        if (!txt) continue;
        const align = s.align || (typeof v === 'number' ? 'right' : typeof v === 'boolean' || engine.isErr(v) ? 'center' : 'left');
        g.font = `${s.i ? 'italic ' : ''}${s.b ? '600 ' : ''}13px ${css('--font-ui')}`;
        g.fillStyle = engine.isErr(v) ? '#e03131' : s.color || C.text;
        const x = X(c), y = Yp(r), w = colX[c + 1] - colX[c], hgt = rowY[r + 1] - rowY[r];
        let cw = w;
        if (align === 'left' && typeof v === 'string') { let k = c + 1; while (k < c1 + 3 && g.measureText(txt).width > cw - 6 && !raw(r, k)) { cw += colX[k + 1] - colX[k]; k++; } }
        g.save(); g.beginPath(); g.rect(x + 1, y + 1, cw - 2, hgt - 2); g.clip();
        g.textAlign = align;
        const tx = align === 'left' ? x + 4 : align === 'right' ? x + w - 4 : x + w / 2;
        g.fillText(txt, tx, y + hgt / 2 + 1);
        if (s.u) { const tw = g.measureText(txt).width; const ux = align === 'left' ? tx : align === 'right' ? tx - tw : tx - tw / 2; g.fillRect(ux, y + hgt / 2 + 8, tw, 1); }
        g.restore();
      }
    }
    // sélection
    const rg = range();
    const sx = X(rg.c1), sy = Yp(rg.r1), sw = colX[rg.c2 + 1] - colX[rg.c1], sh = rowY[rg.r2 + 1] - rowY[rg.r1];
    if (rg.r1 !== rg.r2 || rg.c1 !== rg.c2) { g.fillStyle = C.acc + '22'; g.fillRect(sx, sy, sw, sh); }
    g.strokeStyle = C.acc; g.lineWidth = 2;
    g.strokeRect(sx + 1, sy + 1, sw - 1, sh - 1);
    g.strokeRect(X(act.c) + 1, Yp(act.r) + 1, colX[act.c + 1] - colX[act.c] - 1, rowY[act.r + 1] - rowY[act.r] - 1);
    if (clip && clip.sheet === sheet) {
      const k = clip.rg;
      g.setLineDash([5, 3]); g.lineWidth = 1.5;
      g.strokeRect(X(k.c1) + 1, Yp(k.r1) + 1, colX[k.c2 + 1] - colX[k.c1] - 2, rowY[k.r2 + 1] - rowY[k.r1] - 2);
      g.setLineDash([]);
    }
    g.restore();

    // en-têtes
    g.font = `12px ${css('--font-ui')}`;
    g.textAlign = 'center';
    g.fillStyle = C.head; g.fillRect(0, 0, W, HH); g.fillRect(0, 0, HW, H);
    for (let c = c0; c < c1; c++) {
      const on = c >= rg.c1 && c <= rg.c2;
      if (on) { g.fillStyle = C.acc + '33'; g.fillRect(X(c), 0, colX[c + 1] - colX[c], HH); }
      g.fillStyle = on ? C.acc : C.headText;
      g.fillText(colName(c), X(c) + (colX[c + 1] - colX[c]) / 2, HH / 2 + 1);
    }
    for (let r = r0; r < r1; r++) {
      const on = r >= rg.r1 && r <= rg.r2;
      if (on) { g.fillStyle = C.acc + '33'; g.fillRect(0, Yp(r), HW, rowY[r + 1] - rowY[r]); }
      g.fillStyle = on ? C.acc : C.headText;
      g.fillText(String(r + 1), HW / 2, Yp(r) + (rowY[r + 1] - rowY[r]) / 2 + 1);
    }
    g.strokeStyle = C.line; g.lineWidth = 1; g.beginPath();
    for (let c = c0; c <= c1; c++) { const x = Math.round(X(c)) + 0.5; if (x >= HW) { g.moveTo(x, 0); g.lineTo(x, HH); } }
    for (let r = r0; r <= r1; r++) { const y = Math.round(Yp(r)) + 0.5; if (y >= HH) { g.moveTo(0, y); g.lineTo(HW, y); } }
    g.moveTo(0, HH + 0.5); g.lineTo(W, HH + 0.5); g.moveTo(HW + 0.5, 0); g.lineTo(HW + 0.5, H);
    g.stroke();
    g.fillStyle = C.head; g.fillRect(0, 0, HW, HH);
    if (editing) placeEditor();
  }

  // ---- Barre de formule / état ----
  function refreshBars() {
    const rg = range();
    if (document.activeElement !== nameBox) nameBox.value = rg.r1 === rg.r2 && rg.c1 === rg.c2 ? cellName(act.r, act.c) : `${cellName(rg.r1, rg.c1)}:${cellName(rg.r2, rg.c2)}`;
    if (document.activeElement !== fbar && !editing) fbar.value = raw(act.r, act.c);
    const s = styleOf(act.r, act.c);
    btn.b.classList.toggle('on', !!s.b); btn.i.classList.toggle('on', !!s.i); btn.u.classList.toggle('on', !!s.u);
    btn.al.classList.toggle('on', s.align === 'left'); btn.ac.classList.toggle('on', s.align === 'center'); btn.ar.classList.toggle('on', s.align === 'right');
    fmtSel.value = s.fmt || 'general';
    let n = 0, sum = 0, cnt = 0;
    if ((rg.r2 - rg.r1 + 1) * (rg.c2 - rg.c1 + 1) <= 50000) eachInRange((r, c) => { const v = engine.value(sheet, r, c); if (v != null && v !== '') cnt++; if (typeof v === 'number') { n++; sum += v; } });
    status.textContent = cnt > 1 ? `Somme : ${formatValue(sum)}   Moyenne : ${n ? formatValue(sum / n) : '–'}   Nombre : ${cnt}` : '';
  }

  function select(r, c, extend = false) {
    r = Math.max(0, r); c = Math.max(0, c);
    if (extend) ext = { r, c }; else act = ext = { r, c };
    if (r >= nRows - 5 || c >= nCols - 2) computeGeom();
    scrollIntoView(extend ? ext : act);
    refreshBars();
    schedule();
  }
  function scrollIntoView({ r, c }) {
    const W = scroller.clientWidth - HW, H = scroller.clientHeight - HH;
    if (colX[c] < scroller.scrollLeft) scroller.scrollLeft = colX[c];
    else if (colX[c + 1] > scroller.scrollLeft + W) scroller.scrollLeft = colX[c + 1] - W;
    if (rowY[r] < scroller.scrollTop) scroller.scrollTop = rowY[r];
    else if (rowY[r + 1] > scroller.scrollTop + H) scroller.scrollTop = rowY[r + 1] - H;
  }

  // ---- Écriture ----
  function setRaw(r, c, v) {
    const old = cells().get(key(r, c));
    if (v === '' && !old?.s) cells().delete(key(r, c));
    else cells().set(key(r, c), old?.s ? { v, s: old.s } : { v });
  }
  function eachCellWrite(fn) {
    doc.transact(() => eachInRange((r, c) => {
      const o = cells().get(key(r, c)) || { v: '' };
      const n = fn(o);
      if (!n || (n.v === '' && (!n.s || !Object.keys(n.s).length))) cells().delete(key(r, c));
      else cells().set(key(r, c), n);
    }));
  }
  function setStyle(patch) {
    eachCellWrite((o) => {
      const s = { ...(o.s || {}), ...patch };
      for (const k of Object.keys(s)) if (s[k] === undefined || s[k] === false) delete s[k];
      return Object.keys(s).length ? { v: o.v, s } : { v: o.v };
    });
  }
  const toggle = (k) => setStyle({ [k]: !styleOf(act.r, act.c)[k] });

  // ---- Édition ----
  let editing = false;
  function placeEditor() {
    const x = HW + colX[act.c] - scroller.scrollLeft, y = HH + rowY[act.r] - scroller.scrollTop;
    Object.assign(editor.style, { left: x + 'px', top: y + 'px', minWidth: colX[act.c + 1] - colX[act.c] + 1 + 'px', height: rowY[act.r + 1] - rowY[act.r] + 1 + 'px' });
  }
  function startEdit(initial, replace = false) {
    editing = true;
    editor.value = replace ? initial ?? '' : raw(act.r, act.c);
    const s = styleOf(act.r, act.c);
    editor.style.fontWeight = s.b ? '600' : '';
    editor.style.fontStyle = s.i ? 'italic' : '';
    placeEditor();
    editor.style.display = 'block';
    editor.focus();
    editor.setSelectionRange(editor.value.length, editor.value.length);
    fbar.value = editor.value;
  }
  let fbarDirty = false;
  function commit(dr = 0, dc = 0, value = editor.value) {
    editing = false;
    fbarDirty = false;
    editor.style.display = 'none';
    const { r, c } = act;
    if (value !== raw(r, c)) doc.transact(() => setRaw(r, c, value));
    scroller.focus({ preventScroll: true });
    select(r + dr, c + dc);
  }
  function cancelEdit() {
    editing = false;
    editor.style.display = 'none';
    refreshBars();
    scroller.focus({ preventScroll: true });
  }
  const refInsertable = (inp) => /^=/.test(inp.value) && /[=(,;:+\-*/^&<>]$/.test(inp.value.slice(0, inp.selectionStart).trimEnd());

  editor.addEventListener('input', () => { fbar.value = editor.value; });
  editor.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); commit(e.shiftKey ? -1 : 1, 0); }
    else if (e.key === 'Tab') { e.preventDefault(); commit(0, e.shiftKey ? -1 : 1); }
    else if (e.key === 'Escape') { e.preventDefault(); cancelEdit(); }
  });
  editor.addEventListener('blur', () => setTimeout(() => { if (editing && document.activeElement !== editor && document.activeElement !== fbar) commit(0, 0); }, 0));

  fbar.addEventListener('focus', () => { if (!editing) fbar.value = raw(act.r, act.c); });
  fbar.addEventListener('input', () => { if (editing) editor.value = fbar.value; else fbarDirty = true; });
  fbar.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); commit(1, 0, fbar.value); }
    else if (e.key === 'Escape') { fbarDirty = false; fbar.value = raw(act.r, act.c); cancelEdit(); }
  });
  fbar.addEventListener('blur', () => { if (fbarDirty && !editing) { fbarDirty = false; doc.transact(() => setRaw(act.r, act.c, fbar.value)); } });

  nameBox.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    const [a, b] = nameBox.value.trim().split(':').map(parseRef);
    if (!a) return toast('Référence invalide');
    act = { r: a.r, c: a.c }; ext = b ? { r: b.r, c: b.c } : act;
    computeGeom(); scrollIntoView(act); refreshBars(); schedule();
    scroller.focus({ preventScroll: true });
  });

  // ---- Souris / tactile ----
  function hit(x, y) {
    const sl = scroller.scrollLeft, st = scroller.scrollTop;
    if (x < HW && y < HH) return { k: 'corner' };
    if (y < HH) {
      const px = x - HW + sl, c = find(colX, px);
      if (Math.abs(colX[c + 1] - px) < 5) return { k: 'resize', t: 'c', i: c };
      if (c > 0 && Math.abs(colX[c] - px) < 5) return { k: 'resize', t: 'c', i: c - 1 };
      return { k: 'col', c };
    }
    if (x < HW) {
      const py = y - HH + st, r = find(rowY, py);
      if (Math.abs(rowY[r + 1] - py) < 4) return { k: 'resize', t: 'r', i: r };
      if (r > 0 && Math.abs(rowY[r] - py) < 4) return { k: 'resize', t: 'r', i: r - 1 };
      return { k: 'row', r };
    }
    return { k: 'cell', r: find(rowY, y - HH + st), c: find(colX, x - HW + sl) };
  }
  const pos = (e) => { const b = scroller.getBoundingClientRect(); return [e.clientX - b.left, e.clientY - b.top]; };

  let drag = null;
  scroller.addEventListener('pointerdown', (e) => {
    const [x, y] = pos(e);
    if (x > scroller.clientWidth || y > scroller.clientHeight) return;
    const t = hit(x, y);
    if (editing && t.k === 'cell' && refInsertable(editor)) {
      e.preventDefault();
      const i = editor.selectionStart;
      const ref = cellName(t.r, t.c);
      editor.value = editor.value.slice(0, i) + ref + editor.value.slice(editor.selectionEnd);
      editor.setSelectionRange(i + ref.length, i + ref.length);
      fbar.value = editor.value;
      setTimeout(() => editor.focus());
      return;
    }
    if (editing) commit(0, 0);
    if (e.pointerType === 'touch') { drag = { touch: true, x, y, t }; return; }
    e.preventDefault();
    scroller.focus({ preventScroll: true });
    scroller.setPointerCapture(e.pointerId);
    if (t.k === 'resize') { drag = { k: 'resize', t: t.t, i: t.i, start: t.t === 'c' ? x : y, size: t.t === 'c' ? colX[t.i + 1] - colX[t.i] : rowY[t.i + 1] - rowY[t.i] }; return; }
    if (t.k === 'corner') { act = { r: 0, c: 0 }; ext = { r: nRows - 1, c: nCols - 1 }; refreshBars(); schedule(); return; }
    if (t.k === 'col') { if (!e.shiftKey) act = { r: 0, c: t.c }; ext = { r: nRows - 1, c: t.c }; if (e.shiftKey) act = { r: 0, c: act.c }; drag = { k: 'col' }; }
    else if (t.k === 'row') { if (!e.shiftKey) act = { r: t.r, c: 0 }; ext = { r: t.r, c: nCols - 1 }; if (e.shiftKey) act = { r: act.r, c: 0 }; drag = { k: 'row' }; }
    else { select(t.r, t.c, e.shiftKey); drag = { k: 'cell' }; }
    refreshBars(); schedule();
  });
  scroller.addEventListener('pointermove', (e) => {
    const [x, y] = pos(e);
    if (!drag) { const t = hit(x, y); scroller.style.cursor = t.k === 'resize' ? (t.t === 'c' ? 'col-resize' : 'row-resize') : t.k === 'cell' ? 'cell' : 'default'; return; }
    if (drag.touch) return;
    if (drag.k === 'resize') {
      resizing = { t: drag.t, i: drag.i, size: Math.max(drag.t === 'c' ? 30 : 18, drag.size + (drag.t === 'c' ? x : y) - drag.start) };
      computeGeom(); schedule(); return;
    }
    if (y > scroller.clientHeight - 16) scroller.scrollTop += 16; else if (y < HH + 4) scroller.scrollTop -= 16;
    if (x > scroller.clientWidth - 16) scroller.scrollLeft += 16; else if (x < HW + 4) scroller.scrollLeft -= 16;
    const t = hit(Math.max(HW + 1, x), Math.max(HH + 1, y));
    if (drag.k === 'cell') ext = { r: t.r, c: t.c };
    else if (drag.k === 'col') ext = { r: nRows - 1, c: t.c };
    else if (drag.k === 'row') ext = { r: t.r, c: nCols - 1 };
    refreshBars(); schedule();
  });
  scroller.addEventListener('pointerup', (e) => {
    if (drag?.touch) {
      const [x, y] = pos(e);
      if (Math.hypot(x - drag.x, y - drag.y) < 10 && drag.t.k === 'cell') {
        const again = act.r === drag.t.r && act.c === drag.t.c && ext.r === act.r && ext.c === act.c;
        select(drag.t.r, drag.t.c);
        if (again) startEdit();
      }
    } else if (drag?.k === 'resize' && resizing) {
      const r = resizing;
      sheet.get(r.t === 'c' ? 'cols' : 'rows').set(String(r.i), Math.round(r.size));
      resizing = null;
    }
    drag = null;
  });
  scroller.addEventListener('dblclick', (e) => {
    const [x, y] = pos(e);
    const t = hit(x, y);
    if (t.k === 'cell') startEdit();
    else if (t.k === 'resize' && t.t === 'c') autoFitCol(t.i);
  });
  scroller.addEventListener('scroll', () => { schedule(); });

  function autoFitCol(c) {
    const g = canvas.getContext('2d');
    g.font = `13px ${css('--font-ui')}`;
    let w = 40;
    cells().forEach((cell, k) => { if (+k.split(',')[1] === c) w = Math.max(w, g.measureText(formatValue(engine.value(sheet, +k.split(',')[0], c), cell.s?.fmt)).width + 14); });
    sheet.get('cols').set(String(c), Math.min(600, Math.ceil(w)));
  }

  // ---- Clavier ----
  scroller.addEventListener('keydown', (e) => {
    const mod = e.ctrlKey || e.metaKey;
    if (mod) {
      const k = e.key.toLowerCase();
      if (k === 'z') { e.preventDefault(); e.shiftKey ? um.redo() : um.undo(); }
      else if (k === 'y') { e.preventDefault(); um.redo(); }
      else if (k === 'b') { e.preventDefault(); toggle('b'); }
      else if (k === 'i') { e.preventDefault(); toggle('i'); }
      else if (k === 'u') { e.preventDefault(); toggle('u'); }
      else if (k === 'a') { e.preventDefault(); act = { r: 0, c: 0 }; ext = { r: nRows - 1, c: nCols - 1 }; refreshBars(); schedule(); }
      else if (e.key === 'ArrowDown') { e.preventDefault(); select(edge(1, 0), ext.c, e.shiftKey); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); select(edge(-1, 0), ext.c, e.shiftKey); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); select(ext.r, edge(0, 1), e.shiftKey); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); select(ext.r, edge(0, -1), e.shiftKey); }
      return;
    }
    const cur = e.shiftKey ? ext : act;
    switch (e.key) {
      case 'ArrowDown': e.preventDefault(); return select(cur.r + 1, cur.c, e.shiftKey);
      case 'ArrowUp': e.preventDefault(); return select(cur.r - 1, cur.c, e.shiftKey);
      case 'ArrowRight': e.preventDefault(); return select(cur.r, cur.c + 1, e.shiftKey);
      case 'ArrowLeft': e.preventDefault(); return select(cur.r, cur.c - 1, e.shiftKey);
      case 'PageDown': e.preventDefault(); return select(cur.r + 20, cur.c, e.shiftKey);
      case 'PageUp': e.preventDefault(); return select(cur.r - 20, cur.c, e.shiftKey);
      case 'Home': e.preventDefault(); return select(cur.r, 0, e.shiftKey);
      case 'Enter': e.preventDefault(); return select(act.r + (e.shiftKey ? -1 : 1), act.c);
      case 'Tab': e.preventDefault(); return select(act.r, act.c + (e.shiftKey ? -1 : 1));
      case 'F2': e.preventDefault(); return startEdit();
      case 'Delete': case 'Backspace': e.preventDefault(); return eachCellWrite((o) => (o.s ? { v: '', s: o.s } : null));
      case 'Escape': clip = null; return schedule();
    }
    if (e.key.length === 1 && !e.altKey) { e.preventDefault(); startEdit(e.key, true); }
  });
  function edge(dr, dc) {
    let r = ext.r, c = ext.c;
    const filled = (r, c) => raw(r, c) !== '';
    const start = filled(r, c) && filled(r + dr, c + dc);
    for (;;) {
      const nr = r + dr, nc = c + dc;
      if (nr < 0 || nc < 0 || nr >= nRows || nc >= nCols) break;
      if (start ? !filled(nr, nc) : filled(nr, nc)) { if (!start) { r = nr; c = nc; } break; }
      r = nr; c = nc;
    }
    return dr ? r : c;
  }

  // ---- Copier / couper / coller ----
  let clip = null;
  const rangeTsv = (rg) => {
    const lines = [];
    for (let r = rg.r1; r <= rg.r2; r++) { const row = []; for (let c = rg.c1; c <= rg.c2; c++) row.push(formatValue(engine.value(sheet, r, c), styleOf(r, c).fmt)); lines.push(row.join('\t')); }
    return lines.join('\n');
  };
  const onCopy = (e, cut) => {
    if (document.activeElement !== scroller) return;
    e.preventDefault();
    const rg = range();
    if ((rg.r2 - rg.r1 + 1) * (rg.c2 - rg.c1 + 1) > 200000) return toast('Sélection trop grande');
    const data = [];
    eachInRange((r, c) => data.push({ dr: r - rg.r1, dc: c - rg.c1, cell: cells().get(key(r, c)) }), rg);
    const tsv = rangeTsv(rg);
    clip = { sheet, rg, data, tsv, cut };
    e.clipboardData.setData('text/plain', tsv);
    schedule();
  };
  const onPaste = (e) => {
    if (document.activeElement !== scroller) return;
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    doc.transact(() => {
      if (clip && clip.tsv === text) {
        const dr = act.r - clip.rg.r1, dc = act.c - clip.rg.c1;
        if (clip.cut) for (const d of clip.data) clip.sheet.get('cells').delete(key(clip.rg.r1 + d.dr, clip.rg.c1 + d.dc));
        for (const d of clip.data) {
          const k = key(act.r + d.dr, act.c + d.dc);
          if (!d.cell) { cells().delete(k); continue; }
          const v = typeof d.cell.v === 'string' && d.cell.v.startsWith('=') && !clip.cut ? '=' + shiftFormula(d.cell.v.slice(1), dr, dc) : d.cell.v;
          cells().set(k, { ...d.cell, v });
        }
        ext = { r: act.r + clip.rg.r2 - clip.rg.r1, c: act.c + clip.rg.c2 - clip.rg.c1 };
        if (clip.cut) clip = null;
      } else {
        const rows = text.replace(/\r/g, '').replace(/\n$/, '').split('\n').map((l) => l.split('\t'));
        rows.forEach((row, i) => row.forEach((v, j) => setRaw(act.r + i, act.c + j, v)));
        ext = { r: act.r + rows.length - 1, c: act.c + Math.max(...rows.map((r) => r.length)) - 1 };
      }
    });
    refreshBars();
  };
  const copyH = (e) => onCopy(e, false), cutH = (e) => onCopy(e, true);
  document.addEventListener('copy', copyH);
  document.addEventListener('cut', cutH);
  document.addEventListener('paste', onPaste);

  // ---- Lignes / colonnes ----
  function insertLines(axis, dir) {
    const at = axis === 'r' ? act.r : act.c;
    const sheetName = sheet.get('name').toLowerCase();
    doc.transact(() => {
      const moved = [];
      cells().forEach((v, k) => { const [r, c] = k.split(',').map(Number); const p = axis === 'r' ? r : c; if (p >= at) moved.push([r, c, v]); });
      for (const [r, c] of moved) cells().delete(key(r, c));
      for (const [r, c, v] of moved) {
        const p = axis === 'r' ? r : c;
        if (dir < 0 && p === at) continue;
        const np = p + dir;
        cells().set(axis === 'r' ? key(np, c) : key(r, np), v);
      }
      const sizes = sheet.get(axis === 'r' ? 'rows' : 'cols');
      const old = [...sizes.entries()];
      old.forEach(([k]) => { if (+k >= at) sizes.delete(k); });
      old.forEach(([k, v]) => { if (+k >= at && !(dir < 0 && +k === at)) sizes.set(String(+k + dir), v); });
      // Met à jour les formules de toutes les feuilles qui pointent vers celle-ci.
      for (const s of ysheets.toArray()) {
        const isSelf = s === sheet;
        s.get('cells').forEach((cell, k) => {
          if (typeof cell.v !== 'string' || !cell.v.startsWith('=')) return;
          const nv = '=' + mapRefs(cell.v.slice(1), (ref) => {
            const target = ref.sheet ? ref.sheet.toLowerCase() === sheetName : isSelf;
            if (!target) return { r: ref.r, c: ref.c };
            const p = axis === 'r' ? ref.r : ref.c;
            if (p < at) return { r: ref.r, c: ref.c };
            if (dir < 0 && p === at) return null;
            return axis === 'r' ? { r: ref.r + dir, c: ref.c } : { r: ref.r, c: ref.c + dir };
          });
          if (nv !== cell.v) s.get('cells').set(k, { ...cell, v: nv });
        });
      }
    });
  }

  function sortRange(dir) {
    let rg = range();
    if (rg.r1 === rg.r2) {
      let r2 = rg.r1; while (raw(r2 + 1, act.c) !== '') r2++;
      let r1 = rg.r1; while (r1 > 0 && raw(r1 - 1, act.c) !== '') r1--;
      let c1 = act.c, c2 = act.c;
      while (c1 > 0 && raw(r1, c1 - 1) !== '') c1--;
      while (raw(r1, c2 + 1) !== '') c2++;
      rg = { r1, r2, c1, c2 };
    }
    const rows = [];
    for (let r = rg.r1; r <= rg.r2; r++) {
      const row = [];
      for (let c = rg.c1; c <= rg.c2; c++) row.push(cells().get(key(r, c)));
      rows.push({ k: engine.value(sheet, r, act.c), row });
    }
    rows.sort((a, b) => {
      const x = a.k, y = b.k;
      if (x == null || x === '') return 1;
      if (y == null || y === '') return -1;
      if (typeof x === 'number' && typeof y === 'number') return (x - y) * dir;
      return String(x).localeCompare(String(y), 'fr', { numeric: true }) * dir;
    });
    doc.transact(() => rows.forEach((o, i) => o.row.forEach((cell, j) => {
      const k = key(rg.r1 + i, rg.c1 + j);
      if (cell) cells().set(k, cell); else cells().delete(k);
    })));
    act = { r: rg.r1, c: act.c }; ext = { r: rg.r2, c: rg.c2 }; if (act.c < rg.c1) act.c = rg.c1;
    act = { r: rg.r1, c: rg.c1 };
    refreshBars();
  }

  function autoSum() {
    const rg = range();
    if (rg.r2 > rg.r1 && rg.c1 === rg.c2) {
      doc.transact(() => setRaw(rg.r2 + 1, rg.c1, `=SOMME(${cellName(rg.r1, rg.c1)}:${cellName(rg.r2, rg.c1)})`));
      return select(rg.r2 + 1, rg.c1);
    }
    let r = act.r - 1;
    while (r >= 0 && typeof engine.value(sheet, r, act.c) === 'number') r--;
    const formula = r + 1 <= act.r - 1 ? `=SOMME(${cellName(r + 1, act.c)}:${cellName(act.r - 1, act.c)})` : '=SOMME()';
    startEdit(formula, true);
    if (formula === '=SOMME()') editor.setSelectionRange(7, 7);
  }

  function exportCsv() {
    const rg = { r1: 0, c1: 0, r2: 0, c2: 0 };
    cells().forEach((_v, k) => { const [r, c] = k.split(',').map(Number); rg.r2 = Math.max(rg.r2, r); rg.c2 = Math.max(rg.c2, c); });
    const q = (s) => (/[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s);
    const lines = [];
    for (let r = 0; r <= rg.r2; r++) { const row = []; for (let c = 0; c <= rg.c2; c++) { const v = engine.value(sheet, r, c); row.push(q(typeof v === 'number' ? String(v).replace('.', ',') : formatValue(v))); } lines.push(row.join(';')); }
    return new Blob(['﻿' + lines.join('\r\n')], { type: 'text/csv' });
  }

  // ---- Onglets de feuilles ----
  function renderTabs() {
    tabs.replaceChildren(
      ...ysheets.toArray().map((s, i) => h('button', {
        class: 'sheet-tab' + (s === sheet ? ' on' : ''),
        onclick: () => switchSheet(s),
        ondblclick: () => renameSheet(s),
        oncontextmenu: (e) => { e.preventDefault(); sheetMenu(s, i); },
      }, s.get('name'))),
      h('button', { class: 'sheet-tab add', title: 'Nouvelle feuille', onclick: () => {
        const names = ysheets.toArray().map((s) => s.get('name'));
        let n = ysheets.length + 1; while (names.includes('Feuille ' + n)) n++;
        const sm = newSheetMap('Feuille ' + n);
        ysheets.push([sm]);
        switchSheet(sm);
      } }, '+'),
      h('button', { class: 'sheet-tab', title: 'Options de la feuille', onclick: () => sheetMenu(sheet, ysheets.toArray().indexOf(sheet)) }, '⋯'));
  }
  function switchSheet(s) {
    if (editing) commit(0, 0);
    sheet = s; act = ext = { r: 0, c: 0 }; extraRows = extraCols = 0;
    scroller.scrollTo(0, 0);
    computeGeom(); renderTabs(); refreshBars(); schedule();
  }
  async function renameSheet(s) {
    const n = await ask('Renommer la feuille', s.get('name'));
    if (n && n.trim()) s.set('name', n.trim().replace(/[!'\[\]*?/\\:]/g, ''));
  }
  function sheetMenu(s, i) {
    const m = h('div', { class: 'menu-pop' },
      h('button', { onclick: () => { close(); renameSheet(s); } }, 'Renommer'),
      h('button', { onclick: () => { close(); const copy = newSheetMap(s.get('name') + ' (2)'); s.get('cells').forEach((v, k) => copy.get('cells').set(k, v)); s.get('cols').forEach((v, k) => copy.get('cols').set(k, v)); ysheets.insert(i + 1, [copy]); } }, 'Dupliquer'),
      i > 0 && h('button', { onclick: () => { close(); doc.transact(() => { ysheets.delete(i); ysheets.insert(i - 1, [cloneSheet(s)]); }); } }, 'Déplacer à gauche'),
      h('button', { class: 'danger', onclick: async () => {
        close();
        if (ysheets.length === 1) return toast('Un classeur doit contenir au moins une feuille');
        if (await confirmBox('Supprimer la feuille', `Supprimer « ${s.get('name')} » ?`, 'Supprimer')) { ysheets.delete(i); if (s === sheet) switchSheet(ysheets.get(0)); }
      } }, 'Supprimer'));
    const back = h('div', { class: 'menu-back', onclick: () => close() }, m);
    const close = () => back.remove();
    document.body.append(back);
    const b = tabs.getBoundingClientRect();
    Object.assign(m.style, { left: Math.min(b.left + 20, innerWidth - 200) + 'px', bottom: innerHeight - b.top + 4 + 'px' });
  }
  function cloneSheet(s) {
    const c = new Y.Map();
    c.set('id', s.get('id')); c.set('name', s.get('name'));
    for (const k of ['cells', 'cols', 'rows']) { const m = new Y.Map(); s.get(k).forEach((v, kk) => m.set(kk, v)); c.set(k, m); }
    return c;
  }

  // ---- Observateurs ----
  const onChange = () => {
    engine.invalidate();
    if (!ysheets.toArray().includes(sheet)) { sheet = ysheets.get(0) || sheet; act = ext = { r: 0, c: 0 }; }
    computeGeom(); renderTabs(); refreshBars(); schedule();
  };
  ysheets.observeDeep(onChange);
  const ro = new ResizeObserver(schedule);
  ro.observe(wrap);
  const themeMq = matchMedia('(prefers-color-scheme: dark)');
  themeMq.addEventListener('change', schedule);
  // Recalcul périodique pour AUJOURDHUI()/MAINTENANT()/ALEA().
  const tick = setInterval(() => { engine.invalidate(); schedule(); }, 60000);

  computeGeom(); renderTabs(); refreshBars(); schedule();
  setTimeout(() => scroller.focus({ preventScroll: true }), 50);

  return {
    destroy() {
      ysheets.unobserveDeep(onChange);
      ro.disconnect();
      themeMq.removeEventListener('change', schedule);
      clearInterval(tick);
      document.removeEventListener('copy', copyH);
      document.removeEventListener('cut', cutH);
      document.removeEventListener('paste', onPaste);
      um.destroy();
    },
  };
}

export { FUNCTION_NAMES };
