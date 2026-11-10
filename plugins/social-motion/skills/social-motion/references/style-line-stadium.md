# Combined style: line stadium (visualizevalue × story.gaffer)

Saved Nov 2026. Use when the user says "gaya visualizevalue × story.gaffer", "visualizevalue + story.gaffer",
"line stadium", "gaya garis", or "pakai gaya visualizevalue" on a **narrated data story** (football or not).
For a short silent aphorism loop with no data, use pure `style-visualizevalue.md`.

**Colours and type always come from the project's kit** (`B.c.*`, `B.font`). No hex values below.

Parents: `style-story-gaffer.md` gives the **story** (VO first, headline per beat, counter, question → number →
twist → verdict, 30–40 s, calm camera). `style-visualizevalue.md` gives the **drawing** (flat dark plate,
thin lines only, tiny mono labels, draw-on and decode, lots of empty space). Take the look of both, never
their brands.

## The one rule: the story.gaffer stadium, drawn as a line sketch

Same beats, same layout, same camera moves as story.gaffer, but the illustrated world is replaced by a
**wireframe**: every object is made of `fg` strokes on an empty plate. Nothing is filled except small dots.

| from story.gaffer (keep) | from visualizevalue (keep) | dropped from both |
|---|---|---|
| headline per beat, top-left, sentence case, VO-synced | flat one-colour plate, no gradient, no grain, no vignette | story.gaffer's filled crowd, grass, flat players, light bloom |
| big mono counter + small mono label over the stage | strokes 2–3 px, round caps, no fills | visualizevalue's "no headline" rule (we have a VO) |
| one world per film, camera dolly/tilt between views | data objects as simple geometry that draws itself on | colour-as-meaning palette (only ONE accent now) |
| beat structure, follow chip, end card with sources | labels as tiny mono caps annotating the lines | decorative stamps, light washes |

## Frame anatomy (1080 × 1920)

```
y  5–7 %   brand chip: outline square (stroke, no fill) + wordmark in mono 22 px, fg 70 %
y 11–20 %  HEADLINE, left at x = 9 %, max width 78 %, 2–3 lines (story.gaffer)
y 24–30 %  counter: mono 130–160 px, centred, + mono label 22 px UPPERCASE, tracking +15 %, fg 55 %
y 34–80 %  the STAGE: a line drawing, centred, using 60–80 % of the width (bigger than pure visualizevalue,
           smaller than story.gaffer's full bleed); empty plate all around it
y 80 %+    empty (platform UI)
```

## The stage, as lines

- **Pitch**: only the markings, in perspective (low 3/4 like story.gaffer, or aerial ~78°): touchlines, box,
  centre circle, goal as a wire frame with a sparse net grid. `fg` at 35–55 %. No grass, no stripes.
- **Crowd / stadium**: optional. At most a sparse dot grid or 2–3 thin arcs for the stands at 10–20 %.
  Leave it out when the stage is busy.
- **Players**: small outline circles (r 12–18 px) with the shirt number in mono 18 px inside, or plain dots
  for crowds of events. The subject is the only thing in `accent`.
- **Data objects** (story.gaffer's ideas, drawn the visualizevalue way):
  - heatmap → dots appearing on the pitch lines as the counter rises (`fg` dots, the subject's in `accent`)
  - towers / bars → outline boxes standing on the pitch, drawn edge by edge
  - comparison → one big shape beside a tiny copy (the visualizevalue scale contrast) instead of a balance scale
  - trend → one curve drawn across the pitch (bell, decline, exponential), labels at the key points
  - share / ratio → dot waffle grid, the counted dots in `accent`
  - verdict → one symbol: an X turning into a +, or a "?" built from a line
- Every label is a mono caps annotation next to its line ("FREE KICKS 2019", "6 GOALS"), 24–28 px here
  (larger than pure visualizevalue so it reads on a phone).

## Type

- Headline: the kit's head font, sentence case, 84–92 px, `fg` (story.gaffer rules). Emphasis = colour only,
  `accent`, one word or number per headline.
- Numbers and labels: `B.font("mono", …)`, uppercase. Counters may finish with a short scramble on the last
  digits instead of a punch.

## Colour

- Plate `B.c.bg` (flat). Lines and text `B.c.fg` at 35–100 % (structure light, subject strong).
- ONE `B.c.accent` for the subject in every frame: the subject's dots, the key line, the headline emphasis.
- Bad / good contrast without new colours: bad = dashed or 35 % line, good = solid 100 % line.
  A kit's `accent2` may be used once per film for a true "bad" punch number, never next to the accent.

## Motion

- Headline: story.gaffer (`anim: "rise"`, fade out 0.2 s, damp ≥ .8).
- Stage: everything enters by **drawing on** (0.6–1.5 s, `eIO`), never by popping in. Labels decode
  (`anim: "scramble"`, 0.4–0.6 s) when their line arrives.
- Counter: `counter()` with `eOut5`, synced to the VO word (`wordTime`); dots/marks spawn with it.
- Camera: one world, slow dolly / tilt between pitch-level and aerial (story.gaffer); a cut only to a pure
  diagram beat (e.g. the trend curve alone). Default transition `fade` 0.4–0.5 s.
- Holds breathe the visualizevalue way: one shape turns slowly, one dot pulses. No shake, no bounce.
- Frame 0: the first line is already drawing; headline lands by ~0.8 s.

## Structure

Story.gaffer's: hook claim with a number → count it up → compare → twist → counter-stat → context →
verdict question → follow chip → end card (outline logo square, wordmark, tagline, mono sources line,
outline pill "FOLLOW FOR MORE" with `accent` stroke). 30–40 s, 9–12 beats.

## Sound

Story.gaffer's VO workflow (VO first, picture on its words), but quieter underneath: a low pad, no crowd
ambience, a soft tick per decoded label and per counter step, a single low "thump" on the verdict.

## Building it

Reference code: `examples/line-stadium/frame.mjs` (single-frame renderer, `BEAT=hook|trend|verdict`) —
a pinhole camera for the pitch markings, outline tokens, dot heatmap, a curve drawn with dash offset,
nested squares. Move the pieces into the project's `stage.mjs` and animate them over `t` (rule 7: seed every
dot from its index).

Checklist: flat plate, strokes only (dots excepted), one accent per frame, headline top-left inside the safe
zone, labels are mono caps beside their lines, stage centred with empty space around it, everything draws on.
