# Style presets

Pick one per film and write its recipe into the style bible. Mixing presets inside a film reads as a mistake.

## 1. Hype editorial (the example reel)

Loud, confident, fast. Tips, launches, sports, youth brands.
- Plate: near-black `#111116` + `bgMesh` with the accent and one cool colour at 35–45 %, `bgDots` 7 %.
- Type: condensed display UPPERCASE (Anton) 150–210 px; body Poppins 600. Emphasis = marker blocks.
- Accent `#FF5A36`, second accent `#FFD23F` for hand marks, third `#3DDC97` for "good/yes".
- Motion: `slam` for the hook, `rise` for headlines, springs freq 3.2 damp .5; cuts on every bar; `whip`
  default, one `zoom`, `circle` into the CTA; `punch` on beats in holds.
- Sound: `beat.mjs --style hype` 120–128 bpm; impact on the hook, whips on cuts, clicks/taps on words.
- Finish: vignette .35, grain .05.

## 2. Clean corporate

Trustworthy, calm, precise. B2B, finance, healthcare, reports.
- Plate: white or `#F5F6FA` + `bgGrid` 4 %, one large soft blob in the brand colour at 12 %.
- Type: Poppins 800/600 sentence case (no condensed display), 110–150 px headlines. Emphasis = colour or underline.
- One brand colour + navy text + one highlight. Cards with soft shadows, radius 24–32.
- Motion: `fade` / `rise`, springs damp ≥ .8 (no bounce), `push` or `wipe` transitions, no shake, no glitch.
- Sound: `beat.mjs --style corporate` 100–115 bpm; soft pops and swipes at 0.25–0.35 vol, ding on numbers.
- Finish: no vignette (or .12), grain .02.

## 3. Soft lifestyle

Warm, friendly, human. F&B, beauty, travel, community.
- Plate: `bgMesh` in 2–3 pastels on cream `#FFF6EC`, no texture or `bgDots` 4 %.
- Type: rounded or geometric sans (Poppins 700), sentence case, 110–160 px. Emphasis = `_second accent_` colour + hand underline.
- Motion: `pop` and `fade`, springs freq 2.6 damp .5, `fade` / `slide-over` transitions, gentle `particles` (dots).
- Sound: `beat.mjs --style chill` 85–95 bpm; bubbles, soft pops, chime on the end card.
- Finish: grain .04, warm vignette (`vignette(…, .2, "#6B3B1E")`).

## 4. Data desk

Numbers are the story. Weekly stats, match stats, market recaps, survey results.
- Plate: dark navy `#0D1321` + `bgGrid` 6 %; charts on `surface` cards.
- Type: `mono` for every number and label (Space Mono), display for the headline number, body for context.
- One highlighted series in the accent; everything else muted grey. Source line in `mono` 30 px at 50 %.
- Motion: bars / columns stagger 0.1 s, counters `eOut5` 1.1 s, line charts draw on 1.2–1.6 s, `cut` on bars.
- Sound: ticks under counters (one per ~0.08 s, pitch rising), ding on the highlight, soft corporate or hype bed.

## 5. Stadium data story (reference: story.gaffer)

Calm, narrated football data stories inside an illustrated night stadium. Kit `stadium-night`.
Full recipe (layout, colour-as-meaning, stage objects, beat structure, sound): `references/style-story-gaffer.md`.
- Plate: near-black `#07090E` → `#151B26`, no texture; the stage (crowd + pitch) fills the bottom 60 %.
- Type: bold grotesk sentence case 84–96 px top-left; numbers and labels in Space Mono; emphasis = colour only.
- Gold = subject, red = bad, green = good. Motion: fade / rise, damp ≥ .8, camera moves instead of cuts.
- Sound: VO first, crowd ambience bed, ticks under counters.

## 6. Everyday-machine illustration (reference: lo.jaditau) — background / stage only

Clean flat-vector 3/4 machines in a soft, quiet, light world. Saved for the **illustration only**, with
**no colours**: colours and type come from whatever brand / project kit the film uses.
Full recipe (colour roles, 3-tone objects, atmosphere fade, night variant, motion): `references/style-lo-jaditau.md`.
- Plate: the kit's light `bg` → a slightly darker version of it, no texture, no grain; top quarter left calm.
- One subject, 3 tones per material, thin darker outlines, soft contact shadows, one strong colour (the kit's accent) on the key part.
- Motion: slow push-ins and drifts, the mechanism itself moves, damp ≥ .85, `fade` between views.

## Saved reference styles

When the user names an account or says "pakai gaya X", look here first and read the linked file.

| user says | read | kit |
|---|---|---|
| story.gaffer, storygaffer, "gaya story gaffer", stadium data story | `references/style-story-gaffer.md` | `stadium-night` |
| lo.jaditau, lojaditau, "gaya lo jaditau", "gaya jaditau" (background / illustration only) | `references/style-lo-jaditau.md` | none: use the project's kit |

To add one: study the reference, write `references/style-<name>.md` (same sections as the story.gaffer file),
make a kit in `brands/<name>/`, add a preset above and a row in this table.

## Matching a client reference

Make a swatch frame before the film: plate, three type sizes, a card, a button, a chart bar, each emphasis
style, side by side with a screenshot of their reference. Adjust `brand.json` and the numbers above until a
crop of yours could sit in their feed. Then write it down here as a new preset.
