const activityDataPath = "assets/maps/data/us-states-capitals-01.json";
const stateGeoJsonPath = "assets/maps/data/maplibre-us-new-england-states.geojson";

// State polygons are lon/lat GeoJSON from U.S. Census TIGERweb's generalized
// ACS2023 state layer. Census cartographic boundary data is public domain/CC0
// in the data.gov metadata, and MapLibre handles projection and hit testing.
const colors = {
  ink: "#172033",
  ocean: "#dceef8",
  land: "#f8fafc",
  stateFill: "#ffffff",
  targetStroke: "#111827",
  neutralMarker: "#ffffff",
  neutralMarkerStroke: "#172033"
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

const stateLabelPositions = {
  maine: [-69.2, 45.25],
  "new-hampshire": [-71.58, 43.75],
  massachusetts: [-71.85, 42.25],
  "rhode-island": [-71.55, 41.62],
  connecticut: [-72.72, 41.58]
};

let map;
let activityData;
let stateData;
let currentView = "overview";
let selectedAnswerId = null;
let feedbackTimer;
const completed = new Set();

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
  [activityData, stateData] = await Promise.all([
    fetchJson(activityDataPath),
    fetchJson(stateGeoJsonPath)
  ]);

  map = new maplibregl.Map({
    container: "map",
    center: [-18, 18],
    zoom: 1.25,
    minZoom: 0.8,
    maxZoom: 12,
    projection: { type: "globe" },
    style: {
      version: 8,
      projection: { type: "globe" },
      glyphs: "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf",
      sources: {
        osm: {
          type: "raster",
          tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
          tileSize: 256,
          attribution: "&copy; OpenStreetMap contributors"
        }
      },
      layers: [
        {
          id: "osm",
          type: "raster",
          source: "osm"
        }
      ],
      sky: {
        "atmosphere-blend": 0.45
      }
    }
  });
  window.maplibrePocMap = map;

  map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), "top-right");

  map.on("load", () => {
    addOverviewLayers();
    addStudyLayers();
    renderAnswerBank();
    updateProgress();
  });

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

async function fetchJson(path) {
  const response = await fetch(path);

  if (!response.ok) {
    throw new Error(`${path} could not be loaded.`);
  }

  return response.json();
}

function addOverviewLayers() {
  map.addSource("overview-regions", {
    type: "geojson",
    data: usOverviewRegion
  });

  map.addLayer({
    id: "overview-region-fill",
    type: "fill",
    source: "overview-regions",
    paint: {
      "fill-color": "#2563eb",
      "fill-opacity": 0.08
    }
  });

  map.addLayer({
    id: "overview-region-line",
    type: "line",
    source: "overview-regions",
    paint: {
      "line-color": "#2563eb",
      "line-dasharray": [3, 2],
      "line-width": 2
    }
  });

  map.addLayer({
    id: "overview-region-label",
    type: "symbol",
    source: "overview-regions",
    layout: {
      "text-field": ["get", "name"],
      "text-size": 16,
      "text-font": ["Open Sans Regular", "Arial Unicode MS Regular"]
    },
    paint: {
      "text-color": "#174ea6",
      "text-halo-color": "#ffffff",
      "text-halo-width": 1.8
    }
  });

  map.on("mouseenter", "overview-region-fill", () => {
    map.getCanvas().style.cursor = "pointer";
  });
  map.on("mouseleave", "overview-region-fill", () => {
    map.getCanvas().style.cursor = "";
  });
  map.on("click", handleMapClick);
}

function addStudyLayers() {
  map.addSource("study-states", {
    type: "geojson",
    data: stateData,
    promoteId: "id"
  });

  map.addSource("study-capitals", {
    type: "geojson",
    data: getCapitalGeoJson()
  });

  map.addSource("completed-labels", {
    type: "geojson",
    data: getCompletedLabelGeoJson()
  });

  map.addLayer({
    id: "state-fill",
    type: "fill",
    source: "study-states",
    layout: {
      visibility: "none"
    },
    paint: {
      "fill-color": getStateFillExpression(),
      "fill-opacity": 0.88
    }
  });

  map.addLayer({
    id: "state-line",
    type: "line",
    source: "study-states",
    layout: {
      visibility: "none"
    },
    paint: {
      "line-color": colors.targetStroke,
      "line-width": 1.7
    }
  });

  map.addLayer({
    id: "capital-marker",
    type: "circle",
    source: "study-capitals",
    layout: {
      visibility: "none"
    },
    paint: {
      "circle-radius": [
        "case",
        ["in", ["get", "id"], ["literal", Array.from(completed)]],
        8,
        7
      ],
      "circle-color": getCapitalFillExpression(),
      "circle-stroke-color": colors.neutralMarkerStroke,
      "circle-stroke-width": 2
    }
  });

  map.addLayer({
    id: "capital-hit",
    type: "circle",
    source: "study-capitals",
    layout: {
      visibility: "none"
    },
    paint: {
      "circle-radius": ["get", "hitRadius"],
      "circle-color": "#ffffff",
      "circle-opacity": 0.01,
      "circle-stroke-opacity": 0
    }
  });

  map.addLayer({
    id: "completed-label",
    type: "symbol",
    source: "completed-labels",
    layout: {
      visibility: "none",
      "text-field": ["get", "name"],
      "text-size": ["get", "labelFontSize"],
      "text-anchor": "top",
      "text-offset": [0, 0.7],
      "text-font": ["Open Sans Regular", "Arial Unicode MS Regular"]
    },
    paint: {
      "text-color": colors.ink,
      "text-halo-color": "#ffffff",
      "text-halo-width": 1.8
    }
  });

  ["state-fill", "capital-hit", "capital-marker"].forEach((layerId) => {
    map.on("mouseenter", layerId, () => {
      if (currentView === "study") {
        map.getCanvas().style.cursor = "pointer";
      }
    });
    map.on("mouseleave", layerId, () => {
      map.getCanvas().style.cursor = "";
    });
  });

}

function handleMapClick(event) {
  if (currentView === "overview") {
    const regionFeature = map.queryRenderedFeatures(event.point, {
      layers: ["overview-region-fill"]
    })[0];

    if (regionFeature?.properties?.id === "united-states") {
      enterUnitedStatesStudy();
    }

    return;
  }

  const pointFeature = map.queryRenderedFeatures(event.point, {
    layers: ["capital-hit", "capital-marker"]
  })[0];

  if (pointFeature) {
    handleTargetClick(pointFeature.properties.id);
    return;
  }

  const stateFeature = map.queryRenderedFeatures(event.point, {
    layers: ["state-fill"]
  })[0];

  if (stateFeature) {
    handleTargetClick(stateFeature.properties.id);
  }
}

function getCapitalGeoJson() {
  return {
    type: "FeatureCollection",
    features: activityData.features
      .filter((feature) => feature.type === "capital")
      .map((feature) => ({
        type: "Feature",
        properties: {
          id: feature.id,
          name: feature.name,
          color: feature.color,
          hitRadius: feature.hitRadius || 14,
          labelFontSize: feature.labelFontSize || 11
        },
        geometry: {
          type: "Point",
          coordinates: [feature.lon, feature.lat]
        }
      }))
  };
}

function getCompletedLabelGeoJson() {
  return {
    type: "FeatureCollection",
    features: activityData.features
      .filter((feature) => completed.has(feature.id))
      .map((feature) => ({
        type: "Feature",
        properties: {
          id: feature.id,
          name: feature.name,
          labelFontSize: feature.labelFontSize || 11
        },
        geometry: {
          type: "Point",
          coordinates: getLabelCoordinates(feature)
        }
      }))
  };
}

function getLabelCoordinates(feature) {
  if (feature.type === "state") {
    return stateLabelPositions[feature.id] || [-71.8, 42.8];
  }

  return [feature.lon, feature.lat];
}

function renderAnswerBank() {
  answerBank.innerHTML = "";

  activityData.features.forEach((feature) => {
    const chip = document.createElement("button");
    chip.className = "label-chip";
    chip.type = "button";
    chip.dataset.id = feature.id;
    chip.textContent = feature.name;
    chip.setAttribute("aria-pressed", "false");
    chip.addEventListener("click", () => toggleSelectedAnswer(feature.id));
    answerBank.appendChild(chip);
  });
}

function enterUnitedStatesStudy() {
  if (!map.isStyleLoaded()) {
    return;
  }

  currentView = "study";
  document.body.classList.remove("overview-mode");
  document.body.classList.add("study-mode");
  title.textContent = activityData.title;
  instruction.textContent = "Select a state or capital label, then click its target on the map.";
  studyCard.hidden = false;

  setOverviewVisibility("none");
  setStudyVisibility("visible");

  map.flyTo({
    center: [-98, 39],
    zoom: 3.1,
    pitch: 0,
    bearing: 0,
    duration: 1100,
    essential: true
  });

  window.setTimeout(() => {
    if (currentView === "study") {
      map.fitBounds([[-74.35, 40.85], [-66.75, 47.55]], {
        padding: { top: 55, right: 46, bottom: 78, left: 46 },
        duration: 1200,
        essential: true
      });
    }
  }, 950);
}

function returnToWorldView() {
  currentView = "overview";
  selectedAnswerId = null;
  document.body.classList.add("overview-mode");
  document.body.classList.remove("study-mode");
  title.textContent = "World View";
  instruction.textContent = "Choose a study region from the globe or the list below.";
  studyCard.hidden = true;

  clearSelectedChip();
  setOverviewVisibility("visible");
  setStudyVisibility("none");

  map.flyTo({
    center: [-18, 18],
    zoom: 1.25,
    pitch: 0,
    bearing: 0,
    duration: 1000,
    essential: true
  });
}

function setOverviewVisibility(visibility) {
  ["overview-region-fill", "overview-region-line", "overview-region-label"].forEach((layerId) => {
    if (map.getLayer(layerId)) {
      map.setLayoutProperty(layerId, "visibility", visibility);
    }
  });
}

function setStudyVisibility(visibility) {
  ["state-fill", "state-line", "capital-marker", "capital-hit", "completed-label"].forEach((layerId) => {
    if (map.getLayer(layerId)) {
      map.setLayoutProperty(layerId, "visibility", visibility);
    }
  });
}

function toggleSelectedAnswer(id) {
  if (completed.has(id)) {
    return;
  }

  if (selectedAnswerId === id) {
    clearSelectedChip();
    return;
  }

  clearSelectedChip();
  selectedAnswerId = id;
  const chip = getChip(id);

  if (chip) {
    chip.classList.add("selected");
    chip.setAttribute("aria-pressed", "true");
  }
}

function clearSelectedChip() {
  if (!selectedAnswerId) {
    return;
  }

  const chip = getChip(selectedAnswerId);

  if (chip) {
    chip.classList.remove("selected");
    chip.setAttribute("aria-pressed", "false");
  }

  selectedAnswerId = null;
}

function handleTargetClick(targetId) {
  if (currentView !== "study") {
    return;
  }

  if (!selectedAnswerId) {
    showFeedback("Select a label first.");
    return;
  }

  if (targetId !== selectedAnswerId) {
    showFeedback("Try again");
    return;
  }

  completeFeature(targetId);
}

function completeFeature(id) {
  if (completed.has(id)) {
    return;
  }

  const feature = getFeature(id);
  completed.add(id);
  clearSelectedChip();

  const chip = getChip(id);

  if (chip) {
    chip.classList.add("used");
    chip.disabled = true;
  }

  refreshStudyPaint();
  updateProgress();
  showFeedback(`Correct: ${feature.name}`, true);
}

function resetActivity() {
  completed.clear();
  clearSelectedChip();
  feedback.textContent = "";
  feedback.classList.remove("success");
  answerBank.querySelectorAll(".label-chip").forEach((chip) => {
    chip.classList.remove("used", "selected");
    chip.disabled = false;
    chip.setAttribute("aria-pressed", "false");
  });
  refreshStudyPaint();
  updateProgress();
}

function refreshStudyPaint() {
  if (!map.isStyleLoaded()) {
    return;
  }

  if (map.getLayer("state-fill")) {
    map.setPaintProperty("state-fill", "fill-color", getStateFillExpression());
  }

  if (map.getLayer("capital-marker")) {
    map.setPaintProperty("capital-marker", "circle-color", getCapitalFillExpression());
    map.setPaintProperty("capital-marker", "circle-radius", [
      "case",
      ["in", ["get", "id"], ["literal", Array.from(completed)]],
      8,
      7
    ]);
  }

  const labelSource = map.getSource("completed-labels");

  if (labelSource) {
    labelSource.setData(getCompletedLabelGeoJson());
  }
}

function getStateFillExpression() {
  return [
    "case",
    ["in", ["get", "id"], ["literal", Array.from(completed)]],
    ["match", ["get", "id"], ...getColorMatchStops(), colors.stateFill],
    colors.stateFill
  ];
}

function getCapitalFillExpression() {
  return [
    "case",
    ["in", ["get", "id"], ["literal", Array.from(completed)]],
    ["match", ["get", "id"], ...getColorMatchStops(), colors.neutralMarker],
    colors.neutralMarker
  ];
}

function getColorMatchStops() {
  return activityData.features.flatMap((feature) => [feature.id, feature.color]);
}

function updateProgress() {
  progress.textContent = `${completed.size} of ${activityData.features.length} completed`;
}

function getFeature(id) {
  return activityData.features.find((feature) => feature.id === id);
}

function getChip(id) {
  return answerBank.querySelector(`[data-id="${id}"]`);
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
