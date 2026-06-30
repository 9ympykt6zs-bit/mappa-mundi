import assert from "node:assert/strict";
import fs from "node:fs";
import {
  applyDailyTrailSessionResults,
  applyDailyTrailTeachingProgress,
  createDailyTrailState,
  isDailyTrailPathComplete,
  planCompletedDailyTrailReviewSession,
  planDailyTrailSession
} from "../src/daily-trail-planner.js";

const items = [
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
    id: "state:alaska",
    targetId: "alaska",
    homeActivityId: "us-states-11",
    homeJourneyId: "world-geography-core",
    homeStepId: "us-states-11",
    homeStepIndex: 10,
    activityTitle: "Alaska and Hawaii States",
    cameraGroupId: "us-states-11",
    order: 10000
  },
  {
    id: "state:hawaii",
    targetId: "hawaii",
    homeActivityId: "us-states-11",
    homeJourneyId: "world-geography-core",
    homeStepId: "us-states-11",
    homeStepIndex: 10,
    activityTitle: "Alaska and Hawaii States",
    cameraGroupId: "us-states-11",
    order: 10001
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
  },
  {
    id: "us-capitals:capital:juneau-ak",
    trailGoalId: "us-capitals",
    targetId: "juneau-ak",
    homeActivityId: "us-capitals-11",
    homeJourneyId: "us-capitals",
    homeStepId: "us-capitals-11",
    homeStepIndex: 10,
    activityTitle: "Alaska and Hawaii Capitals",
    cameraGroupId: "us-capitals-11",
    type: "capital",
    order: 21000
  },
  {
    id: "us-capitals:capital:honolulu-hi",
    trailGoalId: "us-capitals",
    targetId: "honolulu-hi",
    homeActivityId: "us-capitals-11",
    homeJourneyId: "us-capitals",
    homeStepId: "us-capitals-11",
    homeStepIndex: 10,
    activityTitle: "Alaska and Hawaii Capitals",
    cameraGroupId: "us-capitals-11",
    type: "capital",
    order: 21001
  }
];

let state = createDailyTrailState({
  hasStarted: true,
  currentSessionNumber: 24,
  activeTrailGoal: "world-core",
  itemProgress: {
    "continent:north-america": { status: "review", timesSeen: 3, correctCount: 3, correctStreak: 3, dueSession: 30 },
    "state:alaska": { status: "review", timesSeen: 3, correctCount: 3, correctStreak: 3, dueSession: 30 },
    "state:hawaii": { status: "review", timesSeen: 3, correctCount: 3, correctStreak: 3, dueSession: 30 }
  },
  introducedItemIds: ["continent:north-america", "state:alaska", "state:hawaii"],
  continentsOceansProgress: {
    completedOnce: true,
    masteryStatus: "mastered",
    lastReviewedSession: 23,
    introducedItemIds: ["continent:north-america"],
    quizCoveredItemIds: ["continent:north-america"]
  }
});

const finalLearningPlan = planDailyTrailSession(state, items);
assert.equal(finalLearningPlan.sessionType, "learning-session");
assert.deepEqual(finalLearningPlan.newItems.map((item) => item.targetId), ["china"]);

state = applyDailyTrailTeachingProgress(state, finalLearningPlan, "china");
state = applyDailyTrailSessionResults(state, finalLearningPlan, {
  completedTargetIds: ["china"],
  correctCount: 1,
  incorrectCount: 0,
  missesByTargetId: {}
});

assert.equal(state.pathCompleted, true, "Finishing the final planned item must persist a terminal trail state.");
assert.equal(state.lastSessionSummary?.trailCompleted, true);
assert.equal(isDailyTrailPathComplete(state, items), true);

const terminalPlan = planDailyTrailSession(state, items);
assert.equal(terminalPlan.sessionType, "complete");
assert.equal(terminalPlan.trailCompleted, true);
assert.deepEqual(terminalPlan.playItems, []);
assert.deepEqual(terminalPlan.reviewItems, []);
assert.deepEqual(terminalPlan.newItems, []);

const completedTrailReviewPlan = planCompletedDailyTrailReviewSession(state, items);
assert.equal(completedTrailReviewPlan.sessionType, "completed-trail-review");
assert.ok(completedTrailReviewPlan.playItems.length > 0, "Completed material must be reviewable.");
assert.ok(completedTrailReviewPlan.playItems.length <= 10, "Completed-trail review must remain bounded.");
assert.equal(
  new Set(completedTrailReviewPlan.playItems.map((item) => item.id)).size,
  completedTrailReviewPlan.playItems.length,
  "Completed-trail review must not repeat an item in one session."
);
assert.ok(completedTrailReviewPlan.activityGroups.length > 1, "Completed-trail review should draw from multiple completed activities when available.");
assert.equal(completedTrailReviewPlan.completedTrailReviewMixed, true);
assert.ok(
  completedTrailReviewPlan.playItems.some((item) => item.id === "continent:north-america"),
  "Completed-trail review should include earlier World Core material."
);
assert.ok(
  completedTrailReviewPlan.playItems.some((item) => item.id === "state:alaska"),
  "Completed-trail review should preserve state-location items as state review."
);

const completedCapitalsState = createDailyTrailState({
  ...state,
  activeTrailGoal: "us-capitals",
  completedGoalIds: ["world-core", "us-capitals"],
  pathCompleted: true,
  itemProgress: {
    ...state.itemProgress,
    "country:china": { status: "review", timesSeen: 2, correctCount: 2, correctStreak: 2, dueSession: 30 },
    "us-capitals:capital:juneau-ak": { status: "review", timesSeen: 3, correctCount: 3, correctStreak: 3, dueSession: 30 },
    "us-capitals:capital:honolulu-hi": { status: "review", timesSeen: 3, correctCount: 3, correctStreak: 3, dueSession: 30 }
  },
  introducedItemIds: [
    ...state.introducedItemIds,
    "country:china",
    "us-capitals:capital:juneau-ak",
    "us-capitals:capital:honolulu-hi"
  ]
});
const completedCapitalsReviewPlan = planCompletedDailyTrailReviewSession(completedCapitalsState, items);
assert.equal(completedCapitalsReviewPlan.sessionType, "completed-trail-review");
assert.ok(
  completedCapitalsReviewPlan.playItems.some((item) => item.id === "us-capitals:capital:juneau-ak" && item.homeActivityId === "us-capitals-11" && item.type === "capital"),
  "Terminal review must preserve State Capitals targets as capital review items."
);
assert.ok(
  completedCapitalsReviewPlan.playItems.some((item) => item.id === "state:alaska" && item.homeActivityId === "us-states-11"),
  "Terminal review may include state-location items, but they must remain separate from capital items."
);
assert.notEqual(
  completedCapitalsReviewPlan.playItems.filter((item) => item.homeActivityId === "us-states-11").length,
  completedCapitalsReviewPlan.playItems.length,
  "Terminal review must not fall back to only Alaska/Hawaii state-location review when broader material exists."
);

const reviewResultState = applyDailyTrailSessionResults(state, completedTrailReviewPlan, {
  completedTargetIds: completedTrailReviewPlan.playItems.map((item) => item.targetId),
  correctCount: completedTrailReviewPlan.playItems.length,
  incorrectCount: 0,
  missesByTargetId: {}
});
assert.equal(reviewResultState.pathCompleted, true, "Reviewing completed material must not reopen the trail.");

const legacyCompleteState = createDailyTrailState({ ...state, pathCompleted: false });
assert.equal(
  planDailyTrailSession(legacyCompleteState, items).sessionType,
  "complete",
  "Existing fully covered World Core progress must receive the terminal state without a reset."
);
assert.equal(isDailyTrailPathComplete(createDailyTrailState(), items), false, "A reset Daily Trail must remain startable.");

const runtimeSource = fs.readFileSync(new URL("../src/maplibre-poc.js", import.meta.url), "utf8");
[
  "if (plan.trailCompleted) {\n    renderDailyTrailFinishedPanel();",
  "if (summary.trailCompleted) {\n    renderDailyTrailFinishedPanel();",
  "heading.textContent = \"Daily Trail complete\";",
  "Review Completed Trail",
  "planCompletedDailyTrailReviewSession",
  "completedTrailReviewMixed",
  "function isSegmentedCompletedDailyTrailReviewPlan",
  "const completedReviewActivityGroups = isSegmentedCompletedDailyTrailReviewPlan(plan)",
  "function isSegmentedCompletedDailyTrailReviewSession()",
  "function advanceSegmentedCompletedDailyTrailReview()",
  "mergeDailyTrailCompletedReviewResult(activeDailyTrailSession, result)",
  "const presentationItemsForActivity = getDailyTrailPresentationItemsForActivity(activity, dailyTrailSession.plan, dailyTrailSession.state, plannedItemsForActivity);",
  "dailyTrailTargetIds: presentationTargetIds.length > 0 ? presentationTargetIds : plannedTargetIds",
  "function getDailyTrailPresentationItemsForActivity(activity, plan, state, fallbackItems = [])",
  "Choose Another Activity"
].forEach((hook) => assert.ok(runtimeSource.includes(hook), `Missing terminal Daily Trail UI hook: ${hook}`));

const plannedItemsStart = runtimeSource.indexOf("function getDailyTrailPlannedItemsForActivity(activity, plan)");
const plannedItemsEnd = runtimeSource.indexOf("function isDailyTrailRenderableActivityItem", plannedItemsStart);
const plannedItemsSource = runtimeSource.slice(plannedItemsStart, plannedItemsEnd);
assert.ok(
  plannedItemsSource.includes("isDailyTrailCheckpointPlan(plan) || isSegmentedCompletedDailyTrailReviewPlan(plan)"),
  "Segmented completed review must use direct activity items only."
);
const presentationItemsStart = runtimeSource.indexOf("function getDailyTrailPresentationItemsForActivity(activity, plan, state, fallbackItems = [])");
const presentationItemsEnd = runtimeSource.indexOf("function isDailyTrailRenderableActivityItem", presentationItemsStart);
const presentationItemsSource = runtimeSource.slice(presentationItemsStart, presentationItemsEnd);
assert.ok(
  presentationItemsSource.includes("plan?.sessionType !== \"completed-trail-review\""),
  "Only completed-trail review should broaden map presentation context."
);
assert.ok(
  presentationItemsSource.includes(".filter((item) => !isDailyTrailItemUnseen(state, item))"),
  "Completed-trail review presentation context must not include unseen items."
);
const memoryTrailStart = runtimeSource.indexOf("return startMemoryTrail({");
const memoryTrailEnd = runtimeSource.indexOf("checkpointReview: isDailyTrailCheckpointPlan", memoryTrailStart);
const memoryTrailSource = runtimeSource.slice(memoryTrailStart, memoryTrailEnd);
assert.ok(memoryTrailSource.includes("targetIds,"), "Memory Trail quiz target IDs must remain the planned review targets.");

console.log("Daily Trail terminal completion check passed:", JSON.stringify({
  finalLearningTargets: finalLearningPlan.playItems.map((item) => item.targetId),
  terminalSessionType: terminalPlan.sessionType,
  terminalQueueLength: terminalPlan.playItems.length,
  completedReviewQueueLength: completedTrailReviewPlan.playItems.length,
  pathCompleted: state.pathCompleted
}));
