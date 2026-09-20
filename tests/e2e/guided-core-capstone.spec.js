import { expect, test } from "@playwright/test";
import { unitedStatesMemoryTrailStorageKey } from "../../src/united-states-memory-trail-planner.js";
import {
  GUIDED_LEARNING_ORCHESTRATION_STORAGE_KEY,
  UNITED_STATES_GUIDED_LEARNING_ORCHESTRATION_V1
} from "../../src/guided-learning-orchestration.js";
import { getUnitedStatesGuidedCoreRequiredBlockIds } from "../../src/united-states-guided-core-capstone.js";

const stateIds = [
  "maine", "new-hampshire", "massachusetts", "rhode-island", "connecticut",
  "vermont", "new-york", "new-jersey", "pennsylvania", "delaware",
  "maryland", "virginia", "west-virginia", "north-carolina", "south-carolina",
  "georgia", "florida", "alabama", "mississippi", "louisiana",
  "michigan", "ohio", "indiana", "kentucky", "tennessee",
  "wisconsin", "illinois", "iowa", "missouri", "arkansas",
  "minnesota", "north-dakota", "south-dakota", "wyoming", "nebraska",
  "kansas", "oklahoma", "texas", "colorado", "new-mexico",
  "utah", "arizona", "nevada", "california", "montana", "idaho",
  "washington", "oregon", "alaska", "hawaii"
];
const capitalIds = [
  "augusta-me", "concord-nh", "boston-ma", "providence-ri", "hartford-ct",
  "montpelier-vt", "albany-ny", "trenton-nj", "harrisburg-pa", "dover-de",
  "annapolis-md", "richmond-va", "charleston-wv", "raleigh-nc", "columbia-sc",
  "atlanta-ga", "tallahassee-fl", "montgomery-al", "jackson-ms", "baton-rouge-la",
  "lansing-mi", "columbus-oh", "indianapolis-in", "frankfort-ky", "nashville-tn",
  "madison-wi", "springfield-il", "des-moines-ia", "jefferson-city-mo", "little-rock-ar",
  "st-paul-mn", "bismarck-nd", "pierre-sd", "cheyenne-wy", "lincoln-ne",
  "topeka-ks", "oklahoma-city-ok", "austin-tx", "denver-co", "santa-fe-nm",
  "salt-lake-city-ut", "phoenix-az", "carson-city-nv", "sacramento-ca",
  "helena-mt", "boise-id", "olympia-wa", "salem-or", "juneau-ak", "honolulu-hi"
];

function progress() {
  return { status: "review", memoryState: "review", timesSeen: 2, correctCount: 2, correctStreak: 2, dueSession: 50 };
}

function createTrailState({ includeCapitals = true } = {}) {
  const itemIds = [
    ...stateIds.map((id) => `state:${id}`),
    ...(includeCapitals ? capitalIds.map((id) => `capital:${id}`) : [])
  ];
  return {
    version: 2,
    trailId: "united-states-memory-trail",
    curriculumVersion: 2,
    hasStarted: true,
    currentSessionNumber: 50,
    introducedItemIds: itemIds,
    itemProgress: Object.fromEntries(itemIds.map((id) => [id, progress()]))
  };
}

async function openGuided(page, { includeCapitals = true } = {}) {
  const requiredBlockIds = getUnitedStatesGuidedCoreRequiredBlockIds(UNITED_STATES_GUIDED_LEARNING_ORCHESTRATION_V1);
  await page.addInitScript(({ trailKey, trailState, orchestrationKey, completedBlockIds }) => {
    if (!localStorage.getItem(trailKey)) localStorage.setItem(trailKey, JSON.stringify(trailState));
    if (!localStorage.getItem(orchestrationKey)) {
      localStorage.setItem(orchestrationKey, JSON.stringify({ version: 6, completedBlockIds }));
    }
  }, {
    trailKey: unitedStatesMemoryTrailStorageKey,
    trailState: createTrailState({ includeCapitals }),
    orchestrationKey: GUIDED_LEARNING_ORCHESTRATION_STORAGE_KEY,
    completedBlockIds: requiredBlockIds
  });
  await page.goto("/?test=1&globeNavigation=off");
  await page.locator("#launch-start-button").click();
  await page.evaluate(() => window.__mappaMundiLoadApp());
  if (await page.locator("#launch-screen").isVisible()) await page.locator("#launch-start-button").click();
  await page.locator("#main-menu-us-memory-trail-button").click();
}

test("all states alone cannot bypass required capital introductions", async ({ page }) => {
  await openGuided(page, { includeCapitals: false });
  await expect.poll(() => page.evaluate(() => window.__MAPPA_TEST_API__.getUnitedStatesGuidedCoreStatus().coreComplete)).toBe(false);
  await expect(page.getByRole("heading", { name: "Your U.S. learning map is ready" })).toBeHidden();
  await expect.poll(() => page.evaluate(() => window.__MAPPA_TEST_API__.getUnitedStatesMemoryTrailPlan()?.sessionType || ""))
    .not.toBe("guided-core-capstone");
});

test("final U.S. capstone persists ten fixed questions and opens the durable choice @us-critical-path", async ({ page }) => {
  await openGuided(page);
  await expect(page.locator(".memory-trail-panel")).toBeVisible({ timeout: 20_000 });
  const plan = await page.evaluate(() => window.__MAPPA_TEST_API__.getUnitedStatesMemoryTrailPlan());
  expect(plan.sessionType).toBe("guided-core-capstone");
  expect(plan.capstone.questionCount).toBe(10);
  expect(plan.capstone.categoryCounts).toEqual({ state: 4, capital: 3, physical: 3 });
  expect(plan.capstone.physicalFamilyCounts).toEqual({ river: 1, lake: 1, "mountain-range": 1 });
  expect(new Set(plan.capstone.targetOrder).size).toBe(10);
  const initialMemoryTrail = await page.evaluate(() => window.__MAPPA_TEST_API__.getActiveMemoryTrailState());
  expect(initialMemoryTrail.guidedCoreCapstone).toBe(true);
  expect(new Set(initialMemoryTrail.targetPoolIds)).toEqual(new Set(plan.capstone.targetOrder));
  expect(initialMemoryTrail.guidedCoreCapstoneTargetQueue).toEqual(plan.capstone.targetOrder);
  expect(UNITED_STATES_GUIDED_LEARNING_ORCHESTRATION_V1.physicalFeatures.every(({ targetId }) => (
    initialMemoryTrail.renderedActivityTargetIds.includes(targetId)
  ))).toBe(true);

  await page.evaluate(() => window.__MAPPA_TEST_API__.answerActiveMemoryTrailIncorrectly());
  await expect.poll(() => page.evaluate(() => window.__MAPPA_TEST_API__.getActiveMemoryTrailState()?.phase || "")).toBe("correction");
  await page.evaluate(() => window.__MAPPA_TEST_API__.completeActiveMemoryTrailCorrection());
  await expect.poll(() => page.evaluate(() => window.__MAPPA_TEST_API__.getActiveMemoryTrailState()?.promptCount || 0), { timeout: 12_000 }).toBe(1);
  const firstOrder = plan.capstone.targetOrder;

  await page.reload();
  await page.locator("#launch-start-button").click();
  await page.evaluate(() => window.__mappaMundiLoadApp());
  if (await page.locator("#launch-screen").isVisible()) await page.locator("#launch-start-button").click();
  await page.locator("#main-menu-us-memory-trail-button").click();
  await expect.poll(() => page.evaluate(() => window.__MAPPA_TEST_API__.getUnitedStatesMemoryTrailPlan()?.capstone?.targetOrder || []))
    .toEqual(firstOrder);
  await expect.poll(() => page.evaluate(() => window.__MAPPA_TEST_API__.getActiveMemoryTrailState()?.promptCount || 0)).toBe(1);
  await expect.poll(() => page.evaluate(() => window.__MAPPA_TEST_API__.getActiveMemoryTrailState()?.currentPromptType || ""))
    .toBe("place_to_name");

  for (let answered = 1; answered < 10; answered += 1) {
    await expect.poll(() => page.evaluate(() => window.__MAPPA_TEST_API__.getActiveMemoryTrailState()?.phase || ""), { timeout: 12_000 }).toBe("answering");
    await page.evaluate(() => window.__MAPPA_TEST_API__.answerActiveMemoryTrailCorrectly());
    if (answered < 9) {
      await expect.poll(() => page.evaluate(() => window.__MAPPA_TEST_API__.getActiveMemoryTrailState()?.promptCount || 0), { timeout: 12_000 })
        .toBe(answered + 1);
    }
  }

  await expect(page.getByRole("heading", { name: "Your U.S. learning map is ready" })).toBeVisible({ timeout: 20_000 });
  await expect(page.locator(".daily-trail-goal-option")).toHaveCount(3);
  await expect.poll(() => page.evaluate(() => window.__MAPPA_TEST_API__.getUnitedStatesGuidedCoreStatus()))
    .toMatchObject({ coreComplete: true, capstoneComplete: true, mode: "post-state-curriculum" });
  const capstoneEvidence = await page.evaluate(() => {
    const repository = JSON.parse(localStorage.getItem("mappaMundiCanonicalEvidence") || "null");
    return (repository?.events || []).filter((event) => event?.sourceMode === "us-memory-trail"
      && String(event?.sessionId || "").startsWith("us-guided-core-capstone"));
  });
  expect(capstoneEvidence).toHaveLength(10);
  expect(capstoneEvidence.filter((event) => event.outcome === "incorrect")).toHaveLength(1);
  expect(new Set(capstoneEvidence.map((event) => event.conceptId.split(":")[0]))).toEqual(new Set([
    "state-location", "capital-naming", "river-location", "lake-location", "mountain-range-location"
  ]));

  await page.reload();
  await page.locator("#launch-start-button").click();
  await page.evaluate(() => window.__mappaMundiLoadApp());
  if (await page.locator("#launch-screen").isVisible()) await page.locator("#launch-start-button").click();
  await page.locator("#main-menu-us-memory-trail-button").click();
  await expect(page.getByRole("heading", { name: "Your U.S. learning map is ready" })).toBeVisible({ timeout: 20_000 });
  await page.getByRole("button", { name: /Mixed U\.S\. Review/ }).click();
  await expect(page.locator(".memory-trail-panel")).toBeVisible({ timeout: 20_000 });
  await expect.poll(() => page.evaluate(() => (
    window.__MAPPA_TEST_API__.getUnitedStatesMemoryTrailPlan()?.sessionType || ""
  ))).toBe("post-state-curriculum-review");
});
