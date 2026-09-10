# Assignment: Audit Guided physical-geography regional progression

Status: completed

## Brief — Lead completes before dispatch

- Objective and user-visible outcome: determine why a fresh Guided Learning progression can introduce Brooks Range and Alaska Range before eastern lower-48 mountains, then recommend the smallest general geographic-progression rule that keeps new mountain, river, and lake cohorts near the learner's east-to-west state progression without restoring all-related-states gating.
- Why delegation is more efficient than direct implementation: the decision crosses cohort content order, hard prerequisites, scheduler priority, state curriculum milestones, continuation routing, starvation, and review semantics. A bounded Content / Learning Systems audit can independently test the model while the Lead retains architecture, implementation, integration, and acceptance.
- Specialist role; selected supported model/effort and reason: temporary Content / Learning Systems specialist using `gpt-5.6-terra` at medium effort for a focused read-only scheduling audit.
- Agent/task identifier after dispatch: `/root/physical_regional_progression_audit`.
- Checkout/worktree path, branch, base revision, and pre-existing dirty files: shared checkout `/Users/ryanbarnhill/Documents/mappa-mundi`, branch `feature/evidence-driven-learning-foundation`, base `d2f0a79`; this handoff is the only expected dirty file.
- Relevant files, contracts, and context: `AGENTS.md`, `docs/engineering-state.md`, `docs/physical-geography-pacing-audit.md` if present, `docs/handoffs/physical-geography-pacing-audit.md`, commit `f24f1be3ba856814d1883a04599bd5f4fdafa920`, `src/united-states-physical-feature-orchestration.js`, `src/guided-learning-orchestration.js`, `src/united-states-evidence-driven-continuation.js`, physical scheduler checks, and Guided browser tests. Inspect cohort order, hard prerequisites, state/progression metadata, targeted/untargeted routing, unseen priority, interleave gates, Alaska handling, review eligibility, and starvation behavior.
- Allowed files/changes: read-only code/history/data/test audit; fill only the Handoff section of this file. Temporary scripts under `/tmp` are allowed.
- Exclusions and preserved behavior: do not edit application code or tests; do not restore all-related-state prerequisites; do not change evidence/mastery meanings, post-introduction review scheduling, 2–3 target cohorts, immediate retrieval, Alaska/Hawaii state cameras, Reconstruction, or physical map geometry.
- Acceptance criteria: reproduce or explain the Alaska-first selection from current code; distinguish hard prerequisite, geographic eligibility, and review eligibility; propose durable progression metadata and deterministic selection semantics; show when Rockies and Alaska ranges become eligible; assess rivers/lakes under the same rule; define anti-starvation behavior and focused regression coverage.
- Required checks and manual/browser work: source/history inspection and deterministic scheduler probes are expected; browser work is optional for this audit. Record actual evidence and unverified boundaries.
- Return control to the Lead; no further delegation or unrelated edits: required.

## Handoff — specialist completes

### Result

Audit complete. No application code or tests changed. The only modified file is this handoff.

The Alaska-first result is reproducible, but it is not the normal result for a completely clean evidence repository. It occurs when Guided orchestration has completed `us-guided:rebuild-new-england` and canonical state evidence says Alaska is covered. `alaska-range` and `brooks-range` then receive a finite prerequisite eligibility milestone from `state-location:alaska`; every lower-48 physical feature has no state prerequisite and therefore has an infinite/null milestone. `comparePhysicalFeatureQueueEntries` sorts milestone before the cohort's `curriculumOrder`, so the Alaska cohort precedes all lower-48 cohorts. With the same completed checkpoint and no Alaska evidence, the selector returns the Northeast cohort; incorrect-only Alaska evidence also returns Northeast.

This explains an apparently fresh Guided progression if “fresh” means the Guided orchestration cursor was reset while canonical state evidence was retained. The documented scoped reset intentionally has that asymmetry. It can also happen after any out-of-order Alaska state exposure. The regular state itinerary places Alaska/Hawaii in section 11, so a wholly clean, uninterrupted state itinerary would not normally produce Alaska first.

### Current semantics, kept separate

| Kind | Current rule | Consequence |
| --- | --- | --- |
| Hard prerequisite | All physical introductions require the first Guided Reconstruction checkpoint. Alaska Range and Brooks Range additionally require covered Alaska state location or naming evidence. Lower-48 feature/state relationships are not prerequisites. | The Alaska map context is protected; lower-48 physical geography can scaffold later state learning. |
| Geographic eligibility / priority | There is no lower-48 regional progression gate. All lower-48 cohorts become eligible after checkpoint 1. Queue order is eligibility-event time, then `curriculumOrder`, then authored order. | A timestamped Alaska prerequisite beats lower-48 null milestones, and all other cohort order is only a fallback rather than learner-region pacing. |
| Review eligibility | A feature must have been introduced and received its initial retrieval record. Lower-48 family review waits for all targets in that family to be introduced; Alaska review waits for both ranges; mixed review waits for two introduced targets in each lower-48 family. Due timing is based on real Guided learning events. | Review cannot introduce unseen content. New eligible introductions already take priority over due review in the ordinary selector. |

The existing 13 two/three-target cohorts, immediate cohort retrieval, explicit lower-48/Alaska camera separation, and post-introduction review pools are sound seams for this change. Evidence-Driven Continuation only filters by physical family; it does not add regional pacing, so its targeted entry must use the same selector rule.

### Smallest durable regional-progression design

Keep the existing hard prerequisites and add explicit cohort-level progression metadata, rather than inferring readiness from every physical relationship or coordinate at selection time:

| Cohort / target area | Recommended Guided state-stage anchor |
| --- | --- |
| Northeast mountains | 1–2 (New England / Northeast interior) |
| Southern Appalachian and Appalachian-system ranges | 3 |
| Upper Great Lakes; eastern rivers | 5 |
| Central rivers; central mountains | 6–7 |
| Western rivers; western-major mountains including Rockies | 8 (Southern Plains and Rockies) |
| Eastern/interior lakes; interior-West ranges | 9 |
| Pacific ranges | 10 (Northwest) |
| Alaska mountains | 11, plus the existing Alaska hard gate |

Store this as immutable cohort metadata such as `{ geographyRegion: "lower-48" | "alaska", regionalStage: number, curriculumOrder: number }`. Derive the learner’s regional frontier from the contiguous prefix of persisted Guided state introductions (`introducedGuidedStateItemIds`) using the authored eleven state sections. Do not derive it from canonical state evidence: a retained or manually acquired Alaska event must not move a fresh Guided learner to stage 11.

For ordinary Guided selection, retain the first-Reconstruction hard gate, then consider unintroduced cohorts whose `regionalStage <= frontier` (with Northeast available immediately when checkpoint 1 completes). Pick the earliest unintroduced eligible stage, then the existing `curriculumOrder` and stable cohort ID/order. This is a general east-to-west progression rule: it makes Rockies geographically eligible at stage 8 without requiring every state the Rocky Mountains cross, and Alaska eligible at stage 11 while retaining its Alaska evidence gate. State evidence still supplies Alaska's hard navigation/context requirement; geographic stage supplies curriculum pacing.

Use the same regional eligibility for targeted evidence-driven physical-family entry. If no cohort in the requested family is geographically ready, return to normal Guided state learning rather than bypassing the frontier. Deliberate manual activities remain outside this selector.

### Anti-starvation and validation

- Preserve the existing rule that a new geographically eligible cohort beats a due review, and the existing one-real-nonphysical-session interleave after a physical sequence.
- Among ready unseen cohorts, always choose the oldest unintroduced regional stage before the learner-frontier cohort. This drains skipped eastern cohorts after a learner resumes later in the state route, while a contiguous frontier prevents one isolated later-state introduction from jumping the route.
- If a stage has no remaining cohort, advance naturally to the next ready stage; never wait for review or for all state–feature relationship coverage. Alaska remains separate and cannot join lower-48 mixed/family pools.
- Keep review eligibility exactly introduction/retrieval/due based. It is not a geographic-readiness override, and weak due targets retain their current bounded priority once no new ready cohort exists.

Focused regression coverage should add deterministic scheduler fixtures for: (1) checkpoint 1 plus Alaska canonical evidence still selecting Northeast, (2) a clean frontier selecting northeast first, (3) stages 5, 8, 9, 10, and 11 releasing the listed cohorts in order, especially Rocky at 8 and Alaska only at 11 plus covered Alaska, (4) partial/out-of-order Alaska introduction not advancing the contiguous frontier, (5) rivers and lakes following the same rule, (6) retained canonical evidence after a Guided-only reset, (7) a due review losing to a newly stage-ready cohort, and (8) deterministic replay and targeted-family routing. Existing physical presentation coverage should confirm that lower-48 batches keep their normal camera and Alaska keeps its regional preset.

### Verification

Read-only checks passed:

- `node scripts/check-guided-learning-physical-feature-orchestration.mjs`
- `node scripts/check-guided-learning-orchestration.mjs`
- `node scripts/check-guided-physical-retrieval-checkpoint.mjs`
- `node scripts/check-evidence-driven-united-states-continuation.mjs`

I also ran an inline deterministic selector probe. With only checkpoint 1 complete: no Alaska evidence selected `northeast-mountains`; covered Alaska selected `alaska-mountains` (`alaska-range`, `brooks-range`) first; incorrect-only Alaska again selected `northeast-mountains`. No browser run was needed for this scheduling audit.

## Acceptance — Lead completes

Accepted. The specialist reproduced the retained-Alaska milestone inversion and correctly separated hard prerequisite, geographic introduction eligibility, and post-introduction review eligibility. The Lead implemented cohort region/stage/lead metadata and a contiguous frontier derived from current Guided state introductions, with Alaska requiring stage 11 and its existing canonical state-coverage prerequisite. The queue now chooses the oldest region-ready unseen stage before curriculum order; targeted physical-family entry uses the same filter; review remains region-independent and evidence-driven.

The final stage assignments differ from the audit recommendation in two bounded ways. Southern/Appalachian cohorts anchor at stage 3 with a one-section lead, and eastern rivers plus both lake cohorts anchor at stage 5 with a one-section lead. This represents the requested adjacent-region behavior explicitly. The existing Erie/Ontario/Great Salt cohort remains at the Great Lakes stage because preserving the approved three-feature introduction batch is preferable to creating a one-target Great Salt introduction; that interior member is a documented lead within an otherwise regional comparison group.

Lead validation passed the 109-check fast baseline, the complete 22-case desktop/mobile Guided orchestration browser suite, the complete 26-case desktop/mobile physical presentation suite, syntax checks, and `git diff --check`. The browser fixtures now persist the Guided state frontier appropriate to the physical cohort they exercise instead of relying on canonical evidence to imply regional readiness.
