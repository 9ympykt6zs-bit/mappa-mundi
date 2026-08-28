const supportedGeometryTypes = new Set([
  "Point",
  "MultiPoint",
  "LineString",
  "MultiLineString",
  "Polygon",
  "MultiPolygon"
]);

function isPosition(value) {
  return Array.isArray(value) && value.length >= 2 && value.every(Number.isFinite);
}

function isLineStringCoordinates(value) {
  return Array.isArray(value) && value.length >= 2 && value.every(isPosition);
}

function isLinearRing(value) {
  if (!Array.isArray(value) || value.length < 4 || !value.every(isPosition)) return false;
  const first = value[0];
  const last = value.at(-1);
  return first[0] === last[0] && first[1] === last[1];
}

function isPolygonCoordinates(value) {
  return Array.isArray(value) && value.length > 0 && value.every(isLinearRing);
}

export function isUsableRetrievalGeometry(geometry) {
  if (!geometry || !supportedGeometryTypes.has(geometry.type)) return false;
  const coordinates = geometry.coordinates;
  if (geometry.type === "Point") return isPosition(coordinates);
  if (geometry.type === "MultiPoint") return Array.isArray(coordinates) && coordinates.length > 0 && coordinates.every(isPosition);
  if (geometry.type === "LineString") return isLineStringCoordinates(coordinates);
  if (geometry.type === "MultiLineString") {
    return Array.isArray(coordinates) && coordinates.length > 0 && coordinates.every(isLineStringCoordinates);
  }
  if (geometry.type === "Polygon") return isPolygonCoordinates(coordinates);
  return Array.isArray(coordinates) && coordinates.length > 0 && coordinates.every(isPolygonCoordinates);
}

export function validateRetrievalTarget(target, options = {}) {
  const targetId = String(target?.id || "").trim();
  if (!targetId) {
    return { ready: false, targetId: "", reason: "missing-target-id" };
  }

  if (target.kind === "point") {
    const ready = Number.isFinite(target.lon) && Number.isFinite(target.lat);
    return {
      ready,
      targetId,
      reason: ready ? "ready" : "missing-point-coordinates"
    };
  }

  if (target.kind !== "shape") {
    return { ready: false, targetId, reason: "unsupported-target-kind" };
  }

  const sourceFeature = options.resolveShapeFeature?.(target) || null;
  const ready = isUsableRetrievalGeometry(sourceFeature?.geometry);
  return {
    ready,
    targetId,
    reason: ready ? "ready" : sourceFeature ? "invalid-target-geometry" : "missing-target-geometry"
  };
}

export function validateMapRetrievalActivity(activity, options = {}) {
  const targets = Array.isArray(activity?.targets) ? activity.targets : [];
  if (!activity?.id || targets.length === 0) {
    return {
      ready: false,
      activityId: activity?.id || "",
      reason: activity?.id ? "missing-activity-targets" : "missing-activity-id",
      targets: []
    };
  }

  const targetResults = targets.map((target) => validateRetrievalTarget(target, options));
  const invalidTargets = targetResults.filter((result) => !result.ready);
  return {
    ready: invalidTargets.length === 0,
    activityId: activity.id,
    reason: invalidTargets.length === 0 ? "ready" : "invalid-retrieval-targets",
    targets: targetResults,
    invalidTargets
  };
}

export function evaluateMapTargetSelection(expectedTarget, candidateTargetIds, options = {}) {
  const readiness = validateRetrievalTarget(expectedTarget, options);
  if (!readiness.ready) {
    return { status: "blocked", readiness };
  }

  const candidateIds = Array.isArray(candidateTargetIds)
    ? candidateTargetIds.filter(Boolean)
    : [candidateTargetIds].filter(Boolean);
  return {
    status: candidateIds.includes(readiness.targetId) ? "correct" : "incorrect",
    readiness
  };
}
