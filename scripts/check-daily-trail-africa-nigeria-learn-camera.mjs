import assert from "node:assert/strict";
import fs from "node:fs";

const activity = JSON.parse(fs.readFileSync(
  new URL("../assets/maps/data/world-core-africa-countries.json", import.meta.url),
  "utf8"
));
const runtimeSource = fs.readFileSync(
  new URL("../src/maplibre-poc.js", import.meta.url),
  "utf8"
);
const expectedLearnCameras = {
  algeria: {
    center: [6.75329, 26.38119],
    zoom: 3.2832,
    bearing: 0,
    pitch: 0,
    cameraContext: "section-overview",
    source: "enterStudyView:regionView"
  },
  egypt: {
    center: [31.83280, 31.95761],
    zoom: 3.3079,
    bearing: 0,
    pitch: 0,
    cameraContext: "small-target-focus",
    source: "small-target-learn"
  },
  ethiopia: {
    center: [36.04799, 8.84654],
    zoom: 3.4246,
    bearing: 0,
    pitch: 0,
    cameraContext: "section-overview",
    source: "enterStudyView:regionView"
  },
  nigeria: {
    center: [12.26605, 13.39308],
    zoom: 3.3714,
    bearing: 0,
    pitch: 0,
    cameraContext: "small-target-focus",
    source: "small-target-learn"
  },
  "south-africa": {
    center: [19.86861, -15.38212],
    zoom: 3.4101,
    bearing: 0,
    pitch: 0,
    cameraContext: "small-target-focus",
    source: "small-target-learn"
  }
};
const expectedNonLearnCamera = {
  center: [17.53087, 0.44607],
  zoom: 3.0084,
  bearing: 0,
  pitch: 0
};

assert.equal(activity.id, "world-core-africa-countries");
assert.deepEqual(activity.map?.dailyTrailNonLearnCamera, expectedNonLearnCamera);
assert.deepEqual(
  Object.fromEntries(activity.features
    .filter((target) => target.learnCamera)
    .map((target) => [target.id, target.learnCamera])),
  expectedLearnCameras,
  "Only Algeria, Egypt, Ethiopia, Nigeria, and South Africa may have target-specific Africa Learn cameras."
);
assert.ok(runtimeSource.includes("assets/maps/data/world-core-africa-countries.json?v=20260622-africa-algeria-learn-camera-6"));
assert.ok(runtimeSource.includes("const camera = normalizeMemoryTrailSectionQuizView(target?.learnCamera);"));
assert.ok(runtimeSource.includes("source: target.learnCamera?.source || \"daily-trail-target-learn-camera\","));
assert.ok(runtimeSource.includes("dailyTrailNonLearnCamera: isDailyTrail ? session.currentActivity?.map?.dailyTrailNonLearnCamera || null : null,"));

console.log("Daily Trail Africa camera check passed:", JSON.stringify({
  learnCameras: expectedLearnCameras,
  nonLearnCamera: expectedNonLearnCamera
}));
