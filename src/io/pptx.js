// Import / export .pptx.
// Un .pptx est une archive ZIP : ppt/presentation.xml (taille et ordre des diapositives),
// ppt/slides/slideN.xml (arbre de formes <p:spTree> : <p:sp> formes/texte, <p:pic> images),
// ppt/slides/_rels/*.rels (liens vers ppt/media/*). Les positions sont en EMU (914 400 par pouce).
import PptxGenJS from 'pptxgenjs';
import JSZip from 'jszip';
import { elMap, slideMap, SW, SH } from '../apps/slides.js';
import { toHex, toB64 } from '../util.js';

const IN = (px) => px / 96;
const PT = (px) => px * 0.75;

export async function exportPptx(slides, title) {
  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_16x9';
  pptx.title = title;
  pptx.author = 'Mythos';
  for (const s of slides) {
    const slide = pptx.addSlide();
    slide.background = { color: toHex(s.get('bg')) || 'FFFFFF' };
    if (s.get('notes')) slide.addNotes(s.get('notes'));
    for (const m of s.get('els').toArray()) {
      const o = m.toJSON();
      const pos = { x: IN(o.x), y: IN(o.y), w: IN(o.w), h: IN(Math.max(1, o.h)) };
      if (o.type === 'image') { slide.addImage({ data: o.src.replace(/^data:/, ''), ...pos }); continue; }
      if (o.type === 'line') {
        slide.addShape(pptx.ShapeType.line, { ...pos, flipV: !!o.flip, line: { color: toHex(o.stroke) || '343A40', width: PT(o.strokeW || 3) } });
        continue;
      }
      const textOpts = {
        ...pos,
        fontFace: (o.font || 'Arial').split(',')[0].replace(/["']/g, '').replace(/^Inter$/, 'Calibri').replace(/^system-ui$/, 'Calibri'),
        fontSize: PT(o.fs || 24), color: toHex(o.color) || '222222', bold: !!o.bold, italic: !!o.italic, underline: o.underline ? { style: 'sng' } : undefined,
        align: o.align || (o.type === 'text' ? 'left' : 'center'), valign: o.valign || (o.type === 'text' ? 'top' : 'middle'),
        margin: [4.5, 7.5, 4.5, 7.5], fit: 'none',
      };
      if (o.type !== 'text') textOpts.shape = o.type === 'ellipse' ? pptx.ShapeType.ellipse : o.radius ? pptx.ShapeType.roundRect : pptx.ShapeType.rect;
      if (toHex(o.fill)) textOpts.fill = { color: toHex(o.fill) };
      if (toHex(o.stroke) && o.strokeW) textOpts.line = { color: toHex(o.stroke), width: PT(o.strokeW) };
      const lines = (o.text || '').split('\n');
      if (o.bullets && o.text) slide.addText(lines.map((l) => ({ text: l, options: { bullet: !!l.trim(), breakLine: true } })), textOpts);
      else slide.addText(o.text || '', textOpts);
    }
  }
  return pptx.write({ outputType: 'blob' });
}

// ---- Import ----
const kids = (el, tag) => (el ? [...el.children].filter((c) => c.tagName === tag) : []);
const kid = (el, tag) => kids(el, tag)[0] || null;
const desc = (el, tag) => (el ? el.getElementsByTagName(tag)[0] || null : null);

function resolve(base, target) {
  if (target.startsWith('/')) return target.slice(1);
  const parts = base.split('/').slice(0, -1);
  for (const p of target.split('/')) { if (p === '..') parts.pop(); else if (p !== '.') parts.push(p); }
  return parts.join('/');
}
async function rels(zip, path) {
  const relPath = path.replace(/([^/]+)$/, '_rels/$1.rels');
  const f = zip.file(relPath);
  const map = {};
  if (!f) return map;
  const x = new DOMParser().parseFromString(await f.async('text'), 'application/xml');
  for (const r of x.getElementsByTagName('Relationship')) map[r.getAttribute('Id')] = { target: resolve(path, r.getAttribute('Target')), type: r.getAttribute('Type') };
  return map;
}
const color = (el) => { const c = desc(el, 'a:srgbClr'); return c ? '#' + c.getAttribute('val') : null; };

export async function importPptx(file, doc) {
  const zip = await JSZip.loadAsync(await file.arrayBuffer());
  const xml = async (p) => new DOMParser().parseFromString(await zip.file(p).async('text'), 'application/xml');
  const pres = await xml('ppt/presentation.xml');
  const presRels = await rels(zip, 'ppt/presentation.xml');
  const sz = desc(pres, 'p:sldSz');
  const cx = +(sz?.getAttribute('cx') || 12192000), cy = +(sz?.getAttribute('cy') || 6858000);
  const k = Math.min(SW / cx, SH / cy);
  const E = (v) => Math.round(+v * k);
  const ids = [...pres.getElementsByTagName('p:sldId')].map((s) => presRels[s.getAttribute('r:id')]?.target).filter(Boolean);
  const out = [];

  for (const path of ids) {
    const sx = await xml(path);
    const srels = await rels(zip, path);
    const bg = color(desc(sx, 'p:bg')) || '#ffffff';
    const els = [];

    const walk = async (tree) => {
      for (const node of tree.children) {
        if (node.tagName === 'p:grpSp') { await walk(node); continue; }
        const xfrm = desc(kid(node, 'p:spPr') || kid(node, 'p:grpSpPr') || node, 'a:xfrm') || desc(node, 'p:xfrm');
        const off = desc(xfrm, 'a:off'), ext = desc(xfrm, 'a:ext');
        const ph = desc(node, 'p:ph');
        const phType = ph?.getAttribute('type') || (ph ? 'body' : null);
        let box = off && ext ? { x: E(off.getAttribute('x')), y: E(off.getAttribute('y')), w: E(ext.getAttribute('cx')), h: E(ext.getAttribute('cy')) } : null;
        if (!box && phType) {
          box = phType === 'title' ? { x: 60, y: 36, w: 840, h: 80 }
            : phType === 'ctrTitle' ? { x: 80, y: 170, w: 800, h: 120 }
            : phType === 'subTitle' ? { x: 80, y: 300, w: 800, h: 70 }
            : { x: 60, y: 130, w: 840, h: 370 };
        }
        if (!box) continue;

        if (node.tagName === 'p:pic') {
          const id = desc(node, 'a:blip')?.getAttribute('r:embed');
          const target = srels[id]?.target;
          const f = target && zip.file(target);
          if (!f) continue;
          const ext2 = target.split('.').pop().toLowerCase();
          const mime = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif', svg: 'image/svg+xml', bmp: 'image/bmp', webp: 'image/webp' }[ext2];
          if (!mime) continue;
          els.push(elMap({ type: 'image', ...box, src: `data:${mime};base64,${toB64(await f.async('uint8array'))}` }));
          continue;
        }
        if (node.tagName !== 'p:sp') continue;

        const spPr = kid(node, 'p:spPr');
        const geom = desc(spPr, 'a:prstGeom')?.getAttribute('prst');
        const noFill = !!kid(spPr, 'a:noFill');
        const fill = noFill ? null : color(kid(spPr, 'a:solidFill'));
        const ln = kid(spPr, 'a:ln');
        const stroke = ln && !kid(ln, 'a:noFill') ? color(ln) : null;
        const strokeW = ln?.getAttribute('w') ? Math.max(1, Math.round(+ln.getAttribute('w') / 12700 / 0.75)) : stroke ? 2 : 0;

        const body = kid(node, 'p:txBody');
        const paras = kids(body, 'a:p');
        const lines = paras.map((p) => [...p.children].map((r) => (r.tagName === 'a:r' || r.tagName === 'a:fld' ? desc(r, 'a:t')?.textContent || '' : r.tagName === 'a:br' ? '\n' : '')).join(''));
        const firstR = desc(body, 'a:rPr') || desc(body, 'a:endParaRPr');
        const szAttr = firstR?.getAttribute('sz');
        const isTitle = phType === 'title' || phType === 'ctrTitle';
        const fs = szAttr ? Math.round(+szAttr / 100 / 0.75 * k * 9525) : isTitle ? 48 : 24;
        const algn = desc(body, 'a:pPr')?.getAttribute('algn');
        const anchor = desc(body, 'a:bodyPr')?.getAttribute('anchor');
        const bulleted = phType === 'body' || !!desc(body, 'a:buChar');
        const txt = lines.join('\n').replace(/\n+$/, '');

        const type = geom === 'ellipse' ? 'ellipse' : geom === 'line' || geom === 'straightConnector1' ? 'line' : (fill || stroke) && geom ? 'rect' : 'text';
        if (type === 'text' && !txt && !phType) continue;
        els.push(elMap({
          type, ...box, text: txt, fs: Math.max(8, Math.min(200, fs)),
          font: desc(firstR, 'a:latin')?.getAttribute('typeface') || 'Inter, system-ui, sans-serif',
          color: color(firstR) || (isTitle ? '#1c2433' : '#343a40'),
          bold: firstR?.getAttribute('b') === '1' || (isTitle && !firstR?.getAttribute('b')), italic: firstR?.getAttribute('i') === '1',
          underline: !!firstR?.getAttribute('u') && firstR.getAttribute('u') !== 'none',
          align: { ctr: 'center', r: 'right', just: 'left' }[algn] || (type === 'text' ? 'left' : 'center'),
          valign: { ctr: 'middle', b: 'bottom', t: 'top' }[anchor] || (type === 'text' ? 'top' : 'middle'),
          bullets: bulleted && lines.length > 1, fill, stroke: type === 'line' ? stroke || '#343a40' : stroke, strokeW: type === 'line' ? strokeW || 3 : strokeW,
          radius: geom === 'roundRect' ? 16 : 0,
        }));
      }
    };
    const tree = desc(sx, 'p:spTree');
    if (tree) await walk(tree);

    let notes = '';
    const notesRel = Object.values(srels).find((r) => r.type?.endsWith('/notesSlide'));
    if (notesRel && zip.file(notesRel.target)) {
      const nx = await xml(notesRel.target);
      for (const sp of nx.getElementsByTagName('p:sp')) {
        if (desc(sp, 'p:ph')?.getAttribute('type') === 'body') notes = kids(kid(sp, 'p:txBody'), 'a:p').map((p) => [...p.getElementsByTagName('a:t')].map((t) => t.textContent).join('')).join('\n');
      }
    }
    out.push(slideMap({ bg, notes }, els));
  }

  doc.transact(() => {
    doc.getMap('props').set('theme', 'clair');
    doc.getArray('slides').push(out.length ? out : [slideMap({}, [])]);
  });
}
