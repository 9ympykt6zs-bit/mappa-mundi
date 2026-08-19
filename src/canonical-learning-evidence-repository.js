import {
  CANONICAL_LEARNING_SCHEMA_VERSION,
  createCanonicalEvidenceEvent
} from "./canonical-learning-evidence.js";

export const CANONICAL_EVIDENCE_REPOSITORY_STORAGE_VERSION = 1;
export const CANONICAL_EVIDENCE_REPOSITORY_STORAGE_KEY = "mappaMundiCanonicalEvidence";

// Future storage migrations are registered by the version they migrate from.
export const CANONICAL_EVIDENCE_REPOSITORY_MIGRATIONS = Object.freeze({});

const unavailableStatusCodes = new Set([
  "corrupt-json",
  "invalid-data",
  "unsupported-version",
  "storage-read-error"
]);

function cloneJson(value) {
  if (value === undefined) return undefined;
  return JSON.parse(JSON.stringify(value));
}

function status(code, message, details = {}) {
  return {
    code,
    message,
    recoverable: code !== "ready",
    ...details
  };
}

function readyStatus(eventCount) {
  return status("ready", `Canonical evidence repository contains ${eventCount} event${eventCount === 1 ? "" : "s"}.`, {
    recoverable: false
  });
}

export function createEmptyCanonicalEvidenceRepository(repositoryStatus = status(
  "empty",
  "No canonical evidence has been persisted yet."
)) {
  return {
    storageVersion: CANONICAL_EVIDENCE_REPOSITORY_STORAGE_VERSION,
    evidenceSchemaVersion: CANONICAL_LEARNING_SCHEMA_VERSION,
    events: [],
    status: cloneJson(repositoryStatus)
  };
}

function createPersistedSnapshot(repository) {
  if (!repository || Number(repository.storageVersion) !== CANONICAL_EVIDENCE_REPOSITORY_STORAGE_VERSION) {
    throw new TypeError("Canonical evidence repository has an unsupported storage version.");
  }
  if (Number(repository.evidenceSchemaVersion) !== CANONICAL_LEARNING_SCHEMA_VERSION) {
    throw new TypeError("Canonical evidence repository has an unsupported evidence schema version.");
  }
  if (!Array.isArray(repository.events)) {
    throw new TypeError("Canonical evidence repository events must be an array.");
  }
  return {
    storageVersion: CANONICAL_EVIDENCE_REPOSITORY_STORAGE_VERSION,
    evidenceSchemaVersion: CANONICAL_LEARNING_SCHEMA_VERSION,
    events: repository.events.map((event) => createCanonicalEvidenceEvent(event))
  };
}

function migratePersistedSnapshot(snapshot) {
  if (!snapshot || typeof snapshot !== "object" || Array.isArray(snapshot)) {
    throw new TypeError("Persisted canonical evidence must be an object.");
  }
  let migrated = cloneJson(snapshot);
  let version = Number(migrated.storageVersion);
  if (!Number.isInteger(version) || version < 1) {
    throw new TypeError("Persisted canonical evidence has an invalid storage version.");
  }
  while (version < CANONICAL_EVIDENCE_REPOSITORY_STORAGE_VERSION) {
    const migrate = CANONICAL_EVIDENCE_REPOSITORY_MIGRATIONS[version];
    if (typeof migrate !== "function") {
      const error = new TypeError(`No canonical evidence migration exists for storage version ${version}.`);
      error.code = "unsupported-version";
      throw error;
    }
    migrated = migrate(migrated);
    version = Number(migrated?.storageVersion);
  }
  if (version !== CANONICAL_EVIDENCE_REPOSITORY_STORAGE_VERSION) {
    const error = new TypeError(`Unsupported canonical evidence storage version: ${String(migrated.storageVersion)}`);
    error.code = "unsupported-version";
    throw error;
  }
  return migrated;
}

function resolveStorage(storage) {
  if (storage !== undefined) return storage;
  try {
    return globalThis.localStorage;
  } catch {
    return null;
  }
}

export function loadCanonicalEvidenceRepository(storage) {
  const resolvedStorage = resolveStorage(storage);
  if (!resolvedStorage || typeof resolvedStorage.getItem !== "function") {
    return createEmptyCanonicalEvidenceRepository(status(
      "storage-unavailable",
      "Canonical evidence storage is unavailable in this environment."
    ));
  }
  let raw;
  try {
    raw = resolvedStorage.getItem(CANONICAL_EVIDENCE_REPOSITORY_STORAGE_KEY);
  } catch (error) {
    return createEmptyCanonicalEvidenceRepository(status(
      "storage-read-error",
      `Canonical evidence could not be read: ${error instanceof Error ? error.message : String(error)}`,
      { preservedPersistedValue: true }
    ));
  }
  if (raw === null) return createEmptyCanonicalEvidenceRepository();

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    return createEmptyCanonicalEvidenceRepository(status(
      "corrupt-json",
      `Canonical evidence contains invalid JSON: ${error instanceof Error ? error.message : String(error)}`,
      { preservedPersistedValue: true }
    ));
  }

  try {
    const snapshot = createPersistedSnapshot(migratePersistedSnapshot(parsed));
    return { ...snapshot, status: readyStatus(snapshot.events.length) };
  } catch (error) {
    const code = error?.code === "unsupported-version" ? "unsupported-version" : "invalid-data";
    return createEmptyCanonicalEvidenceRepository(status(
      code,
      `Canonical evidence could not be loaded: ${error instanceof Error ? error.message : String(error)}`,
      { preservedPersistedValue: true }
    ));
  }
}

export function saveCanonicalEvidenceRepository(repository, storage) {
  const resolvedStorage = resolveStorage(storage);
  if (!resolvedStorage || typeof resolvedStorage.setItem !== "function") {
    return {
      ok: false,
      status: status("storage-unavailable", "Canonical evidence storage is unavailable in this environment.")
    };
  }
  let snapshot;
  try {
    snapshot = createPersistedSnapshot(repository);
    resolvedStorage.setItem(CANONICAL_EVIDENCE_REPOSITORY_STORAGE_KEY, JSON.stringify(snapshot));
    return { ok: true, status: readyStatus(snapshot.events.length), snapshot: cloneJson(snapshot) };
  } catch (error) {
    return {
      ok: false,
      status: status(
        "storage-write-error",
        `Canonical evidence could not be saved: ${error instanceof Error ? error.message : String(error)}`
      )
    };
  }
}

function ensureWritableRepository(repository) {
  if (unavailableStatusCodes.has(repository?.status?.code)) {
    throw new Error(`Canonical evidence repository is unavailable: ${repository.status.message}`);
  }
  return createPersistedSnapshot(repository);
}

export function appendCanonicalEvidenceEvents(repository, inputEvents = []) {
  const snapshot = ensureWritableRepository(repository);
  if (!Array.isArray(inputEvents)) throw new TypeError("Canonical evidence input events must be an array.");
  const events = snapshot.events.slice();
  const byId = new Map(events.map((event) => [event.eventId, event]));
  const insertedEventIds = [];
  const duplicateEventIds = [];

  inputEvents.forEach((inputEvent) => {
    const event = createCanonicalEvidenceEvent(inputEvent);
    const existing = byId.get(event.eventId);
    if (existing) {
      if (JSON.stringify(existing) !== JSON.stringify(event)) {
        throw new Error(`Canonical evidence event ID collision: ${event.eventId}`);
      }
      duplicateEventIds.push(event.eventId);
      return;
    }
    events.push(event);
    byId.set(event.eventId, event);
    insertedEventIds.push(event.eventId);
  });

  return {
    repository: {
      storageVersion: snapshot.storageVersion,
      evidenceSchemaVersion: snapshot.evidenceSchemaVersion,
      events,
      status: readyStatus(events.length)
    },
    insertedEventIds,
    duplicateEventIds
  };
}

export function appendCanonicalEvidenceEvent(repository, event) {
  const result = appendCanonicalEvidenceEvents(repository, [event]);
  return {
    repository: result.repository,
    inserted: result.insertedEventIds.length === 1,
    reason: result.insertedEventIds.length === 1 ? "inserted" : "duplicate"
  };
}

export function recordCanonicalEvidenceEvents(events, storage) {
  const loaded = loadCanonicalEvidenceRepository(storage);
  if (unavailableStatusCodes.has(loaded.status.code)) {
    return { ok: false, repository: loaded, status: cloneJson(loaded.status), insertedEventIds: [], duplicateEventIds: [] };
  }
  let appended;
  try {
    appended = appendCanonicalEvidenceEvents(loaded, events);
  } catch (error) {
    return {
      ok: false,
      repository: loaded,
      status: status("invalid-event", error instanceof Error ? error.message : String(error)),
      insertedEventIds: [],
      duplicateEventIds: []
    };
  }
  const saved = saveCanonicalEvidenceRepository(appended.repository, storage);
  return {
    ok: saved.ok,
    repository: { ...appended.repository, status: saved.status },
    status: saved.status,
    insertedEventIds: appended.insertedEventIds,
    duplicateEventIds: appended.duplicateEventIds
  };
}

export function recordCanonicalEvidenceEvent(event, storage) {
  const result = recordCanonicalEvidenceEvents([event], storage);
  return {
    ...result,
    inserted: result.insertedEventIds.length === 1,
    reason: result.insertedEventIds.length === 1
      ? "inserted"
      : result.duplicateEventIds.length === 1 ? "duplicate" : result.status.code
  };
}

export function resetCanonicalEvidenceRepository(storage) {
  const resolvedStorage = resolveStorage(storage);
  if (!resolvedStorage || typeof resolvedStorage.removeItem !== "function") {
    return createEmptyCanonicalEvidenceRepository(status(
      "storage-unavailable",
      "Canonical evidence storage is unavailable in this environment."
    ));
  }
  try {
    resolvedStorage.removeItem(CANONICAL_EVIDENCE_REPOSITORY_STORAGE_KEY);
    return createEmptyCanonicalEvidenceRepository(status(
      "reset",
      "Canonical evidence was reset. Legacy learner stores were not changed."
    ));
  } catch (error) {
    return createEmptyCanonicalEvidenceRepository(status(
      "storage-write-error",
      `Canonical evidence could not be reset: ${error instanceof Error ? error.message : String(error)}`
    ));
  }
}

function compareEvidenceEvents(left, right) {
  return left.occurredAt.localeCompare(right.occurredAt)
    || Number(left.sequence ?? 0) - Number(right.sequence ?? 0)
    || left.eventId.localeCompare(right.eventId);
}

export function getAllCanonicalEvidenceEvents(repository) {
  return createPersistedSnapshot(repository).events.map(cloneJson);
}

export function getCanonicalEvidenceEventsByConcept(repository, conceptId) {
  return getAllCanonicalEvidenceEvents(repository).filter((event) => event.conceptId === conceptId);
}

export function getCanonicalEvidenceEventsBySkill(repository, skillId) {
  return getAllCanonicalEvidenceEvents(repository).filter((event) => event.skillId === skillId);
}

export function getCanonicalEvidenceEventsBySourceMode(repository, sourceMode) {
  return getAllCanonicalEvidenceEvents(repository).filter((event) => event.sourceMode === sourceMode);
}

export function getRecentCanonicalEvidenceEvents(repository, limit = 20) {
  const normalizedLimit = Math.max(0, Math.floor(Number(limit) || 0));
  return getAllCanonicalEvidenceEvents(repository).sort(compareEvidenceEvents).reverse().slice(0, normalizedLimit);
}

export function reduceCanonicalEvidenceEvents(inputEvents = []) {
  if (!Array.isArray(inputEvents)) throw new TypeError("Canonical evidence input events must be an array.");
  const events = inputEvents.map((event) => createCanonicalEvidenceEvent(event)).sort(compareEvidenceEvents);
  const summaries = new Map();
  events.forEach((event) => {
    const key = `${event.conceptId}\u0000${event.skillId}`;
    const summary = summaries.get(key) || {
      conceptId: event.conceptId,
      skillId: event.skillId,
      attemptCount: 0,
      correctCount: 0,
      incorrectCount: 0,
      assistedCount: 0,
      partialCount: 0,
      skippedCount: 0,
      lastEvidenceAt: null,
      mostRecentOutcome: null,
      sourceModes: []
    };
    summary.attemptCount += 1;
    summary[`${event.outcome}Count`] += 1;
    summary.lastEvidenceAt = event.occurredAt;
    summary.mostRecentOutcome = event.outcome;
    if (!summary.sourceModes.includes(event.sourceMode)) summary.sourceModes.push(event.sourceMode);
    summaries.set(key, summary);
  });
  return [...summaries.values()]
    .map((summary) => ({ ...summary, sourceModes: summary.sourceModes.sort() }))
    .sort((left, right) => left.conceptId.localeCompare(right.conceptId) || left.skillId.localeCompare(right.skillId));
}

export function getCanonicalEvidenceConceptSkillSummaries(repository) {
  return reduceCanonicalEvidenceEvents(getAllCanonicalEvidenceEvents(repository));
}

export function getCanonicalEvidenceRepositoryStatus(repository) {
  return cloneJson({
    storageVersion: repository?.storageVersion ?? null,
    evidenceSchemaVersion: repository?.evidenceSchemaVersion ?? null,
    eventCount: Array.isArray(repository?.events) ? repository.events.length : 0,
    status: repository?.status || status("unknown", "Canonical evidence repository status is unavailable.")
  });
}
