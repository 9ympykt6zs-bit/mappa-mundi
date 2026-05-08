import { ActivitySession } from "./maplibre/activity-session.js";
import { MapLibreActivityRunner } from "./maplibre/maplibre-activity-runner.js";

const activityDataPath = "assets/maps/data/us-states-capitals-01.json";
const worldCountriesPath = "assets/maps/data/maplibre-world-countries.geojson";
const usStatesAtlasPath = "assets/maps/data/maplibre-us-states-atlas.geojson";
const stateGeoJsonPath = "assets/maps/data/maplibre-us-new-england-states.geojson";

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

  activityData = loadedActivity;
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
    syncAnswerBank();
    updateProgress();
    showFeedback(`Correct: ${result.feature.name}`, true);
  }
}

function resetActivity() {
  session.reset();
  feedback.textContent = "";
  feedback.classList.remove("success");
  runner.setCompletedTargets(session.completedIds);
  syncAnswerBank();
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
