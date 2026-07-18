import assert from "node:assert/strict";
import fs from "node:fs";
import {
  buildMentalMapAnswerBank,
  clearMentalMapAnswers,
  createMentalMapChallengeState,
  evaluateMentalMapAnswer,
  getMentalMapRequiredStateIds,
  getMentalMapResultVisualState,
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

const mexico = byId.get("mexico-land-border-all");
assert.equal(evaluateMentalMapAnswer(mexico, [...mexico.correctStateIds].reverse()).isCorrect, true);
const mexicoMissing = evaluateMentalMapAnswer(mexico, mexico.correctStateIds.slice(1));
assert.deepEqual(mexicoMissing.missingStateIds, [mexico.correctStateIds[0]]);
const mexicoExtra = evaluateMentalMapAnswer(mexico, [...mexico.correctStateIds, "utah"]);
assert.deepEqual(mexicoExtra.unnecessaryStateIds, ["utah"]);
const mexicoMixed = evaluateMentalMapAnswer(mexico, [...mexico.correctStateIds.slice(1), "utah"]);
assert.ok(mexicoMixed.missingStateIds.length === 1 && mexicoMixed.unnecessaryStateIds.length === 1);

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
const reset = createMentalMapChallengeState(pacific, { random: () => 0.9 });
assert.equal(reset.phase, "answering");
assert.deepEqual(reset.selectedStateIds, []);
assert.equal(reset.evaluation, null);

const runtimeSource = fs.readFileSync("src/maplibre-poc.js", "utf8");
const runnerSource = fs.readFileSync("src/maplibre/maplibre-activity-runner.js", "utf8");
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
assert.ok(!runtimeSource.includes("function selectBorderChainState(stateId)"));

console.log("Mental Map Challenge validation passed:", JSON.stringify({
  staticChallenges: challenges.length,
  generatedChallengeId: generated.id,
  pacificEligibleStates: pacific.correctStateIds.length,
  canadaBorderStates: byId.get("canada-contiguous-land-border-all").correctStateIds.length
}));
