import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/maplibre-poc.js", import.meta.url), "utf8");
const runnerSource = fs.readFileSync(new URL("../src/maplibre/maplibre-activity-runner.js", import.meta.url), "utf8");
const usStates02 = JSON.parse(fs.readFileSync(new URL("../assets/maps/data/us-states-capitals-02.json", import.meta.url), "utf8"));

const applyStart = source.indexOf("function applyMemoryTrailSectionQuizCamera(memoryTrail, selection = {}, options = {})");
const applyEnd = source.indexOf("function applyDailyTrailTargetQuizCamera", applyStart);
assert.ok(applyStart >= 0 && applyEnd > applyStart, "Section quiz camera function is missing.");
const applySource = source.slice(applyStart, applyEnd);

const genericStart = source.indexOf("function applyGenericMobileSectionQuizCamera(memoryTrail, selection = {}, options = {})");
const genericEnd = source.indexOf("function applyMemoryTrailSectionQuizCamera", genericStart);
assert.ok(genericStart >= 0 && genericEnd > genericStart, "Generic mobile section quiz camera helper is missing.");
const genericSource = source.slice(genericStart, genericEnd);

const shouldUseStart = source.indexOf("function shouldUseGenericMobileSectionQuizCamera(memoryTrail = getActiveMemoryTrail())");
const shouldUseEnd = source.indexOf("function getMemoryTrailSectionQuizCameraKey", shouldUseStart);
assert.ok(shouldUseStart >= 0 && shouldUseEnd > shouldUseStart, "Generic mobile section quiz gate is missing.");
const shouldUseSource = source.slice(shouldUseStart, shouldUseEnd);

const targetSetStart = source.indexOf("function getMemoryTrailSectionTargetSet(memoryTrail = getActiveMemoryTrail())");
const targetSetEnd = source.indexOf("function getMobileSectionQuizFitPadding", targetSetStart);
assert.ok(targetSetStart >= 0 && targetSetEnd > targetSetStart, "Section target-set helper is missing.");
const targetSetSource = source.slice(targetSetStart, targetSetEnd);

const paddingStart = source.indexOf("function getMobileSectionQuizFitPadding()");
const paddingEnd = source.indexOf("function getMobileSectionQuizCameraKey", paddingStart);
assert.ok(paddingStart >= 0 && paddingEnd > paddingStart, "Mobile section quiz padding helper is missing.");
const paddingSource = source.slice(paddingStart, paddingEnd);

const scheduleStart = source.indexOf("function scheduleMemoryTrailSectionQuizCameraCheck(memoryTrail, selection = {})");
const scheduleEnd = source.indexOf("function lockDailyTrailFixedCameraAfterLearn", scheduleStart);
assert.ok(scheduleStart >= 0 && scheduleEnd > scheduleStart, "Section quiz camera follow-up scheduler is missing.");
const scheduleSource = source.slice(scheduleStart, scheduleEnd);

assert.ok(
  targetSetSource.includes("memoryTrail.targetPool"),
  "Generic section camera must use the full Memory Trail section target pool."
);
assert.ok(
  genericSource.includes("runner.fitTargets(targets"),
  "Generic mobile section camera must fit the combined section targets."
);
assert.ok(
  genericSource.includes('cameraContext: "section-quiz-view"')
    && genericSource.includes('source: "memory-trail-section-quiz-camera"'),
  "Generic mobile section camera must preserve section quiz camera context/source."
);
assert.ok(
  shouldUseSource.includes("isCompactTouchLayout()"),
  "Generic section camera must be mobile-only."
);
assert.ok(
  shouldUseSource.includes('memoryTrail?.source === "daily-trail"')
    && shouldUseSource.includes('memoryTrail?.sessionPhase !== "learn"')
    && shouldUseSource.includes("!isGuidedMemoryTrailPrompt(memoryTrail)")
    && genericSource.includes("isMixedDailyTrailCheckpointMemoryTrail(memoryTrail)")
    && shouldUseSource.includes("!isCompletedDailyTrailReviewMemoryTrail(memoryTrail)"),
  "Generic section camera must exclude Learn, checkpoint, completed review, and non-Daily Trail contexts."
);
assert.ok(
  paddingSource.includes('document.querySelector(".poc-header")')
    && paddingSource.includes('document.querySelector("#answer-panel")?.getBoundingClientRect')
    && paddingSource.includes("function getMobileSectionQuizFitOffset()")
    && paddingSource.includes("usableCenterY - mapCenterY"),
  "Mobile section camera must measure the header and chip tray for asymmetric padding."
);
assert.ok(
  genericSource.includes("offset,"),
  "Generic mobile section camera must use a screen-space offset rather than tray-sized bottom padding."
);
assert.ok(
  runnerSource.includes("const offset = this.normalizeCameraOffset(requestedCamera.offset);")
    && runnerSource.includes("normalizeCameraOffset(offset)")
    && runnerSource.includes("offset: Array.isArray(options.offset) ? options.offset : undefined"),
  "Runner fitBounds path must pass section-quiz offsets through to MapLibre."
);
assert.ok(
  applySource.indexOf("const mobileSectionQuizCamera = getActiveDailyTrailMobileSectionQuizCamera(memoryTrail);")
    < applySource.indexOf("applyGenericMobileSectionQuizCamera(memoryTrail, selection, options)")
    && applySource.indexOf("applyGenericMobileSectionQuizCamera(memoryTrail, selection, options)")
    < applySource.indexOf("const dailyTrailFixedCamera"),
  "Camera precedence must be explicit mobile override, generic mobile fit, then existing fixed/regional fallback."
);
assert.ok(
  scheduleSource.includes("shouldUseGenericMobileCamera")
    && scheduleSource.includes("shouldUseGenericMobileSectionQuizCamera(memoryTrail)")
    && scheduleSource.includes("!mobileSectionQuizCamera")
    && shouldUseSource.includes("!isCompletedDailyTrailReviewMemoryTrail(memoryTrail)"),
  "Follow-up camera check must include the generic mobile path without changing terminal review."
);

assert.deepEqual(usStates02.map?.dailyTrailMobileSectionQuizCamera, {
  center: [-75.50126, 40.65817],
  zoom: 4.6148,
  bearing: 0,
  pitch: 0,
  cameraContext: "section-quiz-view",
  source: "memory-trail-section-quiz-camera"
});

console.log("Daily Trail mobile section quiz camera check passed.");
