import assert from "node:assert/strict";
import fs from "node:fs";
import {
  applyDailyTrailSessionResults,
  applyDailyTrailTeachingProgress,
  createDailyTrailState,
  dailyTrailId,
  dailyTrailUsCapitalsGoalId,
  getDailyTrailGoalOptions,
  getNextDailyTrailGoal,
  isDailyTrailPathComplete,
  planCompletedDailyTrailReviewSession,
  planDailyTrailSession,
  startNextDailyTrailGoal
} from "../src/daily-trail-planner.js";

const worldCoreItems = [
  {
    id: "continent:north-america",
    targetId: "north-america",
    homeActivityId: "continents-oceans",
    homeJourneyId: "world-geography-core",
    homeStepId: "continents-oceans",
    homeStepIndex: 0,
    activityTitle: "Continents and Oceans",
    cameraGroupId: "world",
    order: 0
  },
  {
    id: "country:china",
    targetId: "china",
    homeActivityId: "world-core-east-southeast-asia-oceania-countries",
    homeJourneyId: "world-geography-core",
    homeStepId: "world-core-east-southeast-asia-oceania-countries",
    homeStepIndex: 16,
    activityTitle: "Core Countries: East Asia, Southeast Asia, and Oceania",
    cameraGroupId: "world-core-east-southeast-asia-oceania-countries",
    order: 16000
  }
];

const capitalsItems = [
  {
    id: "us-capitals:capital:boston",
    trailGoalId: dailyTrailUsCapitalsGoalId,
    targetId: "boston",
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
    homeActivityId: "us-capitals-01",
    homeJourneyId: "us-capitals",
    homeStepId: "us-capitals-01",
    homeStepIndex: 0,
    activityTitle: "New England Capitals",
    cameraGroupId: "capitals",
    order: 1
  }
];

const migratedState = createDailyTrailState({ pathCompleted: true });
assert.deepEqual(migratedState.completedGoalIds, [dailyTrailId], "Legacy terminal World Core progress must migrate.");
assert.deepEqual(
  getDailyTrailGoalOptions(createDailyTrailState()).map((goal) => goal.id),
  [dailyTrailId],
  "U.S. Capitals must remain locked until World Core is complete."
);

const completedWorldCoreState = createDailyTrailState({
  hasStarted: true,
  pathCompleted: true,
  itemProgress: {
    "continent:north-america": { status: "review", timesSeen: 3, correctCount: 3, correctStreak: 3 },
    "country:china": { status: "review", timesSeen: 3, correctCount: 3, correctStreak: 3 }
  },
  introducedItemIds: worldCoreItems.map((item) => item.id),
  continentsOceansProgress: {
    completedOnce: true,
    masteryStatus: "mastered",
    introducedItemIds: ["continent:north-america"],
    quizCoveredItemIds: ["continent:north-america"]
  }
});

assert.equal(isDailyTrailPathComplete(completedWorldCoreState, worldCoreItems), true);
assert.equal(getNextDailyTrailGoal(completedWorldCoreState)?.id, dailyTrailUsCapitalsGoalId);
assert.deepEqual(
  getDailyTrailGoalOptions(completedWorldCoreState).map((goal) => goal.id),
  [dailyTrailId, dailyTrailUsCapitalsGoalId]
);

const capitalsState = startNextDailyTrailGoal(completedWorldCoreState);
assert.equal(capitalsState.activeTrailGoal, dailyTrailUsCapitalsGoalId);
assert.equal(capitalsState.pathCompleted, false);
assert.ok(capitalsState.completedGoalIds.includes(dailyTrailId));
assert.equal(capitalsState.itemProgress["country:china"].status, "review", "Prior World Core progress must remain intact.");
assert.equal(capitalsState.sessionsSinceLastCheckpoint, 0, "A new goal starts a fresh checkpoint cadence.");

const capitalsPlan = planDailyTrailSession(capitalsState, capitalsItems);
assert.equal(capitalsPlan.trailGoalId, dailyTrailUsCapitalsGoalId);
assert.equal(capitalsPlan.activeActivityId, "us-capitals-01");
assert.deepEqual(capitalsPlan.newItems.map((item) => item.targetId), ["boston", "augusta-me"]);

let completedCapitalsState = capitalsState;
capitalsPlan.newItems.forEach((item) => {
  completedCapitalsState = applyDailyTrailTeachingProgress(completedCapitalsState, capitalsPlan, item.targetId);
});
completedCapitalsState = applyDailyTrailSessionResults(completedCapitalsState, capitalsPlan, {
  completedTargetIds: capitalsPlan.playItems.map((item) => item.targetId),
  correctCount: capitalsPlan.playItems.length,
  incorrectCount: 0,
  missesByTargetId: {}
});

assert.equal(completedCapitalsState.pathCompleted, true);
assert.ok(completedCapitalsState.completedGoalIds.includes(dailyTrailId));
assert.ok(completedCapitalsState.completedGoalIds.includes(dailyTrailUsCapitalsGoalId));
assert.equal(getNextDailyTrailGoal(completedCapitalsState), null, "The final defined goal should not invent a successor.");

const capitalsReviewPlan = planCompletedDailyTrailReviewSession(completedCapitalsState, capitalsItems);
assert.equal(capitalsReviewPlan.trailGoalId, dailyTrailUsCapitalsGoalId);
assert.ok(capitalsReviewPlan.playItems.length > 0);
assert.ok(capitalsReviewPlan.playItems.every((item) => item.trailGoalId === dailyTrailUsCapitalsGoalId));

const runtimeSource = fs.readFileSync(new URL("../src/maplibre-poc.js", import.meta.url), "utf8");
[
  "Start Next Daily Trail",
  "function startNextDailyTrail()",
  "startNextDailyTrailGoal(currentState, nextGoal.id)",
  "getNextDailyTrailGoal(state)"
].forEach((hook) => assert.ok(runtimeSource.includes(hook), `Missing curriculum handoff hook: ${hook}`));

console.log("Daily Trail curriculum progression check passed:", JSON.stringify({
  completedGoalIds: completedCapitalsState.completedGoalIds,
  nextGoal: dailyTrailUsCapitalsGoalId,
  firstCapitalsActivity: capitalsPlan.activeActivityId,
  reviewQueueLength: capitalsReviewPlan.playItems.length
}));
