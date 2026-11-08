# Combined style: stadium hybrid (story.gaffer × lo.jaditau)

Saved Nov 2026, approved on the Declan Rice "si raja assist" reel (GoonerBurger).
Use when the user asks for "gaya story.gaffer + lo.jaditau", "stadium hybrid", "jalan tengah", or for a
football explainer that mixes tactical pitch scenes with object / number scenes.

**Colours and type always come from the project's kit** (`B.c.*`, `B.font`). Nothing below is a hex value
except where it describes light and shadow (white / black at an alpha).

Parents: `style-story-gaffer.md` (the world, the camera, the light) and `style-lo-jaditau.md` (how objects
are drawn). Take the look of both, never their brands.

## The one rule: one world, three cameras

Every scene lives in the SAME night stadium. Scenes differ only by camera distance, so cutting between them
never looks patchy ("belang"):

| camera | mix | use it for | what is in frame |
|---|---|---|---|
| **Perspective** (pitch-side, low 3/4) | ~75 % story.gaffer / 25 % lo.jaditau | one movement, one pass, drama and depth | tiered stands full of crowd dots, floodlight bloom from above, striped pitch, white lines, goal with net, players as tokens |
| **Aerial** (high, ~78° down, not flat 90°) | same world | when the whole structure must be read: a block's shape, distances, rotations, an overlap | the goal-end stand still visible at the top, the whole half (to the halfway line), bigger flatter tokens |
| **Object close-up** | ~25 % story.gaffer / 75 % lo.jaditau | numbers, comparisons, connecting lines ("lima assist", "musim lalu", "supaya smooth") | one object (ball rack, gears, corner flag…) standing on a patch of the SAME striped turf, stands behind it out of focus (blur 6–8 px), same bloom |

What ties them together (never change these inside a film):
- the plate: very dark near-black (`B.c.bg` of a dark kit; with a light kit use its darkest neutral)
- the floodlight bloom (white radial at 15–22 %) and dark edges (radial vignette to black ~70 %)
- the turf: two-tone stripes in a dark, desaturated green (or the kit's darkest neutral if the brand forbids green), white lines
- crowd dots in the kit colours (white, accent, two greys) at low alpha (10–40 %), dot size by depth
- objects and tokens drawn lo.jaditau-style: 3 tones (top light, front mid, side dark), 1–1.5 px outline one step darker, soft blurred contact shadow
- ONE strong colour (the kit's accent) for the subject: our team's tokens, the key lane, the key object

## Pitch scenes

- Players are **tokens** (short cylinders), never figures: our team in `accent`, the opponent in a light neutral.
  Kit number inside the top face (GoonerBurger convention). Name chips (pill, kit fg/bg inverted) only on the 1–2
  players the line is about.
- Data and tactics live on the grass: a defensive block as a soft lit zone with a dashed outline, passing lanes
  as dashed lines (key lane in accent with glow + arrow head, option lanes white at 35 %), an "opened angle"
  wedge in accent at ~14 %, small dashed drift arrows for players being pulled.
- The subject token gets a soft accent light pool under it.
- Optional story.gaffer kicker top-left in mono, 24–26 px, white 55 %: "01 · PENEMPATAN POSISI · VS CHELSEA".
  Drop it when the brief says "not text heavy".
- Top ~25 % of the frame stays dark and quiet (stands fade into black).

## Object scenes

- One object per scene that stands for the sentence, sitting on the turf patch (a slab with thickness).
- The object carries the meaning: count = number of items (5 balls = 5 assists), the "other" option faded
  (corner flag at 45 % when assists are all open play), steps = numbered gears that take turns lighting up.
- A small pill chip may carry one number ("5/5 OPEN PLAY"); no other text on the object.

## Motion and transitions

- Calm, continuous camera like story.gaffer: slow push-ins, drifts; damp ≥ .85, no shake.
- Move the camera between views instead of cutting: perspective → rise to aerial to show the structure → drop
  back; or push from the pitch into one ball which turns out to sit on the rack (object scene), and pull back
  out to the pitch again. Use `fade` 0.4–0.5 s only when a camera move is impossible.
- The mechanism moves: tokens slide to their spots, lanes draw on, balls drop into the rack one by one on the
  VO's words (`wordTime`), gears turn and the lit gear moves 1 → 2 → 3 on "Pertama / Kedua / Ketiga".
- Optional "punch" scenes (1–2 per film, e.g. hook and outro) may flip the plate to the kit's accent with white
  objects and dark accents. Keep pitch scenes on the dark plate so team colours stay readable.

## Building it

Reference code: `examples/stadium-hybrid/` (`frame-pitch.mjs` for the perspective and aerial cameras,
`frame-object.mjs` for an object close-up). Both are single-frame renderers that show the drawing approach:
a pinhole camera `P(x, z, y)` with yaw/tilt for the pitch (aerial = same function, higher and steeper), an iso
`P()` plus `box()` for objects, tokens projected from circles so they stay correct in perspective, stands
filled with seeded crowd dots (rule 7). Move the pieces into a `stage.mjs` of the project and animate them
over `t`.

Checklist: same plate, bloom, turf and crowd in every scene; one accent per frame; tokens not figures; no
hex in stage code except light/shadow alphas; top quarter quiet; the camera, not a cut, links the views.
