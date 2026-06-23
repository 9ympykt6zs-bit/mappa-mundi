import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const activityPath = path.join(root, "assets/maps/data/world-core-europe-countries.json");
const mapSourcePath = path.join(root, "src/maplibre-poc.js");
const activity = JSON.parse(fs.readFileSync(activityPath, "utf8"));
const mapSource = fs.readFileSync(mapSourcePath, "utf8");

assert.equal(activity.id, "world-core-europe-countries");
assert.deepEqual(activity.map?.regionView, {
  center: [17.2111, 48.09795],
  zoom: 3.4354,
  bearing: 0,
  pitch: 0
});

const unitedKingdom = activity.features.find((feature) => feature.id === "united-kingdom");
assert.ok(unitedKingdom, "Core Countries: Europe must include the United Kingdom.");
assert.deepEqual(unitedKingdom.learnCamera, {
  center: [2.32064, 57.20641],
  zoom: 3.2846,
  bearing: 0,
  pitch: 0,
  cameraContext: "small-target-focus",
  source: "small-target-learn"
});

const germany = activity.features.find((feature) => feature.id === "germany");
assert.ok(germany, "Core Countries: Europe must include Germany.");
assert.deepEqual(germany.learnCamera, {
  center: [11.41659, 52.75124],
  zoom: 3.4449,
  bearing: 0,
  pitch: 0,
  cameraContext: "small-target-focus",
  source: "small-target-learn"
});

const france = activity.features.find((feature) => feature.id === "france");
assert.ok(france, "Core Countries: Europe must include France.");
assert.deepEqual(france.learnCamera, {
  center: [10.02767, 50.21096],
  zoom: 3.5253,
  bearing: 0,
  pitch: 0,
  cameraContext: "small-target-focus",
  source: "small-target-learn"
});

const italy = activity.features.find((feature) => feature.id === "italy");
assert.ok(italy, "Core Countries: Europe must include Italy.");
assert.deepEqual(italy.learnCamera, {
  center: [14.65074, 45.44307],
  zoom: 3.658,
  bearing: 0,
  pitch: 0,
  cameraContext: "small-target-focus",
  source: "small-target-learn"
});

const netherlands = activity.features.find((feature) => feature.id === "netherlands");
assert.ok(netherlands, "Core Countries: Europe must include Netherlands.");
assert.deepEqual(netherlands.learnCamera, {
  center: [4.09792, 52.75518],
  zoom: 4.2619,
  bearing: 0,
  pitch: 0,
  cameraContext: "small-target-focus",
  source: "small-target-learn"
});

const poland = activity.features.find((feature) => feature.id === "poland");
assert.ok(poland, "Core Countries: Europe must include Poland.");
assert.deepEqual(poland.learnCamera, {
  center: [20.07383, 53.56967],
  zoom: 3.5017,
  bearing: 0,
  pitch: 0,
  cameraContext: "small-target-focus",
  source: "small-target-learn"
});

const ukraine = activity.features.find((feature) => feature.id === "ukraine");
assert.ok(ukraine, "Core Countries: Europe must include Ukraine.");
assert.deepEqual(ukraine.learnCamera, {
  center: [40.78967, 51.27866],
  zoom: 3.9829,
  bearing: 0,
  pitch: 0,
  cameraContext: "small-target-focus",
  source: "small-target-learn"
});

const sweden = activity.features.find((feature) => feature.id === "sweden");
assert.ok(sweden, "Core Countries: Europe must include Sweden.");
assert.deepEqual(sweden.learnCamera, {
  center: [26.15428, 65.0201],
  zoom: 3.4161,
  bearing: 0,
  pitch: 0,
  cameraContext: "small-target-focus",
  source: "small-target-learn"
});

const russia = activity.features.find((feature) => feature.id === "russia");
assert.ok(russia, "Core Countries: Europe must include Russia.");
assert.deepEqual(russia.learnCamera, {
  center: [73.50101, 72.8856],
  zoom: 1.5323,
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
  ["united-kingdom", "france", "germany", "italy", "netherlands", "poland", "ukraine", "sweden", "russia"],
  "Only the configured Europe targets may have Core Countries: Europe Learn camera overrides."
);
assert.equal(
  activity.map?.dailyTrailNonLearnCamera,
  undefined,
  "The Europe Learn region camera must not add a post-Learn camera override."
);

for (const requiredHook of [
  "function scheduleDailyTrailTargetLearnCamera(memoryTrail, selection, target)",
  "normalizeMemoryTrailSectionQuizView(target?.learnCamera)",
  'memoryTrail?.source !== "daily-trail"',
  'selection?.promptType !== "guided"',
  'memoryTrail?.sessionPhase !== "learn"',
  'memoryTrail?.source === "daily-trail" && target?.learnCamera',
  "const dailyTrailLearnCameraPromise = scheduleDailyTrailTargetLearnCamera(memoryTrail, selection, target);",
  "regionView: { center: [28, 55], zoom: 2.0 }"
]) {
  assert.ok(mapSource.includes(requiredHook), `Missing United Kingdom Learn camera hook: ${requiredHook}`);
}

const instructionCueIndex = mapSource.indexOf(
  "const instructionSpeechPromise = updateMemoryTrailInstructionCue(memoryTrail, selection);"
);
const cameraScheduleIndex = mapSource.indexOf(
  "const dailyTrailLearnCameraPromise = scheduleDailyTrailTargetLearnCamera(memoryTrail, selection, target);"
);
const targetSpeechIndex = mapSource.indexOf(
  "speakMemoryTrailPromptTargetAfterInstruction("
);
assert.ok(instructionCueIndex >= 0 && instructionCueIndex < cameraScheduleIndex);
assert.ok(cameraScheduleIndex >= 0 && cameraScheduleIndex < targetSpeechIndex);

console.log("Daily Trail Core Countries: Europe Learn camera check passed.");
console.log(JSON.stringify({
  activityId: activity.id,
  regionView: activity.map.regionView,
  learnCameras: {
    [unitedKingdom.id]: unitedKingdom.learnCamera,
    [france.id]: france.learnCamera,
    [germany.id]: germany.learnCamera,
    [italy.id]: italy.learnCamera,
    [netherlands.id]: netherlands.learnCamera,
    [poland.id]: poland.learnCamera,
    [ukraine.id]: ukraine.learnCamera,
    [sweden.id]: sweden.learnCamera,
    [russia.id]: russia.learnCamera
  }
}));
