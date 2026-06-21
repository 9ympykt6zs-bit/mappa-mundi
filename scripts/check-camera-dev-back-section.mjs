import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/maplibre-poc.js", import.meta.url), "utf8");
const requiredHooks = [
  'createCameraDevButton("Back One Section", () => backOneSectionForDev())',
  "function getPreviousMemoryTrailSection",
  "function getPreviousDailyTrailDevSection",
  "async function backOneDailyTrailSectionForDev()",
  "let dailyTrailDevReplayCursor = null;",
  "async function startDailyTrailDevReplayCursor()",
  "completeDailyTrailDevReplaySession(memoryTrail);",
  "dailyTrailDevReplayCursor.stepIndex += 1;",
  "clearDailyTrailDevReplayCursor();",
  "const startedState = isDevReplayStart ? state : applyDailyTrailSessionStart(state, plan);",
  "const forceDevReplayLearn = activeDailyTrailSession.devReplay === true;",
  "const newTargetIds = forceDevReplayLearn",
  "? targetIds",
  "async function backOneMemoryTrailSectionForDev()",
  "exitDailyTrailGameplay({ preserveDevReplay: true });",
  "await startDailyTrailDevReplayCursor();",
  "cameraDevMemoryTrailBackSectionButton.disabled = !previousSection;"
];

if (requiredHooks.some((hook) => !source.includes(hook))) {
  throw new Error("Camera Dev Back One Section control is missing a required dev-only safety hook.");
}

console.log("Camera Dev Back One Section check passed.");
