import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  evaluateMentalMapAnswer,
  getMentalMapResultVisualState
} from "../src/atlas/mental-map-challenge-engine.js";
import {
  buildMentalMapFeatureFeedback,
  buildMentalMapStateContextLabels
} from "../src/atlas/mental-map-feature-feedback.js";
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
const allStateIds = stateAtlas.features
  .map((feature) => feature.properties?.id)
  .filter((stateId) => stateId && stateId !== "district-of-columbia");
const feedback = buildMentalMapFeatureFeedback({
  associatedFeatures: visual.associatedFeatures,
  answerStateIds: [...visual.cameraStateIds, ...allStateIds],
  stateFeatures: stateAtlas,
  collections: { mountainRanges }
});
const stateLabels = buildMentalMapStateContextLabels(allStateIds, stateAtlas, {
  neighborStateIds: visual.neighborStateIds,
  targetStateIds: visual.referenceStateIds
});

assert.equal(allStateIds.length, 50);
assert.ok(allStateIds.includes("alaska"));
assert.ok(allStateIds.includes("hawaii"));
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
  && feature.properties.symbolAnchors?.length
)), true);

assert.equal(feedback.featureCollection.features.length, 0);
assert.deepEqual(feedback.mountainRenderingModes, [{
  entityId: "mountain-range:rocky-mountains",
  mode: "authored-symbols",
  geometryPrecision: "approximate"
}]);
assert.ok(feedback.labelCollection.features.some(({ properties }) => properties.questionFeatureRole === "mountain-symbol"));
assert.ok(feedback.labelCollection.features.some(({ properties }) => (
  properties.questionFeatureRole === "feature-label"
  && properties.questionFeatureName === "Rocky Mountains"
)));
assert.ok(feedback.cameraBounds[0][0] <= -179, "Connections camera should include Alaska's western extent.");
assert.ok(feedback.cameraBounds[1][0] >= -67, "Connections camera should retain the Atlantic coast.");
assert.ok(feedback.cameraBounds[0][1] <= 19, "Connections camera should include Hawaii's southern extent.");
assert.ok(feedback.cameraBounds[1][1] >= 71, "Connections camera should include Alaska's northern extent.");
assert.equal(stateLabels.features.length, 50);
assert.equal(stateLabels.features.filter(({ properties }) => properties.contextRole === "target").length, 1);
assert.equal(stateLabels.features.filter(({ properties }) => properties.contextRole === "neighbor").length, visual.neighborStateIds.length);
assert.equal(stateLabels.features.filter(({ properties }) => properties.contextRole === "background").length, 49 - visual.neighborStateIds.length);
const alaskaLabel = stateLabels.features.find(({ properties }) => properties.stateId === "alaska");
assert.ok(alaskaLabel.geometry.coordinates[0] < -150 && alaskaLabel.geometry.coordinates[0] > -170);

assert.doesNotMatch(runnerSource, /mental-map-mountain-feedback-corridor/);
assert.match(runnerSource, /mental-map-mountain-feedback-symbol/);
assert.match(runnerSource, /mental-map-target-state-label/);
assert.match(runnerSource, /"text-allow-overlap": false/);
assert.match(runnerSource, /getUsStateContextLineColor/);
assert.match(runnerSource, /"#7a8996"/);
assert.match(runnerSource, /\["!=", \["get", "questionFeatureKind"\], "mountain-range"\]/);
assert.match(runnerSource, /stateId !== "district-of-columbia"/);
assert.match(runnerSource, /colors\.connectionsNeighborFill/);
assert.match(runnerSource, /colors\.connectionsBackgroundFill/);

console.log("U.S. Connections feedback frames all 50 states and uses authored mountain symbols without raw ridge strokes.");
