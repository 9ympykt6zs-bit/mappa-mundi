# Mountain-range progression and review audit

- Status: Accepted
- Date: 2026-09-13
- Lead: `/root`
- Specialist role: Content / Learning Systems
- Base commit: `fba1d9d`
- Branch: `feature/evidence-driven-learning-foundation`

## Objective

Audit why Alaska Range and Brooks Range can appear or repeat while Guided Learning is around Alabama, and recommend the smallest deterministic change that keeps physical cohorts, immediate retrieval, and evidence semantics intact while ordering mountain introductions east to west and diversifying later review.

## Relevant context

Start with:

- `src/united-states-physical-feature-orchestration.js`
- `src/guided-learning-orchestration.js`
- `scripts/check-guided-learning-physical-feature-orchestration.mjs`
- `scripts/check-guided-learning-orchestration.mjs`
- `tests/e2e/guided-learning-orchestration.spec.js`
- `docs/guided-learning-orchestration-v1.md`
- `docs/testing.md`

Current metadata includes `regionalStage`, `maximumLeadStages`, and `curriculumOrder`. Alaska also has a disconnected-state hard prerequisite and a separate two-target review pool. The new product direction permits Alaska mountain introduction before Alaska state teaching, but only after materially earlier mountain cohorts and late in the east-to-west sequence.

## Boundaries

- Read-only audit. Update only the Handoff section of this file.
- Do not modify application code or tests.
- Do not delegate further.
- Preserve 2–3 target introduction batches, immediate focused retrieval, family and mixed review, canonical evidence, cameras, Guided state progression, Reconstruction, and rivers/lakes unless evidence shows their ordering also needs a focused correction.
- Distinguish fresh selection defects from persisted legacy progress that is already introduced.

## Acceptance criteria

Return a concise handoff that identifies:

1. the exact introduction path that could let Alaska leapfrog, including targeted-family selection and legacy/persisted state;
2. a maintainable east-to-west mountain cohort order and a bounded lead rule;
3. the prerequisite/migration effect of allowing Alaska mountains before Alaska state teaching;
4. why the separate Alaska review pool can repeat and the smallest fair selection rule;
5. whether rivers/lakes need code changes;
6. exact deterministic and browser regressions to add.

## Testing expectations

No tests are required for the audit. Identify existing fixtures to extend and the state transitions the Lead should prove.

## Handoff

### Result

Audit complete. No application code or tests changed. The current checkout already contains the regional-introduction fix from `d685d5c`; the remaining Alaska behavior is a persisted-review and review-selection issue.

The original Alaska leapfrog has a precise cause. Before `d685d5c`, lower-48 physical introductions had no geographic eligibility gate. Every feature was eligible after the first Reconstruction checkpoint unless its authored state prerequisites blocked it. Alaska ranges had a disconnected-state prerequisite, so a retained canonical `state-location:alaska` or `state-naming:alaska` event gave them a finite eligibility milestone. Lower-48 features generally had no prerequisite milestone (`Infinity`). `comparePhysicalFeatureQueueEntries` compared that milestone before `curriculumOrder`, so covered Alaska could sort ahead of all unseen lower-48 cohorts. Evidence-Driven Continuation filters to a family, but does not choose a range; targeted mountain entry therefore inherited the same leapfrog path.

That defect is distinct from a truly clean current run. The current selector derives a contiguous state frontier from Guided `introducedGuidedStateItemIds`, filters unseen physical cohorts by `regionalStage + maximumLeadStages`, and then sorts by stage/order. Around Alabama (stage 4), the Alaska cohort is geographically blocked at stage 11, while the eastern and Appalachian mountain cohorts are ready. A Guided-only reset removes orchestration `completedBlockIds` but intentionally preserves canonical evidence; old completed Alaska introductions can therefore remain reviewable after reset even though fresh introductions are correctly gated.

### Current review behavior and repetition cause

`createPhysicalReviewPools` keeps lower-48 mountain ranges in `physical-family-review:mountain-range` and Alaska Range/Brooks Range in the two-target `physical-region-review:alaska-mountains` pool. The Alaska pool becomes eligible once both old introduction blocks and retrieval records exist, independently of the learner's current state frontier. The review queue prioritizes any weak-due target, then earliest due event, then pool `curriculumOrder`; targeted mountain entry narrows this to mountain pools. Consequently, if legacy Alaska records are due or weak while the lower-48 family pool is not eligible (it requires the whole lower-48 family to be introduced), the Alaska pool is the only eligible mountain review and can be selected repeatedly. Its two members are necessarily reviewed together, and due weak status can keep winning across later learning events. Review eligibility correctly does not introduce unseen targets, so this is not an introduction-prerequisite failure.

The smallest fair correction is to keep evidence-driven due/weak priority but add pool-level diversity state: remember the last selected review pool (and existing target membership/generation), and when multiple introduced pools are eligible give an equally due alternative a turn before selecting the same pool again. For the mountain family, prefer the broad introduced lower-48 pool whenever it has enough introduced members; do not let the Alaska two-target pool monopolize targeted review solely because it is due. If Alaska is the only eligible pool, it may still run, but the next eligible alternative should outrank a repeated same-pool selection. Keep weak targets in the selected pool, preserve minimum comparison sizes, and leave the one-real-nonphysical-session interleave unchanged. Persist this as scheduling metadata with normalization/version compatibility; do not erase legacy evidence or reinterpret old attempt outcomes.

### Recommended explicit introduction model

Keep immutable cohort metadata and make the ordering contract explicit. The current `regionalStage`, `maximumLeadStages`, and `curriculumOrder` fields are the right seam; selection should never fall back to random unseen-cohort selection or prerequisite timestamp ordering. For mountains, the intended order is:

| Order | Cohorts | Stage / lead guidance |
| --- | --- | --- |
| 1 | Northeast mountains | stage 1, no lead |
| 2 | Southern Appalachian ranges; Appalachian system ranges | stage 3, at most one adjacent-stage lead |
| 3 | Central mountains | stage 7, at most one-stage lead |
| 4 | Western major mountains, including Rockies | stage 8, at most one-stage lead |
| 5 | Interior-West ranges | stage 9, at most one-stage lead |
| 6 | Pacific ranges | stage 10, at most one-stage lead |
| 7 | Alaska mountains (Alaska Range and Brooks Range) | stage 11, zero lead, plus the existing covered-Alaska hard prerequisite |

The exact stage numbers can remain aligned to the authored eleven state sections. A cohort may lead state teaching by one adjacent section, and broad ranges such as the Rockies do not need all associated states taught first. Alaska ranges may appear before Alaska state teaching only if the curriculum explicitly reaches their late stage and the existing Alaska navigation/context evidence gate is satisfied. They must not be eligible during the early southeastern/alabama progression. Once a later frontier is reached, the oldest ready unseen stage drains first, so skipped earlier cohorts cannot starve.

Rivers and lakes already use the same broad stage/lead metadata in this checkout: eastern rivers and Great Lakes at stage 5, central rivers at 6, central mountains at 7, western rivers and Rockies at 8, with Great Salt Lake intentionally retained in its approved Erie/Ontario comparison cohort. No separate rivers/lakes ordering change is indicated by this audit. They should inherit any shared review-fairness correction while retaining their family and camera contracts.

### Regression coverage to add or preserve

- In `scripts/check-guided-learning-physical-feature-orchestration.mjs`, assert the full sorted cohort metadata, Alaska `[regionalStage: 11, maximumLeadStages: 0]`, and that all 20 mountain targets remain supported and assigned to a cohort.
- In the scheduler checks, from a fresh state around Alabama (frontier stage 4), targeted mountain entry must select the oldest ready eastern/Appalachian unseen cohort; it must not select Alaska Range or Brooks Range. A retained canonical Alaska event and a legacy state with completed Alaska introduction/retrieval must still leave Alaska geographically blocked for new introduction.
- Prove Rockies become eligible at stage 8 before Colorado and every other Rocky Mountain state is introduced, while Alaska becomes eligible only at stage 11 plus covered Alaska evidence. Test targeted-family routing, out-of-order/partial Alaska state introductions not advancing the contiguous frontier, oldest-ready backlog drainage, immediate focused retrieval, deterministic replay, mixed review, and persistence/reload.
- Add review fixtures with due Alaska plus introduced lower-48 mountain targets. Verify the first eligible review preserves weak-target priority, but repeated calls after completion rotate to another eligible introduced pool/target set when one exists; Alaska may run when it is the only eligible pool. Existing `tests/e2e/guided-learning-orchestration.spec.js` and physical-presentation browser coverage should verify the same fresh reset, child reload, immediate retrieval, mixed-review, and Alaska camera flows.
- Run the focused scheduler scripts, the Guided desktop/mobile browser matrix, and `git diff --check`; this audit itself did not run browser checks.

### Verification

Read-only source/history inspection and deterministic Node probes were performed. The current config reports Alaska at stage 11 with zero lead and the first fresh targeted mountain selection at the Northeast cohort. With legacy Alaska introduction and due review records persisted, Alaska review remains eligible independently of the Alabama frontier; this is the behavior the review fairness change must address. No code, tests, or runtime state were modified.

### Lead integration

The Lead accepted the root-cause and review-pool findings, then implemented the current product direction over the audit's older zero-lead recommendation. Alaska remains the final mountain cohort but may lead the state frontier by two sections after the Southwest; every earlier mountain cohort must already be introduced, and Alaska state evidence is no longer a hard prerequisite. The lower-48 mountain review pool can run after three introduced ranges have retrieval history, the Alaska pool waits for every earlier mountain introduction, and the persisted last-completed pool provides one-turn rotation when another pool is eligible. Rivers and lakes inherit deterministic same-family introduction order while retaining their existing stages, lead allowances, and family-complete review thresholds.

Lead review passed the complete **111/111** fast baseline, **24/24** desktop/mobile Guided orchestration cases, and **6/6** focused desktop/mobile physical-presentation cases. Final diff hygiene is recorded in `docs/testing.md`.
