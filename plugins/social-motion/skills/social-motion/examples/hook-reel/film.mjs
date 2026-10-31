// film.mjs — "3 rules for a hook": a 9:16 reel made with the social-motion skill.
//   node film.mjs sheet 0,1.5,5.9,10.6,14.6,18.6,22 --safe | strip 3.72 12 | verify | cues | render | contact
//   ./make.sh builds everything: picture, cues, music bed, mix -> out/hook-reel-final.mp4
//
// BRIEF: an editing tip for creators. Hook (claim) → 3 rules, one per scene → proof (a chart) → CTA + logo.
// STYLE BIBLE (paste verbatim into any session that edits this film):
//   Preset: Hype editorial. bg #111116 + two drifting mesh blobs (accent, violet) + dot grid 54 px.
//   Type: Anton UPPERCASE for headlines (130–200 px), Poppins 600 for body (44–56 px), Space Mono for numbers/labels.
//   Colour: fg white, accent #FF5A36 (emphasis marker, buttons), accent2 #FFD23F (scribbles, sparks), accent3 #3DDC97 (checks).
//   Motion: word rise-in 0.42 s, 0.07 s stagger; exits 0.28 s rise-out; springs freq 3–3.4, damp .45–.55.
//   Cuts on the bar (124 bpm → bar 1.935 s). Transitions: whip (default), zoom into the beat scene, circle into the CTA.
//   Every scene: frame 0 already populated; slow push-in (+4 %) on every hold; grain .05 + vignette .35 last.
import path from "node:path";
import { fileURLToPath } from "node:url";
const HERE = path.dirname(fileURLToPath(import.meta.url));
const LIB = process.env.SOCIAL_MOTION_LIB || path.join(HERE, "../../lib");
const { clamp, lerp, inv, eOut5, eIn, spring, beat, at, rrect, fill, ellipse, rgba } = await import(path.join(LIB, "core.mjs"));
const { run } = await import(path.join(LIB, "film.mjs"));
const { loadBrand } = await import(path.join(LIB, "brand.mjs"));
const { safe } = await import(path.join(LIB, "layout.mjs"));
const { kinetic, captions } = await import(path.join(LIB, "type.mjs"));
const { bgMesh, bgDots, makeGrain, vignette, camera, push, punch, particles, ring, burstLines } = await import(path.join(LIB, "fx.mjs"));
const { sequence } = await import(path.join(LIB, "sequence.mjs"));
const { tag, cta, logoSting, card } = await import(path.join(LIB, "components.mjs"));
const { bars } = await import(path.join(LIB, "charts.mjs"));
const { scribbleCircle, underline, arrow, playIcon } = await import(path.join(LIB, "shapes.mjs"));

const B = await loadBrand();                 // default kit; pass "brand.json" for a client
const W = 1080, H = 1920, BPM = 124, BAR = beat(4, BPM), SF = safe(W, H), CX = W / 2;
const VIOLET = "#5B3DF5", LOGO = beat(5, BPM);           // logo lands on beat 5 of the CTA scene; the music resolves there

// the plate every scene sits on: same world, blobs parked differently per scene so a cut still reads as a cut
const plate = (ctx, lt, seed) => { bgMesh(ctx, W, H, lt + seed * 7, B.c.bg, [B.c.accent, VIOLET], { seed, alpha: .42, size: .6 }); bgDots(ctx, W, H, lt, { color: "rgba(255,255,255,.07)" }); };
const numeral = (ctx, lt, n) => { const s = spring(lt, 2.4, .6); ctx.save(); ctx.globalAlpha = .9 * clamp(lt / .2); ctx.font = B.font("mono", 44); ctx.fillStyle = B.c.accent2; ctx.textAlign = "center"; ctx.fillText(`RULE ${n} / 3`, CX, 360 - (1 - s) * 30); ctx.restore(); };

const SEQ = sequence([
  { name: "hook", dur: BAR * 2, draw(ctx, lt) {
    plate(ctx, lt, 1);
    camera(ctx, W, H, { zoom: push(lt, 0, BAR * 2, .05) * punch(lt, [.02], .05) }, () => {
      tag(ctx, lt, { B, text: "EDITING TIP", x: CX, y: 430, t0: -.3 });                       // already there on frame 0
      const L = kinetic(ctx, lt, "3 rules for a hook that *stops the scroll*", CX, 560, { B, size: 172, maxW: 900, t0: -.12, anim: "slam", stagger: .09, dur: .3 });
      scribbleCircle(ctx, CX + 10, 560 + L.h - L.lh / 2, 450, 115, eOut5(inv(1.35, 1.9, lt)), { w: 10, color: B.c.accent2, seed: 3 });
      kinetic(ctx, lt, "(most people break all three)", CX, 600 + L.h + 70, { B, role: "body", size: 46, t0: 1.9, anim: "fade", color: B.c.muted, upper: false });
    });
    burstLines(ctx, lt, .75, CX, 900, { r0: 380, r1: 520, n: 14, color: B.c.accent2, w: 9 });
  } },
  { name: "rule1", dur: BAR * 2, draw(ctx, lt) {
    plate(ctx, lt, 2); numeral(ctx, lt, 1);
    camera(ctx, W, H, { zoom: push(lt, 0, BAR * 2, .04) }, () => {
      const L = kinetic(ctx, lt, "Move in *frame one*", CX, 430, { B, size: 190, maxW: 900, t0: 0, anim: "rise" });
      kinetic(ctx, lt, "A still first frame looks like a photo. People scroll past photos.", CX, 470 + L.h, { B, role: "body", size: 44, maxW: 760, t0: .6, anim: "fade", color: B.c.muted, upper: false });
      // demo: a "phone" card whose content is already moving on its first frame
      card(ctx, lt, { B, x: CX - 230, y: 980, w: 460, h: 420, t0: .9, radius: 36 }, (c, l) => {
        const k = (l * 1.4) % 1; c.save(); rrect(c, 0, 0, 460, 420, 36); c.clip();
        c.fillStyle = rgba(B.c.accent, .18); c.fillRect(0, 0, 460, 420);
        at(c, 230 + Math.sin(l * 5) * 120, 210 + Math.cos(l * 3.4) * 60, 1 + .15 * Math.sin(l * 9), l * 2, () => { rrect(c, -60, -60, 120, 120, 24); fill(c, B.c.accent); });
        c.restore(); c.font = B.font("mono", 30); c.fillStyle = B.c.fg; c.fillText("FRAME 1", 28, 52); playIcon(c, 410, 40, 34, B.c.fg);
      });
    });
  } },
  { name: "rule2", dur: BAR * 2, draw(ctx, lt) {
    plate(ctx, lt, 3); numeral(ctx, lt, 2);
    camera(ctx, W, H, { zoom: push(lt, 0, BAR * 2, .04) }, () => {
      const L = kinetic(ctx, lt, "Say it in *five words*", CX, 430, { B, size: 190, maxW: 900, t0: 0, anim: "rise" });
      // the five words, TikTok-caption style, one per beat
      const WB = beat(1, BPM), words = "Stop watch this right now".split(" ").map((w, i) => ({ w, s: 1.0 + i * WB, e: 1.0 + (i + 1) * WB - .02 }));
      captions(ctx, lt, words, { B, x: CX - 30, y: 1120, size: 84, max: 5, maxW: 760 });
      const n = clamp(Math.floor((lt - 1.0) / WB) + 1, 0, 5);
      if (n > 0) { ctx.font = B.font("mono", 64); ctx.fillStyle = B.c.accent2; ctx.textAlign = "center"; ctx.fillText(`${n}/5 WORDS`, CX - 30, 1330); }
    });
  } },
  { name: "rule3", dur: BAR * 2, in: { kind: "zoom", dur: .4, color: B.c.accent2 }, draw(ctx, lt) {
    const beats = Array.from({ length: 8 }, (_, i) => i * beat(1, BPM));
    plate(ctx, lt, 4); numeral(ctx, lt, 3);
    camera(ctx, W, H, { zoom: punch(lt, beats.slice(2), .035, 12) }, () => {
      kinetic(ctx, lt, "Cut on the *beat*", CX, 430, { B, size: 200, maxW: 900, t0: 0, anim: "rise" });
      // a visual metronome: a bar of 4 pips, the current beat lights and throws a ring
      for (let k = 0; k < 4; k++) { const x = CX - 30 + (k - 1.5) * 170, y = 1060, cur = Math.floor(lt / beat(1, BPM)) % 4 === k && lt > .1, s = spring(lt - .5 - k * .08, 3.2, .5);
        at(ctx, x, y, Math.max(0, s) * (cur ? 1.18 : 1), 0, () => { ellipse(ctx, 0, 0, 56); fill(ctx, cur ? B.c.accent : rgba(B.c.fg, .14)); }); }
      beats.forEach((b, i) => { if (b > .3) ring(ctx, lt, b, CX - 30 + ((i % 4) - 1.5) * 170, 1060, { r0: 56, r1: 140, color: B.c.accent, w: 6, dur: .4 }); });
      kinetic(ctx, lt, "Your cuts land where the ear expects them.", CX - 30, 1210, { B, role: "body", size: 44, maxW: 720, t0: 1.0, anim: "fade", color: B.c.muted, upper: false });
    });
  } },
  { name: "proof", dur: BAR * 2, draw(ctx, lt) {
    plate(ctx, lt, 5);
    camera(ctx, W, H, { zoom: push(lt, 0, BAR * 2, .03) }, () => {
      kinetic(ctx, lt, "Still watching at *3 seconds*", CX, 380, { B, size: 150, maxW: 900, t0: 0, anim: "rise" });
      bars(ctx, lt, { B, data: [{ label: "Slow intro", value: 38 }, { label: "Logo first", value: 29 }, { label: "Strong hook", value: 71 }], x: 120, y: 760, w: 760, size: 48, t0: .5, highlight: 2, fmt: { suffix: "%" } });
      arrow(ctx, [640, 1410], [830, 1225], eOut5(inv(1.6, 2.1, lt)), { color: B.c.accent2, w: 9, bend: .3, head: 28 });
      kinetic(ctx, lt, "illustrative numbers", 120, 1300, { B, role: "mono", size: 28, t0: 1.2, anim: "fade", align: "left", color: rgba(B.c.fg, .45), upper: false });
    });
  } },
  { name: "cta", dur: BAR * 2 + .7, in: { kind: "circle", dur: .5, at: [CX, 1000], ringColor: B.c.accent }, draw(ctx, lt) {
    plate(ctx, lt, 6);
    camera(ctx, W, H, { zoom: push(lt, 0, 4, .03) }, () => {
      const L = kinetic(ctx, lt, "Save this for your *next edit*", CX, 420, { B, size: 170, maxW: 900, t0: 0, anim: "rise" });
      underline(ctx, 230, 850, 440 + L.h, eOut5(inv(.7, 1.1, lt)), { color: B.c.accent2, w: 12 });
      cta(ctx, lt, { B, text: "Follow for more", x: CX - 20, y: 1090, t0: .5, tap: 1.6 });
      logoSting(ctx, lt, { B, x: CX - 20, y: 1340, size: 300, t0: LOGO, text: "YOUR BRAND" });
    });
    particles(ctx, lt, LOGO, CX - 20, 1340, { n: 60, colors: B.cycle, seed: 4, speed: 1100 });
  } },
], { W, H, transition: { kind: "whip", dur: .32, dir: "left" } });

const grain = makeGrain({ amount: .05 });
export const DUR = SEQ.dur;

run({
  name: "hook-reel", format: "story", fps: 30, dur: SEQ.dur, background: B.c.bg,
  frame(ctx, t, S) {
    SEQ.draw(ctx, t, S);
    vignette(ctx, W, H, .35); grain(ctx, W, H, t, S.fps);
  },
  // the sound timeline comes from the same numbers as the picture
  cues() {
    const q = [], s = (n) => SEQ.start(n);
    q.push({ sfx: "impact", t: .0, vol: .55, duck: true }, { sfx: "pop", t: s("hook") + .02, vol: .3 });
    for (let k = 0; k < 7; k++) q.push({ sfx: "tap", t: -.12 + k * .09 + .28, vol: .22, pitch: 1 + (k % 3) * .08 });   // slam words
    q.push({ sfx: "swoosh", t: 1.33, vol: .35 });                                                          // scribble
    for (const T of SEQ.transitions) q.push({ sfx: T.kind === "zoom" ? "whoosh" : T.kind === "circle" ? "swoosh" : "whip", t: T.at - (T.dur ?? .32) / 2 - .02, vol: .45 });
    for (const n of ["rule1", "rule2", "rule3"]) q.push({ sfx: "tick", t: s(n) + .02, vol: .3 });
    q.push({ sfx: "pop", t: s("rule1") + .88, vol: .35 });
    for (let i = 0; i < 5; i++) q.push({ sfx: "click", t: s("rule2") + 1.0 + i * beat(1, BPM) - .02, vol: .45, pitch: 1 + i * .06 });
    q.push({ sfx: "ding", t: s("rule2") + 1.0 + 5 * beat(1, BPM), vol: .3 });
    for (let i = 0; i < 4; i++) q.push({ sfx: "pop", t: s("rule3") + .5 + i * .08, vol: .25, pitch: .9 + i * .1 });
    for (let i = 0; i < 3; i++) q.push({ sfx: "swipe", t: s("proof") + .5 + i * .1, vol: .25, pitch: 1 + i * .1 });
    q.push({ sfx: "pop", t: s("cta") + .48, vol: .4 }, { sfx: "tap", t: s("cta") + 1.58, vol: .6 }, { sfx: "impact", t: s("cta") + LOGO - .02, vol: .5, duck: true }, { sfx: "sparkle", t: s("cta") + LOGO + .05, vol: .4 }, { sfx: "chime", t: s("cta") + LOGO + .4, vol: .3 });
    return q;
  },
});
