function uniqueStrings(values = []) {
  return [...new Set((Array.isArray(values) ? values : [])
    .map((value) => String(value || "").trim())
    .filter(Boolean))];
}

function hashString(value) {
  return String(value || "").split("").reduce((hash, character) => (
    ((hash << 5) - hash + character.charCodeAt(0)) | 0
  ), 0);
}

function rotate(values = [], offset = 1) {
  if (values.length <= 1) return [...values];
  const normalizedOffset = ((offset % values.length) + values.length) % values.length;
  return [...values.slice(normalizedOffset), ...values.slice(0, normalizedOffset)];
}

function ordersMatch(left = [], right = []) {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

export function createDeterministicGuidedPhysicalRetrievalOrder(
  targetIds = [],
  { cohortId = "physical-cohort", generation = 0, previousOrder = [] } = {}
) {
  const authoredOrder = uniqueStrings(targetIds);
  const seed = `${cohortId}:${Math.max(0, Number(generation) || 0)}`;
  let order = [...authoredOrder].sort((left, right) => (
    Math.abs(hashString(`${seed}:${left}`)) - Math.abs(hashString(`${seed}:${right}`))
    || left.localeCompare(right)
  ));
  if (order.length > 1 && ordersMatch(order, authoredOrder)) {
    order = rotate(order, (Math.abs(hashString(seed)) % (order.length - 1)) + 1);
  }
  if (order.length > 1 && ordersMatch(order, uniqueStrings(previousOrder))) {
    order = rotate(order);
  }
  return order;
}

export function createGuidedPhysicalRetrievalCheckpoint({
  cohortId,
  kind = "initial",
  targetIds = [],
  generation = 0,
  previousOrder = [],
  order = null
} = {}) {
  const targetOrder = Array.isArray(order) && order.length > 0
    ? uniqueStrings(order).filter((targetId) => targetIds.includes(targetId))
    : createDeterministicGuidedPhysicalRetrievalOrder(targetIds, { cohortId, generation, previousOrder });
  return {
    cohortId: String(cohortId || "").trim() || null,
    kind: kind === "review" ? "review" : "initial",
    generation: Math.max(0, Number(generation) || 0),
    targetOrder,
    previousOrder: uniqueStrings(previousOrder),
    targets: Object.fromEntries(targetOrder.map((targetId) => [targetId, {
      targetId,
      initialAttempt: null,
      retryStatus: "not-needed",
      finalOutcome: null,
      attemptCount: 0,
      incorrectCount: 0,
      immediateComplete: false
    }]))
  };
}

export function chooseNextGuidedPhysicalRetrievalTarget(checkpoint) {
  if (!checkpoint?.targets) return null;
  const initialTargetId = checkpoint.targetOrder.find((targetId) => (
    checkpoint.targets[targetId]?.initialAttempt === null
  ));
  if (initialTargetId) {
    return { targetId: initialTargetId, attempt: "initial" };
  }
  const retryTargetId = checkpoint.targetOrder.find((targetId) => (
    checkpoint.targets[targetId]?.retryStatus === "pending"
  ));
  return retryTargetId ? { targetId: retryTargetId, attempt: "retry" } : null;
}

export function recordGuidedPhysicalRetrievalResult(checkpoint, targetId, result) {
  const normalizedResult = result === "correct" ? "correct" : "incorrect";
  const current = checkpoint?.targets?.[targetId];
  if (!current || current.immediateComplete) return checkpoint;
  const next = JSON.parse(JSON.stringify(checkpoint));
  const target = next.targets[targetId];
  target.attemptCount += 1;
  if (normalizedResult === "incorrect") target.incorrectCount += 1;
  if (target.initialAttempt === null) {
    target.initialAttempt = normalizedResult;
    if (normalizedResult === "correct") {
      target.finalOutcome = "correct";
      target.immediateComplete = true;
    } else {
      target.retryStatus = "pending";
    }
  } else if (target.retryStatus === "pending") {
    target.retryStatus = normalizedResult;
    target.finalOutcome = normalizedResult;
    target.immediateComplete = true;
  }
  return next;
}

export function isGuidedPhysicalRetrievalCheckpointComplete(checkpoint) {
  const targets = Object.values(checkpoint?.targets || {});
  return targets.length > 0 && targets.every(({ immediateComplete }) => immediateComplete);
}

export function getGuidedPhysicalRetrievalCheckpointSnapshot(checkpoint) {
  if (!checkpoint?.targets) return null;
  const targets = checkpoint.targetOrder.map((targetId) => ({ ...checkpoint.targets[targetId] }));
  const next = chooseNextGuidedPhysicalRetrievalTarget(checkpoint);
  const complete = isGuidedPhysicalRetrievalCheckpointComplete(checkpoint);
  const missedTargetIds = targets
    .filter(({ incorrectCount }) => incorrectCount > 0)
    .map(({ targetId }) => targetId);
  const retryPendingTargetIds = targets
    .filter(({ retryStatus }) => retryStatus === "pending")
    .map(({ targetId }) => targetId);
  return {
    cohortId: checkpoint.cohortId,
    kind: checkpoint.kind,
    generation: checkpoint.generation,
    targetOrder: [...checkpoint.targetOrder],
    targets,
    completedImmediateTargetIds: targets
      .filter(({ immediateComplete }) => immediateComplete)
      .map(({ targetId }) => targetId),
    missedTargetIds,
    retryPendingTargetIds,
    remainingImmediateTargetIds: targets
      .filter(({ immediateComplete }) => !immediateComplete)
      .map(({ targetId }) => targetId),
    nextTargetId: next?.targetId || null,
    nextAttempt: next?.attempt || null,
    complete,
    completionReason: complete
      ? targets.some(({ finalOutcome }) => finalOutcome === "incorrect")
        ? "retry-limit-reached-with-review-needed"
        : "all-immediate-targets-complete"
      : null
  };
}
