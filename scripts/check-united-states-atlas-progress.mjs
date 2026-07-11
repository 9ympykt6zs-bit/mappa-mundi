import assert from "node:assert/strict";
import {
  createUnitedStatesAtlasProgress,
  getUnitedStatesAtlasStateLearningStatus,
  readUnitedStatesAtlasProgress
} from "../src/atlas/united-states-atlas-progress.js";

function getStatus(progress, stateId) {
  return getUnitedStatesAtlasStateLearningStatus(progress, stateId)?.status;
}

const empty = createUnitedStatesAtlasProgress();
assert.equal(getStatus(empty, "maine"), "unexplored");
assert.equal(Object.values(empty.counts).reduce((total, value) => total + value, 0), 50);

const introduced = createUnitedStatesAtlasProgress({
  unitedStatesMemoryTrailState: {
    introducedItemIds: ["state:maine"],
    itemProgress: { "state:maine": { status: "introduced" } }
  }
});
assert.equal(getStatus(introduced, "maine"), "discovered");

const learning = createUnitedStatesAtlasProgress({
  dailyTrailState: {
    itemProgress: { "state:tennessee": { status: "learning", timesSeen: 2, correctCount: 1 } }
  }
});
assert.equal(getStatus(learning, "tennessee"), "learning");

const strong = createUnitedStatesAtlasProgress({
  unitedStatesMemoryTrailState: {
    itemProgress: { "state:colorado": { status: "review", timesSeen: 3, correctCount: 3, correctStreak: 2 } }
  }
});
assert.equal(getStatus(strong, "colorado"), "strong");

const mastered = createUnitedStatesAtlasProgress({
  dailyTrailState: {
    itemProgress: { "state:louisiana": { status: "mastered", timesSeen: 4, correctCount: 7, correctStreak: 4 } }
  },
  unitedStatesMemoryTrailState: {
    introducedItemIds: ["state:louisiana"],
    itemProgress: { "state:louisiana": { status: "introduced" } }
  }
});
assert.equal(getStatus(mastered, "louisiana"), "mastered");
assert.deepEqual(getUnitedStatesAtlasStateLearningStatus(mastered, "louisiana").sources, ["Daily Trail", "United States Memory Trail"]);

const malformedStorage = { getItem: () => "{not-json" };
const fromMalformedStorage = readUnitedStatesAtlasProgress(malformedStorage);
assert.equal(getStatus(fromMalformedStorage, "alaska"), "unexplored");
const fromMissingStorage = readUnitedStatesAtlasProgress({ getItem: () => null });
assert.equal(getStatus(fromMissingStorage, "alaska"), "unexplored");

const stored = {
  mappaDailyTrailProgress: JSON.stringify({ itemProgress: { "state:maine": { status: "learning", timesSeen: 1 } } }),
  mappaUnitedStatesMemoryTrailProgress: JSON.stringify({ itemProgress: { "state:maine": { status: "mastered", timesSeen: 4, correctCount: 7, correctStreak: 4 } } })
};
const storage = { getItem: (key) => stored[key] || null };
const firstRead = readUnitedStatesAtlasProgress(storage);
firstRead.statesById.maine.status = "unexplored";
firstRead.counts.mastered = 0;
const secondRead = readUnitedStatesAtlasProgress(storage);
assert.equal(getStatus(secondRead, "maine"), "mastered");
assert.equal(secondRead.counts.mastered, 1);
assert.equal(getUnitedStatesAtlasStateLearningStatus(secondRead, "unknown-state"), null);

console.log("United States atlas progress check passed:", JSON.stringify({
  totalStates: empty.totalStates,
  statusCounts: empty.counts,
  conflictWinner: getStatus(mastered, "louisiana")
}));
