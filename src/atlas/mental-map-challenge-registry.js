import {
  getMentalMapChallenges,
  MENTAL_MAP_ANSWER_MODES,
  MENTAL_MAP_ROUTE_RENDERING_MODES,
  validateMentalMapChallenge
} from "./mental-map-challenges.js?v=20260721-mental-map-consolidation-1";
import {
  COMPASS_QUESTION_TYPES,
  getCompassChallenges,
  validateCompassChallenge
} from "./compass-challenges.js";
import { resolveRandomSource } from "../deterministic-dependencies.js";

export const MENTAL_MAP_CHALLENGE_CATEGORIES = Object.freeze({
  BORDERS_AND_NEIGHBORS: "borders-and-neighbors",
  COASTS_AND_WATERWAYS: "coasts-and-waterways",
  RIVERS_LAKES_AND_MOUNTAINS: "rivers-lakes-and-mountains",
  RELATIVE_POSITION: "relative-position",
  CARDINAL_DIRECTION: "cardinal-direction",
  DIRECTIONAL_ORDERING: "directional-ordering",
  ROUTES_AND_SEQUENCES: "routes-and-sequences",
  CAPITALS_AND_REGIONS: "capitals-and-regions"
});

const categoryByChallengeId = Object.freeze({
  "pacific-coast-any-three": MENTAL_MAP_CHALLENGE_CATEGORIES.COASTS_AND_WATERWAYS,
  "atlantic-coast-any-three": MENTAL_MAP_CHALLENGE_CATEGORIES.COASTS_AND_WATERWAYS,
  "gulf-of-mexico-coast-all": MENTAL_MAP_CHALLENGE_CATEGORIES.COASTS_AND_WATERWAYS,
  "rocky-mountains-any-three": MENTAL_MAP_CHALLENGE_CATEGORIES.RIVERS_LAKES_AND_MOUNTAINS,
  "mississippi-river-any-three": MENTAL_MAP_CHALLENGE_CATEGORIES.RIVERS_LAKES_AND_MOUNTAINS,
  "lake-erie-all": MENTAL_MAP_CHALLENGE_CATEGORIES.RIVERS_LAKES_AND_MOUNTAINS,
  "mexico-land-border-all": MENTAL_MAP_CHALLENGE_CATEGORIES.BORDERS_AND_NEIGHBORS,
  "canada-contiguous-land-border-all": MENTAL_MAP_CHALLENGE_CATEGORIES.BORDERS_AND_NEIGHBORS,
  "gulf-coast-eastward": MENTAL_MAP_CHALLENGE_CATEGORIES.ROUTES_AND_SEQUENCES,
  "mississippi-west-side-northward": MENTAL_MAP_CHALLENGE_CATEGORIES.ROUTES_AND_SEQUENCES,
  "tennessee-pennsylvania-intermediates": MENTAL_MAP_CHALLENGE_CATEGORIES.ROUTES_AND_SEQUENCES
});

function copy(value) {
  return JSON.parse(JSON.stringify(value));
}

function getBaseChallengeCategory(challenge) {
  if (challenge.id.startsWith("generated-shortest-")) {
    return MENTAL_MAP_CHALLENGE_CATEGORIES.ROUTES_AND_SEQUENCES;
  }
  return categoryByChallengeId[challenge.id] || null;
}

export function adaptCompassChallengeForMentalMap(challenge) {
  if (validateCompassChallenge(challenge).length) return null;
  const isOrdering = challenge.questionType === COMPASS_QUESTION_TYPES.WEST_TO_EAST;
  const category = challenge.questionType === COMPASS_QUESTION_TYPES.SINGLE_DIRECTION
    ? MENTAL_MAP_CHALLENGE_CATEGORIES.CARDINAL_DIRECTION
    : challenge.questionType === COMPASS_QUESTION_TYPES.RELATIVE_POSITION
      ? MENTAL_MAP_CHALLENGE_CATEGORIES.RELATIVE_POSITION
      : MENTAL_MAP_CHALLENGE_CATEGORIES.DIRECTIONAL_ORDERING;
  const adapted = {
    ...copy(challenge),
    category,
    sourceModule: "compass-challenges",
    answerMode: isOrdering
      ? MENTAL_MAP_ANSWER_MODES.ORDERED_SEQUENCE
      : MENTAL_MAP_ANSWER_MODES.SINGLE_SELECT,
    routeRenderingMode: MENTAL_MAP_ROUTE_RENDERING_MODES.FEATURE_ONLY
  };
  if (isOrdering) {
    delete adapted.correctStateIds;
    adapted.directionRelationships = [{
      fromStateId: challenge.orderedStateIds[0],
      toStateId: challenge.orderedStateIds[challenge.orderedStateIds.length - 1],
      direction: "east"
    }];
  } else {
    adapted.correctStateIds = [challenge.correctStateId];
  }
  return adapted;
}

export function validateUnifiedMentalMapChallenge(challenge) {
  const errors = validateMentalMapChallenge(challenge);
  if (!Object.values(MENTAL_MAP_CHALLENGE_CATEGORIES).includes(challenge?.category)) {
    errors.push(`Unknown Mental Map category: ${challenge?.category}`);
  }
  return errors;
}

export function getUnifiedMentalMapChallenges(options = {}) {
  const { includeGenerated = true } = options;
  const candidates = [
    ...getMentalMapChallenges(options).map((challenge) => ({
      ...challenge,
      category: getBaseChallengeCategory(challenge),
      sourceModule: "mental-map-challenges"
    })),
    ...getCompassChallenges().map(adaptCompassChallengeForMentalMap)
  ].filter(Boolean);
  const seenIds = new Set();
  return candidates.filter((challenge) => {
    if (seenIds.has(challenge.id) || validateUnifiedMentalMapChallenge(challenge).length) return false;
    seenIds.add(challenge.id);
    return true;
  });
}

export function selectNextUnifiedMentalMapChallenge(challenges, options = {}) {
  return selectNextUnifiedMentalMapChallengeWithDebug(challenges, options).selected;
}

export function selectNextUnifiedMentalMapChallengeWithDebug(challenges, options = {}) {
  const valid = (challenges || []).filter((challenge) => (
    challenge
    && !validateUnifiedMentalMapChallenge(challenge).length
    && challenge.id !== options.lastQuestionId
    && !(options.usedQuestionIds || new Set()).has(challenge.id)
  ));
  if (!valid.length) {
    return {
      selected: null,
      debug: {
        suppliedCount: (challenges || []).length,
        eligibleCount: 0,
        preferredCount: 0,
        selectedIndex: -1,
        randomValue: null,
        filters: [],
        candidates: []
      }
    };
  }

  let preferred = valid;
  const filters = [];
  const orderedRecently = (options.recentAnswerModes || [])
    .slice(-2)
    .includes(MENTAL_MAP_ANSWER_MODES.ORDERED_SEQUENCE);
  if (orderedRecently && preferred.some(({ answerMode }) => answerMode !== MENTAL_MAP_ANSWER_MODES.ORDERED_SEQUENCE)) {
    preferred = preferred.filter(({ answerMode }) => answerMode !== MENTAL_MAP_ANSWER_MODES.ORDERED_SEQUENCE);
    filters.push("avoid-recent-ordered-sequence");
  }
  if (options.lastCategory && preferred.some(({ category }) => category !== options.lastCategory)) {
    preferred = preferred.filter(({ category }) => category !== options.lastCategory);
    filters.push("avoid-last-category");
  }
  const randomValue = Math.max(0, Math.min(0.999999, Number(resolveRandomSource(options)())));
  const selectedIndex = Math.floor(randomValue * preferred.length);
  const selected = preferred[selectedIndex] || null;
  return {
    selected,
    debug: {
      suppliedCount: (challenges || []).length,
      eligibleCount: valid.length,
      preferredCount: preferred.length,
      selectedIndex,
      randomValue,
      filters,
      candidates: preferred.map((challenge, index) => ({
        id: challenge.id,
        category: challenge.category || null,
        answerMode: challenge.answerMode || null,
        generated: Boolean(challenge.generated),
        status: index === selectedIndex ? "selected" : "considered-not-selected"
      }))
    }
  };
}
