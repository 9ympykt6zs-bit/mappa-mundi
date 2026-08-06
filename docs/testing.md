# Automated testing

The first automated browser layer uses Playwright and intentionally focuses on one reliable Journey path.

## Setup

Install JavaScript dependencies and the Chromium browser used by the test projects:

```sh
npm install
npx playwright install chromium
```

## Run tests

```sh
npm run test:e2e
npm run test:e2e:us
npm run test:e2e:headed
```

Playwright starts a local static server on port 4173. The suite runs the Journey smoke test at a 1440x900 desktop viewport and with an iPhone 13-sized mobile profile.

## Test mode

The smoke test opens `http://127.0.0.1:4173/?test=1`. On a local hostname, that query parameter installs the narrow `window.__MAPPA_TEST_API__` hook. The hook exposes snapshots of the current activity, Journey, step, valid targets, saved Journey progress, and deterministic helpers for a correct answer or activity completion. It is not installed without `?test=1`, and it is never installed on a non-local (production) hostname.

## Current coverage

The U.S. Journey smoke test passes the launch screen, enters Challenge Yourself, chooses the United States Journey, selects Medium, starts Play, confirms the first activity and targets, completes that activity through the test hook, verifies saved progress, and verifies advancement to a different second activity.

The spatial regression test checks that the U.S. regional question pool is populated, IDs are unique, Gulf Coast coverage has at least three eligible questions, and selection does not immediately repeat the same Gulf Coast question when alternatives exist.

Map feel, narration timing and quality, visual polish, real-device touch/drag behavior, and geographic-label placement remain intentionally manual. Those are perceptual or hardware-sensitive checks and should not be inferred from deterministic state hooks.
