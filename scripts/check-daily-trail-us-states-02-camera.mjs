import fs from "node:fs";

const activity = JSON.parse(
  fs.readFileSync(new URL("../assets/maps/data/us-states-capitals-02.json", import.meta.url), "utf8")
);
const source = fs.readFileSync(new URL("../src/maplibre-poc.js", import.meta.url), "utf8");
const fixedCamera = activity.map?.dailyTrailFixedCamera;
const expected = {
  afterLearnTargetId: "delaware",
  center: [-79.94585, 40.53989],
  zoom: 4.7016,
  bearing: 0,
  pitch: 0
};

if (JSON.stringify(fixedCamera) !== JSON.stringify(expected)) {
  throw new Error("us-states-02 Daily Trail fixed-camera configuration does not match the approved view.");
}

const requiredHooks = [
  "dailyTrailFixedCamera: isDailyTrail ? session.currentActivity?.map?.dailyTrailFixedCamera || null : null",
  "lockDailyTrailFixedCameraAfterLearn(memoryTrail, targetId);",
  "targetId !== fixedCamera.afterLearnTargetId",
  "getActiveDailyTrailFixedCamera(memoryTrail)",
  "fitMapToPracticeWindow"
];

if (requiredHooks.some((hook) => !source.includes(hook))) {
  throw new Error("Daily Trail fixed-camera trigger or camera-lock hook is missing.");
}

console.log("Daily Trail us-states-02 camera check passed:", JSON.stringify(expected));
