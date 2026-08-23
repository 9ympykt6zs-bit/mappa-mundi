import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  evaluateMentalMapAnswer,
  getMentalMapResultVisualState
} from "../src/atlas/mental-map-challenge-engine.js";
import { buildMentalMapFeatureFeedback } from "../src/atlas/mental-map-feature-feedback.js";
import { getUnitedStatesRelationshipChallenges } from "../src/atlas/united-states-relationship-challenges.js";

function readJson(path) {
  return JSON.parse(readFileSync(new URL(path, import.meta.url), "utf8").replace(/^\uFEFF/, ""));
}

const stateAtlas = readJson("../assets/maps/data/maplibre-us-states-atlas.geojson");
const mountainRanges = readJson("../assets/data/physical-features/us-mountain-ranges.geojson");
const runnerSource = readFileSync(new URL("../src/maplibre/maplibre-activity-runner.js", import.meta.url), "utf8");
const challenges = getUnitedStatesRelationshipChallenges();
const challenge = challenges.find(({ id }) => id === "us-relationship-mountain-range-colorado-rocky-mountains");
const incorrectChoice = Object.entries(challenge.answerLabelsByStateId)
  .find(([, label]) => label === "Adirondack Mountains")[0];
const evaluation = evaluateMentalMapAnswer(challenge, [incorrectChoice]);
const visual = getMentalMapResultVisualState(challenge, evaluation);
const lower48StateIds = stateAtlas.features
  .map((feature) => feature.properties?.id)
  .filter((stateId) => stateId && !["alaska", "hawaii", "district-of-columbia"].includes(stateId));
const feedback = buildMentalMapFeatureFeedback({
  associatedFeatures: visual.associatedFeatures,
  answerStateIds: [...visual.cameraStateIds, ...lower48StateIds],
  stateFeatures: stateAtlas,
  collections: { mountainRanges }
});

assert.equal(lower48StateIds.length, 48);
assert.equal(visual.isUnitedStatesConnections, true);
assert.equal(visual.referenceStateIds[0], "colorado");
assert.ok(visual.neighborStateIds.length >= 6, "Connections feedback should include Colorado's neighbors as context.");
visual.neighborStateIds.forEach((stateId) => {
  assert.equal(visual.selectedCorrectStateIds.includes(stateId), false);
  assert.equal(visual.selectedIncorrectStateIds.includes(stateId), false);
  assert.equal(visual.correctStateIds.includes(stateId), false);
  assert.equal(visual.missingStateIds.includes(stateId), false);
});

assert.equal(mountainRanges.features.length, 20);
assert.equal(mountainRanges.features.every((feature) => (
  feature.properties?.geometryPrecision === "approximate"
  && feature.properties?.visualArt?.kind === "stylized-mountain-range"
  && feature.properties.visualArt.spines?.length
  && feature.properties.symbolAnchors?.length
)), true);

assert.equal(feedback.featureCollection.features.length, 1);
const ridge = feedback.featureCollection.features[0];
assert.equal(["LineString", "MultiLineString"].includes(ridge.geometry.type), true);
assert.notEqual(ridge.geometry.type, "Polygon");
assert.equal(ridge.properties.questionFeatureRenderingMode, "stylized-ridge");
assert.equal(ridge.properties.geometryPrecision, "approximate");
assert.deepEqual(feedback.mountainRenderingModes, [{
  entityId: "mountain-range:rocky-mountains",
  mode: "stylized-ridge",
  geometryPrecision: "approximate"
}]);
assert.ok(feedback.labelCollection.features.some(({ properties }) => properties.questionFeatureRole === "mountain-symbol"));
assert.ok(feedback.labelCollection.features.some(({ properties }) => (
  properties.questionFeatureRole === "feature-label"
  && properties.questionFeatureName === "Rocky Mountains"
)));
assert.ok(feedback.cameraBounds[0][0] <= -124, "Connections camera should retain western national context.");
assert.ok(feedback.cameraBounds[1][0] >= -67, "Connections camera should retain eastern national context.");
assert.ok(feedback.cameraBounds[0][1] <= 25, "Connections camera should retain southern national context.");
assert.ok(feedback.cameraBounds[1][1] >= 49, "Connections camera should retain northern national context.");

assert.match(runnerSource, /mental-map-mountain-feedback-corridor/);
assert.match(runnerSource, /mental-map-mountain-feedback-symbol/);
assert.match(runnerSource, /\["!=", \["get", "questionFeatureKind"\], "mountain-range"\]/);
assert.match(runnerSource, /!\["alaska", "hawaii", "district-of-columbia"\]\.includes\(stateId\)/);
assert.match(runnerSource, /colors\.connectionsNeighborFill/);
assert.match(runnerSource, /colors\.connectionsBackgroundFill/);

console.log("U.S. Connections geographic feedback preserves national context and uses authored mountain ridge illustrations.");
