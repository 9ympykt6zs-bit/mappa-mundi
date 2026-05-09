import { normalizeActivity } from "./map-engines/activity-normalizer.js";
import { ActivitySession, studyModes } from "./maplibre/activity-session.js";
import { MapLibreActivityRunner } from "./maplibre/maplibre-activity-runner.js";

const activityDataPaths = [
  "assets/maps/data/western-european-countries.json",
  "assets/maps/data/northern-european-countries.json",
  "assets/maps/data/baltic-europe-countries.json",
  "assets/maps/data/balkans-countries.json",
  "assets/maps/data/central-european-countries.json",
  "assets/maps/data/more-central-european-countries.json",
  "assets/maps/data/southern-africa-countries.json",
  "assets/maps/data/us-states-capitals-01.json",
  "assets/maps/data/us-states-capitals-02.json",
  "assets/maps/data/us-states-capitals-03.json",
  "assets/maps/data/us-states-capitals-04.json",
  "assets/maps/data/us-states-capitals-05.json",
  "assets/maps/data/us-states-capitals-06.json",
  "assets/maps/data/us-states-capitals-07.json",
  "assets/maps/data/us-states-capitals-08.json",
  "assets/maps/data/us-states-capitals-09.json",
  "assets/maps/data/us-states-capitals-10.json"
];
const worldCountriesPath = "assets/maps/data/maplibre-world-countries.geojson";
const usStatesAtlasPath = "assets/maps/data/maplibre-us-states-atlas.geojson";
const stateGeoJsonPath = "assets/maps/data/maplibre-us-states-atlas.geojson";
const defaultActivityId = "us-states-capitals-10";

const regionDefaultActivityIds = {
  "united-states": defaultActivityId,
  "western-europe": "western-european-countries",
  "northern-europe": "northern-european-countries",
  "baltic-europe": "baltic-europe-countries",
  "balkans": "balkans-countries",
  "central-europe": "central-european-countries",
  "more-central-europe": "more-central-european-countries",
  "southern-africa": "southern-africa-countries"
};

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
  delaware: [-75.5, 39.1],
  maryland: [-76.7, 39],
  virginia: [-78.5, 37.5],
  "west-virginia": [-80.6, 38.6],
  "north-carolina": [-79.4, 35.5],
  "south-carolina": [-80.9, 33.8],
  georgia: [-83.5, 32.7],
  florida: [-82.5, 28.4],
  alabama: [-86.8, 32.8],
  mississippi: [-89.7, 32.7],
  louisiana: [-91.9, 31],
  michigan: [-85.5, 44.3],
  ohio: [-82.8, 40.3],
  indiana: [-86.2, 40],
  kentucky: [-84.8, 37.8],
  tennessee: [-86.4, 35.8],
  wisconsin: [-89.8, 44.7],
  illinois: [-89.3, 40],
  iowa: [-93.5, 42.1],
  missouri: [-92.5, 38.5],
  arkansas: [-92.4, 34.8],
  minnesota: [-94.3, 46.3],
  "north-dakota": [-100.5, 47.5],
  "south-dakota": [-100.2, 44.5],
  wyoming: [-107.5, 43],
  nebraska: [-99.8, 41.5],
  kansas: [-98.3, 38.5],
  oklahoma: [-97.5, 35.5],
  texas: [-99.3, 31],
  colorado: [-105.5, 39],
  "new-mexico": [-106, 34.5],
  utah: [-111.5, 39.3],
  arizona: [-111.8, 34.2],
  nevada: [-117, 39],
  california: [-119.5, 37],
  hawaii: [-157.5, 20.8],
  montana: [-110.5, 47],
  idaho: [-114.3, 44.2],
  washington: [-120.5, 47.4],
  oregon: [-120.5, 44],
  alaska: [-150, 64]
};

const overviewRegions = {
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
    },
    {
      type: "Feature",
      properties: {
        id: "western-europe",
        name: "Western Europe"
      },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [-12, 35],
          [8, 35],
          [8, 59],
          [-12, 59],
          [-12, 35]
        ]]
      }
    },
    {
      type: "Feature",
      properties: {
        id: "northern-europe",
        name: "Scandinavia / Northern Europe"
      },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [3, 54],
          [33, 54],
          [33, 72],
          [3, 72],
          [3, 54]
        ]]
      }
    },
    {
      type: "Feature",
      properties: {
        id: "southern-africa",
        name: "Southern Africa"
      },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [10, -36],
          [42, -36],
          [42, -10],
          [10, -10],
          [10, -36]
        ]]
      }
    },
    {
      type: "Feature",
      properties: {
        id: "baltic-europe",
        name: "Baltic Europe"
      },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [13, 48.5],
          [33.5, 48.5],
          [33.5, 60.5],
          [13, 60.5],
          [13, 48.5]
        ]]
      }
    },
    {
      type: "Feature",
      properties: {
        id: "balkans",
        name: "Balkans"
      },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [12.5, 34],
          [30.5, 34],
          [30.5, 49],
          [12.5, 49],
          [12.5, 34]
        ]]
      }
    },
    {
      type: "Feature",
      properties: {
        id: "central-europe",
        name: "Central Europe"
      },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [1.8, 45.2],
          [16, 45.2],
          [16, 55.4],
          [1.8, 55.4],
          [1.8, 45.2]
        ]]
      }
    },
    {
      type: "Feature",
      properties: {
        id: "more-central-europe",
        name: "More Central Europe"
      },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [6, 35.8],
          [23.5, 35.8],
          [23.5, 52],
          [6, 52],
          [6, 35.8]
        ]]
      }
    }
  ]
};

let activities = [];
let selectedActivityId = defaultActivityId;
let session;
let runner;
let feedbackTimer;
let grabbedAnswerId = null;
let grabbedPointerId = null;
let grabbedStartPoint = null;
let grabbedHasMoved = false;
let floatingChip = null;

const title = document.querySelector("#poc-title");
const instruction = document.querySelector("#poc-instruction");
const answerBank = document.querySelector("#answer-bank");
const progress = document.querySelector("#progress");
const feedback = document.querySelector("#feedback");
const resetButton = document.querySelector("#reset-button");
const worldViewButton = document.querySelector("#world-view-button");
const fitMapButton = document.querySelector("#fit-map-button");
const zoomSlider = document.querySelector("#zoom-slider");
const studyCard = document.querySelector("#study-card");
const regionButtons = document.querySelectorAll("[data-region]");
const studyModeButtons = document.querySelectorAll("[data-study-mode]");

async function init() {
  const [loadedActivities, worldCountries, usStatesAtlas, stateTargets] = await Promise.all([
    Promise.all(activityDataPaths.map((path) => fetchJson(path))),
    fetchJson(worldCountriesPath),
    fetchJson(usStatesAtlasPath),
    fetchJson(stateGeoJsonPath)
  ]);

  activities = loadedActivities.map((activity) => normalizeMapLibrePocActivity(activity));
  session = new ActivitySession(getSelectedActivity(), {
    activityCatalog: activities,
    studyMode: studyModes.cumulative
  });
  runner = new MapLibreActivityRunner({
    maplibregl: window.maplibregl,
    container: "map"
  });

  runner.onRegionSelect((regionId) => {
    selectActivity(regionDefaultActivityIds[regionId] || defaultActivityId);
  });
  runner.onTargetClick(handleTargetClick);

  await runner.load({
    activity: session.activity,
    worldCountries,
    usStatesAtlas,
    stateTargets
  });

  renderAnswerBank();
  updateProgress();
  updateStudyModeButtons();
  bindUiEvents();
  bindZoomControls();
}

function normalizeMapLibrePocActivity(rawActivity) {
  const region = rawActivity.map?.region || (rawActivity.id?.startsWith("us-") ? "united-states" : "world");
  const mapDefaults = getMapDefaults(rawActivity, region);

  return normalizeActivity(rawActivity, {
    schemaVersion: 2,
    engine: "maplibre",
    map: {
      ...mapDefaults,
      ...(rawActivity.map || {})
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

function getMapDefaults(rawActivity, region) {
  const commonDefaults = {
    kind: "globe-region",
    region,
    overviewRegions,
    initialView: { center: [-18, 18], zoom: 1.25 }
  };

  if (region === "united-states") {
    const isFullUsActivity = Number(rawActivity.sequence) >= 9;

    return {
      ...commonDefaults,
      regionView: { center: [-98, 39], zoom: 3.1 },
      studyView: {
        bounds: isFullUsActivity
          ? [[-170, 18], [-66.75, 72]]
          : [[-108.5, 25.1], [-66.75, 49.2]],
        padding: { top: 55, right: 46, bottom: 78, left: 46 },
        duration: 1200
      }
    };
  }

  const regionViews = {
    "western-europe": {
      regionView: { center: [-2, 48], zoom: 3.4 },
      studyView: {
        bounds: [[-12.8, 35.1], [8.8, 59.4]],
        padding: { top: 54, right: 54, bottom: 86, left: 54 },
        duration: 1050
      }
    },
    "northern-europe": {
      regionView: { center: [17, 62], zoom: 3.2 },
      studyView: {
        bounds: [[2.5, 54.1], [33.8, 72.2]],
        padding: { top: 54, right: 54, bottom: 86, left: 54 },
        duration: 1050
      }
    },
    "baltic-europe": {
      regionView: { center: [23.5, 54.6], zoom: 3.9 },
      studyView: {
        bounds: [[13, 48.5], [33.5, 60.5]],
        padding: { top: 54, right: 54, bottom: 86, left: 54 },
        duration: 1050
      }
    },
    "balkans": {
      regionView: { center: [22, 42], zoom: 3.8 },
      studyView: {
        bounds: [[12.5, 34], [30.5, 49]],
        padding: { top: 54, right: 54, bottom: 86, left: 54 },
        duration: 1050
      }
    },
    "central-europe": {
      regionView: { center: [8.8, 50.5], zoom: 4.2 },
      studyView: {
        bounds: [[1.8, 45.2], [16, 55.4]],
        padding: { top: 54, right: 54, bottom: 86, left: 54 },
        duration: 1050
      }
    },
    "more-central-europe": {
      regionView: { center: [14.8, 44.5], zoom: 3.8 },
      studyView: {
        bounds: [[6, 35.8], [23.5, 52]],
        padding: { top: 54, right: 54, bottom: 86, left: 54 },
        duration: 1050
      }
    },
    "southern-africa": {
      regionView: { center: [25, -23], zoom: 3.1 },
      studyView: {
        bounds: [[10, -36.5], [42, -9.7]],
        padding: { top: 54, right: 54, bottom: 86, left: 54 },
        duration: 1050
      }
    }
  };

  return {
    ...commonDefaults,
    ...(regionViews[region] || {
      regionView: { center: [0, 20], zoom: 2 },
      studyView: {
        bounds: [[-20, -40], [50, 75]],
        padding: { top: 54, right: 54, bottom: 86, left: 54 },
        duration: 1050
      }
    })
  };
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
      selectActivity(button.dataset.activityId || regionDefaultActivityIds[button.dataset.region] || defaultActivityId);
    });
  });

  studyModeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      cancelGrabbedAnswer();
      session.setStudyMode(button.dataset.studyMode);
      runner.updateActivity(session.activity);
      renderAnswerBank();
      updateProgress();
      updateStudyModeButtons();
      updateStudyCardDetails();
      clearFeedback();
    });
  });

  worldViewButton.addEventListener("click", returnToWorldView);
  resetButton.addEventListener("click", resetActivity);
  document.addEventListener("pointermove", handleDocumentPointerMove);
  document.addEventListener("pointerup", handleDocumentPointerUp);
  document.addEventListener("pointercancel", cancelGrabbedAnswer);
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      cancelGrabbedAnswer();
    }
  });
}

function bindZoomControls() {
  if (!zoomSlider || !fitMapButton) {
    return;
  }

  zoomSlider.addEventListener("input", () => {
    runner.setZoom(Number(zoomSlider.value));
  });
  fitMapButton.addEventListener("click", () => {
    runner.fitCurrentView();
  });
  runner.onZoomChange((zoom) => {
    zoomSlider.value = String(Math.max(Number(zoomSlider.min), Math.min(Number(zoomSlider.max), zoom)));
  });
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
    chip.addEventListener("pointerdown", (event) => {
      handleChipPointerDown(event, feature);
    });
    chip.addEventListener("click", (event) => {
      event.preventDefault();
    });
    answerBank.appendChild(chip);
  });
}

function selectActivity(activityId) {
  cancelGrabbedAnswer();
  selectedActivityId = activityId;
  session.setActivity(getSelectedActivity());
  runner.updateActivity(session.activity);
  renderAnswerBank();
  updateProgress();
  clearFeedback();
  enterStudy();
}

function enterStudy() {
  document.body.classList.remove("overview-mode");
  document.body.classList.add("study-mode");
  title.textContent = session.currentActivity.title;
  instruction.textContent = `Select a ${session.currentActivity.targetNoun} label, then click its target on the map.`;
  updateStudyCardDetails();
  studyCard.hidden = false;
  runner.enterStudyView();
}

function returnToWorldView() {
  cancelGrabbedAnswer();
  session.clearSelection();
  syncAnswerBank();
  document.body.classList.add("overview-mode");
  document.body.classList.remove("study-mode");
  title.textContent = "World View";
  instruction.textContent = "Choose a study region from the globe or the list below.";
  studyCard.hidden = true;
  runner.enterOverview();
}

function handleTargetClick(targetIds) {
  placeGrabbedAnswer(targetIds, {
    keepGrabbedOnIncorrect: true
  });
}

function placeGrabbedAnswer(targetIds, options = {}) {
  const targetId = choosePlacementTarget(targetIds);
  const result = session.tryAnswer(targetId);

  if (result.status === "no-selection") {
    showFeedback("Select a label first.");
    return;
  }

  if (result.status === "incorrect") {
    showFeedback("Try again");
    if (!options.keepGrabbedOnIncorrect) {
      cancelGrabbedAnswer();
    }
    return;
  }

  if (result.status === "correct") {
    runner.setCompletedTargets(session.completedIds);
    cancelGrabbedAnswer({ clearSelection: false });
    renderAnswerBank();
    updateProgress();
    showFeedback(`Correct: ${result.feature.name}`, true);
  }
}

function choosePlacementTarget(targetIds) {
  const candidateIds = Array.isArray(targetIds)
    ? targetIds
    : [targetIds].filter(Boolean);

  if (session.selectedId && candidateIds.includes(session.selectedId)) {
    return session.selectedId;
  }

  return candidateIds[0] || null;
}

function resetActivity() {
  cancelGrabbedAnswer();
  session.reset();
  clearFeedback();
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

function handleChipPointerDown(event, feature) {
  event.preventDefault();
  event.stopPropagation();

  if (grabbedAnswerId === feature.id) {
    cancelGrabbedAnswer();
    return;
  }

  beginGrabbedAnswer(feature.id, event.clientX, event.clientY, event.pointerId);
  event.currentTarget.setPointerCapture?.(event.pointerId);
}

function beginGrabbedAnswer(id, clientX, clientY, pointerId = null) {
  if (session.selectedId !== id) {
    session.toggleAnswer(id);
  }

  grabbedAnswerId = id;
  grabbedPointerId = pointerId;
  grabbedStartPoint = { x: clientX, y: clientY };
  grabbedHasMoved = false;
  runner.setMapDragEnabled(false);
  showFloatingChip(id, clientX, clientY);
  syncAnswerBank();
}

function handleDocumentPointerMove(event) {
  if (!grabbedAnswerId) {
    return;
  }

  updateFloatingChipPosition(event.clientX, event.clientY);

  if (grabbedPointerId === event.pointerId && grabbedStartPoint) {
    const distance = Math.hypot(event.clientX - grabbedStartPoint.x, event.clientY - grabbedStartPoint.y);
    grabbedHasMoved = grabbedHasMoved || distance > 6;
  }
}

function handleDocumentPointerUp(event) {
  if (!grabbedAnswerId || grabbedPointerId !== event.pointerId) {
    return;
  }

  const shouldDrop = grabbedHasMoved;
  grabbedPointerId = null;
  grabbedStartPoint = null;
  grabbedHasMoved = false;

  if (!shouldDrop) {
    return;
  }

  const targetIds = runner.getTargetIdsAtClientPoint(event.clientX, event.clientY);
  placeGrabbedAnswer(targetIds, {
    keepGrabbedOnIncorrect: false
  });
}

function showFloatingChip(id, clientX, clientY) {
  const feature = session.getFeature(id);

  if (!floatingChip) {
    floatingChip = document.createElement("div");
    floatingChip.className = "floating-label-chip";
    document.body.appendChild(floatingChip);
  }

  floatingChip.textContent = feature?.name || "";
  floatingChip.hidden = false;
  updateFloatingChipPosition(clientX, clientY);
}

function updateFloatingChipPosition(clientX, clientY) {
  if (!floatingChip) {
    return;
  }

  floatingChip.style.transform = `translate(${clientX + 14}px, ${clientY + 14}px)`;
}

function cancelGrabbedAnswer(options = {}) {
  const shouldClearSelection = options.clearSelection !== false;

  grabbedAnswerId = null;
  grabbedPointerId = null;
  grabbedStartPoint = null;
  grabbedHasMoved = false;
  runner?.setMapDragEnabled(true);

  if (floatingChip) {
    floatingChip.hidden = true;
  }

  if (shouldClearSelection) {
    session?.clearSelection();
  }

  syncAnswerBank();
}

function updateProgress() {
  progress.textContent = session.progressText;
}

function updateStudyModeButtons() {
  studyModeButtons.forEach((button) => {
    const isActive = button.dataset.studyMode === session.studyMode;
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });
}

function updateStudyCardDetails() {
  studyCard.querySelector("strong").textContent = session.currentActivity.title;
  studyCard.querySelector("span").textContent = session.studyMode === studyModes.cumulative
    ? "Cumulative review"
    : "Current section only";
}

function getSelectedActivity() {
  return activities.find((activity) => activity.id === selectedActivityId) || activities[0];
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

function clearFeedback() {
  clearTimeout(feedbackTimer);
  feedback.textContent = "";
  feedback.classList.remove("success");
}

init().catch((error) => {
  title.textContent = "MapLibre prototype could not load";
  instruction.textContent = error.message;
});
