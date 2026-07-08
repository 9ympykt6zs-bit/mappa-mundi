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

function readStateActivity(activityId) {
  const sectionId = activityId.replace("us-states-", "");
  const data = JSON.parse(fs.readFileSync(`assets/maps/data/us-states-capitals-${sectionId}.json`, "utf8"));
  return {
    ...data,
    id: activityId,
    targets: (data.features || []).filter((feature) => feature.type === "state").map((feature) => ({
      ...feature,
      kind: "shape"
    }))
  };
}

const journey = journeyPresets.find((candidate) => candidate.id === "united-states");
const items = buildUnitedStatesMemoryTrailItems(journey, stateActivityIds.map(readStateActivity));
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
assert.equal(thirdPlan.activeActivityId, "us-states-02", "Hidden section completion should advance to the next state section.");
assert.ok(thirdPlan.oldReviewItems.some((item) => item.homeActivityId === "us-states-01"), "A later section should include old review from a previous section.");

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

console.log("United States Memory Trail planner validation passed.");
