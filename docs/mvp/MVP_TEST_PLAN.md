# MVP Test Plan

Use this as a manual smoke matrix before release.

## Devices And Browsers

- [ ] Desktop Chrome.
- [ ] Desktop Edge.
- [ ] iPad/tablet Safari, if available.
- [ ] iPhone Safari.
- [ ] Android Chrome, if available.
- [ ] Phone portrait.
- [ ] Phone landscape.
- [ ] Tablet portrait.
- [ ] Tablet landscape.

## Launch And Navigation

- [ ] Launch from root `index.html`.
- [ ] Confirm redirect opens `maplibre-poc.html`.
- [ ] Launch screen opens.
- [ ] Start button opens Main Menu.
- [ ] Back/Home/Settings controls behave predictably.
- [ ] No normal user flow exposes developer or legacy SVG links.

## Journey Mode

- [ ] Choose Journey.
- [ ] Open United States.
- [ ] Select difficulty.
- [ ] Begin Journey.
- [ ] Complete the first activity.
- [ ] Confirm progress increments.
- [ ] Confirm completion overlay appears.
- [ ] Confirm auto-advance between journey steps works.
- [ ] Exit Journey.
- [ ] Resume Journey.
- [ ] Confirm saved step and difficulty are sensible.
- [ ] Complete World Foundations start-to-finish.
- [ ] Complete at least the first United States step start-to-finish.

## Study Preview

- [ ] Open a Journey detail screen.
- [ ] Open Study.
- [ ] Choose Preview for a step.
- [ ] Confirm labels can be revealed.
- [ ] Confirm Hide Labels works.
- [ ] Confirm tapping map targets reveals study labels only in Study Preview.
- [ ] Exit Study without changing Journey completion progress.

## Study Practice

- [ ] Open Study Practice from a Journey step.
- [ ] Complete the activity.
- [ ] Confirm practice completion UI appears.
- [ ] Confirm Journey progress is not incorrectly marked complete.
- [ ] Confirm returning to the Journey screen works.

## Free Play

- [ ] Open Free Play from Main Menu.
- [ ] Confirm it starts neutral on the world map.
- [ ] Browse regions without starting unintended gameplay.
- [ ] Select a country on the map.
- [ ] Confirm the Free Play country selection card appears.
- [ ] Start a regular activity from Browse.
- [ ] Select difficulty.
- [ ] Complete at least one Free Play activity.
- [ ] Confirm Free Play does not block or corrupt Journey progress.

## Core Gameplay

- [ ] Select an answer chip.
- [ ] Confirm only the chip appears selected.
- [ ] Confirm the correct map target does not highlight, pulse, glow, or reveal.
- [ ] Tap/click the wrong map target.
- [ ] Confirm incorrect feedback appears.
- [ ] Tap/click the correct map target.
- [ ] Confirm correct feedback appears.
- [ ] Confirm chip is removed or marked complete as intended.
- [ ] Confirm progress updates.
- [ ] Reset activity.
- [ ] Confirm progress and chips reset.
- [ ] Trigger repeated incorrect placement behavior.
- [ ] Confirm the reveal/retry behavior matches the product decision.

## Difficulty

- [ ] Easy behavior is visibly supportive.
- [ ] Medium behavior is less guided than Easy where applicable.
- [ ] Hard behavior hides extra help where applicable.
- [ ] Continents/Oceans only offers valid difficulties.
- [ ] Changing pre-play difficulty affects the started activity.

## Speaker Buttons

- [ ] Tap speaker button on desktop.
- [ ] Tap speaker button on phone.
- [ ] Confirm speech plays reliably.
- [ ] Confirm speaker tap does not select the chip.
- [ ] Confirm speaker tap does not count as a placement attempt.
- [ ] Confirm keyboard focus/Enter/Space works where practical.

## Mobile Gameplay

- [ ] Answer chips are fully visible on phone portrait.
- [ ] Answer chips are fully visible on phone landscape.
- [ ] Chip tray does not sit behind browser safe area.
- [ ] Tap-select chip works.
- [ ] Tap-place map target works.
- [ ] Map pan/zoom works while chips exist.
- [ ] Drag/drop, if still supported on the tested device, does not break tap-select/tap-place.
- [ ] Top bar, chip tray, map controls, and activity info do not overlap in a blocking way.

## Map And Content

- [ ] Continents and Oceans plays correctly.
- [ ] Pacific Ocean MultiPolygon behaves as one target.
- [ ] Ocean zones visually match `assets/maps/data/ocean-zones.geojson` closely enough for MVP.
- [ ] One US states/capitals activity plays correctly.
- [ ] One country activity plays correctly.
- [ ] One political-division activity plays correctly.
- [ ] One city/point activity plays correctly.
