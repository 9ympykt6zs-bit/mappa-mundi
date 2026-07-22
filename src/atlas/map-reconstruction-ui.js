import {
  beginMapReconstructionDrag,
  createMapReconstructionSession,
  endMapReconstructionDrag,
  moveMapReconstructionPieceByKeyboard,
  placeMapReconstructionPiece,
  resetMapReconstructionSession,
  returnMapReconstructionPieceToBank,
  setMapReconstructionViewMode,
  submitMapReconstructionSession
} from "./map-reconstruction-engine.js";
import { evaluateMapReconstruction } from "./map-reconstruction-evaluation.js";
import { getMapReconstructionThumbnailTransform } from "./map-reconstruction-geometry.js";

const SVG_NAMESPACE = "http://www.w3.org/2000/svg";
export const MAP_RECONSTRUCTION_SUCCESS_TIMING = Object.freeze({
  snapDurationMs: 560,
  shimmerDurationMs: 820,
  shimmerDelayAfterSnapMs: 80,
  shimmerRepeatCount: 1
});

let mapReconstructionVisualSequence = 0;

const MAP_RECONSTRUCTION_COMPLETED_LABEL_OFFSETS = Object.freeze({
  vermont: Object.freeze({ x: -50, y: -10 }),
  "new-hampshire": Object.freeze({ x: 45, y: 15 }),
  massachusetts: Object.freeze({ x: 70, y: 10 }),
  connecticut: Object.freeze({ x: -65, y: 30 }),
  "rhode-island": Object.freeze({ x: 70, y: 35 })
});

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
  return phase === "result" && ["overlay", "correct"].includes(viewMode);
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
  const reducedMotion = options.reducedMotion === true;
  const playSuccessAnimation = options.playSuccessAnimation !== false;
  const hasSnapMovement = isSuccess && Object.values(session.piecesById || {}).some((piece) => (
    piece.submittedPosition
      && (piece.submittedPosition.x !== piece.position?.x || piece.submittedPosition.y !== piece.position?.y)
  ));
  const animateSnap = isSuccess && playSuccessAnimation && !reducedMotion && hasSnapMovement;
  const successViewBox = isSuccess ? getMapReconstructionSuccessViewBox(geometry) : null;
  return {
    isSuccess,
    viewBox: successViewBox?.value || `0 0 ${geometry.workspace.width} ${geometry.workspace.height}`,
    showComparisonControls: session?.phase === "result" && !isSuccess,
    showCorrectLayout: !isSuccess && shouldRenderMapReconstructionCorrectLayout(session?.phase, session?.viewMode),
    showLearnerLayout: session?.phase === "arranging" || isSuccess || ["learner", "overlay"].includes(session?.viewMode),
    animateSnap,
    playShimmer: isSuccess && playSuccessAnimation && !reducedMotion,
    useStaticGlow: isSuccess && playSuccessAnimation && reducedMotion,
    shimmerDelayMs: animateSnap
      ? MAP_RECONSTRUCTION_SUCCESS_TIMING.snapDurationMs + MAP_RECONSTRUCTION_SUCCESS_TIMING.shimmerDelayAfterSnapMs
      : MAP_RECONSTRUCTION_SUCCESS_TIMING.shimmerDelayAfterSnapMs
  };
}

function createPieceLabel(piece, options = {}) {
  const completedOffset = options.completed
    ? MAP_RECONSTRUCTION_COMPLETED_LABEL_OFFSETS[piece.stateId]
    : null;
  const label = createSvgElement("text", {
    class: options.correct
      ? "map-reconstruction-piece-label is-correct-label"
      : `map-reconstruction-piece-label${options.completed ? " is-completed-label" : ""}`,
    x: completedOffset?.x || 0,
    y: completedOffset?.y ?? 5,
    "text-anchor": "middle",
    "aria-hidden": "true"
  });
  label.textContent = piece.name;
  if (piece.stateId === "rhode-island") label.classList.add("is-small-state-label");
  return label;
}

function createPieceGroup(piece, position, options = {}) {
  const group = createSvgElement("g", {
    class: options.className || "map-reconstruction-piece",
    transform: `translate(${position.x} ${position.y})`,
    "data-map-reconstruction-state-id": piece.stateId
  });
  if (options.correct) group.dataset.mapReconstructionCorrectPiece = piece.stateId;
  const path = createSvgElement("path", {
    d: piece.path,
    "fill-rule": "evenodd",
    class: "map-reconstruction-piece-shape"
  });
  group.appendChild(path);
  if (!options.outlineOnly && !options.hideLabel) group.appendChild(createPieceLabel(piece, options));
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

function addPieceHitTarget(group, piece) {
  const hitWidth = Math.max(58, piece.width + 18);
  const hitHeight = Math.max(58, piece.height + 18);
  const centerX = (piece.localBounds.minX + piece.localBounds.maxX) / 2;
  const centerY = (piece.localBounds.minY + piece.localBounds.maxY) / 2;
  const hitTarget = createSvgElement("rect", {
    class: "map-reconstruction-piece-hit-target",
    x: centerX - hitWidth / 2,
    y: centerY - hitHeight / 2,
    width: hitWidth,
    height: hitHeight,
    rx: 8,
    "vector-effect": "non-scaling-stroke",
    "aria-hidden": "true"
  });
  group.insertBefore(hitTarget, group.firstChild);
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

function createResultSummary(session, geometry) {
  const section = createElement("section", "map-reconstruction-result-summary");
  const heading = createElement("h2");
  heading.textContent = session.evaluation?.isComplete ? "Region rebuilt" : "Compare your map";
  const counts = session.evaluation?.counts || {};
  const countText = createElement("p", "map-reconstruction-result-counts");
  if (session.evaluation?.isComplete) {
    countText.textContent = `${geometry.stateIds.length} of ${geometry.stateIds.length} states placed correctly.`;
    const successMessage = createElement("p", "map-reconstruction-success-message");
    successMessage.textContent = "You rebuilt New England correctly.";
    section.append(heading, countText, successMessage);
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

function createViewControls(session, onChange) {
  const group = createElement("div", "map-reconstruction-view-controls");
  group.setAttribute("role", "group");
  group.setAttribute("aria-label", "Map comparison view");
  [
    ["learner", "Your map"],
    ["overlay", "Overlay"],
    ["correct", "Correct map"]
  ].forEach(([mode, label]) => {
    group.appendChild(createButton(label, "map-reconstruction-view-button", () => onChange(mode), {
      ariaPressed: session.viewMode === mode
    }));
  });
  return group;
}

export function createMapReconstructionActivity(container, options) {
  const { region, geometry } = options || {};
  if (!container || !region || !geometry) return null;
  let session = createMapReconstructionSession(region, geometry, { random: options.random });
  let announcement = "";
  let destroyed = false;
  let workspaceSvg = null;
  let successVisualPending = false;
  const successVisualId = ++mapReconstructionVisualSequence;

  const focusPiece = (stateId) => requestAnimationFrame(() => {
    container.querySelector(`[data-map-reconstruction-state-id="${stateId}"]`)?.focus();
  });

  const announce = (message) => {
    announcement = message;
  };

  const placePiece = (stateId, position, shouldFocus = true) => {
    session = placeMapReconstructionPiece(session, stateId, position, geometry);
    const name = geometry.piecesById[stateId]?.name || stateId;
    announce(`${name} placed in the workspace.`);
    render();
    if (shouldFocus) focusPiece(stateId);
  };

  const attachBankPointerInteraction = (button, stateId) => {
    const piece = geometry.piecesById[stateId];
    button.addEventListener("pointerdown", (event) => {
      if (event.button != null && event.button !== 0) return;
      event.preventDefault();
      const start = { x: event.clientX, y: event.clientY };
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
          if (point) placePiece(stateId, point);
          return;
        }
        placePiece(stateId, getDefaultMapReconstructionPlacement(session.piecesById[stateId], geometry));
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
      placePiece(stateId, getDefaultMapReconstructionPlacement(session.piecesById[stateId], geometry));
    });
    button.addEventListener("click", (event) => {
      if (event.detail !== 0 || session.piecesById[stateId]?.position) return;
      placePiece(stateId, getDefaultMapReconstructionPlacement(session.piecesById[stateId], geometry));
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
      event.preventDefault();
      const startPoint = mapClientPointToReconstructionWorkspace(workspaceSvg, event.clientX, event.clientY);
      if (!startPoint) return;
      const startPosition = { ...pieceState.position };
      session = beginMapReconstructionDrag(session, stateId, event.pointerId, startPoint, startPosition);
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
      : visualPlan.isSuccess ? "Completed New England" : "Your reconstruction";
    workspaceSvg = createSvgElement("svg", {
      class: "map-reconstruction-workspace",
      viewBox: visualPlan.viewBox,
      preserveAspectRatio: "xMidYMid meet",
      role: "group",
      "aria-label": session.phase === "arranging"
        ? "Blank New England reconstruction workspace"
        : visualPlan.isSuccess
          ? "Completed New England reconstruction"
          : "Submitted New England reconstruction and correction"
    });
    workspaceSvg.dataset.mapReconstructionPhase = session.phase;
    if (visualPlan.isSuccess) workspaceSvg.dataset.mapReconstructionSuccessful = "true";
    if (visualPlan.showCorrectLayout) {
      const correctLayer = createSvgElement("g", {
        class: `map-reconstruction-correct-layer is-${session.viewMode}`,
        "data-map-reconstruction-correct-layout": "visible",
        "aria-hidden": "true"
      });
      region.stateIds.forEach((stateId) => {
        const piece = geometry.piecesById[stateId];
        correctLayer.appendChild(createPieceGroup(piece, piece.correctPosition, {
          correct: true,
          outlineOnly: session.viewMode === "overlay",
          className: "map-reconstruction-correct-piece"
        }));
      });
      workspaceSvg.appendChild(correctLayer);
    }
    if (visualPlan.showLearnerLayout) {
      const learnerLayer = createSvgElement("g", {
        class: `map-reconstruction-learner-layer${visualPlan.isSuccess ? " is-completed" : ""}${visualPlan.useStaticGlow ? " is-static-success" : ""}`,
        "data-map-reconstruction-learner-layout": "visible"
      });
      if (visualPlan.isSuccess) learnerLayer.dataset.mapReconstructionCompletedLayout = "visible";
      session.bankOrder.forEach((stateId) => {
        const pieceState = session.piecesById[stateId];
        if (!pieceState.position) return;
        const status = visualPlan.isSuccess
          ? "completed"
          : session.phase === "result"
          ? session.evaluation?.placements?.[stateId]?.status || "misplaced"
          : "arranging";
        const group = createPieceGroup(geometry.piecesById[stateId], pieceState.position, {
          className: `map-reconstruction-piece is-${status}${session.selectedStateId === stateId ? " is-selected" : ""}`,
          completed: visualPlan.isSuccess,
          hideLabel: visualPlan.isSuccess
        });
        if (visualPlan.animateSnap) {
          addSuccessSnapAnimation(group, pieceState.submittedPosition, pieceState.position);
        }
        if (session.phase === "arranging") {
          addPieceHitTarget(group, geometry.piecesById[stateId]);
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
        labelGroup.appendChild(createPieceLabel(piece, { completed: true }));
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
      bank.appendChild(createResultSummary(session, geometry));
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
      button.append(createBankThumbnail(piece), name);
      attachBankPointerInteraction(button, stateId);
      list.appendChild(button);
    });
    if (!list.children.length) {
      const empty = createElement("p", "map-reconstruction-bank-empty");
      empty.textContent = "All six states are in the workspace.";
      list.appendChild(empty);
    }
    bank.appendChild(list);
    return bank;
  };

  const createActions = () => {
    const actions = createElement("footer", "map-reconstruction-actions");
    if (session.phase === "result") {
      if (!session.evaluation?.isComplete) {
        actions.appendChild(createViewControls(session, (viewMode) => {
          session = setMapReconstructionViewMode(session, viewMode);
          render();
          container.querySelector(`.map-reconstruction-view-button[aria-pressed="true"]`)?.focus();
        }));
      }
      actions.appendChild(createButton("Try again", "map-reconstruction-primary-action", () => {
        successVisualPending = false;
        session = resetMapReconstructionSession(session);
        announce("Reconstruction reset.");
        render();
        container.querySelector(".map-reconstruction-bank-piece")?.focus();
      }));
      return actions;
    }
    const selectedPiece = session.selectedStateId ? session.piecesById[session.selectedStateId] : null;
    actions.append(
      createButton("Reset", "map-reconstruction-secondary-action", () => {
        session = resetMapReconstructionSession(session);
        announce("Reconstruction reset.");
        render();
        container.querySelector(".map-reconstruction-bank-piece")?.focus();
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
          ? "You rebuilt New England correctly. The completed map is now shown."
          : "Reconstruction submitted. The correct structure is now available for comparison.");
        render();
        container.querySelector(evaluation.isComplete
          ? ".map-reconstruction-primary-action"
          : ".map-reconstruction-view-button[aria-pressed=\"true\"]")?.focus();
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
      session = resetMapReconstructionSession(session);
      render();
    },
    destroy: () => {
      destroyed = true;
      container.replaceChildren();
    }
  };
}
