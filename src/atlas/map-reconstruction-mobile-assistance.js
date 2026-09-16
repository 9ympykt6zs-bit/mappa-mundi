export const MAP_RECONSTRUCTION_MOBILE_ASSISTANCE = Object.freeze({
  cameraScale: 2,
  cameraDurationMs: 180,
  snapDurationMs: 100
});

function finiteNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function clamp(value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, value));
}

export function isMapReconstructionMobileAssistanceEnabled(targetWindow = globalThis.window) {
  return targetWindow?.matchMedia?.("(pointer: coarse)")?.matches === true;
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
