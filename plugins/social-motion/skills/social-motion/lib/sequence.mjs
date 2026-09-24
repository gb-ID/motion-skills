// sequence.mjs — scenes on a timeline, joined by transitions. The film's frame() becomes one line:
//
//   const SEQ = sequence([
//     { name: "hook",  dur: 2.4, draw: (ctx, lt, S) => { … } },            // lt = local time in the scene
//     { name: "point", dur: 3.0, draw: …, in: { kind: "whip", dur: .3 } }, // transition INTO this scene
//     …
//   ], { W, H, transition: { kind: "push", dur: .35 } });                    // default transition
//   frame(ctx, t, S) { SEQ.draw(ctx, t, S); … overlays … }
//   SEQ.dur, SEQ.start("point"), SEQ.cuts  -> use for sound cues and music sync
//
// Transitions are centred on the cut. During one, the outgoing scene keeps playing past its end and the
// incoming one is held at its frame 0 until the cut — so a scene's FRAME 0 MUST ALREADY LOOK FINISHED
// (background + at least one element), or the transition reveals an empty plate.
//
// kinds: cut | fade | push | whip | slide-over | zoom | wipe | circle | shutter | glitch
//   options: dur, dir ("left" | "right" | "up" | "down"), color (wipe band / shutter bars / flash), colors (shutter), at [x, y] (circle)
import { createCanvas, clamp, lerp, inv, eIO5, eOut5, eIn, eOut, hash, rrect } from "./core.mjs";

const DIRS = { left: [-1, 0], right: [1, 0], up: [0, -1], down: [0, 1] };

export function sequence(scenes, o = {}) {
  const { W, H } = o, def = o.transition || { kind: "cut" };
  const starts = []; let acc = 0; for (const s of scenes) { starts.push(acc); acc += s.dur; }
  const trans = scenes.map((s, i) => i === 0 ? null : { ...def, ...(s.in || {}) });
  const offs = {};
  const off = (ctx, key) => { const cw = ctx.canvas?.width ?? W, ch = ctx.canvas?.height ?? H, k = key + cw;
    if (!offs[k]) { const c = createCanvas(cw, ch); offs[k] = c; } const c = offs[k], x = c.getContext("2d");
    x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, cw, ch); x.setTransform(cw / W, 0, 0, ch / H, 0, 0); return [c, x]; };
  const render = (ctx, k, lt, S) => { ctx.save(); scenes[k].draw(ctx, lt, S); ctx.restore(); };
  const toOff = (ctx, key, k, lt, S) => { const [c, x] = off(ctx, key); render(x, k, lt, S); return c; };

  function draw(ctx, t, S) {
    t = clamp(t, 0, acc - 1e-6);
    let i = scenes.length - 1; while (i > 0 && t < starts[i]) i--;
    // are we inside the transition around cut i (into scene i) or cut i+1 (out of scene i)?
    for (const k of [i, i + 1]) {
      const T = trans[k]; if (!T || T.kind === "cut") continue; const c = starts[k], d = T.dur ?? .35;
      if (t >= c - d / 2 && t < c + d / 2) return transition(ctx, t, S, k, T, (t - (c - d / 2)) / d);
    }
    render(ctx, i, t - starts[i], S);
  }

  function transition(ctx, t, S, k, T, p) {
    const A = (x) => render(x, k - 1, t - starts[k - 1], S), Bf = (x) => render(x, k, Math.max(0, t - starts[k]), S);
    const [dx, dy] = DIRS[T.dir || "left"], col = T.color || "#FFFFFF";
    switch (T.kind) {
      case "fade": { A(ctx); const b = toOff(ctx, "b", k, Math.max(0, t - starts[k]), S); ctx.save(); ctx.globalAlpha = eOut(p); ctx.drawImage(b, 0, 0, W, H); ctx.restore(); return; }
      case "push": case "whip": {
        const e = eIO5(p), a = toOff(ctx, "a", k - 1, t - starts[k - 1], S), b = toOff(ctx, "b", k, Math.max(0, t - starts[k]), S);
        const put = (ox, oy, al = 1) => { ctx.save(); ctx.globalAlpha = al; ctx.drawImage(a, ox + dx * W * e, oy + dy * H * e, W, H); ctx.drawImage(b, ox + dx * W * (e - 1), oy + dy * H * (e - 1), W, H); ctx.restore(); };
        put(0, 0);
        if (T.kind === "whip") { const v = Math.sin(p * Math.PI), n = 10, spread = 220 * v;   // directional smear, strongest mid-move
          for (let j = 0; j < n; j++) { const s = (j / (n - 1) - .5) * spread; put(-dx * s, -dy * s, .5 * v / (1 + Math.abs(j / (n - 1) - .5) * 4)); } }
        return; }
      case "slide-over": { const e = eIO5(p); A(ctx); ctx.save(); ctx.fillStyle = `rgba(0,0,0,${.5 * e})`; ctx.fillRect(0, 0, W, H); ctx.restore();
        const b = toOff(ctx, "b", k, Math.max(0, t - starts[k]), S); ctx.save(); ctx.shadowColor = "rgba(0,0,0,.4)"; ctx.shadowBlur = 60; ctx.drawImage(b, -dx * W * (1 - e), -dy * H * (1 - e), W, H); ctx.restore(); return; }
      case "zoom": {                                   // punch through A, flash, land on B
        if (p < .5) { const e = eIn(p * 2), a = toOff(ctx, "a", k - 1, t - starts[k - 1], S), s = 1 + e * 1.4;
          for (let j = 0; j < 4; j++) { const sj = s * (1 + j * .04 * e); ctx.save(); ctx.globalAlpha = j ? .25 : 1; ctx.translate(W / 2, H / 2); ctx.scale(sj, sj); ctx.drawImage(a, -W / 2, -H / 2, W, H); ctx.restore(); } }
        else { const e = eOut5((p - .5) * 2), b = toOff(ctx, "b", k, Math.max(0, t - starts[k]), S), s = lerp(1.35, 1, e); ctx.save(); ctx.translate(W / 2, H / 2); ctx.scale(s, s); ctx.drawImage(b, -W / 2, -H / 2, W, H); ctx.restore(); }
        const f = 1 - Math.abs(p - .5) * 2; ctx.save(); ctx.globalAlpha = .75 * f * f; ctx.fillStyle = col; ctx.fillRect(0, 0, W, H); ctx.restore(); return; }
      case "wipe": { const e = eIO5(p), band = T.band ?? 70; A(ctx); const b = toOff(ctx, "b", k, Math.max(0, t - starts[k]), S);
        ctx.save(); const horiz = dx !== 0, L = horiz ? W : H, pos = e * (L + band * 2) - band;
        const rect = (a0, a1) => horiz ? (dx < 0 ? [L - a1, 0, a1 - a0, H] : [a0, 0, a1 - a0, H]) : (dy < 0 ? [0, L - a1, W, a1 - a0] : [0, a0, W, a1 - a0]);
        ctx.beginPath(); ctx.rect(...rect(0, Math.max(0, pos))); ctx.clip(); ctx.drawImage(b, 0, 0, W, H); ctx.restore();
        ctx.fillStyle = col; ctx.fillRect(...rect(Math.max(0, pos), Math.max(0, pos + band))); return; }
      case "circle": { const [cx, cy] = T.at || [W / 2, H / 2], R = Math.hypot(Math.max(cx, W - cx), Math.max(cy, H - cy)) * eIO5(p);
        A(ctx); const b = toOff(ctx, "b", k, Math.max(0, t - starts[k]), S); ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, Math.max(.1, R), 0, Math.PI * 2); ctx.clip(); ctx.drawImage(b, 0, 0, W, H); ctx.restore();
        if (T.ringColor !== null) { ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, Math.max(.1, R), 0, Math.PI * 2); ctx.lineWidth = 24 * (1 - p); ctx.strokeStyle = T.ringColor || col; ctx.stroke(); ctx.restore(); } return; }
      case "shutter": { const n = T.bars ?? 5, cols = T.colors || [col]; (p < .5 ? A : Bf)(ctx);
        for (let j = 0; j < n; j++) { const d0 = j * .05, e = p < .5 ? eOut5(clamp((p - d0) / (.5 - .05 * (n - 1)))) : 1 - eIn(clamp((p - .5 - d0) / (.5 - .05 * (n - 1))));
          const bh = H / n + 2; ctx.fillStyle = cols[j % cols.length]; if (p < .5) ctx.fillRect(dx >= 0 ? 0 : W * (1 - e), j * H / n, W * e, bh); else ctx.fillRect(dx >= 0 ? W * (1 - e) : 0, j * H / n, W * e, bh); }
        return; }
      case "glitch": { const src = toOff(ctx, "a", p < .5 ? k - 1 : k, p < .5 ? t - starts[k - 1] : Math.max(0, t - starts[k]), S), f = Math.floor(t * 30);
        ctx.drawImage(src, 0, 0, W, H); const amt = Math.sin(p * Math.PI), n = 9;
        for (let j = 0; j < n; j++) { const y = hash(f * 7 + j) * H, h = (8 + hash(f * 3 + j) * 110), ox = (hash(f * 11 + j) - .5) * 260 * amt; ctx.drawImage(src, 0, y * src.height / H, src.width, h * src.height / H, ox, y, W, h); }
        ctx.save(); ctx.globalCompositeOperation = "screen"; ctx.globalAlpha = .55 * amt; ctx.drawImage(src, 14 * amt, 0, W, H); ctx.restore();
        ctx.fillStyle = col; for (let j = 0; j < 3; j++) if (hash(f + j * 5) < amt * .8) ctx.fillRect(0, hash(f * 5 + j) * H, W, 6 + hash(f + j) * 22); return; }
      default: (p < .5 ? A : Bf)(ctx);
    }
  }

  return {
    dur: acc, starts, draw, scenes,
    cuts: starts.slice(1),
    start(name) { const i = scenes.findIndex((s) => s.name === name); if (i < 0) throw new Error("no scene " + name); return starts[i]; },
    // which scene and local time a global t falls in
    at(t) { let i = scenes.length - 1; while (i > 0 && t < starts[i]) i--; return { i, name: scenes[i].name, lt: t - starts[i] }; },
    transitions: trans.map((T, i) => T && { at: starts[i], ...T }).filter(Boolean),
  };
}
