import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const activityPath = path.join(root, "assets/maps/data/world-core-europe-countries.json");
const mapSourcePath = path.join(root, "src/maplibre-poc.js");
const activity = JSON.parse(fs.readFileSync(activityPath, "utf8"));
const mapSource = fs.readFileSync(mapSourcePath, "utf8");
const expectedTargetIds = [
  "germany",
  "united-kingdom",
  "france",
  "spain",
  "italy",
  "portugal",
  "netherlands",
  "poland",
  "ireland",
  "ukraine"
];

assert.equal(activity.id, "world-core-europe-countries");
assert.deepEqual(activity.map?.dailyTrailQuizCamera, {
  targetIds: expectedTargetIds,
  center: [22.65378, 50.41408],
  zoom: 3.3006,
  bearing: 0,
  pitch: 0,
  cameraContext: "small-target-focus",
  source: "small-target-learn"
});
assert.equal(activity.map?.dailyTrailNonLearnCamera, undefined);
const availableTargetIds = activity.features.map((feature) => feature.id);
const unavailableTargetIds = expectedTargetIds.filter((targetId) => !availableTargetIds.includes(targetId));
assert.deepEqual(unavailableTargetIds, ["portugal", "ireland"]);
assert.deepEqual(
  expectedTargetIds.filter((targetId) => availableTargetIds.includes(targetId)),
  ["germany", "united-kingdom", "france", "spain", "italy", "netherlands", "poland", "ukraine"]
);
assert.equal(activity.features.some((feature) => feature.quizCamera), false);

for (const requiredHook of [
  "function normalizeDailyTrailTargetQuizCamera(config = null)",
  "function getActiveDailyTrailTargetQuizCamera(memoryTrail, selection = {})",
  'memoryTrail?.source === "daily-trail"',
  'memoryTrail?.sessionPhase === "practice"',
  'selection?.promptType === "name_to_place"',
  "quizCamera?.targetIds?.includes(targetId)",
  "function applyDailyTrailTargetQuizCamera(memoryTrail, selection = {}, options = {})",
  "applyDailyTrailTargetQuizCamera(memoryTrail, selection);"
]) {
  assert.ok(mapSource.includes(requiredHook), `Missing Europe quiz camera hook: ${requiredHook}`);
}

const sessionPhaseIndex = mapSource.indexOf('memoryTrail.sessionPhase = selection.promptType === "guided" ? "learn" : "practice";');
const quizCameraIndex = mapSource.indexOf("applyDailyTrailTargetQuizCamera(memoryTrail, selection);");
const learnCameraIndex = mapSource.indexOf("scheduleDailyTrailTargetLearnCamera(memoryTrail, selection, target);");
assert.ok(sessionPhaseIndex >= 0 && sessionPhaseIndex < quizCameraIndex);
assert.ok(quizCameraIndex >= 0 && quizCameraIndex < learnCameraIndex);

const instructionCueIndex = mapSource.indexOf(
  "const instructionSpeechPromise = updateMemoryTrailInstructionCue(memoryTrail, selection);"
);
const targetSpeechIndex = mapSource.indexOf(
  "if (shouldSpeakMemoryTrailTargetAtPromptStart(memoryTrail, target, selection))"
);
assert.ok(instructionCueIndex >= 0 && instructionCueIndex < quizCameraIndex);
assert.ok(quizCameraIndex >= 0 && quizCameraIndex < targetSpeechIndex);

console.log("Daily Trail Core Countries: Europe quiz camera check passed.");
console.log(JSON.stringify({
  activityId: activity.id,
  quizCamera: activity.map.dailyTrailQuizCamera,
  availableTargetIds: expectedTargetIds.filter((targetId) => availableTargetIds.includes(targetId)),
  unavailableTargetIds
}));
