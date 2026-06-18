export const targetKinds = {
  point: "point",
  shape: "shape"
};

export function normalizeActivity(rawActivity, overrides = {}) {
  const rawTargets = overrides.targets || rawActivity.targets || rawActivity.features || [];
  const map = {
    ...getLegacyMapDescriptor(rawActivity),
    ...(rawActivity.map || {}),
    ...(overrides.map || {})
  };

  return {
    schemaVersion: overrides.schemaVersion || rawActivity.schemaVersion || 1,
    id: overrides.id || rawActivity.id,
    title: overrides.title || rawActivity.title,
    engine: overrides.engine || rawActivity.engine || inferEngine(rawActivity),
    cumulativeGroup: overrides.cumulativeGroup ?? rawActivity.cumulativeGroup ?? null,
    sequence: overrides.sequence ?? rawActivity.sequence ?? null,
    promptText: overrides.promptText || rawActivity.promptText || null,
    targetNoun: overrides.targetNoun || rawActivity.targetNoun || inferTargetNoun(rawTargets),
    defaultMode: overrides.defaultMode || rawActivity.defaultMode || "word-bank",
    visibleAnswerLimit: overrides.visibleAnswerLimit ?? rawActivity.visibleAnswerLimit ?? null,
    memoryTrailNewTargetLimit: overrides.memoryTrailNewTargetLimit ?? rawActivity.memoryTrailNewTargetLimit ?? null,
    memoryTrailRequireAllTargets: overrides.memoryTrailRequireAllTargets ?? rawActivity.memoryTrailRequireAllTargets ?? false,
    memoryTrailAutoStart: overrides.memoryTrailAutoStart ?? rawActivity.memoryTrailAutoStart ?? false,
    memoryTrailSections: overrides.memoryTrailSections || rawActivity.memoryTrailSections || [],
    map,
    sources: overrides.sources || rawActivity.sources || [],
    targetLayers: overrides.targetLayers || rawActivity.targetLayers || [],
    targets: rawTargets.map((target) => normalizeTarget(target, overrides)),
    answerBankItems: (overrides.answerBankItems || rawTargets).map((target) => ({
      id: target.id,
      name: target.name
    }))
  };
}

export function normalizeTarget(feature, options = {}) {
  const kind = inferTargetKind(feature);
  const layer = getTargetLayer(kind, feature, options.targetLayers || []);

  return {
    ...feature,
    kind,
    targetType: kind,
    layerId: feature.layerId || layer?.id || null,
    sourceFeatureId: feature.sourceFeatureId || feature.mapShapeId || (kind === targetKinds.shape ? feature.id : undefined),
    label: normalizeLabel(feature, kind, options),
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

function normalizeLabel(feature, kind, options) {
  const anchorOverrides = options.labelAnchors || {};

  return {
    anchor: feature.labelAnchor || feature.label?.anchor || anchorOverrides[feature.id] || getDefaultLabelAnchor(feature, kind),
    offset: feature.labelOffset || null,
    fontSize: feature.labelFontSize || null,
    rotation: feature.labelRotation || 0
  };
}

function getTargetLayer(kind, feature, targetLayers) {
  if (feature.layerId) {
    return targetLayers.find((layer) => layer.id === feature.layerId) || null;
  }

  return targetLayers.find((layer) => layer.kind === kind || layer.targetType === kind) || null;
}

function getDefaultLabelAnchor(feature, kind) {
  if (kind === targetKinds.point && Number.isFinite(feature.lon) && Number.isFinite(feature.lat)) {
    return [feature.lon, feature.lat];
  }

  return feature.labelPosition || null;
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
