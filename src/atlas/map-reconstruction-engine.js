function copy(value) {
  return value == null ? value : JSON.parse(JSON.stringify(value));
}

function shuffle(values, random) {
  const shuffled = [...values];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const raw = Number(random());
    const swapIndex = Math.min(index, Math.max(0, Math.floor((Number.isFinite(raw) ? raw : 0) * (index + 1))));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  if (shuffled.length > 1 && shuffled.every((value, index) => value === values[index])) {
    [shuffled[0], shuffled[1]] = [shuffled[1], shuffled[0]];
  }
  return shuffled;
}

function validPosition(position) {
  return Number.isFinite(position?.x) && Number.isFinite(position?.y);
}

function getPieceBoundsAtPosition(pieceGeometry, position) {
  return {
    minX: position.x + pieceGeometry.localBounds.minX,
    minY: position.y + pieceGeometry.localBounds.minY,
    maxX: position.x + pieceGeometry.localBounds.maxX,
    maxY: position.y + pieceGeometry.localBounds.maxY
  };
}

function bringPieceToFront(pieceZOrder, stateId) {
  return [...(Array.isArray(pieceZOrder) ? pieceZOrder : []).filter((id) => id !== stateId), stateId];
}

function getBoundsOverlapArea(first, second) {
  const width = Math.max(0, Math.min(first.maxX, second.maxX) - Math.max(first.minX, second.minX));
  const height = Math.max(0, Math.min(first.maxY, second.maxY) - Math.max(first.minY, second.minY));
  return width * height;
}

export function clampMapReconstructionPosition(position, pieceGeometry, workspace) {
  if (!validPosition(position) || !pieceGeometry || !workspace) return null;
  const workspaceX = Number.isFinite(workspace.x) ? workspace.x : 0;
  const workspaceY = Number.isFinite(workspace.y) ? workspace.y : 0;
  const dragPadding = Number.isFinite(workspace.dragPadding)
    ? Math.max(0, workspace.dragPadding)
    : 0;
  const minX = workspaceX + dragPadding - pieceGeometry.localBounds.minX;
  const maxX = workspaceX + workspace.width - dragPadding - pieceGeometry.localBounds.maxX;
  const minY = workspaceY + dragPadding - pieceGeometry.localBounds.minY;
  const maxY = workspaceY + workspace.height - dragPadding - pieceGeometry.localBounds.maxY;
  return {
    x: minX > maxX ? (minX + maxX) / 2 : Math.min(maxX, Math.max(minX, position.x)),
    y: minY > maxY ? (minY + maxY) / 2 : Math.min(maxY, Math.max(minY, position.y))
  };
}

export function createMapReconstructionSession(region, geometry, options = {}) {
  if (!region || geometry?.regionId !== region.id) return null;
  const random = typeof options.random === "function" ? options.random : Math.random;
  const bankOrder = shuffle(region.stateIds, random);
  const piecesById = Object.fromEntries(bankOrder.map((stateId, bankIndex) => {
    const pieceGeometry = geometry.piecesById[stateId];
    if (!pieceGeometry) throw new Error(`Missing prepared geometry: ${stateId}`);
    return [stateId, {
      stateId,
      initialPlacement: { zone: "bank", slotIndex: bankIndex },
      position: null,
      correctPosition: { ...pieceGeometry.correctPosition },
      placementStatus: "unplaced",
      hasMoved: false
    }];
  }));
  return {
    regionId: region.id,
    phase: "arranging",
    viewMode: "learner",
    correctionState: "idle",
    bankOrder,
    pieceZOrder: [],
    piecesById,
    selectedStateId: null,
    activeDrag: null,
    evaluation: null
  };
}

export function placeMapReconstructionPiece(session, stateId, position, geometry) {
  const next = copy(session);
  const piece = next?.piecesById?.[stateId];
  const pieceGeometry = geometry?.piecesById?.[stateId];
  if (!piece || next.phase !== "arranging" || !validPosition(position) || !pieceGeometry) return next;
  const clamped = clampMapReconstructionPosition(position, pieceGeometry, geometry.workspace);
  piece.position = clamped;
  piece.placementStatus = "placed";
  piece.hasMoved = true;
  next.selectedStateId = stateId;
  next.pieceZOrder = bringPieceToFront(next.pieceZOrder, stateId);
  return next;
}

export function getMapReconstructionPieceRenderOrder(session) {
  const stateIds = Array.isArray(session?.bankOrder) ? session.bankOrder : [];
  const placedIds = new Set((session?.pieceZOrder || []).filter((stateId) => (
    stateIds.includes(stateId) && session?.piecesById?.[stateId]?.position
  )));
  return [
    ...stateIds.filter((stateId) => session?.piecesById?.[stateId]?.position && !placedIds.has(stateId)),
    ...(session?.pieceZOrder || []).filter((stateId) => placedIds.has(stateId))
  ];
}

export function findMapReconstructionAutomaticPlacement(session, stateId, geometry) {
  const pieceGeometry = geometry?.piecesById?.[stateId];
  const workspace = geometry?.workspace;
  if (!pieceGeometry || !workspace || !session?.piecesById?.[stateId]) return null;

  const workspaceX = Number.isFinite(workspace.x) ? workspace.x : 0;
  const workspaceY = Number.isFinite(workspace.y) ? workspace.y : 0;
  const centerPosition = {
    x: workspaceX + workspace.width / 2
      - (pieceGeometry.localBounds.minX + pieceGeometry.localBounds.maxX) / 2,
    y: workspaceY + workspace.height / 2
      - (pieceGeometry.localBounds.minY + pieceGeometry.localBounds.maxY) / 2
  };
  const stepX = workspace.width * 0.18;
  const stepY = workspace.height * 0.2;
  const offsets = [
    [0, 0],
    [-1, 0], [1, 0], [0, -1], [0, 1],
    [-1, -1], [1, -1], [-1, 1], [1, 1],
    [-2, 0], [2, 0], [0, -2], [0, 2],
    [-2, -1], [2, -1], [-2, 1], [2, 1]
  ];
  const placedBounds = Object.entries(session.piecesById)
    .filter(([otherStateId, piece]) => otherStateId !== stateId && piece.position)
    .map(([otherStateId, piece]) => ({
      stateId: otherStateId,
      bounds: getPieceBoundsAtPosition(geometry.piecesById[otherStateId], piece.position)
    }))
    .filter((entry) => entry.bounds);

  return offsets
    .map(([column, row], index) => {
      const position = clampMapReconstructionPosition({
        x: centerPosition.x + column * stepX,
        y: centerPosition.y + row * stepY
      }, pieceGeometry, workspace);
      const bounds = getPieceBoundsAtPosition(pieceGeometry, position);
      const overlapArea = placedBounds.reduce(
        (total, entry) => total + getBoundsOverlapArea(bounds, entry.bounds),
        0
      );
      const distance = Math.hypot(position.x - centerPosition.x, position.y - centerPosition.y);
      return { position, overlapArea, distance, index };
    })
    .sort((first, second) => (
      first.overlapArea - second.overlapArea
      || first.distance - second.distance
      || first.index - second.index
    ))[0]?.position || clampMapReconstructionPosition(centerPosition, pieceGeometry, workspace);
}

export function moveMapReconstructionPiece(session, stateId, delta, geometry) {
  const piece = session?.piecesById?.[stateId];
  if (!piece?.position || !validPosition(delta)) return copy(session);
  return placeMapReconstructionPiece(session, stateId, {
    x: piece.position.x + delta.x,
    y: piece.position.y + delta.y
  }, geometry);
}

export function returnMapReconstructionPieceToBank(session, stateId) {
  const next = copy(session);
  const piece = next?.piecesById?.[stateId];
  if (!piece || next.phase !== "arranging") return next;
  piece.position = null;
  piece.placementStatus = "unplaced";
  piece.hasMoved = false;
  next.pieceZOrder = (next.pieceZOrder || []).filter((id) => id !== stateId);
  if (next.selectedStateId === stateId) next.selectedStateId = null;
  if (next.activeDrag?.stateId === stateId) next.activeDrag = null;
  return next;
}

export function beginMapReconstructionDrag(session, stateId, pointerId, pointer, origin) {
  const next = copy(session);
  if (!next?.piecesById?.[stateId] || next.phase !== "arranging" || !validPosition(pointer)) return next;
  next.selectedStateId = stateId;
  next.pieceZOrder = bringPieceToFront(next.pieceZOrder, stateId);
  next.activeDrag = {
    stateId,
    pointerId,
    startPointer: { ...pointer },
    startPosition: validPosition(origin) ? { ...origin } : null
  };
  return next;
}

export function endMapReconstructionDrag(session) {
  const next = copy(session);
  if (next) next.activeDrag = null;
  return next;
}

export function moveMapReconstructionPieceByKeyboard(session, stateId, direction, geometry, options = {}) {
  const step = options.large ? 20 : 5;
  const deltas = {
    left: { x: -step, y: 0 },
    right: { x: step, y: 0 },
    up: { x: 0, y: -step },
    down: { x: 0, y: step }
  };
  return deltas[direction]
    ? moveMapReconstructionPiece(session, stateId, deltas[direction], geometry)
    : copy(session);
}

export function resetMapReconstructionSession(session) {
  const next = copy(session);
  if (!next) return next;
  next.phase = "arranging";
  next.viewMode = "learner";
  next.correctionState = "idle";
  next.selectedStateId = null;
  next.pieceZOrder = [];
  next.activeDrag = null;
  next.evaluation = null;
  Object.values(next.piecesById).forEach((piece) => {
    piece.position = null;
    delete piece.submittedPosition;
    piece.placementStatus = "unplaced";
    piece.hasMoved = false;
  });
  return next;
}

export function submitMapReconstructionSession(session, evaluation) {
  const next = copy(session);
  if (!next || next.phase !== "arranging") return next;
  next.phase = "result";
  next.activeDrag = null;
  next.selectedStateId = null;
  next.evaluation = copy(evaluation);
  next.viewMode = evaluation?.isComplete ? "completed" : "learner";
  next.correctionState = "idle";
  Object.values(next.piecesById).forEach((piece) => {
    piece.submittedPosition = piece.position ? { ...piece.position } : null;
  });
  if (evaluation?.isComplete) {
    Object.values(next.piecesById).forEach((piece) => {
      piece.position = { ...piece.correctPosition };
    });
  }
  return next;
}

export function setMapReconstructionViewMode(session, viewMode) {
  if (viewMode === "learner") return restoreMapReconstructionSubmittedMap(session);
  if (viewMode === "correct") {
    return showMapReconstructionCorrectPlacement(session, { reducedMotion: true });
  }
  const next = copy(session);
  return next;
}

export function showMapReconstructionCorrectPlacement(session, options = {}) {
  const next = copy(session);
  if (!next || next.phase !== "result" || next.evaluation?.isComplete
    || next.correctionState === "playing") return next;
  next.viewMode = "correct";
  next.correctionState = options.reducedMotion === true ? "complete" : "playing";
  Object.values(next.piecesById).forEach((piece) => {
    piece.position = { ...piece.correctPosition };
  });
  return next;
}

export function prepareMapReconstructionCorrectionReplay(session) {
  const next = copy(session);
  if (!next || next.phase !== "result" || next.evaluation?.isComplete
    || ["preparing", "playing"].includes(next.correctionState)) return next;
  next.viewMode = "learner";
  next.correctionState = "preparing";
  Object.values(next.piecesById).forEach((piece) => {
    piece.position = piece.submittedPosition ? { ...piece.submittedPosition } : null;
  });
  return next;
}

export function completeMapReconstructionCorrection(session) {
  const next = copy(session);
  if (!next || next.phase !== "result" || next.evaluation?.isComplete
    || next.viewMode !== "correct" || next.correctionState !== "playing") return next;
  next.correctionState = "complete";
  return next;
}

export function restoreMapReconstructionSubmittedMap(session) {
  const next = copy(session);
  if (!next || next.phase !== "result" || next.evaluation?.isComplete) return next;
  next.viewMode = "learner";
  next.correctionState = session.correctionState === "idle" ? "idle" : "complete";
  Object.values(next.piecesById).forEach((piece) => {
    piece.position = piece.submittedPosition ? { ...piece.submittedPosition } : null;
  });
  return next;
}

export function getMapReconstructionPieceBounds(session, stateId, geometry) {
  const piece = session?.piecesById?.[stateId];
  const pieceGeometry = geometry?.piecesById?.[stateId];
  return piece?.position && pieceGeometry
    ? getPieceBoundsAtPosition(pieceGeometry, piece.position)
    : null;
}

export function createSeededMapReconstructionRandom(seed = 1) {
  let state = Math.max(1, Math.floor(Number(seed)) || 1) >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}
