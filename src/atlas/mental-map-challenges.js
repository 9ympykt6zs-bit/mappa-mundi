import {
  getConnectedLakes,
  getConnectedMountainRanges,
  getConnectedRivers,
  getInternationalNeighbors,
  getStateById,
  getStateCoasts
} from "./united-states-atlas-queries.js";
import { getEntity, unitedStatesAtlas } from "./united-states-atlas-data.js";
import {
  findAllShortestBorderPaths,
  getBorderChainEligibleStateIds,
  getBorderChainNeighbors
} from "./border-chain.js";

export const MENTAL_MAP_ANSWER_MODES = Object.freeze({
  SELECT_COUNT: "select-count",
  SELECT_ALL: "select-all",
  ORDERED_SEQUENCE: "ordered-sequence"
});

export const MENTAL_MAP_GEOGRAPHIC_DECISIONS = Object.freeze({
  pacificCoast: "The Pacific question says U.S. states, so Alaska and Hawaii are included with California, Oregon, and Washington.",
  canadaBorder: "The Canada question says contiguous U.S. states, so Alaska is excluded and maritime or Great Lakes proximity does not count.",
  mississippiAssociation: "The atlas records broad Mississippi River associations. The prompt says bordering or lying alongside, not that the river runs through every listed state.",
  rockyMountains: "Rocky Mountains answers use the atlas's broad locatedIn associations rather than an exact mapped mountain footprint.",
  coastlines: "Coast questions use the atlas coast relationships. Florida may belong to both Atlantic Ocean and Gulf of Mexico sets.",
  mississippiWestSide: "The curated west-side route runs northward from Louisiana through Arkansas, Missouri, Iowa, and Minnesota.",
  shortestRoutes: "Generated land-border routes exclude Alaska and Hawaii and use only pairs with one unique shortest path.",
  gulfNaming: "The atlas displays Gulf of Mexico and recognizes Gulf of America as the alternate U.S. federal name."
});

const allStateIds = unitedStatesAtlas.entities
  .filter((entity) => entity.kind === "state")
  .map((entity) => entity.id.replace("state:", ""));

function stateIdsWhere(predicate) {
  return allStateIds.filter(predicate).sort();
}

function hasNamedEntity(items, entityId) {
  return items.some((item) => item.id === entityId);
}

const pacificCoastStateIds = stateIdsWhere((stateId) => hasNamedEntity(getStateCoasts(stateId), "pacific-ocean"));
const atlanticCoastStateIds = stateIdsWhere((stateId) => hasNamedEntity(getStateCoasts(stateId), "atlantic-ocean"));
const gulfCoastStateIds = stateIdsWhere((stateId) => hasNamedEntity(getStateCoasts(stateId), "gulf-of-mexico"));
const rockyMountainStateIds = stateIdsWhere((stateId) => hasNamedEntity(getConnectedMountainRanges(stateId), "rocky-mountains"));
const mississippiRiverStateIds = stateIdsWhere((stateId) => hasNamedEntity(getConnectedRivers(stateId), "mississippi-river"));
const mexicoBorderStateIds = stateIdsWhere((stateId) => hasNamedEntity(getInternationalNeighbors(stateId), "mexico"));
const contiguousCanadaBorderStateIds = stateIdsWhere((stateId) => stateId !== "alaska" && hasNamedEntity(getInternationalNeighbors(stateId), "canada"));
const lakeErieStateIds = stateIdsWhere((stateId) => hasNamedEntity(getConnectedLakes(stateId), "lake-erie"));

const staticChallenges = Object.freeze([
  {
    id: "pacific-coast-any-three",
    title: "Pacific Coast",
    prompt: "Name any three U.S. states with a Pacific Ocean coastline.",
    answerMode: MENTAL_MAP_ANSWER_MODES.SELECT_COUNT,
    correctStateIds: pacificCoastStateIds,
    requiredSelectionCount: 3,
    distractorStateIds: ["arizona", "florida", "nevada", "texas"],
    explanation: "The atlas includes Alaska and Hawaii because the prompt asks about all U.S. states, not only the contiguous states.",
    associatedFeatureIds: ["water:pacific-ocean"]
  },
  {
    id: "rocky-mountains-any-three",
    title: "Rocky Mountains",
    prompt: "Name any three U.S. states associated with the Rocky Mountains.",
    answerMode: MENTAL_MAP_ANSWER_MODES.SELECT_COUNT,
    correctStateIds: rockyMountainStateIds,
    requiredSelectionCount: 3,
    distractorStateIds: ["arizona", "nevada", "oregon", "washington"],
    explanation: "This uses the atlas's broad Rocky Mountains associations rather than an exact mountain-footprint boundary.",
    associatedFeatureIds: ["mountain-range:rocky-mountains"]
  },
  {
    id: "atlantic-coast-any-three",
    title: "Atlantic Coast",
    prompt: "Name any three U.S. states with an Atlantic Ocean coastline.",
    answerMode: MENTAL_MAP_ANSWER_MODES.SELECT_COUNT,
    correctStateIds: atlanticCoastStateIds,
    requiredSelectionCount: 3,
    distractorStateIds: ["alabama", "ohio", "tennessee", "west-virginia"],
    explanation: "These states have an Atlantic Ocean coast relationship in the atlas; Florida also has a Gulf of Mexico coast.",
    associatedFeatureIds: ["water:atlantic-ocean"]
  },
  {
    id: "mississippi-river-any-three",
    title: "Mississippi River",
    prompt: "Name any three U.S. states recorded as bordering or lying alongside the Mississippi River.",
    answerMode: MENTAL_MAP_ANSWER_MODES.SELECT_COUNT,
    correctStateIds: mississippiRiverStateIds,
    requiredSelectionCount: 3,
    distractorStateIds: ["alabama", "indiana", "kansas", "ohio"],
    explanation: "The canonical atlas records these as Mississippi River associations; it does not claim the river runs through every state.",
    associatedFeatureIds: ["river:mississippi-river"]
  },
  {
    id: "mexico-land-border-all",
    title: "Border with Mexico",
    prompt: "Select every U.S. state sharing a land border with Mexico.",
    answerMode: MENTAL_MAP_ANSWER_MODES.SELECT_ALL,
    correctStateIds: mexicoBorderStateIds,
    distractorStateIds: ["colorado", "nevada", "oklahoma", "utah"],
    explanation: "Only state-to-country land boundaries count; coastline and nearby-state relationships do not.",
    associatedFeatureIds: ["country:mexico"]
  },
  {
    id: "canada-contiguous-land-border-all",
    title: "Border with Canada",
    prompt: "Select every contiguous U.S. state sharing a land border with Canada.",
    answerMode: MENTAL_MAP_ANSWER_MODES.SELECT_ALL,
    correctStateIds: contiguousCanadaBorderStateIds,
    distractorStateIds: ["alaska", "michigan", "ohio", "wisconsin"],
    explanation: "Alaska is excluded by the word contiguous. Great Lakes boundaries and maritime proximity do not count as a state-to-country land border.",
    associatedFeatureIds: ["country:canada"]
  },
  {
    id: "lake-erie-all",
    title: "Lake Erie",
    prompt: "Select every U.S. state touching Lake Erie in the canonical atlas.",
    answerMode: MENTAL_MAP_ANSWER_MODES.SELECT_ALL,
    correctStateIds: lakeErieStateIds,
    distractorStateIds: ["illinois", "indiana", "vermont", "wisconsin"],
    explanation: "The atlas records Michigan, New York, Ohio, and Pennsylvania as touching Lake Erie.",
    associatedFeatureIds: ["lake:lake-erie"]
  },
  {
    id: "gulf-of-mexico-coast-all",
    title: "Gulf Coast",
    prompt: "Select every U.S. state with a Gulf of Mexico coastline.",
    answerMode: MENTAL_MAP_ANSWER_MODES.SELECT_ALL,
    correctStateIds: gulfCoastStateIds,
    distractorStateIds: ["arkansas", "georgia", "oklahoma", "south-carolina"],
    explanation: "The atlas displays Gulf of Mexico and recognizes Gulf of America as the alternate U.S. federal name.",
    associatedFeatureIds: ["water:gulf-of-mexico"]
  },
  {
    id: "gulf-coast-eastward",
    title: "Gulf Coast Order",
    prompt: "Travel eastward along the Gulf of Mexico coast from Texas to Florida.",
    answerMode: MENTAL_MAP_ANSWER_MODES.ORDERED_SEQUENCE,
    orderedStateIds: ["texas", "louisiana", "mississippi", "alabama", "florida"],
    distractorStateIds: ["arkansas", "georgia", "oklahoma"],
    explanation: "From west to east, the Gulf Coast states are Texas, Louisiana, Mississippi, Alabama, and Florida.",
    associatedFeatureIds: ["water:gulf-of-mexico"]
  },
  {
    id: "mississippi-west-side-northward",
    title: "Mississippi River Order",
    prompt: "Follow the western side of the Mississippi River northward from Louisiana to Minnesota.",
    answerMode: MENTAL_MAP_ANSWER_MODES.ORDERED_SEQUENCE,
    orderedStateIds: ["louisiana", "arkansas", "missouri", "iowa", "minnesota"],
    distractorStateIds: ["illinois", "kentucky", "mississippi", "wisconsin"],
    explanation: "This question follows the explicitly curated western side: Louisiana, Arkansas, Missouri, Iowa, then Minnesota.",
    associatedFeatureIds: ["river:mississippi-river"]
  },
  {
    id: "tennessee-pennsylvania-intermediates",
    title: "Two Valid Land Routes",
    prompt: "Choose the two intermediate states, in travel order, for a land-border route from Tennessee to Pennsylvania.",
    answerMode: MENTAL_MAP_ANSWER_MODES.ORDERED_SEQUENCE,
    orderedStateIds: ["kentucky", "west-virginia"],
    acceptedAlternatives: [["virginia", "west-virginia"]],
    distractorStateIds: ["maryland", "north-carolina", "ohio"],
    routeStartStateId: "tennessee",
    routeDestinationStateId: "pennsylvania",
    explanation: "Both Tennessee-Kentucky-West Virginia-Pennsylvania and Tennessee-Virginia-West Virginia-Pennsylvania are valid land-border routes."
  }
]);

function copyChallenge(challenge) {
  return JSON.parse(JSON.stringify(challenge));
}

function createGeneratedRouteDistractors(path) {
  const routeIds = new Set(path);
  return [...new Set(path.flatMap((stateId) => getBorderChainNeighbors(stateId)))]
    .filter((stateId) => !routeIds.has(stateId))
    .slice(0, 5);
}

export function createGeneratedShortestRouteChallenge({ random = Math.random } = {}) {
  const eligibleIds = getBorderChainEligibleStateIds();
  const pairs = [];
  eligibleIds.forEach((startStateId) => {
    eligibleIds.forEach((destinationStateId) => {
      if (startStateId < destinationStateId) pairs.push([startStateId, destinationStateId]);
    });
  });
  const startIndex = Math.min(pairs.length - 1, Math.max(0, Math.floor(Number(random()) * pairs.length)));

  for (let offset = 0; offset < pairs.length; offset += 1) {
    const [startStateId, destinationStateId] = pairs[(startIndex + offset) % pairs.length];
    const shortestPaths = findAllShortestBorderPaths(startStateId, destinationStateId, { limit: 2 });
    if (shortestPaths.length !== 1 || shortestPaths[0].length < 4) continue;
    const path = shortestPaths[0];
    const start = getStateById(startStateId);
    const destination = getStateById(destinationStateId);
    return {
      id: `generated-shortest-${startStateId}-${destinationStateId}`,
      title: "Shortest State Route",
      prompt: `Choose the intermediate states, in order, for the unique shortest land-border route from ${start.name} to ${destination.name}.`,
      answerMode: MENTAL_MAP_ANSWER_MODES.ORDERED_SEQUENCE,
      orderedStateIds: path.slice(1, -1),
      distractorStateIds: createGeneratedRouteDistractors(path),
      routeStartStateId: startStateId,
      routeDestinationStateId: destinationStateId,
      explanation: `The unique shortest route uses ${path.length - 1} state-to-state land-border transitions.`,
      generated: true
    };
  }
  return null;
}

export function getMentalMapChallenges({ includeGenerated = true, random = Math.random } = {}) {
  const challenges = staticChallenges.map(copyChallenge);
  const generated = includeGenerated ? createGeneratedShortestRouteChallenge({ random }) : null;
  return generated ? [...challenges, generated] : challenges;
}

export function validateMentalMapChallenge(challenge) {
  const errors = [];
  const mode = challenge?.answerMode;
  if (!challenge?.id || !challenge?.title || !challenge?.prompt) errors.push("Challenge identity and prompt are required.");
  if (!Object.values(MENTAL_MAP_ANSWER_MODES).includes(mode)) errors.push(`Unknown answer mode: ${mode}`);
  const requiredIds = mode === MENTAL_MAP_ANSWER_MODES.ORDERED_SEQUENCE
    ? challenge?.orderedStateIds || []
    : challenge?.correctStateIds || [];
  const allReferencedStateIds = [
    ...requiredIds,
    ...(challenge?.distractorStateIds || []),
    ...(challenge?.acceptedAlternatives || []).flat(),
    ...[challenge?.routeStartStateId, challenge?.routeDestinationStateId].filter(Boolean)
  ];
  allReferencedStateIds.forEach((stateId) => {
    if (!getStateById(stateId)) errors.push(`Unknown state ID: ${stateId}`);
  });
  if (new Set(requiredIds).size !== requiredIds.length) errors.push("Required answers must be unique.");
  if (mode === MENTAL_MAP_ANSWER_MODES.SELECT_COUNT) {
    const count = Number(challenge?.requiredSelectionCount);
    if (!Number.isInteger(count) || count < 1 || count > requiredIds.length) errors.push("Select-count requires a valid requested count.");
  }
  (challenge?.associatedFeatureIds || []).forEach((entityId) => {
    if (!getEntity(unitedStatesAtlas, entityId)) errors.push(`Unknown associated feature ID: ${entityId}`);
  });
  return errors;
}

export function getMentalMapGeographicDecisionNotes() {
  return { ...MENTAL_MAP_GEOGRAPHIC_DECISIONS };
}
