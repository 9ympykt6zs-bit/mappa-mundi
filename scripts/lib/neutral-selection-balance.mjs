import {
  createUnitedStatesMemoryTrailState,
  planUnitedStatesMemoryTrailSession
} from "../../src/united-states-memory-trail-planner.js";
import { chooseMemoryTrailRetrievalPromptType } from "../../src/memory-trail-prompt-selector.js";

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function increment(counts, key) {
  counts[key] = (counts[key] || 0) + 1;
}

function groupCounts(items, keyFor) {
  const counts = {};
  for (const item of items) increment(counts, keyFor(item));
  return counts;
}

function distribution({ eligibleCounts, selectionCounts, eligibleTotal, selectionTotal }) {
  return Object.keys(eligibleCounts).sort().map((id) => {
    const eligible = eligibleCounts[id];
    const selected = selectionCounts[id] || 0;
    const eligibleShare = eligible / eligibleTotal;
    const selectionShare = selected / selectionTotal;
    const relativeDifference = eligibleShare ? (selectionShare - eligibleShare) / eligibleShare : null;
    return {
      id,
      eligible,
      selected,
      eligibleShare: Number(eligibleShare.toFixed(6)),
      selectionShare: Number(selectionShare.toFixed(6)),
      relativeDifference: Number(relativeDifference.toFixed(6)),
      withinTwentyPercent: Math.abs(relativeDifference) <= 0.2
    };
  });
}

function runPromptObjectiveProfile(items, promptCount, { earlyChunk = false } = {}) {
  const stats = items.map((item) => ({
    targetId: item.id,
    nameToPlaceAttempts: 0,
    nameToPlaceCorrect: 0,
    nameToPlaceIncorrect: 0,
    placeToNameAttempts: 0,
    placeToNameCorrect: 0,
    placeToNameIncorrect: 0
  }));
  const counts = { locating: 0, identifying: 0 };
  let retrievalPromptCount = 0;
  for (let index = 0; index < promptCount; index += 1) {
    const targetStats = stats[index % stats.length];
    const promptType = chooseMemoryTrailRetrievalPromptType({
      isDailyTrail: false,
      retrievalPromptCount,
      introducedStats: stats
    }, targetStats, { earlyChunk });
    if (promptType === "place_to_name") {
      counts.identifying += 1;
      targetStats.placeToNameAttempts += 1;
      targetStats.placeToNameCorrect += 1;
    } else {
      counts.locating += 1;
      targetStats.nameToPlaceAttempts += 1;
      targetStats.nameToPlaceCorrect += 1;
    }
    retrievalPromptCount += 1;
  }
  const intendedShares = earlyChunk ? { locating: 0.7, identifying: 0.3 } : { locating: 0.5, identifying: 0.5 };
  return {
    profile: earlyChunk ? "early-chunk-support" : "ordinary-review",
    prompts: promptCount,
    objectives: Object.keys(counts).map((id) => {
      const selected = counts[id];
      const intendedShare = intendedShares[id];
      const selectionShare = selected / promptCount;
      const relativeDifference = (selectionShare - intendedShare) / intendedShare;
      return {
        id,
        intendedShare,
        selected,
        selectionShare: Number(selectionShare.toFixed(6)),
        relativeDifference: Number(relativeDifference.toFixed(6)),
        withinTwentyPercent: Math.abs(relativeDifference) <= 0.2
      };
    })
  };
}

export function createNeutralUnitedStatesMemoryTrailState(items = []) {
  const currentSessionNumber = 100;
  return createUnitedStatesMemoryTrailState({
    currentSessionNumber,
    introducedItemIds: items.map(({ id }) => id),
    itemProgress: Object.fromEntries(items.map(({ id }) => [id, {
      status: "review",
      timesSeen: 4,
      correctCount: 4,
      missCount: 0,
      correctStreak: 4,
      lastSeenSession: 50,
      introducedSession: 1,
      memoryState: "review",
      difficulty: 5,
      stability: 5,
      retrievability: 0.75,
      dueSession: 99,
      lastReviewedSession: 50,
      lapseCount: 0
    }]))
  }, items);
}

export function runNeutralUnitedStatesSelectionBalance({
  items = [],
  planCount = 1000,
  seedPrefix = "us-neutral-balance-v1",
  now = "2030-04-01T12:00:00.000Z"
} = {}) {
  if (!Array.isArray(items) || items.length === 0) throw new TypeError("Neutral balance requires curriculum items.");
  if (!Number.isInteger(planCount) || planCount < 1) throw new TypeError("planCount must be a positive integer.");
  const itemsSnapshot = JSON.stringify(items);
  const state = createNeutralUnitedStatesMemoryTrailState(items);
  const stateSnapshot = JSON.stringify(state);
  const selectionCountsByItemId = Object.fromEntries(items.map(({ id }) => [id, 0]));
  const regionSelections = {};
  const itemTypeSelections = {};
  let selections = 0;

  for (let planIndex = 0; planIndex < planCount; planIndex += 1) {
    const plan = planUnitedStatesMemoryTrailSession(state, items, {
      seed: `${seedPrefix}:${String(planIndex).padStart(5, "0")}`,
      now: () => new Date(now)
    });
    if (plan.sessionType !== "cumulative-review") throw new Error("Neutral state must produce cumulative review.");
    for (const item of plan.playItems) {
      selections += 1;
      increment(selectionCountsByItemId, item.id);
      increment(regionSelections, item.censusRegion || "Unavailable");
      increment(itemTypeSelections, item.type || "Unavailable");
    }
  }

  if (JSON.stringify(items) !== itemsSnapshot) throw new Error("Neutral balance mutated curriculum items.");
  if (JSON.stringify(state) !== stateSnapshot) throw new Error("Neutral balance mutated learner state.");

  const eligibleRegionCounts = groupCounts(items, (item) => item.censusRegion || "Unavailable");
  const eligibleItemTypeCounts = groupCounts(items, (item) => item.type || "Unavailable");
  const regions = distribution({
    eligibleCounts: eligibleRegionCounts,
    selectionCounts: regionSelections,
    eligibleTotal: items.length,
    selectionTotal: selections
  });
  const itemTypes = distribution({
    eligibleCounts: eligibleItemTypeCounts,
    selectionCounts: itemTypeSelections,
    eligibleTotal: items.length,
    selectionTotal: selections
  });
  const itemSelectionCounts = Object.values(selectionCountsByItemId);
  const promptObjectiveProfiles = [
    runPromptObjectiveProfile(items, selections),
    runPromptObjectiveProfile(items, selections, { earlyChunk: true })
  ];

  return {
    schemaVersion: 1,
    kind: "united-states-neutral-selection-balance",
    deterministicContext: { seedPrefix, now },
    neutralState: {
      itemCount: items.length,
      equivalence: "Every item is introduced with identical review status, counts, scheduling fields, and due state.",
      mutationPolicy: "Each plan is an independent read-only selection opportunity; learner state is held constant."
    },
    planCount,
    selections,
    selectionsPerPlan: selections / planCount,
    regions,
    itemTypes,
    promptObjectiveProfiles,
    itemSelectionRange: {
      minimum: Math.min(...itemSelectionCounts),
      maximum: Math.max(...itemSelectionCounts),
      neverSelectedItemIds: Object.entries(selectionCountsByItemId).filter(([, count]) => count === 0).map(([id]) => id)
    },
    checks: {
      atLeastTenThousandSelections: selections >= 10000,
      noRegionOutsideTwentyPercent: regions.every(({ withinTwentyPercent }) => withinTwentyPercent),
      noItemTypeOutsideTwentyPercent: itemTypes.every(({ withinTwentyPercent }) => withinTwentyPercent),
      noPromptObjectiveOutsideTwentyPercent: promptObjectiveProfiles.every((profile) => profile.objectives.every(({ withinTwentyPercent }) => withinTwentyPercent)),
      noPromptObjectiveStarved: promptObjectiveProfiles.every((profile) => profile.objectives.every(({ selected }) => selected > 0)),
      noEligibleItemStarved: itemSelectionCounts.every((count) => count > 0),
      deterministicAndReadOnly: true
    },
    limitation: "This report verifies U.S. Memory Trail item selection and its production locating-versus-identifying prompt selector. It does not project objective balance across Journey, Mental Map, Connections, reconstruction, or other non-Memory-Trail activities."
  };
}
