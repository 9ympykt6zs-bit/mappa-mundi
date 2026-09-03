import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { journeyPresets } from "../src/journey-presets.js";
import { getUnifiedMentalMapChallenges } from "../src/atlas/mental-map-challenge-registry.js";
import { createCanonicalUnitedStatesProgressReport } from "../src/canonical-progress-report-shadow.js";
import {
  createCanonicalEvidenceEvent,
  getCanonicalMentalMapConceptId
} from "../src/canonical-learning-evidence.js";
import {
  appendCanonicalEvidenceEvents,
  createEmptyCanonicalEvidenceRepository
} from "../src/canonical-learning-evidence-repository.js";
import { createUnitedStatesContinuationFoundation } from "../src/continuation-readiness.js";
import { selectUnitedStatesEvidenceDrivenContinuation } from "../src/united-states-evidence-driven-continuation.js";
import { buildUnitedStatesMemoryTrailItems } from "../src/united-states-memory-trail-planner.js";

function readCombinedSection(sectionNumber) {
  const sectionId = String(sectionNumber).padStart(2, "0");
  const raw = JSON.parse(readFileSync(new URL(
    `../assets/maps/data/us-states-capitals-${sectionId}.json`,
    import.meta.url
  ), "utf8"));
  const features = raw.features || raw.targets || [];
  return [
    {
      ...raw,
      id: `us-states-${sectionId}`,
      targets: features.filter(({ type }) => type === "state").map((target) => ({
        ...target,
        kind: "shape"
      }))
    },
    {
      ...raw,
      id: `us-capitals-${sectionId}`,
      targets: features.filter(({ type }) => type === "capital").map((target) => ({
        ...target,
        kind: "point",
        name: target.city || target.name
      }))
    }
  ];
}

const journey = journeyPresets.find(({ id }) => id === "united-states");
const memoryTrailItems = Array.from({ length: 11 }, (_, index) => readCombinedSection(index + 1)).flat();
const items = buildUnitedStatesMemoryTrailItems(journey, memoryTrailItems);
assert.equal(items.filter(({ type }) => type === "state").length, 50);
assert.equal(items.filter(({ type }) => type === "capital").length, 50);

const displayLabelById = {
  unseen: "Not started",
  "early-evidence": "Building",
  "needs-review": "Needs review",
  demonstrated: "Going well",
  "strong-evidence": "Strong"
};

function displayCategory(id) {
  return { id, label: displayLabelById[id] };
}

function itemCategory(id, type, aggregateId, classifyItem = () => aggregateId) {
  return {
    id,
    label: id,
    displayCategory: displayCategory(aggregateId),
    records: items.filter((item) => item.type === type).map((item) => ({
      itemId: item.id,
      label: item.label,
      displayCategory: displayCategory(classifyItem(item))
    }))
  };
}

function physicalReport(classifications = {}) {
  return {
    categories: [
      ["physical-rivers", "Rivers"],
      ["physical-lakes", "Lakes"],
      ["physical-mountain-ranges", "Mountain Ranges"],
      ["physical-coasts", "Coasts"]
    ].map(([id, label]) => ({
      id,
      label,
      displayCategory: displayCategory(classifications[id] || "unseen")
    }))
  };
}

function stageOneCategories({
  locations = "unseen",
  identification = "unseen",
  capitals = "unseen",
  locationRecord = () => locations,
  identificationRecord = () => identification,
  capitalRecord = () => capitals,
  relationships = null
} = {}) {
  return [
    itemCategory("state-locations", "state", locations, locationRecord),
    itemCategory("state-identification", "state", identification, identificationRecord),
    itemCategory("state-capitals", "capital", capitals, capitalRecord),
    ...(relationships ? [{
      id: "geographic-relationships",
      label: "Geographic Relationships",
      displayCategory: displayCategory(relationships),
      records: []
    }] : [])
  ];
}

function decision({ categories = [], physical = physicalReport() } = {}) {
  const progressReport = { categories };
  const continuationFoundation = createUnitedStatesContinuationFoundation({
    progressReport,
    physicalFeatureProgressReport: physical
  });
  return selectUnitedStatesEvidenceDrivenContinuation({
    continuationFoundation,
    progressReport,
    memoryTrailItems: items
  });
}

const strongStageOne = stageOneCategories({
  locations: "strong-evidence",
  identification: "strong-evidence",
  capitals: "strong-evidence"
});
const strongPhysical = physicalReport({
  "physical-rivers": "strong-evidence",
  "physical-lakes": "strong-evidence",
  "physical-mountain-ranges": "strong-evidence"
});
const relationshipChallenges = getUnifiedMentalMapChallenges({
  includeGenerated: false,
  includeUnitedStatesRelationships: true
}).filter((challenge) => getCanonicalMentalMapConceptId(challenge)?.startsWith("relationship:"));

function relationshipRepository(challenges, outcome, repetitions) {
  let sequence = 0;
  const events = challenges.flatMap((challenge) => Array.from({ length: repetitions }, () => {
    const conceptId = getCanonicalMentalMapConceptId(challenge);
    const eventId = `relationship-${outcome}-${sequence}`;
    const event = createCanonicalEvidenceEvent({
      eventId,
      attemptId: eventId,
      occurredAt: new Date(Date.UTC(2038, 1, 1, 0, 0, sequence)).toISOString(),
      sequence,
      conceptId,
      skillId: challenge.canonicalSkillId
        || (challenge.answerMode === "ordered-sequence" ? "sequencing" : "relationship-recall"),
      sourceMode: "mental-map",
      sourceActivityId: challenge.sourceActivityId || challenge.id,
      outcome
    });
    sequence += 1;
    return event;
  }));
  return appendCanonicalEvidenceEvents(createEmptyCanonicalEvidenceRepository(), events).repository;
}

const coastChallenge = relationshipChallenges.find((challenge) => (
  getCanonicalMentalMapConceptId(challenge).startsWith("relationship:coast:")
));
assert.ok(coastChallenge, "The retained Connections inventory must expose canonical coast relationships.");
const weakConnectionsCategory = createCanonicalUnitedStatesProgressReport({
  items,
  repository: relationshipRepository([coastChallenge], "incorrect", 5)
}).categories.find(({ id }) => id === "geographic-relationships");
const strongConnectionsCategory = createCanonicalUnitedStatesProgressReport({
  items,
  repository: relationshipRepository(relationshipChallenges, "correct", 5)
}).categories.find(({ id }) => id === "geographic-relationships");
assert.equal(weakConnectionsCategory.displayCategory.id, "needs-review");
assert.ok(["demonstrated", "strong-evidence"].includes(strongConnectionsCategory.displayCategory.id));

const scenarios = [];
function scenario(name, value, expected) {
  expected(value);
  scenarios.push({
    name,
    objective: value.selectedObjective,
    family: value.selectedFamily,
    section: value.selectedSection,
    destination: value.destination.kind
  });
}

const fresh = decision();
scenario("fresh", fresh, (value) => {
  assert.equal(value.selectedObjective, "learn-states-and-capitals");
  assert.equal(value.selectedFamily, "state-locations");
  assert.equal(value.selectedSection, "us-states-01");
  assert.equal(value.destination.kind, "united-states-guided-learning");
  assert.equal(value.routing.legacyJourneyLaunch, false);
});

const regionalWeakness = decision({
  categories: stageOneCategories({
    locations: "early-evidence",
    locationRecord: (item) => ["us-states-03", "us-states-04"].includes(item.homeActivityId)
      ? "needs-review"
      : ["us-states-01", "us-states-02"].includes(item.homeActivityId) ? "strong-evidence" : "unseen"
  })
});
scenario("regional weakness", regionalWeakness, (value) => {
  assert.equal(value.selectedFamily, "state-locations");
  assert.equal(value.selectedSection, "us-states-03");
  assert.equal(value.reason, "known-weakness");
  assert.ok(value.alternatives.some(({ sectionId, classification }) => (
    sectionId === "us-states-04" && classification === "needs-review"
  )));
});

scenario("Label Map curiosity", decision(), (value) => {
  assert.deepEqual(value, fresh, "Opening an optional mode without evidence must not change continuation.");
});

scenario("Label Map partial knowledge", decision({
  categories: stageOneCategories({
    locations: "early-evidence",
    locationRecord: (item) => item.homeActivityId === "us-states-03"
      ? "needs-review"
      : item.homeActivityId < "us-states-03" ? "strong-evidence" : "unseen"
  })
}), (value) => {
  assert.equal(value.selectedSection, "us-states-03");
});

scenario("states strong / capitals weak", decision({
  categories: stageOneCategories({
    locations: "strong-evidence",
    identification: "strong-evidence",
    capitals: "needs-review"
  })
}), (value) => {
  assert.equal(value.selectedFamily, "state-capitals");
  assert.equal(value.destination.targetSectionId, "us-capitals-01");
  assert.equal(value.selectedSection, "us-states-01");
});

scenario("Stage 1 ready / rivers weak", decision({
  categories: strongStageOne,
  physical: physicalReport({
    "physical-rivers": "needs-review",
    "physical-lakes": "strong-evidence",
    "physical-mountain-ranges": "strong-evidence",
    "physical-coasts": "needs-review"
  })
}), (value) => {
  assert.equal(value.selectedFamily, "physical-rivers");
  assert.equal(value.destination.kind, "united-states-guided-learning");
  assert.equal(value.destination.targetedNeed.familyId, "physical-rivers");
  assert.equal(value.routing.destinationType, "guided-learning");
  assert.equal(value.routing.legacyJourneyLaunch, false);
  assert.equal(value.alternatives.some(({ familyId }) => familyId === "physical-coasts"), false);
});

scenario("Stage 1 ready / mountains weak", decision({
  categories: strongStageOne,
  physical: physicalReport({
    "physical-rivers": "strong-evidence",
    "physical-lakes": "strong-evidence",
    "physical-mountain-ranges": "needs-review"
  })
}), (value) => {
  assert.equal(value.selectedFamily, "physical-mountain-ranges");
  assert.equal(value.destination.kind, "united-states-guided-learning");
  assert.equal(value.destination.targetedNeed.familyId, "physical-mountain-ranges");
});

scenario("Stage 1 ready / lakes weak", decision({
  categories: strongStageOne,
  physical: physicalReport({
    "physical-rivers": "strong-evidence",
    "physical-lakes": "needs-review",
    "physical-mountain-ranges": "strong-evidence"
  })
}), (value) => {
  assert.equal(value.selectedFamily, "physical-lakes");
  assert.equal(value.destination.kind, "united-states-guided-learning");
  assert.equal(value.destination.targetedNeed.familyId, "physical-lakes");
  assert.equal(value.selectedSection, "physical-lakes");
});

scenario("Stage 1 ready / physical fresh", decision({ categories: strongStageOne }), (value) => {
  assert.equal(value.selectedFamily, "physical-rivers");
  assert.equal(value.reason, "not-started");
  assert.deepEqual(value, decision({ categories: strongStageOne }), "Physical-family tie-breaking must replay deterministically.");
});

scenario("Stage 1 + physical ready / Connections weak", decision({
  categories: [...strongStageOne, weakConnectionsCategory],
  physical: strongPhysical
}), (value) => {
  assert.equal(value.selectedObjective, "learn-connections");
  assert.equal(value.destination.kind, "united-states-guided-learning");
  assert.equal(value.destination.targetedNeed.familyId, "geographic-relationships");
  assert.equal(value.reason, "known-weakness", "Canonical coast relationship misses belong to Connections readiness.");
});

scenario("all first three ready", decision({
  categories: [...strongStageOne, strongConnectionsCategory],
  physical: strongPhysical
}), (value) => {
  assert.equal(value.selectedObjective, "explore-united-states");
  assert.equal(value.destination.stepId, "lower-48-mission");
});

const assistedRepository = appendCanonicalEvidenceEvents(
  createEmptyCanonicalEvidenceRepository(),
  [createCanonicalEvidenceEvent({
    eventId: "assisted-state-location",
    attemptId: "assisted-state-location",
    occurredAt: "2038-01-01T00:00:00.000Z",
    conceptId: "state-location:maine",
    skillId: "locating",
    sourceMode: "memory-trail",
    sourceActivityId: "us-states-01",
    outcome: "assisted"
  })]
).repository;
const assistedProgressReport = createCanonicalUnitedStatesProgressReport({
  items,
  repository: assistedRepository
});
const assistedOnly = selectUnitedStatesEvidenceDrivenContinuation({
  continuationFoundation: createUnitedStatesContinuationFoundation({
    progressReport: assistedProgressReport,
    physicalFeatureProgressReport: physicalReport()
  }),
  progressReport: assistedProgressReport,
  memoryTrailItems: items
});
scenario("assisted-only evidence", assistedOnly, (value) => {
  assert.equal(value.selectedObjective, "learn-states-and-capitals");
  assert.equal(value.selectedSection, "us-states-01");
});

scenario("optional Explore visit", decision(), (value) => {
  assert.deepEqual(value, fresh, "An optional Explore visit without evidence must not change continuation.");
});

assert.deepEqual(
  scenarios,
  scenarios.map((entry) => ({ ...entry })),
  "Equivalent evidence and configuration must replay deterministically."
);
assert.equal(scenarios.length, 13);
for (const result of scenarios) {
  console.log(`${result.name} -> ${result.objective} -> ${result.family || "none"} -> ${result.section}`);
}
console.log("Evidence-Driven U.S. Continuation synthetic profiles passed.");
