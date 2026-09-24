# Workflow: from a brief to a posted reel

1. **Brief → one paragraph.** Who it's for, the one thing they should remember, the platform(s), length
   (tips 15–30 s, promos 8–15 s, explainers 30–60 s), format (9:16 unless told otherwise), style preset
   (`styles.md`), brand kit. If the client gave a script, count words: ~2.5 words/s is the ceiling for
   on-screen text people can read.
2. **Hook first.** Write three hook lines and pick one. A hook is a claim, a number, a question or a
   before/after, readable in ≤ 1 s (≤ 7 words). The logo does not go first.
3. **Brief sheet** (`templates/brief.md`): tempo, then one row per beat — start, bars, on-screen text (exact,
   with `*emphasis*`), what moves and its end state, transition in, sound cue. Add the style bible at the
   bottom and paste it verbatim at the top of `film.mjs`; paraphrasing it causes drift between sessions.
4. **Brand kit.** Use the client's kit by name (`loadBrand("client")`), or make one: copy `brands/hype` or
   `brands/clean` to `~/.social-motion/brands/<client>/`, set colours, fonts (static .ttf/.otf next to it),
   logo and `style` (`brand-and-assets.md`). Collect photos / footage into `assets/` with a licence note.
   Check the kit with a one-frame sheet before building scenes.
5. **Build** from `templates/film-template.mjs`:
   - One `sequence([...])` scene per beat row; `dur` = whole bars (`beat(4, BPM) * n`).
   - Inside a scene everything is a function of local time `lt`: `kinetic(…, { t0 })`, `spring(lt - t0)`,
     `life(lt, t0, t1)`. Never state carried between frames.
   - Draw order = depth: background plate → decor → content (inside `camera()`) → overlays (captions,
     logo bug) → finish (vignette, grain).
   - Frame 0 of every scene already looks finished (transitions reveal it — see `motion.md`).
6. **Look.** `node film.mjs sheet <end state of each beat> --safe`. Fix. `strip <cut − 0.2> 12` for every
   transition. `verify` with times straddling the cuts. Then `SCALE=.5 node film.mjs render` and watch it
   once in real time: timing problems only show in motion.
7. **Polish pass** (`polish.md`, last section). This is where "fine" becomes "good".
8. **Render + sound.** `render`, `cues` (from the film's `cues()`), `beat.mjs` (same bpm, `--end` on the logo),
   `sound.mjs` to mix, loudnorm (−14 LUFS) and mux.
9. **Check the master.** `contact out/<name>-final.mp4` and read it beat by beat; check duration, that
   audio exists, and loudness (`ffmpeg -i final.mp4 -af ebur128=peak=true -f null -` → I ≈ −14 ± 1,
   peak ≤ −1). Export a cover with `still <t> cover.png` (the frame with the hook fully on screen).
10. **Deliver**: the final MP4 (H.264 high, yuv420p, 30 fps, AAC 48 kHz, faststart), the cover PNG, and the
    brief sheet so the next edit starts from the plan, not the code.

Speed reference: the 24 s 1080×1920 example renders 718 frames in ~105 s on a 4-core cloud VM. Sheets take
seconds, so iterate on sheets and half-scale previews, render full size once.
