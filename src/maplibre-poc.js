import { normalizeActivity } from "./map-engines/activity-normalizer.js";
import { ActivitySession } from "./maplibre/activity-session.js";
import { MapLibreActivityRunner } from "./maplibre/maplibre-activity-runner.js";

const activityDataPath = "assets/maps/data/us-states-capitals-02.json";
const worldCountriesPath = "assets/maps/data/maplibre-world-countries.geojson";
const usStatesAtlasPath = "assets/maps/data/maplibre-us-states-atlas.geojson";
const stateGeoJsonPath = "assets/maps/data/maplibre-us-states-atlas.geojson";

const stateLabelAnchors = {
  maine: [-69.2, 45.25],
  "new-hampshire": [-71.58, 43.75],
  massachusetts: [-71.85, 42.25],
  "rhode-island": [-71.55, 41.62],
  connecticut: [-72.72, 41.58],
  vermont: [-72.7, 44.05],
  "new-york": [-75.4, 43],
  "new-jersey": [-74.65, 40.25],
  pennsylvania: [-77.8, 40.8],
  delaware: [-75.5, 39.1]
};

const usOverviewRegion = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: {
        id: "united-states",
        name: "United States"
      },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [-125, 24],
          [-66, 24],
          [-66, 50],
          [-125, 50],
          [-125, 24]
        ]]
      }
    }
  ]
};

let activityData;
let session;
let runner;
let feedbackTimer;

const title = document.querySelector("#poc-title");
const instruction = document.querySelector("#poc-instruction");
const answerBank = document.querySelector("#answer-bank");
const progress = document.querySelector("#progress");
const feedback = document.querySelector("#feedback");
const resetButton = document.querySelector("#reset-button");
const worldViewButton = document.querySelector("#world-view-button");
const studyCard = document.querySelector("#study-card");
const regionButtons = document.querySelectorAll("[data-region]");

async function init() {
  const [loadedActivity, worldCountries, usStatesAtlas, stateTargets] = await Promise.all([
    fetchJson(activityDataPath),
    fetchJson(worldCountriesPath),
    fetchJson(usStatesAtlasPath),
    fetchJson(stateGeoJsonPath)
  ]);

  activityData = normalizeMapLibrePocActivity(loadedActivity);
  session = new ActivitySession(activityData);
  runner = new MapLibreActivityRunner({
    maplibregl: window.maplibregl,
    container: "map"
  });

  runner.onRegionSelect((regionId) => {
    if (regionId === "united-states") {
      enterUnitedStatesStudy();
    }
  });
  runner.onTargetClick(handleTargetClick);

  await runner.load({
    activity: activityData,
    worldCountries,
    usStatesAtlas,
    stateTargets
  });

  renderAnswerBank();
  updateProgress();
  bindUiEvents();
}

function normalizeMapLibrePocActivity(rawActivity) {
  return normalizeActivity(rawActivity, {
    schemaVersion: 2,
    engine: "maplibre",
    map: {
      kind: "globe-region",
      region: "united-states",
      overviewRegions: usOverviewRegion,
      initialView: { center: [-18, 18], zoom: 1.25 },
      regionView: { center: [-98, 39], zoom: 3.1 },
      studyView: {
        bounds: [[-80.8, 38.6], [-66.75, 47.55]],
        padding: { top: 55, right: 46, bottom: 78, left: 46 },
        duration: 1200
      }
    },
    sources: [
      {
        id: "world-countries",
        type: "geojson",
        url: worldCountriesPath,
        attribution: "Natural Earth public domain"
      },
      {
        id: "us-states-atlas",
        type: "geojson",
        url: usStatesAtlasPath,
        attribution: "U.S. Census Bureau"
      },
      {
        id: "study-states",
        type: "geojson",
        url: stateGeoJsonPath,
        promoteId: "id",
        attribution: "U.S. Census Bureau"
      }
    ],
    targetLayers: [
      {
        id: "state-fill",
        kind: "shape",
        sourceId: "study-states",
        matchProperty: "id"
      },
      {
        id: "capital-hit",
        kind: "point",
        source: "targets"
      }
    ],
    labelAnchors: stateLabelAnchors
  });
}

async function fetchJson(path) {
  const response = await fetch(path);

  if (!response.ok) {
    throw new Error(`${path} could not be loaded.`);
  }

  return response.json();
}

function bindUiEvents() {
  regionButtons.forEach((button) => {
    button.addEventListener("click", () => {
      if (button.dataset.region === "united-states") {
        enterUnitedStatesStudy();
      }
    });
  });

  worldViewButton.addEventListener("click", returnToWorldView);
  resetButton.addEventListener("click", resetActivity);
}

function renderAnswerBank() {
  answerBank.innerHTML = "";

  session.answerItems.forEach((feature) => {
    const chip = document.createElement("button");
    chip.className = "label-chip";
    chip.type = "button";
    chip.dataset.id = feature.id;
    chip.textContent = feature.name;
    chip.setAttribute("aria-pressed", "false");
    chip.addEventListener("click", () => {
      session.toggleAnswer(feature.id);
      syncAnswerBank();
    });
    answerBank.appendChild(chip);
  });
}

function enterUnitedStatesStudy() {
  document.body.classList.remove("overview-mode");
  document.body.classList.add("study-mode");
  title.textContent = activityData.title;
  instruction.textContent = "Select a state or capital label, then click its target on the map.";
  studyCard.hidden = false;
  runner.enterStudyView();
}

function returnToWorldView() {
  session.clearSelection();
  syncAnswerBank();
  document.body.classList.add("overview-mode");
  document.body.classList.remove("study-mode");
  title.textContent = "World View";
  instruction.textContent = "Choose a study region from the globe or the list below.";
  studyCard.hidden = true;
  runner.enterOverview();
}

function handleTargetClick(targetId) {
  const result = session.tryAnswer(targetId);

  if (result.status === "no-selection") {
    showFeedback("Select a label first.");
    return;
  }

  if (result.status === "incorrect") {
    showFeedback("Try again");
    return;
  }

  if (result.status === "correct") {
    runner.setCompletedTargets(session.completedIds);
    renderAnswerBank();
    updateProgress();
    showFeedback(`Correct: ${result.feature.name}`, true);
  }
}

function resetActivity() {
  session.reset();
  feedback.textContent = "";
  feedback.classList.remove("success");
  runner.setCompletedTargets(session.completedIds);
  renderAnswerBank();
  updateProgress();
}

function syncAnswerBank() {
  answerBank.querySelectorAll(".label-chip").forEach((chip) => {
    const id = chip.dataset.id;
    const isSelected = session.selectedId === id;
    const isCompleted = session.isCompleted(id);

    chip.classList.toggle("selected", isSelected);
    chip.classList.toggle("used", isCompleted);
    chip.disabled = isCompleted;
    chip.setAttribute("aria-pressed", String(isSelected));
  });
}

function updateProgress() {
  progress.textContent = session.progressText;
}

function showFeedback(message, isSuccess = false) {
  clearTimeout(feedbackTimer);
  feedback.textContent = message;
  feedback.classList.toggle("success", isSuccess);

  feedbackTimer = window.setTimeout(() => {
    feedback.textContent = "";
    feedback.classList.remove("success");
  }, 1400);
}

init().catch((error) => {
  title.textContent = "MapLibre prototype could not load";
  instruction.textContent = error.message;
});
