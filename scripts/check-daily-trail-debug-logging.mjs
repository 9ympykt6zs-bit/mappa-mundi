import assert from "node:assert/strict";
import fs from "node:fs";
import { DAILY_TRAIL_DEBUG_REASONS } from "../src/daily-trail-planner.js";

const requiredReasons = [
  "new",
  "recent-review",
  "weak-review",
  "missed-new-retry",
  "checkpoint",
  "checkpoint-remediation",
  "terminal-review",
  "co-foundation",
  "co-review",
  "unknown"
];

assert.deepEqual(
  Object.values(DAILY_TRAIL_DEBUG_REASONS).sort(),
  [...requiredReasons].sort(),
  "Daily Trail debug reasons must stay stable and complete."
);

const plannerSource = fs.readFileSync(new URL("../src/daily-trail-planner.js", import.meta.url), "utf8");
const runtimeSource = fs.readFileSync(new URL("../src/maplibre-poc.js", import.meta.url), "utf8");

[
  "const ENABLE_DAILY_TRAIL_DEBUG = false;",
  "function logDailyTrailDebug(eventName, details = {})",
  "if (!ENABLE_DAILY_TRAIL_DEBUG || typeof console === \"undefined\")",
  "console.log(`[DailyTrail] ${eventName}`, details);",
  "logDailyTrailDebug(\"planner-session\"",
  "logDailyTrailDebug(\"planner-item\"",
  "function getDailyTrailPlanReasonMap(state, plan = {})",
  "function createDailyTrailPlannerItemDebug(state, item"
].forEach((hook) => assert.ok(plannerSource.includes(hook), `Missing planner debug hook: ${hook}`));

[
  "const ENABLE_DAILY_TRAIL_DEBUG = false;",
  "function logDailyTrailRuntimeDebug(eventName, details = {})",
  "if (!ENABLE_DAILY_TRAIL_DEBUG || typeof console === \"undefined\")",
  "console.log(`[DailyTrail] ${eventName}`, details);",
  "logDailyTrailRuntimeDebug(\"prompt-selected\"",
  "function createDailyTrailPromptSelectedDebug(memoryTrail, selection = {}, stats = null)",
  "function getDailyTrailPromptDebugReason(memoryTrail, selection = {}, stats = {})",
  "DAILY_TRAIL_DEBUG_REASONS.MISSED_NEW_RETRY",
  "DAILY_TRAIL_DEBUG_REASONS.TERMINAL_REVIEW"
].forEach((hook) => assert.ok(runtimeSource.includes(hook), `Missing runtime debug hook: ${hook}`));

const plannerDailyTrailLogs = [...plannerSource.matchAll(/console\.(?:log|debug|info)\(\s*`?\[DailyTrail]/g)];
const runtimeDailyTrailLogs = [...runtimeSource.matchAll(/console\.(?:log|debug|info)\(\s*`?\[DailyTrail]/g)];
assert.equal(plannerDailyTrailLogs.length, 1, "Planner Daily Trail debug logs must be centralized in one guarded helper.");
assert.equal(runtimeDailyTrailLogs.length, 1, "Runtime Daily Trail debug logs must be centralized in one guarded helper.");

console.log("Daily Trail debug logging check passed.");
