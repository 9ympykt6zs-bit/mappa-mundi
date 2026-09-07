# Assignment: Audit Guided physical-geography pacing

Status: complete and accepted

## Brief — Lead completes before dispatch

- Objective and user-visible outcome: determine why Guided Learning introduces mountains, rivers, and lakes too slowly and repeatedly reviews small early subsets; return a concrete, evidence-backed root-cause analysis that the Lead can use to implement 2–3 item introduction batches, immediate consolidation, broader coverage, varied end-state review, and mixed-category review.
- Why delegation is more efficient than direct implementation: inventory and scheduler-state tracing are a bounded analytical task that can independently verify the Lead's architectural reading without competing edits.
- Specialist role; selected supported model/effort and reason: Content / Learning Systems; `gpt-5.6-terra`, high reasoning, for a focused code/data audit with lower context cost than a full-history specialist.
- Agent/task identifier after dispatch: `/root/physical_pacing_audit`.
- Checkout/worktree path, branch, base revision, and pre-existing dirty files: shared checkout `/Users/ryanbarnhill/Documents/mappa-mundi`, branch `feature/evidence-driven-learning-foundation`, base `e6add0a`; only this handoff file is expected to be dirty at dispatch.
- Relevant files, contracts, domain documentation, and concise context: inspect `src/united-states-physical-feature-orchestration.js`, `src/guided-learning-orchestration.js`, `src/guided-physical-retrieval-checkpoint.js`, `src/united-states-evidence-driven-continuation.js`, physical activity data under `assets/maps/data/`, canonical evidence/progress adapters, and focused checks. The user specifically observed White/Green/Adirondack and Arkansas/Mississippi/Ohio repetition after Colorado/New Mexico state progress.
- Allowed files/changes: read-only audit. Update only the Handoff section of this file with findings if helpful; otherwise return findings to the Lead. Do not modify application code, tests, or other documentation.
- Exclusions and behavior/data that must be preserved: do not implement or commit; do not alter evidence meanings, mastery, persisted state, activities, coordinates, cameras, or existing Guided checkpoints.
- Acceptance criteria: enumerate mountain/river/lake inventory and current cohorts; distinguish unsupported/missing content from blocked/eligible/introduced/reviewed state; trace state prerequisites and Evidence-Driven Continuation interaction; identify the exact causes of one-at-a-time introduction and repeated early subsets; identify existing seams suitable for batching, immediate retrieval, varied review, and mixed review; flag persistence/migration risks.
- Required tests and manual/browser checks; environment constraints: use existing deterministic checks or small read-only probes where useful. Report commands and results. No browser run is required for the audit.
- Return control to the Lead; no further delegation or unrelated edits: required.

## Handoff — specialist completes

### Result

Audit complete; no application, test, or content files changed. The observed repetition is reproducible from the current deterministic cohort selector rather than missing mountain/river content.

#### Inventory and current retrieval coverage

| Family | Authored / supported | Current Guided retrieval cohorts | Introductions without a safe Guided cohort |
| --- | --- | --- | --- |
| Rivers | 8 / 7; St. Lawrence River is deferred for incomplete geometry | `western-rivers`: Colorado, Columbia, Rio Grande; `central-eastern-rivers`: Arkansas, Mississippi, Missouri, Ohio (St. Lawrence is configured but unsupported) | None of the seven supported rivers |
| Lakes | 6 / 6 | None | Superior, Michigan, Huron, Erie, Ontario, Great Salt Lake |
| Mountain ranges | 20 / 20 | `northeast-mountains`: White, Green, Adirondack; `central-mountains`: Ozark, Ouachita, Black Hills; `alaska-mountains`: Alaska, Brooks | Rocky, Cascade, Sierra Nevada, Allegheny, Blue Ridge, Great Smoky, Cumberland, Coast Ranges, Olympic, Wasatch, Teton, Appalachian |
| Coasts | relationship evidence only | None | Deliberately outside the physical-location objective |

The five configured cohorts have a minimum of two and preferred size of three, except Alaska whose preferred size is two. Lakes and the twelve listed mountains are fully supported for teaching and Connections; their `deferred-no-safe-small-cohort` status is specifically about Guided locating retrieval, not missing geometry/content.

#### Exact pacing causes

1. Every feature requires coverage of *all* related states before it is eligible. `covered` accepts only canonical `correct` or `assisted` state-location/state-naming evidence. There are no current prerequisite overrides. This is intentionally conservative but makes simultaneous eligibility rare in ordinary state progression. Key observed cohorts: White = Maine + New Hampshire; Green = Vermont; Adirondack = New York. Arkansas River = Colorado + Kansas + Oklahoma + Arkansas; Mississippi = ten states; Missouri = seven; Ohio = Pennsylvania + Ohio + West Virginia + Kentucky + Indiana + Illinois. Thus White/Green can batch while Adirondack commonly arrives later, and central/eastern river members become available on widely different milestones.
2. `createDynamicPhysicalIntroductionBlock` starts from one queued feature and only adds currently eligible, unintroduced siblings from *that same cohort*, up to `preferredRetrievalSize`. It has no cross-cohort/family batch planner and does not wait briefly to form a 2–3-item batch. A lone eligible member is therefore taught alone; retrieval correctly defers until a second introduced member exists.
3. The early subsets are deterministic by authored member order. `selectPhysicalCohortRetrievalSubset` adds a new member, then fills comparison slots from the beginning of the cohort. With Arkansas/Mississippi/Missouri already retrieved and Ohio newly introduced, the actual result is `[arkansas-river, mississippi-river, ohio-river]`; Missouri is displaced. With White/Green retrieved and Adirondack newly introduced, the result is all three. This exactly explains the reported Arkansas/Mississippi/Ohio and White/Green/Adirondack patterns.
4. Later spaced reviews vary prompt *order* only. `createDeterministicGuidedPhysicalRetrievalOrder` rotates order by generation and avoids the immediately prior full order, but review composition is the due set plus first eligible authored companions. When all three are due, the same three targets recur. There is no cohort-composition rotation, recency budget, or cross-cohort mixed-review block.
5. Interleaving is real and can lengthen perceived pacing. Completing a physical sequence/review sets `physicalInterleaveRequired`; one completed Guided state session or Reconstruction clears it while non-physical curriculum remains. In-progress individual connection blocks are selected ahead of this gate, so a multi-member batch can still lead to several individual Connections before the normal planner resumes.

#### Immediate retrieval and continuation behavior

- The existing handoff is correct when a cohort is retrieval-ready: after teaching finishes, `continueAfterGuidedPhysicalTeaching` immediately launches the selected physical-practice block. The checkpoint gives each target one locating attempt and only one delayed retry after other initial targets.
- A one-member cohort deliberately returns to normal Guided Learning instead. That protects against a one-answer loop but, combined with strict prerequisite timing, is the concrete source of slow introductions.
- Direct Guided entry (`targetedNeed` absent) can schedule physical features as soon as state prerequisites are covered. Evidence-Driven Continuation first requires the states-and-capitals objective, then routes to one whole physical family (`rivers`, then the current weakest/building family) and filters the orchestration to that family. These two entry paths therefore produce different pacing.
- Continuation is family-level, not item/cohort-level. It cannot ask the orchestrator for a varied or mixed review and can repeatedly route to a family whose remaining Guided work is unavailable or only assisted teaching. The progress report also combines direct locating mappings with authored Connection mappings; correct Connections can improve a physical item/family despite no independent locating retrieval. Great Salt Lake has neither a cohort nor Connection, so its Guided path records assisted exposure only and has no Guided independent-location path.

#### Existing architectural seams for the requested change

| Need | Best existing seam | Change shape |
| --- | --- | --- |
| 2–3 item introduction batches | `UNITED_STATES_PHYSICAL_LEARNING_COHORTS`; `createDynamicPhysicalIntroductionBlock`; `completeGuidedLearningPhysicalFeatureIntroductions` | Add a pure batch selector with tunable min/max, eligibility snapshot, and an explicit policy for cross-cohort/family mixing. The existing multi-introduction persistence and evidence emitter already accept multiple introduction block IDs. |
| Immediate consolidation | `selectPhysicalCohortRetrievalSubset`; `createDynamicPhysicalPracticeBlock`; `continueAfterGuidedPhysicalTeaching` | Preserve the current direct handoff, but select a comparison set for a lone/new member from recently taught compatible targets, subject to a two-target minimum. Keep retrieval target unhighlighted. |
| Prevent early-cohort starvation | `physicalQueue`/`physicalReviewQueue` in `selectGuidedLearningOrchestrationBlock` | Add a bounded fairness/recency policy before authored-order filling: avoid reusing the same companion pair when other introduced members are available; reserve a new-introduction slot before due review monopolizes a family. |
| Varied review | `getGuidedLearningPhysicalReviewEligibility` and `createDeterministicGuidedPhysicalRetrievalOrder` | Rotate *membership* as well as order, record recent subsets, cap a checkpoint at 2–3 targets, and retain weak-target priority without always choosing the earliest authored companions. |
| Mixed review | `createPhysicalReviewBlocks` plus `selectGuidedLearningOrchestrationBlock` | Add a repeatable mixed physical-review block/selector that draws only introduced targets across compatible families/cameras. Do not force unsupported lakes/mountains into fabricated distractors; define safe mixed cohorts/cameras explicitly. |

#### Persistence and migration risks

- `mappaGuidedLearningOrchestration` version 5 stores completed block IDs, active teaching cursor, retrieved cohort targets, event counter, review generation/order, and per-target due data. Normalization is permissive and does not perform a versioned migration or retain a cohort/config fingerprint. Changing cohort membership/order or batch policy can silently drop invalid target records or reinterpret saved `previousOrder`/retrieved sets.
- `mappaGuidedChildLaunch` persists the dynamic target subset and may rehydrate it after code/config changes. A new batch selector needs an explicit compatibility rule for an in-flight child: preserve its stored target IDs if still valid, otherwise safely defer/recompute rather than completing unseen siblings.
- Canonical evidence is stored independently. Reset/loss asymmetry can leave completed introductions without prerequisite evidence, or evidence without orchestration completion. Avoid making assisted introduction events imply independent retrieval during migration; they are exposure-only under the progress policy.
- Review timing currently counts completed non-physical Guided sessions/checkpoints, not openings. Retain that invariant when adding fairness so a due weak target cannot be endlessly postponed, while also ensuring it has a real comparison target.

### Verification

Read-only commands passed:

- `node scripts/check-guided-learning-physical-feature-orchestration.mjs`
- `node scripts/check-guided-physical-retrieval-checkpoint.mjs`
- `node scripts/check-guided-learning-orchestration.mjs`
- `node scripts/check-evidence-driven-united-states-continuation.mjs`

Additional deterministic probes confirmed the exact subset transitions above: White/Green -> White/Green/Adirondack and Arkansas/Mississippi/Missouri -> Arkansas/Mississippi/Ohio. No browser run was needed for this audit.

## Acceptance — Lead completes

Accepted. The Lead independently inspected the inventory, scheduler, continuation routing, evidence adapter, runtime launch path, and focused tests, then implemented the bounded design. The final system uses thirteen two- or three-target introduction cohorts with immediate retrieval, removes lower-48 all-related-state gates while retaining the Alaska disconnected-region gate, selects unseen cohorts ahead of repeat review, adds rotating family review and introduced-only lower-48 mixed review, and preserves per-target canonical entity types. Connections remain available through targeted continuation without interrupting cohort consolidation. The Lead repaired the mixed-review child-launch/rehydration contract after a browser regression exposed a partial handoff, reviewed the integrated diff, and recorded final verification in `docs/testing.md`.
