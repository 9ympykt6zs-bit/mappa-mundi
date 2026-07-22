import { getBorderingStates, getStateById } from "./united-states-atlas-queries.js";
import { isPointInMapReconstructionPiece } from "./map-reconstruction-geometry.js";

export const MAP_RECONSTRUCTION_PLACEMENT_STATUSES = Object.freeze({
  WELL_PLACED: "well-placed",
  CLOSE: "close",
  MISPLACED: "misplaced",
  UNPLACED: "unplaced"
});

function median(values) {
  if (!values.length) return 0;
  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2
    ? sorted[middle]
    : (sorted[middle - 1] + sorted[middle]) / 2;
}

function distance(left, right) {
  return Math.hypot(left.x - right.x, left.y - right.y);
}

function positionBounds(piece, position) {
  return {
    minX: position.x + piece.localBounds.minX,
    minY: position.y + piece.localBounds.minY,
    maxX: position.x + piece.localBounds.maxX,
    maxY: position.y + piece.localBounds.maxY
  };
}

function getIntersection(left, right) {
  const intersection = {
    minX: Math.max(left.minX, right.minX),
    minY: Math.max(left.minY, right.minY),
    maxX: Math.min(left.maxX, right.maxX),
    maxY: Math.min(left.maxY, right.maxY)
  };
  return intersection.maxX > intersection.minX && intersection.maxY > intersection.minY
    ? intersection
    : null;
}

function estimateOverlapRatio(leftPiece, leftPosition, rightPiece, rightPosition, sampleStep) {
  const intersection = getIntersection(
    positionBounds(leftPiece, leftPosition),
    positionBounds(rightPiece, rightPosition)
  );
  if (!intersection) return 0;
  let overlapArea = 0;
  for (let y = intersection.minY + sampleStep / 2; y < intersection.maxY; y += sampleStep) {
    for (let x = intersection.minX + sampleStep / 2; x < intersection.maxX; x += sampleStep) {
      const inLeft = isPointInMapReconstructionPiece(leftPiece, {
        x: x - leftPosition.x,
        y: y - leftPosition.y
      });
      if (!inLeft) continue;
      const inRight = isPointInMapReconstructionPiece(rightPiece, {
        x: x - rightPosition.x,
        y: y - rightPosition.y
      });
      if (inRight) overlapArea += sampleStep * sampleStep;
    }
  }
  return overlapArea / Math.max(1, Math.min(leftPiece.area, rightPiece.area));
}

function minimumOutlineDistance(leftPiece, leftPosition, rightPiece, rightPosition) {
  let minimum = Infinity;
  for (const [leftX, leftY] of leftPiece.outlineSamples) {
    const x1 = leftX + leftPosition.x;
    const y1 = leftY + leftPosition.y;
    for (const [rightX, rightY] of rightPiece.outlineSamples) {
      minimum = Math.min(minimum, Math.hypot(
        x1 - rightX - rightPosition.x,
        y1 - rightY - rightPosition.y
      ));
    }
  }
  return Number.isFinite(minimum) ? minimum : 0;
}

export function getMapReconstructionAdjacencyPairs(region) {
  const includedIds = new Set(region?.stateIds || []);
  const pairs = [];
  for (const stateId of includedIds) {
    for (const neighbor of getBorderingStates(stateId)) {
      if (!includedIds.has(neighbor.id) || stateId >= neighbor.id) continue;
      pairs.push([stateId, neighbor.id]);
    }
  }
  return pairs.sort((left, right) => left.join(":").localeCompare(right.join(":")));
}

function getAlignmentOffset(session, region) {
  const placed = region.stateIds
    .map((stateId) => session.piecesById[stateId])
    .filter((piece) => piece?.position);
  const minimumPieces = region.evaluation.alignmentMinimumPieces || Math.ceil(region.stateIds.length / 2);
  if (placed.length < minimumPieces) return { x: 0, y: 0, applied: false };
  return {
    x: median(placed.map((piece) => piece.position.x - piece.correctPosition.x)),
    y: median(placed.map((piece) => piece.position.y - piece.correctPosition.y)),
    applied: true
  };
}

function getAlignedPositions(session, region, alignment) {
  return Object.fromEntries(region.stateIds.map((stateId) => {
    const position = session.piecesById[stateId]?.position;
    return [stateId, position ? {
      x: position.x - alignment.x,
      y: position.y - alignment.y
    } : null];
  }));
}

function getPairVectorErrors(stateId, alignedPositions, session, region, referenceScale) {
  const current = alignedPositions[stateId];
  if (!current) return [];
  return region.stateIds.flatMap((otherId) => {
    if (otherId === stateId || !alignedPositions[otherId]) return [];
    const expected = {
      x: session.piecesById[otherId].correctPosition.x - session.piecesById[stateId].correctPosition.x,
      y: session.piecesById[otherId].correctPosition.y - session.piecesById[stateId].correctPosition.y
    };
    const actual = {
      x: alignedPositions[otherId].x - current.x,
      y: alignedPositions[otherId].y - current.y
    };
    return [Math.hypot(actual.x - expected.x, actual.y - expected.y) / referenceScale];
  });
}

function getDirectionFeedback(piece, alignedPosition, referenceScale) {
  const deltaX = alignedPosition.x - piece.correctPosition.x;
  const deltaY = alignedPosition.y - piece.correctPosition.y;
  if (Math.hypot(deltaX, deltaY) < referenceScale * 0.2) return "";
  if (Math.abs(deltaY) > Math.abs(deltaX) * 1.25) return deltaY > 0 ? "too far south" : "too far north";
  if (Math.abs(deltaX) > Math.abs(deltaY) * 1.25) return deltaX > 0 ? "too far east" : "too far west";
  const vertical = deltaY > 0 ? "south" : "north";
  const horizontal = deltaX > 0 ? "east" : "west";
  return `too far ${vertical}${horizontal}`;
}

function getSwappedPair(session, alignedPositions, leftId, rightId, referenceScale) {
  if (!alignedPositions[leftId] || !alignedPositions[rightId]) return false;
  return distance(alignedPositions[leftId], session.piecesById[rightId].correctPosition) < referenceScale * 0.28
    && distance(alignedPositions[rightId], session.piecesById[leftId].correctPosition) < referenceScale * 0.28;
}

export function evaluateMapReconstruction(session, region, geometry) {
  if (!session || !region || !geometry || session.regionId !== region.id) return null;
  const settings = region.evaluation;
  const referenceScale = Math.max(1, geometry.medianStateDiagonal);
  const alignment = getAlignmentOffset(session, region);
  const alignedPositions = getAlignedPositions(session, region, alignment);
  const adjacencyPairs = getMapReconstructionAdjacencyPairs(region);
  const adjacentPairKeys = new Set(adjacencyPairs.map((pair) => pair.join(":")));
  const overlapById = Object.fromEntries(region.stateIds.map((stateId) => [stateId, 0]));
  const sampleStep = Math.max(3, referenceScale / 24);
  for (let leftIndex = 0; leftIndex < region.stateIds.length; leftIndex += 1) {
    const leftId = region.stateIds[leftIndex];
    const leftPosition = alignedPositions[leftId];
    if (!leftPosition) continue;
    for (let rightIndex = leftIndex + 1; rightIndex < region.stateIds.length; rightIndex += 1) {
      const rightId = region.stateIds[rightIndex];
      const rightPosition = alignedPositions[rightId];
      if (!rightPosition) continue;
      const overlap = estimateOverlapRatio(
        geometry.piecesById[leftId], leftPosition,
        geometry.piecesById[rightId], rightPosition,
        sampleStep
      );
      const key = [leftId, rightId].sort().join(":");
      const allowedOverlap = adjacentPairKeys.has(key) ? settings.excessiveOverlapRatio * 1.5 : settings.excessiveOverlapRatio;
      if (overlap > allowedOverlap) {
        overlapById[leftId] = Math.max(overlapById[leftId], overlap);
        overlapById[rightId] = Math.max(overlapById[rightId], overlap);
      }
    }
  }

  const adjacencyErrorById = Object.fromEntries(region.stateIds.map((stateId) => [stateId, []]));
  for (const [leftId, rightId] of adjacencyPairs) {
    if (!alignedPositions[leftId] || !alignedPositions[rightId]) continue;
    const leftPiece = geometry.piecesById[leftId];
    const rightPiece = geometry.piecesById[rightId];
    const expectedGap = minimumOutlineDistance(
      leftPiece, leftPiece.correctPosition,
      rightPiece, rightPiece.correctPosition
    );
    const currentGap = minimumOutlineDistance(
      leftPiece, alignedPositions[leftId],
      rightPiece, alignedPositions[rightId]
    );
    const error = Math.max(0, currentGap - expectedGap) / referenceScale;
    adjacencyErrorById[leftId].push(error);
    adjacencyErrorById[rightId].push(error);
  }

  const placements = {};
  for (const stateId of region.stateIds) {
    const pieceState = session.piecesById[stateId];
    const pieceGeometry = geometry.piecesById[stateId];
    const alignedPosition = alignedPositions[stateId];
    if (!pieceState?.position || !alignedPosition) {
      placements[stateId] = {
        stateId,
        status: MAP_RECONSTRUCTION_PLACEMENT_STATUSES.UNPLACED,
        distanceRatio: null,
        vectorErrorRatio: null,
        overlapRatio: 0,
        outsideWorkspace: false
      };
      continue;
    }
    const distanceRatio = distance(alignedPosition, pieceState.correctPosition) / referenceScale;
    const vectorErrors = getPairVectorErrors(stateId, alignedPositions, session, region, referenceScale);
    const vectorErrorRatio = vectorErrors.length ? vectorErrors.reduce((sum, value) => sum + value, 0) / vectorErrors.length : distanceRatio;
    const adjacencyErrors = adjacencyErrorById[stateId];
    const adjacencyErrorRatio = adjacencyErrors.length
      ? adjacencyErrors.reduce((sum, value) => sum + value, 0) / adjacencyErrors.length
      : 0;
    const bounds = positionBounds(pieceGeometry, pieceState.position);
    const outsideWorkspace = bounds.minX < 0 || bounds.minY < 0
      || bounds.maxX > geometry.workspace.width || bounds.maxY > geometry.workspace.height;
    const hasExcessiveOverlap = overlapById[stateId] > 0;
    let status = MAP_RECONSTRUCTION_PLACEMENT_STATUSES.CLOSE;
    if (outsideWorkspace
      || hasExcessiveOverlap
      || distanceRatio > settings.closeDistanceRatio
      || vectorErrorRatio > settings.closeVectorErrorRatio
      || adjacencyErrorRatio > settings.closeDistanceRatio) {
      status = MAP_RECONSTRUCTION_PLACEMENT_STATUSES.MISPLACED;
    } else if (distanceRatio <= settings.wellDistanceRatio
      && vectorErrorRatio <= settings.wellVectorErrorRatio
      && adjacencyErrorRatio <= settings.wellDistanceRatio) {
      status = MAP_RECONSTRUCTION_PLACEMENT_STATUSES.WELL_PLACED;
    }
    placements[stateId] = {
      stateId,
      status,
      distanceRatio,
      vectorErrorRatio,
      adjacencyErrorRatio,
      overlapRatio: overlapById[stateId],
      outsideWorkspace,
      directionFeedback: getDirectionFeedback(pieceState, alignedPosition, referenceScale)
    };
  }

  const vermontNewHampshireSwapped = getSwappedPair(
    session,
    alignedPositions,
    "vermont",
    "new-hampshire",
    referenceScale
  );
  if (vermontNewHampshireSwapped) {
    placements.vermont.status = MAP_RECONSTRUCTION_PLACEMENT_STATUSES.MISPLACED;
    placements["new-hampshire"].status = MAP_RECONSTRUCTION_PLACEMENT_STATUSES.MISPLACED;
  }

  const counts = Object.values(MAP_RECONSTRUCTION_PLACEMENT_STATUSES).reduce((result, status) => {
    result[status] = Object.values(placements).filter((placement) => placement.status === status).length;
    return result;
  }, {});
  const feedback = [];
  if (vermontNewHampshireSwapped) {
    feedback.push("Vermont and New Hampshire are reversed.");
  }
  for (const stateId of region.stateIds) {
    const placement = placements[stateId];
    if (placement.status === MAP_RECONSTRUCTION_PLACEMENT_STATUSES.UNPLACED) {
      feedback.push(`${getStateById(stateId)?.name || stateId} was not placed.`);
    } else if (placement.status === MAP_RECONSTRUCTION_PLACEMENT_STATUSES.MISPLACED) {
      const name = getStateById(stateId)?.name || stateId;
      if (placement.overlapRatio > 0) feedback.push(`${name} overlaps another state too much.`);
      else if (placement.outsideWorkspace) feedback.push(`${name} falls outside the workspace.`);
      else if (placement.directionFeedback) feedback.push(`${name} is ${placement.directionFeedback}.`);
    }
  }
  if (!feedback.length && counts[MAP_RECONSTRUCTION_PLACEMENT_STATUSES.WELL_PLACED] === region.stateIds.length) {
    feedback.push("The regional structure is correct.");
  }
  const isComplete = counts[MAP_RECONSTRUCTION_PLACEMENT_STATUSES.UNPLACED] === 0
    && counts[MAP_RECONSTRUCTION_PLACEMENT_STATUSES.MISPLACED] === 0;
  return {
    regionId: region.id,
    alignment,
    placements,
    counts,
    adjacencyPairs,
    feedback: feedback.slice(0, 5),
    isComplete
  };
}
