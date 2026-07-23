import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  MAP_RECONSTRUCTION_REGION_IDS,
  getMapReconstructionRegion,
  validateMapReconstructionRegion
} from "../src/atlas/map-reconstruction-regions.js";
import {
  getMapReconstructionThumbnailTransform,
  getTopmostMapReconstructionPieceAtPoint,
  isPointInMapReconstructionPiece,
  prepareMapReconstructionGeometry
} from "../src/atlas/map-reconstruction-geometry.js";
import {
  completeMapReconstructionCorrection,
  createMapReconstructionSession,
  createSeededMapReconstructionRandom,
  moveMapReconstructionPieceByKeyboard,
  placeMapReconstructionPiece,
  prepareMapReconstructionCorrectionReplay,
  resetMapReconstructionSession,
  restoreMapReconstructionSubmittedMap,
  returnMapReconstructionPieceToBank,
  setMapReconstructionViewMode,
  showMapReconstructionCorrectPlacement,
  submitMapReconstructionSession
} from "../src/atlas/map-reconstruction-engine.js";
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
  getMapReconstructionSuccessViewBox,
  mapClientPointToReconstructionWorkspace,
  shouldRenderMapReconstructionCorrectLayout
} from "../src/atlas/map-reconstruction-ui.js";

const featureCollection = JSON.parse((await readFile(
  new URL("../assets/maps/data/maplibre-us-states-atlas.geojson", import.meta.url),
  "utf8"
)).replace(/^\uFEFF/, ""));
const [indexHtml, runtimeSource, uiSource, stylesheet] = await Promise.all([
  readFile(new URL("../index.html", import.meta.url), "utf8"),
  readFile(new URL("../src/maplibre-poc.js", import.meta.url), "utf8"),
  readFile(new URL("../src/atlas/map-reconstruction-ui.js", import.meta.url), "utf8"),
  readFile(new URL("../maplibre-poc.css", import.meta.url), "utf8")
]);
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
assert.notDeepEqual(firstSession.bankOrder, region.stateIds);
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
const returnedSession = returnMapReconstructionPieceToBank(placedSession, "maine");
assert.equal(returnedSession.piecesById.maine.position, null);
assert.deepEqual(resetMapReconstructionSession(placedSession).bankOrder, firstSession.bankOrder);
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
assert.match(uiSource, /map-reconstruction-drag-proxy.*proxy\.remove/s);
assert.match(uiSource, /MAP_RECONSTRUCTION_COMPLETED_LABEL_OFFSETS/);
assert.doesNotMatch(uiSource, /map-reconstruction-piece-hit-target/);
assert.match(uiSource, /isPointInMapReconstructionPiece/);
assert.match(stylesheet, /prefers-reduced-motion: reduce/);
assert.match(stylesheet, /map-reconstruction-correction-move/);
assert.match(stylesheet, /map-reconstruction-learner-layer\.is-completed/);
assert.match(stylesheet, /map-reconstruction-learner-layer\.is-corrected/);
assert.match(stylesheet, /\.map-reconstruction-actions\s*\{[^}]*overflow-x:\s*hidden;/s);
assert.match(stylesheet, /pointer-events: visiblePainted/);
assert.doesNotMatch(stylesheet, /map-reconstruction-piece-hit-target/);

console.log("Map Reconstruction validation passed.");
