import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  runMatchedSeedSimulationMatrix,
  summarizeDistribution
} from "./lib/matched-seed-simulation-matrix.mjs";
import { runUnitedStatesLearnerSimulation } from "./lib/learner-simulation.mjs";
import { loadUnitedStatesSimulationFixture } from "./lib/us-simulation-fixture.mjs";
import {
  createUnitedStatesMemoryTrailState,
  planUnitedStatesMemoryTrailSession
} from "../src/united-states-memory-trail-planner.js";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const fixture = loadUnitedStatesSimulationFixture(repositoryRoot);
const fixtureSnapshot = JSON.stringify(fixture);
const options = {
  items: fixture.items,
  plannerSeeds: ["matrix-test-001", "matrix-test-002"],
  sessionCount: 24,
  startTime: "2030-01-15T18:30:00.000Z"
};

const first = runMatchedSeedSimulationMatrix(options);
const second = runMatchedSeedSimulationMatrix(options);
assert.deepEqual(second, first, "Identical full inputs must reproduce the exact matrix.");
assert.equal(first.validation.samePlannerSeedWithinGroups, true);
assert.equal(first.validation.answerSeedSeparateFromPlannerSeed, true);
assert.equal(first.validation.answerSeedSharedWithinGroups, true);
assert.equal(first.validation.fixtureUnchanged, true);
assert.equal(first.runs.length, options.plannerSeeds.length * 5);
for (const plannerSeed of options.plannerSeeds) {
  const group = first.runs.filter((run) => run.plannerSeed === plannerSeed);
  assert.equal(group.length, 5);
  assert.equal(new Set(group.map((run) => run.plannerSeed)).size, 1);
  assert.equal(new Set(group.map((run) => run.answerSeed)).size, 1);
  assert.notEqual(group[0].plannerSeed, group[0].answerSeed);
}
assert.deepEqual(summarizeDistribution([8, 1, 4, 2]), { count: 4, median: 3, min: 1, max: 8 });
assert.deepEqual(summarizeDistribution([null, 7, undefined]), { count: 1, median: 7, min: 7, max: 7 });
const perfectIntroduced = first.runs.filter((run) => run.profileId === "perfect").map((run) => run.progression.itemsIntroduced);
assert.deepEqual(
  first.aggregate.profiles.perfect.metrics["progression.itemsIntroduced"],
  summarizeDistribution(perfectIntroduced),
  "Profile aggregates must be calculated from their matching runs."
);
const expectedOhioDeltas = options.plannerSeeds.map((plannerSeed) => {
  const perfect = first.runs.find((run) => run.plannerSeed === plannerSeed && run.profileId === "perfect");
  const weak = first.runs.find((run) => run.plannerSeed === plannerSeed && run.profileId === "single-weak-item");
  return weak.diagnosticItems["state:ohio"].encounters - perfect.diagnosticItems["state:ohio"].encounters;
});
assert.deepEqual(
  first.aggregate.pairwise["perfect-vs-single-weak-item"].deltas.OhioEncounters,
  summarizeDistribution(expectedOhioDeltas),
  "Pairwise aggregates must use matched-seed deltas."
);
assert.doesNotThrow(() => JSON.stringify(first));

const common = {
  profileId: "random",
  items: fixture.items,
  seed: "legacy-seed",
  sessionCount: 36,
  startTime: "2030-01-15T18:30:00.000Z"
};
const legacy = runUnitedStatesLearnerSimulation(common);
const explicitLegacyDependencies = runUnitedStatesLearnerSimulation({
  ...common,
  plannerSeed: "legacy-seed",
  answerSeed: "legacy-seed:answers"
});
assert.deepEqual(explicitLegacyDependencies, legacy, "Explicit legacy dependencies must preserve default harness behavior.");

const seedA = runUnitedStatesLearnerSimulation({ ...common, plannerSeed: "planner-a", answerSeed: "shared-answers" });
const seedB = runUnitedStatesLearnerSimulation({ ...common, plannerSeed: "planner-b", answerSeed: "shared-answers" });
assert.notDeepEqual(
  seedA.sessions.map((session) => session.selected),
  seedB.sessions.map((session) => session.selected),
  "Different planner seeds must be able to produce different valid trajectories."
);
const answersA = runUnitedStatesLearnerSimulation({ ...common, plannerSeed: "shared-planner", answerSeed: "answers-a" });
const answersB = runUnitedStatesLearnerSimulation({ ...common, plannerSeed: "shared-planner", answerSeed: "answers-b" });
assert.notEqual(answersA.summary.correct, answersB.summary.correct, "Answer randomness must be separately controllable.");

const plannerState = createUnitedStatesMemoryTrailState(null, fixture.items);
const plannerOptions = { seed: "matrix-planner-output", now: () => new Date("2030-01-15T18:30:00.000Z") };
const before = planUnitedStatesMemoryTrailSession(plannerState, fixture.items, plannerOptions);
runMatchedSeedSimulationMatrix({ ...options, plannerSeeds: ["non-mutating-probe"], sessionCount: 6 });
const after = planUnitedStatesMemoryTrailSession(plannerState, fixture.items, plannerOptions);
assert.deepEqual(after, before, "Matrix reporting must not change planner output or state.");
assert.equal(JSON.stringify(fixture), fixtureSnapshot, "Matrix reporting must not mutate the production-derived fixture.");

console.log("Matched-seed simulation matrix validation passed.");
