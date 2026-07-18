import assert from "node:assert/strict";
import {
  createBorderChainRound,
  findShortestBorderPath,
  generateBorderChainRound,
  getBorderChainNeighbors,
  getMinimumBorderTransitions,
  restartBorderChainRound,
  selectBorderChainState,
  undoBorderChainState
} from "../src/atlas/border-chain.js";

assert.ok(getBorderChainNeighbors("tennessee").includes("kentucky"));
assert.ok(!getBorderChainNeighbors("tennessee").includes("california"));
assert.deepEqual(findShortestBorderPath("california", "texas"), ["california", "arizona", "new-mexico", "texas"]);
assert.equal(getMinimumBorderTransitions("tennessee", "ohio"), 2);
assert.equal(findShortestBorderPath("unknown-state", "tennessee"), null);
assert.equal(createBorderChainRound({ startStateId: "tennessee", destinationStateId: "unknown-state" }), null);

let round = createBorderChainRound({ startStateId: "tennessee", destinationStateId: "ohio" });
round = selectBorderChainState(round, "kentucky");
assert.deepEqual(round.chain, ["tennessee", "kentucky"]);
round = selectBorderChainState(round, "california");
assert.deepEqual(round.chain, ["tennessee", "kentucky"]);
assert.match(round.feedback, /shares a land border/);
round = selectBorderChainState(round, "unknown-state");
assert.deepEqual(round.chain, ["tennessee", "kentucky"]);
round = selectBorderChainState(round, "tennessee");
assert.match(round.feedback, /already in your chain/);
round = undoBorderChainState(round);
assert.deepEqual(round.chain, ["tennessee"]);
assert.deepEqual(undoBorderChainState(round).chain, ["tennessee"]);
round = selectBorderChainState(round, "kentucky");
round = selectBorderChainState(round, "ohio");
assert.equal(round.status, "complete");
assert.equal(round.chain.length - 1, 2);
assert.equal(round.minimumTransitions, 2);
round = restartBorderChainRound(round);
assert.deepEqual(round.chain, ["tennessee"]);
assert.equal(round.status, "active");

const generatedPairKeys = [];
for (let index = 0; index < 12; index += 1) {
  const generated = generateBorderChainRound({
    previousPairKeys: generatedPairKeys,
    minimumTransitions: 2,
    random: () => (index + 0.2) / 12
  });
  assert.ok(generated);
  assert.ok(generated.minimumTransitions >= 2);
  assert.ok(generated.shortestPath.length > 2);
  assert.ok(!generated.chain.includes("alaska"));
  assert.ok(!generated.chain.includes("hawaii"));
  assert.ok(!generated.shortestPath.includes("alaska"));
  assert.ok(!generated.shortestPath.includes("hawaii"));
  assert.ok(findShortestBorderPath(generated.startStateId, generated.destinationStateId));
  generatedPairKeys.push(generated.pairKey);
}
assert.equal(new Set(generatedPairKeys).size, generatedPairKeys.length);

console.log("Border Chain validation passed:", JSON.stringify({
  tennesseeNeighbors: getBorderChainNeighbors("tennessee").length,
  californiaToTexasTransitions: getMinimumBorderTransitions("california", "texas"),
  generatedRounds: generatedPairKeys.length
}));
