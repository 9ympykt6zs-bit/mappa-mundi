export function findMemoryTrailGuidedExposureTarget({
  currentPracticeTargetIds = [],
  targetStats = {},
  lastPromptedTargetId = "",
  introducedTargetCount = 0
} = {}) {
  const allowLastTarget = Number(introducedTargetCount) === 1;
  return currentPracticeTargetIds
    .map((targetId) => targetStats[targetId])
    .find((stats) => (
      stats
      && ((stats.exposedCount || 0) < 1 || (stats.guidedTapCount || 0) < 1)
      && (allowLastTarget || stats.targetId !== lastPromptedTargetId)
    )) || null;
}
