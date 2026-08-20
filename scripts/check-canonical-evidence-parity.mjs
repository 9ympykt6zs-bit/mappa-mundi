import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  buildCanonicalEvidenceParityReport,
  createMemoryStorage,
  renderCanonicalEvidenceParityMarkdown,
  validateEvidenceParityScenario
} from "./lib/canonical-evidence-parity.mjs";

const clone = (value) => JSON.parse(JSON.stringify(value));
const report = buildCanonicalEvidenceParityReport();
const replay = buildCanonicalEvidenceParityReport();

assert.deepEqual(report, replay, "Parity scenarios must replay deterministically.");
assert.equal(report.executiveSummary.totalScenarios >= 5, true);
assert.equal(report.executiveSummary.defects, 0);
assert.equal(report.fixtureIntegrity.memoryTrailInputUnchanged, true);
assert.equal(report.fixtureIntegrity.dailyTrailInputUnchanged, true);
assert.doesNotThrow(() => JSON.parse(JSON.stringify(report)), "The JSON report must serialize.");

const journey = report.scenarios.find(({ id }) => id === "journey-locate-ohio-correct");
const memory = report.scenarios.find(({ id }) => id === "memory-trail-locate-ohio-repeated-misses");
const repeatedCorrect = report.scenarios.find(({ id }) => id === "memory-trail-locate-ohio-repeated-correct");
assert.equal(journey.canonical.events[0].conceptId, "state-location:ohio");
assert.equal(journey.canonical.events[0].skillId, "locating");
assert.equal(memory.canonical.events[0].conceptId, journey.canonical.events[0].conceptId);
assert.equal(memory.canonical.events[0].skillId, journey.canonical.events[0].skillId);
assert.deepEqual(repeatedCorrect.canonical.events.map(({ outcome }) => outcome), ["correct", "correct"]);
assert.equal(repeatedCorrect.legacy.correct, 2);

const separation = report.scenarios.find(({ id }) => id === "ohio-skill-separation");
assert.deepEqual(separation.canonical.events.map(({ conceptId }) => conceptId), [
  "state-location:ohio",
  "state-naming:ohio"
]);
assert.deepEqual(separation.canonical.events.map(({ skillId }) => skillId), ["locating", "identifying"]);

const assisted = report.scenarios.find(({ id }) => id === "daily-trail-guided-ohio");
assert.equal(assisted.canonical.events[0].outcome, "assisted");
assert.equal(assisted.canonical.derivedSummary[0].correctCount, 0);
assert.equal(assisted.canonical.derivedSummary[0].assistedCount, 1);

const mental = report.scenarios.find(({ id }) => id === "mental-map-lake-erie-relationship");
assert.deepEqual(mental.canonical.events.map(({ outcome }) => outcome), ["partial", "correct"]);
const reconstruction = report.scenarios.find(({ id }) => id === "reconstruction-partial-and-correct");
assert.deepEqual(reconstruction.canonical.events.map(({ outcome }) => outcome), ["partial", "correct"]);

const duplicate = report.scenarios.find(({ id }) => id === "duplicate-protection-single-action");
assert.equal(duplicate.canonical.eventCount, 1, "One user action must leave one canonical event.");

const missingEvent = validateEvidenceParityScenario({
  id: "missing-event-control",
  mode: "test-control",
  action: "Legacy state updates but canonical emission is absent.",
  legacy: { source: "controlled fixture", evidenceBearingActions: 1 },
  canonicalEvents: [],
  expectedCanonicalEventCount: 1
});
assert.equal(missingEvent.verdict, "defect");
assert.match(missingEvent.comparisons[0].explanation, /canonical evidence is missing/);

const persistence = report.scenarios.find(({ id }) => id === "reload-persistence-parity");
assert.equal(persistence.verdict, "match");
assert.equal(persistence.canonical.events.length, 1);

const fixture = { legacy: { correct: 1 }, canonical: clone(journey.canonical.events) };
const fixtureBefore = clone(fixture);
validateEvidenceParityScenario({
  id: "immutability-control",
  mode: "test-control",
  action: "Validate without mutation.",
  legacy: fixture.legacy,
  canonicalEvents: fixture.canonical,
  expectedCanonicalEventCount: 1
});
assert.deepEqual(fixture, fixtureBefore, "Parity validation must not mutate production-shaped fixtures.");

const markdown = renderCanonicalEvidenceParityMarkdown(report);
assert.match(markdown, /## Executive summary/);
assert.match(markdown, /## Scenario table/);
assert.match(markdown, /## Field-level differences/);
assert.match(markdown, /## Coverage/);
assert.match(markdown, /## Risks/);

const runtimeSource = readFileSync(new URL("../src/maplibre-poc.js", import.meta.url), "utf8");
assert.match(runtimeSource, /const result = session\.tryAnswer\(targetId\);\n  recordCanonicalJourneyPlacementEvidence\(result\);/);
assert.match(runtimeSource, /updateMemoryTrailDebugObject\(memoryTrail\);\n  recordCanonicalMemoryTrailEvidence/);
assert.match(runtimeSource, /onEvaluation: \(evaluation\) => recordCanonicalReconstructionEvaluation/);
assert.equal(createMemoryStorage().getItem("missing"), null);

console.log("Canonical vs legacy evidence parity check passed.");
