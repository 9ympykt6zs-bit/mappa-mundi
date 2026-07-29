#!/usr/bin/env node

import { closeSync, existsSync, openSync, readSync, statSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import {
  getActivityAudioAssets,
  getActivityAudioEntries,
  getActivityAudioFallbacks
} from "../src/atlas/activity-audio-registry.js";
import {
  generateOpenAiSpeechFile,
  TTS_MODEL,
  TTS_RESPONSE_FORMAT,
  TTS_VOICE
} from "./lib/openai-tts.mjs";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "..");
const args = process.argv.slice(2);
const listMode = args.includes("--list") || args.includes("--list-missing");
const fallbackReport = args.includes("--fallback-report");
const force = args.includes("--force");
const activity = readOption("--activity");
const concurrency = Math.max(1, Math.min(6, Number(readOption("--concurrency") || 3)));

main().catch((error) => {
  console.error(error?.message || error);
  process.exitCode = 1;
});

async function main() {
  if (fallbackReport) {
    printFallbackReport();
    return;
  }
  const entries = getActivityAudioEntries().filter(matchesActivity);
  const assetIds = new Set(entries.map((entry) => entry.assetId).filter(Boolean));
  const assets = getActivityAudioAssets()
    .filter((asset) => assetIds.has(asset.assetId))
    .map((asset) => {
      const absolutePath = path.join(repoRoot, ...asset.audioPath.split("/"));
      return { ...asset, absolutePath, valid: isValidMp3(absolutePath) };
    });
  const missing = assets.filter((asset) => !asset.valid);
  const reusedStateNames = countReusedStateNames(entries);

  console.log(`Activity audio (${activity || "all"}): ${assets.length} assets, ${missing.length} missing, ${reusedStateNames} state-name references reused.`);
  if (listMode) {
    missing.forEach((asset) => console.log(`${asset.assetId}\t${asset.audioPath}\t${asset.spokenText}`));
    console.log(JSON.stringify({
      selected: assets.length,
      valid: assets.length - missing.length,
      missing: missing.length,
      reusedStateNames,
      intentionalFallbacks: getActivityAudioFallbacks().filter(matchesActivity).length
    }));
    return;
  }

  const selected = force ? assets : missing;
  if (!selected.length) {
    console.log(JSON.stringify({
      generated: 0,
      skipped: assets.length,
      reused: assets.length,
      missing: 0,
      failed: 0,
      reusedStateNames
    }));
    return;
  }
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is required locally to generate activity audio. The key is never read by browser code or written by this script.");
  }

  console.log(`Generating ${selected.length} recording(s) with ${TTS_MODEL}, voice ${TTS_VOICE}, format ${TTS_RESPONSE_FORMAT}, concurrency ${concurrency}.`);
  const failures = [];
  let generated = 0;
  await runPool(selected, concurrency, async (asset) => {
    try {
      await mkdir(path.dirname(asset.absolutePath), { recursive: true });
      await generateOpenAiSpeechFile({
        text: asset.spokenText,
        outputPath: asset.absolutePath,
        apiKey: process.env.OPENAI_API_KEY
      });
      generated += 1;
      console.log(`Created ${asset.audioPath}`);
    } catch (error) {
      failures.push(`${asset.assetId}: ${error.message}`);
      console.error(`Failed ${asset.audioPath}: ${error.message}`);
    }
  });

  const remainingMissing = assets.filter((asset) => !isValidMp3(asset.absolutePath)).length;
  console.log(JSON.stringify({
    generated,
    skipped: force ? 0 : assets.length - selected.length,
    reused: assets.length - selected.length,
    missing: remainingMissing,
    failed: failures.length,
    reusedStateNames
  }));
  if (failures.length) {
    throw new Error(`${failures.length} activity recording(s) failed.`);
  }
}

function matchesActivity(entry) {
  if (!activity || activity === "all") return true;
  if (activity === "mental-map") return entry.activity === "mental-map";
  if (activity === "map-reconstruction") return entry.activity.startsWith("map-reconstruction");
  return entry.activity === activity;
}

function readOption(name) {
  const index = args.indexOf(name);
  if (index < 0) return null;
  const value = args[index + 1];
  if (!value || value.startsWith("--")) throw new Error(`${name} requires a value.`);
  return value;
}

function countReusedStateNames(entries) {
  return entries.filter((entry) => entry.stateNameReuse).length;
}

function printFallbackReport() {
  const fallbacks = getActivityAudioFallbacks().filter(matchesActivity);
  console.log("activity\tphrase key\trendered text\treason\tintentional\trecommended handling");
  fallbacks.forEach((entry) => {
    console.log([
      entry.activity,
      entry.phraseKey,
      entry.text,
      entry.fallbackReason,
      "yes",
      entry.recommendedHandling
    ].join("\t"));
  });
  console.log(`Intentional browser-speech fallbacks: ${fallbacks.length}.`);
}

async function runPool(items, limit, worker) {
  let index = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (index < items.length) {
      const current = items[index];
      index += 1;
      await worker(current);
    }
  });
  await Promise.all(workers);
}

function isValidMp3(filePath) {
  if (!existsSync(filePath) || statSync(filePath).size < 128) return false;
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
