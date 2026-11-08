# stadium-hybrid example

Single-frame renderers for the combined story.gaffer × lo.jaditau style (`references/style-stadium-hybrid.md`).

```bash
cd <skill>/ && npm install            # once
node examples/stadium-hybrid/frame-pitch.mjs              # perspective camera
VIEW=aerial node examples/stadium-hybrid/frame-pitch.mjs  # aerial camera
node examples/stadium-hybrid/frame-object.mjs             # object close-up
HEAD_FONT=/path/Geist-Bold.ttf HEAD_FONT_BLACK=/path/Geist-Black.ttf node …   # use the kit's font
```

Output lands in `examples/stadium-hybrid/out/`. Positions are illustrative. The palette at the top of each file is
a demo; in a film take colours from the project kit (`B.c.*`).
