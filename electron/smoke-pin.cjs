// Test : deux instances isolées s'appairent avec le code à 4 chiffres (via le relais) et se synchronisent.
// SHOTS=<dossier> npx electron electron/smoke-pin.cjs
const { app, BrowserWindow, session, net } = require('electron');
const path = require('path'); const { pathToFileURL } = require('url');
const SHOTS = process.env.SHOTS || require('os').tmpdir();
app.setPath('userData', path.join(SHOTS, 'profile-pin-' + Date.now()));
require('./main.cjs');
const DIST = path.join(__dirname, '..', 'dist');
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const until = async (f, ms = 30000) => { for (let t = 0; t < ms; t += 500) { const v = await f(); if (v) return v; await wait(500); } return null; };
app.whenReady().then(async () => {
  await wait(1000);
  const ses = session.fromPartition('persist:pin' + Date.now());
  ses.protocol.handle('app', (req) => net.fetch(pathToFileURL(path.join(DIST, decodeURIComponent(new URL(req.url).pathname))).toString()));
  const A = BrowserWindow.getAllWindows()[0];
  const B = new BrowserWindow({ width: 900, height: 700, webPreferences: { session: ses, preload: path.join(__dirname, 'preload.cjs') } });
  await B.loadURL('app://mythos/index.html'); await wait(1000);
  const a = (s) => A.webContents.executeJavaScript(s), b = (s) => B.webContents.executeJavaScript(s);
  await b(`localStorage.setItem('mythos.deviceName', 'Téléphone de test')`);
  await a(`document.querySelectorAll('.new-card')[0].click()`); await wait(1200);
  await a(`location.hash='#/'`); await wait(500);

  await a(`document.querySelector('.sync-btn').click()`); await b(`document.querySelector('.sync-btn').click()`); await wait(300);
  await a(`[...document.querySelectorAll('.sync .btn')].find(x=>x.textContent==='Afficher un code').click()`);
  const code = await until(() => a(`[...document.querySelectorAll('.pin-show span')].map(s=>s.textContent).join('')`));
  console.log('code', code);
  await until(() => a(`/attente/.test(document.querySelector('.flow p.muted')?.textContent)`));
  await b(`[...document.querySelectorAll('.sync .btn')].find(x=>x.textContent==='Saisir un code').click()`); await wait(200);
  await b(`(()=>{const x=document.querySelector('.pin-box'); x.value=${JSON.stringify(code)}; x.dispatchEvent(new Event('input',{bubbles:true}));})()`);
  const ask = await until(() => a(`[...document.querySelectorAll('.modal p')].map(p=>p.textContent).find(t=>t.includes('demande'))||''`));
  console.log('A demande :', ask);
  await a(`[...document.querySelectorAll('.modal .btn')].find(x=>x.textContent==='Accepter').click()`);
  const ok = await until(async () => (await a(`document.querySelector('.peer-list').innerText`)).includes(String.fromCharCode(10) + 'connecté') && (await b(`document.querySelector('.peer-list').innerText`)).includes(String.fromCharCode(10) + 'connecté'));
  console.log('A peers:', await a(`document.querySelector('.peer-list').innerText`));
  console.log('B peers:', await b(`document.querySelector('.peer-list').innerText`));
  await wait(2000);
  await b(`document.querySelector('.modal-back .icon-btn').click()`); await wait(500);
  const docs = await b(`document.querySelector('.doc-list').innerText`);
  console.log('B docs:', docs);
  console.log(ok && docs.trim() ? 'RESULTAT: OK' : 'RESULTAT: ECHEC', B.webContents.getURL());
  app.quit();
});
