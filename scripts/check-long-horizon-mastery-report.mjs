import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  calculateMasteryMilestones,
  calculateMasterySnapshot,
  runLongHorizonMasteryMatrix
} from "./lib/long-horizon-mastery-report.mjs";
import { loadUnitedStatesSimulationFixture } from "./lib/us-simulation-fixture.mjs";
import {
  createUnitedStatesMemoryTrailState,
  planUnitedStatesMemoryTrailSession
} from "../src/united-states-memory-trail-planner.js";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const fixture = loadUnitedStatesSimulationFixture(repositoryRoot);
const fixtureSnapshot = JSON.stringify(fixture);

const milestones = calculateMasteryMilestones([
  { session: 1, after: { introduced: 2, mastered: 0 } },
  { session: 2, after: { introduced: 4, mastered: 1 } },
  { session: 3, after: { introduced: 4, mastered: 2 } },
  { session: 4, after: { introduced: 4, mastered: 4 } }
], 4);
assert.equal(milestones.firstMasteredItem, 2);
assert.equal(milestones.allCurriculumItemsIntroduced, 2);
assert.equal(milestones.mastery[25].firstSession, 2);
assert.equal(milestones.mastery[50].firstSession, 3);
assert.equal(milestones.mastery[75].firstSession, 4);
assert.equal(milestones.mastery[100].firstSession, 4);

const smallItems = [
  { id: "a", censusRegion: "West" },
  { id: "b", censusRegion: "West" },
  { id: "c", censusRegion: "South" },
  { id: "d", censusRegion: "South" }
];
const snapshot = calculateMasterySnapshot({
  items: smallItems,
  session: 10,
  state: { itemProgress: {
    a: { status: "mastered", timesSeen: 7, correctCount: 7, missCount: 0, correctStreak: 4, stability: 8, retrievability: 0.9, dueSession: 12 },
    b: { status: "review", timesSeen: 4, correctCount: 3, missCount: 1, correctStreak: 2, stability: 4, retrievability: 0.7, dueSession: 9 },
    c: { status: "relearning", timesSeen: 5, correctCount: 3, missCount: 2, correctStreak: 0, stability: 2, retrievability: 0.4, dueSession: 10 }
  } }
});
assert.deepEqual(
  { unseen: snapshot.unseen, learning: snapshot.learning, review: snapshot.review, relearning: snapshot.relearning, mastered: snapshot.mastered },
  { unseen: 1, learning: 0, review: 1, relearning: 1, mastered: 1 }
);
assert.equal(snapshot.percentageMastered, 25);
assert.equal(snapshot.validation.stateCountsSumToCurriculum, true);
assert.equal(snapshot.correctResponsesPerItem.total, 13);
assert.equal(snapshot.dueBacklog, 2);
assert.equal(snapshot.regions.West.percentageMastered, 50);

const options = {
  items: fixture.items,
  plannerSeeds: ["long-check-001"],
  profileIds: ["perfect", "single-weak-item"],
  sessionCount: 200,
  startTime: "2030-01-15T18:30:00.000Z"
};
const first = runLongHorizonMasteryMatrix(options);
const second = runLongHorizonMasteryMatrix(options);
assert.deepEqual(second, first, "Identical long-horizon inputs must replay exactly.");
assert.equal(first.validation.identicalPlannerSeedWithinMatchedGroups, true);
assert.equal(first.validation.separateAnswerSeeds, true);
assert.equal(first.validation.stateCountsValid, true);
assert.equal(first.validation.historiesOrdered, true);
assert.equal(first.validation.fixtureUnchanged, true);
assert.ok(first.runs.every((run) => Object.values(run.checkpoints).every((checkpoint) => checkpoint.validation.stateCountsSumToCurriculum)));
assert.ok(first.runs.every((run) => Object.values(run.diagnostics).every((history) => (
  history.stateTransitions.every((transition, index, transitions) => index === 0 || transition.session >= transitions[index - 1].session)
))));
const perfectRun = first.runs.find((run) => run.profile.id === "perfect");
const weakRun = first.runs.find((run) => run.profile.id === "single-weak-item");
assert.ok(perfectRun.diagnostics["capital:augusta-me"].encounters > 0, "The capital diagnostic must use its stable curriculum ID.");
assert.equal(perfectRun.perfectRunAnalysis.proxyEvidence.itemsCurrentlyMastered, 0);
assert.equal(perfectRun.perfectRunAnalysis.proxyEvidence.itemsWithAtLeastOneCorrectDemonstration, 100);
assert.deepEqual(weakRun.finalState.itemIdsByStatus.unseen, ["capital:columbus-oh"]);
assert.equal(weakRun.diagnostics["state:ohio"].encounters, 184);
assert.doesNotThrow(() => JSON.stringify(first));

const plannerState = createUnitedStatesMemoryTrailState(null, fixture.items);
const plannerOptions = { seed: "long-horizon-planner-output", now: () => new Date("2030-01-15T18:30:00.000Z") };
const planBefore = planUnitedStatesMemoryTrailSession(plannerState, fixture.items, plannerOptions);
runLongHorizonMasteryMatrix({ ...options, plannerSeeds: ["non-mutating-long-probe"], profileIds: ["perfect"] });
const planAfter = planUnitedStatesMemoryTrailSession(plannerState, fixture.items, plannerOptions);
assert.deepEqual(planAfter, planBefore, "Long-horizon reporting must not change planner output or state.");
assert.equal(JSON.stringify(fixture), fixtureSnapshot, "Long-horizon reporting must not mutate production-derived fixtures.");

console.log("Long-horizon mastery report validation passed.");
