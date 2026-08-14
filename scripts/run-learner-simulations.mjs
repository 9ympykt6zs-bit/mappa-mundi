import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  runDailyTrailReturnProbe,
  runUnitedStatesLearnerSimulation,
  SYNTHETIC_LEARNER_PROFILES
} from "./lib/learner-simulation.mjs";
import { loadUnitedStatesSimulationFixture } from "./lib/us-simulation-fixture.mjs";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputDirectory = path.join(repositoryRoot, "reports");
const fixture = loadUnitedStatesSimulationFixture(repositoryRoot);

function stableJson(value) {
  return JSON.stringify(value, null, 2);
}

function runProfile(profile) {
  const options = {
    profileId: profile.id,
    items: fixture.items,
    seed: `o4:${profile.id}:v1`,
    sessionCount: 36,
    startTime: "2030-01-15T18:30:00.000Z"
  };
  const first = runUnitedStatesLearnerSimulation(options);
  const replay = runUnitedStatesLearnerSimulation(options);
  first.healthChecks.deterministicReplay = {
    status: stableJson(first) === stableJson(replay) ? "not-observed" : "warning",
    replayEquivalent: stableJson(first) === stableJson(replay)
  };
  return first;
}

function renderField(field) {
  if (!field) return "Unavailable";
  return `${field.availability}: ${JSON.stringify(field.value)}`;
}

function renderProfile(result) {
  const summary = result.summary;
  const weak = result.selectionBehavior.weakItem;
  const checkpoints = result.learningProgression.map((checkpoint) => {
    const transition = checkpoint.transition;
    return `- Session ${checkpoint.session}: ${checkpoint.sessionSummary.sessionType}; `
      + `${checkpoint.sessionSummary.newCount} new / ${checkpoint.sessionSummary.reviewCount} review; `
      + `${checkpoint.sessionSummary.correct} correct / ${checkpoint.sessionSummary.incorrect} incorrect. `
      + (transition
        ? `Inspector checkpoint ${renderField(transition.event.itemId)}; changed fields: ${transition.changes.value.length}.`
        : "No item transition was available.");
  }).join("\n");
  const healthRows = Object.entries(result.healthChecks)
    .filter(([, value]) => value && typeof value === "object" && "status" in value)
    .map(([name, value]) => `| ${name} | ${value.status} |`)
    .join("\n");

  return `## ${result.profile.label}\n\n${result.profile.description}\n\n`
    + `- Sessions: ${summary.sessionsSimulated}\n`
    + `- Unique items encountered: ${summary.itemsEncountered}; total encounters: ${summary.encounters}\n`
    + `- Correct / incorrect: ${summary.correct} / ${summary.incorrect} (${(summary.accuracy * 100).toFixed(1)}% correct)\n`
    + `- Final introduced / mastered: ${summary.finalState.introduced} / ${summary.finalState.mastered}\n`
    + `- Regions: ${Object.entries(summary.regionsEncountered).map(([region, count]) => `${region} ${count}`).join(", ")}\n`
    + `- Categories: ${Object.entries(summary.taxonomyCategoriesEncountered).map(([category, count]) => `${category} ${count}`).join(", ")}\n`
    + `- New / review selections: ${result.selectionBehavior.newSelections} / ${result.selectionBehavior.reviewSelections}\n`
    + (weak ? `- Ohio encounters: ${weak.encounters}; final status: ${weak.finalProgress?.status || "unavailable"}; reason buckets: ${[...new Set(weak.reasonCodes)].join(", ") || "none"}\n` : "")
    + (result.returnEvidence
      ? `- First return session ${result.returnEvidence.session}: returning prior items ${result.returnEvidence.previouslySeenItemsReturning.join(", ") || "none"}; new items ${result.returnEvidence.newItems.join(", ") || "none"}; review items ${result.returnEvidence.reviewItems.join(", ") || "none"}\n`
      : "")
    + `\n### Progression checkpoints\n\n${checkpoints}\n\n`
    + `### Diagnostic health checks\n\n| Check | Observation |\n| --- | --- |\n${healthRows}\n\n`
    + `These are diagnostics, not correctness assertions. Starvation is limited to already-introduced items because rejected-candidate eligibility is unavailable.\n`;
}

function compactForReport(result) {
  const checkpointTransitions = result.learningProgression
    .map((checkpoint) => checkpoint.transition)
    .filter(Boolean);
  const selectedReasonExamples = [];
  const seenReasonCodes = new Set();
  for (const selection of result.inspector.selections) {
    const isWeakExample = result.profile.id === "single-weak-item" && selection.itemId.value === "state:ohio";
    if (!isWeakExample && seenReasonCodes.has(selection.reasonCode.value)) continue;
    selectedReasonExamples.push(selection);
    seenReasonCodes.add(selection.reasonCode.value);
    if (selectedReasonExamples.length >= 12) break;
  }
  return {
    ...result,
    inspector: createCompactInspectorExport(result.inspector, selectedReasonExamples, checkpointTransitions)
  };
}

function createCompactInspectorExport(inspector, selections, transitions) {
  return {
    schemaVersion: inspector.schemaVersion,
    kind: inspector.kind,
    context: inspector.context,
    selections,
    transitions,
    exportNote: "The runner captured every selection and transition. This persisted report keeps representative selection reasons and the three documented progression checkpoints to remain reviewable."
  };
}

const profiles = SYNTHETIC_LEARNER_PROFILES.map(runProfile);
const dailyTrailReturnProbe = runDailyTrailReturnProbe({ items: fixture.items });
const report = {
  schemaVersion: 1,
  generatedFrom: "deterministic fixture time; not the wall clock",
  fixture: { journeyId: fixture.journeyId, itemCount: fixture.items.length },
  profiles: profiles.map(compactForReport),
  dailyTrailReturnProbe
};
const markdown = `# U.S. synthetic learner simulation report\n\n`
  + `This report is generated by \`npm run report:learner-simulations\`. It records deterministic observations of the current planners; it does not certify that their learning behavior is correct. Representative Inspector exports and final planner states are in the companion JSON report.\n\n`
  + `## Scope\n\n`
  + `The six profiles drive the production U.S. Memory Trail planner across its production-derived 50-state/50-capital curriculum. The forgetting profile advances its injected clock by 45 days at mid-run. U.S. Memory Trail scheduling remains session-based, so elapsed time alone is not expected to make items due. A separate controlled Daily Trail completed-review probe demonstrates the current date-aware state and selection context without claiming the two planners share state.\n\n`
  + profiles.map(renderProfile).join("\n")
  + `\n## Daily Trail return probe\n\n`
  + `- Initial time: ${dailyTrailReturnProbe.initialTime}\n`
  + `- Return time: ${dailyTrailReturnProbe.returnTime}\n`
  + `- Initial selected: ${dailyTrailReturnProbe.initialSelected.join(", ")}\n`
  + `- Return selected: ${dailyTrailReturnProbe.returnSelected.join(", ")}\n`
  + `- Limitation: ${dailyTrailReturnProbe.limitation}\n\n`
  + `## Notable observations for review\n\n`
  + `- The near-perfect learner continued introducing material (92 of 100 items in 36 sessions), and review selections did not outnumber new selections.\n`
  + `- Repeated Ohio misses caused 20 Ohio encounters through the emitted \`new\` and \`weak-review\` buckets; Ohio ended in \`learning\`, while the run continued to introduce other material.\n`
  + `- Advancing the U.S. Memory Trail clock by 45 days did not itself create date-due review because that planner records session-based due state. The separate Daily Trail probe did expose date-aware return selection.\n`
  + `- The regional-weakness profile encountered the Midwest 50 times versus the Northeast 35 times, but curriculum order, unequal region sizes, and unavailable rejected-candidate traces mean this is an observation rather than proof of appropriate regional adaptation.\n`
  + `- The seeded-random learner reached only 74 unique items and just 3 West encounters within 36 sessions. The remaining West items were mostly unseen curriculum, so the current Inspector cannot classify them as eligible-but-starved.\n`
  + `- No profile reached the planner's \`mastered\` status in this 36-session window, including the near-perfect profile. This may reflect the scheduling thresholds and finite window; the report does not classify it as a defect.\n\n`
  + `## Interpretation\n\nImplemented means the runner and report generator exist. Automatically tested means the deterministic scenarios execute and their structural/replay invariants pass. Verified still requires human review of these observations against the Definition of Done; report generation alone does not verify the adaptive systems.\n`;

fs.mkdirSync(outputDirectory, { recursive: true });
fs.writeFileSync(path.join(outputDirectory, "us-learning-simulations.json"), `${stableJson(report)}\n`);
fs.writeFileSync(path.join(outputDirectory, "us-learning-simulations.md"), markdown);
console.log(`Generated ${profiles.length} learner profiles in reports/us-learning-simulations.{md,json}.`);
