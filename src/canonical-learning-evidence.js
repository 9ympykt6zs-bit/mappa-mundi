export const CANONICAL_LEARNING_SCHEMA_VERSION = 1;

export const CANONICAL_SKILL_IDS = Object.freeze([
  "locating",
  "identifying",
  "recognition",
  "relationship-recall",
  "sequencing",
  "spatial-reconstruction"
]);

export const CANONICAL_EVIDENCE_OUTCOMES = Object.freeze([
  "correct",
  "incorrect",
  "partial",
  "assisted",
  "skipped"
]);

const canonicalSkillIdSet = new Set(CANONICAL_SKILL_IDS);
const canonicalOutcomeSet = new Set(CANONICAL_EVIDENCE_OUTCOMES);
const retrievalPromptTypes = new Set(["guided", "name_to_place", "place_to_name"]);

function cloneJson(value) {
  if (value === undefined) return undefined;
  return JSON.parse(JSON.stringify(value));
}

function requireNonEmptyString(value, fieldName) {
  const normalized = typeof value === "string" ? value.trim() : "";
  if (!normalized) throw new TypeError(`${fieldName} must be a non-empty string.`);
  return normalized;
}

function requireNamespacedId(value, fieldName) {
  const normalized = requireNonEmptyString(value, fieldName);
  if (!normalized.includes(":")) {
    throw new TypeError(`${fieldName} must be a namespaced ID.`);
  }
  return normalized;
}

function normalizeStringArray(value, fieldName, { allowEmpty = false } = {}) {
  if (!Array.isArray(value)) throw new TypeError(`${fieldName} must be an array.`);
  const normalized = [...new Set(value.map((item) => requireNonEmptyString(item, fieldName)))];
  if (!allowEmpty && normalized.length === 0) {
    throw new TypeError(`${fieldName} must contain at least one value.`);
  }
  return normalized;
}

function normalizeTimestamp(value) {
  const normalized = requireNonEmptyString(value, "occurredAt");
  if (!Number.isFinite(Date.parse(normalized))) {
    throw new TypeError("occurredAt must be a valid timestamp string.");
  }
  return normalized;
}

function normalizeOptionalString(value, fieldName) {
  return value === undefined || value === null || value === ""
    ? undefined
    : requireNonEmptyString(value, fieldName);
}

function normalizeCredit(value) {
  if (value === undefined || value === null) return undefined;
  const earned = Number(value.earned);
  const possible = Number(value.possible);
  if (!Number.isFinite(earned) || !Number.isFinite(possible) || possible <= 0 || earned < 0 || earned > possible) {
    throw new TypeError("credit must contain finite earned/possible values with 0 <= earned <= possible.");
  }
  return { earned, possible };
}

export function createCanonicalConcept(value = {}) {
  const schemaVersion = Number(value.schemaVersion ?? CANONICAL_LEARNING_SCHEMA_VERSION);
  if (schemaVersion !== CANONICAL_LEARNING_SCHEMA_VERSION) {
    throw new TypeError(`Unsupported canonical learning schema version: ${String(value.schemaVersion)}`);
  }
  return {
    schemaVersion,
    id: requireNamespacedId(value.id, "concept id"),
    kind: requireNonEmptyString(value.kind, "concept kind"),
    label: requireNonEmptyString(value.label || value.id, "concept label"),
    entityIds: normalizeStringArray(value.entityIds, "entityIds"),
    taxonomyTags: normalizeStringArray(value.taxonomyTags || [], "taxonomyTags", { allowEmpty: true })
  };
}

export function createCanonicalEvidenceEvent(value = {}) {
  const schemaVersion = Number(value.schemaVersion ?? CANONICAL_LEARNING_SCHEMA_VERSION);
  if (schemaVersion !== CANONICAL_LEARNING_SCHEMA_VERSION) {
    throw new TypeError(`Unsupported canonical learning schema version: ${String(value.schemaVersion)}`);
  }
  const skillId = requireNonEmptyString(value.skillId, "skillId");
  if (!canonicalSkillIdSet.has(skillId)) throw new TypeError(`Unknown canonical skill: ${skillId}`);
  const outcome = requireNonEmptyString(value.outcome, "outcome");
  if (!canonicalOutcomeSet.has(outcome)) throw new TypeError(`Unknown canonical outcome: ${outcome}`);
  const numericSequence = Number(value.sequence);
  const sequence = value.sequence === undefined || value.sequence === null
    ? undefined
    : Math.floor(numericSequence);
  if (value.sequence !== undefined && (!Number.isFinite(numericSequence) || numericSequence < 0)) {
    throw new TypeError("sequence must be a finite non-negative number when supplied.");
  }

  const event = {
    schemaVersion,
    eventId: requireNonEmptyString(value.eventId, "eventId"),
    attemptId: requireNonEmptyString(value.attemptId, "attemptId"),
    occurredAt: normalizeTimestamp(value.occurredAt),
    conceptId: requireNamespacedId(value.conceptId, "conceptId"),
    skillId,
    sourceMode: requireNonEmptyString(value.sourceMode, "sourceMode"),
    outcome
  };
  const optionalFields = {
    sourceActivityId: normalizeOptionalString(value.sourceActivityId, "sourceActivityId"),
    sessionId: normalizeOptionalString(value.sessionId, "sessionId"),
    sequence,
    credit: normalizeCredit(value.credit),
    response: value.response === undefined ? undefined : cloneJson(value.response),
    selectionTraceId: normalizeOptionalString(value.selectionTraceId, "selectionTraceId")
  };
  Object.entries(optionalFields).forEach(([key, fieldValue]) => {
    if (fieldValue !== undefined) event[key] = fieldValue;
  });
  return event;
}

function stateConceptIds(stateId) {
  return [`state-location:${stateId}`, `state-naming:${stateId}`];
}

function capitalConceptIds(stateId, capitalId) {
  return [`capital-location:${stateId}:${capitalId}`, `capital-naming:${stateId}:${capitalId}`];
}

export function getCanonicalRetrievalMappings(item = {}) {
  const type = requireNonEmptyString(item.type, "item.type");
  const targetId = requireNonEmptyString(item.targetId, "item.targetId");
  if (type === "state") {
    return [
      { conceptId: stateConceptIds(targetId)[0], skillId: "locating", promptType: "name_to_place" },
      { conceptId: stateConceptIds(targetId)[1], skillId: "identifying", promptType: "place_to_name" }
    ];
  }
  if (type === "capital") {
    const stateId = requireNonEmptyString(item.relatedStateTargetId, "item.relatedStateTargetId");
    return [
      { conceptId: capitalConceptIds(stateId, targetId)[0], skillId: "locating", promptType: "name_to_place" },
      { conceptId: capitalConceptIds(stateId, targetId)[1], skillId: "identifying", promptType: "place_to_name" }
    ];
  }
  throw new TypeError(`No canonical U.S. retrieval mapping exists for item type: ${type}`);
}

export function createCanonicalAggregateEvidenceSummary({ item = {}, progress = {}, sourceMode, sourceItemId } = {}) {
  const mappings = getCanonicalRetrievalMappings(item);
  const correctCount = Math.max(0, Number(progress.correctCount) || 0);
  const incorrectCount = Math.max(0, Number(progress.missCount) || 0);
  return {
    schemaVersion: CANONICAL_LEARNING_SCHEMA_VERSION,
    granularity: "aggregate",
    conceptIds: mappings.map(({ conceptId }) => conceptId),
    skillIds: mappings.map(({ skillId }) => skillId),
    sourceMode: requireNonEmptyString(sourceMode, "sourceMode"),
    sourceItemId: requireNonEmptyString(sourceItemId || item.id, "sourceItemId"),
    correctCount,
    incorrectCount,
    attempts: Math.max(correctCount + incorrectCount, Math.max(0, Number(progress.timesSeen) || 0)),
    skillAttribution: "combined-and-unavailable",
    note: "The persisted source combines prompt forms, so its counts cannot be assigned to one canonical concept/skill without raw attempts."
  };
}

export function adaptCanonicalRetrievalAttempt({ item = {}, promptType, result, ...context } = {}) {
  const normalizedPromptType = requireNonEmptyString(promptType, "promptType");
  if (!retrievalPromptTypes.has(normalizedPromptType)) {
    throw new TypeError(`Unsupported retrieval prompt type: ${normalizedPromptType}`);
  }
  const effectivePromptType = normalizedPromptType === "guided" ? "name_to_place" : normalizedPromptType;
  const mapping = getCanonicalRetrievalMappings(item).find((candidate) => candidate.promptType === effectivePromptType);
  const normalizedResult = requireNonEmptyString(result, "result");
  const outcome = normalizedPromptType === "guided"
    ? "assisted"
    : normalizedResult === "correct" ? "correct" : normalizedResult === "incorrect" ? "incorrect" : "";
  if (!outcome) throw new TypeError(`Unsupported retrieval result: ${normalizedResult}`);
  return createCanonicalEvidenceEvent({
    ...context,
    conceptId: mapping.conceptId,
    skillId: mapping.skillId,
    outcome
  });
}

function hasPartialMentalMapEvidence(evaluation = {}) {
  return Number(evaluation.score) > 0
    || (evaluation.selectedValidStateIds || []).length > 0
    || (evaluation.correctlyPositionedStateIds || []).length > 0
    || (evaluation.misplacedStateIds || []).length > 0
    || (evaluation.validTransitions || []).length > 0;
}

function canonicalSlug(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function uniqueSorted(values = []) {
  return [...new Set(values.filter(Boolean))].sort();
}

export function getCanonicalMentalMapConceptId(challenge = {}) {
  if (challenge.canonicalConceptId) return requireNamespacedId(challenge.canonicalConceptId, "challenge.canonicalConceptId");
  const ordered = challenge.orderedStateIds || [];
  if (ordered.length) return `relationship:ordered:${ordered.join(">")}`;
  if (challenge.routeStartStateId && challenge.routeDestinationStateId) {
    return `relationship:border-route:${challenge.routeStartStateId}:${challenge.routeDestinationStateId}`;
  }
  const relationships = (challenge.directionRelationships || [])
    .map(({ fromStateId, toStateId, direction }) => `${fromStateId}:${direction}:${toStateId}`)
    .sort();
  if (relationships.length) return `relationship:direction:${relationships.join("+")}`;
  const correct = uniqueSorted([
    ...(challenge.correctStateIds || []),
    challenge.correctStateId
  ]);
  const features = uniqueSorted(challenge.associatedFeatureIds || []);
  return `relationship:set:${[...features, ...correct].map(canonicalSlug).join("+")}`;
}

export function adaptCanonicalMentalMapEvaluation({ challenge = {}, evaluation = {}, conceptId, ...context } = {}) {
  const isSequencing = challenge.answerMode === "ordered-sequence";
  const credit = Number.isFinite(Number(evaluation.score)) && Number.isFinite(Number(evaluation.maxScore)) && Number(evaluation.maxScore) > 0
    ? { earned: Number(evaluation.score), possible: Number(evaluation.maxScore) }
    : undefined;
  return createCanonicalEvidenceEvent({
    ...context,
    conceptId,
    skillId: isSequencing ? "sequencing" : "relationship-recall",
    outcome: evaluation.isCorrect ? "correct" : hasPartialMentalMapEvidence(evaluation) ? "partial" : "incorrect",
    credit,
    response: {
      challengeId: challenge.id || null,
      promptDirection: challenge.promptDirection || null,
      selectedEntityIds: (evaluation.selectedStateIds || []).map((stateId) => `state:${stateId}`),
      missingEntityIds: (evaluation.missingStateIds || []).map((stateId) => `state:${stateId}`),
      unnecessaryEntityIds: (evaluation.unnecessaryStateIds || []).map((stateId) => `state:${stateId}`)
    }
  });
}

const reconstructionOutcomeByStatus = Object.freeze({
  "well-placed": "correct",
  close: "partial",
  misplaced: "incorrect",
  unplaced: "skipped"
});

export function adaptCanonicalMapReconstructionEvaluation({ evaluation = {}, eventIdPrefix, ...context } = {}) {
  const prefix = requireNonEmptyString(eventIdPrefix, "eventIdPrefix");
  return Object.entries(evaluation.placements || {}).map(([stateId, placement]) => {
    const outcome = reconstructionOutcomeByStatus[placement?.status];
    if (!outcome) throw new TypeError(`Unknown reconstruction placement status: ${String(placement?.status)}`);
    return createCanonicalEvidenceEvent({
      ...context,
      eventId: `${prefix}:${stateId}`,
      conceptId: `state-reconstruction:${stateId}`,
      skillId: "spatial-reconstruction",
      sourceActivityId: context.sourceActivityId || evaluation.regionId,
      outcome,
      response: {
        stateEntityId: `state:${stateId}`,
        placementStatus: placement.status,
        distanceRatio: Number.isFinite(Number(placement.distanceRatio)) ? Number(placement.distanceRatio) : null,
        vectorErrorRatio: Number.isFinite(Number(placement.vectorErrorRatio)) ? Number(placement.vectorErrorRatio) : null,
        adjacencyRatio: Number.isFinite(Number(placement.adjacencyRatio)) ? Number(placement.adjacencyRatio) : null
      }
    });
  });
}

export function createUnitedStatesStateConcepts(stateId, label) {
  const normalizedStateId = requireNonEmptyString(stateId, "stateId");
  const stateLabel = requireNonEmptyString(label, "label");
  return [
    createCanonicalConcept({
      id: `state-location:${normalizedStateId}`,
      kind: "state-location",
      label: `Locate ${stateLabel}`,
      entityIds: [`state:${normalizedStateId}`],
      taxonomyTags: ["political-geography"]
    }),
    createCanonicalConcept({
      id: `state-naming:${normalizedStateId}`,
      kind: "state-naming",
      label: `Identify ${stateLabel}`,
      entityIds: [`state:${normalizedStateId}`],
      taxonomyTags: ["political-geography"]
    }),
    createCanonicalConcept({
      id: `state-reconstruction:${normalizedStateId}`,
      kind: "state-reconstruction",
      label: `Reconstruct ${stateLabel}'s spatial placement`,
      entityIds: [`state:${normalizedStateId}`],
      taxonomyTags: ["regional-relationships"]
    })
  ];
}
