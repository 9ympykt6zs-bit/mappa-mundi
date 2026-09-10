export const UNITED_STATES_GUIDED_POLITICAL_CAMERA_CONTEXT = "guided-political-section";
export const UNITED_STATES_GUIDED_STATE_FOCUS_CAMERA_CONTEXT = "guided-political-state-focus";
export const UNITED_STATES_GUIDED_DISTANT_SECTION_ZOOM_THRESHOLD = 4.7;
export const UNITED_STATES_GUIDED_STATE_FOCUS_MIN_ZOOM_GAIN = 0.2;

const stateSectionPattern = /^us-states-(\d{2})$/;

function uniqueStrings(values = []) {
  return [...new Set((Array.isArray(values) ? values : [])
    .map((value) => String(value || "").trim())
    .filter(Boolean))];
}

function normalizeCamera(value = null) {
  const center = Array.isArray(value?.center) && value.center.length >= 2
    ? [Number(value.center[0]), Number(value.center[1])]
    : null;
  const zoom = Number(value?.zoom);
  if (!center || !center.every(Number.isFinite) || !Number.isFinite(zoom)) return null;
  return {
    center,
    zoom,
    bearing: Number.isFinite(Number(value?.bearing)) ? Number(value.bearing) : 0,
    pitch: Number.isFinite(Number(value?.pitch)) ? Number(value.pitch) : 0,
    duration: Number.isFinite(Number(value?.duration)) ? Number(value.duration) : 650
  };
}

function getActiveSectionItems(activityId, plan = {}) {
  const newItems = (Array.isArray(plan?.newItems) ? plan.newItems : [])
    .filter((item) => item?.homeActivityId === activityId);
  if (newItems.length > 0) return newItems;
  return (Array.isArray(plan?.playItems) ? plan.playItems : [])
    .filter((item) => item?.homeActivityId === activityId);
}

function getActiveStateIds(items = []) {
  return uniqueStrings(items.map((item) => (
    item?.type === "capital" ? item.relatedStateTargetId : item?.targetId
  )));
}

function findAuthoredOverride(overrides = [], activeStateIds = []) {
  if (activeStateIds.length === 0) return null;
  return (Array.isArray(overrides) ? overrides : []).find((candidate) => {
    const stateIds = uniqueStrings(candidate?.stateIds);
    return stateIds.length === activeStateIds.length
      && stateIds.every((stateId) => activeStateIds.includes(stateId))
      && normalizeCamera(candidate?.camera);
  }) || null;
}

export function createUnitedStatesGuidedPoliticalCameraDecision({
  activityId = "",
  plan = {},
  activityMap = {}
} = {}) {
  const match = String(activityId || "").match(stateSectionPattern);
  if (!match || plan?.sessionType !== "learning-session") return null;

  const sectionId = match[1];
  const items = getActiveSectionItems(activityId, plan);
  const activeTargetIds = uniqueStrings(items.map((item) => item?.targetId));
  const activeStateIds = getActiveStateIds(items);
  const focusTargetIds = uniqueStrings([...activeStateIds, ...activeTargetIds]);

  if (activeTargetIds.length === 0) return null;

  if (sectionId === "11") {
    return {
      sectionId: activityId,
      sectionNumber: 11,
      mode: "preserve-special",
      cameraSource: "existing-alaska-hawaii-handling",
      activeTargetIds,
      activeStateIds,
      focusTargetIds,
      camera: null
    };
  }

  const authoredOverride = findAuthoredOverride(
    activityMap?.guidedLearningCameraOverrides,
    activeStateIds
  );
  const camera = normalizeCamera(authoredOverride?.camera);
  if (authoredOverride && camera) {
    return {
      sectionId: activityId,
      sectionNumber: Number(sectionId),
      mode: "override",
      cameraSource: "authored-override",
      overrideId: String(authoredOverride.id || "").trim() || null,
      activeTargetIds,
      activeStateIds,
      focusTargetIds,
      camera
    };
  }

  return {
    sectionId: activityId,
    sectionNumber: Number(sectionId),
    mode: "fit",
    cameraSource: "section-fit",
    overrideId: null,
    activeTargetIds,
    activeStateIds,
    focusTargetIds,
    camera: null
  };
}

export function isManagedUnitedStatesGuidedPoliticalCamera(decision) {
  return decision?.mode === "override" || decision?.mode === "fit";
}

export function createUnitedStatesGuidedStateFocusDecision({
  guidedPoliticalCamera = null,
  selection = {},
  item = null
} = {}) {
  if (
    !isManagedUnitedStatesGuidedPoliticalCamera(guidedPoliticalCamera)
    || guidedPoliticalCamera.sectionNumber === 11
    || guidedPoliticalCamera.cameraSource === "authored-override"
    || !["guided", "place_to_name"].includes(selection?.promptType)
    || !item
  ) {
    return null;
  }

  const sectionZoom = Number(guidedPoliticalCamera.sectionFittedCamera?.zoom);
  if (!Number.isFinite(sectionZoom) || sectionZoom >= UNITED_STATES_GUIDED_DISTANT_SECTION_ZOOM_THRESHOLD) {
    return null;
  }

  const stateTargetId = item.type === "capital"
    ? String(item.relatedStateTargetId || "").trim()
    : item.type === "state"
      ? String(item.targetId || "").trim()
      : "";
  if (!stateTargetId) return null;

  return {
    stateTargetId,
    promptTargetId: String(selection.targetId || item.targetId || "").trim(),
    promptType: selection.promptType,
    zoomThreshold: UNITED_STATES_GUIDED_DISTANT_SECTION_ZOOM_THRESHOLD,
    minZoomGain: UNITED_STATES_GUIDED_STATE_FOCUS_MIN_ZOOM_GAIN,
    sectionZoom,
    cameraContext: UNITED_STATES_GUIDED_STATE_FOCUS_CAMERA_CONTEXT,
    cameraSource: "guided-political-distant-section-correction"
  };
}
