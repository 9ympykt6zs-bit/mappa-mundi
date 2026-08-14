# Automated testing

The repository has a fast Node-based baseline and a separate Playwright browser layer. The fast baseline is the normal development check; Playwright covers selected browser flows and should be run in a supported local or CI environment.

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
