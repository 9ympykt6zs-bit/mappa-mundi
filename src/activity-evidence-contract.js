export const CANONICAL_RETRIEVAL_ENTITY_TYPES = Object.freeze([
  "state",
  "capital",
  "country",
  "river",
  "lake",
  "mountain-range"
]);

const supportedEntityTypes = new Set(CANONICAL_RETRIEVAL_ENTITY_TYPES);

export function isCanonicalRetrievalEntityType(entityType) {
  return supportedEntityTypes.has(entityType);
}

export function validateActivityEvidenceContract(contract = {}) {
  const errors = [];
  const perTargetTypes = contract.entityTypesByTargetId;
  const hasPerTargetTypes = perTargetTypes && typeof perTargetTypes === "object" && !Array.isArray(perTargetTypes);
  if (!supportedEntityTypes.has(contract.entityType) && !hasPerTargetTypes) {
    errors.push(`Unsupported canonical activity entity type: ${String(contract.entityType || "(missing)")}.`);
  }
  if (contract.entityTypesByTargetId !== undefined && !hasPerTargetTypes) {
    errors.push("canonicalEvidence.entityTypesByTargetId must be an object when supplied.");
  }
  if (hasPerTargetTypes) {
    Object.entries(perTargetTypes).forEach(([targetId, entityType]) => {
      if (!String(targetId || "").trim() || !supportedEntityTypes.has(entityType)) {
        errors.push(`Unsupported canonical entity type for target ${String(targetId || "(missing)")}: ${String(entityType || "(missing)")}.`);
      }
    });
  }
  if (contract.allowedTargetIds !== undefined && !Array.isArray(contract.allowedTargetIds)) {
    errors.push("canonicalEvidence.allowedTargetIds must be an array when supplied.");
  }
  return errors;
}

export function getCanonicalRetrievalItemForActivity(activity = {}, targetId = "") {
  const contract = activity.canonicalEvidence;
  if (!contract || validateActivityEvidenceContract(contract).length > 0) return null;
  const normalizedTargetId = String(targetId || "").trim();
  if (!normalizedTargetId) return null;
  if (Array.isArray(contract.allowedTargetIds) && !contract.allowedTargetIds.includes(normalizedTargetId)) return null;
  const target = (activity.targets || []).find((candidate) => candidate.id === normalizedTargetId);
  if (!target) return null;
  const entityType = contract.entityTypesByTargetId?.[normalizedTargetId] || contract.entityType;
  if (!supportedEntityTypes.has(entityType)) return null;
  return {
    id: `${entityType}:${normalizedTargetId}`,
    type: entityType,
    targetId: normalizedTargetId,
    label: target.name || (typeof target.label === "string" ? target.label : "") || normalizedTargetId,
    sourceActivityId: activity.id
  };
}
