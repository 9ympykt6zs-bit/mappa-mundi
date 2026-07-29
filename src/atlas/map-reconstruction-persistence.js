export const LOWER_48_RECONSTRUCTION_STORAGE_KEY =
  "mappa-mundi-map-reconstruction-lower-48";
export const LOWER_48_RECONSTRUCTION_STORAGE_VERSION = 1;

const VALID_PHASES = new Set(["arranging", "result"]);
const VALID_VIEW_MODES = new Set(["learner", "correct", "completed"]);
const VALID_DRAWER_FILTERS = new Set(["unplaced", "placed", "all"]);
const VALID_DRAWER_SORTS = new Set(["alphabetical"]);

function copy(value) {
  return value == null ? value : JSON.parse(JSON.stringify(value));
}

function finitePosition(position) {
  return position == null || (
    Number.isFinite(position.x) && Number.isFinite(position.y)
  );
}

function positionWithinWorkspace(position, workspace) {
  if (position == null) return true;
  return finitePosition(position)
    && position.x >= -workspace.width
    && position.x <= workspace.width * 2
    && position.y >= -workspace.height
    && position.y <= workspace.height * 2;
}

function validPermutation(values, expectedIds) {
  return Array.isArray(values)
    && values.length === expectedIds.length
    && new Set(values).size === values.length
    && values.every((stateId) => expectedIds.includes(stateId));
}

export function createLower48ReconstructionSnapshot(session, uiState = {}) {
  if (!session) return null;
  const pieces = Object.fromEntries(Object.entries(session.piecesById || {}).map(
    ([stateId, piece]) => [stateId, {
      position: piece.position ? { ...piece.position } : null,
      submittedPosition: piece.submittedPosition ? { ...piece.submittedPosition } : null,
      placementStatus: piece.placementStatus,
      hasMoved: Boolean(piece.hasMoved)
    }]
  ));
  return {
    version: LOWER_48_RECONSTRUCTION_STORAGE_VERSION,
    savedAt: Date.now(),
    session: {
      regionId: session.regionId,
      phase: session.phase,
      viewMode: session.viewMode,
      correctionState: session.correctionState === "idle" ? "idle" : "complete",
      bankOrder: [...session.bankOrder],
      pieceZOrder: [...session.pieceZOrder],
      selectedStateId: null,
      selectedStateIds: [],
      activeDrag: null,
      evaluation: copy(session.evaluation),
      pieces
    },
    ui: {
      camera: {
        centerX: Number(uiState.camera?.centerX),
        centerY: Number(uiState.camera?.centerY),
        zoom: Number(uiState.camera?.zoom)
      },
      drawer: {
        collapsed: Boolean(uiState.drawer?.collapsed),
        filter: VALID_DRAWER_FILTERS.has(uiState.drawer?.filter)
          ? uiState.drawer.filter
          : "unplaced",
        sort: "alphabetical",
        search: String(uiState.drawer?.search || "").slice(0, 80)
      },
      correctionShown: Boolean(uiState.correctionShown),
      completedAt: Number.isFinite(uiState.completedAt) ? uiState.completedAt : null
    }
  };
}

export function validateLower48ReconstructionSnapshot(snapshot, capstone) {
  const errors = [];
  const stateIds = capstone?.stateIds || [];
  const session = snapshot?.session;
  if (snapshot?.version !== LOWER_48_RECONSTRUCTION_STORAGE_VERSION) {
    errors.push("Unsupported Lower 48 reconstruction save version.");
  }
  if (session?.regionId !== capstone?.id) errors.push("Saved capstone ID is invalid.");
  if (!VALID_PHASES.has(session?.phase)) errors.push("Saved phase is invalid.");
  if (!VALID_VIEW_MODES.has(session?.viewMode)) errors.push("Saved view mode is invalid.");
  if (!["idle", "complete"].includes(session?.correctionState)) {
    errors.push("Saved correction state is invalid.");
  }
  if (session?.phase === "result" && !session?.evaluation) {
    errors.push("Saved result evaluation is missing.");
  }
  if (!validPermutation(session?.bankOrder, stateIds)) errors.push("Saved bank order is invalid.");
  if (!Array.isArray(session?.pieceZOrder)
    || new Set(session.pieceZOrder).size !== session.pieceZOrder.length
    || session.pieceZOrder.some((stateId) => !stateIds.includes(stateId))) {
    errors.push("Saved piece order is invalid.");
  }
  const pieceIds = Object.keys(session?.pieces || {});
  if (!validPermutation(pieceIds, stateIds)) errors.push("Saved piece set is invalid.");
  for (const stateId of stateIds) {
    const piece = session?.pieces?.[stateId];
    if (!piece
      || !positionWithinWorkspace(piece.position, capstone.workspace)
      || !positionWithinWorkspace(piece.submittedPosition, capstone.workspace)) {
      errors.push(`Saved position for ${stateId} is invalid.`);
    }
  }
  const camera = snapshot?.ui?.camera;
  if (![camera?.centerX, camera?.centerY, camera?.zoom].every(Number.isFinite)
    || camera.centerX < 0
    || camera.centerX > capstone.workspace.width
    || camera.centerY < 0
    || camera.centerY > capstone.workspace.height
    || camera.zoom < capstone.camera.minZoom
    || camera.zoom > capstone.camera.maxZoom) {
    errors.push("Saved camera is invalid.");
  }
  if (!VALID_DRAWER_FILTERS.has(snapshot?.ui?.drawer?.filter)
    || !VALID_DRAWER_SORTS.has(snapshot?.ui?.drawer?.sort)) {
    errors.push("Saved drawer settings are invalid.");
  }
  return errors;
}

export function restoreLower48ReconstructionSession(baseSession, snapshot, capstone) {
  if (!baseSession || validateLower48ReconstructionSnapshot(snapshot, capstone).length) {
    return null;
  }
  const saved = snapshot.session;
  const session = copy(baseSession);
  session.phase = saved.phase;
  session.viewMode = saved.viewMode;
  session.correctionState = saved.correctionState === "idle" ? "idle" : "complete";
  session.bankOrder = [...saved.bankOrder];
  session.pieceZOrder = [...saved.pieceZOrder];
  session.selectedStateId = null;
  session.selectedStateIds = [];
  session.activeDrag = null;
  session.evaluation = copy(saved.evaluation);
  capstone.stateIds.forEach((stateId) => {
    const persisted = saved.pieces[stateId];
    Object.assign(session.piecesById[stateId], {
      position: persisted.position ? { ...persisted.position } : null,
      submittedPosition: persisted.submittedPosition
        ? { ...persisted.submittedPosition }
        : null,
      placementStatus: persisted.placementStatus,
      hasMoved: Boolean(persisted.hasMoved)
    });
  });
  return session;
}

export function readLower48ReconstructionSnapshot(storage, capstone) {
  try {
    const raw = storage?.getItem?.(LOWER_48_RECONSTRUCTION_STORAGE_KEY);
    if (!raw) return null;
    const snapshot = JSON.parse(raw);
    if (snapshot?.ui?.drawer && !VALID_DRAWER_SORTS.has(snapshot.ui.drawer.sort)) {
      snapshot.ui.drawer.sort = "alphabetical";
    }
    return validateLower48ReconstructionSnapshot(snapshot, capstone).length
      ? null
      : copy(snapshot);
  } catch {
    return null;
  }
}

export function writeLower48ReconstructionSnapshot(storage, snapshot) {
  try {
    storage?.setItem?.(LOWER_48_RECONSTRUCTION_STORAGE_KEY, JSON.stringify(snapshot));
    return true;
  } catch {
    return false;
  }
}

export function clearLower48ReconstructionSnapshot(storage) {
  try {
    storage?.removeItem?.(LOWER_48_RECONSTRUCTION_STORAGE_KEY);
    return true;
  } catch {
    return false;
  }
}
