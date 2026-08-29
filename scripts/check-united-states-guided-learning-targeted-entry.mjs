import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { journeyPresets } from "../src/journey-presets.js";
import {
  buildUnitedStatesMemoryTrailItems,
  createUnitedStatesMemoryTrailState,
  planUnitedStatesMemoryTrailSession,
  resolveUnitedStatesGuidedLearningTargetedEntry
} from "../src/united-states-memory-trail-planner.js";

const sectionActivityIds = Array.from({ length: 11 }, (_, index) => `us-states-${String(index + 1).padStart(2, "0")}`);

function readSectionActivities(activityId) {
  const sectionId = activityId.replace("us-states-", "");
  const data = JSON.parse(readFileSync(new URL(`../assets/maps/data/us-states-capitals-${sectionId}.json`, import.meta.url), "utf8"));
  const stateTargets = data.features.filter(({ type }) => type === "state").map((target) => ({ ...target, kind: "shape" }));
  const stateTargetsByAbbreviation = new Map(stateTargets.map((target) => [target.state, target]));
  const capitalTargets = data.features.filter(({ type }) => type === "capital").map((target) => ({
    ...target,
    kind: "point",
    name: target.city || target.name,
    easyAcceptShapeTargetId: stateTargetsByAbbreviation.get(target.state)?.id || null
  }));
  return [
    { ...data, id: activityId, targets: stateTargets },
    { ...data, id: `us-capitals-${sectionId}`, targets: capitalTargets }
  ];
}

const journey = journeyPresets.find(({ id }) => id === "united-states");
const items = buildUnitedStatesMemoryTrailItems(journey, sectionActivityIds.flatMap(readSectionActivities));
const fixedOptions = { seed: "targeted-entry", now: () => new Date("2037-01-02T03:04:05.000Z") };
const freshState = createUnitedStatesMemoryTrailState(null, items, fixedOptions);
const normalPlan = planUnitedStatesMemoryTrailSession(freshState, items, fixedOptions);
assert.equal(normalPlan.activeSectionId, "us-states-01");
assert.equal("targetedEntry" in normalPlan, false, "Normal Guided Learning startup must remain structurally unchanged.");

const targetedPlan = planUnitedStatesMemoryTrailSession(freshState, items, {
  ...fixedOptions,
  targetSectionId: "us-states-03"
});
assert.equal(targetedPlan.activeSectionId, "us-states-03");
assert.equal(targetedPlan.targetedEntry.accepted, true);
assert.equal(targetedPlan.targetedEntry.requestedSectionId, "us-states-03");
assert.equal(targetedPlan.targetedEntry.resolvedSectionId, "us-states-03");
assert.equal(targetedPlan.newItems.every(({ sourceActivityId }) => sourceActivityId === "us-states-03"), true);
assert.deepEqual(
  planUnitedStatesMemoryTrailSession(freshState, items, { ...fixedOptions, targetSectionId: "us-states-03" }),
  targetedPlan,
  "Target resolution must be deterministic."
);

const invalidPlan = planUnitedStatesMemoryTrailSession(freshState, items, {
  ...fixedOptions,
  targetSectionId: "invented-southern-states"
});
assert.equal(invalidPlan.targetedEntry.accepted, false);
assert.equal(invalidPlan.targetedEntry.fallbackReason, "unknown-section-id");
assert.equal(invalidPlan.activeSectionId, normalPlan.activeSectionId);
assert.deepEqual(invalidPlan.newItems, normalPlan.newItems, "Invalid targeting must fall back to the normal planner result.");

const blockedCapitalPlan = planUnitedStatesMemoryTrailSession(freshState, items, {
  ...fixedOptions,
  targetSectionId: "us-capitals-03"
});
assert.equal(blockedCapitalPlan.targetedEntry.accepted, false);
assert.equal(blockedCapitalPlan.targetedEntry.fallbackReason, "requested-section-ineligible");
assert.equal(blockedCapitalPlan.activeSectionId, normalPlan.activeSectionId);
assert.equal(blockedCapitalPlan.newItems.every(({ type }) => type === "state"), true, "Targeting must not bypass capital prerequisites.");

const sectionThreeStateItems = items.filter((item) => item.type === "state" && item.homeActivityId === "us-states-03");
const sectionThreeReadyState = createUnitedStatesMemoryTrailState({
  currentSessionNumber: 4,
  introducedItemIds: sectionThreeStateItems.map(({ id }) => id),
  itemProgress: Object.fromEntries(sectionThreeStateItems.map((item) => [item.id, {
    status: "review",
    memoryState: "review",
    timesSeen: 1,
    correctCount: 1,
    correctStreak: 1,
    missCount: 0,
    introducedSession: 1,
    lastSeenSession: 3,
    dueSession: 8
  }]))
}, items, fixedOptions);
const capitalPlan = planUnitedStatesMemoryTrailSession(sectionThreeReadyState, items, {
  ...fixedOptions,
  targetSectionId: "us-capitals-03"
});
assert.equal(capitalPlan.targetedEntry.accepted, true);
assert.equal(capitalPlan.targetedEntry.requestedSectionId, "us-capitals-03");
assert.equal(capitalPlan.targetedEntry.resolvedSectionId, "us-states-03");
assert.equal(capitalPlan.newItems.every(({ sourceActivityId, type }) => sourceActivityId === "us-capitals-03" && type === "capital"), true);

const blockedOtherCapitalPlan = planUnitedStatesMemoryTrailSession(sectionThreeReadyState, items, {
  ...fixedOptions,
  targetSectionId: "us-capitals-04"
});
assert.equal(blockedOtherCapitalPlan.targetedEntry.accepted, false);
assert.equal(blockedOtherCapitalPlan.targetedEntry.fallbackReason, "requested-section-ineligible");
assert.equal(blockedOtherCapitalPlan.newItems.every(({ sourceActivityId }) => sourceActivityId === "us-capitals-03"), true);

const resolution = resolveUnitedStatesGuidedLearningTargetedEntry({
  requestedSectionId: "us-states-03",
  items,
  eligibleNewItems: targetedPlan.newItems
});
assert.deepEqual(resolution, {
  requestedSectionId: "us-states-03",
  resolvedSectionId: "us-states-03",
  accepted: true,
  status: "accepted",
  fallbackReason: null,
  plannerAuthority: "existing-eligibility-and-prerequisites"
});

console.log("United States Guided Learning targeted-entry contract passed.");
