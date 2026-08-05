import assert from "node:assert/strict";
import {
  applyPlaceMasteryAttempt,
  clearPlaceMastery,
  createPlaceMasteryState,
  getPlaceMastery,
  loadPlaceMastery,
  placeMasterySignalIds,
  placeMasteryStorageKey,
  placeMasteryVersion,
  recordPlaceMasteryAttempt,
  savePlaceMastery
} from "../src/place-mastery-store.js";

function createStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem: (key) => values.has(key) ? values.get(key) : null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key)
  };
}

const empty = createPlaceMasteryState({ version: placeMasteryVersion, places: {} });
const maine = getPlaceMastery("state:maine", empty);
assert.deepEqual(Object.keys(maine.signals), placeMasterySignalIds);
placeMasterySignalIds.forEach((signalId) => {
  assert.deepEqual(maine.signals[signalId], {
    attempts: 0,
    correct: 0,
    incorrect: 0,
    currentCorrectStreak: 0,
    lastAttemptAt: null,
    lastResult: null
  });
});

const firstAttemptAt = "2026-08-05T14:00:00.000Z";
const afterRecognition = applyPlaceMasteryAttempt(empty, "state:maine", "recognition", {
  correct: true,
  attemptedAt: firstAttemptAt
});
assert.equal(afterRecognition.places["state:maine"].signals.recognition.correct, 1);
assert.equal(afterRecognition.places["state:maine"].signals.recognition.currentCorrectStreak, 1);
assert.equal(afterRecognition.places["state:maine"].signals.recognition.lastAttemptAt, firstAttemptAt);
assert.equal(afterRecognition.places["state:maine"].signals.naming.attempts, 0);
assert.equal(afterRecognition.places["state:maine"].signals.locating.attempts, 0);
assert.equal(afterRecognition.places["state:maine"].signals.relationships.attempts, 0);
assert.equal(Object.keys(empty.places).length, 0, "Applying evidence must not mutate the input state.");

const afterMiss = applyPlaceMasteryAttempt(afterRecognition, "state:maine", "recognition", {
  correct: false,
  attemptedAt: "2026-08-05T14:01:00.000Z"
});
assert.deepEqual(afterMiss.places["state:maine"].signals.recognition, {
  attempts: 2,
  correct: 1,
  incorrect: 1,
  currentCorrectStreak: 0,
  lastAttemptAt: "2026-08-05T14:01:00.000Z",
  lastResult: "incorrect"
});

assert.throws(
  () => applyPlaceMasteryAttempt(empty, "state:maine", "spelling", { correct: true }),
  /Unknown mastery signal/
);
assert.throws(
  () => applyPlaceMasteryAttempt(empty, "state:maine", "naming", { correct: "yes" }),
  /must be a boolean/
);

const storage = createStorage({
  atlasQuestProgress: JSON.stringify({ sentinel: "journey" }),
  mappaDailyTrailProgress: JSON.stringify({ sentinel: "daily-trail" }),
  mappaUnitedStatesMemoryTrailProgress: JSON.stringify({ sentinel: "memory-trail" })
});
savePlaceMastery(afterMiss, storage);
assert.deepEqual(loadPlaceMastery(storage), afterMiss);

recordPlaceMasteryAttempt("state:maine", "locating", {
  correct: true,
  attemptedAt: "2026-08-05T14:02:00.000Z"
}, storage);
assert.equal(loadPlaceMastery(storage).places["state:maine"].signals.locating.correct, 1);

storage.setItem(placeMasteryStorageKey, "{not-json");
assert.deepEqual(loadPlaceMastery(storage), createPlaceMasteryState());

storage.setItem(placeMasteryStorageKey, JSON.stringify({ version: 999, places: { unsafe: {} } }));
assert.deepEqual(loadPlaceMastery(storage), createPlaceMasteryState());

clearPlaceMastery(storage);
assert.equal(storage.getItem(placeMasteryStorageKey), null);
assert.equal(storage.getItem("atlasQuestProgress"), JSON.stringify({ sentinel: "journey" }));
assert.equal(storage.getItem("mappaDailyTrailProgress"), JSON.stringify({ sentinel: "daily-trail" }));
assert.equal(storage.getItem("mappaUnitedStatesMemoryTrailProgress"), JSON.stringify({ sentinel: "memory-trail" }));

console.log("Place mastery foundation check passed.");
