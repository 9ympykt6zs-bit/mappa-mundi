import { adaptCanonicalRetrievalAttempt } from "./canonical-learning-evidence.js";
import {
  UNITED_STATES_PHYSICAL_FEATURE_DEFERRED_FAMILIES,
  UNITED_STATES_PHYSICAL_FEATURE_ORCHESTRATION_INVENTORY,
  UNITED_STATES_PHYSICAL_LEARNING_COHORTS,
  UNITED_STATES_PHYSICAL_COHORT_DEFERRED_GROUPS
} from "./united-states-physical-feature-orchestration.js";

export const GUIDED_LEARNING_ORCHESTRATION_STORAGE_KEY = "mappaGuidedLearningOrchestration";
export const GUIDED_LEARNING_ORCHESTRATION_VERSION = 4;
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

function normalizePhysicalTeachingProgress(value = {}, config = UNITED_STATES_GUIDED_LEARNING_ORCHESTRATION_V1) {
  const source = value && typeof value === "object" ? value : {};
  const introductionBlocks = new Map((config?.blocks || [])
    .filter(({ type }) => type === GUIDED_LEARNING_BLOCK_TYPES.PHYSICAL_FEATURE_INTRODUCTION)
    .map((block) => [block.id, block]));
  const validTargetIds = new Set((config?.physicalFeatures || []).map(({ targetId }) => targetId));
  const validCohortIds = new Set((config?.physicalCohorts || []).map(({ id }) => id));

  return Object.fromEntries(Object.entries(source).flatMap(([blockId, progress]) => {
    if (!introductionBlocks.has(blockId) || !progress || typeof progress !== "object") return [];
    const teachingTargetIds = uniqueStrings(progress.teachingTargetIds).filter((targetId) => validTargetIds.has(targetId));
    if (teachingTargetIds.length === 0) return [];
    const taughtTargetIds = uniqueStrings(progress.taughtTargetIds)
      .filter((targetId) => teachingTargetIds.includes(targetId));
    const pendingTargetIds = teachingTargetIds.filter((targetId) => !taughtTargetIds.includes(targetId));
    const requestedCurrentTargetId = String(progress.currentTargetId || "").trim();
    const currentTargetId = pendingTargetIds.includes(requestedCurrentTargetId)
      ? requestedCurrentTargetId
      : pendingTargetIds[0] || null;
    return [[blockId, {
      blockId,
      cohortId: validCohortIds.has(progress.cohortId) ? progress.cohortId : null,
      teachingTargetIds,
      taughtTargetIds,
      currentTargetId,
      phase: pendingTargetIds.length > 0 ? "teaching" : "teaching-complete"
    }]];
  }));
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
  const practiceBlockId = feature.learningCohortId ? `us-guided:practice-${feature.targetId}` : null;
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
      sequenceCompletion: !practiceBlockId && !connectionBlockId,
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
    })
  ];
  if (practiceBlockId) {
    blocks.push(freezeBlock({
      id: practiceBlockId,
      type: GUIDED_LEARNING_BLOCK_TYPES.PHYSICAL_FEATURE_PRACTICE,
      sequenceKind: "physical-feature",
      featureId: feature.id,
      cohortId: feature.learningCohortId,
      featurePhase: "focused-retrieval",
      sequenceCompletion: !connectionBlockId,
      prerequisiteBlockIds: [introductionBlockId],
      prerequisites: [conceptCoveredPrerequisite(feature.conceptId)],
      destination: {
        kind: "targeted-memory-trail",
        ...commonDestination,
        cohortId: feature.learningCohortId
      },
      completion: { kind: "memory-trail-session-completed" },
      returnBehavior: { kind: "guided-learning-resume" }
    }));
  }
  if (connectionBlockId) {
    blocks.push(freezeBlock({
      id: connectionBlockId,
      type: GUIDED_LEARNING_BLOCK_TYPES.CONNECTION_CHECKPOINT,
      sequenceKind: "physical-feature",
      featureId: feature.id,
      featurePhase: "connection",
      sequenceCompletion: true,
      prerequisiteBlockIds: [introductionBlockId],
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
      introductionBlockId: blocks.find(({ featurePhase }) => featurePhase === "introduction")?.id || null,
      practiceBlockId: blocks.find(({ featurePhase }) => featurePhase === "focused-retrieval")?.id || null,
      connectionBlockId: blocks.find(({ featurePhase }) => featurePhase === "connection")?.id || null,
      completionBlockId: blocks.find(({ sequenceCompletion }) => sequenceCompletion)?.id || blocks.at(-1)?.id || null,
      blocks: Object.freeze(blocks)
    });
  });
}

function createPhysicalLearningCohorts(physicalFeatures, cohortDefinitions = UNITED_STATES_PHYSICAL_LEARNING_COHORTS) {
  const featuresByTargetId = new Map(physicalFeatures.map((feature) => [feature.targetId, feature]));
  return cohortDefinitions.map((cohort) => {
    const members = cohort.authoredMemberTargetIds
      .map((targetId) => featuresByTargetId.get(targetId))
      .filter(Boolean);
    return Object.freeze({
      ...cohort,
      authoredMemberTargetIds: Object.freeze([...cohort.authoredMemberTargetIds]),
      supportedMemberTargetIds: Object.freeze(members.map(({ targetId }) => targetId)),
      memberFeatureIds: Object.freeze(members.map(({ id }) => id)),
      camera: cohort.camera
        ? Object.freeze({ ...cohort.camera, center: Object.freeze([...cohort.camera.center]) })
        : null
    });
  }).filter(({ supportedMemberTargetIds }) => supportedMemberTargetIds.length > 0);
}

export function createUnitedStatesGuidedLearningOrchestrationConfig({
  physicalFeatureInventory = UNITED_STATES_PHYSICAL_FEATURE_ORCHESTRATION_INVENTORY,
  physicalLearningCohorts = UNITED_STATES_PHYSICAL_LEARNING_COHORTS
} = {}) {
  const physicalFeatures = createSupportedPhysicalFeatures(physicalFeatureInventory);
  const physicalCohorts = createPhysicalLearningCohorts(physicalFeatures, physicalLearningCohorts);
  const deferredPhysicalFeatures = physicalFeatureInventory.filter(({ supported }) => !supported);
  return Object.freeze({
    id: UNITED_STATES_GUIDED_LEARNING_ORCHESTRATION_ID,
    version: GUIDED_LEARNING_ORCHESTRATION_VERSION,
    physicalFeatures: Object.freeze(physicalFeatures),
    physicalCohorts: Object.freeze(physicalCohorts),
    deferredPhysicalCohortGroups: UNITED_STATES_PHYSICAL_COHORT_DEFERRED_GROUPS,
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
  const cohortIds = new Set((config.physicalCohorts || []).map(({ id }) => id));
  const cohortMembersById = new Map((config.physicalCohorts || []).map((cohort) => [
    cohort.id,
    new Set(cohort.supportedMemberTargetIds)
  ]));
  const retrievedPhysicalCohortTargetIds = Object.fromEntries(Object.entries(
    source.retrievedPhysicalCohortTargetIds && typeof source.retrievedPhysicalCohortTargetIds === "object"
      ? source.retrievedPhysicalCohortTargetIds
      : {}
  ).filter(([cohortId]) => cohortIds.has(cohortId)).map(([cohortId, targetIds]) => [
    cohortId,
    uniqueStrings(targetIds).filter((targetId) => cohortMembersById.get(cohortId)?.has(targetId))
  ]));
  return {
    version: GUIDED_LEARNING_ORCHESTRATION_VERSION,
    orchestrationId: config.id,
    completedBlockIds,
    activeBlockId,
    activeStatus,
    previousBlockId: validBlockIds.has(source.previousBlockId) ? source.previousBlockId : null,
    physicalInterleaveRequired: source.physicalInterleaveRequired === true,
    lastCompletedPhysicalFeatureId: String(source.lastCompletedPhysicalFeatureId || "").trim() || null,
    lastCompletedPhysicalCohortId: cohortIds.has(source.lastCompletedPhysicalCohortId)
      ? source.lastCompletedPhysicalCohortId
      : null,
    physicalTeachingProgress: normalizePhysicalTeachingProgress(source.physicalTeachingProgress, config),
    retrievedPhysicalCohortTargetIds,
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

export function beginGuidedLearningPhysicalTeaching(
  state,
  { blockId, cohortId = null, targetIds = [] } = {},
  config = UNITED_STATES_GUIDED_LEARNING_ORCHESTRATION_V1
) {
  const normalized = createGuidedLearningOrchestrationState(state, config);
  const block = config.blocks.find(({ id }) => id === blockId);
  if (
    block?.type !== GUIDED_LEARNING_BLOCK_TYPES.PHYSICAL_FEATURE_INTRODUCTION
    || normalized.activeBlockId !== blockId
  ) {
    return normalized;
  }
  const validTargetIds = new Set((config.physicalFeatures || []).map(({ targetId }) => targetId));
  const teachingTargetIds = uniqueStrings(targetIds).filter((targetId) => validTargetIds.has(targetId));
  if (teachingTargetIds.length === 0) return normalized;
  const previous = normalized.physicalTeachingProgress[blockId];
  const taughtTargetIds = uniqueStrings(previous?.taughtTargetIds)
    .filter((targetId) => teachingTargetIds.includes(targetId));
  const currentTargetId = teachingTargetIds.find((targetId) => !taughtTargetIds.includes(targetId)) || null;
  return createGuidedLearningOrchestrationState({
    ...normalized,
    physicalTeachingProgress: {
      ...normalized.physicalTeachingProgress,
      [blockId]: {
        blockId,
        cohortId,
        teachingTargetIds,
        taughtTargetIds,
        currentTargetId,
        phase: currentTargetId ? "teaching" : "teaching-complete"
      }
    },
    lastTransition: {
      kind: previous ? "physical-teaching-resumed" : "physical-teaching-started",
      blockId,
      currentTargetId
    }
  }, config);
}

export function recordGuidedLearningPhysicalTeachingTarget(
  state,
  { blockId, targetId } = {},
  config = UNITED_STATES_GUIDED_LEARNING_ORCHESTRATION_V1
) {
  const normalized = createGuidedLearningOrchestrationState(state, config);
  const progress = normalized.physicalTeachingProgress[blockId];
  if (
    normalized.activeBlockId !== blockId
    || !progress
    || progress.currentTargetId !== targetId
    || !progress.teachingTargetIds.includes(targetId)
  ) {
    return normalized;
  }
  const taughtTargetIds = uniqueStrings([...progress.taughtTargetIds, targetId]);
  const currentTargetId = progress.teachingTargetIds
    .find((candidateId) => !taughtTargetIds.includes(candidateId)) || null;
  return createGuidedLearningOrchestrationState({
    ...normalized,
    physicalTeachingProgress: {
      ...normalized.physicalTeachingProgress,
      [blockId]: {
        ...progress,
        taughtTargetIds,
        currentTargetId,
        phase: currentTargetId ? "teaching" : "teaching-complete"
      }
    },
    lastTransition: {
      kind: "physical-teaching-target-completed",
      blockId,
      targetId,
      currentTargetId
    }
  }, config);
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

export function selectPhysicalCohortRetrievalSubset({
  cohort,
  introducedTargetIds = [],
  retrievedTargetIds = []
} = {}) {
  const authoredOrder = cohort?.supportedMemberTargetIds || cohort?.authoredMemberTargetIds || [];
  const introducedSet = new Set(uniqueStrings(introducedTargetIds));
  const retrievedSet = new Set(uniqueStrings(retrievedTargetIds));
  const introduced = authoredOrder.filter((targetId) => introducedSet.has(targetId));
  const newlyIntroduced = introduced.filter((targetId) => !retrievedSet.has(targetId));
  const minimumSize = Math.max(2, Number(cohort?.minimumRetrievalSize) || 2);
  const preferredSize = Math.max(minimumSize, Number(cohort?.preferredRetrievalSize) || 3);
  if (introduced.length < minimumSize) {
    return {
      retrievalReady: false,
      reason: introduced.length === 0 ? "no-cohort-members-introduced" : "awaiting-second-introduced-member",
      introducedTargetIds: introduced,
      retrievedTargetIds: authoredOrder.filter((targetId) => retrievedSet.has(targetId)),
      newlyIntroducedTargetIds: newlyIntroduced,
      retrievalTargetIds: []
    };
  }
  if (newlyIntroduced.length === 0) {
    return {
      retrievalReady: false,
      reason: "introduced-subset-already-retrieved",
      introducedTargetIds: introduced,
      retrievedTargetIds: authoredOrder.filter((targetId) => retrievedSet.has(targetId)),
      newlyIntroducedTargetIds: [],
      retrievalTargetIds: []
    };
  }
  const selected = new Set(newlyIntroduced.slice(0, preferredSize));
  introduced.forEach((targetId) => {
    if (selected.size < preferredSize) selected.add(targetId);
  });
  const retrievalTargetIds = authoredOrder.filter((targetId) => selected.has(targetId));
  if (retrievalTargetIds.length < minimumSize) {
    return {
      retrievalReady: false,
      reason: "insufficient-introduced-comparison-members",
      introducedTargetIds: introduced,
      retrievedTargetIds: authoredOrder.filter((targetId) => retrievedSet.has(targetId)),
      newlyIntroducedTargetIds: newlyIntroduced,
      retrievalTargetIds: []
    };
  }
  return {
    retrievalReady: true,
    reason: retrievedSet.size > 0 ? "cohort-expanded-with-new-member" : "meaningful-comparison-set-ready",
    introducedTargetIds: introduced,
    retrievedTargetIds: authoredOrder.filter((targetId) => retrievedSet.has(targetId)),
    newlyIntroducedTargetIds: newlyIntroduced,
    retrievalTargetIds
  };
}

function getPhysicalCohortProgress(config, completedBlockIds, evaluationsById, normalizedState) {
  const featuresByTargetId = new Map((config.physicalFeatures || []).map((feature) => [feature.targetId, feature]));
  return (config.physicalCohorts || []).map((cohort) => {
    const introducedTargetIds = cohort.supportedMemberTargetIds.filter((targetId) => {
      const feature = featuresByTargetId.get(targetId);
      return feature && completedBlockIds.has(feature.introductionBlockId);
    });
    const retrievedTargetIds = normalizedState.retrievedPhysicalCohortTargetIds[cohort.id] || [];
    const retrieval = selectPhysicalCohortRetrievalSubset({ cohort, introducedTargetIds, retrievedTargetIds });
    const members = cohort.authoredMemberTargetIds.map((targetId) => {
      const feature = featuresByTargetId.get(targetId);
      const evaluation = feature ? evaluationsById.get(feature.introductionBlockId) : null;
      return {
        targetId,
        featureId: feature?.id || null,
        name: feature?.name || targetId,
        supported: Boolean(feature),
        introduced: introducedTargetIds.includes(targetId),
        prerequisiteStatus: introducedTargetIds.includes(targetId)
          ? "covered-and-introduced"
          : evaluation?.eligible
            ? "covered-awaiting-introduction"
            : evaluation?.reason || "unsupported",
        prerequisiteCoverage: cloneJson(evaluation?.prerequisites || [])
      };
    });
    return {
      cohort,
      members,
      ...retrieval,
      eligibleUnintroducedTargetIds: members
        .filter(({ supported, introduced, prerequisiteStatus }) => (
          supported && !introduced && prerequisiteStatus === "covered-awaiting-introduction"
        ))
        .map(({ targetId }) => targetId),
      pendingTargetIds: members
        .filter(({ supported, introduced }) => supported && !introduced)
        .map(({ targetId }) => targetId)
    };
  });
}

function getPhysicalFeatureProgress(feature, completedBlockIds, evaluationsById) {
  const completedIds = feature.blockIds.filter((blockId) => completedBlockIds.has(blockId));
  const pendingIds = feature.blockIds.filter((blockId) => !completedBlockIds.has(blockId));
  const nextBlockId = pendingIds.find((blockId) => evaluationsById.get(blockId)?.eligible) || pendingIds[0] || null;
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

function createDynamicPhysicalIntroductionBlock(block, cohortProgress, featuresByTargetId, normalizedState) {
  if (!cohortProgress) {
    const teachingTargetIds = uniqueStrings(block.destination.targetIds);
    const persistedTeachingProgress = normalizedState?.physicalTeachingProgress?.[block.id] || null;
    const taughtTargetIds = persistedTeachingProgress?.taughtTargetIds
      ?.filter((targetId) => teachingTargetIds.includes(targetId)) || [];
    const pendingTeachingTargetIds = teachingTargetIds.filter((targetId) => !taughtTargetIds.includes(targetId));
    const targetFeatures = teachingTargetIds.map((targetId) => featuresByTargetId.get(targetId)).filter(Boolean);
    return {
      ...block,
      introductionBlockIds: [block.id],
      destination: {
        ...block.destination,
        newTargetIds: teachingTargetIds,
        newTargetLabels: targetFeatures.map(({ name }) => name),
        newTargetConceptIds: targetFeatures.map(({ conceptId }) => conceptId),
        teachingTargetIds,
        taughtTargetIds,
        pendingTeachingTargetIds,
        currentTeachingTargetId: pendingTeachingTargetIds[0] || null,
        teachingPhase: pendingTeachingTargetIds.length > 0 ? "teaching" : "teaching-complete",
        cameraSource: block.destination.camera ? "authored-feature-override" : "automatic-feature-fit"
      }
    };
  }
  const introduced = cohortProgress.introducedTargetIds;
  const preferredSize = Math.max(2, Number(cohortProgress.cohort.preferredRetrievalSize) || 3);
  const selectedTargetId = block.destination.targetIds[0];
  const eligibleNewMembers = cohortProgress.eligibleUnintroducedTargetIds;
  const availableIntroductionSlots = Math.max(1, preferredSize - Math.min(preferredSize, introduced.length));
  const newTargetIds = uniqueStrings([
    selectedTargetId,
    ...eligibleNewMembers.filter((targetId) => targetId !== selectedTargetId).slice(0, availableIntroductionSlots - 1)
  ]);
  const comparisonMembers = introduced.length >= preferredSize
    ? [
        ...introduced.filter((targetId) => !newTargetIds.includes(targetId)).slice(0, Math.max(0, preferredSize - newTargetIds.length)),
        ...newTargetIds
      ]
    : [...introduced, ...newTargetIds];
  const comparisonSet = new Set(comparisonMembers);
  const targetIds = cohortProgress.cohort.supportedMemberTargetIds
    .filter((targetId) => comparisonSet.has(targetId))
    .slice(0, preferredSize);
  const persistedTeachingProgress = normalizedState?.physicalTeachingProgress?.[block.id] || null;
  const teachingTargetIds = persistedTeachingProgress?.teachingTargetIds?.length
    ? persistedTeachingProgress.teachingTargetIds.filter((targetId) => targetIds.includes(targetId))
    : newTargetIds;
  const taughtTargetIds = persistedTeachingProgress?.taughtTargetIds
    ?.filter((targetId) => teachingTargetIds.includes(targetId)) || [];
  const pendingTeachingTargetIds = teachingTargetIds.filter((targetId) => !taughtTargetIds.includes(targetId));
  const targetFeatures = targetIds.map((targetId) => featuresByTargetId.get(targetId)).filter(Boolean);
  const newFeatures = teachingTargetIds.map((targetId) => featuresByTargetId.get(targetId)).filter(Boolean);
  return {
    ...block,
    cohortId: cohortProgress.cohort.id,
    introductionBlockIds: newFeatures.map(({ introductionBlockId }) => introductionBlockId),
    destination: {
      ...block.destination,
      cohortId: cohortProgress.cohort.id,
      targetIds,
      targetLabels: targetFeatures.map(({ name }) => name),
      targetConceptIds: targetFeatures.map(({ conceptId }) => conceptId),
      newTargetIds: teachingTargetIds,
      newTargetLabels: newFeatures.map(({ name }) => name),
      newTargetConceptIds: newFeatures.map(({ conceptId }) => conceptId),
      teachingTargetIds,
      taughtTargetIds,
      pendingTeachingTargetIds,
      currentTeachingTargetId: pendingTeachingTargetIds[0] || null,
      teachingPhase: pendingTeachingTargetIds.length > 0 ? "teaching" : "teaching-complete",
      camera: cohortProgress.cohort.camera || block.destination.camera,
      cameraSource: cohortProgress.cohort.camera ? "authored-cohort-override" : "automatic-feature-fit",
      teachingMessage: targetFeatures.length > 1
        ? `Compare ${targetFeatures.map(({ name }) => name).join(", ")}. Notice where each belongs in the region.`
        : block.destination.teachingMessage
    }
  };
}

function createDynamicPhysicalPracticeBlock(block, cohortProgress, featuresByTargetId) {
  if (!cohortProgress?.retrievalReady) return block;
  const targetFeatures = cohortProgress.retrievalTargetIds
    .map((targetId) => featuresByTargetId.get(targetId))
    .filter(Boolean);
  return {
    ...block,
    cohortId: cohortProgress.cohort.id,
    destination: {
      ...block.destination,
      cohortId: cohortProgress.cohort.id,
      targetIds: targetFeatures.map(({ targetId }) => targetId),
      targetLabels: targetFeatures.map(({ name }) => name),
      targetConceptIds: targetFeatures.map(({ conceptId }) => conceptId),
      camera: cohortProgress.cohort.camera || block.destination.camera,
      cameraSource: cohortProgress.cohort.camera ? "authored-cohort-override" : "automatic-feature-fit",
      persistentLearningCamera: cohortProgress.cohort.camera || null
    }
  };
}

export function selectGuidedLearningOrchestrationBlock({
  config = UNITED_STATES_GUIDED_LEARNING_ORCHESTRATION_V1,
  state = createGuidedLearningOrchestrationState(null, config),
  repository = {},
  hasUnfinishedNonPhysicalLearning = true
} = {}) {
  const normalizedState = createGuidedLearningOrchestrationState(state, config);
  let evaluations = config.blocks.map((block) => evaluateGuidedLearningBlock(block, normalizedState, repository));
  let evaluationsById = new Map(evaluations.map((evaluation) => [evaluation.blockId, evaluation]));
  const completedBlockIds = new Set(normalizedState.completedBlockIds);
  let cohortProgress = getPhysicalCohortProgress(config, completedBlockIds, evaluationsById, normalizedState);
  const cohortProgressById = new Map(cohortProgress.map((progress) => [progress.cohort.id, progress]));
  evaluations = evaluations.map((evaluation) => {
    const block = config.blocks.find(({ id }) => id === evaluation.blockId);
    if (block?.type !== GUIDED_LEARNING_BLOCK_TYPES.PHYSICAL_FEATURE_PRACTICE || !block.cohortId) {
      return evaluation;
    }
    const progress = cohortProgressById.get(block.cohortId);
    const feature = config.physicalFeatures.find(({ id }) => id === block.featureId);
    const triggerIsNew = progress?.newlyIntroducedTargetIds.includes(feature?.targetId);
    const eligible = evaluation.eligible && progress?.retrievalReady && triggerIsNew;
    return {
      ...evaluation,
      eligible: Boolean(eligible),
      reason: eligible
        ? "cohort-retrieval-ready"
        : !evaluation.eligible
          ? evaluation.reason
          : !progress?.retrievalReady
            ? progress?.reason || "cohort-retrieval-deferred"
            : "cohort-retrieval-already-owned-by-new-member",
      cohortId: block.cohortId,
      retrievalTargetIds: progress?.retrievalTargetIds || []
    };
  });
  evaluationsById = new Map(evaluations.map((evaluation) => [evaluation.blockId, evaluation]));
  cohortProgress = getPhysicalCohortProgress(config, completedBlockIds, evaluationsById, normalizedState);
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
  let selectedBlock = selectedEvaluation
    ? config.blocks.find(({ id }) => id === selectedEvaluation.blockId)
    : config.fallbackBlock;
  const featuresByTargetId = new Map((config.physicalFeatures || []).map((feature) => [feature.targetId, feature]));
  if (selectedBlock.type === GUIDED_LEARNING_BLOCK_TYPES.PHYSICAL_FEATURE_INTRODUCTION) {
    const feature = config.physicalFeatures.find(({ id }) => id === selectedBlock.featureId);
    selectedBlock = createDynamicPhysicalIntroductionBlock(
      selectedBlock,
      cohortProgress.find(({ cohort }) => cohort.id === feature?.learningCohortId),
      featuresByTargetId,
      normalizedState
    );
  } else if (selectedBlock.type === GUIDED_LEARNING_BLOCK_TYPES.PHYSICAL_FEATURE_PRACTICE) {
    selectedBlock = createDynamicPhysicalPracticeBlock(
      selectedBlock,
      cohortProgress.find(({ cohort }) => cohort.id === selectedBlock.cohortId),
      featuresByTargetId
    );
  }
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
        cohortId: progress.feature.learningCohortId,
        retrievalGroupingStatus: progress.feature.retrievalGroupingStatus,
        retrievalGroupingReason: progress.feature.retrievalGroupingReason,
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
  const physicalTeachingTrace = selectedBlock.type === GUIDED_LEARNING_BLOCK_TYPES.PHYSICAL_FEATURE_INTRODUCTION
    ? {
        cohortId: selectedBlock.destination.cohortId || null,
        phase: selectedBlock.destination.teachingPhase || "teaching",
        currentTargetId: selectedBlock.destination.currentTeachingTargetId || null,
        currentTarget: selectedBlock.destination.currentTeachingTargetId
          ? featuresByTargetId.get(selectedBlock.destination.currentTeachingTargetId)?.name || null
          : null,
        members: (selectedBlock.destination.teachingTargetIds || []).map((targetId) => ({
          targetId,
          name: featuresByTargetId.get(targetId)?.name || targetId,
          introduced: (selectedBlock.destination.taughtTargetIds || []).includes(targetId),
          current: selectedBlock.destination.currentTeachingTargetId === targetId
        })),
        interaction: {
          type: "guided-locating",
          highlight: Boolean(selectedBlock.destination.currentTeachingTargetId),
          evidenceOutcome: "assisted"
        },
        camera: cloneJson(selectedBlock.destination.camera),
        cameraSource: selectedBlock.destination.cameraSource || "automatic-feature-fit"
      }
    : selectedBlock.type === GUIDED_LEARNING_BLOCK_TYPES.PHYSICAL_FEATURE_PRACTICE
      ? {
          cohortId: selectedBlock.destination.cohortId || null,
          phase: "retrieval",
          currentTargetId: null,
          currentTarget: null,
          members: (selectedBlock.destination.targetIds || []).map((targetId) => ({
            targetId,
            name: featuresByTargetId.get(targetId)?.name || targetId,
            introduced: true,
            current: false
          })),
          interaction: {
            type: "locating",
            highlightBeforeAnswer: false
          },
          camera: cloneJson(selectedBlock.destination.camera),
          cameraSource: selectedBlock.destination.cameraSource || "automatic-feature-fit"
        }
      : null;
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
    physicalCohortTrace: cohortProgress.map((progress) => ({
      cohortId: progress.cohort.id,
      family: progress.cohort.family,
      source: progress.cohort.source,
      sourceId: progress.cohort.sourceId,
      authoredMemberTargetIds: [...progress.cohort.authoredMemberTargetIds],
      supportedMemberTargetIds: [...progress.cohort.supportedMemberTargetIds],
      members: cloneJson(progress.members),
      currentlyEligibleTargetIds: progress.members
        .filter(({ prerequisiteStatus }) => ["covered-and-introduced", "covered-awaiting-introduction"].includes(prerequisiteStatus))
        .map(({ targetId }) => targetId),
      introducedTargetIds: [...progress.introducedTargetIds],
      retrievedTargetIds: [...progress.retrievedTargetIds],
      newlyIntroducedTargetIds: [...progress.newlyIntroducedTargetIds],
      retrievalReady: progress.retrievalReady,
      retrievalDeferredReason: progress.retrievalReady ? null : progress.reason,
      retrievalTargetIds: [...progress.retrievalTargetIds],
      camera: cloneJson(progress.cohort.camera),
      cameraSource: progress.cohort.camera ? "authored-cohort-override" : "automatic-fit",
      pendingTargetIds: [...progress.pendingTargetIds]
    })),
    physicalFeatureTrace,
    physicalTeachingTrace,
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
  const cohortTargetIds = block.type === GUIDED_LEARNING_BLOCK_TYPES.PHYSICAL_FEATURE_PRACTICE
    ? uniqueStrings(normalized.returnContext?.physicalCohortTargetIds)
    : [];
  const retrievedPhysicalCohortTargetIds = block.cohortId && cohortTargetIds.length >= 2
    ? {
        ...normalized.retrievedPhysicalCohortTargetIds,
        [block.cohortId]: uniqueStrings([
          ...(normalized.retrievedPhysicalCohortTargetIds[block.cohortId] || []),
          ...cohortTargetIds
        ])
      }
    : normalized.retrievedPhysicalCohortTargetIds;
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
    lastCompletedPhysicalCohortId: block.cohortId && cohortTargetIds.length >= 2
      ? block.cohortId
      : normalized.lastCompletedPhysicalCohortId,
    retrievedPhysicalCohortTargetIds,
    lastNonPhysicalMilestone: completedNonPhysicalBlock
      ? { kind: "external-block-completed", blockId }
      : normalized.lastNonPhysicalMilestone,
    lastTransition: { kind: "completed", blockId }
  }, config);
}

export function completeGuidedLearningPhysicalFeatureIntroductions(
  state,
  introductionBlockIds = [],
  config = UNITED_STATES_GUIDED_LEARNING_ORCHESTRATION_V1
) {
  const normalized = createGuidedLearningOrchestrationState(state, config);
  const blockIds = uniqueStrings(introductionBlockIds);
  const blocks = blockIds.map((blockId) => config.blocks.find(({ id }) => id === blockId)).filter(Boolean);
  if (
    blocks.length !== blockIds.length
    || blocks.some(({ type }) => type !== GUIDED_LEARNING_BLOCK_TYPES.PHYSICAL_FEATURE_INTRODUCTION)
    || !blocks.some(({ id }) => id === normalized.activeBlockId)
  ) {
    return normalized;
  }
  const completedBlockIds = uniqueStrings([...normalized.completedBlockIds, ...blockIds]);
  const completedSequenceBlock = blocks.find(({ sequenceCompletion }) => true);
  const physicalTeachingProgress = Object.fromEntries(Object.entries(normalized.physicalTeachingProgress)
    .filter(([progressBlockId]) => !blockIds.includes(progressBlockId) && progressBlockId !== normalized.activeBlockId));
  return createGuidedLearningOrchestrationState({
    ...normalized,
    completedBlockIds,
    physicalTeachingProgress,
    activeBlockId: null,
    activeStatus: null,
    previousBlockId: normalized.activeBlockId,
    physicalInterleaveRequired: completedSequenceBlock ? true : normalized.physicalInterleaveRequired,
    lastCompletedPhysicalFeatureId: completedSequenceBlock?.featureId || normalized.lastCompletedPhysicalFeatureId,
    lastTransition: {
      kind: "physical-feature-introductions-completed",
      blockIds
    }
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

export function createPhysicalFeatureIntroductionEvidence({ block, targetId: requestedTargetId = null, identity = {} } = {}) {
  const destination = block?.destination || {};
  const targetId = requestedTargetId || destination.targetIds?.[0];
  if (block?.type !== GUIDED_LEARNING_BLOCK_TYPES.PHYSICAL_FEATURE_INTRODUCTION || !targetId) {
    throw new TypeError("A physical-feature introduction block with a target is required.");
  }
  if (!(destination.teachingTargetIds || destination.newTargetIds || destination.targetIds || []).includes(targetId)) {
    throw new TypeError(`${targetId} is not a teaching target in ${block.id}.`);
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

export function createPhysicalFeatureIntroductionEvidenceEvents({ block, identity = {} } = {}) {
  const destination = block?.destination || {};
  const targetIds = uniqueStrings(destination.newTargetIds?.length ? destination.newTargetIds : destination.targetIds);
  if (block?.type !== GUIDED_LEARNING_BLOCK_TYPES.PHYSICAL_FEATURE_INTRODUCTION || targetIds.length === 0) {
    throw new TypeError("A physical-feature introduction block with at least one new target is required.");
  }
  return targetIds.map((targetId) => createPhysicalFeatureIntroductionEvidence({
    block,
    targetId,
    identity: {
      ...identity,
      eventId: `${identity.eventId || "guided-physical-introduction"}:${targetId}`
    }
  }));
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
    if (feature.practiceBlockId && !feature.learningCohortId) {
      errors.push(`${feature.id} has retrieval without a physical learning cohort.`);
    }
  });
  const cohortIds = new Set();
  const cohortMemberIds = new Set();
  (config.physicalCohorts || []).forEach((cohort) => {
    if (cohortIds.has(cohort.id)) errors.push(`Physical cohort ID ${cohort.id} is duplicated.`);
    cohortIds.add(cohort.id);
    if (cohort.minimumRetrievalSize < 2) errors.push(`${cohort.id} permits trivial one-target retrieval.`);
    if (cohort.preferredRetrievalSize < cohort.minimumRetrievalSize) {
      errors.push(`${cohort.id} prefers fewer members than its retrieval minimum.`);
    }
    if (cohort.supportedMemberTargetIds.length < cohort.minimumRetrievalSize) {
      errors.push(`${cohort.id} does not contain a meaningful supported comparison set.`);
    }
    cohort.supportedMemberTargetIds.forEach((targetId) => {
      if (cohortMemberIds.has(targetId)) errors.push(`${targetId} belongs to more than one physical cohort.`);
      cohortMemberIds.add(targetId);
      const feature = config.physicalFeatures.find((candidate) => candidate.targetId === targetId);
      if (!feature || feature.learningCohortId !== cohort.id || feature.family !== cohort.family) {
        errors.push(`${cohort.id} has inconsistent member ${targetId}.`);
      }
    });
  });
  (config.deferredPhysicalFeatures || []).forEach((feature) => {
    if (feature.blockIds?.some((blockId) => blockIds.includes(blockId))) {
      errors.push(`${feature.id} is deferred but still has an orchestration block.`);
    }
  });
  return errors;
}
