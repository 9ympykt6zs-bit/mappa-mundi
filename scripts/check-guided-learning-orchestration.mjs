import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  completeGuidedLearningOrchestrationBlock,
  completeGuidedLearningPhysicalFeatureIntroductions,
  createGuidedLearningOrchestrationState,
  createPhysicalFeatureIntroductionEvidence,
  createPhysicalFeatureIntroductionEvidenceEvents,
  deferGuidedLearningOrchestrationBlock,
  evaluateCoveredPrerequisite,
  getInstructionalCoverage,
  GUIDED_LEARNING_BLOCK_TYPES,
  GUIDED_LEARNING_ORCHESTRATION_STORAGE_KEY,
  loadGuidedLearningOrchestrationState,
  resetGuidedLearningOrchestrationState,
  saveGuidedLearningOrchestrationState,
  selectGuidedLearningOrchestrationBlock,
  startGuidedLearningOrchestrationBlock,
  UNITED_STATES_GUIDED_LEARNING_ORCHESTRATION_V1,
  validateGuidedLearningOrchestrationConfig
} from "../src/guided-learning-orchestration.js";
import { unitedStatesAtlas } from "../src/atlas/united-states-atlas-data.js";
import {
  getTargetedMentalMapChallengePool,
  getUnifiedMentalMapChallenges
} from "../src/atlas/mental-map-challenge-registry.js";

function event(conceptId, outcome, suffix = outcome) {
  return {
    schemaVersion: 1,
    eventId: `event:${conceptId}:${suffix}`,
    attemptId: `attempt:${conceptId}:${suffix}`,
    occurredAt: "2026-08-30T12:00:00.000Z",
    conceptId,
    skillId: "locating",
    sourceMode: "test",
    outcome
  };
}

function repository(events = []) {
  return { schemaVersion: 1, events };
}

function stateCoverageEvents(stateIds) {
  return stateIds.map((stateId, index) => event(
    `state-location:${stateId}`,
    index % 2 === 0 ? "assisted" : "correct",
    `state-${index}`
  ));
}

function memoryStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem: (key) => values.has(key) ? values.get(key) : null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key)
  };
}

assert.deepEqual(validateGuidedLearningOrchestrationConfig(), []);
assert.equal(Object.isFrozen(UNITED_STATES_GUIDED_LEARNING_ORCHESTRATION_V1), true);

assert.equal(getInstructionalCoverage("state-location:maine", repository([
  event("state-location:maine", "assisted")
])).covered, true, "Guided/assisted exposure counts as covered.");
assert.equal(getInstructionalCoverage("state-location:maine", repository([
  event("state-location:maine", "correct")
])).covered, true, "Independent correct retrieval counts as covered.");
assert.equal(getInstructionalCoverage("state-location:maine", repository([
  event("state-location:maine", "assisted", "assisted-correct")
])).covered, true, "Assisted correct retrieval counts as covered.");
assert.equal(getInstructionalCoverage("state-location:maine", repository([
  event("state-location:maine", "incorrect")
])).covered, false, "Incorrect-only evidence does not count as covered.");
assert.equal(getInstructionalCoverage("state-location:maine", repository()).covered, false, "Opening without canonical evidence does not count.");
assert.equal(evaluateCoveredPrerequisite({
  id: "state:maine",
  conceptIds: ["state-location:maine", "state-naming:maine"]
}, repository([event("state-naming:maine", "correct")])).covered, true, "Either trustworthy state skill provides state context.");

const config = UNITED_STATES_GUIDED_LEARNING_ORCHESTRATION_V1;
const reconstruction = config.blocks[0];
const whiteMountainsSequence = config.physicalFeatures.find(({ targetId }) => targetId === "white-mountains");
const introduction = config.blocks.find(({ id }) => id === whiteMountainsSequence.introductionBlockId);
const practice = config.blocks.find(({ id }) => id === whiteMountainsSequence.practiceBlockId);
const connection = config.blocks.find(({ id }) => id === whiteMountainsSequence.connectionBlockId);
const allNewEnglandStates = ["maine", "new-hampshire", "vermont", "massachusetts", "rhode-island", "connecticut"];
const missingVermont = stateCoverageEvents(allNewEnglandStates.filter((stateId) => stateId !== "vermont"));

let state = createGuidedLearningOrchestrationState();
let decision = selectGuidedLearningOrchestrationBlock({ state, repository: repository(missingVermont) });
assert.equal(decision.currentBlock.type, GUIDED_LEARNING_BLOCK_TYPES.GUIDED_SECTION);
assert.equal(decision.evaluations[0].reason, "prerequisite-not-covered");

const newEnglandCovered = stateCoverageEvents(allNewEnglandStates);
decision = selectGuidedLearningOrchestrationBlock({ state, repository: repository(newEnglandCovered) });
assert.equal(decision.currentBlock.id, reconstruction.id);
assert.equal(decision.externalActivity.regionId, "rebuild-new-england");

state = startGuidedLearningOrchestrationBlock(state, reconstruction.id, {
  activeSectionId: "us-states-02",
  currentSessionNumber: 3
});
assert.equal(state.activeStatus, "launched");
assert.equal(state.returnContext.activeSectionId, "us-states-02");
state = deferGuidedLearningOrchestrationBlock(state, reconstruction.id);
assert.equal(state.activeStatus, "pending");
assert.equal(selectGuidedLearningOrchestrationBlock({ state, repository: repository(newEnglandCovered) }).currentBlock.id, reconstruction.id);

state = completeGuidedLearningOrchestrationBlock(state, reconstruction.id);
assert.ok(state.completedBlockIds.includes(reconstruction.id), "Imperfect or perfect submission completes the non-gating checkpoint.");
const postReconstructionState = state;
const onlyMaineCovered = repository(stateCoverageEvents(["maine"]));
assert.equal(
  selectGuidedLearningOrchestrationBlock({ state, repository: onlyMaineCovered }).evaluations
    .find(({ blockId }) => blockId === introduction.id).reason,
  "prerequisite-not-covered",
  "The physical introduction waits for every touched state prerequisite."
);
decision = selectGuidedLearningOrchestrationBlock({ state, repository: repository(newEnglandCovered) });
assert.equal(decision.currentBlock.id, introduction.id);
assert.deepEqual(decision.currentBlock.destination.targetIds, ["white-mountains", "green-mountains"]);
assert.deepEqual(decision.currentBlock.destination.newTargetIds, ["white-mountains", "green-mountains"]);
assert.deepEqual(introduction.destination.prerequisiteStateIds, ["maine", "new-hampshire"]);
const whiteMountainsEntity = unitedStatesAtlas.entities.find(({ id }) => id === "mountain-range:white-mountains");
assert.equal(whiteMountainsEntity?.source?.featureId, "white-mountains", "The introduction reuses the atlas canonical feature identity.");
const mountainGeometry = JSON.parse(readFileSync(new URL(
  "../assets/data/physical-features/us-mountain-ranges.geojson",
  import.meta.url
), "utf8"));
assert.ok(mountainGeometry.features.some(({ properties }) => properties?.id === "white-mountains"), "White Mountains use existing authored geometry.");

const exposure = createPhysicalFeatureIntroductionEvidence({
  block: introduction,
  identity: {
    eventId: "guided-introduction:white-mountains",
    attemptId: "guided-introduction:white-mountains",
    occurredAt: "2026-08-30T12:01:00.000Z",
    sessionId: "guided-orchestration:test",
    sequence: 1
  }
});
assert.equal(exposure.conceptId, "mountain-range-location:white-mountains");
assert.equal(exposure.outcome, "assisted", "Feature reveal is exposure, not independent retrieval.");
assert.equal(exposure.sourceActivityId, "us-mountain-ranges");

const whiteOnlyRepository = repository([
  ...stateCoverageEvents(["maine", "new-hampshire"]),
  exposure
]);
let singleFeatureState = startGuidedLearningOrchestrationBlock(postReconstructionState, introduction.id);
singleFeatureState = completeGuidedLearningPhysicalFeatureIntroductions(singleFeatureState, [introduction.id]);
const singleFeatureDecision = selectGuidedLearningOrchestrationBlock({
  state: singleFeatureState,
  repository: whiteOnlyRepository
});
assert.equal(singleFeatureDecision.currentBlock.id, connection.id, "A single introduced feature may integrate through Connections.");
assert.equal(
  singleFeatureDecision.evaluations.find(({ blockId }) => blockId === practice.id).reason,
  "awaiting-second-introduced-member",
  "One learned feature never starts a trivial identification loop."
);
assert.deepEqual(
  singleFeatureDecision.physicalCohortTrace.find(({ cohortId }) => cohortId === "northeast-mountains").introducedTargetIds,
  ["white-mountains"]
);

const introductionEvents = createPhysicalFeatureIntroductionEvidenceEvents({
  block: decision.currentBlock,
  identity: {
    eventId: "guided-introduction:northeast-mountains",
    attemptId: "guided-introduction:northeast-mountains",
    occurredAt: "2026-08-30T12:01:00.000Z",
    sessionId: "guided-orchestration:test",
    sequence: 1
  }
});
assert.deepEqual(introductionEvents.map(({ conceptId }) => conceptId), [
  "mountain-range-location:white-mountains",
  "mountain-range-location:green-mountains"
]);
assert.ok(introductionEvents.every(({ outcome }) => outcome === "assisted"));
state = startGuidedLearningOrchestrationBlock(state, introduction.id);
state = completeGuidedLearningPhysicalFeatureIntroductions(
  state,
  decision.currentBlock.introductionBlockIds
);

const withFeatureExposure = repository([...newEnglandCovered, ...introductionEvents]);
decision = selectGuidedLearningOrchestrationBlock({ state, repository: withFeatureExposure });
assert.equal(decision.currentBlock.id, practice.id);
assert.deepEqual(decision.currentBlock.destination.targetIds, ["white-mountains", "green-mountains"]);
assert.equal(decision.currentBlock.destination.targetIds.length >= 2, true, "Physical retrieval always has meaningful alternatives.");
assert.deepEqual(decision.currentBlock.destination.persistentLearningCamera, {
  mode: "override",
  center: [-76.24, 40.39],
  zoom: 5.16,
  bearing: 0,
  pitch: 0
});

state = startGuidedLearningOrchestrationBlock(state, practice.id, {
  physicalCohortTargetIds: decision.currentBlock.destination.targetIds
});
state = completeGuidedLearningOrchestrationBlock(state, practice.id);
assert.deepEqual(state.retrievedPhysicalCohortTargetIds["northeast-mountains"], [
  "white-mountains",
  "green-mountains"
]);
decision = selectGuidedLearningOrchestrationBlock({ state, repository: withFeatureExposure });
assert.equal(decision.currentBlock.id, connection.id);
assert.deepEqual(decision.currentBlock.destination.challengeIds, ["us-relationship-mountain-range-maine-white-mountains"]);
assert.equal(decision.currentBlockEvaluation.prerequisites.every(({ covered }) => covered), true);
const allConnections = getUnifiedMentalMapChallenges({
  includeGenerated: false,
  includeUnitedStatesRelationships: true
});
const targetedConnections = getTargetedMentalMapChallengePool(allConnections, connection.destination.challengeIds);
assert.deepEqual(targetedConnections.missingIds, []);
assert.equal(targetedConnections.pool.length, 1);
assert.equal(targetedConnections.pool[0].canonicalConceptId, connection.destination.conceptId);
assert.equal(getTargetedMentalMapChallengePool(allConnections, []).pool.length, 0, "An absent filter does not invent a targeted pool.");

const missingFeatureContext = repository(newEnglandCovered);
assert.equal(selectGuidedLearningOrchestrationBlock({ state, repository: missingFeatureContext }).currentBlock.type, GUIDED_LEARNING_BLOCK_TYPES.GUIDED_SECTION);
assert.equal(selectGuidedLearningOrchestrationBlock({ state, repository: withFeatureExposure }).currentBlock.id, connection.id);

const storage = memoryStorage();
const launchedConnection = startGuidedLearningOrchestrationBlock(state, connection.id, { activeSectionId: "us-states-03" });
saveGuidedLearningOrchestrationState(launchedConnection, storage);
assert.deepEqual(loadGuidedLearningOrchestrationState(storage), launchedConnection, "Active checkpoint and Guided return position persist.");
assert.equal(resetGuidedLearningOrchestrationState(storage).completedBlockIds.length, 0);
assert.equal(storage.getItem(GUIDED_LEARNING_ORCHESTRATION_STORAGE_KEY), null);

const firstDecision = selectGuidedLearningOrchestrationBlock({ state, repository: withFeatureExposure });
const secondDecision = selectGuidedLearningOrchestrationBlock({ state, repository: withFeatureExposure });
assert.deepEqual(secondDecision, firstDecision, "Identical evidence, state, and config must select the same block.");

console.log("Guided Learning orchestration foundation validation passed.");
