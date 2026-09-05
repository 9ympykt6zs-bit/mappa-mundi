# Engineering state

Inspected 2026-09-05 at `5564c13` on `feature/evidence-driven-learning-foundation`; checkout was clean before engineering documentation setup. This is a concise navigation and coordination record, not a release certification. Recheck Git status/revision at task start.

## Ownership and current work

The designated Lead Codex task owns engineering orchestration under [AGENTS.md](../AGENTS.md) and [the workflow](engineering-orchestration.md). No permanent specialists, background automation, or additional worktrees were created. No specialist assignments are active. The next application priority is the user's next development request; this setup does not select a new product feature.

## Architecture entry map

| Area | Start here | Implication for changes |
| --- | --- | --- |
| Browser entry and UI | `index.html`, `maplibre-poc.css`, `src/maplibre-poc.js` | The root page dynamically imports the MapLibre runtime despite its POC name. Shared shell/mode wiring is a cross-cutting review boundary. Do not assume `src/app.js` is the production entry. |
| Activity/session/map plumbing | `src/maplibre/activity-session.js`, `src/maplibre/maplibre-activity-runner.js`, `src/map-engines/activity-normalizer.js` | Check input, completion, mode behavior, and cameras together when changing shared activity logic. |
| Journeys and persistence | `src/journey-presets.js`, `src/progress-store.js` | Preserve saved Journey progress and resume/completion semantics. |
| Guided and adaptive learning | `src/guided-learning-orchestration.js`, `src/united-states-evidence-driven-continuation.js`, `src/united-states-memory-trail-planner.js`, `src/daily-trail-planner.js` | Guided orchestration is learner-facing application logic, separate from this engineering workflow. Recent commits route guided children and refine political/physical cameras and teaching. Keep exposure, retrieval, Daily Trail, and Journey contracts distinct. |
| Evidence and progress | `src/canonical-learning-evidence.js`, `src/canonical-learning-evidence-repository.js`, `src/progress-evidence-policy.js`, `src/canonical-progress-report.js`, `src/place-mastery-store.js`, `src/learning-progress-reset.js` | Canonical evidence coexists with mode-specific state. Do not assume migration to one store is complete; preserve evidence identity, assistance semantics, and reset boundaries. |
| Regional reuse | `src/geography-learning-unit.js`, `src/geography-learning-unit-registry.js`, `src/central-america-learning-unit.js` | Consult the bounded Central America reuse precedent before generalizing the U.S. experience. |
| Atlas and content | `src/atlas/`, `assets/maps/data/`, `src/across-united-states-expedition.js` | Content IDs, geographic sources, activity registries, and learning/reporting identities need coordinated validation. |
| Diagnostics and tests | `src/learning-inspector.js`, `src/learning-inspector-panel.js`, `src/selection-trace.js`, `scripts/check-*.mjs`, `tests/e2e/` | Deterministic evidence and source-wiring checks have narrower proof boundaries than rendered or human learning behavior. |

The repository uses browser JavaScript modules and static assets. `package.json` provides Node checks and Playwright tooling. `_headers` and `_redirects` exist; the current live deployment/revision was not audited. No hosting or backend changes are part of this setup.

## Targeted reading

- Product intent: [VISION](../VISION.md), [learning-system vision](learning-system-vision.md).
- Learning runtime: [guided learning](guided-learning-orchestration-v1.md), [canonical evidence contract](canonical-learning-evidence-contract.md), [evidence repository](canonical-learning-evidence-repository.md), [progress policy](progress-evidence-policy.md).
- Regional expansion: [Central America architecture graduation](central-america-architecture-graduation.md), [U.S. content taxonomy](US_CONTENT_TAXONOMY.md).
- Quality: [testing](testing.md), [geographic visualization principles](geographic-visualization-principles.md), [learning reset](learning-progress-reset.md).
- Historical context: [CURRENT_STATE](../CURRENT_STATE.md) and [project history](CODEX_PROJECT_HISTORY.md). Read relevant sections only; dated plans and pass counts are not current verification.

## Verification and risks

- Setup changes documentation only. On 2026-09-05, `npm test` passed **101/101 checks** at the inspected application revision. Documentation links and architecture paths also passed validation, and `git diff --check` passed.
- Browser tests were not run for this documentation-only setup. Historical pass counts in `testing.md` were not revalidated here.
- Main review boundaries: large shared runtime/mode wiring; multiple learner-state models; geographic/content identity alignment; camera framing and mobile interaction. These are inspection priorities, not newly demonstrated bugs.
- No current real-device, accessibility, audio-quality, deployment, or pedagogical sign-off is claimed.

## Maintenance

Update this short record when architecture, active cross-task work, constraints, or verified baselines change. Put detailed design rationale and evidence in the relevant domain document and link it here. Keep completed handoffs in `docs/handoffs/` only when they carry useful decision or integration context; do not duplicate the conversation transcript.
