import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/maplibre-poc.js", import.meta.url), "utf8");
const runnerSource = fs.readFileSync(new URL("../src/maplibre/maplibre-activity-runner.js", import.meta.url), "utf8");
const usStates02 = JSON.parse(fs.readFileSync(new URL("../assets/maps/data/us-states-capitals-02.json", import.meta.url), "utf8"));

const applyStart = source.indexOf("function applyMemoryTrailSectionQuizCamera(memoryTrail, selection = {}, options = {})");
const applyEnd = source.indexOf("function applyDailyTrailTargetQuizCamera", applyStart);
assert.ok(applyStart >= 0 && applyEnd > applyStart, "Section quiz camera function is missing.");
const applySource = source.slice(applyStart, applyEnd);

const targetQuizStart = source.indexOf("function applyDailyTrailTargetQuizCamera(memoryTrail, selection = {}, options = {})");
const targetQuizEnd = source.indexOf("function scheduleMemoryTrailSectionQuizCameraCheck", targetQuizStart);
assert.ok(targetQuizStart >= 0 && targetQuizEnd > targetQuizStart, "Target quiz camera function is missing.");
const targetQuizSource = source.slice(targetQuizStart, targetQuizEnd);

const genericStart = source.indexOf("function applyGenericMobileSectionQuizCamera(memoryTrail, selection = {}, options = {})");
const genericEnd = source.indexOf("function applyMemoryTrailSectionQuizCamera", genericStart);
assert.ok(genericStart >= 0 && genericEnd > genericStart, "Generic mobile section quiz camera helper is missing.");
const genericSource = source.slice(genericStart, genericEnd);

const decisionStart = source.indexOf("function getGenericMobileSectionQuizFitDecision(memoryTrail = getActiveMemoryTrail())");
const decisionEnd = source.indexOf("function getMobileSectionQuizFitPadding", decisionStart);
assert.ok(decisionStart >= 0 && decisionEnd > decisionStart, "Generic section quiz fit decision helper is missing.");
const decisionSource = source.slice(decisionStart, decisionEnd);

const shouldUseStart = source.indexOf("function shouldUseGenericMobileSectionQuizCamera(memoryTrail = getActiveMemoryTrail())");
const shouldUseEnd = source.indexOf("function recordSectionQuizCameraTrace", shouldUseStart);
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
  source.includes('const memoryTrailSectionQuizCameraContext = "section-quiz-view"')
    && source.includes('const memoryTrailSectionQuizCameraSource = "memory-trail-section-quiz-camera"')
    && genericSource.includes("cameraContext: memoryTrailSectionQuizCameraContext")
    && genericSource.includes("source: memoryTrailSectionQuizCameraSource"),
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
    && decisionSource.includes("isMixedDailyTrailCheckpointMemoryTrail(memoryTrail)")
    && shouldUseSource.includes("!isCompletedDailyTrailReviewMemoryTrail(memoryTrail)"),
  "Generic section camera must exclude Learn, checkpoint, completed review, and non-Daily Trail contexts."
);
assert.ok(
  decisionSource.includes("getActiveDailyTrailFixedCamera(memoryTrail) || getActiveDailyTrailNonLearnCamera(memoryTrail)")
    && decisionSource.indexOf("getActiveDailyTrailFixedCamera(memoryTrail) || getActiveDailyTrailNonLearnCamera(memoryTrail)")
      < decisionSource.indexOf("runner.getCombinedTargetBounds(targets)"),
  "Existing fixed/non-Learn regional cameras must reject the generic fit before bounds fitting."
);
assert.ok(
  decisionSource.includes("genericMobileSectionQuizAntimeridianSpan")
    && decisionSource.includes("genericMobileSectionQuizMaxLongitudeSpan")
    && decisionSource.includes("genericMobileSectionQuizMaxLatitudeSpan")
    && decisionSource.includes("touchesWorldWrap"),
  "Generic mobile section camera must reject world-wrap and overly broad section bounds."
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
  runnerSource.includes("getCombinedTargetBounds(targets = [])")
    && runnerSource.indexOf("const bounds = this.getCombinedTargetBounds(targets);")
      < runnerSource.indexOf("debugContinentsOceansRunnerCamera(\"fitTargets requested\""),
  "Runner must expose the combined target bounds used by generic section fits."
);
assert.ok(
  applySource.indexOf("const mobileSectionQuizCamera = getActiveDailyTrailMobileSectionQuizCamera(memoryTrail);")
    < applySource.indexOf("applyGenericMobileSectionQuizCamera(memoryTrail, selection, options)")
    && applySource.indexOf("applyGenericMobileSectionQuizCamera(memoryTrail, selection, options)")
    < applySource.indexOf("const dailyTrailFixedCamera"),
  "Camera precedence must be explicit mobile override, generic mobile fit, then existing fixed/regional fallback."
);
assert.ok(
  genericSource.includes("isAuthoritativeSectionQuizCameraCurrent(memoryTrail, cameraKey)")
    && applySource.includes("isAuthoritativeSectionQuizCameraCurrent(memoryTrail, cameraKey)")
    && genericSource.includes("cached generic section camera key no longer matches active camera context"),
  "Cached section camera keys must not suppress reapply after another camera overwrites the context."
);
assert.ok(
  targetQuizSource.includes("isCompactTouchLayout() && isAuthoritativeSectionQuizCameraCurrent(memoryTrail)")
    && targetQuizSource.includes("target quiz camera suppressed while authoritative mobile section quiz camera is active"),
  "Target-specific quiz cameras must be suppressed while an authoritative mobile section quiz camera is current."
);
assert.ok(
  scheduleSource.includes("shouldUseGenericMobileCamera")
    && scheduleSource.includes("shouldUseGenericMobileSectionQuizCamera(memoryTrail)")
    && scheduleSource.includes("!mobileSectionQuizCamera")
    && shouldUseSource.includes("!isCompletedDailyTrailReviewMemoryTrail(memoryTrail)")
    && scheduleSource.includes("applyMemoryTrailSectionQuizCamera(memoryTrail, selection, { duration: 260 })"),
  "Follow-up camera check must include the generic mobile path and re-run the authoritative section camera apply."
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
