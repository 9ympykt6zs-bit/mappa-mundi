import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createUnitedStatesMemoryTrailSelectionExplanation } from "../src/learning-inspector.js";
import {
  createUnitedStatesMemoryTrailState,
  planUnitedStatesMemoryTrailSession
} from "../src/united-states-memory-trail-planner.js";
import { loadUnitedStatesSimulationFixture } from "./lib/us-simulation-fixture.mjs";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const fixture = loadUnitedStatesSimulationFixture(repositoryRoot);
const state = createUnitedStatesMemoryTrailState({
  currentSessionNumber: 20,
  introducedItemIds: fixture.items.map((item) => item.id),
  itemProgress: Object.fromEntries(fixture.items.map((item) => [item.id, {
    status: item.id === "state:ohio" ? "learning" : "review",
    memoryState: item.id === "state:ohio" ? "relearning" : "review",
    timesSeen: 4,
    correctCount: item.id === "state:ohio" ? 1 : 4,
    missCount: item.id === "state:ohio" ? 3 : 0,
    lapseCount: item.id === "state:ohio" ? 3 : 0,
    correctStreak: item.id === "state:ohio" ? 0 : 3,
    lastSeenSession: 10,
    dueSession: item.id === "state:ohio" ? 20 : 30
  }]))
}, fixture.items);
const deterministicContext = { seed: "selection-trace-example-ohio", now: "2035-06-10T12:00:00.000Z" };
const plan = planUnitedStatesMemoryTrailSession(state, fixture.items, {
  seed: deterministicContext.seed,
  now: () => new Date(deterministicContext.now)
});
const ohio = plan.playItems.find((item) => item.id === "state:ohio");
if (!ohio) throw new Error("The example fixture did not select Ohio.");
const explanation = createUnitedStatesMemoryTrailSelectionExplanation({ state, plan, item: ohio, deterministicContext });
const output = {
  purpose: "Example O5.5 trace for repeated Ohio selection in a controlled weak-item state.",
  caveat: "This explains the current decision path; it does not prove the planner is pedagogically correct.",
  selectionExplanation: explanation
};
const outputDirectory = path.join(repositoryRoot, "reports");
fs.mkdirSync(outputDirectory, { recursive: true });
fs.writeFileSync(path.join(outputDirectory, "selection-trace-example.json"), `${JSON.stringify(output, null, 2)}\n`);
console.log("Generated reports/selection-trace-example.json.");
