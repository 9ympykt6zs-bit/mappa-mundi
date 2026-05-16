import {
  baseWaterColor,
  createBaseWaterImage,
  createOceanRegionImage,
  globeTextureBounds
} from "./ocean-textures.js?v=global-ocean-png";

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

const baseWaterImage = createBaseWaterImage();
const oceanRegionImage = createOceanRegionImage();
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

function getOceanZoneFeature(id) {
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
  }

  onTargetClick(handler) {
    this.targetClickHandler = handler;
  }

  onRegionSelect(handler) {
    this.regionSelectHandler = handler;
  }

  async load({ activity, worldCountries, usStatesAtlas, stateTargets, northAmericaAdmin1 }) {
    this.activity = activity;
    this.worldCountries = worldCountries;
    this.usStatesAtlas = usStatesAtlas;
    this.stateTargets = stateTargets;
    this.northAmericaAdmin1 = northAmericaAdmin1 || emptyFeatureCollection;
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
    this.resizeSoon();
    this.updateOceanRegionVisibility();
    this.updateBaseLabelVisibility();
    this.updateHardContextVisibility();
    this.setOverviewVisibility("none");
    this.setUnitedStatesContextVisibility(this.activity.map?.region === "united-states" ? "visible" : "none");
    this.setStudyVisibility("visible");
    this.refreshDifficultyVisuals();

    this.map.flyTo({
      center: this.activity.map?.regionView?.center || [-98, 39],
      zoom: this.activity.map?.regionView?.zoom || 3.1,
      pitch: 0,
      bearing: 0,
      duration: 1100,
      essential: true
    });

    window.setTimeout(() => {
      if (this.currentView === "study") {
        const studyView = this.activity.map?.studyView || {};
        this.map.fitBounds(studyView.bounds || [[-74.35, 40.85], [-66.75, 47.55]], {
          padding: studyView.padding || { top: 55, right: 46, bottom: 78, left: 46 },
          duration: studyView.duration || 1200,
          essential: true
        });
      }
    }, 950);
  }

  enterOverview() {
    this.currentView = "overview";
    this.resizeSoon();
    this.updateOceanRegionVisibility();
    this.updateBaseLabelVisibility();
    this.updateHardContextVisibility();
    this.setOverviewVisibility("visible");
    this.setUnitedStatesContextVisibility("none");
    this.setStudyVisibility("none");
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

  setDifficulty(difficulty) {
    this.difficulty = normalizeDifficulty(difficulty);
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
        .filter(Boolean)
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

    this.map.addSource("base-water", {
      type: "image",
      url: baseWaterImage,
      coordinates: globeTextureBounds
    });

    this.map.addLayer({
      id: "base-water-raster",
      type: "raster",
      source: "base-water",
      paint: {
        "raster-opacity": 1,
        "raster-fade-duration": 0,
        "raster-resampling": "linear"
      }
    });

    this.map.addLayer({
      id: "world-land",
      type: "fill",
      source: "world-countries",
      paint: {
        "fill-color": this.getPoliticalFillExpression(),
        "fill-opacity": 1
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
        "line-opacity": 0.88
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
  }

  addOceanRegionLayer() {
    this.map.addSource("ocean-regions", {
      type: "image",
      url: oceanRegionImage,
      coordinates: globeTextureBounds
    });

    this.map.addLayer({
      id: "ocean-region-raster",
      type: "raster",
      source: "ocean-regions",
      layout: {
        visibility: "visible"
      },
      paint: {
        "raster-opacity": 1,
        "raster-fade-duration": 0,
        "raster-resampling": "linear"
      }
    }, "world-land");
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

    this.map.addLayer({
      id: "state-fill",
      type: "fill",
      source: "target-shapes",
      layout: {
        visibility: "none"
      },
      paint: {
        "fill-color": this.getStateFillExpression(),
        "fill-opacity": this.getShapeFillOpacityExpression()
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
        "fill-opacity": 0.01
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
        if (this.currentView === "study") {
          this.map.getCanvas().style.cursor = "pointer";
        }
      });
      this.map.on("mouseleave", layerId, () => {
        this.map.getCanvas().style.cursor = "";
      });
    });
  }

  handleMapClick(event) {
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
    }

    return targetIds;
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
    this.getRenderedNavigationFeatures(queryPoint, "world-land", "world-country").forEach(addCandidate);
    this.getRenderedNavigationFeatures(queryPoint, "us-state-context-fill", "us-state").forEach(addCandidate);

    return candidates;
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
      targetId: properties.activityId || properties.id || null,
      sourceTargetId: properties.id || null,
      layerId: feature?.layer?.id || null,
      isoA3: properties.ISO_A3 || properties.ADM0_A3 || properties.SOV_A3 || properties.isoA3 || null,
      stateId: properties.id || properties.postal || null,
      continent: properties.CONTINENT || null,
      names
    };
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
            easyHitRadius: Math.max(feature.hitRadius || 14, 24),
            mediumHitRadius: Math.max(feature.hitRadius || 14, 20),
            hardHitRadius: Math.max(feature.hitRadius || 14, 16),
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
        isOceanZone: target.type === "zone"
      },
      geometry: sourceFeature.geometry
    };
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

    if (activity?.map?.admin1Source === "north-america-admin1") {
      return this.northAmericaAdmin1.features.find((feature) => {
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

  getContinentsOceanSourceFeature(target) {
    if (target.type === "zone") {
      return getOceanZoneFeature(target.id);
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
            name: feature.name,
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

    if (this.map.getLayer("state-fill")) {
      this.map.setPaintProperty("state-fill", "fill-color", this.getStateFillExpression());
      this.map.setPaintProperty("state-fill", "fill-opacity", this.getShapeFillOpacityExpression());
    }

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
      showsPointCompletionFeedback: difficulty !== difficultyModes.hard,
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

    if (this.getDifficultyVisualState().isHard) {
      return this.activity?.map?.region === "united-states"
        ? this.getUsStateContextFillExpression()
        : this.getHardWorldContextFillExpression();
    }

    return [
      "case",
      ["in", ["get", "id"], ["literal", this.completedIds]],
      ["match", ["get", "id"], ...this.getColorMatchStops(), colors.targetFill],
      ["match", ["get", "id"], ...this.getMutedTargetColorStops(), colors.targetFill]
    ];
  }

  getContinentsOceansFillExpression() {
    const isHard = this.getDifficultyVisualState().isHard;
    const shouldRevealContinents = !isHard || this.areAllContinentTargetsCompleted();

    return [
      "case",
      ["boolean", ["get", "isOceanZone"], false],
      ["match", ["get", "id"], ...this.getColorMatchStops(), colors.ocean],
      shouldRevealContinents,
      [
        "case",
        ["in", ["get", "id"], ["literal", this.completedIds]],
        ["match", ["get", "id"], ...this.getColorMatchStops(), colors.targetFill],
        ["match", ["get", "id"], ...this.getMutedTargetColorStops(), colors.targetFill]
      ],
      colors.hardContinentChallengeFill
    ];
  }

  getShapeFillOpacityExpression() {
    if (this.isContinentsOceansActivity()) {
      return this.getContinentsOceansFillOpacityExpression();
    }

    if (this.getDifficultyVisualState().isHard) {
      return 0.01;
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
    if (this.getDifficultyVisualState().isHard) {
      return [
        "case",
        ["boolean", ["get", "isOceanZone"], false],
        0,
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
    return colors.targetStroke;
  }

  getShapeLineOpacityExpression() {
    if (this.shouldShowHardContinentChallenge()) {
      return [
        "case",
        ["boolean", ["get", "isOceanZone"], false],
        0,
        1
      ];
    }

    if (this.getDifficultyVisualState().isHard) {
      return 0;
    }

    return [
      "case",
      ["boolean", ["get", "isOceanZone"], false],
      0,
      1
    ];
  }

  getShapeLineWidthExpression() {
    if (this.shouldShowHardContinentChallenge()) {
      return 2.15;
    }

    return this.getDifficultyVisualState().isHard ? 0 : 2.15;
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
    if (!this.map?.getLayer("ocean-region-raster")) {
      return;
    }

    this.map.setLayoutProperty("ocean-region-raster", "visibility", "visible");
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
      ["state-fill", "state-line", "target-hit-fill", "capital-marker-halo", "capital-marker", "capital-hit", "completed-label"].forEach((layerId) => {
        if (this.map?.getLayer(layerId)) {
          this.map.setLayoutProperty(layerId, "visibility", "none");
        }
      });
      return;
    }

    const visualState = this.getDifficultyVisualState();
    const showGuidedTargets = visualState.usesProgressReveal || this.shouldShowHardContinentChallenge();

    if (this.map.getLayer("state-fill")) {
      this.map.setLayoutProperty("state-fill", "visibility", showGuidedTargets ? "visible" : "none");
    }

    if (this.map.getLayer("state-line")) {
      this.map.setLayoutProperty("state-line", "visibility", showGuidedTargets ? "visible" : "none");
    }

    if (this.map.getLayer("target-hit-fill")) {
      this.map.setLayoutProperty("target-hit-fill", "visibility", "visible");
    }

    if (this.map.getLayer("capital-marker-halo")) {
      this.map.setLayoutProperty("capital-marker-halo", "visibility", visualState.isHard ? "none" : "visible");
    }

    if (this.map.getLayer("capital-marker")) {
      this.map.setLayoutProperty("capital-marker", "visibility", visualState.isHard ? "none" : "visible");
    }

    if (this.map.getLayer("capital-hit")) {
      this.map.setLayoutProperty("capital-hit", "visibility", "visible");
    }

    if (this.map.getLayer("completed-label")) {
      this.map.setLayoutProperty("completed-label", "visibility", visualState.showsCompletedLabels ? "visible" : "none");
    }
  }

  setStudyVisibility(visibility) {
    ["state-fill", "state-line", "target-hit-fill", "capital-marker-halo", "capital-marker", "capital-hit", "completed-label"].forEach((layerId) => {
      if (this.map.getLayer(layerId)) {
        this.map.setLayoutProperty(layerId, "visibility", visibility);
      }
    });
  }
}
