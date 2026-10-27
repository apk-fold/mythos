// Panneau « Synchronisation » : appairage direct, dossier partagé et fichier .mythos.
import QRCode from 'qrcode';
import jsQR from 'jsqr';
import { h, modal, toast, saveFile, pickFile, isElectron, confirmBox } from '../util.js';
import { createInvite, joinInvite, peers, onPeersChange } from './p2p.js';
import { newCode, hostWithCode, joinWithCode } from './code.js';
import { exportBundle, importBundle } from './engine.js';
import { status as folderStatus, onFolderStatus, chooseFolder, forgetFolder, syncNow } from './folder.js';
import { deviceName } from '../store.js';
import * as S from '../settings.js';

function codeBox(code) {
  const canvas = h('canvas', { class: 'qr' });
  QRCode.toCanvas(canvas, code, { errorCorrectionLevel: 'L', margin: 1, width: 260 }).catch(() => (canvas.style.display = 'none'));
  const ta = h('textarea', { class: 'field code', readonly: true, rows: 3 }, code);
  return h('div', { class: 'stack center' }, canvas, ta,
    h('button', { class: 'btn', onclick: async () => {
      try { await navigator.clipboard.writeText(code); toast('Code copié'); } catch { ta.select(); document.execCommand('copy'); toast('Code copié'); }
    } }, 'Copier le code'));
}

function codeInput(placeholder, onSubmit) {
  const ta = h('textarea', { class: 'field code', rows: 3, placeholder });
  const go = h('button', { class: 'btn primary', onclick: async () => {
    go.disabled = true;
    try { await onSubmit(ta.value); } catch (e) { toast('Erreur : ' + (e.message || e)); } finally { go.disabled = false; }
  } }, 'Valider');
  return h('div', { class: 'stack' }, ta,
    h('div', { class: 'row' },
      h('button', { class: 'btn', onclick: () => scanQR((t) => { ta.value = t; go.click(); }) }, 'Scanner un QR code'),
      h('button', { class: 'btn', onclick: async () => { try { ta.value = await navigator.clipboard.readText(); } catch { toast('Collez avec Ctrl+V'); } } }, 'Coller'),
      go));
}

export function scanQR(onCode) {
  const video = h('video', { class: 'scan-video', playsinline: true, muted: true });
  let stream, raf;
  const stop = () => { cancelAnimationFrame(raf); stream?.getTracks().forEach((t) => t.stop()); };
  const m = modal('Scanner le QR code', h('div', { class: 'stack center' }, video, h('p', { class: 'muted' }, 'Visez le QR code affiché sur l\'autre appareil.')), { onClose: stop });
  const cv = document.createElement('canvas');
  const ctx = cv.getContext('2d', { willReadFrequently: true });
  navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } }).then((s) => {
    stream = s;
    video.srcObject = s;
    video.play();
    const loop = () => {
      if (video.readyState >= 2) {
        cv.width = video.videoWidth;
        cv.height = video.videoHeight;
        ctx.drawImage(video, 0, 0);
        const r = jsQR(ctx.getImageData(0, 0, cv.width, cv.height).data, cv.width, cv.height);
        if (r?.data) { m.close(); onCode(r.data); return; }
      }
      raf = requestAnimationFrame(loop);
    };
    loop();
  }).catch(() => { m.close(); toast('Caméra indisponible : collez le code à la place.'); });
}

export function openSyncPanel() {
  const body = h('div', { class: 'sync' });
  const peerList = h('ul', { class: 'peer-list' });
  const renderPeers = (list = [...peers.values()]) => {
    peerList.replaceChildren(...(list.length
      ? list.map((p) => h('li', null, h('span', { class: 'dot ' + (p.state === 'connecté' ? 'on' : '') }), h('b', null, p.name), h('span', { class: 'muted' }, p.state),
          h('button', { class: 'btn small', onclick: () => p.disconnect() }, 'Déconnecter')))
      : [h('li', { class: 'muted' }, 'Aucun appareil connecté.')]));
  };
  renderPeers();
  const offPeers = onPeersChange(renderPeers);

  const stun = h('input', { type: 'checkbox', checked: S.get('stun'), onchange: () => S.set({ stun: stun.checked }) });
  const flow = h('div', { class: 'flow' });

  const invite = async () => {
    flow.replaceChildren(h('p', { class: 'muted' }, 'Préparation de l\'invitation…'));
    const inv = await createInvite();
    flow.replaceChildren(
      h('h4', null, '1. Sur l\'autre appareil, choisissez « Rejoindre » et scannez ce code'), codeBox(inv.code),
      h('h4', null, '2. Puis saisissez ici le code réponse qu\'il affiche'),
      codeInput('Code réponse…', async (c) => { await inv.accept(c); flow.replaceChildren(h('p', null, 'Connexion en cours… La synchronisation démarre automatiquement.')); }));
  };
  const join = () => {
    flow.replaceChildren(h('h4', null, 'Saisissez le code d\'invitation de l\'autre appareil'),
      codeInput('Code d\'invitation…', async (c) => {
        const j = await joinInvite(c);
        flow.replaceChildren(h('h4', null, 'Montrez ce code réponse à l\'autre appareil'), codeBox(j.code),
          h('p', { class: 'muted' }, 'La synchronisation démarre dès que l\'autre appareil l\'a saisi.'));
      }));
  };

  let pairing = null;
  const stopPairing = () => { pairing?.cancel(); pairing = null; };
  const status = (p) => (t) => (p.textContent = t);
  const hostCode = async () => {
    stopPairing();
    const code = newCode();
    const st = h('p', { class: 'muted' }, 'Préparation…');
    flow.replaceChildren(h('h4', null, 'Saisissez ce code sur l\'autre appareil'),
      h('div', { class: 'pin-show' }, ...code.split('').map((c) => h('span', null, c))), st,
      h('div', { class: 'row center' }, h('button', { class: 'btn', onclick: hostCode }, 'Nouveau code'),
        h('button', { class: 'btn ghost', onclick: () => { stopPairing(); flow.replaceChildren(); } }, 'Annuler')));
    try {
      pairing = await hostWithCode(code, {
        onStatus: status(st),
        confirm: (name) => !S.get('pairConfirm') || confirmBox('Nouvel appareil', `« ${name} » demande à se synchroniser avec cet appareil. Accepter ?`, 'Accepter'),
      });
    } catch (e) { st.textContent = 'Erreur : ' + (e.message || e); }
  };
  const joinCode = () => {
    stopPairing();
    const n = S.get('codeDigits') === 6 ? 6 : 4;
    const st = h('p', { class: 'muted' });
    const go = async () => {
      const code = boxes.map((b) => b.value).join('');
      if (code.length !== n) return;
      boxes.forEach((b) => (b.disabled = true));
      try { pairing = await joinWithCode(code, { onStatus: status(st) }); }
      catch (e) { st.textContent = e.message || String(e); boxes.forEach((b) => { b.disabled = false; b.value = ''; }); boxes[0].focus(); }
    };
    const boxes = Array.from({ length: n }, (_, i) => h('input', { class: 'pin-box', inputmode: 'numeric', maxlength: n, autocomplete: 'off',
      oninput: (e) => {
        const v = e.target.value.replace(/\D/g, '');
        // Un code collé d'un coup remplit les cases suivantes.
        v.split('').slice(0, n - i).forEach((c, k) => (boxes[i + k].value = c));
        if (!v) e.target.value = '';
        const next = boxes.find((b) => !b.value);
        (next || boxes[n - 1]).focus();
        if (!next) go();
      },
      onkeydown: (e) => { if (e.key === 'Backspace' && !e.target.value && i) boxes[i - 1].focus(); } }));
    flow.replaceChildren(h('h4', null, `Saisissez le code à ${n} chiffres affiché sur l'autre appareil`), h('div', { class: 'pin-in' }, ...boxes), st);
    boxes[0].focus();
  };

  const folderBox = h('div', { class: 'stack' });
  const renderFolder = () => {
    if (!isElectron()) {
      folderBox.replaceChildren(h('p', { class: 'muted' }, 'Disponible sur les versions Windows et Linux. Sur Android, utilisez l\'appairage direct ou le fichier de synchronisation.'));
      return;
    }
    const s = folderStatus;
    folderBox.replaceChildren(
      h('p', null, s.folder ? h('code', null, s.folder) : h('span', { class: 'muted' }, 'Aucun dossier choisi.')),
      s.folder && h('p', { class: 'muted' }, s.error ? 'Erreur : ' + s.error : s.last ? `Dernière synchro : ${new Date(s.last).toLocaleTimeString()} · ${s.peers} autre(s) appareil(s) dans le dossier` : 'En attente…'),
      h('div', { class: 'row' },
        h('button', { class: 'btn', onclick: chooseFolder }, s.folder ? 'Changer de dossier' : 'Choisir un dossier'),
        s.folder && h('button', { class: 'btn', onclick: syncNow }, 'Synchroniser maintenant'),
        s.folder && h('button', { class: 'btn', onclick: forgetFolder }, 'Arrêter')));
  };
  renderFolder();
  const offFolder = onFolderStatus(renderFolder);

  body.append(
    h('p', { class: 'muted' }, `Cet appareil : `, h('b', null, deviceName()), '. Aucune donnée ne passe par un serveur : les appareils échangent directement leurs modifications et les fusionnent automatiquement.'),
    h('section', null, h('h3', null, 'Appareils connectés'), peerList),
    h('section', null, h('h3', null, 'Appairage direct'),
      h('p', { class: 'muted' }, 'Connexion d\'appareil à appareil (Wi-Fi local ou Internet). Synchronisation en temps réel tant que l\'application reste ouverte.'),
      h('div', { class: 'row' },
        h('button', { class: 'btn primary', onclick: hostCode }, 'Afficher un code'),
        h('button', { class: 'btn primary', onclick: joinCode }, 'Saisir un code')),
      h('details', { class: 'more' }, h('summary', null, 'Sans Internet : QR code ou code long'),
        h('div', { class: 'row' }, h('button', { class: 'btn', onclick: invite }, 'Inviter un appareil'), h('button', { class: 'btn', onclick: join }, 'Rejoindre'))),
      h('label', { class: 'check' }, stun, ' Autoriser la connexion via Internet (utilise un serveur STUN public uniquement pour découvrir l\'adresse ; aucune donnée n\'y transite)'),
      flow),
    h('section', null, h('h3', null, 'Dossier partagé'),
      h('p', { class: 'muted' }, 'Choisissez un dossier synchronisé par Syncthing, un partage réseau, une clé USB… Chaque appareil y dépose son fichier, et l\'application fusionne ceux des autres toutes les 5 secondes.'),
      folderBox),
    h('section', null, h('h3', null, 'Fichier de synchronisation'),
      h('p', { class: 'muted' }, 'Exportez tout votre espace dans un fichier .mythos et importez-le sur un autre appareil. Les modifications fusionnent sans rien écraser.'),
      h('div', { class: 'row' },
        h('button', { class: 'btn', onclick: async () => saveFile(`mythos-${new Date().toISOString().slice(0, 10)}.mythos`, new Blob([await exportBundle()], { type: 'application/json' })) }, 'Exporter'),
        h('button', { class: 'btn', onclick: async () => {
          const f = await pickFile('.mythos,application/json');
          if (!f) return;
          try { const n = await importBundle(await f.text()); toast(`${n} document(s) fusionné(s)`); } catch (e) { toast('Erreur : ' + e.message); }
        } }, 'Importer'))));

  modal('Synchronisation', body, { wide: true, onClose: () => { stopPairing(); offPeers(); offFolder(); } });
}
