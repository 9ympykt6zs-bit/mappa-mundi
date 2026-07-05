import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/maplibre-poc.js", import.meta.url), "utf8");
const activity = JSON.parse(
  fs.readFileSync(new URL("../assets/maps/data/us-states-capitals-01.json", import.meta.url), "utf8")
);

const target = activity.features.find((feature) => feature.id === "new-hampshire");
assert.ok(target, "New Hampshire target is missing from us-states-01.");
assert.deepEqual(target.mobileDailyTrailLearnCamera, {
  center: [-71.63703, 41.88495],
  zoom: 4.6367,
  bearing: 0,
  pitch: 0
});

const normalizeStart = source.indexOf("function normalizeDailyTrailMobileLearnCamera(config = null)");
const normalizeEnd = source.indexOf("function getPreviousMemoryTrailSection", normalizeStart);
assert.ok(normalizeStart >= 0 && normalizeEnd > normalizeStart, "Mobile Learn camera normalizer is missing.");
const normalizeSource = source.slice(normalizeStart, normalizeEnd);

const eligibilityStart = source.indexOf("function isGenericMobileDailyTrailLearnTarget(memoryTrail, selection = {}, target = null)");
const eligibilityEnd = source.indexOf("function getMobileDailyTrailLearnFitPadding()", eligibilityStart);
assert.ok(eligibilityStart >= 0 && eligibilityEnd > eligibilityStart, "Generic mobile Learn eligibility helper is missing.");
const eligibilitySource = source.slice(eligibilityStart, eligibilityEnd);

const paddingStart = source.indexOf("function getMobileDailyTrailLearnFitPadding()");
const paddingEnd = source.indexOf("function getDailyTrailMobileLearnCameraKey", paddingStart);
assert.ok(paddingStart >= 0 && paddingEnd > paddingStart, "Mobile Learn fit padding helper is missing.");
const paddingSource = source.slice(paddingStart, paddingEnd);

const keyStart = source.indexOf("function getDailyTrailMobileLearnCameraKey(memoryTrail, target, padding = {}, camera = null)");
const keyEnd = source.indexOf("function hasAppliedDailyTrailMobileLearnCameraForPrompt", keyStart);
assert.ok(keyStart >= 0 && keyEnd > keyStart, "Mobile Learn camera key helper is missing.");
const keySource = source.slice(keyStart, keyEnd);

const smallStart = source.indexOf("function scheduleSmallTargetLearnFocusCheck(memoryTrail, selection, target)");
const smallEnd = source.indexOf("function scheduleContinentsOceansLearnFocusCheck", smallStart);
assert.ok(smallStart >= 0 && smallEnd > smallStart, "Small-target Learn focus scheduler is missing.");
const smallSource = source.slice(smallStart, smallEnd);

const scheduleStart = source.indexOf("function scheduleDailyTrailTargetLearnCamera(memoryTrail, selection, target)");
const scheduleEnd = source.indexOf("function completeDailyTrailDevReplaySession", scheduleStart);
assert.ok(scheduleStart >= 0 && scheduleEnd > scheduleStart, "Daily Trail target Learn camera scheduler is missing.");
const scheduleSource = source.slice(scheduleStart, scheduleEnd);

assert.ok(
  normalizeSource.includes('cameraContext: String(config?.cameraContext || "learn-target-focus").trim()')
    && normalizeSource.includes('source: String(config?.source || "daily-trail-mobile-learn-fit").trim()'),
  "Mobile Learn camera overrides must use the target Learn Camera Dev identity by default."
);
assert.ok(
  eligibilitySource.includes('memoryTrail?.source === "daily-trail"')
    && eligibilitySource.includes('currentAppScreen === "daily-trail-gameplay"')
    && eligibilitySource.includes("isCompactTouchLayout()")
    && eligibilitySource.includes('selection?.promptType === "guided"')
    && eligibilitySource.includes('selection?.mode === "learn"')
    && eligibilitySource.includes('target?.kind === "shape"'),
  "Generic mobile Learn eligibility must be Daily Trail gameplay, mobile, guided Learn, and geographic-shape scoped."
);
assert.ok(
  eligibilitySource.includes("!isMixedDailyTrailCheckpointMemoryTrail(memoryTrail)")
    && eligibilitySource.includes("!isCompletedDailyTrailReviewMemoryTrail(memoryTrail)")
    && eligibilitySource.includes("session.currentActivity?.id !== continentsOceansActivityId")
    && eligibilitySource.includes("!getActiveDailyTrailFixedCamera(memoryTrail)"),
  "Generic mobile Learn eligibility must not affect checkpoint, terminal review, C&O, or fixed-camera contexts."
);
assert.ok(
  !eligibilitySource.includes("shouldFocusSmallTargetInLearnMode"),
  "Generic mobile Learn eligibility must not depend on the small-target threshold."
);
assert.ok(
  paddingSource.includes('document.querySelector(".poc-header")')
    && paddingSource.includes('document.querySelector("#answer-panel")?.getBoundingClientRect')
    && paddingSource.includes("Math.min(210, Math.max(180")
    && paddingSource.includes("usableHeight * 0.415"),
  "Mobile Learn fit padding must measure the header/chip tray and target the approved focus-box range."
);
assert.ok(
  keySource.includes("memoryTrail?.currentPromptKey")
    && keySource.includes("target?.id")
    && keySource.includes('camera ? camera.center.map((value) => value.toFixed(5)).join(",") : "fit"'),
  "Mobile Learn camera key must be prompt/target specific and include override-vs-fit identity."
);
assert.ok(
  scheduleSource.indexOf("const camera = normalizeMemoryTrailSectionQuizView(target?.learnCamera);")
    < scheduleSource.indexOf("isGenericMobileDailyTrailLearnTarget(memoryTrail, selection, target)")
    && scheduleSource.indexOf("if (camera && typeof runner?.moveCamera === \"function\")")
      < scheduleSource.indexOf("const mobileCamera = getDailyTrailMobileLearnCameraOverride(target);"),
  "Explicit target.learnCamera must remain authoritative before generic mobile Learn framing."
);
assert.ok(
  scheduleSource.includes("runner.fitTargets([target]")
    && scheduleSource.includes('cameraContext = mobileCamera?.cameraContext || "learn-target-focus"')
    && scheduleSource.includes('source = mobileCamera?.source || "daily-trail-mobile-learn-fit"')
    && scheduleSource.includes("runner.suppressStudyIntroCameraOnce?.(source, 5000)")
    && scheduleSource.includes("if (!didMove) {\n    return Promise.resolve(false);\n  }"),
  "Generic mobile Learn framing must use fitTargets, target Learn metadata, intro-camera suppression, and regional fallback on missing bounds."
);
assert.ok(
  scheduleSource.includes("memoryTrail.lastDailyTrailMobileLearnCameraKey === cameraKey")
    && scheduleSource.includes("memoryTrail.lastDailyTrailMobileLearnCameraPromptKey = promptKey")
    && scheduleSource.includes("memoryTrail.lastDailyTrailMobileLearnCameraTargetId = target.id")
    && smallSource.includes("hasAppliedDailyTrailMobileLearnCameraForPrompt(memoryTrail, selection)"),
  "Generic mobile Learn camera must be applied once per active prompt and suppress the competing small-target path."
);
assert.ok(
  source.includes('lastDailyTrailMobileLearnCameraKey: ""')
    && source.includes('lastDailyTrailMobileLearnCameraPromptKey: ""')
    && source.includes('lastDailyTrailMobileLearnCameraTargetId: ""'),
  "Memory Trail sessions must track mobile Learn camera application state."
);

console.log("Daily Trail mobile Learn camera check passed.");
