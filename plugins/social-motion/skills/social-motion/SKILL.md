---
name: social-motion
description: Make social-media motion graphics entirely in JavaScript — Reels / TikTok / Shorts explainers, promos, tip videos, stat reveals, kinetic typography, animated charts, captions, logo stings and end cards — rendered frame-exact to 9:16 MP4 with node canvas + ffmpeg, with a brand kit, beat-synced cuts and synthesised sound. Use for "bikin motion graphic", "pakai gaya story.gaffer", "animasi reels", "kinetic typography", "animate these stats", "make a reel/TikTok/short from this script", "logo sting", "explainer video", "animated infographic". Brand kits, stock photos, cut-outs and short b-roll clips are supported. Not for cutting interviews or long-form footage edits, UI micro-interactions or slide decks.
---

# social-motion

**Frame-exact motion graphics for vertical social video, written as code.** A film is a pure function
`frame(ctx, t)`. The library draws the pieces (kinetic type, counters, charts, cards, captions, CTAs,
transitions), a brand kit keeps every piece on-brand, and the harness renders, previews and checks it.
Sound is synthesised from the same timeline as the picture, and the music bed gives you a beat grid to cut on.

## Read first

| I need to… | Go to |
|---|---|
| Make a video from a brief or script | `references/workflow.md` → `templates/brief.md` → `templates/film-template.mjs` |
| **Make it look professional** (layers, hierarchy, "every element moves three times") | `references/polish.md` — read before building any scene |
| Headlines, emphasis, reading time, captions | `references/typography.md`, `lib/type.mjs` |
| Timing, springs, staggers, transitions, cutting on the beat | `references/motion.md`, `lib/sequence.mjs` |
| Formats, safe zones (platform UI), composition | `references/layout.md`, `lib/layout.mjs` |
| Pick a look (hype editorial, clean corporate, soft lifestyle, data desk) | `references/styles.md` |
| **A saved reference style** ("pakai gaya story.gaffer", any account the user names) | `references/styles.md` → *Saved reference styles* table → its `references/style-*.md` file |
| **Put a client's brand in** (colours, fonts, logo, house style), private kits | `references/brand-and-assets.md`, `scripts/new-kit.mjs`, `brands/`, `lib/brand.mjs` |
| **Stock photos, cut-outs, b-roll video** | `references/brand-and-assets.md`, `lib/media.mjs` |
| **Voice-over, own music, own SFX**, captions from a VO, music bed, loudness | `references/sound.md`, `scripts/sound.mjs` (`--voice`, `--bed`), `scripts/words.mjs`, `scripts/transcribe.py`, `scripts/beat.mjs` |
| Something broke | `references/traps.md` |
| Where the architecture came from | `references/prior-art.md` |

## The library (`lib/`)

| file | gives you |
|---|---|
| `core.mjs` | `clamp lerp inv remap ss`, easing (`eOut eOut5 eIn eIO eIO5 eBack eElastic eExpo`), **`spring(dt, freq, damp)`** (closed form, seekable), `pop`, **`life(t, t0, t1)`** (in / hold / out envelope), `stag`, `beat(n, bpm)`, colour (`rgba mix shade onColor`), canvas helpers (`at alpha rrect poly ellipse fill stroke line shadow glow`), `pathOf` |
| `film.mjs` | `run({...})` → `sheet / strip / still / verify / render / cues / contact`; `SCALE=.5` preview renders; `--safe` overlay |
| `brand.mjs` | `loadBrand(path | kit name)` → `B.c.*` colours, `B.font(role, px)`, `B.upper(role)`, `B.logo`, `B.style`, `B.color(role)`, `B.dir`; kits looked up in `./brands`, `~/.social-motion/brands`, the skill's `brands/` (`hype`, `clean`); bundled fonts Anton, Poppins, Space Mono (OFL) |
| `media.mjs` | `loadImages`, **`photo`** (cover/contain, Ken Burns, grade, duotone, tint, fade, reveal), **`cutout`** (transparent PNG + sticker outline), **`prepClip` / `clip`** (b-roll video frames) |
| `layout.mjs` | `FORMATS`, **`safe(W, H, platform)`** (+ right `rail`), `drawSafe`, `cols rows pt` |
| `type.mjs` | **`kinetic(ctx, t, text, x, y, o)`** (rise, pop, slam, fade, slide, type, scramble; `*emphasis*` markers; exits), `layoutText`, `fitSize`, **`counter`**, `formatNum`, **`captions`** (TikTok-style active word), `wordsFromText`, **`wordTime`** (when a VO word is spoken) |
| `sequence.mjs` | **`sequence(scenes, { transition })`** → scenes on a timeline with `cut fade push whip slide-over zoom wipe circle shutter glitch`; `.start(name)`, `.cuts`, `.transitions` for sound |
| `components.mjs` | `tag card list lowerThird cta logoSting progress` |
| `charts.mjs` | `bars columns donut lineChart` (values count up, one highlighted) |
| `shapes.mjs` | draw-on marks: `drawOn arrow check cross scribbleCircle underline`, `star heart sparkle playIcon pointer` |
| `fx.mjs` | **`plate(ctx, W, H, t, B, seed)`** (the kit's background), backgrounds (`bgGradient bgMesh bgDots bgGrid bgStripes`), finish (`makeGrain vignette`), `camera push punch shake flash`, `particles ring burstLines` |

**First use on a machine:** if `<skill dir>/node_modules` is missing, run `npm install` in the skill directory
(the folder this SKILL.md is in; only dependency `@napi-rs/canvas`). Needs node 20+ and ffmpeg on PATH; if
ffmpeg is missing, tell the user how to install it (`brew install ffmpeg`, `winget install ffmpeg`, `apt install ffmpeg`).

## The loop

```
brief ─▶ brief.md (hook, beats, on-screen text, sound, style bible) ─▶ film.mjs from the template
     ─▶ sheet --safe ─▶ fix ─▶ strip every transition ─▶ verify ─▶ SCALE=.5 render (watch timing)
     ─▶ render ─▶ cues ─▶ beat.mjs + sound.mjs ─▶ contact sheet of the final ─▶ still for the cover ─▶ deliver
```

## Hard rules

1. **Plan before code.** Fill `templates/brief.md`: the hook line, one row per beat with the on-screen
   text, what moves, its end state, the transition, and the sound cue. Designing inside the code makes slides.
2. **The first second is the video.** Frame 0 is already busy (something mid-motion, headline landing),
   the hook is readable by 1.0 s, and there is no logo intro. A still frame 0 reads as a photo and gets scrolled.
3. **Every element moves three times: in, alive, out.** Entrance (spring / rise), a hold that breathes
   (push-in, drift, pulse) and an exit (or a transition that takes it). Nothing pops off, nothing sits dead.
4. **Stay inside the safe zone.** Key text and faces inside `safe(W, H)`; below `rail.y` keep clear of the
   right rail. `sheet … --safe` before every render.
5. **Readable at phone size.** Headlines ≥ 110 px, body ≥ 44 px on 1080 wide; ≤ 6 words a line; each
   text holds on screen for at least 0.3 s per word + 0.6 s. One emphasis per line, in the accent.
6. **Brand from the kit, never hard-coded.** Colours via `B.c`, fonts via `B.font(role, px)`, background via
   `plate()`, motion defaults via `B.style`. Max two typefaces, ≤ 4 colours + neutrals. Switching client =
   switching kit (`BRAND=<name>`). Ask which kit to use if the user has several; if none exists, build one
   first (`brand-and-assets.md`). Photos and footage only from sources the user has rights to.
7. **Pure functions of t.** No `Math.random`, `Date`, or state carried between frames; seed from names or
   indices. `node film.mjs verify` must pass (pick frames that straddle transitions).
8. **Cut on the grid — or on the voice.** With a voice-over, the VO is recorded first and visuals land on
   its words (`wordTime`). Without one, pick a bpm first, make scene lengths whole bars (`beat(4, bpm)`), put hits on beats,
   and let the music resolve on the logo (`beat.mjs --end`). Sound cues sit ~0.03 s before the visual contact.
9. **Look at pixels, every pass.** `sheet` before `render`, `strip` around every transition and hit, and a
   `contact` sheet of the encoded final before you call it done. A render that exits 0 proves nothing.

## Quick start

```bash
SK=~/.claude/skills/social-motion          # or wherever the plugin installed the skill
mkdir my-reel && cd my-reel && cp $SK/templates/film-template.mjs film.mjs && cp $SK/templates/brand.json .
SOCIAL_MOTION_LIB=$SK/lib node film.mjs sheet 0,1,2.5,4,6 --safe      # look
SOCIAL_MOTION_LIB=$SK/lib node film.mjs render                         # out/reel.mp4
SOCIAL_MOTION_LIB=$SK/lib node film.mjs cues                           # out/cues.json
node $SK/scripts/beat.mjs out/bed.wav --style hype --bpm 120 --dur 8 --end 6
node $SK/scripts/sound.mjs out/cues.json out/reel.mp4 out/reel-final.mp4 --bed out/bed.wav
SOCIAL_MOTION_LIB=$SK/lib node film.mjs contact out/reel-final.mp4    # check the master
SOCIAL_MOTION_LIB=$SK/lib node film.mjs still 1.2 out/cover.png        # cover frame
```

Worked example: `examples/hook-reel/` in the repo — a 24 s, 9:16 tip reel (hook with slam type +
scribble, three rule scenes, caption demo, beat metronome, bar chart, CTA with tap, logo sting), cut on
124 bpm bars, 36 sound cues, a synthesised bed that resolves on the logo. `./make.sh` builds all of it.
