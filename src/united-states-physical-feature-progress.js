import { getCanonicalRetrievalMappings } from "./canonical-learning-evidence.js";
import { createCanonicalProgressReport } from "./canonical-progress-report.js";
import { getApprovedUnitedStatesAtlasRelationships, UNITED_STATES_RELATIONSHIP_TYPES } from "./atlas/united-states-relationship-challenges.js";
import { USER_FACING_PROGRESS_SKILLS } from "./progress-evidence-policy.js";

export const UNITED_STATES_PHYSICAL_FEATURE_FAMILIES = Object.freeze([
  Object.freeze({ id: "physical-rivers", label: "Rivers", itemType: "river", order: 0 }),
  Object.freeze({ id: "physical-lakes", label: "Lakes", itemType: "lake", order: 1 }),
  Object.freeze({ id: "physical-mountain-ranges", label: "Mountain Ranges", itemType: "mountain-range", order: 2 }),
  Object.freeze({ id: "physical-coasts", label: "Coasts", itemType: "coast", order: 3 })
]);

const familyByEntityType = new Map(UNITED_STATES_PHYSICAL_FEATURE_FAMILIES
  .filter(({ itemType }) => itemType !== "coast")
  .map((family) => [family.itemType, family]));

const familyByRelationshipType = new Map([
  [UNITED_STATES_RELATIONSHIP_TYPES.RIVER_THROUGH, familyByEntityType.get("river")],
  [UNITED_STATES_RELATIONSHIP_TYPES.MAJOR_LAKE_BORDER, familyByEntityType.get("lake")],
  [UNITED_STATES_RELATIONSHIP_TYPES.MOUNTAIN_RANGE, familyByEntityType.get("mountain-range")],
  [UNITED_STATES_RELATIONSHIP_TYPES.COAST, UNITED_STATES_PHYSICAL_FEATURE_FAMILIES.find(({ itemType }) => itemType === "coast")]
]);

const progressSkillIdsByEntityType = Object.freeze({
  river: Object.freeze({
    locating: USER_FACING_PROGRESS_SKILLS.RIVER_LOCATION,
    identifying: USER_FACING_PROGRESS_SKILLS.RIVER_IDENTIFICATION
  }),
  lake: Object.freeze({
    locating: USER_FACING_PROGRESS_SKILLS.LAKE_LOCATION,
    identifying: USER_FACING_PROGRESS_SKILLS.LAKE_IDENTIFICATION
  }),
  "mountain-range": Object.freeze({
    locating: USER_FACING_PROGRESS_SKILLS.MOUNTAIN_RANGE_LOCATION,
    identifying: USER_FACING_PROGRESS_SKILLS.MOUNTAIN_RANGE_IDENTIFICATION
  })
});

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function mapping({ progressSkillId, conceptId, canonicalSkillId }) {
  return {
    historyKey: `${progressSkillId}\u0000${conceptId}`,
    progressSkillId,
    conceptId,
    canonicalSkillId
  };
}

function directMappings(item) {
  const skillIds = progressSkillIdsByEntityType[item.type];
  return getCanonicalRetrievalMappings(item).map(({ conceptId, skillId }) => mapping({
    progressSkillId: skillIds[skillId],
    conceptId,
    canonicalSkillId: skillId
  }));
}

function relationshipMapping(relationship) {
  return mapping({
    progressSkillId: USER_FACING_PROGRESS_SKILLS.GEOGRAPHIC_RELATIONSHIPS,
    conceptId: relationship.conceptId,
    canonicalSkillId: "relationship-recall"
  });
}

function dedupeMappings(mappings = []) {
  const seen = new Set();
  return mappings.filter((candidate) => {
    if (seen.has(candidate.historyKey)) return false;
    seen.add(candidate.historyKey);
    return true;
  });
}

export function buildUnitedStatesPhysicalFeatureProgressItems(
  activities = [],
  relationships = getApprovedUnitedStatesAtlasRelationships()
) {
  const itemsByKey = new Map();
  let contentOrder = 0;

  for (const activity of activities || []) {
    const entityType = activity?.canonicalEvidence?.entityType;
    const family = familyByEntityType.get(entityType);
    if (!family) continue;
    for (const target of activity.targets || activity.features || []) {
      if (!target?.id) continue;
      const key = `${entityType}:${target.id}`;
      if (itemsByKey.has(key)) continue;
      const item = {
        id: key,
        type: entityType,
        targetId: target.id,
        label: target.name || target.label || target.id,
        sourceActivityId: activity.id,
        familyId: family.id,
        contentOrder: contentOrder++
      };
      item.canonicalMappings = directMappings(item);
      itemsByKey.set(key, item);
    }
  }

  for (const relationship of relationships || []) {
    const family = familyByRelationshipType.get(relationship.relationshipType);
    if (!family) continue;
    const type = family.itemType;
    const key = `${type}:${relationship.targetId}`;
    let item = itemsByKey.get(key);
    if (!item) {
      item = {
        id: key,
        type,
        targetId: relationship.targetId,
        label: relationship.targetName || relationship.targetId,
        sourceActivityId: "us-atlas-relationships",
        familyId: family.id,
        contentOrder: contentOrder++,
        canonicalMappings: []
      };
      itemsByKey.set(key, item);
    }
    item.canonicalMappings = dedupeMappings([
      ...(item.canonicalMappings || []),
      relationshipMapping(relationship)
    ]);
  }

  return [...itemsByKey.values()]
    .sort((left, right) => {
      const leftFamily = UNITED_STATES_PHYSICAL_FEATURE_FAMILIES.find(({ id }) => id === left.familyId);
      const rightFamily = UNITED_STATES_PHYSICAL_FEATURE_FAMILIES.find(({ id }) => id === right.familyId);
      return (leftFamily?.order ?? 999) - (rightFamily?.order ?? 999)
        || left.contentOrder - right.contentOrder
        || left.id.localeCompare(right.id);
    })
    .map(clone);
}

export function createUnitedStatesPhysicalFeatureProgressReport({
  items = [],
  repository
} = {}) {
  const safeItems = clone(items).filter((item) => familyByEntityType.has(item.type) || item.type === "coast");
  return createCanonicalProgressReport({
    kind: "united-states-physical-feature-progress-foundation",
    title: "Progress Report",
    scopeTitle: "United States",
    sectionTitle: "Physical Features",
    subtitle: "Canonical physical-feature evidence grouped by current learning family.",
    dataSources: [
      "Canonical physical-feature retrieval evidence",
      "Canonical U.S. Connections relationship-recall evidence"
    ],
    items: safeItems,
    categoryDefinitions: UNITED_STATES_PHYSICAL_FEATURE_FAMILIES.map((family) => ({
      ...family,
      getMappings: (item) => item.familyId === family.id ? clone(item.canonicalMappings || []) : []
    })),
    repository
  });
}
