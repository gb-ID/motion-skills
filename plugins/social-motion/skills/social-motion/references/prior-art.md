# Prior art

This skill is a re-build of the architecture of **buildwithhanif/claude-animation-skill** (MIT), re-aimed at
social-media motion graphics. Portions of `lib/film.mjs`, `lib/core.mjs` and `scripts/sound.mjs` are adapted
from it (see LICENSE).

## Taken from claude-animation-skill

1. **A film is a pure function `frame(ctx, t)`** rendered by node canvas into ffmpeg — no browser, no GPU.
2. **One harness, many modes**: `sheet` (look before render), `strip` (consecutive frames around fast
   action), `verify` (same frame in and out of order), staged `render` (a failed encode never overwrites a
   good file).
3. **Stable seeds** from names / indices, never from the frame or `Math.random`.
4. **Plan before code**: a beat sheet where every row has an end state, a camera and a sound cue, and a
   style bible pasted verbatim into every build session.
5. **A detail bible** (here `polish.md`) that asks for quality surface by surface instead of hoping for it.
6. **Synthesised SFX on a cue timeline** from the picture, two-pass loudnorm + oversampled limiter, mux.
7. **Traps table**: every bug that cost a render, written down with its fix.
8. **SKILL.md as a router**: short hard rules + a "read first" table; detail lives in `references/`.

## New here

- Brand kits (`brand.json` → colours, fonts, logo, motion style) looked up by name from project / private / shipped folders, consumed by every component.
- Media: stock photos (Ken Burns, duotone, grade, tint), transparent cut-outs with sticker outlines, b-roll clips.
- Platform safe zones with the right-hand rail, and a `--safe` overlay on previews.
- Kinetic typography engine (markup emphasis, 7 reveal styles, exits, auto-fit), counters, TikTok captions.
- Closed-form springs and `life()` envelopes — seekable motion without state.
- `sequence()` with 10 transitions centred on cuts, exposing cut times for sound.
- Charts (bars, columns, donut, line) and social components (tag, card, list, lower third, CTA, logo sting).
- `beat.mjs`: a synthesised music bed in three styles with drop / breaks / end resolution and a beat grid.
- `canvas.data()` in the render loop (fixes an out-of-memory at 1080×1920), `SCALE` preview renders, `still` and `contact` modes.
