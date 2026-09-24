# Brief sheet — fill this BEFORE writing drawing code

**Client / brand:** …  **Platform(s):** Reels / TikTok / Shorts  **Format:** 1080×1920, 30 fps  **Length:** … s
**The one thing the viewer remembers:** …
**Hook (≤ 7 words, readable in 1 s):** …    (write three, pick one)
**Style preset:** hype editorial / clean corporate / soft lifestyle / data desk   **Brand kit:** brand.json
**Voice-over:** none / file … (starts at … s; timings from words.json)   **Music:** beat.mjs hype / chill / corporate at … bpm (`--end` on the logo at … s) / licensed track …
**Tempo (no VO):** … bpm → beat … s, bar … s

| # | start | bars | on-screen text (exact, with *emphasis*) | what moves → end state | transition in | sound cue (t) |
|---|---|---|---|---|---|---|
| 1 | 0.00 | 2 | 3 rules for a hook that *stops the scroll* | tag already on; words slam in; scribble circles the emphasis → full headline + sub-line | — | impact 0.00, taps per word, swoosh 1.33 |
| 2 | 3.87 | 2 | Move in *frame one* | headline rises; sub-line fades; demo card springs up, its content already moving → card holds, pushing in | whip | whip 3.69, pop 4.75 |
| … | | | | | | |

Rules for the table
- **Every row has an end state** someone could point at. No end state = not a beat yet.
- **The key moment of a scene sits in its middle**, not at the end where the cut eats it.
- **A cut must add information.** If the next scene shows the same thing bigger, move the camera instead.
- **Text is exact** — the words on screen, not a description. Count them against the reading time
  (0.3 s/word + 0.6 s).
- **Transitions**: one default family + ≤ 2 accents. Name it for every row.
- **Sound cue = the contact frame − ~0.03 s.** `cues()` in film.mjs is written from this column.

Style bible (paste verbatim at the top of film.mjs; paraphrasing it causes drift)
- Plate: … | Type: display …, body … | Colours: fg …, accent … (emphasis), accent2 … (hand marks), accent3 …
- Motion: entrances …, stagger …, exits …, springs freq … damp … | Transitions: default …, accents …
- Camera: push +…% per hold, punch on beats yes/no | Finish: vignette …, grain …
