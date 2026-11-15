# Fallow demo video

`fallow-demo.mp4` is a 28-second silent demo of the Fallow app for the NASA Space Apps Challenge 2026 submission.

**The video is AI-assisted and code-drawn. It contains no AI-generated imagery.** Every screen in it is a real
screenshot of the running app; the captions, highlight rings, camera moves and closing card are drawn by the
HTML and JavaScript in `src/`. There is no audio track, no music and no sound effects.

## File facts (from ffprobe)

| | |
|---|---|
| Duration | 28.000000 s (840 frames) |
| Video | H.264, 1920x1080, 30 fps, yuv420p |
| Audio | none (silent by design) |
| Size | 13,193,006 bytes (about 13.2 MB) |
| Poster | `fallow-demo-poster.png` (the closing card, frame at 26 s) |

Check: `ffprobe -v error -show_entries format=duration,size:stream=codec_name,width,height,r_frame_rate,nb_frames video/fallow-demo.mp4`

## Storyboard (per second)

| Time (s) | Screen (real app capture) | Caption on screen |
|---|---|---|
| 0–4 | Landing page `/`, slow push in on "Rest it, or plant again?" and the globe | **Wheat on wheat again? Or a lupin or canola break crop?** (0.4–4.0) |
| 4–8.5 | `/field/overberg`, the full plate, then a slow zoom on the block | **The plate: one block of farmland, drawn from NASA and open data.** (4.2–8.4) |
| 8.5–11.2 | `/field/overberg`, camera moves to the "Annual rain · four sources" chart (441, 444, 394, 394); ring on spread 50 mm, 11.3 % | **Overberg: four rain sources agree within about 11%.** `394 to 444 mm a year` (8.6–11.1) |
| 11.2–15.5 | `/field/swartland`, same chart cross-fades in place (377, 439, 507, 325); rings on the bars, then on spread 182 mm, 48.3 % of IMERG | **Swartland: the same four sources disagree.** `325 to 507 mm a year · spread 182 mm · 48.3% of IMERG` (11.3–15.4) |
| 15.5–19.5 | `/ledger`, the Swartland rain rows: values 439, 507, 325, then a pan across the same rows to the IMERG row's status ("checked") and its source link | **Every number links to a ledger row, with its source and its status.** (15.6–19.4) |
| 19.5–24 | `/field/swartland` with the rotation analysis panel open; zoom on "No winner can be named from today's sources" and "0 of 8 metric cells have a sourced value" | **The honest result: no winner can be named.** `0 of 8 metric cells have a sourced value · model values, not measurements` (19.6–23.9) |
| 24–28 | Closing card (code-drawn): the app's logo mark and the name Fallow | **Fallow. Drawn by code from open data. AI-assisted. Not affiliated with or endorsed by NASA.** Small tag: "Model values, not measurements". Fully visible from 24.45 s, held about 3.5 s |

## Figures shown, and where each one comes from

All figures in the captions were read from the pages as captured (text dumps in `src/shots/*.txt`).

| Caption figure | On the page |
|---|---|
| Overberg 394 to 444 mm a year, within about 11% | Overberg plate: IMERG 441, Open-Meteo 444, ERA5 394, Meteomatics 394; spread 50 mm, 11.3 % of IMERG. Analysis panel: "within about 11% (394 to 444 mm a year)" |
| Swartland 325 to 507 mm a year | Swartland plate: IMERG 377, Open-Meteo 439, ERA5 507, Meteomatics 325. Same values in the ledger rows "Swartland rain, …" |
| Spread 182 mm, 48.3% of IMERG | Swartland plate: "spread 182 mm, 48.3 % of IMERG (computed)" |
| 0 of 8 metric cells have a sourced value | Analysis panel, "Plain answer" |
| No winner can be named | Analysis panel chip: "No winner can be named from today's sources" |
| Model values, not measurements | Plate, "Read this first" |

The brief for this video worded two figures slightly differently ("48 percent", "0 of 8 metric cells sourced and
scored"). The captions use the page's own wording instead ("48.3%", "have a sourced value") so that they match the
app exactly.

The video makes no claim of validation, field testing or endorsement. It shows no NASA logos, flags or mission
marks, and no people.

## How it was made

Tools: Next.js production build of this repo (`npm run build`, `npx next start -p 3100`), Playwright with
headless Chromium for the screenshots and for frame capture, ffmpeg (libx264) for encoding, ffprobe for the
checks. Fonts are the app's own (Figtree Variable, DejaVu Mono, from `node_modules`). Colours are the app's
palette from `app/globals.css`.

This is the code-only pipeline (HTML scenes, headless Chromium frame capture, ffmpeg). The brief asked for the
"brag" method with Hyperframes first; the `brag`, `brag-slim` and `motion-design` skill folders had not arrived
in `reference/skills/` when this was built, so Hyperframes was not used.

Steps to rebuild, from the repo root:

```sh
npm install && npm run build && npx next start -p 3100 &
node video/src/capture.mjs          # landing, overberg, swartland, ledger at 1920x1080 (2x pixels for sharp zooms)
node video/src/capture-extra.mjs    # Swartland with the analysis panel open
node video/src/capture-ledger.mjs   # the four Swartland rain rows of the ledger table
node video/src/render.mjs           # writes video/fallow-demo.mp4 and the poster
```

Source files:

- `src/scenes.html`: every scene, caption and camera move on one timeline; `window.seek(seconds)` draws any frame. Open it with `?t=12.5` to look at one moment.
- `src/render.mjs`: steps the timeline at 30 fps and pipes the frames to ffmpeg.
- `src/capture*.mjs`: the screenshot scripts.
- `src/shots/`: the captured screens (PNG), the page text read at capture time (TXT) and element positions (JSON).

Notes on the captures:

- Screens were captured at a 1920x1080 viewport with a device scale factor of 2, so zoomed-in views stay sharp.
- The ledger table is wider than the screen and scrolls sideways on the real page. It was captured twice (scrolled
  fully left and fully right) and the two captures are placed side by side, so the pan in the video is the same as
  scrolling the real table. Nothing in the rows was redrawn.
- The full-page captures and the full ledger screenshot that `capture.mjs` also writes are not used by the video and were left out of the repo to keep it small.
- The screens were captured from a build of this branch at commit 36df256 (15 Nov 2026). If the app changes after that, rerun the steps above.
