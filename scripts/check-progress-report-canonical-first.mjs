import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { adaptCanonicalRetrievalAttempt } from "../src/canonical-learning-evidence.js";
import {
  appendCanonicalEvidenceEvents,
  createEmptyCanonicalEvidenceRepository,
  loadCanonicalEvidenceRepository,
  recordCanonicalEvidenceEvents,
  resetCanonicalEvidenceRepository
} from "../src/canonical-learning-evidence-repository.js";
import { scoreBayesianEvidenceCounts } from "../src/bayesian-progress-score.js";
import {
  CANONICAL_PROGRESS_REPORT_COHORT_STORAGE_KEY,
  createUnitedStatesProgressReportReadModel,
  loadCanonicalProgressReportCohort,
  resetCanonicalProgressReportCohort
} from "../src/united-states-progress-report-read-path.js";
import {
  createUnitedStatesMemoryTrailState,
  planUnitedStatesMemoryTrailSession
} from "../src/united-states-memory-trail-planner.js";
import { loadUnitedStatesSimulationFixture } from "./lib/us-simulation-fixture.mjs";

function createMemoryStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) { values.set(key, String(value)); },
    removeItem(key) { values.delete(key); },
    snapshot() { return Object.fromEntries(values); }
  };
}

const items = [
  { id: "state:ohio", type: "state", targetId: "ohio", label: "Ohio", sourceActivityId: "us-states-05", order: 0 },
  { id: "state:maine", type: "state", targetId: "maine", label: "Maine", sourceActivityId: "us-states-01", order: 1 },
  {
    id: "capital:columbus-oh",
    type: "capital",
    targetId: "columbus-oh",
    label: "Columbus",
    relatedStateItemId: "state:ohio",
    relatedStateTargetId: "ohio",
    sourceActivityId: "us-states-05",
    order: 2
  }
];

function event(item, promptType, result, eventId, sourceMode, sequence) {
  return adaptCanonicalRetrievalAttempt({
    item,
    promptType,
    result,
    eventId,
    attemptId: `attempt-${eventId}`,
    occurredAt: `2035-04-05T12:00:0${sequence}.000Z`,
    sequence,
    sourceMode,
    sourceActivityId: item.sourceActivityId
  });
}

const crossModeEvents = [
  event(items[0], "name_to_place", "correct", "journey-location", "journey", 1),
  event(items[0], "name_to_place", "correct", "memory-location", "us-memory-trail", 2),
  event(items[0], "name_to_place", "incorrect", "daily-location", "daily-trail", 3),
  event(items[0], "place_to_name", "correct", "memory-identification", "us-memory-trail", 4),
  event(items[2], "name_to_place", "correct", "capital-location", "us-memory-trail", 5),
  event(items[2], "place_to_name", "incorrect", "capital-identification", "daily-trail", 6)
];

const cleanStorage = createMemoryStorage();
const repository = appendCanonicalEvidenceEvents(createEmptyCanonicalEvidenceRepository(), [
  ...crossModeEvents,
  crossModeEvents[0]
]).repository;
const fixedNow = () => new Date("2035-04-05T13:00:00.000Z");
const first = createUnitedStatesProgressReportReadModel({ items, repository, storage: cleanStorage, now: fixedNow });
assert.equal(first.selection.path, "canonical-first");
assert.equal(first.selection.reason, "eligible-clean-new-learner");
assert.equal(loadCanonicalProgressReportCohort(cleanStorage).status, "enrolled");

const category = (report, id) => report.categories.find((candidate) => candidate.id === id);
const record = (report, categoryId, itemId) => category(report, categoryId).records.find((candidate) => candidate.itemId === itemId);
const ohioLocation = record(first.report, "state-locations", "state:ohio");
const ohioIdentification = record(first.report, "state-identification", "state:ohio");
const maineLocation = record(first.report, "state-locations", "state:maine");
const columbus = record(first.report, "state-capitals", "capital:columbus-oh");
assert.deepEqual(
  [ohioLocation.evidenceHistory.correctCount, ohioLocation.evidenceHistory.incorrectCount],
  [2, 1],
  "Journey, Memory Trail, and Daily Trail location evidence must combine without double counting."
);
assert.equal(ohioLocation.evidenceHistory.eventCount, 3);
assert.deepEqual(ohioLocation.evidenceHistory.sources.map(({ id }) => id), ["daily-trail", "journey", "us-memory-trail"]);
assert.equal(ohioLocation.bayesianProgressScore, scoreBayesianEvidenceCounts(2, 1));
assert.deepEqual([ohioIdentification.evidenceHistory.correctCount, ohioIdentification.evidenceHistory.incorrectCount], [1, 0]);
assert.equal(maineLocation.bayesianProgressScore, null, "Unseen must stay unseen.");
assert.equal(maineLocation.displayCategory.id, "unseen");
assert.deepEqual([columbus.evidenceHistory.correctCount, columbus.evidenceHistory.incorrectCount], [1, 1]);
assert.deepEqual(columbus.canonicalMapping.progressSkillIds, [
  "capital-location",
  "capital-identification",
  "capital-of-relationship"
]);

const replay = createUnitedStatesProgressReportReadModel({ items, repository, storage: cleanStorage, now: fixedNow });
assert.equal(replay.selection.reason, "eligible-enrolled-new-learner");
assert.deepEqual(replay.report, first.report, "Reloading the same canonical state must be deterministic.");

const laterLegacyState = {
  currentSessionNumber: 2,
  itemProgress: {
    "state:ohio": { status: "learning", memoryState: "learning", timesSeen: 1, correctCount: 1, missCount: 0 }
  }
};
const enrolledLater = createUnitedStatesProgressReportReadModel({
  items,
  repository,
  storage: cleanStorage,
  unitedStatesMemoryTrailState: laterLegacyState,
  now: fixedNow
});
assert.equal(enrolledLater.selection.path, "canonical-first", "Post-enrollment legacy counters must not reclassify the learner as existing.");
assert.equal(enrolledLater.debug.shadowComparison.defects, 0);

const existingStorage = createMemoryStorage();
const existing = createUnitedStatesProgressReportReadModel({
  items,
  repository,
  storage: existingStorage,
  unitedStatesMemoryTrailState: laterLegacyState,
  now: fixedNow
});
assert.equal(existing.selection.path, "legacy");
assert.equal(existing.selection.reason, "existing-legacy-history");
assert.equal(existingStorage.getItem(CANONICAL_PROGRESS_REPORT_COHORT_STORAGE_KEY), null);

const ambiguous = createUnitedStatesProgressReportReadModel({
  items,
  repository,
  storage: createMemoryStorage(),
  unitedStatesMemoryTrailState: { itemProgress: { "state:ohio": { status: "learning", memoryState: "learning" } } },
  now: fixedNow
});
assert.equal(ambiguous.selection.path, "legacy");
assert.equal(ambiguous.selection.reason, "ambiguous-legacy-history");

const ambiguousDailyLifecycle = createUnitedStatesProgressReportReadModel({
  items,
  repository,
  storage: createMemoryStorage(),
  dailyTrailState: { completedGoalIds: ["world-core"], itemProgress: {} },
  now: fixedNow
});
assert.equal(ambiguousDailyLifecycle.selection.path, "legacy");
assert.equal(ambiguousDailyLifecycle.selection.reason, "ambiguous-legacy-history");

const corruptStorage = createMemoryStorage({ mappaMundiCanonicalEvidence: "{broken" });
const corrupt = createUnitedStatesProgressReportReadModel({
  items,
  repository: loadCanonicalEvidenceRepository(corruptStorage),
  storage: corruptStorage,
  now: fixedNow
});
assert.equal(corrupt.selection.path, "legacy");
assert.equal(corrupt.selection.reason, "canonical-repository-corrupt-json");

const unavailableStorage = createUnitedStatesProgressReportReadModel({
  items,
  repository: createEmptyCanonicalEvidenceRepository(),
  storage: null,
  now: fixedNow
});
assert.equal(unavailableStorage.selection.path, "legacy");
assert.equal(unavailableStorage.selection.reason, "canonical-cohort-storage-unavailable");

const invalidMarkerStorage = createMemoryStorage({ [CANONICAL_PROGRESS_REPORT_COHORT_STORAGE_KEY]: "{}" });
const invalidMarker = createUnitedStatesProgressReportReadModel({ items, repository, storage: invalidMarkerStorage, now: fixedNow });
assert.equal(invalidMarker.selection.path, "legacy");
assert.equal(invalidMarker.selection.reason, "canonical-cohort-invalid");
assert.ok(invalidMarker.debug.shadowComparison, "Healthy canonical storage should retain shadow diagnostics even with invalid cohort metadata.");

const persistenceStorage = createMemoryStorage();
const persisted = recordCanonicalEvidenceEvents(crossModeEvents, persistenceStorage);
assert.equal(persisted.ok, true);
const reloadedRepository = loadCanonicalEvidenceRepository(persistenceStorage);
const persistedRead = createUnitedStatesProgressReportReadModel({
  items,
  repository: reloadedRepository,
  storage: persistenceStorage,
  now: fixedNow
});
assert.equal(persistedRead.selection.path, "canonical-first");
assert.equal(record(persistedRead.report, "state-locations", "state:ohio").evidenceHistory.eventCount, 3);
assert.equal(resetCanonicalProgressReportCohort(persistenceStorage).ok, true);
assert.equal(resetCanonicalEvidenceRepository(persistenceStorage).status.code, "reset");
const afterReset = createUnitedStatesProgressReportReadModel({
  items,
  repository: loadCanonicalEvidenceRepository(persistenceStorage),
  storage: persistenceStorage,
  now: fixedNow
});
assert.equal(afterReset.selection.path, "canonical-first");
assert.equal(record(afterReset.report, "state-locations", "state:ohio").bayesianProgressScore, null);

const defectStorage = createMemoryStorage();
createUnitedStatesProgressReportReadModel({ items, repository: createEmptyCanonicalEvidenceRepository(), storage: defectStorage, now: fixedNow });
const defectFallback = createUnitedStatesProgressReportReadModel({
  items,
  repository: createEmptyCanonicalEvidenceRepository(),
  storage: defectStorage,
  unitedStatesMemoryTrailState: laterLegacyState,
  now: fixedNow
});
assert.equal(defectFallback.selection.path, "legacy");
assert.equal(defectFallback.selection.reason, "canonical-shadow-defect");
assert.ok(defectFallback.debug.shadowComparison.defects > 0);

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const fixture = loadUnitedStatesSimulationFixture(repositoryRoot);
const plannerState = createUnitedStatesMemoryTrailState(null, fixture.items);
const plannerSnapshot = JSON.stringify(plannerState);
const plannerOptions = { seed: "canonical-first-read-path", now: fixedNow };
const planBefore = planUnitedStatesMemoryTrailSession(plannerState, fixture.items, plannerOptions);
createUnitedStatesProgressReportReadModel({
  items: fixture.items,
  repository: createEmptyCanonicalEvidenceRepository(),
  storage: createMemoryStorage(),
  unitedStatesMemoryTrailState: plannerState,
  now: fixedNow
});
const planAfter = planUnitedStatesMemoryTrailSession(plannerState, fixture.items, plannerOptions);
assert.deepEqual(planAfter, planBefore, "Progress Report selection must not affect Memory Trail planning.");
assert.equal(JSON.stringify(plannerState), plannerSnapshot, "Progress Report selection must not mutate planner state.");

const runtimeSource = readFileSync(new URL("../src/maplibre-poc.js", import.meta.url), "utf8");
const adapterSource = readFileSync(new URL("../src/canonical-progress-report-shadow.js", import.meta.url), "utf8");
assert.match(runtimeSource, /createUnitedStatesProgressReportReadModel/);
assert.match(runtimeSource, /repository: loadCanonicalEvidenceRepository\(\)/);
assert.match(runtimeSource, /unitedStatesProgressReportModel = readModel\.report/);
assert.match(adapterSource, /applyProgressEvidencePolicy\(events\)/);
assert.match(adapterSource, /scoreBayesianEvidenceCounts\(correctCount, incorrectCount\)/);

console.log("Progress Report canonical-first production read path passed.");
