# The polish bible

Why this file exists: a first build usually has the right words and the right order and still looks like
a slideshow. Every gap is one of the items below. None of them is hard; each has to be asked for, scene by
scene, before the render. This file is the asking.

## Rule 1: every frame has four layers

| layer | what | how (lib) |
|---|---|---|
| **plate** | a background that is never perfectly still | `bgMesh` (drifting colour blobs), `bgGradient` (slow rotation), plus a texture: `bgDots` / `bgGrid` / `bgStripes` at 5–8 % opacity |
| **decor** | shapes that frame the content: a big faint numeral, a stripe, a blob, a ring | 6–15 % opacity or one bold accent shape; moves slower than content (parallax) |
| **content** | headline, body, chart, card, product | full contrast, inside `camera()` so a push-in moves it all together |
| **finish** | vignette + grain, always last | `vignette(ctx, W, H, .3–.4)`, `makeGrain({ amount: .04–.07 })` |

A flat background with centred text is unfinished, however good the words are.

## Rule 2: every element moves three times

| phase | what it looks like | numbers |
|---|---|---|
| **in** | rise from a mask, spring pop, slam, draw-on | 0.3–0.45 s; `eOut5` or `spring(freq 3–3.5, damp .45–.6)` |
| **alive** | the hold breathes: camera push +3–6 % over the scene, a pulse on a button, drift on decor, the numbers still settling | never 0 motion on screen for > 0.5 s |
| **out** | faster than the in: rise-out, drop, or the transition carries it away | 0.2–0.3 s; `eIn` |

## Rule 3: one hero per beat

- Decide the one thing the beat is about; it is the biggest, highest-contrast, most animated thing.
- Everything else is quieter: muted colour (`B.c.muted`), smaller, enters later (≥ 0.3 s after the hero).
- In charts, highlight exactly one bar/segment (`highlight: i`); the rest go to muted grey.
- One `*emphasis*` per line, one accent colour per beat.

## Rule 4: hierarchy by size, not by colour

| role | size at 1080 wide | font role |
|---|---|---|
| hook / headline | 150–210 px | `display` (condensed, UPPERCASE) |
| big number | 180–320 px | `display` or `mono` |
| subhead | 60–80 px | `head` |
| body / labels | 44–56 px | `body` |
| fine print, source | 28–34 px at 45–60 % opacity | `mono` |

Three sizes per scene is plenty. A size ratio of at least 2.5× between headline and body.

## Rule 5: materials

- **Emphasis marker**: a rounded block in the accent behind the word, swiped in 0.15 s after the word lands,
  text flips to `onColor(accent)`. Other options: underline draw-on, colour only.
- **Cards**: `B.c.surface`, radius from the kit, a soft shadow (blur 40–60, y 16–24, 30–40 % black). Content
  inside a card starts ≥ 0.15 s after the card lands.
- **Buttons**: pill, accent fill, a coloured glow (shadow in the button colour at 50 %), breathing scale ±2.5 %.
- **Numbers**: count up with `eOut5`, land with a punch (scale 1.1 → 1), anchored on the final width so they
  don't jitter. Format for humans: `12.5K`, `Rp 3,5 jt`, `71%`.
- **Hand marks** (scribble circle, underline, arrow) in the second accent: they say "look here" and add a
  human touch to a clean look. One per scene at most.

## Rule 6: continuity

- Same plate family across scenes (same colours, blobs parked differently) so cuts read as one film.
- Recurring anchors: a "RULE 1 / 3" counter, a step number, a progress tag — the viewer knows where they are.
- Transitions: one default family + at most two accents for the big moments (see `motion.md`).

## Before you render: the polish pass

Open a sheet at the end state of every beat and ask of each one: four layers? one hero? is anything
static for > 0.5 s? does every element have an exit? three sizes max? emphasis ≤ 1 per line? inside the safe
zone (`--safe`)? readable at thumbnail size (look at the sheet tile, not the full frame)? Fix, re-sheet, render.
