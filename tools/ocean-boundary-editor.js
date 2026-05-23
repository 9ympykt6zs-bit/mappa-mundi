const oceanOptions = [
  { id: "atlantic-ocean", name: "Atlantic Ocean", color: "#2fb8e0" },
  { id: "pacific-ocean", name: "Pacific Ocean", color: "#2d6cdf" },
  { id: "indian-ocean", name: "Indian Ocean", color: "#1a9c89" },
  { id: "arctic-ocean", name: "Arctic Ocean", color: "#88d7f7" },
  { id: "southern-ocean", name: "Southern Ocean", color: "#7b5fbf" }
];

const paths = {
  worldCountries: "../assets/maps/data/maplibre-world-countries.geojson",
  oceanZones: "../assets/maps/data/ocean-zones.geojson"
};

const ids = {
  map: "map",
  oceanSelect: "ocean-select",
  partSelect: "part-select",
  segmentMode: "segment-mode",
  addPartButton: "add-part-button",
  renamePartButton: "rename-part-button",
  duplicatePartButton: "duplicate-part-button",
  deletePartButton: "delete-part-button",
  toggleSelected: "toggle-selected",
  toggleAll: "toggle-all",
  toggleDraft: "toggle-draft",
  toggleHandles: "toggle-handles",
  importButton: "import-button",
  exportButton: "export-button",
  copyButton: "copy-button",
  undoButton: "undo-button",
  deletePointButton: "delete-point-button",
  closeButton: "close-button",
  clearButton: "clear-button",
  exportOutput: "export-output",
  coordinateReadout: "coordinate-readout",
  draftSummary: "draft-summary",
  statusText: "status-text"
};

const emptyFeatureCollection = {
  type: "FeatureCollection",
  features: []
};

const state = {
  oceanZones: emptyFeatureCollection,
  draftsByOcean: {},
  selectedOceanId: "atlantic-ocean",
  segmentMode: "straight",
  parts: [],
  controlPoints: [],
  selectedPartIndex: 0,
  selectedPointIndex: null,
  closed: false,
  draggingPartIndex: null,
  draggingPointIndex: null,
  suppressNextMapClick: false,
  lastPointerLngLat: null
};

let partIdSequence = 1;

const elements = Object.fromEntries(
  Object.entries(ids).map(([key, id]) => [key, document.getElementById(id)])
);

const map = new maplibregl.Map({
  container: ids.map,
  center: [-28, 18],
  zoom: 1.35,
  minZoom: 0.7,
  maxZoom: 8,
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
          "background-color": "#1168b7"
        }
      }
    ],
    sky: {
      "atmosphere-blend": 0.24
    }
  }
});

map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), "top-right");

init().catch((error) => {
  setStatus(`Could not initialize editor: ${error.message}`);
});

async function init() {
  bindControls();
  await new Promise((resolve) => map.on("load", resolve));

  const [worldCountries, oceanZones] = await Promise.all([
    fetchJson(paths.worldCountries),
    fetchJson(paths.oceanZones).catch((error) => {
      setStatus(`Current ocean boundary file not available. New draft editing still works. TODO: ${error.message}`);
      return emptyFeatureCollection;
    })
  ]);

  state.oceanZones = normalizeOceanFeatureCollection(oceanZones);
  loadOceanDraft(state.selectedOceanId);
  addBaseMapLayers(worldCountries);
  addOceanReferenceLayers();
  addDraftLayers();
  bindMapEditing();
  renderAll();
  setStatus("Choose an ocean, import its current boundary, or click the map to start a new draft.");
}

async function fetchJson(path) {
  const response = await fetch(path);

  if (!response.ok) {
    throw new Error(`${path} returned ${response.status}`);
  }

  return response.json();
}

function normalizeOceanFeatureCollection(featureCollection) {
  return {
    type: "FeatureCollection",
    features: (featureCollection?.features || []).map((feature) => ({
      ...feature,
      properties: {
        ...(feature.properties || {}),
        id: feature.properties?.id || feature.id,
        color: getOceanColor(feature.properties?.id || feature.id)
      }
    }))
  };
}

function createDraftPart({ name = "", controlPoints = [], closed = false, selectedPointIndex = null } = {}) {
  return {
    id: `part-${partIdSequence++}`,
    name,
    controlPoints,
    closed,
    selectedPointIndex
  };
}

function getOceanDraft(oceanId) {
  if (!state.draftsByOcean[oceanId]) {
    state.draftsByOcean[oceanId] = {
      parts: [createDraftPart({ name: getDefaultPartName(oceanId, 0) })],
      selectedPartIndex: 0
    };
  }

  return state.draftsByOcean[oceanId];
}

function saveActiveDraft() {
  persistActivePartState();
  const activeDraft = {
    parts: state.parts,
    selectedPartIndex: state.selectedPartIndex
  };

  if (state.selectedOceanId) {
    state.draftsByOcean[state.selectedOceanId] = activeDraft;
  }
}

function loadOceanDraft(oceanId, options = {}) {
  const draft = options.parts
    ? {
        parts: options.parts,
        selectedPartIndex: Number.isInteger(options.selectedPartIndex) ? options.selectedPartIndex : 0
      }
    : getOceanDraft(oceanId);

  state.parts = draft.parts;
  state.selectedPartIndex = Math.max(0, Math.min(draft.selectedPartIndex || 0, Math.max(0, state.parts.length - 1)));
  syncActivePartState();
  updatePartSelector();
}

function syncActivePartState() {
  const part = getActivePart();

  if (!part) {
    state.controlPoints = [];
    state.selectedPointIndex = null;
    state.closed = false;
    return;
  }

  state.controlPoints = part.controlPoints;
  state.selectedPointIndex = Number.isInteger(part.selectedPointIndex) ? part.selectedPointIndex : (part.controlPoints.length ? 0 : null);
  state.closed = Boolean(part.closed);
}

function persistActivePartState() {
  const part = getActivePart();

  if (!part) {
    return;
  }

  part.selectedPointIndex = state.selectedPointIndex;
  part.closed = Boolean(state.closed);
}

function getActivePart() {
  if (!Array.isArray(state.parts) || !state.parts.length) {
    return null;
  }

  const index = Math.max(0, Math.min(state.selectedPartIndex || 0, state.parts.length - 1));
  return state.parts[index] || null;
}

function setActivePartIndex(partIndex) {
  if (!state.parts.length) {
    return;
  }

  saveActiveDraft();
  state.selectedPartIndex = Math.max(0, Math.min(partIndex, state.parts.length - 1));
  syncActivePartState();
  updatePartSelector();
  renderAll();
}

function updatePartSelector() {
  const partSelect = elements.partSelect;

  if (!partSelect) {
    return;
  }

  partSelect.innerHTML = "";

  state.parts.forEach((part, index) => {
    const option = document.createElement("option");
    option.value = String(index);
    option.textContent = part.name || getDefaultPartName(state.selectedOceanId, index, part);
    partSelect.appendChild(option);
  });

  if (!state.parts.length) {
    const option = document.createElement("option");
    option.value = "0";
    option.textContent = "Part 1";
    partSelect.appendChild(option);
  }

  const selectedIndex = Math.max(0, Math.min(state.selectedPartIndex || 0, Math.max(0, state.parts.length - 1)));
  partSelect.value = String(selectedIndex);
}

function getDefaultPartName(oceanId, index, part = null) {
  if (oceanId === "pacific-ocean") {
    if (part?.centroidLongitude < 0) {
      return "Western Pacific";
    }

    if (part?.centroidLongitude >= 0) {
      return "Eastern Pacific";
    }

    if (index === 0) {
      return "Western Pacific";
    }

    if (index === 1) {
      return "Eastern Pacific";
    }

    return `Pacific Part ${index + 1}`;
  }

  return `${getOceanName(oceanId)} Part ${index + 1}`;
}

function refreshPartNamesForOcean(oceanId, parts) {
  const assigned = parts.map((part, index) => ({
    ...part,
    name: part.name || getDefaultPartName(oceanId, index, part)
  }));

  if (oceanId === "pacific-ocean" && assigned.length === 2) {
    const ranked = assigned
      .map((part, index) => ({ part, index, centroidLongitude: part.centroidLongitude ?? 0 }))
      .sort((left, right) => left.centroidLongitude - right.centroidLongitude);
    const renamed = assigned.map((part) => ({ ...part }));
    renamed[ranked[0].index].name = "Western Pacific";
    renamed[ranked[1].index].name = "Eastern Pacific";
    return renamed;
  }

  return assigned;
}

function getCurrentPartName() {
  return getActivePart()?.name || getDefaultPartName(state.selectedOceanId, state.selectedPartIndex);
}

function getImportedPartsFromGeometry(geometry) {
  if (!geometry) {
    return [];
  }

  if (geometry.type === "Polygon") {
    return getImportedPolygonParts([geometry.coordinates?.[0]]);
  }

  if (geometry.type === "MultiPolygon") {
    return getImportedPolygonParts(geometry.coordinates.map((polygon) => polygon?.[0]).filter(Boolean));
  }

  return [];
}

function getImportedPolygonParts(rings) {
  return rings
    .map((ring) => {
      const trimmed = trimClosedRing(ring);

      if (trimmed.length < 3) {
        return null;
      }

      return {
        coordinates: trimmed,
        centroidLongitude: getRingCentroidLongitude(trimmed)
      };
    })
    .filter(Boolean);
}

function trimClosedRing(ring = []) {
  if (!ring.length) {
    return [];
  }

  const coordinates = ring.slice();

  if (isSameCoordinate(coordinates[0], coordinates[coordinates.length - 1])) {
    coordinates.pop();
  }

  return coordinates;
}

function getRingCentroidLongitude(ring) {
  if (!ring.length) {
    return 0;
  }

  const total = ring.reduce((sum, coordinate) => sum + normalizeLng(coordinate[0]), 0);
  return Number((total / ring.length).toFixed(6));
}

function addBaseMapLayers(worldCountries) {
  map.addSource("world-countries", {
    type: "geojson",
    data: worldCountries
  });

  map.addLayer({
    id: "world-land",
    type: "fill",
    source: "world-countries",
    paint: {
      "fill-color": "#dbeafe",
      "fill-opacity": 0.96
    }
  });

  map.addLayer({
    id: "country-borders",
    type: "line",
    source: "world-countries",
    paint: {
      "line-color": "#ffffff",
      "line-opacity": 0.88,
      "line-width": [
        "interpolate",
        ["linear"],
        ["zoom"],
        0,
        0.45,
        4,
        1.05,
        7,
        1.45
      ]
    }
  });
}

function addOceanReferenceLayers() {
  map.addSource("ocean-zones", {
    type: "geojson",
    data: state.oceanZones
  });

  map.addLayer({
    id: "other-ocean-fill",
    type: "fill",
    source: "ocean-zones",
    filter: ["!=", ["get", "id"], state.selectedOceanId],
    paint: {
      "fill-color": ["coalesce", ["get", "color"], "#60a5fa"],
      "fill-opacity": 0.16,
      "fill-antialias": false
    }
  }, "world-land");

  map.addLayer({
    id: "selected-ocean-fill",
    type: "fill",
    source: "ocean-zones",
    filter: ["==", ["get", "id"], state.selectedOceanId],
    paint: {
      "fill-color": ["coalesce", ["get", "color"], "#60a5fa"],
      "fill-opacity": 0.38,
      "fill-antialias": false
    }
  }, "world-land");

  map.addLayer({
    id: "other-ocean-line",
    type: "line",
    source: "ocean-zones",
    filter: ["!=", ["get", "id"], state.selectedOceanId],
    paint: {
      "line-color": ["coalesce", ["get", "color"], "#60a5fa"],
      "line-opacity": 0.5,
      "line-width": 1.6
    }
  });

  map.addLayer({
    id: "selected-ocean-line",
    type: "line",
    source: "ocean-zones",
    filter: ["==", ["get", "id"], state.selectedOceanId],
    paint: {
      "line-color": ["coalesce", ["get", "color"], "#60a5fa"],
      "line-opacity": 0.92,
      "line-width": 2.3
    }
  });
}

function addDraftLayers() {
  map.addSource("draft-geometry", {
    type: "geojson",
    data: emptyFeatureCollection
  });

  map.addSource("draft-handles", {
    type: "geojson",
    data: emptyFeatureCollection
  });

  map.addLayer({
    id: "draft-fill",
    type: "fill",
    source: "draft-geometry",
    filter: ["==", ["geometry-type"], "Polygon"],
    paint: {
      "fill-color": "#facc15",
      "fill-opacity": [
        "case",
        ["boolean", ["get", "active"], false],
        0.28,
        0.14
      ],
      "fill-antialias": false
    }
  });

  map.addLayer({
    id: "draft-line",
    type: "line",
    source: "draft-geometry",
    paint: {
      "line-color": [
        "case",
        ["boolean", ["get", "active"], false],
        "#f59e0b",
        "#fbbf24"
      ],
      "line-opacity": [
        "case",
        ["boolean", ["get", "active"], false],
        0.98,
        0.58
      ],
      "line-width": [
        "case",
        ["boolean", ["get", "active"], false],
        3,
        2
      ]
    }
  });

  map.addLayer({
    id: "draft-handles-halo",
    type: "circle",
    source: "draft-handles",
    paint: {
      "circle-radius": [
        "case",
        ["boolean", ["get", "selected"], false],
        12,
        ["boolean", ["get", "inserted"], false],
        10,
        ["boolean", ["get", "active"], false],
        9,
        9
      ],
      "circle-color": "#ffffff",
      "circle-opacity": [
        "case",
        ["boolean", ["get", "active"], false],
        0.9,
        0.62
      ],
      "circle-stroke-color": "#172033",
      "circle-stroke-width": 1.5
    }
  });

  map.addLayer({
    id: "draft-handles",
    type: "circle",
    source: "draft-handles",
    paint: {
      "circle-radius": [
        "case",
        ["boolean", ["get", "selected"], false],
        7,
        ["boolean", ["get", "inserted"], false],
        6,
        ["boolean", ["get", "active"], false],
        5.5,
        5
      ],
      "circle-color": [
        "case",
        ["boolean", ["get", "selected"], false],
        "#ef4444",
        ["boolean", ["get", "inserted"], false],
        "#10b981",
        ["boolean", ["get", "active"], false],
        "#2563eb",
        "#64748b"
      ],
      "circle-stroke-color": "#ffffff",
      "circle-stroke-width": 1.5
    }
  });
}

function bindControls() {
  elements.oceanSelect.addEventListener("change", () => {
    saveActiveDraft();
    state.selectedOceanId = elements.oceanSelect.value;
    loadOceanDraft(state.selectedOceanId);
    updateOceanLayerFilters();
    renderAll();
    setStatus(`Selected ${getOceanName(state.selectedOceanId)}.`);
  });

  elements.partSelect.addEventListener("change", () => {
    setActivePartIndex(Number(elements.partSelect.value) || 0);
    setStatus(`Selected ${getCurrentPartName()}.`);
  });

  elements.segmentMode.addEventListener("change", () => {
    state.segmentMode = elements.segmentMode.value;
    setStatus(`Segment mode: ${elements.segmentMode.selectedOptions[0].textContent}.`);
  });

  elements.addPartButton.addEventListener("click", addNewPart);
  elements.renamePartButton.addEventListener("click", renameCurrentPart);
  elements.duplicatePartButton.addEventListener("click", duplicateCurrentPart);
  elements.deletePartButton.addEventListener("click", deleteCurrentPart);

  [elements.toggleSelected, elements.toggleAll, elements.toggleDraft, elements.toggleHandles].forEach((checkbox) => {
    checkbox.addEventListener("change", updateLayerVisibility);
  });

  elements.importButton.addEventListener("click", importSelectedOceanBoundary);
  elements.exportButton.addEventListener("click", exportDraftGeoJson);
  elements.copyButton.addEventListener("click", copyDraftGeoJson);
  elements.undoButton.addEventListener("click", undoLastPoint);
  elements.deletePointButton.addEventListener("click", deleteSelectedPoint);
  elements.closeButton.addEventListener("click", closePolygon);
  elements.clearButton.addEventListener("click", clearDraft);
}

function bindMapEditing() {
  map.on("click", (event) => {
    if (state.suppressNextMapClick) {
      state.suppressNextMapClick = false;
      return;
    }

    const insertion = findNearestDraftSegment(event.point);

    if (insertion) {
      insertControlPoint(insertion, event.lngLat);
      return;
    }

    if (state.closed) {
      setStatus("Draft polygon is closed. Click near a segment to insert a point, or clear/undo before appending.");
      return;
    }

    addControlPoint(event.lngLat);
  });

  map.on("mousemove", updatePointerReadout);
  map.on("touchmove", updatePointerReadout);
  map.on("mouseout", () => {
    if (!state.lastPointerLngLat) {
      elements.coordinateReadout.textContent = "Lon: -- | Lat: --";
    }
  });

  map.on("mousedown", "draft-handles", beginHandleDrag);
  map.on("touchstart", "draft-handles", beginHandleDrag);
  map.on("mouseenter", "draft-handles", () => {
    map.getCanvas().style.cursor = "grab";
  });
  map.on("mouseleave", "draft-handles", () => {
    map.getCanvas().style.cursor = "crosshair";
  });
  map.on("mousemove", updateHandleDrag);
  map.on("touchmove", updateHandleDrag);
  map.on("mouseup", endHandleDrag);
  map.on("touchend", endHandleDrag);
}

function beginHandleDrag(event) {
  const feature = event.features?.[0];

  if (!feature) {
    return;
  }

  event.preventDefault();
  state.suppressNextMapClick = true;
  saveActiveDraft();
  state.selectedPartIndex = Number(feature.properties.partIndex);
  syncActivePartState();
  state.draggingPartIndex = state.selectedPartIndex;
  state.draggingPointIndex = Number(feature.properties.pointIndex);
  state.selectedPointIndex = state.draggingPointIndex;
  map.dragPan.disable();
  map.getCanvas().style.cursor = "grabbing";
  renderAll();
}

function updateHandleDrag(event) {
  if (!Number.isInteger(state.draggingPointIndex) || !Number.isInteger(state.draggingPartIndex)) {
    return;
  }

  if (state.selectedPartIndex !== state.draggingPartIndex) {
    state.selectedPartIndex = state.draggingPartIndex;
    syncActivePartState();
  }

  const lngLat = event.lngLat;
  const point = state.controlPoints[state.draggingPointIndex];

  if (!point || !lngLat) {
    return;
  }

  point.lng = normalizeLng(lngLat.lng);
  point.lat = clampLat(lngLat.lat);
  applySegmentConstraints();
  renderAll();
}

function endHandleDrag() {
  if (!Number.isInteger(state.draggingPointIndex)) {
    return;
  }

  state.draggingPartIndex = null;
  state.draggingPointIndex = null;
  map.dragPan.enable();
  map.getCanvas().style.cursor = "crosshair";
  setStatus(`Selected point ${state.selectedPointIndex + 1}.`);
  renderAll();
}

function updatePointerReadout(event) {
  if (!event.lngLat) {
    return;
  }

  state.lastPointerLngLat = {
    lng: normalizeLng(event.lngLat.lng),
    lat: clampLat(event.lngLat.lat)
  };
  elements.coordinateReadout.textContent = `Lon: ${state.lastPointerLngLat.lng.toFixed(4)} | Lat: ${state.lastPointerLngLat.lat.toFixed(4)}`;
}

function addControlPoint(lngLat) {
  const previous = state.controlPoints[state.controlPoints.length - 1];
  const mode = previous ? state.segmentMode : "straight";
  const point = {
    lng: normalizeLng(lngLat.lng),
    lat: clampLat(lngLat.lat),
    mode,
    inserted: false
  };

  if (previous && mode === "follow-latitude") {
    point.lat = previous.lat;
  }

  if (previous && mode === "follow-longitude") {
    point.lng = previous.lng;
  }

  state.controlPoints.push(point);
  state.selectedPointIndex = state.controlPoints.length - 1;
  state.closed = false;
  renderAll();
  setStatus(`Added point ${state.controlPoints.length}.`);
}

function insertControlPoint(insertion, lngLat) {
  const previous = state.controlPoints[insertion.previousIndex];
  const point = {
    lng: normalizeLng(lngLat.lng),
    lat: clampLat(lngLat.lat),
    mode: insertion.mode,
    inserted: true
  };

  if (previous && point.mode === "follow-latitude") {
    point.lat = previous.lat;
  }

  if (previous && point.mode === "follow-longitude") {
    point.lng = previous.lng;
  }

  state.controlPoints.splice(insertion.insertIndex, 0, point);
  state.selectedPointIndex = insertion.insertIndex;
  applySegmentConstraints();
  renderAll();
  setStatus(`Inserted point ${insertion.insertIndex + 1} between existing boundary points.`);
}

function importSelectedOceanBoundary() {
  const feature = getSelectedOceanFeature();

  if (!feature) {
    clearDraft();
    setStatus("No existing boundary found. TODO: keep this usable for fresh manual polygons.");
    return;
  }

  const importedParts = getImportedPartsFromGeometry(feature.geometry);

  if (!importedParts.length) {
    clearDraft();
    setStatus("Existing boundary could not be converted into editable points. TODO: support this geometry shape.");
    return;
  }

  const importedDraftParts = refreshPartNamesForOcean(state.selectedOceanId, importedParts.map((part, index) => ({
    ...createDraftPart({
      name: part.name || getDefaultPartName(state.selectedOceanId, index, part),
      controlPoints: part.coordinates.map(([lng, lat], pointIndex) => ({
        lng: normalizeLng(lng),
        lat: clampLat(lat),
        mode: pointIndex === 0 ? "straight" : "straight",
        inserted: false
      })),
      closed: true,
      selectedPointIndex: 0
    }),
    centroidLongitude: part.centroidLongitude
  })));

  state.parts = importedDraftParts;
  state.selectedPartIndex = 0;
  syncActivePartState();
  updatePartSelector();
  renderAll();

  const isMultipart = feature.geometry?.type === "MultiPolygon";
  setStatus(isMultipart
    ? `Imported all polygon parts for ${getOceanName(state.selectedOceanId)}.`
    : `Imported ${getOceanName(state.selectedOceanId)} boundary for editing.`);
}

function addNewPart() {
  saveActiveDraft();

  const part = createDraftPart({
    name: getDefaultPartName(state.selectedOceanId, state.parts.length)
  });

  state.parts.push(part);
  state.selectedPartIndex = state.parts.length - 1;
  syncActivePartState();
  updatePartSelector();
  renderAll();
  setStatus(`Added ${getCurrentPartName()}.`);
}

function renameCurrentPart() {
  const part = getActivePart();

  if (!part) {
    return;
  }

  const nextName = window.prompt("Rename this part", part.name || getCurrentPartName());

  if (!nextName) {
    return;
  }

  part.name = nextName.trim();
  updatePartSelector();
  renderAll();
  setStatus(`Renamed part to ${part.name}.`);
}

function duplicateCurrentPart() {
  const part = getActivePart();

  if (!part) {
    return;
  }

  const copy = createDraftPart({
    name: `Copy of ${part.name || getCurrentPartName()}`,
    controlPoints: part.controlPoints.map((point) => ({ ...point })),
    closed: part.closed,
    selectedPointIndex: part.selectedPointIndex
  });

  state.parts.splice(state.selectedPartIndex + 1, 0, copy);
  state.selectedPartIndex += 1;
  syncActivePartState();
  updatePartSelector();
  renderAll();
  setStatus(`Duplicated ${part.name || getCurrentPartName()}.`);
}

function deleteCurrentPart() {
  if (!state.parts.length) {
    clearDraft();
    return;
  }

  if (state.parts.length === 1) {
    state.parts = [createDraftPart({ name: getDefaultPartName(state.selectedOceanId, 0) })];
    state.selectedPartIndex = 0;
    syncActivePartState();
    updatePartSelector();
    renderAll();
    setStatus("Deleted the only part and started a fresh blank part.");
    return;
  }

  state.parts.splice(state.selectedPartIndex, 1);
  state.selectedPartIndex = Math.max(0, Math.min(state.selectedPartIndex, state.parts.length - 1));
  syncActivePartState();
  updatePartSelector();
  renderAll();
  setStatus("Deleted the current part.");
}

function undoLastPoint() {
  if (!state.controlPoints.length) {
    setStatus("No points to undo.");
    return;
  }

  state.controlPoints.pop();
  state.selectedPointIndex = state.controlPoints.length ? state.controlPoints.length - 1 : null;
  state.closed = state.closed && state.controlPoints.length >= 3;
  renderAll();
  setStatus("Removed the last point.");
}

function deleteSelectedPoint() {
  if (!Number.isInteger(state.selectedPointIndex)) {
    setStatus("Select a point handle before deleting.");
    return;
  }

  state.controlPoints.splice(state.selectedPointIndex, 1);
  state.selectedPointIndex = state.controlPoints.length
    ? Math.min(state.selectedPointIndex, state.controlPoints.length - 1)
    : null;
  state.closed = state.closed && state.controlPoints.length >= 3;
  applySegmentConstraints();
  renderAll();
  setStatus("Deleted selected point.");
}

function closePolygon() {
  if (state.controlPoints.length < 3) {
    setStatus("Add at least 3 points before closing the polygon.");
    return;
  }

  state.closed = true;
  renderAll();
  setStatus("Polygon closed.");
}

function clearDraft() {
  state.parts = [createDraftPart({ name: getDefaultPartName(state.selectedOceanId, 0) })];
  state.selectedPartIndex = 0;
  state.draggingPartIndex = null;
  state.draggingPointIndex = null;
  state.suppressNextMapClick = false;
  syncActivePartState();
  updatePartSelector();
  renderAll();
  setStatus("Draft cleared. Click the map to begin again.");
}

function exportDraftGeoJson() {
  const feature = buildExportFeature();

  if (!feature) {
    setStatus("Add at least 3 points in one or more parts before exporting GeoJSON.");
    return null;
  }

  const output = JSON.stringify(feature, null, 2);
  elements.exportOutput.value = output;
  setStatus("Draft GeoJSON exported to the text box. Nothing was saved.");
  return output;
}

async function copyDraftGeoJson() {
  const output = exportDraftGeoJson();

  if (!output) {
    return;
  }

  try {
    await navigator.clipboard.writeText(output);
    setStatus("Draft GeoJSON copied to clipboard.");
  } catch {
    elements.exportOutput.focus();
    elements.exportOutput.select();
    document.execCommand("copy");
    setStatus("Draft GeoJSON selected and copied with the fallback clipboard path.");
  }
}

function buildExportFeature() {
  const exportParts = state.parts
    .map((part) => trimClosedRing(part.controlPoints.map((point) => [point.lng, point.lat])))
    .filter((ring) => ring.length >= 3);

  if (!exportParts.length) {
    return null;
  }

  const coordinates = exportParts.map((ring) => {
    const closedRing = ring.map(([lng, lat]) => [roundCoordinate(lng), roundCoordinate(lat)]);

    if (!isSameCoordinate(closedRing[0], closedRing[closedRing.length - 1])) {
      closedRing.push([...closedRing[0]]);
    }

    return [closedRing];
  });

  const geometry = coordinates.length === 1
    ? {
        type: "Polygon",
        coordinates: coordinates[0]
      }
    : {
        type: "MultiPolygon",
        coordinates
      };

  return {
    type: "Feature",
    id: state.selectedOceanId,
    properties: {
      id: state.selectedOceanId,
      name: getOceanName(state.selectedOceanId),
      ocean: state.selectedOceanId,
      editedAt: new Date().toISOString(),
      source: "manual-ocean-boundary-editor"
    },
    geometry
  };
}

function renderAll() {
  saveActiveDraft();
  renderDraftGeometry();
  renderHandles();
  updateLayerVisibility();
  updateControls();
}

function renderDraftGeometry() {
  map.getSource("draft-geometry")?.setData(buildDraftFeatureCollection());
}

function findNearestDraftSegment(point) {
  const pointCount = state.controlPoints.length;

  if (pointCount < 2) {
    return null;
  }

  const thresholdPx = 14;
  const segmentCount = state.closed ? pointCount : pointCount - 1;
  let nearest = null;

  for (let index = 0; index < segmentCount; index += 1) {
    const start = state.controlPoints[index];
    const endIndex = (index + 1) % pointCount;
    const end = state.controlPoints[endIndex];
    const mode = index === pointCount - 1 ? "straight" : end.mode || "straight";
    const renderedSegment = densifySegment(start, end, mode);

    for (let segmentIndex = 0; segmentIndex < renderedSegment.length - 1; segmentIndex += 1) {
      const startPoint = map.project(renderedSegment[segmentIndex]);
      const endPoint = map.project(renderedSegment[segmentIndex + 1]);
      const distance = getScreenPointSegmentDistance(point, startPoint, endPoint);

      if (distance <= thresholdPx && (!nearest || distance < nearest.distance)) {
        nearest = {
          distance,
          previousIndex: index,
          insertIndex: index === pointCount - 1 ? pointCount : endIndex,
          mode
        };
      }
    }
  }

  return nearest;
}

function renderHandles() {
  map.getSource("draft-handles")?.setData({
    type: "FeatureCollection",
    features: state.parts.flatMap((part, partIndex) => part.controlPoints.map((point, pointIndex) => ({
      type: "Feature",
      properties: {
        partIndex,
        pointIndex,
        active: partIndex === state.selectedPartIndex,
        selected: partIndex === state.selectedPartIndex && pointIndex === state.selectedPointIndex,
        inserted: Boolean(point.inserted)
      },
      geometry: {
        type: "Point",
        coordinates: [point.lng, point.lat]
      }
    })))
  });
}

function buildDraftFeatureCollection() {
  const features = [];

  state.parts.forEach((part, partIndex) => {
    const active = partIndex === state.selectedPartIndex;
    const lineCoordinates = buildRenderedCoordinates(part, { close: part.closed });

    if (lineCoordinates.length >= 2) {
      features.push({
        type: "Feature",
        properties: {
          kind: "draft-line",
          partIndex,
          active,
          partName: part.name || getDefaultPartName(state.selectedOceanId, partIndex, part)
        },
        geometry: {
          type: "LineString",
          coordinates: lineCoordinates
        }
      });
    }

    if (part.controlPoints.length >= 3) {
      const ring = buildRenderedCoordinates(part, { close: true });
      features.push({
        type: "Feature",
        properties: {
          kind: "draft-polygon",
          partIndex,
          active,
          partName: part.name || getDefaultPartName(state.selectedOceanId, partIndex, part)
        },
        geometry: {
          type: "Polygon",
          coordinates: [ring]
        }
      });
    }
  });

  return {
    type: "FeatureCollection",
    features
  };
}

function buildRenderedCoordinates(part, { close }) {
  const points = part?.controlPoints || [];

  if (points.length === 0) {
    return [];
  }

  const coordinates = [[points[0].lng, points[0].lat]];
  const segmentCount = close ? points.length : points.length - 1;

  for (let index = 1; index <= segmentCount; index += 1) {
    const start = points[index - 1];
    const end = points[index % points.length];
    const mode = index === points.length
      ? "straight"
      : end.mode || "straight";
    const segment = densifySegment(start, end, mode);
    coordinates.push(...segment.slice(1));
  }

  if (close && !isSameCoordinate(coordinates[0], coordinates[coordinates.length - 1])) {
    coordinates.push([...coordinates[0]]);
  }

  return coordinates;
}

function densifySegment(start, end, mode) {
  const startLng = start.lng;
  const deltaLng = getShortestLngDelta(start.lng, end.lng);
  const targetLng = startLng + deltaLng;
  const targetLat = mode === "follow-latitude" ? start.lat : end.lat;
  const sourceLng = mode === "follow-longitude" ? start.lng : startLng;
  const destinationLng = mode === "follow-longitude" ? start.lng : targetLng;
  const sourceLat = start.lat;
  const destinationLat = mode === "follow-latitude" ? start.lat : targetLat;
  const distance = Math.max(Math.abs(destinationLng - sourceLng), Math.abs(destinationLat - sourceLat));
  const steps = Math.max(1, Math.min(96, Math.ceil(distance / 5.5)));
  const coordinates = [];

  for (let step = 0; step <= steps; step += 1) {
    const t = step / steps;
    coordinates.push([
      normalizeLng(sourceLng + (destinationLng - sourceLng) * t),
      sourceLat + (destinationLat - sourceLat) * t
    ]);
  }

  return coordinates;
}

function applySegmentConstraints() {
  for (let index = 1; index < state.controlPoints.length; index += 1) {
    const previous = state.controlPoints[index - 1];
    const current = state.controlPoints[index];

    if (current.mode === "follow-latitude") {
      current.lat = previous.lat;
    }

    if (current.mode === "follow-longitude") {
      current.lng = previous.lng;
    }
  }
}

function updateOceanLayerFilters() {
  if (map.getLayer("selected-ocean-fill")) {
    map.setFilter("selected-ocean-fill", ["==", ["get", "id"], state.selectedOceanId]);
  }

  if (map.getLayer("selected-ocean-line")) {
    map.setFilter("selected-ocean-line", ["==", ["get", "id"], state.selectedOceanId]);
  }

  if (map.getLayer("other-ocean-fill")) {
    map.setFilter("other-ocean-fill", ["!=", ["get", "id"], state.selectedOceanId]);
  }

  if (map.getLayer("other-ocean-line")) {
    map.setFilter("other-ocean-line", ["!=", ["get", "id"], state.selectedOceanId]);
  }
}

function updateLayerVisibility() {
  setLayerVisibility("selected-ocean-fill", elements.toggleSelected.checked);
  setLayerVisibility("selected-ocean-line", elements.toggleSelected.checked);
  setLayerVisibility("other-ocean-fill", elements.toggleAll.checked);
  setLayerVisibility("other-ocean-line", elements.toggleAll.checked);
  setLayerVisibility("draft-fill", elements.toggleDraft.checked);
  setLayerVisibility("draft-line", elements.toggleDraft.checked);
  setLayerVisibility("draft-handles", elements.toggleHandles.checked);
  setLayerVisibility("draft-handles-halo", elements.toggleHandles.checked);
}

function setLayerVisibility(layerId, isVisible) {
  if (map.getLayer(layerId)) {
    map.setLayoutProperty(layerId, "visibility", isVisible ? "visible" : "none");
  }
}

function updateControls() {
  const totalPoints = state.parts.reduce((sum, part) => sum + part.controlPoints.length, 0);
  const activePart = getActivePart();
  elements.draftSummary.textContent = `${state.parts.length} part${state.parts.length === 1 ? "" : "s"} | ${totalPoints} point${totalPoints === 1 ? "" : "s"}${state.closed ? " | closed" : ""}`;
  elements.partSelect.disabled = state.parts.length === 0;
  updatePartSelector();
  elements.undoButton.disabled = state.controlPoints.length === 0;
  elements.deletePointButton.disabled = !Number.isInteger(state.selectedPointIndex);
  elements.closeButton.disabled = state.controlPoints.length < 3;
  elements.clearButton.disabled = state.controlPoints.length === 0;
  const canExport = hasExportableParts();
  elements.exportButton.disabled = !canExport;
  elements.copyButton.disabled = !canExport;
  elements.renamePartButton.disabled = !activePart;
  elements.duplicatePartButton.disabled = !activePart;
  elements.deletePartButton.disabled = !activePart;
  elements.addPartButton.disabled = false;
}

function hasExportableParts() {
  return state.parts.some((part) => trimClosedRing(part.controlPoints.map((point) => [point.lng, point.lat])).length >= 3);
}

function setStatus(message) {
  elements.statusText.textContent = message;
}

function getSelectedOceanFeature() {
  return state.oceanZones.features.find((feature) => feature.properties?.id === state.selectedOceanId || feature.id === state.selectedOceanId) || null;
}

function getLargestOuterRing(geometry) {
  if (geometry?.type === "Polygon") {
    return geometry.coordinates?.[0] || null;
  }

  if (geometry?.type !== "MultiPolygon") {
    return null;
  }

  return geometry.coordinates
    .map((polygon) => polygon?.[0])
    .filter(Boolean)
    .sort((left, right) => Math.abs(getRingArea(right)) - Math.abs(getRingArea(left)))[0] || null;
}

function getRingArea(ring) {
  let area = 0;

  for (let index = 0; index < ring.length; index += 1) {
    const [x1, y1] = ring[index];
    const [x2, y2] = ring[(index + 1) % ring.length];
    area += x1 * y2 - x2 * y1;
  }

  return area / 2;
}

function getOceanName(oceanId) {
  return oceanOptions.find((ocean) => ocean.id === oceanId)?.name || oceanId;
}

function getOceanColor(oceanId) {
  return oceanOptions.find((ocean) => ocean.id === oceanId)?.color || "#60a5fa";
}

function normalizeLng(lng) {
  let normalized = Number(lng);

  while (normalized > 180) {
    normalized -= 360;
  }

  while (normalized < -180) {
    normalized += 360;
  }

  return Number(normalized.toFixed(6));
}

function clampLat(lat) {
  return Number(Math.max(-89.5, Math.min(89.5, Number(lat))).toFixed(6));
}

function getShortestLngDelta(startLng, endLng) {
  let delta = endLng - startLng;

  while (delta > 180) {
    delta -= 360;
  }

  while (delta < -180) {
    delta += 360;
  }

  return delta;
}

function getScreenPointSegmentDistance(point, start, end) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const lengthSquared = dx * dx + dy * dy;

  if (lengthSquared === 0) {
    return Math.hypot(point.x - start.x, point.y - start.y);
  }

  const t = Math.max(0, Math.min(1, ((point.x - start.x) * dx + (point.y - start.y) * dy) / lengthSquared));
  const projectedX = start.x + t * dx;
  const projectedY = start.y + t * dy;
  return Math.hypot(point.x - projectedX, point.y - projectedY);
}

function roundCoordinate(value) {
  return Number(Number(value).toFixed(6));
}

function isSameCoordinate(left, right) {
  return Boolean(left && right)
    && Math.abs(left[0] - right[0]) < 0.000001
    && Math.abs(left[1] - right[1]) < 0.000001;
}
