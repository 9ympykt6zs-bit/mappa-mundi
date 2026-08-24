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
import { MapLibreActivityRunner } from "../src/maplibre/maplibre-activity-runner.js";

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
  answerStateIds: visual.cameraStateIds,
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
  mode: "mountain-ranges-activity-visualization",
  geometryPrecision: "approximate"
}]);
assert.equal(feedback.labelCollection.features.some(({ properties }) => properties.questionFeatureRole === "mountain-symbol"), false);
assert.ok(feedback.labelCollection.features.some(({ properties }) => (
  properties.questionFeatureRole === "feature-label"
  && properties.questionFeatureName === "Rocky Mountains"
)));
const runner = Object.assign(Object.create(MapLibreActivityRunner.prototype), {
  activity: { id: "us-connections", targets: [] },
  mountainRanges
});
const feedbackSymbols = runner.getMentalMapMountainFeedbackSymbolGeoJson(feedback).features;
const activityTarget = {
  id: "rocky-mountains",
  name: "Rocky Mountains",
  type: "mountain-range",
  kind: "shape"
};
assert.deepEqual(
  feedbackSymbols,
  runner.getMountainRangeSymbolFeatures(activityTarget),
  "Connections must reuse the Mountain Ranges activity symbol generator without a feedback-only approximation."
);
assert.ok(feedbackSymbols.length > mountainRanges.features.find(({ properties }) => (
  properties.id === "rocky-mountains"
)).properties.symbolAnchors.length, "Activity visualization should retain its authored dense symbol chain.");
assert.ok(feedbackSymbols.every(({ properties }) => (
  properties.hasStylizedMountainRangeArt === true
  && properties.mountainRangeGlyphImage
)), "Connections symbols must retain the activity's authored styling contract.");
assert.ok(feedback.cameraBounds[0][0] < -114, "Connections camera should include Colorado's western neighbor context.");
assert.ok(feedback.cameraBounds[1][0] > -95, "Connections camera should include Colorado's eastern neighbor context.");
assert.ok(feedback.cameraBounds[0][1] < 32, "Connections camera should include Colorado's southern neighbor context.");
assert.ok(feedback.cameraBounds[1][1] > 47, "Connections camera should include Colorado's northern mountain context.");
assert.ok(feedback.cameraBounds[0][0] > -130 && feedback.cameraBounds[1][0] < -85,
  "Connections camera should not use all-50-state bounds merely to render the national background.");
assert.equal(stateLabels.features.length, 50);
assert.equal(stateLabels.features.filter(({ properties }) => properties.contextRole === "target").length, 1);
assert.equal(stateLabels.features.filter(({ properties }) => properties.contextRole === "neighbor").length, visual.neighborStateIds.length);
assert.equal(stateLabels.features.filter(({ properties }) => properties.contextRole === "background").length, 49 - visual.neighborStateIds.length);
const alaskaLabel = stateLabels.features.find(({ properties }) => properties.stateId === "alaska");
assert.ok(alaskaLabel.geometry.coordinates[0] < -150 && alaskaLabel.geometry.coordinates[0] > -170);

assert.doesNotMatch(runnerSource, /mental-map-mountain-feedback-corridor/);
assert.match(runnerSource, /mental-map-mountain-feedback-symbols/);
assert.match(runnerSource, /mental-map-mountain-feedback-glow/);
assert.match(runnerSource, /mental-map-mountain-feedback-symbol/);
assert.match(runnerSource, /mental-map-target-state-label/);
assert.match(runnerSource, /"text-allow-overlap": false/);
assert.match(runnerSource, /getUsStateContextLineColor/);
assert.match(runnerSource, /"#203b55"/);
assert.match(runnerSource, /"#4f616e"/);
assert.match(runnerSource, /"#687985"/);
assert.match(runnerSource, /getUsStateContextLineSortKeyExpression/);
assert.match(runnerSource, /expandConnectionsFeedbackCameraBounds/);
assert.match(runnerSource, /minimumLongitudeSpan = 12/);
assert.match(runnerSource, /minimumLatitudeSpan = 9/);
assert.match(runnerSource, /options\.visualState\?\.isUnitedStatesConnections \? "none" : "visible"/);
assert.match(runnerSource, /\["!=", \["get", "questionFeatureKind"\], "mountain-range"\]/);
assert.match(runnerSource, /stateId !== "district-of-columbia"/);
assert.match(runnerSource, /colors\.connectionsNeighborFill/);
assert.match(runnerSource, /colors\.connectionsBackgroundFill/);

console.log("U.S. Connections feedback keeps all 50 states available while framing the target context with visible boundary hierarchy.");
