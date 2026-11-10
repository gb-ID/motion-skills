# line-stadium example

Single-frame renderer for the combined visualizevalue × story.gaffer style (`references/style-line-stadium.md`).

```bash
cd <skill>/ && npm install                          # once
BEAT=hook    node examples/line-stadium/frame.mjs   # pitch markings + dot heatmap + counter
BEAT=trend   node examples/line-stadium/frame.mjs   # one curve drawn across the stage
BEAT=verdict node examples/line-stadium/frame.mjs   # big X turning into +, tiny accent copy
P=0.4 BEAT=trend node examples/line-stadium/frame.mjs   # P = how far the draw-on has got (0..1)
```

Output lands in `examples/line-stadium/out/`. Numbers and words are placeholders. The palette at the top is a
demo; in a film take colours from the project kit (`B.c.bg`, `B.c.fg`, `B.c.accent`).
