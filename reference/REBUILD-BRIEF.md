# Fallow rebuild brief (for the 10:25 Sun 15 Nov 2026 job, run by a Fable 5.2 subagent)

## Goal
Rebuild Fallow as ONE coherent app that maximises the NASA Space Apps judging criteria (aim: honest 90+ on style, functionality, validity, creativity, relevance, presentation) and the hackathon objective. Honest means: never claim more than the sources support. The score target is a goal, not a licence to overclaim. Validity stays capped until a human opens sources; the build must make that cap visible, not hide it.

## Hard rules (every agent)
- No commit, no push, no deploy, no outbound contact. No Co-Authored-By lines.
- Never read or print .env.local or keys.
- Work in a COPY: `rsync -a --exclude node_modules --exclude .next ~/development/fallow-next/ ~/development/fallow-rebuild/` then npm install there. Do not edit ~/development/fallow-next or /mnt/c/Users/HP/Documents/fallow-review (Build A) or the plan docs. Back up anything you overwrite into the scratchpad.
- Runtime third-party requests: none from the browser in the final build (self-hosted fonts, baked data, no live map tiles, no geocoder). Server-side live calls only if the baked fallback works offline.
- Every number shown must come from a ledger row with source, status (checked / unverified / assumed no source found), and a remedy. A number with no row is a build error.
- Nothing unsourced may be presented as sourced. Keep the existing labels: 'our threshold, not from a source', 'assumed, no source found', canola cells 'unverified', 'predicted' next to every field outline with its coverage figure (Overberg 208 of 389 at 10 ha and larger; Swartland 210 of 492).
- Licence: the plate credits Fields of the World as CC-BY-4.0. Verify on the dataset's own page if reachable, keep the attribution visible, and record the result honestly (verified / not verified) in the ledger. Do not bundle outlines for places other than the two sites.

## Design target (non-negotiable)
Match the baked plates EXACTLY in layout, type and proportion:
- References: /mnt/c/Users/HP/Documents/fallow-review/src/art/fallow-profile-overberg-june.png and fallow-profile-swartland-june.png (1920x1080 composition; read both images).
- The field view is ONE SCREEN, NO SCROLL at desktop (scale the whole plate with CSS to fit the viewport, preserving the 16:9 composition and the same relative font sizes, panel positions, hairline rules, colours and mono labels). Left column: the air above + soil wetness + annual rain four sources. Centre: the 3D terrain block with six soil horizons on the cut faces, sun arc, field outlines. Right: sun note, NDVI 'no data', terrain note, soil-by-depth table. Bottom: topsoil two maps, legend, read this first, credits line.
- The 3D block and soil profile must look like the baked plate (use the baked terrain/soil art or a faithful code render; compare side by side by screenshot and iterate until visually indistinguishable at 1920x1080 and 1366x768). Flat view default under 600 px; mobile may scroll.
- Skills to load: brandkit (brand system for Fallow: keep the existing green/ink palette and logo), impeccable, high-end-visual-design, apple-design, design-taste-frontend, accessibility, frontend-design. Use screenshots (Windows Chrome headless, see earlier method) to verify.

## Product structure
1. Landing: a globe (self-hosted, no third-party tiles; code-drawn or baked) with two marked sites (Overberg = worked example, Swartland = uncertainty example) and a one-line caption that the method is global and the worked example is Overberg.
2. Search: a baked gazetteer of major places plus lat/lon entry, prefilled to Overberg. No third-party geocoder. Unknown places resolve to the nearest tier below.
3. Scope ladder shown in the sidebar header (tier named always): Overberg/Swartland = full; other South Africa and anywhere = coarse rain/soil/terrain only where baked data exists, and the rotation panel declines in plain words and names the one document that would be needed. Do not fetch or invent data for other places; if no baked data exists, say so.
4. Collapsible sidebar: overview, rotation cards, 'What would change the answer' (port the Build A section logic: all numbers computed from data), trust/ledger panel, sources. Selecting a field outline updates the sidebar (decision unit sentence: 'the rotation comparison is made for this place; this outline is where the decision is taken').
5. Rotation answer: 'no winner can be named' while fewer than half the metric cells are sourced (currently 0 of 8). No score, no ranking colour. Show the disagreement rule (15 percent spread, labelled ours).
6. Honest-resolution exhibit: show that rain/soil source cells are far larger than a 10 ha field (resolution figures must be read from dataset docs; if not verified, label unverified).
7. Fact ledger: ONE typed data file (value, unit, source, URL, page, status, confidence, date, remedy). The UI, the sidebar, trust panel and 'what would change' render from it. Add a test/script that fails if the UI contains a number with no ledger row.
8. Keep Build B hardening (lib/siteGuard.ts, cache bound, rate limit, AI number check). AI analysis is optional and clearly labelled; page must be complete with it off. Add a deterministic panel (the ledger-driven summary) that stays visible regardless.

## Process (must follow)
1. Plan first (ecc:plan style), written to ~/development/fallow-rebuild/PLAN.md. Then build in small steps, tsc + build green at each step.
2. Delegate sub-work to Opus/Sonnet agents where useful, and verify their claims yourself (read the files, run the checks). Do not trust a report without checking.
3. After building, run: ecc:code-reviewer, ecc:typescript-reviewer, ecc:security-reviewer, Accessibility Auditor, Evidence Collector (screenshots at 1920x1080, 1366x768, 390), Reality Checker, then `ecc:council` on the finished result and score the five criteria honestly. Fix findings (surgical). Re-score.
4. Checks: `npx tsc --noEmit`, `npm run build` exit 0; zero third-party requests in the browser network list (verify with Chrome headless or chrome-devtools); works with network blocked for the baked parts.
5. Write ~/development/fallow-rebuild/HANDOFF.md: what changed, honest score per criterion with evidence, what still needs a human (open the rotation guideline PDFs for the 8 metric cells, run and publish the 30-outline spot-check, grower review, FTW licence reading), what was not done.

## Report back
Files changed, commands + exit codes, screenshot paths (desktop 1920x1080, 1366x768, 390), honest scores, failures, skipped items. No claims of 90+ unless the evidence supports each criterion.
