# Atlas Quest MVP Planning

This folder defines the MVP plan for Atlas Quest.

The MVP goal is to make the existing MapLibre Atlas Quest app stable, clear, polished, mobile-usable, and honest about what works. It is not a content expansion push.

Primary app path:

- `index.html` redirects to `maplibre-poc.html`.
- `maplibre-poc.html` loads `src/maplibre-poc.js`.
- `src/maplibre/maplibre-activity-runner.js` owns the MapLibre map rendering.

Primary user loop:

1. Open Atlas Quest.
2. Choose or continue a Journey.
3. Select an answer chip.
4. Tap or click the matching map target.
5. Get feedback, complete progress, and move to the next activity.

Free Play may ship as a secondary browse/activity-launch feature. Study Preview and Study Practice may ship as simple support modes. The legacy SVG app is not part of the MVP user experience.

Rule for future work: stabilize before expanding. Do not add more geography content before MVP unless the work fixes broken existing content.
