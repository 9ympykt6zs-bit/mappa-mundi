import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  evaluateMentalMapAnswer,
  getMentalMapResultVisualState
} from "../src/atlas/mental-map-challenge-engine.js";
import {
  buildMentalMapFeatureFeedback,
  buildMentalMapStateContextLabels,
  createCapitalFeedbackFeatureCollection
} from "../src/atlas/mental-map-feature-feedback.js";
import { getStateCapitalRelationshipChallenges } from "../src/atlas/state-capital-relationship-challenges.js";

function readJson(path) {
  return JSON.parse(readFileSync(new URL(path, import.meta.url), "utf8").replace(/^\uFEFF/, ""));
}

const stateAtlas = readJson("../assets/maps/data/maplibre-us-states-atlas.geojson");
const capitalActivity = readJson("../assets/maps/data/us-capitals.json");
const capitalFeatures = createCapitalFeedbackFeatureCollection(capitalActivity);
const challenges = getStateCapitalRelationshipChallenges()
  .filter(({ id }) => id.startsWith("state-capital-south-dakota-"));
const byDirection = new Map(challenges.map((challenge) => [challenge.promptDirection, challenge]));
const expectedNeighbors = ["iowa", "minnesota", "montana", "nebraska", "north-dakota", "wyoming"];

assert.equal(challenges.length, 2);
assert.match(byDirection.get("state-to-capital").prompt, /capital of South Dakota/);
assert.match(byDirection.get("capital-to-state").prompt, /Pierre is the capital/);

const correctVisual = getMentalMapResultVisualState(
  byDirection.get("state-to-capital"),
  evaluateMentalMapAnswer(byDirection.get("state-to-capital"), ["south-dakota"])
);
const incorrectEvaluation = evaluateMentalMapAnswer(byDirection.get("capital-to-state"), ["west-virginia"]);
const incorrectVisual = getMentalMapResultVisualState(
  byDirection.get("capital-to-state"),
  incorrectEvaluation
);

[correctVisual, incorrectVisual].forEach((visual) => {
  assert.deepEqual(visual.neighborStateIds, expectedNeighbors);
  assert.deepEqual(visual.cameraStateIds, ["south-dakota", ...expectedNeighbors]);
  assert.deepEqual(visual.capitalFeedback, {
    entityId: "capital:pierre",
    id: "pierre",
    name: "Pierre",
    sourceFeatureId: "capital-pierre",
    stateId: "south-dakota"
  });
  assert.equal(visual.referenceStateIds.includes("south-dakota"), true);
  expectedNeighbors.forEach((neighborId) => {
    assert.equal(visual.selectedCorrectStateIds.includes(neighborId), false);
    assert.equal(visual.selectedIncorrectStateIds.includes(neighborId), false);
    assert.equal(visual.correctStateIds.includes(neighborId), false);
    assert.equal(visual.missingStateIds.includes(neighborId), false);
  });
});
assert.equal(incorrectEvaluation.isCorrect, false);
assert.deepEqual(incorrectVisual.selectedIncorrectStateIds, ["west-virginia"]);
assert.deepEqual(incorrectVisual.missingStateIds, ["south-dakota"]);

const feedback = buildMentalMapFeatureFeedback({
  associatedFeatures: [{ ...correctVisual.capitalFeedback, kind: "capital" }],
  answerStateIds: correctVisual.cameraStateIds,
  stateFeatures: stateAtlas,
  collections: { capitals: capitalFeatures }
});
const capitalPoint = feedback.featureCollection.features[0];
const capitalLabel = feedback.labelCollection.features[0];
assert.deepEqual(capitalPoint.geometry.coordinates, [-100.3462286, 44.3671094]);
assert.deepEqual(capitalLabel.geometry.coordinates, capitalPoint.geometry.coordinates);
assert.equal(capitalPoint.properties.questionFeatureName, "Pierre");
assert.equal(capitalPoint.properties.questionFeatureKind, "capital");
assert.deepEqual(feedback.missingFeatureIds, []);
assert.ok(feedback.cameraBounds[0][0] < -110, "The camera should extend west through South Dakota's neighbor context.");
assert.ok(feedback.cameraBounds[1][0] > -90, "The camera should extend east through South Dakota's neighbor context.");
assert.ok(feedback.cameraBounds[0][1] < 41, "The camera should include southern neighboring states.");
assert.ok(feedback.cameraBounds[1][1] > 49, "The camera should include northern neighboring states.");

const labels = buildMentalMapStateContextLabels(expectedNeighbors, stateAtlas);
assert.deepEqual(labels.features.map(({ properties }) => properties.stateName).sort(), [
  "Iowa", "Minnesota", "Montana", "Nebraska", "North Dakota", "Wyoming"
]);
assert.equal(labels.features.every(({ properties }) => properties.contextRole === "neighbor"), true);

const resetFeedback = buildMentalMapFeatureFeedback({
  stateFeatures: stateAtlas,
  collections: { capitals: capitalFeatures }
});
assert.equal(resetFeedback.featureCollection.features.length, 0, "Capital context must remain absent before submission/reset.");
assert.equal(resetFeedback.labelCollection.features.length, 0, "Capital labels must remain absent before submission/reset.");

console.log("Capital Connections map feedback contract check passed.");
