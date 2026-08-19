import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  adaptCanonicalMentalMapEvaluation,
  adaptCanonicalRetrievalAttempt,
  createCanonicalAggregateEvidenceSummary,
  createCanonicalEvidenceEvent
} from "../src/canonical-learning-evidence.js";
import {
  appendCanonicalEvidenceEvent,
  appendCanonicalEvidenceEvents,
  CANONICAL_EVIDENCE_REPOSITORY_STORAGE_KEY,
  CANONICAL_EVIDENCE_REPOSITORY_STORAGE_VERSION,
  createEmptyCanonicalEvidenceRepository,
  getAllCanonicalEvidenceEvents,
  getCanonicalEvidenceConceptSkillSummaries,
  getCanonicalEvidenceEventsByConcept,
  getCanonicalEvidenceEventsBySkill,
  getCanonicalEvidenceEventsBySourceMode,
  getCanonicalEvidenceRepositoryStatus,
  getRecentCanonicalEvidenceEvents,
  loadCanonicalEvidenceRepository,
  recordCanonicalEvidenceEvent,
  reduceCanonicalEvidenceEvents,
  resetCanonicalEvidenceRepository,
  saveCanonicalEvidenceRepository
} from "../src/canonical-learning-evidence-repository.js";
import {
  createCanonicalEvidenceInspectorView,
  createLearningInspectorDebugObject
} from "../src/learning-inspector.js";

function createMemoryStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem(key) {
      return values.has(key) ? values.get(key) : null;
    },
    setItem(key, value) {
      values.set(key, String(value));
    },
    removeItem(key) {
      values.delete(key);
    },
    snapshot() {
      return Object.fromEntries(values);
    }
  };
}

const ohioItem = {
  id: "state:ohio",
  type: "state",
  targetId: "ohio",
  label: "Ohio",
  sourceActivityId: "us-states-05"
};

function retrievalEvent({
  eventId,
  sourceMode,
  result = "correct",
  promptType = "name_to_place",
  occurredAt = "2034-02-03T15:30:00.000Z",
  sequence
}) {
  return adaptCanonicalRetrievalAttempt({
    item: ohioItem,
    promptType,
    result,
    eventId,
    attemptId: `${eventId}:attempt`,
    occurredAt,
    sourceMode,
    sourceActivityId: ohioItem.sourceActivityId,
    sequence
  });
}

const journeyEvent = retrievalEvent({ eventId: "journey-ohio", sourceMode: "journey", sequence: 0 });
const memoryEvent = retrievalEvent({
  eventId: "memory-ohio",
  sourceMode: "us-memory-trail",
  occurredAt: "2034-02-03T15:31:00.000Z",
  sequence: 1
});
const dailyAssistedEvent = retrievalEvent({
  eventId: "daily-ohio-guided",
  sourceMode: "daily-trail",
  promptType: "guided",
  occurredAt: "2034-02-03T15:32:00.000Z",
  sequence: 2
});
const mentalPartialEvent = adaptCanonicalMentalMapEvaluation({
  challenge: { id: "lake-erie", correctStateIds: ["ohio", "pennsylvania"] },
  evaluation: {
    isCorrect: false,
    score: 1,
    maxScore: 2,
    selectedStateIds: ["ohio"],
    missingStateIds: ["pennsylvania"],
    unnecessaryStateIds: []
  },
  conceptId: "relationship:set:lake-erie",
  eventId: "mental-lake-erie",
  attemptId: "mental-lake-erie:attempt",
  occurredAt: "2034-02-03T15:33:00.000Z",
  sourceMode: "mental-map"
});

assert.equal(journeyEvent.conceptId, "state-location:ohio");
assert.equal(memoryEvent.conceptId, journeyEvent.conceptId);
assert.equal(memoryEvent.skillId, journeyEvent.skillId);
assert.equal(dailyAssistedEvent.outcome, "assisted");
assert.equal(mentalPartialEvent.outcome, "partial");

assert.throws(() => createCanonicalEvidenceEvent({ ...journeyEvent, skillId: "mastery" }), /Unknown canonical skill/);

const empty = createEmptyCanonicalEvidenceRepository();
const journeyBefore = JSON.parse(JSON.stringify(journeyEvent));
const firstInsert = appendCanonicalEvidenceEvent(empty, journeyEvent);
assert.equal(firstInsert.inserted, true);
assert.deepEqual(journeyEvent, journeyBefore, "Insertion must not mutate its input event.");
assert.notEqual(firstInsert.repository.events[0], journeyEvent, "The repository must own a JSON-safe clone.");

const duplicateInsert = appendCanonicalEvidenceEvent(firstInsert.repository, journeyEvent);
assert.equal(duplicateInsert.inserted, false);
assert.equal(duplicateInsert.reason, "duplicate");
assert.equal(duplicateInsert.repository.events.length, 1);
assert.throws(
  () => appendCanonicalEvidenceEvent(firstInsert.repository, { ...journeyEvent, outcome: "incorrect" }),
  /event ID collision/
);

const allInserted = appendCanonicalEvidenceEvents(firstInsert.repository, [
  memoryEvent,
  dailyAssistedEvent,
  mentalPartialEvent
]).repository;
assert.doesNotThrow(() => JSON.stringify(allInserted));
assert.equal(getAllCanonicalEvidenceEvents(allInserted).length, 4);
assert.equal(getCanonicalEvidenceEventsByConcept(allInserted, "state-location:ohio").length, 3);
assert.equal(getCanonicalEvidenceEventsBySkill(allInserted, "locating").length, 3);
assert.equal(getCanonicalEvidenceEventsBySourceMode(allInserted, "journey").length, 1);
assert.equal(getRecentCanonicalEvidenceEvents(allInserted, 2)[0].eventId, "mental-lake-erie");

const summaries = getCanonicalEvidenceConceptSkillSummaries(allInserted);
const ohioSummary = summaries.find(({ conceptId, skillId }) => conceptId === "state-location:ohio" && skillId === "locating");
assert.deepEqual(ohioSummary, {
  conceptId: "state-location:ohio",
  skillId: "locating",
  attemptCount: 3,
  correctCount: 2,
  incorrectCount: 0,
  assistedCount: 1,
  partialCount: 0,
  skippedCount: 0,
  lastEvidenceAt: "2034-02-03T15:32:00.000Z",
  mostRecentOutcome: "assisted",
  sourceModes: ["daily-trail", "journey", "us-memory-trail"]
});
const mentalSummary = summaries.find(({ conceptId }) => conceptId === "relationship:set:lake-erie");
assert.equal(mentalSummary.partialCount, 1);
assert.equal("mastery" in ohioSummary, false, "A2 must not invent a mastery formula.");
assert.deepEqual(
  reduceCanonicalEvidenceEvents([...allInserted.events].reverse()),
  reduceCanonicalEvidenceEvents(allInserted.events),
  "Replay must be deterministic regardless of persisted array order."
);

const storage = createMemoryStorage({ legacyPlannerState: "keep-me" });
const saveResult = saveCanonicalEvidenceRepository(allInserted, storage);
assert.equal(saveResult.ok, true);
const persisted = JSON.parse(storage.getItem(CANONICAL_EVIDENCE_REPOSITORY_STORAGE_KEY));
assert.deepEqual(Object.keys(persisted).sort(), ["events", "evidenceSchemaVersion", "storageVersion"]);
assert.equal(persisted.storageVersion, CANONICAL_EVIDENCE_REPOSITORY_STORAGE_VERSION);
const reloaded = loadCanonicalEvidenceRepository(storage);
assert.deepEqual(reloaded.events, allInserted.events);
assert.equal(getCanonicalEvidenceRepositoryStatus(reloaded).status.code, "ready");

const runtimeStorage = createMemoryStorage();
const firstRecord = recordCanonicalEvidenceEvent(journeyEvent, runtimeStorage);
const duplicateRecord = recordCanonicalEvidenceEvent(journeyEvent, runtimeStorage);
assert.equal(firstRecord.ok, true);
assert.equal(firstRecord.inserted, true);
assert.equal(duplicateRecord.ok, true);
assert.equal(duplicateRecord.reason, "duplicate");

const corruptStorage = createMemoryStorage({
  [CANONICAL_EVIDENCE_REPOSITORY_STORAGE_KEY]: "{not-json"
});
const corrupt = loadCanonicalEvidenceRepository(corruptStorage);
assert.equal(corrupt.status.code, "corrupt-json");
assert.equal(corrupt.status.preservedPersistedValue, true);
assert.equal(recordCanonicalEvidenceEvent(journeyEvent, corruptStorage).ok, false);
assert.equal(corruptStorage.getItem(CANONICAL_EVIDENCE_REPOSITORY_STORAGE_KEY), "{not-json");

const emptyStringStorage = createMemoryStorage({ [CANONICAL_EVIDENCE_REPOSITORY_STORAGE_KEY]: "" });
assert.equal(loadCanonicalEvidenceRepository(emptyStringStorage).status.code, "corrupt-json");

const futureRaw = JSON.stringify({ storageVersion: 99, evidenceSchemaVersion: 1, events: [] });
const futureStorage = createMemoryStorage({ [CANONICAL_EVIDENCE_REPOSITORY_STORAGE_KEY]: futureRaw });
assert.equal(loadCanonicalEvidenceRepository(futureStorage).status.code, "unsupported-version");
assert.equal(futureStorage.getItem(CANONICAL_EVIDENCE_REPOSITORY_STORAGE_KEY), futureRaw);

const invalidRaw = JSON.stringify({ storageVersion: 1, evidenceSchemaVersion: 1, events: [{ nope: true }] });
const invalidStorage = createMemoryStorage({ [CANONICAL_EVIDENCE_REPOSITORY_STORAGE_KEY]: invalidRaw });
assert.equal(loadCanonicalEvidenceRepository(invalidStorage).status.code, "invalid-data");
assert.equal(invalidStorage.getItem(CANONICAL_EVIDENCE_REPOSITORY_STORAGE_KEY), invalidRaw);

const resetResult = resetCanonicalEvidenceRepository(storage);
assert.equal(resetResult.status.code, "reset");
assert.equal(storage.getItem(CANONICAL_EVIDENCE_REPOSITORY_STORAGE_KEY), null);
assert.equal(storage.getItem("legacyPlannerState"), "keep-me", "Canonical reset must not broaden into legacy stores.");

const aggregate = createCanonicalAggregateEvidenceSummary({
  item: ohioItem,
  progress: { timesSeen: 4, correctCount: 3, missCount: 1 },
  sourceMode: "us-memory-trail"
});
assert.throws(
  () => appendCanonicalEvidenceEvent(empty, aggregate),
  /eventId|skillId/,
  "Historical aggregates must not be converted into fabricated raw events."
);

const canonicalInspector = createCanonicalEvidenceInspectorView({
  repository: allInserted,
  conceptId: "state-location:ohio"
});
assert.equal(canonicalInspector.adapter, "canonical-evidence-repository");
assert.equal(canonicalInspector.informationClass.value, "canonical-live-events");
assert.equal(canonicalInspector.recentEvidence.value.every(({ sourceMode }) => Boolean(sourceMode)), true);
const inspectorExport = createLearningInspectorDebugObject({
  items: [{ adapter: "legacy-fixture" }],
  canonicalRepository: allInserted,
  canonicalEvidenceFilters: { conceptId: "state-location:ohio" }
});
assert.equal(inspectorExport.items[0].adapter, "legacy-fixture");
assert.equal(inspectorExport.canonicalEvidence.adapter, "canonical-evidence-repository");
assert.equal("canonicalEvidence" in createLearningInspectorDebugObject(), false);

const runtimeSource = readFileSync(new URL("../src/maplibre-poc.js", import.meta.url), "utf8");
assert.match(runtimeSource, /const result = session\.tryAnswer\(targetId\);\n  recordCanonicalJourneyPlacementEvidence\(result\);/);
assert.match(runtimeSource, /handleIncorrectPlacement\(result\);/);
assert.match(runtimeSource, /updateMemoryTrailDebugObject\(memoryTrail\);\n  recordCanonicalMemoryTrailEvidence/);
assert.match(runtimeSource, /recordCanonicalMentalMapEvaluation\(\);/);
assert.match(runtimeSource, /onEvaluation: \(evaluation\) => recordCanonicalReconstructionEvaluation/);

console.log("Canonical learning evidence repository check passed.");
