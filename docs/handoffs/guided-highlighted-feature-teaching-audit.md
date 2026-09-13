# Guided highlighted-feature teaching audit

- Status: Complete — accepted by Lead
- Date: 2026-09-12
- Lead: `/root`
- Specialist role: Content / Learning Systems
- Base commit: `a06caf6`
- Branch: `feature/evidence-driven-learning-foundation`

## Objective

Audit Guided Learning introductions for states and physical-feature families. Identify the smallest shared teaching pattern that gives one family-level instruction, then highlights, names, and requires an assisted click on each target without changing batching, retrieval, evidence, or camera behavior.

## Relevant context

Start with:

- `src/maplibre-poc.js`
- `src/maplibre/maplibre-activity-runner.js`
- `src/guided-learning-orchestration.js`
- `src/united-states-physical-feature-orchestration.js`
- `src/canonical-learning-evidence.js`
- existing Guided teaching and audio checks under `scripts/` and `tests/e2e/`
- `docs/guided-learning-orchestration-v1.md`

## Boundaries

- Read-only audit. Update only the Handoff section in this file.
- Do not modify application code or tests.
- Preserve 2–3 physical cohorts, immediate focused retrieval, canonical assisted evidence, state/capital behavior, cameras, pan/zoom, and persistence.
- Do not redesign unrelated activity modes or delegate further.

## Acceptance criteria

Return a concise handoff that identifies:

1. current state and physical teaching state-machine paths;
2. current visible prompt and audio sequencing for state, mountain, river, lake, and any other physical family;
3. current wrong-map-click behavior and evidence effects;
4. the smallest reusable family metadata/helper boundary;
5. reload/resume and audio-deduplication constraints;
6. exact focused script/browser checks to add or update.

## Testing expectations

No test run is required for this audit. Identify the most relevant existing checks and assertions.

## Handoff

### Findings

1. State and physical learning use separate state machines. State/capital introductions stay in the Memory Trail `guided` / `learn` path (`startMemoryTrail`, `chooseNextPrompt`, `handleMemoryTrailTargetTap`); its prompt is highlighted-place retrieval and its canonical guided event is emitted by the retrieval adapter. Physical introductions use the explicit orchestration cursor in `guided-learning-orchestration.js`: `beginGuidedLearningPhysicalTeaching` normalizes `teachingTargetIds`, `taughtTargetIds`, and `currentTargetId`; `recordGuidedLearningPhysicalTeachingTarget` advances one member; the UI mirrors that cursor in `activeStudySession.guidedPhysicalTeaching`. `saveActiveGuidedLearningOrchestrationBlock` starts/resumes it, and completion then launches the same cohort's focused locating checkpoint.

2. Physical metadata already supplies the reusable family boundary. `united-states-physical-feature-orchestration.js` centralizes `family`, `teachingVerb`, `teachingMessage`, canonical concept ID, target label, geometry, cohort membership, and camera. Current authored family messages are “White Mountains extends across New Hampshire…”, “Mississippi River flows through or alongside…”, and “Lake Erie borders…”. For multi-target dynamic cohorts, the message becomes `Compare <names>. Notice where each belongs in the region.` Current cohorts are 2–3 members; all supported mountain ranges, rivers, and lakes use the same generated introduction/practice block shape.

3. Visible sequencing is already Show → Name → Highlight → assisted tap, but the family instruction is text-only. On physical launch, `startStudyPreviewActivity` creates the cursor and `updateGuidedPhysicalTeachingVisualState` sets the target highlight, panel text (`Tap the highlighted <target>.`), and target-name speaker. It calls `speakStudyPreviewTarget`, which speaks the name through `GeographyChipSpeech`; the family-level `teachingMessage` is assigned to `instruction` only when no physical teaching cursor exists, so it is not narrated in the explicit per-target path. Mountains use symbol plus outer halo; rivers use line plus halo; lakes use fill/line plus halo, with non-target context muted. States use the existing Memory Trail Learn instruction (`Learn this/these ...`, then `Tap the highlighted place/capital`) and its target speech-after-instruction sequencing.

4. A wrong physical map click is intentionally non-evidentiary. `handleGuidedPhysicalTeachingTap` evaluates the candidate against the expected target; a wrong selection only shows `Look for the highlighted ...`, keeps the same cursor/highlight, and rerenders the panel. It does not write canonical evidence, advance teaching, add an incorrect retrieval, or alter review timing. A correct assisted tap writes one `assisted` locating event via `createPhysicalFeatureIntroductionEvidence`, advances persistence, and only the final member completes the introduction. The focused follow-up uses `guidedLocatingOnly`, removes highlights before independent responses, and records ordinary correct/incorrect locating evidence.

5. Reload/resume is cursor-safe. The persisted orchestration state is version 6; normalization drops invalid IDs, filters taught IDs to the active teaching set, and selects the first untaught member. Re-entering a deferred block reconstructs the same cohort and resumes at that member. Existing browser coverage verifies no duplicate canonical event after the first member is taught and the introduction eventually emits exactly one assisted event per member. `resetAudioInstructionState` runs on study open. Memory Trail instruction audio has prompt/session dedupe keys and target speech is once per prompt key; explicit physical teaching currently calls `speakStudyPreviewTarget` directly on visual-state updates and has no equivalent target-key dedupe. This is the main audio constraint if rerenders or resume behavior are changed.

### Smallest reusable recommendation

Keep eligibility, batching, cohort ordering, cameras, and evidence adapters unchanged. Extract only a family presentation descriptor/helper at the physical boundary (family noun/verb, target label, concept ID, geometry family, and the family-level instruction), and let the existing cursor/UI/runner consume it. The runner's `setGuidedPhysicalTeachingHighlight` already provides the generic family dispatch (`mountain-range`, `river`, `lake`); the missing shared seam is a target-keyed teaching cue that renders the family instruction once, names/highlights one target, accepts only the assisted tap, and deduplicates target audio. State/capital Memory Trail should continue using its own prompt/audio path.

### Focused checks

- Node: `node scripts/check-guided-learning-orchestration.mjs` for cohort metadata, cursor advancement, resume normalization, assisted evidence, and prerequisite semantics.
- Node: `node scripts/check-canonical-physical-evidence.mjs` for river, lake, mountain, and mixed-family canonical locating/naming identity.
- Node: `node scripts/check-guided-physical-teaching-highlight.mjs` for family-specific highlight layers, context suppression, pulse lifecycle, reduced motion, and stale callback cleanup.
- Browser: `npx playwright test tests/e2e/guided-learning-orchestration.spec.js --grep "generated (river|lake) batch|interrupted physical teaching|physical teaching"` (or the equivalent focused project command) should assert the family instruction, exact per-member name/highlight order, wrong-click no-op evidence, assisted event count, immediate locating pool, and reload resume for at least one river and one lake in addition to the existing mountain cohort.
- Browser: `npx playwright test tests/e2e/guided-physical-presentation.spec.js` should retain desktop/mobile camera and rendered-layer assertions; add a speech spy around `GeographyChipSpeech` to assert one family cue and one target name per target despite panel/visual rerenders, with no duplicate name after reload.

### Lead acceptance

The Lead reviewed the audit and implemented the shared family-copy boundary while keeping the state Memory Trail and physical orchestration state machines separate. Physical audio now sequences one family cue before target names, target audio is keyed against rerenders, wrong state and physical teaching taps remain non-evidentiary, and reload resumes the persisted physical target. Final validation passed the **111/111** fast baseline and **18/18** selected desktop/mobile Guided browser cases.
