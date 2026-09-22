import { expect, test } from "@playwright/test";
import { CANONICAL_EVIDENCE_REPOSITORY_STORAGE_KEY } from "../../src/canonical-learning-evidence-repository.js";
import { unitedStatesMemoryTrailStorageKey } from "../../src/united-states-memory-trail-planner.js";
import { getUsCapitalLocationCityChoicesForCapital } from "../../src/atlas/us-capital-location-city-choices.js";

function createProgress(status = "review") {
  return {
    status,
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

function createCapitalTeachingState({ stateIds, completedCapitalIds }) {
  const stateItemIds = stateIds.map((stateId) => `state:${stateId}`);
  const capitalItemIds = completedCapitalIds.map((capitalId) => `capital:${capitalId}`);
  return {
    version: 2,
    trailId: "united-states-memory-trail",
    curriculumVersion: 2,
    hasStarted: true,
    currentSessionNumber: 8,
    currentCategory: "states",
    introducedItemIds: [...stateItemIds, ...capitalItemIds],
    itemProgress: Object.fromEntries([
      ...stateItemIds.map((itemId) => [itemId, createProgress()]),
      ...capitalItemIds.map((itemId) => [itemId, createProgress()])
    ])
  };
}

async function openSeededCapitalTeaching(page, { sectionId, stateIds, completedCapitalIds }) {
  const trailState = createCapitalTeachingState({ stateIds, completedCapitalIds });
  await page.addInitScript(({ storageKey, state }) => {
    if (!localStorage.getItem(storageKey)) localStorage.setItem(storageKey, JSON.stringify(state));
  }, {
    storageKey: unitedStatesMemoryTrailStorageKey,
    state: trailState
  });
  await page.goto("/?test=1&globeNavigation=off");
  await page.locator("#launch-start-button").click();
  await page.evaluate(() => window.__mappaMundiLoadApp());
  if (await page.locator("#launch-screen").isVisible()) {
    await page.locator("#launch-start-button").click();
  }
  await expect(page.locator("#app-shell-title")).toHaveText("Main Menu");
  await page.evaluate((targetSectionId) => (
    window.__MAPPA_TEST_API__.startUnitedStatesGuidedLearningAtSection(targetSectionId)
  ), sectionId);
}

async function waitForCapitalPrompt(page, targetId, promptType = "guided") {
  await expect.poll(() => page.evaluate(() => (
    window.__MAPPA_TEST_API__.getActiveMemoryTrailState()
  )), { timeout: 20_000 }).toMatchObject({
    phase: "answering",
    currentPromptTargetId: targetId,
    currentPromptType: promptType
  });
  await expect.poll(() => page.evaluate((type) => {
    const state = window.__MAPPA_TEST_API__.getCapitalLocationQuestionVisualState();
    return {
      targetId: state?.targetId || "",
      phase: state?.phase || "",
      choiceCount: state?.choices?.length || 0
    };
  }, promptType)).toMatchObject({
    targetId,
    phase: promptType === "guided" ? "teaching" : "answering",
    choiceCount: promptType === "guided" ? 3 : 150
  });
  await expect.poll(() => page.evaluate((type) => {
    const state = window.__MAPPA_TEST_API__.getCapitalLocationQuestionVisualState();
    return type === "guided"
      ? state?.starRenderedIds || []
      : state?.markerRenderedIds || [];
  }, promptType), { timeout: 15_000 }).toContain(targetId);
  return page.evaluate(() => window.__MAPPA_TEST_API__.getCapitalLocationQuestionVisualState());
}

async function advanceToCapitalLocationPrompt(page) {
  for (let attempt = 0; attempt < 16; attempt += 1) {
    await expect.poll(() => page.evaluate(() => (
      window.__MAPPA_TEST_API__.getActiveMemoryTrailState()?.phase
    )), { timeout: 15_000 }).toBe("answering");
    const state = await page.evaluate(() => ({
      trail: window.__MAPPA_TEST_API__.getActiveMemoryTrailState(),
      capital: window.__MAPPA_TEST_API__.getCapitalLocationQuestionVisualState()
    }));
    if (state.trail.currentPromptType === "name_to_place" && state.capital?.phase === "answering") {
      return state.capital;
    }
    const promptKey = state.trail.promptHistory.at(-1)?.promptKey;
    await page.evaluate(() => window.__MAPPA_TEST_API__.answerActiveMemoryTrailCorrectly());
    await expect.poll(() => page.evaluate((previousKey) => {
      const current = window.__MAPPA_TEST_API__.getActiveMemoryTrailState();
      return current?.phase === "answering" && current.promptHistory.at(-1)?.promptKey !== previousKey;
    }, promptKey), { timeout: 15_000 }).toBe(true);
  }
  throw new Error("Guided capital locating did not become eligible after successful naming.");
}

function expectGuidedCityContext(state, { targetId, coordinate, names }) {
  expect(state).toMatchObject({
    targetId,
    phase: "teaching",
    scope: "target-state",
    interaction: "capital-only",
    starIconImage: "mappa-state-capital-star"
  });
  expect(state.choices).toHaveLength(3);
  expect(state.choices.map(({ name }) => name)).toEqual(names);
  expect(state.choices.find(({ id }) => id === targetId)).toMatchObject({
    lon: coordinate[0], lat: coordinate[1], revealCapital: true, isInteractive: true
  });
  expect(state.choices.filter(({ revealLabel }) => revealLabel)).toHaveLength(3);
  expect(state.choices.filter(({ isInteractive }) => isInteractive).map(({ id }) => id)).toEqual([targetId]);
  expect(state.starRenderedIds).toEqual(expect.arrayContaining([targetId]));
  expect(state.hitRenderedIds).toEqual(expect.arrayContaining([targetId]));
  expect(state.feedbackLabelLayout).toMatchObject({ visible: true, ready: true });
  expect(state.feedbackLabelLayout.placements.map(({ id }) => id)).toEqual(
    expect.arrayContaining(state.choices.map(({ id }) => id))
  );
  expect(state.feedbackLabelLayout.placements.every(({ leader }) => leader)).toBe(true);
  expect(state.hitRadius).toBe(22);
}

async function expectTeachingContextInsideMap(page, fixture) {
  await page.waitForTimeout(1_000);
  await expect.poll(() => page.evaluate(() => window.maplibrePocMap?.isMoving?.())).toBe(false);
  const state = await page.evaluate(() => window.__MAPPA_TEST_API__.getCapitalLocationQuestionVisualState());
  expectGuidedCityContext(state, fixture);
  await expect(page.locator(".capital-location-feedback-leader--line")).toHaveCount(3);
  state.choices.forEach(({ name, clientPoint }) => {
    expect(clientPoint.clientX, `${name} left`).toBeGreaterThanOrEqual(state.mapRect.left + 8);
    expect(clientPoint.clientX, `${name} right`).toBeLessThanOrEqual(state.mapRect.right - 8);
    expect(clientPoint.clientY, `${name} top`).toBeGreaterThanOrEqual(state.mapRect.top + 8);
    expect(clientPoint.clientY, `${name} bottom`).toBeLessThanOrEqual(state.mapRect.bottom - 8);
  });
  return state;
}

async function tapTeachingCapital(page, state, targetId) {
  const evidenceCountBefore = await page.evaluate((key) => (
    JSON.parse(localStorage.getItem(key) || "{}").events?.length || 0
  ), CANONICAL_EVIDENCE_REPOSITORY_STORAGE_KEY);
  const capital = state.choices.find(({ id }) => id === targetId);
  await page.mouse.click(capital.clientPoint.clientX + 17, capital.clientPoint.clientY);
  await expect.poll(() => page.evaluate((key) => (
    JSON.parse(localStorage.getItem(key) || "{}").events?.length || 0
  ), CANONICAL_EVIDENCE_REPOSITORY_STORAGE_KEY)).toBe(evidenceCountBefore + 1);
  return page.evaluate((key) => (
    JSON.parse(localStorage.getItem(key) || "{}").events.at(-1)
  ), CANONICAL_EVIDENCE_REPOSITORY_STORAGE_KEY);
}

async function expectNamingCityContext(page, targetId, names) {
  await expect.poll(() => page.evaluate(() => (
    window.__MAPPA_TEST_API__.getActiveMemoryTrailState()
  )), { timeout: 20_000 }).toMatchObject({
    phase: "answering",
    currentPromptTargetId: targetId,
    currentPromptType: "place_to_name"
  });
  await expect.poll(() => page.evaluate(() => (
    window.__MAPPA_TEST_API__.getCapitalLocationQuestionVisualState()?.feedbackLabelLayout?.ready
  ))).toBe(true);
  await expect.poll(() => page.evaluate((id) => (
    window.__MAPPA_TEST_API__.getCapitalLocationQuestionVisualState()?.starRenderedIds?.includes(id)
  ), targetId), { timeout: 15_000 }).toBe(true);
  const state = await page.evaluate(() => window.__MAPPA_TEST_API__.getCapitalLocationQuestionVisualState());
  expect(state).toMatchObject({
    targetId,
    phase: "naming",
    scope: "target-state",
    interaction: "none"
  });
  expect(state.choices.map(({ name }) => name)).toEqual(names);
  expect(state.choices).toHaveLength(3);
  expect(state.choices.every(({ revealLabel, isInteractive }) => revealLabel && !isInteractive)).toBe(true);
  expect(state.choices.find(({ id }) => id === targetId)?.revealCapital).toBe(true);
  expect(state.starRenderedIds).toContain(targetId);
  expect(state.hitRenderedIds).toEqual([]);
  expect(state.feedbackLabelLayout.placements.map(({ id }) => id).sort()).toEqual(
    state.choices.map(({ id }) => id).sort()
  );
  expect(state.feedbackLabelLayout.placements.every(({ leader }) => leader)).toBe(true);
  for (const placement of state.feedbackLabelLayout.placements.filter(({ role }) => role !== "capital")) {
    const star = state.feedbackLabelLayout.capitalStarRect;
    const box = placement.box;
    expect(box.right <= star.x || box.x >= star.right || box.bottom <= star.y || box.y >= star.bottom,
      `${placement.id} obscures the capital star`).toBe(true);
  }
  await expect(page.locator(".capital-location-feedback-label")).toHaveCount(3);
  await expect(page.locator(".capital-location-feedback-leader--line")).toHaveCount(3);
  await expect(page.locator(".memory-trail-choice-chip")).toHaveCount(4);
  return state;
}

async function advanceToNamedCapital(page, targetId) {
  for (let attempt = 0; attempt < 32; attempt += 1) {
    const trail = await page.evaluate(() => window.__MAPPA_TEST_API__.getActiveMemoryTrailState());
    if (trail?.phase === "answering" && trail.currentPromptType === "place_to_name"
      && trail.currentPromptTargetId === targetId) return;
    const promptKey = trail?.promptHistory?.at(-1)?.promptKey;
    await page.evaluate(() => window.__MAPPA_TEST_API__.answerActiveMemoryTrailCorrectly());
    await expect.poll(() => page.evaluate((previousKey) => {
      const active = window.__MAPPA_TEST_API__.getActiveMemoryTrailState();
      return active?.phase === "answering" && active.promptHistory?.at(-1)?.promptKey !== previousKey;
    }, promptKey), { timeout: 15_000 }).toBe(true);
  }
  throw new Error(`Did not reach a naming prompt for ${targetId}.`);
}

test("Guided Learning separates Cheyenne's precise star from its forgiving tap target @us-critical-path", async ({ page }) => {
  await openSeededCapitalTeaching(page, {
    sectionId: "us-capitals-07",
    stateIds: ["minnesota", "north-dakota", "south-dakota", "wyoming", "nebraska"],
    completedCapitalIds: ["st-paul-mn", "bismarck-nd", "pierre-sd"]
  });

  const cheyenne = await waitForCapitalPrompt(page, "cheyenne-wy");
  expectGuidedCityContext(cheyenne, {
    targetId: "cheyenne-wy",
    coordinate: [-104.8202, 41.14],
    names: ["Cheyenne", "Casper", "Gillette"]
  });
  const comparison = cheyenne.choices.find(({ role }) => role === "distractor");
  const evidenceCountBeforeComparison = await page.evaluate((key) => (
    JSON.parse(localStorage.getItem(key) || "{}").events?.length || 0
  ), CANONICAL_EVIDENCE_REPOSITORY_STORAGE_KEY);
  await page.mouse.click(comparison.clientPoint.clientX, comparison.clientPoint.clientY);
  await expect.poll(() => page.evaluate(() => window.__MAPPA_TEST_API__.getActiveMemoryTrailState()?.phase)).toBe("answering");
  expect(await page.evaluate((key) => JSON.parse(localStorage.getItem(key) || "{}").events?.length || 0,
    CANONICAL_EVIDENCE_REPOSITORY_STORAGE_KEY)).toBe(evidenceCountBeforeComparison);
  const cheyenneEvidence = await tapTeachingCapital(page, cheyenne, "cheyenne-wy");
  expect(cheyenneEvidence).toMatchObject({
    conceptId: "capital-location:wyoming:cheyenne-wy",
    sourceMode: "us-memory-trail",
    outcome: "assisted"
  });
  await expect.poll(() => page.evaluate(() => (
    window.__MAPPA_TEST_API__.getActiveMemoryTrailState()
  ))).toMatchObject({
    phase: "answering",
    currentPromptTargetId: "lincoln-ne",
    currentPromptType: "guided"
  });
  await page.evaluate(() => window.__MAPPA_TEST_API__.answerActiveMemoryTrailCorrectly());

  await expect.poll(() => page.evaluate(() => (
    window.__MAPPA_TEST_API__.getActiveMemoryTrailState()
  ))).toMatchObject({
    phase: "answering",
    currentPromptType: "place_to_name"
  });
  const namingPromptBeforeReload = await page.evaluate(() => (
    window.__MAPPA_TEST_API__.getActiveMemoryTrailState()
  ));
  const namingContext = await expectNamingCityContext(page, namingPromptBeforeReload.currentPromptTargetId,
    namingPromptBeforeReload.currentPromptTargetId === "cheyenne-wy"
      ? ["Cheyenne", "Casper", "Gillette"]
      : ["Lincoln", "Omaha", "Bellevue"]);
  const contextCoordinates = namingContext.choices.map(({ id, lon, lat }) => [id, lon, lat]);
  await page.reload();
  await page.locator("#launch-start-button").click();
  await page.evaluate(() => window.__mappaMundiLoadApp());
  if (await page.locator("#launch-screen").isVisible()) {
    await page.locator("#launch-start-button").click();
  }
  await expect(page.locator("#app-shell-title")).toHaveText("Main Menu");
  await page.evaluate(() => window.__MAPPA_TEST_API__.startUnitedStatesGuidedLearningAtSection("us-capitals-07"));
  await expect.poll(() => page.evaluate(() => (
    window.__MAPPA_TEST_API__.getActiveMemoryTrailState()
  )), { timeout: 20_000 }).toMatchObject({
    phase: "answering",
    currentPromptTargetId: namingPromptBeforeReload.currentPromptTargetId,
    currentPromptType: "place_to_name"
  });
  const restoredNamingContext = await expectNamingCityContext(page, namingPromptBeforeReload.currentPromptTargetId,
    namingContext.choices.map(({ name }) => name));
  expect(restoredNamingContext.choices.map(({ id, lon, lat }) => [id, lon, lat])).toEqual(contextCoordinates);
  const evidenceCountBefore = await page.evaluate((key) => (
    JSON.parse(localStorage.getItem(key) || "{}").events?.length || 0
  ), CANONICAL_EVIDENCE_REPOSITORY_STORAGE_KEY);
  const namingTargetId = await page.evaluate(() => (
    window.__MAPPA_TEST_API__.getActiveMemoryTrailState()?.currentPromptTargetId
  ));
  await page.evaluate(() => window.__MAPPA_TEST_API__.answerActiveMemoryTrailCorrectly());
  const evidence = await page.evaluate((key) => (
    JSON.parse(localStorage.getItem(key) || "{}").events
  ), CANONICAL_EVIDENCE_REPOSITORY_STORAGE_KEY);
  expect(evidence).toHaveLength(evidenceCountBefore + 1);
  expect(evidence.at(-1)).toMatchObject({
    conceptId: expect.stringContaining(`:${namingTargetId}`),
    skillId: "identifying",
    sourceMode: "us-memory-trail",
    outcome: "correct"
  });
  expect(evidence.at(-1).conceptId).toContain("capital-naming:");

  const retrieval = await advanceToCapitalLocationPrompt(page);
  expect(retrieval.choices).toHaveLength(150);
  expect(retrieval.choices.filter(({ inTargetState }) => inTargetState)).toHaveLength(3);
  expect(retrieval.feedbackLabelLayout).toMatchObject({ visible: false, placements: [] });
  await expect(page.locator(".capital-location-feedback-label")).toHaveCount(0);
  await expect(page.locator(".capital-location-feedback-leader--line")).toHaveCount(0);
  const distractor = retrieval.choices.find(({ inTargetState, role }) => inTargetState && role === "distractor");
  await page.evaluate(({ lon, lat }) => {
    window.maplibrePocMap.easeTo({ center: [lon, lat], zoom: 6, duration: 0 });
  }, distractor);
  await expect.poll(() => page.evaluate(() => window.maplibrePocMap.isMoving())).toBe(false);
  const transformedRetrieval = await page.evaluate(() => (
    window.__MAPPA_TEST_API__.getCapitalLocationQuestionVisualState()
  ));
  const transformedDistractor = transformedRetrieval.choices.find(({ id }) => id === distractor.id);
  const locationEvidenceCountBefore = await page.evaluate((key) => (
    JSON.parse(localStorage.getItem(key) || "{}").events?.length || 0
  ), CANONICAL_EVIDENCE_REPOSITORY_STORAGE_KEY);
  await page.mouse.click(transformedDistractor.clientPoint.clientX, transformedDistractor.clientPoint.clientY);
  await expect.poll(() => page.evaluate(() => (
    window.__MAPPA_TEST_API__.getActiveMemoryTrailState()?.phase
  ))).toBe("correction");
  const locationEvidence = await page.evaluate((key) => (
    JSON.parse(localStorage.getItem(key) || "{}").events
  ), CANONICAL_EVIDENCE_REPOSITORY_STORAGE_KEY);
  expect(locationEvidence).toHaveLength(locationEvidenceCountBefore + 1);
  expect(locationEvidence.at(-1)).toMatchObject({
    conceptId: `capital-location:${retrieval.targetStateId}:${retrieval.targetId}`,
    skillId: "locating",
    sourceMode: "us-memory-trail",
    outcome: "incorrect"
  });
  expect(locationEvidence.at(-1).conceptId).not.toContain("capital-location-choice:");
  const correction = await page.evaluate(() => (
    window.__MAPPA_TEST_API__.getCapitalLocationQuestionVisualState()
  ));
  expect(correction.choices.filter(({ revealLabel }) => revealLabel)).toHaveLength(3);
  expect(correction.feedbackLabelLayout.placements.every(({ leader }) => leader)).toBe(true);
});

test("a small-state capital uses the same authored-coordinate star and accessible hit target", async ({ page }) => {
  await openSeededCapitalTeaching(page, {
    sectionId: "us-capitals-01",
    stateIds: ["maine", "new-hampshire", "vermont", "massachusetts", "rhode-island", "connecticut"],
    completedCapitalIds: ["augusta-me", "concord-nh", "montpelier-vt", "boston-ma"]
  });

  const providence = await waitForCapitalPrompt(page, "providence-ri");
  expectGuidedCityContext(providence, {
    targetId: "providence-ri",
    coordinate: [-71.4128, 41.824],
    names: ["Providence", "Cranston", "Warwick"]
  });
  const evidence = await tapTeachingCapital(page, providence, "providence-ri");
  expect(evidence).toMatchObject({
    conceptId: "capital-location:rhode-island:providence-ri",
    sourceMode: "us-memory-trail",
    outcome: "assisted"
  });
});

test("Boise teaching restores its dense three-city context and relayouts after navigation", async ({ page }, testInfo) => {
  const seed = {
    sectionId: "us-capitals-10",
    stateIds: ["montana", "idaho", "washington", "oregon"],
    completedCapitalIds: ["helena-mt"]
  };
  const fixture = {
    targetId: "boise-id",
    coordinate: [-116.2023, 43.615],
    names: ["Boise", "Meridian", "Nampa"]
  };
  await openSeededCapitalTeaching(page, seed);
  await waitForCapitalPrompt(page, fixture.targetId);
  const beforeReload = await expectTeachingContextInsideMap(page, fixture);
  const sourceCoordinates = beforeReload.choices.map(({ id, lon, lat }) => [id, lon, lat]);

  await page.reload();
  await page.locator("#launch-start-button").click();
  await page.evaluate(() => window.__mappaMundiLoadApp());
  if (await page.locator("#launch-screen").isVisible()) {
    await page.locator("#launch-start-button").click();
  }
  await expect(page.locator("#app-shell-title")).toHaveText("Main Menu");
  await page.evaluate((targetSectionId) => (
    window.__MAPPA_TEST_API__.startUnitedStatesGuidedLearningAtSection(targetSectionId)
  ), seed.sectionId);
  await waitForCapitalPrompt(page, fixture.targetId);
  const restored = await expectTeachingContextInsideMap(page, fixture);
  expect(restored.choices.map(({ id, lon, lat }) => [id, lon, lat])).toEqual(sourceCoordinates);
  expect(restored.dragPanEnabled).toBe(true);
  expect(restored.scrollZoomEnabled).toBe(true);

  const placementPoints = restored.feedbackLabelLayout.placements.map(({ point }) => point);
  await page.evaluate(() => window.maplibrePocMap.panBy([44, -18], { duration: 0 }));
  await expect.poll(() => page.evaluate(() => window.maplibrePocMap.isMoving())).toBe(false);
  await expect.poll(() => page.evaluate(() => (
    window.__MAPPA_TEST_API__.getCapitalLocationQuestionVisualState().feedbackLabelLayout.placements.map(({ point }) => point)
  ))).not.toEqual(placementPoints);
  const afterPan = await page.evaluate(() => window.__MAPPA_TEST_API__.getCapitalLocationQuestionVisualState());
  const zoomBefore = afterPan.mapZoom;
  await page.evaluate(() => window.maplibrePocMap.zoomTo(window.maplibrePocMap.getZoom() + 0.45, { duration: 0 }));
  await expect.poll(() => page.evaluate(() => window.maplibrePocMap.isMoving())).toBe(false);
  const afterNavigation = await page.evaluate(() => window.__MAPPA_TEST_API__.getCapitalLocationQuestionVisualState());
  expect(afterNavigation.mapZoom).toBeGreaterThan(zoomBefore);
  expect(afterNavigation.choices.map(({ id, lon, lat }) => [id, lon, lat])).toEqual(sourceCoordinates);
  await page.screenshot({ path: testInfo.outputPath("boise-capital-teaching-context.png") });
});

for (const fixture of [
  {
    stateLabel: "Massachusetts",
    sectionId: "us-capitals-01",
    stateIds: ["maine", "new-hampshire", "vermont", "massachusetts", "rhode-island", "connecticut"],
    completedCapitalIds: ["augusta-me", "concord-nh", "montpelier-vt"],
    targetId: "boston-ma",
    coordinate: [-71.0589, 42.3601],
    names: ["Boston", "Worcester", "Springfield"]
  },
  {
    stateLabel: "New Hampshire",
    sectionId: "us-capitals-01",
    stateIds: ["maine", "new-hampshire", "vermont", "massachusetts", "rhode-island", "connecticut"],
    completedCapitalIds: ["augusta-me"],
    targetId: "concord-nh",
    coordinate: [-71.5376, 43.2081],
    names: ["Concord", "Manchester", "Nashua"]
  },
  {
    stateLabel: "Utah",
    sectionId: "us-capitals-09",
    stateIds: ["utah", "arizona", "nevada", "california"],
    completedCapitalIds: [],
    targetId: "salt-lake-city-ut",
    coordinate: [-111.891, 40.7608],
    names: ["Salt Lake City", "West Valley City", "West Jordan"]
  },
  {
    stateLabel: "Hawaii",
    sectionId: "us-capitals-11",
    stateIds: ["alaska", "hawaii"],
    completedCapitalIds: ["juneau-ak"],
    targetId: "honolulu-hi",
    coordinate: [-157.8583, 21.3069],
    names: ["Honolulu", "East Honolulu", "Pearl City"]
  },
  {
    stateLabel: "Alaska",
    sectionId: "us-capitals-11",
    stateIds: ["alaska", "hawaii"],
    completedCapitalIds: [],
    targetId: "juneau-ak",
    coordinate: [-134.4197, 58.3019],
    names: ["Juneau", "Anchorage", "Fairbanks"]
  }
]) {
  test(`${fixture.stateLabel} teaching keeps all three true city locations visible`, async ({ page }, testInfo) => {
    await openSeededCapitalTeaching(page, fixture);
    await waitForCapitalPrompt(page, fixture.targetId);
    await expectTeachingContextInsideMap(page, fixture);
    await page.screenshot({ path: testInfo.outputPath(`${fixture.stateLabel.toLowerCase()}-capital-teaching-context.png`) });
  });
}

for (const fixture of [
  {
    stateLabel: "Massachusetts",
    sectionId: "us-capitals-01",
    stateIds: ["maine", "new-hampshire", "vermont", "massachusetts", "rhode-island", "connecticut"],
    completedCapitalIds: ["augusta-me", "concord-nh", "montpelier-vt"],
    targetId: "boston-ma",
    names: ["Boston", "Worcester", "Springfield"]
  },
  {
    stateLabel: "Utah",
    sectionId: "us-capitals-09",
    stateIds: ["utah", "arizona", "nevada", "california"],
    completedCapitalIds: [],
    targetId: "salt-lake-city-ut",
    names: ["Salt Lake City", "West Valley City", "West Jordan"]
  },
  {
    stateLabel: "Hawaii",
    sectionId: "us-capitals-11",
    stateIds: ["alaska", "hawaii"],
    completedCapitalIds: ["juneau-ak"],
    targetId: "honolulu-hi",
    names: ["Honolulu", "East Honolulu", "Pearl City"]
  }
]) {
  test(`${fixture.stateLabel} capital naming shows three true-city markers and attributable labels`, async ({ page }, testInfo) => {
    await openSeededCapitalTeaching(page, fixture);
    await advanceToNamedCapital(page, fixture.targetId);
    if (fixture.stateLabel === "Hawaii") {
      await expect.poll(() => page.evaluate(() => {
        const longitude = window.maplibrePocMap.getCenter().lng;
        return Math.abs((((longitude + 157 + 540) % 360) + 360) % 360 - 180);
      }), { timeout: 15_000 }).toBeLessThan(15);
      await expect.poll(() => page.evaluate(() => window.maplibrePocMap.getZoom()), { timeout: 15_000 }).toBeGreaterThan(5);
      await expect.poll(() => page.evaluate(() => window.maplibrePocMap.isMoving())).toBe(false);
      await page.waitForTimeout(1_100);
      const settledLongitude = await page.evaluate(() => window.maplibrePocMap.getCenter().lng);
      expect(Math.abs((((settledLongitude + 157 + 540) % 360) + 360) % 360 - 180)).toBeLessThan(15);
      expect(await page.evaluate(() => window.maplibrePocMap.getZoom())).toBeGreaterThan(5);
    }
    await expect.poll(() => page.evaluate(() => window.maplibrePocMap.isMoving())).toBe(false);
    const context = await expectNamingCityContext(page, fixture.targetId, fixture.names);
    const record = getUsCapitalLocationCityChoicesForCapital(fixture.targetId);
    expect(context.choices.filter(({ role }) => role === "distractor").map(({ lon, lat }) => [lon, lat]))
      .toEqual(record.distractors.map(({ lon, lat }) => [lon, lat]));
    expect(context.dragPanEnabled).toBe(true);
    expect(context.scrollZoomEnabled).toBe(true);
    const comparison = context.choices.find(({ role }) => role === "distractor");
    const evidenceBefore = await page.evaluate((key) => (
      JSON.parse(localStorage.getItem(key) || "{}").events?.length || 0
    ), CANONICAL_EVIDENCE_REPOSITORY_STORAGE_KEY);
    await page.mouse.click(comparison.clientPoint.clientX, comparison.clientPoint.clientY);
    expect(await page.evaluate((key) => (
      JSON.parse(localStorage.getItem(key) || "{}").events?.length || 0
    ), CANONICAL_EVIDENCE_REPOSITORY_STORAGE_KEY)).toBe(evidenceBefore);
    expect((await page.evaluate(() => window.__MAPPA_TEST_API__.getActiveMemoryTrailState())).phase).toBe("answering");
    const beforePan = context.feedbackLabelLayout.placements.map(({ point }) => point);
    await page.evaluate(() => window.maplibrePocMap.panBy([35, -14], { duration: 0 }));
    await expect.poll(() => page.evaluate(() => (
      window.__MAPPA_TEST_API__.getCapitalLocationQuestionVisualState()?.feedbackLabelLayout?.placements?.map(({ point }) => point)
    ))).not.toEqual(beforePan);
    const zoomBefore = await page.evaluate(() => window.maplibrePocMap.getZoom());
    await page.evaluate(() => window.maplibrePocMap.zoomTo(window.maplibrePocMap.getZoom() + 0.35, { duration: 0 }));
    await expect.poll(() => page.evaluate(() => window.maplibrePocMap.getZoom())).toBeGreaterThan(zoomBefore);
    if (fixture.stateLabel === "Hawaii") {
      const transformedCamera = await page.evaluate(() => ({
        longitude: window.maplibrePocMap.getCenter().lng,
        zoom: window.maplibrePocMap.getZoom()
      }));
      expect(Math.abs((((transformedCamera.longitude + 157 + 540) % 360) + 360) % 360 - 180)).toBeLessThan(15);
      expect(transformedCamera.zoom).toBeGreaterThan(5);
    }
    await expectNamingCityContext(page, fixture.targetId, fixture.names);
    await page.screenshot({ path: testInfo.outputPath(`${fixture.stateLabel.toLowerCase()}-capital-naming-context.png`) });
  });
}
