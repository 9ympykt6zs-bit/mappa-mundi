import fs from "node:fs";
import { journeyPresets } from "../../src/journey-presets.js";
import { unitedStatesAtlas } from "../../src/atlas/united-states-atlas-data.js";
import { buildUnitedStatesMemoryTrailItems } from "../../src/united-states-memory-trail-planner.js";

const stateActivityIds = Array.from(
  { length: 11 },
  (_, index) => `us-states-${String(index + 1).padStart(2, "0")}`
);

function readActivities(repositoryRoot, activityId) {
  const sectionId = activityId.replace("us-states-", "");
  const file = `${repositoryRoot}/assets/maps/data/us-states-capitals-${sectionId}.json`;
  const data = JSON.parse(fs.readFileSync(file, "utf8"));
  const stateTargets = (data.features || [])
    .filter((feature) => feature.type === "state")
    .map((feature) => ({ ...feature, kind: "shape" }));
  const statesByAbbreviation = new Map(stateTargets.map((target) => [target.state, target]));
  const capitalTargets = (data.features || [])
    .filter((feature) => feature.type === "capital")
    .map((feature) => ({
      ...feature,
      name: feature.city || feature.name,
      completedLabelName: feature.name,
      easyAcceptShapeTargetId: statesByAbbreviation.get(feature.state)?.id || null,
      kind: "point"
    }));

  return [
    { ...data, id: activityId, targets: stateTargets },
    { ...data, id: `us-capitals-${sectionId}`, targets: capitalTargets }
  ];
}

function buildRegionMap() {
  const entitiesById = new Map(unitedStatesAtlas.entities.map((entity) => [entity.id, entity]));
  return new Map(unitedStatesAtlas.relationships
    .filter((relationship) => relationship.type === "belongsToRegion")
    .map((relationship) => [
      relationship.from.replace("state:", ""),
      entitiesById.get(relationship.to)?.name || relationship.to.replace("region:", "")
    ]));
}

export function loadUnitedStatesSimulationFixture(repositoryRoot) {
  const journey = journeyPresets.find((candidate) => candidate.id === "united-states");
  const activities = stateActivityIds.flatMap((activityId) => readActivities(repositoryRoot, activityId));
  const regionByState = buildRegionMap();
  const items = buildUnitedStatesMemoryTrailItems(journey, activities).map((item) => {
    const stateTargetId = item.type === "state" ? item.targetId : item.relatedStateTargetId;
    return { ...item, censusRegion: regionByState.get(stateTargetId) || null };
  });

  return JSON.parse(JSON.stringify({ journeyId: journey.id, items }));
}
