// Line stadium (visualizevalue × story.gaffer) — single-frame renderer. See references/style-line-stadium.md.
// BEAT=hook | trend | verdict   P=0..1 (how far the draw-on has got; 1 = finished)
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
const HERE = path.dirname(fileURLToPath(import.meta.url));
const SK = path.resolve(HERE, "../..");
const { createCanvas, GlobalFonts } = await import(path.join(SK, "node_modules/@napi-rs/canvas/index.js"));
GlobalFonts.registerFromPath(process.env.HEAD_FONT || path.join(SK, "assets/fonts/Poppins-Bold.ttf"), "Head");
GlobalFonts.registerFromPath(path.join(SK, "assets/fonts/SpaceMono-Bold.ttf"), "Mono");
const OUT = path.join(HERE, "out"); fs.mkdirSync(OUT, { recursive: true });
// Demo palette. In a film: bg = B.c.bg, fg = B.c.fg, accent = B.c.accent from the project kit.
const C = { bg: "#050505", fg: "#F2F2F2", accent: "#E4002B" };
const BEAT = process.env.BEAT || "hook", PR = Math.max(0, Math.min(1, +(process.env.P ?? (BEAT === "verdict" ? .35 : 1))));
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const rgba = (h, a) => `rgba(${hex(h).join(",")},${a})`;
const hash = (n) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const eIO = (x) => (x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);

const W = 1080, H = 1920, CX = W / 2;
const cv = createCanvas(W, H), ctx = cv.getContext("2d");
ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);                       // flat plate: no gradient, grain, vignette
ctx.lineCap = "round"; ctx.lineJoin = "round";

// ---- helpers ------------------------------------------------------------------------------------
const stroke = (col, a, w = 2.5) => { ctx.strokeStyle = rgba(col, a); ctx.lineWidth = w; };
// draw a polyline only up to fraction k of its length (the visualizevalue draw-on)
function drawPart(pts, k) {
  const seg = []; let L = 0;
  for (let i = 1; i < pts.length; i++) { const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); seg.push(d); L += d; }
  let left = L * k; ctx.beginPath(); ctx.moveTo(...pts[0]);
  for (let i = 1; i < pts.length && left > 0; i++) {
    const d = seg[i - 1], f = Math.min(1, left / d);
    ctx.lineTo(pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * f, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * f); left -= d;
  }
  ctx.stroke();
}
function mono(text, x, y, size, col, a = 1, align = "left", track = .15) {
  ctx.save(); ctx.font = `${size}px Mono`; ctx.fillStyle = rgba(col, a); ctx.textBaseline = "alphabetic";
  const lines = text.split("\n");
  lines.forEach((ln, i) => {
    const chars = [...ln.toUpperCase()], w = chars.reduce((s, c) => s + ctx.measureText(c).width + size * track, 0) - size * track;
    let cx = align === "center" ? x - w / 2 : align === "right" ? x - w : x;
    chars.forEach((c) => { ctx.fillText(c, cx, y + i * size * 1.3); cx += ctx.measureText(c).width + size * track; });
  });
  ctx.restore();
}
// headline: sentence case, *emphasis* in the accent (story.gaffer), left at x = 9 %
function headline(text, y = 250, size = 88) {
  ctx.save(); ctx.font = `${size}px Head`; ctx.textBaseline = "alphabetic";
  const x0 = W * .09, maxW = W * .78; let x = x0, line = 0;
  for (const tok of text.split(" ")) {
    const em = /^\*.*\*[.?,]?$/.test(tok), raw = tok.replace(/\*/g, ""), w = ctx.measureText(raw + " ").width;
    if (x + ctx.measureText(raw).width > x0 + maxW) { x = x0; line++; }
    ctx.fillStyle = em ? C.accent : C.fg; ctx.fillText(raw, x, y + line * size * 1.1); x += w;
  }
  ctx.restore();
}
function chip() {                                                    // outline brand chip (our brand, never theirs)
  stroke(C.fg, .7, 2); ctx.strokeRect(W * .09, 100, 34, 34);
  mono("GOONERBURGER", W * .09 + 52, 125, 22, C.fg, .7);
}

// ---- pitch markings in perspective (story.gaffer camera, visualizevalue lines) ----------------------
const cam = { x: 34, y: 26, z: 30 }, tilt = 1.05, F = 1000, HOR = 1320;   // low, behind the box: the goal end fills the stage
const P = (x, z, y = 0) => {
  const dx = x - cam.x, dy = y - cam.y, dz = cam.z - z;
  const ty = dy * Math.cos(tilt) + dz * Math.sin(tilt), tz = -dy * Math.sin(tilt) + dz * Math.cos(tilt);
  return [CX + F * dx / tz, HOR - F * ty / tz];
};
const seg3 = (pts) => pts.map(([x, z, y = 0]) => P(x, z, y));
function pitch(k) {                                                   // goal end, 68 wide, goal at z = 0
  stroke(C.fg, .45);
  const parts = [
    seg3([[0, 30], [0, 0], [68, 0], [68, 30]]),                       // touchlines + goal line (cut before the camera)
    seg3([[13.85, 0], [13.85, 16.5], [54.15, 16.5], [54.15, 0]]),     // box
    seg3([[24.85, 0], [24.85, 5.5], [43.15, 5.5], [43.15, 0]]),       // six-yard box
    seg3(Array.from({ length: 17 }, (_, i) => { const a = .93 + i / 16 * (Math.PI - 1.86); return [34 + 9.15 * Math.cos(a), 11 + 9.15 * Math.sin(a)]; })),
  ];
  parts.forEach((p, i) => drawPart(p, Math.max(0, Math.min(1, k * parts.length - i * .6))));
  // goal as a wire frame with a sparse net
  const g = seg3([[30.34, 0], [30.34, 0, 2.44], [37.66, 0, 2.44], [37.66, 0]]); stroke(C.fg, .8); drawPart(g, k);
  if (k > .7) { stroke(C.fg, .18, 1.5);
    for (let i = 1; i < 8; i++) { const x = 30.34 + i * 7.32 / 8; drawPart(seg3([[x, 0], [x, 0, 2.44]]), 1); }
    for (let j = 1; j < 3; j++) drawPart(seg3([[30.34, 0, j * .81], [37.66, 0, j * .81]]), 1); }
}

// ---- beats ----------------------------------------------------------------------------------------
if (BEAT === "hook") {
  chip();
  mono("— SATU MUSIM, SETIAP SENTUHAN", W * .09, 196, 22, C.fg, .35);
  headline("Ia menyentuh bola di kotak lawan *312* kali.", 310);
  // counter
  ctx.save(); ctx.font = "150px Mono"; ctx.fillStyle = C.fg; ctx.textAlign = "center"; ctx.fillText(String(Math.round(312 * eIO(PR))), CX, 660); ctx.restore();
  mono("SENTUHAN DI KOTAK PENALTI", CX, 712, 22, C.fg, .55, "center");
  pitch(Math.min(1, PR * 1.6));
  // dot heatmap: appears as the counter rises (seeded from index, rule 7)
  const n = Math.round(312 * eIO(PR));
  for (let i = 0; i < n; i++) {
    const x = 18 + hash(i) * 32 + (hash(i * 3.1) - .5) * 6, z = 2 + Math.pow(hash(i * 7.7), 1.6) * 16;
    const [px, py] = P(x, z); ctx.fillStyle = rgba(C.fg, .55); ctx.beginPath(); ctx.arc(px, py, 3.2, 0, 7); ctx.fill();
  }
  // subject token: outline circle in the accent with its number
  const [sx, sy] = P(41, 12); stroke(C.accent, 1, 3); ctx.beginPath(); ctx.arc(sx, sy, 20, 0, 7); ctx.stroke();
  mono("7", sx, sy + 7, 20, C.accent, 1, "center", 0);
  stroke(C.accent, .9, 2); drawPart([[sx + 24, sy - 18], [sx + 90, sy - 80], [sx + 150, sy - 80]], 1);
  mono("SUBJEK", sx + 160, sy - 72, 24, C.accent);
}

if (BEAT === "trend") {
  chip();
  headline("Lalu, musim ini angkanya *turun*.", 290);
  // one curve drawn across the stage (pure visualizevalue beat), axis + labels annotate it
  const x0 = 170, x1 = 910, yb = 1300, yt = 880;
  stroke(C.fg, .35, 2); drawPart([[x0, yb], [x1, yb]], 1);
  const pts = Array.from({ length: 80 }, (_, i) => { const u = i / 79; return [x0 + u * (x1 - x0), yb - (yt - yb) * -(.25 + .75 * Math.exp(-Math.pow((u - .32) / .2, 2)) - .55 * u * u)]; });
  stroke(C.fg, 1, 3); drawPart(pts, PR);
  const peak = pts[25], end = pts[79];
  if (PR > .4) { mono("PUNCAK\n2024/25", peak[0] - 60, peak[1] - 80, 26, C.fg, .9); }
  if (PR > .95) { ctx.fillStyle = C.accent; ctx.beginPath(); ctx.arc(end[0], end[1], 9, 0, 7); ctx.fill();
    mono("SEKARANG", end[0] - 10, end[1] + 70, 26, C.accent, 1, "right"); }
  mono("2021", x0, yb + 54, 22, C.fg, .45); mono("2026", x1, yb + 54, 22, C.fg, .45, "right");
}

if (BEAT === "verdict") {
  chip();
  headline("Jadi, apakah ia *masih* yang terbaik?", 290);
  // one big symbol beside a tiny copy; the big X turns into + (45°) over P
  const cx = 470, cy = 1080, r = 190, rot = Math.PI / 4 * (1 - eIO(PR));
  stroke(C.fg, 1, 3);
  for (const a of [0, Math.PI / 2]) { const c = Math.cos(a + rot), s = Math.sin(a + rot); drawPart([[cx - r * c, cy - r * s], [cx + r * c, cy + r * s]], 1); }
  stroke(C.accent, 1, 3); drawPart([[790, 1080 - 18], [790, 1080 + 18]], 1); drawPart([[790 - 18, 1080], [790 + 18, 1080]], 1);
  mono("KALAH", cx - r, cy + r + 90, 26, C.fg, .55); mono("MENANG", 790, 1080 + 80, 26, C.accent, 1, "center");
}

const file = path.join(OUT, `${BEAT}.png`);
fs.writeFileSync(file, cv.toBuffer("image/png"));
console.log(file);
