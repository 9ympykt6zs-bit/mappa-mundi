import assert from "node:assert/strict";
import fs from "node:fs";
import { journeyPresets } from "../src/journey-presets.js";
import {
  applyUnitedStatesMemoryTrailSessionResults,
  buildUnitedStatesMemoryTrailItems,
  createUnitedStatesMemoryTrailState,
  planUnitedStatesMemoryTrailSession
} from "../src/united-states-memory-trail-planner.js";

const stateActivityIds = Array.from({ length: 11 }, (_, index) => `us-states-${String(index + 1).padStart(2, "0")}`);

function readUnitedStatesTrailActivities(activityId) {
  const sectionId = activityId.replace("us-states-", "");
  const data = JSON.parse(fs.readFileSync(`assets/maps/data/us-states-capitals-${sectionId}.json`, "utf8"));
  const stateTargets = (data.features || []).filter((feature) => feature.type === "state").map((feature) => ({
    ...feature,
    kind: "shape"
  }));
  const stateTargetsByAbbreviation = new Map(stateTargets.map((target) => [target.state, target]));
  const capitalTargets = (data.features || []).filter((feature) => feature.type === "capital").map((feature) => ({
    ...feature,
    name: feature.city || feature.name,
    completedLabelName: feature.name,
    easyAcceptShapeTargetId: stateTargetsByAbbreviation.get(feature.state)?.id || null,
    kind: "point"
  }));

  return [{
    ...data,
    id: activityId,
    targets: stateTargets
  }, {
    ...data,
    id: `us-capitals-${sectionId}`,
    targets: capitalTargets
  }];
}

const journey = journeyPresets.find((candidate) => candidate.id === "united-states");
const items = buildUnitedStatesMemoryTrailItems(journey, stateActivityIds.flatMap(readUnitedStatesTrailActivities));
const targetIds = (plan) => plan.newItems.map((item) => item.targetId);

const initialState = createUnitedStatesMemoryTrailState(null, items);
const firstPlan = planUnitedStatesMemoryTrailSession(initialState, items);
assert.equal(firstPlan.source, "united-states-trail");
assert.equal(firstPlan.sessionType, "learning-session");
assert.equal(firstPlan.activeActivityId, "us-states-01");
assert.deepEqual(targetIds(firstPlan), ["maine", "new-hampshire", "massachusetts"], "Five-state sections should begin 3+2 instead of 4+1.");

const afterFirst = applyUnitedStatesMemoryTrailSessionResults(initialState, firstPlan, {
  taughtTargetIds: firstPlan.newItems.map((item) => item.targetId),
  completedTargetIds: firstPlan.newItems.map((item) => item.targetId),
  correctCount: firstPlan.newItems.length,
  incorrectCount: 0,
  missesByTargetId: {}
});
const secondPlan = planUnitedStatesMemoryTrailSession(afterFirst, items);
assert.equal(secondPlan.activeActivityId, "us-states-01");
assert.deepEqual(targetIds(secondPlan), ["rhode-island", "connecticut"], "The second New England batch should avoid a one-state leftover.");
assert.ok(secondPlan.reviewItems.length >= 1, "A recent review should be mixed in once progress exists.");

const afterSectionOne = applyUnitedStatesMemoryTrailSessionResults(afterFirst, secondPlan, {
  taughtTargetIds: secondPlan.newItems.map((item) => item.targetId),
  completedTargetIds: secondPlan.playItems.map((item) => item.targetId),
  correctCount: secondPlan.playItems.length,
  incorrectCount: 0,
  missesByTargetId: {}
});
const thirdPlan = planUnitedStatesMemoryTrailSession(afterSectionOne, items);
assert.equal(thirdPlan.activeActivityId, "us-states-01", "Capitals should follow their related state section before advancing.");
assert.deepEqual(targetIds(thirdPlan), ["augusta-me", "concord-nh", "boston-ma"], "Eligible New England capitals should be introduced after New England states.");

const afterCapitalBatchOne = applyUnitedStatesMemoryTrailSessionResults(afterSectionOne, thirdPlan, {
  taughtTargetIds: thirdPlan.newItems.map((item) => item.targetId),
  completedTargetIds: thirdPlan.playItems.map((item) => item.targetId),
  correctCount: thirdPlan.playItems.length,
  incorrectCount: 0,
  missesByTargetId: {}
});
const fourthPlan = planUnitedStatesMemoryTrailSession(afterCapitalBatchOne, items);
assert.equal(fourthPlan.activeActivityId, "us-states-01");
assert.deepEqual(targetIds(fourthPlan), ["providence-ri", "hartford-ct"], "Capital batches should avoid a one-capital leftover.");

const afterSectionOneCapitals = applyUnitedStatesMemoryTrailSessionResults(afterCapitalBatchOne, fourthPlan, {
  taughtTargetIds: fourthPlan.newItems.map((item) => item.targetId),
  completedTargetIds: fourthPlan.playItems.map((item) => item.targetId),
  correctCount: fourthPlan.playItems.length,
  incorrectCount: 0,
  missesByTargetId: {}
});
const fifthPlan = planUnitedStatesMemoryTrailSession(afterSectionOneCapitals, items);
assert.equal(fifthPlan.activeActivityId, "us-states-02", "Hidden section completion should advance to the next state section after capitals.");
assert.ok(fifthPlan.oldReviewItems.some((item) => item.homeActivityId === "us-states-01"), "A later section should include old review from a previous section.");

const weakState = createUnitedStatesMemoryTrailState({
  ...afterSectionOne,
  itemProgress: {
    ...afterSectionOne.itemProgress,
    "state:maine": {
      ...afterSectionOne.itemProgress["state:maine"],
      status: "learning",
      missCount: 2,
      correctStreak: 0,
      memoryState: "relearning",
      dueSession: afterSectionOne.currentSessionNumber
    }
  }
}, items);
const weakPlan = planUnitedStatesMemoryTrailSession(weakState, items);
assert.ok(weakPlan.weakReviewItems.some((item) => item.id === "state:maine"), "Weak states should be inserted for review.");

const weakCapitalState = createUnitedStatesMemoryTrailState({
  ...afterSectionOneCapitals,
  itemProgress: {
    ...afterSectionOneCapitals.itemProgress,
    "capital:augusta-me": {
      ...afterSectionOneCapitals.itemProgress["capital:augusta-me"],
      status: "learning",
      missCount: 2,
      correctStreak: 0,
      memoryState: "relearning",
      dueSession: afterSectionOneCapitals.currentSessionNumber
    }
  }
}, items);
const weakCapitalPlan = planUnitedStatesMemoryTrailSession(weakCapitalState, items);
assert.ok(weakCapitalPlan.weakReviewItems.some((item) => item.id === "capital:augusta-me"), "Weak capitals should be inserted for review.");

const allIntroducedState = createUnitedStatesMemoryTrailState({
  currentSessionNumber: 20,
  introducedItemIds: items.map((item) => item.id),
  itemProgress: Object.fromEntries(items.map((item, index) => [item.id, {
    status: index < 8 ? "mastered" : "review",
    timesSeen: 4,
    correctCount: 4,
    correctStreak: 3,
    lastSeenSession: Math.max(1, index % 10),
    dueSession: index < 5 ? 20 : 30
  }]))
}, items);
const reviewPlan = planUnitedStatesMemoryTrailSession(allIntroducedState, items);
assert.equal(reviewPlan.sessionType, "cumulative-review");
assert.equal(reviewPlan.newItems.length, 0);
assert.ok(reviewPlan.reviewItems.length > 0 && reviewPlan.reviewItems.length <= 10);
assert.ok(reviewPlan.reviewItems.some((item) => allIntroducedState.itemProgress[item.id].dueSession <= 20), "Due items should be prioritized in cumulative review.");

const allStatesIntroducedCapitalPendingState = createUnitedStatesMemoryTrailState({
  currentSessionNumber: 12,
  introducedItemIds: items.filter((item) => item.type === "state").map((item) => item.id),
  itemProgress: Object.fromEntries(items
    .filter((item) => item.type === "state")
    .map((item) => [item.id, {
      status: "learning",
      timesSeen: 2,
      correctCount: 1,
      correctStreak: 1,
      lastSeenSession: 11,
      dueSession: 12
    }]))
}, items);
const capitalPendingPlan = planUnitedStatesMemoryTrailSession(allStatesIntroducedCapitalPendingState, items);
assert.equal(capitalPendingPlan.newItems.every((item) => item.type === "capital"), true, "Eligible capitals should be introduced after states are introduced.");

console.log("United States Memory Trail planner validation passed.");
