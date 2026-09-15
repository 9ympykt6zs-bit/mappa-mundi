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

const completed = completeGuidedChildLaunchContract(saved.orchestrationBlockId, storage);
assert.equal(completed.status, "completed");
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
assert.deepEqual(
  completeGuidedChildLaunchContract("different-block", storage),
  completed,
  "An unrelated child cannot mutate the durable handoff."
);

clearGuidedChildLaunchContract(storage);
assert.equal(loadGuidedChildLaunchContract(storage), null);
assert.throws(() => createGuidedChildLaunchContract({}), /block ID/);

console.log("Guided child launch contract validation passed.");
