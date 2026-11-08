# Reference style: "lo.jaditau" (everyday-machine illustration) — BACKGROUND / STAGE ONLY

Source: instagram.com/lo.jaditau (Indonesian "how does this everyday thing work" explainer reels), studied
Nov 2026 from 5 reels the user picked (port crane + twistlocks, fire-truck skylift, lift safety brake,
lightning on a plane, ATM note counting).

**Scope: the user saved ONLY the illustration / background look.** Do not take their text system from this
file: no headline layout, kicker style, caption pill, number blocks or chips. Text comes from whatever kit or
preset the film already uses (or the user's own brand). **Take the look, not the brand**: never draw their
name, logo or wordmark (one reel prints "kamu jaditau" on the plane's fuselage; never copy that), and invent
our own subjects and compositions rather than redrawing their scenes.

Kit: `brands/lo-jaditau/` (`BRAND=lo-jaditau`) carries the palette and plate. If the film uses another kit
for type, pull the colours from this file into the stage code instead.

## What it is in one line

One everyday machine, drawn as a clean flat-vector 3/4 (near-isometric) model, sitting large in a soft,
quiet, paper-coloured world, so the eye has exactly one thing to look at and the mechanism is readable.

## The look

- **Ground / sky**: warm off-white paper `#EEE9E1` at the top, fading down to a slightly cooler or darker
  neutral (`#D5D7D3` grey-green, `#C3BEB2` warm taupe). A long vertical gradient, no texture, no grain worth
  noticing. The top 25 % stays almost empty paper (that is where text would go).
- **Atmosphere fade**: the top of the subject dissolves into the paper (a vertical white-to-transparent
  gradient over the top 15–25 % of the stage, like haze). Background objects are lighter and lower contrast.
- **Night variant** (sky / weather topics): deep slate `#1E2636` → `#2D3649`, soft large blurred cloud
  blobs `#454F65` at 40–60 %, subject still bright `#F1F2F7`. One glow colour for energy (yellow
  `#F7D54A` halo, pale blue `#BFD3FF` spark).
- **Objects**: flat vector, **3 tones per material** (top face lightest, front mid, side darkest), thin
  1–1.5 px outlines one shade darker than the face, small rounded corners, simple bevels. No gradients
  inside a face except metal and glass (a soft 2-stop sheen). No textures, no noise.
- **Detail density**: the subject is detailed where it explains something (twistlocks, brake caliper, the
  note feeder, numbered floors), everything else is plain blocks. Repeating detail (container ribs, windows,
  keypad keys) is drawn as clean regular lines.
- **Camera**: 3/4 view from above, roughly isometric but with mild perspective; strong diagonals
  (a road, a floor plane, a container row) running across the frame. The subject fills 55–80 % of the
  frame width and often bleeds off one edge (ATM, plane wing, container stack) to feel big.
- **Shadow**: soft contact shadow only (blurred ellipse or a darker strip under the object at 15–25 %).
  No hard cast shadows.
- **Scale cues**: numbered floors, stacks of identical units, roads with dashed lines, so size reads without text.

## Palette (approx., sampled from the references)

| role | hex | used for |
|---|---|---|
| paper | `#EEE9E1` | top of frame, default background |
| paper-low | `#D5D7D3` / `#C3BEB2` | bottom of the gradient, floors, ground planes |
| steel | `#CBCFD6` / `#A5ADB6` / `#7A8189` | machine bodies (3 tones) |
| dark metal | `#2B2F37` | slots, rails, screens, cables |
| glass | `#526476` → `#3B5A8A` | windows, screens (soft sheen) |
| signal red | `#E06A55` | the one "danger / key part" colour; also red objects (notes, containers) |
| safety yellow | `#F2C84B` | moving / mechanical parts (spreader, keypad, brake), glow halos |
| safety orange | `#E2683C` | equipment (fire-truck ladder) |
| container set | `#3D70BD` blue, `#428189` teal, `#4E8A55` green, `#C9553B` rust, `#E0E0E0` white, `#2E3A55` navy | stacks of repeated objects; muted, never neon |
| road | `#35486C` asphalt with `#FFFFFF` dashed lines | ground strips at the bottom |
| night | `#1E2636` / `#2D3649` / `#454F65` | night-variant sky and clouds |

Rule: the world is neutral; **one** strong colour (red, yellow or orange) marks the part the film is about.

## Motion (stage only)

- **Slow, continuous camera**: push-in 3–6 % over a beat, or a slow drift / dolly along the diagonal. No shake,
  no punch, no glitch. Cuts between views are `fade` 0.4–0.5 s or a camera move.
- **The mechanism moves for real**: a cable lowers, twistlocks rotate 90°, a ladder telescopes section by
  section, a brake wedge clamps the rail, notes slide one by one. Ease with `eIO` / springs damp ≥ .85,
  durations 0.6–1.5 s. This movement is the "alive" part of every element (SKILL rule 3).
- **Highlight**: the key part gets a soft glow pulse (accent at 30–50 %, blur 12–24 px) or a thin outline
  flash; never an arrow sticker.
- Frame 0: the machine is already mid-action (crane lowering, lift moving).

## Building it with the library

| need | use |
|---|---|
| plate | `plate()` with this kit (`gradient` paper → paper-low); night variant: `bgGradient` with the night colours plus 4–6 large blurred `ellipse` clouds, seeded |
| atmosphere fade | after drawing the stage, `fill` a vertical linear gradient from `B.c.bg` (alpha 1) to transparent over the top of the stage |
| 3-tone objects | write a small `box3(ctx, x, y, w, h, d, tones)` iso-box helper in the project (`stage.mjs`): top / front / side faces + 1 px darker outline; build machines from boxes, cylinders (`ellipse` + rect) and `poly` |
| repeated detail | loops with seeded indices (ribs every 10–14 px, windows in a grid, keys in a grid) — rule 7 |
| glow on key part | `glow()` from `core.mjs` with `B.c.accent2` (yellow) |
| contact shadow | `ellipse` filled `rgba(0,0,0,.18)` with `ctx.filter = "blur(10px)"` |
| camera | `push()` / `camera()` from `fx.mjs`, gentle values only |

If `box3` or the iso helpers prove useful across films, move them into `lib/shapes.mjs`.

Checklist before render: one subject, one strong accent colour, top quarter of the frame calm and empty,
no text baked into the illustration (no logos, no names), mechanism visibly moving in every beat.
