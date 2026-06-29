import assert from "node:assert/strict";
import {
  createDailyTrailState,
  dailyTrailId,
  dailyTrailUsCapitalsGoalId,
  planDailyTrailSession
} from "../src/daily-trail-planner.js";

const items = [
  {
    id: "country:mexico",
    trailGoalId: dailyTrailId,
    targetId: "mexico",
    label: "Mexico",
    type: "country",
    homeActivityId: "world-core-americas-countries",
    homeJourneyId: "world-geography-core",
    homeStepId: "world-core-americas-countries",
    homeStepIndex: 12,
    activityTitle: "Core Countries: Americas",
    cameraGroupId: "world-core-americas",
    order: 12001
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
    order: 21000
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
    order: 21001
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
    order: 21002
  }
];

const state = createDailyTrailState({
  hasStarted: true,
  activeTrailGoal: dailyTrailUsCapitalsGoalId,
  completedGoalIds: [dailyTrailId],
  currentSessionNumber: 8,
  continentsOceansProgress: {
    completedOnce: true,
    masteryStatus: "mastered"
  },
  introducedItemIds: ["country:mexico"],
  itemProgress: {
    "country:mexico": {
      status: "review",
      timesSeen: 3,
      correctCount: 3,
      correctStreak: 3,
      lastSeenSession: 2,
      lastReviewedSession: 2,
      dueSession: 20
    }
  }
});

const plan = planDailyTrailSession(state, items);
const oldWorldCoreReviewItems = plan.reviewItems.filter((item) => item.trailGoalId === dailyTrailId);

assert.equal(plan.sessionType, "learning-session");
assert.equal(plan.activeActivityId, "us-capitals-02");
assert.deepEqual(plan.newItems.map((item) => item.targetId), ["albany-ny", "trenton-nj", "dover-de"]);
assert.equal(oldWorldCoreReviewItems.length, 1, "State Capitals learning should be able to receive a World Core old-review item.");
assert.equal(oldWorldCoreReviewItems[0].type, "country", "World Core old review should preserve country semantics.");
assert.equal(oldWorldCoreReviewItems[0].targetId, "mexico");
assert.ok(plan.playItems.some((item) => item.id === oldWorldCoreReviewItems[0].id));
assert.ok(!plan.newItems.some((item) => item.id === oldWorldCoreReviewItems[0].id));

const unseenState = createDailyTrailState({
  ...state,
  introducedItemIds: [],
  itemProgress: {}
});
const unseenPlan = planDailyTrailSession(unseenState, items);

assert.equal(
  unseenPlan.reviewItems.some((item) => item.trailGoalId === dailyTrailId),
  false,
  "Unseen World Core items must not be selected as old review."
);

console.log("Daily Trail global old-review check passed:", JSON.stringify({
  activeActivityId: plan.activeActivityId,
  newTargets: plan.newItems.map((item) => item.targetId),
  oldReviewTarget: oldWorldCoreReviewItems[0].targetId,
  oldReviewType: oldWorldCoreReviewItems[0].type
}));
