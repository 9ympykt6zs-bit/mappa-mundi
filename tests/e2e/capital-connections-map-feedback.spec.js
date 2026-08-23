import { expect, test } from "@playwright/test";

const expectedNeighbors = ["iowa", "minnesota", "montana", "nebraska", "north-dakota", "wyoming"];
const expectedNeighborNames = ["Iowa", "Minnesota", "Montana", "Nebraska", "North Dakota", "Wyoming"];

async function openCapitalConnections(page) {
  await page.goto("/?test=1");
  await expect(page.locator("#launch-screen")).toBeVisible();
  await page.locator("#launch-start-button").click();
  await page.evaluate(() => window.__mappaMundiLoadApp());
  if (await page.locator("#launch-screen").isVisible()) {
    await page.locator("#launch-start-button").click();
  }
  await expect(page.locator("#app-shell-screen")).toBeVisible();
  await page.locator("#main-menu-united-states-relationships-button").click();
  await expect(page.locator("#poc-title")).toHaveAttribute("title", "U.S. Connections", { timeout: 20_000 });
}

async function startQuestion(page, challengeId) {
  expect(await page.evaluate((id) => window.__MAPPA_TEST_API__.startMentalMapQuestion(id), challengeId)).toBe(true);
  await expect(page.locator("body")).not.toHaveClass(/mental-map-result-mode/);
}

async function visualState(page) {
  return page.evaluate(() => window.__MAPPA_TEST_API__.getMentalMapVisualState());
}

function expectNoCapitalContext(state) {
  expect(state.capitalFeedbackFeatures).toEqual([]);
  expect(state.capitalFeedbackLabels).toEqual([]);
  expect(state.contextStateLabels).toEqual([]);
  expect(state.resultVisualState.neighborStateIds || []).toEqual([]);
  expect(state.feedbackLayerVisibility.capitalStar).toBe("none");
  expect(state.feedbackLayerVisibility.neighborLabels).toBe("none");
}

function expectNeighborColorTreatment(state) {
  const expression = state.stateFillExpression;
  const neighborColorIndex = expression.indexOf("#e3e8ec");
  expect(neighborColorIndex).toBeGreaterThan(0);
  const neighborCondition = expression[neighborColorIndex - 1];
  expect(neighborCondition[0]).toBe("in");
  expect(neighborCondition[2]).toEqual(["literal", expectedNeighbors]);
  expect(expression.at(-1)).toBe("#f3f5f7");
  expectedNeighbors.forEach((neighborId) => {
    expect(state.resultVisualState.correctStateIds).not.toContain(neighborId);
    expect(state.resultVisualState.selectedCorrectStateIds).not.toContain(neighborId);
    expect(state.resultVisualState.selectedIncorrectStateIds).not.toContain(neighborId);
    expect(state.resultVisualState.missingStateIds).not.toContain(neighborId);
  });
}

function expectCapitalTeachingContext(state) {
  expect(state.resultVisualState.capitalFeedback).toEqual({
    entityId: "capital:pierre",
    id: "pierre",
    name: "Pierre",
    sourceFeatureId: "capital-pierre",
    stateId: "south-dakota"
  });
  expect(state.resultVisualState.neighborStateIds).toEqual(expectedNeighbors);
  expect(state.resultVisualState.cameraStateIds).toEqual(["south-dakota", ...expectedNeighbors]);
  expect(state.capitalFeedbackFeatures).toHaveLength(1);
  expect(state.capitalFeedbackFeatures[0]).toMatchObject({
    properties: {
      questionFeatureEntityId: "capital:pierre",
      questionFeatureKind: "capital",
      questionFeatureName: "Pierre"
    },
    geometry: {
      type: "Point",
      coordinates: [-100.3462286, 44.3671094]
    }
  });
  expect(state.capitalFeedbackLabels[0].geometry.coordinates).toEqual([-100.3462286, 44.3671094]);
  expect(state.contextStateLabels.map(({ properties }) => properties.stateName).sort()).toEqual(expectedNeighborNames);
  expect(state.contextStateLabels.every(({ properties }) => properties.contextRole === "neighbor")).toBe(true);
  expect(state.feedbackLayerVisibility).toMatchObject({
    capitalStar: "visible",
    capitalLabel: "visible",
    neighborLabels: "visible",
    stateBoundaries: "visible"
  });
  expectNeighborColorTreatment(state);
}

async function expectUsableCameraFit(page) {
  await expect.poll(async () => {
    const current = await visualState(page);
    const [cameraSouthwest, cameraNortheast] = current.mapCamera.bounds;
    const [feedbackSouthwest, feedbackNortheast] = current.feedbackCameraBounds;
    return current.mapCamera.zoom >= 1.8
      && cameraSouthwest[0] <= feedbackSouthwest[0]
      && cameraSouthwest[1] <= feedbackSouthwest[1]
      && cameraNortheast[0] >= feedbackNortheast[0]
      && cameraNortheast[1] >= feedbackNortheast[1];
  }, { timeout: 5_000 }).toBe(true);
  const state = await visualState(page);
  const [cameraSouthwest, cameraNortheast] = state.mapCamera.bounds;
  const [feedbackSouthwest, feedbackNortheast] = state.feedbackCameraBounds;
  expect(cameraSouthwest[0]).toBeLessThanOrEqual(feedbackSouthwest[0]);
  expect(cameraSouthwest[1]).toBeLessThanOrEqual(feedbackSouthwest[1]);
  expect(cameraNortheast[0]).toBeGreaterThanOrEqual(feedbackNortheast[0]);
  expect(cameraNortheast[1]).toBeGreaterThanOrEqual(feedbackNortheast[1]);
  expect(state.mapCamera.zoom).toBeLessThanOrEqual(5.25);
}

test("Capital Connections teaches the capital location and neighboring-state context after submission", async ({ page }) => {
  await openCapitalConnections(page);

  await startQuestion(page, "state-capital-south-dakota-state-to-capital");
  await expect(page.locator(".mental-map-question-title-row h2")).toHaveText("What is the capital of South Dakota?");
  expectNoCapitalContext(await visualState(page));
  await page.getByRole("button", { name: "Select Pierre", exact: true }).click();
  expectNoCapitalContext(await visualState(page));
  await page.getByRole("button", { name: "Submit", exact: true }).click();
  await expect(page.locator(".mental-map-result-status")).toHaveText("Correct");
  await expect(page.locator("#mental-map-challenge-panel")).toContainText("Pierre is the capital of South Dakota.");
  let state = await visualState(page);
  expectCapitalTeachingContext(state);
  expect(state.resultVisualState.selectedCorrectStateIds).toEqual(["south-dakota"]);
  await expectUsableCameraFit(page);

  await startQuestion(page, "state-capital-south-dakota-capital-to-state");
  await expect(page.locator(".mental-map-question-title-row h2")).toHaveText("Pierre is the capital of which state?");
  expectNoCapitalContext(await visualState(page));
  await page.getByRole("button", { name: "Select West Virginia", exact: true }).click();
  expectNoCapitalContext(await visualState(page));
  await page.getByRole("button", { name: "Submit", exact: true }).click();
  await expect(page.locator(".mental-map-result-status")).toHaveText("Not quite");
  const panel = page.locator("#mental-map-challenge-panel");
  await expect(panel).toContainText("Correct answer: South Dakota");
  await expect(panel).toContainText("Incorrect: West Virginia");
  state = await visualState(page);
  expectCapitalTeachingContext(state);
  expect(state.resultVisualState.selectedIncorrectStateIds).toEqual(["west-virginia"]);
  expect(state.resultVisualState.missingStateIds).toEqual(["south-dakota"]);
  await expectUsableCameraFit(page);
});
