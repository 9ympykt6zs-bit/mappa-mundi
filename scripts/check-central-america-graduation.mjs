import assert from "node:assert/strict";
import fs from "node:fs";
import { getCanonicalRetrievalItemForActivity, validateActivityEvidenceContract } from "../src/activity-evidence-contract.js";
import { centralAmericaLearningUnit } from "../src/central-america-learning-unit.js";
import { geographyLearningUnits, getGeographyLearningUnit } from "../src/geography-learning-unit-registry.js";
import { adaptCanonicalRetrievalAttempt, getCanonicalRetrievalMappings } from "../src/canonical-learning-evidence.js";
import {
  loadCanonicalEvidenceRepository,
  recordCanonicalEvidenceEvents
} from "../src/canonical-learning-evidence-repository.js";
import { createSeededRandom } from "../src/deterministic-dependencies.js";
import {
  createGeographyLearningUnitExpeditionModel,
  createGeographyLearningUnitItems,
  createGeographyLearningUnitProgressReport,
  validateGeographyLearningUnitConfiguration
} from "../src/geography-learning-unit.js";
import {
  createCanonicalEvidenceInspectorView,
  createCanonicalRetrievalInspectorItemView
} from "../src/learning-inspector.js";
import { normalizeActivity } from "../src/map-engines/activity-normalizer.js";
import { ActivitySession } from "../src/maplibre/activity-session.js";
import { applyProgressEvidencePolicy } from "../src/progress-evidence-policy.js";
import { createMemoryTrailSelectionTrace } from "../src/selection-trace.js";

function createMemoryStorage() {
  const values = new Map();
  return {
    getItem: (key) => values.has(key) ? values.get(key) : null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key)
  };
}

const rawActivity = JSON.parse(fs.readFileSync(new URL("../assets/maps/data/central-america.json", import.meta.url), "utf8"));
const activity = normalizeActivity(rawActivity);
const expectedTargetIds = ["belize", "guatemala", "honduras", "el-salvador", "nicaragua", "costa-rica", "panama"];
assert.deepEqual(validateGeographyLearningUnitConfiguration(centralAmericaLearningUnit), []);
assert.deepEqual(geographyLearningUnits, [centralAmericaLearningUnit]);
assert.equal(getGeographyLearningUnit(centralAmericaLearningUnit.id), centralAmericaLearningUnit);
assert.deepEqual(validateActivityEvidenceContract(activity.canonicalEvidence), []);
assert.deepEqual(centralAmericaLearningUnit.targets.map(({ id }) => id), expectedTargetIds);
assert.deepEqual(new Set(activity.targets.map(({ id }) => id)), new Set(expectedTargetIds));
assert.equal(activity.canonicalEvidence.entityType, "country");

const contractItem = getCanonicalRetrievalItemForActivity(activity, "belize");
assert.deepEqual(contractItem, {
  id: "country:belize",
  type: "country",
  targetId: "belize",
  label: "Belize",
  sourceActivityId: "central-america"
});
assert.deepEqual(getCanonicalRetrievalMappings(contractItem), [
  { conceptId: "country-location:belize", skillId: "locating", promptType: "name_to_place" },
  { conceptId: "country-naming:belize", skillId: "identifying", promptType: "place_to_name" }
]);

const sessionA = new ActivitySession(activity, { random: createSeededRandom("central-america") });
const sessionB = new ActivitySession(activity, { random: createSeededRandom("central-america") });
assert.deepEqual(sessionA.visibleAnswerIds, sessionB.visibleAnswerIds, "The shared ActivitySession must support deterministic seeded replay.");
assert.deepEqual(sessionA.visibleAnswerIds.length, 7);

const events = createGeographyLearningUnitItems(centralAmericaLearningUnit).flatMap((item, index) => [
  adaptCanonicalRetrievalAttempt({
    item,
    promptType: "name_to_place",
    result: "correct",
    eventId: `central-location-${index}`,
    attemptId: `central-location-${index}`,
    occurredAt: `2026-08-21T12:${String(index).padStart(2, "0")}:00.000Z`,
    sourceMode: "journey",
    sourceActivityId: "central-america"
  }),
  adaptCanonicalRetrievalAttempt({
    item,
    promptType: "place_to_name",
    result: index === 0 ? "incorrect" : "correct",
    eventId: `central-identification-${index}`,
    attemptId: `central-identification-${index}`,
    occurredAt: `2026-08-21T13:${String(index).padStart(2, "0")}:00.000Z`,
    sourceMode: "memory-trail",
    sourceActivityId: "central-america"
  })
]);
const storage = createMemoryStorage();
const recorded = recordCanonicalEvidenceEvents(events, storage);
assert.equal(recorded.ok, true);
assert.equal(recorded.insertedEventIds.length, 14);
const repository = loadCanonicalEvidenceRepository(storage);
assert.equal(repository.status.code, "ready");
assert.deepEqual(repository.events, events, "Canonical evidence must survive the shared repository persistence round trip.");

const policy = applyProgressEvidencePolicy(repository.events);
assert.equal(policy.decisions.every(({ included, sourceModeValidated }) => included && sourceModeValidated), true);
assert.equal(policy.histories.filter(({ progressSkillId }) => progressSkillId === "country-location").length, 7);
assert.equal(policy.histories.filter(({ progressSkillId }) => progressSkillId === "country-identification").length, 7);

const report = createGeographyLearningUnitProgressReport(centralAmericaLearningUnit, repository);
assert.equal(report.readPath.id, "canonical-first");
assert.deepEqual(report.categories.map(({ id }) => id), ["country-locations", "country-identification"]);
assert.equal(report.categories.every(({ totalPossible, attemptedCount }) => totalPossible === 7 && attemptedCount === 7), true);
assert.equal(report.categories[1].records.find(({ itemId }) => itemId === "country:belize").evidenceHistory.incorrectCount, 1);

const inspector = createCanonicalEvidenceInspectorView({ repository, sourceMode: "memory-trail" });
assert.equal(inspector.summaries.value.length, 7);
assert.equal(inspector.recentEvidence.value.every(({ sourceActivityId }) => sourceActivityId === "central-america"), true);
const belizeInspector = createCanonicalRetrievalInspectorItemView({ item: createGeographyLearningUnitItems(centralAmericaLearningUnit)[0], repository });
assert.equal(belizeInspector.adapter, "canonical-retrieval");
assert.equal(belizeInspector.metrics.attempts.value, 2);
assert.equal(belizeInspector.metrics.failures.value, 1);

const trace = createMemoryTrailSelectionTrace({
  memoryTrail: {
    activityId: "central-america",
    promptCount: 4,
    lastPromptedTargetId: "guatemala",
    targetPool: activity.targets,
    currentPracticeWindow: activity.targets.slice(0, 4),
    targetStats: Object.fromEntries(activity.targets.slice(0, 4).map((target) => [target.id, {
      targetId: target.id,
      isIntroduced: true,
      totalRetrievalCorrect: target.id === "belize" ? 0 : 1
    }]))
  },
  selection: {
    targetId: "belize",
    promptType: "place_to_name",
    mode: "practice",
    reason: "current chunk needs retrieval practice"
  },
  target: activity.targets.find(({ id }) => id === "belize"),
  deterministicContext: { seed: "central-america", now: "2026-08-21T14:00:00.000Z" }
});
assert.equal(trace.planner.value, "memory-trail");
assert.equal(trace.selected.value.id, "belize");
assert.equal(trace.deterministicContext.seed.value, "central-america");
assert.ok(trace.selectionReasons.value.includes("current chunk needs retrieval practice"));

const emptyExpedition = createGeographyLearningUnitExpeditionModel(centralAmericaLearningUnit, { ...repository, events: [] });
assert.equal(emptyExpedition.recommendedStepId, "locate-countries");
assert.equal(emptyExpedition.steps.find(({ id }) => id === "identify-countries").status, "locked");
const completeExpedition = createGeographyLearningUnitExpeditionModel(centralAmericaLearningUnit, repository);
assert.equal(completeExpedition.progress.completedCount, 2);
assert.equal(completeExpedition.progress.totalCount, 2);
assert.equal(completeExpedition.steps.find(({ id }) => id === "view-progress").isOptional, true);

const runtimeSource = fs.readFileSync(new URL("../src/maplibre-poc.js", import.meta.url), "utf8");
const indexSource = fs.readFileSync(new URL("../index.html", import.meta.url), "utf8");
const inspectorPanelSource = fs.readFileSync(new URL("../src/learning-inspector-panel.js", import.meta.url), "utf8");
assert.match(runtimeSource, /getCanonicalRetrievalItemForActivity\(session\.currentActivity, targetId\)/);
assert.match(runtimeSource, /createGeographyLearningUnitProgressReport\(unit, loadCanonicalEvidenceRepository\(\)\)/);
assert.match(runtimeSource, /getValidJourneySteps\(journey\)\.findIndex\(\(candidate\) => candidate\.id === launch\.stepId\)/);
assert.match(runtimeSource, /createCanonicalRetrievalInspectorItemView/);
assert.match(runtimeSource, /createMemoryTrailSelectionTrace/);
assert.match(runtimeSource, /mainMenuLearnButton\?\.addEventListener\("click", \(\) => \{\s+showAppScreen\("learn-menu"\)/);
assert.doesNotMatch(runtimeSource, /centralAmericaLearningUnit/);
assert.match(inspectorPanelSource, /summary\.attemptCount \?\? summary\.attempts/);
assert.match(inspectorPanelSource, /summary\.mostRecentOutcome \?\? summary\.lastOutcome/);
assert.match(indexSource, /id="main-menu-central-america-unit-button"/);

console.log("Central America architecture graduation validation passed.");
