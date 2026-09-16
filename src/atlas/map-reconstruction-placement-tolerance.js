export const MAP_RECONSTRUCTION_PLACEMENT_TOLERANCE = Object.freeze({
  mouseCssPixels: 32,
  touchCssPixels: 40
});

function finiteNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

export function getMapReconstructionPlacementToleranceCssPixels(pointerType) {
  return pointerType === "touch"
    ? MAP_RECONSTRUCTION_PLACEMENT_TOLERANCE.touchCssPixels
    : MAP_RECONSTRUCTION_PLACEMENT_TOLERANCE.mouseCssPixels;
}

export function getMapReconstructionTranslationErrorCssPixels(
  position,
  correctPosition,
  screenMatrix
) {
  if (!Number.isFinite(position?.x)
    || !Number.isFinite(position?.y)
    || !Number.isFinite(correctPosition?.x)
    || !Number.isFinite(correctPosition?.y)
    || !Number.isFinite(screenMatrix?.a)
    || !Number.isFinite(screenMatrix?.b)
    || !Number.isFinite(screenMatrix?.c)
    || !Number.isFinite(screenMatrix?.d)) return null;
  const { a, b, c, d } = screenMatrix;
  const deltaX = position.x - correctPosition.x;
  const deltaY = position.y - correctPosition.y;
  return Math.hypot(
    deltaX * a + deltaY * c,
    deltaX * b + deltaY * d
  );
}

export function getMapReconstructionPlacementSnapTarget(options = {}) {
  const pointerType = String(options.pointerType || "");
  if (!["mouse", "touch", "pen"].includes(pointerType)) return null;
  if (finiteNumber(options.selectedPieceCount, 1) !== 1) return null;
  const errorCssPixels = getMapReconstructionTranslationErrorCssPixels(
    options.position,
    options.piece?.correctPosition,
    options.screenMatrix
  );
  if (errorCssPixels == null) return null;
  const toleranceCssPixels = getMapReconstructionPlacementToleranceCssPixels(pointerType);
  if (errorCssPixels > toleranceCssPixels) return null;
  return {
    position: { ...options.piece.correctPosition },
    errorCssPixels,
    toleranceCssPixels,
    pointerType
  };
}
