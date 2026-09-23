import { test, expect } from "@playwright/test";

async function startGlobeHub(page) {
  await page.goto("/?test=1&globeNavigation=on");
  await expect(page.locator("#launch-screen")).toBeVisible();
  await page.locator("#launch-start-button").click();
  await page.evaluate(() => window.__mappaMundiLoadApp());
  await expect(page.locator("#globe-navigation-panel")).toBeVisible({ timeout: 20_000 });
}

async function resumeAfterReload(page) {
  await expect(page.locator("#launch-screen")).toBeVisible();
  await page.locator("#launch-start-button").click();
  await page.evaluate(() => window.__mappaMundiLoadApp());
}

async function selectScope(page, label, query = label, scopeId = label.toLowerCase().replaceAll(" ", "-")) {
  const search = page.getByRole("combobox", { name: "Find a place" });
  await search.fill(query);
  await page.locator("#globe-navigation-find-options").getByRole("option", { name: label }).click();
  await expect.poll(() => page.evaluate(() => (
    window.__MAPPA_TEST_API__.getGlobeNavigationState().scopeId
  ))).toBe(scopeId);
}

async function openHubMenu(page) {
  await page.getByRole("button", { name: "Menu", exact: true }).click();
  await expect(page.getByRole("complementary", { name: "Learning menu" })).toBeVisible();
}

async function expectGlobeScope(page, scopeId) {
  await expect(page.locator("#globe-navigation-panel")).toBeVisible({ timeout: 20_000 });
  await expect.poll(() => page.evaluate(() => (
    window.__MAPPA_TEST_API__.getGlobeNavigationState().scopeId
  ))).toBe(scopeId);
}

test("globe hub specialties are scope-aware and return to their exact globe origin", async ({ page }) => {
  await startGlobeHub(page);
  await openHubMenu(page);
  await expect(page.getByRole("button", { name: /Continue Learning/ })).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Explore \/ Atlas/ })).toBeDisabled();
  await page.getByRole("button", { name: /Connections/ }).click();
  await expect(page.locator("#mental-map-challenge-panel")).toBeVisible({ timeout: 20_000 });
  await expect(page.locator("#back-button")).toHaveText("Back to Globe");
  await page.locator("#back-button").click();
  await expectGlobeScope(page, "world");

  await selectScope(page, "United States", "united");
  await openHubMenu(page);
  await page.getByRole("button", { name: /Explore \/ Atlas/ }).click();
  await expect.poll(() => page.evaluate(() => window.__MAPPA_TEST_API__.getGlobeNavigationState().screen))
    .toBe("united-states-atlas");
  await expect(page.locator("#back-button")).toHaveText("Back to Globe");
  await page.locator("#back-button").click();
  await expectGlobeScope(page, "united-states");

  await openHubMenu(page);
  await page.getByRole("button", { name: /Connections/ }).click();
  await expect(page.locator("#mental-map-challenge-panel")).toBeVisible({ timeout: 20_000 });
  expect(await page.evaluate(() => window.__MAPPA_TEST_API__.getMentalMapVisualState().unitedStatesRelationshipsOnly))
    .toBe(true);
  await page.locator("#back-button").click();
  await expectGlobeScope(page, "united-states");

  await openHubMenu(page);
  await page.getByRole("button", { name: /Map Reconstruction/ }).click();
  await expect(page.locator(".map-reconstruction-region-option").first()).toBeVisible({ timeout: 20_000 });
  await expect(page.locator("#back-button")).toHaveText("Back to Globe");
  await page.goBack();
  await expectGlobeScope(page, "united-states");
  await expect(page.locator("#map-reconstruction-panel")).toBeHidden();
  await page.goForward();
  await expect(page.locator(".map-reconstruction-region-option").first()).toBeVisible({ timeout: 20_000 });
  await page.locator("#back-button").click();
  await expectGlobeScope(page, "united-states");

  await openHubMenu(page);
  await page.getByRole("button", { name: /^Progress/ }).click();
  await expect(page.locator("#app-shell-title")).toHaveText("Progress Report");
  await expect(page.locator("#app-shell-back-button")).toHaveText("Back to Globe");
  await page.locator("#app-shell-back-button").click();
  await expectGlobeScope(page, "united-states");

  await selectScope(page, "Europe");
  await openHubMenu(page);
  await expect(page.getByRole("button", { name: /Connections/ })).toBeDisabled();
});

test("browser history and reload restore globe destinations without storing learning state", async ({ page }) => {
  await startGlobeHub(page);
  await selectScope(page, "United States", "united");
  await openHubMenu(page);
  await page.getByRole("button", { name: /Explore \/ Atlas/ }).click();
  await expect.poll(() => page.evaluate(() => window.__MAPPA_TEST_API__.getGlobeNavigationState().screen))
    .toBe("united-states-atlas");

  const historySnapshot = await page.evaluate(() => history.state.mappaMundiGlobeHub);
  expect(historySnapshot).toEqual({
    version: 1,
    surface: "destination",
    globeScopeId: "united-states",
    destinationId: "atlas:united-states",
    returnScopeId: "united-states"
  });
  expect(Object.keys(historySnapshot)).toEqual([
    "version", "surface", "globeScopeId", "destinationId", "returnScopeId"
  ]);

  await page.goBack();
  await expectGlobeScope(page, "united-states");
  await page.goForward();
  await expect.poll(() => page.evaluate(() => window.__MAPPA_TEST_API__.getGlobeNavigationState().screen))
    .toBe("united-states-atlas");

  await page.reload();
  await resumeAfterReload(page);
  await expect.poll(() => page.evaluate(() => window.__MAPPA_TEST_API__.getGlobeNavigationState().screen))
    .toBe("united-states-atlas");
  await page.locator("#back-button").click();
  await expectGlobeScope(page, "united-states");

  await page.reload();
  await resumeAfterReload(page);
  await expectGlobeScope(page, "united-states");

  await page.evaluate(() => history.replaceState({
    mappaMundiGlobeHub: {
      version: 1,
      surface: "destination",
      globeScopeId: "united-states",
      destinationId: "removed:destination",
      returnScopeId: "united-states"
    }
  }, ""));
  await page.reload();
  await resumeAfterReload(page);
  await expectGlobeScope(page, "world");
});

test("Continue Learning appears only after resumable Guided progress and restores it", async ({ page }) => {
  await startGlobeHub(page);
  await openHubMenu(page);
  await expect(page.getByRole("button", { name: /Continue Learning/ })).toHaveCount(0);
  await page.getByRole("button", { name: "Close", exact: true }).click();

  await selectScope(page, "United States", "united");
  await page.getByRole("button", { name: /Learn the United States/ }).click();
  await expect.poll(
    () => page.evaluate(() => window.__MAPPA_TEST_API__.getCurrentActivity()?.id),
    { timeout: 20_000 }
  ).toBe("us-states-01");
  const promptTargetId = await page.evaluate(() => (
    window.__MAPPA_TEST_API__.getActiveMemoryTrailState().currentPromptTargetId
  ));

  await page.goBack();
  await expectGlobeScope(page, "united-states");
  await openHubMenu(page);
  const continueButton = page.getByRole("button", { name: /Continue Learning/ });
  await expect(continueButton).toBeVisible();
  await expect(continueButton).toContainText("United States Guided Learning");
  await continueButton.click();
  await expect.poll(
    () => page.evaluate(() => window.__MAPPA_TEST_API__.getCurrentActivity()?.id),
    { timeout: 20_000 }
  ).toBe("us-states-01");
  expect(await page.evaluate(() => (
    window.__MAPPA_TEST_API__.getActiveMemoryTrailState().currentPromptTargetId
  ))).toBe(promptTargetId);
  await expect(page.locator("#app-shell-title")).not.toHaveText("Across the United States");
});

test("Continue Learning falls back to a valid incomplete regional Journey", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("atlasQuestProgress", JSON.stringify({
      version: 1,
      activeJourneyId: "europe",
      activeStepIndex: 1,
      activeDifficulty: "easy",
      recentJourneyId: "europe",
      recentDifficulty: "easy",
      journeys: {
        europe: {
          currentStepIndex: 1,
          completedSteps: { "western-european-countries": { easy: true } },
          completedDifficulties: { easy: false, medium: false, hard: false }
        }
      }
    }));
  });
  await startGlobeHub(page);
  await openHubMenu(page);
  const continueButton = page.getByRole("button", { name: /Continue Learning/ });
  await expect(continueButton).toContainText("Resume Europe");
  await continueButton.click();
  await expect.poll(
    () => page.evaluate(() => window.__MAPPA_TEST_API__.getCurrentActivity()?.id),
    { timeout: 20_000 }
  ).toBe("nordic-countries");
  expect(await page.evaluate(() => window.__MAPPA_TEST_API__.getCurrentJourney()?.id)).toBe("europe");
  await expect(page.locator("#back-button")).toHaveText("Back to Globe");
  await page.locator("#back-button").click();
  await expectGlobeScope(page, "world");
  await openHubMenu(page);
  await expect(page.getByRole("button", { name: /Continue Learning/ })).toContainText("Resume Europe");
});
