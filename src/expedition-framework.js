export const EXPEDITION_STEP_STATUSES = Object.freeze({
  LOCKED: "locked",
  AVAILABLE: "available",
  IN_PROGRESS: "in-progress",
  COMPLETE: "complete"
});

function normalizeMetricValue(value) {
  if (typeof value === "boolean") return value ? 1 : 0;
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function ruleMet(rule, evidence) {
  if (!rule) return false;
  const value = normalizeMetricValue(evidence?.[rule.metric]);
  if (Object.hasOwn(rule, "equals")) return value === normalizeMetricValue(rule.equals);
  return value >= normalizeMetricValue(rule.atLeast ?? 1);
}

function rulesMet(rules = [], evidence = {}) {
  return rules.length > 0 && rules.every((rule) => ruleMet(rule, evidence));
}

export function validateExpeditionConfiguration(expedition = {}) {
  const errors = [];
  const stepIds = new Set();
  if (!expedition.id) errors.push("Expedition requires an ID.");
  if (!expedition.title) errors.push("Expedition requires a title.");
  if (!Array.isArray(expedition.steps) || expedition.steps.length === 0) {
    errors.push("Expedition requires at least one step.");
  }
  for (const step of expedition.steps || []) {
    if (!step?.id) errors.push("Every Expedition step requires an ID.");
    if (stepIds.has(step?.id)) errors.push(`Duplicate Expedition step ID: ${step.id}`);
    if (step?.id) stepIds.add(step.id);
    if (!step?.title) errors.push(`Expedition step ${step?.id || "(unknown)"} requires a title.`);
    if (!step?.launch?.kind) errors.push(`Expedition step ${step?.id || "(unknown)"} requires a launch kind.`);
  }
  for (const step of expedition.steps || []) {
    for (const prerequisiteId of step.prerequisiteStepIds || []) {
      if (!stepIds.has(prerequisiteId)) {
        errors.push(`Expedition step ${step.id} references unknown prerequisite ${prerequisiteId}.`);
      }
    }
  }
  return errors;
}

export function createExpeditionReadModel(expedition = {}, evidence = {}) {
  const errors = validateExpeditionConfiguration(expedition);
  if (errors.length > 0) throw new Error(errors.join(" "));
  const statusById = new Map();
  const steps = expedition.steps.map((step, index) => {
    const isComplete = rulesMet(step.completionRules, evidence);
    const prerequisitesMet = (step.prerequisiteStepIds || []).every((stepId) => (
      statusById.get(stepId) === EXPEDITION_STEP_STATUSES.COMPLETE
    ));
    const hasProgress = rulesMet(step.progressRules, evidence);
    const status = isComplete
      ? EXPEDITION_STEP_STATUSES.COMPLETE
      : !prerequisitesMet
        ? EXPEDITION_STEP_STATUSES.LOCKED
        : hasProgress
          ? EXPEDITION_STEP_STATUSES.IN_PROGRESS
          : EXPEDITION_STEP_STATUSES.AVAILABLE;
    statusById.set(step.id, status);
    return {
      ...step,
      index,
      status,
      isOptional: !Array.isArray(step.completionRules) || step.completionRules.length === 0,
      actionLabel: status === EXPEDITION_STEP_STATUSES.COMPLETE
        ? (step.reviewLabel || "Review")
        : status === EXPEDITION_STEP_STATUSES.IN_PROGRESS
          ? (step.continueLabel || "Continue")
          : (step.startLabel || "Start")
    };
  });
  const recommendedStep = steps.find((step) => step.status === EXPEDITION_STEP_STATUSES.IN_PROGRESS)
    || steps.find((step) => step.status === EXPEDITION_STEP_STATUSES.AVAILABLE && !step.isOptional)
    || steps.find((step) => step.status === EXPEDITION_STEP_STATUSES.AVAILABLE)
    || steps.at(-1);
  const requiredSteps = steps.filter((step) => !step.isOptional);
  const completedCount = requiredSteps.filter((step) => step.status === EXPEDITION_STEP_STATUSES.COMPLETE).length;
  return {
    id: expedition.id,
    title: expedition.title,
    description: expedition.description || "",
    steps,
    recommendedStepId: recommendedStep?.id || "",
    progress: {
      completedCount,
      totalCount: requiredSteps.length,
      percent: requiredSteps.length > 0 ? Math.round((completedCount / requiredSteps.length) * 100) : 0
    }
  };
}
