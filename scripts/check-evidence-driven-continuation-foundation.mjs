import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { createCanonicalEvidenceEvent } from "../src/canonical-learning-evidence.js";
import {
  appendCanonicalEvidenceEvents,
  createEmptyCanonicalEvidenceRepository
} from "../src/canonical-learning-evidence-repository.js";
import {
  classifyCanonicalProgressEvidence,
  USER_FACING_PROGRESS_SKILLS
} from "../src/progress-evidence-policy.js";
import {
  buildUnitedStatesPhysicalFeatureProgressItems,
  createUnitedStatesPhysicalFeatureProgressReport
} from "../src/united-states-physical-feature-progress.js";
import {
  createUnitedStatesContinuationFoundation,
  evaluateContinuationObjective
} from "../src/continuation-readiness.js";

function readActivity(pathname) {
  const value = JSON.parse(readFileSync(new URL(pathname, import.meta.url), "utf8"));
  return { ...value, targets: value.targets || value.features || [] };
}

const activities = [
  "../assets/maps/data/us-physical-rivers.json",
  "../assets/maps/data/us-physical-lakes.json",
  "../assets/maps/data/us-physical-western-mountains.json",
  "../assets/maps/data/us-physical-eastern-mountains.json",
  "../assets/maps/data/us-physical-midwestern-mountains.json",
  "../assets/maps/data/us-physical-alaska-mountains.json"
].map(readActivity);
const items = buildUnitedStatesPhysicalFeatureProgressItems(activities);
const itemsByFamily = Map.groupBy(items, (item) => item.familyId);

assert.equal(itemsByFamily.get("physical-rivers")?.length, 8);
assert.equal(itemsByFamily.get("physical-lakes")?.length, 6);
assert.equal(itemsByFamily.get("physical-mountain-ranges")?.length, 20);
assert.equal(itemsByFamily.get("physical-coasts")?.length, 4);
assert.equal(items.filter(({ id }) => id === "river:mississippi-river").length, 1, "Relationship mappings must reuse direct feature identity.");

function evidenceForProfile({ weakFamilyId = null, buildingFamilyId = null } = {}) {
  const events = [];
  let sequence = 0;
  for (const item of items) {
    if (item.familyId === buildingFamilyId && item !== itemsByFamily.get(buildingFamilyId)[0]) continue;
    const outcome = item.familyId === weakFamilyId ? "incorrect" : "correct";
    const repetitions = item.familyId === buildingFamilyId ? 1 : 5;
    const canonical = item.canonicalMappings[0];
    for (let index = 0; index < repetitions; index += 1) {
      const isRelationship = canonical.conceptId.startsWith("relationship:");
      events.push(createCanonicalEvidenceEvent({
        eventId: `${item.id}:${outcome}:${index}`,
        attemptId: `${item.id}:${outcome}:${index}`,
        occurredAt: new Date(Date.UTC(2036, 0, 1, 0, 0, sequence)).toISOString(),
        sequence,
        conceptId: canonical.conceptId,
        skillId: canonical.canonicalSkillId,
        sourceMode: isRelationship ? "mental-map" : "memory-trail",
        sourceActivityId: item.sourceActivityId,
        outcome
      }));
      sequence += 1;
    }
  }
  return events;
}

function profile(name, options = {}) {
  const events = options.fresh ? [] : evidenceForProfile(options);
  const repository = appendCanonicalEvidenceEvents(createEmptyCanonicalEvidenceRepository(), events).repository;
  const physicalFeatureProgressReport = createUnitedStatesPhysicalFeatureProgressReport({ items, repository });
  const continuation = createUnitedStatesContinuationFoundation({
    progressReport: { categories: [] },
    physicalFeatureProgressReport
  });
  const objective = continuation.objectives.find(({ id }) => id === "learn-physical-features");
  return {
    name,
    classifications: Object.fromEntries(objective.families.map((family) => [family.label, family.classification.label])),
    readiness: objective.readiness,
    highestPriorityGap: objective.blockingFamily?.label || null,
    priorityReason: objective.blockingFamily?.priorityReason || null,
    continuation,
    report: physicalFeatureProgressReport
  };
}

const profiles = [
  profile("physical-fresh", { fresh: true }),
  profile("rivers-weak", { weakFamilyId: "physical-rivers" }),
  profile("mountains-weak", { weakFamilyId: "physical-mountain-ranges" }),
  profile("physical-strong")
];
const replayProfiles = [
  profile("physical-fresh", { fresh: true }),
  profile("rivers-weak", { weakFamilyId: "physical-rivers" }),
  profile("mountains-weak", { weakFamilyId: "physical-mountain-ranges" }),
  profile("physical-strong")
];
assert.deepEqual(
  profiles.map(({ name, classifications, readiness, highestPriorityGap, priorityReason }) => ({
    name, classifications, readiness, highestPriorityGap, priorityReason
  })),
  replayProfiles.map(({ name, classifications, readiness, highestPriorityGap, priorityReason }) => ({
    name, classifications, readiness, highestPriorityGap, priorityReason
  })),
  "Synthetic foundation profiles must replay deterministically."
);

assert.deepEqual(Object.values(profiles[0].classifications), ["Not started", "Not started", "Not started", "Not started"]);
assert.equal(profiles[0].readiness, "not-ready");
assert.equal(profiles[0].highestPriorityGap, "Rivers");
assert.equal(profiles[1].classifications.Rivers, "Needs review");
assert.equal(profiles[1].classifications.Lakes, "Strong");
assert.equal(profiles[1].highestPriorityGap, "Rivers");
assert.equal(profiles[1].priorityReason, "known-weakness");
assert.equal(profiles[2].classifications["Mountain Ranges"], "Needs review");
assert.equal(profiles[2].highestPriorityGap, "Mountain Ranges");
assert.equal(profiles[3].readiness, "ready");
assert.equal(profiles[3].highestPriorityGap, null);
assert.deepEqual(Object.values(profiles[3].classifications), ["Strong", "Strong", "Strong", "Strong"]);

const building = profile("rivers-building", { buildingFamilyId: "physical-rivers" });
assert.equal(building.classifications.Rivers, "Building");
assert.equal(building.report.categories.find(({ id }) => id === "physical-lakes").displayCategory.label, "Strong");
assert.equal(building.report.categories.find(({ id }) => id === "physical-mountain-ranges").displayCategory.label, "Strong");

const priorityCheck = evaluateContinuationObjective({
  id: "priority-check",
  requiredFamilyIds: ["unseen-family", "weak-family", "building-family", "strong-family"],
  categories: [
    { id: "unseen-family", displayCategory: { id: "unseen", label: "Not started" } },
    { id: "weak-family", displayCategory: { id: "needs-review", label: "Needs review" } },
    { id: "building-family", displayCategory: { id: "early-evidence", label: "Building" } },
    { id: "strong-family", displayCategory: { id: "strong-evidence", label: "Strong" } }
  ]
});
assert.deepEqual(priorityCheck.priorityOrder, ["weak-family", "building-family", "unseen-family", "strong-family"]);
assert.equal(priorityCheck.blockingFamily.priorityReason, "known-weakness");

const readyStatesWeakCapital = createUnitedStatesContinuationFoundation({
  progressReport: {
    categories: [
      { id: "state-locations", label: "State Locations", displayCategory: { id: "strong-evidence", label: "Strong" } },
      { id: "state-identification", label: "State Identification", displayCategory: { id: "demonstrated", label: "Going well" } },
      { id: "state-capitals", label: "State Capitals", displayCategory: { id: "needs-review", label: "Needs review" } }
    ]
  },
  physicalFeatureProgressReport: profiles[3].report
});
const stateObjective = readyStatesWeakCapital.objectives.find(({ id }) => id === "learn-states-and-capitals");
assert.equal(stateObjective.ready, false);
assert.equal(stateObjective.blockingFamily.id, "state-capitals");

const riverCorrectDecision = classifyCanonicalProgressEvidence(createCanonicalEvidenceEvent({
  eventId: "river-policy-correct",
  attemptId: "river-policy-correct",
  occurredAt: "2036-02-01T00:00:00.000Z",
  conceptId: "river-location:mississippi-river",
  skillId: "locating",
  sourceMode: "journey",
  outcome: "correct"
}));
assert.equal(riverCorrectDecision.contributions[0].progressSkillId, USER_FACING_PROGRESS_SKILLS.RIVER_LOCATION);
assert.equal(riverCorrectDecision.contributions[0].correctCount, 1);
const riverAssistedDecision = classifyCanonicalProgressEvidence(createCanonicalEvidenceEvent({
  eventId: "river-policy-assisted",
  attemptId: "river-policy-assisted",
  occurredAt: "2036-02-01T00:00:01.000Z",
  conceptId: "river-location:mississippi-river",
  skillId: "locating",
  sourceMode: "memory-trail",
  outcome: "assisted"
}));
assert.equal(riverAssistedDecision.contributions[0].correctCount, 0);
assert.equal(riverAssistedDecision.contributions[0].treatment, "exposure-only");

for (const result of profiles) {
  console.log(`${result.name} -> ${JSON.stringify(result.classifications)} -> ${result.readiness} -> ${result.highestPriorityGap || "none"}`);
}
console.log("Evidence-driven continuation progress/readiness foundation check passed.");
