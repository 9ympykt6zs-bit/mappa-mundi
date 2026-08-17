import assert from "node:assert/strict";
import {
  demonstratedProgressCategory,
  renderBayesianProgressSegments,
  scoreBayesianEvidenceCounts
} from "../src/bayesian-progress-score.js";
import { createUnitedStatesProgressReport } from "../src/united-states-progress-report.js";
import {
  createUnitedStatesMemoryTrailState,
  planUnitedStatesMemoryTrailSession
} from "../src/united-states-memory-trail-planner.js";
import { loadUnitedStatesSimulationFixture } from "./lib/us-simulation-fixture.mjs";
import path from "node:path";
import { fileURLToPath } from "node:url";

assert.equal(scoreBayesianEvidenceCounts(0, 0), null);
assert.equal(scoreBayesianEvidenceCounts(1, 0), 0.5);
assert.equal(scoreBayesianEvidenceCounts(3, 0), 0.666667);
assert.equal(scoreBayesianEvidenceCounts(1, 5), 0.222222);
assert.equal(demonstratedProgressCategory(null).id, "unseen");
assert.equal(demonstratedProgressCategory(0.299999).id, "needs-review");
assert.equal(demonstratedProgressCategory(0.3).id, "demonstrated");
assert.equal(demonstratedProgressCategory(0.65).id, "strong-evidence");
assert.deepEqual(renderBayesianProgressSegments(null), {
  segmentCount: 10,
  filledCount: 0,
  emptyCount: 10,
  isUnseen: true,
  accessibleLabel: "No demonstrated-progress evidence yet"
});
assert.equal(renderBayesianProgressSegments(0).isUnseen, false, "A scored zero must not render as unseen.");
assert.equal(renderBayesianProgressSegments(0.5).filledCount, 5);

const items = [
  { id: "state:ohio", type: "state", targetId: "ohio", label: "Ohio" },
  { id: "state:maine", type: "state", targetId: "maine", label: "Maine" },
  { id: "capital:columbus-oh", type: "capital", targetId: "columbus-oh", label: "Columbus", relatedStateItemId: "state:ohio" },
  { id: "capital:augusta-me", type: "capital", targetId: "augusta-me", label: "Augusta", relatedStateItemId: "state:maine" }
];
const memoryState = {
  currentSessionNumber: 5,
  itemProgress: {
    "state:ohio": {
      status: "learning",
      timesSeen: 1,
      correctCount: 1,
      missCount: 0,
      correctStreak: 1,
      memoryState: "learning",
      dueSession: 8
    },
    "capital:columbus-oh": {
      status: "learning",
      timesSeen: 6,
      correctCount: 1,
      missCount: 5,
      correctStreak: 0,
      memoryState: "relearning",
      dueSession: 5
    }
  }
};
const inputSnapshot = JSON.stringify({ items, memoryState });
const report = createUnitedStatesProgressReport({
  items,
  unitedStatesMemoryTrailState: memoryState,
  currentDate: "2030-01-15"
});
assert.equal(JSON.stringify({ items, memoryState }), inputSnapshot, "Report generation must not mutate learner state or items.");
assert.equal(report.categories.length, 3);
assert.deepEqual(report.categories.map((category) => category.totalPossible), [2, 2, 2]);

const locations = report.categories.find((category) => category.id === "state-locations");
const identification = report.categories.find((category) => category.id === "state-identification");
const capitals = report.categories.find((category) => category.id === "state-capitals");
assert.equal(locations.demonstratedCount, 1);
assert.equal(locations.attemptedCount, 1);
assert.equal(locations.unseenCount, 1);
assert.equal(locations.records.find((record) => record.itemId === "state:ohio").displayCategory.id, "demonstrated");
assert.equal(locations.records.find((record) => record.itemId === "state:maine").displayCategory.id, "unseen");
assert.equal(locations.records.find((record) => record.itemId === "state:maine").bayesianProgressScore, null);
assert.equal(identification.records.find((record) => record.itemId === "state:ohio").bayesianProgressScore, 0.5);
assert.match(identification.records.find((record) => record.itemId === "state:ohio").evidenceHistory.note, /combines location and identification/);
assert.equal(capitals.records.find((record) => record.itemId === "capital:columbus-oh").displayCategory.id, "needs-review");
assert.equal(capitals.records.find((record) => record.itemId === "capital:columbus-oh").reviewStatus.id, "practice-now");

const signalReport = createUnitedStatesProgressReport({
  items,
  unitedStatesMemoryTrailState: memoryState,
  placeMasteryState: {
    places: {
      "state:ohio": {
        signals: {
          locating: { attempts: 3, correct: 3, incorrect: 0, currentCorrectStreak: 3, lastResult: "correct", lastAttemptAt: "2030-01-14T12:00:00.000Z" },
          naming: { attempts: 2, correct: 0, incorrect: 2, currentCorrectStreak: 0, lastResult: "incorrect", lastAttemptAt: "2030-01-15T12:00:00.000Z" },
          relationships: { attempts: 1, correct: 1, incorrect: 0, currentCorrectStreak: 1, lastResult: "correct", lastAttemptAt: "2030-01-15T13:00:00.000Z" }
        }
      }
    }
  },
  currentDate: "2030-01-15"
});
const signalLocation = signalReport.categories.find((category) => category.id === "state-locations").records.find((record) => record.itemId === "state:ohio");
const signalIdentification = signalReport.categories.find((category) => category.id === "state-identification").records.find((record) => record.itemId === "state:ohio");
assert.equal(signalLocation.bayesianProgressScore, 0.666667, "Skill-specific evidence must take priority over combined counters.");
assert.equal(signalIdentification.bayesianProgressScore, 0.2);
assert.equal(signalLocation.reviewStatus.id, "building-practice", "Review status must remain sourced from scheduler fields.");
assert.ok(signalReport.categories.some((category) => category.id === "geographic-relationships"));
assert.ok(!signalReport.categories.some((category) => category.id === "state-recognition"));

const dailyReport = createUnitedStatesProgressReport({
  items,
  unitedStatesMemoryTrailState: memoryState,
  dailyTrailItems: [{ id: "daily-state-ohio", type: "state", targetId: "ohio" }],
  dailyTrailState: { currentSessionNumber: 4, itemProgress: { "daily-state-ohio": { correctCount: 2, missCount: 1, correctStreak: 0, status: "learning" } } },
  currentDate: "2030-01-15"
});
assert.equal(dailyReport.categories.find((category) => category.id === "state-locations").records.find((record) => record.itemId === "state:ohio").bayesianProgressScore, 0.571429);

const repeat = createUnitedStatesProgressReport({
  items,
  unitedStatesMemoryTrailState: memoryState,
  currentDate: "2030-01-15"
});
assert.deepEqual(repeat, report, "Identical report inputs must render deterministically.");
assert.doesNotThrow(() => JSON.stringify(report));

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const fixture = loadUnitedStatesSimulationFixture(repositoryRoot);
const plannerState = createUnitedStatesMemoryTrailState(null, fixture.items);
const plannerStateSnapshot = JSON.stringify(plannerState);
const plannerOptions = { seed: "progress-report-planner", now: () => new Date("2030-01-15T18:30:00.000Z") };
const planBefore = planUnitedStatesMemoryTrailSession(plannerState, fixture.items, plannerOptions);
createUnitedStatesProgressReport({
  items: fixture.items,
  unitedStatesMemoryTrailState: plannerState,
  currentDate: "2030-01-15"
});
const planAfter = planUnitedStatesMemoryTrailSession(plannerState, fixture.items, plannerOptions);
assert.deepEqual(planAfter, planBefore, "Reading the progress report must not affect planner output.");
assert.equal(JSON.stringify(plannerState), plannerStateSnapshot, "Reading the progress report must not mutate planner state.");

console.log("United States Progress Report validation passed.");
