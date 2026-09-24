// film.mjs — the harness. A film is a pure function frame(ctx, t, S) -> pixels. This file renders it,
// previews it and checks it, with the same command line for every film:
//
//   node film.mjs sheet 0,1.2,3.5 [--safe]   one tile per time -> out/sheet-N.png (--safe shades platform UI)
//   node film.mjs strip 5.2 [12]             consecutive frames from 5.2 s (fast moves, transitions, hits)
//   node film.mjs still 0.8 [cover.png]      one full-size PNG (cover / thumbnail)
//   node film.mjs verify [t1,t2,…]           frames rendered in and out of order must be identical
//   node film.mjs render                     stage -> encode -> publish out/<name>.mp4 (+ .render.json)
//   node film.mjs cues                       write out/cues.json from the film's cues() (sound timeline)
//   node film.mjs contact [file.mp4]         contact sheet of an ENCODED video, 2 fps -> out/contact-N.jpg
//
//   SCALE=.5 node film.mjs render            half-resolution preview render (the film still draws in design px)
//
//   run({ name, format: "story", fps: 30, dur: 12, background: "#111", setup(S) {…}, frame(ctx, t, S) {…}, cues() {…} })
// S = { ...whatever setup returned, W, H, fps, i (frame index) }.
import { createCanvas } from "./core.mjs";
import { format as fmt, drawSafe } from "./layout.mjs";
import { spawn, execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

function parseArgs() {
  const a = process.argv.slice(2), flags = {}, pos = [];
  for (let i = 0; i < a.length; i++) { if (a[i].startsWith("--")) { const k = a[i].slice(2); flags[k] = a[i + 1] && !a[i + 1].startsWith("--") ? a[++i] : true; } else pos.push(a[i]); }
  return { mode: pos[0] || "render", a: pos[1], b: pos[2], flags };
}
// next free numbered filename, so a preview is never read back from a stale cache
function fresh(dir, stem, ext) { let n = 1; while (fs.existsSync(path.join(dir, `${stem}-${n}.${ext}`))) n++; return path.join(dir, `${stem}-${n}.${ext}`); }

export async function run(F) {
  const { mode, a, b, flags } = parseArgs();
  const [W, H] = F.format ? fmt(F.format) : [F.W, F.H], fps = F.fps || 30, N = Math.round(F.dur * fps);
  const out = path.resolve(F.out || "out"); fs.mkdirSync(out, { recursive: true });
  const SC = Number(process.env.SCALE || 1), CW = Math.round(W * SC), CH = Math.round(H * SC);
  const c = createCanvas(CW, CH), ctx = c.getContext("2d");
  const base = F.setup ? await F.setup({ W, H, fps }) : {};
  const S = { ...base, W, H, fps, i: 0, dur: F.dur };
  const draw = (t, i) => {
    ctx.save(); ctx.setTransform(SC, 0, 0, SC, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = F.background || "#111116"; ctx.fillRect(0, 0, W, H);
    S.i = i; F.frame(ctx, t, S); ctx.restore();
  };
  // optional motion blur: F.blur(t) returns a sample count (1 = off) for the frames that need it
  const acc = F.blur ? new Float32Array(CW * CH * 4) : null;
  const pixels = (i) => {
    const t = i / fps, n = F.blur ? Math.max(1, F.blur(t) | 0) : 1;
    // canvas.data() (copied) instead of getImageData: getImageData's native buffers are not reclaimed
    // fast enough and a 1080×1920 render runs out of memory after a few hundred frames
    if (n === 1) { draw(t, i); return new Uint8ClampedArray(c.data()); }
    acc.fill(0);
    for (let k = 0; k < n; k++) { draw(t + (k / n - .5) / fps * .8, i); const d = c.data(); for (let j = 0; j < d.length; j++) acc[j] += d[j]; }
    const o = new Uint8ClampedArray(acc.length); for (let j = 0; j < acc.length; j++) o[j] = acc[j] / n; return o;
  };
  const frameCanvas = (i, safe = false) => { const d = pixels(i), cc = createCanvas(CW, CH), x = cc.getContext("2d"), im = x.createImageData(CW, CH); im.data.set(d); x.putImageData(im, 0, 0);
    if (safe) { x.save(); x.scale(SC, SC); drawSafe(x, W, H, typeof safe === "string" ? safe : "all"); x.restore(); } return cc; };
  const tile = (times, idx, file, sc, cols) => {
    const rowsN = Math.ceil(times.length / cols), tw = Math.round(W * sc), th = Math.round(H * sc), gap = 8;
    const T = createCanvas(cols * tw + (cols + 1) * gap, rowsN * th + (rowsN + 1) * gap), x = T.getContext("2d");
    x.fillStyle = "#2a2a2a"; x.fillRect(0, 0, T.width, T.height);
    times.forEach((t, k) => { const cx = gap + (k % cols) * (tw + gap), cy = gap + Math.floor(k / cols) * (th + gap);
      x.drawImage(frameCanvas(idx[k], flags.safe), cx, cy, tw, th);
      x.fillStyle = "rgba(0,0,0,.7)"; x.fillRect(cx, cy, 128, 34); x.fillStyle = "#fff"; x.font = "22px sans-serif"; x.fillText(`${t.toFixed(2)}s f${idx[k]}`, cx + 8, cy + 24); });
    fs.writeFileSync(file, T.toBuffer("image/png")); console.log("wrote", file);
  };

  if (mode === "sheet") { const ts = String(a || "0").split(",").map(Number); return tile(ts, ts.map((t) => Math.round(t * fps)), fresh(out, "sheet", "png"), Number(flags.scale || (W > H ? .3 : .22)), Math.min(ts.length, W > H ? 4 : 6)); }
  if (mode === "strip") { const i0 = Math.round(Number(a) * fps), n = Number(b || 12), idx = Array.from({ length: n }, (_, k) => i0 + k); return tile(idx.map((i) => i / fps), idx, fresh(out, "strip", "png"), W > H ? .2 : .15, 6); }
  if (mode === "still") { const file = path.resolve(b || fresh(out, "still", "png")); fs.writeFileSync(file, frameCanvas(Math.round(Number(a || 0) * fps), flags.safe).toBuffer("image/png")); console.log("wrote", file); return; }
  if (mode === "cues") { if (!F.cues) { console.error("this film has no cues() — add one that returns [{ sfx, t, vol }, …]"); process.exit(1); }
    const cues = F.cues().filter((q) => q.t >= 0 && q.t < F.dur).sort((p, q) => p.t - q.t); fs.writeFileSync(path.join(out, "cues.json"), JSON.stringify(cues, null, 1)); console.log(`wrote ${path.join(out, "cues.json")} (${cues.length} cues)`); return; }
  if (mode === "contact") {
    const file = a || path.join(out, (F.name || "film") + "-final.mp4"), alt = path.join(out, (F.name || "film") + ".mp4"), src = fs.existsSync(file) ? file : alt;
    const o = fresh(out, "contact", "jpg"), cols = W > H ? 5 : 8, rowsN = Math.ceil(F.dur * 2 / cols);
    execFileSync("ffmpeg", ["-v", "error", "-y", "-i", src, "-vf", `fps=2,scale=${W > H ? 384 : 216}:-2,tile=${cols}x${rowsN}:padding=4:color=0x2a2a2a`, "-frames:v", "1", o]);
    console.log("wrote", o, "from", src); return;
  }
  if (mode === "verify") {
    const pick = a ? a.split(",").map((t) => Math.round(Number(t) * fps)) : [0, Math.floor(N / 5), Math.floor(N / 3), Math.floor(N / 2), Math.floor(N * .8), N - 1];
    const h = (i) => crypto.createHash("md5").update(pixels(i)).digest("hex");
    const fwd = pick.map(h), back = [...pick].reverse().map(h).reverse(), again = pick.map(h);
    const bad = pick.filter((_, k) => fwd[k] !== back[k] || fwd[k] !== again[k]);
    if (bad.length) { console.error("NOT deterministic at frames", bad.join(", "), "— something depends on render order (state kept between frames, Math.random, Date.now)"); process.exit(1); }
    console.log("ok: frames", pick.join(", "), "identical in and out of order"); return;
  }

  // render: stage -> encode -> publish. A failed encode never replaces a good file.
  const stage = path.join(out, ".staging"); fs.rmSync(stage, { recursive: true, force: true }); fs.mkdirSync(stage, { recursive: true });
  const name = (F.name || "film") + (SC !== 1 ? "-preview" : ""), t0 = Date.now(), file = path.join(stage, name + ".mp4");
  // CRF 17 + yuv420p + faststart: the platforms re-encode anyway, so give them a clean, high-bitrate master
  const args = ["-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgba", "-s", `${CW}x${CH}`, "-r", String(fps), "-i", "-",
    "-c:v", "libx264", "-crf", String(F.crf ?? 17), "-preset", "medium", "-pix_fmt", "yuv420p", "-profile:v", "high", "-movflags", "+faststart", file];
  const ff = spawn("ffmpeg", args, { stdio: ["pipe", "inherit", "inherit"] });
  for (let i = 0; i < N; i++) { const d = pixels(i); await new Promise((r) => ff.stdin.write(Buffer.from(d.buffer, d.byteOffset, d.byteLength)) ? r() : ff.stdin.once("drain", r));
    if (i % (fps * 5) === 0) process.stdout.write(`  ${(i / fps).toFixed(1)}s\n`); }
  ff.stdin.end(); const code = await new Promise((r) => ff.on("close", r));
  if (code !== 0) { console.error("encode failed; previous outputs left untouched"); process.exit(1); }
  fs.renameSync(file, path.join(out, name + ".mp4")); fs.rmSync(stage, { recursive: true, force: true });
  fs.writeFileSync(path.join(out, name + ".render.json"), JSON.stringify({ name, W: CW, H: CH, fps, dur: F.dur, frames: N, seconds: (Date.now() - t0) / 1000 }, null, 1));
  console.log(`rendered ${N} frames in ${((Date.now() - t0) / 1000).toFixed(1)}s -> ${path.join(out, name + ".mp4")}`);
}
