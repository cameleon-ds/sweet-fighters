/* =========================================================
   SWEET FIGHTERS 2 — moteur de combat pixel art
   Résolution native 384x216, mise à l'échelle "pixelated"
   ========================================================= */
'use strict';
(() => {
const VERSION = 'v13';

let W = 384; const H = 216, GROUND = 190, GRAV = 0.34;
let CX = 192; // centre horizontal
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
    const old = W; W = nw; CX = W / 2;
    cv.width = W; cv.height = H; ctx.imageSmoothingEnabled = false;
    if (typeof makeBG === 'function') BG = makeBG();
    if (typeof G !== 'undefined' && G.f) G.f.forEach(f => { f.x += (W - old) / 2; });
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
  shoji(-80, 82); shoji(18, 82);
  shoji(284, 82); shoji(382, 82);

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
  [-94, 4, 102, 126, 244, 268, 366, 464].forEach(pillar);
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
  lantern(115); lantern(257);
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
    for (let i = -16; i <= 16; i++) {
      const x0 = vx + (i - .5) * pw * s, x1 = vx + (i + .5) * pw * s;
      const tone = tones[(i + 32) % 4];
      F(x0, y, x1 - x0 + 1, 1, shade(tone, depth));
      F(x0, y, 1, 1, shade('#5a3418', depth));
    }
  }
  // Grain du bois et joints de lattes
  for (let i = -16; i <= 16; i++) {
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
  { name: 'KAITO', style: 'tshirt', vneck: true, head: HEAD_KAITO, headBack: HEAD_KAITO_BACK, band: true, torn: true,
    skin:  ['#7a3c1c', '#b8683a', '#e8a46a', '#ffd8a0'],
    hair:  { a: '#2a1a10', h: '#4a3020', H: '#6c4830', L: '#94704a' },
    bandP: ['#08080c', '#18181e', '#2c2c36', '#50505c'],
    top:   ['#8a94b0', '#b8c2dc', '#e4eaf6', '#ffffff'],
    legs:  ['#08080c', '#18181e', '#2e2e3a', '#4c4c5c'],
    belt:  ['#040406', '#121216', '#26262e', '#44444e'],
    glove: ['#08080c', '#18181e', '#2e2e3a', '#565664'],
    fb: ['#ffffff', '#a8f4ff', '#2fb4ff', '#1458c4'] },
  { name: 'SORA', style: 'tshirt', head: HEAD_SORA, headBack: HEAD_SORA_BACK, braid: true, jeans: true, shoes: true,
    skin:  ['#6a3418', '#a45e34', '#d8945c', '#f8c48c'],
    hair:  { a: '#8a5a14', h: '#c08a24', H: '#ecc048', L: '#fff08a' },   // blond
    top:   ['#5a0c0c', '#9a1818', '#d8302a', '#ff7058'],                 // t-shirt rouge
    legs:  ['#16264a', '#2a4478', '#4a6eac', '#82a8dc'],                 // jean bleu
    belt:  ['#2e180a', '#4e2c14', '#704220', '#9a6436'],                 // ceinture cuir
    glove: ['#6a3418', '#a45e34', '#d8945c', '#f8c48c'],                 // mains nues
    fb: ['#ffffff', '#fff2a0', '#ff9c2c', '#c64812'] },
];

// Squelettes : [tête, cou, bassin, coudeAv, mainAv, coudeAr, mainAr, genouAv, piedAv, genouAr, piedAr]
const POSES = {
  idle0:   [3,-55, 1,-47, -1,-29, 9,-40, 14,-48, 4,-38, 9,-45, 7,-15, 11,0, -8,-14, -12,0],
  idle1:   [3,-54, 1,-46, -1,-28, 9,-39, 14,-47, 4,-37, 9,-44, 7,-14, 11,0, -8,-13, -12,0],
  walk0:   [4,-55, 2,-47, 0,-29, 10,-40, 15,-48, 5,-38, 10,-45, 4,-15, 5,0, -3,-15, -5,0],
  walk1:   [4,-56, 2,-48, 0,-30, 10,-41, 15,-49, 5,-39, 10,-46, 10,-16, 15,0, -9,-14, -14,0],
  walk2:   [4,-56, 2,-48, 0,-30, 10,-41, 15,-49, 5,-39, 10,-46, -4,-15, -8,0, 6,-15, 10,0],
  jump:    [3,-58, 1,-50, 0,-34, 9,-44, 13,-51, 4,-42, 9,-48, 9,-30, 6,-20, 2,-26, -4,-18],
  punch0:  [2,-55, 0,-47, -1,-29, 4,-40, 7,-45, -6,-38, -3,-43, 8,-15, 13,0, -9,-14, -13,0],
  punch1:  [5,-55, 3,-47, 0,-29, 15,-46, 27,-47, -4,-38, -1,-43, 9,-15, 14,0, -9,-14, -14,0],
  kick0:   [0,-56, -1,-48, -2,-30, 6,-42, 10,-48, -6,-40, -2,-46, 8,-34, 4,-22, -3,-15, -4,0],
  kick1:   [-3,-55, -3,-47, -1,-30, 4,-42, 8,-48, -9,-40, -6,-46, 14,-36, 30,-38, -3,-15, -4,0],
  special0:[0,-54, -1,-46, -2,-28, -6,-36, -9,-31, -8,-37, -11,-32, 8,-14, 13,0, -10,-13, -15,0],
  special1:[5,-53, 3,-45, 0,-28, 14,-40, 24,-40, 12,-37, 22,-37, 10,-14, 15,0, -10,-12, -16,0],
  upper0:  [4,-46, 2,-38, 0,-22, 8,-30, 10,-24, 4,-30, 8,-36, 10,-12, 12,0, -6,-10, -10,0],
  upper1:  [3,-58, 2,-50, 0,-32, 6,-62, 8,-76, -4,-44, -2,-38, 8,-26, 6,-12, -3,-16, -6,-2],
  upper2:  [3,-58, 1,-50, 0,-34, 8,-56, 12,-66, -4,-44, -2,-38, 9,-30, 6,-20, 2,-26, -4,-18],
  hit:     [-4,-53, -4,-45, -2,-28, 2,-40, 6,-46, -8,-38, -4,-44, 6,-14, 10,0, -9,-13, -13,0],
  block:   [0,-54, -1,-46, -2,-28, 7,-40, 6,-52, 5,-42, 9,-52, 6,-14, 10,0, -9,-13, -14,0],
  jkick:   [0,-56, -1,-48, 0,-32, 6,-44, 10,-50, -6,-42, -2,-48, 12,-24, 25,-14, 0,-24, -6,-18],
  jpunch:  [4,-56, 2,-48, 0,-32, 12,-42, 22,-34, -4,-42, 0,-48, 8,-28, 4,-18, 0,-26, -6,-20],
  crouch:  [4,-38, 2,-31, -1,-15, 10,-24, 14,-31, 5,-22, 10,-28, 12,-10, 13,0, -8,-4, -16,0],
  cblock:  [1,-37, 0,-30, -2,-15, 7,-25, 6,-36, 5,-26, 9,-36, 11,-10, 12,0, -8,-4, -16,0],
  cpunch:  [5,-37, 3,-30, 0,-15, 15,-30, 27,-31, -4,-23, -1,-28, 12,-10, 13,0, -8,-4, -16,0],
  ckick:   [-3,-35, -4,-28, -2,-14, 4,-22, 8,-28, -10,-20, -14,-8, 14,-6, 30,-2, -8,-4, -14,0],
  tatsu:   [1,-58, 0,-50, 0,-34, -7,-46, -13,-44, 6,-46, 12,-44, 14,-36, 30,-37, 3,-24, -3,-17],
  parry:   [2,-55, 0,-47, -1,-29, 10,-44, 16,-53, 8,-42, 15,-47, 8,-15, 12,0, -9,-14, -13,0],
  stunned: [-3,-52, -3,-44, -1,-28, 2,-36, 4,-29, -7,-36, -5,-29, 6,-14, 10,0, -8,-13, -12,0],
  throw0:  [4,-55, 2,-47, 0,-29, 14,-46, 22,-48, 10,-44, 20,-44, 8,-15, 13,0, -9,-14, -14,0],
  throwS:  [6,-51, 4,-43, 1,-27, 12,-35, 19,-25, 10,-33, 17,-23, 10,-13, 14,0, -9,-12, -14,0],
  throwT:  [-2,-56, -2,-48, -1,-30, -6,-60, -12,-68, -4,-58, -10,-66, 7,-15, 11,0, -9,-14, -13,0],
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
  const x0 = Math.round(q[0]) - (dir > 0 ? 1 : 3);
  sR(x0, Math.round(q[1]) - 2, 5, 2, skin[1]);
  sR(x0 + (dir > 0 ? 0 : 1), Math.round(q[1]) - 2, 4, 1, skin[2]);
}

function drawFighter(f, x = f.x, y = f.y) {
  const d = f.def, P = POSES[poseOf(f)];
  const dir = f.state === 'tatsu' && f.t >= 4 && ((f.t >> 2) & 1) ? -f.dir : f.dir;
  // Regard vers la droite : vue de face 3/4 · regard vers la gauche : vue de dos 3/4
  const backView = false;   // vue de dos 3/4 désactivée pour l'instant (design cohérent)
  sx.clearRect(0, 0, SPR.width, SPR.height);
  // Jambes plus courtes que le haut du corps (proportions trapues)
  const Q = P.slice(), LF = .82, px0 = Q[4], py0 = Q[5];
  const footBefore = Math.max(Q[17], Q[21]);
  for (const i of [7, 8, 9, 10]) { Q[i * 2] = px0 + (Q[i * 2] - px0) * LF; Q[i * 2 + 1] = py0 + (Q[i * 2 + 1] - py0) * LF; }
  const lift = footBefore - Math.max(Q[17], Q[21]);
  for (let i = 1; i < Q.length; i += 2) Q[i] += lift;
  const pt = i => [OX + dir * Q[i * 2] * K, OY + Q[i * 2 + 1] * K];
  const [h, n, p, fe, fh, be, bh, fk, ff, bk, bf] = [0,1,2,3,4,5,6,7,8,9,10].map(pt);
  const sk = d.skin, top = d.top, legs = d.legs;
  const dim = pal => [pal[0], pal[0], pal[1], pal[1]];   // membre éloigné de la caméra, dans l'ombre
  const tshirt = d.style === 'tshirt';

  let ux = p[0] - n[0], uy = p[1] - n[1]; const ul = Math.hypot(ux, uy) || 1; ux /= ul; uy /= ul;
  const fwd = [uy * dir, -ux * dir];
  const sh = add(n, [ux, uy], 1);
  // épaules écartées : avant (côté adversaire) et arrière (côté caméra)
  const sdA = add(sh, fwd, 3.5), sdB = add(sh, fwd, -4.5);

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
  const arm = (s0, e, hd, near) => {
    const S = near ? sk : dim(sk), T = near ? top : dim(top), Gl = near ? d.glove : dim(d.glove);
    limbT(s0, e, near ? 5 : 4.5, 4, near ? 1.2 : 1, S);
    limbT(s0, mix(s0, e, tshirt ? .4 : 1), near ? 6 : 5.5, near ? 5.5 : 5, tshirt ? 0 : .5, T);
    limbT(e, hd, near ? 4.5 : 4, near ? 3.5 : 3, 1, S);
    if (!tshirt) limbT(e, mix(e, hd, .25), 5.5, 5.5, 0, T);
    fist(hd, dir, Gl, S);
  };
  const leg = (k, ft, near) => {
    const Lg = near ? legs : dim(legs), S = near ? sk : dim(sk);
    limbT(p, k, 7, 5, .8, Lg);
    if (d.torn) {
      limbT(k, ft, 4, 3, 1, S);
      const cut = mix(k, ft, .45);
      limbT(k, cut, 6, 5.5, 0, Lg);
      if (near) {
        sR(cut[0] - 2, cut[1] + 2, 1, 1, Lg[1]); sR(cut[0] + 1, cut[1] + 2, 1, 1, Lg[1]);
        const tr = mix(p, k, .6); sR(tr[0] + dir, tr[1], 2, 1, sk[2]);
      }
    } else limbT(k, ft, 5.5, 4.5, .8, Lg);
    if (d.shoes) shoeP(ft, dir, !near); else footP(ft, dir, S);
    if (d.jeans && near) { const kp = mix(p, k, .75); sR(kp[0] - 1, kp[1], 2, 2, Lg[3]); }   // délavé au genou
  };

  // ---- Plan arrière ----
  if (!backView) { drawBand(); drawBraid(); }
  // Le bras éloigné (celui qui frappe) passe derrière le torse ; le bras proche de la caméra
  // part de l'épaule arrière, ce qui laisse voir pectoraux et abdos en vue de face.
  const guard = !backView && ['idle', 'walk', 'crouch', 'jump', 'land', 'getup', 'parry', 'hit', 'stunned', 'kick', 'ckick', 'jkick'].includes(f.state);
  const bob = f.state === 'idle' && ((G.frame / 18 | 0) + f.id) % 2 ? 1 : 0;
  if (guard && f.state !== 'parry') {
    // bras avant tendu devant, à hauteur d'épaule, bien à droite du torse
    const e1 = add(sdA, [dir * 4, 1 + bob]), h1 = add(sdA, [dir * 8.5, -.5 + bob]);
    arm(sdA, e1, h1, true);
  } else arm(sdA, fe, fh, !backView);
  leg(fk, ff, false);   // jambe avant (côté adversaire) derrière, dans l'ombre

  // ---- Torse ----
  const wa = add(p, [-ux, -uy], 1);
  const at = t => mix(sh, wa, t);
  const tw = 1.15;   // torse plus large (on le voit de 3/4)
  const torso = [add(sh, fwd, 6 * tw), add(at(.3), fwd, 6.5 * tw), add(at(.75), fwd, 5 * tw), add(wa, fwd, 4.5 * tw),
                 add(wa, fwd, -4 * tw), add(at(.6), fwd, -5 * tw), add(at(.25), fwd, -6 * tw), add(sh, fwd, -5.5 * tw)];
  sPoly(grow(torso, .6), top[0]);
  sPoly(torso, top[2]);
  if (backView) {
    // Dos : omoplates éclairées, colonne vertébrale, flanc avant dans l'ombre
    sPoly([add(sh, fwd, 6), add(sh, fwd, 3), add(at(.6), fwd, 2.5), add(wa, fwd, 2), add(wa, fwd, 4.5), add(at(.75), fwd, 5), add(at(.3), fwd, 6.5)], top[1]);
    sPoly([add(sh, fwd, -5), add(sh, fwd, -1), add(at(.3), fwd, -1.5), add(at(.32), fwd, -5)], top[3]);
    for (let t = .1; t <= .85; t += .12) { const q = add(at(t), fwd, .5); sR(q[0], q[1], 1, 1, top[1]); }
    const bl1 = add(at(.35), fwd, -3); sR(bl1[0], bl1[1], 2, 1, top[1]);
    const bl2 = add(at(.35), fwd, 2.5); sR(bl2[0], bl2[1], 2, 1, top[1]);
  } else {
    sPoly([add(sh, fwd, -5.5), add(sh, fwd, -2.5), add(at(.6), fwd, -2), add(wa, fwd, -1.5), add(wa, fwd, -4), add(at(.6), fwd, -5), add(at(.25), fwd, -6)], top[1]);
    sPoly([add(sh, fwd, 2), add(sh, fwd, 5.5), add(at(.28), fwd, 5.5), add(at(.22), fwd, 2.5)], top[3]);
    if (tshirt) {
      // t-shirt moulant : ombre sous les pectoraux, ligne centrale des abdos
      for (let k = -3; k <= 5; k++) { const q = add(at(.42), fwd, k); sR(q[0], q[1], 1, 1, top[1]); }
      for (let t = .48; t <= .85; t += .1) { const q = add(at(t), fwd, 1.2); sR(q[0], q[1], 1, 1, top[1]); }
      const a1 = add(at(.62), fwd, -1.5), a2 = add(at(.62), fwd, 3.5); sR(a1[0], a1[1], 2, 1, top[1]); sR(a2[0], a2[1], 2, 1, top[1]);
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
    const pl = add(at(.22), fwd, -1); sR(pl[0], pl[1], 2, 1, sk[1]);
    const pr = add(at(.22), fwd, 2.5); sR(pr[0], pr[1], 2, 1, sk[1]);
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
  if (backView) { drawBraid(); drawBand(); arm(sdB, be, bh, true); }
  else {
    // Vue de face : en garde, le bras proche reste sur le côté gauche du corps
    // (coude vers le bas, poing devant les côtes) pour dégager pectoraux et abdos.
    const guard2 = ['idle', 'walk', 'punch', 'kick', 'crouch', 'cpunch', 'ckick', 'jpunch', 'jkick', 'jump', 'land', 'getup', 'hit', 'stunned'].includes(f.state);
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
  ctx.drawImage(SPR, Math.round(x) - OX * UP, Math.round(y) - OY * UP, SPR.width * UP, SPR.height * UP);
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
})();

// Bouton « Continuer » de l'écran portrait (rotation verrouillée)
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

function readPlayer() {
  const K = k => keys.has(k) || latched.has(k);
  const r = {
    l: K('l') || touch.x < -0.4,
    r: K('r') || touch.x > 0.4,
    u: K('u') || touch.y < -0.5,
    d: K('d') || touch.y > 0.5,
    p: K('p') || touch.btn.has('p'),
    k: K('k') || touch.btn.has('k'),
    s: K('s') || touch.btn.has('s'),
    x: K('x') || touch.btn.has('x'),
    start: K('start'),
    back: K('back'),
  };
  latched.clear();
  return r;
}

const makeCtl = () => ({ held: {}, prev: {}, buf: {} });
function ctlUpdate(c, held) {
  c.prev = c.held; c.held = held;
  for (const b of [...BTNS, 'start', 'back', 'l', 'r', 'u', 'd']) {
    if (held[b] && !c.prev[b]) c.buf[b] = 8;
    else if (c.buf[b] > 0) c.buf[b]--;
  }
}
function take(c, b) { if (c.buf[b] > 0) { c.buf[b] = 0; return true; } return false; }
const edge = (c, b) => !!(c.held[b] && !c.prev[b]);
// Menus : A (ou Entrée) valide, B (ou Échap) revient en arrière
const okPress = c => edge(c, 's') || edge(c, 'start');
const backPress = c => edge(c, 'k') || edge(c, 'back');

/* ---------------- Données d'attaque ---------------- */
const ATK = {
  punch:    { dur: 18, act: [4, 10], box: [14, -76, 43, -59], dmg: 7,  stun: 15, bstun: 10, push: 2.6, sfx: 'hit' },
  kick:     { dur: 24, act: [7, 13], box: [17, -63, 49, -42], dmg: 9,  stun: 17, bstun: 12, push: 3.0, sfx: 'hit' },
  jpunch:   { act: [3, 16], box: [11, -59, 38, -34], high: true, dmg: 8,  stun: 16, bstun: 10, push: 2.0, sfx: 'hit' },
  jkick:    { act: [3, 18], box: [8, -42, 43, -11],  high: true, dmg: 10, stun: 18, bstun: 12, push: 2.4, sfx: 'hit' },
  cpunch:   { dur: 16, act: [3, 8],  box: [14, -50, 42, -35], dmg: 6,  stun: 13, bstun: 9,  push: 2.2, sfx: 'hit' },
  ckick:    { dur: 28, act: [6, 12], box: [14, -14, 49, 0],   dmg: 9,  knock: true, low: true, bstun: 12, push: 2.4, sfx: 'hit' },
  tatsu:    { act: [4, 90], box: [-42, -70, 45, -39], dmg: 12, knock: true, high: true, bstun: 14, push: 2.6, sfx: 'heavy', sym: true },
  uppercut: { act: [3, 15], box: [0, -115, 31, -36], dmg: 14, knock: true, bstun: 16, push: 2.0, sfx: 'heavy' },
};
const FB_HIT = { dmg: 10, stun: 18, bstun: 14, push: 2.6, chip: 2, sfx: 'heavy' };
const ATTACKING = ['punch', 'kick', 'cpunch', 'ckick', 'jpunch', 'jkick', 'tatsu', 'uppercut', 'special'];
const NEUTRAL = ['idle', 'walk', 'block', 'crouch', 'cblock'];

/* ---------------- État du jeu ---------------- */
const G = {
  scene: 'title', frame: 0, t: 0, round: 1, timer: 99, tick: 0,
  pick: 0, freeze: 0, shake: 0, f: [], fbs: [], sparks: [], popups: [], msg: null, winner: null, fighting: false,
};
const pctl = makeCtl();

function makeFighter(def, id, x, dir, cpu) {
  return {
    def, id, x, y: GROUND, vx: 0, vy: 0, dir, cpu, hp: 100, lag: 100, lagT: 0,
    state: 'idle', t: 0, air: false, airAtk: false, hasHit: false, stun: 0, bstun: 0,
    invuln: 0, flash: 0, fb: null, wins: 0, ko: false, landT: 0,
    ctl: makeCtl(), ai: { cd: 30, hold: {}, holdT: 0, press: null, pressU: false, pressFrames: 0, reacted: false },
  };
}

function setState(f, s) { f.state = s; f.t = 0; f.hasHit = false; }
function face(f, o) { f.dir = o.x >= f.x ? 1 : -1; }

function poseOf(f) {
  switch (f.state) {
    case 'idle': return ((G.frame / 18 | 0) + f.id) % 2 ? 'idle1' : 'idle0';
    case 'walk': return ['walk0', 'walk1', 'walk0', 'walk2'][(f.t / 7 | 0) % 4];
    case 'block': return 'block';
    case 'crouch': return 'crouch';
    case 'cblock': return 'cblock';
    case 'cpunch': return f.t < 3 || f.t >= 8 ? 'crouch' : 'cpunch';
    case 'ckick': return f.t < 6 || f.t >= 12 ? 'crouch' : 'ckick';
    case 'tatsu': return f.t < 4 ? 'jump' : 'tatsu';
    case 'jump': return 'jump';
    case 'jpunch': return f.t < 3 ? 'jump' : 'jpunch';
    case 'jkick': return f.t < 3 ? 'jump' : 'jkick';
    case 'punch': return f.t < 4 || f.t >= 10 ? 'punch0' : 'punch1';
    case 'kick': return f.t < 7 || f.t >= 13 ? 'kick0' : 'kick1';
    case 'special': return f.t < 12 ? 'special0' : 'special1';
    case 'uppercut': return f.t < 3 ? 'upper0' : (f.vy < 0 ? 'upper1' : 'upper2');
    case 'land': case 'getup': return 'upper0';
    case 'hit': return 'hit';
    case 'fall': return 'fall';
    case 'down': return 'down';
    case 'win': return 'win';
    case 'parry': return 'parry';
    case 'stunned': return 'stunned';
    case 'throw': return f.t < 8 ? 'throw0' : (f.throwType === 'slam' ? 'throwS' : 'throwT');
  }
  return 'idle0';
}

function threatened(f, o) {
  const dist = Math.abs(o.x - f.x);
  if (ATTACKING.includes(o.state) && dist < 120) return true;
  if (o.fb && Math.sign(o.fb.vx) === Math.sign(f.x - o.fb.x) && Math.abs(o.fb.x - f.x) < 110) return true;
  return false;
}

function spawnFireball(f) {
  f.fb = { owner: f, x: f.x + f.dir * 40, y: f.y - 56, vx: 3.8 * f.dir, dir: f.dir, t: 0, alive: true };
  G.fbs.push(f.fb);
  sfx('fb');
}

function updFighter(f, o) {
  const c = f.ctl, h = c.held;
  const fwd = f.dir > 0 ? h.r : h.l, back = f.dir > 0 ? h.l : h.r;
  f.t++;
  if (f.invuln > 0) f.invuln--;
  if (f.flash > 0) f.flash--;
  if (f.counterT > 0) f.counterT--;
  const live = G.fighting;

  switch (f.state) {
    case 'idle': case 'walk': case 'block': case 'crouch': case 'cblock': {
      if ((f.state === 'block' || f.state === 'cblock') && f.bstun > 0) { f.bstun--; f.vx *= .8; break; }
      face(f, o);
      if (!live) { f.vx = 0; if (f.state !== 'idle') setState(f, 'idle'); break; }
      if (take(c, 's')) {
        if (h.u) { setState(f, 'uppercut'); f.vx = 0; f.invuln = 9; break; }
        if (!f.fb) { setState(f, 'special'); f.vx = 0; break; }
      }
      // Prise après un contre réussi : Y renverse, B projette de l'autre côté
      if (f.counterT > 0 && o.state === 'stunned' && Math.abs(o.x - f.x) < 80) {
        if (take(c, 'p')) { doThrow(f, o, 'slam'); break; }
        if (take(c, 'k')) { doThrow(f, o, 'toss'); break; }
      }
      // Contre (X) : fenêtre de parade
      if (take(c, 'x')) { setState(f, 'parry'); f.vx = 0; sfx('whoosh'); break; }
      // Saut : stick vers le haut (court délai pour laisser passer haut + A)
      if (h.u) {
        f.jumpQ = (f.jumpQ || 0) + 1;
        if (f.jumpQ >= 4) {
          f.jumpQ = 0;
          setState(f, 'jump'); f.vy = -7.4; f.air = true; f.airAtk = false;
          f.vx = (fwd ? 2.2 : back ? -2.2 : 0) * f.dir; break;
        }
      } else f.jumpQ = 0;
      // Accroupi : coups bas, garde basse avec bas + arrière
      if (h.d) {
        f.vx = 0;
        if (take(c, 'p')) { setState(f, 'cpunch'); sfx('whoosh'); break; }
        if (take(c, 'k')) { setState(f, 'ckick'); sfx('whoosh'); break; }
        const want = back && threatened(f, o) ? 'cblock' : 'crouch';
        if (f.state !== want) { setState(f, want); f.bstun = 0; }
        break;
      }
      if (take(c, 'p')) { setState(f, 'punch'); f.vx = 0; sfx('whoosh'); break; }
      if (take(c, 'k')) { setState(f, 'kick'); f.vx = 0; sfx('whoosh'); break; }
      if (back && threatened(f, o)) { f.vx = 0; if (f.state !== 'block') { setState(f, 'block'); f.bstun = 0; } break; }
      if (fwd) { f.vx = 1.8 * f.dir; if (f.state !== 'walk') setState(f, 'walk'); }
      else if (back) { f.vx = -1.4 * f.dir; if (f.state !== 'walk') setState(f, 'walk'); }
      else { f.vx = 0; if (f.state !== 'idle') setState(f, 'idle'); }
      break;
    }
    case 'punch': case 'kick': case 'cpunch': case 'ckick':
      if (f.t >= ATK[f.state].dur) setState(f, h.d ? 'crouch' : 'idle');
      break;
    case 'special':
      if (f.t === 12) spawnFireball(f);
      if (f.t >= 40) setState(f, 'idle');
      break;
    case 'uppercut':
      if (f.t === 3) { f.vy = -8.6; f.vx = 1.6 * f.dir; f.air = true; sfx('upper'); }
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
    case 'hit': f.vx *= .82; if (f.t >= f.stun) setState(f, 'idle'); break;
    case 'down':
      f.vx *= .8;
      if (!f.ko && f.t >= 40) { setState(f, 'getup'); f.invuln = 22; }
      break;
    case 'getup': if (f.t >= 16) setState(f, 'idle'); break;
    case 'parry': f.vx = 0; if (f.t >= 22) setState(f, 'idle'); break;
    case 'stunned': f.vx *= .8; if (f.t >= f.stun) setState(f, 'idle'); break;
    case 'throw': f.vx = 0; if (f.t >= 26) setState(f, 'idle'); break;
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
  f.x = Math.max(18, Math.min(W - 18, f.x));

  // Barre de vie « traînante »
  if (f.lag > f.hp) { if (f.lagT > 0) f.lagT--; else f.lag = Math.max(f.hp, f.lag - .6); }
}

function hurtbox(f) {
  if (f.invuln > 0 || ['fall', 'down', 'getup'].includes(f.state)) return null;
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
  if (d.air || !NEUTRAL.includes(d.state)) return false;
  const h = d.ctl.held;
  if (!(fromX < d.x ? h.r : h.l)) return false;
  if (data.low && !h.d) return false;   // balayage : garde basse obligatoire
  if (data.high && h.d) return false;   // attaque sautée : garde debout obligatoire
  return true;
}

function doThrow(f, o, type) {
  setState(f, 'throw'); f.throwType = type; f.vx = 0; f.counterT = 0;
  o.hp = Math.max(0, o.hp - (type === 'slam' ? 14 : 12)); o.lagT = 32; o.flash = 3; o.invuln = 0;
  setState(o, 'fall'); o.air = true;
  if (type === 'slam') { o.vy = -3.6; o.vx = f.dir * 1.4; }
  else { o.vy = -7; o.vx = -f.dir * 3.6; o.y -= 4; }
  G.freeze = 8; G.shake = 6; sfx('heavy');
  addPopup(f.x, f.y - 100, 'PRISE !', '#ff7a3a');
}
function addPopup(x, y, txt, col) { G.popups.push({ x, y, txt, col, t: 0 }); }

function applyHit(att, def, data, sx, sy, fromX, projectile) {
  // Contre réussi : l'attaquant est bloqué une demi-seconde
  if (def.state === 'parry' && def.t <= 12) {
    G.freeze = 10; addSpark(sx, sy, 'parry'); sfx('parry');
    if (projectile) return;
    if (att.air) { setState(att, 'fall'); att.vy = -3; att.vx = (att.x < def.x ? -1 : 1) * 1.6; }
    else { setState(att, 'stunned'); att.stun = 30; att.vx = 0; }
    setState(def, 'idle'); def.counterT = 34; def.vx = 0;
    addPopup(def.x, def.y - 100, 'CONTRE !', '#7af0ff');
    return;
  }
  const away = fromX < def.x ? 1 : -1;
  if (isBlocking(def, fromX, data)) {
    setState(def, def.ctl.held.d ? 'cblock' : 'block'); def.bstun = data.bstun; def.vx = away * data.push;
    const chip = projectile ? data.chip : (data.knock ? 1 : 0);
    if (chip) { def.hp = Math.max(1, def.hp - chip); def.lagT = 30; }
    G.freeze = 5; addSpark(sx, sy, 'block'); sfx('block');
    return;
  }
  def.hp = Math.max(0, def.hp - data.dmg); def.lagT = 32;
  def.flash = 3;
  if (def.air || data.knock || def.hp <= 0) {
    setState(def, 'fall'); def.air = true; def.vy = -4.8; def.vx = away * 2.3;
    if (def.fb && def.state !== 'special') {}
  } else {
    setState(def, 'hit'); def.stun = data.stun; def.vx = away * data.push;
  }
  G.freeze = 8; G.shake = 4;
  addSpark(sx, sy, projectile ? 'fb' : 'hit', projectile ? att.def.fb : null);
  sfx(data.sfx);
}

function addSpark(x, y, type, pal) { G.sparks.push({ x, y, t: 0, type, pal }); }

/* ---------------- IA du CPU ---------------- */
function press(a, b, up) { a.press = b; a.pressU = !!up; a.pressFrames = 2; }
function lowAttack(a, b) { a.hold = { d: true }; a.holdT = 10; press(a, b); }
function aiInput(f, o) {
  const a = f.ai, held = {};
  const dx = o.x - f.x, dist = Math.abs(dx), fwd = dx > 0 ? 'r' : 'l', back = dx > 0 ? 'l' : 'r';
  if (a.holdT > 0) { a.holdT--; Object.assign(held, a.hold); }
  if (a.press) {
    held[a.press] = true; if (a.pressU) held.u = true;
    if (--a.pressFrames <= 0) { a.press = null; a.pressU = false; }
  }
  if (!G.fighting) return held;
  const neutral = NEUTRAL.includes(f.state);
  if (f.state === 'jump' && !f.airAtk && !a.press) {
    if (dist < 120 && f.vy > -3 && Math.random() < .06) press(a, 's');
    else if (dist < 70 && Math.random() < .12) press(a, 'k');
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
  if (neutral && o.air && dist < 80 && o.vy > -1.5 && Math.random() < .08) press(a, 's', true);
  if (neutral && ['punch', 'kick', 'cpunch'].includes(o.state) && o.t < 5 && dist < 95 && Math.random() < .12) { a.hold = { [back]: true }; a.holdT = 22; }
  if (neutral && ['punch', 'kick', 'cpunch'].includes(o.state) && o.t < 3 && dist < 95 && Math.random() < .07) press(a, 'x');
  if (neutral && f.counterT > 0 && o.state === 'stunned' && dist < 80 && !a.press) press(a, Math.random() < .5 ? 'p' : 'k');
  if (neutral && o.state === 'ckick' && o.t < 6 && dist < 95 && Math.random() < .35) { a.hold = { [back]: true, d: true }; a.holdT = 26; }
  if (neutral && o.state === 'tatsu' && dist < 110 && Math.random() < .08) { a.hold = { [back]: true }; a.holdT = 30; }

  if (--a.cd <= 0 && neutral && !a.press) {
    a.cd = 10 + (Math.random() * 20 | 0);
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
function startMatch(pick) {
  G.f = [makeFighter(DEFS[pick], 0, CX - 80, 1, false), makeFighter(DEFS[1 - pick], 1, CX + 80, -1, true)];
  G.f[0].ctl = pctl;
  G.round = 1;
  startRound();
}
function startRound() {
  const [a, b] = G.f;
  [[a, CX - 80, 1], [b, CX + 80, -1]].forEach(([f, x, d]) => {
    Object.assign(f, { x, y: GROUND, vx: 0, vy: 0, dir: d, hp: 100, lag: 100, air: false, ko: false, fb: null, invuln: 0, flash: 0, counterT: 0, jumpQ: 0 });
    setState(f, 'idle');
    f.ai.holdT = 0; f.ai.press = null; f.ai.cd = 40;
  });
  G.fbs = []; G.sparks = []; G.popups = []; G.timer = 99; G.tick = 0; G.fighting = false;
  G.scene = 'intro'; G.t = 0; G.winner = null;
}

function endRound(winner) {
  G.fighting = false;
  G.winner = winner;
  if (winner) winner.wins++;
}

/* ---------------- Boucle principale ---------------- */
function step() {
  G.frame++;
  ctlUpdate(pctl, readPlayer());

  switch (G.scene) {
    case 'title':
      if (okPress(pctl) || tap) { G.scene = 'select'; G.t = 0; sfx('select'); }
      break;
    case 'select': {
      G.t++;
      if (pctl.buf.l === 8 || pctl.buf.r === 8) { G.pick = 1 - G.pick; sfx('beep'); }
      if (G.t > 10 && okPress(pctl)) { startMatch(G.pick); sfx('select'); }
      else if (G.t > 10 && backPress(pctl)) { G.scene = 'title'; G.t = 0; sfx('beep'); }
      break;
    }
    case 'intro': case 'fight': case 'ko': case 'timeup':
      stepFight();
      break;
    case 'over':
      G.t++;
      if (G.t > 60 && okPress(pctl)) { G.scene = 'select'; G.t = 0; sfx('select'); }
      else if (G.t > 60 && backPress(pctl)) { G.scene = 'title'; G.t = 0; sfx('beep'); }
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
  if (a.cpu) ctlUpdate(a.ctl, aiInput(a, b));
  if (b.cpu) ctlUpdate(b.ctl, aiInput(b, a));

  if (G.shake > 0) G.shake *= .8;
  if (G.shake < .3) G.shake = 0;
  if (G.freeze > 0) { G.freeze--; return; }
  if (G.scene === 'ko' && G.t < 60 && G.t % 2) return; // ralenti du K.O.

  updFighter(a, b); updFighter(b, a);

  // Boules d'énergie
  for (const fb of G.fbs) {
    fb.x += fb.vx; fb.t++;
    if (fb.x < -20 || fb.x > W + 20) fb.alive = false;
  }
  for (let i = 0; i < G.fbs.length; i++) for (let j = i + 1; j < G.fbs.length; j++) {
    const p = G.fbs[i], q = G.fbs[j];
    if (p.alive && q.alive && p.owner !== q.owner && Math.abs(p.x - q.x) < 14 && Math.abs(p.y - q.y) < 14) {
      p.alive = q.alive = false;
      addSpark((p.x + q.x) / 2, p.y, 'fb', p.owner.def.fb); sfx('block');
    }
  }
  for (const fb of G.fbs) {
    if (!fb.alive) continue;
    const def = fb.owner === a ? b : a;
    const hb = hurtbox(def);
    if (overlap([fb.x - 8, fb.y - 7, fb.x + 8, fb.y + 7], hb)) {
      fb.alive = false;
      applyHit(fb.owner, def, FB_HIT, fb.x + fb.dir * 4, fb.y, fb.x - fb.vx * 10, true);
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

  // Séparation des corps
  if (Math.abs(a.y - b.y) < 56 && !['down'].includes(a.state) && !['down'].includes(b.state)) {
    const dx = b.x - a.x, minD = 30;
    if (Math.abs(dx) < minD) {
      const push = (minD - Math.abs(dx)) / 2, s = dx === 0 ? (a.dir > 0 ? 1 : -1) : Math.sign(dx);
      a.x -= push * s; b.x += push * s;
      if (a.x < 18) { b.x += 18 - a.x; a.x = 18; }
      if (b.x < 18) { a.x += 18 - b.x; b.x = 18; }
      if (a.x > W - 18) { b.x -= a.x - (W - 18); a.x = W - 18; }
      if (b.x > W - 18) { a.x -= b.x - (W - 18); b.x = W - 18; }
    }
  }

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
      if (G.f.some(f => f.wins >= 2)) { G.scene = 'over'; G.t = 0; }
      else { G.round++; startRound(); }
    }
  }
}

/* ---------------- Rendu ---------------- */
function drawFireball(fb) {
  const pal = fb.owner.def.fb, x = Math.round(fb.x), y = Math.round(fb.y), d = fb.dir;
  for (let i = 3; i >= 1; i--) disc(x - d * i * 6, y + (((fb.t >> 1) + i) % 2 ? -1 : 1), 7 - i * 1.5 | 0, pal[3]);
  disc(x, y, 8, pal[3]);
  disc(x, y, 7, pal[3]);
  disc(x + d, y, 5, pal[2]);
  disc(x + d * 2, y - 1, 3, pal[1]);
  disc(x + d * 2, y - 1, 1, pal[0]);
  if (fb.t % 4 < 2) { R(x + d * 7, y - 6, 2, 2, pal[1]); R(x - d * 3, y + 7, 2, 2, pal[1]); }
  else { R(x + d * 5, y + 6, 2, 2, pal[1]); R(x - d * 1, y - 8, 2, 2, pal[0]); }
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
  const bw = Math.round(CX - 42);
  drawBar(16, bw, a, true);
  drawBar(W - 16 - bw, bw, b, false);
  // Badge K.O.
  const flash = (a.hp < 25 || b.hp < 25) && (G.frame >> 4) % 2;
  R(CX - 22, 7, 44, 15, '#000');
  R(CX - 21, 8, 42, 13, flash ? '#ffffff' : '#d8261c');
  text('KO', CX, 11, 8, flash ? '#d8261c' : '#ffe14a', 'center', '#5a0a06');
  // Chrono
  text(String(G.timer).padStart(2, '0'), CX, 26, 16, '#ffffff', 'center');
  // Noms + victoires
  text(a.def.name, 16, 24, 8, '#ffffff', 'left');
  text(b.def.name, W - 16, 24, 8, '#ffffff', 'right');
  if (a.cpu === false) text('1P', 16, 35, 8, '#5ac8ff', 'left');
  text('CPU', W - 16, 35, 8, '#ff7a6a', 'right');
  for (let i = 0; i < a.wins; i++) drawMedal(40 + i * 12, 38);
  for (let i = 0; i < b.wins; i++) drawMedal(W - 48 - i * 12, 38);
}
function drawMedal(x, y) {
  disc(x, y, 4, OUT); disc(x, y, 3, '#e8a820'); R(x - 1, y - 2, 2, 2, '#fff2a8');
}

function bigMsg(s, size, col, y = 84) { text(s, W / 2, y, size, col, 'center', '#3a0a04'); }

function drawFight() {
  ctx.drawImage(BG, 0, 0);
  const [a, b] = G.f;
  drawShadow(a); drawShadow(b);
  const order = ATTACKING.includes(a.state) && !ATTACKING.includes(b.state) ? [b, a] : [a, b];
  order.forEach(f => drawFighter(f));
  G.fbs.forEach(drawFireball);
  G.sparks.forEach(drawSpark);
  // étoiles au-dessus d'un combattant sonné
  G.f.forEach(f => {
    if (f.state !== 'stunned') return;
    for (let i = 0; i < 3; i++) {
      const a = G.frame * .15 + i * 2.1;
      R(f.x + Math.cos(a) * 12 - 1, f.y - 92 + Math.sin(a) * 3, 3, 3, i % 2 ? '#ffe14a' : '#ffffff');
    }
  });
  G.popups.forEach(pp => { if ((pp.t >> 2) % 4 !== 3 || pp.t < 30) text(pp.txt, pp.x, pp.y - pp.t * .4, 8, pp.col, 'center'); });
  drawHUD();

  if (G.scene === 'intro') {
    if (G.t < 70) bigMsg('ROUND ' + G.round, 16, '#ffd23a');
    else bigMsg('FIGHT !', 24, '#ff4a2a');
  } else if (G.scene === 'ko') {
    if (G.t < 120) { if ((G.t >> 2) % 2 || G.t > 40) bigMsg('K.O.', 32, '#ff3a2a', 76); }
    else bigMsg(G.winner ? G.winner.def.name + ' GAGNE !' : 'DOUBLE K.O.', 16, '#ffd23a');
  } else if (G.scene === 'timeup') {
    if (G.t < 120) bigMsg('TEMPS ÉCOULÉ', 16, '#ffd23a');
    else bigMsg(G.winner ? G.winner.def.name + ' GAGNE !' : 'MATCH NUL', 16, '#ffd23a');
  }
}

function drawTitle() {
  ctx.drawImage(BG, 0, 0);
  R(0, 0, W, H, 'rgba(10,4,16,.55)');
  // Logo
  ctx.font = '24px "Press Start 2P", monospace';
  const gS = ctx.createLinearGradient(0, 40, 0, 64);
  gS.addColorStop(0, '#ffd6f0'); gS.addColorStop(.5, '#ff6ec4'); gS.addColorStop(1, '#c42a8a');
  text('SWEET', CX - 22, 40, 24, gS, 'center', '#3a0626');
  const gF = ctx.createLinearGradient(0, 72, 0, 88);
  gF.addColorStop(0, '#fff6b0'); gF.addColorStop(.5, '#ffd23a'); gF.addColorStop(1, '#ff8a1a');
  text('FIGHTERS', CX - 22, 72, 16, gF, 'center', '#4a1600');
  const g2 = ctx.createLinearGradient(0, 38, 0, 88);
  g2.addColorStop(0, '#ffb0a0'); g2.addColorStop(.5, '#ff3a2a'); g2.addColorStop(1, '#a01010');
  text('2', CX + 76, 40, 48, g2, 'center', '#2a0404');
  // Combattants
  const fa = { def: DEFS[0], dir: 1, state: 'idle', id: 0, flash: 0, t: 0, x: 0, y: 0 };
  const fb = { def: DEFS[1], dir: -1, state: 'idle', id: 1, flash: 0, t: 0, x: 0, y: 0 };
  drawFighter(fa, CX - 160, 196); drawFighter(fb, CX + 160, 196);
  text(VERSION, W - 6, H - 12, 8, '#9a8a70', 'right');
  if ((G.frame >> 5) % 2 === 0) text(isTouch ? 'APPUIE SUR A' : 'APPUIE SUR ENTRÉE', W / 2, 122, 8, '#ffffff', 'center');
  if (!isTouch) {
    text('FLÈCHES : BOUGER  HAUT SAUT  BAS ACCROUPI', W / 2, 138, 8, '#d8c8a8', 'center');
    text('J POING   K PIED   ESPACE CONTRE', W / 2, 150, 8, '#d8c8a8', 'center');
    text('L SPÉCIAL   HAUT + L UPPERCUT', W / 2, 162, 8, '#d8c8a8', 'center');
    text('EN L\'AIR + L : PIED TOURNOYANT', W / 2, 174, 8, '#d8c8a8', 'center');
    text('CONTRE RÉUSSI + J OU K : PRISE', W / 2, 186, 8, '#d8c8a8', 'center');
  } else {
    text('STICK HAUT : SAUT   X : CONTRE', W / 2, 144, 8, '#d8c8a8', 'center');
    text('A SPÉCIAL   HAUT + A UPPERCUT', W / 2, 156, 8, '#d8c8a8', 'center');
    text('EN L\'AIR + A : PIED TOURNOYANT', W / 2, 168, 8, '#d8c8a8', 'center');
    text('CONTRE RÉUSSI + Y OU B : PRISE', W / 2, 180, 8, '#d8c8a8', 'center');
  }
}

function drawSelect() {
  ctx.drawImage(BG, 0, 0);
  R(0, 0, W, H, 'rgba(10,4,16,.6)');
  text('CHOISIS TON COMBATTANT', W / 2, 18, 8, '#ffd23a', 'center');
  [0, 1].forEach(i => {
    const x = i === 0 ? CX - 96 : CX + 6, sel = G.pick === i;
    R(x, 40, 90, 140, sel ? ((G.frame >> 3) % 2 ? '#ffd23a' : '#ff6a1a') : '#3a2a3a');
    R(x + 3, 43, 84, 134, '#1a1020');
    R(x + 3, 43, 84, 134, sel ? 'rgba(80,40,120,.6)' : 'rgba(30,20,40,.6)');
    ctx.save();
    ctx.translate(x + 45, 174);
    ctx.scale(1.35, 1.35);
    const f = { def: DEFS[i], dir: i === 0 ? 1 : -1, state: sel ? 'idle' : 'idle', id: i, flash: 0, t: 0 };
    drawFighter(f, 0, 0);
    ctx.restore();
    text(DEFS[i].name, x + 45, 186, 8, sel ? '#ffffff' : '#9a8aa0', 'center');
    if (sel) text('1P', x + 45, 30, 8, '#5ac8ff', 'center');
  });
  text(isTouch ? 'A : VALIDER   B : RETOUR' : 'ENTRÉE : VALIDER   ÉCHAP : RETOUR', W / 2, 202, 8, '#d8c8a8', 'center');
}

function drawOver() {
  drawFight();
  R(0, 0, W, H, 'rgba(0,0,0,.45)');
  const p = G.f.find(f => !f.cpu);
  const won = p ? p.wins >= 2 : true;
  bigMsg(won ? 'VICTOIRE !' : 'DÉFAITE...', 24, won ? '#ffd23a' : '#ff5a4a', 80);
  if (G.t > 60 && (G.frame >> 5) % 2 === 0) text(isTouch ? 'A : REJOUER   B : MENU' : 'ENTRÉE : REJOUER   ÉCHAP : MENU', W / 2, 124, 8, '#ffffff', 'center');
}

function render() {
  ctx.save();
  if (G.shake) ctx.translate(Math.round((Math.random() - .5) * G.shake * 2), Math.round((Math.random() - .5) * G.shake * 2));
  switch (G.scene) {
    case 'title': drawTitle(); break;
    case 'select': drawSelect(); break;
    case 'over': drawOver(); break;
    default: drawFight();
  }
  ctx.restore();
}

resize();
if (!BG) BG = makeBG();

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
window.__SF = G;
})();
