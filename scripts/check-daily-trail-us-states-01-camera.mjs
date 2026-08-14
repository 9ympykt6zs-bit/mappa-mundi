import fs from "node:fs";

const activity = JSON.parse(
  fs.readFileSync(new URL("../assets/maps/data/us-states-capitals-01.json", import.meta.url), "utf8")
);
const source = fs.readFileSync(new URL("../src/maplibre-poc.js", import.meta.url), "utf8");
const fixedCamera = activity.map?.dailyTrailFixedCamera;
const expected = {
  afterLearnTargetId: "connecticut",
  center: [-70.34115, 44.17516],
  zoom: 5.1328,
  bearing: 0,
  pitch: 0
};

if (JSON.stringify(fixedCamera) !== JSON.stringify(expected)) {
  throw new Error("us-states-01 Daily Trail fixed-camera configuration does not match the approved view.");
}

const requiredHooks = [
  "dailyTrailFixedCamera: (isDailyTrail || isUnitedStatesTrail) ? session.currentActivity?.map?.dailyTrailFixedCamera || null : null",
  "lockDailyTrailFixedCameraAfterLearn(memoryTrail, targetId);",
  "targetId !== fixedCamera.afterLearnTargetId",
  "getActiveDailyTrailFixedCamera(memoryTrail)",
  "fitMapToPracticeWindow"
];

if (requiredHooks.some((hook) => !source.includes(hook))) {
  throw new Error("Daily Trail fixed-camera trigger or camera-lock hook is missing.");
}

console.log("Daily Trail us-states-01 camera check passed:", JSON.stringify(expected));
