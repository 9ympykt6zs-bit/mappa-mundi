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

function expectCameraNear(actual, expected, tolerance = {}) {
  expect(actual.center[0]).toBeCloseTo(expected.center[0], tolerance.longitude ?? 2);
  expect(actual.center[1]).toBeCloseTo(expected.center[1], tolerance.latitude ?? 2);
  expect(actual.zoom).toBeCloseTo(expected.zoom, tolerance.zoom ?? 2);
}

test("Utah and Arizona state teaching keeps the approved Guided camera through target changes", async ({ page }) => {
  await openGuidedSection(page, "us-states-09", ["state:nevada", "state:california"]);

  let state = await getSettledCameraState(page);
  expect(state.guidedPoliticalCamera).toMatchObject({
    sectionId: "us-states-09",
    mode: "override",
    cameraSource: "authored-override",
    overrideId: "utah-arizona",
    activeTargetIds: ["utah", "arizona"],
    activeStateIds: ["utah", "arizona"]
  });
  expect(state.guidedPoliticalCamera.activePromptFocus).toBeUndefined();
  expect(state.currentPromptTargetId).toBe("utah");
  expectCameraNear(state.camera, approvedUtahArizonaCamera);

  await page.evaluate(() => window.__MAPPA_TEST_API__.answerActiveMemoryTrailCorrectly());
  await expect.poll(() => page.evaluate(() => (
    window.__MAPPA_TEST_API__.getActiveMemoryTrailState()?.currentPromptTargetId
  )), { timeout: 10_000 }).toBe("arizona");
  state = await getSettledCameraState(page);
  expect(state.guidedPoliticalCamera.activePromptFocus).toBeUndefined();
  expectCameraNear(state.camera, approvedUtahArizonaCamera);

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

test("Salt Lake City and Phoenix capital teaching uses the same approved Guided camera", async ({ page }) => {
  await openGuidedSection(page, "us-capitals-09", [
    "state:utah",
    "state:arizona",
    "state:nevada",
    "state:california",
    "capital:carson-city-nv",
    "capital:sacramento-ca"
  ]);

  let state = await getSettledCameraState(page);
  expect(state.guidedPoliticalCamera).toMatchObject({
    sectionId: "us-states-09",
    mode: "override",
    cameraSource: "authored-override",
    activeTargetIds: ["salt-lake-city-ut", "phoenix-az"],
    activeStateIds: ["utah", "arizona"]
  });
  expect(state.guidedPoliticalCamera.activePromptFocus).toBeUndefined();
  expect(state.currentPromptTargetId).toBe("salt-lake-city-ut");
  expectCameraNear(state.camera, approvedUtahArizonaCamera);
  await expect.poll(() => page.evaluate(() => (
    window.__MAPPA_TEST_API__.getCapitalLocationQuestionVisualState()?.starRenderedIds || []
  ))).toContain("salt-lake-city-ut");

  await page.evaluate(() => window.__MAPPA_TEST_API__.answerActiveMemoryTrailCorrectly());
  await expect.poll(() => page.evaluate(() => (
    window.__MAPPA_TEST_API__.getActiveMemoryTrailState()?.currentPromptTargetId
  )), { timeout: 10_000 }).toBe("phoenix-az");
  state = await getSettledCameraState(page);
  expect(state.guidedPoliticalCamera.activePromptFocus).toBeUndefined();
  expectCameraNear(state.camera, approvedUtahArizonaCamera);
  expect(state.camera.zoom).toBeGreaterThan(4.5);
  await expect.poll(() => page.evaluate(() => (
    window.__MAPPA_TEST_API__.getCapitalLocationQuestionVisualState()?.starRenderedIds || []
  ))).toContain("phoenix-az");
});

test("a resumed Guided state prompt restores its authored contextual camera", async ({ page }) => {
  await openGuidedSection(page, "us-states-09", ["state:nevada", "state:california"]);
  const beforeReload = await getSettledCameraState(page);
  expect(beforeReload.guidedPoliticalCamera.activePromptFocus).toBeUndefined();
  expectCameraNear(beforeReload.camera, approvedUtahArizonaCamera);

  await page.reload();
  await page.locator("#launch-start-button").click();
  await page.evaluate(() => window.__mappaMundiLoadApp());
  await page.locator("#main-menu-us-memory-trail-button").click();
  await expect.poll(() => page.evaluate(() => (
    window.__MAPPA_TEST_API__.getActiveMemoryTrailState()?.currentPromptTargetId
  )), { timeout: 20_000 }).toBe("utah");
  const resumed = await getSettledCameraState(page);
  expect(resumed.guidedPoliticalCamera.activePromptFocus).toBeUndefined();
  expectCameraNear(resumed.camera, approvedUtahArizonaCamera);
});

for (const fixture of [
  { sectionId: "us-states-07", expectedTargets: ["minnesota", "north-dakota", "south-dakota"] },
  { sectionId: "us-states-08", expectedTargets: ["kansas", "oklahoma", "texas"] },
  { sectionId: "us-states-10", expectedTargets: ["montana", "idaho", "washington", "oregon"] }
]) {
  test(`${fixture.sectionId} keeps context and only corrects a measurably distant state`, async ({ page }, testInfo) => {
    await openGuidedSection(page, fixture.sectionId);
    const state = await getSettledCameraState(page);
    expect(state.guidedPoliticalCamera).toMatchObject({
      sectionId: fixture.sectionId,
      mode: "fit",
      cameraSource: "section-fit",
      activeTargetIds: fixture.expectedTargets
    });
    const bounds = state.guidedPoliticalCamera.fitBounds;
    expect(bounds).not.toBeNull();
    expect(bounds[1][0] - bounds[0][0]).toBeLessThan(35);
    expect(bounds[1][1] - bounds[0][1]).toBeLessThan(25);
    const sectionCamera = state.guidedPoliticalCamera.sectionFittedCamera;
    expect(sectionCamera?.zoom).toBeGreaterThan(3.4);
    const focus = state.guidedPoliticalCamera.activePromptFocus;
    if (focus) {
      expect(sectionCamera.zoom).toBeLessThan(4.7);
      expect(focus).toMatchObject({
        stateTargetId: fixture.expectedTargets[0],
        zoomThreshold: 4.7,
        minZoomGain: 0.2,
        sectionZoom: sectionCamera.zoom,
        cameraSource: "guided-political-distant-section-correction"
      });
      expect(state.camera.zoom).toBeGreaterThanOrEqual(sectionCamera.zoom + 0.19);
      expect(state.camera.zoom).toBeLessThanOrEqual(4.7 + 0.001);
      const [stateSouthwest, stateNortheast] = focus.stateBounds;
      const [viewSouthwest, viewNortheast] = state.camera.bounds;
      expect(stateSouthwest[0]).toBeGreaterThanOrEqual(viewSouthwest[0] - 0.001);
      expect(stateSouthwest[1]).toBeGreaterThanOrEqual(viewSouthwest[1] - 0.001);
      expect(stateNortheast[0]).toBeLessThanOrEqual(viewNortheast[0] + 0.001);
      expect(stateNortheast[1]).toBeLessThanOrEqual(viewNortheast[1] + 0.001);
    } else {
      expectCameraNear(state.camera, sectionCamera, { longitude: 0, latitude: 0, zoom: 1 });
    }
    if (fixture.sectionId === "us-states-10" && testInfo.project.name === "mobile-chromium") {
      expect(focus?.stateTargetId).toBe("montana");
    }
  });
}

test("New Hampshire retains its contextual northeastern section camera", async ({ page }) => {
  await openGuidedSection(page, "us-states-01", ["state:maine"]);
  const eastern = await getSettledCameraState(page);
  expect(eastern.guidedPoliticalCamera).toMatchObject({
    sectionId: "us-states-01",
    mode: "fit",
    cameraSource: "section-fit"
  });
  expect(eastern.currentPromptTargetId).toBe("new-hampshire");
  expect(eastern.guidedPoliticalCamera.activePromptFocus).toBeUndefined();
  expectCameraNear(eastern.camera, eastern.guidedPoliticalCamera.sectionFittedCamera, {
    longitude: 0,
    latitude: 0,
    zoom: 1
  });
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
