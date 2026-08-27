import { expect, test } from "@playwright/test";

const expectedNeighbors = ["iowa", "minnesota", "montana", "nebraska", "north-dakota", "wyoming"];
const expectedNeighborNames = ["Iowa", "Minnesota", "Montana", "Nebraska", "North Dakota", "Wyoming"];

async function openCapitalConnections(page) {
  await page.goto("/?test=1&globeNavigation=off");
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
  expect(state.feedbackLayerVisibility.targetStateLabel).toBe("none");
}

function expectNeighborColorTreatment(state) {
  const expression = state.stateFillExpression;
  [expression[1], expression[3]].forEach((semanticCondition) => {
    expect(semanticCondition[0]).toBe("all");
    expect(semanticCondition[1][2]).toEqual(["literal", ["south-dakota"]]);
  });
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
  expect(state.contextStateLabels).toHaveLength(50);
  expect(state.contextStateLabels
    .filter(({ properties }) => properties.contextRole === "neighbor")
    .map(({ properties }) => properties.stateName).sort()).toEqual(expectedNeighborNames);
  expect(state.contextStateLabels
    .filter(({ properties }) => properties.contextRole === "target")
    .map(({ properties }) => properties.stateName)).toEqual(["South Dakota"]);
  expect(state.contextStateLabels.filter(({ properties }) => properties.contextRole === "background")).toHaveLength(43);
  expect(state.feedbackLayerVisibility).toMatchObject({
    stateFill: "visible",
    capitalStar: "visible",
    capitalLabel: "visible",
    neighborLabels: "visible",
    targetStateLabel: "visible",
    stateBoundaries: "visible",
    borderChainFill: "none"
  });
  const boundaryPaint = JSON.stringify(state.stateBoundaryPaint);
  expect(boundaryPaint).toContain("south-dakota");
  expect(boundaryPaint).toContain("#203b55");
  expect(boundaryPaint).toContain("#4f616e");
  expect(boundaryPaint).toContain("#687985");
  expectNeighborColorTreatment(state);
}

async function expectUsableCameraFit(page) {
  await expect.poll(async () => {
    const current = await visualState(page);
    const [cameraSouthwest, cameraNortheast] = current.mapCamera.bounds;
    const [feedbackSouthwest, feedbackNortheast] = current.feedbackCameraBounds;
    const targetStateId = current.resultVisualState.referenceStateIds[0];
    return current.cameraDevReport.targetId === targetStateId
      && current.mapCamera.moving === false
      && current.mapCamera.zoom >= 1.5
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
  expect(state.mapCamera.pitch).toBe(0);
  expect(state.mapCamera.bearing).toBe(0);
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

test("Capital Connections camera adapts to central, northeastern, and southeastern states", async ({ page }) => {
  await openCapitalConnections(page);

  const scenarios = [
    {
      challengeId: "state-capital-south-dakota-state-to-capital",
      capital: "Pierre",
      stateId: "south-dakota"
    },
    {
      challengeId: "state-capital-maine-state-to-capital",
      capital: "Augusta",
      stateId: "maine"
    },
    {
      challengeId: "state-capital-florida-state-to-capital",
      capital: "Tallahassee",
      stateId: "florida"
    }
  ];

  for (const scenario of scenarios) {
    await startQuestion(page, scenario.challengeId);
    await page.getByRole("button", { name: `Select ${scenario.capital}`, exact: true }).click();
    await page.getByRole("button", { name: "Submit", exact: true }).click();
    await expect(page.locator(".mental-map-result-status")).toHaveText("Correct");
    await expectUsableCameraFit(page);

    const state = await visualState(page);
    expect(state.resultVisualState.referenceStateIds).toEqual([scenario.stateId]);
    expect(state.resultVisualState.cameraStateIds).toEqual([
      scenario.stateId,
      ...state.resultVisualState.neighborStateIds
    ]);
    expect(state.contextStateLabels).toHaveLength(50);
    expect(state.feedbackLayerVisibility.stateBoundaries).toBe("visible");
    expect(state.feedbackLayerVisibility.borderChainFill).toBe("none");
    expect(state.feedbackCameraBounds[1][0] - state.feedbackCameraBounds[0][0]).toBeLessThan(35);
    expect(state.feedbackCameraBounds[1][1] - state.feedbackCameraBounds[0][1]).toBeLessThan(25);
    expect(state.feedbackCameraBounds[1][0] - state.feedbackCameraBounds[0][0]).toBeGreaterThan(11.9);
    expect(state.feedbackCameraBounds[1][1] - state.feedbackCameraBounds[0][1]).toBeGreaterThan(8.9);

    const targetLabel = state.contextStateLabels.find(({ properties }) => (
      properties.stateId === scenario.stateId
    ));
    expect(targetLabel?.properties.contextRole).toBe("target");
    const [targetLongitude, targetLatitude] = targetLabel.geometry.coordinates;
    const [cameraSouthwest, cameraNortheast] = state.mapCamera.bounds;
    expect(targetLongitude).toBeGreaterThanOrEqual(cameraSouthwest[0]);
    expect(targetLongitude).toBeLessThanOrEqual(cameraNortheast[0]);
    expect(targetLatitude).toBeGreaterThanOrEqual(cameraSouthwest[1]);
    expect(targetLatitude).toBeLessThanOrEqual(cameraNortheast[1]);

    expect(state.cameraDevReport).toMatchObject({
      center: state.mapCamera.center,
      zoom: state.mapCamera.zoom,
      pitch: 0,
      bearing: 0,
      cameraContext: "mental-map-result",
      targetId: scenario.stateId
    });
  }

  const commandReport = await page.evaluate(() => window.mappaCameraDev?.report?.());
  expect(commandReport).toMatchObject({
    center: expect.any(Array),
    zoom: expect.any(Number),
    pitch: expect.any(Number),
    bearing: expect.any(Number),
    cameraContext: "mental-map-result",
    targetId: "florida"
  });
  expect(await page.evaluate(() => {
    const current = window.mappaCameraDev.report();
    return window.mappaCameraDev.apply({ ...current, duration: 0 });
  })).toBe(true);
  await expect.poll(async () => {
    const state = await visualState(page);
    return state.mapCamera.moving === false && state.cameraDevReport.targetId;
  }).toBe("florida");
});
