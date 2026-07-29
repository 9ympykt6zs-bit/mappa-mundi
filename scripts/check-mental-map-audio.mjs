import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import {
  getMentalMapAudioAssets,
  getMentalMapAudioEntries,
  getMentalMapAudioEntry,
  MENTAL_MAP_AUDIO_ROLES
} from "../src/atlas/mental-map-audio.js";
import {
  createGeneratedShortestRouteChallenge,
} from "../src/atlas/mental-map-challenges.js";
import { getUnifiedMentalMapChallenges } from "../src/atlas/mental-map-challenge-registry.js";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const fixedChallenges = getUnifiedMentalMapChallenges({ includeGenerated: false });
const entries = getMentalMapAudioEntries();
const assets = getMentalMapAudioAssets();

assert.equal(fixedChallenges.length, 20);
fixedChallenges.forEach((challenge) => {
  assert.ok(getMentalMapAudioEntry(challenge, MENTAL_MAP_AUDIO_ROLES.QUESTION), `${challenge.id} needs question audio.`);
  assert.ok(getMentalMapAudioEntry(challenge, MENTAL_MAP_AUDIO_ROLES.EXPLANATION), `${challenge.id} needs explanation audio.`);
  if (challenge.secondaryInstruction) {
    assert.ok(getMentalMapAudioEntry(challenge, MENTAL_MAP_AUDIO_ROLES.INSTRUCTION), `${challenge.id} needs instruction audio.`);
  }
});
assert.equal(entries.length, fixedChallenges.reduce((count, challenge) => (
  count + 2 + (challenge.secondaryInstruction ? 1 : 0)
), 0), "Every unified fixed challenge role should have a registry entry.");
assert.equal(new Set(assets.map((asset) => asset.text)).size, assets.length, "Identical spoken text must map to one asset.");
assert.equal(new Set(assets.map((asset) => asset.audioPath)).size, assets.length, "Generated asset paths must be unique.");
assets.forEach((asset) => {
  assert.match(asset.assetId, /^mental-map-(question|instruction|explanation|feedback)-[a-z0-9-]+$/);
  assert.match(asset.audioPath, /^assets\/audio\/mental-map\/mental-map-(question|instruction|explanation|feedback)-[a-z0-9-]+\.mp3$/);
});

const generated = createGeneratedShortestRouteChallenge({ random: () => 0 });
assert.ok(generated?.generated);
assert.equal(getMentalMapAudioEntry(generated, MENTAL_MAP_AUDIO_ROLES.QUESTION), null, "Dynamic questions should use browser speech.");
assert.equal(getMentalMapAudioEntry(generated, MENTAL_MAP_AUDIO_ROLES.EXPLANATION), null, "Dynamic explanations should use browser speech.");
assert.ok(getMentalMapAudioEntry(generated, MENTAL_MAP_AUDIO_ROLES.INSTRUCTION), "Shared fixed instruction audio should be reused.");

const missingFiles = assets.filter((asset) => !isValidMp3(path.join(repoRoot, ...asset.audioPath.split("/"))));
if (process.argv.includes("--require-files")) {
  assert.deepEqual(missingFiles, [], "Generate and commit every registered Mental Map MP3.");
}

const speechSource = fs.readFileSync(path.join(repoRoot, "src", "chip-speech.js"), "utf8");
const uiSource = fs.readFileSync(path.join(repoRoot, "src", "atlas", "mental-map-challenge-ui.js"), "utf8");
const frontendSources = [
  path.join(repoRoot, "index.html"),
  path.join(repoRoot, "maplibre-poc.html"),
  ...listJavaScriptFiles(path.join(repoRoot, "src"))
];
frontendSources.forEach((filePath) => {
  assert.ok(!fs.readFileSync(filePath, "utf8").includes("OPENAI_API_KEY"), `Frontend must not reference an API key: ${filePath}`);
});
assert.ok(uiSource.includes("getMentalMapAudioEntry(challenge, role)"));
assert.ok(uiSource.includes('audioPath: audioEntry?.audioPath || null'));
assert.ok(uiSource.includes('"mental-map-explanation-speaker"'));
assert.ok(uiSource.includes('"mental-map-instruction-speaker"'));
assert.ok(speechSource.includes("speakAudioPathAndWait"));
assert.ok(speechSource.includes("options.onFallbackStart?.()"));
assert.ok(speechSource.includes("event.stopPropagation()"), "Speaker gestures must not select an answer.");

const playback = createSpeechRuntime();
assert.equal(await playback.speech.speakAudioPathAndWait("Fixed question", "assets/audio/mental-map/missing.mp3"), true);
assert.equal(playback.audio.plays, 1);
assert.equal(playback.browser.speaks, 1, "A missing MP3 must fall back to browser speech.");
assert.equal(await playback.speech.speakAudioPathAndWait("Fixed explanation", "assets/audio/mental-map/missing-explanation.mp3"), true);
assert.equal(playback.browser.speaks, 2, "A missing explanation MP3 must fall back safely.");
playback.speech.setAudioMuted(true);
assert.equal(await playback.speech.speakAudioPathAndWait("Muted question", null), false);
assert.equal(playback.browser.speaks, 2, "Global Audio off must prevent fallback speech.");

const generatedPlayback = createSpeechRuntime({ generatedAudioAvailable: true });
assert.equal(await generatedPlayback.speech.speakAudioPathAndWait("Fixed question", "assets/audio/mental-map/question.mp3"), true);
assert.equal(generatedPlayback.audio.plays, 1);
assert.equal(generatedPlayback.browser.speaks, 0, "A generated MP3 must be preferred over browser speech.");

const stateManifest = JSON.parse(fs.readFileSync(path.join(repoRoot, "assets", "audio", "audio-manifest.json"), "utf8"));
assert.equal(stateManifest.chips.California, "assets/audio/chips/california.mp3");
assert.ok(fs.existsSync(path.join(repoRoot, stateManifest.chips.California)));

console.log("Mental Map audio validation passed:", JSON.stringify({
  fixedQuestions: fixedChallenges.length,
  explanations: fixedChallenges.length,
  instructions: entries.filter((entry) => entry.role === MENTAL_MAP_AUDIO_ROLES.INSTRUCTION).length,
  uniqueAssets: assets.length,
  missingFiles: missingFiles.length
}));

function listJavaScriptFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const filePath = path.join(directory, entry.name);
    if (entry.isDirectory()) return listJavaScriptFiles(filePath);
    return entry.isFile() && /\.(?:js|mjs)$/.test(entry.name) ? [filePath] : [];
  });
}

function isValidMp3(filePath) {
  if (!fs.existsSync(filePath) || fs.statSync(filePath).size < 128) return false;
  const header = Buffer.alloc(3);
  const descriptor = fs.openSync(filePath, "r");
  try {
    fs.readSync(descriptor, header, 0, header.length, 0);
    return header.toString("ascii") === "ID3" || (header[0] === 0xff && (header[1] & 0xe0) === 0xe0);
  } finally {
    fs.closeSync(descriptor);
  }
}

function createSpeechRuntime({ generatedAudioAvailable = false } = {}) {
  const audio = { plays: 0 };
  const browser = { speaks: 0 };
  class MissingAudio {
    constructor() { this.listeners = new Map(); }
    addEventListener(type, listener) { this.listeners.set(type, listener); }
    removeEventListener() {}
    play() {
      audio.plays += 1;
      if (generatedAudioAvailable) {
        queueMicrotask(() => {
          this.listeners.get("playing")?.();
          this.listeners.get("ended")?.();
        });
        return Promise.resolve();
      }
      queueMicrotask(() => this.listeners.get("error")?.());
      return Promise.reject(new Error("missing"));
    }
    pause() {}
    removeAttribute() {}
    load() {}
  }
  class Utterance { constructor(text) { this.text = text; } }
  const runtime = {
    Audio: MissingAudio,
    SpeechSynthesisUtterance: Utterance,
    speechSynthesis: {
      cancel() {},
      speak(utterance) {
        browser.speaks += 1;
        queueMicrotask(() => utterance.onend?.());
      }
    },
    fetch: async () => ({ ok: true, json: async () => ({ chips: {}, instructions: {} }) }),
    localStorage: { getItem: () => null, setItem: () => {} },
    setTimeout,
    clearTimeout,
    queueMicrotask,
    console,
    window: null
  };
  runtime.window = runtime;
  vm.runInNewContext(speechSource, runtime, { filename: "chip-speech.js" });
  return { speech: runtime.GeographyChipSpeech, audio, browser };
}
