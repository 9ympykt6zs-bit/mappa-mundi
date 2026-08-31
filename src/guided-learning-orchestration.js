import { adaptCanonicalRetrievalAttempt } from "./canonical-learning-evidence.js";
import {
  UNITED_STATES_PHYSICAL_FEATURE_DEFERRED_FAMILIES,
  UNITED_STATES_PHYSICAL_FEATURE_ORCHESTRATION_INVENTORY
} from "./united-states-physical-feature-orchestration.js";

export const GUIDED_LEARNING_ORCHESTRATION_STORAGE_KEY = "mappaGuidedLearningOrchestration";
export const GUIDED_LEARNING_ORCHESTRATION_VERSION = 2;
export const UNITED_STATES_GUIDED_LEARNING_ORCHESTRATION_ID = "united-states-guided-learning-v1";

export const GUIDED_LEARNING_BLOCK_TYPES = Object.freeze({
  GUIDED_SECTION: "guided-section",
  RECONSTRUCTION_CHECKPOINT: "reconstruction-checkpoint",
  PHYSICAL_FEATURE_INTRODUCTION: "physical-feature-introduction",
  PHYSICAL_FEATURE_PRACTICE: "physical-feature-practice",
  CONNECTION_CHECKPOINT: "connection-checkpoint"
});

const coveredOutcomes = new Set(["correct", "assisted"]);
const orchestrationBlockTypes = new Set(Object.values(GUIDED_LEARNING_BLOCK_TYPES));
const validActiveStatuses = new Set(["pending", "launched", "completed"]);

function uniqueStrings(values = []) {
  return [...new Set((Array.isArray(values) ? values : []).map((value) => String(value || "").trim()).filter(Boolean))];
}

function cloneJson(value) {
  if (value === undefined) return undefined;
  return JSON.parse(JSON.stringify(value));
}

function freezePrerequisite(id, conceptIds) {
  return Object.freeze({
    id,
    match: "any",
    conceptIds: Object.freeze([...conceptIds])
  });
}

function stateCoveredPrerequisite(stateId) {
  return freezePrerequisite(`state:${stateId}`, [
    `state-location:${stateId}`,
    `state-naming:${stateId}`
  ]);
}

function conceptCoveredPrerequisite(conceptId) {
  return freezePrerequisite(conceptId, [conceptId]);
}

function freezeBlock(block) {
  const destination = Object.fromEntries(Object.entries(block.destination || {}).map(([key, value]) => [
    key,
    Array.isArray(value) ? Object.freeze([...value]) : value
  ]));
  return Object.freeze({
    ...block,
    prerequisiteBlockIds: Object.freeze([...(block.prerequisiteBlockIds || [])]),
    prerequisites: Object.freeze([...(block.prerequisites || [])]),
    destination: Object.freeze(destination),
    completion: Object.freeze({ ...(block.completion || {}) }),
    returnBehavior: Object.freeze({ ...(block.returnBehavior || {}) })
  });
}

const newEnglandStateIds = Object.freeze([
  "maine",
  "new-hampshire",
  "vermont",
  "massachusetts",
  "rhode-island",
  "connecticut"
]);

const reconstructionBlockId = "us-guided:rebuild-new-england";

function createPhysicalFeatureBlocks(feature, { introductionPrerequisiteBlockIds = [] } = {}) {
  if (!feature?.supported) return [];
  const introductionBlockId = `us-guided:introduce-${feature.targetId}`;
  const practiceBlockId = `us-guided:practice-${feature.targetId}`;
  const connectionStateId = feature.connectionAlternatives?.[0]?.stateId || null;
  const connectionBlockId = feature.selectedConnectionChallengeId
    ? `us-guided:connect-${connectionStateId}-${feature.targetId}`
    : null;
  const commonDestination = {
    journeyId: feature.journeyId,
    stepId: feature.stepId,
    activityId: feature.activityId,
    targetIds: [feature.targetId],
    targetType: feature.targetType,
    targetLabel: feature.name,
    targetConceptId: feature.conceptId,
    featureId: feature.id,
    featureFamily: feature.family,
    geometry: feature.geometry,
    camera: feature.camera
  };
  const blocks = [
    freezeBlock({
      id: introductionBlockId,
      type: GUIDED_LEARNING_BLOCK_TYPES.PHYSICAL_FEATURE_INTRODUCTION,
      sequenceKind: "physical-feature",
      featureId: feature.id,
      featurePhase: "introduction",
      prerequisiteBlockIds: introductionPrerequisiteBlockIds,
      prerequisites: feature.introductionPrerequisiteStateIds.map(stateCoveredPrerequisite),
      destination: {
        kind: "physical-feature-introduction",
        ...commonDestination,
        prerequisiteStateIds: [...feature.introductionPrerequisiteStateIds],
        prerequisiteSource: feature.prerequisiteSource,
        teachingMessage: feature.teachingMessage
      },
      completion: { kind: "guided-exposure-acknowledged" },
      returnBehavior: { kind: "guided-learning-resume" }
    }),
    freezeBlock({
      id: practiceBlockId,
      type: GUIDED_LEARNING_BLOCK_TYPES.PHYSICAL_FEATURE_PRACTICE,
      sequenceKind: "physical-feature",
      featureId: feature.id,
      featurePhase: "focused-retrieval",
      sequenceCompletion: !connectionBlockId,
      prerequisiteBlockIds: [introductionBlockId],
      prerequisites: [conceptCoveredPrerequisite(feature.conceptId)],
      destination: {
        kind: "targeted-memory-trail",
        ...commonDestination
      },
      completion: { kind: "memory-trail-session-completed" },
      returnBehavior: { kind: "guided-learning-resume" }
    })
  ];
  if (connectionBlockId) {
    blocks.push(freezeBlock({
      id: connectionBlockId,
      type: GUIDED_LEARNING_BLOCK_TYPES.CONNECTION_CHECKPOINT,
      sequenceKind: "physical-feature",
      featureId: feature.id,
      featurePhase: "connection",
      sequenceCompletion: true,
      prerequisiteBlockIds: [practiceBlockId],
      prerequisites: [
        stateCoveredPrerequisite(connectionStateId),
        conceptCoveredPrerequisite(feature.conceptId)
      ],
      destination: {
        kind: "targeted-connection",
        featureId: feature.id,
        featureFamily: feature.family,
        challengeIds: [feature.selectedConnectionChallengeId],
        alternativeChallengeIds: [...feature.connectionChallengeIds],
        conceptId: feature.selectedConnectionConceptId
      },
      completion: { kind: "answer-submitted", requiresCorrectResult: false },
      returnBehavior: { kind: "guided-learning-resume" }
    }));
  }
  return blocks;
}

function createSupportedPhysicalFeatures(inventory = UNITED_STATES_PHYSICAL_FEATURE_ORCHESTRATION_INVENTORY) {
  return inventory.filter(({ supported }) => supported).map((feature) => {
    const blocks = createPhysicalFeatureBlocks(feature, {
      // Preserve the original bounded White Mountains slice: it follows the
      // authored New England reconstruction checkpoint.
      introductionPrerequisiteBlockIds: feature.targetId === "white-mountains"
        ? [reconstructionBlockId]
        : []
    });
    return Object.freeze({
      ...feature,
      blockIds: Object.freeze(blocks.map(({ id }) => id)),
      introductionBlockId: blocks[0]?.id || null,
      practiceBlockId: blocks[1]?.id || null,
      connectionBlockId: blocks[2]?.id || null,
      completionBlockId: blocks.at(-1)?.id || null,
      blocks: Object.freeze(blocks)
    });
  });
}

export function createUnitedStatesGuidedLearningOrchestrationConfig({
  physicalFeatureInventory = UNITED_STATES_PHYSICAL_FEATURE_ORCHESTRATION_INVENTORY
} = {}) {
  const physicalFeatures = createSupportedPhysicalFeatures(physicalFeatureInventory);
  const deferredPhysicalFeatures = physicalFeatureInventory.filter(({ supported }) => !supported);
  return Object.freeze({
    id: UNITED_STATES_GUIDED_LEARNING_ORCHESTRATION_ID,
    version: GUIDED_LEARNING_ORCHESTRATION_VERSION,
    physicalFeatures: Object.freeze(physicalFeatures),
    deferredPhysicalFeatures: Object.freeze(deferredPhysicalFeatures),
    deferredPhysicalFamilies: UNITED_STATES_PHYSICAL_FEATURE_DEFERRED_FAMILIES,
    blocks: Object.freeze([
    freezeBlock({
      id: reconstructionBlockId,
      type: GUIDED_LEARNING_BLOCK_TYPES.RECONSTRUCTION_CHECKPOINT,
      prerequisiteBlockIds: [],
      prerequisites: newEnglandStateIds.map(stateCoveredPrerequisite),
      destination: {
        kind: "map-reconstruction",
        regionId: "rebuild-new-england"
      },
      completion: {
        kind: "evaluation-submitted",
        requiresPerfectResult: false
      },
      returnBehavior: {
        kind: "guided-learning-resume"
      }
    }),
      ...physicalFeatures.flatMap(({ blocks }) => blocks)
    ]),
    fallbackBlock: freezeBlock({
      id: "us-guided:continue-guided-learning",
      type: GUIDED_LEARNING_BLOCK_TYPES.GUIDED_SECTION,
      repeatable: true,
      prerequisiteBlockIds: [],
      prerequisites: [],
      destination: { kind: "guided-learning-resume" },
      completion: { kind: "guided-session-completed" },
      returnBehavior: { kind: "guided-learning" }
    })
  });
}

export const UNITED_STATES_GUIDED_LEARNING_ORCHESTRATION_V1 = createUnitedStatesGuidedLearningOrchestrationConfig();

function getRepositoryEvents(repository = {}) {
  return Array.isArray(repository?.events) ? repository.events.filter(Boolean) : [];
}

function getEventMilestone(event = {}) {
  const timestamp = Date.parse(event.occurredAt || "");
  const hasSequence = event.sequence !== null && event.sequence !== undefined && event.sequence !== "";
  return {
    occurredAt: Number.isFinite(timestamp) ? new Date(timestamp).toISOString() : null,
    occurredAtMs: Number.isFinite(timestamp) ? timestamp : Number.POSITIVE_INFINITY,
    sequence: hasSequence && Number.isFinite(Number(event.sequence)) ? Number(event.sequence) : Number.POSITIVE_INFINITY,
    eventId: String(event.eventId || "")
  };
}

function compareMilestones(left = {}, right = {}) {
  if (left.occurredAtMs !== right.occurredAtMs) return left.occurredAtMs - right.occurredAtMs;
  if (left.sequence !== right.sequence) return left.sequence - right.sequence;
  return String(left.eventId || "").localeCompare(String(right.eventId || ""));
}

function publicMilestone(event = {}) {
  const milestone = getEventMilestone(event);
  return {
    occurredAt: milestone.occurredAt,
    sequence: Number.isFinite(milestone.sequence) ? milestone.sequence : null,
    eventId: milestone.eventId
  };
}

export function getInstructionalCoverage(conceptId, repository = {}) {
  const normalizedConceptId = String(conceptId || "").trim();
  const matchingEvents = getRepositoryEvents(repository)
    .filter((event) => event.conceptId === normalizedConceptId);
  const coveringEvents = matchingEvents.filter((event) => coveredOutcomes.has(event.outcome));
  const firstCoveringEvent = [...coveringEvents].sort((left, right) => (
    compareMilestones(getEventMilestone(left), getEventMilestone(right))
  ))[0] || null;
  return {
    conceptId: normalizedConceptId,
    covered: coveringEvents.length > 0,
    reason: coveringEvents.length > 0 ? "trustworthy-context-evidence" : "no-covering-evidence",
    coveringOutcomes: uniqueStrings(coveringEvents.map((event) => event.outcome)).sort(),
    coveringEventIds: uniqueStrings(coveringEvents.map((event) => event.eventId)),
    firstCoveringEvent: firstCoveringEvent ? publicMilestone(firstCoveringEvent) : null,
    ignoredOutcomes: uniqueStrings(matchingEvents
      .filter((event) => !coveredOutcomes.has(event.outcome))
      .map((event) => event.outcome)).sort()
  };
}

export function evaluateCoveredPrerequisite(prerequisite = {}, repository = {}) {
  const conceptIds = uniqueStrings(prerequisite.conceptIds);
  const concepts = conceptIds.map((conceptId) => getInstructionalCoverage(conceptId, repository));
  const match = prerequisite.match === "all" ? "all" : "any";
  const covered = match === "all"
    ? concepts.length > 0 && concepts.every((concept) => concept.covered)
    : concepts.some((concept) => concept.covered);
  const coveringMilestones = concepts
    .filter((concept) => concept.covered && concept.firstCoveringEvent)
    .map((concept) => ({
      conceptId: concept.conceptId,
      ...concept.firstCoveringEvent,
      ...getEventMilestone(concept.firstCoveringEvent)
    }))
    .sort(compareMilestones);
  const eligibilityMilestone = match === "all"
    ? coveringMilestones.at(-1) || null
    : coveringMilestones[0] || null;
  return {
    id: String(prerequisite.id || conceptIds.join("|")).trim(),
    match,
    covered,
    reason: covered ? "covered" : "prerequisite-not-covered",
    concepts,
    eligibilityMilestone: eligibilityMilestone ? {
      occurredAt: eligibilityMilestone.occurredAt,
      sequence: Number.isFinite(eligibilityMilestone.sequence) ? eligibilityMilestone.sequence : null,
      eventId: eligibilityMilestone.eventId,
      conceptId: eligibilityMilestone.conceptId
    } : null
  };
}

export function createGuidedLearningOrchestrationState(value = {}, config = UNITED_STATES_GUIDED_LEARNING_ORCHESTRATION_V1) {
  const source = value && typeof value === "object" ? value : {};
  const validBlockIds = new Set((config?.blocks || []).map((block) => block.id));
  const completedBlockIds = uniqueStrings(source.completedBlockIds).filter((id) => validBlockIds.has(id));
  const activeBlockId = validBlockIds.has(source.activeBlockId) && !completedBlockIds.includes(source.activeBlockId)
    ? source.activeBlockId
    : null;
  const activeStatus = activeBlockId && validActiveStatuses.has(source.activeStatus)
    ? source.activeStatus
    : activeBlockId ? "pending" : null;
  return {
    version: GUIDED_LEARNING_ORCHESTRATION_VERSION,
    orchestrationId: config.id,
    completedBlockIds,
    activeBlockId,
    activeStatus,
    previousBlockId: validBlockIds.has(source.previousBlockId) ? source.previousBlockId : null,
    physicalInterleaveRequired: source.physicalInterleaveRequired === true,
    lastCompletedPhysicalFeatureId: String(source.lastCompletedPhysicalFeatureId || "").trim() || null,
    lastNonPhysicalMilestone: source.lastNonPhysicalMilestone && typeof source.lastNonPhysicalMilestone === "object"
      ? cloneJson(source.lastNonPhysicalMilestone)
      : null,
    returnContext: source.returnContext && typeof source.returnContext === "object"
      ? cloneJson(source.returnContext)
      : null,
    lastTransition: source.lastTransition && typeof source.lastTransition === "object"
      ? cloneJson(source.lastTransition)
      : null
  };
}

function resolveStorage(storage) {
  if (storage !== undefined) return storage;
  try {
    return globalThis.localStorage;
  } catch {
    return null;
  }
}

export function loadGuidedLearningOrchestrationState(storage, config = UNITED_STATES_GUIDED_LEARNING_ORCHESTRATION_V1) {
  const resolvedStorage = resolveStorage(storage);
  try {
    return createGuidedLearningOrchestrationState(
      JSON.parse(resolvedStorage?.getItem?.(GUIDED_LEARNING_ORCHESTRATION_STORAGE_KEY) || "null"),
      config
    );
  } catch {
    return createGuidedLearningOrchestrationState(null, config);
  }
}

export function saveGuidedLearningOrchestrationState(state, storage, config = UNITED_STATES_GUIDED_LEARNING_ORCHESTRATION_V1) {
  const normalized = createGuidedLearningOrchestrationState(state, config);
  try {
    resolveStorage(storage)?.setItem?.(GUIDED_LEARNING_ORCHESTRATION_STORAGE_KEY, JSON.stringify(normalized));
  } catch {
    // Orchestration remains usable in memory when durable storage is unavailable.
  }
  return normalized;
}

export function resetGuidedLearningOrchestrationState(storage) {
  try {
    resolveStorage(storage)?.removeItem?.(GUIDED_LEARNING_ORCHESTRATION_STORAGE_KEY);
  } catch {
    // Runtime state is reset by the caller even if storage is unavailable.
  }
  return createGuidedLearningOrchestrationState();
}

export function evaluateGuidedLearningBlock(block, state = {}, repository = {}) {
  const completedBlockIds = new Set(state.completedBlockIds || []);
  const prerequisiteBlocks = (block.prerequisiteBlockIds || []).map((blockId) => ({
    blockId,
    completed: completedBlockIds.has(blockId)
  }));
  const prerequisites = (block.prerequisites || []).map((prerequisite) => (
    evaluateCoveredPrerequisite(prerequisite, repository)
  ));
  const blocksReady = prerequisiteBlocks.every(({ completed }) => completed);
  const conceptsReady = prerequisites.every(({ covered }) => covered);
  const completed = completedBlockIds.has(block.id);
  return {
    blockId: block.id,
    blockType: block.type,
    eligible: !completed && blocksReady && conceptsReady,
    reason: completed
      ? "already-completed"
      : !blocksReady
        ? "prerequisite-block-not-completed"
        : !conceptsReady
          ? "prerequisite-not-covered"
          : "eligible",
    prerequisiteBlocks,
    prerequisites
  };
}

function getBlockEligibilityMilestone(evaluation = {}) {
  const milestones = (evaluation.prerequisites || [])
    .map(({ eligibilityMilestone }) => eligibilityMilestone)
    .filter(Boolean)
    .map((milestone) => ({ ...milestone, ...getEventMilestone(milestone) }))
    .sort(compareMilestones);
  const milestone = milestones.at(-1) || null;
  return milestone ? {
    occurredAt: milestone.occurredAt,
    sequence: Number.isFinite(milestone.sequence) ? milestone.sequence : null,
    eventId: milestone.eventId,
    conceptId: milestone.conceptId
  } : null;
}

function comparePhysicalFeatureQueueEntries(left, right) {
  const leftMilestone = getEventMilestone(left.eligibilityMilestone || {});
  const rightMilestone = getEventMilestone(right.eligibilityMilestone || {});
  const milestoneComparison = compareMilestones(leftMilestone, rightMilestone);
  return milestoneComparison || left.authoredOrder - right.authoredOrder || left.featureId.localeCompare(right.featureId);
}

function getPhysicalFeatureProgress(feature, completedBlockIds, evaluationsById) {
  const completedIds = feature.blockIds.filter((blockId) => completedBlockIds.has(blockId));
  const pendingIds = feature.blockIds.filter((blockId) => !completedBlockIds.has(blockId));
  const nextBlockId = pendingIds[0] || null;
  const nextEvaluation = nextBlockId ? evaluationsById.get(nextBlockId) : null;
  const completed = completedBlockIds.has(feature.completionBlockId);
  const inProgress = completedIds.length > 0 && !completed;
  return {
    completed,
    inProgress,
    completedBlockIds: completedIds,
    pendingBlockIds: pendingIds,
    nextBlockId,
    nextEvaluation,
    introductionEvaluation: evaluationsById.get(feature.introductionBlockId),
    eligibilityMilestone: getBlockEligibilityMilestone(evaluationsById.get(feature.introductionBlockId))
  };
}

export function selectGuidedLearningOrchestrationBlock({
  config = UNITED_STATES_GUIDED_LEARNING_ORCHESTRATION_V1,
  state = createGuidedLearningOrchestrationState(null, config),
  repository = {},
  hasUnfinishedNonPhysicalLearning = true
} = {}) {
  const normalizedState = createGuidedLearningOrchestrationState(state, config);
  const evaluations = config.blocks.map((block) => evaluateGuidedLearningBlock(block, normalizedState, repository));
  const evaluationsById = new Map(evaluations.map((evaluation) => [evaluation.blockId, evaluation]));
  const completedBlockIds = new Set(normalizedState.completedBlockIds);
  const featureProgress = (config.physicalFeatures || []).map((feature) => ({
    feature,
    ...getPhysicalFeatureProgress(feature, completedBlockIds, evaluationsById)
  }));
  const activeEvaluation = normalizedState.activeBlockId
    ? evaluationsById.get(normalizedState.activeBlockId)
    : null;
  const inProgressFeature = featureProgress.find(({ inProgress }) => inProgress);
  const inProgressEvaluation = inProgressFeature?.nextEvaluation?.eligible
    ? inProgressFeature.nextEvaluation
    : null;
  const eligibleNonPhysicalEvaluation = evaluations.find(({ blockId, eligible }) => {
    const block = config.blocks.find(({ id }) => id === blockId);
    return eligible && block?.sequenceKind !== "physical-feature";
  }) || null;
  const physicalQueue = featureProgress
    .filter(({ completed, inProgress, introductionEvaluation }) => (
      !completed && !inProgress && introductionEvaluation?.eligible
    ))
    .map(({ feature, eligibilityMilestone }) => ({
      featureId: feature.id,
      authoredOrder: feature.authoredOrder,
      blockId: feature.introductionBlockId,
      eligibilityMilestone
    }))
    .sort(comparePhysicalFeatureQueueEntries);
  const physicalInterleaveBlocked = normalizedState.physicalInterleaveRequired
    && hasUnfinishedNonPhysicalLearning;
  let selectionReason = "no-external-block-eligible";
  let selectedEvaluation = null;
  if (activeEvaluation?.eligible) {
    selectedEvaluation = activeEvaluation;
    selectionReason = "active-block-resume";
  } else if (inProgressFeature) {
    if (inProgressEvaluation) {
      selectedEvaluation = inProgressEvaluation;
      selectionReason = "physical-feature-sequence-in-progress";
    } else {
      selectionReason = "physical-feature-sequence-prerequisite-pending";
    }
  } else if (eligibleNonPhysicalEvaluation) {
    selectedEvaluation = eligibleNonPhysicalEvaluation;
    selectionReason = "eligible-nonphysical-block";
  } else if (!physicalInterleaveBlocked && physicalQueue.length > 0) {
    selectedEvaluation = evaluationsById.get(physicalQueue[0].blockId);
    selectionReason = hasUnfinishedNonPhysicalLearning
      ? "eligible-physical-feature"
      : "nonphysical-curriculum-exhausted-drain-physical-backlog";
  } else if (physicalInterleaveBlocked && physicalQueue.length > 0) {
    selectionReason = "physical-feature-interleave-required";
  }
  const selectedBlock = selectedEvaluation
    ? config.blocks.find(({ id }) => id === selectedEvaluation.blockId)
    : config.fallbackBlock;
  const selectedFeature = featureProgress.find(({ feature }) => feature.blockIds.includes(selectedBlock.id));
  const selectedFeatureIndex = selectedFeature?.feature.blockIds.indexOf(selectedBlock.id) ?? -1;
  const nextSequenceBlockId = selectedFeatureIndex >= 0
    ? selectedFeature.feature.blockIds[selectedFeatureIndex + 1]
    : null;
  const intendedNextBlockId = nextSequenceBlockId
    || physicalQueue.find(({ blockId }) => blockId !== selectedBlock.id)?.blockId
    || config.fallbackBlock.id;
  const physicalFeatureTrace = [
    ...featureProgress.map((progress) => {
      const queuedIndex = physicalQueue.findIndex(({ featureId }) => featureId === progress.feature.id);
      const paced = physicalInterleaveBlocked && queuedIndex >= 0;
      return {
        featureId: progress.feature.id,
        targetId: progress.feature.targetId,
        name: progress.feature.name,
        family: progress.feature.family,
        conceptId: progress.feature.conceptId,
        authoredOrder: progress.feature.authoredOrder,
        geometry: cloneJson(progress.feature.geometry),
        prerequisiteSource: progress.feature.prerequisiteSource,
        prerequisiteStateIds: [...progress.feature.introductionPrerequisiteStateIds],
        prerequisiteCoverage: cloneJson(progress.introductionEvaluation?.prerequisites || []),
        eligibilityMilestone: progress.eligibilityMilestone,
        status: progress.completed
          ? "completed"
          : progress.inProgress
            ? "in-progress"
            : queuedIndex >= 0
              ? paced ? "pacing-blocked" : "queued"
              : "prerequisite-blocked",
        queuePosition: queuedIndex >= 0 ? queuedIndex + 1 : null,
        selected: progress.feature.blockIds.includes(selectedBlock.id),
        reason: progress.feature.blockIds.includes(selectedBlock.id)
          ? selectionReason
          : paced
            ? "physical-feature-interleave-required"
            : queuedIndex >= 0
              ? "waiting-in-deterministic-queue"
              : progress.completed
                ? "sequence-completed"
                : progress.inProgress
                  ? progress.nextEvaluation?.reason || "sequence-in-progress"
                  : progress.introductionEvaluation?.reason || "prerequisite-blocked",
        blockIds: [...progress.feature.blockIds],
        nextBlockId: progress.nextBlockId,
        camera: cloneJson(progress.feature.camera),
        returnBehavior: "guided-learning-resume"
      };
    }),
    ...(config.deferredPhysicalFeatures || []).map((feature) => ({
      featureId: feature.id,
      targetId: feature.targetId,
      name: feature.name,
      family: feature.family,
      conceptId: feature.conceptId,
      authoredOrder: feature.authoredOrder,
      geometry: cloneJson(feature.geometry),
      prerequisiteSource: feature.prerequisiteSource,
      prerequisiteStateIds: [...feature.introductionPrerequisiteStateIds],
      prerequisiteCoverage: [],
      status: "deferred",
      exclusionReason: feature.exclusionReason,
      queuePosition: null,
      selected: false,
      reason: feature.exclusionReason,
      blockIds: [],
      nextBlockId: null,
      camera: cloneJson(feature.camera),
      returnBehavior: null
    }))
  ];
  return {
    orchestrationId: config.id,
    deterministicOrder: config.blocks.map(({ id }) => id),
    currentBlock: cloneJson(selectedBlock),
    currentBlockEvaluation: selectedEvaluation || {
      blockId: config.fallbackBlock.id,
      blockType: config.fallbackBlock.type,
      eligible: true,
      reason: "guided-learning-fallback",
      prerequisiteBlocks: [],
      prerequisites: []
    },
    previousBlockId: normalizedState.previousBlockId,
    intendedNextBlockId,
    externalActivity: selectedBlock.destination?.kind === "guided-learning-resume"
      ? null
      : cloneJson(selectedBlock.destination),
    completionStatus: normalizedState.activeBlockId === selectedBlock.id
      ? normalizedState.activeStatus
      : "not-started",
    fallbackReason: selectedEvaluation ? null : selectionReason,
    selectionReason,
    pacing: {
      physicalInterleaveRequired: normalizedState.physicalInterleaveRequired,
      hasUnfinishedNonPhysicalLearning: Boolean(hasUnfinishedNonPhysicalLearning),
      physicalInterleaveBlocked,
      lastCompletedPhysicalFeatureId: normalizedState.lastCompletedPhysicalFeatureId,
      lastNonPhysicalMilestone: cloneJson(normalizedState.lastNonPhysicalMilestone)
    },
    pendingPhysicalFeatureOrder: physicalQueue.map(({ featureId, blockId, eligibilityMilestone }) => ({
      featureId,
      blockId,
      eligibilityMilestone
    })),
    physicalFeatureTrace,
    evaluations
  };
}

export function startGuidedLearningOrchestrationBlock(state, blockId, returnContext = {}, config = UNITED_STATES_GUIDED_LEARNING_ORCHESTRATION_V1) {
  const normalized = createGuidedLearningOrchestrationState(state, config);
  const block = config.blocks.find(({ id }) => id === blockId);
  if (!block || normalized.completedBlockIds.includes(blockId)) return normalized;
  return createGuidedLearningOrchestrationState({
    ...normalized,
    activeBlockId: blockId,
    activeStatus: "launched",
    returnContext: cloneJson(returnContext),
    lastTransition: { kind: "launched", blockId }
  }, config);
}

export function deferGuidedLearningOrchestrationBlock(state, blockId, config = UNITED_STATES_GUIDED_LEARNING_ORCHESTRATION_V1) {
  const normalized = createGuidedLearningOrchestrationState(state, config);
  if (normalized.activeBlockId !== blockId || normalized.completedBlockIds.includes(blockId)) return normalized;
  return createGuidedLearningOrchestrationState({
    ...normalized,
    activeStatus: "pending",
    lastTransition: { kind: "deferred", blockId }
  }, config);
}

export function completeGuidedLearningOrchestrationBlock(state, blockId, config = UNITED_STATES_GUIDED_LEARNING_ORCHESTRATION_V1) {
  const normalized = createGuidedLearningOrchestrationState(state, config);
  const block = config.blocks.find(({ id }) => id === blockId);
  if (!block || normalized.activeBlockId !== blockId) return normalized;
  const completedPhysicalSequence = block.sequenceKind === "physical-feature" && block.sequenceCompletion === true;
  const completedNonPhysicalBlock = block.sequenceKind !== "physical-feature";
  return createGuidedLearningOrchestrationState({
    ...normalized,
    completedBlockIds: [...normalized.completedBlockIds, blockId],
    activeBlockId: null,
    activeStatus: null,
    previousBlockId: blockId,
    physicalInterleaveRequired: completedPhysicalSequence
      ? true
      : completedNonPhysicalBlock
        ? false
        : normalized.physicalInterleaveRequired,
    lastCompletedPhysicalFeatureId: completedPhysicalSequence
      ? block.featureId
      : normalized.lastCompletedPhysicalFeatureId,
    lastNonPhysicalMilestone: completedNonPhysicalBlock
      ? { kind: "external-block-completed", blockId }
      : normalized.lastNonPhysicalMilestone,
    lastTransition: { kind: "completed", blockId }
  }, config);
}

export function satisfyGuidedLearningPhysicalInterleave(
  state,
  details = {},
  config = UNITED_STATES_GUIDED_LEARNING_ORCHESTRATION_V1
) {
  const normalized = createGuidedLearningOrchestrationState(state, config);
  if (!normalized.physicalInterleaveRequired) return normalized;
  return createGuidedLearningOrchestrationState({
    ...normalized,
    physicalInterleaveRequired: false,
    lastNonPhysicalMilestone: {
      kind: "guided-session-completed",
      ...cloneJson(details)
    },
    lastTransition: {
      kind: "physical-interleave-satisfied",
      source: "guided-session-completed"
    }
  }, config);
}

export function createPhysicalFeatureIntroductionEvidence({ block, identity = {} } = {}) {
  const destination = block?.destination || {};
  const targetId = destination.targetIds?.[0];
  if (block?.type !== GUIDED_LEARNING_BLOCK_TYPES.PHYSICAL_FEATURE_INTRODUCTION || !targetId) {
    throw new TypeError("A physical-feature introduction block with a target is required.");
  }
  return adaptCanonicalRetrievalAttempt({
    item: {
      type: destination.targetType,
      targetId,
      sourceActivityId: destination.activityId
    },
    promptType: "guided",
    result: "correct",
    sourceMode: "guided-learning-orchestration",
    sourceActivityId: destination.activityId,
    ...identity
  });
}

export function validateGuidedLearningOrchestrationConfig(config = UNITED_STATES_GUIDED_LEARNING_ORCHESTRATION_V1) {
  const errors = [];
  const blockIds = (config.blocks || []).map(({ id }) => id);
  if (new Set(blockIds).size !== blockIds.length) errors.push("Block IDs must be unique.");
  (config.blocks || []).forEach((block) => {
    if (!block.id) errors.push("Every block needs a stable ID.");
    if (!orchestrationBlockTypes.has(block.type)) errors.push(`${block.id || "Unknown block"} has an invalid block type.`);
    (block.prerequisiteBlockIds || []).forEach((blockId) => {
      if (!blockIds.includes(blockId)) errors.push(`${block.id} references unknown prerequisite block ${blockId}.`);
    });
    if (!block.destination?.kind) errors.push(`${block.id} needs a destination.`);
    if (!block.completion?.kind) errors.push(`${block.id} needs completion behavior.`);
    if (!block.returnBehavior?.kind) errors.push(`${block.id} needs return behavior.`);
  });
  if (config.fallbackBlock?.type !== GUIDED_LEARNING_BLOCK_TYPES.GUIDED_SECTION) {
    errors.push("The fallback block must continue Guided Learning.");
  }
  (config.physicalFeatures || []).forEach((feature) => {
    if (!feature.supported) errors.push(`${feature.id} is not safe for orchestration.`);
    if (feature.geometry?.representation === "incomplete") errors.push(`${feature.id} has incomplete geometry.`);
    if (feature.blockIds.some((blockId) => !blockIds.includes(blockId))) {
      errors.push(`${feature.id} references a physical-feature block missing from the orchestration.`);
    }
    if (feature.blockIds.at(-1) !== feature.completionBlockId) {
      errors.push(`${feature.id} has an invalid physical-feature completion block.`);
    }
  });
  (config.deferredPhysicalFeatures || []).forEach((feature) => {
    if (feature.blockIds?.some((blockId) => blockIds.includes(blockId))) {
      errors.push(`${feature.id} is deferred but still has an orchestration block.`);
    }
  });
  return errors;
}
