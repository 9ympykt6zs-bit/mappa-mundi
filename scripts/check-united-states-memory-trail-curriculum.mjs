import assert from "node:assert/strict";
import fs from "node:fs";
import { journeyPresets } from "../src/journey-presets.js";
import {
  buildUnitedStatesMemoryTrailItems,
  validateUnitedStatesMemoryTrailCurriculum
} from "../src/united-states-memory-trail-planner.js";

const stateActivityIds = Array.from({ length: 11 }, (_, index) => `us-states-${String(index + 1).padStart(2, "0")}`);

function readUnitedStatesTrailActivities(activityId) {
  const sectionId = activityId.replace("us-states-", "");
  const data = JSON.parse(fs.readFileSync(`assets/maps/data/us-states-capitals-${sectionId}.json`, "utf8"));
  const stateTargets = (data.features || []).filter((feature) => feature.type === "state").map((feature) => ({
    ...feature,
    kind: "shape"
  }));
  const stateTargetsByAbbreviation = new Map(stateTargets.map((target) => [target.state, target]));
  const capitalTargets = (data.features || []).filter((feature) => feature.type === "capital").map((feature) => ({
    ...feature,
    name: feature.city || feature.name,
    completedLabelName: feature.name,
    easyAcceptShapeTargetId: stateTargetsByAbbreviation.get(feature.state)?.id || null,
    kind: "point"
  }));

  return [{
    ...data,
    id: activityId,
    targets: stateTargets
  }, {
    ...data,
    id: `us-capitals-${sectionId}`,
    targets: capitalTargets
  }];
}

const journey = journeyPresets.find((candidate) => candidate.id === "united-states");
const activities = stateActivityIds.flatMap(readUnitedStatesTrailActivities);
const items = buildUnitedStatesMemoryTrailItems(journey, activities);
const validation = validateUnitedStatesMemoryTrailCurriculum(items);

assert.equal(validation.isValid, true, JSON.stringify(validation, null, 2));
assert.equal(validation.stateCount, 50);
assert.equal(validation.uniqueStateCount, 50);
assert.equal(validation.capitalCount, 50);
assert.equal(validation.uniqueCapitalCount, 50);
assert.equal(validation.uniqueCapitalItemCount, 50);
assert.deepEqual(validation.sectionIds, stateActivityIds);
assert.deepEqual(validation.duplicateTargetIds, []);
assert.deepEqual(validation.duplicateCapitalTargetIds, []);
assert.deepEqual(validation.invalidCapitalLinks, []);
assert.deepEqual(validation.statesWithoutCapital, []);
assert.deepEqual(validation.excludedTargetIdsPresent, []);
assert.deepEqual(validation.excludedCapitalTargetIdsPresent, []);
assert.equal(items.some((item) => item.targetId === "washington-dc"), false);
assert.equal(items.some((item) => item.targetId === "district-of-columbia"), false);
assert.equal(items.some((item) => item.id === "capital:washington-dc"), false);
assert.ok(items.some((item) => item.id === "capital:augusta-me" && item.relatedStateItemId === "state:maine"));
assert.ok(items.some((item) => item.id === "capital:austin-tx" && item.relatedStateItemId === "state:texas"));

const orders = items.map((item) => item.order);
assert.deepEqual(orders, [...orders].sort((left, right) => left - right), "Curriculum items should preserve section order.");

console.log("United States Memory Trail curriculum validation passed.");
