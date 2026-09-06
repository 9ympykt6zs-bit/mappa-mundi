import { getMapReconstructionRegion } from "./atlas/map-reconstruction-regions.js";
import { prepareMapReconstructionGeometry } from "./atlas/map-reconstruction-geometry.js";
import { getBorderingStates } from "./atlas/united-states-atlas-queries.js";

// Match the existing Guided state sections, not the standalone region partitions.
// The content check verifies these IDs against the authored activity JSON.
const sections = [
  ["Northeast coast", ["maine", "new-hampshire", "massachusetts", "rhode-island", "connecticut"]],
  ["Northeast interior", ["vermont", "new-york", "new-jersey", "pennsylvania", "delaware"]],
  ["Appalachians and Carolinas", ["maryland", "virginia", "west-virginia", "north-carolina", "south-carolina"]],
  ["Southeast and Gulf", ["georgia", "florida", "alabama", "mississippi", "louisiana"]],
  ["Great Lakes and Tennessee Valley", ["michigan", "ohio", "indiana", "kentucky", "tennessee"]],
  ["Mississippi Valley", ["wisconsin", "illinois", "iowa", "missouri", "arkansas"]],
  ["Northern Plains", ["minnesota", "north-dakota", "south-dakota", "wyoming", "nebraska"]],
  ["Southern Plains and Rockies", ["kansas", "oklahoma", "texas", "colorado", "new-mexico"]],
  ["Southwest and California", ["utah", "arizona", "nevada", "california"]],
  ["Northwest", ["montana", "idaho", "washington", "oregon"]]
];

export const GUIDED_RECONSTRUCTION_CHECKPOINTS = Object.freeze(sections.map(([name, stateIds], index) => {
  const number = index + 1;
  const sectionId = `us-states-${String(number).padStart(2, "0")}`;
  return Object.freeze({
    number,
    // Retain the original completion identity for existing learners.
    blockId: index === 0 ? "us-guided:rebuild-new-england" : `us-guided:reconstruct-${sectionId}`,
    regionId: index === 0 ? "rebuild-new-england" : `guided-reconstruct-${sectionId}`,
    sectionId,
    name,
    stateIds: Object.freeze([...stateIds]),
    lockedStateIds: Object.freeze(sections.slice(0, index).flatMap(([, ids]) => ids))
  });
}));

export function getGuidedReconstructionRegion(regionId) {
  const checkpoint = GUIDED_RECONSTRUCTION_CHECKPOINTS.find((candidate) => candidate.regionId === regionId);
  if (!checkpoint) return null;
  const base = getMapReconstructionRegion("rebuild-new-england");
  return {
    ...base,
    id: checkpoint.regionId,
    title: `Rebuild ${checkpoint.name}`,
    regionName: checkpoint.name,
    prompt: checkpoint.number === 1
      ? "Arrange your first five states from memory."
      : `Add ${checkpoint.stateIds.length} new states beside the locked states.`,
    successMessage: "You placed the new states correctly.",
    correctPlacementMessage: "This is how the new states fit together.",
    stateIds: checkpoint.stateIds,
    lockedStateIds: checkpoint.lockedStateIds,
    checkpointNumber: checkpoint.number,
    feedbackRules: [],
    completedLabelOffsets: {},
    smallLabelStateIds: ["rhode-island", "delaware"]
  };
}

export function prepareGuidedReconstructionGeometry(featureCollection, region) {
  const geometry = prepareMapReconstructionGeometry(featureCollection, {
    ...region,
    stateIds: [...region.lockedStateIds, ...region.stateIds]
  });
  if (!region.lockedStateIds.length) return geometry;
  // Keep all prior states in the shared coordinate frame, but frame the current
  // practice window plus adjacent locked context rather than the whole country.
  const locked = new Set(region.lockedStateIds);
  const neighboringIds = region.stateIds.flatMap((id) => getBorderingStates(id)
    .map((state) => state.id).filter((id) => locked.has(id)));
  const focusIds = [...new Set([...region.stateIds, ...neighboringIds])];
  const bounds = focusIds.map((id) => {
    const piece = geometry.piecesById[id];
    return {
      minX: piece.correctPosition.x + piece.localBounds.minX,
      maxX: piece.correctPosition.x + piece.localBounds.maxX,
      minY: piece.correctPosition.y + piece.localBounds.minY,
      maxY: piece.correctPosition.y + piece.localBounds.maxY
    };
  });
  const diagonals = region.stateIds.map((id) => {
    const piece = geometry.piecesById[id];
    return Math.hypot(piece.width, piece.height);
  }).sort((a, b) => a - b);
  const referenceScale = diagonals[Math.floor(diagonals.length / 2)];
  const padding = Math.max(24, referenceScale * 0.6);
  const x = Math.min(...bounds.map((value) => value.minX)) - padding;
  const y = Math.min(...bounds.map((value) => value.minY)) - padding;
  return {
    ...geometry,
    stateIds: [...region.stateIds],
    medianStateDiagonal: referenceScale,
    workspace: {
      ...geometry.workspace,
      x, y,
      width: Math.max(...bounds.map((value) => value.maxX)) + padding - x,
      height: Math.max(...bounds.map((value) => value.maxY)) + padding - y
    }
  };
}
