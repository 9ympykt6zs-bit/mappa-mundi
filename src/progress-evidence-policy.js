import { createCanonicalEvidenceEvent } from "./canonical-learning-evidence.js";

export const PROGRESS_EVIDENCE_POLICY_VERSION = 1;

export const USER_FACING_PROGRESS_SKILLS = Object.freeze({
  STATE_LOCATION: "state-location",
  STATE_IDENTIFICATION: "state-identification",
  CAPITAL_LOCATION: "capital-location",
  CAPITAL_IDENTIFICATION: "capital-identification",
  CAPITAL_OF_RELATIONSHIP: "capital-of-relationship",
  GEOGRAPHIC_RELATIONSHIPS: "geographic-relationships",
  SPATIAL_RECONSTRUCTION: "spatial-reconstruction",
  CONTEXTUAL_KNOWLEDGE: "contextual-knowledge"
});

export const PROGRESS_EVIDENCE_OUTCOME_POLICY = Object.freeze({
  correct: Object.freeze({
    treatment: "bayesian-positive",
    correctCount: 1,
    incorrectCount: 0,
    explanation: "A correct unassisted response is positive demonstrated-progress evidence."
  }),
  incorrect: Object.freeze({
    treatment: "bayesian-negative",
    correctCount: 0,
    incorrectCount: 1,
    explanation: "An incorrect retrieval response is negative demonstrated-progress evidence."
  }),
  assisted: Object.freeze({
    treatment: "exposure-only",
    correctCount: 0,
    incorrectCount: 0,
    explanation: "Assisted exposure is retained as provenance but is not successful demonstrated knowledge."
  }),
  partial: Object.freeze({
    treatment: "preserve-partial-unscored",
    correctCount: 0,
    incorrectCount: 0,
    explanation: "Partial evidence is preserved but excluded from the current correct/incorrect Bayesian inputs."
  }),
  skipped: Object.freeze({
    treatment: "non-scoring-skip",
    correctCount: 0,
    incorrectCount: 0,
    explanation: "A skipped opportunity is retained but is neither positive nor negative demonstrated evidence."
  })
});

function rule({
  id,
  progressSkillId,
  conceptPattern,
  canonicalSkillIds,
  validatedSourceModes,
  currentStatus = "supported"
}) {
  return Object.freeze({
    id,
    progressSkillId,
    conceptPattern,
    canonicalSkillIds: Object.freeze([...canonicalSkillIds]),
    validatedSourceModes: Object.freeze([...validatedSourceModes]),
    sourceModePolicy: "provenance-not-skill-identity",
    currentStatus
  });
}

export const PROGRESS_EVIDENCE_RULES = Object.freeze([
  rule({
    id: "state-location-retrieval",
    progressSkillId: USER_FACING_PROGRESS_SKILLS.STATE_LOCATION,
    conceptPattern: /^state-location:[^:]+$/,
    canonicalSkillIds: ["locating"],
    validatedSourceModes: ["journey", "us-memory-trail", "daily-trail"]
  }),
  rule({
    id: "state-identification-retrieval",
    progressSkillId: USER_FACING_PROGRESS_SKILLS.STATE_IDENTIFICATION,
    conceptPattern: /^state-naming:[^:]+$/,
    canonicalSkillIds: ["identifying"],
    validatedSourceModes: ["us-memory-trail", "daily-trail"]
  }),
  rule({
    id: "capital-location-retrieval",
    progressSkillId: USER_FACING_PROGRESS_SKILLS.CAPITAL_LOCATION,
    conceptPattern: /^capital-location:[^:]+:[^:]+$/,
    canonicalSkillIds: ["locating"],
    validatedSourceModes: ["us-memory-trail", "daily-trail"]
  }),
  rule({
    id: "capital-identification-retrieval",
    progressSkillId: USER_FACING_PROGRESS_SKILLS.CAPITAL_IDENTIFICATION,
    conceptPattern: /^capital-naming:[^:]+:[^:]+$/,
    canonicalSkillIds: ["identifying"],
    validatedSourceModes: ["us-memory-trail", "daily-trail"]
  }),
  rule({
    id: "state-capital-relationship-recall",
    progressSkillId: USER_FACING_PROGRESS_SKILLS.CAPITAL_OF_RELATIONSHIP,
    conceptPattern: /^state-capital:[^:]+:[^:]+$/,
    canonicalSkillIds: ["relationship-recall"],
    validatedSourceModes: [],
    currentStatus: "policy-defined-no-live-emitter"
  }),
  rule({
    id: "geographic-relationship-recall",
    progressSkillId: USER_FACING_PROGRESS_SKILLS.GEOGRAPHIC_RELATIONSHIPS,
    conceptPattern: /^relationship:/,
    canonicalSkillIds: ["relationship-recall", "sequencing"],
    validatedSourceModes: ["mental-map"]
  }),
  rule({
    id: "spatial-reconstruction",
    progressSkillId: USER_FACING_PROGRESS_SKILLS.SPATIAL_RECONSTRUCTION,
    conceptPattern: /^state-reconstruction:[^:]+$/,
    canonicalSkillIds: ["spatial-reconstruction"],
    validatedSourceModes: ["map-reconstruction"]
  })
]);

export const PROGRESS_REPORT_ROLLUP_POLICIES = Object.freeze({
  "state-capitals": Object.freeze({
    userFacingCategoryId: "state-capitals",
    includedProgressSkillIds: Object.freeze([
      USER_FACING_PROGRESS_SKILLS.CAPITAL_LOCATION,
      USER_FACING_PROGRESS_SKILLS.CAPITAL_IDENTIFICATION
    ]),
    excludedProgressSkillIds: Object.freeze([
      USER_FACING_PROGRESS_SKILLS.CAPITAL_OF_RELATIONSHIP
    ]),
    aggregation: "sum-correct-and-incorrect-once-per-event-then-use-existing-bayesian-model",
    explanation: "The current single State Capitals category temporarily combines capital locating and naming retrieval. Capital-of relationship evidence remains a distinct history and is not silently pooled."
  })
});

export const PROGRESS_EVIDENCE_POLICY_GAPS = Object.freeze({
  contextualKnowledge: Object.freeze({
    progressSkillId: USER_FACING_PROGRESS_SKILLS.CONTEXTUAL_KNOWLEDGE,
    status: "unsupported-by-canonical-contract-v1",
    reason: "Canonical v1 has no contextual-recall skill and evidence events do not carry approved U.S. content-taxonomy tags.",
    migrationRequirement: "Add an explicit contextual concept/skill contract and taxonomy-qualified emitter before contextual evidence can affect progress."
  }),
  partialBayesianCredit: Object.freeze({
    status: "unsupported-by-current-bayesian-input",
    reason: "The current demonstrated-progress model accepts correct and incorrect counts, not fractional credit.",
    temporaryTreatment: "Preserve partial events and credit metadata; exclude them from Bayesian counts rather than converting them to correct or incorrect."
  })
});

function matchingRules(event) {
  return PROGRESS_EVIDENCE_RULES.filter((candidate) => (
    candidate.conceptPattern.test(event.conceptId)
    && candidate.canonicalSkillIds.includes(event.skillId)
  ));
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

export function classifyCanonicalProgressEvidence(inputEvent) {
  const event = createCanonicalEvidenceEvent(inputEvent);
  const matches = matchingRules(event);
  if (matches.length > 1) {
    throw new Error(`Progress evidence policy is ambiguous for event ${event.eventId}.`);
  }
  if (matches.length === 0) {
    return {
      eventId: event.eventId,
      included: false,
      reason: "no-progress-policy-rule",
      explanation: "The canonical concept × skill pair is not approved for a user-facing progress skill.",
      sourceMode: event.sourceMode,
      sourceActivityId: event.sourceActivityId || null,
      contributions: []
    };
  }

  const matchedRule = matches[0];
  const outcomePolicy = PROGRESS_EVIDENCE_OUTCOME_POLICY[event.outcome];
  const sourceModeValidated = matchedRule.validatedSourceModes.includes(event.sourceMode);
  return {
    eventId: event.eventId,
    included: true,
    ruleId: matchedRule.id,
    sourceMode: event.sourceMode,
    sourceActivityId: event.sourceActivityId || null,
    sourceModeValidated,
    sourceValidation: sourceModeValidated ? "validated-current-producer" : "semantically-valid-unvalidated-producer",
    contributions: [{
      eventId: event.eventId,
      historyKey: `${matchedRule.progressSkillId}\u0000${event.conceptId}`,
      progressSkillId: matchedRule.progressSkillId,
      conceptId: event.conceptId,
      canonicalSkillId: event.skillId,
      outcome: event.outcome,
      treatment: outcomePolicy.treatment,
      correctCount: outcomePolicy.correctCount,
      incorrectCount: outcomePolicy.incorrectCount,
      partialCredit: event.outcome === "partial" ? clone(event.credit || null) : null,
      explanation: outcomePolicy.explanation
    }]
  };
}

function compareEvents(left, right) {
  return left.occurredAt.localeCompare(right.occurredAt)
    || Number(left.sequence ?? 0) - Number(right.sequence ?? 0)
    || left.eventId.localeCompare(right.eventId);
}

export function applyProgressEvidencePolicy(inputEvents = []) {
  if (!Array.isArray(inputEvents)) throw new TypeError("Progress evidence policy input must be an array.");
  const byEventId = new Map();
  const duplicateEventIds = [];
  inputEvents.forEach((inputEvent) => {
    const event = createCanonicalEvidenceEvent(inputEvent);
    const existing = byEventId.get(event.eventId);
    if (existing) {
      if (JSON.stringify(existing) !== JSON.stringify(event)) {
        throw new Error(`Progress evidence event ID collision: ${event.eventId}`);
      }
      duplicateEventIds.push(event.eventId);
      return;
    }
    byEventId.set(event.eventId, event);
  });

  const events = [...byEventId.values()].sort(compareEvents);
  const decisions = events.map(classifyCanonicalProgressEvidence);
  const contributions = decisions.flatMap((decision) => decision.contributions);
  const historiesByKey = new Map();
  contributions.forEach((contribution) => {
    const history = historiesByKey.get(contribution.historyKey) || {
      historyKey: contribution.historyKey,
      progressSkillId: contribution.progressSkillId,
      conceptId: contribution.conceptId,
      eventIds: [],
      correctCount: 0,
      incorrectCount: 0,
      assistedCount: 0,
      partialCount: 0,
      skippedCount: 0
    };
    history.eventIds.push(contribution.eventId);
    history.correctCount += contribution.correctCount;
    history.incorrectCount += contribution.incorrectCount;
    if (contribution.outcome === "assisted") history.assistedCount += 1;
    if (contribution.outcome === "partial") history.partialCount += 1;
    if (contribution.outcome === "skipped") history.skippedCount += 1;
    historiesByKey.set(contribution.historyKey, history);
  });

  return {
    policyVersion: PROGRESS_EVIDENCE_POLICY_VERSION,
    uniqueEventCount: events.length,
    duplicateEventIds,
    decisions,
    histories: [...historiesByKey.values()].sort((left, right) => left.historyKey.localeCompare(right.historyKey))
  };
}
