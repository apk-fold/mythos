// Export .docx : conversion de l'arbre ProseMirror en modèle WordprocessingML.
// Un .docx est une archive ZIP dont word/document.xml contient <w:body> → paragraphes <w:p>
// → segments de texte <w:r> portant leurs propriétés <w:rPr> (gras, police, taille en demi-points…).
import {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, Table, TableRow, TableCell,
  WidthType, ImageRun, LevelFormat, BorderStyle, ShadingType, ExternalHyperlink, PageBreak,
} from 'docx';
import { toHex, fromB64 } from '../util.js';

const HEADINGS = [null, HeadingLevel.HEADING_1, HeadingLevel.HEADING_2, HeadingLevel.HEADING_3, HeadingLevel.HEADING_4, HeadingLevel.HEADING_5, HeadingLevel.HEADING_6];
const ALIGN = { left: AlignmentType.LEFT, center: AlignmentType.CENTER, right: AlignmentType.RIGHT, justify: AlignmentType.JUSTIFIED };

function halfPoints(size) {
  if (!size) return undefined;
  const m = /^([\d.]+)\s*(pt|px)?$/.exec(String(size));
  if (!m) return undefined;
  const pt = m[2] === 'px' ? +m[1] * 0.75 : +m[1];
  return Math.round(pt * 2);
}

// Convertit toutes les images en PNG (format universellement accepté) et mesure leurs dimensions.
function loadImage(src) {
  return new Promise((res) => {
    const img = new Image();
    img.onload = () => {
      const k = Math.min(1, 600 / img.naturalWidth);
      const cv = document.createElement('canvas');
      cv.width = img.naturalWidth; cv.height = img.naturalHeight;
      cv.getContext('2d').drawImage(img, 0, 0);
      res({ data: fromB64(cv.toDataURL('image/png').split(',')[1]), w: Math.round(img.naturalWidth * k), h: Math.round(img.naturalHeight * k) });
    };
    img.onerror = () => res(null);
    img.src = src;
  });
}

export async function exportDocx(json, title) {
  const images = new Map();
  const collect = (n) => { if (n.type === 'image' && n.attrs?.src) images.set(n.attrs.src, null); (n.content || []).forEach(collect); };
  collect(json);
  for (const src of images.keys()) images.set(src, await loadImage(src));

  let listInstance = 0;

  const runs = (nodes = [], base = {}) => {
    const out = [];
    for (const n of nodes) {
      if (n.type === 'hardBreak') { out.push(new TextRun({ text: '', break: 1 })); continue; }
      if (n.type === 'image') { const im = images.get(n.attrs.src); if (im) out.push(new ImageRun({ type: 'png', data: im.data, transformation: { width: im.w, height: im.h } })); continue; }
      if (n.type !== 'text') continue;
      const o = { text: n.text, ...base };
      let link = null;
      for (const m of n.marks || []) {
        const a = m.attrs || {};
        switch (m.type) {
          case 'bold': o.bold = true; break;
          case 'italic': o.italics = true; break;
          case 'underline': o.underline = {}; break;
          case 'strike': o.strike = true; break;
          case 'code': o.font = 'Courier New'; break;
          case 'subscript': o.subScript = true; break;
          case 'superscript': o.superScript = true; break;
          case 'highlight': o.shading = { type: ShadingType.CLEAR, color: 'auto', fill: toHex(a.color) || 'FFF3BF' }; break;
          case 'link': link = a.href; o.style = 'Hyperlink'; break;
          case 'textStyle':
            if (toHex(a.color)) o.color = toHex(a.color);
            if (toHex(a.backgroundColor)) o.shading = { type: ShadingType.CLEAR, color: 'auto', fill: toHex(a.backgroundColor) };
            if (a.fontFamily) o.font = a.fontFamily.split(',')[0].replace(/["']/g, '').trim();
            if (halfPoints(a.fontSize)) o.size = halfPoints(a.fontSize);
            break;
        }
      }
      const run = new TextRun(o);
      out.push(link ? new ExternalHyperlink({ link, children: [run] }) : run);
    }
    return out;
  };

  const blocks = (nodes = [], ctx = {}) => {
    const out = [];
    for (const n of nodes) {
      const a = n.attrs || {};
      const align = ALIGN[a.textAlign];
      switch (n.type) {
        case 'paragraph':
          out.push(new Paragraph({ alignment: align, children: runs(n.content), indent: ctx.indent ? { left: ctx.indent } : undefined, ...(ctx.list ? ctx.list() : {}) }));
          if (ctx.list) ctx.list = ctx.cont;
          break;
        case 'heading':
          out.push(new Paragraph({ heading: HEADINGS[a.level] || HeadingLevel.HEADING_1, alignment: align, children: runs(n.content) }));
          break;
        case 'blockquote':
          out.push(...blocks(n.content, { ...ctx, indent: (ctx.indent || 0) + 720 }));
          break;
        case 'codeBlock':
          for (const line of (n.content || []).map((t) => t.text).join('').split('\n'))
            out.push(new Paragraph({ shading: { type: ShadingType.CLEAR, color: 'auto', fill: 'F1F3F5' }, children: [new TextRun({ text: line, font: 'Courier New', size: 20 })] }));
          break;
        case 'horizontalRule':
          out.push(new Paragraph({ border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: 'AAAAAA', space: 1 } }, children: [] }));
          break;
        case 'pageBreak':
          out.push(new Paragraph({ children: [new PageBreak()] }));
          break;
        case 'image': {
          const im = images.get(a.src);
          if (im) out.push(new Paragraph({ alignment: AlignmentType.CENTER, children: [new ImageRun({ type: 'png', data: im.data, transformation: { width: im.w, height: im.h } })] }));
          break;
        }
        case 'bulletList':
        case 'orderedList': {
          const level = ctx.level == null ? 0 : ctx.level + 1;
          const instance = n.type === 'orderedList' ? ++listInstance : 0;
          for (const item of n.content || []) {
            const props = () => (n.type === 'bulletList' ? { bullet: { level } } : { numbering: { reference: 'num', level, instance } });
            const cont = () => ({ indent: { left: 720 * (level + 1) } });
            out.push(...blocks(item.content, { ...ctx, level, list: props, cont }));
          }
          break;
        }
        case 'table': {
          const rows = (n.content || []).map((row) => new TableRow({
            children: (row.content || []).map((cell) => new TableCell({
              columnSpan: cell.attrs?.colspan > 1 ? cell.attrs.colspan : undefined,
              rowSpan: cell.attrs?.rowspan > 1 ? cell.attrs.rowspan : undefined,
              shading: cell.type === 'tableHeader' ? { type: ShadingType.CLEAR, color: 'auto', fill: 'F1F3F5' } : undefined,
              children: (() => { const b = blocks(cell.content); return b.length ? b : [new Paragraph('')]; })(),
            })),
          }));
          if (rows.length) out.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows }));
          out.push(new Paragraph(''));
          break;
        }
        default:
          if (n.content) out.push(...blocks(n.content, ctx));
      }
    }
    return out;
  };

  const doc = new Document({
    creator: 'Mythos',
    title,
    styles: { default: { document: { run: { font: 'Calibri', size: 22 } } } },
    numbering: {
      config: [{
        reference: 'num',
        levels: Array.from({ length: 9 }, (_, l) => ({
          level: l, format: [LevelFormat.DECIMAL, LevelFormat.LOWER_LETTER, LevelFormat.LOWER_ROMAN][l % 3],
          text: `%${l + 1}.`, alignment: AlignmentType.START, style: { paragraph: { indent: { left: 720 * (l + 1), hanging: 360 } } },
        })),
      }],
    },
    sections: [{ children: blocks(json.content) }],
  });
  return Packer.toBlob(doc);
}
