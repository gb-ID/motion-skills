// words.mjs — word timings for captions and for timing the picture to a voice-over.
//   node words.mjs transcript.(json|srt|vtt) words.json [--offset 0.4]
// Input:
//   - Whisper JSON with word timestamps (openai-whisper `--word_timestamps True --output_format json`,
//     faster-whisper / transcribe.py, WhisperX): { segments: [{ words: [{ word, start, end }] }] }
//   - SRT or VTT subtitles (CapCut, Premiere, Descript, YouTube exports): phrase timings; words inside a
//     phrase are spread by length (good enough for captions, less exact than word timestamps)
// Output: [{ "w": "Stop", "s": 0.42, "e": 0.61 }, …]  (seconds; --offset shifts everything, e.g. the --voice-at value)
// In the film: const WORDS = JSON.parse(fs.readFileSync("words.json"));  captions(ctx, t, WORDS, {...});
//              wordTime(WORDS, "scroll") -> when that word is spoken: land the matching visual on it.
import fs from "node:fs";
const a = process.argv, [, , inp, out] = a, opt = (k, d) => a.includes(k) ? a[a.indexOf(k) + 1] : d, off = parseFloat(opt("--offset", "0"));
if (!out) { console.error("usage: node words.mjs transcript.(json|srt|vtt) words.json [--offset 0.4]"); process.exit(1); }
const txt = fs.readFileSync(inp, "utf8"), words = [];
const spread = (text, s, e) => { const ws = text.replace(/<[^>]+>/g, "").split(/\s+/).filter(Boolean), wt = ws.map((w) => 2 + w.length), T = wt.reduce((x, y) => x + y, 0) || 1; let acc = s;
  ws.forEach((w, i) => { const d = (e - s) * wt[i] / T; words.push({ w, s: acc, e: acc + d }); acc += d; }); };
if (/\.json$/i.test(inp)) {
  const J = JSON.parse(txt), segs = J.segments || J.transcription || [];
  for (const sg of segs) { if (sg.words && sg.words.length) for (const w of sg.words) { const t = String(w.word ?? w.text ?? "").trim(); if (t) words.push({ w: t, s: w.start, e: w.end }); } else if (sg.text != null) spread(sg.text, sg.start, sg.end); }
} else {
  const ts = (x) => { const m = x.trim().replace(",", ".").split(":").map(Number); return m.length === 3 ? m[0] * 3600 + m[1] * 60 + m[2] : m[0] * 60 + m[1]; };
  for (const block of txt.replace(/\r/g, "").split(/\n\s*\n/)) { const lines = block.split("\n"), i = lines.findIndex((l) => l.includes("-->")); if (i < 0) continue;
    const [s, e] = lines[i].split("-->").map((x) => ts(x.split(" ").filter(Boolean)[0] ?? x)); spread(lines.slice(i + 1).join(" "), s, e); }
}
const res = words.filter((w) => isFinite(w.s) && isFinite(w.e)).map((w) => ({ w: w.w, s: +(w.s + off).toFixed(3), e: +(w.e + off).toFixed(3) }));
fs.writeFileSync(out, JSON.stringify(res, null, 1)); console.log(`wrote ${out}: ${res.length} words, ${res.length ? res[0].s + "–" + res[res.length - 1].e + " s" : "empty"}`);
