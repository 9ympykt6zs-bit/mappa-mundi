import assert from "node:assert/strict";
import {
  applyUnitedStatesMemoryTrailSessionSnapshot,
  buildUnitedStatesMemoryTrailItems,
  createUnitedStatesMemoryTrailState,
  loadUnitedStatesMemoryTrailProgress,
  planUnitedStatesMemoryTrailSession,
  resetUnitedStatesMemoryTrailProgress,
  saveUnitedStatesMemoryTrailProgress,
  unitedStatesMemoryTrailStorageKey
} from "../src/united-states-memory-trail-planner.js";
import { journeyPresets } from "../src/journey-presets.js";
import fs from "node:fs";

const storage = new Map();
globalThis.localStorage = {
  getItem: (key) => storage.has(key) ? storage.get(key) : null,
  setItem: (key, value) => storage.set(key, String(value)),
  removeItem: (key) => storage.delete(key)
};

const stateActivityIds = Array.from({ length: 11 }, (_, index) => `us-states-${String(index + 1).padStart(2, "0")}`);

function readStateActivity(activityId) {
  const sectionId = activityId.replace("us-states-", "");
  const data = JSON.parse(fs.readFileSync(`assets/maps/data/us-states-capitals-${sectionId}.json`, "utf8"));
  return {
    ...data,
    id: activityId,
    targets: (data.features || []).filter((feature) => feature.type === "state").map((feature) => ({
      ...feature,
      kind: "shape"
    }))
  };
}

const journey = journeyPresets.find((candidate) => candidate.id === "united-states");
const items = buildUnitedStatesMemoryTrailItems(journey, stateActivityIds.map(readStateActivity));
const state = createUnitedStatesMemoryTrailState(null, items);
const plan = planUnitedStatesMemoryTrailSession(state, items);
const snapshot = {
  source: "united-states-trail",
  activityId: plan.activeActivityId,
  phase: "answering",
  currentPromptTargetId: plan.newItems[0].targetId,
  currentPromptType: "name_to_place",
  promptHistory: [{ targetId: plan.newItems[0].targetId, promptType: "name_to_place" }],
  targetStats: {}
};
const withSession = applyUnitedStatesMemoryTrailSessionSnapshot(state, plan, {
  status: "active",
  promptSnapshot: snapshot,
  memoryTrailSnapshot: snapshot
});

saveUnitedStatesMemoryTrailProgress(withSession, items);
const loaded = loadUnitedStatesMemoryTrailProgress(items);
assert.equal(loaded.activeSession.status, "active");
assert.equal(loaded.activeSession.memoryTrailSnapshot.currentPromptTargetId, plan.newItems[0].targetId);
assert.equal(loaded.activeSession.plan.source, "united-states-trail");

const invalidLoaded = createUnitedStatesMemoryTrailState({
  ...loaded,
  activeSession: {
    ...loaded.activeSession,
    plan: {
      ...loaded.activeSession.plan,
      playItems: [{ id: "state:not-real", targetId: "not-real" }]
    }
  }
}, items);
assert.equal(invalidLoaded.activeSession, null, "Invalid active sessions should be discarded without clearing progress.");

localStorage.setItem("mappaDailyTrailProgress", JSON.stringify({ sentinel: true }));
localStorage.setItem("atlasQuestProgress", JSON.stringify({ sentinel: true }));
resetUnitedStatesMemoryTrailProgress();
assert.equal(localStorage.getItem(unitedStatesMemoryTrailStorageKey), null);
assert.equal(localStorage.getItem("mappaDailyTrailProgress"), JSON.stringify({ sentinel: true }));
assert.equal(localStorage.getItem("atlasQuestProgress"), JSON.stringify({ sentinel: true }));

console.log("United States Memory Trail persistence validation passed.");
