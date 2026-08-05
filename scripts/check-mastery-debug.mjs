import assert from "node:assert/strict";
import fs from "node:fs";
import {
  createMasteryDebugController,
  createMasteryDebugViewModel,
  getMasterySignalForPromptType,
  isMasteryDebugLocalHost,
  resetMasteryDebugData
} from "../src/mastery-debug.js";
import {
  createPlaceMasteryState,
  placeMasteryStorageKey,
  placeMasteryVersion
} from "../src/place-mastery-store.js";

assert.equal(isMasteryDebugLocalHost({ hostname: "localhost" }), true);
assert.equal(isMasteryDebugLocalHost({ hostname: "127.0.0.1" }), true);
assert.equal(isMasteryDebugLocalHost({ hostname: "::1" }), true);
assert.equal(isMasteryDebugLocalHost({ hostname: "mappamundi.earth" }), false);
assert.equal(isMasteryDebugLocalHost({ hostname: "" }), false);

assert.equal(getMasterySignalForPromptType("name_to_place"), "locating");
assert.equal(getMasterySignalForPromptType("place_to_name"), "naming");
assert.equal(getMasterySignalForPromptType("guided"), null);

const state = createPlaceMasteryState({
  version: placeMasteryVersion,
  places: {
    "state:maine": {
      signals: {
        locating: { attempts: 2, correct: 1, incorrect: 1, currentCorrectStreak: 0 }
      }
    }
  }
});
const view = createMasteryDebugViewModel({ placeId: "state:maine", label: "Maine" }, state);
assert.equal(view.placeLabel, "Maine");
assert.deepEqual(view.signals.map((signal) => signal.signalId), [
  "recognition", "naming", "locating", "relationships"
]);
assert.equal(view.signals.find((signal) => signal.signalId === "locating").attempts, 2);
assert.equal(view.signals.find((signal) => signal.signalId === "relationships").attempts, 0);

const stored = new Map([
  [placeMasteryStorageKey, JSON.stringify(state)],
  ["atlasQuestProgress", "journey-sentinel"],
  ["mappaDailyTrailProgress", "daily-sentinel"],
  ["mappaUnitedStatesMemoryTrailProgress", "memory-sentinel"]
]);
const storage = {
  getItem: (key) => stored.get(key) || null,
  setItem: (key, value) => stored.set(key, String(value)),
  removeItem: (key) => stored.delete(key)
};
assert.equal(resetMasteryDebugData(storage, () => false), false);
assert.ok(storage.getItem(placeMasteryStorageKey));
assert.equal(resetMasteryDebugData(storage, () => true), true);
assert.equal(storage.getItem(placeMasteryStorageKey), null);
assert.equal(storage.getItem("atlasQuestProgress"), "journey-sentinel");
assert.equal(storage.getItem("mappaDailyTrailProgress"), "daily-sentinel");
assert.equal(storage.getItem("mappaUnitedStatesMemoryTrailProgress"), "memory-sentinel");

const publicController = createMasteryDebugController({
  location: { hostname: "mappamundi.earth" },
  document: { body: { append: () => assert.fail("Public debug UI must not be appended.") } }
});
assert.equal(publicController.active, false);
assert.equal(publicController.recordAttempt({ placeId: "state:maine" }, "name_to_place", true), false);

const runtimeSource = fs.readFileSync(new URL("../src/maplibre-poc.js", import.meta.url), "utf8");
assert.ok(runtimeSource.includes('createMasteryDebugController()'));
assert.ok(runtimeSource.includes('masteryDebugController?.setCurrentPlace(getMasteryDebugPlace(memoryTrail, selection.targetId))'));
assert.ok(runtimeSource.includes('masteryDebugController?.recordAttempt('));
assert.ok(runtimeSource.includes('if (isGuided) {'));

const debugSource = fs.readFileSync(new URL("../src/mastery-debug.js", import.meta.url), "utf8");
assert.ok(debugSource.includes('class="mastery-debug-confirm" hidden'));
assert.ok(debugSource.includes('class="mastery-debug-confirm-reset"'));
assert.ok(debugSource.includes('resetMasteryDebugData(storage, () => true)'));

console.log("Mastery Debug panel check passed.");
