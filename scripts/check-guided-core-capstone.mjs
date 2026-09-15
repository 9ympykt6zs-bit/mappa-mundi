import assert from "node:assert/strict";

import {
  applyUnitedStatesMemoryTrailSessionResults,
  applyUnitedStatesMemoryTrailSessionSnapshot,
  applyUnitedStatesMemoryTrailSessionStart,
  createUnitedStatesMemoryTrailState
} from "../src/united-states-memory-trail-planner.js";
import {
  GUIDED_LEARNING_BLOCK_TYPES,
  UNITED_STATES_GUIDED_LEARNING_ORCHESTRATION_V1
} from "../src/guided-learning-orchestration.js";
import {
  getUnitedStatesGuidedCoreCurriculumStatus,
  getUnitedStatesGuidedCoreRequiredBlockIds,
  planUnitedStatesGuidedCoreCapstone
} from "../src/united-states-guided-core-capstone.js";

const config = UNITED_STATES_GUIDED_LEARNING_ORCHESTRATION_V1;
const states = Array.from({ length: 50 }, (_, index) => ({
  id: `state:s${index}`,
  targetId: `s${index}`,
  type: "state",
  category: "states",
  label: `State ${index}`,
  homeActivityId: `us-states-${String(Math.min(11, Math.floor(index / 5) + 1)).padStart(2, "0")}`,
  sourceActivityId: `us-states-${String(Math.min(11, Math.floor(index / 5) + 1)).padStart(2, "0")}`,
  homeStepIndex: index >= 48 ? 10 : Math.floor(index / 5),
  order: index
}));
const capitals = states.map((state, index) => ({
  id: `capital:c${index}`,
  targetId: `c${index}`,
  type: "capital",
  category: "capitals",
  label: index === 49 ? "Honolulu" : index === 48 ? "Juneau" : `Capital ${index}`,
  homeActivityId: state.homeActivityId,
  sourceActivityId: state.homeActivityId.replace("states", "capitals"),
  relatedStateItemId: state.id,
  relatedStateTargetId: state.targetId,
  homeStepIndex: state.homeStepIndex,
  order: 100 + index
}));
const items = [...states, ...capitals];
const itemProgress = Object.fromEntries(items.map((item) => [item.id, {
  status: "review",
  memoryState: "review",
  timesSeen: 1,
  correctCount: 1
}]));
const trailState = createUnitedStatesMemoryTrailState({
  currentSessionNumber: 30,
  introducedItemIds: items.map((item) => item.id),
  itemProgress
}, items);
const requiredBlockIds = getUnitedStatesGuidedCoreRequiredBlockIds(config);
const orchestrationState = { completedBlockIds: requiredBlockIds };

assert.equal(requiredBlockIds.length, 78);
assert.equal(config.blocks.filter((block) => block.type === GUIDED_LEARNING_BLOCK_TYPES.RECONSTRUCTION_CHECKPOINT).length, 10);
assert.equal(config.physicalFeatures.length, 34);

const complete = getUnitedStatesGuidedCoreCurriculumStatus({ trailState, politicalItems: items, orchestrationState, config });
assert.equal(complete.coreComplete, true);
assert.equal(complete.capstoneComplete, false);
assert.equal(complete.mode, "guided-core-capstone");

for (const missingItem of [states[48], states[49], capitals[48], capitals[49]]) {
  const missingLatePoliticalItem = createUnitedStatesMemoryTrailState({
    ...trailState,
    introducedItemIds: trailState.introducedItemIds.filter((id) => id !== missingItem.id),
    itemProgress: { ...trailState.itemProgress, [missingItem.id]: { status: "unseen" } }
  }, items);
  const status = getUnitedStatesGuidedCoreCurriculumStatus({
    trailState: missingLatePoliticalItem, politicalItems: items, orchestrationState, config
  });
  assert.equal(status.coreComplete, false);
  assert.ok([...status.missingStateItemIds, ...status.missingCapitalItemIds].includes(missingItem.id));
}

for (const missingBlockId of [
  config.blocks.find((block) => block.type === GUIDED_LEARNING_BLOCK_TYPES.RECONSTRUCTION_CHECKPOINT).id,
  config.physicalFeatures.find((feature) => feature.targetId === "alaska-range").introductionBlockId,
  config.physicalFeatures.find((feature) => feature.targetId === "alaska-range").practiceBlockId,
  config.physicalFeatures.find((feature) => feature.targetId === "brooks-range").introductionBlockId,
  config.physicalFeatures.find((feature) => feature.targetId === "brooks-range").practiceBlockId
]) {
  const status = getUnitedStatesGuidedCoreCurriculumStatus({
    trailState,
    politicalItems: items,
    orchestrationState: { completedBlockIds: requiredBlockIds.filter((id) => id !== missingBlockId) },
    config
  });
  assert.equal(status.coreComplete, false);
  assert.ok(status.missingRequiredBlockIds.includes(missingBlockId));
}

const plan = planUnitedStatesGuidedCoreCapstone({ trailState, politicalItems: items, orchestrationState, config });
const repeatedPlan = planUnitedStatesGuidedCoreCapstone({ trailState, politicalItems: items, orchestrationState, config });
assert.equal(plan.playItems.length, 10);
assert.equal(new Set(plan.playItems.map((item) => item.targetId)).size, 10);
assert.deepEqual(plan.capstone.categoryCounts, { state: 4, capital: 3, physical: 3 });
assert.deepEqual(plan.capstone.physicalFamilyCounts, { river: 1, lake: 1, "mountain-range": 1 });
assert.ok(plan.capstone.geographicBands.includes("noncontiguous"));
assert.equal(plan.capstone.introducedOnly, true);
assert.deepEqual(plan.capstone.targetOrder, repeatedPlan.capstone.targetOrder);
assert.equal(plan.presentationItems.filter((item) => item.type === "state").length, 50);
assert.equal(plan.presentationItems.filter((item) => ["river", "lake", "mountain-range"].includes(item.type)).length, 34);

const activeTrailState = createUnitedStatesMemoryTrailState({
  ...trailState,
  activeSession: { plan, status: "active" }
}, items);
assert.equal(activeTrailState.activeSession.plan.playItems.length, 10);
assert.equal(activeTrailState.guidedCoreCapstone.status, "active");
assert.equal(planUnitedStatesGuidedCoreCapstone({
  trailState: activeTrailState, politicalItems: items, orchestrationState, config
}), null);

const startedState = applyUnitedStatesMemoryTrailSessionStart(trailState, plan);
const snapshottedState = applyUnitedStatesMemoryTrailSessionSnapshot(startedState, plan, {
  memoryTrailSnapshot: {
    source: "united-states-trail",
    promptHistory: [{ targetId: plan.capstone.targetOrder[0], promptType: "name_to_place", result: "incorrect" }]
  }
});
const reloadedState = createUnitedStatesMemoryTrailState(JSON.parse(JSON.stringify(snapshottedState)), items);
assert.equal(reloadedState.activeSession.plan.playItems.length, 10);
assert.deepEqual(reloadedState.activeSession.plan.capstone.targetOrder, plan.capstone.targetOrder);
assert.equal(reloadedState.guidedCoreCapstone.completedResponses.length, 1);
const finishedState = applyUnitedStatesMemoryTrailSessionResults(reloadedState, plan, {
  completedTargetIds: plan.capstone.targetOrder.slice(1),
  missesByTargetId: { [plan.capstone.targetOrder[0]]: 1 },
  correctCount: 9,
  incorrectCount: 1,
  promptHistory: plan.capstone.targetOrder.map((targetId, index) => ({
    targetId,
    promptType: "name_to_place",
    result: index === 0 ? "incorrect" : "correct"
  }))
});
assert.equal(finishedState.guidedCoreCapstone.status, "completed");
assert.equal(finishedState.guidedCoreCapstone.completedResponses.length, 10);
assert.equal(finishedState.activeSession, null);

const completedTrailState = createUnitedStatesMemoryTrailState({
  ...trailState,
  guidedCoreCapstone: { status: "completed", targetOrder: plan.capstone.targetOrder }
}, items);
assert.equal(getUnitedStatesGuidedCoreCurriculumStatus({
  trailState: completedTrailState, politicalItems: items, orchestrationState, config
}).mode, "post-state-curriculum");
assert.equal(planUnitedStatesGuidedCoreCapstone({
  trailState: completedTrailState, politicalItems: items, orchestrationState, config
}), null);

console.log("Guided core completion and final capstone validation passed.");
