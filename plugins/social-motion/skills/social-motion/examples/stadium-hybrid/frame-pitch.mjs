// Stadium hybrid — pitch scene. VIEW=aerial for the aerial camera. See references/style-stadium-hybrid.md.
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
// Demo palette (GoonerBurger). In a film use B.c.* from the project kit instead.
const C = { bg: "#06070A", accent: "#E4002B", white: "#FFFFFF", grassA: "#20402B", grassB: "#1A3624", line: "#E8ECE6", opp: "#EDEDED", stand: "#12151B" };
const hex = (h) => h.startsWith("rgb") ? h.match(/\d+/g).slice(0, 3).map(Number) : [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const shade = (h, p) => { const c = hex(h).map((v) => Math.round(p >= 0 ? v + (255 - v) * p : v * (1 + p))); return `rgb(${c.join(",")})`; };
const rgba = (h, a) => `rgba(${hex(h).join(",")},${a})`;
let _s = 11; const rnd = () => ((_s = (_s * 16807) % 2147483647) / 2147483647);

const W = 1080, H = 1920, CX = W / 2;
const cv = createCanvas(W, H), ctx = cv.getContext("2d");

// ---- perspective camera. World: x across (goal x 30.3..37.6 centred at 34), z towards the goal (goal line z=0,
// camera on the pitch side, negative z is towards the goal from the camera's view), y up.
const AER = process.env.VIEW === "aerial";
const cam = AER ? { x: 34, y: 74, z: 36 } : { x: 58, y: 24, z: 60 }, yaw = AER ? 0 : -0.5, pitchT = AER ? 1.36 : 0.42, F = AER ? 1500 : 1650, HOR = AER ? 1060 : 930;
const P = (x, z, y = 0) => {
  let dx = x - cam.x, dy = y - cam.y, dz = cam.z - z;            // dz>0 = in front
  const cx = dx * Math.cos(yaw) - dz * Math.sin(yaw), cz = dx * Math.sin(yaw) + dz * Math.cos(yaw);
  const ty = dy * Math.cos(pitchT) + cz * Math.sin(pitchT), tz = -dy * Math.sin(pitchT) + cz * Math.cos(pitchT);
  return [CX + F * cx / tz, HOR - F * ty / tz, tz];
};
const poly = (pts) => { ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.closePath(); };
const line = (a, b) => { ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); };
const path3 = (pts) => { ctx.beginPath(); pts.forEach((p, i) => { const q = P(...p); i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]); }); };

// background
ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);

// ---- stands (behind the goal and along the far touchline), tiered, full of crowd dots
const stand = (a, b, depth, rise, n, nx, nz) => {
  const q = [[a[0], a[1], 0], [b[0], b[1], 0], [b[0] + nx * depth, b[1] + nz * depth, rise], [a[0] + nx * depth, a[1] + nz * depth, rise]];
  const s = q.map((p) => P(...p));
  const gr = ctx.createLinearGradient(0, Math.min(...s.map((v) => v[1])), 0, Math.max(...s.map((v) => v[1])));
  gr.addColorStop(0, shade(C.stand, -.5)); gr.addColorStop(1, C.stand); ctx.fillStyle = gr; poly(s); ctx.fill();
  // tier lines
  ctx.strokeStyle = "rgba(255,255,255,.05)"; ctx.lineWidth = 1;
  for (let k = 1; k < 14; k++) { const t = k / 14; line(P(a[0] + nx * depth * t, a[1] + nz * depth * t, rise * t), P(b[0] + nx * depth * t, b[1] + nz * depth * t, rise * t)); }
  const cols = [C.white, C.accent, "#7D838F", C.white, "#4F5562", C.accent];
  for (let i = 0; i < n; i++) {
    const u = rnd(), v = rnd(); const x = a[0] + (b[0] - a[0]) * u + nx * depth * v, z = a[1] + (b[1] - a[1]) * u + nz * depth * v, y = rise * v + .5;
    const p = P(x, z, y); if (p[2] <= 1) continue; const r = Math.max(.8, 260 / p[2]);
    ctx.globalAlpha = .1 + .32 * rnd(); ctx.fillStyle = cols[i % cols.length]; ctx.beginPath(); ctx.arc(p[0], p[1], r, 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = 1;
  // roof edge
  ctx.strokeStyle = "rgba(255,255,255,.18)"; ctx.lineWidth = 3; line(P(q[3][0], q[3][1], rise + 2), P(q[2][0], q[2][1], rise + 2));
};
stand([-40, -4], [110, -4], 34, 24, 11000, 0, -1);      // behind the goal
stand([-4, -4], [-4, AER ? 75 : 52], 34, 24, 9000, -1, 0);        // far touchline (left of frame)
if (AER) { stand([72, 75], [72, -4], 34, 24, 9000, 1, 0); }

// ---- floodlight bloom + light shafts
{ const b = AER ? ctx.createRadialGradient(CX, 700, 60, CX, 800, 1200) : ctx.createRadialGradient(CX - 80, 120, 30, CX - 80, 300, 980); b.addColorStop(0, "rgba(255,255,255,.22)"); b.addColorStop(1, "rgba(255,255,255,0)"); ctx.fillStyle = b; ctx.fillRect(0, 0, W, H); }

// ---- pitch with mowing stripes (2 tones), slight vignette into darkness
const PX0 = -4, PX1 = 72, PZ0 = -4, PZ1 = AER ? 75 : 52;
ctx.fillStyle = C.grassA; poly([P(PX0, PZ0), P(PX1, PZ0), P(PX1, PZ1), P(PX0, PZ1)]); ctx.fill();
for (let i = 0; i < (AER ? 15 : 10); i++) if (i % 2) { const z0 = i * 5.25, z1 = Math.min(PZ1, z0 + 5.25); ctx.fillStyle = C.grassB; poly([P(PX0, z0), P(PX1, z0), P(PX1, z1), P(PX0, z1)]); ctx.fill(); }

// lines: goal line, box, six-yard, spot, arc
ctx.strokeStyle = C.line; ctx.lineCap = "round";
const lw = (z) => Math.max(1.5, 90 / P(34, z)[2]);
ctx.lineWidth = lw(0); line(P(0, 0), P(68, 0)); ctx.lineWidth = lw(30); line(P(0, 0), P(0, PZ1)); line(P(68, 0), P(68, PZ1));
ctx.lineWidth = lw(8); path3([[13.85, 0], [13.85, 16.5], [54.15, 16.5], [54.15, 0]]); ctx.stroke();
ctx.lineWidth = lw(3); path3([[24.85, 0], [24.85, 5.5], [43.15, 5.5], [43.15, 0]]); ctx.stroke();
{ const pts = []; for (let a = .2; a <= .8001; a += .02) { const ang = Math.PI * a; pts.push([34 + 9.15 * Math.cos(ang), 11 + 9.15 * Math.sin(ang)]); } ctx.lineWidth = lw(18); path3(pts); ctx.stroke(); }
{ const s = P(34, 11); ctx.fillStyle = C.line; ctx.beginPath(); ctx.ellipse(s[0], s[1], 5, 2.6, 0, 0, Math.PI * 2); ctx.fill(); }
if (AER) { ctx.lineWidth = lw(52); line(P(0, 52.5), P(68, 52.5)); const pts = []; for (let a = 0; a <= 2.001; a += .02) pts.push([34 + 9.15 * Math.cos(Math.PI * a), 52.5 + 9.15 * Math.sin(Math.PI * a)]); path3(pts); ctx.stroke(); }
// goal: frame + net
{ const g0 = 30.34, g1 = 37.66, gh = 2.44, gd = -2.2;
  ctx.strokeStyle = "rgba(255,255,255,.16)"; ctx.lineWidth = 1;
  for (let i = 0; i <= 14; i++) { const x = g0 + (g1 - g0) * i / 14; line(P(x, gd, 0), P(x, gd, gh)); line(P(x, 0, gh), P(x, gd, gh)); }
  for (let j = 0; j <= 5; j++) line(P(g0, gd, gh * j / 5), P(g1, gd, gh * j / 5));
  ctx.strokeStyle = C.white; ctx.lineWidth = 5; path3([[g0, 0, 0], [g0, 0, gh], [g1, 0, gh], [g1, 0, 0]]); ctx.stroke(); }

// Chelsea block, as a soft lit zone on the grass
const zone = [[17, 4.5], [52, 4.5], [52, 19.5], [17, 19.5]];
ctx.fillStyle = "rgba(255,255,255,.05)"; poly(zone.map(([x, z]) => P(x, z))); ctx.fill();
ctx.setLineDash([12, 10]); ctx.strokeStyle = "rgba(255,255,255,.3)"; ctx.lineWidth = 2; poly(zone.map(([x, z]) => P(x, z))); ctx.stroke(); ctx.setLineDash([]);

// passing lanes
const ode = [31, 28], rice = [35.5, 13], hav = [41.5, 5.2];
const lane = (a, b, col, w, dash, glowC) => { ctx.save(); if (glowC) { ctx.shadowColor = glowC; ctx.shadowBlur = 20; } ctx.strokeStyle = col; ctx.lineWidth = w; ctx.setLineDash(dash); ctx.lineCap = "round"; line(P(a[0], a[1], .1), P(b[0], b[1], .1)); ctx.restore(); };
ctx.fillStyle = rgba(C.accent, .14); poly([P(...ode), P(hav[0] - 3, hav[1]), P(hav[0] + 3, hav[1] + 1)]); ctx.fill();
lane(ode, rice, "rgba(255,255,255,.35)", 4, [12, 10]);
lane(ode, hav, C.accent, 7, [20, 13], rgba(C.accent, .7));
{ const a = P(...ode), b = P(...hav); const ang = Math.atan2(b[1] - a[1], b[0] - a[0]); const e = [b[0] - Math.cos(ang) * 40, b[1] - Math.sin(ang) * 40];
  ctx.fillStyle = C.accent; ctx.beginPath(); ctx.moveTo(e[0] + Math.cos(ang) * 22, e[1] + Math.sin(ang) * 22); ctx.lineTo(e[0] + Math.cos(ang + 2.5) * 20, e[1] + Math.sin(ang + 2.5) * 20); ctx.lineTo(e[0] + Math.cos(ang - 2.5) * 20, e[1] + Math.sin(ang - 2.5) * 20); ctx.fill(); }
{ ctx.strokeStyle = "rgba(255,255,255,.5)"; ctx.lineWidth = 3; ctx.setLineDash([6, 6]); line(P(40, 18.5, .1), P(37.4, 15.3, .1)); ctx.setLineDash([]); }

// ---- tokens in perspective (3-tone, lo.jaditau), with stadium-light shadow
const circ = (x, z, y, r) => { const out = []; for (let i = 0; i < 48; i++) { const a = i * Math.PI * 2 / 48; out.push(P(x + Math.cos(a) * r, z + Math.sin(a) * r, y)); } return out; };
const ell = (pts) => { const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]); return { cx: (Math.min(...xs) + Math.max(...xs)) / 2, cy: (Math.min(...ys) + Math.max(...ys)) / 2, rx: (Math.max(...xs) - Math.min(...xs)) / 2, ry: (Math.max(...ys) - Math.min(...ys)) / 2 }; };
const token = (x, z, col, { num, hot } = {}) => {
  const r = AER ? 1.5 : 1.05, h = AER ? 1.3 : 1.9, b = ell(circ(x, z, 0, r)), t = ell(circ(x, z, h, r));
  ctx.save(); ctx.filter = "blur(5px)"; ctx.fillStyle = "rgba(0,0,0,.45)"; ctx.beginPath(); ctx.ellipse(b.cx + b.rx * .5, b.cy + b.ry * .3, b.rx * 1.4, b.ry * 1.2, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  if (hot) { ctx.save(); const g = ctx.createRadialGradient(b.cx, b.cy, 4, b.cx, b.cy, b.rx * 3.2); g.addColorStop(0, rgba(C.accent, .55)); g.addColorStop(1, rgba(C.accent, 0)); ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(b.cx, b.cy, b.rx * 3.2, b.ry * 3.2, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore(); }
  const body = () => { ctx.beginPath(); ctx.ellipse(b.cx, b.cy, b.rx, b.ry, 0, 0, Math.PI); ctx.lineTo(t.cx - t.rx, t.cy); ctx.ellipse(t.cx, t.cy, t.rx, t.ry, 0, Math.PI, 0, true); ctx.closePath(); };
  ctx.fillStyle = col; body(); ctx.fill();
  ctx.save(); ctx.beginPath(); ctx.rect(b.cx + b.rx * .1, t.cy - t.ry, b.rx * 2, b.cy - t.cy + b.ry * 2 + 4); ctx.clip(); ctx.fillStyle = shade(col, -.28); body(); ctx.fill(); ctx.restore();
  ctx.fillStyle = shade(col, .2); ctx.beginPath(); ctx.ellipse(t.cx, t.cy, t.rx, t.ry, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = shade(col, -.45); ctx.lineWidth = 1.3; ctx.stroke(); body(); ctx.stroke();
  if (num) { ctx.save(); ctx.translate(t.cx, t.cy); ctx.scale(1, Math.max(.4, t.ry / t.rx)); ctx.fillStyle = C.white; ctx.font = `${Math.round(t.rx * .95)}px Geist`; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(num, 0, 1); ctx.restore(); }
  return [t.cx, t.cy, t.rx];
};
const players = [
  ...[[21, 7.5], [29, 6.8], [38.5, 6.6], [47, 7.4], [33, 3.5]].map(([x, z]) => ({ x, z, col: C.opp })),
  ...[[23, 17.5], [30.5, 18.2], [40, 18.8], [48, 18]].map(([x, z]) => ({ x, z, col: C.opp })),
  { x: rice[0], z: rice[1], col: C.accent, num: "41", hot: true },
  { x: hav[0], z: hav[1], col: C.accent, num: "29" },
  { x: ode[0], z: ode[1], col: C.accent, num: "8" },
  { x: 51, z: 24, col: C.accent, num: "7" },
];
const tops = {};
players.sort((a, b) => P(b.x, b.z)[2] - P(a.x, a.z)[2]).forEach((p) => { tops[p.num ? `n${p.num}` : `x${p.x}`] = token(p.x, p.z, p.col, p); });
{ const b = P(ode[0] - 1.2, ode[1] + .6, .22); ctx.fillStyle = C.white; ctx.beginPath(); ctx.arc(b[0], b[1], 10, 0, Math.PI * 2); ctx.fill(); }

const chip = (t, text) => { ctx.font = "26px Geist"; const w = ctx.measureText(text).width + 26, y = t[1] - t[2] - 58;
  ctx.fillStyle = C.white; ctx.beginPath(); ctx.roundRect(t[0] - w / 2, y, w, 40, 20); ctx.fill(); ctx.fillStyle = "#111"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(text, t[0], y + 21); };
chip(tops["n41"], "RICE"); chip(tops["n29"], "HAVERTZ");

// darkness at the frame edges + far-side haze (story.gaffer keeps the top quiet)
{ const v = AER ? ctx.createRadialGradient(CX, 880, 520, CX, 880, 1200) : ctx.createRadialGradient(CX, 1000, 420, CX, 1000, 1250); v.addColorStop(0, "rgba(0,0,0,0)"); v.addColorStop(1, "rgba(0,0,0,.75)"); ctx.fillStyle = v; ctx.fillRect(0, 0, W, H); }
{ const g = ctx.createLinearGradient(0, 0, 0, AER ? 330 : 560); g.addColorStop(0, C.bg); g.addColorStop(.4, rgba(C.bg, .85)); g.addColorStop(1, rgba(C.bg, 0)); ctx.fillStyle = g; ctx.fillRect(0, 0, W, AER ? 330 : 560); }

// story.gaffer touch: small mono kicker, top-left
ctx.textAlign = "left"; ctx.textBaseline = "alphabetic"; ctx.font = "26px Mono"; ctx.fillStyle = "rgba(255,255,255,.55)";
ctx.fillText("01 · PENEMPATAN POSISI · VS CHELSEA", 96, 250);

// subtitle (GoonerBurger)
ctx.textAlign = "center"; ctx.font = "86px GeistBlack";
ctx.fillStyle = C.white; ctx.fillText("MEMBUKA", CX, 1500);
ctx.fillStyle = C.accent; ctx.fillText("SUDUT OPERAN", CX, 1596);

fs.writeFileSync(path.join(OUT, `pitch-${AER ? "aerial" : "perspective"}.png`), cv.toBuffer("image/png"));
console.log("ok");
