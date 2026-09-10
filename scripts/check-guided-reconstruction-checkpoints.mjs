import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  GUIDED_RECONSTRUCTION_CHECKPOINTS as checkpoints,
  getGuidedReconstructionRegion,
  prepareGuidedReconstructionGeometry
} from "../src/guided-reconstruction.js";
import {
  createGuidedLearningOrchestrationState,
  startGuidedLearningOrchestrationBlock,
  completeGuidedLearningOrchestrationBlock,
  selectGuidedLearningOrchestrationBlock,
  UNITED_STATES_GUIDED_LEARNING_ORCHESTRATION_V1 as config,
  GUIDED_LEARNING_BLOCK_TYPES as types
} from "../src/guided-learning-orchestration.js";
import { createMapReconstructionSession } from "../src/atlas/map-reconstruction-engine.js";
import { evaluateGuidedMapReconstruction, evaluateMapReconstruction } from "../src/atlas/map-reconstruction-evaluation.js";
import { adaptCanonicalMapReconstructionEvaluation } from "../src/canonical-learning-evidence.js";
import { getMapReconstructionRegion } from "../src/atlas/map-reconstruction-regions.js";

const readJson = (path) => JSON.parse(readFileSync(new URL(path, import.meta.url), "utf8").replace(/^\uFEFF/, ""));
const featureCollection = readJson("../assets/maps/data/maplibre-us-states-atlas.geojson");
const events = [];
const introducedGuidedStateItemIds = [];
let state = createGuidedLearningOrchestrationState();
const previouslyTested = [];
assert.equal(checkpoints.length, 10);
for (const checkpoint of checkpoints) {
  const data = readJson(`../assets/maps/data/us-states-capitals-${String(checkpoint.number).padStart(2, "0")}.json`);
  assert.deepEqual(checkpoint.stateIds, data.features.filter(({ type }) => type === "state").map(({ id }) => id));
  assert.deepEqual(checkpoint.lockedStateIds, previouslyTested);
  const block = config.blocks.find(({ id }) => id === checkpoint.blockId);
  assert.equal(block.type, types.RECONSTRUCTION_CHECKPOINT);
  assert.deepEqual(block.prerequisiteBlockIds, checkpoint.number === 1 ? [] : [checkpoints[checkpoint.number - 2].blockId]);
  assert.deepEqual(block.guidedStatePrerequisiteItemIds, checkpoint.stateIds.map((id) => `state:${id}`));
  const beforeCoverage = selectGuidedLearningOrchestrationBlock({
    state,
    repository: { events },
    introducedGuidedStateItemIds
  });
  assert.equal(beforeCoverage.evaluations.find(({ blockId }) => blockId === block.id).eligible, false);
  checkpoint.stateIds.forEach((id) => events.push({
    schemaVersion: 1, eventId: `covered:${id}`, attemptId: `covered:${id}`,
    occurredAt: "2040-01-01T00:00:00.000Z", conceptId: `state-location:${id}`,
    skillId: "locating", sourceMode: "us-memory-trail", outcome: "assisted"
  }));
  introducedGuidedStateItemIds.push(...checkpoint.stateIds.map((id) => `state:${id}`));
  for (const familyId of [null, "state-locations", "state-identification", "state-capitals", "physical-rivers", "physical-lakes", "physical-mountain-ranges", "geographic-relationships"]) {
    const decision = selectGuidedLearningOrchestrationBlock({
      state,
      repository: { events },
      introducedGuidedStateItemIds,
      targetedNeed: familyId ? { familyId } : null
    });
    assert.equal(decision.currentBlock.id, block.id, `${checkpoint.sectionId} is reachable through ${familyId || "ordinary"} selection`);
    if (familyId) assert.equal(decision.targetedNeedSatisfied, false, "A checkpoint does not pretend to satisfy a different requested skill.");
  }
  const region = getGuidedReconstructionRegion(checkpoint.regionId);
  const geometry = prepareGuidedReconstructionGeometry(featureCollection, region);
  const session = createMapReconstructionSession(region, geometry);
  assert.deepEqual(new Set(session.bankOrder), new Set(checkpoint.stateIds));
  assert.equal(Object.keys(session.piecesById).length, checkpoint.stateIds.length, "Locked context is outside the mutable session.");
  for (const id of region.stateIds) session.piecesById[id].position = { ...geometry.piecesById[id].correctPosition };
  const evaluation = checkpoint.number === 1
    ? evaluateMapReconstruction(session, region, geometry)
    : evaluateGuidedMapReconstruction(session, region, geometry, checkpoint.lockedStateIds);
  assert.equal(evaluation.isComplete, true, `${checkpoint.sectionId} accepts the canonical layout`);
  assert.deepEqual(Object.keys(evaluation.placements).sort(), [...checkpoint.stateIds].sort());
  const evidence = adaptCanonicalMapReconstructionEvaluation({ evaluation, eventIdPrefix: checkpoint.blockId, attemptId: checkpoint.blockId, occurredAt: "2040-01-01T00:00:00.000Z", sourceMode: "map-reconstruction", sourceActivityId: region.id });
  assert.equal(evidence.length, checkpoint.stateIds.length);
  assert.ok(evidence.every((event) => event.skillId === "spatial-reconstruction"), "Canonical skill meaning remains Reconstruction.");
  state = startGuidedLearningOrchestrationBlock(state, block.id);
  state = completeGuidedLearningOrchestrationBlock(state, block.id);
  previouslyTested.push(...checkpoint.stateIds);
}
assert.equal(new Set(previouslyTested).size, 48);
assert.ok(!previouslyTested.includes("alaska") && !previouslyTested.includes("hawaii"));
assert.equal(getGuidedReconstructionRegion("guided-reconstruct-us-states-11"), null);
assert.equal(getMapReconstructionRegion("rebuild-new-england").stateIds.length, 6, "Standalone New England remains six states.");
assert.equal(getGuidedReconstructionRegion("rebuild-new-england").stateIds.length, 5);
const legacy = createGuidedLearningOrchestrationState({ version: 5, completedBlockIds: ["us-guided:rebuild-new-england"] });
assert.ok(legacy.completedBlockIds.includes(checkpoints[0].blockId));
assert.equal(selectGuidedLearningOrchestrationBlock({
  state: legacy,
  repository: { events },
  introducedGuidedStateItemIds
}).currentBlock.id, checkpoints[1].blockId, "Existing checkpoint completion advances without replay or lost progress.");

const retainedCanonicalEvidence = checkpoints[0].stateIds.map((id) => ({
  schemaVersion: 1,
  eventId: `retained:${id}`,
  attemptId: `retained:${id}`,
  occurredAt: "2039-01-01T00:00:00.000Z",
  conceptId: `state-location:${id}`,
  skillId: "locating",
  sourceMode: "us-memory-trail",
  outcome: "assisted"
}));
const freshGuidedDecision = selectGuidedLearningOrchestrationBlock({
  state: createGuidedLearningOrchestrationState(),
  repository: { events: retainedCanonicalEvidence },
  introducedGuidedStateItemIds: []
});
assert.equal(freshGuidedDecision.currentBlock.type, types.GUIDED_SECTION, "Retained canonical evidence cannot start Reconstruction after a Guided-only reset.");
assert.equal(
  freshGuidedDecision.evaluations.find(({ blockId }) => blockId === checkpoints[0].blockId).reason,
  "guided-state-introduction-not-completed"
);
const fourOfFive = checkpoints[0].stateIds.slice(0, -1).map((id) => `state:${id}`);
assert.equal(selectGuidedLearningOrchestrationBlock({
  state: createGuidedLearningOrchestrationState(),
  repository: { events: retainedCanonicalEvidence },
  introducedGuidedStateItemIds: fourOfFive
}).currentBlock.type, types.GUIDED_SECTION, "Checkpoint 1 waits for every authored state introduction.");
console.log("Guided Reconstruction checkpoint content, sequence, routing, geometry, and evidence checks passed.");
