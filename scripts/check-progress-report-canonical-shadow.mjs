import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { adaptCanonicalRetrievalAttempt } from "../src/canonical-learning-evidence.js";
import {
  appendCanonicalEvidenceEvents,
  createEmptyCanonicalEvidenceRepository
} from "../src/canonical-learning-evidence-repository.js";
import { createCanonicalUnitedStatesProgressReportShadow } from "../src/canonical-progress-report-shadow.js";
import { scoreBayesianEvidenceCounts } from "../src/bayesian-progress-score.js";
import {
  buildProgressReportCanonicalShadowComparison,
  renderProgressReportCanonicalShadowMarkdown
} from "./lib/progress-report-canonical-shadow-comparison.mjs";

const clone = (value) => JSON.parse(JSON.stringify(value));
const report = buildProgressReportCanonicalShadowComparison();
const replay = buildProgressReportCanonicalShadowComparison();

assert.deepEqual(report, replay, "The shadow comparison must replay deterministically.");
assert.equal(report.executiveSummary.totalComparableItemSkillCases, 16);
assert.equal(report.executiveSummary.exactMatches, 11);
assert.equal(report.executiveSummary.semanticMatches, 1);
assert.equal(report.executiveSummary.intentionalDifferences, 3);
assert.equal(report.executiveSummary.unavailableCases, 1);
assert.equal(report.executiveSummary.defects, 0);
assert.doesNotThrow(() => JSON.parse(JSON.stringify(report)), "The machine-readable report must serialize.");

const exact = report.cases.find(({ id }) => id === "correct-then-repeated-misses");
assert.equal(exact.legacy.bayesianScore, scoreBayesianEvidenceCounts(1, 3));
assert.equal(exact.canonical.bayesianScore, scoreBayesianEvidenceCounts(1, 3));
assert.equal(exact.legacy.displayCategory.id, exact.canonical.displayCategory.id);

const separation = report.cases.find(({ id }) => id === "identification-separated-from-location");
const locationAfterNaming = report.cases.find(({ id }) => id === "identification-does-not-credit-location");
assert.deepEqual(separation.canonical.sourceData.conceptIds, ["state-naming:ohio"]);
assert.deepEqual(separation.canonical.sourceData.skillIds, ["identifying"]);
assert.equal(locationAfterNaming.canonical.bayesianScore, null, "Identification must not credit location.");

const assisted = report.cases.find(({ id }) => id === "guided-assisted-excluded");
assert.equal(assisted.canonical.evidenceCounts.assisted, 1);
assert.equal(assisted.canonical.evidenceCounts.correct, 0);
assert.equal(assisted.canonical.bayesianScore, null);

assert.deepEqual(report.doubleCountingValidation, {
  firstInserted: true,
  duplicateInserted: false,
  repositoryEventCount: 1,
  shadowCorrectCount: 1,
  shadowRawEventCount: 1,
  legacySourceStoresReadByShadow: false
});

const persisted = report.cases.find(({ id }) => id === "reload-persistence");
const reset = report.cases.find(({ id }) => id === "reset-to-unseen");
assert.equal(persisted.classification, "exact match");
assert.equal(persisted.canonical.bayesianScore, 0.5);
assert.equal(reset.classification, "exact match");
assert.equal(reset.canonical.unseen, true);

const historical = report.cases.find(({ id }) => id === "historical-legacy-only-location");
assert.equal(historical.classification, "unavailable/not comparable");
assert.equal(historical.legacy.bayesianScore !== null, true);
assert.equal(historical.canonical.bayesianScore, null);

const items = [{ id: "state:ohio", type: "state", targetId: "ohio", label: "Ohio", sourceActivityId: "us-states-05" }];
const events = [adaptCanonicalRetrievalAttempt({
  item: items[0],
  promptType: "name_to_place",
  result: "correct",
  eventId: "immutability-event",
  attemptId: "immutability-attempt",
  occurredAt: "2034-02-03T15:30:00.000Z",
  sourceMode: "journey",
  sourceActivityId: "us-states-05"
})];
const repository = appendCanonicalEvidenceEvents(createEmptyCanonicalEvidenceRepository(), events).repository;
const before = clone({ items, repository });
const shadow = createCanonicalUnitedStatesProgressReportShadow({ items, repository });
assert.deepEqual({ items, repository }, before, "The shadow adapter must not mutate items or repository state.");
assert.equal(shadow.developerOnly, true);
assert.equal(shadow.scoringModel.function, "scoreBayesianEvidenceCounts");
assert.equal(shadow.scoringInputPolicy, "Progress Evidence Policy histories only; raw events are provenance only");
assert.deepEqual(shadow.categories.map(({ id }) => id), ["state-locations", "state-identification", "state-capitals"]);
assert.doesNotThrow(() => createCanonicalUnitedStatesProgressReportShadow(), "An absent repository should produce an empty shadow report.");

const legacySource = readFileSync(new URL("../src/united-states-progress-report.js", import.meta.url), "utf8");
const shadowSource = readFileSync(new URL("../src/canonical-progress-report-shadow.js", import.meta.url), "utf8");
assert.match(legacySource, /scoreBayesianEvidenceCounts\(evidence\.correctCount, evidence\.incorrectCount\)/);
assert.match(shadowSource, /scoreBayesianEvidenceCounts\(correctCount, incorrectCount\)/);
assert.match(shadowSource, /applyProgressEvidencePolicy\(events\)/);
assert.match(shadowSource, /Progress Evidence Policy histories are the sole Bayesian input/);

const markdown = renderProgressReportCanonicalShadowMarkdown(report);
assert.match(markdown, /## Executive summary/);
assert.match(markdown, /## Representative examples/);
assert.match(markdown, /## Double-counting protection/);
assert.match(markdown, /## Migration readiness/);
assert.match(markdown, /Brand-new learners/);
assert.match(markdown, /Existing learners/);

console.log("Progress Report canonical-evidence shadow comparison passed.");
