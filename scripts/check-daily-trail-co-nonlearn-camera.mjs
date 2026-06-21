import fs from "node:fs";

const activity = JSON.parse(
  fs.readFileSync(new URL("../assets/maps/data/continents-oceans.json", import.meta.url), "utf8")
);
const source = fs.readFileSync(new URL("../src/maplibre-poc.js", import.meta.url), "utf8");
const expectedCamera = {
  center: [-63.73809, 31.59428],
  zoom: 2.2054,
  bearing: 0,
  pitch: 0
};

if (JSON.stringify(activity.map?.dailyTrailNonLearnCamera) !== JSON.stringify(expectedCamera)) {
  throw new Error("C&O Daily Trail non-Learn camera does not match the approved view.");
}

const requiredHooks = [
  "dailyTrailNonLearnCamera: isDailyTrail ? session.currentActivity?.map?.dailyTrailNonLearnCamera || null : null",
  "function getActiveDailyTrailNonLearnCamera(memoryTrail)",
  'memoryTrail?.activityId === continentsOceansActivityId',
  'memoryTrail?.sessionPhase !== "learn"',
  "const quizView = dailyTrailFixedCamera || memoryTrail?.sectionQuizView;",
  "(quizView.duration || 850)",
  "getActiveDailyTrailNonLearnCamera(memoryTrail)",
  "maybeFocusContinentsOceansNamePrompt"
];

if (requiredHooks.some((hook) => !source.includes(hook))) {
  throw new Error("C&O non-Learn fixed-camera enforcement hook is missing.");
}

console.log("Daily Trail C&O non-Learn camera check passed:", JSON.stringify(expectedCamera));
