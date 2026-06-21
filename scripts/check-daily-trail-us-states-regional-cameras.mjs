import fs from "node:fs";

const expectedCameras = {
  "05": { center: [-83.05151, 41.26396], zoom: 4.4957, bearing: 0, pitch: 0 },
  "06": { center: [-92.03510, 40.32598], zoom: 4.2778, bearing: 0, pitch: 0 },
  "07": { center: [-101.34221, 43.94894], zoom: 4.5833, bearing: 0, pitch: 0 },
  "08": { center: [-101.29509, 34.83337], zoom: 4.4430, bearing: 0, pitch: 0 },
  "09": { center: [-113.30046, 37.47135], zoom: 4.7266, bearing: 0, pitch: 0 },
  "11": { center: [-129.20682, 49.23213], zoom: 2.8050, bearing: 0, pitch: 0 }
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
