import { expect, test } from "@playwright/test";
import { GUIDED_RECONSTRUCTION_CHECKPOINTS } from "../../src/guided-reconstruction.js";
import {
  GUIDED_LEARNING_ORCHESTRATION_STORAGE_KEY,
  UNITED_STATES_GUIDED_LEARNING_ORCHESTRATION_V1
} from "../../src/guided-learning-orchestration.js";
import { GUIDED_CHILD_LAUNCH_STORAGE_KEY } from "../../src/guided-child-launch-contract.js";
import { CANONICAL_EVIDENCE_REPOSITORY_STORAGE_KEY } from "../../src/canonical-learning-evidence-repository.js";
import { getUnitedStatesGuidedCoreRequiredBlockIds } from "../../src/united-states-guided-core-capstone.js";
import { unitedStatesMemoryTrailStorageKey } from "../../src/united-states-memory-trail-planner.js";

const checkpoint = GUIDED_RECONSTRUCTION_CHECKPOINTS[0];

async function loadMainMenu(page, url = "/?test=1&globeNavigation=off") {
  await page.goto(url);
  await page.locator("#launch-start-button").click();
  await page.evaluate(() => window.__mappaMundiLoadApp());
  if (await page.locator("#launch-screen").isVisible()) {
    await page.locator("#launch-start-button").click();
  }
}

async function openStandaloneRegion(page) {
  await loadMainMenu(page);
  await page.locator("#main-menu-map-reconstruction-button").click();
  await page.locator(".map-reconstruction-region-option").first().click();
  await expect(page.locator(".map-reconstruction-shell")).toBeVisible({ timeout: 20_000 });
}

async function expectReconstructionDetached(page) {
  await expect(page.locator("#map-reconstruction-panel")).toBeHidden();
  await expect(page.locator(".map-reconstruction-shell, .map-reconstruction-capstone-shell")).toHaveCount(0);
  await expect.poll(() => page.evaluate(() => ({
    bodyMode: document.body.classList.contains("map-reconstruction-mode"),
    mapAriaHidden: document.querySelector("#map")?.getAttribute("aria-hidden") || null
  }))).toEqual({ bodyMode: false, mapAriaHidden: null });
}

async function invokeHeaderControl(page, selector) {
  await page.locator(selector).evaluate((button) => button.click());
}

async function seedGuidedCheckpoint(page) {
  await page.addInitScript(({ checkpoint, orchestrationKey, trailKey, evidenceKey }) => {
    if (sessionStorage.getItem("guided-reconstruction-lifecycle-seeded")) return;
    sessionStorage.setItem("guided-reconstruction-lifecycle-seeded", "true");
    const introducedItemIds = [...checkpoint.lockedStateIds, ...checkpoint.stateIds]
      .map((stateId) => `state:${stateId}`);
    localStorage.setItem(orchestrationKey, JSON.stringify({
      version: 6,
      completedBlockIds: []
    }));
    localStorage.setItem(trailKey, JSON.stringify({
      version: 2,
      curriculumVersion: 2,
      hasStarted: true,
      introducedItemIds,
      itemProgress: Object.fromEntries(introducedItemIds.map((itemId) => [itemId, {
        status: "introduced",
        memoryState: "learning",
        introducedSession: 1
      }]))
    }));
    localStorage.setItem(evidenceKey, JSON.stringify({
      storageVersion: 1,
      evidenceSchemaVersion: 1,
      events: [...checkpoint.lockedStateIds, ...checkpoint.stateIds].map((stateId, sequence) => ({
        schemaVersion: 1,
        eventId: `covered:${stateId}`,
        attemptId: `covered:${stateId}`,
        occurredAt: "2040-01-01T00:00:00.000Z",
        sequence,
        conceptId: `state-location:${stateId}`,
        skillId: "locating",
        sourceMode: "us-memory-trail",
        outcome: "assisted"
      }))
    }));
  }, {
    checkpoint,
    orchestrationKey: GUIDED_LEARNING_ORCHESTRATION_STORAGE_KEY,
    trailKey: unitedStatesMemoryTrailStorageKey,
    evidenceKey: CANONICAL_EVIDENCE_REPOSITORY_STORAGE_KEY
  });
  await page.goto("/?test=1&globeNavigation=on");
  await page.locator("#launch-start-button").click();
  await page.evaluate(() => window.__mappaMundiLoadApp());
  await expect(page.locator("#globe-navigation-panel")).toBeVisible({ timeout: 20_000 });
  await page.getByRole("combobox", { name: "Find a place" }).fill("united");
  await page.locator("#globe-navigation-find-options")
    .getByRole("option", { name: "United States", exact: true }).click();
  await page.getByRole("button", { name: /Learn the United States/ }).click();
  await expect(page.locator(`[data-map-reconstruction-region-id="${checkpoint.regionId}"]`))
    .toBeVisible({ timeout: 20_000 });
}

async function resumeGuidedFromGlobe(page) {
  await expect(page.locator("#globe-navigation-panel")).toBeVisible({ timeout: 20_000 });
  await page.getByRole("combobox", { name: "Find a place" }).fill("united");
  await page.locator("#globe-navigation-find-options")
    .getByRole("option", { name: "United States", exact: true }).click();
  await page.getByRole("button", { name: /Learn the United States/ }).click();
}

function createCompletedGuidedTrail() {
  const stateIds = [...new Set([
    ...GUIDED_RECONSTRUCTION_CHECKPOINTS.flatMap(({ stateIds: checkpointStateIds }) => checkpointStateIds),
    "alaska",
    "hawaii"
  ])];
  const capitalIds = [
    "augusta-me", "concord-nh", "boston-ma", "providence-ri", "hartford-ct",
    "montpelier-vt", "albany-ny", "trenton-nj", "harrisburg-pa", "dover-de",
    "annapolis-md", "richmond-va", "charleston-wv", "raleigh-nc", "columbia-sc",
    "atlanta-ga", "tallahassee-fl", "montgomery-al", "jackson-ms", "baton-rouge-la",
    "lansing-mi", "columbus-oh", "indianapolis-in", "frankfort-ky", "nashville-tn",
    "madison-wi", "springfield-il", "des-moines-ia", "jefferson-city-mo", "little-rock-ar",
    "st-paul-mn", "bismarck-nd", "pierre-sd", "cheyenne-wy", "lincoln-ne",
    "topeka-ks", "oklahoma-city-ok", "austin-tx", "denver-co", "santa-fe-nm",
    "salt-lake-city-ut", "phoenix-az", "carson-city-nv", "sacramento-ca",
    "helena-mt", "boise-id", "olympia-wa", "salem-or", "juneau-ak", "honolulu-hi"
  ];
  const itemIds = [
    ...stateIds.map((stateId) => `state:${stateId}`),
    ...capitalIds.map((capitalId) => `capital:${capitalId}`)
  ];
  return {
    version: 2,
    curriculumVersion: 2,
    hasStarted: true,
    currentSessionNumber: 50,
    introducedItemIds: itemIds,
    itemProgress: Object.fromEntries(itemIds.map((itemId) => [itemId, {
      status: "review",
      memoryState: "review",
      timesSeen: 2,
      correctCount: 2,
      correctStreak: 2,
      dueSession: 50
    }])),
    guidedCoreCapstone: { status: "completed" }
  };
}

test("standalone Reconstruction releases its surface for Settings, Explore, Home, and another activity", async ({ page }) => {
  await openStandaloneRegion(page);
  await page.locator(".map-reconstruction-bank-piece").first().press("Enter");
  await page.locator("#settings-button").click();
  await expect(page.locator("#app-shell-title")).toHaveText("Settings");
  await expectReconstructionDetached(page);

  await page.locator("#app-shell-back-button").click();
  await page.locator("#main-menu-map-reconstruction-button").click();
  await page.locator(".map-reconstruction-region-option").first().click();
  await invokeHeaderControl(page, "#browse-button");
  await expect(page.locator("#region-panel")).toHaveAttribute("aria-hidden", "false");
  await expectReconstructionDetached(page);

  await page.evaluate(() => window.__MAPPA_TEST_API__.openStandaloneActivity("us-physical-lakes", "medium"));
  await expectReconstructionDetached(page);
  await expect(page.locator("#map")).toBeVisible();

  await invokeHeaderControl(page, "#home-button");
  await expect(page.locator("#main-menu-map-reconstruction-button")).toBeVisible();
  await expectReconstructionDetached(page);
});

test("Guided Home detaches Reconstruction, reload stays clear, and explicit Guided resume restores the child", async ({ page }) => {
  await seedGuidedCheckpoint(page);
  await page.reload();
  await page.locator("#launch-start-button").click();
  await page.evaluate(() => window.__mappaMundiLoadApp());
  await expectReconstructionDetached(page);
  await resumeGuidedFromGlobe(page);
  await expect(page.locator(`[data-map-reconstruction-region-id="${checkpoint.regionId}"]`))
    .toBeVisible({ timeout: 20_000 });

  await invokeHeaderControl(page, "#home-button");
  await expect(page.locator("#main-menu-us-memory-trail-button")).toBeVisible();
  await expectReconstructionDetached(page);
  await expect.poll(() => page.evaluate((key) => JSON.parse(localStorage.getItem(key) || "null")?.status, GUIDED_CHILD_LAUNCH_STORAGE_KEY))
    .toBe("launched");

  await page.reload();
  await page.locator("#launch-start-button").click();
  await page.evaluate(() => window.__mappaMundiLoadApp());
  await expectReconstructionDetached(page);
  await resumeGuidedFromGlobe(page);
  await expect(page.locator(`[data-map-reconstruction-region-id="${checkpoint.regionId}"]`))
    .toBeVisible({ timeout: 20_000 });
});

test("Guided Back leaves a midway checkpoint and completed-child resume remains intentional", async ({ page }) => {
  await seedGuidedCheckpoint(page);
  await page.locator(".map-reconstruction-bank-piece").first().press("Enter");
  await page.locator("#back-button").click();
  await expect(page.locator(".memory-trail-panel")).toBeVisible({ timeout: 20_000 });
  await expectReconstructionDetached(page);
  await expect.poll(() => page.evaluate((key) => localStorage.getItem(key), GUIDED_CHILD_LAUNCH_STORAGE_KEY)).toBeNull();

  await invokeHeaderControl(page, "#home-button");
  await page.evaluate(() => window.__MAPPA_TEST_API__.launchNextGuidedLearningOrchestration());
  await expect(page.locator(`[data-map-reconstruction-region-id="${checkpoint.regionId}"]`))
    .toBeVisible({ timeout: 20_000 });
  await page.getByRole("button", { name: "Submit", exact: true }).click();
  await invokeHeaderControl(page, "#home-button");
  await expectReconstructionDetached(page);

  await page.reload();
  await page.locator("#launch-start-button").click();
  await page.evaluate(() => window.__mappaMundiLoadApp());
  await expectReconstructionDetached(page);
  await resumeGuidedFromGlobe(page);
  await expect(page.getByRole("button", { name: "Continue Guided Learning" }))
    .toBeVisible({ timeout: 20_000 });
});

test("Lower 48 saved placement progress survives surface teardown and resumes explicitly", async ({ page }) => {
  await loadMainMenu(page);
  await page.locator("#main-menu-map-reconstruction-button").click();
  const capstone = page.locator(".map-reconstruction-capstone-option");
  await capstone.getByRole("button", { name: "Start", exact: true }).click();
  await expect(page.locator(".map-reconstruction-capstone-shell")).toBeVisible({ timeout: 20_000 });
  const stateDrawerButton = page.getByRole("button", { name: "Open state drawer" });
  if (await stateDrawerButton.isVisible()) await stateDrawerButton.click();
  await page.locator(".map-reconstruction-capstone-state-button").first().press("Enter");
  await expect(page.locator(".map-reconstruction-capstone-piece-layer [data-capstone-piece-id]"))
    .toHaveCount(1);

  await page.reload();
  await page.locator("#launch-start-button").click();
  await page.evaluate(() => window.__mappaMundiLoadApp());
  await expectReconstructionDetached(page);
  await page.locator("#main-menu-map-reconstruction-button").click();
  await page.locator(".map-reconstruction-capstone-option").getByRole("button", { name: "Continue", exact: true }).click();
  await expect(page.locator(".map-reconstruction-capstone-piece-layer [data-capstone-piece-id]"))
    .toHaveCount(1, { timeout: 20_000 });

  await page.locator("#settings-button").click();
  await expectReconstructionDetached(page);
  await page.locator("#app-shell-back-button").click();
  await page.locator("#main-menu-map-reconstruction-button").click();
  await page.locator(".map-reconstruction-capstone-option").getByRole("button", { name: "Continue", exact: true }).click();
  await expect(page.locator(".map-reconstruction-capstone-piece-layer [data-capstone-piece-id]"))
    .toHaveCount(1, { timeout: 20_000 });
});

test("post-course Reconstruction Back returns to the choice screen without a stale surface", async ({ page }) => {
  const requiredBlockIds = getUnitedStatesGuidedCoreRequiredBlockIds(UNITED_STATES_GUIDED_LEARNING_ORCHESTRATION_V1);
  await page.addInitScript(({ trailKey, trailState, orchestrationKey, completedBlockIds }) => {
    localStorage.setItem(trailKey, JSON.stringify(trailState));
    localStorage.setItem(orchestrationKey, JSON.stringify({ version: 6, completedBlockIds }));
  }, {
    trailKey: unitedStatesMemoryTrailStorageKey,
    trailState: createCompletedGuidedTrail(),
    orchestrationKey: GUIDED_LEARNING_ORCHESTRATION_STORAGE_KEY,
    completedBlockIds: requiredBlockIds
  });
  await loadMainMenu(page);
  await page.locator("#main-menu-us-memory-trail-button").click();
  await page.getByRole("button", { name: /Map Reconstruction/ }).click();
  await expect(page.locator("#map-reconstruction-panel")).toBeVisible({ timeout: 20_000 });
  await page.locator("#back-button").click();
  await expect(page.getByRole("heading", { name: "Your U.S. learning map is ready" }))
    .toBeVisible({ timeout: 20_000 });
  await expectReconstructionDetached(page);
});

test("browser Back and Forward cannot carry a standalone Reconstruction surface or active drag", async ({ page }, testInfo) => {
  await page.goto("/?history-origin=1");
  await openStandaloneRegion(page);
  if (testInfo.project.name === "desktop-chromium") {
    const thumbnail = page.locator(".map-reconstruction-bank-thumbnail").first();
    const workspace = page.locator(".map-reconstruction-workspace");
    const thumbnailBox = await thumbnail.boundingBox();
    const workspaceBox = await workspace.boundingBox();
    await page.mouse.move(thumbnailBox.x + thumbnailBox.width / 2, thumbnailBox.y + thumbnailBox.height / 2);
    await page.mouse.down();
    await page.mouse.move(workspaceBox.x + workspaceBox.width / 2, workspaceBox.y + 40, { steps: 4 });
    await expect(page.locator(".map-reconstruction-drag-proxy")).toHaveCount(1);
  }
  await page.goBack();
  await page.mouse.up();
  await expect(page.locator("#map-reconstruction-panel")).toBeHidden();
  await page.goForward();
  await expect(page.locator("#map-reconstruction-panel")).toBeHidden();
});

test("interrupted mouse gestures release capture and cannot survive Reconstruction teardown", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === "mobile-chromium", "Magic Mouse regression uses the desktop pointer path.");
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await openStandaloneRegion(page);
  const workspace = page.locator(".map-reconstruction-workspace");
  const bankPiece = page.locator(".map-reconstruction-bank-piece").first();
  const thumbnail = bankPiece.locator(".map-reconstruction-bank-thumbnail");
  const bankBox = await thumbnail.boundingBox();
  const workspaceBox = await workspace.boundingBox();
  const initialView = await workspace.getAttribute("viewBox");

  await page.evaluate(() => {
    window.__reconstructionPointerId = null;
    window.addEventListener("pointerdown", (event) => {
      window.__reconstructionPointerId = event.pointerId;
    }, { capture: true, once: true });
  });
  await page.mouse.move(bankBox.x + bankBox.width / 2, bankBox.y + bankBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(workspaceBox.x + workspaceBox.width * 0.45, workspaceBox.y + 40, { steps: 4 });
  await expect(page.locator(".map-reconstruction-drag-proxy")).toHaveCount(1);
  await page.mouse.wheel(0, 240);
  expect(await workspace.getAttribute("viewBox")).toBe(initialView);
  await page.evaluate(() => {
    window.dispatchEvent(new PointerEvent("pointercancel", {
      bubbles: true,
      pointerId: window.__reconstructionPointerId,
      pointerType: "mouse"
    }));
  });
  await page.mouse.up();
  await expect(page.locator(".map-reconstruction-drag-proxy")).toHaveCount(0);
  await expect(page.locator(".map-reconstruction-learner-layer [data-map-reconstruction-state-id]"))
    .toHaveCount(0);

  await page.mouse.move(bankBox.x + bankBox.width / 2, bankBox.y + bankBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(workspaceBox.x + 30, workspaceBox.y + 30, { steps: 2 });
  await page.mouse.move(2, 2, { steps: 2 });
  await page.mouse.up();
  await expect(page.locator(".map-reconstruction-drag-proxy")).toHaveCount(0);
  await expect(page.locator(".map-reconstruction-learner-layer [data-map-reconstruction-state-id]"))
    .toHaveCount(0);

  await bankPiece.press("Enter");
  const piecePath = page.locator(".map-reconstruction-learner-layer .map-reconstruction-piece-shape").first();
  const interior = await piecePath.evaluate((path) => {
    const rect = path.getBoundingClientRect();
    for (let row = 1; row < 10; row += 1) {
      for (let column = 1; column < 10; column += 1) {
        const x = rect.left + rect.width * column / 10;
        const y = rect.top + rect.height * row / 10;
        if (document.elementFromPoint(x, y)?.closest?.("[data-map-reconstruction-state-id]")) {
          return { x, y };
        }
      }
    }
    return null;
  });
  expect(interior).toBeTruthy();
  await page.mouse.move(interior.x, interior.y);
  await page.mouse.down();
  await page.mouse.move(interior.x + 45, interior.y + 25, { steps: 5 });
  await expect(page.locator(".map-reconstruction-piece.is-dragging")).toHaveCount(1);
  await page.mouse.wheel(0, -220);
  await page.locator("#settings-button").evaluate((button) => button.click());
  await page.mouse.up();
  await expectReconstructionDetached(page);
  await expect(page.locator(".map-reconstruction-drag-proxy")).toHaveCount(0);
  expect(errors).toEqual([]);
});

test("Lower 48 navigation during an active piece drag restores the last persisted placement", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === "mobile-chromium", "Magic Mouse regression uses the desktop pointer path.");
  await loadMainMenu(page);
  await page.locator("#main-menu-map-reconstruction-button").click();
  await page.locator(".map-reconstruction-capstone-option")
    .getByRole("button", { name: "Start", exact: true }).click();
  await expect(page.locator(".map-reconstruction-capstone-shell")).toBeVisible({ timeout: 20_000 });
  await page.locator(".map-reconstruction-capstone-state-button").first().click();
  const piece = page.locator("[data-capstone-piece-id]").first();
  const path = piece.locator(".map-reconstruction-piece-shape");
  const originalTransform = await piece.getAttribute("transform");
  const initialView = await page.locator(".map-reconstruction-workspace").getAttribute("viewBox");
  const interior = await path.evaluate((piecePath) => {
    const rect = piecePath.getBoundingClientRect();
    for (let row = 1; row < 10; row += 1) {
      for (let column = 1; column < 10; column += 1) {
        const x = rect.left + rect.width * column / 10;
        const y = rect.top + rect.height * row / 10;
        if (document.elementFromPoint(x, y)?.closest?.("[data-capstone-piece-id]")) return { x, y };
      }
    }
    return null;
  });
  expect(interior).toBeTruthy();
  await page.mouse.move(interior.x, interior.y);
  await page.mouse.down();
  await page.mouse.move(interior.x + 70, interior.y + 35, { steps: 6 });
  await expect(piece).toHaveClass(/is-dragging/);
  await page.mouse.wheel(0, -260);
  expect(await page.locator(".map-reconstruction-workspace").getAttribute("viewBox")).toBe(initialView);
  await page.locator("#settings-button").evaluate((button) => button.click());
  await page.mouse.up();
  await expectReconstructionDetached(page);

  await page.locator("#app-shell-back-button").click();
  await page.locator("#main-menu-map-reconstruction-button").click();
  await page.locator(".map-reconstruction-capstone-option")
    .getByRole("button", { name: "Continue", exact: true }).click();
  await expect(page.locator("[data-capstone-piece-id]").first()).toHaveAttribute("transform", originalTransform, {
    timeout: 20_000
  });
});
