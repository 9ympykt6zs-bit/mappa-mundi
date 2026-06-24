export const dailyTrailStorageKey = "mappaDailyTrailProgress";
export const dailyTrailId = "world-core";
export const dailyTrailJourneyId = "world-geography-core";
export const dailyTrailUsCapitalsGoalId = "us-capitals";
export const dailyTrailCheckpointInterval = 4;
export const dailyTrailNewItemCount = 4;
export const dailyTrailReviewItemCount = 10;
export const dailyTrailCheckpointReviewItemCount = 10;
export const dailyTrailCompletedReviewItemCount = 10;
export const dailyTrailGoals = [
  {
    id: dailyTrailId,
    title: "World Core",
    description: "Build a steady foundation across the world map.",
    journeyId: dailyTrailJourneyId,
    activityIds: [
      "continents-oceans",
      "us-states-01", "us-states-02", "us-states-03", "us-states-04", "us-states-05", "us-states-06",
      "us-states-07", "us-states-08", "us-states-09", "us-states-10", "us-states-11",
      "world-core-americas-countries", "world-core-europe-countries", "world-core-africa-countries",
      "world-core-west-central-south-asia-countries", "world-core-east-southeast-asia-oceania-countries"
    ],
    completionPredicate: "world-core-foundation",
    prerequisiteGoalIds: [],
    recommended: true
  },
  {
    id: dailyTrailUsCapitalsGoalId,
    title: "U.S. Capitals",
    description: "Build on the states you know by learning their capital cities.",
    journeyId: "us-capitals",
    activityIds: [
      "us-capitals-01", "us-capitals-02", "us-capitals-03", "us-capitals-04", "us-capitals-05", "us-capitals-06",
      "us-capitals-07", "us-capitals-08", "us-capitals-09", "us-capitals-10", "us-capitals-11"
    ],
    completionPredicate: "all-items-practice-eligible",
    prerequisiteGoalIds: [dailyTrailId]
  }
];

const ENABLE_DAILY_TRAIL_DEBUG = false;
const dailyTrailMinNewItemBatchCount = 3;
const dailyTrailMaxNewItemBatchCount = 6;
const reviewCooldownSessions = 2;
const continentsOceansActivityId = "continents-oceans";
const worldCoreTerminalActivityId = "world-core-east-southeast-asia-oceania-countries";
const continentsOceansStatuses = new Set(["unseen", "weak", "developing", "strong", "mastered"]);
const continentsOceansSmallReviewSessionCooldown = 2;
const continentsOceansFullReviewSessionCooldown = 4;
const continentsOceansFullReviewDayCooldown = 7;
const continentsOceansStrongReviewSessionInterval = 6;
const continentsOceansFoundationBatchSize = 6;
const validStatuses = new Set(["unseen", "introduced", "learning", "review", "mastered"]);
const validMemoryStates = new Set(["new", "learning", "review", "relearning"]);
const practiceEligibleStatuses = new Set(["introduced", "learning", "review", "mastered"]);
const defaultMemoryDifficulty = 5;
const maxMemoryDifficulty = 10;
const minMemoryDifficulty = 1;
const maxRetrievability = 1;
const minRetrievability = 0;

export function createDailyTrailState(value = {}) {
  const source = value && typeof value === "object" ? value : {};
  const activeTrailGoal = getDailyTrailGoal(source.activeTrailGoal).id;
  const completedGoalIds = normalizeCompletedGoalIds(source.completedGoalIds, source.pathCompleted);
  const currentSessionNumber = Math.max(1, Number(source.currentSessionNumber) || 1);
  const sessionsSinceLastCheckpoint = Math.max(0, Number(source.sessionsSinceLastCheckpoint) || 0);
  const lastDailyTrailSessionDate = normalizeLocalDateString(source.lastDailyTrailSessionDate);

  return {
    trailId: dailyTrailId,
    hasStarted: Boolean(source.hasStarted),
    // This remains a compatibility mirror for the active goal. Completed
    // goals are tracked separately so a finished goal can hand off safely.
    pathCompleted: Boolean(source.pathCompleted) || completedGoalIds.includes(activeTrailGoal),
    activeTrailGoal,
    completedGoalIds,
    currentSessionNumber,
    sessionsSinceLastCheckpoint,
    sessionsUntilNextCheckpoint: getSessionsUntilNextCheckpoint(sessionsSinceLastCheckpoint),
    activeGoalJourneyIds: [getDailyTrailGoal(activeTrailGoal).journeyId],
    introducedItemIds: Array.isArray(source.introducedItemIds) ? source.introducedItemIds.filter(Boolean) : [],
    newSinceLastCheckpoint: Array.isArray(source.newSinceLastCheckpoint) ? source.newSinceLastCheckpoint.filter(Boolean) : [],
    lastDailyTrailSessionDate,
    lastContinentsOceansSmallReviewDate: normalizeLocalDateString(source.lastContinentsOceansSmallReviewDate),
    lastContinentsOceansFullReviewDate: normalizeLocalDateString(source.lastContinentsOceansFullReviewDate),
    continentsOceansProgress: normalizeContinentsOceansProgress(source.continentsOceansProgress),
    pendingRemediation: Boolean(source.pendingRemediation),
    pendingCheckpointRetry: Boolean(source.pendingCheckpointRetry),
    lastSessionSummary: source.lastSessionSummary && typeof source.lastSessionSummary === "object"
      ? source.lastSessionSummary
      : null,
    itemProgress: normalizeItemProgress(source.itemProgress, {
      currentSessionNumber,
      lastDailyTrailSessionDate
    })
  };
}

export function loadDailyTrailState() {
  try {
    return createDailyTrailState(JSON.parse(localStorage.getItem(dailyTrailStorageKey) || "null"));
  } catch {
    return createDailyTrailState();
  }
}

export function saveDailyTrailState(state) {
  const normalized = createDailyTrailState(state);

  try {
    localStorage.setItem(dailyTrailStorageKey, JSON.stringify(normalized));
  } catch {
    // Daily Trail remains playable for this session if storage is unavailable.
  }

  return normalized;
}

export function hasDailyTrailProgress(state = loadDailyTrailState()) {
  return Boolean(state?.hasStarted || Object.keys(state?.itemProgress || {}).length > 0);
}

export function getDailyTrailGoal(goalId = dailyTrailId) {
  return dailyTrailGoals.find((goal) => goal.id === goalId) || dailyTrailGoals[0];
}

export function getDailyTrailGoalOptions(state = createDailyTrailState()) {
  const normalized = createDailyTrailState(state);
  return dailyTrailGoals
    .filter((goal) => goal.id === normalized.activeTrailGoal || isDailyTrailGoalEligible(normalized, goal.id))
    .map((goal) => ({ ...goal }));
}

export function isDailyTrailGoalEligible(state, goalId) {
  const normalized = createDailyTrailState(state);
  const goal = getDailyTrailGoal(goalId);
  return (goal.prerequisiteGoalIds || []).every((prerequisiteGoalId) => (
    normalized.completedGoalIds.includes(prerequisiteGoalId)
  ));
}

export function getNextDailyTrailGoal(state) {
  const normalized = createDailyTrailState(state);
  const activeGoalIndex = dailyTrailGoals.findIndex((goal) => goal.id === normalized.activeTrailGoal);
  return dailyTrailGoals
    .slice(activeGoalIndex + 1)
    .find((goal) => !normalized.completedGoalIds.includes(goal.id) && isDailyTrailGoalEligible(normalized, goal.id))
    || null;
}

export function shouldShowDailyTrailGoalChoice() {
  return false;
}

export function selectDailyTrailGoal(state, goalId = dailyTrailId) {
  const normalized = createDailyTrailState(state);
  const goal = getDailyTrailGoal(goalId);

  if (!isDailyTrailGoalEligible(normalized, goal.id)) {
    return normalized;
  }

  return saveDailyTrailState({
    ...normalized,
    activeTrailGoal: goal.id,
    pathCompleted: normalized.completedGoalIds.includes(goal.id),
    activeGoalJourneyIds: [goal.journeyId]
  });
}

export function startNextDailyTrailGoal(state, goalId = getNextDailyTrailGoal(state)?.id) {
  const normalized = createDailyTrailState(state);
  const goal = getDailyTrailGoal(goalId);

  if (!goalId || !isDailyTrailGoalEligible(normalized, goal.id) || normalized.completedGoalIds.includes(goal.id)) {
    return normalized;
  }

  return saveDailyTrailState({
    ...normalized,
    activeTrailGoal: goal.id,
    pathCompleted: false,
    activeGoalJourneyIds: [goal.journeyId],
    sessionsSinceLastCheckpoint: 0,
    sessionsUntilNextCheckpoint: getSessionsUntilNextCheckpoint(0),
    newSinceLastCheckpoint: [],
    pendingRemediation: false,
    pendingCheckpointRetry: false,
    lastSessionSummary: null
  });
}

export function syncCompletedDailyTrailGoals(state, items = []) {
  const normalized = createDailyTrailState(state);
  const activeGoalComplete = isDailyTrailPathComplete(normalized, items);
  const completedGoalIds = activeGoalComplete
    ? addUnique(normalized.completedGoalIds, normalized.activeTrailGoal)
    : normalized.completedGoalIds;

  return createDailyTrailState({
    ...normalized,
    completedGoalIds,
    pathCompleted: completedGoalIds.includes(normalized.activeTrailGoal)
  });
}

export function isDailyTrailPathComplete(state, items = []) {
  const normalized = createDailyTrailState(state);
  const safeItems = Array.isArray(items) ? items.filter(Boolean) : [];

  if (normalized.completedGoalIds.includes(normalized.activeTrailGoal) || normalized.pathCompleted) {
    return true;
  }

  if (safeItems.length === 0 || !safeItems.every((item) => isItemPracticeEligible(normalized, item))) {
    return false;
  }

  const goal = getDailyTrailGoal(normalized.activeTrailGoal);
  if (goal.completionPredicate === "all-items-practice-eligible") {
    return true;
  }

  const continentsOceansItems = getContinentsOceansItems(safeItems);
  const hasWorldCoreTerminalActivity = safeItems.some((item) => item.homeActivityId === worldCoreTerminalActivityId);
  return hasWorldCoreTerminalActivity
    && continentsOceansItems.length > 0
    && isContinentsOceansFoundationComplete(normalized, continentsOceansItems);
}

export function buildWorldCoreDailyTrailItems(journey, activities, options = {}) {
  const sourceSteps = Array.isArray(journey?.steps) ? journey.steps : [];
  const steps = getGoalOrderedSteps(sourceSteps, options.activityIds);
  const goalId = options.goalId || dailyTrailId;

  return steps.flatMap((step, stepIndex) => {
    const activity = activities.find((candidate) => candidate.id === step.activityId);

    if (!activity?.targets?.length) {
      return [];
    }

    const cameraGroupId = activity.map?.region || step.kind || activity.id;

    return activity.targets.map((target, targetIndex) => {
      const type = getDailyTrailItemType(activity, target);

      return {
        id: `${type}:${target.id}`,
        trailGoalId: goalId,
        targetId: target.id,
        label: target.name,
        type,
        homeActivityId: activity.id,
        homeJourneyId: dailyTrailJourneyId,
        homeStepId: step.id,
        homeStepIndex: stepIndex,
        activityTitle: activity.title,
        cameraGroupId,
        order: (stepIndex * 1000) + targetIndex
      };
    });
  });
}

export function buildDailyTrailGoalItems(journey, activities, options = {}) {
  const goalId = options.goalId || dailyTrailId;
  const homeJourneyId = options.homeJourneyId || journey?.id || dailyTrailJourneyId;

  return buildWorldCoreDailyTrailItems(journey, activities, options).map((item) => ({
    ...item,
    id: `${goalId}:${item.id}`,
    homeJourneyId
  }));
}

// Keep the planner's checkpoint markers in one place so the UI handoff cannot
// silently downgrade a checkpoint to an ordinary Memory Trail session.
export function isDailyTrailCheckpointReviewPlan(plan = {}) {
  return Boolean(
    plan && (
      plan.sessionType === "checkpoint"
      || plan.sessionType === "remediationCheckpoint"
      || plan.checkpointMixedReview === true
      || plan.checkpointReview === true
    )
  );
}

export function planDailyTrailSession(state, items) {
  const normalized = createDailyTrailState(state);
  const safeItems = Array.isArray(items) ? items : [];
  const continentsOceansDecision = getContinentsOceansReviewDecision(normalized, safeItems);
  let plan;

  if (isDailyTrailPathComplete(normalized, safeItems)) {
    plan = buildDailyTrailCompletePlan(normalized, safeItems);
  } else if (continentsOceansDecision?.type === "foundation") {
    plan = buildContinentsOceansPlan(normalized, safeItems, continentsOceansDecision);
  } else if (normalized.pendingRemediation) {
    plan = buildRemediationPlan(normalized, safeItems);
  } else if (normalized.pendingCheckpointRetry) {
    plan = buildCheckpointPlan(normalized, safeItems, {
      sessionType: "remediationCheckpoint",
      title: "Quick Check",
      maxItems: 10,
      mixedReview: false
    });
  } else if (normalized.sessionsSinceLastCheckpoint >= dailyTrailCheckpointInterval - 1
    && normalized.hasStarted
    && continentsOceansDecision?.type === "full") {
    plan = buildContinentsOceansPlan(normalized, safeItems, continentsOceansDecision);
  } else if (normalized.sessionsSinceLastCheckpoint >= dailyTrailCheckpointInterval - 1 && normalized.hasStarted) {
    plan = buildCheckpointPlan(normalized, safeItems, {
      sessionType: "checkpoint",
      title: "Checkpoint",
      maxItems: 22
    });
  } else if (continentsOceansDecision) {
    plan = buildContinentsOceansPlan(normalized, safeItems, continentsOceansDecision);
  } else {
    plan = buildLearningPlan(normalized, safeItems);
  }

  logDailyTrailPlan(normalized, safeItems, plan);
  return plan;
}

// A completed trail deliberately has no automatic follow-up session. This
// explicit plan is only used after the learner chooses to review, which keeps
// terminal completion from falling back to an unbounded global review queue.
export function planCompletedDailyTrailReviewSession(state, items) {
  const normalized = createDailyTrailState(state);
  const safeItems = Array.isArray(items) ? items : [];
  const completedItems = safeItems.filter((item) => isItemPracticeEligible(normalized, item));
  const activeActivityId = getReviewActivityId(
    normalized,
    getWeakItems(normalized, completedItems),
    completedItems
  );
  const activityItems = activeActivityId
    ? completedItems.filter((item) => item.homeActivityId === activeActivityId)
    : completedItems;
  const reviewItems = selectDailyTrailReviewItems(normalized, activityItems, {
    limit: dailyTrailCompletedReviewItemCount
  });

  return createPlan({
    state: normalized,
    sessionType: "completed-trail-review",
    title: "Review Completed Trail",
    newItems: [],
    reviewItems,
    playItems: reviewItems,
    allItems: safeItems,
    activeActivityId,
    trailCompleted: true
  });
}

export function planDailyTrailDevSession(state, items, override = {}) {
  const normalized = createDailyTrailState(state);
  const safeItems = Array.isArray(items) ? items : [];
  const itemIds = new Set(
    Array.isArray(override.dailyTrailDevOverrideItemIds)
      ? override.dailyTrailDevOverrideItemIds.filter(Boolean)
      : []
  );
  const mode = override.dailyTrailDevMode === "item" ? "item" : "section";
  const activeActivityId = override.dailyTrailDevOverrideActivityId || "";
  const selectedItems = itemIds.size > 0
    ? safeItems.filter((item) => itemIds.has(item.id))
    : safeItems.filter((item) => item.homeActivityId === activeActivityId);
  const playItems = selectedItems.length > 0
    ? selectedItems
    : activeActivityId
      ? safeItems.filter((item) => item.homeActivityId === activeActivityId)
      : safeItems;
  const firstItem = playItems[0] || null;
  const titleLabel = mode === "item"
    ? firstItem?.label || "Item"
    : firstItem?.activityTitle || "Section";

  return createPlan({
    state: normalized,
    sessionType: mode === "item" ? "daily-trail-dev-item" : "daily-trail-dev-section",
    title: mode === "item" ? `Daily Trail Test: ${titleLabel}` : `Daily Trail Dev: ${titleLabel}`,
    newItems: playItems,
    reviewItems: playItems,
    playItems,
    allItems: safeItems,
    activeActivityId: activeActivityId || firstItem?.homeActivityId || "",
    trailGoalId: override.dailyTrailDevOverrideGoalId || normalized.activeTrailGoal,
    devOverride: {
      mode,
      goalId: override.dailyTrailDevOverrideGoalId || normalized.activeTrailGoal,
      activityId: activeActivityId || firstItem?.homeActivityId || "",
      itemIds: Array.from(itemIds)
    }
  });
}

export function applyDailyTrailSessionStart(state, plan) {
  const next = createDailyTrailState({
    ...state,
    hasStarted: true
  });

  return saveDailyTrailState(next);
}

export function applyDailyTrailTeachingProgress(state, plan, taughtTargetId) {
  const next = createDailyTrailState(state);
  const taughtItem = (plan?.newItems || []).find((item) => item.targetId === taughtTargetId);

  if (taughtItem) {
    markDailyTrailItemIntroduced(next, taughtItem);
  }

  return saveDailyTrailState(next);
}

function markDailyTrailItemIntroduced(state, item) {
  const progress = getOrCreateItemProgress(state, item);

  if (progress.status === "unseen") {
    progress.status = "introduced";
    progress.introducedSession = state.currentSessionNumber;
    progress.memoryState = "learning";
    progress.stability = Math.max(0.5, Number(progress.stability) || 0);
    progress.retrievability = Math.max(0.35, Number(progress.retrievability) || 0);
    progress.dueSession = state.currentSessionNumber;
    progress.dueDate = getLocalDateString();
    state.introducedItemIds = addUnique(state.introducedItemIds, item.id);
    state.newSinceLastCheckpoint = addUnique(state.newSinceLastCheckpoint, item.id);
  }

  if (isContinentsOceansItem(item)) {
    state.continentsOceansProgress.introducedItemIds = addUnique(state.continentsOceansProgress.introducedItemIds, item.id);
  }
}

export function applyDailyTrailSessionResults(state, plan, result = {}) {
  const next = createDailyTrailState(state);
  const itemsByTargetId = new Map((plan?.playItems || []).map((item) => [item.targetId, item]));
  const completedTargetIds = new Set(result.completedTargetIds || []);
  const missesByTargetId = result.missesByTargetId || {};
  const practicedItems = [];
  const weakItems = [];
  const completedDate = getLocalDateString();

  completedTargetIds.forEach((targetId) => {
    if (!itemsByTargetId.has(targetId)) {
      const fallback = (plan?.allItems || []).find((item) => item.targetId === targetId);
      if (fallback) {
        itemsByTargetId.set(targetId, fallback);
      }
    }
  });

  Object.keys(missesByTargetId).forEach((targetId) => {
    if (!itemsByTargetId.has(targetId)) {
      const fallback = (plan?.allItems || []).find((item) => item.targetId === targetId);
      if (fallback) {
        itemsByTargetId.set(targetId, fallback);
      }
    }
  });

  itemsByTargetId.forEach((item, targetId) => {
    const progress = getOrCreateItemProgress(next, item);
    const missCount = Number(missesByTargetId[targetId]) || 0;
    const wasSeen = completedTargetIds.has(targetId) || missCount > 0;

    if (!wasSeen) {
      return;
    }

    progress.timesSeen += 1;
    progress.lastSeenSession = next.currentSessionNumber;

    if (completedTargetIds.has(targetId)) {
      progress.correctCount += 1;
      progress.correctStreak += 1;
    }

    if (missCount > 0) {
      progress.missCount += missCount;
      progress.correctStreak = 0;
    }

    progress.status = getNextItemStatus(progress, missCount);
    updateMemorySchedulingAfterAttempt(progress, {
      isCorrect: completedTargetIds.has(targetId),
      missCount
    }, next, completedDate);
    practicedItems.push(item);

    if (isCurrentlyWeakProgress(progress) || progress.status === "introduced") {
      weakItems.push(item);
    }
  });

  const isCheckpoint = plan?.sessionType === "checkpoint" || plan?.sessionType === "remediationCheckpoint";
  const totalMisses = Number.isFinite(result.incorrectCount)
    ? Math.max(0, Number(result.incorrectCount))
    : Object.values(missesByTargetId).reduce((sum, count) => sum + Number(count || 0), 0);
  const totalCorrect = Number.isFinite(result.correctCount)
    ? Math.max(0, Number(result.correctCount))
    : completedTargetIds.size;
  const totalAttempts = Math.max(1, totalCorrect + totalMisses);
  const accuracy = Math.max(0, totalCorrect / totalAttempts);
  const newMissLimitPassed = (plan?.newItems || []).every((item) => (missesByTargetId[item.targetId] || 0) <= 1);
  const passedCheckpoint = !isCheckpoint || (accuracy >= 0.85 && newMissLimitPassed);
  updateContinentsOceansProgress(next, plan, practicedItems, missesByTargetId, completedDate);

  const trailCompleted = isDailyTrailPathComplete(next, plan?.allItems || []);
  if (trailCompleted) {
    next.pathCompleted = true;
    next.completedGoalIds = addUnique(next.completedGoalIds, plan?.trailGoalId || next.activeTrailGoal);
  }

  next.currentSessionNumber += 1;
  next.lastDailyTrailSessionDate = completedDate;

  if (isCheckpoint) {
    if (passedCheckpoint) {
      next.sessionsSinceLastCheckpoint = 0;
      next.newSinceLastCheckpoint = [];
      next.pendingRemediation = false;
      next.pendingCheckpointRetry = false;
    } else {
      next.pendingRemediation = true;
      next.pendingCheckpointRetry = false;
    }
  } else if (plan?.sessionType === "remediation-session") {
    next.pendingRemediation = false;
    next.pendingCheckpointRetry = true;
  } else {
    next.sessionsSinceLastCheckpoint += 1;
  }

  next.sessionsUntilNextCheckpoint = getSessionsUntilNextCheckpoint(next.sessionsSinceLastCheckpoint);
  next.lastSessionSummary = {
    sessionType: plan?.sessionType || "learning-session",
    practicedCount: practicedItems.length,
    newCount: (plan?.newItems || []).length,
    reviewCount: Math.max(0, practicedItems.length - (plan?.newItems || []).length),
    weakItems: dedupeItems(weakItems).map((item) => ({ id: item.id, label: item.label })),
    sessionsUntilNextCheckpoint: next.sessionsUntilNextCheckpoint,
    checkpointPassed: isCheckpoint ? passedCheckpoint : null,
    trailCompleted
  };

  return saveDailyTrailState(next);
}

function buildLearningPlan(state, items) {
  const availableItems = getNormalDailyTrailItems(state, items);
  const initialActivityId = getNextLearningActivityId(state, availableItems);
  const initialPlayableItems = initialActivityId
    ? availableItems.filter((item) => item.homeActivityId === initialActivityId)
    : availableItems;
  const batchSelection = selectDailyTrailNewItemBatch(state, {
    activeActivityId: initialActivityId,
    playableItems: initialPlayableItems,
    availableItems
  });
  const activeActivityId = batchSelection.activeActivityId || initialActivityId;
  const playableItems = batchSelection.playableItems || initialPlayableItems;
  const newItems = batchSelection.newItems;
  const newItemIds = new Set(newItems.map((item) => item.id));
  const reviewItems = selectDailyTrailReviewItems(state, playableItems, {
    excludeIds: newItemIds,
    limit: dailyTrailReviewItemCount,
    requireDue: newItems.length > 0
  });
  const playItems = dedupeItems([
    ...newItems,
    ...reviewItems
  ]);

  return createPlan({
    state,
    sessionType: "learning-session",
    title: "Daily Trail",
    newItems,
    reviewItems,
    playItems,
    allItems: items,
    activeActivityId
  });
}

function selectDailyTrailNewItemBatch(state, { activeActivityId = "", playableItems = [], availableItems = [] } = {}) {
  const currentUnseenItems = playableItems.filter((item) => isItemUnseenForDailyTrail(state, item));
  const currentBatch = chooseDailyTrailNewItemBatchSize(currentUnseenItems.length);

  if (currentBatch.count > 0 && currentBatch.count !== 1) {
    return {
      activeActivityId,
      playableItems,
      newItems: currentUnseenItems.slice(0, currentBatch.count)
    };
  }

  if (currentUnseenItems.length === 0) {
    return {
      activeActivityId,
      playableItems,
      newItems: []
    };
  }

  if (currentUnseenItems.length === 1) {
    const carryForwardBatch = findCarryForwardNewItemBatch(state, {
      activeActivityId,
      availableItems
    });
    if (carryForwardBatch) {
      return carryForwardBatch;
    }
  }

  return {
    activeActivityId,
    playableItems,
    newItems: currentUnseenItems.slice(0, currentUnseenItems.length)
  };
}

function chooseDailyTrailNewItemBatchSize(unseenCount) {
  if (unseenCount <= 0) {
    return { count: 0 };
  }

  if (unseenCount <= dailyTrailMaxNewItemBatchCount) {
    return { count: unseenCount };
  }

  const preferredCount = Math.min(dailyTrailNewItemCount, dailyTrailMaxNewItemBatchCount);
  const remainingAfterPreferred = unseenCount - preferredCount;
  if (remainingAfterPreferred === 1 && preferredCount < dailyTrailMaxNewItemBatchCount) {
    return { count: preferredCount + 1 };
  }

  if (remainingAfterPreferred > 0 && remainingAfterPreferred < dailyTrailMinNewItemBatchCount) {
    return { count: Math.max(dailyTrailMinNewItemBatchCount, preferredCount - (dailyTrailMinNewItemBatchCount - remainingAfterPreferred)) };
  }

  return { count: preferredCount };
}

function findCarryForwardNewItemBatch(state, { activeActivityId = "", availableItems = [] } = {}) {
  const candidateActivities = groupUnseenItemsByActivity(state, availableItems)
    .filter((group) => group.homeActivityId !== activeActivityId)
    .sort((left, right) => left.earliestOrder - right.earliestOrder);
  const candidate = candidateActivities.find((group) => group.items.length >= dailyTrailMinNewItemBatchCount)
    || candidateActivities.find((group) => group.items.length >= 2);

  if (!candidate) {
    return null;
  }

  return {
    activeActivityId: candidate.homeActivityId,
    playableItems: availableItems.filter((item) => item.homeActivityId === candidate.homeActivityId),
    newItems: candidate.items.slice(0, chooseDailyTrailNewItemBatchSize(candidate.items.length).count)
  };
}

function groupUnseenItemsByActivity(state, items = []) {
  const groups = new Map();
  items
    .filter((item) => isItemUnseenForDailyTrail(state, item))
    .forEach((item) => {
      const current = groups.get(item.homeActivityId) || {
        homeActivityId: item.homeActivityId,
        items: [],
        earliestOrder: item.order
      };
      current.items.push(item);
      current.earliestOrder = Math.min(current.earliestOrder, item.order);
      groups.set(item.homeActivityId, current);
    });

  return Array.from(groups.values());
}

function buildRemediationPlan(state, items) {
  const availableItems = getNormalDailyTrailItems(state, items);
  const activeActivityId = getReviewActivityId(state, getWeakItems(state, availableItems), availableItems);
  const playableItems = activeActivityId
    ? availableItems.filter((item) => item.homeActivityId === activeActivityId)
    : availableItems;
  const weakItems = getWeakItems(state, playableItems).slice(0, 10);
  const fallbackLearning = playableItems.filter((item) => ["introduced", "learning"].includes(getItemStatus(state, item))).slice(0, 8);
  const playItems = dedupeItems([...weakItems, ...fallbackLearning]).slice(0, 10);

  return createPlan({
    state,
    sessionType: "remediation-session",
    title: "Daily Trail Review",
    newItems: [],
    reviewItems: playItems,
    playItems,
    allItems: items,
    activeActivityId
  });
}

function buildCheckpointPlan(state, items, options = {}) {
  const availableItems = getNormalDailyTrailItems(state, items);
  const newSinceCheckpoint = state.newSinceLastCheckpoint
    .map((id) => availableItems.find((item) => item.id === id))
    .filter((item) => item && isItemPracticeEligible(state, item));
  const mixedReview = options.mixedReview !== false;
  const maxItems = Math.min(
    Math.max(1, Number(options.maxItems) || dailyTrailCheckpointReviewItemCount),
    dailyTrailCheckpointReviewItemCount
  );
  const playItems = mixedReview
    ? selectMixedCheckpointReviewItems(state, availableItems, {
      recentItems: newSinceCheckpoint,
      limit: maxItems
    })
    : selectSingleActivityCheckpointReviewItems(state, availableItems, newSinceCheckpoint, maxItems);
  const activeActivityId = playItems[0]?.homeActivityId || "";

  return createPlan({
    state,
    sessionType: options.sessionType || "checkpoint",
    title: options.title || "Checkpoint",
    newItems: [],
    reviewItems: playItems,
    playItems,
    allItems: items,
    activeActivityId,
    checkpointMixedReview: mixedReview
  });
}

function getGoalOrderedSteps(steps, activityIds = []) {
  if (!Array.isArray(activityIds) || activityIds.length === 0) {
    return steps;
  }

  return activityIds
    .map((activityId) => steps.find((step) => step.activityId === activityId))
    .filter(Boolean);
}

function buildDailyTrailCompletePlan(state, items) {
  return createPlan({
    state,
    sessionType: "complete",
    title: "Daily Trail Finished",
    newItems: [],
    reviewItems: [],
    playItems: [],
    allItems: items,
    activeActivityId: "",
    trailCompleted: true
  });
}

function selectSingleActivityCheckpointReviewItems(state, availableItems, recentItems, limit) {
  const recentIds = new Set(recentItems.map((item) => item.id));
  const weakRecentItems = getWeakItems(state, recentItems);
  const activeActivityId = getCheckpointActivityId(state, recentItems, weakRecentItems, availableItems);
  const sameActivityItems = activeActivityId
    ? availableItems.filter((item) => item.homeActivityId === activeActivityId)
    : availableItems;
  const olderReviewItems = selectDailyTrailReviewItems(state, sameActivityItems, {
    excludeIds: recentIds,
    limit: Math.max(2, Math.min(6, Math.floor(limit * 0.6)))
  });

  return dedupeItems([
    ...recentItems.filter((item) => item.homeActivityId === activeActivityId),
    ...weakRecentItems.filter((item) => item.homeActivityId === activeActivityId),
    ...olderReviewItems
  ]).slice(0, limit);
}

function selectMixedCheckpointReviewItems(state, availableItems, options = {}) {
  const limit = Math.max(0, Number(options.limit) || dailyTrailCheckpointReviewItemCount);
  const recentIds = new Set((options.recentItems || []).map((item) => item.id));
  const eligibleItems = dedupeCheckpointItemsByCanonicalTargetId(
    availableItems.filter((item) => isItemPracticeEligible(state, item))
  );

  if (limit <= 0 || eligibleItems.length === 0) {
    return [];
  }

  const groups = new Map();
  eligibleItems.forEach((item) => {
    const activityId = item.homeActivityId || "world";
    const group = groups.get(activityId) || {
      homeActivityId: activityId,
      earliestOrder: item.order,
      items: []
    };
    group.earliestOrder = Math.min(group.earliestOrder, item.order);
    group.items.push(item);
    groups.set(activityId, group);
  });

  const checkpointGroups = Array.from(groups.values())
    .map((group) => ({
      ...group,
      recentCount: group.items.filter((item) => recentIds.has(item.id)).length,
      dueCount: group.items.filter((item) => isReviewItemDue(state, item)).length,
      weakCount: group.items.filter((item) => isCurrentlyWeakProgress(state.itemProgress[item.id] || {})).length,
      items: sortCheckpointItems(state, group.items, recentIds)
    }))
    .sort((left, right) => (
      right.recentCount - left.recentCount
      || right.weakCount - left.weakCount
      || right.dueCount - left.dueCount
      || left.earliestOrder - right.earliestOrder
    ));
  const maxPerActivity = checkpointGroups.length >= 3
    ? Math.max(2, Math.ceil(limit / checkpointGroups.length))
    : limit;
  const selected = [];
  const selectedCounts = new Map();

  while (selected.length < limit) {
    let selectedInRound = false;

    for (const group of checkpointGroups) {
      const selectedCount = selectedCounts.get(group.homeActivityId) || 0;
      const item = selectedCount < maxPerActivity ? group.items.shift() : null;
      if (!item) {
        continue;
      }

      selected.push(item);
      selectedCounts.set(group.homeActivityId, selectedCount + 1);
      selectedInRound = true;
      if (selected.length >= limit) {
        break;
      }
    }

    if (!selectedInRound) {
      break;
    }
  }

  return dedupeCheckpointItemsByCanonicalTargetId(selected);
}

function getCheckpointCanonicalTargetId(item) {
  const targetId = String(item?.targetId || item?.id || "").trim();
  const targetType = String(item?.type || item?.homeActivityId || "target").trim();
  return `${targetType}:${targetId}`;
}

function dedupeCheckpointItemsByCanonicalTargetId(items = []) {
  const byCanonicalTargetId = new Map();
  items.filter(Boolean).forEach((item) => {
    const canonicalTargetId = getCheckpointCanonicalTargetId(item);
    if (!canonicalTargetId || !byCanonicalTargetId.has(canonicalTargetId)) {
      byCanonicalTargetId.set(canonicalTargetId, item);
    }
  });
  return Array.from(byCanonicalTargetId.values());
}

function sortCheckpointItems(state, items, recentIds) {
  return [...items].sort((left, right) => {
    const leftPriority = getReviewPriority(state, left);
    const rightPriority = getReviewPriority(state, right);
    const leftRecent = recentIds.has(left.id) ? 1 : 0;
    const rightRecent = recentIds.has(right.id) ? 1 : 0;

    return rightPriority.isRelearning - leftPriority.isRelearning
      || rightPriority.isWeak - leftPriority.isWeak
      || rightPriority.isDue - leftPriority.isDue
      || rightRecent - leftRecent
      || rightPriority.overdueScore - leftPriority.overdueScore
      || leftPriority.retrievability - rightPriority.retrievability
      || getRotatingOrder(left, state.currentSessionNumber) - getRotatingOrder(right, state.currentSessionNumber);
  });
}

function buildContinentsOceansPlan(state, items, decision) {
  const continentsOceansItems = getContinentsOceansItems(items);
  const isFoundation = decision.type === "foundation";
  const playItems = isFoundation
    ? getNextContinentsOceansFoundationBatch(state, continentsOceansItems)
    : decision.items?.length ? decision.items : continentsOceansItems;

  return createPlan({
    state,
    sessionType: isFoundation ? "learning-session" : "continents-oceans-review",
    title: isFoundation ? "Daily Trail" : "Continents and Oceans Review",
    newItems: isFoundation ? playItems : [],
    reviewItems: isFoundation ? [] : playItems,
    playItems,
    allItems: items,
    activeActivityId: continentsOceansActivityId,
    continentsOceansReviewType: decision.type
  });
}

function createPlan({
  state,
  sessionType,
  title,
  newItems,
  reviewItems,
  playItems,
  allItems,
  activeActivityId,
  continentsOceansReviewType = null,
  checkpointMixedReview = false,
  trailCompleted = false,
  trailGoalId = state?.activeTrailGoal || dailyTrailId,
  devOverride = null
}) {
  const originalReviewItems = Array.isArray(reviewItems) ? reviewItems : [];
  const originalPlayItems = Array.isArray(playItems) ? playItems : [];
  const defensiveNewItems = dedupeItems([
    ...(Array.isArray(newItems) ? newItems : []),
    ...originalPlayItems.filter((item) => isItemUnseenForDailyTrail(state, item))
  ].filter((item) => isItemUnseenForDailyTrail(state, item)));
  const defensiveReviewItems = dedupeItems(originalReviewItems.filter((item) => isItemPracticeEligible(state, item)));
  const defensivePracticeItems = originalPlayItems.filter((item) => isItemPracticeEligible(state, item));
  const defensivePlayItems = dedupeItems([
    ...defensiveNewItems,
    ...defensivePracticeItems
  ]);
  warnIfUnseenPracticeItems(state, {
    sessionType,
    reviewItems: originalReviewItems,
    playItems: originalPlayItems,
    defensiveNewItems
  });

  const groupedItems = groupItemsByCamera(defensivePlayItems);
  const firstGroup = activeActivityId
    ? groupedItems.find((group) => group.homeActivityId === activeActivityId) || groupedItems[0] || null
    : groupedItems[0] || null;
  const resolvedActivityId = activeActivityId || firstGroup?.items?.[0]?.homeActivityId || defensivePlayItems[0]?.homeActivityId || allItems[0]?.homeActivityId || "";

  return {
    sessionType,
    title,
    trailGoalId,
    activeActivityId: resolvedActivityId,
    activeCameraGroupId: firstGroup?.cameraGroupId || "",
    newItems: defensiveNewItems,
    reviewItems: defensiveReviewItems,
    playItems: defensivePlayItems,
    allItems,
    continentsOceansReviewType,
    checkpointMixedReview,
    trailCompleted,
    devOverride,
    cameraGroups: groupedItems,
    activityGroups: groupItemsByActivity(defensivePlayItems),
    intro: {
      newCount: defensiveNewItems.length,
      reviewCount: defensiveReviewItems.length,
      sessionsUntilNextCheckpoint: state.sessionsUntilNextCheckpoint
    },
    steps: [
      { type: "review", items: defensiveReviewItems.slice(0, Math.ceil(defensiveReviewItems.length * 0.25)) },
      { type: "study-new", items: defensiveNewItems },
      { type: "guided-practice", items: dedupeItems([...defensiveNewItems, ...defensiveReviewItems]).slice(0, Math.max(4, defensiveNewItems.length + 2)) },
      { type: "mixed-practice", items: defensivePlayItems }
    ]
  };
}

function getNextLearningActivityId(state, items) {
  const nextUnseen = items.find((item) => getItemStatus(state, item) === "unseen");

  if (nextUnseen) {
    return nextUnseen.homeActivityId;
  }

  return getReviewActivityId(state, getWeakItems(state, items), items);
}

function getReviewActivityId(state, candidateItems, allItems) {
  const candidates = candidateItems.length > 0
    ? candidateItems
    : allItems.filter((item) => isItemPracticeEligible(state, item));

  if (candidates.length === 0) {
    return allItems[0]?.homeActivityId || "";
  }

  const groups = new Map();
  candidates.forEach((item) => {
    const current = groups.get(item.homeActivityId) || {
      homeActivityId: item.homeActivityId,
      count: 0,
      latestSeen: 0,
      weakestMissCount: 0,
      earliestOrder: item.order
    };
    const progress = state.itemProgress[item.id] || {};
    current.count += 1;
    current.latestSeen = Math.max(current.latestSeen, progress.lastSeenSession || 0);
    current.weakestMissCount = Math.max(current.weakestMissCount, progress.missCount || 0);
    current.earliestOrder = Math.min(current.earliestOrder, item.order);
    groups.set(item.homeActivityId, current);
  });

  return Array.from(groups.values())
    .sort((left, right) => (
      right.weakestMissCount - left.weakestMissCount
      || left.latestSeen - right.latestSeen
      || right.count - left.count
      || left.earliestOrder - right.earliestOrder
    ))[0]?.homeActivityId || "";
}

function getCheckpointActivityId(state, recentItems, weakItems, allItems) {
  const candidates = recentItems.length > 0
    ? recentItems
    : weakItems.length > 0
      ? weakItems
      : allItems.filter((item) => isItemPracticeEligible(state, item));

  return candidates[0]?.homeActivityId || allItems[0]?.homeActivityId || "";
}

function selectDailyTrailReviewItems(state, items, options = {}) {
  const excludeIds = options.excludeIds || new Set();
  const limit = Math.max(0, Number(options.limit) || dailyTrailReviewItemCount);
  const eligibleItems = items
    .filter((item) => !excludeIds.has(item.id))
    .filter((item) => isItemPracticeEligible(state, item));

  if (limit <= 0 || eligibleItems.length === 0) {
    return [];
  }

  const dueItems = eligibleItems.filter((item) => isReviewItemDue(state, item));
  if (options.requireDue && dueItems.length === 0) {
    return [];
  }

  const selectionPool = dueItems.length > 0 ? dueItems : eligibleItems;
  const weakItems = selectionPool.filter((item) => {
    const progress = state.itemProgress[item.id] || {};
    return isCurrentlyWeakProgress(progress)
      || progress.status === "introduced"
      || (progress.status === "learning" && (progress.correctStreak || 0) <= 0);
  });
  const olderItems = selectionPool.filter((item) => !weakItems.includes(item));
  const weakLimit = Math.min(weakItems.length, Math.ceil(limit * 0.45));
  const olderLimit = Math.max(0, limit - weakLimit);

  return dedupeItems([
    ...sortItemsForReviewVariety(state, weakItems).slice(0, weakLimit),
    ...sortItemsForReviewVariety(state, olderItems).slice(0, olderLimit)
  ]).slice(0, limit);
}

function isReviewItemDue(state, item) {
  return isDailyTrailItemDue(state, item);
}

function sortItemsForReviewVariety(state, items) {
  return [...items].sort((left, right) => {
    const leftProgress = state.itemProgress[left.id] || {};
    const rightProgress = state.itemProgress[right.id] || {};
    const leftPriority = getReviewPriority(state, left);
    const rightPriority = getReviewPriority(state, right);
    return rightPriority.isDue - leftPriority.isDue
      || rightPriority.overdueScore - leftPriority.overdueScore
      || rightPriority.isRelearning - leftPriority.isRelearning
      || rightPriority.isWeak - leftPriority.isWeak
      || leftPriority.retrievability - rightPriority.retrievability
      || (leftProgress.lastReviewedSession || leftProgress.lastSeenSession || 0) - (rightProgress.lastReviewedSession || rightProgress.lastSeenSession || 0)
      || (rightProgress.missCount || 0) - (leftProgress.missCount || 0)
      || (leftProgress.timesSeen || 0) - (rightProgress.timesSeen || 0)
      || getRotatingOrder(left, state.currentSessionNumber) - getRotatingOrder(right, state.currentSessionNumber);
  });
}

function isDailyTrailItemDue(state, item) {
  if (!isItemPracticeEligible(state, item)) {
    return false;
  }

  const progress = state.itemProgress[item.id] || {};
  if (isCurrentlyWeakProgress(progress) || progress.status === "introduced" || progress.memoryState === "relearning") {
    return true;
  }

  if (progress.status === "learning" && (progress.correctStreak || 0) <= 0) {
    return true;
  }

  const currentSessionNumber = Math.max(1, Number(state.currentSessionNumber) || 1);
  const sessionDue = Number.isFinite(Number(progress.dueSession)) && Number(progress.dueSession) <= currentSessionNumber;
  const dateDue = Boolean(progress.dueDate) && getDateGapInDays(progress.dueDate, getLocalDateString()) >= 0;

  if (sessionDue || dateDue) {
    return true;
  }

  if (!Number.isFinite(Number(progress.dueSession)) && !progress.dueDate) {
    return getSessionGap(currentSessionNumber, progress.lastSeenSession || 0) >= reviewCooldownSessions;
  }

  return false;
}

function getReviewPriority(state, item) {
  const progress = state.itemProgress[item.id] || {};
  const currentSessionNumber = Math.max(1, Number(state.currentSessionNumber) || 1);
  const dueSession = Number.isFinite(Number(progress.dueSession)) ? Number(progress.dueSession) : null;
  const sessionOverdue = dueSession === null ? 0 : Math.max(0, currentSessionNumber - dueSession);
  const dateOverdue = progress.dueDate ? Math.max(0, getDateGapInDays(progress.dueDate, getLocalDateString())) : 0;

  return {
    isDue: isDailyTrailItemDue(state, item) ? 1 : 0,
    overdueScore: sessionOverdue + dateOverdue,
    isRelearning: progress.memoryState === "relearning" ? 1 : 0,
    isWeak: isCurrentlyWeakProgress(progress) ? 1 : 0,
    retrievability: clampNumber(progress.retrievability, minRetrievability, maxRetrievability, 0.5)
  };
}

function getRotatingOrder(item, sessionNumber) {
  const stable = Math.abs(hashString(item.id));
  return (stable + Math.max(0, Number(sessionNumber) || 0) * 37) % 997;
}

function hashString(value) {
  return String(value || "").split("").reduce((hash, char) => (
    ((hash << 5) - hash + char.charCodeAt(0)) | 0
  ), 0);
}

function getNormalDailyTrailItems(state, items) {
  if (!state.continentsOceansProgress.completedOnce) {
    return items;
  }

  return items.filter((item) => !isContinentsOceansItem(item));
}

function getContinentsOceansReviewDecision(state, items) {
  const continentsOceansItems = getContinentsOceansItems(items);

  if (continentsOceansItems.length === 0) {
    return null;
  }

  const progress = state.continentsOceansProgress;

  if (!isContinentsOceansFoundationComplete(state, continentsOceansItems)) {
    return {
      type: "foundation",
      items: getNextContinentsOceansFoundationBatch(state, continentsOceansItems)
    };
  }

  if (isContinentsOceansFullReviewEligible(state)) {
    return {
      type: "full",
      items: continentsOceansItems
    };
  }

  if (!isContinentsOceansSmallReviewEligible(state)) {
    return null;
  }

  const count = progress.masteryStatus === "strong" || progress.masteryStatus === "mastered"
    ? Math.min(2, continentsOceansItems.length)
    : Math.min(4, continentsOceansItems.length);

  return {
    type: "small",
    items: selectContinentsOceansReviewItems(state, continentsOceansItems, count)
  };
}

function isContinentsOceansSmallReviewEligible(state) {
  const progress = state.continentsOceansProgress;
  const sessionGap = getSessionGap(state.currentSessionNumber, progress.lastReviewedSession);
  const requiredSessionGap = progress.masteryStatus === "strong" || progress.masteryStatus === "mastered"
    ? continentsOceansStrongReviewSessionInterval
    : continentsOceansSmallReviewSessionCooldown;

  return sessionGap >= requiredSessionGap
    && isDateCooldownReady(state.lastContinentsOceansSmallReviewDate, 1);
}

function isContinentsOceansFullReviewEligible(state) {
  const progress = state.continentsOceansProgress;

  if (!["weak", "developing"].includes(progress.masteryStatus)) {
    return false;
  }

  if (progress.recentMisses < 2) {
    return false;
  }

  return getSessionGap(state.currentSessionNumber, progress.lastFullReviewSession) >= continentsOceansFullReviewSessionCooldown
    && isDateCooldownReady(state.lastContinentsOceansFullReviewDate, continentsOceansFullReviewDayCooldown);
}

function selectContinentsOceansReviewItems(state, items, count) {
  return items
    .filter((item) => isItemPracticeEligible(state, item))
    .map((item) => ({
      item,
      progress: state.itemProgress[item.id] || {}
    }))
    .sort((left, right) => (
      getReviewPriority(state, right.item).isDue - getReviewPriority(state, left.item).isDue
      || getReviewPriority(state, right.item).overdueScore - getReviewPriority(state, left.item).overdueScore
      || (right.progress.missCount || 0) - (left.progress.missCount || 0)
      || (left.progress.lastReviewedSession || left.progress.lastSeenSession || 0) - (right.progress.lastReviewedSession || right.progress.lastSeenSession || 0)
      || left.item.order - right.item.order
    ))
    .slice(0, count)
    .map(({ item }) => item);
}

function getContinentsOceansItems(items) {
  return items.filter(isContinentsOceansItem);
}

function isContinentsOceansItem(item) {
  return item?.homeActivityId === continentsOceansActivityId;
}

function getRemainingContinentsOceansFoundationItems(state, items) {
  const coveredIds = new Set([
    ...(state.continentsOceansProgress.quizCoveredItemIds || []),
    ...items
      .filter((item) => {
        const progress = state.itemProgress[item.id];
        return progress && progress.timesSeen > 0 && progress.status !== "unseen";
      })
      .map((item) => item.id)
  ]);
  const remainingItems = items.filter((item) => !coveredIds.has(item.id));

  return remainingItems.length > 0 ? remainingItems : items;
}

function getNextContinentsOceansFoundationBatch(state, items) {
  return getRemainingContinentsOceansFoundationItems(state, items)
    .slice(0, continentsOceansFoundationBatchSize);
}

function isContinentsOceansFoundationComplete(state, items) {
  if (!items.length) {
    return false;
  }

  const itemIds = new Set(items.map((item) => item.id));
  const introducedIds = new Set([
    ...(state.continentsOceansProgress.introducedItemIds || []),
    ...state.introducedItemIds.filter((id) => itemIds.has(id)),
    ...items
      .filter((item) => practiceEligibleStatuses.has(getItemStatus(state, item)))
      .map((item) => item.id)
  ]);
  const quizCoveredIds = new Set([
    ...(state.continentsOceansProgress.quizCoveredItemIds || []),
    ...items
      .filter((item) => {
        const progress = state.itemProgress[item.id];
        return progress && progress.timesSeen > 0;
      })
      .map((item) => item.id)
  ]);

  return items.every((item) => introducedIds.has(item.id) && quizCoveredIds.has(item.id));
}

function normalizeItemProgress(value, stateContext = {}) {
  const entries = value && typeof value === "object" ? Object.entries(value) : [];

  return Object.fromEntries(entries.map(([itemId, progress]) => {
    const normalizedProgress = {
      status: validStatuses.has(progress?.status) ? progress.status : "unseen",
      timesSeen: Math.max(0, Number(progress?.timesSeen) || 0),
      correctCount: Math.max(0, Number(progress?.correctCount) || 0),
      missCount: Math.max(0, Number(progress?.missCount) || 0),
      correctStreak: Math.max(0, Number(progress?.correctStreak) || 0),
      lastSeenSession: Math.max(0, Number(progress?.lastSeenSession) || 0),
      introducedSession: Math.max(0, Number(progress?.introducedSession) || 0)
    };
    const memoryFields = getDefaultMemoryFields({
      ...progress,
      ...normalizedProgress
    }, stateContext);

    return [
      itemId,
      {
        ...normalizedProgress,
        memoryState: normalizeMemoryState(progress, normalizedProgress, stateContext),
        difficulty: clampNumber(progress?.difficulty, minMemoryDifficulty, maxMemoryDifficulty, memoryFields.difficulty),
        stability: Math.max(0, Number.isFinite(Number(progress?.stability)) ? Number(progress.stability) : memoryFields.stability),
        retrievability: clampNumber(progress?.retrievability, minRetrievability, maxRetrievability, memoryFields.retrievability),
        dueSession: normalizeOptionalDueSession(progress?.dueSession, memoryFields.dueSession),
        dueDate: normalizeLocalDateString(progress?.dueDate) || memoryFields.dueDate,
        lastReviewedSession: normalizeOptionalDueSession(progress?.lastReviewedSession, memoryFields.lastReviewedSession) || 0,
        lastReviewedDate: normalizeLocalDateString(progress?.lastReviewedDate) || memoryFields.lastReviewedDate,
        lapseCount: Math.max(0, Number(progress?.lapseCount) || memoryFields.lapseCount)
      }
    ];
  }));
}

function normalizeMemoryState(progress = {}, normalizedProgress = {}, stateContext = {}) {
  if (normalizedProgress.status === "unseen") {
    return "new";
  }

  if (isCurrentlyWeakProgress(normalizedProgress)) {
    return "relearning";
  }

  if (validMemoryStates.has(progress?.memoryState) && progress.memoryState !== "new") {
    return progress.memoryState;
  }

  return getDefaultMemoryFields(normalizedProgress, stateContext).memoryState;
}

function getDefaultMemoryFields(progress = {}, stateContext = {}) {
  const currentSessionNumber = Math.max(1, Number(stateContext.currentSessionNumber) || 1);
  const reviewedSession = Math.max(0, Number(progress.lastReviewedSession || progress.lastSeenSession) || 0);
  const reviewedDate = normalizeLocalDateString(progress.lastReviewedDate)
    || normalizeLocalDateString(stateContext.lastDailyTrailSessionDate);

  if (progress.status === "unseen") {
    return {
      memoryState: "new",
      difficulty: defaultMemoryDifficulty,
      stability: 0,
      retrievability: 0,
      dueSession: null,
      dueDate: null,
      lastReviewedSession: 0,
      lastReviewedDate: null,
      lapseCount: 0
    };
  }

  if (progress.status === "introduced") {
    return {
      memoryState: "learning",
      difficulty: defaultMemoryDifficulty,
      stability: 0.5,
      retrievability: 0.35,
      dueSession: currentSessionNumber,
      dueDate: getLocalDateString(),
      lastReviewedSession: reviewedSession,
      lastReviewedDate: reviewedDate,
      lapseCount: Math.max(0, Number(progress.lapseCount) || 0)
    };
  }

  if (progress.status === "learning" && isCurrentlyWeakProgress(progress)) {
    return {
      memoryState: "relearning",
      difficulty: Math.min(maxMemoryDifficulty, defaultMemoryDifficulty + 1),
      stability: 0.5,
      retrievability: 0.25,
      dueSession: currentSessionNumber,
      dueDate: getLocalDateString(),
      lastReviewedSession: reviewedSession,
      lastReviewedDate: reviewedDate,
      lapseCount: Math.max(0, Number(progress.lapseCount) || 0)
    };
  }

  const stability = getDefaultStability(progress);
  return {
    memoryState: progress.status === "review" || progress.status === "mastered" ? "review" : "learning",
    difficulty: defaultMemoryDifficulty,
    stability,
    retrievability: progress.status === "mastered" ? 0.9 : progress.status === "review" ? 0.82 : 0.65,
    dueSession: reviewedSession > 0 ? reviewedSession + Math.max(1, Math.round(stability)) : currentSessionNumber + 1,
    dueDate: reviewedDate ? addDaysToLocalDate(reviewedDate, Math.max(1, Math.round(stability))) : null,
    lastReviewedSession: reviewedSession,
    lastReviewedDate: reviewedDate,
    lapseCount: Math.max(0, Number(progress.lapseCount) || 0)
  };
}

function getDefaultStability(progress = {}) {
  if (progress.status === "mastered") {
    return Math.max(7, Number(progress.correctStreak) || 0);
  }

  if (progress.status === "review") {
    return Math.max(3, Number(progress.correctStreak) || 0);
  }

  if ((progress.correctStreak || 0) > 0) {
    return 1;
  }

  return 0.5;
}

function normalizeContinentsOceansProgress(value = {}) {
  const masteryStatus = continentsOceansStatuses.has(value?.masteryStatus)
    ? value.masteryStatus
    : "unseen";

  return {
    completedOnce: Boolean(value?.completedOnce),
    masteryStatus,
    lastReviewedSession: normalizeOptionalSessionNumber(value?.lastReviewedSession),
    lastFullReviewSession: normalizeOptionalSessionNumber(value?.lastFullReviewSession),
    recentMisses: Math.max(0, Number(value?.recentMisses) || 0),
    fullReviewPasses: Math.max(0, Number(value?.fullReviewPasses) || 0),
    introducedItemIds: Array.isArray(value?.introducedItemIds) ? value.introducedItemIds.filter(Boolean) : [],
    quizCoveredItemIds: Array.isArray(value?.quizCoveredItemIds) ? value.quizCoveredItemIds.filter(Boolean) : []
  };
}

function normalizeOptionalSessionNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? Math.floor(number) : null;
}

function normalizeOptionalDueSession(value, fallback = null) {
  const number = Number(value);
  if (Number.isFinite(number) && number >= 0) {
    return Math.floor(number);
  }

  return fallback;
}

function clampNumber(value, min, max, fallback) {
  const number = Number(value);
  if (!Number.isFinite(number)) {
    return fallback;
  }

  return Math.min(max, Math.max(min, number));
}

function getDailyTrailItemType(activity, target) {
  if (target.type === "federal-district") {
    return "federal-district";
  }

  if (target.type === "zone") {
    return "ocean";
  }

  if (target.type === "region") {
    return "continent";
  }

  if (target.type === "capital") {
    return "capital";
  }

  if (target.type === "city") {
    return "city";
  }

  if (target.type === "water-body") {
    return "water-body";
  }

  if (target.type === "mountain-range") {
    return "mountain-range";
  }

  if (target.type === "territory") {
    return "territory";
  }

  if (/state/i.test(activity?.targetNoun || "")) {
    return "state";
  }

  return "country";
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
      dueDate: null,
      lastReviewedSession: 0,
      lastReviewedDate: null,
      lapseCount: 0
    };
  }

  return state.itemProgress[item.id];
}

function getItemStatus(state, item) {
  return state.itemProgress[item.id]?.status
    || (state.introducedItemIds.includes(item.id) ? "introduced" : "unseen");
}

function isItemUnseenForDailyTrail(state, item) {
  return getItemStatus(state, item) === "unseen";
}

function isItemPracticeEligible(state, item) {
  return practiceEligibleStatuses.has(getItemStatus(state, item));
}

function warnIfUnseenPracticeItems(state, { sessionType, reviewItems = [], playItems = [], defensiveNewItems = [] } = {}) {
  if (!ENABLE_DAILY_TRAIL_DEBUG || typeof console === "undefined") {
    return;
  }

  const newIds = new Set(defensiveNewItems.map((item) => item.id));
  const unseenReviewItems = reviewItems.filter((item) => isItemUnseenForDailyTrail(state, item));
  const unseenPracticeItems = playItems.filter((item) => isItemUnseenForDailyTrail(state, item) && !newIds.has(item.id));

  if (unseenReviewItems.length === 0 && unseenPracticeItems.length === 0) {
    return;
  }

  console.warn("[Daily Trail planner] moved unseen items out of practice/review", {
    sessionType,
    unseenReviewItems: unseenReviewItems.map((item) => ({ id: item.id, label: item.label, homeActivityId: item.homeActivityId })),
    unseenPracticeItems: unseenPracticeItems.map((item) => ({ id: item.id, label: item.label, homeActivityId: item.homeActivityId }))
  });
}

function getLastSeenSession(state, item) {
  return state.itemProgress[item.id]?.lastSeenSession || 0;
}

function getWeakItems(state, items) {
  return items
    .filter((item) => {
      const progress = state.itemProgress[item.id];
      return progress && (
        isCurrentlyWeakProgress(progress)
        || progress.status === "introduced"
        || (progress.status === "learning" && (progress.correctStreak || 0) <= 0)
      );
    })
    .sort((left, right) => {
      const leftProgress = state.itemProgress[left.id] || {};
      const rightProgress = state.itemProgress[right.id] || {};
      return (rightProgress.missCount || 0) - (leftProgress.missCount || 0)
        || (leftProgress.lastSeenSession || 0) - (rightProgress.lastSeenSession || 0);
    });
}

function isCurrentlyWeakProgress(progress = {}) {
  return (progress.missCount || 0) > 0 && (progress.correctStreak || 0) <= 0;
}

function getNextItemStatus(progress, missCount) {
  if (missCount > 0) {
    return progress.missCount >= 2 ? "learning" : progress.status === "mastered" ? "review" : "learning";
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

function updateMemorySchedulingAfterAttempt(progress, result, state, completedDate) {
  const isCorrect = Boolean(result?.isCorrect);
  const missCount = Math.max(0, Number(result?.missCount) || 0);
  const currentSessionNumber = Math.max(1, Number(state.currentSessionNumber) || 1);

  progress.lastReviewedSession = currentSessionNumber;
  progress.lastReviewedDate = completedDate;

  if (missCount > 0) {
    progress.lapseCount = Math.max(0, Number(progress.lapseCount) || 0) + missCount;
    progress.memoryState = "relearning";
    progress.difficulty = clampNumber((Number(progress.difficulty) || defaultMemoryDifficulty) + 0.6, minMemoryDifficulty, maxMemoryDifficulty, defaultMemoryDifficulty);
    progress.stability = Math.max(0.5, (Number(progress.stability) || 1) * 0.45);
    progress.retrievability = clampNumber((Number(progress.retrievability) || 0.5) * 0.45, minRetrievability, maxRetrievability, 0.25);
    progress.dueSession = currentSessionNumber + 1;
    progress.dueDate = completedDate;
    return;
  }

  if (!isCorrect) {
    return;
  }

  const previousStability = Math.max(0, Number(progress.stability) || 0);
  const growth = progress.status === "review" || progress.status === "mastered"
    ? 1.8
    : progress.status === "learning"
      ? 1.25
      : 1;
  const streakBonus = Math.min(2, Math.max(0, Number(progress.correctStreak) || 0) * 0.25);

  progress.memoryState = progress.status === "review" || progress.status === "mastered" ? "review" : "learning";
  progress.difficulty = clampNumber((Number(progress.difficulty) || defaultMemoryDifficulty) - 0.15, minMemoryDifficulty, maxMemoryDifficulty, defaultMemoryDifficulty);
  progress.stability = Math.max(1, previousStability + growth + streakBonus);
  progress.retrievability = clampNumber((Number(progress.retrievability) || 0.55) + 0.18, minRetrievability, 0.97, 0.73);

  const interval = Math.max(1, Math.round(progress.stability));
  progress.dueSession = currentSessionNumber + interval;
  progress.dueDate = addDaysToLocalDate(completedDate, interval);
}

function updateContinentsOceansProgress(state, plan, practicedItems, missesByTargetId, completedDate) {
  const practicedContinentsOceansItems = practicedItems.filter(isContinentsOceansItem);

  if (practicedContinentsOceansItems.length === 0 && !plan?.continentsOceansReviewType) {
    return;
  }

  const progress = state.continentsOceansProgress;
  const reviewType = plan?.continentsOceansReviewType || "small";
  const missCount = practicedContinentsOceansItems.reduce((sum, item) => (
    sum + (Number(missesByTargetId[item.targetId]) || 0)
  ), 0);
  const promptCount = Math.max(1, practicedContinentsOceansItems.length);
  const accuracy = Math.max(0, (promptCount - Math.min(promptCount, missCount)) / promptCount);
  const isFullReview = reviewType === "foundation" || reviewType === "full";
  const strongPerformance = accuracy >= 0.9 && missCount <= 1;
  const weakPerformance = missCount >= 3 || accuracy < 0.75;
  const allContinentsOceansItems = getContinentsOceansItems(plan?.allItems || []);
  const allContinentsOceansItemIds = new Set(allContinentsOceansItems.map((item) => item.id));

  practicedContinentsOceansItems.forEach((item) => {
    progress.quizCoveredItemIds = addUnique(progress.quizCoveredItemIds, item.id);
    if (isItemPracticeEligible(state, item)) {
      progress.introducedItemIds = addUnique(progress.introducedItemIds, item.id);
    }
  });

  const introducedCount = progress.introducedItemIds.filter((id) => allContinentsOceansItemIds.has(id)).length;
  const quizCoveredCount = progress.quizCoveredItemIds.filter((id) => allContinentsOceansItemIds.has(id)).length;
  progress.completedOnce = allContinentsOceansItems.length > 0
    && introducedCount >= allContinentsOceansItems.length
    && quizCoveredCount >= allContinentsOceansItems.length;
  progress.lastReviewedSession = state.currentSessionNumber;
  progress.recentMisses = missCount;

  if (reviewType === "small") {
    state.lastContinentsOceansSmallReviewDate = completedDate;
  }

  if (isFullReview) {
    progress.lastFullReviewSession = state.currentSessionNumber;
    state.lastContinentsOceansFullReviewDate = completedDate;
  }

  if (strongPerformance) {
    progress.fullReviewPasses += 1;
    progress.masteryStatus = progress.fullReviewPasses >= 2 ? "mastered" : "strong";
  } else if (weakPerformance) {
    progress.masteryStatus = "weak";
  } else {
    progress.masteryStatus = progress.masteryStatus === "unseen" ? "developing" : "developing";
  }
}

function groupItemsByCamera(items) {
  const groups = new Map();

  items.forEach((item) => {
    const key = item.cameraGroupId || item.homeActivityId || "world";
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key).push(item);
  });

  return Array.from(groups.entries()).map(([cameraGroupId, groupItems]) => ({
    cameraGroupId,
    homeActivityId: groupItems[0]?.homeActivityId || "",
    items: groupItems
  }));
}

function groupItemsByActivity(items) {
  const groups = new Map();

  items.forEach((item) => {
    const key = item.homeActivityId || "world";
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key).push(item);
  });

  return Array.from(groups.entries()).map(([homeActivityId, groupItems]) => ({
    homeActivityId,
    cameraGroupId: groupItems[0]?.cameraGroupId || homeActivityId,
    items: groupItems
  }));
}

function dedupeItems(items) {
  const byId = new Map();
  items.filter(Boolean).forEach((item) => {
    if (!byId.has(item.id)) {
      byId.set(item.id, item);
    }
  });
  return Array.from(byId.values()).sort((left, right) => left.order - right.order);
}

function normalizeCompletedGoalIds(value, legacyPathCompleted) {
  const completedGoalIds = Array.isArray(value)
    ? value.filter((goalId) => dailyTrailGoals.some((goal) => goal.id === goalId))
    : [];

  // Earlier progress only had a single terminal flag, which represented a
  // completed World Core path. Preserve that learner progress on migration.
  return legacyPathCompleted
    ? addUnique(completedGoalIds, dailyTrailId)
    : completedGoalIds;
}

function addUnique(items, item) {
  return items.includes(item) ? items : [...items, item];
}

function getSessionsUntilNextCheckpoint(sessionsSinceLastCheckpoint) {
  return Math.max(0, dailyTrailCheckpointInterval - 1 - sessionsSinceLastCheckpoint);
}

function getSessionGap(currentSessionNumber, previousSessionNumber) {
  if (!previousSessionNumber) {
    return Number.POSITIVE_INFINITY;
  }

  return Math.max(0, currentSessionNumber - previousSessionNumber);
}

function isDateCooldownReady(lastDate, requiredDays) {
  if (!lastDate) {
    return true;
  }

  return getDateGapInDays(lastDate, getLocalDateString()) >= requiredDays;
}

function getLocalDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDaysToLocalDate(value, days) {
  const date = parseLocalDate(value);
  if (!date) {
    return null;
  }

  date.setDate(date.getDate() + Math.max(0, Math.floor(Number(days) || 0)));
  return getLocalDateString(date);
}

function normalizeLocalDateString(value) {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null;
}

function getDateGapInDays(fromDate, toDate) {
  const from = parseLocalDate(fromDate);
  const to = parseLocalDate(toDate);

  if (!from || !to) {
    return Number.POSITIVE_INFINITY;
  }

  return Math.floor((to.getTime() - from.getTime()) / 86400000);
}

function parseLocalDate(value) {
  if (!normalizeLocalDateString(value)) {
    return null;
  }

  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function logDailyTrailPlan(state, items, plan) {
  if (!ENABLE_DAILY_TRAIL_DEBUG || typeof console === "undefined") {
    return;
  }

  const unseenCount = items.filter((item) => getItemStatus(state, item) === "unseen").length;
  const introducedCount = items.filter((item) => state.introducedItemIds.includes(item.id)).length;
  const continentsOceansItems = getContinentsOceansItems(items);
  const continentsOceansRemainingItems = getRemainingContinentsOceansFoundationItems(state, continentsOceansItems);

  console.log("[Daily Trail planner]", {
    itemCount: items.length,
    unseenCount,
    introducedCount,
    continentsOceans: {
      totalCount: continentsOceansItems.length,
      introducedCount: continentsOceansItems.filter((item) => (
        state.continentsOceansProgress.introducedItemIds.includes(item.id)
        || practiceEligibleStatuses.has(getItemStatus(state, item))
      )).length,
      quizCoveredCount: continentsOceansItems.filter((item) => (
        state.continentsOceansProgress.quizCoveredItemIds.includes(item.id)
        || (state.itemProgress[item.id]?.timesSeen || 0) > 0
      )).length,
      remainingLabels: continentsOceansRemainingItems.map((item) => item.label),
      foundationComplete: isContinentsOceansFoundationComplete(state, continentsOceansItems),
      advanceAllowed: plan.activeActivityId !== continentsOceansActivityId
    },
    currentSessionNumber: state.currentSessionNumber,
    sessionsUntilNextCheckpoint: state.sessionsUntilNextCheckpoint,
    sessionType: plan.sessionType,
    activeActivityId: plan.activeActivityId,
    newItems: plan.newItems.map((item) => ({
      id: item.id,
      label: item.label,
      homeActivityId: item.homeActivityId,
      cameraGroupId: item.cameraGroupId
    })),
    reviewItems: plan.reviewItems.map((item) => ({
      id: item.id,
      label: item.label,
      homeActivityId: item.homeActivityId,
      cameraGroupId: item.cameraGroupId
    }))
  });
}
