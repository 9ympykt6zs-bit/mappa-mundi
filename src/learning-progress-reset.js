import { LOWER_48_RECONSTRUCTION_STORAGE_KEY } from "./atlas/map-reconstruction-persistence.js";
import { CANONICAL_EVIDENCE_REPOSITORY_STORAGE_KEY } from "./canonical-learning-evidence-repository.js";
import { dailyTrailStorageKey } from "./daily-trail-planner.js";
import { placeMasteryStorageKey } from "./place-mastery-store.js";
import { progressStorageKey } from "./progress-store.js";
import { unitedStatesMemoryTrailStorageKey } from "./united-states-memory-trail-planner.js";
import { CANONICAL_PROGRESS_REPORT_COHORT_STORAGE_KEY } from "./united-states-progress-report-read-path.js";
import { GUIDED_LEARNING_ORCHESTRATION_STORAGE_KEY } from "./guided-learning-orchestration.js";
import { GUIDED_CHILD_LAUNCH_STORAGE_KEY } from "./guided-child-launch-contract.js";

export const activityProgressStorageKey = "geography-memory-activity-progress";
export const completedActivitiesStorageKey = "geography-memory-completed-activities";

export const learningProgressStoreManifest = Object.freeze([
  Object.freeze({ id: "journey-progress", key: progressStorageKey }),
  Object.freeze({ id: "activity-progress", key: activityProgressStorageKey }),
  Object.freeze({ id: "completed-activities", key: completedActivitiesStorageKey }),
  Object.freeze({ id: "daily-trail", key: dailyTrailStorageKey }),
  Object.freeze({ id: "united-states-memory-trail", key: unitedStatesMemoryTrailStorageKey }),
  Object.freeze({ id: "guided-learning-orchestration", key: GUIDED_LEARNING_ORCHESTRATION_STORAGE_KEY }),
  Object.freeze({ id: "guided-child-launch", key: GUIDED_CHILD_LAUNCH_STORAGE_KEY }),
  Object.freeze({ id: "place-mastery", key: placeMasteryStorageKey }),
  Object.freeze({ id: "canonical-evidence", key: CANONICAL_EVIDENCE_REPOSITORY_STORAGE_KEY }),
  Object.freeze({ id: "canonical-progress-report-cohort", key: CANONICAL_PROGRESS_REPORT_COHORT_STORAGE_KEY }),
  Object.freeze({ id: "lower-48-reconstruction", key: LOWER_48_RECONSTRUCTION_STORAGE_KEY })
]);

export const learningProgressStorageKeys = Object.freeze(
  learningProgressStoreManifest.map((store) => store.key)
);

function resolveStorage(storage) {
  if (storage !== undefined) return storage;
  try {
    return globalThis.localStorage;
  } catch {
    return null;
  }
}

export function resetAllLearningProgress(storage) {
  const resolvedStorage = resolveStorage(storage);
  if (!resolvedStorage || typeof resolvedStorage.removeItem !== "function") {
    return {
      ok: false,
      status: "storage-unavailable",
      clearedStoreIds: [],
      failedStores: learningProgressStoreManifest.map(({ id, key }) => ({ id, key }))
    };
  }

  const clearedStoreIds = [];
  const failedStores = [];
  learningProgressStoreManifest.forEach(({ id, key }) => {
    try {
      resolvedStorage.removeItem(key);
      clearedStoreIds.push(id);
    } catch (error) {
      failedStores.push({
        id,
        key,
        message: error instanceof Error ? error.message : String(error)
      });
    }
  });

  return {
    ok: failedStores.length === 0,
    status: failedStores.length === 0 ? "reset" : "storage-write-error",
    clearedStoreIds,
    failedStores
  };
}
