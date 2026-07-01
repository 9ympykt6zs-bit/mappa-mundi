import assert from "node:assert/strict";
import fs from "node:fs";
import {
  applyDailyTrailSessionResults,
  createDailyTrailState,
  isDailyTrailCheckpointReviewPlan,
  planDailyTrailSession
} from "../src/daily-trail-planner.js";

const regions = [
  { activityId: "region-alpha", targetIds: ["alpha-1", "alpha-2", "alpha-3", "alpha-4"] },
  { activityId: "region-beta", targetIds: ["beta-1", "beta-2", "beta-3", "beta-4"] },
  { activityId: "region-gamma", targetIds: ["gamma-1", "gamma-2", "gamma-3", "gamma-4"] }
];
const items = regions.flatMap((region, regionIndex) => region.targetIds.map((targetId, targetIndex) => ({
  id: `${region.activityId}:${targetId}`,
  targetId,
  homeActivityId: region.activityId,
  homeJourneyId: "world-geography-core",
  homeStepId: region.activityId,
  homeStepIndex: regionIndex,
  activityTitle: region.activityId,
  cameraGroupId: region.activityId,
  order: regionIndex * 100 + targetIndex
})));
const introducedIds = items.map((item) => item.id);
const state = createDailyTrailState({
  hasStarted: true,
  currentSessionNumber: 8,
  sessionsSinceLastCheckpoint: 3,
  introducedItemIds: introducedIds,
  newSinceLastCheckpoint: [introducedIds[0], introducedIds[4], introducedIds[8]],
  itemProgress: Object.fromEntries(items.map((item, index) => [item.id, {
    status: index === 1 ? "learning" : "review",
    timesSeen: 2,
    correctCount: 1,
    missCount: index === 5 ? 2 : 0,
    correctStreak: index === 5 ? 0 : 1,
    lastSeenSession: index < 4 ? 7 : index < 8 ? 5 : 3,
    introducedSession: index < 4 ? 5 : index < 8 ? 3 : 1,
    memoryState: index === 5 ? "relearning" : "review",
    difficulty: 5,
    stability: 2,
    retrievability: index === 5 ? 0.2 : 0.7,
    dueSession: index === 5 ? 6 : 9,
    dueDate: null,
    lastReviewedSession: index < 4 ? 7 : index < 8 ? 5 : 3,
    lastReviewedDate: null,
    lapseCount: index === 5 ? 1 : 0
  }]))
});

const plan = planDailyTrailSession(state, items);
const repeatedPlan = planDailyTrailSession(state, items);
const selectedIds = plan.playItems.map((item) => item.id);
const selectedActivityIds = new Set(plan.playItems.map((item) => item.homeActivityId));
const countsByActivity = Object.fromEntries(
  [...selectedActivityIds].map((activityId) => [
    activityId,
    plan.playItems.filter((item) => item.homeActivityId === activityId).length
  ])
);

assert.equal(plan.sessionType, "checkpoint");
assert.equal(plan.checkpointMixedReview, true);
assert.equal(plan.newItems.length, 0);
assert.deepEqual(selectedIds, repeatedPlan.playItems.map((item) => item.id));
assert.equal(selectedActivityIds.size, 3);
assert.deepEqual(plan.activityGroups.map((group) => group.homeActivityId), Array.from(selectedActivityIds));
assert.ok(plan.playItems.every((item) => introducedIds.includes(item.id)));
assert.ok(Object.values(countsByActivity).every((count) => count <= 4));
assert.ok(plan.playItems.length <= 10);
assert.equal(new Set(selectedIds).size, selectedIds.length, "A checkpoint queue must not repeat target ids.");
assert.ok(
  selectedIds.every((targetId, index) => index === 0 || targetId !== selectedIds[index - 1]),
  "A checkpoint queue must not repeat the prior target."
);

// Regression fixture from the browser handoff: this must create a checkpoint
// review session even if the caller omits its explicit checkpointReview option.
const browserCheckpointPlan = {
  sessionType: "checkpoint",
  checkpointMixedReview: true
};
const browserCheckpointReview = isDailyTrailCheckpointReviewPlan(browserCheckpointPlan);
assert.equal(browserCheckpointReview, true, "Checkpoint plans must enter checkpoint-review mode at runtime.");
assert.equal(isDailyTrailCheckpointReviewPlan({ sessionType: "remediationCheckpoint" }), true);
assert.equal(isDailyTrailCheckpointReviewPlan({ checkpointMixedReview: true }), true);
assert.equal(isDailyTrailCheckpointReviewPlan({ checkpointReview: true }), true);
const browserCheckpointQueue = Array.from(new Map(plan.playItems.map((item) => [
  `${item.type || "target"}:${item.targetId}`,
  item.targetId
])).values());
assert.ok(browserCheckpointQueue.length > 0, "The checkpoint handoff must receive a populated target queue.");
assert.equal(new Set(browserCheckpointQueue).size, browserCheckpointQueue.length);

const duplicateCanonicalItem = {
  ...items[0],
  id: "region-beta:duplicate-alpha-1",
  targetId: items[0].targetId,
  type: "country",
  homeActivityId: "region-beta",
  homeStepId: "region-beta",
  order: 101
};
const canonicalItems = [...items.map((item) => ({ ...item, type: "country" })), duplicateCanonicalItem];
const duplicateState = createDailyTrailState({
  ...state,
  introducedItemIds: [...introducedIds, duplicateCanonicalItem.id],
  newSinceLastCheckpoint: [...state.newSinceLastCheckpoint, duplicateCanonicalItem.id],
  itemProgress: {
    ...state.itemProgress,
    [duplicateCanonicalItem.id]: {
      ...state.itemProgress[items[0].id],
      memoryState: "relearning",
      dueSession: 6,
      missCount: 2,
      correctStreak: 0,
      retrievability: 0.2
    }
  }
});
const duplicatePlan = planDailyTrailSession(duplicateState, canonicalItems);
const canonicalTargetIds = duplicatePlan.playItems.map((item) => `${item.type}:${item.targetId}`);
assert.equal(
  new Set(canonicalTargetIds).size,
  canonicalTargetIds.length,
  "A mixed checkpoint must dedupe items by canonical target id before queueing."
);

const completedState = applyDailyTrailSessionResults(state, plan, {
  completedTargetIds: plan.playItems.map((item) => item.targetId),
  correctCount: plan.playItems.length,
  incorrectCount: 0,
  missesByTargetId: {}
});

assert.equal(completedState.sessionsSinceLastCheckpoint, 0);
assert.equal(completedState.pendingRemediation, false);
assert.equal(completedState.pendingCheckpointRetry, false);

const normalLearningPlan = {
  sessionType: "learning-session",
  newItems: [items[0]],
  reviewItems: [],
  playItems: [items[0]],
  allItems: items
};
const normalLearningState = applyDailyTrailSessionResults(createDailyTrailState({
  ...state,
  sessionsSinceLastCheckpoint: 1
}), normalLearningPlan, {
  completedTargetIds: [items[0].targetId],
  correctCount: 1,
  incorrectCount: 0,
  missesByTargetId: {}
});
assert.equal(
  normalLearningState.sessionsSinceLastCheckpoint,
  2,
  "A completed normal new-learning batch should advance checkpoint cadence."
);

const reviewOnlyPlan = {
  sessionType: "learning-session",
  newItems: [],
  reviewItems: [items[0]],
  playItems: [items[0]],
  allItems: items
};
const reviewOnlyState = applyDailyTrailSessionResults(createDailyTrailState({
  ...state,
  sessionsSinceLastCheckpoint: 1
}), reviewOnlyPlan, {
  completedTargetIds: [items[0].targetId],
  correctCount: 1,
  incorrectCount: 0,
  missesByTargetId: {}
});
assert.equal(
  reviewOnlyState.sessionsSinceLastCheckpoint,
  1,
  "A review-only Daily Trail session must not advance checkpoint cadence."
);

const continentsOceansFoundationPlan = {
  sessionType: "learning-session",
  continentsOceansReviewType: "foundation",
  newItems: [items[0]],
  reviewItems: [],
  playItems: [items[0]],
  allItems: items
};
const continentsOceansFoundationState = applyDailyTrailSessionResults(createDailyTrailState({
  ...state,
  sessionsSinceLastCheckpoint: 1
}), continentsOceansFoundationPlan, {
  completedTargetIds: [items[0].targetId],
  correctCount: 1,
  incorrectCount: 0,
  missesByTargetId: {}
});
assert.equal(
  continentsOceansFoundationState.sessionsSinceLastCheckpoint,
  1,
  "C&O foundation batches must not advance mixed checkpoint cadence."
);

const checkpointReadyState = applyDailyTrailSessionResults(createDailyTrailState({
  ...state,
  sessionsSinceLastCheckpoint: 2
}), normalLearningPlan, {
  completedTargetIds: [items[0].targetId],
  correctCount: 1,
  incorrectCount: 0,
  missesByTargetId: {}
});
assert.equal(checkpointReadyState.sessionsSinceLastCheckpoint, 3);
assert.equal(planDailyTrailSession(checkpointReadyState, items).sessionType, "checkpoint");

const runtimeSource = fs.readFileSync(new URL("../src/maplibre-poc.js", import.meta.url), "utf8");
const runnerSource = fs.readFileSync(new URL("../src/maplibre/maplibre-activity-runner.js", import.meta.url), "utf8");
const appEntrySource = fs.readFileSync(new URL("../index.html", import.meta.url), "utf8");
const previewEntrySource = fs.readFileSync(new URL("../maplibre-poc.html", import.meta.url), "utf8");
const europeActivity = JSON.parse(fs.readFileSync(
  new URL("../assets/maps/data/world-core-europe-countries.json", import.meta.url),
  "utf8"
));
assert.deepEqual(europeActivity.map?.dailyTrailQuizCamera, {
  targetIds: [
    "germany",
    "united-kingdom",
    "france",
    "spain",
    "italy",
    "portugal",
    "netherlands",
    "poland",
    "ireland",
    "ukraine"
  ],
  center: [22.65378, 50.41408],
  zoom: 3.3006,
  bearing: 0,
  pitch: 0,
  cameraContext: "small-target-focus",
  source: "small-target-learn"
});
const plannerImport = runtimeSource.match(/from "\.\/daily-trail-planner\.js\?v=([^"]+)"/);
assert.equal(
  plannerImport?.[1],
  "20260624-daily-trail-curriculum-progression-1",
  "The runtime must load the checkpoint-aware planner under a new cache key."
);
assert.ok(appEntrySource.includes("./src/maplibre-poc.js?v=20260624-state-context-display-cleanup-1"));
assert.ok(previewEntrySource.includes("src/maplibre-poc.js?v=20260624-state-context-display-cleanup-1"));
[
  "checkpointActivityGroups",
  "function startDailyTrailActivity(activityId)",
  "function advanceMixedDailyTrailCheckpoint()",
  "function mergeDailyTrailCheckpointResult(dailyTrailSession, result)",
  "finalizeDailyTrailMemoryTrailSession(activeDailyTrailSession.checkpointResult)",
  "checkpointReview: isDailyTrailCheckpointPlan(activeDailyTrailSession.plan)",
  "function isDailyTrailCheckpointPlan(plan = activeDailyTrailSession?.plan)",
  "isDailyTrailCheckpointReviewPlan",
  "const checkpointReview = Boolean(",
  "options.checkpointReview === true || isDailyTrailCheckpointPlan(activeDailyTrailSession?.plan)",
  "dailyTrailQuizCamera: isDailyTrail ? session.currentActivity?.map?.dailyTrailQuizCamera || null : null,\n    checkpointReview",
  "function getCheckpointMemoryTrailTargetQueue(targetPool = [])",
  "const canonicalTargetId = targetId ? `${targetKind}:${targetId}` : \"\";",
  "function chooseNextCheckpointReviewPrompt(memoryTrail)",
  "function getMixedDailyTrailCheckpointCameraConfig(memoryTrail, selection = {})",
  "function getMixedDailyTrailCheckpointCamera(memoryTrail, selection = {})",
  "reason: \"one-pass mixed checkpoint queue\"",
  "const dailyTrailCheckpointRuntimeFingerprint = \"daily-trail-checkpoint-outline-20260622-3\";",
  "function getDailyTrailCheckpointRuntimeSnapshot(memoryTrail = getActiveMemoryTrail(), details = {})",
  "queueHasDuplicates: duplicateTargetIds.length > 0",
  "preAnswerHighlightEnabled: Boolean(details.preAnswerHighlightEnabled)",
  "window.mappaDailyTrailCheckpointDebug",
  "stage: \"checkpoint-prompt-rendered\"",
  "stage: \"checkpoint-camera-applied\"",
  "function isMixedDailyTrailCheckpointMemoryTrail(memoryTrail = getActiveMemoryTrail())",
  "if (isMixedDailyTrailCheckpointMemoryTrail(memoryTrail)) {\n    runner.setMemoryTrailHighlight([]);",
  "runner.setMemoryTrailCorrectionHighlight({",
  "runner.setMemoryTrailHighlight(targetId);",
  "function applyMixedDailyTrailCheckpointCamera(memoryTrail, options = {})",
  "activity?.map?.dailyTrailFixedCamera",
  "dailyTrailQuizCamera",
  "!isMixedDailyTrailCheckpointMemoryTrail(memoryTrail)",
  "applyMixedDailyTrailCheckpointCamera(memoryTrail, { selection, duration: 820 });",
  "if (isMixedDailyTrailCheckpointMemoryTrail(memoryTrail)) {\n    return false;\n  }\n\n  const dailyTrailFixedCamera",
  "source: checkpointCamera ? \"daily-trail-checkpoint-context\" : \"activity-context-fit\"",
  "daily-trail-checkpoint-context",
  "runner.suppressStudyIntroCameraOnce?.(\"daily-trail-mixed-checkpoint-context\", 5000)",
  "maxZoom: 4.1"
].forEach((hook) => assert.ok(runtimeSource.includes(hook), `Missing mixed checkpoint runtime hook: ${hook}`));

[
  "setMemoryTrailCheckpointPreAnswerStyle(isActive = false)",
  "isMemoryTrailCheckpointPreAnswerStyleEnabled()",
  "getMemoryTrailPromptVisualState()",
  "blueOutlineSource: preAnswerOutlineSuppressed ? \"suppressed\" : checkpointPreAnswerStyle ? \"state-line:targetStroke\" : \"state-line:studyTargetLine\"",
  "this.isMemoryTrailCheckpointPreAnswerStyleEnabled() ? colors.targetStroke : colors.studyTargetLine",
  "this.isMemoryTrailCheckpointPreAnswerStyleEnabled() ? 0 : 0.52",
  "if (this.isMemoryTrailCheckpointPreAnswerStyleEnabled()) {\n      return 0;\n    }",
  "if (this.memoryTrailHighlightIds.length > 0) {\n      this.memoryTrailCheckpointPreAnswerStyle = false;",
  "if (correctTargetId || wrongTargetId) {\n      this.memoryTrailCheckpointPreAnswerStyle = false;",
  "this.isMemoryTrailCheckpointPreAnswerStyleEnabled() ? \"\" : this.selectedTargetId"
].forEach((hook) => assert.ok(runnerSource.includes(hook), `Missing checkpoint pre-answer outline guard: ${hook}`));
assert.ok(runtimeSource.includes("runner?.setMemoryTrailCheckpointPreAnswerStyle?.(checkpointPreAnswerStyle);"));
assert.ok(runtimeSource.includes("import(\"./maplibre/maplibre-activity-runner.js?v=20260624-state-context-display-cleanup-1\")"));

const queueSelectorIndex = runtimeSource.indexOf("if (isMixedDailyTrailCheckpointMemoryTrail(memoryTrail)) {");
const defaultLearnSelectorIndex = runtimeSource.indexOf("const unguidedCurrentTarget = memoryTrail.currentPracticeWindow");
assert.ok(queueSelectorIndex >= 0 && queueSelectorIndex < defaultLearnSelectorIndex);

console.log("Daily Trail mixed checkpoint check passed:", JSON.stringify({
  selectedIds,
  activityGroups: plan.activityGroups.map((group) => group.homeActivityId),
  countsByActivity,
  checkpointSize: plan.playItems.length,
  browserCheckpointQueue,
  dedupedCanonicalTargetIds: canonicalTargetIds
}));
