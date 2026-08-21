import {
  demonstratedProgressCategory,
  scoreBayesianEvidenceCounts
} from "./bayesian-progress-score.js";
import {
  createEmptyCanonicalEvidenceRepository,
  getAllCanonicalEvidenceEvents
} from "./canonical-learning-evidence-repository.js";
import {
  applyProgressEvidencePolicy,
  PROGRESS_REPORT_ROLLUP_POLICIES,
  USER_FACING_PROGRESS_SKILLS
} from "./progress-evidence-policy.js";
import {
  createUnitedStatesProgressReport,
  createUnitedStatesProgressReportCategory,
  createUnitedStatesProgressReportDisplay,
  createUnitedStatesProgressReportDisplayCategory,
  createUnitedStatesProgressReportEvidenceExplanation,
  UNITED_STATES_PROGRESS_REPORT_CATEGORY_DEFINITIONS
} from "./united-states-progress-report.js";

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function itemLabel(item, itemsById) {
  if (item.type !== "capital") return item.label;
  const state = itemsById.get(item.relatedStateItemId);
  return state ? `${state.label} — ${item.label}` : item.label;
}

function approvedHistoryKeys(item, category, itemsById) {
  if (item.type === "state" && category.id === "state-locations") {
    return [{
      historyKey: `${USER_FACING_PROGRESS_SKILLS.STATE_LOCATION}\u0000state-location:${item.targetId}`,
      conceptId: `state-location:${item.targetId}`,
      canonicalSkillId: "locating",
      progressSkillId: USER_FACING_PROGRESS_SKILLS.STATE_LOCATION
    }];
  }
  if (item.type === "state" && category.id === "state-identification") {
    return [{
      historyKey: `${USER_FACING_PROGRESS_SKILLS.STATE_IDENTIFICATION}\u0000state-naming:${item.targetId}`,
      conceptId: `state-naming:${item.targetId}`,
      canonicalSkillId: "identifying",
      progressSkillId: USER_FACING_PROGRESS_SKILLS.STATE_IDENTIFICATION
    }];
  }
  if (item.type === "capital" && category.id === "state-capitals") {
    const state = itemsById.get(item.relatedStateItemId);
    const stateId = item.relatedStateTargetId || state?.targetId;
    if (!stateId) return [];
    return [
      {
        historyKey: `${USER_FACING_PROGRESS_SKILLS.CAPITAL_LOCATION}\u0000capital-location:${stateId}:${item.targetId}`,
        conceptId: `capital-location:${stateId}:${item.targetId}`,
        canonicalSkillId: "locating",
        progressSkillId: USER_FACING_PROGRESS_SKILLS.CAPITAL_LOCATION
      },
      {
        historyKey: `${USER_FACING_PROGRESS_SKILLS.CAPITAL_IDENTIFICATION}\u0000capital-naming:${stateId}:${item.targetId}`,
        conceptId: `capital-naming:${stateId}:${item.targetId}`,
        canonicalSkillId: "identifying",
        progressSkillId: USER_FACING_PROGRESS_SKILLS.CAPITAL_IDENTIFICATION
      }
    ];
  }
  return [];
}

function compareEvents(left, right) {
  return left.occurredAt.localeCompare(right.occurredAt)
    || Number(left.sequence ?? 0) - Number(right.sequence ?? 0)
    || left.eventId.localeCompare(right.eventId);
}

function createCanonicalRecord({ item, category, itemsById, policyResult, eventsById, baseRecord }) {
  const mappings = approvedHistoryKeys(item, category, itemsById);
  const histories = mappings
    .map(({ historyKey }) => policyResult.histories.find((history) => history.historyKey === historyKey))
    .filter(Boolean);
  const eventIds = [...new Set(histories.flatMap((history) => history.eventIds))];
  const events = eventIds.map((eventId) => eventsById.get(eventId)).filter(Boolean).sort(compareEvents);
  const correctCount = histories.reduce((sum, history) => sum + history.correctCount, 0);
  const incorrectCount = histories.reduce((sum, history) => sum + history.incorrectCount, 0);
  const assistedCount = histories.reduce((sum, history) => sum + history.assistedCount, 0);
  const partialCount = histories.reduce((sum, history) => sum + history.partialCount, 0);
  const skippedCount = histories.reduce((sum, history) => sum + history.skippedCount, 0);
  const score = scoreBayesianEvidenceCounts(correctCount, incorrectCount);
  const sourceModes = [...new Set(events.map(({ sourceMode }) => sourceMode))].sort();
  return {
    ...clone(baseRecord),
    itemId: item.id,
    skillId: category.id,
    label: itemLabel(item, itemsById),
    bayesianProgressScore: score,
    displayCategory: createUnitedStatesProgressReportDisplayCategory(demonstratedProgressCategory(score)),
    display: createUnitedStatesProgressReportDisplay(score),
    explanation: createUnitedStatesProgressReportEvidenceExplanation(correctCount, incorrectCount, score),
    evidenceHistory: {
      availability: events.length ? "canonical-live-events" : "no-canonical-retrieval-evidence",
      correctCount,
      incorrectCount,
      assistedCount,
      partialCount,
      skippedCount,
      eventCount: events.length,
      recentAttempts: clone(events),
      latest: events.length
        ? { availability: "observed", result: events.at(-1).outcome, text: `Latest canonical event: ${events.at(-1).outcome}.` }
        : { availability: "unavailable", result: null, text: "No canonical event is available." },
      sources: sourceModes.map((sourceMode) => ({ id: sourceMode, label: sourceMode })),
      note: "Progress Evidence Policy histories are the sole Bayesian input; raw events provide provenance and are not counted again."
    },
    canonicalMapping: {
      conceptIds: mappings.map(({ conceptId }) => conceptId),
      canonicalSkillIds: [...new Set(mappings.map(({ canonicalSkillId }) => canonicalSkillId))],
      progressSkillIds: mappings.map(({ progressSkillId }) => progressSkillId)
    },
    unseen: score === null,
    knownStatus: score === null ? "unseen" : "known",
    reviewStatus: clone(baseRecord.reviewStatus)
  };
}

export function createCanonicalUnitedStatesProgressReport({
  items = [],
  repository,
  legacyPresentationReport
} = {}) {
  const inputSnapshot = JSON.stringify({ items, repository, legacyPresentationReport });
  const resolvedRepository = repository || createEmptyCanonicalEvidenceRepository();
  const safeItems = clone(items).filter((item) => ["state", "capital"].includes(item.type));
  const itemsById = new Map(safeItems.map((item) => [item.id, item]));
  const emptyPresentation = createUnitedStatesProgressReport({ items: safeItems });
  const baseReport = legacyPresentationReport ? clone(legacyPresentationReport) : emptyPresentation;
  const events = getAllCanonicalEvidenceEvents(resolvedRepository);
  const eventsById = new Map(events.map((event) => [event.eventId, event]));
  const policyResult = applyProgressEvidencePolicy(events);
  const baseCategories = new Map(baseReport.categories.map((category) => [category.id, category]));
  const emptyCategories = new Map(emptyPresentation.categories.map((category) => [category.id, category]));
  const canonicalCategories = UNITED_STATES_PROGRESS_REPORT_CATEGORY_DEFINITIONS.map((definition) => {
    const baseRecords = new Map((baseCategories.get(definition.id)?.records || []).map((record) => [record.itemId, record]));
    const emptyRecords = new Map((emptyCategories.get(definition.id)?.records || []).map((record) => [record.itemId, record]));
    const records = safeItems
      .filter((item) => item.type === definition.itemType)
      .map((item) => createCanonicalRecord({
        item,
        category: definition,
        itemsById,
        policyResult,
        eventsById,
        baseRecord: baseRecords.get(item.id) || emptyRecords.get(item.id)
      }));
    return createUnitedStatesProgressReportCategory(definition, records);
  });
  const supportedCategoryIds = new Set(UNITED_STATES_PROGRESS_REPORT_CATEGORY_DEFINITIONS.map(({ id }) => id));
  const categories = [
    ...canonicalCategories,
    ...baseReport.categories.filter(({ id }) => !supportedCategoryIds.has(id)).map(clone)
  ];
  const report = {
    ...baseReport,
    schemaVersion: 1,
    kind: "united-states-demonstrated-progress-report-canonical-first",
    categories,
    dataSources: [
      "Canonical evidence routed through Progress Evidence Policy v1",
      "Existing scheduler status shown separately from demonstrated progress when available"
    ],
    readPath: {
      id: "canonical-first",
      policyVersion: policyResult.policyVersion,
      canonicalEventCount: policyResult.uniqueEventCount,
      duplicateEventIds: clone(policyResult.duplicateEventIds),
      supportedCategoryIds: ["state-locations", "state-identification", "state-capitals"],
      capitalRollup: clone(PROGRESS_REPORT_ROLLUP_POLICIES["state-capitals"])
    }
  };
  if (JSON.stringify({ items, repository, legacyPresentationReport }) !== inputSnapshot) {
    throw new Error("Canonical Progress Report adapter mutated its inputs.");
  }
  return report;
}

export function createCanonicalUnitedStatesProgressReportShadow(options = {}) {
  const report = createCanonicalUnitedStatesProgressReport(options);
  return {
    ...report,
    kind: "united-states-demonstrated-progress-report-canonical-shadow",
    developerOnly: true,
    scoringModel: {
      module: "src/bayesian-progress-score.js",
      function: "scoreBayesianEvidenceCounts"
    },
    scoringInputPolicy: "Progress Evidence Policy histories only; raw events are provenance only",
    limitations: [
      "Canonical events cover new emission only and do not reconstruct legacy history.",
      "Scheduler review status remains source-specific and separate from canonical demonstrated progress.",
      "The current State Capitals rollup includes capital locating and identifying, not capital-of relationship evidence."
    ]
  };
}
