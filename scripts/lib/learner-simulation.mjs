import { createSeededRandom } from "../../src/deterministic-dependencies.js";
import {
  applyDailyTrailSessionResults,
  createDailyTrailState,
  planCompletedDailyTrailReviewSession
} from "../../src/daily-trail-planner.js";
import {
  createDailyTrailInspectorItemView,
  createDailyTrailSelectionExplanation,
  createLearningInspectorDebugObject,
  createLearningInspectorTransition,
  createUnitedStatesMemoryTrailInspectorItemView,
  createUnitedStatesMemoryTrailSelectionExplanation
} from "../../src/learning-inspector.js";
import {
  applyUnitedStatesMemoryTrailSessionResults,
  createUnitedStatesMemoryTrailState,
  planUnitedStatesMemoryTrailSession
} from "../../src/united-states-memory-trail-planner.js";

export const SYNTHETIC_LEARNER_PROFILES = Object.freeze([
  { id: "perfect", label: "Perfect learner", description: "Correct on almost every encounter, with a rare deterministic miss." },
  { id: "single-weak-item", label: "Single weak item learner", description: "Always misses Ohio and answers other items correctly." },
  { id: "forgetting", label: "Forgetting learner", description: "Learns initially, returns after 45 days, and misses the first previously seen items on return." },
  { id: "regional-weakness", label: "Regional weakness learner", description: "Strong in the Northeast and persistently weaker in the Midwest." },
  { id: "mixed", label: "Mixed learner", description: "Combines regional differences, occasional errors, and a return gap." },
  { id: "random", label: "Seeded random learner", description: "Answers with a seeded stochastic-looking 55% success rate." }
]);

const defaultStart = "2030-01-15T18:30:00.000Z";
const dayMs = 24 * 60 * 60 * 1000;

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function probabilityAnswer(random, probability) {
  return random() < probability;
}

function answerForProfile({ profileId, item, sessionIndex, encounterIndex, progress, random, returned }) {
  if (profileId === "perfect") return encounterIndex % 29 !== 28;
  if (profileId === "single-weak-item") return item.targetId !== "ohio";
  if (profileId === "forgetting") {
    if (returned && progress?.timesSeen > 0 && encounterIndex % 3 === 0) return false;
    return true;
  }
  if (profileId === "regional-weakness") {
    if (item.censusRegion === "Northeast") return probabilityAnswer(random, 0.96);
    if (item.censusRegion === "Midwest") return probabilityAnswer(random, 0.35);
    return probabilityAnswer(random, 0.86);
  }
  if (profileId === "mixed") {
    let probability = item.censusRegion === "Midwest" ? 0.55 : item.censusRegion === "Northeast" ? 0.9 : 0.76;
    if (item.type === "capital") probability -= 0.08;
    if (returned && progress?.timesSeen > 0) probability -= 0.18;
    return probabilityAnswer(random, probability);
  }
  if (profileId === "random") return probabilityAnswer(random, 0.55);
  throw new Error(`Unknown synthetic learner profile: ${profileId}`);
}

function stateCounts(state) {
  const progress = Object.values(state.itemProgress || {});
  return {
    introduced: state.introducedItemIds?.length || 0,
    mastered: progress.filter((item) => item.status === "mastered").length,
    learningOrReview: progress.filter((item) => ["introduced", "learning", "review"].includes(item.status)).length
  };
}

function buildHealthChecks({ items, state, sessions, encounterCounts, replayEquivalent }) {
  const impossible = Object.entries(state.itemProgress || {}).filter(([, progress]) => (
    progress.timesSeen < 0 || progress.correctCount < 0 || progress.missCount < 0
    || progress.correctCount > progress.timesSeen
  )).map(([itemId]) => itemId);
  const introducedUnseen = (state.introducedItemIds || []).filter((itemId) => !encounterCounts[itemId]);
  const overexposedStrong = Object.entries(encounterCounts).filter(([itemId, count]) => {
    const progress = state.itemProgress?.[itemId];
    return count >= Math.max(6, Math.floor(sessions.length * 0.6))
      && progress?.missCount === 0 && ["review", "mastered"].includes(progress?.status);
  }).map(([itemId, count]) => ({ itemId, encounters: count }));
  const recentIntroduced = sessions.slice(-5).map((session) => session.after.introduced);
  const stalled = items.length > (state.introducedItemIds?.length || 0)
    && recentIntroduced.length === 5 && new Set(recentIntroduced).size === 1;

  return {
    starvation: { status: introducedUnseen.length ? "warning" : "not-observed", introducedButNeverEncountered: introducedUnseen },
    repeatedUnnecessaryExposure: { status: overexposedStrong.length ? "warning" : "not-observed", items: overexposedStrong },
    inabilityToProgress: { status: stalled ? "warning" : "not-observed", finalFiveSessionsIntroduced: recentIntroduced },
    impossibleTransitions: { status: impossible.length ? "warning" : "not-observed", items: impossible },
    deterministicReplay: replayEquivalent === null
      ? { status: "not-run", replayEquivalent: null }
      : { status: replayEquivalent ? "not-observed" : "warning", replayEquivalent },
    scopeNote: "Starvation is measured only for introduced items. Unseen curriculum items may not yet be eligible, and the planners do not expose rejected-alternative eligibility traces."
  };
}

function checkpointIndexes(sessionCount) {
  return [...new Set([0, Math.floor((sessionCount - 1) / 2), sessionCount - 1])].filter((index) => index >= 0);
}

export function runUnitedStatesLearnerSimulation({
  profileId,
  items,
  seed = `us-simulation:${profileId}`,
  sessionCount = 36,
  startTime = defaultStart,
  replayEquivalent = null
}) {
  const profile = SYNTHETIC_LEARNER_PROFILES.find((candidate) => candidate.id === profileId);
  if (!profile) throw new Error(`Unknown synthetic learner profile: ${profileId}`);
  const fixtureSnapshot = JSON.stringify(items);
  const answerRandom = createSeededRandom(`${seed}:answers`);
  let state = createUnitedStatesMemoryTrailState(null, items);
  let correct = 0;
  let incorrect = 0;
  let encounterIndex = 0;
  const sessions = [];
  const transitions = [];
  const selections = [];
  const encounterCounts = {};
  const regionCounts = {};
  const categoryCounts = {};
  const returnSessionIndex = Math.max(2, Math.floor(sessionCount / 2));
  let returnEvidence = null;

  for (let sessionIndex = 0; sessionIndex < sessionCount; sessionIndex += 1) {
    const returned = ["forgetting", "mixed"].includes(profileId) && sessionIndex >= returnSessionIndex;
    const elapsedDays = sessionIndex + (returned ? 45 : 0);
    const nowIso = new Date(new Date(startTime).getTime() + (elapsedDays * dayMs)).toISOString();
    const deterministicContext = { seed: `${seed}:planner:${sessionIndex}`, now: nowIso };
    const options = { seed: deterministicContext.seed, now: () => new Date(nowIso) };
    const beforeState = clone(state);
    const plan = planUnitedStatesMemoryTrailSession(beforeState, items, options);
    const answers = plan.playItems.map((item) => {
      const isCorrect = answerForProfile({
        profileId, item, sessionIndex, encounterIndex,
        progress: beforeState.itemProgress?.[item.id], random: answerRandom, returned
      });
      encounterIndex += 1;
      correct += Number(isCorrect);
      incorrect += Number(!isCorrect);
      encounterCounts[item.id] = (encounterCounts[item.id] || 0) + 1;
      regionCounts[item.censusRegion || "Unavailable"] = (regionCounts[item.censusRegion || "Unavailable"] || 0) + 1;
      categoryCounts[item.category || "Unavailable"] = (categoryCounts[item.category || "Unavailable"] || 0) + 1;
      selections.push(createUnitedStatesMemoryTrailSelectionExplanation({ state: beforeState, plan, item, deterministicContext }));
      return { item, isCorrect };
    });
    const result = {
      taughtTargetIds: plan.newItems.map((item) => item.targetId),
      completedTargetIds: answers.filter((answer) => answer.isCorrect).map((answer) => answer.item.targetId),
      correctCount: answers.filter((answer) => answer.isCorrect).length,
      incorrectCount: answers.filter((answer) => !answer.isCorrect).length,
      missesByTargetId: Object.fromEntries(answers.filter((answer) => !answer.isCorrect).map((answer) => [answer.item.targetId, 1]))
    };
    state = applyUnitedStatesMemoryTrailSessionResults(beforeState, plan, result);
    answers.forEach(({ item, isCorrect }) => {
      const before = createUnitedStatesMemoryTrailInspectorItemView({ item, state: beforeState });
      const after = createUnitedStatesMemoryTrailInspectorItemView({ item, state });
      transitions.push(createLearningInspectorTransition({
        before,
        event: { itemId: item.id, sourceMode: "United States Memory Trail", answer: isCorrect ? "correct" : "incorrect", result: { correct: isCorrect } },
        after
      }));
    });
    if (returned && sessionIndex === returnSessionIndex) {
      returnEvidence = {
        gapDays: 45,
        session: sessionIndex + 1,
        selectedItems: plan.playItems.map((item) => item.id),
        previouslySeenItemsReturning: plan.playItems
          .filter((item) => (beforeState.itemProgress?.[item.id]?.timesSeen || 0) > 0)
          .map((item) => item.id),
        newItems: plan.newItems.map((item) => item.id),
        reviewItems: plan.reviewItems.map((item) => item.id),
        before: stateCounts(beforeState),
        after: stateCounts(state)
      };
    }
    sessions.push({
      session: sessionIndex + 1,
      now: nowIso,
      returnedAfterGap: returned && sessionIndex === returnSessionIndex,
      sessionType: plan.sessionType,
      selected: plan.playItems.map((item) => item.id),
      newCount: plan.newItems.length,
      reviewCount: plan.reviewItems.length,
      correct: result.correctCount,
      incorrect: result.incorrectCount,
      before: stateCounts(beforeState),
      after: stateCounts(state)
    });
  }

  if (JSON.stringify(items) !== fixtureSnapshot) throw new Error(`Simulation mutated the production-derived fixture for ${profileId}.`);
  const selectedCheckpointIndexes = checkpointIndexes(sessions.length);
  const checkpointTransitions = selectedCheckpointIndexes.map((sessionIndex) => {
    const session = sessions[sessionIndex];
    const transitionOffset = sessions.slice(0, sessionIndex)
      .reduce((sum, current) => sum + current.selected.length, 0);
    return {
      session: session.session,
      sessionSummary: session,
      transition: transitions[transitionOffset] || null
    };
  });
  const uniqueItems = Object.keys(encounterCounts).length;
  const output = {
    schemaVersion: 1,
    profile,
    deterministicContext: { seed, startTime, returnGapDays: ["forgetting", "mixed"].includes(profileId) ? 45 : 0 },
    summary: {
      sessionsSimulated: sessions.length,
      itemsEncountered: uniqueItems,
      encounters: correct + incorrect,
      correct,
      incorrect,
      accuracy: correct + incorrect ? Number((correct / (correct + incorrect)).toFixed(4)) : null,
      regionsEncountered: regionCounts,
      taxonomyCategoriesEncountered: categoryCounts,
      finalState: stateCounts(state)
    },
    sessions,
    learningProgression: checkpointTransitions,
    selectionBehavior: {
      newSelections: sessions.reduce((sum, session) => sum + session.newCount, 0),
      reviewSelections: sessions.reduce((sum, session) => sum + session.reviewCount, 0),
      weakItem: profileId === "single-weak-item" ? {
        itemId: "state:ohio",
        encounters: encounterCounts["state:ohio"] || 0,
        finalProgress: state.itemProgress?.["state:ohio"] || null,
        reasonCodes: selections.filter((selection) => selection.itemId.value === "state:ohio").map((selection) => selection.reasonCode.value)
      } : null,
      encounterCounts
    },
    returnEvidence,
    inspector: createLearningInspectorDebugObject({
      selections,
      transitions,
      context: { profileId, seed, startTime }
    }),
    finalState: state
  };
  output.healthChecks = buildHealthChecks({ items, state, sessions, encounterCounts, replayEquivalent });
  return output;
}

export function runDailyTrailReturnProbe({ items, seed = "daily-return-probe", startTime = defaultStart }) {
  const probeItems = clone(items.slice(0, 12));
  const initialIso = startTime;
  const returnIso = new Date(new Date(startTime).getTime() + (45 * dayMs)).toISOString();
  const initialState = createDailyTrailState({
    hasStarted: true,
    pathCompleted: true,
    completedGoalIds: ["world-core"],
    currentSessionNumber: 20,
    introducedItemIds: probeItems.map((item) => item.id),
    itemProgress: Object.fromEntries(probeItems.map((item, index) => [item.id, {
      status: index < 6 ? "mastered" : "review",
      memoryState: "review",
      timesSeen: 4,
      correctCount: 4,
      missCount: 0,
      correctStreak: 3,
      stability: 8,
      difficulty: 4,
      retrievability: 0.9,
      lastSeenSession: 15,
      lastReviewedSession: 15,
      lastReviewedDate: "2030-01-10",
      dueSession: 25,
      dueDate: index < 6 ? "2030-01-14" : "2030-02-15"
    }]))
  }, { now: () => new Date(initialIso) });
  const initialPlan = planCompletedDailyTrailReviewSession(initialState, probeItems, { seed, now: () => new Date(initialIso) });
  const result = {
    completedTargetIds: initialPlan.playItems.map((item) => item.targetId),
    correctCount: initialPlan.playItems.length,
    incorrectCount: 0,
    missesByTargetId: {}
  };
  const afterInitial = applyDailyTrailSessionResults(initialState, initialPlan, result, { now: () => new Date(initialIso) });
  const returnPlan = planCompletedDailyTrailReviewSession(afterInitial, probeItems, { seed: `${seed}:return`, now: () => new Date(returnIso) });
  const returnItem = returnPlan.playItems[0];
  return {
    initialTime: initialIso,
    returnTime: returnIso,
    initialSelected: initialPlan.playItems.map((item) => item.id),
    returnSelected: returnPlan.playItems.map((item) => item.id),
    returnSelectionExplanation: returnItem ? createDailyTrailSelectionExplanation({
      state: afterInitial, plan: returnPlan, item: returnItem, deterministicContext: { seed: `${seed}:return`, now: returnIso }
    }) : null,
    returnItemView: returnItem ? createDailyTrailInspectorItemView({ item: returnItem, state: afterInitial }) : null,
    limitation: "This is an explicit completed-trail review probe over a controlled existing-state fixture, not evidence that U.S. Memory Trail shares Daily Trail scheduling state."
  };
}
