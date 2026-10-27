// Import / export .xlsx et .csv via SheetJS.
// Un .xlsx est une archive ZIP : xl/workbook.xml (liste des feuilles), xl/worksheets/sheetN.xml
// (cellules <c r="A1" t="s"><f>…</f><v>…</v></c>), xl/sharedStrings.xml (textes dédupliqués), xl/styles.xml.
import * as XLSX from 'xlsx';
import * as Y from 'yjs';
import { uid } from '../util.js';
import { toEnglishFormula, parseLiteral, fmtGeneral } from '../apps/formula.js';

export function newSheetMap(name) {
  const s = new Y.Map();
  s.set('id', uid());
  s.set('name', name);
  s.set('cells', new Y.Map());
  s.set('cols', new Y.Map());
  s.set('rows', new Y.Map());
  return s;
}

function looksLikeDate(fmt) {
  return !!fmt && /[dmy]/i.test(fmt.replace(/"[^"]*"|\[[^\]]*\]/g, '')) && !/^[#0.,%]+$/.test(fmt);
}

export async function importSpreadsheet(file, doc) {
  const buf = await file.arrayBuffer();
  const isCsv = /\.(csv|tsv|txt)$/i.test(file.name);
  const wb = isCsv
    ? XLSX.read(new TextDecoder().decode(buf), { type: 'string', raw: true })
    : XLSX.read(buf, { type: 'array', cellFormula: true, cellNF: true, cellStyles: true });
  const sheets = doc.getArray('sheets');
  doc.transact(() => {
    for (const name of wb.SheetNames) {
      const ws = wb.Sheets[name];
      const sm = newSheetMap(isCsv ? 'Feuille 1' : name);
      sheets.push([sm]);
      const cells = sm.get('cells');
      for (const addr of Object.keys(ws)) {
        if (addr[0] === '!') continue;
        const c = ws[addr];
        const { r, c: col } = XLSX.utils.decode_cell(addr);
        let v;
        const s = {};
        if (c.f) v = '=' + c.f;
        else if (c.t === 'b') v = c.v ? 'VRAI' : 'FAUX';
        else if (c.t === 'n') { v = fmtGeneral(c.v); if (looksLikeDate(c.z)) s.fmt = 'date'; else if (/%/.test(c.z || '')) s.fmt = 'pct'; else if (/0\.00/.test(c.z || '')) s.fmt = 'num2'; }
        else if (c.t === 'e') v = c.w || '#VALEUR!';
        else v = c.v == null ? '' : String(c.v);
        if (c.s?.font?.bold || c.s?.bold) s.b = true;
        const fill = c.s?.fgColor?.rgb;
        if (fill && fill !== '000000' && fill !== 'FFFFFF') s.bg = '#' + fill.slice(-6);
        if (v === '' && !Object.keys(s).length) continue;
        cells.set(`${r},${col}`, Object.keys(s).length ? { v, s } : { v });
      }
      (ws['!cols'] || []).forEach((ci, i) => {
        const w = ci?.wpx || (ci?.wch ? Math.round(ci.wch * 7 + 5) : 0);
        if (w) sm.get('cols').set(String(i), Math.max(24, Math.min(600, w)));
      });
    }
  });
}

export function exportSpreadsheet(doc, engine, bookType = 'xlsx') {
  const wb = XLSX.utils.book_new();
  for (const sm of doc.getArray('sheets').toArray()) {
    const ws = {};
    let maxR = 0, maxC = 0;
    sm.get('cells').forEach((cell, key) => {
      const [r, c] = key.split(',').map(Number);
      const raw = cell.v ?? '';
      if (raw === '') return;
      maxR = Math.max(maxR, r);
      maxC = Math.max(maxC, c);
      const addr = XLSX.utils.encode_cell({ r, c });
      if (raw.startsWith('=')) {
        const val = engine.value(sm, r, c);
        const o = { f: toEnglishFormula(raw.slice(1)) };
        if (typeof val === 'number') Object.assign(o, { t: 'n', v: val });
        else if (typeof val === 'boolean') Object.assign(o, { t: 'b', v: val });
        else if (val && val.code) Object.assign(o, { t: 'e', v: 0x0f });
        else Object.assign(o, { t: 's', v: val == null ? '' : String(val) });
        ws[addr] = o;
      } else {
        const lit = parseLiteral(raw);
        ws[addr] = typeof lit === 'number' ? { t: 'n', v: lit } : typeof lit === 'boolean' ? { t: 'b', v: lit } : { t: 's', v: String(raw) };
        if (cell.s?.fmt === 'date' && typeof lit === 'number') ws[addr].z = 'dd/mm/yyyy';
        if (cell.s?.fmt === 'pct' && typeof lit === 'number') ws[addr].z = '0.00%';
        if (cell.s?.fmt === 'num2' && typeof lit === 'number') ws[addr].z = '#,##0.00';
      }
    });
    ws['!ref'] = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: maxR, c: maxC } });
    const cols = [];
    sm.get('cols').forEach((w, c) => (cols[+c] = { wpx: w }));
    if (cols.length) ws['!cols'] = Array.from(cols, (x) => x || { wpx: 100 });
    XLSX.utils.book_append_sheet(wb, ws, sm.get('name').slice(0, 31));
    if (bookType === 'csv') break;
  }
  const out = XLSX.write(wb, { bookType, type: 'array' });
  return new Blob([out], { type: bookType === 'csv' ? 'text/csv' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}
