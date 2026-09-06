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
  await chip.locator("button[aria-label^=\"Hear \"], [role=\"button\"][aria-label^=\"Hear \"]").click({ force: true });
  await expect.poll(() => page.evaluate(() => (
    window.__MAPPA_TEST_API__.getCapitalLocationQuestionVisualState()
  ))).toMatchObject({
    active: true,
    targetId,
    phase: "answering",
    dragPanEnabled: true,
    scrollZoomEnabled: true
  });
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

test("capital-location dots stay visually neutral while zooming, panning, and selecting a same-state city", async ({ page }, testInfo) => {
  await openStandaloneCapitalActivity(page);
  await selectCapital(page, "baton-rouge-la");
  const answering = await panChoiceIntoView(page, "louisiana", "Baton Rouge");
  const louisiana = answering.choices.filter(({ stateId }) => stateId === "louisiana");

  expect(answering.choices).toHaveLength(150);
  expect(louisiana.map(({ name }) => name)).toEqual(["Baton Rouge", "New Orleans", "Shreveport"]);
  if (testInfo.project.name === "desktop-chromium") {
    expect(answering.markerRenderedIds).toEqual(expect.arrayContaining(louisiana.map(({ id }) => id)));
    expect(answering.hitRenderedIds).toEqual(expect.arrayContaining(louisiana.map(({ id }) => id)));
  }
  expect(answering.starRenderedIds).toEqual([]);
  expect(answering.labelRenderedIds).toEqual([]);
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
  for (const choice of louisiana) {
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

  await clickChoice(page, "louisiana", "Shreveport");
  await expect(page.locator("#feedback")).toHaveText(
    "You chose Shreveport. The correct answer was Baton Rouge."
  );
  if (testInfo.project.name === "desktop-chromium") {
    await expect.poll(() => page.evaluate(() => (
      window.__MAPPA_TEST_API__.getCapitalLocationQuestionVisualState().starRenderedIds
    ))).toContain("baton-rouge-la");
  }
  const feedback = await page.evaluate(() => (
    window.__MAPPA_TEST_API__.getCapitalLocationQuestionVisualState()
  ));
  expect(feedback.phase).toBe("feedback");
  expect(feedback.choices.filter(({ revealLabel }) => revealLabel).map(({ name }) => name)).toEqual([
    "Baton Rouge", "New Orleans", "Shreveport"
  ]);
  if (testInfo.project.name === "desktop-chromium") {
    expect(feedback.starRenderedIds).toContain("baton-rouge-la");
    const louisianaIds = feedback.choices
      .filter(({ stateId }) => stateId === "louisiana")
      .map(({ id }) => id);
    await expect.poll(() => page.evaluate(() => (
      window.__MAPPA_TEST_API__.getCapitalLocationQuestionVisualState().labelRenderedIds
    ))).toEqual(expect.arrayContaining(louisianaIds));
  }
  expect(feedback.starIconImage).toBe("mappa-state-capital-star");
  expect(feedback.labelTextSize).toEqual([
    "case", ["==", ["get", "capitalLocationRole"], "capital"], 14, 12
  ]);
});

test("capital-location feedback identifies a correct choice and reveals all target-state cities", async ({ page }) => {
  await openStandaloneCapitalActivity(page);
  await selectCapital(page, "baton-rouge-la");
  await clickChoice(page, "louisiana", "Baton Rouge");
  await expect(page.locator("#feedback")).toHaveText(
    "Correct. Baton Rouge is the capital of Louisiana."
  );
  const correct = await page.evaluate(() => (
    window.__MAPPA_TEST_API__.getCapitalLocationQuestionVisualState()
  ));
  expect(correct.choices.filter(({ revealLabel }) => revealLabel)).toHaveLength(3);
  expect(correct.choices.filter(({ revealCapital }) => revealCapital).map(({ name }) => name)).toEqual([
    "Baton Rouge"
  ]);
});

test("capital-location feedback names a wrong-state city and keeps target-state labels", async ({ page }) => {
  await openStandaloneCapitalActivity(page);
  await selectCapital(page, "baton-rouge-la");
  await clickChoice(page, "alabama", "Birmingham");
  await expect(page.locator("#feedback")).toHaveText(
    "You chose Birmingham. The correct answer was Baton Rouge."
  );
  const wrongState = await page.evaluate(() => (
    window.__MAPPA_TEST_API__.getCapitalLocationQuestionVisualState()
  ));
  const revealedNames = wrongState.choices.filter(({ revealLabel }) => revealLabel).map(({ name }) => name);
  expect(revealedNames).toHaveLength(4);
  expect(revealedNames).toEqual(expect.arrayContaining([
    "Baton Rouge", "New Orleans", "Shreveport", "Birmingham"
  ]));
  expect(wrongState.choices.filter(({ revealCapital }) => revealCapital).map(({ name }) => name)).toEqual([
    "Baton Rouge"
  ]);
});
