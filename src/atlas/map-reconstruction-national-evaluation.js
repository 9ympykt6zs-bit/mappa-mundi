import { getStateById } from "./united-states-atlas-queries.js";
import {
  getMapReconstructionAdjacencyPairs,
  MAP_RECONSTRUCTION_PLACEMENT_STATUSES
} from "./map-reconstruction-evaluation.js";
import { listMapReconstructionRegions } from "./map-reconstruction-regions.js";

const SOFT_POINT_CONTACTS = new Set([
  "arizona:colorado",
  "new-mexico:utah"
]);

function clamp(value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, value));
}

function median(values) {
  if (!values.length) return 0;
  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2
    ? sorted[middle]
    : (sorted[middle - 1] + sorted[middle]) / 2;
}

function pairKey(leftId, rightId) {
  return [leftId, rightId].sort().join(":");
}

function boundsAt(piece, position) {
  return {
    minX: position.x + piece.localBounds.minX,
    minY: position.y + piece.localBounds.minY,
    maxX: position.x + piece.localBounds.maxX,
    maxY: position.y + piece.localBounds.maxY
  };
}

function boundsOverlapRatio(left, right) {
  const width = Math.max(0, Math.min(left.maxX, right.maxX) - Math.max(left.minX, right.minX));
  const height = Math.max(0, Math.min(left.maxY, right.maxY) - Math.max(left.minY, right.minY));
  const leftArea = Math.max(1, (left.maxX - left.minX) * (left.maxY - left.minY));
  const rightArea = Math.max(1, (right.maxX - right.minX) * (right.maxY - right.minY));
  return width * height / Math.min(leftArea, rightArea);
}

function minimumOutlineDistance(leftPiece, leftPosition, rightPiece, rightPosition) {
  let minimum = Infinity;
  for (const [leftX, leftY] of leftPiece.outlineSamples) {
    for (const [rightX, rightY] of rightPiece.outlineSamples) {
      minimum = Math.min(minimum, Math.hypot(
        leftX + leftPosition.x - rightX - rightPosition.x,
        leftY + leftPosition.y - rightY - rightPosition.y
      ));
    }
  }
  return Number.isFinite(minimum) ? minimum : Infinity;
}

function getNormalization(session, capstone) {
  const placed = capstone.stateIds
    .map((stateId) => session.piecesById[stateId])
    .filter((piece) => piece?.position);
  const settings = capstone.evaluation;
  const translationApplied = placed.length >= settings.translationMinimumPieces;
  const learnerCenter = {
    x: median(placed.map((piece) => piece.position.x)),
    y: median(placed.map((piece) => piece.position.y))
  };
  const correctCenter = {
    x: median(placed.map((piece) => piece.correctPosition.x)),
    y: median(placed.map((piece) => piece.correctPosition.y))
  };
  let scale = 1;
  if (placed.length >= settings.scaleMinimumPieces) {
    const ratios = placed.flatMap((piece) => {
      const expected = Math.hypot(
        piece.correctPosition.x - correctCenter.x,
        piece.correctPosition.y - correctCenter.y
      );
      if (expected < 1) return [];
      return [Math.hypot(
        piece.position.x - learnerCenter.x,
        piece.position.y - learnerCenter.y
      ) / expected];
    });
    scale = clamp(
      median(ratios) || 1,
      settings.minimumScaleRatio,
      settings.maximumScaleRatio
    );
  }
  return {
    translationApplied,
    scaleApplied: placed.length >= settings.scaleMinimumPieces,
    learnerCenter,
    correctCenter,
    scale
  };
}

function normalizePosition(position, normalization) {
  if (!position) return null;
  if (!normalization.translationApplied) return { ...position };
  return {
    x: normalization.correctCenter.x
      + (position.x - normalization.learnerCenter.x) / normalization.scale,
    y: normalization.correctCenter.y
      + (position.y - normalization.learnerCenter.y) / normalization.scale
  };
}

function getCanonicalAdjacency(capstone, geometry) {
  const referenceScale = Math.max(1, geometry.medianStateDiagonal);
  const hardPairs = [];
  const softPairs = [];
  const excludedGapPairs = [];
  for (const pair of getMapReconstructionAdjacencyPairs(capstone)) {
    const [leftId, rightId] = pair;
    const key = pairKey(leftId, rightId);
    if (SOFT_POINT_CONTACTS.has(key)) {
      softPairs.push(pair);
      continue;
    }
    const gap = minimumOutlineDistance(
      geometry.piecesById[leftId],
      geometry.piecesById[leftId].correctPosition,
      geometry.piecesById[rightId],
      geometry.piecesById[rightId].correctPosition
    );
    if (gap > referenceScale * 0.08) excludedGapPairs.push(pair);
    else hardPairs.push(pair);
  }
  return { hardPairs, softPairs, excludedGapPairs };
}

function getPairCredibility(pair, normalizedPositions, session, geometry, referenceScale) {
  const [leftId, rightId] = pair;
  const left = normalizedPositions[leftId];
  const right = normalizedPositions[rightId];
  if (!left || !right) return false;
  const expected = {
    x: session.piecesById[rightId].correctPosition.x - session.piecesById[leftId].correctPosition.x,
    y: session.piecesById[rightId].correctPosition.y - session.piecesById[leftId].correctPosition.y
  };
  const actual = { x: right.x - left.x, y: right.y - left.y };
  const vectorError = Math.hypot(actual.x - expected.x, actual.y - expected.y) / referenceScale;
  const currentGap = minimumOutlineDistance(
    geometry.piecesById[leftId],
    left,
    geometry.piecesById[rightId],
    right
  );
  const expectedGap = minimumOutlineDistance(
    geometry.piecesById[leftId],
    geometry.piecesById[leftId].correctPosition,
    geometry.piecesById[rightId],
    geometry.piecesById[rightId].correctPosition
  );
  return vectorError <= 0.42 && currentGap <= expectedGap + referenceScale * 0.12;
}

function getLargestComponent(stateIds, crediblePairs) {
  const neighbors = new Map(stateIds.map((stateId) => [stateId, []]));
  crediblePairs.forEach(([leftId, rightId]) => {
    neighbors.get(leftId)?.push(rightId);
    neighbors.get(rightId)?.push(leftId);
  });
  let largest = 0;
  const visited = new Set();
  for (const stateId of stateIds) {
    if (visited.has(stateId)) continue;
    const stack = [stateId];
    let size = 0;
    while (stack.length) {
      const current = stack.pop();
      if (visited.has(current)) continue;
      visited.add(current);
      size += 1;
      stack.push(...(neighbors.get(current) || []));
    }
    largest = Math.max(largest, size);
  }
  return largest;
}

function getRegionalStructureScore(normalizedPositions, session, regions, referenceScale) {
  const regionCenters = regions.map((region) => {
    const placed = region.stateIds.filter((stateId) => normalizedPositions[stateId]);
    if (!placed.length) return null;
    return {
      id: region.id,
      actual: {
        x: placed.reduce((sum, stateId) => sum + normalizedPositions[stateId].x, 0) / placed.length,
        y: placed.reduce((sum, stateId) => sum + normalizedPositions[stateId].y, 0) / placed.length
      },
      expected: {
        x: placed.reduce((sum, stateId) => sum + session.piecesById[stateId].correctPosition.x, 0) / placed.length,
        y: placed.reduce((sum, stateId) => sum + session.piecesById[stateId].correctPosition.y, 0) / placed.length
      }
    };
  }).filter(Boolean);
  if (regionCenters.length < 2) return 0;
  const errors = [];
  for (let leftIndex = 0; leftIndex < regionCenters.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < regionCenters.length; rightIndex += 1) {
      const left = regionCenters[leftIndex];
      const right = regionCenters[rightIndex];
      errors.push(Math.hypot(
        (right.actual.x - left.actual.x) - (right.expected.x - left.expected.x),
        (right.actual.y - left.actual.y) - (right.expected.y - left.expected.y)
      ) / referenceScale);
    }
  }
  return Math.round(100 * Math.max(0, 1 - median(errors) / 1.4));
}

export function evaluateLower48Reconstruction(session, capstone, geometry, options = {}) {
  if (!session || !capstone || !geometry || session.regionId !== capstone.id) return null;
  const startedAt = typeof performance === "object" ? performance.now() : Date.now();
  const regions = options.regions || listMapReconstructionRegions();
  const referenceScale = Math.max(1, geometry.medianStateDiagonal);
  const normalization = getNormalization(session, capstone);
  const normalizedPositions = Object.fromEntries(capstone.stateIds.map((stateId) => [
    stateId,
    normalizePosition(session.piecesById[stateId]?.position, normalization)
  ]));
  const { hardPairs, softPairs, excludedGapPairs } = getCanonicalAdjacency(capstone, geometry);
  const crediblePairs = hardPairs.filter((pair) => (
    getPairCredibility(pair, normalizedPositions, session, geometry, referenceScale)
  ));
  const credibleById = Object.fromEntries(capstone.stateIds.map((stateId) => [stateId, 0]));
  const expectedById = Object.fromEntries(capstone.stateIds.map((stateId) => [stateId, 0]));
  hardPairs.forEach(([leftId, rightId]) => {
    expectedById[leftId] += 1;
    expectedById[rightId] += 1;
  });
  crediblePairs.forEach(([leftId, rightId]) => {
    credibleById[leftId] += 1;
    credibleById[rightId] += 1;
  });

  const overlapById = Object.fromEntries(capstone.stateIds.map((stateId) => [stateId, 0]));
  const falseContacts = [];
  for (let leftIndex = 0; leftIndex < capstone.stateIds.length; leftIndex += 1) {
    const leftId = capstone.stateIds[leftIndex];
    const leftPosition = normalizedPositions[leftId];
    if (!leftPosition) continue;
    for (let rightIndex = leftIndex + 1; rightIndex < capstone.stateIds.length; rightIndex += 1) {
      const rightId = capstone.stateIds[rightIndex];
      const rightPosition = normalizedPositions[rightId];
      if (!rightPosition) continue;
      const overlap = boundsOverlapRatio(
        boundsAt(geometry.piecesById[leftId], leftPosition),
        boundsAt(geometry.piecesById[rightId], rightPosition)
      );
      const expectedOverlap = boundsOverlapRatio(
        boundsAt(geometry.piecesById[leftId], geometry.piecesById[leftId].correctPosition),
        boundsAt(geometry.piecesById[rightId], geometry.piecesById[rightId].correctPosition)
      );
      const excessOverlap = Math.max(0, overlap - expectedOverlap);
      if (excessOverlap > 0.22) {
        overlapById[leftId] = Math.max(overlapById[leftId], excessOverlap);
        overlapById[rightId] = Math.max(overlapById[rightId], excessOverlap);
      } else if (excessOverlap > 0.04
        && !hardPairs.some((pair) => pairKey(...pair) === pairKey(leftId, rightId))
        && !softPairs.some((pair) => pairKey(...pair) === pairKey(leftId, rightId))) {
        falseContacts.push([leftId, rightId]);
      }
    }
  }

  const placements = {};
  for (const stateId of capstone.stateIds) {
    const pieceState = session.piecesById[stateId];
    const position = normalizedPositions[stateId];
    if (!position) {
      placements[stateId] = {
        stateId,
        status: MAP_RECONSTRUCTION_PLACEMENT_STATUSES.UNPLACED,
        distanceRatio: null,
        adjacencyRatio: 0,
        overlapRatio: 0,
        outsideWorkspace: false
      };
      continue;
    }
    const distanceRatio = Math.hypot(
      position.x - pieceState.correctPosition.x,
      position.y - pieceState.correctPosition.y
    ) / referenceScale;
    const adjacencyRatio = expectedById[stateId]
      ? credibleById[stateId] / expectedById[stateId]
      : 1;
    const bounds = boundsAt(geometry.piecesById[stateId], pieceState.position);
    const outsideWorkspace = bounds.minX < 0 || bounds.minY < 0
      || bounds.maxX > geometry.workspace.width
      || bounds.maxY > geometry.workspace.height;
    let status = MAP_RECONSTRUCTION_PLACEMENT_STATUSES.CLOSE;
    if (distanceRatio > 0.6 || adjacencyRatio < 0.6 || overlapById[stateId] > 0.22 || outsideWorkspace) {
      status = MAP_RECONSTRUCTION_PLACEMENT_STATUSES.MISPLACED;
    } else if (distanceRatio <= 0.25 && adjacencyRatio >= 0.85) {
      status = MAP_RECONSTRUCTION_PLACEMENT_STATUSES.WELL_PLACED;
    }
    placements[stateId] = {
      stateId,
      status,
      distanceRatio,
      adjacencyRatio,
      overlapRatio: overlapById[stateId],
      outsideWorkspace
    };
  }

  const counts = Object.values(MAP_RECONSTRUCTION_PLACEMENT_STATUSES).reduce((result, status) => {
    result[status] = Object.values(placements).filter((placement) => placement.status === status).length;
    return result;
  }, {});
  const placedCount = capstone.stateIds.length - counts.unplaced;
  const placementScore = Math.round(100 * (
    counts["well-placed"] + counts.close * 0.55
  ) / capstone.stateIds.length);
  const adjacencyScore = hardPairs.length
    ? Math.round(100 * crediblePairs.length / hardPairs.length)
    : 0;
  const regionalStructureScore = getRegionalStructureScore(
    normalizedPositions,
    session,
    regions,
    referenceScale
  );
  const severeOverlapCount = Object.values(overlapById).filter((ratio) => ratio > 0.22).length;
  const outsideCount = Object.values(placements).filter((placement) => placement.outsideWorkspace).length;
  const integrityScore = Math.round(100 * clamp(
    1 - severeOverlapCount / 12 - outsideCount / 8 - falseContacts.length / 30,
    0,
    1
  ));
  const settings = capstone.evaluation;
  const score = Math.round(
    placementScore * settings.placementWeight
    + adjacencyScore * settings.adjacencyWeight
    + regionalStructureScore * settings.regionalStructureWeight
    + integrityScore * settings.integrityWeight
  );
  const largestConnectedComponent = getLargestComponent(
    capstone.stateIds.filter((stateId) => normalizedPositions[stateId]),
    crediblePairs
  );
  const isComplete = placedCount === capstone.stateIds.length
    && counts.misplaced === 0
    && score >= settings.successScore
    && adjacencyScore >= settings.successAdjacency
    && regionalStructureScore >= settings.successRegionalStructure
    && severeOverlapCount === 0
    && outsideCount === 0
    && largestConnectedComponent >= settings.successLargestComponent;

  const priorities = [];
  capstone.stateIds.filter((stateId) => placements[stateId].status === "unplaced").slice(0, 2)
    .forEach((stateId) => priorities.push(`${getStateById(stateId)?.name || stateId} is still unplaced.`));
  capstone.stateIds.filter((stateId) => placements[stateId].overlapRatio > 0.22).slice(0, 2)
    .forEach((stateId) => priorities.push(`${getStateById(stateId)?.name || stateId} overlaps another state too much.`));
  capstone.stateIds
    .filter((stateId) => placements[stateId].status === "misplaced"
      && placements[stateId].overlapRatio <= 0.22
      && !placements[stateId].outsideWorkspace)
    .sort((leftId, rightId) => placements[rightId].distanceRatio - placements[leftId].distanceRatio)
    .slice(0, 5)
    .forEach((stateId) => priorities.push(`${getStateById(stateId)?.name || stateId} needs a larger position correction.`));
  if (adjacencyScore < 90) priorities.push("Reconnect neighboring states before refining small gaps.");
  if (regionalStructureScore < 90) priorities.push("Check how the ten regional groups fit together.");
  if (!priorities.length) priorities.push("The national structure is correct.");

  const finishedAt = typeof performance === "object" ? performance.now() : Date.now();
  return {
    regionId: capstone.id,
    normalization,
    placements,
    counts,
    scores: {
      overall: score,
      placement: placementScore,
      adjacency: adjacencyScore,
      regionalStructure: regionalStructureScore,
      integrity: integrityScore
    },
    adjacency: {
      hardPairs,
      softPairs,
      excludedGapPairs,
      crediblePairs,
      largestConnectedComponent
    },
    integrity: {
      severeOverlapCount,
      outsideCount,
      falseContacts
    },
    feedback: priorities.slice(0, 5),
    isComplete,
    durationMs: finishedAt - startedAt
  };
}
