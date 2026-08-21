import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { loadUnitedStatesSimulationFixture } from "./lib/us-simulation-fixture.mjs";
import { runNeutralUnitedStatesSelectionBalance } from "./lib/neutral-selection-balance.mjs";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const fixture = loadUnitedStatesSimulationFixture(repositoryRoot);
const options = { items: fixture.items, planCount: 1000, seedPrefix: "neutral-check" };
const first = runNeutralUnitedStatesSelectionBalance(options);
const replay = runNeutralUnitedStatesSelectionBalance(options);

assert.deepEqual(replay, first, "Neutral selection balance must replay exactly.");
assert.equal(first.selections, 10000);
assert.equal(first.neutralState.itemCount, 100);
assert.equal(first.checks.atLeastTenThousandSelections, true);
assert.equal(first.checks.noRegionOutsideTwentyPercent, true);
assert.equal(first.checks.noItemTypeOutsideTwentyPercent, true);
assert.equal(first.checks.noPromptObjectiveOutsideTwentyPercent, true);
assert.equal(first.checks.noPromptObjectiveStarved, true);
assert.equal(first.checks.noEligibleItemStarved, true);
assert.deepEqual(first.regions.map(({ id, eligible }) => [id, eligible]), [
  ["Midwest", 24], ["Northeast", 18], ["South", 32], ["West", 26]
]);
assert.deepEqual(first.itemTypes.map(({ id, eligible }) => [id, eligible]), [["capital", 50], ["state", 50]]);
assert.deepEqual(first.promptObjectiveProfiles.map(({ profile, objectives }) => [
  profile,
  Object.fromEntries(objectives.map(({ id, intendedShare }) => [id, intendedShare]))
]), [
  ["ordinary-review", { locating: 0.5, identifying: 0.5 }],
  ["early-chunk-support", { locating: 0.7, identifying: 0.3 }]
]);
assert.ok(first.promptObjectiveProfiles.every(({ objectives }) => objectives.every(({ withinTwentyPercent }) => withinTwentyPercent)));
assert.ok(first.itemSelectionRange.minimum > 0);
assert.ok(first.itemSelectionRange.maximum < 150);

const changedSeed = runNeutralUnitedStatesSelectionBalance({ ...options, seedPrefix: "neutral-check-other" });
assert.notDeepEqual(changedSeed.regions.map(({ selected }) => selected), first.regions.map(({ selected }) => selected));

console.log(`Neutral U.S. selection balance passed: ${first.selections} selections; item range ${first.itemSelectionRange.minimum}-${first.itemSelectionRange.maximum}.`);
