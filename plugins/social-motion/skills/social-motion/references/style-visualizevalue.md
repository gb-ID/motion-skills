# Reference style: "visualizevalue" (one idea, one line)

Source: instagram.com/visualizevalue (Jack Butcher's studio), studied Nov 2026 from 5 reels: a bell curve
drawn under "all things are difficult before they are easy", a slowly turning X beside a small fixed one,
a stack of "CHANGE" lines that keep scrambling and resolving, an infinite tunnel of nested squares
("Quantum scroll"), and the newer podcast cuts.
**Take the look, not the brand.** Never copy their logo, wordmark, name or their quotes. Our own words, our
own brand chip.

**Saved without colours.** Their reels are white on black, but colours come from the project's kit:
plate = the kit's darkest colour (`B.c.bg`), lines and text = `B.c.fg`, at most one `B.c.accent` per frame.
A light kit works too (dark lines on the light plate); the rule is two values, not black and white.

## What it is in one line

One sentence turned into one tiny geometric diagram floating in an empty dark frame. Thin lines draw
themselves, a few small uppercase labels annotate the drawing, and the idea lands when the shape completes.
4–11 s, usually a seamless loop. Nothing decorative.

## Frame anatomy (1080 × 1920)

```
y  0–38 %   empty
y 38–62 %   THE DIAGRAM, centred, 30–55 % of the frame width (never full bleed)
            labels sit beside the lines they explain, like annotations on a sketch
y 62–100 %  empty
```

- Negative space is the style: 70 %+ of the frame is plate. If it looks "too empty", it is right.
- Everything is centred on the frame's centre, or on a simple grid (thirds) around it.
- No headline at the top, no logo chip, no progress bar, no frame. At most a tiny wordmark at the end.

## Lines and shapes

- Strokes only, no fills (except dots): 2–3 px at 1080 wide (their 720 px masters use ~1.5 px), round caps,
  `B.c.fg` at 85–100 %.
- Vocabulary: one curve (bell, S-curve, exponential, sine), a straight axis, a circle, a square, a cross / X,
  arrows, dot grids, nested repeats of one shape (tunnel, spiral, staircase), a tiny plus as a "spark".
- Diagrams are **literal metaphors** of the sentence: difficult → easy = a curve that rises and falls;
  "change is constant" = the same word repeating while some lines scramble; "lose → win" = an X that turns
  into a + (rotates 45°).
- Contrast of scale carries the drama: one big shape next to one tiny copy of it.

## Type

- Tiny, technical, uppercase mono / pixel face: 26–34 px at 1080 wide, tracking +12–20 %, line height 1.3,
  short stacked lines (1–3 words a line), left-aligned blocks. In our kits: `B.font("mono", px)` (Space Mono).
- Text is a **label on the diagram**, not a headline. 2–4 labels per frame, each ≤ 4 words.
- Deliberate exception to SKILL rule 5 (readable at phone size) in the pure style. When the film has a
  voice-over or must read without sound, use the combined style (`style-line-stadium.md`) instead, which
  restores a real headline.

## Motion

- **Draw-on**: lines grow from one end (dash offset), 0.8–2 s, `eIO` easing, the label for that segment
  appears when the line reaches it.
- **Scramble / decode**: labels type in through random glyphs (`kinetic(... { anim: "scramble" })`) and may
  keep scrambling a few lines while one stays fixed (the "constant" one).
- **Slow rotation / morph**: one shape turns slowly (≈ 10–20°/s) or morphs (X → +), the small copy stays still.
- **Recursion**: nested shapes zoom toward the centre forever (scale each ring by a constant ratio, wrap the
  phase so it loops).
- No springs with bounce, no shake, no flashes, no whip cuts. Mostly one shot; at most a hard `cut` to a new
  diagram. Loops: last frame equals first frame.

## Structure (typical 4–11 s)

1. Empty plate with the first stroke already moving at frame 0 (rule 2, but quietly).
2. The diagram builds while labels decode.
3. The completed shape holds and breathes (slow turn, pulse of one dot), then loops.

Caption carries the sentence (a quote or one-line idea), not the video.

## Sound

Not part of the look. Keep it minimal: no bed or a low drone pad, a soft tick per decoded label, nothing on
the beat. If the film has a VO, use the combined style.

## Building it with the library

| need | use |
|---|---|
| plate | `ctx.fillStyle = B.c.bg; ctx.fillRect(…)` — no `plate()` gradient, no grain, no vignette |
| a line that draws on | `ctx.setLineDash([len, len]); ctx.lineDashOffset = len * (1 - eIO(inv(t0, t1, t)))`, or `drawOn` from `shapes.mjs` |
| labels | `kinetic(ctx, t, "BEFORE\nTHEY ARE\nEASY", x, y, { B, role: "mono", size: 30, align: "left", anim: "scramble" })` |
| rotation / recursion | `at(ctx, cx, cy, s, rot, draw)` with `rot` a function of `t`; nested rings `s = r ** ((i + phase) % n)` |

Checklist: plate is one flat colour, the diagram is centred and small, strokes only, labels are tiny mono
caps next to their lines, one accent at most, the loop closes.
