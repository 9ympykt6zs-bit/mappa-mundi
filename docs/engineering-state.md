# Engineering state

Updated 2026-09-07 for Guided physical-geography pacing on `feature/evidence-driven-learning-foundation`, from base commit `e6add0a`. This is a concise navigation and coordination record, not a release certification. Recheck Git status/revision at task start.

## Ownership and current work

The designated Lead Codex task owns engineering orchestration under [AGENTS.md](../AGENTS.md) and [the workflow](engineering-orchestration.md). No permanent specialists, background automation, or additional worktrees were created. Temporary specialists have returned control to the Lead; none is active. Reconstruction scoring and navigation decisions are recorded in [the scoring assignment](handoffs/guided-reconstruction.md) and [the navigation handoff](handoffs/reconstruction-map-navigation.md). The capital-location source work is recorded in [the city-data handoff](handoffs/capital-location-city-data.md). A bounded Content / Learning Systems specialist independently audited physical pacing; the Lead implemented and reviewed the result. See [the physical pacing audit](handoffs/physical-geography-pacing-audit.md).

## Architecture entry map

| Area | Start here | Implication for changes |
| --- | --- | --- |
| Browser entry and UI | `index.html`, `maplibre-poc.css`, `src/maplibre-poc.js` | The root page dynamically imports the MapLibre runtime despite its POC name. Shared shell/mode wiring is a cross-cutting review boundary. Do not assume `src/app.js` is the production entry. |
| Activity/session/map plumbing | `src/maplibre/activity-session.js`, `src/maplibre/maplibre-activity-runner.js`, `src/map-engines/activity-normalizer.js` | Check input, completion, mode behavior, and cameras together when changing shared activity logic. |
| Journeys and persistence | `src/journey-presets.js`, `src/progress-store.js` | Preserve saved Journey progress and resume/completion semantics. |
| Guided and adaptive learning | `src/guided-learning-orchestration.js`, `src/united-states-physical-feature-orchestration.js`, `src/united-states-evidence-driven-continuation.js`, `src/united-states-memory-trail-planner.js`, `src/daily-trail-planner.js` | Guided physical geography uses thirteen two- or three-target introduction cohorts, immediate cohort retrieval, deterministic category/mixed review pools, and lower-48 scaffolding after Reconstruction checkpoint 1. Keep exposure, retrieval, review timing, Daily Trail, and Journey contracts distinct. |
| Guided Reconstruction | `src/guided-reconstruction.js`, `src/atlas/map-reconstruction-evaluation.js`, `src/atlas/map-reconstruction-ui.js` | The regional SVG camera fits all locked and incoming geography, supports manual pan/zoom, and retains its view through rerenders; its coordinates remain separate from placement/scoring. Shared political styling lives in `src/maplibre/political-map-style.js`. Ten contiguous-state checkpoints match Guided sections. Only new states are scored against locked prior context from checkpoint 2 onward; standalone scoring and canonical meanings are preserved. |
| Capital-location retrieval | `src/atlas/us-capital-location-city-choices.js`, `src/maplibre/capital-location-question.js`, `src/maplibre/maplibre-activity-runner.js` | Name-to-place capital prompts show the capital and two same-state city alternatives as visually equal unlabeled dots. Feedback labels all three target-state cities and restores the capital star. Distractors are input/display context only; evidence, mastery, scheduling, and curriculum continue to use the canonical capital target. See [the data/source contract](us-capital-location-city-choices.md). |
| Evidence and progress | `src/canonical-learning-evidence.js`, `src/canonical-learning-evidence-repository.js`, `src/progress-evidence-policy.js`, `src/canonical-progress-report.js`, `src/place-mastery-store.js`, `src/learning-progress-reset.js` | Canonical evidence coexists with mode-specific state. Do not assume migration to one store is complete; preserve evidence identity, assistance semantics, and reset boundaries. |
| Regional reuse | `src/geography-learning-unit.js`, `src/geography-learning-unit-registry.js`, `src/central-america-learning-unit.js` | Consult the bounded Central America reuse precedent before generalizing the U.S. experience. |
| Atlas and content | `src/atlas/`, `assets/maps/data/`, `src/across-united-states-expedition.js` | Content IDs, geographic sources, activity registries, and learning/reporting identities need coordinated validation. |
| Diagnostics and tests | `src/learning-inspector.js`, `src/learning-inspector-panel.js`, `src/selection-trace.js`, `scripts/check-*.mjs`, `tests/e2e/` | Deterministic evidence and source-wiring checks have narrower proof boundaries than rendered or human learning behavior. |

The repository uses browser JavaScript modules and static assets. `package.json` provides Node checks and Playwright tooling. `_headers` and `_redirects` exist; the current live deployment/revision was not audited. No hosting or backend changes are part of this setup.

## Targeted reading

- Product intent: [VISION](../VISION.md), [learning-system vision](learning-system-vision.md).
- Learning runtime: [Guided Reconstruction checkpoints](guided-reconstruction-checkpoints.md), [guided learning](guided-learning-orchestration-v1.md), [canonical evidence contract](canonical-learning-evidence-contract.md), [evidence repository](canonical-learning-evidence-repository.md), [progress policy](progress-evidence-policy.md).
- Regional expansion: [Central America architecture graduation](central-america-architecture-graduation.md), [U.S. content taxonomy](US_CONTENT_TAXONOMY.md).
- Quality: [testing](testing.md), [geographic visualization principles](geographic-visualization-principles.md), [learning reset](learning-progress-reset.md).
- Historical context: [CURRENT_STATE](../CURRENT_STATE.md) and [project history](CODEX_PROJECT_HISTORY.md). Read relevant sections only; dated plans and pass counts are not current verification.

## Verification and risks

- Guided physical pacing update: the audited inventory contains **34 physical targets: 33 supported and orchestrated, with only St. Lawrence River deferred for incomplete geometry**. Lower-48 physical introductions no longer wait for every related state; Alaska ranges retain their disconnected-region state gate. Family review uses rotating three- or four-target membership, mixed review contains already introduced mountains/rivers/lakes with per-target canonical types, and new eligible cohorts take precedence over old review. Focused and broader validation is recorded in [testing](testing.md).

- Capital-location update: **107/107** fast checks passed. Focused browser acceptance passed **5/5 desktop** Guided/capital-location cases and **3/3 mobile** capital-location cases. Broader U.S. system and Capital Connections coverage passed **18/18** across desktop/mobile. These checks cover Louisiana correct, same-state, and wrong-state answers; transformed-map placement after pan/zoom; cursor neutrality; Guided canonical evidence; Rhode Island presentation; and source validation for all 50 states including Alaska, Texas, Delaware, and capital-is-large-city cases. Census points are representative area points rather than street-level city-center claims. No real-device or full browser-suite claim is made.

- Navigation update: **105/105** fast checks passed, including shared palette, viewport math, Guided anchored scoring, standalone translation tolerance, and Lower 48 capstone checks. Final browser acceptance passed **14/14**; the broader run passed **26/28 initially**, with both intermittent cases passing on rerun. See [testing](testing.md) for commands and limitations.

- On resumption, the five focused Reconstruction/Guided Node checks passed, followed by **103/103** checks in `npm test` after correcting two stale asset-version assertions.
- The complete implementation browser run finished **156/168 passed**. Ten failures reproduced on unchanged base `66509f0`; two mobile camera failures passed both the base comparison and the resumed acceptance run. The resumed affected-flow browser set passed **18/18 desktop/mobile cases**. See [testing](testing.md) for exact cases and proof boundaries. This is not a green full-suite claim.
- Alaska/Hawaii Reconstruction stays deferred: section 11 exists, but no sufficient Reconstruction layout is authored. Standalone global-translation scoring and Journey progress are preserved.
- Main review boundaries: large shared runtime/mode wiring; multiple learner-state models; geographic/content identity alignment; camera framing and mobile interaction. These are inspection priorities, not newly demonstrated bugs.
- No current real-device, accessibility, audio-quality, deployment, or pedagogical sign-off is claimed.

## Maintenance

Update this short record when architecture, active cross-task work, constraints, or verified baselines change. Put detailed design rationale and evidence in the relevant domain document and link it here. Keep completed handoffs in `docs/handoffs/` only when they carry useful decision or integration context; do not duplicate the conversation transcript.
