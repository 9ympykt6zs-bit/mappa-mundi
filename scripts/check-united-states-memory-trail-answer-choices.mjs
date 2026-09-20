import assert from "node:assert/strict";
import fs from "node:fs";

import {
  collectUnitedStatesAnswerChoiceDistractors,
  getUnitedStatesAnswerChoiceTargetCategory
} from "../src/united-states-memory-trail-answer-choices.js";
import {
  buildUnitedStatesMemoryTrailItems,
  createUnitedStatesMemoryTrailState,
  planUnitedStatesMemoryTrailSession
} from "../src/united-states-memory-trail-planner.js";
import { isExcludedPhaseOneTargetId } from "../src/united-states-memory-trail-target-scope.js";
import { journeyPresets } from "../src/journey-presets.js";

assert.equal(getUnitedStatesAnswerChoiceTargetCategory({ type: "capital" }), "capital");
assert.equal(getUnitedStatesAnswerChoiceTargetCategory({ type: "state" }), "state");
assert.equal(getUnitedStatesAnswerChoiceTargetCategory({ type: "federal-district" }), "state");
assert.equal(getUnitedStatesAnswerChoiceTargetCategory({ type: "city" }), "");
assert.equal(getUnitedStatesAnswerChoiceTargetCategory(null), "");

const syntheticActivities = [
  {
    id: "us-capitals-01",
    targets: [
      { id: "augusta-me", type: "capital", name: "Augusta" },
      { id: "concord-nh", type: "capital", name: "Concord" },
      { id: "washington-dc", type: "capital", name: "Washington" },
      { id: "montpelier-vt", type: "capital", name: "Montpelier" }
    ]
  },
  {
    id: "us-capitals-02",
    targets: [
      { id: "montpelier-vt", type: "capital", name: "Montpelier duplicate" },
      { id: "albany-ny", type: "capital", name: "Albany" }
    ]
  },
  {
    id: "us-states-01",
    targets: [
      { id: "maine", type: "state", name: "Maine" },
      { id: "district-of-columbia", type: "federal-district", name: "Washington, D.C." }
    ]
  },
  {
    id: "european-cities",
    targets: [{ id: "paris", type: "capital", name: "Paris" }]
  }
];

assert.deepEqual(
  collectUnitedStatesAnswerChoiceDistractors({
    activities: syntheticActivities,
    category: "capital",
    excludeTargetId: "augusta-me"
  }).map((target) => target.id),
  ["concord-nh", "montpelier-vt", "albany-ny"],
  "Capital distractors exclude the prompt target, dedupe across sections, and skip excluded targets."
);
assert.deepEqual(
  collectUnitedStatesAnswerChoiceDistractors({
    activities: syntheticActivities,
    category: "state",
    excludeTargetId: ""
  }).map((target) => target.id),
  ["maine"],
  "State distractors come only from U.S. states activities and skip the excluded federal district."
);
assert.deepEqual(
  collectUnitedStatesAnswerChoiceDistractors({ activities: syntheticActivities, category: "" }),
  [],
  "An unknown category yields no catalog distractors."
);

function loadUnitedStatesSplitActivities() {
  const splitActivities = [];
  for (let section = 1; section <= 11; section += 1) {
    const suffix = String(section).padStart(2, "0");
    const raw = JSON.parse(fs.readFileSync(`assets/maps/data/us-states-capitals-${suffix}.json`, "utf8"));
    const features = (raw.features || []).map((target) => ({
      ...target,
      kind: target.type === "capital" || target.type === "city" || target.shape === "circle" ? "point" : "shape"
    }));
    const stateTargets = features.filter((target) => target.type === "state" || target.type === "federal-district");
    const capitalTargets = features
      .filter((target) => target.type === "capital")
      .map((target) => ({ ...target, name: target.city || target.name }));
    splitActivities.push({ id: `us-states-${suffix}`, targets: stateTargets, map: raw.map });
    splitActivities.push({ id: `us-capitals-${suffix}`, targets: capitalTargets, map: raw.map });
  }
  return splitActivities;
}

const activities = loadUnitedStatesSplitActivities();
const journey = journeyPresets.find((preset) => preset.id === "united-states");
const items = buildUnitedStatesMemoryTrailItems(journey, activities);
assert.equal(items.filter((item) => item.type === "capital").length, 50, "The curriculum still has 50 capitals.");
assert.equal(items.filter((item) => item.type === "state").length, 50, "The curriculum still has 50 states.");

activities
  .flatMap((activity) => activity.targets)
  .filter((target) => !isExcludedPhaseOneTargetId(target.id))
  .forEach((target) => {
    const category = getUnitedStatesAnswerChoiceTargetCategory(target);
    const distractors = collectUnitedStatesAnswerChoiceDistractors({
      activities,
      category,
      excludeTargetId: target.id
    });
    assert.ok(
      distractors.length >= 3,
      `${target.id} should have at least three ${category} catalog distractors, found ${distractors.length}.`
    );
    assert.ok(
      distractors.every((candidate) => candidate.id !== target.id && !isExcludedPhaseOneTargetId(candidate.id)),
      `${target.id} distractors must not repeat the prompt target or include excluded targets.`
    );
  });

const sectionOneStates = items.filter((item) => item.homeActivityId === "us-states-01" && item.type === "state");
const singleEligibleCapitalState = createUnitedStatesMemoryTrailState({}, items);
singleEligibleCapitalState.introducedItemIds = sectionOneStates.map((item) => item.id);
sectionOneStates.forEach((item, index) => {
  singleEligibleCapitalState.itemProgress[item.id] = {
    status: "introduced",
    correctCount: index === 0 ? 1 : 0
  };
});
const plan = planUnitedStatesMemoryTrailSession(singleEligibleCapitalState, items);
const poolCapitals = plan.playItems.filter((item) => item.type === "capital");
assert.equal(
  poolCapitals.length,
  1,
  "Regression setup should reproduce a Guided Learning session pool with exactly one capital."
);
const fallbackDistractors = collectUnitedStatesAnswerChoiceDistractors({
  activities,
  category: "capital",
  excludeTargetId: poolCapitals[0].targetId
});
assert.ok(
  fallbackDistractors.length >= 3,
  "The catalog fallback must supply at least three distractors when the session pool holds a single capital."
);

const source = fs.readFileSync("src/maplibre-poc.js", "utf8");
assert.ok(
  source.includes("from \"./united-states-memory-trail-answer-choices.js\""),
  "maplibre-poc.js should import the answer-choice distractor module."
);
const builderStart = source.indexOf("function buildMemoryTrailAnswerChoices(");
const builderEnd = source.indexOf("function getUnitedStatesMemoryTrailAnswerChoiceCategory", builderStart);
assert.ok(builderStart !== -1 && builderEnd > builderStart, "buildMemoryTrailAnswerChoices should exist.");
const builderSource = source.slice(builderStart, builderEnd);
assert.ok(
  builderSource.includes("collectUnitedStatesAnswerChoiceDistractors({"),
  "buildMemoryTrailAnswerChoices should top up same-category choices from the U.S. catalog."
);
assert.ok(
  builderSource.includes("byId.size < MEMORY_TRAIL_ANSWER_CHOICE_COUNT && choiceCategory"),
  "The catalog fallback should stay scoped to categorized U.S. prompts that lack enough session distractors."
);
assert.ok(
  source.includes("return getUnitedStatesAnswerChoiceTargetCategory(target);"),
  "The U.S. answer-choice category should share the module classification."
);

assert.equal(isExcludedPhaseOneTargetId("district-of-columbia"), true);
assert.equal(isExcludedPhaseOneTargetId("washington-dc"), true);
assert.equal(isExcludedPhaseOneTargetId("maine"), false);
assert.equal(isExcludedPhaseOneTargetId(""), false);

const plannerSource = fs.readFileSync("src/united-states-memory-trail-planner.js", "utf8");
assert.ok(
  !plannerSource.includes("export const excludedPhaseOneTargetIds"),
  "The planner should consume the shared exclusion predicate instead of exporting a mutable Set."
);
assert.ok(
  plannerSource.includes("from \"./united-states-memory-trail-target-scope.js\""),
  "The planner should import the exclusion predicate from the neutral target-scope module."
);
const answerChoicesModuleSource = fs.readFileSync("src/united-states-memory-trail-answer-choices.js", "utf8");
assert.ok(
  answerChoicesModuleSource.includes("from \"./united-states-memory-trail-target-scope.js\""),
  "The answer-choice module should import the exclusion predicate from the neutral target-scope module."
);
assert.ok(
  !answerChoicesModuleSource.includes("from \"./united-states-memory-trail-planner.js\""),
  "The answer-choice module should not depend on the planner."
);

const nameChoiceStart = source.indexOf("function handleMemoryTrailNameChoice(");
const nameChoiceEnd = source.indexOf("function handleMemoryTrailCorrectionTap(", nameChoiceStart);
assert.ok(nameChoiceStart !== -1 && nameChoiceEnd > nameChoiceStart, "handleMemoryTrailNameChoice should exist.");
assert.ok(
  source.slice(nameChoiceStart, nameChoiceEnd).includes("selectedTargetLabel"),
  "Answer-chip selection should pass the chosen label through to incorrect-answer feedback."
);
const correctionFeedbackStart = source.indexOf("function createMemoryTrailCorrectionFeedback(");
const correctionFeedbackEnd = source.indexOf("function createMemoryTrailMissFeedback(", correctionFeedbackStart);
assert.ok(
  correctionFeedbackStart !== -1 && correctionFeedbackEnd > correctionFeedbackStart,
  "createMemoryTrailCorrectionFeedback should exist."
);
assert.ok(
  source.slice(correctionFeedbackStart, correctionFeedbackEnd).includes("options.selectedTargetLabel"),
  "Correction feedback should fall back to the persisted choice label when the selected distractor is outside the session pool."
);

const restoreChoicesStart = source.indexOf("function isRestoredUnitedStatesMemoryTrailAnswerChoiceBankValid(");
const restoreSnapshotStart = source.indexOf("function restoreUnitedStatesMemoryTrailMemoryTrailSnapshot(");
assert.ok(
  restoreChoicesStart !== -1 && restoreSnapshotStart > restoreChoicesStart,
  "The restore-time answer choice repair should be defined before the snapshot restore."
);
const restoreChoicesSource = source.slice(restoreChoicesStart, restoreSnapshotStart);
assert.ok(
  restoreChoicesSource.includes("memoryTrail?.phase !== \"answering\"")
    && restoreChoicesSource.includes("memoryTrail.currentPromptType !== \"place_to_name\""),
  "The restore repair should only touch prompts that are actively awaiting a naming answer."
);
assert.ok(
  restoreChoicesSource.includes("buildMemoryTrailAnswerChoices("),
  "A broken restored answer bank should be rebuilt through the standard choice builder."
);
assert.ok(
  restoreChoicesSource.includes("uniqueChoiceIds.size >= expectedChoiceCount")
    && restoreChoicesSource.includes("uniqueChoiceIds.has(target.id)"),
  "A valid restored bank must keep a full set of unique choices including the prompt target."
);
assert.ok(
  source.slice(restoreSnapshotStart).includes("restoreUnitedStatesMemoryTrailAnswerChoices(memoryTrail);"),
  "Snapshot restore should validate and repair persisted answer choices."
);

console.log("United States Guided Learning answer choices keep a full same-category bank.");
