import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync("src/maplibre-poc.js", "utf8");
const index = fs.readFileSync("index.html", "utf8");

[
  "UNITED_STATES_MEMORY_TRAIL_SOURCE",
  "source: UNITED_STATES_MEMORY_TRAIL_SOURCE",
  "currentAppScreen === \"united-states-trail-gameplay\"",
  "function startUnitedStatesMemoryTrailSession()",
  "function resumeUnitedStatesMemoryTrailSession(",
  "function completeUnitedStatesMemoryTrailSession(",
  "function renderUnitedStatesMemoryTrailSummary()",
  "function restoreUnitedStatesMemoryTrailGameplayFromSettings()",
  "function resetUnitedStatesMemoryTrailProgress()",
  "function createSettingsMemoryTrailExitControl()",
  "Exit United States Memory Trail",
  "function isActiveAdaptiveTrailMapResponseScreen(memoryTrail = getActiveMemoryTrail())",
  "isActiveAdaptiveTrailMapResponseScreen(activeMemoryTrail)",
  "handleMemoryTrailTargetTap(resolvedMemoryTrailTargetIds, memoryTrailMapPoint);",
  "adaptiveTrailTargetIds",
  "sourceActivityId: item.sourceActivityId || item.homeActivityId",
  "relatedStateTargetId: item.relatedStateTargetId || \"\"",
  "const itemActivity = getActivityById(item.sourceActivityId || item.homeActivityId);",
  "isAdaptiveTrailMemoryTrail(memoryTrail)",
  "shouldSuppressDailyTrailStudyTargetEmphasis(memoryTrail, selection)",
  "function getUnitedStatesMemoryTrailInstructionNounForTarget(target)",
  "function getUnitedStatesMemoryTrailAnswerChoiceCategory(memoryTrail, target)"
].forEach((needle) => {
  assert.ok(source.includes(needle), `Missing runtime integration: ${needle}`);
});

const targetClickStart = source.indexOf("function handleTargetClick(targetIds)");
const targetClickEnd = source.indexOf("function tryShowFreePlaySelectedMapFeature", targetClickStart);
const targetClickSource = source.slice(targetClickStart, targetClickEnd);

assert.ok(
  targetClickSource.includes("isActiveAdaptiveTrailMapResponseScreen(activeMemoryTrail)"),
  "Adaptive trail map responses should share the Memory Trail target-tap path."
);
assert.ok(
  !targetClickSource.includes("currentAppScreen === \"daily-trail-gameplay\" && isMemoryTrailActive()"),
  "Map response handling must not be gated to Daily Trail only."
);

const panelStart = source.indexOf("function renderMemoryTrailPanel()");
const panelEnd = source.indexOf("function ensureActiveTrayContentVisible", panelStart);
const panelSource = source.slice(panelStart, panelEnd);

assert.ok(
  panelSource.includes("const usesCompactAdaptivePrompt = isAdaptiveTrailMemoryTrail(memoryTrail);"),
  "Adaptive trails should use the compact active prompt renderer."
);
assert.ok(
  panelSource.includes("if (usesCompactAdaptivePrompt && memoryTrail.phase !== \"complete\")"),
  "Compact renderer should cover active U.S. Trail prompts."
);
assert.ok(
  panelSource.includes("if (!usesCompactAdaptivePrompt || memoryTrail.phase === \"complete\")"),
  "Active adaptive prompts should not show session stats in the tray."
);

assert.ok(index.includes("main-menu-us-memory-trail-button"), "Main menu card should exist.");
assert.ok(index.includes("United States Memory Trail"), "Main menu card should use the approved title.");
assert.ok(
  /pendingUnitedStatesMemoryTrailGameplaySettingsReturn/.test(source)
    && /restoreUnitedStatesMemoryTrailGameplayFromSettings/.test(source),
  "Settings should have a distinct U.S. Trail return path."
);
assert.ok(
  /resetUnitedStatesMemoryTrailPersistedProgress/.test(source)
    && /mappaDailyTrailProgress/.test(source) === false || /resetDailyTrailProgress/.test(source),
  "U.S. reset should be isolated from Daily Trail reset."
);

console.log("United States Memory Trail runtime integration validation passed.");
