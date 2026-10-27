// Traitement de texte : éditeur ProseMirror (Tiptap) lié à un fragment XML Yjs,
// donc fusionnable en temps réel entre appareils.
import { Editor, Node } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Collaboration from '@tiptap/extension-collaboration';
import TextAlign from '@tiptap/extension-text-align';
import { TextStyleKit } from '@tiptap/extension-text-style';
import Highlight from '@tiptap/extension-highlight';
import { TableKit } from '@tiptap/extension-table';
import Image from '@tiptap/extension-image';
import { h, saveFile, safeName, pickFile, readAsDataURL, downscaleImage, ask, toast } from '../util.js';
import { tbtn, sep, sel, colorBtn } from '../ui/toolbar.js';
import { exportDocx } from '../io/docx.js';

const PageBreak = Node.create({
  name: 'pageBreak',
  group: 'block',
  atom: true,
  parseHTML: () => [{ tag: 'div[data-page-break]' }, { tag: 'br[style*="page-break"]' }],
  renderHTML: () => ['div', { 'data-page-break': '', class: 'page-break' }],
  addCommands() {
    return { setPageBreak: () => ({ commands }) => commands.insertContent({ type: this.name }) };
  },
});

const FONTS = [['', 'Police'], ['Inter, system-ui, sans-serif', 'Sans-serif'], ['Georgia, serif', 'Georgia'], ['"Times New Roman", serif', 'Times New Roman'],
  ['Arial, sans-serif', 'Arial'], ['Calibri, Carlito, sans-serif', 'Calibri'], ['Verdana, sans-serif', 'Verdana'], ['"Courier New", monospace', 'Courier New']];
const SIZES = [['', 'Taille'], ...[8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 72].map((s) => [s + 'pt', String(s)])];
const BLOCKS = [['p', 'Normal'], ['h1', 'Titre 1'], ['h2', 'Titre 2'], ['h3', 'Titre 3'], ['h4', 'Titre 4'], ['code', 'Code']];

// HTML en attente d'import (fichier .docx ouvert depuis l'accueil).
export const pendingImports = new Map();

export function mountWriter(root, { doc, id, meta }) {
  const page = h('div', { class: 'page' });
  const zoomWrap = h('div', { class: 'page-zoom' }, page);
  const scroller = h('div', { class: 'page-scroller' }, zoomWrap);
  const status = h('div', { class: 'status-bar' });

  const editor = new Editor({
    element: page,
    extensions: [
      StarterKit.configure({ undoRedo: false, link: { openOnClick: false, autolink: true } }),
      Collaboration.configure({ document: doc, field: 'body' }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      TextStyleKit,
      Highlight.configure({ multicolor: true }),
      TableKit.configure({ table: { resizable: true } }),
      Image.configure({ allowBase64: true }),
      PageBreak,
    ],
    editorProps: { attributes: { class: 'prose', spellcheck: 'true' } },
  });

  const chain = () => editor.chain().focus();
  const b = {};
  const blockSel = sel(BLOCKS, (v) => {
    if (v === 'p') chain().setParagraph().run();
    else if (v === 'code') chain().toggleCodeBlock().run();
    else chain().toggleHeading({ level: +v[1] }).run();
  }, 'Style de paragraphe');
  const fontSel = sel(FONTS, (v) => (v ? chain().setFontFamily(v).run() : chain().unsetFontFamily().run()), 'Police');
  const sizeSel = sel(SIZES, (v) => (v ? chain().setFontSize(v).run() : chain().unsetFontSize().run()), 'Taille');
  const zoomSel = sel([['1', '100 %'], ['0.75', '75 %'], ['0.9', '90 %'], ['1.25', '125 %'], ['1.5', '150 %']], (v) => {
    zoomWrap.style.zoom = v;
    localStorage.setItem('mythos.zoom', v);
  }, 'Zoom');
  zoomSel.value = localStorage.getItem('mythos.zoom') || '1';
  zoomWrap.style.zoom = zoomSel.value;

  const insertImage = async () => {
    const f = await pickFile('image/*');
    if (!f) return;
    const { src } = await downscaleImage(await readAsDataURL(f), 1400);
    chain().setImage({ src }).run();
  };
  const setLink = async () => {
    const prev = editor.getAttributes('link').href || 'https://';
    const url = await ask('Lien', prev, 'Adresse (laisser vide pour retirer le lien)');
    if (url === null) return;
    if (!url || url === 'https://') chain().extendMarkRange('link').unsetLink().run();
    else chain().extendMarkRange('link').setLink({ href: url }).run();
  };

  const ribbon = h('div', { class: 'ribbon' },
    tbtn('undo', 'Annuler (Ctrl+Z)', () => chain().undo().run()), tbtn('redo', 'Rétablir (Ctrl+Y)', () => chain().redo().run()), sep(),
    blockSel, fontSel, sizeSel, sep(),
    (b.bold = tbtn('bold', 'Gras (Ctrl+B)', () => chain().toggleBold().run())),
    (b.italic = tbtn('italic', 'Italique (Ctrl+I)', () => chain().toggleItalic().run())),
    (b.underline = tbtn('underline', 'Souligné (Ctrl+U)', () => chain().toggleUnderline().run())),
    (b.strike = tbtn('strike', 'Barré', () => chain().toggleStrike().run())),
    colorBtn('textColor', 'Couleur du texte', '#c92a2a', (c) => (c ? chain().setColor(c).run() : chain().unsetColor().run())),
    colorBtn('highlight', 'Surlignage', '#ffec99', (c) => (c ? chain().setHighlight({ color: c }).run() : chain().unsetHighlight().run())),
    tbtn('clearFormat', 'Effacer la mise en forme', () => chain().unsetAllMarks().clearNodes().run()), sep(),
    (b.left = tbtn('alignLeft', 'Aligner à gauche', () => chain().setTextAlign('left').run())),
    (b.center = tbtn('alignCenter', 'Centrer', () => chain().setTextAlign('center').run())),
    (b.right = tbtn('alignRight', 'Aligner à droite', () => chain().setTextAlign('right').run())),
    (b.justify = tbtn('alignJustify', 'Justifier', () => chain().setTextAlign('justify').run())), sep(),
    (b.bullet = tbtn('bulletList', 'Liste à puces', () => chain().toggleBulletList().run())),
    (b.ordered = tbtn('orderedList', 'Liste numérotée', () => chain().toggleOrderedList().run())),
    (b.quote = tbtn('quote', 'Citation', () => chain().toggleBlockquote().run())), sep(),
    tbtn('table', 'Insérer un tableau', () => chain().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()),
    tbtn('image', 'Insérer une image', insertImage),
    (b.link = tbtn('link', 'Lien', setLink)),
    tbtn('hr', 'Ligne horizontale', () => chain().setHorizontalRule().run()),
    tbtn('pageBreak', 'Saut de page', () => chain().setPageBreak().run()), sep(),
    zoomSel,
    tbtn('download', 'Exporter en .docx (Word)', async () => saveFile(safeName(meta().title) + '.docx', await exportDocx(editor.getJSON(), meta().title))),
    tbtn('print', 'Imprimer / PDF', () => printHtml(meta().title, editor.getHTML())));

  // Barre contextuelle des tableaux
  const tableBar = h('div', { class: 'ribbon sub' },
    h('span', { class: 'tb-label' }, 'Tableau :'),
    tbtn('rowAdd', 'Ligne en dessous', () => chain().addRowAfter().run(), 'Ligne +'),
    tbtn('rowDel', 'Supprimer la ligne', () => chain().deleteRow().run(), 'Ligne −'),
    tbtn('colAdd', 'Colonne à droite', () => chain().addColumnAfter().run(), 'Colonne +'),
    tbtn('colDel', 'Supprimer la colonne', () => chain().deleteColumn().run(), 'Colonne −'),
    tbtn('table', 'Fusionner / séparer les cellules', () => chain().mergeOrSplit().run(), 'Fusionner'),
    tbtn('trash', 'Supprimer le tableau', () => chain().deleteTable().run(), 'Supprimer'));

  root.append(ribbon, tableBar, scroller, status);

  const refresh = () => {
    const on = (el, v) => el.classList.toggle('on', !!v);
    on(b.bold, editor.isActive('bold')); on(b.italic, editor.isActive('italic'));
    on(b.underline, editor.isActive('underline')); on(b.strike, editor.isActive('strike'));
    for (const a of ['left', 'center', 'right', 'justify']) on(b[a], editor.isActive({ textAlign: a }));
    on(b.bullet, editor.isActive('bulletList')); on(b.ordered, editor.isActive('orderedList'));
    on(b.quote, editor.isActive('blockquote')); on(b.link, editor.isActive('link'));
    const lvl = [1, 2, 3, 4].find((l) => editor.isActive('heading', { level: l }));
    blockSel.value = lvl ? 'h' + lvl : editor.isActive('codeBlock') ? 'code' : 'p';
    const ts = editor.getAttributes('textStyle');
    fontSel.value = FONTS.some(([v]) => v === ts.fontFamily) ? ts.fontFamily : '';
    sizeSel.value = SIZES.some(([v]) => v === ts.fontSize) ? ts.fontSize : '';
    tableBar.style.display = editor.isActive('table') ? '' : 'none';
    const text = editor.state.doc.textContent;
    const words = (text.match(/[\p{L}\p{N}’'-]+/gu) || []).length;
    status.textContent = `${words} mot${words > 1 ? 's' : ''} · ${text.length} caractères`;
  };
  editor.on('transaction', refresh);
  refresh();

  const pending = pendingImports.get(id);
  if (pending != null) {
    pendingImports.delete(id);
    editor.commands.setContent(pending);
  }
  setTimeout(() => editor.commands.focus('start'), 50);

  return { destroy: () => editor.destroy() };
}

export function printHtml(title, html) {
  const frame = h('iframe', { class: 'print-frame' });
  document.body.append(frame);
  const d = frame.contentDocument;
  d.open();
  d.write(`<!doctype html><html><head><meta charset="utf-8"><title>${title.replace(/</g, '&lt;')}</title><style>
    body{font:11pt/1.5 Calibri,Carlito,Inter,sans-serif;margin:0;color:#111}
    @page{margin:2.2cm}
    img{max-width:100%} table{border-collapse:collapse;width:100%} td,th{border:1px solid #999;padding:4px 6px;vertical-align:top}
    th{background:#f1f3f5} blockquote{border-left:3px solid #ccc;margin:0;padding-left:1em;color:#444}
    pre{background:#f1f3f5;padding:8px;border-radius:4px} mark{padding:0 2px}
    .page-break,[data-page-break]{break-after:page}
  </style></head><body>${html}</body></html>`);
  d.close();
  setTimeout(() => {
    try { frame.contentWindow.focus(); frame.contentWindow.print(); } catch { toast('Impression indisponible sur cet appareil'); }
    setTimeout(() => frame.remove(), 2000);
  }, 300);
}
