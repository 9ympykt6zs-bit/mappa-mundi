import { baseWaterColor } from "../maplibre/ocean-textures.js";
import { fitReconstructionViewport, zoomReconstructionViewport, panReconstructionViewport } from "./map-reconstruction-viewport.js";
import { getStateById } from "./united-states-atlas-queries.js";
import {
  beginMapReconstructionDrag,
  clearMapReconstructionSelection,
  completeMapReconstructionCorrection,
  createMapReconstructionSession,
  endMapReconstructionDrag,
  findMapReconstructionAutomaticPlacement,
  getMapReconstructionPieceRenderOrder,
  getMapReconstructionSelectedStateIds,
  moveMapReconstructionPieceByKeyboard,
  moveMapReconstructionSelectedPieces,
  placeMapReconstructionPiece,
  prepareMapReconstructionCorrectionReplay,
  resetMapReconstructionSession,
  restoreMapReconstructionSubmittedMap,
  returnMapReconstructionPieceToBank,
  selectMapReconstructionStates,
  showMapReconstructionCorrectPlacement,
  submitMapReconstructionSession,
  toggleMapReconstructionStateSelection
} from "./map-reconstruction-engine.js";
import { evaluateGuidedMapReconstruction, evaluateMapReconstruction } from "./map-reconstruction-evaluation.js";
import {
  getMapReconstructionInteractionLayout,
  getMapReconstructionThumbnailTransform,
  isPointInMapReconstructionPiece
} from "./map-reconstruction-geometry.js";
import {
  createMapReconstructionDragPreview,
  getMapReconstructionDefaultGrabAnchor
} from "./map-reconstruction-drag-preview.js";
import {
  getMapReconstructionConnectedComponent,
  getMapReconstructionStatesIntersectingBounds,
  getMapReconstructionWorldTouchTolerance
} from "./map-reconstruction-connectivity.js";
import {
  MAP_RECONSTRUCTION_MOBILE_ASSISTANCE,
  animateMapReconstructionMobileValue,
  isMapReconstructionMobileAssistanceEnabled
} from "./map-reconstruction-mobile-assistance.js";
import {
  getMapReconstructionPlacementSnapTarget
} from "./map-reconstruction-placement-tolerance.js";
import { getActivityAudioEntryByText } from "./activity-audio-registry.js";

const SVG_NAMESPACE = "http://www.w3.org/2000/svg";
export const MAP_RECONSTRUCTION_SUCCESS_TIMING = Object.freeze({
  snapDurationMs: 560,
  shimmerDurationMs: 820,
  shimmerDelayAfterSnapMs: 80,
  shimmerRepeatCount: 1,
  correctionDurationMs: 1050,
  correctionReplayPauseMs: 280
});
export const MAP_RECONSTRUCTION_WORKSPACE_INSET_CSS_PIXELS = 12;

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
  const audioEntry = getActivityAudioEntryByText(labelText);
  const speaker = window.GeographyChipSpeech?.createChipSpeakerControl(labelText, {
    audioPath: audioEntry?.audioPath || null
  });
  if (!speaker) return null;
  speaker.classList.add(className);
  if (accessibleLabel) {
    speaker.setAttribute("aria-label", accessibleLabel);
    speaker.setAttribute("title", accessibleLabel);
  }
  return speaker;
}

function appendReconstructionSpeaker(element, text, accessibleLabel = "Hear reconstruction feedback") {
  const speaker = createReconstructionSpeaker(
    text,
    "map-reconstruction-result-speaker",
    accessibleLabel
  );
  if (speaker) element.appendChild(speaker);
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
  group.style.setProperty("--reconstruction-state-fill", piece.displayColor || "#dbeafe");
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
  svg.style.setProperty("--reconstruction-state-fill", piece.displayColor || "#dbeafe");
  svg.appendChild(group);
  return svg;
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
    appendReconstructionSpeaker(countText, countText.textContent, "Hear the placement count");
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
    appendReconstructionSpeaker(countText, countText.textContent, "Hear the correction summary");
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
  appendReconstructionSpeaker(countText, countText.textContent, "Hear the placement summary");
  section.append(heading, countText, createStatusLegend());
  if (session.evaluation?.feedback?.length) {
    const list = createElement("ul", "map-reconstruction-feedback-list");
    session.evaluation.feedback.forEach((message) => {
      const item = createElement("li");
      item.textContent = message;
      appendReconstructionSpeaker(item, message);
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
    appendReconstructionSpeaker(item, item.textContent, `Hear ${geometry.piecesById[stateId].name} result`);
    stateList.appendChild(item);
  });
  section.appendChild(stateList);
  return section;
}

export function createMapReconstructionRegionSelection(container, options = {}) {
  const regions = Array.isArray(options.regions) ? options.regions : [];
  const capstones = Array.isArray(options.capstones) ? options.capstones : [];
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
  if (capstones.length) {
    const advanced = createElement("section", "map-reconstruction-advanced");
    const advancedHeading = createElement("h2");
    advancedHeading.textContent = "Advanced";
    const advancedList = createElement("div", "map-reconstruction-advanced-list");
    capstones.forEach((capstone) => {
      const card = createElement("div", "map-reconstruction-region-option map-reconstruction-capstone-option");
      const title = createElement("strong");
      title.textContent = capstone.title;
      const count = createElement("span");
      count.textContent = `${capstone.stateIds.length} states`;
      const speaker = createReconstructionSpeaker(
        capstone.title,
        "map-reconstruction-region-speaker",
        `Hear ${capstone.title}`
      );
      const recommendation = createElement("span", "map-reconstruction-capstone-recommendation");
      recommendation.textContent = capstone.recommendation;
      const actions = createElement("div", "map-reconstruction-capstone-option-actions");
      const hasResume = Boolean(options.capstoneResumeById?.[capstone.id]);
      const start = createElement("button", "map-reconstruction-primary-action");
      start.type = "button";
      start.textContent = hasResume ? "Continue" : "Start";
      start.addEventListener("click", () => options.onSelectCapstone?.(capstone.id, {
        resume: hasResume
      }));
      actions.appendChild(start);
      if (hasResume) {
        const startOver = createElement("button", "map-reconstruction-secondary-action");
        startOver.type = "button";
        startOver.textContent = "Start over";
        startOver.addEventListener("click", () => options.onSelectCapstone?.(capstone.id, {
          resume: false,
          startOver: true
        }));
        actions.appendChild(startOver);
      }
      card.append(title);
      if (speaker) card.appendChild(speaker);
      card.append(count, recommendation, actions);
      advancedList.appendChild(card);
    });
    advanced.append(advancedHeading, advancedList);
    shell.appendChild(advanced);
  }
  container.replaceChildren(shell);
  return {
    destroy: () => {
      window.GeographyChipSpeech?.stopAudio?.();
      container.replaceChildren();
    }
  };
}

export function createMapReconstructionActivity(container, options) {
  const { region, geometry } = options || {};
  if (!container || !region || !geometry) return null;
  const lockedStateIds = options.lockedStateIds || [];
  let session = createMapReconstructionSession(region, geometry, { random: options.random });
  let destroyed = false;
  let workspaceSvg = null;
  let successVisualPending = false;
  let correctionTimer = null;
  let interactionGeometry = geometry;
  let workspaceResizeObserver = null;
  let activeBankPointerCancel = null;
  let activePiecePointerCancel = null;
  let cameraGestureActive = false;
  let cameraView = null;
  let fittedView = null;
  let cameraSize = null;
  let manualCamera = false;
  let selectionMode = false;
  let lastPieceClick = null;
  let lastConnectedSelectionAt = -Infinity;
  let mobileCameraHomeView = null;
  let mobileCameraAnimationCancel = null;
  let mobileDragPointerType = null;
  let placementSnapAnimationCancel = null;
  let placementSnapPending = false;
  const successVisualId = ++mapReconstructionVisualSequence;

  const clearCorrectionTimer = () => {
    if (correctionTimer != null) window.clearTimeout(correctionTimer);
    correctionTimer = null;
  };

  const focusPiece = (stateId) => requestAnimationFrame(() => {
    container.querySelector(`[data-map-reconstruction-state-id="${stateId}"]`)?.focus();
  });

  const getSelectedStateIds = () => getMapReconstructionSelectedStateIds(session);

  const getWorkspaceView = () => {
    const view = workspaceSvg?.viewBox?.baseVal;
    return view?.width && view?.height
      ? { x: view.x, y: view.y, width: view.width, height: view.height }
      : null;
  };

  const setWorkspaceView = (view) => {
    if (!workspaceSvg || !view) return;
    cameraView = { ...view };
    workspaceSvg.setAttribute("viewBox", `${view.x} ${view.y} ${view.width} ${view.height}`);
  };

  const animateWorkspaceView = (from, to, onFinish) => {
    mobileCameraAnimationCancel?.();
    mobileCameraAnimationCancel = animateMapReconstructionMobileValue({
      from,
      to,
      durationMs: MAP_RECONSTRUCTION_MOBILE_ASSISTANCE.cameraDurationMs,
      onUpdate: setWorkspaceView,
      onFinish: () => {
        mobileCameraAnimationCancel = null;
        onFinish?.();
      }
    });
  };

  const beginMobileDragAssistance = (worldPoint, position, pointerType) => {
    if (pointerType === "mouse"
      || !isMapReconstructionMobileAssistanceEnabled()
      || !workspaceSvg) return;
    mobileDragPointerType = pointerType || "touch";
    if (manualCamera) return;
    const currentView = getWorkspaceView();
    if (!currentView) return;
    if (!mobileCameraHomeView) mobileCameraHomeView = { ...currentView };
    const scale = MAP_RECONSTRUCTION_MOBILE_ASSISTANCE.cameraScale;
    const targetWidth = Math.max(currentView.width / scale, geometry.workspace.width / 3.2);
    const targetHeight = Math.max(currentView.height / scale, geometry.workspace.height / 3.2);
    const centerX = Number.isFinite(position?.x) ? position.x : worldPoint.x;
    const centerY = Number.isFinite(position?.y) ? position.y : worldPoint.y;
    const workspaceX = Number.isFinite(geometry.workspace.x) ? geometry.workspace.x : 0;
    const workspaceY = Number.isFinite(geometry.workspace.y) ? geometry.workspace.y : 0;
    const target = {
      x: Math.min(
        workspaceX + geometry.workspace.width - targetWidth,
        Math.max(workspaceX, centerX - targetWidth / 2)
      ),
      y: Math.min(
        workspaceY + geometry.workspace.height - targetHeight,
        Math.max(workspaceY, centerY - targetHeight / 2)
      ),
      width: targetWidth,
      height: targetHeight
    };
    animateWorkspaceView(currentView, target);
  };

  const restoreMobileDragAssistance = () => {
    mobileDragPointerType = null;
    const currentView = getWorkspaceView();
    const homeView = mobileCameraHomeView;
    if (!currentView || !homeView) return;
    animateWorkspaceView(currentView, homeView, () => {
      mobileCameraHomeView = null;
    });
  };

  const cancelMobileAssistance = () => {
    mobileCameraAnimationCancel?.();
    mobileCameraAnimationCancel = null;
    mobileDragPointerType = null;
    if (mobileCameraHomeView) setWorkspaceView(mobileCameraHomeView);
    mobileCameraHomeView = null;
    placementSnapAnimationCancel?.();
    placementSnapAnimationCancel = null;
    placementSnapPending = false;
  };

  const getPlacementSnap = (stateId, position, pointerType) => {
    const screenMatrix = workspaceSvg?.getScreenCTM?.();
    if (!screenMatrix) return null;
    return getMapReconstructionPlacementSnapTarget({
      position,
      piece: geometry.piecesById[stateId],
      selectedPieceCount: getSelectedStateIds().length,
      pointerType,
      screenMatrix
    });
  };

  const startPlacementSnap = (
    stateId,
    fromPosition,
    snap,
    pointerType,
    shouldFocus = true
  ) => {
    if (!snap || placementSnapPending) return false;
    placementSnapPending = true;
    session = endMapReconstructionDrag(session);
    session = placeMapReconstructionPiece(
      session,
      stateId,
      snap.position,
      getInteractionGeometry()
    );
    render();
    const group = container.querySelector(
      `[data-map-reconstruction-state-id="${stateId}"]`
    );
    group?.classList.add("is-placement-snapping");
    group?.setAttribute("transform", `translate(${fromPosition.x} ${fromPosition.y})`);
    placementSnapAnimationCancel = animateMapReconstructionMobileValue({
      from: fromPosition,
      to: snap.position,
      durationMs: MAP_RECONSTRUCTION_MOBILE_ASSISTANCE.snapDurationMs,
      onUpdate: (position) => {
        group?.setAttribute("transform", `translate(${position.x} ${position.y})`);
      },
      onFinish: () => {
        placementSnapAnimationCancel = null;
        if (destroyed || !placementSnapPending) return;
        placementSnapPending = false;
        const currentGroup = container.querySelector(
          `[data-map-reconstruction-state-id="${stateId}"]`
        );
        currentGroup?.setAttribute(
          "transform",
          `translate(${snap.position.x} ${snap.position.y})`
        );
        currentGroup?.classList.remove("is-placement-snapping");
        if (pointerType === "touch") {
          try {
            window.navigator?.vibrate?.(18);
          } catch {
            // Haptics are optional.
          }
        }
        if (shouldFocus) focusPiece(stateId);
      }
    });
    return true;
  };

  const selectConnectedGroup = (stateId, options = {}) => {
    const component = getMapReconstructionConnectedComponent(
      session,
      geometry,
      stateId,
      getMapReconstructionWorldTouchTolerance(workspaceSvg)
    );
    session = selectMapReconstructionStates(session, component, {
      additive: options.additive,
      primaryStateId: stateId
    });
    lastConnectedSelectionAt = Number(options.timeStamp) || 0;
  };

  const applyPieceClickSelection = (stateId, event) => {
    const timeStamp = Number(event.timeStamp) || Date.now();
    const isDoubleClick = lastPieceClick?.stateId === stateId
      && timeStamp - lastPieceClick.timeStamp <= 420;
    const additive = Boolean(event.ctrlKey || event.metaKey || event.shiftKey);
    if (isDoubleClick) {
      selectConnectedGroup(stateId, { additive, timeStamp });
      lastPieceClick = null;
      return;
    }
    if (selectionMode) {
      session = toggleMapReconstructionStateSelection(session, stateId);
    } else if (event.ctrlKey || event.metaKey) {
      session = toggleMapReconstructionStateSelection(session, stateId);
    } else {
      session = selectMapReconstructionStates(session, [stateId], {
        additive: event.shiftKey,
        primaryStateId: stateId
      });
    }
    lastPieceClick = { stateId, timeStamp };
  };

  const getInteractionGeometry = () => (
    session.phase === "arranging" ? interactionGeometry : geometry
  );

  const refreshWorkspaceInteractionLayout = () => {
    if (!workspaceSvg) return;
    const rect = workspaceSvg.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const layout = getMapReconstructionInteractionLayout(geometry.workspace, rect, {
      insetCssPixels: MAP_RECONSTRUCTION_WORKSPACE_INSET_CSS_PIXELS
    });
    if (!layout) return;
    fittedView = fitReconstructionViewport(geometry.combinedBounds, rect);
    const resized = cameraSize && (cameraSize.width !== rect.width || cameraSize.height !== rect.height);
    if (!cameraView || resized && !manualCamera) cameraView = fittedView;
    else if (resized) {
      const height = cameraView.width * rect.height / rect.width;
      cameraView = { ...cameraView, y: cameraView.y + (cameraView.height - height) / 2, height };
    }
    cameraSize = { width: rect.width, height: rect.height };
    setWorkspaceView(cameraView);
    interactionGeometry = {
      ...geometry,
      workspace: layout.workspace
    };
  };

  const placePiece = (stateId, position, shouldFocus = true, pointerType = "") => {
    session = placeMapReconstructionPiece(session, stateId, position, getInteractionGeometry());
    const placedPosition = session.piecesById[stateId]?.position;
    if (!placedPosition) return;
    const snap = getPlacementSnap(stateId, placedPosition, pointerType);
    if (snap && startPlacementSnap(
      stateId,
      placedPosition,
      snap,
      pointerType,
      shouldFocus
    )) return;
    render();
    if (shouldFocus) focusPiece(stateId);
  };

  const attachBankPointerInteraction = (button, stateId) => {
    const piece = geometry.piecesById[stateId];
    let ignoreNextClick = false;
    button.addEventListener("pointerdown", (event) => {
      if (placementSnapPending || cameraGestureActive || activePiecePointerCancel || activeBankPointerCancel) return;
      if (event.button != null && event.button !== 0) return;
      if (event.target.closest?.(".chip-speaker-button")) return;
      if (event.pointerType === "touch"
        && !event.target.closest?.(".map-reconstruction-bank-thumbnail")) return;
      activeBankPointerCancel?.();
      const start = { x: event.clientX, y: event.clientY };
      const thumbnailPath = button.querySelector(".map-reconstruction-bank-thumbnail path");
      const pointerOffset = event.target === thumbnailPath
        ? mapClientPointToSvgGeometry(thumbnailPath, event.clientX, event.clientY)
        : getMapReconstructionDefaultGrabAnchor(piece);
      let moved = false;
      let finished = false;
      let proxy = null;
      const cleanup = () => {
        if (button.hasPointerCapture?.(event.pointerId)) {
          button.releasePointerCapture?.(event.pointerId);
        }
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", up);
        window.removeEventListener("pointercancel", cancel);
        button.removeEventListener("lostpointercapture", lostCapture);
        document.removeEventListener("keydown", keydown);
        proxy?.remove();
        button.classList.remove("is-dragging-source");
        if (activeBankPointerCancel === cancelActive) activeBankPointerCancel = null;
      };
      const finish = (upEvent, cancelled) => {
        if (finished) return;
        finished = true;
        cleanup();
        if (cancelled || destroyed) {
          restoreMobileDragAssistance();
          return;
        }
        ignoreNextClick = true;
        if (moved) {
          if (pointIsInsideElement(workspaceSvg, upEvent.clientX, upEvent.clientY)) {
            const point = mapClientPointToReconstructionWorkspace(
              workspaceSvg,
              upEvent.clientX,
              upEvent.clientY
            );
            if (point) {
              placePiece(
                stateId,
                getMapReconstructionShelfDropPosition(point, pointerOffset),
                true,
                event.pointerType
              );
            }
          }
          restoreMobileDragAssistance();
          return;
        }
        restoreMobileDragAssistance();
        placePiece(stateId, findMapReconstructionAutomaticPlacement(
          session,
          stateId,
          getInteractionGeometry()
        ));
      };
      const move = (moveEvent) => {
        if (moveEvent.pointerId !== event.pointerId) return;
        const distance = Math.hypot(moveEvent.clientX - start.x, moveEvent.clientY - start.y);
        if (!moved && distance <= 6) return;
        if (!moved) {
          moved = true;
          proxy = createMapReconstructionDragPreview(piece, workspaceSvg, {
            pointerOffset,
            showLabel: true
          });
          button.classList.add("is-dragging-source");
          button.setPointerCapture?.(event.pointerId);
          const worldPoint = mapClientPointToReconstructionWorkspace(
            workspaceSvg,
            moveEvent.clientX,
            moveEvent.clientY
          ) || {
            x: (Number(geometry.workspace.x) || 0) + geometry.workspace.width / 2,
            y: (Number(geometry.workspace.y) || 0) + geometry.workspace.height / 2
          };
          beginMobileDragAssistance(
            worldPoint,
            getMapReconstructionShelfDropPosition(worldPoint, pointerOffset),
            moveEvent.pointerType
          );
        }
        moveEvent.preventDefault();
        proxy?.position(moveEvent.clientX, moveEvent.clientY);
      };
      const up = (upEvent) => {
        if (upEvent.pointerId === event.pointerId) finish(upEvent, false);
      };
      const cancel = (cancelEvent) => {
        if (cancelEvent.pointerId === event.pointerId) finish(cancelEvent, true);
      };
      const lostCapture = (captureEvent) => {
        if (captureEvent.pointerId === event.pointerId && !finished) {
          finish(captureEvent, true);
        }
      };
      const keydown = (keyEvent) => {
        if (keyEvent.key === "Escape") finish(event, true);
      };
      const cancelActive = () => finish(event, true);
      activeBankPointerCancel = cancelActive;
      window.addEventListener("pointermove", move, { passive: false });
      window.addEventListener("pointerup", up);
      window.addEventListener("pointercancel", cancel);
      button.addEventListener("lostpointercapture", lostCapture);
      document.addEventListener("keydown", keydown);
    });
    button.addEventListener("keydown", (event) => {
      if (!["Enter", " "].includes(event.key) || session.piecesById[stateId]?.position) return;
      event.preventDefault();
      placePiece(stateId, findMapReconstructionAutomaticPlacement(
        session,
        stateId,
        getInteractionGeometry()
      ));
    });
    button.addEventListener("click", (event) => {
      if (event.target.closest?.(".chip-speaker-button")) return;
      if (ignoreNextClick) {
        ignoreNextClick = false;
        event.preventDefault();
        return;
      }
      if (session.piecesById[stateId]?.position) return;
      placePiece(stateId, findMapReconstructionAutomaticPlacement(
        session,
        stateId,
        getInteractionGeometry()
      ));
    });
  };

  const attachPlacedPieceInteraction = (group, stateId) => {
    const pieceState = session.piecesById[stateId];
    group.tabIndex = 0;
    group.setAttribute("role", "button");
    group.setAttribute("aria-label", `${geometry.piecesById[stateId].name}, placed. Double-click or choose Select connected group to select touching pieces. Arrow keys move the selection; Delete returns this state to the state bank.`);
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
          getInteractionGeometry(),
          { large: event.shiftKey }
        );
        render();
        focusPiece(stateId);
      } else if (event.key.toLowerCase() === "g") {
        event.preventDefault();
        selectConnectedGroup(stateId, { timeStamp: event.timeStamp });
        render();
        focusPiece(stateId);
      } else if (event.key === "Escape") {
        event.preventDefault();
        session = clearMapReconstructionSelection(session);
        render();
      } else if (event.key === "Delete" || event.key === "Backspace") {
        event.preventDefault();
        session = returnMapReconstructionPieceToBank(session, stateId);
        render();
      }
    });
    group.addEventListener("dblclick", (event) => {
      event.preventDefault();
      if (event.timeStamp - lastConnectedSelectionAt < 120) return;
      selectConnectedGroup(stateId, {
        additive: event.ctrlKey || event.metaKey || event.shiftKey,
        timeStamp: event.timeStamp
      });
      render();
      focusPiece(stateId);
    });
    group.addEventListener("pointerdown", (event) => {
      if (placementSnapPending || cameraGestureActive || activePiecePointerCancel || activeBankPointerCancel) return;
      if (event.button != null && event.button !== 0) return;
      const startPoint = mapClientPointToReconstructionWorkspace(workspaceSvg, event.clientX, event.clientY);
      const pieceGeometry = geometry.piecesById[stateId];
      if (!startPoint || !isPointInMapReconstructionPiece(pieceGeometry, {
        x: startPoint.x - pieceState.position.x,
        y: startPoint.y - pieceState.position.y
      })) return;
      event.preventDefault();
      event.stopPropagation();
      activePiecePointerCancel?.();
      const originalSession = session;
      const canDrag = !(event.ctrlKey || event.metaKey || event.shiftKey);
      if (canDrag) {
        session = beginMapReconstructionDrag(
          session,
          stateId,
          event.pointerId,
          startPoint,
          pieceState.position
        );
      }
      const dragStartSession = session;
      let moved = false;
      let finished = false;
      group.parentNode?.appendChild(group);
      group.setPointerCapture?.(event.pointerId);
      group.focus();
      const finish = (finishEvent, cancelled) => {
        if (finished) return;
        finished = true;
        if (group.hasPointerCapture?.(event.pointerId)) {
          group.releasePointerCapture?.(event.pointerId);
        }
        group.removeEventListener("pointermove", move);
        group.removeEventListener("pointerup", up);
        group.removeEventListener("pointercancel", cancel);
        group.removeEventListener("lostpointercapture", lostCapture);
        if (activePiecePointerCancel === cancelActive) activePiecePointerCancel = null;
        if (cancelled) {
          session = originalSession;
        } else if (moved) {
          session = endMapReconstructionDrag(session);
          const position = session.piecesById[stateId]?.position;
          const snap = getPlacementSnap(stateId, position, event.pointerType);
          restoreMobileDragAssistance();
          if (snap && startPlacementSnap(
            stateId,
            position,
            snap,
            event.pointerType
          )) return;
        } else {
          if (canDrag) session = endMapReconstructionDrag(session);
          applyPieceClickSelection(stateId, finishEvent);
        }
        restoreMobileDragAssistance();
        render();
        focusPiece(stateId);
      };
      const move = (moveEvent) => {
        if (moveEvent.pointerId !== event.pointerId || !canDrag) return;
        moveEvent.preventDefault();
        const current = mapClientPointToReconstructionWorkspace(workspaceSvg, moveEvent.clientX, moveEvent.clientY);
        if (!current) return;
        const clientDistance = Math.hypot(
          moveEvent.clientX - event.clientX,
          moveEvent.clientY - event.clientY
        );
        if (!moved && clientDistance <= 4) return;
        if (!moved) {
          moved = true;
          beginMobileDragAssistance(
            current,
            session.piecesById[stateId]?.position,
            moveEvent.pointerType
          );
        }
        const view = getWorkspaceView();
        const rect = workspaceSvg.getBoundingClientRect();
        const useScreenDelta = isMapReconstructionMobileAssistanceEnabled()
          && Boolean(mobileDragPointerType)
          && view
          && rect.width
          && rect.height;
        const delta = useScreenDelta
          ? {
              x: (moveEvent.clientX - event.clientX) / rect.width * view.width,
              y: (moveEvent.clientY - event.clientY) / rect.height * view.height
            }
          : { x: current.x - startPoint.x, y: current.y - startPoint.y };
        session = moveMapReconstructionSelectedPieces(
          dragStartSession,
          stateId,
          delta,
          getInteractionGeometry()
        );
        getSelectedStateIds().forEach((selectedStateId) => {
          const position = session.piecesById[selectedStateId].position;
          container.querySelector(
            `[data-map-reconstruction-state-id="${selectedStateId}"]`
          )?.setAttribute("transform", `translate(${position.x} ${position.y})`);
        });
        group.classList.add("is-dragging");
      };
      const up = (upEvent) => {
        if (upEvent.pointerId === event.pointerId) finish(upEvent, false);
      };
      const cancel = (cancelEvent) => {
        if (cancelEvent.pointerId === event.pointerId) finish(cancelEvent, true);
      };
      const lostCapture = (captureEvent) => {
        if (captureEvent.pointerId === event.pointerId && !finished) {
          finish(captureEvent, true);
        }
      };
      const cancelActive = () => finish(event, true);
      activePiecePointerCancel = cancelActive;
      group.addEventListener("pointermove", move);
      group.addEventListener("pointerup", up);
      group.addEventListener("pointercancel", cancel);
      group.addEventListener("lostpointercapture", lostCapture);
    });
  };

  const attachCameraNavigation = (svg) => {
    const pointers = new Map();
    let moved = false;
    const blocked = () => activePiecePointerCancel || activeBankPointerCancel || placementSnapPending;
    const gesture = () => {
      const points = [...pointers.values()];
      const a = points[0], b = points[1] || a;
      return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2,
        distance: Math.hypot(a.x - b.x, a.y - b.y) };
    };
    svg.addEventListener("pointerdown", (event) => {
      if (blocked() || selectionMode || event.button > 0
        || event.target.closest?.(".map-reconstruction-piece:not(.is-locked)")) return;
      event.preventDefault();
      cancelMobileAssistance();
      pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      cameraGestureActive = true;
      if (pointers.size === 1) moved = false;
      else moved = true;
      svg.setPointerCapture?.(event.pointerId);
    });
    svg.addEventListener("pointermove", (event) => {
      if (!pointers.has(event.pointerId)) return;
      if (blocked()) { pointers.clear(); cameraGestureActive = false; return; }
      const before = gesture();
      pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      const after = gesture();
      const dx = after.x - before.x, dy = after.y - before.y;
      if (!dx && !dy && before.distance === after.distance) return;
      moved = true;
      manualCamera = true;
      const rect = svg.getBoundingClientRect();
      let view = getWorkspaceView();
      if (before.distance > 0 && after.distance > 0) {
        const anchor = { x: view.x + (before.x - rect.left) / rect.width * view.width,
          y: view.y + (before.y - rect.top) / rect.height * view.height };
        view = zoomReconstructionViewport(view, after.distance / before.distance, anchor, fittedView);
      }
      setWorkspaceView(panReconstructionViewport(view, dx, dy, rect));
    });
    const end = (event) => {
      if (!pointers.delete(event.pointerId)) return;
      cameraGestureActive = pointers.size > 0;
      if (event.type === "pointerup" && !moved && !pointers.size && session.phase === "arranging") {
        session = clearMapReconstructionSelection(session);
        render();
      }
    };
    svg.addEventListener("pointerup", end);
    svg.addEventListener("pointercancel", end);
    svg.addEventListener("lostpointercapture", end);
    svg.addEventListener("wheel", (event) => {
      event.preventDefault();
      if (blocked() || pointers.size) return;
      cancelMobileAssistance();
      const anchor = mapClientPointToReconstructionWorkspace(svg, event.clientX, event.clientY);
      if (!anchor) return;
      manualCamera = true;
      const delta = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? 500 : 1);
      setWorkspaceView(zoomReconstructionViewport(getWorkspaceView(), Math.exp(-Math.max(-250, Math.min(250, delta)) * 0.002), anchor, fittedView));
    }, { passive: false });
    svg.addEventListener("keydown", (event) => {
      if (event.target !== svg || blocked()) return;
      const offsets = { ArrowLeft: [40, 0], ArrowRight: [-40, 0], ArrowUp: [0, 40], ArrowDown: [0, -40] };
      const offset = offsets[event.key];
      if (!offset) return;
      event.preventDefault();
      cancelMobileAssistance();
      manualCamera = true;
      setWorkspaceView(panReconstructionViewport(getWorkspaceView(), ...offset, svg.getBoundingClientRect()));
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
      viewBox: lockedStateIds.length
        ? `${geometry.workspace.x || 0} ${geometry.workspace.y || 0} ${geometry.workspace.width} ${geometry.workspace.height}`
        : visualPlan.viewBox,
      preserveAspectRatio: "xMidYMid meet",
      tabindex: "0",
      role: "group",
      "aria-label": session.phase === "arranging"
        ? lockedStateIds.length
          ? `${region.regionName} reconstruction workspace with locked prior states`
          : `Blank ${region.regionName} reconstruction workspace`
        : visualPlan.isSuccess
          ? `Completed ${region.regionName} reconstruction`
          : visualPlan.isCorrectPlacement
            ? `Correct ${region.regionName} placement`
            : `Submitted ${region.regionName} reconstruction`
    });
    workspaceSvg.dataset.mapReconstructionPhase = session.phase;
    if (visualPlan.isSuccess) workspaceSvg.dataset.mapReconstructionSuccessful = "true";
    if (lockedStateIds.length) {
      const lockedLayer = createSvgElement("g", {
        class: "map-reconstruction-locked-layer",
        "data-map-reconstruction-locked-context": "true",
        "aria-label": "Previously learned states, locked in place"
      });
      lockedStateIds.forEach((stateId) => {
        const piece = geometry.piecesById[stateId];
        const group = createPieceGroup(piece, piece.correctPosition, {
          className: "map-reconstruction-piece is-locked",
          smallLabel: region.smallLabelStateIds?.includes(stateId)
        });
        group.querySelector("text").textContent = getStateById(stateId)?.abbreviation || piece.name;
        group.setAttribute("aria-label", `${piece.name}, locked`);
        group.dataset.mapReconstructionLockedStateId = stateId;
        lockedLayer.appendChild(group);
      });
      workspaceSvg.appendChild(lockedLayer);
    }
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
          className: `map-reconstruction-piece is-${status}${getSelectedStateIds().includes(stateId) ? " is-selected" : ""}${session.selectedStateId === stateId ? " is-primary-selected" : ""}`,
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
    if (session.phase === "arranging") {
      let blankPointer = null;
      workspaceSvg.addEventListener("pointerdown", (event) => {
        if (!selectionMode || blankPointer || event.target !== workspaceSvg || event.button != null && event.button !== 0) return;
        const point = mapClientPointToReconstructionWorkspace(
          workspaceSvg,
          event.clientX,
          event.clientY
        );
        if (!point) return;
        blankPointer = {
          pointerId: event.pointerId,
          x: event.clientX,
          y: event.clientY,
          start: point,
          additive: event.ctrlKey || event.metaKey || event.shiftKey,
          moved: false,
          marquee: null
        };
        workspaceSvg.setPointerCapture?.(event.pointerId);
      });
      workspaceSvg.addEventListener("pointermove", (event) => {
        if (!selectionMode || !blankPointer || blankPointer.pointerId !== event.pointerId) return;
        const point = mapClientPointToReconstructionWorkspace(
          workspaceSvg,
          event.clientX,
          event.clientY
        );
        if (!point) return;
        if (!blankPointer.moved && Math.hypot(
          event.clientX - blankPointer.x,
          event.clientY - blankPointer.y
        ) <= 5) return;
        event.preventDefault();
        blankPointer.moved = true;
        if (!blankPointer.marquee) {
          blankPointer.marquee = createSvgElement("rect", {
            class: "map-reconstruction-marquee",
            "aria-hidden": "true"
          });
          workspaceSvg.appendChild(blankPointer.marquee);
        }
        blankPointer.marquee.setAttribute("x", Math.min(blankPointer.start.x, point.x));
        blankPointer.marquee.setAttribute("y", Math.min(blankPointer.start.y, point.y));
        blankPointer.marquee.setAttribute("width", Math.abs(point.x - blankPointer.start.x));
        blankPointer.marquee.setAttribute("height", Math.abs(point.y - blankPointer.start.y));
      });
      workspaceSvg.addEventListener("pointerup", (event) => {
        if (!blankPointer || blankPointer.pointerId !== event.pointerId) return;
        const activePointer = blankPointer;
        blankPointer = null;
        const clientDistance = Math.hypot(
          event.clientX - activePointer.x,
          event.clientY - activePointer.y
        );
        if (!selectionMode && clientDistance > 5) return;
        const point = mapClientPointToReconstructionWorkspace(
          workspaceSvg,
          event.clientX,
          event.clientY
        );
        if (activePointer.moved && point) {
          const stateIds = getMapReconstructionStatesIntersectingBounds(
            session,
            geometry,
            {
              minX: activePointer.start.x,
              minY: activePointer.start.y,
              maxX: point.x,
              maxY: point.y
            }
          );
          session = selectMapReconstructionStates(session, stateIds, {
            additive: activePointer.additive,
            primaryStateId: stateIds[stateIds.length - 1]
          });
        } else {
          session = clearMapReconstructionSelection(session);
        }
        render();
      });
      workspaceSvg.addEventListener("pointercancel", () => {
        blankPointer?.marquee?.remove();
        blankPointer = null;
      });
      workspaceSvg.addEventListener("keydown", (event) => {
        if (event.key !== "Escape") return;
        event.preventDefault();
        session = clearMapReconstructionSelection(session);
        render();
      });
    }
    if (visualPlan.isSuccess && successVisualPending) successVisualPending = false;
    const heading = createElement("div", "map-reconstruction-map-heading");
    const navigation = createElement("div", "map-reconstruction-map-controls");
    navigation.setAttribute("role", "group");
    navigation.setAttribute("aria-label", "Map navigation");
    const changeZoom = (factor) => {
      if (activePiecePointerCancel || activeBankPointerCancel || placementSnapPending) return;
      cancelMobileAssistance();
      const view = getWorkspaceView();
      manualCamera = true;
      setWorkspaceView(zoomReconstructionViewport(view, factor,
        { x: view.x + view.width / 2, y: view.y + view.height / 2 }, fittedView));
    };
    navigation.append(
      createButton("−", "map-reconstruction-map-control", () => changeZoom(1 / 1.35)),
      createButton("+", "map-reconstruction-map-control", () => changeZoom(1.35)),
      createButton("Fit map", "map-reconstruction-map-control", () => {
        if (activePiecePointerCancel || activeBankPointerCancel || placementSnapPending) return;
        cancelMobileAssistance();
        manualCamera = false;
        setWorkspaceView(fittedView);
      })
    );
    navigation.children[0].setAttribute("aria-label", "Zoom out");
    navigation.children[1].setAttribute("aria-label", "Zoom in");
    heading.append(title, navigation);
    workspaceSvg.style.backgroundColor = baseWaterColor;
    attachCameraNavigation(workspaceSvg);
    workspace.append(heading, workspaceSvg);
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
    render();
    if (session.correctionState !== "playing") {
      container.querySelector(".map-reconstruction-replay-action")?.focus();
      return;
    }
    correctionTimer = window.setTimeout(() => {
      correctionTimer = null;
      if (destroyed) return;
      session = completeMapReconstructionCorrection(session);
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
    render();
    container.querySelector(".map-reconstruction-replay-action, .map-reconstruction-show-correction-action")?.focus();
  };

  const resetAttempt = () => {
    activeBankPointerCancel?.();
    activePiecePointerCancel?.();
    cancelMobileAssistance();
    clearCorrectionTimer();
    successVisualPending = false;
    cameraView = null;
    manualCamera = false;
    session = resetMapReconstructionSession(session);
    render();
    container.querySelector(".map-reconstruction-bank-piece")?.focus();
  };

  const createActions = () => {
    const actions = createElement("footer", "map-reconstruction-actions");
    const appendContinueAction = () => {
      if (typeof options.onContinue === "function") {
        actions.appendChild(createButton(
          options.continueLabel || "Continue",
          "map-reconstruction-primary-action map-reconstruction-continue-action",
          options.onContinue
        ));
      }
      return actions;
    };
    if (session.phase === "result") {
      if (session.evaluation?.isComplete) {
        actions.appendChild(createButton(
          "Try again",
          typeof options.onContinue === "function"
            ? "map-reconstruction-secondary-action"
            : "map-reconstruction-primary-action",
          resetAttempt
        ));
        return appendContinueAction();
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
        return appendContinueAction();
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
        return appendContinueAction();
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
      return appendContinueAction();
    }
    const selectedStateIds = getSelectedStateIds();
    const selectedPiece = session.selectedStateId ? session.piecesById[session.selectedStateId] : null;
    const selectionStatus = createElement("span", "map-reconstruction-selection-status");
    selectionStatus.textContent = `${selectedStateIds.length} ${
      selectedStateIds.length === 1 ? "state" : "states"
    } selected`;
    const selectionHelp = createElement("span", "map-reconstruction-selection-help");
    selectionHelp.textContent = selectionMode
      ? "Select a state, then choose Select connected group."
      : "Double-click a state to select all connected pieces.";
    actions.append(
      selectionStatus,
      selectionHelp,
      createButton(
        selectionMode ? "Done selecting" : "Select multiple",
        "map-reconstruction-secondary-action map-reconstruction-selection-mode-action",
        () => {
          selectionMode = !selectionMode;
          render();
        },
        { ariaPressed: selectionMode }
      ),
      createButton(
        "Select connected group",
        "map-reconstruction-secondary-action map-reconstruction-connected-action",
        () => {
          if (!session.selectedStateId) return;
          selectConnectedGroup(session.selectedStateId);
          render();
          focusPiece(session.selectedStateId);
        },
        { disabled: !selectedPiece?.position }
      ),
      createButton(
        "Clear selection",
        "map-reconstruction-secondary-action map-reconstruction-clear-selection-action",
        () => {
          session = clearMapReconstructionSelection(session);
          render();
        },
        { disabled: !selectedStateIds.length }
      )
    );
    actions.append(
      createButton("Reset", "map-reconstruction-secondary-action", () => {
        resetAttempt();
      }),
      createButton("Return piece", "map-reconstruction-secondary-action", () => {
        const stateId = session.selectedStateId;
        if (!stateId) return;
        session = returnMapReconstructionPieceToBank(session, stateId);
        render();
        container.querySelector(`[data-map-reconstruction-bank-state-id="${stateId}"]`)?.focus();
      }, { disabled: !selectedPiece?.position }),
      createButton("Submit", "map-reconstruction-primary-action", () => {
        const evaluation = lockedStateIds.length
          ? evaluateGuidedMapReconstruction(session, region, getInteractionGeometry(), lockedStateIds)
          : evaluateMapReconstruction(session, region, getInteractionGeometry());
        session = submitMapReconstructionSession(session, evaluation);
        successVisualPending = evaluation.isComplete;
        render();
        options.onEvaluation?.(evaluation);
        container.querySelector(evaluation.isComplete
          ? ".map-reconstruction-primary-action"
          : ".map-reconstruction-show-correction-action")?.focus();
      })
    );
    return actions;
  };

  function render() {
    cameraGestureActive = false;
    if (destroyed) return;
    workspaceResizeObserver?.disconnect();
    document.querySelectorAll(".map-reconstruction-drag-proxy").forEach((proxy) => proxy.remove());
    const successClass = session.phase === "result" && session.evaluation?.isComplete ? " is-success" : "";
    const shell = createElement("div", `map-reconstruction-shell is-${session.phase}${successClass}`);
    shell.dataset.mapReconstructionRegionId = region.id;
    const content = createElement("div", "map-reconstruction-content");
    content.append(createWorkspace(), createBank());
    shell.append(content, createActions());
    container.replaceChildren(shell);
    refreshWorkspaceInteractionLayout();
    workspaceResizeObserver?.observe(workspaceSvg);
    options.onStateChange?.(session);
  }

  if (typeof ResizeObserver === "function") {
    workspaceResizeObserver = new ResizeObserver(refreshWorkspaceInteractionLayout);
  }
  window.addEventListener("resize", refreshWorkspaceInteractionLayout);
  render();
  return {
    getState: () => JSON.parse(JSON.stringify(session)),
    reset: () => {
      activeBankPointerCancel?.();
      activePiecePointerCancel?.();
      cancelMobileAssistance();
      clearCorrectionTimer();
      cameraView = null;
      manualCamera = false;
      session = resetMapReconstructionSession(session);
      render();
    },
    destroy: () => {
      destroyed = true;
      window.GeographyChipSpeech?.stopAudio?.();
      activeBankPointerCancel?.();
      activePiecePointerCancel?.();
      cancelMobileAssistance();
      clearCorrectionTimer();
      workspaceResizeObserver?.disconnect();
      window.removeEventListener("resize", refreshWorkspaceInteractionLayout);
      container.replaceChildren();
    }
  };
}
