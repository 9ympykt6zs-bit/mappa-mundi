import {
  beginMapReconstructionDrag,
  completeMapReconstructionCorrection,
  createMapReconstructionSession,
  endMapReconstructionDrag,
  findMapReconstructionAutomaticPlacement,
  getMapReconstructionPieceRenderOrder,
  moveMapReconstructionPieceByKeyboard,
  placeMapReconstructionPiece,
  prepareMapReconstructionCorrectionReplay,
  resetMapReconstructionSession,
  restoreMapReconstructionSubmittedMap,
  returnMapReconstructionPieceToBank,
  showMapReconstructionCorrectPlacement,
  submitMapReconstructionSession
} from "./map-reconstruction-engine.js";
import { evaluateMapReconstruction } from "./map-reconstruction-evaluation.js";
import {
  getMapReconstructionThumbnailTransform,
  isPointInMapReconstructionPiece
} from "./map-reconstruction-geometry.js";

const SVG_NAMESPACE = "http://www.w3.org/2000/svg";
export const MAP_RECONSTRUCTION_SUCCESS_TIMING = Object.freeze({
  snapDurationMs: 560,
  shimmerDurationMs: 820,
  shimmerDelayAfterSnapMs: 80,
  shimmerRepeatCount: 1,
  correctionDurationMs: 1050,
  correctionReplayPauseMs: 280
});

let mapReconstructionVisualSequence = 0;

function createElement(tagName, className = "") {
  const element = document.createElement(tagName);
  if (className) element.className = className;
  return element;
}

function createSvgElement(tagName, attributes = {}) {
  const element = document.createElementNS(SVG_NAMESPACE, tagName);
  Object.entries(attributes).forEach(([name, value]) => element.setAttribute(name, String(value)));
  return element;
}

function createButton(label, className, onClick, options = {}) {
  const button = createElement("button", className);
  button.type = "button";
  button.textContent = label;
  button.disabled = Boolean(options.disabled);
  if (options.ariaPressed != null) button.setAttribute("aria-pressed", String(options.ariaPressed));
  if (options.ariaLabel) button.setAttribute("aria-label", options.ariaLabel);
  button.addEventListener("click", onClick);
  return button;
}

function createReconstructionSpeaker(labelText, className, accessibleLabel) {
  const speaker = window.GeographyChipSpeech?.createChipSpeakerControl(labelText);
  if (!speaker) return null;
  speaker.classList.add(className);
  if (accessibleLabel) {
    speaker.setAttribute("aria-label", accessibleLabel);
    speaker.setAttribute("title", accessibleLabel);
  }
  return speaker;
}

function formatStatus(status) {
  return String(status || "")
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function mapClientPointToReconstructionWorkspace(svg, clientX, clientY) {
  if (!svg || !Number.isFinite(clientX) || !Number.isFinite(clientY)) return null;
  const matrix = svg.getScreenCTM?.();
  if (matrix?.inverse && svg.createSVGPoint) {
    const point = svg.createSVGPoint();
    point.x = clientX;
    point.y = clientY;
    const transformed = point.matrixTransform(matrix.inverse());
    return { x: transformed.x, y: transformed.y };
  }
  const rect = svg.getBoundingClientRect?.();
  const viewBox = svg.viewBox?.baseVal;
  if (!rect?.width || !rect?.height || !viewBox) return null;
  return {
    x: viewBox.x + (clientX - rect.left) / rect.width * viewBox.width,
    y: viewBox.y + (clientY - rect.top) / rect.height * viewBox.height
  };
}

function mapClientPointToSvgGeometry(element, clientX, clientY) {
  const matrix = element?.getScreenCTM?.();
  const svg = element?.ownerSVGElement;
  if (!matrix?.inverse || !svg?.createSVGPoint) return null;
  const point = svg.createSVGPoint();
  point.x = clientX;
  point.y = clientY;
  const transformed = point.matrixTransform(matrix.inverse());
  return { x: transformed.x, y: transformed.y };
}

export function getMapReconstructionShelfDropPosition(workspacePoint, pointerOffset) {
  if (!Number.isFinite(workspacePoint?.x) || !Number.isFinite(workspacePoint?.y)) return null;
  return {
    x: workspacePoint.x - (Number.isFinite(pointerOffset?.x) ? pointerOffset.x : 0),
    y: workspacePoint.y - (Number.isFinite(pointerOffset?.y) ? pointerOffset.y : 0)
  };
}

export function getDefaultMapReconstructionPlacement(pieceState, geometry) {
  if (!pieceState || !geometry?.workspace) return null;
  const columns = [0.27, 0.5, 0.73];
  const rows = [0.34, 0.66];
  const slotIndex = pieceState.initialPlacement?.slotIndex || 0;
  return {
    x: geometry.workspace.width * columns[slotIndex % columns.length],
    y: geometry.workspace.height * rows[Math.floor(slotIndex / columns.length) % rows.length]
  };
}

export function shouldRenderMapReconstructionCorrectLayout(phase, viewMode) {
  return false;
}

export function getMapReconstructionSuccessViewBox(geometry, padding = 54) {
  const bounds = geometry?.combinedBounds;
  if (!bounds) return null;
  const verticalPadding = Math.max(0, Number(padding) || 0);
  const horizontalPadding = verticalPadding * 2.4;
  const x = bounds.minX - horizontalPadding;
  const y = bounds.minY - verticalPadding;
  const width = bounds.maxX - bounds.minX + horizontalPadding * 2;
  const height = bounds.maxY - bounds.minY + verticalPadding * 2;
  return {
    x,
    y,
    width,
    height,
    value: `${x} ${y} ${width} ${height}`
  };
}

export function getMapReconstructionResultVisualPlan(session, geometry, options = {}) {
  const isSuccess = session?.phase === "result" && session.evaluation?.isComplete === true;
  const isIncorrectResult = session?.phase === "result" && !isSuccess;
  const isCorrectPlacement = isIncorrectResult && session.viewMode === "correct";
  const isCorrectionPlaying = isCorrectPlacement && session.correctionState === "playing";
  const isCorrectionComplete = isCorrectPlacement && session.correctionState === "complete";
  const reducedMotion = options.reducedMotion === true;
  const playSuccessAnimation = options.playSuccessAnimation !== false;
  const hasSnapMovement = isSuccess && Object.values(session.piecesById || {}).some((piece) => (
    piece.submittedPosition
      && (piece.submittedPosition.x !== piece.position?.x || piece.submittedPosition.y !== piece.position?.y)
  ));
  const animateSnap = isSuccess && playSuccessAnimation && !reducedMotion && hasSnapMovement;
  const completedViewBox = isSuccess || isCorrectionComplete
    ? getMapReconstructionSuccessViewBox(geometry)
    : null;
  return {
    isSuccess,
    isCorrectPlacement,
    isCorrectionPlaying,
    isCorrectionComplete,
    viewBox: completedViewBox?.value || `0 0 ${geometry.workspace.width} ${geometry.workspace.height}`,
    showComparisonControls: false,
    showCorrectLayout: false,
    showLearnerLayout: session?.phase === "arranging" || session?.phase === "result",
    animateSnap,
    animateCorrection: isCorrectionPlaying && !reducedMotion,
    playShimmer: isSuccess && playSuccessAnimation && !reducedMotion,
    useStaticGlow: isSuccess && playSuccessAnimation && reducedMotion,
    shimmerDelayMs: animateSnap
      ? MAP_RECONSTRUCTION_SUCCESS_TIMING.snapDurationMs + MAP_RECONSTRUCTION_SUCCESS_TIMING.shimmerDelayAfterSnapMs
      : MAP_RECONSTRUCTION_SUCCESS_TIMING.shimmerDelayAfterSnapMs
  };
}

function createPieceLabel(piece, options = {}) {
  const completedOffset = options.completed ? options.completedOffset : null;
  const label = createSvgElement("text", {
    class: `map-reconstruction-piece-label${options.completed ? " is-completed-label" : ""}`,
    x: completedOffset?.x || 0,
    y: completedOffset?.y ?? 5,
    "text-anchor": "middle",
    "aria-hidden": "true"
  });
  label.textContent = piece.name;
  if (options.smallLabel) label.classList.add("is-small-state-label");
  return label;
}

function createPieceGroup(piece, position, options = {}) {
  const group = createSvgElement("g", {
    class: options.className || "map-reconstruction-piece",
    transform: `translate(${position.x} ${position.y})`,
    "data-map-reconstruction-state-id": piece.stateId
  });
  const path = createSvgElement("path", {
    d: piece.path,
    "fill-rule": "evenodd",
    class: "map-reconstruction-piece-shape"
  });
  group.appendChild(path);
  if (!options.hideLabel) group.appendChild(createPieceLabel(piece, options));
  return group;
}

function addSuccessSnapAnimation(group, from, to) {
  if (!from || !to) return;
  group.appendChild(createSvgElement("animateTransform", {
    class: "map-reconstruction-success-snap",
    attributeName: "transform",
    type: "translate",
    from: `${from.x} ${from.y}`,
    to: `${to.x} ${to.y}`,
    dur: `${MAP_RECONSTRUCTION_SUCCESS_TIMING.snapDurationMs}ms`,
    begin: "0s",
    fill: "remove",
    calcMode: "spline",
    keyTimes: "0;1",
    keySplines: "0.22 0.75 0.3 1"
  }));
}

export function getMapReconstructionCorrectionStartPosition(pieceState, pieceGeometry, geometry) {
  if (pieceState?.submittedPosition) return { ...pieceState.submittedPosition };
  if (!pieceState || !pieceGeometry || !geometry?.workspace) return null;
  const margin = 28;
  const desiredY = 100 + (pieceState.initialPlacement?.slotIndex || 0) * 100;
  return {
    x: geometry.workspace.width - pieceGeometry.localBounds.maxX - margin,
    y: Math.min(
      geometry.workspace.height - pieceGeometry.localBounds.maxY - margin,
      Math.max(-pieceGeometry.localBounds.minY + margin, desiredY)
    )
  };
}

function addCorrectionAnimation(group, from, to) {
  if (!from || !to) return;
  group.appendChild(createSvgElement("animateTransform", {
    class: "map-reconstruction-correction-move",
    attributeName: "transform",
    type: "translate",
    from: `${from.x} ${from.y}`,
    to: `${to.x} ${to.y}`,
    dur: `${MAP_RECONSTRUCTION_SUCCESS_TIMING.correctionDurationMs}ms`,
    begin: "0s",
    fill: "remove",
    calcMode: "spline",
    keyTimes: "0;1",
    keySplines: "0.22 0.75 0.3 1",
    repeatCount: 1
  }));
}

function appendSuccessShimmer(svg, geometry, visualId, delayMs) {
  const bounds = geometry.combinedBounds;
  const width = Math.max(1, bounds.maxX - bounds.minX);
  const height = Math.max(1, bounds.maxY - bounds.minY);
  const clipId = `map-reconstruction-success-clip-${visualId}`;
  const gradientId = `map-reconstruction-success-gradient-${visualId}`;
  const defs = createSvgElement("defs");
  const clipPath = createSvgElement("clipPath", { id: clipId });
  geometry.stateIds.forEach((stateId) => {
    const piece = geometry.piecesById[stateId];
    clipPath.appendChild(createSvgElement("path", {
      d: piece.path,
      transform: `translate(${piece.correctPosition.x} ${piece.correctPosition.y})`,
      "fill-rule": "evenodd"
    }));
  });
  const gradient = createSvgElement("linearGradient", {
    id: gradientId,
    x1: "0%",
    y1: "0%",
    x2: "100%",
    y2: "0%"
  });
  [
    ["0%", "#ffffff", 0],
    ["45%", "#ffffff", 0.12],
    ["55%", "#ffffff", 0.82],
    ["100%", "#ffffff", 0]
  ].forEach(([offset, color, opacity]) => {
    gradient.appendChild(createSvgElement("stop", {
      offset,
      "stop-color": color,
      "stop-opacity": opacity
    }));
  });
  defs.append(clipPath, gradient);
  const shimmer = createSvgElement("rect", {
    class: "map-reconstruction-success-shimmer",
    x: bounds.minX - width * 0.6,
    y: bounds.minY,
    width: width * 0.55,
    height,
    fill: `url(#${gradientId})`,
    opacity: 0,
    "clip-path": `url(#${clipId})`,
    "aria-hidden": "true",
    "data-map-reconstruction-shimmer-repeat-count": MAP_RECONSTRUCTION_SUCCESS_TIMING.shimmerRepeatCount
  });
  shimmer.append(
    createSvgElement("animate", {
      attributeName: "opacity",
      values: "0;0.72;0",
      keyTimes: "0;0.48;1",
      begin: `${delayMs}ms`,
      dur: `${MAP_RECONSTRUCTION_SUCCESS_TIMING.shimmerDurationMs}ms`,
      repeatCount: MAP_RECONSTRUCTION_SUCCESS_TIMING.shimmerRepeatCount,
      fill: "remove"
    }),
    createSvgElement("animateTransform", {
      attributeName: "transform",
      type: "translate",
      from: "0 0",
      to: `${width * 1.75} 0`,
      begin: `${delayMs}ms`,
      dur: `${MAP_RECONSTRUCTION_SUCCESS_TIMING.shimmerDurationMs}ms`,
      repeatCount: MAP_RECONSTRUCTION_SUCCESS_TIMING.shimmerRepeatCount,
      fill: "remove"
    })
  );
  svg.prepend(defs);
  svg.appendChild(shimmer);
}

function createBankThumbnail(piece) {
  const svg = createSvgElement("svg", {
    class: "map-reconstruction-bank-thumbnail",
    viewBox: "0 0 120 84",
    "aria-hidden": "true"
  });
  const group = createSvgElement("g", {
    transform: getMapReconstructionThumbnailTransform(piece)
  });
  group.appendChild(createSvgElement("path", {
    d: piece.path,
    "fill-rule": "evenodd"
  }));
  svg.appendChild(group);
  return svg;
}

function createDragProxy(piece) {
  const proxy = createElement("div", "map-reconstruction-drag-proxy");
  const svg = createSvgElement("svg", { viewBox: "0 0 120 84", "aria-hidden": "true" });
  const group = createSvgElement("g", { transform: getMapReconstructionThumbnailTransform(piece) });
  group.appendChild(createSvgElement("path", { d: piece.path, "fill-rule": "evenodd" }));
  svg.appendChild(group);
  proxy.appendChild(svg);
  document.body.appendChild(proxy);
  return proxy;
}

function setProxyPosition(proxy, clientX, clientY) {
  proxy.style.transform = `translate(${clientX + 12}px, ${clientY + 12}px)`;
}

function pointIsInsideElement(element, clientX, clientY) {
  const rect = element?.getBoundingClientRect?.();
  return Boolean(rect
    && clientX >= rect.left && clientX <= rect.right
    && clientY >= rect.top && clientY <= rect.bottom);
}

function createStatusLegend() {
  const legend = createElement("ul", "map-reconstruction-legend");
  [
    ["well-placed", "Well placed"],
    ["close", "Close"],
    ["misplaced", "Misplaced"],
    ["correct", "Correct structure"]
  ].forEach(([status, label]) => {
    const item = createElement("li");
    const swatch = createElement("span", `map-reconstruction-legend-swatch is-${status}`);
    swatch.setAttribute("aria-hidden", "true");
    item.append(swatch, document.createTextNode(label));
    legend.appendChild(item);
  });
  return legend;
}

function createResultSummary(session, region, geometry) {
  const section = createElement("section", "map-reconstruction-result-summary");
  const heading = createElement("h2");
  const isCorrectPlacement = !session.evaluation?.isComplete && session.viewMode === "correct";
  heading.textContent = session.evaluation?.isComplete
    ? "Region rebuilt"
    : isCorrectPlacement ? "Correct placement" : "Your placement";
  const counts = session.evaluation?.counts || {};
  const countText = createElement("p", "map-reconstruction-result-counts");
  if (session.evaluation?.isComplete) {
    countText.textContent = `${geometry.stateIds.length} of ${geometry.stateIds.length} states placed correctly.`;
    const successMessage = createElement("p", "map-reconstruction-success-message");
    successMessage.textContent = region.successMessage;
    const speaker = createReconstructionSpeaker(
      region.successMessage,
      "map-reconstruction-result-speaker",
      "Hear the reconstruction result"
    );
    if (speaker) successMessage.appendChild(speaker);
    section.append(heading, countText, successMessage);
    return section;
  }
  if (isCorrectPlacement) {
    countText.textContent = `${geometry.stateIds.length} states shown in their correct positions.`;
    const correctionMessage = createElement("p", "map-reconstruction-correction-message");
    correctionMessage.textContent = region.correctPlacementMessage;
    const speaker = createReconstructionSpeaker(
      region.correctPlacementMessage,
      "map-reconstruction-result-speaker",
      "Hear the correct-placement explanation"
    );
    if (speaker) correctionMessage.appendChild(speaker);
    section.append(heading, countText, correctionMessage);
    return section;
  }
  countText.textContent = `${counts["well-placed"] || 0} well placed, ${counts.close || 0} close, ${counts.misplaced || 0} misplaced, ${counts.unplaced || 0} unplaced.`;
  section.append(heading, countText, createStatusLegend());
  if (session.evaluation?.feedback?.length) {
    const list = createElement("ul", "map-reconstruction-feedback-list");
    session.evaluation.feedback.forEach((message) => {
      const item = createElement("li");
      item.textContent = message;
      list.appendChild(item);
    });
    section.appendChild(list);
  }
  const stateList = createElement("ul", "map-reconstruction-state-results");
  session.bankOrder.forEach((stateId) => {
    const item = createElement("li");
    const status = session.evaluation?.placements?.[stateId]?.status || "unplaced";
    item.className = `is-${status}`;
    item.textContent = `${geometry.piecesById[stateId].name}: ${formatStatus(status)}`;
    stateList.appendChild(item);
  });
  section.appendChild(stateList);
  return section;
}

export function createMapReconstructionRegionSelection(container, options = {}) {
  const regions = Array.isArray(options.regions) ? options.regions : [];
  if (!container) return null;
  const shell = createElement("section", "map-reconstruction-region-selection");
  const heading = createElement("h2");
  heading.textContent = "Choose a region to rebuild";
  const description = createElement("p");
  description.textContent = "Build each region from memory. The correct map stays hidden until you submit.";
  const list = createElement("div", "map-reconstruction-region-list");
  regions.forEach((region) => {
    const button = createElement("button", "map-reconstruction-region-option");
    button.type = "button";
    button.dataset.mapReconstructionRegionId = region.id;
    const title = createElement("strong");
    title.textContent = region.title;
    const speaker = createReconstructionSpeaker(
      region.title,
      "map-reconstruction-region-speaker",
      `Hear ${region.title}`
    );
    const count = createElement("span");
    count.textContent = `${region.stateIds.length} states`;
    button.append(title);
    if (speaker) button.appendChild(speaker);
    button.append(count);
    button.addEventListener("click", () => options.onSelect?.(region.id));
    list.appendChild(button);
  });
  shell.append(heading, description, list);
  container.replaceChildren(shell);
  return {
    destroy: () => container.replaceChildren()
  };
}

export function createMapReconstructionActivity(container, options) {
  const { region, geometry } = options || {};
  if (!container || !region || !geometry) return null;
  let session = createMapReconstructionSession(region, geometry, { random: options.random });
  let announcement = "";
  let destroyed = false;
  let workspaceSvg = null;
  let successVisualPending = false;
  let correctionTimer = null;
  const successVisualId = ++mapReconstructionVisualSequence;

  const clearCorrectionTimer = () => {
    if (correctionTimer != null) window.clearTimeout(correctionTimer);
    correctionTimer = null;
  };

  const focusPiece = (stateId) => requestAnimationFrame(() => {
    container.querySelector(`[data-map-reconstruction-state-id="${stateId}"]`)?.focus();
  });

  const announce = (message) => {
    announcement = message;
  };

  const placePiece = (stateId, position, shouldFocus = true) => {
    session = placeMapReconstructionPiece(session, stateId, position, geometry);
    if (!session.piecesById[stateId]?.position) return;
    const name = geometry.piecesById[stateId]?.name || stateId;
    announce(`${name} placed in the workspace and selected.`);
    render();
    if (shouldFocus) focusPiece(stateId);
  };

  const attachBankPointerInteraction = (button, stateId) => {
    const piece = geometry.piecesById[stateId];
    button.addEventListener("pointerdown", (event) => {
      if (event.button != null && event.button !== 0) return;
      event.preventDefault();
      const start = { x: event.clientX, y: event.clientY };
      const thumbnailPath = button.querySelector(".map-reconstruction-bank-thumbnail path");
      const pointerOffset = event.target === thumbnailPath
        ? mapClientPointToSvgGeometry(thumbnailPath, event.clientX, event.clientY)
        : null;
      let moved = false;
      const proxy = createDragProxy(piece);
      setProxyPosition(proxy, event.clientX, event.clientY);
      button.setPointerCapture?.(event.pointerId);
      const finish = (upEvent, cancelled) => {
        button.removeEventListener("pointermove", move);
        button.removeEventListener("pointerup", up);
        button.removeEventListener("pointercancel", cancel);
        proxy.remove();
        if (cancelled || destroyed) return;
        if (moved && pointIsInsideElement(workspaceSvg, upEvent.clientX, upEvent.clientY)) {
          const point = mapClientPointToReconstructionWorkspace(workspaceSvg, upEvent.clientX, upEvent.clientY);
          if (point) {
            placePiece(stateId, getMapReconstructionShelfDropPosition(point, pointerOffset));
          }
          return;
        }
        placePiece(stateId, findMapReconstructionAutomaticPlacement(session, stateId, geometry));
      };
      const move = (moveEvent) => {
        moveEvent.preventDefault();
        moved = moved || Math.hypot(moveEvent.clientX - start.x, moveEvent.clientY - start.y) > 6;
        setProxyPosition(proxy, moveEvent.clientX, moveEvent.clientY);
      };
      const up = (upEvent) => finish(upEvent, false);
      const cancel = (cancelEvent) => finish(cancelEvent, true);
      button.addEventListener("pointermove", move);
      button.addEventListener("pointerup", up);
      button.addEventListener("pointercancel", cancel);
    });
    button.addEventListener("keydown", (event) => {
      if (!["Enter", " "].includes(event.key) || session.piecesById[stateId]?.position) return;
      event.preventDefault();
      placePiece(stateId, findMapReconstructionAutomaticPlacement(session, stateId, geometry));
    });
    button.addEventListener("click", (event) => {
      if (event.detail !== 0 || session.piecesById[stateId]?.position) return;
      placePiece(stateId, findMapReconstructionAutomaticPlacement(session, stateId, geometry));
    });
  };

  const attachPlacedPieceInteraction = (group, stateId) => {
    const pieceState = session.piecesById[stateId];
    group.tabIndex = 0;
    group.setAttribute("role", "button");
    group.setAttribute("aria-label", `${geometry.piecesById[stateId].name}, placed. Use arrow keys to move; Delete returns it to the state bank.`);
    group.addEventListener("keydown", (event) => {
      const directions = {
        ArrowLeft: "left",
        ArrowRight: "right",
        ArrowUp: "up",
        ArrowDown: "down"
      };
      if (directions[event.key]) {
        event.preventDefault();
        session = moveMapReconstructionPieceByKeyboard(
          session,
          stateId,
          directions[event.key],
          geometry,
          { large: event.shiftKey }
        );
        announce(`${geometry.piecesById[stateId].name} moved ${directions[event.key]}.`);
        render();
        focusPiece(stateId);
      } else if (event.key === "Delete" || event.key === "Backspace") {
        event.preventDefault();
        session = returnMapReconstructionPieceToBank(session, stateId);
        announce(`${geometry.piecesById[stateId].name} returned to the state bank.`);
        render();
      }
    });
    group.addEventListener("pointerdown", (event) => {
      if (event.button != null && event.button !== 0) return;
      const startPoint = mapClientPointToReconstructionWorkspace(workspaceSvg, event.clientX, event.clientY);
      const pieceGeometry = geometry.piecesById[stateId];
      if (!startPoint || !isPointInMapReconstructionPiece(pieceGeometry, {
        x: startPoint.x - pieceState.position.x,
        y: startPoint.y - pieceState.position.y
      })) return;
      event.preventDefault();
      const startPosition = { ...pieceState.position };
      session = beginMapReconstructionDrag(session, stateId, event.pointerId, startPoint, startPosition);
      group.parentNode?.appendChild(group);
      group.setPointerCapture?.(event.pointerId);
      group.classList.add("is-dragging");
      group.focus();
      const finish = (cancelled) => {
        group.removeEventListener("pointermove", move);
        group.removeEventListener("pointerup", up);
        group.removeEventListener("pointercancel", cancel);
        if (cancelled) {
          session = placeMapReconstructionPiece(session, stateId, startPosition, geometry);
        }
        session = endMapReconstructionDrag(session);
        if (!cancelled) announce(`${geometry.piecesById[stateId].name} moved.`);
        render();
        focusPiece(stateId);
      };
      const move = (moveEvent) => {
        moveEvent.preventDefault();
        const current = mapClientPointToReconstructionWorkspace(workspaceSvg, moveEvent.clientX, moveEvent.clientY);
        if (!current) return;
        session = placeMapReconstructionPiece(session, stateId, {
          x: startPosition.x + current.x - startPoint.x,
          y: startPosition.y + current.y - startPoint.y
        }, geometry);
        const position = session.piecesById[stateId].position;
        group.setAttribute("transform", `translate(${position.x} ${position.y})`);
      };
      const up = () => finish(false);
      const cancel = () => finish(true);
      group.addEventListener("pointermove", move);
      group.addEventListener("pointerup", up);
      group.addEventListener("pointercancel", cancel);
    });
  };

  const createWorkspace = () => {
    const workspace = createElement("section", "map-reconstruction-workspace-section");
    const title = createElement("h2", "map-reconstruction-workspace-title");
    const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches === true;
    const visualPlan = getMapReconstructionResultVisualPlan(session, geometry, {
      reducedMotion,
      playSuccessAnimation: successVisualPending
    });
    title.textContent = session.phase === "arranging"
      ? region.prompt
      : visualPlan.isSuccess
        ? `Completed ${region.regionName}`
        : visualPlan.isCorrectPlacement ? "Correct placement" : "Your reconstruction";
    if (session.phase === "arranging") {
      const speaker = createReconstructionSpeaker(
        region.prompt,
        "map-reconstruction-prompt-speaker",
        "Hear the reconstruction instruction"
      );
      if (speaker) title.appendChild(speaker);
    }
    workspaceSvg = createSvgElement("svg", {
      class: "map-reconstruction-workspace",
      viewBox: visualPlan.viewBox,
      preserveAspectRatio: "xMidYMid meet",
      role: "group",
      "aria-label": session.phase === "arranging"
        ? `Blank ${region.regionName} reconstruction workspace`
        : visualPlan.isSuccess
          ? `Completed ${region.regionName} reconstruction`
          : visualPlan.isCorrectPlacement
            ? `Correct ${region.regionName} placement`
            : `Submitted ${region.regionName} reconstruction`
    });
    workspaceSvg.dataset.mapReconstructionPhase = session.phase;
    if (visualPlan.isSuccess) workspaceSvg.dataset.mapReconstructionSuccessful = "true";
    if (visualPlan.showLearnerLayout) {
      const learnerLayer = createSvgElement("g", {
        class: `map-reconstruction-learner-layer${visualPlan.isSuccess ? " is-completed" : ""}${visualPlan.isCorrectPlacement ? " is-corrected" : ""}${visualPlan.useStaticGlow ? " is-static-success" : ""}`,
        "data-map-reconstruction-learner-layout": "visible"
      });
      if (visualPlan.isSuccess) learnerLayer.dataset.mapReconstructionCompletedLayout = "visible";
      getMapReconstructionPieceRenderOrder(session).forEach((stateId) => {
        const pieceState = session.piecesById[stateId];
        if (!pieceState.position) return;
        const status = visualPlan.isSuccess
          ? "completed"
          : visualPlan.isCorrectPlacement
            ? "corrected"
          : session.phase === "result"
          ? session.evaluation?.placements?.[stateId]?.status || "misplaced"
          : "arranging";
        const group = createPieceGroup(geometry.piecesById[stateId], pieceState.position, {
          className: `map-reconstruction-piece is-${status}${session.selectedStateId === stateId ? " is-selected" : ""}`,
          completed: visualPlan.isSuccess,
          completedOffset: region.completedLabelOffsets?.[stateId],
          smallLabel: region.smallLabelStateIds?.includes(stateId),
          hideLabel: visualPlan.isSuccess
        });
        if (visualPlan.animateSnap) {
          addSuccessSnapAnimation(group, pieceState.submittedPosition, pieceState.position);
        }
        if (visualPlan.animateCorrection) {
          addCorrectionAnimation(
            group,
            getMapReconstructionCorrectionStartPosition(pieceState, geometry.piecesById[stateId], geometry),
            pieceState.position
          );
        }
        if (session.phase === "arranging") {
          attachPlacedPieceInteraction(group, stateId);
        }
        learnerLayer.appendChild(group);
      });
      workspaceSvg.appendChild(learnerLayer);
    }
    if (visualPlan.playShimmer) {
      appendSuccessShimmer(workspaceSvg, geometry, successVisualId, visualPlan.shimmerDelayMs);
    }
    if (visualPlan.isSuccess) {
      const labelLayer = createSvgElement("g", {
        class: "map-reconstruction-completed-label-layer",
        "aria-hidden": "true"
      });
      session.bankOrder.forEach((stateId) => {
        const piece = geometry.piecesById[stateId];
        const labelGroup = createSvgElement("g", {
          transform: `translate(${piece.correctPosition.x} ${piece.correctPosition.y})`
        });
        labelGroup.appendChild(createPieceLabel(piece, {
          completed: true,
          completedOffset: region.completedLabelOffsets?.[stateId],
          smallLabel: region.smallLabelStateIds?.includes(stateId)
        }));
        labelLayer.appendChild(labelGroup);
      });
      workspaceSvg.appendChild(labelLayer);
    }
    if (visualPlan.isSuccess && successVisualPending) successVisualPending = false;
    workspace.append(title, workspaceSvg);
    return workspace;
  };

  const createBank = () => {
    const bank = createElement("aside", "map-reconstruction-bank");
    const heading = createElement("h2");
    heading.textContent = session.phase === "arranging" ? "State pieces" : "Placement results";
    bank.appendChild(heading);
    if (session.phase === "result") {
      bank.appendChild(createResultSummary(session, region, geometry));
      return bank;
    }
    const list = createElement("div", "map-reconstruction-bank-list");
    session.bankOrder.forEach((stateId) => {
      if (session.piecesById[stateId].position) return;
      const piece = geometry.piecesById[stateId];
      const button = createElement("button", "map-reconstruction-bank-piece");
      button.type = "button";
      button.dataset.mapReconstructionBankStateId = stateId;
      button.setAttribute("aria-label", `Place ${piece.name}`);
      const name = createElement("span", "map-reconstruction-bank-name");
      name.textContent = piece.name;
      const speaker = createReconstructionSpeaker(
        piece.name,
        "map-reconstruction-state-speaker",
        `Hear ${piece.name}`
      );
      button.append(createBankThumbnail(piece), name);
      if (speaker) button.appendChild(speaker);
      attachBankPointerInteraction(button, stateId);
      list.appendChild(button);
    });
    if (!list.children.length) {
      const empty = createElement("p", "map-reconstruction-bank-empty");
      empty.textContent = `All ${geometry.stateIds.length} states are in the workspace.`;
      list.appendChild(empty);
    }
    bank.appendChild(list);
    return bank;
  };

  const beginCorrectionMovement = (reducedMotion) => {
    session = showMapReconstructionCorrectPlacement(session, { reducedMotion });
    announcement = reducedMotion
      ? "Correct placement shown."
      : "Showing how each state moves into its correct position.";
    render();
    if (session.correctionState !== "playing") {
      container.querySelector(".map-reconstruction-replay-action")?.focus();
      return;
    }
    correctionTimer = window.setTimeout(() => {
      correctionTimer = null;
      if (destroyed) return;
      session = completeMapReconstructionCorrection(session);
      announcement = "Correct placement complete.";
      render();
      container.querySelector(".map-reconstruction-replay-action")?.focus();
    }, MAP_RECONSTRUCTION_SUCCESS_TIMING.correctionDurationMs);
  };

  const startCorrection = (options = {}) => {
    if (["preparing", "playing"].includes(session.correctionState)) return;
    clearCorrectionTimer();
    const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches === true;
    if (options.replay === true && !reducedMotion) {
      session = prepareMapReconstructionCorrectionReplay(session);
      announcement = "Your submitted reconstruction is restored. Replaying the correction.";
      render();
      correctionTimer = window.setTimeout(() => {
        correctionTimer = null;
        if (destroyed) return;
        beginCorrectionMovement(false);
      }, MAP_RECONSTRUCTION_SUCCESS_TIMING.correctionReplayPauseMs);
      return;
    }
    beginCorrectionMovement(reducedMotion);
  };

  const restoreSubmittedMap = () => {
    clearCorrectionTimer();
    session = restoreMapReconstructionSubmittedMap(session);
    announcement = "Your submitted reconstruction is shown.";
    render();
    container.querySelector(".map-reconstruction-replay-action, .map-reconstruction-show-correction-action")?.focus();
  };

  const resetAttempt = () => {
    clearCorrectionTimer();
    successVisualPending = false;
    session = resetMapReconstructionSession(session);
    announce("Reconstruction reset.");
    render();
    container.querySelector(".map-reconstruction-bank-piece")?.focus();
  };

  const createActions = () => {
    const actions = createElement("footer", "map-reconstruction-actions");
    if (session.phase === "result") {
      if (session.evaluation?.isComplete) {
        actions.appendChild(createButton("Try again", "map-reconstruction-primary-action", resetAttempt));
        return actions;
      }
      if (["preparing", "playing"].includes(session.correctionState)) {
        actions.append(
          createButton(
            session.correctionState === "preparing"
              ? "Preparing correction..."
              : "Showing correct placement...",
            "map-reconstruction-primary-action map-reconstruction-correction-progress-action",
            () => {},
            { disabled: true }
          ),
          createButton("Try again", "map-reconstruction-secondary-action", resetAttempt)
        );
        return actions;
      }
      if (session.viewMode === "learner") {
        const hasSeenCorrection = session.correctionState === "complete";
        actions.append(
          createButton(
            hasSeenCorrection ? "Replay correction" : "Show correct placement",
            `map-reconstruction-primary-action ${hasSeenCorrection
              ? "map-reconstruction-replay-action"
              : "map-reconstruction-show-correction-action"}`,
            () => startCorrection({ replay: hasSeenCorrection })
          ),
          createButton("Try again", "map-reconstruction-secondary-action", resetAttempt)
        );
        return actions;
      }
      actions.append(
        createButton(
          "Back to my map",
          "map-reconstruction-secondary-action map-reconstruction-back-to-map-action",
          restoreSubmittedMap
        ),
        createButton(
          "Replay correction",
          "map-reconstruction-primary-action map-reconstruction-replay-action",
          () => startCorrection({ replay: true })
        ),
        createButton("Try again", "map-reconstruction-secondary-action", resetAttempt)
      );
      return actions;
    }
    const selectedPiece = session.selectedStateId ? session.piecesById[session.selectedStateId] : null;
    actions.append(
      createButton("Reset", "map-reconstruction-secondary-action", () => {
        resetAttempt();
      }),
      createButton("Return piece", "map-reconstruction-secondary-action", () => {
        const stateId = session.selectedStateId;
        if (!stateId) return;
        const name = geometry.piecesById[stateId].name;
        session = returnMapReconstructionPieceToBank(session, stateId);
        announce(`${name} returned to the state bank.`);
        render();
        container.querySelector(`[data-map-reconstruction-bank-state-id="${stateId}"]`)?.focus();
      }, { disabled: !selectedPiece?.position }),
      createButton("Submit", "map-reconstruction-primary-action", () => {
        const evaluation = evaluateMapReconstruction(session, region, geometry);
        session = submitMapReconstructionSession(session, evaluation);
        successVisualPending = evaluation.isComplete;
        announce(evaluation.isComplete
          ? `${region.successMessage} The completed map is now shown.`
          : "Reconstruction submitted. The correct structure is now available for comparison.");
        render();
        container.querySelector(evaluation.isComplete
          ? ".map-reconstruction-primary-action"
          : ".map-reconstruction-show-correction-action")?.focus();
      })
    );
    return actions;
  };

  function render() {
    if (destroyed) return;
    document.querySelectorAll(".map-reconstruction-drag-proxy").forEach((proxy) => proxy.remove());
    const successClass = session.phase === "result" && session.evaluation?.isComplete ? " is-success" : "";
    const shell = createElement("div", `map-reconstruction-shell is-${session.phase}${successClass}`);
    shell.dataset.mapReconstructionRegionId = region.id;
    const liveRegion = createElement("p", "map-reconstruction-live-region");
    liveRegion.setAttribute("role", "status");
    liveRegion.setAttribute("aria-live", "polite");
    liveRegion.textContent = announcement;
    const content = createElement("div", "map-reconstruction-content");
    content.append(createWorkspace(), createBank());
    shell.append(liveRegion, content, createActions());
    container.replaceChildren(shell);
    options.onStateChange?.(session);
  }

  render();
  return {
    getState: () => JSON.parse(JSON.stringify(session)),
    reset: () => {
      clearCorrectionTimer();
      session = resetMapReconstructionSession(session);
      render();
    },
    destroy: () => {
      destroyed = true;
      clearCorrectionTimer();
      container.replaceChildren();
    }
  };
}
