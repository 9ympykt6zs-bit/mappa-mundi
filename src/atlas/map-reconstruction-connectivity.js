import { getMapReconstructionSvgScreenScale } from "./map-reconstruction-drag-preview.js";
import { isPointInMapReconstructionPiece } from "./map-reconstruction-geometry.js";

export const MAP_RECONSTRUCTION_TOUCH_TOLERANCE_CSS_PIXELS = 4;
const geometryMetricsCache = new WeakMap();

function boundsAtPosition(piece, position) {
  return {
    minX: piece.localBounds.minX + position.x,
    minY: piece.localBounds.minY + position.y,
    maxX: piece.localBounds.maxX + position.x,
    maxY: piece.localBounds.maxY + position.y
  };
}

function boundsMayTouch(first, second, tolerance) {
  return first.minX <= second.maxX + tolerance
    && first.maxX + tolerance >= second.minX
    && first.minY <= second.maxY + tolerance
    && first.maxY + tolerance >= second.minY;
}

function getGeometryMetrics(piece) {
  if (geometryMetricsCache.has(piece)) return geometryMetricsCache.get(piece);
  const segments = piece.polygons.flatMap((polygon) => polygon.flatMap((ring) => (
    ring.slice(0, -1).map((point, index) => ({
      start: point,
      end: ring[index + 1]
    }))
  )));
  const metrics = { segments };
  geometryMetricsCache.set(piece, metrics);
  return metrics;
}

function orientation(first, second, third) {
  return (second[0] - first[0]) * (third[1] - first[1])
    - (second[1] - first[1]) * (third[0] - first[0]);
}

function pointOnSegment(point, start, end) {
  return point[0] >= Math.min(start[0], end[0])
    && point[0] <= Math.max(start[0], end[0])
    && point[1] >= Math.min(start[1], end[1])
    && point[1] <= Math.max(start[1], end[1]);
}

function segmentsIntersect(firstStart, firstEnd, secondStart, secondEnd) {
  const firstSideA = orientation(firstStart, firstEnd, secondStart);
  const firstSideB = orientation(firstStart, firstEnd, secondEnd);
  const secondSideA = orientation(secondStart, secondEnd, firstStart);
  const secondSideB = orientation(secondStart, secondEnd, firstEnd);
  if ((firstSideA > 0) !== (firstSideB > 0)
    && (secondSideA > 0) !== (secondSideB > 0)) return true;
  return (firstSideA === 0 && pointOnSegment(secondStart, firstStart, firstEnd))
    || (firstSideB === 0 && pointOnSegment(secondEnd, firstStart, firstEnd))
    || (secondSideA === 0 && pointOnSegment(firstStart, secondStart, secondEnd))
    || (secondSideB === 0 && pointOnSegment(firstEnd, secondStart, secondEnd));
}

function pointToSegmentDistanceSquared(point, start, end) {
  const deltaX = end[0] - start[0];
  const deltaY = end[1] - start[1];
  const lengthSquared = deltaX * deltaX + deltaY * deltaY;
  if (lengthSquared === 0) {
    return (point[0] - start[0]) ** 2 + (point[1] - start[1]) ** 2;
  }
  const projection = Math.max(0, Math.min(1, (
    (point[0] - start[0]) * deltaX + (point[1] - start[1]) * deltaY
  ) / lengthSquared));
  const nearestX = start[0] + projection * deltaX;
  const nearestY = start[1] + projection * deltaY;
  return (point[0] - nearestX) ** 2 + (point[1] - nearestY) ** 2;
}

function translatedPoint(point, position) {
  return [point[0] + position.x, point[1] + position.y];
}

function piecesOverlapByContainment(firstPiece, firstPosition, secondPiece, secondPosition) {
  const firstContainsSecond = secondPiece.polygons.some((polygon) => {
    const point = polygon[0]?.[0];
    if (!point) return false;
    const world = translatedPoint(point, secondPosition);
    return isPointInMapReconstructionPiece(firstPiece, {
      x: world[0] - firstPosition.x,
      y: world[1] - firstPosition.y
    });
  });
  if (firstContainsSecond) return true;
  return firstPiece.polygons.some((polygon) => {
    const point = polygon[0]?.[0];
    if (!point) return false;
    const world = translatedPoint(point, firstPosition);
    return isPointInMapReconstructionPiece(secondPiece, {
      x: world[0] - secondPosition.x,
      y: world[1] - secondPosition.y
    });
  });
}

export function areMapReconstructionPiecesTouching(
  firstPiece,
  firstPosition,
  secondPiece,
  secondPosition,
  tolerance = 0
) {
  if (!firstPiece || !secondPiece || !firstPosition || !secondPosition) return false;
  const allowedDistance = Math.max(0, Number(tolerance) || 0);
  if (!boundsMayTouch(
    boundsAtPosition(firstPiece, firstPosition),
    boundsAtPosition(secondPiece, secondPosition),
    allowedDistance
  )) return false;
  if (piecesOverlapByContainment(
    firstPiece,
    firstPosition,
    secondPiece,
    secondPosition
  )) return true;

  const firstSegments = getGeometryMetrics(firstPiece).segments;
  const secondSegments = getGeometryMetrics(secondPiece).segments;
  const toleranceSquared = allowedDistance * allowedDistance;
  for (const first of firstSegments) {
    const firstStart = translatedPoint(first.start, firstPosition);
    const firstEnd = translatedPoint(first.end, firstPosition);
    for (const second of secondSegments) {
      const secondStart = translatedPoint(second.start, secondPosition);
      const secondEnd = translatedPoint(second.end, secondPosition);
      if (segmentsIntersect(firstStart, firstEnd, secondStart, secondEnd)) return true;
      if (pointToSegmentDistanceSquared(firstStart, secondStart, secondEnd) <= toleranceSquared
        || pointToSegmentDistanceSquared(firstEnd, secondStart, secondEnd) <= toleranceSquared
        || pointToSegmentDistanceSquared(secondStart, firstStart, firstEnd) <= toleranceSquared
        || pointToSegmentDistanceSquared(secondEnd, firstStart, firstEnd) <= toleranceSquared) {
        return true;
      }
    }
  }
  return false;
}

export function getMapReconstructionWorldTouchTolerance(
  workspaceSvg,
  cssPixels = MAP_RECONSTRUCTION_TOUCH_TOLERANCE_CSS_PIXELS
) {
  const scale = getMapReconstructionSvgScreenScale(workspaceSvg);
  const unitsPerCssPixel = 1 / Math.max(Number.EPSILON, Math.min(scale.x, scale.y));
  return Math.max(0, Number(cssPixels) || 0) * unitsPerCssPixel;
}

export function getMapReconstructionConnectedComponent(
  session,
  geometry,
  startStateId,
  tolerance = 0
) {
  if (!session?.piecesById?.[startStateId]?.position || !geometry?.piecesById?.[startStateId]) {
    return [];
  }
  const placedStateIds = geometry.stateIds.filter((stateId) => (
    session.piecesById?.[stateId]?.position && geometry.piecesById[stateId]
  ));
  const connected = new Set([startStateId]);
  const queue = [startStateId];
  const pairResults = new Map();
  const pairTouches = (firstStateId, secondStateId) => {
    const key = [firstStateId, secondStateId].sort().join("|");
    if (!pairResults.has(key)) {
      pairResults.set(key, areMapReconstructionPiecesTouching(
        geometry.piecesById[firstStateId],
        session.piecesById[firstStateId].position,
        geometry.piecesById[secondStateId],
        session.piecesById[secondStateId].position,
        tolerance
      ));
    }
    return pairResults.get(key);
  };
  while (queue.length) {
    const stateId = queue.shift();
    placedStateIds.forEach((candidateStateId) => {
      if (connected.has(candidateStateId) || candidateStateId === stateId) return;
      if (!pairTouches(stateId, candidateStateId)) return;
      connected.add(candidateStateId);
      queue.push(candidateStateId);
    });
  }
  return placedStateIds.filter((stateId) => connected.has(stateId));
}

export function getMapReconstructionStatesIntersectingBounds(session, geometry, bounds) {
  if (!session || !geometry || !bounds) return [];
  const normalizedBounds = {
    minX: Math.min(bounds.minX, bounds.maxX),
    minY: Math.min(bounds.minY, bounds.maxY),
    maxX: Math.max(bounds.minX, bounds.maxX),
    maxY: Math.max(bounds.minY, bounds.maxY)
  };
  const rectangleSegments = [
    [[normalizedBounds.minX, normalizedBounds.minY], [normalizedBounds.maxX, normalizedBounds.minY]],
    [[normalizedBounds.maxX, normalizedBounds.minY], [normalizedBounds.maxX, normalizedBounds.maxY]],
    [[normalizedBounds.maxX, normalizedBounds.maxY], [normalizedBounds.minX, normalizedBounds.maxY]],
    [[normalizedBounds.minX, normalizedBounds.maxY], [normalizedBounds.minX, normalizedBounds.minY]]
  ];
  const rectangleCorners = rectangleSegments.map(([start]) => start);
  return geometry.stateIds.filter((stateId) => {
    const position = session.piecesById?.[stateId]?.position;
    const piece = geometry.piecesById?.[stateId];
    if (!position || !piece) return false;
    if (!boundsMayTouch(boundsAtPosition(piece, position), normalizedBounds, 0)) return false;
    if (rectangleCorners.some(([x, y]) => isPointInMapReconstructionPiece(piece, {
      x: x - position.x,
      y: y - position.y
    }))) return true;
    return getGeometryMetrics(piece).segments.some((segment) => {
      const start = translatedPoint(segment.start, position);
      const end = translatedPoint(segment.end, position);
      if ((start[0] >= normalizedBounds.minX && start[0] <= normalizedBounds.maxX
        && start[1] >= normalizedBounds.minY && start[1] <= normalizedBounds.maxY)
        || (end[0] >= normalizedBounds.minX && end[0] <= normalizedBounds.maxX
          && end[1] >= normalizedBounds.minY && end[1] <= normalizedBounds.maxY)) {
        return true;
      }
      return rectangleSegments.some(([rectangleStart, rectangleEnd]) => (
        segmentsIntersect(start, end, rectangleStart, rectangleEnd)
      ));
    });
  });
}
