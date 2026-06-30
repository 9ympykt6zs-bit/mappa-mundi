import assert from "node:assert/strict";
import {
  createDailyTrailState,
  dailyTrailUsCapitalsGoalId,
  planDailyTrailSession
} from "../src/daily-trail-planner.js";

const previousCapitalItems = [
  {
    id: "us-capitals:capital:boston",
    trailGoalId: dailyTrailUsCapitalsGoalId,
    targetId: "boston",
    label: "Boston",
    type: "capital",
    homeActivityId: "us-capitals-01",
    homeJourneyId: "us-capitals",
    homeStepId: "us-capitals-01",
    homeStepIndex: 0,
    activityTitle: "New England Capitals",
    cameraGroupId: "capitals",
    order: 0
  },
  {
    id: "us-capitals:capital:augusta-me",
    trailGoalId: dailyTrailUsCapitalsGoalId,
    targetId: "augusta-me",
    label: "Augusta",
    type: "capital",
    homeActivityId: "us-capitals-01",
    homeJourneyId: "us-capitals",
    homeStepId: "us-capitals-01",
    homeStepIndex: 0,
    activityTitle: "New England Capitals",
    cameraGroupId: "capitals",
    order: 1
  }
];

const currentCapitalItems = [
  {
    id: "us-capitals:capital:harrisburg-pa",
    trailGoalId: dailyTrailUsCapitalsGoalId,
    targetId: "harrisburg-pa",
    label: "Harrisburg",
    type: "capital",
    homeActivityId: "us-capitals-02",
    homeJourneyId: "us-capitals",
    homeStepId: "us-capitals-02",
    homeStepIndex: 1,
    activityTitle: "Northeast / Mid-Atlantic Capitals",
    cameraGroupId: "capitals",
    order: 999
  },
  {
    id: "us-capitals:capital:albany-ny",
    trailGoalId: dailyTrailUsCapitalsGoalId,
    targetId: "albany-ny",
    label: "Albany",
    type: "capital",
    homeActivityId: "us-capitals-02",
    homeJourneyId: "us-capitals",
    homeStepId: "us-capitals-02",
    homeStepIndex: 1,
    activityTitle: "Northeast / Mid-Atlantic Capitals",
    cameraGroupId: "capitals",
    order: 1000
  },
  {
    id: "us-capitals:capital:trenton-nj",
    trailGoalId: dailyTrailUsCapitalsGoalId,
    targetId: "trenton-nj",
    label: "Trenton",
    type: "capital",
    homeActivityId: "us-capitals-02",
    homeJourneyId: "us-capitals",
    homeStepId: "us-capitals-02",
    homeStepIndex: 1,
    activityTitle: "Northeast / Mid-Atlantic Capitals",
    cameraGroupId: "capitals",
    order: 1001
  },
  {
    id: "us-capitals:capital:dover-de",
    trailGoalId: dailyTrailUsCapitalsGoalId,
    targetId: "dover-de",
    label: "Dover",
    type: "capital",
    homeActivityId: "us-capitals-02",
    homeJourneyId: "us-capitals",
    homeStepId: "us-capitals-02",
    homeStepIndex: 1,
    activityTitle: "Northeast / Mid-Atlantic Capitals",
    cameraGroupId: "capitals",
    order: 1002
  }
];

const state = createDailyTrailState({
  hasStarted: true,
  activeTrailGoal: dailyTrailUsCapitalsGoalId,
  currentSessionNumber: 8,
  continentsOceansProgress: {
    completedOnce: true,
    masteryStatus: "mastered"
  },
  introducedItemIds: previousCapitalItems.map((item) => item.id),
  itemProgress: {
    "us-capitals:capital:boston": {
      status: "learning",
      timesSeen: 3,
      correctCount: 2,
      missCount: 2,
      correctStreak: 0,
      lastSeenSession: 7,
      lastReviewedSession: 7,
      memoryState: "relearning",
      dueSession: 8
    },
    "us-capitals:capital:augusta-me": {
      status: "review",
      timesSeen: 3,
      correctCount: 3,
      missCount: 0,
      correctStreak: 3,
      lastSeenSession: 2,
      lastReviewedSession: 2,
      memoryState: "review",
      dueSession: 20
    }
  }
});

const plan = planDailyTrailSession(state, [...previousCapitalItems, ...currentCapitalItems.slice(1)]);
const reviewIds = plan.reviewItems.map((item) => item.id);

assert.equal(plan.sessionType, "learning-session");
assert.equal(plan.activeActivityId, "us-capitals-02");
assert.deepEqual(plan.newItems.map((item) => item.targetId), ["albany-ny", "trenton-nj", "dover-de"]);
assert.ok(reviewIds.includes("us-capitals:capital:boston"), "Weak/missed item should be inserted as review.");
assert.ok(!plan.newItems.some((item) => item.id === "us-capitals:capital:boston"), "Weak review must not be treated as new.");
assert.equal(
  reviewIds.filter((id) => id === "us-capitals:capital:boston").length,
  1,
  "Weak review item must not be duplicated by old-review selection."
);
assert.ok(reviewIds.includes("us-capitals:capital:augusta-me"), "Old-review selection should still be able to choose a separate review item.");

const noWeakState = createDailyTrailState({
  ...state,
  itemProgress: {
    ...state.itemProgress,
    "us-capitals:capital:boston": {
      ...state.itemProgress["us-capitals:capital:boston"],
      status: "review",
      missCount: 0,
      lapseCount: 0,
      correctStreak: 3,
      memoryState: "review",
      dueSession: 20
    }
  }
});
const noWeakPlan = planDailyTrailSession(noWeakState, [...previousCapitalItems, ...currentCapitalItems]);

assert.equal(noWeakPlan.sessionType, "learning-session");
assert.equal(noWeakPlan.activeActivityId, "us-capitals-02");

const sameActivityWeakState = createDailyTrailState({
  ...state,
  introducedItemIds: [
    ...state.introducedItemIds,
    "us-capitals:capital:harrisburg-pa"
  ],
  itemProgress: {
    ...state.itemProgress,
    "us-capitals:capital:boston": {
      ...state.itemProgress["us-capitals:capital:boston"],
      status: "review",
      missCount: 0,
      lapseCount: 0,
      correctStreak: 3,
      memoryState: "review",
      dueSession: 20
    },
    "us-capitals:capital:harrisburg-pa": {
      status: "learning",
      timesSeen: 3,
      correctCount: 1,
      missCount: 3,
      correctStreak: 0,
      lastSeenSession: 7,
      lastReviewedSession: 7,
      memoryState: "relearning",
      dueSession: 8
    }
  }
});
const sameActivityWeakPlan = planDailyTrailSession(sameActivityWeakState, [...previousCapitalItems, ...currentCapitalItems]);
const sameActivityReviewIds = sameActivityWeakPlan.reviewItems.map((item) => item.id);

assert.equal(sameActivityWeakPlan.sessionType, "learning-session");
assert.equal(sameActivityWeakPlan.activeActivityId, "us-capitals-02");
assert.deepEqual(sameActivityWeakPlan.newItems.map((item) => item.targetId), ["albany-ny", "trenton-nj", "dover-de"]);
assert.ok(sameActivityReviewIds.includes("us-capitals:capital:harrisburg-pa"), "Weak review can come from the active activity when it is not in the new batch.");
assert.ok(!sameActivityWeakPlan.newItems.some((item) => item.id === "us-capitals:capital:harrisburg-pa"), "Same-activity weak review must not be treated as new.");

console.log("Daily Trail weak-review check passed:", JSON.stringify({
  activeActivityId: plan.activeActivityId,
  newTargets: plan.newItems.map((item) => item.targetId),
  reviewTargets: plan.reviewItems.map((item) => item.targetId)
}));
