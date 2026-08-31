import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  completeGuidedLearningOrchestrationBlock,
  createGuidedLearningOrchestrationState,
  createPhysicalFeatureIntroductionEvidence,
  createUnitedStatesGuidedLearningOrchestrationConfig,
  GUIDED_LEARNING_BLOCK_TYPES,
  resetGuidedLearningOrchestrationState,
  satisfyGuidedLearningPhysicalInterleave,
  selectGuidedLearningOrchestrationBlock,
  startGuidedLearningOrchestrationBlock,
  UNITED_STATES_GUIDED_LEARNING_ORCHESTRATION_V1,
  validateGuidedLearningOrchestrationConfig
} from "../src/guided-learning-orchestration.js";
import {
  buildUnitedStatesPhysicalFeatureOrchestrationInventory,
  calculateGuidedLearningPhysicalFeatureCamera,
  UNITED_STATES_PHYSICAL_FEATURE_ORCHESTRATION_INVENTORY
} from "../src/united-states-physical-feature-orchestration.js";
import { unitedStatesAtlas } from "../src/atlas/united-states-atlas-data.js";

function readJson(pathname) {
  return JSON.parse(readFileSync(new URL(pathname, import.meta.url), "utf8"));
}

function asActivity(pathname) {
  const activity = readJson(pathname);
  return { ...activity, targets: activity.targets || activity.features || [] };
}

function canonicalEvent(conceptId, outcome = "correct", index = 0, occurredAt = "2036-01-01T12:00:00.000Z") {
  return {
    schemaVersion: 1,
    eventId: `physical-orchestration:${conceptId}:${outcome}:${index}`,
    attemptId: `physical-orchestration:${conceptId}:${outcome}:${index}`,
    occurredAt,
    sequence: index,
    conceptId,
    skillId: "locating",
    sourceMode: "test",
    outcome
  };
}

function stateEvents(stateIds, { start = 0, occurredAt = "2036-01-01T12:00:00.000Z", outcome = "correct" } = {}) {
  return stateIds.map((stateId, index) => canonicalEvent(
    `state-location:${stateId}`,
    outcome,
    start + index,
    occurredAt
  ));
}

function findSourceFeature(feature) {
  const path = feature.family === "river"
    ? "../assets/data/physical-features/proof-sheet-rivers.geojson"
    : feature.family === "lake"
      ? "../assets/maps/data/inland-waters.geojson"
      : "../assets/data/physical-features/us-mountain-ranges.geojson";
  const collection = readJson(path);
  return collection.features.find((candidate) => {
    const properties = candidate.properties || {};
    return properties.id === feature.geometry.featureId
      || properties.name === feature.geometry.featureId
      || candidate.id === feature.geometry.featureId;
  });
}

const inventory = UNITED_STATES_PHYSICAL_FEATURE_ORCHESTRATION_INVENTORY;
const supported = inventory.filter(({ supported: isSupported }) => isSupported);
const deferred = inventory.filter(({ supported: isSupported }) => !isSupported);

assert.equal(inventory.length, 34, "The audited inventory contains every authored river, lake, and mountain range.");
assert.equal(supported.length, 33);
assert.deepEqual(deferred.map(({ id, exclusionReason }) => [id, exclusionReason]), [
  ["river:st-lawrence-river", "incomplete-geometry"]
]);
assert.deepEqual(UNITED_STATES_GUIDED_LEARNING_ORCHESTRATION_V1.deferredPhysicalFamilies, [
  { family: "coast", reason: "relationship-only-no-targeted-retrieval-path" }
]);
assert.deepEqual(validateGuidedLearningOrchestrationConfig(), []);

const familyCounts = Object.groupBy(supported, ({ family }) => family);
assert.deepEqual(Object.fromEntries(Object.entries(familyCounts).map(([family, features]) => [family, features.length])), {
  river: 7,
  lake: 6,
  "mountain-range": 20
});

const activities = new Map([
  ["us-physical-rivers", asActivity("../assets/maps/data/us-physical-rivers.json")],
  ["us-physical-lakes", asActivity("../assets/maps/data/us-physical-lakes.json")]
]);
const mountainActivities = [
  asActivity("../assets/maps/data/us-physical-western-mountains.json"),
  asActivity("../assets/maps/data/us-physical-eastern-mountains.json"),
  asActivity("../assets/maps/data/us-physical-midwestern-mountains.json"),
  asActivity("../assets/maps/data/us-physical-alaska-mountains.json")
];
activities.set("us-mountain-ranges", {
  id: "us-mountain-ranges",
  targets: mountainActivities.flatMap(({ targets }) => targets)
});
supported.forEach((feature) => {
  assert.ok(
    activities.get(feature.activityId)?.targets.some(({ id }) => id === feature.targetId),
    `${feature.name} resolves to a real target in ${feature.activityId}.`
  );
  assert.ok(findSourceFeature(feature), `${feature.name} resolves to its declared geometry feature.`);
});

const stLawrence = inventory.find(({ targetId }) => targetId === "st-lawrence-river");
assert.equal(stLawrence.geometry.representation, "incomplete");
assert.ok(!UNITED_STATES_GUIDED_LEARNING_ORCHESTRATION_V1.blocks.some(({ featureId }) => featureId === stLawrence.id));
const cascades = inventory.find(({ targetId }) => targetId === "cascade-mountains");
assert.equal(cascades.geometry.representation, "scope-limited");
assert.equal(cascades.supported, true, "Scope-limited geometry remains usable without being called full.");
const columbia = inventory.find(({ targetId }) => targetId === "columbia-river");
assert.equal(columbia.geometry.representation, "full");
assert.equal(columbia.geometry.crossesInternationalBorder, true);
assert.equal(findSourceFeature(columbia).geometry.coordinates.length > 0, true, "Full source geometry is reused without orchestration clipping.");

const greatSaltLake = UNITED_STATES_GUIDED_LEARNING_ORCHESTRATION_V1.physicalFeatures
  .find(({ targetId }) => targetId === "great-salt-lake");
assert.equal(greatSaltLake.blockIds.length, 2);
assert.equal(greatSaltLake.connectionBlockId, null);
assert.equal(
  UNITED_STATES_GUIDED_LEARNING_ORCHESTRATION_V1.blocks.find(({ id }) => id === greatSaltLake.practiceBlockId)?.sequenceCompletion,
  true,
  "A feature without a Connection returns after focused retrieval."
);

const rocky = inventory.find(({ targetId }) => targetId === "rocky-mountains");
const originalRockyRelationships = unitedStatesAtlas.relationships
  .filter(({ from }) => from === rocky.id)
  .map(({ to }) => to);
const overriddenInventory = buildUnitedStatesPhysicalFeatureOrchestrationInventory({
  introductionPrerequisiteStateIdsByFeature: {
    "rocky-mountains": ["colorado"]
  }
});
const overriddenRocky = overriddenInventory.find(({ id }) => id === rocky.id);
assert.equal(rocky.prerequisiteSource, "derived-authored-relationships");
assert.deepEqual(rocky.introductionPrerequisiteStateIds, rocky.authoredStateIds);
assert.equal(overriddenRocky.prerequisiteSource, "explicit-introduction-override");
assert.deepEqual(overriddenRocky.introductionPrerequisiteStateIds, ["colorado"]);
assert.deepEqual(overriddenRocky.authoredStateIds, rocky.authoredStateIds);
assert.deepEqual(
  unitedStatesAtlas.relationships.filter(({ from }) => from === rocky.id).map(({ to }) => to),
  originalRockyRelationships,
  "An introduction override does not modify geographic truth."
);
const overriddenConfig = createUnitedStatesGuidedLearningOrchestrationConfig({
  physicalFeatureInventory: overriddenInventory.filter(({ id }) => id === rocky.id)
});
const overriddenIntro = overriddenConfig.blocks.find(({ featureId, featurePhase }) => (
  featureId === rocky.id && featurePhase === "introduction"
));
assert.equal(selectGuidedLearningOrchestrationBlock({
  config: overriddenConfig,
  repository: { events: stateEvents(["colorado"]) },
  hasUnfinishedNonPhysicalLearning: true
}).currentBlock.id, overriddenIntro.id);

const incorrectRockyDecision = selectGuidedLearningOrchestrationBlock({
  config: overriddenConfig,
  repository: { events: stateEvents(["colorado"], { outcome: "incorrect" }) }
});
assert.equal(incorrectRockyDecision.currentBlock.type, GUIDED_LEARNING_BLOCK_TYPES.GUIDED_SECTION);
const assistedRockyDecision = selectGuidedLearningOrchestrationBlock({
  config: overriddenConfig,
  repository: { events: stateEvents(["colorado"], { outcome: "assisted" }) }
});
assert.equal(assistedRockyDecision.currentBlock.id, overriddenIntro.id);

const representativeFeatures = [
  inventory.find(({ targetId }) => targetId === "white-mountains"),
  columbia,
  inventory.find(({ targetId }) => targetId === "lake-superior")
];
representativeFeatures.forEach((feature) => {
  const sourceFeature = findSourceFeature(feature);
  const originalGeometry = JSON.stringify(sourceFeature.geometry);
  const camera = calculateGuidedLearningPhysicalFeatureCamera({
    feature: sourceFeature,
    family: feature.family,
    camera: feature.camera,
    viewport: "desktop"
  });
  assert.equal(camera.mode, "fit-feature");
  assert.ok(camera.bounds.flat(2).every(Number.isFinite));
  assert.ok(camera.bounds[0][0] < camera.sourceBounds[0][0] && camera.bounds[1][0] > camera.sourceBounds[1][0]);
  assert.equal(JSON.stringify(sourceFeature.geometry), originalGeometry, "Camera calculation does not mutate standalone geometry.");
});
assert.deepEqual(calculateGuidedLearningPhysicalFeatureCamera({
  feature: findSourceFeature(rocky),
  family: rocky.family,
  camera: { mode: "override", center: [-106, 40], zoom: 4.5, bearing: 2, pitch: 8 }
}), {
  mode: "override",
  center: [-106, 40],
  zoom: 4.5,
  bearing: 2,
  pitch: 8
});

const queueInventory = inventory.filter(({ targetId }) => ["columbia-river", "lake-huron"].includes(targetId));
const queueConfig = createUnitedStatesGuidedLearningOrchestrationConfig({ physicalFeatureInventory: queueInventory });
const lakeHuron = queueConfig.physicalFeatures.find(({ targetId }) => targetId === "lake-huron");
const queueColumbia = queueConfig.physicalFeatures.find(({ targetId }) => targetId === "columbia-river");
const queueEvents = [
  ...stateEvents(["michigan"], { start: 1, occurredAt: "2036-01-01T11:00:00.000Z" }),
  ...stateEvents(["oregon", "washington"], { start: 2, occurredAt: "2036-01-02T11:00:00.000Z" })
];
let queueState = createGuidedLearningOrchestrationState(null, queueConfig);
let decision = selectGuidedLearningOrchestrationBlock({
  config: queueConfig,
  state: queueState,
  repository: { events: queueEvents },
  hasUnfinishedNonPhysicalLearning: true
});
assert.equal(decision.currentBlock.id, lakeHuron.introductionBlockId, "First-eligible milestone precedes authored order.");
assert.deepEqual(decision.pendingPhysicalFeatureOrder.map(({ featureId }) => featureId), [lakeHuron.id, queueColumbia.id]);
assert.deepEqual(
  selectGuidedLearningOrchestrationBlock({
    config: queueConfig,
    state: queueState,
    repository: { events: queueEvents },
    hasUnfinishedNonPhysicalLearning: true
  }).pendingPhysicalFeatureOrder,
  decision.pendingPhysicalFeatureOrder,
  "Identical state and evidence produce identical queue order."
);

queueState = startGuidedLearningOrchestrationBlock(queueState, lakeHuron.introductionBlockId, {}, queueConfig);
const lakeIntroBlock = queueConfig.blocks.find(({ id }) => id === lakeHuron.introductionBlockId);
const exposure = createPhysicalFeatureIntroductionEvidence({
  block: lakeIntroBlock,
  identity: {
    eventId: "physical-orchestration:lake-huron:introduction",
    attemptId: "physical-orchestration:lake-huron:introduction",
    occurredAt: "2036-01-03T12:00:00.000Z",
    sessionId: "physical-orchestration:test",
    sequence: 9
  }
});
assert.equal(exposure.outcome, "assisted");
assert.equal(exposure.conceptId, lakeHuron.conceptId);
assert.ok(!exposure.conceptId.includes("canada"), "Visible cross-border geography does not fabricate foreign evidence.");
queueState = completeGuidedLearningOrchestrationBlock(queueState, lakeHuron.introductionBlockId, queueConfig);
const withLakeExposure = { events: [...queueEvents, exposure] };
decision = selectGuidedLearningOrchestrationBlock({
  config: queueConfig,
  state: queueState,
  repository: withLakeExposure,
  hasUnfinishedNonPhysicalLearning: true
});
assert.equal(decision.currentBlock.id, lakeHuron.practiceBlockId);
queueState = startGuidedLearningOrchestrationBlock(queueState, lakeHuron.practiceBlockId, {}, queueConfig);
queueState = completeGuidedLearningOrchestrationBlock(queueState, lakeHuron.practiceBlockId, queueConfig);
decision = selectGuidedLearningOrchestrationBlock({
  config: queueConfig,
  state: queueState,
  repository: withLakeExposure,
  hasUnfinishedNonPhysicalLearning: true
});
assert.equal(decision.currentBlock.id, lakeHuron.connectionBlockId);
queueState = startGuidedLearningOrchestrationBlock(queueState, lakeHuron.connectionBlockId, {}, queueConfig);
queueState = completeGuidedLearningOrchestrationBlock(queueState, lakeHuron.connectionBlockId, queueConfig);
assert.equal(queueState.physicalInterleaveRequired, true);

decision = selectGuidedLearningOrchestrationBlock({
  config: queueConfig,
  state: queueState,
  repository: withLakeExposure,
  hasUnfinishedNonPhysicalLearning: true
});
assert.equal(decision.currentBlock.type, GUIDED_LEARNING_BLOCK_TYPES.GUIDED_SECTION);
assert.equal(decision.fallbackReason, "physical-feature-interleave-required");
assert.equal(decision.physicalFeatureTrace.find(({ featureId }) => featureId === queueColumbia.id).reason, "physical-feature-interleave-required");

const pendingState = queueState;
assert.equal(
  selectGuidedLearningOrchestrationBlock({
    config: queueConfig,
    state: pendingState,
    repository: withLakeExposure,
    hasUnfinishedNonPhysicalLearning: true
  }).currentBlock.type,
  GUIDED_LEARNING_BLOCK_TYPES.GUIDED_SECTION,
  "Merely reopening the coordinator does not satisfy the interleave."
);
const checkpointRepository = {
  events: [
    ...withLakeExposure.events,
    ...stateEvents(
      ["maine", "new-hampshire", "vermont", "massachusetts", "rhode-island", "connecticut"],
      { start: 20, occurredAt: "2036-01-04T12:00:00.000Z" }
    )
  ]
};
let checkpointState = pendingState;
const checkpointDecision = selectGuidedLearningOrchestrationBlock({
  config: queueConfig,
  state: checkpointState,
  repository: checkpointRepository,
  hasUnfinishedNonPhysicalLearning: true
});
assert.equal(checkpointDecision.currentBlock.type, GUIDED_LEARNING_BLOCK_TYPES.RECONSTRUCTION_CHECKPOINT);
checkpointState = startGuidedLearningOrchestrationBlock(
  checkpointState,
  checkpointDecision.currentBlock.id,
  {},
  queueConfig
);
checkpointState = completeGuidedLearningOrchestrationBlock(
  checkpointState,
  checkpointDecision.currentBlock.id,
  queueConfig
);
assert.equal(checkpointState.physicalInterleaveRequired, false, "A real Reconstruction checkpoint satisfies interleaving.");
queueState = satisfyGuidedLearningPhysicalInterleave(queueState, { sessionNumber: 7 }, queueConfig);
assert.equal(queueState.physicalInterleaveRequired, false);
assert.equal(queueState.lastNonPhysicalMilestone.kind, "guided-session-completed");
assert.equal(selectGuidedLearningOrchestrationBlock({
  config: queueConfig,
  state: queueState,
  repository: withLakeExposure,
  hasUnfinishedNonPhysicalLearning: true
}).currentBlock.id, queueColumbia.introductionBlockId);

const exhaustedState = createGuidedLearningOrchestrationState({
  ...pendingState,
  physicalInterleaveRequired: true
}, queueConfig);
decision = selectGuidedLearningOrchestrationBlock({
  config: queueConfig,
  state: exhaustedState,
  repository: withLakeExposure,
  hasUnfinishedNonPhysicalLearning: false
});
assert.equal(decision.currentBlock.id, queueColumbia.introductionBlockId);
assert.equal(decision.selectionReason, "nonphysical-curriculum-exhausted-drain-physical-backlog");

const storageValues = new Map([["mappaGuidedLearningOrchestration", JSON.stringify(queueState)]]);
const storage = {
  getItem: (key) => storageValues.get(key) || null,
  setItem: (key, value) => storageValues.set(key, value),
  removeItem: (key) => storageValues.delete(key)
};
assert.equal(resetGuidedLearningOrchestrationState(storage).physicalInterleaveRequired, false);
assert.equal(storage.getItem("mappaGuidedLearningOrchestration"), null);

console.log("Guided Learning physical-feature orchestration validation passed (34 audited, 33 orchestrated, 1 geometry-deferred). ");
