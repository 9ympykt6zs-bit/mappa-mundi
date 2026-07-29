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
import { evaluateMapReconstruction } from "./map-reconstruction-evaluation.js";
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
  createMapReconstructionFingerMagnifier,
  getMapReconstructionMobileSnapTarget,
  isMapReconstructionMobileAssistanceEnabled
} from "./map-reconstruction-mobile-assistance.js";
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
  let session = createMapReconstructionSession(region, geometry, { random: options.random });
  let announcement = "";
  let destroyed = false;
  let workspaceSvg = null;
  let successVisualPending = false;
  let correctionTimer = null;
  let interactionGeometry = geometry;
  let workspaceResizeObserver = null;
  let activeBankPointerCancel = null;
  let activePiecePointerCancel = null;
  let selectionMode = false;
  let lastPieceClick = null;
  let lastConnectedSelectionAt = -Infinity;
  let mobileCameraHomeView = null;
  let mobileCameraAnimationCancel = null;
  let mobileMagnifier = null;
  let mobileDragPointerType = null;
  let mobileSnapAnimationCancel = null;
  let mobileSnapPending = false;
  const successVisualId = ++mapReconstructionVisualSequence;

  const clearCorrectionTimer = () => {
    if (correctionTimer != null) window.clearTimeout(correctionTimer);
    correctionTimer = null;
  };

  const focusPiece = (stateId) => requestAnimationFrame(() => {
    container.querySelector(`[data-map-reconstruction-state-id="${stateId}"]`)?.focus();
  });

  const announce = (message, options = {}) => {
    announcement = message;
    if (options.speak === false) return;
    const audioEntry = getActivityAudioEntryByText(message);
    void window.GeographyChipSpeech?.speakAudioPathAndWait?.(
      message,
      audioEntry?.audioPath || null
    );
  };

  const getSelectedStateIds = () => getMapReconstructionSelectedStateIds(session);

  const getWorkspaceView = () => {
    const view = workspaceSvg?.viewBox?.baseVal;
    return view?.width && view?.height
      ? { x: view.x, y: view.y, width: view.width, height: view.height }
      : null;
  };

  const setWorkspaceView = (view) => {
    if (!workspaceSvg || !view) return;
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

  const beginMobileDragAssistance = (
    clientPoint,
    worldPoint,
    piece,
    position,
    pointerType,
    pointerOffset = null
  ) => {
    if (pointerType === "mouse"
      || !isMapReconstructionMobileAssistanceEnabled()
      || !workspaceSvg) return;
    mobileDragPointerType = pointerType || "touch";
    const currentView = getWorkspaceView();
    if (!currentView) return;
    if (!mobileCameraHomeView) mobileCameraHomeView = { ...currentView };
    mobileMagnifier?.destroy();
    mobileMagnifier = createMapReconstructionFingerMagnifier(workspaceSvg);
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
    mobileMagnifier.update(clientPoint, worldPoint, { piece, position, pointerOffset });
  };

  const updateMobileDragAssistance = (
    clientPoint,
    worldPoint,
    piece,
    position,
    pointerOffset = null
  ) => {
    mobileMagnifier?.update(clientPoint, worldPoint, { piece, position, pointerOffset });
  };

  const restoreMobileDragAssistance = () => {
    mobileMagnifier?.destroy();
    mobileMagnifier = null;
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
    mobileMagnifier?.destroy();
    mobileMagnifier = null;
    mobileDragPointerType = null;
    if (mobileCameraHomeView) setWorkspaceView(mobileCameraHomeView);
    mobileCameraHomeView = null;
    mobileSnapAnimationCancel?.();
    mobileSnapAnimationCancel = null;
    mobileSnapPending = false;
  };

  const getMobileSnap = (stateId, position) => {
    if (!mobileDragPointerType) return null;
    const view = getWorkspaceView();
    const rect = workspaceSvg?.getBoundingClientRect?.();
    if (!view || !rect?.width || !rect?.height) return null;
    return getMapReconstructionMobileSnapTarget({
      position,
      piece: geometry.piecesById[stateId],
      geometry,
      selectedPieceCount: getSelectedStateIds().length,
      cssPixelsPerWorldUnit: Math.min(rect.width / view.width, rect.height / view.height)
    });
  };

  const startMobileSnap = (stateId, fromPosition, snap, shouldFocus = true) => {
    if (!snap || mobileSnapPending) return false;
    mobileSnapPending = true;
    session = endMapReconstructionDrag(session);
    render();
    requestAnimationFrame(() => {
      if (destroyed || !mobileSnapPending) return;
      const group = container.querySelector(
        `[data-map-reconstruction-state-id="${stateId}"]`
      );
      group?.classList.add("is-mobile-snapping");
      mobileSnapAnimationCancel = animateMapReconstructionMobileValue({
        from: fromPosition,
        to: snap.position,
        durationMs: MAP_RECONSTRUCTION_MOBILE_ASSISTANCE.snapDurationMs,
        onUpdate: (position) => {
          group?.setAttribute("transform", `translate(${position.x} ${position.y})`);
        },
        onFinish: () => {
          mobileSnapAnimationCancel = null;
          if (destroyed || !mobileSnapPending) return;
          session = placeMapReconstructionPiece(
            session,
            stateId,
            snap.position,
            getInteractionGeometry()
          );
          mobileSnapPending = false;
          try {
            window.navigator?.vibrate?.(18);
          } catch {
            // Haptics are optional.
          }
          render();
          if (shouldFocus) focusPiece(stateId);
        }
      });
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
    if (component.length <= 1) {
      announce(`No connected states found. ${geometry.piecesById[stateId].name} selected.`);
    } else {
      announce(`Selected a connected group of ${component.length} states.`);
    }
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
    const count = getSelectedStateIds().length;
    announce(count === 1
      ? `${geometry.piecesById[stateId].name} selected.`
      : `${count} states selected.`);
  };

  const getInteractionGeometry = () => (
    session.phase === "arranging" ? interactionGeometry : geometry
  );

  const refreshWorkspaceInteractionLayout = () => {
    if (!workspaceSvg || session.phase !== "arranging") {
      interactionGeometry = geometry;
      return;
    }
    const rect = workspaceSvg.getBoundingClientRect();
    const layout = getMapReconstructionInteractionLayout(geometry.workspace, rect, {
      insetCssPixels: MAP_RECONSTRUCTION_WORKSPACE_INSET_CSS_PIXELS
    });
    if (!layout) return;
    workspaceSvg.setAttribute("viewBox", layout.viewBox.value);
    interactionGeometry = {
      ...geometry,
      workspace: layout.workspace
    };
  };

  const placePiece = (stateId, position, shouldFocus = true) => {
    session = placeMapReconstructionPiece(session, stateId, position, getInteractionGeometry());
    const placedPosition = session.piecesById[stateId]?.position;
    if (!placedPosition) return;
    const name = geometry.piecesById[stateId]?.name || stateId;
    announce(`${name} placed in the workspace and selected.`, { speak: false });
    const snap = getMobileSnap(stateId, placedPosition);
    if (snap && startMobileSnap(stateId, placedPosition, snap, shouldFocus)) return;
    render();
    if (shouldFocus) focusPiece(stateId);
  };

  const attachBankPointerInteraction = (button, stateId) => {
    const piece = geometry.piecesById[stateId];
    let ignoreNextClick = false;
    button.addEventListener("pointerdown", (event) => {
      if (mobileSnapPending) return;
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
              placePiece(stateId, getMapReconstructionShelfDropPosition(point, pointerOffset));
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
            { x: moveEvent.clientX, y: moveEvent.clientY },
            worldPoint,
            piece,
            getMapReconstructionShelfDropPosition(worldPoint, pointerOffset),
            moveEvent.pointerType,
            pointerOffset
          );
        }
        moveEvent.preventDefault();
        proxy?.position(moveEvent.clientX, moveEvent.clientY);
        const worldPoint = mapClientPointToReconstructionWorkspace(
          workspaceSvg,
          moveEvent.clientX,
          moveEvent.clientY
        );
        if (worldPoint) {
          updateMobileDragAssistance(
            { x: moveEvent.clientX, y: moveEvent.clientY },
            worldPoint,
            piece,
            getMapReconstructionShelfDropPosition(worldPoint, pointerOffset),
            pointerOffset
          );
        }
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
        announce(`${geometry.piecesById[stateId].name} moved ${directions[event.key]}.`, {
          speak: false
        });
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
        announce("Selection cleared.");
        render();
      } else if (event.key === "Delete" || event.key === "Backspace") {
        event.preventDefault();
        session = returnMapReconstructionPieceToBank(session, stateId);
        announce(`${geometry.piecesById[stateId].name} returned to the state bank.`);
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
      if (mobileSnapPending) return;
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
        group.removeEventListener("pointermove", move);
        group.removeEventListener("pointerup", up);
        group.removeEventListener("pointercancel", cancel);
        group.removeEventListener("lostpointercapture", lostCapture);
        if (activePiecePointerCancel === cancelActive) activePiecePointerCancel = null;
        if (cancelled) {
          session = originalSession;
        } else if (moved) {
          session = endMapReconstructionDrag(session);
          const count = getSelectedStateIds().length;
          announce(
            count > 1
              ? `${count} selected states moved.`
              : `${geometry.piecesById[stateId].name} moved.`,
            { speak: false }
          );
          const position = session.piecesById[stateId]?.position;
          const snap = getMobileSnap(stateId, position);
          restoreMobileDragAssistance();
          if (snap && startMobileSnap(stateId, position, snap)) return;
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
            { x: moveEvent.clientX, y: moveEvent.clientY },
            current,
            null,
            session.piecesById[stateId]?.position,
            moveEvent.pointerType
          );
        }
        const view = getWorkspaceView();
        const rect = workspaceSvg.getBoundingClientRect();
        const useScreenDelta = isMapReconstructionMobileAssistanceEnabled()
          && Boolean(mobileMagnifier)
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
        updateMobileDragAssistance(
          { x: moveEvent.clientX, y: moveEvent.clientY },
          current,
          null,
          session.piecesById[stateId]?.position
        );
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
      tabindex: "0",
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
        if (event.target !== workspaceSvg || event.button != null && event.button !== 0) return;
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
          announce(`${getSelectedStateIds().length} states selected.`);
        } else {
          session = clearMapReconstructionSelection(session);
          announce("Selection cleared.");
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
        announce("Selection cleared.");
        render();
      });
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
    activeBankPointerCancel?.();
    activePiecePointerCancel?.();
    cancelMobileAssistance();
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
          announce(selectionMode
            ? "Select multiple mode on. Select states, then choose Done selecting."
            : "Select multiple mode off.");
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
          announce("Selection cleared.");
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
        const name = geometry.piecesById[stateId].name;
        session = returnMapReconstructionPieceToBank(session, stateId);
        announce(`${name} returned to the state bank.`);
        render();
        container.querySelector(`[data-map-reconstruction-bank-state-id="${stateId}"]`)?.focus();
      }, { disabled: !selectedPiece?.position }),
      createButton("Submit", "map-reconstruction-primary-action", () => {
        const evaluation = evaluateMapReconstruction(
          session,
          region,
          getInteractionGeometry()
        );
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
    workspaceResizeObserver?.disconnect();
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
