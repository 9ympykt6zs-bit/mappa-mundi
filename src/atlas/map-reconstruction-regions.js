export const MAP_RECONSTRUCTION_REGION_IDS = Object.freeze({
  REBUILD_NEW_ENGLAND: "rebuild-new-england",
  REBUILD_MID_ATLANTIC: "rebuild-mid-atlantic"
});

const NEW_ENGLAND_STATE_IDS = Object.freeze([
  "maine",
  "new-hampshire",
  "vermont",
  "massachusetts",
  "rhode-island",
  "connecticut"
]);

const MID_ATLANTIC_STATE_IDS = Object.freeze([
  "new-york",
  "pennsylvania",
  "new-jersey",
  "delaware",
  "maryland",
  "west-virginia",
  "virginia"
]);

const REBUILD_NEW_ENGLAND = Object.freeze({
  id: MAP_RECONSTRUCTION_REGION_IDS.REBUILD_NEW_ENGLAND,
  title: "Rebuild New England",
  regionName: "New England",
  prompt: "Arrange the six states to rebuild New England.",
  successMessage: "You rebuilt New England correctly.",
  correctPlacementMessage: "This is how New England fits together.",
  stateIds: NEW_ENGLAND_STATE_IDS,
  smallLabelStateIds: Object.freeze(["rhode-island"]),
  completedLabelOffsets: Object.freeze({
    vermont: Object.freeze({ x: -50, y: -10 }),
    "new-hampshire": Object.freeze({ x: 45, y: 15 }),
    massachusetts: Object.freeze({ x: 70, y: 10 }),
    connecticut: Object.freeze({ x: -65, y: 30 }),
    "rhode-island": Object.freeze({ x: 70, y: 35 })
  }),
  feedbackRules: Object.freeze([
    Object.freeze({
      type: "swapped-pair",
      stateIds: Object.freeze(["vermont", "new-hampshire"]),
      message: "Vermont and New Hampshire are reversed."
    })
  ]),
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

const REBUILD_MID_ATLANTIC = Object.freeze({
  id: MAP_RECONSTRUCTION_REGION_IDS.REBUILD_MID_ATLANTIC,
  title: "Rebuild the Mid-Atlantic",
  regionName: "Mid-Atlantic",
  prompt: "Arrange the seven states to rebuild the Mid-Atlantic.",
  successMessage: "You rebuilt the Mid-Atlantic correctly.",
  correctPlacementMessage: "This is how the Mid-Atlantic fits together.",
  stateIds: MID_ATLANTIC_STATE_IDS,
  smallLabelStateIds: Object.freeze(["new-jersey", "delaware"]),
  completedLabelOffsets: Object.freeze({
    "new-jersey": Object.freeze({ x: 54, y: 4 }),
    delaware: Object.freeze({ x: 58, y: 24 }),
    maryland: Object.freeze({ x: 12, y: 22 })
  }),
  feedbackRules: Object.freeze([
    Object.freeze({
      type: "swapped-pair",
      stateIds: Object.freeze(["pennsylvania", "new-jersey"]),
      message: "New Jersey belongs east of Pennsylvania."
    }),
    Object.freeze({
      type: "relative-position",
      subjectId: "new-york",
      referenceIds: Object.freeze(["pennsylvania", "new-jersey"]),
      direction: "north",
      message: "New York belongs north of Pennsylvania and New Jersey."
    }),
    Object.freeze({
      type: "relative-position",
      subjectId: "new-jersey",
      referenceIds: Object.freeze(["pennsylvania"]),
      direction: "east",
      message: "New Jersey belongs east of Pennsylvania."
    }),
    Object.freeze({
      type: "relative-position",
      subjectId: "delaware",
      referenceIds: Object.freeze(["new-jersey"]),
      direction: "south",
      message: "Delaware belongs south of New Jersey."
    }),
    Object.freeze({
      type: "relative-position",
      subjectId: "maryland",
      referenceIds: Object.freeze(["delaware"]),
      direction: "west",
      message: "Maryland belongs south and west of Delaware."
    }),
    Object.freeze({
      type: "relative-position",
      subjectId: "west-virginia",
      referenceIds: Object.freeze(["virginia"]),
      direction: "west",
      message: "West Virginia belongs west of Virginia."
    })
  ]),
  workspace: Object.freeze({
    width: 1120,
    height: 760,
    padding: 64
  }),
  evaluation: Object.freeze({
    wellDistanceRatio: 0.2,
    closeDistanceRatio: 0.5,
    wellVectorErrorRatio: 0.22,
    closeVectorErrorRatio: 0.58,
    excessiveOverlapRatio: 0.16,
    alignmentMinimumPieces: 4
  })
});

const REGIONS = Object.freeze({
  [REBUILD_NEW_ENGLAND.id]: REBUILD_NEW_ENGLAND,
  [REBUILD_MID_ATLANTIC.id]: REBUILD_MID_ATLANTIC
});

function copyRegion(region) {
  if (!region) return null;
  return {
    ...region,
    stateIds: [...region.stateIds],
    smallLabelStateIds: [...(region.smallLabelStateIds || [])],
    completedLabelOffsets: Object.fromEntries(
      Object.entries(region.completedLabelOffsets || {}).map(([stateId, offset]) => [
        stateId,
        { ...offset }
      ])
    ),
    feedbackRules: (region.feedbackRules || []).map((rule) => ({
      ...rule,
      stateIds: rule.stateIds ? [...rule.stateIds] : undefined,
      referenceIds: rule.referenceIds ? [...rule.referenceIds] : undefined
    })),
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
  const stateIds = new Set(region?.stateIds || []);
  for (const rule of region?.feedbackRules || []) {
    const referencedIds = [
      ...(rule.stateIds || []),
      rule.subjectId,
      ...(rule.referenceIds || [])
    ].filter(Boolean);
    if (referencedIds.some((stateId) => !stateIds.has(stateId))) {
      errors.push(`Feedback rule ${rule.type || "unknown"} references a state outside the region.`);
    }
  }
  return errors;
}
