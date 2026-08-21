import assert from "node:assert/strict";

import {
  adaptCanonicalMapReconstructionEvaluation,
  adaptCanonicalMentalMapEvaluation,
  adaptCanonicalRetrievalAttempt,
  createCanonicalEvidenceEvent
} from "../src/canonical-learning-evidence.js";
import {
  applyProgressEvidencePolicy,
  classifyCanonicalProgressEvidence,
  PROGRESS_EVIDENCE_POLICY_GAPS,
  PROGRESS_REPORT_ROLLUP_POLICIES,
  USER_FACING_PROGRESS_SKILLS
} from "../src/progress-evidence-policy.js";

const occurredAt = "2034-02-03T15:30:00.000Z";
const ohio = {
  id: "state:ohio",
  type: "state",
  targetId: "ohio",
  label: "Ohio",
  sourceActivityId: "us-states-05"
};
const columbus = {
  id: "capital:columbus-oh",
  type: "capital",
  targetId: "columbus-oh",
  label: "Columbus",
  relatedStateTargetId: "ohio",
  sourceActivityId: "us-capitals-05"
};

function retrieval({ id, item = ohio, promptType = "name_to_place", result = "correct", sourceMode, sequence = 0 }) {
  return adaptCanonicalRetrievalAttempt({
    item,
    promptType,
    result,
    eventId: id,
    attemptId: `${id}:attempt`,
    occurredAt: new Date(Date.parse(occurredAt) + sequence * 1000).toISOString(),
    sourceMode,
    sourceActivityId: item.sourceActivityId,
    sequence
  });
}

const journeyLocate = retrieval({ id: "journey-locate-ohio", sourceMode: "journey", sequence: 0 });
const memoryLocate = retrieval({ id: "memory-locate-ohio", sourceMode: "us-memory-trail", sequence: 1 });
const identify = retrieval({
  id: "memory-identify-ohio",
  sourceMode: "us-memory-trail",
  promptType: "place_to_name",
  sequence: 2
});
const guided = retrieval({
  id: "daily-guided-ohio",
  sourceMode: "daily-trail",
  promptType: "guided",
  sequence: 3
});
const locationMiss = retrieval({
  id: "memory-miss-ohio",
  sourceMode: "us-memory-trail",
  result: "incorrect",
  sequence: 4
});

const mentalRelationship = adaptCanonicalMentalMapEvaluation({
  challenge: { id: "lake-erie-all", correctStateIds: ["ohio", "pennsylvania"] },
  evaluation: {
    isCorrect: true,
    score: 2,
    maxScore: 2,
    selectedStateIds: ["ohio", "pennsylvania"],
    missingStateIds: [],
    unnecessaryStateIds: []
  },
  conceptId: "relationship:set:lake-erie+ohio+pennsylvania",
  eventId: "mental-map-lake-erie",
  attemptId: "mental-map-lake-erie:attempt",
  occurredAt: new Date(Date.parse(occurredAt) + 5000).toISOString(),
  sourceMode: "mental-map",
  sourceActivityId: "lake-erie-all",
  sequence: 5
});

const reconstructionPartial = adaptCanonicalMapReconstructionEvaluation({
  evaluation: {
    regionId: "rebuild-great-lakes",
    placements: { ohio: { status: "close", distanceRatio: 0.31, vectorErrorRatio: 0.28 } }
  },
  eventIdPrefix: "reconstruction-partial",
  attemptId: "reconstruction-partial:attempt",
  occurredAt: new Date(Date.parse(occurredAt) + 6000).toISOString(),
  sourceMode: "map-reconstruction",
  sourceActivityId: "rebuild-great-lakes",
  sequence: 6
})[0];

const capitalLocation = retrieval({
  id: "capital-location",
  item: columbus,
  sourceMode: "us-memory-trail",
  promptType: "name_to_place",
  sequence: 7
});
const capitalIdentification = retrieval({
  id: "capital-identification",
  item: columbus,
  sourceMode: "us-memory-trail",
  promptType: "place_to_name",
  sequence: 8
});
const capitalRelationship = createCanonicalEvidenceEvent({
  eventId: "capital-of-relationship",
  attemptId: "capital-of-relationship:attempt",
  occurredAt: new Date(Date.parse(occurredAt) + 9000).toISOString(),
  conceptId: "state-capital:ohio:columbus-oh",
  skillId: "relationship-recall",
  sourceMode: "future-capital-relationship",
  sourceActivityId: "policy-validation",
  outcome: "correct",
  sequence: 9
});

const journeyDecision = classifyCanonicalProgressEvidence(journeyLocate);
const memoryDecision = classifyCanonicalProgressEvidence(memoryLocate);
assert.equal(journeyDecision.contributions[0].progressSkillId, USER_FACING_PROGRESS_SKILLS.STATE_LOCATION);
assert.equal(memoryDecision.contributions[0].progressSkillId, USER_FACING_PROGRESS_SKILLS.STATE_LOCATION);
assert.equal(journeyDecision.contributions[0].historyKey, memoryDecision.contributions[0].historyKey);
assert.equal(journeyDecision.sourceModeValidated, true);

const identifyDecision = classifyCanonicalProgressEvidence(identify);
assert.equal(identifyDecision.contributions[0].progressSkillId, USER_FACING_PROGRESS_SKILLS.STATE_IDENTIFICATION);
assert.notEqual(identifyDecision.contributions[0].historyKey, journeyDecision.contributions[0].historyKey);

const guidedDecision = classifyCanonicalProgressEvidence(guided);
assert.equal(guidedDecision.contributions[0].treatment, "exposure-only");
assert.equal(guidedDecision.contributions[0].correctCount, 0);
assert.equal(guidedDecision.contributions[0].incorrectCount, 0);
const missDecision = classifyCanonicalProgressEvidence(locationMiss);
assert.equal(missDecision.contributions[0].treatment, "bayesian-negative");
assert.equal(missDecision.contributions[0].incorrectCount, 1);

const relationshipDecision = classifyCanonicalProgressEvidence(mentalRelationship);
assert.equal(relationshipDecision.contributions[0].progressSkillId, USER_FACING_PROGRESS_SKILLS.GEOGRAPHIC_RELATIONSHIPS);
assert.equal(relationshipDecision.contributions.some(({ progressSkillId }) => progressSkillId === USER_FACING_PROGRESS_SKILLS.STATE_LOCATION), false);

const reconstructionDecision = classifyCanonicalProgressEvidence(reconstructionPartial);
assert.equal(reconstructionDecision.contributions[0].progressSkillId, USER_FACING_PROGRESS_SKILLS.SPATIAL_RECONSTRUCTION);
assert.equal(reconstructionDecision.contributions[0].treatment, "preserve-partial-unscored");
assert.equal(reconstructionDecision.contributions[0].correctCount, 0);
assert.equal(reconstructionDecision.contributions[0].partialCredit, null);

const capitalDecisions = [capitalLocation, capitalIdentification, capitalRelationship]
  .map(classifyCanonicalProgressEvidence);
assert.deepEqual(capitalDecisions.map(({ contributions }) => contributions[0].progressSkillId), [
  USER_FACING_PROGRESS_SKILLS.CAPITAL_LOCATION,
  USER_FACING_PROGRESS_SKILLS.CAPITAL_IDENTIFICATION,
  USER_FACING_PROGRESS_SKILLS.CAPITAL_OF_RELATIONSHIP
]);
assert.equal(capitalDecisions[2].sourceModeValidated, false, "The relationship rule is defined before a live emitter is validated.");
assert.deepEqual(PROGRESS_REPORT_ROLLUP_POLICIES["state-capitals"].includedProgressSkillIds, [
  USER_FACING_PROGRESS_SKILLS.CAPITAL_LOCATION,
  USER_FACING_PROGRESS_SKILLS.CAPITAL_IDENTIFICATION
]);
assert.deepEqual(PROGRESS_REPORT_ROLLUP_POLICIES["state-capitals"].excludedProgressSkillIds, [
  USER_FACING_PROGRESS_SKILLS.CAPITAL_OF_RELATIONSHIP
]);

const duplicateResult = applyProgressEvidencePolicy([journeyLocate, journeyLocate]);
assert.equal(duplicateResult.uniqueEventCount, 1);
assert.deepEqual(duplicateResult.duplicateEventIds, [journeyLocate.eventId]);
assert.equal(duplicateResult.histories[0].correctCount, 1, "A duplicate raw event must not be counted twice.");

const combined = applyProgressEvidencePolicy([
  reconstructionPartial,
  identify,
  memoryLocate,
  journeyLocate,
  mentalRelationship,
  guided,
  locationMiss,
  capitalLocation,
  capitalIdentification,
  capitalRelationship
]);
const replay = applyProgressEvidencePolicy([
  capitalRelationship,
  capitalIdentification,
  capitalLocation,
  locationMiss,
  guided,
  mentalRelationship,
  journeyLocate,
  memoryLocate,
  identify,
  reconstructionPartial
]);
assert.deepEqual(combined, replay, "Policy application must be deterministic regardless of input event order.");
assert.equal(
  combined.decisions.every(({ contributions }) => contributions.length <= 1),
  true,
  "Each current v1 event must affect at most one user-facing progress history."
);
const ohioLocationHistory = combined.histories.find(({ progressSkillId }) => progressSkillId === USER_FACING_PROGRESS_SKILLS.STATE_LOCATION);
assert.equal(ohioLocationHistory.correctCount, 2);
assert.equal(ohioLocationHistory.incorrectCount, 1);
assert.equal(ohioLocationHistory.assistedCount, 1);
assert.deepEqual(ohioLocationHistory.eventIds, [
  "journey-locate-ohio",
  "memory-locate-ohio",
  "daily-guided-ohio",
  "memory-miss-ohio"
]);

const mismatchedSkill = createCanonicalEvidenceEvent({
  ...journeyLocate,
  eventId: "mismatched-state-location-skill",
  attemptId: "mismatched-state-location-skill:attempt",
  skillId: "identifying"
});
assert.equal(classifyCanonicalProgressEvidence(mismatchedSkill).included, false);

const inputEvents = [journeyLocate, memoryLocate, identify];
const inputSnapshot = JSON.stringify(inputEvents);
assert.doesNotThrow(() => JSON.stringify(applyProgressEvidencePolicy(inputEvents)));
assert.equal(JSON.stringify(inputEvents), inputSnapshot, "Policy validation must not mutate evidence events.");

assert.equal(PROGRESS_EVIDENCE_POLICY_GAPS.contextualKnowledge.status, "unsupported-by-canonical-contract-v1");
assert.throws(() => createCanonicalEvidenceEvent({
  ...journeyLocate,
  eventId: "context-event",
  attemptId: "context-event:attempt",
  conceptId: "context:ohio:industrial-corridor",
  skillId: "contextual-recall"
}), /Unknown canonical skill/);

console.log("Progress Evidence Policy validation passed: current canonical events map without leaks or double-counting.");
