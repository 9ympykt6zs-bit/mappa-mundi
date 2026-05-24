#!/usr/bin/env node

/**
 * One-time Atlas Quest TTS generator.
 *
 * Usage:
 *   OPENAI_API_KEY=sk-... node scripts/generate-tts-audio.mjs
 *   OPENAI_API_KEY=sk-... node scripts/generate-tts-audio.mjs --force
 *   node scripts/generate-tts-audio.mjs --dry-run
 *
 * This script pre-generates static MP3 files. It is intentionally not wired
 * into the browser app, and it reads the OpenAI API key only from
 * process.env.OPENAI_API_KEY.
 */

import { existsSync } from "node:fs";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const OPENAI_SPEECH_URL = "https://api.openai.com/v1/audio/speech";
const MODEL = "gpt-4o-mini-tts";
const VOICE = "marin";
const RESPONSE_FORMAT = "mp3";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "..");
const dataDir = path.join(repoRoot, "assets", "maps", "data");
const chipAudioDir = path.join(repoRoot, "assets", "audio", "chips");
const instructionAudioDir = path.join(repoRoot, "assets", "audio", "instructions");
const manifestPath = path.join(repoRoot, "assets", "audio", "audio-manifest.json");

const instructionPhrases = [
  "Match the pattern.",
  "Choose a label.",
  "Tap the matching place on the map.",
  "Correct.",
  "Try again.",
  "Great job.",
  "Activity complete.",
  "Study the places, then try the challenge."
];

const args = new Set(process.argv.slice(2));
const force = args.has("--force");
const dryRun = args.has("--dry-run");

main().catch((error) => {
  console.error(error?.stack || error);
  process.exitCode = 1;
});

async function main() {
  const chipLabels = await collectChipLabels();
  const chipItems = createAudioItems(chipLabels, chipAudioDir, "assets/audio/chips");
  const instructionItems = createAudioItems(instructionPhrases, instructionAudioDir, "assets/audio/instructions");
  const allItems = [...chipItems, ...instructionItems];
  const itemsToCreate = force ? allItems : allItems.filter((item) => !item.exists);

  console.log(`Total unique chip labels: ${chipItems.length}`);
  console.log(`Total instruction phrases: ${instructionItems.length}`);

  if (!dryRun && itemsToCreate.length > 0 && !process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is required to generate missing audio files.");
  }

  if (!dryRun) {
    await mkdir(chipAudioDir, { recursive: true });
    await mkdir(instructionAudioDir, { recursive: true });
    await mkdir(path.dirname(manifestPath), { recursive: true });
  }

  const failures = [];
  let created = 0;
  let skipped = 0;

  for (const item of allItems) {
    if (!force && item.exists) {
      skipped += 1;
      continue;
    }

    if (dryRun) {
      created += 1;
      continue;
    }

    try {
      await generateSpeechFile(item.text, item.absolutePath);
      created += 1;
      console.log(`Created ${item.relativePath}`);
    } catch (error) {
      failures.push({ text: item.text, path: item.relativePath, error: error.message });
      console.error(`Failed ${item.relativePath}: ${error.message}`);
    }
  }

  if (!dryRun) {
    await writeManifest({
      chips: mapItemsByText(chipItems),
      instructions: mapItemsByText(instructionItems)
    });
  }

  console.log(`Created files: ${created}${dryRun ? " (dry run; not written)" : ""}`);
  console.log(`Skipped files: ${skipped}`);
  console.log(`Failures: ${failures.length}`);

  if (failures.length > 0) {
    console.log(JSON.stringify(failures, null, 2));
    process.exitCode = 1;
  }
}

async function collectChipLabels() {
  const labels = new Set();
  const files = (await readdir(dataDir))
    .filter((file) => file.endsWith(".json"))
    .sort((first, second) => first.localeCompare(second));

  for (const file of files) {
    const absolutePath = path.join(dataDir, file);
    const data = await parseJsonFile(absolutePath);
    const targets = getActivityTargets(data);

    for (const target of targets) {
      collectTargetLabels(target).forEach((label) => labels.add(label));
    }
  }

  return Array.from(labels).sort((first, second) => first.localeCompare(second));
}

async function parseJsonFile(filePath) {
  const source = await readFile(filePath, "utf8");
  return JSON.parse(source.replace(/^\uFEFF/, ""));
}

function getActivityTargets(data) {
  const targets = [];

  if (Array.isArray(data?.targets)) {
    targets.push(...data.targets);
  }

  if (Array.isArray(data?.features)) {
    targets.push(...data.features);
  }

  if (Array.isArray(data?.answerBankItems)) {
    targets.push(...data.answerBankItems);
  }

  return targets;
}

function collectTargetLabels(target) {
  const labels = [
    target?.name,
    target?.city,
    target?.completedLabelName,
    typeof target?.label === "string" ? target.label : null,
    typeof target?.feature?.name === "string" ? target.feature.name : null
  ];

  return labels
    .map(normalizeSpokenText)
    .filter(Boolean);
}

function normalizeSpokenText(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim();
}

function createAudioItems(texts, absoluteDir, relativeDir) {
  const slugOwners = new Map();

  return texts.map((text) => {
    const baseSlug = sanitizeFilename(text) || "audio";
    const owner = slugOwners.get(baseSlug);
    const slug = owner && owner !== text
      ? `${baseSlug}-${shortHash(text)}`
      : baseSlug;

    slugOwners.set(baseSlug, text);

    const relativePath = `${relativeDir}/${slug}.mp3`;
    const absolutePath = path.join(absoluteDir, `${slug}.mp3`);

    return {
      text,
      relativePath,
      absolutePath,
      get exists() {
        return fileExistsSync(absolutePath);
      }
    };
  });
}

function sanitizeFilename(text) {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function shortHash(text) {
  return createHash("sha1").update(text).digest("hex").slice(0, 8);
}

async function generateSpeechFile(text, outputPath) {
  const response = await fetch(OPENAI_SPEECH_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: MODEL,
      voice: VOICE,
      input: text,
      response_format: RESPONSE_FORMAT
    })
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`OpenAI TTS request failed (${response.status}): ${detail}`);
  }

  const audio = Buffer.from(await response.arrayBuffer());
  await writeFile(outputPath, audio);
}

async function writeManifest({ chips, instructions }) {
  const manifest = {
    model: MODEL,
    voice: VOICE,
    responseFormat: RESPONSE_FORMAT,
    chips,
    instructions
  };

  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
}

function mapItemsByText(items) {
  return Object.fromEntries(items.map((item) => [item.text, item.relativePath]));
}

function fileExistsSync(filePath) {
  return existsSync(filePath);
}
