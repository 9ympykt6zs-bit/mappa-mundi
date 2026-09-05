import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  completeGuidedLearningOrchestrationBlock,
  completeGuidedLearningPhysicalFeatureIntroductions,
  createGuidedLearningOrchestrationState,
  createPhysicalFeatureIntroductionEvidence,
  createPhysicalFeatureIntroductionEvidenceEvents,
  createUnitedStatesGuidedLearningOrchestrationConfig,
  deferGuidedLearningOrchestrationBlock,
  GUIDED_LEARNING_BLOCK_TYPES,
  resetGuidedLearningOrchestrationState,
  selectPhysicalCohortRetrievalSubset,
  satisfyGuidedLearningPhysicalInterleave,
  selectGuidedLearningOrchestrationBlock,
  startGuidedLearningOrchestrationBlock,
  UNITED_STATES_GUIDED_LEARNING_ORCHESTRATION_V1,
  validateGuidedLearningOrchestrationConfig
} from "../src/guided-learning-orchestration.js";
import {
  buildUnitedStatesPhysicalFeatureOrchestrationInventory,
  calculateGuidedLearningPhysicalFeatureCamera,
  UNITED_STATES_PHYSICAL_FEATURE_ORCHESTRATION_INVENTORY,
  UNITED_STATES_GUIDED_LOWER48_PHYSICAL_CAMERA,
  UNITED_STATES_GUIDED_PHYSICAL_REGIONAL_CAMERA_PRESETS
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
assert.deepEqual(
  UNITED_STATES_GUIDED_LEARNING_ORCHESTRATION_V1.deferredPhysicalCohortGroups,
  [
    { family: "mountain-range", sourceId: "us-physical-western-mountains", reason: "authored-group-too-large-for-novice-cohort" },
    { family: "mountain-range", sourceId: "us-physical-eastern-mountains:remaining-members", reason: "no-authored-small-subgroup" },
    { family: "lake", sourceId: "us-physical-lakes", reason: "no-authored-small-cohort" }
  ]
);

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
assert.deepEqual(
  activities.get("us-physical-rivers").memoryTrailSections.map(({ id, targetIds }) => ({ id, targetIds })),
  [
    {
      id: "western-rivers",
      targetIds: ["colorado-river", "columbia-river", "rio-grande-river"]
    },
    {
      id: "central-eastern-rivers",
      targetIds: ["arkansas-river", "mississippi-river", "missouri-river", "ohio-river", "st-lawrence-river"]
    }
  ],
  "River cohorts come from existing authored Memory Trail sections."
);
assert.equal(mountainActivities[1].memoryTrailSections, undefined, "Eastern Mountains has no authored small subgroup.");
assert.equal(activities.get("us-physical-lakes").memoryTrailSections, undefined, "Lakes has no authored small subgroup.");
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
assert.equal(greatSaltLake.blockIds.length, 1);
assert.equal(greatSaltLake.practiceBlockId, null);
assert.equal(greatSaltLake.connectionBlockId, null);
assert.equal(
  UNITED_STATES_GUIDED_LEARNING_ORCHESTRATION_V1.blocks.find(({ id }) => id === greatSaltLake.introductionBlockId)?.sequenceCompletion,
  true,
  "A lake without a safe cohort or Connection returns after introduction instead of trivial retrieval."
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
  inventory.find(({ targetId }) => targetId === "black-hills"),
  inventory.find(({ targetId }) => targetId === "ozark-mountains"),
  columbia,
  inventory.find(({ targetId }) => targetId === "lake-superior")
];
const expectedLower48Camera = {
  mode: "override",
  source: "lower48-physical-default",
  center: [-97.76220, 39.30636],
  zoom: 4.1407,
  bearing: 0,
  pitch: 0
};
assert.deepEqual(UNITED_STATES_GUIDED_LOWER48_PHYSICAL_CAMERA, {
  mode: "override",
  center: [-97.76220, 39.30636],
  zoom: 4.1407,
  bearing: 0,
  pitch: 0
});
representativeFeatures.forEach((feature) => {
  const sourceFeature = findSourceFeature(feature);
  const originalGeometry = JSON.stringify(sourceFeature.geometry);
  ["desktop", "mobile"].forEach((viewport) => {
    const camera = calculateGuidedLearningPhysicalFeatureCamera({
      feature: sourceFeature,
      family: feature.family,
      camera: feature.camera,
      viewport
    });
    assert.deepEqual(camera, expectedLower48Camera, `${feature.name} uses the reviewed national camera on ${viewport}.`);
  });
  assert.equal(JSON.stringify(sourceFeature.geometry), originalGeometry, "Camera calculation does not mutate standalone geometry.");
});
const alaskaActivity = mountainActivities.find(({ id }) => id === "us-physical-alaska-mountains");
const originalAlaskaMap = JSON.stringify(alaskaActivity.map);
const alaskaActivityMap = new Map([[alaskaActivity.id, alaskaActivity]]);
const alaskaPreset = UNITED_STATES_GUIDED_PHYSICAL_REGIONAL_CAMERA_PRESETS.find(({ id }) => id === "alaska");
assert.equal(alaskaPreset.authoredActivityId, alaskaActivity.id);
assert.equal(alaskaPreset.cameraKey, "quizView");
["alaska-range", "brooks-range"].forEach((targetId) => {
  const feature = inventory.find((candidate) => candidate.targetId === targetId);
  const decision = calculateGuidedLearningPhysicalFeatureCamera({
    feature: findSourceFeature(feature),
    family: feature.family,
    activityMap: alaskaActivityMap
  });
  assert.deepEqual(decision, {
    mode: "override",
    source: "alaska-preset",
    center: [...alaskaActivity.map.quizView.center],
    zoom: alaskaActivity.map.quizView.zoom,
    bearing: alaskaActivity.map.quizView.bearing,
    pitch: alaskaActivity.map.quizView.pitch
  }, `${feature.name} reuses the authored Alaska camera instead of the lower-48 camera.`);
  assert.equal(calculateGuidedLearningPhysicalFeatureCamera({
    feature: findSourceFeature(feature),
    family: feature.family
  }), null, "Missing Alaska camera data must not silently frame lower 48.");
});
assert.equal(JSON.stringify(alaskaActivity.map), originalAlaskaMap, "Guided camera selection does not mutate standalone Alaska views.");
assert.deepEqual(calculateGuidedLearningPhysicalFeatureCamera({
  family: "lake",
  authoredStateIds: ["alaska"],
  activityMap: alaskaActivityMap
}).center, alaskaActivity.map.quizView.center, "Regional matching can support another family without a feature-ID exception.");
assert.deepEqual(calculateGuidedLearningPhysicalFeatureCamera({
  family: "lake",
  regionId: "test-special-region",
  regionalCameraPresets: [{
    id: "test-special-region",
    source: "test-special-preset",
    camera: { center: [12, 34], zoom: 3.25 }
  }]
}), {
  mode: "override", source: "test-special-preset", center: [12, 34], zoom: 3.25, bearing: 0, pitch: 0
}, "Future disconnected regions can provide a preset using configuration.");
assert.deepEqual(calculateGuidedLearningPhysicalFeatureCamera({
  family: "river",
  camera: expectedLower48Camera
}), expectedLower48Camera, "A resolved default retains its source if reused for retrieval.");
assert.deepEqual(calculateGuidedLearningPhysicalFeatureCamera({
  feature: findSourceFeature(rocky),
  family: rocky.family,
  camera: { mode: "override", center: [-106, 40], zoom: 4.5, bearing: 2, pitch: 8 },
  cohortCamera: { mode: "override", center: [-105, 39], zoom: 4 }
}), {
  mode: "override",
  source: "authored-override",
  center: [-106, 40],
  zoom: 4.5,
  bearing: 2,
  pitch: 8
});

const northeastCohort = UNITED_STATES_GUIDED_LEARNING_ORCHESTRATION_V1.physicalCohorts
  .find(({ id }) => id === "northeast-mountains");
assert.equal(northeastCohort.source, "product-approved-subgroup-of-authored-eastern-mountains");
assert.equal(northeastCohort.sourceId, "us-physical-eastern-mountains");
assert.deepEqual(northeastCohort.authoredMemberTargetIds, [
  "white-mountains",
  "green-mountains",
  "adirondack-mountains"
]);
assert.deepEqual(northeastCohort.camera, {
  mode: "override",
  center: [-76.24, 40.39],
  zoom: 5.16,
  bearing: 0,
  pitch: 0
});
assert.deepEqual(calculateGuidedLearningPhysicalFeatureCamera({
  family: "mountain-range",
  targetId: "white-mountains",
  cohortCamera: northeastCohort.camera
}), {
  ...northeastCohort.camera,
  source: "authored-override"
}, "The approved Northeast cohort override takes precedence over the national default.");
assert.deepEqual(calculateGuidedLearningPhysicalFeatureCamera({
  family: "mountain-range",
  targetId: "alaska-range",
  cohortCamera: northeastCohort.camera,
  activityMap: alaskaActivityMap
}).source, "authored-override", "An explicit authored override also takes precedence over a regional preset.");
assert.equal(selectPhysicalCohortRetrievalSubset({
  cohort: northeastCohort,
  introducedTargetIds: ["white-mountains"]
}).retrievalReady, false);
assert.deepEqual(selectPhysicalCohortRetrievalSubset({
  cohort: northeastCohort,
  introducedTargetIds: ["white-mountains", "green-mountains"]
}), {
  retrievalReady: true,
  reason: "meaningful-comparison-set-ready",
  introducedTargetIds: ["white-mountains", "green-mountains"],
  retrievedTargetIds: [],
  newlyIntroducedTargetIds: ["white-mountains", "green-mountains"],
  retrievalTargetIds: ["white-mountains", "green-mountains"]
});
assert.deepEqual(selectPhysicalCohortRetrievalSubset({
  cohort: northeastCohort,
  introducedTargetIds: ["white-mountains", "green-mountains", "adirondack-mountains"],
  retrievedTargetIds: ["white-mountains", "green-mountains"]
}).retrievalTargetIds, ["white-mountains", "green-mountains", "adirondack-mountains"]);

const northeastPrerequisitesWithoutNewYork = stateEvents(["maine", "new-hampshire", "vermont"]);
const northeastBaseState = createGuidedLearningOrchestrationState({
  completedBlockIds: ["us-guided:rebuild-new-england"]
});
let northeastDecision = selectGuidedLearningOrchestrationBlock({
  state: northeastBaseState,
  repository: { events: northeastPrerequisitesWithoutNewYork }
});
assert.equal(northeastDecision.currentBlock.id, "us-guided:introduce-white-mountains");
assert.deepEqual(northeastDecision.currentBlock.destination.newTargetIds, ["white-mountains", "green-mountains"]);
assert.ok(!northeastDecision.currentBlock.destination.targetIds.includes("adirondack-mountains"));
const northeastTrace = northeastDecision.physicalCohortTrace.find(({ cohortId }) => cohortId === "northeast-mountains");
assert.equal(northeastTrace.retrievalReady, false);
assert.equal(
  northeastTrace.members.find(({ targetId }) => targetId === "adirondack-mountains").prerequisiteStatus,
  "prerequisite-not-covered"
);
const northeastIntroductionEvents = createPhysicalFeatureIntroductionEvidenceEvents({
  block: northeastDecision.currentBlock,
  identity: {
    eventId: "northeast-introduction",
    attemptId: "northeast-introduction",
    occurredAt: "2036-01-01T14:00:00.000Z",
    sessionId: "northeast-test",
    sequence: 50
  }
});
assert.equal(northeastIntroductionEvents.length, 2);
assert.ok(northeastIntroductionEvents.every(({ outcome }) => outcome === "assisted"));
assert.equal(new Set(northeastIntroductionEvents.map(({ eventId }) => eventId)).size, 2);
let northeastState = startGuidedLearningOrchestrationBlock(
  northeastBaseState,
  northeastDecision.currentBlock.id
);
northeastState = completeGuidedLearningPhysicalFeatureIntroductions(
  northeastState,
  northeastDecision.currentBlock.introductionBlockIds
);
northeastDecision = selectGuidedLearningOrchestrationBlock({
  state: northeastState,
  repository: { events: [...northeastPrerequisitesWithoutNewYork, ...northeastIntroductionEvents] }
});
assert.equal(northeastDecision.currentBlock.id, "us-guided:practice-white-mountains");
assert.deepEqual(northeastDecision.currentBlock.destination.targetIds, ["white-mountains", "green-mountains"]);
assert.equal(northeastDecision.currentBlock.destination.targetIds.length >= 2, true);
const pendingNortheastPractice = deferGuidedLearningOrchestrationBlock(
  startGuidedLearningOrchestrationBlock(
    northeastState,
    northeastDecision.currentBlock.id,
    {
      physicalCohortId: "northeast-mountains",
      physicalCohortTargetIds: northeastDecision.currentBlock.destination.targetIds
    }
  ),
  northeastDecision.currentBlock.id
);
assert.equal(pendingNortheastPractice.activeStatus, "pending");
assert.deepEqual(pendingNortheastPractice.retrievedPhysicalCohortTargetIds, {});
assert.equal(selectGuidedLearningOrchestrationBlock({
  state: pendingNortheastPractice,
  repository: { events: [...northeastPrerequisitesWithoutNewYork, ...northeastIntroductionEvents] }
}).currentBlock.id, "us-guided:practice-white-mountains");

const allNortheastPrerequisites = stateEvents(["maine", "new-hampshire", "vermont", "new-york"]);
const threeMemberDecision = selectGuidedLearningOrchestrationBlock({
  state: northeastBaseState,
  repository: { events: allNortheastPrerequisites }
});
assert.deepEqual(threeMemberDecision.currentBlock.destination.newTargetIds, [
  "white-mountains",
  "green-mountains",
  "adirondack-mountains"
]);

const riverPrerequisites = stateEvents([
  "arizona", "colorado", "utah", "california", "nevada", "oregon", "washington", "new-mexico", "texas"
]);
const westernRiverConfig = createUnitedStatesGuidedLearningOrchestrationConfig({
  physicalFeatureInventory: inventory.filter(({ targetId }) => (
    ["colorado-river", "columbia-river", "rio-grande-river"].includes(targetId)
  ))
});
const riverDecision = selectGuidedLearningOrchestrationBlock({
  config: westernRiverConfig,
  state: createGuidedLearningOrchestrationState({
    completedBlockIds: ["us-guided:rebuild-new-england"]
  }, westernRiverConfig),
  repository: { events: riverPrerequisites }
});
assert.equal(riverDecision.currentBlock.destination.cohortId, "western-rivers");
assert.equal(riverDecision.currentBlock.destination.newTargetIds.length, 3, "The authored western-river group is reused.");

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
assert.equal(decision.currentBlock.id, lakeHuron.connectionBlockId);
assert.equal(lakeHuron.practiceBlockId, null, "Lakes defer retrieval rather than fabricating a comparison group.");
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
