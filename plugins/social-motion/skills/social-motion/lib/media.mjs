// media.mjs — stock photos, cut-out subjects and video clips (b-roll), treated so they sit inside the brand.
//
//   const IMG = await loadImages({ hero: "assets/cafe.jpg", cup: "assets/cup.png" });     // in setup / top level
//   photo(ctx, lt, { img: IMG.hero, x: 0, y: 0, w: W, h: H, zoom: [1, 1.12], dur: 4, grade: { contrast: 1.1 }, tint: { color: B.c.bg, alpha: .45 } })
//   cutout(ctx, lt, { img: IMG.cup, x: 540, y: 1100, h: 700, t0: .3, outline: { color: "#fff", w: 14 } })
//   const CLIP = await prepClip("assets/pour.mp4", { fps: 30, w: 1080, dur: 4 });    // once, top level: extract + decode frames
//   clip(ctx, lt, { clip: CLIP, x: 0, y: 0, w: W, h: H, t0: 0 })                      // plays the clip at scene time
//
// All of it is a function of t: the same frame always shows the same pixels (verify still passes).
// Licensing: only use images/footage you have rights to (your own shoots, the client's library, or stock
// with a licence that covers social ads). Keep the licence note next to the file in assets/.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import { ffmpegPath } from "./ffmpeg.mjs";
import { createCanvas, loadImage, clamp, lerp, inv, eOut5, eIn, eIO, spring, rrect, rgba, at, shadow } from "./core.mjs";

// ------------------------------------------------------------------ loading
// { name: "path/to/file.jpg" } -> { name: Image }. Paths resolve from `dir` (default: cwd). Throws on a missing file.
export async function loadImages(map, dir = process.cwd()) {
  const out = {};
  for (const [k, p] of Object.entries(map)) { const f = path.resolve(dir, p); if (!fs.existsSync(f)) throw new Error(`media: missing ${f}`); out[k] = await loadImage(fs.readFileSync(f)); }
  return out;
}

// ------------------------------------------------------------------ geometry
// source rect for cover / contain with a focus point (0..1, 0..1): which part of the photo stays in frame
function fitRect(iw, ih, w, h, fit, focus, zoom) {
  const s = (fit === "contain" ? Math.min(w / iw, h / ih) : Math.max(w / iw, h / ih)) * zoom, sw = w / s, sh = h / s;
  const [fx, fy] = focus; return [clamp(iw * fx - sw / 2, Math.min(0, iw - sw), Math.max(0, iw - sw)), clamp(ih * fy - sh / 2, Math.min(0, ih - sh), Math.max(0, ih - sh)), sw, sh];
}
const gradeFilter = (g) => !g ? "none" : [g.bright != null && `brightness(${g.bright})`, g.contrast != null && `contrast(${g.contrast})`, g.sat != null && `saturate(${g.sat})`, g.blur && `blur(${g.blur}px)`].filter(Boolean).join(" ") || "none";

// draw an image into a box with cover/contain, Ken Burns zoom/pan, grade, duotone and tint
function paint(ctx, img, x, y, w, h, o, k) {
  const { fit = "cover", focus = [.5, .5], zoom = [1, 1], pan = [0, 0] } = o, z = lerp(zoom[0], zoom[1], k);
  const f = [focus[0] + pan[0] * k, focus[1] + pan[1] * k], [sx, sy, sw, sh] = fitRect(img.width, img.height, w, h, fit, f, z);
  ctx.save(); ctx.filter = o.duotone ? "saturate(0) " + (gradeFilter(o.grade) === "none" ? "" : gradeFilter(o.grade)) : gradeFilter(o.grade);
  if (fit === "contain") { const s = Math.min(w / img.width, h / img.height) * z, dw = img.width * s, dh = img.height * s; ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh); }
  else ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
  ctx.restore();
  if (o.duotone) { const [dark, light] = o.duotone; ctx.save(); ctx.globalCompositeOperation = "multiply"; ctx.fillStyle = light; ctx.fillRect(x, y, w, h); ctx.globalCompositeOperation = "screen"; ctx.fillStyle = dark; ctx.fillRect(x, y, w, h); ctx.restore(); }
  if (o.tint) { ctx.save(); ctx.globalCompositeOperation = o.tint.mode || "source-over"; ctx.fillStyle = rgba(o.tint.color, o.tint.alpha ?? .4); ctx.fillRect(x, y, w, h); ctx.restore(); }
  if (o.fade) { const g = ctx.createLinearGradient(0, y + h * (1 - (o.fade.size ?? .45)), 0, y + h); g.addColorStop(0, rgba(o.fade.color, 0)); g.addColorStop(1, rgba(o.fade.color, 1)); ctx.fillStyle = g; ctx.fillRect(x, y, w, h); }
}

// ------------------------------------------------------------------ photo
// o: { img, x, y, w, h, fit: cover|contain, focus: [fx, fy], zoom: [from, to], pan: [dfx, dfy], dur (Ken Burns length),
//      t0, out, from: fade|rise|scale|wipe|none, radius, grade: { bright, contrast, sat, blur }, duotone: [dark, light],
//      tint: { color, alpha, mode }, fade: { color, size } (gradient to a colour at the bottom, for text on top), shadow }
export function photo(ctx, t, o) {
  const { img, x, y, w, h, t0 = 0, out = Infinity, outDur = .3, from = "fade", radius = 0, dur = 5 } = o;
  if (!img || t < t0 || t > out + outDur) return;
  const e = from === "none" ? 1 : eOut5(inv(t0, t0 + .5, t)), q = eIn(inv(out, out + outDur, t)), k = inv(t0, t0 + dur, t);
  ctx.save(); ctx.globalAlpha *= (from === "fade" || from === "scale" ? e : clamp(e * 3)) * (1 - q);
  let dy = 0, s = 1; if (from === "rise") dy = (1 - e) * 120; if (from === "scale") s = lerp(1.12, 1, e);
  at(ctx, x + w / 2, y + h / 2 + dy, s, 0, () => {
    const box = () => { if (radius) rrect(ctx, -w / 2, -h / 2, w, h, radius); else { ctx.beginPath(); ctx.rect(-w / 2, -h / 2, from === "wipe" ? w * e : w, h); } };
    if (o.shadow) shadow(ctx, () => { box(); ctx.fillStyle = "#000"; ctx.fill(); }, o.shadow === true ? {} : o.shadow);
    box(); ctx.clip(); paint(ctx, img, -w / 2, -h / 2, w, h, o, k);
  });
  ctx.restore();
}

// ------------------------------------------------------------------ cutout
// a transparent PNG subject (product, person) that pops in, floats, and can get a sticker outline + shadow.
// o: { img, x, y (bottom-centre anchor), h, t0, out, float (px), rot, outline: { color, w }, shadow }
const outlines = new Map();
function outlined(img, color, wpx) {
  const key = `${img.width}x${img.height}|${color}|${wpx}|${img.src?.length ?? 0}`; if (outlines.has(key)) return outlines.get(key);
  const pad = Math.ceil(wpx) + 2, c = createCanvas(img.width + pad * 2, img.height + pad * 2), x = c.getContext("2d");
  for (let a = 0; a < 24; a++) { const r = a / 24 * Math.PI * 2; x.drawImage(img, pad + Math.cos(r) * wpx, pad + Math.sin(r) * wpx); }   // dilate by stamping
  x.globalCompositeOperation = "source-in"; x.fillStyle = color; x.fillRect(0, 0, c.width, c.height);
  x.globalCompositeOperation = "source-over"; x.drawImage(img, pad, pad); const r = { c, pad }; outlines.set(key, r); return r;
}
export function cutout(ctx, t, o) {
  const { img, x, y, h, t0 = 0, out = Infinity, outDur = .25, float = 10, rot = 0 } = o; if (!img || t < t0 || t > out + outDur) return;
  const s = spring(t - t0, 2.8, .5) * (1 - eIn(inv(out, out + outDur, t))); if (s <= .001) return;
  const sc = h / img.height, w = img.width * sc, bob = Math.sin((t - t0) * 2.2) * float;
  let src = img, pad = 0; if (o.outline) { const r = outlined(img, o.outline.color || "#fff", (o.outline.w ?? 12) / sc); src = r.c; pad = r.pad; }
  ctx.save(); at(ctx, x, y + bob, Math.max(0, s), rot * (1 - clamp(s)) + rot * .3 * Math.sin((t - t0) * 1.3), () => {
    const draw = () => ctx.drawImage(src, -w / 2 - pad * sc, -h - pad * sc, src.width * sc, src.height * sc);
    if (o.shadow !== false) shadow(ctx, draw, o.shadow && o.shadow !== true ? o.shadow : { blur: 50, y: 30, color: "rgba(0,0,0,.35)" }); else draw();
  }); ctx.restore();
}

// ------------------------------------------------------------------ video clips (b-roll)
// prepClip: extract frames with ffmpeg into a cache folder (skipped when already there), then decode them all
// into memory (canvas images decode asynchronously, and frame() is synchronous, so every frame is ready up front).
// Memory ≈ w × h × 4 bytes per frame: a 1080-wide 16:9 clip is ~2.6 MB/frame, 4 s at 30 fps ≈ 310 MB.
// Keep b-roll short, trim with start/dur, and use fps: 15 for slow shots (clip() indexes by the clip's own fps).
//   opts: { fps, w (px width: about the size you draw it), start (s), dur (s), dir, quality 2–5 }
export async function prepClip(file, { fps = 30, w = 1080, start = 0, dur, dir, quality = 3 } = {}) {
  const abs = path.resolve(file); if (!fs.existsSync(abs)) throw new Error(`media: missing ${abs}`);
  const st = fs.statSync(abs), id = crypto.createHash("md5").update([abs, st.size, st.mtimeMs, fps, w, start, dur].join("|")).digest("hex").slice(0, 10);
  const out = dir || path.join(process.cwd(), "out", ".clips", path.basename(file).replace(/\W+/g, "_") + "-" + id);
  if (!fs.existsSync(path.join(out, "done"))) {
    fs.mkdirSync(out, { recursive: true });
    execFileSync(ffmpegPath(), ["-v", "error", "-y", "-ss", String(start), ...(dur ? ["-t", String(dur)] : []), "-i", abs, "-vf", `fps=${fps},scale=${w}:-2`, "-q:v", String(quality), path.join(out, "f%05d.jpg")]);
    fs.writeFileSync(path.join(out, "done"), "");
  }
  const files = fs.readdirSync(out).filter((f) => f.endsWith(".jpg")).sort(); if (!files.length) throw new Error(`media: no frames extracted from ${abs}`);
  const frames = []; for (const f of files) frames.push(await loadImage(fs.readFileSync(path.join(out, f))));
  return { dir: out, fps, n: frames.length, dur: frames.length / fps, frames };
}
// clip: draw the clip's frame for time t. Same options as photo (fit, focus, zoom, grade, duotone, tint, fade, radius, from…)
//   plus { clip, t0, speed (1 = real time, .5 = slow-mo from a normal clip), loop (true) | hold on the last frame }
export function clip(ctx, t, o) {
  const C = o.clip; if (!C || t < (o.t0 ?? 0)) return;
  const ct = (t - (o.t0 ?? 0)) * (o.speed ?? 1); let k = Math.floor(ct * C.fps + 1e-6); k = o.loop === false ? Math.min(k, C.n - 1) : ((k % C.n) + C.n) % C.n;
  photo(ctx, t, { ...o, img: C.frames[k], dur: o.dur ?? C.dur });
}
