import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildUnitedStatesEligibilityDelayReport } from "./lib/eligibility-delay-report.mjs";
import { runUnitedStatesLearnerSimulation, SYNTHETIC_LEARNER_PROFILES } from "./lib/learner-simulation.mjs";
import { loadUnitedStatesSimulationFixture } from "./lib/us-simulation-fixture.mjs";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const fixture = loadUnitedStatesSimulationFixture(repositoryRoot);
const reports = SYNTHETIC_LEARNER_PROFILES.map((profile) => {
  const simulation = runUnitedStatesLearnerSimulation({
    profileId: profile.id,
    items: fixture.items,
    seed: `o4:${profile.id}:v1`,
    sessionCount: 36,
    startTime: "2030-01-15T18:30:00.000Z"
  });
  return buildUnitedStatesEligibilityDelayReport({ simulation, items: fixture.items });
});

function tableRow(values) {
  return `| ${values.join(" | ")} |`;
}

function renderAnalysis(title, analysis) {
  const rows = Object.entries(analysis).map(([name, values]) => tableRow([
    name,
    values.eligibleOpportunities,
    values.selections,
    values.deferredOpportunities,
    values.selectionRate === null ? "Unavailable" : `${(values.selectionRate * 100).toFixed(1)}%`
  ])).join("\n");
  return `### ${title}\n\n| Group | Eligible opportunities | Selections | Deferred | Selection rate |\n| --- | ---: | ---: | ---: | ---: |\n${rows || "| Unavailable | 0 | 0 | 0 | Unavailable |"}\n`;
}

function renderProfile(report) {
  const topRows = report.summary.itemsWithHighestDeferral.slice(0, 12).map((item) => {
    const history = report.items.find((candidate) => candidate.itemId === item.itemId);
    return tableRow([
      history.label,
      history.type || "Unavailable",
      history.censusRegion || "Unavailable",
      history.eligibleSessionCount,
      history.selectedSessionCount,
      history.maximumObservedDeferral,
      history.unresolvedDelayEpisodes.length ? "Unresolved episode" : history.notes.join("; ") || "Resolved"
    ]);
  }).join("\n");
  return `## ${report.profile.label}\n\n`
    + `- Sessions simulated: ${report.summary.sessionsSimulated}\n`
    + `- Items observed as eligible or selected: ${report.summary.itemsObserved} of ${report.summary.itemsInFixture}\n`
    + `- Maximum observed deferral: ${report.summary.maximumObservedDeferral} consecutive eligible-but-not-selected sessions\n`
    + `- Average observed deferral across resolved and unresolved episodes: ${report.summary.averageObservedDeferral ?? "Unavailable"} sessions\n`
    + `- Average delay for episodes that ended in selection: ${report.summary.averageResolvedDelay ?? "Unavailable"} sessions\n`
    + `- Never selected despite eligibility: ${report.summary.neverSelectedDespiteEligibility.join(", ") || "none"}\n`
    + `- Unresolved deferral items at or before the report boundary: ${report.summary.unresolvedDeferralItems.length}\n\n`
    + `### Highest item delays\n\n| Item | Type | Region | Eligible sessions | Selected sessions | Max delay | Notes |\n| --- | --- | --- | ---: | ---: | ---: | --- |\n${topRows}\n\n`
    + renderAnalysis("Planner-pool analysis", report.reasonAnalysis.byPlannerPool)
    + `\n${renderAnalysis("Eligibility-signal analysis", report.reasonAnalysis.byEligibilitySignal)}`
    + `\n${renderAnalysis("Census-region analysis", report.regionalAnalysis)}`
    + `\n${renderAnalysis("Item-type analysis", report.categoryAnalysis)}`;
}

const output = {
  schemaVersion: 1,
  generatedFrom: "six deterministic 36-session O4 U.S. Memory Trail profiles",
  eligibilityDefinition: "Reconstructed from O5.5 planner-bucket Selection Traces; not a retained production event.",
  reports
};
const random = reports.find((report) => report.profile.id === "random");
const weak = reports.find((report) => report.profile.id === "single-weak-item");
const regional = reports.find((report) => report.profile.id === "regional-weakness");
const wyoming = random.items.find((item) => item.itemId === "state:wyoming");
const ohio = weak.items.find((item) => item.itemId === "state:ohio");
const markdown = `# U.S. Memory Trail eligibility delay report\n\n`
  + `This report measures how long items wait after appearing in a planner candidate pool. Eligibility is an inferred, read-only reconstruction from Selection Trace using the planner's existing helpers. A long delay does not automatically mean a bug, and a short delay does not automatically mean good pedagogy.\n\n`
  + `## Cross-profile observations\n\n`
  + `- Random learner Wyoming: eligible in ${wyoming.eligibleSessionCount} sessions, selected in ${wyoming.selectedSessionCount}, maximum observed deferral ${wyoming.maximumObservedDeferral}; unresolved episodes ${wyoming.unresolvedDelayEpisodes.length}.\n`
  + `- Single-weak-item Ohio: eligible in ${ohio.eligibleSessionCount} sessions, selected in ${ohio.selectedSessionCount}, maximum delay ${ohio.maximumObservedDeferral}, maximum consecutive selections ${ohio.maximumConsecutiveSelectedSessions}. Delay is low because Ohio repeatedly wins the weak-review slot; frequency and delay measure different risks.\n`
  + `- Regional-weakness Midwest: ${regional.regionalAnalysis.Midwest?.eligibleOpportunities || 0} eligible opportunities and ${regional.regionalAnalysis.Midwest?.selections || 0} selections. This measures item-level candidate pressure, not explicit regional weighting.\n`
  + `- Items outside emitted candidate pools, including curriculum-blocked unseen items, are not counted as eligible.\n\n`
  + `Across profiles, the largest delays are generally early-curriculum items remaining in large older-review pools with only one older-review slot. These items were selected previously; an unresolved post-selection deferral is not the same as “never selected.” Eligibility-signal categories are mutually exclusive in this order: new, weak, due, recent, older, other.\n\n`
  + reports.map(renderProfile).join("\n")
  + `\n## Interpretation limits\n\n`
  + `The report cannot prove permanent starvation from a finite 36-session window, identify an exact pairwise comparator clause, or determine whether any delay is pedagogically appropriate. It does not cover Daily Trail because Daily Trail does not currently expose its discarded full candidate pool.\n`;

const outputDirectory = path.join(repositoryRoot, "reports");
fs.mkdirSync(outputDirectory, { recursive: true });
fs.writeFileSync(path.join(outputDirectory, "us-eligibility-delays.json"), `${JSON.stringify(output, null, 2)}\n`);
fs.writeFileSync(path.join(outputDirectory, "us-eligibility-delays.md"), markdown);
console.log("Generated reports/us-eligibility-delays.{md,json}.");
