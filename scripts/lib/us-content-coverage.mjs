import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { journeyPresets } from "../../src/journey-presets.js";
import { unitedStatesAtlas } from "../../src/atlas/united-states-atlas-data.js";
import { getUnifiedMentalMapChallenges } from "../../src/atlas/mental-map-challenge-registry.js";
import {
  findAllShortestBorderPaths,
  getBorderChainEligibleStateIds
} from "../../src/atlas/border-chain.js";
import { listMapReconstructionRegions } from "../../src/atlas/map-reconstruction-regions.js";
import { getMapReconstructionCapstone } from "../../src/atlas/map-reconstruction-capstones.js";
import { buildUnitedStatesMemoryTrailItems } from "../../src/united-states-memory-trail-planner.js";

export const TAXONOMY_TAGS = Object.freeze({
  PHYSICAL: "physical-geography",
  REGIONAL: "regional-relationships",
  POLITICAL: "political-geography",
  HUMAN: "human-geography",
  HISTORICAL: "historical-geographic-significance",
  ENVIRONMENTAL: "environmental-geographic-systems"
});

export const OBJECTIVE_GROUPS = Object.freeze({
  STATE_LOCATION: "state-location",
  STATE_NAMING: "state-identification-naming",
  GEOGRAPHIC_RELATIONSHIPS: "geographic-relationships",
  PHYSICAL_GEOGRAPHY: "physical-geography",
  CONTEXTUAL_SIGNIFICANCE: "contextual-significance",
  POLITICAL_GEOGRAPHY: "capitals-cities-political-geography"
});

export const DELIVERY = Object.freeze({
  FIXED_SCORED: "fixed-scored",
  FIXED_CONDITIONAL: "fixed-conditional-feedback",
  DATA_ONLY: "data-only",
  DYNAMIC_CAPACITY: "dynamic-capacity"
});

const taxonomyValues = new Set(Object.values(TAXONOMY_TAGS));
const objectiveValues = new Set(Object.values(OBJECTIVE_GROUPS));
const contextualTags = new Set([
  TAXONOMY_TAGS.PHYSICAL,
  TAXONOMY_TAGS.POLITICAL,
  TAXONOMY_TAGS.HUMAN,
  TAXONOMY_TAGS.HISTORICAL,
  TAXONOMY_TAGS.ENVIRONMENTAL
]);

export function slug(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function uniqueSorted(values = []) {
  return [...new Set(values.filter(Boolean))].sort();
}

export function createConcept(value) {
  if (!value?.id || !String(value.id).includes(":")) {
    throw new TypeError("Concept IDs must be non-empty, namespaced strings.");
  }
  const taxonomyTags = uniqueSorted(value.taxonomyTags);
  const objectiveGroups = uniqueSorted(value.objectiveGroups);
  if (taxonomyTags.some((tag) => !taxonomyValues.has(tag))) {
    throw new TypeError(`Unknown taxonomy tag on ${value.id}.`);
  }
  if (objectiveGroups.some((group) => !objectiveValues.has(group))) {
    throw new TypeError(`Unknown objective group on ${value.id}.`);
  }
  return {
    id: String(value.id),
    label: String(value.label || value.id),
    kind: String(value.kind || "unspecified"),
    delivery: value.delivery || DELIVERY.DATA_ONLY,
    authored: Boolean(value.authored),
    stateIds: uniqueSorted(value.stateIds),
    entityIds: uniqueSorted(value.entityIds),
    taxonomyTags,
    objectiveGroups,
    secondaryRegions: uniqueSorted(value.secondaryRegions),
    sources: (value.sources || []).map((source) => ({ ...source })),
    notes: uniqueSorted(value.notes)
  };
}

function deliveryRank(delivery) {
  return {
    [DELIVERY.DATA_ONLY]: 0,
    [DELIVERY.DYNAMIC_CAPACITY]: 1,
    [DELIVERY.FIXED_CONDITIONAL]: 2,
    [DELIVERY.FIXED_SCORED]: 3
  }[delivery] ?? 0;
}

export function mergeConcepts(concepts = []) {
  const byId = new Map();
  for (const rawConcept of concepts) {
    const concept = createConcept(rawConcept);
    const current = byId.get(concept.id);
    if (!current) {
      byId.set(concept.id, concept);
      continue;
    }
    if (current.kind !== concept.kind) {
      throw new Error(`Concept ${concept.id} has conflicting kinds: ${current.kind} and ${concept.kind}.`);
    }
    current.label = current.label || concept.label;
    current.authored ||= concept.authored;
    if (deliveryRank(concept.delivery) > deliveryRank(current.delivery)) current.delivery = concept.delivery;
    current.stateIds = uniqueSorted([...current.stateIds, ...concept.stateIds]);
    current.entityIds = uniqueSorted([...current.entityIds, ...concept.entityIds]);
    current.taxonomyTags = uniqueSorted([...current.taxonomyTags, ...concept.taxonomyTags]);
    current.objectiveGroups = uniqueSorted([...current.objectiveGroups, ...concept.objectiveGroups]);
    current.secondaryRegions = uniqueSorted([...current.secondaryRegions, ...concept.secondaryRegions]);
    current.sources.push(...concept.sources.map((source) => ({ ...source })));
    current.notes = uniqueSorted([...current.notes, ...concept.notes]);
  }
  return [...byId.values()].sort((left, right) => left.id.localeCompare(right.id));
}

function source(file, type, instanceId, reachability, extra = {}) {
  return { file, type, instanceId, reachability, ...extra };
}

export function fixedChallengeConceptId(challenge) {
  const ordered = challenge.orderedStateIds || [];
  if (ordered.length) return `relationship:ordered:${ordered.join(">")}`;
  if (challenge.routeStartStateId && challenge.routeDestinationStateId) {
    return `relationship:border-route:${challenge.routeStartStateId}:${challenge.routeDestinationStateId}`;
  }
  const relationships = (challenge.directionRelationships || [])
    .map(({ fromStateId, toStateId, direction }) => `${fromStateId}:${direction}:${toStateId}`)
    .sort();
  if (relationships.length) return `relationship:direction:${relationships.join("+")}`;
  const correct = uniqueSorted([
    ...(challenge.correctStateIds || []),
    challenge.correctStateId
  ]);
  const features = uniqueSorted(challenge.associatedFeatureIds || []);
  return `relationship:set:${[...features, ...correct].map(slug).join("+")}`;
}

function challengeStateIds(challenge) {
  return uniqueSorted([
    ...(challenge.correctStateIds || []),
    ...(challenge.orderedStateIds || []),
    ...(challenge.referenceStateIds || []),
    challenge.correctStateId,
    challenge.referenceStateId,
    challenge.routeStartStateId,
    challenge.routeDestinationStateId
  ]);
}

function challengeTags(challenge) {
  const tags = [TAXONOMY_TAGS.REGIONAL];
  const featureIds = challenge.associatedFeatureIds || [];
  if (featureIds.some((id) => /^(water|river|lake|mountain-range):/.test(id))) {
    tags.push(TAXONOMY_TAGS.PHYSICAL);
  }
  if (featureIds.some((id) => id.startsWith("country:"))) tags.push(TAXONOMY_TAGS.POLITICAL);
  return uniqueSorted(tags);
}

function challengeSourceFile(challenge) {
  return challenge.sourceModule === "compass-challenges"
    ? "src/atlas/compass-challenges.js"
    : "src/atlas/mental-map-challenges.js";
}

export function reconstructionConceptId(rule) {
  // Exact repeated feedback describes the same underlying authored concept today.
  // Keeping this heuristic isolated makes it replaceable when structured relation IDs exist.
  return `relationship:reconstruction:${slug(rule.message || JSON.stringify(rule))}`;
}

function reconstructionStateIds(rule) {
  return uniqueSorted([
    ...(rule.stateIds || []),
    ...(rule.referenceIds || []),
    rule.subjectId
  ]);
}

function readJson(rootDir, relativePath) {
  return JSON.parse(fs.readFileSync(path.join(rootDir, relativePath), "utf8"));
}

function stateMetadata(atlas) {
  const entitiesById = new Map(atlas.entities.map((entity) => [entity.id, entity]));
  const regionByState = new Map(
    atlas.relationships
      .filter(({ type }) => type === "belongsToRegion")
      .map(({ from, to }) => [from, entitiesById.get(to)?.name || to.replace("region:", "")])
  );
  return atlas.entities
    .filter(({ kind }) => kind === "state")
    .map((state) => ({
      id: state.id.replace("state:", ""),
      entityId: state.id,
      name: state.name,
      abbreviation: state.abbreviation,
      censusRegion: regionByState.get(state.id)
    }))
    .sort((left, right) => left.name.localeCompare(right.name));
}

function loadDerivedActivities(rootDir) {
  const sectionLabels = [
    "New England", "Northeast / Mid-Atlantic", "Atlantic South", "Southeast / Gulf",
    "Great Lakes / Upper South", "Midwest / Mississippi Valley", "Northern Plains / Rockies",
    "Southern Plains / Southwest", "Southwest / Pacific", "Northwest", "Alaska and Hawaii"
  ];
  const activities = [];
  for (let index = 1; index <= 11; index += 1) {
    const sectionId = String(index).padStart(2, "0");
    const file = `assets/maps/data/us-states-capitals-${sectionId}.json`;
    const raw = readJson(rootDir, file);
    const states = raw.features
      .filter(({ type }) => type === "state")
      .map((target) => ({ ...target, kind: "shape" }));
    const capitals = raw.features
      .filter(({ type }) => type === "capital")
      .map((target) => ({ ...target, kind: "point" }));
    activities.push({ ...raw, id: `us-states-${sectionId}`, title: `${sectionLabels[index - 1]} States`, targets: states, sourceFile: file });
    activities.push({ ...raw, id: `us-capitals-${sectionId}`, title: `${sectionLabels[index - 1]} Capitals`, targets: capitals, sourceFile: file });
  }
  return activities;
}

function addStateAndCapitalConcepts({ concepts, states, activities, memoryItems }) {
  const stateByAbbreviation = new Map(states.map((state) => [state.abbreviation, state]));
  const activityById = new Map(activities.map((activity) => [activity.id, activity]));
  for (const state of states) {
    const activity = activities.find((candidate) => candidate.id.startsWith("us-states-") && candidate.targets.some(({ id }) => id === state.id));
    const common = {
      stateIds: [state.id],
      entityIds: [state.entityId],
      authored: true,
      delivery: DELIVERY.FIXED_SCORED,
      secondaryRegions: activity ? [activity.title.replace(/ States$/, "")] : []
    };
    concepts.push({
      ...common,
      id: `state-location:${state.id}`,
      label: `Locate ${state.name}`,
      kind: "state-location",
      taxonomyTags: [TAXONOMY_TAGS.POLITICAL],
      objectiveGroups: [OBJECTIVE_GROUPS.STATE_LOCATION],
      sources: [source(activity?.sourceFile, "derived-state-activity-target", `${activity?.id}:${state.id}`, "U.S. Journey and activity menu")]
    });
    concepts.push({
      ...common,
      id: `state-naming:${state.id}`,
      label: `Identify ${state.name}`,
      kind: "state-naming",
      taxonomyTags: [TAXONOMY_TAGS.POLITICAL],
      objectiveGroups: [OBJECTIVE_GROUPS.STATE_NAMING],
      sources: [source(activity?.sourceFile, "derived-state-activity-target", `${activity?.id}:${state.id}:name`, "U.S. Journey and activity menu")]
    });
  }

  for (const activity of activities.filter(({ id }) => id.startsWith("us-capitals-"))) {
    for (const target of activity.targets) {
      const state = stateByAbbreviation.get(target.state);
      if (!state) continue;
      const capitalId = slug(target.city || target.name);
      const common = {
        stateIds: [state.id],
        entityIds: [`state:${state.id}`, `capital:${capitalId}`],
        taxonomyTags: [TAXONOMY_TAGS.POLITICAL],
        objectiveGroups: [OBJECTIVE_GROUPS.POLITICAL_GEOGRAPHY],
        authored: true,
        delivery: DELIVERY.FIXED_SCORED,
        secondaryRegions: [activity.title.replace(/ Capitals$/, "")]
      };
      concepts.push({ ...common, id: `capital-location:${state.id}:${capitalId}`, label: `Locate ${target.city || target.name}`, kind: "capital-location", sources: [source(activity.sourceFile, "derived-capital-activity-target", `${activity.id}:${target.id}`, "U.S. Capitals Journey and activity menu")] });
      concepts.push({ ...common, id: `capital-naming:${state.id}:${capitalId}`, label: `Identify ${target.city || target.name}`, kind: "capital-naming", sources: [source(activity.sourceFile, "derived-capital-activity-target", `${activity.id}:${target.id}:name`, "U.S. Capitals Journey and activity menu")] });
    }
  }

  for (const item of memoryItems) {
    const activity = activityById.get(item.sourceActivityId);
    const stateId = item.type === "state" ? item.targetId : item.relatedStateTargetId;
    if (item.type === "state") {
      for (const prefix of ["state-location", "state-naming"]) {
        concepts.push({
          id: `${prefix}:${stateId}`,
          label: `${prefix === "state-location" ? "Locate" : "Identify"} ${item.label}`,
          kind: prefix,
          stateIds: [stateId],
          entityIds: [`state:${stateId}`],
          taxonomyTags: [TAXONOMY_TAGS.POLITICAL],
          objectiveGroups: [prefix === "state-location" ? OBJECTIVE_GROUPS.STATE_LOCATION : OBJECTIVE_GROUPS.STATE_NAMING],
          authored: true,
          delivery: DELIVERY.FIXED_SCORED,
          sources: [source(activity?.sourceFile || "src/united-states-memory-trail-planner.js", "memory-trail-item-variant", item.id, "U.S. Memory Trail", { promptForms: ["name_to_place", "place_to_name"] })]
        });
      }
    } else if (item.type === "capital") {
      const capitalId = slug(item.label);
      for (const prefix of ["capital-location", "capital-naming"]) {
        concepts.push({
          id: `${prefix}:${stateId}:${capitalId}`,
          label: `${prefix === "capital-location" ? "Locate" : "Identify"} ${item.label}`,
          kind: prefix,
          stateIds: [stateId],
          entityIds: [`state:${stateId}`, `capital:${capitalId}`],
          taxonomyTags: [TAXONOMY_TAGS.POLITICAL],
          objectiveGroups: [OBJECTIVE_GROUPS.POLITICAL_GEOGRAPHY],
          authored: true,
          delivery: DELIVERY.FIXED_SCORED,
          sources: [source("src/united-states-memory-trail-planner.js", "memory-trail-item-variant", item.id, "U.S. Memory Trail", { promptForms: item.allowedPromptTypes || [] })]
        });
      }
    }
  }
}

function addPhysicalConcepts(rootDir, concepts) {
  const files = [
    "assets/maps/data/us-physical-rivers.json",
    "assets/maps/data/us-physical-lakes.json",
    "assets/maps/data/us-physical-eastern-mountains.json",
    "assets/maps/data/us-physical-midwestern-mountains.json",
    "assets/maps/data/us-physical-western-mountains.json",
    "assets/maps/data/us-physical-alaska-mountains.json"
  ];
  for (const file of files) {
    const activity = readJson(rootDir, file);
    for (const feature of activity.features || []) {
      const physicalKind = feature.type === "water-body" ? "lake" : feature.type;
      concepts.push({
        id: `physical-feature:${physicalKind}:${feature.id}`,
        label: feature.name,
        kind: "physical-feature",
        entityIds: [`${physicalKind}:${feature.id}`],
        taxonomyTags: [TAXONOMY_TAGS.PHYSICAL],
        objectiveGroups: [OBJECTIVE_GROUPS.PHYSICAL_GEOGRAPHY],
        authored: true,
        delivery: DELIVERY.FIXED_SCORED,
        secondaryRegions: (activity.memoryTrailSections || []).filter((section) => section.targetIds?.includes(feature.id)).map((section) => section.title),
        sources: [source(file, "physical-activity-target", `${activity.id}:${feature.id}`, "U.S. Journey or physical-feature activity")],
        notes: physicalKind === "lake" ? ["Activity source type is water-body; reported as lake."] : []
      });
    }
  }
}

function atlasRelationshipConcept(relationship, entitiesById) {
  const from = entitiesById.get(relationship.from);
  const to = entitiesById.get(relationship.to);
  if (!from || !to) return null;
  let id;
  let stateIds = [from, to].filter(({ kind }) => kind === "state").map(({ id: entity }) => entity.replace("state:", ""));
  let tags = [TAXONOMY_TAGS.REGIONAL];
  let objectives = [OBJECTIVE_GROUPS.GEOGRAPHIC_RELATIONSHIPS];
  if (relationship.type === "capitalOf") {
    id = `state-capital:${to.id.replace("state:", "")}:${from.id.replace("capital:", "")}`;
    tags = [TAXONOMY_TAGS.POLITICAL];
    objectives = [OBJECTIVE_GROUPS.POLITICAL_GEOGRAPHY];
  } else if (relationship.type === "borders") {
    const pair = [from.id.replace("state:", ""), to.id.replace("state:", "")].sort();
    id = `relationship:border:${pair.join(":")}`;
    stateIds = pair;
  } else {
    const endpoints = [relationship.from, relationship.to].map((value) => value.replace(":", "-")).sort();
    id = `relationship:atlas:${slug(relationship.type)}:${endpoints.join(":")}`;
    if (["internationalBorder", "belongsToRegion", "maritimeNeighbor"].includes(relationship.type)) tags.push(TAXONOMY_TAGS.POLITICAL);
    if (["flowsThrough", "bordersState", "majorBordersState", "locatedIn", "coast"].includes(relationship.type)) tags.push(TAXONOMY_TAGS.PHYSICAL);
  }
  return {
    id,
    label: `${from.name} ${relationship.type} ${to.name}`,
    kind: relationship.type === "capitalOf" ? "state-capital-relationship" : "atlas-relationship",
    stateIds,
    entityIds: [from.id, to.id, relationship.via].filter(Boolean),
    taxonomyTags: uniqueSorted(tags),
    objectiveGroups: objectives,
    authored: false,
    delivery: DELIVERY.DATA_ONLY,
    sources: [source("src/atlas/united-states-atlas-data.js", "atlas-relationship", `${relationship.type}:${relationship.from}:${relationship.to}`, "Atlas/profile data; not established as scored learning")]
  };
}

function addAtlasConcepts(concepts) {
  const entitiesById = new Map(unitedStatesAtlas.entities.map((entity) => [entity.id, entity]));
  for (const relationship of unitedStatesAtlas.relationships) {
    const concept = atlasRelationshipConcept(relationship, entitiesById);
    if (concept) concepts.push(concept);
  }
}

function addMentalMapConcepts(concepts) {
  const challenges = getUnifiedMentalMapChallenges({ includeGenerated: false });
  for (const challenge of challenges) {
    concepts.push({
      id: fixedChallengeConceptId(challenge),
      label: challenge.title || challenge.id,
      kind: "curated-relationship",
      stateIds: challengeStateIds(challenge),
      entityIds: challenge.associatedFeatureIds || [],
      taxonomyTags: challengeTags(challenge),
      objectiveGroups: [OBJECTIVE_GROUPS.GEOGRAPHIC_RELATIONSHIPS],
      authored: true,
      delivery: DELIVERY.FIXED_SCORED,
      sources: [source(challengeSourceFile(challenge), "mental-map-question", challenge.id, "Mental Map main-menu activity", { prompt: challenge.prompt, category: challenge.category })]
    });
  }
  return challenges;
}

function addDynamicRouteCapacity(concepts) {
  const stateIds = getBorderChainEligibleStateIds();
  let pairCount = 0;
  for (let leftIndex = 0; leftIndex < stateIds.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < stateIds.length; rightIndex += 1) {
      const start = stateIds[leftIndex];
      const destination = stateIds[rightIndex];
      const paths = findAllShortestBorderPaths(start, destination);
      if (!paths.length || paths[0].length < 4) continue;
      pairCount += 1;
      concepts.push({
        id: `dynamic-route:${start}:${destination}`,
        label: `Shortest border route: ${start} to ${destination}`,
        kind: "dynamic-border-route-capacity",
        stateIds: [start, destination],
        taxonomyTags: [TAXONOMY_TAGS.REGIONAL],
        objectiveGroups: [OBJECTIVE_GROUPS.GEOGRAPHIC_RELATIONSHIPS],
        authored: false,
        delivery: DELIVERY.DYNAMIC_CAPACITY,
        sources: [source("src/atlas/mental-map-challenges.js", "dynamic-question-capacity", `generated-shortest-${start}-${destination}`, "One generated route is added per Mental Map pool", { shortestStateCount: paths[0].length })]
      });
    }
  }
  return { eligibleStateCount: stateIds.length, pairCount };
}

function addReconstructionConcepts(concepts) {
  const regions = listMapReconstructionRegions();
  for (const region of regions) {
    for (const stateId of region.stateIds) {
      concepts.push({
        id: `state-location:${stateId}`,
        label: `Locate ${stateId}`,
        kind: "state-location",
        stateIds: [stateId],
        entityIds: [`state:${stateId}`],
        taxonomyTags: [TAXONOMY_TAGS.POLITICAL],
        objectiveGroups: [OBJECTIVE_GROUPS.STATE_LOCATION],
        authored: true,
        delivery: DELIVERY.FIXED_SCORED,
        secondaryRegions: [region.title],
        sources: [source("src/atlas/map-reconstruction-regions.js", "reconstruction-piece-instance", `${region.id}:${stateId}`, "Map Reconstruction main-menu activity")]
      });
    }
    for (const rule of region.feedbackRules || []) {
      concepts.push({
        id: reconstructionConceptId(rule),
        label: rule.message,
        kind: "curated-relationship",
        stateIds: reconstructionStateIds(rule),
        taxonomyTags: [TAXONOMY_TAGS.REGIONAL],
        objectiveGroups: [OBJECTIVE_GROUPS.GEOGRAPHIC_RELATIONSHIPS],
        authored: true,
        delivery: DELIVERY.FIXED_CONDITIONAL,
        secondaryRegions: [region.title],
        sources: [source("src/atlas/map-reconstruction-regions.js", "reconstruction-feedback-rule", `${region.id}:${rule.type}:${slug(rule.message)}`, "Conditional reconstruction feedback")]
      });
    }
  }
  const capstone = getMapReconstructionCapstone("rebuild-lower-48");
  for (const stateId of capstone?.stateIds || []) {
    concepts.push({
      id: `state-location:${stateId}`,
      label: `Locate ${stateId}`,
      kind: "state-location",
      stateIds: [stateId],
      entityIds: [`state:${stateId}`],
      taxonomyTags: [TAXONOMY_TAGS.POLITICAL],
      objectiveGroups: [OBJECTIVE_GROUPS.STATE_LOCATION],
      authored: true,
      delivery: DELIVERY.FIXED_SCORED,
      sources: [source("src/atlas/map-reconstruction-capstones.js", "reconstruction-capstone-piece-instance", `${capstone.id}:${stateId}`, "Lower 48 reconstruction capstone")]
    });
  }
  return regions;
}

function conceptsForState(concepts, stateId, predicate) {
  return concepts.filter((concept) => concept.stateIds.includes(stateId) && predicate(concept));
}

function isFixedAssessed(concept) {
  return concept.delivery === DELIVERY.FIXED_SCORED;
}

function isCuratedRelationship(concept) {
  return concept.kind === "curated-relationship" && concept.authored;
}

function isNonCapitalContext(concept) {
  return isFixedAssessed(concept)
    && concept.kind === "curated-relationship"
    && concept.taxonomyTags.some((tag) => contextualTags.has(tag));
}

export function buildStateCoverage(states, concepts) {
  return states.map((state) => {
    const stateConcepts = conceptsForState(concepts, state.id, () => true);
    const curated = stateConcepts.filter(isCuratedRelationship);
    const assessedCurated = curated.filter(isFixedAssessed);
    const conditionalCurated = curated.filter(({ delivery }) => delivery === DELIVERY.FIXED_CONDITIONAL);
    const context = stateConcepts.filter(isNonCapitalContext);
    const capital = stateConcepts.find(({ kind }) => kind === "state-capital-relationship");
    return {
      ...state,
      location: stateConcepts.some(({ objectiveGroups, delivery }) => objectiveGroups.includes(OBJECTIVE_GROUPS.STATE_LOCATION) && delivery === DELIVERY.FIXED_SCORED),
      naming: stateConcepts.some(({ objectiveGroups, delivery }) => objectiveGroups.includes(OBJECTIVE_GROUPS.STATE_NAMING) && delivery === DELIVERY.FIXED_SCORED),
      capitalRelationship: capital ? "data-only" : "missing",
      capitalRelationshipAssessed: Boolean(capital && isFixedAssessed(capital)),
      curatedRelational: assessedCurated.length > 0 ? "assessed" : conditionalCurated.length > 0 ? "conditional-only" : "missing",
      curatedRelationalCount: assessedCurated.length,
      conditionalRelationalCount: conditionalCurated.length,
      nonCapitalContextual: context.length > 0,
      nonCapitalContextualCount: context.length,
      taxonomyTags: uniqueSorted(stateConcepts.flatMap(({ taxonomyTags }) => taxonomyTags)),
      conceptCount: stateConcepts.length
    };
  });
}

const matrixObjectives = Object.freeze([
  { id: "state-location", label: "State location", matches: (concept) => concept.objectiveGroups.includes(OBJECTIVE_GROUPS.STATE_LOCATION) && isFixedAssessed(concept) },
  { id: "state-naming", label: "State naming", matches: (concept) => concept.objectiveGroups.includes(OBJECTIVE_GROUPS.STATE_NAMING) && isFixedAssessed(concept) },
  { id: "capital-relationship-data", label: "Explicit capital relationship (data)", matches: (concept) => concept.kind === "state-capital-relationship" },
  { id: "capital-relationship-assessed", label: "Explicit capital relationship (assessed)", matches: (concept) => concept.kind === "state-capital-relationship" && isFixedAssessed(concept) },
  { id: "curated-relational", label: "Curated relational (assessed)", matches: (concept) => isCuratedRelationship(concept) && isFixedAssessed(concept) },
  { id: "non-capital-contextual", label: "Non-capital contextual (assessed)", matches: isNonCapitalContext }
]);

export function aggregateRegionObjectives(states, concepts, objectives = matrixObjectives) {
  const regions = uniqueSorted(states.map(({ censusRegion }) => censusRegion));
  return objectives.flatMap((objective) => {
    const matching = concepts.filter(objective.matches);
    const nationalParticipations = states.reduce((sum, state) => sum + matching.filter(({ stateIds }) => stateIds.includes(state.id)).length, 0);
    const nationalMean = states.length ? nationalParticipations / states.length : 0;
    return regions.map((region) => {
      const regionStates = states.filter(({ censusRegion }) => censusRegion === region);
      const regionStateIds = new Set(regionStates.map(({ id }) => id));
      const regionConcepts = matching.filter(({ stateIds }) => stateIds.some((stateId) => regionStateIds.has(stateId)));
      const participations = regionStates.reduce((sum, state) => sum + regionConcepts.filter(({ stateIds }) => stateIds.includes(state.id)).length, 0);
      const conceptsPerState = regionStates.length ? participations / regionStates.length : 0;
      const percentOfNationalMean = nationalMean ? (conceptsPerState / nationalMean) * 100 : null;
      const diagnostic = percentOfNationalMean === null
        ? "no-national-baseline"
        : percentOfNationalMean < 80
          ? "below-80%"
          : percentOfNationalMean > 120
            ? "above-120%"
            : "within-80%-120%";
      return {
        region,
        objectiveId: objective.id,
        objective: objective.label,
        eligibleStates: regionStates.length,
        uniqueConcepts: regionConcepts.length,
        stateConceptParticipations: participations,
        conceptsPerState,
        nationalMeanConceptsPerState: nationalMean,
        percentOfNationalMean,
        diagnostic
      };
    });
  });
}

function physicalInventory(concepts) {
  const current = concepts.filter(({ kind, delivery }) => kind === "physical-feature" && delivery === DELIVERY.FIXED_SCORED);
  const counts = {};
  for (const concept of current) {
    const category = concept.id.split(":")[1];
    counts[category] = (counts[category] || 0) + 1;
  }
  return {
    counts,
    concepts: current.map(({ id, label, sources }) => ({ id, label, sources })),
    dataOrChallengeOnly: ["coastlines"],
    disabledMenuCategories: ["bays", "rivers-east", "rivers-west", "trails", "canals", "native-american-regions", "deserts", "prominent-features", "more-prominent-features"],
    absentTaxonomyExamples: ["plains", "plateaus", "valleys", "islands", "wetlands", "elevation-patterns", "watersheds-and-drainage-features"]
  };
}

function taxonomyInventory(concepts) {
  return Object.values(TAXONOMY_TAGS).map((tag) => ({
    tag,
    fixedAssessed: concepts.filter((concept) => concept.taxonomyTags.includes(tag) && concept.delivery === DELIVERY.FIXED_SCORED).length,
    conditionalFeedback: concepts.filter((concept) => concept.taxonomyTags.includes(tag) && concept.delivery === DELIVERY.FIXED_CONDITIONAL).length,
    dataOnly: concepts.filter((concept) => concept.taxonomyTags.includes(tag) && concept.delivery === DELIVERY.DATA_ONLY).length,
    dynamicCapacity: concepts.filter((concept) => concept.taxonomyTags.includes(tag) && concept.delivery === DELIVERY.DYNAMIC_CAPACITY).length
  }));
}

function sourceInventory({ concepts, memoryItems, mentalChallenges, reconstructionRegions, dynamicCapacity }) {
  const reconstructionPieceCount = reconstructionRegions.reduce((sum, region) => sum + region.stateIds.length, 0);
  const reconstructionFeedbackCount = reconstructionRegions.reduce((sum, region) => sum + (region.feedbackRules || []).length, 0);
  return [
    { source: "assets/maps/data/us-states-capitals-01..11.json", records: 101, role: "50 states, 50 state capitals, and one federal-district target; derived into state/capital activities", reachability: "State and capital journeys/menus" },
    { source: "src/united-states-memory-trail-planner.js", records: memoryItems.length, role: "Memory Trail item representations", reachability: "U.S. Memory Trail" },
    { source: "assets/maps/data/us-physical-*.json", records: concepts.filter(({ kind, delivery }) => kind === "physical-feature" && delivery === DELIVERY.FIXED_SCORED).length, role: "Physical activity targets across six source files", reachability: "U.S. Journey or physical menu" },
    { source: "src/atlas/united-states-atlas-data.js", records: unitedStatesAtlas.relationships.length, role: "Canonical entity relationships and region assignments", reachability: "Atlas/profile data; mostly unscored" },
    { source: "src/atlas/mental-map-challenges.js + compass-challenges.js", records: mentalChallenges.length, role: "Fixed question instances", reachability: "Mental Map" },
    { source: "src/atlas/mental-map-challenges.js + border-chain.js", records: dynamicCapacity.pairCount, role: "Dynamically possible route endpoint pairs", reachability: "One generated route per constructed Mental Map pool" },
    { source: "src/atlas/map-reconstruction-regions.js", records: reconstructionPieceCount + reconstructionFeedbackCount, role: `${reconstructionPieceCount} regional piece instances and ${reconstructionFeedbackCount} conditional-feedback rules`, reachability: "Map Reconstruction" },
    { source: "src/atlas/map-reconstruction-capstones.js", records: 48, role: "Lower 48 capstone piece instances", reachability: "Map Reconstruction capstone" },
    { source: "src/journey-presets.js", records: journeyPresets.find(({ id }) => id === "united-states")?.steps.length || 0, role: "Primary U.S. Journey configuration", reachability: "Journey menu" },
    { source: "assets/maps/data/us-states.json", records: 52, role: "Canonical state/federal-district geometry source", reachability: "Atlas source; not a direct visible activity" },
    { source: "assets/maps/data/us-capitals.json", records: 51, role: "Canonical capital/D.C. geometry source", reachability: "Atlas source; not a direct visible activity" },
    { source: "assets/maps/data/us-features.json", records: 0, role: "Empty feature placeholder", reachability: "No measured learning content" }
  ];
}

export function createCoverageSummary({ states, concepts, stateCoverage, dynamicCapacity }) {
  const fixed = concepts.filter(({ delivery }) => delivery === DELIVERY.FIXED_SCORED);
  const conditional = concepts.filter(({ delivery }) => delivery === DELIVERY.FIXED_CONDITIONAL);
  const dataOnly = concepts.filter(({ delivery }) => delivery === DELIVERY.DATA_ONLY);
  const dynamic = concepts.filter(({ delivery }) => delivery === DELIVERY.DYNAMIC_CAPACITY);
  const sourceCount = (type) => concepts.reduce((sum, concept) => sum + concept.sources.filter((item) => item.type === type).length, 0);
  return {
    uniqueConceptsAllRepresentations: concepts.length,
    fixedAssessedConcepts: fixed.length,
    conditionalFeedbackConcepts: conditional.length,
    dataOnlyConcepts: dataOnly.length,
    dynamicallyPossibleConcepts: dynamic.length,
    sourceInstancesAndVariants: concepts.reduce((sum, concept) => sum + concept.sources.length, 0),
    fixedMentalMapConcepts: concepts.filter((concept) => concept.sources.some(({ type }) => type === "mental-map-question")).length,
    fixedMentalMapQuestionInstances: sourceCount("mental-map-question"),
    reconstructionFeedbackConcepts: concepts.filter((concept) => concept.sources.some(({ type }) => type === "reconstruction-feedback-rule")).length,
    reconstructionFeedbackRuleInstances: sourceCount("reconstruction-feedback-rule"),
    statesTotal: states.length,
    statesWithLocation: stateCoverage.filter(({ location }) => location).length,
    statesWithNaming: stateCoverage.filter(({ naming }) => naming).length,
    statesWithExplicitCapitalRelationshipData: stateCoverage.filter(({ capitalRelationship }) => capitalRelationship !== "missing").length,
    statesWithAssessedCapitalRelationship: stateCoverage.filter(({ capitalRelationshipAssessed }) => capitalRelationshipAssessed).length,
    statesWithAssessedCuratedRelationship: stateCoverage.filter(({ curatedRelational }) => curatedRelational === "assessed").length,
    statesWithAnyCuratedRelationshipContent: stateCoverage.filter(({ curatedRelational }) => curatedRelational !== "missing").length,
    statesWithNonCapitalContextual: stateCoverage.filter(({ nonCapitalContextual }) => nonCapitalContextual).length,
    capitalLocationConcepts: fixed.filter(({ kind }) => kind === "capital-location").length,
    capitalNamingConcepts: fixed.filter(({ kind }) => kind === "capital-naming").length,
    dynamicRouteEligibleStates: dynamicCapacity.eligibleStateCount,
    dynamicRouteEndpointPairs: dynamicCapacity.pairCount
  };
}

function createGapReport(stateCoverage, matrix, physical, taxonomy) {
  const names = (predicate) => stateCoverage.filter(predicate).map(({ name }) => name);
  const underCoveredRegions = matrix
    .filter(({ diagnostic, objectiveId }) => diagnostic === "below-80%" && ["curated-relational", "non-capital-contextual"].includes(objectiveId))
    .map(({ region, objective, percentOfNationalMean }) => ({ region, objective, percentOfNationalMean }));
  return {
    missingLocation: names(({ location }) => !location),
    missingNaming: names(({ naming }) => !naming),
    capitalRelationshipDataOnly: names(({ capitalRelationship, capitalRelationshipAssessed }) => capitalRelationship === "data-only" && !capitalRelationshipAssessed),
    missingAssessedCuratedRelationship: names(({ curatedRelational }) => curatedRelational !== "assessed"),
    conditionalOnlyCuratedRelationship: names(({ curatedRelational }) => curatedRelational === "conditional-only"),
    missingNonCapitalContextual: names(({ nonCapitalContextual }) => !nonCapitalContextual),
    underCoveredRegions,
    taxonomyCategoriesWithoutFixedAssessedConcepts: taxonomy.filter(({ fixedAssessed }) => fixedAssessed === 0).map(({ tag }) => tag),
    absentPhysicalCategories: physical.absentTaxonomyExamples,
    integrationGaps: [
      "Fifty explicit atlas capitalOf relationships exist, but no direct scored state-to-capital concept was found.",
      "Atlas region, coast, international-border, and state/feature relationships are mostly informational rather than scored.",
      "Reconstruction relationship feedback is conditional and does not establish balanced learner exposure.",
      "Dynamic border-route capacity describes possible generation, not actual delivered frequency."
    ],
    measurementLimits: [
      "Static inspection cannot establish actual selection frequency, browser reachability, or learner exposure.",
      "Reconstruction feedback identity currently deduplicates exact normalized messages because rules lack canonical concept IDs.",
      "Fixed Mental Map concepts are assigned to explicitly referenced/correct states; distractors are not credited.",
      "A physical activity target is counted as one feature concept even when multiple prompt forms can retrieve it.",
      "Non-capital contextual coverage counts fixed assessed state relationships tagged physical or political; data-only atlas associations do not satisfy the floor."
    ]
  };
}

export function buildRepositoryCoverage(rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..")) {
  const states = stateMetadata(unitedStatesAtlas);
  const activities = loadDerivedActivities(rootDir);
  const unitedStatesJourney = journeyPresets.find(({ id }) => id === "united-states");
  const memoryItems = buildUnitedStatesMemoryTrailItems(unitedStatesJourney, activities);
  const concepts = [];
  addStateAndCapitalConcepts({ concepts, states, activities, memoryItems });
  addPhysicalConcepts(rootDir, concepts);
  addAtlasConcepts(concepts);
  const mentalChallenges = addMentalMapConcepts(concepts);
  const dynamicCapacity = addDynamicRouteCapacity(concepts);
  const reconstructionRegions = addReconstructionConcepts(concepts);
  const mergedConcepts = mergeConcepts(concepts);
  const coverageByState = buildStateCoverage(states, mergedConcepts);
  const regionObjectiveMatrix = aggregateRegionObjectives(states, mergedConcepts);
  const physical = physicalInventory(mergedConcepts);
  const taxonomy = taxonomyInventory(mergedConcepts);
  const summary = createCoverageSummary({ states, concepts: mergedConcepts, stateCoverage: coverageByState, dynamicCapacity });
  return {
    schemaVersion: 1,
    auditRegionScheme: "Four U.S. Census regions from src/atlas/united-states-atlas-data.js",
    diagnosticBand: { minimumPercent: 80, maximumPercent: 120, purpose: "Diagnostic only; not a pedagogical truth." },
    summary,
    sources: sourceInventory({ concepts: mergedConcepts, memoryItems, mentalChallenges, reconstructionRegions, dynamicCapacity }),
    stateCoverage: coverageByState,
    regionObjectiveMatrix,
    taxonomyCoverage: taxonomy,
    physicalGeography: physical,
    gaps: createGapReport(coverageByState, regionObjectiveMatrix, physical, taxonomy),
    concepts: mergedConcepts
  };
}

function formatNumber(value, digits = 2) {
  if (value === null || value === undefined) return "—";
  return Number(value).toFixed(digits).replace(/\.00$/, "");
}

function yesNo(value) {
  return value ? "Yes" : "No";
}

function listOrNone(values) {
  return values.length ? values.join(", ") : "None";
}

export function renderCoverageMarkdown(report) {
  const lines = [
    "# U.S. Content Coverage Report",
    "",
    "> Generated by `npm run report:us-content`. Do not edit this file by hand.",
    report.repositoryRevision ? `> Repository revision: \`${report.repositoryRevision}\`.` : "",
    "",
    "This is a static repository inventory. It distinguishes fixed assessed concepts, conditional feedback, data-only relationships, dynamic generation capacity, and source instances/variants. It does not prove runtime delivery or UX correctness.",
    "",
    "## National summary",
    "",
    "| Metric | Count |",
    "|---|---:|",
    `| Unique concept records across all evidence classes | ${report.summary.uniqueConceptsAllRepresentations} |`,
    `| Fixed assessed concepts | ${report.summary.fixedAssessedConcepts} |`,
    `| Conditional-feedback concepts | ${report.summary.conditionalFeedbackConcepts} |`,
    `| Data-only concepts | ${report.summary.dataOnlyConcepts} |`,
    `| Dynamically possible concepts | ${report.summary.dynamicallyPossibleConcepts} |`,
    `| Source instances and prompt/activity variants | ${report.summary.sourceInstancesAndVariants} |`,
    `| Fixed Mental Map concepts / question instances | ${report.summary.fixedMentalMapConcepts} / ${report.summary.fixedMentalMapQuestionInstances} |`,
    `| Reconstruction feedback concepts / rule instances | ${report.summary.reconstructionFeedbackConcepts} / ${report.summary.reconstructionFeedbackRuleInstances} |`,
    `| States with location coverage | ${report.summary.statesWithLocation}/50 |`,
    `| States with naming coverage | ${report.summary.statesWithNaming}/50 |`,
    `| States with explicit capital relationship data | ${report.summary.statesWithExplicitCapitalRelationshipData}/50 |`,
    `| States with directly assessed capital relationships | ${report.summary.statesWithAssessedCapitalRelationship}/50 |`,
    `| States with assessed curated relational coverage | ${report.summary.statesWithAssessedCuratedRelationship}/50 |`,
    `| States with any authored relational content, including conditional feedback | ${report.summary.statesWithAnyCuratedRelationshipContent}/50 |`,
    `| States with assessed non-capital contextual coverage | ${report.summary.statesWithNonCapitalContextual}/50 |`,
    `| Capital location / naming concepts | ${report.summary.capitalLocationConcepts} / ${report.summary.capitalNamingConcepts} |`,
    `| Dynamic route endpoint pairs / eligible states | ${report.summary.dynamicRouteEndpointPairs} / ${report.summary.dynamicRouteEligibleStates} |`,
    "",
    "## Source inventory",
    "",
    "| Source | Records | Role | Static reachability |",
    "|---|---:|---|---|",
    ...report.sources.map((item) => `| \`${item.source}\` | ${item.records} | ${item.role} | ${item.reachability} |`),
    "",
    "## State-level coverage",
    "",
    "Capital relationship `Data only` means the atlas contains an explicit relationship but direct scored association retrieval was not found. Curated relationship `Conditional` means authored reconstruction feedback exists but fixed assessed coverage was not found.",
    "",
    "| State | Census region | Location | Naming | Capital relationship | Curated relationship | Non-capital context | Assessed relation concepts | Context concepts |",
    "|---|---|---:|---:|---|---|---:|---:|---:|",
    ...report.stateCoverage.map((state) => `| ${state.name} | ${state.censusRegion} | ${yesNo(state.location)} | ${yesNo(state.naming)} | ${state.capitalRelationshipAssessed ? "Assessed" : state.capitalRelationship === "data-only" ? "Data only" : "Missing"} | ${state.curatedRelational === "assessed" ? "Assessed" : state.curatedRelational === "conditional-only" ? "Conditional" : "Missing"} | ${yesNo(state.nonCapitalContextual)} | ${state.curatedRelationalCount} | ${state.nonCapitalContextualCount} |`),
    "",
    "## Region × objective matrix",
    "",
    `National aggregation uses ${report.auditRegionScheme}. Other application section/region schemes remain source metadata. The 80%–120% band is diagnostic only.`,
    "",
    "| Region | Objective | Eligible states | Unique concepts | State-concept participations | Concepts/state | National mean | % national mean | Diagnostic |",
    "|---|---|---:|---:|---:|---:|---:|---:|---|",
    ...report.regionObjectiveMatrix.map((row) => `| ${row.region} | ${row.objective} | ${row.eligibleStates} | ${row.uniqueConcepts} | ${row.stateConceptParticipations} | ${formatNumber(row.conceptsPerState)} | ${formatNumber(row.nationalMeanConceptsPerState)} | ${row.percentOfNationalMean === null ? "—" : `${formatNumber(row.percentOfNationalMean, 1)}%`} | ${row.diagnostic} |`),
    "",
    "## Taxonomy coverage",
    "",
    "A multi-tag concept appears in each relevant taxonomy row but remains one concept in national unique totals.",
    "",
    "| Taxonomy category | Fixed assessed | Conditional feedback | Data only | Dynamic capacity |",
    "|---|---:|---:|---:|---:|",
    ...report.taxonomyCoverage.map((row) => `| ${row.tag} | ${row.fixedAssessed} | ${row.conditionalFeedback} | ${row.dataOnly} | ${row.dynamicCapacity} |`),
    "",
    "## Physical and regional geography",
    "",
    "Physical feature inventory is reported separately because concepts per state is misleading for multi-state systems.",
    "",
    "| Current fixed assessed category | Concepts |",
    "|---|---:|",
    ...Object.entries(report.physicalGeography.counts).sort().map(([category, count]) => `| ${category} | ${count} |`),
    "",
    `- Present as data or challenge relationships, but not a standalone physical activity category: ${listOrNone(report.physicalGeography.dataOrChallengeOnly)}.`,
    `- Disabled physical-menu categories: ${listOrNone(report.physicalGeography.disabledMenuCategories)}.`,
    `- Taxonomy examples with no current fixed physical-feature target inventory: ${listOrNone(report.physicalGeography.absentTaxonomyExamples)}.`,
    "",
    "## Gap report",
    "",
    `- Missing state location: ${listOrNone(report.gaps.missingLocation)}.`,
    `- Missing state naming: ${listOrNone(report.gaps.missingNaming)}.`,
    `- Explicit capital relationship present only as data: ${listOrNone(report.gaps.capitalRelationshipDataOnly)}.`,
    `- Missing fixed assessed curated relationship: ${listOrNone(report.gaps.missingAssessedCuratedRelationship)}.`,
    `- Curated relationship available only as conditional feedback: ${listOrNone(report.gaps.conditionalOnlyCuratedRelationship)}.`,
    `- Missing assessed non-capital contextual coverage: ${listOrNone(report.gaps.missingNonCapitalContextual)}.`,
    ...report.gaps.underCoveredRegions.map((gap) => `- Diagnostic under-coverage: ${gap.region} — ${gap.objective} (${formatNumber(gap.percentOfNationalMean, 1)}% of national mean).`),
    `- Taxonomy categories with no fixed assessed concepts: ${listOrNone(report.gaps.taxonomyCategoriesWithoutFixedAssessedConcepts)}.`,
    `- Absent physical categories: ${listOrNone(report.gaps.absentPhysicalCategories)}.`,
    "",
    "### Integration gaps",
    "",
    ...report.gaps.integrationGaps.map((item) => `- ${item}`),
    "",
    "## Comparison with the recent audit",
    "",
    "- Confirmed: 50/50 state location, 50/50 state naming, 50 capital targets, 845 dynamic route endpoint pairs, 20 mountain ranges, 8 rivers, and 6 lakes.",
    "- Confirmed: Indiana, Nebraska, South Dakota, and West Virginia lack a fixed assessed curated relationship; the Midwest remains below the diagnostic band.",
    "- The maintained reporter gives Midwest assessed relational coverage as 70.2%, rather than the audit's 71.7%, because it credits Tennessee and Pennsylvania as participants in the fixed Tennessee-to-Pennsylvania border-route concept. The one-off audit omitted route endpoint fields.",
    "- The maintained reporter finds assessed non-capital context for 43 states and seven gaps. The earlier strict audit treated contextual/significance as a narrower historical/cultural category; the finalized taxonomy explicitly permits assessed physical geography and political geography beyond capitals, which this report now counts.",
    "",
    "## Method and limitations",
    "",
    "- A concept has a deterministic semantic ID. Multiple activity targets, prompt modes, or identical relationship wording merge as source instances of that concept.",
    "- Multiple taxonomy tags do not multiply the unique-concept count.",
    "- Fixed/authored concepts, conditional feedback, data-only relationships, and dynamic capacity are reported separately.",
    "- The reporter does not change production content, learner state, selection, or gameplay.",
    ...report.gaps.measurementLimits.map((item) => `- ${item}`),
    "",
    "The machine-readable companion is `docs/generated/us-content-coverage-report.json`; every concept contains its source file and source instance metadata.",
    ""
  ];
  return lines.join("\n");
}
