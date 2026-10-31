// sound.mjs — sound from the same timeline as the picture. Every effect is synthesised (no sample
// library, nothing to license), mixed on cue times over an optional music bed, loudness-normalised and
// muxed onto the video.
//
//   node sound.mjs cues.json picture.mp4 out.mp4 [options]      (cues.json may be "none")
//     --voice vo.mp3      voice-over (any format ffmpeg reads); --voice-at 0.4 starts it later; --voice-vol 1
//     --voice-duck .65    how far the music dips while the voice talks (automatic, follows the speech)
//     --bed music.mp3     music: a beat.mjs bed OR your own licensed track (mp3/m4a/wav); --bed-vol (.55, or .35 with a voice)
//     --bed-at 2.0        start the music later;  --fade-out 1.2  fade a longer track out at the end instead of chopping it
//     --duck .5           dip under cues marked "duck": true;  --lufs -14  delivery loudness
//
// cues.json: [{ "sfx": "whoosh", "t": 2.37, "vol": .5 }, { "sfx": "pop", "t": 2.6, "pitch": 1.2, "pan": -.3 },
//             { "file": "sfx/brand-swoosh.wav", "t": 4.1, "vol": .6 }, …]      <- your own sound files work as cues too
// sfx: pop | bubble | click | tick | type | snap | whoosh | swoosh | whip | swipe | riser | downlifter |
//      impact | thump | boom | ding | chime | sparkle | glitch | shutter | cash | tap
//   per cue (optional): vol (0.2–0.7), dur, pan (-1..1), pitch (multiplier; vary 0.9–1.2 so repeats don't sound pasted)
// Place a cue ~0.03 s BEFORE its visual contact: late reads as broken, slightly early reads as synced.
// --duck: how far the bed dips (0..1) under each cue marked "duck": true (a big hit, a logo sting).
// Adapted from claude-animation-skill's sound.mjs (MIT, © Hanif). Default loudness: -14 LUFS, the level the
// big social platforms normalise to; true peak held under -1 dBTP after AAC.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { ffmpegPath, mediaDuration } from "../lib/ffmpeg.mjs";

export const SR = 48000;
let seed = 9; const R = () => (seed = (seed * 16807) % 2147483647) / 2147483647 * 2 - 1;
const tone = (dur, f) => { const n = Math.round(dur * SR), o = new Float32Array(n); for (let i = 0; i < n; i++) o[i] = f(i / SR, i / n); return o; };
const env = (u, a = .01, r = .9) => Math.min(1, u / a) * Math.pow(1 - u, r * 4);
// noise swept through a band (fLo..fHi following shape(u)), for whooshes and risers
function sweep(dur, fLo, fHi, shape, amp = (u) => Math.sin(u * Math.PI)) {
  let lp = 0, lp2 = 0; return tone(dur, (t, u) => { const f = fLo + (fHi - fLo) * shape(u), a = Math.min(1, 2 * Math.PI * f / SR); lp += a * (R() - lp); lp2 += a * .5 * (lp - lp2); return (lp - lp2) * 3.2 * amp(u); });
}
export const SFX = {
  pop: (d = .12) => tone(d, (t, u) => Math.sin(2 * Math.PI * (1100 - 750 * u) * t) * env(u, .003, 1.3) * .8),
  bubble: (d = .16) => tone(d, (t, u) => Math.sin(2 * Math.PI * (380 + 900 * u * u) * t) * env(u, .004, 1) * .7),
  click: (d = .04) => tone(d, (t) => (Math.sin(2 * Math.PI * 3200 * t) * .5 + R() * .5) * Math.exp(-t * 200) * .9),
  tap: (d = .06) => tone(d, (t) => (Math.sin(2 * Math.PI * 1500 * t) * .7 + R() * .2) * Math.exp(-t * 120) * .8),
  tick: (d = .03) => tone(d, (t, u) => Math.sin(2 * Math.PI * 2600 * t) * (1 - u) * .6),
  type: (d = .05) => tone(d, (t) => (R() * .7 + Math.sin(2 * Math.PI * 1800 * t) * .3) * Math.exp(-t * 160) * .8),
  snap: (d = .08) => tone(d, (t) => R() * Math.exp(-t * 90) * .9 + Math.sin(2 * Math.PI * 2100 * t) * Math.exp(-t * 60) * .3),
  whoosh: (d = .45) => sweep(d, 250, 2600, (u) => Math.sin(u * Math.PI)),
  swoosh: (d = .3) => sweep(d, 600, 4200, (u) => Math.sin(u * Math.PI * .8), (u) => Math.sin(u * Math.PI) ** .6),
  whip: (d = .25) => sweep(d, 900, 6500, (u) => u, (u) => Math.min(1, u * 6) * (1 - u) ** 1.5),
  swipe: (d = .16) => sweep(d, 1500, 6000, (u) => u, (u) => Math.sin(u * Math.PI)),
  riser: (d = 1.2) => sweep(d, 180, 5200, (u) => u * u, (u) => u ** 1.6 * (u < .97 ? 1 : (1 - u) / .03)),
  downlifter: (d = 1) => sweep(d, 4500, 150, (u) => Math.sqrt(u), (u) => (1 - u) ** 1.4 * Math.min(1, u * 30)),
  thump: (d = .3) => { let ph = 0; return tone(d, (t) => { ph += 2 * Math.PI * (48 + 110 * Math.exp(-t * 32)) / SR; return Math.sin(ph) * Math.exp(-t * 11) * .95; }); },
  impact: (d = .7) => { let ph = 0; return tone(d, (t) => { ph += 2 * Math.PI * (42 + 140 * Math.exp(-t * 24)) / SR; return Math.tanh(Math.sin(ph) * 1.6) * Math.exp(-t * 5) * .8 + R() * Math.exp(-t * 28) * .5; }); },
  boom: (d = 1.4) => { let ph = 0, lp = 0; return tone(d, (t) => { ph += 2 * Math.PI * (36 + 60 * Math.exp(-t * 10)) / SR; lp += .05 * (R() - lp); return Math.sin(ph) * Math.exp(-t * 2.6) * .9 + lp * Math.exp(-t * 4) * 1.4; }); },
  ding: (d = .9) => tone(d, (t) => (Math.sin(2 * Math.PI * 1318.5 * t) + .4 * Math.sin(2 * Math.PI * 2637 * t)) * Math.exp(-t * 4.5) * Math.min(1, t / .003) * .45),
  chime: (d = 1.2) => tone(d, (t) => [1047, 1319, 1568, 2093].reduce((s, f, k) => s + (t > k * .06 ? Math.sin(2 * Math.PI * f * t) * Math.exp(-(t - k * .06) * 3.5) : 0), 0) * .2),
  sparkle: (d = .8) => tone(d, (t) => [2093, 2637, 3136, 4186, 5274].reduce((s, f, k) => s + (t > k * .06 ? Math.sin(2 * Math.PI * f * t) * Math.exp(-(t - k * .06) * 7) : 0), 0) * .16),
  glitch: (d = .3) => { let hold = 0, v = 0; return tone(d, (t, u) => { if (hold-- <= 0) { v = R(); hold = 30 + Math.floor(Math.abs(R()) * 400); } return Math.sign(v) * Math.abs(v) ** .3 * .35 * (Math.floor(t * 40) % 3 ? 1 : .2) * (1 - u); }); },
  shutter: (d = .18) => tone(d, (t) => R() * (Math.exp(-t * 90) + (t > .07 ? Math.exp(-(t - .07) * 110) : 0)) * .8),
  cash: (d = .9) => { const a = SFX.ding(d); return tone(d, (t, u) => a[Math.floor(u * (a.length - 1))] + (t > .02 ? Math.sin(2 * Math.PI * 1976 * t) * Math.exp(-(t - .02) * 6) * .3 : 0) + R() * Math.exp(-t * 60) * .3); },
};
export function readWav(file) {
  const b = fs.readFileSync(file); let o = 12, fmt, data; while (o < b.length) { const id = b.toString("ascii", o, o + 4), sz = b.readUInt32LE(o + 4); if (id === "fmt ") fmt = o + 8; if (id === "data") { data = [o + 8, sz]; break; } o += 8 + sz + (sz % 2); }
  const ch = b.readUInt16LE(fmt + 2), sr = b.readUInt32LE(fmt + 4), n = Math.floor(data[1] / (2 * ch)), m = Math.round(n * SR / sr), L = new Float32Array(m), Rr = new Float32Array(m);
  for (let i = 0; i < m; i++) { const j = Math.min(n - 1, Math.floor(i * sr / SR)); L[i] = b.readInt16LE(data[0] + j * ch * 2) / 32768; Rr[i] = ch > 1 ? b.readInt16LE(data[0] + (j * ch + 1) * 2) / 32768 : L[i]; }
  return [L, Rr];
}
export function writeWav(file, L, Rr) {
  const n = L.length, b = Buffer.alloc(44 + n * 4); b.write("RIFF", 0); b.writeUInt32LE(36 + n * 4, 4); b.write("WAVEfmt ", 8); b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(2, 22);
  b.writeUInt32LE(SR, 24); b.writeUInt32LE(SR * 4, 28); b.writeUInt16LE(4, 32); b.writeUInt16LE(16, 34); b.write("data", 36); b.writeUInt32LE(n * 4, 40);
  for (let i = 0; i < n; i++) { b.writeInt16LE(Math.round(Math.tanh(L[i]) * 32000), 44 + i * 4); b.writeInt16LE(Math.round(Math.tanh(Rr[i]) * 32000), 46 + i * 4); } fs.writeFileSync(file, b);
}
// any audio file (mp3, m4a, aac, 24-bit wav, …) -> stereo float at 48 kHz, converted with ffmpeg when needed
export function readAudio(file) {
  if (!fs.existsSync(file)) throw new Error("sound: missing " + file);
  const b = fs.readFileSync(file, { length: 64 }), isPcm16 = b.toString("ascii", 0, 4) === "RIFF" && (() => { try { const x = fs.readFileSync(file); let o = 12; while (o < x.length) { const id = x.toString("ascii", o, o + 4), sz = x.readUInt32LE(o + 4); if (id === "fmt ") return x.readUInt16LE(o + 8) === 1 && x.readUInt16LE(o + 22) === 16; o += 8 + sz + (sz % 2); } } catch {} return false; })();
  if (isPcm16) return readWav(file);
  const tmp = path.join(os.tmpdir(), `sm-${process.pid}-${path.basename(file).replace(/\W+/g, "_")}.wav`);
  execFileSync(ffmpegPath(), ["-v", "error", "-y", "-i", file, "-vn", "-ac", "2", "-ar", String(SR), "-c:a", "pcm_s16le", tmp]);
  const r = readWav(tmp); fs.unlinkSync(tmp); return r;
}
// one-pole smoothing of a 0/1 "voice is talking" signal -> a gain curve for the bed (sidechain-style ducking)
export function voiceDuck(VL, VR, n, o, amount) {
  const g = new Float32Array(n).fill(1), atkE = Math.exp(-1 / (SR * .01)), relE = Math.exp(-1 / (SR * .25)), atkG = Math.exp(-1 / (SR * .08)), relG = Math.exp(-1 / (SR * .45));
  let env = 0, gg = 1;
  for (let i = 0; i < n; i++) { const j = i - o, x = j >= 0 && j < VL.length ? Math.max(Math.abs(VL[j]), Math.abs(VR[j])) : 0;
    env = x > env ? atkE * env + (1 - atkE) * x : relE * env + (1 - relE) * x;
    const target = env > .02 ? 1 - amount : 1; gg = target < gg ? atkG * gg + (1 - atkG) * target : relG * gg + (1 - relG) * target; g[i] = gg; }
  return g;
}
// mix(cues, dur, bed, opts): bed (music), voice (VO), SFX cues, custom sample cues ({ file }) -> [L, R]
//   opts: bedVol, bedAt, duck (bed dip under cues marked duck), voice, voiceAt, voiceVol, voiceDuck (bed dip under speech), fadeOut
export function mix(cues, dur, bed, { bedVol = .55, bedAt = 0, duck = .5, voice, voiceAt = 0, voiceVol = 1, voiceDuck: vd = .65, fadeOut = 1.2 } = {}) {
  const n = Math.round(dur * SR), L = new Float32Array(n), Rr = new Float32Array(n);
  let V = null; if (voice) V = readAudio(voice);
  if (bed) { const [BL, BR] = readAudio(bed), o = Math.round(bedAt * SR), g = V ? voiceDuck(V[0], V[1], n, Math.round(voiceAt * SR), vd) : new Float32Array(n).fill(1);
    for (const c of cues) if (c.duck) { const i0 = Math.round((c.t - .05) * SR); for (let i = 0; i < SR * 1.2 && i0 + i < n; i++) if (i0 + i >= 0) { const u = i / (SR * 1.2); g[i0 + i] = Math.min(g[i0 + i], 1 - duck * (u < .05 ? u / .05 : 1 - (u - .05) / .95)); } }
    // a bed longer than the picture fades out over the last `fadeOut` seconds instead of being chopped
    const fo = BL.length - Math.max(0, -o) > n - Math.max(0, o) ? Math.round(fadeOut * SR) : 0;
    for (let i = 0; i + o < n && i < BL.length; i++) if (i + o >= 0) { const k = fo && i + o > n - fo ? (n - (i + o)) / fo : 1; L[i + o] += BL[i] * bedVol * g[i + o] * k; Rr[i + o] += BR[i] * bedVol * g[i + o] * k; } }
  if (V) { const o = Math.round(voiceAt * SR); for (let i = 0; i < V[0].length && i + o < n; i++) if (i + o >= 0) { L[i + o] += V[0][i] * voiceVol; Rr[i + o] += V[1][i] * voiceVol; } }
  const files = new Map();
  for (const c of cues) {
    let s, v = c.vol ?? .5, pan = c.pan ?? 0, i0 = Math.round(c.t * SR);
    if (c.file) { if (!files.has(c.file)) { const [a, b] = readAudio(c.file), m = new Float32Array(a.length); for (let i = 0; i < a.length; i++) m[i] = (a[i] + b[i]) / 2; files.set(c.file, m); } s = files.get(c.file); if (c.dur) s = s.subarray(0, Math.round(c.dur * SR)); }
    else { if (!SFX[c.sfx]) console.warn("unknown sfx", c.sfx, "- using pop"); seed = 9 + Math.round(c.t * 1000); s = (SFX[c.sfx] || SFX.pop)(c.dur); }
    if (c.pitch && c.pitch !== 1) { const q = new Float32Array(Math.floor(s.length / c.pitch)); for (let i = 0; i < q.length; i++) q[i] = s[Math.floor(i * c.pitch)]; s = q; }
    const gl = v * Math.min(1, 1 - pan), gr = v * Math.min(1, 1 + pan);
    for (let i = 0; i < s.length && i0 + i < n; i++) if (i0 + i >= 0) { L[i0 + i] += s[i] * gl; Rr[i0 + i] += s[i] * gr; } }
  return [L, Rr];
}
if (process.argv[1] && process.argv[1].endsWith("sound.mjs")) {
  const a = process.argv, [, , cueFile, pic, out] = a, opt = (k, d) => a.includes(k) ? a[a.indexOf(k) + 1] : d;
  if (!out) { console.error("usage: node sound.mjs cues.json picture.mp4 out.mp4 [--voice vo.mp3 --voice-at 0 --bed music.mp3 --bed-vol .55 --lufs -14]"); process.exit(1); }
  const dur = mediaDuration(pic);
  const cues = cueFile === "none" ? [] : JSON.parse(fs.readFileSync(cueFile, "utf8")), voice = opt("--voice");
  // with a voice-over the music sits lower by default: speech is the hero
  const [L, Rr] = mix(cues, dur, opt("--bed"), { bedVol: parseFloat(opt("--bed-vol", voice ? ".35" : ".55")), bedAt: parseFloat(opt("--bed-at", "0")), duck: parseFloat(opt("--duck", ".5")),
    voice, voiceAt: parseFloat(opt("--voice-at", "0")), voiceVol: parseFloat(opt("--voice-vol", "1")), voiceDuck: parseFloat(opt("--voice-duck", ".65")), fadeOut: parseFloat(opt("--fade-out", "1.2")) });
  const tmp = out.replace(/\.mp4$/, "") + ".mix.wav"; writeWav(tmp, L, Rr);
  // the limiter after loudnorm shaves ~1 LU off dense mixes, so aim loudnorm 1 LU hotter than the delivery target
  const target = parseFloat(opt("--lufs", "-14")), I = String(target + 1);
  // two-pass loudnorm in node (no shell variables for zsh to mangle), then a 4x-oversampled limiter:
  // AAC adds ~1.5 dB of inter-sample overshoot, so limit at -3 dBFS to land under -1 dBTP after encode
  let m = {}; try { const r = execFileSync(ffmpegPath(), ["-hide_banner", "-nostats", "-i", tmp, "-af", `loudnorm=I=${I}:TP=-1.5:print_format=json`, "-f", "null", "-"], { stdio: ["ignore", "pipe", "pipe"] }); m = JSON.parse((r.toString().match(/\{[^{]*input_i[\s\S]*?\}/) || ["{}"])[0]); }
  catch (e) { const s = String(e.stderr || ""); m = JSON.parse((s.match(/\{[^{]*input_i[\s\S]*?\}/) || ["{}"])[0]); }
  if (!m.input_i) { try { m = JSON.parse((execFileSync("sh", ["-c", `"${ffmpegPath()}" -hide_banner -nostats -i "${tmp}" -af loudnorm=I=${I}:TP=-1.5:print_format=json -f null - 2>&1`]).toString().match(/\{[^{]*input_i[\s\S]*?\}/) || ["{}"])[0]); } catch { m = {}; } }
  const lim = "aresample=192000,alimiter=limit=0.7:level=false:attack=1:release=40,aresample=48000";
  const ln = m.input_i ? `loudnorm=I=${I}:TP=-1.5:LRA=11:measured_I=${m.input_i}:measured_TP=${m.input_tp}:measured_LRA=${m.input_lra}:measured_thresh=${m.input_thresh}:linear=true,${lim}` : `loudnorm=I=${I}:TP=-1.5,${lim}`;
  execFileSync(ffmpegPath(), ["-v", "error", "-y", "-i", pic, "-i", tmp, "-map", "0:v", "-map", "1:a", "-af", ln, "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-shortest", "-movflags", "+faststart", out]);
  fs.unlinkSync(tmp);
  console.log("wrote", out, m.input_i ? `(mix measured ${m.input_i} LUFS, target ${target})` : "");
}
