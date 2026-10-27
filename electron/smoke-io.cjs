const { app, BrowserWindow } = require('electron');
const path = require('path');
app.setPath('userData', path.join(process.env.SHOTS, 'profile-io'));
app.whenReady().then(async () => {
  const w = new BrowserWindow({ show: false });
  await w.loadURL('http://localhost:5199/');
  await new Promise(r => setTimeout(r, 2500));
  const r = await w.webContents.executeJavaScript(`import("/test/io-roundtrip.js").then(m=>m.run()).catch(e=>"ERR "+e.stack)`);
  console.log(r);
  app.quit();
});
