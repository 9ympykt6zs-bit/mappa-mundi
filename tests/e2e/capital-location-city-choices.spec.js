import { expect, test } from "@playwright/test";

async function openStandaloneCapitalActivity(page, activityId = "us-capitals-04") {
  await page.goto("/?test=1&globeNavigation=off");
  await page.locator("#launch-start-button").click();
  await page.evaluate(() => window.__mappaMundiLoadApp());
  if (await page.locator("#launch-screen").isVisible()) {
    await page.locator("#launch-start-button").click();
  }
  await expect(page.locator("#app-shell-title")).toHaveText("Main Menu");
  await page.evaluate((id) => (
    window.__MAPPA_TEST_API__.openStandaloneActivity(id, "medium", "sectionOnly")
  ), activityId);
  await expect.poll(() => page.evaluate(() => (
    window.__MAPPA_TEST_API__.getCurrentActivity()?.id
  ))).toBe(activityId);
}

async function selectCapital(page, targetId) {
  const chip = page.locator(`#answer-bank .label-chip[data-id="${targetId}"]`);
  const speaker = chip.locator("button[aria-label^=\"Hear \"], [role=\"button\"][aria-label^=\"Hear \"]");
  await expect(chip).toBeVisible();
  await expect(speaker).toBeVisible();
  await expect.poll(() => page.evaluate(() => (
    window.maplibrePocMap?.isStyleLoaded?.() && !window.maplibrePocMap?.isMoving?.()
  ))).toBe(true);
  for (let attempt = 0; attempt < 3; attempt += 1) {
    await speaker.press("Enter");
    const selected = await expect.poll(() => page.evaluate((id) => {
      const state = window.__MAPPA_TEST_API__.getCapitalLocationQuestionVisualState();
      return state.active && state.targetId === id && state.phase === "answering";
    }, targetId), { timeout: 5_000 }).toBe(true).then(() => true, () => false);
    if (selected) break;
    if (attempt === 2) {
      const visualState = await page.evaluate(() => window.__MAPPA_TEST_API__.getCapitalLocationQuestionVisualState());
      throw new Error(`${targetId} could not be selected: ${JSON.stringify({
        active: visualState.active,
        targetId: visualState.targetId,
        phase: visualState.phase
      })}`);
    }
    const alternateSpeaker = page.locator(`#answer-bank .label-chip[data-id]:not([data-id="${targetId}"])`)
      .first()
      .locator("button[aria-label^=\"Hear \"], [role=\"button\"][aria-label^=\"Hear \"]");
    await alternateSpeaker.press("Enter");
    await expect.poll(() => page.evaluate((id) => (
      window.__MAPPA_TEST_API__.getCapitalLocationQuestionVisualState().targetId !== id
    ), targetId), { timeout: 2_000 }).toBe(true);
  }
  await expect.poll(() => page.evaluate(() => {
    const state = window.__MAPPA_TEST_API__.getCapitalLocationQuestionVisualState();
    return {
      dragPanEnabled: state.dragPanEnabled,
      scrollZoomEnabled: state.scrollZoomEnabled
    };
  })).toEqual({ dragPanEnabled: true, scrollZoomEnabled: true });
  await page.evaluate(() => new Promise((resolve) => {
    window.requestAnimationFrame(() => window.requestAnimationFrame(resolve));
  }));
  return page.evaluate(() => window.__MAPPA_TEST_API__.getCapitalLocationQuestionVisualState());
}

function getChoice(state, stateId, name) {
  const choice = state.choices.find((candidate) => (
    candidate.stateId === stateId && candidate.name === name
  ));
  expect(choice, `${name}, ${stateId}`).toBeTruthy();
  return choice;
}

async function clickChoice(page, stateId, name) {
  const state = await panChoiceIntoView(page, stateId, name);
  const choice = getChoice(state, stateId, name);
  expect(choice.clientPoint).toBeTruthy();
  await page.mouse.click(choice.clientPoint.clientX, choice.clientPoint.clientY);
}

async function panChoiceIntoView(page, stateId, name) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const state = await page.evaluate(() => window.__MAPPA_TEST_API__.getCapitalLocationQuestionVisualState());
    const choice = getChoice(state, stateId, name);
    const clientPoint = choice.clientPoint;
    const mapRect = state.mapRect;
    const padding = 36;
    if (
      clientPoint
      && clientPoint.clientX >= mapRect.left + padding
      && clientPoint.clientX <= mapRect.right - padding
      && clientPoint.clientY >= mapRect.top + padding
      && clientPoint.clientY <= mapRect.bottom - padding
    ) {
      await expect.poll(() => page.evaluate(() => (
        window.maplibrePocMap?.isStyleLoaded?.() && !window.maplibrePocMap?.isMoving?.()
      ))).toBe(true);
      await page.evaluate(() => new Promise((resolve) => {
        window.requestAnimationFrame(() => window.requestAnimationFrame(resolve));
      }));
      return page.evaluate(() => window.__MAPPA_TEST_API__.getCapitalLocationQuestionVisualState());
    }

    const start = {
      x: mapRect.left + mapRect.width / 2,
      y: mapRect.top + mapRect.height / 2
    };
    const clamp = (value) => Math.max(-180, Math.min(180, value));
    await page.mouse.move(start.x, start.y);
    await page.mouse.down();
    await page.mouse.move(
      start.x + clamp(start.x - clientPoint.clientX),
      start.y + clamp(start.y - clientPoint.clientY),
      { steps: 8 }
    );
    await page.mouse.up();
  }

  throw new Error(`${name}, ${stateId} could not be panned into the visible map`);
}

function rectsOverlap(left, right, gutter = 0) {
  return left.x - gutter / 2 < right.right + gutter / 2
    && left.right + gutter / 2 > right.x - gutter / 2
    && left.y - gutter / 2 < right.bottom + gutter / 2
    && left.bottom + gutter / 2 > right.y - gutter / 2;
}

async function expectFeedbackLabelLayout(page, expectedCount) {
  await expect.poll(() => page.evaluate(() => {
    const layout = window.__MAPPA_TEST_API__.getCapitalLocationQuestionVisualState()?.feedbackLabelLayout;
    return { ready: layout?.ready, count: layout?.placements?.length || 0 };
  })).toEqual({ ready: true, count: expectedCount });
  const state = await page.evaluate(() => window.__MAPPA_TEST_API__.getCapitalLocationQuestionVisualState());
  const layout = state.feedbackLabelLayout;
  expect(layout.visible).toBe(true);
  expect(layout.placements[0].role).toBe("capital");
  const markerRadius = (zoom) => {
    if (zoom <= 3) return 4.5;
    if (zoom <= 7) return 4.5 + ((zoom - 3) / 4) * 2;
    if (zoom <= 10) return 6.5 + ((zoom - 7) / 3) * 1.5;
    return 8;
  };
  const revealedChoices = state.choices.filter(({ revealLabel }) => revealLabel);
  for (const [index, placement] of layout.placements.entries()) {
    expect(placement.box.x).toBeGreaterThanOrEqual(9);
    expect(placement.box.y).toBeGreaterThanOrEqual(9);
    expect(placement.box.right).toBeLessThanOrEqual(layout.viewport.width - 9);
    expect(placement.box.bottom).toBeLessThanOrEqual(layout.viewport.height - 9);
    if (placement.role !== "capital") {
      expect(rectsOverlap(placement.box, layout.capitalStarRect, 2), placement.id).toBe(false);
    }
    for (const prior of layout.placements.slice(0, index)) {
      expect(rectsOverlap(placement.box, prior.box, 4), `${placement.id} / ${prior.id}`).toBe(false);
    }
    for (const choice of revealedChoices.filter(({ id }) => id !== placement.id)) {
      const radius = choice.revealCapital ? 18 : markerRadius(state.mapZoom);
      const markerBox = {
        x: choice.clientPoint.x - radius,
        y: choice.clientPoint.y - radius,
        right: choice.clientPoint.x + radius,
        bottom: choice.clientPoint.y + radius
      };
      expect(rectsOverlap(placement.box, markerBox, 1), `${placement.id} / marker ${choice.id}`).toBe(false);
    }
    expect(placement.leader, placement.id).toBeTruthy();
    const labelBox = await page.locator(`.capital-location-feedback-label[data-choice-id="${placement.id}"]`).boundingBox();
    expect(labelBox).toBeTruthy();
    await expect(page.locator(`.capital-location-feedback-leader--line[data-choice-id="${placement.id}"]`)).toHaveCount(1);
    expect(Math.abs(labelBox.x - state.mapRect.left - placement.box.x)).toBeLessThan(1.5);
    expect(Math.abs(labelBox.y - state.mapRect.top - placement.box.y)).toBeLessThan(1.5);
  }
  await expect(page.locator(".capital-location-feedback-leader--line")).toHaveCount(
    layout.placements.length
  );
  return state;
}

test("Colorado capital-location dots stay neutral and feedback labels remain collision-free through map transforms", async ({ page }, testInfo) => {
  await openStandaloneCapitalActivity(page, "us-capitals-08");
  await selectCapital(page, "denver-co");
  const answering = await panChoiceIntoView(page, "colorado", "Denver");
  const colorado = answering.choices.filter(({ stateId }) => stateId === "colorado");
  const authoredCoordinates = Object.fromEntries(colorado.map(({ id, lon, lat }) => [id, [lon, lat]]));

  expect(answering.choices).toHaveLength(150);
  expect(colorado.map(({ name }) => name)).toEqual(["Denver", "Colorado Springs", "Aurora"]);
  if (testInfo.project.name === "desktop-chromium") {
    expect(answering.markerRenderedIds).toEqual(expect.arrayContaining(colorado.map(({ id }) => id)));
    expect(answering.hitRenderedIds).toEqual(expect.arrayContaining(colorado.map(({ id }) => id)));
  }
  expect(answering.starRenderedIds).toEqual([]);
  expect(answering.labelRenderedIds).toEqual([]);
  expect(answering.feedbackLabelLayout).toMatchObject({ visible: false, placements: [] });
  await expect(page.locator(".capital-location-feedback-label")).toHaveCount(0);
  await expect(page.locator(".capital-location-feedback-leader--line")).toHaveCount(0);
  expect(answering.markerRadius).toEqual(["interpolate", ["linear"], ["zoom"], 3, 4.5, 7, 6.5, 10, 8]);
  expect(answering.hitRadius).toEqual(["interpolate", ["linear"], ["zoom"], 3, 12, 7, 16, 10, 18]);
  expect(JSON.stringify(answering.markerColor)).not.toContain("capitalLocationRole");
  expect(JSON.stringify(answering.markerColor)).not.toContain("feature-state");
  expect(answering.choices.every(({ revealLabel, revealCapital, isSelected }) => (
    !revealLabel && !revealCapital && !isSelected
  ))).toBe(true);
  expect(answering.choices.every(({ sourceProperties }) => (
    sourceProperties
    && !("conceptId" in sourceProperties)
    && !("targetId" in sourceProperties)
    && !("population2020" in sourceProperties)
  ))).toBe(true);

  const canvas = page.locator(".maplibregl-canvas");
  for (const choice of colorado) {
    await page.mouse.move(choice.clientPoint.clientX, choice.clientPoint.clientY);
    await expect.poll(() => canvas.evaluate((element) => element.style.cursor)).toBe("");
  }

  const zoomBefore = answering.mapZoom;
  await page.mouse.move(
    answering.mapRect.left + answering.mapRect.width * 0.7,
    answering.mapRect.top + answering.mapRect.height * 0.5
  );
  await page.mouse.wheel(0, -600);
  await expect.poll(() => page.evaluate(() => (
    window.__MAPPA_TEST_API__.getCapitalLocationQuestionVisualState().mapZoom
  ))).toBeGreaterThan(zoomBefore + 0.05);

  const beforePan = await page.evaluate(() => (
    window.__MAPPA_TEST_API__.getCapitalLocationQuestionVisualState()
  ));
  const panStart = {
    x: beforePan.mapRect.left + beforePan.mapRect.width * 0.7,
    y: beforePan.mapRect.top + beforePan.mapRect.height * 0.42
  };
  await page.mouse.move(panStart.x, panStart.y);
  await page.mouse.down();
  await page.mouse.move(panStart.x + 70, panStart.y + 35, { steps: 8 });
  await page.mouse.up();
  await expect.poll(() => page.evaluate(() => (
    window.__MAPPA_TEST_API__.getCapitalLocationQuestionVisualState().mapCenter
  ))).not.toEqual(beforePan.mapCenter);

  await clickChoice(page, "colorado", "Aurora");
  await expect(page.locator("#feedback")).toHaveText(
    "You chose Aurora. The correct answer was Denver."
  );
  if (testInfo.project.name === "desktop-chromium") {
    await expect.poll(() => page.evaluate(() => (
      window.__MAPPA_TEST_API__.getCapitalLocationQuestionVisualState().starRenderedIds
    ))).toContain("denver-co");
  }
  let feedback = await expectFeedbackLabelLayout(page, 3);
  expect(feedback.phase).toBe("feedback");
  expect(feedback.choices.filter(({ revealLabel }) => revealLabel).map(({ name }) => name)).toEqual([
    "Denver", "Colorado Springs", "Aurora"
  ]);
  if (testInfo.project.name === "desktop-chromium") {
    expect(feedback.starRenderedIds).toContain("denver-co");
  }
  expect(feedback.labelRenderedIds).toEqual([]);
  expect(feedback.choices.filter(({ stateId }) => stateId === "colorado").every(({ id, lon, lat }) => (
    authoredCoordinates[id][0] === lon && authoredCoordinates[id][1] === lat
  ))).toBe(true);
  expect(feedback.feedbackLabelLayout.placements.find(({ id }) => id.includes("city-2"))?.isSelected).toBe(true);
  await expect(page.locator('.capital-location-feedback-label[data-selected="true"]')).toHaveText("Aurora");
  expect(feedback.starIconImage).toBe("mappa-state-capital-star");
  expect(feedback.labelTextSize).toEqual([
    "case", ["==", ["get", "capitalLocationRole"], "capital"], 14, 12
  ]);

  const layoutBeforePostAnswerMove = feedback.feedbackLabelLayout;
  await page.mouse.wheel(0, -350);
  await page.evaluate(() => window.maplibrePocMap.panBy([45, -22], { duration: 0 }));
  await expect.poll(() => page.evaluate(() => window.maplibrePocMap.isMoving())).toBe(false);
  feedback = await expectFeedbackLabelLayout(page, 3);
  expect(feedback.feedbackLabelLayout.placements.map(({ point }) => point)).not.toEqual(
    layoutBeforePostAnswerMove.placements.map(({ point }) => point)
  );
  const screenshotPath = testInfo.outputPath("colorado-capital-location-feedback.png");
  await page.screenshot({ path: screenshotPath });
  await testInfo.attach("Colorado collision-aware labels", { path: screenshotPath, contentType: "image/png" });
});

test("capital-location feedback connects every revealed city across a large state", async ({ page }, testInfo) => {
  await openStandaloneCapitalActivity(page, "us-capitals-08");
  await selectCapital(page, "austin-tx");
  await clickChoice(page, "texas", "Austin");
  await expect(page.locator("#feedback")).toHaveText(
    "Correct. Austin is the capital of Texas."
  );
  const correct = await expectFeedbackLabelLayout(page, 3);
  expect(correct.choices.filter(({ revealLabel }) => revealLabel)).toHaveLength(3);
  expect(correct.choices.filter(({ revealCapital }) => revealCapital).map(({ name }) => name)).toEqual([
    "Austin"
  ]);
  expect(correct.feedbackLabelLayout.placements.every(({ leader }) => leader)).toBe(true);
  expect(correct.completedLabelTargetIds).not.toContain("austin-tx");
  await page.screenshot({ path: testInfo.outputPath("texas-capital-location-feedback.png") });
});

test("capital-location feedback names a wrong-state city and keeps Delaware labels", async ({ page }) => {
  await openStandaloneCapitalActivity(page, "us-capitals-02");
  await selectCapital(page, "dover-de");
  await clickChoice(page, "alabama", "Birmingham");
  await expect(page.locator("#feedback")).toHaveText(
    "You chose Birmingham. The correct answer was Dover."
  );
  const wrongState = await expectFeedbackLabelLayout(page, 4);
  const revealedNames = wrongState.choices.filter(({ revealLabel }) => revealLabel).map(({ name }) => name);
  expect(revealedNames).toHaveLength(4);
  expect(revealedNames).toEqual(expect.arrayContaining([
    "Dover", "Wilmington", "Newark", "Birmingham"
  ]));
  expect(wrongState.choices.filter(({ revealCapital }) => revealCapital).map(({ name }) => name)).toEqual([
    "Dover"
  ]);
  expect(wrongState.feedbackLabelLayout.placements[1]).toMatchObject({ isSelected: true });
  await expect(page.locator('.capital-location-feedback-label[data-selected="true"]')).toHaveText("Birmingham");
});

for (const fixture of [
  { stateId: "connecticut", activityId: "us-capitals-01", targetId: "hartford-ct", selectedCity: "Stamford" },
  { stateId: "rhode-island", activityId: "us-capitals-01", targetId: "providence-ri", selectedCity: "Cranston" }
]) {
  test(`${fixture.stateId} feedback keeps tightly clustered city labels attributable`, async ({ page }, testInfo) => {
    await openStandaloneCapitalActivity(page, fixture.activityId);
    await selectCapital(page, fixture.targetId);
    await clickChoice(page, fixture.stateId, fixture.selectedCity);
    const feedback = await expectFeedbackLabelLayout(page, 3);
    expect(feedback.choices.filter(({ revealLabel, stateId }) => revealLabel && stateId === fixture.stateId)).toHaveLength(3);
    const screenshotPath = testInfo.outputPath(`${fixture.stateId}-capital-location-feedback.png`);
    await page.screenshot({ path: screenshotPath });
    await testInfo.attach(`${fixture.stateId} collision-aware labels`, { path: screenshotPath, contentType: "image/png" });
  });
}
