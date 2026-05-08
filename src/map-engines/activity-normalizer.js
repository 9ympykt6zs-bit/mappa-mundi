export const targetKinds = {
  point: "point",
  shape: "shape"
};

export function normalizeActivity(rawActivity) {
  return {
    schemaVersion: rawActivity.schemaVersion || 1,
    id: rawActivity.id,
    title: rawActivity.title,
    engine: rawActivity.engine || inferEngine(rawActivity),
    targetNoun: rawActivity.targetNoun || inferTargetNoun(rawActivity.features || rawActivity.targets || []),
    defaultMode: rawActivity.defaultMode || "word-bank",
    map: rawActivity.map || getLegacyMapDescriptor(rawActivity),
    sources: rawActivity.sources || [],
    targetLayers: rawActivity.targetLayers || [],
    targets: (rawActivity.targets || rawActivity.features || []).map(normalizeTarget)
  };
}

export function normalizeTarget(feature) {
  const kind = inferTargetKind(feature);

  return {
    ...feature,
    kind,
    sourceFeatureId: feature.sourceFeatureId || feature.mapShapeId || (kind === targetKinds.shape ? feature.id : undefined),
    label: normalizeLabel(feature),
    hitRadius: feature.hitRadius || (kind === targetKinds.point ? 16 : undefined)
  };
}

function inferEngine(activity) {
  if (activity.engine) {
    return activity.engine;
  }

  return activity.baseMapPath?.endsWith(".svg") || activity.baseMap ? "svg" : "maplibre";
}

function inferTargetKind(feature) {
  if (feature.kind) {
    return feature.kind;
  }

  if (feature.type === "city" || feature.type === "capital" || feature.shape === "circle") {
    return targetKinds.point;
  }

  return targetKinds.shape;
}

function normalizeLabel(feature) {
  return {
    anchor: feature.labelAnchor || feature.labelPosition || null,
    offset: feature.labelOffset || null,
    fontSize: feature.labelFontSize || null,
    rotation: feature.labelRotation || 0
  };
}

function inferTargetNoun(features) {
  if (features.length > 0 && features.every((feature) => inferTargetKind(feature) === targetKinds.point)) {
    return "location";
  }

  return "place";
}

function getLegacyMapDescriptor(activity) {
  return {
    baseMap: activity.baseMap || null,
    baseMapPath: activity.baseMapPath || null,
    projection: activity.projection || null
  };
}
