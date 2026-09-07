import { expect, test } from "@playwright/test";
import { writeFile } from "node:fs/promises";
import { CANONICAL_EVIDENCE_REPOSITORY_STORAGE_KEY } from "../../src/canonical-learning-evidence-repository.js";
import {
  GUIDED_LEARNING_ORCHESTRATION_STORAGE_KEY,
  UNITED_STATES_GUIDED_LEARNING_ORCHESTRATION_V1 as orchestration
} from "../../src/guided-learning-orchestration.js";

const lower48Camera = { center: [-97.76220, 39.30636], zoom: 4.1407 };

async function launchPhysicalTeaching(page, targetId, { extraStateIds = [], reducedMotion = "no-preference" } = {}) {
  await page.emulateMedia({ reducedMotion });
  const feature = orchestration.physicalFeatures.find((candidate) => candidate.targetId === targetId);
  const targetCohort = orchestration.physicalCohorts.find(({ id }) => id === feature.learningCohortId);
  const completedBlockIds = ["us-guided:rebuild-new-england"];
  for (const candidate of orchestration.physicalFeatures) {
    const cohort = orchestration.physicalCohorts.find(({ id }) => id === candidate.learningCohortId);
    if ((cohort?.curriculumOrder ?? Infinity) < (targetCohort?.curriculumOrder ?? Infinity)) {
      completedBlockIds.push(...candidate.sequenceBlockIds);
    }
  }
  const stateIds = [...new Set([...feature.introductionPrerequisiteStateIds, ...extraStateIds])];
  await page.addInitScript(({ repositoryKey, orchestrationKey, stateIds, completedBlockIds, orchestrationId }) => {
    localStorage.setItem(repositoryKey, JSON.stringify({
      storageVersion: 1,
      evidenceSchemaVersion: 1,
      events: stateIds.map((stateId, sequence) => ({
        schemaVersion: 1,
        eventId: `physical-presentation-state-${stateId}`,
        attemptId: `physical-presentation-state-${stateId}`,
        occurredAt: new Date(Date.UTC(2041, 0, 1, 0, 0, sequence)).toISOString(),
        sequence,
        conceptId: `state-location:${stateId}`,
        skillId: "locating",
        sourceMode: "test",
        sourceActivityId: "guided-physical-presentation-seed",
        outcome: "correct"
      }))
    }));
    localStorage.setItem(orchestrationKey, JSON.stringify({
      version: 6,
      orchestrationId,
      completedBlockIds,
      activeBlockId: null,
      activeStatus: null,
      previousBlockId: completedBlockIds.at(-1),
      physicalInterleaveRequired: false,
      lastCompletedPhysicalFeatureId: null,
      lastCompletedPhysicalCohortId: null,
      physicalTeachingProgress: {},
      retrievedPhysicalCohortTargetIds: {},
      lastNonPhysicalMilestone: null,
      returnContext: null,
      lastTransition: null
    }));
  }, {
    repositoryKey: CANONICAL_EVIDENCE_REPOSITORY_STORAGE_KEY,
    orchestrationKey: GUIDED_LEARNING_ORCHESTRATION_STORAGE_KEY,
    stateIds,
    completedBlockIds,
    orchestrationId: orchestration.id
  });
  await page.goto("/?test=1&globeNavigation=off");
  await page.locator("#launch-start-button").click();
  await page.evaluate(() => window.__mappaMundiLoadApp());
  await expect(page.locator("#app-shell-title")).toHaveText("Main Menu");
  const firstCohortFeature = orchestration.physicalFeatures.find((candidate) => (
    candidate.targetId === targetCohort.supportedMemberTargetIds[0]
  ));
  await expect.poll(() => page.evaluate(() => (
    window.__MAPPA_TEST_API__.getGuidedLearningOrchestration().currentBlock.id
  ))).toBe(firstCohortFeature.introductionBlockId);
  await page.evaluate(() => window.__MAPPA_TEST_API__.launchNextGuidedLearningOrchestration());
  await expect(page.locator(".guided-physical-teaching-panel")).toBeVisible({ timeout: 20_000 });
  for (const cohortTargetId of targetCohort.supportedMemberTargetIds) {
    if (cohortTargetId === targetId) break;
    await expect.poll(() => page.evaluate(() => (
      window.__MAPPA_TEST_API__.getGuidedPhysicalTeachingState()?.currentTargetId
    ))).toBe(cohortTargetId);
    expect(await page.evaluate(() => window.__MAPPA_TEST_API__.answerGuidedPhysicalTeachingCorrectly())).toBe(true);
  }
  await expect.poll(() => page.evaluate(() => (
    window.__MAPPA_TEST_API__.getGuidedPhysicalTeachingState()?.currentTargetId
  ))).toBe(targetId);
  return feature;
}

async function expectCamera(page, expected) {
  await expect.poll(() => page.evaluate((camera) => {
    const actual = window.__MAPPA_TEST_API__.getGuidedPhysicalFeatureVisualState()?.camera;
    return actual?.center
      && Math.abs(actual.center[0] - camera.center[0]) < 0.001
      && Math.abs(actual.center[1] - camera.center[1]) < 0.001
      && Math.abs(actual.zoom - camera.zoom) < 0.001;
  }, expected)).toBe(true);
}

async function expectTeachingHighlight(page, targetId, { animated = true, reducedMotion = false } = {}) {
  await expect.poll(() => page.evaluate(() => (
    window.__MAPPA_TEST_API__.getGuidedPhysicalFeatureVisualState()?.teachingHighlight
  ))).toMatchObject({
    phase: "teaching",
    targetId,
    animated,
    reducedMotion,
    nonTargetMuted: true
  });
  await expect.poll(() => page.evaluate(() => (
    window.__MAPPA_TEST_API__.getGuidedPhysicalTeachingHighlight().layers
      .every(({ visibility }) => !visibility || visibility === "visible")
  ))).toBe(true);
  const state = await page.evaluate(() => window.__MAPPA_TEST_API__.getGuidedPhysicalFeatureVisualState());
  expect(state.activeHighlightIds).toEqual([targetId]);
  expect(state.dragPanEnabled).toBe(true);
  expect(state.scrollZoomEnabled).toBe(true);
  expect(state.teachingHighlight.pulsePeriodMs).toBeGreaterThanOrEqual(1500);
  expect(state.teachingHighlight.pulsePeriodMs).toBeLessThanOrEqual(2000);
  const { layers, family, pulseProgress } = state.teachingHighlight;
  const mainLayer = layers.find(({ id }) => id === (family === "mountain-range" ? "mountain-range-symbol" : family === "river" ? "river-line" : "state-fill"));
  const opacity = mainLayer.paint[family === "mountain-range" ? "icon-opacity" : family === "river" ? "line-opacity" : "fill-opacity"];
  expect(opacity.slice(0, 3)).toEqual(["case", ["==", ["get", family === "mountain-range" ? "targetId" : "id"], targetId], family === "lake" ? 0.9 : 1]);
  const halo = layers.at(-1);
  if (family !== "mountain-range") expect(halo.filter).toEqual(["==", ["get", "id"], targetId]);
  if (animated) {
    await expect.poll(() => page.evaluate((previous) => Math.abs(
      window.__MAPPA_TEST_API__.getGuidedPhysicalTeachingHighlight().pulseProgress - previous
    ), pulseProgress)).toBeGreaterThan(0.05);
  }
  return state;
}

async function captureTeaching(page, testInfo, name) {
  const path = testInfo.outputPath(`${name}.png`);
  await page.screenshot({ path });
  await testInfo.attach(name, { path, contentType: "image/png" });
}

async function tapVisibleMountain(page, targetId) {
  const point = await page.evaluate((id) => {
    const points = window.__MAPPA_TEST_API__.getMountainRangeVisualState()?.targetClientPointSets?.[id] || [];
    return points.find(({ clientX, clientY, x, y }) => (
      Boolean(document.elementFromPoint(clientX, clientY)?.closest?.("#map"))
      && window.maplibrePocMap.queryRenderedFeatures([x, y], { layers: ["target-hit-fill"] })
        .some(({ properties }) => properties.id === id)
    ));
  }, targetId);
  expect(point, `${targetId} should have a visible authored mountain glyph`).toBeTruthy();
  if (await page.evaluate(() => navigator.maxTouchPoints > 0)) {
    await page.touchscreen.tap(point.clientX, point.clientY);
  } else {
    await page.mouse.click(point.clientX, point.clientY);
  }
}

async function findVisiblePhysicalHitPoint(page, targetId, family) {
  return page.evaluate(({ targetId, family }) => {
    const map = window.maplibrePocMap;
    const source = family === "river" ? "river-lines" : "target-shapes";
    const layer = family === "river" ? "river-hit-line" : "target-hit-fill";
    const rect = map.getContainer().getBoundingClientRect();
    const coordinates = [];
    function collect(value) {
      if (!Array.isArray(value)) return;
      if (typeof value[0] === "number") coordinates.push(value);
      else value.forEach(collect);
    }
    map.querySourceFeatures(source).filter(({ properties }) => properties.id === targetId)
      .forEach(({ geometry }) => collect(geometry.coordinates));
    for (const coordinate of coordinates) {
      const point = map.project(coordinate);
      const clientX = point.x + rect.left;
      const clientY = point.y + rect.top;
      if (!document.elementFromPoint(clientX, clientY)?.closest?.("#map")) continue;
      if (map.queryRenderedFeatures(point, { layers: [layer] }).some(({ properties }) => properties.id === targetId)) {
        return { clientX, clientY };
      }
    }
    return null;
  }, { targetId, family });
}

for (const targetId of ["black-hills", "ozark-mountains", "columbia-river", "lake-huron"]) {
  test(`${targetId} uses national context and an emphasized guided teaching target`, async ({ page }, testInfo) => {
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    const feature = await launchPhysicalTeaching(page, targetId);
    await expectCamera(page, lower48Camera);
    const state = await expectTeachingHighlight(page, targetId);
    expect(state.cameraDecision.source).toBe("lower48-physical-default");
    expect(state.geometryMetadata).toMatchObject(feature.geometry);
    expect(state.sourceBounds.flat(2).every(Number.isFinite)).toBe(true);
    await captureTeaching(page, testInfo, `${targetId}-teaching`);
    if (feature.family === "mountain-range") {
      const mountains = await page.evaluate(() => window.__MAPPA_TEST_API__.getMountainRangeVisualState());
      expect(mountains.mountainSymbolTargetIds).toContain(targetId);
      expect(mountains.mountainSymbolTargetIds.length).toBeGreaterThan(1);
      await tapVisibleMountain(page, targetId);
    } else {
      // A fixed reviewed zoom shows less longitude on a portrait viewport.
      // Verify the existing learner zoom control can bring edge features into view.
      let point = await findVisiblePhysicalHitPoint(page, targetId, feature.family);
      for (let attempt = 0; !point && attempt < 4; attempt += 1) {
        await page.getByRole("button", { name: "Zoom out", exact: true }).click();
        await expect.poll(() => page.evaluate(() => window.maplibrePocMap.isMoving())).toBe(false);
        point = await findVisiblePhysicalHitPoint(page, targetId, feature.family);
      }
      expect(point, `${targetId} remains reachable through normal map controls`).toBeTruthy();
      await captureTeaching(page, testInfo, `${targetId}-reachable-teaching`);
      await page.mouse.click(point.clientX, point.clientY);
    }
    await expect.poll(() => page.evaluate(() => (
      window.__MAPPA_TEST_API__.getGuidedPhysicalTeachingHighlight()?.targetId
    ))).not.toBe(targetId);
    const evidence = await page.evaluate((key) => (
      JSON.parse(localStorage.getItem(key)).events.filter(({ sourceMode }) => sourceMode === "guided-learning-orchestration")
    ), CANONICAL_EVIDENCE_REPOSITORY_STORAGE_KEY);
    expect(evidence.filter(({ conceptId }) => conceptId === feature.conceptId)).toHaveLength(1);
    expect(evidence.find(({ conceptId }) => conceptId === feature.conceptId)?.outcome).toBe("assisted");
    expect(errors).toEqual([]);
  });
}

test("Alaska physical teaching preserves regional framing", async ({ page }, testInfo) => {
  await launchPhysicalTeaching(page, "alaska-range");
  await expectTeachingHighlight(page, "alaska-range");
  const state = await page.evaluate(() => window.__MAPPA_TEST_API__.getGuidedPhysicalFeatureVisualState());
  expect(state.cameraDecision.source).toBe("alaska-preset");
  await expectCamera(page, { center: [-154.35, 64.95], zoom: 3.55 });
  await expect.poll(() => page.evaluate(() => (
    window.__MAPPA_TEST_API__.getGuidedPhysicalFeatureVisualState()?.camera.center[1]
  ))).toBeGreaterThan(55);
  expect(state.cameraDecision.center).not.toEqual(lower48Camera.center);
  await captureTeaching(page, testInfo, "alaska-teaching");
  await tapVisibleMountain(page, "alaska-range");
  await expect.poll(() => page.evaluate(() => (
    window.__MAPPA_TEST_API__.getGuidedPhysicalTeachingHighlight()?.targetId
  ))).not.toBe("alaska-range");
});

test("the Northeast authored override still takes precedence", async ({ page }) => {
  await launchPhysicalTeaching(page, "white-mountains", { extraStateIds: ["vermont", "new-york"] });
  await expectCamera(page, { center: [-76.24, 40.39], zoom: 5.16 });
  const state = await expectTeachingHighlight(page, "white-mountains");
  expect(state.cameraDecision.source).toBe("authored-override");
});

test("teaching emphasis follows the cohort and clears before independent retrieval", async ({ page }) => {
  await launchPhysicalTeaching(page, "ozark-mountains", { extraStateIds: ["south-dakota", "wyoming"] });
  const cohort = ["ozark-mountains", "ouachita-mountains", "black-hills"];
  expect(await page.evaluate(() => (
    window.__MAPPA_TEST_API__.getGuidedPhysicalTeachingState()?.teachingTargetIds
  ))).toEqual(cohort);
  for (const targetId of cohort) {
    await expectCamera(page, lower48Camera);
    await expectTeachingHighlight(page, targetId);
    expect(await page.evaluate(() => window.__MAPPA_TEST_API__.answerGuidedPhysicalTeachingCorrectly())).toBe(true);
    await expect.poll(() => page.evaluate(() => (
      window.__MAPPA_TEST_API__.getGuidedPhysicalTeachingHighlight()?.targetId
    ))).not.toBe(targetId);
  }
  await expect.poll(() => page.evaluate(() => window.__MAPPA_TEST_API__.getActiveMemoryTrailState())).toMatchObject({
    guidedLocatingOnly: true,
    phase: "answering",
    currentPromptType: "name_to_place",
    targetPoolIds: cohort,
    activeHighlightIds: [],
    completedLabelTargetIds: []
  });
  await expectSearchSpace(page);
  const retrieval = await page.evaluate(() => window.__MAPPA_TEST_API__.getGuidedPhysicalFeatureVisualState());
  expect(retrieval.teachingHighlight).toMatchObject({ phase: "retrieval", animated: false, nonTargetMuted: false });
  expect(retrieval.teachingHighlight.targetId).toBeFalsy();
  expect(await page.evaluate(() => window.__MAPPA_TEST_API__.answerActiveMemoryTrailCorrectly())).toBe(true);
  await expect.poll(() => page.evaluate(() => (
    window.__MAPPA_TEST_API__.getActiveMemoryTrailState()?.correctCount
  ))).toBe(1);
  await expect.poll(() => page.evaluate(() => window.__MAPPA_TEST_API__.getActiveMemoryTrailState()?.phase)).toBe("answering");
  expect(await page.evaluate(() => window.__MAPPA_TEST_API__.getActiveMemoryTrailState()?.activeHighlightIds)).toEqual([]);
});

async function expectSearchSpace(page, searchSpace = "lower48") {
  await expect.poll(() => page.evaluate(() => (
    window.__MAPPA_TEST_API__.getGuidedPhysicalFeatureVisualState()?.cameraDecision
  ))).toMatchObject({ cameraPhase: "retrieval", searchSpace });
  const decision = await page.evaluate(() => window.__MAPPA_TEST_API__.getGuidedPhysicalFeatureVisualState().cameraDecision);
  await expectCamera(page, decision);
  if (searchSpace === "lower48") {
    const projected = await page.evaluate(() => {
      const decision = window.__MAPPA_TEST_API__.getGuidedPhysicalFeatureVisualState().cameraDecision;
      const map = window.maplibrePocMap;
      const [[west, south], [east, north]] = decision.searchSpaceBounds;
      const { width, height } = map.getContainer().getBoundingClientRect();
      return [[west, south], [west, north], [east, south], [east, north]].map((point) => {
        const { x, y } = map.project(point);
        return { x, y, inside: x >= 0 && x <= width && y >= 0 && y <= height };
      });
    });
    expect(projected.every(({ inside }) => inside), JSON.stringify(projected)).toBe(true);
    const coverage = await page.evaluate(async () => {
      const atlas = await (await fetch("/assets/maps/data/maplibre-us-states-atlas.geojson")).json();
      const map = window.maplibrePocMap;
      const rect = map.getContainer().getBoundingClientRect();
      const states = atlas.features.filter(({ properties }) => !["alaska", "hawaii"].includes(properties.id));
      const outside = [];
      function visit(value) {
        if (typeof value[0] === "number") {
          const point = map.project(value);
          if (point.x < 0 || point.x > rect.width || point.y < 0 || point.y > rect.height) outside.push(value);
        } else value.forEach(visit);
      }
      states.forEach(({ geometry }) => visit(geometry.coordinates));
      return { stateCount: states.length, outside: outside.slice(0, 5) };
    });
    expect(coverage.stateCount).toBeGreaterThanOrEqual(48);
    expect(coverage.outside).toEqual([]);
  }
  return decision;
}

for (const targetId of ["white-mountains", "ozark-mountains", "alaska-range"]) {
  test(`search-space retrieval for ${targetId} is stable and tappable without a hint`, async ({ page }, testInfo) => {
    await launchPhysicalTeaching(page, targetId, { extraStateIds: ["vermont", "new-york", "south-dakota", "wyoming"] });
    const targets = await page.evaluate(() => window.__MAPPA_TEST_API__.getGuidedPhysicalTeachingState().teachingTargetIds);
    for (const id of targets) {
      await expectTeachingHighlight(page, id);
      await page.evaluate(() => window.__MAPPA_TEST_API__.answerGuidedPhysicalTeachingCorrectly());
      await expect.poll(() => page.evaluate(() => window.__MAPPA_TEST_API__.getGuidedPhysicalTeachingHighlight()?.targetId)).not.toBe(id);
    }
    const decision = await expectSearchSpace(page, targetId === "alaska-range" ? "alaska" : "lower48");
    await writeFile(testInfo.outputPath("retrieval-camera.json"), JSON.stringify(decision, null, 2));
    await captureTeaching(page, testInfo, `${targetId}-retrieval`);
    const hitSizes = await page.evaluate(() => {
      const state = window.__MAPPA_TEST_API__.getMountainRangeVisualState();
      return Object.fromEntries(Object.entries(state.targetClientPointSets).map(([id, points]) => [id, {
        width: Math.max(...points.map(({ x }) => x)) - Math.min(...points.map(({ x }) => x)),
        height: Math.max(...points.map(({ y }) => y)) - Math.min(...points.map(({ y }) => y))
      }]));
    });
    await testInfo.attach("projected-range-spans", { body: JSON.stringify(hitSizes, null, 2), contentType: "application/json" });
    let expectedCamera = decision;
    for (let count = 0; count < targets.length; count += 1) {
      await expect.poll(() => page.evaluate(() => window.__MAPPA_TEST_API__.getActiveMemoryTrailState()?.phase)).toBe("answering");
      const state = await page.evaluate(() => window.__MAPPA_TEST_API__.getActiveMemoryTrailState());
      expect(state.activeHighlightIds).toEqual([]);
      expect(state.completedLabelTargetIds).toEqual([]);
      expect(await page.evaluate(() => window.__MAPPA_TEST_API__.getGuidedPhysicalTeachingHighlight().pulseRunning)).toBe(false);
      await expectCamera(page, expectedCamera);
      await tapVisibleMountain(page, state.currentPromptTargetId);
      await expect.poll(() => page.evaluate(() => window.__MAPPA_TEST_API__.getActiveMemoryTrailState()?.correctCount)).toBe(count + 1);
      if (count === 0 && targetId === "ozark-mountains") {
        expectedCamera = await page.evaluate(() => {
          window.maplibrePocMap.panBy([8, 0], { duration: 0 });
          return window.__MAPPA_TEST_API__.getGuidedPhysicalFeatureVisualState().camera;
        });
      }
    }
  });
}

test("rendered Black Hills halo has visibly different resting and peak frames", async ({ page }, testInfo) => {
  await launchPhysicalTeaching(page, "black-hills");
  await expectCamera(page, lower48Camera);
  await expectTeachingHighlight(page, "black-hills");
  for (const phase of ["rest", "peak", "rest", "peak"]) {
    const frame = await page.evaluate((phase) => new Promise((resolve) => {
      const map = window.maplibrePocMap;
      const onRender = () => {
        const radius = map.getPaintProperty("guided-physical-mountain-halo", "circle-radius");
        if (!(phase === "rest" ? radius < 16 : radius > 32)) return;
        map.off("render", onRender);
        resolve({ radius, image: map.getCanvas().toDataURL("image/png") });
      };
      map.on("render", onRender);
      map.triggerRepaint();
    }), phase);
    const name = `black-hills-rendered-${phase}-${Date.now()}`;
    const path = testInfo.outputPath(`${name}.png`);
    await writeFile(path, Buffer.from(frame.image.split(",")[1], "base64"));
    await testInfo.attach(name, { path, contentType: "image/png" });
  }
});

test("reduced motion preserves static teaching hierarchy and leaving clears it", async ({ page }, testInfo) => {
  await launchPhysicalTeaching(page, "black-hills", { reducedMotion: "reduce" });
  await expectCamera(page, lower48Camera);
  await expectTeachingHighlight(page, "black-hills", { animated: false, reducedMotion: true });
  await captureTeaching(page, testInfo, "black-hills-reduced-motion");
  await tapVisibleMountain(page, "black-hills");
  await expect.poll(() => page.evaluate(() => (
    window.__MAPPA_TEST_API__.getGuidedPhysicalTeachingHighlight()?.targetId
  ))).not.toBe("black-hills");
  const before = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)).events.length, CANONICAL_EVIDENCE_REPOSITORY_STORAGE_KEY);
  await page.locator("#back-button").click();
  await expect(page.locator(".guided-physical-teaching-panel")).toBeHidden();
  const highlight = await page.evaluate(() => window.__MAPPA_TEST_API__.getGuidedPhysicalTeachingHighlight());
  expect(highlight?.animated || false).toBe(false);
  expect(highlight?.nonTargetMuted || false).toBe(false);
  expect(highlight?.targetId).toBeFalsy();
  expect(await page.evaluate((key) => JSON.parse(localStorage.getItem(key)).events.length, CANONICAL_EVIDENCE_REPOSITORY_STORAGE_KEY)).toBe(before);
});
