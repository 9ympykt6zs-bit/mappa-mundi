#!/usr/bin/env node

import assert from "node:assert/strict";
import { closeSync, existsSync, openSync, readFileSync, readSync, statSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import {
  ACTIVITY_AUDIO_VARIANTS,
  getActivityAudioAssets,
  getActivityAudioEntries,
  getActivityAudioFallbacks,
  getActivityAudioLookupKey
} from "../src/atlas/activity-audio-registry.js";
import { listMapReconstructionCapstones } from "../src/atlas/map-reconstruction-capstones.js";
import { listMapReconstructionRegions } from "../src/atlas/map-reconstruction-regions.js";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "..");
const args = process.argv.slice(2);
const activity = readOption("--activity");
const allowMissing = args.includes("--allow-missing");
const allEntries = getActivityAudioEntries();
const entries = allEntries.filter(matchesActivity);
const assetIds = new Set(entries.map((entry) => entry.assetId).filter(Boolean));
const assets = getActivityAudioAssets().filter((asset) => assetIds.has(asset.assetId));
const fallbacks = getActivityAudioFallbacks().filter(matchesActivity);

assert.ok(entries.length, "The activity audio registry must not be empty.");
assert.equal(
  new Set(entries.map((entry) => `${entry.activity}:${entry.phraseKey}`)).size,
  entries.length,
  "Activity phrase keys must be unique."
);
assert.equal(
  new Set(assets.map((asset) => asset.normalizedKey)).size,
  assets.length,
  "Audio assets must not contain duplicate normalized keys."
);
assets.forEach((asset) => {
  assert.equal(asset.normalizedKey, getActivityAudioLookupKey(asset.spokenText));
  assert.match(asset.audioPath, /^assets\/audio\/(?:mental-map|map-reconstruction|chips)\//);
});
fallbacks.forEach((entry) => {
  assert.equal(entry.variantType, ACTIVITY_AUDIO_VARIANTS.DYNAMIC_FALLBACK);
  assert.ok(entry.fallbackReason, `${entry.phraseKey} needs a fallback reason.`);
  assert.ok(entry.recommendedHandling, `${entry.phraseKey} needs recommended handling.`);
  assert.equal(entry.audioPath, null);
});

const missing = [];
const empty = [];
const invalid = [];
assets.forEach((asset) => {
  const absolutePath = path.join(repoRoot, ...asset.audioPath.split("/"));
  if (!existsSync(absolutePath)) {
    missing.push(asset);
    return;
  }
  if (statSync(absolutePath).size < 128) {
    empty.push(asset);
    return;
  }
  if (!isValidMp3(absolutePath)) invalid.push(asset);
});

validateCoverage();
validatePlaybackWiring();
validateBrowserSecurity();
validateStaticDelivery();

if (!allowMissing) {
  assert.equal(missing.length, 0, `${missing.length} registered audio files are missing.`);
  assert.equal(empty.length, 0, `${empty.length} registered audio files are empty.`);
  assert.equal(invalid.length, 0, `${invalid.length} registered audio files are not valid MP3 files.`);
}

const countsByActivity = {};
entries.forEach((entry) => {
  const group = entry.activity === "mental-map" ? "mental-map" : "map-reconstruction";
  countsByActivity[group] = (countsByActivity[group] || 0) + 1;
});
console.log("Activity audio validation passed:", JSON.stringify({
  scope: activity || "all",
  entries: entries.length,
  assets: assets.length,
  existing: assets.length - missing.length - empty.length - invalid.length,
  missing: missing.length,
  empty: empty.length,
  invalid: invalid.length,
  intentionalFallbacks: fallbacks.length,
  countsByActivity
}));

function validateCoverage() {
  const textKeys = new Set(entries
    .filter((entry) => entry.variantType !== ACTIVITY_AUDIO_VARIANTS.DYNAMIC_FALLBACK)
    .flatMap((entry) => [entry.normalizedKey, entry.displayKey]));
  listMapReconstructionRegions().forEach((region) => {
    [region.title, region.prompt, region.successMessage, region.correctPlacementMessage]
      .forEach((text) => assert.ok(textKeys.has(getActivityAudioLookupKey(text)), `Missing registry phrase: ${text}`));
    region.feedbackRules.forEach((rule) => {
      assert.ok(textKeys.has(getActivityAudioLookupKey(rule.message)), `Missing feedback phrase: ${rule.message}`);
    });
  });
  listMapReconstructionCapstones().forEach((capstone) => {
    [capstone.title, capstone.prompt, capstone.successMessage].forEach((text) => {
      assert.ok(textKeys.has(getActivityAudioLookupKey(text)), `Missing capstone phrase: ${text}`);
    });
    capstone.stateIds.forEach((stateId) => {
      assert.ok(entries.some((entry) => entry.phraseKey === `state:${stateId}:name`
        && entry.variantType === ACTIVITY_AUDIO_VARIANTS.STATE_NAME_ASSET));
    });
  });
  for (let count = 0; count <= 48; count += 1) {
    assert.ok(entries.some((entry) => entry.phraseKey === `count:selected:${count}`));
    assert.ok(entries.some((entry) => entry.phraseKey === `count:connected:${count}`));
    assert.ok(entries.some((entry) => entry.phraseKey === `count:unplaced:${count}`));
  }
}

function validatePlaybackWiring() {
  const regionalUi = read("src/atlas/map-reconstruction-ui.js");
  const capstoneUi = read("src/atlas/map-reconstruction-capstone-ui.js");
  const mentalMapUi = read("src/atlas/mental-map-challenge-ui.js");
  const player = read("src/chip-speech.js");
  [regionalUi, capstoneUi, mentalMapUi].forEach((source) => {
    assert.ok(source.includes("getActivityAudioEntryByText"));
    assert.ok(source.includes("audioPath:"));
  });
  [regionalUi, capstoneUi].forEach((source) => {
    assert.ok(source.includes("createChipSpeakerControl"));
    assert.doesNotMatch(
      source,
      /speakAudioPathAndWait|speechSynthesis|announce\(|aria-live|map-reconstruction-live-region/
    );
  });
  assert.ok(regionalUi.includes("stopAudio"));
  assert.ok(capstoneUi.includes("stopAudio"));
  assert.match(player, /stopCurrentAudio\(\);\r?\n\s+stopBrowserSpeech\(\);/);
  assert.ok(player.includes("function stopBrowserSpeech()"));
  assert.ok(player.includes("global.speechSynthesis.cancel();"));
  assert.ok(player.includes("stopChipInteraction(event)"));
}

function validateBrowserSecurity() {
  const browserSources = [
    "src/chip-speech.js",
    "src/maplibre-poc.js",
    "src/atlas/mental-map-challenge-ui.js",
    "src/atlas/map-reconstruction-ui.js",
    "src/atlas/map-reconstruction-capstone-ui.js"
  ].map(read).join("\n");
  assert.ok(!browserSources.includes("OPENAI_API_KEY"));
  assert.ok(!browserSources.includes("/v1/audio/speech"));
  assert.ok(!browserSources.includes("api.openai.com"));
}

function validateStaticDelivery() {
  assert.ok(existsSync(path.join(repoRoot, "assets", "audio")));
  const serviceWorkers = ["service-worker.js", "sw.js"].filter((file) => existsSync(path.join(repoRoot, file)));
  assert.equal(serviceWorkers.length, 0, "Unexpected service worker needs an explicit audio caching audit.");
  const indexSource = read("index.html");
  assert.ok(indexSource.includes("20260728-activity-audio-1"));
  assert.ok(read("src/chip-speech.js").includes("20260728-activity-audio-1"));
}

function read(relativePath) {
  return readFileSync(path.join(repoRoot, ...relativePath.split("/")), "utf8");
}

function readOption(name) {
  const index = args.indexOf(name);
  if (index < 0) return null;
  const value = args[index + 1];
  if (!value || value.startsWith("--")) throw new Error(`${name} requires a value.`);
  return value;
}

function matchesActivity(entry) {
  if (!activity || activity === "all") return true;
  if (activity === "mental-map") return entry.activity === "mental-map";
  if (activity === "map-reconstruction") return entry.activity.startsWith("map-reconstruction");
  return entry.activity === activity;
}

function isValidMp3(filePath) {
  const descriptor = openSync(filePath, "r");
  try {
    const header = Buffer.alloc(3);
    readSync(descriptor, header, 0, header.length, 0);
    return header.toString("ascii") === "ID3"
      || (header[0] === 0xff && (header[1] & 0xe0) === 0xe0);
  } finally {
    closeSync(descriptor);
  }
}
