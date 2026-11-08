// Stadium hybrid — object close-up scene (ball rack on the same turf). See references/style-stadium-hybrid.md.
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
const HERE = path.dirname(fileURLToPath(import.meta.url));
const SK = path.resolve(HERE, "../..");
const { createCanvas, GlobalFonts } = await import(path.join(SK, "node_modules/@napi-rs/canvas/index.js"));
// Fonts: the project's kit fonts. Set HEAD_FONT / HEAD_FONT_BLACK to .ttf paths (e.g. Geist), else Poppins from the skill.
GlobalFonts.registerFromPath(process.env.HEAD_FONT || path.join(SK, "assets/fonts/Poppins-Bold.ttf"), "Geist");
GlobalFonts.registerFromPath(process.env.HEAD_FONT_BLACK || path.join(SK, "assets/fonts/Poppins-Black.ttf"), "GeistBlack");
GlobalFonts.registerFromPath(path.join(SK, "assets/fonts/SpaceMono-Bold.ttf"), "Mono");
const OUT = path.join(HERE, "out"); fs.mkdirSync(OUT, { recursive: true });
// Demo palette (GoonerBurger, night world). In a film use B.c.* from the project kit instead.
const PAL = "malam";
const C = { bg: "#07080A", fg: "#FFFFFF", accent: "#E4002B", neutral: "#1C2A22", dark: "#111111", white: "#FFFFFF", opp: "#EDEDED", chip: "#FFFFFF", chipText: "#111111", metal: "#BDBDBD", ballLo: "#9A9A9A", line: "#D9DDD8", sub2: "#E4002B", patch: "#E4002B", stand: "#14171D" };

const hex = (h) => h.startsWith("rgb") ? h.match(/\d+/g).slice(0, 3).map(Number) : [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const shade = (h, p) => { const c = hex(h).map((v) => Math.round(p >= 0 ? v + (255 - v) * p : v * (1 + p))); return `rgb(${c.join(",")})`; };
const rgba = (h, a) => `rgba(${hex(h).join(",")},${a})`;

const W = 1080, H = 1920, CX = W / 2;
const cv = createCanvas(W, H), ctx = cv.getContext("2d");

// --- iso projection (world metres: x across goal line, z away from goal, y up)
const K = 165, CO = Math.cos(Math.PI / 6), SI = 0.5, OY = 470;
const P = (x, z, y = 0) => [CX + (x - z) * CO * K, 1010 + (x + z) * SI * K - y * K];
const poly = (pts) => { ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.closePath(); };
const line = (a, b) => { ctx.beginPath(); ctx.moveTo(...a); ctx.lineTo(...b); ctx.stroke(); };


// background
let g = ctx.createLinearGradient(0, 0, 0, H);
g.addColorStop(0, C.bg); g.addColorStop(.55, shade(C.bg, -.05)); g.addColorStop(1, shade(C.bg, -.13));
ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

// iso box with 3 tones (x,z footprint, y up), units = K
const box = (x0, z0, y0, dx, dz, dy, col) => {
  const t = (x, z) => P(x, z, y0 + dy);
  ctx.fillStyle = shade(col, -.06); poly([P(x0, z0 + dz, y0), P(x0 + dx, z0 + dz, y0), t(x0 + dx, z0 + dz), t(x0, z0 + dz)]); ctx.fill();   // front-left
  ctx.fillStyle = shade(col, -.24); poly([P(x0 + dx, z0, y0), P(x0 + dx, z0 + dz, y0), t(x0 + dx, z0 + dz), t(x0 + dx, z0)]); ctx.fill();   // right
  ctx.fillStyle = shade(col, .12); poly([t(x0, z0), t(x0 + dx, z0), t(x0 + dx, z0 + dz), t(x0, z0 + dz)]); ctx.fill();                      // top
  ctx.strokeStyle = shade(col, -.38); ctx.lineWidth = 1.2;
  poly([P(x0, z0 + dz, y0), P(x0 + dx, z0 + dz, y0), P(x0 + dx, z0, y0), t(x0 + dx, z0), t(x0, z0), t(x0, z0 + dz)]); ctx.stroke();
};


// ---- story.gaffer layer (night stadium), only in PAL "malam"
let _seed = 7; const rnd = () => ((_seed = (_seed * 16807) % 2147483647) / 2147483647);
const bloom = () => { const b = ctx.createRadialGradient(CX, 250, 40, CX, 420, 900); b.addColorStop(0, "rgba(255,255,255,.16)"); b.addColorStop(1, "rgba(255,255,255,0)"); ctx.fillStyle = b; ctx.fillRect(0, 0, W, H); };
const stand = (corners, n, dotR) => {   // corners: 4 world points [x,z,y] (a,b along pitch edge; c,d up the back)
  const q = corners.map(([x, z, y]) => P(x, z, y));
  const gr = ctx.createLinearGradient(0, Math.min(...q.map((v) => v[1])), 0, Math.max(...q.map((v) => v[1])));
  gr.addColorStop(0, shade(C.stand, -.4)); gr.addColorStop(1, C.stand); ctx.fillStyle = gr; poly(q); ctx.fill();
  const cols = [C.white, C.accent, "#8A8F99", C.white, "#5C6270"];
  for (let i = 0; i < n; i++) { const u = rnd(), v = rnd(); const lerp = (a, b, t) => a.map((av, k) => av + (b[k] - av) * t);
    const w = lerp(lerp(corners[0], corners[1], u), lerp(corners[3], corners[2], u), v); const s = P(w[0], w[1], w[2]);
    ctx.fillStyle = cols[i % cols.length]; ctx.globalAlpha = .25 + .45 * rnd(); ctx.beginPath(); ctx.arc(s[0], s[1], dotR * (.6 + .5 * rnd()), 0, Math.PI * 2); ctx.fill(); }
  ctx.globalAlpha = 1; ctx.strokeStyle = "rgba(255,255,255,.08)"; ctx.lineWidth = 1; for (let k = 1; k < 6; k++) { const a = corners[0].map((av, j) => av + (corners[3][j] - av) * k / 6), b = corners[1].map((bv, j) => bv + (corners[2][j] - bv) * k / 6); line(P(...a), P(...b)); }
};

if (PAL === "malam") {
  bloom();
  // far stand, out of focus behind the close-up
  ctx.save(); ctx.filter = "blur(7px)"; stand([[-2.2, -2.4, 0], [3.4, -2.4, 0], [3.4, -4.6, 2.2], [-2.2, -4.6, 2.2]], 900, 6); stand([[-2.4, -2.2, 0], [-2.4, 3.0, 0], [-4.6, 3.0, 2.2], [-4.6, -2.2, 2.2]], 900, 6); ctx.restore();
}
// floor slab (turf as a light neutral, same hue family)
const surf = shade(C.neutral, .2);
ctx.save(); ctx.filter = "blur(30px)"; ctx.fillStyle = "rgba(0,0,0,.15)"; poly([P(-2.2, 1.6, -.2), P(2.2, 1.6, -.2), P(2.2, -2.2, -.2)].map(([x, y]) => [x + 20, y + 40])); ctx.fill(); ctx.restore();
box(-2.2, -2.2, -.14, 4.4, 3.8, .14, surf);
for (let i = 0; i < 8; i++) if (i % 2) { const za = -2.2 + i * 3.8 / 8; ctx.fillStyle = shade(C.neutral, PAL === "malam" ? .12 : .27); poly([P(-2.2, za), P(2.2, za), P(2.2, za + 3.8 / 8), P(-2.2, za + 3.8 / 8)]); ctx.fill(); }

// corner flag far back-left: the set-piece route, faded (not this season)
ctx.save(); ctx.globalAlpha = .45;
ctx.strokeStyle = shade(C.neutral, -.35); ctx.lineWidth = 7; line(P(-1.7, -1.8), P(-1.7, -1.8, 1.9));
ctx.fillStyle = shade(C.neutral, -.15); poly([P(-1.7, -1.8, 1.9), P(-1.15, -1.8, 1.72), P(-1.7, -1.8, 1.5)]); ctx.fill();
ctx.strokeStyle = C.line; ctx.lineWidth = 4; ctx.beginPath(); for (let a = 0; a <= 1; a += .05) { const p = P(-2.2 + .5 * Math.cos(a * Math.PI / 2), -2.2 + .5 * Math.sin(a * Math.PI / 2)); a ? ctx.lineTo(...p) : ctx.moveTo(...p); } ctx.stroke();
ctx.restore();

// ball rack: two rails on legs (metal, 3 tones from the kit's dark)
const metal = C.metal;
for (const [x, z] of [[-1.55, -.35], [1.45, -.35], [-1.55, .25], [1.45, .25]]) box(x, z, 0, .1, .1, .78, metal);
box(-1.6, -.4, .78, 3.2, .12, .08, metal);   // back rail
box(-1.6, .2, .78, 3.2, .12, .08, metal);    // front rail

// footballs: 3-tone sphere + simple dark patches
const ball = (x, z, r, i, hot) => {
  const c = P(x, z, .86 + r * .55), R = r * K;
  ctx.save(); ctx.filter = "blur(5px)"; ctx.fillStyle = "rgba(0,0,0,.18)"; ctx.beginPath(); ctx.ellipse(c[0] + 10, c[1] + R * .9, R * .8, R * .3, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  if (hot) { ctx.save(); ctx.shadowColor = rgba(C.accent, .8); ctx.shadowBlur = 46; ctx.fillStyle = rgba(C.accent, .18); ctx.beginPath(); ctx.arc(c[0], c[1], R * 1.18, 0, Math.PI * 2); ctx.fill(); ctx.restore(); }
  const gr = ctx.createRadialGradient(c[0] - R * .35, c[1] - R * .4, R * .1, c[0], c[1], R);
  gr.addColorStop(0, C.white); gr.addColorStop(.7, shade(C.ballLo, .55)); gr.addColorStop(1, C.ballLo);
  ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(c[0], c[1], R, 0, Math.PI * 2); ctx.fill();
  ctx.save(); ctx.beginPath(); ctx.arc(c[0], c[1], R, 0, Math.PI * 2); ctx.clip();
  const pent = (px, py, s, rot) => { ctx.beginPath(); for (let k = 0; k < 5; k++) { const a = rot + k * 2 * Math.PI / 5; const q = [px + Math.cos(a) * s, py + Math.sin(a) * s]; k ? ctx.lineTo(...q) : ctx.moveTo(...q); } ctx.closePath(); ctx.fill(); };
  ctx.fillStyle = C.patch; const rot = i * .7;
  pent(c[0] + R * .05, c[1] + R * .05, R * .3, rot);
  for (let k = 0; k < 5; k++) { const a = rot + k * 2 * Math.PI / 5 + Math.PI / 5; pent(c[0] + Math.cos(a) * R * .92, c[1] + Math.sin(a) * R * .92, R * .3, a); }
  ctx.restore();
  ctx.strokeStyle = shade(C.ballLo, -.3); ctx.lineWidth = 1.4; ctx.beginPath(); ctx.arc(c[0], c[1], R, 0, Math.PI * 2); ctx.stroke();
};
const r = .29;
[-1.2, -.6, 0, .6, 1.2].forEach((x, i) => ball(x, -.08, r, i, true));

if (PAL === "malam") { const lp = ctx.createRadialGradient(CX, 800, 30, CX, 800, 560); lp.addColorStop(0, "rgba(255,255,255,.08)"); lp.addColorStop(1, "rgba(255,255,255,0)"); ctx.fillStyle = lp; ctx.fillRect(0, 0, W, H); }
// small count chip floating over the rack
{ const p = P(0, -.08, 2.05); ctx.font = "34px Geist"; const t = "5/5 OPEN PLAY", w = ctx.measureText(t).width + 40;
  ctx.fillStyle = C.chip; ctx.beginPath(); ctx.roundRect(p[0] - w / 2, p[1] - 30, w, 58, 29); ctx.fill();
  ctx.fillStyle = C.chipText; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(t, p[0], p[1] + 1); }

// atmosphere fade
g = ctx.createLinearGradient(0, 300, 0, 640); g.addColorStop(0, C.bg); g.addColorStop(1, rgba(C.bg, 0));
ctx.fillStyle = g; ctx.fillRect(0, 300, W, 340); ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, 300);

// subtitle placeholder
ctx.textAlign = "center"; ctx.textBaseline = "alphabetic"; ctx.font = "86px GeistBlack";
ctx.fillStyle = C.fg; ctx.fillText("SEKARANG PUNYA", CX, 1500);
ctx.fillStyle = C.sub2; ctx.fillText("LIMA ASSIST", CX, 1596);

fs.writeFileSync(path.join(OUT, "object-ball-rack.png"), cv.toBuffer("image/png"));
console.log("ok");
