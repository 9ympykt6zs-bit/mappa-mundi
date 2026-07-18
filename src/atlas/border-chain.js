import { getBorderingStates, getStateById } from "./united-states-atlas-queries.js";
import { unitedStatesAtlas } from "./united-states-atlas-data.js";

const excludedRoundStateIds = new Set(["alaska", "hawaii"]);
const shortestPathCache = new Map();

function normalizeStateId(stateId) {
  const normalized = String(stateId || "").trim().toLowerCase();
  return getStateById(normalized) ? normalized : "";
}

function copyRound(round) {
  return round ? JSON.parse(JSON.stringify(round)) : null;
}

export function getBorderChainNeighbors(stateId) {
  return getBorderingStates(normalizeStateId(stateId)).map((state) => state.id);
}

export function getBorderChainEligibleStateIds() {
  return unitedStatesAtlas.entities
    .filter((entity) => entity.kind === "state")
    .map((entity) => entity.id.replace("state:", ""))
    .filter((stateId) => !excludedRoundStateIds.has(stateId));
}

export function findShortestBorderPath(startStateId, destinationStateId) {
  const start = normalizeStateId(startStateId);
  const destination = normalizeStateId(destinationStateId);
  if (!start || !destination) return null;
  if (start === destination) return [start];
  const cacheKey = `${start}:${destination}`;
  if (shortestPathCache.has(cacheKey)) {
    const cachedPath = shortestPathCache.get(cacheKey);
    return cachedPath ? [...cachedPath] : null;
  }

  const queue = [[start]];
  const visited = new Set([start]);
  while (queue.length) {
    const path = queue.shift();
    const current = path.at(-1);
    for (const neighbor of getBorderChainNeighbors(current)) {
      if (visited.has(neighbor)) continue;
      const nextPath = [...path, neighbor];
      if (neighbor === destination) {
        shortestPathCache.set(cacheKey, nextPath);
        return [...nextPath];
      }
      visited.add(neighbor);
      queue.push(nextPath);
    }
  }
  shortestPathCache.set(cacheKey, null);
  return null;
}

export function getMinimumBorderTransitions(startStateId, destinationStateId) {
  const path = findShortestBorderPath(startStateId, destinationStateId);
  return path ? Math.max(0, path.length - 1) : null;
}

export function findAllShortestBorderPaths(startStateId, destinationStateId, { limit = 16 } = {}) {
  const start = normalizeStateId(startStateId);
  const destination = normalizeStateId(destinationStateId);
  if (!start || !destination || limit < 1) return [];
  if (start === destination) return [[start]];

  const queue = [[start]];
  const shortestPaths = [];
  const visitedDepth = new Map([[start, 0]]);
  let shortestTransitions = Infinity;

  while (queue.length) {
    const path = queue.shift();
    const transitions = path.length - 1;
    if (transitions >= shortestTransitions) continue;
    const current = path.at(-1);

    for (const neighbor of getBorderChainNeighbors(current)) {
      if (path.includes(neighbor)) continue;
      const nextPath = [...path, neighbor];
      const nextTransitions = nextPath.length - 1;
      if (nextTransitions > shortestTransitions) continue;
      if (neighbor === destination) {
        shortestTransitions = nextTransitions;
        shortestPaths.push(nextPath);
        if (shortestPaths.length >= limit) return shortestPaths;
        continue;
      }
      const previousDepth = visitedDepth.get(neighbor);
      if (previousDepth !== undefined && previousDepth < nextTransitions) continue;
      visitedDepth.set(neighbor, nextTransitions);
      queue.push(nextPath);
    }
  }

  return shortestPaths.filter((path) => path.length - 1 === shortestTransitions);
}

export function createBorderChainRound({ startStateId, destinationStateId } = {}) {
  const start = normalizeStateId(startStateId);
  const destination = normalizeStateId(destinationStateId);
  const shortestPath = start && destination && start !== destination
    ? findShortestBorderPath(start, destination)
    : null;
  if (!shortestPath) return null;

  return {
    startStateId: start,
    destinationStateId: destination,
    chain: [start],
    status: "active",
    feedback: "",
    invalidStateId: "",
    shortestPath,
    minimumTransitions: shortestPath.length - 1
  };
}

export function selectBorderChainState(round, stateId) {
  const nextRound = copyRound(round);
  if (!nextRound || nextRound.status !== "active") return nextRound;
  const selectedStateId = normalizeStateId(stateId);
  nextRound.feedback = "";
  nextRound.invalidStateId = "";

  if (!selectedStateId) {
    nextRound.feedback = "That state is not available for this round.";
    return nextRound;
  }
  if (nextRound.chain.includes(selectedStateId)) {
    nextRound.feedback = "That state is already in your chain.";
    nextRound.invalidStateId = selectedStateId;
    return nextRound;
  }
  const currentStateId = nextRound.chain.at(-1);
  if (!getBorderChainNeighbors(currentStateId).includes(selectedStateId)) {
    nextRound.feedback = "Choose a state that shares a land border with the current endpoint.";
    nextRound.invalidStateId = selectedStateId;
    return nextRound;
  }

  nextRound.chain.push(selectedStateId);
  if (selectedStateId === nextRound.destinationStateId) {
    nextRound.status = "complete";
    const playerTransitions = nextRound.chain.length - 1;
    nextRound.feedback = playerTransitions === nextRound.minimumTransitions
      ? "Route complete. You found a shortest path."
      : "Route complete.";
  }
  return nextRound;
}

export function undoBorderChainState(round) {
  const nextRound = copyRound(round);
  if (!nextRound || nextRound.status !== "active" || nextRound.chain.length <= 1) return nextRound;
  nextRound.chain.pop();
  nextRound.feedback = "";
  nextRound.invalidStateId = "";
  return nextRound;
}

export function restartBorderChainRound(round) {
  const nextRound = copyRound(round);
  if (!nextRound) return null;
  nextRound.chain = [nextRound.startStateId];
  nextRound.status = "active";
  nextRound.feedback = "";
  nextRound.invalidStateId = "";
  return nextRound;
}

export function generateBorderChainRound({ previousPairKeys = [], minimumTransitions = 2, random = Math.random } = {}) {
  const eligibleStateIds = getBorderChainEligibleStateIds();
  const seenPairs = new Set(previousPairKeys);
  const candidates = [];

  eligibleStateIds.forEach((startStateId) => {
    eligibleStateIds.forEach((destinationStateId) => {
      if (startStateId === destinationStateId) return;
      const minimum = getMinimumBorderTransitions(startStateId, destinationStateId);
      if (minimum === null || minimum < minimumTransitions) return;
      const pairKey = [startStateId, destinationStateId].sort().join(":");
      candidates.push({ startStateId, destinationStateId, pairKey });
    });
  });

  const unplayedCandidates = candidates.filter((candidate) => !seenPairs.has(candidate.pairKey));
  const pool = unplayedCandidates.length ? unplayedCandidates : candidates;
  if (!pool.length) return null;
  const index = Math.min(pool.length - 1, Math.max(0, Math.floor(Number(random()) * pool.length)));
  const selected = pool[index];
  return {
    ...createBorderChainRound(selected),
    pairKey: selected.pairKey
  };
}
