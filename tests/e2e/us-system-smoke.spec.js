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

function collectRuntimeErrors(page) {
  const errors = [];
  page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(`console: ${message.text()}`);
  });
  return errors;
}

async function openFreshMainMenu(page) {
  await page.goto("/?test=1");
  await passLaunchScreen(page);
}

test("Across the United States launches Atlas and returns to the expedition", async ({ page }) => {
  const runtimeErrors = collectRuntimeErrors(page);
  await openFreshMainMenu(page);

  await page.locator("#main-menu-us-expedition-button").click();
  await expect(page.locator("#app-shell-title")).toHaveText("Across the United States");
  await expect(page.locator(".expedition-step")).toHaveCount(9);
  await expect(page.locator(".expedition-step.is-recommended h2")).toHaveText("Meet the states by region");

  const atlasStep = page.locator(".expedition-step").filter({ hasText: "Open your U.S. Atlas" });
  await atlasStep.getByRole("button", { name: "Explore" }).click();
  await expect(page.locator("#poc-title")).toHaveAttribute("title", "United States Atlas");
  await expect(page.locator("#united-states-atlas-overview")).toBeVisible();

  await page.locator("#back-button").click();
  await expect(page.locator("#app-shell-title")).toHaveText("Across the United States");
  expect(runtimeErrors).toEqual([]);
});

test("Daily Trail and United States Memory Trail reach guided practice", async ({ page }) => {
  const runtimeErrors = collectRuntimeErrors(page);
  await openFreshMainMenu(page);

  await page.locator("#main-menu-daily-trail-button").click();
  await expect(page.locator("#app-shell-title")).toHaveText("Daily Trail");
  await page.getByRole("button", { name: /BEGIN DAILY TRAIL|CONTINUE DAILY TRAIL/ }).click();
  await expect(page.locator(".memory-trail-panel")).toBeVisible({ timeout: 20_000 });
  await expect(page.locator(".daily-trail-primary-instruction")).toBeVisible();

  await page.addInitScript(() => {
    localStorage.setItem("mappaUnitedStatesMemoryTrailProgress", JSON.stringify({
      version: 2,
      trailId: "united-states-memory-trail",
      curriculumVersion: 2,
      hasStarted: true,
      currentSessionNumber: 3,
      introducedItemIds: ["state:maine"],
      itemProgress: {
        "state:maine": {
          status: "learning",
          memoryState: "relearning",
          timesSeen: 2,
          correctCount: 0,
          correctStreak: 0,
          missCount: 2,
          lapseCount: 2,
          introducedSession: 1,
          lastSeenSession: 1,
          lastReviewedSession: 1,
          dueSession: 2
        }
      }
    }));
  });
  await openFreshMainMenu(page);
  await page.locator("#main-menu-us-memory-trail-button").click();
  await expect(page.locator("#poc-title")).toHaveText("United States", { timeout: 20_000 });
  await expect(page.locator(".memory-trail-panel")).toBeVisible({ timeout: 20_000 });
  await expect(page.locator(".daily-trail-primary-instruction")).toBeVisible();
  await expect.poll(() => page.evaluate(() => window.__MAPPA_TEST_API__.getUnitedStatesMemoryTrailPlan()))
    .toMatchObject({
      sessionType: "learning-session",
      reviewItemIds: expect.arrayContaining(["state:maine"]),
      weakReviewItemIds: ["state:maine"]
    });
  expect(runtimeErrors).toEqual([]);
});

test("U.S. Connections and Mental Map accept retrieval attempts", async ({ page }) => {
  const runtimeErrors = collectRuntimeErrors(page);
  await openFreshMainMenu(page);

  await page.locator("#main-menu-united-states-relationships-button").click();
  await expect(page.locator("#poc-title")).toHaveAttribute("title", "U.S. Connections", { timeout: 20_000 });
  await expect(page.locator("#mental-map-challenge-panel")).toBeVisible();
  await page.locator(".mental-map-answer-choice").first().click();
  await page.getByRole("button", { name: "Submit" }).click();
  await expect(page.locator("body")).toHaveClass(/mental-map-result-mode/);

  await openFreshMainMenu(page);
  await page.locator("#main-menu-mental-map-challenge-button").click();
  await expect(page.locator("#poc-title")).toHaveAttribute("title", "Mental Map Challenge", { timeout: 20_000 });
  await expect(page.locator("#mental-map-challenge-panel")).toBeVisible();
  await expect(page.locator(".mental-map-answer-choice").first()).toBeVisible();
  expect(runtimeErrors).toEqual([]);
});

test("Map Reconstruction loads a regional piece bank", async ({ page }) => {
  const runtimeErrors = collectRuntimeErrors(page);
  await openFreshMainMenu(page);

  await page.locator("#main-menu-map-reconstruction-button").click();
  await expect(page.locator("#poc-title")).toHaveAttribute("title", "Map Reconstruction");
  await expect(page.getByRole("heading", { name: "Choose a region to rebuild" })).toBeVisible();
  await page.locator(".map-reconstruction-region-option").first().click();
  await expect(page.locator(".map-reconstruction-bank-piece").first()).toBeVisible({ timeout: 20_000 });
  expect(runtimeErrors).toEqual([]);
});
