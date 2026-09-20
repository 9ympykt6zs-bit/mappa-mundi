# Automated testing

## Cursor-anchored map zoom — 2026-09-19

`tests/e2e/cursor-anchored-zoom.spec.js` exercises the production MapLibre 5.18 globe at zoom 1.2, where the library's normal small-globe heuristic previously allowed an off-center geographic point to drift about 29 CSS pixels during one wheel step. The runner keeps MapLibre's native wheel/trackpad handler and corrects only safe low-zoom inner-globe anchors with MapLibre's own location-at-point operation, using the newer upstream controller's horizon model plus a conservative longitude guard below the range MapLibre identifies as unstable. The spec covers zooming out, moving to an off-center geographic point, zooming back in with a mouse wheel, repeated small trackpad-like deltas, diagonal `ctrlKey` pinch-style wheel input, delayed camera-snap resistance, ordinary drag pan, enabled scroll/drag/touch handlers, and a CDP-driven two-finger mobile pinch.

The complete fast baseline passed **112/112**. A serial desktop matrix covering the new spec, globe navigation, Guided political cameras including New Hampshire/Alaska/Hawaii, and existing mountain-range pan/zoom passed **26/26**. The mobile pinch case passed **1/1**. Tests ran from the isolated Codex worktree on port 4174 because an existing server on the default port 4173 belonged to the protected Kimi worktree; the temporary port-only Playwright config was not retained.

Commands:

```sh
npm test
npx playwright test tests/e2e/cursor-anchored-zoom.spec.js tests/e2e/mountain-range-visual-regression.spec.js tests/e2e/guided-political-camera.spec.js tests/e2e/globe-navigation-prototype.spec.js --project=desktop-chromium --workers=1
npx playwright test tests/e2e/cursor-anchored-zoom.spec.js --project=mobile-chromium --workers=1 --grep="mobile two-finger"
git diff --check
```

## Reconstruction placement tolerance — 2026-09-15

`scripts/check-map-reconstruction.mjs` pins the centralized 32 CSS-pixel mouse/trackpad and 40 CSS-pixel touch configuration. It covers offsets clearly inside, exactly on, and clearly outside both boundaries; rejects multi-piece and pointerless snapping; and proves that zoom scale changes the required world offset while pan translation does not change the measured CSS-pixel error. Existing regional, Guided anchored, standalone translation-normalized, and Lower 48 evaluators remain covered by their established checks.

`tests/e2e/reconstruction-placement-tolerance.spec.js` exercises real pointer release through the production regional UI. Mouse drops at 31.5 pixels snap and 32.5-pixel drops remain unsnapped before and after map pan/zoom. Emulated touch accepts 39.5 pixels and rejects 40.5 pixels. The affected browser run with Guided Reconstruction and existing navigation passed **16 applicable cases** across desktop/mobile Chromium with **2 intentional pointer-project skips**. Focused Lower 48 saved-progress and active-drag lifecycle checks passed **3 applicable cases** with **1 intentional mobile mouse-path skip**. The complete fast baseline passed **112/112**.

Commands:

```sh
npm test
npx playwright test tests/e2e/reconstruction-placement-tolerance.spec.js tests/e2e/reconstruction-navigation.spec.js tests/e2e/guided-reconstruction.spec.js --workers=1
npx playwright test tests/e2e/reconstruction-lifecycle.spec.js --workers=1 --grep="Lower 48"
git diff --check
```

## Reconstruction screen lifecycle — 2026-09-15

`tests/e2e/reconstruction-lifecycle.spec.js` proves that the visible Reconstruction panel follows the active app screen rather than durable progress. It covers standalone Settings, Explore, Home, and another activity; Guided Home/Back before placement, midway, and after submission; post-course return; reload while a Guided child is saved and reload after leaving; explicit Guided and Lower 48 resume; and browser Back/Forward. Desktop gesture cases add active bank and placed-piece drags, wheel input during drag, synthetic `pointercancel`, release outside the map, rapid movement, navigation during capture, and restoration of the last persisted Lower 48 placement. The final focused run passed **14/14 applicable cases** across desktop and mobile Chromium, with the two desktop mouse-gesture cases skipped by design on mobile.

The complete fast baseline passed **112/112** checks. The affected browser run across `guided-core-capstone.spec.js`, `guided-reconstruction.spec.js`, and `reconstruction-navigation.spec.js` passed **17/18** initially: one direct-DOM checkpoint-10 camera case observed a transient null-element callback after replacing the entire document body. That case passed immediately in isolation, and a clean final run of all four desktop/mobile Reconstruction navigation cases passed **4/4**. Every Guided Reconstruction and Guided capstone case passed in the affected run. Static syntax checks and `git diff --check` also passed.

Commands:

```sh
npm test
npx playwright test tests/e2e/reconstruction-lifecycle.spec.js --workers=1
npx playwright test tests/e2e/guided-core-capstone.spec.js tests/e2e/guided-reconstruction.spec.js tests/e2e/reconstruction-navigation.spec.js --workers=1
npx playwright test tests/e2e/reconstruction-navigation.spec.js --workers=1
node --check src/maplibre-poc.js
node --check src/atlas/map-reconstruction-ui.js
node --check src/atlas/map-reconstruction-capstone-ui.js
node --check tests/e2e/reconstruction-lifecycle.spec.js
git diff --check
```

## Guided required-core completion and final capstone — 2026-09-15

`scripts/check-guided-core-capstone.mjs` pins the required inventory at 50 states, 50 capitals, ten nonrepeatable Reconstruction checkpoints, and 34 supported physical features with both introduction and immediate-practice completion. It separately removes Alaska, Hawaii, Juneau, Honolulu, Alaska Range introduction/practice, and Brooks Range introduction/practice and confirms that each omission blocks the capstone. The selector checks exactly ten unique introduced questions, a 4 state / 3 capital / 3 physical split, one river/lake/mountain range, noncontiguous geographic coverage, deterministic replay, active-session reload, persisted response history, and nonrepeatability after completion.

The complete fast baseline passed **112/112** checks. The serial affected browser matrix covered capstone eligibility, a mid-capstone incorrect response and reload, all ten canonical response events, post-course choice persistence, physical introduction/review, complete physical context, state/capital teaching, Reconstruction scoring and reload, and targeted Guided entry on desktop and mobile Chromium. It passed **96/98** initially; both failures exposed a pre-existing temporal-dead-zone error in Journey canonical evidence writing, and the repaired cases then passed **2/2**. A further release matrix exposed stale Journey-preview and inert France-context assertions plus one transient mobile resource error; after aligning those tests with current behavior, the focused desktop/mobile rerun passed **12/12**. Known minor state-camera positioning imperfections remain deferred. No Safari or physical-device claim is made.

## Complete Guided physical-map context — 2026-09-14

Guided physical retrieval now keeps its bounded introduced question pool separate from a complete 34-target rendered context: 8 rivers, 6 lakes, and 20 mountain ranges. The orchestration check pins the full context inventory and three source activities; the child-contract check pins version 4 persistence. Browser assertions verify the complete target and river-line sources during immediate river, lake, and mountain retrieval plus mixed review, while the Memory Trail pool remains bounded to its cohort or review selection. The complete fast baseline passed **111/111** checks.

The combined affected desktop/mobile Chromium run completed **53/54** initially. The only failure was the new mobile lake check waiting five seconds for the map to equal its already-computed context camera while two browser workers were under load; the same case passed on both viewports in isolation after the existing camera assertion received a 15-second settle allowance. The complete Guided orchestration portion passed **24/24**, and the final complete physical-presentation rerun passed **32/32**, including a new explicit Arkansas/Mississippi system scenario. Coverage includes St. Lawrence with Mississippi, Ohio, and Arkansas present; an actual click on still-unintroduced Mississippi as a wrong answer; evidence and curriculum isolation; neutral pre-answer styling/cursors; full-context mountain and lake retrieval; mixed review; legacy contract reload; pan/zoom; and lower-48 versus Alaska framing.

Desktop St. Lawrence and lake retrieval plus mobile St. Lawrence retrieval were visually inspected. The maps show the connected national river network, all Great Lakes, and the complete lower-48 mountain context without a target highlight or label. The 34 targets reuse the three physical activities and already-loaded geometry assets, so the change adds no network fetch or source payload; it expands the active rendered/hit target set to 34. Browser interaction remained responsive in the affected matrix. No Safari, physical-device, GPU profile, or formal frame-time benchmark is claimed.

## Guided physical retrieval candidates — 2026-09-14

This section records the introduced-only candidate implementation from commit `4d538a8`; complete physical-map context now supersedes that rendering rule. The question/evidence separation and pre-answer neutrality established there remain active.

The historical candidate work passed the 111-check fast baseline and its accepted browser matrices; see commit `4d538a8` if that implementation detail is needed.

## Guided mountain curriculum order and review fairness — 2026-09-13

The physical orchestration check now proves strict same-family introduction order over the existing regional-stage metadata. It covers fresh and targeted east-to-west mountain selection; the Alabama-stage exclusion of Alaska Range and Brooks Range; replacement of a stale active Alaska introduction; Rockies before all related state teaching; Alaska as the final mountain cohort with a two-section lead after the Southwest; immediate two- or three-target retrieval; partial lower-48 mountain family review; the Alaska review prerequisite; deterministic alternating review pools; compatible river/lake family ordering; mixed review; and persisted review-pool identity. The complete fast baseline passed **111/111** checks.

The complete Guided orchestration suite passed **24/24** desktop/mobile Chromium cases, including reset and retained-evidence routing, the new Alabama-stage persisted-block/reload regression, immediate retrieval, remediation, child provenance, family and mixed review, interrupted teaching, and generated river/lake batches. A focused physical-presentation set passed **6/6** desktop/mobile cases for Alaska framing, the Northeast camera override, and teaching-to-retrieval emphasis. `git diff --check` is part of final commit validation. No Safari, physical-device, or human pedagogical evaluation is claimed.

## Guided highlighted-feature teaching — 2026-09-13

`check-guided-highlighted-feature-teaching.mjs` pins the shared state, mountain-range, river, and lake family/action copy, including singular cohorts and target-specific redirects. The complete fast baseline passed **111/111** checks, including canonical physical evidence, physical highlighting, Memory Trail audio deduplication, state teaching runtime, physical scheduling, and activity-audio validation.

The focused Guided browser matrix passed **18/18** desktop/mobile Chromium cases. It covers explicit state instruction and target speech, a wrong state teaching tap with no evidence write, one family cue followed by deduplicated mountain target names, audio-muted visual instructions, a durable mid-cohort reload, assisted physical taps, immediate three-range retrieval, an interrupted cohort with no duplicate evidence, generated river and lake cohorts, and mixed physical review. Existing camera, pan/zoom, batching, and retrieval assertions remained active in those flows. A test fixture initially reapplied its seed during reload and masked the durable child contract; the seed is now one-time, and the corrected learner entry path resumes the persisted Green Mountains target. No Safari, physical-device, or human audio-quality claim is made.

## Guided capital sequencing and city-label attribution — 2026-09-12

The new `check-guided-capital-retrieval-sequencing.mjs` check proves that fresh capitals use highlighted-place naming before map locating, assisted teaching and incorrect naming cannot unlock locating, a correct in-session or persisted canonical naming result can, and difficulty reduction returns to naming. `check-capital-location-label-placement.mjs` now requires one finite marker-edge-to-label-edge connector for every disclosed city across Colorado, Connecticut, Rhode Island, Delaware, Texas, dense four-label feedback, responsive viewports, and multiple zoom levels. The complete fast baseline passed **110/110** checks.

The focused capital suites passed **26/26** desktop/mobile Chromium cases. They cover correct, same-state-wrong, and wrong-state feedback; no pre-answer labels or connectors; Guided teaching connectors; first independent naming evidence; unchanged true coordinates; pan/zoom; Boise reload and relayout; Colorado, Massachusetts, New Hampshire, Providence, Connecticut, Rhode Island, Texas, Utah, Alaska, and Hawaii. A final two-case desktop/mobile Texas run verified that correct-answer feedback suppresses the duplicate ordinary completed-capital label. Screenshots for the representative dense, small, wide, mainland, and Hawaii layouts were visually inspected; connector-backed labels remained attributable and the capital star remained clear.

Broader Guided Learning, Capital Connections, and post-state-curriculum acceptance passed **32/32** desktop/mobile Chromium cases. The initial focused run had one transient desktop Colorado rendered-feature query return an empty set before feedback; the unchanged case passed immediately on rerun and passed again in the final focused matrix. `git diff --check` passed. No Safari or physical-device run is claimed.

## Guided physical-geography regional progression — 2026-09-10

The physical orchestration checks now pin explicit east-to-west cohort stages, the contiguous current-Guided state frontier, a one-section lower-48 adjacency allowance, and Alaska's zero-lead rule. Fixtures cover a Guided-only reset with retained correct Alaska evidence, an out-of-order Alaska introduction that cannot advance the frontier, eastern-to-central-to-western mountain selection, Rockies before every related state is taught, Alaska eligibility only at stage 11 plus covered Alaska evidence, river/lake compatibility, oldest-ready cohort backlog drainage, 2–3 target batching, immediate focused retrieval, review priority, and deterministic targeted-family entry. Canonical evidence and review semantics remain unchanged. The complete fast baseline passed **109/109** checks.

The complete Guided orchestration browser suite passed **22/22** desktop/mobile Chromium cases, including the retained-Alaska reset regression, immediate Northeast retrieval, one-retry remediation, child reload/provenance, category and mixed review, interrupted teaching, and generated river/lake batches. The physical presentation suite's old seeds initially lacked current Guided state progress and therefore correctly returned to political learning under the new rule; after those fixtures were updated to include their cohort's state frontier, the suite passed **26/26** desktop/mobile cases. It reconfirmed Northeast and Alaska cameras, St. Lawrence interaction, mountain/river/lake rendering, pan/zoom, locating, visual emphasis, and reduced motion. `git diff --check` passed before commit. No Safari or physical-device run is claimed.

## Bounded lower-48 Guided state camera — 2026-09-10

The deterministic camera check pins the pure clamp examples `3.8 -> 4.7`, `4.9 -> 4.9`, and `6.4 -> 5.5`; authored/contextual center selection; state and capital resolution; visible-identification inclusion; hidden-answer locating exclusion; and the Alaska/Hawaii exception. The full fast baseline passed **109/109**. The permanent desktop/mobile Chromium camera suite passed **20/20**, including lower and upper clamps, an unchanged in-range authored camera, target transitions, manual navigation retention before a hidden locating prompt, reload/resume, and the independent Alaska and Hawaii entry cameras. The broader Guided capital-marker suite passed **12/12**, including true city coordinates, navigation relayout, and unchanged Utah, Alaska, and Hawaii teaching context.

A temporary all-state audit passed **96/96**: each of the 48 contiguous states entered as the current Guided teaching target at desktop and 390px portrait sizes, and every settled camera was within 4.7–5.5. That temporary spec was removed after acceptance. Desktop/mobile screenshots were reviewed for Rhode Island, Delaware, New Hampshire, Vermont, Ohio, Virginia, Colorado, California, Montana, and Texas. Small states retained surrounding-state context at the upper end of the band; medium states remained prominent with recognizable neighbors; large western states used the lower end and were no longer tiny. No state-specific exception was required. Alaska/Hawaii code and camera values were unchanged.

## Guided political camera regression — 2026-09-09

The deterministic camera check verifies authored-camera precedence, contextual section-camera retention, the measured distant-section correction, its 4.7 threshold and 0.2 minimum gain, hidden-answer locating exclusion, capital-to-state resolution, and the Alaska/Hawaii exception. The full fast baseline passed **109/109**. The permanent desktop/mobile Chromium camera suite passed **18/18** after the regression fix, and the broader Guided Learning plus Reconstruction browser set passed **30/30**.

A separate temporary visual matrix passed **24/24** and was removed after review. Settled teaching views were captured at desktop and 390px portrait sizes for New Hampshire, Vermont, Rhode Island, Massachusetts, Colorado, New Mexico, Montana, Wyoming, California, Texas, Alaska, and Hawaii. The northeastern views again showed useful surrounding states instead of forced individual-state fits. Colorado, New Mexico, California, and the measured desktop western views retained their suitable cohort framing; mobile Montana and Wyoming used the bounded correction. Texas received a desktop correction but retained its cohort fit on mobile because a complete-state fit did not improve the scale enough. Alaska and Hawaii retained their disconnected-geography cameras. No real-device, Safari, or landscape-mobile claim is made.

## Guided Reconstruction prerequisite regression — 2026-09-09

Every authored checkpoint now requires its own persisted Guided `state:*` introductions, in addition to the preceding-checkpoint chain. The focused checks cover all ten groups, a missing member in checkpoint 1, retained canonical evidence after a Guided-only reset, targeted routes, anchored Guided scoring, standalone translated-region tolerance, and unchanged evidence identities. `npm test` passed **109/109**.

Desktop and mobile Chromium acceptance passed **12/12** selected cases: Reset All Learning Progress starts ordinary Guided state teaching; a scoped reset with retained canonical evidence does not start Reconstruction; checkpoints 1, 2, and 10 launch only with their introduced Guided state groups; completed-child scoring/return remains intact; and a stale launched Reconstruction contract cannot bypass prerequisites after reload. A broader selected run passed 11/14; its two stale test expectations were corrected and the one unrelated mobile physical-camera timing assertion is tracked separately. `git diff --check` passed before commit.

## Guided capital-teaching city context — 2026-09-09

The final run passed **109/109** fast checks and **12/12** Guided capital browser cases across desktop and mobile Chromium. The existing capital-location suite also passed **10/10** cases while running with the shared renderer. Broader Guided camera and post-state-curriculum acceptance passed **34/36** before two camera assertions were updated from the retired ordinary-capital layer to the new teaching-context layer; both corrected desktop/mobile cases then passed. Repeated Utah timing checks passed **6/6**.

Browser coverage includes Cheyenne's forgiving capital-only hit area, an inert comparison-city tap with no evidence, canonical assisted evidence, neutral 150-choice retrieval, Providence, Boise reload/resume plus pan/zoom relayout, and safe-frame rendering for Utah, Hawaii, and Alaska. Desktop/mobile Boise, Utah, Hawaii, and Alaska screenshots were visually inspected. City coordinates remained unchanged; labels were readable and attributable; the capital star and comparison dots were distinct; and the Alaska/Hawaii teaching cameras kept all three city points visible. Real-device touch behavior and every capital/font/viewport combination remain outside this run.

## Post-state-curriculum routing — 2026-09-09

`scripts/check-post-state-curriculum.mjs` verifies the durable 50-state completion derivation, active-session precedence, near-even learned-only political review, deterministic replay, review-only physical selection, and the repeatable post-state reconstruction block. It confirms that unseen capitals cannot enter the mixed review and that normal Guided orchestration does not auto-select the post-state reconstruction block. `tests/e2e/post-state-curriculum.spec.js` passes **6/6** across desktop and mobile Chromium for the chooser layout, learned-only 5/5 political review, completed-checkpoint Reconstruction launch/reload/return, and introduced-only Physical Geography launch/return. Eight broader desktop/mobile checks also pass for ordinary incomplete Guided startup, deferred Reconstruction return, physical child reload/provenance, and rotating physical review. Desktop and mobile chooser screenshots were inspected; all option descriptions were visible, disabled state was clear, and no horizontal overflow or clipping was found.

The repository has a fast Node-based baseline and a separate Playwright browser layer. The fast baseline is the normal development check; Playwright covers selected browser flows and should be run in a supported local or CI environment.

## Guided political current-state camera — 2026-09-08 (superseded)

`scripts/check-united-states-guided-political-camera.mjs` covers state/capital prompt resolution, the 4.7 policy, name-to-place exclusion, and the Alaska/Hawaii exception. `scripts/check-daily-trail-us-states-11-alaska-learn-camera.mjs` confirms the authored disconnected-state cameras remain intact.

`tests/e2e/guided-political-camera.spec.js` runs on desktop and mobile Chromium. It covers Utah/Arizona state and capital transitions, Minnesota, Kansas, Montana, Maine, complete-state viewport containment, reload/resume, manual pan retention for a subsequent locating prompt, section context metadata, Alaska/Hawaii, and standalone exclusion. The final workstream run passed **18/18**. Desktop and mobile Montana captures were visually inspected: both showed the whole highlighted state with useful surrounding context and no tray/header obstruction.

The 4.7 requirement conflicts with full-state containment for Minnesota and Montana at the 390px portrait test width. Those two mobile cases settle above zoom 4.0 but below 4.7; forcing 4.7 visibly cropped state edges. The camera therefore preserves complete geography. No physical-device, Safari, or landscape-mobile claim is made.

The baseline includes `scripts/check-matched-seed-simulation-matrix.mjs`, which verifies O6.2 seed matching and answer-seed separation, deterministic replay, aggregation math, serialization, immutability, and unchanged planner output. Generate the larger descriptive matrix separately with `npm run report:matched-seed-simulations`; see [`matched-seed-simulations.md`](matched-seed-simulations.md).

The baseline also includes `scripts/check-long-horizon-mastery-report.mjs`. It checks O6.3 milestone and percentage calculations, status-count invariants, ordered diagnostic histories, exact replay, JSON serialization, fixture immutability, and unchanged planner output. Generate the six-seed 200-session analysis with `npm run report:long-horizon-mastery`; see [`long-horizon-mastery.md`](long-horizon-mastery.md).

The baseline includes `scripts/check-progress-score-comparison.mjs` for the isolated progress-score experiment. It checks deterministic formula replay, bounds, input immutability, Bayesian and BKT calculations, no response-free time decay, JSON serialization, fixture immutability, current-counter projection, and unchanged planner output. Generate the comparison with `npm run report:progress-score-experiment`; see [`experimental-progress-scores.md`](experimental-progress-scores.md).

The baseline includes `scripts/check-learning-progress-reset.mjs`. It pins the complete learner-state reset manifest, verifies deterministic/idempotent global removal and storage-failure continuation, proves that scoped resets retain canonical evidence, checks explicit runtime labels/wiring, and verifies that settings, preferences, developer configuration, and unknown future preference keys survive. See [`learning-progress-reset.md`](learning-progress-reset.md).

The baseline includes `scripts/check-daily-trail-starvation-protection.mjs`. Across a deterministic multi-session scenario, it verifies that Daily Trail's existing old-section review lane eventually serves every waiting eligible due item even while a persistently failed item keeps strong remediation pressure. It also pins unchanged new-item introduction and future-due mastered-item recession. Together with `scripts/check-united-states-memory-trail-fairness.mjs`, this closes starvation protection across the two adaptive U.S. review planners.

## Setup

Install JavaScript dependencies and the Chromium browser used by the test projects:

```sh
npm install
npx playwright install chromium
```

## Fast development baseline

Run every standalone Node assertion check with one command:

```sh
npm test
```

The command discovers every `scripts/check-*.mjs` file, runs each check in an isolated Node process, reports every failure, and returns a nonzero exit code if any check fails. These checks cover a mixture of unit-level engines, integration between data and modules, content/data validation, persistence serialization, and narrow production-wiring assertions. They do not launch a browser, measure JavaScript coverage, or replace manual acceptance.

The checks are executable assertions rather than a uniform test framework. Some production-wiring checks inspect source text because `src/maplibre-poc.js` does not expose those browser functions as importable modules. Such assertions should target a stable behavior boundary or wiring contract and should not pin cache-buster values or incidental formatting.

## Canonical evidence parity check

`scripts/check-canonical-evidence-parity.mjs` runs deterministic Journey, U.S. Memory Trail, Daily Trail, Mental Map, Map Reconstruction, duplicate-protection, missing-emission, and reload scenarios. It compares only equivalent legacy and canonical fields, preserves intentional abstraction differences, verifies fixture immutability and JSON serialization, and checks that production wiring remains additive. Generate its Markdown and JSON evidence with:

```sh
npm run report:canonical-evidence-parity
```

See [`canonical-evidence-parity-validation.md`](canonical-evidence-parity-validation.md) for the proof boundary and migration prerequisites.

`scripts/check-progress-report-canonical-shadow.mjs` validates the retained comparison diagnostic. It verifies deterministic item × skill comparisons, unchanged legacy/repository inputs, the shared Bayesian scoring function, locating/naming separation, assisted-evidence exclusion, policy-history/raw-event non-double-counting, persistence, reset, and JSON/Markdown output. Generate its developer report with:

```sh
npm run report:progress-report-canonical-shadow
```

See [`progress-report-canonical-shadow.md`](progress-report-canonical-shadow.md) for the adapter boundary and migration assessment.

`scripts/check-progress-evidence-policy.mjs` validates the UI-independent Progress Evidence Policy against current canonical events. It covers cross-mode Ohio location history, naming/location separation, assisted and partial treatment, Mental Map and reconstruction isolation, event-ID deduplication, capital subskill separation, deterministic replay, serialization, immutability, and the explicit contextual-evidence contract gap. Run it directly with:

```sh
npm run check:progress-evidence-policy
```

See [`progress-evidence-policy.md`](progress-evidence-policy.md) for the inclusion matrix, historical baseline direction, and migration criteria.

`scripts/check-progress-report-canonical-first.mjs` validates the guarded production read path. It covers clean-new-learner enrollment, persistent reload selection, existing and ambiguous legacy fallback, corrupt repository and invalid marker fallback, strict shadow fallback, cross-mode state evidence, separate identification, the temporary capital rollup, unseen behavior, event deduplication, persistence/reset, deterministic output, unchanged Memory Trail planning, and runtime wiring. Run it with:

```sh
npm run check:progress-report-canonical-first
```

See [`progress-report-canonical-first.md`](progress-report-canonical-first.md) for eligibility and fallback semantics.

`scripts/check-state-capital-relationship-learning.mjs` validates I1 Capital Connections. It derives exactly 50 relationships from the canonical atlas, checks both prompt directions, canonical concept identity, answer correctness, correct/incorrect persistence, event deduplication, Progress Evidence Policy separation, canonical Progress Report rollup, existing-user fallback, 50/50 assessed coverage, D.C. exclusion, unchanged Memory Trail planning, and production wiring. Run it with:

```sh
npm run check:state-capital-relationships
```

`scripts/check-united-states-relationship-learning.mjs` validates I2 U.S. Connections. It proves that all 50 Census-region memberships remain trusted Atlas/reporting metadata but generate no learner-facing question; derives the retained 17 international-border edges, 25 coast edges, 36 major-river edges, 13 Great Lakes edges, and 61 mountain-range edges; proves that every physical target already belongs to the scored U.S. physical curriculum; and checks answer semantics, multi-relationship distractors, canonical persistence and deduplication, Progress Evidence Policy routing, the optional canonical Geographic Relationships report category, ordinary Mental Map isolation, merged coverage identities, D.C. exclusion, unrelated Journey region preservation, and production wiring. Run it with:

```sh
npm run check:us-relationships
```

`scripts/check-unlabeled-map-hint.mjs` validates the reusable attempt-local map-hint state, the label-free 50-state plus District of Columbia outline asset, independent/assisted/incorrect canonical outcomes, unchanged earned/possible activity credit, event deduplication, and the existing Progress Report exposure-only treatment for assisted evidence. The U.S. Connections Playwright coverage additionally verifies Show/Hide behavior, selection preservation, no pre-submit answer visualization or evidence write, per-question reset, visible feedback, and ordinary Mental Map isolation on desktop and mobile.

`scripts/check-capital-connections-map-feedback.mjs` validates post-answer Capital Connections teaching context in both prompt directions. It checks Atlas-derived adjacency, the canonical capital asset's real coordinates, neutral neighbor classification and labels, target-plus-neighbor camera bounds, correct/incorrect semantic preservation, and pre-submit/reset suppression. The matching desktop/mobile Playwright spec verifies the visible star and label layers, neutral neighbor fill, camera fit, and learner feedback.

## Capital-location city-choice checks

`scripts/check-us-capital-location-city-choices.mjs` validates the fixed 2020 Census-derived display dataset: 50 states, 50 canonical capitals, 100 distinct non-capital city choices, every section activity alias, finite coordinates, immutable lookups, and the absence of distractor target/evidence identities. `scripts/check-capital-location-question.mjs` validates the 150-choice question state, active authored capital coordinates, target/wrong-state disclosure, Rhode Island and Delaware close-scale data, Alaska and Texas coverage, a populous-capital case, and evidence-free renderer properties. `scripts/check-capital-location-label-placement.mjs` drives the production placement function with Colorado, Connecticut, Rhode Island, Delaware, Texas, responsive viewport, multiple zoom, dense four-label, and forced-displacement fixtures. It checks determinism, bounds, label/marker/star clearance, capital and selected-wrong priority, one marker-edge-to-label-edge connector per disclosed name, and input/coordinate immutability. See [the source, rendering, and derivation contract](us-capital-location-city-choices.md).

`tests/e2e/capital-location-city-choices.spec.js` covers equal pre-answer marker and hit-area expressions, no labels or stars before answering, cursor neutrality, manual zoom and pan before answering, successful hit testing after a transformed viewport, and post-answer relayout after another transform. Correct, same-state-wrong, and wrong-state feedback exercise Colorado, Connecticut, Rhode Island, Delaware, and Texas on desktop and mobile. The checks inspect actual DOM label rectangles and SVG leaders, prove clearance from revealed markers and the capital star, verify capital-first placement and selected-wrong styling, and confirm authored coordinates remain unchanged. `tests/e2e/guided-capital-markers.spec.js` additionally verifies the Guided route and proves that a distractor miss writes one incorrect event for the canonical capital-location concept rather than creating distractor evidence.

Guided first exposure uses the same frozen city-choice record in a target-state-only teaching mode: the capital star, its two comparison dots, and three collision-aware connector-backed names appear together, while only the canonical capital is interactive. The Guided marker spec verifies teaching disclosure, inert comparison-city taps, canonical assisted evidence, the following highlighted-place naming retrieval, and later 150-dot unlabeled locating only after naming succeeds. The overlay recalculates from true projected coordinates after map transforms; it never changes city coordinates or evidence identity.

On 2026-09-08, the final capital-label run passed **108/108** fast checks, **10/10** focused desktop/mobile capital-location browser cases, and **8/8** broader desktop/mobile Guided-capital and Capital Connections cases. Screenshots of Colorado, Connecticut, and Rhode Island feedback were visually inspected at desktop/mobile scale; labels remained attributable, the capital star stayed clear, selected wrong cities retained their red feedback treatment, and connectors stayed lightweight. These runs do not claim real-device touch coverage or exhaustive font/viewport combinations.

`scripts/check-neutral-selection-balance.mjs` holds all 100 U.S. Memory Trail items at equivalent mastery and scheduling state, then verifies exact replay, input immutability, 10,000 selections, regional and state/capital shares within ±20% of eligible content, and nonzero selection for every item. It also drives the extracted production prompt selector for 10,000 ordinary-review and 10,000 early-chunk prompts, verifying that locating and identifying stay within ±20% of their intentional 50/50 and 70/30 targets without starving either objective. Controlled production-planner probes additionally verify that future-due mastered material recedes completely while due non-mastered review is available, and that due mastered material remains eligible when it is the available review pool. Run it with:

```sh
npm run check:neutral-selection-balance
```

## Browser/E2E tests

Run Playwright separately:

```sh
npm run test:e2e
npm run test:e2e:us
npm run test:e2e:headed
```

Playwright starts a local static server on port 4173. Every browser flow runs at a 1440x900 desktop viewport and with an iPhone 13-sized mobile Chromium profile.

Playwright requires an environment that permits a localhost server and Chromium process startup. In the restricted inspection sandbox used for the 2026-08-14 baseline audit, the server could run after localhost permission was granted, but Chromium exited before page launch because macOS denied its Mach-port registration. That is a test-environment limitation, not an application test failure. A supported run needs installed dependencies and Chromium (`npm install` and `npx playwright install chromium`) plus an ordinary local shell or CI runner that permits browser processes and localhost port 4173.

## Test mode

The smoke tests open `http://127.0.0.1:4173/?test=1`. On a local hostname, that query parameter installs the narrow `window.__MAPPA_TEST_API__` hook. The hook exposes snapshots of the current activity, attempt state, Journey, step, valid targets, active U.S. Memory Trail plan, and saved Journey progress, plus deterministic helpers for correct/incorrect placements, activity reset, and activity completion. It is not installed without `?test=1`, and it is never installed on a non-local (production) hostname.

## Current coverage

The U.S. Journey smoke test passes the launch screen, enters Challenge Yourself, chooses the United States Journey, selects Medium, starts Play, confirms the first activity and targets, completes that activity through the test hook, verifies saved progress, and verifies advancement to a different second activity.

The Journey input regression makes one incorrect placement, verifies the miss and lack of completion, corrects the same target, and resets the activity to zero completed targets and zero attempt errors. Every Journey flow also fails on uncaught page errors or browser-console errors.

The reload/resume regression completes the first U.S. activity, reloads the page, returns through the launch screen, uses the visible Continue Journey card, and verifies that activity two resumes on Medium without resetting or double-incrementing progress. It then completes activity two and confirms activity three loads with exactly two completed steps saved.

The journey-completion regression seeds the completed prerequisite U.S. activities, resumes the final activity through the visible Continue Journey card, completes that activity through the deterministic test hook, and verifies the final completion screen and saved completion flag. After a reload, it confirms the journey is offered for review from the beginning rather than as an incomplete journey to continue. Viewing the completed journey must not erase or increment its saved progress.

The U.S. system smoke spec covers the primary Across the United States Expedition, its nine milestones, recommended step, Atlas launch, and return routing. It launches a clean Daily Trail into guided introduction and a seeded U.S. Memory Trail into a plan that contains both new content and an eligible weak/due adaptive review. It submits a U.S. Connections retrieval attempt, opens ordinary Mental Map, and loads a playable regional Reconstruction piece bank. These flows collect uncaught page errors and error-level console messages; the Atlas exit coverage caught and now guards a formerly invalid empty-status MapLibre paint expression.

Reset acceptance covers the explicit global confirmation and cancellation path, every key in the global learner-state manifest, preference survival across the resulting reload, and canonical-history retention by activity, Daily Trail, and U.S. Memory Trail scoped resets. The global action is intentionally allowlist-based rather than using `localStorage.clear()`.

The spatial regression test checks that the U.S. regional question pool is populated, IDs are unique, Gulf Coast coverage has at least three eligible questions, and selection does not immediately repeat the same Gulf Coast question when alternatives exist.

Map feel, narration timing and quality, visual polish, real-device touch/drag behavior, and geographic-label placement remain intentionally manual. Those are perceptual or hardware-sensitive checks and should not be inferred from deterministic state hooks.

## Supported browser baseline (2026-08-21)

`npm run test:e2e` completed successfully in a supported local environment: **26/26 project/test combinations passed** across desktop Chromium and the iPhone 13-sized mobile Chromium profile. The same checkout passed the fast baseline at **81/81**. This is the repository's current automated browser acceptance record; it is not a real-device, Safari, audio-quality, accessibility, or visual-polish sign-off.

## Stabilization disposition (2026-08-14)

The six checks previously recorded as stale or uncertain in `CURRENT_STATE.md` were investigated without changing production behavior:

| Check | Classification | Disposition | Production change justified? |
| --- | --- | --- | --- |
| `check-compass-challenge.mjs` | Stale assertion | It expected no `east-of-nevada` question audio after the activity-audio registry and prerecorded asset had been added. It now verifies the registered entry and tracked asset. | No |
| `check-daily-trail-mixed-checkpoint.mjs` | Stale assertion | It pinned old app-module cache keys unrelated to checkpoint behavior. It now verifies that both app shells load the production module with a cache key, without pinning its value. | No |
| `check-daily-trail-mobile-section-quiz-camera.mjs` | Undocumented intentional behavior represented by a stale assertion | Runtime intentionally shares this camera path between Daily Trail and U.S. Memory Trail through `isAdaptiveTrailMemoryTrail()`. The assertion now verifies the shared adaptive-trail gate and existing exclusions. | No |
| `check-daily-trail-us-states-01-camera.mjs` | Stale assertion | Camera data was valid; the wiring assertion still expected Daily Trail only. It now verifies the intentional Daily Trail/U.S. Memory Trail integration. | No |
| `check-daily-trail-us-states-02-camera.mjs` | Stale assertion | Fixed and mobile camera data was valid; both wiring assertions predated U.S. Memory Trail reuse. They now verify the shared integration. | No |
| `check-daily-trail-us-states-03-camera.mjs` | Stale assertion | Camera data was valid; the wiring assertion still expected Daily Trail only. It now verifies the intentional shared integration. | No |

The camera checks still combine exact fixture validation with narrow source-wiring assertions. They prove that approved configuration and expected integration hooks are present; they do not prove rendered camera framing. Rendered desktop/mobile camera behavior remains an E2E or manual acceptance concern.

## Deterministic planner and challenge mode

Adaptive planning and generated Mental Map selection accept optional deterministic dependencies for replay-oriented checks and debugging. Production callers do not pass these options, so their existing clock, random, curriculum-order, and rotating-order behavior remains unchanged.

```js
const options = {
  seed: "learner-scenario-01",
  now: () => new Date("2030-01-15T18:30:00.000Z")
};

const dailyPlan = planDailyTrailSession(dailyState, dailyItems, options);
const usPlan = planUnitedStatesMemoryTrailSession(usState, usItems, options);
const challenge = createGeneratedShortestRouteChallenge({ seed: options.seed });
```

The shared helpers in `src/deterministic-dependencies.js` provide `createSeededRandom(seed)` for APIs that already accept a raw random function, `resolveRandomSource()`, fixed-clock resolution, and stable seeded tie ranks. A seed may be any repeatable serializable value; strings are recommended for readable test scenarios. A clock is a function returning a `Date`, timestamp, or other value accepted by the `Date` constructor.

Deterministic coverage by system:

| System | Seeded | Fixed time |
| --- | --- | --- |
| Daily Trail | Equal-priority review candidates and groups receive reproducible tie ranks. With no seed, existing rotating/curriculum fallbacks are used. | Planning uses the injected local date for due/cooldown decisions. State normalization, teaching updates, and session-result scheduling also accept the injected clock. |
| U.S. Memory Trail | Equal-priority review candidates receive reproducible tie ranks. New-item curriculum order is intentionally unchanged. | Plans, recovered session IDs, session starts, and snapshots can use the injected timestamp. |
| Mental Map | Generated shortest-route choice, unified challenge-pool generation, and next-challenge selection accept `seed` or an explicit `random` function. | Generated challenges currently have no time-dependent behavior. |

The audit found no planner use of `Math.random`: Daily Trail previously used curriculum order, input-stable sorting, and a session-number-derived rotating hash, while U.S. Memory Trail used curriculum order as its final priority tie-break. Seeded mode is deliberately opt-in so it does not alter those production defaults. U.S. Memory Trail used `Date.now()` for plan/session IDs and active-session timestamps. Daily Trail read the current local date for due items, review cooldowns, normalized legacy progress, teaching progress, and result scheduling. Mental Map generation and selection used `Math.random` defaults with optional raw random callbacks.

Deterministic mode does not freeze browser timers, animation timing, response duration, audio scheduling, map behavior, localStorage, or unrelated runtime calls to `Date.now()`/`Math.random()`. It does not make learner responses deterministic, seed answer-bank shuffling automatically, or create a simulation framework. Callers that need deterministic answer-bank order can pass `createSeededRandom(seed)` through the answer-bank API's existing `random` option.

`scripts/check-deterministic-planning.mjs` proves same-seed replay, different-seed valid variation, fixed-time scheduling/session metadata, generated Mental Map replay, and working no-options production paths for the scoped systems.

## Learning Inspector runtime check

`scripts/check-learning-inspector.mjs` exercises the read-only Inspector adapters and local panel projection documented in [`learning-inspector.md`](learning-inspector.md). Fixtures cover place mastery, Daily Trail, U.S. Memory Trail, Journey progress, Mental Map results, reconstruction results, planner selection explanations, deterministic-context export, canonical summaries/recent responses, filtering, and before/after transitions. The check verifies that adapters do not mutate input state, equivalent inputs produce stable JSON, missing evidence remains explicitly unavailable, deterministic planner replays produce equivalent Inspector output, and runtime installation remains guarded to local development.

## Evidence-Driven U.S. Continuation checks

`scripts/check-evidence-driven-continuation-foundation.mjs` validates the shared readiness classifications and required-family policy. Rivers, Lakes, and Mountain Ranges are required for Physical Features readiness; Coast relationship evidence remains canonical and reportable but does not block that objective. `scripts/check-evidence-driven-united-states-continuation.mjs` replays 12 deterministic learner profiles covering fresh entry, regional and capital gaps, optional Label Map/Explore visits, physical-family priority, Connections, integrated Explore, and assisted-only evidence. The globe-navigation browser suite verifies the primary Learn action, actual Guided Learning mode, last-screen independence, reset semantics, manual alternatives, and evidence-based advancement to Rivers on desktop and mobile.

## Expedition framework check

`scripts/check-expedition-framework.mjs` validates the reusable Expedition configuration/read model and the “Across the United States” composition. It covers new, partial, and out-of-order direct-entry evidence; prerequisite unlocking; recommended-step selection; configuration errors; required mechanic references; the absence of an Expedition storage system; preservation of direct-entry menu paths; and runtime use of existing Journey, U.S. Memory Trail, and canonical evidence.

A browser acceptance pass on 2026-08-21 verified the main-menu Expedition entry, nine-step hub, enabled/locked states for a new learner, Atlas launch and return, and absence of horizontal overflow at a 390×844 mobile viewport. No browser console errors were observed on that path.

## Central America architecture graduation

`scripts/check-central-america-graduation.mjs` applies the existing deterministic and canonical infrastructure to exactly Belize, Guatemala, Honduras, El Salvador, Nicaragua, Costa Rica, and Panama. It checks configuration, activity normalization, seeded answer-bank replay, canonical event creation and persistence, Progress Evidence Policy histories, the generic canonical Progress Report, Learning Inspector, ordinary Memory Trail Selection Trace, Expedition progression, and production wiring.

`tests/e2e/central-america-graduation.spec.js` runs the same production flow in both supported browser projects. It covers the Learn Your World entry, bounded Expedition, live Journey evidence, Inspector, evidence-derived resume, shared Progress Report, and ordinary Memory Trail trace while failing on runtime errors. See [Central America Architecture Graduation Report](./central-america-architecture-graduation.md).

## Unseen-introduction guard check

`scripts/check-unseen-introduction-guard.mjs` verifies the production Memory Trail boundary between guided exposure and retrieval assessment. It checks that an unexposed current-window target is selected for guidance before retrieval branches, exposure without a completed guided tap remains guarded, a single-item window cannot deadlock, guided results return before retrieval counters update, and canonical guided evidence is labeled `assisted` rather than correct or incorrect retrieval.

## Deterministic learner simulations

Run the O4 synthetic learner evidence generator with:

```sh
npm run report:learner-simulations
```

It drives the existing U.S. Memory Trail planner with eight deterministic learner profiles and adds a controlled Daily Trail return probe. The command writes human-readable Markdown and machine-readable JSON under `reports/`. The fast baseline's `check-learner-simulations.mjs` verifies deterministic replay, different-seed variation, all profile scripts, Inspector serialization, and fixture immutability. See [`learner-simulations.md`](learner-simulations.md) for profiles, interpretation, and measurement limits.

## Selection Trace check

`scripts/check-selection-trace.mjs` verifies that O5.5 tracing leaves Daily Trail, U.S. Memory Trail, and Mental Map selection outputs and state unchanged; reproduces equivalent traces under deterministic inputs; accurately reports available pool metadata; labels unavailable information; and remains JSON serializable. Generate the controlled Ohio example with:

```sh
npm run report:selection-trace
```

See [`learning-inspector.md`](learning-inspector.md) for the trace schema, evidence boundaries, and interpretation limits.

## Eligibility delay report check

`scripts/check-eligibility-delay-report.mjs` verifies deterministic O6.1 report replay, stable item IDs, explicit unavailable eligibility, correct separation of eligibility and selection, JSON serialization, fixture immutability, and unchanged planner/simulation output. It also preserves the known Wyoming eight-session deferral and Ohio zero-delay/consecutive-selection observations as regression evidence.

Generate the Markdown and JSON reports with:

```sh
npm run report:eligibility-delays
```

See [`eligibility-delay-report.md`](eligibility-delay-report.md) for the measurement model and limits.

## Guided Reconstruction checkpoints (2026-09-05)

The fast suite now includes `check-guided-reconstruction-checkpoints.mjs` and `check-guided-reconstruction-evaluation.mjs`. They cover section parity, all ten layouts, sequential prerequisites, targeted continuation reachability, target-only canonical events, legacy completion, and anchored scoring with unchanged standalone normalization. `tests/e2e/guided-reconstruction.spec.js` covers primary Learn entry, locked context, keyboard/reset behavior, submission, reload/return, and standalone isolation on desktop/mobile Chromium. Physical-family continuation fixtures explicitly mark Reconstruction checkpoints submitted so those tests continue to isolate family routing. See [the design and proof boundaries](guided-reconstruction-checkpoints.md).

### Interruption recovery and broader-suite disposition

The interrupted implementation completed `npx playwright test --output=/tmp/mappa-guided-full-playwright`: **156 passed, 12 failed (168 total)**. Its new Guided Reconstruction spec passed all 8 desktop/mobile cases. On resumption, the Lead recovered the complete log rather than treating the unfinished run as a green baseline.

An isolated `git archive 66509f0` copy, with the same installed Playwright dependencies and a separate localhost port 4175, reran the seven logical failing scenarios on both browser profiles (14 cases): **4 passed, 10 failed**. The ten failures reproduce unchanged on the base commit:

| Existing failure | Cases | Observed boundary |
| --- | --- | --- |
| `canonical-physical-evidence.spec.js`: correct river placement | 2 | Expected Journey canonical river evidence is absent. |
| `central-america-graduation.spec.js`: shared architecture graduation | 2 | Expected Journey canonical country-location evidence is absent. |
| `us-journey-smoke.spec.js`: initial save/advance, miss/correction/reset, activity-two reload | 6 | Recommendation overlay does not expose the expected `Play Now` action; timeout before the tested flow. |

These remain follow-up work, outside the bounded Guided Reconstruction implementation. The full suite is not green. The other two original failures were mobile physical-camera assertions (Northeast teaching-to-retrieval camera and Ozark national search-space coverage); both passed on the base reproduction and are included in the resumed implementation acceptance run.

The resumed fast suite initially exposed two stale assertions pinned to old runtime/CSS cache keys. `check-learning-terminology-entry-flow.mjs` and `check-mental-map-challenge.mjs` now verify nonempty, matching asset versions across both HTML entries. After that correction, **103/103 fast checks passed**.

The resumed acceptance command below passed **18/18 desktop/mobile cases (2.6 minutes)**, including both previously failing mobile camera cases. Those two failures were not reproduced; they remain possible intermittent camera/timing issues rather than established regressions. The complete 168-case suite was not redundantly rerun after these test/documentation-only corrections.

```sh
npx playwright test tests/e2e/guided-reconstruction.spec.js tests/e2e/guided-learning-orchestration.spec.js tests/e2e/globe-navigation-prototype.spec.js tests/e2e/guided-physical-presentation.spec.js --grep 'Guided checkpoint|standalone New England|Guided Learning orchestrates|leaving an orchestration checkpoint|strong canonical Stage 1|a Lakes continuation|search-space retrieval for ozark' --output=/tmp/mappa-guided-resumed-acceptance
```

The Lead also reran the five focused Node scripts (`check-map-reconstruction`, `check-guided-reconstruction-evaluation`, `check-guided-reconstruction-checkpoints`, `check-guided-learning-orchestration`, and `check-guided-learning-physical-feature-orchestration`), reviewed all changes, checked documentation links, and passed `git diff --check` before commit.

## Reconstruction map navigation — 2026-09-05

Based on clean `d562c40`, with one bounded UI/map specialist and Lead integration/review:

- `npm test`: **105/105 passed**. Includes new `check-reconstruction-map-style.mjs` (real GeoJSON palette parity across subsets) and `check-reconstruction-viewport.mjs` (portrait/landscape fit, zoom anchor, limits, pan), existing Guided anchored evaluation, standalone translation acceptance, and capstone checks. After the final gesture-cleanup adjustment, UI syntax and focused Reconstruction/capstone/Guided evaluation checks passed again.
- Final single-invocation browser acceptance: **14/14 passed**, desktop and mobile Chromium. Command: `npx playwright test tests/e2e/reconstruction-navigation.spec.js tests/e2e/guided-reconstruction.spec.js tests/e2e/political-division-rendering.spec.js --grep 'framing and transformed placement|uses its section|standalone New England|France renders' --workers=1`.
- Navigation fixture uses production geometry/UI for checkpoints 2 and 10, auto-fit at widths 390/768/1440, native-size desktop/mobile gestures, zoom buttons, wheel, background pan/pinch, second-touch exclusion during piece pickup, transformed piece and shelf dragging, submission, camera persistence across rerenders/responsive result layout, Reset fit, and page errors. Production Guided routes additionally cover checkpoints 1/2/10, locked context, target-only evidence, reload/return, and standalone six-state New England.
- Broader browser command included full `guided-learning-orchestration.spec.js`, `political-division-rendering.spec.js`, and navigation: **26/28 passed initially**. The desktop Guided physical-camera persistence assertion passed on a focused rerun without application changes. The mobile France hit/feedback assertion passed in final acceptance. Treat these as intermittent failures, not an initially green broader run.
- One overlapping acceptance invocation lost its shared local server when the owning Playwright invocation exited (11 connection-refused failures after 3 passes); final acceptance above ran alone. Earlier new-test failures were corrected harness issues: reversed hit-test arguments and an exact-viewBox assertion that did not allow responsive result height changes.
- Lead inspected main U.S. map and Reconstruction screenshots, plus the full code diff. `git diff --check` passed. No full-suite rerun, live deployment, Safari, or physical-device touch certification is claimed. Full-country mobile labels can crowd in the Northeast; zoom remains available. Historical unrelated full-suite failures are recorded above.

## Guided physical-geography pacing — 2026-09-07

The physical pacing checks now cover the full 34-target inventory, the 33 supported targets, thirteen introduction cohorts, and the St. Lawrence geometry deferral. Scheduler fixtures reproduce Colorado/New Mexico-like progress and verify three-target mountain, river, and lake batches; immediate retrieval; lower-48 introduction before related-state coverage; Alaska's retained state gate; new-content priority over due old review; rotating three- or four-target family review; mixed review thresholds and three-family composition; deterministic replay; and unchanged canonical entity meanings.

The focused checks are `check-guided-learning-physical-feature-orchestration.mjs`, `check-guided-learning-orchestration.mjs`, `check-guided-physical-retrieval-checkpoint.mjs`, `check-canonical-physical-evidence.mjs`, `check-guided-child-launch-contract.mjs`, and `check-evidence-driven-united-states-continuation.mjs`. Browser acceptance in `guided-learning-orchestration.spec.js` covers three-range teaching and immediate retrieval, one-retry remediation, child provenance/reload, varied family review, introduced-only mixed review with canonical evidence, interrupted teaching resume, and generated river/lake batches. `guided-physical-presentation.spec.js` retains desktop/mobile camera, pan/zoom, geometry, and interaction checks.

Final validation passed **107/107 fast checks**. The combined desktop/mobile browser run passed 28 cases and exposed six stale expectations that still assumed one-target Lakes introduction or Black Hills as the first member of its cohort. After updating those tests to assert the three-lake batch and advance through the central-mountain teaching sequence, the affected **6/6** cases passed on desktop and mobile. Together, all 34 selected logical acceptance cases passed with the completed behavior. Historical full-suite failures above remain separate; no complete all-browser-suite, Safari, or physical-device run is claimed.

## St. Lawrence River locating geometry — 2026-09-08

The St. Lawrence source audit confirmed that Natural Earth record `1159114637` contains only a short western New York–Ontario reach and that the bundled North America supplement has no continuation. The replacement is a checked-in extract of OpenStreetMap waterway relation `6122656`, version 37, automatically joined and simplified without moving coordinates by hand. Validation requires source attribution, relation identity, connected geometry, expected bounds, and coverage at the Lake Ontario outlet, international reach, Montreal, Quebec City, and lower estuary/Gulf transition. See [the source and scope decision](st-lawrence-river-geometry.md).

Focused source and scheduler checks passed: the river proof-sheet build and validator, the St. Lawrence source audit, physical-feature orchestration, Guided orchestration, bounded physical retrieval, canonical physical evidence, Guided child launch persistence, and Evidence-Driven Continuation. The orchestration inventory now reports **34 audited and orchestrated, with 0 geometry deferrals**; the unrelated Red River remains a documented proof-sheet source-data deferral outside the 34-target Guided inventory. The complete fast suite passed **107/107** checks.

Desktop and mobile Chromium coverage verifies the full source bounds, initial responsive eastern-rivers framing, rendering and hit testing at four separated portions of the course, rejection of a point outside the river corridor, manual pan and zoom, incorrect-selection correction, successful locating after the transformed view, and unchanged canonical `assisted`/`incorrect` evidence. The existing bounded-child browser coverage supplies reload persistence for the shared Guided contract. Visual inspection covered normal mobile framing, the tighter desktop framing, and a zoomed/panned desktop view. A single broader desktop/mobile run passed **10/10** selected cases across the St. Lawrence interaction, bounded-child reload, rotating family review, mixed review, and generated river flow. No Safari, physical-device, deployment, or street-level hydrographic precision claim is made.
