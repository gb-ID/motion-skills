// shapes.mjs — marks that draw themselves on: arrows, checks, crosses, scribble circles, underlines,
// stars, hearts, icons. p = 0..1 progress (compute it from t with inv()/ease in the film).
import { clamp, lerp, eOut5, pathOf, poly, ellipse, fill, stroke, hash, at, rrect } from "./core.mjs";

// draw a polyline on, 0..1. round caps, optional dash.
export function drawOn(ctx, pts, p, w = 10, color = "#fff", o = {}) {
  if (p <= 0) return; const P = pathOf(pts, o.smooth ?? true), S = P.slice(p); if (S.length < 2) return;
  ctx.save(); if (o.dash) ctx.setLineDash(o.dash); poly(ctx, S, false); stroke(ctx, w, color); ctx.restore(); return P;
}
// curved arrow from a to b (bend = sideways bulge as a fraction of length), head appears at the end
export function arrow(ctx, a, b, p, { w = 10, color = "#fff", bend = .25, head = 34 } = {}) {
  const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2, dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1;
  const c = [mx - dy / L * L * bend, my + dx / L * L * bend], pts = Array.from({ length: 24 }, (_, i) => { const u = i / 23; return [(1 - u) ** 2 * a[0] + 2 * (1 - u) * u * c[0] + u * u * b[0], (1 - u) ** 2 * a[1] + 2 * (1 - u) * u * c[1] + u * u * b[1]]; });
  const P = drawOn(ctx, pts, clamp(p / .85), w, color, { smooth: false });
  const hp = eOut5(clamp((p - .8) / .2)); if (!P || hp <= 0) return; const [x, y, ang] = P.at(1);
  ctx.save(); ctx.translate(x, y); ctx.rotate(ang); ctx.scale(hp, hp); poly(ctx, [[-head, -head * .6], [0, 0], [-head, head * .6]], false); stroke(ctx, w, color); ctx.restore();
}
export function check(ctx, x, y, s, p, { w = 12, color = "#fff" } = {}) { drawOn(ctx, [[x - s * .45, y], [x - s * .12, y + s * .32], [x + s * .5, y - s * .35]], p, w, color, { smooth: false }); }
export function cross(ctx, x, y, s, p, { w = 12, color = "#fff" } = {}) { drawOn(ctx, [[x - s / 2, y - s / 2], [x + s / 2, y + s / 2]], clamp(p * 2), w, color, { smooth: false }); drawOn(ctx, [[x + s / 2, y - s / 2], [x - s / 2, y + s / 2]], clamp(p * 2 - 1), w, color, { smooth: false }); }
// hand-drawn circle around something (overshoots its start, slightly wobbly) — the "look here" mark
export function scribbleCircle(ctx, x, y, rx, ry, p, { w = 9, color = "#FFD23F", seed = 1 } = {}) {
  const a0 = -2.2 + hash(seed) * .6, pts = Array.from({ length: 48 }, (_, i) => { const a = a0 + i / 47 * Math.PI * 2 * 1.12, q = 1 + .04 * Math.sin(a * 3 + seed); return [x + Math.cos(a) * rx * q, y + Math.sin(a) * ry * q * (1 + i / 470)]; });
  drawOn(ctx, pts, p, w, color);
}
// a marker underline with a little wave
export function underline(ctx, x0, x1, y, p, { w = 12, color = "#FFD23F", wave = 6 } = {}) {
  drawOn(ctx, Array.from({ length: 12 }, (_, i) => [lerp(x0, x1, i / 11), y + Math.sin(i * .9) * wave * (i / 11)]), p, w, color);
}
export function star(ctx, x, y, r, { points = 5, inner = .45, color = "#FFD23F", rot = -Math.PI / 2 } = {}) {
  poly(ctx, Array.from({ length: points * 2 }, (_, i) => { const a = rot + i * Math.PI / points, rr = i % 2 ? r * inner : r; return [x + Math.cos(a) * rr, y + Math.sin(a) * rr]; })); fill(ctx, color);
}
export function heart(ctx, x, y, s, color = "#FF3B5C") {
  ctx.beginPath(); ctx.moveTo(x, y + s * .35); ctx.bezierCurveTo(x - s * .9, y - s * .25, x - s * .45, y - s * .9, x, y - s * .38); ctx.bezierCurveTo(x + s * .45, y - s * .9, x + s * .9, y - s * .25, x, y + s * .35); fill(ctx, color);
}
// a simple play button / cursor hand-free pointer / sparkle — tiny icon vocabulary
export function playIcon(ctx, x, y, s, color = "#fff") { poly(ctx, [[x - s * .3, y - s * .4], [x + s * .45, y], [x - s * .3, y + s * .4]]); fill(ctx, color); }
export function pointer(ctx, x, y, s = 60, color = "#fff", outline = "#111") {
  poly(ctx, [[x, y], [x, y + s], [x + s * .28, y + s * .74], [x + s * .5, y + s * 1.12], [x + s * .64, y + s * 1.05], [x + s * .44, y + s * .68], [x + s * .78, y + s * .66]]);
  fill(ctx, color); stroke(ctx, s * .07, outline);
}
export function sparkle(ctx, x, y, r, color = "#fff") { poly(ctx, [[x, y - r], [x + r * .22, y - r * .22], [x + r, y], [x + r * .22, y + r * .22], [x, y + r], [x - r * .22, y + r * .22], [x - r, y], [x - r * .22, y - r * .22]]); fill(ctx, color); }
