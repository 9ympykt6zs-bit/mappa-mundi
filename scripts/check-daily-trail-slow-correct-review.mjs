import assert from "node:assert/strict";
import fs from "node:fs";
import {
  applyDailyTrailSessionResults,
  createDailyTrailState,
  DAILY_TRAIL_AFK_RESPONSE_MS,
  dailyTrailUsCapitalsGoalId,
  DAILY_TRAIL_SLOW_CORRECT_MS,
  planDailyTrailSession
} from "../src/daily-trail-planner.js";

const items = [
  createCapitalItem("us-capitals:capital:boston", "boston", "Boston", 0, "us-capitals-01"),
  createCapitalItem("us-capitals:capital:augusta-me", "augusta-me", "Augusta", 1, "us-capitals-01"),
  createCapitalItem("us-capitals:capital:harrisburg-pa", "harrisburg-pa", "Harrisburg", 2, "us-capitals-02"),
  createCapitalItem("us-capitals:capital:albany-ny", "albany-ny", "Albany", 3, "us-capitals-02"),
  createCapitalItem("us-capitals:capital:trenton-nj", "trenton-nj", "Trenton", 4, "us-capitals-02"),
  createCapitalItem("us-capitals:capital:dover-de", "dover-de", "Dover", 5, "us-capitals-02")
];

const baseState = createDailyTrailState({
  hasStarted: true,
  activeTrailGoal: dailyTrailUsCapitalsGoalId,
  currentSessionNumber: 8,
  continentsOceansProgress: {
    completedOnce: true,
    masteryStatus: "mastered"
  },
  introducedItemIds: [
    "us-capitals:capital:boston",
    "us-capitals:capital:augusta-me"
  ],
  itemProgress: {
    "us-capitals:capital:boston": createReviewProgress({ dueSession: 20 }),
    "us-capitals:capital:augusta-me": createReviewProgress({ dueSession: 20 })
  }
});

const practicePlan = {
  sessionType: "learning",
  playItems: [items[0]],
  newItems: [],
  reviewItems: [items[0]],
  allItems: items,
  trailGoalId: dailyTrailUsCapitalsGoalId
};

const fastCorrectState = applyDailyTrailSessionResults(baseState, practicePlan, {
  completedTargetIds: ["boston"],
  correctCount: 1,
  incorrectCount: 0,
  missesByTargetId: {}
});
const fastProgress = fastCorrectState.itemProgress["us-capitals:capital:boston"];
assert.equal(fastProgress.slowCorrectCount, 0, "Fast correct answers must not create slow-correct state.");
assert.equal(fastProgress.missCount, 0, "Fast correct answers must not increment misses.");

const slowMs = DAILY_TRAIL_SLOW_CORRECT_MS + 1200;
const slowCorrectState = applyDailyTrailSessionResults(baseState, practicePlan, {
  completedTargetIds: ["boston"],
  correctCount: 1,
  incorrectCount: 0,
  missesByTargetId: {},
  slowCorrectMsByTargetId: {
    boston: slowMs
  }
});
const slowProgress = slowCorrectState.itemProgress["us-capitals:capital:boston"];
assert.equal(slowProgress.correctCount, 4, "Slow correct answers must still be counted as correct.");
assert.equal(slowProgress.missCount, 0, "Slow correct answers must not increment misses.");
assert.equal(slowProgress.slowCorrectCount, 1, "Slow correct answers should persist a slow-correct signal.");
assert.equal(slowProgress.lastSlowCorrectSession, 8, "Slow-correct signal should record the current session.");
assert.equal(slowProgress.lastSlowCorrectMs, slowMs, "Slow-correct signal should record elapsed milliseconds.");
assert.equal(slowProgress.dueSession, 9, "Slow-correct answers should be reviewed again soon.");

const nextPlan = planDailyTrailSession(slowCorrectState, items);
assert.ok(
  nextPlan.reviewItems.some((item) => item.id === "us-capitals:capital:boston"),
  "A slow-correct item should qualify for weak/due review."
);

const afkState = applyDailyTrailSessionResults(baseState, practicePlan, {
  completedTargetIds: ["boston"],
  correctCount: 1,
  incorrectCount: 0,
  missesByTargetId: {}
});
assert.equal(afkState.itemProgress["us-capitals:capital:boston"].slowCorrectCount, 0, "AFK-filtered correct answers should not create slow-correct state.");

const runtimeSource = fs.readFileSync(new URL("../src/maplibre-poc.js", import.meta.url), "utf8");
[
  "currentPromptStartedAtMs",
  "function getDailyTrailCorrectResponseElapsedMs(memoryTrail, targetId)",
  "function shouldRecordDailyTrailSlowCorrect(memoryTrail, targetId, elapsedMs)",
  "elapsedMs >= DAILY_TRAIL_SLOW_CORRECT_MS",
  "elapsedMs < DAILY_TRAIL_AFK_RESPONSE_MS",
  "memoryTrail.currentPromptType !== \"guided\"",
  "memoryTrail.currentPromptMode !== \"learn\"",
  "!isMixedDailyTrailCheckpointMemoryTrail(memoryTrail)",
  "!isCompletedDailyTrailReviewMemoryTrail(memoryTrail)",
  "slowCorrectMsByTargetId"
].forEach((hook) => assert.ok(runtimeSource.includes(hook), `Missing slow-correct runtime hook: ${hook}`));

assert.equal(DAILY_TRAIL_SLOW_CORRECT_MS, 6000);
assert.equal(DAILY_TRAIL_AFK_RESPONSE_MS, 60000);

console.log("Daily Trail slow-correct review check passed.");

function createCapitalItem(id, targetId, label, order, homeActivityId) {
  return {
    id,
    trailGoalId: dailyTrailUsCapitalsGoalId,
    targetId,
    label,
    type: "capital",
    homeActivityId,
    homeJourneyId: "us-capitals",
    homeStepId: homeActivityId,
    homeStepIndex: homeActivityId.endsWith("01") ? 0 : 1,
    activityTitle: homeActivityId.endsWith("01") ? "New England Capitals" : "Northeast / Mid-Atlantic Capitals",
    cameraGroupId: "capitals",
    order
  };
}

function createReviewProgress(overrides = {}) {
  return {
    status: "review",
    timesSeen: 3,
    correctCount: 3,
    missCount: 0,
    correctStreak: 3,
    lastSeenSession: 4,
    introducedSession: 1,
    memoryState: "review",
    difficulty: 5,
    stability: 4,
    retrievability: 0.8,
    dueSession: 20,
    lastReviewedSession: 4,
    lapseCount: 0,
    ...overrides
  };
}
