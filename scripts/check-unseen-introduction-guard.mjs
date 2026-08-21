import assert from "node:assert/strict";
import fs from "node:fs";

import { adaptCanonicalRetrievalAttempt } from "../src/canonical-learning-evidence.js";
import { findMemoryTrailGuidedExposureTarget } from "../src/memory-trail-introduction-guard.js";

const stats = {
  maine: { targetId: "maine", exposedCount: 1, guidedTapCount: 1 },
  ohio: { targetId: "ohio", exposedCount: 0, guidedTapCount: 0 },
  utah: { targetId: "utah", exposedCount: 1, guidedTapCount: 0 }
};
assert.equal(findMemoryTrailGuidedExposureTarget({
  currentPracticeTargetIds: ["maine", "ohio", "utah"],
  targetStats: stats,
  lastPromptedTargetId: "maine",
  introducedTargetCount: 3
})?.targetId, "ohio", "A wholly unseen current-window target must receive guided exposure first.");
assert.equal(findMemoryTrailGuidedExposureTarget({
  currentPracticeTargetIds: ["maine", "utah"],
  targetStats: stats,
  lastPromptedTargetId: "maine",
  introducedTargetCount: 2
})?.targetId, "utah", "Exposure without a completed guided tap must not unlock retrieval.");
assert.equal(findMemoryTrailGuidedExposureTarget({
  currentPracticeTargetIds: ["maine"],
  targetStats: stats,
  lastPromptedTargetId: "maine",
  introducedTargetCount: 1
}), null);

const singleUnseen = { ohio: { ...stats.ohio } };
assert.equal(findMemoryTrailGuidedExposureTarget({
  currentPracticeTargetIds: ["ohio"],
  targetStats: singleUnseen,
  lastPromptedTargetId: "ohio",
  introducedTargetCount: 1
})?.targetId, "ohio", "A one-item window must not deadlock merely because the item was last prompted.");

const guidedEvidence = adaptCanonicalRetrievalAttempt({
  item: { id: "state:ohio", type: "state", targetId: "ohio" },
  promptType: "guided",
  result: "correct",
  eventId: "guided-ohio",
  attemptId: "guided-ohio",
  occurredAt: "2032-01-01T00:00:00.000Z",
  sourceMode: "united-states-trail"
});
assert.equal(guidedEvidence.outcome, "assisted", "Guided exposure must not be recorded as correct retrieval evidence.");
assert.equal(guidedEvidence.skillId, "locating");

const runtimeSource = fs.readFileSync(new URL("../src/maplibre-poc.js", import.meta.url), "utf8");
const chooseStart = runtimeSource.indexOf("function chooseNextPrompt(memoryTrail)");
const chooseEnd = runtimeSource.indexOf("function chooseRetrievalPromptType", chooseStart);
const chooseSource = runtimeSource.slice(chooseStart, chooseEnd);
assert.ok(chooseSource.indexOf("findMemoryTrailGuidedExposureTarget") >= 0);
assert.ok(chooseSource.indexOf("findMemoryTrailGuidedExposureTarget") < chooseSource.indexOf("getDailyTrailMissedNewItemRetry"), "The exposure guard must run before retrieval branches.");
assert.match(chooseSource, /promptType: "guided"/);
assert.match(chooseSource, /reason: "new chunk target needs guided exposure"/);

const updateStart = runtimeSource.indexOf("function updateMemoryTrailStats(memoryTrail");
const updateEnd = runtimeSource.indexOf("function getMasteryDebugPlace", updateStart);
const updateSource = runtimeSource.slice(updateStart, updateEnd);
assert.ok(updateSource.indexOf("if (isGuided)") < updateSource.indexOf("stats.totalRetrievalAttempts += 1"));
assert.ok(updateSource.indexOf("return;", updateSource.indexOf("if (isGuided)")) < updateSource.indexOf("stats.totalRetrievalAttempts += 1"), "Guided results must return before retrieval counters update.");

console.log("Unseen introduction guard validation passed: guided exposure precedes retrieval and remains assisted evidence.");
