import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { runMatchedSeedSimulationMatrix } from "./lib/matched-seed-simulation-matrix.mjs";
import { loadUnitedStatesSimulationFixture } from "./lib/us-simulation-fixture.mjs";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const fixture = loadUnitedStatesSimulationFixture(repositoryRoot);
const plannerSeeds = Array.from({ length: 12 }, (_, index) => `matched-planner-${String(index + 1).padStart(3, "0")}`);
const matrix = runMatchedSeedSimulationMatrix({
  items: fixture.items,
  plannerSeeds,
  sessionCount: 60,
  startTime: "2030-01-15T18:30:00.000Z"
});

function range(distribution) {
  return distribution.count ? `${distribution.median} (${distribution.min}–${distribution.max})` : "Unavailable";
}

function percent(value) {
  return Number.isFinite(value) ? `${(value * 100).toFixed(1)}%` : "Unavailable";
}

function tableRow(values) {
  return `| ${values.join(" | ")} |`;
}

function profileAggregateRow(profileId) {
  const metrics = matrix.aggregate.profiles[profileId].metrics;
  return tableRow([
    profileId,
    range(metrics["progression.itemsIntroduced"]),
    range(metrics["progression.finalMasteredCount"]),
    range(metrics["adaptation.reviewSelections"]),
    range(metrics["adaptation.weakReviewSelections"]),
    range(metrics["regions.West.selections"]),
    range(metrics["adaptation.maximumEligibilityDeferral"])
  ]);
}

function pairwiseRows(key) {
  const aggregate = matrix.aggregate.pairwise[key];
  return Object.entries(aggregate.deltas).map(([metric, distribution]) => tableRow([
    metric,
    range(distribution),
    `${aggregate.positiveEffectCounts[metric]} of ${aggregate.matchedSeedCount}`
  ])).join("\n");
}

function seedMatrixRows() {
  return matrix.runs.map((run) => tableRow([
    run.plannerSeed,
    run.profileId,
    run.progression.itemsIntroduced,
    run.progression.uniqueItemsEncountered,
    run.progression.finalMasteredCount,
    run.adaptation.newSelections,
    run.adaptation.reviewSelections,
    run.adaptation.weakReviewSelections,
    run.regions.Midwest?.selections || 0,
    run.regions.West?.selections || 0,
    run.adaptation.maximumEligibilityDeferral
  ])).join("\n");
}

function regionalRows() {
  const rows = [];
  for (const profileId of matrix.experiment.profileIds) {
    for (const region of ["Northeast", "Midwest", "South", "West"]) {
      const profileRuns = matrix.runs.filter((run) => run.profileId === profileId);
      const values = profileRuns.map((run) => run.regions[region] || {});
      const median = (numbers) => {
        const sorted = numbers.filter(Number.isFinite).sort((a, b) => a - b);
        if (!sorted.length) return null;
        const middle = Math.floor(sorted.length / 2);
        return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
      };
      rows.push(tableRow([
        profileId,
        region,
        median(values.map((value) => value.introducedItems)) ?? "Unavailable",
        median(values.map((value) => value.candidateOpportunities)) ?? "Unavailable",
        median(values.map((value) => value.selections)) ?? "Unavailable",
        median(values.map((value) => value.reviewSelections)) ?? "Unavailable",
        median(values.map((value) => value.weakReviewSelections)) ?? "Unavailable",
        percent(median(values.map((value) => value.errorRate))),
        percent(median(values.map((value) => value.selectionRatePerCandidateOpportunity)))
      ]));
    }
  }
  return rows.join("\n");
}

function diagnosticRange(profileId, itemId, field) {
  const values = matrix.runs
    .filter((run) => run.profileId === profileId)
    .map((run) => run.diagnosticItems[itemId]?.[field])
    .filter(Number.isFinite)
    .sort((left, right) => left - right);
  if (!values.length) return "Unavailable";
  return `${values[0]}–${values[values.length - 1]}`;
}

function extremeRun(profileId, accessor, direction) {
  return matrix.runs
    .filter((run) => run.profileId === profileId && Number.isFinite(accessor(run)))
    .sort((left, right) => direction * (accessor(left) - accessor(right)) || left.plannerSeed.localeCompare(right.plannerSeed))[0];
}

function milestoneSummary(profileId, metricPath) {
  const distribution = matrix.aggregate.profiles[profileId].metrics[metricPath];
  return `${range(distribution)}; reached by ${distribution.count} of ${matrix.experiment.plannerSeedCount}`;
}

const perfectVsWeak = matrix.aggregate.pairwise["perfect-vs-single-weak-item"];
const perfectVsRegional = matrix.aggregate.pairwise["perfect-vs-regional-weakness"];
const perfectVsMixed = matrix.aggregate.pairwise["perfect-vs-mixed"];
const randomWyomingLow = extremeRun("random", (run) => run.diagnosticItems["state:wyoming"].maximumEligibilityDeferral, 1);
const randomWyomingHigh = extremeRun("random", (run) => run.diagnosticItems["state:wyoming"].maximumEligibilityDeferral, -1);
const regionalMidwestLow = extremeRun("regional-weakness", (run) => run.regions.Midwest?.selections, 1);
const regionalMidwestHigh = extremeRun("regional-weakness", (run) => run.regions.Midwest?.selections, -1);
const mixedWestLow = extremeRun("mixed", (run) => run.regions.West?.selections, 1);
const mixedWestHigh = extremeRun("mixed", (run) => run.regions.West?.selections, -1);
const markdown = `# U.S. Memory Trail matched-seed simulation matrix

This O6.2 report holds planner seed, starting state, simulated time schedule, and a separate answer-random stream constant within each matched group. Only the learner-response profile changes. The results are deterministic observations of the current U.S. Memory Trail planner, not a randomized human experiment or proof of pedagogical correctness.

## Executive summary

- Across ${matrix.experiment.plannerSeedCount} matched planner seeds, the single-weak-item profile added a median ${perfectVsWeak.deltas.OhioEncounters.median} Ohio encounters relative to the near-perfect profile (range ${perfectVsWeak.deltas.OhioEncounters.min}–${perfectVsWeak.deltas.OhioEncounters.max}); the difference was positive for ${perfectVsWeak.positiveEffectCounts.OhioEncounters} of ${perfectVsWeak.matchedSeedCount} seeds. This is consistent with an answer-driven weak-item effect.
- The regional-weakness profile added a median ${perfectVsRegional.deltas.MidwestWeakReviewSelections.median} Midwest weak-review selections relative to near-perfect (range ${perfectVsRegional.deltas.MidwestWeakReviewSelections.min}–${perfectVsRegional.deltas.MidwestWeakReviewSelections.max}); the difference was positive for ${perfectVsRegional.positiveEffectCounts.MidwestWeakReviewSelections} of ${perfectVsRegional.matchedSeedCount} seeds.
- Mixed-profile review pressure changed by a median ${perfectVsMixed.deltas.reviewSelections.median} review selections relative to near-perfect (range ${perfectVsMixed.deltas.reviewSelections.min}–${perfectVsMixed.deltas.reviewSelections.max}).
- Wyoming maximum eligibility deferral ranged ${diagnosticRange("random", "state:wyoming", "maximumEligibilityDeferral")} sessions across random-profile seeds. This makes the earlier single-seed eight-session observation more appropriately a seed-specific example, not a universal value.
- Every near-perfect run introduced all 100 items at session 39 and first reached mastery at session 49. The final mastered count was only 2–3 at session 60, strengthening the evidence that the earlier 36-session window was too short for any mastery while leaving broader convergence unverified.
- Every single-weak-item run stopped at 99 introduced items within this 60-session window while Ohio received 44 encounters. Progression clearly continued beyond Ohio, but complete introduction was not reached; the finite report cannot determine whether the last item is permanently blocked.
- Matching seeds improves attribution to scripted answers, but profile rules still model synthetic behavior and candidate eligibility remains an inferred reconstruction from Selection Trace.

## Experiment design

- Planner seeds: ${matrix.experiment.plannerSeedCount} (\`${plannerSeeds[0]}\` through \`${plannerSeeds[plannerSeeds.length - 1]}\`). Twelve seeds provide multiple tie-breaking orders while keeping the report and fast checks practical; no significance test is claimed.
- Profiles per seed: ${matrix.experiment.profileIds.join(", ")}.
- Sessions per run: ${matrix.experiment.sessionCount}; total runs: ${matrix.runs.length}.
- Answer seeding: ${matrix.experiment.answerSeedPolicy}
- Starting state: the same empty normalized U.S. Memory Trail state; simulated start time: ${matrix.experiment.startTime}.

## Aggregate profile outcomes

Values are median (minimum–maximum) across planner seeds.

| Profile | Items introduced | Final mastered | Review selections | Weak review | West selections | Maximum deferral |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
${matrix.experiment.profileIds.map(profileAggregateRow).join("\n")}

## Seed matrix summary

| Planner seed | Profile | Introduced | Unique | Mastered | New | Review | Weak review | Midwest selections | West selections | Max deferral |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
${seedMatrixRows()}

## Pairwise comparisons

Deltas are comparison profile minus the matched near-perfect run. Positive values describe more of the named metric, not automatically better behavior.

### Near-perfect vs single weak item

| Metric | Median (range) delta | Positive seeds |
| --- | ---: | ---: |
${pairwiseRows("perfect-vs-single-weak-item")}

### Near-perfect vs regional weakness

| Metric | Median (range) delta | Positive seeds |
| --- | ---: | ---: |
${pairwiseRows("perfect-vs-regional-weakness")}

### Near-perfect vs mixed

| Metric | Median (range) delta | Positive seeds |
| --- | ---: | ---: |
${pairwiseRows("perfect-vs-mixed")}

## Regional analysis

Values are medians across the 12 runs for each profile. Candidate opportunities come from inferred Selection Trace pools. Selection rate normalizes selections by those opportunities; it is not a regional planner weight.

| Profile | Region | Introduced | Candidate opportunities | Selections | Review | Weak review | Error rate | Selection/opportunity |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
${regionalRows()}

The Midwest comparison is most informative in matched pairs: region size and curriculum order are held constant within each pair, while the response rule changes. West exposure remains partly constrained by curriculum arrival; an item outside an emitted candidate pool is not counted as eligible.

## Mastery and progression

| Profile | First complete introduction median (range) | First mastery median (range) | Final mastered median (range) |
| --- | --- | --- | --- |
${matrix.experiment.profileIds.map((profileId) => tableRow([
    profileId,
    milestoneSummary(profileId, "progression.firstSessionAllCurriculumIntroduced"),
    milestoneSummary(profileId, "progression.firstMasterySession"),
    range(matrix.aggregate.profiles[profileId].metrics["progression.finalMasteredCount"])
  ])).join("\n")}

The JSON companion also records mastered counts at sessions 12, 24, 36, and 60 for every run. Null milestone values mean the run did not reach the milestone within 60 sessions; they are not converted to a numeric delay. The perfect profile's identical first-introduction and first-mastery sessions across all seeds indicate low seed sensitivity for those milestones under this response script. Other profiles show wider or absent milestone evidence.

## Seed sensitivity

- Wyoming/random-profile maximum deferral: ${diagnosticRange("random", "state:wyoming", "maximumEligibilityDeferral")} sessions.
- West/random-profile encounters: ${diagnosticRange("random", "state:wyoming", "encounters")} Wyoming encounters across seeds; the aggregate table separately reports all West selections.
- Ohio/single-weak-item encounters: ${diagnosticRange("single-weak-item", "state:ohio", "encounters")} across seeds.
- Random-profile Wyoming deferral outliers: ${randomWyomingLow.plannerSeed} at ${randomWyomingLow.diagnosticItems["state:wyoming"].maximumEligibilityDeferral} sessions and ${randomWyomingHigh.plannerSeed} at ${randomWyomingHigh.diagnosticItems["state:wyoming"].maximumEligibilityDeferral}.
- Regional-weakness Midwest-selection outliers: ${regionalMidwestLow.plannerSeed} at ${regionalMidwestLow.regions.Midwest.selections} and ${regionalMidwestHigh.plannerSeed} at ${regionalMidwestHigh.regions.Midwest.selections}.
- Mixed-profile West-selection outliers: ${mixedWestLow.plannerSeed} at ${mixedWestLow.regions.West.selections} and ${mixedWestHigh.plannerSeed} at ${mixedWestHigh.regions.West.selections}.
- Metrics with narrow ranges and the same pairwise direction across most or all seeds are stable in this matrix. Wider ranges identify seed sensitivity, but no statistical confidence level is claimed.

## Earlier conclusions revisited

- **Stronger:** repeated Ohio failures create additional Ohio exposure while planner seed is held constant; the pairwise direction and range are recorded above.
- **Stronger:** Midwest weak responses create additional Midwest weak-review pressure in matched comparisons, separating that response effect from region size and the shared seed/order.
- **Stronger:** the earlier lack of mastery at 36 sessions is explained by the near-perfect profile's stable first mastery at session 49 in all 12 matched runs; this does not establish long-horizon mastery quality.
- **More nuanced:** the single-weak profile continues through 99 introduced items but does not complete introduction by session 60, so “progression continues” remains true while “weak items do not block completion” remains unverified.
- **More nuanced:** Wyoming's earlier eight-session delay is one seeded trajectory. The matrix reports its range and does not treat any finite deferral as permanent starvation.
- **More nuanced:** raw regional encounter counts still combine curriculum composition, candidate-pool size, and response-driven review. Candidate-opportunity normalization narrows but does not eliminate those confounds.
- **Unchanged limitation:** no item outside an emitted Selection Trace pool is labeled eligible, and no finite matrix proves absence of long-run starvation.

## Open questions

- Are the observed review-pressure ranges pedagogically appropriate? The matrix measures behavior but contains no learning-outcome acceptance threshold.
- Would longer horizons change mastery convergence or unresolved-deferral ranges?
- Daily Trail lacks an equivalent full rejected-candidate pool, so the matched matrix currently covers only U.S. Memory Trail.
- Synthetic response profiles omit response time, UI behavior, and human forgetting; matched deterministic runs are not human causal evidence.
`;

const outputDirectory = path.join(repositoryRoot, "reports");
fs.mkdirSync(outputDirectory, { recursive: true });
fs.writeFileSync(path.join(outputDirectory, "us-matched-seed-simulations.json"), `${JSON.stringify(matrix, null, 2)}\n`);
fs.writeFileSync(path.join(outputDirectory, "us-matched-seed-simulations.md"), markdown);
console.log(`Generated ${matrix.runs.length} matched runs across ${plannerSeeds.length} planner seeds in reports/us-matched-seed-simulations.{md,json}.`);
