# Motion: timing, springs, transitions, the beat

## Timing that reads (30 fps)

| thing | value |
|---|---|
| scene length | 1.5–4 s; whole bars of the music (120 bpm → 2 s per bar) |
| element entrance | 0.3–0.45 s (9–14 frames) |
| exit | 0.2–0.3 s, always faster than the entrance |
| stagger inside a group | 0.05–0.1 s (words), 0.08–0.15 s (cards, bars, list rows) |
| secondary element after the hero | ≥ 0.3 s later |
| transition | 0.3–0.5 s (whip 0.3, zoom 0.4, circle 0.5) |
| hold after the last element lands | ≥ reading time (`typography.md`) |
| camera push on a hold | +3–6 % over the scene (`push(lt, 0, dur, .04)`) |

## Easing and springs

- **Entrances: fast-out** (`eOut5`) or a **spring**. Never linear, never ease-in-out for an entrance
  (it reads as sluggish).
- **Exits: `eIn`** (accelerate away).
- **Moves between two places: `eIO5`** (whips, pushes).
- `spring(dt, freq, damp)`: freq 3–3.5 / damp .45–.55 = snappy with a visible overshoot (tags, buttons,
  pops); freq 2.4–2.8 / damp .6 = soft settle (cards, charts); damp ≥ .9 = no overshoot (corporate).
- **Snap, then hold.** The change happens fast and the eye rests. A 1 s ease on everything reads as a
  PowerPoint build.
- **Overlap**: parts of one unit arrive 2–4 frames apart (card, then its title, then its number).

## The beat

- Pick the bpm **before** timing anything; write it at the top of the film: `const BPM = 124, BAR = beat(4, BPM)`.
- Scene durations = whole bars → cuts land on downbeats. Hits (a slam, a number landing, a tap) on beats.
- `punch(lt, beats, .03–.06)` zoom pulses on beats sell the rhythm in a hold without new content.
- `beat.mjs --end T` resolves the music on the logo; `--drop T` brings the drums in on a cut (a riser leads in);
  `--breaks a-b` takes drums out under a serious or text-heavy beat.

## Transitions (`sequence.mjs`)

| kind | means | use |
|---|---|---|
| `cut` | next | fast lists, on the beat — the most professional transition |
| `whip` | "next!" with energy | default for hype / tips (0.3 s, add a `whip` cue) |
| `push` | a page / step turns | explainers, carousels |
| `slide-over` | stacking, adding | building up a list of cards |
| `zoom` | going deeper / impact | into the key beat, once per film |
| `circle` | reveal, focus | into the CTA / end card |
| `wipe` | clean change of topic | corporate |
| `shutter` | brand moment | chapter breaks in brand colours |
| `glitch` | tech, error, "wait—" | once, for a twist |
| `fade` | time passing / calm | lifestyle, soft |

Rules: **one default + at most two accents** per film. Transitions are centred on the cut: the incoming scene
is held at its frame 0 during the first half, so **frame 0 of every scene must already look finished** (plate +
a tag / numeral / first word). Every transition gets a sound (`whip`, `whoosh`, `swoosh`) starting at
`cut − dur/2`.

## Camera

`camera(ctx, W, H, { x, y, zoom, rot }, () => …)` around the content layer. Keep captions, logo bugs and
progress bars outside it. Slow push on holds, `punch` on beats, `shake(lt, [[t0, 14]])` only on impacts
(max 20 px, 0.3 s).

## Seamless loops

For a loop (a background, a looping sticker): every motion periodic in the loop length (`sin(2πt/L)`),
particles re-seeded per cycle (`seed: Math.floor(t / L)`), and compare `still 0` with `still L − 1/fps`.
