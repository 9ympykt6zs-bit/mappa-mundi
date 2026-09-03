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
      localStorage.setItem(key, JSON.stringify(state));
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
  expect(state.currentPromptTargetId).toBe("utah");
  expectCameraNear(state.camera, approvedUtahArizonaCamera);

  await page.evaluate(() => window.__MAPPA_TEST_API__.answerActiveMemoryTrailCorrectly());
  await expect.poll(() => page.evaluate(() => (
    window.__MAPPA_TEST_API__.getActiveMemoryTrailState()?.currentPromptTargetId
  )), { timeout: 10_000 }).toBe("arizona");
  state = await getSettledCameraState(page);
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
  expect(state.currentPromptTargetId).toBe("salt-lake-city-ut");
  expectCameraNear(state.camera, approvedUtahArizonaCamera);
  await expect.poll(() => page.evaluate(() => (
    window.__MAPPA_TEST_API__.getCapitalMarkerVisualState()?.star.renderedTargetIds || []
  ))).toContain("salt-lake-city-ut");

  await page.evaluate(() => window.__MAPPA_TEST_API__.answerActiveMemoryTrailCorrectly());
  await expect.poll(() => page.evaluate(() => (
    window.__MAPPA_TEST_API__.getActiveMemoryTrailState()?.currentPromptTargetId
  )), { timeout: 10_000 }).toBe("phoenix-az");
  state = await getSettledCameraState(page);
  expectCameraNear(state.camera, approvedUtahArizonaCamera);
  expect(state.camera.zoom).toBeGreaterThan(4.5);
  await expect.poll(() => page.evaluate(() => (
    window.__MAPPA_TEST_API__.getCapitalMarkerVisualState()?.star.renderedTargetIds || []
  ))).toContain("phoenix-az");
});

for (const fixture of [
  { sectionId: "us-states-07", expectedTargets: ["minnesota", "north-dakota", "south-dakota"] },
  { sectionId: "us-states-08", expectedTargets: ["kansas", "oklahoma", "texas"] },
  { sectionId: "us-states-10", expectedTargets: ["montana", "idaho", "washington", "oregon"] }
]) {
  test(`${fixture.sectionId} uses active-section fit instead of a broad national fallback`, async ({ page }) => {
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
    expect(state.camera.zoom).toBeGreaterThan(3.4);
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
  expect(eastern.camera.zoom).toBeGreaterThan(4.5);
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
