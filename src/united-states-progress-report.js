import {
  demonstratedProgressCategory,
  renderBayesianProgressSegments,
  scoreBayesianEvidenceCounts
} from "./bayesian-progress-score.js";

const CATEGORY_DEFINITIONS = Object.freeze([
  { id: "state-locations", label: "State Locations", itemType: "state", signalId: "locating" },
  { id: "state-identification", label: "State Identification", itemType: "state", signalId: "naming" },
  { id: "state-capitals", label: "State Capitals", itemType: "capital", signalId: null }
]);

const OPTIONAL_SIGNAL_CATEGORIES = Object.freeze([
  { id: "state-recognition", label: "State Recognition", itemType: "state", signalId: "recognition" },
  { id: "geographic-relationships", label: "Geographic Relationships", itemType: "state", signalId: "relationships" }
]);

const demonstratedCategoryIds = new Set(["demonstrated", "strong-evidence"]);

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function count(value) {
  return Math.max(0, Number(value) || 0);
}

function itemProgressEntriesForCanonicalItem(item, source) {
  if (!source?.state?.itemProgress) return [];
  const matchingIds = source.itemIdsByCanonicalKey?.get(`${item.type}:${item.targetId}`) || [];
  return matchingIds
    .map((itemId) => ({ itemId, progress: source.state.itemProgress[itemId] }))
    .filter((entry) => entry.progress && typeof entry.progress === "object");
}

function createDailySource(dailyTrailState, dailyTrailItems = []) {
  const itemIdsByCanonicalKey = new Map();
  for (const item of dailyTrailItems) {
    const key = `${item?.type}:${item?.targetId}`;
    if (!item?.id || !item?.targetId || !["state", "capital"].includes(item.type)) continue;
    itemIdsByCanonicalKey.set(key, [...(itemIdsByCanonicalKey.get(key) || []), item.id]);
  }
  return { id: "daily-trail", label: "Daily Trail", state: dailyTrailState || {}, itemIdsByCanonicalKey };
}

function createMemorySource(unitedStatesMemoryTrailState, items = []) {
  const itemIdsByCanonicalKey = new Map(items.map((item) => [`${item.type}:${item.targetId}`, [item.id]]));
  return {
    id: "united-states-memory-trail",
    label: "United States Memory Trail",
    state: unitedStatesMemoryTrailState || {},
    itemIdsByCanonicalKey
  };
}

function aggregatePlannerEvidence(item, plannerSources) {
  const sources = [];
  let correctCount = 0;
  let incorrectCount = 0;
  const progressEntries = [];
  for (const source of plannerSources) {
    const entries = itemProgressEntriesForCanonicalItem(item, source);
    if (entries.length === 0) continue;
    const sourceCorrect = entries.reduce((sum, entry) => sum + count(entry.progress.correctCount), 0);
    const sourceIncorrect = entries.reduce((sum, entry) => sum + count(entry.progress.missCount), 0);
    if (sourceCorrect + sourceIncorrect > 0) {
      sources.push({ id: source.id, label: source.label, correctCount: sourceCorrect, incorrectCount: sourceIncorrect });
      correctCount += sourceCorrect;
      incorrectCount += sourceIncorrect;
    }
    progressEntries.push(...entries.map((entry) => ({ ...entry, sourceId: source.id, sourceLabel: source.label })));
  }
  return { correctCount, incorrectCount, sources, progressEntries };
}

function getPlaceSignal(placeMasteryState, item, signalId) {
  if (!signalId || item.type !== "state") return null;
  const signal = placeMasteryState?.places?.[item.id]?.signals?.[signalId];
  if (!signal || count(signal.correct) + count(signal.incorrect) === 0) return null;
  return {
    correctCount: count(signal.correct),
    incorrectCount: count(signal.incorrect),
    sources: [{
      id: `place-signal:${signalId}`,
      label: `${signalId[0].toUpperCase()}${signalId.slice(1)} evidence`,
      correctCount: count(signal.correct),
      incorrectCount: count(signal.incorrect)
    }],
    progressEntries: [{
      itemId: item.id,
      sourceId: `place-signal:${signalId}`,
      sourceLabel: `${signalId} evidence`,
      progress: {
        status: "signal-evidence",
        correctCount: signal.correct,
        missCount: signal.incorrect,
        correctStreak: signal.currentCorrectStreak,
        lastAttemptAt: signal.lastAttemptAt,
        lastResult: signal.lastResult
      }
    }]
  };
}

function reviewStatus(progressEntries, currentSessionNumber, currentDate) {
  if (progressEntries.length === 0) {
    return {
      id: "unavailable",
      label: "No review status yet",
      explanation: "The learning system has not scheduled this item."
    };
  }
  const progressValues = progressEntries.map((entry) => entry.progress);
  const dueNow = progressValues.some((progress) => (
    progress.memoryState === "relearning"
    || (Number.isFinite(Number(progress.dueSession)) && Number(progress.dueSession) <= currentSessionNumber)
    || (typeof progress.dueDate === "string" && progress.dueDate && progress.dueDate <= currentDate)
  ));
  if (dueNow) {
    return {
      id: "practice-now",
      label: "Useful to practice now",
      explanation: "Scheduler status only; it does not lower or control the demonstrated-progress score."
    };
  }
  if (progressValues.some((progress) => ["review", "mastered"].includes(progress.status) || progress.memoryState === "review")) {
    return {
      id: "future-review",
      label: "Review planned later",
      explanation: "The learning system is spacing future practice separately from demonstrated progress."
    };
  }
  return {
    id: "building-practice",
    label: "Building practice",
    explanation: "The learning system is still gathering practice evidence for this item."
  };
}

function latestEvidenceSummary(progressEntries) {
  const explicit = progressEntries
    .filter((entry) => ["correct", "incorrect"].includes(entry.progress.lastResult))
    .sort((left, right) => String(right.progress.lastAttemptAt || "").localeCompare(String(left.progress.lastAttemptAt || "")))[0];
  if (explicit) {
    return {
      availability: "observed",
      result: explicit.progress.lastResult,
      text: `Latest recorded attempt: ${explicit.progress.lastResult}.`
    };
  }
  if (progressEntries.some((entry) => count(entry.progress.correctStreak) > 0)) {
    return {
      availability: "inferred",
      result: "correct",
      text: "The current saved streak indicates the latest recorded practice ended correctly."
    };
  }
  if (progressEntries.some((entry) => count(entry.progress.missCount) > 0)) {
    return {
      availability: "inferred",
      result: "incorrect",
      text: "The current saved practice state includes a miss; individual recent attempts are not retained."
    };
  }
  return {
    availability: "unavailable",
    result: null,
    text: "Individual recent attempts are not retained by this evidence source."
  };
}

function explanationForEvidence(correctCount, incorrectCount, score) {
  if (score === null) return "No retrieval evidence yet. Unseen is different from zero progress.";
  const responseLabel = `${correctCount} correct ${correctCount === 1 ? "response" : "responses"}`;
  const missLabel = `${incorrectCount} ${incorrectCount === 1 ? "miss" : "misses"}`;
  if (incorrectCount === 0) {
    return `${responseLabel} added positive evidence. More successful retrievals can strengthen the evidence without implying permanent mastery.`;
  }
  return `${responseLabel} and ${missLabel} shape this estimate. Misses add contradictory evidence without erasing earlier success.`;
}

function itemLabel(item, itemsById) {
  if (item.type !== "capital") return item.label;
  const state = itemsById.get(item.relatedStateItemId);
  return state ? `${state.label} — ${item.label}` : item.label;
}

function createItemRecord({ item, category, itemsById, plannerSources, placeMasteryState, currentSessionNumber, currentDate }) {
  const signalEvidence = getPlaceSignal(placeMasteryState, item, category.signalId);
  const plannerEvidence = aggregatePlannerEvidence(item, plannerSources);
  const evidence = signalEvidence || plannerEvidence;
  const score = scoreBayesianEvidenceCounts(evidence.correctCount, evidence.incorrectCount);
  const displayCategory = demonstratedProgressCategory(score);
  const usesCombinedStatePractice = item.type === "state" && Boolean(category.signalId) && !signalEvidence;
  return {
    itemId: item.id,
    skillId: category.id,
    label: itemLabel(item, itemsById),
    bayesianProgressScore: score,
    displayCategory,
    display: renderBayesianProgressSegments(score),
    explanation: explanationForEvidence(evidence.correctCount, evidence.incorrectCount, score),
    evidenceHistory: {
      availability: "aggregate-only",
      correctCount: evidence.correctCount,
      incorrectCount: evidence.incorrectCount,
      recentAttempts: [],
      latest: latestEvidenceSummary(evidence.progressEntries),
      sources: clone(evidence.sources),
      note: usesCombinedStatePractice
        ? "Saved state-practice evidence combines location and identification prompts, so this score is shared across both views until prompt-specific evidence exists."
        : "The score uses the available skill-specific or item-specific correct and incorrect counts."
    },
    reviewStatus: reviewStatus(plannerEvidence.progressEntries, currentSessionNumber, currentDate)
  };
}

function createCategory(definition, records) {
  const attempted = records.filter((record) => record.bayesianProgressScore !== null);
  const aggregateScore = attempted.length === 0
    ? null
    : Number((records.reduce((sum, record) => sum + (record.bayesianProgressScore || 0), 0) / records.length).toFixed(6));
  const demonstratedCount = records.filter((record) => demonstratedCategoryIds.has(record.displayCategory.id)).length;
  const baseDisplayCategory = demonstratedProgressCategory(aggregateScore);
  const displayCategory = demonstratedCount > 0 && records.length > attempted.length && baseDisplayCategory.id === "needs-review"
    ? { id: "early-evidence", label: "Early evidence" }
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
    display: renderBayesianProgressSegments(aggregateScore),
    summary: attempted.length === 0
      ? `0 / ${records.length} demonstrated · no evidence yet`
      : `${demonstratedCount} / ${records.length} demonstrated`,
    records: records.sort((left, right) => left.label.localeCompare(right.label))
  };
}

export function createUnitedStatesProgressReport({
  items = [],
  unitedStatesMemoryTrailState = {},
  dailyTrailState = {},
  dailyTrailItems = [],
  placeMasteryState = {},
  currentDate = new Date().toISOString().slice(0, 10)
} = {}) {
  const inputSnapshot = JSON.stringify({
    items,
    unitedStatesMemoryTrailState,
    dailyTrailState,
    dailyTrailItems,
    placeMasteryState
  });
  const safeItems = clone(items).filter((item) => ["state", "capital"].includes(item.type));
  const itemsById = new Map(safeItems.map((item) => [item.id, item]));
  const plannerSources = [
    createMemorySource(unitedStatesMemoryTrailState, safeItems),
    createDailySource(dailyTrailState, dailyTrailItems)
  ];
  const currentSessionNumber = Math.max(
    1,
    count(unitedStatesMemoryTrailState?.currentSessionNumber),
    count(dailyTrailState?.currentSessionNumber)
  );
  const definitions = [...CATEGORY_DEFINITIONS];
  for (const optional of OPTIONAL_SIGNAL_CATEGORIES) {
    const hasEvidence = safeItems
      .filter((item) => item.type === optional.itemType)
      .some((item) => getPlaceSignal(placeMasteryState, item, optional.signalId));
    if (hasEvidence) definitions.push(optional);
  }
  const categories = definitions.map((definition) => {
    const records = safeItems
      .filter((item) => item.type === definition.itemType)
      .map((item) => createItemRecord({
        item,
        category: definition,
        itemsById,
        plannerSources,
        placeMasteryState,
        currentSessionNumber,
        currentDate
      }));
    return createCategory(definition, records);
  });
  const report = {
    schemaVersion: 1,
    kind: "united-states-demonstrated-progress-report",
    title: "U.S. Progress Report",
    sectionTitle: "Demonstrated knowledge",
    subtitle: "What you have shown you can do",
    scoreMeaning: "Demonstrated progress is a read-only report. It is not permanent mastery and does not select practice questions.",
    categories,
    dataSources: [
      "United States Memory Trail item-level correct and miss counts",
      "Daily Trail item-level correct and miss counts for matching U.S. targets",
      "Skill-specific place signals when available",
      "Scheduler status shown separately from progress"
    ]
  };
  if (JSON.stringify({ items, unitedStatesMemoryTrailState, dailyTrailState, dailyTrailItems, placeMasteryState }) !== inputSnapshot) {
    throw new Error("U.S. Progress Report mutated learner state or source data.");
  }
  return report;
}
