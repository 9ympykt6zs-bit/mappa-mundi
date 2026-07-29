const SVG_NAMESPACE = "http://www.w3.org/2000/svg";

export const MAP_RECONSTRUCTION_MOBILE_ASSISTANCE = Object.freeze({
  cameraScale: 2,
  cameraDurationMs: 180,
  snapDurationMs: 100,
  lensDiameterCssPixels: 112,
  lensMagnification: 2,
  lensFingerOffsetCssPixels: 84,
  largeAreaRatio: 1.5,
  smallAreaRatio: 0.6,
  snapThresholdCssPixels: Object.freeze({
    large: 5,
    medium: 7,
    small: 9
  })
});

let magnifierSequence = 0;

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

export function getMapReconstructionMagnifierPosition(clientPoint, viewport = {}) {
  const diameter = MAP_RECONSTRUCTION_MOBILE_ASSISTANCE.lensDiameterCssPixels;
  const margin = 8;
  const viewportWidth = Math.max(diameter + margin * 2, finiteNumber(viewport.width, diameter));
  const viewportHeight = Math.max(diameter + margin * 2, finiteNumber(viewport.height, diameter));
  let left = finiteNumber(clientPoint?.x) - diameter / 2;
  let top = finiteNumber(clientPoint?.y)
    - MAP_RECONSTRUCTION_MOBILE_ASSISTANCE.lensFingerOffsetCssPixels
    - diameter;
  left = clamp(left, margin, viewportWidth - diameter - margin);
  if (top < margin) {
    top = finiteNumber(clientPoint?.y)
      + MAP_RECONSTRUCTION_MOBILE_ASSISTANCE.lensFingerOffsetCssPixels;
  }
  return {
    left,
    top: clamp(top, margin, viewportHeight - diameter - margin)
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

export function createMapReconstructionFingerMagnifier(sourceSvg, options = {}) {
  if (!sourceSvg || !isMapReconstructionMobileAssistanceEnabled(options.targetWindow)) {
    return null;
  }
  const targetWindow = options.targetWindow || globalThis.window;
  const targetDocument = sourceSvg.ownerDocument || targetWindow.document;
  const assignedSourceId = !sourceSvg.id;
  if (assignedSourceId) {
    magnifierSequence += 1;
    sourceSvg.id = `map-reconstruction-magnifier-source-${magnifierSequence}`;
  }
  const lens = targetDocument.createElement("div");
  lens.className = "map-reconstruction-finger-magnifier";
  lens.setAttribute("aria-hidden", "true");
  const lensSvg = targetDocument.createElementNS(SVG_NAMESPACE, "svg");
  lensSvg.setAttribute("preserveAspectRatio", "xMidYMid slice");
  const sourceUse = targetDocument.createElementNS(SVG_NAMESPACE, "use");
  sourceUse.setAttribute("href", `#${sourceSvg.id}`);
  const pieceLayer = targetDocument.createElementNS(SVG_NAMESPACE, "g");
  pieceLayer.classList.add("map-reconstruction-finger-magnifier-piece");
  lensSvg.append(sourceUse, pieceLayer);
  lens.appendChild(lensSvg);
  targetDocument.body.appendChild(lens);

  const update = (clientPoint, worldPoint, draggedPiece = null) => {
    if (!Number.isFinite(clientPoint?.x) || !Number.isFinite(clientPoint?.y)
      || !Number.isFinite(worldPoint?.x) || !Number.isFinite(worldPoint?.y)) return;
    const diameter = MAP_RECONSTRUCTION_MOBILE_ASSISTANCE.lensDiameterCssPixels;
    const { left, top } = getMapReconstructionMagnifierPosition(clientPoint, {
      width: targetWindow.innerWidth,
      height: targetWindow.innerHeight
    });
    lens.style.transform = `translate3d(${left}px, ${top}px, 0)`;

    const sourceRect = sourceSvg.getBoundingClientRect();
    const sourceViewBox = sourceSvg.viewBox?.baseVal;
    if (!sourceRect.width || !sourceRect.height || !sourceViewBox?.width || !sourceViewBox?.height) {
      return;
    }
    const magnification = MAP_RECONSTRUCTION_MOBILE_ASSISTANCE.lensMagnification;
    const viewWidth = diameter / magnification * sourceViewBox.width / sourceRect.width;
    const viewHeight = diameter / magnification * sourceViewBox.height / sourceRect.height;
    lensSvg.setAttribute("viewBox", [
      worldPoint.x - viewWidth / 2,
      worldPoint.y - viewHeight / 2,
      viewWidth,
      viewHeight
    ].join(" "));

    pieceLayer.replaceChildren();
    if (draggedPiece?.piece?.path && Number.isFinite(draggedPiece.position?.x)
      && Number.isFinite(draggedPiece.position?.y)) {
      const path = targetDocument.createElementNS(SVG_NAMESPACE, "path");
      path.setAttribute("class", "map-reconstruction-drag-preview-shape");
      path.setAttribute("d", draggedPiece.piece.path);
      path.setAttribute("fill-rule", "evenodd");
      pieceLayer.setAttribute(
        "transform",
        `translate(${draggedPiece.position.x} ${draggedPiece.position.y})`
      );
      pieceLayer.appendChild(path);
    }
  };

  return {
    update,
    destroy: () => {
      lens.remove();
      if (assignedSourceId) sourceSvg.removeAttribute("id");
    }
  };
}
