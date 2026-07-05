import fs from "node:fs";

const activity = JSON.parse(
  fs.readFileSync(new URL("../assets/maps/data/us-states-capitals-02.json", import.meta.url), "utf8")
);
const source = fs.readFileSync(new URL("../src/maplibre-poc.js", import.meta.url), "utf8");
const fixedCamera = activity.map?.dailyTrailFixedCamera;
const mobileSectionQuizCamera = activity.map?.dailyTrailMobileSectionQuizCamera;
const expected = {
  afterLearnTargetId: "delaware",
  center: [-79.94585, 40.53989],
  zoom: 4.7016,
  bearing: 0,
  pitch: 0
};
const expectedMobileSectionQuizCamera = {
  center: [-75.50126, 40.65817],
  zoom: 4.6148,
  bearing: 0,
  pitch: 0,
  cameraContext: "section-quiz-view",
  source: "memory-trail-section-quiz-camera"
};

if (JSON.stringify(fixedCamera) !== JSON.stringify(expected)) {
  throw new Error("us-states-02 Daily Trail fixed-camera configuration does not match the approved view.");
}

if (JSON.stringify(mobileSectionQuizCamera) !== JSON.stringify(expectedMobileSectionQuizCamera)) {
  throw new Error("us-states-02 mobile section-quiz camera configuration does not match the approved view.");
}

const requiredHooks = [
  "dailyTrailFixedCamera: isDailyTrail ? session.currentActivity?.map?.dailyTrailFixedCamera || null : null",
  "dailyTrailMobileSectionQuizCamera: isDailyTrail ? session.currentActivity?.map?.dailyTrailMobileSectionQuizCamera || null : null",
  "function getActiveDailyTrailMobileSectionQuizCamera(memoryTrail)",
  "lockDailyTrailFixedCameraAfterLearn(memoryTrail, targetId);",
  "targetId !== fixedCamera.afterLearnTargetId",
  "getActiveDailyTrailFixedCamera(memoryTrail)",
  "fitMapToPracticeWindow"
];

if (requiredHooks.some((hook) => !source.includes(hook))) {
  throw new Error("Daily Trail fixed-camera trigger or camera-lock hook is missing.");
}

console.log("Daily Trail us-states-02 camera check passed:", JSON.stringify({
  fixedCamera: expected,
  mobileSectionQuizCamera: expectedMobileSectionQuizCamera
}));
