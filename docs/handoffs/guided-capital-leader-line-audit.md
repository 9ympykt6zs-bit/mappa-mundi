# Guided capital leader-line audit

- Status: Complete
- Date: 2026-09-12
- Lead: `/root`
- Specialist role: UI / UX
- Base commit: `d685d5c`
- Branch: `feature/evidence-driven-learning-foundation`

## Objective

Audit the existing screen-space city label placement and connector system used during Guided capital teaching and post-answer capital-location feedback. Recommend the smallest reusable change that draws a subtle connector from every visible city label to its true-coordinate marker, while preserving collision-aware placement, capital priority, interaction, and pre-answer anonymity.

## Relevant context

Inspect:

- `src/maplibre/capital-location-feedback-labels.js`
- `src/maplibre/maplibre-activity-runner.js`
- `src/maplibre-poc.js`
- `tests/e2e/capital-location-city-choices.spec.js`
- `tests/e2e/guided-capital-markers.spec.js`
- `scripts/check-capital-location-label-placement.mjs`
- `docs/us-capital-location-city-choices.md`
- `docs/handoffs/capital-location-label-placement.md`
- `docs/handoffs/guided-capital-teaching-city-context.md`

The current system reportedly creates connectors only after labels exceed a displacement threshold. The requested behavior is a connector for every visible label during Guided teaching and post-answer feedback, including the capital.

## Boundaries

- Read-only audit. Do not modify application code, tests, or documentation outside this handoff file.
- You may update only the Handoff section below.
- Do not change marker coordinates, hit targets, capital star treatment, feedback timing, pan/zoom, evidence, or mastery behavior.
- Do not add city-specific offsets.
- Do not delegate further.

## Acceptance criteria

Return a concise handoff that identifies:

1. the render and recomputation path for labels and connector lines;
2. the exact condition that suppresses connectors for nearby labels;
3. the minimal implementation change to render a useful connector for every visible label;
4. whether connector geometry or collision scoring must change so lines terminate clearly and avoid unrelated markers/labels where practical;
5. focused unit/script and browser tests that must change or be added;
6. any risks across pan, zoom, resize, mobile, teaching, correct feedback, and incorrect feedback.

## Testing expectations

No test execution is required for this read-only audit. Identify the most relevant existing checks and precise assertions to adjust.

## Handoff

### Result

The existing overlay already owns both requested disclosure points: `CapitalLocationFeedbackLabelOverlay.sync()` accepts only `teaching` and `feedback` questions, creates labels solely from `revealLabel` choices, and clears itself for the anonymous answering phase. `MapLibreActivityRunner` creates it after map load, calls `sync()` whenever the question or study visibility changes, and keeps the older MapLibre symbol-label layer hidden. The overlay projects each unchanged city coordinate on every layout, measures the DOM labels, uses the pure `layoutCapitalLocationFeedbackLabels()` helper, then positions HTML labels and renders its sibling SVG. Map `move` and `resize` events schedule one animation-frame relayout; font readiness schedules a further measurement pass. This already covers manual pan, zoom, resize, responsive layouts, teaching, correct feedback, and incorrect feedback without camera movement or a second coordinate system.

Capital is placed first, then a selected wrong city, then the other disclosed cities. Candidate boxes avoid the capital-star exclusion, prior labels, map controls, and the map edge; scoring also penalizes leader paths through other markers, controls, labels, or another leader. The leader begins just beyond the marker/star radius and ends at the nearest edge of the label box, so its endpoints already satisfy the requested attribution geometry. The existing CSS is suitably light: rounded line caps, a thin muted stroke, and a white underlay; the overlay is `aria-hidden` and has no pointer events.

### Exact suppression condition and minimal change

Connectors are currently suppressed in `createLeader()` in `src/maplibre/capital-location-feedback-labels.js`: `if (gap < threshold) return null`. The default `leaderGap` is 16 pixels, while the first candidate ring is 6 pixels. Therefore nearby labels on the first ring deliberately have no connector. The renderer also filters `placements` to those with a truthy `leader` before creating SVG lines. This is why the current tests explicitly expect no leaders for the wide Texas case.

Make the layout contract unconditional for disclosed labels: construct a leader for every valid candidate box, including the 6-pixel ring and every edge fallback. The smallest clean implementation is to replace the threshold-based `createLeader(label, box, gap, threshold)` behavior with a connector builder that always returns the current marker-edge-to-nearest-label-edge segment; retain `gapPx` as descriptive placement metadata, but do not use `leaderGap` as a rendering gate. The existing candidate scoring and hard capital-star avoidance should run for all paths once every candidate has a leader. No marker, label, hit target, camera, question, or evidence contract needs to change.

The current avoidance is practical but score-based for non-capital markers and controls. With all labels connected, preserve the present large penalties and make route collisions a hard rejection whenever an alternative safe candidate exists: reject any candidate whose connector crosses a revealed unrelated marker, an accepted label, an accepted connector, a control, or the capital-star rectangle. The current fallback can retain score-based selection only when no fully clear box/path exists, which prevents a narrow viewport from dropping a required label. A straight segment remains adequate because the layout tries eight directions across widening rings and then edge lanes; no routing library or city-specific geometry is justified. If a fallback path cannot be clear, it should be the shortest deterministic segment and remain below the labels/markers in the existing SVG stacking order.

### Test changes

- Update `scripts/check-capital-location-label-placement.mjs` so every placement has a finite leader, including Colorado, Connecticut, Rhode Island, Delaware, Texas, compact/mobile viewports, dense four-label wrong-state feedback, and the first-ring case. Replace assertions that require `gapPx >= leaderGap`; instead assert one segment per placement, endpoints are finite, the start clears its own marker/star radius, the end lies on the label-box edge, and the segment avoids every unrelated revealed marker, capital-star exclusion, accepted label, and accepted segment whenever a non-fallback candidate exists. Retain determinism and input-coordinate immutability assertions.
- Update `tests/e2e/capital-location-city-choices.spec.js` helper `expectFeedbackLabelLayout()` to require a line for each revealed label and to validate its DOM/SVG endpoints against the test API placement. Replace the Texas assertion that expects no leaders with three leaders. Keep pre-answer assertions at zero labels and zero leader lines. Cover correct feedback, same-state wrong city, and wrong-state feedback (four labels), then pan/zoom and resize and reassert one line per currently disclosed label plus unchanged city longitude/latitude.
- Extend `tests/e2e/guided-capital-markers.spec.js` to assert the three teaching labels have three connector lines, still only one interactive capital target, and that anonymous name-to-place retrieval restores zero labels and zero connectors. Include restore/reload, desktop/mobile, and Hawaii along with the existing dense/small-state coverage.

### Risks and boundaries

At small viewports or with long labels, universal connectors will add visual density. The existing muted stroke/underlay and no-pointer-events overlay are appropriate; avoiding all intersections before accepting a route keeps the added lines traceable. The overlay must remain hidden until `revealLabel` is true, so neither labels nor identifying lines leak the answer during anonymous retrieval. Do not auto-fit, snap, or otherwise adjust the map camera: screen-space relayout already follows transform changes and keeps marker coordinates exact. The testing API currently exposes layout metadata and the browser specs can query rendered SVG lines; no new production API is needed beyond retaining the placement data already exposed.

No tests were run for this read-only audit. The relevant existing checks are `node scripts/check-capital-location-label-placement.mjs`, `node scripts/check-capital-location-question.mjs`, and the two focused desktop/mobile Playwright specs named above.

### Lead acceptance

The Lead independently reviewed the overlay, implemented universal marker-edge connectors with clear-route candidate preference, retained deterministic fallbacks for constrained layouts, and suppressed the duplicate ordinary completed-capital label during feedback. The Lead separately implemented capital-specific retrieval ordering from actual current-session or persisted canonical naming evidence. Final validation and visual inspection are recorded in `docs/testing.md`.
