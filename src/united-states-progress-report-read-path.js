import { CANONICAL_LEARNING_SCHEMA_VERSION } from "./canonical-learning-evidence.js";
import { createCanonicalUnitedStatesProgressReport } from "./canonical-progress-report-shadow.js";
import { PROGRESS_EVIDENCE_POLICY_VERSION } from "./progress-evidence-policy.js";
import { createUnitedStatesProgressReport } from "./united-states-progress-report.js";

export const CANONICAL_PROGRESS_REPORT_COHORT_STORAGE_KEY = "mappaProgressReportCanonicalCohort";
export const CANONICAL_PROGRESS_REPORT_COHORT_VERSION = 1;

const healthyRepositoryStatusCodes = new Set(["empty", "ready"]);
const supportedCategoryIds = Object.freeze(["state-locations", "state-identification", "state-capitals"]);

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function resolveStorage(storage) {
  if (storage !== undefined) return storage;
  try {
    return globalThis.localStorage;
  } catch {
    return null;
  }
}

function count(value) {
  return Math.max(0, Number(value) || 0);
}

function progressRecordHasEvidence(progress = {}) {
  return count(progress.correctCount) > 0
    || count(progress.missCount) > 0
    || count(progress.timesSeen) > 0;
}

function progressRecordIsAmbiguous(progress = {}) {
  return Object.keys(progress).length > 0
    && !progressRecordHasEvidence(progress);
}

function stateHasLifecycleHistory(state = {}) {
  return Boolean(
    state.hasStarted
    || state.pathCompleted
    || state.activeSession
    || state.lastSessionSummary
    || count(state.currentSessionNumber) > 1
    || count(state.sessionsSinceLastCheckpoint) > 0
    || (state.introducedItemIds || []).length > 0
    || (state.newSinceLastCheckpoint || []).length > 0
    || (state.completedGoalIds || []).length > 0
    || state.activeTrailGoal && state.activeTrailGoal !== "world-core"
    || state.lastDailyTrailSessionDate
    || state.lastContinentsOceansSmallReviewDate
    || state.lastContinentsOceansFullReviewDate
    || state.pendingRemediation
    || state.pendingCheckpointRetry
  );
}

export function auditLegacyProgressReportHistory({
  unitedStatesMemoryTrailState = {},
  dailyTrailState = {},
  placeMasteryState = {}
} = {}) {
  const reasons = [];
  const ambiguousReasons = [];
  const inspectPlanner = (sourceId, state) => {
    const entries = Object.entries(state?.itemProgress || {});
    if (entries.some(([, progress]) => progressRecordHasEvidence(progress))) {
      reasons.push(`${sourceId}-evidence-counters`);
    }
    if (entries.some(([, progress]) => progressRecordIsAmbiguous(progress))) {
      ambiguousReasons.push(`${sourceId}-ambiguous-item-progress`);
    }
    if (stateHasLifecycleHistory(state) && entries.every(([, progress]) => !progressRecordHasEvidence(progress))) {
      ambiguousReasons.push(`${sourceId}-lifecycle-without-attributable-counters`);
    }
  };
  inspectPlanner("us-memory-trail", unitedStatesMemoryTrailState);
  inspectPlanner("daily-trail", dailyTrailState);

  const placeSignals = Object.values(placeMasteryState?.places || {})
    .flatMap((place) => Object.values(place?.signals || {}));
  if (placeSignals.some((signal) => count(signal.attempts) > 0 || count(signal.correct) > 0 || count(signal.incorrect) > 0)) {
    reasons.push("place-mastery-signal-evidence");
  }
  if (placeSignals.some((signal) => count(signal.attempts) !== count(signal.correct) + count(signal.incorrect))) {
    ambiguousReasons.push("place-mastery-ambiguous-attempt-total");
  }
  if (placeSignals.some((signal) => signal && typeof signal === "object" && !progressRecordHasEvidence(signal))) {
    ambiguousReasons.push("place-mastery-zero-count-signal");
  }

  return {
    status: reasons.length > 0 ? "legacy-history" : ambiguousReasons.length > 0 ? "ambiguous" : "clean",
    hasLegacyHistory: reasons.length > 0,
    ambiguous: ambiguousReasons.length > 0,
    reasons: [...new Set(reasons)].sort(),
    ambiguousReasons: [...new Set(ambiguousReasons)].sort()
  };
}

export function loadCanonicalProgressReportCohort(storage) {
  const resolvedStorage = resolveStorage(storage);
  if (!resolvedStorage || typeof resolvedStorage.getItem !== "function") {
    return { status: "storage-unavailable", marker: null };
  }
  let raw;
  try {
    raw = resolvedStorage.getItem(CANONICAL_PROGRESS_REPORT_COHORT_STORAGE_KEY);
  } catch {
    return { status: "storage-read-error", marker: null };
  }
  if (raw === null) return { status: "missing", marker: null };
  let marker;
  try {
    marker = JSON.parse(raw);
  } catch {
    return { status: "invalid", marker: null };
  }
  const valid = marker
    && marker.version === CANONICAL_PROGRESS_REPORT_COHORT_VERSION
    && marker.policyVersion === PROGRESS_EVIDENCE_POLICY_VERSION
    && marker.evidenceSchemaVersion === CANONICAL_LEARNING_SCHEMA_VERSION
    && typeof marker.enrolledAt === "string"
    && Number.isFinite(Date.parse(marker.enrolledAt));
  return valid ? { status: "enrolled", marker: clone(marker) } : { status: "invalid", marker: null };
}

export function enrollCanonicalProgressReportCohort({
  storage,
  repository,
  now = () => new Date()
} = {}) {
  const resolvedStorage = resolveStorage(storage);
  if (!resolvedStorage || typeof resolvedStorage.setItem !== "function") return { ok: false, status: "storage-unavailable", marker: null };
  const date = new Date(typeof now === "function" ? now() : now);
  if (!Number.isFinite(date.getTime())) return { ok: false, status: "invalid-time", marker: null };
  const marker = {
    version: CANONICAL_PROGRESS_REPORT_COHORT_VERSION,
    policyVersion: PROGRESS_EVIDENCE_POLICY_VERSION,
    evidenceSchemaVersion: CANONICAL_LEARNING_SCHEMA_VERSION,
    enrolledAt: date.toISOString(),
    repositoryEventCountAtEnrollment: Array.isArray(repository?.events) ? repository.events.length : 0
  };
  try {
    resolvedStorage.setItem(CANONICAL_PROGRESS_REPORT_COHORT_STORAGE_KEY, JSON.stringify(marker));
    return { ok: true, status: "enrolled", marker: clone(marker) };
  } catch {
    return { ok: false, status: "storage-write-error", marker: null };
  }
}

export function resetCanonicalProgressReportCohort(storage) {
  const resolvedStorage = resolveStorage(storage);
  if (!resolvedStorage || typeof resolvedStorage.removeItem !== "function") {
    return { ok: false, status: "storage-unavailable" };
  }
  try {
    resolvedStorage.removeItem(CANONICAL_PROGRESS_REPORT_COHORT_STORAGE_KEY);
    return { ok: true, status: "reset" };
  } catch {
    return { ok: false, status: "storage-write-error" };
  }
}

function reportRecordMap(report) {
  return new Map(report.categories
    .filter(({ id }) => supportedCategoryIds.includes(id))
    .flatMap((category) => category.records.map((record) => [`${category.id}\u0000${record.itemId}`, { category, record }])));
}

function scoredCounts(record) {
  return {
    correct: count(record?.evidenceHistory?.correctCount),
    incorrect: count(record?.evidenceHistory?.incorrectCount)
  };
}

function equalScoredView(legacyRecord, canonicalRecord) {
  return legacyRecord.bayesianProgressScore === canonicalRecord.bayesianProgressScore
    && legacyRecord.displayCategory.id === canonicalRecord.displayCategory.id
    && (legacyRecord.bayesianProgressScore === null) === (canonicalRecord.bayesianProgressScore === null);
}

function isCombinedStateLegacyRecord(record) {
  return /combines location and identification/i.test(record?.evidenceHistory?.note || "");
}

function classifyRecordComparison({ key, legacyEntry, canonicalEntry, maps, strict }) {
  const legacyRecord = legacyEntry.record;
  const canonicalRecord = canonicalEntry.record;
  const legacyCounts = scoredCounts(legacyRecord);
  const canonicalCounts = scoredCounts(canonicalRecord);
  const countsEqual = legacyCounts.correct === canonicalCounts.correct
    && legacyCounts.incorrect === canonicalCounts.incorrect;
  if (countsEqual && equalScoredView(legacyRecord, canonicalRecord)) return "exact match";
  if (equalScoredView(legacyRecord, canonicalRecord)) return "semantically equivalent";

  const [categoryId, itemId] = key.split("\u0000");
  const legacyHasEvidence = legacyCounts.correct + legacyCounts.incorrect > 0;
  const canonicalHasEvidence = canonicalCounts.correct + canonicalCounts.incorrect > 0;
  if (!strict && legacyHasEvidence && !canonicalHasEvidence) return "unavailable/not comparable";
  if (!legacyHasEvidence && canonicalHasEvidence) return "intentional difference";

  if (["state-locations", "state-identification"].includes(categoryId) && isCombinedStateLegacyRecord(legacyRecord)) {
    const otherCategoryId = categoryId === "state-locations" ? "state-identification" : "state-locations";
    const otherCanonical = maps.canonical.get(`${otherCategoryId}\u0000${itemId}`)?.record;
    const otherCounts = scoredCounts(otherCanonical);
    const combinedCanonical = {
      correct: canonicalCounts.correct + otherCounts.correct,
      incorrect: canonicalCounts.incorrect + otherCounts.incorrect
    };
    if (strict && (combinedCanonical.correct < legacyCounts.correct || combinedCanonical.incorrect < legacyCounts.incorrect)) {
      return "defect";
    }
    return "intentional difference";
  }

  if (strict && (canonicalCounts.correct < legacyCounts.correct || canonicalCounts.incorrect < legacyCounts.incorrect)) {
    return "defect";
  }
  return "intentional difference";
}

export function compareProgressReportReadModels({ legacyReport, canonicalReport, strict = false } = {}) {
  const maps = { legacy: reportRecordMap(legacyReport), canonical: reportRecordMap(canonicalReport) };
  const cases = [...maps.legacy.entries()].map(([key, legacyEntry]) => {
    const canonicalEntry = maps.canonical.get(key);
    const classification = canonicalEntry
      ? classifyRecordComparison({ key, legacyEntry, canonicalEntry, maps, strict })
      : "defect";
    return {
      key,
      categoryId: legacyEntry.category.id,
      itemId: legacyEntry.record.itemId,
      legacy: {
        score: legacyEntry.record.bayesianProgressScore,
        displayCategoryId: legacyEntry.record.displayCategory.id,
        ...scoredCounts(legacyEntry.record)
      },
      canonical: canonicalEntry ? {
        score: canonicalEntry.record.bayesianProgressScore,
        displayCategoryId: canonicalEntry.record.displayCategory.id,
        ...scoredCounts(canonicalEntry.record)
      } : null,
      classification
    };
  });
  const numberOf = (classification) => cases.filter((item) => item.classification === classification).length;
  return {
    strict,
    totalCases: cases.length,
    exactMatches: numberOf("exact match"),
    semanticMatches: numberOf("semantically equivalent"),
    intentionalDifferences: numberOf("intentional difference"),
    unavailableCases: numberOf("unavailable/not comparable"),
    defects: numberOf("defect"),
    cases
  };
}

function legacyResult({ legacyReport, repository, repositoryStatus, historyAudit, cohort, reason, comparison, error = null }) {
  return {
    report: legacyReport,
    selection: {
      path: "legacy",
      reason,
      repositoryStatus,
      historyAudit,
      cohortStatus: cohort.status,
      fallback: true
    },
    debug: {
      selectedPath: "legacy",
      reason,
      repositoryStatus,
      canonicalEventCount: Array.isArray(repository?.events) ? repository.events.length : 0,
      historyAudit,
      cohort,
      shadowComparison: comparison,
      error
    }
  };
}

export function createUnitedStatesProgressReportReadModel({
  items = [],
  unitedStatesMemoryTrailState = {},
  dailyTrailState = {},
  dailyTrailItems = [],
  placeMasteryState = {},
  repository,
  storage,
  currentDate = new Date().toISOString().slice(0, 10),
  now = () => new Date()
} = {}) {
  const legacyReport = createUnitedStatesProgressReport({
    items,
    unitedStatesMemoryTrailState,
    dailyTrailState,
    dailyTrailItems,
    placeMasteryState,
    currentDate
  });
  const repositoryStatus = repository?.status?.code || "unknown";
  const historyAudit = auditLegacyProgressReportHistory({
    unitedStatesMemoryTrailState,
    dailyTrailState,
    placeMasteryState
  });
  const cohort = loadCanonicalProgressReportCohort(storage);

  if (!healthyRepositoryStatusCodes.has(repositoryStatus)) {
    return legacyResult({
      legacyReport,
      repository,
      repositoryStatus,
      historyAudit,
      cohort,
      reason: `canonical-repository-${repositoryStatus}`,
      comparison: null
    });
  }
  const alreadyEnrolled = cohort.status === "enrolled";
  const eligibleForEnrollment = cohort.status === "missing" && historyAudit.status === "clean";
  let canonicalReport;
  try {
    canonicalReport = createCanonicalUnitedStatesProgressReport({
      items,
      repository,
      legacyPresentationReport: legacyReport
    });
  } catch (error) {
    return legacyResult({
      legacyReport,
      repository,
      repositoryStatus,
      historyAudit,
      cohort,
      reason: "canonical-adapter-error",
      comparison: null,
      error: error instanceof Error ? error.message : String(error)
    });
  }
  const comparison = compareProgressReportReadModels({
    legacyReport,
    canonicalReport,
    strict: alreadyEnrolled || eligibleForEnrollment
  });

  if (["invalid", "storage-unavailable", "storage-read-error"].includes(cohort.status)) {
    return legacyResult({
      legacyReport,
      repository,
      repositoryStatus,
      historyAudit,
      cohort,
      reason: `canonical-cohort-${cohort.status}`,
      comparison
    });
  }

  if (!alreadyEnrolled && !eligibleForEnrollment) {
    return legacyResult({
      legacyReport,
      repository,
      repositoryStatus,
      historyAudit,
      cohort,
      reason: historyAudit.status === "ambiguous" ? "ambiguous-legacy-history" : "existing-legacy-history",
      comparison
    });
  }
  if (comparison.defects > 0) {
    return legacyResult({
      legacyReport,
      repository,
      repositoryStatus,
      historyAudit,
      cohort,
      reason: "canonical-shadow-defect",
      comparison
    });
  }

  let effectiveCohort = cohort;
  if (eligibleForEnrollment) {
    const enrollment = enrollCanonicalProgressReportCohort({ storage, repository, now });
    if (!enrollment.ok) {
      return legacyResult({
        legacyReport,
        repository,
        repositoryStatus,
        historyAudit,
        cohort,
        reason: `canonical-cohort-${enrollment.status}`,
        comparison
      });
    }
    effectiveCohort = { status: "enrolled", marker: enrollment.marker };
  }

  return {
    report: canonicalReport,
    selection: {
      path: "canonical-first",
      reason: alreadyEnrolled ? "eligible-enrolled-new-learner" : "eligible-clean-new-learner",
      repositoryStatus,
      historyAudit,
      cohortStatus: effectiveCohort.status,
      fallback: false
    },
    debug: {
      selectedPath: "canonical-first",
      reason: alreadyEnrolled ? "eligible-enrolled-new-learner" : "eligible-clean-new-learner",
      repositoryStatus,
      canonicalEventCount: Array.isArray(repository?.events) ? repository.events.length : 0,
      historyAudit,
      cohort: effectiveCohort,
      supportedCategoryIds: clone(supportedCategoryIds),
      supportedProgressSkillIds: [
        "state-location",
        "state-identification",
        "capital-location",
        "capital-identification"
      ],
      shadowComparison: comparison,
      error: null
    }
  };
}
