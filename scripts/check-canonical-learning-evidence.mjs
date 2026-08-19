import assert from "node:assert/strict";
import {
  adaptCanonicalMapReconstructionEvaluation,
  adaptCanonicalMentalMapEvaluation,
  adaptCanonicalRetrievalAttempt,
  CANONICAL_EVIDENCE_OUTCOMES,
  CANONICAL_SKILL_IDS,
  createCanonicalAggregateEvidenceSummary,
  createCanonicalEvidenceEvent,
  createUnitedStatesStateConcepts
} from "../src/canonical-learning-evidence.js";
import { evaluateMentalMapAnswer } from "../src/atlas/mental-map-challenge-engine.js";
import { getMentalMapChallenges, MENTAL_MAP_ANSWER_MODES } from "../src/atlas/mental-map-challenges.js";
import { fixedChallengeConceptId, buildRepositoryCoverage } from "./lib/us-content-coverage.mjs";

const clone = (value) => JSON.parse(JSON.stringify(value));
const occurredAt = "2034-02-03T15:30:00.000Z";
const ohioItem = {
  id: "state:ohio",
  type: "state",
  targetId: "ohio",
  label: "Ohio",
  sourceActivityId: "us-states-05"
};

assert.deepEqual(CANONICAL_SKILL_IDS, [
  "locating", "identifying", "recognition", "relationship-recall", "sequencing", "spatial-reconstruction"
]);
assert.deepEqual(CANONICAL_EVIDENCE_OUTCOMES, ["correct", "incorrect", "partial", "assisted", "skipped"]);

const concepts = createUnitedStatesStateConcepts("ohio", "Ohio");
assert.deepEqual(concepts.map(({ id }) => id), [
  "state-location:ohio",
  "state-naming:ohio",
  "state-reconstruction:ohio"
]);
const coverageConceptIds = new Set(buildRepositoryCoverage().concepts.map(({ id }) => id));
assert.equal(coverageConceptIds.has("state-location:ohio"), true, "The contract must reuse the O1 state-location identity.");
assert.equal(coverageConceptIds.has("state-naming:ohio"), true, "The contract must reuse the O1 state-naming identity.");

const journeyEvent = adaptCanonicalRetrievalAttempt({
  item: ohioItem,
  promptType: "name_to_place",
  result: "correct",
  eventId: "journey-ohio-1",
  attemptId: "journey-attempt-1",
  occurredAt,
  sourceMode: "journey",
  sourceActivityId: "us-states-05"
});
const memoryTrailEvent = adaptCanonicalRetrievalAttempt({
  item: ohioItem,
  promptType: "name_to_place",
  result: "correct",
  eventId: "memory-ohio-1",
  attemptId: "memory-attempt-1",
  occurredAt,
  sourceMode: "us-memory-trail",
  sourceActivityId: "us-states-05",
  sessionId: "us-memory-trail:12:20340203",
  sequence: 4
});
assert.equal(journeyEvent.conceptId, "state-location:ohio");
assert.equal(journeyEvent.skillId, "locating");
assert.equal(memoryTrailEvent.conceptId, journeyEvent.conceptId);
assert.equal(memoryTrailEvent.skillId, journeyEvent.skillId);
assert.notEqual(memoryTrailEvent.eventId, journeyEvent.eventId);

const namingEvent = adaptCanonicalRetrievalAttempt({
  item: ohioItem,
  promptType: "place_to_name",
  result: "incorrect",
  eventId: "memory-ohio-2",
  attemptId: "memory-attempt-2",
  occurredAt,
  sourceMode: "us-memory-trail"
});
assert.equal(namingEvent.conceptId, "state-naming:ohio");
assert.equal(namingEvent.skillId, "identifying");
assert.equal(namingEvent.outcome, "incorrect");

const guidedEvent = adaptCanonicalRetrievalAttempt({
  item: ohioItem,
  promptType: "guided",
  result: "correct",
  eventId: "daily-ohio-guided-1",
  attemptId: "daily-attempt-guided-1",
  occurredAt,
  sourceMode: "daily-trail"
});
assert.equal(guidedEvent.outcome, "assisted", "Guided exposure must not become unassisted correct evidence.");

const dailyProgress = { timesSeen: 5, correctCount: 4, missCount: 2, status: "review" };
const dailyProgressBefore = clone(dailyProgress);
const dailySummary = createCanonicalAggregateEvidenceSummary({
  item: { ...ohioItem, id: "world-core:state:ohio" },
  progress: dailyProgress,
  sourceMode: "daily-trail"
});
assert.deepEqual(dailyProgress, dailyProgressBefore, "Aggregate adaptation must not mutate learner state.");
assert.deepEqual(dailySummary.conceptIds, ["state-location:ohio", "state-naming:ohio"]);
assert.deepEqual(dailySummary.skillIds, ["locating", "identifying"]);
assert.equal(dailySummary.skillAttribution, "combined-and-unavailable");
assert.equal(dailySummary.correctCount, 4);
assert.equal(dailySummary.incorrectCount, 2);
assert.equal(dailySummary.attempts, 6);
assert.equal("eventId" in dailySummary, false, "Historical aggregates must not fabricate canonical event IDs.");
assert.equal("occurredAt" in dailySummary, false, "Historical aggregates must not fabricate timestamps.");

const memorySummary = createCanonicalAggregateEvidenceSummary({
  item: ohioItem,
  progress: { timesSeen: 3, correctCount: 2, missCount: 1 },
  sourceMode: "us-memory-trail"
});
assert.deepEqual(memorySummary.conceptIds, dailySummary.conceptIds);
assert.deepEqual(memorySummary.skillIds, dailySummary.skillIds);
assert.equal(memorySummary.skillAttribution, "combined-and-unavailable");
assert.equal(memorySummary.sourceItemId, "state:ohio");

const lakeErieChallenge = getMentalMapChallenges({ includeGenerated: false })
  .find(({ id }) => id === "lake-erie-all");
const mentalEvaluation = evaluateMentalMapAnswer(lakeErieChallenge, ["ohio", "pennsylvania"]);
const mentalEvaluationBefore = clone(mentalEvaluation);
const mentalEvent = adaptCanonicalMentalMapEvaluation({
  challenge: lakeErieChallenge,
  evaluation: mentalEvaluation,
  conceptId: fixedChallengeConceptId(lakeErieChallenge),
  eventId: "mental-lake-erie-1",
  attemptId: "mental-attempt-1",
  occurredAt,
  sourceMode: "mental-map",
  sourceActivityId: lakeErieChallenge.id
});
assert.deepEqual(mentalEvaluation, mentalEvaluationBefore, "Mental Map adaptation must not mutate evaluation data.");
assert.equal(mentalEvent.skillId, "relationship-recall");
assert.equal(mentalEvent.outcome, "partial");
assert.deepEqual(mentalEvent.credit, { earned: 2, possible: 4 });
assert.equal(mentalEvent.response.selectedEntityIds.includes("state:ohio"), true);

const sequenceChallenge = {
  id: "test-order",
  answerMode: MENTAL_MAP_ANSWER_MODES.ORDERED_SEQUENCE,
  orderedStateIds: ["illinois", "indiana", "ohio"],
  acceptedAlternatives: []
};
const sequenceEvaluation = evaluateMentalMapAnswer(sequenceChallenge, ["illinois", "ohio", "indiana"]);
const sequenceEvent = adaptCanonicalMentalMapEvaluation({
  challenge: sequenceChallenge,
  evaluation: sequenceEvaluation,
  conceptId: "relationship:ordered:illinois>indiana>ohio",
  eventId: "mental-order-1",
  attemptId: "mental-attempt-2",
  occurredAt,
  sourceMode: "mental-map"
});
assert.equal(sequenceEvent.skillId, "sequencing");
assert.equal(sequenceEvent.outcome, "partial");

const reconstructionEvaluation = {
  regionId: "rebuild-great-lakes",
  placements: {
    ohio: { status: "close", distanceRatio: 0.31, vectorErrorRatio: 0.28 },
    michigan: { status: "well-placed", distanceRatio: 0.11, vectorErrorRatio: 0.1 },
    indiana: { status: "misplaced", distanceRatio: 0.72, vectorErrorRatio: 0.7 },
    illinois: { status: "unplaced", distanceRatio: null, vectorErrorRatio: null }
  }
};
const reconstructionBefore = clone(reconstructionEvaluation);
const reconstructionEvents = adaptCanonicalMapReconstructionEvaluation({
  evaluation: reconstructionEvaluation,
  eventIdPrefix: "reconstruction-great-lakes-1",
  attemptId: "reconstruction-attempt-1",
  occurredAt,
  sourceMode: "map-reconstruction"
});
assert.deepEqual(reconstructionEvaluation, reconstructionBefore, "Reconstruction adaptation must not mutate evaluation data.");
assert.deepEqual(reconstructionEvents.map(({ outcome }) => outcome), ["partial", "correct", "incorrect", "skipped"]);
assert.equal(reconstructionEvents.every(({ attemptId }) => attemptId === "reconstruction-attempt-1"), true);
assert.equal(reconstructionEvents[0].conceptId, "state-reconstruction:ohio");
assert.equal(reconstructionEvents[0].skillId, "spatial-reconstruction");
assert.equal(reconstructionEvents[0].sourceActivityId, "rebuild-great-lakes");

assert.throws(() => createCanonicalEvidenceEvent({
  conceptId: "state-location:ohio",
  skillId: "locating",
  sourceMode: "legacy-aggregate",
  outcome: "correct"
}), /eventId/, "A historical aggregate must not pass as an event without event identity and time.");
assert.throws(() => createCanonicalEvidenceEvent({
  eventId: "invalid-sequence-event",
  attemptId: "invalid-sequence-attempt",
  occurredAt,
  conceptId: "state-location:ohio",
  skillId: "locating",
  sourceMode: "journey",
  outcome: "correct",
  sequence: -1
}), /non-negative/);

console.log("Canonical learning evidence contract check passed.");
