import { scoreBayesianEvidenceCounts } from "../../src/bayesian-progress-score.js";

export const PROGRESS_SCORE_BANDS = Object.freeze([
  { id: "low", minimum: 0, maximumExclusive: 0.3 },
  { id: "medium", minimum: 0.3, maximumExclusive: 0.65 },
  { id: "high", minimum: 0.65, maximumExclusive: 0.9 },
  { id: "complete", minimum: 0.9, maximumExclusive: 1.0000001 }
]);

export const EXPERIMENTAL_PROGRESS_MODELS = Object.freeze([
  {
    id: "weighted-evidence",
    label: "Model A — Simple weighted evidence",
    assumptions: "Correct and incorrect answers add or subtract fixed evidence; consecutive correct answers add a small bonus; the result is clamped to 0–1.",
    defaultParameters: { correctIncrement: 0.34, incorrectDecrement: 0.24, streakBonus: 0.04, maximumStreakBonus: 0.12 }
  },
  {
    id: "bayesian-evidence",
    label: "Model B — Bayesian evidence",
    assumptions: "A provisional Beta(1,2) prior is updated with one unit of evidence per correct or incorrect answer; the posterior mean is shown after evidence exists.",
    defaultParameters: { priorAlpha: 1, priorBeta: 2, correctWeight: 1, incorrectWeight: 1 }
  },
  {
    id: "bkt-inspired",
    label: "Model C — BKT-inspired",
    assumptions: "A latent-knowledge probability is updated using explicit guess/slip likelihoods and a learning transition after each response. There is no forgetting transition.",
    defaultParameters: { priorKnowledge: 0.2, guessProbability: 0.25, slipProbability: 0.1, learningProbability: 0.12 }
  },
  {
    id: "current-system-proxy",
    label: "Model D — Current-system-derived proxy",
    assumptions: "Existing correct-count, times-seen, and correct-streak fields are projected into a visible 0–1 score. Scheduler status, stability, difficulty, and retrievability are deliberately excluded rather than pretending they measure demonstrated skill.",
    defaultParameters: { correctnessWeight: 0.45, streakWeight: 0.3, evidenceVolumeWeight: 0.25, streakTarget: 4, correctEvidenceTarget: 7 }
  }
]);

function clamp(value) {
  return Math.max(0, Math.min(1, value));
}

function rounded(value) {
  return value === null ? null : Number(value.toFixed(6));
}

function modelDefinition(modelId) {
  const definition = EXPERIMENTAL_PROGRESS_MODELS.find((model) => model.id === modelId);
  if (!definition) throw new Error(`Unknown experimental progress model: ${modelId}`);
  return definition;
}

export function progressScoreBand(score) {
  if (score === null || score === undefined) return "unknown";
  return PROGRESS_SCORE_BANDS.find((band) => score >= band.minimum && score < band.maximumExclusive)?.id || "complete";
}

export function scoreCurrentSystemProxy(progress, parameters = {}) {
  if (!progress || !(Number(progress.timesSeen) > 0)) return null;
  const defaults = modelDefinition("current-system-proxy").defaultParameters;
  const config = { ...defaults, ...parameters };
  const attempts = Math.max(1, Number(progress.timesSeen) || 0);
  const correct = Math.max(0, Number(progress.correctCount) || 0);
  const streak = Math.max(0, Number(progress.correctStreak) || 0);
  const correctness = clamp(correct / attempts);
  const streakEvidence = clamp(streak / config.streakTarget);
  const evidenceVolume = clamp(correct / config.correctEvidenceTarget);
  return rounded(clamp(
    correctness * config.correctnessWeight
    + streakEvidence * config.streakWeight
    + evidenceVolume * config.evidenceVolumeWeight
  ));
}

function initialState(modelId, parameters) {
  if (modelId === "weighted-evidence") return { attempted: false, score: 0, correctStreak: 0 };
  if (modelId === "bayesian-evidence") return {
    attempted: false,
    alpha: parameters.priorAlpha,
    beta: parameters.priorBeta
  };
  if (modelId === "bkt-inspired") return {
    attempted: false,
    probabilityKnown: parameters.priorKnowledge,
    lastPosteriorBeforeLearning: null
  };
  if (modelId === "current-system-proxy") return {
    attempted: false,
    timesSeen: 0,
    correctCount: 0,
    missCount: 0,
    correctStreak: 0
  };
  throw new Error(`Unknown experimental progress model: ${modelId}`);
}

function currentScore(modelId, state, parameters) {
  if (!state.attempted) return null;
  if (modelId === "weighted-evidence") return rounded(state.score);
  if (modelId === "bayesian-evidence") return scoreBayesianEvidenceCounts(
    state.alpha - parameters.priorAlpha,
    state.beta - parameters.priorBeta,
    parameters
  );
  if (modelId === "bkt-inspired") return rounded(state.probabilityKnown);
  if (modelId === "current-system-proxy") return scoreCurrentSystemProxy(state, parameters);
  return null;
}

function applyObservation(modelId, state, correct, parameters) {
  if (modelId === "weighted-evidence") {
    state.attempted = true;
    if (correct) {
      state.correctStreak += 1;
      const bonus = Math.min(parameters.maximumStreakBonus, Math.max(0, state.correctStreak - 1) * parameters.streakBonus);
      state.score = clamp(state.score + parameters.correctIncrement + bonus);
    } else {
      state.correctStreak = 0;
      state.score = clamp(state.score - parameters.incorrectDecrement);
    }
    return;
  }
  if (modelId === "bayesian-evidence") {
    state.attempted = true;
    if (correct) state.alpha += parameters.correctWeight;
    else state.beta += parameters.incorrectWeight;
    return;
  }
  if (modelId === "bkt-inspired") {
    state.attempted = true;
    const known = state.probabilityKnown;
    const likelihoodKnown = correct ? 1 - parameters.slipProbability : parameters.slipProbability;
    const likelihoodUnknown = correct ? parameters.guessProbability : 1 - parameters.guessProbability;
    const denominator = known * likelihoodKnown + (1 - known) * likelihoodUnknown;
    const posterior = denominator ? (known * likelihoodKnown) / denominator : known;
    state.lastPosteriorBeforeLearning = posterior;
    state.probabilityKnown = clamp(posterior + (1 - posterior) * parameters.learningProbability);
    return;
  }
  if (modelId === "current-system-proxy") {
    state.attempted = true;
    state.timesSeen += 1;
    if (correct) {
      state.correctCount += 1;
      state.correctStreak += 1;
    } else {
      state.missCount += 1;
      state.correctStreak = 0;
    }
  }
}

function normalizeEvent(event) {
  if (typeof event === "boolean") return { type: "response", correct: event };
  if (event?.type === "gap") return { type: "gap", days: Math.max(0, Number(event.days) || 0) };
  if (typeof event?.correct === "boolean") return { type: "response", correct: event.correct };
  throw new Error("Evidence histories may contain booleans, response objects, or gap objects.");
}

export function runExperimentalProgressModel(modelId, evidenceHistory, parameterOverrides = {}) {
  const definition = modelDefinition(modelId);
  const parameters = { ...definition.defaultParameters, ...parameterOverrides };
  const inputSnapshot = JSON.stringify(evidenceHistory);
  const state = initialState(modelId, parameters);
  const trajectory = [];
  let responseIndex = 0;

  for (const rawEvent of evidenceHistory) {
    const event = normalizeEvent(rawEvent);
    const scoreBefore = currentScore(modelId, state, parameters);
    if (event.type === "response") {
      responseIndex += 1;
      applyObservation(modelId, state, event.correct, parameters);
    }
    const scoreAfter = currentScore(modelId, state, parameters);
    trajectory.push({
      event,
      responseIndex,
      scoreBefore,
      scoreAfter,
      bandAfter: progressScoreBand(scoreAfter),
      changedWithoutResponse: event.type === "gap" && scoreBefore !== scoreAfter,
      state: JSON.parse(JSON.stringify(state))
    });
  }
  if (JSON.stringify(evidenceHistory) !== inputSnapshot) throw new Error(`${modelId} mutated its evidence history.`);
  const score = currentScore(modelId, state, parameters);
  return {
    modelId,
    parameters,
    timeSensitive: false,
    score,
    band: progressScoreBand(score),
    trajectory,
    finalState: JSON.parse(JSON.stringify(state))
  };
}

export function runAllExperimentalProgressModels(evidenceHistory, overridesByModel = {}) {
  return Object.fromEntries(EXPERIMENTAL_PROGRESS_MODELS.map((model) => [
    model.id,
    runExperimentalProgressModel(model.id, evidenceHistory, overridesByModel[model.id])
  ]));
}
