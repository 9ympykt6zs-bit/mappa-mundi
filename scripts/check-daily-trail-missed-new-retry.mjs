import assert from "node:assert/strict";
import fs from "node:fs";

const runtimeSource = fs.readFileSync(
  new URL("../src/maplibre-poc.js", import.meta.url),
  "utf8"
);

[
  "dailyTrailMissedNewRetryTargetIds: []",
  "dailyTrailRetriedNewTargetIds: []",
  "queueDailyTrailMissedNewItemRetry(memoryTrail, stats);",
  "function queueDailyTrailMissedNewItemRetry(memoryTrail, stats)",
  "function getDailyTrailMissedNewItemRetry(memoryTrail, dueIntroduced = [], avoidLast = () => true)",
  "function hasDailyTrailNewItemBatchRecallPass(memoryTrail)",
  "function hasDailyTrailPendingMissedNewItemRetry(memoryTrail)",
  "function isDailyTrailRetriedNewItemTarget(memoryTrail, targetId)",
  "reason: \"missed new item retry\"",
  "if (hasDailyTrailPendingMissedNewItemRetry(memoryTrail)) {\n    return false;\n  }",
  "if (hasDailyTrailPendingMissedNewItemRetry(memoryTrail)) {\n    return false;\n  }",
  "return stats.currentCorrectStreak >= DAILY_TRAIL_WEAK_CORRECT_TARGET",
  "const weakItemsSettled = getWeakTargets(memoryTrail).every((stats) => hasDailyTrailWeakStatsSettledForNow(stats, memoryTrail));"
].forEach((hook) => assert.ok(runtimeSource.includes(hook), `Missing missed-new retry hook: ${hook}`));

const queueStart = runtimeSource.indexOf("function queueDailyTrailMissedNewItemRetry(memoryTrail, stats)");
const queueEnd = runtimeSource.indexOf("function getDailyTrailMissedNewItemRetry", queueStart);
const queueSource = runtimeSource.slice(queueStart, queueEnd);
assert.ok(queueSource.includes("!isDailyTrailCurrentNewBatchTarget(memoryTrail, targetId)"));
assert.ok(queueSource.includes("memoryTrail?.dailyTrailRetriedNewTargetIds?.includes(targetId)"));
assert.ok(queueSource.includes("memoryTrail?.dailyTrailMissedNewRetryTargetIds?.includes(targetId)"));

const retryStart = runtimeSource.indexOf("function getDailyTrailMissedNewItemRetry");
const retryEnd = runtimeSource.indexOf("function hasDailyTrailNewItemBatchRecallPass", retryStart);
const retrySource = runtimeSource.slice(retryStart, retryEnd);
assert.ok(retrySource.includes("!hasDailyTrailNewItemBatchRecallPass(memoryTrail)"));
assert.ok(retrySource.includes("memoryTrail.dailyTrailMissedNewRetryTargetIds = pendingRetryIds.filter((targetId) => targetId !== retry.targetId);"));
assert.ok(retrySource.includes("memoryTrail.dailyTrailRetriedNewTargetIds = ["));

const selectorStart = runtimeSource.indexOf("function chooseNextPrompt(memoryTrail)");
const selectorEnd = runtimeSource.indexOf("function chooseRetrievalPromptType", selectorStart);
const selectorSource = runtimeSource.slice(selectorStart, selectorEnd);
const guidedIndex = selectorSource.indexOf("if (unguidedCurrentTarget)");
const retryIndex = selectorSource.indexOf("const missedNewRetry = getDailyTrailMissedNewItemRetry(memoryTrail, introducedStats, avoidLast);");
const weakIndex = selectorSource.indexOf("const weak = getWeakTargets(memoryTrail)");
const insertedReviewIndex = selectorSource.indexOf("const dailyTrailBatchReview = getDailyTrailNewBatchInsertedReview(memoryTrail, dueIntroduced);");
assert.ok(guidedIndex >= 0 && guidedIndex < retryIndex, "Guided teaching should stay before missed-new retry.");
assert.ok(retryIndex >= 0 && retryIndex < weakIndex, "Missed-new retry should run before weak review.");
assert.ok(retryIndex < insertedReviewIndex, "Missed-new retry should run before inserted old/weak review.");
assert.ok(selectorSource.includes(".filter((stats) => !shouldSkipDailyTrailWeakPromptForRetriedNewItem(memoryTrail, stats))"));

function createRetryHarness() {
  const memoryTrail = {
    source: "daily-trail",
    dailyTrailNewTargetIds: ["new-a", "new-b", "new-c"],
    currentPracticeWindow: [
      { id: "new-a" },
      { id: "new-b" },
      { id: "new-c" },
      { id: "old-review" },
      { id: "weak-review" }
    ],
    dailyTrailMissedNewRetryTargetIds: [],
    dailyTrailRetriedNewTargetIds: [],
    targetStats: {
      "new-a": createStats("new-a"),
      "new-b": createStats("new-b"),
      "new-c": createStats("new-c"),
      "old-review": createStats("old-review", { totalRetrievalIncorrect: 1, isWeak: false }),
      "weak-review": createStats("weak-review", { totalRetrievalIncorrect: 2, isWeak: true })
    }
  };

  return {
    memoryTrail,
    queueMiss(targetId) {
      const stats = memoryTrail.targetStats[targetId];
      stats.totalRetrievalAttempts += 1;
      stats.totalRetrievalIncorrect += 1;
      queueMissedNewItemRetry(memoryTrail, stats);
    },
    markCorrect(targetId) {
      const stats = memoryTrail.targetStats[targetId];
      stats.totalRetrievalAttempts += 1;
      stats.totalRetrievalCorrect += 1;
    },
    retry() {
      return getMissedNewItemRetry(memoryTrail, Object.values(memoryTrail.targetStats));
    }
  };
}

function createStats(targetId, overrides = {}) {
  return {
    targetId,
    totalRetrievalAttempts: 0,
    totalRetrievalCorrect: 0,
    totalRetrievalIncorrect: 0,
    isWeak: false,
    ...overrides
  };
}

function getCurrentNewBatchTargetIds(memoryTrail) {
  const newTargetIds = new Set(memoryTrail.dailyTrailNewTargetIds);
  return memoryTrail.currentPracticeWindow
    .map((target) => target.id)
    .filter((targetId) => newTargetIds.has(targetId));
}

function isCurrentNewBatchTarget(memoryTrail, targetId) {
  return getCurrentNewBatchTargetIds(memoryTrail).includes(targetId);
}

function queueMissedNewItemRetry(memoryTrail, stats) {
  const targetId = stats?.targetId || "";
  if (
    !isCurrentNewBatchTarget(memoryTrail, targetId)
    || memoryTrail.dailyTrailRetriedNewTargetIds.includes(targetId)
    || memoryTrail.dailyTrailMissedNewRetryTargetIds.includes(targetId)
  ) {
    return;
  }

  memoryTrail.dailyTrailMissedNewRetryTargetIds.push(targetId);
}

function hasNewItemBatchRecallPass(memoryTrail) {
  return getCurrentNewBatchTargetIds(memoryTrail)
    .map((targetId) => memoryTrail.targetStats[targetId])
    .every((stats) => stats.totalRetrievalAttempts >= 1);
}

function getMissedNewItemRetry(memoryTrail, introducedStats) {
  if (!hasNewItemBatchRecallPass(memoryTrail)) {
    return null;
  }

  const retry = introducedStats.find((stats) => (
    memoryTrail.dailyTrailMissedNewRetryTargetIds.includes(stats.targetId)
    && !memoryTrail.dailyTrailRetriedNewTargetIds.includes(stats.targetId)
    && isCurrentNewBatchTarget(memoryTrail, stats.targetId)
  )) || null;

  if (retry) {
    memoryTrail.dailyTrailMissedNewRetryTargetIds = memoryTrail.dailyTrailMissedNewRetryTargetIds
      .filter((targetId) => targetId !== retry.targetId);
    memoryTrail.dailyTrailRetriedNewTargetIds.push(retry.targetId);
  }

  return retry;
}

{
  const harness = createRetryHarness();
  harness.queueMiss("new-b");
  assert.deepEqual(harness.memoryTrail.dailyTrailMissedNewRetryTargetIds, ["new-b"], "A missed new item should be queued.");
  assert.equal(harness.retry(), null, "Missed new item retry waits until the active new batch has had a recall pass.");
  harness.markCorrect("new-a");
  harness.markCorrect("new-c");
  const retry = harness.retry();
  assert.equal(retry?.targetId, "new-b", "The missed new item should be retried once after batch recall.");
  assert.deepEqual(harness.memoryTrail.dailyTrailMissedNewRetryTargetIds, [], "Retry selection should consume the pending retry.");
  assert.deepEqual(harness.memoryTrail.dailyTrailRetriedNewTargetIds, ["new-b"], "Retry selection should mark the item as retried.");
  harness.queueMiss("new-b");
  assert.deepEqual(harness.memoryTrail.dailyTrailMissedNewRetryTargetIds, [], "Missing the retry must not enqueue another retry loop.");
  assert.equal(harness.retry(), null, "A retried new item must not be selected again.");
}

{
  const harness = createRetryHarness();
  harness.queueMiss("old-review");
  harness.queueMiss("weak-review");
  assert.deepEqual(harness.memoryTrail.dailyTrailMissedNewRetryTargetIds, [], "Older and weak review items must not be queued by missed-new retry.");
}

{
  const harness = createRetryHarness();
  harness.markCorrect("new-a");
  harness.markCorrect("new-b");
  harness.markCorrect("new-c");
  assert.equal(harness.retry(), null, "Correctly answered new items should not create retry prompts.");
}

console.log("Daily Trail missed-new retry check passed.");
