# St. Lawrence River locating geometry

Status: implemented 2026-09-08

## Scope decision

Mappa Mundi renders the named St. Lawrence course from the eastern Lake Ontario outlet, through the New York–Ontario international reach, past Montreal and Quebec City, and through the lower estuary to the Gulf transition. The geometry is not clipped at the United States border, because a clipped line would falsely imply that the river ends with the app's U.S. curriculum scope.

The U.S. learning relationship remains `river:st-lawrence-river` → `state:new-york`. Canadian geography provides visual context only. It does not create Canadian curriculum concepts, evidence, or mastery records.

## Source audit and root cause

The original production line came from Natural Earth 10m Rivers and lake centerlines, global record `1159114637` (`rivernum` 23). It contains one 15-vertex, roughly 106.5 km line from `[-75.792, 44.497]` to `[-74.713, 44.999]`. The bundled Natural Earth North America supplement contains no matching St. Lawrence record. The missing geography was therefore a source-coverage defect, not a filter, projection, clipping, or build-selection error.

Natural Resources Canada's [National Hydro Network](https://open.canada.ca/data/en/dataset/a4b190fe-e090-4e6d-881e-b87956c07977) and [Atlas of Canada 1:5,000,000 Rivers](https://open.canada.ca/data/en/dataset/eda6b104-a284-5701-93b0-8dcde6777450) were also inspected. They are authoritative Canadian hydrography sources, but the relevant single-line river layer represents the broad St. Lawrence as several separated named line records where wide reaches are waterbody polygons. Using those records alone would leave misleading gaps in a line-locating activity.

The replacement uses [OpenStreetMap waterway relation 6122656](https://www.openstreetmap.org/relation/6122656), a named main-stream relation linked to Wikidata `Q134750`. The checked-in source extract records relation version 37 and its 2026-08-16 timestamp. Its 28 ordered `main_stream` ways plus way `118630155`, which bridges the relation's principal Montreal channel, form one endpoint-connected line. Automated Ramer–Douglas–Peucker simplification at 0.005 degrees retains 96 of 457 source nodes; no coordinates were authored or moved by hand. Source attribution and the ODbL license are retained in the extract, generated feature, MapLibre source, and in-app credits.

The durable source extract is `tools/source-data/openstreetmap/st-lawrence-river-main-stream.geojson`. `scripts/build-us-proof-sheet-rivers.mjs` consumes it and emits the stable `st-lawrence-river` feature in `assets/data/physical-features/proof-sheet-rivers.geojson`. The validator requires the relation ID/version, source attribution, minimum retained point count, expected bounds, and coverage windows at the Lake Ontario outlet, international reach, Montreal, Quebec City, and lower estuary/Gulf transition.

## Rendering and interaction

The visible line and interaction corridor use the same source-derived centerline. They remain conceptually separate in MapLibre:

- `river-line` renders the normal or highlighted river width and color.
- `river-hit-line` supplies the existing invisible 40 px activity corridor; pointer fallback uses the existing minimum 20 px desktop or 26 px coarse-pointer radius.

St. Lawrence does not receive an enlarged special-case corridor. Browser coverage checks several points along the supported course and a point clearly outside the river, then completes the ordinary correction flow.

The Ohio and St. Lawrence form the bounded `eastern-rivers` Guided cohort. Its camera uses center `[-77.2, 44.4]`, zoom 4.05 on desktop, and zoom 3.2 on compact/mobile layouts. Both cohort targets and the cross-border continuation remain in the initial search space. Learners retain the normal pan, zoom, and Fit controls.

## Guided Learning integration

The atlas now classifies St. Lawrence geometry as `full`, `crossesInternationalBorder`, and `hasCrossBorderVisualContinuation`. This removes the geometry deferral. The proof-sheet metadata accepts it for the same normal Memory Trail path as the other supported rivers. The feature can now be introduced and immediately retrieved with Ohio, rotate through later river-family review, and enter mixed physical-geography review when otherwise eligible. Concept ID `river-location:st-lawrence-river`, New York relationship evidence, mastery behavior, and the existing five-member standalone `central-eastern-rivers` Memory Trail section are unchanged.
