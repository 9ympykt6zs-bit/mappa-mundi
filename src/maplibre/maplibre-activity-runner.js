import {
  baseWaterColor,
  oceanCompletedColor,
  oceanCompletedOutlineColor,
  oceanRegionColors,
  oceanZoneMutedColor,
  oceanTextureSize
} from "./ocean-textures.js?v=20260531-geography-core-card-refresh";

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
    this.memoryTrailHighlightIds = [];
    this.memoryTrailCorrectHighlightIds = [];
    this.memoryTrailWrongHighlightIds = [];
    this.placementInteractionState = {
      active: false,
      dragging: false
    };
  }

  onTargetClick(handler) {
    this.targetClickHandler = handler;
  }

  onRegionSelect(handler) {
    this.regionSelectHandler = handler;
  }

  async load({ activity, worldCountries, oceanZones, inlandWaters, usStatesAtlas, stateTargets, northAmericaAdmin1, australiaAdmin1, chinaAdmin1, russiaAdmin1, indiaAdmin1, brazilAdmin1, japanAdmin1, germanyAdmin1, franceAdmin1, spainAdmin1, italyAdmin1, unitedKingdomAdmin1 }) {
    this.activity = activity;
    this.worldCountries = worldCountries;
    this.oceanZones = oceanZones || emptyFeatureCollection;
    this.inlandWaters = inlandWaters || emptyFeatureCollection;
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

    const regionFlyDuration = 1100;
    const activityId = this.activity?.id;

    this.map.flyTo({
      center: this.activity.map?.regionView?.center || [-98, 39],
      zoom: this.activity.map?.regionView?.zoom || 3.1,
      pitch: 0,
      bearing: 0,
      duration: regionFlyDuration,
      essential: true
    });

    window.setTimeout(() => {
      if (this.currentView === "study" && this.activity?.id === activityId) {
        const studyView = this.activity.map?.studyView || {};
        this.map.fitBounds(studyView.bounds || [[-74.35, 40.85], [-66.75, 47.55]], {
          padding: studyView.padding || { top: 55, right: 46, bottom: 78, left: 46 },
          duration: studyView.duration || 1200,
          essential: true
        });
      }
    }, regionFlyDuration + 100);
  }

  enterOverview() {
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

    this.map.flyTo({
      center: overviewView.center,
      zoom: overviewView.zoom,
      pitch: 0,
      bearing: 0,
      duration: 1000,
      essential: true
    });
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

    this.map.flyTo({
      center: view.center,
      zoom: view.zoom,
      pitch: 0,
      bearing: 0,
      duration: 700,
      essential: true
    });
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

    const capitalSource = this.map.getSource("study-capitals");
    const shapeSource = this.map.getSource("target-shapes");

    if (shapeSource) {
      shapeSource.setData(this.getTargetShapeGeoJson());
    }

    if (capitalSource) {
      capitalSource.setData(this.getCapitalGeoJson());
    }

    this.refreshStudyFilters();
    this.updateParentCountryOutline();
    this.refreshOceanHighlightImages();
    this.updateOceanRegionVisibility();
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

  flyToCameraTarget(target = {}) {
    if (!this.map || !Array.isArray(target.center) || typeof target.zoom !== "number") {
      return Promise.resolve(false);
    }

    return new Promise((resolve) => {
      const duration = typeof target.duration === "number" ? target.duration : 900;
      const finish = () => resolve(true);
      window.setTimeout(finish, duration + 80);
      this.map.stop();
      this.map.flyTo({
        center: target.center,
        zoom: target.zoom,
        pitch: 0,
        bearing: 0,
        duration,
        essential: true
      });
    });
  }

  fitStudyView() {
    const studyView = this.activity.map?.studyView || {};
    this.map.fitBounds(studyView.bounds || [[-74.35, 40.85], [-66.75, 47.55]], {
      padding: studyView.padding || { top: 55, right: 46, bottom: 78, left: 46 },
      duration: 450,
      essential: true
    });
  }

  fitCurrentView() {
    this.refreshDifficultyVisuals();

    if (this.currentView === "study") {
      this.fitStudyView();
      return;
    }

    this.enterOverview();
  }

  focusTarget(target) {
    if (!this.map || !target) {
      return;
    }

    const camera = this.getTargetFocusCamera(target);

    if (!camera) {
      return;
    }

    this.map.stop();

    if (camera.bounds) {
      this.map.fitBounds(camera.bounds, {
        padding: camera.padding,
        maxZoom: camera.maxZoom,
        retainPadding: false,
        duration: camera.duration,
        essential: true
      });
      return;
    }

    this.map.easeTo({
      center: camera.center,
      zoom: camera.zoom,
      padding: camera.padding,
      pitch: 0,
      bearing: 0,
      retainPadding: false,
      duration: camera.duration,
      essential: true
    });
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
      return false;
    }

    this.map.stop();
    this.map.fitBounds(bounds, {
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
    });

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
      data: this.oceanZones || emptyFeatureCollection
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
        "fill-antialias": true
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
      filter: ["!=", ["get", "isOceanZone"], true],
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
          0.01
        ]
      }
    });

    this.map.addLayer({
      id: "capital-marker-halo",
      type: "circle",
      source: "study-capitals",
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

    this.map.addLayer({
      id: "capital-marker",
      type: "circle",
      source: "study-capitals",
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

    ["state-fill", "target-hit-fill", "capital-hit", "capital-marker", "capital-marker-halo"].forEach((layerId) => {
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

  getTargetIdAtMapPoint(point, selectedTarget = null) {
    return this.getTargetIdsAtMapPoint(point, selectedTarget)[0] || null;
  }

  getTargetIdsAtClientPoint(clientX, clientY, selectedTarget = null) {
    if (!this.map || this.currentView !== "study") {
      return [];
    }

    const rect = this.map.getContainer().getBoundingClientRect();
    const point = {
      x: clientX - rect.left,
      y: clientY - rect.top
    };

    return this.getTargetIdsAtMapPoint(point, selectedTarget);
  }

  getTargetIdsAtMapPoint(point, selectedTarget = null) {
    const queryPoint = Array.isArray(point) ? point : [point.x, point.y];
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
        layers: ["target-hit-fill"]
      });

      stateFeatures.forEach((feature) => {
        if (!targetIds.includes(feature.properties.id)) {
          targetIds.push(feature.properties.id);
        }
      });

      if (stateFeatures.length === 0 && this.currentView === "study") {
        this.getFallbackShapeTargetIdsAtPoint(queryPoint, selectedTarget).forEach((targetId) => {
          if (!targetIds.includes(targetId)) {
            targetIds.push(targetId);
          }
        });
      }
    }

    return this.filterContinentsOceansOceanHitsAtPoint(targetIds, queryPoint);
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

    const nearMissBox = isCoarsePointer ? 46 : 32;
    const nearbyFeatures = this.map.queryRenderedFeatures([
      [queryPoint[0] - nearMissBox, queryPoint[1] - nearMissBox],
      [queryPoint[0] + nearMissBox, queryPoint[1] + nearMissBox]
    ], {
      layers: ["target-hit-fill"]
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
            labelFontSize: feature.label?.fontSize || feature.labelFontSize || 11
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

  getTargetShapeFeature(target) {
    const sourceFeature = this.findSourceShapeFeature(target, this.activity);

    if (!sourceFeature) {
      return null;
    }

    return {
      type: "Feature",
      properties: {
        ...sourceFeature.properties,
        id: target.id,
        name: target.name,
        color: target.color,
        isOceanZone: target.type === "zone",
        suppressInternalTargetLines: this.shouldSuppressInternalTargetLines(target)
      },
      geometry: sourceFeature.geometry
    };
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

    const continentName = target.id === "australia" ? "Oceania" : target.name;
    const features = this.worldCountries.features.filter((feature) => feature.properties?.CONTINENT === continentName);
    const coordinates = features.flatMap((feature) => this.getContinentFeaturePolygons(feature, target));

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

  getContinentFeaturePolygons(feature, target) {
    const polygons = feature.geometry.type === "Polygon"
      ? [feature.geometry.coordinates]
      : feature.geometry.coordinates;

    if (target.id !== "europe") {
      return polygons;
    }

    return this.filterPolygonsToExtent(polygons, europeGeographicExtent);
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

    if (shapeSource) {
      shapeSource.setData(this.getTargetShapeGeoJson());
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
        colors.studyTargetFill
      ];
    }

    if (this.getDifficultyVisualState().isHard) {
      return [
        "case",
        ["in", ["get", "id"], ["literal", this.completedIds]],
        ["match", ["get", "id"], ...this.getColorMatchStops(), colors.targetFill],
        colors.targetFill
      ];
    }

    return [
      "case",
      ["in", ["get", "id"], ["literal", this.completedIds]],
      ["match", ["get", "id"], ...this.getColorMatchStops(), colors.targetFill],
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
        colors.studyTargetFill
      ];
    }

    const isHard = this.getDifficultyVisualState().isHard;
    const shouldRevealContinents = !isHard || this.areAllContinentTargetsCompleted();

    return [
      "case",
      ["boolean", ["get", "isOceanZone"], false],
      oceanZoneMutedColor,
      ["in", ["get", "id"], ["literal", this.completedIds]],
      ["match", ["get", "id"], ...this.getColorMatchStops(), colors.targetFill],
      shouldRevealContinents,
      ["match", ["get", "id"], ...this.getMutedTargetColorStops(), colors.targetFill],
      colors.hardContinentChallengeFill
    ];
  }

  getShapeFillOpacityExpression() {
    if (this.isContinentsOceansActivity()) {
      return this.getContinentsOceansFillOpacityExpression();
    }

    if (this.studyPreviewMode) {
      return [
        "case",
        ["in", ["get", "id"], ["literal", this.getMemoryTrailActiveHighlightIds()]],
        0.98,
        ["in", ["get", "id"], ["literal", this.completedIds]],
        0.96,
        0.52
      ];
    }

    if (this.getDifficultyVisualState().isHard) {
      return [
        "case",
        ["in", ["get", "id"], ["literal", this.completedIds]],
        0.96,
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
        0.98,
        ["in", ["get", "id"], ["literal", this.completedIds]],
        0.96,
        0.52
      ];
    }

    if (this.getDifficultyVisualState().isHard) {
      return [
        "case",
        ["boolean", ["get", "isOceanZone"], false],
        0,
        ["in", ["get", "id"], ["literal", this.completedIds]],
        0.96,
        this.areAllContinentTargetsCompleted(),
        0.96,
        0.9
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
      0.8
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
        colors.studyTargetLine
      ];
    }

    return colors.targetStroke;
  }

  getShapeLineOpacityExpression() {
    if (this.studyPreviewMode) {
      return [
        "case",
        ["boolean", ["get", "isOceanZone"], false],
        0,
        ["boolean", ["get", "suppressInternalTargetLines"], false],
        0,
        ["in", ["get", "id"], ["literal", this.getMemoryTrailActiveHighlightIds()]],
        1,
        ["in", ["get", "id"], ["literal", this.completedIds]],
        1,
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
        0
      ];
    }

    return 2.15;
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
    return this.activity.targets.flatMap((feature) => [feature.id, feature.color]);
  }

  getMutedTargetColorStops() {
    return this.activity.targets.flatMap((feature, index) => [
      feature.id,
      feature.mutedColor
        || (this.isContinentsOceansActivity() && !this.isOceanTarget(feature) ? mixHexColor(feature.color) : null)
        || colors.mutedTargetPalette[index % colors.mutedTargetPalette.length]
    ]);
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
      ["ocean-target-raster", "state-fill", "state-line", "target-hit-fill", "capital-marker-halo", "capital-marker", "capital-hit", "completed-label"].forEach((layerId) => {
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
      this.map.setLayoutProperty("ocean-target-raster", "visibility", showGuidedTargets ? "visible" : "none");
    }

    if (this.map.getLayer("state-line")) {
      this.map.setLayoutProperty("state-line", "visibility", showGuidedTargets ? "visible" : "none");
    }

    if (this.map.getLayer("target-hit-fill")) {
      this.map.setLayoutProperty("target-hit-fill", "visibility", "visible");
    }

    // Cities and capitals share this point-marker layer until they are split.
    const shouldShowPointMarkers = this.presentationSettings.showCities !== false
      || this.presentationSettings.showCapitals !== false;

    if (this.map.getLayer("capital-marker-halo")) {
      this.map.setLayoutProperty("capital-marker-halo", "visibility", shouldShowPointMarkers ? "visible" : "none");
    }

    if (this.map.getLayer("capital-marker")) {
      this.map.setLayoutProperty("capital-marker", "visibility", shouldShowPointMarkers ? "visible" : "none");
    }

    if (this.map.getLayer("capital-hit")) {
      this.map.setLayoutProperty("capital-hit", "visibility", "visible");
    }

    if (this.map.getLayer("completed-label")) {
      this.map.setLayoutProperty("completed-label", "visibility", visualState.showsCompletedLabels ? "visible" : "none");
    }
  }

  setStudyVisibility(visibility) {
    ["ocean-target-raster", "state-fill", "state-line", "target-hit-fill", "capital-marker-halo", "capital-marker", "capital-hit", "completed-label"].forEach((layerId) => {
      if (this.map.getLayer(layerId)) {
        this.map.setLayoutProperty(layerId, "visibility", visibility);
      }
    });
  }
}
