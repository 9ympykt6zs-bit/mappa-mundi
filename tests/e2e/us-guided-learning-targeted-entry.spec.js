import { expect, test } from "@playwright/test";

async function openFreshRuntime(page) {
  await page.goto("/?test=1&globeNavigation=off");
  await page.locator("#launch-start-button").click();
  await page.evaluate(() => window.__mappaMundiLoadApp());
  if (await page.locator("#launch-screen").isVisible()) {
    await page.locator("#launch-start-button").click();
  }
  await expect(page.locator("#app-shell-title")).toHaveText("Main Menu");
}

test("targeted Guided Learning opens an eligible authored state section", async ({ page }) => {
  await openFreshRuntime(page);
  await page.evaluate(() => window.__MAPPA_TEST_API__.startUnitedStatesGuidedLearningAtSection("us-states-03"));

  await expect.poll(() => page.evaluate(() => window.__MAPPA_TEST_API__.getCurrentActivity()?.id), {
    timeout: 20_000
  }).toBe("us-states-03");
  await expect(page.locator(".memory-trail-panel")).toBeVisible();
  await expect.poll(() => page.evaluate(() => window.__MAPPA_TEST_API__.getUnitedStatesMemoryTrailPlan()))
    .toMatchObject({
      activeSectionId: "us-states-03",
      targetedEntry: {
        requestedSectionId: "us-states-03",
        resolvedSectionId: "us-states-03",
        accepted: true,
        fallbackReason: null
      }
    });
});

test("invalid or prerequisite-blocked targets fall back to normal Guided Learning", async ({ page }) => {
  await openFreshRuntime(page);
  await page.evaluate(() => window.__MAPPA_TEST_API__.startUnitedStatesGuidedLearningAtSection("us-capitals-03"));

  await expect.poll(() => page.evaluate(() => window.__MAPPA_TEST_API__.getCurrentActivity()?.id), {
    timeout: 20_000
  }).toBe("us-states-01");
  await expect(page.locator(".memory-trail-panel")).toBeVisible();
  const plan = await page.evaluate(() => window.__MAPPA_TEST_API__.getUnitedStatesMemoryTrailPlan());
  expect(plan.targetedEntry).toMatchObject({
    requestedSectionId: "us-capitals-03",
    resolvedSectionId: "us-states-01",
    accepted: false,
    fallbackReason: "requested-section-ineligible"
  });
  expect(plan.newItemIds.every((id) => id.startsWith("state:"))).toBe(true);
});
