import assert from "node:assert/strict";
import fs from "node:fs";

const runtimeSource = fs.readFileSync(
  new URL("../src/maplibre-poc.js", import.meta.url),
  "utf8"
);
const runnerSource = fs.readFileSync(
  new URL("../src/maplibre/maplibre-activity-runner.js", import.meta.url),
  "utf8"
);

[
  "function isCompletedDailyTrailReviewMemoryTrail(memoryTrail = getActiveMemoryTrail())",
  "completedTrailReview: options.completedTrailReview === true",
  "if (isCompletedDailyTrailReviewMemoryTrail(memoryTrail)) {\n    return 1;\n  }",
  "if (isCompletedDailyTrailReviewMemoryTrail(memoryTrail)) {\n    return stats.totalRetrievalCorrect >= 1;\n  }",
  "const completedTrailReview = activeDailyTrailSession.plan?.sessionType === \"completed-trail-review\";",
  "completedTrailReview: options.completedTrailReview === true",
  "completedTrailReviewTargetQueue: options.completedTrailReview === true",
  "function chooseNextCompletedDailyTrailReviewPrompt(memoryTrail)",
  "return chooseNextCompletedDailyTrailReviewPrompt(memoryTrail);",
  "reason: \"one-pass completed trail review\"",
  "runner?.setMemoryTrailPreAnswerOutlinesSuppressed?.(dailyTrailSession.plan?.sessionType === \"completed-trail-review\");"
].forEach((hook) => assert.ok(runtimeSource.includes(hook), `Missing terminal review recall hook: ${hook}`));

const newTargetStart = runtimeSource.indexOf("const completedTrailReview = activeDailyTrailSession.plan?.sessionType === \"completed-trail-review\";");
const newTargetEnd = runtimeSource.indexOf("const weakReviewTargetIds", newTargetStart);
const newTargetSource = runtimeSource.slice(newTargetStart, newTargetEnd);
assert.ok(newTargetSource.includes(": completedTrailReview\n      ? []"), "Completed-trail review must pass an empty new-target set.");
const startMemoryTrailStart = runtimeSource.indexOf("activeStudySession.memoryTrail = createMemoryTrailSession(session.currentActivity, {");
const startMemoryTrailEnd = runtimeSource.indexOf("});", startMemoryTrailStart);
const startMemoryTrailSource = runtimeSource.slice(startMemoryTrailStart, startMemoryTrailEnd);
assert.ok(startMemoryTrailSource.includes("completedTrailReview: options.completedTrailReview === true"), "startMemoryTrail must forward completedTrailReview into createMemoryTrailSession.");
assert.ok(startMemoryTrailSource.includes("dailyTrailNonLearnCamera: getDailyTrailMemoryTrailNonLearnCamera(session.currentActivity, options)"), "Daily Trail camera selection must pass through the scoped non-learn camera helper.");
assert.ok(runtimeSource.includes("const DAILY_TRAIL_TERMINAL_US_STATES_REVIEW_CAMERA = {\n  center: [-100.26878, 38.67918],\n  zoom: 3.9446,\n  bearing: 0,\n  pitch: 0\n};"));
const cameraHelperStart = runtimeSource.indexOf("function getDailyTrailMemoryTrailNonLearnCamera(activity, options = {})");
const cameraHelperEnd = runtimeSource.indexOf("function startMemoryTrail(options = {})", cameraHelperStart);
const cameraHelperSource = runtimeSource.slice(cameraHelperStart, cameraHelperEnd);
assert.ok(cameraHelperSource.includes("options.completedTrailReview === true && activity?.id?.startsWith(\"us-states-\")"), "Fixed terminal review camera must be scoped to US States completed review only.");
assert.ok(cameraHelperSource.includes("return activity?.map?.dailyTrailNonLearnCamera || null;"), "Non-terminal review cameras must keep the activity camera path.");

const completedReviewSelectorStart = runtimeSource.indexOf("function chooseNextCompletedDailyTrailReviewPrompt(memoryTrail)");
const completedReviewSelectorEnd = runtimeSource.indexOf("function isMixedDailyTrailCheckpointMemoryTrail", completedReviewSelectorStart);
const completedReviewSelectorSource = runtimeSource.slice(completedReviewSelectorStart, completedReviewSelectorEnd);
assert.ok(completedReviewSelectorSource.includes(".find((candidateTargetId) => !promptedTargetIds.has(candidateTargetId));"), "Completed review selector must choose each queued target once.");
assert.ok(!completedReviewSelectorSource.includes("getStatsRetrievalCorrectTarget"), "Completed review selector must not use normal new-item recall requirements.");

[
  "memoryTrailSuppressPreAnswerOutlines = false",
  "setMemoryTrailPreAnswerOutlinesSuppressed(isSuppressed = false)",
  "isMemoryTrailPreAnswerOutlineSuppressed()",
  "preAnswerOutlineSuppressed",
  "blueOutlineSource: preAnswerOutlineSuppressed ? \"suppressed\"",
  "this.isMemoryTrailPreAnswerOutlineSuppressed()\n          ? [\"match\", [\"get\", \"id\"], ...this.getMutedTargetColorStops(), colors.targetFill]\n          : colors.studyTargetFill",
  "this.isMemoryTrailPreAnswerOutlineSuppressed() ? 0 : 0.52",
  "this.isMemoryTrailPreAnswerOutlineSuppressed() ? 0 : 0.86"
].forEach((hook) => assert.ok(runnerSource.includes(hook), `Missing pre-answer outline suppression hook: ${hook}`));

console.log("Daily Trail terminal review recall-mode check passed.");
