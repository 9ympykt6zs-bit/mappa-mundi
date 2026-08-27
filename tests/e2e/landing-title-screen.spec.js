import { expect, test } from "@playwright/test";

test("landing hero is the sole title-screen navigation surface", async ({ page }) => {
  await page.goto("/");

  const launchScreen = page.locator("#launch-screen");
  const startButton = page.locator("#launch-start-button");
  const learnMore = launchScreen.getByRole("link", { name: "Learn More" });

  await expect(launchScreen).toBeVisible();
  await expect(launchScreen.locator(".launch-topbar")).toHaveCount(0);
  await expect(launchScreen.locator(".launch-brand")).toHaveCount(0);
  await expect(launchScreen.locator(".launch-nav-button")).toHaveCount(0);
  await expect(launchScreen.getByText("Start Playing", { exact: true })).toHaveCount(1);
  await expect(startButton).toBeVisible();
  await expect(learnMore).toBeVisible();
  await expect(learnMore).toHaveAttribute("href", "/about");
  await expect(page.locator("#launch-title")).toHaveText("Mappa Mundi");
  await expect(page.locator(".launch-subtitle")).toHaveText("Know the world by heart.");
  await expect(page.locator(".title-screen-globe img")).toBeVisible();
  await expect(page.locator(".launch-proof-row")).toBeVisible();

  const heroBox = await page.locator(".title-screen-hero").boundingBox();
  const startBox = await startButton.boundingBox();
  const learnMoreBox = await learnMore.boundingBox();
  const viewport = page.viewportSize();

  expect(heroBox).not.toBeNull();
  expect(startBox).not.toBeNull();
  expect(learnMoreBox).not.toBeNull();
  expect(viewport).not.toBeNull();
  expect(heroBox.y).toBeLessThan(80);
  expect(startBox.y + startBox.height).toBeLessThanOrEqual(viewport.height);
  expect(learnMoreBox.y + learnMoreBox.height).toBeLessThanOrEqual(viewport.height);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test("landing hero actions retain their destinations", async ({ page }) => {
  await page.goto("/");
  await page.locator("#launch-start-button").click();

  await expect(page.locator("#globe-navigation-panel")).toBeVisible({ timeout: 20_000 });
  await expect(page.locator("#launch-screen")).toBeHidden();
  await expect(page.locator(".top-bar")).toHaveCount(1);

  await page.goto("/");
  await page.locator("#launch-screen").getByRole("link", { name: "Learn More" }).click();
  await expect(page).toHaveURL(/\/about\/?$/);
});
