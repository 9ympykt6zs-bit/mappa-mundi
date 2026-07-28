export const MAP_RECONSTRUCTION_REGION_IDS = Object.freeze({
  REBUILD_NEW_ENGLAND: "rebuild-new-england",
  REBUILD_MID_ATLANTIC: "rebuild-mid-atlantic",
  REBUILD_SOUTHEAST_ATLANTIC: "rebuild-southeast-atlantic",
  REBUILD_GULF_COAST: "rebuild-gulf-coast",
  REBUILD_GREAT_LAKES: "rebuild-great-lakes",
  REBUILD_UPPER_MIDWEST_PLAINS: "rebuild-upper-midwest-plains",
  REBUILD_SOUTH_CENTRAL: "rebuild-south-central",
  REBUILD_NORTHERN_ROCKIES: "rebuild-northern-rockies",
  REBUILD_SOUTHWEST: "rebuild-southwest",
  REBUILD_PACIFIC_COAST: "rebuild-pacific-coast"
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

const SOUTHEAST_ATLANTIC_STATE_IDS = Object.freeze([
  "north-carolina",
  "south-carolina",
  "georgia",
  "florida"
]);

const GULF_COAST_STATE_IDS = Object.freeze([
  "alabama",
  "mississippi",
  "louisiana",
  "texas"
]);

const GREAT_LAKES_STATE_IDS = Object.freeze([
  "ohio",
  "michigan",
  "indiana",
  "illinois",
  "wisconsin"
]);

const UPPER_MIDWEST_PLAINS_STATE_IDS = Object.freeze([
  "minnesota",
  "iowa",
  "missouri",
  "north-dakota",
  "south-dakota",
  "nebraska",
  "kansas"
]);

const SOUTH_CENTRAL_STATE_IDS = Object.freeze([
  "kentucky",
  "tennessee",
  "arkansas",
  "oklahoma"
]);

const NORTHERN_ROCKIES_STATE_IDS = Object.freeze([
  "montana",
  "idaho",
  "wyoming"
]);

const SOUTHWEST_STATE_IDS = Object.freeze([
  "colorado",
  "utah",
  "nevada",
  "arizona",
  "new-mexico"
]);

const PACIFIC_COAST_STATE_IDS = Object.freeze([
  "washington",
  "oregon",
  "california"
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

function createRegionDefinition({
  id,
  title,
  regionName,
  prompt,
  stateIds,
  feedbackRules,
  workspace,
  evaluation,
  smallLabelStateIds = [],
  completedLabelOffsets = {}
}) {
  return Object.freeze({
    id,
    title,
    regionName,
    prompt,
    successMessage: `You rebuilt ${regionName} correctly.`,
    correctPlacementMessage: `This is how ${regionName} fits together.`,
    stateIds,
    smallLabelStateIds: Object.freeze([...smallLabelStateIds]),
    completedLabelOffsets: Object.freeze(Object.fromEntries(
      Object.entries(completedLabelOffsets).map(([stateId, offset]) => [
        stateId,
        Object.freeze({ ...offset })
      ])
    )),
    feedbackRules: Object.freeze(feedbackRules.map((rule) => Object.freeze({
      ...rule,
      stateIds: rule.stateIds ? Object.freeze([...rule.stateIds]) : undefined,
      referenceIds: rule.referenceIds ? Object.freeze([...rule.referenceIds]) : undefined
    }))),
    workspace: Object.freeze({ ...workspace }),
    evaluation: Object.freeze({ ...evaluation })
  });
}

const DEFAULT_EVALUATION = Object.freeze({
  wellDistanceRatio: 0.2,
  closeDistanceRatio: 0.5,
  wellVectorErrorRatio: 0.22,
  closeVectorErrorRatio: 0.58,
  excessiveOverlapRatio: 0.16
});

const REBUILD_SOUTHEAST_ATLANTIC = createRegionDefinition({
  id: MAP_RECONSTRUCTION_REGION_IDS.REBUILD_SOUTHEAST_ATLANTIC,
  title: "Rebuild the Southeast Atlantic",
  regionName: "the Southeast Atlantic",
  prompt: "Arrange the four states to rebuild the Southeast Atlantic.",
  stateIds: SOUTHEAST_ATLANTIC_STATE_IDS,
  feedbackRules: [
    {
      type: "axis-order",
      axis: "y",
      stateIds: ["north-carolina", "south-carolina", "georgia", "florida"],
      message: "South Carolina belongs between North Carolina and Georgia."
    },
    {
      type: "relative-position",
      subjectId: "florida",
      referenceIds: ["georgia"],
      direction: "southeast",
      message: "Florida belongs south of Georgia."
    },
    {
      type: "relative-position",
      subjectId: "georgia",
      referenceIds: ["south-carolina"],
      direction: "west",
      message: "Georgia belongs west of South Carolina."
    }
  ],
  workspace: { width: 1000, height: 760, padding: 66 },
  evaluation: { ...DEFAULT_EVALUATION, alignmentMinimumPieces: 2 }
});

const REBUILD_GULF_COAST = createRegionDefinition({
  id: MAP_RECONSTRUCTION_REGION_IDS.REBUILD_GULF_COAST,
  title: "Rebuild the Gulf Coast",
  regionName: "the Gulf Coast",
  prompt: "Arrange the four states to rebuild the Gulf Coast.",
  stateIds: GULF_COAST_STATE_IDS,
  feedbackRules: [
    {
      type: "axis-order",
      axis: "x",
      stateIds: ["texas", "louisiana", "mississippi", "alabama"],
      message: "Mississippi belongs between Louisiana and Alabama."
    },
    {
      type: "relative-position",
      subjectId: "louisiana",
      referenceIds: ["texas"],
      direction: "east",
      message: "Louisiana belongs east of Texas."
    }
  ],
  workspace: { width: 1160, height: 680, padding: 64 },
  evaluation: { ...DEFAULT_EVALUATION, alignmentMinimumPieces: 2 }
});

const REBUILD_GREAT_LAKES = createRegionDefinition({
  id: MAP_RECONSTRUCTION_REGION_IDS.REBUILD_GREAT_LAKES,
  title: "Rebuild the Great Lakes",
  regionName: "the Great Lakes",
  prompt: "Arrange the five states to rebuild the Great Lakes.",
  stateIds: GREAT_LAKES_STATE_IDS,
  feedbackRules: [
    {
      type: "relative-position",
      subjectId: "michigan",
      referenceIds: ["indiana", "ohio"],
      direction: "north",
      message: "Michigan belongs north of Indiana and Ohio."
    },
    {
      type: "relative-position",
      subjectId: "wisconsin",
      referenceIds: ["illinois"],
      direction: "north",
      message: "Wisconsin belongs north of Illinois."
    },
    {
      type: "relative-position",
      subjectId: "michigan",
      referenceIds: ["wisconsin"],
      direction: "east",
      message: "Michigan belongs east of Wisconsin."
    },
    {
      type: "axis-order",
      axis: "x",
      stateIds: ["illinois", "indiana", "ohio"],
      message: "Indiana belongs between Illinois and Ohio."
    }
  ],
  workspace: { width: 1040, height: 780, padding: 66 },
  evaluation: { ...DEFAULT_EVALUATION, alignmentMinimumPieces: 3 }
});

const REBUILD_UPPER_MIDWEST_PLAINS = createRegionDefinition({
  id: MAP_RECONSTRUCTION_REGION_IDS.REBUILD_UPPER_MIDWEST_PLAINS,
  title: "Rebuild the Upper Midwest and Plains",
  regionName: "the Upper Midwest and Plains",
  prompt: "Arrange the seven states to rebuild the Upper Midwest and Plains.",
  stateIds: UPPER_MIDWEST_PLAINS_STATE_IDS,
  feedbackRules: [
    {
      type: "axis-order",
      axis: "y",
      stateIds: ["north-dakota", "south-dakota", "nebraska", "kansas"],
      message: "North Dakota belongs north of South Dakota."
    },
    {
      type: "axis-order",
      axis: "y",
      stateIds: ["minnesota", "iowa", "missouri"],
      message: "Iowa belongs between Minnesota and Missouri."
    },
    {
      type: "relative-position",
      subjectId: "minnesota",
      referenceIds: ["north-dakota", "south-dakota"],
      direction: "east",
      message: "Minnesota belongs east of North Dakota and South Dakota."
    },
    {
      type: "relative-position",
      subjectId: "nebraska",
      referenceIds: ["iowa", "missouri"],
      direction: "west",
      message: "Nebraska belongs west of Iowa and Missouri."
    },
    {
      type: "relative-position",
      subjectId: "kansas",
      referenceIds: ["missouri"],
      direction: "west",
      message: "Kansas belongs west of Missouri."
    }
  ],
  workspace: { width: 1040, height: 800, padding: 62 },
  evaluation: { ...DEFAULT_EVALUATION, alignmentMinimumPieces: 4 }
});

const REBUILD_SOUTH_CENTRAL = createRegionDefinition({
  id: MAP_RECONSTRUCTION_REGION_IDS.REBUILD_SOUTH_CENTRAL,
  title: "Rebuild the South Central States",
  regionName: "the South Central States",
  prompt: "Arrange the four states to rebuild the South Central States.",
  stateIds: SOUTH_CENTRAL_STATE_IDS,
  feedbackRules: [
    {
      type: "relative-position",
      subjectId: "kentucky",
      referenceIds: ["tennessee"],
      direction: "north",
      message: "Kentucky belongs north of Tennessee."
    },
    {
      type: "axis-order",
      axis: "x",
      stateIds: ["oklahoma", "arkansas", "tennessee"],
      message: "Arkansas belongs between Oklahoma and Tennessee."
    }
  ],
  workspace: { width: 1040, height: 700, padding: 68 },
  evaluation: { ...DEFAULT_EVALUATION, alignmentMinimumPieces: 2 }
});

const REBUILD_NORTHERN_ROCKIES = createRegionDefinition({
  id: MAP_RECONSTRUCTION_REGION_IDS.REBUILD_NORTHERN_ROCKIES,
  title: "Rebuild the Northern Rockies",
  regionName: "the Northern Rockies",
  prompt: "Arrange the three states to rebuild the Northern Rockies.",
  stateIds: NORTHERN_ROCKIES_STATE_IDS,
  feedbackRules: [
    {
      type: "relative-position",
      subjectId: "montana",
      referenceIds: ["wyoming"],
      direction: "north",
      message: "Montana belongs north of Wyoming."
    },
    {
      type: "relative-position",
      subjectId: "idaho",
      referenceIds: ["montana", "wyoming"],
      direction: "west",
      message: "Idaho belongs west of Montana and Wyoming."
    }
  ],
  workspace: { width: 940, height: 760, padding: 58 },
  evaluation: { ...DEFAULT_EVALUATION, alignmentMinimumPieces: 2 }
});

const REBUILD_SOUTHWEST = createRegionDefinition({
  id: MAP_RECONSTRUCTION_REGION_IDS.REBUILD_SOUTHWEST,
  title: "Rebuild the Southwest",
  regionName: "the Southwest",
  prompt: "Arrange the five states to rebuild the Southwest.",
  stateIds: SOUTHWEST_STATE_IDS,
  feedbackRules: [
    {
      type: "relative-position",
      subjectId: "nevada",
      referenceIds: ["utah"],
      direction: "west",
      message: "Nevada belongs west of Utah."
    },
    {
      type: "relative-position",
      subjectId: "utah",
      referenceIds: ["arizona"],
      direction: "north",
      message: "Utah belongs north of Arizona."
    },
    {
      type: "relative-position",
      subjectId: "colorado",
      referenceIds: ["utah"],
      direction: "east",
      message: "Colorado belongs east of Utah."
    },
    {
      type: "relative-position",
      subjectId: "new-mexico",
      referenceIds: ["colorado"],
      direction: "south",
      message: "New Mexico belongs south of Colorado."
    },
    {
      type: "relative-position",
      subjectId: "arizona",
      referenceIds: ["new-mexico"],
      direction: "west",
      message: "Arizona belongs west of New Mexico."
    }
  ],
  workspace: { width: 1040, height: 780, padding: 62 },
  evaluation: { ...DEFAULT_EVALUATION, alignmentMinimumPieces: 3 }
});

const REBUILD_PACIFIC_COAST = createRegionDefinition({
  id: MAP_RECONSTRUCTION_REGION_IDS.REBUILD_PACIFIC_COAST,
  title: "Rebuild the Pacific Coast",
  regionName: "the Pacific Coast",
  prompt: "Arrange the three states to rebuild the Pacific Coast.",
  stateIds: PACIFIC_COAST_STATE_IDS,
  feedbackRules: [
    {
      type: "axis-order",
      axis: "y",
      stateIds: ["washington", "oregon", "california"],
      message: "Oregon belongs between Washington and California."
    }
  ],
  workspace: { width: 820, height: 900, padding: 54 },
  evaluation: { ...DEFAULT_EVALUATION, alignmentMinimumPieces: 2 }
});

const REGIONS = Object.freeze({
  [REBUILD_NEW_ENGLAND.id]: REBUILD_NEW_ENGLAND,
  [REBUILD_MID_ATLANTIC.id]: REBUILD_MID_ATLANTIC,
  [REBUILD_SOUTHEAST_ATLANTIC.id]: REBUILD_SOUTHEAST_ATLANTIC,
  [REBUILD_GULF_COAST.id]: REBUILD_GULF_COAST,
  [REBUILD_GREAT_LAKES.id]: REBUILD_GREAT_LAKES,
  [REBUILD_UPPER_MIDWEST_PLAINS.id]: REBUILD_UPPER_MIDWEST_PLAINS,
  [REBUILD_SOUTH_CENTRAL.id]: REBUILD_SOUTH_CENTRAL,
  [REBUILD_NORTHERN_ROCKIES.id]: REBUILD_NORTHERN_ROCKIES,
  [REBUILD_SOUTHWEST.id]: REBUILD_SOUTHWEST,
  [REBUILD_PACIFIC_COAST.id]: REBUILD_PACIFIC_COAST
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

export function validateMapReconstructionCoverage(regions, contiguousStateIds) {
  const errors = [];
  const regionList = Array.isArray(regions) ? regions : [];
  const expectedIds = new Set(contiguousStateIds || []);
  const memberships = new Map();
  regionList.forEach((region) => {
    (region?.stateIds || []).forEach((stateId) => {
      memberships.set(stateId, [...(memberships.get(stateId) || []), region?.id || "unknown"]);
    });
  });
  if (regionList.length !== 10) {
    errors.push(`Expected 10 reconstruction regions; found ${regionList.length}.`);
  }
  for (const [stateId, regionIds] of memberships) {
    if (regionIds.length > 1) {
      errors.push(`${stateId} appears in multiple reconstruction regions: ${regionIds.join(", ")}.`);
    }
    if (!expectedIds.has(stateId)) {
      errors.push(`${stateId} is not a contiguous-state reconstruction target.`);
    }
  }
  for (const stateId of expectedIds) {
    if (!memberships.has(stateId)) {
      errors.push(`${stateId} is missing from Map Reconstruction.`);
    }
  }
  if (memberships.size !== expectedIds.size) {
    errors.push(`Expected ${expectedIds.size} unique state memberships; found ${memberships.size}.`);
  }
  return errors;
}

export function validateMapReconstructionRegion(region) {
  const errors = [];
  if (!region?.id) errors.push("Region ID is required.");
  if (!region?.title) errors.push("Region title is required.");
  if (!region?.successMessage) errors.push("Region success message is required.");
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
    if (rule.type === "axis-order"
      && (!["x", "y"].includes(rule.axis) || (rule.stateIds || []).length < 2)) {
      errors.push("Axis-order feedback rules require an x or y axis and at least two states.");
    }
  }
  return errors;
}
