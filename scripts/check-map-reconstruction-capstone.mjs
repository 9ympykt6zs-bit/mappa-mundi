import assert from "node:assert/strict";
import fs from "node:fs";
import {
  getMapReconstructionCapstone,
  listMapReconstructionCapstones,
  MAP_RECONSTRUCTION_CAPSTONE_IDS,
  validateLower48Capstone
} from "../src/atlas/map-reconstruction-capstones.js";
import {
  createMapReconstructionCamera,
  fitMapReconstructionCamera,
  focusMapReconstructionCamera,
  getMapReconstructionCameraView,
  panMapReconstructionCamera,
  zoomMapReconstructionCameraAtPoint
} from "../src/atlas/map-reconstruction-camera.js";
import {
  createMapReconstructionSession,
  createSeededMapReconstructionRandom,
  placeMapReconstructionPiece,
  sortMapReconstructionStateIdsByName,
  submitMapReconstructionSession
} from "../src/atlas/map-reconstruction-engine.js";
import { prepareMapReconstructionGeometry } from "../src/atlas/map-reconstruction-geometry.js";
import { evaluateLower48Reconstruction } from "../src/atlas/map-reconstruction-national-evaluation.js";
import {
  clearLower48ReconstructionSnapshot,
  createLower48ReconstructionSnapshot,
  readLower48ReconstructionSnapshot,
  restoreLower48ReconstructionSession,
  validateLower48ReconstructionSnapshot,
  writeLower48ReconstructionSnapshot
} from "../src/atlas/map-reconstruction-persistence.js";
import {
  listMapReconstructionRegions,
  validateMapReconstructionCoverage
} from "../src/atlas/map-reconstruction-regions.js";
import {
  getLower48DrawerDropPosition
} from "../src/atlas/map-reconstruction-capstone-ui.js";
import {
  getMapReconstructionDragPreviewLayout
} from "../src/atlas/map-reconstruction-drag-preview.js";
import {
  getMapReconstructionConnectedComponent
} from "../src/atlas/map-reconstruction-connectivity.js";

const featureCollection = JSON.parse(fs.readFileSync(
  new URL("../assets/maps/data/maplibre-us-states-atlas.geojson", import.meta.url),
  "utf8"
).replace(/^\uFEFF/, ""));
const geometryStateIds = featureCollection.features.map((feature) => (
  String(feature.properties?.id || feature.id || "").toLowerCase().replace(/^state:/, "")
));
const capstone = getMapReconstructionCapstone(
  MAP_RECONSTRUCTION_CAPSTONE_IDS.REBUILD_LOWER_48
);
const regions = listMapReconstructionRegions();

assert.equal(listMapReconstructionCapstones().length, 1);
assert.equal(regions.length, 10);
assert.equal(capstone.stateIds.length, 48);
assert.equal(new Set(capstone.stateIds).size, 48);
assert.equal(capstone.stateIds.includes("alaska"), false);
assert.equal(capstone.stateIds.includes("hawaii"), false);
assert.deepEqual(validateLower48Capstone(capstone, {
  regions,
  contiguousStateIds: capstone.stateIds,
  geometryStateIds
}), []);
assert.deepEqual(validateMapReconstructionCoverage(regions, capstone.stateIds), []);

const duplicateCapstone = {
  ...capstone,
  stateIds: [...capstone.stateIds.slice(0, -1), capstone.stateIds[0]]
};
assert.ok(validateLower48Capstone(duplicateCapstone, {
  regions,
  contiguousStateIds: capstone.stateIds
}).some((message) => message.includes("unique")));
assert.ok(validateLower48Capstone({
  ...capstone,
  stateIds: [...capstone.stateIds.slice(0, -1), "alaska"]
}, {
  regions,
  contiguousStateIds: capstone.stateIds
}).some((message) => message.includes("alaska")));
assert.ok(validateLower48Capstone(capstone, {
  regions,
  contiguousStateIds: capstone.stateIds,
  geometryStateIds: geometryStateIds.filter((stateId) => stateId !== "maine")
}).some((message) => message.includes("maine lacks")));

const workspace = capstone.workspace;
const camera = createMapReconstructionCamera(workspace);
assert.deepEqual(camera, { centerX: 900, centerY: 550, zoom: 1 });
const viewport = { width: 900, height: 600 };
const initialView = getMapReconstructionCameraView(camera, workspace, viewport);
assert.equal(initialView.width, 1800);
assert.equal(initialView.height, 1200);
const anchor = { x: 400, y: 300 };
const zoomed = zoomMapReconstructionCameraAtPoint(
  camera,
  2,
  anchor,
  workspace,
  capstone.camera
);
assert.equal(zoomed.zoom, 2);
assert.deepEqual(zoomMapReconstructionCameraAtPoint(
  zoomed,
  20,
  anchor,
  workspace,
  capstone.camera
).zoom, 8);
assert.deepEqual(panMapReconstructionCamera(
  camera,
  { x: -5000, y: 5000 },
  workspace,
  capstone.camera
), { centerX: 0, centerY: 1100, zoom: 1 });
assert.deepEqual(fitMapReconstructionCamera(workspace, capstone.camera), camera);
assert.deepEqual(focusMapReconstructionCamera(
  camera,
  { x: 1200, y: 600 },
  workspace,
  capstone.camera
), { centerX: 1200, centerY: 600, zoom: 4 });

const geometry = prepareMapReconstructionGeometry(featureCollection, capstone);
assert.equal(geometry.stateIds.length, 48);
const california = geometry.piecesById.california;
const fitPreview = getMapReconstructionDragPreviewLayout(
  california,
  { x: 0.5, y: 0.5 },
  { x: california.localBounds.minX, y: california.localBounds.maxY }
);
const zoomedPreview = getMapReconstructionDragPreviewLayout(
  california,
  { x: 1.5, y: 1.5 },
  fitPreview.anchor
);
assert.equal(fitPreview.width, california.width * 0.5);
assert.equal(fitPreview.height, california.height * 0.5);
assert.equal(zoomedPreview.width, fitPreview.width * 3);
assert.equal(zoomedPreview.height, fitPreview.height * 3);
assert.equal(fitPreview.grabOffsetX, 0);
assert.equal(fitPreview.grabOffsetY, fitPreview.height);
let canonicalSession = createMapReconstructionSession(capstone, geometry, {
  random: createSeededMapReconstructionRandom(48)
});
assert.equal(new Set(canonicalSession.bankOrder).size, 48);
assert.deepEqual(
  canonicalSession.bankOrder,
  sortMapReconstructionStateIdsByName(capstone.stateIds, geometry)
);
assert.deepEqual(
  getLower48DrawerDropPosition({ x: 850, y: 420 }, { x: 35, y: 20 }),
  { x: 815, y: 400 }
);
for (const stateId of capstone.stateIds) {
  canonicalSession = placeMapReconstructionPiece(
    canonicalSession,
    stateId,
    geometry.piecesById[stateId].correctPosition,
    geometry
  );
}
const connectedStartedAt = Date.now();
const lower48Connected = getMapReconstructionConnectedComponent(
  canonicalSession,
  geometry,
  "louisiana",
  2
);
assert.equal(lower48Connected.length, 48);
assert.ok(
  Date.now() - connectedStartedAt < 500,
  "Connected detection should feel immediate for a completed Lower 48 map"
);
const canonicalEvaluation = evaluateLower48Reconstruction(
  canonicalSession,
  capstone,
  geometry
);
assert.equal(canonicalEvaluation.isComplete, true);
assert.equal(canonicalEvaluation.scores.overall, 100);
assert.ok(canonicalEvaluation.durationMs < 500);

let translatedSession = createMapReconstructionSession(capstone, geometry, {
  random: createSeededMapReconstructionRandom(49)
});
for (const stateId of capstone.stateIds) {
  const correct = geometry.piecesById[stateId].correctPosition;
  translatedSession = placeMapReconstructionPiece(
    translatedSession,
    stateId,
    { x: correct.x + 12, y: correct.y + 8 },
    geometry
  );
}
const translatedEvaluation = evaluateLower48Reconstruction(
  translatedSession,
  capstone,
  geometry
);
assert.equal(translatedEvaluation.normalization.translationApplied, true);
assert.equal(translatedEvaluation.isComplete, true);

let scaledSession = createMapReconstructionSession(capstone, geometry, {
  random: createSeededMapReconstructionRandom(490)
});
for (const stateId of capstone.stateIds) {
  const correct = geometry.piecesById[stateId].correctPosition;
  scaledSession = placeMapReconstructionPiece(
    scaledSession,
    stateId,
    {
      x: 900 + (correct.x - 900) * 0.95,
      y: 550 + (correct.y - 550) * 0.95
    },
    geometry
  );
}
const scaledEvaluation = evaluateLower48Reconstruction(scaledSession, capstone, geometry);
assert.equal(scaledEvaluation.normalization.scaleApplied, true);
assert.ok(Math.abs(scaledEvaluation.normalization.scale - 0.95) < 0.02);
assert.equal(scaledEvaluation.isComplete, true);

let incompleteSession = createMapReconstructionSession(capstone, geometry, {
  random: createSeededMapReconstructionRandom(50)
});
for (const stateId of capstone.stateIds.slice(0, 20)) {
  incompleteSession = placeMapReconstructionPiece(
    incompleteSession,
    stateId,
    geometry.piecesById[stateId].correctPosition,
    geometry
  );
}
const incompleteEvaluation = evaluateLower48Reconstruction(
  incompleteSession,
  capstone,
  geometry
);
assert.equal(incompleteEvaluation.isComplete, false);
assert.equal(incompleteEvaluation.counts.unplaced, 28);

let swappedSession = createMapReconstructionSession(capstone, geometry, {
  random: createSeededMapReconstructionRandom(51)
});
for (const stateId of capstone.stateIds) {
  const replacementId = stateId === "vermont"
    ? "new-hampshire"
    : stateId === "new-hampshire"
      ? "vermont"
      : stateId;
  swappedSession = placeMapReconstructionPiece(
    swappedSession,
    stateId,
    geometry.piecesById[replacementId].correctPosition,
    geometry
  );
}
const swappedEvaluation = evaluateLower48Reconstruction(swappedSession, capstone, geometry);
assert.equal(swappedEvaluation.isComplete, false);
assert.ok(swappedEvaluation.counts.misplaced >= 2);

let disconnectedSession = createMapReconstructionSession(capstone, geometry, {
  random: createSeededMapReconstructionRandom(510)
});
for (const stateId of capstone.stateIds) {
  const correct = geometry.piecesById[stateId].correctPosition;
  disconnectedSession = placeMapReconstructionPiece(
    disconnectedSession,
    stateId,
    stateId === "maine" || stateId === "new-hampshire" || stateId === "vermont"
      ? { x: correct.x - 420, y: correct.y + 260 }
      : correct,
    geometry
  );
}
const disconnectedEvaluation = evaluateLower48Reconstruction(
  disconnectedSession,
  capstone,
  geometry
);
assert.equal(disconnectedEvaluation.isComplete, false);
assert.ok(disconnectedEvaluation.adjacency.largestConnectedComponent < 48);

let scrambledSession = createMapReconstructionSession(capstone, geometry, {
  random: createSeededMapReconstructionRandom(511)
});
const reversedIds = [...capstone.stateIds].reverse();
capstone.stateIds.forEach((stateId, index) => {
  scrambledSession = placeMapReconstructionPiece(
    scrambledSession,
    stateId,
    geometry.piecesById[reversedIds[index]].correctPosition,
    geometry
  );
});
const scrambledEvaluation = evaluateLower48Reconstruction(scrambledSession, capstone, geometry);
assert.equal(scrambledEvaluation.isComplete, false);
assert.ok(scrambledEvaluation.scores.adjacency < 50);

let falseContactSession = createMapReconstructionSession(capstone, geometry, {
  random: createSeededMapReconstructionRandom(512)
});
for (const stateId of capstone.stateIds) {
  falseContactSession = placeMapReconstructionPiece(
    falseContactSession,
    stateId,
    stateId === "maine"
      ? geometry.piecesById.california.correctPosition
      : geometry.piecesById[stateId].correctPosition,
    geometry
  );
}
const falseContactEvaluation = evaluateLower48Reconstruction(
  falseContactSession,
  capstone,
  geometry
);
assert.equal(falseContactEvaluation.isComplete, false);
assert.ok(falseContactEvaluation.counts.misplaced > 0);

let stackedSession = createMapReconstructionSession(capstone, geometry, {
  random: createSeededMapReconstructionRandom(52)
});
for (const stateId of capstone.stateIds) {
  stackedSession = placeMapReconstructionPiece(
    stackedSession,
    stateId,
    { x: 900, y: 550 },
    geometry
  );
}
const stackedEvaluation = evaluateLower48Reconstruction(stackedSession, capstone, geometry);
assert.equal(stackedEvaluation.isComplete, false);
assert.ok(stackedEvaluation.integrity.severeOverlapCount > 0);
assert.ok(stackedEvaluation.durationMs < 1500);

const cameraSnapshot = { centerX: 700, centerY: 500, zoom: 2.5 };
const persistedSession = submitMapReconstructionSession(
  incompleteSession,
  incompleteEvaluation
);
const snapshot = createLower48ReconstructionSnapshot(persistedSession, {
  camera: cameraSnapshot,
  drawer: {
    collapsed: true,
    filter: "placed",
    sort: "alphabetical",
    search: "new"
  },
  correctionShown: true
});
assert.deepEqual(validateLower48ReconstructionSnapshot(snapshot, capstone), []);
const restored = restoreLower48ReconstructionSession(
  createMapReconstructionSession(capstone, geometry),
  snapshot,
  capstone
);
assert.deepEqual(restored.bankOrder, persistedSession.bankOrder);
assert.deepEqual(restored.piecesById.maine.position, persistedSession.piecesById.maine.position);
assert.equal(restored.activeDrag, null);
const memoryStorage = {
  value: null,
  getItem() { return this.value; },
  setItem(key, value) { this.value = value; },
  removeItem() { this.value = null; }
};
assert.equal(writeLower48ReconstructionSnapshot(memoryStorage, snapshot), true);
assert.deepEqual(readLower48ReconstructionSnapshot(memoryStorage, capstone), snapshot);
const legacySortSnapshot = structuredClone(snapshot);
legacySortSnapshot.ui.drawer.sort = "shuffled";
memoryStorage.value = JSON.stringify(legacySortSnapshot);
assert.equal(
  readLower48ReconstructionSnapshot(memoryStorage, capstone).ui.drawer.sort,
  "alphabetical"
);
memoryStorage.value = JSON.stringify(snapshot);
const malformedSnapshot = structuredClone(snapshot);
malformedSnapshot.ui.camera.zoom = 99;
assert.ok(validateLower48ReconstructionSnapshot(
  malformedSnapshot,
  capstone
).includes("Saved camera is invalid."));
memoryStorage.value = JSON.stringify(malformedSnapshot);
assert.equal(readLower48ReconstructionSnapshot(memoryStorage, capstone), null);
memoryStorage.value = "{bad json";
assert.equal(readLower48ReconstructionSnapshot(memoryStorage, capstone), null);
assert.equal(clearLower48ReconstructionSnapshot(memoryStorage), true);
assert.equal(memoryStorage.value, null);

const uiSource = fs.readFileSync(
  new URL("../src/atlas/map-reconstruction-capstone-ui.js", import.meta.url),
  "utf8"
);
const cssSource = fs.readFileSync(
  new URL("../maplibre-poc.css", import.meta.url),
  "utf8"
);
assert.match(cssSource, /map-reconstruction-capstone-workspace[\s\S]*touch-action:\s*none/);
assert.match(uiSource, /map-reconstruction-capstone-drawer/);
assert.match(uiSource, /Show correct placement/);
assert.match(uiSource, /Back to my map/);
assert.match(uiSource, /prefers-reduced-motion/);
assert.match(uiSource, /data-capstone-piece-path/);
assert.match(uiSource, /isPointInMapReconstructionPiece/);
assert.match(uiSource, /pointers\.size >= 2/);
assert.match(uiSource, /activePieceDrag = null/);
assert.match(uiSource, /isMapReconstructionMobileAssistanceEnabled/);
assert.match(uiSource, /pointerType === "mouse"/);
assert.match(uiSource, /restoreMobileDragAssistance/);
assert.match(uiSource, /cancelMobileAssistance/);
assert.doesNotMatch(uiSource, /announce\(|aria-live|map-reconstruction-live-region|speakAudioPathAndWait/);
assert.match(uiSource, /max-width: 720px/);
assert.match(uiSource, /getLower48DrawerDropPosition/);
assert.match(uiSource, /placeDrawerStateAtPoint/);
assert.match(uiSource, /createMapReconstructionDragPreview\(piece, workspaceSvg/);
assert.match(uiSource, /map-reconstruction-capstone-drag-proxy/);
assert.match(uiSource, /addEventListener\("dblclick"/);
assert.match(uiSource, /Select connected group/);
assert.match(uiSource, /Fit selected/);
assert.match(uiSource, /moveMapReconstructionSelectedPieces/);
assert.match(uiSource, /clearMapReconstructionSelection/);
assert.match(uiSource, /getMapReconstructionStatesIntersectingBounds/);
assert.match(uiSource, /type: "marquee"/);
assert.doesNotMatch(uiSource, /triple|detail\s*===\s*3/i);
assert.match(uiSource, /lostpointercapture/);
assert.match(uiSource, /keyEvent\.key === "Escape"/);
assert.doesNotMatch(uiSource, /\["shuffled", "Shuffled"\]/);
assert.match(cssSource, /map-reconstruction-capstone-thumbnail[\s\S]*touch-action:\s*none/);

console.log("Map Reconstruction Lower 48 capstone validation passed.");
