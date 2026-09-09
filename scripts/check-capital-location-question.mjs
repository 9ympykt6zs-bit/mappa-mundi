import assert from "node:assert/strict";
import {
  createCapitalLocationQuestionState,
  getCapitalLocationQuestionChoice,
  getCapitalLocationQuestionGeoJson
} from "../src/maplibre/capital-location-question.js";

const capitalTargets = [
  { id: "baton-rouge-la", type: "capital", city: "Baton Rouge", lon: -91.2, lat: 30.45 },
  { id: "providence-ri", type: "capital", city: "Providence", lon: -71.4128, lat: 41.824 },
  { id: "dover-de", type: "capital", city: "Dover", lon: -75.5196, lat: 39.1573 },
  { id: "phoenix-az", type: "capital", city: "Phoenix", lon: -112.097, lat: 33.448 }
];

const answering = createCapitalLocationQuestionState({
  capitalTargets,
  targetId: "baton-rouge-la"
});
assert.equal(answering.choices.length, 150);
assert.equal(new Set(answering.choices.map(({ id }) => id)).size, 150);
assert.deepEqual(answering.choices.filter(({ stateId }) => stateId === "louisiana").map(({ name }) => name), [
  "Baton Rouge", "New Orleans", "Shreveport"
]);
assert.equal(answering.choices.every(({ revealLabel, revealCapital, isSelected }) => (
  !revealLabel && !revealCapital && !isSelected
)), true);
assert.deepEqual(getCapitalLocationQuestionChoice(answering, "baton-rouge-la"), {
  id: "baton-rouge-la", stateId: "louisiana", stateName: "Louisiana", name: "Baton Rouge",
  lon: -91.2, lat: 30.45, role: "capital", choiceIndex: 0, inTargetState: true,
  revealLabel: false, revealCapital: false, isSelected: false, isInteractive: true, isTeaching: false
});

const shreveport = answering.choices.find(({ name, stateId }) => name === "Shreveport" && stateId === "louisiana");
const feedback = createCapitalLocationQuestionState({
  capitalTargets,
  targetId: "baton-rouge-la",
  phase: "feedback",
  selectedChoiceId: shreveport.id
});
assert.deepEqual(feedback.choices.filter(({ revealLabel }) => revealLabel).map(({ name }) => name), [
  "Baton Rouge", "New Orleans", "Shreveport"
]);
assert.equal(feedback.choices.find(({ id }) => id === "baton-rouge-la").revealCapital, true);
assert.equal(feedback.choices.find(({ id }) => id === shreveport.id).isSelected, true);

const wrongStateChoice = answering.choices.find(({ name, stateId }) => name === "Houston" && stateId === "texas");
const wrongState = createCapitalLocationQuestionState({
  capitalTargets,
  targetId: "baton-rouge-la",
  phase: "feedback",
  selectedChoiceId: wrongStateChoice.id
});
assert.equal(wrongState.choices.filter(({ revealLabel }) => revealLabel).length, 4);
assert.equal(wrongState.choices.find(({ id }) => wrongStateChoice.id === id).revealLabel, true);
assert.equal(wrongState.choices.filter(({ revealCapital }) => revealCapital).length, 1);

const teaching = createCapitalLocationQuestionState({
  capitalTargets,
  targetId: "providence-ri",
  phase: "teaching",
  scope: "target-state",
  interaction: "capital-only"
});
assert.equal(teaching.choices.length, 3);
assert.equal(teaching.scope, "target-state");
assert.equal(teaching.interaction, "capital-only");
assert.deepEqual(teaching.choices.map(({ name }) => name), ["Providence", "Cranston", "Warwick"]);
assert.equal(teaching.choices.every(({ revealLabel }) => revealLabel), true);
assert.deepEqual(teaching.choices.filter(({ revealCapital }) => revealCapital).map(({ name }) => name), ["Providence"]);
assert.deepEqual(teaching.choices.filter(({ isInteractive }) => isInteractive).map(({ name }) => name), ["Providence"]);
assert.deepEqual(getCapitalLocationQuestionGeoJson(teaching).features.map(({ properties }) => properties.capitalLocationInteractive), [true, false, false]);
assert.equal(teaching.choices.every(({ isTeaching }) => isTeaching), true);
assert.equal(getCapitalLocationQuestionGeoJson(answering).features.every(({ properties }) => properties.capitalLocationTeaching === false), true);

for (const targetId of ["providence-ri", "dover-de", "phoenix-az", "juneau-ak", "austin-tx"]) {
  const question = createCapitalLocationQuestionState({ capitalTargets, targetId });
  assert.equal(question.choices.filter(({ inTargetState }) => inTargetState).length, 3);
  assert.equal(question.choices.filter(({ stateId }) => (
    stateId === question.targetStateId
  )).every(({ lon, lat }) => Number.isFinite(lon) && Number.isFinite(lat)), true);
}

assert.deepEqual(
  answering.choices.filter(({ stateId }) => stateId === "rhode-island").map(({ name }) => name),
  ["Providence", "Cranston", "Warwick"]
);
assert.deepEqual(
  answering.choices.filter(({ stateId }) => stateId === "delaware").map(({ name }) => name),
  ["Dover", "Wilmington", "Newark"]
);
assert.deepEqual(
  answering.choices.filter(({ stateId }) => stateId === "arizona").map(({ name }) => name),
  ["Phoenix", "Tucson", "Mesa"]
);
const longitudeSpan = (stateId) => {
  const longitudes = answering.choices.filter(({ stateId: id }) => id === stateId).map(({ lon }) => lon);
  return Math.max(...longitudes) - Math.min(...longitudes);
};
assert.ok(longitudeSpan("alaska") > 10);
assert.ok(longitudeSpan("texas") > 2);

const geoJson = getCapitalLocationQuestionGeoJson(feedback);
assert.equal(geoJson.features.length, 150);
assert.equal(geoJson.features.every(({ properties }) => properties.capitalLocationChoice === true), true);
assert.equal(geoJson.features.some(({ properties }) => (
  "conceptId" in properties || "targetId" in properties || "population2020" in properties
)), false);
assert.equal(createCapitalLocationQuestionState({ targetId: "unknown" }), null);

console.log("Capital-location question checks passed: 150 identical pre-answer choices, authored target coordinates, target/wrong-state feedback, small-state data, and no evidence identities.");
