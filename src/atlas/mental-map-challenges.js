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

export const MENTAL_MAP_COUNT_RULES = Object.freeze({
  MINIMUM: "minimum",
  EXACT: "exact"
});

export const MENTAL_MAP_ROUTE_RENDERING_MODES = Object.freeze({
  FEATURE_ONLY: "feature-only",
  STATE_CENTROID_SEQUENCE: "state-centroid-sequence",
  EXPLICIT_ROUTE_GEOMETRY: "explicit-route-geometry"
});

export const MENTAL_MAP_ROUTE_VALIDATION_MODES = Object.freeze({
  BORDER_GRAPH: "border-graph"
});

export function isMentalMapBorderRouteChallenge(challenge) {
  return challenge?.answerMode === MENTAL_MAP_ANSWER_MODES.ORDERED_SEQUENCE
    && challenge?.routeValidationMode === MENTAL_MAP_ROUTE_VALIDATION_MODES.BORDER_GRAPH;
}

export function getMentalMapRouteRenderingMode(challenge) {
  if (challenge?.answerMode !== MENTAL_MAP_ANSWER_MODES.ORDERED_SEQUENCE) return null;
  if (Object.values(MENTAL_MAP_ROUTE_RENDERING_MODES).includes(challenge.routeRenderingMode)) {
    return challenge.routeRenderingMode;
  }
  if (challenge.explicitRouteGeometry) return MENTAL_MAP_ROUTE_RENDERING_MODES.EXPLICIT_ROUTE_GEOMETRY;
  if (challenge.associatedFeatureIds?.length) return MENTAL_MAP_ROUTE_RENDERING_MODES.FEATURE_ONLY;
  return MENTAL_MAP_ROUTE_RENDERING_MODES.STATE_CENTROID_SEQUENCE;
}

export const MENTAL_MAP_GEOGRAPHIC_DECISIONS = Object.freeze({
  pacificCoast: "The Pacific question says U.S. states, so Alaska and Hawaii are included with California, Oregon, and Washington.",
  canadaBorder: "A state borders another political territory when their legal boundaries meet, including where the boundary runs through a river or lake. Alaska is excluded because the question specifies contiguous states.",
  mississippiAssociation: "The atlas records broad Mississippi River associations. The prompt says bordering or lying alongside, not that the river runs through every listed state.",
  rockyMountains: "Rocky Mountains answers use the atlas's broad locatedIn associations rather than an exact mapped mountain footprint.",
  coastlines: "Coast questions use the atlas coast relationships. Florida may belong to both Atlantic Ocean and Gulf of Mexico sets.",
  mississippiWestSide: "The curated west-side route runs northward from Louisiana through Arkansas, Missouri, Iowa, and Minnesota.",
  shortestRoutes: "Generated neighboring-state route questions exclude Alaska and Hawaii. Every valid border-by-border route is accepted, and all shortest routes contribute states to the answer bank.",
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
    countRule: MENTAL_MAP_COUNT_RULES.MINIMUM,
    correctStateIds: pacificCoastStateIds,
    requiredSelectionCount: 3,
    distractorStateIds: ["arizona", "florida", "nevada", "texas"],
    explanation: "The atlas includes Alaska and Hawaii because the prompt asks about all U.S. states, not only the contiguous states.",
    associatedFeatureIds: ["water:pacific-ocean"]
  },
  {
    id: "rocky-mountains-any-three",
    title: "Rocky Mountains",
    prompt: "Name any three U.S. states that include part of the Rocky Mountains.",
    answerMode: MENTAL_MAP_ANSWER_MODES.SELECT_COUNT,
    countRule: MENTAL_MAP_COUNT_RULES.MINIMUM,
    correctStateIds: rockyMountainStateIds,
    requiredSelectionCount: 3,
    distractorStateIds: ["arizona", "nevada", "oregon", "washington"],
    explanation: "The Rocky Mountains extend through several western states, including Colorado, Wyoming, Montana, Idaho, Utah, and New Mexico.",
    associatedFeatureIds: ["mountain-range:rocky-mountains"]
  },
  {
    id: "atlantic-coast-any-three",
    title: "Atlantic Coast",
    prompt: "Name any three U.S. states with an Atlantic Ocean coastline.",
    answerMode: MENTAL_MAP_ANSWER_MODES.SELECT_COUNT,
    countRule: MENTAL_MAP_COUNT_RULES.MINIMUM,
    correctStateIds: atlanticCoastStateIds,
    requiredSelectionCount: 3,
    distractorStateIds: ["alabama", "ohio", "tennessee", "west-virginia"],
    explanation: "These states have an Atlantic Ocean coast relationship in the atlas; Florida also has a Gulf of Mexico coast.",
    associatedFeatureIds: ["water:atlantic-ocean"]
  },
  {
    id: "mississippi-river-any-three",
    title: "Mississippi River",
    prompt: "Name any three U.S. states that border or lie alongside the Mississippi River.",
    answerMode: MENTAL_MAP_ANSWER_MODES.SELECT_COUNT,
    countRule: MENTAL_MAP_COUNT_RULES.MINIMUM,
    correctStateIds: mississippiRiverStateIds,
    requiredSelectionCount: 3,
    distractorStateIds: ["alabama", "indiana", "kansas", "ohio"],
    explanation: "Ten states border or lie alongside the Mississippi River from Minnesota to Louisiana.",
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
    prompt: "Name as many contiguous U.S. states as you can that border Canada.",
    answerMode: MENTAL_MAP_ANSWER_MODES.SELECT_ALL,
    correctStateIds: contiguousCanadaBorderStateIds,
    distractorStateIds: ["alaska", "indiana", "south-dakota", "wisconsin"],
    explanation: "Twelve contiguous U.S. states border Canada. Some boundaries cross dry land, while others run through the Great Lakes or connecting waterways.",
    associatedFeatureIds: ["country:canada"]
  },
  {
    id: "lake-erie-all",
    title: "Lake Erie",
    prompt: "Select every U.S. state that borders Lake Erie.",
    answerMode: MENTAL_MAP_ANSWER_MODES.SELECT_ALL,
    correctStateIds: lakeErieStateIds,
    distractorStateIds: ["illinois", "indiana", "vermont", "wisconsin"],
    explanation: "Michigan, Ohio, Pennsylvania, and New York border Lake Erie.",
    associatedFeatureIds: ["lake:lake-erie"]
  },
  {
    id: "gulf-of-mexico-coast-all",
    title: "Gulf Coast",
    prompt: "Select every U.S. state with a Gulf of Mexico coastline.",
    answerMode: MENTAL_MAP_ANSWER_MODES.SELECT_ALL,
    correctStateIds: gulfCoastStateIds,
    distractorStateIds: ["arkansas", "georgia", "oklahoma", "south-carolina"],
    explanation: "Texas, Louisiana, Mississippi, Alabama, and Florida have coastline along the Gulf of Mexico, also called the Gulf of America by the U.S. federal government.",
    associatedFeatureIds: ["water:gulf-of-mexico"]
  },
  {
    id: "gulf-coast-eastward",
    title: "Gulf Coast Order",
    prompt: "Travel eastward along the Gulf of Mexico coast from Texas to Florida.",
    answerMode: MENTAL_MAP_ANSWER_MODES.ORDERED_SEQUENCE,
    routeRenderingMode: MENTAL_MAP_ROUTE_RENDERING_MODES.FEATURE_ONLY,
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
    routeRenderingMode: MENTAL_MAP_ROUTE_RENDERING_MODES.FEATURE_ONLY,
    orderedStateIds: ["louisiana", "arkansas", "missouri", "iowa", "minnesota"],
    distractorStateIds: ["illinois", "kentucky", "mississippi", "wisconsin"],
    explanation: "This question follows the explicitly curated western side: Louisiana, Arkansas, Missouri, Iowa, then Minnesota.",
    associatedFeatureIds: ["river:mississippi-river"]
  },
  {
    id: "tennessee-pennsylvania-intermediates",
    title: "Neighboring State Route",
    prompt: "Find a route from Tennessee to Pennsylvania by traveling only through states that share a border.",
    secondaryInstruction: "Choose the intermediate states in order.",
    answerMode: MENTAL_MAP_ANSWER_MODES.ORDERED_SEQUENCE,
    routeValidationMode: MENTAL_MAP_ROUTE_VALIDATION_MODES.BORDER_GRAPH,
    routeRenderingMode: MENTAL_MAP_ROUTE_RENDERING_MODES.STATE_CENTROID_SEQUENCE,
    orderedStateIds: [],
    distractorStateIds: ["maryland", "north-carolina", "ohio"],
    routeStartStateId: "tennessee",
    routeDestinationStateId: "pennsylvania",
    explanation: "A valid route moves from state to neighboring state until it reaches Pennsylvania."
  }
]);

function copyChallenge(challenge) {
  return JSON.parse(JSON.stringify(challenge));
}

function createGeneratedRouteDistractors(paths) {
  const routeIds = new Set(paths.flat());
  return [...new Set(paths.flat().flatMap((stateId) => getBorderChainNeighbors(stateId)))]
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
    const shortestPaths = findAllShortestBorderPaths(startStateId, destinationStateId);
    if (!shortestPaths.length || shortestPaths[0].length < 4) continue;
    const start = getStateById(startStateId);
    const destination = getStateById(destinationStateId);
    return {
      id: `generated-shortest-${startStateId}-${destinationStateId}`,
      title: "Neighboring State Route",
      prompt: `Find a route from ${start.name} to ${destination.name} by traveling only through states that share a border.`,
      secondaryInstruction: "Choose the intermediate states in order.",
      answerMode: MENTAL_MAP_ANSWER_MODES.ORDERED_SEQUENCE,
      routeValidationMode: MENTAL_MAP_ROUTE_VALIDATION_MODES.BORDER_GRAPH,
      routeRenderingMode: MENTAL_MAP_ROUTE_RENDERING_MODES.STATE_CENTROID_SEQUENCE,
      orderedStateIds: [],
      distractorStateIds: createGeneratedRouteDistractors(shortestPaths),
      routeStartStateId: startStateId,
      routeDestinationStateId: destinationStateId,
      explanation: `A valid route moves from state to neighboring state until it reaches ${destination.name}.`,
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
    if (!Object.values(MENTAL_MAP_COUNT_RULES).includes(challenge?.countRule)) {
      errors.push("Select-count requires a valid count rule.");
    } else if (challenge.countRule === MENTAL_MAP_COUNT_RULES.MINIMUM && !/\b(any|at least)\b/i.test(challenge.prompt)) {
      errors.push("Minimum-count prompt must say any or at least.");
    } else if (challenge.countRule === MENTAL_MAP_COUNT_RULES.EXACT && !/\bexactly\b/i.test(challenge.prompt)) {
      errors.push("Exact-count prompt must say exactly.");
    }
  }
  if (challenge?.routeRenderingMode
    && !Object.values(MENTAL_MAP_ROUTE_RENDERING_MODES).includes(challenge.routeRenderingMode)) {
    errors.push(`Unknown route rendering mode: ${challenge.routeRenderingMode}`);
  }
  if (challenge?.routeRenderingMode === MENTAL_MAP_ROUTE_RENDERING_MODES.EXPLICIT_ROUTE_GEOMETRY
    && !challenge.explicitRouteGeometry) {
    errors.push("Explicit route rendering requires route geometry.");
  }
  if (challenge?.routeValidationMode
    && !Object.values(MENTAL_MAP_ROUTE_VALIDATION_MODES).includes(challenge.routeValidationMode)) {
    errors.push(`Unknown route validation mode: ${challenge.routeValidationMode}`);
  }
  if (challenge?.routeValidationMode === MENTAL_MAP_ROUTE_VALIDATION_MODES.BORDER_GRAPH
    && (!challenge.routeStartStateId || !challenge.routeDestinationStateId)) {
    errors.push("Border-route validation requires start and destination states.");
  }
  (challenge?.associatedFeatureIds || []).forEach((entityId) => {
    if (!getEntity(unitedStatesAtlas, entityId)) errors.push(`Unknown associated feature ID: ${entityId}`);
  });
  return errors;
}

export function getMentalMapGeographicDecisionNotes() {
  return { ...MENTAL_MAP_GEOGRAPHIC_DECISIONS };
}
