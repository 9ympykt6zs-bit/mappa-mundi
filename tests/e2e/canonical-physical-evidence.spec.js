import { expect, test } from "@playwright/test";

async function openFreshMainMenu(page) {
  await page.goto("/?test=1&globeNavigation=off");
  await page.locator("#launch-start-button").click();
  await page.evaluate(() => window.__mappaMundiLoadApp());
  if (await page.locator("#launch-screen").isVisible()) {
    await page.locator("#launch-start-button").click();
  }
  await expect(page.locator("#app-shell-title")).toHaveText("Main Menu");
}

async function openRiverLabelMap(page) {
  await page.locator("#main-menu-us-expedition-button").click();
  await page.getByRole("button", { name: /Learn Physical Features/ }).click();
  await page.locator(".us-objective-activity").filter({ hasText: "Learn major rivers" }).click();
  await expect.poll(() => page.evaluate(() => window.__MAPPA_TEST_API__.getCurrentActivity()?.id), {
    timeout: 20_000
  }).toBe("us-physical-rivers");
}

test("correct river placement persists canonical locating evidence", async ({ page }) => {
  await openFreshMainMenu(page);
  await openRiverLabelMap(page);
  const target = await page.evaluate(() => window.__MAPPA_TEST_API__.getCorrectTargets()[0]);
  expect(await page.evaluate((targetId) => window.__MAPPA_TEST_API__.answerCurrentPrompt(targetId), target.id)).toBe(true);

  const events = await page.evaluate(() => JSON.parse(localStorage.getItem("mappaMundiCanonicalEvidence") || "{}").events || []);
  expect(events).toEqual(expect.arrayContaining([
    expect.objectContaining({
      conceptId: `river-location:${target.id}`,
      skillId: "locating",
      sourceMode: "journey",
      sourceActivityId: "us-physical-rivers",
      outcome: "correct"
    })
  ]));
});
