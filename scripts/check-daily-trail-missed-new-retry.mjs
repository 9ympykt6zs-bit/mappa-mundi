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

console.log("Daily Trail missed-new retry check passed.");
