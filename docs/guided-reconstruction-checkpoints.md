# Guided Reconstruction checkpoints

Implemented on `feature/evidence-driven-learning-foundation` following an independent audit of clean base `66509f0` (2026-09-05).

## Audit and decision

The prior handoff was confirmed against the code: Guided had one New England checkpoint requiring six states; `us-states-01` teaches five and Vermont belongs to `us-states-02`. Later Guided checkpoints were absent. Target-family filtering excluded Reconstruction, and primary Evidence-Driven Continuation skipped the child coordinator entirely when it selected a political section. Untargeted selection already preferred eligible Reconstruction over new physical introductions. Standalone regional tests deliberately accepted a uniformly translated correct assembly. Section 11 contains Alaska/Hawaii, but neither the regional nor Lower 48 Reconstruction layouts support them.

The fix follows the existing Guided sections instead of changing their content or learner progress. Checkpoint 1 assesses the first five states; checkpoint 2 introduces Vermont alongside its actual section peers. These are Guided regional practice groups, not the standalone regional partitions. The original `us-guided:rebuild-new-england` completion ID remains valid for existing learners; its Guided display now describes the first five-state group. Standalone New England still contains six states.

## Authored sequence

`src/guided-reconstruction.js` owns the bounded checkpoint definitions. A content regression compares each group directly with its existing state-section JSON. Each checkpoint requires every new state's `state:<id>` item to appear in persisted Guided Learning `introducedItemIds` and, from checkpoint 2, submission of the preceding checkpoint. These state introductions are written only after Guided teaching/results; retained canonical state evidence from Journey or other practice cannot substitute for them after a Guided-only reset. Submission remains non-gating: an imperfect or empty submission completes that checkpoint, but does not declare mastery. Previously tested states subsequently appear at their canonical positions as locked teaching context.

| Checkpoint / Guided section | New states | Locked prior states |
| --- | --- | --- |
| 1 / 01 | ME, NH, MA, RI, CT | 0 |
| 2 / 02 | VT, NY, NJ, PA, DE | 5 |
| 3 / 03 | MD, VA, WV, NC, SC | 10 |
| 4 / 04 | GA, FL, AL, MS, LA | 15 |
| 5 / 05 | MI, OH, IN, KY, TN | 20 |
| 6 / 06 | WI, IL, IA, MO, AR | 25 |
| 7 / 07 | MN, ND, SD, WY, NE | 30 |
| 8 / 08 | KS, OK, TX, CO, NM | 35 |
| 9 / 09 | UT, AZ, NV, CA | 40 |
| 10 / 10 | MT, ID, WA, OR | 44 |

This covers each contiguous state exactly once as a new Reconstruction target. Alaska/Hawaii remain deferred; no Alaska/Hawaii layout, separate regional engine, learner store, or Journey migration was added.

## Scoring and UI boundary

Checkpoint 1 uses the existing translation-tolerant evaluator. From checkpoint 2, `evaluateGuidedMapReconstruction` uses a fixed geographic frame with the prior locked states as references for relative vectors, adjacency, and overlap. A new cluster shifted away from that frame is not normalized back into place. Existing distance/overlap thresholds and placement statuses remain in use; this is not pixel-perfect grading.

Only new states exist in the mutable session, bank, result counts, and returned evaluation placements. Anchors live in a separate noninteractive SVG layer and geometry references. Reset, selection, dragging, and correction cannot move them. All prior shapes share the new targets' coordinate frame; the initial viewport fits all prior and incoming states (see the navigation update below). Locked labels use state abbreviations to reduce crowding. No new-state outline is shown before submission.

The existing canonical adapter remains unchanged: `state-reconstruction:<id>` concepts, `spatial-reconstruction` skill, and `map-reconstruction` source mode. `well-placed` means `correct`, `close` means `partial`, `misplaced` means `incorrect`, and `unplaced` means `skipped`. Locked context emits no events. Checkpoint completion and child reload use the existing orchestration/child-launch stores; reopening a completed child emits no new evaluation. An incomplete child is rehydrated only while its checkpoint remains the currently eligible orchestration block, so a reset or prerequisite mismatch cannot revive stale Reconstruction work.

## Routing

Eligible checkpoints are considered even for targeted state/capital, physical-family, and Connection entries. Primary Learn now consults the child coordinator for political targets too, while preserving an existing active Guided session and durable child resume. Active eligible children and in-progress physical sequences retain their existing precedence; checkpoints precede newly selected physical introductions and targeted Connections. When no checkpoint is eligible, political targeting returns to its existing section planner without launching an unrelated physical family.

Inspector traces retain the requested family and report `targetedNeedSatisfied: false` when a Reconstruction checkpoint is chosen; completing it does not falsely claim completion of a different skill. The all-objectives-ready standalone exploration/capstone route remains unchanged.

## Validation

- `scripts/check-guided-reconstruction-checkpoints.mjs`: every section/group, Guided state-introduction prerequisites, prerequisite chain, targeted/untargeted reachability, retained-evidence reset behavior, all ten real-geometry layouts, target-only canonical evidence, legacy completion preservation, and 48-state coverage.
- `scripts/check-guided-reconstruction-evaluation.mjs`: fixed-frame translation rejection within the workspace, correct placements, anchor overlap/adjacency, missing targets, input immutability, and standalone translation preservation.
- Existing orchestration, physical-feature, and standalone Reconstruction checks retain coverage of mode behavior and interleaving.
- `tests/e2e/guided-reconstruction.spec.js`: primary Learn entry for checkpoints 1, 2, and 10; new-piece bank and locked context; keyboard/reset immutability; submission/evidence boundaries; completed-child reload and return; standalone six-state New England. Runs on desktop and mobile Chromium.

See `engineering-state.md` for the final integrated test record. Real-device touch, Safari, narration quality, and a pedagogical efficacy study are outside this change.

## Map appearance and navigation (2026-09-05)

Reconstruction and the main political map share `src/maplibre/political-map-style.js`: the original pastel palette and full GeoJSON feature-order color assignment. Prepared pieces carry a display color without changing their geometry. Locked states, bank thumbnails, placed pieces, and drag previews use that assignment, with the main map's water background, white boundaries, and dark labels. Selection and evaluation colors remain distinct.

`map-reconstruction-viewport.js` fits the union of **all locked and incoming states' canonical bounds**, including incoming pieces still in the bank, with 28 CSS pixels of padding (reduced only for very small viewports). It matches the rendered SVG aspect ratio. This replaces the earlier initial camera that clipped distant locked context. The logical placement workspace, neighboring-anchor focus bounds, coordinate normalization, evaluator, and evidence adapter are unchanged.

Camera view state survives selection, placement, submission, and result rerenders. Resize refits an untouched camera; after manual navigation it preserves center and horizontal world span while adapting the aspect ratio. Fit map and Reset restore the intended fit. Wheel, zoom buttons, background drag, two-finger background pinch, and focused-workspace arrow keys control the camera. Zoom is bounded to one-eighth through four times the fitted world span. Panning is unrestricted so learners can explore and recover using Fit map.

A piece or bank gesture owns its pointer sequence: additional fingers cannot start a map gesture or replace that piece drag. Conversely, a background camera gesture blocks piece pickup until it ends. Select multiple retains its selection-box gesture. Existing inverse SVG screen transforms convert drops/drags back to world coordinates. After manual navigation, the temporary mobile drag camera zoom is suppressed.

Single-piece releases use the active SVG screen matrix to compare the dropped translation with the piece's canonical translation. `src/atlas/map-reconstruction-placement-tolerance.js` is the only tolerance configuration: 32 CSS pixels for mouse/trackpad input and 40 CSS pixels for touch. The boundary is inclusive. Accepted pieces snap to their exact canonical position; outside releases and multi-piece moves retain the existing retry and submission behavior. This release-time assistance does not replace the regional, Guided anchored, standalone translated-region, or Lower 48 submission evaluators.

Browser regression coverage in `reconstruction-navigation.spec.js` uses the production activity and real geometry in a direct fixture to inspect coordinate invariants, plus the existing Guided production-route tests. Emulated touch is covered; Safari and physical-device gestures are not certified. At a full-country mobile fit, northeastern labels can crowd; manual zoom is available. Alaska/Hawaii remain deferred.
