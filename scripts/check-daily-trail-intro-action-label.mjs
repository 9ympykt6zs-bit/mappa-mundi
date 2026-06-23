import assert from "node:assert/strict";
import fs from "node:fs";
import { createDailyTrailState, hasDailyTrailProgress } from "../src/daily-trail-planner.js";

const mapSource = fs.readFileSync(
  new URL("../src/maplibre-poc.js", import.meta.url),
  "utf8"
);

const freshState = createDailyTrailState();
const startedState = createDailyTrailState({ hasStarted: true });
const reviewOnlyState = createDailyTrailState({
  itemProgress: {
    "world-core:canada": { status: "review", dueAt: "2026-06-23" },
    "world-core:mexico": { status: "review", dueAt: "2026-06-23" }
  },
  sessionsSinceLastCheckpoint: 1
});
const resetState = createDailyTrailState();

assert.equal(hasDailyTrailProgress(freshState), false, "A new Daily Trail must show Begin.");
assert.equal(hasDailyTrailProgress(startedState), true, "Started Daily Trail progress must show Continue.");
assert.equal(hasDailyTrailProgress(reviewOnlyState), true, "Review-only progress must show Continue.");
assert.equal(hasDailyTrailProgress(resetState), false, "A reset Daily Trail must return to Begin.");
assert.ok(mapSource.includes("function getDailyTrailIntroPrimaryActionLabel(state = loadDailyTrailState())"));
assert.ok(mapSource.includes(' ? "CONTINUE DAILY TRAIL"\n    : "BEGIN DAILY TRAIL";'));
assert.ok(mapSource.includes("beginButton.addEventListener(\"click\", startDailyTrailSession);"));
assert.ok(mapSource.includes("beginButton.setAttribute(\"aria-label\", beginButtonLabel);"));
assert.ok(mapSource.includes("beginButton.title = beginButtonLabel;"));

console.log("Daily Trail intro action label check passed.");
