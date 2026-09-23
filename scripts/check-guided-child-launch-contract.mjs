import assert from "node:assert/strict";

import {
  clearGuidedChildLaunchContract,
  completeGuidedChildLaunchContract,
  createGuidedChildLaunchContract,
  GUIDED_CHILD_LAUNCH_STORAGE_KEY,
  loadGuidedChildLaunchContract,
  saveGuidedChildLaunchContract
} from "../src/guided-child-launch-contract.js";

function memoryStorage() {
  const values = new Map();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key)
  };
}

const storage = memoryStorage();
const callback = () => "must not persist";
const input = {
  entrySource: "evidence-driven-primary-learn",
  orchestrationId: "united-states-guided-learning-v1",
  orchestrationBlockId: "us-guided:practice-white-mountains",
  launchReason: "known-weakness",
  targetedNeed: { objectiveId: "learn-physical-features", familyId: "physical-mountain-ranges" },
  onContinue: callback,
  child: {
    type: "physical-feature-practice",
    destinationKind: "targeted-memory-trail",
    activityId: "us-mountain-ranges",
    journeyId: "us-mountain-ranges",
    stepId: "us-mountain-ranges",
    cohortId: "northeast-mountains",
    targetIds: ["white-mountains", "green-mountains", "white-mountains"],
    physicalContextTargetIds: ["mississippi-river", "lake-superior", "white-mountains", "mississippi-river"],
    targetLabels: ["White Mountains", "Green Mountains"],
    targetConceptIds: ["mountain-range-location:white-mountains", "mountain-range-location:green-mountains"],
    guidedPhysicalCheckpoint: {
      cohortId: "northeast-mountains",
      targetIds: ["white-mountains", "green-mountains"]
    },
    physicalRetrievalActivity: true,
    onComplete: callback
  }
};

const created = createGuidedChildLaunchContract(input);
assert.equal(created.source, "guided-learning");
assert.equal(created.entrySource, "evidence-driven-primary-learn");
assert.equal(created.returnTo, "guided-learning");
assert.equal(created.status, "launched");
assert.deepEqual(created.child.targetIds, ["white-mountains", "green-mountains"]);
assert.deepEqual(created.child.physicalContextTargetIds, [
  "mississippi-river",
  "lake-superior",
  "white-mountains"
]);
assert.equal(created.child.physicalRetrievalActivity, true);
assert.equal("onContinue" in created, false);
assert.equal("onComplete" in created.child, false);

const saved = saveGuidedChildLaunchContract(input, storage);
assert.deepEqual(loadGuidedChildLaunchContract(storage), saved);
const serialized = storage.getItem(GUIDED_CHILD_LAUNCH_STORAGE_KEY);
assert.equal(serialized.includes("function"), false);
assert.equal(serialized.includes("must not persist"), false);

const completedCheckpoint = {
  cohortId: "northeast-mountains",
  complete: true,
  targets: [
    { targetId: "white-mountains", attemptCount: 1, incorrectCount: 0, finalOutcome: "correct" },
    { targetId: "green-mountains", attemptCount: 2, incorrectCount: 1, finalOutcome: "correct" }
  ]
};
const completed = completeGuidedChildLaunchContract(saved.orchestrationBlockId, storage, {
  guidedPhysicalCheckpoint: completedCheckpoint
});
assert.equal(completed.status, "completed");
assert.deepEqual(completed.child.guidedPhysicalCheckpoint, completedCheckpoint);
assert.deepEqual(completed.child.targetIds, saved.child.targetIds, "Completion must preserve the exact bounded subset.");
assert.deepEqual(
  completed.child.physicalContextTargetIds,
  saved.child.physicalContextTargetIds,
  "Completion must preserve the full physical map context."
);
assert.deepEqual(
  completeGuidedChildLaunchContract(saved.orchestrationBlockId, storage),
  completed,
  "Completion is deterministic and idempotent."
);
const correctedCompletion = completeGuidedChildLaunchContract(saved.orchestrationBlockId, storage, {
  guidedPhysicalCheckpoint: { ...completedCheckpoint, completionReason: "immediate-retrieval-complete" }
});
assert.equal(correctedCompletion.status, "completed");
assert.equal(
  correctedCompletion.child.guidedPhysicalCheckpoint.completionReason,
  "immediate-retrieval-complete",
  "A completed handoff can receive the final durable checkpoint without changing its lifecycle."
);
assert.deepEqual(
  completeGuidedChildLaunchContract("different-block", storage),
  correctedCompletion,
  "An unrelated child cannot mutate the durable handoff."
);

clearGuidedChildLaunchContract(storage);
assert.equal(loadGuidedChildLaunchContract(storage), null);
assert.throws(() => createGuidedChildLaunchContract({}), /block ID/);

console.log("Guided child launch contract validation passed.");
