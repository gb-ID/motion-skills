// beat.mjs — an original, synthesised music bed of any length, plus the beat grid to cut the picture to.
//
//   node beat.mjs bed.wav --style hype --bpm 124 --dur 15 [--key A --drop 1.94 --end 14.2 --breaks 6-7.9 --grid beats.json]
//
//   --style   hype (four-on-the-floor, sub bass, pads; energetic promos)
//             chill (lo-fi: swung hats, soft kick, Karplus pluck arpeggio, warm pad)
//             corporate (bright plucks on 16ths, light kick/clap, clean pad; explainers, B2B)
//   --bpm     tempo. Cut and pop on beats: at 120 bpm a beat is 0.5 s, a bar 2 s.
//   --key     root note (C, C#, D … B). Hype/chill are minor (i–VI–III–VII), corporate major (I–V–vi–IV).
//   --drop    seconds before the drums come in (a riser leads into it). Put it on a cut. Rounded to a beat.
//   --end     where the music resolves: a final chord + hit, then it rings out. Put it on the logo / end card.
//   --breaks  drums out between a-b (comma list), e.g. under a serious beat or a big read.
//   --grid    write { bpm, beat, bar, beats[], bars[], drop, end } so the film can cut on the grid.
// Everything is synthesised here: no samples, nothing to license.
import fs from "node:fs";
import { writeWav } from "./sound.mjs";

const SR = 48000, a = process.argv, opt = (k, d) => a.includes(k) ? a[a.indexOf(k) + 1] : d;
const out = a[2]; if (!out || out.startsWith("--")) { console.error("usage: node beat.mjs bed.wav --style hype --bpm 124 --dur 15 [--key A --drop 0 --end 14 --breaks a-b --grid beats.json]"); process.exit(1); }
const style = opt("--style", "hype"), bpm = +opt("--bpm", style === "chill" ? 88 : style === "corporate" ? 112 : 124), dur = +opt("--dur", 15);
const KEYS = { C: 0, "C#": 1, Db: 1, D: 2, "D#": 3, Eb: 3, E: 4, F: 5, "F#": 6, Gb: 6, G: 7, "G#": 8, Ab: 8, A: 9, "A#": 10, Bb: 10, B: 11 };
const root = 48 + (KEYS[opt("--key", "A")] ?? 9) - (KEYS[opt("--key", "A")] > 6 ? 12 : 0);     // around C3..F#3
const beatS = 60 / bpm, step = beatS / 4, bar = beatS * 4;
const snap = (x) => Math.round(x / beatS) * beatS;
const drop = snap(+opt("--drop", 0)), end = opt("--end") != null ? snap(+opt("--end")) : null;
const breaks = (opt("--breaks", "") || "").split(",").filter(Boolean).map((s) => s.split("-").map(Number));
const drumsOn = (t) => t >= drop - 1e-6 && (end == null || t < end - 1e-6) && !breaks.some(([x, y]) => t >= x && t < y);
const mOn = (t) => end == null || t < end - 1e-6;

const N = Math.round(dur * SR), L = new Float32Array(N), Rr = new Float32Array(N);
let s = 7; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647 * 2 - 1;
const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);
function add(t0, sig, n, gain = 1, pan = 0) { const i0 = Math.round(t0 * SR), gl = gain * Math.min(1, 1 - pan), gr = gain * Math.min(1, 1 + pan);
  for (let i = 0; i < n && i0 + i < N; i++) { if (i0 + i < 0) continue; const v = sig(i / SR, i); if (Array.isArray(v)) { L[i0 + i] += v[0] * gl; Rr[i0 + i] += v[1] * gr; } else { L[i0 + i] += v * gl; Rr[i0 + i] += v * gr; } } }

// ---------------------------------------------------------------- instruments
const kick = (t0, g = 1) => { let ph = 0; add(t0, (t) => { ph += 2 * Math.PI * (44 + 120 * Math.exp(-t * 38)) / SR; return Math.tanh(Math.sin(ph) * 1.5) * Math.exp(-t * 7.5) + (t < .004 ? rnd() * .3 : 0); }, SR * .45, .9 * g); };
const clap = (t0, g = 1) => { let lp = 0, hp = 0; add(t0, (t) => { lp += .45 * (rnd() - lp); hp = rnd() - lp; const e = t < .03 ? (Math.floor(t / .01) % 2 ? .6 : 1) * Math.exp(-(t % .01) * 200) : Math.exp(-(t - .03) * 18); return hp * e; }, SR * .3, .45 * g); };
const snare = (t0, g = 1) => add(t0, (t) => rnd() * Math.exp(-t * 22) * .8 + Math.sin(2 * Math.PI * 185 * t) * Math.exp(-t * 30) * .5, SR * .25, .5 * g);
const hat = (t0, open = false, g = 1, pan = .15) => { let lp = 0; add(t0, (t) => { const w = rnd(); lp += .6 * (w - lp); return (w - lp) * Math.exp(-t * (open ? 11 : 70)); }, SR * (open ? .35 : .06), .22 * g, pan); };
const shaker = (t0, g = 1) => { let lp = 0; add(t0, (t) => { const w = rnd(); lp += .5 * (w - lp); return (w - lp) * Math.min(1, t / .012) * Math.exp(-t * 45); }, SR * .08, .12 * g, -.2); };
const sub = (t0, m, len, g = 1) => { let ph = 0; add(t0, (t) => { ph += 2 * Math.PI * hz(m) / SR; const e = Math.min(1, t / .006) * Math.min(1, (len - t) / .03); return Math.tanh(Math.sin(ph) * 1.8) * e * .55; }, Math.max(0, Math.round(len * SR)), g); };
// Karplus–Strong pluck: a noise burst in a feedback delay line — a string, in ten lines
const pluck = (t0, m, g = 1, pan = 0, bright = .5) => { const P = Math.max(2, Math.round(SR / hz(m))), buf = new Float32Array(P); for (let i = 0; i < P; i++) buf[i] = rnd(); let k = 0, prev = 0;
  add(t0, () => { const v = buf[k], nx = buf[(k + 1) % P]; const y = .996 * (bright * v + (1 - bright) * (v + nx) / 2); prev = y; buf[k] = y; k = (k + 1) % P; return v; }, SR * 1.2, .32 * g, pan); };
// pad: three detuned saws per note, slow attack, one-pole low-pass, stereo spread
const pad = (t0, notes, len, g = 1, cut = 1400) => { const ph = notes.map(() => [0, .33, .66]); let lpL = 0, lpR = 0, l2 = 0, r2 = 0; const a = Math.min(1, 2 * Math.PI * cut / SR);
  add(t0, (t) => { let l = 0, r = 0; notes.forEach((m, j) => [-.08, 0, .08].forEach((dt, q) => { ph[j][q] = (ph[j][q] + hz(m + dt) / SR) % 1; const v = 2 * ph[j][q] - 1; l += v * (q !== 2 ? 1 : .4); r += v * (q !== 0 ? 1 : .4); }));
    const e = Math.min(1, t / .25) * Math.min(1, Math.max(0, len - t) / .35); lpL += a * (l - lpL); lpR += a * (r - lpR); l2 += a * (lpL - l2); r2 += a * (lpR - r2); return [l2 * e * .08, r2 * e * .08]; }, Math.round((len + .01) * SR), g); };
const riser = (t0, len) => { let lp = 0; add(t0, (t) => { const u = t / len, f = 200 + 5000 * u * u, a2 = Math.min(1, 2 * Math.PI * f / SR); lp += a2 * (rnd() - lp); return lp * u * u * .9; }, Math.round(len * SR), .5); };
const crash = (t0) => { let lp = 0; add(t0, (t) => { const w = rnd(); lp += .7 * (w - lp); return (w - lp) * Math.exp(-t * 2.2); }, SR * 2.5, .25); };

// ---------------------------------------------------------------- harmony
const MINOR = [[0, 3, 7], [-4, 0, 3], [3, 7, 10], [-2, 2, 5]], MAJOR = [[0, 4, 7], [-5, -1, 2], [-3, 0, 4], [-7, -3, 0]];
const prog = style === "corporate" ? MAJOR : MINOR, bassOf = (c) => c[0] < -2 ? c[0] : c[0] === 3 ? 3 : c[0];

// ---------------------------------------------------------------- arrangement
const nBars = Math.ceil(dur / bar) + 1;
for (let b = 0; b < nBars; b++) {
  const tb = b * bar, ch = prog[b % prog.length].map((x) => x + root + 12);
  if (!mOn(tb)) break;
  const padLen = Math.min(bar, (end ?? dur) - tb);
  if (padLen > 0) pad(tb, ch, padLen, style === "chill" ? .9 : 1, style === "chill" ? 900 : style === "corporate" ? 2200 : 1500);
  for (let k = 0; k < 16; k++) {
    const t = tb + k * step, swing = style === "chill" && k % 2 ? step * .18 : 0, tt = t + swing; if (tt >= dur) break;
    const D = drumsOn(t), M = mOn(t), bassM = root + bassOf(prog[b % prog.length]) - 12;
    if (style === "hype") {
      if (D && k % 4 === 0) kick(t);
      if (D && (k === 4 || k === 12)) clap(t);
      if (D && k % 2 === 0) hat(t, k % 4 === 2, k % 4 === 2 ? .8 : .6);
      if (D && b % 4 === 3 && k >= 13) hat(t, false, .5);
      if (M && k % 2 === 0) sub(t, bassM + (k % 8 === 6 ? 12 : 0), step * 1.8, D ? 1 : .5);
    } else if (style === "chill") {
      if (D && (k === 0 || k === 7 || k === 10)) kick(t, .7);
      if (D && (k === 4 || k === 12)) snare(t, .7);
      if (D && k % 2 === 0) hat(tt, false, .55);
      if (M && k % 2 === 0) { const tones = [...ch, ch[0] + 12, ch[1] + 12]; pluck(tt, tones[(k / 2 + b) % tones.length] + 12, .8, (k % 4 ? .25 : -.25), .35); }
      if (M && k === 0) sub(t, bassM, bar * .9, .7);
    } else {
      if (D && (k === 0 || k === 8 || k === 10)) kick(t, .75);
      if (D && (k === 4 || k === 12)) clap(t, .7);
      if (D) shaker(t, k % 2 ? 1 : .6);
      if (M) { const tones = [...ch, ch[0] + 12, ch[2] + 12]; pluck(t, tones[(k + b * 2) % tones.length] + 12, k % 4 === 0 ? 1 : .7, (k % 2 ? .3 : -.3), .55); }
      if (M && k % 4 === 2) sub(t, bassM, step * 1.6, .8);
    }
  }
}
if (drop > 0.4) riser(Math.max(0, drop - Math.min(2, drop)), Math.min(2, drop));
if (drop > 0) crash(drop);
if (end != null && end < dur) { const ch = prog[0].map((x) => x + root + 12); kick(end); crash(end); pad(end, [...ch, ch[0] + 12], Math.min(3, dur - end), 1.2, 1800); sub(end, root - 12, Math.min(1.6, dur - end), 1);
  if (style !== "hype") ch.forEach((m, j) => pluck(end + j * .04, m + 12, 1, j - 1, .6)); }

// sidechain-ish pump: dip everything slightly after each kick in hype
if (style === "hype") for (let i = 0; i < N; i++) { const t = i / SR; if (!drumsOn(t)) continue; const ph = (t - drop) % beatS, g = 1 - .35 * Math.exp(-ph * 14); L[i] *= g; Rr[i] *= g; }
// fade the very end so a cut-off never clicks
const fo = Math.round(SR * .08); for (let i = 0; i < fo; i++) { const g = i / fo; L[N - 1 - i] *= g; Rr[N - 1 - i] *= g; }
let pk = 0; for (let i = 0; i < N; i++) pk = Math.max(pk, Math.abs(L[i]), Math.abs(Rr[i])); const norm = .8 / (pk || 1);
for (let i = 0; i < N; i++) { L[i] *= norm; Rr[i] *= norm; }
writeWav(out, L, Rr);
const grid = { bpm, beat: beatS, bar, drop, end, beats: Array.from({ length: Math.floor(dur / beatS) + 1 }, (_, i) => +(i * beatS).toFixed(4)), bars: Array.from({ length: Math.floor(dur / bar) + 1 }, (_, i) => +(i * bar).toFixed(4)) };
if (opt("--grid")) fs.writeFileSync(opt("--grid"), JSON.stringify(grid, null, 1));
console.log(`wrote ${out}: ${style}, ${bpm} bpm, ${dur}s, beat ${beatS.toFixed(3)}s, bar ${bar.toFixed(3)}s${drop ? `, drop ${drop.toFixed(2)}s` : ""}${end != null ? `, end ${end.toFixed(2)}s` : ""}`);
