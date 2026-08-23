import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  adaptCanonicalMentalMapEvaluation,
  getCanonicalMentalMapConceptId
} from "../src/canonical-learning-evidence.js";
import { evaluateMentalMapAnswer } from "../src/atlas/mental-map-challenge-engine.js";
import {
  createUnlabeledMapHintState,
  toggleUnlabeledMapHint,
  UNLABELED_US_MAP_SOURCE,
  wasUnlabeledMapHintUsed
} from "../src/atlas/unlabeled-map-hint.js";
import { getUnitedStatesRelationshipChallenges } from "../src/atlas/united-states-relationship-challenges.js";
import { applyProgressEvidencePolicy } from "../src/progress-evidence-policy.js";

const hidden = createUnlabeledMapHintState({ available: true });
assert.deepEqual(hidden, { available: true, visible: false, used: false });
const shown = toggleUnlabeledMapHint(hidden);
assert.deepEqual(shown, { available: true, visible: true, used: true });
const hiddenAgain = toggleUnlabeledMapHint(shown);
assert.deepEqual(hiddenAgain, { available: true, visible: false, used: true });
assert.equal(wasUnlabeledMapHintUsed(hiddenAgain), true);
assert.deepEqual(
  createUnlabeledMapHintState({ available: true }),
  hidden,
  "A new question must start with fresh hint usage."
);
assert.deepEqual(toggleUnlabeledMapHint(createUnlabeledMapHintState()), createUnlabeledMapHintState());

assert.equal(UNLABELED_US_MAP_SOURCE, "assets/maps/usa/usa-map.svg#usa-states");
const mapSvg = readFileSync(new URL("../assets/maps/usa/usa-map.svg", import.meta.url), "utf8");
assert.equal(/<text\b/i.test(mapSvg), false, "The hint source must not contain labels.");
assert.equal(/capital-(?:label|marker)|class=["'][^"']*capital/i.test(mapSvg), false, "The hint source must not contain capital labels or markers.");
assert.equal((mapSvg.match(/class="[^"]*\bstate-path\b[^"]*"/g) || []).length, 51, "The hint source must contain all 50 states plus the District of Columbia outline.");
assert.match(mapSvg, /id="alaska"/);
assert.match(mapSvg, /id="hawaii"/);

const challenge = getUnitedStatesRelationshipChallenges()
  .find(({ id }) => id === "us-relationship-international-border-ohio-canada");
const correctEvaluation = evaluateMentalMapAnswer(challenge, ["ohio"]);
const incorrectEvaluation = evaluateMentalMapAnswer(challenge, ["alabama"]);
const eventContext = {
  challenge,
  conceptId: getCanonicalMentalMapConceptId(challenge),
  occurredAt: "2036-08-23T12:00:00.000Z",
  sourceMode: "mental-map",
  sourceActivityId: challenge.sourceActivityId
};
const independent = adaptCanonicalMentalMapEvaluation({
  ...eventContext,
  evaluation: correctEvaluation,
  eventId: "connections-independent",
  attemptId: "connections-independent"
});
const assisted = adaptCanonicalMentalMapEvaluation({
  ...eventContext,
  evaluation: correctEvaluation,
  assisted: true,
  eventId: "connections-assisted",
  attemptId: "connections-assisted"
});
const incorrectAfterHint = adaptCanonicalMentalMapEvaluation({
  ...eventContext,
  evaluation: incorrectEvaluation,
  assisted: true,
  eventId: "connections-incorrect",
  attemptId: "connections-incorrect"
});
assert.equal(independent.outcome, "correct");
assert.equal(assisted.outcome, "assisted");
assert.equal(incorrectAfterHint.outcome, "incorrect");
assert.deepEqual(assisted.credit, independent.credit, "Visible activity scoring must not change when the hint is used.");

const progress = applyProgressEvidencePolicy([assisted, assisted]);
assert.equal(progress.uniqueEventCount, 1, "Repeated writes for one attempt must be deduplicated.");
assert.deepEqual(progress.duplicateEventIds, [assisted.eventId]);
assert.deepEqual(progress.histories.map(({ correctCount, incorrectCount, assistedCount }) => ({
  correctCount,
  incorrectCount,
  assistedCount
})), [{ correctCount: 0, incorrectCount: 0, assistedCount: 1 }]);

console.log("Unlabeled U.S. map hint contract check passed.");
