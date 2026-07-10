import assert from "node:assert/strict";
import fs from "node:fs";

const runtimeSource = fs.readFileSync("src/maplibre-poc.js", "utf8");
const runnerSource = fs.readFileSync("src/maplibre/maplibre-activity-runner.js", "utf8");

const capitalOpacityStart = runnerSource.indexOf("getCapitalOpacityExpression() {");
const capitalOpacityEnd = runnerSource.indexOf("getStateCapitalStarOpacityExpression()", capitalOpacityStart);
const capitalOpacitySource = runnerSource.slice(capitalOpacityStart, capitalOpacityEnd);

assert.ok(
  capitalOpacitySource.includes("this.isMemoryTrailStudyTargetEmphasisSuppressed()"),
  "Capital marker opacity should honor active adaptive-trail visual suppression."
);
assert.ok(
  capitalOpacitySource.includes("this.getMemoryTrailActiveHighlightIds()"),
  "Current guided/place-to-name capital highlights should remain visible while future capitals are suppressed."
);

const capitalHaloStart = runnerSource.indexOf("getCapitalHaloOpacityExpression() {");
const capitalHaloEnd = runnerSource.indexOf("getColorMatchStops()", capitalHaloStart);
const capitalHaloSource = runnerSource.slice(capitalHaloStart, capitalHaloEnd);

assert.ok(
  capitalHaloSource.includes("this.isMemoryTrailStudyTargetEmphasisSuppressed()"),
  "Capital halo opacity should honor active adaptive-trail visual suppression."
);

const completedLabelStart = runnerSource.indexOf("getCompletedLabelGeoJson() {");
const completedLabelEnd = runnerSource.indexOf("getLabelCoordinates(feature)", completedLabelStart);
const completedLabelSource = runnerSource.slice(completedLabelStart, completedLabelEnd);

assert.ok(
  completedLabelSource.includes("this.isMemoryTrailStudyTargetEmphasisSuppressed()"),
  "Completed labels should not reveal capital answers during active suppressed prompts."
);
assert.ok(
  runnerSource.includes('this.map.setLayoutProperty("capital-hit", "visibility", "visible");'),
  "Capital hit layer should remain visible for map tapping even when marker visuals are suppressed."
);
assert.ok(
  runtimeSource.includes("return isAdaptiveTrailMemoryTrail(memoryTrail)")
    && runtimeSource.includes("function shouldUseGenericMobileSectionQuizCamera"),
  "Generic mobile section quiz camera should be available to U.S. Trail recall prompts."
);
assert.ok(
  runtimeSource.includes("sectionQuizView: activity.map?.regionView || null"),
  "U.S. Trail should provide a non-learn section camera for desktop recall prompts."
);

console.log("United States Memory Trail capital visual validation passed.");
