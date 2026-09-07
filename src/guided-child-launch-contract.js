export const GUIDED_CHILD_LAUNCH_STORAGE_KEY = "mappaGuidedChildLaunch";
export const GUIDED_CHILD_LAUNCH_VERSION = 2;

const validStatuses = new Set(["launched", "completed"]);
const validEntrySources = new Set(["guided-learning", "evidence-driven-primary-learn"]);

function uniqueStrings(values = []) {
  return [...new Set((Array.isArray(values) ? values : [])
    .map((value) => String(value || "").trim())
    .filter(Boolean))];
}

function cloneJson(value, fallback = null) {
  if (value === undefined || value === null) return fallback;
  try {
    return JSON.parse(JSON.stringify(value));
  } catch {
    return fallback;
  }
}

function normalizeChild(value = {}) {
  const source = value && typeof value === "object" ? value : {};
  return {
    type: String(source.type || "").trim(),
    destinationKind: String(source.destinationKind || "").trim(),
    activityId: String(source.activityId || "").trim() || null,
    journeyId: String(source.journeyId || "").trim() || null,
    stepId: String(source.stepId || "").trim() || null,
    regionId: String(source.regionId || "").trim() || null,
    featureId: String(source.featureId || "").trim() || null,
    featureFamily: String(source.featureFamily || "").trim() || null,
    cohortId: String(source.cohortId || "").trim() || null,
    targetType: String(source.targetType || "").trim() || null,
    teachingMessage: String(source.teachingMessage || "").trim() || null,
    targetIds: uniqueStrings(source.targetIds),
    targetLabels: uniqueStrings(source.targetLabels),
    targetConceptIds: uniqueStrings(source.targetConceptIds),
    newTargetIds: uniqueStrings(source.newTargetIds),
    teachingTargetIds: uniqueStrings(source.teachingTargetIds),
    introductionBlockIds: uniqueStrings(source.introductionBlockIds),
    challengeIds: uniqueStrings(source.challengeIds),
    camera: cloneJson(source.camera),
    geometry: cloneJson(source.geometry),
    persistentLearningCamera: cloneJson(source.persistentLearningCamera),
    physicalReviewActivity: source.physicalReviewActivity === true,
    sourceActivityIds: uniqueStrings(source.sourceActivityIds),
    guidedPhysicalCheckpoint: cloneJson(source.guidedPhysicalCheckpoint)
  };
}

export function createGuidedChildLaunchContract(value = {}) {
  const source = value && typeof value === "object" ? value : {};
  const orchestrationBlockId = String(source.orchestrationBlockId || "").trim();
  const child = normalizeChild(source.child);
  if (!orchestrationBlockId || !child.type || !child.destinationKind) {
    throw new TypeError("Guided child provenance needs a block ID, child type, and destination kind.");
  }
  return {
    version: GUIDED_CHILD_LAUNCH_VERSION,
    source: "guided-learning",
    entrySource: validEntrySources.has(source.entrySource) ? source.entrySource : "guided-learning",
    orchestrationId: String(source.orchestrationId || "").trim(),
    orchestrationBlockId,
    launchReason: String(source.launchReason || "").trim() || "guided-orchestration",
    targetedNeed: cloneJson(source.targetedNeed),
    status: validStatuses.has(source.status) ? source.status : "launched",
    returnTo: "guided-learning",
    child
  };
}

function resolveStorage(storage) {
  if (storage !== undefined) return storage;
  try {
    return globalThis.localStorage;
  } catch {
    return null;
  }
}

export function loadGuidedChildLaunchContract(storage) {
  try {
    const raw = resolveStorage(storage)?.getItem?.(GUIDED_CHILD_LAUNCH_STORAGE_KEY);
    if (!raw) return null;
    return createGuidedChildLaunchContract(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function saveGuidedChildLaunchContract(contract, storage) {
  const normalized = createGuidedChildLaunchContract(contract);
  try {
    resolveStorage(storage)?.setItem?.(GUIDED_CHILD_LAUNCH_STORAGE_KEY, JSON.stringify(normalized));
  } catch {
    // The live Guided handoff remains usable when durable storage is unavailable.
  }
  return normalized;
}

export function completeGuidedChildLaunchContract(blockId, storage) {
  const contract = loadGuidedChildLaunchContract(storage);
  if (!contract || contract.orchestrationBlockId !== String(blockId || "").trim()) return contract;
  if (contract.status === "completed") return contract;
  return saveGuidedChildLaunchContract({ ...contract, status: "completed" }, storage);
}

export function clearGuidedChildLaunchContract(storage) {
  try {
    resolveStorage(storage)?.removeItem?.(GUIDED_CHILD_LAUNCH_STORAGE_KEY);
  } catch {
    // Runtime callers still clear their in-memory handoff.
  }
  return null;
}
