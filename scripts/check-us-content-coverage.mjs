import assert from "node:assert/strict";

import {
  DELIVERY,
  OBJECTIVE_GROUPS,
  TAXONOMY_TAGS,
  aggregateRegionObjectives,
  buildRepositoryCoverage,
  buildStateCoverage,
  createConcept,
  fixedChallengeConceptId,
  mergeConcepts,
  reconstructionConceptId
} from "./lib/us-content-coverage.mjs";

function concept(overrides = {}) {
  return createConcept({
    id: "state-location:alpha",
    label: "Locate Alpha",
    kind: "state-location",
    stateIds: ["alpha"],
    taxonomyTags: [TAXONOMY_TAGS.POLITICAL],
    objectiveGroups: [OBJECTIVE_GROUPS.STATE_LOCATION],
    authored: true,
    delivery: DELIVERY.FIXED_SCORED,
    sources: [{ file: "fixture.json", type: "fixture", instanceId: "one", reachability: "fixture" }],
    ...overrides
  });
}

const duplicateRepresentations = mergeConcepts([
  concept(),
  concept({ sources: [{ file: "memory.js", type: "prompt-variant", instanceId: "two", reachability: "fixture" }] })
]);
assert.equal(duplicateRepresentations.length, 1, "duplicate activity/prompt representations must merge");
assert.equal(duplicateRepresentations[0].sources.length, 2, "merged concepts must preserve traceable variants");
assert.equal(duplicateRepresentations[0].id, "state-location:alpha", "concept IDs must remain stable");

const multiTagged = mergeConcepts([
  concept({
    id: "relationship:set:alpha+beta",
    kind: "curated-relationship",
    stateIds: ["alpha", "beta"],
    taxonomyTags: [TAXONOMY_TAGS.REGIONAL, TAXONOMY_TAGS.PHYSICAL],
    objectiveGroups: [OBJECTIVE_GROUPS.GEOGRAPHIC_RELATIONSHIPS]
  })
]);
assert.equal(multiTagged.length, 1, "multiple taxonomy tags must not duplicate a concept");
assert.deepEqual(multiTagged[0].taxonomyTags, [TAXONOMY_TAGS.PHYSICAL, TAXONOMY_TAGS.REGIONAL]);

const gulfMentalMap = {
  orderedStateIds: ["texas", "louisiana", "mississippi", "alabama", "florida"],
  associatedFeatureIds: ["water:gulf-of-mexico"]
};
const gulfCompassVariant = {
  orderedStateIds: ["texas", "louisiana", "mississippi", "alabama", "florida"]
};
assert.equal(
  fixedChallengeConceptId(gulfMentalMap),
  fixedChallengeConceptId(gulfCompassVariant),
  "wording/source variants of the same ordering must share an ID"
);
assert.equal(
  reconstructionConceptId({ message: "New Jersey belongs east of Pennsylvania." }),
  reconstructionConceptId({ message: "New Jersey belongs east of Pennsylvania." }),
  "identical reconstruction feedback must share a stable ID"
);

const fixed = concept({
  id: "relationship:direction:alpha:east:beta",
  kind: "curated-relationship",
  stateIds: ["alpha", "beta"],
  taxonomyTags: [TAXONOMY_TAGS.REGIONAL],
  objectiveGroups: [OBJECTIVE_GROUPS.GEOGRAPHIC_RELATIONSHIPS]
});
const dynamic = concept({
  id: "dynamic-route:alpha:beta",
  kind: "dynamic-border-route-capacity",
  stateIds: ["alpha", "beta"],
  taxonomyTags: [TAXONOMY_TAGS.REGIONAL],
  objectiveGroups: [OBJECTIVE_GROUPS.GEOGRAPHIC_RELATIONSHIPS],
  authored: false,
  delivery: DELIVERY.DYNAMIC_CAPACITY
});
const separated = mergeConcepts([fixed, dynamic]);
assert.equal(separated.filter(({ delivery }) => delivery === DELIVERY.FIXED_SCORED).length, 1);
assert.equal(separated.filter(({ delivery }) => delivery === DELIVERY.DYNAMIC_CAPACITY).length, 1);

const states = [
  { id: "alpha", name: "Alpha", censusRegion: "East" },
  { id: "beta", name: "Beta", censusRegion: "East" },
  { id: "gamma", name: "Gamma", censusRegion: "West" },
  { id: "delta", name: "Delta", censusRegion: "West" }
];
const fixtureConcepts = mergeConcepts([
  concept(),
  concept({ id: "state-location:beta", stateIds: ["beta"] }),
  concept({ id: "state-location:gamma", stateIds: ["gamma"] }),
  concept({ id: "state-naming:alpha", kind: "state-naming", objectiveGroups: [OBJECTIVE_GROUPS.STATE_NAMING] }),
  fixed,
  dynamic
]);
const fixtureCoverage = buildStateCoverage(states, fixtureConcepts);
assert.deepEqual(
  fixtureCoverage.filter(({ location }) => !location).map(({ id }) => id),
  ["delta"],
  "missing-state detection must report states without fixed coverage"
);

const locationMatrix = aggregateRegionObjectives(states, fixtureConcepts).filter(({ objectiveId }) => objectiveId === "state-location");
const east = locationMatrix.find(({ region }) => region === "East");
const west = locationMatrix.find(({ region }) => region === "West");
assert.equal(east.stateConceptParticipations, 2);
assert.equal(east.conceptsPerState, 1);
assert.equal(east.nationalMeanConceptsPerState, 0.75);
assert.equal(Math.round(east.percentOfNationalMean * 10) / 10, 133.3);
assert.equal(west.stateConceptParticipations, 1);
assert.equal(Math.round(west.percentOfNationalMean * 10) / 10, 66.7);
assert.equal(west.diagnostic, "below-80%");

assert.throws(
  () => createConcept({ id: "invalid", taxonomyTags: [], objectiveGroups: [] }),
  /namespaced/,
  "concept identity validation must reject unstable unnamespaced IDs"
);
assert.throws(
  () => concept({ taxonomyTags: ["trivia"] }),
  /Unknown taxonomy tag/,
  "taxonomy tagging must reject unknown categories"
);

const repositoryReport = buildRepositoryCoverage();
assert.equal(repositoryReport.stateCoverage.length, 50, "repository integration must inventory all 50 states");
assert.equal(repositoryReport.summary.statesWithLocation, 50);
assert.equal(repositoryReport.summary.statesWithNaming, 50);
assert.equal(repositoryReport.summary.statesWithExplicitCapitalRelationshipData, 50);
assert.equal(repositoryReport.summary.dynamicRouteEndpointPairs, 845);
assert.equal(repositoryReport.summary.fixedMentalMapConcepts, 19);
assert.equal(repositoryReport.summary.fixedMentalMapQuestionInstances, 20);
assert.equal(repositoryReport.summary.reconstructionFeedbackConcepts, 30);
assert.equal(repositoryReport.summary.reconstructionFeedbackRuleInstances, 31);
assert.deepEqual(repositoryReport.physicalGeography.counts, {
  lake: 6,
  "mountain-range": 20,
  river: 8
});
assert.ok(
  repositoryReport.concepts.every(({ sources }) => sources.length > 0 && sources.every(({ file, instanceId }) => file && instanceId)),
  "every repository concept must retain source traceability"
);

console.log("U.S. content coverage reporter checks passed.");
