# Handoff: interaction model build (15 Nov 2026, evening run)

Branch `claude/happy-thompson-80lytx`. Commits this run: `36df256`, `1219ff1`
(plus this handoff). Two other commits (`942aa12`, `27a8599`, demo video) landed
on the branch during the run and were rebased onto cleanly. Nothing here is
validated by a grower or a human reviewer.

## What was added

| Item | Files | Status |
|---|---|---|
| 1. Shared overlay (sheet) | `components/Overlay.tsx`, `app/interact.css` | Done. Native `<dialog>` + `showModal()`: focus trap, inert background, Esc, focus return to the opener. Also: backdrop click closes, 44 px close button, `aria-modal`, `aria-labelledby`, scroll lock (`html.scroll-lock`), reduced motion. Centre sheet on desktop, bottom sheet with grabber under 600 px. |
| 2. Four-mode switcher + Evidence | `components/side/SideModes.tsx`, `components/side/Sidebar.tsx` | Done. Segmented control: Descriptive, Diagnostic, Predictive, Prescriptive (keys 1 to 4) and Evidence (Trust, Sources, optional AI, as accordions). Keys are ignored in inputs/selects/textareas, with Alt/Ctrl/Meta, and while a sheet is open. A key press opens the sidebar. Each mode has "Open full view", which shows the same section component in the sheet. Hash links (`#predictive`, `#trust`, `#sources`, `#ai`) select the right mode. Inactive panels use `hidden` but stay in the DOM, so the number check still sees every figure. |
| 3. Header sheets | `components/FieldShell.tsx`, `app/field/[slug]/page.tsx` | Done. "Verdict notice" opens the existing `Answer` section. "Sources and citations" opens `Sources` plus `StatusKey` for the site's ledger rows, with a link to `/ledger`. No new copy. |
| 4. Soil-layer hotspots | `components/plate/SoilHotspots.tsx`, `components/plate/BlockFigure.tsx` | Done. Six buttons over the baked image (0–5 … 100–200 cm), `aria-pressed`, and a small inspector showing clay, sand and pH from the ledger (`<N>`), the source, resolution and period (`<Led>`), and the `RowTag` status badge (all `unverified`). Esc or the close button closes it and returns focus to the marker. No camera, no WebGL. Marker positions are hand-placed on the image (Swartland offset 1.4 % lower). They are markers, not measurements, and the code comment says so. |
| 5. Design pass | `app/interact.css` | Done, restrained. 8 px spacing tokens (`--sp-1..4`), 44 px targets on the new controls, translucent sheet/inspector with `backdrop-filter` only inside `@supports` (solid white otherwise), a short spring-like curve `cubic-bezier(0.32,0.72,0,1)`, a press scale, focus rings, and handling for `prefers-reduced-motion`, `prefers-reduced-transparency`, `prefers-contrast: more` and `forced-colors`. The toolbar now scales with the plate. The existing font stack already falls back to `system-ui, -apple-system`. No Apple font files, logos or assets. Fallow palette unchanged. |

`PLAN.md` gained an addendum describing the above. `scripts/screenshots.mjs` now also captures the mode, sheet and soil-layer states.

## Commands and exit codes (final build)

- `npx tsc --noEmit`: 0
- `npm run build`: 0
- `node scripts/check-numbers.mjs`: 0 (3376 numeric text nodes, 320 exact ledger values, 0 failures)
- `node scripts/check-network.mjs`: 0 (113 requests, 0 third-party)
- `node scripts/screenshots.mjs`: 0 (33 files)

Playwright came from the preinstalled global (`NODE_PATH=/opt/node-tools/node_modules`).

## Screenshots (`docs/screenshots/`, each at 1920x1080, 1366x768 and 390)

- `field-overberg-*`, `field-swartland-*`: default plate
- `field-overberg-mode-predictive-*`: key 3 pressed
- `field-overberg-verdict-sheet-*`, `field-overberg-sources-sheet-*`: header sheets (bottom sheet at 390)
- `field-overberg-soil-layer-*`, `field-swartland-soil-layer-*`: inspector open
- `field-overberg-analysis-*`, `landing-*`, `ledger-*`, `place-other-*`: regenerated

Layout checks done in Chromium: at 1920x1080 and 1366x768 `scrollWidth`/`scrollHeight` equal the viewport (one screen, no scroll). At 390, `scrollWidth` is 390 (no horizontal overflow). A pixel diff against the previous desktop screenshots showed one regression from this work: my `.plain` class collided with an existing plate class and pushed "Fields of the World · computer-predicted" into the soil heading. I renamed it to `.side-plain` and re-checked the crop. The remaining desktop pixel differences are the two new toolbar buttons and the six markers. The ledger-page difference comes from a copy change in an earlier commit, not from this run.

## Self-review

- **Code:** sheet content mounts only while open, so section components are not duplicated in the DOM and no duplicate ids appear. Esc is layered: an open sheet takes it first, then the inspector (which calls `preventDefault` and stops propagation), and only then does the sidebar close. Hotkey handling reads modes through a ref, so the listener is attached once.
- **Accessibility:** the native dialog handles the focus trap and restore. The switcher is a labelled group of `aria-pressed` buttons with `aria-keyshortcuts`. The inspector is a labelled `aria-live="polite"` region. The scrollable sheet body is focusable. Contrast and forced-colors fallbacks were added.
- **Security:** no new network requests (network check 0). No `dangerouslySetInnerHTML` and no URLs in the new files. `next.config.mjs` and its CSP were not touched in this run. No `.env` files were read.

## Not done or known weaknesses

- No mockup file exists in `reference/` (only the baked plates, Build A and the skill notes), so the interaction model follows the written task description, not a visual mockup.
- At 390 px the six 44 px marker hit areas overlap slightly (markers about 31 px apart). The flat view is the default under 600 px and lists the same values. Not fixed.
- The bottom sheet has no swipe-to-dismiss gesture. It closes with the button, the backdrop or Esc.
- Marker positions are hand-placed by eye. If the baked art is re-rendered they must be re-placed.
- The sheets were not tested with a real screen reader (VoiceOver/NVDA). Only keyboard and Chromium behaviour were checked.
- No council or score pass was run this time.
