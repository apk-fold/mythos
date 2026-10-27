// Génère les captures d'écran du README avec du contenu d'exemple : npx electron electron/screenshots.cjs
const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');
const OUT = path.join(__dirname, '..', 'docs', 'screenshots');
fs.mkdirSync(OUT, { recursive: true });
app.setPath('userData', path.join(require('os').tmpdir(), 'mythos-shots-' + Date.now()));
require('./main.cjs');
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

// Code exécuté dans la page : petites aides pour piloter l'interface.
const HELPERS = `
window.__t = {
  btn: (title) => [...document.querySelectorAll('.tb')].find((b) => b.title === title),
  sel: (title, v) => { const s = document.querySelector('.tb-select[title="' + title + '"]'); s.value = v; s.dispatchEvent(new Event('change')); },
  title: (v) => { const i = document.querySelector('.title-input'); i.value = v; i.dispatchEvent(new Event('change')); },
  go: (ref) => { const n = document.querySelector('.name-box'); n.value = ref; n.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })); },
  key: (key) => document.querySelector('.grid-scroller').dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true })),
  cell: (v, move) => { __t.key(v[0]); const ed = document.querySelector('.cell-editor'); ed.value = v; ed.dispatchEvent(new KeyboardEvent('keydown', { key: move, bubbles: true })); },
  slideText: (i, txt) => { const el = document.querySelectorAll('.slide.editable .el')[i]; el.dispatchEvent(new MouseEvent('dblclick', { bubbles: true })); const inner = el.querySelector('.el-text'); inner.textContent = txt; inner.dispatchEvent(new Event('input')); inner.blur(); },
  type: (s) => document.execCommand('insertText', false, s),
  para: () => document.execCommand('insertParagraph'),
};`;

app.whenReady().then(async () => {
  await wait(1200);
  const win = BrowserWindow.getAllWindows()[0];
  win.setSize(1360, 860);
  const js = async (s) => { await win.webContents.executeJavaScript(HELPERS + ";undefined"); return win.webContents.executeJavaScript(s + ';undefined').catch((e) => console.error('Étape échouée :', s.slice(0, 80), e.message)); };
  const shot = async (n) => { await wait(900); fs.writeFileSync(path.join(OUT, n + '.png'), (await win.webContents.capturePage()).toPNG()); };
  await js("localStorage.setItem('mythos.settings', JSON.stringify({ theme: 'light' })); location.reload()");
  await wait(1500);

  // Document
  await js("document.querySelectorAll('.new-card')[0].click()"); await wait(1200);
  await js("__t.title('Rapport annuel 2026'); const pr = document.querySelector('.prose'); pr.focus(); const dt = new DataTransfer(); dt.setData('text/html', '<h1>Rapport annuel 2026</h1><p>Cette année, l’équipe a lancé <strong>Mythos</strong>, une suite bureautique qui fonctionne <em>sans serveur</em>. Documents, classeurs et présentations se synchronisent directement entre les appareils.</p><h2>Objectifs atteints</h2><ul><li>Import et export Word, Excel et PowerPoint</li><li>Synchronisation par code à 4 chiffres</li><li>Disponible sur Windows, Linux et Android</li></ul><h2>Prochaines étapes</h2><p>Personnaliser chaque détail depuis les Paramètres : couleurs, polices, mise en page et synchronisation.</p>'); pr.dispatchEvent(new ClipboardEvent('paste', { clipboardData: dt, bubbles: true, cancelable: true }))");
  await shot('writer');

  // Classeur
  await js("location.hash = '#/'"); await wait(700);
  await js("document.querySelectorAll('.new-card')[1].click()"); await wait(1200);
  await js(`__t.title('Budget 2026');
    const rows = [['Poste','T1','T2','T3','T4','Total'],['Logiciels','1200','1350','1100','1500','=SOMME(B2:E2)'],['Matériel','800','450','600','900','=SOMME(B3:E3)'],['Formation','300','500','450','350','=SOMME(B4:E4)'],['Marketing','950','1200','1400','1650','=SOMME(B5:E5)'],['Total','=SOMME(B2:B5)','=SOMME(C2:C5)','=SOMME(D2:D5)','=SOMME(E2:E5)','=SOMME(F2:F5)'],['Moyenne','=MOYENNE(B2:B5)','=MOYENNE(C2:C5)','=MOYENNE(D2:D5)','=MOYENNE(E2:E5)','=MOYENNE(F2:F5)']];
    rows.forEach((row, r) => { __t.go('A' + (r + 1)); row.forEach((v) => __t.cell(v, 'Tab')); });
    __t.go('A1:F1'); __t.btn('Gras (Ctrl+B)').click(); document.querySelectorAll('.color-wrap')[1].querySelector('.tb.color').click();
    __t.go('A6:F6'); __t.btn('Gras (Ctrl+B)').click();
    __t.go('B2:F7'); __t.sel('Format des nombres', 'eur');
    __t.go('F6');`);
  await shot('sheet');

  // Présentation
  await js("location.hash = '#/'"); await wait(700);
  await js("document.querySelectorAll('.new-card')[2].click()"); await wait(1500);
  await js("__t.title('Présentation Mythos'); __t.sel('Thème', 'ocean')"); await wait(400);
  await js("__t.slideText(0, 'Mythos')"); await wait(200);
  await js("__t.slideText(1, 'Écrire, calculer, présenter, sans serveur')"); await wait(200);
  await js("__t.sel('Nouvelle diapositive', 'content')"); await wait(500);
  await js("__t.slideText(0, 'Pourquoi Mythos ?')"); await wait(200);
  await js("__t.slideText(1, 'Vos fichiers restent chez vous\\nSynchronisation directe entre appareils\\nCompatible Word, Excel et PowerPoint\\nGratuit et open source')"); await wait(300);
  await js("document.querySelector('.slide.editable').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))");
  await shot('slides');

  // Accueil, paramètres, mode sombre
  await js("location.hash = '#/'"); await shot('home');
  await js("sessionStorage.setItem('mythos.setTab', 'apparence'); location.hash = '#/settings'"); await shot('settings');
  await js("localStorage.setItem('mythos.settings', JSON.stringify({ theme: 'dark', palette: 'aurore', accent: '#d6336c', cDoc: '#7950f2', cSheet: '#12b886', cSlides: '#fd7e14' })); location.hash = '#/'; location.reload()");
  await wait(1800);
  await shot('home-dark');
  app.quit();
});
