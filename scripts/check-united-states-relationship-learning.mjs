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
  evaluateMentalMapAnswer
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
  { "region-membership": 50, "international-border": 17, coast: 25 }
);

const challenges = getUnitedStatesRelationshipChallenges();
assert.equal(challenges.length, 92, "Every approved atlas edge must have one fixed retrieval question.");
assert.equal(new Set(challenges.map(({ canonicalConceptId }) => canonicalConceptId)).size, 92);
assert.equal(challenges.some(({ referenceStateId }) => referenceStateId === "district-of-columbia"), false);

const ohioRegion = challenges.find(({ canonicalConceptId }) => canonicalConceptId === "relationship:region-membership:ohio:midwest");
const ohioCanada = challenges.find(({ canonicalConceptId }) => canonicalConceptId === "relationship:international-border:ohio:canada");
const floridaCoasts = challenges.filter(({ relationship }) => relationship.stateId === "florida" && relationship.relationshipType === "coast");
assert.equal(ohioRegion.prompt, "Which U.S. Census region includes Ohio?");
assert.equal(ohioRegion.answerLabelsByStateId.ohio, "Midwest");
assert.equal(ohioCanada.answerLabelsByStateId.ohio, "Canada");
assert.deepEqual(floridaCoasts.map(({ relationship }) => relationship.targetName).sort(), ["Atlantic Ocean", "Gulf of Mexico"]);
for (const challenge of floridaCoasts) {
  const labels = Object.values(challenge.answerLabelsByStateId);
  const otherTrueCoast = challenge.relationship.targetName === "Atlantic Ocean" ? "Gulf of Mexico" : "Atlantic Ocean";
  assert.equal(labels.includes(otherTrueCoast), false, "Another true Florida coast must never be an incorrect choice.");
}
assert.ok(buildMentalMapAnswerBank(ohioRegion, { random: () => 0 }).some(({ id, name }) => id === "ohio" && name === "Midwest"));
assert.equal(evaluateMentalMapAnswer(ohioRegion, ["ohio"]).isCorrect, true);
assert.equal(evaluateMentalMapAnswer(ohioRegion, [ohioRegion.distractorStateIds[0]]).isCorrect, false);

const evaluation = evaluateMentalMapAnswer(ohioRegion, ["ohio"]);
const event = adaptCanonicalMentalMapEvaluation({
  challenge: ohioRegion,
  evaluation,
  conceptId: getCanonicalMentalMapConceptId(ohioRegion),
  eventId: "us-relationship-ohio-midwest-correct",
  attemptId: "us-relationship-attempt",
  occurredAt: "2036-06-01T12:00:00.000Z",
  sourceMode: "mental-map",
  sourceActivityId: ohioRegion.sourceActivityId
});
assert.equal(event.conceptId, "relationship:region-membership:ohio:midwest");
assert.equal(event.skillId, "relationship-recall");
assert.deepEqual(event.response.selectedEntityIds, ["region:midwest"]);

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
assert.equal(ordinaryPool.some(({ sourceActivityId }) => sourceActivityId === "us-atlas-relationships"), false);
assert.equal(connectionsPool.filter(({ sourceActivityId }) => sourceActivityId === "us-atlas-relationships").length, 92);
assert.equal(connectionsPool.filter(({ sourceActivityId }) => sourceActivityId === "us-state-capital-relationships").length, 100);

const coverage = buildRepositoryCoverage();
for (const conceptId of [
  "relationship:region-membership:ohio:midwest",
  "relationship:international-border:ohio:canada",
  "relationship:coast:florida:atlantic-ocean"
]) {
  const concept = coverage.concepts.find(({ id }) => id === conceptId);
  assert.equal(concept.delivery, "fixed-scored");
  assert.equal(concept.sources.filter(({ type }) => type === "atlas-relationship").length, 1);
  assert.equal(concept.sources.filter(({ type }) => type === "mental-map-question").length, 1);
}
assert.equal(coverage.summary.statesWithAssessedCuratedRelationship, 50);
assert.equal(coverage.summary.statesWithNonCapitalContextual, 50);

const runtimeSource = readFileSync(new URL("../src/maplibre-poc.js", import.meta.url), "utf8");
const indexSource = readFileSync(new URL("../index.html", import.meta.url), "utf8");
assert.match(indexSource, /main-menu-united-states-relationships-button/);
assert.match(indexSource, />U\.S\. Connections</);
assert.match(runtimeSource, /includeUnitedStatesRelationships: mentalMapUnitedStatesRelationshipsOnly/);
assert.match(runtimeSource, /"us-atlas-relationships"\s*\]\s*\.includes\(challenge\.sourceActivityId\)/);

console.log("I2 U.S. atlas relationship learning passed: 50 regions, 17 borders, and 25 coasts are assessed.");
