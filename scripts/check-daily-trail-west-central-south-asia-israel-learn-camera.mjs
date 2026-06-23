import assert from "node:assert/strict";
import fs from "node:fs";

const activity = JSON.parse(fs.readFileSync(
  new URL("../assets/maps/data/world-core-west-central-south-asia-countries.json", import.meta.url),
  "utf8"
));
const runtimeSource = fs.readFileSync(
  new URL("../src/maplibre-poc.js", import.meta.url),
  "utf8"
);
const expectedIsraelCamera = {
  center: [35.34258, 30.50501],
  zoom: 4.7508,
  bearing: 0,
  pitch: 0,
  cameraContext: "small-target-focus",
  source: "small-target-learn"
};
const expectedSaudiArabiaCamera = {
  center: [44.58633, 23.57349],
  zoom: 3.9315,
  bearing: 0,
  pitch: 0,
  cameraContext: "small-target-focus",
  source: "small-target-learn"
};
const expectedIranCamera = {
  center: [47.23440, 33.66587],
  zoom: 3.9438,
  bearing: 0,
  pitch: 0,
  cameraContext: "small-target-focus",
  source: "small-target-learn"
};
const expectedIraqCamera = {
  center: [47.02940, 34.15605],
  zoom: 3.7346,
  bearing: 0,
  pitch: 0,
  cameraContext: "section-overview",
  source: "enterStudyView:regionView"
};
const expectedPakistanCamera = {
  center: [69.56245, 29.78506],
  zoom: 3.8033,
  bearing: 0,
  pitch: 0,
  cameraContext: "section-overview",
  source: "enterStudyView:regionView"
};
const expectedIndiaCamera = {
  center: [79.78024, 22.18743],
  zoom: 3.4709,
  bearing: 0,
  pitch: 0,
  cameraContext: "advance",
  source: "fitMapToPracticeWindow"
};
const expectedKazakhstanCamera = {
  center: [67.50794, 48.66828],
  zoom: 3.4092,
  bearing: 0,
  pitch: 0,
  cameraContext: "section-overview",
  source: "enterStudyView:regionView"
};
const expectedNonLearnCamera = {
  center: [69.63166, 33.59030],
  zoom: 3.1385,
  bearing: 0,
  pitch: 0
};

assert.equal(activity.id, "world-core-west-central-south-asia-countries");
assert.equal(activity.map?.region, "world-core-west-central-south-asia");
assert.deepEqual(activity.map?.dailyTrailNonLearnCamera, expectedNonLearnCamera);
assert.deepEqual(activity.features.find((target) => target.id === "israel")?.learnCamera, expectedIsraelCamera);
assert.deepEqual(activity.features.find((target) => target.id === "saudi-arabia")?.learnCamera, expectedSaudiArabiaCamera);
assert.deepEqual(activity.features.find((target) => target.id === "iran")?.learnCamera, expectedIranCamera);
assert.deepEqual(activity.features.find((target) => target.id === "iraq")?.learnCamera, expectedIraqCamera);
assert.deepEqual(activity.features.find((target) => target.id === "pakistan")?.learnCamera, expectedPakistanCamera);
assert.deepEqual(activity.features.find((target) => target.id === "india")?.learnCamera, expectedIndiaCamera);
assert.deepEqual(activity.features.find((target) => target.id === "kazakhstan")?.learnCamera, expectedKazakhstanCamera);
assert.deepEqual(
  activity.features.filter((target) => target.learnCamera).map((target) => target.id),
  ["saudi-arabia", "iran", "israel", "iraq", "kazakhstan", "india", "pakistan"],
  "Only Saudi Arabia, Iran, Israel, Iraq, Kazakhstan, India, and Pakistan may have West, Central, and South Asia target Learn cameras."
);
assert.ok(runtimeSource.includes("assets/maps/data/world-core-west-central-south-asia-countries.json?v=20260623-west-central-south-asia-regional-camera-8"));
assert.ok(runtimeSource.includes("const camera = normalizeMemoryTrailSectionQuizView(target?.learnCamera);"));
assert.ok(runtimeSource.includes("source: target.learnCamera?.source || \"daily-trail-target-learn-camera\","));

console.log("Daily Trail West/Central/South Asia Learn camera check passed:", JSON.stringify({
  israel: expectedIsraelCamera,
  saudiArabia: expectedSaudiArabiaCamera,
  iran: expectedIranCamera,
  iraq: expectedIraqCamera,
  pakistan: expectedPakistanCamera,
  india: expectedIndiaCamera,
  kazakhstan: expectedKazakhstanCamera,
  nonLearnCamera: expectedNonLearnCamera
}));
