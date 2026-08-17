import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  BAYESIAN_DISPLAY_THRESHOLDS,
  createBayesianProgressRecord,
  createProgressGroup,
  renderDeveloperPrototypeHtml,
  renderDisplayOption
} from "./lib/bayesian-progress-prototype.mjs";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const longGap = Object.freeze({ type: "gap", days: 365 });
const correct = true;
const miss = false;

const STATE_NAMES = Object.freeze([
  "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut", "Delaware", "Florida", "Georgia",
  "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland",
  "Massachusetts", "Michigan", "Minnesota", "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire", "New Jersey",
  "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", "South Carolina",
  "South Dakota", "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington", "West Virginia", "Wisconsin", "Wyoming"
]);

const TEST_HISTORIES = Object.freeze([
  { id: "never-attempted", label: "Never attempted", evidence: [] },
  { id: "one-correct", label: "One correct answer", evidence: [correct] },
  { id: "three-correct", label: "Three correct answers", evidence: [correct, correct, correct] },
  { id: "perfect-first-exposure", label: "Perfect first exposure", evidence: [correct] },
  { id: "one-correct-five-misses", label: "One correct followed by five misses", evidence: [correct, ...Array(5).fill(miss)] },
  { id: "five-correct-one-miss", label: "Five correct followed by one miss", evidence: [...Array(5).fill(correct), miss] },
  { id: "ten-correct-one-miss", label: "Ten correct followed by one miss", evidence: [...Array(10).fill(correct), miss] },
  { id: "persistent-ohio-failure", label: "Persistent Ohio failure", evidence: [miss, miss, correct, miss, miss, miss, miss, miss] },
  { id: "complete-state-location-pass", label: "One state in a perfect 50-state pass", evidence: [correct] },
  { id: "long-absence", label: "Long absence without new evidence", evidence: [correct, correct, correct, longGap] },
  { id: "long-absence-correct", label: "Long absence followed by a correct answer", evidence: [correct, correct, correct, longGap, correct] },
  { id: "long-absence-miss", label: "Long absence followed by a miss", evidence: [correct, correct, correct, longGap, miss] }
]);

function recordForScenario(scenario) {
  return createBayesianProgressRecord({
    itemId: scenario.id === "persistent-ohio-failure" ? "state:ohio" : `prototype:${scenario.id}`,
    skillId: "location",
    label: scenario.label,
    evidenceHistory: scenario.evidence
  });
}

export function buildBayesianProgressPrototype() {
  const testHistories = TEST_HISTORIES.map((scenario) => ({
    id: scenario.id,
    purpose: scenario.label,
    record: recordForScenario(scenario)
  }));
  const ohioSkillRecords = [
    createBayesianProgressRecord({ itemId: "state:ohio", skillId: "location", label: "Location", evidenceHistory: [...Array(10).fill(correct), miss] }),
    createBayesianProgressRecord({ itemId: "state:ohio", skillId: "identification", label: "Identification", evidenceHistory: [correct, correct, correct] }),
    createBayesianProgressRecord({ itemId: "state:ohio", skillId: "capital", label: "Capital", evidenceHistory: [...Array(5).fill(correct), miss] }),
    createBayesianProgressRecord({ itemId: "state:ohio", skillId: "relationships", label: "Relationships", evidenceHistory: [correct, ...Array(5).fill(miss)] })
  ];
  const ohioSkillBreakdown = createProgressGroup({ groupId: "state:ohio", label: "Ohio", records: ohioSkillRecords });
  const perfectPassRecords = STATE_NAMES.map((name) => createBayesianProgressRecord({
    itemId: `state:${name.toLowerCase().replaceAll(" ", "-")}`,
    skillId: "location",
    label: name,
    evidenceHistory: [correct]
  }));
  const perfectStateLocationPass = createProgressGroup({
    groupId: "us-state-locations",
    label: "U.S. State Locations",
    records: perfectPassRecords
  });
  const persistentWeakness = testHistories.find((scenario) => scenario.id === "persistent-ohio-failure").record;
  const optionExamples = {
    simpleSegmentedBar: renderDisplayOption("simple-segmented-bar", ohioSkillRecords[0]),
    labelAndBar: renderDisplayOption("label-and-bar", ohioSkillRecords[0]),
    skillBreakdown: renderDisplayOption("skill-breakdown", ohioSkillBreakdown)
  };
  return {
    schemaVersion: 1,
    kind: "bayesian-progress-visualization-prototype",
    productionAuthoritative: false,
    connectedToProductionState: false,
    connectedToPlanner: false,
    scoreMeaning: "Provisional estimate of what the learner has demonstrated they can currently do; not permanent mastery or retention scheduling.",
    model: {
      id: "bayesian-evidence",
      prior: { alpha: 1, beta: 2 },
      formula: "(1 + correct responses) / (3 + correct responses + misses)",
      timeSensitive: false
    },
    displayThresholds: {
      unseen: null,
      needsReview: [0, BAYESIAN_DISPLAY_THRESHOLDS.needsReviewMaximumExclusive],
      demonstrated: [BAYESIAN_DISPLAY_THRESHOLDS.needsReviewMaximumExclusive, BAYESIAN_DISPLAY_THRESHOLDS.demonstratedMaximumExclusive],
      strongEvidence: [BAYESIAN_DISPLAY_THRESHOLDS.demonstratedMaximumExclusive, 1]
    },
    aggregationRule: "Average all item-skill scores; an unseen item contributes an empty segment but remains null in its own record. Always show attempted and unseen counts beside group progress.",
    recommendedDisplay: "Label + segmented bar for summaries, with skill breakdown available where the learner can act on it.",
    optionExamples,
    testHistories,
    ohioSkillBreakdown,
    perfectStateLocationPass,
    persistentWeakness,
    validationBoundaries: [
      "No production learner state is read or written.",
      "No adaptive algorithm, mastery threshold, or planner behavior is imported or changed.",
      "The developer HTML artifact is not linked from normal navigation.",
      "Elapsed time alone does not change demonstrated-knowledge progress."
    ]
  };
}

function score(record) {
  return record.bayesianProgressScore === null ? "—" : record.bayesianProgressScore.toFixed(3);
}

function scenarioRows(prototype) {
  return prototype.testHistories.map(({ purpose, record }) => (
    `| ${purpose} | ${score(record)} | ${record.displayCategory.label} | ${record.display.text} | ${record.explanation} |`
  )).join("\n");
}

function skillRows(group) {
  return group.records.map((record) => (
    `| ${record.label} | ${record.evidenceSummary.correctCount} correct / ${record.evidenceSummary.missCount} misses | ${score(record)} | ${record.displayCategory.label} | ${record.display.text} |`
  )).join("\n");
}

export function renderBayesianProgressReport(prototype) {
  const perfect = prototype.perfectStateLocationPass;
  const weak = prototype.persistentWeakness;
  return `# Bayesian demonstrated-progress visualization prototype

> Non-production UX/model validation artifact. This prototype does not read or write learner state, affect scheduling, change mastery thresholds, alter planner behavior, or appear in normal navigation.

## Answer in brief

The most understandable approach is **Option B, label + segmented bar**, with **Option C, skill breakdown**, available when a learner opens an item. The label tells the learner what the bar claims; the bar makes relative strength quickly scannable; the breakdown makes weaknesses actionable. Option A is too ambiguous on its own.

The display feels most honest when it says **Demonstrated** rather than “50% mastered,” reports breadth separately (for example, **50 of 50 state locations demonstrated**), and explains changes in plain language. The provisional thresholds and Beta(1,2) prior are experiment inputs, not proposed production mastery rules.

## Prototype model and representation

Each record contains an item ID, skill ID, cloned evidence history, Bayesian score, display category, change explanation, evidence summary, and deterministic ten-segment display. The score is:

\`(1 + correct responses) / (3 + correct responses + misses)\`

The hidden Beta(1,2) prior is not displayed as learner history. With no responses the score is \`null\`, never zero. Time gaps are retained in the evidence history but do not change the score by themselves.

Display-only categories:

- **Unseen:** no response evidence; score is \`null\`.
- **Needs review:** 0.000–0.299.
- **Demonstrated:** 0.300–0.649.
- **Strong evidence:** 0.650–1.000.

There is deliberately no “mastered,” “permanent,” or “complete” category. These category boundaries are UX hypotheses, not internal mastery thresholds.

For groups, the bar averages every requested item-skill. Unseen items contribute empty space instead of being silently omitted, while attempted/unseen counts remain visible. This rewards breadth without confusing an unseen item with a scored failure.

## Display experiments

### Option A — simple segmented bar

\`\`\`text
${prototype.optionExamples.simpleSegmentedBar}
\`\`\`

This is fast to scan but fails the comprehension test by itself: a learner cannot tell whether it means course completion, recent accuracy, permanent mastery, or current evidence.

### Option B — label + bar

\`\`\`text
${prototype.optionExamples.labelAndBar}
\`\`\`

This is the best default summary. “Strong evidence” constrains the meaning without claiming permanence. A short information affordance would still be needed in any future user test.

### Option C — skill breakdown

\`\`\`text
${prototype.optionExamples.skillBreakdown}
\`\`\`

This is the best diagnostic view because it shows what to practice. It is too dense as the only overview for 50 states, so it should be progressive disclosure rather than the default grid.

## Twelve required histories

| History | Score | Category | Segmented display | Why it changed |
| --- | ---: | --- | --- | --- |
${scenarioRows(prototype)}

“One correct answer” and “perfect first exposure” are intentionally numerically identical for one skill: both contain one successful retrieval. The latter becomes meaningfully different only at group scope, where every skill or item in the exposure can be shown as demonstrated.

## User comprehension

A naked bar is not self-explanatory. A learner is more likely to understand the construct when the persistent heading says **Demonstrated knowledge**, the adjacent state says **Unseen / Needs review / Demonstrated / Strong evidence**, and a change explanation names the new evidence. Avoid a percent sign as the dominant visual: “50%” invites a course-completion or test-grade interpretation that the model cannot support.

The group view needs two readings at once: evidence strength and breadth. “50 of 50 demonstrated” answers breadth; the half-filled bars answer evidence depth. Neither should substitute for the other.

## Psychological behavior

- **Acknowledges success:** one correct retrieval immediately changes Unseen to Demonstrated and fills five segments.
- **Avoids overstating mastery:** one correct never becomes Strong evidence, and no display says mastered.
- **Avoids unfair loss:** absence alone leaves the bar unchanged. A later miss moves the score only because it is new contradictory evidence, and the explanation says earlier successes were retained.
- **Makes weaknesses obvious:** Needs review uses both a text label and a distinct visual treatment; skill breakdown identifies the weak skill rather than labeling all of Ohio weak.

A potential emotional problem remains: after three correct answers, one later miss moves 0.667 to 0.571 and crosses from Strong evidence to Demonstrated. The plain Beta model is order-insensitive and the categorical boundary makes that small continuous change look larger. User testing should specifically probe that transition before any production consideration.

## Perfect-pass scenario: all 50 state locations correct once

The prototype shows:

- **50 of 50** state-location skills attempted;
- **50 Demonstrated**, 0 Unseen, 0 Needs review, 0 Strong evidence;
- **0.500 aggregate evidence score** and \`${perfect.display.text}\`;
- every state individually labeled **Demonstrated** with a half-filled bar.

**Would this make a learner who knows the United States feel recognized?** With the breadth statement—“50 of 50 state locations demonstrated”—yes, it recognizes the concrete accomplishment without pretending a single pass proves durable knowledge. With only a 50% bar, no: that could feel like a failing grade after perfection. The breadth badge or completion statement is therefore essential, and the bar should be secondary.

This result also reveals a model/UX tension: Beta(1,2) deliberately discounts a single correct answer, so perfect observed accuracy produces only 0.500 evidence per item. The prototype should validate that tension; it should not fix it by changing the prior or thresholds in this task.

## Persistent weakness scenario: Ohio

History: miss, miss, correct, miss, miss, miss, miss, miss.

- Score: **${score(weak)}**
- Category: **${weak.displayCategory.label}**
- Display: \`${weak.display.text}\`
- Explanation: ${weak.explanation}

**Would a learner understand why Ohio needs more practice?** The label and explanation make the direction clear, but the final-event explanation alone is insufficient context. Showing **1 correct / 7 misses** beside it makes the reason concrete. The skill-level view is also important: the product should say “Ohio — Location needs review,” not imply that every fact about Ohio is weak.

## Ohio skill experiment

| Skill | Evidence | Score | Category | Display |
| --- | --- | ---: | --- | --- |
${skillRows(prototype.ohioSkillBreakdown)}

The group average is **${prototype.ohioSkillBreakdown.bayesianProgressScore.toFixed(3)} (${prototype.ohioSkillBreakdown.displayCategory.label})**, but the breakdown is more useful than that average because it exposes Relationships as the actionable weakness.

## Recommendation

Advance a **label + bar summary with an expandable skill breakdown** into learner interviews or an instrumented mockup, still outside production. In those tests:

1. Lead with breadth recognition after a perfect pass.
2. Describe the construct as demonstrated knowledge, never mastery or a grade.
3. Keep absence neutral; explain only evidence-driven changes.
4. Always pair Needs review with the skill name and evidence counts.
5. Test category-boundary drops for perceived unfairness.

Do not choose a final schema, recalibrate the prior, change thresholds, or connect this artifact to learner state based on this prototype alone.

## Artifact boundaries

- JSON: \`reports/bayesian-progress-visualization-prototype.json\`
- Developer page: \`tools/bayesian-progress-prototype.html\`
- Generator: \`scripts/run-bayesian-progress-prototype.mjs\`
- Focused validation: \`scripts/check-bayesian-progress-prototype.mjs\`

The HTML file is intentionally unlinked from \`index.html\`, app menus, and normal navigation.
`;
}

const prototype = buildBayesianProgressPrototype();
const jsonPath = path.join(repositoryRoot, "reports/bayesian-progress-visualization-prototype.json");
const markdownPath = path.join(repositoryRoot, "reports/bayesian-progress-visualization-prototype.md");
const htmlPath = path.join(repositoryRoot, "tools/bayesian-progress-prototype.html");

fs.writeFileSync(jsonPath, `${JSON.stringify(prototype, null, 2)}\n`);
fs.writeFileSync(markdownPath, renderBayesianProgressReport(prototype));
fs.writeFileSync(htmlPath, renderDeveloperPrototypeHtml(prototype));
console.log(`Wrote ${path.relative(repositoryRoot, jsonPath)}`);
console.log(`Wrote ${path.relative(repositoryRoot, markdownPath)}`);
console.log(`Wrote ${path.relative(repositoryRoot, htmlPath)}`);
