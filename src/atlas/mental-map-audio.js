import { getMentalMapChallenges } from "./mental-map-challenges.js";

export const MENTAL_MAP_AUDIO_ROLES = Object.freeze({
  QUESTION: "question",
  INSTRUCTION: "instruction",
  EXPLANATION: "explanation"
});

const audioDirectory = "assets/audio/mental-map";
const fixedChallenges = getMentalMapChallenges({ includeGenerated: false });

function normalizeSpokenText(value) {
  return String(value || "")
    .normalize("NFC")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/\s+/g, " ")
    .replace(/\s+([,.!?;:])/g, "$1")
    .trim();
}

function getRoleText(challenge, role) {
  if (role === MENTAL_MAP_AUDIO_ROLES.QUESTION) return challenge?.prompt;
  if (role === MENTAL_MAP_AUDIO_ROLES.INSTRUCTION) return challenge?.secondaryInstruction;
  if (role === MENTAL_MAP_AUDIO_ROLES.EXPLANATION) return challenge?.explanation;
  return null;
}

function createRegistry() {
  const assetsByText = new Map();
  const entriesByKey = new Map();

  fixedChallenges.forEach((challenge) => {
    Object.values(MENTAL_MAP_AUDIO_ROLES).forEach((role) => {
      const text = normalizeSpokenText(getRoleText(challenge, role));
      if (!text) return;

      let asset = assetsByText.get(text);
      if (!asset) {
        asset = Object.freeze({
          assetId: `mental-map-${role}-${challenge.id}`,
          audioPath: `${audioDirectory}/mental-map-${role}-${challenge.id}.mp3`,
          text
        });
        assetsByText.set(text, asset);
      }

      entriesByKey.set(`${challenge.id}:${role}`, Object.freeze({
        ...asset,
        challengeId: challenge.id,
        role
      }));
    });
  });

  return {
    assets: Object.freeze([...assetsByText.values()]),
    entries: Object.freeze([...entriesByKey.values()]),
    entriesByKey,
    entriesByText: assetsByText
  };
}

const registry = createRegistry();

export function getMentalMapAudioAssets() {
  return registry.assets;
}

export function getMentalMapAudioEntries() {
  return registry.entries;
}

export function getMentalMapAudioEntry(challenge, role) {
  const challengeId = typeof challenge === "string" ? challenge : challenge?.id;
  const fixedEntry = registry.entriesByKey.get(`${challengeId}:${role}`);
  if (fixedEntry) return fixedEntry;

  const text = normalizeSpokenText(getRoleText(challenge, role));
  const sharedAsset = registry.entriesByText.get(text);
  if (!sharedAsset || !challengeId) return null;

  return Object.freeze({
    ...sharedAsset,
    challengeId,
    role
  });
}

export function getMentalMapAudioText(challenge, role) {
  return normalizeSpokenText(getRoleText(challenge, role));
}
