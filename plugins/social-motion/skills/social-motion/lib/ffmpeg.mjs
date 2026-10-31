// ffmpeg.mjs — find an ffmpeg binary wherever the skill runs (a Mac with Homebrew, Claude Code, claude.ai / Cowork
// sandboxes that may not ship one). Order: $FFMPEG, `ffmpeg` on PATH, the binary inside the imageio-ffmpeg pip
// package (install it with `pip install imageio-ffmpeg` when there is no system ffmpeg; it needs no admin rights).
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

let cached = null;
export function ffmpegPath() {
  if (cached) return cached;
  if (process.env.FFMPEG && fs.existsSync(process.env.FFMPEG)) return (cached = process.env.FFMPEG);
  const exe = process.platform === "win32" ? "ffmpeg.exe" : "ffmpeg";
  for (const d of (process.env.PATH || "").split(path.delimiter)) { const f = path.join(d, exe); if (d && fs.existsSync(f)) return (cached = f); }
  for (const py of ["python3", "python"]) {
    try { const f = execFileSync(py, ["-c", "import imageio_ffmpeg as m; print(m.get_ffmpeg_exe())"], { stdio: ["ignore", "pipe", "ignore"] }).toString().trim(); if (f && fs.existsSync(f)) return (cached = f); } catch {}
  }
  throw new Error("ffmpeg not found. Install it (brew install ffmpeg | winget install Gyan.FFmpeg | apt install ffmpeg) or run: pip install imageio-ffmpeg");
}
// duration of a media file in seconds, without ffprobe (not every ffmpeg bundle ships it)
export function mediaDuration(file) {
  let out = "";
  try { execFileSync(ffmpegPath(), ["-hide_banner", "-i", file], { stdio: ["ignore", "pipe", "pipe"] }); } catch (e) { out = String(e.stderr || ""); }
  const m = out.match(/Duration:\s*(\d+):(\d+):([\d.]+)/); if (!m) throw new Error("could not read the duration of " + file);
  return +m[1] * 3600 + +m[2] * 60 + +m[3];
}
