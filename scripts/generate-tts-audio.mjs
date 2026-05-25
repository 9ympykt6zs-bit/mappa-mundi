#!/usr/bin/env node

/**
 * One-time Atlas Quest TTS generator.
 *
 * Usage:
 *   OPENAI_API_KEY=sk-... node scripts/generate-tts-audio.mjs
 *   OPENAI_API_KEY=sk-... node scripts/generate-tts-audio.mjs --force
 *   OPENAI_API_KEY=sk-... node scripts/generate-tts-audio.mjs --only "Chihuahua"
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
  "Match the pattern and say the names.",
  "Choose a label.",
  "Tap the matching place on the map.",
  "Correct.",
  "Try again.",
  "Great job.",
  "Activity complete.",
  "Study the places, then try the challenge."
];

const defaultPronunciationInstruction = "Pronounce each place name as a well-educated American English speaker would in an English-language geography lesson. Use standard English geography pronunciations. Avoid obvious spelling-based mispronunciations. Do not use a strong native-language accent. Say the place name naturally and at normal speed.";

const regionalPronunciationHints = [
  {
    id: "mexico-spanish-america",
    sourcePatterns: [
      /^mexico-/,
      /^central-america\.json$/,
      /^caribbean\.json$/,
      /^south-america-west\.json$/,
      /mexico/i,
      /central america/i,
      /caribbean/i,
      /spanish america/i
    ],
    instructions: "Use standard American English geography pronunciation for Spanish place names. Avoid English spelling guesses; approximate Spanish where educated English speakers normally do. Say names naturally and at normal speed."
  },
  {
    id: "spain",
    sourcePatterns: [/^spain-/, /spain/i],
    instructions: "Use standard English geography pronunciation for Spanish place names, approximating Spanish where educated English speakers normally do."
  },
  {
    id: "brazil-portugal",
    sourcePatterns: [/^brazil-/, /brazil/i, /portugal/i],
    textPatterns: [/^Brazil$/i, /^Portugal$/i],
    instructions: "Use standard English geography pronunciation for Portuguese place names, approximating Portuguese where educated English speakers normally do."
  },
  {
    id: "france",
    sourcePatterns: [/^france-/, /france/i],
    textPatterns: [/^France$/i],
    instructions: "Use standard English geography pronunciation for French place names, approximating French where educated English speakers normally do."
  },
  {
    id: "china",
    sourcePatterns: [/^china-/, /china/i],
    instructions: "Use standard English geography pronunciation of modern Chinese place names based on pinyin, without Mandarin tones and without a strong native Chinese accent."
  },
  {
    id: "russia",
    sourcePatterns: [/^russia-/, /russia/i],
    textPatterns: [/^Russia$/i],
    instructions: "Use standard English-language geography pronunciation of Russian place names, avoiding simple English spelling misreadings but not using a strong Russian accent."
  },
  {
    id: "japan",
    sourcePatterns: [/^japan-/, /japan/i],
    instructions: "Use standard English geography pronunciation of Japanese place names, approximating Japanese syllables without a strong native accent."
  },
  {
    id: "india",
    sourcePatterns: [/^india-/, /india/i],
    textPatterns: [/^India$/i],
    instructions: "Use standard English geography pronunciation of Indian place names, avoiding obvious spelling misreadings but not using a strong native accent."
  },
  {
    id: "germany",
    sourcePatterns: [/^germany-/, /germany/i],
    textPatterns: [/^Germany$/i],
    instructions: "Use standard English geography pronunciation of German place names, approximating German where educated English speakers normally do."
  },
  {
    id: "italy",
    sourcePatterns: [/^italy-/, /italy/i],
    textPatterns: [/^Italy$/i],
    instructions: "Use standard English geography pronunciation of Italian place names, approximating Italian where educated English speakers normally do."
  },
  {
    id: "us",
    sourcePatterns: [/^us-/, /united states/i, /\bu\.?s\.?\b/i],
    instructions: "Use standard American English pronunciation."
  },
  {
    id: "canada",
    sourcePatterns: [/^canada-/, /canada/i],
    textPatterns: [/^Canada$/i],
    instructions: "Use standard North American English pronunciation; use common English/French-informed pronunciation for names such as Qu\u00e9bec."
  }
];

const pronunciationOverrides = {
  "Chihuahua": {
    spokenText: "Chihuahua",
    instructions: "Pronounce this single word as the standard American English geography pronunciation of the Mexican place name Chihuahua: chee-WAH-wah. Say it at a natural conversational pace. Do not pause between syllables. Do not pronounce it as an English spelling guess."
  }
};

const rawArgs = process.argv.slice(2);
const args = new Set(rawArgs);
const force = args.has("--force");
const dryRun = args.has("--dry-run");
const onlyText = getOnlyText(rawArgs);

main().catch((error) => {
  console.error(error?.stack || error);
  process.exitCode = 1;
});

async function main() {
  const chipLabels = await collectChipLabels();
  const chipItems = createAudioItems(chipLabels, chipAudioDir, "assets/audio/chips", {
    usePronunciationHints: true
  });
  const instructionItems = createAudioItems(instructionPhrases, instructionAudioDir, "assets/audio/instructions");
  const allItems = [...chipItems, ...instructionItems];
  const selectedItems = onlyText
    ? allItems.filter((item) => item.text.toLowerCase() === onlyText.toLowerCase())
    : allItems;
  const itemsToCreate = force || onlyText ? selectedItems : selectedItems.filter((item) => !item.exists);

  console.log(`Total unique chip labels: ${chipItems.length}`);
  console.log(`Total instruction phrases: ${instructionItems.length}`);

  if (onlyText && selectedItems.length === 0) {
    throw new Error(`No audio item found for --only "${onlyText}".`);
  }

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

  for (const item of selectedItems) {
    if (!force && !onlyText && item.exists) {
      skipped += 1;
      continue;
    }

    if (dryRun) {
      created += 1;
      continue;
    }

    try {
      await generateSpeechFile(item.spokenText, item.absolutePath, item.instructions);
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
  const labels = new Map();
  const files = (await readdir(dataDir))
    .filter((file) => file.endsWith(".json"))
    .sort((first, second) => first.localeCompare(second));

  for (const file of files) {
    const absolutePath = path.join(dataDir, file);
    const data = await parseJsonFile(absolutePath);
    const targets = getActivityTargets(data);
    const sourceContexts = getActivitySourceContexts(file, data);

    for (const target of targets) {
      for (const label of collectTargetLabels(target)) {
        const entry = labels.get(label) || { text: label, sourceFiles: new Set(), sourceContexts: new Set() };
        entry.sourceFiles.add(file);
        sourceContexts.forEach((sourceContext) => entry.sourceContexts.add(sourceContext));
        labels.set(label, entry);
      }
    }
  }

  return Array.from(labels.values())
    .map((entry) => ({
      text: entry.text,
      sourceFiles: Array.from(entry.sourceFiles).sort((first, second) => first.localeCompare(second)),
      sourceContexts: Array.from(entry.sourceContexts).sort((first, second) => first.localeCompare(second))
    }))
    .sort((first, second) => first.text.localeCompare(second.text));
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

function getActivitySourceContexts(file, data) {
  return [
    file,
    data?.id,
    data?.title,
    data?.name,
    data?.description
  ]
    .map(normalizeSpokenText)
    .filter(Boolean);
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

function getOnlyText(values) {
  const onlyIndex = values.indexOf("--only");

  if (onlyIndex === -1) {
    return "";
  }

  const value = normalizeSpokenText(values[onlyIndex + 1]);
  if (!value || value.startsWith("--")) {
    throw new Error('--only requires an exact audio label, such as --only "Chihuahua".');
  }

  return value;
}

function createAudioItems(texts, absoluteDir, relativeDir, options = {}) {
  const slugOwners = new Map();

  return texts.map((value) => {
    const entry = typeof value === "string" ? { text: value, sourceFiles: [] } : value;
    const text = entry.text;
    const pronunciationOverride = options.usePronunciationHints ? findPronunciationOverride(entry) : null;
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
      spokenText: pronunciationOverride?.spokenText || text,
      relativePath,
      absolutePath,
      instructions: options.usePronunciationHints ? getPronunciationInstructions(entry, pronunciationOverride) : null,
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

function findPronunciationOverride(entry) {
  return pronunciationOverrides[entry.text] || null;
}

function getPronunciationInstructions(entry, override = findPronunciationOverride(entry)) {
  if (override) {
    return `${defaultPronunciationInstruction} ${override.instructions}`;
  }

  const regionalHint = regionalPronunciationHints.find((hint) => matchesPronunciationHint(hint, entry));
  return [defaultPronunciationInstruction, regionalHint?.instructions].filter(Boolean).join(" ");
}

function matchesPronunciationHint(hint, entry) {
  const sourceContexts = Array.isArray(entry.sourceContexts)
    ? entry.sourceContexts
    : Array.isArray(entry.sourceFiles)
      ? entry.sourceFiles
      : [];
  const sourcePatterns = hint.sourcePatterns || hint.filePatterns || [];
  const matchesSource = sourceContexts.some((sourceContext) =>
    sourcePatterns.some((pattern) => pattern.test(sourceContext))
  );
  const matchesText = (hint.textPatterns || []).some((pattern) => pattern.test(entry.text));

  return matchesSource || matchesText;
}

async function generateSpeechFile(text, outputPath, instructions = null) {
  const requestBody = {
    model: MODEL,
    voice: VOICE,
    input: text,
    response_format: RESPONSE_FORMAT
  };

  if (instructions) {
    requestBody.instructions = instructions;
  }

  const response = await fetch(OPENAI_SPEECH_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(requestBody)
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
