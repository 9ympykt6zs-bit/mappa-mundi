import { expect, test } from "@playwright/test";
import { GUIDED_RECONSTRUCTION_CHECKPOINTS as checkpoints } from "../../src/guided-reconstruction.js";
import { GUIDED_LEARNING_ORCHESTRATION_STORAGE_KEY as orchestrationKey } from "../../src/guided-learning-orchestration.js";
import { CANONICAL_EVIDENCE_REPOSITORY_STORAGE_KEY as evidenceKey } from "../../src/canonical-learning-evidence-repository.js";

async function openPrimaryLearn(page) {
  await page.goto("/?test=1&globeNavigation=on");
  await page.locator("#launch-start-button").click();
  await page.evaluate(() => window.__mappaMundiLoadApp());
  await expect(page.locator("#globe-navigation-panel")).toBeVisible({ timeout: 20_000 });
  await page.getByRole("combobox", { name: "Find a place" }).fill("united");
  await page.locator("#globe-navigation-find-options").getByRole("option", { name: "United States", exact: true }).click();
  await page.getByRole("button", { name: /Learn the United States/ }).click();
}

for (const checkpointIndex of [0, 1, 9]) {
  test(`Guided checkpoint ${checkpointIndex + 1} uses its section, fixed context, and target-only evidence`, async ({ page }, testInfo) => {
    const checkpoint = checkpoints[checkpointIndex];
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    const coveredIds = [...checkpoint.lockedStateIds, ...checkpoint.stateIds];
    await page.addInitScript(({ coveredIds, completedBlockIds, orchestrationKey, evidenceKey }) => {
      if (sessionStorage.getItem("guided-reconstruction-seeded")) return;
      sessionStorage.setItem("guided-reconstruction-seeded", "true");
      localStorage.setItem(orchestrationKey, JSON.stringify({ version: 5, completedBlockIds }));
      localStorage.setItem(evidenceKey, JSON.stringify({
        storageVersion: 1, evidenceSchemaVersion: 1,
        events: coveredIds.map((id, sequence) => ({
          schemaVersion: 1, eventId: `covered:${id}`, attemptId: `covered:${id}`,
          occurredAt: "2040-01-01T00:00:00.000Z", sequence,
          conceptId: `state-location:${id}`, skillId: "locating", sourceMode: "us-memory-trail", outcome: "assisted"
        }))
      }));
    }, { coveredIds, completedBlockIds: checkpoints.slice(0, checkpointIndex).map(({ blockId }) => blockId), orchestrationKey, evidenceKey });
    await openPrimaryLearn(page);
    const activity = page.locator(`[data-map-reconstruction-region-id="${checkpoint.regionId}"]`);
    await expect(activity).toBeVisible({ timeout: 20_000 });
    await expect(page.locator(".map-reconstruction-bank-piece")).toHaveCount(checkpoint.stateIds.length);
    const locks = page.locator("[data-map-reconstruction-locked-state-id]");
    await expect(locks).toHaveCount(checkpoint.lockedStateIds.length);
    const trace = await page.evaluate(() => window.__MAPPA_TEST_API__.getUnitedStatesContinuationTrace());
    expect(trace.routing.boundedChildLaunched).toBe(true);
    expect(trace.childLaunchContract.child.destinationKind).toBe("map-reconstruction");
    const savedJourney = await page.evaluate(() => window.__MAPPA_TEST_API__.getSavedJourneyProgress());
    const anchorsBefore = await locks.evaluateAll((nodes) => nodes.map((node) => [node.dataset.mapReconstructionLockedStateId, node.getAttribute("transform")]));
    if (checkpointIndex === 0) await expect(page.getByRole("button", { name: "Place Vermont", exact: true })).toHaveCount(0);
    else {
      await expect(locks.locator('[tabindex="0"]')).toHaveCount(0);
      await page.getByRole("button", { name: `Place ${checkpointIndex === 1 ? "Vermont" : "Montana"}`, exact: true }).press("Enter");
      const placed = page.locator(".map-reconstruction-learner-layer [data-map-reconstruction-state-id]").first();
      await expect(placed).toBeVisible();
      await placed.press("ArrowRight");
      await expect(locks).toHaveCount(checkpoint.lockedStateIds.length);
      expect(await locks.evaluateAll((nodes) => nodes.map((node) => [node.dataset.mapReconstructionLockedStateId, node.getAttribute("transform")]))).toEqual(anchorsBefore);
      await page.getByRole("button", { name: "Reset", exact: true }).click();
      await expect(page.locator(".map-reconstruction-bank-piece")).toHaveCount(checkpoint.stateIds.length);
      expect(await locks.evaluateAll((nodes) => nodes.map((node) => [node.dataset.mapReconstructionLockedStateId, node.getAttribute("transform")]))).toEqual(anchorsBefore);
    }
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.screenshot({ path: `/tmp/mappa-guided-checkpoint-${checkpointIndex + 1}-${testInfo.project.name}.png` });
    await page.getByRole("button", { name: "Submit", exact: true }).click();
    await expect(page.getByRole("button", { name: "Continue Guided Learning" })).toBeVisible();
    const evidence = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)).events.filter(({ sourceMode }) => sourceMode === "map-reconstruction"), evidenceKey);
    expect(evidence).toHaveLength(checkpoint.stateIds.length);
    expect(evidence.map(({ conceptId }) => conceptId).sort()).toEqual(checkpoint.stateIds.map((id) => `state-reconstruction:${id}`).sort());
    expect(evidence.every(({ outcome, skillId }) => outcome === "skipped" && skillId === "spatial-reconstruction")).toBe(true);
    expect(new Set(evidence.map(({ attemptId }) => attemptId)).size).toBe(1);
    // Completed child rehydration cannot create another submission or score anchors.
    await openPrimaryLearn(page);
    await expect(page.getByRole("button", { name: "Continue Guided Learning" })).toBeVisible({ timeout: 20_000 });
    expect(await page.evaluate((key) => JSON.parse(localStorage.getItem(key)).events.filter(({ sourceMode }) => sourceMode === "map-reconstruction"), evidenceKey)).toEqual(evidence);
    await page.getByRole("button", { name: "Continue Guided Learning" }).click();
    await expect(page.locator(".memory-trail-panel")).toBeVisible({ timeout: 20_000 });
    expect(await page.evaluate(() => window.__MAPPA_TEST_API__.getSavedJourneyProgress())).toEqual(savedJourney);
    expect(errors).toEqual([]);
  });
}

test("standalone New England retains all six pieces and no locked context", async ({ page }) => {
  await page.goto("/?test=1&globeNavigation=off");
  await page.locator("#launch-start-button").click();
  await page.evaluate(() => window.__mappaMundiLoadApp());
  await page.locator("#main-menu-map-reconstruction-button").click();
  await page.locator(".map-reconstruction-region-option").first().click();
  await expect(page.locator(".map-reconstruction-bank-piece")).toHaveCount(6);
  await expect(page.getByRole("button", { name: "Place Vermont", exact: true })).toBeVisible();
  await expect(page.locator("[data-map-reconstruction-locked-state-id]")).toHaveCount(0);
});
