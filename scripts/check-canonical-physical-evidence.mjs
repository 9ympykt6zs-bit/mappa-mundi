import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  adaptCanonicalMentalMapEvaluation,
  adaptCanonicalRetrievalAttempt,
  getCanonicalRetrievalMappings
} from "../src/canonical-learning-evidence.js";
import {
  getCanonicalRetrievalItemForActivity,
  validateActivityEvidenceContract
} from "../src/activity-evidence-contract.js";
import {
  getUnitedStatesRelationshipChallenges,
  UNITED_STATES_RELATIONSHIP_TYPES
} from "../src/atlas/united-states-relationship-challenges.js";

const occurredAt = "2035-04-05T12:00:00.000Z";

function activity(pathname) {
  const value = JSON.parse(readFileSync(new URL(pathname, import.meta.url), "utf8"));
  return { ...value, targets: value.targets || value.features || [] };
}

function retrievalEvent(item, { promptType = "name_to_place", result = "correct", suffix = "correct" } = {}) {
  return adaptCanonicalRetrievalAttempt({
    item,
    promptType,
    result,
    eventId: `physical-${item.type}-${suffix}`,
    attemptId: `physical-${item.type}-${suffix}`,
    occurredAt,
    sourceMode: "memory-trail",
    sourceActivityId: item.sourceActivityId
  });
}

const riverActivity = activity("../assets/maps/data/us-physical-rivers.json");
const riverItem = getCanonicalRetrievalItemForActivity(riverActivity, "mississippi-river");
assert.deepEqual(validateActivityEvidenceContract(riverActivity.canonicalEvidence), []);
assert.equal(riverItem.type, "river");
assert.deepEqual(getCanonicalRetrievalMappings(riverItem), [
  { conceptId: "river-location:mississippi-river", skillId: "locating", promptType: "name_to_place" },
  { conceptId: "river-naming:mississippi-river", skillId: "identifying", promptType: "place_to_name" }
]);
assert.equal(retrievalEvent(riverItem).outcome, "correct");
assert.equal(retrievalEvent(riverItem).conceptId, "river-location:mississippi-river");
assert.equal(retrievalEvent(riverItem, { result: "incorrect", suffix: "incorrect" }).outcome, "incorrect");
const assistedRiver = retrievalEvent(riverItem, { promptType: "guided", suffix: "assisted" });
assert.equal(assistedRiver.outcome, "assisted");
assert.equal(assistedRiver.conceptId, "river-location:mississippi-river");

const mountainActivity = activity("../assets/maps/data/us-physical-western-mountains.json");
const mountainItem = getCanonicalRetrievalItemForActivity(mountainActivity, "rocky-mountains");
assert.equal(mountainItem.type, "mountain-range");
assert.equal(retrievalEvent(mountainItem).conceptId, "mountain-range-location:rocky-mountains");
assert.equal(retrievalEvent(mountainItem, { promptType: "place_to_name", suffix: "naming" }).conceptId, "mountain-range-naming:rocky-mountains");

const lakeActivity = activity("../assets/maps/data/us-physical-lakes.json");
const lakeItem = getCanonicalRetrievalItemForActivity(lakeActivity, "lake-erie");
assert.equal(lakeItem.type, "lake");
assert.equal(retrievalEvent(lakeItem).conceptId, "lake-location:lake-erie");
assert.equal(retrievalEvent(lakeItem, { promptType: "place_to_name", suffix: "naming" }).conceptId, "lake-naming:lake-erie");

const mixedPhysicalActivity = {
  id: "us-guided-physical-review",
  canonicalEvidence: {
    entityTypesByTargetId: {
      "rocky-mountains": "mountain-range",
      "mississippi-river": "river",
      "lake-erie": "lake"
    }
  },
  targets: [
    { id: "rocky-mountains", name: "Rocky Mountains" },
    { id: "mississippi-river", name: "Mississippi River" },
    { id: "lake-erie", name: "Lake Erie" }
  ]
};
assert.deepEqual(validateActivityEvidenceContract(mixedPhysicalActivity.canonicalEvidence), []);
assert.equal(
  retrievalEvent(getCanonicalRetrievalItemForActivity(mixedPhysicalActivity, "rocky-mountains"), { suffix: "mixed-mountain" }).conceptId,
  "mountain-range-location:rocky-mountains"
);
assert.equal(
  retrievalEvent(getCanonicalRetrievalItemForActivity(mixedPhysicalActivity, "mississippi-river"), { suffix: "mixed-river" }).conceptId,
  "river-location:mississippi-river"
);
assert.equal(
  retrievalEvent(getCanonicalRetrievalItemForActivity(mixedPhysicalActivity, "lake-erie"), { suffix: "mixed-lake" }).conceptId,
  "lake-location:lake-erie"
);

const coastChallenge = getUnitedStatesRelationshipChallenges()
  .find(({ relationshipType }) => relationshipType === UNITED_STATES_RELATIONSHIP_TYPES.COAST);
assert.ok(coastChallenge, "Current U.S. Connections content must contain an authored coast relationship.");
assert.match(coastChallenge.canonicalConceptId, /^relationship:coast:[^:]+:[^:]+$/);
const coastEvent = adaptCanonicalMentalMapEvaluation({
  challenge: coastChallenge,
  evaluation: {
    isCorrect: true,
    score: 1,
    maxScore: 1,
    selectedStateIds: [...coastChallenge.correctStateIds],
    missingStateIds: [],
    unnecessaryStateIds: []
  },
  conceptId: coastChallenge.canonicalConceptId,
  eventId: "physical-coast-relationship-correct",
  attemptId: "physical-coast-relationship-correct",
  occurredAt,
  sourceMode: "mental-map",
  sourceActivityId: coastChallenge.sourceActivityId
});
assert.equal(coastEvent.conceptId, coastChallenge.canonicalConceptId);
assert.equal(coastEvent.skillId, "relationship-recall");
assert.equal(coastEvent.outcome, "correct");

const stateMappings = getCanonicalRetrievalMappings({ type: "state", targetId: "ohio" });
assert.deepEqual(stateMappings, [
  { conceptId: "state-location:ohio", skillId: "locating", promptType: "name_to_place" },
  { conceptId: "state-naming:ohio", skillId: "identifying", promptType: "place_to_name" }
]);
assert.ok(validateActivityEvidenceContract({ entityType: "volcano" }).length > 0);
assert.equal(getCanonicalRetrievalItemForActivity({
  id: "invalid",
  canonicalEvidence: { entityType: "volcano" },
  targets: [{ id: "mount-fake", name: "Mount Fake" }]
}, "mount-fake"), null);
assert.throws(
  () => getCanonicalRetrievalMappings({ type: "volcano", targetId: "mount-fake" }),
  /No canonical retrieval mapping/
);

console.log("Canonical physical geography evidence check passed.");
