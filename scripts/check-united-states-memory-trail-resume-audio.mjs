import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/maplibre-poc.js", import.meta.url), "utf8");

const helperStart = source.indexOf("function replayCurrentMemoryTrailPromptInstructionOnResume(memoryTrail)");
const helperEnd = source.indexOf("function persistActiveUnitedStatesMemoryTrailSnapshot", helperStart);
assert.ok(helperStart > 0, "Resume audio helper must exist.");
assert.ok(helperEnd > helperStart, "Resume audio helper must stay near the U.S. Trail restore path.");

const helperSource = source.slice(helperStart, helperEnd);
[
  "const promptKey = memoryTrail?.currentPromptKey || \"\";",
  "const targetId = memoryTrail?.currentPromptTargetId || \"\";",
  "isCurrentUnitedStatesMemoryTrailResumePrompt(memoryTrail, promptKey, targetId)",
  "const selection = getRestoredMemoryTrailPromptSelection(memoryTrail);",
  "if (memoryTrail.phase === \"correction\")",
  "maybeSpeakMemoryTrailInstruction(",
  "`correction:${promptKey}`",
  "if (memoryTrail.phase !== \"answering\")",
  "const instructionSpeechPromise = updateMemoryTrailInstructionCue(memoryTrail, selection);",
  "shouldSpeakMemoryTrailTargetAtPromptStart(memoryTrail, target, selection)",
  "speakMemoryTrailPromptTargetAfterInstruction(",
  "Promise.allSettled([instructionSpeechPromise, targetSpeechPromise])",
  ".catch(() => false)"
].forEach((needle) => {
  assert.ok(helperSource.includes(needle), `Resume audio helper missing guard/step: ${needle}`);
});

[
  "promptNextMemoryTrailTarget(",
  "applyMemoryTrailPromptSelection("
].forEach((forbidden) => {
  assert.ok(!helperSource.includes(forbidden), `Resume audio helper must not mutate prompt flow via ${forbidden}`);
});

const restoreStart = source.indexOf("function restoreUnitedStatesMemoryTrailMemoryTrailSnapshot(memoryTrail, snapshot = {})");
const restoreEnd = source.indexOf("function isCurrentUnitedStatesMemoryTrailResumePrompt", restoreStart);
const restoreSource = source.slice(restoreStart, restoreEnd);
const renderIndex = restoreSource.indexOf("renderStudyExplorePanel();");
const audioIndex = restoreSource.indexOf("const resumeAudioPromise = replayCurrentMemoryTrailPromptInstructionOnResume(memoryTrail);");
const timerIndex = restoreSource.indexOf("scheduleMemoryTrailPromptResponseTimer(");
assert.ok(renderIndex >= 0 && renderIndex < audioIndex, "Resume audio must be requested after restored prompt render.");
assert.ok(audioIndex >= 0 && audioIndex < timerIndex, "Response timer must be scheduled after resume audio request.");
assert.ok(restoreSource.includes("resumeAudioPromise"), "Response timer should wait on the resume audio promise.");
assert.ok(!restoreSource.includes("Promise.resolve()\n  );"), "Restored prompt timer must not use an immediate resolved promise.");

const targetSpeechStart = source.indexOf("function speakMemoryTrailPromptTargetAfterInstruction(");
const targetSpeechEnd = source.indexOf("function shouldUseMemoryTrailTargetSpeechFallback", targetSpeechStart);
const targetSpeechSource = source.slice(targetSpeechStart, targetSpeechEnd);
assert.ok(
  targetSpeechSource.includes("&& memoryTrail.phase === \"answering\""),
  "Target-name follow-up must be skipped after a rapid answer leaves answering phase."
);

console.log("United States Memory Trail resume audio validation passed.");
