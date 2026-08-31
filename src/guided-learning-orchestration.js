import { adaptCanonicalRetrievalAttempt } from "./canonical-learning-evidence.js";

export const GUIDED_LEARNING_ORCHESTRATION_STORAGE_KEY = "mappaGuidedLearningOrchestration";
export const GUIDED_LEARNING_ORCHESTRATION_VERSION = 1;
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

const whiteMountainsStateIds = Object.freeze(["maine", "new-hampshire"]);
const reconstructionBlockId = "us-guided:rebuild-new-england";
const physicalIntroductionBlockId = "us-guided:introduce-white-mountains";
const physicalPracticeBlockId = "us-guided:practice-white-mountains";
const connectionBlockId = "us-guided:connect-maine-white-mountains";

export const UNITED_STATES_GUIDED_LEARNING_ORCHESTRATION_V1 = Object.freeze({
  id: UNITED_STATES_GUIDED_LEARNING_ORCHESTRATION_ID,
  version: GUIDED_LEARNING_ORCHESTRATION_VERSION,
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
    freezeBlock({
      id: physicalIntroductionBlockId,
      type: GUIDED_LEARNING_BLOCK_TYPES.PHYSICAL_FEATURE_INTRODUCTION,
      prerequisiteBlockIds: [reconstructionBlockId],
      prerequisites: whiteMountainsStateIds.map(stateCoveredPrerequisite),
      destination: {
        kind: "physical-feature-introduction",
        journeyId: "us-mountain-ranges",
        stepId: "us-mountain-ranges",
        activityId: "us-mountain-ranges",
        targetIds: ["white-mountains"],
        targetType: "mountain-range",
        targetLabel: "White Mountains",
        targetConceptId: "mountain-range-location:white-mountains",
        prerequisiteStateIds: [...whiteMountainsStateIds]
      },
      completion: {
        kind: "guided-exposure-acknowledged"
      },
      returnBehavior: {
        kind: "guided-learning-resume"
      }
    }),
    freezeBlock({
      id: physicalPracticeBlockId,
      type: GUIDED_LEARNING_BLOCK_TYPES.PHYSICAL_FEATURE_PRACTICE,
      prerequisiteBlockIds: [physicalIntroductionBlockId],
      prerequisites: [conceptCoveredPrerequisite("mountain-range-location:white-mountains")],
      destination: {
        kind: "targeted-memory-trail",
        journeyId: "us-mountain-ranges",
        stepId: "us-mountain-ranges",
        activityId: "us-mountain-ranges",
        targetIds: ["white-mountains"],
        targetType: "mountain-range",
        targetLabel: "White Mountains",
        targetConceptId: "mountain-range-location:white-mountains"
      },
      completion: {
        kind: "memory-trail-session-completed"
      },
      returnBehavior: {
        kind: "guided-learning-resume"
      }
    }),
    freezeBlock({
      id: connectionBlockId,
      type: GUIDED_LEARNING_BLOCK_TYPES.CONNECTION_CHECKPOINT,
      prerequisiteBlockIds: [physicalPracticeBlockId],
      prerequisites: [
        stateCoveredPrerequisite("maine"),
        conceptCoveredPrerequisite("mountain-range-location:white-mountains")
      ],
      destination: {
        kind: "targeted-connection",
        challengeIds: ["us-relationship-mountain-range-maine-white-mountains"],
        conceptId: "relationship:mountain-range:maine:white-mountains"
      },
      completion: {
        kind: "answer-submitted",
        requiresCorrectResult: false
      },
      returnBehavior: {
        kind: "guided-learning-resume"
      }
    })
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

function getRepositoryEvents(repository = {}) {
  return Array.isArray(repository?.events) ? repository.events.filter(Boolean) : [];
}

export function getInstructionalCoverage(conceptId, repository = {}) {
  const normalizedConceptId = String(conceptId || "").trim();
  const matchingEvents = getRepositoryEvents(repository)
    .filter((event) => event.conceptId === normalizedConceptId);
  const coveringEvents = matchingEvents.filter((event) => coveredOutcomes.has(event.outcome));
  return {
    conceptId: normalizedConceptId,
    covered: coveringEvents.length > 0,
    reason: coveringEvents.length > 0 ? "trustworthy-context-evidence" : "no-covering-evidence",
    coveringOutcomes: uniqueStrings(coveringEvents.map((event) => event.outcome)).sort(),
    coveringEventIds: uniqueStrings(coveringEvents.map((event) => event.eventId)),
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
  return {
    id: String(prerequisite.id || conceptIds.join("|")).trim(),
    match,
    covered,
    reason: covered ? "covered" : "prerequisite-not-covered",
    concepts
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

export function selectGuidedLearningOrchestrationBlock({
  config = UNITED_STATES_GUIDED_LEARNING_ORCHESTRATION_V1,
  state = createGuidedLearningOrchestrationState(null, config),
  repository = {}
} = {}) {
  const normalizedState = createGuidedLearningOrchestrationState(state, config);
  const evaluations = config.blocks.map((block) => evaluateGuidedLearningBlock(block, normalizedState, repository));
  const activeEvaluation = normalizedState.activeBlockId
    ? evaluations.find(({ blockId }) => blockId === normalizedState.activeBlockId)
    : null;
  const selectedEvaluation = activeEvaluation?.eligible
    ? activeEvaluation
    : evaluations.find(({ eligible }) => eligible) || null;
  const selectedBlock = selectedEvaluation
    ? config.blocks.find(({ id }) => id === selectedEvaluation.blockId)
    : config.fallbackBlock;
  const nextIncompleteBlock = config.blocks.find(({ id }) => (
    id !== selectedBlock.id && !normalizedState.completedBlockIds.includes(id)
  ));
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
    intendedNextBlockId: nextIncompleteBlock?.id || config.fallbackBlock.id,
    externalActivity: selectedBlock.destination?.kind === "guided-learning-resume"
      ? null
      : cloneJson(selectedBlock.destination),
    completionStatus: normalizedState.activeBlockId === selectedBlock.id
      ? normalizedState.activeStatus
      : "not-started",
    fallbackReason: selectedEvaluation ? null : "no-external-block-eligible",
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
  if (!config.blocks.some(({ id }) => id === blockId) || normalized.activeBlockId !== blockId) return normalized;
  return createGuidedLearningOrchestrationState({
    ...normalized,
    completedBlockIds: [...normalized.completedBlockIds, blockId],
    activeBlockId: null,
    activeStatus: null,
    previousBlockId: blockId,
    lastTransition: { kind: "completed", blockId }
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
  return errors;
}
