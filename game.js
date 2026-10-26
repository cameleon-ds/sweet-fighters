/* =========================================================
   SWEET FIGHTERS 2 — moteur de combat pixel art
   Résolution native 384x216, mise à l'échelle "pixelated"
   ========================================================= */
'use strict';
(() => {
const VERSION = 'v54';

let W = 384; const H = 216, GROUND = 190, GRAV = 0.34;
let CX = 192; // centre horizontal
const EXT = 50;            // le décor dépasse de 50 px de chaque côté : la caméra défile un peu
let SW = 384 + 2 * EXT;    // largeur totale du décor
const cv = document.getElementById('game');
const ctx = cv.getContext('2d');
ctx.imageSmoothingEnabled = false;

// Portrait sur mobile (ex. rotation verrouillée) : on pivote tout le jeu de 90°
let ROT = false;
const app = document.getElementById('app');
function resize() {
  const touchDev = matchMedia('(pointer:coarse)').matches || 'ontouchstart' in window || /[?&]touch/.test(location.search);
  ROT = touchDev && innerHeight > innerWidth;
  document.body.classList.toggle('rot', ROT);
  const aw = ROT ? innerHeight : innerWidth, ah = ROT ? innerWidth : innerHeight;
  app.style.width = aw + 'px'; app.style.height = ah + 'px';
  app.style.left = ROT ? innerWidth + 'px' : '0px';
  // Plein écran : la largeur interne s'adapte au format de l'écran (16:9 → 21:9)
  const nw = Math.max(384, Math.min(520, Math.round(H * aw / ah)));
  if (nw !== W) {
    const old = W; W = nw; CX = W / 2; SW = W + 2 * EXT;
    cv.width = W; cv.height = H; ctx.imageSmoothingEnabled = false;
    if (typeof makeBG === 'function') { BGS.dojo = buildStageBG('dojo'); BGS.city = buildStageBG('city'); BG = BGS[(typeof G !== 'undefined' && G.stage) || 'dojo']; }
    if (typeof G !== 'undefined' && G.f) G.f.forEach(f => { f.x += (W - old) / 2; });
    if (typeof G !== 'undefined' && G.props) G.props.forEach(p => { p.x += (W - old) / 2; });
  }
  const s = Math.min(aw / W, ah / H);
  cv.style.width = Math.round(W * s) + 'px';
  cv.style.height = Math.round(H * s) + 'px';
}
addEventListener('resize', resize);
addEventListener('orientationchange', () => setTimeout(resize, 150));

/* ---------------- Utilitaires de dessin ---------------- */
const R = (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(x | 0, y | 0, w | 0, h | 0); };
function seg(a, b, w, col) {
  ctx.fillStyle = col;
  const dx = b[0] - a[0], dy = b[1] - a[1];
  const n = Math.max(1, Math.ceil(Math.max(Math.abs(dx), Math.abs(dy))));
  const o = Math.floor(w / 2);
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    ctx.fillRect(Math.round(a[0] + dx * t) - o, Math.round(a[1] + dy * t) - o, w, w);
  }
}
function disc(x, y, r, col) {
  ctx.fillStyle = col;
  x = Math.round(x); y = Math.round(y);
  for (let dy = -r; dy <= r; dy++) {
    const dx = Math.floor(Math.sqrt(r * r - dy * dy + r * 0.6));
    ctx.fillRect(x - dx, y + dy, dx * 2 + 1, 1);
  }
}
const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];

function text(s, x, y, size = 8, col = '#fff', align = 'left', out = '#000') {
  ctx.font = size + 'px "Press Start 2P", monospace';
  ctx.textAlign = align; ctx.textBaseline = 'top';
  const o = Math.max(1, Math.round(size / 8));
  ctx.fillStyle = out;
  for (let ox = -o; ox <= o; ox++) for (let oy = -o; oy <= o + 1; oy++) {
    if (ox || oy) ctx.fillText(s, x + ox, y + oy);
  }
  ctx.fillStyle = col;
  ctx.fillText(s, x, y);
}

let seed = 1337;
const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;

/* ---------------- Décor : dojo + plateau en bois ---------------- */
function makeBG() {
  seed = 1337;
  const W = SW;   // le décor est dessiné sur toute la largeur de la scène
  const off = Math.round((W - 384) / 2);
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const g = c.getContext('2d');
  const F = (x, y, w, h, col) => { g.fillStyle = col; g.fillRect(x | 0, y | 0, w | 0, h | 0); };
  const shade = (hex, k) => {
    const n = parseInt(hex.slice(1), 16);
    const r = Math.min(255, ((n >> 16) & 255) * k) | 0, gg = Math.min(255, ((n >> 8) & 255) * k) | 0, b = Math.min(255, (n & 255) * k) | 0;
    return `rgb(${r},${gg},${b})`;
  };

  // Mur en plâtre chaud
  F(0, 0, W, 132, '#d6bd92');
  for (let i = 0; i < 1400; i++) F(rnd() * W, rnd() * 132, 1, 1, rnd() < .5 ? '#cbb184' : '#e0caa2');

  // Panneaux shoji (gauche et droite)
  const shoji = (x0, w) => {
    F(x0, 22, w, 100, '#5a3820');
    F(x0 + 3, 25, w - 6, 94, '#f1e6c8');
    for (let y = 25; y < 119; y += 2) if ((y / 2) % 3 === 0) F(x0 + 3, y, w - 6, 1, '#f7eed6');
    for (let x = x0 + 3 + 12; x < x0 + w - 4; x += 13) F(x, 25, 2, 94, '#7a4e2c');
    for (let y = 25 + 15; y < 119; y += 16) F(x0 + 3, y, w - 6, 2, '#7a4e2c');
    F(x0 + 3, 25, w - 6, 1, '#fffaea');
  };
  g.save(); g.translate(off, 0);
  for (let n = 0; 18 - 98 * n > -off - 100; n++) shoji(18 - 98 * n, 82);
  for (let n = 0; 284 + 98 * n < W - off + 20; n++) shoji(284 + 98 * n, 82);

  // Alcôve centrale (tokonoma)
  F(140, 24, 104, 98, '#4a2c18');
  F(143, 27, 98, 92, '#8a6640');
  for (let i = 0; i < 300; i++) F(143 + rnd() * 98, 27 + rnd() * 92, 1, 1, rnd() < .5 ? '#7e5c38' : '#96714a');
  F(143, 27, 98, 4, '#5e3e22');
  // Rouleau suspendu avec un ensō
  F(176, 31, 32, 2, '#3a2010');
  F(178, 33, 28, 64, '#eee3c4');
  F(178, 33, 2, 64, '#d8cba6');
  F(176, 97, 32, 4, '#3a2010');
  F(174, 98, 4, 2, '#c9a860'); F(206, 98, 4, 2, '#c9a860');
  for (let a = 0.35; a < Math.PI * 2 - 0.2; a += 0.05) {
    const r = 9 + Math.sin(a * 3) * .6, th = a < 1.2 ? 1 : (a < 4 ? 3 : 2);
    F(192 + Math.cos(a) * r - th / 2, 60 + Math.sin(a) * r - th / 2, th, th, '#1a1414');
  }
  F(197, 82, 4, 4, '#b8261c'); F(198, 83, 2, 2, '#e04a3a');
  // Petite table basse + vase
  F(160, 112, 64, 4, '#3a2010'); F(162, 116, 4, 6, '#3a2010'); F(218, 116, 4, 6, '#3a2010');
  F(186, 102, 12, 10, '#26323e'); F(188, 100, 8, 2, '#26323e'); F(187, 103, 2, 7, '#3e5266');
  F(191, 90, 1, 10, '#3e5a2a'); F(188, 92, 4, 1, '#5c7e3a'); F(192, 88, 5, 1, '#5c7e3a');
  g.restore();

  // Poutres et piliers
  F(0, 0, W, 16, '#4a2c18'); F(0, 2, W, 2, '#6c4428'); F(0, 14, W, 3, '#2c180a');
  F(0, 16, W, 6, '#5a3820'); F(0, 21, W, 1, '#2c180a');
  const pillar = x => {
    F(x, 16, 14, 108, '#5c3a1e'); F(x + 2, 16, 3, 108, '#7c522c'); F(x + 11, 16, 3, 108, '#3e2410');
    for (let y = 20; y < 122; y += 6 + (rnd() * 6 | 0)) F(x + 6, y, 1, 3, '#4a2c16');
  };
  g.save(); g.translate(off, 0);
  for (let n = 0; 102 - 98 * n > -off - 20; n++) pillar(102 - 98 * n);
  [126, 244].forEach(pillar);
  for (let n = 0; 268 + 98 * n < W - off + 20; n++) pillar(268 + 98 * n);
  g.restore();

  // Lanternes en papier
  const lantern = x => {
    F(x, 16, 1, 18, '#2a1a0e');
    for (let r = 0; r < 18; r++) {
      const w = Math.round(Math.sin((r + 1) / 19 * Math.PI) * 9);
      F(x - w, 34 + r, w * 2 + 1, 1, r % 4 === 0 ? '#8c1810' : '#d8382a');
      F(x - w + 1, 34 + r, 2, 1, '#f06a52');
    }
    F(x - 4, 32, 9, 2, '#2a1a0e'); F(x - 4, 52, 9, 2, '#2a1a0e');
    F(x, 54, 1, 5, '#e0b040');
    for (let i = 0; i < 40; i++) {
      const a = rnd() * Math.PI * 2, d = 12 + rnd() * 6;
      F(x + Math.cos(a) * d, 43 + Math.sin(a) * d, 1, 1, 'rgba(255,190,90,.35)');
    }
  };
  g.save(); g.translate(off, 0);
  for (let n = 0; 115 - 196 * n > -off; n++) lantern(115 - 196 * n);
  for (let n = 0; 257 + 196 * n < W - off; n++) lantern(257 + 196 * n);
  g.restore();

  // Plinthe
  F(0, 122, W, 10, '#3a2210'); F(0, 122, W, 1, '#6a4224'); F(0, 131, W, 1, '#20120a');

  // Plancher : lattes en perspective
  const top = 132, bot = 204, vy = -260, vx = W / 2, pw = 22;
  const k = (bot - vy) / (top - vy);
  const tones = ['#b47c46', '#a87240', '#bd8650', '#ae7844'];
  for (let y = top; y < bot; y++) {
    const s = (y - vy) / (top - vy);
    const depth = 0.72 + 0.3 * (y - top) / (bot - top);
    for (let i = -24; i <= 24; i++) {
      const x0 = vx + (i - .5) * pw * s, x1 = vx + (i + .5) * pw * s;
      const tone = tones[(i + 48) % 4];
      F(x0, y, x1 - x0 + 1, 1, shade(tone, depth));
      F(x0, y, 1, 1, shade('#5a3418', depth));
    }
  }
  // Grain du bois et joints de lattes
  for (let i = -24; i <= 24; i++) {
    for (let j = 0; j < 14; j++) {
      const y = top + 2 + rnd() * (bot - top - 4);
      const s = (y - vy) / (top - vy);
      const cx = vx + i * pw * s + (rnd() - .5) * pw * s * .7;
      const len = 3 + rnd() * 8 * s;
      F(cx, y, len, 1, shade('#7a4a24', 0.75 + 0.3 * (y - top) / (bot - top)));
    }
    const jy = top + 6 + rnd() * (bot - top - 12);
    const s = (jy - vy) / (top - vy);
    F(vx + (i - .5) * pw * s, jy, pw * s, 1, '#4a2a12');
  }
  // Reflet lumineux sur le vernis
  for (let y = 146; y < 162; y++) for (let x = 0; x < W; x++) {
    if (((x + y) & 3) === 0 && rnd() < .55 - Math.abs(y - 154) / 20) F(x, y, 1, 1, 'rgba(255,230,180,.25)');
  }
  // Bord avant du plateau
  F(0, 204, W, 2, '#d49a5c');
  F(0, 206, W, 10, '#4a2810');
  for (let x = 0; x < W; x += 32) { F(x, 206, 2, 10, '#2a160a'); F(x + 2, 206, 1, 10, '#6a3e1c'); }
  F(0, 213, W, 3, '#1e0f06');
  return c;
}
let BG = null;
const BGS = {};
// Décors dessinés à partir des images (fidèles aux illustrations) : mis à l'échelle sur la largeur de la scène,
// la ligne du sol de l'image est calée sur le sol du jeu
const STAGE_IMG = { dojo: ['stage_dojo.jpg', 650], city: ['stage_city.jpg', 652] };
const STAGE_PIC = {};
for (const k in STAGE_IMG) {
  const im = new Image();
  im.onload = () => { BGS[k] = buildStageBG(k); if (typeof G !== 'undefined' && G.stage === k) BG = BGS[k]; };
  im.src = STAGE_IMG[k][0] + '?v=51';
  STAGE_PIC[k] = im;
}
function buildStageBG(k) {
  const im = STAGE_PIC[k], floor = STAGE_IMG[k][1] / 768;
  if (!im || !im.complete || !im.naturalWidth) return k === 'city' ? makeCityBG() : makeBG();
  const c = document.createElement('canvas'); c.width = SW; c.height = H;
  const g = c.getContext('2d'); g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
  const sc = Math.max(SW / im.naturalWidth, (H + 32) / im.naturalHeight), w = im.naturalWidth * sc, h = im.naturalHeight * sc;
  let oy = Math.round(GROUND - floor * h);
  oy = Math.min(0, Math.max(H - h, oy));
  g.fillStyle = '#000'; g.fillRect(0, 0, SW, H);
  g.drawImage(im, (SW - w) / 2, oy, w, h);
  return c;
}

/* ---------------- Décor 2 : la ville la nuit (style Streets of Rage) ---------------- */
function makeCityBG() {
  seed = 4242;
  const W = SW, c = document.createElement('canvas');
  c.width = W; c.height = H;
  const g = c.getContext('2d');
  const F = (x, y, w, h, col) => { g.fillStyle = col; g.fillRect(x | 0, y | 0, w | 0, h | 0); };
  // ciel de nuit
  const sky = g.createLinearGradient(0, 0, 0, 120);
  sky.addColorStop(0, '#06041a'); sky.addColorStop(.6, '#1c0f3a'); sky.addColorStop(1, '#3a1a4a');
  g.fillStyle = sky; g.fillRect(0, 0, W, 132);
  for (let i = 0; i < 120; i++) F(rnd() * W, rnd() * 60, 1, 1, rnd() < .3 ? '#fff6d8' : '#8a7ab0');
  // lune
  g.fillStyle = '#f4ecc8'; g.beginPath(); g.arc(W * .72, 26, 9, 0, 7); g.fill();
  g.fillStyle = '#1c0f3a'; g.beginPath(); g.arc(W * .72 + 4, 23, 8, 0, 7); g.fill();
  // gratte-ciel lointains
  for (let x = -10; x < W; ) {
    const w = 16 + rnd() * 26 | 0, h = 40 + rnd() * 60 | 0;
    F(x, 132 - h, w, h, '#120c2a');
    for (let wy = 132 - h + 4; wy < 126; wy += 5) for (let wx = x + 3; wx < x + w - 3; wx += 4) if (rnd() < .28) F(wx, wy, 2, 2, rnd() < .5 ? '#d8b04a' : '#6a5a9a');
    x += w + (rnd() * 4 | 0);
  }
  // immeubles de briques au premier plan du fond
  for (let x = -20; x < W; ) {
    const w = 70 + rnd() * 50 | 0, top = 20 + rnd() * 40 | 0, br = rnd() < .5 ? '#4a2228' : '#3a2632';
    F(x, top, w, 132 - top, br);
    for (let yy = top; yy < 132; yy += 3) for (let xx = x + ((yy / 3) % 2) * 4; xx < x + w; xx += 8) F(xx, yy, 1, 1, '#2a1218');
    F(x, top, w, 3, '#2a1418'); F(x, top + 3, w, 1, '#5a3038');
    for (let wy = top + 10; wy < 104; wy += 18) for (let wx = x + 8; wx < x + w - 12; wx += 18) {
      const lit = rnd() < .45;
      F(wx - 1, wy - 1, 12, 13, '#1a0c10');
      F(wx, wy, 10, 11, lit ? '#e8b85a' : '#241830');
      if (lit) { F(wx, wy, 10, 2, '#fff0b0'); F(wx + 4, wy, 2, 11, '#a87a30'); }
      else F(wx + 4, wy, 2, 11, '#1a0c10');
    }
    // escalier de secours
    if (rnd() < .5) { const ex = x + w - 22; for (let ey = top + 22; ey < 110; ey += 18) { F(ex, ey, 18, 2, '#141418'); F(ex, ey - 8, 1, 8, '#141418'); F(ex + 17, ey - 8, 1, 8, '#141418'); } }
    x += w + 6;
  }
  // enseignes néon
  const neon = (x, y, txt, col) => {
    g.save(); g.font = '8px "Press Start 2P", monospace'; g.textBaseline = 'top';
    g.shadowColor = col; g.shadowBlur = 8; g.fillStyle = col; g.fillText(txt, x, y);
    g.shadowBlur = 0; g.fillStyle = '#ffffff'; g.globalAlpha = .55; g.fillText(txt, x, y); g.restore();
  };
  for (let x = 60; x < W - 60; x += 230) { neon(x, 70, 'BAR', '#ff3aa8'); neon(x + 110, 54, 'HOTEL', '#3af0ff'); }
  // trottoir et rue
  F(0, 124, W, 8, '#2a2630'); F(0, 124, W, 1, '#4a4450');            // bas des façades
  const top = 132, bot = 196;
  for (let y = top; y < bot; y++) {
    const k = (y - top) / (bot - top);
    F(0, y, W, 1, `rgb(${70 + k * 30 | 0},${68 + k * 28 | 0},${80 + k * 30 | 0})`);
  }
  for (let y = top + 6, s0 = 10; y < bot; y += s0, s0 += 2) F(0, y, W, 1, '#3e3a48');          // joints des dalles
  for (let x = 0; x < W; x += 28) for (let y = top; y < bot; y += 12) F(x + ((y / 12) % 2) * 14, y, 1, 12, '#4a4656');
  F(0, bot, W, 3, '#8a8698'); F(0, bot + 3, W, 2, '#3a3644');          // bordure
  F(0, bot + 5, W, H - bot - 5, '#16161e');                            // chaussée
  for (let x = 0; x < W; x += 40) F(x, 210, 20, 2, '#d8c040');
  // réverbères
  for (let x = 40; x < W; x += 170) {
    F(x, 40, 3, 92, '#18181e'); F(x, 40, 16, 3, '#18181e'); F(x + 12, 43, 8, 3, '#2a2a34');
    const lg = g.createRadialGradient(x + 16, 50, 1, x + 16, 120, 70);
    lg.addColorStop(0, 'rgba(255,220,140,.35)'); lg.addColorStop(1, 'rgba(255,220,140,0)');
    g.fillStyle = lg; g.beginPath(); g.moveTo(x + 12, 46); g.lineTo(x - 30, 196); g.lineTo(x + 62, 196); g.lineTo(x + 20, 46); g.fill();
    F(x + 13, 46, 6, 2, '#fff2c0');
  }
  // bouche d'incendie
  for (let x = 120; x < W; x += 260) { F(x, 122, 6, 10, '#b8261c'); F(x - 1, 120, 8, 3, '#d8382a'); F(x - 2, 125, 10, 2, '#8a140e'); }
  return c;
}


/* ---------------- Personnages (designs originaux, pixel art « gros pixels ») ---------------- */
// Têtes 9x9 de profil (regard vers la droite).
// Cheveux : a bord · h ombre · H moyen · L reflet   Bandeau : b
// Peau : e bord · S ombre · s moyen · l reflet      k œil · m bouche
const HEAD_KAITO = [
  "..aaaaaa..",
  ".aHHLLHHa.",
  "aHHHHLLHHa",
  "aBBBBBBBBB",
  "abbbbbbbbb",
  "ahhSkssks.",
  "ahhSkssks.",
  "ahSssssss.",
  ".aSssssss.",
  "..Ssssmms.",
  "..eSSSSSe.",
];
const HEAD_SORA = [
  "..aaaaaa..",
  ".aHHLLHHa.",
  "aHHLLLLHHa",
  "aHHHHHHHHa",
  "ahHHHsHHHs",
  "ahhSkssks.",
  "ahhSkssks.",
  "ahSssssss.",
  ".aSssssss.",
  "..Ssssmms.",
  "..eSSSSSe.",
];

// Têtes vues de dos 3/4 (nuque, oreille et bord de la joue à l'avant)
const HEAD_KAITO_BACK = [
  "..aaaaaa..",
  ".aHHLLHHa.",
  "aHHHLLHHHa",
  "aBBBBBBBBB",
  "abbbnbbbbb",
  "ahHHhHHSks",
  "ahhHHhHSks",
  "ahhhhhhSss",
  ".ahhhhSsss",
  "..ahhhSss.",
  "...eSSSSe.",
];
const HEAD_SORA_BACK = [
  "..aaaaaa..",
  ".aHHLLHHa.",
  "aHHLLLLHHa",
  "aHHHLLHHHa",
  "aHHHHHHHHa",
  "ahHHhHHSks",
  "ahhHHhHSks",
  "ahhhhhhSss",
  ".ahhhhSsss",
  "..ahhhSss.",
  "...eSSSSe.",
];

// Palettes 4 tons : [bord, ombre, moyen, reflet]
const DEFS = [
  { name: 'KAITO', style: 'tshirt', vneck: true, head: HEAD_KAITO, headBack: HEAD_KAITO_BACK, band: true, torn: false, hem: true,
    skin:  ['#7a3c1c', '#b8683a', '#e8a46a', '#ffd8a0'],
    hair:  { a: '#2a1a10', h: '#4a3020', H: '#6c4830', L: '#94704a' },
    bandP: ['#08080c', '#18181e', '#2c2c36', '#50505c'],
    top:   ['#8a94b0', '#b8c2dc', '#e4eaf6', '#ffffff'],
    legs:  ['#08080c', '#18181e', '#2e2e3a', '#4c4c5c'],
    belt:  ['#040406', '#121216', '#26262e', '#44444e'],
    glove: ['#08080c', '#18181e', '#2e2e3a', '#565664'],
    fb: ['#ffffff', '#a8f4ff', '#2fb4ff', '#1458c4'] },
  { name: 'JOHN', style: 'tshirt', vneck: true, head: HEAD_SORA, headBack: HEAD_SORA_BACK, braid: true, jeans: true, shoes: true,
    skin:  ['#6a3418', '#a45e34', '#d8945c', '#f8c48c'],
    hair:  { a: '#8a5a14', h: '#c08a24', H: '#ecc048', L: '#fff08a' },   // blond
    top:   ['#5a0c0c', '#9a1818', '#d8302a', '#ff7058'],                 // t-shirt rouge
    legs:  ['#16264a', '#2a4478', '#4a6eac', '#82a8dc'],                 // jean bleu
    belt:  ['#2e180a', '#4e2c14', '#704220', '#9a6436'],                 // ceinture cuir
    glove: ['#08080c', '#18181e', '#2e2e3a', '#565664'],                 // gants noirs (comme Kaito)
    fb: ['#ffffff', '#fff2a0', '#ff9c2c', '#c64812'] },
];

// Squelettes : [tête, cou, bassin, coudeAv, mainAv, coudeAr, mainAr, genouAv, piedAv, genouAr, piedAr]
const POSES = {
  idle0:   [3,-55, 1,-47, -1,-29, 9,-40, 14,-48, 4,-38, 9,-45, 7,-15, 11,0, -8,-14, -12,0],
  idle1:   [3,-54, 1,-46, -1,-28, 9,-39, 14,-47, 4,-37, 9,-44, 7,-14, 11,0, -8,-13, -12,0],
  walk0:   [4,-55, 2,-47, 0,-29, 6,-38, 11,-44, -5,-37, 0,-43, 8,-15, 12,0, -6,-14, -11,0],
  walk1:   [4,-57, 2,-49, 0,-31, 7,-40, 12,-46, -6,-38, -2,-44, 2,-16, 1,0, 5,-21, 1,-9],
  walk2:   [4,-55, 2,-47, 0,-29, 9,-39, 14,-45, -8,-36, -4,-42, -5,-14, -10,0, 8,-15, 12,0],
  walk3:   [4,-57, 2,-49, 0,-31, 7,-40, 12,-46, -6,-38, -2,-44, 5,-21, 1,-9, 2,-16, 1,0],
  jump:    [3,-58, 1,-50, 0,-34, 9,-44, 13,-51, 4,-42, 9,-48, 10,-30, 6,-20, 2,-27, -4,-18],
  punch0:  [3,-52, 1,-44, 0,-26, 6,-40, 9,-46, -4,-38, 0,-42, 10,-14, 16,0, -8,-12, -16,0],
  punch1:  [8,-51, 6,-43, 2,-26, 17,-44, 30,-45, -4,-38, 0,-42, 11,-14, 17,0, -9,-11, -18,0],
  kick0:   [-1,-55, -2,-47, -2,-30, 4,-42, 8,-48, -8,-40, -4,-46, 13,-42, 9,-30, -4,-15, -6,0],
  kick1:   [-9,-52, -8,-44, -3,-30, 0,-42, 4,-48, -12,-40, -8,-46, 20,-40, 42,-44, -4,-15, -7,0],
  fpunch0: [3,-52, 1,-44, 0,-26, 8,-40, 12,-46, -6,-38, -2,-42, 10,-14, 16,0, -8,-12, -16,0],
  fpunch1: [9,-51, 7,-43, 3,-26, 3,-40, 6,-46, 16,-45, 32,-46, 13,-14, 20,0, -5,-11, -12,0],
  fkick0:  [-2,-55, -3,-47, -2,-30, 4,-42, 8,-48, -8,-40, -4,-46, 6,-15, 9,0, 12,-42, 9,-29],
  fkick1:  [-10,-52, -9,-44, -3,-30, -2,-42, 2,-48, -14,-40, -10,-46, 5,-15, 8,0, 22,-40, 48,-44],
  special0:[-1,-52, -2,-44, -2,-26, -7,-34, -11,-30, -9,-35, -13,-31, 10,-13, 15,0, -9,-12, -16,0],
  special1:[6,-50, 4,-42, 1,-25, 15,-40, 26,-40, 13,-38, 24,-37, 11,-13, 18,0, -8,-11, -17,0],
  upper0:  [4,-46, 2,-38, 0,-22, 8,-30, 10,-24, 4,-30, 8,-36, 10,-12, 12,0, -6,-10, -10,0],
  upper1:  [3,-58, 2,-50, 0,-32, 6,-62, 8,-76, -4,-44, -2,-38, 8,-26, 6,-12, -3,-16, -6,-2],
  upper2:  [3,-58, 1,-50, 0,-34, 8,-56, 12,-66, -4,-44, -2,-38, 9,-30, 6,-20, 2,-26, -4,-18],
  hit:     [-4,-53, -4,-45, -2,-28, 2,-40, 6,-46, -8,-38, -4,-44, 6,-14, 10,0, -9,-13, -13,0],
  block:   [0,-52, -1,-44, -2,-26, 7,-40, 6,-52, 5,-42, 9,-52, 8,-13, 12,0, -8,-12, -14,0],
  jkick:   [-2,-58, -2,-50, 0,-34, 6,-44, 10,-50, -6,-42, -2,-48, 14,-26, 30,-18, 2,-28, -6,-24],
  jpunch:  [5,-56, 3,-48, 0,-33, 14,-42, 26,-34, -4,-42, 0,-48, 10,-28, 6,-18, 2,-27, -5,-20],
  crouch:  [5,-36, 3,-29, 0,-14, 10,-24, 14,-31, 5,-22, 10,-28, 12,-10, 14,0, -8,-6, -16,0],
  cblock:  [1,-35, 0,-28, -2,-14, 7,-25, 6,-36, 5,-26, 9,-36, 11,-10, 13,0, -8,-6, -16,0],
  cpunch:  [5,-37, 3,-30, 0,-15, 15,-30, 27,-31, -4,-23, -1,-28, 12,-10, 13,0, -8,-4, -16,0],
  ckick:   [-2,-33, -3,-27, -2,-12, 4,-20, 8,-12, -10,-20, -14,-8, 16,-5, 34,-2, -8,-4, -14,0],
  tatsu:   [1,-58, 0,-50, 0,-34, -7,-46, -13,-44, 6,-46, 12,-44, 14,-36, 30,-37, 3,-24, -3,-17],
  parry:   [2,-55, 0,-47, -1,-29, 10,-44, 16,-53, 8,-42, 15,-47, 8,-15, 12,0, -9,-14, -13,0],
  stunned: [-3,-52, -3,-44, -1,-28, 2,-36, 4,-29, -7,-36, -5,-29, 6,-14, 10,0, -8,-13, -12,0],
  throw0:  [4,-55, 2,-47, 0,-29, 14,-46, 22,-48, 10,-44, 20,-44, 8,-15, 13,0, -9,-14, -14,0],
  throwS:  [6,-51, 4,-43, 1,-27, 12,-35, 19,-25, 10,-33, 17,-23, 10,-13, 14,0, -9,-12, -14,0],
  throwT:  [-2,-56, -2,-48, -1,-30, -6,-60, -12,-68, -4,-58, -10,-66, 7,-15, 11,0, -9,-14, -13,0],
  tuck:    [2,-46, 1,-40, 0,-30, 8,-38, 10,-44, 4,-36, 8,-42, 9,-34, 5,-26, 4,-31, -1,-24],
  sho0:    [6,-38, 4,-31, 0,-15, 8,-24, 11,-18, -2,-25, 3,-28, 12,-10, 14,0, -8,-6, -16,0],   // shoryuken : accroupi, poing bas (de face)
  sbk1:    [0,-57, 0,-49, 0,-31, 6,-62, 7,-75, -8,-41, -6,-47, 7,-23, 5,-11, -2,-17, -3,-2],  // montée, complètement de dos, genou levé
  sbk2:    [0,-58, 0,-50, 0,-32, 6,-64, 6,-78, -8,-42, -7,-48, 6,-22, 4,-12, -1,-17, -2,-3],
  urB:     [5,-56, 3,-48, 1,-30, 9,-42, 13,-48, 11,-62, 18,-77, 8,-24, 6,-11, -3,-14, -6,-1],   // shoryuken : montée vue de dos, poing levé
  turnA:   [4,-56, 2,-48, 0,-31, 9,-44, 12,-50, 8,-54, 12,-62, 8,-26, 6,-14, -3,-16, -6,-4],   // rotation au sommet (encore de dos)
  turnB:   [3,-57, 1,-49, 0,-32, 7,-54, 10,-62, -4,-44, -3,-40, 8,-28, 6,-18, 0,-24, -5,-14],  // rotation (déjà de face)
  rup0:    [4,-38, 2,-31, -1,-15, 10,-24, 14,-31, -2,-22, 4,-18, 12,-10, 13,0, -8,-4, -16,0],
  rup1:    [4,-48, 3,-40, 0,-24, 9,-34, 13,-40, 8,-44, 14,-56, 10,-12, 12,0, -7,-8, -12,0],
  rup2:    [5,-56, 3,-48, 1,-30, 9,-42, 13,-48, 11,-62, 18,-77, 8,-15, 12,0, -8,-14, -12,0],
  rup3:    [4,-54, 2,-46, 0,-29, 9,-40, 13,-46, 8,-52, 12,-60, 8,-15, 12,0, -8,-14, -12,0],
  win:     [1,-57, 0,-49, 0,-30, 6,-58, 8,-71, -6,-40, -2,-32, 5,-15, 7,0, -6,-15, -8,0],
  fall:    [-14,-40, -9,-36, 2,-26, -6,-44, -12,-50, -14,-30, -18,-26, 10,-30, 18,-36, 12,-22, 20,-24],
  down:    [-24,-6, -17,-6, 0,-5, -14,-12, -8,-14, -20,-3, -26,-2, 9,-9, 18,-3, 10,-4, 20,-2],
};

const OUT = '#140c08';
// Les sprites sont dessinés en basse résolution puis agrandis x2 (pixels « gros »).
const K = 0.7, UP = 2;
const SPR = document.createElement('canvas');
SPR.width = 120; SPR.height = 86;
const sx = SPR.getContext('2d');
const ROLLC = document.createElement('canvas'); ROLLC.width = SPR.width; ROLLC.height = SPR.height;
const rx = ROLLC.getContext('2d');
const OX = 60, OY = 76;

const sR = (x, y, w, h, c) => { sx.fillStyle = c; sx.fillRect(Math.round(x), Math.round(y), w, h); };
function sPoly(pts, col) {
  sx.fillStyle = col;
  let y0 = Infinity, y1 = -Infinity;
  pts.forEach(p => { y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); });
  for (let y = Math.floor(y0); y <= Math.ceil(y1); y++) {
    const yc = y + .5, xs = [];
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i], b = pts[(i + 1) % pts.length];
      if ((a[1] <= yc && b[1] > yc) || (b[1] <= yc && a[1] > yc)) xs.push(a[0] + (yc - a[1]) / (b[1] - a[1]) * (b[0] - a[0]));
    }
    xs.sort((p, q) => p - q);
    for (let i = 0; i + 1 < xs.length; i += 2) {
      const xa = Math.round(xs[i]), xb = Math.round(xs[i + 1]);
      if (xb > xa) sx.fillRect(xa, y, xb - xa, 1);
    }
  }
}
const grow = (pts, k) => {
  const c = pts.reduce((s, p) => [s[0] + p[0] / pts.length, s[1] + p[1] / pts.length], [0, 0]);
  return pts.map(p => { const dx = p[0] - c[0], dy = p[1] - c[1], l = Math.hypot(dx, dy) || 1; return [p[0] + dx / l * k, p[1] + dy / l * k]; });
};
const add = (a, b, k = 1) => [a[0] + b[0] * k, a[1] + b[1] * k];
const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];

// Membre musclé : bord sombre, ombre, ton moyen décalé vers la lumière, reflet vif
function limbT(a, b, w0, w1, bulge, pal) {
  const dx = b[0] - a[0], dy = b[1] - a[1];
  const n = Math.max(1, Math.ceil(Math.max(Math.abs(dx), Math.abs(dy))));
  const pass = (k, ox, oy, col, min) => {
    sx.fillStyle = col;
    for (let i = 0; i <= n; i++) {
      const t = i / n, w = w0 + (w1 - w0) * t + bulge * Math.sin(Math.PI * t);
      const s = Math.max(min, Math.round(w * k));
      if (s <= 0) continue;
      sx.fillRect(Math.round(a[0] + dx * t + ox * w) - (s >> 1), Math.round(a[1] + dy * t + oy * w) - (s >> 1), s, s);
    }
  };
  pass(1, 0, 0, pal[0], 1);
  pass(.75, .05, .07, pal[1], 1);
  pass(.55, -.12, -.16, pal[2], 1);
  if (Math.max(w0, w1) + bulge >= 3.5) pass(.2, -.26, -.3, pal[3], 1);
}
function fist(q, dir, glove, skin) {
  const x0 = Math.round(q[0]) - 2, y0 = Math.round(q[1]) - 2;
  sR(x0, y0, 5, 4, glove[1]);
  sR(x0, y0, 4, 2, glove[2]);
  sR(x0 + 1, y0, 1, 1, glove[3]);
  const fx = dir > 0 ? x0 + 3 : x0;
  sR(fx, y0, 2, 4, skin[2]);
  sR(fx, y0 + 3, 2, 1, skin[0]);
  sR(fx + (dir > 0 ? 1 : 0), y0, 1, 1, skin[3]);
}
// Baskets montantes en toile noire, bout et semelle blancs
function shoeP(q, dir, dark) {
  const x = Math.round(q[0]), y = Math.round(q[1]);
  const x0 = x - (dir > 0 ? 2 : 4);
  sR(x0, y - 4, 6, 3, dark ? '#0a0a0e' : '#16161c');          // tige noire
  sR(x0 + (dir > 0 ? 1 : 2), y - 4, 3, 1, dark ? '#1c1c24' : '#34343e');   // reflet
  sR(x0 + (dir > 0 ? 4 : 0), y - 3, 3, 2, dark ? '#b8b8b0' : '#f4f4ee');   // bout blanc
  sR(x0, y - 1, 7, 1, dark ? '#a8a8a0' : '#e8e8e0');          // semelle blanche
  sR(x0 + 1, y - 3, 1, 1, '#d8d8d0');                          // œillet
}
function footP(q, dir, skin) {
  const x0 = Math.round(q[0]) - (dir > 0 ? 1 : 3), y = Math.round(q[1]);
  sR(x0 + (dir > 0 ? 0 : 2), y - 3, 3, 1, skin[1]);          // cheville
  sR(x0, y - 2, 5, 2, skin[1]);                              // pied (plante = dernière ligne)
  sR(x0 + (dir > 0 ? 0 : 1), y - 2, 4, 1, skin[2]);          // reflet
}

function drawFighter(f, x = f.x, y = f.y) {
  const d = f.def, P = POSES[poseOf(f)];
  const spinning = (f.state === 'tatsu' && f.t >= 4) || (f.state === 'gtatsu' && f.t >= 6 && f.t < 54);
  const dir = spinning && ((f.t >> 2) & 1) ? -f.dir : f.dir;
  // Regard vers la droite : vue de face 3/4 · regard vers la gauche : vue de dos 3/4
  const upRise = f.state === 'uppercut' && (f.apexT == null || f.t - f.apexT < 4);
  const backView = f.state === 'rupper' || (upRise && f.t >= 3);
  const fullBack = upRise && f.t >= 6;   // shoryuken en montée : complètement de dos, bras levé du côté de l'adversaire   // l'uppercut accroupi est vu de dos, bras proche levé
  sx.clearRect(0, 0, SPR.width, SPR.height);
  // Jambes plus courtes que le haut du corps (proportions trapues)
  const Q = P.slice(), LF = .82, px0 = Q[4], py0 = Q[5];
  if (['idle', 'parry', 'stunned', 'win'].includes(f.state)) { Q[18] += 4; Q[19] += 1; Q[14] += 4; Q[15] += 1; }   // jambes avant et arrière légèrement pliées vers l'avant
  const footBefore = Math.max(Q[17], Q[21]);
  for (const i of [7, 8, 9, 10]) { Q[i * 2] = px0 + (Q[i * 2] - px0) * LF; Q[i * 2 + 1] = py0 + (Q[i * 2 + 1] - py0) * LF; }
  const lift = footBefore - Math.max(Q[17], Q[21]);
  for (let i = 1; i < Q.length; i += 2) Q[i] += lift;
  const pt = i => [OX + dir * Q[i * 2] * K, OY + Q[i * 2 + 1] * K];
  let [h, n, p, fe, fh, be, bh, fk, ff, bk, bf] = [0,1,2,3,4,5,6,7,8,9,10].map(pt);
  const sk = d.skin, top = d.top, legs = d.legs;
  const dim = pal => [pal[0], pal[0], pal[1], pal[1]];   // membre éloigné de la caméra, dans l'ombre
  const tshirt = d.style === 'tshirt';

  let ux = p[0] - n[0], uy = p[1] - n[1]; const ul = Math.hypot(ux, uy) || 1; ux /= ul; uy /= ul;
  const fwd = [uy * dir, -ux * dir];
  const sh = add(n, [ux, uy], 1);
  // épaules écartées : avant (côté adversaire) et arrière (côté caméra)
  // marche : les épaules suivent les bras (l'épaule du bras qui avance avance aussi), le buste pivote
  const rs = f.state === 'walk' ? -Math.sin(f.walkPh || 0) : 0, RK = 2.6;
  const sdA = add(sh, fwd, 3.5 + RK * rs), sdB = add(sh, fwd, -4.5 - RK * rs);
  if (f.state === 'walk') {
    // épaule du premier plan abaissée au niveau de l'autre
    sdB[1] = Math.max(sdB[1], sdA[1]);
    // bras qui pivotent depuis l'épaule, à l'opposé de la jambe du même côté ; avant-bras plié
    const ph = f.walkPh || 0, AMP = .5, BEND = .85, L1 = 6.6, L2 = 6.2;
    const swingArm = (sd, th) => {
      const e = [sd[0] + dir * L1 * Math.sin(th), sd[1] + L1 * Math.cos(th)];
      return [e, [e[0] + dir * L2 * Math.sin(th + BEND), e[1] + L2 * Math.cos(th + BEND)]];
    };
    [fe, fh] = swingArm(sdA, -AMP * Math.sin(ph));
    [be, bh] = swingArm(sdB, AMP * Math.sin(ph));
  }
  // en marchant, les deux épaules à la même hauteur (l'épaule du premier plan descend au niveau de l'autre)
  const shY = f.state === 'walk' ? Math.max(sdA[1], sdB[1]) + .5 : null;
  if (shY != null) { sdA[1] = shY; sdB[1] = shY; }
  if (fullBack) {   // de dos : épaules symétriques, à la même hauteur
    const a2 = add(sh, fwd, 5.5), b2 = add(sh, fwd, -5.5);
    sdA[0] = a2[0]; sdA[1] = a2[1]; sdB[0] = b2[0]; sdB[1] = a2[1];
  }

  const drawBand = () => {
    if (!d.band) return;
    const knot = backView ? [h[0] - dir * 1, h[1] - 2] : [h[0] - dir * 4, h[1] - 2];
    const speed = Math.min(1, Math.abs(f.vx) / 2.5 + (f.air ? .6 : 0));
    [0, 1].forEach(r => {
      let prev = knot;
      for (let i = 1; i <= 5; i++) {
        const wave = Math.sin(G.frame * .22 + i * .9 + r * 1.7) * (.6 + speed) * i * .3;
        const q = [knot[0] - dir * (2.4 * i - r * .5 * i), knot[1] + i * (.6 + r * .5) + (1 - speed) * i * i * .14 + wave];
        limbT(prev, q, 2, 2, 0, r ? dim(d.bandP) : d.bandP);
        prev = q;
      }
    });
  };
  const drawBraid = () => {
    if (!d.braid) return;
    const hp = d.hair, base = backView ? [h[0] - dir * 1, h[1] + 2] : [h[0] - dir * 4, h[1]];
    const swing = (f.air ? -f.vx : 0) + Math.sin(G.frame * .12) * .5;
    const slant = backView ? .6 : 1.4;
    for (let i = 0; i < 7; i++) {
      const q = [base[0] - dir * (slant * i - .07 * i * i) + swing * i * .25, base[1] + 2.2 * i];
      sR(q[0] - 1, q[1] - 1, 3, 3, hp.a);
      sR(q[0] - 1, q[1] - 1, 2, 2, i % 2 ? hp.h : hp.H);
      if (i % 2 === 0) sR(q[0] - 1, q[1] - 1, 1, 1, hp.L);
      if (i === 6) { sR(q[0] - 1, q[1] + 2, 3, 1, top[2]); sR(q[0], q[1] + 3, 1, 3, hp.H); }
    }
  };
  // Bras : lead = bras avant (celui qui frappe), rear = bras arrière
  const arm = (s0, e, hd, near, fd = dir) => {
    const S = near ? sk : dim(sk), T = near ? top : dim(top), Gl = near ? d.glove : dim(d.glove);
    limbT(s0, e, near ? 5 : 4.5, 4, near ? 1.2 : 1, S);
    limbT(s0, mix(s0, e, tshirt ? .4 : 1), near ? 6 : 5.5, near ? 5.5 : 5, tshirt ? 0 : .5, T);
    limbT(e, hd, near ? 4.5 : 4, near ? 3.5 : 3, 1, S);
    if (!tshirt) limbT(e, mix(e, hd, .25), 5.5, 5.5, 0, T);
    fist(hd, fd, Gl, S);
  };
  const leg = (k, ft, near) => {
    const soft = pal => [pal[1], pal[1], pal[2], pal[3]];   // pas de bord sombre (pas de contour)
    const Lg = near ? soft(legs) : dim(legs), S = near ? soft(sk) : dim(sk);
    limbT(p, k, 7, 5, .8, Lg);
    // la jambe s'arrête à la cheville : rien ne dépasse sous le pied / la semelle
    const ank = add(ft, [0, d.shoes ? -4 : -4]);
    if (d.torn) {
      limbT(k, ank, 4, 3, 1, S);
      const cut = mix(k, ank, .45);
      limbT(k, cut, 6, 5.5, 0, Lg);
      if (near) {
        sR(cut[0] - 2, cut[1] + 2, 1, 1, Lg[1]); sR(cut[0] + 1, cut[1] + 2, 1, 1, Lg[1]);
        const tr = mix(p, k, .6); sR(tr[0] + dir, tr[1], 2, 1, sk[2]);
      }
    } else limbT(k, ank, 5.5, 3.5, .8, Lg);
    if (d.hem) {
      // bas du kimono effiloché aux chevilles
      const hx = Math.round(ank[0]), hy = Math.round(ank[1]);
      sR(hx - 3, hy, 6, 1, Lg[1]);
      [[-3, 2], [-2, 1], [-1, 3], [0, 1], [1, 2], [2, 1]].forEach(([dx, l], i) => sR(hx + dx, hy + 1, 1, l, i % 2 ? Lg[2] : Lg[1]));
    }
    if (d.shoes) shoeP(ft, dir, !near); else footP(ft, dir, S);
    if (d.jeans && near) { const kp = mix(p, k, .75); sR(kp[0] - 1, kp[1], 2, 2, Lg[3]); }   // délavé au genou
  };

  // ---- Plan arrière ----
  if (!backView) { drawBand(); drawBraid(); }
  // Le bras éloigné (celui qui frappe) passe derrière le torse ; le bras proche de la caméra
  // part de l'épaule arrière, ce qui laisse voir pectoraux et abdos en vue de face.
  const guard = !backView && ['idle', 'crouch', 'jump', 'land', 'getup', 'parry', 'hit', 'stunned', 'kick', 'fkick', 'ckick', 'jkick'].includes(f.state);
  const bob = f.state === 'idle' && ((G.frame / 18 | 0) + f.id) % 2 ? 1 : 0;
  if (guard && f.state !== 'parry') {
    // bras avant tendu devant, à hauteur d'épaule, bien à droite du torse
    const e1 = add(sdA, [dir * 3, 5 + bob]), h1 = add(e1, [dir * 4, -4]);   // bras avant plié, poing devant la poitrine
    arm(sdA, e1, h1, true);
  } else if (fullBack) arm(sdB, be, bh, false);   // de dos : le bras plié passe derrière le dos
  else arm(sdA, fe, fh, !backView);
  leg(fk, ff, false);   // jambe avant (côté adversaire) derrière, dans l'ombre

  // ---- Torse ----
  const wa = add(p, [-ux, -uy], 1);
  const at = t => mix(sh, wa, t);
  const tw = 1.15;   // torse plus large (on le voit de 3/4)
  const torso = [add(sh, fwd, 6 * tw + RK * rs), add(at(.3), fwd, 6.5 * tw + RK * .6 * rs), add(at(.75), fwd, 5 * tw + RK * .2 * rs), add(wa, fwd, 4.5 * tw),
                 add(wa, fwd, -4 * tw), add(at(.6), fwd, -5 * tw - RK * .3 * rs), add(at(.25), fwd, -6 * tw - RK * .7 * rs), add(sh, fwd, -5.5 * tw - RK * rs)];
  if (shY != null) { torso[0][1] = Math.max(torso[0][1], shY - 1); torso[7][1] = Math.max(torso[7][1], shY - 1); }
  if (fullBack) {
    const T2 = [add(sh, fwd, 7), add(at(.3), fwd, 7.5), add(at(.75), fwd, 5.5), add(wa, fwd, 4.8),
                add(wa, fwd, -4.8), add(at(.75), fwd, -5.5), add(at(.3), fwd, -7.5), add(sh, fwd, -7)];
    for (let i = 0; i < 8; i++) torso[i] = T2[i];
  }
  sPoly(grow(torso, .6), top[0]);
  sPoly(torso, top[2]);
  if (fullBack) {
    // dos vu de face : deux omoplates, colonne au centre, flancs dans l'ombre
    sPoly([add(sh, fwd, 7), add(sh, fwd, 5), add(at(.7), fwd, 4), add(wa, fwd, 3.5), add(wa, fwd, 4.8), add(at(.75), fwd, 5.5), add(at(.3), fwd, 7.5)], top[1]);
    sPoly([add(sh, fwd, -7), add(sh, fwd, -5), add(at(.7), fwd, -4), add(wa, fwd, -3.5), add(wa, fwd, -4.8), add(at(.75), fwd, -5.5), add(at(.3), fwd, -7.5)], top[1]);
    sPoly([add(sh, fwd, 1.5), add(sh, fwd, 5), add(at(.3), fwd, 4.5), add(at(.36), fwd, 1.5)], top[3]);
    sPoly([add(sh, fwd, -1.5), add(sh, fwd, -5), add(at(.3), fwd, -4.5), add(at(.36), fwd, -1.5)], top[3]);
    for (let t = .1; t <= .85; t += .12) { const q = at(t); sR(q[0], q[1], 1, 1, top[1]); }
  } else if (backView) {
    // Dos : omoplates éclairées, colonne vertébrale, flanc avant dans l'ombre
    sPoly([add(sh, fwd, 6), add(sh, fwd, 3), add(at(.6), fwd, 2.5), add(wa, fwd, 2), add(wa, fwd, 4.5), add(at(.75), fwd, 5), add(at(.3), fwd, 6.5)], top[1]);
    sPoly([add(sh, fwd, -5), add(sh, fwd, -1), add(at(.3), fwd, -1.5), add(at(.32), fwd, -5)], top[3]);
    for (let t = .1; t <= .85; t += .12) { const q = add(at(t), fwd, .5); sR(q[0], q[1], 1, 1, top[1]); }
    const bl1 = add(at(.35), fwd, -3); sR(bl1[0] - (dir < 0 ? 1 : 0), bl1[1], 2, 1, top[1]);
    const bl2 = add(at(.35), fwd, 2.5); sR(bl2[0] - (dir < 0 ? 1 : 0), bl2[1], 2, 1, top[1]);
  } else {
    sPoly([add(sh, fwd, -5.5), add(sh, fwd, -2.5), add(at(.6), fwd, -2), add(wa, fwd, -1.5), add(wa, fwd, -4), add(at(.6), fwd, -5), add(at(.25), fwd, -6)], top[1]);
    sPoly([add(sh, fwd, 2), add(sh, fwd, 5.5), add(at(.28), fwd, 5.5), add(at(.22), fwd, 2.5)], top[3]);
    if (tshirt) {
      // t-shirt moulant : ombre sous les pectoraux, ligne centrale des abdos
      for (let k = -3; k <= 5; k++) { const q = add(at(.42), fwd, k); sR(q[0], q[1], 1, 1, top[1]); }
      for (let t = .48; t <= .85; t += .1) { const q = add(at(t), fwd, 1.2); sR(q[0], q[1], 1, 1, top[1]); }
      const a1 = add(at(.62), fwd, -1.5), a2 = add(at(.62), fwd, 3.5); sR(a1[0] - (dir < 0 ? 1 : 0), a1[1], 2, 1, top[1]); sR(a2[0] - (dir < 0 ? 1 : 0), a2[1], 2, 1, top[1]);
    } else {
      // veste ouverte en V : torse nu visible
      sPoly([add(sh, fwd, -1), add(sh, fwd, 4.5), add(at(.55), fwd, 1.5)], sk[2]);
      sPoly([add(sh, fwd, 0), add(sh, fwd, 3), add(at(.25), fwd, 1.5)], sk[3]);
      for (let k = 0; k <= 3; k++) { const q = add(at(.3), fwd, k); sR(q[0], q[1], 1, 1, sk[1]); }
      const ab = add(at(.45), fwd, 1.5); sR(ab[0], ab[1], 1, 1, sk[1]);
      for (let t = 0; t <= 1; t += .1) { const q = mix(add(sh, fwd, 4.5), add(at(.6), fwd, -1), t); sR(q[0], q[1], 1, 1, top[0]); }
    }
  }
  // Cou court et large
  limbT([h[0] - dir * .5, h[1] + 3], [n[0] + dir * .5, n[1] - .5], 5, 5, 0, sk);
  if (tshirt && !backView && !d.vneck) {
    // col rond
    const c1 = add(sh, fwd, -1.5), c2 = add(sh, fwd, 3.5), cb = add(at(.1), fwd, 1);
    sPoly([add(c1, fwd, -1), add(c2, fwd, 1), add(cb, [0, 1])], top[1]);
    sPoly([c1, c2, cb], sk[2]);
  }
  if (tshirt && !backView && d.vneck) {
    // Col en V ouvert : haut des pectoraux visible
    const c1 = add(sh, fwd, -3), c2 = add(sh, fwd, 5), cb = add(at(.34), fwd, 1);
    sPoly([add(c1, fwd, -1), add(c2, fwd, 1), add(cb, [0, 1])], top[1]);   // bord du col
    sPoly([c1, c2, cb], sk[2]);                                            // peau
    sPoly([add(c1, fwd, .5), add(sh, fwd, .5), add(at(.18), fwd, .5)], sk[3]);   // reflet pectoral gauche
    sPoly([add(sh, fwd, 2), add(c2, fwd, -.8), add(at(.16), fwd, 2.2)], sk[3]);  // reflet pectoral droit
    for (let t = .05; t <= .3; t += .06) { const q = add(at(t), fwd, 1.2); sR(q[0], q[1], 1, 1, sk[1]); }  // sillon
    const pl = add(at(.22), fwd, -1); sR(pl[0] - (dir < 0 ? 1 : 0), pl[1], 2, 1, sk[1]);
    const pr = add(at(.22), fwd, 2.5); sR(pr[0] - (dir < 0 ? 1 : 0), pr[1], 2, 1, sk[1]);
  }


  // ---- Jambe proche ----
  leg(bk, bf, true);    // jambe arrière au premier plan, côté caméra

  // Pans de veste
  if (d.style === 'jacket') {
    const hang = f.air ? 5 : 7, flare = Math.min(2, Math.abs(f.vx));
    const back = [add(p, fwd, -4.5), add(p, fwd, -.5), add([p[0], p[1] + hang], fwd, -1 - flare), add([p[0], p[1] + hang], fwd, -5.5 - flare)];
    const front = [add(p, fwd, .5), add(p, fwd, 5), add([p[0], p[1] + hang], fwd, 5.5), add([p[0], p[1] + hang - 1], fwd, 1)];
    if (backView) { sPoly(front, top[1]); sPoly(back, top[2]); const hl = add(p, fwd, -3); sR(hl[0], hl[1] + 1, 1, hang - 2, top[3]); }
    else { sPoly(back, top[1]); sPoly(front, top[2]); const hl = add(p, fwd, 3); sR(hl[0], hl[1] + 1, 1, hang - 2, top[3]); }
  }

  // Ceinture (le nœud est devant, donc caché en vue de dos)
  const bl = d.belt, by = add(p, [-ux, -uy], 1.5);
  limbT(add(by, fwd, -4.5), add(by, fwd, 5), 3, 3, 0, bl);
  if (d.jeans) {
    const bk2 = add(by, fwd, 3); sR(bk2[0] - 1, bk2[1] - 1, 3, 2, '#d8b048'); sR(bk2[0], bk2[1] - 1, 1, 1, '#fff0a0');   // boucle
  } else if (!backView) {
    const kn = add(by, fwd, 3.5);
    sR(kn[0] - 1, kn[1] - 1, 3, 3, bl[2]); sR(kn[0] - 1, kn[1] - 1, 1, 1, bl[3]);
    sR(kn[0] + (dir > 0 ? 1 : -1), kn[1] + 1, 1, 5, bl[1]);
    sR(kn[0], kn[1] + 1, 1, 4, bl[2]);
  } else {
    const kn = add(by, fwd, 4.5);   // pans du nœud qui dépassent devant
    sR(kn[0], kn[1] + 1, 1, 4, bl[1]);
  }

  // ---- Tête ----
  const map = backView ? d.headBack : d.head, hp = d.hair, bp = d.bandP || [];
  const pal = { a: hp.a, h: hp.h, H: hp.H, L: hp.L, b: bp[1], B: bp[2], n: bp[3],
                e: sk[0], S: sk[1], s: sk[2], l: sk[3], k: '#120a06', m: sk[2] };
  const hx = Math.round(h[0]), hy = Math.round(h[1]) - 7;
  for (let r = 0; r < map.length; r++) for (let c = 0; c < map[r].length; c++) {
    const ch = map[r][c]; if (ch === '.') continue;
    sR(hx + (dir > 0 ? c - 5 : 4 - c), hy + r, 1, 1, pal[ch]);
  }

  // ---- Plan avant ----
  if (fullBack) { drawBraid(); drawBand(); arm(sdA, fe, fh, true, -dir); }   // poing levé : doigts tournés vers l'intérieur
  else if (backView) { drawBraid(); drawBand(); arm(sdB, be, bh, true); }
  else {
    // Vue de face : en garde, le bras proche reste sur le côté gauche du corps
    // (coude vers le bas, poing devant les côtes) pour dégager pectoraux et abdos.
    const guard2 = ['idle', 'punch', 'kick', 'fkick', 'crouch', 'cpunch', 'ckick', 'jpunch', 'jkick', 'jump', 'land', 'getup', 'hit', 'stunned'].includes(f.state);
    if (guard2) {
      const e2 = add(sdB, [-dir * 3.5, 6 + bob]);
      const h2 = add(e2, [dir * 3, -2.5]);
      arm(sdB, e2, h2, true);
    } else arm(sdB, be, bh, true);
  }

  if (f.flash > 0) {
    const img = sx.getImageData(0, 0, SPR.width, SPR.height), dd = img.data;
    for (let i = 0; i < dd.length; i += 4) if (dd[i + 3]) { dd[i] = dd[i + 1] = dd[i + 2] = 255; }
    sx.putImageData(img, 0, 0);
  }
  const prev = ctx.imageSmoothingEnabled; ctx.imageSmoothingEnabled = false;
  let src = SPR;
  let ang = null, cy = OY - 30 * K;
  if (f.state === 'jump' && f.roll && f.t > 3) ang = f.roll * dir * Math.min(1, (f.t - 3) / 34) * Math.PI * 2;   // roulade avant / arrière
  if (f.rotAng != null) { ang = f.rotAng; if (f.state === 'throw') cy = OY - 14 * K; }
  if (ang != null) {
    // rotation autour du centre du corps, en basse résolution
    const cx = OX;
    rx.setTransform(1, 0, 0, 1, 0, 0); rx.clearRect(0, 0, ROLLC.width, ROLLC.height);
    rx.imageSmoothingEnabled = false;
    rx.translate(cx, cy); rx.rotate(ang); rx.drawImage(SPR, -cx, -cy);
    src = ROLLC;
  }
  ctx.drawImage(src, Math.round(x) - OX * UP, Math.round(y) - OY * UP, SPR.width * UP, SPR.height * UP);
  ctx.imageSmoothingEnabled = prev;
}

function drawShadow(f) {
  const k = 1 - Math.min(.55, (GROUND - f.y) / 140);
  ctx.fillStyle = 'rgba(30,12,4,.38)';
  const w = (f.state === 'down' ? 34 : 24) * k;
  for (let dy = -2; dy <= 2; dy++) {
    const ww = Math.round(w * Math.sqrt(1 - (dy / 3) ** 2));
    ctx.fillRect(Math.round(f.x) - ww + (f.state === 'down' ? -8 * f.dir : 0), GROUND + 1 + dy, ww * 2, 1);
  }
}

/* ---------------- Audio (synthétisé) ---------------- */
let AC = null, NOISE = null;
function initAudio() {
  if (AC) { if (AC.state === 'suspended') AC.resume(); return; }
  try {
    AC = new (window.AudioContext || window.webkitAudioContext)();
    const len = AC.sampleRate * .5;
    NOISE = AC.createBuffer(1, len, AC.sampleRate);
    const dd = NOISE.getChannelData(0);
    for (let i = 0; i < len; i++) dd[i] = Math.random() * 2 - 1;
  } catch (e) { AC = null; }
}
function tone(type, f0, f1, dur, vol) {
  const t = AC.currentTime, o = AC.createOscillator(), g = AC.createGain();
  o.type = type; o.frequency.setValueAtTime(f0, t);
  o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.001, t + dur);
  o.connect(g).connect(AC.destination); o.start(t); o.stop(t + dur);
}
function noise(dur, vol, freq) {
  const t = AC.currentTime, s = AC.createBufferSource(), fl = AC.createBiquadFilter(), g = AC.createGain();
  s.buffer = NOISE; fl.type = 'bandpass'; fl.frequency.value = freq;
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.001, t + dur);
  s.connect(fl).connect(g).connect(AC.destination); s.start(t); s.stop(t + dur);
}
function sfx(n) {
  if (!AC) return;
  try {
    switch (n) {
      case 'whoosh': noise(.08, .22, 1800); break;
      case 'hit': noise(.14, .6, 700); tone('square', 170, 50, .14, .22); break;
      case 'heavy': noise(.22, .75, 480); tone('square', 120, 40, .22, .3); break;
      case 'block': noise(.06, .35, 3200); tone('square', 620, 300, .05, .1); break;
      case 'fb': tone('sawtooth', 540, 130, .38, .16); noise(.32, .22, 1100); break;
      case 'upper': tone('square', 220, 900, .25, .14); break;
      case 'ko': tone('sawtooth', 320, 45, 1.3, .25); noise(.9, .3, 380); break;
      case 'thud': noise(.18, .45, 180); break;
      case 'crash': noise(.25, .5, 2600); noise(.12, .4, 900); tone('triangle', 1400, 500, .12, .1); break;
      case 'beep': tone('square', 880, 880, .1, .12); break;
      case 'go': tone('square', 660, 1320, .3, .16); break;
      case 'select': tone('square', 440, 880, .08, .1); break;
      case 'parry': tone('square', 1200, 2200, .12, .14); noise(.08, .3, 4200); break;
    }
  } catch (e) {}
}

/* ---------------- Entrées : clavier + tactile ---------------- */
const BTNS = ['p', 'k', 's', 'x'];
const keys = new Set();
const latched = new Set(); // appuis très brefs (entre deux frames)
// Marche style Streets of Rage : buste droit, bras le long du corps qui balancent
// à l'opposé des jambes, léger rebond. 8 images générées pour une animation fluide.
const WALK_N = 8, WALK_A = 8.5;   // amplitude du pas (unités squelette)
for (let i = 0; i < WALK_N; i++) {
  const ph = i / WALK_N * Math.PI * 2;
  const bob = -1.6 * (1 + Math.cos(2 * ph)) / 2;            // le corps monte quand les jambes se croisent
  const hipY = -30 + bob;
  const leg = p => {
    const fx = WALK_A * Math.sin(p), lift = -6.5 * Math.max(0, Math.cos(p));   // pied qui avance = pied levé
    const fy = lift;
    const kx = fx * .5 + 2.5 - lift * .45, ky = (hipY + fy) / 2 + lift * .35;
    return [kx, ky, fx, fy];
  };
  const L1 = leg(ph), L2 = leg(ph + Math.PI);
  const arm = (p, x0) => {                                   // bras pendant, balancier
    const sw = Math.sin(p);
    const ex = x0 + 2.6 * sw, ey = -38.5 + bob + Math.abs(sw) * .6;
    // coude bien plié (~60°) : l'avant-bras part légèrement vers l'avant
    return [ex, ey, ex + 7.6 + 1.8 * sw, ey + 4.6 - Math.max(0, sw) * 1.2];   // avant-bras (partie nue) plié vers l'avant
  };
  const A1 = arm(ph + Math.PI, 2.5), A2 = arm(ph, -1.5);     // bras opposé à la jambe du même côté
  POSES['wk' + i] = [4, -57 + bob, 2, -49 + bob, .5, hipY, ...A1, ...A2, ...L1, ...L2].map(v => Math.round(v * 2) / 2);
}

const KEYMAP = {
  ArrowLeft: 'l', ArrowRight: 'r', ArrowUp: 'u', ArrowDown: 'd',
  KeyJ: 'p', KeyK: 'k', KeyL: 's', Space: 'x', KeyI: 'x', Enter: 'start', Escape: 'back', Backspace: 'back',
};
addEventListener('keydown', e => {
  initAudio();
  const m = KEYMAP[e.code];
  if (m) { keys.add(m); latched.add(m); e.preventDefault(); }
});
addEventListener('keyup', e => { const m = KEYMAP[e.code]; if (m) keys.delete(m); });
addEventListener('blur', () => keys.clear());

const isTouch = matchMedia('(pointer:coarse)').matches || 'ontouchstart' in window || /[?&]touch/.test(location.search);
if (isTouch) document.body.classList.add('touch');

const touch = { x: 0, y: 0, btn: new Set() };
let tap = null; // dernier tap en coordonnées canvas

(() => {
  const zone = document.getElementById('stickZone'), stick = document.getElementById('stick'), knob = document.getElementById('knob');
  let id = null;
  const upd = e => {
    const r = stick.getBoundingClientRect();
    const rad = (ROT ? r.height : r.width) / 2;
    let sx = e.clientX - (r.left + r.width / 2), sy = e.clientY - (r.top + r.height / 2);
    let dx = ROT ? sy : sx, dy = ROT ? -sx : sy;
    const l = Math.hypot(dx, dy);
    if (l > rad) { dx *= rad / l; dy *= rad / l; }
    knob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
    touch.x = dx / rad; touch.y = dy / rad;
  };
  const end = e => {
    if (e.pointerId !== id) return;
    id = null; touch.x = touch.y = 0; knob.style.transform = 'translate(-50%,-50%)';
  };
  zone.addEventListener('pointerdown', e => { if (id !== null) return; id = e.pointerId; zone.setPointerCapture(id); upd(e); e.preventDefault(); });
  zone.addEventListener('pointermove', e => { if (e.pointerId === id) upd(e); });
  zone.addEventListener('pointerup', end);
  zone.addEventListener('pointercancel', end);

  const bz = document.getElementById('btnZone');
  const owners = new Map();
  const refresh = () => {
    touch.btn.clear();
    document.querySelectorAll('.b').forEach(b => b.classList.remove('on'));
    owners.forEach(el => { if (el) { touch.btn.add(el.dataset.b); latched.add(el.dataset.b); el.classList.add('on'); } });
  };
  const pick = e => { const el = document.elementFromPoint(e.clientX, e.clientY); return el && el.closest ? el.closest('.b') : null; };
  bz.addEventListener('pointerdown', e => { bz.setPointerCapture(e.pointerId); owners.set(e.pointerId, pick(e)); refresh(); e.preventDefault(); });
  bz.addEventListener('pointermove', e => { if (owners.has(e.pointerId)) { owners.set(e.pointerId, pick(e)); refresh(); } });
  const bend = e => { owners.delete(e.pointerId); refresh(); };
  bz.addEventListener('pointerup', bend);
  bz.addEventListener('pointercancel', bend);
  const sb = document.getElementById('startBtn');
  if (sb) {
    sb.addEventListener('pointerdown', e => { latched.add('start'); sb.classList.add('on'); e.preventDefault(); e.stopPropagation(); });
    const off = () => sb.classList.remove('on');
    sb.addEventListener('pointerup', off); sb.addEventListener('pointercancel', off); sb.addEventListener('pointerleave', off);
  }
})();

// Bouton « Continuer » de l'écran portrait (rotation verrouillée)
const ROT_EL = document.getElementById('rotate');
const rotateShown = () => !!ROT_EL && getComputedStyle(ROT_EL).display !== 'none';
document.getElementById('rotateOk').addEventListener('click', () => { document.body.classList.add('rotok'); resize(); });

let fsTried = false;
addEventListener('pointerdown', e => {
  initAudio();
  const r = cv.getBoundingClientRect();
  tap = e.target !== cv ? null : ROT
    ? { x: (e.clientY - r.top) / r.height * W, y: (r.right - e.clientX) / r.width * H }
    : { x: (e.clientX - r.left) / r.width * W, y: (e.clientY - r.top) / r.height * H };
  if (isTouch && !fsTried) {
    fsTried = true;
    const el = document.documentElement;
    const rq = el.requestFullscreen || el.webkitRequestFullscreen;
    if (rq) {
      try {
        const pr = rq.call(el);
        if (pr && pr.then) pr.then(() => screen.orientation && screen.orientation.lock && screen.orientation.lock('landscape').catch(() => {})).catch(() => {});
      } catch (err) {}
    }
  }
}, { passive: true });
document.addEventListener('gesturestart', e => e.preventDefault());
document.addEventListener('touchmove', e => e.preventDefault(), { passive: false });

// Stick tactile : très petite zone morte, la direction est choisie selon l'angle (8 directions)
function stickDirs() {
  const x = touch.x, y = touch.y, m = Math.hypot(x, y);
  if (m < 0.15) return { l: false, r: false, u: false, d: false };
  const ax = Math.abs(x) / m, ay = Math.abs(y) / m;   // cos de l'angle avec chaque axe
  const H = ax > 0.38, V = ay > 0.38;                // secteurs de 67,5° : diagonales comprises
  return { l: H && x < 0, r: H && x > 0, u: V && y < 0, d: V && y > 0 };
}
// Menus : stick moins sensible (60 %) — il faut pousser franchement, une seule direction à la fois
function menuStickDirs() {
  const x = touch.x, y = touch.y, m = Math.hypot(x, y), o = { l: false, r: false, u: false, d: false };
  if (m < 0.55) return o;
  if (Math.abs(y) > Math.abs(x) * 1.4) { if (y < 0) o.u = true; else o.d = true; }
  else if (Math.abs(x) > Math.abs(y) * 1.4) { if (x < 0) o.l = true; else o.r = true; }
  return o;
}
const inMenu = () => G.paused || ['title', 'select', 'stage', 'over'].includes(G.scene);
function readPlayer() {
  const st = inMenu() ? menuStickDirs() : stickDirs();
  const K = k => keys.has(k) || latched.has(k);
  const r = {
    l: K('l') || st.l,
    r: K('r') || st.r,
    u: K('u') || st.u,
    d: K('d') || st.d,
    p: K('p') || touch.btn.has('p'),
    k: K('k') || touch.btn.has('k'),
    s: K('s') || touch.btn.has('s'),
    x: K('x') || touch.btn.has('x'),
    start: K('start'),
    back: K('back'),
  };
  latched.clear();
  const rm = readRemote(1);   // manette smartphone du joueur 1
  for (const b in rm) if (rm[b]) r[b] = true;
  return r;
}

/* ---------------- Manettes smartphone (PeerJS / WebRTC) ---------------- */
// Le PC crée un « peer » ; chaque téléphone scanne un QR code (Player 1 / Player 2), ouvre controller.html
// et envoie l'état de ses boutons directement au PC.
const NET = { peer: null, id: null, status: 'off', rem: { 1: null, 2: null } };
function remDirs(r, menu) {
  const x = r.x || 0, y = r.y || 0, m = Math.hypot(x, y), o = { l: false, r: false, u: false, d: false };
  if (menu) {
    if (m < .55) return o;
    if (Math.abs(y) > Math.abs(x) * 1.4) { if (y < 0) o.u = true; else o.d = true; }
    else if (Math.abs(x) > Math.abs(y) * 1.4) { if (x < 0) o.l = true; else o.r = true; }
    return o;
  }
  if (m < .15) return o;
  const ax = Math.abs(x) / m, ay = Math.abs(y) / m;
  return { l: ax > .38 && x < 0, r: ax > .38 && x > 0, u: ay > .38 && y < 0, d: ay > .38 && y > 0 };
}
function readRemote(p) {
  const r = NET.rem[p], o = {};
  if (!r || !r.open) return o;
  Object.assign(o, remDirs(r, inMenu()));
  for (const b of ['p', 'k', 's', 'x', 'start']) o[b] = !!(r.held[b] || r.tap[b]);
  r.tap = {};
  return o;
}
const remoteOn = p => !!(NET.rem[p] && NET.rem[p].open);
function netStart() {
  if (NET.peer || typeof Peer === 'undefined') return;
  const id = 'sf2-' + Math.random().toString(36).slice(2, 10);
  NET.status = 'connecting';
  try { NET.peer = new Peer(id); } catch (e) { NET.status = 'error'; return; }
  NET.peer.on('open', pid => { NET.id = pid; NET.status = 'ready'; makeQRs(); });
  NET.peer.on('error', () => { NET.status = 'error'; });
  NET.peer.on('disconnected', () => { try { NET.peer.reconnect(); } catch (e) {} });
  NET.peer.on('connection', conn => {
    const p = (conn.metadata && conn.metadata.p) === 2 ? 2 : 1;
    if (NET.rem[p] && NET.rem[p].conn && NET.rem[p].conn !== conn) { try { NET.rem[p].conn.close(); } catch (e) {} }
    const r = NET.rem[p] = { conn, open: false, held: {}, tap: {}, x: 0, y: 0 };
    conn.on('open', () => { r.open = true; sfx('select'); try { conn.send({ t: 'hi', p }); } catch (e) {} });
    conn.on('data', m => {
      if (!m || m.t !== 'in') return;
      for (const b of ['p', 'k', 's', 'x', 'start']) { const v = !!(b === 'x' ? m.bx : m[b]); if (v && !r.held[b]) r.tap[b] = true; r.held[b] = v; }
      r.x = +m.x || 0; r.y = +m.y || 0;
    });
    conn.on('close', () => { r.open = false; });
  });
}
const QR = { 1: null, 2: null };
function controllerURL(p) { return new URL('controller.html?h=' + NET.id + '&p=' + p, location.href).href; }
function makeQRs() {
  if (typeof qrcode === 'undefined' || !NET.id) return;
  for (const p of [1, 2]) {
    const q = qrcode(0, 'M'); q.addData(controllerURL(p)); q.make();
    const n = q.getModuleCount(), c = document.createElement('canvas'), m = 2, pad = 3;
    c.width = c.height = (n + pad * 2) * m;
    const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height); g.fillStyle = '#000';
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (q.isDark(y, x)) g.fillRect((x + pad) * m, (y + pad) * m, m, m);
    QR[p] = c;
  }
}
function drawQRs() {
  if (isTouch) return;
  for (const p of [1, 2]) {
    const q = QR[p], col = p === 1 ? '#5ac8ff' : '#ff7a6a', on = remoteOn(p);
    const sz = q ? q.width : 74, x = p === 1 ? 6 : W - 6 - sz, y = 36;
    text('PLAYER ' + p, x + sz / 2, y - 12, 8, col, 'center');
    if (q) { ctx.save(); ctx.imageSmoothingEnabled = false; ctx.globalAlpha = on ? .35 : 1; ctx.drawImage(q, x, y); ctx.restore(); }
    else { R(x, y, sz, sz, '#111'); text(NET.status === 'error' ? 'OFFLINE' : '...', x + sz / 2, y + sz / 2 - 4, 8, '#9a8aa0', 'center'); }
    text(on ? 'CONNECTED' : 'SCAN', x + sz / 2, y + sz + 4, 8, on ? '#5ae06a' : '#d8c8a8', 'center');
    if (!on) text('TO PLAY', x + sz / 2, y + sz + 14, 8, '#d8c8a8', 'center');
  }
}

const makeCtl = () => ({ held: {}, prev: {}, buf: {} });
function ctlUpdate(c, held) {
  c.prev = c.held; c.held = held;
  for (const b of [...BTNS, 'start', 'back', 'l', 'r', 'u', 'd']) {
    if (held[b] && !c.prev[b]) { const atk = b === 'p' || b === 'k' || b === 's'; if (atk && c.buf[b] > 0) { c.q = c.q || {}; c.q[b] = Math.min(2, (c.q[b] || 0) + 1); } c.buf[b] = atk ? 14 : 8; c.ord = c.ord || {}; c.n = (c.n || 0) + 1; c.ord[b] = c.n; }
    else if (c.buf[b] > 0 && !(G.freeze > 0)) { if (--c.buf[b] === 0 && c.q) c.q[b] = 0; }   // le tampon ne s'use pas pendant l'arrêt sur impact
  }
}
function take(c, b) { if (c.buf[b] > 0) { c.buf[b] = 0; if (c.q && c.q[b] > 0) { c.q[b]--; c.buf[b] = 14; } return true; } return false; }
const edge = (c, b) => !!(c.held[b] && !c.prev[b]);
// Menus : A (ou Entrée) valide, B (ou Échap) revient en arrière
const okPress = c => edge(c, 's') || edge(c, 'start');
const backPress = c => edge(c, 'k') || edge(c, 'back');

/* ---------------- Données d'attaque ---------------- */
const ATK = {
  punch:    { dur: 18, act: [4, 10], box: [14, -76, 43, -59], dmg: 7,  stun: 15, bstun: 10, push: 2.6, sfx: 'hit' },
  fpunch:   { dur: 22, act: [5, 12], box: [18, -80, 52, -58], dmg: 9,  stun: 17, bstun: 11, push: 3.2, sfx: 'hit' },
  fkick:    { dur: 30, act: [9, 16], box: [26, -70, 72, -44], dmg: 11, stun: 19, bstun: 13, push: 3.6, sfx: 'heavy' },
  kick:     { dur: 26, act: [7, 14], box: [20, -68, 62, -44], dmg: 9,  stun: 17, bstun: 12, push: 3.0, sfx: 'hit' },
  jpunch:   { act: [3, 16], box: [11, -59, 38, -34], high: true, dmg: 8,  stun: 16, bstun: 10, push: 2.0, sfx: 'hit' },
  jkick:    { act: [3, 18], box: [8, -42, 43, -11],  high: true, dmg: 10, stun: 18, bstun: 12, push: 2.4, sfx: 'hit' },
  cpunch:   { dur: 16, act: [3, 8],  box: [14, -50, 42, -35], dmg: 6,  stun: 13, bstun: 9,  push: 2.2, sfx: 'hit' },
  ckick:    { dur: 14, act: [3, 7],  box: [14, -14, 49, 0],   dmg: 4,  stun: 16, low: true, bstun: 10, push: 0.5, sfx: 'hit' },
  rupper:   { dur: 30, act: [4, 13], box: [8, -110, 50, -40], dmg: 9, knock: true, bstun: 12, push: 2.0, sfx: 'heavy' },
  flame:    { dur: 26, act: [6, 12], box: [14, -80, 54, -48], dmg: 10, stun: 18, bstun: 12, push: 3.0, sfx: 'heavy' },
  gtatsu:   { act: [6, 54], box: [-40, -76, 46, -40], dmg: 4, stun: 16, bstun: 10, push: 0.8, sfx: 'hit' },
  tatsu:    { act: [4, 90], box: [-42, -70, 45, -39], dmg: 12, knock: true, high: true, bstun: 14, push: 2.6, sfx: 'heavy', sym: true },
  uppercut: { act: [5, 19], box: [0, -115, 31, -36], dmg: 14, knock: true, bstun: 16, push: 2.0, sfx: 'heavy' },
};
const FB_HIT = { dmg: 10, stun: 18, bstun: 14, push: 2.6, chip: 2, sfx: 'heavy' };
const FB_BIG = { dmg: 22, knock: true, stun: 24, bstun: 20, push: 3.6, chip: 5, sfx: 'heavy' };
const ATTACKING = ['punch', 'kick', 'fpunch', 'fkick', 'flame', 'gtatsu', 'cpunch', 'rupper', 'ckick', 'jpunch', 'jkick', 'tatsu', 'uppercut', 'special'];
const NEUTRAL = ['idle', 'walk', 'block', 'crouch', 'cblock'];

/* ---------------- État du jeu ---------------- */
const G = {
  scene: 'title', frame: 0, t: 0, round: 1, timer: 99, tick: 0,
  pick: 0, freeze: 0, shake: 0, flashT: 0, darkT: 0, boltX: 0, boltY: 0, f: [], fbs: [], sparks: [], popups: [], msg: null, winner: null, fighting: false,
};
const pctl = makeCtl();
const p2ctl = makeCtl();   // manette smartphone du joueur 2

function makeFighter(def, id, x, dir, cpu) {
  return {
    def, id, x, y: GROUND, vx: 0, vy: 0, dir, cpu, hp: 100, lag: 100, lagT: 0,
    state: 'idle', t: 0, air: false, airAtk: false, hasHit: false, stun: 0, bstun: 0,
    invuln: 0, flash: 0, fb: null, wins: 0, ko: false, landT: 0,
    ctl: makeCtl(), ai: { cd: 30, hold: {}, holdT: 0, press: null, pressU: false, pressFrames: 0, reacted: false },
  };
}

const chargeMax = f => f.hp <= 80 ? 60 : 120;
function setState(f, s) { if (f.dizzy && s !== 'stunned') { f.dizzy = false; f.dizzyEnd = G.frame; } f.state = s; f.t = 0; f.hasHit = false; f.rotAng = null; }
function face(f, o) { f.dir = o.x >= f.x ? 1 : -1; }

function poseOf(f) {
  switch (f.state) {
    case 'idle': return ((G.frame / 18 | 0) + f.id) % 2 ? 'idle1' : 'idle0';
    case 'walk': {
      // l'image suit la distance parcourue : les pieds ne glissent pas, quelle que soit la vitesse
      const step = WALK_A * 4 * K * UP / WALK_N;   // distance à l'écran entre deux images
      const i = Math.floor(f.t * Math.abs(f.vx) / step) % WALK_N;
      const wi = f.vx * f.dir < 0 ? (WALK_N - i) % WALK_N : i;
      f.walkPh = wi / WALK_N * Math.PI * 2;
      return 'wk' + wi;
    }
    case 'block': return 'block';
    case 'crouch': return 'crouch';
    case 'cblock': return 'cblock';
    case 'cpunch': return f.t < 3 || f.t >= 8 ? 'crouch' : 'cpunch';
    case 'ckick': return f.t < 2 || f.t >= 10 ? 'crouch' : 'ckick';   // jambe tendue pendant les images actives (visible à l'impact)
    case 'tatsu': return f.t < 4 ? 'jump' : 'tatsu';
    case 'gtatsu': return f.t >= 6 && f.t < 54 ? 'tatsu' : 'kick0';
    case 'flame': return f.t < 5 ? 'special0' : 'special1';
    case 'jump': return f.roll && f.t > 3 ? 'tuck' : 'jump';
    case 'rupper': return f.t < 4 ? 'rup0' : f.t < 9 ? 'rup1' : f.t < 17 ? 'rup2' : 'rup3';
    case 'jpunch': return f.t < 3 ? 'jump' : 'jpunch';
    case 'jkick': return f.t < 3 ? 'jump' : 'jkick';
    case 'punch': return f.t < 4 || f.t >= 10 ? 'punch0' : 'punch1';
    case 'kick': return f.t < 7 || f.t >= 14 ? 'kick0' : 'kick1';
    case 'fpunch': return f.t < 5 ? 'fpunch0' : f.t < 13 ? 'fpunch1' : 'fpunch0';
    case 'fkick': return f.t < 9 || f.t >= 17 ? 'fkick0' : 'fkick1';
    case 'special': return f.t < 12 ? 'special0' : 'special1';
    case 'pthrow': return f.t < 7 ? 'special0' : 'special1';
    case 'uppercut': {
      // accroupi, le poing monte, envol de dos ; au sommet il se retourne et redescend de face
      if (f.t < 3) return 'sho0';
      if (f.t < 6) return 'rup1';
      if (f.apexT == null) return f.t < 12 ? 'sbk1' : 'sbk2';
      const dt = f.t - f.apexT;
      return dt < 4 ? 'turnA' : dt < 8 ? 'turnB' : 'upper2';
    }
    case 'land': case 'getup': return 'upper0';
    case 'hit': return 'hit';
    case 'fall': return 'fall';
    case 'down': return 'down';
    case 'win': return 'win';
    case 'parry': return 'parry';
    case 'stunned': return 'stunned';
    case 'held': return 'fall';
    case 'throw':
      if (f.throwType === 'toss') return f.t >= 6 && f.t < 26 ? 'tuck' : 'throw0';
      return f.t < 6 ? 'throw0' : f.t < 22 ? 'throwT' : 'throwS';
  }
  return 'idle0';
}

function threatened(f, o) {
  const dist = Math.abs(o.x - f.x);
  if (ATTACKING.includes(o.state) && dist < 120) return true;
  if (o.fb && Math.sign(o.fb.vx) === Math.sign(f.x - o.fb.x) && Math.abs(o.fb.x - f.x) < 110) return true;
  return false;
}

function spawnFireball(f, big) {
  f.fb = { owner: f, x: f.x + f.dir * (big ? 52 : 40), y: f.y - 56, vx: 3.8 * f.dir, dir: f.dir, t: 0, alive: true, big: !!big, sc: big ? 2 : 1 };
  G.fbs.push(f.fb);
  sfx('fb');
}

function updFighter(f, o) {
  const c = f.ctl, h = c.held;
  const fwd = f.dir > 0 ? h.r : h.l, back = f.dir > 0 ? h.l : h.r;
  f.t++;
  if (f.restT > 0) {   // temps d'arrêt : seul le coup qui termine un enchaînement reste possible
    f.restT--;
    for (const b of ['p', 'k', 's']) if (c.buf[b] > 0 && !(o.state === 'hit' && FINISHERS.includes((f.combo || '') + b))) { c.buf[b] = 0; if (c.q) c.q[b] = 0; }
  }
  if (f.invuln > 0) f.invuln--;
  if (f.flash > 0) f.flash--;
  if (f.counterT > 0) f.counterT--;
  const live = G.fighting;

  switch (f.state) {
    case 'idle': case 'walk': case 'block': case 'crouch': case 'cblock': {
      if ((f.state === 'block' || f.state === 'cblock') && f.bstun > 0) { f.bstun--; f.vx *= .8; break; }
      face(f, o);
      if (!live) { f.vx = 0; if (f.state !== 'idle') setState(f, 'idle'); break; }
      // 4e coup d'un enchaînement Y Y B / B B Y : A = frappe enflammée
      if (comboReady(f, o) && take(c, 's')) { setState(f, 'flame'); f.vx = 0; markFire(f, o, 's'); break; }
      if (take(c, 's')) {
        if (h.u) { setState(f, 'uppercut'); f.vx = 0; f.invuln = 11; f.apexT = null; break; }
        if (back) { setState(f, 'gtatsu'); f.vx = 0; f.spinN = 0; sfx('upper'); break; }   // arrière + A : tornade au sol x4
        if (!f.fb) { setState(f, 'special'); f.vx = 0; f.fired = false; f.chargeT = 0; f.charged = false; break; }
      }
      // Prise après un contre réussi : Y renverse, B projette de l'autre côté
      if (f.counterT > 0 && o.slowT > 0 && Math.abs(o.x - f.x) < 80) {
        if (take(c, 'p')) { doThrow(f, o, 'slam'); break; }
        if (take(c, 'k')) { doThrow(f, o, 'toss'); break; }
      }
      // Contre (X) : fenêtre de parade
      if (c.buf.x > 0 && nearProp(f)) { take(c, 'x'); pickProp(f, nearProp(f)); break; }   // X près d'un objet : on le lance
      if (take(c, 'x')) { setState(f, 'parry'); f.vx = 0; sfx('whoosh'); break; }
      // Saut : stick vers le haut (court délai pour laisser passer haut + A)
      if (h.u) {
        f.jumpQ = (f.jumpQ || 0) + 1;
        if (f.jumpQ >= 4) {
          f.jumpQ = 0;
          setState(f, 'jump'); f.vy = -7.4; f.air = true; f.airAtk = false; f.roll = fwd ? 1 : back ? -1 : 0;
          f.vx = (fwd ? 2.2 : back ? -2.2 : 0) * f.dir; break;
        }
      } else f.jumpQ = 0;
      // Accroupi : coups bas, garde basse avec bas + arrière
      if (h.d) {
        f.vx = 0;
        if (take(c, 'p')) { setState(f, 'rupper'); sfx('upper'); break; }   // accroupi + Y : uppercut montant (anti-aérien)
        if (take(c, 'k')) { setState(f, 'ckick'); sfx('whoosh'); break; }
        const want = back && threatened(f, o) ? 'cblock' : 'crouch';
        if (f.state !== want) { setState(f, want); f.bstun = 0; }
        break;
      }
      // avant + Y : coup de poing du bras proche, plus long · avant + B : coup de pied de l'autre jambe, plus long
      if (take(c, 'p')) { setState(f, fwd ? 'fpunch' : 'punch'); f.vx = 0; sfx('whoosh'); markFire(f, o, 'p'); break; }
      if (take(c, 'k')) { setState(f, fwd ? 'fkick' : 'kick'); f.vx = 0; sfx('whoosh'); markFire(f, o, 'k'); break; }
      if (back && threatened(f, o)) { f.vx = 0; if (f.state !== 'block') { setState(f, 'block'); f.bstun = 0; } break; }
      if (fwd) { f.vx = 1.9 * f.dir; if (f.state !== 'walk') setState(f, 'walk'); }
      else if (back) { f.vx = -1.45 * f.dir; if (f.state !== 'walk') setState(f, 'walk'); }
      else { f.vx = 0; if (f.state !== 'idle') setState(f, 'idle'); }
      break;
    }
    case 'fpunch': if (f.t < 7) f.vx = 1.4 * f.dir; else f.vx = 0;
    // fallthrough
    case 'ckick':
      // enchaînement : on peut relancer un coup de pied bas dès la fin de la frappe
      if (f.t >= 7 && h.d && take(c, 'k')) { setState(f, 'ckick'); sfx('whoosh'); break; }
    // fallthrough
    case 'punch': case 'kick': case 'fkick': case 'cpunch': case 'rupper': case 'flame':
      // combo : dès que le coup touche, on peut enchaîner immédiatement le suivant
      if (f.hasHit && live && ['punch', 'kick', 'fpunch', 'fkick'].includes(f.state) && tryCombo(f, o, c, fwd)) break;
      if (f.t >= ATK[f.state].dur) setState(f, h.d ? 'crouch' : 'idle');
      break;
    case 'gtatsu': {
      const tt = f.t - 6;
      f.vx = tt >= 0 && tt < 48 ? 2.0 * f.dir : 0;
      if (tt >= 0 && tt < 48 && tt % 12 === 0) { f.hasHit = false; sfx('whoosh'); }   // 4 tours = 4 coups
      if (f.t >= 62) setState(f, 'idle');
      break;
    }
    case 'special':
      if (!f.fired) {
        if (h.s && f.t >= 6 && live) {
          // A maintenu : position de charge
          f.chargeT = (f.chargeT || 0) + 1; f.t = Math.min(f.t, 10);
          if (f.chargeT === chargeMax(f)) {   // 2 s (1 s si l'énergie est à 80 % ou moins) : charge maximale
            f.charged = true; G.darkT = 60; G.flashT = 12;
            G.boltX = f.x - f.dir * 14; G.boltY = f.y - 44; sfx('parry');
            addPopup(f.x, f.y - 100, 'MAX!', '#ffd23a');
          }
        } else if (f.t >= 12) { spawnFireball(f, f.charged); f.fired = true; }
      }
      if (f.t >= 40) setState(f, 'idle');
      break;
    case 'uppercut':
      // trajectoire en courbe : d'abord vers l'avant, puis de plus en plus vers le haut
      if (f.t === 0) f.apexT = null;
      if (f.t === 5) { f.air = true; sfx('upper'); }
      if (f.t >= 5 && f.t <= 10) { f.vx = 4.2 * f.dir; f.vy = [-0.8, -1.4, -2.2, -3.3, -4.8, -6.6][f.t - 5]; }
      else if (f.t === 11) { f.vy = -7.7; f.vx = 2.4 * f.dir; }
      else if (f.t > 11 && f.vy < 0) f.vx *= .86;
      if (f.t > 11 && f.vy >= 0 && f.apexT == null) f.apexT = f.t;
      break;
    case 'jump':
      if (!f.airAtk && live) {
        if (take(c, 'p')) { setState(f, 'jpunch'); f.airAtk = true; sfx('whoosh'); }
        else if (take(c, 'k')) { setState(f, 'jkick'); f.airAtk = true; sfx('whoosh'); }
        else if (take(c, 's')) {
          // Coup de pied tournoyant aérien
          setState(f, 'tatsu'); f.airAtk = true;
          f.vy = Math.min(f.vy, -1.5); f.vx = 2.7 * f.dir; sfx('upper');
        }
      }
      break;
    case 'tatsu':
      f.vy -= GRAV * 0.45; // plane un peu pendant la rotation
      if (f.t % 8 === 4) sfx('whoosh');
      break;
    case 'land': if (f.t >= f.landT) setState(f, 'idle'); break;
    case 'hit':
      // on peut parer le tour suivant d'une tornade même après avoir encaissé le premier
      if (o.state === 'gtatsu' && take(c, 'x')) { setState(f, 'parry'); f.vx = 0; break; }
      f.vx *= .82; if (f.t >= f.stun) setState(f, 'idle'); break;
    case 'down':
      f.vx *= .8;
      if (!f.ko && f.t >= 40) { setState(f, 'getup'); f.invuln = 22; }
      break;
    case 'getup':
      if (f.t >= 16) {
        // plus de la moitié de l'énergie perdue : se relève étourdi 4 secondes
        if (f.hp <= 50 && G.frame - (f.dizzyEnd || -9999) > 480) { setState(f, 'stunned'); f.stun = 240; f.dizzy = true; f.mash = 0; f.mashShow = 0; }
        else setState(f, 'idle');
      }
      break;
    case 'parry': f.vx = 0; if (f.t >= 22) setState(f, 'idle'); break;
    case 'stunned':
      f.vx *= .8;
      if (f.dizzy) {
        // marteler les boutons pour sortir plus vite de l'étourdissement
        let n = 0;
        if (f.cpu) { if (Math.random() < [.05, .12, .22][OPT.diff]) n = 1; }
        else for (const b of [...BTNS, 'l', 'r', 'u', 'd']) if (edge(c, b)) n++;
        if (n) { f.t += 9 * n; f.mash += n; f.mashShow = 40; }
        if (f.mashShow > 0) f.mashShow--;
      }
      if (f.t >= f.stun) { setState(f, 'idle'); if (f.dizzy) { f.dizzy = false; f.dizzyEnd = G.frame; } }
      break;
    case 'throw': f.vx = 0; updThrow(f); if (f.t >= 38) { f.rotAng = null; f.victim = null; setState(f, 'idle'); } break;
    case 'held': return;   // positionné par le lanceur
    case 'pthrow': f.vx = 0; if (f.t === 7) launchProp(f, o); if (f.t >= 22) setState(f, 'idle'); break;
  }

  // Physique
  if (f.air) {
    f.vy += GRAV; f.x += f.vx; f.y += f.vy;
    if (f.y >= GROUND) {
      f.y = GROUND; f.vy = 0; f.air = false;
      if (f.state === 'fall') { setState(f, 'down'); G.shake = Math.max(G.shake, 3); sfx('thud'); }
      else if (f.state === 'uppercut') { setState(f, 'land'); f.landT = 14; }
      else if (f.state === 'tatsu') { setState(f, 'land'); f.landT = 10; }
      else if (['jump', 'jpunch', 'jkick'].includes(f.state)) { setState(f, 'land'); f.landT = 4; }
      f.vx = 0;
    }
  } else {
    f.x += f.vx;
  }
  f.x = Math.max(18, Math.min(SW - 18, f.x));

  // Barre de vie « traînante »
  if (f.lag > f.hp) { if (f.lagT > 0) f.lagT--; else f.lag = Math.max(f.hp, f.lag - .6); }
}

function hurtbox(f) {
  if (f.invuln > 0 || ['fall', 'down', 'getup', 'held'].includes(f.state)) return null;
  if (f.air) return [f.x - 13, f.y - 81, f.x + 13, f.y - 17];
  if (f.state === 'land' || f.state === 'uppercut') return [f.x - 14, f.y - 67, f.x + 14, f.y];
  if (['crouch', 'cblock', 'cpunch', 'ckick'].includes(f.state)) return [f.x - 15, f.y - 56, f.x + 15, f.y];
  return [f.x - 14, f.y - 84, f.x + 14, f.y];
}
function atkBox(f) {
  const a = ATK[f.state];
  if (!a || f.hasHit) return null;
  if (f.t < a.act[0] || f.t >= a.act[1]) return null;
  if (['jpunch', 'jkick', 'uppercut', 'tatsu'].includes(f.state) && !f.air) return null;
  const [x0, y0, x1, y1] = a.box;
  return f.dir > 0 ? [f.x + x0, f.y + y0, f.x + x1, f.y + y1] : [f.x - x1, f.y + y0, f.x - x0, f.y + y1];
}
const overlap = (a, b) => a && b && a[0] < b[2] && a[2] > b[0] && a[1] < b[3] && a[3] > b[1];

function isBlocking(d, fromX, data) {
  if (data.unblock) return false;
  if (d.air || !NEUTRAL.includes(d.state)) return false;
  const h = d.ctl.held;
  if (!(fromX < d.x ? h.r : h.l)) return false;
  if (data.low && !h.d) return false;   // balayage : garde basse obligatoire
  if (data.high && h.d) return false;   // attaque sautée : garde debout obligatoire
  return true;
}

// Prises après un contre :
//  'toss' (B) : on attrape, roulade arrière, l'adversaire est propulsé à l'opposé de l'écran
//  'slam' (Y) : l'adversaire passe par-dessus nous en tournant et retombe juste de l'autre côté
const FINISHERS = ['ppkk', 'kkpp', 'ppks', 'kkps'];
function comboReady(f, o) {
  return o.state === 'hit' && G.frame - (f.comboLast || -999) < 50 && (f.combo === 'ppk' || f.combo === 'kkp');
}
// Le 4e coup d'un enchaînement est en feu (bleu Kaito, rouge Sora)
function markFire(f, o, kind) {
  const live = o.state === 'hit' && G.frame - (f.comboLast || -999) < 50;
  f.fireState = live && FINISHERS.includes((f.combo || '') + kind) ? f.state : null;
  if (f.fireState) sfx('fb');
}
function tryCombo(f, o, c, fwd) {
  // le bouton appuyé en premier passe en premier
  const order = ['s', 'p', 'k'].filter(b => c.buf[b] > 0 && (b !== 's' || comboReady(f, o))).sort((x, y) => (c.ord || {})[x] - (c.ord || {})[y]);
  const b = order[0]; if (!b) return false;
  take(c, b);
  if (b === 's') { setState(f, 'flame'); f.vx = 0; markFire(f, o, 's'); return true; }
  if (b === 'p') { setState(f, fwd ? 'fpunch' : 'punch'); f.vx = 0; sfx('whoosh'); markFire(f, o, 'p'); return true; }
  setState(f, fwd ? 'fkick' : 'kick'); f.vx = 0; sfx('whoosh'); markFire(f, o, 'k'); return true;
}
function doThrow(f, o, type) {
  setState(f, 'throw'); f.throwType = type; f.vx = 0; f.vy = 0; f.counterT = 0; f.victim = o;
  f.gx = f.x; f.gy = f.y;
  setState(o, 'held'); o.air = false; o.vx = o.vy = 0; o.slowT = 0; o.flash = 3; o.invuln = 0;
  G.freeze = 6; sfx('whoosh');
  addPopup(f.x, f.y - 100, 'THROW!', '#ff7a3a');
}
function updThrow(f) {
  const o = f.victim; if (!o) return;
  const d = f.dir, t = f.t, T0 = 6, T1 = 26;
  const k = Math.max(0, Math.min(1, (t - T0) / (T1 - T0)));
  if (f.throwType === 'toss') {
    // roulade arrière du lanceur
    f.rotAng = t >= T0 && t < T1 ? -d * k * Math.PI * 2 : null;
    if (t >= T0 && t < T1) f.x = f.gx - d * 14 * k;
    // la victime passe au-dessus, d'avant en arrière
    const phi = k * Math.PI;
    o.x = f.x + d * Math.cos(phi) * 30; o.y = f.y - 6 - Math.sin(phi) * 34;
    o.rotAng = -d * phi; o.dir = d === 1 ? -1 : 1;
    if (t === T1) {
      setState(o, 'fall'); o.air = true; o.vx = -d * 5.6; o.vy = -4.5; o.rotAng = null;
      o.hp = Math.max(0, o.hp - dmgK(13)); o.lagT = 32; o.flash = 3;
      G.shake = 6; sfx('heavy');
    }
  } else {
    // renversement : la victime fait un demi-tour complet autour de nous
    const phi = k * Math.PI;
    o.x = f.x + d * Math.cos(phi) * 24; o.y = f.y - 8 - Math.sin(phi) * 44;
    o.rotAng = -d * phi * 1.15; o.dir = d === 1 ? -1 : 1;
    if (t === T1) {
      setState(o, 'fall'); o.air = true; o.vx = -d * 1.2; o.vy = 2.5; o.rotAng = null;
      o.hp = Math.max(0, o.hp - dmgK(15)); o.lagT = 32; o.flash = 3;
      G.shake = 9; sfx('heavy');
    }
  }
  if (t > T1) f.victim = null;
}
/* ---------- Objets du décor : chaise et vases (cassables, lançables avec X) ---------- */
const PROP_HIT = { dmg: 9, knock: true, stun: 22, bstun: 16, push: 3.6, chip: 0, sfx: 'heavy', unblock: true };
const PROP_DIM = { chair: [30, 46], vase: [12, 22], tallvase: [14, 30], crate: [22, 20], pot: [18, 30], bottle: [9, 24], cone: [22, 31], trash: [27, 38] };
function makeProps() {
  const X = f => Math.round(SW * f);
  const list = G.stage === 'city'
    ? [['trash', X(.05), 0], ['bottle', X(.12), 0], ['cone', X(.2), 0], ['bottle', X(.8), 0], ['cone', X(.88), 0], ['trash', X(.95), 0]]
    : [['crate', X(.05), 0], ['vase', X(.12), 0], ['chair', X(.2), 0], ['pot', X(.8), 0], ['tallvase', X(.88), 1], ['crate', X(.95), 0]];
  return list
    .map(([type, x, v]) => ({ type, x, y: GROUND, v, alive: true, held: null, fly: null }));
}
const propBox = p => { const [w, h] = PROP_DIM[p.type]; return [p.x - w / 2, p.y - h, p.x + w / 2, p.y]; };
function nearProp(f) { return (G.props || []).find(p => p.alive && !p.held && !p.fly && Math.abs(p.x - f.x) < 24); }
function pickProp(f, p) { p.held = f; setState(f, 'pthrow'); f.vx = 0; sfx('whoosh'); }
function launchProp(f, o) {
  const p = (G.props || []).find(q => q.held === f); if (!p) return;
  p.held = null; p.x = f.x + f.dir * 18; p.y = f.y - 58;
  aimProp(p, f, o);
  sfx('whoosh');
}
const PGRAV = .28;
// trajectoire en cloche (gravité) qui finit toujours sur la cible
function aimProp(p, owner, target) {
  const d = Math.abs(target.x - p.x);
  const T = Math.max(26, Math.min(56, d / 5.5 + 14));
  p.fly = { owner, target, T, t: 0, rot: (p.fly && p.fly.rot) || 0, vx: 0, vy: 0, spin: Math.sign(target.x - p.x) || 1 };
  const ty = target.y - 46;
  p.fly.vx = (target.x - p.x) / T; p.fly.vy = (ty - p.y) / T - .5 * PGRAV * T;
}
function breakProp(p, x = p.x, y = p.y - 10) {
  if (!p.alive) return;
  p.alive = false; p.held = null; p.fly = null;
  const cols = p.type === 'bottle' ? ['#2a7a2a', '#5ac85a', '#1a4a1a', '#c8f0c8'] : p.type === 'cone' ? ['#ff6a1a', '#ffffff', '#c84a0a'] : p.type === 'trash' ? ['#7a7a88', '#a8a8b8', '#4a4a56', '#3a6a2a'] : p.type === 'chair' || p.type === 'crate' ? ['#8a5a30', '#6a4020', '#b07a44'] : p.type === 'pot' ? ['#b8642e', '#3e7a2a', '#7a3a18', '#5c9a3a'] : VASE_COLS[p.v];
  for (let i = 0; i < 14; i++) G.shards.push({ x: x + (Math.random() - .5) * 10, y: y + (Math.random() - .5) * 10,
    vx: (Math.random() - .5) * 5, vy: -1.5 - Math.random() * 3.5, col: cols[i % cols.length], s: 1 + (Math.random() * 3 | 0), t: 0 });
  sfx('crash'); G.shake = Math.max(G.shake, 2);
}
function rawAtkBox(f) {
  const a = ATK[f.state]; if (!a || f.t < a.act[0] || f.t >= a.act[1]) return null;
  const [x0, y0, x1, y1] = a.box;
  return f.dir > 0 ? [f.x + x0, f.y + y0, f.x + x1, f.y + y1] : [f.x - x1, f.y + y0, f.x - x0, f.y + y1];
}
function updProps() {
  for (const p of G.props || []) {
    if (!p.alive) continue;
    if (p.held) { p.x = p.held.x + p.held.dir * 6; p.y = p.held.y - 78; if (p.held.state !== 'pthrow') breakProp(p); continue; }
    if (p.fly) {
      // l'objet file vers l'adversaire, où qu'il soit (même en l'air)
      const F = p.fly, o = F.target, tx = o.x, ty = o.y - 46;
      // courbe avec gravité, corrigée à chaque image pour suivre la cible (même en l'air)
      const left = Math.max(1, F.T - F.t);
      F.vx = (tx - p.x) / left;
      F.vy += PGRAV; const vyNeed = (ty - p.y) / left - .5 * PGRAV * left;
      F.vy += (vyNeed - F.vy) * (left < 8 ? 1 : .15);
      p.x += F.vx; p.y += F.vy; F.rot += .3 * F.spin; F.t++;
      const d = Math.hypot(tx - p.x, ty - p.y);
      // renvoi : X au bon moment quand l'objet arrive
      if (d < 70 && !F.deflected) {
        const canX = NEUTRAL.includes(o.state) || o.state === 'parry';
        if (o.cpu && !F.aiTried && d < 55) { F.aiTried = true; if (Math.random() < [.1, .25, .45][OPT.diff]) o.ctl.buf.x = 8; }
        if (canX && (o.ctl.buf.x > 0 || (o.state === 'parry' && o.t <= 12)) && d < 60) {
          take(o.ctl, 'x'); setState(o, 'parry'); o.vx = 0;
          G.darkT = 14; G.flashT = 12; G.boltX = p.x; G.boltY = p.y; G.slowAll = 30; G.shake = 3;
          addPopup(o.x, o.y - 100, 'REFLECT!', '#7af0ff'); sfx('parry');
          const back = F.owner; aimProp(p, o, back); p.fly.deflected = false; p.fly.lastBy = o;
          continue;
        }
      }
      if (d < 16 || F.t >= F.T + 20) {
        breakProp(p, p.x, p.y);
        if (hurtbox(o)) applyHit(F.owner, o, PROP_HIT, p.x, p.y, F.owner.x, true);
      }
      continue;
    }
    const box = propBox(p);
    for (const f of G.f) {
      const ab = rawAtkBox(f);
      if (ab && ab[0] < box[2] && ab[2] > box[0]) { breakProp(p); break; }           // frappé
      if ((f.state === 'fall' || (f.state === 'down' && f.t < 6)) && Math.abs(f.x - p.x) < 24) { breakProp(p); break; }   // on tombe dessus
    }
  }
  for (const s of G.shards || []) {
    s.t++; s.vy += .3; s.x += s.vx; s.y += s.vy;
    if (s.y > GROUND + 2) { s.y = GROUND + 2; s.vy *= -.35; s.vx *= .6; }
  }
  if (G.shards) G.shards = G.shards.filter(s => s.t < 55);
}
const VASE_COLS = [['#2e5a9a', '#e8eef6', '#1e3a6a'], ['#b8261c', '#e8c070', '#7a140e'], ['#2a7a5a', '#d8e8d0', '#1a4a36']];
// Palettes 5 tons : [contour, ombre, moyen, clair, reflet]
const PP = {
  wood:  ['#2a1608', '#5a3418', '#8a5a30', '#b07a44', '#d8a468'],
  woodL: ['#3a2010', '#6a4220', '#9a6a38', '#c08a50', '#e6b47a'],
  blue:  ['#0c1630', '#1e3a6a', '#2e5a9a', '#5a8ad0', '#c8dcf4'],
  red:   ['#3a0806', '#7a140e', '#b8261c', '#e0503a', '#ffb090'],
  green: ['#0a2a1c', '#1a4a36', '#2a7a5a', '#4aa880', '#c0ecd4'],
  white: ['#5a6070', '#a0a8b8', '#d8dee8', '#f4f6fa', '#ffffff'],
  gold:  ['#4a3006', '#8a6014', '#c8a030', '#e8c860', '#fff0b0'],
  terra: ['#3a1406', '#7a3a18', '#b8642e', '#d88a4a', '#f4b880'],
  leaf:  ['#0e2a0e', '#1e4a1a', '#3e7a2a', '#5c9a3a', '#9ad06a'],
  glass: ['#062a0a', '#0e4a16', '#1e7a28', '#3aa848', '#c8f4c8'],
  cone:  ['#5a1a04', '#a8380a', '#e85a14', '#ff8a3a', '#ffd0a0'],
  metal: ['#24242c', '#4a4a56', '#7a7a88', '#a8a8b8', '#e0e0ec'],
};
function drawProp(p, x, y) {
  const F = (px, py, w, h, c) => R(x + px, y + py, w, h, c);
  // ligne horizontale d'un volume cylindrique éclairé par la gauche
  const cylRow = (py, w, pal) => {
    for (let px = -w; px <= w; px++) {
      const t = (px + w) / (2 * w || 1);
      const c = Math.abs(px) === w ? pal[0] : t < .16 ? pal[2] : t < .34 ? pal[3] : t < .4 ? pal[4] : t < .62 ? pal[2] : t < .84 ? pal[1] : pal[0];
      F(px, py, 1, 1, c);
    }
  };
  const box = (x0, y0, w, h, pal) => {   // planche/pièce de bois avec relief
    F(x0, y0, w, h, pal[2]); F(x0, y0, w, 1, pal[3]); F(x0, y0, 1, h, pal[3]);
    F(x0, y0 + h - 1, w, 1, pal[1]); F(x0 + w - 1, y0, 1, h, pal[1]);
  };
  const T = p.type;
  if (T === 'chair') {
    const P = PP.wood, L = PP.woodL;
    box(10, -46, 3, 46, P); F(10, -46, 3, 46, P[1]); F(11, -46, 1, 46, P[2]);          // montant arrière droit (dans l'ombre)
    box(-13, -46, 3, 46, L);                                                             // montant arrière gauche
    box(-13, -47, 26, 5, L); F(-12, -47, 24, 1, L[4]); F(-13, -43, 26, 1, P[0]);        // haut du dossier
    for (const yy of [-38, -32, -26]) { box(-10, yy, 20, 2, L); F(-10, yy + 2, 20, 1, P[0]); }   // barreaux + ombre portée
    F(-16, -22, 32, 3, L[3]); F(-16, -22, 32, 1, L[4]);                                  // dessus de l'assise
    F(-16, -19, 32, 3, P[2]); F(-16, -17, 32, 1, P[1]); F(-16, -16, 32, 1, P[0]);        // tranche avant
    F(-14, -15, 28, 2, 'rgba(0,0,0,.35)');                                               // ombre sous l'assise
    box(-15, -16, 3, 16, L); box(12, -16, 3, 16, P); F(13, -16, 1, 16, P[1]);           // pieds avant
    F(-12, -7, 24, 2, P[1]); F(-12, -7, 24, 1, P[2]);                                    // traverse
  } else if (T === 'crate') {
    const P = PP.woodL, D = PP.wood;
    // dessus (vue légèrement plongeante) et côté droit dans l'ombre
    F(-11, -24, 22, 4, P[3]); F(-9, -25, 22, 1, P[4]); F(-11, -24, 1, 4, P[2]);
    for (let i = 0; i < 4; i++) F(11 + (i > 1 ? 1 : 0), -24 + i, 2, 24 - i, D[1]);
    F(13, -22, 1, 22, D[0]);
    F(-11, -20, 22, 20, P[2]);
    for (const yy of [-20, -13, -6]) { F(-11, yy, 22, 1, P[3]); F(-11, yy + 6, 22, 1, D[1]); }   // 3 planches
    F(-11, -20, 2, 20, D[2]); F(9, -20, 2, 20, D[1]); F(-11, -20, 1, 20, P[4]);
    for (let i = 0; i < 16; i++) { F(-8 + i, -19 + i, 2, 1, D[1]); F(-8 + i, -18 + i, 2, 1, D[0]); }   // traverse diagonale
    for (const [nx, ny] of [[-10, -19], [8, -19], [-10, -2], [8, -2]]) F(nx, ny, 1, 1, '#c8c8d0');      // clous
    F(-11, -1, 24, 1, D[0]);
  } else if (T === 'pot') {
    const P = PP.terra, G2 = PP.leaf;
    // feuillage en dégradé (arrière sombre, avant clair)
    const leaf = (x0, y0, dx, n, pal) => { for (let i = 0; i < n; i++) { const xx = x0 + Math.round(dx * i); F(xx, y0 - i, 2, 1, i < n / 3 ? pal[1] : i < n * .75 ? pal[2] : pal[3]); F(xx + 1, y0 - i, 1, 1, pal[0]); } };
    leaf(-1, -14, -.9, 15, G2); leaf(1, -14, .9, 16, G2); leaf(-2, -14, -1.6, 10, G2); leaf(2, -14, 1.5, 11, G2);
    leaf(0, -14, -.3, 18, G2); leaf(0, -14, .35, 17, G2);
    for (let i = 0; i < 5; i++) F(-3 + i, -16 - (i % 2) * 3, 1, 1, G2[4]);
    F(-9, -15, 18, 3, P[3]); F(-9, -15, 18, 1, P[4]); F(-9, -13, 18, 1, P[1]); F(-9, -15, 1, 3, P[0]); F(8, -15, 1, 3, P[0]);   // rebord
    F(-6, -14, 12, 1, '#2a1406');                                                         // terre
    for (let r = 0; r < 12; r++) cylRow(-12 + r, 7 - Math.round(r / 6), P);
    F(-5, -1, 10, 1, P[0]);
  } else if (T === 'bottle') {
    const P = PP.glass, h = 24;
    F(-1, -24, 3, 2, '#e0c040'); F(-1, -24, 3, 1, '#fff0a0'); F(1, -23, 1, 1, '#8a6a10');   // capsule
    for (let r = 0; r < 6; r++) cylRow(-22 + r, 1, P);                                    // goulot
    for (let r = 0; r < 3; r++) cylRow(-16 + r, 2 + r, P);                                // épaule
    for (let r = 0; r < 13; r++) cylRow(-13 + r, 4, P);                                   // corps
    for (let r = 0; r < 5; r++) { const yy = -10 + r; for (let px = -4; px <= 4; px++) F(px, yy, 1, 1, Math.abs(px) === 4 ? '#6a5a30' : px < -1 ? '#fff4c8' : px < 2 ? '#e8d8a0' : '#b8a670'); }   // étiquette
    F(-2, -9, 4, 2, '#b8261c'); F(-2, -9, 4, 1, '#e04a3a');
    F(-3, -1, 7, 1, P[0]);
  } else if (T === 'cone') {
    const P = PP.cone, W5 = PP.white;
    F(-11, -4, 22, 4, '#1a1a20'); F(-11, -4, 22, 1, '#4a4a56'); F(-11, -4, 1, 4, '#3a3a44'); F(10, -4, 1, 4, '#0a0a0e');   // socle
    for (let r = 0; r < 26; r++) {
      const w = 1 + Math.round(r * 7.5 / 26), stripe = (r > 8 && r < 13) || (r > 17 && r < 21);
      cylRow(-30 + r, w, stripe ? W5 : P);
    }
    F(-1, -31, 3, 1, P[1]);
  } else if (T === 'trash') {
    const P = PP.metal;
    for (let r = 0; r < 30; r++) cylRow(-30 + r, 12 - (r < 2 ? 0 : Math.round(r / 15)), P);
    for (const xx of [-7, -2, 3, 8]) for (let r = 0; r < 26; r++) F(xx, -27 + r, 1, 1, P[1]);   // nervures
    F(-12, -16, 25, 1, P[1]); F(-12, -15, 25, 1, P[4]);                                   // cerclage
    F(-13, -34, 27, 4, P[3]); F(-13, -34, 27, 1, P[4]); F(-13, -31, 27, 1, P[0]); F(-13, -34, 1, 4, P[1]); F(13, -34, 1, 4, P[0]);   // couvercle
    F(-4, -36, 9, 2, P[2]); F(-4, -36, 9, 1, P[4]); F(-4, -35, 1, 1, P[0]); F(4, -35, 1, 1, P[0]);   // poignée
    F(-9, -38, 5, 5, '#2a5a1a'); F(-8, -38, 2, 2, '#4a8a2a'); F(-9, -34, 5, 1, '#123a0a');       // sac poubelle qui dépasse
    F(-12, -1, 25, 1, P[0]);
  } else {
    const pal = [PP.blue, PP.red, PP.green][p.v] || PP.blue, tall = T === 'tallvase', h = tall ? 30 : 22;
    for (let r = 0; r < h; r++) {
      const t = r / h;
      const wv = tall ? (t < .1 ? 3 : t < .22 ? 2 : Math.round(2 + Math.sin((t - .22) / .78 * Math.PI) * 5.5))
                      : (t < .1 ? 3 : t < .2 ? 2 : Math.round(2 + Math.sin((t - .2) / .8 * Math.PI) * 4.8));
      const band = (r % 10 === 5 || r % 10 === 6) && t > .25;
      cylRow(-h + r, wv, band ? PP.gold : pal);
    }
    F(-3, -h, 7, 1, pal[0]); F(-2, -h + 1, 5, 1, '#0a0a10');   // ouverture
    F(-3, -1, 7, 1, pal[0]);
  }
}
function drawProps() {
  for (const p of G.props || []) {
    if (!p.alive) continue;
    if (p.fly) {
      ctx.save(); ctx.translate(Math.round(p.x), Math.round(p.y)); ctx.rotate(p.fly.rot);
      drawProp(p, 0, PROP_DIM[p.type][1] / 2); ctx.restore();
    } else {
      if (!p.held) R(p.x - PROP_DIM[p.type][0] / 2 - 1, p.y, PROP_DIM[p.type][0] + 2, 1, 'rgba(40,20,8,.45)');
      drawProp(p, Math.round(p.x), Math.round(p.y));
    }
  }
}
function drawShards() {
  for (const s of G.shards || []) {
    if (s.t > 40 && (s.t >> 1) % 2) continue;   // clignote avant de disparaître
    R(s.x, s.y, s.s, s.s, s.col);
  }
}
// Sang : gouttes projetées qui tachent le sol (désactivable dans les options)
function spawnBlood(x, y, away, dmg) {
  if (!OPT.blood) return;
  const n = 5 + Math.min(10, dmg | 0);
  for (let i = 0; i < n; i++) G.blood.push({ x, y: y + (Math.random() - .5) * 8, vx: away * (.8 + Math.random() * 2.6) + (Math.random() - .5),
    vy: -1.2 - Math.random() * 2.6, s: Math.random() < .3 ? 2 : 1, gy: GROUND - 3 + Math.random() * 9, t: 0 });
}
function updBlood() {
  for (const d of G.blood) {
    d.t++; d.vy += .28; d.x += d.vx; d.y += d.vy;
    if (d.y >= d.gy) { d.dead = true; if (G.stains.length < 160) G.stains.push({ x: d.x, y: d.gy, w: 1 + (Math.random() * 3 | 0) + d.s, a: 1 }); }
  }
  G.blood = G.blood.filter(d => !d.dead);
}
function drawStains() { for (const s of G.stains || []) { R(s.x - s.w / 2, s.y, s.w, 1, '#6a0a0a'); if (s.w > 2) R(s.x - s.w / 2 + 1, s.y - 1, s.w - 2, 1, '#8a1010'); } }
function drawBlood() { for (const d of G.blood || []) R(d.x, d.y, d.s + 1, d.s, d.s > 1 ? '#a01010' : '#c81818'); }
function addPopup(x, y, txt, col) { G.popups.push({ x, y, txt, col, t: 0 }); }

const CLASH_HIT = { dmg: 14, knock: true, stun: 24, bstun: 20, push: 5.5, chip: 0, sfx: 'heavy' };
function startClash(f, o) {
  G.clash = { f: [f, o], g: [0, 0], t: 0 };
  [f, o].forEach(x => { setState(x, 'parry'); x.vx = 0; x.slowT = 0; x.counterT = 0; x.mashShow = 0; });
  G.darkT = 50; G.flashT = 12; G.boltX = (f.x + o.x) / 2; G.boltY = f.y - 60; G.shake = 4;
  addPopup((f.x + o.x) / 2, f.y - 108, 'CLASH! MASH!', '#ffd23a'); sfx('parry');
}
function stepClash() {
  const C = G.clash; C.t++; G.darkT = 50;
  C.f.forEach((f, i) => {
    f.t = Math.min(f.t, 8);   // reste figé en garde, au ralenti
    if (f.cpu) { if (Math.random() < [.075, .11, .155][OPT.diff]) C.g[i] += 6; }
    else for (const b of BTNS) if (edge(f.ctl, b)) { C.g[i] += 6; break; }
  });
  if (G.flashT > 0) G.flashT--;
  const win = C.g[0] >= 100 ? 0 : C.g[1] >= 100 ? 1 : C.t > 300 ? (C.g[0] >= C.g[1] ? 0 : 1) : -1;
  if (win < 0) return;
  const w = C.f[win], l = C.f[1 - win];
  G.clash = null; G.darkT = 20;
  setState(w, 'special'); w.fired = true; w.chargeT = 0; w.charged = false; w.t = 12;
  setState(l, 'idle'); l.invuln = 0;
  const sx = l.x - w.dir * 10, sy = l.y - 60;
  addSpark(sx, sy, 'fb', w.def.fb); G.flashT = 12; G.boltX = sx; G.boltY = sy;
  applyHit(w, l, CLASH_HIT, sx, sy, w.x, true);
  addPopup(w.x, w.y - 100, 'CLASH WIN!', '#ffd23a');
}
function applyHit(att, def, data, sx, sy, fromX, projectile) {
  // coups de pied bas enchaînés : le 3e qui touche d'affilée fait tomber l'adversaire
  if (att.state === 'ckick' && !projectile && !(def.state === 'parry' && def.t <= 12) && !isBlocking(def, fromX, data)) {
    att.ckN = G.frame - (att.ckLast || -999) < 40 ? (att.ckN || 0) + 1 : 1;
    att.ckLast = G.frame;
    if (att.ckN >= 3) { data = Object.assign({}, data, { knock: true, dmg: 7 }); att.ckN = 0; }
  }
  // Contre réussi : l'attaquant est bloqué une demi-seconde
  if (def.state === 'parry' && def.t <= 12) {
    G.freeze = 10; addSpark(sx, sy, 'parry'); sfx('parry');
    if (projectile) return;
    // l'adversaire passe au ralenti pendant une seconde, éclair + fond assombri
    att.hasHit = true; att.slowT = 60;
    setState(def, 'idle'); def.counterT = 60; def.vx = 0;
    G.flashT = 12; G.darkT = 60; G.boltX = sx; G.boltY = sy;
    addPopup(def.x, def.y - 100, 'COUNTER!', '#7af0ff');
    return;
  }
  const away = fromX < def.x ? 1 : -1;
  if (isBlocking(def, fromX, data)) {
    setState(def, def.ctl.held.d ? 'cblock' : 'block'); def.bstun = data.bstun; def.vx = away * data.push;
    const chip = projectile ? data.chip : (data.knock ? 1 : 0);
    if (chip) { def.hp = Math.max(1, def.hp - dmgK(chip)); def.lagT = 30; }
    G.freeze = 5; addSpark(sx, sy, 'block'); sfx('block');
    return;
  }
  // enchaînements : on mémorise la suite des coups qui touchent pendant que l'adversaire est sonné
  let finisher = false;
  const kind = { punch: 'p', fpunch: 'p', kick: 'k', fkick: 'k', flame: 's' }[att.state];
  if (kind && !projectile) {
    att.combo = (def.state === 'hit' && G.frame - (att.comboLast || -999) < 50 ? (att.combo || '') : '') + kind;
    att.comboLast = G.frame;
    if (FINISHERS.includes(att.combo)) { finisher = true; att.combo = ''; data = Object.assign({}, data, { knock: true, dmg: data.dmg + 8 }); }
    else if (att.combo.length >= 4) att.combo = att.combo.slice(-3);
  }
  // 3 coups d'affilée max, puis petit temps d'arrêt (sauf pour finir un enchaînement de la liste)
  if (!projectile && att.state !== 'gtatsu' && att.state !== 'ckick') {
    att.run = def.state === 'hit' && G.frame - (att.runLast || -999) < 50 ? (att.run || 0) + 1 : 1;
    att.runLast = G.frame;
    if (finisher) { att.run = 0; att.restT = 0; }
    else if (att.run >= 3) { att.restT = 30; att.run = 0; }
  }
  if (att.state === 'gtatsu' && !projectile) {
    att.spinN = def.state === 'hit' ? (att.spinN || 0) + 1 : 1;
    if (att.spinN >= 4) { data = Object.assign({}, data, { knock: true, dmg: 7 }); att.spinN = 0; }
  }
  def.hp = Math.max(0, def.hp - dmgK(data.dmg)); def.lagT = 32;
  spawnBlood(sx, sy, away, data.dmg);
  def.flash = 3;
  if (def.air || data.knock || def.hp <= 0) {
    setState(def, 'fall'); def.air = true; def.vy = -4.8; def.vx = away * 2.3;
    if (def.fb && def.state !== 'special') {}
  } else {
    setState(def, 'hit'); def.stun = data.stun; def.vx = away * data.push * (att.combo && att.combo.length >= 1 && !projectile ? .45 : 1);
  }
  G.freeze = 8; G.shake = 4;
  addSpark(sx, sy, projectile ? 'fb' : 'hit', projectile ? att.def.fb : null);
  sfx(data.sfx);
  if (finisher) {
    // enchaînement réussi : l'adversaire s'enflamme et tombe au ralenti
    def.burn = 120; def.burnPal = att.def.fb; def.slowT = 60;
    G.darkT = 60; G.flashT = 12; G.boltX = sx; G.boltY = sy; G.freeze = 10; G.shake = 7;
    addPopup(def.x, def.y - 100, 'COMBO FINISH!', '#ffd23a');
    sfx('fb');
  }
}

function addSpark(x, y, type, pal) { G.sparks.push({ x, y, t: 0, type, pal }); }

/* ---------------- IA du CPU ---------------- */
function press(a, b, up) { a.press = b; a.pressU = !!up; a.pressFrames = 2; }
function lowAttack(a, b) { a.hold = { d: true }; a.holdT = 10; press(a, b); }
function aiInput(f, o) {
  const dk = [.45, 1, 1.7][OPT.diff], rnd = () => Math.random() / dk;   // difficulté : réactions plus ou moins fréquentes
  const a = f.ai, held = {};
  const dx = o.x - f.x, dist = Math.abs(dx), fwd = dx > 0 ? 'r' : 'l', back = dx > 0 ? 'l' : 'r';
  if (a.holdT > 0) { a.holdT--; Object.assign(held, a.hold); }
  if (a.press) {
    held[a.press] = true; if (a.pressU) held.u = true;
    if (--a.pressFrames <= 0) { a.press = null; a.pressU = false; }
  }
  if (!G.fighting) return held;
  // contré : tente de contrer le contre (X) selon la difficulté
  if (f.slowT > 38 && o.counterT > 0) { if (!a.clashTried) { a.clashTried = true; if (Math.random() < [.15, .35, .6][OPT.diff]) press(a, 'x'); } }
  else if (!f.slowT) a.clashTried = false;
  const neutral = NEUTRAL.includes(f.state);
  if (f.state === 'jump' && !f.airAtk && !a.press) {
    if (dist < 120 && f.vy > -3 && rnd() < .06) press(a, 's');
    else if (dist < 70 && rnd() < .12) press(a, 'k');
  }
  const fb = o.fb;

  if (neutral && fb && Math.sign(fb.vx) === Math.sign(f.x - fb.x) && Math.abs(fb.x - f.x) < 120 && !a.reacted) {
    a.reacted = true;
    const r = Math.random();
    if (r < .35) { a.hold = { u: true, [fwd]: true }; a.holdT = 6; }
    else if (r < .82) { a.hold = { [back]: true }; a.holdT = 55; }
    else if (!f.fb) press(a, 's');
  }
  if (!fb) a.reacted = false;
  if (neutral && o.air && dist < 90 && o.vy > -2 && rnd() < .05) lowAttack(a, 'p');
  if (neutral && o.air && dist < 80 && o.vy > -1.5 && rnd() < .08) press(a, 's', true);
  if (neutral && ['punch', 'kick', 'cpunch'].includes(o.state) && o.t < 5 && dist < 95 && rnd() < .12) { a.hold = { [back]: true }; a.holdT = 22; }
  if (neutral && ['punch', 'kick', 'cpunch'].includes(o.state) && o.t < 3 && dist < 95 && rnd() < .07) press(a, 'x');
  if (['punch', 'kick', 'fpunch', 'fkick'].includes(f.state) && f.hasHit && !a.press && rnd() < .35) press(a, comboReady(f, o) && rnd() < .5 ? 's' : (rnd() < .5 ? 'p' : 'k'));
  if (neutral && dist > 60 && dist < 130 && !a.press && rnd() < .012) { a.hold = { [back]: true }; a.holdT = 3; press(a, 's'); }
  if (neutral && nearProp(f) && !a.press && rnd() < .03) press(a, 'x');
  if (neutral && f.counterT > 0 && o.slowT > 0 && dist < 80 && !a.press) press(a, rnd() < .5 ? 'p' : 'k');
  if (neutral && o.state === 'ckick' && o.t < 6 && dist < 95 && rnd() < .35) { a.hold = { [back]: true, d: true }; a.holdT = 26; }
  if (neutral && o.state === 'tatsu' && dist < 110 && rnd() < .08) { a.hold = { [back]: true }; a.holdT = 30; }

  if (--a.cd <= 0 && neutral && !a.press) {
    a.cd = (10 + (Math.random() * 20 | 0)) * [1.6, 1, .6][OPT.diff];
    const r = Math.random();
    if (dist > 150) {
      if (r < .35 && !f.fb) press(a, 's');
      else if (r < .85) { a.hold = { [fwd]: true }; a.holdT = 20 + (Math.random() * 20 | 0); }
      else { a.hold = { u: true, [fwd]: true }; a.holdT = 6; }
    } else if (dist > 72) {
      if (r < .2 && !f.fb) press(a, 's');
      else if (r < .6) { a.hold = { [fwd]: true }; a.holdT = 15; }
      else if (r < .72) { a.hold = { u: true, [fwd]: true }; a.holdT = 6; }
      else if (r < .85) { a.hold = { [back]: true }; a.holdT = 12; }
      else { a.hold = {}; a.holdT = 10; }
    } else {
      if (r < .25) press(a, 'p');
      else if (r < .45) press(a, 'k');
      else if (r < .55) lowAttack(a, 'k');
      else if (r < .63) lowAttack(a, 'p');
      else if (r < .71) press(a, 's', true);
      else if (r < .80) { a.hold = { [back]: true, d: true }; a.holdT = 20; }
      else if (r < .88) { a.hold = { [back]: true }; a.holdT = 20; }
      else { a.hold = { [back]: true }; a.holdT = 10; }
    }
  }
  return held;
}

/* ---------------- Déroulé des rounds ---------------- */
// 2e couleur quand le CPU prend le même personnage
const ALT = [
  { top: ['#08080c', '#18181e', '#2e2e3a', '#4c4c5c'], belt: ['#2a0404', '#4a0808', '#6e1010', '#962222'] },   // Kaito : t-shirt noir, ceinture rouge foncé
  { top: ['#0c1a4a', '#18348c', '#2a5ad0', '#6a9cff'], legs: ['#06060a', '#14141c', '#26262e', '#8a8a9c'] }, // John : t-shirt bleu, pantalon presque noir brillant
];
const fighterDef = (i, alt) => alt ? Object.assign({}, DEFS[i], ALT[i], { idx: i, alt: true }) : Object.assign(DEFS[i], { idx: i });
function startMatch(p1, p2, stage) {
  if (p2 == null) p2 = G.p2 != null ? G.p2 : 1 - p1;
  G.p1 = p1; G.p2 = p2;
  G.stage = stage || G.stage || 'dojo'; BG = BGS[G.stage] || BGS.dojo;
  const vs2 = remoteOn(2);   // 2e manette connectée : joueur 2 humain au lieu du CPU
  G.f = [makeFighter(fighterDef(p1), 0, SW / 2 - 80, 1, false), makeFighter(fighterDef(p2, p2 === p1), 1, SW / 2 + 80, -1, !vs2)];
  if (vs2) G.f[1].ctl = p2ctl;
  G.f[0].ctl = pctl;
  G.round = 1;
  startRound();
}
function startRound() {
  const [a, b] = G.f;
  [[a, SW / 2 - 80, 1], [b, SW / 2 + 80, -1]].forEach(([f, x, d]) => {
    G.clash = null;
    Object.assign(f, { dizzy: false, dizzyEnd: -9999, x, y: GROUND, vx: 0, vy: 0, dir: d, hp: 100, lag: 100, air: false, ko: false, fb: null, invuln: 0, flash: 0, counterT: 0, jumpQ: 0, slowT: 0, burn: 0, combo: '', run: 0, restT: 0 });
    setState(f, 'idle');
    f.ai.holdT = 0; f.ai.press = null; f.ai.cd = 40;
  });
  G.props = makeProps(); G.shards = []; G.slowAll = 0; G.blood = []; G.stains = []; G.camL = EXT; G.zoom = 1;
  G.fbs = []; G.sparks = []; G.popups = []; G.flashT = 0; G.darkT = 0; G.timer = 99; G.tick = 0; G.fighting = false;
  G.scene = 'intro'; G.t = 0; G.winner = null;
}

function endRound(winner) {
  G.fighting = false;
  G.winner = winner;
  if (winner) winner.wins++;
}

/* ---------------- Boucle principale ---------------- */
// ---------- Options (enregistrées dans le navigateur) ----------
const OPT = { zoom: true, energy: 1, diff: 1, blood: true };
try { Object.assign(OPT, JSON.parse(localStorage.getItem('sf2opt2') || '{}')); } catch (e) {}   // nouvelle clé : zoom et sang activés par défaut
const saveOpt = () => { try { localStorage.setItem('sf2opt2', JSON.stringify(OPT)); } catch (e) {} };
// Énergie des combattants : 1 étoile = dégâts normaux, 2 et 3 étoiles = plus résistants
const DIFFS = ['EASY', 'NORMAL', 'HARD'];
const dmgK = d => Math.max(1, Math.round(d * [1, .7, .5][OPT.energy - 1] * 10) / 10);
const TITLE_ITEMS = ['SELECT CHARACTER', 'VIEW COMMANDS', 'OPTIONS'];
function goTitle() { G.scene = 'title'; G.t = SPLASH + 100; G.tmenu = 30; G.tstate = 1; G.tcur = 0; G.showMoves = false; G.showOpts = false; G.paused = false; }
// Menus : un cran par appui ; stick maintenu = descend/monte ligne par ligne
const navHold = { u: 0, d: 0 };
function nav(b) {
  if (!pctl.held[b]) { navHold[b] = 0; return false; }
  const n = ++navHold[b];
  return n === 1 || (n > 30 && (n - 30) % 15 === 0);
}
function navStep() { const u = nav('u'), d = nav('d'); return d ? 1 : u ? -1 : 0; }
const MOVE_ROWS = [];
function stepMoves() {
  if (!MOVE_ROWS.length) MOVES.forEach((pg, i) => { if (i) MOVE_ROWS.push(['', '']); MOVE_ROWS.push(['#', pg.title]); pg.lines.forEach(l => MOVE_ROWS.push(l)); });
  const maxS = Math.max(0, MOVE_ROWS.length * 14 - 128);
  if (pctl.held.d) G.mscroll = Math.min(maxS, (G.mscroll || 0) + 1.5);
  if (pctl.held.u) G.mscroll = Math.max(0, (G.mscroll || 0) - 1.5);
  if (backPress(pctl)) { G.showMoves = false; sfx('beep'); }
}
const PAUSE_ITEMS = ['CONTINUE', 'MOVE LIST', 'CHARACTER SELECT', 'OPTIONS'];
function stepOptions() {
  const m = navStep(), oc = Math.max(0, Math.min(4, G.ocur + m)); if (oc !== G.ocur) { G.ocur = oc; sfx('beep'); }
  const l = edge(pctl, 'l'), r = edge(pctl, 'r'), ok = edge(pctl, 's');
  if (backPress(pctl) || (ok && G.ocur === 4)) { G.showOpts = false; sfx('beep'); return; }
  if (G.ocur === 3 && ok) { OPT.blood = !OPT.blood; saveOpt(); sfx('select'); }
  if (G.ocur === 2 && (l || r || ok)) {
    OPT.diff = l ? Math.max(0, OPT.diff - 1) : r ? Math.min(2, OPT.diff + 1) : (OPT.diff + 1) % 3;
    saveOpt(); sfx('select');
  }
  if (G.ocur === 0 && ok) { OPT.zoom = !OPT.zoom; saveOpt(); sfx('select'); }
  if (G.ocur === 1 && (l || r || ok)) {
    OPT.energy = l ? Math.max(1, OPT.energy - 1) : r ? Math.min(3, OPT.energy + 1) : OPT.energy % 3 + 1;
    saveOpt(); sfx('select');
  }
}
function stepPause() {
  if (edge(pctl, 'start')) { G.paused = false; G.showMoves = false; G.showOpts = false; sfx('beep'); return; }   // START = reprendre
  if (G.showMoves) { stepMoves(); return; }
  if (G.showOpts) { stepOptions(); return; }
  const n = PAUSE_ITEMS.length, m = navStep();
  const pc = Math.max(0, Math.min(n - 1, G.pcur + m)); if (pc !== G.pcur) { G.pcur = pc; sfx('beep'); }
  if (backPress(pctl)) { G.paused = false; return; }
  if (edge(pctl, 's')) {
    sfx('select');
    if (G.pcur === 0) G.paused = false;
    else if (G.pcur === 1) { G.showMoves = true; G.mscroll = 0; }
    else if (G.pcur === 2) { G.paused = false; G.scene = 'select'; G.t = 0; }
    else { G.showOpts = true; G.ocur = 0; }
  }
}
function step() {
  G.frame++;
  ctlUpdate(pctl, readPlayer());
  ctlUpdate(p2ctl, readRemote(2));

  // Pause (bouton START) pendant le combat
  if (['intro', 'fight', 'ko', 'timeup'].includes(G.scene)) {
    if (G.paused) { stepPause(); tap = null; return; }
    if (edge(pctl, 'start') || edge(p2ctl, 'start')) { G.paused = true; G.pcur = 0; G.showMoves = false; G.showOpts = false; sfx('select'); tap = null; return; }
  }

  switch (G.scene) {
    case 'title': {
      // l'intro (logo Super Rocket Games) ne démarre qu'une fois le message "Rotate your phone" fermé
      if (G.tstate !== 1 && G.t < SPLASH && rotateShown()) { G.t = 0; break; }
      G.t++;
      if (G.showMoves) { stepMoves(); break; }
      if (G.showOpts) { stepOptions(); break; }
      const any = BTNS.some(b => edge(pctl, b)) || edge(pctl, 'start') || tap;
      if (G.tstate !== 1) {
        if (G.t < SPLASH) { if (G.t > 10 && any) G.t = SPLASH; break; }          // passer le logo Super Rocket Games
        if (G.t > SPLASH + 20 && any) { G.tstate = 1; G.tcur = 0; G.tmenu = 0; sfx('select'); }
      } else {
        G.tmenu = (G.tmenu || 0) + 1;
        const tc = Math.max(0, Math.min(TITLE_ITEMS.length - 1, (G.tcur || 0) + navStep()));
        if (tc !== (G.tcur || 0)) { G.tcur = tc; sfx('beep'); }
        if (tap) { const i = Math.floor((tap.y - 159) / 11); if (i >= 0 && i < TITLE_ITEMS.length) G.tcur = i; else break; }
        if (backPress(pctl)) { G.tstate = 0; sfx('beep'); }
        else if (okPress(pctl) || tap) {
          sfx('select');
          if ((G.tcur || 0) === 0) { G.scene = 'select'; G.t = 0; }
          else if (G.tcur === 1) { G.showMoves = true; G.mscroll = 0; }
          else { G.showOpts = true; G.ocur = 0; }
        }
      }
      break;
    }
    case 'select': {
      G.t++;
      netStart();   // prépare les QR codes des manettes smartphone
      const sc = G.selPhase && remoteOn(2) ? p2ctl : pctl;   // le joueur 2 choisit avec sa manette
      {
        let sl = G.sel || 0;
        if (edge(sc, 'l') && sl % 4 > 0) sl--;
        if (edge(sc, 'r') && sl % 4 < 3) sl++;
        if (edge(sc, 'u') && sl > 3) sl -= 4;
        if (edge(sc, 'd') && sl < 4) sl += 4;
        if (sl !== (G.sel || 0)) { G.sel = sl; sfx('beep'); }
      }
      if (G.t > 10 && (okPress(sc) || (sc !== pctl && okPress(pctl)))) {
        const c = ROSTER[G.sel || 0];
        if (c == null) sfx('block');
        else if (!G.selPhase) { G.p1 = c; G.selPhase = 1; sfx('select'); }                 // 1) mon personnage
        else { G.p2 = c; G.selPhase = 0; G.scene = 'stage'; G.t = 0; sfx('select'); }    // 2) le CPU
      }
      else if (G.t > 10 && backPress(pctl)) { if (G.selPhase) { G.selPhase = 0; sfx('beep'); } else { goTitle(); sfx('beep'); } }
      break;
    }
    case 'stage': {
      G.t++;
      if (edge(pctl, 'l') && (G.scur || 0) > 0) { G.scur = 0; sfx('beep'); }
      if (edge(pctl, 'r') && (G.scur || 0) < 1) { G.scur = 1; sfx('beep'); }
      if (G.t > 10 && okPress(pctl)) { startMatch(G.p1, G.p2, STAGES[G.scur || 0][0]); sfx('select'); }
      else if (G.t > 10 && backPress(pctl)) { G.scene = 'select'; G.selPhase = 1; G.t = 0; sfx('beep'); }
      break;
    }
    case 'intro': case 'fight': case 'ko': case 'timeup':
      stepFight();
      break;
    case 'over':
      G.t++;
      if (G.t > 30) {
        const m = navStep(), oc = Math.max(0, Math.min(1, (G.ocurOver || 0) + m));
        if (oc !== (G.ocurOver || 0)) { G.ocurOver = oc; sfx('beep'); }
        if (okPress(pctl)) {
          sfx('select');
          if ((G.ocurOver || 0) === 0) startMatch(G.p1, G.p2, G.stage);       // RETRY : mêmes personnages, même stage
          else { G.scene = 'select'; G.selPhase = 0; G.t = 0; }
        }
      }
      break;
  }
  tap = null;
}

function stepFight() {
  const [a, b] = G.f;
  G.t++;

  if (G.scene === 'intro') {
    if (G.t === 1) sfx('beep');
    if (G.t === 70) sfx('go');
    if (G.t >= 110) { G.scene = 'fight'; G.fighting = true; G.t = 0; }
  }

  // Entrées
  if (a.cpu && !G.noAI) ctlUpdate(a.ctl, aiInput(a, b));
  if (b.cpu && !G.noAI) ctlUpdate(b.ctl, aiInput(b, a));

  if (G.shake > 0) G.shake *= .8;
  if (G.shake < .3) G.shake = 0;
  if (G.freeze > 0) { G.freeze--; return; }
  if (G.slowAll > 0) { G.slowAll--; if (G.frame % 3) return; }   // ralenti général (renvoi d'objet)
  if (G.scene === 'ko' && G.t < 60 && G.t % 2) return; // ralenti du K.O.

  // ralenti : un combattant sous l'effet du contre n'avance qu'une image sur trois
  // Contre contre contre : les deux au ralenti, chacun remplit sa jauge en martelant
  if (G.clash) { stepClash(); return; }
  for (const [f, o] of [[a, b], [b, a]]) {
    if (f.slowT > 35 && o.counterT > 0 && G.fighting && take(f.ctl, 'x')) { startClash(f, o); return; }
  }
  [[a, b], [b, a]].forEach(([f, o]) => {
    if (f.slowT > 0) { f.slowT--; if (G.frame % 3) return; }
    updFighter(f, o);
  });
  if (G.flashT > 0) G.flashT--;
  if (G.darkT > 0) G.darkT--;
  [a, b].forEach(f => { if (f.burn > 0) f.burn--; });

  // Boules d'énergie
  for (const fb of G.fbs) {
    fb.x += fb.vx; fb.t++;
    if (fb.x < (G.camL || 0) - 30 || fb.x > (G.camL || 0) + W + 30) fb.alive = false;
  }
  for (let i = 0; i < G.fbs.length; i++) for (let j = i + 1; j < G.fbs.length; j++) {
    const p = G.fbs[i], q = G.fbs[j];
    if (p.alive && q.alive && p.owner !== q.owner && Math.abs(p.x - q.x) < 14 * Math.max(p.sc, q.sc) && Math.abs(p.y - q.y) < 14 * Math.max(p.sc, q.sc)) {
      // la grosse boule de feu (MAX) traverse la petite et continue sa route
      if (p.sc > q.sc) q.alive = false; else if (q.sc > p.sc) p.alive = false; else p.alive = q.alive = false;
      const big = p.sc > q.sc ? p : q.sc > p.sc ? q : p;
      addSpark((p.x + q.x) / 2, p.y, 'fb', big.owner.def.fb); sfx('block');
    }
  }
  for (const fb of G.fbs) {
    if (!fb.alive) continue;
    const def = fb.owner === a ? b : a;
    const hb = hurtbox(def);
    if (overlap([fb.x - 12 * fb.sc, fb.y - 11 * fb.sc, fb.x + 12 * fb.sc, fb.y + 11 * fb.sc], hb)) {
      fb.alive = false;
      applyHit(fb.owner, def, fb.big ? FB_BIG : FB_HIT, fb.x + fb.dir * 4, fb.y, fb.x - fb.vx * 10, true);
    }
  }
  G.fbs = G.fbs.filter(fb => fb.alive);
  [a, b].forEach(f => { if (f.fb && !f.fb.alive) f.fb = null; });

  // Coups au corps à corps
  for (const [att, def] of [[a, b], [b, a]]) {
    const ab = atkBox(att), hb = hurtbox(def);
    if (overlap(ab, hb)) {
      att.hasHit = true;
      const sx = (Math.max(ab[0], hb[0]) + Math.min(ab[2], hb[2])) / 2;
      const sy = (Math.max(ab[1], hb[1]) + Math.min(ab[3], hb[3])) / 2;
      applyHit(att, def, ATK[att.state], sx, sy, att.x, false);
    }
  }

  // Les deux combattants restent à l'écran : écart maximal = largeur de l'écran
  { const maxD = W - 40, d = b.x - a.x;
    if (Math.abs(d) > maxD) {
      const ex = Math.abs(d) - maxD, sg = Math.sign(d);
      const am = (a.x - (a.px ?? a.x)) * -sg > 0, bm = (b.x - (b.px ?? b.x)) * sg > 0;   // qui s'éloigne ?
      if (am && !bm) a.x += ex * sg; else if (bm && !am) b.x -= ex * sg; else { a.x += ex * sg / 2; b.x -= ex * sg / 2; }
    } }
  a.px = a.x; b.px = b.x;
  // Séparation des corps
  if (Math.abs(a.y - b.y) < 56 && a.state !== 'held' && b.state !== 'held' && !['down'].includes(a.state) && !['down'].includes(b.state)) {
    const dx = b.x - a.x, minD = 30;
    if (Math.abs(dx) < minD) {
      const push = (minD - Math.abs(dx)) / 2, s = dx === 0 ? (a.dir > 0 ? 1 : -1) : Math.sign(dx);
      a.x -= push * s; b.x += push * s;
      if (a.x < 18) { b.x += 18 - a.x; a.x = 18; }
      if (b.x < 18) { a.x += 18 - b.x; b.x = 18; }
      if (a.x > SW - 18) { b.x -= a.x - (SW - 18); a.x = SW - 18; }
      if (b.x > SW - 18) { a.x -= b.x - (SW - 18); b.x = SW - 18; }
    }
  }

  updProps(); updBlood();
  // Étincelles
  G.sparks.forEach(s => s.t++);
  G.popups.forEach(pp => pp.t++);
  G.popups = G.popups.filter(pp => pp.t < 50);
  G.sparks = G.sparks.filter(s => s.t < 12);

  if (G.scene === 'fight') {
    if (++G.tick >= 45) { G.tick = 0; G.timer = Math.max(0, G.timer - 1); }
    if (a.hp <= 0 || b.hp <= 0) {
      const loser = a.hp <= 0 ? a : b;
      loser.ko = true;
      endRound(a.hp <= 0 && b.hp <= 0 ? null : (loser === a ? b : a));
      G.scene = 'ko'; G.t = 0; sfx('ko'); G.freeze = 20;
    } else if (G.timer <= 0) {
      endRound(a.hp === b.hp ? null : (a.hp > b.hp ? a : b));
      G.scene = 'timeup'; G.t = 0;
    }
  } else if (G.scene === 'ko' || G.scene === 'timeup') {
    const w = G.winner;
    if (w && G.t > 100 && !w.air && [...NEUTRAL, 'land'].includes(w.state)) { setState(w, 'win'); w.vx = 0; }
    if (G.t > 260) {
      if (G.f.some(f => f.wins >= 2)) { G.scene = 'over'; G.t = 0; G.ocurOver = 0; }
      else { G.round++; startRound(); }
    }
  }
}

/* ---------------- Rendu ---------------- */
function drawFireball(fb) {
  const pal = fb.owner.def.fb, x = Math.round(fb.x), y = Math.round(fb.y), d = fb.dir, t = fb.t, S = fb.sc || 1;
  const pulse = 1 + Math.sin(t * .5) * .08;
  // halo lumineux (mélange additif)
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const g = ctx.createRadialGradient(x, y, 2, x, y, 30 * S * pulse);
  g.addColorStop(0, pal[1] + 'cc'); g.addColorStop(.35, pal[2] + '66'); g.addColorStop(1, pal[3] + '00');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, 30 * S * pulse, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  // traînée d'énergie
  for (let i = 5; i >= 1; i--) {
    const wob = Math.sin(t * .6 + i) * 2 * S;
    disc(x - d * i * 6 * S, y + wob, Math.max(2, (10 - i * 1.6) * S) | 0, i > 3 ? pal[3] : pal[2]);
  }
  // corps de la boule
  disc(x, y, 12 * S, pal[3]);
  disc(x + d * S, y, 10 * S, pal[2]);
  disc(x + d * 2 * S, y - S, 7 * S, pal[1]);
  disc(x + d * 3 * S, y - 2 * S, 4 * S, pal[0]);
  R(x + d * 2 * S - S, y - 6 * S, 3 * S, 2 * S, pal[0]);
  // étincelles qui tournent autour
  for (let i = 0; i < 6 + (S > 1 ? 4 : 0); i++) {
    const a = t * .35 + i * Math.PI * 2 / (6 + (S > 1 ? 4 : 0)), r = (13 + (i % 2) * 3) * S;
    R(x + Math.cos(a) * r - 1, y + Math.sin(a) * r * .8 - 1, 2 * S, 2 * S, i % 2 ? pal[0] : pal[1]);
  }
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  ctx.fillStyle = pal[1] + '55'; ctx.beginPath(); ctx.arc(x + d * 2 * S, y - S, 9 * S, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

function drawSpark(s) {
  const r = 3 + s.t * 2;
  const col = s.type === 'parry' ? ['#ffffff', '#7af0ff'] : s.type === 'block' ? ['#ffffff', '#7ad0ff'] : s.type === 'fb' ? [s.pal[0], s.pal[2]] : ['#ffffff', '#ffd23a'];
  if (s.t > 8 && s.t % 2) return;
  for (let i = 0; i < 8; i++) {
    const ang = i / 8 * Math.PI * 2 + (s.type === 'block' ? .4 : 0);
    const len = i % 2 ? r * .6 : r;
    seg([s.x + Math.cos(ang) * r * .3, s.y + Math.sin(ang) * r * .3], [s.x + Math.cos(ang) * len, s.y + Math.sin(ang) * len], 2, col[i % 2]);
  }
  if (s.t < 4) disc(s.x, s.y, 4 - s.t, col[0]);
}

// ---------- Portraits et grille de sélection (8 cases) ----------
const PORTRAITS = ['p_kaito.jpg', 'p_john.jpg'].map(src => { const im = new Image(); im.src = src + '?v=52'; return im; });
const PORTRAITS_HURT = ['p_kaito_hurt.jpg', 'p_john_hurt.jpg'].map(src => { const im = new Image(); im.src = src + '?v=52'; return im; });
const PORTRAIT_FACE = [1, -1];   // sens du regard de chaque image : Kaito regarde à droite, John à gauche
const ROSTER = [0, 1, null, null, null, null, null, null];   // indices dans DEFS ; null = personnage à venir
function drawPortrait(i, x, y, sz, border, look = 1, hurt = false) {   // look : 1 = regarde à droite, -1 = à gauche
  R(x - 2, y - 2, sz + 4, sz + 4, '#000');
  R(x - 1, y - 1, sz + 2, sz + 2, border || '#c8c8d0');
  const im = i == null ? null : (hurt ? PORTRAITS_HURT : PORTRAITS)[i];
  const flip = i != null && PORTRAIT_FACE[i] !== look;
  if (im && im.complete && im.naturalWidth) {
    ctx.save(); ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
    if (flip) { ctx.translate(x + sz, y); ctx.scale(-1, 1); ctx.drawImage(im, 0, 0, sz, sz); }
    else ctx.drawImage(im, x, y, sz, sz);
    ctx.restore();
  } else {
    R(x, y, sz, sz, '#000');
    text('?', x + sz / 2, y + sz / 2 - (sz >= 40 ? 8 : 4), sz >= 40 ? 16 : 8, '#ffffff', 'center');
  }
}
function drawBar(x, w, f, left) {
  R(x - 2, 9, w + 4, 11, '#000');
  R(x - 1, 10, w + 2, 9, '#c8c8d0');
  R(x, 11, w, 7, '#8c0c0c');
  const hw = Math.round(w * f.hp / 100), lw = Math.round(w * f.lag / 100);
  const low = f.hp < 25 && (G.frame >> 3) % 2;
  const col = low ? '#fff27a' : '#f8d030';
  if (left) { R(x, 11, lw, 7, '#ff6a1a'); R(x, 11, hw, 7, col); R(x, 11, hw, 2, '#fff2a8'); }
  else { R(x + w - lw, 11, lw, 7, '#ff6a1a'); R(x + w - hw, 11, hw, 7, col); R(x + w - hw, 11, hw, 2, '#fff2a8'); }
}

function drawHUD() {
  const [a, b] = G.f;
  const PS = 26, bx = 6 + PS + 4, bw = Math.round(CX - 24 - bx);
  drawPortrait(a.def.idx, 6, 4, PS, '#5ac8ff', 1);
  drawPortrait(b.def.idx, W - 6 - PS, 4, PS, '#ff7a6a', -1);
  drawBar(bx, bw, a, true);
  drawBar(W - bx - bw, bw, b, false);
  // Badge K.O.
  const flash = (a.hp < 25 || b.hp < 25) && (G.frame >> 4) % 2;
  R(CX - 22, 7, 44, 15, '#000');
  R(CX - 21, 8, 42, 13, flash ? '#ffffff' : '#d8261c');
  text('KO', CX, 11, 8, flash ? '#d8261c' : '#ffe14a', 'center', '#5a0a06');
  // Chrono
  text(String(G.timer).padStart(2, '0'), CX, 26, 16, '#ffffff', 'center');
  // Noms + victoires
  text(a.def.name, bx, 24, 8, '#ffffff', 'left');
  text(b.def.name, W - bx, 24, 8, '#ffffff', 'right');
  if (a.cpu === false) text('1P', 6, 35, 8, '#5ac8ff', 'left');
  text(b.cpu ? 'CPU' : '2P', W - 6, 35, 8, '#ff7a6a', 'right');
  for (let i = 0; i < a.wins; i++) drawMedal(bx + 18 + i * 12, 38);
  for (let i = 0; i < b.wins; i++) drawMedal(W - bx - 26 - i * 12, 38);
}
function drawMedal(x, y) {
  disc(x, y, 4, OUT); disc(x, y, 3, '#e8a820'); R(x - 1, y - 2, 2, 2, '#fff2a8');
}

function bigMsg(s, size, col, y = 84) { text(s, W / 2, y, size, col, 'center', '#3a0a04'); }

// Étourdi : étoiles qui tournent au-dessus de la tête + jauge de martelage
function drawDizzy(f) {
  const hx = f.x + f.dir * 4 + Math.sin(G.frame * .15) * 2, hy = f.y - 90;
  for (let i = 0; i < 3; i++) {
    const a = G.frame * .12 + i * Math.PI * 2 / 3, x = hx + Math.cos(a) * 13, y = hy + Math.sin(a) * 4;
    drawStar(x, y, Math.sin(a) > 0 ? 4 : 3, true);
  }
  if (f.mashShow > 0 || f.mash > 0) {
    const k = Math.min(1, f.t / f.stun);
    R(hx - 16, hy - 13, 32, 5, '#1a1020'); R(hx - 15, hy - 12, Math.round(30 * k), 3, k > .7 ? '#5ae06a' : '#ffd23a');
  }
}
// Jauges du duel de contres, chacune du côté de son combattant
function drawClash() {
  const C = G.clash;
  C.f.forEach((f, i) => {
    const k = Math.min(1, C.g[i] / 100), x = f.x - f.dir * 26, y0 = f.y - 96, h = 60;
    R(x - 4, y0 - 1, 8, h + 2, '#1a1020');
    R(x - 3, y0 + h - Math.round(h * k), 6, Math.round(h * k), f.def.fb[2]);
    if (!f.cpu && (G.frame >> 3) % 2) text('MASH!', x, y0 - 12, 8, '#ffffff', 'center');
  });
}
// Flammes sur un combattant (enchaînement final) : couleur de l'attaquant
function drawBurn(f) {
  const pal = f.burnPal || f.def.fb, lying = f.state === 'fall' || f.state === 'down' || f.state === 'held';
  const hgt = lying ? 34 : 84, wid = lying ? 30 : 14;
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  const g = ctx.createRadialGradient(f.x, f.y - hgt / 2, 2, f.x, f.y - hgt / 2, hgt * .8);
  g.addColorStop(0, pal[2] + '88'); g.addColorStop(1, pal[3] + '00');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(f.x, f.y - hgt / 2, hgt * .8, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  for (let i = 0; i < 16; i++) {
    const life = ((G.frame * 1.6 + i * 7.3) % 40) / 40;           // 0 → 1 en montant
    const x = f.x + Math.sin(i * 2.3 + G.frame * .25) * wid * (1 - life * .5);
    const y = f.y - 4 - life * hgt;
    const r = Math.max(1, Math.round(7 * (1 - life)));
    disc(x, y, r, life < .5 ? pal[2] : pal[3]);
    if (r > 2) disc(x, y + 1, r - 2, pal[1]);
  }
}
// Frappe enflammée : boule de feu dans la main pendant la frappe
function drawFlameHand(f) {
  if (!f.fireState || f.state !== f.fireState) return;
  const at = ATK[f.state]; if (!at || f.t > at.act[1] + 6) return;
  const pal = f.def.fb, x = f.x + f.dir * at.box[2] * .85, y = f.y + (at.box[1] + at.box[3]) / 2;
  const k = Math.max(.35, 1 - Math.abs(f.t - at.act[0]) / 10);
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  const g = ctx.createRadialGradient(x, y, 1, x, y, 22 * k + 6);
  g.addColorStop(0, pal[1] + 'ee'); g.addColorStop(1, pal[3] + '00');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, 22 * k + 6, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  for (let i = 0; i < 6; i++) {
    const a = G.frame * .5 + i;
    disc(x + Math.cos(a) * 5 - f.dir * i * 2, y + Math.sin(a) * 4 - i * 1.5, Math.max(1, 5 - i), i < 3 ? pal[2] : pal[3]);
  }
  disc(x, y, 4, pal[1]); disc(x, y, 2, pal[0]);
}

function drawFight() {
  const [a, b] = G.f;
  // Caméra : zoom de 100 % (distance de départ) à 120 % quand les combattants se rapprochent
  const dist = Math.abs(a.x - b.x), D0 = 160, D1 = 50;
  const zt = OPT.zoom ? 1 + .2 * Math.max(0, Math.min(1, (D0 - dist) / (D0 - D1))) : 1;
  G.zoom = (G.zoom || 1) + (zt - (G.zoom || 1)) * .16;
  const z = G.zoom, vw = W / z, vh = H / z;
  const left = Math.max(0, Math.min(SW - vw, (a.x + b.x) / 2 - vw / 2)), top = H - vh;
  G.camL = left; G.camW = vw;
  ctx.save();
  ctx.scale(z, z); ctx.translate(-left, -top);
  ctx.drawImage(BG, 0, 0);
  if (G.darkT > 0) {   // fond assombri pendant le ralenti
    const k = Math.min(1, G.darkT / 10, (60 - G.darkT) / 6 + .2);
    R(left - 10, top - 10, vw + 20, vh + 20, `rgba(6,4,18,${.62 * k})`);
  }
  drawStains();
  drawProps();
  drawShadow(a); drawShadow(b);
  const order = ATTACKING.includes(a.state) && !ATTACKING.includes(b.state) ? [b, a] : [a, b];
  order.forEach(f => drawFighter(f, f.dizzy ? f.x + Math.round(Math.sin(G.frame * .15) * 2) : f.x));
  G.f.forEach(f => { if (f.burn > 0) drawBurn(f); drawFlameHand(f); if (f.dizzy) drawDizzy(f); });
  if (G.clash) drawClash();
  G.fbs.forEach(drawFireball);
  // énergie qui grossit entre les mains pendant la charge
  G.f.forEach(f => {
    if (f.state !== 'special' || f.fired || !f.chargeT) return;
    const pal = f.def.fb, k = Math.min(1, f.chargeT / chargeMax(f));
    const cx = f.x - f.dir * 14, cy = f.y - 44;
    const r = 3 + k * 7 + (f.charged ? Math.sin(G.frame * .6) * 2 : 0);
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * 2.4);
    g.addColorStop(0, pal[1] + 'dd'); g.addColorStop(1, pal[3] + '00');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, r * 2.4, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    disc(cx, cy, r | 0, pal[2]); disc(cx, cy, Math.max(1, r * .55) | 0, pal[0]);
  });
  drawShards(); drawBlood();
  G.sparks.forEach(drawSpark);
  if (G.flashT > 0) {
    // éclat en étoile qui jaillit du point d'impact : grandit très vite en tournant puis s'efface
    const k = 1 - G.flashT / 12;
    const rad = 10 + 70 * Math.sqrt(k), alpha = Math.min(1, G.flashT / 6);
    const rot = k * 1.6 + .2;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = alpha;
    const g = ctx.createRadialGradient(G.boltX, G.boltY, 0, G.boltX, G.boltY, rad * .6);
    g.addColorStop(0, '#ffffff'); g.addColorStop(.3, '#bff8ff'); g.addColorStop(1, 'rgba(60,200,255,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(G.boltX, G.boltY, rad * .6, 0, Math.PI * 2); ctx.fill();
    ctx.translate(G.boltX, G.boltY); ctx.rotate(rot);
    for (let i = 0; i < 8; i++) {
      const L = i % 2 ? rad * .55 : rad, w = i % 2 ? 3 : 5;
      ctx.fillStyle = '#7af0ff';
      ctx.beginPath(); ctx.moveTo(0, -w); ctx.lineTo(L, 0); ctx.lineTo(0, w); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.moveTo(0, -w * .4); ctx.lineTo(L * .8, 0); ctx.lineTo(0, w * .4); ctx.closePath(); ctx.fill();
      ctx.rotate(Math.PI / 4);
    }
    ctx.restore();
  }
  G.popups.forEach(pp => { if ((pp.t >> 2) % 4 !== 3 || pp.t < 30) text(pp.txt, pp.x, pp.y - pp.t * .4, 8, pp.col, 'center'); });
  ctx.restore();
  if (G.flashT > 9) R(0, 0, W, H, 'rgba(220,245,255,.25)');   // très bref flash d'écran
  drawHUD();

  if (G.scene === 'intro') {
    if (G.t < 70) bigMsg('ROUND ' + G.round, 16, '#ffd23a');
    else bigMsg('FIGHT!', 24, '#ff4a2a');
  } else if (G.scene === 'ko') {
    if (G.t < 120) { if ((G.t >> 2) % 2 || G.t > 40) bigMsg('K.O.', 32, '#ff3a2a', 76); }
    else bigMsg(G.winner ? G.winner.def.name + ' WINS!' : 'DOUBLE K.O.', 16, '#ffd23a');
  } else if (G.scene === 'timeup') {
    if (G.t < 120) bigMsg('TIME OVER', 16, '#ffd23a');
    else bigMsg(G.winner ? G.winner.def.name + ' WINS!' : 'DRAW', 16, '#ffd23a');
  }
}

// ---------- Liste des coups (3 pages) ----------
const MOVES = [
  { title: 'BASICS', lines: [
    ['Y', 'PUNCH'], ['B', 'KICK'], ['STICK UP', 'JUMP (FWD/BACK = ROLL)'], ['STICK DOWN', 'CROUCH'],
    ['BACK', 'BLOCK  -  DOWN+BACK: LOW BLOCK'], ['FWD + Y', 'LONG PUNCH'], ['FWD + B', 'LONG KICK'],
    ['DOWN + Y', 'RISING UPPERCUT'], ['DOWN + B x3', 'LOW KICKS (3RD KNOCKS DOWN)'] ] },
  { title: 'SPECIALS & COUNTER', lines: [
    ['A', 'FIREBALL'], ['HOLD A 2S', 'MAX FIREBALL (1S AT 80% HP)'], ['UP + A', 'UPPERCUT'],
    ['BACK + A', 'TORNADO KICK x4'], ['AIR + A', 'SPIN KICK'], ['X', 'COUNTER (JUST BEFORE A HIT)'],
    ['COUNTER > Y', 'OVERHEAD SLAM'], ['COUNTER > B', 'ROLLING THROW'],
    ['COUNTERED > X', 'CLASH: MASH TO WIN'], ['X NEAR AN OBJECT', 'THROW IT AT THE FOE'], ['X AS IT ARRIVES', 'REFLECT A THROWN OBJECT'], ['DIZZY', 'MASH ANY BUTTON'] ] },
  { title: 'COMBOS', lines: [
    ['', 'CHAIN HITS WHILE THE FOE IS STUNNED.'], ['', 'THE 4TH HIT SETS HIM ON FIRE!'], ['', ''],
    ['Y Y B B', 'FIRE FINISH'], ['B B Y Y', 'FIRE FINISH'], ['Y Y B A', 'FLAME STRIKE FINISH'], ['B B Y A', 'FLAME STRIKE FINISH'] ] },
];
function drawMoves() {
  R(0, 0, W, H, 'rgba(8,4,16,.92)');
  text('MOVE LIST', CX, 10, 8, '#ff7a3a', 'center');
  const x0 = Math.max(16, CX - 168), top = 30, bot = 162, sc = G.mscroll || 0;
  ctx.save(); ctx.beginPath(); ctx.rect(0, top, W, bot - top); ctx.clip();
  MOVE_ROWS.forEach(([k, v], i) => {
    const y = top + 4 + i * 14 - sc;
    const fa = Math.max(0, Math.min(1, (y - top + 2) / 8, (bot - 8 - y) / 8));   // fondu en haut et en bas
    if (fa <= 0) return;
    ctx.globalAlpha = fa;
    if (k === '#') { R(x0, y + 10, 2 * CX - 2 * x0, 1, '#5a3a2a'); text(v, CX, y, 8, '#ffd23a', 'center'); return; }
    if (k) text(k, x0, y, 8, '#7af0ff', 'left');
    if (v) text(v, k ? x0 + 112 : CX, y, 8, '#ffffff', k ? 'left' : 'center');
  });
  ctx.globalAlpha = 1; ctx.restore();
  // ascenseur
  const total = MOVE_ROWS.length * 14, view = bot - top;
  if (total > view) {
    const bh = Math.max(12, view * view / total), by = top + (view - bh) * (sc / Math.max(1, total - 128));
    R(W - 8, top, 3, view, '#2a1e30'); R(W - 8, Math.min(bot - bh, by), 3, bh, '#ffd23a');
  }
  if (!isTouch) text('PC: J=Y  K=B  L=A  SPACE=X  ENTER=START', CX, 176, 8, '#9a8a70', 'center');
  text(isTouch ? 'UP/DOWN: SCROLL    B: BACK' : 'UP/DOWN: SCROLL    ESC: BACK', CX, 196, 8, '#d8c8a8', 'center');
}
function drawStar(x, y, r, on) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * .45 : r;
    ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  ctx.closePath();
  ctx.fillStyle = on ? '#ffd23a' : '#3a2e44'; ctx.fill();
}
function panel(y0, h, title) {
  R(CX - 100, y0, 200, h, 'rgba(20,10,30,.92)');
  R(CX - 100, y0, 200, 2, '#ffd23a'); R(CX - 100, y0 + h - 2, 200, 2, '#ffd23a');
  text(title, CX, y0 + 10, 16, '#ffd23a', 'center');
}
function drawOptions() {
  panel(28, 162, 'OPTIONS');
  const c = G.ocur, col = i => c === i ? '#ffffff' : '#9a8aa0', x0 = CX - 84, bx = CX + 64;
  const box = (y, on, i) => { R(bx, y - 2, 12, 12, col(i)); R(bx + 2, y, 8, 8, '#140a1e'); if (on) R(bx + 3, y + 1, 6, 6, '#5ae06a'); };
  if (c < 4) text('>', x0 - 4, 58 + c * 20, 8, '#ffd23a', 'right');
  text('ZOOM IN GAME', x0, 58, 8, col(0), 'left'); box(58, OPT.zoom, 0);
  text('FIGHTERS ENERGY', x0, 78, 8, col(1), 'left');
  for (let i = 0; i < 3; i++) drawStar(CX + 50 + i * 12, 82, 5.5, i < OPT.energy);
  text('DIFFICULTY', x0, 98, 8, col(2), 'left');
  text((c === 2 ? '< ' : '') + DIFFS[OPT.diff] + (c === 2 ? ' >' : ''), CX + 62, 98, 8, ['#5ae06a', '#ffd23a', '#ff5a4a'][OPT.diff], 'center');
  text('BLOOD', x0, 118, 8, col(3), 'left'); box(118, OPT.blood, 3);
  text((c === 4 ? '> ' : '') + 'BACK' + (c === 4 ? ' <' : ''), CX, 146, 8, col(4), 'center');
  text(isTouch ? 'A / < >: CHANGE   B: BACK' : 'ENTER / < >: CHANGE   ESC: BACK', CX, 170, 8, '#7a6a80', 'center');
}
function drawPause() {
  R(0, 0, W, H, 'rgba(0,0,0,.55)');
  if (G.showMoves) { drawMoves(); return; }
  if (G.showOpts) { drawOptions(); return; }
  panel(40, 136, 'PAUSE');
  PAUSE_ITEMS.forEach((t, i) => {
    const sel = G.pcur === i;
    text((sel ? '> ' : '') + t + (sel ? ' <' : ''), CX, 80 + i * 20, 8, sel ? '#ffffff' : '#9a8aa0', 'center');
  });
}

const LOGO = new Image();
LOGO.src = 'logo.png?v=25';
const TITLE_IMG = new Image();
TITLE_IMG.src = 'title.jpg?v=50';
function drawCover(img, al, sc = 1) {   // image plein écran (recadrée)
  if (!img.complete || !img.naturalWidth) return;
  const k = Math.max(W / img.naturalWidth, H / img.naturalHeight) * sc, w = img.naturalWidth * k, h = img.naturalHeight * k;
  ctx.save(); ctx.globalAlpha = al; ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, CX - w / 2, H / 2 - h / 2, w, h); ctx.restore();
}
const SRG = new Image();
SRG.src = 'srg.jpg?v=25';
const SPLASH = 110;   // durée du logo Super Rocket Games (fondu, 1 s, fondu)
function drawImg(img, cx, cy, w, al) {
  if (!img.complete || !img.naturalWidth) return false;
  const h = w * img.naturalHeight / img.naturalWidth;
  ctx.save(); ctx.globalAlpha = al; ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, cx - w / 2, cy - h / 2, w, h);
  ctx.restore(); return true;
}
function drawTitle() {
  const t = G.t;
  R(0, 0, W, H, '#000');
  // 1) logo Super Rocket Games : fondu entrant, 1 seconde, fondu sortant
  if (t < SPLASH) {
    const al = t < 20 ? t / 20 : t < 80 ? 1 : Math.max(0, 1 - (t - 80) / 20);
    drawImg(SRG, CX, H / 2, Math.min(300, W - 40), al);
    return;
  }
  // 2) mur de briques avec le logo graffiti : dézoom + fondu
  const L = t - SPLASH;
  const k = Math.min(1, L / 40), ease = 1 - Math.pow(1 - k, 3);
  drawCover(TITLE_IMG, Math.min(1, L / 25), 1.25 - .25 * ease);
  if (!TITLE_IMG.complete) text('SWEET FIGHTERS', CX, 70, 16, '#ff7a3a', 'center');
  // bandeau sombre en bas pour la lisibilité
  const gb = ctx.createLinearGradient(0, 140, 0, H); gb.addColorStop(0, 'rgba(0,0,0,0)'); gb.addColorStop(1, 'rgba(0,0,0,.75)');
  ctx.fillStyle = gb; ctx.fillRect(0, 140, W, H - 140);
  if (G.showMoves) { drawMoves(); return; }
  if (G.showOpts) { R(0, 0, W, H, 'rgba(0,0,0,.55)'); drawOptions(); return; }
  if (G.tstate !== 1) {
    if (L > 40 && (G.frame >> 5) % 2 === 0) text('PRESS ANY BUTTON', CX, 176, 8, '#ffffff', 'center');
  } else {
    TITLE_ITEMS.forEach((m, i) => {
      const sel = G.tcur === i;
      text((sel ? '> ' : '') + m + (sel ? ' <' : ''), CX, 162 + i * 11, 8, sel ? '#ffd23a' : '#d8c8a8', 'center');
    });
  }
  if (L > 30) {
    text('POWERED BY SUPER ROCKET GAMES', CX, 197, 8, '#c8b8a0', 'center');
    text('ALL RIGHTS RESERVED 2026', CX, 207, 8, '#9a8a70', 'center');
  }
  text(VERSION, W - 4, 4, 8, '#5a4a40', 'right');
}

function drawSelect() {
  R(0, 0, W, H, '#000'); drawCover(TITLE_IMG, 1);
  R(0, 0, W, H, 'rgba(8,4,14,.72)');
  const ph = G.selPhase || 0, sel = G.sel || 0, hov = ROSTER[sel];
  const two = remoteOn(2), L2 = two ? '2P' : 'CPU';
  text(ph === 0 ? (two ? 'PLAYER 1: SELECT FIGHTER' : 'SELECT YOUR FIGHTER') : (two ? 'PLAYER 2: SELECT FIGHTER' : 'SELECT CPU FIGHTER'), CX, 6, 8, ph === 0 ? '#5ac8ff' : '#ff7a6a', 'center');
  drawQRs();
  const p1 = ph === 0 ? hov : G.p1, p2 = ph === 1 ? hov : null;
  const BS = 74, y0 = 20;
  drawPortrait(p1, CX - 22 - BS, y0, BS, '#5ac8ff', 1);
  text('1P', CX - 22 - BS, y0 + BS + 4, 8, '#5ac8ff', 'left');
  text(p1 == null ? '???' : DEFS[p1].name, CX - 22, y0 + BS + 4, 8, '#ffffff', 'right');
  drawPortrait(p2, CX + 22, y0, BS, '#ff7a6a', -1);
  text(L2, CX + 22 + BS, y0 + BS + 4, 8, '#ff7a6a', 'right');
  text(p2 == null ? '???' : DEFS[p2].name + (p2 === G.p1 ? ' 2P' : ''), CX + 22, y0 + BS + 4, 8, '#ffffff', 'left');
  text('VS', CX, y0 + BS / 2 - 8, 16, '#ff4a2a', 'center');
  // grille 4 x 2 : tous regardent à droite
  const S = 34, gap = 4, gx = CX - (4 * S + 3 * gap) / 2, gy = 120;
  for (let i = 0; i < 8; i++) {
    const x = gx + (i % 4) * (S + gap), y = gy + (i >> 2) * (S + gap);
    const on = i === sel, blink = (G.frame >> 3) % 2;
    drawPortrait(ROSTER[i], x, y, S, on ? (blink ? '#ffd23a' : (ph ? '#ff3a2a' : '#ff6a1a')) : '#5a4a60', 1);
    if (on) text(ph ? L2 : '1P', x + 1, y - 1, 8, ph ? '#ff7a6a' : '#5ac8ff', 'left');
  }
  if (hov == null) text('COMING SOON', CX, 196, 8, '#9a8aa0', 'center');
  text(isTouch ? 'A: CONFIRM   B: BACK' : 'ENTER: CONFIRM   ESC: BACK', CX, 206, 8, '#d8c8a8', 'center');
}

const STAGES = [['dojo', 'DOJO'], ['city', 'CITY NIGHT']];
function drawStageSelect() {
  R(0, 0, W, H, '#000'); drawCover(TITLE_IMG, 1);
  R(0, 0, W, H, 'rgba(8,4,14,.72)');
  text('SELECT STAGE', CX, 14, 8, '#ffd23a', 'center');
  const cw = Math.min(170, (W - 40) / 2 - 6), ch = Math.round(cw * 9 / 16);
  STAGES.forEach(([id, name], i) => {
    const x = CX - cw - 6 + i * (cw + 12), y = 54, on = (G.scur || 0) === i, blink = (G.frame >> 3) % 2;
    R(x - 3, y - 3, cw + 6, ch + 6, on ? (blink ? '#ffd23a' : '#ff6a1a') : '#5a4a60');
    R(x - 1, y - 1, cw + 2, ch + 2, '#000');
    const bg = BGS[id];
    if (bg) { ctx.save(); ctx.imageSmoothingEnabled = true; ctx.drawImage(bg, (bg.width - bg.height * 16 / 9) / 2, 0, bg.height * 16 / 9, bg.height, x, y, cw, ch); ctx.restore(); }
    if (!on) R(x, y, cw, ch, 'rgba(0,0,0,.45)');
    text(name, x + cw / 2, y + ch + 10, 8, on ? '#ffffff' : '#9a8aa0', 'center');
  });
  text(isTouch ? '< >: CHOOSE   A: FIGHT   B: BACK' : '< >: CHOOSE   ENTER: FIGHT   ESC: BACK', CX, 200, 8, '#d8c8a8', 'center');
}

// Écran de fin de combat : les deux visages, le perdant blessé ; RETRY / SELECT CHARACTER
function drawOver() {
  R(0, 0, W, H, '#000'); drawCover(TITLE_IMG, 1);
  R(0, 0, W, H, 'rgba(6,2,10,.78)');
  const [a, b] = G.f, aw = a.wins >= 2, bw = b.wins >= 2;
  const k = Math.min(1, G.t / 25), BS = Math.min(96, Math.round((W - 80) / 2 - 20)), y0 = 22;
  const lx = Math.round(CX - 18 - BS - (1 - k) * 60), rx = Math.round(CX + 18 + (1 - k) * 60);
  drawPortrait(a.def.idx, lx, y0, BS, aw ? '#ffd23a' : '#5a4a60', 1, !aw);
  drawPortrait(b.def.idx, rx, y0, BS, bw ? '#ffd23a' : '#5a4a60', -1, !bw);
  text(a.def.name, lx + BS / 2, y0 + BS + 6, 8, '#ffffff', 'center');
  text(b.def.name, rx + BS / 2, y0 + BS + 6, 8, '#ffffff', 'center');
  text(aw ? 'WINNER' : 'LOSER', lx + BS / 2, y0 + BS + 17, 8, aw ? '#ffd23a' : '#9a6a6a', 'center');
  text(bw ? 'WINNER' : 'LOSER', rx + BS / 2, y0 + BS + 17, 8, bw ? '#ffd23a' : '#9a6a6a', 'center');
  text('VS', CX, y0 + BS / 2 - 8, 16, '#ff4a2a', 'center');
  const won = a.cpu === false ? aw : bw;
  if (G.t > 20) text(won ? 'YOU WIN!' : 'YOU LOSE...', CX, 4, 8, won ? '#ffd23a' : '#ff5a4a', 'center');
  if (G.t > 30) ['RETRY', 'SELECT CHARACTER'].forEach((m, i) => {
    const sel = (G.ocurOver || 0) === i;
    text((sel ? '> ' : '') + m + (sel ? ' <' : ''), CX, 176 + i * 13, 8, sel ? '#ffd23a' : '#d8c8a8', 'center');
  });
}

function render() {
  ctx.save();
  if (G.shake) ctx.translate(Math.round((Math.random() - .5) * G.shake * 2), Math.round((Math.random() - .5) * G.shake * 2));
  switch (G.scene) {
    case 'title': drawTitle(); break;
    case 'select': drawSelect(); break;
    case 'stage': drawStageSelect(); break;
    case 'over': drawOver(); break;
    default: drawFight(); if (G.paused) drawPause();
  }
  ctx.restore();
}

resize();
if (!BG) { BGS.dojo = buildStageBG('dojo'); BGS.city = buildStageBG('city'); BG = BGS.dojo; }

let last = performance.now(), acc = 0;
function loop(now) {
  acc += Math.min(100, now - last); last = now;
  while (acc >= 1000 / 60) { step(); acc -= 1000 / 60; }
  render();
  requestAnimationFrame(loop);
}
const go = () => requestAnimationFrame(t => { last = t; loop(t); });
if (document.fonts && document.fonts.load) {
  Promise.race([document.fonts.load('8px "Press Start 2P"'), new Promise(r => setTimeout(r, 1500))]).then(go, go);
} else go();

// Accès debug pour les tests
window.__SF = G; window.__NET = NET; window.__mkqr = () => makeQRs();
})();
