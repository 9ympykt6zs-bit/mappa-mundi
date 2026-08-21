import {
  demonstratedProgressCategory,
  renderBayesianProgressSegments,
  scoreBayesianEvidenceCounts
} from "./bayesian-progress-score.js";
import {
  createEmptyCanonicalEvidenceRepository,
  getAllCanonicalEvidenceEvents,
  getCanonicalEvidenceConceptSkillSummaries
} from "./canonical-learning-evidence-repository.js";
import {
  createUnitedStatesProgressReportCategory,
  UNITED_STATES_PROGRESS_REPORT_CATEGORY_DEFINITIONS,
  UNITED_STATES_PROGRESS_REPORT_DISPLAY_CATEGORY_LABELS
} from "./united-states-progress-report.js";

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function learnerDisplayCategory(score) {
  const category = demonstratedProgressCategory(score);
  return {
    ...category,
    label: UNITED_STATES_PROGRESS_REPORT_DISPLAY_CATEGORY_LABELS[category.id] || category.label
  };
}

function learnerProgressDisplay(score) {
  const display = renderBayesianProgressSegments(score);
  return {
    ...display,
    accessibleLabel: score === null ? "Not started" : `${Math.round(score * 100)}% progress`
  };
}

function itemLabel(item, itemsById) {
  if (item.type !== "capital") return item.label;
  const state = itemsById.get(item.relatedStateItemId);
  return state ? `${state.label} — ${item.label}` : item.label;
}

function canonicalTargetsForItemSkill(item, category, itemsById) {
  if (item.type === "state" && category.id === "state-locations") {
    return [{ conceptId: `state-location:${item.targetId}`, skillId: "locating" }];
  }
  if (item.type === "state" && category.id === "state-identification") {
    return [{ conceptId: `state-naming:${item.targetId}`, skillId: "identifying" }];
  }
  if (item.type === "capital" && category.id === "state-capitals") {
    const relatedState = itemsById.get(item.relatedStateItemId);
    const stateId = item.relatedStateTargetId || relatedState?.targetId;
    if (!stateId) return [];
    return [
      { conceptId: `capital-location:${stateId}:${item.targetId}`, skillId: "locating" },
      { conceptId: `capital-naming:${stateId}:${item.targetId}`, skillId: "identifying" }
    ];
  }
  return [];
}

function eventMatchesTargets(event, targets) {
  return targets.some(({ conceptId, skillId }) => event.conceptId === conceptId && event.skillId === skillId);
}

function summaryMatchesTargets(summary, targets) {
  return targets.some(({ conceptId, skillId }) => summary.conceptId === conceptId && summary.skillId === skillId);
}

function explanationForEvidence(correctCount, incorrectCount, score) {
  if (score === null) return "You haven't answered a retrieval question about this yet.";
  const correctLabel = `${correctCount} correct ${correctCount === 1 ? "response" : "responses"}`;
  const incorrectLabel = `${incorrectCount} ${incorrectCount === 1 ? "mistake" : "mistakes"}`;
  return incorrectCount === 0
    ? `${correctLabel} built your canonical shadow progress.`
    : `${correctLabel} and ${incorrectLabel} shape your canonical shadow progress.`;
}

function createShadowRecord({ item, category, itemsById, events, summaries }) {
  const targets = canonicalTargetsForItemSkill(item, category, itemsById);
  const matchingEvents = events
    .filter((event) => eventMatchesTargets(event, targets))
    .sort((left, right) => left.occurredAt.localeCompare(right.occurredAt)
      || Number(left.sequence ?? 0) - Number(right.sequence ?? 0)
      || left.eventId.localeCompare(right.eventId));
  const matchingSummaries = summaries.filter((summary) => summaryMatchesTargets(summary, targets));

  // Reducer summaries are the single scoring input. Raw events provide provenance only;
  // adding both would double-count every response.
  const correctCount = matchingSummaries.reduce((sum, summary) => sum + summary.correctCount, 0);
  const incorrectCount = matchingSummaries.reduce((sum, summary) => sum + summary.incorrectCount, 0);
  const assistedCount = matchingSummaries.reduce((sum, summary) => sum + summary.assistedCount, 0);
  const partialCount = matchingSummaries.reduce((sum, summary) => sum + summary.partialCount, 0);
  const skippedCount = matchingSummaries.reduce((sum, summary) => sum + summary.skippedCount, 0);
  const score = scoreBayesianEvidenceCounts(correctCount, incorrectCount);
  const displayCategory = learnerDisplayCategory(score);
  const sourceModes = [...new Set(matchingEvents.map(({ sourceMode }) => sourceMode))].sort();
  return {
    itemId: item.id,
    skillId: category.id,
    label: itemLabel(item, itemsById),
    bayesianProgressScore: score,
    displayCategory,
    display: learnerProgressDisplay(score),
    explanation: explanationForEvidence(correctCount, incorrectCount, score),
    evidenceHistory: {
      availability: matchingEvents.length ? "canonical-live-events" : "no-canonical-retrieval-evidence",
      correctCount,
      incorrectCount,
      assistedCount,
      partialCount,
      skippedCount,
      eventCount: matchingEvents.length,
      recentAttempts: clone(matchingEvents),
      latest: matchingEvents.length
        ? {
          availability: "observed",
          result: matchingEvents.at(-1).outcome,
          text: `Latest canonical event: ${matchingEvents.at(-1).outcome}.`
        }
        : { availability: "unavailable", result: null, text: "No canonical event is available." },
      sources: sourceModes.map((sourceMode) => ({ id: sourceMode, label: sourceMode })),
      note: "Bayesian inputs come from canonical concept × skill reducer summaries. Raw events are used only for provenance and are not added again."
    },
    canonicalMapping: {
      conceptIds: targets.map(({ conceptId }) => conceptId),
      skillIds: [...new Set(targets.map(({ skillId }) => skillId))]
    },
    unseen: score === null,
    knownStatus: score === null ? "unseen" : "known",
    reviewStatus: {
      id: "unavailable",
      label: "Not compared",
      explanation: "Canonical response evidence does not contain scheduler due-state fields."
    }
  };
}

export function createCanonicalUnitedStatesProgressReportShadow({ items = [], repository } = {}) {
  const inputSnapshot = JSON.stringify({ items, repository });
  const resolvedRepository = repository || createEmptyCanonicalEvidenceRepository();
  const safeItems = clone(items).filter((item) => ["state", "capital"].includes(item.type));
  const itemsById = new Map(safeItems.map((item) => [item.id, item]));
  const events = getAllCanonicalEvidenceEvents(resolvedRepository);
  const summaries = getCanonicalEvidenceConceptSkillSummaries(resolvedRepository);
  const categories = UNITED_STATES_PROGRESS_REPORT_CATEGORY_DEFINITIONS.map((definition) => {
    const records = safeItems
      .filter((item) => item.type === definition.itemType)
      .map((item) => createShadowRecord({ item, category: definition, itemsById, events, summaries }));
    return createUnitedStatesProgressReportCategory(definition, records);
  });
  const report = {
    schemaVersion: 1,
    kind: "united-states-demonstrated-progress-report-canonical-shadow",
    developerOnly: true,
    title: "Progress Report canonical shadow",
    scopeTitle: "United States",
    categories,
    scoringModel: {
      module: "src/bayesian-progress-score.js",
      function: "scoreBayesianEvidenceCounts"
    },
    scoringInputPolicy: "canonical concept-skill reducer summaries only; raw events are provenance only",
    limitations: [
      "Canonical events cover new emission only and do not reconstruct legacy history.",
      "Scheduler review status is unavailable from response evidence alone.",
      "The capital category intentionally combines canonical locating and identifying evidence to match the current item-level category."
    ]
  };
  if (JSON.stringify({ items, repository }) !== inputSnapshot) {
    throw new Error("Canonical Progress Report shadow mutated its inputs.");
  }
  return report;
}
