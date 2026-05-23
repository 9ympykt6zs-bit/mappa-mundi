# MVP Scope

## Ships In MVP

- MapLibre Atlas Quest as the primary app.
- Root launch through `index.html` redirecting to `maplibre-poc.html`.
- Journey Mode as the primary learning path.
- Tap-select answer chip, then tap/click map target to place.
- Desktop pointer drag/drop if it remains stable.
- Correct/incorrect feedback.
- Progress, reset, retry, completion, and journey step advancement.
- Study Preview as a simple label-reveal support mode.
- Study Practice as a simple non-journey-progress practice mode.
- Free Play as a secondary browse/activity-launch path.
- Existing playable content from `assets/maps/data/`.
- Ocean rendering from `assets/maps/data/ocean-zones.geojson`.
- Mobile layout usable enough for real phone play.

## Secondary / Limited MVP

- Settings may ship only if the UI is honest about what is actually wired.
- Free Play country selection cards may ship only if unfinished copy is removed or made clearly non-blocking.
- Difficulty selection may remain pre-play if active-play controls stay intentionally hidden.
- The ocean boundary editor may remain as a developer-only tool under `tools/`, but it is not part of the public MVP.

## Explicitly Not MVP

- Historical geography.
- US physical features unless already truly playable in the MapLibre app.
- Rich Free Play discovery mechanics.
- Country facts, media cards, photos, flags-as-lessons, or encyclopedia behavior.
- Trophies, badges, achievements, accounts, cloud sync, premium features, or paid layers.
- Full Classical/proof-sheet parity.
- Large content expansion.
- Renaming `maplibre-poc.*` files before the app is stable.
- Public use of `legacy-svg-app.html`.

## Definition Of Done

The MVP is done when a learner can open the app, choose a Journey, complete activities with tap-select/tap-place gameplay on desktop and phone, use Study Preview/Practice without corrupting progress, and avoid visible developer/placeholder distractions.

Progress must save and resume. The app must not reveal the correct target merely because an answer chip is selected. The normal user flow must not expose the legacy SVG app or developer tools.

## Content Coverage Note

Content coverage is already sufficient for MVP. The priority is stability, clarity, polish, mobile usability, and honest product boundaries.
