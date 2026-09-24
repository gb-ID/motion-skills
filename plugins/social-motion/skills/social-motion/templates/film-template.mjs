// film-template.mjs — copy into your project as film.mjs, then edit the [EDIT] regions.
//   node film.mjs sheet 0,1,2.5,4,6 --safe   look (with platform UI shaded)
//   node film.mjs strip 1.8 12                frames around a transition
//   node film.mjs verify                      frames must not depend on render order
//   SCALE=.5 node film.mjs render             quick half-size preview
//   node film.mjs render && node film.mjs cues
// This template: an 8 s, 9:16 promo at 120 bpm — hook, a stat, CTA + logo.
//
// STYLE BIBLE: [EDIT] paste the style bible from your brief here, verbatim.
import path from "node:path";
import { fileURLToPath } from "node:url";
const HERE = path.dirname(fileURLToPath(import.meta.url));
const LIB = process.env.SOCIAL_MOTION_LIB || path.join(HERE, "../lib");                  // [EDIT] path to the skill's lib/
const { clamp, inv, eOut5, beat } = await import(path.join(LIB, "core.mjs"));
const { run } = await import(path.join(LIB, "film.mjs"));
const { loadBrand } = await import(path.join(LIB, "brand.mjs"));
const { kinetic, counter, captions, wordTime } = await import(path.join(LIB, "type.mjs"));
const { plate, makeGrain, vignette, camera, push, particles } = await import(path.join(LIB, "fx.mjs"));
const { loadImages, photo, cutout, prepClip, clip } = await import(path.join(LIB, "media.mjs"));
const { sequence } = await import(path.join(LIB, "sequence.mjs"));
const { tag, cta, logoSting } = await import(path.join(LIB, "components.mjs"));
const { underline } = await import(path.join(LIB, "shapes.mjs"));
import fs from "node:fs";

// [EDIT] the brand kit: BRAND=clean node film.mjs … picks a kit by name (./brands, ~/.social-motion/brands, the skill's brands/);
// otherwise ./brand.json next to this file, otherwise the default kit. Colours, fonts, logo AND motion style come from it.
const B = await loadBrand(process.env.BRAND || (fs.existsSync(path.join(HERE, "brand.json")) ? path.join(HERE, "brand.json") : undefined));
const ST = B.style;

// [EDIT] voice-over: put words.json here (from scripts/words.mjs) and captions appear automatically.
// Lock visuals to the voice with wordTime(WORDS, "word") instead of guessing times.
const WORDS = fs.existsSync(path.join(HERE, "words.json")) ? JSON.parse(fs.readFileSync(path.join(HERE, "words.json"), "utf8")) : null;

// [EDIT] media: photos / cut-outs / clips you have the rights to, e.g. in ./assets
// const IMG = await loadImages({ hero: "assets/hero.jpg", product: "assets/product.png" }, HERE);
// const BROLL = await prepClip(path.join(HERE, "assets/broll.mp4"), { fps: 30, w: 1080, dur: 4 });
const W = 1080, H = 1920, CX = W / 2;
const BPM = 120, BAR = beat(4, BPM);                                                   // [EDIT] tempo: scenes are whole bars


// [EDIT] one scene per row of the brief. Frame 0 of each scene must already show something.
const SEQ = sequence([
  { name: "hook", dur: BAR, draw(ctx, lt) {
    plate(ctx, W, H, lt, B, 1);
    camera(ctx, W, H, { zoom: push(lt, 0, BAR, .05) }, () => {
      tag(ctx, lt, { B, text: "NEW", x: CX, y: 440, t0: -.3 });
      kinetic(ctx, lt, "Your new *favourite* thing", CX, 560, { B, size: 180, maxW: 900, t0: -.1, anim: ST.hook });
    });
  } },
  { name: "stat", dur: BAR, draw(ctx, lt) {
    plate(ctx, W, H, lt, B, 2);
    // with a photo instead of the plate:  photo(ctx, lt, { img: IMG.hero, x: 0, y: 0, w: W, h: H, zoom: [1.05, 1.15], dur: BAR, from: "none", tint: { color: B.c.bg, alpha: .5 }, fade: { color: B.c.bg, size: .5 } });
    // b-roll:                             clip(ctx, lt, { clip: BROLL, x: 0, y: 0, w: W, h: H, from: "none", grade: { contrast: 1.1, sat: .9 }, tint: { color: B.c.bg, alpha: .45 } });
    camera(ctx, W, H, { zoom: push(lt, 0, BAR, .04) }, () => {
      kinetic(ctx, lt, "Loved by", CX, 430, { B, size: 150, t0: 0, anim: "rise" });
      counter(ctx, lt, { B, to: 12500, t0: .25, dur: 1.1, x: CX, y: 820, size: 280, compact: true, suffix: "+", color: B.c.accent });
      kinetic(ctx, lt, "people this month", CX, 1000, { B, role: "body", size: 52, t0: .6, anim: "fade", color: B.c.muted, upper: false });
    });
  } },
  { name: "cta", dur: BAR * 2, in: { kind: "circle", dur: .5 }, draw(ctx, lt) {
    plate(ctx, W, H, lt, B, 3);
    camera(ctx, W, H, { zoom: push(lt, 0, BAR * 2, .03) }, () => {
      const L = kinetic(ctx, lt, "Try it *today*", CX, 440, { B, size: 190, t0: 0, anim: "rise" });
      underline(ctx, 300, 780, 470 + L.h, eOut5(inv(.5, .9, lt)), { color: B.c.accent2 });
      cta(ctx, lt, { B, text: "Link in bio", x: CX, y: 1010, t0: .4, tap: 1.4 });
      logoSting(ctx, lt, { B, x: CX, y: 1290, size: 280, t0: beat(4, BPM) });              // on a beat -> beat.mjs --end
    });
    particles(ctx, lt, beat(4, BPM), CX, 1290, { n: 50, colors: B.cycle, seed: 2 });
  } },
], { W, H, transition: { kind: ST.transition, dur: ST.transitionDur } });               // default transition from the kit

const grain = makeGrain({ amount: ST.grain });

run({
  name: "reel", format: "story", fps: 30, dur: SEQ.dur, background: B.c.bg,
  frame(ctx, t, S) {
    SEQ.draw(ctx, t, S);
    // overlays that must NOT move with scenes (captions, a logo bug) go here
    if (WORDS) captions(ctx, t, WORDS, { B, x: CX - 30, y: 1360, size: 64, max: 3, maxW: 760 });
    if (ST.vignette) vignette(ctx, W, H, ST.vignette); grain(ctx, W, H, t, S.fps);
  },
  // [EDIT] the sound timeline, from the same numbers as the picture (cue ≈ contact − 0.03 s)
  cues() {
    const s = (n) => SEQ.start(n), q = [{ sfx: "impact", t: 0, vol: .5, duck: true }];
    for (const T of SEQ.transitions) q.push({ sfx: T.kind === "circle" || T.kind === "push" ? "swoosh" : "whip", t: T.at - (T.dur ?? .3) / 2 - .02, vol: .45 });
    q.push({ sfx: "ding", t: s("stat") + 1.33, vol: .35 }, { sfx: "tap", t: s("cta") + 1.38, vol: .55 });
    q.push({ sfx: "impact", t: s("cta") + beat(4, BPM) - .02, vol: .45, duck: true }, { sfx: "sparkle", t: s("cta") + beat(4, BPM) + .05, vol: .4 });
    return q;
  },
});
