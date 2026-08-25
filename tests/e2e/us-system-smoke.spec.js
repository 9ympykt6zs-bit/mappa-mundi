import { expect, test } from "@playwright/test";
import { learningProgressStorageKeys } from "../../src/learning-progress-reset.js";

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

async function openResetSettings(page) {
  await page.locator("#app-shell-settings-gear").click();
  await expect(page.locator("#app-shell-title")).toHaveText("Settings");
  await page.getByRole("button", { name: "Customize" }).click();
  await expect(page.locator("#app-shell-title")).toHaveText("Customize");
  await page.locator('details[data-settings-key="reset-defaults"] > summary').click();
}

test("Across the United States presents four open learning objectives", async ({ page }, testInfo) => {
  const runtimeErrors = collectRuntimeErrors(page);
  await openFreshMainMenu(page);

  await page.locator("#main-menu-us-expedition-button").click();
  await expect(page.locator("#app-shell-title")).toHaveText("Across the United States");
  await expect(page.locator("#app-shell-subtitle")).toHaveText("Learn the map. Use the map.");
  await expect(page.locator(".expedition-step")).toHaveCount(0);
  await expect(page.locator(".us-objective-card")).toHaveCount(4);
  await expect(page.locator(".us-objective-title")).toHaveText([
    "Learn States & Capitals",
    "Learn Physical Features",
    "Learn Connections",
    "Explore the United States"
  ]);
  await expect(page.locator(".us-objective-card:disabled")).toHaveCount(0);
  await expect(page.locator(".us-expedition-recommendation h2")).toHaveText("Learn state locations & names");
  await expect(page.getByText("All learning areas are open")).toBeVisible();
  await expect(page.getByText("Show What I Know", { exact: true })).toHaveCount(0);

  const physicalObjective = page.getByRole("button", { name: /Learn Physical Features/ });
  const physicalDescription = physicalObjective.locator(".us-objective-mobile-description");
  if (testInfo.project.name.includes("mobile")) {
    await expect(physicalDescription).toBeVisible();
    const overflow = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth
    }));
    expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth);
  } else {
    await expect(physicalDescription).toBeHidden();
    await physicalObjective.hover();
    await expect(page.locator(".us-objective-detail")).toContainText("Learn the mountains, rivers, lakes, and coasts that shape the United States.");
    await page.getByRole("button", { name: /Learn Connections/ }).focus();
    await expect(page.locator(".us-objective-detail")).toContainText("See how states, capitals, borders, rivers, mountains, and other places relate to one another.");
  }

  await page.getByRole("button", { name: "Explore the U.S. Atlas" }).click();
  await expect(page.locator("#poc-title")).toHaveAttribute("title", "United States Atlas");
  await expect(page.locator("#united-states-atlas-overview")).toBeVisible();

  await page.locator("#back-button").click();
  await expect(page.locator("#app-shell-title")).toHaveText("Across the United States");
  await expect(page.locator(".us-objective-card")).toHaveCount(4);
  expect(runtimeErrors).toEqual([]);
});

test("Across the United States submenus preserve activity return context", async ({ page }) => {
  const runtimeErrors = collectRuntimeErrors(page);
  await openFreshMainMenu(page);
  await page.locator("#main-menu-us-expedition-button").click();

  await page.getByRole("button", { name: /Learn States & Capitals/ }).click();
  await expect(page.locator(".us-objective-intro h2")).toHaveText("Learn States & Capitals");
  const stateActivities = page.locator(".us-objective-activity");
  await expect(stateActivities.filter({ hasText: "Learn state locations & names" })).toBeEnabled();
  await expect(stateActivities.filter({ hasText: "Learn state capitals" })).toBeEnabled();
  await expect(stateActivities.filter({ hasText: "Build a regional map" })).toBeEnabled();
  await expect(stateActivities.filter({ hasText: "Practice states & capitals" })).toBeEnabled();

  await stateActivities.filter({ hasText: "Learn state capitals" }).click();
  await expect(page.locator("#app-shell-title")).toHaveText("U.S. Capitals");
  await page.locator("#app-shell-back-button").click();
  await expect(page.locator(".us-objective-intro h2")).toHaveText("Learn States & Capitals");

  await stateActivities.filter({ hasText: "Build a regional map" }).click();
  await expect(page.locator("#poc-title")).toHaveAttribute("title", "Map Reconstruction");
  await page.locator("#back-button").click();
  await expect(page.locator(".us-objective-intro h2")).toHaveText("Learn States & Capitals");

  await page.locator("#app-shell-back-button").click();
  await expect(page.locator(".us-objective-card")).toHaveCount(4);
  await page.getByRole("button", { name: /Learn Connections/ }).click();
  await expect(page.locator(".us-objective-intro h2")).toHaveText("Learn Connections");
  const connectionActivities = page.locator(".us-objective-activity");
  await expect(connectionActivities.filter({ hasText: "Practice geographic connections" })).toBeEnabled();
  await expect(connectionActivities.filter({ hasText: "Routes & spatial reasoning" })).toBeEnabled();

  await connectionActivities.filter({ hasText: "Practice geographic connections" }).click();
  await expect(page.locator("#poc-title")).toHaveAttribute("title", "U.S. Connections", { timeout: 20_000 });
  await page.locator("#back-button").click();
  await expect(page.locator(".us-objective-intro h2")).toHaveText("Learn Connections");

  await page.locator("#app-shell-back-button").click();
  await page.getByRole("button", { name: /Learn Physical Features/ }).click();
  const physicalActivities = page.locator(".us-objective-activity");
  await expect(physicalActivities).toHaveCount(3);
  await physicalActivities.filter({ hasText: "Learn mountain ranges" }).click();
  await expect(page.locator("#poc-title")).toHaveAttribute("title", "U.S. Mountain Ranges", { timeout: 20_000 });
  await page.locator("#back-button").click();
  await expect(page.locator(".us-objective-intro h2")).toHaveText("Learn Physical Features");

  await page.locator("#app-shell-back-button").click();
  await page.getByRole("button", { name: /Explore the United States/ }).click();
  await expect(page.locator(".us-objective-activity").filter({ hasText: "Rebuild the Lower 48" })).toBeEnabled();
  await page.locator(".us-objective-activity").filter({ hasText: "Rebuild the Lower 48" }).click();
  await expect(page.locator("#poc-title")).toHaveAttribute("title", "Rebuild the Lower 48", { timeout: 20_000 });
  await page.locator("#back-button").click();
  await expect(page.locator(".us-objective-intro h2")).toHaveText("Explore the United States");
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

test("scoped resets preserve canonical learning history", async ({ page }) => {
  const runtimeErrors = collectRuntimeErrors(page);
  await openFreshMainMenu(page);
  const canonicalHistory = JSON.stringify({ version: 1, events: [{ eventId: "scoped-history" }] });
  await page.evaluate(({ canonical, daily, unitedStates }) => {
    localStorage.setItem("mappaMundiCanonicalEvidence", canonical);
    localStorage.setItem("mappaDailyTrailProgress", daily);
    localStorage.setItem("mappaUnitedStatesMemoryTrailProgress", unitedStates);
  }, {
    canonical: canonicalHistory,
    daily: JSON.stringify({ hasStarted: true }),
    unitedStates: JSON.stringify({ hasStarted: true })
  });
  await openResetSettings(page);

  await page.getByRole("button", { name: "Reset All Daily Trail Progress" }).click();
  await expect(page.getByRole("alertdialog", { name: "Reset all Daily Trail progress?" })).toBeVisible();
  await page.getByRole("button", { name: "Reset All Daily Trail", exact: true }).click();
  expect(await page.evaluate(() => ({
    canonical: localStorage.getItem("mappaMundiCanonicalEvidence"),
    daily: localStorage.getItem("mappaDailyTrailProgress"),
    unitedStates: localStorage.getItem("mappaUnitedStatesMemoryTrailProgress")
  }))).toEqual({ canonical: canonicalHistory, daily: null, unitedStates: JSON.stringify({ hasStarted: true }) });

  await page.getByRole("button", { name: "Reset United States Memory Trail" }).click();
  await expect(page.getByRole("alertdialog", { name: "Reset United States Memory Trail?" })).toBeVisible();
  await page.getByRole("button", { name: "Reset United States Trail" }).click();
  expect(await page.evaluate(() => ({
    canonical: localStorage.getItem("mappaMundiCanonicalEvidence"),
    unitedStates: localStorage.getItem("mappaUnitedStatesMemoryTrailProgress")
  }))).toEqual({ canonical: canonicalHistory, unitedStates: null });
  expect(runtimeErrors).toEqual([]);
});

test("Reset All Learning Progress clears its manifest and preserves preferences", async ({ page }) => {
  const runtimeErrors = collectRuntimeErrors(page);
  await openFreshMainMenu(page);
  const preferences = {
    "geography-memory-difficulty-mode": "hard",
    atlasQuestSettings: JSON.stringify({ version: 1, mapLayers: { showCities: false } }),
    atlasQuestOnboardingSeen: "true",
    atlasQuestAudioMuted: "true",
    "future-preference": "preserve"
  };
  await page.evaluate(({ learningKeys, preferenceValues }) => {
    learningKeys.forEach((key) => localStorage.setItem(key, `learning:${key}`));
    Object.entries(preferenceValues).forEach(([key, value]) => localStorage.setItem(key, value));
  }, { learningKeys: learningProgressStorageKeys, preferenceValues: preferences });
  await openResetSettings(page);

  await page.getByRole("button", { name: "Reset All Learning Progress" }).click();
  const dialog = page.getByRole("alertdialog", { name: "Reset all learning progress across Mappa Mundi?" });
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText("permanently erases journey and activity progress");
  await expect(dialog).toContainText("preferences will not change");
  await dialog.getByRole("button", { name: "Cancel" }).click();
  await expect(dialog).toHaveCount(0);
  expect(await page.evaluate((key) => localStorage.getItem(key), learningProgressStorageKeys[0])).toBeTruthy();

  await page.getByRole("button", { name: "Reset All Learning Progress" }).click();
  await Promise.all([
    page.waitForNavigation(),
    page.getByRole("button", { name: "Erase All Learning Progress" }).click()
  ]);
  await expect(page.locator("#launch-screen")).toBeVisible();
  const afterReset = await page.evaluate(({ learningKeys, preferenceKeys }) => ({
    learning: Object.fromEntries(learningKeys.map((key) => [key, localStorage.getItem(key)])),
    preferences: Object.fromEntries(preferenceKeys.map((key) => [key, localStorage.getItem(key)]))
  }), { learningKeys: learningProgressStorageKeys, preferenceKeys: Object.keys(preferences) });
  expect(Object.values(afterReset.learning).every((value) => value === null)).toBe(true);
  expect(afterReset.preferences).toEqual(preferences);
  expect(runtimeErrors).toEqual([]);
});
