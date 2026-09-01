import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const indexSource = read("../index.html");
const runtimeSource = read("../src/maplibre-poc.js");
const expeditionSource = read("../src/across-united-states-expedition.js");
const plannerSource = read("../src/united-states-memory-trail-planner.js");
const progressReportSource = read("../src/united-states-progress-report.js");

for (const oldLearnerLabel of [
  ">Browse<",
  "Browse geography",
  "Browse continents",
  ">Study<",
  "Start Memory Trail",
  "Try Memory Trail?",
  "United States Memory Trail"
]) {
  assert.equal(indexSource.includes(oldLearnerLabel), false, `Learner UI must not retain ${oldLearnerLabel}.`);
}

assert.match(indexSource, />Explore</);
assert.match(indexSource, />Guided Learning</);
assert.match(indexSource, /maplibre-poc\.js\?v=20260901-guided-physical-teaching-1/);
assert.match(runtimeSource, /const label = isGuidedLearning \? "Label Map" : "Guided Learning"/);
assert.match(runtimeSource, /selectUnitedStatesEvidenceDrivenContinuation\(\{/);
assert.match(runtimeSource, /continuation\.destination\.kind === "united-states-guided-learning"/);
assert.match(runtimeSource, /await startOrContinueUnitedStatesMemoryTrail\(\{[\s\S]*targetSectionId:/);
assert.match(expeditionSource, /United States Guided Learning|U\.S\. Guided Learning/);
assert.match(plannerSource, /title: "United States Guided Learning"/);
assert.match(progressReportSource, /label: "United States Guided Learning"/);

assert.match(runtimeSource, /UNITED_STATES_MEMORY_TRAIL_SOURCE/, "Internal scheduler identity must remain unchanged.");
assert.match(plannerSource, /united-states-memory-trail/, "Persisted Guided Learning identity must remain unchanged.");

console.log("Learner terminology and new-U.S.-learner entry-flow checks passed.");
