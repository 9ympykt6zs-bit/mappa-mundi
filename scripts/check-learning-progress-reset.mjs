import assert from "node:assert/strict";
import fs from "node:fs";
import {
  activityProgressStorageKey,
  completedActivitiesStorageKey,
  learningProgressStorageKeys,
  learningProgressStoreManifest,
  resetAllLearningProgress
} from "../src/learning-progress-reset.js";
import { LOWER_48_RECONSTRUCTION_STORAGE_KEY, clearLower48ReconstructionSnapshot } from "../src/atlas/map-reconstruction-persistence.js";
import { CANONICAL_EVIDENCE_REPOSITORY_STORAGE_KEY } from "../src/canonical-learning-evidence-repository.js";
import { dailyTrailStorageKey, resetDailyTrailProgress } from "../src/daily-trail-planner.js";
import { clearPlaceMastery, placeMasteryStorageKey } from "../src/place-mastery-store.js";
import { clearProgress, progressStorageKey, resetJourneyDifficulty } from "../src/progress-store.js";
import { unitedStatesMemoryTrailStorageKey, resetUnitedStatesMemoryTrailProgress } from "../src/united-states-memory-trail-planner.js";
import { CANONICAL_PROGRESS_REPORT_COHORT_STORAGE_KEY } from "../src/united-states-progress-report-read-path.js";
import { GUIDED_LEARNING_ORCHESTRATION_STORAGE_KEY } from "../src/guided-learning-orchestration.js";

function createMemoryStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem: (key) => values.has(key) ? values.get(key) : null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key),
    snapshot: () => Object.fromEntries(values)
  };
}

const expectedManifest = [
  ["journey-progress", progressStorageKey],
  ["activity-progress", activityProgressStorageKey],
  ["completed-activities", completedActivitiesStorageKey],
  ["daily-trail", dailyTrailStorageKey],
  ["united-states-memory-trail", unitedStatesMemoryTrailStorageKey],
  ["guided-learning-orchestration", GUIDED_LEARNING_ORCHESTRATION_STORAGE_KEY],
  ["place-mastery", placeMasteryStorageKey],
  ["canonical-evidence", CANONICAL_EVIDENCE_REPOSITORY_STORAGE_KEY],
  ["canonical-progress-report-cohort", CANONICAL_PROGRESS_REPORT_COHORT_STORAGE_KEY],
  ["lower-48-reconstruction", LOWER_48_RECONSTRUCTION_STORAGE_KEY]
];
assert.deepEqual(
  learningProgressStoreManifest.map(({ id, key }) => [id, key]),
  expectedManifest,
  "The global reset manifest must enumerate every current persisted learner-state store."
);
assert.deepEqual(learningProgressStorageKeys, expectedManifest.map(([, key]) => key));
assert.equal(new Set(learningProgressStorageKeys).size, learningProgressStorageKeys.length, "Reset keys must be unique.");
assert.equal(Object.isFrozen(learningProgressStoreManifest), true);
assert.equal(learningProgressStoreManifest.every(Object.isFrozen), true);
assert.equal(Object.isFrozen(learningProgressStorageKeys), true);

const preservedPreferences = {
  "geography-memory-difficulty-mode": "hard",
  atlasQuestSettings: JSON.stringify({ version: 1, audio: { speakMemoryTrailInstructions: false } }),
  "atlas-quest-layer-settings": JSON.stringify({ showCities: false }),
  atlasQuestOnboardingSeen: "true",
  atlasQuestAudioMuted: "true",
  mappaDailyTrailDevOverride: JSON.stringify({ goalId: "world-core" }),
  mappaCameraDevOverrides: JSON.stringify({ world: { zoom: 2 } }),
  "mappa-co-continent-overrides": JSON.stringify(["antarctica"]),
  "unrelated-future-preference": "keep-me"
};
const seededLearning = Object.fromEntries(learningProgressStorageKeys.map((key) => [key, `learning:${key}`]));
const storage = createMemoryStorage({ ...seededLearning, ...preservedPreferences });
const firstReset = resetAllLearningProgress(storage);
assert.deepEqual(firstReset, {
  ok: true,
  status: "reset",
  clearedStoreIds: expectedManifest.map(([id]) => id),
  failedStores: []
});
learningProgressStorageKeys.forEach((key) => assert.equal(storage.getItem(key), null, `${key} should be cleared.`));
assert.deepEqual(storage.snapshot(), preservedPreferences, "Settings, preferences, dev configuration, and unknown future preferences must survive.");
assert.deepEqual(resetAllLearningProgress(storage), firstReset, "The reset must be deterministic and idempotent.");
assert.equal(resetAllLearningProgress(null).status, "storage-unavailable");

const failingStorage = createMemoryStorage(seededLearning);
const removedKeys = [];
const originalRemoveItem = failingStorage.removeItem;
failingStorage.removeItem = (key) => {
  if (key === dailyTrailStorageKey) throw new Error("blocked daily store");
  removedKeys.push(key);
  originalRemoveItem(key);
};
const failedReset = resetAllLearningProgress(failingStorage);
assert.equal(failedReset.ok, false);
assert.equal(failedReset.status, "storage-write-error");
assert.deepEqual(failedReset.failedStores, [{ id: "daily-trail", key: dailyTrailStorageKey, message: "blocked daily store" }]);
assert.equal(removedKeys.length, learningProgressStorageKeys.length - 1, "A failed store must not prevent attempts to clear the remaining manifest.");

const scopedStorage = createMemoryStorage({
  [CANONICAL_EVIDENCE_REPOSITORY_STORAGE_KEY]: "canonical-history",
  [dailyTrailStorageKey]: "daily-history",
  [unitedStatesMemoryTrailStorageKey]: "us-memory-history",
  [placeMasteryStorageKey]: "mastery-history",
  [LOWER_48_RECONSTRUCTION_STORAGE_KEY]: "reconstruction-history",
  [GUIDED_LEARNING_ORCHESTRATION_STORAGE_KEY]: "orchestration-history"
});
resetDailyTrailProgress(scopedStorage);
assert.equal(scopedStorage.getItem(dailyTrailStorageKey), null);
assert.equal(scopedStorage.getItem(CANONICAL_EVIDENCE_REPOSITORY_STORAGE_KEY), "canonical-history");
resetUnitedStatesMemoryTrailProgress(scopedStorage);
assert.equal(scopedStorage.getItem(unitedStatesMemoryTrailStorageKey), null);
assert.equal(scopedStorage.getItem(CANONICAL_EVIDENCE_REPOSITORY_STORAGE_KEY), "canonical-history");
clearPlaceMastery(scopedStorage);
clearLower48ReconstructionSnapshot(scopedStorage);
assert.equal(scopedStorage.getItem(CANONICAL_EVIDENCE_REPOSITORY_STORAGE_KEY), "canonical-history");

const previousLocalStorage = globalThis.localStorage;
globalThis.localStorage = scopedStorage;
try {
  scopedStorage.setItem(progressStorageKey, JSON.stringify({ version: 1, journeys: {} }));
  resetJourneyDifficulty("united-states", "medium");
  assert.equal(scopedStorage.getItem(CANONICAL_EVIDENCE_REPOSITORY_STORAGE_KEY), "canonical-history");
  clearProgress();
  assert.equal(scopedStorage.getItem(progressStorageKey), null);
  assert.equal(scopedStorage.getItem(CANONICAL_EVIDENCE_REPOSITORY_STORAGE_KEY), "canonical-history");
} finally {
  globalThis.localStorage = previousLocalStorage;
}

const runtimeSource = fs.readFileSync(new URL("../src/maplibre-poc.js", import.meta.url), "utf8");
const indexSource = fs.readFileSync(new URL("../index.html", import.meta.url), "utf8");
assert.match(runtimeSource, /resetAllLearningProgress\(window\.localStorage\)/);
assert.match(runtimeSource, /Reset All Learning Progress/);
assert.match(runtimeSource, /Erase All Learning Progress/);
assert.match(runtimeSource, /Settings and preferences will be kept/);
assert.match(runtimeSource, /resetDailyTrailPersistedProgress\(window\.localStorage\)/);
assert.match(runtimeSource, /resetGuidedLearningOrchestrationState\(window\.localStorage\)/);
assert.match(indexSource, />Restart Activity<\/button>/);
assert.doesNotMatch(runtimeSource, /resetCanonicalEvidenceRepository\([^)]*\).*resetDailyTrailProgress/s, "Scoped reset code must not delete canonical history.");

console.log("Learning progress reset validation passed.");
