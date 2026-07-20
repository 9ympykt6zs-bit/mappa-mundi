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
  isMentalMapAnswerChoiceDisabled,
  moveSelectedAnswer,
  moveMentalMapAnswer,
  reorderMentalMapAnswers,
  removeMentalMapAnswer,
  selectMentalMapAnswer,
  submitMentalMapAnswer,
  undoMentalMapAnswer
} from "../src/atlas/mental-map-challenge-engine.js";
import {
  createGeneratedShortestRouteChallenge,
  getMentalMapRouteRenderingMode,
  getMentalMapChallenges,
  MENTAL_MAP_ANSWER_MODES,
  MENTAL_MAP_COUNT_RULES,
  MENTAL_MAP_ROUTE_RENDERING_MODES,
  MENTAL_MAP_ROUTE_VALIDATION_MODES,
  validateMentalMapChallenge
} from "../src/atlas/mental-map-challenges.js";
import { findAllShortestBorderPaths, getBorderChainNeighbors } from "../src/atlas/border-chain.js";
import { getStateById } from "../src/atlas/united-states-atlas-queries.js";
import { buildMentalMapFeatureFeedback } from "../src/atlas/mental-map-feature-feedback.js";
import { listUnitedStatesCoastlineSegments } from "../src/atlas/united-states-coastline-segments.js";

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
const audioManifest = readJson("assets/audio/audio-manifest.json");
const stateNamesWithAudio = [...new Set(stateFeatures.features
  .filter((feature) => feature.properties?.id !== "district-of-columbia")
  .map((feature) => feature.properties?.name)
  .filter(Boolean))];
assert.equal(stateNamesWithAudio.length, 50);
stateNamesWithAudio.forEach((name) => {
  const audioPath = audioManifest.chips?.[name];
  assert.ok(audioPath, `Missing generated state-name audio for ${name}.`);
  assert.ok(fs.existsSync(audioPath), `Missing generated state-name MP3: ${audioPath}`);
});

function getFeatureFeedback(challenge, selectedStateIds = null) {
  const defaultSelection = challenge.correctStateIds?.slice(
    0,
    challenge.requiredSelectionCount || challenge.correctStateIds.length
  ) || challenge.orderedStateIds;
  const evaluation = evaluateMentalMapAnswer(challenge, selectedStateIds ?? defaultSelection);
  const resultVisualState = getMentalMapResultVisualState(challenge, evaluation);
  return buildMentalMapFeatureFeedback({
    associatedFeatures: resultVisualState.associatedFeatures,
    answerStateIds: resultVisualState.correctStateIds,
    orderedStateIds: resultVisualState.expectedSequenceStateIds,
    routeRenderingMode: resultVisualState.routeRenderingMode,
    explicitRouteGeometry: resultVisualState.explicitRouteGeometry,
    stateFeatures,
    collections: geometryCollections
  });
}

const challenges = getMentalMapChallenges({ includeGenerated: false });
challenges.forEach((challenge) => assert.deepEqual(validateMentalMapChallenge(challenge), []));
const byId = new Map(challenges.map((challenge) => [challenge.id, challenge]));

const pacific = byId.get("pacific-coast-any-three");
assert.equal(pacific.countRule, MENTAL_MAP_COUNT_RULES.MINIMUM);
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
assert.equal(evaluateMentalMapAnswer(pacific, ["alaska", "california", "hawaii", "oregon"]).isCorrect, true);
assert.equal(evaluateMentalMapAnswer(pacific, ["alaska", "california", "nevada"]).isCorrect, false);
assert.equal(evaluateMentalMapAnswer(pacific, pacific.correctStateIds).isCorrect, true);
assert.equal(evaluateMentalMapAnswer(pacific, ["alaska", "california", "hawaii", "nevada"]).isCorrect, false);
const pacificPartial = evaluateMentalMapAnswer(pacific, ["alaska", "california", "nevada"]);
assert.equal(pacificPartial.score, 2);
assert.equal(pacificPartial.maxScore, 5);
assert.equal(getMentalMapScoreLabel(pacificPartial), "2 of 5 correct");
assert.equal(evaluateMentalMapAnswer(pacific, pacific.correctStateIds).score, 5);
let cappedPacificState = createMentalMapChallengeState(pacific, { random: () => 0.2 });
["alaska", "california", "hawaii", "oregon", "washington", "nevada"].forEach((stateId) => {
  cappedPacificState = selectMentalMapAnswer(cappedPacificState, stateId);
});
assert.deepEqual(cappedPacificState.selectedStateIds, pacific.correctStateIds);

const exactCountChallenge = {
  id: "exact-count-control",
  title: "Exact Count Control",
  prompt: "Choose exactly three Pacific Coast states.",
  answerMode: MENTAL_MAP_ANSWER_MODES.SELECT_COUNT,
  countRule: MENTAL_MAP_COUNT_RULES.EXACT,
  correctStateIds: [...pacific.correctStateIds],
  requiredSelectionCount: 3,
  distractorStateIds: ["nevada"],
  explanation: "Validation control."
};
assert.deepEqual(validateMentalMapChallenge(exactCountChallenge), []);
assert.equal(evaluateMentalMapAnswer(exactCountChallenge, pacific.correctStateIds.slice(0, 3)).isCorrect, true);
assert.equal(evaluateMentalMapAnswer(exactCountChallenge, pacific.correctStateIds.slice(0, 4)).isCorrect, false);
assert.equal(createMentalMapChallengeState(exactCountChallenge).maxSelections, 3);

challenges.filter((challenge) => challenge.answerMode === MENTAL_MAP_ANSWER_MODES.SELECT_COUNT)
  .forEach((challenge) => {
    assert.equal(challenge.countRule, MENTAL_MAP_COUNT_RULES.MINIMUM);
    assert.match(challenge.prompt, /\b(any|at least)\b/i);
  });

const recallAllChallengeIds = [
  "mississippi-river-any-three",
  "mexico-land-border-all",
  "canada-contiguous-land-border-all",
  "lake-erie-all",
  "gulf-of-mexico-coast-all"
];
recallAllChallengeIds.forEach((challengeId) => {
  const challenge = byId.get(challengeId);
  assert.equal(challenge.answerMode, MENTAL_MAP_ANSWER_MODES.RECALL_ALL);
  assert.match(challenge.prompt, new RegExp(`There are ${challenge.correctStateIds.length} `));
  assert.match(challenge.prompt, /Name as many as you can\./);
  assert.doesNotMatch(challenge.prompt, /Name any three|Select every|Minimum required|canonical atlas/i);
});

const mississippiRecall = byId.get("mississippi-river-any-three");
const expectedMississippiStateIds = [
  "arkansas", "illinois", "iowa", "kentucky", "louisiana",
  "minnesota", "mississippi", "missouri", "tennessee", "wisconsin"
];
assert.equal(
  mississippiRecall.prompt,
  "There are 10 U.S. states that border or lie alongside the Mississippi River. Name as many as you can."
);
assert.deepEqual(mississippiRecall.correctStateIds, expectedMississippiStateIds);
assert.equal(mississippiRecall.correctStateIds.length, 10);
const mississippiFour = evaluateMentalMapAnswer(mississippiRecall, expectedMississippiStateIds.slice(0, 4));
assert.equal(mississippiFour.score, 4);
assert.equal(mississippiFour.maxScore, 10);
assert.equal(getMentalMapScoreLabel(mississippiFour), "4 of 10 correct");
assert.equal(mississippiFour.isCorrect, false);
assert.deepEqual(mississippiFour.missingStateIds, expectedMississippiStateIds.slice(4));
const mississippiEight = evaluateMentalMapAnswer(mississippiRecall, expectedMississippiStateIds.slice(0, 8));
assert.equal(getMentalMapScoreLabel(mississippiEight), "8 of 10 correct");
assert.equal(mississippiEight.missingStateIds.length, 2);
const mississippiFull = evaluateMentalMapAnswer(mississippiRecall, expectedMississippiStateIds);
assert.equal(getMentalMapScoreLabel(mississippiFull), "10 of 10 correct");
assert.equal(mississippiFull.isCorrect, true);
const mississippiWithIncorrect = evaluateMentalMapAnswer(
  mississippiRecall,
  [...expectedMississippiStateIds, "alabama"]
);
assert.equal(mississippiWithIncorrect.score, 10);
assert.deepEqual(mississippiWithIncorrect.selectedInvalidStateIds, ["alabama"]);
assert.equal(mississippiWithIncorrect.isCorrect, false);

let mississippiRecallState = createMentalMapChallengeState(mississippiRecall, { random: () => 0.4 });
assert.equal(mississippiRecallState.maxSelections, null);
assert.equal("correctStateIds" in mississippiRecallState, false);
assert.ok(mississippiRecallState.answerBank.every((answer) => !("isCorrect" in answer)));
[...mississippiRecall.correctStateIds, ...mississippiRecall.distractorStateIds].forEach((stateId) => {
  mississippiRecallState = selectMentalMapAnswer(mississippiRecallState, stateId);
});
assert.ok(mississippiRecallState.selectedStateIds.length > mississippiRecall.correctStateIds.length);
const mississippiVisualState = getMentalMapResultVisualState(mississippiRecall, mississippiFour);
assert.deepEqual(mississippiVisualState.correctStateIds, expectedMississippiStateIds);
assert.deepEqual(
  mississippiVisualState.associatedFeatures.map((feature) => feature.entityId),
  ["river:mississippi-river"]
);

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

const lakeErie = byId.get("lake-erie-all");
const lakeErieWithIndiana = evaluateMentalMapAnswer(
  lakeErie,
  ["pennsylvania", "new-york", "ohio", "indiana"]
);
assert.deepEqual(lakeErieWithIndiana.selectedValidStateIds, ["pennsylvania", "new-york", "ohio"]);
assert.deepEqual(lakeErieWithIndiana.missingStateIds, ["michigan"]);
assert.deepEqual(lakeErieWithIndiana.selectedInvalidStateIds, ["indiana"]);
assert.equal(lakeErieWithIndiana.isCorrect, false);

let mexicoSelectionState = createMentalMapChallengeState(mexico, { random: () => 0.2 });
assert.equal(mexicoSelectionState.maxSelections, null);
["california", "nevada", "new-mexico", "texas"].forEach((stateId) => {
  mexicoSelectionState = selectMentalMapAnswer(mexicoSelectionState, stateId);
});
assert.equal(isMentalMapAnswerChoiceDisabled(mexicoSelectionState, "california"), true);
assert.equal(isMentalMapAnswerChoiceDisabled(mexicoSelectionState, "arizona"), false);
mexicoSelectionState = selectMentalMapAnswer(mexicoSelectionState, "arizona");
assert.deepEqual(mexicoSelectionState.selectedStateIds, [
  "california", "nevada", "new-mexico", "texas", "arizona"
]);
const mexicoSelectionEvaluation = evaluateMentalMapAnswer(mexico, mexicoSelectionState.selectedStateIds);
assert.equal(mexicoSelectionEvaluation.score, 4);
assert.equal(mexicoSelectionEvaluation.maxScore, 4);
assert.equal(mexicoSelectionEvaluation.isCorrect, false);
assert.deepEqual(mexicoSelectionEvaluation.selectedInvalidStateIds, ["nevada"]);
const mexicoSelectionSubmission = submitMentalMapAnswer(mexicoSelectionState, mexico);
assert.equal(mexicoSelectionSubmission.phase, "result");
assert.equal(mexicoSelectionSubmission.evaluation.isCorrect, false);
assert.equal(getMentalMapScoreLabel(mexicoSelectionSubmission.evaluation), "4 of 4 correct");

mexicoSelectionState = removeMentalMapAnswer(mexicoSelectionState, "nevada");
assert.equal(isMentalMapAnswerChoiceDisabled(mexicoSelectionState, "nevada"), false);
assert.equal(evaluateMentalMapAnswer(mexico, mexicoSelectionState.selectedStateIds).isCorrect, true);
assert.equal(submitMentalMapAnswer(mexicoSelectionState, mexico).evaluation.isCorrect, true);
mexicoSelectionState = clearMentalMapAnswers(mexicoSelectionState);
assert.deepEqual(mexicoSelectionState.selectedStateIds, []);
assert.ok(mexicoSelectionState.answerBank.every((answer) => (
  !isMentalMapAnswerChoiceDisabled(mexicoSelectionState, answer.id)
)));

const canada = byId.get("canada-contiguous-land-border-all");
const expectedCanadaStateIds = [
  "idaho", "maine", "michigan", "minnesota", "montana", "new-hampshire",
  "new-york", "north-dakota", "ohio", "pennsylvania", "vermont", "washington"
];
assert.equal(canada.prompt, "There are 12 contiguous U.S. states that border Canada. Name as many as you can.");
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

let uncappedCanadaState = createMentalMapChallengeState(canada, { random: () => 0.2 });
canada.correctStateIds.forEach((stateId) => {
  uncappedCanadaState = selectMentalMapAnswer(uncappedCanadaState, stateId);
});
uncappedCanadaState = selectMentalMapAnswer(uncappedCanadaState, "alaska");
assert.equal(uncappedCanadaState.selectedStateIds.length, 13);
assert.ok(uncappedCanadaState.selectedStateIds.includes("alaska"));

const gulfOrder = byId.get("gulf-coast-eastward");
assert.equal(getMentalMapRouteRenderingMode(gulfOrder), MENTAL_MAP_ROUTE_RENDERING_MODES.FEATURE_ONLY);
const orderedBank = buildMentalMapAnswerBank(gulfOrder, { random: () => 0.5 }).map((item) => item.id);
assert.notDeepEqual(orderedBank.filter((id) => gulfOrder.orderedStateIds.includes(id)), gulfOrder.orderedStateIds);
assert.equal(evaluateMentalMapAnswer(gulfOrder, gulfOrder.orderedStateIds).isCorrect, true);
const wrongOrder = evaluateMentalMapAnswer(gulfOrder, [...gulfOrder.orderedStateIds].reverse());
assert.equal(wrongOrder.isCorrect, false);
assert.ok(wrongOrder.misplacedStateIds.length > 0);
assert.deepEqual(evaluateMentalMapAnswer(gulfOrder, gulfOrder.orderedStateIds.slice(0, -1)).missingStateIds, ["florida"]);
assert.deepEqual(evaluateMentalMapAnswer(gulfOrder, [...gulfOrder.orderedStateIds, "georgia"]).unnecessaryStateIds, ["georgia"]);

const mississippiOrder = byId.get("mississippi-west-side-northward");
assert.equal(getMentalMapRouteRenderingMode(mississippiOrder), MENTAL_MAP_ROUTE_RENDERING_MODES.FEATURE_ONLY);
const mississippiOrderFeedback = getFeatureFeedback(mississippiOrder);
assert.equal(mississippiOrderFeedback.routeCollection.features.length, 0);
assert.ok(mississippiOrderFeedback.featureCollection.features.some((feature) => (
  feature.properties.questionFeatureEntityId === "river:mississippi-river"
)));
assert.ok(mississippiOrderFeedback.labelCollection.features.some((feature) => (
  feature.properties.questionFeatureName === "Mississippi River"
)));
assert.ok(mississippiOrderFeedback.cameraBounds);

let orderedState = createMentalMapChallengeState(gulfOrder, { random: () => 0.3 });
const immutableOrder = ["louisiana", "mississippi", "arkansas", "iowa", "minnesota"];
assert.deepEqual(moveSelectedAnswer(immutableOrder, 2, 1), [
  "louisiana", "arkansas", "mississippi", "iowa", "minnesota"
]);
assert.deepEqual(immutableOrder, ["louisiana", "mississippi", "arkansas", "iowa", "minnesota"]);
assert.deepEqual(moveSelectedAnswer(immutableOrder, 0, 1), [
  "mississippi", "louisiana", "arkansas", "iowa", "minnesota"
]);
assert.deepEqual(moveSelectedAnswer(immutableOrder, 4, 3), [
  "louisiana", "mississippi", "arkansas", "minnesota", "iowa"
]);
assert.deepEqual(moveSelectedAnswer(immutableOrder, 0, -1), immutableOrder);
assert.deepEqual(moveSelectedAnswer(immutableOrder, 4, 5), immutableOrder);
assert.deepEqual(moveSelectedAnswer(immutableOrder, 9, 1), immutableOrder);
assert.deepEqual(moveSelectedAnswer(immutableOrder, 1, 1), immutableOrder);
assert.equal(new Set(moveSelectedAnswer(immutableOrder, 2, 1)).size, immutableOrder.length);

["texas", "louisiana", "mississippi", "alabama"].forEach((stateId) => {
  orderedState = selectMentalMapAnswer(orderedState, stateId);
});
const orderedStateBeforeReorder = orderedState;
orderedState = reorderMentalMapAnswers(orderedState, 2, 1);
assert.deepEqual(orderedState.selectedStateIds, ["texas", "mississippi", "louisiana", "alabama"]);
assert.deepEqual(orderedStateBeforeReorder.selectedStateIds, ["texas", "louisiana", "mississippi", "alabama"]);
assert.equal(orderedState.evaluation, null);
orderedState = moveMentalMapAnswer(orderedState, "louisiana", "up");
assert.deepEqual(orderedState.selectedStateIds, ["texas", "louisiana", "mississippi", "alabama"]);
orderedState = moveMentalMapAnswer(orderedState, "louisiana", "down");
assert.deepEqual(orderedState.selectedStateIds, ["texas", "mississippi", "louisiana", "alabama"]);
assert.deepEqual(moveMentalMapAnswer(orderedState, "texas", "up").selectedStateIds, orderedState.selectedStateIds);
assert.deepEqual(moveMentalMapAnswer(orderedState, "alabama", "down").selectedStateIds, orderedState.selectedStateIds);
const reorderedSubmission = submitMentalMapAnswer(
  reorderMentalMapAnswers(orderedState, 2, 1),
  gulfOrder
);
assert.equal(reorderedSubmission.evaluation.isCorrect, false);
assert.deepEqual(reorderedSubmission.evaluation.selectedStateIds, ["texas", "louisiana", "mississippi", "alabama"]);
orderedState = undoMentalMapAnswer(orderedState);
assert.deepEqual(orderedState.selectedStateIds, ["texas", "mississippi", "louisiana"]);
orderedState = clearMentalMapAnswers(orderedState);
assert.deepEqual(orderedState.selectedStateIds, []);

const unorderedStateBeforeReorder = createMentalMapChallengeState(pacific, { random: () => 0.3 });
assert.deepEqual(
  reorderMentalMapAnswers(unorderedStateBeforeReorder, 0, 1),
  unorderedStateBeforeReorder
);

const alternatives = byId.get("tennessee-pennsylvania-intermediates");
assert.equal(getMentalMapRouteRenderingMode(alternatives), MENTAL_MAP_ROUTE_RENDERING_MODES.STATE_CENTROID_SEQUENCE);
assert.equal(
  alternatives.prompt,
  "Find a route from Tennessee to Pennsylvania by traveling only through states that share a border."
);
assert.equal(alternatives.secondaryInstruction, "Choose the intermediate states in order.");
assert.equal(alternatives.routeValidationMode, MENTAL_MAP_ROUTE_VALIDATION_MODES.BORDER_GRAPH);
const alternativesBank = buildMentalMapAnswerBank(alternatives, { random: () => 0.43 }).map((item) => item.id);
const alternativesShortestPaths = findAllShortestBorderPaths("tennessee", "pennsylvania");
const alternativesShortestIntermediates = new Set(alternativesShortestPaths.flatMap((route) => route.slice(1, -1)));
alternativesShortestIntermediates.forEach((stateId) => assert.ok(alternativesBank.includes(stateId)));

const kentuckyOhio = evaluateMentalMapAnswer(alternatives, ["kentucky", "ohio"]);
assert.equal(kentuckyOhio.isCorrect, true);
assert.equal(kentuckyOhio.isShortestRoute, true);
assert.deepEqual(kentuckyOhio.routeStateIds, ["tennessee", "kentucky", "ohio", "pennsylvania"]);
assert.deepEqual(kentuckyOhio.unnecessaryStateIds, []);
assert.deepEqual(kentuckyOhio.misplacedStateIds, []);
assert.deepEqual(
  getMentalMapResultVisualState(alternatives, kentuckyOhio).expectedSequenceStateIds,
  kentuckyOhio.routeStateIds
);

const kentuckyWestVirginia = evaluateMentalMapAnswer(alternatives, ["kentucky", "west-virginia"]);
assert.equal(kentuckyWestVirginia.isCorrect, true);
assert.equal(kentuckyWestVirginia.isShortestRoute, true);

const validLongerRoute = evaluateMentalMapAnswer(alternatives, ["north-carolina", "virginia", "maryland"]);
assert.equal(validLongerRoute.isCorrect, true);
assert.equal(validLongerRoute.isShortestRoute, false);

const invalidRoute = evaluateMentalMapAnswer(alternatives, ["kentucky", "maryland"]);
assert.equal(invalidRoute.isCorrect, false);
assert.equal(invalidRoute.firstInvalidTransition.fromStateId, "kentucky");
assert.equal(invalidRoute.firstInvalidTransition.toStateId, "maryland");

const repeatedRoute = evaluateMentalMapAnswer(
  alternatives,
  ["kentucky", "tennessee", "virginia", "maryland"]
);
assert.equal(repeatedRoute.isCorrect, false);
assert.equal(repeatedRoute.repeatedStateId, "tennessee");

const unfinishedRoute = evaluateMentalMapAnswer(alternatives, ["kentucky", "ohio", "michigan"]);
assert.equal(unfinishedRoute.isCorrect, false);
assert.equal(unfinishedRoute.firstInvalidTransition.fromStateId, "michigan");
assert.equal(unfinishedRoute.firstInvalidTransition.toStateId, "pennsylvania");

const generated = createGeneratedShortestRouteChallenge({ random: () => 0.37 });
assert.ok(generated?.generated);
assert.deepEqual(validateMentalMapChallenge(generated), []);
const generatedStartName = getStateById(generated.routeStartStateId).name;
const generatedDestinationName = getStateById(generated.routeDestinationStateId).name;
assert.equal(
  generated.prompt,
  `Find a route from ${generatedStartName} to ${generatedDestinationName} by traveling only through states that share a border.`
);
assert.equal(generated.secondaryInstruction, "Choose the intermediate states in order.");
assert.doesNotMatch(
  `${generated.prompt} ${generated.secondaryInstruction} ${generated.explanation}`,
  /unique shortest land-border route|graph|state-to-state land-border transitions/i
);
assert.ok(challenges.every((challenge) => !/unique shortest land-border route|graph terminology/i.test(
  `${challenge.title} ${challenge.prompt} ${challenge.secondaryInstruction || ""} ${challenge.explanation}`
)));
const routeCopy = [...challenges, generated]
  .filter((challenge) => challenge.answerMode === MENTAL_MAP_ANSWER_MODES.ORDERED_SEQUENCE)
  .map((challenge) => `${challenge.prompt} ${challenge.secondaryInstruction || ""} ${challenge.explanation}`)
  .join(" ");
assert.doesNotMatch(routeCopy, /unique shortest|land-border route|shortest path|\bgraph\b|land-border transitions/i);
const generatedPaths = findAllShortestBorderPaths(generated.routeStartStateId, generated.routeDestinationStateId);
assert.ok(generatedPaths.length >= 1);
generatedPaths.forEach((route) => {
  const routeEvaluation = evaluateMentalMapAnswer(generated, route.slice(1, -1));
  assert.equal(routeEvaluation.isCorrect, true);
  assert.equal(routeEvaluation.isShortestRoute, true);
});
const generatedFullPath = generatedPaths[0];
generatedFullPath.slice(1).forEach((stateId, index) => assert.ok(getBorderChainNeighbors(generatedFullPath[index]).includes(stateId)));
const generatedBank = buildMentalMapAnswerBank(generated, { random: () => 0.62 }).map((item) => item.id);
new Set(generatedPaths.flatMap((route) => route.slice(1, -1))).forEach((stateId) => {
  assert.ok(generatedBank.includes(stateId));
});
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
  if (entityId.startsWith("water:")) {
    assert.ok(feedback.labelCollection.features.some((feature) => feature.properties.questionFeatureEntityId === entityId));
    assert.ok(!feedback.featureCollection.features.some((feature) => feature.properties.questionFeatureEntityId === entityId));
    assert.ok(feedback.coastlineCollection.features.length > 0);
    assert.ok(feedback.coastlineCollection.features.every((feature) => (
      feature.properties.questionFeatureEntityId === entityId
      && feature.properties.renderingMode === "coastline-only"
    )));
    if (entityId === "water:gulf-of-mexico") assert.ok(feedback.missingFeatureIds.includes(entityId));
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

const atlanticFeedback = getFeatureFeedback(byId.get("atlantic-coast-any-three"));
const pacificFeedback = getFeatureFeedback(pacific);
const gulfFeedback = getFeatureFeedback(byId.get("gulf-of-mexico-coast-all"));
const getStateCoastlineSegments = (feedback, stateId) => feedback.coastlineCollection.features
  .filter((feature) => feature.properties.stateId === stateId)
  .flatMap((feature) => feature.geometry.coordinates.slice(1).map((end, index) => (
    [feature.geometry.coordinates[index], end]
  )));
const segmentKey = ([start, end]) => [start, end]
  .map((point) => point.map((value) => Number(value).toFixed(4)).join(","))
  .sort()
  .join("|");
const atlanticFloridaSegments = getStateCoastlineSegments(atlanticFeedback, "florida");
const gulfFloridaSegments = getStateCoastlineSegments(gulfFeedback, "florida");
assert.ok(atlanticFloridaSegments.length > 0);
assert.ok(gulfFloridaSegments.length > 0);
const gulfFloridaKeys = new Set(gulfFloridaSegments.map(segmentKey));
assert.ok(atlanticFloridaSegments.every((segment) => !gulfFloridaKeys.has(segmentKey(segment))));
assert.ok(atlanticFloridaSegments.flat().every(([longitude]) => longitude > -82));
assert.ok(gulfFloridaSegments.flat().some(([longitude]) => longitude < -82));
assert.ok(gulfFloridaSegments.flat().every(([longitude, latitude]) => !(longitude > -82 && latitude > 29)));
assert.ok(gulfFloridaSegments.flat().some(([longitude, latitude]) => longitude < -86 && latitude > 30));
assert.ok(gulfFloridaSegments.flat().some(([longitude, latitude]) => longitude < -82 && latitude < 28));
assert.ok(atlanticFloridaSegments.flat().some(([longitude, latitude]) => longitude > -81.6 && latitude > 30));
const floridaCoastlineSegments = listUnitedStatesCoastlineSegments();
assert.deepEqual(
  floridaCoastlineSegments.map(({ stateId, waterFeatureId }) => [stateId, waterFeatureId]),
  [["florida", "gulf-of-mexico"], ["florida", "atlantic-ocean"]]
);
assert.ok(getStateCoastlineSegments(pacificFeedback, "california").length > 0);
assert.ok(!pacificFeedback.coastlineCollection.features.some((feature) => feature.properties.stateId === "florida"));

const arcticFeedback = buildMentalMapFeatureFeedback({
  associatedFeatures: [{
    entityId: "water:arctic-ocean",
    id: "arctic-ocean",
    kind: "water",
    name: "Arctic Ocean",
    relationshipType: "coast",
    coastStateIds: ["alaska"]
  }],
  answerStateIds: ["alaska"],
  stateFeatures,
  collections: geometryCollections
});
assert.ok(arcticFeedback.coastlineCollection.features.length > 0);
assert.equal(arcticFeedback.featureCollection.features.length, 0);
assert.ok(arcticFeedback.labelCollection.features.some((feature) => feature.properties.questionFeatureName === "Arctic Ocean"));

const missingSeaFeedback = buildMentalMapFeatureFeedback({
  associatedFeatures: [{
    entityId: "water:future-sea",
    id: "future-sea",
    kind: "water",
    name: "Future Sea",
    relationshipType: "coast",
    coastStateIds: ["florida"]
  }],
  answerStateIds: ["florida"],
  stateFeatures,
  collections: geometryCollections
});
assert.deepEqual(missingSeaFeedback.missingFeatureIds, ["water:future-sea"]);
assert.equal(missingSeaFeedback.featureCollection.features.length, 0);
assert.equal(missingSeaFeedback.coastlineCollection.features.length, 0);
assert.ok(missingSeaFeedback.labelCollection.features.some((feature) => feature.properties.questionFeatureName === "Future Sea"));

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

const routeOnlyFeedback = getFeatureFeedback(alternatives, ["kentucky", "ohio"]);
assert.equal(routeOnlyFeedback.featureCollection.features.length, 0);
assert.equal(routeOnlyFeedback.routeCollection.features.length, 1);
assert.equal(routeOnlyFeedback.routeCollection.features[0].properties.routeRenderingMode, "state-centroid-sequence");

assert.equal(getMentalMapRouteRenderingMode({
  answerMode: MENTAL_MAP_ANSWER_MODES.ORDERED_SEQUENCE,
  associatedFeatureIds: ["river:example"]
}), MENTAL_MAP_ROUTE_RENDERING_MODES.FEATURE_ONLY);

const explicitRouteGeometry = {
  type: "LineString",
  coordinates: [[-100, 35], [-95, 40], [-90, 45]]
};
const explicitRouteFeedback = buildMentalMapFeatureFeedback({
  answerStateIds: ["texas", "minnesota"],
  orderedStateIds: ["texas", "minnesota"],
  routeRenderingMode: MENTAL_MAP_ROUTE_RENDERING_MODES.EXPLICIT_ROUTE_GEOMETRY,
  explicitRouteGeometry,
  stateFeatures,
  collections: geometryCollections
});
assert.equal(explicitRouteFeedback.routeCollection.features.length, 1);
assert.deepEqual(explicitRouteFeedback.routeCollection.features[0].geometry, explicitRouteGeometry);
assert.equal(explicitRouteFeedback.routeCollection.features[0].properties.routeRenderingMode, "explicit-route-geometry");
assert.ok(explicitRouteFeedback.cameraBounds[0][0] <= -100 && explicitRouteFeedback.cameraBounds[1][1] >= 45);
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
assert.equal(resetFeatureFeedback.coastlineCollection.features.length, 0);
const reset = createMentalMapChallengeState(pacific, { random: () => 0.9 });
assert.equal(reset.phase, "answering");
assert.deepEqual(reset.selectedStateIds, []);
assert.equal(reset.evaluation, null);

const runtimeSource = fs.readFileSync("src/maplibre-poc.js", "utf8");
const runnerSource = fs.readFileSync("src/maplibre/maplibre-activity-runner.js", "utf8");
const challengeUiSource = fs.readFileSync("src/atlas/mental-map-challenge-ui.js", "utf8");
const chipSpeechSource = fs.readFileSync("src/chip-speech.js", "utf8");
const cssSource = fs.readFileSync("maplibre-poc.css", "utf8");
const markupSource = fs.readFileSync("index.html", "utf8");
assert.ok(markupSource.includes("Mental Map Challenge"));
assert.ok(runtimeSource.includes('currentAppScreen = "mental-map-challenge"'));
assert.ok(runtimeSource.includes('document.body.classList.add("mental-map-result-mode")'));
assert.ok(cssSource.includes("body.mental-map-challenge-mode:not(.mental-map-result-mode) #map"));
assert.ok(cssSource.includes("display: none"));
assert.ok(runnerSource.includes("prepareMentalMapChallenge()"));
assert.ok(runnerSource.includes("enterMentalMapChallengeResult(options = {})"));
assert.ok(runnerSource.includes('["mental-map-challenge-result", "compass-challenge-result"].includes(this.currentView)'));
assert.ok(runnerSource.includes('id: "mental-map-question-feature-fill"'));
assert.ok(runnerSource.includes('id: "mental-map-question-feature-line"'));
assert.ok(runnerSource.includes('id: "mental-map-question-feature-point-label"'));
assert.ok(runnerSource.includes('id: "mental-map-question-coastline"'));
assert.ok(runnerSource.includes('source: "mental-map-question-coastlines"'));
assert.ok(!fs.readFileSync("src/atlas/mental-map-feature-feedback.js", "utf8").includes("GULF_OF_MEXICO_FEEDBACK_REGION"));
assert.ok(runnerSource.includes('id: "mental-map-question-route-line"'));
assert.ok(runnerSource.includes('"line-dasharray": [1.5, 1.1]'));
assert.ok(runnerSource.includes("refreshMentalMapFeatureFeedback()"));
assert.ok(runnerSource.includes("setMentalMapChallengeResultVisualState({})"));
assert.ok(runnerSource.includes('this.map.moveLayer("mental-map-question-feature-point-label")'));
assert.ok(challengeUiSource.includes("getMentalMapScoreLabel(evaluation)"));
assert.ok(challengeUiSource.includes("challenge.secondaryInstruction"));
assert.ok(challengeUiSource.includes("Total possible answers: ${challenge.correctStateIds.length}."));
assert.ok(challengeUiSource.includes("isMentalMapRecallAllChallenge(challenge)"));
assert.ok(challengeUiSource.includes('item.classList.add("is-removable")'));
assert.ok(challengeUiSource.includes('"mental-map-selected-choice"'));
assert.ok(challengeUiSource.includes("isSelected ? options.onRemove?.(answer.id) : options.onSelect?.(answer.id)"));
assert.ok(challengeUiSource.includes('choice.classList.toggle("is-selected", isSelected)'));
assert.ok(challengeUiSource.includes('choice.setAttribute("aria-pressed", String(isSelected))'));
assert.ok(cssSource.includes(".mental-map-selected-choice"));
assert.ok(cssSource.includes(".mental-map-answer-choice.is-selected"));
assert.ok(challengeUiSource.includes('handle.addEventListener("pointerdown"'));
assert.ok(challengeUiSource.includes('handle.addEventListener("mousedown"'));
assert.ok(challengeUiSource.includes("options.onReorder?.(fromIndex, dropIndex, stateId)"));
assert.ok(challengeUiSource.includes('item.dataset.mentalMapOrderIndex = String(index)'));
assert.ok(challengeUiSource.includes('number.textContent = `${index + 1}.`'));
assert.ok(challengeUiSource.includes('ariaLabel: `Move ${stateName(stateId)} up`'));
assert.ok(challengeUiSource.includes('ariaLabel: `Move ${stateName(stateId)} down`'));
assert.ok(challengeUiSource.includes('status.setAttribute("aria-live", "polite")'));
assert.ok(cssSource.includes(".mental-map-drag-handle"));
assert.ok(cssSource.includes("touch-action: none"));
assert.ok(cssSource.includes("min-width: 44px"));
assert.ok(challengeUiSource.includes("window.GeographyChipSpeech?.createChipSpeakerControl(labelText, options)"));
assert.ok(challengeUiSource.includes('"mental-map-question-speaker"'));
assert.ok(challengeUiSource.includes('"mental-map-answer-speaker"'));
assert.ok(challengeUiSource.includes("getMentalMapAudioEntry(challenge, role)"));
assert.ok(challengeUiSource.includes('"mental-map-instruction-speaker"'));
assert.ok(challengeUiSource.includes('"mental-map-explanation-speaker"'));
assert.ok(chipSpeechSource.includes('const audioMutedStorageKey = "atlasQuestAudioMuted"'));
assert.ok(chipSpeechSource.includes("if (isAudioMuted)"));
assert.ok(chipSpeechSource.includes("event.stopPropagation()"));
assert.ok(chipSpeechSource.includes('fallback: audioPath ? "" : "browser-speech"'));
assert.ok(!challengeUiSource.includes("OPENAI_API_KEY"));
assert.ok(!runtimeSource.includes("OPENAI_API_KEY"));
assert.ok(cssSource.includes(".mental-map-question-speaker.chip-speaker-button"));
assert.ok(cssSource.includes(".mental-map-answer-speaker.chip-speaker-button"));
assert.ok(challengeUiSource.includes("Correct - you found a shortest route."));
assert.ok(challengeUiSource.includes("Correct - your route works. A shorter route is possible."));
assert.ok(challengeUiSource.includes('evaluation.isBorderRoute && evaluation.isCorrect ? "Your valid route"'));
assert.ok(challengeUiSource.includes('createResultLine("Expected sequence"'));
assert.ok(challengeUiSource.includes('["incorrect", "Incorrect"]'));
assert.ok(challengeUiSource.includes('createResultLine("Incorrect", evaluation.selectedInvalidStateIds)'));
assert.ok(!challengeUiSource.includes('"Incorrect or unnecessary"'));
assert.ok(!challengeUiSource.includes('createResultLine("Unnecessary"'));
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
