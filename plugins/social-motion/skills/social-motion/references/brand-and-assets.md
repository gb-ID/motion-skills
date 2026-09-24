# Brand kits, styles and assets

## Where kits live

`loadBrand(x)` accepts a path to a `brand.json`, a folder containing one, or a **kit name**, which it looks up
in this order:

| where | use it for |
|---|---|
| `./brands/<name>/brand.json` (in the project) | a one-off campaign's kit, committed with the project |
| `~/.social-motion/brands/<name>/brand.json` | **your private client kits**, available to every project on this machine and never pushed to the public plugin repo |
| `<skill>/brands/<name>/brand.json` | kits shipped with the plugin: `hype` (dark, condensed, loud) and `clean` (light, corporate) |

Start one with `node <skill>/scripts/new-kit.mjs <name> --from clean` (or `hype`). A kit folder holds everything the brand needs:

```
~/.social-motion/brands/kopi-pagi/
  brand.json
  fonts/Recoleta-Black.otf  fonts/Inter-SemiBold.ttf
  logo.png                     (transparent PNG, ≥ 1000 px wide, or SVG)
  assets/                      (approved photos, cut-outs, b-roll, with a LICENSE.txt note)
```

In a film: `const B = await loadBrand(process.env.BRAND || "kopi-pagi")`, so `BRAND=clean node film.mjs render`
renders the same film in another kit. Paths inside `brand.json` (fonts, logo) resolve from the kit folder;
`B.dir` is that folder, for loading the kit's own assets: `loadImages({ hero: "assets/hero.jpg" }, B.dir)`.

## brand.json

```json
{
  "name": "Kopi Pagi",
  "colors": { "bg": "#1B120C", "surface": "#2A1D14", "fg": "#FFF4E6", "muted": "#B9A590",
              "accent": "#E8793A", "accent2": "#F6C35A", "accent3": "#7FB069" },
  "fonts": {
    "display": { "family": "Recoleta", "files": ["fonts/Recoleta-Black.otf"], "weight": 900, "upper": false },
    "head":    { "family": "Inter", "files": ["fonts/Inter-Bold.ttf"], "weight": 700 },
    "body":    { "family": "Inter", "files": ["fonts/Inter-SemiBold.ttf"], "weight": 600 },
    "mono":    { "family": "Space Mono", "files": ["SpaceMono-Bold.ttf"], "weight": 700 }
  },
  "logo": "logo.png",
  "radius": 32,
  "style": { "plate": "mesh", "texture": "dots", "blobs": ["accent", "accent2"], "blobAlpha": 0.3,
             "anim": "rise", "hook": "slam", "highlight": "marker",
             "transition": "whip", "transitionDur": 0.32, "grain": 0.05, "vignette": 0.3 }
}
```

**Colours**: `bg` plate, `surface` cards, `fg` text, `muted` secondary text, `accent` emphasis/buttons, `accent2`
hand marks/sparks, `accent3` "yes/good". Check text contrast: `onColor(bg)` picks black or white text for you.

**Fonts**: one entry per role (`display` headlines, `head` subheads/buttons, `body`, `mono` numbers/labels).
- Use **static** `.ttf` / `.otf` files, one per weight. Variable fonts register only their default weight.
- Several files may share one `family` (Poppins Regular + Black) and `weight` picks between them.
- `"upper": true` makes that role uppercase automatically (condensed display faces).
- If a file isn't found you get a warning and a system fallback, so read the terminal output and check a sheet.
- Licensing: brand fonts bought by the client usually allow use in their videos but **not redistribution**.
  Keep them in the private kit folder, never in a public repo. Google Fonts (OFL) are safe to bundle.

**Style** (the look in numbers, read by `plate()`, `kinetic()` and the template):

| key | values | effect |
|---|---|---|
| `plate` | `mesh` · `gradient` · `flat` | the background (`plate(ctx, W, H, t, B, seed)`) |
| `texture` | `dots` · `grid` · `stripes` · `none` | a drifting texture over the plate |
| `blobs`, `blobAlpha`, `blobSize` | colour roles or hex; 0.1–0.5 | mesh blob colours and strength |
| `gradientTo` | a colour role | second colour for `plate: gradient` |
| `anim` | `rise fade pop slide slam type scramble` | default text entrance |
| `hook` | same | the hook's entrance (the template uses it) |
| `highlight` | `marker` · `underline` · `color` | how `*emphasis*` shows |
| `transition`, `transitionDur` | see `motion.md` | default scene transition |
| `grain`, `vignette` | 0–0.08, 0–0.4 | finish |

A new house style is a new kit. Copy `brands/hype` or `brands/clean` and change the numbers. Anything the
style block can't express (a signature shape, a mascot, a recurring frame) becomes a small draw function in
the project (or in `lib/components.mjs` if every film should have it), documented in `styles.md`.

## Photos, cut-outs and b-roll (`lib/media.mjs`)

```js
const IMG = await loadImages({ hero: "assets/cafe.jpg", cup: "assets/cup.png" }, B.dir);
const BROLL = await prepClip("assets/pour.mp4", { fps: 30, w: 1080, start: 2, dur: 3 });

photo(ctx, lt, { img: IMG.hero, x: 0, y: 0, w: W, h: H, zoom: [1.05, 1.15], dur: 3, from: "none",
                 focus: [.5, .4], tint: { color: B.c.bg, alpha: .45 }, fade: { color: B.c.bg, size: .5 } });
photo(ctx, lt, { img: IMG.hero, x: 140, y: 1100, w: 400, h: 300, radius: B.radius, t0: .3, from: "rise", shadow: true });
cutout(ctx, lt, { img: IMG.cup, x: 760, y: 1450, h: 520, t0: .4, outline: { color: "#fff", w: 14 } });
clip(ctx, lt, { clip: BROLL, x: 0, y: 0, w: W, h: H, t0: 0, grade: { contrast: 1.1, sat: .9 }, tint: { color: B.c.bg, alpha: .4 } });
```

- **Full-bleed photo behind text**: always add `tint` (35–55 % of `bg`) or `fade` (gradient to `bg` where the
  text sits). Text straight on a busy photo fails the thumbnail test.
- **Ken Burns**: `zoom: [1, 1.12]` over the scene plus a small `pan`, so a still photo is never static (rule 3).
- **On-brand treatment**: `duotone: [B.c.bg, B.c.accent]` turns any stock photo into brand colours, and
  `grade: { contrast, sat, bright }` evens out photos from different sources.
- **Cut-outs**: transparent PNG subjects (products, people with the background removed) get a sticker
  `outline` and a float. Remove backgrounds before the film (a remove-bg tool, Canva, Photoshop).
- **B-roll**: `prepClip` extracts and decodes the frames once (cached in `out/.clips/`). Frames live in
  memory (~2.6 MB each at 1080-wide 16:9), so trim with `start`/`dur`, and use `fps: 15` for slow shots.
  `speed: .5` gives slow motion from normal footage, and `loop: false` holds the last frame. The source's audio
  is not used; sound comes from `sound.mjs`.
- **Portrait sources**: 16:9 footage cover-cropped to 9:16 uses only the centre third. Set `focus` to
  keep the subject in frame, or shoot and buy vertical.
- **Where assets go**: `assets/` in the project, or `assets/` in the kit folder for approved brand imagery.
  Put a `LICENSE.txt` next to them (source, licence, date).

## Licensing, in one paragraph

Use only images, footage and fonts you have rights to: your own shoots, the client's library, or stock whose
licence covers social media and paid ads if the post will be boosted. Free-stock sites differ (some forbid
using identifiable people for endorsements, some forbid resale as-is). Keep the licence note with the file.
Logos and trademarks of other companies don't go in a client's video without permission.
