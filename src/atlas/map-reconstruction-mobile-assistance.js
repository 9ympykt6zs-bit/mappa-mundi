export const MAP_RECONSTRUCTION_MOBILE_ASSISTANCE = Object.freeze({
  cameraScale: 2,
  cameraDurationMs: 180,
  snapDurationMs: 100,
  largeAreaRatio: 1.5,
  smallAreaRatio: 0.6,
  snapThresholdCssPixels: Object.freeze({
    large: 5,
    medium: 7,
    small: 9
  })
});

function finiteNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function clamp(value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, value));
}

function median(values) {
  if (!values.length) return 0;
  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2
    ? sorted[middle]
    : (sorted[middle - 1] + sorted[middle]) / 2;
}

export function isMapReconstructionMobileAssistanceEnabled(targetWindow = globalThis.window) {
  return targetWindow?.matchMedia?.("(pointer: coarse)")?.matches === true;
}

export function getMapReconstructionMobilePieceSize(piece, geometry) {
  const area = Math.max(0, finiteNumber(piece?.area));
  const areas = Object.values(geometry?.piecesById || {})
    .map((candidate) => Math.max(0, finiteNumber(candidate?.area)))
    .filter((candidateArea) => candidateArea > 0);
  const medianArea = median(areas);
  if (!medianArea) return "medium";
  if (area >= medianArea * MAP_RECONSTRUCTION_MOBILE_ASSISTANCE.largeAreaRatio) {
    return "large";
  }
  if (area <= medianArea * MAP_RECONSTRUCTION_MOBILE_ASSISTANCE.smallAreaRatio) {
    return "small";
  }
  return "medium";
}

export function getMapReconstructionMobileSnapThreshold(piece, geometry) {
  const size = getMapReconstructionMobilePieceSize(piece, geometry);
  return {
    size,
    cssPixels: MAP_RECONSTRUCTION_MOBILE_ASSISTANCE.snapThresholdCssPixels[size]
  };
}

export function getMapReconstructionMobileSnapTarget(options = {}) {
  const { position, piece, geometry } = options;
  if (!isMapReconstructionMobileAssistanceEnabled(options.targetWindow)) return null;
  if (finiteNumber(options.selectedPieceCount, 1) !== 1) return null;
  if (!Number.isFinite(position?.x) || !Number.isFinite(position?.y)) return null;
  if (!Number.isFinite(piece?.correctPosition?.x) || !Number.isFinite(piece?.correctPosition?.y)) {
    return null;
  }
  const cssPixelsPerWorldUnit = Math.max(
    0,
    finiteNumber(options.cssPixelsPerWorldUnit)
  );
  if (!cssPixelsPerWorldUnit) return null;
  const errorCssPixels = Math.hypot(
    position.x - piece.correctPosition.x,
    position.y - piece.correctPosition.y
  ) * cssPixelsPerWorldUnit;
  const threshold = getMapReconstructionMobileSnapThreshold(piece, geometry);
  if (errorCssPixels > threshold.cssPixels) return null;
  return {
    position: { ...piece.correctPosition },
    errorCssPixels,
    size: threshold.size,
    thresholdCssPixels: threshold.cssPixels
  };
}

export function animateMapReconstructionMobileValue(options = {}) {
  const targetWindow = options.targetWindow || globalThis.window;
  const reducedMotion = targetWindow?.matchMedia?.(
    "(prefers-reduced-motion: reduce)"
  )?.matches === true;
  const duration = reducedMotion ? 0 : Math.max(0, finiteNumber(options.durationMs));
  const from = options.from || {};
  const to = options.to || {};
  let frameId = null;
  let cancelled = false;
  const start = targetWindow?.performance?.now?.() || Date.now();
  const update = (now) => {
    if (cancelled) return;
    const progress = duration
      ? clamp((now - start) / duration, 0, 1)
      : 1;
    const eased = 1 - (1 - progress) ** 3;
    const value = Object.fromEntries(Object.keys(to).map((key) => [
      key,
      finiteNumber(from[key]) + (finiteNumber(to[key]) - finiteNumber(from[key])) * eased
    ]));
    options.onUpdate?.(value);
    if (progress < 1) {
      frameId = targetWindow.requestAnimationFrame(update);
    } else {
      options.onFinish?.();
    }
  };
  frameId = targetWindow.requestAnimationFrame(update);
  return () => {
    cancelled = true;
    if (frameId != null) targetWindow.cancelAnimationFrame(frameId);
  };
}
