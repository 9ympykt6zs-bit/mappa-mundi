import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { journeyPresets } from "../src/journey-presets.js";
import { ACROSS_UNITED_STATES_EXPEDITION_ID } from "../src/across-united-states-expedition.js";
import {
  createGlobeNavigationModel,
  findGlobeNavigationScopes,
  getGlobeNavigationChildren,
  getGlobeNavigationPath,
  getGlobeNavigationSelectableScopes,
  getGlobeNavigationScope,
  globeNavigationPrototype,
  isGlobeNavigationPrototypeEnabled
} from "../src/globe-navigation-prototype.js";

const readJson = (path) => JSON.parse(readFileSync(new URL(path, import.meta.url), "utf8"));
const worldCountries = {
  type: "FeatureCollection",
  features: [
    ...readJson("../assets/maps/data/maplibre-world-countries.geojson").features,
    ...readJson("../assets/maps/world/french-guiana-map-unit.geojson").features,
    ...readJson("../assets/maps/world/guam-map-unit.geojson").features
  ]
};
const runtimeModel = createGlobeNavigationModel(worldCountries, {
  getLearningReadiness: () => ({ ready: true, reason: "test-validated" })
});
const rejectedLearningModel = createGlobeNavigationModel(worldCountries, {
  getLearningReadiness: () => ({ ready: false, reason: "test-invalid-geometry" })
});

const world = getGlobeNavigationScope(globeNavigationPrototype.rootScopeId);
assert.equal(world.heading, "Where do you want to learn?");
assert.equal(world.view.zoom, 1.85);
assert.equal(world.learningAction.label, "Learn the Continents");
assert.deepEqual(
  getGlobeNavigationChildren(world.id).map(({ id }) => id),
  ["north-america", "south-america", "europe", "africa", "asia", "oceania", "antarctica"]
);
assert.equal(runtimeModel.countryScopeIds.length, 179, "Every loaded country/map-unit geometry must become a destination.");
assert.equal(getGlobeNavigationSelectableScopes(runtimeModel).length, 185);
assert.deepEqual(
  getGlobeNavigationChildren("world", runtimeModel).map(({ id }) => id),
  ["north-america", "south-america", "europe", "africa", "asia", "oceania", "antarctica"],
  "Continents must remain the world's stable first-level navigation."
);

assert.deepEqual(
  getGlobeNavigationPath("united-states").map(({ label }) => label),
  ["World", "North America", "United States"]
);
assert.equal(getGlobeNavigationScope("united-states").learningAction.expeditionId, ACROSS_UNITED_STATES_EXPEDITION_ID);
assert.ok(getGlobeNavigationChildren("europe").length >= 3, "Europe must prove country drill-down with a representative set.");
assert.equal(getGlobeNavigationScope("netherlands").availability, "coming-later");
assert.equal(getGlobeNavigationScope("netherlands").learningAction, undefined, "Unsupported content must not expose a fake learning action.");
assert.equal(getGlobeNavigationScope("france", rejectedLearningModel).learningAction, undefined, "Failed geometry validation must remove Learn.");
assert.equal(getGlobeNavigationScope("france", rejectedLearningModel).learningAvailability, "unavailable");
assert.deepEqual(findGlobeNavigationScopes("fran", runtimeModel).map(({ id }) => id), ["france"]);
assert.deepEqual(findGlobeNavigationScopes("Netherlands", runtimeModel).map(({ id }) => id), ["netherlands"]);
assert.deepEqual(findGlobeNavigationScopes("not a supported place", runtimeModel), []);

for (const [label, parentId] of [
  ["Peru", "south-america"],
  ["Ghana", "africa"],
  ["Japan", "asia"],
  ["Romania", "europe"],
  ["Mexico", "north-america"],
  ["Fiji", "oceania"],
  ["French Guiana", "south-america"],
  ["Guam", "oceania"]
]) {
  const [scope] = findGlobeNavigationScopes(label, runtimeModel).filter((candidate) => candidate.label === label);
  assert.ok(scope, `${label} must be searchable.`);
  assert.equal(scope.parentId, parentId);
  assert.equal(scope.navigationAvailability, "available");
  assert.equal(scope.learningAvailability, "unavailable");
  assert.equal(scope.learningAction, undefined);
}

const journeyIds = new Set(journeyPresets.map(({ id }) => id));
for (const scope of Object.values(globeNavigationPrototype.scopes)) {
  assert.ok(Array.isArray(scope.children), `${scope.id} must declare its children explicitly.`);
  if (scope.parentId) assert.ok(getGlobeNavigationScope(scope.parentId), `${scope.id} must have a valid parent.`);
  if (scope.learningAction?.kind === "journey") {
    assert.ok(journeyIds.has(scope.learningAction.journeyId), `${scope.id} must reuse an existing Journey.`);
  }
}

assert.equal(isGlobeNavigationPrototypeEnabled(""), true);
assert.equal(isGlobeNavigationPrototypeEnabled("?globeNavigation=off"), false);
assert.equal(isGlobeNavigationPrototypeEnabled("?globeNavigation=legacy"), false);
assert.equal(isGlobeNavigationPrototypeEnabled("?globeNavigation=on"), true);

const runtimeSource = readFileSync(new URL("../src/maplibre-poc.js", import.meta.url), "utf8");
const indexSource = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const configSource = readFileSync(new URL("../src/globe-navigation-prototype.js", import.meta.url), "utf8");
assert.match(runtimeSource, /isGlobeNavigationPrototypeEnabled\(window\.location\.search\)/);
assert.match(runtimeSource, /startAcrossUnitedStatesGlobeLearning\(\)/);
assert.match(runtimeSource, /activeExpeditionModel\.recommendedStepId/);
assert.match(runtimeSource, /hasMeaningfulContinuation/);
assert.match(runtimeSource, /directJourneyStepId/);
assert.match(runtimeSource, /configuredDirectLaunch\?\.journeyId\s*&&/);
assert.match(runtimeSource, /createGlobeNavigationModel\(mergedWorldCountries/);
assert.match(runtimeSource, /getGlobeNavigationSelectableScopes\(activeGlobeNavigationModel\)/);
assert.match(runtimeSource, /openGlobeNavigationJourneyLearning\(action\.journeyId\)/);
assert.match(runtimeSource, /getActivityRetrievalReadiness/);
assert.match(runtimeSource, /returnToGlobeNavigation/);
assert.match(indexSource, /id="globe-navigation-panel"/);
assert.match(indexSource, /id="globe-navigation-search"/);
assert.match(indexSource, /placeholder="Search places\.\.\."/);
assert.match(indexSource, /Start learning this area/);
assert.match(indexSource, /id="globe-navigation-learning-options"/);
assert.doesNotMatch(indexSource, /<details id="globe-navigation-find"/, "Find a place must be a search input rather than the old disclosure menu.");
assert.match(indexSource, /id="main-menu-us-expedition-button"/, "The current U.S. entry must remain intact.");
assert.match(indexSource, /id="main-menu-choose-button"/, "The current journey menu must remain intact.");
assert.doesNotMatch(configSource, /localStorage|sessionStorage/, "Navigation configuration must not create learner state.");

console.log("Globe navigation prototype preserves the legacy entry, geographic drill-down, honest availability, and the existing U.S. handoff.");
