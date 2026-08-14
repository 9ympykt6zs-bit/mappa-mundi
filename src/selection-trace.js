import {
  createDailyTrailPlannerItemDebug,
  DAILY_TRAIL_DEBUG_REASONS,
  getDailyTrailPlanReasonMap
} from "./daily-trail-planner.js";
import { getUnitedStatesMemoryTrailSelectionDebug } from "./united-states-memory-trail-planner.js";

export const SELECTION_TRACE_SCHEMA_VERSION = 1;

function clone(value) {
  if (value === undefined) return null;
  return JSON.parse(JSON.stringify(value));
}

function field(availability, value, source, note = "") {
  return { availability, value: clone(value), source, note };
}

function observed(value, source, note = "") {
  return field("observed", value, source, note);
}

function inferred(value, source, note = "") {
  return field("inferred", value, source, note);
}

function unavailable(note, source = "") {
  return field("unavailable", null, source, note);
}

function resolveSuppliedTime(context = {}) {
  if (!Object.prototype.hasOwnProperty.call(context, "now")) return null;
  const value = typeof context.now === "function" ? context.now() : context.now;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function deterministicContextFields(context = {}) {
  return {
    seed: Object.prototype.hasOwnProperty.call(context, "seed")
      ? observed(context.seed, "caller-provided deterministic context")
      : unavailable("No deterministic seed was supplied."),
    timestamp: resolveSuppliedTime(context)
      ? observed(resolveSuppliedTime(context), "caller-provided deterministic clock")
      : unavailable("No valid deterministic timestamp was supplied."),
    randomSource: typeof context.random === "function"
      ? observed("injected-random-function", "caller-provided deterministic context")
      : unavailable("No explicit random function was supplied; a seed may still control randomness.")
  };
}

function traceIdentity(source, selectedId, planIdentity = "") {
  return `${source}:${planIdentity || "no-plan-id"}:${selectedId || "no-selection"}`;
}

function baseTrace({ source, selected, deterministicContext, planIdentity = "" }) {
  const selectedId = selected?.id || selected?.targetId || "";
  const contextFields = deterministicContextFields(deterministicContext);
  return {
    schemaVersion: SELECTION_TRACE_SCHEMA_VERSION,
    kind: "selection-trace",
    traceId: inferred(traceIdentity(source, selectedId, planIdentity), "stable trace identity projection"),
    timestamp: contextFields.timestamp,
    deterministicContext: contextFields,
    planner: observed(source, "trace adapter"),
    selected: selectedId
      ? observed({ id: selectedId, targetId: selected?.targetId || null, label: selected?.label || selected?.title || null }, "selected item")
      : unavailable("No selected item was supplied."),
    selectionReasons: unavailable("This trace adapter could not establish selection reasons."),
    reasonBucket: unavailable("This trace adapter could not establish a reason bucket."),
    priorityFactors: unavailable("No priority factors are available."),
    eligibleCandidateCount: unavailable("The planner did not retain an eligible-candidate count."),
    candidatePoolMetadata: unavailable("The planner did not retain candidate-pool metadata."),
    alternatives: unavailable("The planner did not expose alternatives."),
    unavailableFields: observed({}, "trace adapter")
  };
}

export function createDailyTrailSelectionTrace({ state = {}, plan = {}, item = {}, deterministicContext = {} } = {}) {
  const trace = baseTrace({
    source: "daily-trail",
    selected: item,
    deterministicContext,
    planIdentity: `${plan.sessionType || "unknown"}:${state.currentSessionNumber || "unknown"}`
  });
  const reason = getDailyTrailPlanReasonMap(state, plan).get(item.id) || DAILY_TRAIL_DEBUG_REASONS.UNKNOWN;
  const priority = createDailyTrailPlannerItemDebug(state, item, reason, deterministicContext);
  const emittedAlternatives = (plan.playItems || [])
    .filter((candidate) => candidate.id !== item.id)
    .map((candidate) => ({
      id: candidate.id,
      targetId: candidate.targetId || null,
      status: "also-selected",
      reasonBucket: getDailyTrailPlanReasonMap(state, plan).get(candidate.id) || DAILY_TRAIL_DEBUG_REASONS.UNKNOWN
    }));
  trace.selectionReasons = inferred([reason], "existing Daily Trail reason projection");
  trace.reasonBucket = inferred(reason, "existing Daily Trail reason projection");
  trace.priorityFactors = inferred(priority, "existing Daily Trail planner debug projection", "These are planner inputs/derived fields, not a synthetic score.");
  trace.candidatePoolMetadata = observed({
    suppliedItemCount: (plan.allItems || []).length,
    emittedSelectionCount: (plan.playItems || []).length,
    emittedNewCount: (plan.newItems || []).length,
    emittedReviewCount: (plan.reviewItems || []).length,
    sessionType: plan.sessionType || null,
    activeActivityId: plan.activeActivityId || null
  }, "emitted Daily Trail plan");
  trace.alternatives = inferred({
    available: emittedAlternatives.length > 0,
    scope: "other-emitted-selections-only",
    items: emittedAlternatives
  }, "plan.playItems", "Rejected eligible candidates are not retained by the Daily Trail planner.");
  trace.unavailableFields = observed({
    fullEligibleCandidateCount: "Daily Trail does not retain the full post-filter candidate pool on the emitted plan.",
    rejectedAlternatives: "Only other emitted selections can be listed.",
    exactWhyWon: "The planner does not retain a comparison trace.",
    numericScore: "No single selection score is calculated by the current planner."
  }, "Daily Trail trace adapter");
  return trace;
}

export function createUnitedStatesMemoryTrailSelectionTrace({ state = {}, plan = {}, item = {}, deterministicContext = {} } = {}) {
  const trace = baseTrace({
    source: "us-memory-trail",
    selected: item,
    deterministicContext,
    planIdentity: plan.sessionId || `${plan.sessionType || "unknown"}:${state.currentSessionNumber || "unknown"}`
  });
  const debug = getUnitedStatesMemoryTrailSelectionDebug(state, plan, item, deterministicContext);
  const selectedCandidate = debug.candidates.find((candidate) => candidate.id === item.id) || null;
  const reasons = [debug.reasonBucket];
  if (selectedCandidate?.weak) reasons.push("weak-progress");
  if (selectedCandidate?.due) reasons.push("due-for-review");
  if ((selectedCandidate?.missCount || 0) > 0) reasons.push("recorded-miss");
  if (debug.reasonBucket === "new") reasons.push("curriculum-eligible-new-item");
  trace.selectionReasons = inferred(reasons.filter(Boolean), "U.S. Memory Trail plan membership and existing progress fields");
  trace.reasonBucket = inferred(debug.reasonBucket, "membership in emitted U.S. Memory Trail plan arrays");
  trace.priorityFactors = selectedCandidate
    ? inferred({
      progressStatus: selectedCandidate.progressStatus,
      weak: selectedCandidate.weak,
      due: selectedCandidate.due,
      missCount: selectedCandidate.missCount,
      lapseCount: selectedCandidate.lapseCount,
      lastSeenSession: selectedCandidate.lastSeenSession,
      dueSession: selectedCandidate.dueSession
    }, "existing U.S. Memory Trail progress and priority predicates")
    : unavailable("The selected item was not found in the reconstructed candidate pool.");
  trace.eligibleCandidateCount = debug.candidateCount === null
    ? unavailable("The selected item could not be assigned to a planner bucket.")
    : inferred(debug.candidateCount, "existing U.S. Memory Trail eligibility and priority helpers", "Reconstructed read-only from the same state, plan, and deterministic context.");
  trace.candidatePoolMetadata = inferred({
    kind: debug.candidatePoolKind,
    selectedCandidateIndex: debug.selectedCandidateIndex,
    activeActivityId: plan.activeActivityId || null,
    sessionType: plan.sessionType || null
  }, "existing U.S. Memory Trail plan and candidate projection");
  trace.alternatives = debug.candidateCount === null
    ? unavailable("No candidate pool was available for this bucket.")
    : inferred({
      available: debug.candidates.some((candidate) => candidate.id !== item.id),
      scope: "reconstructed-planner-bucket",
      items: debug.candidates.filter((candidate) => candidate.id !== item.id)
    }, "existing U.S. Memory Trail eligibility and priority helpers", "Candidates were reconstructed without changing or rerunning selection.");
  trace.unavailableFields = observed({
    exactComparatorSteps: "The planner uses ordered comparator clauses but does not retain which clause broke each pairwise tie.",
    numericScore: "No single selection score is calculated by the current planner.",
    crossBucketCompetition: "New, weak, older, and recent slots are selected separately; they are not one shared ranked pool."
  }, "U.S. Memory Trail trace adapter");
  return trace;
}

export function createMentalMapSelectionTrace({ challenge = {}, pool = [], selectionDebug = null, generatedSelectionDebug = null, deterministicContext = {} } = {}) {
  const trace = baseTrace({ source: "mental-map", selected: challenge, deterministicContext, planIdentity: "challenge-selection" });
  const debug = selectionDebug || generatedSelectionDebug;
  if (!debug) {
    trace.selectionReasons = inferred(["random-selection"], "Mental Map selector contract");
    trace.reasonBucket = inferred("random-selection", "Mental Map selector contract");
    trace.candidatePoolMetadata = observed({ suppliedItemCount: pool.length }, "supplied challenge pool");
    trace.alternatives = unavailable("Pass selector debug metadata to expose the filtered candidate pool and random draw.");
    trace.unavailableFields = observed({
      filteredCandidateCount: "Selector debug metadata was not supplied.",
      randomDraw: "Selector debug metadata was not supplied.",
      exactWhyWon: "Selector debug metadata was not supplied."
    }, "Mental Map trace adapter");
    return trace;
  }

  const isGeneratedPairDebug = Object.prototype.hasOwnProperty.call(debug, "pairCount");
  const candidates = isGeneratedPairDebug ? debug.considered : debug.candidates;
  const selectedIndex = isGeneratedPairDebug ? debug.selectedPairIndex : debug.selectedIndex;
  const candidateCount = isGeneratedPairDebug ? debug.pairCount : debug.preferredCount;
  trace.selectionReasons = inferred(
    isGeneratedPairDebug ? ["generated-shortest-route", "first-eligible-pair-from-seeded-start"] : ["filtered-random-selection", ...(debug.filters || [])],
    "Mental Map selector debug projection"
  );
  trace.reasonBucket = inferred(isGeneratedPairDebug ? "generated-shortest-route" : "filtered-random-selection", "Mental Map selector debug projection");
  trace.priorityFactors = inferred(
    isGeneratedPairDebug
      ? { seededStartIndex: debug.startIndex, selectedPairIndex: debug.selectedPairIndex }
      : { randomValue: debug.randomValue, selectedIndex: debug.selectedIndex, filters: debug.filters },
    "Mental Map selector debug projection",
    "Mental Map uses a random index after filtering; this is not a mastery score."
  );
  trace.eligibleCandidateCount = isGeneratedPairDebug
    ? unavailable("Generated route selection stops at the first eligible pair, so the total eligible-pair count is not calculated.", "Mental Map generated-route selector")
    : observed(candidateCount, "Mental Map selector debug projection");
  trace.candidatePoolMetadata = observed(
    isGeneratedPairDebug
      ? { pairCount: debug.pairCount, startIndex: debug.startIndex, consideredBeforeSelection: debug.considered.length }
      : { suppliedCount: debug.suppliedCount, eligibleCount: debug.eligibleCount, preferredCount: debug.preferredCount, filters: debug.filters },
    "Mental Map selector debug projection"
  );
  trace.alternatives = observed({
    available: (candidates || []).some((candidate) => candidate.status !== "selected"),
    scope: isGeneratedPairDebug ? "pairs-examined-from-seeded-start" : "filtered-preferred-pool",
    items: (candidates || []).filter((candidate) => candidate.status !== "selected")
  }, "Mental Map selector debug projection");
  trace.unavailableFields = observed({
    pedagogicalPriority: "Mental Map selection does not currently use learner mastery evidence.",
    numericMasteryScore: "No mastery score is calculated for this selection."
  }, "Mental Map trace adapter");
  if (selectedIndex < 0) {
    trace.selected = unavailable("The selector did not produce a challenge.");
  }
  return trace;
}
