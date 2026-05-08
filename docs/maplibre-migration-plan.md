# MapLibre Migration Plan

## Current State

The project currently has two working map paths:

- The main app in `index.html`, `styles.css`, and `src/app.js` uses custom SVG rendering. It supports existing activities, tuning/debug tools, drag/drop, click-to-place, click-to-reveal, reset, labels, flags, icons, and the fixed answer bank.
- The MapLibre proof of concept in `maplibre-poc.html`, `maplibre-poc.css`, and `src/maplibre-poc.js` proves a better long-term interaction model: globe launch, familiar pan/zoom, region selection, U.S. transition, shape targets, point targets, and a fixed bottom answer bank.

The important conclusion from the POC is that MapLibre should own geographic projection, camera movement, hit testing, and lon/lat point placement. The app should own educational activity state, prompts, answer-bank behavior, correctness, progress, and tuning output.

## Recommended Direction

Make MapLibre the main map engine incrementally, starting with one vertical slice. Do not remove the SVG system until the MapLibre runner supports the same activities and tuning workflow at acceptable quality.

The clean separation should be:

- `Activity data`: what the learner studies.
- `Activity session`: selected answer, completed targets, feedback, progress.
- `Map engine adapter`: render targets, reveal/completion states, query clicked target, move camera, expose tuning coordinates.
- `UI shell`: title, instructions, answer bank, reset, mode toggles, tuning/debug panels.

## Activity Data Model

Use a versioned activity schema that can describe both SVG and MapLibre activities during the transition.

```json
{
  "schemaVersion": 2,
  "id": "us-states-capitals-01",
  "title": "States and Capitals 1",
  "engine": "maplibre",
  "targetNoun": "state or capital",
  "defaultMode": "word-bank",
  "map": {
    "kind": "globe-region",
    "region": "united-states",
    "initialView": { "center": [-18, 18], "zoom": 1.25 },
    "studyView": {
      "bounds": [[-74.35, 40.85], [-66.75, 47.55]],
      "padding": { "top": 55, "right": 46, "bottom": 78, "left": 46 }
    }
  },
  "sources": [
    {
      "id": "world-countries",
      "type": "geojson",
      "url": "assets/maps/data/maplibre-world-countries.geojson",
      "attribution": "Natural Earth public domain"
    },
    {
      "id": "us-states",
      "type": "geojson",
      "url": "assets/maps/data/maplibre-us-states-atlas.geojson",
      "promoteId": "id",
      "attribution": "U.S. Census Bureau"
    }
  ],
  "targetLayers": [
    {
      "id": "target-states",
      "kind": "shape",
      "sourceId": "us-states",
      "matchProperty": "id"
    },
    {
      "id": "target-capitals",
      "kind": "point",
      "source": "targets"
    }
  ],
  "targets": [
    {
      "id": "maine",
      "name": "Maine",
      "kind": "shape",
      "sourceFeatureId": "maine",
      "layerId": "target-states",
      "color": "#4f83cc",
      "label": { "anchor": [-69.2, 45.25], "fontSize": 12, "rotation": 0 }
    },
    {
      "id": "augusta-me",
      "name": "Augusta, ME",
      "kind": "point",
      "lon": -69.7795,
      "lat": 44.3106,
      "layerId": "target-capitals",
      "hitRadius": 16,
      "color": "#4f83cc",
      "label": { "offset": [-24, 14], "fontSize": 11, "rotation": 0 }
    }
  ]
}
```

### Adapting Existing Data

Existing activity JSON files do not need to be rewritten immediately. A normalizer can adapt legacy fields:

- `features[]` becomes `targets[]`.
- `type: "state"` or `shape: "path"` becomes `kind: "shape"`.
- `type: "city"`, `type: "capital"`, or `shape: "circle"` becomes `kind: "point"`.
- `mapShapeId` or `id` becomes `sourceFeatureId`.
- `labelPosition` becomes a label anchor for SVG activities, and should become lon/lat label anchors for MapLibre activities when possible.
- `labelOffset`, `iconOffset`, `hitRadius`, `labelFontSize`, and `labelRotation` carry forward.

This allows the UI/session logic to consume normalized activity objects while old files continue to load.

## Map Engine Adapter

The activity runner should talk to a small interface instead of calling MapLibre directly:

```js
engine.loadActivity(normalizedActivity)
engine.enterOverview()
engine.enterStudyView(activity.map.studyView)
engine.onTargetClick((targetId, event) => {})
engine.setCompletedTargets(completedIds)
engine.setSelectedTarget(targetId)
engine.reset()
engine.destroy()
```

The SVG app can keep its current implementation for now. The MapLibre runner should be built behind this adapter first, then wired into a new route or feature flag before replacing the main engine.

## MapLibre Activity Runner

A MapLibre activity load should follow this order:

1. Create or reuse the MapLibre map instance.
2. Load declared `sources`.
3. Add context layers such as world land, country borders, water, U.S. state context, or Europe country context.
4. Add target shape layers with stable feature IDs.
5. Add point marker and invisible point hit layers.
6. Add completed-label/icon layers.
7. Register one map click dispatcher:
   - Query point hit layers first.
   - Query shape target layers second.
   - Return a target ID to the activity session.
8. Let the shared session decide correctness.
9. Update MapLibre paint/filter/source state from `completedIds`.

The POC already demonstrates this pattern informally. The next step is to extract it out of `src/maplibre-poc.js` into a reusable runner.

## Tuning And Debug Mode

MapLibre tuning should output data in geographic terms whenever possible:

- Point targets:
  - Tune `lon`/`lat` only when the actual target is wrong.
  - Tune `label.offset`, `icon.offset`, and `hitRadius` for readability and touch ergonomics.
  - Optional: allow dragging a marker and copying the updated lon/lat.
- Shape targets:
  - Do not tune geometry manually in the app.
  - Tune `label.anchor` as lon/lat.
  - Tune `label.offset`, `label.rotation`, `label.fontSize`, and style overrides.
- Context/style:
  - Tune layer opacity, stroke width, and label visibility by zoom level.

Small safe first step: add debug readouts to the POC showing lon/lat under cursor/touch and the top clicked layer/target ID. Full drag tuning should wait until the runner/session boundary is extracted.

## Production Basemap Strategy

### Packaged GeoJSON By Region

Pros:

- Simple to inspect and edit.
- Works well for small, focused proof sheets.
- Easy to source from Natural Earth and Census public-domain datasets.
- No tile server or tile packaging pipeline required.

Cons:

- Large layers can slow initial load.
- Styling and level-of-detail must be managed manually.
- Not ideal for dense future layers such as counties, rivers, trails, canals, or many points.

### PMTiles Or Local Vector Tiles

Pros:

- Best long-term fit for Google Maps-lite behavior.
- Efficient progressive loading by zoom and region.
- Good for many future layers: counties, rivers, mountains, bays, deserts, trails, canals, Native American regions, and feature labels.
- Can be hosted as static files.

Cons:

- Requires a tile-generation pipeline.
- Harder to inspect and tune by hand.
- More build/release complexity.

### Recommendation

Use packaged GeoJSON for the next vertical slice and early homeschool proof sheets. Move to PMTiles/local vector tiles once either of these becomes true:

- Full U.S. counties or dense physical geography layers are needed.
- Europe/world context data becomes too heavy.
- Offline performance becomes a product requirement.

This lets the app mature without prematurely building a map-tile production pipeline.

## Migration Phases

### Phase 1: MapLibre Vertical Slice

- Keep the SVG app as-is.
- Extract shared activity session logic from the POC:
  - selected answer
  - completed targets
  - correctness
  - reset
  - answer-bank rendering inputs
- Extract a `MapLibreActivityRunner`.
- Convert `States and Capitals 1` to a schema-v2 activity or adapter-fed legacy activity.
- Add debug readouts for lon/lat and clicked target ID.

Success criteria:

- The POC and a new MapLibre route share the runner.
- U.S. state and capital targets still work.
- The fixed answer bank remains outside the map.

### Phase 2: United States Activities

- Make U.S. MapLibre activities the first production path.
- Add one or two more U.S. proof sheets.
- Add Washington, DC as both a point/context feature where appropriate.
- Add tuning for label anchors and point offsets.
- Decide whether GeoJSON remains sufficient or PMTiles are needed for county-level future work.

### Phase 3: Europe Activities

- Convert European Cities first because lon/lat point placement is MapLibre's strength.
- Convert Western European Countries after choosing or generating reliable country GeoJSON with stable IDs.
- Retire custom Europe projection calibration once the MapLibre Europe activities are stable.

### Phase 4: Continents/Oceans

- Build the world overview as a real activity rather than a placeholder.
- Use Natural Earth continent/ocean polygons or curated simplified zones.
- Keep globe selection behavior as the first screen.

### Phase 5: Additional Geography Features

- Add layer families for:
  - capitals and cities
  - rivers
  - mountains
  - bays and bodies of water
  - deserts
  - trails
  - canals
  - Native American regions
  - counties or small subdivisions
- Introduce level-of-detail rules per layer family.
- Consider PMTiles/local vector tiles before adding dense national layers.

## Immediate Next Implementation Step

Extract the POC's educational session logic and MapLibre map calls into two modules:

- `ActivitySession`: pure quiz state and answer checking.
- `MapLibreActivityRunner`: MapLibre sources, layers, camera, hit testing, and completed-state rendering.

Then wire `maplibre-poc.html` to those modules without changing behavior. That gives us a tested seam before making MapLibre the main app engine.
