# MVP Bugs And Risks

## Architecture Risks

- `src/maplibre-poc.js` is monolithic. It owns launch flow, menus, activity loading, settings, Journey Mode, Free Play, Study Mode, gameplay, and persistence.
- `maplibre-poc.*` naming creates product confusion. These files are the MVP app path, but the names still say POC.
- `legacy-svg-app.html`, `styles.css`, and `src/app.js` remain in the repo. They are useful for reference but are not the MVP user experience.
- The public `maplibre-poc.html` currently contains a developer SVG link unless removed before MVP.

## Product Risks

- Settings imply target filtering, but granular `studyTargetSettings` filtering is not fully wired into gameplay.
- Continue Journey placeholder copy may conflict with actual progress persistence.
- Free Play contains unfinished country-card copy for pronunciation/audio tools and facts.
- Repeated-miss answer reveal may or may not be desired. It can help learning, but it also gives answers after enough misses.
- Large review activities such as all Mexico states or all Canada provinces may be poor on phones.

## Mobile Risks

- Phone layout has had several fixes, but still needs real-device Safari and Android Chrome testing.
- Browser safe-area behavior can differ from desktop viewport emulation.
- Speaker button reliability depends on mobile browser speech synthesis behavior.
- Landscape phone mode is higher risk because vertical map space is limited.

## Map/Data Risks

- Ocean boundaries are approximate educational polygons, not maritime or scientific boundaries.
- Pacific Ocean is a MultiPolygon and needs continued hit-testing/rendering checks.
- Some ocean/polar edge cases may still look imperfect at certain camera angles.
- Two GeoJSON files contain a BOM that raw Node JSON parsing rejects: `assets/maps/data/maplibre-us-new-england-states.geojson` and `assets/maps/data/maplibre-us-states-atlas.geojson`.

## Repo/Process Risks

- There is no `package.json` and no standard test harness.
- Validation is currently mostly manual plus syntax checks.
- Several docs are stale and still describe `src/app.js` as the current app.
- Developer/debug flags exist through query strings and localStorage. They are probably safe if hidden, but they should not surface in normal user flow.
