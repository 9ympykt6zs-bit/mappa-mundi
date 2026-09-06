# Reconstruction map presentation and navigation

Status: accepted

## Lead brief

Base: `d562c40`, clean `feature/evidence-driven-learning-foundation` checkout.
Objective: reuse main map appearance, fit complete checkpoint geography, and enable pan/zoom without changing placement, scoring, canonical evidence, sequencing, or existing controls.

One sequential UI/map specialist assignment: extract the existing main-map hard context palette and feature-order state color mapping into a shared pure module, and annotate prepared Reconstruction pieces with matching display colors. Delegation is useful because this bounded styling source is independent of the Lead's SVG gesture/camera work.

Specialist model: `gpt-5.6-luna`, medium reasoning, compact context. Allowed files: new `src/maplibre/political-map-style.js`, `src/maplibre/maplibre-activity-runner.js`, `src/atlas/map-reconstruction-geometry.js`, and new `scripts/check-reconstruction-map-style.mjs`. Do not edit UI, CSS, scoring, Guided config, camera geometry values, or other files. No subdelegation or commit.

Acceptance: main runner and Reconstruction share the exact existing palette and feature-order mapping; main renderer behavior is unchanged; geometry positions/scales remain unchanged; colors are stable across checkpoint subsets. Tests should verify real GeoJSON feature-order mapping and shared imports. Return exact commands/results and any integration details.

Lead owns full bounds fitting, camera state, background pan / zoom / pinch, gesture arbitration, UI/CSS, browser regression coverage, review, final tests, documentation, and commit.

## Handoff and acceptance

Specialist returned the shared palette/mapping and geometry display colors. Lead inspected all four files and confirmed unchanged geometry math and exact main-map color mapping. Specialist syntax, real-data palette parity, standalone Reconstruction, and capstone checks passed. Lead integrated camera/UI changes and browser coverage; final validation record is in `../testing.md`.
