import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { hardContextPalette, getUsStateHardColorStops } from "../src/maplibre/political-map-style.js";
import { prepareMapReconstructionGeometry } from "../src/atlas/map-reconstruction-geometry.js";
import { getMapReconstructionRegion, MAP_RECONSTRUCTION_REGION_IDS } from "../src/atlas/map-reconstruction-regions.js";

const featureCollection = JSON.parse((await readFile(
  new URL("../assets/maps/data/maplibre-us-states-atlas.geojson", import.meta.url),
  "utf8"
)).replace(/^\uFEFF/, ""));
const runnerSource = await readFile(new URL("../src/maplibre/maplibre-activity-runner.js", import.meta.url), "utf8");

assert.equal(hardContextPalette.length, 10);
const firstFeatures = featureCollection.features.slice(0, 3);
assert.deepEqual(getUsStateHardColorStops(featureCollection).slice(0, 6), firstFeatures.flatMap((feature, index) => [
  feature.properties.id,
  hardContextPalette[index]
]));
assert.match(runnerSource, /from "\.\/political-map-style\.js"/);
assert.match(runnerSource, /return getUsStateHardColorStops\(this\.stateTargets\)/);

const region = getMapReconstructionRegion(MAP_RECONSTRUCTION_REGION_IDS.REBUILD_NEW_ENGLAND);
const geometry = prepareMapReconstructionGeometry(featureCollection, region);
const featureIndexes = new Map(featureCollection.features.map((feature, index) => [feature.properties.id, index]));
for (const piece of geometry.pieces) {
  assert.equal(piece.displayColor, hardContextPalette[featureIndexes.get(piece.stateId) % hardContextPalette.length]);
}

const subset = prepareMapReconstructionGeometry(featureCollection, {
  ...region,
  stateIds: region.stateIds.slice().reverse()
});
for (const piece of subset.pieces) {
  assert.equal(piece.displayColor, geometry.piecesById[piece.stateId].displayColor);
}

console.log("Reconstruction map style parity checks passed.");
