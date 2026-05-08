const colors = {
  ink: "#172033",
  ocean: "#dceff8",
  land: "#f8faf7",
  countryBorder: "#8896a6",
  stateContextFill: "#fbfcfd",
  stateContextLine: "#a7b1bf",
  stateFill: "#ffffff",
  targetStroke: "#111827",
  neutralMarker: "#ffffff",
  neutralMarkerStroke: "#172033",
  markerHalo: "#2563eb"
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
  }

  onTargetClick(handler) {
    this.targetClickHandler = handler;
  }

  onRegionSelect(handler) {
    this.regionSelectHandler = handler;
  }

  async load({ activity, worldCountries, usStatesAtlas, stateTargets }) {
    this.activity = activity;
    this.worldCountries = worldCountries;
    this.usStatesAtlas = usStatesAtlas;
    this.stateTargets = stateTargets;

    this.map = new this.maplibregl.Map({
      container: this.container,
      center: [-18, 18],
      zoom: 1.25,
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

    this.map.addControl(new this.maplibregl.NavigationControl({ visualizePitch: true }), "top-right");

    await new Promise((resolve) => {
      this.map.on("load", resolve);
    });

    this.addAtlasBaseLayers();
    this.addOverviewLayers();
    this.addStudyLayers();
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
    this.setOverviewVisibility("none");
    this.setUnitedStatesContextVisibility("visible");
    this.setStudyVisibility("visible");

    this.map.flyTo({
      center: [-98, 39],
      zoom: 3.1,
      pitch: 0,
      bearing: 0,
      duration: 1100,
      essential: true
    });

    window.setTimeout(() => {
      if (this.currentView === "study") {
        this.map.fitBounds([[-74.35, 40.85], [-66.75, 47.55]], {
          padding: { top: 55, right: 46, bottom: 78, left: 46 },
          duration: 1200,
          essential: true
        });
      }
    }, 950);
  }

  enterOverview() {
    this.currentView = "overview";
    this.setOverviewVisibility("visible");
    this.setUnitedStatesContextVisibility("none");
    this.setStudyVisibility("none");

    this.map.flyTo({
      center: [-18, 18],
      zoom: 1.25,
      pitch: 0,
      bearing: 0,
      duration: 1000,
      essential: true
    });
  }

  setCompletedTargets(completedIds) {
    this.completedIds = Array.from(completedIds);
    this.refreshStudyPaint();
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
        "fill-color": colors.land,
        "fill-opacity": 1
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
          0.35,
          4,
          0.8,
          7,
          1.1
        ],
        "line-opacity": 0.78
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
        "fill-color": colors.stateContextFill,
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
        "line-color": colors.stateContextLine,
        "line-width": 1.1,
        "line-opacity": 0.9
      }
    });
  }

  addOverviewLayers() {
    this.map.addSource("overview-regions", {
      type: "geojson",
      data: usOverviewRegion
    });

    this.map.addLayer({
      id: "overview-region-fill",
      type: "fill",
      source: "overview-regions",
      paint: {
        "fill-color": "#2563eb",
        "fill-opacity": 0.08
      }
    });

    this.map.addLayer({
      id: "overview-region-line",
      type: "line",
      source: "overview-regions",
      paint: {
        "line-color": "#2563eb",
        "line-dasharray": [3, 2],
        "line-width": 2
      }
    });

    this.map.addLayer({
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

    this.map.on("mouseenter", "overview-region-fill", () => {
      this.map.getCanvas().style.cursor = "pointer";
    });
    this.map.on("mouseleave", "overview-region-fill", () => {
      this.map.getCanvas().style.cursor = "";
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
      source: "study-states",
      layout: {
        visibility: "none"
      },
      paint: {
        "fill-color": this.getStateFillExpression(),
        "fill-opacity": 0.92
      }
    });

    this.map.addLayer({
      id: "state-line",
      type: "line",
      source: "study-states",
      layout: {
        visibility: "none"
      },
      paint: {
        "line-color": colors.targetStroke,
        "line-width": 2.15
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
          "max",
          ["get", "hitRadius"],
          16
        ],
        "circle-color": "#ffffff",
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

    ["state-fill", "capital-hit", "capital-marker", "capital-marker-halo"].forEach((layerId) => {
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
      const regionFeature = this.map.queryRenderedFeatures(event.point, {
        layers: ["overview-region-fill"]
      })[0];

      if (regionFeature?.properties?.id === "united-states") {
        this.regionSelectHandler?.("united-states");
      }

      return;
    }

    const pointFeature = this.map.queryRenderedFeatures(event.point, {
      layers: ["capital-hit", "capital-marker"]
    })[0];

    if (pointFeature) {
      this.targetClickHandler?.(pointFeature.properties.id);
      return;
    }

    const stateFeature = this.map.queryRenderedFeatures(event.point, {
      layers: ["state-fill"]
    })[0];

    if (stateFeature) {
      this.targetClickHandler?.(stateFeature.properties.id);
    }
  }

  getCapitalGeoJson() {
    return {
      type: "FeatureCollection",
      features: this.activity.features
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

  getCompletedLabelGeoJson() {
    return {
      type: "FeatureCollection",
      features: this.activity.features
        .filter((feature) => this.completedIds.includes(feature.id))
        .map((feature) => ({
          type: "Feature",
          properties: {
            id: feature.id,
            name: feature.name,
            labelFontSize: feature.labelFontSize || 11
          },
          geometry: {
            type: "Point",
            coordinates: this.getLabelCoordinates(feature)
          }
        }))
    };
  }

  getLabelCoordinates(feature) {
    if (feature.type === "state") {
      return stateLabelPositions[feature.id] || [-71.8, 42.8];
    }

    return [feature.lon, feature.lat];
  }

  refreshStudyPaint() {
    if (!this.map.isStyleLoaded()) {
      return;
    }

    if (this.map.getLayer("state-fill")) {
      this.map.setPaintProperty("state-fill", "fill-color", this.getStateFillExpression());
    }

    if (this.map.getLayer("capital-marker")) {
      this.map.setPaintProperty("capital-marker", "circle-color", this.getCapitalFillExpression());
      this.map.setPaintProperty("capital-marker", "circle-radius", this.getCapitalRadiusExpression());
    }

    const labelSource = this.map.getSource("completed-labels");

    if (labelSource) {
      labelSource.setData(this.getCompletedLabelGeoJson());
    }
  }

  getStateFillExpression() {
    return [
      "case",
      ["in", ["get", "id"], ["literal", this.completedIds]],
      ["match", ["get", "id"], ...this.getColorMatchStops(), colors.stateFill],
      colors.stateFill
    ];
  }

  getCapitalFillExpression() {
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

  getColorMatchStops() {
    return this.activity.features.flatMap((feature) => [feature.id, feature.color]);
  }

  setUnitedStatesContextVisibility(visibility) {
    ["us-state-context-fill", "us-state-context-line"].forEach((layerId) => {
      if (this.map.getLayer(layerId)) {
        this.map.setLayoutProperty(layerId, "visibility", visibility);
      }
    });
  }

  setOverviewVisibility(visibility) {
    ["overview-region-fill", "overview-region-line", "overview-region-label"].forEach((layerId) => {
      if (this.map.getLayer(layerId)) {
        this.map.setLayoutProperty(layerId, "visibility", visibility);
      }
    });
  }

  setStudyVisibility(visibility) {
    ["state-fill", "state-line", "capital-marker-halo", "capital-marker", "capital-hit", "completed-label"].forEach((layerId) => {
      if (this.map.getLayer(layerId)) {
        this.map.setLayoutProperty(layerId, "visibility", visibility);
      }
    });
  }
}
