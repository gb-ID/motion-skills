# Reference style: "story.gaffer" (stadium data story)

Source: instagram.com/story.gaffer (football data storytelling reels), studied Oct 2026 from 4 reels
(Messi ball losses, "Penaldo" penalties, free-kick decline, Haaland vs weaker teams).
**Take the look, not the brand.** Never copy their logo, name, mascot chip or wording. Their logo slot
holds the user's own brand (GoonerBurger, a client).

Kit: `brands/stadium-night/` (`BRAND=stadium-night`). Use with the **voice-over workflow** (`sound.md`).

## What it is in one line

A calm, narrated data story told inside an illustrated night stadium. The headline at the top states one fact
per beat, the stage below turns that fact into an object (heatmap, tower, scale, filling net), and a big mono
counter ticks up to the number. Question → number → twist → verdict, 30–40 s.

## Frame anatomy (1080 × 1920)

```
y  5–7 %   brand chip: small rounded square logo (accent2 fill) + wordmark in mono 22–26 px, fg 80 %
y  9–10 %  optional kicker: "— EVERY GAME OF HIS CAREER, REPLAYED", mono 20–22 px, UPPERCASE, tracking +15 %, fg 35 %
y 11–20 %  HEADLINE, left-aligned at x = 9 %, max width 78 %, 2–3 lines
y 24–30 %  counter: big mono number centred over the stage + tiny mono label under it ("TIMES HE LOST THE BALL")
y 30–92 %  the STAGE (illustration / data object), full bleed
y 92 %+    usually empty (platform UI); sources line on the end card only
```

The top third stays dark and quiet so the headline always reads. Nothing sits behind the headline.

## Type

- Headline: bold neo-grotesk (Inter/Söhne-like), **sentence case**, 88–100 px, line height 1.08, fg off-white.
  Deliberate exception to SKILL rule 5 (110 px): the VO carries the words. Never go below 84 px.
  In this kit: Poppins Bold, which runs wide and heavy, so use 84–88 px with it (add Inter Bold to a private kit
  if you want it closer).
- Emphasis = **colour only** on the key number or word (`highlight: "color"`). No marker block, no underline.
  One emphasis per headline. Headlines end with a full stop or a question mark.
- Numbers on the stage: mono (Space Mono Bold) 120–170 px, with a mono label 18–22 px UPPERCASE at 60 % under it.
- Each headline ≤ 9 words, holds 2.5–4 s (as long as the VO line). The scene often stays while the headline swaps.

## Colour = meaning

| role | hex (approx.) | used for |
|---|---|---|
| bg top | `#07090E` | sky / void above the stadium |
| surface | `#151B26` | cards, monitor panels, chips |
| fg | `#F3F1EA` | headlines |
| muted | `#8A93A3` | labels, kicker |
| accent (gold) | `#F2C14E` | default emphasis, "the subject's" numbers, follow button, logo chip |
| accent2 (red) | `#FF5B4F` | bad / lost / missed, LED counters, stamps ("PENALDO?") |
| accent3 (green) | `#4ADE80` | good / healthy / scored, ECG lines |
| pitch | `#3F7A3B` → `#2C5A2B` | grass with 2-tone mowing stripes, white lines |
| comparison | `#7AA7FF` blue / `#FF8FB1` pink | the "other" player or team in head-to-heads |

Switch the headline's emphasis colour to match the meaning of that beat (red for "6 free-kick goals",
green for "about as often", gold for the subject).

## The stage

- **Flat-vector night stadium**: dark crowd band (thousands of 3–5 px dots in kit colours over `#1A2030`),
  green pitch with stripes, white lines, a goal. Low 3/4 camera. Soft vertical light bloom from above.
- **Flat players**: simple proportions, solid kit colours, shirt name + number, no facial detail, soft ellipse
  shadow. They move a little (dribble, shoot, celebrate) so the hold breathes.
- **Data lives in the scene**, not on a chart card:
  - particle **heatmap** on a tilted pitch (dots accumulate as the counter rises; red = losses, gold = dribbles)
  - **3D bar towers** standing on the pitch (one per player; the subject's tower in accent)
  - a **balance scale** comparing one stack against several
  - glass **cylinders** filling with balls; a goal **net filling with tally squares**
  - **waffle grids** of balls (1 in 5 red), split-flap / LED **scoreboards**, ECG lines on a monitor card
  - **bars with red caps** along the touchline, a gold pin marker on one ("35")
- One "punch" element per film: a red rubber-stamp word slammed at −8° ("PENALDO?"), or a big gold "?" over
  the player in the verdict beat.

## Motion

- Calm and continuous, not hype. One world per film; the camera **dollies / tilts** between views instead of
  hard cuts (pitch-level → overhead heatmap → back down). Default transition `fade` 0.45–0.6 s.
- Headline change: old line fades out 0.2 s, new line rises 24 px + fades in 0.35 s (`anim: "rise"`, damp ≥ .8).
- Counters: `counter()` with `eOut5`, 1.2–2.0 s, synced to the VO saying the number (`wordTime`).
- Particles / balls spawn with a seeded stagger as the counter rises; towers grow with a soft spring (no bounce).
- Occasional gold **light wash** (full-frame `accent` at 15–25 %) as a beat transition into a reveal.
- Frame 0: the stadium scene already in motion (player on the ball). Headline lands by ~0.8 s.

## Structure (typical 32–38 s, 9–12 beats)

1. Hook claim with a number ("No Barcelona player lost the ball more than *Messi*.")
2. Count it up on the stage ("*3,628* times, in La Liga.")
3. Compare to make it feel big ("More than Iniesta, Neymar and Suárez *put together*.")
4. Twist ("Sounds bad. Until you see *why*.")
5. The counter-stat, recoloured ("He dribbled past a player *2,944* times.")
6. Context comparison (scale / towers)
7. Verdict question ("So is the nickname *fair*?")
8. Follow chip slides in bottom-centre (logo + handle + tagline) during the last line
9. End card (2–3 s): logo, wordmark in mono, tagline, mono sources line at 40 %, gold pill button "FOLLOW FOR MORE"

Caption mirrors the script beat by beat, ends with "All sources on our website" and a keyword CTA
("Comment 77 for the free-kick test").

## Sound

- AI-style narration VO first; picture lands on its words (SKILL rule 8, VO path).
- Bed: low ambient stadium crowd + soft pad, ducked under the VO (−18 to −22 LUFS bed vs VO at −14).
- Ticks under counters, a soft "thump" on tower/stamp landings, a crowd swell on the verdict. No beat drops.

## Building it with the library

| need | use |
|---|---|
| plate | `plate()` with this kit (gradient, no texture), then draw the stadium on top |
| headline | `kinetic(ctx, t, "*3,628* times,\nin La Liga.", 97, 210, { B, role: "head", size: 92, align: "left", anim: "rise" })`; for a red or green beat pass `accent: B.c.accent2` / `B.c.accent3` |
| kicker / labels / counters | `B.font("mono", px)`, `counter()` |
| bars, columns | `charts.mjs` drawn in perspective (skew with `ctx.transform`) and given red/gold caps |
| crowd, pitch, flat player, particle heatmap, stamp | write small draw functions in the project (`stage.mjs`); seed every dot from its index (rule 7). If they prove useful across films, move them into `lib/components.mjs` |
| follow chip, end card | `lowerThird`, `cta`; draw the button as a pill (radius = height / 2) |

Checklist before render: headline top-left inside safe zone, only one emphasis colour per line, counter
label present, stage never covers the headline, end card has a sources line.
