import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildUnitedStatesEligibilityDelayReport } from "./lib/eligibility-delay-report.mjs";
import { runUnitedStatesLearnerSimulation, SYNTHETIC_LEARNER_PROFILES } from "./lib/learner-simulation.mjs";
import { loadUnitedStatesSimulationFixture } from "./lib/us-simulation-fixture.mjs";
import {
  createUnitedStatesMemoryTrailState,
  planUnitedStatesMemoryTrailSession
} from "../src/united-states-memory-trail-planner.js";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const fixture = loadUnitedStatesSimulationFixture(repositoryRoot);
const fixtureSnapshot = JSON.stringify(fixture);

for (const profile of SYNTHETIC_LEARNER_PROFILES) {
  const options = {
    profileId: profile.id,
    items: fixture.items,
    seed: `eligibility-test:${profile.id}`,
    sessionCount: 36,
    startTime: "2030-01-15T18:30:00.000Z"
  };
  const simulation = runUnitedStatesLearnerSimulation(options);
  const simulationSnapshot = JSON.stringify(simulation);
  const first = buildUnitedStatesEligibilityDelayReport({ simulation, items: fixture.items });
  const second = buildUnitedStatesEligibilityDelayReport({ simulation, items: fixture.items });
  assert.deepEqual(second, first, `${profile.id} eligibility report must replay exactly.`);
  assert.equal(JSON.stringify(simulation), simulationSnapshot, "Analysis must not mutate planner/simulation output.");
  assert.equal(first.validation.eligibilityAndSelectionSeparated, true);
  assert.deepEqual(first.validation.selectedWithoutEligibility, []);
  assert.equal(first.validation.itemIdsStable, true);
  assert.equal(first.items.length, fixture.items.length);
  assert.ok(first.items.every((item) => typeof item.itemId === "string" && item.itemId.length > 0));
  assert.ok(first.items.every((item) => item.selectedSessions.every((session) => item.eligibleSessions.includes(session))));
  assert.doesNotThrow(() => JSON.stringify(first));
  const unavailableItem = first.items.find((item) => item.eligibleSessionCount === 0);
  if (unavailableItem) assert.equal(unavailableItem.firstEligibleSession.availability, "unavailable");
}

const randomSimulation = runUnitedStatesLearnerSimulation({
  profileId: "random",
  items: fixture.items,
  seed: "o4:random:v1",
  sessionCount: 36,
  startTime: "2030-01-15T18:30:00.000Z"
});
const randomReport = buildUnitedStatesEligibilityDelayReport({ simulation: randomSimulation, items: fixture.items });
const wyoming = randomReport.items.find((item) => item.itemId === "state:wyoming");
assert.equal(wyoming.maximumObservedDeferral, 8, "The report must preserve the previously observed Wyoming deferral.");
const longestWyomingEpisode = [...wyoming.unresolvedDelayEpisodes].sort((left, right) => right.delay - left.delay)[0];
assert.deepEqual(longestWyomingEpisode.eligibleButNotSelectedSessions, [29, 30, 31, 32, 33, 34, 35, 36]);

const plannerState = createUnitedStatesMemoryTrailState(null, fixture.items);
const plannerOptions = { seed: "eligibility-planner-output", now: () => new Date("2030-01-15T18:30:00.000Z") };
const planBeforeAnalysis = planUnitedStatesMemoryTrailSession(plannerState, fixture.items, plannerOptions);
buildUnitedStatesEligibilityDelayReport({ simulation: randomSimulation, items: fixture.items });
const planAfterAnalysis = planUnitedStatesMemoryTrailSession(plannerState, fixture.items, plannerOptions);
assert.deepEqual(planAfterAnalysis, planBeforeAnalysis, "Eligibility analysis must not change planner output.");

const weakSimulation = runUnitedStatesLearnerSimulation({
  profileId: "single-weak-item",
  items: fixture.items,
  seed: "o4:single-weak-item:v1",
  sessionCount: 36,
  startTime: "2030-01-15T18:30:00.000Z"
});
const weakReport = buildUnitedStatesEligibilityDelayReport({ simulation: weakSimulation, items: fixture.items });
const ohio = weakReport.items.find((item) => item.itemId === "state:ohio");
assert.equal(ohio.maximumObservedDeferral, 0, "Repeated selection must not be confused with eligibility delay.");
assert.equal(ohio.maximumConsecutiveSelectedSessions, 20);
assert.equal(JSON.stringify(fixture), fixtureSnapshot, "Analysis must not mutate the production-derived fixture.");

console.log("Eligibility delay report validation passed.");
