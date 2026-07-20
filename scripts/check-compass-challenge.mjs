import assert from "node:assert/strict";
import fs from "node:fs";
import {
  buildCompassAnswerBank,
  clearCompassAnswers,
  createCompassChallengeState,
  evaluateCompassAnswer,
  getCompassResultVisualState,
  moveCompassAnswer,
  removeCompassAnswer,
  selectCompassAnswer,
  submitCompassAnswer,
  undoCompassAnswer
} from "../src/atlas/compass-challenge-engine.js";
import {
  COMPASS_QUESTION_TYPES,
  getCompassChallenges,
  validateCompassChallenge
} from "../src/atlas/compass-challenges.js";

const statesGeoJson = JSON.parse(
  fs.readFileSync("assets/maps/data/maplibre-us-states-atlas.geojson", "utf8").replace(/^\uFEFF/, "")
);
const stateFeatures = new Map(statesGeoJson.features.map((feature) => [feature.properties.id, feature]));

function visitCoordinates(value, visitor) {
  if (!Array.isArray(value)) return;
  if (value.length >= 2 && Number.isFinite(value[0]) && Number.isFinite(value[1])) {
    visitor(value);
    return;
  }
  value.forEach((child) => visitCoordinates(child, visitor));
}

function getStateCenter(stateId) {
  const bounds = [Infinity, Infinity, -Infinity, -Infinity];
  visitCoordinates(stateFeatures.get(stateId)?.geometry?.coordinates, ([longitude, latitude]) => {
    bounds[0] = Math.min(bounds[0], longitude);
    bounds[1] = Math.min(bounds[1], latitude);
    bounds[2] = Math.max(bounds[2], longitude);
    bounds[3] = Math.max(bounds[3], latitude);
  });
  assert.ok(bounds.every(Number.isFinite), `Missing geometry for ${stateId}.`);
  return [(bounds[0] + bounds[2]) / 2, (bounds[1] + bounds[3]) / 2];
}

const challenges = getCompassChallenges();
assert.equal(challenges.length, 9);
Object.values(COMPASS_QUESTION_TYPES).forEach((questionType) => {
  assert.equal(challenges.filter((challenge) => challenge.questionType === questionType).length, 3);
});

challenges.forEach((challenge) => {
  assert.deepEqual(validateCompassChallenge(challenge), []);
  const bank = buildCompassAnswerBank(challenge, { random: () => 0 });
  const answerIds = challenge.orderedStateIds || [challenge.correctStateId];
  answerIds.forEach((stateId) => assert.ok(bank.some((answer) => answer.id === stateId)));
  assert.equal(new Set(bank.map((answer) => answer.id)).size, bank.length);
  if (challenge.questionType === COMPASS_QUESTION_TYPES.WEST_TO_EAST) {
    assert.notDeepEqual(bank.map((answer) => answer.id), challenge.orderedStateIds);
    const longitudes = challenge.orderedStateIds.map((stateId) => getStateCenter(stateId)[0]);
    assert.ok(longitudes.every((longitude, index) => index === 0 || longitude > longitudes[index - 1]));
  }
  (challenge.directionRelationships || []).forEach((relationship) => {
    const from = getStateCenter(relationship.fromStateId);
    const to = getStateCenter(relationship.toStateId);
    const agrees = {
      east: to[0] > from[0],
      west: to[0] < from[0],
      north: to[1] > from[1],
      south: to[1] < from[1]
    }[relationship.direction];
    assert.equal(agrees, true, `${challenge.id} has an invalid ${relationship.direction} relationship.`);
  });
});

const single = challenges.find((challenge) => challenge.id === "west-of-arkansas");
let singleState = createCompassChallengeState(single, { random: () => 0.4 });
assert.equal(singleState.phase, "answering");
assert.equal(singleState.evaluation, null);
assert.equal("correctStateId" in singleState, false);
assert.equal(singleState.answerBank.some((answer) => "isCorrect" in answer), false);
singleState = selectCompassAnswer(singleState, "louisiana");
assert.equal(evaluateCompassAnswer(single, singleState.selectedStateIds).feedback, "incorrect");
singleState = selectCompassAnswer(singleState, "oklahoma");
assert.deepEqual(singleState.selectedStateIds, ["oklahoma"]);
singleState = submitCompassAnswer(singleState, single);
assert.equal(singleState.evaluation.feedback, "correct");
const singleVisualState = getCompassResultVisualState(single, singleState.evaluation);
assert.deepEqual(singleVisualState.correctStateIds, ["oklahoma"]);
assert.deepEqual(singleVisualState.directionArrows, [{ fromStateId: "arkansas", toStateId: "oklahoma" }]);
assert.deepEqual(singleVisualState.contextStateIds, ["arkansas", "oklahoma"]);
assert.equal(singleVisualState.routeRenderingMode, "feature-only");

const relativeVisualChallenge = challenges.find(({ questionType }) => questionType === COMPASS_QUESTION_TYPES.RELATIVE_POSITION);
const relativeEvaluation = evaluateCompassAnswer(relativeVisualChallenge, [relativeVisualChallenge.correctStateId]);
const relativeVisualState = getCompassResultVisualState(relativeVisualChallenge, relativeEvaluation);
assert.equal(relativeVisualState.directionArrows.length, 2, "Relative-position feedback should show both directional relationships.");

const relative = challenges.find((challenge) => challenge.id === "west-tennessee-north-louisiana");
assert.equal(evaluateCompassAnswer(relative, ["arkansas"]).isCorrect, true);
assert.equal(evaluateCompassAnswer(relative, ["missouri"]).isCorrect, false);

const ordered = challenges.find((challenge) => challenge.id === "southwest-west-to-east");
let orderedState = createCompassChallengeState(ordered, { random: () => 0.62 });
["california", "utah", "nevada", "colorado"].forEach((stateId) => {
  orderedState = selectCompassAnswer(orderedState, stateId);
});
assert.equal(evaluateCompassAnswer(ordered, orderedState.selectedStateIds).feedback, "partial");
orderedState = moveCompassAnswer(orderedState, "nevada", "up");
assert.deepEqual(orderedState.selectedStateIds, ordered.orderedStateIds);
assert.equal(evaluateCompassAnswer(ordered, orderedState.selectedStateIds).isCorrect, true);
const unchanged = moveCompassAnswer(orderedState, "california", "up");
assert.deepEqual(unchanged.selectedStateIds, orderedState.selectedStateIds);
orderedState = removeCompassAnswer(orderedState, "utah");
assert.equal(orderedState.selectedStateIds.includes("utah"), false);
orderedState = undoCompassAnswer(orderedState);
assert.equal(orderedState.selectedStateIds.length, 2);
orderedState = clearCompassAnswers(orderedState);
assert.deepEqual(orderedState.selectedStateIds, []);

const runtimeSource = fs.readFileSync("src/maplibre-poc.js", "utf8");
const runnerSource = fs.readFileSync("src/maplibre/maplibre-activity-runner.js", "utf8");
const uiSource = fs.readFileSync("src/atlas/compass-challenge-ui.js", "utf8");
const cssSource = fs.readFileSync("maplibre-poc.css", "utf8");
const markupSource = fs.readFileSync("index.html", "utf8");
assert.ok(markupSource.includes('id="main-menu-compass-challenge-button"'));
assert.ok(markupSource.includes('id="compass-challenge-panel"'));
assert.ok(runtimeSource.includes('currentAppScreen = "compass-challenge"'));
assert.ok(runtimeSource.includes('document.body.classList.add("compass-result-mode")'));
assert.ok(runtimeSource.includes('mapElement.setAttribute("aria-hidden", "true")'));
assert.ok(cssSource.includes("body.compass-challenge-mode:not(.compass-result-mode) #map"));
assert.ok(runnerSource.includes("prepareCompassChallenge()"));
assert.ok(runnerSource.includes("enterCompassChallengeResult(options = {})"));
assert.ok(runnerSource.includes('id: "compass-challenge-direction-line"'));
assert.ok(runnerSource.includes('id: "compass-challenge-direction-head"'));
assert.ok(runnerSource.includes("this.usStatesAtlas?.features?.find"));
assert.ok(uiSource.includes('status.textContent = evaluation.feedback === "correct"'));
assert.ok(!uiSource.includes("score"));

console.log("Compass Challenge validation passed:", JSON.stringify({
  challenges: challenges.length,
  questionTypes: Object.values(COMPASS_QUESTION_TYPES)
}));
