import assert from "node:assert/strict";
import fs from "node:fs";

const runtimeSource = fs.readFileSync(
  new URL("../src/maplibre-poc.js", import.meta.url),
  "utf8"
);
const runnerSource = fs.readFileSync(
  new URL("../src/maplibre/maplibre-activity-runner.js", import.meta.url),
  "utf8"
);

[
  "function isActiveAdaptiveTrailMemoryTrailVisualState(memoryTrail, selection = {})",
  "function shouldSuppressDailyTrailStudyTargetEmphasis(memoryTrail, selection = {})",
  "return isActiveAdaptiveTrailMemoryTrailVisualState(memoryTrail, selection);",
  "phase !== \"idle\"",
  "phase !== \"complete\"",
  "getAdaptiveTrailGameplayScreen(memoryTrail)",
  "runner?.setMemoryTrailStudyTargetEmphasisSuppressed?.(\n    shouldSuppressDailyTrailStudyTargetEmphasis(memoryTrail, selection),\n    \"daily-trail-active-prompt\"\n  );\n  runner?.setMemoryTrailCheckpointPreAnswerStyle?.(checkpointPreAnswerStyle);",
  "runner.setMemoryTrailHighlight(shouldHighlightPromptTarget ? selection.targetId : []);",
  "correct-answer:suppression-preserved",
  "incorrect-answer:suppression-preserved"
].forEach((hook) => assert.ok(runtimeSource.includes(hook), `Missing active visual suppression hook: ${hook}`));

[
  "setMemoryTrailStudyTargetEmphasisSuppressed(isSuppressed = false, reason = \"\")",
  "isMemoryTrailStudyTargetEmphasisSuppressed()",
  "const suppressedStudyTargetHitFillOpacity = 0.001;",
  "const suppressStudyTargetEmphasis = this.isMemoryTrailStudyTargetEmphasisSuppressed();",
  "suppressStudyTargetEmphasis,\n        [\"match\", [\"get\", \"id\"], ...this.getMutedTargetColorStops(), colors.targetFill]",
  "suppressStudyTargetEmphasis,\n        suppressedStudyTargetHitFillOpacity",
  "suppressStudyTargetEmphasis,\n        colors.targetStroke",
  "blueOutlineSource: preAnswerOutlineSuppressed || suppressStudyTargetEmphasis ? \"suppressed\"",
  "[\"in\", [\"get\", \"id\"], [\"literal\", this.memoryTrailHighlightIds]],\n        colors.memoryTrailFill,\n        suppressStudyTargetEmphasis"
].forEach((hook) => assert.ok(runnerSource.includes(hook), `Missing runner suppression precedence hook: ${hook}`));

const correctAnswerStart = runtimeSource.indexOf("function handleCorrectMemoryTrailAnswer(memoryTrail, targetId, options = {})");
const correctAnswerEnd = runtimeSource.indexOf("function handleIncorrectMemoryTrailAnswer", correctAnswerStart);
const correctAnswerSource = runtimeSource.slice(correctAnswerStart, correctAnswerEnd);
assert.ok(!correctAnswerSource.includes("setMemoryTrailStudyTargetEmphasisSuppressed?.(false)"), "Correct-answer feedback must not clear Daily Trail suppression.");

const incorrectAnswerStart = runtimeSource.indexOf("function handleIncorrectMemoryTrailAnswer(memoryTrail, expectedTargetId, options = {})");
const incorrectAnswerEnd = runtimeSource.indexOf("function maybeSpeakPlaceToNameFeedbackTarget", incorrectAnswerStart);
const incorrectAnswerSource = runtimeSource.slice(incorrectAnswerStart, incorrectAnswerEnd);
assert.ok(!incorrectAnswerSource.includes("setMemoryTrailStudyTargetEmphasisSuppressed?.(false)"), "Incorrect/correction feedback must not clear Daily Trail suppression.");

console.log("Daily Trail active visual suppression check passed.");
