# Guided Reconstruction scoring and integration

Status: accepted

## Brief

- Objective: add Guided-only anchored evaluation after the first checkpoint while preserving standalone scoring and canonical evidence meanings.
- Delegation benefit: the pure evaluation boundary and its regression tests can be implemented independently of the Lead's checkpoint authoring, runtime routing, and UI work.
- Specialist: Infrastructure / Quality; `gpt-5.6-luna`, medium reasoning, compact context.
- Checkout: shared repository; branch `feature/evidence-driven-learning-foundation`, base `66509f0`; clean before this assignment record.
- Allowed specialist files: `src/atlas/map-reconstruction-evaluation.js` and new `scripts/check-guided-reconstruction-evaluation.mjs` only.
- Relevant context: existing evaluator, geometry, engine, and `scripts/check-map-reconstruction.mjs`. No standalone behavior change, UI edits, canonical schema changes, or further delegation.
- Contract: export a Guided evaluator accepting a session containing only newly tested states, a region whose `stateIds` are those states, geometry containing both new and locked prior states in one coordinate frame, and explicit locked state IDs. Locked states are reference context at their correct positions, never assessment targets. From checkpoint 2 onward no normalization based on the newly placed region may erase displacement relative to anchors. Return the existing evaluation shape with placements/counts only for new states.
- Acceptance: correct anchored placements pass; a uniformly shifted new cluster fails; unplaced targets remain unplaced; anchors cannot emit scored placements; standalone translated-region regression still passes. Preserve input immutability, thresholds, and existing canonical placement meanings.
- Tests: new focused Node check with real repository geometry, plus `node scripts/check-map-reconstruction.mjs`. Return exact results, changes, limitations, and any suggested integration precautions. Lead owns integrated tests and final commit.

## Specialist handoff

- Agent: `/root/guided_scoring`; one specialist, with one sequential correction request. No new specialist was needed on resumption.
- Implemented the pure Guided evaluator and real-geometry regression script in the two assigned files.
- Initial review found that disabling translation alone omitted locked-state overlap/adjacency; the specialist added reference geometry. Lead then restricted placement/feedback accounting to new targets and ensured locked reference positions are canonical copies.
- Specialist focused checks passed. Lead integration added section-aligned checkpoints, isolated context rendering, primary Learn routing, content/evidence checks, browser tests, and cache versions.

## Interruption recovery

- Resumed on the same branch at `66509f0`: 13 modified tracked files and 6 new files, nothing staged, no implementation commit. No unrelated changes were found.
- Retained the valid implementation. Prior focused evidence: 103/103 Node checks and 8/8 new desktop/mobile browser cases passed.
- Recovered the completed full-suite log: 156/168 passed, 12 failed. Acceptance had not completed. An archived unchanged `66509f0` checkout on port 4175 reproduced ten failures; both mobile camera cases passed there and on the resumed implementation acceptance run.

## Lead acceptance

- Reviewed the full tracked diff and all new files. Retained the valid application changes; no duplicated implementation or unrelated changes were found on resumption.
- Fixed the two stale cache-key checks exposed after the original HTML asset-version update. They now assert that both entry pages use the same nonempty runtime/CSS versions.
- All five focused Node checks passed; final `npm test`: **103/103 passed**.
- Recovered full browser run: **156 passed / 12 failed**. Base comparison: **4 passed / 10 failed** across the 14 selected cases. Final affected-flow acceptance: **18/18 passed**, including Guided Reconstruction, targeted family continuation, checkpoint return, and both earlier mobile camera failures.
- Existing failures and the exact acceptance command are recorded in `docs/testing.md`. The full suite remains red due to existing issues; possible intermittent camera failures remain documented.
- Updated the domain design, testing record, and engineering-state entry point. Documentation links and `git diff --check` passed.
- Accepted for the bounded Guided Reconstruction scope. Alaska/Hawaii layouts and the existing unrelated browser failures remain deferred. No deployment is included.
