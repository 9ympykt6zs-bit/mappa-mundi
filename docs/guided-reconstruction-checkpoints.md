# Guided Reconstruction checkpoints

Implemented on `feature/evidence-driven-learning-foundation` following an independent audit of clean base `66509f0` (2026-09-05).

## Audit and decision

The prior handoff was confirmed against the code: Guided had one New England checkpoint requiring six states; `us-states-01` teaches five and Vermont belongs to `us-states-02`. Later Guided checkpoints were absent. Target-family filtering excluded Reconstruction, and primary Evidence-Driven Continuation skipped the child coordinator entirely when it selected a political section. Untargeted selection already preferred eligible Reconstruction over new physical introductions. Standalone regional tests deliberately accepted a uniformly translated correct assembly. Section 11 contains Alaska/Hawaii, but neither the regional nor Lower 48 Reconstruction layouts support them.

The fix follows the existing Guided sections instead of changing their content or learner progress. Checkpoint 1 assesses the first five states; checkpoint 2 introduces Vermont alongside its actual section peers. These are Guided regional practice groups, not the standalone regional partitions. The original `us-guided:rebuild-new-england` completion ID remains valid for existing learners; its Guided display now describes the first five-state group. Standalone New England still contains six states.

## Authored sequence

`src/guided-reconstruction.js` owns the bounded checkpoint definitions. A content regression compares each group directly with its existing state-section JSON. Each checkpoint requires instructional coverage for every new state and, from checkpoint 2, submission of the preceding checkpoint. Submission remains non-gating: an imperfect or empty submission completes that checkpoint, but does not declare mastery. Previously tested states subsequently appear at their canonical positions as locked teaching context.

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

Only new states exist in the mutable session, bank, result counts, and returned evaluation placements. Anchors live in a separate noninteractive SVG layer and geometry references. Reset, selection, dragging, and correction cannot move them. All prior shapes share the new targets' coordinate frame; the viewport fits the current group and adjacent locked context, so distant prior states may be clipped. Locked labels use state abbreviations to reduce crowding. No new-state outline is shown before submission.

The existing canonical adapter remains unchanged: `state-reconstruction:<id>` concepts, `spatial-reconstruction` skill, and `map-reconstruction` source mode. `well-placed` means `correct`, `close` means `partial`, `misplaced` means `incorrect`, and `unplaced` means `skipped`. Locked context emits no events. Checkpoint completion and child reload use the existing orchestration/child-launch stores; reopening a completed child emits no new evaluation.

## Routing

Eligible checkpoints are considered even for targeted state/capital, physical-family, and Connection entries. Primary Learn now consults the child coordinator for political targets too, while preserving an existing active Guided session and durable child resume. Active eligible children and in-progress physical sequences retain their existing precedence; checkpoints precede newly selected physical introductions and targeted Connections. When no checkpoint is eligible, political targeting returns to its existing section planner without launching an unrelated physical family.

Inspector traces retain the requested family and report `targetedNeedSatisfied: false` when a Reconstruction checkpoint is chosen; completing it does not falsely claim completion of a different skill. The all-objectives-ready standalone exploration/capstone route remains unchanged.

## Validation

- `scripts/check-guided-reconstruction-checkpoints.mjs`: every section/group, prerequisite chain, targeted/untargeted reachability, all ten real-geometry layouts, target-only canonical evidence, legacy completion preservation, and 48-state coverage.
- `scripts/check-guided-reconstruction-evaluation.mjs`: fixed-frame translation rejection within the workspace, correct placements, anchor overlap/adjacency, missing targets, input immutability, and standalone translation preservation.
- Existing orchestration, physical-feature, and standalone Reconstruction checks retain coverage of mode behavior and interleaving.
- `tests/e2e/guided-reconstruction.spec.js`: primary Learn entry for checkpoints 1, 2, and 10; new-piece bank and locked context; keyboard/reset immutability; submission/evidence boundaries; completed-child reload and return; standalone six-state New England. Runs on desktop and mobile Chromium.

See `engineering-state.md` for the final integrated test record. Real-device touch, Safari, narration quality, and a pedagogical efficacy study are outside this change.
