# CODEX PROJECT HISTORY: ATLAS QUEST

This is a technical AI handoff document for `C:\Users\jryan\OneDrive\Desktop\geography-memory-app`.

Audience: another technical AI assistant acting as product manager, architecture reviewer, UX critic, debugging partner, or Codex prompt author. Assume no repository access unless explicitly supplied later. This document favors source paths, state names, render flow, and known risks over beginner explanation.

Last updated: 2026-05-21.

## 1. PROJECT PURPOSE

Atlas Quest is a geography-learning game shell built around map exploration, label/chip placement, study preparation, and curated journeys. The intended audience is children and families using geography memory work, with enough polish that an adult product owner can manually test it and treat it as a real MVP rather than a prototype exercise.

The product vision is:

- A calm but game-like geography app where learners build familiarity with places by seeing, hearing, selecting, placing, and reviewing them.
- A journey structure that sequences activities into coherent learning paths.
- A Study Mode that lets a learner preview and prepare without scoring pressure.
- A Journey Mode that feels like an adventure path: choose journey, choose difficulty, complete steps, auto-advance/fly to the next destination, save local progress.
- A Free Play mode that eventually becomes exploratory discovery: click target -> information card -> related places -> mini challenge -> discovery/progress.

Design philosophy:

- Prioritize core gameplay reliability and visual clarity over feature count.
- Keep the map as the primary activity surface; navigation/actions belong in top/bottom/shell UI, not inside the map.
- Use large touch-friendly controls.
- Avoid clutter and avoid developer/debug controls in learner-facing gameplay.
- Difficulty means "amount of help", not a different curriculum path.
- Read-aloud is an accessibility/support feature, not a hint or difficulty modifier.
- Required activity targets must never be hidden by optional layer/settings toggles.

Current MVP definition:

- Production entry opens a polished Atlas Quest title screen.
- Start leads to Main Menu.
- Main Menu supports Continue Journey, Choose Journey, Free Play, Settings, Back to Title.
- Choose Journey shows available/locked/coming-soon journey cards.
- Journey Detail shows Play Journey and Study.
- Play Journey uses pre-game difficulty, launches activities, saves progress, auto-advances between steps, and shows completion states.
- Study Mode v1 allows preview/reveal and easy practice of journey steps without affecting Journey progress.
- Free Play supports neutral world browsing and country selection/info cards, but it is not a primary MVP path.
- Settings supports Map Layers / Study Targets at a granular enough level to preserve future curriculum work.
- Core gameplay is reliable on desktop and acceptably usable on tablets; phone usability remains a major risk.

Late July MVP target:

- The project has been treated as targeting a late-July MVP.
- Highest-priority work before that date should be stabilization, navigation consistency, gameplay correctness, mobile/touch reliability, and visual polish.
- Expansion into additional country/political-division datasets is lower priority unless needed for an already-promised MVP journey.

Current prioritization decisions:

- Free Play is strategically important but not an MVP priority. It should not be allowed to destabilize Journey Mode or core activity play.
- Historical geography is intentionally postponed. Keep modern political geography separate from historical geography.
- Core gameplay quality, kid-readable UI, map clarity, and completion/advance behavior matter more than adding more countries, facts, layers, or journeys.

## 2. CURRENT PRODUCTION ENTRY PATH

Current production entry:

- `index.html`
  - Public root entry.
  - Sets title `Atlas Quest`.
  - Uses `<meta http-equiv="refresh" content="0.2; url=maplibre-poc.html" />`.
  - Also calls `window.location.replace("maplibre-poc.html")` after 200 ms.
  - Includes fallback links to `maplibre-poc.html` and `legacy-svg-app.html`.
  - This is a redirect/splash shim, not the real app.

Actual production app:

- `maplibre-poc.html`
  - Despite POC name, this is the current production app shell.
  - Loads MapLibre GL from CDN: `https://unpkg.com/maplibre-gl@5.18.0/dist/maplibre-gl.js`.
  - Loads CSS: `maplibre-poc.css?v=minimal-compass-launch`.
  - Loads module: `src/maplibre-poc.js?v=minimal-compass-launch`.
  - Contains the launch screen, app shell screen, gameplay header, map container, browse drawer, answer panel, journey completion overlay, activity retry overlay.

Deprecated/legacy path:

- `legacy-svg-app.html`
  - Legacy SVG app. It was once the main path and still exists for comparison/fallback.
  - Loads `styles.css` and `src/app.js`.
  - Should not be treated as source of truth for new Atlas Quest work.
  - Some legacy activities/tools may still only work there.

Dev/testing/experimental paths:

- `maplibre-poc.html`
  - Production in practice and dev path simultaneously.
  - Run via local static server, usually `python -m http.server 4173 --bind 127.0.0.1`, then open `http://127.0.0.1:4173/maplibre-poc.html`.
- `ocean-texture-preview.html`
  - Preview harness for ocean texture experiments.
- `docs/*.md`, `scripts/*.js`
  - Dev/planning/reporting, not production runtime.

Source-of-truth files for current production:

- `maplibre-poc.html`
- `maplibre-poc.css`
- `src/maplibre-poc.js`
- `src/maplibre/maplibre-activity-runner.js`
- `src/maplibre/activity-session.js`
- `src/map-engines/activity-normalizer.js`
- `src/chip-speech.js`
- `src/journey-presets.js`
- `src/progress-store.js`
- `assets/maps/data/*.json`
- `assets/maps/data/*.geojson`

Naming risk:

- Many current source files still include `poc` in their names even though they are production. This is one of the largest onboarding/confusion risks for other agents.

## 3. REPOSITORY STRUCTURE

Top-level HTML:

- `index.html`
  - Redirect/splash entry to `maplibre-poc.html`.
  - Actively used as root URL.
- `maplibre-poc.html`
  - Current real Atlas Quest app.
  - Actively used.
  - Contains production DOM scaffolding.
- `legacy-svg-app.html`
  - Legacy SVG app.
  - Deprecated for new work.
- `ocean-texture-preview.html`
  - Experimental/dev preview for ocean texture.

Top-level CSS:

- `maplibre-poc.css`
  - Current production styles for title screen, app shell, MapLibre gameplay, answer bank, journey overlays, study mode, settings, Free Play card.
  - Actively used.
- `styles.css`
  - Legacy SVG app styles.
  - Deprecated for current production.

Main JS:

- `src/maplibre-poc.js`
  - Current production orchestrator.
  - Loads all activity data and GeoJSON.
  - Owns app shell state, navigation, settings, journey state, study state, Free Play state, answer bank rendering, difficulty selection, progress persistence integration, completion/auto-advance handling, incorrect-placement handling.
  - High-risk monolith.
- `src/maplibre/maplibre-activity-runner.js`
  - MapLibre renderer/adapter.
  - Owns map creation, sources/layers, overview/study view, target hit testing, navigation feature querying, camera/fly transitions, difficulty visual expressions, presentation settings.
  - Actively used.
- `src/maplibre/activity-session.js`
  - Activity state machine for selected answer, completed targets, answer-bank refill, cumulative vs section-only target lists.
  - Actively used.
- `src/map-engines/activity-normalizer.js`
  - Normalizes raw activity JSON into engine-agnostic shape/point target format.
  - Actively used by MapLibre path.
- `src/chip-speech.js`
  - Browser Web Speech wrapper and speaker-button factory.
  - Actively used for answer chips, Study Mode target list, and Free Play selected-country card.
- `src/journey-presets.js`
  - Single source of truth for built-in journey presets and ordered steps.
  - Actively used by Choose Journey, Journey Detail, Study, Journey gameplay, progress summaries.
- `src/progress-store.js`
  - Centralized localStorage service for Journey progress.
  - Actively used.
- `src/app.js`
  - Legacy SVG app logic.
  - Deprecated for current production.
- `src/maplibre/ocean-textures.js`
  - Generates/exports water/ocean texture images used by MapLibre runner.
  - Actively used.
- `src/maplibre/ocean-texture-preview.js`
  - Dev preview helper.

Activity data:

- `assets/maps/data/*.json`
  - Activity definitions. Current runtime explicitly lists every loaded activity in `activityDataPaths` inside `src/maplibre-poc.js`.
  - Each file generally has `id`, `title`, `targets` or legacy `features`, `map`, target metadata, and sometimes `cumulativeGroup`/`sequence`.
- `assets/maps/data/*.geojson`
  - GeoJSON base/admin boundary sources loaded by MapLibre runner.
  - Current important sources:
    - `maplibre-world-countries.geojson`
    - `maplibre-us-states-atlas.geojson`
    - `maplibre-north-america-admin1.geojson`
    - `maplibre-australia-admin1.geojson`
    - `maplibre-china-admin1.geojson`
    - `maplibre-russia-admin1.geojson`
    - `maplibre-india-admin1.geojson`
    - `maplibre-brazil-admin1.geojson`
    - `maplibre-japan-admin1.geojson`
    - `maplibre-germany-admin1.geojson`
    - `maplibre-france-admin1.geojson`
    - `maplibre-spain-admin1.geojson`
    - `maplibre-italy-admin1.geojson`
    - `maplibre-united-kingdom-admin1.geojson`
- `assets/maps/data/maplibre-*-admin1.README.md`
  - Data source notes for imported Admin-1 political division data.
- `assets/maps/world/`
  - `world-map.json` and map-unit supplement files.
  - README states Natural Earth Admin-0 source/public domain.
  - Supplements currently fill territory paths absent from simplified admin-0, e.g. French Guiana and Guam.
- `assets/maps/usa/`
  - U.S. map source/readme and generated U.S. assets.
  - README references `us-atlas` / Census public-domain data.

Proof-sheet files:

- `docs/proof-sheets/Geography-Summary-Proof-Sheets-Cycle-1.txt`
- `docs/proof-sheets/Geography-Summary-Proof-Sheets-Cycle-2.txt`
- `docs/proof-sheets/Geography-Summary-Proof-Sheets-Cycle-3.txt`
- `docs/proof-coverage-report.md`
- `docs/proof-coverage-report.json`
  - Used to reason about Classical Memory Geography preset and proof-sheet coverage.
  - Public UI must not use outside curriculum brand names or "CC".

Docs:

- `docs/maplibre-migration-plan.md`
  - Historical architecture plan. It still describes the intended separation between activity data, session, map engine adapter, UI shell.
- `docs/missing-country-coverage-audit.md`
- `docs/missing-country-coverage-audit.json`
  - Informational audit comparing visible admin-0 features against playable country targets.
- `docs/political-divisions-roadmap.md`
  - Planning/tracking doc for first-level political-division activities.
- `docs/political-geography-planning-note.md`
  - Older planning note.
- `docs/CODEX_PROJECT_HISTORY.md`
  - This handoff file.

Scripts:

- `scripts/generate-missing-country-coverage-audit.js`
  - Generates missing-country coverage docs.
- `scripts/generate-proof-coverage-report.js`
  - Generates proof-sheet coverage report.
- `scripts/generate-world-map.js`, `scripts/generate-usa-map.js`, `scripts/generate-usa-base-map.js`, `scripts/generate-europe-base-map.js`
  - Historical/generated map asset scripts.
- `scripts/generate-north-america-admin1.js`
  - Admin-1 generation/import helper. Additional Admin-1 datasets appear to have been imported/generated with similar pattern but may not have dedicated scripts.

Temporary/experimental:

- `ocean-texture-preview.html`
- `src/maplibre/ocean-texture-preview.js`
- Any `*-preview` files should be considered dev-only.

## 4. APPLICATION ARCHITECTURE

Overall production render flow:

1. `index.html` redirects to `maplibre-poc.html`.
2. `maplibre-poc.html` loads static DOM, MapLibre, `maplibre-poc.css`, and `src/maplibre-poc.js`.
3. `init()` in `src/maplibre-poc.js`:
   - sets `document.title` and launch title to `APP_NAME`.
   - fetches all activity JSON paths in `activityDataPaths`.
   - fetches world/country/Admin-1 GeoJSON files.
   - merges Natural Earth world countries with map-unit supplements via `mergeFeatureCollections`.
   - normalizes activities through `normalizeMapLibrePocActivity()` -> `normalizeActivity()`.
   - creates `ActivitySession`.
   - creates `MapLibreActivityRunner`.
   - wires runner callbacks: `runner.onRegionSelect(...)`, `runner.onTargetClick(handleTargetClick)`.
   - calls `runner.load(...)`.
   - renders answer bank/progress/nav.
   - binds launch/app/UI/zoom events.
   - opens initial URL activity if provided, otherwise calls `openHome()`.

High-level UX flow:

- Launch screen -> `showAppScreen("main-menu")`.
- Main Menu -> Choose Journey / Free Play / Settings / Continue Journey.
- Choose Journey -> `selectJourney(journeyId)` -> `showAppScreen("journey-detail")`.
- Journey Detail -> Study or Play Journey.
- Play Journey -> `showAppScreen("choose-difficulty")`.
- Choose Difficulty -> `startSelectedJourney()`.
- Journey gameplay -> `openJourneyStep(0)` -> `openActivity(step.activityId, { appScreen: "journey-gameplay", difficultyId, presentationSettings })`.
- Activity completion -> `handleJourneyActivityCompletion()` -> save progress -> show celebration -> auto-advance -> `advanceToJourneyStep(nextStepIndex)` -> `openJourneyStep(nextStepIndex)`.

State management:

`src/maplibre-poc.js` is mostly module-global state. Important variables:

- `activities`: normalized activity catalog.
- `session`: `ActivitySession` instance for current activity.
- `runner`: `MapLibreActivityRunner`.
- `selectedActivityId`.
- `activeMapSet`.
- `activeMenuRoot`.
- `activeHierarchyNodeId`.
- `isNavigationBrowseMode`.
- `isBrowseDrawerOpen`.
- `activePreviewActivityId`.
- `selectedOverviewActivityId`.
- `freePlaySelectedMapFeature`: selected Free Play country candidate/card state.
- `currentDifficulty`.
- `currentAppScreen`.
- `appScreenHistory`.
- `selectedJourneyId`.
- `selectedJourneyPlayState`.
- `pendingFreePlayActivityId`.
- `pendingFreePlayHierarchyNodeId`.
- `selectedFreePlayDifficultyId`.
- `activeJourneySession`.
- `activeStudySession`.
- `activeStudyPracticeSession`.
- `journeyCompletionState`.
- `journeyAutoAdvanceTimer`.
- `isJourneyTransitioning`.
- `studyPracticeCompletionState`.
- `activityAttemptState`.
- `mapLayerSettings`.
- `studyTargetSettings`.
- `currentPresentationSettings`.

Activity loading:

- `activityDataPaths` is the hardcoded production load list. Adding an activity JSON file alone is insufficient; it must be added here and usually also to nav/journey/settings structures.
- `normalizeMapLibrePocActivity(rawActivity)` infers `region`, map defaults, metadata, sources, target layers, and normalized target schema.
- `normalizeActivity(rawActivity, overrides)` in `src/map-engines/activity-normalizer.js` maps legacy `features` to current `targets`, infers target kind, layer id, label anchors, hit radius.
- `openActivity(activityId, options)` is the central activity starter.
  - It saves current progress.
  - clears journey auto-advance timer.
  - resets attempt state.
  - hides overlays.
  - sets `currentAppScreen`.
  - resolves hierarchy/menu root.
  - computes `currentPresentationSettings = getEffectivePresentationSettings(...)`.
  - applies `getPresentedActivity(...)` to optionally hide point/city/capital targets.
  - ensures difficulty is valid.
  - updates `session`, `runner`, answer bank, progress, nav, and calls `enterStudy()`.

Session flow:

- `ActivitySession` owns:
  - `currentActivity`
  - `studyMode`: `studyModes.cumulative` or `studyModes.sectionOnly`
  - `completed`
  - `selectedAnswerId`
  - `visibleAnswerIds`
  - `rebuildAvailableTargets()`
  - `tryAnswer(targetId)`
  - `refillVisibleAnswers()`
- In cumulative mode, targets are all previous sections in same `cumulativeGroup` through current `sequence`.
- In section-only mode, targets are only current activity.

Rendering pipeline:

- App shell UI is rendered by `renderAppShellScreen(screenId)` and related journey/settings render functions.
- Gameplay answer bank is rendered by `renderAnswerBank()`.
- Navigation answer bank is rendered by `renderNavigationAnswerBank(nodeId)`.
- Study target list is rendered by `renderStudyExplorePanel()`.
- Settings screen is rendered by `renderSettingsScreen()`, `renderStudyPresetControl()`, `renderStudyTargetGroup(group)`.
- Map visual state is updated through `runner.updateActivity(session.activity)`, `runner.setCompletedTargets(session.completedIds)`, `runner.setDifficulty(...)`, `runner.setPresentationSettings(...)`.

Map rendering:

- `MapLibreActivityRunner` creates one MapLibre map with globe projection.
- Map sources include Natural Earth world countries, U.S. states, North America Admin-1, and multiple country Admin-1 sources.
- Layer groups:
  - base water/background/ocean texture
  - world land/country context
  - overview region fill/line/point preview
  - U.S. state context
  - hard context fill
  - target shapes
  - target shape lines
  - capital/point marker layers
  - hit layers
  - labels/completed visual layers
- `enterOverview()` toggles overview layers and flies to current overview map view.
- `enterStudyView()` toggles study layers and fits the activity study bounds.
- `flyToCameraTarget(target)` is used for Journey transitions.

Feature selection and target matching:

- `handleTargetClick(targetIdsOrPoint)` receives map click events.
- If `currentAppScreen === "study-explore"`, click reveals a target instead of placing.
- If no chip is selected:
  - clicks are navigation/explore gestures.
  - `runner.getNavigationCandidatesAtMapPoint(point)` queries target ids, overview features, world countries, fallback world-country point-in-polygon, and U.S. state context.
  - `tryShowFreePlaySelectedMapFeature(candidates)` handles Free Play root-country selection.
  - otherwise `tryDrillFromMapTargets(candidates)` drills through hierarchy.
- If a chip is selected:
  - click is a placement attempt only.
  - `placeGrabbedAnswer(resolvedTargetIds)` uses `session.tryAnswer(...)`.

Completion handling:

- Correct placement path:
  - `placeGrabbedAnswer(...)`
  - `session.tryAnswer(...)` returns `correct`.
  - `runner.setCompletedTargets(session.completedIds)`
  - `saveCurrentActivityProgress()`
  - `renderAnswerBank()`
  - `updateProgress()`
  - `updateCompletedActivityState()`
  - `handleJourneyActivityCompletion()`
  - `handleStudyPracticeCompletion()`
- Journey completion detection explicitly requires:
  - `targetCount > 0`
  - `completedCount === targetCount`
  - implemented in `handleJourneyActivityCompletion()` using `getSessionCompletionSummary()`.
- Study Practice completion uses the same full-completion condition but shows a non-journey completion card.

Styling after placement:

- Completed ids are passed to runner through `runner.setCompletedTargets(...)`.
- Runner recomputes style expressions in `refreshDifficultyVisuals()`.
- Easy/Medium/Hard visual differences live in `MapLibreActivityRunner`; session correctness is independent of difficulty.

Camera/view handling:

- Activity JSON/map defaults include `initialView`, `regionView`, `studyView`.
- `getJourneyStepCameraTarget(step)` reuses activity `map.regionView`.
- `transitionToJourneyStep(step)` calls `runner.flyToCameraTarget(...)` if target exists and reduced motion is not requested.
- `enterStudyView()` currently does a fly-to-region then delayed `fitBounds`; this historical two-stage behavior has been smoothed for journey transition but may still affect direct activity entry.

Answer bank generation:

- `ActivitySession.visibleAnswerIds` limits visible chips; `visibleAnswerLimit` defaults to activity setting or 10.
- `renderAnswerBank()` creates `.label-chip` buttons and attaches speaker controls.
- `handleChipPointerDown`, `handleDocumentPointerMove`, and `handleDocumentPointerUp` implement drag/touch chip movement.
- Clicking a chip toggles selection without requiring drag.

## 5. NAVIGATION ARCHITECTURE

Launch screen:

- DOM in `maplibre-poc.html`, controlled by `bindLaunchScreenEvents()`.
- Current desired launch screen is intentionally minimal:
  - compass rose SVG
  - `Atlas Quest`
  - subtitle
  - Start button
  - optional top-right settings gear.
- Start calls `showAppScreen("main-menu")`.
- Account UI was added and later removed; do not reintroduce Sign In/Create Account/Continue as Guest unless accounts become real.

App shell:

- `#app-shell-screen` hosts Main Menu, Choose Journey, Journey Detail, Study selection, Difficulty selection, Settings.
- `showAppScreen(screenId, options)` controls app shell visibility, history, launch/app-shell classes.
- `renderAppShellScreen(screenId)` shows/hides main menu actions and delegates to `renderJourneyPresetList`/`renderJourneyShellContent`.
- Important app shell states:
  - `"launch"`
  - `"main-menu"`
  - `"choose-journey"`
  - `"journey-detail"`
  - `"study"`
  - `"choose-difficulty"`
  - `"free-play-difficulty"`
  - `"settings"`
  - legacy placeholder states still exist.

Map set tabs:

- `ACTIVITY_MENU` and `GEOGRAPHY_NAV_NODES` in `src/maplibre-poc.js` define hierarchy/menu roots.
- `renderMapSetTabs()` renders root tabs in browse drawer.
- Current map set label was renamed from "World / Europe" to "World", but internal `defaultMapSet = "world-europe"` remains.

Region navigation:

- `renderActivityGroups()` builds the browse drawer from current `ACTIVITY_MENU` root.
- `renderMenuChildren()` and `createMenuCard()` build hierarchical cards.
- `drillToHierarchyNode(nodeId)` updates active hierarchy, preview, and browse panel.
- `resolveMapClickNavigationTarget(...)` maps clicked features to hierarchy nodes through:
  - direct node id
  - child target aliases
  - navigation aliases
  - activity target matching
  - continent fallback.

Activity navigation:

- Free Play menu cards usually call `selectActivity(activityId, { requireDifficulty: true })` through click handlers.
- Pre-game difficulty is required before starting normal Free Play activities.
- `openPreviousActivity()` and `openNextIncompleteActivity()` use `getCurrentActivitySequence()` over menu activity ids.

Back/home navigation:

- Launch/app shell back: `goBackAppScreen()`.
- Gameplay top bar:
  - `homeButton` returns to app shell or Study screen depending on mode.
  - `backButton` exits Study Explore, Study Practice, Journey, root Free Play, or drills back.
- Fragile: app shell history and gameplay hierarchy history are separate concepts. Do not unify casually.

Study/play transition:

- Journey Detail Play -> `"choose-difficulty"` -> `startSelectedJourney()`.
- Journey Detail Study -> `"study"` -> `renderStudySelectionScreen(journey)`.
- Study Preview -> `openStudyExploreActivity(...)`.
- Study Practice -> `startStudyPracticeActivity(...)`, opens normal activity with `appScreen: "study-practice"`, easy difficulty, progress disabled.

UI placement conventions:

- Title launch-only UI belongs in `#launch-screen`.
- Main navigation belongs in `#app-shell-screen` or browse drawer.
- Gameplay map controls are zoom/fit only; no difficulty/study-mode toggles in gameplay.
- Settings belongs in shell/settings screen or top-right gear.
- Answer chips and selected Free Play cards belong in bottom `#answer-panel`.
- Do not put navigation/action buttons inside the map area.

Known fragile areas and regressions:

- Launch screen repeatedly regressed by adding extra buttons or account UI. Current requirement: Start only plus optional gear.
- Choose Journey previously showed Main Menu buttons and global Study. Correct model: Study belongs to selected journey only.
- In-game cumulative/section-only controls were visible historically. Correct model: not in gameplay; Journey defaults section-only.
- Difficulty picker was historically in-game. Correct model: pre-game difficulty only.
- Free Play initial state historically selected Continents/Oceans and showed a blue mask. Correct model: neutral explore state with no initial activity mask.
- Russia click bug: Free Play fallback initially tested current activity targets, which did not exist in neutral world browsing. Fixed by querying rendered world country features and fallback point-in-polygon against Natural Earth `worldCountries`.
- France highlight bug: UI selection and visual highlight diverged due to unstable/wrong feature id/path. Fix direction: one normalized country id/ISO drives both UI and highlight.

## 6. GAMEPLAY SYSTEM

Difficulty:

- IDs are `easy`, `medium`, `hard` from `difficultyModes` in `src/maplibre/maplibre-activity-runner.js`.
- Difficulty is selected before gameplay:
  - Journey: `renderJourneyDifficultyScreen()` -> `setSelectedJourneyDifficulty()` -> `startSelectedJourney()`.
  - Free Play: `showFreePlayDifficultyScreen()` -> `setSelectedFreePlayDifficulty()` -> `startPendingFreePlayActivity()`.
- `currentDifficulty` is still persisted in `geography-memory-difficulty-mode` for activity sessions, but UI should not expose difficulty in gameplay.
- `getAvailableDifficulties(activity)` special-cases `continents-oceans`: only Easy and Hard.

Easy behavior:

- Easy generally shows the most help.
- Runner visual expressions reveal more target/label/point assistance.
- Best for first exposure.

Medium behavior:

- Medium hides/reduces some hints, especially point hints until placement.
- It is the intended default challenge for many flows.

Hard behavior:

- Hard uses minimal help.
- Intended future trophy-run mode.
- Completion/correctness does not change; only visual aid amount should change.

Chip placement behavior:

- Clicking/tapping a label chip toggles selection via `session.toggleAnswer(id)`.
- Dragging a chip:
  - `handleChipPointerDown()` calls `beginGrabbedAnswer(...)`.
  - Map drag is disabled while dragging a chip.
  - `handleDocumentPointerMove()` shows floating chip.
  - `handleDocumentPointerUp()` queries target ids under pointer and calls `placeGrabbedAnswer(...)`.
- Clicking/tapping the map with selected chip:
  - `handleTargetClick()` resolves target ids and calls `placeGrabbedAnswer(..., { keepGrabbedOnIncorrect: true })`.
- Clicking/tapping map with no chip selected:
  - navigation or Free Play exploration, never a scored placement attempt.

Trackpad behavior:

- MapLibre owns pan/zoom.
- During chip drag, `runner.setMapDragEnabled(false)` disables map dragging to prevent trackpad/touch conflict.
- After cancel/drop, map drag is re-enabled.
- Risk: pointer capture and drag state can still be fragile on mobile Safari/trackpads.

Reset behavior:

- `resetButton` calls `resetActivity()`.
- Resets session completion, selected chip, activity progress for current difficulty, completed state, runner visuals, answer bank/progress.
- Reset is not counted as an incorrect placement.

Cumulative mode:

- Implemented in `ActivitySession.getTargetsForStudyMode()`.
- If `studyMode === cumulative` and current activity has `cumulativeGroup` and numeric `sequence`, target set includes all previous activities in the group through current sequence.
- Underlying behavior preserved, but in-game toggle should not be exposed.

Section-only mode:

- `studyModes.sectionOnly`.
- Used for Journey Mode by `getJourneyActivityPresentationSettings()` returning `{ reviewMode: studyModes.sectionOnly, showCities: false, showCapitals: false }`.
- Study Preview/Practice also uses section-only.

Answer bank replenishment:

- `ActivitySession.refillVisibleAnswers()` keeps `visibleAnswerIds` under `visibleAnswerLimit`.
- Correct answer removes completed item and refills randomly from hidden unfinished ids.
- Hard may visually treat accepted answers differently, but bank logic remains session-level.

Completion logic:

- Full activity complete means `session.completedIds.length === session.activity.targets.length` and target count > 0.
- This condition is used by `handleJourneyActivityCompletion()` and `handleStudyPracticeCompletion()`.
- A previous bug fired Journey completion after first correct chip; fixed by requiring completed count equals target count.

Feedback system:

- `showFeedback(message, isPositive)` writes to `#feedback`.
- Correct placement message: `Correct: ${result.feature.name}`.
- Incorrect placement:
  - first/normal misses: "Not quite - try again." (some text in current file has mojibake due encoding, e.g. `â€”`).
  - after repeated misses: reveal correct location briefly.
  - after activity threshold: review and restart current activity.

Incorrect-placement handling:

- `activityAttemptState` tracks:
  - `incorrectPlacements`
  - `missesByTargetId`
  - `isRevealing`
  - `isReviewingRetry`
  - timers
- Thresholds:
  - `incorrectRevealThreshold` intended 3.
  - `activityRetryThreshold` intended 5.
- `recordIncorrectPlacementAttempt(targetId)` only happens for actual incorrect placements.
- Does not count chip selection, map panning, read-aloud, hints, settings, reset.
- Per-chip reveal uses `revealCorrectPlacementForRetry(targetId)` and temporary completed-target visual.
- Activity retry uses `beginActivityRetryReview()` and `restartActivityAfterRetryReview()`.
- TODO: tune thresholds by difficulty later.

Common regressions:

- Completion firing too early if using result.status correct rather than full session count.
- Difficulty controls reappearing in gameplay.
- Cumulative/section-only toggle reappearing in gameplay.
- Optional city/capital points becoming required targets or hiding required point activities.
- Answer bank disabled state not syncing during overlays/transitions.
- Free Play clicks accidentally treated as placement attempts if a chip remains selected.

## 7. CURRENT ACTIVITY COVERAGE

Confidence levels below are based on code/data presence and known manual-test history, not exhaustive automated QA.

World foundations:

- `continents-oceans` - working, high confidence.
  - 12 targets.
  - Special difficulty availability: Easy/Hard only.
  - Ocean zones are approximated in runner (`getOceanZoneFeature`), not true ocean polygons.
  - Known ocean-boundary quirks possible for Pacific/Southern/Gulf-adjacent areas.

United States:

- `us-states-capitals-01` through `us-states-capitals-10` - working, high MVP importance.
  - State/capital mixed activities.
  - Mostly 10 targets each; `us-states-capitals-03` has 11 targets, above preferred limit.
  - Journey Mode hides optional capital/city point markers by default by filtering mixed activities to shapes; however if activity title says states & capitals, product semantics may need clarification.
  - U.S. journey currently consists of these 10 steps.
- `us-states` - working/legacy review, medium confidence.
  - 52 targets.
  - More of review activity than preferred learning step.
- `us-capitals` - working/legacy review, medium confidence.
  - 51 point targets.
  - Point-only activities should preserve required city/capital visibility.
- `us-features` - placeholder/broken/empty.
  - 0 targets.
  - U.S. physical features are planned but not playable.

Canada:

- `canada-atlantic-provinces` - working, medium-high confidence.
- `canada-central-canada` - working.
- `canada-prairie-provinces` - working.
- `canada-western-northern` - working.
- `canada-provinces-territories` - review activity, working but large (13 targets), medium confidence.

Mexico:

- `mexico-northwest` - working.
- `mexico-northeast` - working.
- `mexico-west-bajio` - working.
- `mexico-central` - working.
- `mexico-south-gulf-yucatan` - working.
- `mexico-states` - review activity, working but large (32 targets), medium confidence.

Countries by region:

- Europe:
  - `western-european-countries` - working.
  - `nordic-countries` - working.
  - `baltic-countries` - working.
  - `eastern-europe-countries` - working after Russia removed from activity to avoid huge bounds.
  - `balkans` / `balkans-countries.json` - working, renamed Western Balkans Countries; target cluster improved.
  - `central-european-countries` - working.
  - `more-central-european-countries` - working.
  - `former-soviet-republics-review` - review, large (15), includes Russia coverage; medium confidence.
- Africa:
  - `north-africa-countries` - working.
  - `west-africa-countries` - working.
  - `more-west-africa-countries` - working.
  - `central-africa-countries` - working.
  - `east-africa-countries` - working, 10 targets.
  - `southern-africa-countries` - working.
  - `more-southern-africa-countries` - working.
- Americas:
  - `central-america` - working.
  - `caribbean` - working but only 5 targets; likely incomplete versus full Caribbean.
  - `south-america-west` - working.
  - `south-america-east` - working.
- Asia/Oceania:
  - `middle-east-countries` - working.
  - `south-asia-countries` - working.
  - `central-asia` - working.
  - `caucasus-countries` - working.
  - `east-asia-countries` - working.
  - `mainland-southeast-asia-countries` - working.
  - `maritime-southeast-asia-countries` - working.
  - `oceania-pacific-countries` - working.

Cities:

- `european-cities` - working/experimental, medium confidence.
- `world-cities-east-south-asia` - working/experimental.
- `world-cities-europe-eastern-mediterranean` - working/experimental.
- `world-cities-middle-east-north-africa` - working/experimental.
- `world-cities-mesoamerica` - working/experimental.
- City/capital point visibility is controlled by map layer/presentation settings; required point-only activity targets are protected.

Political Divisions:

- Australia:
  - `australia-states-territories` - working, medium-high confidence.
- China:
  - `china-north-northeast-political-divisions`
  - `china-east-political-divisions`
  - `china-south-central-political-divisions`
  - `china-southwest-political-divisions`
  - `china-northwest-political-divisions`
  - Working by data presence, medium confidence; sensitive naming/disputed policy around Taiwan intentionally skipped.
- Russia:
  - 12 federal-subject activities:
    - `russia-central-federal-subjects`
    - `russia-more-central-federal-subjects`
    - `russia-northwest-federal-subjects`
    - `russia-more-northwest-federal-subjects`
    - `russia-southern-federal-subjects`
    - `russia-north-caucasus-federal-subjects`
    - `russia-volga-federal-subjects`
    - `russia-more-volga-federal-subjects`
    - `russia-ural-federal-subjects`
    - `russia-siberia-federal-subjects`
    - `russia-far-east-federal-subjects`
    - `russia-more-far-east-federal-subjects`
  - Working by data presence, medium confidence; huge geography and antimeridian/zoom risks.
  - Disputed/occupied regions intentionally excluded.
- India:
  - six activities: north, west/central, east, northeast, south, islands.
  - Working by data presence, medium confidence.
- Brazil:
  - five activities: north, northeast, central-west, southeast, south.
  - Working by data presence, medium confidence.
- Japan:
  - six prefecture activities.
  - Working by data presence, medium confidence.
- Germany:
  - two state activities.
  - Working by data presence, medium confidence.
- France:
  - two mainland-region activities.
  - Working by data presence, medium confidence.
  - Overseas regions intentionally not included because they would distort Europe/France camera if not handled carefully.
- Spain:
  - two autonomous community/city activities.
  - Working by data presence, medium confidence.
- Italy:
  - three region activities.
  - Working by data presence, medium confidence.
- United Kingdom:
  - `united-kingdom-countries-political-divisions`
  - four countries only; no counties/local authorities.
  - Working by data presence, medium confidence.

Physical features:

- `us-features` is empty.
- Proof sheets include mountains, Great Lakes, bays, rivers, trails, canals, deserts, prominent features, Native American regions, etc.
- These are not MVP-current playable in MapLibre.

Experimental layers:

- Ocean texture and ocean region layers exist.
- Map Layers/Study Targets settings are structurally present but not fully applied to gameplay target filtering.

## 8. MAP + DATA SOURCES

Natural Earth:

- `assets/maps/data/maplibre-world-countries.geojson`
  - Generated from Natural Earth `ne_110m_admin_0_countries.geojson`.
  - Public domain.
  - Used for world country fill/click/nav/overview.
- Country feature properties used:
  - `ADMIN`
  - `NAME`
  - `NAME_LONG`
  - `GEOUNIT`
  - `SOVEREIGNT`
  - `ISO_A2`
  - `ISO_A2_EH`
  - `ISO_A3`
  - `ADM0_A3`
  - `SOV_A3`
  - `CONTINENT`

Admin-1 boundaries:

- U.S. states: U.S. Census / us-atlas-derived.
- North America Admin-1 and country-specific Admin-1 GeoJSONs are loaded directly by runner.
- README/source comments exist for several imported country Admin-1 files.
- Activities must use real polygon boundaries. Do not fake shapes.

Map projection assumptions:

- MapLibre production uses globe projection.
- Legacy SVG path used D3/SVG projections; not source of truth for current app.
- Some generated data/readmes mention equirectangular or Albers source assets, but live app uses MapLibre lon/lat and globe.

Normalization:

- Activity targets normalized by `normalizeActivity` / `normalizeTarget`.
- Navigation ids normalized by `normalizeNavigationText` in `src/maplibre-poc.js` and `normalizeNavigationId` in runner.
- World country id from runner:
  - `getWorldCountryIdFromProperties(properties)` uses `ADMIN || NAME_LONG || NAME || SOVEREIGNT || ISO_A3 || ADM0_A3 || SOV_A3`.
- Stable country code:
  - `getStableCountryCode` uses `ISO_A3`, `ADM0_A3`, `SOV_A3`, `isoA3`, excluding `-99`.
- Stable ISO2:
  - `getStableCountryIso2` uses `ISO_A2`, `ISO_A2_EH`, `isoA2`.

Aliases:

- Navigation hierarchy nodes may have `navigationAliases` with `ids`, `isoA3`, `names`.
- Activity target matching uses `target.id`, `sourceFeatureId`, `isoA3`, `iso`, `countryCode`, `adminName`, and normalized target names.

Country matching:

- For Free Play world browsing:
  - `runner.getNavigationCandidatesAtMapPoint(point)` queries rendered `world-land` layer.
  - If rendered query misses in overview mode, it falls back to point-in-polygon over `worldCountries.features`.
  - Candidate includes normalized country id, ISO_A3, ISO_A2, continent, names, source properties.
  - `tryShowFreePlaySelectedMapFeature()` stores candidate in `freePlaySelectedMapFeature`.
  - `getFreePlaySelectedFeatureCollection(candidate)` highlights selected country using ISO_A3 and `runner.getOverviewGeoJsonForCountry(...)`.
- This was chosen because neutral Free Play has no activity targets; fallback cannot depend on `activity.features`.

Ocean handling:

- Continents/oceans activity uses approximated ocean-zone features in `MapLibreActivityRunner`.
- Pacific is split into two polygons across antimeridian.
- Southern Ocean is a broad latitude band.
- Gulf of Mexico is not a separate ocean target.
- Known issue: ocean boundary selection can feel artificial because ocean polygons are not true ocean basins.

Known quirks:

- Russia:
  - Admin-0 world country is huge and crosses wide longitude extents.
  - Including Russia in Eastern Europe made map bounds visually unusable; Russia moved to review/special and later federal-subject journey.
  - Click hit testing needed fallback because rendered features did not always return stable hits for all visible parts.
- France:
  - France vs Norway highlight bug indicated selection label and visual highlight were using divergent ids/feature-state/path.
  - Preferred fix: use a stable normalized country id/ISO for both UI and map highlight, not country-specific hacks.
  - French Guiana is a map-unit supplement but should not distort mainland France/Europe activities.
- French Guiana:
  - Supplement exists because simplified Admin-0 country data may not include it as desired.
  - Treat as special/territory-like in coverage decisions.
- Southern Ocean:
  - Artificial band; can overlap visual expectations.
- Gulf of Mexico:
  - Not its own activity target; may create learner expectation mismatch.
- Small countries:
  - MapLibre rendered-feature hit areas can be hard on globe/zoomed-out views.
  - Point-in-polygon fallback helps only for polygon features; tiny islands may still be hard.
- Antimeridian:
  - Pacific and eastern Russia/Far East can expose split geometry/camera issues.

Why fixes were chosen:

- Use Natural Earth properties instead of handbuilt country lists for Free Play identity.
- Use activity `map.regionView` for journey fly targets instead of hardcoding camera targets in UI handlers.
- Use presentation settings to hide optional point markers rather than deleting targets from raw activity data.
- Preserve required point-only activity targets even when cities/capitals layer settings are off.

## 9. FREE PLAY STATUS

What exists:

- Main Menu -> Free Play opens neutral world browsing.
- No activity selected on initial Free Play root.
- No full Continents/Oceans mask on initial load.
- Instruction: "Tap a place on the globe to explore."
- Click/tap a country in neutral root:
  - selects country
  - highlights selected country via overview feature collection
  - stores `freePlaySelectedMapFeature`
  - renders persistent selected-country/info card in bottom answer/control area.
- Country info card currently includes:
  - flag emoji from ISO_A2 via `iso2ToFlagEmoji(iso2)`
  - country name
  - speaker button if Web Speech supported
  - breadcrumb path from app hierarchy if known, fallback World -> Continent -> Country
  - "Pronunciation and audio tools coming soon."
  - "More country facts coming soon."
  - Clear button.

What works:

- Country click detection, including Russia, via rendered feature query + fallback.
- Breadcrumb/index mapping for many countries.
- Persistent selection card.
- No autoplay audio.
- Free Play activity selection with pre-game difficulty.

What does not / incomplete:

- Country info facts are placeholders.
- No related places, mini challenge, discovery progress, country media, capital/currency/population facts.
- Free Play target filtering/settings are not product-polished.
- Click small islands/countries may be hard at world zoom.
- Free Play is not a polished MVP learning path yet.

Architecture:

- Free Play root uses `currentAppScreen === "free-play"`, `isNavigationBrowseMode`, `activeHierarchyNodeId === "world"`, no preview/selected overview activity.
- Neutral preview is maintained by `updateOverviewPreview()` clearing overview feature collection if `isNeutralFreePlayRootExplore()`.
- Selected country state is `freePlaySelectedMapFeature`.
- Card rendering is `renderFreePlaySelectedTargetCard(candidate)`.

Why it is not MVP priority:

- Journey Mode and Study Mode define the learning MVP.
- Free Play can easily expand scope into encyclopedia/discovery mechanics.
- It is strategically important but should not block core gameplay polish unless it introduces regressions.

Future direction:

- click target -> country info card -> related places -> optional pronunciation/cultural media -> mini challenge -> discovery/progress.
- Add facts:
  - flag
  - capital
  - region/subregion
  - neighboring countries
  - languages
  - population/area, if sourced
  - kid-safe cultural/media snippets
- Add discovery mechanics:
  - visited countries
  - "try a mini challenge"
  - related journey recommendations
  - "learn this region" CTA.

## 10. MOBILE STATUS

Current phone/tablet usability:

- UI uses responsive CSS and large controls, but actual phone QA is incomplete.
- Title screen is simplified and likely acceptable.
- App shell cards are centered and readable but may become tall.
- Map + bottom answer panel can be cramped on phones.
- Study Mode target list was fixed to compact chips, but dense target lists can still overflow/scroll awkwardly.
- Political-division activities with 8-10 targets are acceptable; review activities with 32/51/52 targets are not phone-friendly.

Touch interaction:

- Chip drag uses pointer events and floating chip.
- Map pan disabled while dragging chip.
- Tap-to-select chip and tap target also works.
- Risk: mobile Safari pointer capture, accidental map pan, bottom panel intercept, and chip drop accuracy.

Known blockers/risks before MVP:

- Verify on actual phone/tablet hardware.
- Ensure answer panel does not obscure critical map targets.
- Ensure target hit radii are sufficient for point targets.
- Ensure small countries/islands remain selectable in Free Play only if Free Play is presented.
- Ensure journey auto-advance overlays are readable on small screens and do not trap focus/state.
- Ensure settings accordion/granular target toggles are not overwhelming on mobile.

Responsive behavior:

- CSS attempts to use flexible grids/wraps.
- No full mobile interaction audit is documented.
- Browser smoke tests have mostly been desktop-sized Playwright tests.

## 11. DEBUG / TUNING / DEV TOOLS

Debug modes and internal controls:

- Map navigation debug:
  - `isMapClickResolutionDebugEnabled()` in `src/maplibre-poc.js`.
  - Enabled by URL query `?debugMapNavigation` or localStorage `geography-memory-debug-map-navigation=true`.
  - Logs candidate/evaluation tables for map-click navigation.
  - Dev-only; can remain if not noisy.
- Runner navigation hit test debug:
  - `MapLibreActivityRunner.isNavigationDebugEnabled()` checks `?debugMapNavigation` or same localStorage flag.
  - Logs rendered features, world-land candidates, fallback candidate count.
  - Dev-only; can remain gated.
- `window.maplibrePocMap`
  - Set in runner `load()` for direct MapLibre inspection.
  - Dev convenience; should be hidden/removed for polished production if necessary.
- `poc-nav-dev` in `maplibre-poc.html`
  - Header link to SVG app.
  - User-facing if visible. Should be removed/hidden before MVP.
- `difficulty-control-group` exists in DOM but hidden.
  - Must not be re-exposed during gameplay.
- `studyModeButtons` / `study-mode-control-group` references remain in JS.
  - Current `maplibre-poc.html` snippet does not visibly include old cumulative/section controls, but code still supports them.
  - Risk: stale DOM or future markup could re-enable in-game study mode.
- LocalStorage keys:
  - `atlasQuestProgress` for journey progress.
  - `atlasQuestSettings` for map layer/study target settings.
  - `atlas-quest-layer-settings` legacy layer setting fallback.
  - `geography-memory-completed-activities`.
  - `geography-memory-activity-progress`.
  - `geography-memory-difficulty-mode`.
- Scripts:
  - report/audit generators in `scripts/`.
  - not user-facing.

Temporary tooling that should be removed/hidden for MVP:

- `poc-nav-dev` link to legacy SVG app.
- Any visible developer navigation or POC wording.
- Query/localStorage debug flags can remain if gated.
- Generated audit docs can remain in repository but not linked in UI.

## 12. MAJOR WORK COMPLETED

Chronological summary:

1. MapLibre migration proof of concept became production path.
   - Why: SVG map approach was fragile for real geography, projection, hit testing, pan/zoom, and future global scope.
   - Files: `maplibre-poc.html`, `maplibre-poc.css`, `src/maplibre-poc.js`, `src/maplibre/maplibre-activity-runner.js`, `src/maplibre/activity-session.js`.
   - Lesson: file names still say POC and must be documented/renamed later.

2. Added Atlas Quest launch/title screen.
   - Multiple iterations: globe-heavy mockup, auth-style guest screen, then simplified compass screen.
   - Current result: minimal compass rose, title, subtitle, Start only.
   - Files: `maplibre-poc.html`, `maplibre-poc.css`, `src/maplibre-poc.js`.
   - Regression history: extra account/global menu buttons repeatedly appeared and were removed.

3. Added app shell navigation.
   - Main Menu, Choose Journey, Journey Detail, Study, difficulty, settings shell.
   - Start now goes to Main Menu.
   - Files: `maplibre-poc.html`, `maplibre-poc.css`, `src/maplibre-poc.js`.
   - Fragile area: app shell history vs gameplay hierarchy history.

4. Added journey preset model.
   - `src/journey-presets.js` centralizes built-in journeys and ordered steps.
   - Includes World Foundations, United States, North/South America, The Americas, Europe, country-specific political-division journeys, Russia, Africa, Asia, India, Japan, Oceania, World Tour.
   - World Tour locked by default with unlock requirements.
   - Lesson: only real activity IDs should be used; invalid IDs must not launch gameplay.

5. Added Journey Detail, Study/Play split, pre-game difficulty.
   - Difficulty moved before gameplay.
   - In-game difficulty control hidden.
   - Free Play also gets pre-game difficulty.
   - Files: `src/maplibre-poc.js`, CSS.
   - Regression risk: hidden DOM controls still exist and can be accidentally re-shown.

6. Added basic Journey gameplay.
   - `activeJourneySession` tracks journey id, step index, difficulty, mode, incorrect placements.
   - `openJourneyStep` launches activity with selected difficulty and Journey presentation settings.
   - Completion saves progress and auto-advances.
   - Files: `src/maplibre-poc.js`, `src/progress-store.js`.
   - Bug fixed: completion card used to appear after first correct chip; now requires full completion count.

7. Added Journey fly-to-next-step and auto-advance.
   - Uses `getJourneyStepCameraTarget` from activity `map.regionView`.
   - `transitionToJourneyStep` calls `runner.flyToCameraTarget`.
   - Completion overlay became full-screen celebratory message; no between-step Continue/Exit.
   - Future sound hook: `playJourneyWhooshSound()`.
   - Risk: current HTML still contains journey completion buttons for final/reused modes; CSS/JS hides between-step buttons.

8. Added local Journey progress persistence.
   - `src/progress-store.js`
   - Key: `atlasQuestProgress`.
   - Continue Journey resumes active journey if saved progress exists.
   - Journey cards/details show progress summaries.
   - Lesson: progress is local-only, no backend/accounts/trophies.

9. Added incorrect-placement handling.
   - Per-chip reveal after repeated misses.
   - Activity-level retry after threshold.
   - Journey perfect/great-job determined by incorrect placements.
   - Files: `src/maplibre-poc.js`, CSS overlay.
   - Risk: text encoding mojibake present in some strings.

10. Added Study Mode v1.
   - Study screen lists journey steps.
   - Preview opens non-scored reveal map.
   - Practice launches normal Easy activity without Journey progress/auto-advance.
   - Target list and reveal/hide controls.
   - Files: `src/maplibre-poc.js`, CSS.
   - TODO: granular Study Target filtering not safely wired into gameplay.

11. Added Map Layers / Study Targets settings.
   - Key: `atlasQuestSettings`.
   - Layer settings: `showContinents`, `showOceans`, `showCountries`, `showStates`, `showProvinces`, `showTerritories`, `showCities`, `showCapitals`.
   - Target settings are individual target ids under groups.
   - Presets: Default, Classical Memory Geography.
   - Classical Memory uses proof-sheet allowlist, not all available/demo targets.
   - Files: `src/maplibre-poc.js`, docs/proof sheets.
   - Risk: settings UI saves granular target settings but gameplay filtering is mostly TODO.

12. Revised country/activity grouping.
   - Balkans tightened into Western Balkans.
   - Eastern Europe excludes Russia to avoid giant bounds.
   - Russia moved into review/special and later federal-subject journey.
   - Mexico/Canada all-up activities renamed as review activities.
   - Southern Africa preserved then later split with More Southern Africa per Africa journey work.

13. Added missing-country coverage audit.
   - Files: `scripts/generate-missing-country-coverage-audit.js`, `docs/missing-country-coverage-audit.md`, `.json`.
   - Informational only; no app behavior.

14. Added extensive political division activities.
   - Added/standardized Political Divisions category.
   - Added Australia, China, Russia, India, Brazil, Japan, Germany, France, Spain, Italy, United Kingdom.
   - Added Admin-1 GeoJSON sources.
   - Files: many `assets/maps/data/*political-divisions.json`, `maplibre-*-admin1.geojson`, `src/maplibre-poc.js`, `src/journey-presets.js`, docs roadmap.
   - Risk: large scope expansion, medium manual-test confidence only.

15. Fixed Free Play world browsing.
   - Neutral initial state.
   - Russia click fallback.
   - Persistent country selection/breadcrumb.
   - France/Norway highlight path alignment.
   - Added speaker button and first info card with flag/future facts placeholders.
   - Files: `src/maplibre-poc.js`, runner, CSS.
   - Lesson: Free Play has separate requirements from activity sessions.

## 13. KNOWN TECHNICAL DEBT

Severity 1: MVP blockers / high regression risk

- `src/maplibre-poc.js` is a large monolith.
  - App shell, settings, journeys, study, free play, gameplay, data loading, and persistence are all intertwined.
  - High risk for unrelated regressions.
- File names still say POC despite production use.
  - `maplibre-poc.html`, `maplibre-poc.css`, `src/maplibre-poc.js`.
  - Causes future agents to misidentify deprecated vs production paths.
- In-game hidden controls still exist in DOM/JS.
  - Difficulty group exists but hidden.
  - Study mode button code remains.
  - Must not reappear in gameplay.
- Mobile/touch QA is insufficient.
  - Chip drag/drop, map pan, bottom panel layout, and small target hit areas are not fully validated.
- Settings target filtering is not actually applied broadly to gameplay.
  - UI implies granular controls, but Study/Journey/Free Play target filtering remains mostly TODO.

Severity 2: Significant debt

- Duplicated/overlapping persistence:
  - Journey progress: `atlasQuestProgress`.
  - Activity progress: `geography-memory-activity-progress`.
  - Completed activities: `geography-memory-completed-activities`.
  - Difficulty: `geography-memory-difficulty-mode`.
  - Settings: `atlasQuestSettings` + legacy layer key.
  - No migration strategy beyond defensive normalization.
- Activity data source of truth is scattered:
  - JSON file must be added to `activityDataPaths`.
  - Menu/hierarchy nodes must be updated.
  - Journey presets must be updated.
  - Settings target groups may need updates.
  - No single registry generator.
- Camera metadata is inconsistent.
  - Most behavior relies on `map.regionView`/`studyView`, but values may be approximate.
  - Some global/large activities can zoom poorly.
- Point/city/capital layer semantics are overloaded.
  - `showCities` and `showCapitals` share rendering path.
  - Mixed state/capital activities are filtered by presentation settings, which can conflict with activity titles.
- Text encoding issues.
  - Some strings show mojibake like `Letâ€™s` and `Not quite â€”`.
  - Needs cleanup before MVP polish.

Severity 3: Lower priority / cleanup

- Legacy SVG app remains in repo and visible via dev link.
- Ocean zones are approximate.
- Debug globals and localStorage debug flags are not centrally documented in UI.
- `docs/missing-country-coverage-audit.*` and coverage reports can become stale unless regenerated.
- Review activities exceed preferred 10-target limit but are intentionally review, not learning steps.
- World Tour unlock is simple and may not match final product rules.

Hardcoded assumptions:

- `activityDataPaths` manually enumerates activities.
- Country/admin sources manually enumerated in `init()` and runner `load()`.
- `getAvailableDifficulties()` hardcodes Continents/Oceans special case.
- `isClassicalMemoryPresetTarget()` hardcodes U.S. states/capitals as enabled.
- Journey Mode presentation hides city/capital points by default.

Areas likely to regress:

- Free Play country selection/highlight/card.
- Journey completion/auto-advance and progress saving.
- Study Practice completion accidentally invoking Journey completion.
- Required point targets hidden by layer settings.
- Back/Home behavior across app shell/gameplay/study/free-play modes.

## 14. MVP READINESS ASSESSMENT

MVP quality:

- Core MapLibre activity engine is usable.
- U.S. journey path is structurally complete.
- Journey pre-game difficulty, progress saving, completion, and auto-advance are in place.
- Study Mode v1 is useful enough for preparation.
- Launch/Main Menu/Choose Journey/Journey Detail flow is coherent after recent cleanup.
- Many activities have reasonable target counts and real boundaries.

Close but needs validation:

- Political division activities added recently; need targeted manual QA.
- Settings UI likely works but may be too complex and not fully connected to gameplay.
- Free Play country browsing is promising but only first-version info cards.
- Journey camera targets/fly behavior likely acceptable but needs UX testing on representative journeys.

Unstable:

- Mobile/touch gameplay.
- Large activities/review activities on small screens.
- Any route involving app shell back/history from nested states.
- Mixed state/capital behavior under city/capital layer settings.
- Imported Admin-1 datasets with aliases/diacritics.

Must fix before MVP:

- Remove/hide developer SVG link and POC/developer-facing UI.
- Clean visible text encoding issues.
- Manual QA core U.S. Journey on desktop and tablet.
- Manual QA Study Preview/Practice does not mutate Journey progress.
- Manual QA Free Play does not mask initial globe and does not break activity browsing.
- Ensure difficulty/study-mode controls do not appear in gameplay.
- Validate mobile answer panel/chip interaction.

Biggest risks:

- Monolithic codebase increases regression probability.
- Product scope expanded through many new activities before core MVP is fully stabilized.
- Settings imply functionality that may not be wired to gameplay.
- Mobile usability may lag desktop polish.
- New Admin-1 activities may have subtle boundary/id/camera mismatches.

## 15. RECOMMENDED NEXT 10 TASKS

Strict MVP priority order:

1. Run a full U.S. Journey QA pass on desktop.
   - Start -> Main Menu -> Choose Journey -> United States -> Play -> difficulty -> first three activities -> completion/auto-advance.
   - Verify no in-game difficulty/study toggles, capitals/cities hidden according to current intended mode, progress saves once.

2. Run a mobile/tablet touch QA pass.
   - Chip tap-select, drag-drop, map pan, reset, read-aloud, completion overlay, Study target list.
   - Fix layout/input blockers before adding features.

3. Remove or hide developer-facing UI from production.
   - `poc-nav-dev` SVG link.
   - Any visible POC/debug labels.
   - Ensure launch screen remains Start-only.

4. Clean text encoding/mojibake.
   - Search for `â`, `Letâ`, malformed apostrophes/dashes.
   - Fix user-facing strings only.

5. Stabilize navigation/back behavior.
   - Test Launch/Main Menu/Choose/Journey Detail/Study/Practice/Free Play/Settings Back/Home paths.
   - Document intended state transition table.

6. Audit required-target protection under layer settings.
   - Point-only city/capital activities must remain playable with cities/capitals toggled off.
   - Mixed state/capital activities must match product expectation.

7. Decide MVP stance on Study Target settings.
   - Either visibly label gameplay filtering "coming later" or wire safe filtering for Study only.
   - Do not imply broad target filtering if it is not active.

8. Smoke-test the newest political-division datasets selectively.
   - Australia, China one region, Russia one western/one far-east region, India islands, France/Spain/Italy/UK.
   - Verify camera, chips, target count, completion.

9. Improve automated validation scripts.
   - Validate every `activityDataPaths` id exists, every journey step id exists, every menu activity id exists, every target sourceFeatureId matches some loaded source where practical.
   - Use bundled Node if normal `node` is blocked.

10. Rename POC files or create clear aliases after MVP stabilization.
   - Best long-term: `atlas-quest.html`, `atlas-quest.css`, `src/atlas-quest.js`.
   - Risky before MVP because paths/cache query strings/tests may break. If not renamed, document loudly.

Avoid before MVP unless blocker:

- More country/political division expansion.
- Historical geography.
- Backend/accounts/cloud sync.
- Trophies/custom journeys.
- Rich Free Play facts/media.

## 16. AI HANDOFF SUMMARY

Production app path:

- Root `index.html` redirects to `maplibre-poc.html`.
- Current real app is `maplibre-poc.html` + `maplibre-poc.css` + `src/maplibre-poc.js`.
- Legacy app is `legacy-svg-app.html` + `styles.css` + `src/app.js`; do not modify for current Atlas Quest unless explicitly asked.

Critical files:

- `src/maplibre-poc.js`: monolithic app orchestrator. App shell, navigation, journeys, study, settings, Free Play, gameplay integration, persistence hooks.
- `src/maplibre/maplibre-activity-runner.js`: MapLibre map/layer/hit-test/camera/difficulty renderer.
- `src/maplibre/activity-session.js`: answer selection/completion/session/cumulative logic.
- `src/map-engines/activity-normalizer.js`: raw activity normalization.
- `src/journey-presets.js`: built-in journey sequence source of truth.
- `src/progress-store.js`: `atlasQuestProgress` localStorage service.
- `src/chip-speech.js`: Web Speech speaker controls.
- `assets/maps/data/*.json`: activity definitions.
- `assets/maps/data/*.geojson`: Natural Earth/Admin-1 boundary sources.
- `docs/proof-sheets/*.txt`: proof-sheet source of truth for Classical Memory preset.

Core architecture:

- `init()` fetches activity JSON and GeoJSON, normalizes activities, creates `ActivitySession`, creates `MapLibreActivityRunner`, wires map click callbacks, renders shell.
- `showAppScreen()` controls launch/app shell screens.
- `openFreePlay()` enters neutral world browsing.
- `openActivity()` starts gameplay/study-practice/journey-step activities.
- `handleTargetClick()` dispatches map clicks:
  - Study Explore reveal
  - no-chip navigation/Free Play country selection
  - selected-chip placement
- `placeGrabbedAnswer()` calls `session.tryAnswer()`.
- `handleJourneyActivityCompletion()` only fires when completed count equals target count.
- `showJourneyCompletionCard()` shows final or between-step celebration; between-step auto-advances through `scheduleJourneyAutoAdvance()` and `advanceToJourneyStep()`.

Current fragile systems:

- App shell/gameplay mode state is global and cross-coupled.
- Activity/journey/menu/settings registries are manually synchronized.
- Settings target filtering is mostly UI/persistence, not fully gameplay behavior.
- Hidden legacy controls can reappear.
- Free Play world browsing uses a separate selected country path.
- Mobile chip/drop interaction needs real QA.
- Recent political-division datasets are broad and only medium-confidence.

Main known bugs/risks:

- POC naming confusion.
- Text encoding artifacts in feedback/overlay strings.
- Developer SVG link visible in production header.
- Potential mobile layout/input problems.
- Potential Admin-1 source/target alias mismatches.
- Potential required city/capital point targets hidden if layer logic changes.
- Potential back/history confusion across Study/Journey/Free Play.

MVP blockers:

- Mobile/touch QA and fixes.
- Remove developer-facing UI.
- Clean user-facing text artifacts.
- Stabilize core U.S. Journey + Study + Free Play navigation.
- Validate no in-game difficulty/study controls.
- Confirm progress saving/resume is reliable and not double-marking.

Highest-leverage next actions:

- Do not add new geography content.
- Test and harden the current core loop.
- Fix visible polish defects.
- Add validation scripts to prevent ID/source/menu/journey drift.
- Keep Free Play minimal and non-blocking.
- Preserve Journey Mode and Study Mode behavior when touching shared functions.
