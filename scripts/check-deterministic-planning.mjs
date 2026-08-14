import assert from "node:assert/strict";
import {
  applyDailyTrailSessionResults,
  createDailyTrailState,
  planCompletedDailyTrailReviewSession
} from "../src/daily-trail-planner.js";
import {
  applyUnitedStatesMemoryTrailSessionStart,
  createUnitedStatesMemoryTrailState,
  planUnitedStatesMemoryTrailSession
} from "../src/united-states-memory-trail-planner.js";
import { createSeededRandom } from "../src/deterministic-dependencies.js";
import {
  createGeneratedShortestRouteChallenge,
  validateMentalMapChallenge
} from "../src/atlas/mental-map-challenges.js";
import {
  getUnifiedMentalMapChallenges,
  selectNextUnifiedMentalMapChallenge
} from "../src/atlas/mental-map-challenge-registry.js";

const fixedNow = () => new Date("2030-01-15T18:30:00.000Z");

const seededSequenceA = Array.from({ length: 5 }, createSeededRandom("replay-seed"));
const seededSequenceB = Array.from({ length: 5 }, createSeededRandom("replay-seed"));
assert.deepEqual(seededSequenceA, seededSequenceB, "The same seed must replay the same random sequence.");
assert.notDeepEqual(
  seededSequenceA,
  Array.from({ length: 5 }, createSeededRandom("different-seed")),
  "Different seeds should produce different random sequences."
);

const mentalMapReplayA = createGeneratedShortestRouteChallenge({ seed: "mental-map-replay" });
const mentalMapReplayB = createGeneratedShortestRouteChallenge({ seed: "mental-map-replay" });
const mentalMapAlternative = createGeneratedShortestRouteChallenge({ seed: "mental-map-alternative" });
assert.deepEqual(mentalMapReplayA, mentalMapReplayB, "Generated Mental Map challenges must replay from a seed.");
assert.notEqual(mentalMapReplayA.id, mentalMapAlternative.id, "Different seeds should select different valid generated routes.");
assert.deepEqual(validateMentalMapChallenge(mentalMapReplayA), []);
assert.deepEqual(validateMentalMapChallenge(mentalMapAlternative), []);

const unifiedChallenges = getUnifiedMentalMapChallenges({ seed: "unified-pool" });
const selectedReplayA = selectNextUnifiedMentalMapChallenge(unifiedChallenges, { seed: "question-selection" });
const selectedReplayB = selectNextUnifiedMentalMapChallenge(unifiedChallenges, { seed: "question-selection" });
assert.equal(selectedReplayA.id, selectedReplayB.id, "Unified challenge selection must replay from a seed.");
assert.ok(createGeneratedShortestRouteChallenge(), "The production-default generated challenge path must remain available.");

const usItems = Array.from({ length: 14 }, (_, index) => ({
  id: `state:test-${String(index).padStart(2, "0")}`,
  type: "state",
  category: "states",
  targetId: `test-${String(index).padStart(2, "0")}`,
  label: `Test ${index}`,
  sourceActivityId: "us-states-test",
  homeActivityId: "us-states-test",
  homeJourneyId: "united-states",
  homeStepId: "us-states-test",
  homeStepIndex: 0,
  sectionId: "us-states-test",
  sectionIndex: 0,
  order: index
}));
const usState = createUnitedStatesMemoryTrailState({
  hasStarted: true,
  currentSessionNumber: 8,
  introducedItemIds: usItems.map((item) => item.id),
  itemProgress: Object.fromEntries(usItems.map((item) => [item.id, {
    status: "review",
    timesSeen: 3,
    correctCount: 3,
    correctStreak: 2,
    lastSeenSession: 4,
    dueSession: 8
  }]))
}, usItems);
const usOptions = { seed: "us-plan-replay", now: fixedNow };
const usPlanA = planUnitedStatesMemoryTrailSession(usState, usItems, usOptions);
const usPlanB = planUnitedStatesMemoryTrailSession(usState, usItems, usOptions);
const usPlanAlternative = planUnitedStatesMemoryTrailSession(usState, usItems, {
  seed: "us-plan-alternative",
  now: fixedNow
});
assert.deepEqual(usPlanA, usPlanB, "U.S. Memory Trail plans must replay from identical seed and time.");
assert.notDeepEqual(
  usPlanA.playItems.map((item) => item.id),
  usPlanAlternative.playItems.map((item) => item.id),
  "Different seeds should produce a different valid U.S. review order."
);
assert.equal(usPlanA.playItems.length, 10);
const startedUsSession = applyUnitedStatesMemoryTrailSessionStart(usState, usPlanA, { now: fixedNow });
assert.equal(startedUsSession.activeSession.updatedAt, fixedNow().getTime());
assert.equal(startedUsSession.activeSession.sessionId, usPlanA.sessionId);
assert.ok(planUnitedStatesMemoryTrailSession(usState, usItems).playItems.length > 0, "The default U.S. planner path must still work.");

const dailyItems = Array.from({ length: 14 }, (_, index) => ({
  id: `country:test-${String(index).padStart(2, "0")}`,
  targetId: `test-${String(index).padStart(2, "0")}`,
  label: `Test ${index}`,
  homeActivityId: `test-region-${index % 3}`,
  homeJourneyId: "world-geography-core",
  homeStepId: `test-region-${index % 3}`,
  homeStepIndex: index % 3,
  cameraGroupId: `test-region-${index % 3}`,
  order: index
}));
const dailyState = createDailyTrailState({
  hasStarted: true,
  currentSessionNumber: 8,
  introducedItemIds: dailyItems.map((item) => item.id),
  itemProgress: Object.fromEntries(dailyItems.map((item) => [item.id, {
    status: "review",
    timesSeen: 3,
    correctCount: 3,
    correctStreak: 2,
    lastSeenSession: 4,
    lastReviewedSession: 4,
    dueSession: 8,
    dueDate: "2030-01-10"
  }]))
}, { now: fixedNow });
const dailyOptions = { seed: "daily-plan-replay", now: fixedNow };
const dailyPlanA = planCompletedDailyTrailReviewSession(dailyState, dailyItems, dailyOptions);
const dailyPlanB = planCompletedDailyTrailReviewSession(dailyState, dailyItems, dailyOptions);
const dailyPlanAlternative = planCompletedDailyTrailReviewSession(dailyState, dailyItems, {
  seed: "daily-plan-alternative",
  now: fixedNow
});
assert.deepEqual(dailyPlanA, dailyPlanB, "Daily Trail plans must replay from identical seed and time.");
assert.notDeepEqual(
  dailyPlanA.playItems.map((item) => item.id),
  dailyPlanAlternative.playItems.map((item) => item.id),
  "Different seeds should produce a different valid Daily Trail review order."
);
assert.equal(dailyPlanA.playItems.length, 10);
const completedDailyState = applyDailyTrailSessionResults(dailyState, dailyPlanA, {
  completedTargetIds: dailyPlanA.playItems.map((item) => item.targetId),
  correctCount: dailyPlanA.playItems.length,
  incorrectCount: 0,
  missesByTargetId: {}
}, { now: fixedNow });
assert.equal(completedDailyState.lastDailyTrailSessionDate, "2030-01-15");
assert.ok(planCompletedDailyTrailReviewSession(dailyState, dailyItems).playItems.length > 0, "The default Daily Trail planner path must still work.");

const timeSensitiveItems = dailyItems.slice(0, 2);
const timeSensitiveState = createDailyTrailState({
  hasStarted: true,
  currentSessionNumber: 8,
  introducedItemIds: timeSensitiveItems.map((item) => item.id),
  itemProgress: {
    [timeSensitiveItems[0].id]: { status: "review", timesSeen: 3, dueSession: 99, dueDate: "2030-01-14" },
    [timeSensitiveItems[1].id]: { status: "review", timesSeen: 3, dueSession: 99, dueDate: "2030-01-16" }
  }
}, { now: fixedNow });
const dueOnFixedDate = planCompletedDailyTrailReviewSession(timeSensitiveState, timeSensitiveItems, { now: fixedNow });
const beforeEitherDue = planCompletedDailyTrailReviewSession(timeSensitiveState, timeSensitiveItems, {
  now: () => new Date("2030-01-13T18:30:00.000Z")
});
assert.deepEqual(dueOnFixedDate.playItems.map((item) => item.id), [timeSensitiveItems[0].id]);
assert.equal(beforeEitherDue.playItems.length, 2, "An injected earlier date should keep future items out of the due-only pool.");

console.log("Deterministic planning validation passed:", JSON.stringify({
  mentalMapChallengeId: mentalMapReplayA.id,
  selectedChallengeId: selectedReplayA.id,
  usPlanItemIds: usPlanA.playItems.map((item) => item.id),
  dailyPlanItemIds: dailyPlanA.playItems.map((item) => item.id),
  fixedDate: completedDailyState.lastDailyTrailSessionDate
}));
