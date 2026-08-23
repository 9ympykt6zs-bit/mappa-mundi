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

async function canonicalEvents(page) {
  return page.evaluate(() => {
    const stored = JSON.parse(localStorage.getItem("mappaMundiCanonicalEvidence") || "null");
    return stored?.events || [];
  });
}

test("unlabeled map support preserves answers and distinguishes assisted evidence", async ({ page }) => {
  await openUnitedStatesConnections(page);
  await page.evaluate(() => localStorage.removeItem("mappaMundiCanonicalEvidence"));

  await startQuestion(page, "us-relationship-international-border-ohio-canada");
  await expect(page.getByRole("button", { name: "Show map", exact: true })).toBeVisible();
  await submitAnswer(page, "Canada");
  await expect(page.locator(".mental-map-result-status")).toHaveText("Correct");
  let events = await canonicalEvents(page);
  expect(events).toHaveLength(1);
  expect(events[0]).toMatchObject({
    outcome: "correct",
    conceptId: "relationship:international-border:ohio:canada"
  });

  await startQuestion(page, "us-relationship-international-border-texas-mexico");
  await page.getByRole("button", { name: "Select Mexico", exact: true }).click();
  await page.getByRole("button", { name: "Show map", exact: true }).click();

  const hint = page.locator("#unlabeled-us-map");
  await expect(hint).toBeVisible();
  await expect(hint).toContainText("State outlines only — no labels.");
  await expect(hint.locator("svg")).toHaveAttribute(
    "aria-label",
    "Unlabeled map of the United States showing state outlines"
  );
  await expect(hint.locator("text")).toHaveCount(0);
  await expect(hint.locator("use")).toHaveAttribute("href", "assets/maps/usa/usa-map.svg#usa-states");
  await expect(hint).not.toContainText("Texas");
  await expect(hint).not.toContainText("Mexico");
  await expect(page.locator(".mental-map-result-content")).toHaveCount(0);

  let state = await page.evaluate(() => window.__MAPPA_TEST_API__.getMentalMapVisualState());
  expect(state.selectedStateIds).toEqual(["texas"]);
  expect(state.mapHintState).toEqual({ available: true, visible: true, used: true });
  expect(await canonicalEvents(page)).toHaveLength(1);

  await page.getByRole("button", { name: "Hide map", exact: true }).click();
  state = await page.evaluate(() => window.__MAPPA_TEST_API__.getMentalMapVisualState());
  expect(state.selectedStateIds).toEqual(["texas"]);
  expect(state.mapHintState).toEqual({ available: true, visible: false, used: true });
  await page.getByRole("button", { name: "Show map", exact: true }).click();
  await page.getByRole("button", { name: "Hide map", exact: true }).click();
  expect(await canonicalEvents(page)).toHaveLength(1);

  await page.getByRole("button", { name: "Submit", exact: true }).click();
  await expect(page.locator(".mental-map-result-status")).toHaveText("Correct");
  events = await canonicalEvents(page);
  expect(events).toHaveLength(2);
  expect(events[1]).toMatchObject({
    outcome: "assisted",
    conceptId: "relationship:international-border:texas:mexico",
    credit: { earned: 1, possible: 1 }
  });

  await startQuestion(page, "us-relationship-international-border-ohio-canada");
  state = await page.evaluate(() => window.__MAPPA_TEST_API__.getMentalMapVisualState());
  expect(state.mapHintState).toEqual({ available: true, visible: false, used: false });
  await page.getByRole("button", { name: "Show map", exact: true }).click();
  await page.getByRole("button", { name: "Hide map", exact: true }).click();
  await submitAnswer(page, "Mexico");
  await expect(page.locator(".mental-map-result-status")).toHaveText("Not quite");
  events = await canonicalEvents(page);
  expect(events).toHaveLength(3);
  expect(events[2]).toMatchObject({
    outcome: "incorrect",
    conceptId: "relationship:international-border:ohio:canada"
  });
});

test("the map scaffold is scoped to U.S. Connections", async ({ page }) => {
  await openMainMenu(page);
  await page.locator("#main-menu-mental-map-challenge-button").click();
  await expect(page.locator("#poc-title")).toHaveAttribute("title", "Mental Map Challenge", { timeout: 20_000 });
  await startQuestion(page, "mississippi-river-any-three");
  await expect(page.getByRole("button", { name: "Show map", exact: true })).toHaveCount(0);
  const state = await page.evaluate(() => window.__MAPPA_TEST_API__.getMentalMapVisualState());
  expect(state.mapHintState).toEqual({ available: false, visible: false, used: false });
});

test("Census-region questions are absent while retained semantic feedback uses only its reference state", async ({ page }) => {
  await openUnitedStatesConnections(page);
  expect(await page.evaluate(() => window.__MAPPA_TEST_API__.startMentalMapQuestion(
    "us-relationship-region-membership-maryland-south"
  ))).toBe(false);
  await startQuestion(page, "us-relationship-international-border-ohio-canada");

  await expect(page.locator(".mental-map-question-title-row h2")).toHaveText("Which country shares an international border with Ohio?");
  await submitAnswer(page, "Mexico");

  const panel = page.locator("#mental-map-challenge-panel");
  await expect(panel).toContainText("Not quite");
  await expect(panel).toContainText("Your answer: Mexico");
  await expect(panel).toContainText("Correct answer: Canada");
  await expect(panel).toContainText("Reference state: Ohio");
  await expect(panel).toContainText("Incorrect: Mexico");
  await expect(panel).toContainText("Ohio shares an international boundary with Canada.");

  const state = await page.evaluate(() => window.__MAPPA_TEST_API__.getMentalMapVisualState());
  expect(state.evaluation.selectedInvalidStateIds).toEqual(["alabama"]);
  expect(state.resultVisualState).toMatchObject({
    correctStateIds: ["ohio"],
    referenceStateIds: ["ohio"],
    contextStateIds: ["ohio"],
    selectedIncorrectStateIds: [],
    learnerStateIds: []
  });
  expect(JSON.stringify(state.stateFillExpression)).toContain("ohio");
  expect(JSON.stringify(state.stateFillExpression)).not.toContain("alabama");
});

test("relationship feedback follows each reference state and clears between questions", async ({ page }) => {
  await openUnitedStatesConnections(page);

  const scenarios = [
    ["us-relationship-international-border-ohio-canada", "Mexico", "ohio"],
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
