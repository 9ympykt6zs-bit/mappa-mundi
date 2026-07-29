const DEFAULT_MIN_ZOOM = 1;
const DEFAULT_MAX_ZOOM = 8;

function finiteNumber(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function clamp(value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, value));
}

export function createMapReconstructionCamera(workspace, options = {}) {
  const width = Math.max(1, finiteNumber(workspace?.width, 1));
  const height = Math.max(1, finiteNumber(workspace?.height, 1));
  return clampMapReconstructionCamera({
    centerX: finiteNumber(options.centerX, width / 2),
    centerY: finiteNumber(options.centerY, height / 2),
    zoom: finiteNumber(options.zoom, DEFAULT_MIN_ZOOM)
  }, workspace, options);
}

export function getMapReconstructionCameraView(camera, workspace, viewport) {
  const viewportWidth = Math.max(1, finiteNumber(viewport?.width, workspace?.width || 1));
  const viewportHeight = Math.max(1, finiteNumber(viewport?.height, workspace?.height || 1));
  const workspaceWidth = Math.max(1, finiteNumber(workspace?.width, 1));
  const workspaceHeight = Math.max(1, finiteNumber(workspace?.height, 1));
  const aspect = viewportWidth / viewportHeight;
  const workspaceAspect = workspaceWidth / workspaceHeight;
  const fitWidth = workspaceAspect > aspect
    ? workspaceWidth
    : workspaceHeight * aspect;
  const fitHeight = workspaceAspect > aspect
    ? workspaceWidth / aspect
    : workspaceHeight;
  const zoom = Math.max(DEFAULT_MIN_ZOOM, finiteNumber(camera?.zoom, DEFAULT_MIN_ZOOM));
  const width = fitWidth / zoom;
  const height = fitHeight / zoom;
  return {
    x: finiteNumber(camera?.centerX, workspaceWidth / 2) - width / 2,
    y: finiteNumber(camera?.centerY, workspaceHeight / 2) - height / 2,
    width,
    height,
    viewBox: `${finiteNumber(camera?.centerX, workspaceWidth / 2) - width / 2} ${finiteNumber(camera?.centerY, workspaceHeight / 2) - height / 2} ${width} ${height}`
  };
}

export function clampMapReconstructionCamera(camera, workspace, options = {}) {
  const width = Math.max(1, finiteNumber(workspace?.width, 1));
  const height = Math.max(1, finiteNumber(workspace?.height, 1));
  const minZoom = finiteNumber(options.minZoom, DEFAULT_MIN_ZOOM);
  const maxZoom = Math.max(minZoom, finiteNumber(options.maxZoom, DEFAULT_MAX_ZOOM));
  return {
    centerX: clamp(finiteNumber(camera?.centerX, width / 2), 0, width),
    centerY: clamp(finiteNumber(camera?.centerY, height / 2), 0, height),
    zoom: clamp(finiteNumber(camera?.zoom, minZoom), minZoom, maxZoom)
  };
}

export function fitMapReconstructionCamera(workspace, options = {}) {
  return createMapReconstructionCamera(workspace, {
    ...options,
    centerX: Number(workspace?.width) / 2,
    centerY: Number(workspace?.height) / 2,
    zoom: finiteNumber(options.minZoom, DEFAULT_MIN_ZOOM)
  });
}

export function panMapReconstructionCamera(camera, delta, workspace, options = {}) {
  return clampMapReconstructionCamera({
    ...camera,
    centerX: finiteNumber(camera?.centerX, Number(workspace?.width) / 2)
      + finiteNumber(delta?.x, 0),
    centerY: finiteNumber(camera?.centerY, Number(workspace?.height) / 2)
      + finiteNumber(delta?.y, 0)
  }, workspace, options);
}

export function zoomMapReconstructionCameraAtPoint(
  camera,
  nextZoom,
  anchor,
  workspace,
  options = {}
) {
  const current = clampMapReconstructionCamera(camera, workspace, options);
  const target = clampMapReconstructionCamera({
    ...current,
    zoom: nextZoom
  }, workspace, options);
  const anchorX = finiteNumber(anchor?.x, current.centerX);
  const anchorY = finiteNumber(anchor?.y, current.centerY);
  const ratio = current.zoom / target.zoom;
  return clampMapReconstructionCamera({
    ...target,
    centerX: anchorX + (current.centerX - anchorX) * ratio,
    centerY: anchorY + (current.centerY - anchorY) * ratio
  }, workspace, options);
}

export function focusMapReconstructionCamera(
  camera,
  point,
  workspace,
  options = {}
) {
  return clampMapReconstructionCamera({
    ...camera,
    centerX: finiteNumber(point?.x, camera?.centerX),
    centerY: finiteNumber(point?.y, camera?.centerY),
    zoom: Math.max(
      finiteNumber(camera?.zoom, DEFAULT_MIN_ZOOM),
      finiteNumber(options.focusZoom, 4)
    )
  }, workspace, options);
}

