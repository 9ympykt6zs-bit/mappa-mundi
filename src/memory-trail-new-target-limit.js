export function resolveMemoryTrailNewTargetLimit(options = {}, activity = {}) {
  const optionLimit = Number(options.maxNewTargets);

  if (Number.isFinite(optionLimit) && optionLimit > 0) {
    return Math.max(1, Math.floor(optionLimit));
  }

  const activityLimit = Number(activity?.memoryTrailNewTargetLimit);

  // Activity normalization uses null for an unspecified limit. It is not a
  // configured zero-target limit, so leave the session uncapped in that case.
  if (Number.isFinite(activityLimit) && activityLimit > 0) {
    return Math.max(1, Math.floor(activityLimit));
  }

  return null;
}
