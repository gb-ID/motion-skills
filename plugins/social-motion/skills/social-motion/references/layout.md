# Layout: formats, safe zones, composition

## Formats (`FORMATS`)

| key | px | where |
|---|---|---|
| `story` | 1080×1920 | Reels, TikTok, Shorts, Stories — **the default** |
| `portrait` | 1080×1350 | IG / FB feed |
| `square` | 1080×1080 | feed, LinkedIn |
| `landscape` | 1920×1080 | YouTube, X, presentations |

30 fps for social (24 only for a filmic look). Design in these pixel units; `SCALE` only changes output size.

## Safe zones (`safe(W, H, platform)`)

The platform UI covers the top (username, "Reels" header), the bottom (caption text, audio ticker, nav)
and a **rail on the right** (like / comment / share) that starts about halfway down.

```
 ┌──────────────── 1080 ────────────────┐
 │  top 250  (header, username)         │
 │   ┌──────────────────────────────┐   │  x 70 … 1010  (symmetric: centred text stays centred)
 │   │                              │   │
 │   │  headlines live here         │   │
 │   │                    ┌─────────┤   │  rail.y ≈ 860: below this, keep x < 900
 │   │  cards, charts     │  rail   │   │
 │   └────────────────────┴─────────┘   │  b = 1480
 │  bottom 440  (caption, audio, nav)   │
 └──────────────────────────────────────┘
```

`platform`: `all` (default, survives Reels + TikTok + Shorts), `reels`, `tiktok`, `shorts`, `clean` (no UI).
The numbers are conservative and platforms move their UI — use `--safe` on every sheet, and upload a test
as a draft now and then.

## Composition for 9:16

- **Top third = the headline** (y 300–800). Eyes land there first after the header.
- **Middle = the proof** (card, chart, number, product) centred slightly left of centre when below `rail.y`
  (centre x ≈ 500).
- **Bottom band 1150–1450 = captions / CTA.** Nothing important below 1480.
- The lower 440 px will look empty in your sheets without UI — that's correct; don't fill it with content,
  fill it with plate (gradient, decor) so the frame doesn't look cut off when viewed without UI.
- Left-align body text in lists and cards; centre headlines and single numbers.
- Margins: 70–90 px from the safe edge to text; 40–60 px padding inside cards.
- Grids: `cols(safe, 2, 32)` for comparisons (before / after), `rows(...)` for stacked cards.

## Other formats

For `square` / `portrait` / `landscape` the safe zone is a clean 70–90 px margin. Scale sizes by
`W / 1080` (landscape: headline 120–160 px is plenty at 1920 wide, since it's watched larger).
