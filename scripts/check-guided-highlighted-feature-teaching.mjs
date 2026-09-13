import assert from "node:assert/strict";

import { getGuidedHighlightedFeatureTeachingCopy } from "../src/guided-highlighted-feature-teaching.js";

const expected = {
  state: ["Learn these states.", "Tap the highlighted state."],
  "mountain-range": ["Learn these mountain ranges.", "Tap the highlighted mountain range."],
  river: ["Learn these rivers.", "Tap the highlighted river."],
  lake: ["Learn these lakes.", "Tap the highlighted lake."]
};

for (const [family, [familyInstruction, actionInstruction]] of Object.entries(expected)) {
  const copy = getGuidedHighlightedFeatureTeachingCopy({
    family,
    targetName: "Example Feature",
    targetCount: 3
  });
  assert.equal(copy.familyInstruction, familyInstruction);
  assert.equal(copy.actionInstruction, actionInstruction);
  assert.equal(
    copy.targetInstruction,
    `${actionInstruction.slice(0, -1)}: Example Feature.`,
    `${family} redirects name the same highlighted target without changing the teaching task.`
  );
}

assert.equal(
  getGuidedHighlightedFeatureTeachingCopy({ family: "river", targetCount: 1 }).familyInstruction,
  "Learn this river."
);

console.log("Guided highlighted-feature teaching copy is consistent across states, mountain ranges, rivers, and lakes.");
