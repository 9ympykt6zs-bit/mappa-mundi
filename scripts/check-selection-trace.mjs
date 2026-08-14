import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  createDailyTrailSelectionExplanation,
  createMentalMapSelectionExplanation,
  createUnitedStatesMemoryTrailSelectionExplanation,
  LEARNING_INSPECTOR_AVAILABILITY
} from "../src/learning-inspector.js";
import {
  createDailyTrailState,
  planCompletedDailyTrailReviewSession
} from "../src/daily-trail-planner.js";
import {
  createUnitedStatesMemoryTrailState,
  planUnitedStatesMemoryTrailSession
} from "../src/united-states-memory-trail-planner.js";
import {
  getUnifiedMentalMapChallenges,
  selectNextUnifiedMentalMapChallenge,
  selectNextUnifiedMentalMapChallengeWithDebug
} from "../src/atlas/mental-map-challenge-registry.js";
import {
  createGeneratedShortestRouteChallenge,
  createGeneratedShortestRouteChallengeWithDebug
} from "../src/atlas/mental-map-challenges.js";
import { loadUnitedStatesSimulationFixture } from "./lib/us-simulation-fixture.mjs";

const clone = (value) => JSON.parse(JSON.stringify(value));
const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const fixture = loadUnitedStatesSimulationFixture(repositoryRoot);
const fixedNow = () => new Date("2035-06-10T12:00:00.000Z");

const usState = createUnitedStatesMemoryTrailState({
  currentSessionNumber: 20,
  introducedItemIds: fixture.items.map((item) => item.id),
  itemProgress: Object.fromEntries(fixture.items.map((item) => [item.id, {
    status: item.id === "state:ohio" ? "learning" : "review",
    memoryState: item.id === "state:ohio" ? "relearning" : "review",
    timesSeen: 4,
    correctCount: item.id === "state:ohio" ? 1 : 4,
    missCount: item.id === "state:ohio" ? 3 : 0,
    lapseCount: item.id === "state:ohio" ? 3 : 0,
    correctStreak: item.id === "state:ohio" ? 0 : 3,
    lastSeenSession: 10,
    dueSession: item.id === "state:ohio" ? 20 : 30
  }]))
}, fixture.items);
const usStateBefore = clone(usState);
const usOptions = { seed: "selection-trace-us", now: fixedNow };
const usPlanWithoutTrace = planUnitedStatesMemoryTrailSession(usState, fixture.items, usOptions);
const ohio = usPlanWithoutTrace.playItems.find((item) => item.id === "state:ohio");
assert.ok(ohio, "The controlled weak-item fixture should select Ohio.");
const usExplanation = createUnitedStatesMemoryTrailSelectionExplanation({
  state: usState,
  plan: usPlanWithoutTrace,
  item: ohio,
  deterministicContext: usOptions
});
assert.deepEqual(usState, usStateBefore, "Tracing must not mutate U.S. Memory Trail state.");
assert.deepEqual(
  planUnitedStatesMemoryTrailSession(usState, fixture.items, usOptions).playItems.map((item) => item.id),
  usPlanWithoutTrace.playItems.map((item) => item.id),
  "Creating a trace must not change U.S. Memory Trail selection output."
);
assert.equal(usExplanation.selectionTrace.reasonBucket.value, "weak-review");
assert.ok(usExplanation.selectionTrace.selectionReasons.value.includes("recorded-miss"));
assert.equal(usExplanation.selectionTrace.eligibleCandidateCount.value, 100);
assert.equal(usExplanation.selectionTrace.candidatePoolMetadata.value.kind, "cumulative-review");
assert.ok(usExplanation.selectionTrace.alternatives.value.items.some((item) => item.censusRegion === "West"));
assert.equal(usExplanation.selectionTrace.unavailableFields.availability, LEARNING_INSPECTOR_AVAILABILITY.OBSERVED);
const replayExplanation = createUnitedStatesMemoryTrailSelectionExplanation({ state: usState, plan: usPlanWithoutTrace, item: ohio, deterministicContext: usOptions });
assert.deepEqual(replayExplanation.selectionTrace, usExplanation.selectionTrace, "Deterministic U.S. traces must replay exactly.");

const dailyItems = fixture.items.slice(0, 12);
const dailyState = createDailyTrailState({
  hasStarted: true,
  pathCompleted: true,
  completedGoalIds: ["world-core"],
  currentSessionNumber: 12,
  introducedItemIds: dailyItems.map((item) => item.id),
  itemProgress: Object.fromEntries(dailyItems.map((item) => [item.id, {
    status: "review", memoryState: "review", timesSeen: 3, correctCount: 2, missCount: 1,
    lapseCount: 1, correctStreak: 0, lastSeenSession: 9, dueSession: 12,
    lastReviewedDate: "2035-06-01", dueDate: "2035-06-10"
  }]))
}, { now: fixedNow });
const dailyBefore = clone(dailyState);
const dailyPlan = planCompletedDailyTrailReviewSession(dailyState, dailyItems, { seed: "selection-trace-daily", now: fixedNow });
const dailyExplanation = createDailyTrailSelectionExplanation({
  state: dailyState,
  plan: dailyPlan,
  item: dailyPlan.playItems[0],
  deterministicContext: { seed: "selection-trace-daily", now: fixedNow }
});
assert.deepEqual(dailyState, dailyBefore, "Tracing must not mutate Daily Trail state.");
assert.equal(dailyExplanation.selectionTrace.eligibleCandidateCount.availability, LEARNING_INSPECTOR_AVAILABILITY.UNAVAILABLE);
assert.equal(dailyExplanation.selectionTrace.alternatives.value.scope, "other-emitted-selections-only");
assert.equal(dailyExplanation.selectionTrace.candidatePoolMetadata.value.emittedSelectionCount, dailyPlan.playItems.length);

const mentalOptions = {
  seed: "selection-trace-mental",
  lastCategory: "relative-position",
  recentAnswerModes: ["ordered-sequence", "ordered-sequence"]
};
const mentalPool = getUnifiedMentalMapChallenges({ seed: "selection-trace-pool" });
const normalMentalSelection = selectNextUnifiedMentalMapChallenge(mentalPool, mentalOptions);
const debugMentalSelection = selectNextUnifiedMentalMapChallengeWithDebug(mentalPool, mentalOptions);
assert.deepEqual(debugMentalSelection.selected, normalMentalSelection, "The debug selector must preserve Mental Map selection output.");
const mentalExplanation = createMentalMapSelectionExplanation({
  challenge: debugMentalSelection.selected,
  pool: mentalPool,
  selectionDebug: debugMentalSelection.debug,
  deterministicContext: mentalOptions
});
assert.equal(mentalExplanation.selectionTrace.eligibleCandidateCount.value, debugMentalSelection.debug.preferredCount);
assert.equal(mentalExplanation.selectionTrace.priorityFactors.value.randomValue, debugMentalSelection.debug.randomValue);
assert.deepEqual(
  createMentalMapSelectionExplanation({ challenge: debugMentalSelection.selected, pool: mentalPool, selectionDebug: debugMentalSelection.debug, deterministicContext: mentalOptions }).selectionTrace,
  mentalExplanation.selectionTrace
);

const normalGenerated = createGeneratedShortestRouteChallenge({ seed: "selection-trace-generated" });
const debugGenerated = createGeneratedShortestRouteChallengeWithDebug({ seed: "selection-trace-generated" });
assert.deepEqual(debugGenerated.selected, normalGenerated, "Generated challenge tracing must preserve selection output.");
const generatedExplanation = createMentalMapSelectionExplanation({
  challenge: debugGenerated.selected,
  generatedSelectionDebug: debugGenerated.debug,
  deterministicContext: { seed: "selection-trace-generated" }
});
assert.equal(generatedExplanation.selectionTrace.reasonBucket.value, "generated-shortest-route");
assert.equal(generatedExplanation.selectionTrace.eligibleCandidateCount.availability, LEARNING_INSPECTOR_AVAILABILITY.UNAVAILABLE);
assert.equal(generatedExplanation.selectionTrace.candidatePoolMetadata.value.pairCount, debugGenerated.debug.pairCount);
assert.doesNotThrow(() => JSON.stringify({ usExplanation, dailyExplanation, mentalExplanation, generatedExplanation }));

console.log("Selection Trace validation passed.");
