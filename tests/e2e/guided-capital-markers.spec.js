import { expect, test } from "@playwright/test";
import { CANONICAL_EVIDENCE_REPOSITORY_STORAGE_KEY } from "../../src/canonical-learning-evidence-repository.js";
import { unitedStatesMemoryTrailStorageKey } from "../../src/united-states-memory-trail-planner.js";

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
    localStorage.setItem(storageKey, JSON.stringify(state));
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
  await expect.poll(() => page.evaluate(() => (
    window.__MAPPA_TEST_API__.getCapitalMarkerVisualState()?.star.renderedTargetIds || []
  ))).toContain(targetId);
  return page.evaluate(() => window.__MAPPA_TEST_API__.getCapitalMarkerVisualState());
}

function expectPreciseGuidedMarker(state, { targetId, coordinate, relatedStateId }) {
  expect(state).toMatchObject({
    targetId,
    promptType: "guided",
    activeHighlightIds: [targetId],
    authoredCoordinate: coordinate,
    sourceCoordinate: coordinate,
    relatedStateTargetId: relatedStateId,
    insideRelatedState: true,
    sourceProperties: {
      capitalMarkerType: "state-capital",
      easyHitRadius: 24,
      showProgressStar: false
    },
    star: {
      visible: "visible",
      iconImage: "mappa-state-capital-star"
    },
    halo: {
      visible: "visible"
    },
    hitTarget: {
      visible: "visible"
    }
  });
  expect(state.star.renderedTargetIds).toContain(targetId);
  expect(state.star.filter).toEqual(["==", ["get", "capitalMarkerType"], "state-capital"]);
  expect(state.halo.renderedTargetIds).toContain(targetId);
  expect(state.hitTarget.renderedTargetIds).toContain(targetId);
  expect(state.star.renderedAtOffStarTargetIds).not.toContain(targetId);
  expect(state.hitTarget.renderedAtOffStarTargetIds).toContain(targetId);
  expect(state.hitTarget.resolvedAtOffStarTargetIds).toContain(targetId);
}

async function tapInsideCircleOutsideStar(page, state) {
  const evidenceCountBefore = await page.evaluate((key) => (
    JSON.parse(localStorage.getItem(key) || "{}").events?.length || 0
  ), CANONICAL_EVIDENCE_REPOSITORY_STORAGE_KEY);
  await page.mouse.click(state.offStarClientPoint.clientX, state.offStarClientPoint.clientY);
  await expect.poll(() => page.evaluate((key) => (
    JSON.parse(localStorage.getItem(key) || "{}").events?.length || 0
  ), CANONICAL_EVIDENCE_REPOSITORY_STORAGE_KEY)).toBe(evidenceCountBefore + 1);
  return page.evaluate((key) => (
    JSON.parse(localStorage.getItem(key) || "{}").events.at(-1)
  ), CANONICAL_EVIDENCE_REPOSITORY_STORAGE_KEY);
}

test("Guided Learning separates Cheyenne's precise star from its forgiving tap target", async ({ page }) => {
  await openSeededCapitalTeaching(page, {
    sectionId: "us-capitals-07",
    stateIds: ["minnesota", "north-dakota", "south-dakota", "wyoming", "nebraska"],
    completedCapitalIds: ["st-paul-mn", "bismarck-nd", "pierre-sd"]
  });

  const cheyenne = await waitForCapitalPrompt(page, "cheyenne-wy");
  expectPreciseGuidedMarker(cheyenne, {
    targetId: "cheyenne-wy",
    coordinate: [-104.8202, 41.14],
    relatedStateId: "wyoming"
  });
  expect(cheyenne.sourceCoordinate[1]).toBeGreaterThan(41);
  const cheyenneEvidence = await tapInsideCircleOutsideStar(page, cheyenne);
  expect(cheyenneEvidence).toMatchObject({
    conceptId: "capital-location:wyoming:cheyenne-wy",
    sourceMode: "us-memory-trail",
    outcome: "assisted"
  });

  const lincoln = await waitForCapitalPrompt(page, "lincoln-ne");
  expectPreciseGuidedMarker(lincoln, {
    targetId: "lincoln-ne",
    coordinate: [-96.6852, 40.8136],
    relatedStateId: "nebraska"
  });
  await tapInsideCircleOutsideStar(page, lincoln);

  await expect.poll(() => page.evaluate(() => (
    window.__MAPPA_TEST_API__.getActiveMemoryTrailState()
  ))).toMatchObject({
    phase: "answering",
    currentPromptType: "name_to_place",
    activeHighlightIds: []
  });
  const retrieval = await page.evaluate(() => (
    window.__MAPPA_TEST_API__.getCapitalLocationQuestionVisualState()
  ));
  expect(retrieval).toMatchObject({
    active: true,
    phase: "answering",
    dragPanEnabled: true,
    scrollZoomEnabled: true
  });
  expect(retrieval.choices).toHaveLength(150);
  expect(retrieval.choices.filter(({ inTargetState }) => inTargetState)).toHaveLength(3);
  expect(retrieval.starRenderedIds).toEqual([]);
  expect(retrieval.labelRenderedIds).toEqual([]);

  const distractor = retrieval.choices.find(({ inTargetState, role }) => inTargetState && role === "distractor");
  const evidenceCountBefore = await page.evaluate((key) => (
    JSON.parse(localStorage.getItem(key) || "{}").events?.length || 0
  ), CANONICAL_EVIDENCE_REPOSITORY_STORAGE_KEY);
  await page.mouse.click(distractor.clientPoint.clientX, distractor.clientPoint.clientY);
  await expect.poll(() => page.evaluate(() => (
    window.__MAPPA_TEST_API__.getActiveMemoryTrailState()?.phase
  ))).toBe("correction");
  const evidence = await page.evaluate((key) => (
    JSON.parse(localStorage.getItem(key) || "{}").events
  ), CANONICAL_EVIDENCE_REPOSITORY_STORAGE_KEY);
  expect(evidence).toHaveLength(evidenceCountBefore + 1);
  expect(evidence.at(-1)).toMatchObject({
    conceptId: `capital-location:${retrieval.targetStateId}:${retrieval.targetId}`,
    sourceMode: "us-memory-trail",
    outcome: "incorrect"
  });
  expect(evidence.at(-1).conceptId).not.toContain("capital-location-choice:");
  const correction = await page.evaluate(() => (
    window.__MAPPA_TEST_API__.getCapitalLocationQuestionVisualState()
  ));
  expect(correction.choices.filter(({ revealLabel }) => revealLabel)).toHaveLength(3);
  expect(correction.choices.filter(({ revealCapital }) => revealCapital).map(({ id }) => id)).toEqual([
    retrieval.targetId
  ]);
});

test("a small-state capital uses the same authored-coordinate star and accessible hit target", async ({ page }) => {
  await openSeededCapitalTeaching(page, {
    sectionId: "us-capitals-01",
    stateIds: ["maine", "new-hampshire", "vermont", "massachusetts", "rhode-island", "connecticut"],
    completedCapitalIds: ["augusta-me", "concord-nh", "montpelier-vt", "boston-ma"]
  });

  const providence = await waitForCapitalPrompt(page, "providence-ri");
  expectPreciseGuidedMarker(providence, {
    targetId: "providence-ri",
    coordinate: [-71.4128, 41.824],
    relatedStateId: "rhode-island"
  });
  const evidence = await tapInsideCircleOutsideStar(page, providence);
  expect(evidence).toMatchObject({
    conceptId: "capital-location:rhode-island:providence-ri",
    sourceMode: "us-memory-trail",
    outcome: "assisted"
  });
});
