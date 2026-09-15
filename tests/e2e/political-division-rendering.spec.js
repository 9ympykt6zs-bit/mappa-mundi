import { expect, test } from "@playwright/test";

async function openLearnYourWorld(page) {
  await page.goto("/?test=1&globeNavigation=off");
  const launchButton = page.getByRole("button", { name: "Start Playing" });
  if (await launchButton.isVisible()) {
    await launchButton.click();
  }
  await page.getByRole("button", { name: "More Ways to Learn" }).click();
  await page.getByRole("button", { name: /Learn Your World/ }).click();
  await page.getByRole("button", { name: "Choose Journey", exact: true }).click();
}

async function openPoliticalDivisionSection(page, { country, sectionTitle, activityId }) {
  await openLearnYourWorld(page);
  await page.getByRole("button", { name: `Select ${country}` }).click();
  const section = page.getByRole("article").filter({ hasText: sectionTitle });
  await section.getByRole("button", { name: "Guided Learning" }).click();
  await expect.poll(
    () => page.evaluate(() => window.__MAPPA_TEST_API__?.getCurrentActivity()?.id),
    { timeout: 20_000 }
  ).toBe(activityId);
  await expect(page.getByRole("dialog", { name: "Try Guided Learning?" })).toBeVisible();
}

async function politicalDivisionState(page) {
  return page.evaluate(() => window.__MAPPA_TEST_API__.getPoliticalDivisionVisualState());
}

async function waitForGuidedHighlight(page, targetId) {
  await expect.poll(async () => {
    const state = await politicalDivisionState(page);
    return {
      targetId: state?.currentPromptTargetId,
      highlightIds: state?.highlightFeatureIds,
      fillVisibility: state?.highlightFillVisibility,
      lineVisibility: state?.highlightLineVisibility,
      cameraSettled: !state?.camera?.isMoving && !state?.camera?.isEasing
    };
  }, { timeout: 12_000 }).toEqual({
    targetId,
    highlightIds: [targetId],
    fillVisibility: "visible",
    lineVisibility: "visible",
    cameraSettled: true
  });
}

function expectPointInsideMap(point, mapRect, targetId = "target") {
  expect(point).toBeTruthy();
  expect(point.clientX, `${targetId} should be inside the map's left edge`).toBeGreaterThanOrEqual(mapRect.left);
  expect(point.clientX, `${targetId} should be inside the map's right edge`).toBeLessThanOrEqual(mapRect.right);
  expect(point.clientY, `${targetId} should be inside the map's top edge`).toBeGreaterThanOrEqual(mapRect.top);
  expect(point.clientY, `${targetId} should be inside the map's bottom edge`).toBeLessThanOrEqual(mapRect.bottom);
}

test("France renders full context while Southern Regions remains the only eligible and hittable set", async ({ page }) => {
  await openPoliticalDivisionSection(page, {
    country: "France",
    sectionTitle: "France: Southern Regions",
    activityId: "france-southern-regions-political-divisions"
  });

  await expect.poll(async () => (await politicalDivisionState(page))?.contextFeatureCount).toBe(13);
  const beforeTrail = await politicalDivisionState(page);
  expect(beforeTrail.eligibleFeatureCount).toBe(5);
  expect(beforeTrail.contextFeatureIds).toContain("brittany");
  expect(beforeTrail.eligibleFeatureIds).not.toContain("brittany");

  await page.getByRole("button", { name: "Start Guided Learning" }).click();
  await waitForGuidedHighlight(page, "nouvelle-aquitaine");
  const guided = await politicalDivisionState(page);
  expect(guided.highlightFeatureIds).toEqual(["nouvelle-aquitaine"]);
  expect(guided.highlightFillVisibility).toBe("visible");
  expect(guided.highlightLineVisibility).toBe("visible");
  expect(guided.highlightFillPaint).toBe("#f5c542");
  expect(guided.highlightLinePaint).toBe("#9a5f05");

  const nonCurrentPoint = guided.contextClientPoints.brittany;
  expectPointInsideMap(nonCurrentPoint, guided.mapRect, "brittany");
  expect(guided.contextHitIds.brittany).toEqual([]);
  await page.mouse.click(nonCurrentPoint.clientX, nonCurrentPoint.clientY);
  const afterNonCurrentClick = await politicalDivisionState(page);
  expect(afterNonCurrentClick.currentPromptTargetId).toBe("nouvelle-aquitaine");
  expect(afterNonCurrentClick.currentPromptPhase).toBe("answering");
  expect(afterNonCurrentClick.targetStats["nouvelle-aquitaine"].guidedTapCount).toBe(0);
  expect(afterNonCurrentClick.incorrectCount).toBe(0);

  const correctPoint = afterNonCurrentClick.targetClientPoints["nouvelle-aquitaine"];
  expectPointInsideMap(correctPoint, afterNonCurrentClick.mapRect, "nouvelle-aquitaine");
  expect(afterNonCurrentClick.targetHitIds["nouvelle-aquitaine"]).toContain("nouvelle-aquitaine");
  await page.mouse.click(correctPoint.clientX, correctPoint.clientY);
  await expect.poll(async () => (await politicalDivisionState(page))?.currentPromptPhase).toBe("feedback");
});

for (const fixture of [
  {
    country: "Italy",
    sectionTitle: "Italy: Northern Regions",
    activityId: "italy-northern-regions-political-divisions",
    contextCount: 20,
    eligibleCount: 8,
    expectedFirstTargetId: "aosta-valley",
    nonCurrentTargetId: "sicily"
  },
  {
    country: "Germany",
    sectionTitle: "Germany: North & East",
    activityId: "germany-north-east-political-divisions",
    contextCount: 16,
    eligibleCount: 10,
    expectedFirstTargetId: "schleswig-holstein",
    nonCurrentTargetId: "bavaria"
  }
]) {
  test(`${fixture.country} reuses full-country context and dedicated guided highlights`, async ({ page }) => {
    await openPoliticalDivisionSection(page, fixture);
    await expect.poll(async () => (await politicalDivisionState(page))?.contextFeatureCount).toBe(fixture.contextCount);
    const beforeTrail = await politicalDivisionState(page);
    expect(beforeTrail.eligibleFeatureCount).toBe(fixture.eligibleCount);
    expect(beforeTrail.contextFeatureIds).toContain(fixture.nonCurrentTargetId);
    expect(beforeTrail.eligibleFeatureIds).not.toContain(fixture.nonCurrentTargetId);

    await page.getByRole("button", { name: "Start Guided Learning" }).click();
    await waitForGuidedHighlight(page, fixture.expectedFirstTargetId);
    const guided = await politicalDivisionState(page);
    expect(guided.highlightFeatureIds).toEqual([fixture.expectedFirstTargetId]);
    expect(guided.highlightFillVisibility).toBe("visible");
    expect(guided.highlightLineVisibility).toBe("visible");
    expectPointInsideMap(guided.targetClientPoints[fixture.expectedFirstTargetId], guided.mapRect, fixture.expectedFirstTargetId);
  });
}
