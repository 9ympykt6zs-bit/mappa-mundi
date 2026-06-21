import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/maplibre-poc.js", import.meta.url), "utf8");
const requiredHooks = [
  'createCameraDevButton("Back One Section", () => backOneSectionForDev())',
  "function getPreviousMemoryTrailSection",
  "function getPreviousDailyTrailDevSection",
  "async function backOneDailyTrailSectionForDev()",
  "async function backOneMemoryTrailSectionForDev()",
  "exitDailyTrailGameplay();",
  "await startDailyTrailSession();",
  "cameraDevMemoryTrailBackSectionButton.disabled = !previousSection;"
];

if (requiredHooks.some((hook) => !source.includes(hook))) {
  throw new Error("Camera Dev Back One Section control is missing a required dev-only safety hook.");
}

console.log("Camera Dev Back One Section check passed.");
