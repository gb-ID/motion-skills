# Typography that moves

## Kinetic text (`kinetic()`)

```js
const L = kinetic(ctx, lt, "Stop the *scroll*", CX, 420, {
  B, role: "display", size: 180,        // or fit: { max: 200, min: 90, maxLines: 3 } to auto-size
  maxW: 900, align: "center",
  t0: 0, anim: "rise", stagger: .07, dur: .42,
  out: 2.9, outAnim: "rise",            // every text leaves
  highlight: "marker",                  // how *emphasis* shows: marker | underline | color
});
// L.h = block height -> put the next thing at y + L.h + gap
```

Markup: `*word*` or `*several words*` = accent, `_word_` = second accent, `\n` = forced break.

| anim | by | reads as | use for |
|---|---|---|---|
| `rise` | word | confident, editorial (text slides up out of a mask) | default for headlines |
| `slam` | word | loud, impact (scale 2.6 → 1) | the hook, one per film; pair with a thump / impact |
| `pop` | word | playful (spring scale) | lists, tags, lifestyle |
| `fade` | word | calm (fade + 0.35 em rise) | body text, sub-lines, corporate |
| `slide` | word | sequence, direction | steps, timelines |
| `type` | char | typing, "a message" (with cursor) | prompts, search bars, DMs |
| `scramble` | char | tech, decoding | data, reveals, launches |

Stagger: 0.05–0.09 s per word, 0.02–0.035 s per char. The whole line should finish within ~0.8 s.

## Reading time

- A text must stay fully visible for **0.3 s per word + 0.6 s** at least (5 words ≈ 2.1 s).
- Never two texts entering at once unless they are one unit (headline + its marker).
- If the script is longer than the time allows, cut words, don't speed up the reveals.

## Rules

- **≤ 6 words per line, ≤ 3 lines per headline.** `fitSize()` finds the largest size that fits.
- **UPPERCASE condensed display** (Anton) for headlines, **sentence case** for body. Never all caps body.
- **Line height** 1.0–1.05 for display, 1.2–1.3 for body (`lineH`).
- **Contrast**: text on a busy plate gets a plate of its own (`box: { color }`) or a shadow; check
  thumbnails, where contrast problems show first.
- **Numbers** in `mono` or `display`, never in the light body weight.
- **Language**: when mixing Indonesian and English, keep one language per line; don't break a compound
  like "kopi susu" across lines (use `\n` to force the break you want).

## Counters (`counter()`)

`counter(ctx, t, { B, from: 0, to: 12500, t0, dur: 1.1, x, y, size: 220, compact: true, prefix: "", suffix: "+" })`
- Duration 0.8–1.4 s with `eOut5`: fast start, slow landing (the last digits are what people read).
- `compact` → 12.5K / 1.2M; `sep: "."` + `dec: ","` for Indonesian formatting (Rp 12.500).
- Land it on a beat, with a `ding` or `impact` cue at `t0 + dur`.

## Captions (`captions()`)

`captions(ctx, t, words, { B, x: CX, y: 1320, size: 66, max: 3 })` with `words = [{ w, s, e }]`.
- From a voice-over: take word timings from a transcription tool (whisper `--word_timestamps`) and pass them in.
- No VO: `wordsFromText(text, t0, t1)` spreads words by length.
- 2–4 words per page, active word boxed in the accent, white text with a black outline for everything else.
- Keep them between y ≈ 1150 and 1450 on 1920 (above the platform caption text, below the headline).
