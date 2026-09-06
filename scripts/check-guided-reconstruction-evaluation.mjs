import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  MAP_RECONSTRUCTION_PLACEMENT_STATUSES,
  evaluateGuidedMapReconstruction,
  evaluateMapReconstruction
} from "../src/atlas/map-reconstruction-evaluation.js";
import { getMapReconstructionRegion, MAP_RECONSTRUCTION_REGION_IDS } from "../src/atlas/map-reconstruction-regions.js";
import { prepareMapReconstructionGeometry } from "../src/atlas/map-reconstruction-geometry.js";
import { createMapReconstructionSession } from "../src/atlas/map-reconstruction-engine.js";

const featureCollection = JSON.parse((await readFile(
  new URL("../assets/maps/data/maplibre-us-states-atlas.geojson", import.meta.url),
  "utf8"
)).replace(/^\uFEFF/, ""));

const sourceRegion = getMapReconstructionRegion(MAP_RECONSTRUCTION_REGION_IDS.REBUILD_MID_ATLANTIC);
const lockedStateIds = ["new-york"];
const newStateIds = sourceRegion.stateIds.filter((stateId) => !lockedStateIds.includes(stateId));
const geometryRegion = { ...sourceRegion, stateIds: sourceRegion.stateIds };
const guidedRegion = { ...sourceRegion, stateIds: newStateIds };
const geometry = prepareMapReconstructionGeometry(featureCollection, geometryRegion);
const evaluationGeometry = {
  ...geometry,
  workspace: {
    ...geometry.workspace,
    width: geometry.workspace.width + 320,
    height: geometry.workspace.height + 220
  }
};

function sessionAtPositions(offset = { x: 0, y: 0 }, missingStateId = null) {
  const session = createMapReconstructionSession(guidedRegion, geometry);
  for (const stateId of newStateIds) {
    if (stateId === missingStateId) continue;
    const correct = geometry.piecesById[stateId].correctPosition;
    session.piecesById[stateId].position = {
      x: correct.x + offset.x,
      y: correct.y + offset.y
    };
  }
  return session;
}

const correctSession = sessionAtPositions();
const originalSession = structuredClone(correctSession);
const originalRegion = structuredClone(guidedRegion);
const originalGeometry = structuredClone(evaluationGeometry);
const correctEvaluation = evaluateGuidedMapReconstruction(
  correctSession,
  guidedRegion,
  evaluationGeometry,
  lockedStateIds
);
assert.equal(correctEvaluation.counts[MAP_RECONSTRUCTION_PLACEMENT_STATUSES.WELL_PLACED], newStateIds.length);
assert.equal(correctEvaluation.isComplete, true);
assert.deepEqual(correctSession, originalSession, "guided evaluation must not mutate the session");
assert.deepEqual(guidedRegion, originalRegion, "guided evaluation must not mutate the region");
assert.deepEqual(evaluationGeometry, originalGeometry, "guided evaluation must not mutate geometry");
assert.equal(correctEvaluation.placements[lockedStateIds[0]], undefined, "locked anchors cannot emit scored placements");

const overlapSession = sessionAtPositions();
overlapSession.piecesById["new-jersey"].position = {
  ...evaluationGeometry.piecesById["new-york"].correctPosition
};
const overlapEvaluation = evaluateGuidedMapReconstruction(
  overlapSession,
  guidedRegion,
  evaluationGeometry,
  lockedStateIds
);
assert.equal(
  overlapEvaluation.placements["new-jersey"].status,
  MAP_RECONSTRUCTION_PLACEMENT_STATUSES.MISPLACED,
  "new pieces must be evaluated for overlap against locked anchors"
);

assert.ok(overlapEvaluation.placements["new-jersey"].overlapRatio > 0, "Overlap is measured against the locked New York shape.");

const gapSession = sessionAtPositions();
gapSession.piecesById["new-jersey"].position = {
  x: evaluationGeometry.piecesById["new-jersey"].correctPosition.x + 110,
  y: evaluationGeometry.piecesById["new-jersey"].correctPosition.y
};
const gapEvaluation = evaluateGuidedMapReconstruction(
  gapSession,
  guidedRegion,
  evaluationGeometry,
  lockedStateIds
);
assert.ok(
  gapEvaluation.placements["new-jersey"].adjacencyErrorRatio > 0,
  "new pieces must be evaluated for adjacency against locked anchors"
);

const shiftedEvaluation = evaluateGuidedMapReconstruction(
  sessionAtPositions({ x: 180, y: 120 }),
  guidedRegion,
  evaluationGeometry,
  lockedStateIds
);
assert.ok(
  shiftedEvaluation.counts[MAP_RECONSTRUCTION_PLACEMENT_STATUSES.MISPLACED] > 0,
  "a translated new cluster must fail against its locked frame"
);
assert.equal(shiftedEvaluation.alignment.applied, false);
assert.equal(shiftedEvaluation.isComplete, false);
assert.ok(Object.values(shiftedEvaluation.placements).every(({ outsideWorkspace }) => !outsideWorkspace), "Shift rejection is not an out-of-workspace failure.");
const shiftedStandaloneSubset = evaluateMapReconstruction(sessionAtPositions({ x: 180, y: 120 }), guidedRegion, evaluationGeometry);
assert.equal(shiftedStandaloneSubset.isComplete, true, "The same new cluster still passes standalone translation-tolerant scoring.");

const missingEvaluation = evaluateGuidedMapReconstruction(
  sessionAtPositions({ x: 0, y: 0 }, newStateIds[0]),
  guidedRegion,
  evaluationGeometry,
  lockedStateIds
);
assert.equal(
  missingEvaluation.placements[newStateIds[0]].status,
  MAP_RECONSTRUCTION_PLACEMENT_STATUSES.UNPLACED
);

const standaloneTranslated = evaluateMapReconstruction(
  (() => {
    const session = createMapReconstructionSession(sourceRegion, evaluationGeometry);
    for (const stateId of sourceRegion.stateIds) {
      const correct = evaluationGeometry.piecesById[stateId].correctPosition;
      session.piecesById[stateId].position = { x: correct.x + 70, y: correct.y - 45 };
    }
    return session;
  })(),
  sourceRegion,
  evaluationGeometry
);
assert.equal(standaloneTranslated.alignment.applied, true, "standalone translation normalization must remain intact");
assert.equal(standaloneTranslated.isComplete, true);

console.log("Guided reconstruction evaluation checks passed.");
