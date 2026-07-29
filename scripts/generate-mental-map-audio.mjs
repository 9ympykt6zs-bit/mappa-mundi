#!/usr/bin/env node

import { closeSync, existsSync, openSync, readSync, statSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { getMentalMapAudioAssets, getMentalMapAudioEntries } from "../src/atlas/mental-map-audio.js";
import { generateOpenAiSpeechFile, TTS_MODEL, TTS_RESPONSE_FORMAT, TTS_VOICE } from "./lib/openai-tts.mjs";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "..");
const args = process.argv.slice(2);
const listMissing = args.includes("--list-missing");
const force = args.includes("--force");
const challengeId = readOption("--challenge");
const concurrency = Math.max(1, Math.min(6, Number(readOption("--concurrency") || 3)));
const allAssets = getMentalMapAudioAssets();
const challengeAssetIds = new Set(
  getMentalMapAudioEntries()
    .filter((entry) => entry.challengeId === challengeId)
    .map((entry) => entry.assetId)
);
const selectedAssets = challengeId ? allAssets.filter((asset) => challengeAssetIds.has(asset.assetId)) : allAssets;

main().catch((error) => {
  console.error(error?.message || error);
  process.exitCode = 1;
});

async function main() {
  if (challengeId && selectedAssets.length === 0) {
    throw new Error(`Unknown fixed Mental Map challenge ID: ${challengeId}`);
  }

  const items = selectedAssets.map((asset) => ({
    ...asset,
    absolutePath: path.join(repoRoot, ...asset.audioPath.split("/")),
    exists: isValidMp3(path.join(repoRoot, ...asset.audioPath.split("/")))
  }));
  const missing = items.filter((item) => !item.exists);

  console.log(`Mental Map audio: ${items.length} selected, ${missing.length} missing.`);
  if (listMissing) {
    missing.forEach((item) => console.log(`${item.assetId}\t${item.audioPath}`));
    return;
  }

  const toGenerate = force ? items : missing;
  if (!toGenerate.length) {
    console.log("All selected Mental Map recordings already exist.");
    return;
  }
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is required locally to generate Mental Map audio. No key is read or used by browser code.");
  }

  console.log(`Generating ${toGenerate.length} recording(s) with ${TTS_MODEL}, voice ${TTS_VOICE}, format ${TTS_RESPONSE_FORMAT}, concurrency ${concurrency}.`);
  const failures = [];
  let generated = 0;
  await runPool(toGenerate, concurrency, async (item) => {
    try {
      await mkdir(path.dirname(item.absolutePath), { recursive: true });
      await generateOpenAiSpeechFile({
        text: item.text,
        outputPath: item.absolutePath,
        apiKey: process.env.OPENAI_API_KEY
      });
      generated += 1;
      console.log(`Created ${item.audioPath}`);
    } catch (error) {
      failures.push(`${item.assetId}: ${error.message}`);
      console.error(`Failed ${item.audioPath}: ${error.message}`);
    }
  });

  console.log(JSON.stringify({
    generated,
    skipped: force ? 0 : items.length - toGenerate.length,
    reused: items.length - toGenerate.length,
    missing: items.filter((item) => !isValidMp3(item.absolutePath)).length,
    failed: failures.length
  }));

  if (failures.length) {
    throw new Error(`${failures.length} Mental Map recording(s) failed.\n${failures.join("\n")}`);
  }
}

function readOption(name) {
  const index = args.indexOf(name);
  if (index < 0) return null;
  const value = args[index + 1];
  if (!value || value.startsWith("--")) throw new Error(`${name} requires a challenge ID.`);
  return value;
}

function isValidMp3(filePath) {
  if (!existsSync(filePath) || statSync(filePath).size < 128) return false;
  const descriptor = openSync(filePath, "r");
  try {
    const header = Buffer.alloc(3);
    readSync(descriptor, header, 0, header.length, 0);
    return header.toString("ascii") === "ID3" || (header[0] === 0xff && (header[1] & 0xe0) === 0xe0);
  } finally {
    closeSync(descriptor);
  }
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
