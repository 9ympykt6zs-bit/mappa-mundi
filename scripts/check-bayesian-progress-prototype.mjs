import assert from "node:assert/strict";
import {
  createBayesianProgressRecord,
  createProgressGroup,
  displayCategoryForScore,
  explanationForProgress,
  renderDeveloperPrototypeHtml,
  renderDisplayOption,
  segmentedBarForScore
} from "./lib/bayesian-progress-prototype.mjs";
import { runExperimentalProgressModel } from "./lib/experimental-progress-score-models.mjs";

assert.deepEqual(displayCategoryForScore(null), { id: "unseen", label: "Unseen" });
assert.equal(displayCategoryForScore(0).id, "needs-review");
assert.equal(displayCategoryForScore(0.299999).id, "needs-review");
assert.equal(displayCategoryForScore(0.3).id, "demonstrated");
assert.equal(displayCategoryForScore(0.649999).id, "demonstrated");
assert.equal(displayCategoryForScore(0.65).id, "strong-evidence");
assert.equal(displayCategoryForScore(1).id, "strong-evidence");

assert.deepEqual(segmentedBarForScore(null), {
  segmentCount: 10,
  filledCount: 0,
  emptyCount: 10,
  text: "░░░░░░░░░░",
  percentage: null,
  isUnseen: true
});
assert.equal(segmentedBarForScore(0).isUnseen, false, "A scored zero must remain distinct from unseen.");
assert.equal(segmentedBarForScore(0.5).text, "█████░░░░░");
assert.equal(segmentedBarForScore(0.667).text, "███████░░░");

const history = [true, true, false, { type: "gap", days: 365 }, true];
const historySnapshot = JSON.stringify(history);
const record = createBayesianProgressRecord({ itemId: "state:ohio", skillId: "location", label: "Ohio location", evidenceHistory: history });
assert.equal(JSON.stringify(history), historySnapshot, "Record generation must not mutate evidence history.");
assert.notEqual(record.evidenceHistory, history, "Records must own a cloned evidence history.");
assert.equal(record.bayesianProgressScore, 0.571429);
assert.equal(record.displayCategory.id, "demonstrated");
assert.match(record.explanation, /after a 365-day absence/);
assert.match(record.explanation, /added positive evidence/);

const unseen = createBayesianProgressRecord({ itemId: "state:maine", skillId: "location", evidenceHistory: [] });
assert.equal(unseen.bayesianProgressScore, null);
assert.equal(unseen.displayCategory.id, "unseen");
assert.match(unseen.explanation, /different from a 0% score/);

const gapHistory = [true, true, true, { type: "gap", days: 365 }];
const gapRun = runExperimentalProgressModel("bayesian-evidence", gapHistory);
assert.equal(gapRun.trajectory.at(-1).scoreBefore, gapRun.trajectory.at(-1).scoreAfter);
assert.match(explanationForProgress(gapHistory, gapRun), /stayed at 67%/);

const weak = createBayesianProgressRecord({
  itemId: "state:ohio",
  skillId: "relationships",
  label: "Relationships",
  evidenceHistory: [true, false, false, false, false, false]
});
assert.equal(weak.bayesianProgressScore, 0.222222);
assert.equal(weak.displayCategory.id, "needs-review");
assert.match(weak.explanation, /Earlier successful evidence was kept/);

const groupInput = [record, unseen, weak];
const groupSnapshot = JSON.stringify(groupInput);
const group = createProgressGroup({ groupId: "ohio-skills", label: "Ohio", records: groupInput });
assert.equal(JSON.stringify(groupInput), groupSnapshot, "Group generation must not mutate records or their histories.");
assert.equal(group.attemptedCount, 2);
assert.equal(group.unseenCount, 1);
assert.equal(group.bayesianProgressScore, 0.26455);
assert.equal(group.displayCategory.id, "needs-review");
assert.match(group.explanation, /2 of 3 skills/);

const optionA = renderDisplayOption("simple-segmented-bar", record);
const optionB = renderDisplayOption("label-and-bar", record);
const optionC = renderDisplayOption("skill-breakdown", group);
assert.equal(optionA, renderDisplayOption("simple-segmented-bar", record));
assert.match(optionB, /Demonstrated/);
assert.match(optionC, /Relationships/);

const minimalPrototype = {
  testHistories: [{ record }],
  ohioSkillBreakdown: group,
  perfectStateLocationPass: createProgressGroup({ groupId: "perfect", label: "Perfect", records: [record] })
};
const htmlA = renderDeveloperPrototypeHtml(minimalPrototype);
const htmlB = renderDeveloperPrototypeHtml(minimalPrototype);
assert.equal(htmlB, htmlA, "Developer visualization rendering must be deterministic.");
assert.match(htmlA, /Developer-only · non-production/);
assert.match(htmlA, /Demonstrated knowledge/);
assert.doesNotThrow(() => JSON.stringify({ record, group }));

console.log("Bayesian progress visualization prototype validation passed.");
