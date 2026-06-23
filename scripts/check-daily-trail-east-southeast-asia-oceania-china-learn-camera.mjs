import assert from "node:assert/strict";
import fs from "node:fs";

const activity = JSON.parse(fs.readFileSync(
  new URL("../assets/maps/data/world-core-east-southeast-asia-oceania-countries.json", import.meta.url),
  "utf8"
));
const runtimeSource = fs.readFileSync(
  new URL("../src/maplibre-poc.js", import.meta.url),
  "utf8"
);
const expectedChinaCamera = {
  center: [105.46946, 31.57908],
  zoom: 3.0061,
  bearing: 0,
  pitch: 0,
  cameraContext: "start",
  source: "fitMapToPracticeWindow"
};
const expectedJapanCamera = {
  center: [135.22357, 38.23612],
  zoom: 3.2159,
  bearing: 0,
  pitch: 0,
  cameraContext: "small-target-focus",
  source: "small-target-learn"
};
const expectedIndonesiaCamera = {
  center: [124.46301, -2.27222],
  zoom: 3.2603,
  bearing: 0,
  pitch: 0,
  cameraContext: "small-target-focus",
  source: "small-target-learn"
};
const expectedNonLearnCamera = {
  center: [131.48844, -8.01292],
  zoom: 2.6416,
  bearing: 0,
  pitch: 0
};
const expectedAustraliaCamera = {
  center: [138.80192, -21.94616],
  zoom: 2.8501,
  bearing: 0,
  pitch: 0,
  cameraContext: "section-quiz-view",
  source: "memory-trail-section-quiz-camera"
};
const expectedVietnamCamera = {
  center: [110.11430, 17.87085],
  zoom: 3.5272,
  bearing: 0,
  pitch: 0,
  cameraContext: "small-target-focus",
  source: "small-target-learn"
};
const expectedNewZealandCamera = {
  center: [165.39661, -40.30704],
  zoom: 2.5676,
  bearing: 0,
  pitch: 0,
  cameraContext: "section-quiz-view",
  source: "memory-trail-section-quiz-camera"
};

assert.equal(activity.id, "world-core-east-southeast-asia-oceania-countries");
assert.equal(activity.map?.region, "world-core-east-southeast-asia-oceania");
assert.deepEqual(activity.map?.dailyTrailNonLearnCamera, expectedNonLearnCamera);
assert.equal(activity.map?.dailyTrailQuizCamera, undefined, "No Philippines/Australia/New Zealand-only quiz camera may remain.");
assert.deepEqual(activity.features.find((target) => target.id === "china")?.learnCamera, expectedChinaCamera);
assert.deepEqual(activity.features.find((target) => target.id === "japan")?.learnCamera, expectedJapanCamera);
assert.deepEqual(activity.features.find((target) => target.id === "indonesia")?.learnCamera, expectedIndonesiaCamera);
assert.deepEqual(activity.features.find((target) => target.id === "australia")?.learnCamera, expectedAustraliaCamera);
assert.deepEqual(activity.features.find((target) => target.id === "vietnam")?.learnCamera, expectedVietnamCamera);
assert.deepEqual(activity.features.find((target) => target.id === "new-zealand")?.learnCamera, expectedNewZealandCamera);
assert.deepEqual(
  activity.features.filter((target) => target.learnCamera).map((target) => target.id),
  ["china", "japan", "indonesia", "vietnam", "australia", "new-zealand"],
  "Only China, Japan, Indonesia, Vietnam, Australia, and New Zealand may have East/Southeast Asia/Oceania target Learn cameras."
);
assert.ok(runtimeSource.includes("assets/maps/data/world-core-east-southeast-asia-oceania-countries.json?v=20260623-east-southeast-asia-oceania-regional-camera-9"));
assert.ok(runtimeSource.includes("const camera = normalizeMemoryTrailSectionQuizView(target?.learnCamera);"));
assert.ok(runtimeSource.includes("source: target.learnCamera?.source || \"daily-trail-target-learn-camera\","));
assert.ok(runtimeSource.includes("function getActiveDailyTrailTargetQuizCamera(memoryTrail, selection = {})"));

console.log("Daily Trail East/Southeast Asia/Oceania Learn camera check passed:", JSON.stringify({
  china: expectedChinaCamera,
  japan: expectedJapanCamera,
  indonesia: expectedIndonesiaCamera,
  australia: expectedAustraliaCamera,
  vietnam: expectedVietnamCamera,
  newZealand: expectedNewZealandCamera,
  nonLearnCamera: expectedNonLearnCamera
}));
