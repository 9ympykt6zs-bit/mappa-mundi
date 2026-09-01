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

async function finishTargetedPhysicalPractice(
  page,
  targetIds = ["white-mountains", "green-mountains"],
  initialPromptedTargetIds = []
) {
  await expect.poll(() => page.evaluate(() => (
    window.__MAPPA_TEST_API__.getActiveMemoryTrailState()?.targetPoolIds
  ))).toEqual(targetIds);
  const promptedTargetIds = new Set(initialPromptedTargetIds);
  for (let attempt = 0; attempt < 14; attempt += 1) {
    if (await page.locator("#memory-trail-overlay").isVisible()) break;
    await expect.poll(() => page.evaluate(() => (
      window.__MAPPA_TEST_API__.getActiveMemoryTrailState()?.phase
    ))).toBe("answering");
    promptedTargetIds.add(await page.evaluate(() => (
      window.__MAPPA_TEST_API__.getActiveMemoryTrailState()?.currentPromptTargetId
    )));
    const promptState = await page.evaluate(() => window.__MAPPA_TEST_API__.getActiveMemoryTrailState());
    expect(promptState.guidedLocatingOnly).toBe(true);
    expect(promptState.currentPromptType).toBe("name_to_place");
    expect(promptState.activeHighlightIds).toEqual([]);
    expect(promptState.completedLabelTargetIds).toEqual([]);
    expect(await page.evaluate(() => (
      window.__MAPPA_TEST_API__.answerActiveMemoryTrailCorrectly()
    ))).toBe(true);
    await page.waitForTimeout(700);
  }
  await expect(page.locator("#memory-trail-overlay")).toBeVisible();
  await expect(page.locator("#memory-trail-primary-button")).toHaveText("Continue Guided Learning");
  expect([...promptedTargetIds].sort()).toEqual([...targetIds].sort());
}

async function finishGuidedPhysicalTeaching(page, { expectPractice = true, verifyWrongTap = false } = {}) {
  await expect(page.locator(".guided-physical-teaching-panel")).toBeVisible({ timeout: 20_000 });
  const initial = await page.evaluate(() => window.__MAPPA_TEST_API__.getGuidedPhysicalTeachingState());
  expect(initial.teachingTargetIds.length).toBeGreaterThan(0);
  const taughtOrder = [];
  if (verifyWrongTap) {
    const evidenceCountBefore = await page.evaluate((key) => (
      JSON.parse(localStorage.getItem(key) || "{}").events?.length || 0
    ), CANONICAL_EVIDENCE_REPOSITORY_STORAGE_KEY);
    expect(await page.evaluate(() => (
      window.__MAPPA_TEST_API__.answerGuidedPhysicalTeachingIncorrectly()
    ))).toBe(false);
    expect(await page.evaluate(() => window.__MAPPA_TEST_API__.getGuidedPhysicalTeachingState()?.currentTargetId))
      .toBe(initial.currentTargetId);
    expect(await page.evaluate((key) => (
      JSON.parse(localStorage.getItem(key) || "{}").events?.length || 0
    ), CANONICAL_EVIDENCE_REPOSITORY_STORAGE_KEY)).toBe(evidenceCountBefore);
  }

  for (let index = 0; index < initial.teachingTargetIds.length; index += 1) {
    const before = await page.evaluate(() => window.__MAPPA_TEST_API__.getGuidedPhysicalTeachingState());
    expect(before.phase).toBe("teaching");
    expect(before.activeHighlightIds).toEqual([before.currentTargetId]);
    expect(before.completedLabelTargetIds).not.toContain(before.currentTargetId);
    await expect(page.locator(".memory-trail-message")).toContainText(before.currentTargetName);
    taughtOrder.push(before.currentTargetId);
    expect(await page.evaluate(() => (
      window.__MAPPA_TEST_API__.answerGuidedPhysicalTeachingCorrectly()
    ))).toBe(true);
    if (index < initial.teachingTargetIds.length - 1) {
      await expect.poll(() => page.evaluate(() => (
        window.__MAPPA_TEST_API__.getGuidedPhysicalTeachingState()?.currentTargetId
      ))).not.toBe(before.currentTargetId);
    }
  }

  await expect(page.locator(".guided-physical-teaching-panel")).toBeHidden({ timeout: 20_000 });
  if (expectPractice) {
    await expect.poll(() => page.evaluate(() => (
      window.__MAPPA_TEST_API__.getActiveMemoryTrailState()?.guidedLocatingOnly
    ))).toBe(true);
  } else {
    await expect(page.locator(".memory-trail-panel")).toBeVisible({ timeout: 20_000 });
  }
  return taughtOrder;
}

async function panToAndClickRenderedMountainTarget(page, targetId) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const target = await page.evaluate((activeTargetId) => {
      const points = window.__MAPPA_TEST_API__.getMountainRangeVisualState()?.targetClientPointSets?.[activeTargetId] || [];
      const mapRect = document.querySelector("#map")?.getBoundingClientRect();
      const teachingRect = document.querySelector(".guided-physical-teaching-panel")?.getBoundingClientRect();
      if (!mapRect || points.length === 0) return null;
      const teachingOverlapsMap = teachingRect
        && teachingRect.left < mapRect.right
        && teachingRect.right > mapRect.left;
      const usableBottom = teachingOverlapsMap
        ? Math.min(mapRect.bottom, teachingRect.top)
        : mapRect.bottom;
      const visiblePoint = points.find(({ clientX, clientY }) => (
        clientX >= mapRect.left + 8
        && clientX <= mapRect.right - 8
        && clientY >= mapRect.top + 8
        && clientY <= usableBottom - 8
        && Boolean(document.elementFromPoint(clientX, clientY)?.closest?.("#map"))
      ));
      const usableCenter = {
        clientX: mapRect.left + (mapRect.width / 2),
        clientY: mapRect.top + ((usableBottom - mapRect.top) / 2)
      };
      const nearestPoint = points.reduce((nearest, point) => {
        const distance = Math.hypot(
          point.clientX - usableCenter.clientX,
          point.clientY - usableCenter.clientY
        );
        return !nearest || distance < nearest.distance ? { ...point, distance } : nearest;
      }, null);
      return { visiblePoint, nearestPoint, usableCenter };
    }, targetId);
    expect(target).toBeTruthy();
    if (target.visiblePoint) {
      const cameraBeforeTap = await page.evaluate(() => (
        window.__MAPPA_TEST_API__.getGuidedPhysicalFeatureVisualState()?.camera
      ));
      await page.mouse.click(target.visiblePoint.clientX, target.visiblePoint.clientY);
      return cameraBeforeTap;
    }
    const deltaX = Math.max(-140, Math.min(140, target.usableCenter.clientX - target.nearestPoint.clientX));
    const deltaY = Math.max(-140, Math.min(140, target.usableCenter.clientY - target.nearestPoint.clientY));
    await page.mouse.move(target.usableCenter.clientX, target.usableCenter.clientY);
    await page.mouse.down();
    await page.mouse.move(
      target.usableCenter.clientX + deltaX,
      target.usableCenter.clientY + deltaY,
      { steps: 8 }
    );
    await page.mouse.up();
    await page.waitForTimeout(350);
  }
  throw new Error(`Could not pan ${targetId} into the visible map viewport.`);
}

async function expectGuidedPhysicalCameraToMatch(page, expectedCamera) {
  await expect.poll(() => page.evaluate((expected) => {
    const camera = window.__MAPPA_TEST_API__.getGuidedPhysicalFeatureVisualState()?.camera;
    return Boolean(
      camera?.center
      && Math.abs(camera.center[0] - expected.center[0]) < 0.001
      && Math.abs(camera.center[1] - expected.center[1]) < 0.001
      && Math.abs(camera.zoom - expected.zoom) < 0.001
    );
  }, expectedCamera)).toBe(true);
}

function createTargetedPhysicalSeed(targetId, { extraStateIds = [] } = {}) {
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
      events: [...new Set([...targetFeature.introductionPrerequisiteStateIds, ...extraStateIds])].map((stateId, sequence) => ({
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
      version: 4,
      orchestrationId: UNITED_STATES_GUIDED_LEARNING_ORCHESTRATION_V1.id,
      completedBlockIds: earlierCompletedBlockIds,
      activeBlockId: null,
      activeStatus: null,
      previousBlockId: earlierCompletedBlockIds.at(-1),
      physicalInterleaveRequired: false,
      lastCompletedPhysicalFeatureId: null,
      lastCompletedPhysicalCohortId: null,
      physicalTeachingProgress: {},
      retrievedPhysicalCohortTargetIds: {},
      lastNonPhysicalMilestone: null,
      returnContext: null,
      lastTransition: null
    }
  };
}

async function openSeededPhysicalSequence(page, targetId, options = {}) {
  const seed = createTargetedPhysicalSeed(targetId, options);
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
  await expect(page.locator(".guided-physical-teaching-panel")).toBeVisible();
  await expect(page.locator(".study-target-list-item")).toHaveCount(0);
  await expect.poll(() => page.evaluate(() => (
    window.__MAPPA_TEST_API__.getGuidedPhysicalFeatureVisualState()
  ))).toMatchObject({
    family,
    geometryMetadata: { representation: feature.geometry.representation },
    dragPanEnabled: true,
    scrollZoomEnabled: true
  });
  const physicalVisualState = await page.evaluate(() => (
    window.__MAPPA_TEST_API__.getGuidedPhysicalFeatureVisualState()
  ));
  expect(physicalVisualState.focusTargetIds).toContain(targetId);
  expect(physicalVisualState.sourceBounds.flat(2).every(Number.isFinite)).toBe(true);
  if (physicalVisualState.cameraDecision.mode === "fit-feature") {
    expect(physicalVisualState.cameraDecision.bounds.flat(2).every(Number.isFinite)).toBe(true);
  }

  const taughtTargetIds = await finishGuidedPhysicalTeaching(page, {
    expectPractice: Boolean(feature.practiceBlockId)
  });
  expect(taughtTargetIds).toContain(targetId);
  let practicedTargetIds = [];
  if (feature.practiceBlockId) {
    practicedTargetIds = await page.evaluate(() => (
      window.__MAPPA_TEST_API__.getActiveMemoryTrailState()?.targetPoolIds || []
    ));
    expect(practicedTargetIds.length).toBeGreaterThanOrEqual(2);
    await finishTargetedPhysicalPractice(page, practicedTargetIds);
    await page.locator("#memory-trail-primary-button").click();
    await expect(page.locator(".memory-trail-panel")).toBeVisible({ timeout: 20_000 });
  }

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
  expect(trace.state.completedBlockIds).toEqual(expect.arrayContaining(
    feature.blockIds.filter((blockId) => blockId !== feature.practiceBlockId || practicedTargetIds.length > 0)
  ));
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
  ))).toBe(Boolean(feature.practiceBlockId));
  expect(featureEvidence.some(({ outcome, sourceMode }) => (
    outcome === "incorrect" && sourceMode === "guided-learning-orchestration"
  ))).toBe(false);
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
  await expect(page.locator(".guided-physical-teaching-panel")).toBeVisible();
  await expect(page.locator(".study-target-list-item")).toHaveCount(0);
  await expect(page.locator(".memory-trail-message")).toContainText("White Mountains");
  await expect.poll(() => page.evaluate(() => (
    window.__MAPPA_TEST_API__.getGuidedPhysicalTeachingState()
  ))).toMatchObject({
    phase: "teaching",
    currentTargetId: "white-mountains",
    teachingTargetIds: ["white-mountains", "green-mountains"],
    taughtTargetIds: [],
    activeHighlightIds: ["white-mountains"]
  });
  await expect.poll(() => page.evaluate(() => (
    window.__MAPPA_TEST_API__.getGuidedPhysicalFeatureVisualState()?.cameraDecision
  ))).toMatchObject({
    mode: "override",
    center: [-76.24, 40.39],
    zoom: 5.16
  });
  await expect.poll(() => page.evaluate(() => {
    const camera = window.__MAPPA_TEST_API__.getGuidedPhysicalFeatureVisualState()?.camera;
    return Boolean(
      camera?.center
      && Math.abs(camera.center[0] - (-76.24)) < 0.001
      && Math.abs(camera.center[1] - 40.39) < 0.001
      && Math.abs(camera.zoom - 5.16) < 0.001
    );
  })).toBe(true);
  await expect.poll(() => page.evaluate(() => (
    window.__MAPPA_TEST_API__.getMountainRangeVisualState()?.mountainSymbolTargetIds.includes("white-mountains")
  ))).toBe(true);
  const evidenceCountBeforeIntroduction = await page.evaluate((key) => (
    JSON.parse(localStorage.getItem(key)).events.length
  ), CANONICAL_EVIDENCE_REPOSITORY_STORAGE_KEY);
  const teachingCamera = await page.evaluate(() => (
    window.__MAPPA_TEST_API__.getGuidedPhysicalFeatureVisualState()?.camera
  ));
  expect(await finishGuidedPhysicalTeaching(page, { verifyWrongTap: true })).toEqual([
    "white-mountains",
    "green-mountains"
  ]);
  await expect.poll(() => page.evaluate(() => {
    const camera = window.__MAPPA_TEST_API__.getGuidedPhysicalFeatureVisualState()?.camera;
    return Boolean(
      camera?.center
      && Math.abs(camera.center[0] - (-76.24)) < 0.001
      && Math.abs(camera.center[1] - 40.39) < 0.001
      && Math.abs(camera.zoom - 5.16) < 0.001
    );
  })).toBe(true);
  const introductionEvidence = await page.evaluate((key) => (
    JSON.parse(localStorage.getItem(key)).events
      .filter(({ sourceMode }) => sourceMode === "guided-learning-orchestration")
      .slice(-2)
  ), CANONICAL_EVIDENCE_REPOSITORY_STORAGE_KEY);
  expect(introductionEvidence.map(({ conceptId }) => conceptId)).toEqual([
    "mountain-range-location:white-mountains",
    "mountain-range-location:green-mountains"
  ]);
  expect(introductionEvidence.every(({ outcome }) => outcome === "assisted")).toBe(true);
  expect(new Set(introductionEvidence.map(({ eventId }) => eventId)).size).toBe(2);
  expect(await page.evaluate((key) => JSON.parse(localStorage.getItem(key)).events.length, CANONICAL_EVIDENCE_REPOSITORY_STORAGE_KEY))
    .toBe(evidenceCountBeforeIntroduction + 2);
  expect(Math.abs(teachingCamera.center[0] - (-76.24))).toBeLessThan(0.001);
  expect(Math.abs(teachingCamera.center[1] - 40.39)).toBeLessThan(0.001);
  expect(Math.abs(teachingCamera.zoom - 5.16)).toBeLessThan(0.001);
  await expect.poll(() => page.evaluate(() => (
    window.__MAPPA_TEST_API__.getGuidedPhysicalFeatureVisualState()?.cameraDecision
  ))).toMatchObject({
    mode: "override",
    center: [-76.24, 40.39],
    zoom: 5.16
  });
  await expect.poll(() => page.evaluate(() => {
    const camera = window.__MAPPA_TEST_API__.getGuidedPhysicalFeatureVisualState()?.camera;
    return Boolean(
      camera?.center
      && Math.abs(camera.center[0] - (-76.24)) < 0.001
      && Math.abs(camera.center[1] - 40.39) < 0.001
      && Math.abs(camera.zoom - 5.16) < 0.001
    );
  })).toBe(true);
  await expect.poll(() => page.evaluate(() => (
    window.__MAPPA_TEST_API__.getActiveMemoryTrailState()
  ))).toMatchObject({
    guidedLocatingOnly: true,
    currentPromptType: "name_to_place",
    targetPoolIds: ["white-mountains", "green-mountains"],
    activeHighlightIds: [],
    completedLabelTargetIds: []
  });
  await finishTargetedPhysicalPractice(page, ["white-mountains", "green-mountains"]);
  await expect.poll(() => page.evaluate(() => {
    const camera = window.__MAPPA_TEST_API__.getGuidedPhysicalFeatureVisualState()?.camera;
    return Boolean(
      camera?.center
      && Math.abs(camera.center[0] - (-76.24)) < 0.001
      && Math.abs(camera.center[1] - 40.39) < 0.001
      && Math.abs(camera.zoom - 5.16) < 0.001
    );
  })).toBe(true);
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

  await launchNextBlock(page, "us-guided:connect-vermont-green-mountains");
  await expect(page.locator("#mental-map-challenge-panel")).toBeVisible({ timeout: 20_000 });
  await expect(page.locator(".mental-map-question-header")).toContainText("Which mountain range is located in Vermont?");
  await page.locator(".mental-map-answer-choice", { hasText: "Green Mountains" }).click();
  await page.getByRole("button", { name: "Submit" }).click();
  await expect(page.getByRole("button", { name: "Continue Guided Learning" })).toBeVisible();
  await page.getByRole("button", { name: "Continue Guided Learning" }).click();
  await expect(page.locator(".memory-trail-panel")).toBeVisible({ timeout: 20_000 });

  const finalTrace = await page.evaluate(() => window.__MAPPA_TEST_API__.getGuidedLearningOrchestration());
  expect(finalTrace.state.completedBlockIds).toEqual([
    "us-guided:rebuild-new-england",
    "us-guided:introduce-white-mountains",
    "us-guided:introduce-green-mountains",
    "us-guided:practice-white-mountains",
    "us-guided:connect-maine-white-mountains",
    "us-guided:connect-vermont-green-mountains"
  ]);
  expect(finalTrace.state.retrievedPhysicalCohortTargetIds["northeast-mountains"]).toEqual([
    "white-mountains",
    "green-mountains"
  ]);
  expect(finalTrace.currentBlock.type).toBe("guided-section");
  expect(finalTrace.previousBlockId).toBe("us-guided:connect-vermont-green-mountains");
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

test("the eligible three-range Northeast cohort teaches by map tap before mixed locating retrieval", async ({ page }) => {
  await openSeededPhysicalSequence(page, "white-mountains", { extraStateIds: ["vermont", "new-york"] });
  await launchNextBlock(page, "us-guided:introduce-white-mountains");
  await expect.poll(() => page.evaluate(() => (
    window.__MAPPA_TEST_API__.getGuidedPhysicalTeachingState()
  ))).toMatchObject({
    currentTargetId: "white-mountains",
    teachingTargetIds: ["white-mountains", "green-mountains", "adirondack-mountains"],
    activeHighlightIds: ["white-mountains"]
  });
  await expect.poll(() => page.evaluate(() => {
    const camera = window.__MAPPA_TEST_API__.getGuidedPhysicalFeatureVisualState()?.camera;
    return Boolean(
      camera?.center
      && Math.abs(camera.center[0] - (-76.24)) < 0.001
      && Math.abs(camera.center[1] - 40.39) < 0.001
      && Math.abs(camera.zoom - 5.16) < 0.001
    );
  })).toBe(true);

  const teachingTargetIds = ["white-mountains", "green-mountains", "adirondack-mountains"];
  for (const [index, targetId] of teachingTargetIds.entries()) {
    await expect.poll(() => page.evaluate(() => (
      window.__MAPPA_TEST_API__.getGuidedPhysicalTeachingState()?.currentTargetId
    ))).toBe(targetId);
    const cameraBeforeTap = await panToAndClickRenderedMountainTarget(page, targetId);
    if (index < teachingTargetIds.length - 1) {
      await expect.poll(() => page.evaluate(() => (
        window.__MAPPA_TEST_API__.getGuidedPhysicalTeachingState()?.currentTargetId
      ))).toBe(teachingTargetIds[index + 1]);
      await expectGuidedPhysicalCameraToMatch(page, cameraBeforeTap);
    } else {
      await expect.poll(() => page.evaluate(() => (
        window.__MAPPA_TEST_API__.getActiveMemoryTrailState()?.guidedLocatingOnly
      ))).toBe(true);
      await expect.poll(() => page.evaluate(() => {
        const camera = window.__MAPPA_TEST_API__.getGuidedPhysicalFeatureVisualState()?.camera;
        return Boolean(
          camera?.center
          && Math.abs(camera.center[0] - (-76.24)) < 0.001
          && Math.abs(camera.center[1] - 40.39) < 0.001
          && Math.abs(camera.zoom - 5.16) < 0.001
        );
      })).toBe(true);
    }
  }

  await expect.poll(() => page.evaluate(() => (
    window.__MAPPA_TEST_API__.getActiveMemoryTrailState()
  ))).toMatchObject({
    guidedLocatingOnly: true,
    currentPromptType: "name_to_place",
    targetPoolIds: ["white-mountains", "green-mountains", "adirondack-mountains"],
    activeHighlightIds: [],
    completedLabelTargetIds: []
  });

  const retrievalTargetId = await page.evaluate(() => (
    window.__MAPPA_TEST_API__.getActiveMemoryTrailState()?.currentPromptTargetId
  ));
  const retrievalCameraBeforeTap = await panToAndClickRenderedMountainTarget(page, retrievalTargetId);
  await page.waitForTimeout(700);
  await expectGuidedPhysicalCameraToMatch(page, retrievalCameraBeforeTap);
  await finishTargetedPhysicalPractice(page, [
    "white-mountains",
    "green-mountains",
    "adirondack-mountains"
  ], [retrievalTargetId]);
  const evidence = await page.evaluate((key) => (
    (JSON.parse(localStorage.getItem(key) || "{}").events || [])
      .filter(({ conceptId }) => conceptId.startsWith("mountain-range-location:"))
  ), CANONICAL_EVIDENCE_REPOSITORY_STORAGE_KEY);
  expect(evidence.filter(({ sourceMode, outcome }) => (
    sourceMode === "guided-learning-orchestration" && outcome === "assisted"
  )).map(({ conceptId }) => conceptId)).toEqual([
    "mountain-range-location:white-mountains",
    "mountain-range-location:green-mountains",
    "mountain-range-location:adirondack-mountains"
  ]);
});

test("an interrupted physical teaching cohort resumes at the first untaught target without duplicate evidence", async ({ page }) => {
  await openSeededPhysicalSequence(page, "white-mountains", { extraStateIds: ["vermont"] });
  await launchNextBlock(page, "us-guided:introduce-white-mountains");
  await expect.poll(() => page.evaluate(() => (
    window.__MAPPA_TEST_API__.getGuidedPhysicalTeachingState()
  ))).toMatchObject({
    currentTargetId: "white-mountains",
    teachingTargetIds: ["white-mountains", "green-mountains"]
  });
  expect(await page.evaluate(() => window.__MAPPA_TEST_API__.answerGuidedPhysicalTeachingCorrectly())).toBe(true);
  await expect.poll(() => page.evaluate(() => (
    window.__MAPPA_TEST_API__.getGuidedPhysicalTeachingState()?.currentTargetId
  ))).toBe("green-mountains");
  const evidenceCountAfterWhite = await page.evaluate((key) => (
    JSON.parse(localStorage.getItem(key) || "{}").events?.length || 0
  ), CANONICAL_EVIDENCE_REPOSITORY_STORAGE_KEY);
  await page.getByRole("button", { name: "Back to Guided Learning" }).evaluate((button) => button.click());
  await expect(page.locator(".guided-physical-teaching-panel")).toBeHidden({ timeout: 20_000 });
  await expect(page.locator(".memory-trail-panel")).toBeVisible({ timeout: 20_000 });
  await expect.poll(() => page.evaluate(() => (
    window.__MAPPA_TEST_API__.getGuidedLearningOrchestration().state.activeStatus
  ))).toBe("pending");
  const deferredTrace = await page.evaluate(() => window.__MAPPA_TEST_API__.getGuidedLearningOrchestration());
  expect(deferredTrace.currentBlock.id).toBe("us-guided:introduce-white-mountains");
  expect(deferredTrace.state.activeStatus).toBe("pending");
  expect(deferredTrace.state.physicalTeachingProgress["us-guided:introduce-white-mountains"]).toMatchObject({
    taughtTargetIds: ["white-mountains"],
    currentTargetId: "green-mountains",
    phase: "teaching"
  });

  await launchNextBlock(page, "us-guided:introduce-white-mountains");
  await expect.poll(() => page.evaluate(() => (
    window.__MAPPA_TEST_API__.getGuidedPhysicalTeachingState()
  ))).toMatchObject({
    currentTargetId: "green-mountains",
    taughtTargetIds: ["white-mountains"],
    activeHighlightIds: ["green-mountains"]
  });
  expect(await page.evaluate((key) => (
    JSON.parse(localStorage.getItem(key) || "{}").events?.length || 0
  ), CANONICAL_EVIDENCE_REPOSITORY_STORAGE_KEY)).toBe(evidenceCountAfterWhite);
  expect(await page.evaluate(() => window.__MAPPA_TEST_API__.answerGuidedPhysicalTeachingCorrectly())).toBe(true);
  await expect.poll(() => page.evaluate(() => (
    window.__MAPPA_TEST_API__.getActiveMemoryTrailState()?.guidedLocatingOnly
  ))).toBe(true);
  const guidedEvidence = await page.evaluate((key) => (
    (JSON.parse(localStorage.getItem(key) || "{}").events || [])
      .filter(({ sourceMode }) => sourceMode === "guided-learning-orchestration")
  ), CANONICAL_EVIDENCE_REPOSITORY_STORAGE_KEY);
  expect(guidedEvidence.map(({ conceptId }) => conceptId)).toEqual([
    "mountain-range-location:white-mountains",
    "mountain-range-location:green-mountains"
  ]);
  expect(new Set(guidedEvidence.map(({ eventId }) => eventId)).size).toBe(guidedEvidence.length);
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
