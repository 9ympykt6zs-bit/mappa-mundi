const EMPTY_FEATURE_COLLECTION = Object.freeze({
  type: "FeatureCollection",
  features: []
});

function normalizeId(value = "") {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function copyFeatureCollection(collection) {
  return collection?.type === "FeatureCollection" && Array.isArray(collection.features)
    ? collection
    : EMPTY_FEATURE_COLLECTION;
}

function getFeatureIdentityValues(feature = {}) {
  const properties = feature.properties || {};
  return [
    properties.id,
    properties.sourceFeatureId,
    properties.name,
    properties.NAME,
    properties.ADMIN,
    properties.SOVEREIGNT,
    properties.ocean,
    properties.label,
    properties.sourceName
  ].map(normalizeId).filter(Boolean);
}

function getCollectionForKind(kind, collections) {
  if (kind === "river") return copyFeatureCollection(collections.rivers);
  if (kind === "lake") return copyFeatureCollection(collections.lakes);
  if (kind === "mountain-range") return copyFeatureCollection(collections.mountainRanges);
  if (kind === "water") return copyFeatureCollection(collections.waters);
  if (kind === "country") return copyFeatureCollection(collections.countries);
  return EMPTY_FEATURE_COLLECTION;
}

function findFeatureGeometry(featureMetadata, collections) {
  const expectedIds = new Set([
    featureMetadata.id,
    featureMetadata.sourceFeatureId,
    featureMetadata.name
  ].map(normalizeId).filter(Boolean));
  return getCollectionForKind(featureMetadata.kind, collections).features.find((feature) => (
    getFeatureIdentityValues(feature).some((value) => expectedIds.has(value))
  )) || null;
}

function visitCoordinates(coordinates, visitor) {
  if (!Array.isArray(coordinates)) return;
  if (typeof coordinates[0] === "number" && typeof coordinates[1] === "number") {
    visitor(coordinates);
    return;
  }
  coordinates.forEach((coordinate) => visitCoordinates(coordinate, visitor));
}

function getGeometryBounds(geometry) {
  const bounds = [Infinity, Infinity, -Infinity, -Infinity];
  visitCoordinates(geometry?.coordinates, ([longitude, latitude]) => {
    bounds[0] = Math.min(bounds[0], longitude);
    bounds[1] = Math.min(bounds[1], latitude);
    bounds[2] = Math.max(bounds[2], longitude);
    bounds[3] = Math.max(bounds[3], latitude);
  });
  return bounds.every(Number.isFinite) ? bounds : null;
}

function mergeBounds(current, next) {
  if (!next) return current;
  if (!current) return [...next];
  return [
    Math.min(current[0], next[0]),
    Math.min(current[1], next[1]),
    Math.max(current[2], next[2]),
    Math.max(current[3], next[3])
  ];
}

function getStateFeature(stateId, stateFeatures) {
  return copyFeatureCollection(stateFeatures).features.find((feature) => (
    normalizeId(feature.properties?.id || feature.properties?.state || feature.id) === normalizeId(stateId)
  )) || null;
}

function getStateBounds(stateIds, stateFeatures) {
  const geometries = [...new Set(stateIds || [])]
    .map((stateId) => getStateFeature(stateId, stateFeatures)?.geometry)
    .filter(Boolean);
  let bounds = geometries.reduce((combined, geometry) => mergeBounds(combined, getGeometryBounds(geometry)), null);
  if (bounds && bounds[2] - bounds[0] > 180) {
    bounds = [Infinity, Infinity, -Infinity, -Infinity];
    geometries.forEach((geometry) => {
      visitCoordinates(geometry.coordinates, ([longitude, latitude]) => {
        const adjustedLongitude = longitude > 0 ? longitude - 360 : longitude;
        bounds[0] = Math.min(bounds[0], adjustedLongitude);
        bounds[1] = Math.min(bounds[1], latitude);
        bounds[2] = Math.max(bounds[2], adjustedLongitude);
        bounds[3] = Math.max(bounds[3], latitude);
      });
    });
  }
  return bounds?.every(Number.isFinite) ? bounds : null;
}

function getAverageStateCenter(stateIds, stateFeatures) {
  const centers = [...new Set(stateIds || [])].map((stateId) => (
    getBoundsCenter(getStateBounds([stateId], stateFeatures))
  )).filter(Boolean);
  if (!centers.length) return null;
  const referenceLongitude = centers[0][0];
  const adjustedCenters = centers.map(([longitude, latitude]) => {
    let adjustedLongitude = longitude;
    while (adjustedLongitude - referenceLongitude > 180) adjustedLongitude -= 360;
    while (referenceLongitude - adjustedLongitude > 180) adjustedLongitude += 360;
    return [adjustedLongitude, latitude];
  });
  return [
    adjustedCenters.reduce((sum, center) => sum + center[0], 0) / adjustedCenters.length,
    adjustedCenters.reduce((sum, center) => sum + center[1], 0) / adjustedCenters.length
  ];
}

function getBoundsCenter(bounds) {
  return bounds
    ? [(bounds[0] + bounds[2]) / 2, (bounds[1] + bounds[3]) / 2]
    : null;
}

function isPointInRing([x, y], ring = []) {
  let inside = false;
  for (let index = 0, previous = ring.length - 1; index < ring.length; previous = index, index += 1) {
    const [currentX, currentY] = ring[index] || [];
    const [previousX, previousY] = ring[previous] || [];
    if (![currentX, currentY, previousX, previousY].every(Number.isFinite)) continue;
    const crosses = (currentY > y) !== (previousY > y)
      && x < ((previousX - currentX) * (y - currentY)) / (previousY - currentY) + currentX;
    if (crosses) inside = !inside;
  }
  return inside;
}

function isPointInPolygon(point, rings = []) {
  return isPointInRing(point, rings[0])
    && !rings.slice(1).some((ring) => isPointInRing(point, ring));
}

function isPointInGeometry(point, geometry) {
  if (geometry?.type === "Polygon") return isPointInPolygon(point, geometry.coordinates);
  if (geometry?.type === "MultiPolygon") {
    return geometry.coordinates.some((polygon) => isPointInPolygon(point, polygon));
  }
  return false;
}

function getReliableCountryLabelAnchor(feature) {
  const longitude = Number(feature?.properties?.LABEL_X);
  const latitude = Number(feature?.properties?.LABEL_Y);
  const point = [longitude, latitude];
  return point.every(Number.isFinite) && isPointInGeometry(point, feature?.geometry)
    ? point
    : null;
}

function getContextualWaterLabelAnchor(geometry, stateBounds, preferredCenter = null) {
  const stateCenter = preferredCenter || getBoundsCenter(stateBounds);
  if (!stateCenter) return getBoundsCenter(getGeometryBounds(geometry));
  if (!geometry) {
    const height = Math.max(1, stateBounds[3] - stateBounds[1]);
    return [stateCenter[0], stateBounds[1] - Math.min(4, Math.max(1.5, height * 0.3))];
  }

  let closestPoint = null;
  let closestDistance = Infinity;
  visitCoordinates(geometry.coordinates, ([longitude, latitude]) => {
    let adjustedLongitude = longitude;
    while (adjustedLongitude - stateCenter[0] > 180) adjustedLongitude -= 360;
    while (stateCenter[0] - adjustedLongitude > 180) adjustedLongitude += 360;
    const distance = Math.hypot(adjustedLongitude - stateCenter[0], latitude - stateCenter[1]);
    if (distance < closestDistance) {
      closestDistance = distance;
      closestPoint = [adjustedLongitude, latitude];
    }
  });
  if (!closestPoint) return stateCenter;
  return [
    (stateCenter[0] + closestPoint[0]) / 2,
    (stateCenter[1] + closestPoint[1]) / 2
  ];
}

function shouldIncludeFeatureBounds(kind, bounds) {
  if (!bounds) return false;
  if (["river", "lake", "mountain-range"].includes(kind)) return true;
  return bounds[2] - bounds[0] <= 65 && bounds[3] - bounds[1] <= 45;
}

function createRouteFeature(stateIds, stateFeatures) {
  const coordinates = (stateIds || []).map((stateId) => (
    getBoundsCenter(getGeometryBounds(getStateFeature(stateId, stateFeatures)?.geometry))
  )).filter(Boolean);
  if (coordinates.length < 2) return null;
  return {
    type: "Feature",
    properties: { featureRole: "ordered-route", questionFeatureName: "Correct route" },
    geometry: { type: "LineString", coordinates }
  };
}

export function buildMentalMapFeatureFeedback({
  associatedFeatures = [],
  answerStateIds = [],
  orderedStateIds = [],
  stateFeatures = EMPTY_FEATURE_COLLECTION,
  collections = {}
} = {}) {
  const stateBounds = getStateBounds(answerStateIds, stateFeatures);
  const averageStateCenter = getAverageStateCenter(answerStateIds, stateFeatures);
  let cameraBounds = stateBounds;
  const features = [];
  const labels = [];
  const missingFeatureIds = [];

  associatedFeatures.forEach((metadata) => {
    const sourceFeature = findFeatureGeometry(metadata, collections);
    const geometry = sourceFeature?.geometry || null;
    if (geometry) {
      features.push({
        type: "Feature",
        properties: {
          ...(sourceFeature.properties || {}),
          questionFeatureEntityId: metadata.entityId,
          questionFeatureKind: metadata.kind,
          questionFeatureName: metadata.name
        },
        geometry
      });
      const featureBounds = getGeometryBounds(geometry);
      if (shouldIncludeFeatureBounds(metadata.kind, featureBounds)) {
        cameraBounds = mergeBounds(cameraBounds, featureBounds);
      }
    } else {
      missingFeatureIds.push(metadata.entityId);
    }

    if (geometry || metadata.kind === "water") {
      const anchor = metadata.kind === "water"
        ? getContextualWaterLabelAnchor(
          geometry,
          stateBounds,
          averageStateCenter
        )
        : metadata.kind === "country"
          ? getReliableCountryLabelAnchor(sourceFeature)
        : getBoundsCenter(getGeometryBounds(geometry));
      if (anchor) {
        labels.push({
          type: "Feature",
          properties: {
            questionFeatureEntityId: metadata.entityId,
            questionFeatureKind: metadata.kind,
            questionFeatureName: metadata.name
          },
          geometry: { type: "Point", coordinates: anchor }
        });
        cameraBounds = mergeBounds(cameraBounds, [anchor[0], anchor[1], anchor[0], anchor[1]]);
      }
    }
  });

  const routeFeature = createRouteFeature(orderedStateIds, stateFeatures);
  return {
    featureCollection: { type: "FeatureCollection", features },
    labelCollection: { type: "FeatureCollection", features: labels },
    routeCollection: {
      type: "FeatureCollection",
      features: routeFeature ? [routeFeature] : []
    },
    coastStateIds: associatedFeatures.some((feature) => feature.kind === "water")
      ? [...new Set(answerStateIds)]
      : [],
    cameraBounds: cameraBounds ? [[cameraBounds[0], cameraBounds[1]], [cameraBounds[2], cameraBounds[3]]] : null,
    missingFeatureIds
  };
}
