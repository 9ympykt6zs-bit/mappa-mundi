import assert from "node:assert/strict";
import fs from "node:fs";
import {
  buildMentalMapAnswerBank,
  clearMentalMapAnswers,
  createMentalMapChallengeState,
  evaluateMentalMapAnswer,
  getMentalMapRequiredStateIds,
  getMentalMapResultVisualState,
  getMentalMapScoreLabel,
  moveMentalMapAnswer,
  removeMentalMapAnswer,
  selectMentalMapAnswer,
  submitMentalMapAnswer,
  undoMentalMapAnswer
} from "../src/atlas/mental-map-challenge-engine.js";
import {
  createGeneratedShortestRouteChallenge,
  getMentalMapChallenges,
  validateMentalMapChallenge
} from "../src/atlas/mental-map-challenges.js";
import { findAllShortestBorderPaths, getBorderChainNeighbors } from "../src/atlas/border-chain.js";
import { getStateById } from "../src/atlas/united-states-atlas-queries.js";
import { buildMentalMapFeatureFeedback } from "../src/atlas/mental-map-feature-feedback.js";

function readJson(path) {
  return JSON.parse(fs.readFileSync(path, "utf8").replace(/^\uFEFF/, ""));
}

const geometryCollections = {
  rivers: readJson("assets/data/physical-features/proof-sheet-rivers.geojson"),
  lakes: readJson("assets/maps/data/inland-waters.geojson"),
  mountainRanges: readJson("assets/data/physical-features/us-mountain-ranges.geojson"),
  waters: readJson("assets/maps/data/ocean-zones.geojson"),
  countries: readJson("assets/maps/data/maplibre-world-countries.geojson")
};
const stateFeatures = readJson("assets/maps/data/maplibre-us-states-atlas.geojson");

function getFeatureFeedback(challenge) {
  const evaluation = evaluateMentalMapAnswer(challenge, challenge.correctStateIds?.slice(0, challenge.requiredSelectionCount || challenge.correctStateIds.length) || challenge.orderedStateIds);
  const resultVisualState = getMentalMapResultVisualState(challenge, evaluation);
  return buildMentalMapFeatureFeedback({
    associatedFeatures: resultVisualState.associatedFeatures,
    answerStateIds: resultVisualState.correctStateIds,
    orderedStateIds: resultVisualState.expectedSequenceStateIds,
    stateFeatures,
    collections: geometryCollections
  });
}

const challenges = getMentalMapChallenges({ includeGenerated: false });
challenges.forEach((challenge) => assert.deepEqual(validateMentalMapChallenge(challenge), []));
const byId = new Map(challenges.map((challenge) => [challenge.id, challenge]));

const pacific = byId.get("pacific-coast-any-three");
assert.deepEqual(pacific.correctStateIds, ["alaska", "california", "hawaii", "oregon", "washington"]);
const bankOne = buildMentalMapAnswerBank(pacific, { random: () => 0 });
const bankTwo = buildMentalMapAnswerBank(pacific, { random: () => 0.71 });
assert.notDeepEqual(bankOne.map((item) => item.id), bankTwo.map((item) => item.id));
getMentalMapRequiredStateIds(pacific).forEach((stateId) => assert.ok(bankOne.some((item) => item.id === stateId)));
pacific.distractorStateIds.forEach((stateId) => assert.ok(bankOne.some((item) => item.id === stateId)));
bankOne.forEach((item) => assert.ok(getStateById(item.id)));

let state = createMentalMapChallengeState(pacific, { random: () => 0.41 });
assert.equal(state.phase, "answering");
assert.equal(state.evaluation, null);
assert.equal("correctStateIds" in state, false);
assert.equal(state.answerBank.some((answer) => "isCorrect" in answer), false);
state = selectMentalMapAnswer(state, "alaska");
state = selectMentalMapAnswer(state, "alaska");
assert.deepEqual(state.selectedStateIds, ["alaska"]);
state = selectMentalMapAnswer(state, "california");
state = undoMentalMapAnswer(state);
assert.deepEqual(state.selectedStateIds, ["alaska"]);
assert.ok(state.answerBank.some((answer) => answer.id === "california"));
state = removeMentalMapAnswer(state, "alaska");
assert.deepEqual(state.selectedStateIds, []);
assert.ok(state.answerBank.some((answer) => answer.id === "alaska"));
state = selectMentalMapAnswer(state, "hawaii");
state = clearMentalMapAnswers(state);
assert.deepEqual(state.selectedStateIds, []);

assert.equal(evaluateMentalMapAnswer(pacific, ["alaska", "california", "hawaii"]).isCorrect, true);
assert.equal(evaluateMentalMapAnswer(pacific, ["california", "oregon", "washington"]).isCorrect, true);
assert.equal(evaluateMentalMapAnswer(pacific, ["alaska", "california"]).isCorrect, false);
assert.equal(evaluateMentalMapAnswer(pacific, ["alaska", "california", "hawaii", "oregon"]).isCorrect, false);
assert.equal(evaluateMentalMapAnswer(pacific, ["alaska", "california", "nevada"]).isCorrect, false);
assert.equal(evaluateMentalMapAnswer(pacific, pacific.correctStateIds).isCorrect, false);
const pacificPartial = evaluateMentalMapAnswer(pacific, ["alaska", "california", "nevada"]);
assert.equal(pacificPartial.score, 2);
assert.equal(pacificPartial.maxScore, 3);
assert.equal(getMentalMapScoreLabel(pacificPartial), "2 of 3 correct");
assert.equal(evaluateMentalMapAnswer(pacific, pacific.correctStateIds).score, 3);
let cappedPacificState = createMentalMapChallengeState(pacific, { random: () => 0.2 });
["alaska", "california", "hawaii", "oregon"].forEach((stateId) => {
  cappedPacificState = selectMentalMapAnswer(cappedPacificState, stateId);
});
assert.equal(cappedPacificState.selectedStateIds.length, 3);

const mexico = byId.get("mexico-land-border-all");
assert.equal(evaluateMentalMapAnswer(mexico, [...mexico.correctStateIds].reverse()).isCorrect, true);
const mexicoMissing = evaluateMentalMapAnswer(mexico, mexico.correctStateIds.slice(1));
assert.deepEqual(mexicoMissing.missingStateIds, [mexico.correctStateIds[0]]);
const mexicoExtra = evaluateMentalMapAnswer(mexico, [...mexico.correctStateIds, "utah"]);
assert.deepEqual(mexicoExtra.unnecessaryStateIds, ["utah"]);
const mexicoMixed = evaluateMentalMapAnswer(mexico, [...mexico.correctStateIds.slice(1), "utah"]);
assert.ok(mexicoMixed.missingStateIds.length === 1 && mexicoMixed.unnecessaryStateIds.length === 1);
assert.equal(mexicoMixed.score, 3);
assert.equal(mexicoMixed.maxScore, 4);

const canada = byId.get("canada-contiguous-land-border-all");
const expectedCanadaStateIds = [
  "idaho", "maine", "michigan", "minnesota", "montana", "new-hampshire",
  "new-york", "north-dakota", "ohio", "pennsylvania", "vermont", "washington"
];
assert.equal(canada.prompt, "Name as many contiguous U.S. states as you can that border Canada.");
assert.deepEqual(canada.correctStateIds, expectedCanadaStateIds);
assert.equal(canada.correctStateIds.length, 12);
["michigan", "ohio", "pennsylvania"].forEach((stateId) => assert.ok(canada.correctStateIds.includes(stateId)));
assert.ok(!canada.correctStateIds.includes("alaska"));
canada.correctStateIds.forEach((stateId) => assert.ok(getStateById(stateId)));

const canadaEight = evaluateMentalMapAnswer(canada, canada.correctStateIds.slice(0, 8));
assert.equal(canadaEight.score, 8);
assert.equal(canadaEight.maxScore, 12);
assert.equal(getMentalMapScoreLabel(canadaEight), "8 of 12 correct");
const canadaMixed = evaluateMentalMapAnswer(canada, [...canada.correctStateIds.slice(0, 7), "wisconsin"]);
assert.equal(canadaMixed.score, 7);
assert.equal(getMentalMapScoreLabel(canadaMixed), "7 of 12 correct");
assert.deepEqual(canadaMixed.selectedInvalidStateIds, ["wisconsin"]);
assert.equal(canadaMixed.missingStateIds.length, 5);
const canadaFull = evaluateMentalMapAnswer(canada, canada.correctStateIds);
assert.equal(canadaFull.score, 12);
assert.equal(canadaFull.maxScore, 12);
assert.equal(canadaFull.isCorrect, true);
assert.equal(getMentalMapScoreLabel(canadaFull), "12 of 12 correct");
const canadaFullWithIncorrect = evaluateMentalMapAnswer(canada, [...canada.correctStateIds, "wisconsin"]);
assert.equal(canadaFullWithIncorrect.score, 12);
assert.equal(canadaFullWithIncorrect.isCorrect, false);
assert.deepEqual(canadaFullWithIncorrect.selectedInvalidStateIds, ["wisconsin"]);

let cappedCanadaState = createMentalMapChallengeState(canada, { random: () => 0.2 });
canada.correctStateIds.forEach((stateId) => {
  cappedCanadaState = selectMentalMapAnswer(cappedCanadaState, stateId);
});
cappedCanadaState = selectMentalMapAnswer(cappedCanadaState, "alaska");
assert.equal(cappedCanadaState.selectedStateIds.length, 12);
assert.ok(!cappedCanadaState.selectedStateIds.includes("alaska"));

const gulfOrder = byId.get("gulf-coast-eastward");
const orderedBank = buildMentalMapAnswerBank(gulfOrder, { random: () => 0.5 }).map((item) => item.id);
assert.notDeepEqual(orderedBank.filter((id) => gulfOrder.orderedStateIds.includes(id)), gulfOrder.orderedStateIds);
assert.equal(evaluateMentalMapAnswer(gulfOrder, gulfOrder.orderedStateIds).isCorrect, true);
const wrongOrder = evaluateMentalMapAnswer(gulfOrder, [...gulfOrder.orderedStateIds].reverse());
assert.equal(wrongOrder.isCorrect, false);
assert.ok(wrongOrder.misplacedStateIds.length > 0);
assert.deepEqual(evaluateMentalMapAnswer(gulfOrder, gulfOrder.orderedStateIds.slice(0, -1)).missingStateIds, ["florida"]);
assert.deepEqual(evaluateMentalMapAnswer(gulfOrder, [...gulfOrder.orderedStateIds, "georgia"]).unnecessaryStateIds, ["georgia"]);

let orderedState = createMentalMapChallengeState(gulfOrder, { random: () => 0.3 });
orderedState = selectMentalMapAnswer(orderedState, "texas");
orderedState = selectMentalMapAnswer(orderedState, "louisiana");
orderedState = moveMentalMapAnswer(orderedState, "louisiana", "up");
assert.deepEqual(orderedState.selectedStateIds, ["louisiana", "texas"]);
orderedState = undoMentalMapAnswer(orderedState);
assert.deepEqual(orderedState.selectedStateIds, ["louisiana"]);

const alternatives = byId.get("tennessee-pennsylvania-intermediates");
assert.equal(evaluateMentalMapAnswer(alternatives, alternatives.orderedStateIds).isCorrect, true);
const accepted = evaluateMentalMapAnswer(alternatives, alternatives.acceptedAlternatives[0]);
assert.equal(accepted.isCorrect, true);
assert.equal(accepted.acceptedAlternativeIndex, 0);
assert.equal(evaluateMentalMapAnswer(alternatives, ["west-virginia", "kentucky"]).isCorrect, false);

const generated = createGeneratedShortestRouteChallenge({ random: () => 0.37 });
assert.ok(generated?.generated);
assert.deepEqual(validateMentalMapChallenge(generated), []);
const generatedPaths = findAllShortestBorderPaths(generated.routeStartStateId, generated.routeDestinationStateId, { limit: 2 });
assert.equal(generatedPaths.length, 1);
const generatedFullPath = [generated.routeStartStateId, ...generated.orderedStateIds, generated.routeDestinationStateId];
generatedFullPath.slice(1).forEach((stateId, index) => assert.ok(getBorderChainNeighbors(generatedFullPath[index]).includes(stateId)));
const generatedBank = buildMentalMapAnswerBank(generated, { random: () => 0.62 }).map((item) => item.id);
assert.ok(!generatedBank.includes(generated.routeStartStateId));
assert.ok(!generatedBank.includes(generated.routeDestinationStateId));

let submitted = createMentalMapChallengeState(mexico, { random: () => 0.2 });
mexico.correctStateIds.forEach((stateId) => { submitted = selectMentalMapAnswer(submitted, stateId); });
submitted = submitMentalMapAnswer(submitted, mexico);
assert.equal(submitted.phase, "result");
assert.equal(submitted.evaluation.isCorrect, true);
const visualState = getMentalMapResultVisualState(mexico, submitted.evaluation);
assert.deepEqual(visualState.selectedCorrectStateIds.sort(), [...mexico.correctStateIds].sort());
assert.ok("selectedIncorrectStateIds" in visualState && "missingStateIds" in visualState && "misplacedStateIds" in visualState);
assert.deepEqual(visualState.associatedFeatures.map((feature) => feature.entityId), ["country:mexico"]);

[
  ["rocky-mountains-any-three", "mountain-range:rocky-mountains"],
  ["lake-erie-all", "lake:lake-erie"],
  ["mississippi-river-any-three", "river:mississippi-river"],
  ["pacific-coast-any-three", "water:pacific-ocean"],
  ["atlantic-coast-any-three", "water:atlantic-ocean"],
  ["mexico-land-border-all", "country:mexico"],
  ["canada-contiguous-land-border-all", "country:canada"],
  ["gulf-of-mexico-coast-all", "water:gulf-of-mexico"],
  ["gulf-coast-eastward", "water:gulf-of-mexico"],
  ["mississippi-west-side-northward", "river:mississippi-river"]
].forEach(([challengeId, entityId]) => {
  const challenge = byId.get(challengeId);
  assert.ok(challenge.associatedFeatureIds.includes(entityId));
  const feedback = getFeatureFeedback(challenge);
  if (entityId === "water:gulf-of-mexico") {
    assert.ok(feedback.labelCollection.features.some((feature) => feature.properties.questionFeatureEntityId === entityId));
    assert.ok(feedback.missingFeatureIds.includes(entityId));
  } else {
    assert.ok(feedback.featureCollection.features.some((feature) => feature.properties.questionFeatureEntityId === entityId));
  }
  assert.ok(feedback.labelCollection.features.some((feature) => feature.properties.questionFeatureEntityId === entityId));
  assert.ok(feedback.cameraBounds);
  if (entityId === "water:pacific-ocean") {
    assert.ok(feedback.cameraBounds[1][0] - feedback.cameraBounds[0][0] < 180);
    const [labelLongitude, labelLatitude] = feedback.labelCollection.features[0].geometry.coordinates;
    assert.ok(labelLongitude < -120 && labelLatitude < 60);
  }
});

const canadaFeedback = getFeatureFeedback(canada);
const canadaLabel = canadaFeedback.labelCollection.features.find((feature) => (
  feature.properties.questionFeatureEntityId === "country:canada"
));
assert.deepEqual(canadaLabel.geometry.coordinates, [-101.9107, 60.324287]);
assert.ok(canadaLabel.geometry.coordinates[1] > 50, "Canada label must remain north of Minnesota.");
assert.ok(canadaFeedback.cameraBounds[0][0] < -120 && canadaFeedback.cameraBounds[1][0] > -70);
assert.ok(canadaFeedback.cameraBounds[1][1] >= canadaLabel.geometry.coordinates[1]);

const countryWithoutReliableLabel = buildMentalMapFeatureFeedback({
  associatedFeatures: [{ entityId: "country:test-country", id: "test-country", kind: "country", name: "Test Country" }],
  answerStateIds: ["minnesota"],
  stateFeatures,
  collections: {
    countries: {
      type: "FeatureCollection",
      features: [{
        type: "Feature",
        properties: { NAME: "Test Country", LABEL_X: -94, LABEL_Y: 46 },
        geometry: {
          type: "Polygon",
          coordinates: [[[-110, 55], [-100, 55], [-100, 65], [-110, 65], [-110, 55]]]
        }
      }]
    }
  }
});
assert.equal(countryWithoutReliableLabel.featureCollection.features.length, 1);
assert.equal(countryWithoutReliableLabel.labelCollection.features.length, 0);

const routeOnlyFeedback = getFeatureFeedback(alternatives);
assert.equal(routeOnlyFeedback.featureCollection.features.length, 0);
assert.equal(routeOnlyFeedback.routeCollection.features.length, 1);
const missingGeometryFeedback = buildMentalMapFeatureFeedback({
  associatedFeatures: [{ entityId: "lake:missing", id: "missing", kind: "lake", name: "Missing Lake" }],
  answerStateIds: ["ohio"],
  stateFeatures,
  collections: geometryCollections
});
assert.deepEqual(missingGeometryFeedback.missingFeatureIds, ["lake:missing"]);
assert.equal(missingGeometryFeedback.featureCollection.features.length, 0);
const resetFeatureFeedback = buildMentalMapFeatureFeedback({ stateFeatures, collections: geometryCollections });
assert.equal(resetFeatureFeedback.featureCollection.features.length, 0);
assert.equal(resetFeatureFeedback.routeCollection.features.length, 0);
const reset = createMentalMapChallengeState(pacific, { random: () => 0.9 });
assert.equal(reset.phase, "answering");
assert.deepEqual(reset.selectedStateIds, []);
assert.equal(reset.evaluation, null);

const runtimeSource = fs.readFileSync("src/maplibre-poc.js", "utf8");
const runnerSource = fs.readFileSync("src/maplibre/maplibre-activity-runner.js", "utf8");
const challengeUiSource = fs.readFileSync("src/atlas/mental-map-challenge-ui.js", "utf8");
const cssSource = fs.readFileSync("maplibre-poc.css", "utf8");
const markupSource = fs.readFileSync("index.html", "utf8");
assert.ok(markupSource.includes("Mental Map Challenge"));
assert.ok(runtimeSource.includes('currentAppScreen = "mental-map-challenge"'));
assert.ok(runtimeSource.includes('document.body.classList.add("mental-map-result-mode")'));
assert.ok(cssSource.includes("body.mental-map-challenge-mode:not(.mental-map-result-mode) #map"));
assert.ok(cssSource.includes("display: none"));
assert.ok(runnerSource.includes("prepareMentalMapChallenge()"));
assert.ok(runnerSource.includes("enterMentalMapChallengeResult(options = {})"));
assert.ok(runnerSource.includes('this.currentView === "mental-map-challenge-result"'));
assert.ok(runnerSource.includes('id: "mental-map-question-feature-fill"'));
assert.ok(runnerSource.includes('id: "mental-map-question-feature-line"'));
assert.ok(runnerSource.includes('id: "mental-map-question-feature-point-label"'));
assert.ok(runnerSource.includes('id: "mental-map-question-route-line"'));
assert.ok(runnerSource.includes("refreshMentalMapFeatureFeedback()"));
assert.ok(runnerSource.includes("setMentalMapChallengeResultVisualState({})"));
assert.ok(runnerSource.includes('this.map.moveLayer("mental-map-question-feature-point-label")'));
assert.ok(challengeUiSource.includes("getMentalMapScoreLabel(evaluation)"));
assert.ok(challengeUiSource.includes('if (state.phase === "result") container.scrollTop = 0;'));
assert.ok(cssSource.includes("mental-map-result-question-feature"));
assert.ok(!challenges.some((challenge) => /canonical atlas/i.test(`${challenge.prompt} ${challenge.explanation}`)));
assert.ok(!runtimeSource.includes("function selectBorderChainState(stateId)"));

console.log("Mental Map Challenge validation passed:", JSON.stringify({
  staticChallenges: challenges.length,
  generatedChallengeId: generated.id,
  pacificEligibleStates: pacific.correctStateIds.length,
  canadaBorderStates: byId.get("canada-contiguous-land-border-all").correctStateIds.length
}));
