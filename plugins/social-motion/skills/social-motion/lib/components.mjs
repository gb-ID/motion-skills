// components.mjs — the building blocks social edits are made of. Each takes (ctx, t, opts), reads the
// brand kit, and has an entrance (t0) and an exit (out). Positions are in design px.
//
//   tag(ctx, t, { B, text: "TIP #1", x, y, t0 })                         rounded label that pops in
//   card(ctx, t, { B, x, y, w, h, t0, out }, (ctx, lt) => { … })         spring-in card, draw inside it
//   list(ctx, t, { B, items: ["one", "two"], x, y, w, t0 })              numbered rows with checks
//   lowerThird(ctx, t, { B, name, title, x, y, t0, out })
//   cta(ctx, t, { B, text: "Follow for more", x, y, t0, tap: 2.1 })      button + tap ripple
//   logoSting(ctx, t, { B, x, y, size, t0 })                             logo (or brand name) reveal
//   progress(ctx, t, { B, W, dur, y })                                   thin story progress bar
import { createCanvas, clamp, lerp, inv, eOut5, eIn, eOut, spring, rrect, fill, stroke, ellipse, at, rgba, onColor, shadow } from "./core.mjs";
import { kinetic } from "./type.mjs";
import { check, pointer } from "./shapes.mjs";
import { ring, burstLines } from "./fx.mjs";

const exitK = (t, out, d = .25) => eIn(inv(out ?? Infinity, (out ?? Infinity) + d, t));

// a pill label: "TIP #1", "NEW", "STEP 2"
export function tag(ctx, t, { B, text, x, y, t0 = 0, out, size = 40, color, textColor, rot = -.04, align = "center" }) {
  if (t < t0) return; const s = spring(t - t0, 3.4, .45) * (1 - exitK(t, out)); if (s <= .001) return;
  ctx.save(); ctx.font = B.font("head", size); const w = ctx.measureText(text).width + size * 1.1, h = size * 1.6, bg = color || B.c.accent;
  at(ctx, x + (align === "left" ? w / 2 : 0), y, s, rot * (1 - clamp(s)) + rot, () => { rrect(ctx, -w / 2, -h / 2, w, h, h / 2); fill(ctx, bg);
    ctx.fillStyle = textColor || onColor(bg); ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(text, 0, size * .06); });
  ctx.restore(); return w;
}
// a card that springs up from below and settles; draw(ctx, lt, box) paints its content in card space
export function card(ctx, t, { B, x, y, w, h, t0 = 0, out, color, radius, from = 140, tilt = .03 }, draw) {
  if (t < t0) return; const s = spring(t - t0, 2.6, .58), k = exitK(t, out, .3); if (k >= 1) return;
  ctx.save(); ctx.globalAlpha *= clamp((t - t0) / .12) * (1 - k);
  at(ctx, x + w / 2, y + h / 2 + (1 - s) * from + k * 80, lerp(.92, 1, clamp(s)), (1 - s) * tilt, () => {
    shadow(ctx, () => { rrect(ctx, -w / 2, -h / 2, w, h, radius ?? B.radius); fill(ctx, color || B.c.surface); }, { blur: 50, y: 24, color: "rgba(0,0,0,.35)" });
    ctx.translate(-w / 2, -h / 2); draw && draw(ctx, t - t0, { w, h }); });
  ctx.restore();
}
// numbered list; each row: badge pops, text slides, optional check draws on
export function list(ctx, t, { B, items, x, y, w = 820, t0 = 0, stagger = .45, row = 150, size = 54, out, checks = true, numbered = true }) {
  items.forEach((it, k) => {
    const s = t0 + k * stagger, ry = y + k * row; if (t < s) return;
    const b = spring(t - s, 3.2, .5) * (1 - exitK(t, out)), R = size * .72;
    at(ctx, x + R, ry, Math.max(0, b), 0, () => { ellipse(ctx, 0, 0, R); fill(ctx, B.c.accent); if (numbered) { ctx.font = B.font("head", size * .8); ctx.fillStyle = onColor(B.c.accent); ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(String(k + 1), 0, size * .05); } });
    kinetic(ctx, t, it, x + R * 2 + 34, ry - size * .58, { B, role: "body", size, maxW: w - R * 2 - 34, align: "left", t0: s + .08, anim: "fade", stagger: .04, out, upper: false });
    if (checks) check(ctx, x + w - 30, ry, size * .9, eOut5(inv(s + .35, s + .65, t)) * (1 - exitK(t, out)), { w: size * .16, color: B.c.accent3 });
  });
}
// name + title plate: a bar grows, the plate unrolls, text rises
export function lowerThird(ctx, t, { B, name, title, x, y, t0 = 0, out, w = 700 }) {
  if (t < t0) return; const k = exitK(t, out, .3), bar = eOut5(inv(t0, t0 + .35, t)) * (1 - k), plate = eOut5(inv(t0 + .1, t0 + .55, t)) * (1 - k);
  ctx.save(); rrect(ctx, x, y, 14, 150 * bar, 7); fill(ctx, B.c.accent);
  ctx.beginPath(); ctx.rect(x + 14, y, w * plate, 150); ctx.clip(); rrect(ctx, x + 14 - 20, y, w + 20, 150, 18); fill(ctx, rgba(B.c.surface, .92));
  ctx.restore();
  kinetic(ctx, t, name, x + 44, y + 12, { B, role: "head", size: 58, align: "left", maxW: w - 60, t0: t0 + .25, anim: "rise", out, upper: false });
  kinetic(ctx, t, title, x + 44, y + 82, { B, role: "body", size: 36, align: "left", maxW: w - 60, t0: t0 + .38, anim: "rise", color: B.c.muted, out, upper: false });
}
// call to action: button springs in, breathes, a pointer taps it at `tap` (ring + press)
export function cta(ctx, t, { B, text, x, y, t0 = 0, tap, out, size = 56, color }) {
  if (t < t0) return; const s = spring(t - t0, 3, .5) * (1 - exitK(t, out)); if (s <= .001) return;
  const bg = color || B.c.accent, press = tap != null ? 1 - .08 * Math.exp(-Math.max(0, t - tap) * 10) * (t > tap ? 1 : 0) : 1, breathe = 1 + .025 * Math.sin((t - t0) * 5);
  ctx.save(); ctx.font = B.font("head", size); const w = ctx.measureText(text).width + size * 1.6, h = size * 2;
  at(ctx, x, y, s * press * breathe, 0, () => { shadow(ctx, () => { rrect(ctx, -w / 2, -h / 2, w, h, h / 2); fill(ctx, bg); }, { blur: 40, y: 14, color: rgba(bg, .5) });
    ctx.fillStyle = onColor(bg); ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(text, 0, size * .06); });
  if (tap != null) { ring(ctx, t, tap, x + w * .18, y + 10, { r0: 10, r1: 120, color: B.c.fg, w: 6 });
    const e = eOut5(inv(tap - .55, tap - .05, t)), ex = eIn(inv(tap + .35, tap + .7, t)), px = lerp(x + w * .7, x + w * .18, e) + ex * 200, py = lerp(y + 320, y + 10, e) + ex * 260;
    if (t > tap - .55 && ex < 1) { ctx.globalAlpha *= 1 - ex; pointer(ctx, px, py, 78, "#fff", "#111"); } }
  ctx.restore();
}
// logo reveal: a ring bursts, the logo springs in, a shine sweeps across. Falls back to the brand name.
export function logoSting(ctx, t, { B, x, y, size = 260, t0 = 0, out, text }) {
  if (t < t0) return; const s = spring(t - t0 - .08, 2.8, .45) * (1 - exitK(t, out));
  ring(ctx, t, t0, x, y, { r0: size * .3, r1: size * 1.1, color: B.c.accent, w: 14, dur: .5 });
  burstLines(ctx, t, t0 + .12, x, y, { r0: size * .62, r1: size * .95, color: B.c.accent2, w: 10, n: 12 });
  if (s <= .001) return;
  // the mark is drawn into its own small canvas so the shine can be clipped to its pixels (source-atop)
  const str = B.upper("display") ? (text || B.name).toUpperCase() : (text || B.name), fs = size * .42;
  let w, h; if (B.logo) { const r = B.logo.width / B.logo.height; w = r >= 1 ? size : size * r; h = r >= 1 ? size / r : size; }
  else { ctx.save(); ctx.font = B.font("display", fs); w = ctx.measureText(str).width + 8; h = fs * 1.3; ctx.restore(); }
  const q = 2, oc = createCanvas(Math.ceil(w * q), Math.ceil(h * q)), ox = oc.getContext("2d"); ox.scale(q, q);
  if (B.logo) ox.drawImage(B.logo, 0, 0, w, h); else { ox.font = B.font("display", fs); ox.fillStyle = B.c.fg; ox.textBaseline = "middle"; ox.fillText(str, 4, h / 2 + fs * .03); }
  const sh = inv(t0 + .45, t0 + 1.05, t);
  if (sh > 0 && sh < 1) { ox.globalCompositeOperation = "source-atop"; ox.translate(lerp(-w * .3, w * 1.3, sh), h / 2); ox.rotate(.35); const glint = B.logo ? "#FFFFFF" : B.c.accent2;   // a white glint is invisible on white type
    ox.fillStyle = rgba(glint, .8); ox.fillRect(-18, -h * 2, 36, h * 4);
    ox.fillStyle = rgba(glint, .4); ox.fillRect(26, -h * 2, 12, h * 4); }
  ctx.save(); at(ctx, x, y, Math.max(0, s), 0, () => ctx.drawImage(oc, -w / 2, -h / 2, w, h)); ctx.restore();
}
// story-style progress bar along the top (decor; keep it thin)
export function progress(ctx, t, { B, W, dur, y = 60, h = 8, x = 70, color }) {
  const w = W - x * 2; rrect(ctx, x, y, w, h, h / 2); fill(ctx, rgba(B.c.fg, .18)); rrect(ctx, x, y, Math.max(h, w * clamp(t / dur)), h, h / 2); fill(ctx, color || B.c.fg);
}
