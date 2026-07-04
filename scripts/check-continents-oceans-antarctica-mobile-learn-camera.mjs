import assert from "node:assert/strict";
import fs from "node:fs";

const activity = JSON.parse(fs.readFileSync(
  new URL("../assets/maps/data/continents-oceans.json", import.meta.url),
  "utf8"
));
const source = fs.readFileSync(
  new URL("../src/maplibre-poc.js", import.meta.url),
  "utf8"
);

const antarctica = activity.features.find((target) => target.id === "antarctica");
const expectedMobileLearnCamera = {
  center: [59.55067, -85.05113],
  zoom: -1.2394,
  bearing: 0,
  pitch: 0,
  cameraContext: "c&o-learn-focus",
  source: "c&o-learn-target-focus"
};

assert.deepEqual(
  {
    focusLon: antarctica?.focusLon,
    focusLat: antarctica?.focusLat,
    focusZoom: antarctica?.focusZoom
  },
  {
    focusLon: 20,
    focusLat: -72,
    focusZoom: 1.25
  },
  "Base Antarctica target focus data must remain unchanged for desktop and non-Learn cameras."
);

const configStart = source.indexOf("const continentsOceansMobileLearnCameraOverrides = Object.freeze({");
const configEnd = source.indexOf("const continentsOceansNamePromptFocusProfiles", configStart);
const configSource = source.slice(configStart, configEnd);

assert.ok(configStart >= 0, "C&O mobile Learn camera override config is missing.");
assert.ok(configSource.includes("antarctica: Object.freeze({"));
assert.ok(configSource.includes("center: [59.55067, -85.05113]"));
assert.ok(configSource.includes("zoom: -1.2394"));
assert.ok(configSource.includes("bearing: 0"));
assert.ok(configSource.includes("pitch: 0"));
assert.ok(configSource.includes('cameraContext: "c&o-learn-focus"'));
assert.ok(configSource.includes('source: "c&o-learn-target-focus"'));

const lookupStart = source.indexOf("function getContinentsOceansMobileLearnCameraOverride(");
const lookupEnd = source.indexOf("function maybeFocusContinentsOceansLearnPrompt(", lookupStart);
const lookupSource = source.slice(lookupStart, lookupEnd);

assert.ok(lookupSource.includes("session.currentActivity?.id !== continentsOceansActivityId"));
assert.ok(lookupSource.includes("!isCompactTouchLayout()"));
assert.ok(lookupSource.includes("continentsOceansMobileLearnCameraOverrides[target.id] || null"));

const focusStart = source.indexOf("function maybeFocusContinentsOceansLearnPrompt(");
const focusEnd = source.indexOf("function maybeFocusContinentsOceansNamePrompt(", focusStart);
const focusSource = source.slice(focusStart, focusEnd);

assert.ok(focusSource.includes('memoryTrail.sessionPhase !== "learn"'), "Override must stay in the Learn-only path.");
assert.ok(focusSource.includes('memoryTrail.currentPromptType !== "guided"'), "Override must stay in the guided Learn prompt path.");
assert.ok(focusSource.includes("focusCenter: mobileLearnCameraOverride.center"));
assert.ok(focusSource.includes("focusZoom: mobileLearnCameraOverride.zoom"));
assert.ok(focusSource.includes("focusMaxZoom: mobileLearnCameraOverride.zoom"));
assert.ok(focusSource.includes("force: Boolean(focusProfile.forceOnPromptStart || mobileLearnCameraOverride)"));
assert.ok(focusSource.includes('cameraContext: mobileLearnCameraOverride?.cameraContext || "c&o-learn-focus"'));
assert.ok(focusSource.includes('source: mobileLearnCameraOverride?.source || "c&o-learn-target-focus"'));

console.log("C&O Antarctica mobile Learn camera check passed:", JSON.stringify(expectedMobileLearnCamera));
