# Assignment: Audit Guided political camera regression

Status: accepted

## Brief — Lead completes before dispatch

- Objective and user-visible outcome: compare Guided state-camera behavior before and after `0fed514eb0a0d272c8dcb3d4073fb748733d61ea`, identify why small northeastern states became too tightly framed, and recommend the smallest camera policy that preserves useful authored/regional context while correcting genuinely over-distant western views.
- Why delegation is more efficient than direct implementation: this requires a bounded visual/map audit across historical runtime behavior, authored activity cameras, MapLibre fit math, responsive safe frames, and a dozen representative states. A UI/map specialist can isolate the policy and concrete state set while the Lead retains implementation and integration ownership.
- Specialist role; selected supported model/effort and reason: temporary UI / UX map specialist using `gpt-5.6-terra` at medium effort for a read-only camera and history audit.
- Agent/task identifier after dispatch: `/root/guided_camera_audit`.
- Checkout/worktree path, branch, base revision, and pre-existing dirty files: shared checkout `/Users/ryanbarnhill/Documents/mappa-mundi`, branch `feature/evidence-driven-learning-foundation`, base `a332fe3`; this handoff is the only expected dirty file.
- Relevant files, contracts, and context: inspect `0fed514^..0fed514`, `src/maplibre-poc.js`, `src/united-states-guided-political-camera.js`, activity JSON camera metadata, `src/maplibre/maplibre-activity-runner.js`, `docs/guided-political-camera.md`, camera scripts, and `tests/e2e/guided-political-camera.spec.js`. Audit New Hampshire, Vermont, Rhode Island, Massachusetts, Colorado, New Mexico, Montana, Wyoming, California, Texas, Alaska, and Hawaii.
- Allowed files/changes: read-only code/history/data audit; fill in this handoff's Handoff section only. Screenshots under `/tmp` are allowed.
- Exclusions and preserved behavior: do not edit application code/tests; do not change scoring, evidence, Guided sequencing, hidden-answer locating search space, physical/Reconstruction cameras, pan/zoom, Alaska/Hawaii authored handling, or capital city-context framing. Do not propose tuning all 50 states without evidence.
- Acceptance criteria: inventory existing authored/manual state and regional cameras; identify affected western states and acceptable controls; explain the regression; recommend precedence among authored, contextual, and fallback fit; specify any targeted overrides with rationale; define deterministic and browser/visual acceptance checks at desktop/mobile sizes.
- Required checks and manual/browser work: historical/source inspection and deterministic probes are expected; full browser execution is optional for the audit. Record actual commands, screenshots, and unverified boundaries.
- Return control to the Lead; no further delegation or unrelated edits: required.

## Handoff — specialist completes

Completed 2026-09-09 — read-only audit.

### Findings

- `0fed514eb0a0d272c8dcb3d4073fb748733d61ea` added `scheduleUnitedStatesGuidedStateFocusCheck` to every prompt selection and restore. For every lower-48 Guided `guided` or visible `place_to_name` prompt it resolves the current state and calls `runner.focusTargetIfNeeded(..., { force: true, maxZoom: 7.25, ... })`. The runner's normal shape-target path fits that state's complete geometry with the supplied padding. `force: true` means a reasonable existing section or authored camera cannot prevent that move.
- Before that commit, Guided political learning had one camera per active teaching cohort: either its exact authored `guidedLearningCameraOverrides` camera or a bounded active-section `fitTargets` view (maximum zoom 5.35). That camera persisted through prompts; hidden-answer `name_to_place` already retained the same wider search space. There was no generic per-state authored camera inventory before `0fed514`.
- The only existing Guided authored override is `assets/maps/data/us-states-capitals-09.json`'s `utah-arizona` camera: center `[-109.01691, 37.55051]`, zoom `4.7034`. It deliberately frames both states. The new forced individual-state fit still supersedes it during the Utah/Arizona teaching and visible-identification prompts, so the current implementation violates the intended authored-camera precedence as well as narrowing small states.
- The activity data has no `focusLon`, `focusLat`, `focusZoom`, or `focusBounds` for the audited state features. Existing `dailyTrail*` cameras in sections 01–11 are Daily Trail/non-learning controls, not Guided state-teaching controls. Alaska and Hawaii have their separate section-11 handling and must remain outside lower-48 policy.
- The `UNITED_STATES_GUIDED_STATE_FOCUS_MIN_ZOOM = 4.7` value is currently metadata only. The actual move passes `maxZoom: 7.25`; it does not enforce a 4.7 floor. The resulting documented claim that feasible lower-48 views "meet" 4.7 is therefore not an implementation guarantee. The visible New Hampshire regression follows from the 7.25 maximum complete-state fit, not from applying 4.7 as a universal minimum.
- Historical regression coverage confirms the original distant-view concern was cohort-level rather than a per-state camera defect. Before `0fed514`, the checks specifically exercised western/central active cohorts `us-states-07`, `us-states-08`, and `us-states-10` under the section-fit policy, with only a broad lower bound of zoom `> 3.4`; the preceding minimum-zoom audit called out section 07/10 compact views. The repository contains no historical evidence that New Hampshire, Vermont, Rhode Island, Massachusetts, or other northeastern states had bad contextual section framing. Nor is there evidence for a complete 50-state per-state-camera table.

### Recommended policy

1. Restore the section camera as the normal Guided political teaching and identification camera. Keep the exact `utah-arizona` authored override authoritative; otherwise retain the existing active-cohort fit and its responsive padding. Keep hidden-answer locating unchanged.
2. Do **not** schedule a universal prompt-level complete-state fit. A state should receive a correction only when its inherited section camera is demonstrably too distant for the current viewport, evaluated after the section/authored camera has been applied.
3. Implement that correction as a small, explicit state-context policy at the Guided seam, with this precedence: (a) reasonable exact authored state/cohort camera, (b) reasonable contextual section camera, (c) a targeted state-context camera or bounded fit only for a measured bad case. A correction must include neighboring context and should use a context-oriented maximum zoom well below the current 7.25 complete-state maximum. It must not apply solely because a state is small.
4. The current evidence supports measuring correction candidates in the western/central cohorts 07, 08, and 10 first (including the requested Wyoming, Colorado, New Mexico, Montana, California, and Texas checks). It does **not** support naming all of those as overrides before visual comparison: the old defect was produced by multi-state cohort bounds, so a given state may already be acceptable once the section camera is restored. If a correction remains necessary, add only the measured state IDs/cameras, with data-level rationale, rather than a heuristic that changes every state.
5. Retain section 11's existing disconnected-geography handling. Alaska's below-4.7 authored presentation is an intentional exception; Hawaii likewise must not enter lower-48 fitting.

### Required acceptance work for the Lead

- Deterministic: update `scripts/check-united-states-guided-political-camera.mjs` to assert that normal lower-48 teaching/visible-identification retains its section/authored decision and that any correction is opt-in for measured states; assert `name_to_place`, Alaska, and Hawaii bypass it. Do not assert a global 4.7 lower bound.
- Browser, desktop and mobile: capture settled Guided state teaching views for New Hampshire, Vermont, Rhode Island, Massachusetts, Colorado, New Mexico, Montana, Wyoming, California, Texas, Alaska, and Hawaii. Review context, not mere geometry containment: northeast states must retain recognizable neighbors; affected western states must no longer be at the prior overly distant regional scale; Alaska/Hawaii retain special frames.
- Browser: retain Utah/Arizona authored-camera coverage, capital state-context coverage, reload/resume, manual pan retention, and hidden-answer locating coverage. Add a test proving the normal northeastern prompt does not acquire the forced complete-state `activePromptFocus` behavior.

### Commands and boundaries

- Inspected: `git diff 0fed514^ 0fed514 -- src/maplibre-poc.js docs/guided-political-camera.md`; pre-commit `src/united-states-guided-political-camera.js`, `src/maplibre-poc.js`, deterministic and browser camera tests; all `us-states-capitals-01..11` camera metadata; `src/maplibre/maplibre-activity-runner.js` focus/fit implementation; `git diff --check`.
- No application code or tests changed. No browser screenshots were taken in this audit; the listed visual comparisons remain Lead acceptance work.

## Acceptance — Lead completes

Accepted 2026-09-09. The Lead independently reviewed the history and runtime, implemented authored/contextual camera precedence plus a measured 4.7/0.2 distant-section correction, and added no per-state overrides. The permanent camera suite passed 18/18 across desktop/mobile Chromium. A temporary 24-case visual matrix covered the twelve requested states at both viewport sizes and was reviewed before removal. Fast and broader Guided checks are recorded in `docs/testing.md`.
