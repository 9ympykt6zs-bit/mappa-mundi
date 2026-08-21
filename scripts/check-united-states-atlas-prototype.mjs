import assert from "node:assert/strict";
import fs from "node:fs";
import { createUnitedStatesAtlasProgress } from "../src/atlas/united-states-atlas-progress.js";
import { getUnitedStatesAtlasProfilePanelData } from "../src/atlas/united-states-atlas-ui.js";

const louisiana = getUnitedStatesAtlasProfilePanelData("louisiana");
assert.equal(louisiana.capital.name, "Baton Rouge");

const tennessee = getUnitedStatesAtlasProfilePanelData("tennessee");
assert.deepEqual(tennessee.sections.find((section) => section.title === "Neighboring states").items, [
  "Alabama", "Arkansas", "Georgia", "Kentucky", "Mississippi", "Missouri", "North Carolina", "Virginia"
].map((label) => ({ label, namePolicyNote: "" })));

const colorado = getUnitedStatesAtlasProfilePanelData("colorado");
assert.ok(colorado.sections.find((section) => section.title === "Mountain ranges").items.some((item) => item.label === "Rocky Mountains"));

const florida = getUnitedStatesAtlasProfilePanelData("florida");
assert.deepEqual(florida.sections.find((section) => section.title === "Coasts").items.map((item) => item.label), ["Atlantic Ocean", "Gulf of Mexico"]);
assert.equal(
  florida.sections.find((section) => section.title === "Coasts").items.find((item) => item.label === "Gulf of Mexico").namePolicyNote,
  "Officially called the Gulf of America by the U.S. federal government."
);

const alaska = getUnitedStatesAtlasProfilePanelData("alaska");
assert.deepEqual(alaska.sections.find((section) => section.title === "Maritime neighbors").items.map((item) => item.label), ["Russia (Across the Bering Strait)"]);

const hawaii = getUnitedStatesAtlasProfilePanelData("hawaii");
assert.equal(
  hawaii.sections.find((section) => section.title === "Lakes").emptyMessage,
  "No connected lakes are recorded for this state yet."
);
assert.equal(getUnitedStatesAtlasProfilePanelData("unknown-state"), null);

const learningProfile = getUnitedStatesAtlasProfilePanelData("louisiana", createUnitedStatesAtlasProgress({
  unitedStatesMemoryTrailState: { itemProgress: { "state:louisiana": { status: "learning", timesSeen: 1 } } }
}));
assert.equal(learningProfile.learningStatus.status, "learning");

const runtimeSource = fs.readFileSync("src/maplibre-poc.js", "utf8");
const runnerSource = fs.readFileSync("src/maplibre/maplibre-activity-runner.js", "utf8");
const markupSource = fs.readFileSync("index.html", "utf8");
assert.ok(markupSource.includes('id="main-menu-united-states-atlas-button"'), "Main menu must expose the United States Atlas entry point.");
assert.ok(markupSource.includes('id="main-menu-mental-map-challenge-button"'), "Main menu must expose the Mental Map Challenge entry point.");
assert.ok(markupSource.includes('id="united-states-atlas-profile"'), "Atlas profile panel host is missing.");
assert.ok(markupSource.includes('id="united-states-atlas-overview"'), "Atlas learning overview host is missing.");
assert.ok(markupSource.includes('id="mental-map-challenge-panel"'), "Mental Map Challenge panel host is missing.");
assert.ok(runtimeSource.includes("function openUnitedStatesAtlas()"), "Atlas open handler is missing.");
assert.ok(runtimeSource.includes("function selectUnitedStatesAtlasState(stateId)"), "Atlas state selection handler is missing.");
assert.ok(runtimeSource.includes("async function openMentalMapChallenge(options = {})"), "Mental Map Challenge open handler is missing.");
assert.ok(runtimeSource.includes("openMentalMapChallenge({ stateCapitalOnly: true })"), "Capital Connections must reuse the filtered Mental Map entry path.");
assert.ok(runtimeSource.includes("function submitActiveMentalMapChallenge()"), "Mental Map Challenge submit handler is missing.");
assert.ok(runtimeSource.includes('currentAppScreen === "united-states-atlas"'), "Map taps must be scoped to the dedicated atlas screen.");
assert.ok(runnerSource.includes("enterUnitedStatesAtlas(options = {})"), "Runner atlas overview method is missing.");
assert.ok(runnerSource.includes("setUnitedStatesAtlasSelection(stateId = \"\")"), "Runner atlas selection method is missing.");
assert.ok(runnerSource.includes("setUnitedStatesAtlasLearningStatuses(statuses = {})"), "Runner atlas learning-status method is missing.");
assert.ok(runnerSource.includes("enterBorderChain(options = {})"), "Reusable Border Chain map infrastructure is missing.");
assert.ok(runnerSource.includes("setBorderChainVisualState(visualState = {})"), "Reusable Border Chain visual-state infrastructure is missing.");
assert.ok(runnerSource.includes("enterMentalMapChallengeResult(options = {})"), "Mental Map Challenge result-map method is missing.");

console.log("United States atlas prototype check passed:", JSON.stringify({
  louisianaCapital: louisiana.capital.name,
  tennesseeBorders: tennessee.borderingStates.length,
  coloradoMountainRanges: colorado.mountainRanges.length,
  floridaCoasts: florida.coasts.length
}));
