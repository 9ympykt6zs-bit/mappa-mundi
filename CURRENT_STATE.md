# Current State

Snapshot date: 2026-08-12  
Inspected revision: `5e76f37b78c18414cf32bdc99e653fac0b95685c` (`test: cover completed journey reload persistence`, 2026-08-07)  
Working tree at inspection time: clean except for a pre-existing, untracked `VISION.md` and this document.

## How to read this snapshot

This is a conservative repository assessment, not a release claim. The following evidence levels are used:

- **Implemented**: executable code or content is present and wired into the current entry path.
- **Automatically checked**: a repository assertion script or test passed in this checkout on the snapshot date.
- **Browser-tested by repository evidence**: a Playwright test exists, or the tracked `test-results/.last-run.json` reports a prior pass. This does not establish that the test passed today.
- **Manually observed**: explicitly reported as manually checked in current documentation. Historical or nonspecific statements are not treated as current verification.
- **Unverified**: code exists, but no successful current end-to-end or manual observation was found.

Current verification performed for this snapshot:

- All 55 `scripts/check-*.mjs` scripts were executed directly: **49 passed and 6 failed**. These scripts mix module-level assertions with brittle source-text checks; they are useful evidence, but they are not a uniform unit/integration test framework.
- Playwright discovered 10 project/test combinations (five logical tests across desktop and mobile). The two non-browser spatial-question cases passed. The eight browser cases could not launch Chromium because the inspection sandbox denied Chromium's macOS Mach-port registration. This was an environment failure before application interaction, not an application assertion failure. Browser output was redirected to `/tmp`, so it did not alter the repository.
- No current real-device, visual, audio-quality, accessibility, or manual learner-flow pass was performed.

Automated-baseline update on 2026-08-14:

- The six stale or uncertain standalone checks identified below were investigated and corrected without production-code changes. The consolidated `npm test` command ran all 56 current `scripts/check-*.mjs` checks in isolated Node processes: **56 passed and 0 failed**. See [`docs/testing.md`](docs/testing.md) for the command, scope, limitations, and per-check disposition.
- Playwright again discovered 10 project/test combinations. The two Node-side spatial-question cases passed; the eight browser cases could not launch Chromium because the restricted macOS environment denied Mach-port registration before page launch. This remains an environment limitation, not an application assertion failure.

Determinism update on 2026-08-14:

- Daily Trail, U.S. Memory Trail, and generated Mental Map selection now accept opt-in seeded randomness and/or injected time at their planner/selection boundaries. No-options production calls retain their prior behavior. `scripts/check-deterministic-planning.mjs` verifies same-seed replay, different-seed valid variation, fixed-time behavior, and default call paths. The current fast baseline is **57 passed and 0 failed**. Evidence: `src/deterministic-dependencies.js`, `src/daily-trail-planner.js`, `src/united-states-memory-trail-planner.js`, `src/atlas/mental-map-challenges.js`, `src/atlas/mental-map-challenge-registry.js`, and [`docs/testing.md`](docs/testing.md).

Learning Inspector v1 update on 2026-08-14:

- A read-only, JSON-safe Inspector data layer now adapts existing place mastery, Daily Trail, U.S. Memory Trail, Journey progress, Mental Map results, and reconstruction results. It exposes item state, narrow selection explanations, deterministic context when supplied, and before/event/after transitions while labeling every field observed, inferred, or unavailable. It is not automatically wired to production events and has no visual UI or durable evidence log. `scripts/check-learning-inspector.mjs` verifies immutability, source normalization, honest missing-data reporting, stable transitions, and deterministic replay output. The current fast baseline is **58 passed and 0 failed**. Evidence: `src/learning-inspector.js`, [`docs/learning-inspector.md`](docs/learning-inspector.md), and [`docs/testing.md`](docs/testing.md).

Synthetic-learner simulation update on 2026-08-14:

- Deterministic evidence infrastructure now runs six explicit learner profiles against the production U.S. Memory Trail planner and production-derived 50-state/50-capital curriculum, plus a controlled Daily Trail date-return probe. It records session summaries, representative selection explanations, and before/event/after Inspector transitions in generated Markdown and JSON reports. `scripts/check-learner-simulations.mjs` verifies replay, seed variation, all required profiles, JSON serialization, and fixture immutability. This verifies that the harness executes reproducibly; it does **not** verify that adaptive behavior is correct. The current fast baseline is **59 passed and 0 failed**. Evidence: `scripts/lib/learner-simulation.mjs`, [`docs/learner-simulations.md`](docs/learner-simulations.md), and `reports/us-learning-simulations.md`.

Selection Trace v1 update on 2026-08-14:

- Learning Inspector selection explanations now include JSON-safe traces. U.S. Memory Trail reconstructs the relevant candidate bucket through its existing eligibility/priority helpers; Mental Map has opt-in debug selectors that expose the exact filtered pool and random index; Daily Trail exposes reason/factor metadata and other emitted selections while honestly leaving its discarded full candidate pool unavailable. The feature is read-only and not automatically persisted from production gameplay. `scripts/check-selection-trace.mjs` verifies output preservation, immutability, deterministic replay, candidate metadata, unavailable labels, and serialization. The current fast baseline is **60 passed and 0 failed**. Evidence: `src/selection-trace.js`, `src/learning-inspector.js`, [`docs/learning-inspector.md`](docs/learning-inspector.md), and `reports/selection-trace-example.json`.

Eligibility-delay reporting update on 2026-08-14:

- A read-only O6.1 reporter now aggregates U.S. Memory Trail Selection Trace candidate pools across all six deterministic learner profiles. It separates eligibility from selection, records resolved and unresolved deferral episodes, and reports item, reason, Census-region, and state/capital comparisons. Eligibility remains explicitly inferred; curriculum-blocked items outside emitted pools are not treated as eligible, and Daily Trail remains out of scope because its rejected pool is unavailable. `scripts/check-eligibility-delay-report.mjs` verifies deterministic replay, stable identities, unavailable labels, selection/eligibility separation, serialization, immutability, and unchanged inputs. The current fast baseline is **61 passed and 0 failed**. Evidence: `scripts/lib/eligibility-delay-report.mjs`, [`docs/eligibility-delay-report.md`](docs/eligibility-delay-report.md), and `reports/us-eligibility-delays.md`.

Matched-seed simulation update on 2026-08-15:

- O6.2 now runs controlled U.S. Memory Trail comparisons in which five learner-response profiles share the same planner seed, empty starting state, simulated clock, and a separately seeded answer stream. The generated 12-seed matrix reports progression, mastery checkpoints, selection-reason counts, inferred eligibility delay, Census-region opportunities and selections, diagnostic items, pairwise deltas, medians, and ranges. It improves attribution of differences to scripted answer behavior but is not a human causal experiment or pedagogical validation. `scripts/check-matched-seed-simulation-matrix.mjs` verifies matching/separation of seeds, deterministic replay, seed-sensitive trajectories, aggregation math, serialization, immutability, and unchanged planner output. The current fast baseline is **62 passed and 0 failed**. Evidence: `scripts/lib/matched-seed-simulation-matrix.mjs`, [`docs/matched-seed-simulations.md`](docs/matched-seed-simulations.md), and `reports/us-matched-seed-simulations.md`.

Long-horizon mastery update on 2026-08-15:

- O6.3 now observes five deterministic U.S. Memory Trail learner profiles for 200 sessions across six matched planner seeds. It reports status counts, item-level mastery milestones, encounters/correct/miss/streak and scheduling summaries, diagnostic item transitions and mastery lapses, post-introduction review load, and normalized Census-region mastery. Near-perfect runs introduced all 100 items at session 39 with at least one correct response per item and 138 total correct demonstrations, but zero items were yet marked mastered; they reached 95% mastery at sessions 107–113 and did not reach 100% by session 200. A persistently failed Ohio was selected every session after introduction, blocked dependent Columbus, but all other 98 introduced items mastered by session 150. Memory Trail has no separate domain-completion state beyond item mastery. This is behavioral evidence, not validation of the current thresholds. `scripts/check-long-horizon-mastery-report.mjs` verifies calculations, invariants, deterministic replay, serialization, immutability, and unchanged planner output. The current fast baseline is **63 passed and 0 failed**. Evidence: `scripts/lib/long-horizon-mastery-report.mjs`, [`docs/long-horizon-mastery.md`](docs/long-horizon-mastery.md), and `reports/us-long-horizon-mastery.md`.

Experimental demonstrated-progress update on 2026-08-15:

- A non-production simulation harness now compares weighted-evidence, Bayesian evidence, BKT-inspired, and current-counter proxy scores across 16 canonical histories, a perfect 50-state location pass, and five existing synthetic learners. It does not write scores to learner state or alter selection. Under provisional parameters, Bayesian evidence best balanced lucky-guess reversal and strong-evidence resilience; BKT saturated rapidly, weighted evidence lost evidence depth at its clamp, and the current proxy overreacted to streak reset. This is a design recommendation for further isolated prototyping, not a production decision. `scripts/check-progress-score-comparison.mjs` verifies calculations, replay, bounds, immutability, absence behavior, serialization, and unchanged planner output. The current fast baseline is **64 passed and 0 failed**. Evidence: `scripts/lib/experimental-progress-score-models.mjs`, [`docs/experimental-progress-scores.md`](docs/experimental-progress-scores.md), and `reports/experimental-progress-score-comparison.md`.

Canonical evidence parity update on 2026-08-20:

- A2.5 now compares the additive canonical stream against genuinely equivalent legacy behavior in deterministic Journey, U.S. Memory Trail, Daily Trail, Mental Map, and Map Reconstruction scenarios. The generated report covers correct, incorrect, guided, repeated-correct, repeated-miss, partial, duplicate, missing-emission-control, and persistence behavior. It found no defects in the covered paths; three intentional differences reflect legacy per-session aggregation versus canonical raw attempts, and one timestamp comparison is unavailable. This supports beginning a separate shadow/read-only Progress Report migration slice, but not replacing current scoring or fabricating historical raw evidence. The current fast baseline is **69 passed and 0 failed**. Evidence: `scripts/lib/canonical-evidence-parity.mjs`, [`docs/canonical-evidence-parity-validation.md`](docs/canonical-evidence-parity-validation.md), and `reports/canonical-evidence-parity.md`.

Progress Report canonical shadow update on 2026-08-20:

- A developer-only adapter now scores canonical state-location, state-identification, and item-level capital evidence through the existing Bayesian module and compares it with the unchanged production Progress Report. Sixteen deterministic item × skill cases produced 11 exact matches, one semantic match, three intentional evidence-scope differences, one unavailable historical comparison, and zero defects. Canonical-first replacement is not yet safe: Journey coverage and prompt-skill separation can change new-learner results, while existing learners also have non-reconstructable legacy history. The current fast baseline is **70 passed and 0 failed**. Evidence: `src/canonical-progress-report-shadow.js`, [`docs/progress-report-canonical-shadow.md`](docs/progress-report-canonical-shadow.md), and `reports/progress-report-canonical-shadow.md`.

Progress Evidence Policy update on 2026-08-21:

- A UI-independent v1 policy now maps canonical concept × skill × outcome evidence to State Location, State Identification, separate capital retrieval/relationship skills, Geographic Relationships, and Spatial Reconstruction. It merges modes only when they measure the same history, excludes assisted/partial/skipped outcomes from current Bayesian counts without discarding them, and deduplicates by event ID. Context remains explicitly blocked because canonical v1 lacks contextual-recall and taxonomy-qualified event metadata. The policy makes a canonical-first implementation design-ready for supported skills and brand-new learners, but does not change the production report. Existing-user migration remains blocked on a versioned aggregate baseline, cutover/overlap protection, and treatment of historically combined state-practice counts. The current fast baseline is **71 passed and 0 failed**. Evidence: `src/progress-evidence-policy.js`, [`docs/progress-evidence-policy.md`](docs/progress-evidence-policy.md), and `scripts/check-progress-evidence-policy.mjs`.

Progress Report canonical-first production update on 2026-08-21:

- The U.S. Progress Report now selects canonical demonstrated-progress evidence for a persistently marked clean new-learner cohort. Enrollment requires a healthy repository, no legacy report history or ambiguous aggregates, valid cohort persistence, and a strict zero-defect shadow comparison. State Location, State Identification, Capital Location, and Capital Identification route through Progress Evidence Policy v1 and the existing Bayesian scorer; the current State Capitals view rolls its two approved retrieval skills together. Existing or ambiguous learners and repository/cohort/adapter/shadow failures retain the unchanged legacy path. Local debug data records the selected path and comparison without changing learner or planner state. The current fast baseline is **72 passed and 0 failed**. Evidence: `src/united-states-progress-report-read-path.js`, `src/canonical-progress-report-shadow.js`, [`docs/progress-report-canonical-first.md`](docs/progress-report-canonical-first.md), and `scripts/check-progress-report-canonical-first.mjs`.

State-capital relationship learning update on 2026-08-21:

- I1 adds the atlas-backed Capital Connections activity using the existing Mental Map single-select engine and its Capitals and Regions category. It generates two prompt directions for each of exactly 50 state-capital pairs while sharing one `state-capital:{state}:{capital}` × `relationship-recall` concept per pair; Washington, D.C. remains excluded. Every submitted attempt emits one deduplicated canonical event with prompt-direction metadata. Progress Evidence Policy keeps relationship recall separate from capital locating and identifying, while the current State Capitals UI rolls the three histories together for eligible canonical-first learners. Existing learners remain on legacy without fabricated relationship history. The content reporter now records **50/50 directly assessed capital relationships**. The current fast baseline is **73 passed and 0 failed**. Evidence: `src/atlas/state-capital-relationship-challenges.js`, `scripts/check-state-capital-relationship-learning.mjs`, and [`docs/generated/us-content-coverage-report.md`](docs/generated/us-content-coverage-report.md).

## Executive summary

Completion of the U.S. reference implementation is defined by the acceptance criteria in [`docs/US_DEFINITION_OF_DONE.md`](docs/US_DEFINITION_OF_DONE.md); this snapshot records current evidence against that target without treating implemented-but-unverified behavior as complete.

The accompanying [`docs/US_CONTENT_TAXONOMY.md`](docs/US_CONTENT_TAXONOMY.md) defines what counts as meaningful contextual U.S. content for content creation and coverage measurement.

The United States is the clearest reference implementation, but it is not one finished, reusable vertical slice. It currently consists of several adjacent systems:

- a 14-step U.S. Journey (11 state sections plus lakes, mountain ranges, and rivers);
- a separate U.S. Memory Trail curriculum for 50 states and 50 capitals;
- U.S. atlas data, queries, and a read-only learning-state overlay;
- Mental Map challenges and Lower 48 Map Reconstruction;
- generic Journey/activity/session infrastructure shared with other geography content.

The strongest current evidence is at the planner/data/engine level: the U.S. curriculum, atlas, Mental Map, reconstruction, Daily Trail selection, persistence helpers, and mastery-store helpers have passing Node assertion scripts. The strongest browser coverage is much narrower: the U.S. Journey Playwright spec uses a deterministic test hook to force activity completion and checks save/resume/final-completion behavior. It does not exercise real chip placement, Memory Trail adaptation, the U.S. atlas, Mental Map, reconstruction, Daily Trail, audio, or camera behavior.

Adaptive learning is substantially implemented in two local-storage planners, but it is fragmented. Daily Trail and U.S. Memory Trail each maintain their own item state and scheduling; Journey progress, activity progress, completed activities, atlas-derived progress, reconstruction saves, and the new mastery evidence use additional stores. There is no account, backend, or cross-device learner model.

## Working

Items in this section have current automated module-level evidence. They should not be read as proof of production UX quality.

### U.S. content and gameplay foundations

- The available U.S. Journey is data-defined with 14 ordered activities: `us-states-01` through `us-states-11`, U.S. lakes, mountain ranges, and rivers. The same preset mechanism defines journeys for the world and many other regions/countries. Evidence: `src/journey-presets.js`.
- The canonical U.S. atlas data/query layer is present and automatically checked. The current checks validate atlas data, read-only queries, progress projection, and profile/overview adapter behavior. Evidence: `src/atlas/united-states-atlas-data.js`, `src/atlas/united-states-atlas-queries.js`, `src/atlas/united-states-atlas-progress.js`, `src/atlas/united-states-atlas-ui.js`, and the four `scripts/check-united-states-atlas-*.mjs` scripts (all passed on 2026-08-12).
- Mental Map question/evaluation infrastructure and regional Map Reconstruction engines have substantial automated assertion coverage. Evidence: `src/atlas/mental-map-challenge-*.js`, `src/atlas/border-chain.js`, `src/atlas/map-reconstruction-*.js`; `scripts/check-mental-map-challenge.mjs`, `scripts/check-map-reconstruction.mjs`, and `scripts/check-map-reconstruction-capstone.mjs` passed. `tests/e2e/us-spatial-questions.spec.js` also passed in both configured Playwright projects because it is a Node-side test and does not launch a page.

### Adaptive planners and local progress models

- Daily Trail has explicit state normalization, local persistence, small new-item batches, recent/weak/old review, missed-new-item retry, checkpoint/remediation flows, slow-correct signals, due sessions/dates, stability/retrievability fields, and terminal review. Its current World Core goal is a hard-coded sequence spanning continents/oceans, U.S. states, and core world-country activities; U.S. Capitals is a second gated goal. Evidence: `src/daily-trail-planner.js` and `docs/learning-system-vision.md`.
- The relevant Daily Trail checks passed for configuration, curriculum progression, missed-new retry, old-section review, weak review, slow-correct review, terminal completion/review, and debug-reason structure. Evidence: the corresponding `scripts/check-daily-trail-*.mjs` files. This verifies planner examples and selected source wiring, not full browser sessions.
- The separate U.S. Memory Trail planner builds a validated 100-item curriculum (50 states and 50 linked capitals across 11 sections), introduces 3–5 new items, selects weak/recent/older review, records resumable active-session snapshots, and persists item/session summaries locally. Evidence: `src/united-states-memory-trail-planner.js`; `scripts/check-united-states-memory-trail-curriculum.mjs`, `-planner.mjs`, `-persistence.mjs`, and `-runtime.mjs` all passed.
- Journey progress is normalized and saved per journey, step, and difficulty in `atlasQuestProgress`. The store supports active journey/resume, completion, review-from-start without reset, and explicit reset. Evidence: `src/progress-store.js` and `tests/e2e/us-journey-smoke.spec.js`.

### Current production wiring

- The root `index.html` is now an app shell and lazily imports `src/maplibre-poc.js`; it is not the redirect shim described by the older project-history document. The orchestrator dynamically loads MapLibre, the activity normalizer, `ActivitySession`, the MapLibre runner, and speech support. Evidence: `index.html` and `src/maplibre-poc.js`.
- Generic activity/session seams exist: `src/map-engines/activity-normalizer.js` normalizes legacy/current activity schemas, and `src/maplibre/activity-session.js` owns selection, correctness, completion, answer-bank refill, and cumulative versus section-only target sets. The same MapLibre runner is used by the catalog. This is the primary reusable layer across geography sections.

## Partially Implemented

### United States as a reference implementation

- The U.S. experience is broad but split among Journey, U.S. Memory Trail, Daily Trail, Atlas, Mental Map, and Map Reconstruction entry points in `src/maplibre-poc.js`. There is no single structured U.S. expedition that composes these into the intended discovery/teaching/practice/checkpoint/final-mission loop. `docs/us-playable-atlas-roadmap.md` marks both the reusable Expedition framework and “Across the United States” Expedition as not started.
- The U.S. atlas shows a read-only status derived only from Daily Trail and U.S. Memory Trail state. It does not write progress, consume Journey completion, or consume the separate meaningful-mastery store. Evidence: `src/atlas/united-states-atlas-progress.js`.
- U.S. Memory Trail is more specialized than reusable. It assumes `us-states-NN` and matching `us-capitals-NN` activities, state/capital target types, exactly 50 of each, and U.S.-specific prerequisite rules. Evidence: `src/united-states-memory-trail-planner.js`.
- Mental Map, border-chain, directional, and reconstruction modules are modular internally, but their data, terminology, evaluation, and UI are U.S.-specific. Porting them to another country would require new canonical data and adaptation rather than only adding activity JSON. Evidence: `src/atlas/border-chain.js`, `src/atlas/mental-map-challenge-engine.js`, and `src/atlas/map-reconstruction-*.js`.

### Meaningful mastery

- A versioned store exists for separate `recognition`, `naming`, `locating`, and `relationships` counters, and its normalization/update/reset behavior passed `scripts/check-place-mastery.mjs`. Evidence: `src/place-mastery-store.js`.
- Runtime evidence collection is only a localhost debug slice. `createMasteryDebugController()` becomes inactive away from localhost, and Memory Trail attempts are recorded through that controller. Only `name_to_place` and `place_to_name` map to signals (`locating` and `naming`); guided prompts do not count, and no runtime mapping records `recognition` or `relationships`. Evidence: `src/mastery-debug.js` and `updateMemoryTrailStats()` in `src/maplibre-poc.js`.
- The store is not used to choose learning content, compute a learner-facing mastery level, or populate the U.S. atlas. The roadmap therefore remains accurate in treating “Meaningful mastery” as not complete. Evidence: `docs/us-playable-atlas-roadmap.md` and the absence of `place-mastery-store.js` imports outside `src/mastery-debug.js`.

### Observability and debugging

- Localhost-only tools exist for mastery inspection/reset, Daily Trail section/item selection, camera tuning/tracing, and specialized Memory Trail visual fixtures. Additional gated diagnostics include `?perfDebug`, `?cameraTrace`, `?debugMapNavigation`, the local `?test=1` API, and several `window.*` debug objects. Evidence: `src/mastery-debug.js`, `src/maplibre-poc.js`, and `tests/e2e/us-journey-smoke.spec.js`.
- Content-selection debug models include reason codes such as new, recent review, weak review, checkpoint, remediation, and terminal review. However both planner and runtime `ENABLE_DAILY_TRAIL_DEBUG` constants are currently `false`; the general `mappaMemoryTrailDebug` object is also disabled by `ENABLE_MEMORY_TRAIL_DEBUG = false`. Camera/dev panels remain separately accessible on localhost. Evidence: `src/daily-trail-planner.js` and `src/maplibre-poc.js`.
- Observability is developer-local and fragmented across console output, globals, hidden key sequences, URL flags, panels, and localStorage. There is no durable event log tying a content-selection decision to a saved learner-state transition. Google Analytics calls exist but are optional and are not a learner-state debugging system. Evidence: `src/analytics.js`.

### Automated testing

- Playwright is configured for desktop Chromium and an iPhone 13-sized Chromium project. The U.S. Journey spec covers launch/menu navigation, starting Medium, forced completion of the first activity, save/advance, reload/resume, final completion/reload, and test-API gating. Evidence: `playwright.config.js`, `tests/e2e/us-journey-smoke.spec.js`, and `docs/testing.md`.
- The deterministic `completeCurrentActivity()` hook directly marks every current target complete and invokes completion handling. This is appropriate for progress-flow regression coverage, but it bypasses real learner input, correctness, miss/remediation logic, map hit testing, and actual adaptive prompt selection. Evidence: `installMappaTestApi()` in `src/maplibre-poc.js`.
- The tracked `test-results/.last-run.json` says `passed`, and recent commits specifically added U.S. Journey Playwright regressions. That artifact has no timestamp or test inventory, so it is evidence of a prior pass, not proof of the current checkout in this environment.
- The 58 standalone checks provide broad low-level coverage through the consolidated `npm test` command. They remain executable assertion scripts rather than a uniform test framework, and the repository still has no executed-JavaScript coverage report or `.github` CI workflow. Evidence: `package.json`, `scripts/run-fast-checks.mjs`, `scripts/check-*.mjs`, and the absence of `.github` files.

## Unverified / Needs Evidence

- **Real U.S. Journey gameplay:** no current successful browser run or manual observation establishes that a learner can complete the 14-step Journey using real clicks/taps, across desktop and mobile. The current Playwright spec forces completion and only traverses the first three and seeded final step.
- **Adaptive behavior end to end:** planner checks establish selection/state algorithms, but there is no Playwright coverage that plays Daily Trail or U.S. Memory Trail, makes misses/slow correct answers, reloads mid-session, and confirms the next selected content from persisted state.
- **Atlas integration:** the read-only status adapter is checked, but there is no browser test proving map/profile rendering or that real learning sessions update the visible atlas correctly.
- **Mental Map and Map Reconstruction UX:** engines have extensive assertion scripts, but browser interaction, geometry feel, persistence under real input, and mobile behavior are not covered by Playwright.
- **Camera correctness:** camera behavior is largely validated by source-text wiring assertions and approved numeric configurations rather than rendered visual assertions. The checks are green, but rendered framing remains unverified.
- **Audio and narration:** registries and asset checks exist, but narration timing, intelligibility, browser autoplay behavior, mute/resume behavior, and audio/visual sequencing remain manual by `docs/testing.md` and `docs/activity-audio.md`.
- **Mobile and accessibility:** the Playwright viewport project is not a real iPhone/Safari test. Touch drag/drop, trackpad interaction, small hit areas, screen-reader flow, keyboard-only use, reduced-motion completeness, and contrast have no current acceptance evidence. `docs/CODEX_PROJECT_HISTORY.md` also identifies mobile/touch QA as insufficient.
- **Production/offline loading:** the root app dynamically loads MapLibre JS/CSS from unpkg. Behavior with that CDN blocked, slow, or unavailable is not verified. Evidence: `mapLibreScriptUrl` and `mapLibreStylesheetUrl` in `src/maplibre-poc.js`.
- **Non-U.S. parity:** many non-U.S. journeys and activities are defined, but no E2E test covers them, and the U.S.-specific atlas/adaptive/mechanics layers have not been demonstrated as reusable for them.

## Known Problems

### Automated-check drift found on 2026-08-12

Six of 55 standalone checks failed in the original snapshot:

1. `scripts/check-daily-trail-mixed-checkpoint.mjs` expected older `index.html`/`maplibre-poc.html` module cache-buster strings even though the cache key had legitimately advanced.
2. `scripts/check-compass-challenge.mjs` expected no recorded audio entry for `east-of-nevada` after that audio had been registered and added to the repository.
3. `scripts/check-daily-trail-mobile-section-quiz-camera.mjs` expected a Daily-Trail-only source gate after runtime had intentionally generalized the path through `isAdaptiveTrailMemoryTrail()` to include U.S. Memory Trail.
4. `scripts/check-daily-trail-us-states-01-camera.mjs`, `-02-camera.mjs`, and `-03-camera.mjs` looked for the old exact source string that attached fixed cameras only to Daily Trail. Their camera-data comparisons passed, while the intended runtime now attaches those cameras to Daily Trail or U.S. Memory Trail.

These six failures were resolved during the 2026-08-14 baseline stabilization. Repository history and current wiring showed test drift rather than application defects: prerecorded Compass audio had been added, U.S. Memory Trail intentionally reused adaptive-trail camera behavior, and app-shell cache keys had advanced. The updated checks and full dispositions are documented in [`docs/testing.md`](docs/testing.md). The current fast baseline is green at 56/56, while browser E2E remains unverified in this restricted environment.

### Architecture and state risks

- `src/maplibre-poc.js` is approximately 25,000 lines and owns app navigation, data loading, Journey, Study, adaptive trails, atlas/mechanics entry points, audio, camera rules, persistence integration, analytics, and dev tools. This concentrates regression risk and limits reuse despite the smaller helper modules.
- Learner state is split across multiple localStorage keys and models: Journey progress, generic activity progress, completed activities, Daily Trail, U.S. Memory Trail, reconstruction, settings, and mastery. The systems normalize malformed data defensively but do not share a migration/orchestration layer or transactional update.
- Documentation has material drift. `docs/CODEX_PROJECT_HISTORY.md` says `index.html` redirects to `maplibre-poc.html`, but the root now contains its own app shell and lazy loader. `src/map-engines/README.md` says its boundary is not wired into production, while `src/maplibre-poc.js` dynamically imports both the normalizer and `ActivitySession`. Historical “working” labels in that document should not be treated as current verification.
- The production file/module names still use `poc`, while they are active code. This is both an onboarding problem and a source of stale source-text tests.
- Some tests assert exact implementation strings/cache keys rather than behavior. The six failures demonstrate that harmless refactors/generalizations can invalidate them without identifying whether runtime behavior is correct.
- The app advertises “earn achievements” in `index.html`/`maplibre-poc.html`, but no achievement model or implementation was found.

## Not Yet Implemented

- A reusable Expedition framework and the integrated “Across the United States” Expedition. Evidence: milestones 7–8 in `docs/us-playable-atlas-roadmap.md`.
- Production meaningful mastery that uses all four dimensions, affects adaptive selection, and provides learner-facing U.S. knowledge-map/regional/national summaries. The current store/debug slice is not that system. Evidence: milestone 3 in `docs/us-playable-atlas-roadmap.md`.
- Full relationship-mastery integration from Mental Map/border questions into the mastery/adaptive model. Evidence: milestone 4 in `docs/us-playable-atlas-roadmap.md` and the current mastery wiring described above.
- Accounts, backend persistence, profiles, cross-device sync, classroom/family dashboards, subscriptions, and native apps. These are explicitly excluded from the current U.S. vertical-slice scope in `docs/us-playable-atlas-roadmap.md` and no implementation was found.
- A green, consolidated CI pipeline that runs the standalone checks and browser E2E suite on every change.
- Broad E2E coverage for Daily Trail, U.S. Memory Trail, atlas, Mental Map, Map Reconstruction, audio, camera behavior, accessibility, and non-U.S. journeys.
- Public-beta acceptance evidence such as outside-user completion, cross-browser/real-device results, progress migration/corruption testing, and accessibility/performance sign-off. Evidence: milestone 10 in `docs/us-playable-atlas-roadmap.md`.

## Practical architecture/reuse assessment

The reusable core is currently the data-defined Journey/activity catalog plus `normalizeActivity()`, `ActivitySession`, and the shared MapLibre runner. That is enough to add conventional identify/place activities and ordered Journey steps across geography sections.

The learning/product layer is less reusable:

- Daily Trail is a large standalone planner with a partially generic item model but hard-coded goals, activity IDs, and special cases.
- U.S. Memory Trail is explicitly coupled to U.S. states/capitals and regional file naming.
- Atlas queries, border/direction reasoning, Mental Map, and reconstruction are U.S.-specific modules.
- `src/maplibre-poc.js` contains the integration logic and many U.S./Daily-Trail camera and session special cases.

Therefore the U.S. code is a reference implementation in the sense of being the deepest collection of working parts, but it is not yet a reusable geography-learning framework that can be applied to another country mainly through configuration. The Expedition and mastery milestones are the clearest missing abstractions needed to make that claim credible.
