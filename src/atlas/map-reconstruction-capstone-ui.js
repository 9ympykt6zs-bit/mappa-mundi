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
import {
  clampMapReconstructionCamera,
  fitMapReconstructionCamera,
  focusMapReconstructionCamera,
  getMapReconstructionCameraView,
  panMapReconstructionCamera,
  zoomMapReconstructionCameraAtPoint
} from "./map-reconstruction-camera.js";
import {
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
import { evaluateLower48Reconstruction } from "./map-reconstruction-national-evaluation.js";
import { getActivityAudioEntryByText } from "./activity-audio-registry.js";
import {
  clearLower48ReconstructionSnapshot,
  createLower48ReconstructionSnapshot,
  restoreLower48ReconstructionSession,
  writeLower48ReconstructionSnapshot
} from "./map-reconstruction-persistence.js";
import { getStateById } from "./united-states-atlas-queries.js";

const SVG_NAMESPACE = "http://www.w3.org/2000/svg";
const SAVE_DELAY_MS = 250;
const CORRECTION_DURATION_MS = 900;

function createElement(tagName, className = "") {
  const element = document.createElement(tagName);
  if (className) element.className = className;
  return element;
}

function createSvgElement(tagName, attributes = {}) {
  const element = document.createElementNS(SVG_NAMESPACE, tagName);
  Object.entries(attributes).forEach(([name, value]) => {
    if (value != null) element.setAttribute(name, String(value));
  });
  return element;
}

function createButton(label, className, handler, attributes = {}) {
  const button = createElement("button", className);
  button.type = "button";
  button.textContent = label;
  Object.entries(attributes).forEach(([name, value]) => {
    if (name === "disabled") button.disabled = Boolean(value);
    else button.setAttribute(name, String(value));
  });
  button.addEventListener("click", handler);
  return button;
}

function createSpeaker(text, label) {
  const audioEntry = getActivityAudioEntryByText(text);
  const speaker = window.GeographyChipSpeech?.createChipSpeakerControl(text, {
    audioPath: audioEntry?.audioPath || null
  });
  if (!speaker) return null;
  speaker.classList.add("map-reconstruction-capstone-speaker");
  speaker.setAttribute("aria-label", label);
  speaker.setAttribute("title", label);
  return speaker;
}

function appendSpeaker(element, text, label = "Hear reconstruction feedback") {
  const speaker = createSpeaker(text, label);
  if (speaker) element.appendChild(speaker);
}

function mapClientPointToWorld(svg, clientX, clientY) {
  const matrix = svg?.getScreenCTM?.();
  if (!matrix?.inverse || !svg.createSVGPoint) return null;
  const point = svg.createSVGPoint();
  point.x = clientX;
  point.y = clientY;
  const transformed = point.matrixTransform(matrix.inverse());
  return { x: transformed.x, y: transformed.y };
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

export function getLower48DrawerDropPosition(worldPoint, pointerOffset) {
  if (!Number.isFinite(worldPoint?.x) || !Number.isFinite(worldPoint?.y)) return null;
  return {
    x: worldPoint.x - (Number.isFinite(pointerOffset?.x) ? pointerOffset.x : 0),
    y: worldPoint.y - (Number.isFinite(pointerOffset?.y) ? pointerOffset.y : 0)
  };
}

function pointIsInsideElement(element, clientX, clientY) {
  const rect = element?.getBoundingClientRect?.();
  return Boolean(rect
    && clientX >= rect.left && clientX <= rect.right
    && clientY >= rect.top && clientY <= rect.bottom);
}

function getVisiblePlacementGeometry(geometry, camera, viewport) {
  const view = getMapReconstructionCameraView(camera, geometry.workspace, viewport);
  return {
    ...geometry,
    workspace: {
      x: Math.max(0, view.x),
      y: Math.max(0, view.y),
      width: Math.min(geometry.workspace.width, view.width),
      height: Math.min(geometry.workspace.height, view.height),
      dragPadding: 10
    }
  };
}

function getPieceScreenAnchor(piece, position, view, rect) {
  return {
    x: (position.x - view.x) / view.width * rect.width,
    y: (position.y - view.y) / view.height * rect.height
  };
}

function collisionFreeLabels(candidates, rect) {
  const accepted = [];
  for (const candidate of candidates) {
    const width = Math.min(150, Math.max(34, candidate.text.length * 7.4 + 12));
    const height = 24;
    const box = {
      minX: candidate.x - width / 2 - 4,
      maxX: candidate.x + width / 2 + 4,
      minY: candidate.y - height / 2 - 4,
      maxY: candidate.y + height / 2 + 4
    };
    if (box.minX < 0 || box.maxX > rect.width || box.minY < 0 || box.maxY > rect.height) continue;
    if (candidate.forced) {
      accepted.push({ ...candidate, box });
      continue;
    }
    if (accepted.some((entry) => !(
      box.maxX < entry.box.minX || box.minX > entry.box.maxX
      || box.maxY < entry.box.minY || box.minY > entry.box.maxY
    ))) continue;
    accepted.push({ ...candidate, box });
  }
  return accepted;
}

function getDrawerStateIds(session, geometry, drawer) {
  const query = drawer.search.trim().toLowerCase();
  const stateIds = session.bankOrder.filter((stateId) => {
    const placed = Boolean(session.piecesById[stateId].position);
    if (drawer.filter === "placed" && !placed) return false;
    if (drawer.filter === "unplaced" && placed) return false;
    const state = getStateById(stateId);
    return !query || state?.name.toLowerCase().includes(query)
      || state?.abbreviation.toLowerCase() === query;
  });
  stateIds.sort((leftId, rightId) => (
    geometry.piecesById[leftId].name.localeCompare(
      geometry.piecesById[rightId].name,
      "en",
      { sensitivity: "base", numeric: true }
    ) || leftId.localeCompare(rightId, "en")
  ));
  return stateIds;
}

function makeThumbnail(piece) {
  const svg = createSvgElement("svg", {
    class: "map-reconstruction-capstone-thumbnail",
    viewBox: "0 0 80 54",
    "aria-hidden": "true"
  });
  const group = createSvgElement("g", {
    transform: getMapReconstructionThumbnailTransform(piece, 80, 54, 5)
  });
  group.appendChild(createSvgElement("path", {
    d: piece.path,
    "fill-rule": "evenodd"
  }));
  svg.appendChild(group);
  return svg;
}

function cloneSession(value) {
  return JSON.parse(JSON.stringify(value));
}

export function createLower48ReconstructionActivity(container, options = {}) {
  const { capstone, geometry } = options;
  if (!container || !capstone || !geometry) return null;
  const storage = options.storage || window.localStorage;
  const baseSession = createMapReconstructionSession(capstone, geometry, {
    random: options.random
  });
  let session = options.resumeSnapshot
    ? restoreLower48ReconstructionSession(baseSession, options.resumeSnapshot, capstone) || baseSession
    : baseSession;
  let camera = options.resumeSnapshot?.ui?.camera
    ? { ...options.resumeSnapshot.ui.camera }
    : fitMapReconstructionCamera(geometry.workspace, capstone.camera);
  let drawer = {
    collapsed: options.resumeSnapshot
      ? Boolean(options.resumeSnapshot.ui?.drawer?.collapsed)
      : window.matchMedia?.("(max-width: 720px), (max-height: 520px)")?.matches === true,
    filter: options.resumeSnapshot?.ui?.drawer?.filter || "unplaced",
    sort: "alphabetical",
    search: options.resumeSnapshot?.ui?.drawer?.search || ""
  };
  let correctionShown = Boolean(options.resumeSnapshot?.ui?.correctionShown);
  let completedAt = options.resumeSnapshot?.ui?.completedAt || null;
  let destroyed = false;
  let saveTimer = null;
  let correctionTimer = null;
  let workspaceSvg = null;
  let workspaceWrap = null;
  let announcement = options.resumeSnapshot ? "Lower 48 reconstruction restored." : "";
  let hoveredStateId = "";
  let activePieceDrag = null;
  let activeDrawerPointerCancel = null;
  let panGesture = null;
  let selectionMode = false;
  let lastPieceClick = null;
  let lastConnectedSelectionAt = -Infinity;
  let mobileCameraHome = null;
  let mobileCameraAnimationCancel = null;
  let mobileMagnifier = null;
  let mobileDragPointerType = null;
  let mobileSnapAnimationCancel = null;
  let mobileSnapPending = false;
  const pointers = new Map();

  const clearTimers = () => {
    if (saveTimer != null) window.clearTimeout(saveTimer);
    if (correctionTimer != null) window.clearTimeout(correctionTimer);
    saveTimer = null;
    correctionTimer = null;
  };

  const getUiState = () => ({ camera, drawer, correctionShown, completedAt });
  const flushSave = () => {
    if (saveTimer != null) window.clearTimeout(saveTimer);
    saveTimer = null;
    const snapshot = createLower48ReconstructionSnapshot(session, getUiState());
    if (snapshot) writeLower48ReconstructionSnapshot(storage, snapshot);
  };
  const scheduleSave = () => {
    if (saveTimer != null) window.clearTimeout(saveTimer);
    saveTimer = window.setTimeout(flushSave, SAVE_DELAY_MS);
  };
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
    if (selectionMode || event.ctrlKey || event.metaKey) {
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
  const viewport = () => ({
    width: Math.max(1, workspaceWrap?.clientWidth || 900),
    height: Math.max(1, workspaceWrap?.clientHeight || 600)
  });

  const updateCameraOnly = () => {
    if (!workspaceSvg) return;
    const view = getMapReconstructionCameraView(camera, geometry.workspace, viewport());
    workspaceSvg.setAttribute("viewBox", view.viewBox);
    renderLabels();
    scheduleSave();
  };

  const animateCamera = (from, to, onFinish) => {
    mobileCameraAnimationCancel?.();
    mobileCameraAnimationCancel = animateMapReconstructionMobileValue({
      from,
      to,
      durationMs: MAP_RECONSTRUCTION_MOBILE_ASSISTANCE.cameraDurationMs,
      onUpdate: (value) => {
        camera = clampMapReconstructionCamera(
          value,
          geometry.workspace,
          capstone.camera
        );
        updateCameraOnly();
      },
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
    if (!mobileCameraHome) mobileCameraHome = { ...camera };
    mobileMagnifier?.destroy();
    mobileMagnifier = createMapReconstructionFingerMagnifier(workspaceSvg);
    const target = clampMapReconstructionCamera({
      centerX: Number.isFinite(position?.x) ? position.x : worldPoint.x,
      centerY: Number.isFinite(position?.y) ? position.y : worldPoint.y,
      zoom: camera.zoom * MAP_RECONSTRUCTION_MOBILE_ASSISTANCE.cameraScale
    }, geometry.workspace, capstone.camera);
    animateCamera({ ...camera }, target);
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
    const home = mobileCameraHome;
    if (!home) return;
    animateCamera({ ...camera }, home, () => {
      mobileCameraHome = null;
    });
  };

  const cancelMobileAssistance = () => {
    mobileCameraAnimationCancel?.();
    mobileCameraAnimationCancel = null;
    mobileMagnifier?.destroy();
    mobileMagnifier = null;
    mobileDragPointerType = null;
    if (mobileCameraHome) camera = { ...mobileCameraHome };
    mobileCameraHome = null;
    mobileSnapAnimationCancel?.();
    mobileSnapAnimationCancel = null;
    mobileSnapPending = false;
    pointers.clear();
    activePieceDrag = null;
    panGesture?.element?.remove();
    panGesture = null;
  };

  const getMobileSnap = (stateId, position) => {
    if (!mobileDragPointerType) return null;
    const view = getMapReconstructionCameraView(camera, geometry.workspace, viewport());
    const rect = workspaceSvg?.getBoundingClientRect?.();
    if (!rect?.width || !rect?.height) return null;
    return getMapReconstructionMobileSnapTarget({
      position,
      piece: geometry.piecesById[stateId],
      geometry,
      selectedPieceCount: getSelectedStateIds().length,
      cssPixelsPerWorldUnit: Math.min(rect.width / view.width, rect.height / view.height)
    });
  };

  const startMobileSnap = (stateId, fromPosition, snap) => {
    if (!snap || mobileSnapPending) return false;
    mobileSnapPending = true;
    session = endMapReconstructionDrag(session);
    render();
    requestAnimationFrame(() => {
      if (destroyed || !mobileSnapPending) return;
      const group = container.querySelector(`[data-capstone-piece-id="${stateId}"]`);
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
          session = placeMapReconstructionPiece(session, stateId, snap.position, geometry);
          mobileSnapPending = false;
          try {
            window.navigator?.vibrate?.(18);
          } catch {
            // Haptics are optional.
          }
          render();
          requestAnimationFrame(() => {
            container.querySelector(`[data-capstone-piece-id="${stateId}"]`)?.focus();
          });
        }
      });
    });
    return true;
  };

  const fitSelectedStates = () => {
    const selectedStateIds = getSelectedStateIds();
    if (!selectedStateIds.length) return;
    const bounds = selectedStateIds.map((stateId) => {
      const piece = geometry.piecesById[stateId];
      const position = session.piecesById[stateId].position;
      return {
        minX: position.x + piece.localBounds.minX,
        minY: position.y + piece.localBounds.minY,
        maxX: position.x + piece.localBounds.maxX,
        maxY: position.y + piece.localBounds.maxY
      };
    }).reduce((combined, entry) => ({
      minX: Math.min(combined.minX, entry.minX),
      minY: Math.min(combined.minY, entry.minY),
      maxX: Math.max(combined.maxX, entry.maxX),
      maxY: Math.max(combined.maxY, entry.maxY)
    }), { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity });
    const padding = 70;
    const baseView = getMapReconstructionCameraView(
      { ...camera, zoom: 1 },
      geometry.workspace,
      viewport()
    );
    const desiredWidth = Math.max(1, bounds.maxX - bounds.minX + padding * 2);
    const desiredHeight = Math.max(1, bounds.maxY - bounds.minY + padding * 2);
    camera = clampMapReconstructionCamera({
      centerX: (bounds.minX + bounds.maxX) / 2,
      centerY: (bounds.minY + bounds.maxY) / 2,
      zoom: Math.min(baseView.width / desiredWidth, baseView.height / desiredHeight)
    }, geometry.workspace, capstone.camera);
    announce(`Fit ${selectedStateIds.length} selected states.`);
    updateCameraOnly();
  };

  const placeState = (stateId) => {
    const pieceState = session.piecesById[stateId];
    if (pieceState.position) {
      session = placeMapReconstructionPiece(session, stateId, pieceState.position, geometry);
      camera = focusMapReconstructionCamera(
        camera,
        pieceState.position,
        geometry.workspace,
        capstone.camera
      );
      announce(`${geometry.piecesById[stateId].name} focused at its current position.`);
    } else {
      const placementGeometry = getVisiblePlacementGeometry(
        geometry,
        camera,
        viewport()
      );
      const position = findMapReconstructionAutomaticPlacement(
        session,
        stateId,
        placementGeometry
      );
      session = placeMapReconstructionPiece(session, stateId, position, geometry);
      announce(`${geometry.piecesById[stateId].name} placed in the workspace.`, {
        speak: false
      });
    }
    render();
    requestAnimationFrame(() => {
      container.querySelector(`[data-capstone-piece-id="${stateId}"]`)?.focus();
    });
  };

  const placeDrawerStateAtPoint = (stateId, clientX, clientY, pointerOffset) => {
    const world = mapClientPointToWorld(workspaceSvg, clientX, clientY);
    const position = getLower48DrawerDropPosition(world, pointerOffset);
    if (!position) return false;
    session = placeMapReconstructionPiece(session, stateId, position, geometry);
    const placedPosition = session.piecesById[stateId]?.position;
    if (!placedPosition) return false;
    announce(`${geometry.piecesById[stateId].name} placed in the workspace and selected.`, {
      speak: false
    });
    const snap = getMobileSnap(stateId, placedPosition);
    if (snap && startMobileSnap(stateId, placedPosition, snap)) return true;
    render();
    requestAnimationFrame(() => {
      container.querySelector(`[data-capstone-piece-id="${stateId}"]`)?.focus();
    });
    return true;
  };

  const attachDrawerPointerInteraction = (button, stateId) => {
    const piece = geometry.piecesById[stateId];
    let ignoreNextClick = false;
    button.addEventListener("pointerdown", (event) => {
      if (mobileSnapPending) return;
      if (event.button != null && event.button !== 0) return;
      if (event.pointerType === "touch"
        && !event.target.closest?.(".map-reconstruction-capstone-thumbnail")) return;
      activeDrawerPointerCancel?.();
      const start = { x: event.clientX, y: event.clientY };
      const thumbnailPath = button.querySelector(".map-reconstruction-capstone-thumbnail path");
      const pointerOffset = event.target === thumbnailPath
        ? mapClientPointToSvgGeometry(thumbnailPath, event.clientX, event.clientY)
        : getMapReconstructionDefaultGrabAnchor(piece);
      let moved = false;
      let finished = false;
      let proxy = null;
      const cleanup = () => {
        window.removeEventListener("pointerdown", secondPointerDown, true);
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", up);
        window.removeEventListener("pointercancel", cancel);
        button.removeEventListener("lostpointercapture", lostCapture);
        document.removeEventListener("keydown", keydown);
        proxy?.remove();
        button.classList.remove("is-dragging-source");
        if (activeDrawerPointerCancel === cancelActive) activeDrawerPointerCancel = null;
      };
      const finish = (finishEvent, cancelled) => {
        if (finished) return;
        finished = true;
        cleanup();
        if (cancelled || destroyed) {
          restoreMobileDragAssistance();
          return;
        }
        ignoreNextClick = true;
        if (moved) {
          if (pointIsInsideElement(
            workspaceSvg,
            finishEvent.clientX,
            finishEvent.clientY
          )) {
            placeDrawerStateAtPoint(
              stateId,
              finishEvent.clientX,
              finishEvent.clientY,
              pointerOffset
            );
          }
          restoreMobileDragAssistance();
          return;
        }
        restoreMobileDragAssistance();
        placeState(stateId);
      };
      const move = (moveEvent) => {
        if (moveEvent.pointerId !== event.pointerId) return;
        const distance = Math.hypot(
          moveEvent.clientX - start.x,
          moveEvent.clientY - start.y
        );
        if (!moved && distance <= 6) return;
        if (!moved) {
          moved = true;
          proxy = createMapReconstructionDragPreview(piece, workspaceSvg, {
            className: "map-reconstruction-capstone-drag-proxy",
            pointerOffset
          });
          button.classList.add("is-dragging-source");
          button.setPointerCapture?.(event.pointerId);
          const worldPoint = mapClientPointToWorld(
            workspaceSvg,
            moveEvent.clientX,
            moveEvent.clientY
          ) || { x: camera.centerX, y: camera.centerY };
          beginMobileDragAssistance(
            { x: moveEvent.clientX, y: moveEvent.clientY },
            worldPoint,
            piece,
            getLower48DrawerDropPosition(worldPoint, pointerOffset),
            moveEvent.pointerType,
            pointerOffset
          );
        }
        moveEvent.preventDefault();
        proxy?.position(moveEvent.clientX, moveEvent.clientY);
        const worldPoint = mapClientPointToWorld(
          workspaceSvg,
          moveEvent.clientX,
          moveEvent.clientY
        );
        if (worldPoint) {
          updateMobileDragAssistance(
            { x: moveEvent.clientX, y: moveEvent.clientY },
            worldPoint,
            piece,
            getLower48DrawerDropPosition(worldPoint, pointerOffset),
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
      const secondPointerDown = (pointerEvent) => {
        if (pointerEvent.pointerId !== event.pointerId) finish(pointerEvent, true);
      };
      const keydown = (keyEvent) => {
        if (keyEvent.key === "Escape") finish(event, true);
      };
      const cancelActive = () => finish(event, true);
      activeDrawerPointerCancel = cancelActive;
      window.addEventListener("pointerdown", secondPointerDown, true);
      window.addEventListener("pointermove", move, { passive: false });
      window.addEventListener("pointerup", up);
      window.addEventListener("pointercancel", cancel);
      button.addEventListener("lostpointercapture", lostCapture);
      document.addEventListener("keydown", keydown);
    });
    button.addEventListener("click", (event) => {
      if (ignoreNextClick) {
        ignoreNextClick = false;
        event.preventDefault();
        return;
      }
      if (!session.piecesById[stateId]?.position) placeState(stateId);
    });
  };

  const moveSelectedByKeyboard = (stateId, direction, large) => {
    session = moveMapReconstructionPieceByKeyboard(
      session,
      stateId,
      direction,
      geometry,
      { large }
    );
    const count = getSelectedStateIds().length;
    announce(
      count > 1
        ? `${count} selected states moved ${direction}.`
        : `${geometry.piecesById[stateId].name} moved ${direction}.`,
      { speak: false }
    );
    render();
    requestAnimationFrame(() => {
      container.querySelector(`[data-capstone-piece-id="${stateId}"]`)?.focus();
    });
  };

  const returnState = (stateId) => {
    session = returnMapReconstructionPieceToBank(session, stateId);
    announce(`${geometry.piecesById[stateId].name} returned to the drawer.`);
    render();
    requestAnimationFrame(() => {
      container.querySelector(`[data-capstone-drawer-state-id="${stateId}"]`)?.focus();
    });
  };

  const attachPieceInteraction = (group, path, stateId) => {
    group.tabIndex = 0;
    group.dataset.capstonePieceId = stateId;
    group.setAttribute("role", "button");
    group.setAttribute(
      "aria-label",
      `${geometry.piecesById[stateId].name}, placed. Double-click or choose Select connected group to select touching pieces. Arrow keys move the selection; Delete returns this state.`
    );
    group.addEventListener("mouseenter", () => {
      hoveredStateId = stateId;
      renderLabels();
    });
    group.addEventListener("mouseleave", () => {
      hoveredStateId = "";
      renderLabels();
    });
    group.addEventListener("keydown", (event) => {
      const directions = {
        ArrowLeft: "left",
        ArrowRight: "right",
        ArrowUp: "up",
        ArrowDown: "down"
      };
      if (directions[event.key]) {
        event.preventDefault();
        moveSelectedByKeyboard(stateId, directions[event.key], event.shiftKey);
      } else if (event.key.toLowerCase() === "g") {
        event.preventDefault();
        selectConnectedGroup(stateId, { timeStamp: event.timeStamp });
        render();
        requestAnimationFrame(() => {
          container.querySelector(`[data-capstone-piece-id="${stateId}"]`)?.focus();
        });
      } else if (event.key === "Escape") {
        event.preventDefault();
        session = clearMapReconstructionSelection(session);
        announce("Selection cleared.");
        render();
      } else if (["Delete", "Backspace"].includes(event.key)) {
        event.preventDefault();
        returnState(stateId);
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
      requestAnimationFrame(() => {
        container.querySelector(`[data-capstone-piece-id="${stateId}"]`)?.focus();
      });
    });
    path.addEventListener("pointerdown", (event) => {
      if (mobileSnapPending) return;
      if (event.button != null && event.button !== 0) return;
      const world = mapClientPointToWorld(workspaceSvg, event.clientX, event.clientY);
      const pieceState = session.piecesById[stateId];
      if (!world || !isPointInMapReconstructionPiece(geometry.piecesById[stateId], {
        x: world.x - pieceState.position.x,
        y: world.y - pieceState.position.y
      })) return;
      event.preventDefault();
      event.stopPropagation();
      if (mobileMagnifier && isMapReconstructionMobileAssistanceEnabled()) return;
      pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      workspaceSvg.setPointerCapture?.(event.pointerId);
      if (pointers.size >= 2) {
        activePieceDrag = null;
        const [first, second] = [...pointers.values()];
        panGesture = {
          type: "pinch",
          distance: Math.hypot(second.x - first.x, second.y - first.y),
          midpoint: { x: (first.x + second.x) / 2, y: (first.y + second.y) / 2 },
          camera: { ...camera }
        };
        return;
      }
      const originalSession = session;
      const canDrag = !(event.ctrlKey || event.metaKey || event.shiftKey);
      if (canDrag) {
        session = beginMapReconstructionDrag(
          session,
          stateId,
          event.pointerId,
          world,
          pieceState.position
        );
      }
      activePieceDrag = {
        pointerId: event.pointerId,
        stateId,
        start: world,
        startClient: { x: event.clientX, y: event.clientY },
        originalSession,
        dragStartSession: session,
        canDrag,
        moved: false
      };
      group.focus();
      renderLabels();
    });
  };

  const renderLabels = () => {
    const overlay = workspaceWrap?.querySelector(".map-reconstruction-capstone-label-layer");
    if (!overlay || !workspaceSvg) return;
    overlay.replaceChildren();
    const rect = workspaceSvg.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const view = getMapReconstructionCameraView(camera, geometry.workspace, viewport());
    const forced = new Set([session.selectedStateId, hoveredStateId].filter(Boolean));
    const candidates = getMapReconstructionPieceRenderOrder(session)
      .filter((stateId) => session.piecesById[stateId].position)
      .map((stateId) => {
        const piece = geometry.piecesById[stateId];
        const state = getStateById(stateId);
        const anchor = getPieceScreenAnchor(
          piece,
          session.piecesById[stateId].position,
          view,
          rect
        );
        return {
          stateId,
          x: anchor.x,
          y: anchor.y,
          text: forced.has(stateId) || camera.zoom >= 3.25
            ? piece.name
            : state?.abbreviation || piece.name,
          forced: forced.has(stateId),
          area: piece.area
        };
      })
      .filter((candidate) => candidate.forced || camera.zoom >= 2)
      .sort((left, right) => (
        Number(right.forced) - Number(left.forced) || right.area - left.area
      ));
    collisionFreeLabels(candidates, rect).forEach((candidate) => {
      const label = createElement(
        "span",
        `map-reconstruction-capstone-label${candidate.forced ? " is-forced" : ""}`
      );
      label.textContent = candidate.text;
      label.style.left = `${candidate.x}px`;
      label.style.top = `${candidate.y}px`;
      overlay.appendChild(label);
    });
  };

  const createCameraToolbar = () => {
    const toolbar = createElement("div", "map-reconstruction-capstone-camera-tools");
    toolbar.setAttribute("role", "toolbar");
    toolbar.setAttribute("aria-label", "Map workspace camera");
    toolbar.append(
      createButton("+", "", () => {
        camera = zoomMapReconstructionCameraAtPoint(
          camera,
          camera.zoom * 1.35,
          { x: camera.centerX, y: camera.centerY },
          geometry.workspace,
          capstone.camera
        );
        updateCameraOnly();
      }, { "aria-label": "Zoom in", title: "Zoom in" }),
      createButton("\u2212", "", () => {
        camera = zoomMapReconstructionCameraAtPoint(
          camera,
          camera.zoom / 1.35,
          { x: camera.centerX, y: camera.centerY },
          geometry.workspace,
          capstone.camera
        );
        updateCameraOnly();
      }, { "aria-label": "Zoom out", title: "Zoom out" }),
      createButton("Fit", "", () => {
        camera = fitMapReconstructionCamera(geometry.workspace, capstone.camera);
        updateCameraOnly();
        announce("All of the workspace is visible.");
      }, { "aria-label": "Fit all states", title: "Fit all" })
    );
    return toolbar;
  };

  const createWorkspace = () => {
    const section = createElement("section", "map-reconstruction-capstone-workspace-section");
    const heading = createElement("h2", "map-reconstruction-workspace-title");
    heading.textContent = session.phase === "arranging"
      ? capstone.prompt
      : session.viewMode === "correct"
        ? "Correct placement"
        : session.evaluation?.isComplete
          ? "Completed Lower 48"
          : "Your reconstruction";
    if (session.phase === "arranging") {
      const speaker = createSpeaker(capstone.prompt, "Hear the reconstruction instruction");
      if (speaker) heading.appendChild(speaker);
    }
    workspaceWrap = createElement("div", "map-reconstruction-capstone-workspace-wrap");
    const view = getMapReconstructionCameraView(camera, geometry.workspace, viewport());
    workspaceSvg = createSvgElement("svg", {
      class: "map-reconstruction-workspace map-reconstruction-capstone-workspace",
      viewBox: view.viewBox,
      preserveAspectRatio: "xMidYMid meet",
      tabindex: "0",
      role: "application",
      "aria-label": session.phase === "arranging"
        ? "Blank Lower 48 reconstruction workspace"
        : "Lower 48 reconstruction result"
    });
    const learnerLayer = createSvgElement("g", {
      class: `map-reconstruction-capstone-piece-layer is-${session.phase}`
    });
    getMapReconstructionPieceRenderOrder(session).forEach((stateId, pieceIndex) => {
      const pieceState = session.piecesById[stateId];
      if (!pieceState.position) return;
      const status = session.phase !== "result"
        ? "arranging"
        : session.viewMode === "correct"
          ? "corrected"
          : session.evaluation?.isComplete
            ? "completed"
            : session.evaluation?.placements?.[stateId]?.status || "misplaced";
      const group = createSvgElement("g", {
        class: `map-reconstruction-piece is-${status}${getSelectedStateIds().includes(stateId) ? " is-selected" : ""}${session.selectedStateId === stateId ? " is-primary-selected" : ""}`,
        transform: `translate(${pieceState.position.x} ${pieceState.position.y})`,
        "data-capstone-piece-id": stateId
      });
      const path = createSvgElement("path", {
        class: "map-reconstruction-piece-shape",
        d: geometry.piecesById[stateId].path,
        "fill-rule": "evenodd",
        "data-capstone-piece-path": stateId
      });
      group.appendChild(path);
      if (session.correctionState === "playing") {
        const submitted = pieceState.submittedPosition || {
          x: geometry.workspace.width + geometry.piecesById[stateId].width,
          y: 70 + pieceIndex % 16 * 56
        };
        group.appendChild(createSvgElement("animateTransform", {
          attributeName: "transform",
          type: "translate",
          from: `${submitted.x} ${submitted.y}`,
          to: `${pieceState.position.x} ${pieceState.position.y}`,
          begin: `${Math.floor(pieceIndex / 16) * 0.18 + pieceIndex % 16 * 0.008}s`,
          dur: "0.52s",
          fill: "freeze",
          calcMode: "spline",
          keySplines: "0.2 0.75 0.25 1"
        }));
      }
      if (session.phase === "arranging") attachPieceInteraction(group, path, stateId);
      learnerLayer.appendChild(group);
    });
    workspaceSvg.appendChild(learnerLayer);
    const labels = createElement("div", "map-reconstruction-capstone-label-layer");
    labels.setAttribute("aria-hidden", "true");
    workspaceWrap.append(workspaceSvg, labels, createCameraToolbar());
    section.append(heading, workspaceWrap);
    return section;
  };

  const createDrawerControls = () => {
    const controls = createElement("div", "map-reconstruction-capstone-drawer-controls");
    const search = createElement("input");
    search.type = "search";
    search.value = drawer.search;
    search.placeholder = "Find a state";
    search.setAttribute("aria-label", "Find a state");
    search.addEventListener("input", () => {
      drawer.search = search.value;
      render();
      requestAnimationFrame(() => {
        const next = container.querySelector(".map-reconstruction-capstone-search");
        if (next) {
          next.focus();
          next.setSelectionRange(drawer.search.length, drawer.search.length);
        }
      });
    });
    search.className = "map-reconstruction-capstone-search";
    const filter = createElement("select");
    filter.setAttribute("aria-label", "Filter state pieces");
    [["unplaced", "Unplaced"], ["placed", "Placed"], ["all", "All"]].forEach(([value, label]) => {
      const option = createElement("option");
      option.value = value;
      option.textContent = label;
      option.selected = drawer.filter === value;
      filter.appendChild(option);
    });
    filter.addEventListener("change", () => {
      drawer.filter = filter.value;
      render();
    });
    const order = createElement("span", "map-reconstruction-capstone-order-label");
    order.textContent = "A-Z";
    order.setAttribute("aria-label", "State pieces ordered A to Z");
    controls.append(search, filter, order);
    return controls;
  };

  const createDrawer = () => {
    const aside = createElement(
      "aside",
      `map-reconstruction-capstone-drawer${drawer.collapsed ? " is-collapsed" : ""}`
    );
    const unplacedCount = capstone.stateIds.filter(
      (stateId) => !session.piecesById[stateId].position
    ).length;
    const header = createElement("div", "map-reconstruction-capstone-drawer-header");
    const heading = createElement("h2");
    heading.textContent = session.phase === "result"
      ? "Placement feedback"
      : `${unplacedCount} remaining`;
    const toggle = createButton(
      drawer.collapsed ? "States" : "Collapse",
      "map-reconstruction-capstone-drawer-toggle",
      () => {
        drawer.collapsed = !drawer.collapsed;
        render();
      },
      {
        "aria-expanded": String(!drawer.collapsed),
        "aria-label": drawer.collapsed ? "Open state drawer" : "Collapse state drawer"
      }
    );
    header.append(heading, toggle);
    aside.appendChild(header);
    if (drawer.collapsed) return aside;
    if (session.phase === "result") {
      aside.appendChild(createResultSummary());
      return aside;
    }
    aside.appendChild(createDrawerControls());
    const list = createElement("div", "map-reconstruction-capstone-drawer-list");
    const stateIds = getDrawerStateIds(session, geometry, drawer);
    stateIds.forEach((stateId) => {
      const placed = Boolean(session.piecesById[stateId].position);
      const row = createElement(
        "div",
        `map-reconstruction-capstone-drawer-row${placed ? " is-placed" : ""}`
      );
      const button = createElement("button", "map-reconstruction-capstone-state-button");
      button.type = "button";
      button.append(
        makeThumbnail(geometry.piecesById[stateId]),
        document.createTextNode(geometry.piecesById[stateId].name)
      );
      button.dataset.capstoneDrawerStateId = stateId;
      const state = getStateById(stateId);
      button.setAttribute(
        "aria-label",
        placed
          ? `Focus ${state?.name || stateId} at its placed position`
          : `Place ${state?.name || stateId}`
      );
      if (placed) {
        button.addEventListener("click", () => placeState(stateId));
      } else {
        attachDrawerPointerInteraction(button, stateId);
      }
      row.appendChild(button);
      const speaker = createSpeaker(
        state?.name || geometry.piecesById[stateId].name,
        `Hear ${state?.name || stateId}`
      );
      if (speaker) row.appendChild(speaker);
      if (placed) {
        row.appendChild(createButton("Return", "map-reconstruction-capstone-return", () => {
          returnState(stateId);
        }, { "aria-label": `Return ${state?.name || stateId} to the drawer` }));
      }
      list.appendChild(row);
    });
    if (!stateIds.length) {
      const empty = createElement("p", "map-reconstruction-bank-empty");
      empty.textContent = "No states match these drawer filters.";
      list.appendChild(empty);
    }
    aside.appendChild(list);
    return aside;
  };

  function createResultSummary() {
    const summary = createElement("section", "map-reconstruction-capstone-result");
    const scores = session.evaluation?.scores || {};
    const title = createElement("strong");
    title.textContent = session.evaluation?.isComplete
      ? capstone.successMessage
      : `${scores.overall || 0} overall`;
    if (session.evaluation?.isComplete) {
      const speaker = createSpeaker(capstone.successMessage, "Hear the success message");
      if (speaker) title.appendChild(speaker);
    }
    const metrics = createElement("p");
    metrics.textContent = `${session.evaluation?.counts?.["well-placed"] || 0} well placed | `
      + `${session.evaluation?.counts?.close || 0} close | `
      + `${session.evaluation?.counts?.misplaced || 0} misplaced | `
      + `${session.evaluation?.counts?.unplaced || 0} unplaced`;
    appendSpeaker(metrics, metrics.textContent, "Hear the placement summary");
    const components = createElement("p");
    components.textContent = `Adjacency ${scores.adjacency || 0}% | Regional structure ${scores.regionalStructure || 0}%`;
    appendSpeaker(components, components.textContent, "Hear the structure summary");
    summary.append(title, metrics, components);
    const priorities = createElement("ol");
    (session.evaluation?.feedback || []).forEach((message) => {
      const item = createElement("li");
      item.textContent = message;
      appendSpeaker(item, message);
      priorities.appendChild(item);
    });
    summary.appendChild(priorities);
    const details = createElement("details", "map-reconstruction-capstone-details");
    const detailsTitle = createElement("summary");
    detailsTitle.textContent = "State details";
    const detailList = createElement("ul");
    capstone.stateIds
      .filter((stateId) => session.evaluation?.placements?.[stateId]?.status !== "well-placed")
      .sort((leftId, rightId) => geometry.piecesById[leftId].name.localeCompare(
        geometry.piecesById[rightId].name
      ))
      .forEach((stateId) => {
        const item = createElement("li");
        const status = session.evaluation?.placements?.[stateId]?.status || "unplaced";
        item.textContent = `${geometry.piecesById[stateId].name}: ${status.replace("-", " ")}`;
        appendSpeaker(item, item.textContent, `Hear ${geometry.piecesById[stateId].name} result`);
        detailList.appendChild(item);
      });
    details.append(detailsTitle, detailList);
    summary.appendChild(details);
    return summary;
  }

  const startCorrection = (replay = false) => {
    if (correctionTimer != null) window.clearTimeout(correctionTimer);
    const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches === true;
    if (replay && !reducedMotion) {
      session = prepareMapReconstructionCorrectionReplay(session);
    }
    session = showMapReconstructionCorrectPlacement(session, { reducedMotion });
    correctionShown = true;
    camera = fitMapReconstructionCamera(geometry.workspace, capstone.camera);
    announce(reducedMotion
      ? "Correct Lower 48 placement shown."
      : "Showing correct placement.");
    render();
    if (!reducedMotion) {
      correctionTimer = window.setTimeout(() => {
        correctionTimer = null;
        session = completeMapReconstructionCorrection(session);
        announce("Correct placement complete.");
        render();
      }, CORRECTION_DURATION_MS);
    }
  };

  const createActions = () => {
    const actions = createElement("footer", "map-reconstruction-actions");
    if (session.phase === "result") {
      if (session.evaluation?.isComplete) {
        actions.appendChild(createButton("Start over", "map-reconstruction-primary-action", () => {
          activeDrawerPointerCancel?.();
          cancelMobileAssistance();
          clearLower48ReconstructionSnapshot(storage);
          session = resetMapReconstructionSession(session);
          camera = fitMapReconstructionCamera(geometry.workspace, capstone.camera);
          completedAt = null;
          correctionShown = false;
          render();
        }));
      } else if (session.viewMode === "learner") {
        actions.append(
          createButton(
            correctionShown ? "Replay correction" : "Show correct placement",
            "map-reconstruction-primary-action",
            () => startCorrection(correctionShown)
          ),
          createButton("Start over", "map-reconstruction-secondary-action", () => {
            activeDrawerPointerCancel?.();
            cancelMobileAssistance();
            clearLower48ReconstructionSnapshot(storage);
            session = resetMapReconstructionSession(session);
            camera = fitMapReconstructionCamera(geometry.workspace, capstone.camera);
            correctionShown = false;
            render();
          })
        );
      } else {
        actions.append(
          createButton("Back to my map", "map-reconstruction-secondary-action", () => {
            session = restoreMapReconstructionSubmittedMap(session);
            announce("Your submitted reconstruction is restored.");
            render();
          }),
          createButton("Replay correction", "map-reconstruction-primary-action", () => startCorrection(true))
        );
      }
      return actions;
    }
    const selectedStateIds = getSelectedStateIds();
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
        { "aria-pressed": selectionMode }
      ),
      createButton(
        "Select connected group",
        "map-reconstruction-secondary-action map-reconstruction-connected-action",
        () => {
          if (!session.selectedStateId) return;
          const primaryStateId = session.selectedStateId;
          selectConnectedGroup(primaryStateId);
          render();
          requestAnimationFrame(() => {
            container.querySelector(`[data-capstone-piece-id="${primaryStateId}"]`)?.focus();
          });
        },
        { disabled: !session.selectedStateId }
      ),
      createButton(
        "Fit selected",
        "map-reconstruction-secondary-action map-reconstruction-fit-selection-action",
        fitSelectedStates,
        { disabled: !selectedStateIds.length }
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
        activeDrawerPointerCancel?.();
        cancelMobileAssistance();
        session = resetMapReconstructionSession(session);
        camera = fitMapReconstructionCamera(geometry.workspace, capstone.camera);
        announce("Lower 48 reconstruction reset.");
        render();
      }),
      createButton("Return piece", "map-reconstruction-secondary-action", () => {
        if (session.selectedStateId) returnState(session.selectedStateId);
      }, { disabled: !session.selectedStateId }),
      createButton("Submit", "map-reconstruction-primary-action", () => {
        const evaluation = evaluateLower48Reconstruction(session, capstone, geometry);
        session = submitMapReconstructionSession(session, evaluation);
        completedAt = evaluation.isComplete ? Date.now() : null;
        if (evaluation.isComplete) {
          camera = fitMapReconstructionCamera(geometry.workspace, capstone.camera);
        }
        announce(evaluation.isComplete
          ? capstone.successMessage
          : "Reconstruction submitted. Review your placement feedback.");
        render();
      })
    );
    return actions;
  };

  const handleWorkspacePointerDown = (event) => {
    if (session.phase !== "arranging" || event.button != null && event.button !== 0) return;
    if (mobileMagnifier && isMapReconstructionMobileAssistanceEnabled()) {
      event.preventDefault();
      return;
    }
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    workspaceSvg.setPointerCapture?.(event.pointerId);
    if (pointers.size >= 2) {
      activePieceDrag = null;
      panGesture?.element?.remove();
      const [first, second] = [...pointers.values()];
      panGesture = {
        type: "pinch",
        distance: Math.hypot(second.x - first.x, second.y - first.y),
        midpoint: { x: (first.x + second.x) / 2, y: (first.y + second.y) / 2 },
        camera: { ...camera }
      };
      return;
    }
    if (event.target === workspaceSvg) {
      if (selectionMode) {
        const world = mapClientPointToWorld(workspaceSvg, event.clientX, event.clientY);
        if (!world) return;
        panGesture = {
          type: "marquee",
          pointerId: event.pointerId,
          start: world,
          startClient: { x: event.clientX, y: event.clientY },
          additive: event.ctrlKey || event.metaKey || event.shiftKey,
          moved: false,
          element: null
        };
      } else {
        panGesture = {
          type: "pan",
          pointerId: event.pointerId,
          start: { x: event.clientX, y: event.clientY },
          camera: { ...camera },
          moved: false
        };
      }
    }
  };

  const handleWorkspacePointerMove = (event) => {
    if (!pointers.has(event.pointerId)) return;
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointers.size >= 2 && panGesture?.type === "pinch") {
      event.preventDefault();
      const [first, second] = [...pointers.values()];
      const distance = Math.max(1, Math.hypot(second.x - first.x, second.y - first.y));
      const midpoint = { x: (first.x + second.x) / 2, y: (first.y + second.y) / 2 };
      const anchor = mapClientPointToWorld(workspaceSvg, midpoint.x, midpoint.y);
      camera = zoomMapReconstructionCameraAtPoint(
        panGesture.camera,
        panGesture.camera.zoom * distance / Math.max(1, panGesture.distance),
        anchor,
        geometry.workspace,
        capstone.camera
      );
      const view = getMapReconstructionCameraView(camera, geometry.workspace, viewport());
      camera = panMapReconstructionCamera(camera, {
        x: -(midpoint.x - panGesture.midpoint.x) / Math.max(1, workspaceSvg.clientWidth) * view.width,
        y: -(midpoint.y - panGesture.midpoint.y) / Math.max(1, workspaceSvg.clientHeight) * view.height
      }, geometry.workspace, capstone.camera);
      updateCameraOnly();
      return;
    }
    if (panGesture?.type === "marquee" && panGesture.pointerId === event.pointerId) {
      event.preventDefault();
      const world = mapClientPointToWorld(workspaceSvg, event.clientX, event.clientY);
      if (!world) return;
      if (!panGesture.moved && Math.hypot(
        event.clientX - panGesture.startClient.x,
        event.clientY - panGesture.startClient.y
      ) <= 5) return;
      panGesture.moved = true;
      if (!panGesture.element) {
        panGesture.element = createSvgElement("rect", {
          class: "map-reconstruction-marquee",
          "aria-hidden": "true"
        });
        workspaceSvg.appendChild(panGesture.element);
      }
      panGesture.element.setAttribute("x", Math.min(panGesture.start.x, world.x));
      panGesture.element.setAttribute("y", Math.min(panGesture.start.y, world.y));
      panGesture.element.setAttribute("width", Math.abs(world.x - panGesture.start.x));
      panGesture.element.setAttribute("height", Math.abs(world.y - panGesture.start.y));
      return;
    }
    if (activePieceDrag?.pointerId === event.pointerId) {
      if (!activePieceDrag.canDrag) return;
      event.preventDefault();
      const world = mapClientPointToWorld(workspaceSvg, event.clientX, event.clientY);
      if (!world) return;
      const clientDistance = Math.hypot(
        event.clientX - activePieceDrag.startClient.x,
        event.clientY - activePieceDrag.startClient.y
      );
      if (!activePieceDrag.moved && clientDistance <= 4) return;
      if (!activePieceDrag.moved) {
        activePieceDrag.moved = true;
        beginMobileDragAssistance(
          { x: event.clientX, y: event.clientY },
          world,
          null,
          session.piecesById[activePieceDrag.stateId]?.position,
          event.pointerType
        );
      }
      const view = getMapReconstructionCameraView(
        camera,
        geometry.workspace,
        viewport()
      );
      const useScreenDelta = isMapReconstructionMobileAssistanceEnabled()
        && Boolean(mobileMagnifier);
      const delta = useScreenDelta
        ? {
            x: (event.clientX - activePieceDrag.startClient.x)
              / Math.max(1, workspaceSvg.clientWidth) * view.width,
            y: (event.clientY - activePieceDrag.startClient.y)
              / Math.max(1, workspaceSvg.clientHeight) * view.height
          }
        : {
            x: world.x - activePieceDrag.start.x,
            y: world.y - activePieceDrag.start.y
          };
      session = moveMapReconstructionSelectedPieces(
        activePieceDrag.dragStartSession,
        activePieceDrag.stateId,
        delta,
        geometry
      );
      getSelectedStateIds().forEach((stateId) => {
        const position = session.piecesById[stateId].position;
        const group = container.querySelector(`[data-capstone-piece-id="${stateId}"]`);
        group?.setAttribute("transform", `translate(${position.x} ${position.y})`);
        group?.classList.add("is-dragging");
      });
      renderLabels();
      updateMobileDragAssistance(
        { x: event.clientX, y: event.clientY },
        world,
        null,
        session.piecesById[activePieceDrag.stateId]?.position
      );
      return;
    }
    if (panGesture?.type === "pan" && panGesture.pointerId === event.pointerId) {
      event.preventDefault();
      if (Math.hypot(
        event.clientX - panGesture.start.x,
        event.clientY - panGesture.start.y
      ) > 5) {
        panGesture.moved = true;
      }
      const view = getMapReconstructionCameraView(
        panGesture.camera,
        geometry.workspace,
        viewport()
      );
      camera = panMapReconstructionCamera(panGesture.camera, {
        x: -(event.clientX - panGesture.start.x) / Math.max(1, workspaceSvg.clientWidth) * view.width,
        y: -(event.clientY - panGesture.start.y) / Math.max(1, workspaceSvg.clientHeight) * view.height
      }, geometry.workspace, capstone.camera);
      updateCameraOnly();
    }
  };

  const handleWorkspacePointerEnd = (event) => {
    pointers.delete(event.pointerId);
    if (activePieceDrag?.pointerId === event.pointerId) {
      const drag = activePieceDrag;
      const stateId = drag.stateId;
      activePieceDrag = null;
      if (["pointercancel", "lostpointercapture"].includes(event.type)) {
        session = drag.originalSession;
      } else if (drag.moved) {
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
        if (drag.canDrag) session = endMapReconstructionDrag(session);
        applyPieceClickSelection(stateId, event);
      }
      restoreMobileDragAssistance();
      render();
      return;
    }
    if (panGesture?.type === "marquee" && panGesture.pointerId === event.pointerId) {
      const marquee = panGesture;
      panGesture = null;
      const world = mapClientPointToWorld(workspaceSvg, event.clientX, event.clientY);
      if (event.type !== "pointercancel" && marquee.moved && world) {
        const stateIds = getMapReconstructionStatesIntersectingBounds(
          session,
          geometry,
          {
            minX: marquee.start.x,
            minY: marquee.start.y,
            maxX: world.x,
            maxY: world.y
          }
        );
        session = selectMapReconstructionStates(session, stateIds, {
          additive: marquee.additive,
          primaryStateId: stateIds[stateIds.length - 1]
        });
        announce(`${getSelectedStateIds().length} states selected.`);
      } else if (event.type !== "pointercancel" && !marquee.moved) {
        session = clearMapReconstructionSelection(session);
        announce("Selection cleared.");
      }
      render();
      return;
    }
    if (pointers.size < 2 && panGesture?.type === "pinch") panGesture = null;
    if (panGesture?.pointerId === event.pointerId) {
      const clearSelection = panGesture.type === "pan" && !panGesture.moved;
      panGesture = null;
      if (clearSelection) {
        session = clearMapReconstructionSelection(session);
        announce("Selection cleared.");
        render();
        return;
      }
    }
    scheduleSave();
  };

  const attachWorkspaceEvents = () => {
    workspaceSvg.addEventListener("pointerdown", handleWorkspacePointerDown);
    workspaceSvg.addEventListener("pointermove", handleWorkspacePointerMove);
    workspaceSvg.addEventListener("pointerup", handleWorkspacePointerEnd);
    workspaceSvg.addEventListener("pointercancel", handleWorkspacePointerEnd);
    workspaceSvg.addEventListener("lostpointercapture", handleWorkspacePointerEnd);
    workspaceSvg.addEventListener("wheel", (event) => {
      event.preventDefault();
      const anchor = mapClientPointToWorld(workspaceSvg, event.clientX, event.clientY);
      camera = zoomMapReconstructionCameraAtPoint(
        camera,
        camera.zoom * (event.deltaY < 0 ? 1.16 : 1 / 1.16),
        anchor,
        geometry.workspace,
        capstone.camera
      );
      updateCameraOnly();
    }, { passive: false });
    workspaceSvg.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        session = clearMapReconstructionSelection(session);
        announce("Selection cleared.");
        render();
        return;
      }
      const pan = {
        ArrowLeft: { x: -60, y: 0 },
        ArrowRight: { x: 60, y: 0 },
        ArrowUp: { x: 0, y: -60 },
        ArrowDown: { x: 0, y: 60 }
      }[event.key];
      if (pan) {
        event.preventDefault();
        camera = panMapReconstructionCamera(camera, pan, geometry.workspace, capstone.camera);
        updateCameraOnly();
      } else if (event.key === "+" || event.key === "=") {
        event.preventDefault();
        camera = zoomMapReconstructionCameraAtPoint(
          camera,
          camera.zoom * 1.35,
          camera,
          geometry.workspace,
          capstone.camera
        );
        updateCameraOnly();
      } else if (event.key === "-") {
        event.preventDefault();
        camera = zoomMapReconstructionCameraAtPoint(
          camera,
          camera.zoom / 1.35,
          camera,
          geometry.workspace,
          capstone.camera
        );
        updateCameraOnly();
      } else if (event.key === "0") {
        event.preventDefault();
        camera = fitMapReconstructionCamera(geometry.workspace, capstone.camera);
        updateCameraOnly();
      }
    });
  };

  function render() {
    if (destroyed) return;
    const shell = createElement(
      "div",
      `map-reconstruction-shell map-reconstruction-capstone-shell is-${session.phase}`
      + `${session.evaluation?.isComplete ? " is-success" : ""}`
      + `${session.correctionState === "playing" ? " is-correction-playing" : ""}`
    );
    shell.dataset.mapReconstructionCapstoneId = capstone.id;
    const live = createElement("p", "map-reconstruction-live-region");
    live.setAttribute("role", "status");
    live.setAttribute("aria-live", "polite");
    live.textContent = announcement;
    const content = createElement("div", "map-reconstruction-capstone-content");
    content.append(createWorkspace(), createDrawer());
    shell.append(live, content, createActions());
    container.replaceChildren(shell);
    attachWorkspaceEvents();
    requestAnimationFrame(renderLabels);
    scheduleSave();
    options.onStateChange?.(cloneSession(session), getUiState());
  }

  const handleResize = () => {
    updateCameraOnly();
  };
  const handlePageHide = () => flushSave();
  window.addEventListener("resize", handleResize);
  window.addEventListener("pagehide", handlePageHide);
  render();

  return {
    getState: () => cloneSession(session),
    getCamera: () => ({ ...camera }),
    flush: flushSave,
    reset: () => {
      activeDrawerPointerCancel?.();
      cancelMobileAssistance();
      clearLower48ReconstructionSnapshot(storage);
      session = resetMapReconstructionSession(session);
      camera = fitMapReconstructionCamera(geometry.workspace, capstone.camera);
      render();
    },
    destroy: () => {
      destroyed = true;
      window.GeographyChipSpeech?.stopAudio?.();
      activeDrawerPointerCancel?.();
      cancelMobileAssistance();
      flushSave();
      clearTimers();
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("pagehide", handlePageHide);
      container.replaceChildren();
    }
  };
}
