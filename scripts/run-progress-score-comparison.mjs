import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildExperimentalProgressScoreComparison } from "./lib/progress-score-comparison.mjs";
import { loadUnitedStatesSimulationFixture } from "./lib/us-simulation-fixture.mjs";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const fixture = loadUnitedStatesSimulationFixture(repositoryRoot);
const report = buildExperimentalProgressScoreComparison({ items: fixture.items });
const modelIds = report.models.map((model) => model.id);

function score(value) {
  return value === null || value === undefined ? "unknown" : value.toFixed(3);
}

function tableRow(values) {
  return `| ${values.join(" | ")} |`;
}

function canonicalRows() {
  return report.canonicalSequences.map((sequence) => tableRow([
    sequence.label,
    ...modelIds.map((modelId) => score(sequence.models[modelId].score))
  ])).join("\n");
}

function trajectoryRows() {
  return report.canonicalSequences.filter((sequence) => sequence.evidence.length > 0).map((sequence) => tableRow([
    sequence.label,
    ...modelIds.map((modelId) => {
      const path = sequence.models[modelId].trajectory
        .filter((step) => step.event.type === "response")
        .map((step) => score(step.scoreAfter));
      return path.join(" → ") || "unknown";
    })
  ])).join("\n");
}

function focusRows(group) {
  return Object.entries(group).map(([scenario, values]) => tableRow([
    scenario,
    ...modelIds.map((modelId) => score(values[modelId]))
  ])).join("\n");
}

function recoveryRows() {
  return modelIds.map((modelId) => {
    const result = report.focusedAnalysis.recoveryAfterTwoMisses[modelId];
    return tableRow([
      modelId,
      score(result.scoreAfterTwoMisses),
      result.correctAnswersToHigh ?? "not reached",
      result.correctAnswersToComplete ?? "not reached",
      result.trajectoryAfterMisses.map(score).join(" → ")
    ]);
  }).join("\n");
}

function perfectPassRows() {
  return modelIds.map((modelId) => {
    const result = report.perfectFiftyStateLocationPass[modelId];
    return tableRow([
      modelId,
      score(result.scorePerStateLocation),
      `${(result.averageProgress * 100).toFixed(1)}%`,
      result.bandCounts.unknown,
      result.bandCounts.low,
      result.bandCounts.medium,
      result.bandCounts.high,
      result.bandCounts.complete
    ]);
  }).join("\n");
}

function syntheticExampleRows() {
  const examples = [
    { profileId: "single-weak-item", itemId: "state:ohio", label: "Single weak — Ohio" },
    { profileId: "single-weak-item", itemId: "state:maine", label: "Single weak — strong Maine" },
    { profileId: "regional-weakness", itemId: "state:ohio", label: "Regional weakness — Ohio" },
    { profileId: "regional-weakness", itemId: "state:michigan", label: "Regional weakness — Michigan" },
    { profileId: "perfect", itemId: "state:maine", label: "Near-perfect — Maine" },
    { profileId: "random", itemId: "state:maine", label: "Random — Maine" }
  ];
  return examples.map((example) => {
    const profile = report.syntheticProfiles.find((candidate) => candidate.profileId === example.profileId);
    const observations = profile.models[modelIds[0]].diagnostics[example.itemId]?.observations ?? "unseen";
    return tableRow([
      example.label,
      observations,
      ...modelIds.map((modelId) => score(profile.models[modelId].diagnostics[example.itemId]?.score))
    ]);
  }).join("\n");
}

function modelDefinitionSections() {
  const formula = {
    "weighted-evidence": "Start unknown; after evidence, add 0.34 for correct, subtract 0.24 for incorrect, add up to 0.12 for a correct streak, and clamp to 0–1.",
    "bayesian-evidence": "Start with an unshown Beta(1,2) prior. After evidence, score = (1 + correct) / (3 + correct + incorrect). Each provisional evidence weight is 1.",
    "bkt-inspired": "Start with latent P(known)=0.20. Apply guess=0.25 and slip=0.10 Bayes updates, then a 0.12 learning transition after every response. No forgetting transition is applied.",
    "current-system-proxy": "Project existing-style counters: 45% correctness ratio + 30% streak progress toward 4 + 25% correct-evidence progress toward 7. Stability, difficulty, retrievability, status, and time are excluded."
  };
  return report.models.map((model) => `### ${model.label}\n\n${formula[model.id]}\n\nAssumption: ${model.assumptions}\n`).join("\n");
}

function criteriaRows() {
  return modelIds.map((modelId) => {
    const evaluation = report.criteriaEvaluation[modelId];
    return tableRow([modelId, evaluation.strengths.join("; "), evaluation.weaknesses.join("; ")]);
  }).join("\n");
}

const lucky = report.focusedAnalysis.luckyGuess;
const strong = report.focusedAnalysis.strongEvidence;
const markdown = `# Experimental demonstrated-progress score comparison

This is a non-production design experiment. The candidate scores estimate how strongly a learner has currently demonstrated a specific knowledge skill. They are not scheduler mastery, retention priority, due state, or production learner state, and none is wired into gameplay or UI.

## Executive summary

- **Recommended for further prototype work: Bayesian evidence.** It acknowledges one correct response at ${score(lucky.firstCorrect["bayesian-evidence"])}, falls to ${score(lucky.oneCorrectThreeMisses["bayesian-evidence"])} after three contradictory misses, and preserves ${score(strong.tenCorrectOneMiss["bayesian-evidence"])} after ten correct plus one miss. Its prior and evidence counts remain inspectable.
- **Best lucky-guess reversal:** BKT-inspired and current-system proxy fall furthest after one correct plus repeated misses, but Bayesian provides the best balance with strong-evidence resilience.
- **Best preservation of extensive successful evidence:** BKT preserves the most numerically, but it saturates near 1.0 and conflates latent learning with demonstrated progress. Bayesian preserves strong evidence without the same saturation.
- **Most satisfying one-pass result:** Bayesian shows every state-location skill at 0.50—acknowledged but neither high nor complete. All four models place the 50 items in the medium band under the provisional shared bands.
- **Easiest arithmetic to explain:** weighted evidence. Its clamp discards evidence depth, however: five correct plus one miss and ten correct plus one miss both finish at ${score(strong.fiveCorrectOneMiss["weighted-evidence"])}.
- **Unsuitable in current form:** BKT-inspired. A regional-weakness Ohio example can remain very high because no-forgetting and learning transitions answer a latent-knowledge question rather than the requested demonstrated-skill question.

## Score bands

- Unknown: no evidence.
- Low: 0.000–0.299.
- Medium: 0.300–0.649.
- High: 0.650–0.899.
- Complete: 0.900–1.000.

These bands and every model parameter are provisional design-test inputs, not product acceptance thresholds.

## Model definitions

${modelDefinitionSections()}

No optional time-decaying retention score was added. The current experiment deliberately keeps demonstrated progress separate from retention scheduling; none of the four scores changes during absence without a new response.

## Canonical sequence comparison

Final scores:

| Evidence history | Weighted | Bayesian | BKT-inspired | Current proxy |
| --- | ---: | ---: | ---: | ---: |
${canonicalRows()}

### Score after every response

Gap events are omitted from the path because no candidate changes without a response.

| Evidence history | Weighted trajectory | Bayesian trajectory | BKT trajectory | Current-proxy trajectory |
| --- | --- | --- | --- | --- |
${trajectoryRows()}

## Lucky-guess analysis

| Scenario | Weighted | Bayesian | BKT-inspired | Current proxy |
| --- | ---: | ---: | ---: | ---: |
${focusRows(lucky)}

Weighted evidence reverses most abruptly because it clamps at zero. BKT and the current proxy also make persistent contradiction visibly weak. Bayesian falls below the low/medium boundary after one correct and three misses while preserving the complete evidence counts.

## Strong-evidence resilience

| Scenario | Weighted | Bayesian | BKT-inspired | Current proxy |
| --- | ---: | ---: | ---: | ---: |
${focusRows(strong)}

The weighted clamp makes five and ten prior successes indistinguishable after one miss. The current proxy loses its entire streak component on a miss. BKT barely moves after saturation. Bayesian gives the most directly explainable diminishing impact from a single contradictory observation.

## Recovery after two misses

| Model | Score after misses | Correct answers to high | Correct answers to complete | Scores after successive correct answers |
| --- | ---: | ---: | ---: | --- |
${recoveryRows()}

## Long absence

All candidates preserve the exact pre-gap score across a simulated 365-day absence. This is intentional: the experiment treats elapsed-time review pressure as a scheduler concern. A future retention-confidence comparison would be a different score with a different label.

## Synthetic learner examples

The existing U.S. Memory Trail planner ran unchanged for 60 matched-seed sessions. Its responses were replayed as evidence into each isolated model.

Memory Trail currently exposes item/mode histories, not a unified Ohio × location/identification/relationship skill model. Each item history below is therefore a stand-in candidate skill stream for comparing formulas, not evidence that production already separates every required skill.

| Example | Observations | Weighted | Bayesian | BKT-inspired | Current proxy |
| --- | ---: | ---: | ---: | ---: | ---: |
${syntheticExampleRows()}

The JSON report also includes score-band counts and Census-region averages for all five profiles. The current-system proxy is verified against the actual final planner counters for diagnostic items; it is still an invented projection, not a production field.

## Perfect 50-state location pass

| Model | Score per state | Aggregate average | Unknown | Low | Medium | High | Complete |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
${perfectPassRows()}

Every model acknowledges a correct first demonstration without calling it durable mastery or complete. Bayesian's 50% result is the clearest provisional expression of “demonstrated once, needs more evidence.”

## Tradeoffs against product criteria

| Model | Strengths | Weaknesses |
| --- | --- | --- |
${criteriaRows()}

## Recommendation

Prototype **Model B, Bayesian evidence**, one level further—but still outside production. It best balances lucky-guess reversibility, accumulated evidence, strong-evidence resilience, and developer explainability.

Do not advance the BKT-inspired model as the visible demonstrated-progress bar in its current form. Keep weighted evidence only as a simple baseline, and keep the current-system proxy as a diagnostic comparison rather than treating it as an existing score.

Before any production decision, resolve:

${report.recommendation.unresolved.map((question) => `- ${question}`).join("\n")}

No recommendation in this report is implemented in production.
`;

const outputDirectory = path.join(repositoryRoot, "reports");
fs.mkdirSync(outputDirectory, { recursive: true });
fs.writeFileSync(path.join(outputDirectory, "experimental-progress-score-comparison.json"), `${JSON.stringify(report, null, 2)}\n`);
fs.writeFileSync(path.join(outputDirectory, "experimental-progress-score-comparison.md"), markdown);
console.log("Generated reports/experimental-progress-score-comparison.{md,json}.");
