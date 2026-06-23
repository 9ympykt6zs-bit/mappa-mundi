import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(
  new URL("../src/maplibre-poc.js", import.meta.url),
  "utf8"
);

const applyStart = source.indexOf("function applyMemoryTrailPromptSelection(");
const applyEnd = source.indexOf("function shouldSpeakMemoryTrailTargetAtPromptStart(", applyStart);
const applySource = source.slice(applyStart, applyEnd);
const highlightIndex = applySource.indexOf("runner.setMemoryTrailHighlight(shouldHighlightPromptTarget ? selection.targetId : []);");
const cameraIndex = applySource.indexOf("const dailyTrailLearnCameraPromise = scheduleDailyTrailTargetLearnCamera(memoryTrail, selection, target);");
const cameraBarrierIndex = applySource.indexOf("const learnCameraReadyPromise = Promise.all([");
const speechIndex = applySource.indexOf("speakMemoryTrailPromptTargetAfterInstruction(");

assert.ok(highlightIndex >= 0, "Learn highlights must be applied in the prompt path.");
assert.ok(cameraIndex > highlightIndex, "Learn camera movement must be initiated after the highlight.");
assert.ok(cameraBarrierIndex > cameraIndex, "Learn camera readiness must combine the active Learn camera routes.");
assert.ok(speechIndex > cameraBarrierIndex, "Target-name narration must be scheduled after Learn camera movement.");

const narrationStart = source.indexOf("function speakMemoryTrailPromptTargetAfterInstruction(");
const narrationEnd = source.indexOf("function shouldUseMemoryTrailTargetSpeechFallback(", narrationStart);
const narrationSource = source.slice(narrationStart, narrationEnd);
assert.ok(narrationSource.includes("Promise.allSettled([instructionSpeechPromise, learnCameraReadyPromise])"));
assert.ok(narrationSource.includes('attempt("instruction-and-learn-camera-ready")'));
assert.ok(narrationSource.includes("Promise.resolve(learnCameraReadyPromise)"));
assert.ok(narrationSource.includes("let didAttempt = false;"));

const cameraStart = source.indexOf("function scheduleDailyTrailTargetLearnCamera(");
const cameraEnd = source.indexOf("function completeDailyTrailDevReplaySession(", cameraStart);
const cameraSource = source.slice(cameraStart, cameraEnd);
assert.ok(cameraSource.includes("isMixedDailyTrailCheckpointMemoryTrail(memoryTrail)"), "Checkpoint sessions must remain excluded.");
assert.ok(cameraSource.includes('selection?.promptType !== "guided"'), "Only Learn prompts may use this camera handoff.");
assert.ok(cameraSource.includes("const didMove = runner.moveCamera({"));
assert.ok(!cameraSource.slice(0, cameraSource.indexOf("const didMove = runner.moveCamera({")).includes("window.setTimeout"), "Learn camera movement must not be deferred before narration gating.");
assert.ok(cameraSource.includes("}, duration + 100);"), "Target narration must wait through a bounded camera-settle delay.");
assert.ok(source.includes("function scheduleSmallTargetLearnFocusCheck("));
assert.ok(source.includes("const settleTimeoutId = window.setTimeout(() => resolve(true), (focusOptions.duration || 720) + 100);"));
assert.ok(source.includes("function scheduleContinentsOceansLearnFocusCheck("));
assert.ok(source.includes("const settleTimeoutId = window.setTimeout(() => resolve(true), 800);"));

console.log("Daily Trail Learn camera/audio sequencing check passed.");
