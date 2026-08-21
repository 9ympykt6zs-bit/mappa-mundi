import { unitedStatesAtlas } from "./united-states-atlas-data.js";
import { MENTAL_MAP_ANSWER_MODES } from "./mental-map-challenges.js?v=20260721-mental-map-consolidation-1";

export const UNITED_STATES_RELATIONSHIP_ACTIVITY_ID = "us-atlas-relationships";

export const UNITED_STATES_RELATIONSHIP_TYPES = Object.freeze({
  REGION_MEMBERSHIP: "region-membership",
  INTERNATIONAL_BORDER: "international-border",
  COAST: "coast"
});

const approvedAtlasType = Object.freeze({
  belongsToRegion: UNITED_STATES_RELATIONSHIP_TYPES.REGION_MEMBERSHIP,
  internationalBorder: UNITED_STATES_RELATIONSHIP_TYPES.INTERNATIONAL_BORDER,
  coast: UNITED_STATES_RELATIONSHIP_TYPES.COAST
});

function atlasId(entityId) {
  return String(entityId || "").split(":").slice(1).join(":");
}

function relationshipConceptId(type, stateId, targetId) {
  return `relationship:${type}:${stateId}:${targetId}`;
}

export function getApprovedUnitedStatesAtlasRelationships(atlas = unitedStatesAtlas) {
  const entitiesById = new Map((atlas?.entities || []).map((entity) => [entity.id, entity]));
  return (atlas?.relationships || [])
    .map((relationship) => {
      const relationshipType = approvedAtlasType[relationship.type];
      const state = entitiesById.get(relationship.from);
      const target = entitiesById.get(relationship.to);
      if (!relationshipType || state?.kind !== "state" || !target) return null;
      const stateId = atlasId(state.id);
      const targetId = atlasId(target.id);
      return {
        atlasRelationshipType: relationship.type,
        relationshipType,
        stateId,
        stateEntityId: state.id,
        stateName: state.name,
        targetId,
        targetEntityId: target.id,
        targetKind: target.kind,
        targetName: target.name,
        conceptId: relationshipConceptId(relationshipType, stateId, targetId)
      };
    })
    .filter(Boolean)
    .sort((left, right) => left.conceptId.localeCompare(right.conceptId));
}

export function validateApprovedUnitedStatesAtlasRelationships(relationships = getApprovedUnitedStatesAtlasRelationships()) {
  const errors = [];
  const counts = Object.fromEntries(Object.values(UNITED_STATES_RELATIONSHIP_TYPES).map((type) => [
    type,
    relationships.filter((relationship) => relationship.relationshipType === type).length
  ]));
  if (counts[UNITED_STATES_RELATIONSHIP_TYPES.REGION_MEMBERSHIP] !== 50) {
    errors.push(`Expected 50 region memberships, found ${counts[UNITED_STATES_RELATIONSHIP_TYPES.REGION_MEMBERSHIP]}.`);
  }
  if (counts[UNITED_STATES_RELATIONSHIP_TYPES.INTERNATIONAL_BORDER] !== 17) {
    errors.push(`Expected 17 international borders, found ${counts[UNITED_STATES_RELATIONSHIP_TYPES.INTERNATIONAL_BORDER]}.`);
  }
  if (counts[UNITED_STATES_RELATIONSHIP_TYPES.COAST] !== 25) {
    errors.push(`Expected 25 coast relationships, found ${counts[UNITED_STATES_RELATIONSHIP_TYPES.COAST]}.`);
  }
  if (new Set(relationships.map(({ conceptId }) => conceptId)).size !== relationships.length) {
    errors.push("Approved atlas relationship concept IDs must be unique.");
  }
  const regionStates = relationships
    .filter(({ relationshipType }) => relationshipType === UNITED_STATES_RELATIONSHIP_TYPES.REGION_MEMBERSHIP)
    .map(({ stateId }) => stateId);
  if (new Set(regionStates).size !== 50) errors.push("Every state must have exactly one U.S. Census region membership.");
  return errors;
}

function targetPool(relationships, relationship, atlas) {
  const actualTargetsForState = new Set(relationships
    .filter(({ relationshipType, stateId }) => relationshipType === relationship.relationshipType && stateId === relationship.stateId)
    .map(({ targetEntityId }) => targetEntityId));
  return (atlas?.entities || [])
    .filter(({ kind }) => kind === relationship.targetKind)
    .map((entity) => ({
      targetId: atlasId(entity.id),
      targetEntityId: entity.id,
      targetKind: entity.kind,
      targetName: entity.name
    }))
    .filter(({ targetEntityId }) => targetEntityId === relationship.targetEntityId || !actualTargetsForState.has(targetEntityId))
    .sort((left, right) => left.targetName.localeCompare(right.targetName));
}

function answerKeys(atlas, subjectStateId, count) {
  return [subjectStateId, ...(atlas?.entities || [])
    .filter(({ kind, id }) => kind === "state" && atlasId(id) !== subjectStateId)
    .map(({ id }) => atlasId(id))]
    .slice(0, count);
}

function promptFor(relationship) {
  if (relationship.relationshipType === UNITED_STATES_RELATIONSHIP_TYPES.REGION_MEMBERSHIP) {
    return `Which U.S. Census region includes ${relationship.stateName}?`;
  }
  if (relationship.relationshipType === UNITED_STATES_RELATIONSHIP_TYPES.INTERNATIONAL_BORDER) {
    return `Which country shares an international border with ${relationship.stateName}?`;
  }
  return `Which of these bodies of water borders ${relationship.stateName}'s coast?`;
}

function explanationFor(relationship) {
  if (relationship.relationshipType === UNITED_STATES_RELATIONSHIP_TYPES.REGION_MEMBERSHIP) {
    return `${relationship.stateName} belongs to the ${relationship.targetName} U.S. Census region.`;
  }
  if (relationship.relationshipType === UNITED_STATES_RELATIONSHIP_TYPES.INTERNATIONAL_BORDER) {
    return `${relationship.stateName} shares an international boundary with ${relationship.targetName}.`;
  }
  return `${relationship.stateName} has a coastline on the ${relationship.targetName}.`;
}

function createChallenge(relationships, relationship, atlas) {
  const candidates = targetPool(relationships, relationship, atlas);
  const correct = candidates.find(({ targetEntityId }) => targetEntityId === relationship.targetEntityId);
  const distractors = candidates.filter(({ targetEntityId }) => targetEntityId !== relationship.targetEntityId).slice(0, 3);
  const choices = [correct, ...distractors].filter(Boolean);
  const keys = answerKeys(atlas, relationship.stateId, choices.length);
  const keyedChoices = choices.map((choice, index) => ({ key: keys[index], choice }));
  return {
    id: `us-relationship-${relationship.relationshipType}-${relationship.stateId}-${relationship.targetId}`,
    title: "U.S. Connections",
    prompt: promptFor(relationship),
    answerMode: MENTAL_MAP_ANSWER_MODES.SINGLE_SELECT,
    correctStateIds: [relationship.stateId],
    distractorStateIds: keyedChoices.slice(1).map(({ key }) => key),
    answerLabelsByStateId: Object.fromEntries(keyedChoices.map(({ key, choice }) => [key, choice.targetName])),
    answerEntityIdsByStateId: Object.fromEntries(keyedChoices.map(({ key, choice }) => [key, choice.targetEntityId])),
    explanation: explanationFor(relationship),
    associatedFeatureIds: [relationship.targetEntityId],
    referenceStateId: relationship.stateId,
    category: relationship.relationshipType === UNITED_STATES_RELATIONSHIP_TYPES.REGION_MEMBERSHIP
      ? "capitals-and-regions"
      : relationship.relationshipType === UNITED_STATES_RELATIONSHIP_TYPES.COAST
        ? "coasts-and-waterways"
        : "borders-and-neighbors",
    sourceModule: "united-states-relationship-challenges",
    sourceActivityId: UNITED_STATES_RELATIONSHIP_ACTIVITY_ID,
    canonicalConceptId: relationship.conceptId,
    canonicalSkillId: "relationship-recall",
    promptDirection: "state-to-related-feature",
    relationshipType: relationship.relationshipType,
    relationship: { ...relationship }
  };
}

export function getUnitedStatesRelationshipChallenges(atlas = unitedStatesAtlas) {
  const relationships = getApprovedUnitedStatesAtlasRelationships(atlas);
  const errors = validateApprovedUnitedStatesAtlasRelationships(relationships);
  if (errors.length) throw new Error(`Invalid approved U.S. atlas relationships: ${errors.join(" ")}`);
  return relationships.map((relationship) => createChallenge(relationships, relationship, atlas));
}
