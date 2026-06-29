import assert from "node:assert/strict";
import {
  createDailyTrailState,
  dailyTrailId,
  dailyTrailUsCapitalsGoalId,
  planDailyTrailSession
} from "../src/daily-trail-planner.js";

const completedWorldCoreState = createDailyTrailState({
  hasStarted: true,
  pathCompleted: false,
  completedGoalIds: [dailyTrailId],
  activeTrailGoal: dailyTrailUsCapitalsGoalId,
  currentSessionNumber: 8,
  continentsOceansProgress: {
    completedOnce: true,
    masteryStatus: "mastered"
  },
  itemProgress: {
    "us-capitals:capital:boston": {
      status: "review",
      timesSeen: 3,
      correctCount: 3,
      correctStreak: 3,
      lastSeenSession: 2,
      lastReviewedSession: 2,
      dueSession: 20
    },
    "us-capitals:capital:augusta-me": {
      status: "review",
      timesSeen: 3,
      correctCount: 3,
      correctStreak: 3,
      lastSeenSession: 2,
      lastReviewedSession: 2,
      dueSession: 20
    },
    "us-capitals:capital:montpelier-vt": {
      status: "review",
      timesSeen: 3,
      correctCount: 3,
      correctStreak: 3,
      lastSeenSession: 2,
      lastReviewedSession: 2,
      dueSession: 20
    }
  },
  introducedItemIds: [
    "us-capitals:capital:boston",
    "us-capitals:capital:augusta-me",
    "us-capitals:capital:montpelier-vt"
  ]
});

const items = [
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
  },
  {
    id: "us-capitals:capital:montpelier-vt",
    trailGoalId: dailyTrailUsCapitalsGoalId,
    targetId: "montpelier-vt",
    label: "Montpelier",
    type: "capital",
    homeActivityId: "us-capitals-01",
    homeJourneyId: "us-capitals",
    homeStepId: "us-capitals-01",
    homeStepIndex: 0,
    activityTitle: "New England Capitals",
    cameraGroupId: "capitals",
    order: 2
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

const plan = planDailyTrailSession(completedWorldCoreState, items);
const oldReviewItems = plan.reviewItems.filter((item) => item.homeActivityId === "us-capitals-01");

assert.equal(plan.sessionType, "learning-session");
assert.equal(plan.activeActivityId, "us-capitals-02");
assert.deepEqual(plan.newItems.map((item) => item.targetId), ["albany-ny", "trenton-nj", "dover-de"]);
assert.equal(oldReviewItems.length, 1, "A later learning section should include exactly one old completed-section review item.");
assert.ok(plan.playItems.some((item) => item.id === oldReviewItems[0].id), "The old review item must be sent in playItems.");
assert.ok(!plan.newItems.some((item) => item.id === oldReviewItems[0].id), "The old review item must not be treated as new.");

const incompleteSectionState = createDailyTrailState({
  ...completedWorldCoreState,
  itemProgress: {
    ...completedWorldCoreState.itemProgress,
    "us-capitals:capital:montpelier-vt": {
      status: "unseen",
      timesSeen: 0,
      correctCount: 0,
      correctStreak: 0
    }
  }
});
const incompletePlan = planDailyTrailSession(incompleteSectionState, items);

assert.equal(
  incompletePlan.reviewItems.some((item) => item.id === "us-capitals:capital:montpelier-vt"),
  false,
  "Unseen items from previous sections should not be selected as old review."
);

console.log("Daily Trail old-section review check passed:", JSON.stringify({
  activeActivityId: plan.activeActivityId,
  newTargets: plan.newItems.map((item) => item.targetId),
  oldReviewTarget: oldReviewItems[0].targetId
}));
