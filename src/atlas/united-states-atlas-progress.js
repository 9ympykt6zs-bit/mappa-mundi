import { createDailyTrailState, dailyTrailStorageKey } from "../daily-trail-planner.js";
import {
  createUnitedStatesMemoryTrailState,
  unitedStatesMemoryTrailStorageKey
} from "../united-states-memory-trail-planner.js";
import { unitedStatesAtlas } from "./united-states-atlas-data.js";

export const UNITED_STATES_ATLAS_LEARNING_STATUSES = Object.freeze([
  "unexplored",
  "discovered",
  "learning",
  "strong",
  "mastered"
]);

const statusRank = Object.freeze({
  unexplored: 0,
  discovered: 1,
  learning: 2,
  strong: 3,
  mastered: 4
});

const statusDetails = Object.freeze({
  unexplored: "Not explored yet.",
  discovered: "Seen in a guided Learn prompt.",
  learning: "Practiced and building reliable recall.",
  strong: "Reliable recall in the existing learning progress.",
  mastered: "Marked mastered by the existing learning progress."
});

const atlasStateIds = new Set(
  unitedStatesAtlas.entities
    .filter((entity) => entity.kind === "state")
    .map((entity) => entity.id.replace("state:", ""))
);

function cloneJson(value) {
  return JSON.parse(JSON.stringify(value));
}

function normalizeNumber(value) {
  return Math.max(0, Number(value) || 0);
}

function getStateIdFromItemId(itemId) {
  const parts = String(itemId || "").split(":");
  const stateIndex = parts.lastIndexOf("state");
  const stateId = stateIndex >= 0 ? parts[stateIndex + 1] : "";
  return atlasStateIds.has(stateId) ? stateId : "";
}

function getProgressStatus(progress, isIntroduced) {
  const persistedStatus = String(progress?.status || "");
  if (persistedStatus === "mastered") return "mastered";
  if (persistedStatus === "review") return "strong";
  if (persistedStatus === "learning" || normalizeNumber(progress?.timesSeen) > 0 || normalizeNumber(progress?.correctCount) > 0 || normalizeNumber(progress?.missCount) > 0) {
    return "learning";
  }
  if (persistedStatus === "introduced" || isIntroduced) return "discovered";
  return "unexplored";
}

function createSourceEvidence(source, itemId, progress, introducedIds) {
  const isIntroduced = introducedIds.has(itemId);
  const status = getProgressStatus(progress, isIntroduced);
  return {
    source,
    status,
    introduced: status !== "unexplored",
    timesPracticed: normalizeNumber(progress?.timesSeen),
    correctResponses: normalizeNumber(progress?.correctCount),
    misses: normalizeNumber(progress?.missCount),
    memoryState: typeof progress?.memoryState === "string" ? progress.memoryState : "",
    mastered: status === "mastered"
  };
}

function collectSourceEvidence(state, source) {
  const introducedIds = new Set(Array.isArray(state?.introducedItemIds) ? state.introducedItemIds : []);
  const evidenceByStateId = new Map();
  const candidateItemIds = new Set([
    ...introducedIds,
    ...Object.keys(state?.itemProgress || {})
  ]);

  candidateItemIds.forEach((itemId) => {
    const stateId = getStateIdFromItemId(itemId);
    if (!stateId) return;
    const evidence = createSourceEvidence(source, itemId, state?.itemProgress?.[itemId], introducedIds);
    const current = evidenceByStateId.get(stateId);
    if (!current || statusRank[evidence.status] > statusRank[current.status]) {
      evidenceByStateId.set(stateId, evidence);
    }
  });

  return evidenceByStateId;
}

function createStateLearningStatus(stateId, evidenceSources) {
  const evidence = evidenceSources.filter(Boolean);
  const strongest = evidence.reduce((current, candidate) => (
    statusRank[candidate.status] > statusRank[current.status] ? candidate : current
  ), { status: "unexplored" });
  const status = strongest.status;

  return {
    stateId,
    status,
    explanation: statusDetails[status],
    introduced: evidence.some((item) => item.introduced),
    timesPracticed: evidence.reduce((total, item) => total + item.timesPracticed, 0),
    correctResponses: evidence.reduce((total, item) => total + item.correctResponses, 0),
    misses: evidence.reduce((total, item) => total + item.misses, 0),
    memoryState: strongest.memoryState || "",
    mastered: status === "mastered",
    sources: evidence.map((item) => item.source).sort()
  };
}

function parseStorageValue(storage, key) {
  try {
    return JSON.parse(storage?.getItem?.(key) || "null");
  } catch {
    return null;
  }
}

export function createUnitedStatesAtlasProgress({ dailyTrailState, unitedStatesMemoryTrailState } = {}) {
  const dailyEvidence = collectSourceEvidence(createDailyTrailState(dailyTrailState), "Daily Trail");
  const memoryTrailEvidence = collectSourceEvidence(
    createUnitedStatesMemoryTrailState(unitedStatesMemoryTrailState),
    "United States Memory Trail"
  );
  const statesById = {};
  const counts = Object.fromEntries(UNITED_STATES_ATLAS_LEARNING_STATUSES.map((status) => [status, 0]));

  [...atlasStateIds].sort().forEach((stateId) => {
    const status = createStateLearningStatus(stateId, [dailyEvidence.get(stateId), memoryTrailEvidence.get(stateId)]);
    statesById[stateId] = status;
    counts[status.status] += 1;
  });

  return {
    statesById,
    counts,
    totalStates: atlasStateIds.size
  };
}

export function readUnitedStatesAtlasProgress(storage = globalThis.localStorage) {
  const result = createUnitedStatesAtlasProgress({
    dailyTrailState: parseStorageValue(storage, dailyTrailStorageKey),
    unitedStatesMemoryTrailState: parseStorageValue(storage, unitedStatesMemoryTrailStorageKey)
  });
  return cloneJson(result);
}

export function getUnitedStatesAtlasStateLearningStatus(progress, stateId) {
  const normalizedStateId = String(stateId || "").trim().toLowerCase();
  if (!atlasStateIds.has(normalizedStateId)) return null;
  return cloneJson(progress?.statesById?.[normalizedStateId] || createStateLearningStatus(normalizedStateId, []));
}
