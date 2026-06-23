import assert from "node:assert/strict";
import fs from "node:fs";
import {
  applyDailyTrailSessionResults,
  applyDailyTrailTeachingProgress,
  createDailyTrailState,
  isDailyTrailPathComplete,
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
  }
];

let state = createDailyTrailState({
  hasStarted: true,
  currentSessionNumber: 24,
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
  "heading.textContent = \"Daily Trail Finished\";",
  "Choose Another Activity"
].forEach((hook) => assert.ok(runtimeSource.includes(hook), `Missing terminal Daily Trail UI hook: ${hook}`));

console.log("Daily Trail terminal completion check passed:", JSON.stringify({
  finalLearningTargets: finalLearningPlan.playItems.map((item) => item.targetId),
  terminalSessionType: terminalPlan.sessionType,
  terminalQueueLength: terminalPlan.playItems.length,
  pathCompleted: state.pathCompleted
}));
