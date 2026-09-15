# Assignment: Audit the premature Guided completion boundary and design a final capstone

Status: ready for Lead review

## Brief — Lead completes before dispatch

- Objective and user-visible outcome: identify why U.S. Guided Learning reaches its post-state chooser while required late capitals and physical cohorts remain, then design a durable final ten-question capstone that closes the mandatory Guided curriculum without changing evidence semantics or scoring.
- Why delegation is more efficient than direct implementation: this boundary crosses U.S. trail state, Guided orchestration, physical-cohort sequencing, generic MapLibre retrieval, canonical evidence, and reload ownership.
- Specialist role; selected supported model/effort and reason: temporary Content / Learning Systems specialist; bounded read-only architecture and learning-flow audit.
- Agent/task identifier after dispatch: `/root/guided_capstone_audit`.
- Checkout/worktree path, branch, base revision, and pre-existing dirty files: shared checkout `/Users/ryanbarnhill/Documents/mappa-mundi`, `feature/evidence-driven-learning-foundation`, base `2ba1b1d85c27a1fe4a60a9d4cecb28e518da9da5`; clean at dispatch.
- Relevant files, contracts, domain documentation, and concise context: `AGENTS.md`, `docs/engineering-state.md`, `docs/guided-learning-orchestration-v1.md`, `src/united-states-memory-trail-planner.js`, `src/guided-learning-orchestration.js`, `src/united-states-physical-feature-orchestration.js`, `src/guided-child-launch-contract.js`, `src/activity-evidence-contract.js`, `src/canonical-learning-evidence.js`, and the runtime/tests named below.
- Allowed files/changes: read-only audit; create this handoff only.
- Exclusions and behavior/data that must be preserved: do not change application code, tests, Git state, cameras, scoring, evidence meanings, Journey progress, or optional Connections/deferred content.
- Acceptance criteria: exact completion trigger; mandatory inventory and durable signals; an exactly-ten, deterministic/persisted capstone design; transition/reload risks; concrete implementation and validation seams.
- Required tests and manual/browser checks; environment constraints: run focused read-only Node checks only if useful; no browser run required for this audit.
- Return control to the Lead; no further delegation or unrelated edits: required.

## Handoff — specialist completes

### Finding: the chooser is a state-only boundary

`startOrContinueUnitedStatesMemoryTrail()` in `src/maplibre-poc.js` checks
`getUnitedStatesPostStateCurriculumStatus(state, items).stateCurriculumComplete` after it gives an active U.S. trail session priority. If true, it immediately renders `post-state-curriculum` and never calls the ordinary planner.

`getUnitedStatesPostStateCurriculumStatus()` in `src/united-states-memory-trail-planner.js` defines that condition as a valid 50-state inventory plus `areAllUnitedStatesMemoryTrailItemsIntroduced(normalized, stateItems)`. `areAll…Introduced()` only requires each item status to differ from `unseen`; `createUnitedStatesMemoryTrailState()` derives that status from persisted `itemProgress` with `introducedItemIds` as its fallback. It deliberately does **not** require a capital, a physical feature, a Guided checkpoint, canonical-evidence strength, or mastery.

That is why the four reported targets can be bypassed:

- `capital:juneau-ak` and `capital:honolulu-hi` are normal U.S. Memory Trail capital items from `buildUnitedStatesMemoryTrailItems()`, but they are excluded from the state-only condition. The ordinary `buildUnitedStatesLearningPlan()` still has them available after their related state introduction; the chooser intercepts before that plan can launch.
- Alaska Range and Brooks Range are the `alaska-mountains` cohort in `UNITED_STATES_PHYSICAL_LEARNING_COHORTS` in `src/united-states-physical-feature-orchestration.js`. Their final-stage eligibility is valid only after the earlier mountain cohorts and state-frontier rules in `getGuidedLearningPhysicalProgression()`, `getPhysicalCohortGeographicEligibility()`, and `getPhysicalCohortCurriculumEligibility()` in `src/guided-learning-orchestration.js`. Once the state-only screen opens, its Physical Geography action calls `selectGuidedLearningPostStatePhysicalReview()`, whose stated contract is review-only: it considers repeatable due review pools and cannot introduce an unseen cohort. Thus its `us-guided:introduce-alaska-range` and `us-guided:introduce-brooks-range` blocks cannot be selected.

The existing choice screen is correctly persistent for the review behavior it was designed for, but it is premature as a final Guided completion boundary. `renderPostStateCurriculumChoiceScreen()` has only Mixed U.S. Review, Physical Geography review, and repeatable Reconstruction. `startPostStateCurriculumMixedReview()` chooses due physical review or `planUnitedStatesPostStateCurriculumReview()`; neither introduces curriculum content. `startPostStateCurriculumReconstruction()` starts the repeatable lower-48 review block.

### Mandatory Guided inventory and authoritative prerequisites

Treat this as the current required core, with **introduction/retrieval opportunity** as the completion standard. Do not substitute mastery or evidence confidence.

| Required core | Count | Reliable persisted signal | Why it is the right signal |
| --- | ---: | --- | --- |
| State-location curriculum | 50 | Every `state:<id>` is non-`unseen` in `mappaUnitedStatesMemoryTrailProgress` after `createUnitedStatesMemoryTrailState()` normalization. | It is the existing Guided introduction frontier and Reconstruction’s `introducedGuidedStateItemIds` gate. |
| Capital curriculum | 50 | Every `capital:<id>` is non-`unseen` under the same normalized U.S. trail state. | `buildUnitedStatesMemoryTrailItems()` builds one linked capital item per state; this includes Juneau and Honolulu. |
| Guided Reconstruction checkpoints | 10 | Each non-repeatable `reconstruction-checkpoint` ID is in normalized `mappaGuidedLearningOrchestration.completedBlockIds`. | `completeGuidedLearningOrchestrationBlock()` persists submission completion with no perfect-score requirement. Each block separately requires its own Guided state introductions. |
| Supported physical geography | 34 | All 34 `physicalFeatures[].introductionBlockId` values are completed; require their `completionBlockId` values too if “completed core curriculum” means the documented Teach → Retrieve → Return sequence rather than exposure alone. | Introduction blocks mean the supported tap occurred; nonrepeatable physical practice blocks mean an independent retrieval checkpoint completed. Both live in the existing orchestration store. |

The 34 supported targets are 8 rivers, 6 lakes, and 20 mountain ranges. Their complete set is the 13 cohorts in `UNITED_STATES_PHYSICAL_LEARNING_COHORTS`: northeast mountains (White, Green, Adirondack); southern Appalachian (Allegheny, Blue Ridge, Great Smoky); Appalachian system (Cumberland, Appalachian); eastern rivers (Ohio, St. Lawrence); upper Great Lakes (Superior, Michigan, Huron); eastern/interior lakes (Erie, Ontario, Great Salt); central rivers (Mississippi, Missouri, Arkansas); central mountains (Ozark, Ouachita, Black Hills); western rivers (Colorado, Columbia, Rio Grande); western major mountains (Rocky, Cascade, Sierra Nevada); interior West (Wasatch, Teton); Pacific (Coast Ranges, Olympic); Alaska (Alaska Range, Brooks).

Exclude from final-capstone eligibility: mastery (`place-mastery`), canonical strength/coverage, due timing, optional `connection-checkpoint` blocks, repeatable physical/family/mixed review blocks, repeatable post-state Reconstruction, and the deferred `coast` family (`relationship-only-no-targeted-retrieval-path`). Do not make any of them a backdoor prerequisite.

### Recommended capstone: one fixed-attempt, persisted 4 / 3 / 3 retrieval set

Add a non-repeatable `final-capstone` Guided block after all required core predicates above. It should be a single integrated retrieval session with **exactly ten distinct, independently prompted targets**:

- 4 states;
- 3 capitals;
- 3 physical features, one river, one lake, and one mountain range.

Use a pure selector, for example `selectUnitedStatesGuidedFinalCapstone({ trailState, trailItems, orchestrationState, repository, selectionVersion })`, that returns either explicit ineligibility reasons or the exact ten structured items. It must only draw from the persisted required inventory above. A deterministic versioned seed formed from a fixed capstone ID plus `selectionVersion` can order candidates, but do not use wall clock time or a random source.

Use geographic buckets before the deterministic tie-breaker. At minimum, reserve state selections across northeast/east, south/central, west, and a non-contiguous group; reserve capital selections across three different broad regions; and reserve one physical family each from distinct broad regions where possible. The non-contiguous state/capital candidate groups should include both Alaska and Hawaii over the fixed design rather than treating them as out-of-map extras. The physical mountain candidate group must include Alaska Range and Brooks Range. Because the hard prerequisites require all items to have been introduced and given their initial retrieval opportunity, this selection never asks unseen material; the reserved groups prevent the final session from becoming a contiguous-state-only review.

For capital difficulty, preserve `chooseUnitedStatesCapitalRetrievalPromptType()` and `getSuccessfulCapitalNamingTargetIds()` in `src/united-states-capital-retrieval-sequencing.js`. A capital with no independent correct `capital-naming:*` event gets `place_to_name`; a capital with that evidence may use the existing balanced `name_to_place`/`place_to_name` logic. State and physical prompts use the normal retrieval selector. There is no teaching highlight, no new-item exposure, and no answer-revealing label before the learner responds.

Do **not** reuse `createGuidedPhysicalRetrievalCheckpoint()` unchanged. `chooseNextGuidedPhysicalRetrievalTarget()` schedules one retry after a miss, so its 10-member use can produce 11–20 prompts. Generalize its persisted checkpoint shape into a fixed-attempt capstone checkpoint (one prompt per `targetOrder`, every correct or incorrect result completes that target, no retry) or add a small sibling helper. Completion records all evidence and has no pass threshold.

### Reuse boundaries and evidence contract

The strongest runtime foundation is the existing guided `targeted-memory-trail` child path:

1. `startStudyPreviewActivity()` and `openStudyExploreActivity()` already create a normal `ActivitySession`, MapLibre rendering, and Memory Trail session from a scoped target list.
2. `createGuidedPhysicalRetrievalActivity()` is the closest synthetic-activity precedent: it merges source activity targets, installs `canonicalEvidence.entityTypesByTargetId`, forces a bounded target pool, and retains existing geometry.
3. `ActivitySession` itself accepts one activity containing a mixed target list. `activity-evidence-contract.js` explicitly supports `canonicalEvidence.entityTypesByTargetId`, and `recordCanonicalMemoryTrailEvidence()` already writes one canonical event per response through `adaptCanonicalRetrievalAttempt()`.

There are two required extensions before mixed capitals can use this safely:

- Generalize the physical-only synthetic builder into a core-capstone activity builder that composes target records from state/capital/physical source activities. Include each capital’s `relatedStateTargetId` from the U.S. trail item in a durable per-target item map. `getCanonicalRetrievalItemForActivity()` currently returns only type, target ID, label, and source activity; `adaptCanonicalRetrievalAttempt()` requires `relatedStateTargetId` to derive a capital concept. The ordinary U.S. trail succeeds because `recordCanonicalMemoryTrailEvidence()` first resolves the richer `plan.allItems` record.
- Give the capstone a recognized Memory Trail source/plan accessor parallel to `isUnitedStatesMemoryTrail()` / `getCanonicalMemoryTrailPlan()`, so canonical capital identity and the existing capital prompt difficulty gate resolve from the persisted capstone item records. Do not put physical target progress into the U.S. trail’s `itemProgress`: `createUnitedStatesMemoryTrailState()` filters it to the 100 state/capital IDs.

Persist the selected ten records at launch in the existing Guided orchestration state’s active `returnContext` and in the `mappaGuidedChildLaunch` contract. The current `createGuidedLearningOrchestrationState()` already preserves cloned `returnContext`; `saveActiveGuidedLearningOrchestrationBlock()` writes it before launch; `createGuidedChildLaunchContractForBlock()` and `rehydrateGuidedLearningChildBlock()` carry scoped child destination data across reload. Extend the child contract’s normalized `child` shape with a validated `capstone` payload (schema/version, ten canonical item records, `targetOrder`, prompt eligibility, and fixed-attempt checkpoint snapshot), rather than reselecting on reload.

Use `completedBlockIds` for final completion, with a new orchestration version only to normalize the optional capstone payload. Old stores have no final-block ID and remain eligible to finish the unblocked curriculum; they must not be marked complete by migration. The completed final block prevents a second final-capstone launch. This keeps selection persistence, exit/reload provenance, and completion in existing stores, without a new learner-progress model.

### Transition and reload risks

- **Current early interception:** replace the state-only route in `startOrContinueUnitedStatesMemoryTrail()` with a core-status router. An active U.S. trail session remains first priority. If states are complete but core requirements are not, return to the existing Guided scheduler so remaining capitals, unfinished Reconstruction, and physical introductions can drain; do not render a review-only destination.
- **Post-child return:** `returnToGuidedLearningFromOrchestration()` currently recognizes only `returnBehavior === "post-state-curriculum"`; completed capstone should route to a dedicated final-completion view or the normal Guided summary. If it reuses the chooser blindly, it reopens post-state review after the final block. Persist an explicit `returnBehavior: "guided-final-capstone"` or completed-core route in the existing return context.
- **Reload:** `resumeDurableGuidedChildLaunch()` rehydrates only blocks existing in `UNITED_STATES_GUIDED_LEARNING_ORCHESTRATION_V1`; include the new block in config and preserve the selected payload. `rehydrateGuidedLearningChildBlock()` currently special-cases physical retrieval target recovery; do not let it substitute the dynamic physical pool for a capstone target list.
- **Evidence idempotency:** retain the current attempt ID construction in `recordCanonicalMemoryTrailEvidence()` and persist the prompt/checkpoint snapshot after each outcome. Reload must resume the same prompt or next unfinished target; it must not replay an already recorded prompt with a new ID or duplicate evidence.
- **Reset:** `resetUnitedStatesMemoryTrailProgress()` in `src/maplibre-poc.js` clears the U.S. trail state, orchestration state, and child launch contract. `resetAllLearningProgress()` includes all three keys in `learningProgressStoreManifest`. The new optional capstone payload must therefore live under those existing keys and reset with them. Preserve canonical-history behavior for Guided-only reset as documented; no capstone completion may be inferred from retained evidence after the authoritative introduction signals are cleared.

### Focused implementation files and tests

Likely implementation seams:

- `src/united-states-memory-trail-planner.js`: pure core-status/prerequisite helper and state/capital introduced inventory projections.
- `src/guided-learning-orchestration.js`: `FINAL_CAPSTONE` block type/config, deterministic selector, normalizer/migration, and completion invariants.
- `src/guided-child-launch-contract.js`: versioned, validated capstone child payload.
- `src/maplibre-poc.js`: core routing; synthetic mixed activity builder; fixed-attempt session integration; capstone plan/source evidence resolution; reload/return rendering.
- `src/activity-evidence-contract.js` and possibly `src/canonical-learning-evidence.js`: carry capital `relatedStateTargetId` through the mixed activity resolver without altering concept meanings.
- `src/guided-physical-retrieval-checkpoint.js`: a sibling/generalized fixed-attempt checkpoint, retaining the existing physical retry behavior unchanged.
- `scripts/check-post-state-curriculum.mjs`, `scripts/check-guided-learning-orchestration.mjs`, and a dedicated `scripts/check-guided-final-capstone.mjs`; `tests/e2e/post-state-curriculum.spec.js` plus a focused capstone browser spec.

Required invariants:

1. State-only completion never routes to review while any core capital, checkpoint, physical introduction, or required physical retrieval is missing.
2. Selection is exactly 10 unique targets, always 4 state / 3 capital / 3 physical, all introduced, all geographically bucketed, and stable after serialize/reload.
3. Every capstone response emits the existing canonical `correct` or `incorrect` retrieval evidence for the correct concept and prompt skill; capitals retain their state relationship. No `assisted` event and no new introduction occurs.
4. Each of ten targets is asked once; incorrect answers finish the target and inform future review, but never gate final completion.
5. Reload, Back, and completed-child return preserve exact target order/attempt state, do not duplicate canonical events, and do not alter Journey progress or physical-review scheduling except through the existing retrieval evidence where intentionally wired.

Validation to add:

- Pure status fixtures for each missing class: one capital (including Juneau/Honolulu), one Reconstruction block, Alaska Range/Brooks introduction, and its practice completion. Assert no chooser/final-capstone eligibility until all are present, and no mastery/evidence-strength dependency.
- Selector tests for 4/3/3 counts, uniqueness, membership in introduced sets, family and geographic bucket coverage, fixed deterministic output, malformed/legacy persistence, and completed-block non-repeatability.
- Prompt/evidence tests for all entity types, especially capital location/naming mappings and a capital lacking naming evidence; assert exactly ten response events, no retries, and no pass cutoff.
- Reload/return tests for reload before the first prompt, after correct, after incorrect, and after final completion; assert one stable selection and no duplicated events. Also test Guided-only and full reset paths.
- Desktop and compact/mobile browser coverage for final state/capital/physical backlog routing, Alaska/Hawaii map access, no pre-answer disclosure, all ten prompts, completion after misses, and return behavior. Re-run current physical presentation, post-state review, Guided orchestration, and Journey restoration suites to protect camera and progress contracts.

### Read-only validation performed

- `node scripts/check-post-state-curriculum.mjs` — passed.
- `node scripts/check-guided-learning-physical-feature-orchestration.mjs` — passed (34 audited/orchestrated, zero geometry-deferred).
- `node scripts/check-guided-learning-orchestration.mjs` — passed.

No application code or tests were changed. This handoff is the only file created by the audit.

## Acceptance — Lead completes

- Diff and acceptance review; corrections made: accepted the inventory and fixed-attempt design after reviewing implementation and browser state. The Lead kept the capstone inside the persisted U.S. Guided session instead of adding a second orchestration child; this reuses the existing active-session snapshot, canonical item records, and reset boundary while preserving all required behavior. Release validation also found and repaired a pre-existing variable-shadowing defect that prevented ordinary Journey placement evidence from being written.
- Integrated test commands and outcomes: `npm test` passed 112/112. The serial affected browser matrix passed 96/98, with its two Journey-evidence failures passing 2/2 after repair. The continuation compatibility cases passed 4/4, and corrected release-smoke assertions passed 12/12 across desktop/mobile Chromium. See `docs/testing.md` for the proof boundary.
- Durable state/domain documentation updated, or why unnecessary: updated `docs/engineering-state.md`, `docs/guided-learning-orchestration-v1.md`, and `docs/testing.md`; this handoff now records the reviewed deviation from its proposed storage seam.
- Final status and remaining follow-up: implementation accepted for final Git review. Minor state-camera positioning remains explicitly deferred.
