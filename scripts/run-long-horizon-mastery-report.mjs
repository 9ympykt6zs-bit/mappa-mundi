import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  LONG_HORIZON_CHECKPOINTS,
  LONG_HORIZON_DIAGNOSTIC_ITEMS,
  runLongHorizonMasteryMatrix
} from "./lib/long-horizon-mastery-report.mjs";
import { summarizeDistribution } from "./lib/matched-seed-simulation-matrix.mjs";
import { loadUnitedStatesSimulationFixture } from "./lib/us-simulation-fixture.mjs";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const fixture = loadUnitedStatesSimulationFixture(repositoryRoot);
const plannerSeeds = Array.from({ length: 6 }, (_, index) => `long-planner-${String(index + 1).padStart(3, "0")}`);
const report = runLongHorizonMasteryMatrix({
  items: fixture.items,
  plannerSeeds,
  sessionCount: 200,
  startTime: "2030-01-15T18:30:00.000Z"
});

function tableRow(values) {
  return `| ${values.join(" | ")} |`;
}

function range(distribution) {
  return distribution.count ? `${distribution.median} (${distribution.min}–${distribution.max})` : "Not reached";
}

function profileRuns(profileId) {
  return report.runs.filter((run) => run.profile.id === profileId);
}

function snapshotDistribution(profileId, session, field) {
  return summarizeDistribution(profileRuns(profileId).map((run) => run.checkpoints[session][field]));
}

function masteryCurveRows() {
  return report.experiment.profileIds.flatMap((profileId) => LONG_HORIZON_CHECKPOINTS.map((session) => {
    const field = (name) => range(snapshotDistribution(profileId, session, name));
    return tableRow([
      profileId,
      session,
      field("itemsIntroduced"),
      field("unseen"),
      field("learning"),
      field("review"),
      field("relearning"),
      field("mastered"),
      field("percentageMastered")
    ]);
  })).join("\n");
}

function milestoneRows() {
  return report.experiment.profileIds.map((profileId) => {
    const aggregate = report.aggregate.profiles[profileId].milestones;
    return tableRow([
      profileId,
      range(aggregate.allCurriculumItemsIntroduced),
      range(aggregate.firstMasteredItem),
      ...[25, 50, 75, 90, 95, 100].map((percentage) => range(aggregate.mastery[percentage]))
    ]);
  }).join("\n");
}

function statusPath(history) {
  if (!history.stateTransitions.length) return "No status transitions";
  return history.stateTransitions.map((transition) => `${transition.session}:${transition.from}→${transition.to}`).join(", ");
}

function diagnosticRows() {
  return report.experiment.profileIds.flatMap((profileId) => {
    const run = profileRuns(profileId)[0];
    return LONG_HORIZON_DIAGNOSTIC_ITEMS.map((itemId) => {
      const history = run.diagnostics[itemId];
      return tableRow([
        profileId,
        itemId,
        history.introductionSession ?? "Not introduced",
        history.encounters,
        history.correctResponses,
        history.misses,
        history.firstMasterySession ?? "Not reached",
        history.masteryLapses.length,
        history.masteryLapses.map((lapse) => `${lapse.lapseSession}→${lapse.recoverySession ?? "unrecovered"}`).join(", ") || "None",
        statusPath(history)
      ]);
    });
  }).join("\n");
}

function regionalPressureRows() {
  const aggregate = report.aggregate.profiles["regional-weakness"].postIntroductionRegionalReview;
  return ["Northeast", "Midwest", "South", "West"].map((region) => tableRow([
    region,
    range(aggregate[region].candidateOpportunities),
    range(aggregate[region].reviewSelections),
    range(aggregate[region].weakReviewSelections),
    range(aggregate[region].selectionRatePerCandidateOpportunity)
  ])).join("\n");
}

function regionalRows() {
  return report.experiment.profileIds.flatMap((profileId) => ["Northeast", "Midwest", "South", "West"].map((region) => {
    const values = report.aggregate.profiles[profileId].finalRegionalMastery[region];
    return tableRow([profileId, region, range(values.mastered), range(values.percentageMastered)]);
  })).join("\n");
}

function reviewRows() {
  return report.experiment.profileIds.map((profileId) => {
    const values = report.aggregate.profiles[profileId].reviewLoad;
    return tableRow([
      profileId,
      range(values.first25Average),
      range(values.last25Average),
      `${values.declineObservedCount} of ${values.first25Average.count}`
    ]);
  }).join("\n");
}

function diagnosticDistribution(profileId, itemId, field) {
  return summarizeDistribution(profileRuns(profileId).map((run) => run.diagnostics[itemId][field]));
}

const perfect = report.aggregate.profiles.perfect;
const weak = report.aggregate.profiles["single-weak-item"];
const perfectAtIntroduction = profileRuns("perfect").map((run) => run.perfectRunAnalysis.proxyEvidence);
const masteredAtIntroduction = summarizeDistribution(perfectAtIntroduction.map((evidence) => evidence.itemsCurrentlyMastered));
const correctAtIntroduction = summarizeDistribution(perfectAtIntroduction.map((evidence) => evidence.totalCorrectDemonstrations));
const itemsCorrectAtIntroduction = summarizeDistribution(perfectAtIntroduction.map((evidence) => evidence.itemsWithAtLeastOneCorrectDemonstration));
const missesAtIntroduction = summarizeDistribution(perfectAtIntroduction.map((evidence) => evidence.totalMisses));
const weakOhioEncounters = diagnosticDistribution("single-weak-item", "state:ohio", "encounters");
const weakOther99 = weak.checkpoints[200].masteredExcludingOhio;
const perfectOther99 = perfect.checkpoints[200].masteredExcludingOhio;
const markdown = `# U.S. Memory Trail long-horizon mastery report

This O6.3 report observes the production U.S. Memory Trail item-state model for 200 deterministic sessions. It does not change or endorse the current thresholds, scheduling, priorities, learner-state semantics, or content.

## Executive summary

- Near-perfect learners reached 25% mastery at ${range(perfect.milestones.mastery[25])}, 50% at ${range(perfect.milestones.mastery[50])}, 75% at ${range(perfect.milestones.mastery[75])}, 90% at ${range(perfect.milestones.mastery[90])}, and 95% at ${range(perfect.milestones.mastery[95])}. None reached 100% by session 200.
- All 100 items were first introduced for near-perfect learners at ${range(perfect.milestones.allCurriculumItemsIntroduced)}. At that point all ${range(itemsCorrectAtIntroduction)} items had at least one correct demonstration, with ${range(correctAtIntroduction)} correct and ${range(missesAtIntroduction)} incorrect demonstrations overall, but ${range(masteredAtIntroduction)} items were currently mastered.
- The single-weak learner encountered Ohio ${range(weakOhioEncounters)} times—every session from its introduction through session 200. Ohio continuously occupied the weak-review opportunity, and its unmet prerequisite kept Columbus unintroduced; the other 98 introduced items nevertheless reached mastery by session 150 in every seed.
- The current Memory Trail state has no separate domain-level “I know the United States” or full-error-free-pass state. Broad demonstrated competence and scheduler item mastery therefore cannot be represented as separate accomplishments by this model.
- Mastery is not necessarily absorbing: diagnostic histories record when a mastered item lapses after later evidence and whether it recovers.

## Experiment

- Six matched planner seeds, five required learner profiles, and 200 sessions per run (${report.runs.length} runs total).
- Checkpoints: ${LONG_HORIZON_CHECKPOINTS.join(", ")}.
- Planner and answer seeds are separate; each matched seed group shares its planner seed and deterministic answer stream.
- “Mastered” means the status emitted by the current production U.S. Memory Trail planner. This reporter does not restate or alter the transition threshold.

## Mastery curves

Values are median (minimum–maximum) across six planner seeds. Learning includes the source statuses “introduced” and “learning”; unknown statuses, if any, remain separately validated in JSON.

| Profile | Session | Introduced | Unseen | Learning | Review | Relearning | Mastered | Mastered % |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
${masteryCurveRows()}

The companion JSON also reports encounters, correct responses, misses, streak distributions, stability, retrievability, due backlog, review/relearning backlog, and Census-region mastery at every checkpoint.

## Milestones

| Profile | All introduced | First mastered | 25% | 50% | 75% | 90% | 95% | 100% |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
${milestoneRows()}

Milestones shown as “Not reached” did not occur in 200 sessions. Seed-sensitivity labels are recorded in JSON using descriptive ranges only: highly stable (range width ≤2), moderately seed-sensitive (≤10), strongly seed-sensitive (>10), or censored when only some seeds reach a milestone.

## Diagnostic item histories

The table uses ${plannerSeeds[0]} as a readable representative trace; all six runs remain in JSON. Maine is the strong early state, Hawaii the late state, and Augusta (capital:augusta-me) the representative capital.

| Profile | Item | Introduced | Encounters | Correct | Misses | First mastery | Lapses | Recovery | Status transitions |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | --- | --- |
${diagnosticRows()}

## Perfect-run analysis

For the near-perfect profile, the first complete curriculum encounter occurs at ${range(perfect.milestones.allCurriculumItemsIntroduced)}. At that point every item has at least one correct demonstration; the learner has made ${range(correctAtIntroduction)} correct and ${range(missesAtIntroduction)} incorrect demonstrations, but only ${range(masteredAtIntroduction)} items are currently mastered.

The planner does not define a “full pass” over all introduced material, so the report cannot honestly claim one occurred. It can show that every item has been encountered and whether every item has at least one correct demonstration. The U.S. Memory Trail state contains item progress and a curriculum cursor, but no separate journey/domain-complete achievement. This is evidence of a representation gap between broad accomplishment and long-term scheduled item mastery; whether the product should add such an accomplishment is a product decision, not an O6.3 implementation change.

## Review load after complete introduction

| Profile | First 25 post-introduction sessions: reviews/session | Last 25 sessions: reviews/session | Decline observed |
| --- | ---: | ---: | ---: |
${reviewRows()}

Per-session JSON distinguishes new, weak, older, recent, due, and other review reasons and counts reconstructed competing review items. A decline is descriptive only; lower review load does not automatically mean better pedagogy.

## Persistent Ohio weakness

- Ohio encounters by session 200: ${range(weakOhioEncounters)}.
- Other items mastered at session 200: single-weak ${range(weakOther99)} of the other 99 curriculum items; near-perfect ${range(perfectOther99)}. The single-weak run has only 98 other introduced items because Columbus remains prerequisite-blocked.
- Single-weak 25/50/75/90/95/100% milestones: ${[25, 50, 75, 90, 95, 100].map((percentage) => `${percentage}% ${range(weak.milestones.mastery[percentage])}`).join("; ")}.
- The representative item history shows whether Ohio continues taking the weak-review slot, while post-introduction review totals expose effects on other items. Finite deterministic evidence cannot prove permanent monopolization.

## Regional mastery

Final session-200 values are median (minimum–maximum), normalized by each region's curriculum item count in the percentage column.

| Profile | Census region | Mastered items | Mastered % |
| --- | --- | ---: | ---: |
${regionalRows()}

The regional-weakness profile can therefore be compared with the matched near-perfect profile without confusing raw Midwest totals with the region's larger item count. Weak-review pressure and curriculum timing remain separate fields in JSON.

### Regional-weakness pressure after all items are introduced

| Region | Candidate opportunities | Review selections | Weak-review selections | Selection/opportunity |
| --- | ---: | ---: | ---: | ---: |
${regionalPressureRows()}

This window begins only after all 100 items are introduced, so the large Midwest review pressure is not attributed to earlier curriculum arrival. The very low mastery outside the Midwest shows that persistent Midwest weakness also coincides with delayed mastery elsewhere; the report establishes the trajectory, not whether that tradeoff is desirable.

## Open questions

- Should broad successful coverage produce a user-facing accomplishment distinct from durable scheduler mastery?
- Is a 7-correct/4-streak mastery transition and subsequent lapse behavior appropriate for this product? O6.3 measures it but does not decide.
- Is the long tail of non-mastered items after sustained strong performance desirable spacing or excessive review friction?
- How should one persistent weak item affect curriculum completion and other-item review opportunity?
- Would human response time, confidence, or Journey evidence change the intended mastery interpretation? Those signals are outside this simulation.
`;

const outputDirectory = path.join(repositoryRoot, "reports");
fs.mkdirSync(outputDirectory, { recursive: true });
fs.writeFileSync(path.join(outputDirectory, "us-long-horizon-mastery.json"), `${JSON.stringify(report, null, 2)}\n`);
fs.writeFileSync(path.join(outputDirectory, "us-long-horizon-mastery.md"), markdown);
console.log(`Generated ${report.runs.length} long-horizon runs across ${plannerSeeds.length} planner seeds in reports/us-long-horizon-mastery.{md,json}.`);
