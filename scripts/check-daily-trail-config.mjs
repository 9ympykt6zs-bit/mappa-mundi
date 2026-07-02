import assert from "node:assert/strict";
import fs from "node:fs";
import {
  DAILY_TRAIL_AFK_RESPONSE_MS,
  DAILY_TRAIL_CONFIG,
  DAILY_TRAIL_SLOW_CORRECT_MS,
  dailyTrailCheckpointInterval,
  dailyTrailCheckpointReviewItemCount,
  dailyTrailCompletedReviewItemCount,
  dailyTrailNewItemCount,
  dailyTrailReviewItemCount
} from "../src/daily-trail-planner.js";

assert.deepEqual(DAILY_TRAIL_CONFIG, Object.freeze({
  newItemCount: 4,
  reviewItemCount: 10,
  recentReviewCount: 1,
  weakReviewCount: 1,
  missedNewRetryCount: 1,
  checkpointInterval: 4,
  checkpointReviewItemCount: 10,
  completedReviewItemCount: 10,
  slowCorrectMs: 6000,
  afkResponseMs: 60000
}));

assert.equal(dailyTrailNewItemCount, DAILY_TRAIL_CONFIG.newItemCount);
assert.equal(dailyTrailReviewItemCount, DAILY_TRAIL_CONFIG.reviewItemCount);
assert.equal(dailyTrailCheckpointInterval, DAILY_TRAIL_CONFIG.checkpointInterval);
assert.equal(dailyTrailCheckpointReviewItemCount, DAILY_TRAIL_CONFIG.checkpointReviewItemCount);
assert.equal(dailyTrailCompletedReviewItemCount, DAILY_TRAIL_CONFIG.completedReviewItemCount);
assert.equal(DAILY_TRAIL_SLOW_CORRECT_MS, DAILY_TRAIL_CONFIG.slowCorrectMs);
assert.equal(DAILY_TRAIL_AFK_RESPONSE_MS, DAILY_TRAIL_CONFIG.afkResponseMs);
assert.equal(DAILY_TRAIL_SLOW_CORRECT_MS, 6000);
assert.equal(DAILY_TRAIL_AFK_RESPONSE_MS, 60000);

const plannerSource = fs.readFileSync(new URL("../src/daily-trail-planner.js", import.meta.url), "utf8");
const runtimeSource = fs.readFileSync(new URL("../src/maplibre-poc.js", import.meta.url), "utf8");
[
  "export const DAILY_TRAIL_CONFIG = Object.freeze({",
  "export const dailyTrailCheckpointInterval = DAILY_TRAIL_CONFIG.checkpointInterval;",
  "export const DAILY_TRAIL_SLOW_CORRECT_MS = DAILY_TRAIL_CONFIG.slowCorrectMs;",
  "limit: DAILY_TRAIL_CONFIG.recentReviewCount",
  "limit: DAILY_TRAIL_CONFIG.weakReviewCount"
].forEach((hook) => assert.ok(plannerSource.includes(hook), `Missing config planner hook: ${hook}`));

[
  "DAILY_TRAIL_CONFIG,",
  "DAILY_TRAIL_CONFIG.missedNewRetryCount",
  "elapsedMs >= DAILY_TRAIL_SLOW_CORRECT_MS",
  "elapsedMs < DAILY_TRAIL_AFK_RESPONSE_MS"
].forEach((hook) => assert.ok(runtimeSource.includes(hook), `Missing config runtime hook: ${hook}`));

console.log("Daily Trail config check passed.");
