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
  getGuidedPhysicalRetrievalMapContext,
  getGuidedLearningPhysicalReviewEligibility,
  getGuidedLearningPhysicalProgression,
  GUIDED_LEARNING_BLOCK_TYPES,
  resetGuidedLearningOrchestrationState,
  selectPhysicalCohortRetrievalSubset,
  satisfyGuidedLearningPhysicalInterleave,
  selectGuidedLearningOrchestrationBlock,
  selectGuidedLearningPostStatePhysicalReview,
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

function guidedStateItemIdsThrough(stageNumber) {
  const lowerFortyEight = UNITED_STATES_GUIDED_LEARNING_ORCHESTRATION_V1.blocks
    .filter(({ type, destination }) => (
      type === GUIDED_LEARNING_BLOCK_TYPES.RECONSTRUCTION_CHECKPOINT
      && destination.checkpointNumber <= Math.min(10, stageNumber)
    ))
    .flatMap(({ guidedStatePrerequisiteItemIds }) => guidedStatePrerequisiteItemIds);
  return [...new Set([
    ...lowerFortyEight,
    ...(stageNumber >= 11 ? ["state:alaska"] : [])
  ])];
}

function reconstructionBlockIdsThrough(stageNumber, config = UNITED_STATES_GUIDED_LEARNING_ORCHESTRATION_V1) {
  return config.blocks
    .filter(({ type, destination }) => (
      type === GUIDED_LEARNING_BLOCK_TYPES.RECONSTRUCTION_CHECKPOINT
      && destination.checkpointNumber <= Math.min(10, stageNumber)
    ))
    .map(({ id }) => id);
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
assert.equal(supported.length, 34);
assert.deepEqual(deferred.map(({ id, exclusionReason }) => [id, exclusionReason]), []);
assert.deepEqual(UNITED_STATES_GUIDED_LEARNING_ORCHESTRATION_V1.deferredPhysicalFamilies, [
  { family: "coast", reason: "relationship-only-no-targeted-retrieval-path" }
]);
assert.deepEqual(validateGuidedLearningOrchestrationConfig(), []);
assert.deepEqual(
  UNITED_STATES_GUIDED_LEARNING_ORCHESTRATION_V1.deferredPhysicalCohortGroups,
  []
);

const familyCounts = Object.groupBy(supported, ({ family }) => family);
assert.deepEqual(Object.fromEntries(Object.entries(familyCounts).map(([family, features]) => [family, features.length])), {
  river: 8,
  lake: 6,
  "mountain-range": 20
});
const mountainReviewPool = UNITED_STATES_GUIDED_LEARNING_ORCHESTRATION_V1.physicalReviewPools
  .find(({ id }) => id === "physical-family-review:mountain-range");
const alaskaReviewPool = UNITED_STATES_GUIDED_LEARNING_ORCHESTRATION_V1.physicalReviewPools
  .find(({ id }) => id === "physical-region-review:alaska-mountains");
const mixedReviewPool = UNITED_STATES_GUIDED_LEARNING_ORCHESTRATION_V1.physicalReviewPools
  .find(({ id }) => id === "physical-mixed-review");
assert.equal(mountainReviewPool.targetIds.includes("alaska-range"), false);
assert.deepEqual(alaskaReviewPool.targetIds, ["alaska-range", "brooks-range"]);
assert.equal(mixedReviewPool.targetIds.includes("brooks-range"), false);

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
  const orchestratedFeature = UNITED_STATES_GUIDED_LEARNING_ORCHESTRATION_V1.physicalFeatures
    .find(({ targetId }) => targetId === feature.targetId);
  assert.ok(
    activities.get(feature.activityId)?.targets.some(({ id }) => id === feature.targetId),
    `${feature.name} resolves to a real target in ${feature.activityId}.`
  );
  assert.ok(findSourceFeature(feature), `${feature.name} resolves to its declared geometry feature.`);
  assert.ok(feature.learningCohortId, `${feature.name} belongs to a bounded Guided introduction cohort.`);
  assert.ok(orchestratedFeature?.practiceBlockId, `${feature.name} has an immediate Guided retrieval checkpoint.`);
});

const stLawrence = inventory.find(({ targetId }) => targetId === "st-lawrence-river");
assert.equal(stLawrence.geometry.representation, "full");
assert.equal(stLawrence.geometry.crossesInternationalBorder, true);
assert.equal(stLawrence.geometry.hasCrossBorderVisualContinuation, true);
assert.equal(stLawrence.supported, true);
assert.ok(UNITED_STATES_GUIDED_LEARNING_ORCHESTRATION_V1.blocks.some(({ featureId }) => featureId === stLawrence.id));
assert.deepEqual(stLawrence.authoredStateIds, ["new-york"], "Canadian visual continuation does not create foreign curriculum relationships.");
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
assert.ok(greatSaltLake.practiceBlockId);
assert.equal(greatSaltLake.connectionBlockId, null);
assert.equal(
  UNITED_STATES_GUIDED_LEARNING_ORCHESTRATION_V1.blocks.find(({ id }) => id === greatSaltLake.practiceBlockId)?.sequenceCompletion,
  true,
  "Every lake ends its introduction batch with independent retrieval."
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
assert.equal(rocky.prerequisiteSource, "physical-geography-scaffold");
assert.deepEqual(rocky.introductionPrerequisiteStateIds, []);
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
  state: createGuidedLearningOrchestrationState({
    completedBlockIds: reconstructionBlockIdsThrough(8, overriddenConfig)
  }, overriddenConfig),
  repository: { events: stateEvents(["colorado"]) },
  introducedGuidedStateItemIds: guidedStateItemIdsThrough(8),
  hasUnfinishedNonPhysicalLearning: true
}).currentBlock.id, overriddenIntro.id);

const incorrectRockyDecision = selectGuidedLearningOrchestrationBlock({
  config: overriddenConfig,
  state: createGuidedLearningOrchestrationState({
    completedBlockIds: reconstructionBlockIdsThrough(8, overriddenConfig)
  }, overriddenConfig),
  repository: { events: stateEvents(["colorado"], { outcome: "incorrect" }) },
  introducedGuidedStateItemIds: guidedStateItemIdsThrough(8)
});
assert.equal(incorrectRockyDecision.currentBlock.type, GUIDED_LEARNING_BLOCK_TYPES.GUIDED_SECTION);
const assistedRockyDecision = selectGuidedLearningOrchestrationBlock({
  config: overriddenConfig,
  state: createGuidedLearningOrchestrationState({
    completedBlockIds: reconstructionBlockIdsThrough(8, overriddenConfig)
  }, overriddenConfig),
  repository: { events: stateEvents(["colorado"], { outcome: "assisted" }) },
  introducedGuidedStateItemIds: guidedStateItemIdsThrough(8)
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
const retrievalDecisions = ["black-hills", "green-mountains", "ozark-mountains"].map((targetId) => calculateGuidedLearningPhysicalFeatureCamera({
  targetId,
  family: "mountain-range",
  cameraPhase: "retrieval",
  camera: { mode: "override", center: [-76.24, 40.39], zoom: 5.16 },
  cohortCamera: { mode: "override", center: [-76.24, 40.39], zoom: 5.16 }
}));
assert.deepEqual(retrievalDecisions[0], retrievalDecisions[1]);
assert.deepEqual(retrievalDecisions[1], retrievalDecisions[2]);
assert.equal(retrievalDecisions[0].searchSpace, "lower48");
assert.equal(retrievalDecisions[0].cameraPhase, "retrieval");
assert.deepEqual(retrievalDecisions[0].center, expectedLower48Camera.center);
for (const targetId of ["alaska-range", "brooks-range"]) {
  const decision = calculateGuidedLearningPhysicalFeatureCamera({ targetId, family: "mountain-range", cameraPhase: "retrieval", activityMap: alaskaActivityMap });
  assert.equal(decision.searchSpace, "alaska");
  assert.deepEqual(decision.center, alaskaActivity.map.quizView.center);
}
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
assert.deepEqual(
  UNITED_STATES_GUIDED_LEARNING_ORCHESTRATION_V1.physicalCohorts
    .map(({ id, geographyRegion, regionalStage, maximumLeadStages, curriculumOrder }) => ({
      id, geographyRegion, regionalStage, maximumLeadStages, curriculumOrder
    }))
    .sort((left, right) => left.curriculumOrder - right.curriculumOrder)
    .map(({ id, regionalStage, maximumLeadStages }) => [id, regionalStage, maximumLeadStages]),
  [
    ["northeast-mountains", 1, 0],
    ["southern-appalachian-ranges", 3, 1],
    ["appalachian-system-ranges", 3, 1],
    ["eastern-rivers", 5, 1],
    ["upper-great-lakes", 5, 1],
    ["eastern-and-interior-lakes", 5, 1],
    ["central-rivers", 6, 1],
    ["central-mountains", 7, 1],
    ["western-major-mountains", 8, 1],
    ["western-rivers", 8, 1],
    ["interior-west-ranges", 9, 1],
    ["pacific-ranges", 10, 1],
    ["alaska-mountains", 11, 2]
  ],
  "Introduction cohorts carry an explicit east-to-west Guided progression."
);
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

const centralRiverCohort = UNITED_STATES_GUIDED_LEARNING_ORCHESTRATION_V1.physicalCohorts
  .find(({ id }) => id === "central-rivers");
const easternRiverCohort = UNITED_STATES_GUIDED_LEARNING_ORCHESTRATION_V1.physicalCohorts
  .find(({ id }) => id === "eastern-rivers");
assert.deepEqual(centralRiverCohort.supportedMemberTargetIds, ["mississippi-river", "missouri-river", "arkansas-river"]);
assert.deepEqual(easternRiverCohort.supportedMemberTargetIds, ["ohio-river", "st-lawrence-river"]);
assert.deepEqual(easternRiverCohort.camera, {
  mode: "override",
  center: [-77.2, 44.4],
  zoom: 3.2,
  zoomByViewport: { desktop: 4.05, mobile: 3.2 },
  bearing: 0,
  pitch: 0
});
assert.equal(calculateGuidedLearningPhysicalFeatureCamera({
  family: "river",
  cohortCamera: easternRiverCohort.camera,
  viewport: "desktop"
}).zoom, 4.05);
assert.equal(calculateGuidedLearningPhysicalFeatureCamera({
  family: "river",
  cohortCamera: easternRiverCohort.camera,
  viewport: "mobile"
}).zoom, 3.2);

const northeastPrerequisitesWithoutNewYork = stateEvents(["maine", "new-hampshire", "vermont"]);
const northeastBaseState = createGuidedLearningOrchestrationState({
  completedBlockIds: ["us-guided:rebuild-new-england"]
});
let northeastDecision = selectGuidedLearningOrchestrationBlock({
  state: northeastBaseState,
  repository: { events: northeastPrerequisitesWithoutNewYork },
  introducedGuidedStateItemIds: guidedStateItemIdsThrough(1)
});
assert.equal(northeastDecision.currentBlock.id, "us-guided:introduce-white-mountains");
assert.deepEqual(northeastDecision.currentBlock.destination.newTargetIds, [
  "white-mountains",
  "green-mountains",
  "adirondack-mountains"
]);
const northeastTrace = northeastDecision.physicalCohortTrace.find(({ cohortId }) => cohortId === "northeast-mountains");
assert.equal(northeastTrace.retrievalReady, false);
assert.equal(
  northeastTrace.members.find(({ targetId }) => targetId === "adirondack-mountains").prerequisiteStatus,
  "covered-awaiting-introduction"
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
assert.equal(northeastIntroductionEvents.length, 3);
assert.ok(northeastIntroductionEvents.every(({ outcome }) => outcome === "assisted"));
assert.equal(new Set(northeastIntroductionEvents.map(({ eventId }) => eventId)).size, 3);
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
  repository: { events: [...northeastPrerequisitesWithoutNewYork, ...northeastIntroductionEvents] },
  introducedGuidedStateItemIds: guidedStateItemIdsThrough(1)
});
assert.equal(northeastDecision.currentBlock.id, "us-guided:practice-white-mountains");
assert.deepEqual(northeastDecision.currentBlock.destination.targetIds, [
  "white-mountains",
  "green-mountains",
  "adirondack-mountains"
]);
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
  repository: { events: [...northeastPrerequisitesWithoutNewYork, ...northeastIntroductionEvents] },
  introducedGuidedStateItemIds: guidedStateItemIdsThrough(1)
}).currentBlock.id, "us-guided:practice-white-mountains");

const allNortheastPrerequisites = stateEvents(["maine", "new-hampshire", "vermont", "new-york"]);
const threeMemberDecision = selectGuidedLearningOrchestrationBlock({
  state: northeastBaseState,
  repository: { events: allNortheastPrerequisites },
  introducedGuidedStateItemIds: guidedStateItemIdsThrough(1)
});
assert.deepEqual(threeMemberDecision.currentBlock.destination.newTargetIds, [
  "white-mountains",
  "green-mountains",
  "adirondack-mountains"
]);

const retainedAlaskaEvidence = { events: stateEvents(["alaska"]) };
const resetWithRetainedAlaskaDecision = selectGuidedLearningOrchestrationBlock({
  state: northeastBaseState,
  repository: retainedAlaskaEvidence,
  introducedGuidedStateItemIds: guidedStateItemIdsThrough(1),
  targetedNeed: { objectiveId: "learn-physical-features", familyId: "physical-mountain-ranges" }
});
assert.equal(resetWithRetainedAlaskaDecision.currentBlock.destination.cohortId, "northeast-mountains");
assert.equal(
  resetWithRetainedAlaskaDecision.physicalCohortTrace
    .find(({ cohortId }) => cohortId === "alaska-mountains").geographicEligibility.reason,
  "geographic-progression-not-reached",
  "Retained canonical Alaska evidence cannot bypass a fresh Guided state frontier."
);
assert.equal(getGuidedLearningPhysicalProgression(["state:alaska"]).frontierStage, 0);

const completedCohortBlockIds = (...cohortIds) => UNITED_STATES_GUIDED_LEARNING_ORCHESTRATION_V1.physicalFeatures
  .filter(({ learningCohortId }) => cohortIds.includes(learningCohortId))
  .flatMap(({ sequenceBlockIds }) => sequenceBlockIds);
const selectMountainAtStage = (stageNumber, completedCohortIds = [], repository = { events: [] }) => (
  selectGuidedLearningOrchestrationBlock({
    state: createGuidedLearningOrchestrationState({
      completedBlockIds: [
        ...reconstructionBlockIdsThrough(stageNumber),
        ...completedCohortBlockIds(...completedCohortIds)
      ],
      physicalInterleaveRequired: false
    }),
    repository,
    introducedGuidedStateItemIds: guidedStateItemIdsThrough(stageNumber),
    targetedNeed: { objectiveId: "learn-physical-features", familyId: "physical-mountain-ranges" }
  })
);
assert.equal(selectMountainAtStage(2, ["northeast-mountains"]).currentBlock.destination.cohortId, "southern-appalachian-ranges");
assert.equal(selectMountainAtStage(2, [
  "northeast-mountains", "southern-appalachian-ranges"
]).currentBlock.destination.cohortId, "appalachian-system-ranges");
assert.equal(selectMountainAtStage(6, [
  "northeast-mountains", "southern-appalachian-ranges", "appalachian-system-ranges"
]).currentBlock.destination.cohortId, "central-mountains");
const rockyProgressionDecision = selectMountainAtStage(7, [
  "northeast-mountains", "southern-appalachian-ranges", "appalachian-system-ranges", "central-mountains"
]);
assert.equal(rockyProgressionDecision.currentBlock.destination.cohortId, "western-major-mountains");
assert.equal(guidedStateItemIdsThrough(7).includes("state:colorado"), false, "Rockies lead related state coverage without an all-states gate.");
assert.deepEqual(rockyProgressionDecision.currentBlock.destination.newTargetIds, [
  "rocky-mountains", "cascade-mountains", "sierra-nevada"
]);
const interiorWestProgressionDecision = selectMountainAtStage(8, [
  "northeast-mountains",
  "southern-appalachian-ranges",
  "appalachian-system-ranges",
  "central-mountains",
  "western-major-mountains"
]);
assert.equal(interiorWestProgressionDecision.currentBlock.destination.cohortId, "interior-west-ranges");
const pacificProgressionDecision = selectMountainAtStage(9, [
  "northeast-mountains",
  "southern-appalachian-ranges",
  "appalachian-system-ranges",
  "central-mountains",
  "western-major-mountains",
  "interior-west-ranges"
]);
assert.equal(pacificProgressionDecision.currentBlock.destination.cohortId, "pacific-ranges");
const completedLower48MountainCohorts = [
  "northeast-mountains",
  "southern-appalachian-ranges",
  "appalachian-system-ranges",
  "central-mountains",
  "western-major-mountains",
  "interior-west-ranges",
  "pacific-ranges"
];
const alaskaBeforeFarWesternStage = selectMountainAtStage(8, completedLower48MountainCohorts, retainedAlaskaEvidence);
assert.equal(alaskaBeforeFarWesternStage.currentBlock.type, GUIDED_LEARNING_BLOCK_TYPES.GUIDED_SECTION);
const alaskaBeforeGuidedStage = selectMountainAtStage(9, completedLower48MountainCohorts);
assert.equal(alaskaBeforeGuidedStage.currentBlock.destination.cohortId, "alaska-mountains");
assert.deepEqual(alaskaBeforeGuidedStage.currentBlock.destination.prerequisiteStateIds, []);
assert.deepEqual(alaskaBeforeGuidedStage.currentBlock.destination.newTargetIds, ["alaska-range", "brooks-range"]);
const alaskaAtGuidedStage = selectMountainAtStage(11, completedLower48MountainCohorts);
assert.equal(alaskaAtGuidedStage.currentBlock.destination.cohortId, "alaska-mountains");
assert.deepEqual(alaskaAtGuidedStage.currentBlock.destination.newTargetIds, ["alaska-range", "brooks-range"]);

const alabamaFrontierDecision = selectMountainAtStage(4, ["northeast-mountains"]);
assert.equal(alabamaFrontierDecision.currentBlock.destination.cohortId, "southern-appalachian-ranges");
assert.notEqual(alabamaFrontierDecision.currentBlock.destination.cohortId, "alaska-mountains");
const alaskaFeature = UNITED_STATES_GUIDED_LEARNING_ORCHESTRATION_V1.physicalFeatures
  .find(({ targetId }) => targetId === "alaska-range");
const staleAlaskaIntroduction = selectGuidedLearningOrchestrationBlock({
  state: createGuidedLearningOrchestrationState({
    completedBlockIds: [
      ...reconstructionBlockIdsThrough(4),
      ...completedCohortBlockIds("northeast-mountains")
    ],
    activeBlockId: alaskaFeature.introductionBlockId,
    activeStatus: "launched"
  }),
  repository: retainedAlaskaEvidence,
  introducedGuidedStateItemIds: guidedStateItemIdsThrough(4),
  targetedNeed: { objectiveId: "learn-physical-features", familyId: "physical-mountain-ranges" }
});
assert.equal(staleAlaskaIntroduction.currentBlock.destination.cohortId, "southern-appalachian-ranges");
assert.equal(
  staleAlaskaIntroduction.physicalCohortTrace.find(({ cohortId }) => cohortId === "alaska-mountains")
    .curriculumEligibility.reason,
  "earlier-family-cohort-introduction-pending"
);

const lateFrontierWithEasternMountainBacklog = selectMountainAtStage(10, ["northeast-mountains"]);
assert.equal(
  lateFrontierWithEasternMountainBacklog.currentBlock.destination.cohortId,
  "southern-appalachian-ranges",
  "The oldest region-ready unseen cohort is drained instead of being starved by the current frontier."
);

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
    completedBlockIds: reconstructionBlockIdsThrough(8, westernRiverConfig)
  }, westernRiverConfig),
  repository: { events: riverPrerequisites },
  introducedGuidedStateItemIds: guidedStateItemIdsThrough(8)
});
assert.equal(riverDecision.currentBlock.destination.cohortId, "western-rivers");
assert.equal(riverDecision.currentBlock.destination.newTargetIds.length, 3, "The authored western-river group is reused.");

const completedNortheastBlockIds = UNITED_STATES_GUIDED_LEARNING_ORCHESTRATION_V1.physicalFeatures
  .filter(({ learningCohortId }) => learningCohortId === "northeast-mountains")
  .flatMap(({ introductionBlockId, practiceBlockId }) => [introductionBlockId, practiceBlockId]);
const completedPreWesternMountainBlockIds = completedCohortBlockIds(
  "southern-appalachian-ranges",
  "appalachian-system-ranges",
  "central-mountains"
);
const coloradoNewMexicoState = createGuidedLearningOrchestrationState({
  completedBlockIds: [
    ...reconstructionBlockIdsThrough(8),
    ...completedNortheastBlockIds,
    ...completedPreWesternMountainBlockIds
  ],
  physicalInterleaveRequired: false
});
const coloradoNewMexicoRepository = { events: stateEvents(["colorado", "new-mexico"]) };
const mountainBatch = selectGuidedLearningOrchestrationBlock({
  state: coloradoNewMexicoState,
  repository: coloradoNewMexicoRepository,
  introducedGuidedStateItemIds: guidedStateItemIdsThrough(8),
  targetedNeed: { objectiveId: "learn-physical-features", familyId: "physical-mountain-ranges" }
});
assert.equal(mountainBatch.currentBlock.destination.cohortId, "western-major-mountains");
assert.deepEqual(mountainBatch.currentBlock.destination.newTargetIds, [
  "rocky-mountains",
  "cascade-mountains",
  "sierra-nevada"
]);
assert.deepEqual(
  mountainBatch.currentBlock.destination.prerequisiteStateIds,
  [],
  "Lower 48 physical features can scaffold states that have not been introduced yet."
);

for (const [familyId, expectedCohortId, expectedSize] of [
  ["physical-rivers", "eastern-rivers", 2],
  ["physical-lakes", "upper-great-lakes", 3]
]) {
  const batch = selectGuidedLearningOrchestrationBlock({
    state: createGuidedLearningOrchestrationState({ completedBlockIds: reconstructionBlockIdsThrough(4) }),
    repository: { events: [] },
    introducedGuidedStateItemIds: guidedStateItemIdsThrough(4),
    targetedNeed: { objectiveId: "learn-physical-features", familyId }
  });
  assert.equal(batch.currentBlock.destination.cohortId, expectedCohortId);
  assert.equal(batch.currentBlock.destination.newTargetIds.length, expectedSize);
}

const dueNortheastReview = {
  "northeast-mountains": {
    cohortId: "northeast-mountains",
    generation: 1,
    previousOrder: [],
    targets: Object.fromEntries(northeastCohort.supportedMemberTargetIds.map((targetId) => [targetId, {
      targetId,
      dueAfterLearningEvent: 0,
      lastLearningEvent: 0,
      lastOutcome: "correct"
    }]))
  }
};
const noStarvationDecision = selectGuidedLearningOrchestrationBlock({
  state: createGuidedLearningOrchestrationState({
    ...coloradoNewMexicoState,
    physicalReviewProgress: dueNortheastReview
  }),
  repository: coloradoNewMexicoRepository,
  introducedGuidedStateItemIds: guidedStateItemIdsThrough(8),
  targetedNeed: { objectiveId: "learn-physical-features", familyId: "physical-mountain-ranges" }
});
assert.equal(noStarvationDecision.currentBlock.destination.cohortId, "western-major-mountains");
assert.equal(noStarvationDecision.selectionReason, "eligible-physical-feature");

const completedNonrepeatableBlockIds = UNITED_STATES_GUIDED_LEARNING_ORCHESTRATION_V1.blocks
  .filter(({ repeatable }) => !repeatable)
  .map(({ id }) => id);
const reviewProgress = Object.fromEntries(UNITED_STATES_GUIDED_LEARNING_ORCHESTRATION_V1.physicalCohorts.map((cohort) => [
  cohort.id,
  {
    cohortId: cohort.id,
    generation: 1,
    previousOrder: [],
    targets: Object.fromEntries(cohort.supportedMemberTargetIds.map((targetId) => [targetId, {
      targetId,
      dueAfterLearningEvent: 2,
      lastLearningEvent: 0,
      lastOutcome: "correct"
    }]))
  }
]));
let reviewState = createGuidedLearningOrchestrationState({
  completedBlockIds: completedNonrepeatableBlockIds,
  guidedLearningEventCount: 5,
  physicalReviewProgress: reviewProgress
});
const mountainReviewPoolId = "physical-family-review:mountain-range";
const alaskaReviewPoolId = "physical-region-review:alaska-mountains";
const mountainFamilyReviewPool = UNITED_STATES_GUIDED_LEARNING_ORCHESTRATION_V1.physicalReviewPools
  .find(({ id }) => id === mountainReviewPoolId);
const lowerFortyEightMountainTargetIds = UNITED_STATES_GUIDED_LEARNING_ORCHESTRATION_V1.physicalFeatures
  .filter(({ family, authoredStateIds }) => family === "mountain-range" && !authoredStateIds.every((stateId) => stateId === "alaska"))
  .map(({ targetId }) => targetId);
assert.equal(mountainFamilyReviewPool.requiresFamilyComplete, false);
assert.deepEqual(alaskaReviewPool.prerequisiteTargetIds, lowerFortyEightMountainTargetIds);

const legacyAlaskaReviewState = createGuidedLearningOrchestrationState({
  completedBlockIds: [
    ...reconstructionBlockIdsThrough(4),
    ...completedCohortBlockIds("northeast-mountains", "alaska-mountains")
  ],
  guidedLearningEventCount: 5,
  physicalReviewProgress: {
    "northeast-mountains": reviewProgress["northeast-mountains"],
    "alaska-mountains": reviewProgress["alaska-mountains"]
  }
});
assert.equal(
  getGuidedLearningPhysicalReviewEligibility(legacyAlaskaReviewState, mountainReviewPoolId).eligible,
  true,
  "Three introduced eastern ranges can enter broad family review before the full mountain curriculum is complete."
);
assert.equal(
  getGuidedLearningPhysicalReviewEligibility(legacyAlaskaReviewState, alaskaReviewPoolId).reason,
  "review-curriculum-prerequisites-incomplete",
  "Persisted legacy Alaska retrieval cannot start repeating before earlier mountain cohorts are introduced."
);

const mountainReviewState = createGuidedLearningOrchestrationState({
  completedBlockIds: [
    ...reconstructionBlockIdsThrough(10),
    ...completedCohortBlockIds(...UNITED_STATES_GUIDED_LEARNING_ORCHESTRATION_V1.physicalCohorts
      .filter(({ family }) => family === "mountain-range")
      .map(({ id }) => id))
  ],
  guidedLearningEventCount: 5,
  physicalReviewProgress: Object.fromEntries(UNITED_STATES_GUIDED_LEARNING_ORCHESTRATION_V1.physicalCohorts
    .filter(({ family }) => family === "mountain-range")
    .map((cohort) => [cohort.id, reviewProgress[cohort.id]])),
  lastCompletedPhysicalCohortId: alaskaReviewPoolId
});
assert.equal(mountainReviewState.lastCompletedPhysicalCohortId, alaskaReviewPoolId);
let mountainReviewDecision = selectGuidedLearningOrchestrationBlock({
  state: mountainReviewState,
  repository: { events: [] },
  hasUnfinishedNonPhysicalLearning: false,
  targetedNeed: { objectiveId: "learn-physical-features", familyId: "physical-mountain-ranges" }
});
assert.equal(
  mountainReviewDecision.currentBlock.cohortId,
  mountainReviewPoolId,
  "An eligible mountain review alternative replaces an immediate Alaska-pool repeat."
);
assert.equal(
  selectGuidedLearningPostStatePhysicalReview({ state: mountainReviewState }).block.cohortId,
  mountainReviewPoolId,
  "The post-state physical-review route applies the same pool-rotation rule."
);
let rotatedMountainReviewState = startGuidedLearningOrchestrationBlock(
  mountainReviewState,
  mountainReviewDecision.currentBlock.id,
  { physicalCohortTargetIds: mountainReviewDecision.currentBlock.destination.targetIds }
);
rotatedMountainReviewState = completeGuidedLearningOrchestrationBlock(
  rotatedMountainReviewState,
  mountainReviewDecision.currentBlock.id,
  UNITED_STATES_GUIDED_LEARNING_ORCHESTRATION_V1,
  {
    guidedPhysicalCheckpoint: {
      targetOrder: mountainReviewDecision.currentBlock.destination.targetIds,
      targets: mountainReviewDecision.currentBlock.destination.targetIds.map((targetId) => ({
        targetId,
        incorrectCount: 0,
        finalOutcome: "correct"
      }))
    }
  }
);
assert.equal(rotatedMountainReviewState.lastCompletedPhysicalCohortId, mountainReviewPoolId);
rotatedMountainReviewState = satisfyGuidedLearningPhysicalInterleave(rotatedMountainReviewState, { sessionNumber: 6 });
mountainReviewDecision = selectGuidedLearningOrchestrationBlock({
  state: rotatedMountainReviewState,
  repository: { events: [] },
  hasUnfinishedNonPhysicalLearning: false,
  targetedNeed: { objectiveId: "learn-physical-features", familyId: "physical-mountain-ranges" }
});
assert.equal(
  mountainReviewDecision.currentBlock.cohortId,
  alaskaReviewPoolId,
  "Due mountain review pools alternate instead of allowing either small membership to monopolize selection."
);
assert.equal(
  selectGuidedLearningPostStatePhysicalReview({ state: rotatedMountainReviewState }).block.cohortId,
  alaskaReviewPoolId,
  "Post-state selection also rotates back to Alaska after lower-48 mountain review."
);
const riverReviewPoolId = "physical-family-review:river";
const firstRiverReview = getGuidedLearningPhysicalReviewEligibility(reviewState, riverReviewPoolId);
assert.equal(firstRiverReview.eligible, true);
assert.equal(firstRiverReview.targetIds.length, 4);
assert.equal(
  UNITED_STATES_GUIDED_LEARNING_ORCHESTRATION_V1.physicalReviewPools
    .find(({ id }) => id === riverReviewPoolId).targetIds.includes("st-lawrence-river"),
  true,
  "St. Lawrence participates in rotating river review."
);
let riverReviewDecision = selectGuidedLearningOrchestrationBlock({
  state: reviewState,
  repository: { events: [] },
  hasUnfinishedNonPhysicalLearning: false,
  targetedNeed: { objectiveId: "learn-physical-features", familyId: "physical-rivers" }
});
assert.equal(riverReviewDecision.currentBlock.cohortId, riverReviewPoolId);
reviewState = startGuidedLearningOrchestrationBlock(reviewState, riverReviewDecision.currentBlock.id, {
  physicalCohortTargetIds: riverReviewDecision.currentBlock.destination.targetIds
});
reviewState = completeGuidedLearningOrchestrationBlock(
  reviewState,
  riverReviewDecision.currentBlock.id,
  UNITED_STATES_GUIDED_LEARNING_ORCHESTRATION_V1,
  {
    guidedPhysicalCheckpoint: {
      targetOrder: riverReviewDecision.currentBlock.destination.targetIds,
      targets: riverReviewDecision.currentBlock.destination.targetIds.map((targetId) => ({
        targetId,
        incorrectCount: 0,
        finalOutcome: "correct"
      }))
    }
  }
);
reviewState = satisfyGuidedLearningPhysicalInterleave(reviewState, { sessionNumber: 7 });
const secondRiverReview = getGuidedLearningPhysicalReviewEligibility(reviewState, riverReviewPoolId);
assert.equal(secondRiverReview.eligible, true);
assert.notDeepEqual(
  new Set(secondRiverReview.targetIds),
  new Set(firstRiverReview.targetIds),
  "Completed categories rotate review membership instead of repeating one fixed subset."
);

const mixedPoolId = "physical-mixed-review";
const mixedEligibility = getGuidedLearningPhysicalReviewEligibility(reviewState, mixedPoolId);
assert.equal(mixedEligibility.eligible, true);
assert.equal(mixedReviewPool.targetIds.includes("st-lawrence-river"), true, "St. Lawrence is eligible for mixed physical review.");
assert.equal(new Set(mixedEligibility.targetIds.map((targetId) => (
  UNITED_STATES_GUIDED_LEARNING_ORCHESTRATION_V1.physicalFeatures.find((feature) => feature.targetId === targetId).family
))).size, 3);
const mixedBlockId = `us-guided:review-${mixedPoolId}`;
const mixedDecision = selectGuidedLearningOrchestrationBlock({
  state: createGuidedLearningOrchestrationState({ ...reviewState, activeBlockId: mixedBlockId, activeStatus: "pending" }),
  repository: { events: [] },
  hasUnfinishedNonPhysicalLearning: false
});
assert.equal(mixedDecision.currentBlock.id, mixedBlockId);
assert.equal(mixedDecision.currentBlock.destination.physicalReviewActivity, true);
assert.equal(mixedDecision.currentBlock.destination.physicalRetrievalActivity, true);
const fullPhysicalMapContext = getGuidedPhysicalRetrievalMapContext();
assert.deepEqual(
  mixedDecision.currentBlock.destination.physicalContextTargetIds,
  fullPhysicalMapContext.targetIds,
  "Mixed review renders the complete supported physical inventory."
);
const contextFamilies = mixedDecision.currentBlock.destination.physicalContextTargetIds.reduce((counts, targetId) => {
  const family = UNITED_STATES_GUIDED_LEARNING_ORCHESTRATION_V1.physicalFeatures
    .find((feature) => feature.targetId === targetId)?.family;
  counts[family] = (counts[family] || 0) + 1;
  return counts;
}, {});
assert.deepEqual(contextFamilies, { river: 8, lake: 6, "mountain-range": 20 });
assert.deepEqual([...mixedDecision.currentBlock.destination.sourceActivityIds].sort(), [
  "us-mountain-ranges",
  "us-physical-lakes",
  "us-physical-rivers"
]);
assert.equal(fullPhysicalMapContext.targetIds.length, 34);
assert.deepEqual(fullPhysicalMapContext.sourceActivityIds, [
  "us-physical-rivers",
  "us-physical-lakes",
  "us-mountain-ranges"
]);

const insufficientMixedState = createGuidedLearningOrchestrationState({
  completedBlockIds: [
    "us-guided:rebuild-new-england",
    ...UNITED_STATES_GUIDED_LEARNING_ORCHESTRATION_V1.physicalFeatures
      .filter(({ targetId }) => [
        "white-mountains", "green-mountains", "colorado-river", "columbia-river", "lake-superior"
      ].includes(targetId))
      .map(({ introductionBlockId }) => introductionBlockId)
  ],
  guidedLearningEventCount: 5,
  physicalReviewProgress: reviewProgress
});
assert.equal(
  getGuidedLearningPhysicalReviewEligibility(insufficientMixedState, mixedPoolId).reason,
  "mixed-review-introductions-insufficient"
);

const storageValues = new Map([["mappaGuidedLearningOrchestration", JSON.stringify(reviewState)]]);
const storage = {
  getItem: (key) => storageValues.get(key) || null,
  setItem: (key, value) => storageValues.set(key, value),
  removeItem: (key) => storageValues.delete(key)
};
assert.equal(resetGuidedLearningOrchestrationState(storage).physicalInterleaveRequired, false);
assert.equal(storage.getItem("mappaGuidedLearningOrchestration"), null);

console.log("Guided Learning physical-feature orchestration validation passed (34 audited and orchestrated, 0 geometry-deferred). ");
