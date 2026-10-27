// Test aller-retour export → import des trois formats (exécuté dans Electron via le serveur Vite).
import * as store from '/src/store.js';
import * as X from '/src/io/xlsx.js';
import * as F from '/src/apps/formula.js';
import * as S from '/src/apps/sheet.js';
import * as D from '/src/io/docx.js';
import * as P from '/src/io/pptx.js';
import * as SL from '/src/apps/slides.js';

export async function run() {
  const out = [];
  const id1 = await store.createDoc('sheet', 't', S.initSheet);
  const d1 = store.getDoc(id1).doc;
  const cells = d1.getArray('sheets').get(0).get('cells');
  cells.set('0,0', { v: 'Nom' }); cells.set('1,0', { v: '12,5' }); cells.set('2,0', { v: '7' });
  cells.set('3,0', { v: '=SOMME(A2:A3)' }); cells.set('4,0', { v: '=SI(A4>10;"ok";"non")' });
  const model = { id: (s) => s.get('id'), raw: (s, r, c) => s.get('cells').get(r + ',' + c)?.v, sheetByName: () => null };
  const blob = X.exportSpreadsheet(d1, F.createEngine(model));
  const id2 = await store.createDoc('sheet', 't2', null);
  const d2 = store.getDoc(id2).doc;
  await X.importSpreadsheet(new File([blob], 'a.xlsx'), d2);
  out.push('xlsx: ' + JSON.stringify(d2.getArray('sheets').get(0).get('cells').toJSON()));

  const json = { type: 'doc', content: [
    { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'Titre' }] },
    { type: 'paragraph', attrs: { textAlign: 'center' }, content: [{ type: 'text', text: 'gras', marks: [{ type: 'bold' }] }, { type: 'text', text: ' rouge', marks: [{ type: 'textStyle', attrs: { color: '#ff0000', fontSize: '14pt' } }] }] },
    { type: 'bulletList', content: [{ type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'puce' }] }] }] },
    { type: 'orderedList', content: [{ type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'un' }] }] }] },
    { type: 'table', content: [{ type: 'tableRow', content: [{ type: 'tableHeader', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'H' }] }] }, { type: 'tableCell', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'C' }] }] }] }] },
  ] };
  const db = await D.exportDocx(json, 'x');
  const mammoth = await import('mammoth');
  out.push('docx: ' + (await (mammoth.default || mammoth).convertToHtml({ arrayBuffer: await db.arrayBuffer() })).value);

  const id3 = await store.createDoc('slides', 'p', SL.initSlides);
  const d3 = store.getDoc(id3).doc;
  const els = d3.getArray('slides').get(0).get('els');
  els.get(0).set('text', 'Bonjour'); els.get(1).set('text', 'Ligne 1');
  els.push([SL.elMap({ type: 'ellipse', x: 100, y: 100, w: 120, h: 80, fill: '#ff0000', text: 'O', fs: 20, color: '#ffffff' })]);
  const pb = await P.exportPptx(d3.getArray('slides').toArray(), 'p');
  const id4 = await store.createDoc('slides', 'p2', null);
  const d4 = store.getDoc(id4).doc;
  await P.importPptx(new File([pb], 'a.pptx'), d4);
  out.push('pptx: ' + JSON.stringify(d4.getArray('slides').get(0).get('els').toJSON().map((e) => ({ t: e.type, x: e.x, y: e.y, w: e.w, text: e.text, fs: e.fs, fill: e.fill, align: e.align }))));
  return out.join('\n');
}
