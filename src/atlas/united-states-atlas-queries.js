import { getEntity, getRelatedEntities, unitedStatesAtlas } from "./united-states-atlas-data.js";

function publicId(entity) {
  return entity.id.slice(entity.id.indexOf(":") + 1);
}

function compareByName(left, right) {
  return left.name.localeCompare(right.name);
}

function copyState(state) {
  if (!state) return null;
  return { id: publicId(state), name: state.name, abbreviation: state.abbreviation };
}

function copyNamedEntity(entity) {
  if (!entity) return null;
  const copy = { id: publicId(entity), name: entity.name };
  if (entity.alternateNames?.length) copy.alternateNames = [...entity.alternateNames];
  if (entity.namePolicyNote) copy.namePolicyNote = entity.namePolicyNote;
  return copy;
}

function getStateEntity(stateId) {
  if (typeof stateId !== "string" || !stateId) return null;
  const entity = getEntity(unitedStatesAtlas, `state:${stateId.toLowerCase()}`);
  return entity?.kind === "state" ? entity : null;
}

function getIncomingStateRelationships(state, types) {
  if (!state) return [];
  const related = types.flatMap((type) => getRelatedEntities(unitedStatesAtlas, state.id, type, "incoming"));
  return [...new Map(related.map((entity) => [entity.id, entity])).values()];
}

export function getStateById(stateId) {
  return copyState(getStateEntity(stateId));
}

export function getStateCapital(stateId) {
  const state = getStateEntity(stateId);
  return copyNamedEntity(getIncomingStateRelationships(state, ["capitalOf"])[0] || null);
}

export function getStateRegion(stateId) {
  const state = getStateEntity(stateId);
  return copyNamedEntity(getRelatedEntities(unitedStatesAtlas, state?.id || "", "belongsToRegion")[0] || null);
}

export function getBorderingStates(stateId) {
  const state = getStateEntity(stateId);
  return getRelatedEntities(unitedStatesAtlas, state?.id || "", "borders")
    .map(copyState)
    .sort(compareByName);
}

export function getConnectedRivers(stateId) {
  return getIncomingStateRelationships(getStateEntity(stateId), ["flowsThrough", "bordersState"])
    .filter((entity) => entity.kind === "river")
    .map(copyNamedEntity)
    .sort(compareByName);
}

export function getConnectedLakes(stateId) {
  return getIncomingStateRelationships(getStateEntity(stateId), ["bordersState"])
    .filter((entity) => entity.kind === "lake")
    .map(copyNamedEntity)
    .sort(compareByName);
}

export function getConnectedMountainRanges(stateId) {
  return getIncomingStateRelationships(getStateEntity(stateId), ["locatedIn"])
    .filter((entity) => entity.kind === "mountain-range")
    .map(copyNamedEntity)
    .sort(compareByName);
}

export function getInternationalNeighbors(stateId) {
  const state = getStateEntity(stateId);
  return getRelatedEntities(unitedStatesAtlas, state?.id || "", "internationalBorder")
    .map(copyNamedEntity)
    .sort(compareByName);
}

export function getMaritimeNeighbors(stateId) {
  const state = getStateEntity(stateId);
  if (!state) return [];
  const entitiesById = new Map(unitedStatesAtlas.entities.map((entity) => [entity.id, entity]));
  return unitedStatesAtlas.relationships
    .filter((relationship) => relationship.type === "maritimeNeighbor" && relationship.from === state.id)
    .map((relationship) => {
      const neighbor = copyNamedEntity(entitiesById.get(relationship.to));
      const via = copyNamedEntity(entitiesById.get(relationship.via));
      return neighbor ? {
        ...neighbor,
        context: via ? `Across the ${via.name}` : "Maritime neighbor"
      } : null;
    })
    .filter(Boolean)
    .sort(compareByName);
}

export function getStateCoasts(stateId) {
  const state = getStateEntity(stateId);
  return getRelatedEntities(unitedStatesAtlas, state?.id || "", "coast")
    .map(copyNamedEntity)
    .sort(compareByName);
}

export function getMajorBorderingWaters(stateId) {
  const state = getStateEntity(stateId);
  return getIncomingStateRelationships(state, ["majorBordersState"])
    .map(copyNamedEntity)
    .sort(compareByName);
}

export function listStatesInRegion(regionId) {
  if (typeof regionId !== "string" || !regionId) return [];
  const region = getEntity(unitedStatesAtlas, `region:${regionId.toLowerCase()}`);
  if (region?.kind !== "region") return [];
  return getRelatedEntities(unitedStatesAtlas, region.id, "belongsToRegion", "incoming")
    .map(copyState)
    .sort(compareByName);
}

export function searchStates(query) {
  if (typeof query !== "string") return [];
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return [];
  return unitedStatesAtlas.entities
    .filter((entity) => entity.kind === "state")
    .filter((state) => state.name.toLowerCase().includes(normalizedQuery) || state.abbreviation.toLowerCase() === normalizedQuery)
    .map(copyState)
    .sort(compareByName);
}

export function getStateProfile(stateId) {
  const state = getStateEntity(stateId);
  if (!state) return null;
  return {
    ...copyState(state),
    capital: getStateCapital(stateId),
    region: getStateRegion(stateId),
    borderingStates: getBorderingStates(stateId),
    internationalNeighbors: getInternationalNeighbors(stateId),
    maritimeNeighbors: getMaritimeNeighbors(stateId),
    coasts: getStateCoasts(stateId),
    majorBorderingWaters: getMajorBorderingWaters(stateId),
    rivers: getConnectedRivers(stateId),
    lakes: getConnectedLakes(stateId),
    mountainRanges: getConnectedMountainRanges(stateId)
  };
}
