// brand.mjs — the brand kit. One JSON file holds colours, fonts, logo and corner radius; every
// component reads from it, so a client change is one file, not a hunt through the film.
//
//   const B = await loadBrand("brand.json");           // a file path…
//   const B = await loadBrand("mgm");                  // …or a kit NAME, looked up in order:
//        ./brands/mgm/brand.json   (the project)
//        ~/.social-motion/brands/mgm/brand.json   (your private kits: client fonts/logos never go in a public repo)
//        <skill>/brands/mgm/brand.json   (kits shipped with the plugin: "hype", "clean")
//   const B = await loadBrand();                       // the default kit
//   ctx.font = B.font("display", 160);                 // '400 160px "Anton"'
//   B.c.accent, B.c.bg, B.c.fg …                       // colours
//   B.logo                                             // an Image (png / svg) or null
//
// brand.json (every key optional; missing keys fall back to DEFAULT_BRAND):
// { "name": "Kopi Pagi",
//   "colors": { "bg": "#101014", "surface": "#1C1C24", "fg": "#FFFFFF", "muted": "#9C9CAB",
//               "accent": "#FF5A36", "accent2": "#FFD23F", "accent3": "#3DDC97" },
//   "fonts":  { "display": { "family": "Anton", "files": ["Anton-Regular.ttf"], "weight": 400, "upper": true },
//               "head":    { "family": "Poppins", "files": ["Poppins-Black.ttf"], "weight": 900 },
//               "body":    { "family": "Poppins", "files": ["Poppins-SemiBold.ttf"], "weight": 600 },
//               "mono":    { "family": "Space Mono", "files": ["SpaceMono-Bold.ttf"], "weight": 700 } },
//   "logo": "logo.png", "radius": 28,
//   "style": { "plate": "mesh", "texture": "dots", "blobs": ["accent", "#5B3DF5"], "anim": "rise", "hook": "slam",
//              "highlight": "marker", "transition": "whip", "transitionDur": 0.32, "grain": 0.05, "vignette": 0.35 } }
// `style` is the look in numbers: plate() in fx.mjs, kinetic() and the template read it, so a kit carries its motion too.
// Font files are looked up next to brand.json first, then in the skill's assets/fonts/.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { GlobalFonts, loadImage } from "./core.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const FONT_DIR = path.join(HERE, "../assets/fonts");

export const DEFAULT_BRAND = {
  name: "Brand",
  colors: { bg: "#111116", surface: "#1D1D26", fg: "#FFFFFF", muted: "#9C9CAB", accent: "#FF5A36", accent2: "#FFD23F", accent3: "#3DDC97", ink: "#111116" },
  fonts: {
    display: { family: "Anton", files: ["Anton-Regular.ttf"], weight: 400, upper: true },
    head: { family: "Poppins", files: ["Poppins-Black.ttf"], weight: 900 },
    body: { family: "Poppins", files: ["Poppins-SemiBold.ttf"], weight: 600 },
    light: { family: "Poppins", files: ["Poppins-Regular.ttf"], weight: 400 },
    mono: { family: "Space Mono", files: ["SpaceMono-Bold.ttf"], weight: 700 },
  },
  logo: null, radius: 28,
  style: { plate: "mesh", texture: "dots", blobs: ["accent", "#5B3DF5"], blobAlpha: .4, anim: "rise", hook: "slam", highlight: "marker", transition: "whip", transitionDur: .32, grain: .05, vignette: .35 },
};
import os from "node:os";
const SKILL_BRANDS = path.join(HERE, "../brands");
// a kit name -> the first brand.json found in the project, the user's private kits, then the skill's kits
export function findBrand(name) {
  const c = [path.resolve("brands", name, "brand.json"), path.join(os.homedir(), ".social-motion", "brands", name, "brand.json"), path.join(SKILL_BRANDS, name, "brand.json")];
  return c.find((f) => fs.existsSync(f));
}

const registered = new Set();
function register(file, family) {
  const key = file + "|" + family; if (registered.has(key)) return true;
  if (!fs.existsSync(file)) return false;
  GlobalFonts.registerFromPath(file, family); registered.add(key); return true;
}

export async function loadBrand(src) {
  let J = {}, dir = process.cwd();
  if (typeof src === "string") {
    const file = fs.existsSync(src) && fs.statSync(src).isFile() ? src : fs.existsSync(path.join(src, "brand.json")) ? path.join(src, "brand.json") : findBrand(src);
    if (!file) throw new Error(`brand: no kit "${src}" (looked in ./brands, ~/.social-motion/brands, the skill's brands/)`);
    J = JSON.parse(fs.readFileSync(file, "utf8")); dir = path.dirname(path.resolve(file)); }
  else if (src) J = src;
  const B = { ...DEFAULT_BRAND, ...J, colors: { ...DEFAULT_BRAND.colors, ...(J.colors || {}) }, fonts: { ...DEFAULT_BRAND.fonts, ...(J.fonts || {}) }, style: { ...DEFAULT_BRAND.style, ...(J.style || {}) } };
  if (J.grain != null && !(J.style && J.style.grain != null)) B.style.grain = J.grain;
  for (const [role, f] of Object.entries(B.fonts)) {
    let ok = false;
    for (const file of f.files || []) { const p = [path.resolve(dir, file), path.join(FONT_DIR, file)].find((x) => fs.existsSync(x)); if (p && register(p, f.family)) ok = true; }
    if (!ok && !GlobalFonts.has(f.family)) console.warn(`brand: font "${f.family}" (${role}) not found — text will fall back to a system font. Put the .ttf next to brand.json.`);
  }
  let logo = null;
  if (B.logo) { const p = path.resolve(dir, B.logo); if (fs.existsSync(p)) logo = await loadImage(fs.readFileSync(p)); else console.warn("brand: logo not found:", p); }
  const c = B.colors;
  return {
    ...B, c, logo,
    // CSS font string for a role at a size (px). weight overrides the role's weight.
    font(role = "body", size = 48, weight) { const f = B.fonts[role] || B.fonts.body; return `${weight ?? f.weight ?? 400} ${Math.round(size * 10) / 10}px "${f.family}"`; },
    upper(role) { return !!(B.fonts[role] || {}).upper; },
    // the palette as a cycling list, for charts and confetti
    cycle: [c.accent, c.accent2, c.accent3, c.fg].filter(Boolean),
    dir,                                              // the kit's folder (assets next to brand.json resolve from here)
    // a colour by role name ("accent") or a literal hex
    color(v) { return c[v] || v; },
  };
}
