import fs from "node:fs";

const expectedCameras = {
  "05": { center: [-85.09171, 41.83720], zoom: 4.5195, bearing: 0, pitch: 0 },
  "06": { center: [-93.82019, 38.32381], zoom: 4.3191, bearing: 0, pitch: 0 },
  "08": { center: [-102.21814, 34.02285], zoom: 4.3056, bearing: 0, pitch: 0 },
  "11": { center: [-148.03546, 45.94864], zoom: 2.7090, bearing: 0, pitch: 0 }
};

for (const [sectionId, expectedCamera] of Object.entries(expectedCameras)) {
  const activity = JSON.parse(
    fs.readFileSync(new URL(`../assets/maps/data/us-states-capitals-${sectionId}.json`, import.meta.url), "utf8")
  );
  if (JSON.stringify(activity.map?.dailyTrailNonLearnCamera) !== JSON.stringify(expectedCamera)) {
    throw new Error(`us-states-${sectionId} fixed Daily Trail camera does not match the approved view.`);
  }
}

const source = fs.readFileSync(new URL("../src/maplibre-poc.js", import.meta.url), "utf8");
const requiredHooks = [
  "function getActiveDailyTrailNonLearnCamera(memoryTrail)",
  'memoryTrail?.source === "daily-trail"',
  'memoryTrail?.sessionPhase !== "learn"',
  "dailyTrailNonLearnCamera: isDailyTrail ? session.currentActivity?.map?.dailyTrailNonLearnCamera || null : null",
  "getActiveDailyTrailNonLearnCamera(memoryTrail)"
];

if (requiredHooks.some((hook) => !source.includes(hook))) {
  throw new Error("Daily Trail fixed regional camera enforcement hook is missing.");
}

console.log("Daily Trail U.S. States regional camera check passed:", JSON.stringify(expectedCameras));
