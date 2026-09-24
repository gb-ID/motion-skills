#!/bin/bash
# make.sh — picture, sound timeline, music bed, mix -> out/hook-reel-final.mp4
set -e
cd "$(dirname "$0")"
SK=../../plugins/social-motion/skills/social-motion
node film.mjs verify
node film.mjs render
node film.mjs cues                                            # out/cues.json from the film's cues()
# 124 bpm hype bed; it resolves on the logo: CTA starts at bar 10 (19.355 s) + 5 beats = 21.774 s
node $SK/scripts/beat.mjs out/bed.wav --style hype --bpm 124 --dur 24 --end 21.774 --grid out/beats.json
node $SK/scripts/sound.mjs out/cues.json out/hook-reel.mp4 out/hook-reel-final.mp4 --bed out/bed.wav --bed-vol .5
node film.mjs contact out/hook-reel-final.mp4                 # look at it before you ship it
