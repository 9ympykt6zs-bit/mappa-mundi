import { expect, test } from "@playwright/test";

async function passLaunchScreen(page) {
  await expect(page.locator("#launch-screen")).toBeVisible();
  const startButton = page.locator("#launch-start-button");
  await startButton.click();
  await page.evaluate(() => window.__mappaMundiLoadApp());
  if (await page.locator("#launch-screen").isVisible()) {
    await startButton.click();
  }
  await expect(page.locator("#app-shell-screen")).toBeVisible();
  await expect(page.locator("#app-shell-title")).toHaveText("Main Menu");
}

async function startUnitedStatesJourney(page, difficulty = "medium") {
  const moreWaysButton = page.getByRole("button", { name: "More Ways to Learn" });
  await expect(moreWaysButton).toBeVisible();
  await expect(moreWaysButton).toBeEnabled();
  await moreWaysButton.click();
  await page.getByRole("button", { name: /Challenge Yourself/ }).click();
  await page.locator('[data-journey-id="united-states"]').first().click();

  await expect(page.locator("#app-shell-title")).toHaveText("United States");
  await page.getByRole("button", { name: "Choose Difficulty" }).click();
  await page.locator(`[data-difficulty-id="${difficulty}"]`).click();
  await page.getByRole("button", { name: "Start Journey" }).click();

  const recommendation = page.locator("#memory-trail-overlay");
  await expect(recommendation).toBeVisible();
  await recommendation.getByRole("button", { name: "Play Now" }).click();
  await expect.poll(() => page.evaluate(() => window.__MAPPA_TEST_API__?.getCurrentActivity())).not.toBeNull();
}

async function getUnitedStatesProgress(page) {
  return page.evaluate(() => {
    const saved = window.__MAPPA_TEST_API__.getSavedJourneyProgress();
    const journey = saved.journeys?.["united-states"];
    const completedMediumStepIds = Object.entries(journey?.completedSteps || {})
      .filter(([, difficulties]) => difficulties.medium)
      .map(([stepId]) => stepId)
      .sort();
    return {
      activeJourneyId: saved.activeJourneyId,
      activeStepIndex: saved.activeStepIndex,
      activeDifficulty: saved.activeDifficulty,
      journeyStepIndex: journey?.currentStepIndex,
      completedMediumStepIds
    };
  });
}

test("United States Journey saves its first activity and advances", async ({ page }) => {
  await page.goto("/?test=1");
  await passLaunchScreen(page);
  await startUnitedStatesJourney(page);
  const recommendation = page.locator("#memory-trail-overlay");
  const firstActivity = await page.evaluate(() => window.__MAPPA_TEST_API__.getCurrentActivity());
  const currentJourney = await page.evaluate(() => window.__MAPPA_TEST_API__.getCurrentJourney());
  const firstStep = await page.evaluate(() => window.__MAPPA_TEST_API__.getCurrentJourneyStep());
  const targets = await page.evaluate(() => window.__MAPPA_TEST_API__.getCorrectTargets());

  expect(firstActivity.id).toBe("us-states-01");
  expect(currentJourney).toMatchObject({ id: "united-states", difficulty: "medium" });
  expect(firstActivity.targetCount).toBeGreaterThan(0);
  expect(firstStep).toMatchObject({ index: 0, id: "us-states-01" });
  expect(targets.length).toBe(firstActivity.targetCount);
  expect(targets.every((target) => target.id && target.name)).toBe(true);

  await page.evaluate(() => window.__MAPPA_TEST_API__.completeCurrentActivity());

  await expect.poll(() => page.evaluate(() => {
    const saved = window.__MAPPA_TEST_API__.getSavedJourneyProgress();
    return saved.journeys?.["united-states"]?.completedSteps?.["us-states-01"]?.medium;
  })).toBe(true);
  await expect.poll(() => page.evaluate(() => window.__MAPPA_TEST_API__.getCurrentJourneyStep()?.index)).toBe(1);
  await expect(recommendation).toBeVisible();
  await recommendation.getByRole("button", { name: "Play Now" }).click();
  await expect.poll(
    () => page.evaluate(() => window.__MAPPA_TEST_API__.getCurrentActivity()?.id),
    { timeout: 20_000 }
  ).toBe("us-states-02");

  const secondActivity = await page.evaluate(() => window.__MAPPA_TEST_API__.getCurrentActivity());
  const secondStep = await page.evaluate(() => window.__MAPPA_TEST_API__.getCurrentJourneyStep());
  expect(secondActivity.id).toBe("us-states-02");
  expect(secondActivity.id).not.toBe(firstActivity.id);
  expect(secondStep).toMatchObject({ index: 1, id: "us-states-02" });
});

test("United States Journey resumes activity two after a full reload", async ({ page }) => {
  await page.goto("/?test=1");
  await passLaunchScreen(page);
  await startUnitedStatesJourney(page, "medium");

  const firstActivity = await page.evaluate(() => window.__MAPPA_TEST_API__.getCurrentActivity());
  expect(firstActivity.id).toBe("us-states-01");
  await page.evaluate(() => window.__MAPPA_TEST_API__.completeCurrentActivity());

  await expect.poll(() => getUnitedStatesProgress(page)).toEqual({
    activeJourneyId: "united-states",
    activeStepIndex: 1,
    activeDifficulty: "medium",
    journeyStepIndex: 1,
    completedMediumStepIds: ["us-states-01"]
  });

  await page.reload();
  await passLaunchScreen(page);

  await page.getByRole("button", { name: "More Ways to Learn" }).click();
  await page.getByRole("button", { name: /Challenge Yourself/ }).click();
  await expect(page.locator("#app-shell-title")).toHaveText("Challenge Yourself");

  const continueCard = page.locator("#main-menu-quick-start-button");
  await expect(page.locator("#quick-start-kicker")).toHaveText("Continue Journey");
  await expect(page.locator("#quick-start-title")).toHaveText("United States");
  await expect(page.locator("#quick-start-detail")).toContainText("Northeast / Mid-Atlantic States");
  await expect(page.locator("#quick-start-meta")).toHaveText("Difficulty: Medium");
  await continueCard.click();

  await expect.poll(
    () => page.evaluate(() => window.__MAPPA_TEST_API__.getCurrentActivity()?.id),
    { timeout: 20_000 }
  ).toBe("us-states-02");

  const resumedActivity = await page.evaluate(() => window.__MAPPA_TEST_API__.getCurrentActivity());
  const resumedJourney = await page.evaluate(() => window.__MAPPA_TEST_API__.getCurrentJourney());
  const resumedStep = await page.evaluate(() => window.__MAPPA_TEST_API__.getCurrentJourneyStep());
  expect(resumedActivity.id).not.toBe(firstActivity.id);
  expect(resumedJourney).toMatchObject({ id: "united-states", difficulty: "medium" });
  expect(resumedStep).toMatchObject({ index: 1, id: "us-states-02" });
  expect(await getUnitedStatesProgress(page)).toEqual({
    activeJourneyId: "united-states",
    activeStepIndex: 1,
    activeDifficulty: "medium",
    journeyStepIndex: 1,
    completedMediumStepIds: ["us-states-01"]
  });

  await page.evaluate(() => window.__MAPPA_TEST_API__.completeCurrentActivity());
  await expect.poll(() => getUnitedStatesProgress(page)).toEqual({
    activeJourneyId: "united-states",
    activeStepIndex: 2,
    activeDifficulty: "medium",
    journeyStepIndex: 2,
    completedMediumStepIds: ["us-states-01", "us-states-02"]
  });

  const recommendation = page.locator("#memory-trail-overlay");
  await expect.poll(() => page.evaluate(() => window.__MAPPA_TEST_API__.getCurrentJourneyStep()?.index)).toBe(2);
  await expect(recommendation).toBeVisible();
  await recommendation.getByRole("button", { name: "Play Now" }).click();
  await expect.poll(
    () => page.evaluate(() => window.__MAPPA_TEST_API__.getCurrentActivity()?.id),
    { timeout: 20_000 }
  ).toBe("us-states-03");

  const thirdActivity = await page.evaluate(() => window.__MAPPA_TEST_API__.getCurrentActivity());
  expect(thirdActivity.id).not.toBe(resumedActivity.id);
  expect(await getUnitedStatesProgress(page)).toEqual({
    activeJourneyId: "united-states",
    activeStepIndex: 2,
    activeDifficulty: "medium",
    journeyStepIndex: 2,
    completedMediumStepIds: ["us-states-01", "us-states-02"]
  });
});

test("test API is absent without local test mode", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => window.__mappaMundiLoadApp());
  await expect.poll(() => page.evaluate(() => "__MAPPA_TEST_API__" in window)).toBe(false);
});
