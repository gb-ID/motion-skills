# Reference style: "lo.jaditau" (everyday-machine illustration) — BACKGROUND / STAGE ONLY

Source: instagram.com/lo.jaditau (Indonesian "how does this everyday thing work" explainer reels), studied
Nov 2026 from 5 reels the user picked (port crane + twistlocks, fire-truck skylift, lift safety brake,
lightning on a plane, ATM note counting).

**Routing (set by the user, Nov 2026): "pakai gaya lo.jaditau" is the only instruction he will give.**
- If the film is about football (a match, a player, tactics, GoonerBurger) → build it with
  `references/style-stadium-hybrid.md` (one night stadium, three cameras: perspective ~75 % story.gaffer,
  aerial, object close-ups drawn the lo.jaditau way). Do not ask; that is what "gaya lo.jaditau" means there.
- Anything else (a client product, a how-it-works explainer, non-football) → this file alone.

**Scope: the user saved ONLY the illustration / background look.** Do not take their text system from this
file: no headline layout, kicker style, caption pill, number blocks or chips. Text comes from whatever kit or
preset the film already uses (or the user's own brand). **Take the look, not the brand**: never draw their
name, logo or wordmark (one reel prints "kamu jaditau" on the plane's fuselage; never copy that), and invent
our own subjects and compositions rather than redrawing their scenes.

**No colours are saved for this style.** Colours always come from the brand / project kit in use
(`B.c.*`). This file only describes *how* colour is used (roles, tones, contrast), never which hex.
There is no dedicated kit: use the project's kit and apply the recipe below to it.

## What it is in one line

One everyday machine, drawn as a clean flat-vector 3/4 (near-isometric) model, sitting large in a soft,
quiet, light world, so the eye has exactly one thing to look at and the mechanism is readable.

## The look

- **Ground / sky**: a light, soft background (the kit's `bg`, or a very light tint of it) at the top, fading
  down to a slightly darker version of the same colour (`shade(bg, -8…-15 %)` or the kit's `surface`).
  A long vertical gradient, no texture, no grain worth noticing. The top 25 % stays almost empty (that is
  where text would go). With a dark brand, flip it: dark `bg` top, a touch lighter at the bottom.
- **Atmosphere fade**: the top of the subject dissolves into the background (a vertical `bg`-to-transparent
  gradient over the top 15–25 % of the stage, like haze). Background objects are lighter and lower contrast.
- **Night variant** (sky / weather topics): background drops to a very dark, desaturated version of the kit's
  colour, with large blurred cloud blobs a few steps lighter at 40–60 %; the subject stays bright. One glow
  colour (the kit's accent) for energy.
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

## How colour is used (colours themselves come from the kit)

| role | rule |
|---|---|
| background | the kit's lightest neutral (`bg`), long vertical gradient to a slightly darker version of itself |
| floors / ground planes | 1–2 steps darker than the background, same hue |
| machine bodies | a neutral from the kit (or a desaturated `muted`), drawn in 3 tones: top `shade(c, +10 %)`, front `c`, side `shade(c, −12 %)` |
| dark parts | slots, rails, screens, cables in the kit's darkest colour (`fg` or a near-black) |
| key part | the kit's `accent`: the ONE strong colour, only on the part the film explains |
| secondary moving parts | `accent2` if the kit has one, otherwise a lighter shade of `accent` |
| repeated objects (stacks, rows) | the kit's colours desaturated / muted (mix 30–40 % toward grey) so they never compete with the key part |
| outlines | each face's own colour, one step darker (`shade(face, −20 %)`), 1–1.5 px |

Rule: the world is neutral and low-contrast; **one** strong colour marks the part the film is about.

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
| plate | `plate()` with the project kit set to `gradient`, no texture, grain 0, vignette 0; night variant: `bgGradient` with dark shades of the kit colour plus 4–6 large blurred `ellipse` clouds, seeded |
| atmosphere fade | after drawing the stage, `fill` a vertical linear gradient from `B.c.bg` (alpha 1) to transparent over the top of the stage |
| 3-tone objects | write a small `box3(ctx, x, y, w, h, d, tones)` iso-box helper in the project (`stage.mjs`): top / front / side faces + 1 px darker outline; build machines from boxes, cylinders (`ellipse` + rect) and `poly` |
| repeated detail | loops with seeded indices (ribs every 10–14 px, windows in a grid, keys in a grid) — rule 7 |
| glow on key part | `glow()` from `core.mjs` with `B.c.accent` |
| tones | `shade()` / `mix()` from `core.mjs` on the kit colours; never hard-code hex |
| contact shadow | `ellipse` filled `rgba(0,0,0,.18)` with `ctx.filter = "blur(10px)"` |
| camera | `push()` / `camera()` from `fx.mjs`, gentle values only |

If `box3` or the iso helpers prove useful across films, move them into `lib/shapes.mjs`.

Checklist before render: all colours from `B.c` (no hex in the stage code), one subject, one strong accent colour, top quarter of the frame calm and empty,
no text baked into the illustration (no logos, no names), mechanism visibly moving in every beat.
