import { expect, test } from "@playwright/test";

async function openMainMenu(page) {
  await page.goto("/?test=1");
  await expect(page.locator("#launch-screen")).toBeVisible();
  await page.locator("#launch-start-button").click();
  await page.evaluate(() => window.__mappaMundiLoadApp());
  if (await page.locator("#launch-screen").isVisible()) {
    await page.locator("#launch-start-button").click();
  }
  await expect(page.locator("#app-shell-screen")).toBeVisible();
}

async function openUnitedStatesConnections(page) {
  await openMainMenu(page);
  await page.locator("#main-menu-united-states-relationships-button").click();
  await expect(page.locator("#poc-title")).toHaveAttribute("title", "U.S. Connections", { timeout: 20_000 });
}

async function startQuestion(page, challengeId) {
  expect(await page.evaluate((id) => window.__MAPPA_TEST_API__.startMentalMapQuestion(id), challengeId)).toBe(true);
  await expect(page.locator("body")).not.toHaveClass(/mental-map-result-mode/);
}

async function submitAnswer(page, label) {
  await page.getByRole("button", { name: `Select ${label}`, exact: true }).click();
  await page.getByRole("button", { name: "Submit", exact: true }).click();
  await expect(page.locator("body")).toHaveClass(/mental-map-result-mode/);
}

test("Maryland region feedback never paints the Northeast answer key as Alaska", async ({ page }) => {
  await openUnitedStatesConnections(page);
  await startQuestion(page, "us-relationship-region-membership-maryland-south");

  await expect(page.locator(".mental-map-question-title-row h2")).toHaveText("Which U.S. Census region includes Maryland?");
  await submitAnswer(page, "Northeast");

  const panel = page.locator("#mental-map-challenge-panel");
  await expect(panel).toContainText("Not quite");
  await expect(panel).toContainText("Your answer: Northeast");
  await expect(panel).toContainText("Correct answer: South");
  await expect(panel).toContainText("Reference state: Maryland");
  await expect(panel).toContainText("Incorrect: Northeast");
  await expect(panel).toContainText("Maryland belongs to the South U.S. Census region.");

  const state = await page.evaluate(() => window.__MAPPA_TEST_API__.getMentalMapVisualState());
  expect(state.evaluation.selectedInvalidStateIds).toEqual(["alaska"]);
  expect(state.resultVisualState).toMatchObject({
    correctStateIds: ["maryland"],
    referenceStateIds: ["maryland"],
    contextStateIds: ["maryland"],
    selectedIncorrectStateIds: [],
    learnerStateIds: []
  });
  expect(JSON.stringify(state.stateFillExpression)).toContain("maryland");
  expect(JSON.stringify(state.stateFillExpression)).not.toContain("alaska");
});

test("relationship feedback follows each reference state and clears between questions", async ({ page }) => {
  await openUnitedStatesConnections(page);

  const scenarios = [
    ["us-relationship-region-membership-ohio-midwest", "Northeast", "ohio"],
    ["us-relationship-international-border-texas-mexico", "Canada", "texas"],
    ["us-relationship-mountain-range-colorado-rocky-mountains", "Adirondack Mountains", "colorado"]
  ];

  for (const [challengeId, incorrectAnswer, referenceStateId] of scenarios) {
    await startQuestion(page, challengeId);
    const cleared = await page.evaluate(() => window.__MAPPA_TEST_API__.getMentalMapVisualState());
    expect(cleared.resultVisualState).toMatchObject({
      correctStateIds: [],
      selectedCorrectStateIds: [],
      selectedIncorrectStateIds: [],
      learnerStateIds: [],
      referenceStateIds: [],
      contextStateIds: [],
      associatedFeatures: []
    });
    expect(cleared.feedbackFeatureEntityIds).toEqual([]);

    await submitAnswer(page, incorrectAnswer);
    const state = await page.evaluate(() => window.__MAPPA_TEST_API__.getMentalMapVisualState());
    expect(state.resultVisualState.referenceStateIds).toEqual([referenceStateId]);
    expect(state.resultVisualState.contextStateIds).toEqual([referenceStateId]);
    expect(state.resultVisualState.selectedIncorrectStateIds).toEqual([]);
    expect(state.resultVisualState.learnerStateIds).toEqual([]);
    const fillExpression = JSON.stringify(state.stateFillExpression);
    expect(fillExpression).toContain(referenceStateId);
    for (const unrelatedStateId of state.evaluation.selectedInvalidStateIds) {
      expect(fillExpression).not.toContain(unrelatedStateId);
    }
  }
});

test("missing and incorrect summaries match their map feedback treatments", async ({ page }) => {
  await openMainMenu(page);
  await page.locator("#main-menu-mental-map-challenge-button").click();
  await expect(page.locator("#poc-title")).toHaveAttribute("title", "Mental Map Challenge", { timeout: 20_000 });
  await startQuestion(page, "mississippi-river-any-three");
  await submitAnswer(page, "Indiana");

  const missing = page.locator(".mental-map-result-line.is-missing");
  const incorrect = page.locator(".mental-map-result-line.is-incorrect");
  const correctAnswer = page.locator(".mental-map-result-line").filter({ hasText: "Correct answer:" });
  const learnerAnswer = page.locator(".mental-map-result-line").filter({ hasText: "Your answer:" });

  await expect(missing).toContainText("Missing:");
  await expect(missing).toContainText("Minnesota");
  await expect(incorrect).toHaveText(/Incorrect:\s*Indiana/);
  await expect(correctAnswer).not.toHaveClass(/is-missing|is-incorrect/);
  await expect(learnerAnswer).not.toHaveClass(/is-missing|is-incorrect/);

  const styles = await page.evaluate(() => {
    const read = (selector) => {
      const style = getComputedStyle(document.querySelector(selector));
      return {
        backgroundColor: style.backgroundColor,
        borderLeftColor: style.borderLeftColor
      };
    };
    return {
      missing: read(".mental-map-result-line.is-missing"),
      incorrect: read(".mental-map-result-line.is-incorrect"),
      correct: read(".mental-map-result-line:not(.is-missing):not(.is-incorrect)")
    };
  });
  expect(styles.missing.borderLeftColor).toBe("rgb(230, 162, 60)");
  expect(styles.incorrect.borderLeftColor).toBe("rgb(217, 81, 81)");
  expect(styles.missing.backgroundColor).not.toBe("rgba(0, 0, 0, 0)");
  expect(styles.incorrect.backgroundColor).not.toBe("rgba(0, 0, 0, 0)");
  expect(styles.correct.backgroundColor).toBe("rgba(0, 0, 0, 0)");
});
