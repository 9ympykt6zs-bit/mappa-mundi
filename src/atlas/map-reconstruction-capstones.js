import {
  listMapReconstructionRegions,
  validateMapReconstructionCoverage
} from "./map-reconstruction-regions.js";

export const MAP_RECONSTRUCTION_CAPSTONE_IDS = Object.freeze({
  REBUILD_LOWER_48: "rebuild-lower-48"
});

const EXCLUDED_STATE_IDS = Object.freeze(["alaska", "hawaii"]);

function deriveLower48StateIds(regions) {
  return [...new Set(
    regions.flatMap((region) => region.stateIds || [])
  )].sort();
}

const ORDINARY_REGIONS = listMapReconstructionRegions();
const LOWER_48_STATE_IDS = Object.freeze(deriveLower48StateIds(ORDINARY_REGIONS));

const REBUILD_LOWER_48 = Object.freeze({
  id: MAP_RECONSTRUCTION_CAPSTONE_IDS.REBUILD_LOWER_48,
  kind: "capstone",
  title: "Rebuild the Lower 48",
  regionName: "the Lower 48",
  prompt: "Arrange all 48 contiguous states to rebuild the Lower 48.",
  successMessage: "You rebuilt the Lower 48.",
  correctPlacementMessage: "This is how the contiguous United States fit together.",
  recommendation: "Regional practice recommended",
  stateIds: LOWER_48_STATE_IDS,
  workspace: Object.freeze({
    width: 1800,
    height: 1100,
    padding: 44
  }),
  camera: Object.freeze({
    minZoom: 1,
    maxZoom: 8,
    focusZoom: 4
  }),
  evaluation: Object.freeze({
    placementWeight: 0.45,
    adjacencyWeight: 0.3,
    regionalStructureWeight: 0.15,
    integrityWeight: 0.1,
    successScore: 90,
    successAdjacency: 90,
    successRegionalStructure: 90,
    successLargestComponent: 46,
    translationMinimumPieces: 24,
    scaleMinimumPieces: 36,
    minimumScaleRatio: 0.85,
    maximumScaleRatio: 1.18
  })
});

const CAPSTONES = Object.freeze({
  [REBUILD_LOWER_48.id]: REBUILD_LOWER_48
});

function copyCapstone(capstone) {
  if (!capstone) return null;
  return {
    ...capstone,
    stateIds: [...capstone.stateIds],
    workspace: { ...capstone.workspace },
    camera: { ...capstone.camera },
    evaluation: { ...capstone.evaluation }
  };
}

export function getMapReconstructionCapstone(capstoneId) {
  const normalizedId = String(capstoneId || "").trim().toLowerCase();
  return copyCapstone(CAPSTONES[normalizedId]);
}

export function listMapReconstructionCapstones() {
  return Object.values(CAPSTONES).map(copyCapstone);
}

export function validateLower48Capstone(capstone, options = {}) {
  const errors = [];
  const ordinaryRegions = options.regions || listMapReconstructionRegions();
  const expectedStateIds = options.contiguousStateIds
    ? [...options.contiguousStateIds]
    : deriveLower48StateIds(ordinaryRegions);
  const geometryStateIds = options.geometryStateIds
    ? new Set(options.geometryStateIds)
    : null;
  const stateIds = Array.isArray(capstone?.stateIds) ? capstone.stateIds : [];
  const uniqueStateIds = new Set(stateIds);

  errors.push(...validateMapReconstructionCoverage(ordinaryRegions, expectedStateIds));
  if (capstone?.id !== MAP_RECONSTRUCTION_CAPSTONE_IDS.REBUILD_LOWER_48) {
    errors.push("Lower 48 capstone ID is invalid.");
  }
  if (stateIds.length !== 48) {
    errors.push(`Lower 48 capstone must contain exactly 48 states; found ${stateIds.length}.`);
  }
  if (uniqueStateIds.size !== stateIds.length) {
    errors.push("Lower 48 capstone state IDs must be unique.");
  }
  for (const stateId of expectedStateIds) {
    if (!uniqueStateIds.has(stateId)) {
      errors.push(`${stateId} is missing from the Lower 48 capstone.`);
    }
  }
  for (const stateId of stateIds) {
    if (!expectedStateIds.includes(stateId)) {
      errors.push(`${stateId} is not a contiguous-state capstone target.`);
    }
    if (geometryStateIds && !geometryStateIds.has(stateId)) {
      errors.push(`${stateId} lacks canonical reconstruction geometry.`);
    }
  }
  for (const stateId of EXCLUDED_STATE_IDS) {
    if (uniqueStateIds.has(stateId)) {
      errors.push(`${stateId} must not appear in the Lower 48 capstone.`);
    }
  }
  return errors;
}

