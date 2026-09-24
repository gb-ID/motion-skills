// new-kit.mjs — start a private brand kit from a shipped one.
//   node new-kit.mjs kopi-pagi [--from hype|clean] [--dir ./brands]
// Creates ~/.social-motion/brands/<name>/ (or <dir>/<name>/) with brand.json, fonts/, assets/ and a LICENSE.txt
// stub. Then: set colours, drop the client's static .ttf/.otf files into fonts/ and list them in brand.json,
// add logo.png, and tune "style". See references/brand-and-assets.md.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
const HERE = path.dirname(fileURLToPath(import.meta.url)), a = process.argv, opt = (k, d) => a.includes(k) ? a[a.indexOf(k) + 1] : d;
const name = a[2]; if (!name || name.startsWith("--")) { console.error("usage: node new-kit.mjs <name> [--from hype|clean] [--dir ./brands]"); process.exit(1); }
const from = opt("--from", "hype"), root = opt("--dir", path.join(os.homedir(), ".social-motion", "brands")), dir = path.join(root, name);
if (fs.existsSync(path.join(dir, "brand.json"))) { console.error(`${dir}/brand.json already exists — not overwriting`); process.exit(1); }
const J = JSON.parse(fs.readFileSync(path.join(HERE, "../brands", from, "brand.json"), "utf8")); J.name = name;
fs.mkdirSync(path.join(dir, "fonts"), { recursive: true }); fs.mkdirSync(path.join(dir, "assets"), { recursive: true });
fs.writeFileSync(path.join(dir, "brand.json"), JSON.stringify(J, null, 2) + "\n");
fs.writeFileSync(path.join(dir, "assets", "LICENSE.txt"), "One line per file: file — source — licence — date — who approved\n");
console.log(`created ${dir}\n  brand.json (from "${from}"), fonts/, assets/\n  use it: loadBrand("${name}")  or  BRAND=${name} node film.mjs render`);
