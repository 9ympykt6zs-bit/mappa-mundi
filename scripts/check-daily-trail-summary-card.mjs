import assert from "node:assert/strict";
import fs from "node:fs";
import {
  applyDailyTrailSessionResults,
  createDailyTrailState
} from "../src/daily-trail-planner.js";

const items = [
  createItem("item:new-a", "new-a", "New A", "activity-a"),
  createItem("item:new-b", "new-b", "New B", "activity-a"),
  createItem("item:review-a", "review-a", "Review A", "activity-a"),
  createItem("item:review-b", "review-b", "Review B", "activity-b")
];

const baseState = createDailyTrailState({
  hasStarted: true,
  currentSessionNumber: 4,
  introducedItemIds: ["item:review-a", "item:review-b"],
  itemProgress: {
    "item:review-a": createReviewProgress(),
    "item:review-b": createReviewProgress()
  }
});

const learningPlan = {
  sessionType: "learning-session",
  playItems: [items[0], items[1], items[2]],
  newItems: [items[0], items[1]],
  reviewItems: [items[2]],
  allItems: items
};

const learningState = applyDailyTrailSessionResults(baseState, learningPlan, {
  completedTargetIds: ["new-a", "review-a"],
  taughtTargetIds: ["new-a", "new-b"],
  correctCount: 2,
  incorrectCount: 1,
  missesByTargetId: { "new-b": 1 },
  retriedNewTargetIds: ["new-b"],
  missedNewRetryCount: 1
});

assert.equal(learningState.lastSessionSummary.newCount, 2, "New count should include taught/completed planned new items.");
assert.equal(learningState.lastSessionSummary.reviewCount, 1, "Review count must exclude current-session new items.");
assert.equal(learningState.lastSessionSummary.missedNewRetryCount, 1, "Missed-new retries should be summarized when present.");

const reviewOnlyPlan = {
  sessionType: "learning-session",
  playItems: [items[2], items[3]],
  newItems: [],
  reviewItems: [items[2], items[3]],
  allItems: items
};
const reviewOnlyState = applyDailyTrailSessionResults(baseState, reviewOnlyPlan, {
  completedTargetIds: ["review-a", "review-b"],
  correctCount: 2,
  incorrectCount: 0,
  missesByTargetId: {}
});

assert.equal(reviewOnlyState.lastSessionSummary.newCount, 0, "Review-only summaries must not claim new places.");
assert.equal(reviewOnlyState.lastSessionSummary.reviewCount, 2, "Review-only summaries should count practiced review items.");

const checkpointPlan = {
  sessionType: "checkpoint",
  playItems: [items[0], items[1], items[2]],
  newItems: [],
  reviewItems: [items[0], items[1], items[2]],
  allItems: items
};
const checkpointState = applyDailyTrailSessionResults(baseState, checkpointPlan, {
  completedTargetIds: ["new-a", "new-b", "review-a"],
  correctCount: 3,
  incorrectCount: 0,
  missesByTargetId: {}
});

assert.equal(checkpointState.lastSessionSummary.checkpointPassed, true, "Passing checkpoint result should be available to the card.");
assert.equal(checkpointState.lastSessionSummary.checkpointCorrectCount, 3, "Checkpoint correct count should be summarized.");
assert.equal(checkpointState.lastSessionSummary.checkpointIncorrectCount, 0, "Checkpoint miss count should be summarized.");
assert.equal(checkpointState.lastSessionSummary.sessionsUntilNextCheckpoint, checkpointState.sessionsUntilNextCheckpoint);

const runtimeSource = fs.readFileSync(new URL("../src/maplibre-poc.js", import.meta.url), "utf8");
[
  "function getDailyTrailSummaryMetricRows(summary = {})",
  "[\"New places learned\", newCount]",
  "[\"Review items strengthened\", reviewCount]",
  "[\"Missed items retried\", missedNewRetryCount]",
  "[\"Checkpoint\", summary.checkpointPassed === false ? \"Review needed\" : \"Passed\"]",
  "actions.appendChild(continueButton)"
].forEach((hook) => assert.ok(runtimeSource.includes(hook), `Missing Daily Trail summary card hook: ${hook}`));

console.log("Daily Trail summary card check passed.");

function createItem(id, targetId, label, homeActivityId) {
  return {
    id,
    targetId,
    label,
    type: "country",
    homeActivityId,
    homeJourneyId: "summary-test",
    homeStepId: homeActivityId,
    activityTitle: homeActivityId,
    trailGoalId: "world-core"
  };
}

function createReviewProgress() {
  return {
    status: "review",
    timesSeen: 3,
    correctCount: 3,
    missCount: 0,
    correctStreak: 3,
    lastSeenSession: 2,
    introducedSession: 1,
    memoryState: "review",
    difficulty: 5,
    stability: 4,
    retrievability: 0.8,
    dueSession: 4,
    lastReviewedSession: 2,
    lapseCount: 0
  };
}
