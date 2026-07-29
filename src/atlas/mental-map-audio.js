import {
  getActivityAudioAssets,
  getActivityAudioEntries,
  getActivityAudioEntry,
  getActivityAudioEntryByText,
  normalizeActivitySpokenText
} from "./activity-audio-registry.js";

export const MENTAL_MAP_AUDIO_ROLES = Object.freeze({
  QUESTION: "question",
  INSTRUCTION: "instruction",
  EXPLANATION: "explanation"
});

function getRoleText(challenge, role) {
  if (role === MENTAL_MAP_AUDIO_ROLES.QUESTION) return challenge?.prompt;
  if (role === MENTAL_MAP_AUDIO_ROLES.INSTRUCTION) return challenge?.secondaryInstruction;
  if (role === MENTAL_MAP_AUDIO_ROLES.EXPLANATION) return challenge?.explanation;
  return null;
}

export function getMentalMapAudioAssets() {
  return getActivityAudioAssets()
    .filter((asset) => asset.audioPath.startsWith("assets/audio/mental-map/"))
    .map((asset) => Object.freeze({ ...asset, text: asset.spokenText }));
}

export function getMentalMapAudioEntries() {
  return getActivityAudioEntries()
    .filter((entry) => entry.activity === "mental-map"
      && entry.audioPath
      && Object.values(MENTAL_MAP_AUDIO_ROLES).includes(entry.role))
    .map((entry) => Object.freeze({
      ...entry,
      challengeId: entry.phraseKey.split(":")[0]
    }));
}

export function getMentalMapAudioEntry(challenge, role) {
  const challengeId = typeof challenge === "string" ? challenge : challenge?.id;
  const fixedEntry = getActivityAudioEntry("mental-map", `${challengeId}:${role}`);
  const sharedEntry = fixedEntry || getActivityAudioEntryByText(getRoleText(challenge, role));
  return sharedEntry ? Object.freeze({ ...sharedEntry, challengeId, role }) : null;
}

export function getMentalMapAudioText(challenge, role) {
  return normalizeActivitySpokenText(getRoleText(challenge, role));
}
