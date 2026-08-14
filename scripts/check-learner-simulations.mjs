import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  runDailyTrailReturnProbe,
  runUnitedStatesLearnerSimulation,
  SYNTHETIC_LEARNER_PROFILES
} from "./lib/learner-simulation.mjs";
import { loadUnitedStatesSimulationFixture } from "./lib/us-simulation-fixture.mjs";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const fixture = loadUnitedStatesSimulationFixture(repositoryRoot);
const fixtureBefore = JSON.stringify(fixture);
const common = { items: fixture.items, sessionCount: 36, startTime: "2030-01-15T18:30:00.000Z" };

for (const profile of SYNTHETIC_LEARNER_PROFILES) {
  const options = { ...common, profileId: profile.id, seed: `test:${profile.id}` };
  const first = runUnitedStatesLearnerSimulation(options);
  const second = runUnitedStatesLearnerSimulation(options);
  assert.deepEqual(second, first, `${profile.id} must replay exactly with the same seed and clock.`);
  assert.equal(first.summary.sessionsSimulated, 36);
  assert.ok(first.summary.encounters > 0, `${profile.id} must execute learner answers.`);
  assert.equal(first.learningProgression.length, 3);
  assert.doesNotThrow(() => JSON.stringify(first.inspector));
  assert.ok(first.inspector.transitions.length > 0);
  assert.equal(first.healthChecks.deterministicReplay.status, "not-run");
  assert.equal(first.healthChecks.deterministicReplay.replayEquivalent, null);
}

const randomA = runUnitedStatesLearnerSimulation({ ...common, profileId: "random", seed: "random-a" });
const randomB = runUnitedStatesLearnerSimulation({ ...common, profileId: "random", seed: "random-b" });
assert.notDeepEqual(
  randomA.sessions.map((session) => [session.correct, session.incorrect]),
  randomB.sessions.map((session) => [session.correct, session.incorrect]),
  "Different seeds must change the deterministic random learner's answer pattern."
);
assert.equal(JSON.stringify(fixture), fixtureBefore, "Simulations must not mutate the production-derived fixture.");

const returnProbe = runDailyTrailReturnProbe({ items: fixture.items });
assert.ok(returnProbe.initialSelected.length > 0);
assert.ok(returnProbe.returnSelected.length > 0);
assert.equal(returnProbe.returnSelectionExplanation.deterministicContext.time.value, "2030-03-01T18:30:00.000Z");
assert.doesNotThrow(() => JSON.stringify(returnProbe));

console.log("Deterministic synthetic learner simulations passed.");
