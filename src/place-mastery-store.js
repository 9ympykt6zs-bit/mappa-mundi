export const placeMasteryStorageKey = "mappaPlaceMastery";
export const placeMasteryVersion = 1;
export const placeMasterySignalIds = Object.freeze([
  "recognition",
  "naming",
  "locating",
  "relationships"
]);

const placeMasterySignalIdSet = new Set(placeMasterySignalIds);

function createEmptySignal() {
  return {
    attempts: 0,
    correct: 0,
    incorrect: 0,
    currentCorrectStreak: 0,
    lastAttemptAt: null,
    lastResult: null
  };
}

function createEmptyPlace(placeId) {
  return {
    placeId,
    signals: Object.fromEntries(
      placeMasterySignalIds.map((signalId) => [signalId, createEmptySignal()])
    )
  };
}

function createEmptyState() {
  return {
    version: placeMasteryVersion,
    places: {}
  };
}

function normalizeCount(value) {
  return Math.max(0, Math.floor(Number(value) || 0));
}

function normalizeTimestamp(value) {
  if (typeof value !== "string" || !value || !Number.isFinite(Date.parse(value))) {
    return null;
  }

  return value;
}

function normalizeSignal(value) {
  const correct = normalizeCount(value?.correct);
  const incorrect = normalizeCount(value?.incorrect);
  const attempts = Math.max(correct + incorrect, normalizeCount(value?.attempts));
  const lastResult = value?.lastResult === "correct" || value?.lastResult === "incorrect"
    ? value.lastResult
    : null;

  return {
    attempts,
    correct,
    incorrect,
    currentCorrectStreak: Math.min(correct, normalizeCount(value?.currentCorrectStreak)),
    lastAttemptAt: normalizeTimestamp(value?.lastAttemptAt),
    lastResult
  };
}

function normalizePlace(placeId, value) {
  const empty = createEmptyPlace(placeId);

  return {
    placeId,
    signals: Object.fromEntries(
      placeMasterySignalIds.map((signalId) => [
        signalId,
        normalizeSignal(value?.signals?.[signalId] || empty.signals[signalId])
      ])
    )
  };
}

function normalizePlaceId(value) {
  return typeof value === "string" ? value.trim() : "";
}

function requirePlaceId(value) {
  const placeId = normalizePlaceId(value);
  if (!placeId) {
    throw new TypeError("A non-empty placeId is required.");
  }
  return placeId;
}

function requireSignalId(value) {
  if (!placeMasterySignalIdSet.has(value)) {
    throw new TypeError(`Unknown mastery signal: ${String(value)}`);
  }
  return value;
}

export function createPlaceMasteryState(value = {}) {
  if (!value || typeof value !== "object" || value.version !== placeMasteryVersion) {
    return createEmptyState();
  }

  const places = value.places && typeof value.places === "object" ? value.places : {};
  return {
    version: placeMasteryVersion,
    places: Object.fromEntries(
      Object.entries(places)
        .map(([placeId, place]) => [normalizePlaceId(placeId), place])
        .filter(([placeId]) => placeId)
        .map(([placeId, place]) => [placeId, normalizePlace(placeId, place)])
    )
  };
}

export function getPlaceMastery(placeId, state = createEmptyState()) {
  const normalizedPlaceId = requirePlaceId(placeId);
  const normalized = createPlaceMasteryState(state);
  return normalizePlace(normalizedPlaceId, normalized.places[normalizedPlaceId]);
}

export function applyPlaceMasteryAttempt(state, placeId, signalId, result = {}) {
  const normalizedPlaceId = requirePlaceId(placeId);
  const normalizedSignalId = requireSignalId(signalId);
  if (typeof result.correct !== "boolean") {
    throw new TypeError("Mastery attempt result.correct must be a boolean.");
  }

  const next = createPlaceMasteryState(state);
  const place = getPlaceMastery(normalizedPlaceId, next);
  const signal = place.signals[normalizedSignalId];
  const attemptAt = normalizeTimestamp(result.attemptedAt);

  signal.attempts += 1;
  signal.lastAttemptAt = attemptAt;
  signal.lastResult = result.correct ? "correct" : "incorrect";

  if (result.correct) {
    signal.correct += 1;
    signal.currentCorrectStreak += 1;
  } else {
    signal.incorrect += 1;
    signal.currentCorrectStreak = 0;
  }

  next.places[normalizedPlaceId] = place;
  return next;
}

export function loadPlaceMastery(storage = globalThis.localStorage) {
  try {
    return createPlaceMasteryState(JSON.parse(storage?.getItem?.(placeMasteryStorageKey) || "null"));
  } catch {
    return createEmptyState();
  }
}

export function savePlaceMastery(state, storage = globalThis.localStorage) {
  const normalized = createPlaceMasteryState(state);

  try {
    storage?.setItem?.(placeMasteryStorageKey, JSON.stringify(normalized));
  } catch {
    // Mastery evidence remains usable in memory when local storage is unavailable.
  }

  return normalized;
}

export function recordPlaceMasteryAttempt(placeId, signalId, result, storage = globalThis.localStorage) {
  const next = applyPlaceMasteryAttempt(
    loadPlaceMastery(storage),
    placeId,
    signalId,
    {
      ...result,
      attemptedAt: result?.attemptedAt || new Date().toISOString()
    }
  );
  return savePlaceMastery(next, storage);
}

export function clearPlaceMastery(storage = globalThis.localStorage) {
  try {
    storage?.removeItem?.(placeMasteryStorageKey);
  } catch {
    // Ignore local storage failures.
  }
  return createEmptyState();
}
