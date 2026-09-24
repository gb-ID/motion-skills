// layout.mjs — formats, platform safe zones, and a few grid helpers.
//
// Safe zones are where the platform UI does NOT cover your picture. The numbers are conservative
// (the union of Instagram Reels, TikTok and YouTube Shorts overlays on a 1080×1920 frame, rounded out);
// platforms move their UI, so treat them as a margin, not a spec, and check a real upload now and then.
import { clamp } from "./core.mjs";

export const FORMATS = {
  story: [1080, 1920],      // 9:16 Reels, TikTok, Shorts, Stories
  portrait: [1080, 1350],   // 4:5 feed
  square: [1080, 1080],     // 1:1 feed
  landscape: [1920, 1080],  // 16:9 YouTube, X
};
export function format(f) { if (Array.isArray(f)) return f; if (!FORMATS[f]) throw new Error(`unknown format "${f}" (${Object.keys(FORMATS).join(", ")})`); return FORMATS[f]; }

// margins in px at 1080 wide (scaled for other widths):
//   top / bottom: username, caption text, audio ticker, nav bars
//   side: breathing room from the edge
//   rail: the like / comment / share column on the right, which only starts `railTop` px down the frame
const ZONES = {
  //          top  bottom side  rail  railTop
  all:      [250, 440,   70,   180,  860],   // must survive Reels + TikTok + Shorts
  reels:    [220, 400,   70,   150,  980],
  tiktok:   [160, 440,   70,   180,  820],
  shorts:   [200, 400,   70,   160,  960],
  clean:    [90,  90,    70,   0,    99999], // no UI (feed post, embed) — also used for non-vertical formats
};
// safe(W, H, platform) -> { x, y, w, h, r, b, cx, cy, rail: { x, y } }
// x..r is symmetric (centred text stays centred); below rail.y, also keep clear of x > rail.x.
export function safe(W, H, platform = "all") {
  const vertical = H / W > 1.5, k = W / 1080, [t, b, s, rw, rt] = (vertical ? (ZONES[platform] || ZONES.all) : ZONES.clean).map((v) => v * k);
  return { x: s, y: t, w: W - 2 * s, h: H - t - b, r: W - s, b: H - b, cx: W / 2, cy: t + (H - t - b) / 2, rail: { x: W - rw, y: rt } };
}
// debug overlay: shades what the platform UI covers. `node film.mjs sheet 1,2 --safe` draws it on every tile.
export function drawSafe(ctx, W, H, platform = "all") {
  const s = safe(W, H, platform); ctx.save(); ctx.fillStyle = "rgba(255,40,80,.3)";
  ctx.fillRect(0, 0, W, s.y); ctx.fillRect(0, s.b, W, H - s.b); ctx.fillRect(0, s.y, s.x, s.h); ctx.fillRect(s.r, s.y, W - s.r, s.h);
  if (s.rail.y < s.b) ctx.fillRect(s.rail.x, s.rail.y, s.r - s.rail.x, s.b - s.rail.y);
  ctx.strokeStyle = "rgba(255,40,80,.95)"; ctx.lineWidth = 3; ctx.setLineDash([16, 10]); ctx.beginPath();
  ctx.moveTo(s.x, s.y); ctx.lineTo(s.r, s.y); ctx.lineTo(s.r, Math.min(s.b, s.rail.y)); ctx.lineTo(s.rail.x, Math.min(s.b, s.rail.y)); ctx.lineTo(s.rail.x, s.b); ctx.lineTo(s.x, s.b); ctx.closePath(); ctx.stroke();
  ctx.setLineDash([]); ctx.strokeStyle = "rgba(255,255,255,.35)"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(W / 2, 0); ctx.lineTo(W / 2, H); ctx.stroke();
  ctx.restore();
}
// split a rect into n columns / rows with a gap
export const cols = (R, n, gap = 24) => Array.from({ length: n }, (_, i) => { const w = (R.w - gap * (n - 1)) / n; return { x: R.x + i * (w + gap), y: R.y, w, h: R.h }; });
export const rows = (R, n, gap = 24) => Array.from({ length: n }, (_, i) => { const h = (R.h - gap * (n - 1)) / n; return { x: R.x, y: R.y + i * (h + gap), w: R.w, h }; });
// a point inside a rect by fractions: pt(R, .5, .3)
export const pt = (R, fx, fy) => [R.x + R.w * clamp(fx, -1, 2), R.y + R.h * clamp(fy, -1, 2)];
