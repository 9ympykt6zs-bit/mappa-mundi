const fallbackMapData = {
  id: "western-european-countries",
  title: "Western European Countries",
  features: [
    {
      id: "ireland",
      name: "Ireland",
      color: "#22c55e",
      flag: "🇮🇪",
      flagType: "ireland",
      labelPosition: { x: 496, y: 501 },
      flagOffset: { x: -23, y: -7 },
      labelFontSize: 13,
      flagSize: 0.56,
      labelRotation: 0
    },
    {
      id: "united-kingdom",
      name: "United Kingdom",
      color: "#ef4444",
      flag: "🇬🇧",
      flagType: "uk-svg",
      labelPosition: { x: 566, y: 481 },
      flagOffset: { x: -23, y: -7 },
      labelFontSize: 13,
      flagSize: 0.56,
      labelRotation: 0
    },
    {
      id: "portugal",
      name: "Portugal",
      color: "#f97316",
      flag: "🇵🇹",
      flagType: "portugal",
      labelPosition: { x: 416, y: 674 },
      flagOffset: { x: -23, y: -7 },
      labelFontSize: 13,
      flagSize: 0.56,
      labelRotation: 0
    },
    {
      id: "spain",
      name: "Spain",
      color: "#eab308",
      flag: "🇪🇸",
      flagType: "spain",
      labelPosition: { x: 500, y: 657 },
      flagOffset: { x: -23, y: -7 },
      labelFontSize: 13,
      flagSize: 0.56,
      labelRotation: 0
    },
    {
      id: "france",
      name: "France",
      color: "#3b82f6",
      flag: "🇫🇷",
      flagType: "france",
      labelPosition: { x: 572, y: 598 },
      flagOffset: { x: -23, y: -7 },
      labelFontSize: 13,
      flagSize: 0.56,
      labelRotation: 0
    }
  ]
};

const fallbackActivityData = {
  "western-european-countries": fallbackMapData,
  "european-cities": {
    id: "european-cities",
    title: "European Cities",
    baseMap: "europe-base",
    targetNoun: "city",
    features: [
      {
        id: "london",
        name: "London",
        type: "city",
        shape: "circle",
        lon: -0.1276,
        lat: 51.5072,
        hitRadius: 14,
        color: "#4f83cc",
        icon: "big-ben",
        iconScale: 1.4,
        labelOffset: { x: -18, y: 13 },
        iconOffset: { x: 0, y: 0 },
        labelFontSize: 11,
        labelRotation: 0
      },
      {
        id: "paris",
        name: "Paris",
        type: "city",
        shape: "circle",
        lon: 2.3522,
        lat: 48.8566,
        hitRadius: 14,
        color: "#d65a8c",
        icon: "eiffel-tower",
        iconScale: 1.4,
        labelOffset: { x: -14, y: 14 },
        iconOffset: { x: 0, y: 0 },
        labelFontSize: 11,
        labelRotation: 0
      },
      {
        id: "rome",
        name: "Rome",
        type: "city",
        shape: "circle",
        lon: 12.4964,
        lat: 41.9028,
        hitRadius: 14,
        color: "#d9b48f",
        icon: "colosseum",
        iconScale: 1.4,
        labelOffset: { x: -13, y: 14 },
        iconOffset: { x: 0, y: 0 },
        labelFontSize: 11,
        labelRotation: 0
      },
      {
        id: "barcelona",
        name: "Barcelona",
        type: "city",
        shape: "circle",
        lon: 2.1734,
        lat: 41.3851,
        hitRadius: 14,
        color: "#7aa35a",
        icon: "sagrada-familia",
        iconScale: 1.4,
        labelOffset: { x: -28, y: 14 },
        iconOffset: { x: 0, y: 0 },
        labelFontSize: 11,
        labelRotation: 0
      },
      {
        id: "orleans",
        name: "Orleans",
        type: "city",
        shape: "circle",
        lon: 1.9093,
        lat: 47.9029,
        hitRadius: 14,
        color: "#7a5aa6",
        icon: "cathedral",
        iconScale: 1.4,
        labelOffset: { x: -18, y: 14 },
        iconOffset: { x: 0, y: 0 },
        labelFontSize: 11,
        labelRotation: 0
      }
    ]
  },
  "world-map": {
    id: "world-map",
    title: "World Map",
    baseMap: "world-map",
    baseMapPath: "assets/maps/world/world-map.svg",
    projection: {
      type: "equirectangular",
      lon0: 0,
      lat0: 0,
      scaleX: 4,
      scaleY: -4,
      translateX: 720,
      translateY: 360
    },
    hideAnswerBank: true,
    features: []
  },
  "us-states": {
    id: "us-states",
    title: "United States",
    baseMap: "usa",
    baseMapPath: "assets/maps/usa.svg",
    projection: {
      type: "albers-usa"
    },
    targetNoun: "state",
    defaultMode: "click-reveal",
    hideAnswerBank: true,
    features: []
  },
  "us-states-capitals-01": {
    id: "us-states-capitals-01",
    title: "States and Capitals 1",
    baseMap: "usa-map",
    baseMapPath: "assets/maps/usa/usa-map.svg",
    projection: {
      type: "albers-usa"
    },
    targetNoun: "state or capital",
    features: []
  }
};

const activities = [
  {
    id: "western-european-countries",
    dataPath: "assets/maps/data/western-european-countries.json"
  },
  {
    id: "european-cities",
    dataPath: "assets/maps/data/european-cities.json"
  },
  {
    id: "world-map",
    dataPath: "assets/maps/world/world-map.json"
  },
  {
    id: "us-states",
    dataPath: "assets/maps/data/us-states.json"
  },
  {
    id: "us-states-capitals-01",
    dataPath: "assets/maps/data/us-states-capitals-01.json"
  }
];

const appModes = {
  overview: "overview",
  study: "study"
};

const regionOptions = [
  {
    id: "continents-oceans",
    label: "Continents / Oceans",
    activityId: "world-map",
    bounds: { west: -180, east: 180, north: 82, south: -60 }
  },
  {
    id: "western-europe",
    label: "Western Europe",
    activityId: "western-european-countries",
    bounds: { west: -13, east: 12, north: 58, south: 36 }
  },
  {
    id: "european-cities",
    label: "European Cities",
    activityId: "european-cities",
    bounds: { west: -8, east: 18, north: 54, south: 39 }
  },
  {
    id: "united-states",
    label: "United States",
    activityId: "us-states-capitals-01",
    bounds: { west: -127, east: -65, north: 51, south: 23 }
  }
];

const svgNamespace = "http://www.w3.org/2000/svg";
const defaultLabelFontSize = 13;
const defaultCityLabelFontSize = 11;
const defaultFlagSize = 0.56;
const defaultIconSize = 0.58;
const defaultCityIconScale = 1.4;
const landmarkIconWidth = 28;
const landmarkIconHeight = 30;
const defaultLabelRotation = 0;
const completedActivitiesStorageKey = "geography-memory-completed-activities";
const mapSettingsStoragePrefix = "geography-memory-map-settings:";
const baseMapCalibrationStoragePrefix = "geography-memory-base-map-calibration:";
const europeBaseMapId = "europe-base";
const defaultEuropeCalibration = {
  translateX: 0,
  translateY: 0,
  scaleX: 1,
  scaleY: 1,
  rotation: 0
};
const worldProjection = {
  type: "equirectangular",
  lon0: 0,
  lat0: 0,
  scaleX: 4,
  scaleY: -4,
  translateX: 720,
  translateY: 360
};
// Keep this projection in sync with assets/maps/svg/europe-base.svg. The SVG country
// paths, graticule, and lon/lat feature placement are generated from these same values.
const europeProjection = {
  type: "lambert-conformal-conic",
  lon0: 20,
  lat0: 52,
  standardParallel1: 35,
  standardParallel2: 65,
  scaleX: 766.8414462241053,
  scaleY: -766.8414462241053,
  translateX: 717.1061675097509,
  translateY: 548.1411803237977,
  graticule: {
    west: -30,
    east: 70,
    south: 30,
    north: 70,
    step: 10,
    segmentStep: 1
  }
};

const mapSvg = document.querySelector("#map-svg");
const activityTitle = document.querySelector("#activity-title");
const backgroundLayer = document.querySelector("#map-background-layer");
const waterShadingLayer = document.querySelector("#water-shading-layer");
const graticuleLayer = document.querySelector("#graticule-layer");
const contextLayer = document.querySelector("#context-layer");
const countryLayer = document.querySelector("#country-layer");
const labelLayer = document.querySelector("#label-layer");
const debugOverlayLayer = document.querySelector("#debug-overlay-layer");
const overviewRegionLayer = document.querySelector("#overview-region-layer");
const answerBank = document.querySelector("#answer-bank");
const activityButtons = document.querySelectorAll("[data-activity]");
const worldViewButtons = document.querySelectorAll("[data-world-view], #world-view-button");
const regionButtons = document.querySelectorAll("[data-region]");
const instructionText = document.querySelector("#instruction-text");
const answerPanelTitle = document.querySelector("#answer-panel-title");
const progressText = document.querySelector("#progress");
const feedback = document.querySelector("#feedback");
const resetButton = document.querySelector("#reset-button");
const homeButton = document.querySelector("#home-button");
const previousActivityButton = document.querySelector("#previous-activity-button");
const nextIncompleteButton = document.querySelector("#next-incomplete-button");
const zoomInButton = document.querySelector("#zoom-in");
const zoomOutButton = document.querySelector("#zoom-out");
const fitMapButton = document.querySelector("#fit-map");
const modeToggle = document.querySelector(".mode-toggle");
const modeButtons = document.querySelectorAll("[data-mode]");
const debugToggle = document.querySelector("#debug-toggle");
const tuningToggle = document.querySelector("#tuning-toggle");
const debugTools = document.querySelector("#debug-tools");
const tuningTools = document.querySelector("#tuning-tools");
const tuningControls = document.querySelector("#tuning-controls");
const copyMapSettingsButton = document.querySelector("#copy-map-settings");
const undoTuningButton = document.querySelector("#undo-tuning");
const waterOpacityInput = document.querySelector("#water-opacity");
const calibrationTranslateXInput = document.querySelector("#calibration-translate-x");
const calibrationTranslateYInput = document.querySelector("#calibration-translate-y");
const calibrationScaleXInput = document.querySelector("#calibration-scale-x");
const calibrationScaleYInput = document.querySelector("#calibration-scale-y");
const calibrationRotationInput = document.querySelector("#calibration-rotation");
const resetCalibrationButton = document.querySelector("#reset-calibration");
const copyCalibrationButton = document.querySelector("#copy-calibration");
const coordinateReadout = document.querySelector("#coordinate-readout");
const hoverReadout = document.querySelector("#hover-readout");
const clickedPointsList = document.querySelector("#clicked-points");
const copyPointsButton = document.querySelector("#copy-points");

const completed = new Set();
const completedActivityIds = loadCompletedActivityIds();
const clickedPoints = [];
const modes = {
  wordBank: "word-bank",
  clickReveal: "click-reveal"
};
let feedbackTimer;
let mapData = fallbackMapData;
let currentActivityId = activities.find((activity) => activity.id === "us-states-capitals-01")?.id || activities[0].id;
let appMode = appModes.overview;
let selectedRegionId = null;
let baseViewBox = null;
let currentViewBox = null;
let currentZoomLevel = 0;
let mapPanDrag = null;
let selectedAnswerId = null;
let flagClipCounter = 0;
let countryPathTemplates = new Map();
let currentMode = modes.wordBank;
let isTuningMode = false;
let tuningDrag = null;
let tuningUndoStack = [];
let pendingTuningUndoState = null;
let activeTuningEdit = false;
let europeCalibration = { ...defaultEuropeCalibration };

async function loadMapData(activityId = currentActivityId) {
  const activity = getActivity(activityId);

  try {
    const response = await fetch(activity.dataPath);
    if (!response.ok) {
      throw new Error("Map data could not be loaded.");
    }
    mapData = await response.json();
  } catch {
    mapData = fallbackActivityData[activityId] || fallbackMapData;
  }

  normalizeFeatureSettings();
}

function getBaseMapPath() {
  if (mapData?.baseMapPath) {
    return mapData.baseMapPath;
  }

  if (mapData?.baseMap) {
    return `assets/maps/svg/${mapData.baseMap}.svg`;
  }

  return "assets/maps/svg/europe-base.svg";
}

function parseViewBox(viewBox) {
  if (!viewBox) {
    return null;
  }

  const values = viewBox.split(/\s+/).map(Number);

  if (values.length !== 4 || values.some((value) => !Number.isFinite(value))) {
    return null;
  }

  return {
    x: values[0],
    y: values[1],
    width: values[2],
    height: values[3]
  };
}

function formatViewBox(viewBox) {
  return `${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`;
}

function setMapViewBox(viewBox) {
  currentViewBox = { ...viewBox };
  mapSvg.setAttribute("viewBox", formatViewBox(currentViewBox));
  updateLodLevel();
}

function getActivity(activityId) {
  return activities.find((activity) => activity.id === activityId) || activities[0];
}

function getPreviousActivityId(activityId) {
  const currentIndex = activities.findIndex((activity) => activity.id === activityId);
  return currentIndex > 0 ? activities[currentIndex - 1].id : null;
}

function getNextIncompleteActivityId(activityId) {
  const currentIndex = activities.findIndex((activity) => activity.id === activityId);
  const availableActivities = activities.filter((activity) => {
    const activityData = fallbackActivityData[activity.id];
    const featureCount = activityData?.features?.length ?? 1;
    return featureCount > 0;
  });
  const availableIds = availableActivities.map((activity) => activity.id);
  const availableCurrentIndex = availableIds.indexOf(activityId);

  if (availableCurrentIndex === -1) {
    return null;
  }

  for (let offset = 1; offset < availableIds.length; offset += 1) {
    const nextIndex = (availableCurrentIndex + offset) % availableIds.length;
    const nextId = availableIds[nextIndex];

    if (!completedActivityIds.has(nextId)) {
      return nextId;
    }
  }

  return null;
}

function loadCompletedActivityIds() {
  try {
    const saved = JSON.parse(localStorage.getItem(completedActivitiesStorageKey) || "[]");
    return new Set(Array.isArray(saved) ? saved : []);
  } catch {
    return new Set();
  }
}

function saveCompletedActivityIds() {
  try {
    localStorage.setItem(completedActivitiesStorageKey, JSON.stringify([...completedActivityIds]));
  } catch {
    // Ignore storage failures to keep the app usable offline or in private browsing.
  }
}

function setActivityCompletedState(activityId, isComplete) {
  if (!activityId) {
    return;
  }

  if (isComplete) {
    completedActivityIds.add(activityId);
  } else {
    completedActivityIds.delete(activityId);
  }

  saveCompletedActivityIds();
  updateActivityNavigationControls();
}

function getInitialActivityFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const requestedActivityId = params.get("activity");

  if (!requestedActivityId) {
    return null;
  }

  return activities.some((activity) => activity.id === requestedActivityId) ? requestedActivityId : null;
}

function getTargetNoun() {
  if (mapData.targetNoun) {
    return mapData.targetNoun;
  }

  return mapData.features.every(isPointFeature) ? "city" : "country";
}

function isPointFeature(feature) {
  return feature?.type === "city" || feature?.type === "capital" || feature?.shape === "circle";
}

function getActiveProjection() {
  if (mapData?.projection) {
    return mapData.projection;
  }

  if (mapData?.baseMap === "world-map") {
    return worldProjection;
  }

  return europeProjection;
}

function toRadians(value) {
  return (value * Math.PI) / 180;
}

function toDegrees(value) {
  return (value * 180) / Math.PI;
}

function getProjectionConstants(projection = europeProjection) {
  const phi1 = toRadians(projection.standardParallel1);
  const phi2 = toRadians(projection.standardParallel2);
  const phi0 = toRadians(projection.lat0);
  const n = Math.log(Math.cos(phi1) / Math.cos(phi2)) /
    Math.log(Math.tan(Math.PI / 4 + phi2 / 2) / Math.tan(Math.PI / 4 + phi1 / 2));
  const f = (Math.cos(phi1) * Math.pow(Math.tan(Math.PI / 4 + phi1 / 2), n)) / n;
  const rho0 = f / Math.pow(Math.tan(Math.PI / 4 + phi0 / 2), n);

  return { n, f, rho0 };
}

function getAlbersUsaRegionProjection(projection, lon, lat) {
  if (!projection?.regions) {
    return null;
  }

  if (lat >= 50 && lon <= -130) {
    return projection.regions.alaska || projection.regions.lower48 || null;
  }

  if (lat >= 18 && lat <= 23.5 && lon <= -154 && lon >= -162) {
    return projection.regions.hawaii || projection.regions.lower48 || null;
  }

  return projection.regions.lower48 || null;
}

function projectConicPoint(lon, lat, projection) {
  const { n, f, rho0 } = getProjectionConstants(projection);
  const lambda = toRadians(lon);
  const lambda0 = toRadians(projection.lon0);
  const phi = toRadians(lat);
  const theta = n * (lambda - lambda0);
  const rho = f / Math.pow(Math.tan(Math.PI / 4 + phi / 2), n);
  const rawX = rho * Math.sin(theta);
  const rawY = rho0 - rho * Math.cos(theta);

  return {
    x: rawX * projection.scaleX + projection.translateX,
    y: rawY * projection.scaleY + projection.translateY
  };
}

function invertConicPoint(x, y, projection) {
  const { n, f, rho0 } = getProjectionConstants(projection);
  const rawX = (x - projection.translateX) / projection.scaleX;
  const rawY = (y - projection.translateY) / projection.scaleY;
  const theta = Math.atan2(rawX, rho0 - rawY);
  const rho = Math.sqrt(rawX * rawX + (rho0 - rawY) * (rho0 - rawY));

  if (!Number.isFinite(theta) || !Number.isFinite(rho) || rho === 0) {
    return null;
  }

  const lon = projection.lon0 + toDegrees(theta / n);
  const lat = toDegrees(2 * Math.atan(Math.pow(f / rho, 1 / n)) - Math.PI / 2);

  return {
    lon: Number(lon.toFixed(4)),
    lat: Number(lat.toFixed(4))
  };
}

function getAlbersUsaD3Region(lon, lat) {
  if (lat >= 50 && lon <= -125) {
    return {
      rotate: 154,
      center: [-2, 58.5],
      parallels: [55, 65],
      scaleMultiplier: 0.35,
      translateOffset: [-0.307, 0.201]
    };
  }

  if (lat >= 18 && lat <= 23.5 && lon >= -162 && lon <= -154) {
    return {
      rotate: 157,
      center: [-3, 19.9],
      parallels: [8, 18],
      scaleMultiplier: 1,
      translateOffset: [-0.205, 0.212]
    };
  }

  return {
    rotate: 96,
    center: [-0.6, 38.7],
    parallels: [29.5, 45.5],
    scaleMultiplier: 1,
    translateOffset: [0, 0]
  };
}

function getAlbersEqualAreaRaw(parallels) {
  const phi1 = toRadians(parallels[0]);
  const phi2 = toRadians(parallels[1]);
  const n = 0.5 * (Math.sin(phi1) + Math.sin(phi2));
  const c = Math.cos(phi1) ** 2 + 2 * n * Math.sin(phi1);

  return (lambda, phi) => {
    const rho = Math.sqrt(Math.max(0, c - 2 * n * Math.sin(phi))) / n;
    return {
      x: rho * Math.sin(lambda * n),
      y: -rho * Math.cos(lambda * n)
    };
  };
}

function projectAlbersUsaD3Point(lon, lat, projection) {
  const scale = projection.scale || 1300;
  const translateX = projection.translateX ?? 487.5;
  const translateY = projection.translateY ?? 305;
  const region = getAlbersUsaD3Region(lon, lat);
  const raw = getAlbersEqualAreaRaw(region.parallels);
  const center = raw(toRadians(region.center[0]), toRadians(region.center[1]));
  const point = raw(toRadians(lon + region.rotate), toRadians(lat));
  const regionScale = scale * region.scaleMultiplier;

  return {
    x: (point.x - center.x) * regionScale + translateX + region.translateOffset[0] * scale,
    y: translateY + region.translateOffset[1] * scale - (point.y - center.y) * regionScale
  };
}

function getCalibrationCenter() {
  return {
    x: 120 + 1185 / 2,
    y: 180 + 670 / 2
  };
}

function normalizeCalibration(calibration = {}) {
  return {
    translateX: Number.isFinite(calibration.translateX) ? calibration.translateX : defaultEuropeCalibration.translateX,
    translateY: Number.isFinite(calibration.translateY) ? calibration.translateY : defaultEuropeCalibration.translateY,
    scaleX: Number.isFinite(calibration.scaleX) && calibration.scaleX !== 0 ? calibration.scaleX : defaultEuropeCalibration.scaleX,
    scaleY: Number.isFinite(calibration.scaleY) && calibration.scaleY !== 0 ? calibration.scaleY : defaultEuropeCalibration.scaleY,
    rotation: Number.isFinite(calibration.rotation) ? calibration.rotation : defaultEuropeCalibration.rotation
  };
}

function getBaseMapCalibrationKey() {
  return `${baseMapCalibrationStoragePrefix}${europeBaseMapId}`;
}

function loadEuropeCalibration() {
  try {
    const savedCalibration = localStorage.getItem(getBaseMapCalibrationKey());

    if (savedCalibration) {
      europeCalibration = normalizeCalibration(JSON.parse(savedCalibration));
    }
  } catch {
    europeCalibration = { ...defaultEuropeCalibration };
  }

  updateCalibrationControls();
}

function saveEuropeCalibration() {
  try {
    localStorage.setItem(getBaseMapCalibrationKey(), JSON.stringify(europeCalibration));
  } catch {
    showFeedback("Calibration could not be saved locally.");
  }
}

function getEuropeCalibrationSettings() {
  return { ...europeCalibration };
}

function setEuropeCalibration(calibration, options = {}) {
  const { save = true } = options;
  europeCalibration = normalizeCalibration(calibration);
  updateCoordinateFeaturePositions();
  renderProjectionOverlays();
  updateCalibrationControls();

  if (isTuningMode) {
    renderTuningMap();
  } else if (getActivityTargetType() === "city") {
    countryLayer.querySelectorAll(".city-target").forEach((targetElement) => {
      const feature = getFeature(targetElement.id);

      if (feature) {
        updateCityTargetElement(targetElement, feature);
      }
    });
  }

  if (save) {
    saveEuropeCalibration();
  }
}

function resetEuropeCalibration() {
  pushTuningUndoState(getTuningSnapshot());
  setEuropeCalibration(defaultEuropeCalibration);
  showFeedback("Calibration reset", true);
}

function applyEuropeCalibration(point) {
  const center = getCalibrationCenter();
  const rotation = toRadians(europeCalibration.rotation || 0);
  const cos = Math.cos(rotation);
  const sin = Math.sin(rotation);
  const scaledX = (point.x - center.x) * (europeCalibration.scaleX || 1);
  const scaledY = (point.y - center.y) * (europeCalibration.scaleY || 1);

  return {
    x: Math.round(center.x + scaledX * cos - scaledY * sin + (europeCalibration.translateX || 0)),
    y: Math.round(center.y + scaledX * sin + scaledY * cos + (europeCalibration.translateY || 0))
  };
}

function removeEuropeCalibration(point) {
  const center = getCalibrationCenter();
  const rotation = -toRadians(europeCalibration.rotation || 0);
  const cos = Math.cos(rotation);
  const sin = Math.sin(rotation);
  const translatedX = point.x - (europeCalibration.translateX || 0) - center.x;
  const translatedY = point.y - (europeCalibration.translateY || 0) - center.y;
  const rotatedX = translatedX * cos - translatedY * sin;
  const rotatedY = translatedX * sin + translatedY * cos;

  return {
    x: center.x + rotatedX / (europeCalibration.scaleX || 1),
    y: center.y + rotatedY / (europeCalibration.scaleY || 1)
  };
}

function projectLonLatRaw(lon, lat, projection = getActiveProjection()) {
  if (!Number.isFinite(lon) || !Number.isFinite(lat)) {
    return null;
  }

  if (projection.type === "equirectangular") {
    return {
      x: lon * projection.scaleX + projection.translateX,
      y: lat * projection.scaleY + projection.translateY
    };
  }

  if (projection.type === "albers-usa-d3") {
    return projectAlbersUsaD3Point(lon, lat, projection);
  }

  if (projection.type === "albers-usa") {
    const regionProjection = getAlbersUsaRegionProjection(projection, lon, lat);

    if (!regionProjection) {
      return null;
    }

    return projectConicPoint(lon, lat, regionProjection);
  }

  return projectConicPoint(lon, lat, projection);
}

function projectLonLat(lon, lat) {
  const projection = getActiveProjection();
  const projectedPoint = projectLonLatRaw(lon, lat, projection);

  if (!projectedPoint) {
    return null;
  }

  if (projection.type === "lambert-conformal-conic") {
    return {
      x: Math.round(applyEuropeCalibration(projectedPoint).x),
      y: Math.round(applyEuropeCalibration(projectedPoint).y)
    };
  }

  return {
    x: Math.round(projectedPoint.x),
    y: Math.round(projectedPoint.y)
  };
}

function invertProjectedPoint(x, y) {
  if (!Number.isFinite(x) || !Number.isFinite(y)) {
    return null;
  }

  const projection = getActiveProjection();

  if (projection.type === "equirectangular") {
    return {
      lon: Number(((x - projection.translateX) / projection.scaleX).toFixed(4)),
      lat: Number(((y - projection.translateY) / projection.scaleY).toFixed(4))
    };
  }

  if (projection.type === "albers-usa") {
    for (const regionName of ["lower48", "alaska", "hawaii"]) {
      const regionProjection = projection.regions?.[regionName];

      if (!regionProjection) {
        continue;
      }

      const inverse = invertConicPoint(x, y, regionProjection);

      if (!inverse) {
        continue;
      }

      const { lon, lat } = inverse;

      if (regionName === "alaska" && (lat < 49 || lon > -130)) {
        continue;
      }

      if (regionName === "hawaii" && (lat > 30 || lon < -162 || lon > -154)) {
        continue;
      }

      if (regionName === "lower48" && (lat < 24 || lon < -130 || lon > -65)) {
        continue;
      }

      return inverse;
    }

    return null;
  }

  if (projection.type === "albers-usa-d3") {
    return null;
  }

  const uncalibratedPoint = removeEuropeCalibration({ x, y });
  const inverse = invertConicPoint(uncalibratedPoint.x, uncalibratedPoint.y, projection);

  if (!inverse) {
    return null;
  }

  return inverse;
}

function getPointProjectedPoint(feature) {
  return projectLonLat(feature.lon, feature.lat);
}

function getPointAnchorPoint(feature) {
  const projectedPoint = getPointProjectedPoint(feature);

  return {
    x: projectedPoint?.x ?? feature.x ?? feature.cx ?? 0,
    y: projectedPoint?.y ?? feature.y ?? feature.cy ?? 0
  };
}

function getCityProjectedPoint(feature) {
  return getPointProjectedPoint(feature);
}

function getCityAnchorPoint(feature) {
  return getPointAnchorPoint(feature);
}

function getFeatureCenter(feature) {
  if (isPointFeature(feature)) {
    return getPointAnchorPoint(feature);
  }

  return { x: 0, y: 0 };
}

function normalizeFeatureSettings() {
  mapData.features.forEach((feature) => {
    feature.labelFontSize ??= isPointFeature(feature) ? defaultCityLabelFontSize : defaultLabelFontSize;
    feature.labelRotation ??= defaultLabelRotation;

    if (isPointFeature(feature)) {
      const projectedPoint = getPointProjectedPoint(feature);
      const targetCenter = projectedPoint || getFeatureCenter(feature);
      feature.x = targetCenter.x;
      feature.y = targetCenter.y;
      feature.hitRadius ??= feature.r ?? 14;
      feature.iconScale ??= feature.iconSize ? Number((feature.iconSize / defaultIconSize * defaultCityIconScale).toFixed(2)) : defaultCityIconScale;
      feature.iconOffset ||= { x: 0, y: 0 };

      if (feature.labelOffset) {
        feature.labelDx ??= Math.round(feature.labelOffset.x ?? -18);
        feature.labelDy ??= Math.round(feature.labelOffset.y ?? 13);
      }

      if (feature.labelPosition) {
        feature.labelDx ??= Math.round(feature.labelPosition.x - feature.x);
        feature.labelDy ??= Math.round(feature.labelPosition.y - feature.y);
      }

      feature.labelDx ??= -18;
      feature.labelDy ??= 13;
      feature.labelOffset = {
        x: Math.round(feature.labelDx),
        y: Math.round(feature.labelDy)
      };
    } else {
      const targetCenter = getFeatureCenter(feature);
      feature.labelPosition ||= { x: targetCenter.x, y: targetCenter.y };
      feature.flagOffset ||= { x: -23, y: -7 };
      feature.flagSize ??= defaultFlagSize;
    }
  });

  applySavedMapSettings();
  updateCoordinateFeaturePositions();
}

function updateCoordinateFeaturePositions() {
  mapData.features.forEach((feature) => {
    if (!isPointFeature(feature) || !Number.isFinite(feature.lon) || !Number.isFinite(feature.lat)) {
      return;
    }

    const projectedPoint = getPointProjectedPoint(feature);

    if (!projectedPoint) {
      return;
    }

    feature.x = projectedPoint.x;
    feature.y = projectedPoint.y;
  });
}

function getMapSettingsKey() {
  return `${mapSettingsStoragePrefix}${mapData.id}`;
}

function applySavedMapSettings() {
  try {
    const savedSettings = localStorage.getItem(getMapSettingsKey());

    if (!savedSettings) {
      return;
    }

    applyMapSettings(JSON.parse(savedSettings));
  } catch {
    // Ignore malformed local tuning state and keep the checked-in map data.
  }
}

function saveCurrentMapSettings() {
  if (!isTuningMode) {
    return;
  }

  try {
    localStorage.setItem(getMapSettingsKey(), JSON.stringify(getMapSettings()));
  } catch {
    showFeedback("Map settings could not be saved locally.");
  }
}

function applyMapSettings(settings) {
  if (!settings) {
    return;
  }

  if (settings.calibration) {
    europeCalibration = normalizeCalibration(settings.calibration);
    updateCalibrationControls();
    saveEuropeCalibration();
  }

  if (!settings.features) {
    updateCoordinateFeaturePositions();
    renderProjectionOverlays();
    return;
  }

  settings.features.forEach((featureSettings) => {
    const feature = getFeature(featureSettings.id);

    if (feature) {
      applyFeatureSettings(feature, featureSettings);
    }
  });

  if (Number.isFinite(settings.waterOpacity)) {
    waterOpacityInput.value = settings.waterOpacity;
    updateWaterOpacity();
  }

  updateCoordinateFeaturePositions();
  renderProjectionOverlays();
}

function applyFeatureSettings(feature, settings) {
  if (isPointFeature(feature)) {
    if (!Number.isFinite(feature.lon) || !Number.isFinite(feature.lat)) {
      feature.x = settings.x ?? feature.x;
      feature.y = settings.y ?? feature.y;
    }
    feature.hitRadius = settings.hitRadius ?? feature.hitRadius;
    feature.iconScale = settings.iconScale ?? feature.iconScale;
    feature.iconOffset = settings.iconOffset ? { ...settings.iconOffset } : (feature.iconOffset || { x: 0, y: 0 });
    feature.labelDx = settings.labelDx ?? settings.labelOffset?.x ?? feature.labelDx;
    feature.labelDy = settings.labelDy ?? settings.labelOffset?.y ?? feature.labelDy;
    feature.labelOffset = {
      x: Math.round(feature.labelDx),
      y: Math.round(feature.labelDy)
    };
  } else if (feature.type === "state") {
    if (settings.labelPosition) {
      feature.labelPosition = { ...settings.labelPosition };
    }
    feature.labelFontSize = settings.labelFontSize ?? feature.labelFontSize;
    feature.labelRotation = settings.labelRotation ?? feature.labelRotation ?? defaultLabelRotation;
  } else {
    if (settings.labelPosition) {
      feature.labelPosition = { ...settings.labelPosition };
    }
    if (settings.flagOffset) {
      feature.flagOffset = { ...settings.flagOffset };
    }
    feature.flagSize = settings.flagSize ?? feature.flagSize;
  }

  feature.labelFontSize = settings.labelFontSize ?? feature.labelFontSize;
  feature.labelRotation = settings.labelRotation ?? feature.labelRotation ?? defaultLabelRotation;
}

async function loadBaseMap() {
  backgroundLayer.replaceChildren();
  graticuleLayer.replaceChildren();
  contextLayer.replaceChildren();
  countryLayer.replaceChildren();
  countryPathTemplates = new Map();

  const response = await fetch(getBaseMapPath());

  if (!response.ok) {
    throw new Error("Country SVG could not be loaded.");
  }

  const svgText = await response.text();
  const svgDocument = new DOMParser().parseFromString(svgText, "image/svg+xml");
  const viewBox = svgDocument.documentElement.getAttribute("viewBox");
  const parsedViewBox = parseViewBox(viewBox);
  const background = svgDocument.querySelector(".map-background");
  const contextPaths = svgDocument.querySelectorAll(".context-path");
  const countryPaths = svgDocument.querySelectorAll(".country-path");

  if (parsedViewBox) {
    baseViewBox = parsedViewBox;
    setMapViewBox(baseViewBox);
  }

  if (background) {
    backgroundLayer.appendChild(document.importNode(background, true));
  }

  contextPaths.forEach((path) => {
    const importedPath = document.importNode(path, true);
    if (importedPath.id) {
      importedPath.id = `context-${importedPath.id}`;
    }
    contextLayer.appendChild(importedPath);
  });

  countryPaths.forEach((path) => {
    const importedPath = document.importNode(path, true);
    countryPathTemplates.set(importedPath.id, importedPath);
  });
}

function renderProjectionOverlays() {
  const projection = getActiveProjection();
  const showEuropeOverlays = projection.type === "lambert-conformal-conic";

  waterShadingLayer.hidden = !showEuropeOverlays;

  if (showEuropeOverlays) {
    renderGraticule();
  } else {
    graticuleLayer.replaceChildren();
  }

  renderDebugOverlay();
}

function renderGraticule() {
  graticuleLayer.replaceChildren();

  const { west, east, south, north, step, segmentStep } = europeProjection.graticule;

  for (let lon = west; lon <= east; lon += step) {
    const path = document.createElementNS(svgNamespace, "path");
    path.classList.add("graticule-line");
    path.setAttribute("d", buildProjectedLine((lat) => ({ lon, lat }), south, north, segmentStep));
    graticuleLayer.appendChild(path);
    appendGraticuleLabel(projectLonLat(lon, north), `${lon}°`, 6, -6);
  }

  for (let lat = south; lat <= north; lat += step) {
    const path = document.createElementNS(svgNamespace, "path");
    path.classList.add("graticule-line");
    path.setAttribute("d", buildProjectedLine((lon) => ({ lon, lat }), west, east, segmentStep));
    graticuleLayer.appendChild(path);
    appendGraticuleLabel(projectLonLat(west, lat), `${lat}°`, 8, -3);
  }
}

function buildProjectedLine(createLonLat, start, end, increment) {
  const commands = [];

  for (let value = start; value <= end; value += increment) {
    const lonLat = createLonLat(value);
    const point = projectLonLat(lonLat.lon, lonLat.lat);

    if (!point) {
      continue;
    }

    commands.push(`${commands.length === 0 ? "M" : "L"} ${point.x} ${point.y}`);
  }

  return commands.join(" ");
}

function appendGraticuleLabel(point, textValue, dx, dy) {
  if (!point) {
    return;
  }

  const label = document.createElementNS(svgNamespace, "text");
  label.classList.add("graticule-label");
  label.setAttribute("x", point.x + dx);
  label.setAttribute("y", point.y + dy);
  label.textContent = textValue;
  graticuleLayer.appendChild(label);
}

function renderDebugOverlay() {
  debugOverlayLayer.replaceChildren();

  mapData.features.forEach((feature) => {
    if (!isPointFeature(feature) || !Number.isFinite(feature.lon) || !Number.isFinite(feature.lat)) {
      return;
    }

    const projectedPoint = getPointProjectedPoint(feature);

    if (!projectedPoint) {
      return;
    }

    const marker = document.createElementNS(svgNamespace, "circle");
    marker.classList.add("debug-city-point");
    marker.setAttribute("cx", projectedPoint.x);
    marker.setAttribute("cy", projectedPoint.y);
    marker.setAttribute("r", "3.5");
    debugOverlayLayer.appendChild(marker);

    const label = document.createElementNS(svgNamespace, "text");
    label.classList.add("debug-city-point-label");
    label.setAttribute("x", projectedPoint.x + 6);
    label.setAttribute("y", projectedPoint.y - 6);
    label.textContent = feature.id;
    debugOverlayLayer.appendChild(label);
  });
}

function getFeature(id) {
  return mapData.features.find((feature) => feature.id === id);
}

function renderActivity() {
  appMode = appModes.study;
  document.body.classList.toggle("overview-mode", false);
  document.body.classList.toggle("study-mode", true);
  activityTitle.textContent = mapData.title;
  mapSvg.setAttribute("aria-label", `${mapData.title} map`);
  renderActivityMenu();
  overviewRegionLayer.replaceChildren();
  renderMode();
  renderActivityTargets();
  renderProjectionOverlays();
  renderAnswerBank();
  resetMap();

  if (isTuningMode) {
    renderTuningControls();
    renderTuningMap();
  }

  renderActivityNavControls(currentActivityId);
}

async function renderWorldOverview() {
  appMode = appModes.overview;
  selectedRegionId = null;
  currentActivityId = "world-map";
  await loadMapData("world-map");
  await loadBaseMap();

  document.body.classList.toggle("overview-mode", true);
  document.body.classList.toggle("study-mode", false);
  activityTitle.textContent = "World View";
  instructionText.textContent = "Choose a study region from the map or the region list.";
  mapSvg.setAttribute("aria-label", "World overview map");
  currentMode = modes.wordBank;
  clearTimeout(feedbackTimer);
  completed.clear();
  clearSelectedAnswer();
  feedback.textContent = "";
  feedback.classList.remove("success");
  answerBank.replaceChildren();
  overviewRegionLayer.replaceChildren();
  countryLayer.replaceChildren();
  labelLayer.replaceChildren();
  renderProjectionOverlays();
  renderOverviewRegions();
  renderActivityMenu();
  updateRegionMenu();
  updateModeControls();
  updateProgress();
  resetMapView();
  renderActivityNavControls(currentActivityId);
}

function renderOverviewRegions() {
  overviewRegionLayer.replaceChildren();

  regionOptions.forEach((region) => {
    const shape = createOverviewRegionShape(region);
    const label = createOverviewRegionLabel(region);

    if (shape) {
      overviewRegionLayer.appendChild(shape);
    }

    if (label) {
      overviewRegionLayer.appendChild(label);
    }
  });
}

function createOverviewRegionShape(region) {
  const box = getWorldRegionBox(region.bounds);

  if (!box) {
    return null;
  }

  const rect = document.createElementNS(svgNamespace, "rect");
  rect.classList.add("overview-region-target");
  rect.dataset.region = region.id;
  rect.setAttribute("x", box.x);
  rect.setAttribute("y", box.y);
  rect.setAttribute("width", box.width);
  rect.setAttribute("height", box.height);
  rect.setAttribute("rx", "10");
  rect.setAttribute("tabindex", region.disabled ? "-1" : "0");
  rect.setAttribute("aria-label", region.label);

  if (region.disabled) {
    rect.setAttribute("aria-disabled", "true");
  } else {
    rect.addEventListener("click", () => selectRegion(region.id));
    rect.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        selectRegion(region.id);
      }
    });
  }

  return rect;
}

function createOverviewRegionLabel(region) {
  const box = getWorldRegionBox(region.bounds);

  if (!box) {
    return null;
  }

  const label = document.createElementNS(svgNamespace, "text");
  label.classList.add("overview-region-label");
  label.setAttribute("x", box.x + box.width / 2);
  label.setAttribute("y", box.y + box.height / 2);
  label.setAttribute("text-anchor", "middle");
  label.setAttribute("dominant-baseline", "middle");
  label.textContent = region.label;

  return label;
}

function getWorldRegionBox(bounds) {
  const northwest = projectLonLatRaw(bounds.west, bounds.north, worldProjection);
  const southeast = projectLonLatRaw(bounds.east, bounds.south, worldProjection);

  if (!northwest || !southeast) {
    return null;
  }

  return {
    x: Math.min(northwest.x, southeast.x),
    y: Math.min(northwest.y, southeast.y),
    width: Math.abs(southeast.x - northwest.x),
    height: Math.abs(southeast.y - northwest.y)
  };
}

function updateRegionMenu() {
  regionButtons.forEach((button) => {
    const region = regionOptions.find((option) => option.id === button.dataset.region);
    const isDisabled = Boolean(region?.disabled);
    button.classList.toggle("active", selectedRegionId === button.dataset.region);
    button.disabled = isDisabled;
    button.setAttribute("aria-disabled", String(isDisabled));
  });
}

function renderActivityMenu() {
  activityButtons.forEach((button) => {
    const isActive = appMode === appModes.study && button.dataset.activity === currentActivityId;
    button.classList.toggle("active", isActive);
    if (isActive) {
      button.setAttribute("aria-current", "page");
    } else {
      button.removeAttribute("aria-current");
    }
  });

  worldViewButtons.forEach((button) => {
    const isActive = appMode === appModes.overview;
    button.classList.toggle("active", isActive);
    if (isActive) {
      button.setAttribute("aria-current", "page");
    } else {
      button.removeAttribute("aria-current");
    }
  });
}

function renderAnswerBank() {
  if (mapData.hideAnswerBank) {
    answerBank.replaceChildren();
    return;
  }

  answerBank.replaceChildren();
  mapData.features.forEach(createChip);
}

function renderActivityTargets() {
  countryLayer.replaceChildren();
  contextLayer.querySelectorAll(".activity-context-path").forEach((path) => path.remove());

  if (getActivityTargetType() === "city") {
    renderCountryTemplatesAsContext();
  }

  mapData.features.forEach((feature) => {
    const targetElement = createTargetElement(feature);

    if (targetElement) {
      countryLayer.appendChild(targetElement);
    }
  });
}

function getActivityTargetType() {
  if (mapData.features.length === 0) {
    return "none";
  }

  return mapData.features.every(isPointFeature) ? "city" : "country";
}

function renderCountryTemplatesAsContext() {
  countryPathTemplates.forEach((template, id) => {
    const contextPath = template.cloneNode(true);
    contextPath.id = `context-${id}`;
    contextPath.setAttribute("class", "context-path activity-context-path");
    contextPath.removeAttribute("tabindex");
    contextPath.removeAttribute("aria-label");
    contextLayer.appendChild(contextPath);
  });
}

function createTargetElement(feature) {
  if (isPointFeature(feature)) {
    return createCityTarget(feature);
  }

  const template = countryPathTemplates.get(feature.mapShapeId || feature.id);

  if (!template) {
    return null;
  }

  const countryPath = template.cloneNode(true);
  countryPath.id = feature.id;
  countryPath.classList.add("target-shape");
  prepareTargetElement(countryPath, feature);

  return countryPath;
}

function createCityTarget(feature) {
  const circle = document.createElementNS(svgNamespace, "circle");
  circle.id = feature.id;
  circle.classList.add("city-target", "target-shape");
  updateCityTargetElement(circle, feature);
  prepareTargetElement(circle, feature);

  return circle;
}

function updateTargetElement(targetElement, feature) {
  if (isPointFeature(feature)) {
    updateCityTargetElement(targetElement, feature);
  }
}

function updateCityTargetElement(targetElement, feature) {
  const point = getPointAnchorPoint(feature);
  targetElement.setAttribute("cx", point.x);
  targetElement.setAttribute("cy", point.y);
  targetElement.setAttribute("r", feature.hitRadius);
}

function prepareTargetElement(targetElement, feature) {
  targetElement.setAttribute("tabindex", "0");
  targetElement.setAttribute("aria-label", feature.name);

  const title = document.createElementNS(svgNamespace, "title");
  title.textContent = `${feature.name} (id: ${feature.id})`;
  targetElement.prepend(title);

  targetElement.addEventListener("dragover", (event) => {
    event.preventDefault();
  });

  targetElement.addEventListener("drop", (event) => {
    event.preventDefault();
    handleDrop(feature.id, event.dataTransfer.getData("text/plain"), event);
  });

  targetElement.addEventListener("click", (event) => {
    handleTargetClick(feature.id, event);
  });

  targetElement.addEventListener("pointerenter", () => {
    if (debugToggle.checked || isTuningMode) {
      const projectedPoint = isPointFeature(feature) ? getPointProjectedPoint(feature) : null;
      const projectionText = projectedPoint && Number.isFinite(feature.lon) && Number.isFinite(feature.lat)
        ? ` | lon/lat ${feature.lon.toFixed(2)},${feature.lat.toFixed(2)} | svg ${projectedPoint.x},${projectedPoint.y}`
        : "";
      hoverReadout.textContent = `${feature.name} (${feature.id})${projectionText}`;
    }
  });

  targetElement.addEventListener("pointerleave", () => {
    if (debugToggle.checked || isTuningMode) {
      hoverReadout.textContent = "-, -";
    }
  });
}

function createChip(feature) {
  const chip = document.createElement("button");
  chip.type = "button";
  chip.className = "label-chip";
  chip.textContent = feature.name;
  chip.draggable = true;
  chip.dataset.id = feature.id;
  chip.setAttribute("aria-pressed", "false");

  chip.addEventListener("dragstart", (event) => {
    if (currentMode !== modes.wordBank) {
      event.preventDefault();
      return;
    }

    event.dataTransfer.setData("text/plain", feature.id);
    event.dataTransfer.effectAllowed = "move";
  });

  chip.addEventListener("click", () => {
    toggleSelectedAnswer(feature.id);
  });

  answerBank.appendChild(chip);
}

function handleDrop(targetId, draggedId, event) {
  if (isTuningMode) {
    return;
  }

  if (currentMode !== modes.wordBank) {
    return;
  }

  checkAnswer(resolveTargetIdForAnswer(targetId, draggedId, event), draggedId);
}

function handleTargetClick(targetId, event) {
  if (isTuningMode) {
    return;
  }

  if (currentMode === modes.clickReveal) {
    revealCountry(targetId);
    return;
  }

  if (!selectedAnswerId) {
    return;
  }

  checkAnswer(resolveTargetIdForAnswer(targetId, selectedAnswerId, event), selectedAnswerId);
}

function resolveTargetIdForAnswer(targetId, answerId, event) {
  const answerFeature = getFeature(answerId);
  const clickedFeature = getFeature(targetId);

  if (!answerFeature || !event) {
    return targetId;
  }

  const answerElement = countryLayer.querySelector(`#${CSS.escape(answerFeature.id)}`);

  if (answerFeature.type === "state" && isPointFeature(clickedFeature) && answerElement && isEventInsideSvgShape(event, answerElement)) {
    return answerFeature.id;
  }

  if (isPointFeature(answerFeature) && answerElement && isEventInsideSvgShape(event, answerElement)) {
    return answerFeature.id;
  }

  return targetId;
}

function checkAnswer(targetId, answerId) {
  if (!answerId || completed.has(answerId)) {
    return false;
  }

  if (targetId !== answerId) {
    showFeedback("Try again");
    return false;
  }

  completeCountry(targetId);
  clearSelectedAnswer();
  return true;
}

function toggleSelectedAnswer(id) {
  if (isTuningMode) {
    return;
  }

  if (currentMode !== modes.wordBank) {
    return;
  }

  if (completed.has(id)) {
    return;
  }

  if (selectedAnswerId === id) {
    clearSelectedAnswer();
    return;
  }

  setSelectedAnswer(id);
}

function setSelectedAnswer(id) {
  clearSelectedAnswer();
  selectedAnswerId = id;

  const chip = answerBank.querySelector(`[data-id="${id}"]`);

  if (chip) {
    chip.classList.add("selected");
    chip.setAttribute("aria-pressed", "true");
  }
}

function clearSelectedAnswer() {
  if (!selectedAnswerId) {
    return;
  }

  const chip = answerBank.querySelector(`[data-id="${selectedAnswerId}"]`);

  if (chip) {
    chip.classList.remove("selected");
    chip.setAttribute("aria-pressed", "false");
  }

  selectedAnswerId = null;
}

function revealCountry(id) {
  if (completed.has(id)) {
    return false;
  }

  // Click to Reveal Mode is a stepping stone toward a later voice-input mode.
  completeCountry(id, { disableChip: false, feedbackPrefix: "Revealed" });
  return true;
}

function completeCountry(id, options = {}) {
  const { disableChip = true, feedbackPrefix = "Correct" } = options;
  const feature = getFeature(id);
  const targetElement = countryLayer.querySelector(`#${id}`);
  const chip = answerBank.querySelector(`[data-id="${id}"]`);

  if (!feature || !targetElement) {
    return;
  }

  completed.add(id);
  targetElement.classList.add("correct");
  targetElement.style.setProperty("--feature-color", feature.color);
  if (!isPointFeature(feature)) {
    targetElement.style.fill = feature.color;
  }
  revealFeatureLabel(feature, targetElement);

  if (chip && disableChip) {
    chip.classList.add("used");
    chip.draggable = false;
    chip.disabled = true;
  }

  updateProgress();
  updateCompletedActivityState();
  updateActivityNavigationControls();
  showFeedback(`${feedbackPrefix}: ${feature.name}`, true);
}

function revealFeatureLabel(feature, targetElement) {
  if (labelLayer.querySelector(`[data-id="${feature.id}"]`)) {
    return;
  }

  if (isPointFeature(feature)) {
    revealCityLabel(feature);
    return;
  }

  const position = getLabelPosition(feature, targetElement);
  const rotation = feature.labelRotation || defaultLabelRotation;
  const label = document.createElementNS(svgNamespace, "g");
  label.classList.add("map-label");
  label.classList.toggle("city-map-label", isPointFeature(feature));
  label.dataset.id = feature.id;
  label.setAttribute("transform", `translate(${position.x} ${position.y}) rotate(${rotation})`);
  label.addEventListener("pointerdown", handleTuningLabelPointerDown);

  label.appendChild(createTuningHitArea(feature));
  const adornment = createAdornmentElement(feature);

  if (adornment) {
    label.appendChild(adornment);
  }

  label.appendChild(createLabelText(feature));
  labelLayer.appendChild(label);
}

function revealCityLabel(feature) {
  const label = document.createElementNS(svgNamespace, "g");
  label.classList.add("map-label", "city-map-label");
  label.dataset.id = feature.id;
  label.addEventListener("pointerdown", handleTuningLabelPointerDown);

  const iconAnchor = document.createElementNS(svgNamespace, "g");
  iconAnchor.classList.add("city-icon-anchor");
  iconAnchor.setAttribute("transform", getCityIconTransform(feature));
  iconAnchor.appendChild(createCityIconHitArea());
  iconAnchor.appendChild(createLandmarkIcon(feature));

  const labelAnchor = document.createElementNS(svgNamespace, "g");
  labelAnchor.classList.add("city-label-anchor");
  labelAnchor.setAttribute("transform", getCityLabelTransform(feature));
  labelAnchor.appendChild(createTuningHitArea(feature));
  labelAnchor.appendChild(createLabelText(feature));

  label.append(iconAnchor, labelAnchor);
  labelLayer.appendChild(label);
}

function createCityIconHitArea() {
  const hitArea = document.createElementNS(svgNamespace, "rect");
  hitArea.classList.add("city-icon-hit-area");
  hitArea.setAttribute("x", "0");
  hitArea.setAttribute("y", "0");
  hitArea.setAttribute("width", landmarkIconWidth);
  hitArea.setAttribute("height", landmarkIconHeight);
  hitArea.setAttribute("rx", "3");

  return hitArea;
}

function getCityIconTransform(feature) {
  const point = getPointAnchorPoint(feature);
  const scale = feature.iconScale || defaultCityIconScale;
  const iconOffset = feature.iconOffset || { x: 0, y: 0 };
  const x = point.x + iconOffset.x - (landmarkIconWidth * scale) / 2;
  const y = point.y + iconOffset.y - landmarkIconHeight * scale;

  return `translate(${x} ${y}) scale(${scale})`;
}

function getCityLabelTransform(feature) {
  const point = getPointAnchorPoint(feature);
  const x = point.x + feature.labelDx;
  const y = point.y + feature.labelDy;
  const rotation = feature.labelRotation || defaultLabelRotation;

  return `translate(${x} ${y}) rotate(${rotation})`;
}

function getLabelPosition(feature, targetElement) {
  if (feature.labelPosition) {
    return feature.labelPosition;
  }

  const box = targetElement.getBBox();

  return {
    x: Math.round(box.x + box.width / 2),
    y: Math.round(box.y + box.height / 2)
  };
}

function createAdornmentElement(feature) {
  if (isPointFeature(feature)) {
    return createLandmarkIcon(feature);
  }

  if (feature.type === "state") {
    return null;
  }

  return createFlagElement(feature);
}

function getAdornmentName(feature) {
  if (feature.type === "state") {
    return "Label";
  }

  return isPointFeature(feature) ? "Icon" : "Flag";
}

function getAdornmentOffset(feature) {
  if (feature.type === "state") {
    return { x: 0, y: 0 };
  }

  return isPointFeature(feature) ? feature.iconOffset : feature.flagOffset;
}

function setAdornmentOffset(feature, offset) {
  if (feature.type === "state") {
    return;
  }

  if (isPointFeature(feature)) {
    feature.iconOffset = offset;
    return;
  }

  feature.flagOffset = offset;
}

function getAdornmentSize(feature) {
  if (feature.type === "state") {
    return 1;
  }

  return isPointFeature(feature) ? feature.iconSize : feature.flagSize;
}

function setAdornmentSize(feature, size) {
  if (feature.type === "state") {
    return;
  }

  if (isPointFeature(feature)) {
    feature.iconSize = size;
    return;
  }

  feature.flagSize = size;
}

function createFlagElement(feature) {
  const offset = feature.flagOffset || { x: -23, y: -7 };
  const flagSize = feature.flagSize || defaultFlagSize;

  if (feature.flagType) {
    return createMiniFlag(feature.flagType, offset, flagSize);
  }

  if (feature.flag) {
    return createEmojiFlag(feature.flag, offset, flagSize);
  }

  return createMiniFlag(feature.id, offset, flagSize);
}

function createEmojiFlag(flagText, offset, flagSize) {
  const flag = document.createElementNS(svgNamespace, "text");
  flag.classList.add("map-label-flag");
  flag.setAttribute("x", offset.x);
  flag.setAttribute("y", offset.y + 7);
  flag.setAttribute("dominant-baseline", "middle");
  flag.style.fontSize = `${Math.round(25 * flagSize)}px`;
  flag.textContent = flagText;

  return flag;
}

function createMiniFlag(flagType, offset, flagSize) {
  if (flagType === "uk-svg") {
    return createUnitedKingdomFlag(offset, flagSize);
  }

  const flag = document.createElementNS(svgNamespace, "g");
  flag.classList.add("mini-flag");
  flag.setAttribute("transform", `translate(${offset.x} ${offset.y}) scale(${flagSize})`);

  const stripesByFlag = {
    ireland: [
      { x: 0, y: 0, width: 10.67, height: 22, color: "#169b62" },
      { x: 10.67, y: 0, width: 10.66, height: 22, color: "#ffffff" },
      { x: 21.33, y: 0, width: 10.67, height: 22, color: "#ff883e" }
    ],
    portugal: [
      { x: 0, y: 0, width: 13, height: 22, color: "#006600" },
      { x: 13, y: 0, width: 19, height: 22, color: "#ff0000" },
      { x: 10.5, y: 8, width: 5, height: 5, color: "#ffd100" }
    ],
    spain: [
      { x: 0, y: 0, width: 32, height: 5.5, color: "#aa151b" },
      { x: 0, y: 5.5, width: 32, height: 11, color: "#f1bf00" },
      { x: 0, y: 16.5, width: 32, height: 5.5, color: "#aa151b" }
    ],
    france: [
      { x: 0, y: 0, width: 10.67, height: 22, color: "#0055a4" },
      { x: 10.67, y: 0, width: 10.66, height: 22, color: "#ffffff" },
      { x: 21.33, y: 0, width: 10.67, height: 22, color: "#ef4135" }
    ]
  };

  const stripes = stripesByFlag[flagType] || stripesByFlag.france;

  stripes.forEach((stripe) => {
    const rect = document.createElementNS(svgNamespace, "rect");
    rect.setAttribute("x", stripe.x);
    rect.setAttribute("y", stripe.y);
    rect.setAttribute("width", stripe.width);
    rect.setAttribute("height", stripe.height);
    rect.setAttribute("fill", stripe.color);
    flag.appendChild(rect);
  });

  const frame = document.createElementNS(svgNamespace, "rect");
  frame.classList.add("mini-flag-frame");
  frame.setAttribute("width", "32");
  frame.setAttribute("height", "22");
  frame.setAttribute("rx", "2");
  flag.appendChild(frame);

  return flag;
}

function createUnitedKingdomFlag(offset, flagSize) {
  const flag = document.createElementNS(svgNamespace, "g");
  flag.classList.add("mini-flag");
  flag.setAttribute("transform", `translate(${offset.x} ${offset.y}) scale(${flagSize})`);

  flagClipCounter += 1;
  const clipId = `uk-flag-clip-${flagClipCounter}`;
  const defs = document.createElementNS(svgNamespace, "defs");
  const clipPath = document.createElementNS(svgNamespace, "clipPath");
  clipPath.setAttribute("id", clipId);

  const clipRect = document.createElementNS(svgNamespace, "rect");
  clipRect.setAttribute("width", "32");
  clipRect.setAttribute("height", "22");
  clipRect.setAttribute("rx", "2");
  clipPath.appendChild(clipRect);
  defs.appendChild(clipPath);

  const art = document.createElementNS(svgNamespace, "g");
  art.setAttribute("clip-path", `url(#${clipId})`);

  const base = document.createElementNS(svgNamespace, "rect");
  base.setAttribute("width", "32");
  base.setAttribute("height", "22");
  base.setAttribute("rx", "2");
  base.setAttribute("fill", "#012169");
  art.appendChild(base);

  [
    { x1: -4, y1: -2, x2: 36, y2: 24, color: "#ffffff", width: 6 },
    { x1: 36, y1: -2, x2: -4, y2: 24, color: "#ffffff", width: 6 },
    { x1: -4, y1: -2, x2: 36, y2: 24, color: "#c8102e", width: 3 },
    { x1: 36, y1: -2, x2: -4, y2: 24, color: "#c8102e", width: 3 },
    { x1: 16, y1: 0, x2: 16, y2: 22, color: "#ffffff", width: 9 },
    { x1: 0, y1: 11, x2: 32, y2: 11, color: "#ffffff", width: 9 },
    { x1: 16, y1: 0, x2: 16, y2: 22, color: "#c8102e", width: 5 },
    { x1: 0, y1: 11, x2: 32, y2: 11, color: "#c8102e", width: 5 }
  ].forEach((stripe) => {
    const line = document.createElementNS(svgNamespace, "line");
    line.setAttribute("x1", stripe.x1);
    line.setAttribute("y1", stripe.y1);
    line.setAttribute("x2", stripe.x2);
    line.setAttribute("y2", stripe.y2);
    line.setAttribute("stroke", stripe.color);
    line.setAttribute("stroke-width", stripe.width);
    art.appendChild(line);
  });

  const frame = document.createElementNS(svgNamespace, "rect");
  frame.classList.add("mini-flag-frame");
  frame.setAttribute("width", "32");
  frame.setAttribute("height", "22");
  frame.setAttribute("rx", "2");

  flag.append(defs, art, frame);

  return flag;
}

function createLandmarkIcon(feature) {
  const icon = document.createElementNS(svgNamespace, "g");
  icon.classList.add("landmark-icon");

  const iconDrawers = {
    "big-ben": drawBigBenIcon,
    "eiffel-tower": drawEiffelTowerIcon,
    colosseum: drawColosseumIcon,
    "sagrada-familia": drawSagradaFamiliaIcon,
    cathedral: drawCathedralIcon,
    capitol: drawCapitolIcon
  };

  const drawIcon = iconDrawers[feature.icon] || drawCathedralIcon;
  drawIcon(icon);

  return icon;
}

function appendIconShape(parent, tagName, attributes) {
  const shape = document.createElementNS(svgNamespace, tagName);

  Object.entries(attributes).forEach(([name, value]) => {
    shape.setAttribute(name, value);
  });

  parent.appendChild(shape);
  return shape;
}

function drawBigBenIcon(icon) {
  appendIconShape(icon, "rect", { x: 8, y: 7, width: 10, height: 20, rx: 1, fill: "#2563eb", stroke: "#0f2758" });
  appendIconShape(icon, "polygon", { points: "7,7 13,1 19,7", fill: "#f5c542", stroke: "#0f2758" });
  appendIconShape(icon, "rect", { x: 11, y: 2, width: 4, height: 6, fill: "#60a5fa", stroke: "#0f2758" });
  appendIconShape(icon, "circle", { cx: 13, cy: 13, r: 2.5, fill: "#f8fafc", stroke: "#0f2758" });
  appendIconShape(icon, "rect", { x: 6, y: 25, width: 14, height: 3, rx: 1, fill: "#1d4ed8", stroke: "#0f2758" });
}

function drawEiffelTowerIcon(icon) {
  appendIconShape(icon, "path", { class: "landmark-line", d: "M 13 2 L 4 28 M 13 2 L 22 28 M 8 17 L 18 17 M 6 24 L 20 24", stroke: "#dc2626" });
  appendIconShape(icon, "path", { class: "landmark-line", d: "M 9 28 C 11 23 15 23 17 28", stroke: "#991b1b" });
  appendIconShape(icon, "circle", { cx: 13, cy: 2, r: 1.4, fill: "#fca5a5", stroke: "#991b1b" });
}

function drawColosseumIcon(icon) {
  appendIconShape(icon, "path", { d: "M 3 12 C 7 6 21 6 25 12 L 24 27 L 4 27 Z", fill: "#d97706", stroke: "#7c2d12" });
  [7, 13, 19].forEach((x) => {
    appendIconShape(icon, "path", { d: `M ${x} 25 L ${x} 18 C ${x} 15 ${x + 4} 15 ${x + 4} 18 L ${x + 4} 25`, fill: "#fff7ed", stroke: "#7c2d12" });
  });
  appendIconShape(icon, "path", { class: "landmark-line", d: "M 5 13 L 23 13 M 4 18 L 24 18", stroke: "#7c2d12" });
}

function drawSagradaFamiliaIcon(icon) {
  [6, 13, 20].forEach((x, index) => {
    const height = index === 1 ? 25 : 21;
    const fill = index === 1 ? "#16a34a" : "#84cc16";
    appendIconShape(icon, "rect", { x: x - 3, y: 28 - height, width: 6, height, rx: 1, fill, stroke: "#365314" });
    appendIconShape(icon, "polygon", { points: `${x - 3},${28 - height} ${x},${24 - height} ${x + 3},${28 - height}`, fill: "#facc15", stroke: "#365314" });
  });
  appendIconShape(icon, "rect", { x: 3, y: 21, width: 20, height: 7, rx: 1, fill: "#65a30d", stroke: "#365314" });
}

function drawCathedralIcon(icon) {
  appendIconShape(icon, "rect", { x: 5, y: 12, width: 18, height: 16, rx: 1, fill: "#8b5cf6", stroke: "#4c1d95" });
  appendIconShape(icon, "polygon", { points: "4,12 14,4 24,12", fill: "#c084fc", stroke: "#4c1d95" });
  appendIconShape(icon, "rect", { x: 8, y: 7, width: 4, height: 21, rx: 1, fill: "#7c3aed", stroke: "#4c1d95" });
  appendIconShape(icon, "rect", { x: 16, y: 7, width: 4, height: 21, rx: 1, fill: "#7c3aed", stroke: "#4c1d95" });
  appendIconShape(icon, "path", { d: "M 12 28 L 12 21 C 12 17 16 17 16 21 L 16 28", fill: "#f5f3ff", stroke: "#4c1d95" });
  appendIconShape(icon, "path", { class: "landmark-line", d: "M 14 1 L 14 6 M 11 4 L 17 4", stroke: "#4c1d95" });
}

function drawCapitolIcon(icon) {
  appendIconShape(icon, "rect", { x: 6, y: 18, width: 16, height: 10, rx: 1, fill: "#cbd5e1", stroke: "#475569" });
  appendIconShape(icon, "ellipse", { cx: 14, cy: 16, rx: 6, ry: 4.5, fill: "#f8fafc", stroke: "#475569" });
  appendIconShape(icon, "rect", { x: 10, y: 12, width: 8, height: 4, rx: 1, fill: "#e2e8f0", stroke: "#475569" });
  appendIconShape(icon, "rect", { x: 12.8, y: 8, width: 2.4, height: 6, rx: 1, fill: "#64748b", stroke: "#334155" });
  appendIconShape(icon, "path", { class: "landmark-line", d: "M 7 28 L 21 28", stroke: "#475569" });
}

function createLabelText(feature) {
  const text = document.createElementNS(svgNamespace, "text");
  text.classList.add("map-label-text");
  text.classList.toggle("city-label-text", isPointFeature(feature));
  text.setAttribute("x", "0");
  text.setAttribute("y", "0");
  text.setAttribute("dominant-baseline", "middle");
  text.style.fontSize = `${feature.labelFontSize || (isPointFeature(feature) ? defaultCityLabelFontSize : defaultLabelFontSize)}px`;
  text.textContent = feature.name;

  return text;
}

function createTuningHitArea(feature) {
  const hitArea = document.createElementNS(svgNamespace, "rect");
  const isCity = isPointFeature(feature);
  const width = isCity ? Math.max(48, feature.name.length * 7 + 18) : Math.max(112, feature.name.length * 9 + 38);
  const height = isCity ? 20 : 24;
  hitArea.classList.add("tuning-label-hit-area");
  hitArea.setAttribute("x", isCity ? "-8" : "-30");
  hitArea.setAttribute("y", isCity ? "-10" : "-12");
  hitArea.setAttribute("width", width);
  hitArea.setAttribute("height", height);
  hitArea.setAttribute("rx", "3");

  return hitArea;
}

function setTuningMode(enabled) {
  isTuningMode = enabled;
  tuningDrag = null;
  tuningUndoStack = [];
  pendingTuningUndoState = null;
  activeTuningEdit = false;
  updateUndoButton();
  mapSvg.classList.toggle("tuning-map", enabled);
  tuningTools.hidden = !enabled;
  debugTools.hidden = !enabled && !debugToggle.checked;
  renderProjectionOverlays();

  if (enabled) {
    resetMap();
    renderTuningControls();
    renderTuningMap();
    return;
  }

  resetMap();
}

function renderTuningMap() {
  clearTimeout(feedbackTimer);
  feedback.textContent = "";
  feedback.classList.remove("success");
  completed.clear();
  clearSelectedAnswer();
  labelLayer.replaceChildren();

  countryLayer.querySelectorAll(".target-shape").forEach((targetElement) => {
    targetElement.classList.remove("correct");
    targetElement.style.removeProperty("--feature-color");
    targetElement.style.fill = "";
  });

  mapData.features.forEach((feature) => {
    const targetElement = countryLayer.querySelector(`#${feature.id}`);

    if (!targetElement) {
      return;
    }

    updateTargetElement(targetElement, feature);
    completed.add(feature.id);
    targetElement.classList.add("correct");
    targetElement.style.setProperty("--feature-color", feature.color);
    if (!isPointFeature(feature)) {
      targetElement.style.fill = feature.color;
    }
    revealFeatureLabel(feature, targetElement);
  });

  updateProgress();
  updateTuningControlValues();
}

function renderTuningControls() {
  tuningControls.innerHTML = "";

  mapData.features.forEach((feature) => {
    const card = document.createElement("section");
    const adornmentName = getAdornmentName(feature);
    card.className = "tuning-card";
    card.dataset.tuningId = feature.id;
    card.innerHTML = isPointFeature(feature) ? `
      <h4>${feature.name}</h4>
      <div class="tuning-coordinates"></div>
      <label>Icon X offset<input type="number" step="1" data-field="icon-offset-x" /></label>
      <label>Icon Y offset<input type="number" step="1" data-field="icon-offset-y" /></label>
      <label>Hit radius<input type="number" min="6" max="40" step="1" data-field="hit-radius" /></label>
      <label>Label X offset<input type="number" step="1" data-field="label-dx" /></label>
      <label>Label Y offset<input type="number" step="1" data-field="label-dy" /></label>
      <label>Label font size<input type="number" min="8" max="32" step="1" data-field="label-font-size" /></label>
      <label>${adornmentName} scale<input type="number" min="0.75" max="2" step="0.05" data-field="icon-scale" /></label>
      <label>Label rotation<input type="number" min="-180" max="180" step="1" data-field="label-rotation" /></label>
      <div class="rotation-controls" aria-label="${feature.name} rotation shortcuts">
        <button type="button" data-rotate="-5">Rotate left</button>
        <button type="button" data-rotate="5">Rotate right</button>
      </div>
    ` : feature.type === "state" ? `
      <h4>${feature.name}</h4>
      <div class="tuning-coordinates"></div>
      <label>Label X<input type="number" step="1" data-field="label-x" /></label>
      <label>Label Y<input type="number" step="1" data-field="label-y" /></label>
      <label>Label font size<input type="number" min="8" max="32" step="1" data-field="label-font-size" /></label>
      <label>Label rotation<input type="number" min="-180" max="180" step="1" data-field="label-rotation" /></label>
      <div class="rotation-controls" aria-label="${feature.name} rotation shortcuts">
        <button type="button" data-rotate="-5">Rotate left</button>
        <button type="button" data-rotate="5">Rotate right</button>
      </div>
    ` : `
      <h4>${feature.name}</h4>
      <div class="tuning-coordinates"></div>
      <label>Label X<input type="number" step="1" data-field="label-x" /></label>
      <label>Label Y<input type="number" step="1" data-field="label-y" /></label>
      <label>${adornmentName} X offset<input type="number" step="1" data-field="flag-x" /></label>
      <label>${adornmentName} Y offset<input type="number" step="1" data-field="flag-y" /></label>
      <label>Label font size<input type="number" min="8" max="32" step="1" data-field="label-font-size" /></label>
      <label>${adornmentName} size<input type="number" min="0.25" max="1.4" step="0.05" data-field="flag-size" /></label>
      <label>Label rotation<input type="number" min="-180" max="180" step="1" data-field="label-rotation" /></label>
      <div class="rotation-controls" aria-label="${feature.name} rotation shortcuts">
        <button type="button" data-rotate="-5">Rotate left</button>
        <button type="button" data-rotate="5">Rotate right</button>
      </div>
    `;

    card.querySelectorAll("input").forEach((input) => {
      input.addEventListener("focus", rememberTuningUndoState);
      input.addEventListener("pointerdown", rememberTuningUndoState);
      input.addEventListener("blur", finishTuningUndoState);
      input.addEventListener("input", handleTuningInput);
    });

    card.querySelectorAll("[data-rotate]").forEach((button) => {
      button.addEventListener("click", handleRotationButton);
    });

    tuningControls.appendChild(card);
  });

  updateTuningControlValues();
}

function updateTuningControlValues() {
  updateCalibrationControls();

  mapData.features.forEach((feature) => {
    const card = tuningControls.querySelector(`[data-tuning-id="${feature.id}"]`);

    if (!card) {
      return;
    }

    const rotation = feature.labelRotation || defaultLabelRotation;

    if (isPointFeature(feature)) {
      const projectedPoint = getPointProjectedPoint(feature);
      const iconOffset = feature.iconOffset || { x: 0, y: 0 };
      const lonLatText = Number.isFinite(feature.lon) && Number.isFinite(feature.lat)
        ? ` | lon/lat ${feature.lon.toFixed(2)},${feature.lat.toFixed(2)}`
        : "";
      const projectedText = projectedPoint ? ` | projected ${projectedPoint.x},${projectedPoint.y}` : "";
      card.querySelector(".tuning-coordinates").textContent =
        `city ${feature.x},${feature.y} | icon ${iconOffset.x},${iconOffset.y} | hit r${feature.hitRadius} | label ${feature.labelDx},${feature.labelDy}${lonLatText}${projectedText} | rotate ${rotation}deg`;
      card.querySelector('[data-field="icon-offset-x"]').value = iconOffset.x;
      card.querySelector('[data-field="icon-offset-y"]').value = iconOffset.y;
      card.querySelector('[data-field="hit-radius"]').value = feature.hitRadius;
      card.querySelector('[data-field="label-dx"]').value = feature.labelDx;
      card.querySelector('[data-field="label-dy"]').value = feature.labelDy;
      card.querySelector('[data-field="label-font-size"]').value = feature.labelFontSize;
      card.querySelector('[data-field="icon-scale"]').value = feature.iconScale;
      card.querySelector('[data-field="label-rotation"]').value = rotation;
      return;
    }

    if (feature.type === "state") {
      const position = feature.labelPosition || { x: 0, y: 0 };
      card.querySelector(".tuning-coordinates").textContent =
        `label ${position.x},${position.y} | rotate ${rotation}deg`;
      card.querySelector('[data-field="label-x"]').value = position.x;
      card.querySelector('[data-field="label-y"]').value = position.y;
      card.querySelector('[data-field="label-font-size"]').value = feature.labelFontSize;
      card.querySelector('[data-field="label-rotation"]').value = rotation;
      return;
    }

    const position = feature.labelPosition;
    const offset = getAdornmentOffset(feature);
    card.querySelector(".tuning-coordinates").textContent =
      `label ${position.x},${position.y} | ${getAdornmentName(feature).toLowerCase()} ${offset.x},${offset.y} | rotate ${rotation}deg`;
    card.querySelector('[data-field="label-x"]').value = position.x;
    card.querySelector('[data-field="label-y"]').value = position.y;
    card.querySelector('[data-field="flag-x"]').value = offset.x;
    card.querySelector('[data-field="flag-y"]').value = offset.y;
    card.querySelector('[data-field="label-font-size"]').value = feature.labelFontSize;
    card.querySelector('[data-field="flag-size"]').value = getAdornmentSize(feature);
    card.querySelector('[data-field="label-rotation"]').value = rotation;
  });
}

function updateCalibrationControls() {
  if (!calibrationTranslateXInput) {
    return;
  }

  calibrationTranslateXInput.value = europeCalibration.translateX;
  calibrationTranslateYInput.value = europeCalibration.translateY;
  calibrationScaleXInput.value = europeCalibration.scaleX;
  calibrationScaleYInput.value = europeCalibration.scaleY;
  calibrationRotationInput.value = europeCalibration.rotation;
}

function handleTuningInput(event) {
  const card = event.target.closest(".tuning-card");
  const feature = getFeature(card.dataset.tuningId);
  const value = Number(event.target.value);

  if (!Number.isFinite(value)) {
    return;
  }

  commitTuningUndoState();
  updateTuningFeature(feature, event.target.dataset.field, value);
  renderTuningMap();
  saveCurrentMapSettings();
}

function handleCalibrationInput(event) {
  const value = Number(event.target.value);

  if (!Number.isFinite(value)) {
    return;
  }

  commitTuningUndoState();
  setEuropeCalibration({
    ...europeCalibration,
    [event.target.dataset.calibrationField]: value
  });
}

async function copyCalibrationSettings() {
  const calibrationJson = JSON.stringify(getEuropeCalibrationSettings(), null, 2);

  try {
    await navigator.clipboard.writeText(calibrationJson);
  } catch {
    const textArea = document.createElement("textarea");
    textArea.value = calibrationJson;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand("copy");
    textArea.remove();
  }

  showFeedback("Calibration copied", true);
}

function handleRotationButton(event) {
  const card = event.target.closest(".tuning-card");
  const feature = getFeature(card.dataset.tuningId);
  const amount = Number(event.target.dataset.rotate);

  if (!feature || !Number.isFinite(amount)) {
    return;
  }

  pushTuningUndoState(getTuningSnapshot());
  feature.labelRotation = Math.round((feature.labelRotation || defaultLabelRotation) + amount);
  renderTuningMap();
  saveCurrentMapSettings();
}

function updateTuningFeature(feature, field, value) {
  if (field === "icon-offset-x") {
    feature.iconOffset = {
      ...(feature.iconOffset || { x: 0, y: 0 }),
      x: Math.round(value)
    };
  } else if (field === "icon-offset-y") {
    feature.iconOffset = {
      ...(feature.iconOffset || { x: 0, y: 0 }),
      y: Math.round(value)
    };
  } else if (field === "city-x" && (!Number.isFinite(feature.lon) || !Number.isFinite(feature.lat))) {
    feature.x = Math.round(value);
  } else if (field === "city-y" && (!Number.isFinite(feature.lon) || !Number.isFinite(feature.lat))) {
    feature.y = Math.round(value);
  } else if (field === "hit-radius") {
    feature.hitRadius = Math.round(value);
  } else if (field === "label-dx") {
    feature.labelDx = Math.round(value);
  } else if (field === "label-dy") {
    feature.labelDy = Math.round(value);
  } else if (field === "icon-scale") {
    feature.iconScale = value;
  } else if (field === "label-x") {
    feature.labelPosition ||= { x: 0, y: 0 };
    feature.labelPosition.x = Math.round(value);
  } else if (field === "label-y") {
    feature.labelPosition ||= { x: 0, y: 0 };
    feature.labelPosition.y = Math.round(value);
  } else if (field === "flag-x") {
    setAdornmentOffset(feature, {
      ...getAdornmentOffset(feature),
      x: Math.round(value)
    });
  } else if (field === "flag-y") {
    setAdornmentOffset(feature, {
      ...getAdornmentOffset(feature),
      y: Math.round(value)
    });
  } else if (field === "label-font-size") {
    feature.labelFontSize = value;
  } else if (field === "flag-size") {
    setAdornmentSize(feature, value);
  } else if (field === "label-rotation") {
    feature.labelRotation = Math.round(value);
  }

  if (isPointFeature(feature)) {
    feature.labelOffset = {
      x: Math.round(feature.labelDx),
      y: Math.round(feature.labelDy)
    };
  }
}

function handleTuningLabelPointerDown(event) {
  if (!isTuningMode) {
    return;
  }

  const label = event.currentTarget;
  const feature = getFeature(label.dataset.id);
  const point = getSvgCoordinates(event);

  if (!feature || !point) {
    return;
  }

  if (isPointFeature(feature)) {
    handleCityTuningPointerDown(event, feature, point);
    return;
  }

  const isFlagDrag = Boolean(event.target.closest(".mini-flag, .map-label-flag, .landmark-icon"));
  rememberTuningUndoState();

  tuningDrag = {
    featureId: feature.id,
    type: isFlagDrag ? "flag" : "label",
    startPoint: point,
    startLabelPosition: { ...feature.labelPosition },
    startFlagOffset: { ...getAdornmentOffset(feature) }
  };

  event.preventDefault();
  event.stopPropagation();

  if (mapSvg.setPointerCapture) {
    mapSvg.setPointerCapture(event.pointerId);
  }
}

function handleCityTuningPointerDown(event, feature, point) {
  const isIconDrag = Boolean(event.target.closest(".city-icon-anchor"));
  const isLabelDrag = Boolean(event.target.closest(".city-label-anchor"));

  if (!isIconDrag && !isLabelDrag) {
    return;
  }

  rememberTuningUndoState();

  tuningDrag = {
    featureId: feature.id,
    type: isIconDrag ? "city-icon" : "city-label",
    startPoint: point,
    startCityPosition: { x: feature.x, y: feature.y },
    startIconOffset: { ...(feature.iconOffset || { x: 0, y: 0 }) },
    startLabelOffset: { x: feature.labelDx, y: feature.labelDy }
  };

  event.preventDefault();
  event.stopPropagation();

  if (mapSvg.setPointerCapture) {
    mapSvg.setPointerCapture(event.pointerId);
  }
}

function handleTuningPointerMove(event) {
  if (!isTuningMode || !tuningDrag) {
    return;
  }

  const point = getSvgCoordinates(event);

  if (!point) {
    return;
  }

  const feature = getFeature(tuningDrag.featureId);
  const deltaX = point.x - tuningDrag.startPoint.x;
  const deltaY = point.y - tuningDrag.startPoint.y;

  if (deltaX === 0 && deltaY === 0) {
    return;
  }

  if (tuningDrag.type === "city-icon") {
    commitTuningUndoState();
    feature.iconOffset = {
      x: Math.round(tuningDrag.startIconOffset.x + deltaX),
      y: Math.round(tuningDrag.startIconOffset.y + deltaY)
    };
  } else if (tuningDrag.type === "city-label") {
    commitTuningUndoState();
    feature.labelDx = Math.round(tuningDrag.startLabelOffset.x + deltaX);
    feature.labelDy = Math.round(tuningDrag.startLabelOffset.y + deltaY);
    feature.labelOffset = {
      x: feature.labelDx,
      y: feature.labelDy
    };
  } else if (tuningDrag.type === "flag") {
    commitTuningUndoState();
    setAdornmentOffset(feature, {
      x: Math.round(tuningDrag.startFlagOffset.x + deltaX),
      y: Math.round(tuningDrag.startFlagOffset.y + deltaY)
    });
  } else {
    commitTuningUndoState();
    feature.labelPosition = {
      x: Math.round(tuningDrag.startLabelPosition.x + deltaX),
      y: Math.round(tuningDrag.startLabelPosition.y + deltaY)
    };
  }

  renderTuningMap();
  saveCurrentMapSettings();
}

function stopTuningDrag(event) {
  if (!tuningDrag) {
    return;
  }

  if (mapSvg.releasePointerCapture && (!mapSvg.hasPointerCapture || mapSvg.hasPointerCapture(event.pointerId))) {
    mapSvg.releasePointerCapture(event.pointerId);
  }

  tuningDrag = null;
  finishTuningUndoState();
}

function updateWaterOpacity() {
  waterShadingLayer.style.opacity = waterOpacityInput.value;
}

function handleWaterOpacityInput() {
  commitTuningUndoState();
  updateWaterOpacity();
  saveCurrentMapSettings();
}

function getTuningSnapshot() {
  return getMapSettings();
}

function getMapSettings() {
  return {
    waterOpacity: Number(waterOpacityInput.value),
    calibration: getEuropeCalibrationSettings(),
    features: mapData.features.map(getFeatureSettings)
  };
}

function getFeatureSettings(feature) {
  const settings = {
    id: feature.id,
    labelFontSize: feature.labelFontSize,
    labelRotation: feature.labelRotation || defaultLabelRotation
  };

  if (isPointFeature(feature)) {
    settings.lon = feature.lon;
    settings.lat = feature.lat;
    if (!Number.isFinite(feature.lon) || !Number.isFinite(feature.lat)) {
      settings.x = feature.x;
      settings.y = feature.y;
    }
    settings.hitRadius = feature.hitRadius;
    settings.iconScale = feature.iconScale;
    settings.iconOffset = { ...(feature.iconOffset || { x: 0, y: 0 }) };
    settings.labelDx = feature.labelDx;
    settings.labelDy = feature.labelDy;
    settings.labelOffset = {
      x: feature.labelDx,
      y: feature.labelDy
    };
  } else if (feature.type === "state") {
    settings.labelPosition = { ...(feature.labelPosition || { x: 0, y: 0 }) };
  } else {
    settings.labelPosition = { ...feature.labelPosition };
    settings.flagOffset = { ...feature.flagOffset };
    settings.flagSize = feature.flagSize;
  }

  return settings;
}

function applyTuningSnapshot(snapshot) {
  waterOpacityInput.value = snapshot.waterOpacity;
  updateWaterOpacity();

  if (snapshot.calibration) {
    europeCalibration = normalizeCalibration(snapshot.calibration);
    updateCoordinateFeaturePositions();
    renderProjectionOverlays();
    updateCalibrationControls();
    saveEuropeCalibration();
  }

  snapshot.features.forEach((settings) => {
    const feature = getFeature(settings.id);

    if (!feature) {
      return;
    }

    applyFeatureSettings(feature, settings);
  });

  renderTuningMap();
}

function rememberTuningUndoState() {
  if (!isTuningMode || activeTuningEdit) {
    return;
  }

  pendingTuningUndoState = getTuningSnapshot();
  activeTuningEdit = true;
}

function commitTuningUndoState() {
  if (!isTuningMode) {
    return;
  }

  if (!activeTuningEdit) {
    pendingTuningUndoState = getTuningSnapshot();
    activeTuningEdit = true;
  }

  if (!pendingTuningUndoState) {
    return;
  }

  pushTuningUndoState(pendingTuningUndoState);
  pendingTuningUndoState = null;
}

function finishTuningUndoState() {
  pendingTuningUndoState = null;
  activeTuningEdit = false;
}

function pushTuningUndoState(snapshot) {
  const snapshotJson = JSON.stringify(snapshot);
  const previousSnapshot = tuningUndoStack[tuningUndoStack.length - 1];

  if (previousSnapshot?.json === snapshotJson) {
    return;
  }

  tuningUndoStack.push({ json: snapshotJson, state: snapshot });
  updateUndoButton();
}

function undoTuningChange() {
  const previousSnapshot = tuningUndoStack.pop();

  if (!previousSnapshot) {
    return;
  }

  applyTuningSnapshot(previousSnapshot.state);
  updateUndoButton();
  saveCurrentMapSettings();
  showFeedback("Tuning change undone", true);
}

function updateUndoButton() {
  undoTuningButton.disabled = tuningUndoStack.length === 0;
}

async function copyMapSettings() {
  const settings = getMapSettings();
  const settingsJson = JSON.stringify(settings, null, 2);

  try {
    await navigator.clipboard.writeText(settingsJson);
  } catch {
    const textArea = document.createElement("textarea");
    textArea.value = settingsJson;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand("copy");
    textArea.remove();
  }

  showFeedback("Map settings copied", true);
}

function handleReset() {
  resetMap();

  if (isTuningMode) {
    renderTuningMap();
  }

  updateActivityNavigationControls();
}

async function setActivity(activityId) {
  if (appMode === appModes.study && activityId === currentActivityId) {
    return;
  }

  currentActivityId = activityId;
  selectedAnswerId = null;
  tuningDrag = null;
  tuningUndoStack = [];
  pendingTuningUndoState = null;
  activeTuningEdit = false;
  updateUndoButton();

  await loadMapData(activityId);
  await loadBaseMap();

  currentMode = mapData.defaultMode || (mapData.hideAnswerBank && mapData.features.length > 0 ? modes.clickReveal : modes.wordBank);

  renderActivity();
  resetMapView();
  updateRegionMenu();
}

async function openActivity(activityId) {
  if (!activityId) {
    return;
  }

  await runMapTransition(() => setActivity(activityId));
}

function goHome() {
  window.location.href = "index.html";
}

function openPreviousActivity() {
  const previousActivityId = getPreviousActivityId(currentActivityId);

  if (!previousActivityId) {
    showFeedback("No previous region.");
    updateActivityNavigationControls();
    return;
  }

  openActivity(previousActivityId).catch(() => {
    showFeedback("Activity could not be loaded.");
  });
}

function openNextIncompleteActivity() {
  const nextActivityId = getNextIncompleteActivityId(currentActivityId);

  if (!nextActivityId) {
    showFeedback("All regions complete.");
    updateActivityNavigationControls();
    return;
  }

  openActivity(nextActivityId).catch(() => {
    showFeedback("Activity could not be loaded.");
  });
}

async function selectRegion(regionId) {
  const region = regionOptions.find((option) => option.id === regionId);

  if (!region || region.disabled) {
    showFeedback("That region is coming soon.");
    return;
  }

  selectedRegionId = regionId;
  updateRegionMenu();
  await runMapTransition(() => setActivity(region.activityId));
}

async function runMapTransition(callback) {
  mapSvg.classList.add("map-transitioning");
  await waitForAnimationFrame();
  await new Promise((resolve) => setTimeout(resolve, 160));
  await callback();
  await waitForAnimationFrame();
  mapSvg.classList.remove("map-transitioning");
}

function waitForAnimationFrame() {
  return new Promise((resolve) => requestAnimationFrame(resolve));
}

function setMode(mode) {
  if (mode === currentMode) {
    return;
  }

  currentMode = mode;
  renderMode();
  resetMap();

  if (isTuningMode) {
    renderTuningMap();
  }
}

function renderMode() {
  updateModeControls();
  const isWordBankMode = currentMode === modes.wordBank;
  const targetNoun = getTargetNoun();
  const instruction = mapData.hideAnswerBank && mapData.features.length > 0
    ? `Click each ${targetNoun} on the map to reveal it.`
    : mapData.hideAnswerBank
      ? "Base map ready for coordinates."
    : isWordBankMode
      ? `Drag or select each label, then place it on the correct ${targetNoun}.`
      : `Name the ${targetNoun} in your head, then click it to check.`;

  instructionText.textContent = instruction;
  answerPanelTitle.textContent = mapData.hideAnswerBank ? mapData.title : (isWordBankMode ? "Answer Bank" : "Click to Reveal");
  answerBank.hidden = !isWordBankMode || Boolean(mapData.hideAnswerBank);

  modeButtons.forEach((button) => {
    const isActive = button.dataset.mode === currentMode;
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });
}

function updateModeControls() {
  if (!modeToggle) {
    return;
  }

  const hasPracticeFeatures = appMode === appModes.study && mapData.features.length > 0 && !mapData.hideAnswerBank;
  modeToggle.hidden = !hasPracticeFeatures;
}

function resetMap() {
  clearTimeout(feedbackTimer);
  completed.clear();
  clearSelectedAnswer();
  feedback.textContent = "";
  feedback.classList.remove("success");
  labelLayer.replaceChildren();

  countryLayer.querySelectorAll(".target-shape").forEach((targetElement) => {
    targetElement.classList.remove("correct");
    targetElement.style.removeProperty("--feature-color");
    targetElement.style.fill = "";
  });

  answerBank.querySelectorAll(".label-chip").forEach((chip) => {
    chip.classList.remove("used");
    chip.classList.remove("selected");
    chip.setAttribute("aria-pressed", "false");
    chip.draggable = true;
    chip.disabled = false;
  });

  updateProgress();
}

function updateProgress() {
  if (mapData.hideAnswerBank) {
    progressText.textContent = mapData.features.length > 0
      ? `${completed.size} of ${mapData.features.length} revealed`
      : "Base map ready for coordinates";
    return;
  }

  progressText.textContent = `${completed.size} of ${mapData.features.length} completed`;
}

function updateCompletedActivityState() {
  if (!mapData?.features?.length) {
    return;
  }

  setActivityCompletedState(currentActivityId, completed.size >= mapData.features.length);
}

function updateActivityNavigationControls() {
  if (homeButton) {
    homeButton.disabled = false;
  }

  if (previousActivityButton) {
    previousActivityButton.disabled = !getPreviousActivityId(currentActivityId);
  }

  if (nextIncompleteButton) {
    nextIncompleteButton.disabled = false;
  }
}

function renderActivityNavControls(activityId) {
  console.log(`Activity nav rendered for: ${activityId}`);
  updateActivityNavigationControls();
}

function zoomMap(direction) {
  if (!currentViewBox || !baseViewBox) {
    return;
  }

  const zoomFactor = direction > 0 ? 0.82 : 1.22;
  const centerX = currentViewBox.x + currentViewBox.width / 2;
  const centerY = currentViewBox.y + currentViewBox.height / 2;
  const maxWidth = baseViewBox.width * 1.5;
  const maxHeight = baseViewBox.height * 1.5;
  const nextWidth = Math.min(maxWidth, Math.max(baseViewBox.width / 7, currentViewBox.width * zoomFactor));
  const nextHeight = Math.min(maxHeight, Math.max(baseViewBox.height / 7, currentViewBox.height * zoomFactor));

  setMapViewBox({
    x: centerX - nextWidth / 2,
    y: centerY - nextHeight / 2,
    width: nextWidth,
    height: nextHeight
  });
}

function resetMapView() {
  if (!baseViewBox) {
    return;
  }

  setMapViewBox(baseViewBox);
}

function updateLodLevel() {
  if (!baseViewBox || !currentViewBox) {
    currentZoomLevel = 0;
    return;
  }

  const zoomRatio = baseViewBox.width / currentViewBox.width;
  currentZoomLevel = zoomRatio < 1.3 ? 0
    : zoomRatio < 2 ? 1
      : zoomRatio < 3 ? 2
        : zoomRatio < 4.5 ? 3
          : 4;
  mapSvg.dataset.lod = String(currentZoomLevel);
  document.body.dataset.lod = String(currentZoomLevel);

  // TODO: Use this level-of-detail hook for future layers:
  // counties, rivers, mountains, trails, canals, deserts, Native American regions,
  // bays, and other progressively revealed geography features.
}

function startMapPan(event) {
  if (isTuningMode || event.button !== 0 || event.target.closest(".target-shape, .overview-region-target, .map-label")) {
    return;
  }

  mapPanDrag = {
    pointerId: event.pointerId,
    startClientX: event.clientX,
    startClientY: event.clientY,
    startViewBox: currentViewBox ? { ...currentViewBox } : null
  };

  if (mapSvg.setPointerCapture) {
    mapSvg.setPointerCapture(event.pointerId);
  }
}

function panMap(event) {
  if (!mapPanDrag?.startViewBox) {
    return;
  }

  const svgRect = mapSvg.getBoundingClientRect();
  const dx = ((event.clientX - mapPanDrag.startClientX) / svgRect.width) * mapPanDrag.startViewBox.width;
  const dy = ((event.clientY - mapPanDrag.startClientY) / svgRect.height) * mapPanDrag.startViewBox.height;

  setMapViewBox({
    ...mapPanDrag.startViewBox,
    x: mapPanDrag.startViewBox.x - dx,
    y: mapPanDrag.startViewBox.y - dy
  });
}

function stopMapPan(event) {
  if (!mapPanDrag) {
    return;
  }

  if (mapSvg.releasePointerCapture && (!mapSvg.hasPointerCapture || mapSvg.hasPointerCapture(event.pointerId))) {
    mapSvg.releasePointerCapture(event.pointerId);
  }

  mapPanDrag = null;
}

function showFeedback(message, isSuccess = false) {
  clearTimeout(feedbackTimer);
  feedback.textContent = message;
  feedback.classList.toggle("success", isSuccess);

  feedbackTimer = setTimeout(() => {
    feedback.textContent = "";
    feedback.classList.remove("success");
  }, 1200);
}

function updateDebugMode() {
  const isDebugging = debugToggle.checked;

  mapSvg.classList.toggle("debug-map", isDebugging);
  debugTools.hidden = !isDebugging && !isTuningMode;
  renderProjectionOverlays();

  if (!isDebugging && !isTuningMode) {
    coordinateReadout.textContent = "-, -";
    hoverReadout.textContent = "-, -";
  }
}

function getSvgCoordinates(event) {
  const svgPoint = getSvgPoint(event);

  if (!svgPoint) {
    return null;
  }

  return {
    x: Math.round(svgPoint.x),
    y: Math.round(svgPoint.y)
  };
}

function getSvgPoint(event) {
  const screenTransform = mapSvg.getScreenCTM();

  if (!screenTransform) {
    return null;
  }

  const point = mapSvg.createSVGPoint();
  point.x = event.clientX;
  point.y = event.clientY;

  return point.matrixTransform(screenTransform.inverse());
}

function isEventInsideSvgShape(event, shapeElement) {
  const point = getSvgPoint(event);

  if (!point) {
    return false;
  }

  if (typeof shapeElement.isPointInFill === "function" && shapeElement.isPointInFill(point)) {
    return true;
  }

  const box = shapeElement.getBBox();
  return point.x >= box.x && point.x <= box.x + box.width && point.y >= box.y && point.y <= box.y + box.height;
}

function formatPoint(point) {
  const lonLatText = Number.isFinite(point.lon) && Number.isFinite(point.lat)
    ? ` | lon ${point.lon.toFixed(2)}, lat ${point.lat.toFixed(2)}`
    : "";
  return `${point.x},${point.y}${lonLatText}`;
}

function updateCoordinateReadout(event) {
  if (!debugToggle.checked && !isTuningMode) {
    return;
  }

  const point = getSvgCoordinates(event);

  if (point) {
    coordinateReadout.textContent = formatPoint({
      ...point,
      ...invertProjectedPoint(point.x, point.y)
    });
  }
}

function addClickedPoint(event) {
  if (!debugToggle.checked && !isTuningMode) {
    return;
  }

  const point = getSvgCoordinates(event);

  if (!point) {
    return;
  }

  const enrichedPoint = {
    ...point,
    ...invertProjectedPoint(point.x, point.y)
  };
  clickedPoints.push(enrichedPoint);
  coordinateReadout.textContent = formatPoint(enrichedPoint);
  renderClickedPoints();
}

function renderClickedPoints() {
  clickedPointsList.innerHTML = "";

  clickedPoints.forEach((point) => {
    const item = document.createElement("li");
    item.textContent = formatPoint(point);
    clickedPointsList.appendChild(item);
  });

  copyPointsButton.disabled = clickedPoints.length === 0;
}

async function copyClickedPoints() {
  if (clickedPoints.length === 0) {
    return;
  }

  const pointsText = clickedPoints.map(formatPoint).join(" ");

  try {
    await navigator.clipboard.writeText(pointsText);
  } catch {
    const textArea = document.createElement("textarea");
    textArea.value = pointsText;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand("copy");
    textArea.remove();
  }

  showFeedback("Points copied", true);
}

async function init() {
  loadEuropeCalibration();

  activityButtons.forEach((button) => {
    button.addEventListener("click", () => {
      runMapTransition(() => setActivity(button.dataset.activity)).catch(() => {
        showFeedback("Map could not be loaded.");
      });
    });
  });
  worldViewButtons.forEach((button) => {
    button.addEventListener("click", () => {
      runMapTransition(renderWorldOverview).catch(() => {
        showFeedback("World view could not be loaded.");
      });
    });
  });
  regionButtons.forEach((button) => {
    button.addEventListener("click", () => {
      selectRegion(button.dataset.region).catch(() => {
        showFeedback("Region could not be loaded.");
      });
    });
  });
  modeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      setMode(button.dataset.mode);
    });
  });

  debugToggle.addEventListener("change", updateDebugMode);
  tuningToggle.addEventListener("change", () => {
    setTuningMode(tuningToggle.checked);
  });
  mapSvg.addEventListener("pointermove", updateCoordinateReadout);
  mapSvg.addEventListener("pointermove", handleTuningPointerMove);
  mapSvg.addEventListener("pointermove", panMap);
  mapSvg.addEventListener("pointerup", stopTuningDrag);
  mapSvg.addEventListener("pointerup", stopMapPan);
  mapSvg.addEventListener("pointercancel", stopTuningDrag);
  mapSvg.addEventListener("pointercancel", stopMapPan);
  mapSvg.addEventListener("pointerdown", updateCoordinateReadout);
  mapSvg.addEventListener("pointerdown", startMapPan);
  mapSvg.addEventListener("click", addClickedPoint);
  homeButton.addEventListener("click", goHome);
  previousActivityButton.addEventListener("click", openPreviousActivity);
  nextIncompleteButton.addEventListener("click", openNextIncompleteActivity);
  resetButton.addEventListener("click", handleReset);
  zoomInButton.addEventListener("click", () => zoomMap(1));
  zoomOutButton.addEventListener("click", () => zoomMap(-1));
  fitMapButton.addEventListener("click", resetMapView);
  copyPointsButton.addEventListener("click", copyClickedPoints);
  copyMapSettingsButton.addEventListener("click", copyMapSettings);
  undoTuningButton.addEventListener("click", undoTuningChange);
  resetCalibrationButton.addEventListener("click", resetEuropeCalibration);
  copyCalibrationButton.addEventListener("click", copyCalibrationSettings);
  [
    [calibrationTranslateXInput, "translateX"],
    [calibrationTranslateYInput, "translateY"],
    [calibrationScaleXInput, "scaleX"],
    [calibrationScaleYInput, "scaleY"],
    [calibrationRotationInput, "rotation"]
  ].forEach(([input, field]) => {
    input.dataset.calibrationField = field;
    input.addEventListener("focus", rememberTuningUndoState);
    input.addEventListener("pointerdown", rememberTuningUndoState);
    input.addEventListener("blur", finishTuningUndoState);
    input.addEventListener("input", handleCalibrationInput);
  });
  waterOpacityInput.addEventListener("focus", rememberTuningUndoState);
  waterOpacityInput.addEventListener("pointerdown", rememberTuningUndoState);
  waterOpacityInput.addEventListener("blur", finishTuningUndoState);
  waterOpacityInput.addEventListener("input", handleWaterOpacityInput);

  updateWaterOpacity();
  const initialActivityId = getInitialActivityFromUrl();

  if (initialActivityId && initialActivityId !== "world-map") {
    await setActivity(initialActivityId);
  } else {
    await renderWorldOverview();
  }

  renderClickedPoints();
}

init().catch(() => {
  showFeedback("Map could not be loaded.");
});
