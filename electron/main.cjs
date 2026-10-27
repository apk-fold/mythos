// Processus principal Electron (Windows / Linux) : fenêtre, protocole app:// et accès disque limité.
const { app, BrowserWindow, protocol, net, ipcMain, dialog, Menu, shell } = require('electron');
const path = require('path');
const fs = require('fs/promises');
const { pathToFileURL } = require('url');

const DIST = path.join(__dirname, '..', 'dist');
protocol.registerSchemesAsPrivileged([{ scheme: 'app', privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true } }]);
// Expose les vraies adresses locales à WebRTC pour l'appairage direct en réseau local.
app.commandLine.appendSwitch('disable-features', 'WebRtcHideLocalIpsWithMdns');

// Dossiers de synchronisation choisis par l'utilisateur : seuls ceux-là sont accessibles.
const allowedFile = () => path.join(app.getPath('userData'), 'sync-folders.json');
let allowed = new Set();
const loadAllowed = async () => { try { allowed = new Set(JSON.parse(await fs.readFile(allowedFile(), 'utf8'))); } catch {} };
const saveAllowed = () => fs.writeFile(allowedFile(), JSON.stringify([...allowed]));
const checkFolder = (f) => { if (!allowed.has(path.resolve(f))) throw new Error('Dossier non autorisé'); return path.resolve(f); };
const checkName = (n) => { if (!/^mythos-[\w-]+\.mythos$/.test(n)) throw new Error('Nom de fichier refusé'); return n; };

function createWindow() {
  const win = new BrowserWindow({
    width: 1280, height: 820, minWidth: 380, minHeight: 500,
    title: 'Mythos', backgroundColor: '#f4f5f7', autoHideMenuBar: true,
    icon: path.join(__dirname, '..', 'build', 'icon.png'),
    webPreferences: { preload: path.join(__dirname, 'preload.cjs'), contextIsolation: true, nodeIntegration: false, sandbox: true },
  });
  win.webContents.setWindowOpenHandler(({ url }) => { if (/^https?:/.test(url)) shell.openExternal(url); return { action: 'deny' }; });
  win.webContents.on('will-navigate', (e, url) => { if (!url.startsWith('app://')) { e.preventDefault(); if (/^https?:/.test(url)) shell.openExternal(url); } });
  win.loadURL('app://mythos/index.html');
}

app.whenReady().then(async () => {
  await loadAllowed();
  protocol.handle('app', (req) => {
    const p = decodeURIComponent(new URL(req.url).pathname);
    const file = path.normalize(path.join(DIST, p === '/' ? 'index.html' : p));
    if (!file.startsWith(DIST)) return new Response('Interdit', { status: 403 });
    return net.fetch(pathToFileURL(file).toString());
  });
  Menu.setApplicationMenu(null);

  ipcMain.handle('save-file', async (e, name, b64) => {
    const r = await dialog.showSaveDialog(BrowserWindow.fromWebContents(e.sender), { defaultPath: name });
    if (r.canceled || !r.filePath) return false;
    await fs.writeFile(r.filePath, Buffer.from(b64, 'base64'));
    return true;
  });
  ipcMain.handle('pick-folder', async (e) => {
    const r = await dialog.showOpenDialog(BrowserWindow.fromWebContents(e.sender), { properties: ['openDirectory', 'createDirectory'], title: 'Dossier de synchronisation' });
    if (r.canceled || !r.filePaths[0]) return null;
    const f = path.resolve(r.filePaths[0]);
    allowed.add(f);
    await saveAllowed();
    return f;
  });
  ipcMain.handle('list-dir', async (_e, folder) => {
    const dir = checkFolder(folder);
    const names = (await fs.readdir(dir)).filter((n) => /^mythos-[\w-]+\.mythos$/.test(n));
    return Promise.all(names.map(async (name) => ({ name, mtime: (await fs.stat(path.join(dir, name))).mtimeMs })));
  });
  ipcMain.handle('read-text', async (_e, folder, name) => fs.readFile(path.join(checkFolder(folder), checkName(name)), 'utf8'));
  ipcMain.handle('write-text', async (_e, folder, name, text) => {
    const target = path.join(checkFolder(folder), checkName(name));
    await fs.writeFile(target + '.tmp', text);
    await fs.rename(target + '.tmp', target);
    return true;
  });

  createWindow();
  app.on('activate', () => BrowserWindow.getAllWindows().length === 0 && createWindow());
});
app.on('window-all-closed', () => app.quit());
