const excludedPhaseOneTargetIdSet = new Set(["district-of-columbia", "washington-dc"]);

export function isExcludedPhaseOneTargetId(targetId) {
  return excludedPhaseOneTargetIdSet.has(targetId);
}
