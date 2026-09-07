import assert from "node:assert/strict";

import {
  chooseNextGuidedPhysicalRetrievalTarget,
  createDeterministicGuidedPhysicalRetrievalOrder,
  createGuidedPhysicalRetrievalCheckpoint,
  getGuidedPhysicalRetrievalCheckpointSnapshot,
  isGuidedPhysicalRetrievalCheckpointComplete,
  recordGuidedPhysicalRetrievalResult
} from "../src/guided-physical-retrieval-checkpoint.js";
import {
  completeGuidedLearningOrchestrationBlock,
  createGuidedLearningOrchestrationState,
  getGuidedLearningPhysicalReviewEligibility,
  satisfyGuidedLearningPhysicalInterleave,
  selectGuidedLearningOrchestrationBlock,
  startGuidedLearningOrchestrationBlock,
  UNITED_STATES_GUIDED_LEARNING_ORCHESTRATION_V1
} from "../src/guided-learning-orchestration.js";

const cohortId = "northeast-mountains";
const authoredOrder = ["white-mountains", "green-mountains", "adirondack-mountains"];

function answer(checkpoint, result) {
  const next = chooseNextGuidedPhysicalRetrievalTarget(checkpoint);
  assert.ok(next, "An unfinished checkpoint should provide a target.");
  return {
    targetId: next.targetId,
    attempt: next.attempt,
    checkpoint: recordGuidedPhysicalRetrievalResult(checkpoint, next.targetId, result)
  };
}

const order = createDeterministicGuidedPhysicalRetrievalOrder(authoredOrder, { cohortId, generation: 0 });
assert.deepEqual(
  createDeterministicGuidedPhysicalRetrievalOrder(authoredOrder, { cohortId, generation: 0 }),
  order,
  "Identical state must reproduce the same target order."
);
assert.notDeepEqual(order, authoredOrder, "The initial check must not simply use authored source order.");
assert.notDeepEqual(
  createDeterministicGuidedPhysicalRetrievalOrder(authoredOrder, {
    cohortId,
    generation: 1,
    previousOrder: order
  }),
  order,
  "A later review should not repeat the identical complete ordering."
);

let allCorrect = createGuidedPhysicalRetrievalCheckpoint({ cohortId, targetIds: authoredOrder });
const allCorrectSequence = [];
while (!isGuidedPhysicalRetrievalCheckpointComplete(allCorrect)) {
  const result = answer(allCorrect, "correct");
  allCorrectSequence.push(result.targetId);
  allCorrect = result.checkpoint;
}
assert.equal(allCorrectSequence.length, 3, "Three first-attempt successes must end after three questions.");
assert.equal(new Set(allCorrectSequence).size, 3, "Every taught member is checked exactly once.");
assert.equal(chooseNextGuidedPhysicalRetrievalTarget(allCorrect), null);
assert.equal(
  getGuidedPhysicalRetrievalCheckpointSnapshot(allCorrect).completionReason,
  "all-immediate-targets-complete"
);

for (const representative of [
  { cohortId: "western-rivers", targetIds: ["colorado-river", "columbia-river", "rio-grande-river"] },
  { cohortId: "representative-great-lakes", targetIds: ["lake-superior", "lake-michigan", "lake-huron"] }
]) {
  let checkpoint = createGuidedPhysicalRetrievalCheckpoint(representative);
  let promptCount = 0;
  while (!isGuidedPhysicalRetrievalCheckpointComplete(checkpoint)) {
    checkpoint = answer(checkpoint, "correct").checkpoint;
    promptCount += 1;
  }
  assert.equal(
    promptCount,
    representative.targetIds.length,
    `${representative.cohortId} uses the same demonstrate-then-move-on contract.`
  );
}

let oneMiss = createGuidedPhysicalRetrievalCheckpoint({ cohortId, targetIds: authoredOrder });
const first = answer(oneMiss, "incorrect");
oneMiss = first.checkpoint;
assert.deepEqual(
  getGuidedPhysicalRetrievalCheckpointSnapshot(oneMiss).retryPendingTargetIds,
  [first.targetId]
);
const second = answer(oneMiss, "correct");
oneMiss = second.checkpoint;
const third = answer(oneMiss, "correct");
oneMiss = third.checkpoint;
const retry = answer(oneMiss, "correct");
oneMiss = retry.checkpoint;
assert.notEqual(second.targetId, first.targetId, "A miss must not be repeated while comparison targets remain.");
assert.equal(retry.targetId, first.targetId, "The missed target receives one later retry.");
assert.equal(retry.attempt, "retry");
assert.equal(getGuidedPhysicalRetrievalCheckpointSnapshot(oneMiss).targets
  .find(({ targetId }) => targetId === first.targetId).attemptCount, 2);
assert.equal(isGuidedPhysicalRetrievalCheckpointComplete(oneMiss), true);

let twiceMissed = createGuidedPhysicalRetrievalCheckpoint({ cohortId, targetIds: authoredOrder });
const missedTargetId = chooseNextGuidedPhysicalRetrievalTarget(twiceMissed).targetId;
twiceMissed = recordGuidedPhysicalRetrievalResult(twiceMissed, missedTargetId, "incorrect");
while (chooseNextGuidedPhysicalRetrievalTarget(twiceMissed)?.attempt === "initial") {
  const result = answer(twiceMissed, "correct");
  twiceMissed = result.checkpoint;
}
twiceMissed = recordGuidedPhysicalRetrievalResult(twiceMissed, missedTargetId, "incorrect");
assert.equal(isGuidedPhysicalRetrievalCheckpointComplete(twiceMissed), true, "A second miss ends rather than deadlocking.");
assert.equal(chooseNextGuidedPhysicalRetrievalTarget(twiceMissed), null);

const completedSnapshot = getGuidedPhysicalRetrievalCheckpointSnapshot(twiceMissed);
assert.equal(completedSnapshot.completionReason, "retry-limit-reached-with-review-needed");
assert.deepEqual(completedSnapshot.missedTargetIds, [missedTargetId]);
let reviewState = createGuidedLearningOrchestrationState({
  activeBlockId: "us-guided:practice-white-mountains",
  activeStatus: "launched",
  returnContext: {
    physicalCohortId: cohortId,
    physicalCohortTargetIds: authoredOrder
  }
});
reviewState = completeGuidedLearningOrchestrationBlock(
  reviewState,
  "us-guided:practice-white-mountains",
  UNITED_STATES_GUIDED_LEARNING_ORCHESTRATION_V1,
  { guidedPhysicalCheckpoint: completedSnapshot }
);
assert.equal(getGuidedLearningPhysicalReviewEligibility(reviewState, cohortId).eligible, false);
assert.equal(
  reviewState.physicalReviewProgress[cohortId].targets[missedTargetId].dueAfterLearningEvent,
  1,
  "Incorrect evidence gets the shorter spacing interval."
);
const correctTargetId = authoredOrder.find((targetId) => targetId !== missedTargetId);
assert.equal(
  reviewState.physicalReviewProgress[cohortId].targets[correctTargetId].dueAfterLearningEvent,
  2,
  "Successful evidence gets the longer spacing interval."
);

reviewState = satisfyGuidedLearningPhysicalInterleave(reviewState, { sessionNumber: 1 });
const earlyEligibility = getGuidedLearningPhysicalReviewEligibility(reviewState, cohortId);
assert.equal(earlyEligibility.eligible, true, "A weak target can return after one intervening Guided Learning event.");
assert.ok(earlyEligibility.dueTargetIds.includes(missedTargetId));
assert.ok(earlyEligibility.targetIds.length >= 2, "Review preserves a meaningful comparison set.");
const completedNonrepeatableBlockIds = UNITED_STATES_GUIDED_LEARNING_ORCHESTRATION_V1.blocks
  .filter(({ repeatable }) => !repeatable)
  .map(({ id }) => id);
const earlyDecision = selectGuidedLearningOrchestrationBlock({
  state: createGuidedLearningOrchestrationState({
    ...reviewState,
    completedBlockIds: completedNonrepeatableBlockIds,
    physicalInterleaveRequired: false
  }),
  repository: { events: [] },
  hasUnfinishedNonPhysicalLearning: false
});
assert.equal(earlyDecision.currentBlock.id, "us-guided:review-physical-family-review:mountain-range");
assert.equal(earlyDecision.currentBlock.destination.checkpointKind, "review");
const pacedReviewDecision = selectGuidedLearningOrchestrationBlock({
  state: createGuidedLearningOrchestrationState({
    ...reviewState,
    completedBlockIds: completedNonrepeatableBlockIds,
    physicalInterleaveRequired: true
  }),
  repository: { events: [] },
  hasUnfinishedNonPhysicalLearning: true
});
assert.equal(pacedReviewDecision.currentBlock.type, "guided-section");
assert.equal(pacedReviewDecision.fallbackReason, "physical-review-interleave-required");

const allCorrectSnapshot = getGuidedPhysicalRetrievalCheckpointSnapshot(allCorrect);
let laterState = createGuidedLearningOrchestrationState({
  activeBlockId: "us-guided:practice-white-mountains",
  activeStatus: "launched",
  returnContext: {
    physicalCohortId: cohortId,
    physicalCohortTargetIds: authoredOrder
  }
});
laterState = completeGuidedLearningOrchestrationBlock(
  laterState,
  "us-guided:practice-white-mountains",
  UNITED_STATES_GUIDED_LEARNING_ORCHESTRATION_V1,
  { guidedPhysicalCheckpoint: allCorrectSnapshot }
);
laterState = satisfyGuidedLearningPhysicalInterleave(laterState, { sessionNumber: 1 });
assert.equal(getGuidedLearningPhysicalReviewEligibility(laterState, cohortId).eligible, false);
laterState = satisfyGuidedLearningPhysicalInterleave(laterState, { sessionNumber: 2 });
assert.equal(getGuidedLearningPhysicalReviewEligibility(laterState, cohortId).eligible, true);
assert.deepEqual(
  getGuidedLearningPhysicalReviewEligibility(laterState, cohortId),
  getGuidedLearningPhysicalReviewEligibility(laterState, cohortId),
  "Identical persisted state produces identical review eligibility."
);

const reviewDecision = selectGuidedLearningOrchestrationBlock({
  state: createGuidedLearningOrchestrationState({
    ...laterState,
    completedBlockIds: completedNonrepeatableBlockIds,
    physicalInterleaveRequired: false
  }),
  repository: { events: [] },
  hasUnfinishedNonPhysicalLearning: false
});
laterState = createGuidedLearningOrchestrationState({
  ...laterState,
  completedBlockIds: completedNonrepeatableBlockIds,
  physicalInterleaveRequired: false
});
laterState = startGuidedLearningOrchestrationBlock(laterState, reviewDecision.currentBlock.id);
laterState = completeGuidedLearningOrchestrationBlock(
  laterState,
  reviewDecision.currentBlock.id,
  UNITED_STATES_GUIDED_LEARNING_ORCHESTRATION_V1,
  { guidedPhysicalCheckpoint: allCorrectSnapshot }
);
assert.equal(laterState.completedBlockIds.includes(reviewDecision.currentBlock.id), false, "Review blocks remain reusable.");
assert.equal(getGuidedLearningPhysicalReviewEligibility(laterState, cohortId).eligible, false);

console.log("Guided physical retrieval checkpoint and spaced-review validation passed.");
