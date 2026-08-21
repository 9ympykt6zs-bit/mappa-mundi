import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

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
import {
  getStateCapitalRelationshipChallenges,
  getStateCapitalRelationshipPairs,
  STATE_CAPITAL_PROMPT_DIRECTIONS,
  validateStateCapitalRelationshipPairs
} from "../src/atlas/state-capital-relationship-challenges.js";
import { applyProgressEvidencePolicy, USER_FACING_PROGRESS_SKILLS } from "../src/progress-evidence-policy.js";
import { createUnitedStatesProgressReportReadModel } from "../src/united-states-progress-report-read-path.js";
import {
  createUnitedStatesMemoryTrailState,
  planUnitedStatesMemoryTrailSession
} from "../src/united-states-memory-trail-planner.js";
import { buildRepositoryCoverage } from "./lib/us-content-coverage.mjs";
import { loadUnitedStatesSimulationFixture } from "./lib/us-simulation-fixture.mjs";

function createMemoryStorage() {
  const values = new Map();
  return {
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) { values.set(key, String(value)); },
    removeItem(key) { values.delete(key); }
  };
}

const pairs = getStateCapitalRelationshipPairs();
assert.equal(pairs.length, 50, "The canonical atlas must yield exactly 50 state-capital relationships.");
assert.deepEqual(validateStateCapitalRelationshipPairs(pairs), []);
assert.equal(new Set(pairs.map(({ conceptId }) => conceptId)).size, 50);
assert.equal(pairs.some(({ stateId, capitalId }) => stateId === "district-of-columbia" || capitalId === "washington-dc"), false);

const challenges = getStateCapitalRelationshipChallenges();
assert.equal(challenges.length, 100, "Each relationship must support two prompt directions.");
assert.equal(new Set(challenges.map(({ canonicalConceptId }) => canonicalConceptId)).size, 50);
const ohioToColumbus = challenges.find(({ relationship, promptDirection }) => (
  relationship.stateId === "ohio" && promptDirection === STATE_CAPITAL_PROMPT_DIRECTIONS.STATE_TO_CAPITAL
));
const columbusToOhio = challenges.find(({ relationship, promptDirection }) => (
  relationship.stateId === "ohio" && promptDirection === STATE_CAPITAL_PROMPT_DIRECTIONS.CAPITAL_TO_STATE
));
assert.equal(ohioToColumbus.prompt, "What is the capital of Ohio?");
assert.equal(columbusToOhio.prompt, "Columbus is the capital of which state?");
assert.equal(ohioToColumbus.answerLabelsByStateId.ohio, "Columbus");
assert.equal(columbusToOhio.answerLabelsByStateId.ohio, "Ohio");
assert.equal(evaluateMentalMapAnswer(ohioToColumbus, ["ohio"]).isCorrect, true);
assert.equal(evaluateMentalMapAnswer(columbusToOhio, ["ohio"]).isCorrect, true);
assert.equal(evaluateMentalMapAnswer(ohioToColumbus, [ohioToColumbus.distractorStateIds[0]]).isCorrect, false);
assert.ok(buildMentalMapAnswerBank(ohioToColumbus, { random: () => 0 }).some(({ id, name }) => id === "ohio" && name === "Columbus"));
assert.equal(getCanonicalMentalMapConceptId(ohioToColumbus), "state-capital:ohio:columbus");
assert.equal(getCanonicalMentalMapConceptId(columbusToOhio), "state-capital:ohio:columbus");

function eventFor(challenge, selectedStateId, eventId, occurredAt) {
  const evaluation = evaluateMentalMapAnswer(challenge, [selectedStateId]);
  return adaptCanonicalMentalMapEvaluation({
    challenge,
    evaluation,
    conceptId: getCanonicalMentalMapConceptId(challenge),
    eventId,
    attemptId: `${eventId}:attempt`,
    occurredAt,
    sourceMode: "mental-map",
    sourceActivityId: challenge.sourceActivityId
  });
}

const correctEvent = eventFor(ohioToColumbus, "ohio", "capital-relationship-correct", "2036-05-06T12:00:00.000Z");
const incorrectEvent = eventFor(columbusToOhio, columbusToOhio.distractorStateIds[0], "capital-relationship-incorrect", "2036-05-06T12:01:00.000Z");
assert.equal(correctEvent.conceptId, "state-capital:ohio:columbus");
assert.equal(incorrectEvent.conceptId, correctEvent.conceptId);
assert.equal(correctEvent.skillId, "relationship-recall");
assert.equal(correctEvent.outcome, "correct");
assert.equal(incorrectEvent.outcome, "incorrect");
assert.equal(correctEvent.response.promptDirection, "state-to-capital");
assert.equal(incorrectEvent.response.promptDirection, "capital-to-state");

const storage = createMemoryStorage();
const firstWrite = recordCanonicalEvidenceEvent(correctEvent, storage);
const duplicateWrite = recordCanonicalEvidenceEvent(correctEvent, storage);
const missWrite = recordCanonicalEvidenceEvent(incorrectEvent, storage);
assert.equal(firstWrite.inserted, true);
assert.equal(duplicateWrite.inserted, false, "The same submitted action must not emit/count twice.");
assert.equal(missWrite.inserted, true);
const repository = loadCanonicalEvidenceRepository(storage);
assert.equal(repository.events.length, 2);
const policy = applyProgressEvidencePolicy(repository.events);
const relationshipHistory = policy.histories.find(({ historyKey }) => historyKey === `${USER_FACING_PROGRESS_SKILLS.CAPITAL_OF_RELATIONSHIP}\u0000state-capital:ohio:columbus`);
assert.deepEqual(
  [relationshipHistory.correctCount, relationshipHistory.incorrectCount],
  [1, 1],
  "Correct and incorrect relationship evidence must persist in one relationship history."
);
assert.equal(policy.histories.some(({ progressSkillId }) => progressSkillId === USER_FACING_PROGRESS_SKILLS.CAPITAL_LOCATION), false);
assert.equal(policy.histories.some(({ progressSkillId }) => progressSkillId === USER_FACING_PROGRESS_SKILLS.CAPITAL_IDENTIFICATION), false);

const reportItems = [
  { id: "state:ohio", type: "state", targetId: "ohio", label: "Ohio" },
  {
    id: "capital:columbus-oh",
    type: "capital",
    targetId: "columbus-oh",
    label: "Columbus",
    relatedStateItemId: "state:ohio",
    relatedStateTargetId: "ohio"
  }
];
const selected = createUnitedStatesProgressReportReadModel({
  items: reportItems,
  repository,
  storage,
  now: () => new Date("2036-05-06T13:00:00.000Z")
});
assert.equal(selected.selection.path, "canonical-first");
const capitalRecord = selected.report.categories
  .find(({ id }) => id === "state-capitals").records
  .find(({ itemId }) => itemId === "capital:columbus-oh");
assert.deepEqual([capitalRecord.evidenceHistory.correctCount, capitalRecord.evidenceHistory.incorrectCount], [1, 1]);
assert.ok(capitalRecord.canonicalMapping.conceptIds.includes("state-capital:ohio:columbus"));
assert.ok(capitalRecord.canonicalMapping.progressSkillIds.includes(USER_FACING_PROGRESS_SKILLS.CAPITAL_OF_RELATIONSHIP));

const legacyStorage = createMemoryStorage();
const legacy = createUnitedStatesProgressReportReadModel({
  items: reportItems,
  repository: loadCanonicalEvidenceRepository(legacyStorage),
  storage: legacyStorage,
  unitedStatesMemoryTrailState: {
    itemProgress: {
      "capital:columbus-oh": { status: "learning", timesSeen: 1, correctCount: 1, missCount: 0 }
    }
  }
});
assert.equal(legacy.selection.path, "legacy");
assert.equal(legacy.selection.reason, "existing-legacy-history");
assert.equal(legacy.report.readPath, undefined, "Existing users must not receive fabricated canonical relationship history.");

const coverage = buildRepositoryCoverage();
assert.equal(coverage.summary.statesWithExplicitCapitalRelationshipData, 50);
assert.equal(coverage.summary.statesWithAssessedCapitalRelationship, 50);
assert.equal(coverage.gaps.capitalRelationshipDataOnly.length, 0);
const ohioCoverageConcept = coverage.concepts.find(({ id }) => id === "state-capital:ohio:columbus");
assert.equal(ohioCoverageConcept.delivery, "fixed-scored");
assert.equal(ohioCoverageConcept.sources.filter(({ type }) => type === "mental-map-question").length, 2);

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const fixture = loadUnitedStatesSimulationFixture(repositoryRoot);
const plannerState = createUnitedStatesMemoryTrailState(null, fixture.items);
const plannerSnapshot = JSON.stringify(plannerState);
const plannerOptions = { seed: "i1-capital-relationships", now: () => new Date("2036-05-06T13:00:00.000Z") };
const planBefore = planUnitedStatesMemoryTrailSession(plannerState, fixture.items, plannerOptions);
getStateCapitalRelationshipChallenges();
const planAfter = planUnitedStatesMemoryTrailSession(plannerState, fixture.items, plannerOptions);
assert.deepEqual(planAfter, planBefore, "Generating relationship questions must not affect adaptive planning.");
assert.equal(JSON.stringify(plannerState), plannerSnapshot);

const runtimeSource = readFileSync(new URL("../src/maplibre-poc.js", import.meta.url), "utf8");
const indexSource = readFileSync(new URL("../index.html", import.meta.url), "utf8");
assert.match(indexSource, /main-menu-state-capital-relationships-button/);
assert.match(runtimeSource, /openMentalMapChallenge\(\{ stateCapitalOnly: true \}\)/);
assert.match(runtimeSource, /recordCanonicalMentalMapEvaluation\(\)/);
assert.match(runtimeSource, /sourceActivityId: activeMentalMapChallenge\.sourceActivityId \|\| activeMentalMapChallenge\.id/);

console.log("I1 state-capital relationship learning passed: Ohio ↔ Columbus uses state-capital:ohio:columbus.");
