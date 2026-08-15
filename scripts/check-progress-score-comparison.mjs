import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  EXPERIMENTAL_PROGRESS_MODELS,
  runExperimentalProgressModel,
  scoreCurrentSystemProxy
} from "./lib/experimental-progress-score-models.mjs";
import { buildExperimentalProgressScoreComparison } from "./lib/progress-score-comparison.mjs";
import { loadUnitedStatesSimulationFixture } from "./lib/us-simulation-fixture.mjs";
import {
  createUnitedStatesMemoryTrailState,
  planUnitedStatesMemoryTrailSession
} from "../src/united-states-memory-trail-planner.js";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const fixture = loadUnitedStatesSimulationFixture(repositoryRoot);
const fixtureSnapshot = JSON.stringify(fixture);
const history = [true, true, false, { type: "gap", days: 365 }, true];
const historySnapshot = JSON.stringify(history);

for (const model of EXPERIMENTAL_PROGRESS_MODELS) {
  const first = runExperimentalProgressModel(model.id, history);
  const second = runExperimentalProgressModel(model.id, history);
  assert.deepEqual(second, first, `${model.id} must replay identical evidence exactly.`);
  assert.equal(JSON.stringify(history), historySnapshot, `${model.id} must not mutate evidence.`);
  assert.ok(first.score >= 0 && first.score <= 1);
  assert.ok(first.trajectory.every((step) => step.scoreAfter === null || (step.scoreAfter >= 0 && step.scoreAfter <= 1)));
  const gap = first.trajectory.find((step) => step.event.type === "gap");
  assert.equal(gap.scoreBefore, gap.scoreAfter, `${model.id} must not decay during absence unless explicitly time-sensitive.`);
  assert.equal(gap.changedWithoutResponse, false);
}

const bayesian = runExperimentalProgressModel("bayesian-evidence", [true, false]);
assert.equal(bayesian.finalState.alpha, 2);
assert.equal(bayesian.finalState.beta, 3);
assert.equal(bayesian.score, 0.4);

const bkt = runExperimentalProgressModel("bkt-inspired", [true]);
const posterior = (0.2 * 0.9) / ((0.2 * 0.9) + (0.8 * 0.25));
const expectedBkt = posterior + (1 - posterior) * 0.12;
assert.ok(Math.abs(bkt.finalState.lastPosteriorBeforeLearning - posterior) < 1e-12);
assert.ok(Math.abs(bkt.score - Number(expectedBkt.toFixed(6))) < 1e-12);

assert.equal(scoreCurrentSystemProxy(null), null);
assert.equal(scoreCurrentSystemProxy({ timesSeen: 1, correctCount: 1, correctStreak: 1 }), 0.560714);

const reportA = buildExperimentalProgressScoreComparison({ items: fixture.items });
const reportB = buildExperimentalProgressScoreComparison({ items: fixture.items });
assert.deepEqual(reportB, reportA, "Identical comparison inputs must produce identical reports.");
assert.equal(reportA.validation.fixtureUnchanged, true);
assert.equal(reportA.validation.allScoresBounded, true);
assert.equal(reportA.validation.longAbsenceChangesOnlyTimeSensitiveModels, true);
assert.equal(reportA.canonicalSequences.length, 16);
assert.ok(reportA.canonicalSequences.every((sequence) => Object.values(sequence.models).every((model) => (
  model.score === null || (model.score >= 0 && model.score <= 1)
))));
assert.ok(reportA.syntheticProfiles.every((profile) => Object.values(profile.models).every((model) => (
  Object.values(model.diagnostics).every((diagnostic) => diagnostic.score === null || (diagnostic.score >= 0 && diagnostic.score <= 1))
))));
assert.ok(reportA.syntheticProfiles.every((profile) => (
  Object.values(profile.models["current-system-proxy"].diagnostics).every((diagnostic) => diagnostic.currentProxyMatchesPlannerCounters)
)));
assert.ok(Object.values(reportA.perfectFiftyStateLocationPass).every((analysis) => analysis.bandCounts.medium === 50));
assert.doesNotThrow(() => JSON.stringify(reportA));

const plannerState = createUnitedStatesMemoryTrailState(null, fixture.items);
const plannerOptions = { seed: "progress-score-planner-output", now: () => new Date("2030-01-15T18:30:00.000Z") };
const planBefore = planUnitedStatesMemoryTrailSession(plannerState, fixture.items, plannerOptions);
buildExperimentalProgressScoreComparison({ items: fixture.items });
const planAfter = planUnitedStatesMemoryTrailSession(plannerState, fixture.items, plannerOptions);
assert.deepEqual(planAfter, planBefore, "Experimental scoring must not change planner output or learner state.");
assert.equal(JSON.stringify(fixture), fixtureSnapshot, "Experimental scoring must not mutate production-derived fixtures.");

console.log("Experimental progress score comparison validation passed.");
