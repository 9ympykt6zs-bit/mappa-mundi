export const unitedStatesMemoryTrailStorageKey = "mappaUnitedStatesMemoryTrailProgress";
export const unitedStatesMemoryTrailId = "united-states-memory-trail";
export const unitedStatesMemoryTrailCurriculumVersion = 1;
export const unitedStatesMemoryTrailJourneyId = "united-states";
export const UNITED_STATES_MEMORY_TRAIL_SOURCE = "united-states-trail";

export const UNITED_STATES_MEMORY_TRAIL_CONFIG = Object.freeze({
  newItemCount: 4,
  minNewItemCount: 3,
  maxNewItemCount: 5,
  weakReviewCount: 1,
  recentReviewCount: 1,
  olderReviewCount: 1,
  cumulativeReviewCount: 10
});

const validStatuses = new Set(["unseen", "introduced", "learning", "review", "mastered"]);
const validMemoryStates = new Set(["new", "learning", "review", "relearning"]);
const practiceEligibleStatuses = new Set(["introduced", "learning", "review", "mastered"]);
const stateActivityIdPattern = /^us-states-\d{2}$/;
const excludedPhaseOneTargetIds = new Set(["district-of-columbia", "washington-dc"]);
const defaultMemoryDifficulty = 5;

export function createUnitedStatesMemoryTrailState(value = {}, items = []) {
  const source = value && typeof value === "object" ? value : {};
  const currentSessionNumber = Math.max(1, Number(source.currentSessionNumber) || 1);
  const itemIdSet = new Set((Array.isArray(items) ? items : []).map((item) => item.id).filter(Boolean));
  const itemProgress = normalizeItemProgress(source.itemProgress, { currentSessionNumber, itemIdSet });
  const introducedItemIds = normalizeStringArray(source.introducedItemIds)
    .filter((itemId) => itemIdSet.size === 0 || itemIdSet.has(itemId));
  const cursor = normalizeCurriculumCursor(source.curriculumCursor, items, itemProgress, introducedItemIds);
  const activeSession = normalizeActiveSession(source.activeSession, items);

  return {
    version: 1,
    trailId: unitedStatesMemoryTrailId,
    curriculumVersion: unitedStatesMemoryTrailCurriculumVersion,
    hasStarted: Boolean(source.hasStarted || introducedItemIds.length > 0 || Object.keys(itemProgress).length > 0 || activeSession),
    currentSessionNumber,
    currentCategory: "states",
    curriculumCursor: cursor,
    introducedItemIds,
    itemProgress,
    activeSession,
    lastSessionSummary: normalizeLastSessionSummary(source.lastSessionSummary)
  };
}

export function loadUnitedStatesMemoryTrailProgress(items = []) {
  try {
    return createUnitedStatesMemoryTrailState(
      JSON.parse(localStorage.getItem(unitedStatesMemoryTrailStorageKey) || "null"),
      items
    );
  } catch {
    return createUnitedStatesMemoryTrailState(null, items);
  }
}

export function saveUnitedStatesMemoryTrailProgress(state, items = []) {
  const normalized = createUnitedStatesMemoryTrailState(state, items);

  try {
    localStorage.setItem(unitedStatesMemoryTrailStorageKey, JSON.stringify(normalized));
  } catch {
    // The trail remains playable in-memory if localStorage is unavailable.
  }

  return normalized;
}

export function hasUnitedStatesMemoryTrailProgress(state = createUnitedStatesMemoryTrailState()) {
  return Boolean(
    state?.hasStarted
    || state?.activeSession
    || Object.keys(state?.itemProgress || {}).length > 0
    || (state?.introducedItemIds || []).length > 0
  );
}

export function resetUnitedStatesMemoryTrailProgress() {
  try {
    localStorage.removeItem(unitedStatesMemoryTrailStorageKey);
  } catch {
    // Ignore storage failures; runtime cleanup happens in the caller.
  }

  return createUnitedStatesMemoryTrailState();
}

export function buildUnitedStatesMemoryTrailItems(journey, activities = []) {
  const steps = getUnitedStatesStateSteps(journey, activities);
  return steps.flatMap((step, sectionIndex) => {
    const activity = activities.find((candidate) => candidate?.id === step.activityId);
    const targets = (activity?.targets || [])
      .filter((target) => isPhaseOneStateTarget(target))
      .filter((target) => !excludedPhaseOneTargetIds.has(target.id));

    return targets.map((target, targetIndex) => ({
      id: `state:${target.id}`,
      targetId: target.id,
      label: target.name,
      type: "state",
      category: "states",
      homeActivityId: activity.id,
      homeJourneyId: journey?.id || unitedStatesMemoryTrailJourneyId,
      homeStepId: step.id || activity.id,
      homeStepIndex: sectionIndex,
      sectionId: activity.id,
      sectionIndex,
      sectionTitle: activity.title || step.title || activity.id,
      activityTitle: activity.title || step.title || activity.id,
      cameraGroupId: activity.map?.region || activity.id,
      order: (sectionIndex * 1000) + targetIndex
    }));
  });
}

export function validateUnitedStatesMemoryTrailCurriculum(items = []) {
  const stateItems = items.filter((item) => item?.type === "state");
  const targetIds = stateItems.map((item) => item.targetId);
  const uniqueTargetIds = [...new Set(targetIds)];
  const duplicateTargetIds = uniqueTargetIds.filter((targetId) => targetIds.filter((candidate) => candidate === targetId).length > 1);
  const sectionIds = [...new Set(stateItems.map((item) => item.homeActivityId).filter(Boolean))];

  return {
    stateCount: stateItems.length,
    uniqueStateCount: uniqueTargetIds.length,
    sectionIds,
    duplicateTargetIds,
    excludedTargetIdsPresent: targetIds.filter((targetId) => excludedPhaseOneTargetIds.has(targetId)),
    isValid: stateItems.length === 50
      && uniqueTargetIds.length === 50
      && duplicateTargetIds.length === 0
      && sectionIds.length === 11
      && !targetIds.some((targetId) => excludedPhaseOneTargetIds.has(targetId))
  };
}

export function planUnitedStatesMemoryTrailSession(state, items = []) {
  const normalized = createUnitedStatesMemoryTrailState(state, items);
  const safeItems = [...items].sort((left, right) => left.order - right.order);
  const unseenItems = safeItems.filter((item) => getItemStatus(normalized, item) === "unseen");

  if (unseenItems.length === 0) {
    return buildUnitedStatesCumulativeReviewPlan(normalized, safeItems);
  }

  return buildUnitedStatesLearningPlan(normalized, safeItems, unseenItems);
}

export function applyUnitedStatesMemoryTrailSessionStart(state, plan) {
  const next = createUnitedStatesMemoryTrailState(state, plan?.allItems || []);
  next.hasStarted = true;
  next.activeSession = {
    sessionId: plan?.sessionId || createSessionId(next.currentSessionNumber),
    plan,
    status: "starting",
    promptSnapshot: null,
    memoryTrailSnapshot: null,
    updatedAt: Date.now()
  };
  return next;
}

export function applyUnitedStatesMemoryTrailSessionSnapshot(state, plan, snapshot = {}) {
  const next = createUnitedStatesMemoryTrailState(state, plan?.allItems || []);
  if (!plan) {
    next.activeSession = null;
    return next;
  }

  next.hasStarted = true;
  next.activeSession = {
    sessionId: snapshot.sessionId || plan.sessionId || createSessionId(next.currentSessionNumber),
    plan,
    status: snapshot.status || "active",
    promptSnapshot: snapshot.promptSnapshot || null,
    memoryTrailSnapshot: snapshot.memoryTrailSnapshot || null,
    updatedAt: Date.now()
  };
  return next;
}

export function applyUnitedStatesMemoryTrailSessionResults(state, plan, result = {}) {
  const next = createUnitedStatesMemoryTrailState(state, plan?.allItems || []);
  const itemsByTargetId = new Map((plan?.playItems || []).map((item) => [item.targetId, item]));
  const completedTargetIds = new Set(result.completedTargetIds || []);
  const taughtTargetIds = new Set(result.taughtTargetIds || []);
  const missesByTargetId = result.missesByTargetId || {};
  const newItemIds = new Set((plan?.newItems || []).map((item) => item.id));
  const practicedItems = [];
  const weakItems = [];

  Object.keys(missesByTargetId).forEach((targetId) => {
    if (!itemsByTargetId.has(targetId)) {
      const fallback = (plan?.allItems || []).find((item) => item.targetId === targetId);
      if (fallback) {
        itemsByTargetId.set(targetId, fallback);
      }
    }
  });

  taughtTargetIds.forEach((targetId) => {
    const item = itemsByTargetId.get(targetId) || (plan?.allItems || []).find((candidate) => candidate.targetId === targetId);
    if (!item) {
      return;
    }
    const progress = getOrCreateItemProgress(next, item);
    progress.status = progress.status === "unseen" ? "introduced" : progress.status;
    progress.memoryState = progress.memoryState === "new" ? "learning" : progress.memoryState;
    progress.introducedSession ||= next.currentSessionNumber;
    next.introducedItemIds = addUnique(next.introducedItemIds, item.id);
  });

  itemsByTargetId.forEach((item, targetId) => {
    const missCount = Math.max(0, Number(missesByTargetId[targetId]) || 0);
    const wasCorrect = completedTargetIds.has(targetId);
    const wasTaught = taughtTargetIds.has(targetId);
    const wasSeen = wasCorrect || missCount > 0 || wasTaught;
    if (!wasSeen) {
      return;
    }

    const progress = getOrCreateItemProgress(next, item);
    if (progress.status === "unseen") {
      progress.status = "introduced";
      progress.memoryState = "learning";
      progress.introducedSession = next.currentSessionNumber;
    }
    next.introducedItemIds = addUnique(next.introducedItemIds, item.id);

    if (wasCorrect || missCount > 0) {
      progress.timesSeen += 1;
      progress.lastSeenSession = next.currentSessionNumber;
      progress.lastReviewedSession = next.currentSessionNumber;

      if (wasCorrect) {
        progress.correctCount += 1;
        progress.correctStreak += 1;
      }

      if (missCount > 0) {
        progress.missCount += missCount;
        progress.correctStreak = 0;
        progress.lapseCount += missCount;
      }

      progress.status = getNextItemStatus(progress, missCount);
      updateSchedulingAfterAttempt(progress, { isCorrect: wasCorrect, missCount }, next);
      practicedItems.push(item);
    }

    if (isWeakProgress(progress) || progress.status === "introduced") {
      weakItems.push(item);
    }
  });

  next.currentSessionNumber += 1;
  next.curriculumCursor = getNextCurriculumCursor(next, plan?.allItems || []);
  next.activeSession = null;
  next.lastSessionSummary = {
    sessionType: plan?.sessionType || "learning-session",
    newCount: (plan?.newItems || []).filter((item) => next.introducedItemIds.includes(item.id)).length,
    reviewCorrectCount: practicedItems.filter((item) => !newItemIds.has(item.id) && completedTargetIds.has(item.targetId)).length,
    weakItems: dedupeItems(weakItems).map((item) => ({ id: item.id, targetId: item.targetId, label: item.label })),
    introducedCount: getIntroducedCount(next, plan?.allItems || []),
    masteredCount: getMasteredCount(next, plan?.allItems || []),
    practicedCount: practicedItems.length,
    correctCount: Math.max(0, Number(result.correctCount) || completedTargetIds.size),
    incorrectCount: Math.max(0, Number(result.incorrectCount) || Object.values(missesByTargetId).reduce((sum, count) => sum + Number(count || 0), 0)),
    allStatesIntroduced: areAllUnitedStatesMemoryTrailItemsIntroduced(next, plan?.allItems || []),
    allStatesMastered: areAllUnitedStatesMemoryTrailItemsMastered(next, plan?.allItems || [])
  };

  return next;
}

export function areAllUnitedStatesMemoryTrailItemsIntroduced(state, items = []) {
  const normalized = createUnitedStatesMemoryTrailState(state, items);
  return items.length > 0 && items.every((item) => getItemStatus(normalized, item) !== "unseen");
}

export function areAllUnitedStatesMemoryTrailItemsMastered(state, items = []) {
  const normalized = createUnitedStatesMemoryTrailState(state, items);
  return items.length > 0 && items.every((item) => getItemStatus(normalized, item) === "mastered");
}

export function isUnitedStatesMemoryTrailItemUnseen(state, item) {
  return getItemStatus(createUnitedStatesMemoryTrailState(state, [item]), item) === "unseen";
}

export function isUnitedStatesMemoryTrailWeakReviewItem(state, item) {
  const progress = createUnitedStatesMemoryTrailState(state, [item]).itemProgress[item?.id];
  return Boolean(progress && isWeakProgress(progress));
}

function getUnitedStatesStateSteps(journey, activities = []) {
  const sourceSteps = Array.isArray(journey?.steps) && journey.steps.length > 0
    ? journey.steps
    : activities.map((activity) => ({ id: activity.id, activityId: activity.id, title: activity.title }));

  return sourceSteps
    .filter((step) => stateActivityIdPattern.test(step?.activityId || ""))
    .filter((step) => activities.some((activity) => activity.id === step.activityId))
    .sort((left, right) => String(left.activityId).localeCompare(String(right.activityId)));
}

function isPhaseOneStateTarget(target) {
  return Boolean(target?.id && target?.kind === "shape" && target?.type === "state");
}

function buildUnitedStatesLearningPlan(state, items, unseenItems) {
  const activeSectionId = getNextSectionIdWithUnseenItems(state, items, unseenItems);
  const playableItems = items.filter((item) => item.homeActivityId === activeSectionId);
  const currentUnseenItems = playableItems.filter((item) => getItemStatus(state, item) === "unseen");
  const newItems = currentUnseenItems.slice(0, chooseNewItemBatchSize(currentUnseenItems.length));
  const excludeIds = new Set(newItems.map((item) => item.id));
  const weakReviewItems = selectWeakReviewItems(state, items, {
    excludeIds,
    limit: UNITED_STATES_MEMORY_TRAIL_CONFIG.weakReviewCount
  });
  weakReviewItems.forEach((item) => excludeIds.add(item.id));

  const oldReviewItems = selectOlderReviewItems(state, items, {
    activeSectionId,
    excludeIds,
    limit: UNITED_STATES_MEMORY_TRAIL_CONFIG.olderReviewCount
  });
  oldReviewItems.forEach((item) => excludeIds.add(item.id));

  const recentReviewItems = oldReviewItems.length > 0 ? [] : selectRecentReviewItems(state, items, {
    excludeIds,
    limit: UNITED_STATES_MEMORY_TRAIL_CONFIG.recentReviewCount
  });
  const reviewItems = dedupeItems([...weakReviewItems, ...oldReviewItems, ...recentReviewItems]);
  const playItems = dedupeItems([...newItems, ...reviewItems]);

  return createPlan({
    state,
    sessionType: "learning-session",
    title: "United States Memory Trail",
    activeActivityId: activeSectionId,
    newItems,
    reviewItems,
    weakReviewItems,
    oldReviewItems,
    recentReviewItems,
    playItems,
    allItems: items
  });
}

function buildUnitedStatesCumulativeReviewPlan(state, items) {
  const reviewItems = selectCumulativeReviewItems(state, items, {
    limit: UNITED_STATES_MEMORY_TRAIL_CONFIG.cumulativeReviewCount
  });
  const activeActivityId = reviewItems[0]?.homeActivityId || items[0]?.homeActivityId || "";

  return createPlan({
    state,
    sessionType: "cumulative-review",
    title: "United States Review",
    activeActivityId,
    newItems: [],
    reviewItems,
    weakReviewItems: selectWeakReviewItems(state, reviewItems, {
      limit: UNITED_STATES_MEMORY_TRAIL_CONFIG.weakReviewCount
    }),
    oldReviewItems: [],
    recentReviewItems: [],
    playItems: reviewItems,
    allItems: items
  });
}

function createPlan({ state, sessionType, title, activeActivityId, newItems, reviewItems, weakReviewItems, oldReviewItems, recentReviewItems, playItems, allItems }) {
  return {
    trailId: unitedStatesMemoryTrailId,
    source: UNITED_STATES_MEMORY_TRAIL_SOURCE,
    sessionId: createSessionId(state.currentSessionNumber),
    sessionType,
    title,
    activeActivityId,
    activeSectionId: activeActivityId,
    currentSessionNumber: state.currentSessionNumber,
    newItems: dedupeItems(newItems),
    reviewItems: dedupeItems(reviewItems),
    weakReviewItems: dedupeItems(weakReviewItems),
    oldReviewItems: dedupeItems(oldReviewItems),
    recentReviewItems: dedupeItems(recentReviewItems),
    playItems: dedupeItems(playItems),
    allItems,
    curriculumCursor: getNextCurriculumCursor(state, allItems),
    allStatesIntroduced: areAllUnitedStatesMemoryTrailItemsIntroduced(state, allItems),
    allStatesMastered: areAllUnitedStatesMemoryTrailItemsMastered(state, allItems)
  };
}

function chooseNewItemBatchSize(unseenCount) {
  if (unseenCount <= 0) {
    return 0;
  }

  if (unseenCount <= 4) {
    return unseenCount;
  }

  if (unseenCount === 5) {
    return 3;
  }

  const preferred = UNITED_STATES_MEMORY_TRAIL_CONFIG.newItemCount;
  const remaining = unseenCount - preferred;
  if (remaining === 1) {
    return preferred + 1;
  }

  return preferred;
}

function getNextSectionIdWithUnseenItems(state, items, unseenItems) {
  const cursorSectionId = state.curriculumCursor?.sectionId || "";
  if (cursorSectionId && items.some((item) => item.homeActivityId === cursorSectionId && getItemStatus(state, item) === "unseen")) {
    return cursorSectionId;
  }

  return unseenItems[0]?.homeActivityId || items[0]?.homeActivityId || "";
}

function selectWeakReviewItems(state, items = [], options = {}) {
  const excludeIds = options.excludeIds || new Set();
  const limit = Math.max(0, Number(options.limit) || 0);
  if (limit <= 0) {
    return [];
  }

  return items
    .filter((item) => !excludeIds.has(item.id))
    .filter((item) => practiceEligibleStatuses.has(getItemStatus(state, item)))
    .filter((item) => isWeakProgress(state.itemProgress[item.id] || {}))
    .sort((left, right) => compareReviewPriority(state, left, right))
    .slice(0, limit);
}

function selectRecentReviewItems(state, items = [], options = {}) {
  const excludeIds = options.excludeIds || new Set();
  const limit = Math.max(0, Number(options.limit) || 0);
  if (limit <= 0) {
    return [];
  }

  return items
    .filter((item) => !excludeIds.has(item.id))
    .filter((item) => practiceEligibleStatuses.has(getItemStatus(state, item)))
    .sort((left, right) => (state.itemProgress[right.id]?.lastSeenSession || 0) - (state.itemProgress[left.id]?.lastSeenSession || 0)
      || left.order - right.order)
    .slice(0, limit);
}

function selectOlderReviewItems(state, items = [], options = {}) {
  const excludeIds = options.excludeIds || new Set();
  const limit = Math.max(0, Number(options.limit) || 0);
  const activeSection = items.find((item) => item.homeActivityId === options.activeSectionId);
  const activeSectionIndex = Number(activeSection?.homeStepIndex);

  if (limit <= 0 || !Number.isFinite(activeSectionIndex)) {
    return [];
  }

  return items
    .filter((item) => !excludeIds.has(item.id))
    .filter((item) => practiceEligibleStatuses.has(getItemStatus(state, item)))
    .filter((item) => Number(item.homeStepIndex) < activeSectionIndex)
    .sort((left, right) => compareReviewPriority(state, left, right))
    .slice(0, limit);
}

function selectCumulativeReviewItems(state, items = [], options = {}) {
  const limit = Math.max(1, Number(options.limit) || UNITED_STATES_MEMORY_TRAIL_CONFIG.cumulativeReviewCount);
  return items
    .filter((item) => practiceEligibleStatuses.has(getItemStatus(state, item)))
    .sort((left, right) => compareReviewPriority(state, left, right))
    .slice(0, limit);
}

function compareReviewPriority(state, left, right) {
  const leftProgress = state.itemProgress[left.id] || {};
  const rightProgress = state.itemProgress[right.id] || {};
  return Number(isWeakProgress(rightProgress)) - Number(isWeakProgress(leftProgress))
    || Number(isReviewDue(state, right)) - Number(isReviewDue(state, left))
    || (rightProgress.missCount || 0) - (leftProgress.missCount || 0)
    || (leftProgress.lastSeenSession || 0) - (rightProgress.lastSeenSession || 0)
    || left.order - right.order;
}

function isReviewDue(state, item) {
  const dueSession = Number(state.itemProgress[item.id]?.dueSession);
  return Number.isFinite(dueSession) && dueSession <= state.currentSessionNumber;
}

function getNextCurriculumCursor(state, items = []) {
  const nextUnseen = items.find((item) => getItemStatus(state, item) === "unseen");
  if (nextUnseen) {
    return {
      sectionId: nextUnseen.homeActivityId,
      sectionIndex: nextUnseen.homeStepIndex,
      itemIndex: nextUnseen.order - (nextUnseen.homeStepIndex * 1000)
    };
  }

  const last = items[items.length - 1] || null;
  return {
    sectionId: last?.homeActivityId || "",
    sectionIndex: Number.isFinite(Number(last?.homeStepIndex)) ? Number(last.homeStepIndex) : 0,
    itemIndex: last ? Math.max(0, last.order - (last.homeStepIndex * 1000)) : 0
  };
}

function normalizeCurriculumCursor(value, items = [], itemProgress = {}, introducedItemIds = []) {
  const state = {
    itemProgress,
    introducedItemIds,
    currentSessionNumber: 1,
    curriculumCursor: null
  };
  const derived = getNextCurriculumCursor(state, items);
  const sectionId = String(value?.sectionId || derived.sectionId || "").trim();

  return {
    sectionId,
    sectionIndex: Math.max(0, Number(value?.sectionIndex ?? derived.sectionIndex) || 0),
    itemIndex: Math.max(0, Number(value?.itemIndex ?? derived.itemIndex) || 0)
  };
}

function normalizeActiveSession(value, items = []) {
  if (!value || typeof value !== "object") {
    return null;
  }

  const itemIdSet = new Set(items.map((item) => item.id));
  const plan = value.plan && typeof value.plan === "object" ? value.plan : null;
  if (!plan || plan.source !== UNITED_STATES_MEMORY_TRAIL_SOURCE) {
    return null;
  }

  const playItems = Array.isArray(plan.playItems) ? plan.playItems : [];
  if (itemIdSet.size > 0 && playItems.some((item) => !itemIdSet.has(item.id))) {
    return null;
  }

  return {
    sessionId: String(value.sessionId || plan.sessionId || "").trim() || createSessionId(Number(plan.currentSessionNumber) || 1),
    plan: {
      ...plan,
      playItems,
      allItems: items.length > 0 ? items : (Array.isArray(plan.allItems) ? plan.allItems : [])
    },
    status: String(value.status || "active"),
    promptSnapshot: value.promptSnapshot && typeof value.promptSnapshot === "object" ? value.promptSnapshot : null,
    memoryTrailSnapshot: value.memoryTrailSnapshot && typeof value.memoryTrailSnapshot === "object" ? value.memoryTrailSnapshot : null,
    updatedAt: Math.max(0, Number(value.updatedAt) || 0)
  };
}

function normalizeLastSessionSummary(summary) {
  if (!summary || typeof summary !== "object") {
    return null;
  }

  return {
    sessionType: String(summary.sessionType || "learning-session"),
    newCount: Math.max(0, Number(summary.newCount) || 0),
    reviewCorrectCount: Math.max(0, Number(summary.reviewCorrectCount) || 0),
    weakItems: Array.isArray(summary.weakItems) ? summary.weakItems.filter(Boolean) : [],
    introducedCount: Math.max(0, Number(summary.introducedCount) || 0),
    masteredCount: Math.max(0, Number(summary.masteredCount) || 0),
    practicedCount: Math.max(0, Number(summary.practicedCount) || 0),
    correctCount: Math.max(0, Number(summary.correctCount) || 0),
    incorrectCount: Math.max(0, Number(summary.incorrectCount) || 0),
    allStatesIntroduced: Boolean(summary.allStatesIntroduced),
    allStatesMastered: Boolean(summary.allStatesMastered)
  };
}

function normalizeItemProgress(value, { currentSessionNumber = 1, itemIdSet = new Set() } = {}) {
  const entries = value && typeof value === "object" ? Object.entries(value) : [];
  return Object.fromEntries(entries
    .filter(([itemId]) => itemId && (itemIdSet.size === 0 || itemIdSet.has(itemId)))
    .map(([itemId, progress]) => {
      const status = validStatuses.has(progress?.status) ? progress.status : "unseen";
      const correctCount = Math.max(0, Number(progress?.correctCount) || 0);
      const missCount = Math.max(0, Number(progress?.missCount) || 0);
      const correctStreak = Math.max(0, Number(progress?.correctStreak) || 0);
      const normalized = {
        status,
        timesSeen: Math.max(0, Number(progress?.timesSeen) || 0),
        correctCount,
        missCount,
        correctStreak,
        lastSeenSession: Math.max(0, Number(progress?.lastSeenSession) || 0),
        introducedSession: Math.max(0, Number(progress?.introducedSession) || 0),
        memoryState: validMemoryStates.has(progress?.memoryState) ? progress.memoryState : getDefaultMemoryState(status, missCount, correctStreak),
        difficulty: clampNumber(progress?.difficulty, 1, 10, defaultMemoryDifficulty),
        stability: Math.max(0, Number(progress?.stability) || 0),
        retrievability: clampNumber(progress?.retrievability, 0, 1, status === "mastered" ? 0.9 : status === "review" ? 0.75 : 0.35),
        dueSession: normalizeOptionalSession(progress?.dueSession),
        lastReviewedSession: Math.max(0, Number(progress?.lastReviewedSession) || 0),
        lapseCount: Math.max(0, Number(progress?.lapseCount) || 0)
      };

      if (normalized.status !== "unseen" && normalized.introducedSession === 0) {
        normalized.introducedSession = currentSessionNumber;
      }

      return [itemId, normalized];
    }));
}

function getOrCreateItemProgress(state, item) {
  if (!state.itemProgress[item.id]) {
    state.itemProgress[item.id] = {
      status: "unseen",
      timesSeen: 0,
      correctCount: 0,
      missCount: 0,
      correctStreak: 0,
      lastSeenSession: 0,
      introducedSession: 0,
      memoryState: "new",
      difficulty: defaultMemoryDifficulty,
      stability: 0,
      retrievability: 0,
      dueSession: null,
      lastReviewedSession: 0,
      lapseCount: 0
    };
  }

  return state.itemProgress[item.id];
}

function getItemStatus(state, item) {
  return state.itemProgress[item.id]?.status
    || (state.introducedItemIds.includes(item.id) ? "introduced" : "unseen");
}

function getNextItemStatus(progress, missCount) {
  if (missCount > 0) {
    return progress.status === "mastered" ? "review" : "learning";
  }

  if (progress.status === "introduced") {
    return "learning";
  }

  if (progress.correctCount >= 7 && progress.correctStreak >= 4 && progress.timesSeen >= 4) {
    return "mastered";
  }

  if (progress.correctCount >= 3 && progress.correctStreak >= 2 && progress.timesSeen >= 2) {
    return "review";
  }

  return "learning";
}

function updateSchedulingAfterAttempt(progress, result, state) {
  const currentSessionNumber = Math.max(1, Number(state.currentSessionNumber) || 1);
  const missCount = Math.max(0, Number(result?.missCount) || 0);
  const isCorrect = Boolean(result?.isCorrect);

  if (missCount > 0) {
    progress.memoryState = "relearning";
    progress.difficulty = clampNumber(progress.difficulty + 0.6, 1, 10, defaultMemoryDifficulty);
    progress.stability = Math.max(0.5, (Number(progress.stability) || 1) * 0.45);
    progress.retrievability = clampNumber((Number(progress.retrievability) || 0.5) * 0.45, 0, 1, 0.25);
    progress.dueSession = currentSessionNumber + 1;
    return;
  }

  if (!isCorrect) {
    return;
  }

  progress.memoryState = progress.status === "review" || progress.status === "mastered" ? "review" : "learning";
  progress.difficulty = clampNumber(progress.difficulty - 0.15, 1, 10, defaultMemoryDifficulty);
  progress.stability = Math.max(1, (Number(progress.stability) || 0) + 1 + Math.min(2, progress.correctStreak * 0.25));
  progress.retrievability = clampNumber((Number(progress.retrievability) || 0.55) + 0.18, 0, 0.97, 0.73);
  progress.dueSession = currentSessionNumber + Math.max(1, Math.round(progress.stability));
}

function isWeakProgress(progress = {}) {
  return (progress.missCount || 0) > 0 && (progress.correctStreak || 0) <= 0
    || progress.memoryState === "relearning"
    || progress.status === "introduced";
}

function getDefaultMemoryState(status, missCount, correctStreak) {
  if (status === "unseen") {
    return "new";
  }

  if (missCount > 0 && correctStreak <= 0) {
    return "relearning";
  }

  return status === "review" || status === "mastered" ? "review" : "learning";
}

function getIntroducedCount(state, items = []) {
  return items.filter((item) => getItemStatus(state, item) !== "unseen").length;
}

function getMasteredCount(state, items = []) {
  return items.filter((item) => getItemStatus(state, item) === "mastered").length;
}

function normalizeStringArray(value) {
  return Array.isArray(value) ? [...new Set(value.map((item) => String(item || "").trim()).filter(Boolean))] : [];
}

function addUnique(items = [], item) {
  return item && !items.includes(item) ? [...items, item] : items;
}

function dedupeItems(items = []) {
  const seen = new Set();
  return items.filter((item) => {
    if (!item?.id || seen.has(item.id)) {
      return false;
    }
    seen.add(item.id);
    return true;
  });
}

function clampNumber(value, min, max, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.min(max, Math.max(min, number)) : fallback;
}

function normalizeOptionalSession(value) {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? Math.floor(number) : null;
}

function createSessionId(sessionNumber) {
  return `us-trail-${Math.max(1, Number(sessionNumber) || 1)}-${Date.now().toString(36)}`;
}
