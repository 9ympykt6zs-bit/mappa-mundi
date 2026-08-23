import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  adaptCanonicalMentalMapEvaluation,
  getCanonicalMentalMapConceptId
} from "../src/canonical-learning-evidence.js";
import {
  loadCanonicalEvidenceRepository,
  recordCanonicalEvidenceEvent
} from "../src/canonical-learning-evidence-repository.js";
import {
  buildMentalMapAnswerBank,
  evaluateMentalMapAnswer,
  getMentalMapResultVisualState
} from "../src/atlas/mental-map-challenge-engine.js";
import { getUnifiedMentalMapChallenges } from "../src/atlas/mental-map-challenge-registry.js";
import {
  getApprovedUnitedStatesAtlasRelationships,
  getUnitedStatesRelationshipChallenges,
  UNITED_STATES_RELATIONSHIP_TYPES,
  validateApprovedUnitedStatesAtlasRelationships
} from "../src/atlas/united-states-relationship-challenges.js";
import { applyProgressEvidencePolicy, USER_FACING_PROGRESS_SKILLS } from "../src/progress-evidence-policy.js";
import { createUnitedStatesProgressReportReadModel } from "../src/united-states-progress-report-read-path.js";
import { journeyPresets } from "../src/journey-presets.js";
import { buildRepositoryCoverage } from "./lib/us-content-coverage.mjs";

function createMemoryStorage() {
  const values = new Map();
  return {
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) { values.set(key, String(value)); },
    removeItem(key) { values.delete(key); }
  };
}

const relationships = getApprovedUnitedStatesAtlasRelationships();
assert.deepEqual(validateApprovedUnitedStatesAtlasRelationships(relationships), []);
assert.deepEqual(
  Object.fromEntries(Object.values(UNITED_STATES_RELATIONSHIP_TYPES).map((type) => [
    type,
    relationships.filter((relationship) => relationship.relationshipType === type).length
  ])),
  {
    "region-membership": 50,
    "international-border": 17,
    coast: 25,
    "river-through": 36,
    "major-lake-border": 13,
    "mountain-range": 61
  }
);

const challenges = getUnitedStatesRelationshipChallenges();
assert.equal(challenges.length, 152, "Every learner-facing non-region atlas edge must have one fixed retrieval question.");
assert.equal(new Set(challenges.map(({ canonicalConceptId }) => canonicalConceptId)).size, 152);
assert.equal(challenges.some(({ referenceStateId }) => referenceStateId === "district-of-columbia"), false);
assert.equal(
  challenges.some(({ relationshipType }) => relationshipType === UNITED_STATES_RELATIONSHIP_TYPES.REGION_MEMBERSHIP),
  false,
  "Census-region metadata must not generate learner-facing U.S. Connections questions."
);
assert.equal(challenges.some(({ prompt }) => /U\.S\. Census region/i.test(prompt)), false);
assert.deepEqual(
  Object.fromEntries(Object.values(UNITED_STATES_RELATIONSHIP_TYPES).map((type) => [
    type,
    challenges.filter((challenge) => challenge.relationshipType === type).length
  ])),
  {
    "region-membership": 0,
    "international-border": 17,
    coast: 25,
    "river-through": 36,
    "major-lake-border": 13,
    "mountain-range": 61
  }
);
assert.deepEqual(
  challenges.map(({ canonicalConceptId }) => canonicalConceptId),
  relationships
    .filter(({ relationshipType }) => relationshipType !== UNITED_STATES_RELATIONSHIP_TYPES.REGION_MEMBERSHIP)
    .map(({ conceptId }) => conceptId),
  "Excluding Census regions must not reorder or otherwise change retained learner-facing relationships."
);

const ohioCanada = challenges.find(({ canonicalConceptId }) => canonicalConceptId === "relationship:international-border:ohio:canada");
const floridaCoasts = challenges.filter(({ relationship }) => relationship.stateId === "florida" && relationship.relationshipType === "coast");
const ohioRiver = challenges.find(({ canonicalConceptId }) => canonicalConceptId === "relationship:river-through:ohio:ohio-river");
const ohioLake = challenges.find(({ canonicalConceptId }) => canonicalConceptId === "relationship:major-lake-border:ohio:lake-erie");
const coloradoRockies = challenges.find(({ canonicalConceptId }) => canonicalConceptId === "relationship:mountain-range:colorado:rocky-mountains");
assert.equal(ohioCanada.answerLabelsByStateId.ohio, "Canada");
assert.equal(ohioRiver.prompt, "Which major river flows through Ohio?");
assert.equal(ohioRiver.answerLabelsByStateId.ohio, "Ohio River");
assert.equal(ohioLake.prompt, "Which Great Lake borders Ohio?");
assert.equal(ohioLake.answerLabelsByStateId.ohio, "Lake Erie");
assert.equal(coloradoRockies.prompt, "Which mountain range is located in Colorado?");
assert.equal(coloradoRockies.answerLabelsByStateId.colorado, "Rocky Mountains");
assert.deepEqual(floridaCoasts.map(({ relationship }) => relationship.targetName).sort(), ["Atlantic Ocean", "Gulf of Mexico"]);
for (const challenge of floridaCoasts) {
  const labels = Object.values(challenge.answerLabelsByStateId);
  const otherTrueCoast = challenge.relationship.targetName === "Atlantic Ocean" ? "Gulf of Mexico" : "Atlantic Ocean";
  assert.equal(labels.includes(otherTrueCoast), false, "Another true Florida coast must never be an incorrect choice.");
}
for (const challenge of challenges) {
  const otherTrueTargets = relationships
    .filter(({ stateId, relationshipType, targetEntityId }) => (
      stateId === challenge.relationship.stateId
      && relationshipType === challenge.relationship.relationshipType
      && targetEntityId !== challenge.relationship.targetEntityId
    ))
    .map(({ targetName }) => targetName);
  const offeredLabels = Object.values(challenge.answerLabelsByStateId);
  assert.equal(otherTrueTargets.some((label) => offeredLabels.includes(label)), false, "Another true relationship must never be offered as incorrect.");
}
assert.ok(buildMentalMapAnswerBank(ohioCanada, { random: () => 0 }).some(({ id, name }) => id === "ohio" && name === "Canada"));
assert.equal(evaluateMentalMapAnswer(ohioCanada, ["ohio"]).isCorrect, true);
assert.equal(evaluateMentalMapAnswer(ohioCanada, [ohioCanada.distractorStateIds[0]]).isCorrect, false);

for (const [challenge, incorrectLabel] of [
  [ohioCanada, "Mexico"],
  [ohioRiver, "Arkansas River"],
  [coloradoRockies, "Adirondack Mountains"]
]) {
  const incorrectAnswerId = Object.entries(challenge.answerLabelsByStateId)
    .find(([, label]) => label === incorrectLabel)?.[0];
  assert.ok(incorrectAnswerId, `Expected an answer choice labeled ${incorrectLabel}.`);
  const visualState = getMentalMapResultVisualState(
    challenge,
    evaluateMentalMapAnswer(challenge, [incorrectAnswerId])
  );
  assert.deepEqual(visualState.referenceStateIds, [challenge.referenceStateId]);
  assert.deepEqual(visualState.selectedIncorrectStateIds, []);
  assert.deepEqual(visualState.learnerStateIds, []);
  assert.equal(visualState.contextStateIds.includes(incorrectAnswerId), false);
}

const evaluation = evaluateMentalMapAnswer(ohioCanada, ["ohio"]);
const event = adaptCanonicalMentalMapEvaluation({
  challenge: ohioCanada,
  evaluation,
  conceptId: getCanonicalMentalMapConceptId(ohioCanada),
  eventId: "us-relationship-ohio-canada-correct",
  attemptId: "us-relationship-attempt",
  occurredAt: "2036-06-01T12:00:00.000Z",
  sourceMode: "mental-map",
  sourceActivityId: ohioCanada.sourceActivityId
});
assert.equal(event.conceptId, "relationship:international-border:ohio:canada");
assert.equal(event.skillId, "relationship-recall");
assert.deepEqual(event.response.selectedEntityIds, ["country:canada"]);

const storage = createMemoryStorage();
assert.equal(recordCanonicalEvidenceEvent(event, storage).inserted, true);
assert.equal(recordCanonicalEvidenceEvent(event, storage).inserted, false, "One submitted action must count once.");
const repository = loadCanonicalEvidenceRepository(storage);
const policy = applyProgressEvidencePolicy(repository.events);
const history = policy.histories.find(({ conceptId }) => conceptId === event.conceptId);
assert.equal(history.progressSkillId, USER_FACING_PROGRESS_SKILLS.GEOGRAPHIC_RELATIONSHIPS);
assert.deepEqual([history.correctCount, history.incorrectCount], [1, 0]);
assert.equal(policy.decisions[0].sourceModeValidated, true);

const selected = createUnitedStatesProgressReportReadModel({
  items: [{ id: "state:ohio", type: "state", targetId: "ohio", label: "Ohio" }],
  repository,
  storage,
  now: () => new Date("2036-06-01T13:00:00.000Z")
});
assert.equal(selected.selection.path, "canonical-first");
const relationshipCategory = selected.report.categories.find(({ id }) => id === "geographic-relationships");
assert.ok(relationshipCategory, "Canonical relationship evidence should reveal the existing optional report category.");
const ohioRecord = relationshipCategory.records.find(({ itemId }) => itemId === "state:ohio");
assert.deepEqual([ohioRecord.evidenceHistory.correctCount, ohioRecord.evidenceHistory.incorrectCount], [1, 0]);
assert.ok(ohioRecord.canonicalMapping.conceptIds.includes(event.conceptId));

const ordinaryPool = getUnifiedMentalMapChallenges({ includeGenerated: false });
const connectionsPool = getUnifiedMentalMapChallenges({ includeGenerated: false, includeUnitedStatesRelationships: true });
const learnerFacingConnectionsPool = connectionsPool.filter(({ sourceActivityId }) => [
  "us-atlas-relationships",
  "us-state-capital-relationships"
].includes(sourceActivityId));
assert.equal(ordinaryPool.some(({ sourceActivityId }) => sourceActivityId === "us-atlas-relationships"), false);
assert.equal(connectionsPool.filter(({ sourceActivityId }) => sourceActivityId === "us-atlas-relationships").length, 152);
assert.equal(connectionsPool.filter(({ sourceActivityId }) => sourceActivityId === "us-state-capital-relationships").length, 100);
assert.equal(learnerFacingConnectionsPool.length, 252, "U.S. Connections must contain 252 retained prompt instances.");
assert.equal(new Set(learnerFacingConnectionsPool.map(({ canonicalConceptId }) => canonicalConceptId)).size, 202);
assert.equal(learnerFacingConnectionsPool.some(({ relationshipType }) => relationshipType === UNITED_STATES_RELATIONSHIP_TYPES.REGION_MEMBERSHIP), false);

const coverage = buildRepositoryCoverage();
const assessedPhysicalEntityIds = new Set(coverage.concepts
  .filter(({ kind, delivery }) => kind === "physical-feature" && delivery === "fixed-scored")
  .flatMap(({ entityIds }) => entityIds));
for (const relationship of relationships.filter(({ relationshipType }) => [
  UNITED_STATES_RELATIONSHIP_TYPES.RIVER_THROUGH,
  UNITED_STATES_RELATIONSHIP_TYPES.MAJOR_LAKE_BORDER,
  UNITED_STATES_RELATIONSHIP_TYPES.MOUNTAIN_RANGE
].includes(relationshipType))) {
  assert.ok(assessedPhysicalEntityIds.has(relationship.targetEntityId), "Physical relationship targets must already belong to the taught U.S. physical curriculum.");
}
for (const conceptId of [
  "relationship:international-border:ohio:canada",
  "relationship:coast:florida:atlantic-ocean",
  "relationship:river-through:ohio:ohio-river",
  "relationship:major-lake-border:ohio:lake-erie",
  "relationship:mountain-range:colorado:rocky-mountains"
]) {
  const concept = coverage.concepts.find(({ id }) => id === conceptId);
  assert.equal(concept.delivery, "fixed-scored");
  assert.equal(concept.sources.filter(({ type }) => type === "atlas-relationship").length, 1);
  assert.equal(concept.sources.filter(({ type }) => type === "mental-map-question").length, 1);
}
const ohioRegionCoverage = coverage.concepts.find(({ id }) => id === "relationship:region-membership:ohio:midwest");
assert.equal(ohioRegionCoverage.delivery, "data-only", "Census membership must remain reportable Atlas metadata without being assessed.");
assert.equal(ohioRegionCoverage.sources.filter(({ type }) => type === "atlas-relationship").length, 1);
assert.equal(ohioRegionCoverage.sources.filter(({ type }) => type === "mental-map-question").length, 0);
assert.equal(coverage.summary.statesWithAssessedCuratedRelationship, 50);
assert.equal(coverage.summary.statesWithNonCapitalContextual, 50);

const unitedStatesJourney = journeyPresets.find(({ id }) => id === "united-states");
assert.ok(unitedStatesJourney.steps.some(({ title }) => title === "New England States"));
assert.ok(unitedStatesJourney.steps.some(({ title }) => title === "Southern Plains / Southwest States"));

const expeditionSource = readFileSync(new URL("../src/across-united-states-expedition.js", import.meta.url), "utf8");
assert.doesNotMatch(expeditionSource, /Retrieve capitals, borders, coasts, regions/);

const runtimeSource = readFileSync(new URL("../src/maplibre-poc.js", import.meta.url), "utf8");
const indexSource = readFileSync(new URL("../index.html", import.meta.url), "utf8");
assert.match(indexSource, /main-menu-united-states-relationships-button/);
assert.match(indexSource, />U\.S\. Connections</);
assert.match(runtimeSource, /includeUnitedStatesRelationships: mentalMapUnitedStatesRelationshipsOnly/);
assert.match(runtimeSource, /"us-atlas-relationships"\s*\]\s*\.includes\(challenge\.sourceActivityId\)/);

console.log("I2 U.S. atlas relationship learning passed: 152 non-Census atlas relationships are assessed and 50 Census memberships remain data-only.");
