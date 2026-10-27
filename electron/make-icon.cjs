// Rend l'icône SVG en PNG aux différentes tailles nécessaires.
const { app, BrowserWindow } = require('electron');
const fs = require('fs'); const path = require('path');
const svg = fs.readFileSync(path.join(__dirname, '..', 'public', 'icon.svg'), 'utf8');
app.whenReady().then(async () => {
  const jobs = [['build/icon.png', 512, false]];
  for (const [d, s] of [['mdpi', 48], ['hdpi', 72], ['xhdpi', 96], ['xxhdpi', 144], ['xxxhdpi', 192]]) {
    jobs.push([`android/app/src/main/res/mipmap-${d}/ic_launcher.png`, s, false], [`android/app/src/main/res/mipmap-${d}/ic_launcher_round.png`, s, true]);
    jobs.push([`android/app/src/main/res/mipmap-${d}/ic_launcher_foreground.png`, Math.round(s * 108 / 48), 'fg']);
  }
  for (const [file, size, mode] of jobs) {
    const full = path.join(__dirname, '..', file);
    if (file.startsWith('android') && !fs.existsSync(path.dirname(full))) continue;
    const w = new BrowserWindow({ width: size, height: size, show: false, frame: false, transparent: true, useContentSize: true, webPreferences: { offscreen: true } });
    const inner = mode === 'fg' ? `<div style="width:${size}px;height:${size}px;display:grid;place-items:center"><div style="width:${size * 0.62}px;height:${size * 0.62}px">${svg}</div></div>` : mode ? `<div style="width:${size}px;height:${size}px;border-radius:50%;overflow:hidden;background:#3b5bdb">${svg}</div>` : svg;
    await w.loadURL('data:text/html,' + encodeURIComponent(`<html><body style="margin:0;background:transparent"><style>svg{width:100%;height:100%;display:block}</style><div style="width:${size}px;height:${size}px">${inner}</div></body></html>`));
    await new Promise((r) => setTimeout(r, 300));
    fs.writeFileSync(full, (await w.webContents.capturePage({ x: 0, y: 0, width: size, height: size })).toPNG());
    w.destroy();
  }
  app.quit();
});
