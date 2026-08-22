import { expect, test } from "@playwright/test";

async function passLaunchScreen(page) {
  await expect(page.locator("#launch-screen")).toBeVisible();
  const startButton = page.locator("#launch-start-button");
  await startButton.click();
  await page.evaluate(() => window.__mappaMundiLoadApp());
  if (await page.locator("#launch-screen").isVisible()) {
    await startButton.click();
  }
  await expect(page.locator("#app-shell-title")).toHaveText("Main Menu");
}

async function startMountainRangeLocatingActivity(page) {
  await page.getByRole("button", { name: "More Ways to Learn" }).click();
  await page.getByRole("button", { name: /Challenge Yourself/ }).click();
  await page.locator('[data-journey-id="us-mountain-ranges"]').first().click();
  await expect(page.locator("#app-shell-title")).toHaveText("U.S. Mountain Ranges");
  await page.getByRole("button", { name: "Choose Difficulty" }).click();
  await page.locator('[data-difficulty-id="medium"]').click();
  await page.getByRole("button", { name: "Start Journey" }).click();
  await expect(page.locator("#memory-trail-overlay")).toBeVisible();
  await page.locator("#memory-trail-overlay").getByRole("button", { name: "Play Now" }).click();
  await expect.poll(() => page.evaluate(() => window.__MAPPA_TEST_API__?.getCurrentActivity()?.id), {
    timeout: 20_000
  }).toBe("us-mountain-ranges");
}

function evaluateExpression(expression, properties = {}) {
  if (!Array.isArray(expression)) return expression;
  const [operator, ...args] = expression;
  if (operator === "literal") return args[0];
  if (operator === "get") return properties[args[0]];
  if (operator === "boolean") return Boolean(evaluateExpression(args[0], properties) ?? args[1]);
  if (operator === "in") return evaluateExpression(args[1], properties).includes(evaluateExpression(args[0], properties));
  if (operator === "==") return evaluateExpression(args[0], properties) === evaluateExpression(args[1], properties);
  if (operator === "case") {
    for (let index = 0; index < args.length - 1; index += 2) {
      if (evaluateExpression(args[index], properties)) return evaluateExpression(args[index + 1], properties);
    }
    return evaluateExpression(args.at(-1), properties);
  }
  throw new Error(`Unsupported expression operator: ${operator}`);
}

async function getVisibleMountainChipTarget(page) {
  const targetIds = await page.locator("#answer-bank .label-chip[data-id]:not(.used)")
    .evaluateAll((chips) => chips.map((chip) => chip.dataset.id).filter(Boolean));
  const visualState = await page.evaluate(() => window.__MAPPA_TEST_API__.getMountainRangeVisualState());
  const { mapRect, targetClientPoints } = visualState;
  const targetId = targetIds.find((id) => {
    const point = targetClientPoints[id];
    return point
      && point.clientX > mapRect.left + 40
      && point.clientX < mapRect.right - 40
      && point.clientY > mapRect.top + 80
      && point.clientY < mapRect.bottom - 80;
  });
  expect(targetId).toBeTruthy();
  return targetId;
}

test("Mountain Ranges locating does not reveal selected or cover completed targets", async ({ page }) => {
  const runtimeErrors = [];
  page.on("pageerror", (error) => runtimeErrors.push(`pageerror: ${error.message}`));
  page.on("console", (message) => {
    if (message.type() === "error") runtimeErrors.push(`console: ${message.text()}`);
  });

  await page.goto("/?test=1");
  await passLaunchScreen(page);
  await startMountainRangeLocatingActivity(page);

  const targetId = await getVisibleMountainChipTarget(page);
  const chip = page.locator(`#answer-bank .label-chip[data-id="${targetId}"]`);
  await expect(chip).toBeVisible();
  await chip.click();

  const selectedState = await page.evaluate(() => window.__MAPPA_TEST_API__.getMountainRangeVisualState());
  expect(selectedState.selectedTargetId).toBe(targetId);
  expect(selectedState.activeTargetVisualIds).toContain(targetId);
  expect(selectedState.mountainRangeActiveTargetVisualIds).not.toContain(targetId);
  expect(selectedState.mountainSymbolTargetIds).toContain(targetId);
  expect(selectedState.mountainCorridorTargetIds).toContain(targetId);

  const correctPoint = selectedState.targetClientPoints[targetId];
  await page.mouse.click(correctPoint.clientX, correctPoint.clientY);
  await expect.poll(() => page.evaluate((id) => (
    window.__MAPPA_TEST_API__.getActivityAttempt().completedTargetIds.includes(id)
  ), targetId)).toBe(true);

  const completedState = await page.evaluate(() => window.__MAPPA_TEST_API__.getMountainRangeVisualState());
  expect(completedState.completedTargetIds).toContain(targetId);
  expect(completedState.persistedTargetIds).toContain(targetId);
  expect(completedState.completedLabelTargetIds).toContain(targetId);
  expect(evaluateExpression(completedState.shapeFillOpacityExpression, {
    id: targetId,
    physicalFeatureType: "mountain-range",
    hasStylizedMountainRangeArt: true,
    isOceanZone: false
  })).toBe(0);
  expect(evaluateExpression(completedState.shapeFillOpacityExpression, {
    id: targetId,
    physicalFeatureType: "lake",
    hasStylizedMountainRangeArt: false,
    isOceanZone: false
  })).toBe(0.96);
  expect(await page.evaluate(() => window.__MAPPA_TEST_API__.getActivityAttempt())).toMatchObject({
    incorrectPlacements: 0,
    completedTargetIds: expect.arrayContaining([targetId])
  });
  expect(runtimeErrors).toEqual([]);
});

test("selected Mountain Ranges chips permit navigation gestures without placement", async ({ page }) => {
  const runtimeErrors = [];
  page.on("pageerror", (error) => runtimeErrors.push(`pageerror: ${error.message}`));
  page.on("console", (message) => {
    if (message.type() === "error") runtimeErrors.push(`console: ${message.text()}`);
  });

  await page.goto("/?test=1");
  await passLaunchScreen(page);
  await startMountainRangeLocatingActivity(page);

  const targetId = await getVisibleMountainChipTarget(page);
  const chip = page.locator(`#answer-bank .label-chip[data-id="${targetId}"]`);
  await chip.click();

  const selectedState = await page.evaluate(() => window.__MAPPA_TEST_API__.getMountainRangeVisualState());
  expect(selectedState).toMatchObject({
    selectedTargetId: targetId,
    grabbedAnswerId: "",
    dragPanEnabled: true,
    boxZoomEnabled: true,
    scrollZoomEnabled: true
  });
  expect(selectedState.mountainRangeActiveTargetVisualIds).not.toContain(targetId);

  const mapBox = await page.locator("#map").boundingBox();
  expect(mapBox).not.toBeNull();
  const dragStart = { x: mapBox.x + mapBox.width * 0.58, y: mapBox.y + mapBox.height * 0.48 };
  await page.mouse.move(dragStart.x, dragStart.y);
  await page.mouse.down();
  await page.mouse.move(dragStart.x + 90, dragStart.y + 12, { steps: 8 });
  await page.mouse.up();
  await page.waitForTimeout(250);

  const pannedState = await page.evaluate(() => window.__MAPPA_TEST_API__.getMountainRangeVisualState());
  const pannedAttempt = await page.evaluate(() => window.__MAPPA_TEST_API__.getActivityAttempt());
  expect(Math.hypot(
    pannedState.mapCenter[0] - selectedState.mapCenter[0],
    pannedState.mapCenter[1] - selectedState.mapCenter[1]
  )).toBeGreaterThan(0.01);
  expect(pannedState.selectedTargetId).toBe(targetId);
  expect(pannedState.grabbedAnswerId).toBe("");
  expect(pannedAttempt).toMatchObject({ incorrectPlacements: 0, completedTargetIds: [] });

  await page.mouse.move(dragStart.x, dragStart.y);
  await page.mouse.wheel(240, 0);
  await page.waitForTimeout(250);
  const horizontalWheelState = await page.evaluate(() => window.__MAPPA_TEST_API__.getMountainRangeVisualState());
  expect(Math.hypot(
    horizontalWheelState.mapCenter[0] - pannedState.mapCenter[0],
    horizontalWheelState.mapCenter[1] - pannedState.mapCenter[1]
  )).toBeGreaterThan(0.01);
  expect(horizontalWheelState.selectedTargetId).toBe(targetId);
  expect(await page.evaluate(() => window.__MAPPA_TEST_API__.getActivityAttempt())).toMatchObject({
    incorrectPlacements: 0,
    completedTargetIds: []
  });
  expect(await chip.getAttribute("aria-pressed")).toBe("true");

  const wheelZoomBefore = horizontalWheelState.mapZoom;
  await page.mouse.wheel(0, -240);
  await page.waitForTimeout(350);
  const verticalWheelState = await page.evaluate(() => window.__MAPPA_TEST_API__.getMountainRangeVisualState());
  expect(Math.abs(verticalWheelState.mapZoom - wheelZoomBefore)).toBeGreaterThan(0.01);
  expect(verticalWheelState.selectedTargetId).toBe(targetId);
  expect(await page.evaluate(() => window.__MAPPA_TEST_API__.getActivityAttempt().incorrectPlacements)).toBe(0);

  const zoomBefore = verticalWheelState.mapZoom;
  await page.getByRole("button", { name: "Zoom in" }).click();
  await page.waitForTimeout(250);
  const zoomedState = await page.evaluate(() => window.__MAPPA_TEST_API__.getMountainRangeVisualState());
  expect(zoomedState.mapZoom).toBeGreaterThan(zoomBefore);
  expect(zoomedState.selectedTargetId).toBe(targetId);

  await page.getByRole("button", { name: "Recenter map" }).click();
  await page.waitForTimeout(250);
  const recenteredState = await page.evaluate(() => window.__MAPPA_TEST_API__.getMountainRangeVisualState());
  const correctPoint = recenteredState.targetClientPoints[targetId];
  await page.mouse.click(correctPoint.clientX, correctPoint.clientY);
  await expect.poll(() => page.evaluate((id) => (
    window.__MAPPA_TEST_API__.getActivityAttempt().completedTargetIds.includes(id)
  ), targetId)).toBe(true);

  const nextTargetId = await getVisibleMountainChipTarget(page);
  expect(nextTargetId).not.toBe(targetId);
  await page.locator(`#answer-bank .label-chip[data-id="${nextTargetId}"]`).click();
  const stateBeforeIncorrect = await page.evaluate(() => window.__MAPPA_TEST_API__.getMountainRangeVisualState());
  const completedPoint = stateBeforeIncorrect.targetClientPoints[targetId];
  await page.mouse.click(completedPoint.clientX, completedPoint.clientY);
  await expect.poll(() => page.evaluate(() => window.__MAPPA_TEST_API__.getActivityAttempt().incorrectPlacements)).toBe(1);
  expect(await page.evaluate(() => window.__MAPPA_TEST_API__.getMountainRangeVisualState().selectedTargetId)).toBe(nextTargetId);
  expect(runtimeErrors).toEqual([]);
});
