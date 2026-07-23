const MAX_MERCATOR_LATITUDE = 85.05112878;

export function normalizeMapReconstructionStateId(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/^state:/, "");
}

function getFeatureStateId(feature) {
  return normalizeMapReconstructionStateId(
    feature?.properties?.id || feature?.properties?.state || feature?.id
  );
}

function getFeatureName(feature, stateId) {
  return String(feature?.properties?.name || feature?.properties?.NAME || stateId)
    .trim();
}

function projectCoordinate(coordinate) {
  const longitude = Number(coordinate?.[0]);
  const latitude = Math.max(
    -MAX_MERCATOR_LATITUDE,
    Math.min(MAX_MERCATOR_LATITUDE, Number(coordinate?.[1]))
  );
  const longitudeRadians = longitude * Math.PI / 180;
  const latitudeRadians = latitude * Math.PI / 180;
  return [
    longitudeRadians,
    -Math.log(Math.tan(Math.PI / 4 + latitudeRadians / 2))
  ];
}

function mapGeometryCoordinates(geometry, transform) {
  if (geometry?.type === "Polygon") {
    return geometry.coordinates.map((ring) => ring.map(transform));
  }
  if (geometry?.type === "MultiPolygon") {
    return geometry.coordinates.map((polygon) => (
      polygon.map((ring) => ring.map(transform))
    ));
  }
  throw new Error(`Unsupported reconstruction geometry type: ${geometry?.type || "unknown"}`);
}

function asPolygons(geometryType, coordinates) {
  return geometryType === "Polygon" ? [coordinates] : coordinates;
}

function getCoordinateBounds(polygons) {
  const bounds = {
    minX: Infinity,
    minY: Infinity,
    maxX: -Infinity,
    maxY: -Infinity
  };
  for (const polygon of polygons) {
    for (const ring of polygon) {
      for (const [x, y] of ring) {
        bounds.minX = Math.min(bounds.minX, x);
        bounds.minY = Math.min(bounds.minY, y);
        bounds.maxX = Math.max(bounds.maxX, x);
        bounds.maxY = Math.max(bounds.maxY, y);
      }
    }
  }
  return bounds;
}

function mergeBounds(boundsList) {
  return boundsList.reduce((combined, bounds) => ({
    minX: Math.min(combined.minX, bounds.minX),
    minY: Math.min(combined.minY, bounds.minY),
    maxX: Math.max(combined.maxX, bounds.maxX),
    maxY: Math.max(combined.maxY, bounds.maxY)
  }), {
    minX: Infinity,
    minY: Infinity,
    maxX: -Infinity,
    maxY: -Infinity
  });
}

function ringAreaAndCentroid(ring) {
  let doubledArea = 0;
  let centroidX = 0;
  let centroidY = 0;
  for (let index = 0; index < ring.length - 1; index += 1) {
    const [x1, y1] = ring[index];
    const [x2, y2] = ring[index + 1];
    const cross = x1 * y2 - x2 * y1;
    doubledArea += cross;
    centroidX += (x1 + x2) * cross;
    centroidY += (y1 + y2) * cross;
  }
  const area = doubledArea / 2;
  if (Math.abs(area) < Number.EPSILON) return { area: 0, centroid: null };
  return {
    area,
    centroid: [centroidX / (6 * area), centroidY / (6 * area)]
  };
}

function getGeometryCentroid(polygons, fallbackBounds) {
  let weightedX = 0;
  let weightedY = 0;
  let totalWeight = 0;
  for (const polygon of polygons) {
    polygon.forEach((ring, ringIndex) => {
      const result = ringAreaAndCentroid(ring);
      if (!result.centroid) return;
      const weight = (ringIndex === 0 ? 1 : -1) * Math.abs(result.area);
      weightedX += result.centroid[0] * weight;
      weightedY += result.centroid[1] * weight;
      totalWeight += weight;
    });
  }
  if (Math.abs(totalWeight) < Number.EPSILON) {
    return [
      (fallbackBounds.minX + fallbackBounds.maxX) / 2,
      (fallbackBounds.minY + fallbackBounds.maxY) / 2
    ];
  }
  return [weightedX / totalWeight, weightedY / totalWeight];
}

function round(value) {
  return Math.round(value * 1000) / 1000;
}

function toPath(polygons) {
  return polygons.map((polygon) => (
    polygon.map((ring) => ring.map(([x, y], index) => (
      `${index === 0 ? "M" : "L"}${round(x)} ${round(y)}`
    )).join(" ") + " Z").join(" ")
  )).join(" ");
}

function countGeometry(polygons) {
  return polygons.reduce((counts, polygon) => {
    counts.ringCount += polygon.length;
    counts.vertexCount += polygon.reduce((sum, ring) => sum + ring.length, 0);
    return counts;
  }, { polygonCount: polygons.length, ringCount: 0, vertexCount: 0 });
}

function getGeometryArea(polygons) {
  return polygons.reduce((total, polygon) => total + polygon.reduce((polygonArea, ring, ringIndex) => {
    const area = Math.abs(ringAreaAndCentroid(ring).area);
    return polygonArea + (ringIndex === 0 ? area : -area);
  }, 0), 0);
}

function getOutlineSamples(polygons, maximumSamples = 240) {
  const points = polygons.flatMap((polygon) => polygon.flatMap((ring) => ring.slice(0, -1)));
  if (points.length <= maximumSamples) return points.map(([x, y]) => [x, y]);
  const step = points.length / maximumSamples;
  return Array.from({ length: maximumSamples }, (_, index) => {
    const point = points[Math.floor(index * step)];
    return [point[0], point[1]];
  });
}

function normalizeFeature(feature, combinedBounds, workspace) {
  const projectedCoordinates = mapGeometryCoordinates(feature.geometry, projectCoordinate);
  const projectedPolygons = asPolygons(feature.geometry.type, projectedCoordinates);
  const availableWidth = workspace.width - workspace.padding * 2;
  const availableHeight = workspace.height - workspace.padding * 2;
  const combinedWidth = combinedBounds.maxX - combinedBounds.minX;
  const combinedHeight = combinedBounds.maxY - combinedBounds.minY;
  const scale = Math.min(availableWidth / combinedWidth, availableHeight / combinedHeight);
  const renderedWidth = combinedWidth * scale;
  const renderedHeight = combinedHeight * scale;
  const offsetX = (workspace.width - renderedWidth) / 2;
  const offsetY = (workspace.height - renderedHeight) / 2;
  const absolutePolygons = projectedPolygons.map((polygon) => polygon.map((ring) => ring.map(([x, y]) => [
    offsetX + (x - combinedBounds.minX) * scale,
    offsetY + (y - combinedBounds.minY) * scale
  ])));
  const absoluteBounds = getCoordinateBounds(absolutePolygons);
  const anchor = getGeometryCentroid(absolutePolygons, absoluteBounds);
  const localPolygons = absolutePolygons.map((polygon) => polygon.map((ring) => ring.map(([x, y]) => [
    x - anchor[0],
    y - anchor[1]
  ])));
  const localBounds = getCoordinateBounds(localPolygons);
  const counts = countGeometry(localPolygons);
  const stateId = getFeatureStateId(feature);
  return {
    stateId,
    name: getFeatureName(feature, stateId),
    geometryType: feature.geometry.type,
    polygons: localPolygons,
    path: toPath(localPolygons),
    outlineSamples: getOutlineSamples(localPolygons),
    localBounds,
    correctBounds: absoluteBounds,
    correctPosition: { x: anchor[0], y: anchor[1] },
    width: localBounds.maxX - localBounds.minX,
    height: localBounds.maxY - localBounds.minY,
    area: getGeometryArea(localPolygons),
    ...counts
  };
}

export function prepareMapReconstructionGeometry(featureCollection, region) {
  if (!featureCollection || !Array.isArray(featureCollection.features)) {
    throw new Error("A GeoJSON FeatureCollection is required.");
  }
  if (!region || !Array.isArray(region.stateIds) || !region.workspace) {
    throw new Error("A valid reconstruction region is required.");
  }
  const featureMap = new Map();
  for (const feature of featureCollection.features) {
    const stateId = getFeatureStateId(feature);
    if (!stateId) continue;
    if (featureMap.has(stateId)) {
      throw new Error(`Duplicate state geometry: ${stateId}`);
    }
    featureMap.set(stateId, feature);
  }
  const requestedIds = region.stateIds.map(normalizeMapReconstructionStateId);
  if (new Set(requestedIds).size !== requestedIds.length) {
    throw new Error("Reconstruction region state IDs must be unique.");
  }
  const features = requestedIds.map((stateId) => {
    const feature = featureMap.get(stateId);
    if (!feature) throw new Error(`Missing state geometry: ${stateId}`);
    if (!["Polygon", "MultiPolygon"].includes(feature.geometry?.type)) {
      throw new Error(`Unsupported state geometry for ${stateId}.`);
    }
    return feature;
  });
  const projectedBounds = features.map((feature) => {
    const coordinates = mapGeometryCoordinates(feature.geometry, projectCoordinate);
    return getCoordinateBounds(asPolygons(feature.geometry.type, coordinates));
  });
  const combinedProjectedBounds = mergeBounds(projectedBounds);
  const pieces = features.map((feature) => normalizeFeature(
    feature,
    combinedProjectedBounds,
    region.workspace
  ));
  const piecesById = Object.fromEntries(pieces.map((piece) => [piece.stateId, piece]));
  const diagonals = pieces.map((piece) => Math.hypot(piece.width, piece.height)).sort((a, b) => a - b);
  const medianStateDiagonal = diagonals[Math.floor(diagonals.length / 2)];
  return {
    regionId: region.id,
    workspace: { ...region.workspace },
    stateIds: [...requestedIds],
    pieces,
    piecesById,
    medianStateDiagonal,
    combinedBounds: mergeBounds(pieces.map((piece) => piece.correctBounds))
  };
}

export function getMapReconstructionThumbnailTransform(piece, width = 120, height = 84, padding = 8) {
  if (!piece) return "";
  const scale = Math.min(
    (width - padding * 2) / Math.max(piece.width, 1),
    (height - padding * 2) / Math.max(piece.height, 1)
  );
  const centerX = (piece.localBounds.minX + piece.localBounds.maxX) / 2;
  const centerY = (piece.localBounds.minY + piece.localBounds.maxY) / 2;
  return `translate(${round(width / 2)} ${round(height / 2)}) scale(${round(scale)}) translate(${-round(centerX)} ${-round(centerY)})`;
}

export function isPointInMapReconstructionPiece(piece, point) {
  if (!piece || !point) return false;
  const pointInRing = (ring) => {
    let inside = false;
    for (let index = 0, previous = ring.length - 1; index < ring.length; previous = index, index += 1) {
      const [x1, y1] = ring[index];
      const [x2, y2] = ring[previous];
      const intersects = ((y1 > point.y) !== (y2 > point.y))
        && point.x < (x2 - x1) * (point.y - y1) / ((y2 - y1) || Number.EPSILON) + x1;
      if (intersects) inside = !inside;
    }
    return inside;
  };
  return piece.polygons.some((polygon) => (
    pointInRing(polygon[0]) && !polygon.slice(1).some(pointInRing)
  ));
}

export function getTopmostMapReconstructionPieceAtPoint(entries, point) {
  if (!Array.isArray(entries) || !Number.isFinite(point?.x) || !Number.isFinite(point?.y)) return null;
  for (let index = entries.length - 1; index >= 0; index -= 1) {
    const entry = entries[index];
    if (!entry?.piece || !Number.isFinite(entry.position?.x) || !Number.isFinite(entry.position?.y)) continue;
    if (isPointInMapReconstructionPiece(entry.piece, {
      x: point.x - entry.position.x,
      y: point.y - entry.position.y
    })) {
      return entry.stateId || entry.piece.stateId || null;
    }
  }
  return null;
}
