export const MAP_RECONSTRUCTION_REGION_IDS = Object.freeze({
  REBUILD_NEW_ENGLAND: "rebuild-new-england"
});

const NEW_ENGLAND_STATE_IDS = Object.freeze([
  "maine",
  "new-hampshire",
  "vermont",
  "massachusetts",
  "rhode-island",
  "connecticut"
]);

const REBUILD_NEW_ENGLAND = Object.freeze({
  id: MAP_RECONSTRUCTION_REGION_IDS.REBUILD_NEW_ENGLAND,
  title: "Rebuild New England",
  prompt: "Arrange the six states to rebuild New England.",
  stateIds: NEW_ENGLAND_STATE_IDS,
  workspace: Object.freeze({
    width: 1000,
    height: 720,
    padding: 72
  }),
  evaluation: Object.freeze({
    wellDistanceRatio: 0.2,
    closeDistanceRatio: 0.48,
    wellVectorErrorRatio: 0.22,
    closeVectorErrorRatio: 0.55,
    excessiveOverlapRatio: 0.16,
    alignmentMinimumPieces: 3
  })
});

const REGIONS = Object.freeze({
  [REBUILD_NEW_ENGLAND.id]: REBUILD_NEW_ENGLAND
});

function copyRegion(region) {
  if (!region) return null;
  return {
    ...region,
    stateIds: [...region.stateIds],
    workspace: { ...region.workspace },
    evaluation: { ...region.evaluation }
  };
}

export function getMapReconstructionRegion(regionId) {
  const normalizedId = String(regionId || "").trim().toLowerCase();
  return copyRegion(REGIONS[normalizedId]);
}

export function listMapReconstructionRegions() {
  return Object.values(REGIONS).map(copyRegion);
}

export function validateMapReconstructionRegion(region) {
  const errors = [];
  if (!region?.id) errors.push("Region ID is required.");
  if (!region?.title) errors.push("Region title is required.");
  if (!Array.isArray(region?.stateIds) || !region.stateIds.length) {
    errors.push("Region state IDs are required.");
  } else if (new Set(region.stateIds).size !== region.stateIds.length) {
    errors.push("Region state IDs must be unique.");
  }
  if (!(region?.workspace?.width > 0) || !(region?.workspace?.height > 0)) {
    errors.push("Region workspace dimensions must be positive.");
  }
  return errors;
}
