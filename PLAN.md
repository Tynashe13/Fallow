# Fallow rebuild plan

Written 15 Nov 2026, before any code. Branch: `claude/happy-thompson-80lytx`.
Source of requirements: `reference/REBUILD-BRIEF.md`, with the cloud adjustments
in the task prompt (edit at the repo root, headless Chromium screenshots, commit
and push allowed on this branch only).

## What the finished app is

One Next.js app with three surfaces that all render from one fact ledger.

1. **Landing** (`/`): a code-drawn globe (Natural Earth land, bundled, no tiles)
   with the two sites marked, a search box backed by a baked gazetteer plus
   lat/lon entry, and the scope ladder. Caption: the method is global, the
   worked example is Overberg.
2. **Field view** (`/field/overberg`, `/field/swartland`): the plate, one screen,
   no scroll on desktop. A 1920x1080 stage scaled with a CSS transform. All text
   and charts are live HTML/SVG from the ledger. The centre block is the baked
   plate art (cropped from `reference/art/*.png`), because the terrain and the
   predicted outlines are not in this repo as data.
3. **Sidebar** (collapsible, on the field view): scope tier, overview, rotation
   cards, "What would change the answer" (Build A logic ported, all numbers
   computed), ARC trial, honest-resolution exhibit, trust/ledger table, sources,
   optional AI analysis. When it opens, the plate rescales into the remaining
   width so nothing is covered.
4. **Other places** (`/place?lat=&lon=`): names the tier, says plainly that no
   baked data exists for it, declines the rotation panel and names the one
   document that would be needed.

## Decisions and their reasons

| Decision | Reason |
| --- | --- |
| Centre block = baked plate art, not WebGL | The brief allows "baked art or a faithful code render". The outlines (Fields of the World predictions) are not in the repo and their host is blocked from this environment, so a code render could not show them. The baked art is the exact reference. |
| Remove the three.js scene and its packages | It drew OpenStreetMap parcels and live weather, neither of which is on the plate or in the ledger. Keeping it would show numbers with no ledger row. |
| Remove the live climate/rain/soil/terrain/fields/weather routes | They return values that differ from the baked ledger (for example POWER rain instead of IMERG). One source of numbers only. |
| Keep `lib/siteGuard.ts`, `lib/cache.ts`, rate limit, AI number check | Required. `siteGuard` and the bounded cache now protect `/api/ledger` and `/api/analyze`. |
| `/api/analyze` builds its own payload from the ledger on the server | The client no longer supplies data, so the prompt cannot be stuffed by a caller. |
| Fonts: Figtree and DejaVu Sans Mono via `@fontsource` | These match the plate. Bundled at build, no font CDN at runtime. |
| Globe: `d3-geo` + `world-atlas` land outline | Public-domain Natural Earth data from npm, bundled. No tiles. |
| No data for other places | The brief forbids fetching or inventing it. The UI says so. |

## The ledger contract

`lib/ledger/` holds one typed data file. Each row: `id`, `label`, `value`,
`display`, `unit`, `site`, `group`, `source`, `url`, `page`, `isNasa`,
`resolution`, `period`, `status` (`checked` / `unverified` / `assumed`),
`confidence`, `date`, `caveat`, `remedy`. Computed figures (spread, thirds,
trial averages, cell sizes) live in `lib/ledger/derive.ts` and each names the
rows it was computed from.

`scripts/check-numbers.mjs` loads every page state in headless Chromium,
finds every piece of visible text (and every accessible name) that contains a
digit, and fails unless it sits inside a wrapper that names existing ledger
rows (`data-led`), the rows a figure was computed from (`data-calc`), or a
structural reason (`data-struct`). Values printed straight from the ledger are
also compared character for character with the ledger. Computed figures are
not recomputed by the script, and numbers inside the baked block image are
pixels it cannot read.

`scripts/verify-sources.mjs` re-fetches what can be re-fetched (NASA POWER
climatology, IMERG via POWER daily, SoilGrids) and writes
`docs/verification.json`. A row is `checked` only if Build A marked it checked
or this script reproduced it.

## Rotation analysis: four types of data analysis (added at the user's request)

The rotation analysis, both the always-visible ledger-driven panel and the
optional AI analysis, is organised in four parts.

| Part | Question | What it may contain |
| --- | --- | --- |
| Descriptive | What do the sources show? | Rotation facts, ARC trial yields, rain from four sources, soil maps. Each with its status tag. |
| Diagnostic | Why is the answer open? | The 15 percent rule applied to rain and soil, the eight metric cells and what each lacks, source cell size against a 10 ha field. |
| Predictive | What would change the answer? | Conditional ranges computed from ledger rows (Build A logic). No forecast, no score, no winner while fewer than half the cells are sourced. |
| Prescriptive | What should be done next? | Evidence steps only: which document to open or which measurement to take for each gap, in order. Never a crop choice. |

## Steps (tsc + build green after each)

1. Dependencies, fonts, tokens, baked art crops (`scripts/bake-art.mjs`).
2. Ledger, derive functions, scope ladder, gazetteer.
3. Plate: stage scaling, left column, centre art, right column, bottom row.
   Compare against the reference at 1920x1080 by screenshot and pixel diff,
   iterate.
4. Sidebar and its sections. Mobile stacked layout, flat soil view under 600 px.
5. Landing: globe, search, scope ladder. `/place`.
6. API: `/api/ledger`, `/api/analyze` (ledger payload), `/api/status`. Security
   headers in `next.config.mjs`.
7. Scripts: number check, source verification, screenshots, network check
   (zero third-party requests; baked parts work offline).
8. Review passes: code, TypeScript, security, accessibility, evidence,
   reality check, council. Fix findings. Score five criteria with evidence.
9. `HANDOFF.md`, README update, final report.

## Risks

- Pixel match of live text over a baked reference depends on font metrics.
  Mitigation: measure the reference, diff screenshots, iterate.
- Small text when the plate is scaled to 1366x768 (about 71 percent). The
  sidebar and trust table repeat every value at full size.
- Validity is capped: 0 of 8 metric cells are sourced. The UI must show that
  cap; the score in HANDOFF.md must reflect it.
- Fields of the World licence cannot be read from here (host blocked). It will
  be recorded as not verified.

## Not in scope

Deploy, new branches, `.env` files, data for other places, any change to
`reference/`.

## Status when work stopped (15 Nov 2026, 11:35 UTC)

Done and pushed: steps 1 to 7. `npx tsc --noEmit` exit 0, `npm run build` exit 0,
`check:numbers` exit 0 (3,332 numeric text nodes, 320 exact ledger values, 0
failures), `check:network` exit 0 (0 third-party requests), `verify:sources`
written to `docs/verification.json`.

Review passes: security, TypeScript and reality check ran and their findings
were applied. The code review and accessibility passes did not complete.

Still to do, in order:

1. Retake screenshots (`npm run screenshots`) after the latest text changes and
   re-check the plate overlay at 1920x1080 and 1366x768.
2. Code review pass and accessibility audit (WCAG 2.2 AA: contrast, focus
   order, target sizes, reflow at 320 px), then fix findings.
3. Open review items not yet applied: rewrite `README.md` (it still describes
   the old live-data app); remove unused keys from `.env.example`; the `next`
   14.2.35 advisories have no 14.x fix (upgrade to 16 is a separate job).
4. Council round and honest scores for the five criteria.
5. `HANDOFF.md` and the final report.
