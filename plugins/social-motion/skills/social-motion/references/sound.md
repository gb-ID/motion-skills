# Sound

Most people watch with sound on Reels/TikTok, and silent motion graphics feel unfinished. The built-in music and
effects are synthesised (no samples, no licences, no copyright claims); your own voice-over, tracks and SFX
files plug into the same mix.

## The three layers

| layer | source | command |
|---|---|---|
| **voice** (VO) | your recording or a TTS/voice service export (mp3, m4a, wav…) | `sound.mjs … --voice vo.mp3 --voice-at 0.4` |
| **music** (BGM) | `beat.mjs` (synthesised, licence-free) **or** your own licensed track (mp3, m4a, wav) | `sound.mjs … --bed music.mp3` |
| **effects** (SFX) | 22 synthesised sounds **or** your own files as cues | `cues.json` from the film's `cues()` |

```bash
node sound.mjs out/cues.json out/reel.mp4 out/final.mp4 --voice vo.mp3 --voice-at 0.4 --bed track.mp3
```
- With `--voice`, the music drops to 0.35 and **ducks automatically while the voice talks** (`--voice-duck .65` =
  dips to 35 %, attack 80 ms, release 450 ms), then comes back up in the gaps. No keyframing.
- Any format ffmpeg reads works for `--voice`, `--bed` and file cues; it's converted to 48 kHz stereo internally.
- A track longer than the picture fades out over the last `--fade-out 1.2` s instead of being chopped.
- Own SFX library: add cues like `{ "file": "sfx/brand-swoosh.wav", "t": 4.1, "vol": .6 }` next to the synthesised ones.

## Voice-over workflow (picture follows the voice)

1. **Record / export the VO first**, then build the picture to it — never the other way round.
   Clean it before (noise reduction, trim silences) in CapCut / Audacity / Adobe Podcast.
2. **Word timings**, one of:
   - `python scripts/transcribe.py vo.mp3 vo.json --model small --lang id` (faster-whisper, runs locally, first run
     downloads the model), or
   - export **SRT** captions from CapCut / Premiere / Descript,
   then `node scripts/words.mjs vo.json words.json --offset 0.4` (offset = the `--voice-at` value, so word times
   are film times). Proof-read `words.json`: names, brands and slang get misheard.
3. **Lock beats to words**: `wordTime(WORDS, "gratis")` gives the time that word is spoken. Put the matching
   headline's `t0`, the counter's landing, the cut and the SFX there. Scene durations then come from the voice,
   not from bars (keep the bed quieter so off-grid cuts don't fight the beat, or cut music-free).
4. **Captions**: the template draws `captions()` from `words.json` automatically when the file exists.
5. Mix: `--voice` + `--bed` (+ cues). Loudness is normalised on the whole mix; speech stays the loudest layer.

## Music licensing

- `beat.mjs` beds are original and synthesised: safe everywhere, including ads.
- Your own track: it must be licensed for social use (and for paid ads if boosted), e.g. from a subscription
  library the client pays for. Keep the licence ID in the project.
- In-app trending sounds can't be baked into the file. Deliver a version **without** `--bed` (voice + SFX only)
  and add the sound in the app. Business accounts are usually limited to the platform's commercial library.

## The bed (`scripts/beat.mjs`)

```bash
node beat.mjs out/bed.wav --style hype --bpm 124 --dur 24 --end 21.774 --grid out/beats.json
```
- `--style hype | chill | corporate` (see `styles.md` for which preset takes which).
- Same bpm as the film (`const BPM` at the top). Scene lengths are whole bars, so cuts land on downbeats.
- `--end`: a final chord + hit that rings out — put it on the logo sting. It is rounded to the nearest beat,
  so give the exact beat time (`SEQ.start("cta") + beat(5, BPM)`).
- `--drop`: drums enter here, a riser leads in. Use it when the hook is a quiet question and the answer hits.
- `--breaks a-b`: drums out under a heavy read.

## Effects (`scripts/sound.mjs`)

Write them in the film's `cues()` from the same numbers as the picture, then `node film.mjs cues`.

| visual | sfx | vol |
|---|---|---|
| hook slam / big landing | `impact` (+ `duck: true`) | .5–.6 |
| each slammed / popped word | `tap` or `pop`, pitch .9–1.2 varied | .2–.3 |
| whip / push transition | `whip` at cut − dur/2 | .4–.5 |
| zoom transition | `whoosh` | .45 |
| circle / soft reveal | `swoosh` | .35–.45 |
| scribble, arrow, underline | `swoosh` or `swipe` | .3 |
| chart bars growing | `swipe` per bar, pitch rising | .25 |
| counter running | `tick` every ~0.08 s, pitch rising | .2 |
| number lands, correct answer | `ding` (or `cash` for money) | .3–.4 |
| caption word, typing | `click` / `type` | .3–.45 |
| button tap | `tap` | .5–.6 |
| logo sting | `impact` (duck) + `sparkle` + `chime` | .4–.5 |
| glitch transition | `glitch` | .35 |

- Cue time = visual contact − ~0.03 s. Late sound reads as broken.
- Don't sound every element: the hero of each beat, transitions, and the numbers. ~1–2 cues per second is plenty.
- Individual SFX 0.2–0.6; the mix is soft-clipped, loudness-normalised to −14 LUFS and limited under −1 dBTP.
- `duck: true` dips the bed by `--duck` (default 50 %) for 1.2 s under that cue.

## Check

`ffmpeg -i out/final.mp4 -af ebur128=peak=true -f null -` → integrated ≈ −14 (±1), peak ≤ −1 dBFS.
