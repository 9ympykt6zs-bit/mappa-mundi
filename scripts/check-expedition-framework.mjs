import assert from "node:assert/strict";
import fs from "node:fs";
import { acrossUnitedStatesExpedition } from "../src/across-united-states-expedition.js";
import {
  createExpeditionReadModel,
  validateExpeditionConfiguration
} from "../src/expedition-framework.js";

assert.deepEqual(validateExpeditionConfiguration(acrossUnitedStatesExpedition), []);
const empty = createExpeditionReadModel(acrossUnitedStatesExpedition, {});
assert.equal(empty.recommendedStepId, "learn-regions");
assert.equal(empty.steps.find(({ id }) => id === "open-atlas").status, "available");
assert.equal(empty.steps.find(({ id }) => id === "build-state-recall").status, "locked");
assert.equal(empty.progress.completedCount, 0);

const partial = createExpeditionReadModel(acrossUnitedStatesExpedition, {
  usJourneyStateStepsCompleted: 2,
  usTrailHasStarted: true,
  usTrailIntroducedCount: 4
});
assert.equal(partial.steps.find(({ id }) => id === "learn-regions").status, "complete");
assert.equal(partial.steps.find(({ id }) => id === "build-state-recall").status, "in-progress");
assert.equal(partial.recommendedStepId, "build-state-recall");

const directEvidence = createExpeditionReadModel(acrossUnitedStatesExpedition, {
  usConnectionsAttempts: 3
});
assert.equal(directEvidence.steps.find(({ id }) => id === "make-connections").status, "complete", "Existing direct-entry evidence must count even when prior Expedition steps are incomplete.");
assert.equal(directEvidence.steps.find(({ id }) => id === "reason-without-map").status, "available");

assert.throws(() => createExpeditionReadModel({
  id: "broken",
  title: "Broken",
  steps: [{ id: "one", title: "One", launch: { kind: "atlas" }, prerequisiteStepIds: ["missing"] }]
}, {}), /unknown prerequisite/);

assert.equal(new Set(acrossUnitedStatesExpedition.steps.map(({ id }) => id)).size, acrossUnitedStatesExpedition.steps.length);
assert.ok(acrossUnitedStatesExpedition.steps.every((step) => step.launch?.kind));
assert.ok(acrossUnitedStatesExpedition.steps.some((step) => step.launch.kind === "journey"));
assert.ok(acrossUnitedStatesExpedition.steps.some((step) => step.launch.kind === "united-states-memory-trail"));
assert.ok(acrossUnitedStatesExpedition.steps.some((step) => step.launch.kind === "mental-map"));
assert.ok(acrossUnitedStatesExpedition.steps.some((step) => step.launch.kind.startsWith("map-reconstruction")));

const frameworkSource = fs.readFileSync(new URL("../src/expedition-framework.js", import.meta.url), "utf8");
const runtimeSource = fs.readFileSync(new URL("../src/maplibre-poc.js", import.meta.url), "utf8");
const indexSource = fs.readFileSync(new URL("../index.html", import.meta.url), "utf8");
assert.doesNotMatch(frameworkSource, /localStorage|sessionStorage/, "The reusable framework must not create an Expedition learner-state store.");
assert.match(runtimeSource, /loadUnitedStatesMemoryTrailProgress\(\)/);
assert.match(runtimeSource, /loadCanonicalEvidenceRepository\(\)/);
assert.match(runtimeSource, /getJourneyProgress\(journeyId, loadProgress\(\)\)/);
assert.match(runtimeSource, /returnFromUnitedStatesExpeditionActivity/);
assert.match(indexSource, /id="main-menu-us-expedition-button"/);
for (const directEntryId of [
  "main-menu-us-memory-trail-button",
  "main-menu-united-states-atlas-button",
  "main-menu-united-states-relationships-button",
  "main-menu-mental-map-challenge-button",
  "main-menu-map-reconstruction-button"
]) {
  assert.match(indexSource, new RegExp(`id="${directEntryId}"`), `Direct entry ${directEntryId} must remain available.`);
}

console.log("Expedition framework validation passed:", JSON.stringify({
  steps: empty.steps.length,
  requiredMilestones: empty.progress.totalCount,
  recommendedForNewLearner: empty.recommendedStepId,
  recommendedForPartialLearner: partial.recommendedStepId
}));
