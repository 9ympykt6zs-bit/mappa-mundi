import assert from "node:assert/strict";
import fs from "node:fs";
import {
  buildCompassAnswerBank,
  clearCompassAnswers,
  createCompassChallengeState,
  evaluateCompassAnswer,
  getCompassResultVisualState,
  moveCompassAnswer,
  reorderCompassAnswers,
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
import {
  createMentalMapChallengeState,
  evaluateMentalMapAnswer,
  getMentalMapResultVisualState,
  selectMentalMapAnswer
} from "../src/atlas/mental-map-challenge-engine.js";
import { MENTAL_MAP_ANSWER_MODES } from "../src/atlas/mental-map-challenges.js";
import {
  getUnifiedMentalMapChallenges,
  MENTAL_MAP_CHALLENGE_CATEGORIES,
  selectNextUnifiedMentalMapChallenge,
  validateUnifiedMentalMapChallenge
} from "../src/atlas/mental-map-challenge-registry.js";
import { getMentalMapAudioEntry, getMentalMapAudioText, MENTAL_MAP_AUDIO_ROLES } from "../src/atlas/mental-map-audio.js";

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
    assert.equal(challenge.prompt, "Put these states in west-to-east order.");
    challenge.orderedStateIds.forEach((stateId) => {
      const stateName = stateFeatures.get(stateId)?.properties?.name || "";
      assert.equal(challenge.prompt.toLowerCase().includes(stateName.toLowerCase()), false, `${challenge.id} prompt reveals ${stateName}.`);
    });
    assert.notDeepEqual(bank.map((answer) => answer.id), challenge.orderedStateIds);
    const longitudes = challenge.orderedStateIds.map((stateId) => getStateCenter(stateId)[0]);
    assert.ok(longitudes.every((longitude, index) => index === 0 || longitude > longitudes[index - 1]));
  }
  if (challenge.questionType === COMPASS_QUESTION_TYPES.SINGLE_DIRECTION) {
    assert.ok(challenge.referenceStateId);
    assert.notEqual(challenge.referenceStateId, challenge.correctStateId);
    assert.equal(challenge.distractorStateIds.includes(challenge.referenceStateId), false);
    assert.equal(challenge.directionRelationships[0].fromStateId, challenge.referenceStateId);
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
assert.deepEqual(singleVisualState.referenceStateIds, ["arkansas"]);
assert.equal(singleVisualState.referenceStateIds.includes("oklahoma"), false);
assert.deepEqual(singleVisualState.directionArrows, [{ fromStateId: "arkansas", toStateId: "oklahoma" }]);
assert.deepEqual(singleVisualState.contextStateIds, ["arkansas", "oklahoma"]);
assert.equal(singleVisualState.routeRenderingMode, "feature-only");

const nevadaUtah = challenges.find((challenge) => challenge.id === "east-of-nevada");
const nevadaUtahEvaluation = evaluateCompassAnswer(nevadaUtah, ["utah"]);
const nevadaUtahVisualState = getCompassResultVisualState(nevadaUtah, nevadaUtahEvaluation);
assert.deepEqual(nevadaUtahVisualState.referenceStateIds, ["nevada"]);
assert.deepEqual(nevadaUtahVisualState.correctStateIds, ["utah"]);
assert.deepEqual(nevadaUtahVisualState.contextStateIds, ["nevada", "utah"]);
assert.deepEqual(nevadaUtahVisualState.directionArrows, [{ fromStateId: "nevada", toStateId: "utah" }]);

const incorrectNevadaUtahEvaluation = evaluateCompassAnswer(nevadaUtah, ["arizona"]);
const incorrectNevadaUtahVisualState = getCompassResultVisualState(nevadaUtah, incorrectNevadaUtahEvaluation);
assert.deepEqual(incorrectNevadaUtahVisualState.selectedIncorrectStateIds, ["arizona"]);
assert.deepEqual(incorrectNevadaUtahVisualState.referenceStateIds, ["nevada"]);
assert.deepEqual(incorrectNevadaUtahVisualState.correctStateIds, ["utah"]);

const relativeVisualChallenge = challenges.find(({ questionType }) => questionType === COMPASS_QUESTION_TYPES.RELATIVE_POSITION);
const relativeEvaluation = evaluateCompassAnswer(relativeVisualChallenge, [relativeVisualChallenge.correctStateId]);
const relativeVisualState = getCompassResultVisualState(relativeVisualChallenge, relativeEvaluation);
assert.equal(relativeVisualState.directionArrows.length, 2, "Relative-position feedback should show both directional relationships.");
assert.deepEqual(relativeVisualState.referenceStateIds, relativeVisualChallenge.referenceStateIds);
assert.equal(relativeVisualState.referenceStateIds.includes(relativeVisualChallenge.correctStateId), false);
relativeVisualChallenge.referenceStateIds.forEach((stateId) => {
  assert.ok(relativeVisualState.contextStateIds.includes(stateId), `Camera context should include reference state ${stateId}.`);
});
assert.ok(relativeVisualState.contextStateIds.includes(relativeVisualChallenge.correctStateId), "Camera context should include the answer state.");

const incorrectRelativeEvaluation = evaluateCompassAnswer(relativeVisualChallenge, [relativeVisualChallenge.distractorStateIds[0]]);
const incorrectRelativeVisualState = getCompassResultVisualState(relativeVisualChallenge, incorrectRelativeEvaluation);
assert.deepEqual(incorrectRelativeVisualState.selectedIncorrectStateIds, [relativeVisualChallenge.distractorStateIds[0]]);
assert.deepEqual(incorrectRelativeVisualState.correctStateIds, [relativeVisualChallenge.correctStateId]);
assert.deepEqual(incorrectRelativeVisualState.referenceStateIds, relativeVisualChallenge.referenceStateIds);

const relative = challenges.find((challenge) => challenge.id === "west-tennessee-north-louisiana");
assert.equal(evaluateCompassAnswer(relative, ["arkansas"]).isCorrect, true);
assert.equal(evaluateCompassAnswer(relative, ["missouri"]).isCorrect, false);

const ordered = challenges.find((challenge) => challenge.id === "southwest-west-to-east");
const unchangedCorrectOrder = [...ordered.orderedStateIds];
let orderedState = createCompassChallengeState(ordered, { random: () => 0.62 });
const initialOrderedBankIds = orderedState.answerBank.map(({ id }) => id);
assert.notDeepEqual(initialOrderedBankIds, ordered.orderedStateIds);
assert.deepEqual(new Set(initialOrderedBankIds), new Set(ordered.orderedStateIds));
["california", "utah", "nevada", "colorado"].forEach((stateId) => {
  orderedState = selectCompassAnswer(orderedState, stateId);
});
assert.deepEqual(orderedState.answerBank.map(({ id }) => id), initialOrderedBankIds, "Selecting answers must not reshuffle the bank.");
assert.equal(evaluateCompassAnswer(ordered, orderedState.selectedStateIds).feedback, "partial");
orderedState = reorderCompassAnswers(orderedState, 2, 1);
assert.deepEqual(orderedState.selectedStateIds, ordered.orderedStateIds);
assert.equal(evaluateCompassAnswer(ordered, orderedState.selectedStateIds).isCorrect, true);
assert.deepEqual(ordered.orderedStateIds, unchangedCorrectOrder, "Editing an answer must not mutate the internal correct order.");
orderedState = moveCompassAnswer(orderedState, "nevada", "down");
assert.deepEqual(orderedState.selectedStateIds, ["california", "utah", "nevada", "colorado"]);
orderedState = moveCompassAnswer(orderedState, "nevada", "up");
assert.deepEqual(orderedState.selectedStateIds, ordered.orderedStateIds, "Keyboard-style movement should restore the correct order.");
const unchanged = moveCompassAnswer(orderedState, "california", "up");
assert.deepEqual(unchanged.selectedStateIds, orderedState.selectedStateIds);
assert.deepEqual(reorderCompassAnswers(orderedState, -1, 2).selectedStateIds, orderedState.selectedStateIds);
orderedState = removeCompassAnswer(orderedState, "utah");
assert.equal(orderedState.selectedStateIds.includes("utah"), false);
assert.deepEqual(orderedState.answerBank.map(({ id }) => id), initialOrderedBankIds, "Removing an answer must not reshuffle the bank.");
orderedState = undoCompassAnswer(orderedState);
assert.equal(orderedState.selectedStateIds.length, 2);
orderedState = clearCompassAnswers(orderedState);
assert.deepEqual(orderedState.selectedStateIds, []);
assert.deepEqual(orderedState.answerBank.map(({ id }) => id), initialOrderedBankIds, "Clearing answers must not reshuffle the bank.");

const runtimeSource = fs.readFileSync("src/maplibre-poc.js", "utf8");
const runnerSource = fs.readFileSync("src/maplibre/maplibre-activity-runner.js", "utf8");
const uiSource = fs.readFileSync("src/atlas/compass-challenge-ui.js", "utf8");
const sharedUiSource = fs.readFileSync("src/atlas/mental-map-challenge-ui.js", "utf8");
const cssSource = fs.readFileSync("maplibre-poc.css", "utf8");
const markupSource = fs.readFileSync("index.html", "utf8");
const previewMarkupSource = fs.readFileSync("maplibre-poc.html", "utf8");
assert.equal((markupSource.match(/id="main-menu-mental-map-challenge-button"/g) || []).length, 1);
assert.equal((previewMarkupSource.match(/id="main-menu-mental-map-challenge-button"/g) || []).length, 1);
assert.ok(!markupSource.includes('id="main-menu-compass-challenge-button"'));
assert.ok(!previewMarkupSource.includes('id="main-menu-compass-challenge-button"'));
assert.ok(!markupSource.includes('id="compass-challenge-panel"'));
assert.ok(!previewMarkupSource.includes('id="compass-challenge-panel"'));
assert.ok(runtimeSource.includes("return openMentalMapChallenge();"));
assert.ok(!runtimeSource.includes('currentAppScreen = "compass-challenge"'));
assert.ok(!runtimeSource.includes("renderCompassChallenge"));
assert.ok(runtimeSource.includes('mapElement.setAttribute("aria-hidden", "true")'));
assert.ok(cssSource.includes("body.compass-challenge-mode:not(.compass-result-mode) #map"));
assert.ok(runnerSource.includes("prepareCompassChallenge()"));
assert.ok(runnerSource.includes("enterCompassChallengeResult(options = {})"));
assert.ok(runnerSource.includes('this.setCompassChallengeDirectionArrow(options.visualState?.directionArrows || [])'));
assert.ok(runnerSource.includes('["mental-map-challenge-result", "compass-challenge-result"].includes(this.currentView)'));
assert.ok(runnerSource.includes('id: "compass-challenge-direction-line"'));
assert.ok(runnerSource.includes('id: "compass-challenge-direction-head"'));
assert.ok(runnerSource.includes("this.usStatesAtlas?.features?.find"));
assert.ok(uiSource.includes('status.textContent = evaluation.feedback === "correct"'));
assert.ok(uiSource.includes('["reference", "Reference state"]'));
assert.ok(uiSource.includes("attachOrderedAnswerDrag"));
assert.ok(uiSource.includes('createButton("Drag"'));
assert.ok(runtimeSource.includes("onReorder: (fromIndex, toIndex, stateId)"));
assert.ok(cssSource.includes(".mental-map-result-reference"));
assert.ok(!uiSource.includes("score"));

const unifiedChallenges = getUnifiedMentalMapChallenges({ includeGenerated: false, random: () => 0 });
assert.equal(new Set(unifiedChallenges.map(({ id }) => id)).size, unifiedChallenges.length);
challenges.forEach((challenge) => {
  const matches = unifiedChallenges.filter(({ id }) => id === challenge.id);
  assert.equal(matches.length, 1, `${challenge.id} should appear once in the unified registry.`);
  assert.deepEqual(validateUnifiedMentalMapChallenge(matches[0]), []);
});

const mergedSingle = unifiedChallenges.find(({ id }) => id === "east-of-nevada");
assert.equal(mergedSingle.answerMode, MENTAL_MAP_ANSWER_MODES.SINGLE_SELECT);
assert.equal(mergedSingle.category, MENTAL_MAP_CHALLENGE_CATEGORIES.CARDINAL_DIRECTION);
let mergedSingleState = createMentalMapChallengeState(mergedSingle, { random: () => 0 });
mergedSingleState = selectMentalMapAnswer(mergedSingleState, "arizona");
mergedSingleState = selectMentalMapAnswer(mergedSingleState, "utah");
assert.deepEqual(mergedSingleState.selectedStateIds, ["utah"]);
const mergedSingleEvaluation = evaluateMentalMapAnswer(mergedSingle, mergedSingleState.selectedStateIds);
assert.equal(mergedSingleEvaluation.isCorrect, true);
const mergedSingleVisual = getMentalMapResultVisualState(mergedSingle, mergedSingleEvaluation);
assert.deepEqual(mergedSingleVisual.referenceStateIds, ["nevada"]);
assert.deepEqual(mergedSingleVisual.directionArrows, [{ fromStateId: "nevada", toStateId: "utah" }]);

const mergedRelative = unifiedChallenges.find(({ id }) => id === "south-virginia-east-tennessee");
assert.equal(mergedRelative.category, MENTAL_MAP_CHALLENGE_CATEGORIES.RELATIVE_POSITION);
const mergedRelativeVisual = getMentalMapResultVisualState(
  mergedRelative,
  evaluateMentalMapAnswer(mergedRelative, ["north-carolina"])
);
assert.deepEqual(mergedRelativeVisual.referenceStateIds, ["virginia", "tennessee"]);
assert.equal(mergedRelativeVisual.directionArrows.length, 2);

const mergedOrdering = unifiedChallenges.find(({ id }) => id === "northern-us-west-to-east");
assert.equal(mergedOrdering.answerMode, MENTAL_MAP_ANSWER_MODES.ORDERED_SEQUENCE);
assert.equal(mergedOrdering.category, MENTAL_MAP_CHALLENGE_CATEGORIES.DIRECTIONAL_ORDERING);
assert.ok(mergedOrdering.orderedStateIds.every((stateId) => !mergedOrdering.prompt.toLowerCase().includes(stateFeatures.get(stateId).properties.name.toLowerCase())));
assert.equal(evaluateMentalMapAnswer(mergedOrdering, mergedOrdering.orderedStateIds).isCorrect, true);
assert.equal(getMentalMapResultVisualState(
  mergedOrdering,
  evaluateMentalMapAnswer(mergedOrdering, mergedOrdering.orderedStateIds)
).directionArrows.length, 1);

assert.equal(getMentalMapAudioText(mergedSingle, MENTAL_MAP_AUDIO_ROLES.QUESTION), mergedSingle.prompt);
assert.equal(getMentalMapAudioEntry(mergedSingle, MENTAL_MAP_AUDIO_ROLES.QUESTION), null);
assert.ok(sharedUiSource.includes("window.GeographyChipSpeech?.createChipSpeakerControl"));
assert.ok(sharedUiSource.includes('["reference", "Reference state"]'));
assert.ok(sharedUiSource.includes('["direction", "Correct direction"]'));

const malformed = { id: "malformed", category: "cardinal-direction" };
const selectedWithoutMalformed = selectNextUnifiedMentalMapChallenge([malformed, mergedSingle], { random: () => 0 });
assert.equal(selectedWithoutMalformed.id, mergedSingle.id);

let usedQuestionIds = new Set();
let lastQuestionId = "";
let lastCategory = "";
let recentAnswerModes = [];
for (let index = 0; index < 12; index += 1) {
  let next = selectNextUnifiedMentalMapChallenge(unifiedChallenges, {
    usedQuestionIds,
    lastQuestionId,
    lastCategory,
    recentAnswerModes,
    random: () => 0
  });
  if (!next) {
    usedQuestionIds = new Set();
    next = selectNextUnifiedMentalMapChallenge(unifiedChallenges, {
      usedQuestionIds,
      lastQuestionId,
      lastCategory,
      recentAnswerModes,
      random: () => 0
    });
  }
  assert.ok(next);
  assert.notEqual(next.id, lastQuestionId);
  if (lastCategory) assert.notEqual(next.category, lastCategory);
  if (recentAnswerModes.slice(-2).includes(MENTAL_MAP_ANSWER_MODES.ORDERED_SEQUENCE)) {
    assert.notEqual(next.answerMode, MENTAL_MAP_ANSWER_MODES.ORDERED_SEQUENCE);
  }
  usedQuestionIds.add(next.id);
  lastQuestionId = next.id;
  lastCategory = next.category;
  recentAnswerModes = [...recentAnswerModes, next.answerMode].slice(-2);
}

console.log("Compass infrastructure and Mental Map consolidation validation passed:", JSON.stringify({
  challenges: challenges.length,
  unifiedChallenges: unifiedChallenges.length,
  questionTypes: Object.values(COMPASS_QUESTION_TYPES)
}));
