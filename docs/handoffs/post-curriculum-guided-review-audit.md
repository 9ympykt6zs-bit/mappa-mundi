# Assignment: Audit post-curriculum Guided Learning routing and review balance

Status: accepted

## Brief — Lead completes before dispatch

- Objective and user-visible outcome: determine why United States Guided Learning continues into a repetitive capital-heavy subset after all state introductions, and recommend a reusable post-curriculum choice state with balanced learned-only Mixed U.S. Review, learned-only Physical Geography, and existing Map Reconstruction entry/return paths.
- Why delegation is more efficient than direct implementation: the defect may span curriculum eligibility, session planning, evidence state, physical-review routing, and UI completion transitions; a focused learning-systems audit can map these contracts before the Lead changes shared runtime behavior.
- Specialist role; selected supported model/effort and reason: temporary Content / Learning Systems specialist using `gpt-5.6-terra` at medium effort for a bounded scheduler and architecture audit.
- Agent/task identifier after dispatch: pending.
- Checkout/worktree path, branch, base revision, and pre-existing dirty files: shared checkout `/Users/ryanbarnhill/Documents/mappa-mundi`, branch `feature/evidence-driven-learning-foundation`, base `0fed514`; this handoff is the only expected dirty file.
- Relevant files, contracts, domain documentation, and concise context: read `AGENTS.md`, `docs/engineering-state.md`, the relevant Guided/evidence docs, `src/united-states-memory-trail-planner.js`, `src/guided-learning-orchestration.js`, `src/united-states-evidence-driven-continuation.js`, physical-feature orchestration, persistence, menu/runtime routing in `src/maplibre-poc.js`, focused scripts, and browser tests. Audit why capitals dominate, why a subset repeats, whether learned content is starved, and whether the cause is eligibility, evidence, routing, or review-pool construction.
- Allowed files/changes: read-only code audit; fill in this handoff's Handoff section only.
- Exclusions and behavior/data that must be preserved: do not edit application code or tests; preserve canonical evidence, mastery, Guided progress, existing physical family/mixed review behavior, Reconstruction, and the pacing behavior from `f24f1be`.
- Acceptance criteria: identify the exact root cause with code paths; define a durable completion predicate for all 50 states; recommend state/persistence shape and reusable routing for the choice screen; specify learned-only and balanced review pool construction that remains evidence-aware; specify launch and return contracts for all three choices; identify focused deterministic, reload/resume, and desktop/mobile browser tests.
- Required tests and manual/browser checks; environment constraints: read-only scripts or planner probes are allowed; no browser run is required. Record exact checks run and anything unverified.
- Return control to the Lead; no further delegation or unrelated edits: required.

## Handoff — specialist completes

### Finding

The repetitive capital run is caused by the U.S. Memory Trail planner, not by canonical evidence, mastery, Journey progress, or the physical-review pool.  Its inventory deliberately contains 50 state items and 50 capital items.  `getEligibleNewItems()` gives **every** eligible unseen capital global priority before it considers an unseen state (`src/united-states-memory-trail-planner.js:826-842`), and `buildUnitedStatesLearningPlan()` again prefers capitals within the selected section (`:566-577`).  Thus, once a section's states have been seen and passed their prerequisite, its capitals pre-empt every remaining state section.  After all states are introduced, all remaining new content is capitals; the planner continues to introduce them in small section batches.  It only switches to its cumulative review plan when no unseen item remains or no new item is eligible (`:230-240`), so the existing `allStatesIntroduced` plan flag (`:658`) has no routing effect.

The same 100-item interpretation also reaches Guided orchestration: `getGuidedLearningOrchestrationSnapshot()` calls every unseen state **or capital** unfinished non-physical learning (`src/maplibre-poc.js:3919-3929`).  That prevents the physical queue from being considered as a post-state-curriculum choice.  Evidence-driven continuation is a separate read-only readiness recommendation; it targets a state/capital section from Progress Report evidence (`src/united-states-evidence-driven-continuation.js:76-120`) and does not create this repeat.  The existing physical review selector is already learned-only: it derives introduced targets from completed introduction blocks, requires recorded retrieval history, selects due/weak targets first, and preserves family/mixed constraints (`src/guided-learning-orchestration.js:936-1135`).

### Recommended architecture

Treat completion of the **state-location introduction curriculum** as a distinct, derived routing milestone.  Define `stateCurriculumComplete` as: the validated curriculum has exactly 50 state items and every one has a status other than `unseen` under `createUnitedStatesMemoryTrailState`.  This is the existing `areAllUnitedStatesMemoryTrailItemsIntroduced(state, stateItems)` predicate, made explicit as the post-curriculum boundary.  It is durable because state item progress and `introducedItemIds` already survive reload; do not use capital status, canonical evidence strength, capital mastery, or a transient screen flag in this predicate.  Preserve an active U.S. trail session as the higher-priority resume state so an in-flight session cannot be replaced by the choice screen.

Add a small pure post-curriculum routing/view-model helper rather than changing the normal planner's eligibility rules.  Inputs: normalized U.S. trail state/items, Guided orchestration state/config, and canonical repository.  Output: `mode: "post-state-curriculum"`, `stateCurriculumComplete`, three choice descriptors, learned counts, enabled/disabled reasons, and deterministic trace data.  Persist no new "completed" boolean; it is derivable and avoids migration ambiguity.  Persist only an interrupted selected activity using the existing owner: U.S. review remains `activeSession` in `mappaUnitedStatesMemoryTrailProgress`; Physical Geography and Reconstruction retain the existing `mappaGuidedChildLaunch` block/return contract.  If a screen-local choice identity is required for reload before launch, keep a normalized `returnTo: "post-state-curriculum"` value in that already-durable child/return context, rather than creating another learner-progress store.

For **Mixed U.S. Review**, call a parameterized cumulative-review planner with a learned-only political pool: state items with a practice-eligible status, plus capital items only when that capital itself is practice-eligible.  Never promote an unseen capital because its related state is learned.  Select a fixed session size (the existing 10 is suitable) by the existing weak → due → lapse/miss → least-recently-seen → deterministic tie-break order, but apply balanced quotas before filling remaining slots: reserve one state when learned states exist, reserve one capital only when learned capitals exist, then fill from the global priority list; retain the existing fairness replacement only when it does not violate the available-type reservation.  The output must expose selected item type/counts and candidate counts so the inspector can prove no unseen target entered and one type did not starve the other.  When only one learned type exists, use that type without manufacturing the other.

For **Physical Geography**, do not route through the normal `hasUnfinishedNonPhysicalLearning` gate.  Build its choices from the existing repeatable physical-review pools and `getGuidedLearningPhysicalReviewEligibility`; each resulting target set is already introduced-only and evidence-aware.  Offer the next eligible family/mixed review using the established due/weak ordering and existing mixed three-family minimum.  If no review is due, show that explicitly; do not introduce a new physical feature from this choice screen.  This preserves the pacing/interleave behavior from `f24f1be` for the ordinary Guided sequence while making post-curriculum review a deliberate, learned-only action.

For **Map Reconstruction**, reuse the existing reconstruction child launch and completion/return machinery.  The choice should start an authored available Reconstruction region/capstone (the Lead can choose the product ordering), retain the existing canonical spatial-reconstruction evidence semantics, and return to the post-curriculum chooser.  It must not mark a Journey step or infer State Location evidence.

### Launch and return contracts

1. Completing the final state-introduction session saves the ordinary trail result first, clears its active session, then renders the post-state-curriculum choice screen.  Do not auto-start eligible capitals.
2. Mixed U.S. Review creates a normal U.S. trail `activeSession` whose plan is explicitly `post-state-curriculum-review`, contains no `newItems`, and stores the exact selected learned item IDs.  Reload resumes that exact plan; completion saves attempts through the existing canonical producer and returns to the choice screen.
3. Physical Geography launches an existing repeatable physical-review child with its exact target subset, cohort, generation, and `returnTo: "post-state-curriculum"` context.  Reload rehydrates the existing child contract; completion records its existing retrieval evidence/progress once and returns to the chooser.
4. Reconstruction launches an existing Guided child with its exact region/capstone.  Reload rehydrates it; completion preserves its existing evidence and returns to the chooser.  Manual/Journey launches continue to clear stale Guided provenance as today.

### Focused test plan

- Planner unit checks: a state-complete/capital-unseen fixture yields the chooser route; an incomplete-state fixture retains current learning behavior; an active legacy capital session resumes unchanged.  Assert the 50-state validation guard, derivation after serialize/load, and no capital state is altered by merely opening the chooser.
- Mixed-review deterministic checks: selected IDs repeat with a fixed seed/time; every item is introduced/practice-eligible; unseen capitals are absent; weak and due items retain priority; state/capital reservations hold when both pools are nonempty; one-type fixtures degrade cleanly; fairness does not break the balance rule.
- Physical routing checks: only `getGuidedLearningPhysicalReviewEligibility` target IDs are launched; no introduction block is selected; mixed review remains three-family when eligible; no-due state has a visible disabled explanation.  Keep the current physical pacing and canonical-evidence tests intact.
- Reload/resume checks: reload in each of the three launched choices and verify the exact U.S. review plan or Guided child subset is restored; finish each once and verify a single resulting evidence/progress update and return to the chooser.  Verify an already-active pre-existing U.S. capital session wins over chooser routing.
- Browser checks at desktop and compact/mobile widths: final state session reaches the choice screen; each choice launches its correct activity and returns; review does not reveal an answer before retrieval; physical/reconstruction retain their authored camera and back/continue behavior.  Include a manual browser check for a learner with states complete but zero capitals and for one with both learned states and capitals.

### Files inspected

`AGENTS.md`; `docs/engineering-state.md`; `docs/guided-learning-orchestration-v1.md`; `docs/learning-system-vision.md`; `docs/progress-evidence-policy.md`; `src/united-states-memory-trail-planner.js`; `src/maplibre-poc.js`; `src/guided-learning-orchestration.js`; `src/united-states-physical-feature-orchestration.js`; `src/united-states-evidence-driven-continuation.js`; `src/continuation-readiness.js`; `src/guided-child-launch-contract.js`; `scripts/check-united-states-memory-trail-planner.mjs`; `scripts/check-united-states-memory-trail-curriculum.mjs`; `scripts/check-united-states-memory-trail-persistence.mjs`; `scripts/check-united-states-guided-learning-targeted-entry.mjs`; `scripts/check-evidence-driven-united-states-continuation.mjs`; `scripts/check-guided-learning-physical-feature-orchestration.mjs`; and `tests/e2e/guided-learning-orchestration.spec.js`.

### Read-only validation performed

- `node scripts/check-united-states-memory-trail-planner.mjs` — passed.
- `node scripts/check-united-states-memory-trail-curriculum.mjs` — passed (50 states, 50 capitals, valid links).
- `node scripts/check-united-states-memory-trail-persistence.mjs` — passed.
- `node scripts/check-united-states-guided-learning-targeted-entry.mjs` — passed.
- `node scripts/check-evidence-driven-united-states-continuation.mjs` — passed.
- `node scripts/check-guided-learning-physical-feature-orchestration.mjs` — passed (34 audited/orchestrated; zero geometry-deferred).

No browser run was required by the assignment, and no application code or tests were changed.

## Acceptance — Lead completes

Accepted after Lead diff review and corrections. The final implementation adds a distinct post-state-curriculum screen, near-even learned state/capital political sessions, due learned physical review within Mixed U.S. Review, a review-only Physical Geography route, and a configured repeatable lower-48 Reconstruction child. The Lead added desktop/mobile browser coverage for choice rendering, learned-only selection, reload, and return paths. `npm test` passed 109/109; the focused browser suite passed 6/6; eight broader Guided checks passed; desktop/mobile screenshots were inspected; syntax checks and `git diff --check` passed before commit.
