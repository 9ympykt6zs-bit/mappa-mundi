// Display-only cleanup for the global land silhouette. Authoritative country
// and target geometry remains untouched for navigation, highlights, and hits.
export const coastlineDisplayCleanup = Object.freeze({
  minExteriorAreaDegrees: 0.00125,
  denseMultipartComponentCount: 24,
  denseMultipartMinExteriorAreaDegrees: 0.015,
  minSegmentDegrees: 0.0025,
  collinearToleranceDegrees: 0.0018,
  maxPasses: 3
});

export function createCoastlineDisplayGeoJson(featureCollection, options = coastlineDisplayCleanup) {
  const source = featureCollection && typeof featureCollection === "object"
    ? featureCollection
    : { type: "FeatureCollection", features: [] };

  return {
    type: "FeatureCollection",
    features: (source.features || [])
      .map((feature) => createDisplayFeature(feature, options))
      .filter(Boolean)
  };
}

function createDisplayFeature(feature, options) {
  if (shouldKeepAuthoritativeFeatureShape(feature)) {
    return feature;
  }

  const geometry = createDisplayGeometry(feature?.geometry, options);

  return geometry ? {
    ...feature,
    geometry
  } : null;
}

function shouldKeepAuthoritativeFeatureShape(feature) {
  const properties = feature?.properties || {};
  const physicalFeatureType = String(properties.physicalFeatureType || properties.type || "").toLowerCase();
  return ["river", "lake", "water-body", "mountain-range"].includes(physicalFeatureType);
}

function createDisplayGeometry(geometry, options) {
  if (!geometry || typeof geometry !== "object") {
    return null;
  }

  if (geometry.type === "Polygon") {
    // A single-polygon country or state has no separate coastal fragments to
    // cull. Keep it even when geographically small.
    const coordinates = cleanPolygon(geometry.coordinates, options);
    return coordinates ? { ...geometry, coordinates } : null;
  }

  if (geometry.type === "MultiPolygon") {
    const candidates = (geometry.coordinates || [])
      .map((polygon) => cleanPolygon(polygon, options))
      .filter(Boolean);
    const largestIndex = getLargestPolygonIndex(candidates);
    const minExteriorArea = candidates.length >= options.denseMultipartComponentCount
      ? options.denseMultipartMinExteriorAreaDegrees
      : options.minExteriorAreaDegrees;
    const coordinates = candidates.filter((polygon, index) => (
      index === largestIndex || ringArea(polygon[0]) >= minExteriorArea
    ));
    return coordinates.length > 0 ? { ...geometry, coordinates } : null;
  }

  if (geometry.type === "GeometryCollection") {
    const geometries = (geometry.geometries || [])
      .map((child) => createDisplayGeometry(child, options))
      .filter(Boolean);
    return geometries.length > 0 ? { ...geometry, geometries } : null;
  }

  return geometry;
}

function cleanPolygon(rings, options) {
  const exterior = cleanRing(rings?.[0], options);
  if (!exterior) {
    return null;
  }

  // Do not fill coastline holes: water inlets must remain water. They only get
  // the same conservative vertex cleanup as exterior coastlines.
  const holes = (rings || [])
    .slice(1)
    .map((ring) => cleanRing(ring, options))
    .filter(Boolean);

  return [exterior, ...holes];
}

function getLargestPolygonIndex(polygons) {
  return polygons.reduce((largestIndex, polygon, index) => (
    ringArea(polygon[0]) > ringArea(polygons[largestIndex]?.[0] || []) ? index : largestIndex
  ), 0);
}

function cleanRing(ring, options) {
  const openRing = (ring || [])
    .filter((point) => Array.isArray(point) && Number.isFinite(point[0]) && Number.isFinite(point[1]))
    .map((point) => [point[0], point[1]]);

  if (openRing.length < 4) {
    return null;
  }

  if (samePoint(openRing[0], openRing[openRing.length - 1])) {
    openRing.pop();
  }

  let simplified = removeDuplicatePoints(openRing);
  for (let pass = 0; pass < options.maxPasses && simplified.length > 3; pass += 1) {
    const next = simplified.filter((point, index, points) => {
      const previous = points[(index - 1 + points.length) % points.length];
      const following = points[(index + 1) % points.length];
      return distance(previous, point) >= options.minSegmentDegrees
        && distance(point, following) >= options.minSegmentDegrees
        && distanceToSegment(point, previous, following) >= options.collinearToleranceDegrees;
    });

    if (next.length < 3 || next.length === simplified.length) {
      break;
    }
    simplified = next;
  }

  return simplified.length >= 3 ? [...simplified, [...simplified[0]]] : null;
}

function removeDuplicatePoints(points) {
  return points.filter((point, index) => index === 0 || !samePoint(point, points[index - 1]));
}

function samePoint(left, right) {
  return left?.[0] === right?.[0] && left?.[1] === right?.[1];
}

function distance(left, right) {
  return Math.hypot(right[0] - left[0], right[1] - left[1]);
}

function distanceToSegment(point, start, end) {
  const deltaX = end[0] - start[0];
  const deltaY = end[1] - start[1];
  const lengthSquared = (deltaX * deltaX) + (deltaY * deltaY);

  if (lengthSquared === 0) {
    return distance(point, start);
  }

  const projection = Math.max(0, Math.min(1, (
    ((point[0] - start[0]) * deltaX) + ((point[1] - start[1]) * deltaY)
  ) / lengthSquared));
  return Math.hypot(
    point[0] - (start[0] + (projection * deltaX)),
    point[1] - (start[1] + (projection * deltaY))
  );
}

function ringArea(ring) {
  return Math.abs(ring.slice(0, -1).reduce((sum, point, index, points) => {
    const next = points[(index + 1) % points.length];
    return sum + (point[0] * next[1]) - (next[0] * point[1]);
  }, 0) / 2);
}
