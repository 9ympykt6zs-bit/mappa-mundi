import { expect, test } from "@playwright/test";
import { adaptCanonicalRetrievalAttempt } from "../../src/canonical-learning-evidence.js";
import { centralAmericaLearningUnit } from "../../src/central-america-learning-unit.js";
import { createGeographyLearningUnitItems } from "../../src/geography-learning-unit.js";

const graduationEvents = createGeographyLearningUnitItems(centralAmericaLearningUnit).flatMap((item, index) => [
  adaptCanonicalRetrievalAttempt({
    item,
    promptType: "name_to_place",
    result: "correct",
    eventId: `e2e-central-location-${index}`,
    attemptId: `e2e-central-location-${index}`,
    occurredAt: `2026-08-21T12:${String(index).padStart(2, "0")}:00.000Z`,
    sourceMode: "journey",
    sourceActivityId: "central-america"
  }),
  adaptCanonicalRetrievalAttempt({
    item,
    promptType: "place_to_name",
    result: "correct",
    eventId: `e2e-central-identification-${index}`,
    attemptId: `e2e-central-identification-${index}`,
    occurredAt: `2026-08-21T13:${String(index).padStart(2, "0")}:00.000Z`,
    sourceMode: "memory-trail",
    sourceActivityId: "central-america"
  })
]);

async function passLaunchScreen(page) {
  await expect(page.locator("#launch-screen")).toBeVisible();
  const startButton = page.locator("#launch-start-button");
  await startButton.click();
  await page.evaluate(() => window.__mappaMundiLoadApp());
  if (await page.locator("#launch-screen").isVisible()) await startButton.click();
  await expect(page.locator("#app-shell-title")).toHaveText("Main Menu");
}

async function openCentralAmericaUnit(page) {
  await page.getByRole("button", { name: "More Ways to Learn" }).click();
  await page.getByRole("button", { name: /Learn Your World/ }).click();
  await page.locator("#main-menu-central-america-unit-button").click();
  await expect(page.locator("#app-shell-title")).toHaveText("Central America Countries");
}

test("Central America graduates the shared learning architecture", async ({ page }) => {
  const runtimeErrors = [];
  page.on("pageerror", (error) => runtimeErrors.push(`pageerror: ${error.message}`));
  page.on("console", (message) => {
    if (message.type() === "error") runtimeErrors.push(`console: ${message.text()}`);
  });

  await page.goto("/?test=1&globeNavigation=off");
  await passLaunchScreen(page);
  await openCentralAmericaUnit(page);
  await expect(page.locator(".expedition-step")).toHaveCount(3);
  await expect(page.locator(".expedition-progress")).toHaveText("0 of 2 milestones complete");
  await expect(page.locator(".expedition-step.is-recommended h2")).toHaveText("Locate the seven countries");
  await expect(page.locator(".expedition-step").filter({ hasText: "Identify the seven countries" }).getByRole("button")).toBeDisabled();

  await page.locator(".expedition-step").filter({ hasText: "Locate the seven countries" }).getByRole("button", { name: "Start" }).click();
  await expect.poll(
    () => page.evaluate(() => window.__MAPPA_TEST_API__?.getCurrentActivity()?.id),
    { timeout: 20_000 }
  ).toBe("central-america");
  const [firstTarget] = await page.evaluate(() => window.__MAPPA_TEST_API__.getCorrectTargets());
  expect(await page.evaluate((targetId) => window.__MAPPA_TEST_API__.answerCurrentPrompt(targetId), firstTarget.id)).toBe(true);
  await expect.poll(() => page.evaluate(() => {
    const repository = JSON.parse(localStorage.getItem("mappaMundiCanonicalEvidence") || "null");
    return repository?.events?.find((event) => event.sourceActivityId === "central-america");
  })).toMatchObject({
    conceptId: `country-location:${firstTarget.id}`,
    skillId: "locating",
    sourceMode: "journey",
    outcome: "correct"
  });

  await page.getByRole("button", { name: "Learning Inspector" }).click();
  await expect(page.getByRole("region", { name: "Learning Inspector" })).toBeVisible();
  await page.getByPlaceholder("Ohio, locating, state…").fill(firstTarget.name);
  await expect(page.locator(".learning-inspector-card").filter({ hasText: `${firstTarget.name} · canonical-retrieval` })).toContainText("Attempts");
  await expect(page.locator(".learning-inspector-section-title").filter({ hasText: "Canonical learner evidence" })).toBeVisible();
  await page.getByRole("region", { name: "Learning Inspector" }).getByRole("button", { name: "Close" }).click();

  await page.locator("#back-button").click();
  await expect(page.locator("#app-shell-title")).toHaveText("Central America Countries");
  await expect(page.locator(".expedition-step").filter({ hasText: "Locate the seven countries" })).toContainText("In progress");

  await page.evaluate((events) => {
    localStorage.setItem("mappaMundiCanonicalEvidence", JSON.stringify({
      storageVersion: 1,
      evidenceSchemaVersion: 1,
      events
    }));
  }, graduationEvents);
  await page.reload();
  await passLaunchScreen(page);
  await openCentralAmericaUnit(page);
  await expect(page.locator(".expedition-progress")).toHaveText("2 of 2 milestones complete");

  const progressStep = page.locator(".expedition-step").filter({ hasText: "Review your evidence" });
  await progressStep.getByRole("button", { name: "Start" }).click();
  await expect(page.locator("#app-shell-title")).toHaveText("Progress Report");
  await expect(page.locator(".us-progress-eyebrow")).toHaveText("Central America Countries");
  await expect(page.locator(".us-progress-category")).toHaveCount(2);
  await expect(page.locator(".us-progress-item")).toHaveCount(14);

  await page.locator("#app-shell-back-button").click();
  await expect(page.locator("#app-shell-title")).toHaveText("Central America Countries");
  const identifyStep = page.locator(".expedition-step").filter({ hasText: "Identify the seven countries" });
  await identifyStep.getByRole("button", { name: "Review" }).click();
  await expect(page.locator(".memory-trail-panel")).toBeVisible({ timeout: 20_000 });
  await page.getByRole("button", { name: "Learning Inspector" }).click();
  const inspector = page.getByRole("region", { name: "Learning Inspector" });
  await expect(inspector).toContainText("Current selection reasons");
  await expect(inspector).toContainText("memory-trail");
  expect(runtimeErrors).toEqual([]);
});
