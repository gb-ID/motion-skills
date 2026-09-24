// charts.mjs — data that animates: bars, columns, donut, line. Values count up while shapes grow, and the
// one number the viewer should remember is the highlighted one (everything else is muted).
//
//   bars(ctx, t, { B, data: [{ label: "Mon", value: 12 }, …], x, y, w, t0: 1, highlight: 2 })
//   columns(ctx, t, { B, data, x, y, w, h, t0 })
//   donut(ctx, t, { B, value: .72, x, y, r: 220, t0 })
//   lineChart(ctx, t, { B, values: [3, 5, 4, 8, 12], x, y, w, h, t0 })
import { clamp, lerp, inv, eOut5, eIn, spring, rrect, fill, ellipse, rgba, mix, pathOf, poly, stroke } from "./core.mjs";
import { formatNum } from "./type.mjs";

const fade = (t, out, outDur = .25) => 1 - eIn(inv(out ?? Infinity, (out ?? Infinity) + outDur, t));

// horizontal bars, one row per item: label on top, bar, value at the bar's end
export function bars(ctx, t, o) {
  const { B, data, x, y, w, size = 46, row = size * 3.3, barH = size * 1.2, t0 = 0, stagger = .1, dur = .8, highlight = -1, fmt = {}, out } = o;
  const max = o.max ?? Math.max(...data.map((d) => d.value)), a = fade(t, out); if (t < t0 || a <= 0) return;
  ctx.save(); ctx.globalAlpha *= a;
  data.forEach((d, k) => {
    const s = t0 + k * stagger, p = eOut5(inv(s, s + dur, t)), ry = y + k * row, hi = k === highlight || d.hi, col = d.color || (hi ? B.c.accent : (highlight < 0 ? B.cycle[k % B.cycle.length] : rgba(B.c.muted, .55)));
    if (t < s) return;
    ctx.globalAlpha = a * clamp((t - s) / .15);
    ctx.font = B.font("body", size); ctx.fillStyle = hi ? B.c.fg : B.c.muted; ctx.textBaseline = "alphabetic"; ctx.fillText(d.label, x, ry + size);
    const by = ry + size * 1.4; rrect(ctx, x, by, w, barH, barH / 2); fill(ctx, rgba(B.c.fg, .08));
    const bw = Math.max(barH, w * (d.value / max) * p); rrect(ctx, x, by, bw, barH, barH / 2); fill(ctx, col);
    ctx.font = B.font("head", size * (hi ? 1.15 : 1)); ctx.fillStyle = hi ? B.c.accent : B.c.muted; ctx.textAlign = "right"; ctx.fillText(formatNum(d.value * p, fmt), x + w, ry + size); ctx.textAlign = "left";
  });
  ctx.restore();
}
// vertical columns on a baseline at y + h
export function columns(ctx, t, o) {
  const { B, data, x, y, w, h, t0 = 0, stagger = .08, gap = .28, highlight = -1, fmt = {}, out } = o;
  const max = o.max ?? Math.max(...data.map((d) => d.value)), n = data.length, cw = w / (n + (n - 1) * gap), a = fade(t, out); if (t < t0 || a <= 0) return;
  ctx.save(); ctx.globalAlpha *= a; ctx.textAlign = "center";
  data.forEach((d, k) => {
    const s = t0 + k * stagger, sp = spring(t - s, 2.6, .62), cx = x + k * cw * (1 + gap), hh = h * (d.value / max) * sp, hi = k === highlight || d.hi;
    if (t < s) return;
    rrect(ctx, cx, y + h - hh, cw, Math.max(0, hh), Math.min(cw * .22, 24)); fill(ctx, d.color || (hi ? B.c.accent : highlight < 0 ? B.cycle[k % B.cycle.length] : rgba(B.c.fg, .22)));
    ctx.fillStyle = hi ? B.c.fg : B.c.muted; ctx.font = B.font("body", 32); ctx.fillText(d.label, cx + cw / 2, y + h + 46);
    ctx.globalAlpha = a * clamp((t - s - .2) / .2); ctx.font = B.font("head", hi ? 44 : 34); ctx.fillStyle = hi ? B.c.accent : B.c.fg; ctx.fillText(formatNum(d.value * clamp(sp), fmt), cx + cw / 2, y + h - hh - 18); ctx.globalAlpha = a;
  });
  ctx.restore();
}
// donut / progress ring with the percentage counting up in the middle
export function donut(ctx, t, o) {
  const { B, value, x, y, r = 220, thick = 54, t0 = 0, dur = 1.2, color, label, out } = o, a = fade(t, out); if (t < t0 || a <= 0) return;
  const p = eOut5(inv(t0, t0 + dur, t)), s = spring(t - t0, 2.4, .6);
  ctx.save(); ctx.globalAlpha *= a; ctx.translate(x, y); ctx.scale(lerp(.7, 1, clamp(s)), lerp(.7, 1, clamp(s)));
  ctx.lineCap = "round"; ctx.lineWidth = thick; ctx.strokeStyle = rgba(B.c.fg, .1); ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.stroke();
  if (p > .001) { ctx.strokeStyle = color || B.c.accent; ctx.beginPath(); ctx.arc(0, 0, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * value * p); ctx.stroke(); }
  ctx.fillStyle = B.c.fg; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.font = B.font("display", r * .62); ctx.fillText(Math.round(value * 100 * p) + "%", 0, label ? -r * .08 : 0);
  if (label) { ctx.font = B.font("body", r * .16); ctx.fillStyle = B.c.muted; ctx.fillText(label, 0, r * .34); }
  ctx.restore();
}
// line chart drawn on left to right, with a glowing head dot and a soft area fill
export function lineChart(ctx, t, o) {
  const { B, values, x, y, w, h, t0 = 0, dur = 1.4, color, out, lw = 10 } = o, a = fade(t, out); if (t < t0 || a <= 0) return;
  const mn = o.min ?? Math.min(...values), mx = o.max ?? Math.max(...values), pts = values.map((v, i) => [x + w * i / (values.length - 1), y + h - h * (v - mn) / ((mx - mn) || 1)]);
  const P = pathOf(pts), p = eOut5(inv(t0, t0 + dur, t)), S = P.slice(p), col = color || B.c.accent, head = P.at(p);
  ctx.save(); ctx.globalAlpha *= a;
  ctx.strokeStyle = rgba(B.c.fg, .08); ctx.lineWidth = 2; for (let k = 0; k <= 4; k++) { ctx.beginPath(); ctx.moveTo(x, y + h * k / 4); ctx.lineTo(x + w, y + h * k / 4); ctx.stroke(); }
  if (S.length > 1) { const g = ctx.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, rgba(col, .35)); g.addColorStop(1, rgba(col, 0));
    poly(ctx, [...S, [S[S.length - 1][0], y + h], [x, y + h]]); fill(ctx, g); poly(ctx, S, false); stroke(ctx, lw, col); }
  ctx.shadowColor = col; ctx.shadowBlur = 30; ellipse(ctx, head[0], head[1], lw * 1.6); fill(ctx, B.c.fg);
  ctx.restore();
  return head;
}
