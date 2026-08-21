import assert from "node:assert/strict";
import {
  createDailyTrailState,
  dailyTrailId,
  dailyTrailUsCapitalsGoalId,
  planDailyTrailSession
} from "../src/daily-trail-planner.js";

const fixedNow = "2026-08-21T12:00:00.000Z";
const persistentWeakId = "us-capitals:capital:persistent-weak";
const waitingIds = Array.from({ length: 11 }, (_, index) => `us-capitals:capital:waiting-${index + 1}`);

function item(id, order, homeActivityId, homeStepIndex) {
  return {
    id,
    trailGoalId: dailyTrailUsCapitalsGoalId,
    targetId: id.replace("us-capitals:capital:", ""),
    label: id.replace("us-capitals:capital:", ""),
    type: "capital",
    homeActivityId,
    homeJourneyId: "us-capitals",
    homeStepId: homeActivityId,
    homeStepIndex,
    activityTitle: homeActivityId,
    cameraGroupId: homeActivityId,
    order
  };
}

const oldItems = [persistentWeakId, ...waitingIds].map((id, index) => (
  item(id, index, "us-capitals-01", 0)
));
const newItems = Array.from({ length: 3 }, (_, index) => (
  item(`us-capitals:capital:new-${index + 1}`, 1000 + index, "us-capitals-02", 1)
));
const futureMasteredItem = item("us-capitals:capital:future-mastered", 13, "us-capitals-01", 0);
const items = [...oldItems, futureMasteredItem, ...newItems];

let state = createDailyTrailState({
  hasStarted: true,
  activeTrailGoal: dailyTrailUsCapitalsGoalId,
  completedGoalIds: [dailyTrailId],
  currentSessionNumber: 20,
  continentsOceansProgress: { completedOnce: true, masteryStatus: "mastered" },
  introducedItemIds: [...oldItems.map(({ id }) => id), futureMasteredItem.id],
  itemProgress: Object.fromEntries([
    [persistentWeakId, {
      status: "review",
      memoryState: "relearning",
      timesSeen: 9,
      correctCount: 1,
      correctStreak: 0,
      missCount: 8,
      lapseCount: 4,
      lastSeenSession: 19,
      lastReviewedSession: 19,
      dueSession: 1,
      stability: 0.5,
      retrievability: 0.1
    }],
    ...waitingIds.map((id, index) => [id, {
      status: "review",
      memoryState: "review",
      timesSeen: 3,
      correctCount: 3,
      correctStreak: 3,
      missCount: 0,
      lastSeenSession: index + 1,
      lastReviewedSession: index + 1,
      dueSession: 1,
      stability: 4,
      retrievability: 0.4
    }]),
    [futureMasteredItem.id, {
      status: "mastered",
      memoryState: "review",
      timesSeen: 8,
      correctCount: 8,
      correctStreak: 8,
      missCount: 0,
      lastSeenSession: 18,
      lastReviewedSession: 18,
      dueSession: 1000,
      stability: 120,
      retrievability: 0.95
    }]
  ])
});

const firstOptions = { seed: "daily-starvation:0", now: fixedNow };
const firstPlan = planDailyTrailSession(state, items, firstOptions);
assert.deepEqual(
  firstPlan.playItems.map(({ id }) => id),
  planDailyTrailSession(state, items, firstOptions).playItems.map(({ id }) => id),
  "Identical state and seed must replay the same Daily Trail fairness composition."
);

const selectedWaitingIds = [];
for (let session = 0; session < waitingIds.length; session += 1) {
  const plan = planDailyTrailSession(state, items, {
    seed: `daily-starvation:${session}`,
    now: fixedNow
  });
  const planIds = new Set(plan.playItems.map(({ id }) => id));
  const selectedWaitingId = waitingIds.find((id) => planIds.has(id));

  assert.equal(plan.sessionType, "learning-session");
  assert.deepEqual(plan.newItems.map(({ id }) => id), newItems.map(({ id }) => id), "Review fairness must not alter new-item progression.");
  assert.ok(planIds.has(persistentWeakId), "The persistent weak item must retain strong remediation pressure.");
  assert.ok(selectedWaitingId, "The old-section review lane must serve an eligible waiting due item.");
  assert.equal(planIds.has(futureMasteredItem.id), false, "Future-due mastered material must continue to recede.");

  selectedWaitingIds.push(selectedWaitingId);
  state = createDailyTrailState({
    ...state,
    currentSessionNumber: state.currentSessionNumber + 1,
    itemProgress: {
      ...state.itemProgress,
      [persistentWeakId]: {
        ...state.itemProgress[persistentWeakId],
        missCount: state.itemProgress[persistentWeakId].missCount + 1,
        lastSeenSession: state.currentSessionNumber,
        lastReviewedSession: state.currentSessionNumber,
        dueSession: state.currentSessionNumber
      },
      [selectedWaitingId]: {
        ...state.itemProgress[selectedWaitingId],
        lastSeenSession: state.currentSessionNumber,
        lastReviewedSession: state.currentSessionNumber,
        dueSession: 1000
      }
    }
  });
}

assert.deepEqual(
  new Set(selectedWaitingIds),
  new Set(waitingIds),
  "A persistently failed item must not permanently starve any other eligible due item."
);

console.log("Daily Trail starvation-protection validation passed.");
