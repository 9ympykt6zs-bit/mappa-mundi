import { expect, test } from "@playwright/test";
import { CANONICAL_EVIDENCE_REPOSITORY_STORAGE_KEY } from "../../src/canonical-learning-evidence-repository.js";
import { unitedStatesMemoryTrailStorageKey } from "../../src/united-states-memory-trail-planner.js";
import {
  GUIDED_LEARNING_ORCHESTRATION_STORAGE_KEY,
  UNITED_STATES_GUIDED_LEARNING_ORCHESTRATION_V1
} from "../../src/guided-learning-orchestration.js";
import { GUIDED_CHILD_LAUNCH_STORAGE_KEY } from "../../src/guided-child-launch-contract.js";

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
  const completedState = await page.evaluate(() => window.__MAPPA_TEST_API__.getActiveMemoryTrailState());
  expect(completedState.promptCount).toBe(targetIds.length);
  expect(completedState.promptHistory.map(({ targetId }) => targetId).sort()).toEqual([...targetIds].sort());
  expect([...promptedTargetIds].sort()).toEqual([...targetIds].sort());
  return completedState.promptHistory.map(({ targetId }) => targetId);
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
  await expect.poll(() => page.evaluate(() => (
    window.maplibrePocMap.getLayoutProperty("mountain-range-symbol", "visibility")
  ))).toBe("visible");
  await expect.poll(() => page.evaluate(() => window.maplibrePocMap.isMoving())).toBe(false);
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
      const visiblePoint = points.find(({ clientX, clientY, x, y }) => (
        clientX >= mapRect.left + 8
        && clientX <= mapRect.right - 8
        && clientY >= mapRect.top + 8
        && clientY <= usableBottom - 8
        && Boolean(document.elementFromPoint(clientX, clientY)?.closest?.("#map"))
        && window.maplibrePocMap.queryRenderedFeatures([x, y], { layers: ["target-hit-fill"] })
          .some(({ properties }) => properties.id === activeTargetId)
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
  await page.addInitScript(({ repositoryKey, orchestrationKey, repository, orchestrationState, seedMarker }) => {
    if (localStorage.getItem(seedMarker) === "applied") return;
    localStorage.setItem(repositoryKey, JSON.stringify(repository));
    localStorage.setItem(orchestrationKey, JSON.stringify(orchestrationState));
    localStorage.setItem(seedMarker, "applied");
  }, {
    repositoryKey: CANONICAL_EVIDENCE_REPOSITORY_STORAGE_KEY,
    orchestrationKey: GUIDED_LEARNING_ORCHESTRATION_STORAGE_KEY,
    seedMarker: `mappaTestGuidedPhysicalSeed:${targetId}`,
    repository: seed.repository,
    orchestrationState: seed.orchestrationState
  });
  await page.goto("/?test=1&globeNavigation=off");
  await page.locator("#launch-start-button").click();
  await page.evaluate(() => window.__mappaMundiLoadApp());
  await expect(page.locator("#app-shell-title")).toHaveText("Main Menu");
  return seed.targetFeature;
}

async function reloadAndReenterGuidedLearning(page) {
  await page.reload();
  await expect(page.locator("#launch-screen")).toBeVisible();
  await page.locator("#launch-start-button").click();
  await page.evaluate(() => window.__mappaMundiLoadApp());
  await expect(page.locator("#app-shell-title")).toHaveText("Main Menu");
  await page.locator("#main-menu-us-memory-trail-button").click();
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
  expect(physicalVisualState.cameraDecision).toMatchObject({
    source: "lower48-physical-default",
    center: [-97.76220, 39.30636],
    zoom: 4.1407
  });
  await expectGuidedPhysicalCameraToMatch(page, { center: [-97.76220, 39.30636], zoom: 4.1407 });

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

test("a bounded Guided physical child preserves provenance, subset, and completion across reload", async ({ page }) => {
  const feature = await openSeededPhysicalSequence(page, "white-mountains", {
    extraStateIds: ["vermont", "new-york"]
  });
  await launchNextBlock(page, feature.introductionBlockId);
  await expect.poll(() => page.evaluate(() => (
    window.__MAPPA_TEST_API__.getGuidedPhysicalTeachingState()?.currentTargetId
  ))).toBe("white-mountains");
  const originalContract = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)), GUIDED_CHILD_LAUNCH_STORAGE_KEY);
  expect(originalContract).toMatchObject({
    source: "guided-learning",
    orchestrationBlockId: feature.introductionBlockId,
    status: "launched",
    returnTo: "guided-learning",
    child: {
      destinationKind: "physical-feature-introduction"
    }
  });
  const boundedTargetIds = originalContract.child.targetIds;
  expect(boundedTargetIds).toEqual(["white-mountains", "green-mountains", "adirondack-mountains"]);
  expect(originalContract.child.teachingTargetIds).toEqual(boundedTargetIds);
  expect(JSON.stringify(originalContract)).not.toContain("function");
  expect(await page.evaluate(() => window.__MAPPA_TEST_API__.answerGuidedPhysicalTeachingCorrectly())).toBe(true);
  await expect.poll(() => page.evaluate(() => (
    window.__MAPPA_TEST_API__.getGuidedPhysicalTeachingState()?.currentTargetId
  ))).toBe("green-mountains");
  const evidenceAfterFirstIntroduction = await page.evaluate((key) => (
    JSON.parse(localStorage.getItem(key) || "{}").events || []
  ), CANONICAL_EVIDENCE_REPOSITORY_STORAGE_KEY);

  await reloadAndReenterGuidedLearning(page);
  await expect.poll(() => page.evaluate(() => (
    window.__MAPPA_TEST_API__.getGuidedPhysicalTeachingState()?.currentTargetId
  ))).toBe("green-mountains");
  const resumedIntroduction = await page.evaluate(() => window.__MAPPA_TEST_API__.getGuidedLearningOrchestration());
  expect(resumedIntroduction.rehydratedLaunchContract).toBe(true);
  expect(resumedIntroduction.runtime).toMatchObject({
    blockId: feature.introductionBlockId,
    rehydratedLaunchContract: true
  });
  expect(resumedIntroduction.childLaunchContract.child.targetIds).toEqual(originalContract.child.targetIds);
  expect(await page.evaluate((key) => (
    JSON.parse(localStorage.getItem(key) || "{}").events || []
  ), CANONICAL_EVIDENCE_REPOSITORY_STORAGE_KEY)).toEqual(evidenceAfterFirstIntroduction);

  for (const remainingTargetId of boundedTargetIds.slice(1)) {
    await expect.poll(() => page.evaluate(() => (
      window.__MAPPA_TEST_API__.getGuidedPhysicalTeachingState()?.currentTargetId
    ))).toBe(remainingTargetId);
    expect(await page.evaluate(() => window.__MAPPA_TEST_API__.answerGuidedPhysicalTeachingCorrectly())).toBe(true);
  }
  await expect.poll(() => page.evaluate(() => (
    window.__MAPPA_TEST_API__.getActiveMemoryTrailState()?.targetPoolIds
  )), { timeout: 20_000 }).toEqual(boundedTargetIds);
  const practiceContract = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)), GUIDED_CHILD_LAUNCH_STORAGE_KEY);
  expect(practiceContract).toMatchObject({
    orchestrationBlockId: feature.practiceBlockId,
    status: "launched",
    child: {
      destinationKind: "targeted-memory-trail",
      targetIds: boundedTargetIds
    }
  });

  await reloadAndReenterGuidedLearning(page);
  await expect.poll(() => page.evaluate(() => (
    window.__MAPPA_TEST_API__.getActiveMemoryTrailState()?.targetPoolIds
  )), { timeout: 20_000 }).toEqual(boundedTargetIds);
  const resumedPractice = await page.evaluate(() => window.__MAPPA_TEST_API__.getGuidedLearningOrchestration());
  expect(resumedPractice.runtime.rehydratedLaunchContract).toBe(true);
  expect(resumedPractice.runtime.physicalCohortTargetIds).toEqual(boundedTargetIds);
  expect(resumedPractice.runtime.physicalCohortTargetIds.length).toBeLessThan(
    (await page.evaluate(() => window.__MAPPA_TEST_API__.getMountainRangeVisualState().mountainSymbolTargetIds.length))
  );

  await finishTargetedPhysicalPractice(page, boundedTargetIds);
  const evidenceAtCompletion = await page.evaluate((key) => (
    JSON.parse(localStorage.getItem(key) || "{}").events || []
  ), CANONICAL_EVIDENCE_REPOSITORY_STORAGE_KEY);
  expect(await page.evaluate((key) => JSON.parse(localStorage.getItem(key)).status, GUIDED_CHILD_LAUNCH_STORAGE_KEY))
    .toBe("completed");

  await reloadAndReenterGuidedLearning(page);
  await expect(page.locator("#memory-trail-overlay")).toBeVisible({ timeout: 20_000 });
  await expect(page.locator("#memory-trail-primary-button")).toHaveText("Continue Guided Learning");
  await expect(page.locator("#memory-trail-secondary-button")).toBeHidden();
  const completedResume = await page.evaluate(() => window.__MAPPA_TEST_API__.getGuidedLearningOrchestration());
  expect(completedResume.runtime).toMatchObject({
    blockId: feature.practiceBlockId,
    status: "completed",
    rehydratedLaunchContract: true
  });
  expect(await page.evaluate((key) => (
    JSON.parse(localStorage.getItem(key) || "{}").events || []
  ), CANONICAL_EVIDENCE_REPOSITORY_STORAGE_KEY)).toEqual(evidenceAtCompletion);

  await page.locator("#memory-trail-primary-button").click();
  await expect(page.locator(".memory-trail-panel")).toBeVisible({ timeout: 20_000 });
  expect(await page.evaluate((key) => localStorage.getItem(key), GUIDED_CHILD_LAUNCH_STORAGE_KEY)).toBeNull();
  await reloadAndReenterGuidedLearning(page);
  await expect(page.locator(".memory-trail-panel")).toBeVisible({ timeout: 20_000 });
  expect(await page.evaluate((key) => localStorage.getItem(key), GUIDED_CHILD_LAUNCH_STORAGE_KEY)).toBeNull();
  await page.evaluate(() => window.__MAPPA_TEST_API__.openStandaloneActivity("us-physical-lakes", "medium"));
  await expect(page.locator("#answer-bank .label-chip")).toHaveCount(6);
  expect(await page.evaluate((key) => localStorage.getItem(key), GUIDED_CHILD_LAUNCH_STORAGE_KEY)).toBeNull();
  expect((await page.evaluate(() => window.__MAPPA_TEST_API__.getGuidedLearningOrchestration())).runtime).toBeNull();
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
  const retrievalSequence = await finishTargetedPhysicalPractice(page, [
    "white-mountains",
    "green-mountains",
    "adirondack-mountains"
  ], [retrievalTargetId]);
  expect(retrievalSequence).toHaveLength(3);
  expect(new Set(retrievalSequence).size).toBe(3);
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

test("a missed Northeast retrieval gets one later retry and then returns to Guided Learning", async ({ page }) => {
  await openSeededPhysicalSequence(page, "white-mountains", { extraStateIds: ["vermont", "new-york"] });
  await launchNextBlock(page, "us-guided:introduce-white-mountains");
  await finishGuidedPhysicalTeaching(page);

  const firstPrompt = await page.evaluate(() => (
    window.__MAPPA_TEST_API__.getActiveMemoryTrailState()?.currentPromptTargetId
  ));
  const evidenceCountBeforeRetrieval = await page.evaluate((key) => (
    JSON.parse(localStorage.getItem(key) || "{}").events?.length || 0
  ), CANONICAL_EVIDENCE_REPOSITORY_STORAGE_KEY);
  expect(await page.evaluate(() => window.__MAPPA_TEST_API__.answerActiveMemoryTrailIncorrectly())).toBe(true);
  await expect.poll(() => page.evaluate(() => (
    window.__MAPPA_TEST_API__.getActiveMemoryTrailState()?.phase
  ))).toBe("correction");
  expect(await page.evaluate(() => window.__MAPPA_TEST_API__.completeActiveMemoryTrailCorrection())).toBe(true);
  await expect.poll(() => page.evaluate(() => (
    window.__MAPPA_TEST_API__.getActiveMemoryTrailState()?.phase
  ))).toBe("answering");

  const secondPrompt = await page.evaluate(() => (
    window.__MAPPA_TEST_API__.getActiveMemoryTrailState()?.currentPromptTargetId
  ));
  expect(secondPrompt).not.toBe(firstPrompt);
  expect(await page.evaluate(() => window.__MAPPA_TEST_API__.answerActiveMemoryTrailCorrectly())).toBe(true);
  await expect.poll(() => page.evaluate(() => (
    window.__MAPPA_TEST_API__.getActiveMemoryTrailState()?.phase
  ))).toBe("answering");
  const thirdPrompt = await page.evaluate(() => (
    window.__MAPPA_TEST_API__.getActiveMemoryTrailState()?.currentPromptTargetId
  ));
  expect(new Set([firstPrompt, secondPrompt, thirdPrompt]).size).toBe(3);
  expect(await page.evaluate(() => window.__MAPPA_TEST_API__.answerActiveMemoryTrailCorrectly())).toBe(true);
  await expect.poll(() => page.evaluate(() => (
    window.__MAPPA_TEST_API__.getActiveMemoryTrailState()?.phase
  ))).toBe("answering");
  expect(await page.evaluate(() => (
    window.__MAPPA_TEST_API__.getActiveMemoryTrailState()?.currentPromptTargetId
  ))).toBe(firstPrompt);
  expect(await page.evaluate(() => window.__MAPPA_TEST_API__.answerActiveMemoryTrailCorrectly())).toBe(true);

  await expect(page.locator("#memory-trail-overlay")).toBeVisible({ timeout: 20_000 });
  const completed = await page.evaluate(() => window.__MAPPA_TEST_API__.getActiveMemoryTrailState());
  expect(completed.promptCount).toBe(4);
  expect(completed.guidedPhysicalRetrievalCheckpoint.complete).toBe(true);
  expect(completed.guidedPhysicalRetrievalCheckpoint.targets
    .find(({ targetId }) => targetId === firstPrompt)).toMatchObject({
      attemptCount: 2,
      incorrectCount: 1,
      finalOutcome: "correct"
    });
  expect(await page.evaluate((key) => (
    JSON.parse(localStorage.getItem(key) || "{}").events?.length || 0
  ), CANONICAL_EVIDENCE_REPOSITORY_STORAGE_KEY)).toBe(evidenceCountBeforeRetrieval + 4);
});

test("a due Northeast cohort launches as a new spaced Guided Learning review", async ({ page }) => {
  const targetIds = ["white-mountains", "green-mountains", "adirondack-mountains"];
  const completedBlockIds = UNITED_STATES_GUIDED_LEARNING_ORCHESTRATION_V1.blocks
    .filter(({ repeatable }) => !repeatable)
    .map(({ id }) => id);
  await page.addInitScript(({ orchestrationKey, configId, completedIds, cohortTargets }) => {
    localStorage.setItem(orchestrationKey, JSON.stringify({
      version: 5,
      orchestrationId: configId,
      completedBlockIds: completedIds,
      activeBlockId: null,
      activeStatus: null,
      previousBlockId: completedIds.at(-1),
      physicalInterleaveRequired: false,
      physicalTeachingProgress: {},
      retrievedPhysicalCohortTargetIds: { "northeast-mountains": cohortTargets },
      guidedLearningEventCount: 2,
      physicalReviewProgress: {
        "northeast-mountains": {
          cohortId: "northeast-mountains",
          generation: 1,
          previousOrder: [...cohortTargets].reverse(),
          targets: Object.fromEntries(cohortTargets.map((targetId) => [targetId, {
            targetId,
            lastLearningEvent: 0,
            dueAfterLearningEvent: 2,
            lastOutcome: "correct"
          }]))
        }
      }
    }));
  }, {
    orchestrationKey: GUIDED_LEARNING_ORCHESTRATION_STORAGE_KEY,
    configId: UNITED_STATES_GUIDED_LEARNING_ORCHESTRATION_V1.id,
    completedIds: completedBlockIds,
    cohortTargets: targetIds
  });
  await page.goto("/?test=1&globeNavigation=off");
  await page.locator("#launch-start-button").click();
  await page.evaluate(() => window.__mappaMundiLoadApp());
  await expect(page.locator("#app-shell-title")).toHaveText("Main Menu");

  await launchNextBlock(page, "us-guided:review-northeast-mountains");
  await expect.poll(() => page.evaluate(() => (
    window.__MAPPA_TEST_API__.getActiveMemoryTrailState()?.guidedPhysicalRetrievalCheckpoint
  ))).toMatchObject({
    cohortId: "northeast-mountains",
    kind: "review",
    generation: 1,
    complete: false
  });
  await finishTargetedPhysicalPractice(page, targetIds);
  const trace = await page.evaluate(() => window.__MAPPA_TEST_API__.getGuidedLearningOrchestration());
  expect(trace.state.completedBlockIds).not.toContain("us-guided:review-northeast-mountains");
  expect(trace.state.physicalInterleaveRequired).toBe(true);
  expect(trace.state.physicalReviewProgress["northeast-mountains"].generation).toBe(2);
  expect(trace.physicalCohortTrace.find(({ cohortId }) => cohortId === "northeast-mountains").review.eligible)
    .toBe(false);
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

test("a generated cross-border river sequence uses national framing and returns to Guided Learning", async ({ page }) => {
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
