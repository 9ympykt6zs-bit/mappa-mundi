import {
  baseWaterColor,
  oceanCompletedColor,
  oceanCompletedOutlineColor,
  oceanRegionColors,
  oceanZoneMutedColor,
  oceanTextureSize
} from "./ocean-textures.js?v=20260601-instruction-target-nouns";

const colors = {
  ink: "#172033",
  ocean: baseWaterColor,
  land: "#dbeafe",
  countryBorder: "#ffffff",
  contextFill: "#e8f4ef",
  contextLine: "#ffffff",
  targetFill: "#dbeafe",
  targetStroke: "#ffffff",
  previewFill: "#3b82f6",
  completedFill: "#1d4ed8",
  selectedLine: "#0f4fa8",
  studyTargetFill: "#dbeafe",
  studyTargetLine: "#2563eb",
  memoryTrailFill: "#f5c542",
  memoryTrailLine: "#9a5f05",
  memoryTrailCorrectFill: "#22c55e",
  memoryTrailCorrectLine: "#166534",
  memoryTrailWrongFill: "#ef4444",
  memoryTrailWrongLine: "#991b1b",
  mountainRangeFill: "#b7791f",
  mountainRangeLine: "#7c3f12",
  riverLine: "#3387c5",
  riverLineMuted: "#83b7d7",
  riverLineHighlight: "#075985",
  hardContinentChallengeFill: "#4f7f5f",
  neutralMarker: "#ffffff",
  neutralMarkerStroke: "#172033",
  markerHalo: "#2563eb",
  mutedTargetPalette: [
    "#d8e8f4",
    "#dcebd9",
    "#efe2c5",
    "#e5def4",
    "#f0d9cf",
    "#d4ece7",
    "#ece2bc",
    "#dde5f4",
    "#ead8e9",
    "#d9e8d0",
    "#f1ddd4",
    "#d7e9ef"
  ],
  hardContextPalette: [
    "#cfe8d5",
    "#f6d7c9",
    "#d7d9f2",
    "#f5e3a8",
    "#cbe1ed",
    "#e7cdec",
    "#dcecc8",
    "#f3c9ce",
    "#c9e7df",
    "#ead9bb"
  ]
};

const oceanHighlightLatExtent = 89.5;
const oceanHighlightTextureBounds = [
  [-180, oceanHighlightLatExtent],
  [180, oceanHighlightLatExtent],
  [180, -oceanHighlightLatExtent],
  [-180, -oceanHighlightLatExtent]
];
const fallbackLabelAnchors = {
  "north-america": [-103, 47],
  "south-america": [-60, -18],
  europe: [14, 52],
  africa: [20, 2],
  asia: [86, 36],
  australia: [135, -25],
  antarctica: [20, -76],
  "arctic-ocean": [0, 75],
  "atlantic-ocean": [-34, 8],
  "indian-ocean": [76, -22],
  "pacific-ocean": [-150, 0],
  "southern-ocean": [20, -58]
};
const europeGeographicExtent = {
  west: -31,
  south: 30,
  east: 70,
  north: 73.5
};
const europeanRegionalActivityRegions = new Set([
  "western-europe",
  "nordic-countries",
  "baltic-countries",
  "eastern-europe",
  "balkans",
  "central-europe",
  "more-central-europe"
]);
const coContinentOverrideStorageKey = "mappa-co-continent-overrides";
const coContinentOverrideChoices = [
  { id: "north-america", label: "North America" },
  { id: "south-america", label: "South America" },
  { id: "europe", label: "Europe" },
  { id: "africa", label: "Africa" },
  { id: "asia", label: "Asia" },
  { id: "australia", label: "Australia" },
  { id: "antarctica", label: "Antarctica" }
];
const admin1SourceParentCountryIsoA3 = Object.freeze({
  "australia-admin1": "AUS",
  "brazil-admin1": "BRA",
  "china-admin1": "CHN",
  "france-admin1": "FRA",
  "germany-admin1": "DEU",
  "india-admin1": "IND",
  "italy-admin1": "ITA",
  "japan-admin1": "JPN",
  "russia-admin1": "RUS",
  "spain-admin1": "ESP",
  "united-kingdom-admin1": "GBR"
});
const admin1Iso31662PrefixParentCountryIsoA3 = Object.freeze({
  AU: "AUS",
  BR: "BRA",
  CA: "CAN",
  CN: "CHN",
  DE: "DEU",
  ES: "ESP",
  FR: "FRA",
  GB: "GBR",
  IN: "IND",
  IT: "ITA",
  JP: "JPN",
  MX: "MEX",
  RU: "RUS"
});
const parentCountryOutlineLayerIds = [
  "parent-country-outline-halo",
  "parent-country-outline"
];

function isContinentsOceansLearnCameraDebugEnabled() {
  try {
    if (typeof window === "undefined") {
      return false;
    }

    const params = new URLSearchParams(window.location.search);
    return params.has("debugCoLearnCamera") || params.has("debugCoNameCamera");
  } catch {
    return false;
  }
}

function debugContinentsOceansRunnerCamera(label, details = {}) {
  if (!isContinentsOceansLearnCameraDebugEnabled()) {
    return;
  }

  console.warn("[C&O camera][runner]", label, JSON.stringify({
    timestamp: typeof performance !== "undefined" ? Math.round(performance.now()) : Date.now(),
    ...details
  }));
}

// Difficulty rules are intentionally renderer-level: Easy shows all visual
// aids, Medium hides point hints until placement, and Hard keeps accepted
// answers out of the bank without revealing extra map clues.
export const difficultyModes = {
  easy: "easy",
  medium: "medium",
  hard: "hard"
};

function normalizeDifficulty(difficulty) {
  return Object.values(difficultyModes).includes(difficulty) ? difficulty : difficultyModes.easy;
}

function normalizeTargetId(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const mountainRangeColorStyles = Object.freeze({
  "rocky-mountains": {
    family: "rockies",
    fill: "#c18422",
    line: "#7a4611",
    corridor: "#cf922e",
    muted: "#e2c99c"
  },
  "teton-range": {
    family: "rockies",
    fill: "#b75d1f",
    line: "#74320f",
    corridor: "#c86c27",
    muted: "#dfb69c"
  },
  "wasatch-range": {
    family: "rockies",
    fill: "#9f4f2a",
    line: "#67301d",
    corridor: "#b15f35",
    muted: "#d8b2a5"
  },
  "appalachian-mountains": {
    family: "appalachian",
    fill: "#6f8f4e",
    line: "#405b2f",
    corridor: "#789b58",
    muted: "#c8d8b4"
  },
  "blue-ridge-mountains": {
    family: "appalachian",
    fill: "#3f8d86",
    line: "#285b56",
    corridor: "#4c9f96",
    muted: "#b7d8d3"
  },
  "great-smoky-mountains": {
    family: "appalachian",
    fill: "#2f8a66",
    line: "#205f49",
    corridor: "#3f9a73",
    muted: "#b2d7c5"
  },
  "cumberland-mountains": {
    family: "appalachian",
    fill: "#7c8a37",
    line: "#4f5a25",
    corridor: "#8d9a45",
    muted: "#d1d8a8"
  },
  "allegheny-mountains": {
    family: "appalachian",
    fill: "#5f5d36",
    line: "#3e3c24",
    corridor: "#747044",
    muted: "#c7c5a7"
  },
  "cascade-mountains": {
    family: "pacific",
    fill: "#3f7f56",
    line: "#28543a",
    corridor: "#4f9165",
    muted: "#b9d3bf"
  },
  "olympic-mountains": {
    family: "pacific",
    fill: "#2f6655",
    line: "#21473d",
    corridor: "#3e7868",
    muted: "#accbc3"
  },
  "coast-ranges": {
    family: "pacific",
    fill: "#70816f",
    line: "#465246",
    corridor: "#82917e",
    muted: "#c6d0c4"
  },
  "sierra-nevada": {
    family: "pacific-granite",
    fill: "#80686a",
    line: "#574548",
    corridor: "#92787b",
    muted: "#d1c4c5"
  },
  "white-mountains": {
    family: "northeast",
    fill: "#8aa7b7",
    line: "#526f7f",
    corridor: "#9ab5c3",
    muted: "#d4e0e6"
  },
  "green-mountains": {
    family: "northeast",
    fill: "#4f9860",
    line: "#32673e",
    corridor: "#60aa70",
    muted: "#bddbbf"
  },
  "adirondack-mountains": {
    family: "northeast",
    fill: "#477b78",
    line: "#2f5554",
    corridor: "#588e8b",
    muted: "#bad2d0"
  },
  "alaska-range": {
    family: "alaska",
    fill: "#9c724a",
    line: "#65472d",
    corridor: "#ad8156",
    muted: "#d6c5b2"
  },
  "brooks-range": {
    family: "alaska",
    fill: "#6d8292",
    line: "#475b69",
    corridor: "#7e94a4",
    muted: "#c8d4dc"
  },
  "ozark-mountains": {
    family: "interior",
    fill: "#7d8f45",
    line: "#515d2c",
    corridor: "#8d9f55",
    muted: "#d0d8ac"
  },
  "ouachita-mountains": {
    family: "interior",
    fill: "#94693f",
    line: "#5f4228",
    corridor: "#a87a4c",
    muted: "#d7c4ae"
  },
  "black-hills": {
    family: "interior",
    fill: "#536f4b",
    line: "#394d34",
    corridor: "#63805a",
    muted: "#bfccb8"
  }
});

function getMountainRangeColorStyle(target = {}) {
  const targetId = normalizeTargetId(target.id || target.sourceFeatureId || target.name || target.sourceName);
  const sourceId = normalizeTargetId(target.sourceFeatureId || target.id || target.name || target.sourceName);
  const nameId = normalizeTargetId(target.name || target.sourceName || target.id || target.sourceFeatureId);
  const styleId = [targetId, sourceId, nameId].find((id) => mountainRangeColorStyles[id]);

  return styleId ? { styleId, ...mountainRangeColorStyles[styleId] } : null;
}

function parseHexColor(hex) {
  const normalized = typeof hex === "string" ? hex.trim().replace(/^#/, "") : "";

  if (!/^[0-9a-f]{6}$/i.test(normalized)) {
    return null;
  }

  return {
    r: parseInt(normalized.slice(0, 2), 16),
    g: parseInt(normalized.slice(2, 4), 16),
    b: parseInt(normalized.slice(4, 6), 16)
  };
}

function toHexChannel(value) {
  return Math.max(0, Math.min(255, Math.round(value))).toString(16).padStart(2, "0");
}

function mixHexColor(color, mixWith = "#eef3f7", amount = 0.64) {
  const base = parseHexColor(color);
  const overlay = parseHexColor(mixWith);

  if (!base || !overlay) {
    return null;
  }

  return `#${toHexChannel(base.r * (1 - amount) + overlay.r * amount)}${toHexChannel(base.g * (1 - amount) + overlay.g * amount)}${toHexChannel(base.b * (1 - amount) + overlay.b * amount)}`;
}

function hexToRgbaString(color, opacity) {
  const parsed = parseHexColor(color);

  if (!parsed) {
    return `rgba(184, 113, 29, ${opacity})`;
  }

  return `rgba(${parsed.r}, ${parsed.g}, ${parsed.b}, ${opacity})`;
}

function getFallbackOceanZoneFeature(id) {
  const oceanBounds = {
    "arctic-ocean": [[-180, 58], [180, 85]],
    "southern-ocean": [[-180, -85], [180, -46]],
    "atlantic-ocean": [[-82, -58], [32, 72]],
    "indian-ocean": [[18, -55], [132, 38]]
  };

  if (id === "pacific-ocean") {
    return {
      type: "Feature",
      properties: { id },
      geometry: {
        type: "MultiPolygon",
        coordinates: [
          [boundsToRing([[-180, -58], [-68, 72]])],
          [boundsToRing([[116, -58], [180, 72]])]
        ]
      }
    };
  }

  const bounds = oceanBounds[id];

  if (!bounds) {
    return null;
  }

  return {
    type: "Feature",
    properties: { id },
    geometry: {
      type: "Polygon",
      coordinates: [boundsToRing(bounds)]
    }
  };
}

function boundsToRing(bounds) {
  const [[west, south], [east, north]] = bounds;
  return [
    [west, south],
    [east, south],
    [east, north],
    [west, north],
    [west, south]
  ];
}

const emptyFeatureCollection = {
  type: "FeatureCollection",
  features: []
};

const smallTargetMobileMinScreenSizePx = 44;
const smallTargetDesktopMinScreenSizePx = 36;
const smallTargetMobileHitPaddingMaxPx = 36;
const smallTargetDesktopHitPaddingMaxPx = 28;
const smallTargetLearnDesiredMinScreenSizePx = 72;
const smallTargetLearnFocusMaxZoom = 7.8;

export class MapLibreActivityRunner {
  constructor({ maplibregl, container }) {
    this.maplibregl = maplibregl;
    this.container = container;
    this.map = null;
    this.activity = null;
    this.currentView = "overview";
    this.pendingStudyTransition = false;
    this.targetClickHandler = null;
    this.regionSelectHandler = null;
    this.completedIds = [];
    this.selectedTargetId = "";
    this.shapeTargets = [];
    this.pointTargets = [];
    this.overviewPreviewActivity = null;
    this.overviewPreviewCompletedIds = [];
    this.overviewMapSet = "world-europe";
    this.overviewMapView = null;
    this.difficulty = difficultyModes.easy;
    this.pendingDifficultyVisualRefresh = false;
    this.presentationSettings = {};
    this.studyPreviewMode = false;
    this.suppressStudyIntroCameraReason = "";
    this.suppressStudyIntroCameraUntil = 0;
    this.studyIntroCameraTimeoutId = null;
    this.cameraDevOverrideProvider = null;
    this.cameraDevStateChangeHandler = null;
    this.lastCameraDevContext = null;
    this.memoryTrailHighlightIds = [];
    this.memoryTrailCorrectHighlightIds = [];
    this.memoryTrailWrongHighlightIds = [];
    this.coContinentOverrides = [];
    this.coContinentLand = emptyFeatureCollection;
    this.mountainRanges = emptyFeatureCollection;
    this.riverLines = emptyFeatureCollection;
    this.coContinentOverrideDebugEnabled = false;
    this.coContinentOverrideDebugPanel = null;
    this.coContinentOverrideDebugSelection = null;
    this.coContinentOverrideDebugCurrentOverrideId = null;
    this.placementInteractionState = {
      active: false,
      dragging: false
    };
  }

  suppressStudyIntroCameraOnce(reason = "external target focus", ttlMs = 5000) {
    this.suppressStudyIntroCameraReason = reason;
    this.suppressStudyIntroCameraUntil = (
      typeof performance !== "undefined" ? performance.now() : Date.now()
    ) + Math.max(0, ttlMs);
    this.clearStudyIntroCameraTimeout();
  }

  consumeStudyIntroCameraSuppression() {
    const now = typeof performance !== "undefined" ? performance.now() : Date.now();
    if (!this.suppressStudyIntroCameraReason || now > this.suppressStudyIntroCameraUntil) {
      this.suppressStudyIntroCameraReason = "";
      this.suppressStudyIntroCameraUntil = 0;
      return "";
    }

    const reason = this.suppressStudyIntroCameraReason;
    this.suppressStudyIntroCameraReason = "";
    this.suppressStudyIntroCameraUntil = 0;
    return reason;
  }

  clearStudyIntroCameraTimeout() {
    if (!this.studyIntroCameraTimeoutId) {
      return;
    }

    window.clearTimeout(this.studyIntroCameraTimeoutId);
    this.studyIntroCameraTimeoutId = null;
  }

  onTargetClick(handler) {
    this.targetClickHandler = handler;
  }

  onRegionSelect(handler) {
    this.regionSelectHandler = handler;
  }

  setCameraDevOverrideProvider(provider) {
    this.cameraDevOverrideProvider = typeof provider === "function" ? provider : null;
  }

  onCameraDevStateChange(handler) {
    this.cameraDevStateChangeHandler = typeof handler === "function" ? handler : null;
  }

  async load({ activity, worldCountries, oceanZones, coContinentOverrides, coContinentLand, inlandWaters, mountainRanges, riverLines, usStatesAtlas, stateTargets, northAmericaAdmin1, australiaAdmin1, chinaAdmin1, russiaAdmin1, indiaAdmin1, brazilAdmin1, japanAdmin1, germanyAdmin1, franceAdmin1, spainAdmin1, italyAdmin1, unitedKingdomAdmin1 }) {
    this.activity = activity;
    this.worldCountries = worldCountries;
    this.oceanZones = oceanZones || emptyFeatureCollection;
    this.coContinentOverrides = this.getInitialCoContinentOverrides(coContinentOverrides);
    this.coContinentLand = coContinentLand || emptyFeatureCollection;
    this.coContinentOverrideDebugEnabled = this.shouldEnableCoContinentOverrideDebug();
    this.inlandWaters = inlandWaters || emptyFeatureCollection;
    this.mountainRanges = mountainRanges || emptyFeatureCollection;
    this.riverLines = riverLines || emptyFeatureCollection;
    this.usStatesAtlas = usStatesAtlas;
    this.stateTargets = stateTargets;
    this.northAmericaAdmin1 = northAmericaAdmin1 || emptyFeatureCollection;
    this.australiaAdmin1 = australiaAdmin1 || emptyFeatureCollection;
    this.chinaAdmin1 = chinaAdmin1 || emptyFeatureCollection;
    this.russiaAdmin1 = russiaAdmin1 || emptyFeatureCollection;
    this.indiaAdmin1 = indiaAdmin1 || emptyFeatureCollection;
    this.brazilAdmin1 = brazilAdmin1 || emptyFeatureCollection;
    this.japanAdmin1 = japanAdmin1 || emptyFeatureCollection;
    this.germanyAdmin1 = germanyAdmin1 || emptyFeatureCollection;
    this.franceAdmin1 = franceAdmin1 || emptyFeatureCollection;
    this.spainAdmin1 = spainAdmin1 || emptyFeatureCollection;
    this.italyAdmin1 = italyAdmin1 || emptyFeatureCollection;
    this.unitedKingdomAdmin1 = unitedKingdomAdmin1 || emptyFeatureCollection;
    this.shapeTargets = activity.targets.filter((target) => target.kind === "shape");
    this.pointTargets = activity.targets.filter((target) => target.kind === "point");

    this.map = new this.maplibregl.Map({
      container: this.container,
      center: activity.map?.initialView?.center || [-18, 18],
      zoom: activity.map?.initialView?.zoom || 1.25,
      minZoom: 0.8,
      maxZoom: 12,
      projection: { type: "globe" },
      style: {
        version: 8,
        projection: { type: "globe" },
        glyphs: "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf",
        sources: {},
        layers: [
          {
            id: "water-background",
            type: "background",
            paint: {
              "background-color": colors.ocean
            }
          }
        ],
        sky: {
          "sky-color": "#030914",
          "horizon-color": "#040b16",
          "fog-color": "#030914",
          "atmosphere-blend": 0.28
        }
      }
    });
    window.maplibrePocMap = this.map;

    await new Promise((resolve) => {
      this.map.on("load", resolve);
    });

    this.addAtlasBaseLayers();
    this.addOceanRegionLayer();
    this.addOverviewLayers();
    this.addStudyLayers();
    this.setOverviewPreview(null);
    this.updateCoContinentOverrideDebugTool();
  }

  shouldEnableCoContinentOverrideDebug() {
    try {
      return new URLSearchParams(window.location.search).get("debugMap") === "1";
    } catch {
      return false;
    }
  }

  getInitialCoContinentOverrides(fileData) {
    const fileOverrides = Array.isArray(fileData)
      ? fileData
      : fileData?.overrides;
    const overrides = Array.isArray(fileOverrides) ? [...fileOverrides] : [];

    if (!this.shouldEnableCoContinentOverrideDebug()) {
      return overrides;
    }

    return [
      ...overrides,
      ...this.readLocalCoContinentOverrides()
    ];
  }

  readLocalCoContinentOverrides() {
    try {
      const parsed = JSON.parse(window.localStorage?.getItem(coContinentOverrideStorageKey) || "[]");
      return Array.isArray(parsed) ? parsed : parsed?.overrides || [];
    } catch {
      return [];
    }
  }

  writeLocalCoContinentOverrides() {
    if (!this.coContinentOverrideDebugEnabled) {
      return;
    }

    try {
      window.localStorage?.setItem(
        coContinentOverrideStorageKey,
        JSON.stringify(this.coContinentOverrides, null, 2)
      );
    } catch {
      // Debug persistence is best-effort only.
    }
  }

  enterStudyView() {
    if (!this.map.isStyleLoaded() || !this.map.getLayer("state-fill")) {
      if (!this.pendingStudyTransition) {
        this.pendingStudyTransition = true;
        this.map.once("idle", () => {
          this.pendingStudyTransition = false;
          this.enterStudyView();
        });
      }

      return;
    }

    this.currentView = "study";
    this.updatePlacementCursor();
    this.resizeSoon();
    this.updateOceanRegionVisibility();
    this.updateBaseLabelVisibility();
    this.updateHardContextVisibility();
    this.setOverviewVisibility("none");
    this.setUnitedStatesContextVisibility(this.activity.map?.region === "united-states" ? "visible" : "none");
    this.setStudyVisibility("visible");
    this.updateParentCountryOutline();
    this.refreshDifficultyVisuals();

    const suppressedIntroCameraReason = this.consumeStudyIntroCameraSuppression();
    if (suppressedIntroCameraReason) {
      debugContinentsOceansRunnerCamera("enterStudyView intro camera suppressed", {
        requestType: "suppressed",
        source: "enterStudyView",
        activityId: this.activity?.id,
        reason: suppressedIntroCameraReason
      });
      return;
    }

    const regionFlyDuration = 1100;
    const activityId = this.activity?.id;

    debugContinentsOceansRunnerCamera("enterStudyView region fly requested", {
      requestType: "flyTo",
      source: "enterStudyView:regionView",
      activityId,
      camera: {
        center: this.activity.map?.regionView?.center || [-98, 39],
        zoom: this.activity.map?.regionView?.zoom || 3.1,
        duration: regionFlyDuration
      }
    });
    this.moveCamera({
      center: this.activity.map?.regionView?.center || [-98, 39],
      zoom: this.activity.map?.regionView?.zoom || 3.1,
      pitch: 0,
      bearing: 0,
      duration: regionFlyDuration,
      essential: true
    }, {
      cameraContext: "section-overview",
      source: "enterStudyView:regionView",
      requestType: "flyTo",
      activityId
    }, "flyTo");

    this.clearStudyIntroCameraTimeout();
    this.studyIntroCameraTimeoutId = window.setTimeout(() => {
      this.studyIntroCameraTimeoutId = null;
      if (this.currentView === "study" && this.activity?.id === activityId) {
        const studyView = this.activity.map?.studyView || {};
        debugContinentsOceansRunnerCamera("enterStudyView study fit requested", {
          requestType: "fitBounds",
          source: "enterStudyView:studyView",
          activityId,
          camera: {
            bounds: studyView.bounds || [[-74.35, 40.85], [-66.75, 47.55]],
            padding: studyView.padding || { top: 55, right: 46, bottom: 78, left: 46 },
            duration: studyView.duration || 1200
          }
        });
        this.moveCamera({
          bounds: studyView.bounds || [[-74.35, 40.85], [-66.75, 47.55]],
          padding: studyView.padding || { top: 55, right: 46, bottom: 78, left: 46 },
          duration: studyView.duration || 1200,
          essential: true
        }, {
          cameraContext: "study-view",
          source: "enterStudyView:studyView",
          requestType: "fitBounds",
          activityId
        }, "fitBounds");
      }
    }, regionFlyDuration + 100);
  }

  enterOverview(options = {}) {
    this.currentView = "overview";
    this.setPlacementInteractionState({ active: false, dragging: false });
    this.resizeSoon();
    this.updateOceanRegionVisibility();
    this.updateBaseLabelVisibility();
    this.updateHardContextVisibility();
    this.setOverviewVisibility("visible");
    this.setUnitedStatesContextVisibility("none");
    this.setStudyVisibility("none");
    this.updateParentCountryOutline();
    this.updateDifficultyLayerVisibility();
    const overviewView = this.overviewMapView || {
      center: this.activity.map?.initialView?.center || [-18, 18],
      zoom: this.activity.map?.initialView?.zoom || 1.25
    };

    this.moveCamera({
      center: overviewView.center,
      zoom: overviewView.zoom,
      pitch: 0,
      bearing: 0,
      duration: 1000,
      essential: true
    }, {
      cameraContext: options.cameraContext || "overview",
      source: "enterOverview",
      requestType: "flyTo",
      activityId: this.activity?.id,
      skipCameraDevOverride: Boolean(options.skipCameraDevOverride)
    }, "flyTo");
  }

  resizeSoon() {
    window.requestAnimationFrame(() => {
      this.map?.resize();
    });
  }

  setCompletedTargets(completedIds) {
    this.completedIds = Array.from(completedIds);
    this.refreshDifficultyVisuals();
  }

  setSelectedTarget(targetId = "") {
    this.selectedTargetId = targetId || "";
    this.refreshDifficultyVisuals();
  }

  setStudyPreviewMode(isActive) {
    this.studyPreviewMode = Boolean(isActive);
    if (!this.studyPreviewMode) {
      this.memoryTrailHighlightIds = [];
      this.memoryTrailCorrectHighlightIds = [];
      this.memoryTrailWrongHighlightIds = [];
    }
    this.refreshDifficultyVisuals();
  }

  setMemoryTrailHighlight(targetIds = []) {
    this.memoryTrailHighlightIds = Array.isArray(targetIds)
      ? targetIds.filter(Boolean)
      : [targetIds].filter(Boolean);
    this.memoryTrailCorrectHighlightIds = [];
    this.memoryTrailWrongHighlightIds = [];
    this.refreshDifficultyVisuals();
  }

  setMemoryTrailCorrectionHighlight({ correctTargetId = "", wrongTargetId = "" } = {}) {
    this.memoryTrailHighlightIds = [];
    this.memoryTrailCorrectHighlightIds = [correctTargetId].filter(Boolean);
    this.memoryTrailWrongHighlightIds = [wrongTargetId].filter(Boolean);
    this.refreshDifficultyVisuals();
  }

  getMemoryTrailActiveHighlightIds() {
    return [...new Set([
      ...this.memoryTrailHighlightIds,
      ...this.memoryTrailCorrectHighlightIds,
      ...this.memoryTrailWrongHighlightIds
    ])];
  }

  setDifficulty(difficulty) {
    this.difficulty = normalizeDifficulty(difficulty);
    this.refreshDifficultyVisuals();
  }

  setPresentationSettings(settings = {}) {
    this.presentationSettings = { ...settings };
    this.refreshDifficultyVisuals();
  }

  setOverviewPreview(activity, completedIds = []) {
    this.overviewPreviewActivity = activity || null;
    this.overviewPreviewCompletedIds = completedIds;

    const previewSource = this.map?.getSource("overview-preview");

    if (previewSource) {
      previewSource.setData(this.getOverviewPreviewGeoJson());
    }
  }

  setOverviewFeatureCollection(featureCollection = emptyFeatureCollection) {
    this.overviewPreviewActivity = null;
    this.overviewPreviewCompletedIds = [];

    const previewSource = this.map?.getSource("overview-preview");

    if (previewSource) {
      previewSource.setData(featureCollection);
    }
  }

  getOverviewGeoJsonForActivity(activity, completedIds = [], options = {}) {
    if (!activity?.targets?.length) {
      return emptyFeatureCollection;
    }

    const completed = new Set(completedIds);

    return {
      type: "FeatureCollection",
      features: activity.targets
        .map((target) => this.getOverviewPreviewFeature(activity, target, completed))
        .filter(Boolean)
        .map((feature) => ({
          ...feature,
          properties: {
            ...feature.properties,
            activityId: options.activityId || feature.properties.activityId,
            browseLabel: options.label || feature.properties.name
          }
        }))
    };
  }

  getOverviewGeoJsonForCountry(isoA3, options = {}) {
    const normalizedIsoA3 = String(isoA3 || "").toUpperCase();

    if (!normalizedIsoA3 || !this.worldCountries?.features?.length) {
      return emptyFeatureCollection;
    }

    const countryFeature = this.worldCountries.features.find((feature) => {
      const properties = feature.properties || {};
      return [properties.ISO_A3, properties.ADM0_A3, properties.SOV_A3]
        .filter((value) => this.isValidCountryCode(value))
        .map((value) => String(value).toUpperCase())
        .includes(normalizedIsoA3);
    });

    if (!countryFeature) {
      return emptyFeatureCollection;
    }

    const properties = countryFeature.properties || {};

    return {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: {
            ...properties,
            id: options.activityId || properties.id || normalizedIsoA3.toLowerCase(),
            activityId: options.activityId || properties.id || normalizedIsoA3.toLowerCase(),
            browseLabel: options.label || properties.ADMIN || properties.NAME || normalizedIsoA3,
            name: options.label || properties.ADMIN || properties.NAME || normalizedIsoA3,
            completed: false
          },
          geometry: countryFeature.geometry
        }
      ]
    };
  }

  setOverviewMapSet(mapSet, view = null) {
    this.overviewMapSet = mapSet;
    this.overviewMapView = view || this.overviewMapView;

    if (!this.map || this.currentView !== "overview" || !view) {
      return;
    }

    this.moveCamera({
      center: view.center,
      zoom: view.zoom,
      pitch: 0,
      bearing: 0,
      duration: 700,
      essential: true
    }, {
      cameraContext: "overview-map-set",
      source: "setOverviewMapSet",
      requestType: "flyTo",
      activityId: this.activity?.id
    }, "flyTo");
  }

  setMapDragEnabled(isEnabled) {
    if (!this.map) {
      return;
    }

    const method = isEnabled ? "enable" : "disable";
    this.map.dragPan[method]();
    this.map.boxZoom[method]();
  }

  setPlacementInteractionState(state = {}) {
    this.placementInteractionState = {
      active: Boolean(state.active),
      dragging: Boolean(state.dragging)
    };
    this.updatePlacementCursor();
  }

  updatePlacementCursor() {
    if (!this.map) {
      return;
    }

    if (!this.placementInteractionState.active) {
      this.map.getCanvas().style.cursor = "";
      return;
    }

    this.map.getCanvas().style.cursor = this.placementInteractionState.dragging ? "grabbing" : "";
  }

  canUseTargetHoverCursor() {
    return this.currentView === "study" && !this.placementInteractionState.active;
  }

  updateActivity(activity) {
    this.activity = activity;
    this.shapeTargets = activity.targets.filter((target) => target.kind === "shape");
    this.pointTargets = activity.targets.filter((target) => target.kind === "point");
    this.completedIds = [];
    this.selectedTargetId = "";

    const capitalSource = this.map.getSource("study-capitals");
    const shapeSource = this.map.getSource("target-shapes");
    const mountainCorridorSource = this.map.getSource("mountain-range-corridors");
    const mountainSymbolSource = this.map.getSource("mountain-range-symbols");
    const riverLineSource = this.map.getSource("river-lines");

    if (shapeSource) {
      shapeSource.setData(this.getTargetShapeGeoJson());
    }

    if (mountainCorridorSource) {
      mountainCorridorSource.setData(this.getMountainRangeCorridorGeoJson());
    }

    if (mountainSymbolSource) {
      mountainSymbolSource.setData(this.getMountainRangeSymbolGeoJson());
    }

    if (riverLineSource) {
      riverLineSource.setData(this.getRiverLineGeoJson());
    }

    if (capitalSource) {
      capitalSource.setData(this.getCapitalGeoJson());
    }

    this.refreshOceanRegionSource();
    this.refreshStudyFilters();
    this.updateParentCountryOutline();
    this.refreshOceanHighlightImages();
    this.updateOceanRegionVisibility();
    this.updateCoContinentOverrideDebugTool();
    this.refreshDifficultyVisuals();
  }

  getZoom() {
    return this.map?.getZoom() ?? 0;
  }

  setZoom(zoom) {
    this.map?.easeTo({
      zoom,
      duration: 180,
      essential: true
    });
  }

  getCameraDevSnapshot(extra = {}) {
    const center = this.map?.getCenter?.();
    const lastContext = this.lastCameraDevContext || {};

    return {
      currentView: this.currentView,
      activityId: extra.activityId || lastContext.activityId || this.activity?.id || "",
      activityTitle: extra.activityTitle || lastContext.activityTitle || this.activity?.title || "",
      targetId: extra.targetId || lastContext.targetId || "",
      targetLabel: extra.targetLabel || lastContext.targetLabel || "",
      cameraContext: extra.cameraContext || lastContext.cameraContext || "",
      cameraSource: extra.source || lastContext.source || "",
      requestType: extra.requestType || lastContext.requestType || "",
      zoom: this.map?.getZoom?.() ?? null,
      center: center?.toArray?.() || (center ? [center.lng, center.lat] : null),
      bearing: this.map?.getBearing?.() ?? null,
      pitch: this.map?.getPitch?.() ?? null
    };
  }

  normalizeCameraDevMetadata(metadata = {}) {
    return {
      activityId: metadata.activityId || this.activity?.id || "",
      activityTitle: metadata.activityTitle || this.activity?.title || "",
      targetId: metadata.targetId || metadata.target?.id || "",
      targetLabel: metadata.targetLabel || metadata.target?.name || metadata.target?.label || "",
      cameraContext: metadata.cameraContext || metadata.context || "",
      source: metadata.source || "",
      requestType: metadata.requestType || "",
      targetIds: Array.isArray(metadata.targetIds) ? metadata.targetIds.filter(Boolean) : [],
      targetLabels: Array.isArray(metadata.targetLabels) ? metadata.targetLabels.filter(Boolean) : []
    };
  }

  summarizeCameraDevCamera(camera = {}) {
    return {
      center: Array.isArray(camera.center) ? camera.center : null,
      zoom: Number.isFinite(camera.zoom) ? camera.zoom : null,
      bounds: this.hasValidBounds(camera.bounds) ? camera.bounds : null,
      maxZoom: Number.isFinite(camera.maxZoom) ? camera.maxZoom : null,
      bearing: Number.isFinite(camera.bearing) ? camera.bearing : null,
      pitch: Number.isFinite(camera.pitch) ? camera.pitch : null,
      duration: Number.isFinite(camera.duration) ? camera.duration : null
    };
  }

  applyCameraDevOverride(camera = {}, metadata = {}) {
    const normalizedMetadata = this.normalizeCameraDevMetadata(metadata);
    this.lastCameraDevContext = {
      ...normalizedMetadata,
      camera: this.summarizeCameraDevCamera(camera),
      timestamp: Date.now()
    };

    this.notifyCameraDevStateChange();

    if (metadata.skipCameraDevOverride || typeof this.cameraDevOverrideProvider !== "function") {
      return camera;
    }

    let override = null;

    try {
      override = this.cameraDevOverrideProvider(
        normalizedMetadata,
        this.getCameraDevSnapshot(normalizedMetadata)
      );
    } catch (error) {
      console.warn("Camera dev override lookup failed.", error);
      override = null;
    }

    if (!override) {
      return camera;
    }

    return this.mergeCameraDevOverride(camera, override);
  }

  mergeCameraDevOverride(camera = {}, override = {}) {
    const nextCamera = { ...camera };
    const overrideCenter = Array.isArray(override.center) && override.center.length >= 2
      ? [Number(override.center[0]), Number(override.center[1])]
      : null;
    const hasOverrideCenter = overrideCenter?.every(Number.isFinite);
    const hasOverrideZoom = Number.isFinite(Number(override.zoom));
    const hasOverrideBearing = Number.isFinite(Number(override.bearing));
    const hasOverridePitch = Number.isFinite(Number(override.pitch));
    const shouldConvertBoundsCamera = this.hasValidBounds(nextCamera.bounds)
      && (hasOverrideCenter || hasOverrideZoom || hasOverrideBearing || hasOverridePitch);

    if (shouldConvertBoundsCamera) {
      const fallbackCenter = this.getBoundsCenter(nextCamera.bounds);

      return {
        center: hasOverrideCenter ? overrideCenter : fallbackCenter,
        zoom: hasOverrideZoom
          ? Number(override.zoom)
          : (Number.isFinite(nextCamera.maxZoom) ? nextCamera.maxZoom : this.map?.getZoom?.()),
        padding: nextCamera.padding,
        bearing: hasOverrideBearing ? Number(override.bearing) : (Number.isFinite(nextCamera.bearing) ? nextCamera.bearing : 0),
        pitch: hasOverridePitch ? Number(override.pitch) : (Number.isFinite(nextCamera.pitch) ? nextCamera.pitch : 0),
        retainPadding: nextCamera.retainPadding,
        duration: nextCamera.duration,
        essential: nextCamera.essential
      };
    }

    if (hasOverrideCenter) {
      nextCamera.center = overrideCenter;
    }

    if (hasOverrideZoom) {
      nextCamera.zoom = Number(override.zoom);
    }

    if (hasOverrideBearing) {
      nextCamera.bearing = Number(override.bearing);
    }

    if (hasOverridePitch) {
      nextCamera.pitch = Number(override.pitch);
    }

    if (Number.isFinite(Number(override.maxZoom))) {
      nextCamera.maxZoom = Number(override.maxZoom);
    }

    return nextCamera;
  }

  notifyCameraDevStateChange() {
    if (typeof this.cameraDevStateChangeHandler !== "function") {
      return;
    }

    try {
      this.cameraDevStateChangeHandler(this.getCameraDevSnapshot());
    } catch {
      // Dev-tool updates should never interrupt gameplay camera movement.
    }
  }

  moveCamera(camera = {}, metadata = {}, preferredMethod = "easeTo") {
    if (!this.map || !camera) {
      return false;
    }

    const requestedCamera = this.applyCameraDevOverride(camera, metadata);
    const duration = Number.isFinite(requestedCamera.duration) ? requestedCamera.duration : 650;

    this.map.stop();

    if (this.hasValidBounds(requestedCamera.bounds)) {
      this.map.fitBounds(requestedCamera.bounds, {
        padding: requestedCamera.padding,
        maxZoom: requestedCamera.maxZoom,
        retainPadding: requestedCamera.retainPadding ?? false,
        duration,
        essential: true
      });
      return true;
    }

    const currentCenter = this.map.getCenter?.();
    const center = Array.isArray(requestedCamera.center)
      ? requestedCamera.center
      : (currentCenter?.toArray?.() || (currentCenter ? [currentCenter.lng, currentCenter.lat] : null));

    if (!Array.isArray(center)) {
      return false;
    }

    const cameraOptions = {
      center,
      zoom: Number.isFinite(requestedCamera.zoom) ? requestedCamera.zoom : this.map.getZoom?.(),
      padding: requestedCamera.padding,
      pitch: Number.isFinite(requestedCamera.pitch) ? requestedCamera.pitch : this.map.getPitch?.(),
      bearing: Number.isFinite(requestedCamera.bearing) ? requestedCamera.bearing : this.map.getBearing?.(),
      retainPadding: requestedCamera.retainPadding ?? false,
      duration,
      essential: true
    };

    if (preferredMethod === "flyTo") {
      this.map.flyTo(cameraOptions);
    } else {
      this.map.easeTo(cameraOptions);
    }

    return true;
  }

  applyCameraDevCamera(camera = {}) {
    return this.moveCamera(
      {
        center: camera.center,
        zoom: Number.isFinite(Number(camera.zoom)) ? Number(camera.zoom) : undefined,
        bearing: Number.isFinite(Number(camera.bearing)) ? Number(camera.bearing) : undefined,
        pitch: Number.isFinite(Number(camera.pitch)) ? Number(camera.pitch) : undefined,
        duration: Number.isFinite(Number(camera.duration)) ? Number(camera.duration) : 240
      },
      {
        cameraContext: "camera-dev-manual",
        source: "camera-dev-panel",
        requestType: "easeTo",
        skipCameraDevOverride: true
      },
      "easeTo"
    );
  }

  fitCameraDevCurrentTarget(targetId = "") {
    const target = this.activity?.targets?.find((candidate) => candidate.id === targetId)
      || this.activity?.targets?.find((candidate) => candidate.id === this.lastCameraDevContext?.targetId);

    if (!target) {
      return false;
    }

    this.focusTarget(target, {
      cameraContext: "camera-dev-fit-target",
      source: "camera-dev-panel",
      requestType: "focusTarget",
      skipCameraDevOverride: true
    });
    return true;
  }

  fitCameraDevCurrentActivity() {
    if (this.currentView === "study") {
      this.fitStudyView({ skipCameraDevOverride: true, cameraContext: "camera-dev-fit-activity" });
      return true;
    }

    this.enterOverview({ skipCameraDevOverride: true, cameraContext: "camera-dev-fit-activity" });
    return true;
  }

  flyToCameraTarget(target = {}) {
    if (!this.map || !Array.isArray(target.center) || typeof target.zoom !== "number") {
      return Promise.resolve(false);
    }

    return new Promise((resolve) => {
      const duration = typeof target.duration === "number" ? target.duration : 900;
      const finish = () => resolve(true);
      window.setTimeout(finish, duration + 80);
      this.moveCamera({
        center: target.center,
        zoom: target.zoom,
        pitch: 0,
        bearing: 0,
        duration,
        essential: true
      }, {
        cameraContext: target.cameraContext || "camera-target",
        source: "flyToCameraTarget",
        requestType: "flyTo",
        activityId: this.activity?.id,
        targetId: target.id || target.targetId || "",
        targetLabel: target.name || target.label || ""
      }, "flyTo");
    });
  }

  fitStudyView(options = {}) {
    const studyView = this.activity.map?.studyView || {};
    this.moveCamera({
      bounds: studyView.bounds || [[-74.35, 40.85], [-66.75, 47.55]],
      padding: studyView.padding || { top: 55, right: 46, bottom: 78, left: 46 },
      duration: 450,
      essential: true
    }, {
      cameraContext: options.cameraContext || "study-view",
      source: "fitStudyView",
      requestType: "fitBounds",
      activityId: this.activity?.id,
      skipCameraDevOverride: Boolean(options.skipCameraDevOverride)
    }, "fitBounds");
  }

  fitCurrentView() {
    this.refreshDifficultyVisuals();

    if (this.currentView === "study") {
      this.fitStudyView();
      return;
    }

    this.enterOverview();
  }

  focusTarget(target, metadata = {}) {
    if (!this.map || !target) {
      return;
    }

    const camera = this.getTargetFocusCamera(target);

    if (!camera) {
      debugContinentsOceansRunnerCamera("focusTarget skipped", {
        requestType: "focusTarget",
        reason: "missing camera",
        targetId: target.id,
        targetLabel: target.name
      });
      return;
    }

    debugContinentsOceansRunnerCamera("focusTarget requested", {
      requestType: camera.bounds ? "fitBounds" : "easeTo",
      source: metadata.source || "focusTarget",
      targetId: target.id,
      targetLabel: target.name,
      camera
    });
    this.moveCamera({
      ...camera,
      pitch: Number.isFinite(camera.pitch) ? camera.pitch : 0,
      bearing: Number.isFinite(camera.bearing) ? camera.bearing : 0,
      retainPadding: false,
      essential: true
    }, {
      cameraContext: metadata.cameraContext || metadata.context || "target-focus",
      source: metadata.source || "focusTarget",
      requestType: camera.bounds ? "fitBounds" : "easeTo",
      activityId: this.activity?.id,
      targetId: target.id,
      targetLabel: target.name,
      skipCameraDevOverride: Boolean(metadata.skipCameraDevOverride)
    }, camera.bounds ? "fitBounds" : "easeTo");
  }

  focusTargetIfNeeded(target, options = {}) {
    if (!this.map || !target) {
      return false;
    }

    const focusTarget = {
      ...target,
      focusDuration: Number.isFinite(options.duration) ? options.duration : target.focusDuration,
      focusPadding: options.padding || target.focusPadding,
      focusMaxZoom: Number.isFinite(options.maxZoom) ? options.maxZoom : target.focusMaxZoom
    };
    const camera = this.getTargetFocusCamera(focusTarget);

    if (!camera) {
      debugContinentsOceansRunnerCamera("focusTargetIfNeeded skipped", {
        requestType: "focusTargetIfNeeded",
        reason: "missing camera",
        targetId: target.id,
        targetLabel: target.name
      });
      return false;
    }

    if (!options.force && this.isTargetFocusComfortablyVisible(focusTarget, camera, options)) {
      debugContinentsOceansRunnerCamera("focusTargetIfNeeded skipped", {
        requestType: "focusTargetIfNeeded",
        reason: "comfortably visible",
        targetId: target.id,
        targetLabel: target.name,
        camera
      });
      return false;
    }

    debugContinentsOceansRunnerCamera("focusTargetIfNeeded accepted", {
      requestType: "focusTargetIfNeeded",
      source: "focusTargetIfNeeded",
      targetId: target.id,
      targetLabel: target.name,
      force: Boolean(options.force),
      camera
    });
    this.focusTarget(focusTarget, {
      cameraContext: options.cameraContext || options.context || "target-focus-if-needed",
      source: options.source || "focusTargetIfNeeded",
      requestType: "focusTargetIfNeeded",
      skipCameraDevOverride: Boolean(options.skipCameraDevOverride)
    });
    return true;
  }

  isTargetFocusComfortablyVisible(target, camera, options = {}) {
    if (!this.map || !camera) {
      return false;
    }

    const center = Array.isArray(camera.center)
      ? camera.center
      : this.getBoundsCenter(camera.bounds);

    if (!Array.isArray(center)) {
      return false;
    }

    const point = this.map.project(center);
    const canvas = this.map.getCanvas();
    const width = canvas?.clientWidth || 0;
    const height = canvas?.clientHeight || 0;

    if (!width || !height || !point) {
      return false;
    }

    const padding = this.normalizePadding(options.comfortPadding || camera.padding || this.getTargetFocusPadding(target));
    const inComfortableFrame = point.x >= padding.left
      && point.x <= width - padding.right
      && point.y >= padding.top
      && point.y <= height - padding.bottom;

    if (!inComfortableFrame) {
      return false;
    }

    const targetZoom = Number.isFinite(camera.zoom) ? camera.zoom : null;

    if (targetZoom === null) {
      return true;
    }

    const zoomTolerance = Number.isFinite(options.zoomTolerance) ? options.zoomTolerance : 0.8;
    return Math.abs((this.map.getZoom?.() || 0) - targetZoom) <= zoomTolerance;
  }

  getBoundsCenter(bounds) {
    if (!this.hasValidBounds(bounds)) {
      return null;
    }

    return [
      (bounds[0][0] + bounds[1][0]) / 2,
      (bounds[0][1] + bounds[1][1]) / 2
    ];
  }

  fitTargets(targets = [], options = {}) {
    if (!this.map || !Array.isArray(targets) || targets.length === 0) {
      return false;
    }

    const bounds = targets.reduce((combinedBounds, target) => {
      const camera = this.getTargetFocusCamera(target);
      const targetBounds = camera?.bounds || (
        Array.isArray(camera?.center)
          ? [[camera.center[0] - 0.35, camera.center[1] - 0.35], [camera.center[0] + 0.35, camera.center[1] + 0.35]]
          : null
      );

      if (!this.hasValidBounds(targetBounds)) {
        return combinedBounds;
      }

      if (!combinedBounds) {
        return [
          [targetBounds[0][0], targetBounds[0][1]],
          [targetBounds[1][0], targetBounds[1][1]]
        ];
      }

      combinedBounds[0][0] = Math.min(combinedBounds[0][0], targetBounds[0][0]);
      combinedBounds[0][1] = Math.min(combinedBounds[0][1], targetBounds[0][1]);
      combinedBounds[1][0] = Math.max(combinedBounds[1][0], targetBounds[1][0]);
      combinedBounds[1][1] = Math.max(combinedBounds[1][1], targetBounds[1][1]);
      return combinedBounds;
    }, null);

    if (!this.hasValidBounds(bounds)) {
      debugContinentsOceansRunnerCamera("fitTargets skipped", {
        requestType: "fitBounds",
        source: "fitTargets",
        reason: "missing bounds",
        targetIds: targets.map((target) => target.id).filter(Boolean)
      });
      return false;
    }

    debugContinentsOceansRunnerCamera("fitTargets requested", {
      requestType: "fitBounds",
      source: "fitTargets",
      targetIds: targets.map((target) => target.id).filter(Boolean),
      targetLabels: targets.map((target) => target.name).filter(Boolean),
      bounds,
      options
    });
    this.moveCamera({
      bounds,
      padding: this.normalizePadding(options.padding || {
        top: 118,
        right: 64,
        bottom: 198,
        left: 64
      }),
      maxZoom: Number.isFinite(options.maxZoom) ? options.maxZoom : 5.35,
      retainPadding: false,
      duration: Number.isFinite(options.duration) ? options.duration : 850,
      essential: true
    }, {
      cameraContext: options.cameraContext || options.context || "fit-targets",
      source: options.source || "fitTargets",
      requestType: "fitBounds",
      activityId: this.activity?.id,
      targetIds: targets.map((target) => target.id).filter(Boolean),
      targetLabels: targets.map((target) => target.name).filter(Boolean),
      skipCameraDevOverride: Boolean(options.skipCameraDevOverride)
    }, "fitBounds");

    return true;
  }

  getMapInteractionState() {
    return {
      currentView: this.currentView,
      isMoving: Boolean(this.map?.isMoving?.()),
      isEasing: Boolean(this.map?.isEasing?.()),
      isZooming: Boolean(this.map?.isZooming?.()),
      placementInteractionState: { ...this.placementInteractionState }
    };
  }

  getTargetFocusCamera(target) {
    const padding = this.getTargetFocusPadding(target);
    const duration = Number.isFinite(target.focusDuration) ? target.focusDuration : 650;

    if (this.hasValidBounds(target.focusBounds)) {
      return {
        bounds: target.focusBounds,
        padding,
        maxZoom: this.getTargetMaxFocusZoom(target),
        duration
      };
    }

    const explicitCenter = this.getExplicitTargetFocusCenter(target);

    if (explicitCenter) {
      return {
        center: explicitCenter,
        zoom: this.getTargetFocusZoom(target),
        padding,
        duration
      };
    }

    if (target.kind === "point" && Number.isFinite(target.lon) && Number.isFinite(target.lat)) {
      return {
        center: [target.lon, target.lat],
        zoom: this.getTargetFocusZoom(target),
        padding,
        duration
      };
    }

    const feature = this.getTargetShapeFeature(target);
    const bounds = this.getGeometryBounds(feature?.geometry);

    if (!bounds) {
      return null;
    }

    return {
      bounds,
      padding,
      maxZoom: this.getTargetMaxFocusZoom(target),
      duration
    };
  }

  getExplicitTargetFocusCenter(target) {
    if (Array.isArray(target.focusCenter) && target.focusCenter.length >= 2) {
      const [lon, lat] = target.focusCenter;

      if (Number.isFinite(lon) && Number.isFinite(lat)) {
        return [lon, lat];
      }
    }

    if (Number.isFinite(target.focusLon) && Number.isFinite(target.focusLat)) {
      return [target.focusLon, target.focusLat];
    }

    return null;
  }

  getTargetFocusZoom(target) {
    if (Number.isFinite(target.focusZoom)) {
      return target.focusZoom;
    }

    if (target.kind === "point") {
      return 5.2;
    }

    if (this.isOceanTarget(target)) {
      return 1.65;
    }

    return 3.6;
  }

  getTargetMaxFocusZoom(target) {
    if (Number.isFinite(target.focusMaxZoom)) {
      return target.focusMaxZoom;
    }

    if (Number.isFinite(target.focusZoom)) {
      return target.focusZoom;
    }

    return target.kind === "point" ? 6 : 5;
  }

  getTargetFocusPadding(target = {}) {
    if (target.focusPadding && typeof target.focusPadding === "object") {
      return this.normalizePadding(target.focusPadding);
    }

    const compact = this.isCompactFocusLayout();
    const short = typeof window !== "undefined" && window.innerHeight <= 520;

    if (compact) {
      return this.normalizePadding({
        top: short ? 74 : 112,
        right: 30,
        bottom: short ? 104 : 210,
        left: 30
      });
    }

    return this.normalizePadding({
      top: 110,
      right: 90,
      bottom: 150,
      left: 90
    });
  }

  shouldFocusSmallTargetInLearnMode(target, context = {}) {
    return Boolean(
      target
      && target.kind === "shape"
      && !this.isOceanTarget(target)
      && this.isSmallMapTarget(target, context)
    );
  }

  getSmallTargetLearnFocusTarget(target, options = {}) {
    const center = this.getSmallTargetFocusCenter(target);

    if (!center) {
      return target;
    }

    const focusZoom = this.getSmallTargetLearnFocusZoom(target, options);
    return {
      ...target,
      focusCenter: center,
      focusZoom,
      focusMaxZoom: focusZoom
    };
  }

  getSmallTargetFocusCenter(target) {
    const explicitCenter = this.getExplicitTargetFocusCenter(target);

    if (explicitCenter) {
      return explicitCenter;
    }

    if (Array.isArray(target?.label?.anchor) && target.label.anchor.length >= 2) {
      const [longitude, latitude] = target.label.anchor;

      if (Number.isFinite(longitude) && Number.isFinite(latitude)) {
        return [longitude, latitude];
      }
    }

    if (Array.isArray(target?.labelAnchor) && target.labelAnchor.length >= 2) {
      const [longitude, latitude] = target.labelAnchor;

      if (Number.isFinite(longitude) && Number.isFinite(latitude)) {
        return [longitude, latitude];
      }
    }

    const feature = this.getTargetShapeFeature(target);
    const bounds = this.getGeometryBounds(feature?.geometry);

    return this.hasValidBounds(bounds) ? this.getBoundsCenter(bounds) : null;
  }

  getSmallTargetLearnFocusZoom(target, context = {}) {
    if (!this.map) {
      return smallTargetLearnFocusMaxZoom;
    }

    if (Number.isFinite(context.zoom)) {
      return context.zoom;
    }

    if (Number.isFinite(target.focusZoom)) {
      return target.focusZoom;
    }

    const renderedBounds = this.getTargetRenderedScreenBounds(target);
    const currentZoom = Number.isFinite(this.map.getZoom?.()) ? this.map.getZoom() : 4.8;
    const minScreenSize = renderedBounds
      ? Math.max(1, Math.min(renderedBounds.width, renderedBounds.height))
      : 1;
    const desiredMinSize = Number.isFinite(context.desiredMinScreenSizePx)
      ? context.desiredMinScreenSizePx
      : smallTargetLearnDesiredMinScreenSizePx;
    const zoomDelta = Math.log2(Math.max(1, desiredMinSize) / minScreenSize);
    const zoom = currentZoom + Math.max(0, zoomDelta);

    return Math.max(4.6, Math.min(smallTargetLearnFocusMaxZoom, zoom));
  }

  getSmallTargetLearnFocusOptions(target, options = {}) {
    const compact = this.isCompactFocusLayout();
    return {
      duration: Number.isFinite(options.duration) ? options.duration : 720,
      force: options.force !== false,
      maxZoom: Number.isFinite(options.maxZoom) ? options.maxZoom : smallTargetLearnFocusMaxZoom,
      zoomTolerance: Number.isFinite(options.zoomTolerance) ? options.zoomTolerance : 0.35,
      comfortPadding: options.comfortPadding || {
        top: compact ? 104 : 104,
        right: compact ? 34 : 72,
        bottom: compact ? 214 : 174,
        left: compact ? 34 : 72
      },
      padding: options.padding || {
        top: compact ? 98 : 104,
        right: compact ? 34 : 72,
        bottom: compact ? 214 : 174,
        left: compact ? 34 : 72
      }
    };
  }

  isSmallMapTarget(target, context = {}) {
    if (!target || target.kind !== "shape" || this.isOceanTarget(target) || target.type === "river") {
      return false;
    }

    if (target.smallTarget === false || target.smallTargetAssist === false) {
      return false;
    }

    if (this.hasSmallTargetMetadata(target)) {
      return true;
    }

    const renderedBounds = context.renderedBounds || this.getTargetRenderedScreenBounds(target);

    if (!renderedBounds) {
      return false;
    }

    const minSizePx = this.getSmallTargetMinScreenSizePx(context);
    return renderedBounds.width < minSizePx || renderedBounds.height < minSizePx;
  }

  hasSmallTargetMetadata(target = {}) {
    return target.smallTarget === true
      || target.smallTargetAssist === true
      || target.playability?.smallTarget === true
      || target.map?.smallTarget === true;
  }

  getSmallTargetMinScreenSizePx(context = {}) {
    if (Number.isFinite(context.minScreenSizePx)) {
      return context.minScreenSizePx;
    }

    return this.isMobileSmallTargetContext(context)
      ? smallTargetMobileMinScreenSizePx
      : smallTargetDesktopMinScreenSizePx;
  }

  isMobileSmallTargetContext(context = {}) {
    if (typeof context.mobile === "boolean") {
      return context.mobile;
    }

    if (typeof window === "undefined") {
      return false;
    }

    return Boolean(
      window.matchMedia?.("(pointer: coarse)")?.matches
      || window.innerWidth <= 760
    );
  }

  getSmallTargetHitPadding(target, context = {}) {
    const renderedBounds = context.renderedBounds || this.getTargetRenderedScreenBounds(target);

    if (!this.isSmallMapTarget(target, { ...context, renderedBounds })) {
      return 0;
    }

    const mobile = this.isMobileSmallTargetContext(context);
    const maxPadding = mobile ? smallTargetMobileHitPaddingMaxPx : smallTargetDesktopHitPaddingMaxPx;

    if (Number.isFinite(target.smallTargetHitPadding)) {
      return Math.max(0, Math.min(maxPadding, target.smallTargetHitPadding));
    }

    if (!renderedBounds) {
      return maxPadding;
    }

    const minScreenSize = Math.max(0, Math.min(renderedBounds.width, renderedBounds.height));
    const missingPixels = Math.max(0, this.getSmallTargetMinScreenSizePx(context) - minScreenSize);
    const basePadding = missingPixels / 2 + (mobile ? 10 : 8);
    const minPadding = mobile ? 14 : 10;

    return Math.max(minPadding, Math.min(maxPadding, basePadding));
  }

  getTargetRenderedScreenBounds(target) {
    if (!this.map || !target) {
      return null;
    }

    if (target.kind === "point" && Number.isFinite(target.lon) && Number.isFinite(target.lat)) {
      const point = this.map.project([target.lon, target.lat]);
      return this.createRenderedBounds(point.x, point.y, point.x, point.y);
    }

    const feature = this.getTargetShapeFeature(target);
    return this.getGeometryRenderedScreenBounds(feature?.geometry);
  }

  getGeometryRenderedScreenBounds(geometry) {
    if (!this.map || !geometry) {
      return null;
    }

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    this.getGeometryPolygons(geometry).forEach((polygon) => {
      polygon.forEach((ring) => {
        ring.forEach((coordinate) => {
          const [longitude, latitude] = coordinate || [];

          if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) {
            return;
          }

          const point = this.map.project([longitude, latitude]);

          if (!point || !Number.isFinite(point.x) || !Number.isFinite(point.y)) {
            return;
          }

          minX = Math.min(minX, point.x);
          minY = Math.min(minY, point.y);
          maxX = Math.max(maxX, point.x);
          maxY = Math.max(maxY, point.y);
        });
      });
    });

    if (!Number.isFinite(minX) || !Number.isFinite(minY) || !Number.isFinite(maxX) || !Number.isFinite(maxY)) {
      return null;
    }

    return this.createRenderedBounds(minX, minY, maxX, maxY);
  }

  createRenderedBounds(minX, minY, maxX, maxY) {
    return {
      minX,
      minY,
      maxX,
      maxY,
      width: Math.max(0, maxX - minX),
      height: Math.max(0, maxY - minY),
      centerX: (minX + maxX) / 2,
      centerY: (minY + maxY) / 2
    };
  }

  isMapPointInSmallTargetPaddedHit(target, queryPoint, context = {}) {
    if (!this.map || !target || target.kind !== "shape" || this.isOceanTarget(target)) {
      return false;
    }

    if (!Number.isFinite(queryPoint?.[0]) || !Number.isFinite(queryPoint?.[1])) {
      return false;
    }

    if (this.shouldRejectOceanHitOverLand(target.id, queryPoint)) {
      return false;
    }

    const renderedBounds = this.getTargetRenderedScreenBounds(target);
    const padding = this.getSmallTargetHitPadding(target, { ...context, renderedBounds });

    if (!padding || !renderedBounds) {
      return false;
    }

    return queryPoint[0] >= renderedBounds.minX - padding
      && queryPoint[0] <= renderedBounds.maxX + padding
      && queryPoint[1] >= renderedBounds.minY - padding
      && queryPoint[1] <= renderedBounds.maxY + padding;
  }

  getSmallTargetPaddedHitIdsAtPoint(queryPoint, options = {}) {
    if (!this.map || !this.shapeTargets?.length) {
      return [];
    }

    const excludedTargetIds = options.excludeTargetIds || new Set();
    return this.shapeTargets
      .filter((target) => (
        !excludedTargetIds.has(target.id)
        && this.isMapPointInSmallTargetPaddedHit(target, queryPoint, options)
      ))
      .map((target) => {
        const renderedBounds = this.getTargetRenderedScreenBounds(target);
        return {
          target,
          distance: this.getDistanceToRenderedBounds(queryPoint, renderedBounds),
          area: renderedBounds ? renderedBounds.width * renderedBounds.height : Infinity
        };
      })
      .sort((left, right) => left.distance - right.distance || left.area - right.area)
      .map(({ target }) => target.id);
  }

  getDistanceToRenderedBounds(queryPoint, renderedBounds) {
    if (!renderedBounds) {
      return Infinity;
    }

    const dx = queryPoint[0] < renderedBounds.minX
      ? renderedBounds.minX - queryPoint[0]
      : Math.max(0, queryPoint[0] - renderedBounds.maxX);
    const dy = queryPoint[1] < renderedBounds.minY
      ? renderedBounds.minY - queryPoint[1]
      : Math.max(0, queryPoint[1] - renderedBounds.maxY);

    return Math.hypot(dx, dy);
  }

  normalizePadding(padding = {}) {
    const mapElement = typeof this.container === "string"
      ? document.getElementById(this.container)
      : this.container;
    const mapHeight = mapElement?.clientHeight || window.innerHeight || 720;
    const mapWidth = mapElement?.clientWidth || window.innerWidth || 1024;
    const maxVertical = Math.max(24, Math.floor(mapHeight * 0.38));
    const maxHorizontal = Math.max(24, Math.floor(mapWidth * 0.28));

    return {
      top: Math.min(Number(padding.top) || 0, maxVertical),
      right: Math.min(Number(padding.right) || 0, maxHorizontal),
      bottom: Math.min(Number(padding.bottom) || 0, maxVertical),
      left: Math.min(Number(padding.left) || 0, maxHorizontal)
    };
  }

  isCompactFocusLayout() {
    try {
      return window.matchMedia?.("(max-width: 760px), (max-width: 900px) and (max-height: 520px)")?.matches || false;
    } catch {
      return false;
    }
  }

  hasValidBounds(bounds) {
    return Array.isArray(bounds)
      && bounds.length === 2
      && bounds.every((point) => Array.isArray(point) && point.length >= 2 && point.every(Number.isFinite));
  }

  onZoomChange(handler) {
    this.map?.on("zoom", () => {
      handler(this.getZoom());
    });
  }

  addAtlasBaseLayers() {
    this.map.addSource("world-countries", {
      type: "geojson",
      data: this.worldCountries,
      attribution: "Natural Earth public domain"
    });

    this.map.addSource("us-states-atlas", {
      type: "geojson",
      data: this.usStatesAtlas,
      attribution: "U.S. Census Bureau"
    });

    this.map.addLayer({
      id: "world-land",
      type: "fill",
      source: "world-countries",
      paint: {
        "fill-color": this.getPoliticalFillExpression(),
        "fill-opacity": 1,
        "fill-antialias": false
      }
    });

    this.map.addLayer({
      id: "hard-world-context-fill",
      type: "fill",
      source: "world-countries",
      layout: {
        visibility: "none"
      },
      paint: {
        "fill-color": this.getHardWorldContextFillExpression(),
        "fill-opacity": 0.92
      }
    });

    this.map.addLayer({
      id: "country-borders",
      type: "line",
      source: "world-countries",
      paint: {
        "line-color": colors.countryBorder,
        "line-width": [
          "interpolate",
          ["linear"],
          ["zoom"],
          0,
          0.55,
          4,
          1,
          7,
          1.35
        ],
        "line-opacity": this.getCountryBorderOpacityExpression()
      }
    });

    this.map.addLayer({
      id: "us-state-context-fill",
      type: "fill",
      source: "us-states-atlas",
      layout: {
        visibility: "none"
      },
      paint: {
        "fill-color": this.getUsStateContextFillExpression(),
        "fill-opacity": 0.86
      }
    });

    this.map.addLayer({
      id: "us-state-context-line",
      type: "line",
      source: "us-states-atlas",
      layout: {
        visibility: "none"
      },
      paint: {
        "line-color": colors.contextLine,
        "line-width": 1.2,
        "line-opacity": 0.95
      }
    });

    this.map.addSource("inland-waters", {
      type: "geojson",
      data: this.inlandWaters || emptyFeatureCollection,
      attribution: "Natural Earth public domain"
    });

    this.map.addLayer({
      id: "inland-waters-fill",
      type: "fill",
      source: "inland-waters",
      paint: {
        "fill-color": colors.ocean,
        "fill-opacity": 1,
        "fill-antialias": true
      }
    });

    this.map.addLayer({
      id: "inland-waters-line",
      type: "line",
      source: "inland-waters",
      paint: {
        "line-color": "rgba(17, 104, 183, 0.28)",
        "line-width": [
          "interpolate",
          ["linear"],
          ["zoom"],
          0,
          0.35,
          4,
          0.8,
          7,
          1.2
        ],
        "line-opacity": 1
      }
    });

    this.map.addLayer({
      id: "country-labels",
      type: "symbol",
      source: "world-countries",
      minzoom: 1.35,
      layout: {
        visibility: "none",
        "text-field": ["coalesce", ["get", "ABBREV"], ["get", "NAME"]],
        "text-font": ["Open Sans Regular", "Arial Unicode MS Regular"],
        "text-size": [
          "interpolate",
          ["linear"],
          ["zoom"],
          1.5,
          9,
          4,
          11,
          6,
          13
        ],
        "text-transform": "uppercase"
      },
      paint: {
        "text-color": "rgba(43, 55, 76, 0.74)",
        "text-halo-color": "rgba(255, 255, 255, 0.82)",
        "text-halo-width": 1.2,
        "text-opacity": [
          "interpolate",
          ["linear"],
          ["zoom"],
          1.35,
          0,
          1.8,
          0.72,
          5,
          0.92
        ]
      }
    });
  }

  addOceanRegionLayer() {
    this.map.addSource("ocean-regions", {
      type: "geojson",
      data: this.getOceanRegionRenderGeoJson()
    });

    this.map.addLayer({
      id: "ocean-region-fill",
      type: "fill",
      source: "ocean-regions",
      layout: {
        visibility: "visible"
      },
      paint: {
        "fill-color": this.getOceanRegionColorExpression(),
        "fill-opacity": this.getOceanRegionFillOpacityExpression(),
        "fill-antialias": false
      }
    }, "world-land");

    this.map.addLayer({
      id: "ocean-region-line",
      type: "line",
      source: "ocean-regions",
      layout: {
        visibility: "visible"
      },
      paint: {
        "line-color": this.getOceanRegionLineColorExpression(),
        "line-opacity": this.getOceanRegionLineOpacityExpression(),
        "line-width": [
          "interpolate",
          ["linear"],
          ["zoom"],
          1,
          0.7,
          4,
          1.2,
          7,
          1.8
        ]
      }
    }, "world-land");
  }

  getCountryBorderOpacityExpression() {
    return [
      "case",
      ["==", ["coalesce", ["get", "NAME"], ["get", "ADMIN"]], "Antarctica"],
      0,
      0.88
    ];
  }

  getOceanRegionLineOpacityExpression() {
    return 0;
  }

  addOverviewLayers() {
    this.map.addSource("overview-preview", {
      type: "geojson",
      data: emptyFeatureCollection
    });

    this.map.addLayer({
      id: "overview-region-fill",
      type: "fill",
      source: "overview-preview",
      filter: ["==", ["geometry-type"], "Polygon"],
      paint: {
        "fill-color": [
          "case",
          ["boolean", ["get", "completed"], false],
          colors.completedFill,
          colors.previewFill
        ],
        "fill-opacity": [
          "case",
          ["boolean", ["get", "completed"], false],
          0.48,
          0.28
        ]
      }
    });

    this.map.addLayer({
      id: "overview-region-line",
      type: "line",
      source: "overview-preview",
      filter: ["==", ["geometry-type"], "Polygon"],
      paint: {
        "line-color": colors.selectedLine,
        "line-width": [
          "case",
          ["boolean", ["get", "completed"], false],
          2.6,
          1.7
        ],
        "line-opacity": 0.92
      }
    });

    this.map.addLayer({
      id: "overview-point-preview",
      type: "circle",
      source: "overview-preview",
      filter: ["==", ["geometry-type"], "Point"],
      paint: {
        "circle-radius": [
          "case",
          ["boolean", ["get", "completed"], false],
          8,
          6
        ],
        "circle-color": [
          "case",
          ["boolean", ["get", "completed"], false],
          colors.completedFill,
          colors.previewFill
        ],
        "circle-opacity": 0.78,
        "circle-stroke-color": colors.selectedLine,
        "circle-stroke-width": [
          "case",
          ["boolean", ["get", "completed"], false],
          2.5,
          1.5
        ]
      }
    });

    ["overview-region-fill", "overview-point-preview"].forEach((layerId) => {
      this.map.on("mouseenter", layerId, () => {
        this.map.getCanvas().style.cursor = "pointer";
      });
      this.map.on("mouseleave", layerId, () => {
        this.map.getCanvas().style.cursor = "";
      });
    });
    this.map.on("click", (event) => {
      this.handleMapClick(event);
    });
  }

  addStudyLayers() {
    this.map.addSource("study-states", {
      type: "geojson",
      data: this.stateTargets,
      attribution: "U.S. Census Bureau",
      promoteId: "id"
    });

    this.map.addSource("target-shapes", {
      type: "geojson",
      data: this.getTargetShapeGeoJson()
    });

    this.map.addSource("mountain-range-corridors", {
      type: "geojson",
      data: this.getMountainRangeCorridorGeoJson()
    });

    this.map.addSource("mountain-range-symbols", {
      type: "geojson",
      data: this.getMountainRangeSymbolGeoJson()
    });

    this.map.addSource("river-lines", {
      type: "geojson",
      data: this.getRiverLineGeoJson()
    });

    this.map.addSource("study-capitals", {
      type: "geojson",
      data: this.getCapitalGeoJson()
    });

    this.map.addSource("completed-labels", {
      type: "geojson",
      data: this.getCompletedLabelGeoJson()
    });

    this.map.addSource("ocean-target-raster", {
      type: "image",
      url: this.createOceanTargetHighlightImage(),
      coordinates: oceanHighlightTextureBounds
    });

    this.map.addLayer({
      id: "ocean-target-raster",
      type: "raster",
      source: "ocean-target-raster",
      layout: {
        visibility: "none"
      },
      paint: {
        "raster-opacity": 1,
        "raster-fade-duration": 0,
        "raster-resampling": "linear"
      }
    }, "world-land");

    this.map.addLayer({
      id: "state-fill",
      type: "fill",
      source: "target-shapes",
      filter: ["all", ["!=", ["get", "isOceanZone"], true], ["!=", ["get", "physicalFeatureType"], "river"]],
      layout: {
        visibility: "none"
      },
      paint: {
        "fill-color": this.getStateFillExpression(),
        "fill-opacity": this.getShapeFillOpacityExpression(),
        "fill-antialias": false
      }
    });

    this.map.addLayer({
      id: "parent-country-outline-halo",
      type: "line",
      source: "world-countries",
      filter: this.getParentCountryOutlineFilter(),
      layout: {
        visibility: "none"
      },
      paint: {
        "line-color": "#f8fafc",
        "line-opacity": 0.9,
        "line-width": this.getParentCountryOutlineHaloWidthExpression()
      }
    });

    this.map.addLayer({
      id: "parent-country-outline",
      type: "line",
      source: "world-countries",
      filter: this.getParentCountryOutlineFilter(),
      layout: {
        visibility: "none"
      },
      paint: {
        "line-color": "#1e3a8a",
        "line-opacity": 0.82,
        "line-width": this.getParentCountryOutlineWidthExpression()
      }
    });

    this.map.addLayer({
      id: "state-line",
      type: "line",
      source: "target-shapes",
      filter: ["!=", ["get", "physicalFeatureType"], "river"],
      layout: {
        visibility: "none"
      },
      paint: {
        "line-color": this.getStateLineExpression(),
        "line-opacity": this.getShapeLineOpacityExpression(),
        "line-width": this.getShapeLineWidthExpression()
      }
    });

    this.map.addLayer({
      id: "mountain-range-corridor",
      type: "line",
      source: "mountain-range-corridors",
      layout: {
        visibility: "none",
        "line-cap": "round",
        "line-join": "round"
      },
      paint: {
        "line-color": this.getMountainRangeCorridorColorExpression(),
        "line-width": this.getMountainRangeCorridorWidthExpression(),
        "line-opacity": this.getMountainRangeCorridorOpacityExpression(),
        "line-blur": ["coalesce", ["get", "corridorBlurPx"], 9]
      }
    });

    this.ensureMountainRangeImages();

    this.map.addLayer({
      id: "mountain-range-symbol-glow",
      type: "symbol",
      source: "mountain-range-symbols",
      filter: [
        "all",
        ["==", ["get", "hasStylizedMountainRangeArt"], true],
        ["!=", ["get", "visualOnlyContinuation"], true]
      ],
      layout: {
        visibility: "none",
        "icon-image": ["coalesce", ["get", "mountainRangeGlowImage"], "mappa-mountain-range-glow"],
        "icon-size": this.getMountainRangeSymbolGlowSizeExpression(),
        "icon-allow-overlap": true,
        "icon-ignore-placement": true
      },
      paint: {
        "icon-opacity": this.getMountainRangeSymbolGlowOpacityExpression()
      }
    });

    this.map.addLayer({
      id: "mountain-range-symbol",
      type: "symbol",
      source: "mountain-range-symbols",
      layout: {
        visibility: "none",
        "icon-image": ["coalesce", ["get", "mountainRangeGlyphImage"], "mappa-mountain-range-glyph"],
        "icon-size": this.getMountainRangeSymbolSizeExpression(),
        "icon-allow-overlap": true,
        "icon-ignore-placement": true
      },
      paint: {
        "icon-opacity": this.getMountainRangeSymbolOpacityExpression()
      }
    });

    this.map.addLayer({
      id: "target-hit-fill",
      type: "fill",
      source: "target-shapes",
      layout: {
        visibility: "none"
      },
      paint: {
        "fill-color": colors.neutralMarker,
        "fill-opacity": [
          "case",
          ["boolean", ["get", "isOceanZone"], false],
          0,
          ["boolean", ["get", "suppressInternalTargetLines"], false],
          0,
          ["boolean", ["get", "hasStylizedMountainRangeArt"], false],
          0,
          0.01
        ]
      }
    });

    this.map.addLayer({
      id: "river-line",
      type: "line",
      source: "river-lines",
      layout: {
        visibility: "none",
        "line-cap": "round",
        "line-join": "round"
      },
      paint: {
        "line-color": this.getRiverLineColorExpression(),
        "line-width": this.getRiverLineWidthExpression(),
        "line-opacity": this.getRiverLineOpacityExpression()
      }
    });

    this.map.addLayer({
      id: "river-hit-line",
      type: "line",
      source: "river-lines",
      layout: {
        visibility: "none",
        "line-cap": "round",
        "line-join": "round"
      },
      paint: {
        "line-color": colors.riverLine,
        "line-width": this.getRiverHitWidthExpression(),
        "line-opacity": 0.01
      }
    });

    this.map.addLayer({
      id: "capital-marker-halo",
      type: "circle",
      source: "study-capitals",
      filter: ["==", ["get", "capitalMarkerType"], "city"],
      layout: {
        visibility: "none"
      },
      paint: {
        "circle-radius": [
          "interpolate",
          ["linear"],
          ["zoom"],
          4,
          8,
          7,
          10
        ],
        "circle-color": colors.markerHalo,
        "circle-opacity": 0.14
      }
    });

    this.ensureCapitalMarkerImages();

    this.map.addLayer({
      id: "capital-marker",
      type: "circle",
      source: "study-capitals",
      filter: ["==", ["get", "capitalMarkerType"], "city"],
      layout: {
        visibility: "none"
      },
      paint: {
        "circle-radius": this.getCapitalRadiusExpression(),
        "circle-color": this.getCapitalFillExpression(),
        "circle-stroke-color": colors.neutralMarkerStroke,
        "circle-stroke-width": 2
      }
    });

    this.map.addLayer({
      id: "national-capital-ring",
      type: "circle",
      source: "study-capitals",
      filter: ["==", ["get", "capitalMarkerType"], "national-capital"],
      layout: {
        visibility: "none"
      },
      paint: {
        "circle-radius": [
          "case",
          ["in", ["get", "id"], ["literal", this.getMemoryTrailActiveHighlightIds()]],
          9,
          ["in", ["get", "id"], ["literal", this.completedIds]],
          8,
          7
        ],
        "circle-color": colors.neutralMarker,
        "circle-stroke-color": colors.neutralMarkerStroke,
        "circle-stroke-width": 2,
        "circle-opacity": this.getCapitalOpacityExpression(),
        "circle-stroke-opacity": this.getCapitalStrokeOpacityExpression()
      }
    });

    this.map.addLayer({
      id: "state-capital-star",
      type: "symbol",
      source: "study-capitals",
      filter: ["==", ["get", "capitalMarkerType"], "state-capital"],
      layout: {
        visibility: "none",
        "icon-image": "mappa-state-capital-star",
        "icon-size": [
          "interpolate",
          ["linear"],
          ["zoom"],
          4,
          0.82,
          7,
          1
        ],
        "icon-allow-overlap": true,
        "icon-ignore-placement": true
      },
      paint: {
        "icon-opacity": this.getCapitalOpacityExpression()
      }
    });

    this.map.addLayer({
      id: "national-capital-star",
      type: "symbol",
      source: "study-capitals",
      filter: ["==", ["get", "capitalMarkerType"], "national-capital"],
      layout: {
        visibility: "none",
        "icon-image": "mappa-national-capital-star-ring",
        "icon-size": [
          "interpolate",
          ["linear"],
          ["zoom"],
          4,
          0.82,
          7,
          1
        ],
        "icon-allow-overlap": true,
        "icon-ignore-placement": true
      },
      paint: {
        "icon-opacity": this.getCapitalOpacityExpression()
      }
    });

    this.map.addLayer({
      id: "capital-hit",
      type: "circle",
      source: "study-capitals",
      layout: {
        visibility: "none"
      },
      paint: {
        "circle-radius": [
          "get",
          "easyHitRadius"
        ],
        "circle-color": colors.neutralMarker,
        "circle-opacity": 0.01,
        "circle-stroke-opacity": 0
      }
    });

    this.map.addLayer({
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

    ["state-fill", "target-hit-fill", "river-hit-line", "capital-hit", "capital-marker", "capital-marker-halo", "state-capital-star", "national-capital-ring", "national-capital-star"].forEach((layerId) => {
      this.map.on("mouseenter", layerId, () => {
        if (this.canUseTargetHoverCursor()) {
          this.map.getCanvas().style.cursor = "pointer";
        }
      });
      this.map.on("mouseleave", layerId, () => {
        if (this.placementInteractionState.active) {
          this.updatePlacementCursor();
        } else {
          this.map.getCanvas().style.cursor = "";
        }
      });
    });
  }

  handleMapClick(event) {
    if (this.handleCoContinentOverrideDebugMapClick(event)) {
      return;
    }

    if (this.isNavigationDebugEnabled()) {
      console.log("[map-click-handler]", {
        currentView: this.currentView,
        point: event.point,
        lngLat: event.lngLat
      });
    }

    if (this.currentView === "overview") {
      this.targetClickHandler?.(event.point);
      return;
    }

    this.targetClickHandler?.(event.point);
  }

  updateCoContinentOverrideDebugTool() {
    if (!this.coContinentOverrideDebugEnabled) {
      this.destroyCoContinentOverrideDebugTool();
      return;
    }

    if (!this.isContinentsOceansActivity()) {
      this.destroyCoContinentOverrideDebugTool();
      return;
    }

    this.ensureCoContinentOverrideDebugPanel();
    this.renderCoContinentOverrideDebugPanel();
  }

  destroyCoContinentOverrideDebugTool() {
    this.coContinentOverrideDebugPanel?.remove();
    this.coContinentOverrideDebugPanel = null;
    this.coContinentOverrideDebugSelection = null;
    this.coContinentOverrideDebugCurrentOverrideId = null;
  }

  ensureCoContinentOverrideDebugPanel() {
    if (this.coContinentOverrideDebugPanel) {
      return;
    }

    const panel = document.createElement("section");
    panel.className = "co-continent-override-debug";
    panel.style.cssText = [
      "position:fixed",
      "right:12px",
      "top:92px",
      "z-index:9999",
      "width:min(360px,calc(100vw - 24px))",
      "max-height:calc(100vh - 120px)",
      "overflow:auto",
      "padding:12px",
      "border:1px solid rgba(23,32,51,.22)",
      "border-radius:10px",
      "background:rgba(255,255,255,.96)",
      "box-shadow:0 18px 44px rgba(15,23,42,.2)",
      "font:13px/1.35 system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",
      "color:#172033"
    ].join(";");
    document.body.appendChild(panel);
    this.coContinentOverrideDebugPanel = panel;
  }

  renderCoContinentOverrideDebugPanel(message = "") {
    if (!this.coContinentOverrideDebugPanel) {
      return;
    }

    const panel = this.coContinentOverrideDebugPanel;
    panel.replaceChildren();

    const title = document.createElement("h2");
    title.textContent = "C&O Continent Overrides";
    title.style.cssText = "margin:0 0 6px;font-size:15px;";
    panel.appendChild(title);

    const summary = document.createElement("p");
    summary.textContent = message || "Click a rendered land feature, choose the matching row, then assign a continent.";
    summary.style.cssText = "margin:0 0 10px;color:#475569;";
    panel.appendChild(summary);

    if (this.coContinentOverrideDebugSelection?.features?.length) {
      const list = document.createElement("div");
      list.style.cssText = "display:grid;gap:6px;margin-bottom:10px;";
      this.coContinentOverrideDebugSelection.features.forEach((feature, index) => {
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = this.getCoDebugFeatureLabel(feature, index);
        button.style.cssText = this.getCoDebugButtonStyle(index === this.coContinentOverrideDebugSelection.selectedIndex);
        button.addEventListener("click", () => {
          this.coContinentOverrideDebugSelection.selectedIndex = index;
          this.renderCoContinentOverrideDebugPanel();
        });
        list.appendChild(button);
      });
      panel.appendChild(list);

      const continentRow = document.createElement("div");
      continentRow.style.cssText = "display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px;";
      coContinentOverrideChoices.forEach((continent) => {
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = continent.label;
        button.style.cssText = this.getCoDebugButtonStyle(false);
        button.addEventListener("click", () => this.applyCoContinentOverride(continent));
        continentRow.appendChild(button);
      });
      panel.appendChild(continentRow);
    }

    const actions = document.createElement("div");
    actions.style.cssText = "display:flex;flex-wrap:wrap;gap:6px;border-top:1px solid rgba(148,163,184,.35);padding-top:10px;";

    [
      ["Copy Overrides JSON", () => this.copyCoContinentOverridesJson()],
      ["Clear Override", () => this.clearCurrentCoContinentOverride()],
      ["Clear All Overrides", () => this.clearAllCoContinentOverrides()]
    ].forEach(([label, handler]) => {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = label;
      button.style.cssText = this.getCoDebugButtonStyle(false);
      button.addEventListener("click", handler);
      actions.appendChild(button);
    });
    panel.appendChild(actions);

    const count = document.createElement("p");
    count.textContent = `${this.coContinentOverrides.length} override${this.coContinentOverrides.length === 1 ? "" : "s"} loaded.`;
    count.style.cssText = "margin:10px 0 0;color:#64748b;font-size:12px;";
    panel.appendChild(count);
  }

  getCoDebugButtonStyle(active) {
    return [
      "appearance:none",
      "border:1px solid rgba(71,85,105,.3)",
      "border-radius:7px",
      "padding:7px 9px",
      "font:inherit",
      "text-align:left",
      "cursor:pointer",
      active ? "background:#dbeafe" : "background:#fff",
      active ? "color:#0f172a" : "color:#172033"
    ].join(";");
  }

  getCoDebugFeatureLabel(feature, index) {
    const properties = feature.properties || {};
    const layerId = feature.layerId || feature.layer?.id || "unknown-layer";
    const name = properties.name || properties.NAME || properties.NAME_LONG || properties.ADMIN || properties.id || feature.id || "unnamed";
    const continent = properties.CONTINENT || properties.id || "n/a";

    return `${index + 1}. ${layerId} - ${name} (${continent})`;
  }

  getCoDebugFeaturePriority(feature) {
    const layerId = feature.layerId || "";

    if (layerId === "state-fill") {
      return 0;
    }

    if (layerId === "state-line") {
      return 1;
    }

    if (layerId === "target-hit-fill") {
      return 2;
    }

    if (layerId === "country-borders") {
      return 3;
    }

    if (layerId === "world-land") {
      return 8;
    }

    return 9;
  }

  handleCoContinentOverrideDebugMapClick(event) {
    if (!this.coContinentOverrideDebugEnabled || !this.isContinentsOceansActivity() || !this.map) {
      return false;
    }

    const point = event.point || { x: 0, y: 0 };
    const box = [
      [point.x - 5, point.y - 5],
      [point.x + 5, point.y + 5]
    ];
    const rendered = this.map.queryRenderedFeatures(box)
      .filter((feature) => this.isCoDebugInspectableFeature(feature))
      .map((feature) => this.toCoDebugRenderedFeature(feature))
      .sort((left, right) => this.getCoDebugFeaturePriority(left) - this.getCoDebugFeaturePriority(right));

    this.coContinentOverrideDebugSelection = {
      clickedLngLat: [event.lngLat.lng, event.lngLat.lat],
      features: rendered,
      selectedIndex: 0
    };
    this.renderCoContinentOverrideDebugPanel(
      rendered.length
        ? `${rendered.length} rendered feature${rendered.length === 1 ? "" : "s"} under click.`
        : "No inspectable land/fill features under that click."
    );

    return true;
  }

  isCoDebugInspectableLayer(layerId = "") {
    return /(land|fill|target|state|country|continent)/i.test(layerId)
      && !/ocean|water|capital|label/i.test(layerId);
  }

  isCoDebugInspectableFeature(feature) {
    const properties = feature?.properties || {};
    const label = [
      properties.id,
      properties.name,
      properties.NAME,
      properties.NAME_LONG,
      properties.ocean
    ].join(" ");

    return this.isCoDebugInspectableLayer(feature?.layer?.id)
      && properties.isOceanZone !== true
      && properties.isOceanZone !== "true"
      && !/ocean/i.test(label);
  }

  toCoDebugRenderedFeature(feature) {
    const properties = feature.properties || {};

    return {
      layerId: feature.layer?.id || null,
      sourceId: feature.layer?.source || feature.source || null,
      sourceLayer: feature.sourceLayer || feature.layer?.["source-layer"] || null,
      featureId: feature.id ?? properties.id ?? null,
      properties: this.pickCoDebugProperties(properties)
    };
  }

  pickCoDebugProperties(properties = {}) {
    const picked = {};
    [
      "id",
      "name",
      "NAME",
      "NAME_LONG",
      "ADMIN",
      "GEOUNIT",
      "SUBUNIT",
      "ISO_A3",
      "ADM0_A3",
      "SOV_A3",
      "CONTINENT",
      "TYPE"
    ].forEach((key) => {
      if (properties[key] !== undefined && properties[key] !== null && properties[key] !== "") {
        picked[key] = properties[key];
      }
    });
    return picked;
  }

  applyCoContinentOverride(continent) {
    const selection = this.coContinentOverrideDebugSelection;
    const selectedFeature = selection?.features?.[selection.selectedIndex || 0];
    const sourceMatch = selection
      ? this.findCoSourcePolygonAtLngLat(selection.clickedLngLat, selectedFeature)
      : null;

    if (!selection || !selectedFeature || !sourceMatch) {
      this.renderCoContinentOverrideDebugPanel("No source land polygon found for that click.");
      return;
    }

    const override = {
      id: `co-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
      assignedContinent: continent.label,
      assignedContinentId: continent.id,
      clickedLngLat: selection.clickedLngLat.map((value) => Number(value.toFixed(5))),
      layerId: selectedFeature.layerId,
      sourceId: selectedFeature.sourceId,
      sourceLayer: selectedFeature.sourceLayer,
      featureId: selectedFeature.featureId,
      polygonBounds: sourceMatch.bounds,
      match: {
        properties: this.pickCoDebugProperties(sourceMatch.feature.properties || {})
      },
      renderedFeature: selectedFeature
    };

    this.coContinentOverrides = [
      ...this.coContinentOverrides.filter((candidate) => !this.areRoundedBoundsEqual(candidate.polygonBounds, override.polygonBounds)),
      override
    ];
    this.coContinentOverrideDebugCurrentOverrideId = override.id;
    this.writeLocalCoContinentOverrides();
    this.refreshCoContinentOverridePreview();
    this.renderCoContinentOverrideDebugPanel(`Assigned selected polygon to ${continent.label}.`);
  }

  findCoSourcePolygonAtLngLat(clickedLngLat, renderedFeature = null) {
    const point = [clickedLngLat[0], clickedLngLat[1]];
    const renderedProperties = renderedFeature?.properties || {};
    const candidates = [];
    const generatedMatch = this.findCoGeneratedLandPolygonAtLngLat(point, renderedFeature);

    if (generatedMatch) {
      return generatedMatch;
    }

    this.worldCountries.features.forEach((feature) => {
      const properties = feature.properties || {};
      const propertyScore = this.getCoDebugPropertyScore(properties, renderedProperties);
      const polygons = this.getGeometryPolygons(feature.geometry);

      polygons.forEach((polygon) => {
        const bounds = this.getRoundedBounds(polygon);

        if (!this.isPointInPolygon(point, polygon) && !this.isPointInBounds(point, bounds, 0.5)) {
          return;
        }

        candidates.push({
          feature,
          polygon,
          bounds,
          score: propertyScore,
          area: this.getBoundsArea(bounds)
        });
      });
    });

    candidates.sort((left, right) => right.score - left.score || left.area - right.area);
    return candidates[0] || this.findCoSourcePolygonByRenderedFeature(renderedFeature);
  }

  findCoGeneratedLandPolygonAtLngLat(point, renderedFeature = null) {
    if (!this.coContinentLand?.features?.length) {
      return null;
    }

    const renderedProperties = renderedFeature?.properties || {};
    const candidates = [];

    this.coContinentLand.features.forEach((feature) => {
      const properties = feature.properties || {};
      const propertyScore = this.getCoDebugPropertyScore(properties, renderedProperties);

      this.getGeometryPolygons(feature.geometry).forEach((polygon) => {
        const bounds = this.getRoundedBounds(polygon);

        if (!this.isPointInPolygon(point, polygon) && !this.isPointInBounds(point, bounds, 0.5)) {
          return;
        }

        candidates.push({
          feature,
          polygon,
          bounds,
          score: propertyScore + 10,
          area: this.getBoundsArea(bounds)
        });
      });
    });

    candidates.sort((left, right) => right.score - left.score || left.area - right.area);
    return candidates[0] || null;
  }

  findCoSourcePolygonByRenderedFeature(renderedFeature) {
    const renderedProperties = renderedFeature?.properties || {};
    const candidates = [];

    this.worldCountries.features.forEach((feature) => {
      const score = this.getCoDebugPropertyScore(feature.properties || {}, renderedProperties);

      if (score <= 0) {
        return;
      }

      this.getGeometryPolygons(feature.geometry).forEach((polygon) => {
        const bounds = this.getRoundedBounds(polygon);
        candidates.push({
          feature,
          polygon,
          bounds,
          score,
          area: this.getBoundsArea(bounds)
        });
      });
    });

    candidates.sort((left, right) => right.score - left.score || left.area - right.area);
    return candidates[0] || null;
  }

  getCoDebugPropertyScore(properties, renderedProperties) {
    return [
      "id",
      "NAME",
      "NAME_LONG",
      "ADMIN",
      "GEOUNIT",
      "SUBUNIT",
      "ISO_A3",
      "ADM0_A3",
      "CONTINENT"
    ].reduce((score, key) => (
      renderedProperties[key] && properties[key] === renderedProperties[key] ? score + 1 : score
    ), 0);
  }

  getBoundsArea(bounds) {
    return Math.abs((bounds[2] - bounds[0]) * (bounds[3] - bounds[1]));
  }

  isPointInBounds([longitude, latitude], bounds, padding = 0) {
    return longitude >= bounds[0] - padding
      && longitude <= bounds[2] + padding
      && latitude >= bounds[1] - padding
      && latitude <= bounds[3] + padding;
  }

  isPointInPolygon(point, polygon) {
    if (!polygon?.length || !this.isPointInRing(point, polygon[0])) {
      return false;
    }

    return !polygon.slice(1).some((ring) => this.isPointInRing(point, ring));
  }

  isPointInRing([x, y], ring) {
    let inside = false;

    for (let index = 0, previous = ring.length - 1; index < ring.length; previous = index++) {
      const [xi, yi] = ring[index];
      const [xj, yj] = ring[previous];
      const intersects = ((yi > y) !== (yj > y))
        && (x < ((xj - xi) * (y - yi)) / ((yj - yi) || Number.EPSILON) + xi);

      if (intersects) {
        inside = !inside;
      }
    }

    return inside;
  }

  refreshCoContinentOverridePreview() {
    const shapeSource = this.map?.getSource("target-shapes");

    if (shapeSource) {
      shapeSource.setData(this.getTargetShapeGeoJson());
    }

    this.refreshDifficultyVisuals();
    this.refreshMapRender();
  }

  copyCoContinentOverridesJson() {
    const text = JSON.stringify({ overrides: this.coContinentOverrides }, null, 2);
    navigator.clipboard?.writeText(text)
      .then(() => this.renderCoContinentOverrideDebugPanel("Overrides JSON copied."))
      .catch(() => this.renderCoContinentOverrideDebugPanel(text));
  }

  clearCurrentCoContinentOverride() {
    const id = this.coContinentOverrideDebugCurrentOverrideId;

    if (!id) {
      this.renderCoContinentOverrideDebugPanel("No current override selected.");
      return;
    }

    this.coContinentOverrides = this.coContinentOverrides.filter((override) => override.id !== id);
    this.coContinentOverrideDebugCurrentOverrideId = null;
    this.writeLocalCoContinentOverrides();
    this.refreshCoContinentOverridePreview();
    this.renderCoContinentOverrideDebugPanel("Cleared the current override.");
  }

  clearAllCoContinentOverrides() {
    this.coContinentOverrides = [];
    this.coContinentOverrideDebugCurrentOverrideId = null;
    this.writeLocalCoContinentOverrides();
    this.refreshCoContinentOverridePreview();
    this.renderCoContinentOverrideDebugPanel("Cleared all local and loaded overrides for this debug session.");
  }

  getOverviewPreviewGeoJson() {
    const activity = this.overviewPreviewActivity;

    if (!activity) {
      return emptyFeatureCollection;
    }

    if (activity.targets?.length) {
      const completedIds = new Set(this.overviewPreviewCompletedIds);

      return {
        type: "FeatureCollection",
        features: activity.targets
          .map((target) => this.getOverviewPreviewFeature(activity, target, completedIds))
          .filter(Boolean)
      };
    }

    if (!activity.previewBounds) {
      return emptyFeatureCollection;
    }

    return {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: {
            id: activity.id,
            activityId: activity.id,
            name: activity.title,
            completed: false
          },
          geometry: {
            type: "Polygon",
            coordinates: [this.boundsToPolygon(activity.previewBounds)]
          }
        }
      ]
    };
  }

  getOverviewPreviewFeature(activity, target, completedIds) {
    const baseProperties = {
      id: target.id,
      activityId: activity.id,
      name: target.name,
      completed: completedIds.has(target.id)
    };

    if (target.kind === "point") {
      if (!Number.isFinite(target.lon) || !Number.isFinite(target.lat)) {
        return null;
      }

      return {
        type: "Feature",
        properties: baseProperties,
        geometry: {
          type: "Point",
          coordinates: [target.lon, target.lat]
        }
      };
    }

    const sourceFeature = this.findSourceShapeFeature(target, activity);

    if (!sourceFeature) {
      return null;
    }

    return {
      type: "Feature",
      properties: {
        ...sourceFeature.properties,
        ...baseProperties
      },
      geometry: sourceFeature.geometry
    };
  }

  boundsToPolygon(bounds) {
    const [[west, south], [east, north]] = bounds;

    return [
      [west, south],
      [east, south],
      [east, north],
      [west, north],
      [west, south]
    ];
  }

  getTargetIdAtMapPoint(point, selectedTarget = null, options = {}) {
    return this.getTargetIdsAtMapPoint(point, selectedTarget, options)[0] || null;
  }

  getTargetIdsAtClientPoint(clientX, clientY, selectedTarget = null, options = {}) {
    if (!this.map || this.currentView !== "study") {
      return [];
    }

    const rect = this.map.getContainer().getBoundingClientRect();
    const point = {
      x: clientX - rect.left,
      y: clientY - rect.top
    };

    return this.getTargetIdsAtMapPoint(point, selectedTarget, options);
  }

  getTargetIdsAtMapPoint(point, selectedTarget = null, options = {}) {
    if (!this.map) {
      return [];
    }

    const queryPoint = Array.isArray(point) ? point : [point.x, point.y];

    if (!Number.isFinite(queryPoint[0]) || !Number.isFinite(queryPoint[1])) {
      return [];
    }

    const targetIds = [];

    if (!selectedTarget || selectedTarget.kind === "point") {
      const pointFeatures = this.map.queryRenderedFeatures(queryPoint, {
        layers: ["capital-hit"]
      });

      pointFeatures.forEach((feature) => {
        if (!targetIds.includes(feature.properties.id)) {
          targetIds.push(feature.properties.id);
        }
      });

      if (
        selectedTarget?.kind === "point"
        && this.getDifficultyVisualState().isEasy
        && selectedTarget.easyAcceptShapeTargetId
        && this.isMapPointInsideStateTarget(queryPoint, selectedTarget.easyAcceptShapeTargetId)
        && !targetIds.includes(selectedTarget.id)
      ) {
        targetIds.push(selectedTarget.id);
      }
    }

    if (selectedTarget?.kind === "point") {
      return targetIds;
    }

    if (!selectedTarget || selectedTarget.kind === "shape") {
      const stateFeatures = this.map.queryRenderedFeatures(queryPoint, {
        layers: ["target-hit-fill", "river-hit-line"]
      });
      const exactShapeTargetIds = [];

      stateFeatures.forEach((feature) => {
        if (!exactShapeTargetIds.includes(feature.properties.id)) {
          exactShapeTargetIds.push(feature.properties.id);
        }
      });

      if (stateFeatures.length === 0 && this.currentView === "study") {
        this.getFallbackShapeTargetIdsAtPoint(queryPoint, selectedTarget).forEach((targetId) => {
          if (!exactShapeTargetIds.includes(targetId)) {
            exactShapeTargetIds.push(targetId);
          }
        });
      }

      const priorityTarget = options.priorityTarget?.kind === "shape"
        ? options.priorityTarget
        : (selectedTarget?.kind === "shape" ? selectedTarget : null);
      const shapeTargetIds = this.getPrioritizedShapeTargetIdsAtPoint(queryPoint, exactShapeTargetIds, {
        priorityTarget,
        includeOtherSmallTargetHits: !selectedTarget || Boolean(options.priorityTarget)
      });

      shapeTargetIds.forEach((targetId) => {
        if (!targetIds.includes(targetId)) {
          targetIds.push(targetId);
        }
      });
    }

    return this.filterContinentsOceansOceanHitsAtPoint(targetIds, queryPoint);
  }

  getPrioritizedShapeTargetIdsAtPoint(queryPoint, exactTargetIds = [], options = {}) {
    const orderedTargetIds = [];
    const addTargetId = (targetId) => {
      if (targetId && !orderedTargetIds.includes(targetId)) {
        orderedTargetIds.push(targetId);
      }
    };
    const priorityTarget = options.priorityTarget?.kind === "shape" ? options.priorityTarget : null;

    if (priorityTarget && exactTargetIds.includes(priorityTarget.id)) {
      addTargetId(priorityTarget.id);
    }

    if (
      priorityTarget
      && !orderedTargetIds.includes(priorityTarget.id)
      && this.isMapPointInSmallTargetPaddedHit(priorityTarget, queryPoint, { priorityTarget: true })
    ) {
      addTargetId(priorityTarget.id);
    }

    exactTargetIds.forEach(addTargetId);

    if (options.includeOtherSmallTargetHits !== false) {
      this.getSmallTargetPaddedHitIdsAtPoint(queryPoint, {
        excludeTargetIds: new Set(orderedTargetIds)
      }).forEach(addTargetId);
    }

    return orderedTargetIds;
  }

  isTargetNearMapPoint(targetId, point) {
    if (!this.map || !targetId || this.currentView !== "study") {
      return false;
    }

    const queryPoint = Array.isArray(point) ? point : [point?.x, point?.y];

    if (!Number.isFinite(queryPoint[0]) || !Number.isFinite(queryPoint[1])) {
      return false;
    }

    const target = this.activity?.targets?.find((item) => item.id === targetId);

    if (!target) {
      return false;
    }

    if (this.shouldRejectOceanHitOverLand(target.id, queryPoint)) {
      return false;
    }

    const isCoarsePointer = window.matchMedia?.("(pointer: coarse)")?.matches;

    if (target.kind === "point" && Number.isFinite(target.lon) && Number.isFinite(target.lat)) {
      const projected = this.map.project([target.lon, target.lat]);
      const nearMissRadius = isCoarsePointer ? 60 : 44;
      const dx = projected.x - queryPoint[0];
      const dy = projected.y - queryPoint[1];

      return Math.hypot(dx, dy) <= nearMissRadius;
    }

    if (this.isMapPointInSmallTargetPaddedHit(target, queryPoint)) {
      return true;
    }

    const nearMissBox = isCoarsePointer ? 46 : 32;
    const nearbyFeatures = this.map.queryRenderedFeatures([
      [queryPoint[0] - nearMissBox, queryPoint[1] - nearMissBox],
      [queryPoint[0] + nearMissBox, queryPoint[1] + nearMissBox]
    ], {
      layers: target.type === "river" ? ["river-hit-line"] : ["target-hit-fill"]
    });

    if (nearbyFeatures.some((feature) => feature.properties?.id === targetId)) {
      return true;
    }

    const lngLat = this.map.unproject(queryPoint);
    const sourceFeature = this.getTargetShapeFeature(target);

    return this.isPointInGeoJsonGeometry([lngLat.lng, lngLat.lat], sourceFeature?.geometry);
  }

  isMapPointInsideStateTarget(queryPoint, stateTargetId) {
    const lngLat = this.map.unproject(queryPoint);
    const point = [lngLat.lng, lngLat.lat];
    const stateFeature = this.stateTargets?.features?.find((feature) => feature.properties?.id === stateTargetId);

    return this.isPointInGeoJsonGeometry(point, stateFeature?.geometry);
  }

  getFallbackShapeTargetIdsAtPoint(queryPoint, selectedTarget = null) {
    if (!this.map || !this.activity?.targets?.length) {
      return [];
    }

    const lngLat = this.map.unproject(queryPoint);
    const point = [lngLat.lng, lngLat.lat];
    const shapeTargets = this.shapeTargets.filter((target) => (
      !selectedTarget || target.id === selectedTarget.id || selectedTarget.kind !== "shape"
    ));

    return shapeTargets
      .filter((target) => {
        if (this.shouldRejectOceanHitOverLand(target.id, queryPoint)) {
          return false;
        }

        const sourceFeature = this.getTargetShapeFeature(target);
        return this.isPointInGeoJsonGeometry(point, sourceFeature?.geometry);
      })
      .map((target) => target.id);
  }

  filterContinentsOceansOceanHitsAtPoint(targetIds, queryPoint) {
    if (
      !this.isContinentsOceansActivity()
      || !targetIds.some((targetId) => this.isOceanTargetId(targetId))
    ) {
      return targetIds;
    }

    if (!this.isMapPointOverWorldLand(queryPoint)) {
      return targetIds;
    }

    return targetIds.filter((targetId) => !this.isOceanTargetId(targetId));
  }

  shouldRejectOceanHitOverLand(targetId, queryPoint) {
    return this.isContinentsOceansActivity()
      && this.isOceanTargetId(targetId)
      && this.isMapPointOverWorldLand(queryPoint);
  }

  isOceanTargetId(targetId) {
    const target = this.activity?.targets?.find((item) => item.id === targetId)
      || this.shapeTargets.find((item) => item.id === targetId);

    return this.isOceanTarget(target);
  }

  isMapPointOverWorldLand(queryPoint) {
    if (!this.map || !this.worldCountries?.features?.length) {
      return false;
    }

    const lngLat = this.map.unproject(queryPoint);
    const point = [lngLat.lng, lngLat.lat];

    return this.worldCountries.features.some((feature) => this.isPointInGeoJsonGeometry(point, feature.geometry));
  }

  isPointInGeoJsonGeometry(point, geometry) {
    if (!geometry) {
      return false;
    }

    if (geometry.type === "Polygon") {
      return this.isPointInPolygon(point, geometry.coordinates);
    }

    if (geometry.type === "MultiPolygon") {
      return geometry.coordinates.some((polygon) => this.isPointInPolygon(point, polygon));
    }

    return false;
  }

  isPointInPolygon(point, polygon) {
    const [outerRing, ...holes] = polygon || [];

    if (!outerRing || !this.isPointInRing(point, outerRing)) {
      return false;
    }

    return !holes.some((hole) => this.isPointInRing(point, hole));
  }

  isPointInRing(point, ring) {
    const [longitude, latitude] = point;
    let inside = false;

    for (let index = 0, previousIndex = ring.length - 1; index < ring.length; previousIndex = index, index += 1) {
      const [currentLongitude, currentLatitude] = ring[index];
      const [previousLongitude, previousLatitude] = ring[previousIndex];
      const crossesLatitude = (currentLatitude > latitude) !== (previousLatitude > latitude);

      if (!crossesLatitude) {
        continue;
      }

      const crossingLongitude = ((previousLongitude - currentLongitude) * (latitude - currentLatitude))
        / (previousLatitude - currentLatitude)
        + currentLongitude;

      if (longitude < crossingLongitude) {
        inside = !inside;
      }
    }

    return inside;
  }

  getNavigationCandidatesAtMapPoint(point) {
    if (!this.map) {
      return [];
    }

    const queryPoint = Array.isArray(point) ? point : [point.x, point.y];
    const candidates = [];
    const seen = new Set();
    const addCandidate = (candidate) => {
      const key = JSON.stringify(candidate);

      if (!seen.has(key)) {
        seen.add(key);
        candidates.push(candidate);
      }
    };

    this.getTargetIdsAtMapPoint(queryPoint).forEach((targetId) => {
      addCandidate({
        kind: "target",
        targetId
      });
    });

    this.getRenderedNavigationFeatures(queryPoint, "overview-region-fill", "overview").forEach(addCandidate);
    this.getRenderedNavigationFeatures(queryPoint, "overview-point-preview", "overview").forEach(addCandidate);
    const renderedWorldCountryCandidates = this.getRenderedNavigationFeatures(queryPoint, "world-land", "world-country");
    renderedWorldCountryCandidates.forEach(addCandidate);
    const fallbackWorldCountryCandidates = this.currentView === "overview" && renderedWorldCountryCandidates.length === 0
      ? this.getFallbackWorldCountryNavigationCandidatesAtPoint(queryPoint)
      : [];
    fallbackWorldCountryCandidates.forEach(addCandidate);
    this.getRenderedNavigationFeatures(queryPoint, "us-state-context-fill", "us-state").forEach(addCandidate);
    this.debugNavigationHitTest(queryPoint, {
      renderedWorldCountryCandidates,
      fallbackWorldCountryCandidates
    });

    return candidates;
  }

  getFallbackWorldCountryNavigationCandidatesAtPoint(queryPoint) {
    if (!this.map || !this.worldCountries?.features?.length) {
      return [];
    }

    const lngLat = this.map.unproject(queryPoint);
    const point = [lngLat.lng, lngLat.lat];

    return this.worldCountries.features
      .filter((feature) => this.isPointInGeoJsonGeometry(point, feature.geometry))
      .map((feature) => this.getNavigationCandidateFromFeature({
        ...feature,
        layer: { id: "world-country-fallback" }
      }, "world-country"));
  }

  getRenderedNavigationFeatures(queryPoint, layerId, kind) {
    if (!this.map?.getLayer(layerId)) {
      return [];
    }

    return this.map.queryRenderedFeatures(queryPoint, {
      layers: [layerId]
    }).map((feature) => this.getNavigationCandidateFromFeature(feature, kind));
  }

  getNavigationCandidateFromFeature(feature, kind) {
    const properties = feature?.properties || {};
    const normalizedWorldCountryId = kind === "world-country"
      ? this.getWorldCountryIdFromProperties(properties)
      : null;
    const names = [
      properties.browseLabel,
      properties.ADMIN,
      properties.NAME,
      properties.NAME_LONG,
      properties.GEOUNIT,
      properties.SOVEREIGNT
    ].filter(Boolean);

    return {
      kind,
      targetId: properties.activityId || properties.id || normalizedWorldCountryId || null,
      normalizedCountryId: normalizedWorldCountryId,
      sourceTargetId: properties.id || normalizedWorldCountryId || null,
      layerId: feature?.layer?.id || null,
      isoA3: this.getStableCountryCode(properties),
      isoA2: this.getStableCountryIso2(properties),
      stateId: properties.id || properties.postal || null,
      continent: properties.CONTINENT || null,
      sourceProperties: {
        ADMIN: properties.ADMIN,
        NAME: properties.NAME,
        NAME_LONG: properties.NAME_LONG,
        GEOUNIT: properties.GEOUNIT,
        SOVEREIGNT: properties.SOVEREIGNT,
        ISO_A2: properties.ISO_A2,
        ISO_A2_EH: properties.ISO_A2_EH,
        ISO_A3: properties.ISO_A3,
        ADM0_A3: properties.ADM0_A3,
        SOV_A3: properties.SOV_A3,
        CONTINENT: properties.CONTINENT
      },
      names
    };
  }

  getWorldCountryIdFromProperties(properties = {}) {
    const name = properties.ADMIN || properties.NAME_LONG || properties.NAME || properties.SOVEREIGNT;

    return this.normalizeNavigationId(name || properties.ISO_A3 || properties.ADM0_A3 || properties.SOV_A3);
  }

  getStableCountryCode(properties = {}) {
    return [
      properties.ISO_A3,
      properties.ADM0_A3,
      properties.SOV_A3,
      properties.isoA3
    ].find((value) => this.isValidCountryCode(value)) || null;
  }

  getStableCountryIso2(properties = {}) {
    return [
      properties.ISO_A2,
      properties.ISO_A2_EH,
      properties.isoA2
    ].find((value) => this.isValidCountryIso2(value)) || null;
  }

  isValidCountryCode(value) {
    const normalized = String(value || "").toUpperCase();

    return /^[A-Z0-9]{3}$/.test(normalized) && normalized !== "-99";
  }

  isValidCountryIso2(value) {
    const normalized = String(value || "").toUpperCase();

    return /^[A-Z]{2}$/.test(normalized);
  }

  normalizeNavigationId(value) {
    return String(value || "")
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/&/g, "and")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  debugNavigationHitTest(queryPoint, details = {}) {
    if (!this.isNavigationDebugEnabled()) {
      return;
    }

    const summarizeFeature = (feature) => {
      const properties = feature?.properties || {};

      return {
        layerId: feature?.layer?.id || null,
        targetId: properties.activityId || properties.id || this.getWorldCountryIdFromProperties(properties),
        ADMIN: properties.ADMIN,
        NAME: properties.NAME,
        NAME_LONG: properties.NAME_LONG,
        ISO_A3: properties.ISO_A3,
        ADM0_A3: properties.ADM0_A3,
        SOV_A3: properties.SOV_A3,
        CONTINENT: properties.CONTINENT
      };
    };

    const renderedAtPoint = this.map?.queryRenderedFeatures(queryPoint).map(summarizeFeature) || [];

    console.groupCollapsed("[map-navigation-hit-test]", this.currentView);
    console.log("click point", queryPoint);
    console.log("rendered features at pointer", renderedAtPoint);
    console.log("world-land candidates", details.renderedWorldCountryCandidates || []);
    console.log("fallback world-country candidate count", details.fallbackWorldCountryCandidates?.length || 0);
    console.log("fallback world-country candidates", details.fallbackWorldCountryCandidates || []);
    console.groupEnd();
  }

  isNavigationDebugEnabled() {
    try {
      return new URLSearchParams(window.location.search).has("debugMapNavigation")
        || localStorage.getItem("geography-memory-debug-map-navigation") === "true";
    } catch {
      return false;
    }
  }

  getCapitalGeoJson() {
    return {
      type: "FeatureCollection",
      features: this.pointTargets
        .map((feature) => ({
          type: "Feature",
          properties: {
            id: feature.id,
            name: feature.name,
            color: feature.color,
            hitRadius: feature.hitRadius || 14,
            easyHitRadius: feature.easyHitRadius || Math.max(feature.hitRadius || 14, 24),
            mediumHitRadius: feature.mediumHitRadius || Math.max(feature.hitRadius || 14, 20),
            hardHitRadius: feature.hardHitRadius || Math.max(feature.hitRadius || 14, 16),
            labelFontSize: feature.label?.fontSize || feature.labelFontSize || 11,
            capitalMarkerType: this.getPointMarkerType(feature)
          },
          geometry: {
            type: "Point",
            coordinates: [feature.lon, feature.lat]
          }
        }))
    };
  }

  getTargetShapeGeoJson() {
    return {
      type: "FeatureCollection",
      features: this.shapeTargets
        .map((target) => this.getTargetShapeFeature(target))
        .filter(Boolean)
    };
  }

  getMountainRangeSymbolGeoJson() {
    return {
      type: "FeatureCollection",
      features: this.shapeTargets
        .filter((target) => target.type === "mountain-range")
        .flatMap((target) => this.getMountainRangeSymbolFeatures(target))
    };
  }

  getMountainRangeCorridorGeoJson() {
    return {
      type: "FeatureCollection",
      features: this.shapeTargets
        .filter((target) => target.type === "mountain-range")
        .flatMap((target) => this.getMountainRangeCorridorFeatures(target))
    };
  }

  getMountainRangeCorridorFeatures(target) {
    const visualArt = this.getMountainRangeVisualArt(target);
    const colorProperties = this.getMountainRangeColorProperties(target);

    if (!visualArt) {
      return [];
    }

    return this.getValidMountainVisualSpines(visualArt)
      .map((coordinates, index) => ({
        type: "Feature",
        properties: {
          id: `${target.id}-mountain-corridor-${index}`,
          targetId: target.id,
          name: target.name,
          physicalFeatureType: target.type,
          hasStylizedMountainRangeArt: true,
          ...colorProperties,
          spineIndex: index,
          corridorOpacityScale: this.getMountainVisualArtNumberAt(
            visualArt.corridorOpacityScales,
            index,
            index === 0 ? 1 : Math.max(0.58, 0.78 - index * 0.08)
          ),
          corridorWidthPx: Number.isFinite(visualArt.corridorWidthPx) ? visualArt.corridorWidthPx : 30,
          corridorBlurPx: Number.isFinite(visualArt.corridorBlurPx) ? visualArt.corridorBlurPx : 9
        },
        geometry: {
          type: "LineString",
          coordinates
        }
      }));
  }

  getMountainRangeSymbolFeatures(target) {
    const visualArt = this.getMountainRangeVisualArt(target);

    if (visualArt) {
      return this.getStylizedMountainSymbolFeatures(target, visualArt);
    }

    const sourceFeature = this.findSourceShapeFeature(target, this.activity);
    const anchors = sourceFeature?.properties?.symbolAnchors;

    if (!Array.isArray(anchors)) {
      return [];
    }

    return anchors
      .filter((coordinates) => (
        Array.isArray(coordinates)
        && coordinates.length >= 2
        && Number.isFinite(coordinates[0])
        && Number.isFinite(coordinates[1])
      ))
      .map((coordinates, index) => ({
        type: "Feature",
        properties: {
          id: `${target.id}-mountain-symbol-${index}`,
          targetId: target.id,
          name: target.name,
          physicalFeatureType: target.type,
          ...this.getMountainRangeColorProperties(target),
          iconScale: 0.72,
          symbolOpacity: 0.62
        },
        geometry: {
          type: "Point",
          coordinates: [coordinates[0], coordinates[1]]
        }
      }));
  }

  getMountainRangeVisualArt(target) {
    const sourceFeature = this.findSourceShapeFeature(target, this.activity);
    const visualArt = sourceFeature?.properties?.visualArt;

    if (visualArt?.kind !== "stylized-mountain-range") {
      return null;
    }

    return this.getValidMountainVisualSpines(visualArt).length > 0 ? visualArt : null;
  }

  getValidMountainVisualSpines(visualArt) {
    return this.getValidMountainVisualSpineCoordinates(visualArt?.spines);
  }

  getRiverLineGeoJson() {
    return {
      type: "FeatureCollection",
      features: this.shapeTargets
        .filter((target) => target.type === "river")
        .map((target) => this.getTargetShapeFeature(target))
        .filter((feature) => (
          feature
          && (feature.geometry?.type === "LineString" || feature.geometry?.type === "MultiLineString")
        ))
    };
  }

  getValidMountainVisualSpineCoordinates(spines) {
    if (!Array.isArray(spines)) {
      return [];
    }

    return spines
      .map((spine) => (
        Array.isArray(spine)
          ? spine
              .filter((coordinates) => this.isValidLngLat(coordinates))
              .map((coordinates) => [coordinates[0], coordinates[1]])
          : []
      ))
      .filter((spine) => spine.length >= 2);
  }

  getMountainSymbolVisualSpines(visualArt) {
    const playableSpines = this.getValidMountainVisualSpineCoordinates(visualArt?.spines)
      .map((coordinates, index) => ({
        coordinates,
        sourceIndex: index,
        symbolSpineIndex: index,
        visualOnlyContinuation: false,
        spineWeight: this.getMountainVisualArtNumberAt(
          visualArt.spineWeights,
          index,
          index === 0 ? 1 : Math.max(0.72, 0.88 - index * 0.08)
        ),
        spacingMultiplier: this.getMountainVisualArtNumberAt(
          visualArt.spineSpacingMultipliers,
          index,
          index === 0 ? 1 : 1.08 + index * 0.06
        )
      }));
    const visualOnlySpines = this.getValidMountainVisualSpineCoordinates(visualArt?.visualOnlySpines)
      .map((coordinates, index) => ({
        coordinates,
        sourceIndex: index,
        symbolSpineIndex: playableSpines.length + index,
        visualOnlyContinuation: true,
        spineWeight: this.getMountainVisualArtNumberAt(
          visualArt.visualOnlySpineWeights,
          index,
          0.48
        ),
        spacingMultiplier: Number.isFinite(visualArt.visualOnlySpacingMultiplier)
          ? visualArt.visualOnlySpacingMultiplier
          : 1.32
      }));

    return [...playableSpines, ...visualOnlySpines];
  }

  isValidLngLat(coordinates) {
    return Array.isArray(coordinates)
      && coordinates.length >= 2
      && Number.isFinite(coordinates[0])
      && Number.isFinite(coordinates[1]);
  }

  getStylizedMountainSymbolFeatures(target, visualArt) {
    const spines = this.getMountainSymbolVisualSpines(visualArt);
    const colorProperties = this.getMountainRangeColorProperties(target);
    const [smallScale = 0.58, mediumScale = 0.82, largeScale = 1.08] = Array.isArray(visualArt.sizeRange)
      ? visualArt.sizeRange
      : [];
    const spacing = Number.isFinite(visualArt.symbolSpacingDegrees) ? visualArt.symbolSpacingDegrees : 0.72;
    const middleDensityBoost = Number.isFinite(visualArt.middleDensityBoost) ? visualArt.middleDensityBoost : 0.35;
    const jitterDegrees = Number.isFinite(visualArt.jitterDegrees) ? visualArt.jitterDegrees : 0.18;
    const sideOffsetDegrees = Number.isFinite(visualArt.sideOffsetDegrees) ? visualArt.sideOffsetDegrees : 0.14;
    const endFadeOpacity = Number.isFinite(visualArt.endFadeOpacity) ? visualArt.endFadeOpacity : 0.34;

    return spines.flatMap((spineConfig) => {
      const lineLength = this.getLineDistance(spineConfig.coordinates);
      const { sourceIndex, symbolSpineIndex, visualOnlyContinuation, spineWeight, spacingMultiplier } = spineConfig;

      if (!Number.isFinite(lineLength) || lineLength <= 0) {
        return [];
      }

      const features = [];
      let cursor = lineLength * (sourceIndex === 0 && !visualOnlyContinuation ? 0.025 : 0.055);
      let symbolIndex = 0;

      while (cursor < lineLength * (sourceIndex === 0 && !visualOnlyContinuation ? 0.985 : 0.955)) {
        const t = Math.max(0, Math.min(1, cursor / lineLength));
        const position = this.getPointAlongLine(spineConfig.coordinates, cursor);

        if (position) {
          const middleWeight = Math.max(0, 1 - Math.abs(t - 0.5) * 2);
          const endWeight = Math.min(1, t / 0.18, (1 - t) / 0.18);
          const sizeJitter = Math.sin((symbolIndex + 1) * 2.41 + symbolSpineIndex * 0.73) * 0.13;
          const mediumWeight = Math.min(1, middleWeight * 1.55);
          const largeWeight = Math.max(0, (middleWeight - 0.58) / 0.42);
          const baseScale = smallScale
            + (mediumScale - smallScale) * mediumWeight
            + (largeScale - mediumScale) * largeWeight;
          const iconScale = this.clamp(
            (baseScale + sizeJitter) * spineWeight,
            smallScale * 0.88,
            largeScale
          );
          const normalOffset = (
            Math.sin((symbolIndex + 1) * 1.73 + symbolSpineIndex) * sideOffsetDegrees
            + Math.sin((symbolIndex + 1) * 4.11 + symbolSpineIndex * 1.37) * jitterDegrees * 0.48
          );
          const alongOffset = Math.cos((symbolIndex + 1) * 2.87 + symbolSpineIndex * 0.61) * jitterDegrees * 0.2;
          const coordinates = [
            position.point[0] + position.normal[0] * normalOffset + position.tangent[0] * alongOffset,
            position.point[1] + position.normal[1] * normalOffset + position.tangent[1] * alongOffset
          ];
          const centerOpacityBoost = 0.1 * Math.pow(middleWeight, 1.2);
          const symbolOpacity = this.clamp(
            (endFadeOpacity + (0.9 - endFadeOpacity) * endWeight + centerOpacityBoost) * (0.88 + spineWeight * 0.12),
            0,
            0.96
          );

          features.push({
            type: "Feature",
            properties: {
              id: `${target.id}-mountain-symbol-${symbolSpineIndex}-${symbolIndex}`,
              targetId: target.id,
              name: target.name,
              physicalFeatureType: target.type,
              hasStylizedMountainRangeArt: true,
              ...colorProperties,
              spineIndex: symbolSpineIndex,
              spineWeight,
              visualOnlyContinuation,
              iconScale,
              symbolOpacity
            },
            geometry: {
              type: "Point",
              coordinates
            }
          });
        }

        const middleWeight = Math.max(0, 1 - Math.abs(t - 0.5) * 2);
        const irregularSpacing = spacing
          * spacingMultiplier
          * (1 + Math.sin((symbolIndex + 1) * 2.19 + symbolSpineIndex * 0.91) * 0.24);
        cursor += Math.max(0.28, irregularSpacing * (1 - middleDensityBoost * Math.pow(middleWeight, 0.8)));
        symbolIndex += 1;
      }

      return features;
    });
  }

  getMountainVisualArtNumberAt(values, index, fallback) {
    if (!Array.isArray(values) || !Number.isFinite(values[index])) {
      return fallback;
    }

    return values[index];
  }

  getLineDistance(coordinates) {
    let distance = 0;

    for (let index = 1; index < coordinates.length; index += 1) {
      distance += this.getCoordinateDistance(coordinates[index - 1], coordinates[index]);
    }

    return distance;
  }

  getCoordinateDistance(first, second) {
    const longitudeDelta = second[0] - first[0];
    const latitudeDelta = second[1] - first[1];

    return Math.hypot(longitudeDelta, latitudeDelta);
  }

  clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  getPointAlongLine(coordinates, targetDistance) {
    let traversed = 0;

    for (let index = 1; index < coordinates.length; index += 1) {
      const start = coordinates[index - 1];
      const end = coordinates[index];
      const segmentLength = this.getCoordinateDistance(start, end);

      if (segmentLength <= 0) {
        continue;
      }

      if (traversed + segmentLength >= targetDistance) {
        const segmentT = (targetDistance - traversed) / segmentLength;
        const tangent = [
          (end[0] - start[0]) / segmentLength,
          (end[1] - start[1]) / segmentLength
        ];

        return {
          point: [
            start[0] + (end[0] - start[0]) * segmentT,
            start[1] + (end[1] - start[1]) * segmentT
          ],
          tangent,
          normal: [-tangent[1], tangent[0]]
        };
      }

      traversed += segmentLength;
    }

    return null;
  }

  getTargetShapeFeature(target) {
    const sourceFeature = this.findSourceShapeFeature(target, this.activity);

    if (!sourceFeature) {
      return null;
    }

    const mountainRangeColorProperties = target.type === "mountain-range"
      ? this.getMountainRangeColorProperties(target)
      : {};

    return {
      type: "Feature",
      properties: {
        ...sourceFeature.properties,
        id: target.id,
        name: target.name,
        color: this.getTargetVisualColor(target),
        physicalFeatureType: target.type,
        hasStylizedMountainRangeArt: Boolean(this.getMountainRangeVisualArt(target)),
        ...mountainRangeColorProperties,
        geometryPrecision: sourceFeature.properties?.geometryPrecision || target.geometryPrecision || null,
        targetPrecision: sourceFeature.properties?.targetPrecision || target.targetPrecision || null,
        isOceanZone: target.type === "zone",
        suppressInternalTargetLines: this.shouldSuppressInternalTargetLines(target),
        lineWidthPx: target.type === "river" ? target.lineWidthPx : undefined,
        highlightWidthPx: target.type === "river" ? target.highlightWidthPx : undefined,
        hitWidthPx: target.type === "river" ? target.hitWidthPx : undefined,
        mutedColor: target.type === "river" ? target.mutedColor : undefined
      },
      geometry: sourceFeature.geometry
    };
  }

  getMountainRangeColorProperties(target) {
    const style = getMountainRangeColorStyle(target);

    if (!style) {
      return {
        mountainRangeFamily: "default",
        mountainRangeFillColor: target.color || colors.mountainRangeFill,
        mountainRangeLineColor: colors.mountainRangeLine,
        mountainRangeCorridorColor: target.color || colors.mountainRangeFill,
        mountainRangeMutedColor: target.mutedColor || mixHexColor(target.color || colors.mountainRangeFill, "#eef3f7", 0.62) || colors.mountainRangeFill,
        mountainRangeGlyphImage: "mappa-mountain-range-glyph",
        mountainRangeGlowImage: "mappa-mountain-range-glow"
      };
    }

    return {
      mountainRangeFamily: style.family,
      mountainRangeFillColor: style.fill,
      mountainRangeLineColor: style.line,
      mountainRangeCorridorColor: style.corridor,
      mountainRangeMutedColor: style.muted,
      mountainRangeGlyphImage: `mappa-mountain-range-glyph-${style.styleId}`,
      mountainRangeGlowImage: `mappa-mountain-range-glow-${style.styleId}`
    };
  }

  getTargetVisualColor(target) {
    if (target?.type === "mountain-range") {
      return this.getMountainRangeColorProperties(target).mountainRangeFillColor;
    }

    return target?.color;
  }

  getOceanRegionRenderGeoJson() {
    if (!this.isContinentsOceansActivity()) {
      return this.oceanZones || emptyFeatureCollection;
    }

    return {
      type: "FeatureCollection",
      features: (this.oceanZones?.features || []).map((feature) => this.getContinentsOceansOceanRenderFeature(feature))
    };
  }

  getContinentsOceansOceanRenderFeature(feature) {
    const id = normalizeTargetId(feature?.properties?.id || feature?.id || feature?.properties?.name);
    const clone = JSON.parse(JSON.stringify(feature));

    if (id === "southern-ocean") {
      clone.geometry = {
        type: "Polygon",
        coordinates: [[
          [-180, -60.35],
          [-120, -60.35],
          [-60, -60.35],
          [0, -60.35],
          [60, -60.35],
          [120, -60.35],
          [180, -60.35],
          [180, -89.5],
          [120, -89.5],
          [60, -89.5],
          [0, -89.5],
          [-60, -89.5],
          [-120, -89.5],
          [-180, -89.5],
          [-180, -60.35]
        ]]
      };
    }

    if (["atlantic-ocean", "pacific-ocean", "indian-ocean"].includes(id)) {
      this.snapOceanRenderSouthernBoundary(clone.geometry);
    }

    if (id === "pacific-ocean") {
      this.snapOceanRenderAntimeridian(clone.geometry);
    }

    return clone;
  }

  snapOceanRenderAntimeridian(geometry) {
    const snapCoordinate = (coordinate) => {
      if (!Array.isArray(coordinate)) {
        return;
      }

      if (typeof coordinate[0] === "number" && typeof coordinate[1] === "number") {
        if (coordinate[0] > 179) {
          coordinate[0] = 180;
        } else if (coordinate[0] < -179) {
          coordinate[0] = -180;
        }
        return;
      }

      coordinate.forEach(snapCoordinate);
    };

    snapCoordinate(geometry?.coordinates);
  }

  snapOceanRenderSouthernBoundary(geometry) {
    const snapCoordinate = (coordinate) => {
      if (!Array.isArray(coordinate)) {
        return;
      }

      if (typeof coordinate[0] === "number" && typeof coordinate[1] === "number") {
        if (coordinate[1] < -59.8) {
          coordinate[1] = -60.35;
        }
        return;
      }

      coordinate.forEach(snapCoordinate);
    };

    snapCoordinate(geometry?.coordinates);
  }

  refreshOceanRegionSource() {
    const source = this.map?.getSource("ocean-regions");

    if (source?.setData) {
      source.setData(this.getOceanRegionRenderGeoJson());
    }
  }

  shouldSuppressInternalTargetLines(target) {
    return this.isContinentsOceansActivity() && target?.type === "region";
  }

  getOceanRegionColorExpression() {
    if (this.studyPreviewMode && this.isContinentsOceansActivity()) {
      return [
        "case",
        ["in", this.getOceanRegionFeatureIdExpression(), ["literal", this.memoryTrailWrongHighlightIds]],
        colors.memoryTrailWrongFill,
        ["in", this.getOceanRegionFeatureIdExpression(), ["literal", this.memoryTrailCorrectHighlightIds]],
        colors.memoryTrailCorrectFill,
        ["in", this.getOceanRegionFeatureIdExpression(), ["literal", this.memoryTrailHighlightIds]],
        colors.memoryTrailFill,
        ["in", this.getOceanRegionFeatureIdExpression(), ["literal", this.completedIds]],
        this.getCompletedOceanRegionColorExpression(),
        colors.studyTargetFill
      ];
    }

    if (this.isContinentsOceansActivity()) {
      return [
        "case",
        ["in", this.getOceanRegionFeatureIdExpression(), ["literal", this.completedIds]],
        this.getCompletedOceanRegionColorExpression(),
        oceanZoneMutedColor
      ];
    }

    return this.getBaseOceanRegionColorMatchExpression();
  }

  getOceanRegionFillOpacityExpression() {
    if (this.isContinentsOceansActivity()) {
      return [
        "case",
        ["in", this.getOceanRegionFeatureIdExpression(), ["literal", this.getMemoryTrailActiveHighlightIds()]],
        0.72,
        ["in", this.getOceanRegionFeatureIdExpression(), ["literal", this.completedIds]],
        0.64,
        0
      ];
    }

    return 0;
  }

  getOceanRegionFeatureIdExpression() {
    return ["coalesce", ["get", "id"], ["get", "ocean"], ["get", "name"]];
  }

  getCompletedOceanRegionColorExpression() {
    return oceanCompletedColor;
  }

  getBaseOceanRegionColorMatchExpression() {
    return [
      "match",
      this.getOceanRegionFeatureIdExpression(),
      "atlantic-ocean",
      oceanRegionColors.atlantic,
      "Atlantic Ocean",
      oceanRegionColors.atlantic,
      "pacific-ocean",
      oceanRegionColors.pacific,
      "Pacific Ocean",
      oceanRegionColors.pacific,
      "indian-ocean",
      oceanRegionColors.indian,
      "Indian Ocean",
      oceanRegionColors.indian,
      "arctic-ocean",
      oceanRegionColors.arctic,
      "Arctic Ocean",
      oceanRegionColors.arctic,
      "southern-ocean",
      oceanRegionColors.southern,
      "Southern Ocean",
      oceanRegionColors.southern,
      colors.ocean
    ];
  }

  createOceanTargetHighlightImage() {
    if (!this.isContinentsOceansActivity()) {
      return this.createTransparentOceanHighlightImage();
    }

    return this.createTransparentOceanHighlightImage();
  }

  createTransparentOceanHighlightImage() {
    if (typeof document === "undefined") {
      return "";
    }

    const canvas = document.createElement("canvas");
    canvas.width = 2;
    canvas.height = 2;
    return canvas.toDataURL("image/png");
  }

  createOceanHighlightImage(entries, forcedColor = null) {
    if (typeof document === "undefined" || !entries?.length) {
      return this.createTransparentOceanHighlightImage();
    }

    const canvas = document.createElement("canvas");
    canvas.width = oceanTextureSize.width;
    canvas.height = oceanTextureSize.height;
    const context = canvas.getContext("2d");

    entries.forEach(({ target, opacity }) => {
      const feature = this.getTargetShapeFeature(target);

      if (!feature?.geometry || opacity <= 0) {
        return;
      }

      const color = forcedColor || target.color || colors.ocean;
      this.drawOceanHighlightFeature(context, feature, color, opacity);
    });

    return canvas.toDataURL("image/png");
  }

  drawOceanHighlightFeature(context, feature, color, opacity) {
    const rgba = this.hexToRgba(color, opacity);
    context.save();
    context.fillStyle = rgba;
    this.traceOceanFeaturePath(context, feature);
    context.fill("evenodd");
    context.restore();
  }

  traceOceanFeaturePath(context, feature) {
    const polygons = feature.geometry.type === "Polygon"
      ? [feature.geometry.coordinates]
      : feature.geometry.coordinates;

    context.beginPath();

    polygons.forEach((polygon) => {
      polygon.forEach((ring) => {
        ring.forEach(([lon, lat], index) => {
          const [x, y] = this.projectOceanTexturePoint(lon, lat);

          if (index === 0) {
            context.moveTo(x, y);
          } else {
            context.lineTo(x, y);
          }
        });
        context.closePath();
      });
    });
  }

  projectOceanTexturePoint(lon, lat) {
    const width = oceanTextureSize.width;
    const height = oceanTextureSize.height;
    const clampedLon = lon <= -179.5 ? -180 : lon >= 179.5 ? 180 : Math.max(-180, Math.min(180, lon));
    const clampedLat = Math.max(-oceanHighlightLatExtent, Math.min(oceanHighlightLatExtent, lat));
    return [
      ((clampedLon + 180) / 360) * width,
      ((oceanHighlightLatExtent - clampedLat) / (oceanHighlightLatExtent * 2)) * height
    ];
  }

  hexToRgba(color, opacity) {
    const parsed = parseHexColor(color);

    if (!parsed) {
      return `rgba(17, 104, 183, ${opacity})`;
    }

    return `rgba(${parsed.r}, ${parsed.g}, ${parsed.b}, ${opacity})`;
  }

  refreshOceanHighlightImages() {
    this.refreshOceanTargetHighlightImage();
  }

  refreshOceanTargetHighlightImage() {
    this.updateOceanImageSource("ocean-target-raster", this.createOceanTargetHighlightImage());
  }

  updateOceanImageSource(sourceId, url) {
    const source = this.map?.getSource(sourceId);

    if (source?.updateImage) {
      source.updateImage({
        url,
        coordinates: oceanHighlightTextureBounds
      });
    }
  }

  getGeometryBounds(geometry) {
    if (!geometry) {
      return null;
    }

    const bounds = this.getCoordinateBounds(geometry.coordinates);

    if (!bounds.every(Number.isFinite)) {
      return null;
    }

    return [[bounds[0], bounds[1]], [bounds[2], bounds[3]]];
  }

  findSourceShapeFeature(target, activity = this.activity) {
    if (activity?.id === "continents-oceans") {
      return this.getContinentsOceanSourceFeature(target);
    }

    const sourceFeatureId = target.sourceFeatureId || target.id;
    const isoA3 = target.isoA3 || target.iso || target.countryCode;
    const adminName = target.adminName || target.name;

    if (target.type === "water-body") {
      return this.findInlandWaterSourceFeature(target);
    }

    if (target.type === "mountain-range") {
      return this.findMountainRangeSourceFeature(target);
    }

    if (target.type === "river") {
      return this.findRiverLineSourceFeature(target);
    }

    if (activity?.map?.region === "united-states") {
      return this.stateTargets.features.find((feature) => feature.properties.id === sourceFeatureId) || null;
    }

    const admin1FeatureCollection = this.getAdmin1FeatureCollection(activity?.map?.admin1Source);

    if (admin1FeatureCollection) {
      return admin1FeatureCollection.features.find((feature) => {
        const properties = feature.properties || {};

        return properties.id === sourceFeatureId
          || properties.iso_3166_2 === target.iso_3166_2
          || properties.name === adminName
          || properties.sourceName === adminName
          || properties.sourceNameEn === adminName
          || properties.sourceGnName === adminName;
      }) || null;
    }

    const worldFeature = this.worldCountries.features.find((feature) => {
      const properties = feature.properties || {};

      return properties.id === sourceFeatureId
        || properties.ADM0_A3 === isoA3
        || properties.ISO_A3 === isoA3
        || properties.SOV_A3 === isoA3
        || properties.ADMIN === adminName
        || properties.NAME === adminName
        || properties.NAME_LONG === adminName;
    }) || null;

    return this.getRegionalWorldSourceFeature(worldFeature, activity);
  }

  findInlandWaterSourceFeature(target) {
    if (!this.inlandWaters?.features?.length || !target) {
      return null;
    }

    const matchValues = [
      target.sourceFeatureId,
      target.sourceName,
      target.name,
      target.id
    ].filter(Boolean);
    const normalizedMatchValues = new Set(matchValues.map((value) => normalizeTargetId(value)));

    return this.inlandWaters.features.find((feature) => {
      const properties = feature.properties || {};
      const featureValues = [
        properties.name,
        properties.sourceName,
        properties.id
      ].filter(Boolean);

      return featureValues.some((value) => (
        matchValues.includes(value) || normalizedMatchValues.has(normalizeTargetId(value))
      ));
    }) || null;
  }

  findMountainRangeSourceFeature(target) {
    return this.findPhysicalFeatureSourceFeature(this.mountainRanges, target);
  }

  findRiverLineSourceFeature(target) {
    return this.findPhysicalFeatureSourceFeature(this.riverLines, target);
  }

  findPhysicalFeatureSourceFeature(featureCollection, target) {
    if (!featureCollection?.features?.length || !target) {
      return null;
    }

    const matchValues = [
      target.sourceFeatureId,
      target.sourceName,
      target.name,
      target.id
    ].filter(Boolean);
    const normalizedMatchValues = new Set(matchValues.map((value) => normalizeTargetId(value)));

    return featureCollection.features.find((feature) => {
      const properties = feature.properties || {};
      const featureValues = [
        properties.id,
        properties.name,
        properties.sourceName
      ].filter(Boolean);

      return featureValues.some((value) => (
        matchValues.includes(value) || normalizedMatchValues.has(normalizeTargetId(value))
      ));
    }) || null;
  }

  getAdmin1FeatureCollection(sourceId) {
    if (sourceId === "north-america-admin1") {
      return this.northAmericaAdmin1;
    }

    if (sourceId === "australia-admin1") {
      return this.australiaAdmin1;
    }

    if (sourceId === "china-admin1") {
      return this.chinaAdmin1;
    }

    if (sourceId === "russia-admin1") {
      return this.russiaAdmin1;
    }

    if (sourceId === "india-admin1") {
      return this.indiaAdmin1;
    }

    if (sourceId === "brazil-admin1") {
      return this.brazilAdmin1;
    }

    if (sourceId === "japan-admin1") {
      return this.japanAdmin1;
    }

    if (sourceId === "germany-admin1") {
      return this.germanyAdmin1;
    }

    if (sourceId === "france-admin1") {
      return this.franceAdmin1;
    }

    if (sourceId === "spain-admin1") {
      return this.spainAdmin1;
    }

    if (sourceId === "italy-admin1") {
      return this.italyAdmin1;
    }

    if (sourceId === "united-kingdom-admin1") {
      return this.unitedKingdomAdmin1;
    }

    return null;
  }

  getParentCountryOutlineFilter() {
    const isoA3 = this.getParentCountryIsoA3();

    if (!isoA3) {
      return ["==", ["get", "ISO_A3"], "__atlas_quest_no_parent_country__"];
    }

    return [
      "any",
      ["==", ["get", "ISO_A3"], isoA3],
      ["==", ["get", "ADM0_A3"], isoA3],
      ["==", ["get", "SOV_A3"], isoA3],
      ["==", ["get", "ADM0_ISO"], isoA3]
    ];
  }

  getParentCountryIsoA3(activity = this.activity) {
    if (!this.shouldShowParentCountryOutline(activity)) {
      return null;
    }

    const explicitIsoA3 = this.normalizeIsoA3(
      activity.map?.parentCountryIsoA3
      || activity.map?.parentCountryIso
      || activity.parentCountryIsoA3
      || activity.parentCountryIso
    );

    if (explicitIsoA3) {
      return explicitIsoA3;
    }

    const sourceIsoA3 = this.normalizeIsoA3(admin1SourceParentCountryIsoA3[activity.map?.admin1Source]);

    if (sourceIsoA3) {
      return sourceIsoA3;
    }

    return this.inferParentCountryIsoA3FromTargets(activity);
  }

  shouldShowParentCountryOutline(activity = this.activity) {
    return Boolean(
      activity?.map?.admin1Source
      && activity?.targets?.some((target) => target.kind === "shape" && target.type === "admin1")
    );
  }

  inferParentCountryIsoA3FromTargets(activity = this.activity) {
    const isoA2Prefixes = new Set((activity?.targets || [])
      .map((target) => String(target.iso_3166_2 || "").trim().split("-")[0].toUpperCase())
      .filter(Boolean));

    if (isoA2Prefixes.size !== 1) {
      return null;
    }

    const [isoA2] = [...isoA2Prefixes];
    return this.normalizeIsoA3(admin1Iso31662PrefixParentCountryIsoA3[isoA2]);
  }

  normalizeIsoA3(value) {
    const normalized = String(value || "").trim().toUpperCase();
    return /^[A-Z]{3}$/.test(normalized) ? normalized : null;
  }

  getParentCountryOutlineHaloWidthExpression() {
    return [
      "interpolate",
      ["linear"],
      ["zoom"],
      1,
      2.6,
      4,
      4.6,
      7,
      6.2
    ];
  }

  getParentCountryOutlineWidthExpression() {
    return [
      "interpolate",
      ["linear"],
      ["zoom"],
      1,
      1.25,
      4,
      2.2,
      7,
      3.1
    ];
  }

  updateParentCountryOutline() {
    if (!this.map) {
      return;
    }

    const filter = this.getParentCountryOutlineFilter();
    const visibility = this.currentView === "study" && this.getParentCountryIsoA3() ? "visible" : "none";

    parentCountryOutlineLayerIds.forEach((layerId) => {
      if (!this.map.getLayer(layerId)) {
        return;
      }

      this.map.setFilter(layerId, filter);
      this.map.setLayoutProperty(layerId, "visibility", visibility);
    });
  }

  getContinentsOceanSourceFeature(target) {
    if (target.type === "zone") {
      return this.getOceanZoneFeature(target.id);
    }

    const generatedLandFeature = this.getGeneratedContinentsOceanLandFeature(target);

    if (generatedLandFeature) {
      return generatedLandFeature;
    }

    const continentName = target.id === "australia" ? "Oceania" : target.name;
    const coordinates = this.worldCountries.features.flatMap((feature) => (
      this.getContinentsOceanFeaturePolygons(feature, target, continentName)
    ));

    if (coordinates.length === 0) {
      return null;
    }

    return {
      type: "Feature",
      properties: {
        id: target.id,
        name: target.name
      },
      geometry: {
        type: "MultiPolygon",
        coordinates
      }
    };
  }

  getGeneratedContinentsOceanLandFeature(target) {
    const coordinates = [];
    const targetId = target.id;

    this.coContinentLand?.features?.forEach((feature) => {
      const properties = feature?.properties || {};
      const sourceId = [feature?.id, properties.id, properties.name]
        .map((value) => normalizeTargetId(value))
        .find(Boolean);

      this.getGeometryPolygons(feature?.geometry).forEach((polygon) => {
        const overrideContinentId = this.getCoContinentOverrideForPolygon(feature, polygon);

        if (overrideContinentId) {
          if (overrideContinentId === targetId) {
            coordinates.push(polygon);
          }
          return;
        }

        if (sourceId === targetId) {
          coordinates.push(polygon);
        }
      });
    });

    if (!coordinates.length) {
      return null;
    }

    return {
      type: "Feature",
      properties: {
        id: target.id,
        name: target.name
      },
      geometry: {
        type: "MultiPolygon",
        coordinates
      }
    };
  }

  getContinentsOceanFeaturePolygons(feature, target, continentName) {
    const polygons = this.getGeometryPolygons(feature.geometry);
    const autoPolygons = [];
    const overridePolygons = [];

    polygons.forEach((polygon) => {
      const overrideContinentId = this.getCoContinentOverrideForPolygon(feature, polygon);

      if (overrideContinentId) {
        if (overrideContinentId === target.id) {
          overridePolygons.push(polygon);
        }
        return;
      }

      autoPolygons.push(polygon);
    });

    if (feature.properties?.CONTINENT === continentName) {
      return [
        ...overridePolygons,
        ...this.getContinentFeaturePolygons(feature, target, autoPolygons)
      ];
    }

    if (target.id === "asia" && this.isRussiaFeature(feature)) {
      return [
        ...overridePolygons,
        ...autoPolygons.filter((polygon) => this.getRussiaContinentsOceansPolygonAssignment(polygon) === "asia")
      ];
    }

    if (target.id === "antarctica" && this.isFrenchSouthernAntarcticLandsFeature(feature)) {
      return [
        ...overridePolygons,
        ...autoPolygons
      ];
    }

    return overridePolygons;
  }

  getOceanZoneFeature(id) {
    const targetId = normalizeTargetId(id);
    const feature = this.oceanZones?.features?.find((candidate) => {
      const properties = candidate?.properties || {};

      return [
        candidate?.id,
        properties.id,
        properties.ocean,
        properties.name
      ].some((value) => normalizeTargetId(value) === targetId);
    });

    return feature || getFallbackOceanZoneFeature(id);
  }

  getContinentFeaturePolygons(feature, target, polygons = this.getGeometryPolygons(feature.geometry)) {
    if (target.id !== "europe") {
      return polygons;
    }

    if (this.isNorwayFeature(feature)) {
      return polygons;
    }

    return polygons.filter((polygon) => {
      const russianAssignment = this.getRussiaContinentsOceansPolygonAssignment(polygon, feature);

      if (russianAssignment) {
        return russianAssignment === "europe";
      }

      return this.isPolygonInExtent(polygon, europeGeographicExtent);
    });
  }

  isNorwayFeature(feature) {
    return this.getFeatureIdentityValues(feature).some((value) => value === "norway");
  }

  isRussiaFeature(feature) {
    return this.getFeatureIdentityValues(feature).some((value) => value === "russia");
  }

  isFrenchSouthernAntarcticLandsFeature(feature) {
    return this.getFeatureIdentityValues(feature).some((value) => (
      value === "fr. s. antarctic lands"
      || value === "french southern and antarctic lands"
    ));
  }

  getFeatureIdentityValues(feature) {
    const properties = feature?.properties || {};

    return [
      properties.NAME,
      properties.NAME_LONG,
      properties.ADMIN,
      properties.GEOUNIT,
      properties.SUBUNIT,
      properties.BRK_NAME
    ]
      .map((value) => String(value || "").trim().toLowerCase())
      .filter(Boolean);
  }

  getCoContinentOverrideForPolygon(feature, polygon) {
    if (!this.isContinentsOceansActivity() || !this.coContinentOverrides.length) {
      return null;
    }

    const bounds = this.getRoundedBounds(polygon);
    const properties = feature?.properties || {};

    const override = this.coContinentOverrides.find((candidate) => {
      if (!candidate?.assignedContinent) {
        return false;
      }

      if (candidate.polygonBounds && this.areRoundedBoundsEqual(candidate.polygonBounds, bounds)) {
        return this.doesCoOverrideMatchFeature(candidate, properties);
      }

      return false;
    });

    return override ? this.getContinentIdFromOverride(override.assignedContinentId || override.assignedContinent) : null;
  }

  doesCoOverrideMatchFeature(override, properties) {
    const match = override.match || {};

    if (!match.properties) {
      return true;
    }

    return [
      "NAME",
      "NAME_LONG",
      "ADMIN",
      "GEOUNIT",
      "SUBUNIT",
      "ISO_A3",
      "ADM0_A3",
      "CONTINENT"
    ].some((key) => {
      const expected = match.properties[key];
      return expected && properties[key] === expected;
    });
  }

  getContinentIdFromOverride(value) {
    const normalized = normalizeTargetId(value);
    return normalized === "oceania" ? "australia" : normalized;
  }

  getRoundedBounds(polygon) {
    return this.getCoordinateBounds(polygon).map((value) => Number(value.toFixed(5)));
  }

  areRoundedBoundsEqual(left, right) {
    return Array.isArray(left)
      && Array.isArray(right)
      && left.length === 4
      && right.length === 4
      && left.every((value, index) => Math.abs(Number(value) - Number(right[index])) < 0.00002);
  }

  getRussiaContinentsOceansPolygonAssignment(polygon, feature = null) {
    if (feature && !this.isRussiaFeature(feature)) {
      return null;
    }

    const [west, south, east, north] = this.getCoordinateBounds(polygon);

    // Continents & Oceans uses simplified continent membership for Arctic island groups.
    if (this.isBoundsInRange({ west, south, east, north }, { west: 44, south: 79, east: 53, north: 82 })) {
      // Franz Josef Land
      return "europe";
    }

    if (this.isBoundsInRange({ west, south, east, north }, { west: 47, south: 68, east: 70, north: 78 })) {
      // Novaya Zemlya, Vaygach Island, and Kolguyev Island
      return "europe";
    }

    if (this.isBoundsInRange({ west, south, east, north }, { west: 90, south: 77, east: 106, north: 82 })) {
      // Severnaya Zemlya
      return "asia";
    }

    if (this.isBoundsInRange({ west, south, east, north }, { west: 135, south: 72, east: 152, north: 77 })) {
      // New Siberian Islands
      return "asia";
    }

    if (
      this.isBoundsInRange({ west, south, east, north }, { west: 177, south: 69, east: 180, north: 73 })
      || this.isBoundsInRange({ west, south, east, north }, { west: -180, south: 63, east: -169, north: 73 })
    ) {
      // Wrangel Island and nearby antimeridian polygons
      return "asia";
    }

    if (this.isBoundsInRange({ west, south, east, north }, { west: 140, south: 45, east: 146, north: 55 })) {
      // Sakhalin
      return "asia";
    }

    if (this.isBoundsInRange({ west, south, east, north }, { west: 35, south: 66, east: 90, north: 82 })) {
      // Remaining small western Russian Arctic polygons belong with Europe in this simplified map.
      return "europe";
    }

    return null;
  }

  isBoundsInRange(bounds, range) {
    return bounds.west >= range.west
      && bounds.east <= range.east
      && bounds.south >= range.south
      && bounds.north <= range.north;
  }

  getRegionalWorldSourceFeature(feature, activity) {
    if (!feature || !this.shouldFilterWorldFeatureToEurope(activity)) {
      return feature;
    }

    const polygons = this.getGeometryPolygons(feature.geometry);
    const filteredPolygons = this.filterPolygonsToExtent(polygons, europeGeographicExtent);

    if (filteredPolygons.length === polygons.length) {
      return feature;
    }

    if (filteredPolygons.length === 0) {
      return null;
    }

    return {
      ...feature,
      geometry: {
        type: "MultiPolygon",
        coordinates: filteredPolygons
      }
    };
  }

  shouldFilterWorldFeatureToEurope(activity) {
    return europeanRegionalActivityRegions.has(activity?.map?.region);
  }

  getGeometryPolygons(geometry) {
    if (!geometry) {
      return [];
    }

    return geometry.type === "Polygon"
      ? [geometry.coordinates]
      : geometry.coordinates || [];
  }

  filterPolygonsToExtent(polygons, extent) {
    return polygons.filter((polygon) => this.isPolygonInExtent(polygon, extent));
  }

  isPolygonInExtent(polygon, extent) {
    const [west, south, east, north] = this.getCoordinateBounds(polygon);

    return east >= extent.west
      && west <= extent.east
      && north >= extent.south
      && south <= extent.north;
  }

  getCoordinateBounds(coordinates, bounds = [Infinity, Infinity, -Infinity, -Infinity]) {
    if (typeof coordinates?.[0] === "number") {
      const [longitude, latitude] = coordinates;
      bounds[0] = Math.min(bounds[0], longitude);
      bounds[1] = Math.min(bounds[1], latitude);
      bounds[2] = Math.max(bounds[2], longitude);
      bounds[3] = Math.max(bounds[3], latitude);
      return bounds;
    }

    coordinates.forEach((coordinate) => {
      this.getCoordinateBounds(coordinate, bounds);
    });

    return bounds;
  }

  getCompletedLabelGeoJson() {
    if (!this.getDifficultyVisualState().showsCompletedLabels) {
      return emptyFeatureCollection;
    }

    return {
      type: "FeatureCollection",
      features: this.activity.targets
        .filter((feature) => this.completedIds.includes(feature.id))
        .map((feature) => ({
          type: "Feature",
          properties: {
            id: feature.id,
            name: feature.completedLabelName || feature.name,
            labelFontSize: feature.label?.fontSize || feature.labelFontSize || 11
          },
          geometry: {
            type: "Point",
            coordinates: this.getLabelCoordinates(feature)
          }
        }))
    };
  }

  getLabelCoordinates(feature) {
    if (feature.label?.anchor) {
      return feature.label.anchor;
    }

    if (Number.isFinite(feature.lon) && Number.isFinite(feature.lat)) {
      return [feature.lon, feature.lat];
    }

    if (fallbackLabelAnchors[feature.id]) {
      return fallbackLabelAnchors[feature.id];
    }

    return [-71.8, 42.8];
  }

  refreshStudyPaint() {
    if (!this.map) {
      return;
    }

    this.refreshOceanRegionPaint();

    if (this.map.getLayer("state-fill")) {
      this.map.setPaintProperty("state-fill", "fill-color", this.getStateFillExpression());
      this.map.setPaintProperty("state-fill", "fill-opacity", this.getShapeFillOpacityExpression());
    }

    this.refreshOceanTargetHighlightImage();

    if (this.map.getLayer("state-line")) {
      this.map.setPaintProperty("state-line", "line-color", this.getStateLineExpression());
      this.map.setPaintProperty("state-line", "line-opacity", this.getShapeLineOpacityExpression());
      this.map.setPaintProperty("state-line", "line-width", this.getShapeLineWidthExpression());
    }

    if (this.map.getLayer("mountain-range-corridor")) {
      this.map.setPaintProperty("mountain-range-corridor", "line-color", this.getMountainRangeCorridorColorExpression());
      this.map.setPaintProperty("mountain-range-corridor", "line-width", this.getMountainRangeCorridorWidthExpression());
      this.map.setPaintProperty("mountain-range-corridor", "line-opacity", this.getMountainRangeCorridorOpacityExpression());
    }

    if (this.map.getLayer("mountain-range-symbol-glow")) {
      this.map.setLayoutProperty("mountain-range-symbol-glow", "icon-size", this.getMountainRangeSymbolGlowSizeExpression());
      this.map.setPaintProperty("mountain-range-symbol-glow", "icon-opacity", this.getMountainRangeSymbolGlowOpacityExpression());
    }

    if (this.map.getLayer("mountain-range-symbol")) {
      this.map.setLayoutProperty("mountain-range-symbol", "icon-size", this.getMountainRangeSymbolSizeExpression());
      this.map.setPaintProperty("mountain-range-symbol", "icon-opacity", this.getMountainRangeSymbolOpacityExpression());
    }

    if (this.map.getLayer("river-line")) {
      this.map.setPaintProperty("river-line", "line-color", this.getRiverLineColorExpression());
      this.map.setPaintProperty("river-line", "line-width", this.getRiverLineWidthExpression());
      this.map.setPaintProperty("river-line", "line-opacity", this.getRiverLineOpacityExpression());
    }

    if (this.map.getLayer("river-hit-line")) {
      this.map.setPaintProperty("river-hit-line", "line-width", this.getRiverHitWidthExpression());
    }

    if (this.map.getLayer("hard-world-context-fill")) {
      this.map.setPaintProperty("hard-world-context-fill", "fill-color", this.getHardWorldContextFillExpression());
    }

    if (this.map.getLayer("us-state-context-fill")) {
      this.map.setPaintProperty("us-state-context-fill", "fill-color", this.getUsStateContextFillExpression());
    }

    if (this.map.getLayer("capital-marker")) {
      this.map.setPaintProperty("capital-marker", "circle-color", this.getCapitalFillExpression());
      this.map.setPaintProperty("capital-marker", "circle-radius", this.getCapitalRadiusExpression());
      this.map.setPaintProperty("capital-marker", "circle-opacity", this.getCapitalOpacityExpression());
      this.map.setPaintProperty("capital-marker", "circle-stroke-opacity", this.getCapitalStrokeOpacityExpression());
    }

    if (this.map.getLayer("national-capital-ring")) {
      this.map.setPaintProperty("national-capital-ring", "circle-opacity", this.getCapitalOpacityExpression());
      this.map.setPaintProperty("national-capital-ring", "circle-stroke-opacity", this.getCapitalStrokeOpacityExpression());
    }

    if (this.map.getLayer("state-capital-star")) {
      this.map.setPaintProperty("state-capital-star", "icon-opacity", this.getCapitalOpacityExpression());
    }

    if (this.map.getLayer("national-capital-star")) {
      this.map.setPaintProperty("national-capital-star", "icon-opacity", this.getCapitalOpacityExpression());
    }

    if (this.map.getLayer("capital-marker-halo")) {
      this.map.setPaintProperty("capital-marker-halo", "circle-opacity", this.getCapitalHaloOpacityExpression());
    }

    if (this.map.getLayer("capital-hit")) {
      this.map.setPaintProperty("capital-hit", "circle-radius", this.getCapitalHitRadiusExpression());
    }

    const labelSource = this.map.getSource("completed-labels");

    if (labelSource) {
      labelSource.setData(this.getCompletedLabelGeoJson());
    }
  }

  refreshOceanRegionPaint() {
    if (!this.map?.getLayer("ocean-region-fill")) {
      return;
    }

    const colorExpression = this.getOceanRegionColorExpression();
    this.map.setPaintProperty("ocean-region-fill", "fill-color", colorExpression);
    this.map.setPaintProperty("ocean-region-fill", "fill-opacity", this.getOceanRegionFillOpacityExpression());

    if (this.map.getLayer("ocean-region-line")) {
      this.map.setPaintProperty("ocean-region-line", "line-color", this.getOceanRegionLineColorExpression());
      this.map.setPaintProperty("ocean-region-line", "line-opacity", this.getOceanRegionLineOpacityExpression());
    }
  }

  getOceanRegionLineColorExpression() {
    if (this.studyPreviewMode && this.isContinentsOceansActivity()) {
      return [
        "case",
        ["in", this.getOceanRegionFeatureIdExpression(), ["literal", this.memoryTrailWrongHighlightIds]],
        colors.memoryTrailWrongLine,
        ["in", this.getOceanRegionFeatureIdExpression(), ["literal", this.memoryTrailCorrectHighlightIds]],
        colors.memoryTrailCorrectLine,
        ["in", this.getOceanRegionFeatureIdExpression(), ["literal", this.memoryTrailHighlightIds]],
        colors.memoryTrailLine,
        ["in", this.getOceanRegionFeatureIdExpression(), ["literal", this.completedIds]],
        oceanCompletedOutlineColor,
        colors.studyTargetLine
      ];
    }

    if (this.isContinentsOceansActivity() && !this.studyPreviewMode) {
      return [
        "case",
        ["in", this.getOceanRegionFeatureIdExpression(), ["literal", this.completedIds]],
        oceanCompletedOutlineColor,
        colors.ocean
      ];
    }

    return this.getOceanRegionColorExpression();
  }

  refreshStudyFilters() {
    const shapeSource = this.map.getSource("target-shapes");
    const mountainCorridorSource = this.map.getSource("mountain-range-corridors");
    const mountainSymbolSource = this.map.getSource("mountain-range-symbols");
    const riverLineSource = this.map.getSource("river-lines");

    if (shapeSource) {
      shapeSource.setData(this.getTargetShapeGeoJson());
    }

    if (mountainCorridorSource) {
      mountainCorridorSource.setData(this.getMountainRangeCorridorGeoJson());
    }

    if (mountainSymbolSource) {
      mountainSymbolSource.setData(this.getMountainRangeSymbolGeoJson());
    }

    if (riverLineSource) {
      riverLineSource.setData(this.getRiverLineGeoJson());
    }
  }

  refreshDifficultyVisuals() {
    if (!this.map) {
      return;
    }

    if (!this.hasStudyRenderLayers()) {
      this.queueDifficultyVisualRefresh();
      return;
    }

    this.refreshStudyFilters();
    this.refreshStudyPaint();
    this.updateBaseLabelVisibility();
    this.updateHardContextVisibility();
    this.updateDifficultyLayerVisibility();
    this.refreshMapRender();
  }

  hasStudyRenderLayers() {
    return Boolean(
      this.map?.getSource("target-shapes")
      && this.map.getLayer("state-fill")
      && this.map.getLayer("target-hit-fill")
      && this.map.getLayer("capital-marker")
    );
  }

  queueDifficultyVisualRefresh() {
    if (!this.map || this.pendingDifficultyVisualRefresh) {
      return;
    }

    this.pendingDifficultyVisualRefresh = true;
    this.map.once("idle", () => {
      this.pendingDifficultyVisualRefresh = false;
      this.refreshDifficultyVisuals();
    });
  }

  refreshMapRender() {
    this.map.resize();
    this.map.triggerRepaint?.();
    if (typeof window !== "undefined") {
      window.requestAnimationFrame(() => {
        this.map?.triggerRepaint?.();
      });
    }
  }

  getDifficultyVisualState() {
    const difficulty = normalizeDifficulty(this.difficulty);

    return {
      difficulty,
      isEasy: difficulty === difficultyModes.easy,
      isMedium: difficulty === difficultyModes.medium,
      isHard: difficulty === difficultyModes.hard,
      usesProgressReveal: difficulty !== difficultyModes.hard,
      showsPointHintsBeforePlacement: difficulty === difficultyModes.easy,
      showsPointCompletionFeedback: true,
      showsCompletedLabels: difficulty !== difficultyModes.hard,
      forcesContextFill: difficulty === difficultyModes.hard
    };
  }

  getShapeTargetFilter() {
    return [
      "in",
      ["get", "id"],
      ["literal", this.shapeTargets.map((target) => target.sourceFeatureId || target.id)]
    ];
  }

  isContinentsOceansActivity() {
    return this.activity?.id === "continents-oceans";
  }

  isOceanTarget(target) {
    return target?.type === "zone";
  }

  getContinentTargetIds() {
    return this.shapeTargets
      .filter((target) => !this.isOceanTarget(target))
      .map((target) => target.id);
  }

  areAllContinentTargetsCompleted() {
    const continentIds = this.getContinentTargetIds();

    return continentIds.length > 0 && continentIds.every((id) => this.completedIds.includes(id));
  }

  shouldShowHardContinentChallenge() {
    return this.isContinentsOceansActivity() && this.getDifficultyVisualState().isHard;
  }

  getStateFillExpression() {
    if (this.isContinentsOceansActivity()) {
      return this.getContinentsOceansFillExpression();
    }

    if (this.studyPreviewMode) {
      return [
        "case",
        ["in", ["get", "id"], ["literal", this.memoryTrailWrongHighlightIds]],
        colors.memoryTrailWrongFill,
        ["in", ["get", "id"], ["literal", this.memoryTrailCorrectHighlightIds]],
        colors.memoryTrailCorrectFill,
        ["in", ["get", "id"], ["literal", this.memoryTrailHighlightIds]],
        colors.memoryTrailFill,
        ["in", ["get", "id"], ["literal", this.completedIds]],
        ["match", ["get", "id"], ...this.getColorMatchStops(), colors.targetFill],
        ["==", ["get", "physicalFeatureType"], "mountain-range"],
        this.getMountainRangeFillColorExpression(),
        colors.studyTargetFill
      ];
    }

    if (this.getDifficultyVisualState().isHard) {
      return [
        "case",
        ["in", ["get", "id"], ["literal", this.completedIds]],
        ["match", ["get", "id"], ...this.getColorMatchStops(), colors.targetFill],
        ["==", ["get", "physicalFeatureType"], "mountain-range"],
        this.getMountainRangeFillColorExpression(),
        colors.targetFill
      ];
    }

    return [
      "case",
      ["in", ["get", "id"], ["literal", this.completedIds]],
      ["match", ["get", "id"], ...this.getColorMatchStops(), colors.targetFill],
      ["==", ["get", "physicalFeatureType"], "mountain-range"],
      this.getMountainRangeFillColorExpression(),
      ["match", ["get", "id"], ...this.getMutedTargetColorStops(), colors.targetFill]
    ];
  }

  getContinentsOceansFillExpression() {
    if (this.studyPreviewMode) {
      return [
        "case",
        ["boolean", ["get", "isOceanZone"], false],
        ["match", ["get", "id"], ...this.getColorMatchStops(), colors.ocean],
        ["in", ["get", "id"], ["literal", this.memoryTrailWrongHighlightIds]],
        colors.memoryTrailWrongFill,
        ["in", ["get", "id"], ["literal", this.memoryTrailCorrectHighlightIds]],
        colors.memoryTrailCorrectFill,
        ["in", ["get", "id"], ["literal", this.memoryTrailHighlightIds]],
        colors.memoryTrailFill,
        ["in", ["get", "id"], ["literal", this.completedIds]],
        ["match", ["get", "id"], ...this.getColorMatchStops(), colors.targetFill],
        ["match", ["get", "id"], ...this.getMutedTargetColorStops(), colors.targetFill]
      ];
    }

    return [
      "case",
      ["boolean", ["get", "isOceanZone"], false],
      oceanZoneMutedColor,
      ["in", ["get", "id"], ["literal", this.completedIds]],
      ["match", ["get", "id"], ...this.getColorMatchStops(), colors.targetFill],
      ["match", ["get", "id"], ...this.getMutedTargetColorStops(), colors.targetFill]
    ];
  }

  getShapeFillOpacityExpression() {
    if (this.isContinentsOceansActivity()) {
      return this.getContinentsOceansFillOpacityExpression();
    }

    if (this.studyPreviewMode) {
      return [
        "case",
        ["boolean", ["get", "hasStylizedMountainRangeArt"], false],
        0,
        ["in", ["get", "id"], ["literal", this.getMemoryTrailActiveHighlightIds()]],
        0.98,
        ["in", ["get", "id"], ["literal", this.completedIds]],
        0.96,
        ["==", ["get", "physicalFeatureType"], "mountain-range"],
        0.24,
        0.52
      ];
    }

    if (this.getDifficultyVisualState().isHard) {
      return [
        "case",
        ["boolean", ["get", "hasStylizedMountainRangeArt"], false],
        0,
        ["in", ["get", "id"], ["literal", this.completedIds]],
        0.96,
        ["==", ["get", "physicalFeatureType"], "mountain-range"],
        0.22,
        0
      ];
    }

    return [
      "case",
      ["boolean", ["get", "isOceanZone"], false],
      [
        "case",
        ["in", ["get", "id"], ["literal", this.completedIds]],
        0.34,
        0.01
      ],
      ["in", ["get", "id"], ["literal", this.completedIds]],
      0.96,
      ["boolean", ["get", "hasStylizedMountainRangeArt"], false],
      0,
      ["==", ["get", "physicalFeatureType"], "mountain-range"],
      0.2,
      0.78
    ];
  }

  getContinentsOceansFillOpacityExpression() {
    if (this.studyPreviewMode) {
      return [
        "case",
        ["boolean", ["get", "isOceanZone"], false],
        0,
        ["in", ["get", "id"], ["literal", this.getMemoryTrailActiveHighlightIds()]],
        1,
        ["in", ["get", "id"], ["literal", this.completedIds]],
        1,
        1
      ];
    }

    if (this.getDifficultyVisualState().isHard) {
      return [
        "case",
        ["boolean", ["get", "isOceanZone"], false],
        0,
        ["in", ["get", "id"], ["literal", this.completedIds]],
        1,
        this.areAllContinentTargetsCompleted(),
        1,
        1
      ];
    }

    return [
      "case",
      ["boolean", ["get", "isOceanZone"], false],
      [
        "case",
        ["in", ["get", "id"], ["literal", this.completedIds]],
        0.34,
        0.01
      ],
      ["in", ["get", "id"], ["literal", this.completedIds]],
      1,
      1
    ];
  }

  getStateLineExpression() {
    if (this.studyPreviewMode) {
      return [
        "case",
        ["in", ["get", "id"], ["literal", this.memoryTrailWrongHighlightIds]],
        colors.memoryTrailWrongLine,
        ["in", ["get", "id"], ["literal", this.memoryTrailCorrectHighlightIds]],
        colors.memoryTrailCorrectLine,
        ["in", ["get", "id"], ["literal", this.memoryTrailHighlightIds]],
        colors.memoryTrailLine,
        ["in", ["get", "id"], ["literal", this.completedIds]],
        colors.targetStroke,
        ["==", ["get", "physicalFeatureType"], "mountain-range"],
        this.getMountainRangeLineColorExpression(),
        colors.studyTargetLine
      ];
    }

    return [
      "case",
      ["==", ["get", "physicalFeatureType"], "mountain-range"],
      this.getMountainRangeLineColorExpression(),
      colors.targetStroke
    ];
  }

  getShapeLineOpacityExpression() {
    if (this.studyPreviewMode) {
      return [
        "case",
        ["boolean", ["get", "isOceanZone"], false],
        0,
        ["boolean", ["get", "suppressInternalTargetLines"], false],
        0,
        ["boolean", ["get", "hasStylizedMountainRangeArt"], false],
        0,
        ["in", ["get", "id"], ["literal", this.getMemoryTrailActiveHighlightIds()]],
        1,
        ["in", ["get", "id"], ["literal", this.completedIds]],
        1,
        ["==", ["get", "physicalFeatureType"], "mountain-range"],
        0.52,
        0.86
      ];
    }

    if (this.shouldShowHardContinentChallenge()) {
      return [
        "case",
        ["boolean", ["get", "isOceanZone"], false],
        0,
        ["boolean", ["get", "suppressInternalTargetLines"], false],
        0,
        1
      ];
    }

    if (this.getDifficultyVisualState().isHard) {
      return [
        "case",
        ["boolean", ["get", "isOceanZone"], false],
        0,
        ["boolean", ["get", "suppressInternalTargetLines"], false],
        0,
        ["boolean", ["get", "hasStylizedMountainRangeArt"], false],
        0,
        ["in", ["get", "id"], ["literal", this.completedIds]],
        1,
        0
      ];
    }

    return [
      "case",
      ["boolean", ["get", "isOceanZone"], false],
      0,
      ["boolean", ["get", "suppressInternalTargetLines"], false],
      0,
      ["boolean", ["get", "hasStylizedMountainRangeArt"], false],
      0,
      ["==", ["get", "physicalFeatureType"], "mountain-range"],
      0.5,
      1
    ];
  }

  getShapeLineWidthExpression() {
    if (this.studyPreviewMode) {
      return [
        "case",
        ["in", ["get", "id"], ["literal", this.getMemoryTrailActiveHighlightIds()]],
        3,
        ["in", ["get", "id"], ["literal", this.completedIds]],
        2.15,
        ["==", ["get", "physicalFeatureType"], "mountain-range"],
        1.05,
        1.7
      ];
    }

    if (this.shouldShowHardContinentChallenge()) {
      return 2.15;
    }

    if (this.getDifficultyVisualState().isHard) {
      return [
        "case",
        ["in", ["get", "id"], ["literal", this.completedIds]],
        2.15,
        ["==", ["get", "physicalFeatureType"], "mountain-range"],
        1,
        0
      ];
    }

    return [
      "case",
      ["==", ["get", "physicalFeatureType"], "mountain-range"],
      1,
      2.15
    ];
  }

  getMountainRangeSymbolSizeExpression() {
    return [
      "*",
      ["coalesce", ["get", "iconScale"], 0.72],
      [
        "case",
        ["in", ["get", "targetId"], ["literal", this.getActiveTargetVisualIds()]],
        1.34,
        ["in", ["get", "targetId"], ["literal", this.completedIds]],
        1.02,
        0.92
      ]
    ];
  }

  getMountainRangeSymbolGlowSizeExpression() {
    return [
      "*",
      ["coalesce", ["get", "iconScale"], 0.72],
      [
        "case",
        ["in", ["get", "targetId"], ["literal", this.getActiveTargetVisualIds()]],
        2.18,
        ["in", ["get", "targetId"], ["literal", this.completedIds]],
        1.46,
        1.28
      ]
    ];
  }

  getMountainRangeSymbolOpacityExpression() {
    if (this.studyPreviewMode) {
      return [
        "case",
        ["boolean", ["get", "visualOnlyContinuation"], false],
        ["*", ["coalesce", ["get", "symbolOpacity"], 0.5], 0.58],
        ["in", ["get", "targetId"], ["literal", this.memoryTrailWrongHighlightIds]],
        0.96,
        ["in", ["get", "targetId"], ["literal", this.memoryTrailCorrectHighlightIds]],
        0.96,
        ["in", ["get", "targetId"], ["literal", this.getActiveTargetVisualIds()]],
        1,
        ["in", ["get", "targetId"], ["literal", this.completedIds]],
        ["min", 0.9, ["+", ["coalesce", ["get", "symbolOpacity"], 0.58], 0.08]],
        ["*", ["coalesce", ["get", "symbolOpacity"], 0.58], 0.82]
      ];
    }

    if (this.getDifficultyVisualState().isHard) {
      return [
        "case",
        ["boolean", ["get", "visualOnlyContinuation"], false],
        ["*", ["coalesce", ["get", "symbolOpacity"], 0.5], 0.46],
        ["in", ["get", "targetId"], ["literal", this.getActiveTargetVisualIds()]],
        1,
        ["in", ["get", "targetId"], ["literal", this.completedIds]],
        ["min", 0.9, ["+", ["coalesce", ["get", "symbolOpacity"], 0.58], 0.08]],
        0
      ];
    }

    return [
      "case",
      ["boolean", ["get", "visualOnlyContinuation"], false],
      ["*", ["coalesce", ["get", "symbolOpacity"], 0.5], 0.58],
      ["in", ["get", "targetId"], ["literal", this.getActiveTargetVisualIds()]],
      1,
      ["in", ["get", "targetId"], ["literal", this.completedIds]],
      ["min", 0.9, ["+", ["coalesce", ["get", "symbolOpacity"], 0.58], 0.08]],
      ["*", ["coalesce", ["get", "symbolOpacity"], 0.62], 0.82]
    ];
  }

  getMountainRangeSymbolGlowOpacityExpression() {
    if (this.getDifficultyVisualState().isHard && !this.studyPreviewMode) {
      return [
        "case",
        ["in", ["get", "targetId"], ["literal", this.getActiveTargetVisualIds()]],
        ["min", 0.9, ["+", ["*", ["coalesce", ["get", "symbolOpacity"], 0.5], 0.64], 0.28]],
        ["in", ["get", "targetId"], ["literal", this.completedIds]],
        ["min", 0.42, ["+", ["*", ["coalesce", ["get", "symbolOpacity"], 0.5], 0.28], 0.08]],
        0
      ];
    }

    return [
      "case",
      ["in", ["get", "targetId"], ["literal", this.getActiveTargetVisualIds()]],
      ["min", 0.9, ["+", ["*", ["coalesce", ["get", "symbolOpacity"], 0.5], 0.64], 0.28]],
      ["in", ["get", "targetId"], ["literal", this.completedIds]],
      ["min", 0.42, ["+", ["*", ["coalesce", ["get", "symbolOpacity"], 0.5], 0.28], 0.08]],
      ["*", ["coalesce", ["get", "symbolOpacity"], 0.5], 0.2]
    ];
  }

  getMountainRangeFillColorExpression() {
    return ["coalesce", ["get", "mountainRangeFillColor"], colors.mountainRangeFill];
  }

  getMountainRangeLineColorExpression() {
    return ["coalesce", ["get", "mountainRangeLineColor"], colors.mountainRangeLine];
  }

  getMountainRangeCorridorColorExpression() {
    if (this.studyPreviewMode) {
      return [
        "case",
        ["in", ["get", "targetId"], ["literal", this.memoryTrailWrongHighlightIds]],
        colors.memoryTrailWrongLine,
        ["in", ["get", "targetId"], ["literal", this.memoryTrailCorrectHighlightIds]],
        colors.memoryTrailCorrectLine,
        ["in", ["get", "targetId"], ["literal", this.getActiveTargetVisualIds()]],
        colors.memoryTrailLine,
        ["in", ["get", "targetId"], ["literal", this.completedIds]],
        ["coalesce", ["get", "mountainRangeCorridorColor"], colors.mountainRangeFill],
        ["coalesce", ["get", "mountainRangeMutedColor"], colors.mountainRangeFill]
      ];
    }

    return ["coalesce", ["get", "mountainRangeCorridorColor"], colors.mountainRangeFill];
  }

  getMountainRangeCorridorWidthExpression() {
    return [
      "*",
      ["coalesce", ["get", "corridorWidthPx"], 30],
      [
        "case",
        ["in", ["get", "targetId"], ["literal", this.getActiveTargetVisualIds()]],
        1.22,
        ["in", ["get", "targetId"], ["literal", this.completedIds]],
        1.02,
        0.92
      ]
    ];
  }

  getMountainRangeCorridorOpacityExpression() {
    if (this.getDifficultyVisualState().isHard && !this.studyPreviewMode) {
      return [
        "*",
        ["coalesce", ["get", "corridorOpacityScale"], 1],
        [
          "case",
          ["in", ["get", "targetId"], ["literal", this.getActiveTargetVisualIds()]],
          0.3,
          ["in", ["get", "targetId"], ["literal", this.completedIds]],
          0.12,
          0
        ]
      ];
    }

    return [
      "*",
      ["coalesce", ["get", "corridorOpacityScale"], 1],
      [
        "case",
        ["in", ["get", "targetId"], ["literal", this.getActiveTargetVisualIds()]],
        0.32,
        ["in", ["get", "targetId"], ["literal", this.completedIds]],
        0.12,
        0.075
      ]
    ];
  }

  getActiveTargetVisualIds() {
    return [...new Set([
      ...this.getMemoryTrailActiveHighlightIds(),
      this.selectedTargetId
    ].filter(Boolean))];
  }

  getPoliticalFillExpression() {
    return [
      "step",
      ["coalesce", ["get", "MAPCOLOR13"], 1],
      colors.hardContextPalette[0],
      2,
      colors.hardContextPalette[1],
      3,
      colors.hardContextPalette[2],
      4,
      colors.hardContextPalette[3],
      5,
      colors.hardContextPalette[4],
      6,
      colors.hardContextPalette[5],
      7,
      colors.hardContextPalette[6],
      8,
      colors.hardContextPalette[7],
      9,
      colors.hardContextPalette[8],
      10,
      colors.hardContextPalette[9]
    ];
  }

  getHardWorldContextFillExpression() {
    return this.getPoliticalFillExpression();
  }

  getUsStateContextFillExpression() {
    return [
      "match",
      ["coalesce", ["get", "id"], ["get", "state"], ["get", "fips"]],
      ...this.getUsStateHardColorStops(),
      colors.hardContextPalette[9]
    ];
  }

  getUsStateHardColorStops() {
    return this.stateTargets.features.flatMap((feature, index) => [
      feature.properties.id,
      colors.hardContextPalette[index % colors.hardContextPalette.length]
    ]);
  }

  getCapitalFillExpression() {
    if (this.studyPreviewMode) {
      return [
        "case",
        ["in", ["get", "id"], ["literal", this.memoryTrailWrongHighlightIds]],
        colors.memoryTrailWrongFill,
        ["in", ["get", "id"], ["literal", this.memoryTrailCorrectHighlightIds]],
        colors.memoryTrailCorrectFill,
        ["in", ["get", "id"], ["literal", this.memoryTrailHighlightIds]],
        colors.memoryTrailFill,
        ["in", ["get", "id"], ["literal", this.completedIds]],
        ["match", ["get", "id"], ...this.getColorMatchStops(), colors.neutralMarker],
        colors.neutralMarker
      ];
    }

    if (this.getDifficultyVisualState().isHard) {
      return colors.neutralMarker;
    }

    return [
      "case",
      ["in", ["get", "id"], ["literal", this.completedIds]],
      ["match", ["get", "id"], ...this.getColorMatchStops(), colors.neutralMarker],
      colors.neutralMarker
    ];
  }

  getPointMarkerType(feature) {
    if (feature?.capitalType === "national" || feature?.icon === "national-capital") {
      return "national-capital";
    }

    if (feature?.type === "federal-district" && feature?.id === "washington-dc") {
      return "national-capital";
    }

    if (feature?.capitalType === "state" || feature?.icon === "state-capital" || feature?.type === "capital") {
      return "state-capital";
    }

    return "city";
  }

  ensureCapitalMarkerImages() {
    this.addCapitalMarkerImage("mappa-state-capital-star", "state");
    this.addCapitalMarkerImage("mappa-national-capital-star-ring", "national");
  }

  addCapitalMarkerImage(id, markerType) {
    if (this.map.hasImage(id)) {
      return;
    }

    const size = 48;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const context = canvas.getContext("2d");

    if (!context) {
      return;
    }

    context.clearRect(0, 0, size, size);
    context.lineJoin = "round";
    context.lineCap = "round";

    if (markerType === "national") {
      context.beginPath();
      context.arc(24, 24, 16, 0, Math.PI * 2);
      context.fillStyle = colors.neutralMarker;
      context.strokeStyle = colors.neutralMarkerStroke;
      context.lineWidth = 4;
      context.fill();
      context.stroke();
      this.drawCapitalStar(context, 24, 24, 10, 4.4, colors.neutralMarkerStroke, colors.neutralMarkerStroke, 1.8);
    } else {
      this.drawCapitalStar(context, 24, 24, 15, 6.5, colors.neutralMarker, colors.neutralMarkerStroke, 4);
    }

    this.map.addImage(id, context.getImageData(0, 0, size, size), { pixelRatio: 2 });
  }

  drawCapitalStar(context, centerX, centerY, outerRadius, innerRadius, fill, stroke, strokeWidth) {
    context.beginPath();

    for (let point = 0; point < 10; point += 1) {
      const angle = -Math.PI / 2 + point * Math.PI / 5;
      const radius = point % 2 === 0 ? outerRadius : innerRadius;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;

      if (point === 0) {
        context.moveTo(x, y);
      } else {
        context.lineTo(x, y);
      }
    }

    context.closePath();
    context.fillStyle = fill;
    context.strokeStyle = stroke;
    context.lineWidth = strokeWidth;
    context.fill();
    context.stroke();
  }

  ensureMountainRangeImages() {
    this.addMountainRangeGlowImage();
    this.addMountainRangeGlyphImage();

    Object.entries(mountainRangeColorStyles).forEach(([styleId, style]) => {
      this.addMountainRangeGlowImage(`mappa-mountain-range-glow-${styleId}`, style);
      this.addMountainRangeGlyphImage(`mappa-mountain-range-glyph-${styleId}`, style);
    });
  }

  addMountainRangeGlowImage(id = "mappa-mountain-range-glow", style = null) {
    if (this.map.hasImage(id)) {
      return;
    }

    const size = 88;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const context = canvas.getContext("2d");

    if (!context) {
      return;
    }

    context.clearRect(0, 0, size, size);
    context.lineJoin = "round";
    context.lineCap = "round";
    context.shadowColor = hexToRgbaString(style?.corridor || "#b46818", 0.42);
    context.shadowBlur = 18;

    this.drawMountainGlowGlyph(context, [
      [12, 62],
      [31, 34],
      [49, 62]
    ], style);
    this.drawMountainGlowGlyph(context, [
      [28, 65],
      [52, 20],
      [76, 65]
    ], style);
    this.drawMountainGlowGlyph(context, [
      [4, 67],
      [22, 44],
      [39, 67]
    ], style);

    context.shadowColor = "transparent";
    const gradient = context.createRadialGradient(45, 48, 8, 45, 48, 42);
    gradient.addColorStop(0, hexToRgbaString(style?.corridor || "#f59e0b", 0.22));
    gradient.addColorStop(0.58, hexToRgbaString(style?.fill || "#d97706", 0.12));
    gradient.addColorStop(1, hexToRgbaString(style?.fill || "#d97706", 0));
    context.fillStyle = gradient;
    context.beginPath();
    context.ellipse(45, 51, 39, 24, -0.16, 0, Math.PI * 2);
    context.fill();

    this.map.addImage(id, context.getImageData(0, 0, size, size), { pixelRatio: 2 });
  }

  addMountainRangeGlyphImage(id = "mappa-mountain-range-glyph", style = null) {
    if (this.map.hasImage(id)) {
      return;
    }

    const size = 56;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const context = canvas.getContext("2d");

    if (!context) {
      return;
    }

    context.clearRect(0, 0, size, size);
    context.lineJoin = "round";
    context.lineCap = "round";
    context.shadowColor = hexToRgbaString(style?.line || "#442408", 0.24);
    context.shadowBlur = 5;
    context.shadowOffsetY = 1.2;

    this.drawMountainGlyph(context, [
      [8, 39],
      [20, 22],
      [31, 39]
    ], style);
    this.drawMountainGlyph(context, [
      [20, 41],
      [34, 14],
      [49, 41]
    ], style);
    this.drawMountainGlyph(context, [
      [2, 43],
      [13, 29],
      [25, 43]
    ], style);

    context.shadowColor = "transparent";
    context.beginPath();
    context.moveTo(10, 45);
    context.quadraticCurveTo(27, 49, 46, 44);
    context.strokeStyle = hexToRgbaString(style?.line || "#7c3f12", 0.5);
    context.lineWidth = 2.5;
    context.stroke();

    this.map.addImage(id, context.getImageData(0, 0, size, size), { pixelRatio: 2 });
  }

  drawMountainGlowGlyph(context, points, style = null) {
    context.beginPath();
    context.moveTo(points[0][0], points[0][1]);
    context.lineTo(points[1][0], points[1][1]);
    context.lineTo(points[2][0], points[2][1]);
    context.closePath();
    context.fillStyle = hexToRgbaString(style?.corridor || "#f59e0b", 0.3);
    context.fill();
  }

  drawMountainGlyph(context, points, style = null) {
    context.beginPath();
    context.moveTo(points[0][0], points[0][1]);
    context.lineTo(points[1][0], points[1][1]);
    context.lineTo(points[2][0], points[2][1]);
    context.closePath();
    context.fillStyle = hexToRgbaString(style?.fill || "#b8711d", 0.84);
    context.strokeStyle = hexToRgbaString(style?.line || "#5c3110", 0.9);
    context.lineWidth = 3.1;
    context.fill();
    context.stroke();

    context.beginPath();
    context.moveTo(points[1][0], points[1][1] + 3);
    context.lineTo(points[1][0] - 4, points[1][1] + 10);
    context.lineTo(points[1][0] + 1, points[1][1] + 8);
    context.lineTo(points[1][0] + 5, points[1][1] + 13);
    context.strokeStyle = "rgba(255, 247, 237, 0.82)";
    context.lineWidth = 2.2;
    context.stroke();
  }

  getCapitalRadiusExpression() {
    return [
      "case",
      ["in", ["get", "id"], ["literal", this.getMemoryTrailActiveHighlightIds()]],
      8,
      ["in", ["get", "id"], ["literal", this.completedIds]],
      7,
      6
    ];
  }

  getCapitalHitRadiusExpression() {
    const { isEasy, isMedium } = this.getDifficultyVisualState();

    if (isEasy) {
      return ["get", "easyHitRadius"];
    }

    if (isMedium) {
      return ["get", "mediumHitRadius"];
    }

    return ["get", "hardHitRadius"];
  }

  getCapitalOpacityExpression() {
    if (this.studyPreviewMode) {
      return 1;
    }

    const visualState = this.getDifficultyVisualState();

    if (visualState.showsPointHintsBeforePlacement) {
      return 1;
    }

    if (visualState.showsPointCompletionFeedback) {
      return [
        "case",
        ["in", ["get", "id"], ["literal", this.completedIds]],
        1,
        0
      ];
    }

    return 0;
  }

  getCapitalStrokeOpacityExpression() {
    return this.getCapitalOpacityExpression();
  }

  getCapitalHaloOpacityExpression() {
    if (this.studyPreviewMode) {
      return [
        "case",
        ["in", ["get", "id"], ["literal", this.getMemoryTrailActiveHighlightIds()]],
        0.28,
        ["in", ["get", "id"], ["literal", this.completedIds]],
        0.18,
        0.1
      ];
    }

    const visualState = this.getDifficultyVisualState();

    if (visualState.showsPointHintsBeforePlacement) {
      return 0.14;
    }

    if (visualState.showsPointCompletionFeedback) {
      return [
        "case",
        ["in", ["get", "id"], ["literal", this.completedIds]],
        0.18,
        0
      ];
    }

    return 0;
  }

  getColorMatchStops() {
    return this.activity.targets.flatMap((feature) => [feature.id, this.getTargetVisualColor(feature)]);
  }

  getMutedTargetColorStops() {
    return this.activity.targets.flatMap((feature, index) => [
      feature.id,
      feature.type === "mountain-range"
        ? this.getMountainRangeColorProperties(feature).mountainRangeMutedColor
        : feature.mutedColor
        || (this.isContinentsOceansActivity() && !this.isOceanTarget(feature) ? mixHexColor(feature.color) : null)
        || colors.mutedTargetPalette[index % colors.mutedTargetPalette.length]
    ]);
  }

  getRiverLineColorExpression() {
    return [
      "case",
      ["in", ["get", "id"], ["literal", this.memoryTrailWrongHighlightIds]],
      colors.memoryTrailWrongFill,
      ["in", ["get", "id"], ["literal", this.memoryTrailCorrectHighlightIds]],
      colors.memoryTrailCorrectFill,
      ["in", ["get", "id"], ["literal", this.memoryTrailHighlightIds]],
      colors.riverLineHighlight,
      ["in", ["get", "id"], ["literal", this.completedIds]],
      colors.riverLine,
      ["coalesce", ["get", "mutedColor"], colors.riverLineMuted]
    ];
  }

  getRiverLineWidthExpression() {
    return [
      "case",
      ["in", ["get", "id"], ["literal", [...this.memoryTrailHighlightIds, ...this.memoryTrailCorrectHighlightIds, ...this.memoryTrailWrongHighlightIds]]],
      ["coalesce", ["get", "highlightWidthPx"], 5],
      ["coalesce", ["get", "lineWidthPx"], 2]
    ];
  }

  getRiverLineOpacityExpression() {
    return [
      "case",
      ["in", ["get", "id"], ["literal", [...this.memoryTrailHighlightIds, ...this.memoryTrailCorrectHighlightIds, ...this.memoryTrailWrongHighlightIds]]],
      0.98,
      0.68
    ];
  }

  getRiverHitWidthExpression() {
    return [
      "coalesce",
      ["get", "hitWidthPx"],
      34
    ];
  }

  setUnitedStatesContextVisibility(visibility) {
    ["us-state-context-fill", "us-state-context-line"].forEach((layerId) => {
      if (this.map.getLayer(layerId)) {
        this.map.setLayoutProperty(layerId, "visibility", visibility);
      }
    });
  }

  setOverviewVisibility(visibility) {
    ["overview-region-fill", "overview-region-line", "overview-point-preview"].forEach((layerId) => {
      if (this.map.getLayer(layerId)) {
        this.map.setLayoutProperty(layerId, "visibility", visibility);
      }
    });
  }

  updateOceanRegionVisibility() {
    if (!this.map?.getLayer("ocean-region-fill")) {
      return;
    }

    this.map.setLayoutProperty("ocean-region-fill", "visibility", "visible");

    if (this.map.getLayer("ocean-region-line")) {
      this.map.setLayoutProperty("ocean-region-line", "visibility", "visible");
    }
  }

  updateBaseLabelVisibility() {
    if (!this.map?.getLayer("country-labels")) {
      return;
    }

    this.map.setLayoutProperty("country-labels", "visibility", "none");
  }

  updateHardContextVisibility() {
    if (!this.map) {
      return;
    }

    const { isHard } = this.getDifficultyVisualState();
    const shouldShow = this.currentView === "study" && isHard;

    if (this.map.getLayer("hard-world-context-fill")) {
      this.map.setLayoutProperty("hard-world-context-fill", "visibility", shouldShow ? "visible" : "none");
    }

    if (this.map.getLayer("us-state-context-fill") && this.activity?.map?.region === "united-states") {
      this.map.setLayoutProperty("us-state-context-fill", "visibility", this.currentView === "study" ? "visible" : "none");
    }
  }

  updateDifficultyLayerVisibility() {
    if (!this.map || this.currentView !== "study") {
      ["ocean-target-raster", "state-fill", "state-line", "mountain-range-corridor", "mountain-range-symbol-glow", "mountain-range-symbol", "river-line", "river-hit-line", "target-hit-fill", "capital-marker-halo", "capital-marker", "state-capital-star", "national-capital-ring", "national-capital-star", "capital-hit", "completed-label"].forEach((layerId) => {
        if (this.map?.getLayer(layerId)) {
          this.map.setLayoutProperty(layerId, "visibility", "none");
        }
      });
      return;
    }

    const visualState = this.getDifficultyVisualState();
    const hasCompletedTargets = this.completedIds.length > 0;
    const showGuidedTargets = visualState.usesProgressReveal
      || this.shouldShowHardContinentChallenge()
      || (visualState.isHard && hasCompletedTargets);

    if (this.map.getLayer("state-fill")) {
      this.map.setLayoutProperty("state-fill", "visibility", showGuidedTargets ? "visible" : "none");
    }

    if (this.map.getLayer("ocean-target-raster")) {
      this.map.setLayoutProperty("ocean-target-raster", "visibility", showGuidedTargets && !this.isContinentsOceansActivity() ? "visible" : "none");
    }

    if (this.map.getLayer("state-line")) {
      this.map.setLayoutProperty("state-line", "visibility", showGuidedTargets ? "visible" : "none");
    }

    if (this.map.getLayer("mountain-range-corridor")) {
      this.map.setLayoutProperty("mountain-range-corridor", "visibility", showGuidedTargets ? "visible" : "none");
    }

    if (this.map.getLayer("mountain-range-symbol-glow")) {
      this.map.setLayoutProperty("mountain-range-symbol-glow", "visibility", showGuidedTargets ? "visible" : "none");
    }

    if (this.map.getLayer("mountain-range-symbol")) {
      this.map.setLayoutProperty("mountain-range-symbol", "visibility", showGuidedTargets ? "visible" : "none");
    }

    if (this.map.getLayer("river-line")) {
      this.map.setLayoutProperty("river-line", "visibility", showGuidedTargets ? "visible" : "none");
    }

    if (this.map.getLayer("river-hit-line")) {
      this.map.setLayoutProperty("river-hit-line", "visibility", "visible");
    }

    if (this.map.getLayer("target-hit-fill")) {
      this.map.setLayoutProperty("target-hit-fill", "visibility", "visible");
    }

    const shouldShowPointMarkers = this.presentationSettings.showCities !== false
      || this.presentationSettings.showCapitals !== false;

    if (this.map.getLayer("capital-marker-halo")) {
      this.map.setLayoutProperty("capital-marker-halo", "visibility", shouldShowPointMarkers ? "visible" : "none");
    }

    if (this.map.getLayer("capital-marker")) {
      this.map.setLayoutProperty("capital-marker", "visibility", shouldShowPointMarkers ? "visible" : "none");
    }

    if (this.map.getLayer("state-capital-star")) {
      this.map.setLayoutProperty("state-capital-star", "visibility", shouldShowPointMarkers ? "visible" : "none");
    }

    if (this.map.getLayer("national-capital-ring")) {
      this.map.setLayoutProperty("national-capital-ring", "visibility", shouldShowPointMarkers ? "visible" : "none");
    }

    if (this.map.getLayer("national-capital-star")) {
      this.map.setLayoutProperty("national-capital-star", "visibility", shouldShowPointMarkers ? "visible" : "none");
    }

    if (this.map.getLayer("capital-hit")) {
      this.map.setLayoutProperty("capital-hit", "visibility", "visible");
    }

    if (this.map.getLayer("completed-label")) {
      this.map.setLayoutProperty("completed-label", "visibility", visualState.showsCompletedLabels ? "visible" : "none");
    }
  }

  setStudyVisibility(visibility) {
    ["ocean-target-raster", "state-fill", "state-line", "mountain-range-corridor", "mountain-range-symbol-glow", "mountain-range-symbol", "river-line", "river-hit-line", "target-hit-fill", "capital-marker-halo", "capital-marker", "state-capital-star", "national-capital-ring", "national-capital-star", "capital-hit", "completed-label"].forEach((layerId) => {
      if (this.map.getLayer(layerId)) {
        this.map.setLayoutProperty(layerId, "visibility", visibility);
      }
    });
  }
}
