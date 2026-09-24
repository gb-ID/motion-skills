// fx.mjs — backgrounds that never sit dead, film finish (grain + vignette), camera, shake, zoom punches,
// flashes and particles. All pure functions of t: seeded, no state between frames.
import { createCanvas, clamp, lerp, inv, eOut, eOut5, eIn, rng, hash, noise1, rgba, mix, at, ellipse, fill, rrect } from "./core.mjs";

// ------------------------------------------------------------------ backgrounds (layer 1 of every frame)
// linear gradient that slowly rotates: the cheapest background that is never static
export function bgGradient(ctx, W, H, t, [c0, c1], { angle = 60, drift = 6 } = {}) {
  const a = (angle + Math.sin(t * .35) * drift) * Math.PI / 180, R = Math.hypot(W, H) / 2, cx = W / 2, cy = H / 2;
  const g = ctx.createLinearGradient(cx - Math.cos(a) * R, cy - Math.sin(a) * R, cx + Math.cos(a) * R, cy + Math.sin(a) * R);
  g.addColorStop(0, c0); g.addColorStop(1, c1); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
}
// mesh gradient: a base colour plus soft colour blobs drifting on slow Lissajous paths
export function bgMesh(ctx, W, H, t, base, colors, { seed = 1, speed = .18, size = .75, alpha = .85 } = {}) {
  ctx.fillStyle = base; ctx.fillRect(0, 0, W, H); const r = rng(seed * 97 + 3);
  colors.forEach((c, k) => { const fx = .5 + r() * .6, fy = .4 + r() * .6, px = r() * 6, py = r() * 6;
    const x = W * (.5 + .42 * Math.sin(t * speed * fx + px)), y = H * (.5 + .4 * Math.cos(t * speed * fy + py)), R = Math.max(W, H) * size * (.8 + r() * .4);
    const g = ctx.createRadialGradient(x, y, 0, x, y, R); g.addColorStop(0, rgba(c, alpha)); g.addColorStop(1, rgba(c, 0)); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); });
}
// dot grid / line grid / diagonal stripes drifting — texture for flat colour plates
export function bgDots(ctx, W, H, t, { gap = 54, r = 3, color = "rgba(255,255,255,.08)", drift = [12, -18] } = {}) {
  const ox = ((t * drift[0]) % gap + gap) % gap, oy = ((t * drift[1]) % gap + gap) % gap; ctx.fillStyle = color;
  for (let y = -gap + oy; y < H + gap; y += gap) for (let x = -gap + ox; x < W + gap; x += gap) { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); }
}
export function bgGrid(ctx, W, H, t, { gap = 90, w = 2, color = "rgba(255,255,255,.06)", drift = [0, -20] } = {}) {
  const ox = ((t * drift[0]) % gap + gap) % gap, oy = ((t * drift[1]) % gap + gap) % gap; ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = w; ctx.beginPath();
  for (let x = ox - gap; x < W + gap; x += gap) { ctx.moveTo(x, 0); ctx.lineTo(x, H); } for (let y = oy - gap; y < H + gap; y += gap) { ctx.moveTo(0, y); ctx.lineTo(W, y); } ctx.stroke(); ctx.restore();
}
export function bgStripes(ctx, W, H, t, { gap = 70, w = 26, angle = -30, color = "rgba(255,255,255,.05)", speed = 30 } = {}) {
  ctx.save(); ctx.translate(W / 2, H / 2); ctx.rotate(angle * Math.PI / 180); const R = Math.hypot(W, H), o = (t * speed) % gap; ctx.fillStyle = color;
  for (let x = -R + o; x < R; x += gap) ctx.fillRect(x, -R, w, R * 2); ctx.restore();
}

// the kit's plate: B.style.plate (mesh | gradient | flat) + B.style.texture (dots | grid | stripes | none).
// seed parks the blobs differently per scene, so cuts still read as cuts inside one look.
export function plate(ctx, W, H, t, B, seed = 1) {
  const S = B.style || {}, blobs = (S.blobs || ["accent"]).map((v) => B.color(v)), dark = (B.c.bg || "#000").match(/^#?([0-9a-f]{2})/i) && parseInt(B.c.bg.slice(1, 3), 16) < 128;
  if (S.plate === "gradient") bgGradient(ctx, W, H, t + seed, [B.c.bg, B.color(S.gradientTo || "surface")]);
  else if (S.plate === "flat") { ctx.fillStyle = B.c.bg; ctx.fillRect(0, 0, W, H); }
  else bgMesh(ctx, W, H, t + seed * 7, B.c.bg, blobs, { seed, alpha: S.blobAlpha ?? .4, size: S.blobSize ?? .6 });
  const tex = dark ? "rgba(255,255,255,.07)" : "rgba(0,0,0,.05)";
  if (S.texture === "dots") bgDots(ctx, W, H, t, { color: tex }); else if (S.texture === "grid") bgGrid(ctx, W, H, t, { color: tex }); else if (S.texture === "stripes") bgStripes(ctx, W, H, t, { color: tex });
}

// ------------------------------------------------------------------ finish (last layer of every frame)
// film grain from a few precomputed tiles, cycled per frame with seeded offsets. Build ONCE in setup().
export function makeGrain({ amount = .06, tiles = 4, size = 256 } = {}) {
  const T = Array.from({ length: tiles }, (_, k) => { const c = createCanvas(size, size), x = c.getContext("2d"), d = x.createImageData(size, size), r = rng(71 + k * 13);
    for (let i = 0; i < size * size; i++) { const v = Math.floor(r() * 255); d.data[i * 4] = d.data[i * 4 + 1] = d.data[i * 4 + 2] = v; d.data[i * 4 + 3] = 255; } x.putImageData(d, 0, 0); return c; });
  let pats = null;
  return (ctx, W, H, t, fps = 30) => { if (amount <= 0) return; pats ??= T.map((c) => ctx.createPattern(c, "repeat"));
    const f = Math.floor(t * fps + 1e-6), k = f % tiles, ox = Math.floor(hash(f) * size), oy = Math.floor(hash(f + 99) * size);
    ctx.save(); ctx.globalCompositeOperation = "overlay"; ctx.globalAlpha = amount; ctx.translate(-ox, -oy); ctx.fillStyle = pats[k]; ctx.fillRect(0, 0, W + size, H + size); ctx.restore(); };
}
export function vignette(ctx, W, H, a = .35, color = "#000000") {
  const g = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * .35, W / 2, H / 2, Math.hypot(W, H) * .6);
  g.addColorStop(0, rgba(color, 0)); g.addColorStop(1, rgba(color, a)); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
}

// ------------------------------------------------------------------ camera
// camera(ctx, W, H, { x, y, zoom, rot }, draw): everything drawn inside moves together. Keep captions and
// logos OUTSIDE the camera so they stay locked to the screen.
export function camera(ctx, W, H, { x = 0, y = 0, zoom = 1, rot = 0 } = {}, fn) {
  ctx.save(); ctx.translate(W / 2 + x, H / 2 + y); ctx.rotate(rot); ctx.scale(zoom, zoom); ctx.translate(-W / 2, -H / 2); fn(); ctx.restore();
}
// slow push-in over a shot: never let a hold be perfectly still
export const push = (t, t0, t1, amt = .06) => 1 + amt * eOut(inv(t0, t1, t));
// zoom punch on beats / hits: returns a scale, 1 at rest
export function punch(t, times, amp = .06, decay = 10) { let s = 1; for (const t0 of times) { const d = t - t0; if (d >= 0 && d < .6) s += amp * Math.exp(-d * decay); } return s; }
// screen shake: [[t0, amplitude px], …] -> [dx, dy]
export function shake(t, events, dur = .4) {
  let x = 0, y = 0;
  for (const [t0, amp] of events) { const d = t - t0; if (d < 0 || d > dur) continue; const k = Math.exp(-d * 10) * amp; x += Math.sin(d * 97 + t0) * k; y += Math.cos(d * 83 + t0 * 3) * k * .8; }
  return [x, y];
}
// full-screen flash at t0 (white by default); cap alpha so it reads as light, not a blank frame
export function flash(ctx, W, H, t, t0, { dur = .18, color = "#FFFFFF", max = .8 } = {}) {
  const d = t - t0; if (d < 0 || d > dur) return; ctx.save(); ctx.globalAlpha = max * (1 - d / dur) ** 2; ctx.fillStyle = color; ctx.fillRect(0, 0, W, H); ctx.restore();
}

// ------------------------------------------------------------------ particles
// kind: confetti | spark | dust | dots.  Seeded per call (seed), a pure function of (t - t0).
export function particles(ctx, t, t0, x, y, o = {}) {
  const d = t - t0, { n = 40, speed = 900, life = 1.4, gravity = 1500, colors = ["#FF5A36", "#FFD23F", "#3DDC97", "#FFFFFF"], size = 14, kind = "confetti", seed = 1, spread = Math.PI * 2, dir = -Math.PI / 2, drag = 1.6 } = o;
  if (d < 0 || d > life) return; const r = rng(seed * 131 + 7);
  ctx.save();
  for (let k = 0; k < n; k++) {
    const a = dir + (r() - .5) * spread, v = speed * (.35 + r() * .65), sz = size * (.5 + r() * .7), col = colors[k % colors.length], spin = (r() - .5) * 18, ph = r() * 6, lf = life * (.6 + r() * .4);
    if (d > lf) continue;
    const dd = (1 - Math.exp(-drag * d)) / drag, px = x + Math.cos(a) * v * dd, py = y + Math.sin(a) * v * dd + .5 * gravity * d * d * (kind === "dust" ? -.05 : 1) * .5;
    ctx.globalAlpha = clamp(1 - Math.pow(d / lf, 3));
    if (kind === "confetti") at(ctx, px, py, 1, ph + spin * d, () => { ctx.fillStyle = col; ctx.fillRect(-sz / 2, -sz * .3 * Math.abs(Math.cos(d * 9 + ph)), sz, sz * .6 * Math.abs(Math.cos(d * 9 + ph)) + 1); });
    else if (kind === "spark") { const L = sz * 2.2 * (1 - d / lf); ctx.strokeStyle = col; ctx.lineWidth = sz * .3; ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px - Math.cos(a) * L, py - Math.sin(a) * L); ctx.stroke(); }
    else { ellipse(ctx, px, py, sz * (kind === "dust" ? 1 + d * 2 : .5)); fill(ctx, kind === "dust" ? rgba(col.startsWith("#") ? col : "#ffffff", .35) : col); }
  }
  ctx.restore();
}
// expanding ring (a tap, a landing, a beat)
export function ring(ctx, t, t0, x, y, { r0 = 20, r1 = 160, dur = .45, w = 8, color = "#FFFFFF" } = {}) {
  const d = t - t0; if (d < 0 || d > dur) return; const k = eOut(d / dur); ctx.save(); ctx.globalAlpha = 1 - k; ellipse(ctx, x, y, lerp(r0, r1, k)); ctx.lineWidth = w * (1 - k * .7); ctx.strokeStyle = color; ctx.stroke(); ctx.restore();
}
// short radial lines around a point: a pop, an "aha"
export function burstLines(ctx, t, t0, x, y, { n = 10, r0 = 60, r1 = 140, dur = .35, w = 8, color = "#FFD23F", rot = 0 } = {}) {
  const d = t - t0; if (d < 0 || d > dur) return; const k = eOut5(d / dur), a0 = lerp(r0, r1, k * .6), a1 = lerp(r0, r1, k);
  ctx.save(); ctx.strokeStyle = color; ctx.lineCap = "round"; ctx.lineWidth = w * (1 - k * .6);
  for (let i = 0; i < n; i++) { const a = rot + i / n * Math.PI * 2; ctx.beginPath(); ctx.moveTo(x + Math.cos(a) * a0, y + Math.sin(a) * a0); ctx.lineTo(x + Math.cos(a) * a1, y + Math.sin(a) * a1); ctx.stroke(); }
  ctx.restore();
}
