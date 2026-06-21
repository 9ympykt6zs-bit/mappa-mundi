import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const generatorPath = new URL("./generate-tts-audio.mjs", import.meta.url);
const generatorFilePath = fileURLToPath(generatorPath);
const generatorSource = fs.readFileSync(generatorFilePath, "utf8");
const chipSpeechSource = fs.readFileSync(new URL("../src/chip-speech.js", import.meta.url), "utf8");
const manifest = JSON.parse(fs.readFileSync(new URL("../assets/audio/audio-manifest.json", import.meta.url), "utf8"));

const dryRun = spawnSync(process.execPath, [generatorFilePath, "--dry-run", "--only", "Washington D.C."], {
  encoding: "utf8"
});

assert.equal(dryRun.status, 0, dryRun.stderr || dryRun.stdout);
assert.match(dryRun.stdout, /Would create assets\/audio\/chips\/washington-d-c\.mp3/);
assert.doesNotMatch(dryRun.stderr, /No audio item found/);
assert.equal(manifest.chips.Washington, "assets/audio/chips/washington.mp3");

[
  '"washington-dc": "Washington D.C."',
  '"washington-d-c": "Washington D.C."',
  '"district-of-columbia": "Washington D.C."'
].forEach((requiredEntry) => {
  assert.ok(generatorSource.includes(requiredEntry), `Missing generator entry: ${requiredEntry}`);
  assert.ok(chipSpeechSource.includes(requiredEntry), `Missing runtime audio alias: ${requiredEntry}`);
});

console.log("Washington D.C. TTS registry check passed.");
