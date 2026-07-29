const SVG_NAMESPACE = "http://www.w3.org/2000/svg";

function createSvgElement(tagName, attributes = {}) {
  const element = document.createElementNS(SVG_NAMESPACE, tagName);
  Object.entries(attributes).forEach(([name, value]) => {
    if (value != null) element.setAttribute(name, String(value));
  });
  return element;
}

function finitePositive(value, fallback = 1) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : fallback;
}

export function getMapReconstructionDefaultGrabAnchor() {
  return { x: 0, y: 0 };
}

export function getMapReconstructionSvgScreenScale(svg) {
  const matrix = svg?.getScreenCTM?.();
  if (matrix) {
    const x = Math.hypot(Number(matrix.a) || 0, Number(matrix.b) || 0);
    const y = Math.hypot(Number(matrix.c) || 0, Number(matrix.d) || 0);
    if (x > 0 && y > 0) return { x, y };
  }

  const rect = svg?.getBoundingClientRect?.();
  const viewBox = svg?.viewBox?.baseVal;
  if (!rect?.width || !rect?.height || !viewBox?.width || !viewBox?.height) {
    return { x: 1, y: 1 };
  }
  const scale = Math.min(rect.width / viewBox.width, rect.height / viewBox.height);
  return { x: scale, y: scale };
}

export function getMapReconstructionDragPreviewLayout(piece, screenScale, pointerOffset) {
  const bounds = piece?.localBounds;
  if (!bounds) return null;
  const scaleX = finitePositive(screenScale?.x);
  const scaleY = finitePositive(screenScale?.y);
  const defaultAnchor = getMapReconstructionDefaultGrabAnchor();
  const anchor = {
    x: Number.isFinite(pointerOffset?.x) ? pointerOffset.x : defaultAnchor.x,
    y: Number.isFinite(pointerOffset?.y) ? pointerOffset.y : defaultAnchor.y
  };
  const width = Math.max(0, bounds.maxX - bounds.minX);
  const height = Math.max(0, bounds.maxY - bounds.minY);
  return {
    anchor,
    scaleX,
    scaleY,
    width: width * scaleX,
    height: height * scaleY,
    grabOffsetX: (anchor.x - bounds.minX) * scaleX,
    grabOffsetY: (anchor.y - bounds.minY) * scaleY,
    viewBox: `${bounds.minX} ${bounds.minY} ${width} ${height}`
  };
}

export function createMapReconstructionDragPreview(piece, workspaceSvg, options = {}) {
  const layout = getMapReconstructionDragPreviewLayout(
    piece,
    getMapReconstructionSvgScreenScale(workspaceSvg),
    options.pointerOffset
  );
  if (!layout) return null;

  const preview = document.createElement("div");
  preview.className = [
    "map-reconstruction-drag-proxy",
    options.className || ""
  ].filter(Boolean).join(" ");
  preview.setAttribute("aria-hidden", "true");
  preview.style.width = `${layout.width}px`;
  preview.style.height = `${layout.height}px`;
  preview.dataset.previewScaleX = String(layout.scaleX);
  preview.dataset.previewScaleY = String(layout.scaleY);

  const svg = createSvgElement("svg", {
    viewBox: layout.viewBox,
    preserveAspectRatio: "none",
    "aria-hidden": "true"
  });
  svg.appendChild(createSvgElement("path", {
    class: "map-reconstruction-drag-preview-shape",
    d: piece.path,
    "fill-rule": "evenodd"
  }));
  if (options.showLabel) {
    const label = createSvgElement("text", {
      class: "map-reconstruction-piece-label map-reconstruction-drag-preview-label",
      x: 0,
      y: 5,
      "text-anchor": "middle"
    });
    label.textContent = piece.name;
    svg.appendChild(label);
  }
  preview.appendChild(svg);
  document.body.appendChild(preview);

  return {
    element: preview,
    layout,
    position(clientX, clientY) {
      preview.style.transform = `translate(${clientX - layout.grabOffsetX}px, ${
        clientY - layout.grabOffsetY
      }px)`;
    },
    remove() {
      preview.remove();
    }
  };
}
