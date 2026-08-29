import {
  demonstratedProgressCategory,
  renderBayesianProgressSegments,
  scoreBayesianEvidenceCounts
} from "./bayesian-progress-score.js";
import {
  createEmptyCanonicalEvidenceRepository,
  getAllCanonicalEvidenceEvents
} from "./canonical-learning-evidence-repository.js";
import { applyProgressEvidencePolicy } from "./progress-evidence-policy.js?v=20260829-physical-evidence-1";

const demonstratedCategoryIds = new Set(["demonstrated", "strong-evidence"]);

export const PROGRESS_REPORT_DISPLAY_CATEGORY_LABELS = Object.freeze({
  unseen: "Not started",
  "early-evidence": "Building",
  demonstrated: "Going well",
  "strong-evidence": "Strong",
  "needs-review": "Needs review"
});

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

export function createProgressReportDisplayCategory(category) {
  return {
    ...category,
    label: PROGRESS_REPORT_DISPLAY_CATEGORY_LABELS[category.id] || category.label
  };
}

export function createProgressReportDisplay(score) {
  const display = renderBayesianProgressSegments(score);
  return {
    ...display,
    accessibleLabel: score === null ? "Not started" : `${Math.round(score * 100)}% progress`
  };
}

export function createProgressReportEvidenceExplanation(correctCount, incorrectCount, score) {
  if (score === null) return "You haven't answered a question about this yet.";
  const responseLabel = `${correctCount} correct ${correctCount === 1 ? "response" : "responses"}`;
  const missLabel = `${incorrectCount} ${incorrectCount === 1 ? "mistake" : "mistakes"}`;
  return incorrectCount === 0
    ? `${responseLabel} built your progress. More correct answers can build your confidence further.`
    : `${responseLabel} and ${missLabel} shape your progress. Mistakes can lower it, but they do not erase what you have already shown.`;
}

export function createProgressReportCategory(definition, records) {
  const attempted = records.filter((record) => record.bayesianProgressScore !== null);
  const aggregateScore = attempted.length === 0
    ? null
    : Number((records.reduce((sum, record) => sum + (record.bayesianProgressScore || 0), 0) / records.length).toFixed(6));
  const demonstratedCount = records.filter((record) => demonstratedCategoryIds.has(record.displayCategory.id)).length;
  const baseDisplayCategory = createProgressReportDisplayCategory(demonstratedProgressCategory(aggregateScore));
  const displayCategory = demonstratedCount > 0 && records.length > attempted.length && baseDisplayCategory.id === "needs-review"
    ? { id: "early-evidence", label: PROGRESS_REPORT_DISPLAY_CATEGORY_LABELS["early-evidence"] }
    : baseDisplayCategory;
  return {
    id: definition.id,
    label: definition.label,
    totalPossible: records.length,
    attemptedCount: attempted.length,
    unseenCount: records.length - attempted.length,
    demonstratedCount,
    bayesianProgressScore: aggregateScore,
    displayCategory,
    display: createProgressReportDisplay(aggregateScore),
    summary: attempted.length === 0
      ? `0 of ${records.length} showing progress · not started`
      : `${demonstratedCount} of ${records.length} showing progress`,
    records: [...records].sort((left, right) => left.label.localeCompare(right.label))
  };
}

function compareEvents(left, right) {
  return left.occurredAt.localeCompare(right.occurredAt)
    || Number(left.sequence ?? 0) - Number(right.sequence ?? 0)
    || left.eventId.localeCompare(right.eventId);
}

function defaultReviewStatus() {
  return {
    id: "unavailable",
    label: "Practice schedule unavailable",
    explanation: "This activity does not use a shared cross-mode review scheduler."
  };
}

function createCanonicalRecord({ item, definition, mappings, policyResult, eventsById, baseRecord }) {
  const histories = mappings
    .map(({ historyKey }) => policyResult.histories.find((history) => history.historyKey === historyKey))
    .filter(Boolean);
  const events = [...new Set(histories.flatMap((history) => history.eventIds))]
    .map((eventId) => eventsById.get(eventId))
    .filter(Boolean)
    .sort(compareEvents);
  const sum = (field) => histories.reduce((total, history) => total + history[field], 0);
  const correctCount = sum("correctCount");
  const incorrectCount = sum("incorrectCount");
  const score = scoreBayesianEvidenceCounts(correctCount, incorrectCount);
  const sourceModes = [...new Set(events.map(({ sourceMode }) => sourceMode))].sort();
  return {
    ...(baseRecord ? clone(baseRecord) : {}),
    itemId: item.id,
    skillId: definition.id,
    label: item.label || item.name || item.id,
    bayesianProgressScore: score,
    displayCategory: createProgressReportDisplayCategory(demonstratedProgressCategory(score)),
    display: createProgressReportDisplay(score),
    explanation: createProgressReportEvidenceExplanation(correctCount, incorrectCount, score),
    evidenceHistory: {
      availability: events.length ? "canonical-live-events" : "no-canonical-retrieval-evidence",
      correctCount,
      incorrectCount,
      assistedCount: sum("assistedCount"),
      partialCount: sum("partialCount"),
      skippedCount: sum("skippedCount"),
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
      progressSkillIds: [...new Set(mappings.map(({ progressSkillId }) => progressSkillId))]
    },
    unseen: score === null,
    knownStatus: score === null ? "unseen" : "known",
    reviewStatus: clone(baseRecord?.reviewStatus || defaultReviewStatus())
  };
}

export function createCanonicalProgressReport({
  kind = "canonical-demonstrated-progress-report",
  title = "Progress Report",
  scopeTitle = "Geography",
  sectionTitle = "What you know",
  subtitle = "Your progress is based on the answers you've given across Mappa Mundi.",
  howProgressWorks = [],
  dataSources = [],
  items = [],
  categoryDefinitions = [],
  repository,
  baseReport = null
} = {}) {
  const inputSnapshot = JSON.stringify({ items, categoryDefinitions, repository, baseReport });
  const resolvedRepository = repository || createEmptyCanonicalEvidenceRepository();
  const events = getAllCanonicalEvidenceEvents(resolvedRepository);
  const eventsById = new Map(events.map((event) => [event.eventId, event]));
  const policyResult = applyProgressEvidencePolicy(events);
  const baseCategories = new Map((baseReport?.categories || []).map((category) => [category.id, category]));
  const categories = categoryDefinitions.map((definition) => {
    const baseRecords = new Map((baseCategories.get(definition.id)?.records || []).map((record) => [record.itemId, record]));
    const records = items
      .filter((item) => !definition.itemType || item.type === definition.itemType)
      .map((item) => createCanonicalRecord({
        item,
        definition,
        mappings: definition.getMappings(item),
        policyResult,
        eventsById,
        baseRecord: baseRecords.get(item.id)
      }));
    return createProgressReportCategory(definition, records);
  });
  const report = {
    ...(baseReport ? clone(baseReport) : {}),
    schemaVersion: 1,
    kind,
    title,
    scopeTitle,
    sectionTitle,
    subtitle,
    howProgressWorks: clone(howProgressWorks),
    categories,
    dataSources: clone(dataSources),
    readPath: {
      id: "canonical-first",
      policyVersion: policyResult.policyVersion,
      canonicalEventCount: policyResult.uniqueEventCount,
      duplicateEventIds: clone(policyResult.duplicateEventIds),
      supportedCategoryIds: categoryDefinitions.map(({ id }) => id)
    }
  };
  if (JSON.stringify({ items, categoryDefinitions, repository, baseReport }) !== inputSnapshot) {
    throw new Error("Canonical Progress Report mutated its inputs.");
  }
  return report;
}
