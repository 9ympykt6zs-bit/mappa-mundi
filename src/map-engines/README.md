# Map Engine Scaffold

This folder is the intended home for the engine boundary used during the SVG to MapLibre migration.

The current app still runs through `src/app.js`, and the MapLibre proof of concept still runs through `src/maplibre-poc.js`. Nothing in this folder is wired into production yet.

Planned split:

- `ActivitySession`: quiz state, selected answer, completed answers, feedback, progress, reset.
- `ActivityNormalizer`: adapts legacy JSON activity files into the schema used by either engine.
- `SvgMapEngine`: wrapper around the existing SVG behavior while it is still supported.
- `MapLibreMapEngine`: MapLibre sources, layers, camera, hit testing, and completed-target styling.

The app shell should eventually call an engine through methods like:

```js
engine.loadActivity(activity);
engine.enterOverview();
engine.enterStudyView(activity.map.studyView);
engine.onTargetClick((targetId) => session.tryAnswer(targetId));
engine.setCompletedTargets(session.completedIds);
engine.reset();
```

Keep this boundary small. The map engine should not know about answer-bank DOM, and the answer bank should not know about MapLibre layer IDs.
