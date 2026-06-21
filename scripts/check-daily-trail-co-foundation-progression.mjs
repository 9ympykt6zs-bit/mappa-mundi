import fs from "node:fs";
import {
  applyDailyTrailSessionResults,
  applyDailyTrailTeachingProgress,
  createDailyTrailState,
  planDailyTrailSession
} from "../src/daily-trail-planner.js";
import { resolveMemoryTrailNewTargetLimit } from "../src/memory-trail-new-target-limit.js";

const continentsOceans = JSON.parse(
  fs.readFileSync(new URL("../assets/maps/data/continents-oceans.json", import.meta.url), "utf8")
);
const items = continentsOceans.features.map((target, order) => ({
  id: `continents-oceans:${target.id}`,
  targetId: target.id,
  homeActivityId: "continents-oceans",
  order
}));
const firstThreeIds = new Set(items.slice(0, 3).map((item) => item.targetId));
const normalizedActivity = {
  ...continentsOceans,
  memoryTrailNewTargetLimit: null
};
const plannedTargetIds = items.slice(0, 6).map((item) => item.targetId);
const legacyLimit = Number.isFinite(Number(normalizedActivity.memoryTrailNewTargetLimit))
  ? Math.max(1, Math.floor(Number(normalizedActivity.memoryTrailNewTargetLimit)))
  : null;
const legacyCanAdvance = 3 < Math.min(legacyLimit, plannedTargetIds.length);
const resolvedLimit = resolveMemoryTrailNewTargetLimit({}, normalizedActivity);
const resolvedSessionCap = Number.isFinite(resolvedLimit)
  ? Math.min(resolvedLimit, plannedTargetIds.length)
  : plannedTargetIds.length;

if (
  legacyLimit !== 1
  || legacyCanAdvance
  || resolvedLimit !== null
  || resolvedSessionCap <= 3
  || resolveMemoryTrailNewTargetLimit({ maxNewTargets: 3 }, normalizedActivity) !== 3
  || resolveMemoryTrailNewTargetLimit({}, { memoryTrailNewTargetLimit: 5 }) !== 5
) {
  throw new Error("C&O Memory Trail new-target cap did not normalize an unspecified limit safely.");
}

let state = createDailyTrailState();
const firstPlan = planDailyTrailSession(state, items);

if (firstPlan.playItems.slice(0, 3).map((item) => item.targetId).join(",") !== "north-america,south-america,europe") {
  throw new Error("Fresh C&O foundation no longer begins with North America, South America, and Europe.");
}

for (const item of firstPlan.playItems.filter((item) => firstThreeIds.has(item.targetId))) {
  state = applyDailyTrailTeachingProgress(state, firstPlan, item.targetId);
}

const firstThreeTargetIds = firstPlan.playItems
  .filter((item) => firstThreeIds.has(item.targetId))
  .map((item) => item.targetId);
state = applyDailyTrailSessionResults(state, firstPlan, {
  completedTargetIds: firstThreeTargetIds,
  correctCount: firstThreeTargetIds.length,
  incorrectCount: 0
});

const nextPlan = planDailyTrailSession(state, items);
const nextTargetIds = nextPlan.playItems.map((item) => item.targetId);

if (!nextTargetIds.length || nextTargetIds.some((targetId) => firstThreeIds.has(targetId))) {
  throw new Error(
    `C&O foundation progression is stuck on the first three targets: ${nextTargetIds.join(", ")}`
  );
}

let postPassState = state;
const postPassSelections = [];

for (let step = 0; step < 3; step += 1) {
  const plan = planDailyTrailSession(postPassState, items);
  const targetIds = plan.playItems.map((item) => item.targetId);
  postPassSelections.push(targetIds);

  if (targetIds.length > 0 && targetIds.every((targetId) => firstThreeIds.has(targetId))) {
    throw new Error(`C&O post-pass step ${step + 1} selected only the first three targets.`);
  }

  plan.newItems.forEach((item) => {
    postPassState = applyDailyTrailTeachingProgress(postPassState, plan, item.targetId);
  });
  postPassState = applyDailyTrailSessionResults(postPassState, plan, {
    completedTargetIds: targetIds,
    correctCount: targetIds.length,
    incorrectCount: 0
  });
}

let completedState = createDailyTrailState();
const coveredTargetIds = new Set();

for (let session = 0; session < 4 && !completedState.continentsOceansProgress.completedOnce; session += 1) {
  const plan = planDailyTrailSession(completedState, items);
  plan.newItems.forEach((item) => {
    completedState = applyDailyTrailTeachingProgress(completedState, plan, item.targetId);
  });
  const completedTargetIds = plan.playItems.map((item) => item.targetId);
  completedTargetIds.forEach((targetId) => coveredTargetIds.add(targetId));
  completedState = applyDailyTrailSessionResults(completedState, plan, {
    completedTargetIds,
    correctCount: completedTargetIds.length,
    incorrectCount: 0
  });
}

if (!completedState.continentsOceansProgress.completedOnce || coveredTargetIds.size !== items.length) {
  throw new Error("C&O foundation did not progress through every continent and ocean.");
}

console.log(
  "Daily Trail C&O progression check passed:",
  JSON.stringify({
    beforeFix: {
      normalizedActivityLimit: normalizedActivity.memoryTrailNewTargetLimit,
      legacySessionNewTargetCap: legacyLimit,
      canAdvanceAfterFirstThree: legacyCanAdvance
    },
    afterFix: {
      resolvedLimit,
      effectiveSessionNewTargetCap: resolvedSessionCap,
      canAdvanceAfterFirstThree: 3 < resolvedSessionCap,
      nextFoundationTargetsAfterPassingFirstThree: nextTargetIds,
      firstThreePostPassSelections: postPassSelections,
      reachableFoundationTargetCount: coveredTargetIds.size
    }
  })
);
