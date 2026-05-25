export const progressStorageKey = "atlasQuestProgress";
export const progressVersion = 1;
export const difficultyIds = ["easy", "medium", "hard"];

function createEmptyProgress() {
  return {
    version: progressVersion,
    activeJourneyId: null,
    activeStepIndex: 0,
    activeDifficulty: "easy",
    recentJourneyId: null,
    recentDifficulty: "easy",
    journeys: {}
  };
}

function normalizeDifficulty(difficulty) {
  return difficultyIds.includes(difficulty) ? difficulty : "easy";
}

function normalizeStepDifficultyMap(value) {
  return Object.fromEntries(
    difficultyIds.map((difficulty) => [difficulty, Boolean(value?.[difficulty])])
  );
}

function normalizeJourneyProgress(value) {
  const completedSteps = value?.completedSteps && typeof value.completedSteps === "object"
    ? value.completedSteps
    : {};
  const normalizedCompletedSteps = Object.fromEntries(
    Object.entries(completedSteps)
      .filter(([stepId]) => typeof stepId === "string" && stepId)
      .map(([stepId, stepProgress]) => [stepId, normalizeStepDifficultyMap(stepProgress)])
  );

  return {
    currentStepIndex: Number.isInteger(value?.currentStepIndex) && value.currentStepIndex >= 0
      ? value.currentStepIndex
      : 0,
    completedSteps: normalizedCompletedSteps,
    completedDifficulties: normalizeStepDifficultyMap(value?.completedDifficulties)
  };
}

function normalizeProgress(value) {
  if (!value || typeof value !== "object" || value.version !== progressVersion) {
    return createEmptyProgress();
  }

  const journeys = value.journeys && typeof value.journeys === "object" ? value.journeys : {};

  return {
    version: progressVersion,
    activeJourneyId: typeof value.activeJourneyId === "string" ? value.activeJourneyId : null,
    activeStepIndex: Number.isInteger(value.activeStepIndex) && value.activeStepIndex >= 0 ? value.activeStepIndex : 0,
    activeDifficulty: normalizeDifficulty(value.activeDifficulty),
    recentJourneyId: typeof value.recentJourneyId === "string"
      ? value.recentJourneyId
      : typeof value.activeJourneyId === "string"
        ? value.activeJourneyId
        : null,
    recentDifficulty: normalizeDifficulty(value.recentDifficulty || value.activeDifficulty),
    journeys: Object.fromEntries(
      Object.entries(journeys)
        .filter(([journeyId]) => typeof journeyId === "string" && journeyId)
        .map(([journeyId, journeyProgress]) => [journeyId, normalizeJourneyProgress(journeyProgress)])
    )
  };
}

export function loadProgress() {
  try {
    return normalizeProgress(JSON.parse(localStorage.getItem(progressStorageKey) || "null"));
  } catch {
    return createEmptyProgress();
  }
}

export function saveProgress(progress) {
  const normalized = normalizeProgress(progress);

  try {
    localStorage.setItem(progressStorageKey, JSON.stringify(normalized));
  } catch {
    // Keep the app playable when localStorage is unavailable.
  }

  return normalized;
}

export function getJourneyProgress(journeyId, progress = loadProgress()) {
  return normalizeJourneyProgress(progress.journeys?.[journeyId]);
}

export function setActiveJourney(journeyId, stepIndex, difficulty, progress = loadProgress()) {
  const normalized = normalizeProgress(progress);
  const journeyProgress = getJourneyProgress(journeyId, normalized);
  journeyProgress.currentStepIndex = Math.max(0, Number.isInteger(stepIndex) ? stepIndex : 0);
  normalized.journeys[journeyId] = journeyProgress;
  normalized.activeJourneyId = journeyId;
  normalized.activeStepIndex = journeyProgress.currentStepIndex;
  normalized.activeDifficulty = normalizeDifficulty(difficulty);
  normalized.recentJourneyId = journeyId;
  normalized.recentDifficulty = normalized.activeDifficulty;
  return saveProgress(normalized);
}

export function clearActiveJourney(progress = loadProgress()) {
  const normalized = normalizeProgress(progress);
  normalized.activeJourneyId = null;
  normalized.activeStepIndex = 0;
  normalized.activeDifficulty = "easy";
  return saveProgress(normalized);
}

export function markStepComplete(journeyId, stepId, difficulty, options = {}, progress = loadProgress()) {
  const normalized = normalizeProgress(progress);
  const safeDifficulty = normalizeDifficulty(difficulty);
  const journeyProgress = getJourneyProgress(journeyId, normalized);
  const stepProgress = normalizeStepDifficultyMap(journeyProgress.completedSteps[stepId]);
  stepProgress[safeDifficulty] = true;
  journeyProgress.completedSteps[stepId] = stepProgress;
  normalized.recentJourneyId = journeyId;
  normalized.recentDifficulty = safeDifficulty;

  if (Number.isInteger(options.nextStepIndex) && options.nextStepIndex >= 0) {
    journeyProgress.currentStepIndex = Math.max(0, options.nextStepIndex);
    normalized.activeJourneyId = journeyId;
    normalized.activeStepIndex = journeyProgress.currentStepIndex;
    normalized.activeDifficulty = safeDifficulty;
  }

  if (options.isJourneyComplete) {
    journeyProgress.completedDifficulties[safeDifficulty] = true;
    normalized.activeJourneyId = null;
    normalized.activeStepIndex = 0;
    normalized.activeDifficulty = safeDifficulty;
  }

  normalized.journeys[journeyId] = journeyProgress;
  return saveProgress(normalized);
}

export function resetJourneyDifficulty(journeyId, difficulty, progress = loadProgress()) {
  const normalized = normalizeProgress(progress);
  const safeDifficulty = normalizeDifficulty(difficulty);
  const journeyProgress = getJourneyProgress(journeyId, normalized);

  Object.values(journeyProgress.completedSteps).forEach((stepProgress) => {
    stepProgress[safeDifficulty] = false;
  });
  journeyProgress.completedDifficulties[safeDifficulty] = false;
  journeyProgress.currentStepIndex = 0;
  normalized.journeys[journeyId] = journeyProgress;

  if (normalized.activeJourneyId === journeyId && normalized.activeDifficulty === safeDifficulty) {
    normalized.activeStepIndex = 0;
  }
  normalized.recentJourneyId = journeyId;
  normalized.recentDifficulty = safeDifficulty;

  return saveProgress(normalized);
}

export function clearProgress() {
  const empty = createEmptyProgress();
  try {
    localStorage.removeItem(progressStorageKey);
  } catch {
    // Ignore localStorage failures.
  }
  return empty;
}
