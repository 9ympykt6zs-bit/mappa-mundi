import { getUnifiedMentalMapChallenges } from "./mental-map-challenge-registry.js";
import { listMapReconstructionCapstones } from "./map-reconstruction-capstones.js";
import { listMapReconstructionRegions } from "./map-reconstruction-regions.js";
import { getStateById } from "./united-states-atlas-queries.js";

export const ACTIVITY_AUDIO_VARIANTS = Object.freeze({
  FIXED: "fixed",
  BOUNDED: "bounded",
  DYNAMIC_FALLBACK: "dynamic-fallback",
  STATE_NAME_ASSET: "state-name-asset"
});

const mentalMapDirectory = "assets/audio/mental-map";
const reconstructionDirectory = "assets/audio/map-reconstruction";
const entries = [];
const assetsByNormalizedKey = new Map();

export function normalizeActivitySpokenText(value) {
  return String(value || "")
    .normalize("NFC")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/\s+/g, " ")
    .replace(/\s+([,.!?;:])/g, "$1")
    .trim();
}

export function getActivityAudioLookupKey(value) {
  return normalizeActivitySpokenText(value)
    .toLocaleLowerCase("en-US")
    .replace(/[.!?]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function slugify(value) {
  return normalizeActivitySpokenText(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72) || "phrase";
}

function shortHash(value) {
  let hash = 2166136261;
  for (const character of value) {
    hash ^= character.codePointAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

function register({
  activity,
  phraseKey,
  text,
  spokenText = text,
  role,
  variantType = ACTIVITY_AUDIO_VARIANTS.FIXED,
  assetId = null,
  audioPath = null,
  fallbackReason = "",
  recommendedHandling = "",
  completeSentence = true,
  stateNameReuse = false
}) {
  const renderedText = normalizeActivitySpokenText(text);
  const renderedSpokenText = normalizeActivitySpokenText(spokenText);
  if (!renderedText || !renderedSpokenText) return null;
  const displayKey = getActivityAudioLookupKey(renderedText);
  const normalizedKey = getActivityAudioLookupKey(renderedSpokenText);
  const isFallback = variantType === ACTIVITY_AUDIO_VARIANTS.DYNAMIC_FALLBACK;
  let asset = isFallback ? null : assetsByNormalizedKey.get(normalizedKey);
  if (!asset && !isFallback) {
    const defaultPath = activity === "mental-map"
      ? `${mentalMapDirectory}/mental-map-${role}-${slugify(renderedSpokenText)}-${shortHash(normalizedKey)}.mp3`
      : `${reconstructionDirectory}/${role}/${slugify(renderedSpokenText)}-${shortHash(normalizedKey)}.mp3`;
    const defaultAssetId = activity === "mental-map"
      ? `mental-map-${role}-${slugify(renderedSpokenText)}-${shortHash(normalizedKey)}`
      : `${activity}-${phraseKey}`;
    asset = Object.freeze({
      assetId: assetId || defaultAssetId,
      audioPath: audioPath || defaultPath,
      normalizedKey,
      spokenText: renderedSpokenText
    });
    assetsByNormalizedKey.set(normalizedKey, asset);
  }
  const entry = Object.freeze({
    activity,
    phraseKey,
    role,
    text: renderedText,
    spokenText: renderedSpokenText,
    displayKey,
    normalizedKey,
    variantType,
    audioPath: asset?.audioPath || null,
    assetId: asset?.assetId || null,
    completeSentence,
    stateNameReuse,
    fallbackReason,
    recommendedHandling
  });
  entries.push(entry);
  return entry;
}

function registerMentalMap() {
  const challenges = getUnifiedMentalMapChallenges({ includeGenerated: false });
  challenges.forEach((challenge) => {
    [
      ["question", challenge.prompt],
      ["instruction", challenge.secondaryInstruction],
      ["explanation", challenge.explanation]
    ].forEach(([role, text]) => {
      if (!text) return;
      register({
        activity: "mental-map",
        phraseKey: `${challenge.id}:${role}`,
        role,
        text,
        assetId: `mental-map-${role}-${challenge.id}`,
        audioPath: `${mentalMapDirectory}/mental-map-${role}-${challenge.id}.mp3`
      });
    });
  });

  [
    ["correct", "Correct"],
    ["not-quite", "Not quite"],
    ["shortest-route", "Correct - you found a shortest route."],
    ["valid-longer-route", "Correct - your route works. A shorter route is possible."],
    ["route-disconnected", "Not quite - the route does not connect the start and destination."],
    ["route-endpoints", "The route must begin and end at the named states."],
    ["alternative-route", "Your answer matches a configured legitimate alternative route."]
  ].forEach(([phraseKey, text]) => register({
    activity: "mental-map",
    phraseKey: `feedback:${phraseKey}`,
    role: "feedback",
    text
  }));

  const selectCountChallenges = challenges.filter((challenge) => challenge.answerMode === "select-count");
  selectCountChallenges.forEach((challenge) => {
    const maximum = challenge.correctStateIds.length;
    for (let score = 0; score <= maximum; score += 1) {
      [
        `${score} correct - all possible answers named`,
        `${score} correct - requirement met`,
        `${score} correct - includes an invalid answer`,
        `${score} correct - name at least ${challenge.requiredSelectionCount}`,
        `Minimum met: ${score} correct; ${challenge.requiredSelectionCount} required.`,
        `Minimum not met: ${score} correct; name at least ${challenge.requiredSelectionCount}.`
      ].forEach((text, index) => register({
        activity: "mental-map",
        phraseKey: `feedback:${challenge.id}:${score}:${index}`,
        role: "feedback",
        text,
        variantType: ACTIVITY_AUDIO_VARIANTS.BOUNDED
      }));
    }
  });

  const scoreMaximums = [...new Set(challenges
    .filter((challenge) => ["recall-all", "select-all"].includes(challenge.answerMode))
    .map((challenge) => challenge.correctStateIds.length))];
  scoreMaximums.forEach((maximum) => {
    for (let score = 0; score <= maximum; score += 1) {
      const ratio = maximum ? score / maximum : 0;
      const encouragement = score === maximum
        ? "Excellent"
        : ratio >= 2 / 3 ? "Good work" : ratio >= 0.34 ? "Keep going" : "Good start";
      register({
        activity: "mental-map",
        phraseKey: `feedback:score:${score}:of:${maximum}`,
        role: "feedback",
        text: `${score} of ${maximum} correct - ${encouragement}`,
        variantType: ACTIVITY_AUDIO_VARIANTS.BOUNDED
      });
    }
  });

  [
    {
      phraseKey: "generated-route:question",
      role: "question",
      text: "Generated neighboring-state route question",
      fallbackReason: "The start and destination pair changes at runtime.",
      recommendedHandling: "Use browser speech for the complete generated sentence."
    },
    {
      phraseKey: "generated-route:explanation",
      role: "explanation",
      text: "Generated neighboring-state route explanation",
      fallbackReason: "The destination state changes at runtime.",
      recommendedHandling: "Use browser speech for the complete generated sentence."
    },
    {
      phraseKey: "result:answer-sequence",
      role: "feedback",
      text: "Mental Map selected-answer and route sequence",
      fallbackReason: "The learner-created state sequence is unbounded.",
      recommendedHandling: "Use browser speech for the complete result line."
    },
    {
      phraseKey: "result:route-metrics",
      role: "feedback",
      text: "Mental Map route crossing comparison",
      fallbackReason: "The route and shortest-path counts vary with a learner-created route.",
      recommendedHandling: "Use browser speech for the complete route note."
    }
  ].forEach((fallback) => register({
    activity: "mental-map",
    variantType: ACTIVITY_AUDIO_VARIANTS.DYNAMIC_FALLBACK,
    ...fallback
  }));
}

function registerReconstructionFixedPhrases(regions, capstones) {
  regions.forEach((region) => {
    [
      ["title", region.title],
      ["instruction", region.prompt],
      ["success", region.successMessage],
      ["correction", region.correctPlacementMessage]
    ].forEach(([role, text]) => register({
      activity: `map-reconstruction:${region.id}`,
      phraseKey: `${region.id}:${role}`,
      role,
      text
    }));
    region.feedbackRules.forEach((rule, index) => register({
      activity: `map-reconstruction:${region.id}`,
      phraseKey: `${region.id}:feedback:${index + 1}`,
      role: "feedback",
      text: rule.message
    }));
    register({
      activity: `map-reconstruction:${region.id}`,
      phraseKey: `${region.id}:success-announcement`,
      role: "success",
      text: `${region.successMessage} The completed map is now shown.`
    });
    register({
      activity: `map-reconstruction:${region.id}`,
      phraseKey: `${region.id}:correct-count`,
      role: "count",
      text: `${region.stateIds.length} states shown in their correct positions.`
    });
  });

  capstones.forEach((capstone) => {
    [
      ["title", capstone.title],
      ["instruction", capstone.prompt],
      ["success", capstone.successMessage]
    ].forEach(([role, text]) => register({
      activity: `map-reconstruction:${capstone.id}`,
      phraseKey: `${capstone.id}:${role}`,
      role,
      text,
      spokenText: text.replace(/\b48\b/g, "forty-eight")
    }));
  });

  [
    ["region-rebuilt", "Region rebuilt"],
    ["correct-placement", "Correct placement"],
    ["your-placement", "Your placement"],
    ["your-reconstruction", "Your reconstruction"],
    ["structure-correct", "The regional structure is correct."],
    ["show-correct", "Show correct placement"],
    ["back-to-map", "Back to my map"],
    ["replay-correction", "Replay correction"],
    ["try-again", "Try again"],
    ["selection-cleared", "Selection cleared."],
    ["selection-on", "Select multiple mode on. Select states, then choose Done selecting."],
    ["selection-off", "Select multiple mode off."],
    ["correct-shown", "Correct placement shown."],
    ["showing-correct", "Showing how each state moves into its correct position."],
    ["correction-complete", "Correct placement complete."],
    ["submitted-shown", "Your submitted reconstruction is shown."],
    ["submitted-restored", "Your submitted reconstruction is restored."],
    ["submitted-replay", "Your submitted reconstruction is restored. Replaying the correction."],
    ["lower48-shown", "Correct Lower 48 placement shown."],
    ["lower48-showing", "Showing correct placement."],
    ["reconstruction-reset", "Reconstruction reset."],
    ["lower48-reset", "Lower 48 reconstruction reset."],
    ["lower48-restored", "Lower 48 reconstruction restored."],
    ["all-visible", "All of the workspace is visible."],
    ["submission-review", "Reconstruction submitted. Review your placement feedback."],
    ["submission-compare", "Reconstruction submitted. The correct structure is now available for comparison."],
    ["adjacency-priority", "Reconnect neighboring states before refining small gaps."],
    ["regional-priority", "Check how the ten regional groups fit together."],
    ["national-correct", "The national structure is correct."]
  ].forEach(([phraseKey, text]) => register({
    activity: "map-reconstruction",
    phraseKey: `shared:${phraseKey}`,
    role: "shared",
    text
  }));
}

function registerReconstructionCountVariants() {
  for (let count = 0; count <= 48; count += 1) {
    const stateWord = count === 1 ? "state" : "states";
    [
      [`selected:${count}`, `${count} ${stateWord} selected.`],
      [`connected:${count}`, `Selected a connected group of ${count} ${stateWord}.`],
      [`moved:${count}`, `${count} selected ${stateWord} moved.`],
      [`moved-left:${count}`, `${count} selected ${stateWord} moved left.`],
      [`moved-right:${count}`, `${count} selected ${stateWord} moved right.`],
      [`moved-up:${count}`, `${count} selected ${stateWord} moved up.`],
      [`moved-down:${count}`, `${count} selected ${stateWord} moved down.`],
      [`fit:${count}`, `Fit ${count} selected ${stateWord}.`],
      [`remaining:${count}`, `${count} remaining`],
      [`unplaced:${count}`, `${count} ${stateWord} remain unplaced.`],
      [`well-placed:${count}`, `${count} well placed.`],
      [`close:${count}`, `${count} close.`],
      [`misplaced:${count}`, `${count} misplaced.`]
    ].forEach(([phraseKey, text]) => register({
      activity: "map-reconstruction",
      phraseKey: `count:${phraseKey}`,
      role: "count",
      text,
      variantType: ACTIVITY_AUDIO_VARIANTS.BOUNDED
    }));
  }
  [3, 4, 5, 6, 7, 48].forEach((total) => register({
    activity: "map-reconstruction",
    phraseKey: `placed:${total}:of:${total}`,
    role: "count",
    text: `${total} of ${total} states placed correctly.`,
    variantType: ACTIVITY_AUDIO_VARIANTS.BOUNDED
  }));
}

function registerStateSpecificReconstructionPhrases(capstone) {
  const directions = ["too far north", "too far south", "too far east", "too far west",
    "too far northeast", "too far northwest", "too far southeast", "too far southwest"];
  capstone.stateIds.forEach((stateId) => {
    const name = getStateById(stateId)?.name || stateId;
    register({
      activity: "map-reconstruction",
      phraseKey: `state:${stateId}:name`,
      role: "state-name",
      text: name,
      audioPath: `assets/audio/chips/${stateId}.mp3`,
      variantType: ACTIVITY_AUDIO_VARIANTS.STATE_NAME_ASSET,
      completeSentence: false,
      stateNameReuse: true
    });
    [
      ["placed", `${name} placed in the workspace.`],
      ["placed-selected", `${name} placed in the workspace and selected.`],
      ["returned-bank", `${name} returned to the state bank.`],
      ["returned-drawer", `${name} returned to the drawer.`],
      ["selected", `${name} selected.`],
      ["no-connected", `No connected states found. ${name} selected.`],
      ["moved", `${name} moved.`],
      ["focused", `${name} focused at its current position.`],
      ["unplaced", `${name} was not placed.`],
      ["still-unplaced", `${name} is still unplaced.`],
      ["overlap", `${name} overlaps another state too much.`],
      ["outside", `${name} falls outside the workspace.`],
      ["correction", `${name} needs a larger position correction.`]
    ].forEach(([phraseKey, text]) => register({
      activity: "map-reconstruction",
      phraseKey: `state:${stateId}:${phraseKey}`,
      role: "state-feedback",
      text,
      variantType: ACTIVITY_AUDIO_VARIANTS.BOUNDED
    }));
    ["left", "right", "up", "down"].forEach((direction) => register({
      activity: "map-reconstruction",
      phraseKey: `state:${stateId}:moved-${direction}`,
      role: "state-feedback",
      text: `${name} moved ${direction}.`,
      variantType: ACTIVITY_AUDIO_VARIANTS.BOUNDED
    }));
    ["well placed", "close", "misplaced", "unplaced"].forEach((status) => register({
      activity: "map-reconstruction",
      phraseKey: `state:${stateId}:result:${status.replaceAll(" ", "-")}`,
      role: "state-feedback",
      text: `${name}: ${status}`,
      variantType: ACTIVITY_AUDIO_VARIANTS.BOUNDED
    }));
    directions.forEach((direction) => register({
      activity: "map-reconstruction",
      phraseKey: `state:${stateId}:direction:${direction.replaceAll(" ", "-")}`,
      role: "state-feedback",
      text: `${name} is ${direction}.`,
      variantType: ACTIVITY_AUDIO_VARIANTS.BOUNDED
    }));
  });
}

function registerFallbacks() {
  [
    ["mental-map-invalid-transition", "Mental Map invalid route transition", "The state pair comes from the learner-created route."],
    ["reconstruction-result-summary", "Map Reconstruction combined result summary", "Four bounded counts are combined into many possible sentences."],
    ["lower48-score-summary", "Lower 48 score and percentage summary", "Scores vary from zero through one hundred in several combinations."],
  ].forEach(([phraseKey, text, fallbackReason]) => register({
    activity: phraseKey.startsWith("mental") ? "mental-map" : "map-reconstruction",
    phraseKey: `fallback:${phraseKey}`,
    role: "feedback",
    text,
    variantType: ACTIVITY_AUDIO_VARIANTS.DYNAMIC_FALLBACK,
    fallbackReason,
    recommendedHandling: "Use browser speech for the complete runtime sentence."
  }));
}

function buildRegistry() {
  const regions = listMapReconstructionRegions();
  const capstones = listMapReconstructionCapstones();
  registerMentalMap();
  registerReconstructionFixedPhrases(regions, capstones);
  registerReconstructionCountVariants();
  capstones.forEach(registerStateSpecificReconstructionPhrases);
  registerFallbacks();
}

buildRegistry();

const entriesByPhraseKey = new Map(entries.map((entry) => [`${entry.activity}:${entry.phraseKey}`, entry]));
const entriesByText = new Map();
entries.forEach((entry) => {
  if (entry.variantType !== ACTIVITY_AUDIO_VARIANTS.DYNAMIC_FALLBACK) {
    if (!entriesByText.has(entry.normalizedKey)) entriesByText.set(entry.normalizedKey, entry);
    if (!entriesByText.has(entry.displayKey)) entriesByText.set(entry.displayKey, entry);
  }
});

export function getActivityAudioEntries() {
  return Object.freeze([...entries]);
}

export function getActivityAudioAssets() {
  return Object.freeze([...assetsByNormalizedKey.values()]);
}

export function getActivityAudioFallbacks() {
  return Object.freeze(entries.filter((entry) => entry.variantType === ACTIVITY_AUDIO_VARIANTS.DYNAMIC_FALLBACK));
}

export function getActivityAudioEntry(activity, phraseKey) {
  return entriesByPhraseKey.get(`${activity}:${phraseKey}`) || null;
}

export function getActivityAudioEntryByText(text) {
  return entriesByText.get(getActivityAudioLookupKey(text)) || null;
}
