# transcribe.py — word-level timestamps for a voice-over, on your own machine (no API key).
#   pip install faster-whisper
#   python transcribe.py vo.mp3 vo.json [--model small] [--lang id]
#   node words.mjs vo.json words.json --offset <the --voice-at value>
# The first run downloads the model (tiny ~75 MB, small ~460 MB, medium ~1.5 GB). "small" handles Indonesian
# and English well; use "medium" for mixed-language or noisy audio. Always proof-read captions: names, brand
# names and slang get misheard.
import json, sys
from faster_whisper import WhisperModel
args = sys.argv[1:]
if len(args) < 2: sys.exit("usage: python transcribe.py vo.mp3 vo.json [--model small] [--lang id]")
opt = lambda k, d: args[args.index(k) + 1] if k in args else d
model = WhisperModel(opt("--model", "small"), device="cpu", compute_type="int8")
segs, info = model.transcribe(args[0], word_timestamps=True, language=opt("--lang", None), vad_filter=True)
out = {"language": info.language, "segments": [{"start": s.start, "end": s.end, "text": s.text,
       "words": [{"word": w.word.strip(), "start": w.start, "end": w.end} for w in (s.words or [])]} for s in segs]}
json.dump(out, open(args[1], "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print(f"wrote {args[1]}: {sum(len(s['words']) for s in out['segments'])} words, language {info.language}")
