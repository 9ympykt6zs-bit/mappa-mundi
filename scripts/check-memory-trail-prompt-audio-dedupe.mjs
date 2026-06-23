import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const chipSpeechSource = fs.readFileSync(
  new URL("../src/chip-speech.js", import.meta.url),
  "utf8"
);
const mapSource = fs.readFileSync(
  new URL("../src/maplibre-poc.js", import.meta.url),
  "utf8"
);

function createSpeechRuntime({ errorAfterStart = false } = {}) {
  const audioMetrics = { playCount: 0 };
  const browserSpeechMetrics = { cancelCount: 0, speakCount: 0 };

  class FakeAudio {
    constructor() {
      this.listeners = new Map();
      this.__atlasQuestCancelled = false;
    }

    addEventListener(type, listener) {
      this.listeners.set(type, listener);
    }

    removeEventListener(type, listener) {
      if (this.listeners.get(type) === listener) {
        this.listeners.delete(type);
      }
    }

    emit(type) {
      this.listeners.get(type)?.();
    }

    play() {
      audioMetrics.playCount += 1;
      queueMicrotask(() => {
        this.emit("playing");
        this.emit(errorAfterStart ? "error" : "ended");
      });
      return Promise.resolve();
    }

    pause() {}
    removeAttribute() {}
    load() {}
  }

  class FakeUtterance {
    constructor(text) {
      this.text = text;
    }
  }

  const runtime = {
    Audio: FakeAudio,
    SpeechSynthesisUtterance: FakeUtterance,
    speechSynthesis: {
      cancel() {
        browserSpeechMetrics.cancelCount += 1;
      },
      speak(utterance) {
        browserSpeechMetrics.speakCount += 1;
        queueMicrotask(() => utterance.onend?.());
      }
    },
    fetch: async () => ({
      ok: true,
      json: async () => ({
        chips: {},
        instructions: {
          "Learn these countries": "assets/audio/instructions/learn-these-countries.mp3"
        }
      })
    }),
    localStorage: { getItem: () => null, setItem: () => {} },
    setTimeout,
    clearTimeout,
    queueMicrotask,
    console,
    window: null
  };
  runtime.window = runtime;
  vm.runInNewContext(chipSpeechSource, runtime, { filename: "chip-speech.js" });

  return { speech: runtime.GeographyChipSpeech, audioMetrics, browserSpeechMetrics };
}

const generatedAudioRuntime = createSpeechRuntime();
const duplicatePrompt = "memory-trail-audio-1:1:guided:canada:0:instruction:guided:learn:introducing";
const duplicateResults = await Promise.all([
  generatedAudioRuntime.speech.speakLabelAndWait("Learn these countries", { queue: true, dedupeKey: duplicatePrompt }),
  generatedAudioRuntime.speech.speakLabelAndWait("Learn these countries", { queue: true, dedupeKey: duplicatePrompt })
]);
assert.deepEqual(duplicateResults, [true, true]);
assert.equal(generatedAudioRuntime.audioMetrics.playCount, 1, "A deduped prompt must start one generated-audio playback.");
assert.equal(generatedAudioRuntime.browserSpeechMetrics.speakCount, 0, "Generated audio must not also use browser speech.");

const postStartErrorRuntime = createSpeechRuntime({ errorAfterStart: true });
const postStartResult = await postStartErrorRuntime.speech.speakLabelAndWait("Learn these countries", {
  dedupeKey: "memory-trail-audio-2:1:guided:canada:0:instruction:guided:learn:introducing"
});
assert.equal(postStartResult, true, "Audio that started successfully must claim the narration event.");
assert.equal(postStartErrorRuntime.browserSpeechMetrics.speakCount, 0, "A post-start audio error must not repeat the prompt through browser speech.");

const browserFallbackRuntime = createSpeechRuntime();
const fallbackResult = await browserFallbackRuntime.speech.speakLabelAndWait("Missing generated prompt", {
  dedupeKey: "memory-trail-audio-3:1:guided:canada:0:instruction:guided:learn:introducing"
});
assert.equal(fallbackResult, false, "Missing generated audio should retain the browser-speech fallback result.");
assert.equal(browserFallbackRuntime.audioMetrics.playCount, 0);
assert.equal(browserFallbackRuntime.browserSpeechMetrics.speakCount, 1, "Missing generated audio must use browser speech once.");

assert.ok(mapSource.includes("dedupeKey: `${memoryTrail.audioSessionId || \"memory-trail\"}:${memoryTrail.currentPromptKey || instructionKey}:instruction:${instructionKey}`"));
const sessionStart = mapSource.indexOf("function createMemoryTrailSession(");
const sessionEnd = mapSource.indexOf("function normalizeMemoryTrailSectionQuizView(", sessionStart);
const sessionSource = mapSource.slice(sessionStart, sessionEnd);
const cameraNormalizerSource = mapSource.slice(sessionEnd, mapSource.indexOf("function normalizeDailyTrailTargetQuizCamera(", sessionEnd));
assert.ok(sessionSource.includes("audioSessionId: `memory-trail-audio-${++memoryTrailAudioSessionSequence}`"));
assert.ok(!cameraNormalizerSource.includes("audioSessionId:"));

console.log("Memory Trail prompt audio dedupe check passed.");
