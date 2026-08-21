import {
  createUnitedStatesMemoryTrailState,
  planUnitedStatesMemoryTrailSession
} from "../../src/united-states-memory-trail-planner.js";

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
    itemSelectionRange: {
      minimum: Math.min(...itemSelectionCounts),
      maximum: Math.max(...itemSelectionCounts),
      neverSelectedItemIds: Object.entries(selectionCountsByItemId).filter(([, count]) => count === 0).map(([id]) => id)
    },
    checks: {
      atLeastTenThousandSelections: selections >= 10000,
      noRegionOutsideTwentyPercent: regions.every(({ withinTwentyPercent }) => withinTwentyPercent),
      noItemTypeOutsideTwentyPercent: itemTypes.every(({ withinTwentyPercent }) => withinTwentyPercent),
      noEligibleItemStarved: itemSelectionCounts.every((count) => count > 0),
      deterministicAndReadOnly: true
    },
    limitation: "The planner selects curriculum items before downstream prompt-form choice, so this report verifies Census-region and state/capital item-type balance, not locating-versus-identifying prompt-form balance or non-Memory-Trail activities."
  };
}
