# Assignment: Audit St. Lawrence River locating geometry

Status: completed

## Brief — Lead completes before dispatch

- Objective and user-visible outcome: independently determine why St. Lawrence River geometry is marked incomplete and recommend a source-backed, geographically honest visible and interaction representation that can support normal Guided introduction and retrieval.
- Why delegation is more efficient than direct implementation: this is a bounded GIS/data-pipeline audit whose independent assessment will reduce the risk of accepting a convenient but misleading line. The Lead retains the architecture, implementation, visual review, integration, testing, and commit.
- Specialist role; selected supported model/effort and reason: UI / UX with GIS/map emphasis; `gpt-5.6-terra`, high reasoning, using a compact brief for a focused source and rendering audit.
- Agent/task identifier after dispatch: `/root/st_lawrence_geometry_audit`.
- Checkout/worktree path, branch, base revision, and pre-existing dirty files: shared checkout `/Users/ryanbarnhill/Documents/mappa-mundi`, branch `feature/evidence-driven-learning-foundation`, base `f24f1be`; only this handoff file should be dirty at dispatch.
- Relevant files, contracts, domain documentation, and concise context: inspect `assets/data/physical-features/proof-sheet-rivers.geojson`, `assets/data/physical-features/us-river-cartographic-repairs.json`, `scripts/build-us-proof-sheet-rivers.mjs`, `scripts/validate-proof-sheet-rivers.mjs`, `scripts/audit-us-river-source-geometry.mjs`, `src/atlas/united-states-atlas-data.js`, `assets/maps/data/us-physical-rivers.json`, river loading/rendering/hit testing in `src/maplibre-poc.js` and `src/maplibre/maplibre-activity-runner.js`, and `docs/geographic-visualization-principles.md`.
- Allowed files/changes: read-only audit. The specialist may fill in this file's Handoff section. Do not modify application code, data, tests, or other documentation.
- Exclusions and behavior/data that must be preserved: do not fabricate coordinates; do not change pacing, scoring, canonical evidence, mastery, activities, cameras, or unrelated river geometry; do not fetch or add a new external source without identifying why the established source/pipeline is insufficient.
- Acceptance criteria: identify the existing feature geometry and metadata, its exact defect, the source/build/validation path, cross-border and scope conventions, visible-line and hit-corridor behavior, a recommended U.S-learning scope, and the smallest trustworthy implementation path with visual/test criteria.
- Required tests and manual/browser checks; environment constraints: read-only probes and existing validators are encouraged. No browser run is required for the audit. Record commands and results.
- Return control to the Lead; no further delegation or unrelated edits: required.

## Handoff — specialist completes

- Result and acceptance criteria met/unmet:
  - Audit complete; no app, data, test, or domain-document files changed. The source defect is confirmed. The only checked-in St. Lawrence feature is Natural Earth global River record `1159114637` (`rivernum` 23): one 15-vertex, 106.5 km LineString from `[-75.792, 44.497]` to `[-74.713, 44.999]`, bounded by `[-75.792, 44.497, -74.713, 45.010]`. It represents only the western New York/Ontario reach, not a truthful representation of the named river for locating practice.
  - The bundled-source search found exactly that one global record (source name `Saint Lawrence`, English name `St. Lawrence`) and no `Lawrence`/`Laurent` record in the bundled North America supplement. Thus the established Natural Earth inputs cannot supply the missing eastern/Canadian continuation; this is a source-coverage issue, not a build-selection omission.
  - Metadata correctly classifies it as `incomplete`, `crossesInternationalBorder: true`, with the reason that it is only a short western segment. The inventory therefore excludes it from Guided (`33/34` supported) even though the ordinary U.S. Rivers activity and its five-member `central-eastern-rivers` Memory Trail section still list it. The existing New York relationship is the only curricular relationship.
  - Cross-border convention: retain the U.S.-curriculum relationship with New York, while visually representing the whole named river from the Lake Ontario outlet through the New York/Ontario boundary reach and onward through Canada to the Gulf of St. Lawrence. Do not country-clip it. This follows the current Guided contract: foreign visual geography creates no foreign relationship or evidence. A U.S.-only line would have to be explicitly `scope-limited`; it should not replace a full named-river representation or imply that the river ends at the border.
  - Rendering/hit-testing: normal MapLibre activity loading passes the unmodified proof-sheet geometry to `river-lines`; `getRiverLineGeoJson` includes every active river target and `getTargetShapeFeature` copies its source geometry. The visible line uses the activity’s 3.5 px normal / 7 px highlight widths, and `river-hit-line` has a 40 px invisible corridor. If MapLibre omits the nearly transparent layer from a query, the fallback uses point-to-segment distance with at least a 20 px desktop or 26 px coarse-pointer radius. Consequently the current short line is both the only visible and only tappable St. Lawrence geography. The cartographic-repairs file is intentionally dev-preview-only and is not used by the normal runner; extending this river there would be inappropriate.
  - Camera caveat: despite the Guided document’s feature-first wording, the current implementation resolves Lower 48 rivers to the fixed `[-97.76220, 39.30636]`, zoom `4.1407` camera, not source bounds. Existing browser tests deliberately zoom out for edge rivers. A full St. Lawrence therefore needs an intentional cohort/feature camera review; merely changing the source would make much of the full course initially off-frame.

- Files changed and important implementation decisions:
  - Only this handoff file. No implementation decisions were made; recommended path follows.
  - Smallest trustworthy path: obtain and vet one authoritative, appropriately licensed line source that explicitly covers the whole principal course. Preserve its raw provenance and use the build pipeline to emit the same stable `st-lawrence-river` feature ID; do not draw connectors or extrapolate coordinates. Add source-specific coverage assertions for the Lake Ontario outlet, the international boundary reach, and the Canadian downstream continuation, rather than accepting the current broad bounds-only check. Mark the atlas geometry `full` only after that evidence passes.
  - Extend `audit-us-river-source-geometry.mjs` to include St. Lawrence and report all matching source records, coverage bounds, endpoints, and any unrepresented gaps. The current audit covers only Colorado, Columbia, and Mississippi, so it cannot guard this known defect. Adapt `build-us-proof-sheet-rivers.mjs` and `validate-proof-sheet-rivers.mjs` to record and validate the new source provenance instead of treating Natural Earth `1159114637` as sufficient.
  - Re-enable Guided only with a bounded river cohort. To preserve the existing Memory Trail section and progress, leave its five target IDs intact, but make Guided groups spatially coherent: central `Mississippi/Missouri/Arkansas` (3) and eastern `Ohio/St. Lawrence` (2). Add and visually approve a dedicated eastern-rivers camera covering both retrieval targets and the required Canadian continuation. Do not silently change canonical concept IDs, New York relationship evidence, or ordinary Journey progress.

- Exact test commands, outcomes, and checks not run or blocked:
  - `node scripts/validate-proof-sheet-rivers.mjs` — passed: `Validated 8 verified U.S. proof-sheet river features with 1 documented deferral.` This validates source identity and broad containment, but does not assert a full St. Lawrence extent.
  - Read-only DBF/SHP candidate probe across `tools/source-data/natural-earth/extracted/global` and `north-america` — global: one matching record `1159114637`; supplement: zero matches.
  - `node scripts/check-guided-learning-physical-feature-orchestration.mjs` — passed: `34 audited, 33 orchestrated, 1 geometry-deferred`.
  - `node scripts/audit-us-river-source-geometry.mjs` — completed, but St. Lawrence is absent from its three-river specification; this is a coverage gap to correct.
  - No browser run: the assignment did not require one and no source/renderer change was made.

- Risks, remaining issues, and proposed out-of-scope changes:
  - Do not use the current 106.5 km segment as a normal Guided locating target, classify it as `full`, or bridge it with display-only coordinates. Each would conflict with the geographic-consistency requirement and make the hit corridor reward an incomplete mental map.
  - A source replacement can widen the current practice window substantially. The Lead should visually review desktop and mobile teaching/retrieval with labels hidden before retrieval, verifying that the new camera gives orientation without revealing the answer and that the whole corridor remains tappable after pan/zoom.
  - Documentation currently says Guided physical views are feature-first, while the implemented default is a fixed Lower 48 camera. Update the affected Guided documentation only if the integration changes that behavior or needs a St. Lawrence override.

- Documentation updated or needing Lead update:
  - This handoff records the audit. After a source-backed integration, update `docs/guided-learning-orchestration-v1.md`, `docs/testing.md`, and `docs/engineering-state.md` to replace the deferral/counts and record the actual validation; update the geographic-visualization guidance only if a new cross-border representation rule is introduced.

- Integration instructions if using a separate checkout (commits/patch, dependencies):
  - Shared checkout; no patch or dependency changes.

## Acceptance — Lead completes

Accepted 2026-09-08. The Lead independently confirmed the Natural Earth coverage defect, inspected the specialist's source and rendering findings, and used them as an audit rather than an implementation patch. The integrated solution uses a checked-in OpenStreetMap relation extract with explicit provenance, connected-course and geographic-window validation, a responsive eastern-rivers camera, and unchanged canonical/New York evidence. Focused source, orchestration, evidence, and desktop/mobile browser checks passed; complete results are recorded in [`docs/testing.md`](../testing.md).
