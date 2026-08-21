import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  applyUnitedStatesMemoryTrailSessionResults,
  createUnitedStatesMemoryTrailState,
  planUnitedStatesMemoryTrailSession
} from "../src/united-states-memory-trail-planner.js";
import { createUnitedStatesMemoryTrailSelectionTrace } from "../src/selection-trace.js";
import { loadUnitedStatesSimulationFixture } from "./lib/us-simulation-fixture.mjs";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const { items } = loadUnitedStatesSimulationFixture(repositoryRoot);
const fixedNow = () => new Date("2030-01-15T18:30:00.000Z");

function progress({ status = "review", missCount = 0, correctStreak = 3, lastSeenSession = 1, dueSession = 1, stability = 100 } = {}) {
  return {
    status,
    timesSeen: status === "mastered" ? 9 : 4,
    correctCount: status === "mastered" ? 9 : 4,
    missCount,
    correctStreak,
    lastSeenSession,
    introducedSession: 1,
    memoryState: missCount > 0 && correctStreak === 0 ? "relearning" : "review",
    difficulty: missCount > 0 ? 8 : 4,
    stability,
    retrievability: missCount > 0 ? 0.3 : 0.8,
    dueSession,
    lastReviewedSession: lastSeenSession,
    lapseCount: missCount
  };
}

function createAllIntroducedState(itemProgress, currentSessionNumber = 100) {
  return createUnitedStatesMemoryTrailState({
    currentSessionNumber,
    introducedItemIds: items.map(({ id }) => id),
    itemProgress
  }, items);
}

function applyOutcomes(state, plan, persistentWeakIds) {
  const selectedWeak = plan.playItems.filter(({ id }) => persistentWeakIds.has(id));
  const selectedCorrect = plan.playItems.filter(({ id }) => !persistentWeakIds.has(id));
  return applyUnitedStatesMemoryTrailSessionResults(state, plan, {
    taughtTargetIds: [],
    completedTargetIds: selectedCorrect.map(({ targetId }) => targetId),
    correctCount: selectedCorrect.length,
    incorrectCount: selectedWeak.length,
    missesByTargetId: Object.fromEntries(selectedWeak.map(({ targetId }) => [targetId, 1]))
  });
}

// A single persistent miss retains remediation pressure while the rest of the due pool clears.
const oneWeakId = items[0].id;
const oneWeakDueIds = new Set(items.slice(1, 16).map(({ id }) => id));
let oneWeakState = createAllIntroducedState(Object.fromEntries(items.map((item, index) => [item.id,
  index === 0
    ? progress({ missCount: 5, correctStreak: 0, lastSeenSession: 99, dueSession: 100, stability: 0.5 })
    : index < 16
      ? progress({ lastSeenSession: index, dueSession: 1 })
      : progress({ status: "mastered", lastSeenSession: 90, dueSession: 1000 })
])));
const oneWeakSelections = new Set();
for (let session = 0; session < 2; session += 1) {
  const plan = planUnitedStatesMemoryTrailSession(oneWeakState, items, { seed: `fairness:one-weak:${session}`, now: fixedNow });
  assert.ok(plan.playItems.some(({ id }) => id === oneWeakId), "The persistent weak item must retain strong remediation pressure.");
  plan.playItems.forEach(({ id }) => oneWeakDueIds.has(id) && oneWeakSelections.add(id));
  oneWeakState = applyOutcomes(oneWeakState, plan, new Set([oneWeakId]));
}
assert.deepEqual([...oneWeakSelections].sort(), [...oneWeakDueIds].sort(), "One persistent weak item must not indefinitely block other eligible due review.");

// Ten continuously weak items would occupy every adaptive slot without the one-slot fairness lane.
const weakIds = new Set(items.slice(0, 10).map(({ id }) => id));
const waitingItems = items.slice(10, 30);
const waitingIds = new Set(waitingItems.map(({ id }) => id));
let multiWeakState = createAllIntroducedState(Object.fromEntries(items.map((item, index) => [item.id,
  index < 10
    ? progress({ missCount: 5, correctStreak: 0, lastSeenSession: 99, dueSession: 100, stability: 0.5 })
    : index < 30
      ? progress({ lastSeenSession: index - 9, dueSession: 1 })
      : progress({ status: "mastered", lastSeenSession: 90, dueSession: 1000 })
])));
const firstMultiWeakPlan = planUnitedStatesMemoryTrailSession(multiWeakState, items, { seed: "fairness:multi-weak:0", now: fixedNow });
assert.equal(firstMultiWeakPlan.fairnessReviewItems.length, 1);
assert.equal(firstMultiWeakPlan.fairnessReviewItems[0].id, waitingItems[0].id, "The lane must select the longest-waiting eligible due item.");
assert.equal(firstMultiWeakPlan.playItems.filter(({ id }) => weakIds.has(id)).length, 9, "Nine of ten slots must remain under existing weak-item priority.");
const fairnessTrace = createUnitedStatesMemoryTrailSelectionTrace({
  state: multiWeakState,
  plan: firstMultiWeakPlan,
  item: firstMultiWeakPlan.fairnessReviewItems[0],
  deterministicContext: { seed: "fairness:multi-weak:0", now: fixedNow }
});
assert.equal(fairnessTrace.reasonBucket.value, "fairness-review");
assert.equal(fairnessTrace.candidatePoolMetadata.value.kind, "cumulative-fairness");
assert.ok(fairnessTrace.selectionReasons.value.includes("longest-waiting-eligible-due-item"));
const persistentlySelectedWeakId = firstMultiWeakPlan.playItems.find(({ id }) => weakIds.has(id)).id;
const fairnessSelections = [];
let persistentWeakSelections = 0;
for (let session = 0; session < waitingItems.length; session += 1) {
  const plan = planUnitedStatesMemoryTrailSession(multiWeakState, items, { seed: `fairness:multi-weak:${session}`, now: fixedNow });
  assert.ok(plan.fairnessReviewItems.length <= 1, "At most one cumulative slot may use fairness selection.");
  assert.equal(plan.playItems.length, 10);
  assert.equal(plan.playItems.filter(({ id }) => weakIds.has(id)).length, 9, "The fairness lane must leave nine adaptive remediation slots.");
  persistentWeakSelections += Number(plan.playItems.some(({ id }) => id === persistentlySelectedWeakId));
  fairnessSelections.push(...plan.fairnessReviewItems.map(({ id }) => id));
  multiWeakState = applyOutcomes(multiWeakState, plan, weakIds);
}
assert.deepEqual(new Set(fairnessSelections), waitingIds, "Every initially waiting due item must eventually receive the fairness lane.");
assert.equal(persistentWeakSelections, waitingItems.length, "A persistent weak item must continue receiving review in every multi-weak session.");

// The rule is deterministic and does not enter learning sessions or relax prerequisites.
const replayState = createAllIntroducedState(Object.fromEntries(items.map((item, index) => [item.id,
  index < 10
    ? progress({ missCount: 4, correctStreak: 0, dueSession: 100 })
    : progress({ lastSeenSession: index, dueSession: index < 25 ? 1 : 1000 })
])));
const replayOptions = { seed: "fairness:replay", now: fixedNow };
assert.deepEqual(
  planUnitedStatesMemoryTrailSession(replayState, items, replayOptions),
  planUnitedStatesMemoryTrailSession(replayState, items, replayOptions),
  "Fairness selection must replay exactly under the existing seeded infrastructure."
);
const newLearnerPlan = planUnitedStatesMemoryTrailSession(createUnitedStatesMemoryTrailState(null, items), items, { seed: "fairness:new", now: fixedNow });
assert.equal(newLearnerPlan.sessionType, "learning-session");
assert.deepEqual(newLearnerPlan.newItems.map(({ targetId }) => targetId), ["maine", "new-hampshire", "massachusetts"]);
assert.deepEqual(newLearnerPlan.fairnessReviewItems, [], "Fairness must not affect new-item progression or prerequisite eligibility.");

const noLaneNeededState = createAllIntroducedState(Object.fromEntries(items.map((item, index) => [item.id,
  index < 10
    ? progress({ status: "review", lastSeenSession: index + 1, dueSession: 1 })
    : progress({ status: "mastered", lastSeenSession: 90, dueSession: 1000 })
])));
assert.deepEqual(
  planUnitedStatesMemoryTrailSession(noLaneNeededState, items, { seed: "fairness:not-needed", now: fixedNow }).fairnessReviewItems,
  [],
  "The planner must not force a fairness slot when every eligible due item already fits in the adaptive plan."
);

// Future-due mastered items remain out of the fairness lane while due review exists.
const masteredPressureState = createAllIntroducedState(Object.fromEntries(items.map((item, index) => [item.id,
  index < 70
    ? progress({ status: "mastered", lastSeenSession: 1, dueSession: 130 })
    : progress({ status: "review", lastSeenSession: 50, dueSession: 99 })
])));
const masteredPressurePlan = planUnitedStatesMemoryTrailSession(masteredPressureState, items, { seed: "fairness:mastered-pressure", now: fixedNow });
assert.equal(masteredPressurePlan.playItems.some(({ id }) => masteredPressureState.itemProgress[id].status === "mastered"), false);
assert.equal(masteredPressurePlan.fairnessReviewItems.every(({ id }) => masteredPressureState.itemProgress[id].dueSession <= 100), true);

console.log("United States cumulative-review fairness validation passed.");
