import assert from "node:assert/strict";
import fs from "node:fs";
import {
  SOURCE_ASSETS,
  buildUnitedStatesAtlas,
  getRelatedEntities,
  unitedStatesAtlas,
  validateUnitedStatesAtlas
} from "../src/atlas/united-states-atlas-data.js";

const sourceFeatures = new Map([
  [SOURCE_ASSETS.states, new Set(JSON.parse(fs.readFileSync(SOURCE_ASSETS.states, "utf8")).features.map((feature) => feature.id))],
  [SOURCE_ASSETS.capitals, new Set(JSON.parse(fs.readFileSync(SOURCE_ASSETS.capitals, "utf8")).features.map((feature) => feature.id))],
  [SOURCE_ASSETS.rivers, new Set(JSON.parse(fs.readFileSync(SOURCE_ASSETS.rivers, "utf8")).features.map((feature) => feature.id))],
  [SOURCE_ASSETS.lakes, new Set(JSON.parse(fs.readFileSync(SOURCE_ASSETS.lakes, "utf8")).features.map((feature) => feature.id))],
  [SOURCE_ASSETS.mountainRanges, new Set(JSON.parse(fs.readFileSync(SOURCE_ASSETS.mountainRanges, "utf8")).features.map((feature) => feature.properties.id))]
]);

assert.deepEqual(validateUnitedStatesAtlas(unitedStatesAtlas), []);
assert.equal(unitedStatesAtlas.entities.filter((entity) => entity.kind === "state").length, 50);
assert.equal(new Set(unitedStatesAtlas.entities.filter((entity) => entity.kind === "state").map((entity) => entity.id)).size, 50);

for (const entity of unitedStatesAtlas.entities) {
  if (!entity.source) continue;
  assert.ok(sourceFeatures.get(entity.source.asset)?.has(entity.source.featureId), `${entity.id} must reference an existing source feature.`);
}

assert.deepEqual(
  getRelatedEntities(unitedStatesAtlas, "tennessee", "borders").map((entity) => entity.id).sort(),
  ["state:alabama", "state:arkansas", "state:georgia", "state:kentucky", "state:mississippi", "state:missouri", "state:north-carolina", "state:virginia"].sort()
);
assert.equal(getRelatedEntities(unitedStatesAtlas, "state:louisiana", "capitalOf", "incoming")[0].name, "Baton Rouge");
assert.equal(getRelatedEntities(unitedStatesAtlas, "maine", "belongsToRegion")[0].name, "Northeast");
assert.deepEqual(
  getRelatedEntities(unitedStatesAtlas, "river:mississippi-river", "flowsThrough").map((entity) => entity.name),
  ["Minnesota", "Wisconsin", "Iowa", "Illinois", "Missouri", "Kentucky", "Tennessee", "Arkansas", "Mississippi", "Louisiana"]
);
assert.deepEqual(getRelatedEntities(unitedStatesAtlas, "mississippi", "flowsThrough", "incoming").map((entity) => entity.name), ["Mississippi River"]);
assert.ok(getRelatedEntities(unitedStatesAtlas, "colorado", "locatedIn", "incoming").some((entity) => entity.name === "Rocky Mountains"));

assert.throws(
  () => buildUnitedStatesAtlas({ states: [["alabama", "Alabama", "montgomery", "capital-montgomery", "south", ""], ["alabama", "Alabama duplicate", "montgomery-two", "capital-montgomery", "south", ""]] }),
  /Duplicate atlas entity ID/
);

console.log("United States atlas data check passed:", JSON.stringify({
  states: 50,
  capitals: 50,
  relationships: unitedStatesAtlas.relationships.length,
  physicalFeatures: unitedStatesAtlas.entities.filter((entity) => ["river", "lake", "mountain-range"].includes(entity.kind)).length
}));
