import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const activityPath = path.join(root, "assets/maps/data/world-core-americas-countries.json");
const mapSourcePath = path.join(root, "src/maplibre-poc.js");
const activity = JSON.parse(fs.readFileSync(activityPath, "utf8"));
const mapSource = fs.readFileSync(mapSourcePath, "utf8");

assert.equal(activity.id, "world-core-americas-countries");

const canada = activity.features.find((feature) => feature.id === "canada");
assert.ok(canada, "Core Countries: Americas must include Canada.");
assert.deepEqual(canada.learnCamera, {
  center: [-101.59836, 63.9185],
  zoom: 2.0337,
  bearing: 0,
  pitch: 0,
  cameraContext: "start",
  source: "fitMapToPracticeWindow"
});

const mexico = activity.features.find((feature) => feature.id === "mexico");
assert.ok(mexico, "Core Countries: Americas must include Mexico.");
assert.deepEqual(mexico.learnCamera, {
  center: [-100.05423, 27.07559],
  zoom: 3.0518,
  bearing: 0,
  pitch: 0,
  cameraContext: "start",
  source: "fitMapToPracticeWindow"
});

const brazil = activity.features.find((feature) => feature.id === "brazil");
assert.ok(brazil, "Core Countries: Americas must include Brazil.");
assert.deepEqual(brazil.learnCamera, {
  center: [-58.61232, -11.27759],
  zoom: 3.1911,
  bearing: 0,
  pitch: 0,
  cameraContext: "start",
  source: "fitMapToPracticeWindow"
});

const argentina = activity.features.find((feature) => feature.id === "argentina");
assert.ok(argentina, "Core Countries: Americas must include Argentina.");
assert.deepEqual(argentina.learnCamera, {
  center: [-61.91061, -32.79463],
  zoom: 2.9688,
  bearing: 0,
  pitch: 0,
  cameraContext: "start",
  source: "fitMapToPracticeWindow"
});

const chile = activity.features.find((feature) => feature.id === "chile");
assert.ok(chile, "Core Countries: Americas must include Chile.");
assert.deepEqual(chile.learnCamera, {
  center: [-71.07627, -30.5668],
  zoom: 2.979,
  bearing: 0,
  pitch: 0,
  cameraContext: "section-overview",
  source: "enterStudyView:regionView"
});

const peru = activity.features.find((feature) => feature.id === "peru");
assert.ok(peru, "Core Countries: Americas must include Peru.");
assert.deepEqual(peru.learnCamera, {
  center: [-73.06145, -8.63605],
  zoom: 3.4812,
  bearing: 0,
  pitch: 0,
  cameraContext: "section-overview",
  source: "enterStudyView:regionView"
});

const colombia = activity.features.find((feature) => feature.id === "colombia");
assert.ok(colombia, "Core Countries: Americas must include Colombia.");
assert.deepEqual(colombia.learnCamera, {
  center: [-72.69149, 2.31984],
  zoom: 3.4965,
  bearing: 0,
  pitch: 0,
  cameraContext: "section-overview",
  source: "enterStudyView:regionView"
});

const panama = activity.features.find((feature) => feature.id === "panama");
assert.ok(panama, "Core Countries: Americas must include Panama.");
assert.deepEqual(panama.learnCamera, {
  center: [-79.02618, 9.54465],
  zoom: 4.2317,
  bearing: 0,
  pitch: 0,
  cameraContext: "small-target-focus",
  source: "small-target-learn"
});

const learnCameraTargetIds = activity.features
  .filter((feature) => feature.learnCamera)
  .map((feature) => feature.id);
assert.deepEqual(
  learnCameraTargetIds,
  ["canada", "mexico", "brazil", "argentina", "chile", "colombia", "peru", "panama"],
  "Only Canada, Mexico, Brazil, Argentina, Chile, Colombia, Peru, and Panama may have Core Countries: Americas Learn camera overrides."
);
assert.deepEqual(activity.map?.dailyTrailNonLearnCamera, {
  center: [-75.74954, -1.75374],
  zoom: 2.4615,
  bearing: 0,
  pitch: 0
});

for (const requiredHook of [
  "function scheduleDailyTrailTargetLearnCamera(memoryTrail, selection, target)",
  "normalizeMemoryTrailSectionQuizView(target?.learnCamera)",
  'memoryTrail?.source !== "daily-trail"',
  'selection?.promptType !== "guided"',
  'memoryTrail?.sessionPhase !== "learn"',
  "scheduleDailyTrailTargetLearnCamera(memoryTrail, selection, target);",
  "function getActiveDailyTrailNonLearnCamera(memoryTrail)",
  "getActiveDailyTrailNonLearnCamera(memoryTrail)",
  "function scheduleSmallTargetLearnFocusCheck(memoryTrail, selection, target)",
  '(memoryTrail?.source === "daily-trail" && target?.learnCamera)',
  "fitMapToPracticeWindow",
  "if (getActiveDailyTrailFixedCamera(memoryTrail) || getActiveDailyTrailNonLearnCamera(memoryTrail))",
  "return applyMemoryTrailSectionQuizCamera(memoryTrail, { promptType: \"fixed-camera\" }, { duration: 260 });"
]) {
  assert.ok(mapSource.includes(requiredHook), `Missing Learn-only camera scheduler hook: ${requiredHook}`);
}

const instructionCueIndex = mapSource.indexOf(
  "const instructionSpeechPromise = updateMemoryTrailInstructionCue(memoryTrail, selection);"
);
const cameraScheduleIndex = mapSource.indexOf(
  "scheduleDailyTrailTargetLearnCamera(memoryTrail, selection, target);"
);
const targetSpeechIndex = mapSource.indexOf(
  "speakMemoryTrailPromptTargetAfterInstruction(memoryTrail, target, selection, instructionSpeechPromise);"
);
assert.ok(instructionCueIndex >= 0 && instructionCueIndex < cameraScheduleIndex);
assert.ok(cameraScheduleIndex >= 0 && cameraScheduleIndex < targetSpeechIndex);

console.log("Daily Trail Core Countries: Americas Learn camera check passed.");
console.log(JSON.stringify({
  activityId: activity.id,
  learnCameras: {
    [canada.id]: canada.learnCamera,
    [mexico.id]: mexico.learnCamera,
    [brazil.id]: brazil.learnCamera,
    [argentina.id]: argentina.learnCamera,
    [chile.id]: chile.learnCamera,
    [colombia.id]: colombia.learnCamera,
    [peru.id]: peru.learnCamera,
    [panama.id]: panama.learnCamera
  },
  nonLearnCamera: activity.map.dailyTrailNonLearnCamera
}));
