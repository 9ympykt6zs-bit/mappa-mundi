import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  MAP_RECONSTRUCTION_REGION_IDS,
  getMapReconstructionRegion,
  listMapReconstructionRegions,
  validateMapReconstructionCoverage,
  validateMapReconstructionRegion
} from "../src/atlas/map-reconstruction-regions.js";
import { unitedStatesAtlas } from "../src/atlas/united-states-atlas-data.js";
import {
  getMapReconstructionInteractionLayout,
  getMapReconstructionThumbnailTransform,
  getTopmostMapReconstructionPieceAtPoint,
  isPointInMapReconstructionPiece,
  prepareMapReconstructionGeometry
} from "../src/atlas/map-reconstruction-geometry.js";
import {
  beginMapReconstructionDrag,
  clampMapReconstructionPosition,
  completeMapReconstructionCorrection,
  createMapReconstructionSession,
  createSeededMapReconstructionRandom,
  findMapReconstructionAutomaticPlacement,
  getMapReconstructionPieceRenderOrder,
  getMapReconstructionSelectedStateIds,
  moveMapReconstructionPieceByKeyboard,
  moveMapReconstructionSelectedPieces,
  placeMapReconstructionPiece,
  prepareMapReconstructionCorrectionReplay,
  resetMapReconstructionSession,
  restoreMapReconstructionSubmittedMap,
  returnMapReconstructionPieceToBank,
  selectMapReconstructionStates,
  setMapReconstructionViewMode,
  showMapReconstructionCorrectPlacement,
  sortMapReconstructionStateIdsByName,
  submitMapReconstructionSession
} from "../src/atlas/map-reconstruction-engine.js";
import {
  areMapReconstructionPiecesTouching,
  getMapReconstructionConnectedComponent,
  getMapReconstructionStatesIntersectingBounds
} from "../src/atlas/map-reconstruction-connectivity.js";
import {
  MAP_RECONSTRUCTION_PLACEMENT_STATUSES,
  evaluateMapReconstruction,
  getMapReconstructionAdjacencyPairs
} from "../src/atlas/map-reconstruction-evaluation.js";
import {
  MAP_RECONSTRUCTION_SUCCESS_TIMING,
  getDefaultMapReconstructionPlacement,
  getMapReconstructionCorrectionStartPosition,
  getMapReconstructionResultVisualPlan,
  getMapReconstructionShelfDropPosition,
  getMapReconstructionSuccessViewBox,
  mapClientPointToReconstructionWorkspace,
  shouldRenderMapReconstructionCorrectLayout
} from "../src/atlas/map-reconstruction-ui.js";
import {
  getMapReconstructionDefaultGrabAnchor,
  getMapReconstructionDragPreviewLayout
} from "../src/atlas/map-reconstruction-drag-preview.js";
import {
  animateMapReconstructionMobileValue,
  getMapReconstructionMobilePieceSize,
  getMapReconstructionMobileSnapTarget,
  getMapReconstructionMobileSnapThreshold,
  isMapReconstructionMobileAssistanceEnabled
} from "../src/atlas/map-reconstruction-mobile-assistance.js";

const featureCollection = JSON.parse((await readFile(
  new URL("../assets/maps/data/maplibre-us-states-atlas.geojson", import.meta.url),
  "utf8"
)).replace(/^\uFEFF/, ""));
const [
  indexHtml,
  runtimeSource,
  uiSource,
  dragPreviewSource,
  stylesheet,
  audioManifestSource,
  ttsGeneratorSource
] = await Promise.all([
  readFile(new URL("../index.html", import.meta.url), "utf8"),
  readFile(new URL("../src/maplibre-poc.js", import.meta.url), "utf8"),
  readFile(new URL("../src/atlas/map-reconstruction-ui.js", import.meta.url), "utf8"),
  readFile(new URL("../src/atlas/map-reconstruction-drag-preview.js", import.meta.url), "utf8"),
  readFile(new URL("../maplibre-poc.css", import.meta.url), "utf8"),
  readFile(new URL("../assets/audio/audio-manifest.json", import.meta.url), "utf8"),
  readFile(new URL("./generate-tts-audio.mjs", import.meta.url), "utf8")
]);
const audioManifest = JSON.parse(audioManifestSource);
const region = getMapReconstructionRegion(MAP_RECONSTRUCTION_REGION_IDS.REBUILD_NEW_ENGLAND);
const expectedStateIds = [
  "maine",
  "new-hampshire",
  "vermont",
  "massachusetts",
  "rhode-island",
  "connecticut"
];

assert.deepEqual(validateMapReconstructionRegion(region), []);
assert.deepEqual(region.stateIds, expectedStateIds);
assert.equal(new Set(region.stateIds).size, 6);
assert.match(indexHtml, /id="main-menu-map-reconstruction-button"/);
assert.match(indexHtml, /id="map-reconstruction-panel"/);
assert.match(runtimeSource, /function openMapReconstruction\(\)/);
assert.match(runtimeSource, /showMapReconstructionRegionSelection/);
assert.match(uiSource, /createMapReconstructionRegionSelection/);
assert.match(uiSource, /isMapReconstructionMobileAssistanceEnabled/);
assert.match(uiSource, /pointerType === "mouse"/);
assert.match(uiSource, /restoreMobileDragAssistance/);
assert.match(uiSource, /cancelMobileAssistance/);
assert.doesNotMatch(uiSource, /announce\(|aria-live|map-reconstruction-live-region|speakAudioPathAndWait/);
assert.match(uiSource, /viewBox: visualPlan\.viewBox/);
assert.doesNotMatch(uiSource, /data-map-reconstruction-correct-layout/);
assert.doesNotMatch(uiSource, /map-reconstruction-correct-layer/);
assert.doesNotMatch(uiSource, /map-reconstruction-view-button/);
assert.doesNotMatch(stylesheet, /map-reconstruction-view-button/);
assert.doesNotMatch(stylesheet, /stroke-dasharray/);
assert.match(uiSource, /Show correct placement/);
assert.match(uiSource, /Replay correction/);
assert.match(uiSource, /Back to my map/);
assert.match(stylesheet, /@media \(max-width: 760px\)/);
assert.match(stylesheet, /body\.overview-mode\.map-reconstruction-mode\s+\.map-shell\s*\{[^}]*height:\s*100dvh;[^}]*min-height:\s*0;/s);
assert.match(stylesheet, /\.map-reconstruction-shell\s*\{[^}]*max-width:\s*none;[^}]*width:\s*100%;/s);
assert.match(stylesheet, /\.map-reconstruction-content\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\)\s*clamp\(/s);
assert.match(stylesheet, /\.map-reconstruction-workspace\s*\{[^}]*aspect-ratio:\s*auto;[^}]*height:\s*100%;[^}]*width:\s*100%;/s);
assert.match(stylesheet, /\.map-reconstruction-shell\.is-result\.is-success\s+\.map-reconstruction-content\s*\{[^}]*clamp\(210px,\s*14vw,\s*240px\)/s);
assert.match(stylesheet, /grid-template-rows:\s*minmax\(0,\s*1fr\)\s*minmax\(120px,\s*30svh\)/);

const geometry = prepareMapReconstructionGeometry(featureCollection, region);
assert.deepEqual(geometry.stateIds, expectedStateIds);
assert.equal(geometry.pieces.length, 6);
assert.ok(geometry.medianStateDiagonal > 0);

const coarsePointerWindow = {
  matchMedia: (query) => ({ matches: query === "(pointer: coarse)" })
};
const finePointerWindow = {
  matchMedia: () => ({ matches: false }),
  innerWidth: 390
};
assert.equal(isMapReconstructionMobileAssistanceEnabled(coarsePointerWindow), true);
assert.equal(isMapReconstructionMobileAssistanceEnabled(finePointerWindow), false);
const mobilePieceSizes = new Set();
for (const piece of geometry.pieces) {
  const size = getMapReconstructionMobilePieceSize(piece, geometry);
  mobilePieceSizes.add(size);
  const threshold = getMapReconstructionMobileSnapThreshold(piece, geometry);
  assert.ok(["large", "medium", "small"].includes(size));
  assert.equal(threshold.cssPixels, { large: 5, medium: 7, small: 9 }[size]);
  const inside = getMapReconstructionMobileSnapTarget({
    position: {
      x: piece.correctPosition.x + threshold.cssPixels - 0.1,
      y: piece.correctPosition.y
    },
    piece,
    geometry,
    selectedPieceCount: 1,
    cssPixelsPerWorldUnit: 1,
    targetWindow: coarsePointerWindow
  });
  const outside = getMapReconstructionMobileSnapTarget({
    position: {
      x: piece.correctPosition.x + threshold.cssPixels + 0.1,
      y: piece.correctPosition.y
    },
    piece,
    geometry,
    selectedPieceCount: 1,
    cssPixelsPerWorldUnit: 1,
    targetWindow: coarsePointerWindow
  });
  assert.deepEqual(inside?.position, piece.correctPosition);
  assert.equal(outside, null);
}
assert.deepEqual([...mobilePieceSizes].sort(), ["large", "medium", "small"]);
assert.equal(getMapReconstructionMobileSnapTarget({
  position: geometry.pieces[0].correctPosition,
  piece: geometry.pieces[0],
  geometry,
  selectedPieceCount: 2,
  cssPixelsPerWorldUnit: 1,
  targetWindow: coarsePointerWindow
}), null);
let queuedAnimationFrame = null;
let animationFrameCancelled = false;
let animationUpdateCount = 0;
const animationWindow = {
  matchMedia: () => ({ matches: false }),
  performance: { now: () => 0 },
  requestAnimationFrame: (callback) => {
    queuedAnimationFrame = callback;
    return 17;
  },
  cancelAnimationFrame: (frameId) => {
    animationFrameCancelled = frameId === 17;
  }
};
const cancelMobileAnimation = animateMapReconstructionMobileValue({
  from: { x: 0 },
  to: { x: 10 },
  durationMs: 100,
  targetWindow: animationWindow,
  onUpdate: () => {
    animationUpdateCount += 1;
  }
});
cancelMobileAnimation();
queuedAnimationFrame?.(100);
assert.equal(animationFrameCancelled, true);
assert.equal(animationUpdateCount, 0);
let reducedMotionUpdate = null;
let reducedMotionFinished = false;
const reducedMotionWindow = {
  matchMedia: (query) => ({ matches: query === "(prefers-reduced-motion: reduce)" }),
  performance: { now: () => 0 },
  requestAnimationFrame: (callback) => {
    callback(0);
    return 1;
  },
  cancelAnimationFrame: () => {}
};
animateMapReconstructionMobileValue({
  from: { x: 0 },
  to: { x: 10 },
  durationMs: 180,
  targetWindow: reducedMotionWindow,
  onUpdate: (value) => {
    reducedMotionUpdate = value;
  },
  onFinish: () => {
    reducedMotionFinished = true;
  }
});
assert.deepEqual(reducedMotionUpdate, { x: 10 });
assert.equal(reducedMotionFinished, true);
for (const stateId of expectedStateIds) {
  const piece = geometry.piecesById[stateId];
  assert.ok(piece.path.startsWith("M"), `${stateId} should have an SVG path`);
  assert.ok(piece.vertexCount > 0, `${stateId} should preserve vertices`);
  assert.ok(piece.area > 0, `${stateId} should preserve projected area`);
  assert.ok(piece.correctBounds.minX >= 0 && piece.correctBounds.maxX <= geometry.workspace.width);
  assert.ok(piece.correctBounds.minY >= 0 && piece.correctBounds.maxY <= geometry.workspace.height);
  assert.match(getMapReconstructionThumbnailTransform(piece), /^translate\(/);
}
assert.equal(geometry.piecesById.maine.geometryType, "MultiPolygon");
assert.ok(geometry.piecesById.maine.polygonCount > 1, "Maine islands should be preserved");
assert.equal(geometry.piecesById.vermont.geometryType, "Polygon");

function testPiece(stateId, polygons) {
  const points = polygons.flatMap((polygon) => polygon.flat());
  const localBounds = points.reduce((bounds, [x, y]) => ({
    minX: Math.min(bounds.minX, x),
    minY: Math.min(bounds.minY, y),
    maxX: Math.max(bounds.maxX, x),
    maxY: Math.max(bounds.maxY, y)
  }), { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity });
  return {
    stateId,
    polygons,
    localBounds,
    width: localBounds.maxX - localBounds.minX,
    height: localBounds.maxY - localBounds.minY
  };
}

const square = (size = 10) => [[[
  [0, 0], [size, 0], [size, size], [0, size], [0, 0]
]]];
const squarePieceA = testPiece("a", square());
const squarePieceB = testPiece("b", square());
assert.equal(areMapReconstructionPiecesTouching(
  squarePieceA, { x: 0, y: 0 }, squarePieceB, { x: 10.5, y: 0 }, 1
), true, "A narrow learner gap should fall within the configured tolerance");
assert.equal(areMapReconstructionPiecesTouching(
  squarePieceA, { x: 0, y: 0 }, squarePieceB, { x: 13, y: 0 }, 1
), false, "A clearly visible learner gap should remain disconnected");
assert.equal(areMapReconstructionPiecesTouching(
  squarePieceA, { x: 0, y: 0 }, squarePieceB, { x: 9.8, y: 0 }, 0
), true, "Slight actual geometry overlap should connect pieces");
assert.equal(areMapReconstructionPiecesTouching(
  squarePieceA, { x: 0, y: 0 }, squarePieceB, { x: 10, y: 10 }, 0
), true, "Genuine Four Corners-style point contact should connect pieces");

const lowerTriangle = testPiece("lower", [[[
  [0, 0], [10, 0], [0, 10], [0, 0]
]]]);
const upperTriangle = testPiece("upper", [[[
  [10, 10], [10, 6], [6, 10], [10, 10]
]]]);
assert.equal(areMapReconstructionPiecesTouching(
  lowerTriangle, { x: 0, y: 0 }, upperTriangle, { x: 0, y: 0 }, 1
), false, "Overlapping wrapper bounds alone must not connect pieces");

const donut = testPiece("donut", [[
  [[0, 0], [20, 0], [20, 20], [0, 20], [0, 0]],
  [[5, 5], [5, 15], [15, 15], [15, 5], [5, 5]]
]]);
const insideHole = testPiece("inside-hole", [[[
  [7, 7], [9, 7], [9, 9], [7, 9], [7, 7]
]]]);
assert.equal(areMapReconstructionPiecesTouching(
  donut, { x: 0, y: 0 }, insideHole, { x: 0, y: 0 }, 1
), false, "A state inside a wrapper and polygon hole should remain disconnected");

const multiPolygon = testPiece("multi", [
  [[[0, 0], [4, 0], [4, 4], [0, 4], [0, 0]]],
  [[[20, 0], [24, 0], [24, 4], [20, 4], [20, 0]]]
]);
const islandNeighbor = testPiece("island-neighbor", [[[
  [24.5, 0], [28.5, 0], [28.5, 4], [24.5, 4], [24.5, 0]
]]]);
assert.equal(areMapReconstructionPiecesTouching(
  multiPolygon, { x: 0, y: 0 }, islandNeighbor, { x: 0, y: 0 }, 1
), true, "MultiPolygon boundaries should participate in connected detection");

const chainGeometry = {
  stateIds: ["a", "b", "c", "far"],
  piecesById: {
    a: squarePieceA,
    b: squarePieceB,
    c: testPiece("c", square()),
    far: testPiece("far", square())
  }
};
const chainSession = {
  piecesById: {
    a: { position: { x: 0, y: 0 } },
    b: { position: { x: 10.5, y: 0 } },
    c: { position: { x: 21, y: 0 } },
    far: { position: { x: 60, y: 0 } }
  }
};
assert.deepEqual(
  getMapReconstructionConnectedComponent(chainSession, chainGeometry, "a", 1),
  ["a", "b", "c"],
  "Connected selection should traverse the full learner-positioned chain"
);
assert.deepEqual(
  getMapReconstructionStatesIntersectingBounds(chainSession, chainGeometry, {
    minX: -2,
    minY: -2,
    maxX: 19,
    maxY: 12
  }),
  ["a", "b"],
  "Marquee selection should use learner-positioned geometry"
);

function createScaledWorkspaceSvg(scale, offsetX, offsetY) {
  return {
    getScreenCTM: () => ({
      inverse: () => ({ scale, offsetX, offsetY })
    }),
    createSVGPoint: () => ({
      x: 0,
      y: 0,
      matrixTransform(matrix) {
        return {
          x: (this.x - matrix.offsetX) / matrix.scale,
          y: (this.y - matrix.offsetY) / matrix.scale
        };
      }
    })
  };
}

const logicalResizePoint = { x: 420, y: 315 };
for (const viewport of [
  { scale: 0.5, offsetX: 12, offsetY: 76 },
  { scale: 1.35, offsetX: 48, offsetY: 92 }
]) {
  assert.deepEqual(mapClientPointToReconstructionWorkspace(
    createScaledWorkspaceSvg(viewport.scale, viewport.offsetX, viewport.offsetY),
    viewport.offsetX + logicalResizePoint.x * viewport.scale,
    viewport.offsetY + logicalResizePoint.y * viewport.scale
  ), logicalResizePoint, "pointer conversion should preserve logical coordinates after resize");
}

const wideInteractionLayout = getMapReconstructionInteractionLayout(
  geometry.workspace,
  { width: 1600, height: 700 },
  { insetCssPixels: 12 }
);
assert.ok(wideInteractionLayout.viewBox.x < 0);
assert.ok(wideInteractionLayout.viewBox.width > geometry.workspace.width);
assert.equal(wideInteractionLayout.viewBox.height, geometry.workspace.height);
assert.ok(Math.abs(
  wideInteractionLayout.workspace.dragPadding / wideInteractionLayout.unitsPerCssPixel - 12
) < 0.000001, "interaction padding should remain 12 CSS pixels after SVG scaling");

const tallInteractionLayout = getMapReconstructionInteractionLayout(
  geometry.workspace,
  { width: 500, height: 900 },
  { insetCssPixels: 12 }
);
assert.ok(tallInteractionLayout.viewBox.y < 0);
assert.ok(tallInteractionLayout.viewBox.height > geometry.workspace.height);
assert.equal(tallInteractionLayout.viewBox.width, geometry.workspace.width);
assert.notDeepEqual(
  wideInteractionLayout.workspace,
  tallInteractionLayout.workspace,
  "workspace bounds should recalculate when the visible aspect ratio changes"
);

const wideInteractionGeometry = {
  ...geometry,
  workspace: wideInteractionLayout.workspace
};
const edgePiece = geometry.piecesById.maine;
const leftEdgePosition = clampMapReconstructionPosition(
  { x: Number.NEGATIVE_INFINITY, y: 300 },
  edgePiece,
  wideInteractionGeometry.workspace
);
const rightEdgePosition = clampMapReconstructionPosition(
  { x: Number.POSITIVE_INFINITY, y: 300 },
  edgePiece,
  wideInteractionGeometry.workspace
);
const topEdgePosition = clampMapReconstructionPosition(
  { x: 500, y: Number.NEGATIVE_INFINITY },
  edgePiece,
  tallInteractionLayout.workspace
);
const bottomEdgePosition = clampMapReconstructionPosition(
  { x: 500, y: Number.POSITIVE_INFINITY },
  edgePiece,
  tallInteractionLayout.workspace
);
assert.equal(leftEdgePosition, null, "non-finite positions should still fail safely");
assert.equal(rightEdgePosition, null, "non-finite positions should still fail safely");
assert.equal(topEdgePosition, null, "non-finite positions should still fail safely");
assert.equal(bottomEdgePosition, null, "non-finite positions should still fail safely");

const clampedLeft = clampMapReconstructionPosition(
  { x: -100000, y: 300 },
  edgePiece,
  wideInteractionGeometry.workspace
);
const clampedRight = clampMapReconstructionPosition(
  { x: 100000, y: 300 },
  edgePiece,
  wideInteractionGeometry.workspace
);
const clampedTop = clampMapReconstructionPosition(
  { x: 500, y: -100000 },
  edgePiece,
  tallInteractionLayout.workspace
);
const clampedBottom = clampMapReconstructionPosition(
  { x: 500, y: 100000 },
  edgePiece,
  tallInteractionLayout.workspace
);
assert.ok(Math.abs(
  clampedLeft.x + edgePiece.localBounds.minX
    - (wideInteractionLayout.workspace.x + wideInteractionLayout.workspace.dragPadding)
) < 0.000001, "piece geometry should reach the visible left inset");
assert.ok(Math.abs(
  clampedRight.x + edgePiece.localBounds.maxX
    - (
      wideInteractionLayout.workspace.x
      + wideInteractionLayout.workspace.width
      - wideInteractionLayout.workspace.dragPadding
    )
) < 0.000001, "piece geometry should reach the visible right inset");
assert.ok(Math.abs(
  clampedTop.y + edgePiece.localBounds.minY
    - (tallInteractionLayout.workspace.y + tallInteractionLayout.workspace.dragPadding)
) < 0.000001, "piece geometry should reach the visible top inset");
assert.ok(Math.abs(
  clampedBottom.y + edgePiece.localBounds.maxY
    - (
      tallInteractionLayout.workspace.y
      + tallInteractionLayout.workspace.height
      - tallInteractionLayout.workspace.dragPadding
    )
) < 0.000001, "piece geometry should reach the visible bottom inset");

function findPiecePoint(piece, shouldBeInside) {
  const columns = 24;
  const rows = 24;
  for (let row = 0; row <= rows; row += 1) {
    for (let column = 0; column <= columns; column += 1) {
      const point = {
        x: piece.localBounds.minX + (piece.localBounds.maxX - piece.localBounds.minX) * column / columns,
        y: piece.localBounds.minY + (piece.localBounds.maxY - piece.localBounds.minY) * row / rows
      };
      if (isPointInMapReconstructionPiece(piece, point) === shouldBeInside) return point;
    }
  }
  return null;
}

const rhodeIslandPiece = geometry.piecesById["rhode-island"];
const massachusettsPiece = geometry.piecesById.massachusetts;
const rhodeIslandInteriorPoint = findPiecePoint(rhodeIslandPiece, true);
const massachusettsInteriorPoint = findPiecePoint(massachusettsPiece, true);
const massachusettsTransparentPoint = findPiecePoint(massachusettsPiece, false);
assert.ok(rhodeIslandInteriorPoint);
assert.ok(massachusettsInteriorPoint);
assert.ok(massachusettsTransparentPoint);
assert.equal(isPointInMapReconstructionPiece(rhodeIslandPiece, rhodeIslandInteriorPoint), true);
assert.equal(isPointInMapReconstructionPiece(rhodeIslandPiece, {
  x: rhodeIslandPiece.localBounds.maxX + 1,
  y: rhodeIslandPiece.localBounds.maxY + 1
}), false);
assert.equal(isPointInMapReconstructionPiece(massachusettsPiece, massachusettsTransparentPoint), false);

const canonicalHitEntries = region.stateIds.map((stateId) => ({
  stateId,
  piece: geometry.piecesById[stateId],
  position: geometry.piecesById[stateId].correctPosition
}));
const rhodeIslandGlobalPoint = {
  x: rhodeIslandPiece.correctPosition.x + rhodeIslandInteriorPoint.x,
  y: rhodeIslandPiece.correctPosition.y + rhodeIslandInteriorPoint.y
};
assert.equal(getTopmostMapReconstructionPieceAtPoint(canonicalHitEntries, rhodeIslandGlobalPoint), "rhode-island");
assert.notEqual(getTopmostMapReconstructionPieceAtPoint(canonicalHitEntries, rhodeIslandGlobalPoint), "massachusetts");
const massachusettsGlobalPoint = {
  x: massachusettsPiece.correctPosition.x + massachusettsInteriorPoint.x,
  y: massachusettsPiece.correctPosition.y + massachusettsInteriorPoint.y
};
assert.equal(getTopmostMapReconstructionPieceAtPoint(canonicalHitEntries, massachusettsGlobalPoint), "massachusetts");
assert.equal(getTopmostMapReconstructionPieceAtPoint([{
  stateId: "massachusetts",
  piece: massachusettsPiece,
  position: massachusettsPiece.correctPosition
}], {
  x: massachusettsPiece.correctPosition.x + massachusettsTransparentPoint.x,
  y: massachusettsPiece.correctPosition.y + massachusettsTransparentPoint.y
}), null, "transparent bounding-box space must not select Massachusetts");
assert.equal(getTopmostMapReconstructionPieceAtPoint([
  { stateId: "massachusetts", piece: massachusettsPiece, position: { x: 500, y: 300 } },
  { stateId: "rhode-island", piece: rhodeIslandPiece, position: { x: 500, y: 300 } }
], { x: 500, y: 300 }), "rhode-island", "topmost painted geometry should win an overlap");
assert.equal(getTopmostMapReconstructionPieceAtPoint([
  { stateId: "rhode-island", piece: rhodeIslandPiece, position: { x: 500, y: 300 } },
  { stateId: "massachusetts", piece: massachusettsPiece, position: { x: 500, y: 300 } }
], { x: 500, y: 300 }), "massachusetts", "z-order should remain predictable");

const duplicateRegion = { ...region, stateIds: [...region.stateIds, "maine"] };
assert.ok(validateMapReconstructionRegion(duplicateRegion).some((error) => error.includes("unique")));
assert.throws(
  () => prepareMapReconstructionGeometry(featureCollection, duplicateRegion),
  /unique/
);
assert.throws(
  () => prepareMapReconstructionGeometry(featureCollection, { ...region, stateIds: [...region.stateIds, "unknown"] }),
  /Missing state geometry/
);
const maineFeature = featureCollection.features.find((feature) => feature.properties?.id === "maine");
assert.throws(
  () => prepareMapReconstructionGeometry({
    ...featureCollection,
    features: [...featureCollection.features, maineFeature]
  }, region),
  /Duplicate state geometry/
);

const firstSession = createMapReconstructionSession(region, geometry, {
  random: createSeededMapReconstructionRandom(42)
});
const secondSession = createMapReconstructionSession(region, geometry, {
  random: createSeededMapReconstructionRandom(42)
});
assert.deepEqual(firstSession.bankOrder, secondSession.bankOrder);
assert.deepEqual(
  firstSession.bankOrder,
  sortMapReconstructionStateIdsByName(region.stateIds, geometry)
);
assert.deepEqual(new Set(firstSession.bankOrder), new Set(region.stateIds));
assert.equal(shouldRenderMapReconstructionCorrectLayout(firstSession.phase, firstSession.viewMode), false);
const defaultPlacement = getDefaultMapReconstructionPlacement(firstSession.piecesById.maine, geometry);
assert.ok(defaultPlacement.x > 0 && defaultPlacement.x < geometry.workspace.width);
assert.ok(defaultPlacement.y > 0 && defaultPlacement.y < geometry.workspace.height);

const originalSession = structuredClone(firstSession);
const placedSession = placeMapReconstructionPiece(firstSession, "maine", { x: 500, y: 300 }, geometry);
assert.deepEqual(firstSession, originalSession, "placement should not mutate its input");
assert.deepEqual(placedSession.piecesById.maine.position, { x: 500, y: 300 });
assert.equal(placedSession.piecesById.maine.placementStatus, "placed");
assert.equal(placedSession.selectedStateId, "maine");
assert.deepEqual(getMapReconstructionPieceRenderOrder(placedSession), ["maine"]);
const overlappingConnecticut = placeMapReconstructionPiece(
  placedSession,
  "connecticut",
  placedSession.piecesById.maine.position,
  geometry
);
assert.deepEqual(
  getMapReconstructionPieceRenderOrder(overlappingConnecticut),
  ["maine", "connecticut"],
  "a newly placed overlapping piece should render on top"
);
const multiSelected = selectMapReconstructionStates(
  overlappingConnecticut,
  ["maine", "connecticut"],
  { primaryStateId: "maine" }
);
assert.deepEqual(getMapReconstructionSelectedStateIds(multiSelected), [
  "maine",
  "connecticut"
]);
assert.equal(multiSelected.selectedStateId, "maine");
const groupMoved = moveMapReconstructionSelectedPieces(
  multiSelected,
  "maine",
  { x: 10, y: 5 },
  geometry
);
assert.deepEqual(groupMoved.piecesById.maine.position, { x: 510, y: 305 });
assert.deepEqual(groupMoved.piecesById.connecticut.position, { x: 510, y: 305 });
assert.deepEqual(getMapReconstructionSelectedStateIds(groupMoved), [
  "maine",
  "connecticut"
]);
const raisedMaine = beginMapReconstructionDrag(
  multiSelected,
  "maine",
  1,
  { x: 500, y: 300 },
  overlappingConnecticut.piecesById.maine.position
);
assert.deepEqual(
  getMapReconstructionPieceRenderOrder(raisedMaine),
  ["maine", "connecticut"],
  "interacting with a selected group should preserve its relative z-order"
);
assert.deepEqual(
  getMapReconstructionShelfDropPosition({ x: 440, y: 330 }, { x: 20, y: -10 }),
  { x: 420, y: 340 },
  "shelf dragging should preserve the pointer-to-piece offset"
);
let automaticPlacementSession = firstSession;
const automaticPositions = [];
for (const stateId of firstSession.bankOrder.slice(0, 4)) {
  const position = findMapReconstructionAutomaticPlacement(
    automaticPlacementSession,
    stateId,
    geometry
  );
  automaticPositions.push(`${position.x.toFixed(3)},${position.y.toFixed(3)}`);
  automaticPlacementSession = placeMapReconstructionPiece(
    automaticPlacementSession,
    stateId,
    position,
    geometry
  );
}
assert.ok(
  new Set(automaticPositions).size > 1,
  "automatic placement should not stack every clicked piece at identical coordinates"
);
assert.equal(
  getMapReconstructionPieceRenderOrder(automaticPlacementSession).at(-1),
  firstSession.bankOrder[3]
);
assert.equal(
  Object.values(automaticPlacementSession.piecesById).filter((piece) => piece.position).length,
  4,
  "automatic placement should retain every placed piece exactly once"
);
const returnedSession = returnMapReconstructionPieceToBank(placedSession, "maine");
assert.equal(returnedSession.piecesById.maine.position, null);
assert.deepEqual(returnedSession.pieceZOrder, []);
assert.deepEqual(resetMapReconstructionSession(placedSession).bankOrder, firstSession.bankOrder);
assert.deepEqual(resetMapReconstructionSession(placedSession).pieceZOrder, []);
assert.deepEqual(
  placeMapReconstructionPiece(firstSession, "unknown", { x: 400, y: 300 }, geometry),
  firstSession,
  "unknown pieces should be rejected safely"
);
assert.deepEqual(
  placeMapReconstructionPiece(firstSession, "maine", { x: Number.NaN, y: 300 }, geometry),
  firstSession,
  "invalid coordinates should be rejected safely"
);

let keyboardSession = placeMapReconstructionPiece(firstSession, "connecticut", { x: 400, y: 400 }, geometry);
const beforeKeyboardMove = structuredClone(keyboardSession);
keyboardSession = moveMapReconstructionPieceByKeyboard(keyboardSession, "connecticut", "right", geometry);
assert.equal(keyboardSession.piecesById.connecticut.position.x, beforeKeyboardMove.piecesById.connecticut.position.x + 5);
const largeKeyboardMove = moveMapReconstructionPieceByKeyboard(keyboardSession, "connecticut", "up", geometry, { large: true });
assert.equal(largeKeyboardMove.piecesById.connecticut.position.y, keyboardSession.piecesById.connecticut.position.y - 20);
assert.deepEqual(new Set(Object.keys(largeKeyboardMove.piecesById)), new Set(region.stateIds));

function sessionAtCorrectPositions(offset = { x: 0, y: 0 }) {
  const session = createMapReconstructionSession(region, geometry, {
    random: createSeededMapReconstructionRandom(7)
  });
  for (const stateId of region.stateIds) {
    session.piecesById[stateId].position = {
      x: session.piecesById[stateId].correctPosition.x + offset.x,
      y: session.piecesById[stateId].correctPosition.y + offset.y
    };
    session.piecesById[stateId].placementStatus = "placed";
    session.piecesById[stateId].hasMoved = true;
  }
  return session;
}

const correctEvaluation = evaluateMapReconstruction(sessionAtCorrectPositions(), region, geometry);
assert.equal(correctEvaluation.counts[MAP_RECONSTRUCTION_PLACEMENT_STATUSES.WELL_PLACED], 6);
assert.equal(correctEvaluation.isComplete, true);
const correctSession = sessionAtCorrectPositions();
const learnerPositionsBeforeSubmit = Object.fromEntries(region.stateIds.map((stateId) => [
  stateId,
  { ...correctSession.piecesById[stateId].position }
]));
const submittedSession = submitMapReconstructionSession(correctSession, correctEvaluation);
assert.equal(submittedSession.phase, "result");
assert.equal(submittedSession.viewMode, "completed");
assert.equal(shouldRenderMapReconstructionCorrectLayout(submittedSession.phase, submittedSession.viewMode), false);
assert.deepEqual(
  Object.fromEntries(region.stateIds.map((stateId) => [stateId, submittedSession.piecesById[stateId].position])),
  learnerPositionsBeforeSubmit,
  "already canonical pieces should remain canonical"
);
assert.equal(setMapReconstructionViewMode(submittedSession, "learner").viewMode, "completed");

const successViewBox = getMapReconstructionSuccessViewBox(geometry);
assert.ok(successViewBox.width > geometry.combinedBounds.maxX - geometry.combinedBounds.minX);
assert.ok(successViewBox.height > geometry.combinedBounds.maxY - geometry.combinedBounds.minY);
assert.ok(Math.abs(
  successViewBox.x + successViewBox.width / 2
    - (geometry.combinedBounds.minX + geometry.combinedBounds.maxX) / 2
) < 1e-9);
assert.ok(Math.abs(
  successViewBox.y + successViewBox.height / 2
    - (geometry.combinedBounds.minY + geometry.combinedBounds.maxY) / 2
) < 1e-9);

const successVisualPlan = getMapReconstructionResultVisualPlan(submittedSession, geometry, {
  reducedMotion: false,
  playSuccessAnimation: true
});
assert.equal(successVisualPlan.isSuccess, true);
assert.equal(successVisualPlan.showComparisonControls, false);
assert.equal(successVisualPlan.showCorrectLayout, false);
assert.equal(successVisualPlan.showLearnerLayout, true);
assert.equal(successVisualPlan.playShimmer, true);
assert.equal(MAP_RECONSTRUCTION_SUCCESS_TIMING.shimmerRepeatCount, 1);
assert.ok(MAP_RECONSTRUCTION_SUCCESS_TIMING.shimmerDurationMs >= 600);
assert.ok(MAP_RECONSTRUCTION_SUCCESS_TIMING.shimmerDurationMs <= 1000);
const replayedSuccessPlan = getMapReconstructionResultVisualPlan(submittedSession, geometry, {
  reducedMotion: false,
  playSuccessAnimation: false
});
assert.equal(replayedSuccessPlan.playShimmer, false, "success shimmer should not replay on rerender");
assert.equal(replayedSuccessPlan.animateSnap, false, "success snap should not replay on rerender");
const reducedMotionPlan = getMapReconstructionResultVisualPlan(submittedSession, geometry, {
  reducedMotion: true,
  playSuccessAnimation: true
});
assert.equal(reducedMotionPlan.animateSnap, false);
assert.equal(reducedMotionPlan.playShimmer, false);
assert.equal(reducedMotionPlan.useStaticGlow, true);

const translatedEvaluation = evaluateMapReconstruction(
  sessionAtCorrectPositions({ x: 36, y: -28 }),
  region,
  geometry
);
assert.equal(translatedEvaluation.alignment.applied, true);
assert.equal(translatedEvaluation.counts[MAP_RECONSTRUCTION_PLACEMENT_STATUSES.WELL_PLACED], 6);
assert.equal(translatedEvaluation.isComplete, true);
const translatedSourceSession = sessionAtCorrectPositions({ x: 36, y: -28 });
const translatedSubmittedSession = submitMapReconstructionSession(translatedSourceSession, translatedEvaluation);
for (const stateId of region.stateIds) {
  assert.deepEqual(
    translatedSubmittedSession.piecesById[stateId].position,
    translatedSubmittedSession.piecesById[stateId].correctPosition,
    `${stateId} should snap to its canonical position`
  );
  assert.deepEqual(
    translatedSubmittedSession.piecesById[stateId].submittedPosition,
    translatedSourceSession.piecesById[stateId].position,
    `${stateId} should retain its submitted position for the success animation`
  );
}
const translatedVisualPlan = getMapReconstructionResultVisualPlan(translatedSubmittedSession, geometry, {
  reducedMotion: false,
  playSuccessAnimation: true
});
assert.equal(translatedVisualPlan.animateSnap, true);

const imperfectSpacingSession = sessionAtCorrectPositions();
const spacingNudge = geometry.medianStateDiagonal * 0.055;
imperfectSpacingSession.piecesById.vermont.position.x -= spacingNudge;
imperfectSpacingSession.piecesById["new-hampshire"].position.x += spacingNudge;
imperfectSpacingSession.piecesById.connecticut.position.y += spacingNudge * 0.6;
const imperfectSpacingEvaluation = evaluateMapReconstruction(imperfectSpacingSession, region, geometry);
assert.equal(imperfectSpacingEvaluation.isComplete, true, "recognizable imperfect spacing should pass structurally");
assert.equal(imperfectSpacingEvaluation.counts.misplaced, 0);

const swappedSession = sessionAtCorrectPositions();
const vermontPosition = swappedSession.piecesById.vermont.position;
swappedSession.piecesById.vermont.position = swappedSession.piecesById["new-hampshire"].position;
swappedSession.piecesById["new-hampshire"].position = vermontPosition;
const swappedEvaluation = evaluateMapReconstruction(swappedSession, region, geometry);
assert.equal(swappedEvaluation.placements.vermont.status, MAP_RECONSTRUCTION_PLACEMENT_STATUSES.MISPLACED);
assert.equal(swappedEvaluation.placements["new-hampshire"].status, MAP_RECONSTRUCTION_PLACEMENT_STATUSES.MISPLACED);
assert.ok(swappedEvaluation.feedback.includes("Vermont and New Hampshire are reversed."));
assert.equal(swappedEvaluation.isComplete, false);
const swappedPositions = Object.fromEntries(region.stateIds.map((stateId) => [
  stateId,
  { ...swappedSession.piecesById[stateId].position }
]));
const swappedSubmittedSession = submitMapReconstructionSession(swappedSession, swappedEvaluation);
assert.deepEqual(
  Object.fromEntries(region.stateIds.map((stateId) => [stateId, swappedSubmittedSession.piecesById[stateId].position])),
  swappedPositions,
  "incorrect submissions should preserve the learner arrangement"
);
assert.equal(swappedSubmittedSession.viewMode, "learner");
assert.equal(swappedSubmittedSession.correctionState, "idle");
assert.deepEqual(
  Object.fromEntries(region.stateIds.map((stateId) => [
    stateId,
    swappedSubmittedSession.piecesById[stateId].submittedPosition
  ])),
  swappedPositions,
  "the immutable submitted-position snapshot should match the learner map"
);
const incorrectVisualPlan = getMapReconstructionResultVisualPlan(swappedSubmittedSession, geometry, {
  reducedMotion: false,
  playSuccessAnimation: true
});
assert.equal(incorrectVisualPlan.showComparisonControls, false);
assert.equal(incorrectVisualPlan.showCorrectLayout, false);
assert.equal(incorrectVisualPlan.isCorrectPlacement, false);
assert.equal(incorrectVisualPlan.playShimmer, false);

const correctionPlayingSession = showMapReconstructionCorrectPlacement(swappedSubmittedSession);
assert.equal(correctionPlayingSession.viewMode, "correct");
assert.equal(correctionPlayingSession.correctionState, "playing");
for (const stateId of region.stateIds) {
  assert.deepEqual(correctionPlayingSession.piecesById[stateId].position, geometry.piecesById[stateId].correctPosition);
  assert.deepEqual(correctionPlayingSession.piecesById[stateId].submittedPosition, swappedPositions[stateId]);
}
assert.deepEqual(
  Object.fromEntries(region.stateIds.map((stateId) => [stateId, swappedSubmittedSession.piecesById[stateId].position])),
  swappedPositions,
  "starting correction must not mutate the submitted result session"
);
const correctionPlayingPlan = getMapReconstructionResultVisualPlan(correctionPlayingSession, geometry, {
  reducedMotion: false,
  playSuccessAnimation: false
});
assert.equal(correctionPlayingPlan.animateCorrection, true);
assert.equal(correctionPlayingPlan.playShimmer, false);
assert.equal(correctionPlayingPlan.viewBox, `0 0 ${geometry.workspace.width} ${geometry.workspace.height}`);

const correctionCompleteSession = completeMapReconstructionCorrection(correctionPlayingSession);
assert.equal(correctionCompleteSession.correctionState, "complete");
const correctionCompletePlan = getMapReconstructionResultVisualPlan(correctionCompleteSession, geometry, {
  reducedMotion: false,
  playSuccessAnimation: false
});
assert.equal(correctionCompletePlan.animateCorrection, false);
assert.equal(correctionCompletePlan.isCorrectionComplete, true);
assert.equal(correctionCompletePlan.viewBox, getMapReconstructionSuccessViewBox(geometry).value);

const replayPreparingSession = prepareMapReconstructionCorrectionReplay(correctionCompleteSession);
assert.equal(replayPreparingSession.viewMode, "learner");
assert.equal(replayPreparingSession.correctionState, "preparing");
assert.deepEqual(
  Object.fromEntries(region.stateIds.map((stateId) => [stateId, replayPreparingSession.piecesById[stateId].position])),
  swappedPositions,
  "replay should visibly restore the submitted map before movement"
);
assert.deepEqual(replayPreparingSession.evaluation, correctionCompleteSession.evaluation);
for (const stateId of region.stateIds) {
  assert.deepEqual(replayPreparingSession.piecesById[stateId].submittedPosition, swappedPositions[stateId]);
}
assert.deepEqual(
  prepareMapReconstructionCorrectionReplay(replayPreparingSession),
  replayPreparingSession,
  "repeated replay requests should be ignored while preparing"
);
assert.deepEqual(
  showMapReconstructionCorrectPlacement(correctionPlayingSession),
  correctionPlayingSession,
  "repeated correction requests should be ignored while animation is active"
);

const restoredSubmittedSession = restoreMapReconstructionSubmittedMap(correctionCompleteSession);
assert.equal(restoredSubmittedSession.viewMode, "learner");
assert.equal(restoredSubmittedSession.correctionState, "complete");
assert.deepEqual(
  Object.fromEntries(region.stateIds.map((stateId) => [stateId, restoredSubmittedSession.piecesById[stateId].position])),
  swappedPositions
);
assert.deepEqual(restoredSubmittedSession.evaluation, swappedSubmittedSession.evaluation);
const replayedCorrectionSession = showMapReconstructionCorrectPlacement(replayPreparingSession);
assert.equal(replayedCorrectionSession.correctionState, "playing");
for (const stateId of region.stateIds) {
  assert.deepEqual(replayedCorrectionSession.piecesById[stateId].position, geometry.piecesById[stateId].correctPosition);
  assert.deepEqual(replayedCorrectionSession.piecesById[stateId].submittedPosition, swappedPositions[stateId]);
}
assert.equal(getMapReconstructionResultVisualPlan(replayedCorrectionSession, geometry, {
  reducedMotion: false,
  playSuccessAnimation: false
}).animateCorrection, true);
const reducedMotionCorrectionSession = showMapReconstructionCorrectPlacement(swappedSubmittedSession, {
  reducedMotion: true
});
assert.equal(reducedMotionCorrectionSession.correctionState, "complete");
assert.equal(getMapReconstructionResultVisualPlan(reducedMotionCorrectionSession, geometry, {
  reducedMotion: true,
  playSuccessAnimation: false
}).animateCorrection, false);
assert.ok(MAP_RECONSTRUCTION_SUCCESS_TIMING.correctionDurationMs >= 800);
assert.ok(MAP_RECONSTRUCTION_SUCCESS_TIMING.correctionDurationMs <= 1400);
assert.ok(MAP_RECONSTRUCTION_SUCCESS_TIMING.correctionReplayPauseMs >= 180);
assert.ok(MAP_RECONSTRUCTION_SUCCESS_TIMING.correctionReplayPauseMs <= 400);

const misplacedMaineSession = sessionAtCorrectPositions();
misplacedMaineSession.piecesById.maine.position.x -= geometry.medianStateDiagonal;
misplacedMaineSession.piecesById.maine.position.y += geometry.medianStateDiagonal;
const misplacedMaineEvaluation = evaluateMapReconstruction(misplacedMaineSession, region, geometry);
assert.equal(misplacedMaineEvaluation.placements.maine.status, MAP_RECONSTRUCTION_PLACEMENT_STATUSES.MISPLACED);

const missingSession = sessionAtCorrectPositions();
missingSession.piecesById["rhode-island"].position = null;
missingSession.piecesById["rhode-island"].placementStatus = "unplaced";
const missingEvaluation = evaluateMapReconstruction(missingSession, region, geometry);
assert.equal(missingEvaluation.placements["rhode-island"].status, MAP_RECONSTRUCTION_PLACEMENT_STATUSES.UNPLACED);
const missingSubmittedSession = submitMapReconstructionSession(missingSession, missingEvaluation);
assert.equal(missingSubmittedSession.piecesById["rhode-island"].submittedPosition, null);
const missingCorrectionStart = getMapReconstructionCorrectionStartPosition(
  missingSubmittedSession.piecesById["rhode-island"],
  geometry.piecesById["rhode-island"],
  geometry
);
assert.ok(missingCorrectionStart.x > 0 && missingCorrectionStart.x < geometry.workspace.width);
assert.ok(missingCorrectionStart.y > 0 && missingCorrectionStart.y < geometry.workspace.height);
const missingCorrectedSession = showMapReconstructionCorrectPlacement(missingSubmittedSession);
assert.deepEqual(
  missingCorrectedSession.piecesById["rhode-island"].position,
  geometry.piecesById["rhode-island"].correctPosition
);
assert.equal(
  restoreMapReconstructionSubmittedMap(missingCorrectedSession).piecesById["rhode-island"].position,
  null
);

const overlapSession = sessionAtCorrectPositions();
overlapSession.piecesById.connecticut.position = { ...overlapSession.piecesById.massachusetts.position };
const overlapEvaluation = evaluateMapReconstruction(overlapSession, region, geometry);
assert.ok(
  overlapEvaluation.placements.connecticut.overlapRatio > 0
    || overlapEvaluation.placements.massachusetts.overlapRatio > 0,
  "Overlapping pieces should be detected"
);

const outsideSession = sessionAtCorrectPositions();
outsideSession.piecesById.maine.position.x = geometry.workspace.width + geometry.piecesById.maine.width;
const outsideEvaluation = evaluateMapReconstruction(outsideSession, region, geometry);
assert.equal(outsideEvaluation.placements.maine.outsideWorkspace, true);
assert.equal(outsideEvaluation.placements.maine.status, MAP_RECONSTRUCTION_PLACEMENT_STATUSES.MISPLACED);

const adjacencyPairs = getMapReconstructionAdjacencyPairs(region);
assert.deepEqual(adjacencyPairs, [
  ["connecticut", "massachusetts"],
  ["connecticut", "rhode-island"],
  ["maine", "new-hampshire"],
  ["massachusetts", "new-hampshire"],
  ["massachusetts", "rhode-island"],
  ["massachusetts", "vermont"],
  ["new-hampshire", "vermont"]
]);

const resetSuccessfulSession = resetMapReconstructionSession(translatedSubmittedSession);
assert.equal(resetSuccessfulSession.phase, "arranging");
for (const stateId of region.stateIds) {
  assert.equal(resetSuccessfulSession.piecesById[stateId].position, null);
  assert.equal("submittedPosition" in resetSuccessfulSession.piecesById[stateId], false);
}

assert.match(uiSource, /mapReconstructionCompletedLayout/);
assert.match(uiSource, /map-reconstruction-success-shimmer/);
assert.match(uiSource, /repeatCount: MAP_RECONSTRUCTION_SUCCESS_TIMING\.shimmerRepeatCount/);
assert.match(uiSource, /class: "map-reconstruction-correction-move"/);
assert.match(uiSource, /repeatCount: 1/);
assert.match(uiSource, /completeMapReconstructionCorrection/);
assert.match(uiSource, /prepareMapReconstructionCorrectionReplay/);
assert.match(uiSource, /correctionReplayPauseMs/);
assert.match(uiSource, /prefers-reduced-motion: reduce/);
const mainePreview = getMapReconstructionDragPreviewLayout(
  geometry.piecesById.maine,
  { x: 0.75, y: 0.75 },
  { x: geometry.piecesById.maine.localBounds.minX, y: 0 }
);
assert.equal(mainePreview.width, geometry.piecesById.maine.width * 0.75);
assert.equal(mainePreview.height, geometry.piecesById.maine.height * 0.75);
assert.equal(mainePreview.grabOffsetX, 0);
assert.deepEqual(getMapReconstructionDefaultGrabAnchor(), { x: 0, y: 0 });
assert.match(uiSource, /createMapReconstructionDragPreview\(piece, workspaceSvg/);
assert.match(dragPreviewSource, /map-reconstruction-drag-proxy/);
assert.match(dragPreviewSource, /getMapReconstructionSvgScreenScale\(workspaceSvg\)/);
assert.doesNotMatch(dragPreviewSource, /viewBox: "0 0 120 84"/);
assert.match(stylesheet, /map-reconstruction-bank-piece\.is-dragging-source/);
assert.match(uiSource, /addEventListener\("dblclick"/);
assert.match(uiSource, /Select connected group/);
assert.match(uiSource, /Double-click a state to select all connected pieces\./);
assert.match(uiSource, /clearMapReconstructionSelection/);
assert.match(uiSource, /moveMapReconstructionSelectedPieces/);
assert.match(uiSource, /getMapReconstructionStatesIntersectingBounds/);
assert.match(uiSource, /map-reconstruction-marquee/);
assert.doesNotMatch(uiSource, /triple|detail\s*===\s*3/i);
assert.match(uiSource, /if \(moved\) \{[\s\S]*pointIsInsideElement[\s\S]*return;/);
assert.match(uiSource, /lostpointercapture/);
assert.match(uiSource, /keyEvent\.key === "Escape"/);
assert.match(stylesheet, /map-reconstruction-bank-thumbnail[\s\S]*touch-action:\s*none/);
assert.match(uiSource, /region\.completedLabelOffsets/);
assert.doesNotMatch(uiSource, /map-reconstruction-piece-hit-target/);
assert.match(uiSource, /isPointInMapReconstructionPiece/);
assert.match(stylesheet, /prefers-reduced-motion: reduce/);
assert.match(stylesheet, /map-reconstruction-correction-move/);
assert.match(stylesheet, /map-reconstruction-learner-layer\.is-completed/);
assert.match(stylesheet, /map-reconstruction-learner-layer\.is-corrected/);
assert.match(stylesheet, /\.map-reconstruction-actions\s*\{[^}]*overflow-x:\s*hidden;/s);
assert.match(stylesheet, /pointer-events: visiblePainted/);
assert.doesNotMatch(stylesheet, /map-reconstruction-piece-hit-target/);

const regions = listMapReconstructionRegions();
assert.deepEqual(regions.map((entry) => entry.id), [
  MAP_RECONSTRUCTION_REGION_IDS.REBUILD_NEW_ENGLAND,
  MAP_RECONSTRUCTION_REGION_IDS.REBUILD_MID_ATLANTIC,
  MAP_RECONSTRUCTION_REGION_IDS.REBUILD_SOUTHEAST_ATLANTIC,
  MAP_RECONSTRUCTION_REGION_IDS.REBUILD_GULF_COAST,
  MAP_RECONSTRUCTION_REGION_IDS.REBUILD_GREAT_LAKES,
  MAP_RECONSTRUCTION_REGION_IDS.REBUILD_UPPER_MIDWEST_PLAINS,
  MAP_RECONSTRUCTION_REGION_IDS.REBUILD_SOUTH_CENTRAL,
  MAP_RECONSTRUCTION_REGION_IDS.REBUILD_NORTHERN_ROCKIES,
  MAP_RECONSTRUCTION_REGION_IDS.REBUILD_SOUTHWEST,
  MAP_RECONSTRUCTION_REGION_IDS.REBUILD_PACIFIC_COAST
]);
assert.notStrictEqual(regions[0].stateIds, getMapReconstructionRegion(regions[0].id).stateIds);
const canonicalStates = unitedStatesAtlas.entities.filter((entity) => entity.kind === "state");
const contiguousStateIds = canonicalStates
  .map((state) => state.source.featureId)
  .filter((stateId) => !["alaska", "hawaii"].includes(stateId))
  .sort();
const reconstructionStateMemberships = regions.flatMap((entry) => entry.stateIds);
assert.equal(regions.length, 10);
assert.equal(reconstructionStateMemberships.length, 48);
assert.equal(new Set(reconstructionStateMemberships).size, 48);
assert.deepEqual([...new Set(reconstructionStateMemberships)].sort(), contiguousStateIds);
assert.equal(reconstructionStateMemberships.includes("alaska"), false);
assert.equal(reconstructionStateMemberships.includes("hawaii"), false);
assert.deepEqual(validateMapReconstructionCoverage(regions, contiguousStateIds), []);
const duplicateCoverageRegions = structuredClone(regions);
duplicateCoverageRegions[1].stateIds.push(duplicateCoverageRegions[0].stateIds[0]);
assert.ok(validateMapReconstructionCoverage(
  duplicateCoverageRegions,
  contiguousStateIds
).some((message) => message.includes("multiple reconstruction regions")));
const missingCoverageRegions = structuredClone(regions);
missingCoverageRegions[0].stateIds.pop();
assert.ok(validateMapReconstructionCoverage(
  missingCoverageRegions,
  contiguousStateIds
).some((message) => message.includes("missing from Map Reconstruction")));
regions.forEach((entry) => {
  assert.deepEqual(validateMapReconstructionRegion(entry), []);
  assert.ok(entry.title);
  assert.ok(entry.successMessage);
});
canonicalStates
  .filter((state) => contiguousStateIds.includes(state.source.featureId))
  .forEach((state) => {
    assert.match(audioManifest.chips?.[state.name] || "", /^assets\/audio\/chips\/.+\.mp3$/);
  });

const midAtlanticRegion = getMapReconstructionRegion(
  MAP_RECONSTRUCTION_REGION_IDS.REBUILD_MID_ATLANTIC
);
const midAtlanticStateIds = [
  "new-york",
  "pennsylvania",
  "new-jersey",
  "delaware",
  "maryland",
  "west-virginia",
  "virginia"
];
assert.deepEqual(validateMapReconstructionRegion(midAtlanticRegion), []);
assert.equal(midAtlanticRegion.title, "Rebuild the Mid-Atlantic");
assert.deepEqual(midAtlanticRegion.stateIds, midAtlanticStateIds);
assert.equal(new Set(midAtlanticRegion.stateIds).size, 7);
assert.equal(midAtlanticRegion.successMessage, "You rebuilt the Mid-Atlantic correctly.");

const midAtlanticGeometry = prepareMapReconstructionGeometry(featureCollection, midAtlanticRegion);
assert.deepEqual(midAtlanticGeometry.stateIds, midAtlanticStateIds);
assert.equal(midAtlanticGeometry.pieces.length, 7);
for (const stateId of midAtlanticStateIds) {
  const piece = midAtlanticGeometry.piecesById[stateId];
  assert.ok(piece?.path.startsWith("M"), `${stateId} should have prepared SVG geometry`);
  assert.ok(piece.correctBounds.minX >= 0 && piece.correctBounds.maxX <= midAtlanticGeometry.workspace.width);
  assert.ok(piece.correctBounds.minY >= 0 && piece.correctBounds.maxY <= midAtlanticGeometry.workspace.height);
}
assert.equal(midAtlanticGeometry.piecesById["new-york"].geometryType, "MultiPolygon");
assert.ok(midAtlanticGeometry.piecesById["new-york"].polygonCount > 1, "New York islands should be preserved");
assert.equal(midAtlanticGeometry.piecesById.delaware.geometryType, "MultiPolygon");
assert.equal(midAtlanticGeometry.piecesById["new-jersey"].geometryType, "MultiPolygon");

const delawareInteriorPoint = findPiecePoint(midAtlanticGeometry.piecesById.delaware, true);
const newJerseyInteriorPoint = findPiecePoint(midAtlanticGeometry.piecesById["new-jersey"], true);
assert.ok(delawareInteriorPoint);
assert.ok(newJerseyInteriorPoint);
assert.equal(isPointInMapReconstructionPiece(
  midAtlanticGeometry.piecesById.delaware,
  delawareInteriorPoint
), true);
assert.equal(isPointInMapReconstructionPiece(
  midAtlanticGeometry.piecesById["new-jersey"],
  newJerseyInteriorPoint
), true);
const midAtlanticHitEntries = midAtlanticStateIds.map((stateId) => ({
  stateId,
  piece: midAtlanticGeometry.piecesById[stateId],
  position: midAtlanticGeometry.piecesById[stateId].correctPosition
}));
const delawareGlobalPoint = {
  x: midAtlanticGeometry.piecesById.delaware.correctPosition.x + delawareInteriorPoint.x,
  y: midAtlanticGeometry.piecesById.delaware.correctPosition.y + delawareInteriorPoint.y
};
assert.equal(
  getTopmostMapReconstructionPieceAtPoint(midAtlanticHitEntries, delawareGlobalPoint),
  "delaware",
  "Delaware should be selected by its painted geometry"
);

const firstMidAtlanticSession = createMapReconstructionSession(
  midAtlanticRegion,
  midAtlanticGeometry,
  { random: createSeededMapReconstructionRandom(91) }
);
assert.deepEqual(
  firstMidAtlanticSession.bankOrder,
  sortMapReconstructionStateIdsByName(midAtlanticStateIds, midAtlanticGeometry)
);
assert.deepEqual(new Set(firstMidAtlanticSession.bankOrder), new Set(midAtlanticStateIds));
const firstMidAtlanticStateId = firstMidAtlanticSession.bankOrder[0];
const secondMidAtlanticStateId = firstMidAtlanticSession.bankOrder[1];
const firstMidAtlanticPlacement = findMapReconstructionAutomaticPlacement(
  firstMidAtlanticSession,
  firstMidAtlanticStateId,
  midAtlanticGeometry
);
const midAtlanticWithFirstPiece = placeMapReconstructionPiece(
  firstMidAtlanticSession,
  firstMidAtlanticStateId,
  firstMidAtlanticPlacement,
  midAtlanticGeometry
);
const secondMidAtlanticPlacement = findMapReconstructionAutomaticPlacement(
  midAtlanticWithFirstPiece,
  secondMidAtlanticStateId,
  midAtlanticGeometry
);
const midAtlanticWithTwoPieces = placeMapReconstructionPiece(
  midAtlanticWithFirstPiece,
  secondMidAtlanticStateId,
  secondMidAtlanticPlacement,
  midAtlanticGeometry
);
assert.notDeepEqual(secondMidAtlanticPlacement, firstMidAtlanticPlacement);
assert.equal(
  getMapReconstructionPieceRenderOrder(midAtlanticWithTwoPieces).at(-1),
  secondMidAtlanticStateId
);
assert.deepEqual(
  resetMapReconstructionSession(placeMapReconstructionPiece(
    firstMidAtlanticSession,
    "delaware",
    { x: 500, y: 420 },
    midAtlanticGeometry
  )).bankOrder,
  firstMidAtlanticSession.bankOrder
);

function midAtlanticSessionAtCorrectPositions(offset = { x: 0, y: 0 }) {
  const candidate = createMapReconstructionSession(
    midAtlanticRegion,
    midAtlanticGeometry,
    { random: createSeededMapReconstructionRandom(33) }
  );
  for (const stateId of midAtlanticStateIds) {
    candidate.piecesById[stateId].position = {
      x: candidate.piecesById[stateId].correctPosition.x + offset.x,
      y: candidate.piecesById[stateId].correctPosition.y + offset.y
    };
    candidate.piecesById[stateId].placementStatus = "placed";
    candidate.piecesById[stateId].hasMoved = true;
  }
  return candidate;
}

const midAtlanticCorrectEvaluation = evaluateMapReconstruction(
  midAtlanticSessionAtCorrectPositions(),
  midAtlanticRegion,
  midAtlanticGeometry
);
assert.equal(midAtlanticCorrectEvaluation.isComplete, true);
assert.equal(midAtlanticCorrectEvaluation.counts["well-placed"], 7);
const midAtlanticTranslatedEvaluation = evaluateMapReconstruction(
  midAtlanticSessionAtCorrectPositions({ x: 28, y: -22 }),
  midAtlanticRegion,
  midAtlanticGeometry
);
assert.equal(midAtlanticTranslatedEvaluation.alignment.applied, true);
assert.equal(midAtlanticTranslatedEvaluation.isComplete, true);

const midAtlanticImperfectSession = midAtlanticSessionAtCorrectPositions();
const midAtlanticNudge = midAtlanticGeometry.medianStateDiagonal * 0.04;
midAtlanticImperfectSession.piecesById.delaware.position.y += midAtlanticNudge;
midAtlanticImperfectSession.piecesById["new-jersey"].position.x += midAtlanticNudge;
assert.equal(
  evaluateMapReconstruction(
    midAtlanticImperfectSession,
    midAtlanticRegion,
    midAtlanticGeometry
  ).isComplete,
  true,
  "slightly imperfect Mid-Atlantic spacing should pass"
);

const swappedPennsylvaniaNewJersey = midAtlanticSessionAtCorrectPositions();
const pennsylvaniaPosition = swappedPennsylvaniaNewJersey.piecesById.pennsylvania.position;
swappedPennsylvaniaNewJersey.piecesById.pennsylvania.position =
  swappedPennsylvaniaNewJersey.piecesById["new-jersey"].position;
swappedPennsylvaniaNewJersey.piecesById["new-jersey"].position = pennsylvaniaPosition;
const swappedPennsylvaniaNewJerseyEvaluation = evaluateMapReconstruction(
  swappedPennsylvaniaNewJersey,
  midAtlanticRegion,
  midAtlanticGeometry
);
assert.equal(swappedPennsylvaniaNewJerseyEvaluation.isComplete, false);
assert.ok(swappedPennsylvaniaNewJerseyEvaluation.feedback.includes(
  "New Jersey belongs east of Pennsylvania."
));

const delawareNorthSession = midAtlanticSessionAtCorrectPositions();
delawareNorthSession.piecesById.delaware.position.y =
  delawareNorthSession.piecesById["new-jersey"].position.y - midAtlanticGeometry.medianStateDiagonal;
assert.ok(evaluateMapReconstruction(
  delawareNorthSession,
  midAtlanticRegion,
  midAtlanticGeometry
).feedback.includes("Delaware belongs south of New Jersey."));

const westVirginiaEastSession = midAtlanticSessionAtCorrectPositions();
westVirginiaEastSession.piecesById["west-virginia"].position.x =
  westVirginiaEastSession.piecesById.virginia.position.x + midAtlanticGeometry.medianStateDiagonal;
assert.ok(evaluateMapReconstruction(
  westVirginiaEastSession,
  midAtlanticRegion,
  midAtlanticGeometry
).feedback.includes("West Virginia belongs west of Virginia."));

const midAtlanticMissingSession = midAtlanticSessionAtCorrectPositions();
midAtlanticMissingSession.piecesById.delaware.position = null;
midAtlanticMissingSession.piecesById.delaware.placementStatus = "unplaced";
const midAtlanticMissingEvaluation = evaluateMapReconstruction(
  midAtlanticMissingSession,
  midAtlanticRegion,
  midAtlanticGeometry
);
assert.equal(midAtlanticMissingEvaluation.placements.delaware.status, "unplaced");
assert.ok(midAtlanticMissingEvaluation.feedback.includes("Delaware was not placed."));

assert.deepEqual(getMapReconstructionAdjacencyPairs(midAtlanticRegion), [
  ["delaware", "maryland"],
  ["delaware", "pennsylvania"],
  ["maryland", "pennsylvania"],
  ["maryland", "virginia"],
  ["maryland", "west-virginia"],
  ["new-jersey", "new-york"],
  ["new-jersey", "pennsylvania"],
  ["new-york", "pennsylvania"],
  ["pennsylvania", "west-virginia"],
  ["virginia", "west-virginia"]
]);

const addedRegionCases = [
  {
    id: MAP_RECONSTRUCTION_REGION_IDS.REBUILD_SOUTHEAST_ATLANTIC,
    stateIds: ["north-carolina", "south-carolina", "georgia", "florida"],
    swap: ["south-carolina", "georgia"],
    feedback: "South Carolina belongs between North Carolina and Georgia."
  },
  {
    id: MAP_RECONSTRUCTION_REGION_IDS.REBUILD_GULF_COAST,
    stateIds: ["alabama", "mississippi", "louisiana", "texas"],
    swap: ["louisiana", "mississippi"],
    feedback: "Mississippi belongs between Louisiana and Alabama."
  },
  {
    id: MAP_RECONSTRUCTION_REGION_IDS.REBUILD_GREAT_LAKES,
    stateIds: ["ohio", "michigan", "indiana", "illinois", "wisconsin"],
    swap: ["michigan", "ohio"],
    feedback: "Michigan belongs north of Indiana and Ohio."
  },
  {
    id: MAP_RECONSTRUCTION_REGION_IDS.REBUILD_UPPER_MIDWEST_PLAINS,
    stateIds: ["minnesota", "iowa", "missouri", "north-dakota", "south-dakota", "nebraska", "kansas"],
    swap: ["north-dakota", "south-dakota"],
    feedback: "North Dakota belongs north of South Dakota."
  },
  {
    id: MAP_RECONSTRUCTION_REGION_IDS.REBUILD_SOUTH_CENTRAL,
    stateIds: ["kentucky", "tennessee", "arkansas", "oklahoma"],
    swap: ["kentucky", "tennessee"],
    feedback: "Kentucky belongs north of Tennessee."
  },
  {
    id: MAP_RECONSTRUCTION_REGION_IDS.REBUILD_NORTHERN_ROCKIES,
    stateIds: ["montana", "idaho", "wyoming"],
    swap: ["idaho", "montana"],
    feedback: "Idaho belongs west of Montana and Wyoming."
  },
  {
    id: MAP_RECONSTRUCTION_REGION_IDS.REBUILD_SOUTHWEST,
    stateIds: ["colorado", "utah", "nevada", "arizona", "new-mexico"],
    swap: ["utah", "arizona"],
    feedback: "Utah belongs north of Arizona."
  },
  {
    id: MAP_RECONSTRUCTION_REGION_IDS.REBUILD_PACIFIC_COAST,
    stateIds: ["washington", "oregon", "california"],
    swap: ["washington", "oregon"],
    feedback: "Oregon belongs between Washington and California."
  }
];

function createPlacedRegionSession(regionEntry, regionGeometry, offset = { x: 0, y: 0 }) {
  const candidate = createMapReconstructionSession(regionEntry, regionGeometry, {
    random: createSeededMapReconstructionRandom(117)
  });
  regionEntry.stateIds.forEach((stateId) => {
    candidate.piecesById[stateId].position = {
      x: candidate.piecesById[stateId].correctPosition.x + offset.x,
      y: candidate.piecesById[stateId].correctPosition.y + offset.y
    };
    candidate.piecesById[stateId].placementStatus = "placed";
    candidate.piecesById[stateId].hasMoved = true;
  });
  return candidate;
}

for (const testCase of addedRegionCases) {
  const regionEntry = getMapReconstructionRegion(testCase.id);
  assert.deepEqual(regionEntry.stateIds, testCase.stateIds);
  const regionGeometry = prepareMapReconstructionGeometry(featureCollection, regionEntry);
  assert.equal(regionGeometry.pieces.length, testCase.stateIds.length);
  testCase.stateIds.forEach((stateId) => {
    assert.ok(canonicalStates.some((state) => state.source.featureId === stateId));
    assert.ok(regionGeometry.piecesById[stateId]?.path.startsWith("M"));
    assert.match(audioManifest.chips?.[regionGeometry.piecesById[stateId].name] || "", /^assets\/audio\/chips\/.+\.mp3$/);
  });

  const initialized = createMapReconstructionSession(regionEntry, regionGeometry, {
    random: createSeededMapReconstructionRandom(43)
  });
  assert.deepEqual(
    initialized.bankOrder,
    sortMapReconstructionStateIdsByName(regionEntry.stateIds, regionGeometry)
  );
  assert.deepEqual(new Set(initialized.bankOrder), new Set(regionEntry.stateIds));

  const translated = createPlacedRegionSession(regionEntry, regionGeometry, { x: 24, y: -18 });
  assert.equal(evaluateMapReconstruction(
    translated,
    regionEntry,
    regionGeometry
  ).isComplete, true, `${testCase.id} should accept a uniformly translated arrangement`);

  const imperfect = createPlacedRegionSession(regionEntry, regionGeometry);
  const imperfectStateId = regionEntry.stateIds.at(-1);
  imperfect.piecesById[imperfectStateId].position.x += regionGeometry.medianStateDiagonal * 0.025;
  imperfect.piecesById[imperfectStateId].position.y += regionGeometry.medianStateDiagonal * 0.02;
  assert.equal(evaluateMapReconstruction(
    imperfect,
    regionEntry,
    regionGeometry
  ).isComplete, true, `${testCase.id} should accept a slightly imperfect arrangement`);

  const swapped = createPlacedRegionSession(regionEntry, regionGeometry);
  const [firstSwapId, secondSwapId] = testCase.swap;
  const firstSwapPosition = swapped.piecesById[firstSwapId].position;
  swapped.piecesById[firstSwapId].position = swapped.piecesById[secondSwapId].position;
  swapped.piecesById[secondSwapId].position = firstSwapPosition;
  const swappedEvaluation = evaluateMapReconstruction(swapped, regionEntry, regionGeometry);
  assert.equal(swappedEvaluation.isComplete, false, `${testCase.id} should reject an obvious swap`);
  assert.ok(swappedEvaluation.feedback.includes(testCase.feedback), `${testCase.id} should provide focused feedback`);

  const missing = createPlacedRegionSession(regionEntry, regionGeometry);
  const missingStateId = regionEntry.stateIds[0];
  missing.piecesById[missingStateId].position = null;
  missing.piecesById[missingStateId].placementStatus = "unplaced";
  const missingEvaluation = evaluateMapReconstruction(missing, regionEntry, regionGeometry);
  assert.equal(missingEvaluation.isComplete, false);
  assert.equal(missingEvaluation.placements[missingStateId].status, "unplaced");

  const overlapping = createPlacedRegionSession(regionEntry, regionGeometry);
  const overlapStateId = regionEntry.stateIds[1];
  overlapping.piecesById[overlapStateId].position = {
    ...overlapping.piecesById[regionEntry.stateIds[0]].position
  };
  const overlapEvaluationForRegion = evaluateMapReconstruction(
    overlapping,
    regionEntry,
    regionGeometry
  );
  assert.equal(overlapEvaluationForRegion.isComplete, false);
  assert.ok(
    overlapEvaluationForRegion.placements[overlapStateId].overlapRatio > 0
      || overlapEvaluationForRegion.placements[regionEntry.stateIds[0]].overlapRatio > 0,
    `${testCase.id} should detect a gross overlap`
  );
}

const southeastRegion = getMapReconstructionRegion(
  MAP_RECONSTRUCTION_REGION_IDS.REBUILD_SOUTHEAST_ATLANTIC
);
const southeastGeometry = prepareMapReconstructionGeometry(featureCollection, southeastRegion);
const southeastWideLayout = getMapReconstructionInteractionLayout(
  southeastGeometry.workspace,
  { width: 1500, height: 650 },
  { insetCssPixels: 12 }
);
const southeastInteractionGeometry = {
  ...southeastGeometry,
  workspace: southeastWideLayout.workspace
};
const floridaPiece = southeastGeometry.piecesById.florida;
const southCarolinaPiece = southeastGeometry.piecesById["south-carolina"];
const oldFloridaRight = clampMapReconstructionPosition(
  { x: 100000, y: floridaPiece.correctPosition.y },
  floridaPiece,
  southeastGeometry.workspace
);
const visibleFloridaRight = clampMapReconstructionPosition(
  { x: 100000, y: floridaPiece.correctPosition.y },
  floridaPiece,
  southeastInteractionGeometry.workspace
);
const oldSouthCarolinaLeft = clampMapReconstructionPosition(
  { x: -100000, y: southCarolinaPiece.correctPosition.y },
  southCarolinaPiece,
  southeastGeometry.workspace
);
const visibleSouthCarolinaLeft = clampMapReconstructionPosition(
  { x: -100000, y: southCarolinaPiece.correctPosition.y },
  southCarolinaPiece,
  southeastInteractionGeometry.workspace
);
assert.ok(
  visibleFloridaRight.x > oldFloridaRight.x,
  "Southeast Atlantic Florida should reach farther right in the full visible workspace"
);
assert.ok(
  visibleSouthCarolinaLeft.x < oldSouthCarolinaLeft.x,
  "Southeast Atlantic South Carolina should reach farther left in the full visible workspace"
);
const southeastLeftOffset = southeastInteractionGeometry.workspace.x
  + southeastInteractionGeometry.workspace.dragPadding
  - southeastGeometry.combinedBounds.minX;
const southeastLeftArrangement = createPlacedRegionSession(
  southeastRegion,
  southeastGeometry,
  { x: southeastLeftOffset, y: 0 }
);
assert.equal(
  evaluateMapReconstruction(
    southeastLeftArrangement,
    southeastRegion,
    southeastInteractionGeometry
  ).isComplete,
  true,
  "translation-tolerant evaluation should accept a correct map built in the expanded workspace"
);
const southeastAutomaticSession = createMapReconstructionSession(
  southeastRegion,
  southeastGeometry,
  { random: createSeededMapReconstructionRandom(91) }
);
const southeastAutomaticPosition = findMapReconstructionAutomaticPlacement(
  southeastAutomaticSession,
  "florida",
  southeastInteractionGeometry
);
assert.deepEqual(
  clampMapReconstructionPosition(
    southeastAutomaticPosition,
    floridaPiece,
    southeastInteractionGeometry.workspace
  ),
  southeastAutomaticPosition,
  "automatic placement should use the active visible workspace bounds"
);

const greatLakesGeometry = prepareMapReconstructionGeometry(
  featureCollection,
  getMapReconstructionRegion(MAP_RECONSTRUCTION_REGION_IDS.REBUILD_GREAT_LAKES)
);
assert.equal(greatLakesGeometry.piecesById.michigan.geometryType, "MultiPolygon");
assert.ok(greatLakesGeometry.piecesById.michigan.polygonCount > 1);

assert.match(stylesheet, /map-reconstruction-region-selection/);
assert.match(stylesheet, /map-reconstruction-region-list/);
assert.match(runtimeSource, /activeMapReconstructionRegionId/);
assert.match(runtimeSource, /listMapReconstructionRegions/);
assert.match(uiSource, /createChipSpeakerControl/);
assert.match(ttsGeneratorSource, /listMapReconstructionRegions/);
assert.match(ttsGeneratorSource, /mapReconstructionInstructionPhrases/);
for (const stateName of [
  "New York",
  "Pennsylvania",
  "New Jersey",
  "Delaware",
  "Maryland",
  "West Virginia",
  "Virginia"
]) {
  assert.match(audioManifest.chips?.[stateName] || "", /^assets\/audio\/chips\/.+\.mp3$/);
}

console.log("Map Reconstruction validation passed.");
