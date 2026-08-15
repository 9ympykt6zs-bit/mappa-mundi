# Automated testing

The repository has a fast Node-based baseline and a separate Playwright browser layer. The fast baseline is the normal development check; Playwright covers selected browser flows and should be run in a supported local or CI environment.

The baseline includes `scripts/check-matched-seed-simulation-matrix.mjs`, which verifies O6.2 seed matching and answer-seed separation, deterministic replay, aggregation math, serialization, immutability, and unchanged planner output. Generate the larger descriptive matrix separately with `npm run report:matched-seed-simulations`; see [`matched-seed-simulations.md`](matched-seed-simulations.md).

The baseline also includes `scripts/check-long-horizon-mastery-report.mjs`. It checks O6.3 milestone and percentage calculations, status-count invariants, ordered diagnostic histories, exact replay, JSON serialization, fixture immutability, and unchanged planner output. Generate the six-seed 200-session analysis with `npm run report:long-horizon-mastery`; see [`long-horizon-mastery.md`](long-horizon-mastery.md).

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

## Browser/E2E tests

Run Playwright separately:

```sh
npm run test:e2e
npm run test:e2e:us
npm run test:e2e:headed
```

Playwright starts a local static server on port 4173. The suite runs the Journey smoke test at a 1440x900 desktop viewport and with an iPhone 13-sized mobile profile.

Playwright requires an environment that permits a localhost server and Chromium process startup. In the restricted inspection sandbox used for the 2026-08-14 baseline audit, the server could run after localhost permission was granted, but Chromium exited before page launch because macOS denied its Mach-port registration. That is a test-environment limitation, not an application test failure. A supported run needs installed dependencies and Chromium (`npm install` and `npx playwright install chromium`) plus an ordinary local shell or CI runner that permits browser processes and localhost port 4173.

## Test mode

The smoke test opens `http://127.0.0.1:4173/?test=1`. On a local hostname, that query parameter installs the narrow `window.__MAPPA_TEST_API__` hook. The hook exposes snapshots of the current activity, Journey, step, valid targets, saved Journey progress, and deterministic helpers for a correct answer or activity completion. It is not installed without `?test=1`, and it is never installed on a non-local (production) hostname.

## Current coverage

The U.S. Journey smoke test passes the launch screen, enters Challenge Yourself, chooses the United States Journey, selects Medium, starts Play, confirms the first activity and targets, completes that activity through the test hook, verifies saved progress, and verifies advancement to a different second activity.

The reload/resume regression completes the first U.S. activity, reloads the page, returns through the launch screen, uses the visible Continue Journey card, and verifies that activity two resumes on Medium without resetting or double-incrementing progress. It then completes activity two and confirms activity three loads with exactly two completed steps saved.

The journey-completion regression seeds the completed prerequisite U.S. activities, resumes the final activity through the visible Continue Journey card, completes that activity through the deterministic test hook, and verifies the final completion screen and saved completion flag. After a reload, it confirms the journey is offered for review from the beginning rather than as an incomplete journey to continue. Viewing the completed journey must not erase or increment its saved progress.

The spatial regression test checks that the U.S. regional question pool is populated, IDs are unique, Gulf Coast coverage has at least three eligible questions, and selection does not immediately repeat the same Gulf Coast question when alternatives exist.

Map feel, narration timing and quality, visual polish, real-device touch/drag behavior, and geographic-label placement remain intentionally manual. Those are perceptual or hardware-sensitive checks and should not be inferred from deterministic state hooks.

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

## Learning Inspector data-layer check

`scripts/check-learning-inspector.mjs` exercises the read-only Inspector adapters documented in [`learning-inspector.md`](learning-inspector.md). Fixtures cover place mastery, Daily Trail, U.S. Memory Trail, Journey progress, Mental Map results, reconstruction results, planner selection explanations, deterministic-context export, and before/after transitions. The check verifies that adapters do not mutate input state, equivalent inputs produce stable JSON, missing evidence remains explicitly unavailable, and deterministic planner replays produce equivalent Inspector output.

## Deterministic learner simulations

Run the O4 synthetic learner evidence generator with:

```sh
npm run report:learner-simulations
```

It drives the existing U.S. Memory Trail planner with six deterministic learner profiles and adds a controlled Daily Trail return probe. The command writes human-readable Markdown and machine-readable JSON under `reports/`. The fast baseline's `check-learner-simulations.mjs` verifies deterministic replay, different-seed variation, all profile scripts, Inspector serialization, and fixture immutability. See [`learner-simulations.md`](learner-simulations.md) for profiles, interpretation, and measurement limits.

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
