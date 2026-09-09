import assert from "node:assert/strict";

import {
  createUnitedStatesMemoryTrailState,
  getUnitedStatesPostStateCurriculumStatus,
  planUnitedStatesPostStateCurriculumReview
} from "../src/united-states-memory-trail-planner.js";
import {
  createGuidedLearningOrchestrationState,
  selectGuidedLearningOrchestrationBlock,
  selectGuidedLearningPostStatePhysicalReview,
  UNITED_STATES_GUIDED_LEARNING_ORCHESTRATION_V1
} from "../src/guided-learning-orchestration.js";

const states = Array.from({ length: 50 }, (_, index) => ({
  id: `state:s${index}`,
  targetId: `s${index}`,
  type: "state",
  category: "states",
  label: `State ${index}`,
  homeActivityId: "us-states-01",
  sourceActivityId: "us-states-01",
  homeStepIndex: 0,
  order: index
}));
const capitals = Array.from({ length: 10 }, (_, index) => ({
  id: `capital:c${index}`,
  targetId: `c${index}`,
  type: "capital",
  category: "capitals",
  label: `Capital ${index}`,
  homeActivityId: "us-states-01",
  sourceActivityId: "us-capitals-01",
  homeStepIndex: 0,
  order: 100 + index
}));
const items = [...states, ...capitals];
const progressFor = (item, index) => ({
  status: "review",
  memoryState: "review",
  timesSeen: 3,
  correctCount: 3,
  correctStreak: 2,
  lastSeenSession: index + 1,
  dueSession: 2
});
const completeState = createUnitedStatesMemoryTrailState({
  version: 2,
  curriculumVersion: 2,
  currentSessionNumber: 3,
  introducedItemIds: [...states.map(({ id }) => id), ...capitals.slice(0, 8).map(({ id }) => id)],
  itemProgress: Object.fromEntries([...states, ...capitals.slice(0, 8)].map(progressFor))
}, items, { seed: "post-state" });

const status = getUnitedStatesPostStateCurriculumStatus(completeState, items);
assert.equal(status.stateCurriculumComplete, true);
assert.equal(status.mode, "post-state-curriculum");
assert.equal(status.learnedStateCount, 50);
assert.equal(status.learnedCapitalCount, 8);

const fixedOptions = { seed: "post-state", now: () => new Date("2040-01-01T00:00:00.000Z") };
const plan = planUnitedStatesPostStateCurriculumReview(completeState, items, fixedOptions);
assert.equal(plan.sessionType, "post-state-curriculum-review");
assert.equal(plan.newItems.length, 0);
assert.ok(plan.playItems.every((item) => completeState.itemProgress[item.id]?.status !== "unseen"));
assert.ok(plan.playItems.some((item) => item.type === "state"));
assert.ok(plan.playItems.some((item) => item.type === "capital"));
assert.equal(plan.postStateCurriculum.selectedStateCount, 5);
assert.equal(plan.postStateCurriculum.selectedCapitalCount, 5);
assert.equal(plan.postStateCurriculum.learnedOnly, true);
assert.deepEqual(plan, planUnitedStatesPostStateCurriculumReview(completeState, items, fixedOptions));

const incompleteState = createUnitedStatesMemoryTrailState({
  ...completeState,
  itemProgress: { ...completeState.itemProgress, [states[49].id]: { status: "unseen" } },
  introducedItemIds: completeState.introducedItemIds.filter((id) => id !== states[49].id)
}, items);
assert.equal(getUnitedStatesPostStateCurriculumStatus(incompleteState, items).stateCurriculumComplete, false);
assert.equal(planUnitedStatesPostStateCurriculumReview(incompleteState, items), null);

const activeState = createUnitedStatesMemoryTrailState({
  ...completeState,
  activeSession: { plan, status: "active" }
}, items);
assert.equal(getUnitedStatesPostStateCurriculumStatus(activeState, items).hasActiveSession, true);
assert.equal(planUnitedStatesPostStateCurriculumReview(activeState, items), null);

const config = UNITED_STATES_GUIDED_LEARNING_ORCHESTRATION_V1;
const pool = config.physicalReviewPools[0];
const featureByTargetId = new Map(config.physicalFeatures.map((feature) => [feature.targetId, feature]));
const physicalState = createGuidedLearningOrchestrationState({
  completedBlockIds: pool.targetIds.map((targetId) => featureByTargetId.get(targetId).introductionBlockId),
  guidedLearningEventCount: 4,
  physicalReviewProgress: {
    [pool.id]: {
      cohortId: pool.id,
      generation: 1,
      previousOrder: [],
      previousTargetIds: [],
      targets: Object.fromEntries(pool.targetIds.map((targetId) => [targetId, {
        targetId,
        lastLearningEvent: 1,
        dueAfterLearningEvent: 3,
        lastOutcome: "correct",
        priority: "later"
      }]))
    }
  }
}, config);
const physical = selectGuidedLearningPostStatePhysicalReview({ state: physicalState, config });
assert.equal(physical.eligible, true);
assert.equal(physical.block.repeatable, true);
assert.equal(physical.block.destination.kind, "targeted-memory-trail");
assert.ok(physical.block.destination.targetIds.every((targetId) => pool.targetIds.includes(targetId)));
assert.ok(physical.block.destination.targetIds.every((targetId) => (
  physicalState.completedBlockIds.includes(featureByTargetId.get(targetId).introductionBlockId)
)));

const reconstructionReview = config.blocks.find(({ type }) => (
  type === "post-state-reconstruction-review"
));
assert.ok(reconstructionReview);
assert.equal(reconstructionReview.repeatable, true);
assert.equal(reconstructionReview.destination.kind, "map-reconstruction");
assert.equal(reconstructionReview.destination.regionId, "guided-reconstruct-us-states-10");
assert.notEqual(selectGuidedLearningOrchestrationBlock({ config }).currentBlock.type, reconstructionReview.type);

console.log("Post-state curriculum routing validation passed.");
