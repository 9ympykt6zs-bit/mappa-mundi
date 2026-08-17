export const BAYESIAN_PROGRESS_PARAMETERS = Object.freeze({
  priorAlpha: 1,
  priorBeta: 2,
  correctWeight: 1,
  incorrectWeight: 1
});

export const DEMONSTRATED_PROGRESS_CATEGORIES = Object.freeze({
  unseen: Object.freeze({ id: "unseen", label: "Unseen" }),
  needsReview: Object.freeze({ id: "needs-review", label: "Needs review" }),
  demonstrated: Object.freeze({ id: "demonstrated", label: "Demonstrated" }),
  strongEvidence: Object.freeze({ id: "strong-evidence", label: "Strong evidence" })
});

export const DEMONSTRATED_PROGRESS_THRESHOLDS = Object.freeze({
  needsReviewMaximumExclusive: 0.3,
  demonstratedMaximumExclusive: 0.65
});

function normalizedCount(value) {
  return Math.max(0, Number(value) || 0);
}

function cloneCategory(category) {
  return { ...category };
}

export function scoreBayesianEvidenceCounts(correctCount, incorrectCount, parameters = {}) {
  const correct = normalizedCount(correctCount);
  const incorrect = normalizedCount(incorrectCount);
  if (correct + incorrect === 0) return null;
  const config = { ...BAYESIAN_PROGRESS_PARAMETERS, ...parameters };
  const alpha = config.priorAlpha + correct * config.correctWeight;
  const beta = config.priorBeta + incorrect * config.incorrectWeight;
  return Number((alpha / (alpha + beta)).toFixed(6));
}

export function demonstratedProgressCategory(score) {
  if (score === null || score === undefined) return cloneCategory(DEMONSTRATED_PROGRESS_CATEGORIES.unseen);
  if (score < DEMONSTRATED_PROGRESS_THRESHOLDS.needsReviewMaximumExclusive) {
    return cloneCategory(DEMONSTRATED_PROGRESS_CATEGORIES.needsReview);
  }
  if (score < DEMONSTRATED_PROGRESS_THRESHOLDS.demonstratedMaximumExclusive) {
    return cloneCategory(DEMONSTRATED_PROGRESS_CATEGORIES.demonstrated);
  }
  return cloneCategory(DEMONSTRATED_PROGRESS_CATEGORIES.strongEvidence);
}

export function renderBayesianProgressSegments(score, segmentCount = 10) {
  const count = Math.max(1, Math.floor(Number(segmentCount) || 10));
  const isUnseen = score === null || score === undefined;
  const filledCount = isUnseen ? 0 : Math.max(0, Math.min(count, Math.round(score * count)));
  return {
    segmentCount: count,
    filledCount,
    emptyCount: count - filledCount,
    isUnseen,
    accessibleLabel: isUnseen
      ? "No demonstrated-progress evidence yet"
      : `${filledCount} of ${count} demonstrated-progress segments filled`
  };
}
