import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";

import { journeyPresets } from "../../src/journey-presets.js";

const unitedStatesJourney = journeyPresets.find(({ id }) => id === "united-states");
const unitedStatesSteps = unitedStatesJourney.steps;
const lakesActivity = JSON.parse(readFileSync(new URL(
  "../../assets/maps/data/us-physical-lakes.json",
  import.meta.url
), "utf8"));
const firstStatesActivity = JSON.parse(readFileSync(new URL(
  "../../assets/maps/data/us-states-capitals-01.json",
  import.meta.url
), "utf8"));
const lakeTargetIds = lakesActivity.features.map(({ id }) => id);
const firstStateTargetIds = firstStatesActivity.features
  .filter(({ type }) => type === "state")
  .map(({ id }) => id);
const canonicalEvidenceSnapshot = JSON.stringify({
  storageVersion: 1,
  evidenceSchemaVersion: 1,
  events: []
});
const runtimeErrorsByPage = new WeakMap();

test.beforeEach(async ({ page }) => {
  const errors = [];
  runtimeErrorsByPage.set(page, errors);
  page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(`console: ${message.text()}`);
  });
});

test.afterEach(async ({ page }) => {
  expect(runtimeErrorsByPage.get(page)).toEqual([]);
});

async function seedActivityAndJourney(page, {
  activityId,
  completedTargetIds,
  stepId,
  journeyStepComplete = false,
  difficultyId = "medium"
}) {
  const stepIndex = unitedStatesSteps.findIndex(({ id }) => id === stepId);
  await page.addInitScript((seed) => {
    localStorage.setItem("geography-memory-activity-progress", JSON.stringify({
      [`${seed.activityId}:${seed.difficultyId}`]: seed.completedTargetIds
    }));
    localStorage.setItem("atlasQuestProgress", JSON.stringify({
      version: 1,
      activeJourneyId: "united-states",
      activeStepIndex: seed.stepIndex,
      activeDifficulty: seed.difficultyId,
      recentJourneyId: "united-states",
      recentDifficulty: seed.difficultyId,
      journeys: {
        "united-states": {
          currentStepIndex: seed.stepIndex,
          completedSteps: {
            [seed.stepId]: {
              easy: false,
              medium: seed.journeyStepComplete && seed.difficultyId === "medium",
              hard: false
            }
          },
          completedDifficulties: { easy: false, medium: false, hard: false }
        }
      }
    }));
    localStorage.setItem("mappaMundiCanonicalEvidence", seed.canonicalEvidenceSnapshot);
  }, {
    activityId,
    completedTargetIds,
    stepId,
    stepIndex,
    journeyStepComplete,
    difficultyId,
    canonicalEvidenceSnapshot
  });
}

async function loadTestApp(page, { navigate = true } = {}) {
  if (navigate) await page.goto("/?test=1&globeNavigation=off");
  await expect(page.locator("#launch-screen")).toBeVisible();
  await page.locator("#launch-start-button").click();
  await page.evaluate(() => window.__mappaMundiLoadApp());
  if (await page.locator("#launch-screen").isVisible()) {
    await page.locator("#launch-start-button").click();
  }
  await expect.poll(() => page.evaluate(() => Boolean(window.__MAPPA_TEST_API__))).toBe(true);
}

async function launchUnitedStatesStep(page, stepId, difficultyId = "medium") {
  expect(await page.evaluate(({ nextStepId, nextDifficultyId }) => (
    window.__MAPPA_TEST_API__.startJourneyStep(
      "united-states",
      nextStepId,
      nextDifficultyId,
      true
    )
  ), { nextStepId: stepId, nextDifficultyId: difficultyId })).toBe(true);
}

async function restoredCompletionSnapshot(page, stepId, difficultyId = "medium") {
  return page.evaluate(({ expectedStepId, expectedDifficultyId }) => {
    const saved = window.__MAPPA_TEST_API__.getSavedJourneyProgress();
    return {
      activity: window.__MAPPA_TEST_API__.getCurrentActivity(),
      journeyStep: window.__MAPPA_TEST_API__.getCurrentJourneyStep(),
      trace: window.__MAPPA_TEST_API__.getJourneyCompletionReconciliation(),
      journeyStepComplete: Boolean(
        saved.journeys?.["united-states"]?.completedSteps?.[expectedStepId]?.[expectedDifficultyId]
      ),
      completionOverlayHidden: document.querySelector("#journey-completion-overlay")?.hidden,
      completionKicker: document.querySelector("#journey-completion-kicker")?.textContent,
      completionTitle: document.querySelector("#journey-completion-title")?.textContent,
      canonicalEvidence: localStorage.getItem("mappaMundiCanonicalEvidence")
    };
  }, { expectedStepId: stepId, expectedDifficultyId: difficultyId });
}

test("restored 6/6 Lakes reconciles its incomplete Journey step", async ({ page }) => {
  await seedActivityAndJourney(page, {
    activityId: "us-physical-lakes",
    completedTargetIds: lakeTargetIds,
    stepId: "us-physical-lakes"
  });
  await loadTestApp(page);
  await launchUnitedStatesStep(page, "us-physical-lakes");

  const snapshot = await restoredCompletionSnapshot(page, "us-physical-lakes");
  expect(snapshot.activity).toMatchObject({
    id: "us-physical-lakes",
    completedCount: 6,
    targetCount: 6
  });
  expect(snapshot.journeyStep).toMatchObject({ id: "us-physical-lakes" });
  expect(snapshot.trace).toMatchObject({
    journeyId: "united-states",
    stepId: "us-physical-lakes",
    activityId: "us-physical-lakes",
    restoredFromActivityProgress: true,
    journeyContextActive: true,
    activityCompleteOnRestore: true,
    journeyStepCompleteBeforeReconcile: false,
    journeyCompletionReconciled: true,
    journeyStepCompleteAfterReconcile: true
  });
  expect(snapshot.journeyStepComplete).toBe(true);
  expect(snapshot.completionOverlayHidden).toBe(false);
  expect(snapshot.completionKicker).toBe("On to the Next Stop!");
  expect(snapshot.completionTitle).toBe("PERFECT!");
  expect(snapshot.canonicalEvidence).toBe(canonicalEvidenceSnapshot);

  await expect.poll(() => page.evaluate(() => (
    window.__MAPPA_TEST_API__.getCurrentJourneyStep()?.id
  )), { timeout: 20_000 }).toBe("us-mountain-ranges");
});

test("an already-complete Journey step is not reconciled or awarded again", async ({ page }) => {
  await seedActivityAndJourney(page, {
    activityId: "us-physical-lakes",
    completedTargetIds: lakeTargetIds,
    stepId: "us-physical-lakes",
    journeyStepComplete: true
  });
  await loadTestApp(page);

  for (let launch = 0; launch < 2; launch += 1) {
    await launchUnitedStatesStep(page, "us-physical-lakes");
    const snapshot = await restoredCompletionSnapshot(page, "us-physical-lakes");
    expect(snapshot.trace).toMatchObject({
      activityCompleteOnRestore: true,
      journeyStepCompleteBeforeReconcile: true,
      journeyCompletionReconciled: false,
      journeyStepCompleteAfterReconcile: true
    });
    expect(snapshot.journeyStepComplete).toBe(true);
    expect(snapshot.completionOverlayHidden).toBe(true);
    expect(snapshot.canonicalEvidence).toBe(canonicalEvidenceSnapshot);
  }

  await page.reload();
  await loadTestApp(page, { navigate: false });
  await launchUnitedStatesStep(page, "us-physical-lakes");
  const reloaded = await restoredCompletionSnapshot(page, "us-physical-lakes");
  expect(reloaded.trace).toMatchObject({
    journeyStepCompleteBeforeReconcile: true,
    journeyCompletionReconciled: false
  });
  expect(reloaded.completionOverlayHidden).toBe(true);
  expect(reloaded.canonicalEvidence).toBe(canonicalEvidenceSnapshot);
});

test("a partially restored activity remains interactive and completes normally", async ({ page }) => {
  const missingTargetId = lakeTargetIds.at(-1);
  await seedActivityAndJourney(page, {
    activityId: "us-physical-lakes",
    completedTargetIds: lakeTargetIds.slice(0, -1),
    stepId: "us-physical-lakes"
  });
  await loadTestApp(page);
  await launchUnitedStatesStep(page, "us-physical-lakes");

  const initial = await restoredCompletionSnapshot(page, "us-physical-lakes");
  expect(initial.activity).toMatchObject({ completedCount: 5, targetCount: 6 });
  expect(initial.trace).toMatchObject({
    activityCompleteOnRestore: false,
    journeyStepCompleteBeforeReconcile: false,
    journeyCompletionReconciled: false
  });
  expect(initial.journeyStepComplete).toBe(false);
  expect(initial.completionOverlayHidden).toBe(true);

  expect(await page.evaluate((targetId) => (
    window.__MAPPA_TEST_API__.answerCurrentPrompt(targetId)
  ), missingTargetId)).toBe(true);
  const completed = await restoredCompletionSnapshot(page, "us-physical-lakes");
  expect(completed.journeyStepComplete).toBe(true);
  expect(completed.completionOverlayHidden).toBe(false);
  expect(completed.trace.journeyCompletionReconciled).toBe(false);
});

test("a completed standalone Lakes activity does not invoke Journey completion", async ({ page }) => {
  await page.addInitScript(({ targetIds, evidence }) => {
    localStorage.setItem("geography-memory-activity-progress", JSON.stringify({
      "us-physical-lakes:medium": targetIds
    }));
    localStorage.setItem("mappaMundiCanonicalEvidence", evidence);
  }, { targetIds: lakeTargetIds, evidence: canonicalEvidenceSnapshot });
  await loadTestApp(page);
  await page.evaluate(() => window.__MAPPA_TEST_API__.openStandaloneActivity("us-physical-lakes", "medium"));

  const snapshot = await restoredCompletionSnapshot(page, "us-physical-lakes");
  expect(snapshot.activity).toMatchObject({
    id: "us-physical-lakes",
    completedCount: 6,
    targetCount: 6
  });
  expect(snapshot.trace).toBeNull();
  expect(snapshot.journeyStepComplete).toBe(false);
  expect(snapshot.completionOverlayHidden).toBe(true);
  expect(snapshot.canonicalEvidence).toBe(canonicalEvidenceSnapshot);
});

test("restored completion reconciliation is shared by another Journey activity", async ({ page }) => {
  await seedActivityAndJourney(page, {
    activityId: "us-states-01",
    completedTargetIds: firstStateTargetIds,
    stepId: "us-states-01"
  });
  await loadTestApp(page);
  await launchUnitedStatesStep(page, "us-states-01");

  const snapshot = await restoredCompletionSnapshot(page, "us-states-01");
  expect(snapshot.activity).toMatchObject({
    id: "us-states-01",
    completedCount: firstStateTargetIds.length,
    targetCount: firstStateTargetIds.length
  });
  expect(snapshot.trace).toMatchObject({
    activityCompleteOnRestore: true,
    journeyStepCompleteBeforeReconcile: false,
    journeyCompletionReconciled: true,
    journeyStepCompleteAfterReconcile: true
  });
  expect(snapshot.journeyStepComplete).toBe(true);
  expect(snapshot.completionOverlayHidden).toBe(false);
  expect(snapshot.canonicalEvidence).toBe(canonicalEvidenceSnapshot);
});
