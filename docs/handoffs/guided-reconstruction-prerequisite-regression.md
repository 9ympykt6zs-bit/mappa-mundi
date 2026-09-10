# Assignment: Audit fresh-profile Guided Reconstruction eligibility

Status: accepted

## Brief — Lead completes before dispatch

- Objective and user-visible outcome: identify why a completely reset U.S. Guided Learning profile can select Map Reconstruction first, and define the smallest prerequisite correction that requires every authored checkpoint's states to have completed Guided introduction before that checkpoint is eligible.
- Why delegation is more efficient than direct implementation: the regression crosses checkpoint configuration, canonical evidence prerequisite evaluation, Guided orchestration persistence, targeted continuation, and recent post-curriculum routing. A bounded learning-systems audit can isolate the faulty eligibility contract before the Lead edits shared scheduling code.
- Specialist role; selected supported model/effort and reason: temporary Content / Learning Systems specialist using `gpt-5.6-terra` at medium effort for a focused read-only scheduler audit.
- Agent/task identifier after dispatch: `/root/reconstruction_gate_audit` (Euclid).
- Checkout/worktree path, branch, base revision, and pre-existing dirty files: shared checkout `/Users/ryanbarnhill/Documents/mappa-mundi`, branch `feature/evidence-driven-learning-foundation`, base `eb32e9f`; this handoff file is the only expected dirty file.
- Relevant files, contracts, domain documentation, and concise context: inspect `src/guided-learning-orchestration.js`, `src/guided-reconstruction.js`, checkpoint and evidence helpers, reset/persistence paths in `src/maplibre-poc.js`, commits `d414fa7`, `0fed514`, and earlier Reconstruction commits, focused scripts/browser tests, and relevant Guided/Reconstruction docs.
- Allowed files/changes: read-only code and history audit; fill in this handoff's Handoff section only.
- Exclusions and behavior/data that must be preserved: do not edit application code or tests; preserve Guided-only anchored scoring, standalone translated-region tolerance, canonical evidence meanings, authored checkpoint membership, active-child resume, post-state choice behavior, and Alaska/Hawaii deferral.
- Acceptance criteria: enumerate each authored checkpoint's new and cumulative required states; trace the exact fresh-profile eligibility failure; distinguish introduction completion from incidental canonical evidence; recommend a pure prerequisite rule and persistence-safe integration point; specify fresh reset, checkpoint 1 boundary, later checkpoint, targeted routing, reload, scoring, and evidence regression tests.
- Required tests and manual/browser checks; environment constraints: read-only deterministic probes are allowed; no browser run is required. Record commands and unverified boundaries.
- Return control to the Lead; no further delegation or unrelated edits: required.

## Handoff — specialist completes

Status: ready for Lead review.

- Result: the authored checkpoint inventory is sound, but its eligibility signal is not scoped to Guided state teaching. `src/guided-learning-orchestration.js` creates each Reconstruction block with `checkpoint.stateIds.map(stateCoveredPrerequisite)`. `stateCoveredPrerequisite` accepts either `state-location:<id>` or `state-naming:<id>`, and `getInstructionalCoverage` accepts any canonical event whose outcome is `correct` or `assisted`, regardless of source or whether the U.S. Guided state curriculum introduced it. The selector gives an eligible Reconstruction checkpoint precedence over the normal Guided section. Thus retained canonical evidence can launch checkpoint 1 before the newly reset Guided state curriculum has taught any state.

- Reset/persistence root cause: `resetUnitedStatesMemoryTrailProgress()` in `src/maplibre-poc.js` removes the U.S. Guided state progress, orchestration cursor, and child launch contract, but deliberately retains canonical evidence. The `resetAllLearningProgress()` manifest clears canonical evidence too. A Guided-only reset is therefore a fresh Guided profile with potentially non-fresh global evidence; the current global `correct`/`assisted` prerequisite misclassifies that retained evidence as Guided instructional coverage. This is consistent with the documented scoped-reset authority, not corrupted storage. Existing deterministic coverage tests seed exactly that broad evidence shape (`sourceMode: "us-memory-trail", outcome: "assisted"`), so they prove global evidence gating rather than the required Guided-introduction gate.

- Checkpoint/state prerequisite inventory (new / cumulative required; all state IDs are the Guided state's `state:<id>` item identities):

  | Checkpoint | New required states | Cumulative required states | Required earlier checkpoint |
  | --- | --- | --- | --- |
  | 1 — `us-states-01` | ME maine; NH new-hampshire; MA massachusetts; RI rhode-island; CT connecticut | ME, NH, MA, RI, CT | none |
  | 2 — `us-states-02` | VT vermont; NY new-york; NJ new-jersey; PA pennsylvania; DE delaware | 1 + VT, NY, NJ, PA, DE | 1 |
  | 3 — `us-states-03` | MD maryland; VA virginia; WV west-virginia; NC north-carolina; SC south-carolina | 1–2 + MD, VA, WV, NC, SC | 2 |
  | 4 — `us-states-04` | GA georgia; FL florida; AL alabama; MS mississippi; LA louisiana | 1–3 + GA, FL, AL, MS, LA | 3 |
  | 5 — `us-states-05` | MI michigan; OH ohio; IN indiana; KY kentucky; TN tennessee | 1–4 + MI, OH, IN, KY, TN | 4 |
  | 6 — `us-states-06` | WI wisconsin; IL illinois; IA iowa; MO missouri; AR arkansas | 1–5 + WI, IL, IA, MO, AR | 5 |
  | 7 — `us-states-07` | MN minnesota; ND north-dakota; SD south-dakota; WY wyoming; NE nebraska | 1–6 + MN, ND, SD, WY, NE | 6 |
  | 8 — `us-states-08` | KS kansas; OK oklahoma; TX texas; CO colorado; NM new-mexico | 1–7 + KS, OK, TX, CO, NM | 7 |
  | 9 — `us-states-09` | UT utah; AZ arizona; NV nevada; CA california | 1–8 + UT, AZ, NV, CA | 8 |
  | 10 — `us-states-10` | MT montana; ID idaho; WA washington; OR oregon | 1–9 + MT, ID, WA, OR | 9 |

  The cumulative column is intentionally a diagnostic inventory. Eligibility should require the checkpoint's own new states to be introduced plus its immediately preceding checkpoint to be completed; the chain makes all prior groups cumulative. Alaska and Hawaii remain absent/deferred.

- Recommended correction: make Reconstruction prerequisites a distinct, pure Guided-state-introduction predicate, evaluated from `loadUnitedStatesMemoryTrailProgress(getUnitedStatesMemoryTrailItems())` (or a normalized `guidedStateProgress` explicitly passed to the orchestration selector). For each checkpoint state `id`, require the corresponding state item `state:<id>` to be present in the Guided state progress as introduced (`introducedItemIds` contains it, equivalently its persisted item status is no longer `unseen`). Do not substitute a state-capital item, generic state naming/location evidence, Journey/Memory Trail evidence, or Reconstruction evidence. Retain the existing preceding-checkpoint `prerequisiteBlockIds` rule. This means checkpoint N is eligible exactly when: (a) every member of `GUIDED_RECONSTRUCTION_CHECKPOINTS[N].stateIds` has completed Guided state introduction, (b) checkpoint N−1 is completed when N > 1, and (c) N itself is not completed. The normal selector continues to prefer an eligible checkpoint, but a reset state has no introduced `state:*` items and falls through to state teaching.

  Keep canonical evidence and Guided-only anchored evaluation untouched: checkpoint submission remains imperfect-result-completable and still emits only `state-reconstruction:* + spatial-reconstruction`; locked context and the standalone translated-region evaluator do not participate in eligibility. Do not infer later checkpoint readiness from global Reconstruction existence or any prior checkpoint alone. A narrow durability hardening is also warranted in `rehydrateGuidedLearningChildBlock`: for a `launched` contract, require the recomputed current block to remain that eligible block before returning the configured fallback. The existing completed-child reload behavior can remain valid. This prevents a stale/inconsistent launched contract from bypassing the new prerequisite on reload while preserving ordinary active-child resume.

- Test plan for implementation:
  1. Extend `scripts/check-guided-reconstruction-checkpoints.mjs` with a fully empty Guided state/orchestration state plus deliberately retained global canonical `correct`/`assisted` events for checkpoint 1. Assert checkpoint 1 is ineligible and selector returns the Guided-section fallback. This is the direct fresh-Guided-reset regression.
  2. Use real `buildUnitedStatesMemoryTrailItems` identities and state-progress transitions. Assert checkpoint 1 remains ineligible with four of its five `state:*` introductions, becomes eligible only after all five are introduced, and unrelated canonical location/naming/reconstruction evidence never changes either result.
  3. For every authored checkpoint, seed all required Guided introductions and the exact preceding completion chain; assert that checkpoint is eligible. Remove one state from that checkpoint and assert it is blocked. Seed prior completed checkpoints without that group's introductions and assert the later checkpoint is still blocked.
  4. Verify targeted state, capital, physical, and Connections entry still may select an eligible checkpoint only after that same state-introduction predicate; preserve `targetedNeedSatisfied: false` for Reconstruction.
  5. Add a persistence/reset probe: persist global evidence and a completed first checkpoint, execute the Guided-only reset path, reload normalized state, and assert checkpoint 1 cannot launch; add reload coverage for a valid launched child and for stale launched contract/prerequisite mismatch if durability hardening is adopted.
  6. Retain/extend scoring assertions: checkpoint 1 accepts standalone translation tolerance; checkpoint 2+ reject a translated new cluster against locked anchors; canonical Reconstruction event identities/outcomes remain target-only. Run the existing Guided scheduler/evidence checks plus the focused browser Guided Reconstruction test after integration.

- Read-only checks run: `node scripts/check-guided-reconstruction-checkpoints.mjs` passed. I inspected current `eb32e9f`, the camera baseline commit `0fed514eb0a0d272c8dcb3d4073fb748733d61ea`, the Reconstruction implementation commit `d562c40`, and the post-state routing commit `d414fa7`. No browser test was run and no application code or tests were changed.

- Files changed: this handoff only. The Lead should update `docs/guided-reconstruction-checkpoints.md`, `docs/guided-learning-orchestration-v1.md`, `docs/testing.md`, and `docs/engineering-state.md` after implementing and validating the changed eligibility contract.

## Acceptance — Lead completes

Accepted. The Lead implemented a distinct Guided state-introduction prerequisite for every authored checkpoint, kept the preceding-checkpoint chain, and revalidated launched child contracts during reload. Focused deterministic checks and the fast baseline pass; browser results are recorded in `docs/engineering-state.md`.
