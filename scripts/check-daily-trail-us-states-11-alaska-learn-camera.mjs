import fs from "node:fs";

const activity = JSON.parse(
  fs.readFileSync(new URL("../assets/maps/data/us-states-capitals-11.json", import.meta.url), "utf8")
);
const source = fs.readFileSync(new URL("../src/maplibre-poc.js", import.meta.url), "utf8");
const alaska = activity.features?.find((feature) => feature.id === "alaska");
const hawaii = activity.features?.find((feature) => feature.id === "hawaii");
const learnCameraTargetIds = (activity.features || [])
  .filter((feature) => feature.learnCamera)
  .map((feature) => feature.id);
const expectedLearnCamera = {
  center: [-149.27965, 63.16614],
  zoom: 3.4310,
  bearing: 0,
  pitch: 0,
  cameraContext: "section-overview",
  source: "enterStudyView:regionView"
};
const expectedHawaiiLearnCamera = {
  center: [-152.68874, 21.84516],
  zoom: 5.2281,
  bearing: 0,
  pitch: 0,
  cameraContext: "section-overview",
  source: "enterStudyView:regionView"
};
const expectedNonLearnCamera = {
  center: [-129.20682, 49.23213],
  zoom: 2.8050,
  bearing: 0,
  pitch: 0
};

if (JSON.stringify(alaska?.learnCamera) !== JSON.stringify(expectedLearnCamera)) {
  throw new Error("Alaska Learn camera does not match the approved view.");
}

if (JSON.stringify(hawaii?.learnCamera) !== JSON.stringify(expectedHawaiiLearnCamera)) {
  throw new Error("Hawaii Learn camera does not match the approved view.");
}

if (JSON.stringify(learnCameraTargetIds) !== JSON.stringify(["alaska", "hawaii"])) {
  throw new Error("Only Alaska and Hawaii may have us-states-11 Learn cameras.");
}

if (JSON.stringify(activity.map?.dailyTrailNonLearnCamera) !== JSON.stringify(expectedNonLearnCamera)) {
  throw new Error("us-states-11 post-Learn regional camera changed unexpectedly.");
}

const requiredHooks = [
  "scheduleDailyTrailTargetLearnCamera(memoryTrail, selection, target);",
  "function scheduleDailyTrailTargetLearnCamera(memoryTrail, selection, target)",
  'memoryTrail?.source !== "daily-trail"',
  'selection?.promptType !== "guided"',
  'memoryTrail?.sessionPhase !== "learn"',
  "normalizeMemoryTrailSectionQuizView(target?.learnCamera)"
];

if (requiredHooks.some((hook) => !source.includes(hook))) {
  throw new Error("Daily Trail Learn target-camera hook is missing.");
}

console.log("Daily Trail Alaska and Hawaii Learn camera check passed:", JSON.stringify({
  alaskaLearnCamera: expectedLearnCamera,
  hawaiiLearnCamera: expectedHawaiiLearnCamera,
  nonLearnCamera: expectedNonLearnCamera
}));
