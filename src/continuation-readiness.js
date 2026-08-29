import { PROGRESS_REPORT_DISPLAY_CATEGORY_LABELS } from "./canonical-progress-report.js";

export const CONTINUATION_CLASSIFICATION_POLICY = Object.freeze({
  "needs-review": Object.freeze({ sufficient: false, priority: 0, reason: "known-weakness" }),
  "early-evidence": Object.freeze({ sufficient: false, priority: 1, reason: "building" }),
  unseen: Object.freeze({ sufficient: false, priority: 2, reason: "not-started" }),
  demonstrated: Object.freeze({ sufficient: true, priority: 3, reason: "sufficient-evidence" }),
  "strong-evidence": Object.freeze({ sufficient: true, priority: 3, reason: "sufficient-evidence" })
});

function classificationForCategory(category = {}) {
  const recordClassifications = (category.records || [])
    .map((record) => record.displayCategory?.id)
    .filter(Boolean);
  const id = recordClassifications.includes("needs-review")
    ? "needs-review"
    : category.displayCategory?.id || "unseen";
  const policy = CONTINUATION_CLASSIFICATION_POLICY[id] || CONTINUATION_CLASSIFICATION_POLICY.unseen;
  return {
    id,
    label: PROGRESS_REPORT_DISPLAY_CATEGORY_LABELS[id] || category.displayCategory?.label || "Not started",
    ...policy
  };
}

export function evaluateContinuationObjective({
  id,
  label,
  requiredFamilyIds = [],
  categories = []
} = {}) {
  const categoryById = new Map(categories.map((category) => [category.id, category]));
  const families = requiredFamilyIds.map((familyId, contentOrder) => {
    const category = categoryById.get(familyId) || { id: familyId, label: familyId };
    return {
      id: familyId,
      label: category.label || familyId,
      contentOrder,
      classification: classificationForCategory(category)
    };
  });
  const priority = [...families].sort((left, right) => (
    left.classification.priority - right.classification.priority
    || left.contentOrder - right.contentOrder
    || left.id.localeCompare(right.id)
  ));
  const ready = families.length > 0 && families.every(({ classification }) => classification.sufficient);
  const blockingFamily = ready ? null : priority.find(({ classification }) => !classification.sufficient) || null;
  return {
    id: String(id || "").trim(),
    label: String(label || id || "").trim(),
    readiness: ready ? "ready" : "not-ready",
    ready,
    rule: "all-required-families-sufficient-and-no-meaningful-weakness",
    families,
    priorityOrder: priority.map(({ id: familyId }) => familyId),
    blockingFamily: blockingFamily ? {
      id: blockingFamily.id,
      label: blockingFamily.label,
      classification: blockingFamily.classification.id,
      classificationLabel: blockingFamily.classification.label,
      priorityReason: blockingFamily.classification.reason
    } : null
  };
}

export function createUnitedStatesContinuationFoundation({
  progressReport = {},
  physicalFeatureProgressReport = {}
} = {}) {
  const statesAndCapitals = evaluateContinuationObjective({
    id: "learn-states-and-capitals",
    label: "Learn States & Capitals",
    requiredFamilyIds: ["state-locations", "state-identification", "state-capitals"],
    categories: progressReport.categories || []
  });
  const physicalFeatures = evaluateContinuationObjective({
    id: "learn-physical-features",
    label: "Learn Physical Features",
    requiredFamilyIds: ["physical-rivers", "physical-lakes", "physical-mountain-ranges"],
    categories: physicalFeatureProgressReport.categories || []
  });
  const connections = evaluateContinuationObjective({
    id: "learn-connections",
    label: "Learn Connections",
    requiredFamilyIds: ["geographic-relationships"],
    categories: progressReport.categories || []
  });
  const prerequisiteObjectives = [statesAndCapitals, physicalFeatures, connections];
  const blockingObjective = prerequisiteObjectives.find(({ ready }) => !ready) || null;
  const explore = {
    id: "explore-united-states",
    label: "Explore the United States",
    readiness: blockingObjective ? "not-ready" : "ready",
    ready: !blockingObjective,
    rule: "all-prerequisite-objectives-ready",
    prerequisiteObjectiveIds: prerequisiteObjectives.map(({ id }) => id),
    blockingObjective: blockingObjective ? {
      id: blockingObjective.id,
      label: blockingObjective.label,
      blockingFamily: blockingObjective.blockingFamily
    } : null
  };
  const objectives = [...prerequisiteObjectives, explore];
  return {
    schemaVersion: 1,
    kind: "evidence-driven-continuation-foundation",
    readOnly: true,
    objectives,
    observability: {
      physicalFeatures: physicalFeatures.families.map((family) => ({
        id: family.id,
        label: family.label,
        classification: family.classification.label
      })),
      coastPolicy: {
        readinessRole: "connections-only",
        physicalFeaturesRequired: false,
        reason: "No authored coast location or identification learning activity exists in v1."
      },
      objectiveReadiness: objectives.map((objective) => ({
        id: objective.id,
        label: objective.label,
        readiness: objective.readiness,
        blockingFamily: objective.blockingFamily?.label || null,
        priorityReason: objective.blockingFamily?.priorityReason || null,
        blockingObjective: objective.blockingObjective?.label || null
      }))
    }
  };
}
