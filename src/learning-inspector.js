import { getPlaceMastery } from "./place-mastery-store.js";
import {
  createDailyTrailPlannerItemDebug,
  DAILY_TRAIL_DEBUG_REASONS,
  getDailyTrailPlanReasonMap
} from "./daily-trail-planner.js";
import {
  createDailyTrailSelectionTrace,
  createMentalMapSelectionTrace,
  createUnitedStatesMemoryTrailSelectionTrace
} from "./selection-trace.js";
import {
  getAllCanonicalEvidenceEvents,
  getCanonicalEvidenceConceptSkillSummaries,
  getCanonicalEvidenceRepositoryStatus,
  getRecentCanonicalEvidenceEvents
} from "./canonical-learning-evidence-repository.js";

export const LEARNING_INSPECTOR_SCHEMA_VERSION = 1;
export const LEARNING_INSPECTOR_AVAILABILITY = Object.freeze({
  OBSERVED: "observed",
  INFERRED: "inferred",
  UNAVAILABLE: "unavailable"
});

function cloneJson(value) {
  if (value === undefined) return null;
  return JSON.parse(JSON.stringify(value));
}

function hasOwn(value, key) {
  return Boolean(value && Object.prototype.hasOwnProperty.call(value, key));
}

function observed(value, source, note = "") {
  return {
    availability: LEARNING_INSPECTOR_AVAILABILITY.OBSERVED,
    value: cloneJson(value),
    source,
    note
  };
}

function inferred(value, source, note = "") {
  return {
    availability: LEARNING_INSPECTOR_AVAILABILITY.INFERRED,
    value: cloneJson(value),
    source,
    note
  };
}

function unavailable(note, source = "") {
  return {
    availability: LEARNING_INSPECTOR_AVAILABILITY.UNAVAILABLE,
    value: null,
    source,
    note
  };
}

function observedIfPresent(value, key, source, note = "") {
  return hasOwn(value, key)
    ? observed(value[key], source, note)
    : unavailable(`${key} is not recorded by this source.`, source);
}

function getItemTaxonomy(item = {}) {
  if (item.taxonomy) return observed(item.taxonomy, "item.taxonomy");
  if (item.category) return observed(item.category, "item.category");
  if (item.type) return observed(item.type, "item.type", "Item type is the closest available category; no taxonomy mapping was applied.");
  return unavailable("No taxonomy or category is attached to this item.");
}

function createIdentity(item = {}, defaultMode = "") {
  const stableId = item.id || item.placeId || item.challengeId || item.regionId || "";
  const sourceActivity = item.sourceActivityId || item.homeActivityId || item.activityId || "";
  const sourceMode = item.sourceMode || item.mode || defaultMode;
  return {
    stableId: stableId
      ? observed(stableId, item.id ? "item.id" : "source identifier")
      : unavailable("This source does not provide a stable identifier."),
    label: item.label || item.name || item.title
      ? observed(item.label || item.name || item.title, "item metadata")
      : unavailable("No label is attached to this item."),
    sourceActivity: sourceActivity
      ? observed(sourceActivity, "item activity metadata")
      : unavailable("No source activity is attached to this item."),
    sourceMode: sourceMode
      ? observed(sourceMode, "Inspector adapter")
      : unavailable("No source mode was supplied."),
    taxonomy: getItemTaxonomy(item)
  };
}

function createEmptyMetrics(sourceName) {
  return {
    attempts: unavailable("Cumulative attempts are not recorded by this source.", sourceName),
    successes: unavailable("Cumulative successes are not recorded by this source.", sourceName),
    failures: unavailable("Cumulative failures are not recorded by this source.", sourceName),
    lapses: unavailable("Lapses are not recorded by this source.", sourceName),
    lastSeen: unavailable("Last-seen information is not recorded by this source.", sourceName),
    nextReview: unavailable("No due or next-review information is recorded by this source.", sourceName)
  };
}

export function createPlaceMasteryInspectorItemView({ place = {}, masteryState = {}, sourceActivity = "", taxonomy = null } = {}) {
  const placeId = String(place.placeId || "").trim();
  const storedPlace = placeId ? masteryState?.places?.[placeId] : null;
  const identityItem = {
    placeId,
    label: place.label || placeId,
    sourceActivityId: sourceActivity,
    sourceMode: "place-mastery",
    taxonomy
  };
  const metrics = createEmptyMetrics("place-mastery-store");

  if (!storedPlace) {
    return {
      schemaVersion: LEARNING_INSPECTOR_SCHEMA_VERSION,
      kind: "item-view",
      adapter: "place-mastery",
      identity: createIdentity(identityItem, "place-mastery"),
      learnerState: {
        masterySignals: unavailable("No persisted mastery evidence exists for this place.", "place-mastery-store"),
        currentProgress: unavailable("Place mastery does not define a single combined progress status.", "place-mastery-store")
      },
      metrics
    };
  }

  const mastery = getPlaceMastery(placeId, masteryState);
  const signals = Object.values(mastery.signals);
  const lastAttempts = signals.map((signal) => signal.lastAttemptAt).filter(Boolean).sort();
  metrics.attempts = inferred(signals.reduce((sum, signal) => sum + signal.attempts, 0), "sum of observed mastery signals");
  metrics.successes = inferred(signals.reduce((sum, signal) => sum + signal.correct, 0), "sum of observed mastery signals");
  metrics.failures = inferred(signals.reduce((sum, signal) => sum + signal.incorrect, 0), "sum of observed mastery signals");
  metrics.lastSeen = lastAttempts.length
    ? inferred(lastAttempts[lastAttempts.length - 1], "latest observed mastery signal timestamp")
    : unavailable("No mastery signal has a last-attempt timestamp.", "place-mastery-store");

  return {
    schemaVersion: LEARNING_INSPECTOR_SCHEMA_VERSION,
    kind: "item-view",
    adapter: "place-mastery",
    identity: createIdentity(identityItem, "place-mastery"),
    learnerState: {
      masterySignals: observed(mastery.signals, "place-mastery-store"),
      currentProgress: unavailable("Place mastery intentionally keeps recognition, naming, locating, and relationships separate.", "place-mastery-store")
    },
    metrics
  };
}

function createAdaptiveProgressInspectorItemView({ adapter, mode, item = {}, state = {} } = {}) {
  const itemId = String(item.id || "");
  const progress = itemId ? state?.itemProgress?.[itemId] : null;
  const introduced = itemId && Array.isArray(state?.introducedItemIds) && state.introducedItemIds.includes(itemId);
  const sourceName = `${adapter} progress state`;
  const metrics = createEmptyMetrics(sourceName);

  if (progress) {
    metrics.attempts = observedIfPresent(progress, "timesSeen", sourceName);
    metrics.successes = observedIfPresent(progress, "correctCount", sourceName);
    metrics.failures = observedIfPresent(progress, "missCount", sourceName);
    metrics.lapses = observedIfPresent(progress, "lapseCount", sourceName);
    const seen = {};
    if (hasOwn(progress, "lastSeenSession")) seen.session = progress.lastSeenSession;
    if (hasOwn(progress, "lastReviewedSession")) seen.reviewedSession = progress.lastReviewedSession;
    if (hasOwn(progress, "lastReviewedDate")) seen.reviewedDate = progress.lastReviewedDate;
    metrics.lastSeen = Object.keys(seen).length
      ? observed(seen, sourceName)
      : unavailable("No last-seen fields are recorded for this item.", sourceName);
    const due = {};
    if (hasOwn(progress, "dueSession")) due.session = progress.dueSession;
    if (hasOwn(progress, "dueDate")) due.date = progress.dueDate;
    metrics.nextReview = Object.keys(due).length
      ? observed(due, sourceName)
      : unavailable("No due fields are recorded for this item.", sourceName);
  }

  const progressStatus = progress && hasOwn(progress, "status")
    ? observed(progress.status, sourceName)
    : introduced
      ? inferred("introduced", "state.introducedItemIds", "No itemProgress record exists; status follows the store's introduced-item fallback.")
      : inferred("unseen", "absence from existing progress state", "This is the planner fallback, not persisted evidence of an encounter.");

  return {
    schemaVersion: LEARNING_INSPECTOR_SCHEMA_VERSION,
    kind: "item-view",
    adapter,
    identity: createIdentity({ ...item, sourceMode: mode }, mode),
    learnerState: {
      currentProgress: progress ? observed(progress, sourceName) : unavailable("No itemProgress record exists for this item.", sourceName),
      progressStatus,
      mastery: unavailable("This adapter exposes the source's progress status; it does not infer a separate mastery judgment.", sourceName)
    },
    metrics
  };
}

export function createDailyTrailInspectorItemView(input = {}) {
  return createAdaptiveProgressInspectorItemView({ ...input, adapter: "daily-trail", mode: "Daily Trail" });
}

export function createUnitedStatesMemoryTrailInspectorItemView(input = {}) {
  return createAdaptiveProgressInspectorItemView({ ...input, adapter: "us-memory-trail", mode: "United States Memory Trail" });
}

export function createJourneyProgressInspectorItemView({ journeyId = "", stepId = "", difficulty = "", progress = {}, item = {} } = {}) {
  const journey = progress?.journeys?.[journeyId];
  const step = journey?.completedSteps?.[stepId];
  const hasCompletion = Boolean(step && hasOwn(step, difficulty));
  const identity = createIdentity({
    ...item,
    id: item.id || stepId,
    sourceActivityId: item.sourceActivityId || stepId,
    sourceMode: "Journey"
  }, "Journey");
  return {
    schemaVersion: LEARNING_INSPECTOR_SCHEMA_VERSION,
    kind: "item-view",
    adapter: "journey-progress",
    identity,
    learnerState: {
      currentProgress: journey ? observed(journey, `progress.journeys.${journeyId}`) : unavailable("No progress exists for this journey."),
      completion: hasCompletion
        ? observed(Boolean(step[difficulty]), `completedSteps.${stepId}.${difficulty}`)
        : unavailable("No completion value is stored for this step and difficulty."),
      mastery: unavailable("Journey completion is not equivalent to item mastery.", "progress-store")
    },
    metrics: createEmptyMetrics("progress-store")
  };
}

export function createMentalMapInspectorItemView({ challenge = {}, state = null, evaluation = null } = {}) {
  const result = evaluation || state?.evaluation || null;
  return {
    schemaVersion: LEARNING_INSPECTOR_SCHEMA_VERSION,
    kind: "item-view",
    adapter: "mental-map",
    identity: createIdentity({
      ...challenge,
      challengeId: challenge.id,
      sourceMode: "Mental Map"
    }, "Mental Map"),
    learnerState: {
      currentProgress: state ? observed(state, "Mental Map challenge state") : unavailable("No challenge state was supplied."),
      currentResult: result ? observed(result, "Mental Map evaluation") : unavailable("This challenge has no submitted evaluation."),
      mastery: unavailable("Mental Map results are not currently accumulated into durable item mastery.", "Mental Map")
    },
    metrics: createEmptyMetrics("Mental Map")
  };
}

export function createMapReconstructionInspectorItemView({ region = {}, session = null, evaluation = null, stateId = "" } = {}) {
  const result = evaluation || session?.evaluation || null;
  const placement = stateId && result?.placements?.[stateId] ? result.placements[stateId] : null;
  return {
    schemaVersion: LEARNING_INSPECTOR_SCHEMA_VERSION,
    kind: "item-view",
    adapter: "map-reconstruction",
    identity: createIdentity({
      id: stateId ? `${region.id || "reconstruction"}:${stateId}` : region.id,
      label: stateId || region.title || region.name,
      sourceActivityId: region.id,
      sourceMode: "Map Reconstruction",
      taxonomy: region.category || null
    }, "Map Reconstruction"),
    learnerState: {
      currentProgress: session ? observed({ phase: session.phase, viewMode: session.viewMode }, "Map Reconstruction session") : unavailable("No reconstruction session was supplied."),
      currentResult: result ? observed(result, "Map Reconstruction evaluation") : unavailable("No reconstruction evaluation is available."),
      placement: placement ? observed(placement, `evaluation.placements.${stateId}`) : unavailable("No state-specific placement result is available."),
      mastery: unavailable("Reconstruction results are not currently accumulated into durable item mastery.", "Map Reconstruction")
    },
    metrics: createEmptyMetrics("Map Reconstruction")
  };
}

function createDeterministicContext(context = {}) {
  const hasSeed = hasOwn(context, "seed");
  const hasNow = hasOwn(context, "now");
  let resolvedNow = null;
  if (hasNow) {
    const value = typeof context.now === "function" ? context.now() : context.now;
    const date = value instanceof Date ? value : new Date(value);
    resolvedNow = Number.isNaN(date.getTime()) ? String(value) : date.toISOString();
  }
  return {
    seed: hasSeed ? observed(context.seed, "caller-provided deterministic context") : unavailable("No seed was supplied."),
    time: hasNow ? observed(resolvedNow, "caller-provided deterministic context") : unavailable("No fixed time was supplied."),
    randomSource: typeof context.random === "function"
      ? observed("injected-random-function", "caller-provided deterministic context", "The function itself is not JSON-serializable or replayable from this export.")
      : unavailable("No explicit random function was supplied.")
  };
}

const dailyReasonDescriptions = Object.freeze({
  [DAILY_TRAIL_DEBUG_REASONS.NEW]: "Selected as new material.",
  [DAILY_TRAIL_DEBUG_REASONS.RECENT_REVIEW]: "Selected from existing review material.",
  [DAILY_TRAIL_DEBUG_REASONS.WEAK_REVIEW]: "Selected because current progress carries a weak/relearning signal.",
  [DAILY_TRAIL_DEBUG_REASONS.MISSED_NEW_RETRY]: "Selected to retry recently missed new material.",
  [DAILY_TRAIL_DEBUG_REASONS.CHECKPOINT]: "Selected as part of a checkpoint.",
  [DAILY_TRAIL_DEBUG_REASONS.CHECKPOINT_REMEDIATION]: "Selected as part of checkpoint remediation.",
  [DAILY_TRAIL_DEBUG_REASONS.TERMINAL_REVIEW]: "Selected for explicit completed-trail review.",
  [DAILY_TRAIL_DEBUG_REASONS.CO_FOUNDATION]: "Selected for the continents-and-oceans foundation sequence.",
  [DAILY_TRAIL_DEBUG_REASONS.CO_REVIEW]: "Selected for continents-and-oceans review.",
  [DAILY_TRAIL_DEBUG_REASONS.UNKNOWN]: "The existing planner reason projection cannot classify this item."
});

export function createDailyTrailSelectionExplanation({ state = {}, plan = {}, item = {}, deterministicContext = {} } = {}) {
  const isSelected = (plan.playItems || []).some((candidate) => candidate.id === item.id);
  const reason = getDailyTrailPlanReasonMap(state, plan).get(item.id) || DAILY_TRAIL_DEBUG_REASONS.UNKNOWN;
  const priority = createDailyTrailPlannerItemDebug(state, item, reason, deterministicContext);
  return {
    schemaVersion: LEARNING_INSPECTOR_SCHEMA_VERSION,
    kind: "selection-explanation",
    planner: observed("Daily Trail", "plan source"),
    itemId: item.id ? observed(item.id, "item.id") : unavailable("The selected item has no ID."),
    eligible: isSelected
      ? observed(true, "plan.playItems", "The item is present in the emitted plan.")
      : unavailable("The item is not present in plan.playItems; eligibility cannot be established."),
    reasonCode: inferred(reason, "existing Daily Trail planner reason projection"),
    reason: inferred(dailyReasonDescriptions[reason], "Daily Trail reason-code description"),
    priorityFactors: inferred(priority, "existing Daily Trail planner debug projection"),
    whyWon: unavailable("The planner does not retain a comparison trace or rejected-alternative ranking."),
    selectionIndex: isSelected ? observed(plan.playItems.findIndex((candidate) => candidate.id === item.id), "plan.playItems") : unavailable("Item was not selected."),
    deterministicContext: createDeterministicContext(deterministicContext),
    selectionTrace: createDailyTrailSelectionTrace({ state, plan, item, deterministicContext })
  };
}

function getUsPlanMembership(plan, itemId) {
  const memberships = [
    ["new", plan.newItems],
    ["weak-review", plan.weakReviewItems],
    ["older-review", plan.oldReviewItems],
    ["recent-review", plan.recentReviewItems],
    ["review", plan.reviewItems]
  ];
  return memberships.find(([, items]) => (items || []).some((item) => item.id === itemId))?.[0]
    || ((plan.playItems || []).some((item) => item.id === itemId) ? "selected" : "unknown");
}

export function createUnitedStatesMemoryTrailSelectionExplanation({ state = {}, plan = {}, item = {}, deterministicContext = {} } = {}) {
  const selectionIndex = (plan.playItems || []).findIndex((candidate) => candidate.id === item.id);
  const membership = getUsPlanMembership(plan, item.id);
  const progress = state?.itemProgress?.[item.id] || null;
  return {
    schemaVersion: LEARNING_INSPECTOR_SCHEMA_VERSION,
    kind: "selection-explanation",
    planner: observed("United States Memory Trail", "plan source"),
    itemId: item.id ? observed(item.id, "item.id") : unavailable("The selected item has no ID."),
    eligible: selectionIndex >= 0
      ? observed(true, "plan.playItems", "The item is present in the emitted plan.")
      : unavailable("The item is not present in plan.playItems; eligibility cannot be established."),
    reasonCode: inferred(membership, "membership in emitted U.S. Memory Trail plan arrays", "The U.S. planner does not persist a separate reason code."),
    reason: inferred(`Selected through the ${membership} plan bucket.`, "plan-array membership"),
    priorityFactors: progress
      ? observed({
        status: progress.status ?? null,
        memoryState: progress.memoryState ?? null,
        missCount: progress.missCount ?? null,
        lapseCount: progress.lapseCount ?? null,
        lastSeenSession: progress.lastSeenSession ?? null,
        dueSession: progress.dueSession ?? null
      }, "U.S. Memory Trail itemProgress")
      : unavailable("No item progress exists for this selection."),
    whyWon: unavailable("The U.S. planner does not retain rejected alternatives or comparison results."),
    selectionIndex: selectionIndex >= 0 ? observed(selectionIndex, "plan.playItems") : unavailable("Item was not selected."),
    deterministicContext: createDeterministicContext(deterministicContext),
    selectionTrace: createUnitedStatesMemoryTrailSelectionTrace({ state, plan, item, deterministicContext })
  };
}

export function createMentalMapSelectionExplanation({ challenge = {}, pool = [], selectionDebug = null, generatedSelectionDebug = null, deterministicContext = {} } = {}) {
  const poolIndex = pool.findIndex((candidate) => candidate.id === challenge.id);
  const trace = createMentalMapSelectionTrace({ challenge, pool, selectionDebug, generatedSelectionDebug, deterministicContext });
  const debug = selectionDebug || generatedSelectionDebug;
  return {
    schemaVersion: LEARNING_INSPECTOR_SCHEMA_VERSION,
    kind: "selection-explanation",
    planner: observed("Mental Map challenge selector", "selection source"),
    itemId: challenge.id ? observed(challenge.id, "challenge.id") : unavailable("The challenge has no ID."),
    eligible: poolIndex >= 0
      ? observed(true, "challenge pool", "The selected challenge is present in the supplied eligible pool.")
      : unavailable("The supplied pool does not establish that this challenge was eligible."),
    reasonCode: inferred(hasOwn(deterministicContext, "seed") ? "seeded-random-selection" : "random-selection", "selector inputs"),
    reason: inferred("Selected from the filtered preferred challenge pool using the configured random source.", "Mental Map selector behavior"),
    priorityFactors: debug
      ? inferred(trace.priorityFactors.value, "selectionTrace priority factors", "Decision-time debug metadata was supplied.")
      : unavailable("The selector does not emit its filtered pool, random draw, or category/mode exclusion trace unless debug metadata is requested."),
    whyWon: debug
      ? inferred("The selected item occupied the recorded index in the recorded filtered or generated candidate sequence.", "selectionTrace decision metadata")
      : unavailable("The exact random draw and rejected alternatives are not available without decision-time debug metadata."),
    selectionIndex: poolIndex >= 0 ? observed(poolIndex, "supplied challenge pool") : unavailable("Challenge was not found in the supplied pool."),
    deterministicContext: createDeterministicContext(deterministicContext),
    selectionTrace: trace
  };
}

function collectFields(value, path = "", result = new Map()) {
  if (value && typeof value === "object" && hasOwn(value, "availability") && hasOwn(value, "value")) {
    result.set(path, value);
    return result;
  }
  if (value && typeof value === "object") {
    Object.entries(value).forEach(([key, child]) => collectFields(child, path ? `${path}.${key}` : key, result));
  }
  return result;
}

export function createLearningInspectorTransition({ before = null, event = {}, after = null } = {}) {
  const beforeSnapshot = cloneJson(before);
  const afterSnapshot = cloneJson(after);
  const beforeFields = collectFields(beforeSnapshot);
  const afterFields = collectFields(afterSnapshot);
  const paths = [...new Set([...beforeFields.keys(), ...afterFields.keys()])].sort();
  const changes = paths.flatMap((path) => {
    const beforeField = beforeFields.get(path) || null;
    const afterField = afterFields.get(path) || null;
    return JSON.stringify(beforeField?.value) === JSON.stringify(afterField?.value)
      ? []
      : [{ path, before: cloneJson(beforeField?.value), after: cloneJson(afterField?.value) }];
  });
  const hasAnswer = hasOwn(event, "answer");
  const hasResult = hasOwn(event, "result");
  return {
    schemaVersion: LEARNING_INSPECTOR_SCHEMA_VERSION,
    kind: "transition-view",
    before: beforeSnapshot,
    event: {
      itemId: event.itemId ? observed(event.itemId, "answer event") : unavailable("The event has no item ID."),
      sourceMode: event.sourceMode ? observed(event.sourceMode, "answer event") : unavailable("The event has no source mode."),
      answer: hasAnswer ? observed(event.answer, "answer event") : unavailable("The answer payload was not supplied."),
      result: hasResult ? observed(event.result, "answer event") : unavailable("The result payload was not supplied.")
    },
    after: afterSnapshot,
    changes: inferred(changes, "Inspector comparison of before and after field values", "Changes describe snapshots; they do not claim causal attribution beyond the supplied event boundary.")
  };
}

export function createCanonicalEvidenceInspectorView({
  repository,
  conceptId = "",
  skillId = "",
  sourceMode = "",
  recentLimit = 20
} = {}) {
  let events = getAllCanonicalEvidenceEvents(repository);
  if (conceptId) events = events.filter((event) => event.conceptId === conceptId);
  if (skillId) events = events.filter((event) => event.skillId === skillId);
  if (sourceMode) events = events.filter((event) => event.sourceMode === sourceMode);
  const summaries = getCanonicalEvidenceConceptSkillSummaries({
    ...repository,
    events
  });
  const recentEvidence = getRecentCanonicalEvidenceEvents({ ...repository, events }, recentLimit);
  return {
    schemaVersion: LEARNING_INSPECTOR_SCHEMA_VERSION,
    kind: "canonical-evidence-view",
    adapter: "canonical-evidence-repository",
    informationClass: observed(
      "canonical-live-events",
      "canonical-learning-evidence-repository",
      "These are raw canonical events and factual reductions, distinct from legacy planner aggregates."
    ),
    repository: observed(
      getCanonicalEvidenceRepositoryStatus(repository),
      "canonical-learning-evidence-repository"
    ),
    filters: observed({ conceptId, skillId, sourceMode }, "Learning Inspector request"),
    summaries: observed(summaries, "deterministic canonical event reducer"),
    recentEvidence: observed(
      recentEvidence,
      "canonical-learning-evidence-repository",
      "Each event retains its sourceMode and optional sourceActivityId/sessionId provenance."
    )
  };
}

export function createLearningInspectorDebugObject({
  items = [],
  selections = [],
  transitions = [],
  context = {},
  canonicalEvidence = null,
  canonicalRepository = null,
  canonicalEvidenceFilters = {}
} = {}) {
  const output = {
    schemaVersion: LEARNING_INSPECTOR_SCHEMA_VERSION,
    kind: "learning-inspector-export",
    context,
    items,
    selections,
    transitions
  };
  if (canonicalEvidence || canonicalRepository) {
    output.canonicalEvidence = canonicalEvidence || createCanonicalEvidenceInspectorView({
      repository: canonicalRepository,
      ...canonicalEvidenceFilters
    });
  }
  return cloneJson(output);
}
