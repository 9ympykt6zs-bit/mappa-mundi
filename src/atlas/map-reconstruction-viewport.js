// Camera coordinates are independent of the logical placement/scoring workspace.
export function fitReconstructionViewport(bounds, viewport, padding = 28) {
  const width = Math.max(1, viewport.width);
  const height = Math.max(1, viewport.height);
  const inset = Math.min(padding, width / 4, height / 4);
  const scale = Math.max((bounds.maxX - bounds.minX) / (width - inset * 2),
    (bounds.maxY - bounds.minY) / (height - inset * 2), 0.001);
  return { x: (bounds.minX + bounds.maxX - width * scale) / 2,
    y: (bounds.minY + bounds.maxY - height * scale) / 2,
    width: width * scale, height: height * scale };
}

export function zoomReconstructionViewport(view, factor, anchor, home) {
  const width = Math.max(home.width / 8, Math.min(home.width * 4, view.width / factor));
  const ratio = width / view.width;
  return { x: anchor.x - (anchor.x - view.x) * ratio,
    y: anchor.y - (anchor.y - view.y) * ratio,
    width, height: view.height * ratio };
}

export function panReconstructionViewport(view, dx, dy, viewport) {
  return { ...view, x: view.x - dx * view.width / viewport.width,
    y: view.y - dy * view.height / viewport.height };
}
