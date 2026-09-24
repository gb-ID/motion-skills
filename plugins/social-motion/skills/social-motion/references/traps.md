# Traps (each one cost a render or a pass)

| # | Trap | Fix |
|---|---|---|
| 1 | **`getImageData` per frame ran out of memory** at ~450 frames of 1080×1920: its native buffers aren't reclaimed fast enough. | The harness reads `canvas.data()` (copied). Don't reintroduce `getImageData` in a render loop. |
| 2 | **A transition revealed an empty plate**: the incoming scene is held at its frame 0 during the first half of the transition, and everything in it started at `t0: 0`. | Frame 0 of every scene shows something: a tag / numeral at `t0: -.3`, or the headline at `t0: -.1`. Strip every transition. |
| 3 | **Five caption words overflowed the frame** (one page wider than 1080). | `captions` scales a page down to `maxW`; still keep pages to 2–4 words. |
| 4 | **Caption pages broke after every word**: a full stop ends a page. | No punctuation inside a caption phrase you want on one page. |
| 5 | **A counter reached its final value before the thing it counted** (eased count vs. stepped words). | For discrete things, compute the integer from time (`Math.floor((lt - t0) / step)`) instead of `counter`. |
| 6 | **The logo shine lit the background** (a light bar clipped to the logo's box, not its pixels). | `logoSting` draws the mark into its own canvas and applies the shine `source-atop`. |
| 7 | **The music resolved 0.2 s after the logo**: `--end` snaps to the nearest beat. | Put the logo on a beat (`beat(n, BPM)`) and pass that exact time to `--end`. |
| 8 | **Integrated loudness came out ~1.2 LU under the target**: the limiter after loudnorm shaves dense mixes. | `sound.mjs` aims loudnorm 1 LU hot; the example lands at −14.4 LUFS, peak −2.4 dBFS. Check with `ebur128`. |
| 9 | **A font silently fell back to a system face** (file name typo in `brand.json`). | `loadBrand` warns; check the terminal and a sheet with every role on it before building. |
| 10 | **State carried between frames** (a cached "last position", a counter incremented per frame) breaks seeking and `verify`. | Recompute everything from `t`. `verify` with times that straddle every cut. |
| 11 | **A preview image read back from cache** looked like a fix had failed. | Sheets/strips/contacts write numbered files (`sheet-3.png`); read the newest one. |
| 12 | **Frame 0 empty** because everything pops in → the platform picks a blank first frame / people scroll. | Open mid-action (rule 2 in SKILL.md). |
| 13 | **Text under the like/comment rail** below mid-frame. | `--safe` on every sheet; below `rail.y`, centre content at x ≈ 500 with `maxW` ≤ 760. |
| 14 | **zsh eats `$var:l`** in shell one-liners (`measured_thresh=$e:linear`). | `sound.mjs` does the loudnorm in node; brace every variable (`${e}`) in your own scripts. |
| 15 | **ffmpeg without `drawtext`** (common in homebrew builds). | Draw all text in canvas; the harness never needs drawtext. |
| 16 | **Multiply / overlay composite leaking** onto the rest of the frame. | Wrap composite changes in `ctx.save()/restore()`; blend modes stay inside the helper that sets them. |
| 17 | **B-roll frames drew blank**: `new Image(); img.src = buffer` reports a width immediately but decodes asynchronously, and `frame()` is synchronous. | Load every image with `await loadImage` / `loadImages` / `await prepClip` before `run()`. A blank area where a photo should be means it wasn't awaited. |
| 18 | **Brand font weights all looked the same** with a variable font file. | Use static files per weight (`Inter-SemiBold.ttf`, `Inter-Black.ttf`) sharing one `family`. |
| 19 | **An mp3 bed was read as noise** (the first reader only understood 16-bit WAV). | `sound.mjs` converts any non-16-bit-WAV input with ffmpeg first (`readAudio`). |
| 20 | **Captions drifted by the VO's start offset.** | Pass the same number to `words.mjs --offset` and `sound.mjs --voice-at`. |
