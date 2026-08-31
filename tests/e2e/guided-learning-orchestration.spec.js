import { expect, test } from "@playwright/test";
import { CANONICAL_EVIDENCE_REPOSITORY_STORAGE_KEY } from "../../src/canonical-learning-evidence-repository.js";
import { unitedStatesMemoryTrailStorageKey } from "../../src/united-states-memory-trail-planner.js";
import {
  GUIDED_LEARNING_ORCHESTRATION_STORAGE_KEY,
  UNITED_STATES_GUIDED_LEARNING_ORCHESTRATION_V1
} from "../../src/guided-learning-orchestration.js";

const newEnglandStateIds = [
  "maine",
  "new-hampshire",
  "vermont",
  "massachusetts",
  "rhode-island",
  "connecticut"
];

function createCoveredNewEnglandRepository() {
  return {
    storageVersion: 1,
    evidenceSchemaVersion: 1,
    events: newEnglandStateIds.map((stateId, sequence) => ({
      schemaVersion: 1,
      eventId: `orchestration-state-coverage-${stateId}`,
      attemptId: `orchestration-state-coverage-${stateId}`,
      occurredAt: new Date(Date.UTC(2040, 0, 1, 0, 0, sequence)).toISOString(),
      sequence,
      conceptId: `state-location:${stateId}`,
      skillId: "locating",
      sourceMode: "us-memory-trail",
      sourceActivityId: sequence === 2 ? "us-states-02" : "us-states-01",
      outcome: sequence % 2 === 0 ? "assisted" : "correct"
    }))
  };
}

function createGuidedState() {
  return {
    version: 2,
    trailId: "united-states-memory-trail",
    curriculumVersion: 2,
    hasStarted: true,
    currentSessionNumber: 3,
    currentCategory: "states",
    introducedItemIds: newEnglandStateIds.map((stateId) => `state:${stateId}`),
    itemProgress: Object.fromEntries(newEnglandStateIds.map((stateId) => [`state:${stateId}`, {
      status: "review",
      memoryState: "review",
      timesSeen: 2,
      correctCount: 2,
      correctStreak: 2,
      missCount: 0,
      lapseCount: 0,
      introducedSession: 1,
      lastSeenSession: 2,
      lastReviewedSession: 2,
      dueSession: 4
    }]))
  };
}

async function openSeededGuidedLearning(page) {
  await page.addInitScript(({ repositoryKey, trailKey, repository, trailState }) => {
    localStorage.setItem(repositoryKey, JSON.stringify(repository));
    localStorage.setItem(trailKey, JSON.stringify(trailState));
  }, {
    repositoryKey: CANONICAL_EVIDENCE_REPOSITORY_STORAGE_KEY,
    trailKey: unitedStatesMemoryTrailStorageKey,
    repository: createCoveredNewEnglandRepository(),
    trailState: createGuidedState()
  });
  await page.goto("/?test=1&globeNavigation=off");
  await page.locator("#launch-start-button").click();
  await page.evaluate(() => window.__mappaMundiLoadApp());
  await expect(page.locator("#app-shell-title")).toHaveText("Main Menu");
  await page.locator("#main-menu-us-memory-trail-button").click();
  await expect(page.locator(".memory-trail-panel")).toBeVisible({ timeout: 20_000 });
}

async function launchNextBlock(page, expectedBlockId) {
  await expect.poll(() => page.evaluate(() => (
    window.__MAPPA_TEST_API__.getGuidedLearningOrchestration().currentBlock.id
  ))).toBe(expectedBlockId);
  await page.evaluate(() => window.__MAPPA_TEST_API__.launchNextGuidedLearningOrchestration());
}

async function finishTargetedPhysicalPractice(page, targetId = "white-mountains") {
  await expect.poll(() => page.evaluate(() => (
    window.__MAPPA_TEST_API__.getActiveMemoryTrailState()?.targetPoolIds
  ))).toEqual([targetId]);
  for (let attempt = 0; attempt < 10; attempt += 1) {
    if (await page.locator("#memory-trail-overlay").isVisible()) break;
    await expect.poll(() => page.evaluate(() => (
      window.__MAPPA_TEST_API__.getActiveMemoryTrailState()?.phase
    ))).toBe("answering");
    expect(await page.evaluate(() => (
      window.__MAPPA_TEST_API__.answerActiveMemoryTrailCorrectly()
    ))).toBe(true);
    await page.waitForTimeout(700);
  }
  await expect(page.locator("#memory-trail-overlay")).toBeVisible();
  await expect(page.locator("#memory-trail-primary-button")).toHaveText("Continue Guided Learning");
}

function createTargetedPhysicalSeed(targetId) {
  const targetFeature = UNITED_STATES_GUIDED_LEARNING_ORCHESTRATION_V1.physicalFeatures
    .find((feature) => feature.targetId === targetId);
  const earlierCompletedBlockIds = ["us-guided:rebuild-new-england"];
  for (const feature of UNITED_STATES_GUIDED_LEARNING_ORCHESTRATION_V1.physicalFeatures) {
    if (feature.id === targetFeature.id) break;
    earlierCompletedBlockIds.push(...feature.blockIds);
  }
  return {
    targetFeature,
    repository: {
      storageVersion: 1,
      evidenceSchemaVersion: 1,
      events: targetFeature.introductionPrerequisiteStateIds.map((stateId, sequence) => ({
        schemaVersion: 1,
        eventId: `orchestration-${targetId}-coverage-${stateId}`,
        attemptId: `orchestration-${targetId}-coverage-${stateId}`,
        occurredAt: new Date(Date.UTC(2041, 0, 1, 0, 0, sequence)).toISOString(),
        sequence,
        conceptId: `state-location:${stateId}`,
        skillId: "locating",
        sourceMode: "test",
        sourceActivityId: "guided-physical-browser-seed",
        outcome: sequence % 2 === 0 ? "assisted" : "correct"
      }))
    },
    orchestrationState: {
      version: 2,
      orchestrationId: UNITED_STATES_GUIDED_LEARNING_ORCHESTRATION_V1.id,
      completedBlockIds: earlierCompletedBlockIds,
      activeBlockId: null,
      activeStatus: null,
      previousBlockId: earlierCompletedBlockIds.at(-1),
      physicalInterleaveRequired: false,
      lastCompletedPhysicalFeatureId: null,
      lastNonPhysicalMilestone: null,
      returnContext: null,
      lastTransition: null
    }
  };
}

async function openSeededPhysicalSequence(page, targetId) {
  const seed = createTargetedPhysicalSeed(targetId);
  await page.addInitScript(({ repositoryKey, orchestrationKey, repository, orchestrationState }) => {
    localStorage.setItem(repositoryKey, JSON.stringify(repository));
    localStorage.setItem(orchestrationKey, JSON.stringify(orchestrationState));
  }, {
    repositoryKey: CANONICAL_EVIDENCE_REPOSITORY_STORAGE_KEY,
    orchestrationKey: GUIDED_LEARNING_ORCHESTRATION_STORAGE_KEY,
    repository: seed.repository,
    orchestrationState: seed.orchestrationState
  });
  await page.goto("/?test=1&globeNavigation=off");
  await page.locator("#launch-start-button").click();
  await page.evaluate(() => window.__mappaMundiLoadApp());
  await expect(page.locator("#app-shell-title")).toHaveText("Main Menu");
  return seed.targetFeature;
}

async function completeGeneratedPhysicalSequence(page, {
  targetId,
  title,
  family,
  connectionPrompt,
  connectionAnswer,
  expectedFallbackReason = "physical-feature-interleave-required"
}) {
  const feature = await openSeededPhysicalSequence(page, targetId);
  await launchNextBlock(page, feature.introductionBlockId);
  await expect(page.locator("#poc-title")).toHaveAttribute("title", title, { timeout: 20_000 });
  await expect(page.locator(".study-target-list-item")).toHaveCount(1);
  await expect(page.locator(".study-target-list-item")).toContainText(feature.name);
  await expect.poll(() => page.evaluate(() => (
    window.__MAPPA_TEST_API__.getGuidedPhysicalFeatureVisualState()
  ))).toMatchObject({
    targetId,
    family,
    geometryMetadata: { representation: feature.geometry.representation },
    cameraDecision: { mode: "fit-feature" },
    dragPanEnabled: true,
    scrollZoomEnabled: true
  });
  const physicalVisualState = await page.evaluate(() => (
    window.__MAPPA_TEST_API__.getGuidedPhysicalFeatureVisualState()
  ));
  expect(physicalVisualState.sourceBounds.flat(2).every(Number.isFinite)).toBe(true);
  expect(physicalVisualState.cameraDecision.bounds.flat(2).every(Number.isFinite)).toBe(true);

  await page.getByRole("button", { name: "Continue Guided Learning" }).click();
  await expect(page.locator(".memory-trail-panel")).toBeVisible({ timeout: 20_000 });
  await launchNextBlock(page, feature.practiceBlockId);
  await finishTargetedPhysicalPractice(page, targetId);
  await page.locator("#memory-trail-primary-button").click();
  await expect(page.locator(".memory-trail-panel")).toBeVisible({ timeout: 20_000 });

  if (feature.connectionBlockId) {
    await launchNextBlock(page, feature.connectionBlockId);
    await expect(page.locator("#mental-map-challenge-panel")).toBeVisible({ timeout: 20_000 });
    await expect(page.locator(".mental-map-question-header")).toContainText(connectionPrompt);
    await page.locator(".mental-map-answer-choice", { hasText: connectionAnswer }).click();
    await page.getByRole("button", { name: "Submit" }).click();
    await expect(page.getByRole("button", { name: "Continue Guided Learning" })).toBeVisible();
    await page.getByRole("button", { name: "Continue Guided Learning" }).click();
    await expect(page.locator(".memory-trail-panel")).toBeVisible({ timeout: 20_000 });
  }

  const trace = await page.evaluate(() => window.__MAPPA_TEST_API__.getGuidedLearningOrchestration());
  expect(trace.state.completedBlockIds).toEqual(expect.arrayContaining(feature.blockIds));
  expect(trace.state.physicalInterleaveRequired).toBe(true);
  expect(trace.currentBlock.type).toBe("guided-section");
  expect(trace.fallbackReason).toBe(expectedFallbackReason);
  const evidence = await page.evaluate((key) => (
    JSON.parse(localStorage.getItem(key) || "{}").events || []
  ), CANONICAL_EVIDENCE_REPOSITORY_STORAGE_KEY);
  const featureEvidence = evidence.filter(({ conceptId }) => conceptId === feature.conceptId);
  expect(featureEvidence.filter(({ outcome, sourceMode }) => (
    outcome === "assisted" && sourceMode === "guided-learning-orchestration"
  ))).toHaveLength(1);
  expect(featureEvidence.some(({ outcome, sourceMode }) => (
    outcome === "correct" && sourceMode === "memory-trail"
  ))).toBe(true);
  expect(new Set(evidence.map(({ eventId }) => eventId)).size).toBe(evidence.length);
}

test("Guided Learning orchestrates New England reconstruction, White Mountains learning, and Connections", async ({ page }) => {
  const runtimeErrors = [];
  page.on("pageerror", (error) => runtimeErrors.push(`pageerror: ${error.message}`));
  page.on("console", (message) => {
    if (message.type() === "error" && !message.text().includes("Failed to load resource")) {
      runtimeErrors.push(`console: ${message.text()}`);
    }
  });

  await openSeededGuidedLearning(page);
  const guidedPlanBefore = await page.evaluate(() => window.__MAPPA_TEST_API__.getUnitedStatesMemoryTrailPlan());

  await launchNextBlock(page, "us-guided:rebuild-new-england");
  await expect(page.locator('[data-map-reconstruction-region-id="rebuild-new-england"]')).toBeVisible({ timeout: 20_000 });
  const evidenceCountBeforeReconstruction = await page.evaluate((key) => (
    JSON.parse(localStorage.getItem(key)).events.length
  ), CANONICAL_EVIDENCE_REPOSITORY_STORAGE_KEY);
  await page.getByRole("button", { name: "Submit" }).click();
  await expect(page.getByRole("button", { name: "Continue Guided Learning" })).toBeVisible();
  const reconstructionEvidence = await page.evaluate((key) => (
    JSON.parse(localStorage.getItem(key)).events.filter(({ sourceMode }) => sourceMode === "map-reconstruction")
  ), CANONICAL_EVIDENCE_REPOSITORY_STORAGE_KEY);
  expect(reconstructionEvidence).toHaveLength(6);
  expect(new Set(reconstructionEvidence.map(({ attemptId }) => attemptId)).size).toBe(1);
  expect(await page.evaluate((key) => JSON.parse(localStorage.getItem(key)).events.length, CANONICAL_EVIDENCE_REPOSITORY_STORAGE_KEY))
    .toBe(evidenceCountBeforeReconstruction + 6);
  await page.getByRole("button", { name: "Continue Guided Learning" }).click();
  await expect(page.locator(".memory-trail-panel")).toBeVisible({ timeout: 20_000 });
  expect(await page.evaluate(() => window.__MAPPA_TEST_API__.getUnitedStatesMemoryTrailPlan())).toEqual(guidedPlanBefore);

  await launchNextBlock(page, "us-guided:introduce-white-mountains");
  await expect(page.locator("#poc-title")).toHaveAttribute("title", "U.S. Mountain Ranges", { timeout: 20_000 });
  await expect(page.locator(".study-target-list-item")).toHaveCount(1);
  await expect(page.locator(".study-target-list-item")).toContainText("White Mountains");
  await expect(page.locator(".study-target-list-item")).toHaveClass(/revealed/);
  await expect.poll(() => page.evaluate(() => (
    window.__MAPPA_TEST_API__.getMountainRangeVisualState()?.mountainSymbolTargetIds.includes("white-mountains")
  ))).toBe(true);
  const evidenceCountBeforeIntroduction = await page.evaluate((key) => (
    JSON.parse(localStorage.getItem(key)).events.length
  ), CANONICAL_EVIDENCE_REPOSITORY_STORAGE_KEY);
  await page.getByRole("button", { name: "Continue Guided Learning" }).click();
  await expect(page.locator(".memory-trail-panel")).toBeVisible({ timeout: 20_000 });
  const introductionEvidence = await page.evaluate((key) => (
    JSON.parse(localStorage.getItem(key)).events.at(-1)
  ), CANONICAL_EVIDENCE_REPOSITORY_STORAGE_KEY);
  expect(introductionEvidence.conceptId).toBe("mountain-range-location:white-mountains");
  expect(introductionEvidence.outcome).toBe("assisted");
  expect(await page.evaluate((key) => JSON.parse(localStorage.getItem(key)).events.length, CANONICAL_EVIDENCE_REPOSITORY_STORAGE_KEY))
    .toBe(evidenceCountBeforeIntroduction + 1);

  await launchNextBlock(page, "us-guided:practice-white-mountains");
  await expect(page.locator(".memory-trail-panel")).toBeVisible({ timeout: 20_000 });
  await finishTargetedPhysicalPractice(page);
  await page.locator("#memory-trail-primary-button").click();
  await expect(page.locator(".memory-trail-panel")).toBeVisible({ timeout: 20_000 });

  await launchNextBlock(page, "us-guided:connect-maine-white-mountains");
  await expect(page.locator("#mental-map-challenge-panel")).toBeVisible({ timeout: 20_000 });
  await expect(page.locator(".mental-map-question-header")).toContainText("Which mountain range is located in Maine?");
  await expect.poll(() => page.evaluate(() => (
    window.__MAPPA_TEST_API__.getMentalMapVisualState()?.challengeId
  ))).toBe("us-relationship-mountain-range-maine-white-mountains");
  await page.locator(".mental-map-answer-choice", { hasText: "White Mountains" }).click();
  await page.getByRole("button", { name: "Submit" }).click();
  await expect(page.getByRole("button", { name: "Continue Guided Learning" })).toBeVisible();
  const connectionEvidence = await page.evaluate((key) => (
    JSON.parse(localStorage.getItem(key)).events.at(-1)
  ), CANONICAL_EVIDENCE_REPOSITORY_STORAGE_KEY);
  expect(connectionEvidence.conceptId).toBe("relationship:mountain-range:maine:white-mountains");
  expect(connectionEvidence.outcome).toBe("correct");
  expect(connectionEvidence.sourceMode).toBe("mental-map");
  await page.getByRole("button", { name: "Continue Guided Learning" }).click();
  await expect(page.locator(".memory-trail-panel")).toBeVisible({ timeout: 20_000 });

  const finalTrace = await page.evaluate(() => window.__MAPPA_TEST_API__.getGuidedLearningOrchestration());
  expect(finalTrace.state.completedBlockIds).toEqual([
    "us-guided:rebuild-new-england",
    "us-guided:introduce-white-mountains",
    "us-guided:practice-white-mountains",
    "us-guided:connect-maine-white-mountains"
  ]);
  expect(finalTrace.currentBlock.type).toBe("guided-section");
  expect(finalTrace.previousBlockId).toBe("us-guided:connect-maine-white-mountains");
  expect(await page.evaluate(() => window.__MAPPA_TEST_API__.getUnitedStatesMemoryTrailPlan())).toEqual(guidedPlanBefore);
  expect(runtimeErrors).toEqual([]);
});

test("leaving an orchestration checkpoint keeps it pending and resumes the Guided Learning scheduler", async ({ page }) => {
  await openSeededGuidedLearning(page);
  const guidedPlanBefore = await page.evaluate(() => window.__MAPPA_TEST_API__.getUnitedStatesMemoryTrailPlan());
  await launchNextBlock(page, "us-guided:rebuild-new-england");
  await expect(page.locator('[data-map-reconstruction-region-id="rebuild-new-england"]')).toBeVisible({ timeout: 20_000 });
  await page.locator("#back-button").click();
  await expect(page.locator(".memory-trail-panel")).toBeVisible({ timeout: 20_000 });
  const trace = await page.evaluate(() => window.__MAPPA_TEST_API__.getGuidedLearningOrchestration());
  expect(trace.currentBlock.id).toBe("us-guided:rebuild-new-england");
  expect(trace.state.activeStatus).toBe("pending");
  expect(await page.evaluate(() => window.__MAPPA_TEST_API__.getUnitedStatesMemoryTrailPlan())).toEqual(guidedPlanBefore);
});

test("a generated cross-border river sequence uses feature-fit framing and returns to Guided Learning", async ({ page }) => {
  await completeGeneratedPhysicalSequence(page, {
    targetId: "columbia-river",
    title: "U.S. Rivers",
    family: "river",
    connectionPrompt: "Which major river flows through Oregon?",
    connectionAnswer: "Columbia River"
  });
});

test("a generated lake sequence uses full lake geometry and returns to Guided Learning", async ({ page }) => {
  await completeGeneratedPhysicalSequence(page, {
    targetId: "lake-huron",
    title: "U.S. Lakes",
    family: "lake",
    connectionPrompt: "Which Great Lake borders Michigan?",
    connectionAnswer: "Lake Huron",
    expectedFallbackReason: "no-external-block-eligible"
  });
});
