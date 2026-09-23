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
  "utah", "arizona", "nevada", "california",
  "montana", "idaho", "washington", "oregon", "alaska", "hawaii"
];
const learnedCapitalIds = [
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

function progress(index) {
  return {
    status: "review",
    memoryState: "review",
    timesSeen: 3,
    correctCount: 3,
    correctStreak: 2,
    missCount: 0,
    lapseCount: 0,
    introducedSession: 1,
    lastSeenSession: index + 1,
    lastReviewedSession: index + 1,
    dueSession: 2
  };
}

function createCompletedStateCurriculum() {
  const itemIds = [
    ...stateIds.map((id) => `state:${id}`),
    ...learnedCapitalIds.map((id) => `capital:${id}`)
  ];
  return {
    version: 2,
    trailId: "united-states-memory-trail",
    curriculumVersion: 2,
    hasStarted: true,
    currentSessionNumber: 18,
    currentCategory: "states",
    introducedItemIds: itemIds,
    itemProgress: Object.fromEntries(itemIds.map((id, index) => [id, progress(index)])),
    guidedCoreCapstone: { status: "completed", targetOrder: [] }
  };
}

async function openMainMenu(page, { orchestrationState = null } = {}) {
  await page.addInitScript(({ trailKey, trailState, orchestrationKey, guidedState }) => {
    if (!localStorage.getItem(trailKey)) localStorage.setItem(trailKey, JSON.stringify(trailState));
    if (guidedState && !localStorage.getItem(orchestrationKey)) {
      localStorage.setItem(orchestrationKey, JSON.stringify(guidedState));
    }
  }, {
    trailKey: unitedStatesMemoryTrailStorageKey,
    trailState: createCompletedStateCurriculum(),
    orchestrationKey: GUIDED_LEARNING_ORCHESTRATION_STORAGE_KEY,
    guidedState: {
      ...(orchestrationState || {}),
      version: 6,
      completedBlockIds: [...new Set([
        ...getUnitedStatesGuidedCoreRequiredBlockIds(UNITED_STATES_GUIDED_LEARNING_ORCHESTRATION_V1),
        ...(orchestrationState?.completedBlockIds || [])
      ])]
    }
  });
  await page.goto("/?test=1&globeNavigation=off");
  await page.locator("#launch-start-button").click();
  await page.evaluate(() => window.__mappaMundiLoadApp());
  if (await page.locator("#launch-screen").isVisible()) {
    await page.locator("#launch-start-button").click();
  }
  await expect(page.locator("#app-shell-title")).toHaveText("Main Menu");
}

async function openChoice(page) {
  await page.locator("#main-menu-us-memory-trail-button").click();
  await expect(page.getByRole("heading", { name: "Your U.S. learning map is ready" })).toBeVisible();
}

test("state completion opens a reusable choice and Mixed Review stays learned and balanced", async ({ page }, testInfo) => {
  await openMainMenu(page);
  await openChoice(page);
  await expect(page.locator(".daily-trail-goal-option")).toHaveCount(3);
  await expect(page.getByRole("button", { name: /Mixed U\.S\. Review/ })).toContainText("states and capitals");
  await expect(page.getByRole("button", { name: /Physical Geography/ })).toBeDisabled();
  await expect(page.getByRole("button", { name: /Map Reconstruction/ })).toBeEnabled();
  await page.screenshot({ path: testInfo.outputPath("post-state-curriculum-choice.png"), fullPage: true });

  await page.reload();
  await page.locator("#launch-start-button").click();
  await page.evaluate(() => window.__mappaMundiLoadApp());
  if (await page.locator("#launch-screen").isVisible()) {
    await page.locator("#launch-start-button").click();
  }
  await openChoice(page);
  await page.getByRole("button", { name: /Mixed U\.S\. Review/ }).click();
  await expect(page.locator(".memory-trail-panel")).toBeVisible({ timeout: 20_000 });
  await expect.poll(() => page.evaluate(() => window.__MAPPA_TEST_API__.getUnitedStatesMemoryTrailPlan()))
    .toMatchObject({
      sessionType: "post-state-curriculum-review",
      newItemIds: [],
      postStateCurriculum: {
        learnedOnly: true,
        selectedStateCount: 5,
        selectedCapitalCount: 5
      }
    });
  const plan = await page.evaluate(() => window.__MAPPA_TEST_API__.getUnitedStatesMemoryTrailPlan());
  expect(plan.reviewItemIds.every((id) => id.startsWith("state:") || learnedCapitalIds.some((capitalId) => id === `capital:${capitalId}`))).toBe(true);
});

test("repeatable Reconstruction reloads and returns to the choice screen", async ({ page }) => {
  const completedCheckpointIds = UNITED_STATES_GUIDED_LEARNING_ORCHESTRATION_V1.blocks
    .filter(({ type }) => type === "reconstruction-checkpoint")
    .map(({ id }) => id);
  await openMainMenu(page, {
    orchestrationState: { version: 6, completedBlockIds: completedCheckpointIds }
  });
  await openChoice(page);
  await page.getByRole("button", { name: /Map Reconstruction/ }).click();
  await expect(page.locator('[data-map-reconstruction-region-id="guided-reconstruct-us-states-10"]')).toBeVisible({ timeout: 20_000 });

  await page.reload();
  await page.locator("#launch-start-button").click();
  await page.evaluate(() => window.__mappaMundiLoadApp());
  if (await page.locator("#launch-screen").isVisible()) {
    await page.locator("#launch-start-button").click();
  }
  await page.locator("#main-menu-us-memory-trail-button").click();
  await expect(page.locator('[data-map-reconstruction-region-id="guided-reconstruct-us-states-10"]')).toBeVisible({ timeout: 20_000 });
  await page.locator("#back-button").click();
  await expect(page.getByRole("heading", { name: "Your U.S. learning map is ready" })).toBeVisible();
});

test("Physical Geography launches only an introduced due review and returns to the choice", async ({ page }) => {
  const config = UNITED_STATES_GUIDED_LEARNING_ORCHESTRATION_V1;
  const pool = config.physicalReviewPools[0];
  const features = new Map(config.physicalFeatures.map((feature) => [feature.targetId, feature]));
  const guidedState = {
    version: 6,
    completedBlockIds: pool.targetIds.map((targetId) => features.get(targetId).introductionBlockId),
    guidedLearningEventCount: 5,
    physicalReviewProgress: {
      [pool.id]: {
        cohortId: pool.id,
        generation: 1,
        previousOrder: [],
        previousTargetIds: [],
        targets: Object.fromEntries(pool.targetIds.map((targetId) => [targetId, {
          targetId,
          lastLearningEvent: 1,
          dueAfterLearningEvent: 3,
          lastOutcome: "correct",
          priority: "later"
        }]))
      }
    }
  };
  await openMainMenu(page, { orchestrationState: guidedState });
  await openChoice(page);
  await page.getByRole("button", { name: /Physical Geography/ }).click();
  await expect(page.locator(".memory-trail-panel")).toBeVisible({ timeout: 20_000 });
  const targetIds = await page.evaluate(() => window.__MAPPA_TEST_API__.getActiveMemoryTrailState()?.targetPoolIds || []);
  expect(targetIds.length).toBeGreaterThanOrEqual(3);
  expect(targetIds.every((targetId) => pool.targetIds.includes(targetId))).toBe(true);
  for (let attempt = 0; attempt < 14; attempt += 1) {
    if (await page.getByRole("heading", { name: "United States session complete" }).isVisible()) break;
    await expect.poll(() => page.evaluate(() => (
      window.__MAPPA_TEST_API__.getActiveMemoryTrailState()?.phase
    ))).toBe("answering");
    expect(await page.evaluate(() => window.__MAPPA_TEST_API__.answerActiveMemoryTrailCorrectly())).toBe(true);
    await page.waitForTimeout(700);
  }
  await expect(page.getByRole("heading", { name: "United States session complete" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Keep Going" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Finish" })).toBeVisible();
  await page.getByRole("button", { name: "Keep Going" }).click();
  await expect(page.getByRole("heading", { name: "Your U.S. learning map is ready" })).toBeVisible({ timeout: 20_000 });
});
