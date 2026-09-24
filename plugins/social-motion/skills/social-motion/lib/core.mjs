// core.mjs — numbers, easing, springs, timing windows, noise, colour and canvas helpers.
// Everything here is a pure function of its inputs: no Math.random, no Date. Same t in, same pixels out.
import { createCanvas, Path2D, GlobalFonts, loadImage } from "@napi-rs/canvas";
export { createCanvas, Path2D, GlobalFonts, loadImage };

// ------------------------------------------------------------------ numbers
export const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
export const lerp = (a, b, k) => a + (b - a) * k;
export const inv = (a, b, x) => clamp((x - a) / ((b - a) || 1e-9));             // where x sits between a and b, 0..1
export const remap = (x, a, b, c, d) => lerp(c, d, inv(a, b, x));
export const rad = (d) => d * Math.PI / 180;
export const ss = (a, b, x) => { const k = inv(a, b, x); return k * k * (3 - 2 * k); };   // smoothstep window
export const hash = (n) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
export const rng = (seed) => { let s = Math.max(1, Math.floor(Math.abs(seed))) % 2147483647; return () => (s = (s * 16807) % 2147483647) / 2147483647; };
export const noise1 = (x) => { const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f); return (hash(i) * (1 - u) + hash(i + 1) * u) * 2 - 1; };
export const idHash = (s) => { let h = 2166136261; for (const c of String(s)) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return (h >>> 0) % 100000; };

// ------------------------------------------------------------------ easing (k in 0..1)
export const eLin = (k) => clamp(k);
export const eOut = (k) => 1 - Math.pow(1 - clamp(k), 3);
export const eOut5 = (k) => 1 - Math.pow(1 - clamp(k), 5);                        // quint: the "UI snap" entrance
export const eIn = (k) => Math.pow(clamp(k), 3);
export const eIO = (k) => { k = clamp(k); return k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; };
export const eIO5 = (k) => { k = clamp(k); return k < .5 ? 16 * k ** 5 : 1 - Math.pow(-2 * k + 2, 5) / 2; };  // whips, pushes
export const eExpo = (k) => (k = clamp(k), k === 1 ? 1 : 1 - Math.pow(2, -10 * k));
export const eBack = (k, s = 1.7) => { k = clamp(k) - 1; return 1 + (s + 1) * k * k * k + s * k * k; };
export const eElastic = (k) => { k = clamp(k); return k === 0 || k === 1 ? k : Math.pow(2, -10 * k) * Math.sin((k * 10 - .75) * (2 * Math.PI / 3)) + 1; };

// Damped spring from 0 to 1, as a closed-form function of time (seconds since start). No state, so it seeks.
//   freq: oscillations per second (3–6 snappy UI, 1.5–2.5 soft), damp: 0..1 damping ratio (.45 bouncy, .7 firm, 1 no overshoot)
export function spring(dt, freq = 4, damp = .55) {
  if (dt <= 0) return 0;
  const w = 2 * Math.PI * freq, z = clamp(damp, .01, .999), wd = w * Math.sqrt(1 - z * z);
  return 1 - Math.exp(-z * w * dt) * (Math.cos(wd * dt) + (z * w / wd) * Math.sin(wd * dt));
}
// a pop-in scale with overshoot: 0 before t0, then a spring to 1
export const pop = (t, t0, freq = 3.2, damp = .5) => t < t0 ? 0 : spring(t - t0, freq, damp);

// ------------------------------------------------------------------ timing windows
// life(): the in / hold / out envelope every on-screen element has.
//   const L = life(t, 1.2, 3.4, { in: .35, out: .25 });  L.on (visible?), L.i (enter 0..1), L.o (exit 0..1), L.t (local time)
export function life(t, t0, t1 = Infinity, o = {}) {
  const din = o.in ?? .35, dout = o.out ?? .25;
  return { on: t >= t0 && t < t1 + dout, i: inv(t0, t0 + din, t), o: inv(t1, t1 + dout, t), t: t - t0 };
}
// stagger: the start time of item k in a group
export const stag = (t0, k, gap = .06) => t0 + k * gap;
// beat grid: time of beat n at a bpm (with an offset for where beat 0 lands)
export const beat = (n, bpm, offset = 0) => offset + n * 60 / bpm;

// ------------------------------------------------------------------ colour
const hex3 = (h) => { h = h.replace("#", ""); if (h.length === 3) h = [...h].map((c) => c + c).join(""); return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)); };
export const rgb = (h) => hex3(h);
export const rgba = (h, a = 1) => { const [r, g, b] = hex3(h); return `rgba(${r},${g},${b},${a})`; };
export const mix = (a, b, k) => { const A = hex3(a), B = hex3(b); return "#" + A.map((v, i) => Math.round(lerp(v, B[i], clamp(k))).toString(16).padStart(2, "0")).join(""); };
export const shade = (h, k) => k >= 0 ? mix(h, "#ffffff", k) : mix(h, "#000000", -k);   // +lighter / -darker
export const luma = (h) => { const [r, g, b] = hex3(h); return (.2126 * r + .7152 * g + .0722 * b) / 255; };
export const onColor = (bg, dark = "#111111", light = "#FFFFFF") => luma(bg) > .55 ? dark : light;  // readable text on bg

// ------------------------------------------------------------------ canvas helpers
export function at(ctx, x, y, s, r, fn) { ctx.save(); ctx.translate(x, y); if (r) ctx.rotate(r); if (s !== 1) { const sx = Array.isArray(s) ? s[0] : s, sy = Array.isArray(s) ? s[1] : s; ctx.scale(sx || 1e-4, sy || 1e-4); } fn(); ctx.restore(); }
export function alpha(ctx, a, fn) { if (a <= 0) return; ctx.save(); ctx.globalAlpha *= clamp(a); fn(); ctx.restore(); }
export function rrect(ctx, x, y, w, h, r) { r = Math.max(0, Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2)); ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x, y, w, h, r) : ctx.rect(x, y, w, h); }
export function poly(ctx, pts, close = true) { ctx.beginPath(); pts.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); if (close) ctx.closePath(); }
export function ellipse(ctx, x, y, rx, ry = rx, rot = 0) { ctx.beginPath(); ctx.ellipse(x, y, Math.max(.01, rx), Math.max(.01, ry), rot, 0, Math.PI * 2); }
export function fill(ctx, c) { ctx.fillStyle = c; ctx.fill(); }
export function stroke(ctx, w = 3, c = "#111", cap = "round") { ctx.lineWidth = w; ctx.strokeStyle = c; ctx.lineJoin = "round"; ctx.lineCap = cap; ctx.stroke(); }
export function line(ctx, pts, w = 3, c = "#111", dash = null) { ctx.save(); if (dash) ctx.setLineDash(dash); poly(ctx, pts, false); stroke(ctx, w, c); ctx.restore(); }
// soft drop shadow around whatever fn draws
export function shadow(ctx, fn, { blur = 40, y = 16, color = "rgba(0,0,0,.28)" } = {}) { ctx.save(); ctx.shadowColor = color; ctx.shadowBlur = blur; ctx.shadowOffsetY = y; fn(); ctx.restore(); }
// glow: same idea, coloured, no offset
export function glow(ctx, fn, color, blur = 30) { ctx.save(); ctx.shadowColor = color; ctx.shadowBlur = blur; fn(); ctx.restore(); }

// ------------------------------------------------------------------ paths
export function catmull(P, closed = false, step = 6) {
  const out = [], n = P.length, g = (i) => closed ? P[(i + n) % n] : P[clamp(i, 0, n - 1)];
  for (let i = 0; i < (closed ? n : n - 1); i++) {
    const p0 = g(i - 1), p1 = g(i), p2 = g(i + 1), p3 = g(i + 2), m = Math.max(2, Math.ceil(Math.hypot(p2[0] - p1[0], p2[1] - p1[1]) / step));
    for (let s = 0; s < m; s++) { const t = s / m, t2 = t * t, t3 = t2 * t;
      out.push([0, 1].map((c) => .5 * (2 * p1[c] + (-p0[c] + p2[c]) * t + (2 * p0[c] - 5 * p1[c] + 4 * p2[c] - p3[c]) * t2 + (-p0[c] + 3 * p1[c] - 3 * p2[c] + p3[c]) * t3))); }
  }
  out.push(closed ? [...P[0]] : [...P[n - 1]]); return out;
}
// arc-length sampler: pathOf(pts).at(u) -> [x, y, angle]; .slice(u) -> the points drawn so far (draw-on lines)
export function pathOf(pts, smooth = true) {
  const D = smooth && pts.length > 2 ? catmull(pts) : pts, L = [0];
  for (let i = 1; i < D.length; i++) L.push(L[i - 1] + Math.hypot(D[i][0] - D[i - 1][0], D[i][1] - D[i - 1][1]));
  const T = L[L.length - 1] || 1;
  const idx = (u) => { const lim = clamp(u) * T; let i = 1; while (i < D.length - 1 && L[i] < lim) i++; return [i, (lim - L[i - 1]) / ((L[i] - L[i - 1]) || 1)]; };
  return { length: T, points: D,
    at(u) { const [i, k] = idx(u), a = D[i - 1], b = D[i]; return [lerp(a[0], b[0], k), lerp(a[1], b[1], k), Math.atan2(b[1] - a[1], b[0] - a[0])]; },
    slice(u) { if (u <= 0) return [D[0]]; const [i, k] = idx(u), out = D.slice(0, i), a = D[i - 1], b = D[i]; out.push([lerp(a[0], b[0], clamp(k)), lerp(a[1], b[1], clamp(k))]); return out; } };
}
