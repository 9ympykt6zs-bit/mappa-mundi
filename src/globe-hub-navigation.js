export const GLOBE_HUB_HISTORY_STATE_VERSION = 1;
export const GLOBE_HUB_HISTORY_STATE_KEY = "mappaMundiGlobeHub";

const globeHubSurfaces = new Set(["globe", "destination"]);

function normalizeIdentifier(value) {
  return String(value || "").trim();
}

export function createGlobeHubHistoryState({
  surface = "globe",
  globeScopeId,
  destinationId = "",
  returnScopeId = ""
} = {}) {
  const normalizedSurface = globeHubSurfaces.has(surface) ? surface : "globe";
  const normalizedScopeId = normalizeIdentifier(globeScopeId) || "world";
  const normalizedDestinationId = normalizedSurface === "destination"
    ? normalizeIdentifier(destinationId)
    : "";

  return {
    version: GLOBE_HUB_HISTORY_STATE_VERSION,
    surface: normalizedDestinationId ? "destination" : "globe",
    globeScopeId: normalizedScopeId,
    destinationId: normalizedDestinationId,
    returnScopeId: normalizedDestinationId
      ? normalizeIdentifier(returnScopeId) || normalizedScopeId
      : ""
  };
}

export function wrapGlobeHubHistoryState(snapshot) {
  return {
    [GLOBE_HUB_HISTORY_STATE_KEY]: createGlobeHubHistoryState(snapshot)
  };
}

export function readGlobeHubHistoryState(historyState, options = {}) {
  const candidate = historyState?.[GLOBE_HUB_HISTORY_STATE_KEY];
  if (!candidate || candidate.version !== GLOBE_HUB_HISTORY_STATE_VERSION) return null;

  const snapshot = createGlobeHubHistoryState(candidate);
  if (options.isScopeValid && !options.isScopeValid(snapshot.globeScopeId)) return null;
  if (
    snapshot.surface === "destination"
    && options.isDestinationValid
    && !options.isDestinationValid(snapshot.destinationId)
  ) {
    return null;
  }
  return snapshot;
}

export function resolveGlobeHubContinueTarget({
  hasDurableGuidedChild = false,
  hasActiveGuidedSession = false,
  hasStartedGuidedLearning = false,
  isGuidedPostCourse = false,
  journeyTarget = null
} = {}) {
  if (hasDurableGuidedChild) {
    return { kind: "united-states-guided", reason: "durable-guided-child" };
  }
  if (hasActiveGuidedSession) {
    return { kind: "united-states-guided", reason: "active-guided-session" };
  }
  if (hasStartedGuidedLearning || isGuidedPostCourse) {
    return { kind: "united-states-guided", reason: isGuidedPostCourse ? "guided-post-course" : "guided-started" };
  }
  if (journeyTarget?.journeyId) {
    return {
      kind: "journey",
      reason: "active-incomplete-journey",
      journeyId: normalizeIdentifier(journeyTarget.journeyId),
      label: normalizeIdentifier(journeyTarget.label)
    };
  }
  return null;
}

export function createGlobeHubNavigationController({
  history,
  eventTarget,
  rootScopeId = "world",
  isScopeValid,
  isDestinationValid,
  onNavigate
} = {}) {
  if (!history || typeof onNavigate !== "function") {
    throw new TypeError("Globe hub navigation requires history and an onNavigate callback.");
  }

  const read = (state = history.state) => readGlobeHubHistoryState(state, {
    isScopeValid,
    isDestinationValid
  });

  const apply = async (snapshot, options = {}) => {
    const normalized = createGlobeHubHistoryState(snapshot);
    const method = options.replace === true ? "replaceState" : "pushState";
    history[method](wrapGlobeHubHistoryState(normalized), "");
    await onNavigate(normalized, { source: options.source || "navigation" });
    return normalized;
  };

  const restore = async () => {
    const stored = read();
    if (stored) {
      await onNavigate(stored, { source: "restore" });
      return stored;
    }
    return apply({ surface: "globe", globeScopeId: rootScopeId }, {
      replace: true,
      source: "fallback"
    });
  };

  const handlePopState = (event) => {
    const stored = read(event.state);
    const snapshot = stored || createGlobeHubHistoryState({
      surface: "globe",
      globeScopeId: rootScopeId
    });
    if (!stored) {
      history.replaceState(wrapGlobeHubHistoryState(snapshot), "");
    }
    void onNavigate(snapshot, { source: "popstate" });
  };

  eventTarget?.addEventListener?.("popstate", handlePopState);

  return Object.freeze({
    current: read,
    restore,
    showGlobe(scopeId, options = {}) {
      return apply({ surface: "globe", globeScopeId: scopeId || rootScopeId }, options);
    },
    showDestination(destinationId, { globeScopeId, returnScopeId, ...options } = {}) {
      return apply({
        surface: "destination",
        globeScopeId: globeScopeId || rootScopeId,
        destinationId,
        returnScopeId: returnScopeId || globeScopeId || rootScopeId
      }, options);
    },
    destroy() {
      eventTarget?.removeEventListener?.("popstate", handlePopState);
    }
  });
}
