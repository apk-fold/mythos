// Test : deux instances isolées s'appairent par code et se synchronisent.
const { app, BrowserWindow, session, net } = require('electron');
const path = require('path'); const { pathToFileURL } = require('url');
app.setPath('userData', path.join(process.env.SHOTS, 'profile-sync'));
require('./main.cjs');
const DIST = path.join(__dirname, '..', 'dist');
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
app.whenReady().then(async () => {
  await wait(800);
  const ses = session.fromPartition('persist:b' + Date.now());
  ses.protocol.handle('app', (req) => net.fetch(pathToFileURL(path.join(DIST, decodeURIComponent(new URL(req.url).pathname))).toString()));
  const A = BrowserWindow.getAllWindows()[0];
  const B = new BrowserWindow({ width: 900, height: 700, webPreferences: { session: ses, preload: path.join(__dirname, 'preload.cjs') } });
  await B.loadURL('app://mythos/index.html'); await wait(1000);
  const a = (s) => A.webContents.executeJavaScript(s), b = (s) => B.webContents.executeJavaScript(s);
  const stun = `localStorage.setItem('mythos.stun','0');`;
  await a(stun); await b(stun);
  // A crée un classeur avec une valeur
  await a(`document.querySelectorAll('.new-card')[1].click()`); await wait(1200);
  await a(`(()=>{const s=document.querySelector('.grid-scroller'); s.dispatchEvent(new KeyboardEvent('keydown',{key:'4',bubbles:true})); const ed=document.querySelector('.cell-editor'); ed.value='=6*7'; ed.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true}));})()`);
  await a(`location.hash='#/'`); await wait(500);
  await a(`document.querySelector('.sync-btn').click()`); await b(`document.querySelector('.sync-btn').click()`); await wait(300);
  await a(`document.querySelector('.sync .btn.primary').click()`);
  let offer = ''; for (let i = 0; i < 20 && !offer; i++) { await wait(500); offer = await a(`document.querySelector('.flow textarea[readonly]')?.value||''`); }
  console.log('offer length', offer.length);
  await b(`[...document.querySelectorAll('.sync .btn')].find(x=>x.textContent==='Rejoindre').click()`); await wait(200);
  await b(`(()=>{const t=document.querySelector('.flow textarea'); t.value=${JSON.stringify(offer)}; [...document.querySelectorAll('.flow .btn')].find(x=>x.textContent==='Valider').click();})()`);
  let answer = ''; for (let i = 0; i < 20 && !answer; i++) { await wait(500); answer = await b(`document.querySelector('.flow textarea[readonly]')?.value||''`); }
  console.log('answer length', answer.length);
  await a(`(()=>{const t=[...document.querySelectorAll('.flow textarea')].find(x=>!x.readOnly); t.value=${JSON.stringify(answer)}; [...document.querySelectorAll('.flow .btn')].find(x=>x.textContent==='Valider').click();})()`);
  await wait(4000);
  console.log('A peers:', await a(`document.querySelector('.peer-list').innerText`));
  console.log('B peers:', await b(`document.querySelector('.peer-list').innerText`));
  await b(`document.querySelector('.modal-back .icon-btn').click()`); await wait(500);
  console.log('B docs:', await b(`document.querySelector('.doc-list').innerText`));
  await b(`document.querySelector('.doc-row').click()`); await wait(1500);
  console.log('B A1 bar:', await b(`(()=>{document.querySelector('.name-box').value; return document.querySelector('.formula-input').value})()`));
  // modification côté B → visible côté A ?
  await b(`(()=>{const s=document.querySelector('.grid-scroller'); s.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true})); s.dispatchEvent(new KeyboardEvent('keydown',{key:'x',bubbles:true})); const ed=document.querySelector('.cell-editor'); ed.value='=A1+1'; ed.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true}));})()`);
  await wait(1500);
  await a(`document.querySelector('.modal-back .icon-btn')?.click()`); await a(`document.querySelector('.doc-row').click()`); await wait(1500);
  await a(`(()=>{const n=document.querySelector('.name-box'); n.value='B1'; n.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true}));})()`); await wait(300);
  console.log('A B1 bar:', await a(`document.querySelector('.formula-input').value`));
  require('fs').writeFileSync(path.join(process.env.SHOTS, 'sync-B.png'), (await B.webContents.capturePage()).toPNG());
  app.quit();
});
