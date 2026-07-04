import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/maplibre-poc.js", import.meta.url), "utf8");

const requiredHooks = [
  "function getNextDailyTrailDevSection()",
  "async function skipDailyTrailSectionForDev()",
  'currentAppScreen === "daily-trail-gameplay"',
  "return skipDailyTrailSectionForDev();",
  "clearDailyTrailSectionSkipRuntimeStateForDev(memoryTrail);",
  "dailyTrailDevReplayCursor = {",
  "exitDailyTrailGameplay({ preserveDevReplay: true });",
  "await startDailyTrailDevReplayCursor();",
  "completeDailyTrailDevReplaySession(memoryTrail);"
];

const missingHooks = requiredHooks.filter((hook) => !source.includes(hook));
if (missingHooks.length > 0) {
  throw new Error(`Camera Dev Daily Trail Next Section is missing required hooks: ${missingHooks.join(", ")}`);
}

const skipFunctionStart = source.indexOf("function skipMemoryTrailSectionForDev()");
const dailyTrailBranch = source.indexOf("return skipDailyTrailSectionForDev();", skipFunctionStart);
const memoryTrailCompletionFallback = source.indexOf("completeMemoryTrailSectionForDev(memoryTrail);", skipFunctionStart);

if (skipFunctionStart < 0 || dailyTrailBranch < 0 || memoryTrailCompletionFallback < 0) {
  throw new Error("Camera Dev section skip function could not be inspected.");
}

if (dailyTrailBranch > memoryTrailCompletionFallback) {
  throw new Error("Daily Trail section skip must bypass Memory Trail completion before the fallback path.");
}

const dailyTrailSkipStart = source.indexOf("async function skipDailyTrailSectionForDev()");
const dailyTrailSkipEnd = source.indexOf("async function backOneDailyTrailSectionForDev()", dailyTrailSkipStart);
const dailyTrailSkipBody = source.slice(dailyTrailSkipStart, dailyTrailSkipEnd);

if (dailyTrailSkipBody.includes("completeMemoryTrailSectionForDev(")) {
  throw new Error("Daily Trail dev section skip must not enter the Memory Trail completion panel.");
}

if (dailyTrailSkipBody.includes("finalizeDailyTrailMemoryTrailSession(")
  || dailyTrailSkipBody.includes("applyDailyTrailSessionResults(")) {
  throw new Error("Daily Trail dev section skip must not apply real Daily Trail scoring or progress.");
}

console.log("Camera Dev Daily Trail Next Section check passed.");
