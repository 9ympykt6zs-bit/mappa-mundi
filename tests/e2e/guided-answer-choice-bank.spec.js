import { expect, test } from "@playwright/test";
import { CANONICAL_EVIDENCE_REPOSITORY_STORAGE_KEY } from "../../src/canonical-learning-evidence-repository.js";
import { unitedStatesMemoryTrailStorageKey } from "../../src/united-states-memory-trail-planner.js";

const SECTION_ONE_ID = "us-states-01";
const SECTION_ONE_STATE_IDS = ["maine", "new-hampshire", "massachusetts", "rhode-island", "connecticut"];
const SINGLE_POOL_CAPITAL_ID = "augusta-me";
const FOUR_POOL_CAPITAL_IDS = ["concord-nh", "boston-ma", "providence-ri", "hartford-ct"];

function createStateProgress(overrides = {}) {
  return {
    status: "introduced",
    memoryState: "learning",
    timesSeen: 0,
    correctCount: 0,
    correctStreak: 0,
    missCount: 0,
    lapseCount: 0,
    introducedSession: 1,
    lastSeenSession: 0,
    lastReviewedSession: 0,
    dueSession: null,
    ...overrides
  };
}

function createReviewProgress(overrides = {}) {
  return createStateProgress({
    status: "review",
    memoryState: "review",
    timesSeen: 3,
    correctCount: 3,
    correctStreak: 2,
    lastSeenSession: 3,
    lastReviewedSession: 3,
    dueSession: 99,
    ...overrides
  });
}

function createSingleCapitalPoolState() {
  return {
    version: 2,
    trailId: "united-states-memory-trail",
    curriculumVersion: 2,
    hasStarted: true,
    currentSessionNumber: 2,
    currentCategory: "states",
    introducedItemIds: SECTION_ONE_STATE_IDS.map((stateId) => `state:${stateId}`),
    itemProgress: Object.fromEntries(SECTION_ONE_STATE_IDS.map((stateId, index) => [
      `state:${stateId}`,
      createStateProgress(index === 0
        ? { timesSeen: 1, correctCount: 1, correctStreak: 1, lastSeenSession: 1, lastReviewedSession: 1 }
        : {})
    ]))
  };
}

function createFourCapitalPoolState() {
  return {
    version: 2,
    trailId: "united-states-memory-trail",
    curriculumVersion: 2,
    hasStarted: true,
    currentSessionNumber: 8,
    currentCategory: "states",
    introducedItemIds: [
      ...SECTION_ONE_STATE_IDS.map((stateId) => `state:${stateId}`),
      `capital:${SINGLE_POOL_CAPITAL_ID}`
    ],
    itemProgress: Object.fromEntries([
      ...SECTION_ONE_STATE_IDS.map((stateId) => [`state:${stateId}`, createReviewProgress()]),
      [`capital:${SINGLE_POOL_CAPITAL_ID}`, createReviewProgress()]
    ])
  };
}

async function openTrailFromMainMenu(page, sectionId = SECTION_ONE_ID) {
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

async function openSeededTrail(page, trailState) {
  await page.addInitScript(({ storageKey, state }) => {
    if (!localStorage.getItem(storageKey)) localStorage.setItem(storageKey, JSON.stringify(state));
  }, {
    storageKey: unitedStatesMemoryTrailStorageKey,
    state: trailState
  });
  await openTrailFromMainMenu(page);
}

async function reloadTrailFromMainMenu(page) {
  await page.reload();
  await page.locator("#launch-start-button").click();
  await page.evaluate(() => window.__mappaMundiLoadApp());
  if (await page.locator("#launch-screen").isVisible()) {
    await page.locator("#launch-start-button").click();
  }
  await expect(page.locator("#app-shell-title")).toHaveText("Main Menu");
  await page.evaluate((targetSectionId) => (
    window.__MAPPA_TEST_API__.startUnitedStatesGuidedLearningAtSection(targetSectionId)
  ), SECTION_ONE_ID);
}

function getActiveTrailState(page) {
  return page.evaluate(() => window.__MAPPA_TEST_API__.getActiveMemoryTrailState());
}

async function advanceToCapitalNamingPrompt(page, capitalTargetIds, { maxAttempts = 32 } = {}) {
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    await expect.poll(() => page.evaluate(() => (
      window.__MAPPA_TEST_API__.getActiveMemoryTrailState()?.phase
    )), { timeout: 15_000 }).toBe("answering");
    const trail = await getActiveTrailState(page);
    if (trail.currentPromptType === "place_to_name" && capitalTargetIds.includes(trail.currentPromptTargetId)) {
      return trail;
    }
    const promptKey = trail.promptHistory.at(-1)?.promptKey;
    await page.evaluate(() => window.__MAPPA_TEST_API__.answerActiveMemoryTrailCorrectly());
    await expect.poll(() => page.evaluate((previousKey) => {
      const current = window.__MAPPA_TEST_API__.getActiveMemoryTrailState();
      return current?.phase === "answering" && current.promptHistory.at(-1)?.promptKey !== previousKey;
    }, promptKey), { timeout: 15_000 }).toBe(true);
  }
  throw new Error(`Guided Learning never reached a naming prompt for ${capitalTargetIds.join(", ")}.`);
}

function getChoiceIds(page) {
  return page.locator(".memory-trail-choice-chip").evaluateAll((nodes) => (
    nodes.map((node) => node.dataset.id)
  ));
}

async function getCanonicalEvidenceEvents(page) {
  return page.evaluate((key) => (
    JSON.parse(localStorage.getItem(key) || "{}").events || []
  ), CANONICAL_EVIDENCE_REPOSITORY_STORAGE_KEY);
}

test("a one-capital Guided session tops up four unique capital choices and answers fallback misses with reliable feedback", async ({ page }) => {
  await openSeededTrail(page, createSingleCapitalPoolState());
  const trail = await advanceToCapitalNamingPrompt(page, [SINGLE_POOL_CAPITAL_ID]);
  expect(trail.targetPoolIds.filter((targetId) => targetId === SINGLE_POOL_CAPITAL_ID)).toHaveLength(1);

  const chips = page.locator(".memory-trail-choice-chip");
  await expect(chips).toHaveCount(4);
  const choiceIds = await getChoiceIds(page);
  expect(new Set(choiceIds).size).toBe(4);
  expect(choiceIds).toContain(SINGLE_POOL_CAPITAL_ID);
  const fallbackChoiceIds = choiceIds.filter((choiceId) => !trail.targetPoolIds.includes(choiceId));
  expect(fallbackChoiceIds).toHaveLength(3);

  const fallbackChoiceId = fallbackChoiceIds[0];
  const fallbackLabel = await page.locator(`.memory-trail-choice-chip[data-id="${fallbackChoiceId}"]`).getAttribute("aria-label");
  expect(fallbackLabel).toBeTruthy();
  const evidenceCountBefore = (await getCanonicalEvidenceEvents(page)).length;
  await page.locator(`.memory-trail-choice-chip[data-id="${fallbackChoiceId}"] .chip-label-text`).click();

  await expect.poll(() => page.evaluate(() => (
    window.__MAPPA_TEST_API__.getActiveMemoryTrailState()?.phase
  ))).toBe("correction");
  const trayFeedback = page.locator(".memory-trail-tray-feedback");
  await expect(trayFeedback).toContainText(`that was ${fallbackLabel}`);
  await expect(trayFeedback).toContainText("Augusta");

  const evidence = await getCanonicalEvidenceEvents(page);
  expect(evidence).toHaveLength(evidenceCountBefore + 1);
  expect(evidence.at(-1)).toMatchObject({
    conceptId: `capital-naming:maine:${SINGLE_POOL_CAPITAL_ID}`,
    skillId: "identifying",
    sourceMode: "us-memory-trail",
    outcome: "incorrect"
  });
  expect(evidence.at(-1).conceptId).not.toContain(fallbackChoiceId);

  const savedProgress = await page.evaluate((key) => (
    JSON.parse(localStorage.getItem(key) || "{}")
  ), unitedStatesMemoryTrailStorageKey);
  expect(Object.keys(savedProgress.itemProgress || {})).not.toContain(`capital:${fallbackChoiceId}`);
  expect(savedProgress.introducedItemIds || []).not.toContain(`capital:${fallbackChoiceId}`);
});

test("a persisted one-choice naming prompt is repaired to a full answer bank on reload", async ({ page }) => {
  await openSeededTrail(page, createSingleCapitalPoolState());
  await advanceToCapitalNamingPrompt(page, [SINGLE_POOL_CAPITAL_ID]);
  await expect(page.locator(".memory-trail-choice-chip")).toHaveCount(4);

  await page.evaluate((storageKey) => {
    const saved = JSON.parse(localStorage.getItem(storageKey) || "{}");
    const snapshot = saved.activeSession?.memoryTrailSnapshot;
    const correctChoice = (snapshot?.answerChoices || []).find((choice) => (
      choice.id === snapshot.currentPromptTargetId
    ));
    snapshot.answerChoices = [correctChoice];
    if (saved.activeSession?.promptSnapshot) {
      saved.activeSession.promptSnapshot.answerChoices = [correctChoice];
    }
    localStorage.setItem(storageKey, JSON.stringify(saved));
  }, unitedStatesMemoryTrailStorageKey);

  await reloadTrailFromMainMenu(page);
  await expect.poll(() => page.evaluate(() => {
    const trail = window.__MAPPA_TEST_API__.getActiveMemoryTrailState();
    return trail ? {
      phase: trail.phase,
      currentPromptType: trail.currentPromptType,
      currentPromptTargetId: trail.currentPromptTargetId
    } : null;
  }), { timeout: 20_000 }).toEqual({
    phase: "answering",
    currentPromptType: "place_to_name",
    currentPromptTargetId: SINGLE_POOL_CAPITAL_ID
  });

  const chips = page.locator(".memory-trail-choice-chip");
  await expect(chips).toHaveCount(4);
  const choiceIds = await getChoiceIds(page);
  expect(new Set(choiceIds).size).toBe(4);
  expect(choiceIds).toContain(SINGLE_POOL_CAPITAL_ID);
});

test("a naming prompt with four session-scoped capitals keeps its exact bank across reload", async ({ page }) => {
  await openSeededTrail(page, createFourCapitalPoolState());
  const trail = await advanceToCapitalNamingPrompt(page, FOUR_POOL_CAPITAL_IDS);

  const chips = page.locator(".memory-trail-choice-chip");
  await expect(chips).toHaveCount(4);
  const choiceIds = await getChoiceIds(page);
  expect(new Set(choiceIds).size).toBe(4);
  expect(choiceIds).toContain(trail.currentPromptTargetId);
  choiceIds.forEach((choiceId) => expect(trail.targetPoolIds).toContain(choiceId));

  await reloadTrailFromMainMenu(page);
  await expect.poll(() => page.evaluate(() => {
    const trail = window.__MAPPA_TEST_API__.getActiveMemoryTrailState();
    return trail ? {
      phase: trail.phase,
      currentPromptType: trail.currentPromptType,
      currentPromptTargetId: trail.currentPromptTargetId
    } : null;
  }), { timeout: 20_000 }).toEqual({
    phase: "answering",
    currentPromptType: "place_to_name",
    currentPromptTargetId: trail.currentPromptTargetId
  });

  await expect(page.locator(".memory-trail-choice-chip")).toHaveCount(4);
  const restoredChoiceIds = await getChoiceIds(page);
  expect(restoredChoiceIds).toEqual(choiceIds);
  restoredChoiceIds.forEach((choiceId) => expect(trail.targetPoolIds).toContain(choiceId));
});
