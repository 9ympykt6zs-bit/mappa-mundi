import { expect, test } from "@playwright/test";
import { unitedStatesMemoryTrailStorageKey } from "../../src/united-states-memory-trail-planner.js";

const approvedUtahArizonaCamera = {
  center: [-109.01691, 37.55051],
  zoom: 4.7034
};

function createProgress() {
  return {
    status: "review",
    memoryState: "review",
    timesSeen: 3,
    correctCount: 3,
    correctStreak: 2,
    missCount: 0,
    lapseCount: 0,
    introducedSession: 1,
    lastSeenSession: 3,
    lastReviewedSession: 3,
    dueSession: 20
  };
}

function createSeededState(itemIds = []) {
  return {
    version: 2,
    trailId: "united-states-memory-trail",
    curriculumVersion: 2,
    hasStarted: itemIds.length > 0,
    currentSessionNumber: 8,
    currentCategory: "states",
    introducedItemIds: [...itemIds],
    itemProgress: Object.fromEntries(itemIds.map((itemId) => [itemId, createProgress()]))
  };
}

async function openGuidedSection(page, sectionId, introducedItemIds = []) {
  if (introducedItemIds.length > 0) {
    await page.addInitScript(({ key, state }) => {
      if (!localStorage.getItem(key)) {
        localStorage.setItem(key, JSON.stringify(state));
      }
    }, {
      key: unitedStatesMemoryTrailStorageKey,
      state: createSeededState(introducedItemIds)
    });
  }
  await page.goto("/?test=1&globeNavigation=off");
  await page.locator("#launch-start-button").click();
  await page.evaluate(() => window.__mappaMundiLoadApp());
  if (await page.locator("#launch-screen").isVisible()) {
    await page.locator("#launch-start-button").click();
  }
  await expect(page.locator("#app-shell-title")).toHaveText("Main Menu");
  await page.evaluate((requestedSectionId) => (
    window.__MAPPA_TEST_API__.startUnitedStatesGuidedLearningAtSection(requestedSectionId)
  ), sectionId);
  await expect.poll(() => page.evaluate(() => (
    window.__MAPPA_TEST_API__.getActiveMemoryTrailState()?.phase
  )), { timeout: 20_000 }).toBe("answering");
}

async function getSettledCameraState(page) {
  await expect.poll(() => page.evaluate(() => (
    window.__MAPPA_TEST_API__.getActiveMemoryTrailState()?.camera?.isMoving
  )), { timeout: 15_000 }).toBe(false);
  return page.evaluate(() => window.__MAPPA_TEST_API__.getActiveMemoryTrailState());
}

async function expectCurrentStateFocus(page, stateTargetId) {
  const state = await getSettledCameraState(page);
  expect(state.guidedPoliticalCamera?.activePromptFocus).toMatchObject({
    stateTargetId,
    minZoom: 4.7,
    cameraContext: "guided-political-state-focus"
  });
  expect(state.guidedPoliticalCamera.activePromptFocus.fittedZoom).toBeCloseTo(state.camera.zoom, 2);
  const stateBounds = state.guidedPoliticalCamera.activePromptFocus.stateBounds;
  const viewportBounds = state.camera.bounds;
  expect(stateBounds).toBeTruthy();
  expect(viewportBounds).toBeTruthy();
  expect(stateBounds[0][0]).toBeGreaterThanOrEqual(viewportBounds[0][0] - 0.001);
  expect(stateBounds[0][1]).toBeGreaterThanOrEqual(viewportBounds[0][1] - 0.001);
  expect(stateBounds[1][0]).toBeLessThanOrEqual(viewportBounds[1][0] + 0.001);
  expect(stateBounds[1][1]).toBeLessThanOrEqual(viewportBounds[1][1] + 0.001);
  return state;
}

test("Utah and Arizona state teaching focuses each current state at the Guided minimum zoom", async ({ page }) => {
  await openGuidedSection(page, "us-states-09", ["state:nevada", "state:california"]);

  let state = await expectCurrentStateFocus(page, "utah");
  expect(state.camera.zoom).toBeGreaterThanOrEqual(4.7 - 0.001);
  expect(state.guidedPoliticalCamera).toMatchObject({
    sectionId: "us-states-09",
    mode: "override",
    cameraSource: "authored-override",
    overrideId: "utah-arizona",
    activeTargetIds: ["utah", "arizona"],
    activeStateIds: ["utah", "arizona"]
  });
  expect(state.currentPromptTargetId).toBe("utah");
  expect(state.camera.center[0]).toBeCloseTo(-111.55, 1);

  await page.evaluate(() => window.__MAPPA_TEST_API__.answerActiveMemoryTrailCorrectly());
  await expect.poll(() => page.evaluate(() => (
    window.__MAPPA_TEST_API__.getActiveMemoryTrailState()?.currentPromptTargetId
  )), { timeout: 10_000 }).toBe("arizona");
  state = await expectCurrentStateFocus(page, "arizona");
  expect(state.camera.zoom).toBeGreaterThanOrEqual(4.7 - 0.001);
  expect(state.camera.center[0]).toBeCloseTo(-111.93, 1);

  const map = page.locator("#map");
  const box = await map.boundingBox();
  expect(box).not.toBeNull();
  await page.mouse.move(box.x + box.width * 0.55, box.y + box.height * 0.48);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.68, box.y + box.height * 0.48, { steps: 8 });
  await page.mouse.up();
  const moved = await getSettledCameraState(page);
  expect(Math.abs(moved.camera.center[0] - approvedUtahArizonaCamera.center[0])).toBeGreaterThan(0.2);

  await page.evaluate(() => window.__MAPPA_TEST_API__.answerActiveMemoryTrailCorrectly());
  await expect.poll(() => page.evaluate(() => (
    window.__MAPPA_TEST_API__.getActiveMemoryTrailState()?.currentPromptTargetId
  )), { timeout: 10_000 }).not.toBe("arizona");
  const afterTransition = await getSettledCameraState(page);
  expect(afterTransition.camera.center[0]).toBeCloseTo(moved.camera.center[0], 1);
  expect(afterTransition.camera.center[1]).toBeCloseTo(moved.camera.center[1], 1);
});

test("Salt Lake City and Phoenix capital teaching focuses each capital's state", async ({ page }) => {
  await openGuidedSection(page, "us-capitals-09", [
    "state:utah",
    "state:arizona",
    "state:nevada",
    "state:california",
    "capital:carson-city-nv",
    "capital:sacramento-ca"
  ]);

  let state = await expectCurrentStateFocus(page, "utah");
  expect(state.camera.zoom).toBeGreaterThanOrEqual(4.7 - 0.001);
  expect(state.guidedPoliticalCamera).toMatchObject({
    sectionId: "us-states-09",
    mode: "override",
    cameraSource: "authored-override",
    activeTargetIds: ["salt-lake-city-ut", "phoenix-az"],
    activeStateIds: ["utah", "arizona"]
  });
  expect(state.currentPromptTargetId).toBe("salt-lake-city-ut");
  expect(state.camera.center[0]).toBeCloseTo(-111.55, 1);
  await expect.poll(() => page.evaluate(() => (
    window.__MAPPA_TEST_API__.getCapitalLocationQuestionVisualState()?.starRenderedIds || []
  ))).toContain("salt-lake-city-ut");

  await page.evaluate(() => window.__MAPPA_TEST_API__.answerActiveMemoryTrailCorrectly());
  await expect.poll(() => page.evaluate(() => (
    window.__MAPPA_TEST_API__.getActiveMemoryTrailState()?.currentPromptTargetId
  )), { timeout: 10_000 }).toBe("phoenix-az");
  state = await expectCurrentStateFocus(page, "arizona");
  expect(state.camera.zoom).toBeGreaterThanOrEqual(4.7 - 0.001);
  expect(state.camera.zoom).toBeGreaterThan(4.5);
  await expect.poll(() => page.evaluate(() => (
    window.__MAPPA_TEST_API__.getCapitalLocationQuestionVisualState()?.starRenderedIds || []
  ))).toContain("phoenix-az");
});

test("a resumed Guided state prompt restores its current-state camera", async ({ page }) => {
  await openGuidedSection(page, "us-states-09", ["state:nevada", "state:california"]);
  const beforeReload = await expectCurrentStateFocus(page, "utah");
  expect(beforeReload.camera.zoom).toBeGreaterThanOrEqual(4.7 - 0.001);

  await page.reload();
  await page.locator("#launch-start-button").click();
  await page.evaluate(() => window.__mappaMundiLoadApp());
  await page.locator("#main-menu-us-memory-trail-button").click();
  await expect.poll(() => page.evaluate(() => (
    window.__MAPPA_TEST_API__.getActiveMemoryTrailState()?.currentPromptTargetId
  )), { timeout: 20_000 }).toBe("utah");
  const resumed = await expectCurrentStateFocus(page, "utah");
  expect(resumed.camera.zoom).toBeGreaterThanOrEqual(4.7 - 0.001);
});

for (const fixture of [
  { sectionId: "us-states-07", expectedTargets: ["minnesota", "north-dakota", "south-dakota"] },
  { sectionId: "us-states-08", expectedTargets: ["kansas", "oklahoma", "texas"] },
  { sectionId: "us-states-10", expectedTargets: ["montana", "idaho", "washington", "oregon"] }
]) {
  test(`${fixture.sectionId} uses active-section context followed by current-state focus`, async ({ page }, testInfo) => {
    await openGuidedSection(page, fixture.sectionId);
    const state = await getSettledCameraState(page);
    expect(state.guidedPoliticalCamera).toMatchObject({
      sectionId: fixture.sectionId,
      mode: "fit",
      cameraSource: "section-fit",
      activeTargetIds: fixture.expectedTargets
    });
    expect(state.guidedPoliticalCamera.activePromptFocus).toMatchObject({
      stateTargetId: fixture.expectedTargets[0],
      minZoom: 4.7
    });
    const bounds = state.guidedPoliticalCamera.fitBounds;
    expect(bounds).not.toBeNull();
    expect(bounds[1][0] - bounds[0][0]).toBeLessThan(35);
    expect(bounds[1][1] - bounds[0][1]).toBeLessThan(25);
    await expectCurrentStateFocus(page, fixture.expectedTargets[0]);
    const needsNarrowViewportFit = ["us-states-07", "us-states-10"].includes(fixture.sectionId)
      && testInfo.project.name === "mobile-chromium";
    if (needsNarrowViewportFit) {
      expect(state.guidedPoliticalCamera.activePromptFocus.minimumZoomApplied).toBe(false);
      expect(state.camera.zoom).toBeGreaterThan(4);
      expect(state.camera.zoom).toBeLessThan(4.7);
    } else {
      expect(state.guidedPoliticalCamera.activePromptFocus.minimumZoomApplied).toBe(true);
      expect(state.camera.zoom).toBeGreaterThanOrEqual(4.7 - 0.001);
    }
  });
}

test("an eastern control section uses the same bounded section-fit policy", async ({ page }) => {
  await openGuidedSection(page, "us-states-01");
  const eastern = await getSettledCameraState(page);
  expect(eastern.guidedPoliticalCamera).toMatchObject({
    sectionId: "us-states-01",
    mode: "fit",
    cameraSource: "section-fit"
  });
  expect(eastern.guidedPoliticalCamera.activePromptFocus?.stateTargetId).toBe("maine");
  expect(eastern.camera.zoom).toBeGreaterThanOrEqual(4.7 - 0.001);
});

test("Alaska and Hawaii retain their existing disconnected-geography handling", async ({ page }) => {
  await openGuidedSection(page, "us-states-11");
  const state = await getSettledCameraState(page);
  expect(state.guidedPoliticalCamera).toMatchObject({
    sectionId: "us-states-11",
    mode: "preserve-special",
    cameraSource: "existing-alaska-hawaii-handling",
    activeTargetIds: ["alaska", "hawaii"]
  });
});

test("manual state activity does not inherit the Guided political camera contract", async ({ page }) => {
  await page.goto("/?test=1&globeNavigation=off");
  await page.locator("#launch-start-button").click();
  await page.evaluate(() => window.__mappaMundiLoadApp());
  if (await page.locator("#launch-screen").isVisible()) {
    await page.locator("#launch-start-button").click();
  }
  await page.evaluate(() => window.__MAPPA_TEST_API__.openStandaloneActivity("us-states-09"));
  await expect.poll(() => page.evaluate(() => (
    window.__MAPPA_TEST_API__.getCurrentActivity()?.id
  ))).toBe("us-states-09");
  expect(await page.evaluate(() => window.__MAPPA_TEST_API__.getActiveMemoryTrailState())).toBeNull();
});
