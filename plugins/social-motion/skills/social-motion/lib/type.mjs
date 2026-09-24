// type.mjs — kinetic typography: layout, fit, word/char reveals, emphasis, counters, captions.
//
//   kinetic(ctx, t, "Stop the *scroll*", x, y, { B, role: "display", size: 170, maxW: 900, t0: .2, anim: "rise", out: 2.4 })
//   counter(ctx, t, { B, to: 12500, t0: 1, dur: 1.2, x, y, size: 220, compact: true, suffix: "+" })
//   captions(ctx, t, words, { B, x, y, size: 64 })             words = [{ w: "hello", s: 0.3, e: 0.6 }, …]
//
// Markup in any text: *word* = accent emphasis, _word_ = second accent, \n = forced line break.
// All reveals are functions of t (seekable). Every text element has an in AND an out: pass `out` (seconds).
import { clamp, lerp, inv, eOut, eOut5, eIn, eBack, spring, hash, rrect, fill, at, onColor, rgba } from "./core.mjs";

// ------------------------------------------------------------------ layout
function parse(text, upper) {
  // *one* or *several words* = emphasis 1, _word_ = emphasis 2; trailing punctuation may follow the marker
  const toks = []; let line = 0, open = 0;
  for (const part of String(text).split(/(\n)/)) {
    if (part === "\n") { line++; continue; }
    for (const raw of part.split(/\s+/).filter(Boolean)) {
      let w = raw;
      if (!open && /^[*_]/.test(w)) { open = w[0] === "*" ? 1 : 2; w = w.slice(1); }
      const e = open, close = open && new RegExp(`\\${open === 1 ? "*" : "_"}([.,!?:;"')]*)$`).exec(w);
      if (close) { w = w.slice(0, close.index) + close[1]; open = 0; }
      toks.push({ text: upper ? w.toUpperCase() : w, e, forced: line });
    }
  }
  return toks;
}
// layoutText -> { lines: [{ words: [{ text, e, x, w }], y, w }], w, h, size, lh, cap }
// coordinates are relative to the anchor: x = anchor (align decides), y = top of the block
export function layoutText(ctx, text, { font, size, maxW = 900, lineH = 1.02, align = "center", upper = false, gap = .26 } = {}) {
  ctx.save(); ctx.font = font(size);
  const toks = parse(text, upper), sp = size * gap, lines = [];
  let cur = null;
  for (const tk of toks) {
    const w = ctx.measureText(tk.text).width;
    if (!cur || tk.forced !== cur.forced || (cur.words.length && cur.w + sp + w > maxW)) { cur = { words: [], w: 0, forced: tk.forced }; lines.push(cur); }
    cur.words.push({ ...tk, w, x: cur.words.length ? cur.w + sp : 0 }); cur.w += (cur.words.length > 1 ? sp : 0) + w;
  }
  const cap = ctx.measureText("H").actualBoundingBoxAscent || size * .72; ctx.restore();
  const lh = size * lineH;
  lines.forEach((L, k) => { L.y = k * lh; const off = align === "center" ? -L.w / 2 : align === "right" ? -L.w : 0; L.words.forEach((w) => (w.x += off)); });
  return { lines, w: Math.max(0, ...lines.map((l) => l.w)), h: lines.length * lh, size, lh, cap, align };
}
// the biggest size (≤ max) at which text fits maxW in ≤ maxLines lines, no word wider than maxW
export function fitSize(ctx, text, { font, maxW, max = 200, min = 40, maxLines = 3, upper = false, lineH }) {
  for (let s = max; s >= min; s -= 4) { const L = layoutText(ctx, text, { font, size: s, maxW, upper, lineH }); if (L.lines.length <= maxLines && L.lines.every((l) => l.w <= maxW + 1)) return s; }
  return min;
}

// ------------------------------------------------------------------ drawing a word
function word(ctx, str, x, base, o) {
  if (o.strokeW) { ctx.lineJoin = "round"; ctx.miterLimit = 2; ctx.lineWidth = o.strokeW; ctx.strokeStyle = o.strokeColor || "#000"; ctx.strokeText(str, x, base); }
  ctx.fillStyle = o.color; ctx.fillText(str, x, base);
}
const SCRAMBLE = "ABCDEFGHJKLMNPQRSTUVWXYZ0123456789#%&*";

// ------------------------------------------------------------------ kinetic text
// o: { B, role, size | fit:{max,min,maxLines}, maxW, align, color, accent, accent2, t0, stagger, dur,
//      anim: rise | pop | slam | fade | slide | type | scramble, by: word | line | char,
//      out, outAnim: rise | fade | drop | none, outDur,
//      highlight: marker | underline | color (how *emphasis* shows), box: { color, pad, r } (a plate behind each line),
//      strokeW, strokeColor, shadow }
// returns the layout (so you can place things under it: y + L.h)
export function kinetic(ctx, t, text, x, y, o = {}) {
  const B = o.B, role = o.role || "display", upper = o.upper ?? (B ? B.upper(role) : false);
  const font = o.font || ((s) => B.font(role, s)), maxW = o.maxW ?? 900;
  const size = o.size ?? fitSize(ctx, text, { font, maxW, upper, ...(o.fit || {}) });
  const L = layoutText(ctx, text, { font, size, maxW, align: o.align || "center", upper, lineH: o.lineH });
  const t0 = o.t0 ?? 0, anim = o.anim || B?.style?.anim || "rise", by = o.by || (anim === "type" || anim === "scramble" ? "char" : "word");
  const stagger = o.stagger ?? (by === "char" ? .028 : by === "line" ? .12 : .07), dur = o.dur ?? (anim === "slam" ? .32 : .42);
  const color = o.color || (B ? B.c.fg : "#fff"), acc = [color, o.accent || (B ? B.c.accent : "#f53"), o.accent2 || (B ? B.c.accent2 : "#fd3")];
  const hl = o.highlight || B?.style?.highlight || "marker", outT = o.out ?? Infinity, outDur = o.outDur ?? .28, outAnim = o.outAnim || "rise";
  if (t < t0 || t > outT + outDur + stagger * 12) return L;
  const nUnits = by === "line" ? L.lines.length : L.lines.reduce((s, l) => s + (by === "char" ? l.words.reduce((a, w) => a + w.text.length, 0) : l.words.length), 0);
  ctx.save(); ctx.font = font(size); ctx.textBaseline = "alphabetic"; ctx.textAlign = "left";
  let unit = 0;
  L.lines.forEach((line, li) => {
    const top = y + line.y, base = top + (L.lh + L.cap) / 2 - L.lh * .04;
    // plate behind the line (caption-style), grows with the line's first word
    if (o.box) { const pb = o.box.pad ?? size * .18, k = eOut5(inv(t0 + li * stagger * 2, t0 + li * stagger * 2 + dur, t)) * (1 - eIn(inv(outT, outT + outDur, t)));
      if (k > 0) { const x0 = x + line.words[0].x - pb, w = line.w + pb * 2; rrect(ctx, x0 + (o.align === "left" ? 0 : w * (1 - k) / 2), top + L.lh * .04, w * k, L.lh * .96, o.box.r ?? size * .16); fill(ctx, o.box.color || acc[1]); } }
    if (by === "line") unit = li;
    line.words.forEach((w) => {
      const u0 = unit, chars = [...w.text];
      if (by === "word") unit++; else if (by === "char") unit += chars.length;
      const start = t0 + u0 * stagger, p = inv(start, start + dur, t);
      const exitStart = outT + (by === "line" ? li : Math.min(u0, 20)) * stagger * .45, q = inv(exitStart, exitStart + outDur, t);
      if (p <= 0 || q >= 1) return;
      const wx = x + w.x, cx = wx + w.w / 2, cy = top + L.lh / 2;
      let col = acc[w.e] || color; const emph = w.e > 0;
      // emphasis: a marker swipes in behind the word just after it lands
      if (emph && hl === "marker") { const m = eOut5(inv(start + dur * .5, start + dur * .5 + .3, t)) * (1 - eIn(q)), pad = size * .08;
        if (m > 0) { ctx.save(); rrect(ctx, wx - pad, top + L.lh * .08, (w.w + pad * 2) * m, L.lh * .88, size * .06); fill(ctx, acc[w.e]); ctx.restore(); }
        col = m > .5 ? onColor(acc[w.e]) : color; }
      if (emph && hl === "underline") { const m = eOut5(inv(start + dur * .5, start + dur * .5 + .3, t)) * (1 - eIn(q)); if (m > 0) { ctx.fillStyle = acc[w.e]; ctx.fillRect(wx, base + size * .08, w.w * m, size * .09); } }
      const o2 = { color: col, strokeW: o.strokeW, strokeColor: o.strokeColor };
      ctx.save();
      // exit transform first (it wraps the entrance)
      if (q > 0) { const e = eIn(q);
        if (outAnim === "fade") ctx.globalAlpha *= 1 - e;
        else if (outAnim === "drop") { ctx.translate(0, e * size * .9); ctx.globalAlpha *= 1 - e; }
        else if (outAnim === "rise") { ctx.beginPath(); ctx.rect(wx - size, top - L.lh * .1, w.w + size * 2, L.lh * 1.1); ctx.clip(); ctx.translate(0, -e * L.lh * 1.1); } }
      if (by === "char") {                     // type / scramble / per-char rise
        let cxp = wx;
        chars.forEach((ch, k) => { const cs = t0 + (u0 + k) * stagger, cp = inv(cs, cs + (anim === "type" ? .001 : dur), t), cw = ctx.measureText(ch).width;
          if (cp > 0) { if (anim === "scramble" && cp < 1) { const g = SCRAMBLE[Math.floor(hash(k * 13.1 + u0 * 7.7 + Math.floor(t * 24) * 3.3) * SCRAMBLE.length)]; word(ctx, g, cxp, base, { ...o2, color: acc[1] }); }
            else if (anim === "rise") { ctx.save(); ctx.beginPath(); ctx.rect(cxp - 4, top, cw + 8, L.lh); ctx.clip(); word(ctx, ch, cxp, base + (1 - eOut5(cp)) * L.lh, o2); ctx.restore(); }
            else word(ctx, ch, cxp, base, o2); }
          cxp += cw; });
        // typing cursor after the last visible char of the text
        if (anim === "type" && o.cursor !== false) { const last = t0 + (nUnits - 1) * stagger; if (u0 + chars.length - 1 >= Math.floor((t - t0) / stagger) && u0 <= Math.floor((t - t0) / stagger) && (t > last ? Math.floor(t * 2.5) % 2 === 0 : true)) {
          const k = Math.min(chars.length, Math.floor((t - t0) / stagger) - u0 + 1), cxx = wx + ctx.measureText(w.text.slice(0, k)).width + size * .05; ctx.fillStyle = acc[1]; ctx.fillRect(cxx, top + L.lh * .12, size * .08, L.lh * .76); } }
      } else if (anim === "rise") { ctx.beginPath(); ctx.rect(wx - size, top - L.lh * .1, w.w + size * 2, L.lh * 1.1); ctx.clip(); word(ctx, w.text, wx, base + (1 - eOut5(p)) * L.lh * 1.05, o2); }
      else if (anim === "pop") { const s = spring(t - start, 3.4, .45); at(ctx, cx, cy, Math.max(0, s), 0, () => word(ctx, w.text, wx - cx, base - cy, o2)); }
      else if (anim === "slam") { const s = lerp(2.6, 1, eOut5(p)); ctx.globalAlpha *= clamp(p * 3.5); at(ctx, cx, cy, s, 0, () => word(ctx, w.text, wx - cx, base - cy, o2)); }
      else if (anim === "slide") { ctx.globalAlpha *= eOut(p); word(ctx, w.text, wx - (1 - eOut5(p)) * size * .6, base, o2); }
      else { ctx.globalAlpha *= eOut(p); word(ctx, w.text, wx, base + (1 - eOut5(p)) * size * .35, o2); }   // fade
      ctx.restore();
    });
  });
  ctx.restore();
  return L;
}

// ------------------------------------------------------------------ counters
export function formatNum(v, { decimals = 0, sep = ",", dec = ".", compact = false, prefix = "", suffix = "" } = {}) {
  let s, unit = "";
  if (compact) { const a = Math.abs(v); if (a >= 1e9) { v /= 1e9; unit = "B"; } else if (a >= 1e6) { v /= 1e6; unit = "M"; } else if (a >= 1e3) { v /= 1e3; unit = "K"; } }
  const d = compact && unit ? Math.max(decimals, 1) : decimals;
  s = v.toFixed(d); let [i, f] = s.split("."); i = i.replace(/\B(?=(\d{3})+(?!\d))/g, sep);
  if (compact && f && /^0+$/.test(f)) f = null;
  return prefix + i + (f ? dec + f : "") + unit + suffix;
}
// a number that counts up, lands with a small punch, and never jiggles sideways (anchored on its final width)
export function counter(ctx, t, o) {
  const { B, from = 0, to, t0 = 0, dur = 1.1, x, y, size = 200, role = "display", align = "center", color, out = Infinity, outDur = .25 } = o;
  if (t < t0 || t > out + outDur) return;
  const k = eOut5(inv(t0, t0 + dur, t)), v = lerp(from, to, k), fmtO = { decimals: o.decimals, sep: o.sep, dec: o.dec, compact: o.compact, prefix: o.prefix, suffix: o.suffix };
  const str = formatNum(k >= 1 ? to : v, fmtO), fin = formatNum(to, fmtO);
  ctx.save(); ctx.font = o.font ? o.font(size) : B.font(role, size); ctx.textBaseline = "middle";
  const fw = ctx.measureText(fin).width, x0 = align === "center" ? x - fw / 2 : align === "right" ? x - fw : x;
  const land = t - (t0 + dur), punch = land > 0 ? 1 + .1 * Math.exp(-land * 9) * Math.cos(land * 30) : 1, a = clamp((t - t0) / .12) * (1 - eIn(inv(out, out + outDur, t)));
  ctx.globalAlpha *= a; at(ctx, x0 + fw / 2, y, punch, 0, () => { ctx.fillStyle = color || B.c.fg; ctx.fillText(str, -fw / 2, 0); });
  ctx.restore();
}

// ------------------------------------------------------------------ captions (TikTok style)
// wordsFromText: no transcript? spread the words over [t0, t1] by length (swap in real word timings when you have a voice-over)
export function wordsFromText(text, t0, t1) {
  const ws = String(text).split(/\s+/).filter(Boolean), wt = ws.map((w) => 2 + w.length), T = wt.reduce((a, b) => a + b, 0); let acc = t0;
  return ws.map((w, i) => { const d = (t1 - t0) * wt[i] / T, r = { w, s: acc, e: acc + d }; acc += d; return r; });
}
// when is a word spoken? wordTime(WORDS, "scroll") -> start time of its first match (nth: 2nd, 3rd…), or null.
// Lock visuals to the voice: a headline's t0, a number landing, a cut, a sound cue.
export function wordTime(words, text, nth = 0, which = "s") {
  const norm = (x) => String(x).toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ""), want = norm(text); let k = 0;
  for (const w of words) if (norm(w.w) === want && k++ === nth) return w[which];
  return null;
}
// o: { B, x, y, size, max (words per page), maxW (a page wider than this is scaled down; default 860), color, active, stroke, box, upper }
export function captions(ctx, t, words, o) {
  const { B, x, y, size = 66, max = 3, upper = true, role = "head" } = o;
  // pages: up to `max` words, break early on punctuation or a pause
  const pages = []; let cur = [];
  words.forEach((w, i) => { cur.push(w); const nx = words[i + 1]; if (cur.length >= max || /[.!?,]$/.test(w.w) || (nx && nx.s - w.e > .35) || !nx) { pages.push(cur); cur = []; } });
  const pg = pages.find((p, k) => t >= p[0].s - .02 && t < (pages[k + 1] ? pages[k + 1][0].s - .02 : p[p.length - 1].e + .4));
  if (!pg) return;
  ctx.save(); ctx.font = B.font(role, size); ctx.textBaseline = "middle"; ctx.textAlign = "left";
  const txt = pg.map((w) => upper ? w.w.toUpperCase() : w.w), sp = size * .28, ws = txt.map((s) => ctx.measureText(s).width), tot = ws.reduce((a, b) => a + b, 0) + sp * (ws.length - 1);
  const pIn = spring(t - pg[0].s, 4, .6), fit = Math.min(1, (o.maxW ?? 860) / (tot + size * .4)); let cx = x - tot / 2;
  at(ctx, x, y, lerp(.85, 1, pIn) * fit, 0, () => pg.forEach((w, k) => {
    const on = t >= w.s && t < w.e + .05, px = cx - x;
    if (on && o.box !== false) { const pad = size * .14, k2 = spring(t - w.s, 5, .6); rrect(ctx, px - pad, -size * .62, ws[k] + pad * 2, size * 1.2, size * .18); ctx.globalAlpha = clamp(k2); fill(ctx, o.active || B.c.accent); ctx.globalAlpha = 1; }
    word(ctx, txt[k], px, size * .04, { color: on ? (o.box === false ? (o.active || B.c.accent2) : onColor(o.active || B.c.accent)) : (o.color || "#fff"), strokeW: o.stroke ?? size * .16, strokeColor: rgba("#000000", on && o.box !== false ? 0 : .85) });
    cx += ws[k] + sp; }));
  ctx.restore();
}
