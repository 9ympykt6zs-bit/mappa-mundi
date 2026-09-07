import { GUIDED_RECONSTRUCTION_CHECKPOINTS } from "../../src/guided-reconstruction.js";
import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";
import { learningProgressStorageKeys } from "../../src/learning-progress-reset.js";
import { GUIDED_CHILD_LAUNCH_STORAGE_KEY } from "../../src/guided-child-launch-contract.js";

function createStrongStageOneCanonicalRepository() {
  const events = [];
  let sequence = 0;
  for (let sectionNumber = 1; sectionNumber <= 11; sectionNumber += 1) {
    const sectionId = String(sectionNumber).padStart(2, "0");
    const activity = JSON.parse(readFileSync(new URL(
      `../../assets/maps/data/us-states-capitals-${sectionId}.json`,
      import.meta.url
    ), "utf8"));
    const features = activity.features || activity.targets || [];
    const states = features.filter(({ type }) => type === "state");
    const stateByAbbreviation = new Map(states.map((state) => [state.state, state]));
    const capitals = features.filter(({ type, state }) => type === "capital" && stateByAbbreviation.has(state));
    const addCorrectEvents = ({ conceptId, skillId, sourceActivityId }) => {
      for (let repetition = 0; repetition < 5; repetition += 1) {
        const eventId = `stage-one-${sequence}`;
        events.push({
          schemaVersion: 1,
          eventId,
          attemptId: eventId,
          occurredAt: new Date(Date.UTC(2039, 0, 1, 0, 0, sequence)).toISOString(),
          sequence,
          conceptId,
          skillId,
          sourceMode: "journey",
          sourceActivityId,
          outcome: "correct"
        });
        sequence += 1;
      }
    };
    for (const state of states) {
      addCorrectEvents({
        conceptId: `state-location:${state.id}`,
        skillId: "locating",
        sourceActivityId: `us-states-${sectionId}`
      });
      addCorrectEvents({
        conceptId: `state-naming:${state.id}`,
        skillId: "identifying",
        sourceActivityId: `us-states-${sectionId}`
      });
    }
    for (const capital of capitals) {
      const state = stateByAbbreviation.get(capital.state);
      addCorrectEvents({
        conceptId: `capital-location:${state.id}:${capital.id}`,
        skillId: "locating",
        sourceActivityId: `us-capitals-${sectionId}`
      });
    }
  }
  return { storageVersion: 1, evidenceSchemaVersion: 1, events };
}

function createLakesNeedCanonicalRepository() {
  const repository = createStrongStageOneCanonicalRepository();
  let sequence = repository.events.length;
  const families = [
    {
      type: "river",
      files: ["us-physical-rivers.json"]
    },
    {
      type: "mountain-range",
      files: [
        "us-physical-western-mountains.json",
        "us-physical-midwestern-mountains.json",
        "us-physical-eastern-mountains.json",
        "us-physical-alaska-mountains.json"
      ]
    }
  ];
  for (const family of families) {
    for (const file of family.files) {
      const activity = JSON.parse(readFileSync(new URL(`../../assets/maps/data/${file}`, import.meta.url), "utf8"));
      for (const target of activity.features || activity.targets || []) {
        for (const [skillId, conceptSuffix] of [["locating", "location"], ["identifying", "naming"]]) {
          for (let repetition = 0; repetition < 5; repetition += 1) {
            const eventId = `physical-${sequence}`;
            repository.events.push({
              schemaVersion: 1,
              eventId,
              attemptId: eventId,
              occurredAt: new Date(Date.UTC(2039, 0, 2, 0, 0, sequence)).toISOString(),
              sequence,
              conceptId: `${family.type}-${conceptSuffix}:${target.id}`,
              skillId,
              sourceMode: "journey",
              sourceActivityId: activity.id,
              outcome: "correct"
            });
            sequence += 1;
          }
        }
      }
    }
  }
  return repository;
}

async function startPrototype(page, query = "?test=1&globeNavigation=on") {
  await page.goto(`/${query}`);
  await expect(page.locator("#launch-screen")).toBeVisible();
  await page.locator("#launch-start-button").click();
  await page.evaluate(() => window.__mappaMundiLoadApp());
  await expect(page.locator("#globe-navigation-panel")).toBeVisible({ timeout: 20_000 });
}

async function globeState(page) {
  return page.evaluate(() => window.__MAPPA_TEST_API__.getGlobeNavigationState());
}

function evaluateStyleExpression(expression, properties) {
  if (!Array.isArray(expression)) return expression;
  const [operator, ...arguments_] = expression;
  if (operator === "get") return properties[arguments_[0]];
  if (operator === "boolean") {
    const value = evaluateStyleExpression(arguments_[0], properties);
    return typeof value === "boolean" ? value : evaluateStyleExpression(arguments_[1], properties);
  }
  if (operator === "case") {
    for (let index = 0; index < arguments_.length - 1; index += 2) {
      if (evaluateStyleExpression(arguments_[index], properties)) {
        return evaluateStyleExpression(arguments_[index + 1], properties);
      }
    }
    return evaluateStyleExpression(arguments_.at(-1), properties);
  }
  throw new Error(`Unsupported test expression operator: ${operator}`);
}

function getVisualState(state, scopeId) {
  return state.visualStates.find(({ id }) => id === scopeId);
}

function getVisualOpacity(state, scopeId) {
  const visualState = getVisualState(state, scopeId);
  return evaluateStyleExpression(state.overviewPaint.fillOpacity, {
    globeNavigationSelectable: visualState?.selectable === true,
    globeNavigationCurrent: visualState?.current === true,
    globeNavigationSelected: visualState?.selected === true,
    globeNavigationHovered: visualState?.hovered === true
  });
}

const scopeLabels = {
  "north-america": "North America",
  "south-america": "South America",
  europe: "Europe",
  africa: "Africa",
  asia: "Asia",
  oceania: "Oceania",
  antarctica: "Antarctica",
  "united-states": "United States",
  germany: "Germany",
  france: "France",
  italy: "Italy",
  netherlands: "Netherlands"
};

async function chooseMapScope(page, scopeId, { checkHover = false, coordinate = null, useTouch = false } = {}) {
  const state = await globeState(page);
  const point = coordinate
    ? await page.evaluate(
      (nextCoordinate) => window.__MAPPA_TEST_API__.projectGlobeNavigationCoordinate(nextCoordinate),
      coordinate
    )
    : state.selectableMapPoints[scopeId];
  expect(point).toBeTruthy();
  const mapBox = await page.locator("#map").boundingBox();
  expect(mapBox).not.toBeNull();

  const x = mapBox.x + point.x;
  const y = mapBox.y + point.y;
  if (useTouch) {
    await page.touchscreen.tap(x, y);
  } else {
    await page.mouse.move(x, y);
    if (checkHover) {
      await expect(page.locator("#globe-navigation-hover-name")).toHaveText(scopeLabels[scopeId]);
      await expect.poll(async () => (
        (await globeState(page)).visualStates.filter(({ hovered }) => hovered).map(({ id }) => id)
      )).toEqual([scopeId]);
    }
    await page.mouse.click(x, y);
  }
  await expect.poll(async () => (await globeState(page)).scopeId).toBe(scopeId);
}

async function chooseSearchScope(page, label, query = label, expectedScopeId = label.toLowerCase().replaceAll(" ", "-")) {
  const search = page.getByRole("combobox", { name: "Find a place" });
  await search.fill(query);
  await page.locator("#globe-navigation-find-options").getByRole("option", { name: label }).click();
  await expect.poll(async () => (await globeState(page)).scopeId).toBe(expectedScopeId);
}

test("globe-first launch drills to direct U.S. learning while preserving objective-menu access", async ({ page }, testInfo) => {
  const runtimeErrors = [];
  page.on("pageerror", (error) => runtimeErrors.push(`pageerror: ${error.message}`));
  page.on("console", (message) => {
    if (message.type() === "error") runtimeErrors.push(`console: ${message.text()}`);
  });

  await startPrototype(page);
  await expect(page.locator("#poc-title")).toHaveText("Where do you want to learn?");
  await expect(page.locator("#poc-instruction")).toHaveText("Choose a continent on the globe.");
  await expect(page.getByRole("button", { name: /Learn the Continents/ })).toBeVisible();
  await expect(page.getByRole("button", { name: "Use current menu" })).toBeVisible();
  await expect(page.getByRole("combobox", { name: "Find a place" })).toHaveAttribute("type", "search");
  await expect.poll(async () => (await globeState(page)).camera.zoom).toBeCloseTo(1.85, 1);

  const layout = await page.evaluate(() => {
    const panel = document.querySelector("#globe-navigation-panel");
    const header = document.querySelector(".poc-header");
    const search = document.querySelector("#globe-navigation-find");
    const actions = document.querySelector(".globe-navigation-actions");
    const panelStyle = getComputedStyle(panel);
    const headerStyle = getComputedStyle(header);
    return {
      viewport: { width: window.innerWidth, height: window.innerHeight },
      noHorizontalOverflow: document.documentElement.scrollWidth <= window.innerWidth,
      panel: panel.getBoundingClientRect().toJSON(),
      panelBackground: panelStyle.backgroundColor,
      panelBorderWidth: panelStyle.borderTopWidth,
      panelShadow: panelStyle.boxShadow,
      headerBackground: headerStyle.backgroundColor,
      headerBorderWidth: headerStyle.borderTopWidth,
      headerShadow: headerStyle.boxShadow,
      search: search.getBoundingClientRect().toJSON(),
      actions: actions.getBoundingClientRect().toJSON(),
      primary: document.querySelector("#globe-navigation-learn-button").getBoundingClientRect().toJSON(),
      quiet: document.querySelector("#globe-navigation-current-menu").getBoundingClientRect().toJSON()
    };
  });
  expect(layout.panelBackground).toBe("rgba(0, 0, 0, 0)");
  expect(layout.panelBorderWidth).toBe("0px");
  expect(layout.panelShadow).toBe("none");
  expect(layout.headerBackground).toBe("rgba(0, 0, 0, 0)");
  expect(layout.headerBorderWidth).toBe("0px");
  expect(layout.headerShadow).toBe("none");
  expect(layout.noHorizontalOverflow).toBe(true);
  expect(layout.search.x).toBeGreaterThanOrEqual(0);
  expect(layout.search.right).toBeLessThanOrEqual(layout.viewport.width);
  expect(layout.actions.bottom).toBeLessThanOrEqual(layout.viewport.height);
  expect(layout.viewport.height - layout.actions.bottom).toBeGreaterThanOrEqual(20);
  expect(layout.primary.height).toBeGreaterThan(layout.quiet.height);
  expect(layout.search.bottom).toBeLessThan(layout.actions.top);
  if (testInfo.project.name.includes("desktop")) {
    expect(layout.search.x).toBeLessThan(layout.viewport.width / 3);
    expect(layout.search.y).toBeLessThan(layout.viewport.height / 3);
  }

  const worldState = await globeState(page);
  expect(worldState.scopeId).toBe("world");
  expect(worldState.childIds).toEqual([
    "north-america",
    "south-america",
    "europe",
    "africa",
    "asia",
    "oceania",
    "antarctica"
  ]);
  expect(worldState.countryScopeCount).toBe(179);
  expect(worldState.selectableIds).toHaveLength(185);
  expect(worldState.selectableIds).toEqual(expect.arrayContaining([
    "north-america", "south-america", "europe", "africa", "asia", "oceania", "antarctica",
    "united-states", "germany", "france", "italy", "netherlands", "country-per", "country-gha", "country-jpn"
  ]));
  expect(new Set(worldState.renderedFeatureIds)).toEqual(new Set(worldState.selectableIds));
  expect(worldState.visualStates.filter(({ selected }) => selected)).toEqual([]);
  expect(worldState.visualStates.filter(({ hovered }) => hovered)).toEqual([]);
  expect(worldState.visualStates.every(({ id }) => getVisualOpacity(worldState, id) === 0)).toBe(true);

  await page.getByRole("button", { name: /Learn the Continents/ }).click();
  await expect.poll(
    () => page.evaluate(() => window.__MAPPA_TEST_API__?.getCurrentActivity()?.id),
    { timeout: 20_000 }
  ).toBe("continents-oceans");
  await page.locator("#back-button").click();
  await expect(page.locator("#poc-title")).toHaveText("Where do you want to learn?");

  if (testInfo.project.name.includes("mobile")) {
    await chooseSearchScope(page, "North America", "north");
  } else {
    await chooseMapScope(page, "north-america", { checkHover: true, coordinate: [-110, 55] });
  }
  await expect(page.locator("#poc-title")).toHaveText("North America");
  const northAmericaState = await globeState(page);
  expect(northAmericaState.visualStates.filter(({ selected }) => selected)).toEqual([]);
  expect(northAmericaState.visualStates.every(({ id }) => getVisualOpacity(northAmericaState, id) === 0)).toBe(true);
  await expect(page.getByRole("button", { name: /Learn North America/ })).toBeVisible();
  await expect(page.locator("#globe-navigation-path")).toContainText("World");
  await expect(page.locator("#globe-navigation-path")).toContainText("North America");

  await chooseMapScope(page, "united-states", { useTouch: testInfo.project.name.includes("mobile") });
  await expect(page.locator("#poc-title")).toHaveText("United States");
  await expect(page.getByRole("button", { name: /Learn the United States/ })).toBeVisible();
  await expect(page.getByRole("button", { name: "Choose what to learn" })).toBeVisible();
  expect((await globeState(page)).path.map(({ label }) => label)).toEqual(["World", "North America", "United States"]);
  expect((await globeState(page)).visualStates.filter(({ selected }) => selected).map(({ id }) => id)).toEqual(["united-states"]);

  await page.getByRole("button", { name: "Choose what to learn" }).click();
  await expect(page.locator("#app-shell-title")).toHaveText("Across the United States");
  await expect(page.locator(".us-objective-title")).toHaveText([
    "Learn States & Capitals",
    "Learn Physical Features",
    "Learn Connections",
    "Explore the United States"
  ]);
  await page.locator("#app-shell-back-button").click();
  await expect(page.locator("#poc-title")).toHaveText("United States");

  await page.getByRole("button", { name: /Learn the United States/ }).click();
  await expect.poll(
    () => page.evaluate(() => window.__MAPPA_TEST_API__?.getCurrentActivity()?.id),
    { timeout: 20_000 }
  ).toBe("us-states-01");
  await expect(page.locator(".memory-trail-panel")).toBeVisible();
  await expect(page.getByRole("button", { name: "Label Map" })).toBeVisible();
  expect((await globeState(page)).screen).toBe("united-states-trail-gameplay");
  const initialContinuationTrace = await page.evaluate(() => window.__MAPPA_TEST_API__.getUnitedStatesContinuationTrace());
  expect(initialContinuationTrace.targetedEntry.accepted).toBe(true);
  expect(initialContinuationTrace.targetedEntry.resolvedSectionId).toBe("us-states-01");
  await page.getByRole("button", { name: "Label Map" }).click();
  await expect(page.locator(".memory-trail-panel")).toBeHidden();
  await expect(page.getByRole("button", { name: "Guided Learning" })).toBeVisible();
  expect((await globeState(page)).screen).toBe("journey-gameplay");
  await expect(page.locator("#app-shell-screen")).toBeHidden();

  await startPrototype(page);
  await chooseSearchScope(page, "United States", "united");
  await page.getByRole("button", { name: /Learn the United States/ }).click();
  await expect.poll(
    () => page.evaluate(() => window.__MAPPA_TEST_API__?.getGlobeNavigationState()?.screen),
    { timeout: 20_000 }
  ).toBe("united-states-trail-gameplay");
  expect(await page.evaluate(() => window.__MAPPA_TEST_API__.getUnitedStatesContinuationTrace().selectedObjective))
    .toBe("learn-states-and-capitals");
  const continuationTrace = await page.evaluate(() => window.__MAPPA_TEST_API__.getUnitedStatesContinuationTrace());
  expect(continuationTrace.targetedEntry.accepted).toBe(false);
  expect(continuationTrace.targetedEntry.resolvedSectionId).toBe("us-states-01");
  expect(continuationTrace.targetedEntry.fallbackReason).toBe("active-session-resume");
  expect(continuationTrace.objectiveClassifications.map(({ id }) => id)).toEqual([
    "learn-states-and-capitals",
    "learn-physical-features",
    "learn-connections",
    "explore-united-states"
  ]);
  expect(runtimeErrors).toEqual([]);
});

test("Reset All Learning Progress starts U.S. learning in the actual Guided Learning mode", async ({ page }) => {
  await page.goto("/?test=1&globeNavigation=off");
  await page.evaluate((learningKeys) => {
    learningKeys.forEach((key) => localStorage.setItem(key, `seeded:${key}`));
  }, learningProgressStorageKeys);
  await page.locator("#launch-start-button").click();
  await page.evaluate(() => window.__mappaMundiLoadApp());
  if (await page.locator("#launch-screen").isVisible()) {
    await page.locator("#launch-start-button").click();
  }
  await expect(page.locator("#app-shell-title")).toHaveText("Main Menu");
  await page.locator("#app-shell-settings-gear").click();
  await expect(page.locator("#app-shell-title")).toHaveText("Settings");
  await page.getByRole("button", { name: "Customize" }).click();
  await page.locator('details[data-settings-key="reset-defaults"] > summary').click();
  await page.getByRole("button", { name: "Reset All Learning Progress" }).click();
  const dialog = page.getByRole("alertdialog", { name: "Reset all learning progress across Mappa Mundi?" });
  await Promise.all([
    page.waitForNavigation(),
    dialog.getByRole("button", { name: "Erase All Learning Progress" }).click()
  ]);

  await expect(page.locator("#launch-screen")).toBeVisible();
  expect(await page.evaluate((learningKeys) => (
    learningKeys.every((key) => localStorage.getItem(key) === null)
  ), learningProgressStorageKeys)).toBe(true);
  await startPrototype(page);
  await chooseSearchScope(page, "United States", "united");
  await page.getByRole("button", { name: /Learn the United States/ }).click();

  await expect.poll(
    () => page.evaluate(() => window.__MAPPA_TEST_API__?.getGlobeNavigationState()?.screen),
    { timeout: 20_000 }
  ).toBe("united-states-trail-gameplay");
  await expect(page.locator(".memory-trail-panel")).toBeVisible();
  await expect(page.locator(".daily-trail-primary-instruction")).toBeVisible();
  await expect(page.locator("#answer-bank .memory-trail-response-chip")).toBeVisible();
  await expect(page.locator("#answer-bank .label-chip:not(.memory-trail-response-chip)")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Label Map" })).toBeVisible();

  await page.getByRole("button", { name: "Label Map" }).click();
  await expect.poll(
    () => page.evaluate(() => window.__MAPPA_TEST_API__?.getGlobeNavigationState()?.screen)
  ).toBe("journey-gameplay");
  await expect(page.locator(".memory-trail-panel")).toBeHidden();
  await expect(page.locator("#answer-bank .label-chip")).toHaveCount(5);
  await expect(page.getByRole("button", { name: "Guided Learning" })).toBeVisible();
});

test("last Journey screen does not override evidence-driven U.S. continuation", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("atlasQuestProgress", JSON.stringify({
      version: 1,
      activeJourneyId: "united-states",
      activeStepIndex: 1,
      activeDifficulty: "easy",
      recentJourneyId: "united-states",
      recentDifficulty: "easy",
      journeys: {
        "united-states": {
          currentStepIndex: 1,
          completedSteps: { "us-states-01": { easy: true, medium: false, hard: false } },
          completedDifficulties: { easy: false, medium: false, hard: false }
        }
      }
    }));
  });
  await startPrototype(page);
  await chooseSearchScope(page, "United States", "united");
  await page.getByRole("button", { name: /Learn the United States/ }).click();
  await expect.poll(
    () => page.evaluate(() => window.__MAPPA_TEST_API__?.getCurrentActivity()?.id),
    { timeout: 20_000 }
  ).toBe("us-states-01");
  await expect(page.locator(".memory-trail-panel")).toBeVisible();
  await expect(page.getByRole("button", { name: "Label Map" })).toBeVisible();
  expect(await page.evaluate(() => window.__MAPPA_TEST_API__.getUnitedStatesContinuationTrace().reason))
    .toBe("not-started");
});

test("scoped Guided Learning reset does not erase canonical U.S. returning-learner evidence", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.removeItem("mappaUnitedStatesMemoryTrailProgress");
    localStorage.setItem("mappaMundiCanonicalEvidence", JSON.stringify({
      storageVersion: 1,
      evidenceSchemaVersion: 1,
      events: [{
        schemaVersion: 1,
        eventId: "retained-us-history",
        attemptId: "retained-us-attempt",
        occurredAt: "2026-08-29T12:00:00.000Z",
        conceptId: "state-location:maine",
        skillId: "locating",
        sourceMode: "united-states-memory-trail",
        sourceActivityId: "us-states-01",
        outcome: "correct"
      }]
    }));
  });
  await startPrototype(page);
  await chooseSearchScope(page, "United States", "united");
  await page.getByRole("button", { name: /Learn the United States/ }).click();
  await expect.poll(
    () => page.evaluate(() => window.__MAPPA_TEST_API__?.getCurrentActivity()?.id),
    { timeout: 20_000 }
  ).toBe("us-states-01");
  await expect(page.locator(".memory-trail-panel")).toBeVisible();
  await expect(page.getByRole("button", { name: "Label Map" })).toBeVisible();
  expect(await page.evaluate(() => (
    JSON.parse(localStorage.getItem("mappaMundiCanonicalEvidence") || "{}").events?.length
  ))).toBe(1);
});

test("strong canonical Stage 1 evidence advances Learn to Rivers on desktop and mobile", async ({ page }) => {
  const repository = createStrongStageOneCanonicalRepository();
  await page.addInitScript(({ canonicalRepository, completedBlockIds }) => {
    localStorage.setItem("mappaGuidedLearningOrchestration", JSON.stringify({ version: 6, completedBlockIds }));
    localStorage.setItem("mappaMundiCanonicalEvidence", JSON.stringify(canonicalRepository));
    localStorage.setItem("atlasQuestProgress", JSON.stringify({
      version: 1,
      activeJourneyId: "united-states",
      activeStepIndex: 1,
      activeDifficulty: "easy",
      recentJourneyId: "united-states",
      recentDifficulty: "easy",
      journeys: {}
    }));
  }, { canonicalRepository: repository, completedBlockIds: GUIDED_RECONSTRUCTION_CHECKPOINTS.map(({ blockId }) => blockId) });
  await startPrototype(page);
  await chooseSearchScope(page, "United States", "united");
  const journeyBefore = await page.evaluate(() => window.__MAPPA_TEST_API__.getSavedJourneyProgress());
  await page.getByRole("button", { name: /Learn the United States/ }).click();

  await expect.poll(
    () => page.evaluate(() => window.__MAPPA_TEST_API__?.getCurrentActivity()?.id),
    { timeout: 20_000 }
  ).toBe("us-physical-rivers");
  const trace = await page.evaluate(() => window.__MAPPA_TEST_API__.getUnitedStatesContinuationTrace());
  expect(trace.selectedObjective).toBe("learn-physical-features");
  expect(trace.selectedFamily).toBe("physical-rivers");
  expect(trace.destination.kind).toBe("united-states-guided-learning");
  expect(trace.destination.targetedNeed.familyId).toBe("physical-rivers");
  expect(trace.routing).toMatchObject({
    destinationType: "guided-learning",
    targetedNeed: "physical-rivers",
    legacyJourneyLaunch: false,
    boundedChildLaunched: true
  });
  expect(trace.childLaunchContract).toMatchObject({
    source: "guided-learning",
    entrySource: "evidence-driven-primary-learn",
    returnTo: "guided-learning",
    child: {
      destinationKind: "physical-feature-introduction",
      activityId: "us-physical-rivers",
      featureFamily: "river"
    }
  });
  expect(trace.childLaunchContract.child.targetIds.length).toBeGreaterThan(0);
  expect(trace.childLaunchContract.child.targetIds.length).toBeLessThan(9);
  expect((await globeState(page)).screen).toBe("study-explore");
  expect(await page.evaluate(() => window.__MAPPA_TEST_API__.getSavedJourneyProgress())).toEqual(journeyBefore);
  expect(trace.reason).toBe("not-started");
});

test("a Lakes continuation enters bounded Guided Learning while manual Lakes remains full and open", async ({ page }) => {
  const repository = createLakesNeedCanonicalRepository();
  await page.addInitScript(({ canonicalRepository, childKey, completedBlockIds }) => {
    localStorage.setItem("mappaGuidedLearningOrchestration", JSON.stringify({ version: 5, completedBlockIds }));
    localStorage.setItem("mappaMundiCanonicalEvidence", JSON.stringify(canonicalRepository));
    localStorage.removeItem(childKey);
  }, { canonicalRepository: repository, childKey: GUIDED_CHILD_LAUNCH_STORAGE_KEY,
    completedBlockIds: GUIDED_RECONSTRUCTION_CHECKPOINTS.map(({ blockId }) => blockId) });
  await startPrototype(page);
  await chooseSearchScope(page, "United States", "united");
  const journeyBefore = await page.evaluate(() => window.__MAPPA_TEST_API__.getSavedJourneyProgress());
  await page.getByRole("button", { name: /Learn the United States/ }).click();

  await expect.poll(
    () => page.evaluate(() => window.__MAPPA_TEST_API__?.getCurrentActivity()?.id),
    { timeout: 20_000 }
  ).toBe("us-physical-lakes");
  const trace = await page.evaluate(() => window.__MAPPA_TEST_API__.getUnitedStatesContinuationTrace());
  expect(trace.selectedFamily).toBe("physical-lakes");
  expect(trace.routing).toMatchObject({
    destinationType: "guided-learning",
    targetedNeed: "physical-lakes",
    legacyJourneyLaunch: false,
    boundedChildLaunched: true
  });
  expect(trace.childLaunchContract.child.targetIds).toEqual([
    "lake-superior",
    "lake-michigan",
    "lake-huron"
  ]);
  expect(trace.childLaunchContract.child.targetIds).toEqual(trace.childLaunchContract.child.teachingTargetIds);
  expect((await globeState(page)).screen).toBe("study-explore");
  expect(await page.evaluate(() => window.__MAPPA_TEST_API__.getSavedJourneyProgress())).toEqual(journeyBefore);

  await page.evaluate(() => window.__MAPPA_TEST_API__.openStandaloneActivity("us-physical-lakes", "medium"));
  await expect.poll(() => page.evaluate(() => window.__MAPPA_TEST_API__.getGlobeNavigationState().screen)).toBe("free-play");
  await expect(page.locator("#answer-bank .label-chip")).toHaveCount(6);
  expect(await page.evaluate((key) => localStorage.getItem(key), GUIDED_CHILD_LAUNCH_STORAGE_KEY)).toBeNull();
  expect((await page.evaluate(() => window.__MAPPA_TEST_API__.getGuidedLearningOrchestration())).runtime).toBeNull();
});

test("map and search allow lateral region changes without requiring Back", async ({ page }, testInfo) => {
  await startPrototype(page);
  if (testInfo.project.name.includes("mobile")) {
    await chooseSearchScope(page, "Europe");
  } else {
    await chooseMapScope(page, "europe", { coordinate: [22, 50] });
  }
  await expect(page.locator("#poc-title")).toHaveText("Europe");
  const globeSelectedEurope = await globeState(page);
  expect(globeSelectedEurope.visualStates.filter(({ selected }) => selected)).toEqual([]);
  expect(globeSelectedEurope.visualStates.every(({ id }) => getVisualOpacity(globeSelectedEurope, id) === 0)).toBe(true);
  expect(globeSelectedEurope.childIds).toHaveLength(39);
  expect(globeSelectedEurope.childIds).toEqual(expect.arrayContaining(["germany", "france", "italy", "netherlands"]));

  await chooseSearchScope(page, "France");
  await expect(page.locator("#poc-title")).toHaveText("France");
  expect((await globeState(page)).visualStates.filter(({ selected }) => selected).map(({ id }) => id)).toEqual(["france"]);

  if (testInfo.project.name.includes("mobile")) {
    await page.getByRole("button", { name: "Zoom out" }).tap();
    await expect.poll(async () => (await globeState(page)).camera.zoom).toBeLessThan(3.7);
  }
  await chooseMapScope(page, "germany", {
    checkHover: testInfo.project.name.includes("desktop"),
    useTouch: testInfo.project.name.includes("mobile")
  });
  await expect(page.locator("#poc-title")).toHaveText("Germany");
  await expect(page.locator("#globe-navigation-hover-name")).toBeHidden();
  expect((await globeState(page)).scopeId).toBe("germany");

  await chooseSearchScope(page, "France");
  await chooseSearchScope(page, "Italy");
  await expect(page.locator("#poc-title")).toHaveText("Italy");

  if (testInfo.project.name.includes("desktop")) {
    for (const scopeId of ["france", "italy", "netherlands"]) {
      await chooseSearchScope(page, "Europe");
      await chooseMapScope(page, scopeId);
      expect((await globeState(page)).scopeId).toBe(scopeId);
    }
  }

  await chooseSearchScope(page, "France");
  await chooseSearchScope(page, "United States", "united");
  await expect(page.locator("#poc-title")).toHaveText("United States");
  expect((await globeState(page)).path.map(({ label }) => label)).toEqual(["World", "North America", "United States"]);
  expect((await globeState(page)).visualStates.filter(({ selected }) => selected).map(({ id }) => id)).toEqual(["united-states"]);

  await chooseSearchScope(page, "Europe");
  const search = page.getByRole("combobox", { name: "Find a place" });
  expect((await globeState(page)).childIds).toEqual(globeSelectedEurope.childIds);

  await search.fill("lands");
  await expect(page.locator("#globe-navigation-find-options").getByRole("option", { name: "Netherlands" })).toBeVisible();
  await page.locator("#globe-navigation-find-options").getByRole("option", { name: "Netherlands" }).click();
  await expect(page.locator("#poc-title")).toHaveText("Netherlands");
  await expect(page.locator("#globe-navigation-status")).toContainText("Learning content for Netherlands is coming later");
  await expect(page.locator("#globe-navigation-learn-button")).toBeHidden();
  await expect(page.getByRole("button", { name: "Use current menu" })).toBeVisible();

  await search.fill("Atlantis");
  await expect(page.locator("#globe-navigation-find-options")).toContainText("No geographic place found.");
  await expect(page.locator("#globe-navigation-find-options").getByRole("option")).toHaveCount(0);
  expect((await globeState(page)).scopeId).toBe("netherlands");
});

test("selectability stays visually neutral until one scope is focused, hovered, or selected", async ({ page }) => {
  await startPrototype(page);
  const search = page.getByRole("combobox", { name: "Find a place" });

  await search.fill("France");
  const franceOption = page.locator("#globe-navigation-find-options").getByRole("option", { name: "France" });
  await franceOption.focus();
  let state = await globeState(page);
  expect(state.visualStates.filter(({ hovered }) => hovered).map(({ id }) => id)).toEqual(["france"]);
  expect(getVisualOpacity(state, "france")).toBeGreaterThan(0);
  expect(getVisualOpacity(state, "germany")).toBe(0);

  await search.focus();
  await expect.poll(async () => (
    (await globeState(page)).visualStates.filter(({ hovered }) => hovered).map(({ id }) => id)
  )).toEqual([]);

  await search.fill("Germany");
  const germanyOption = page.locator("#globe-navigation-find-options").getByRole("option", { name: "Germany" });
  await germanyOption.focus();
  state = await globeState(page);
  expect(state.visualStates.filter(({ hovered }) => hovered).map(({ id }) => id)).toEqual(["germany"]);
  expect(getVisualOpacity(state, "germany")).toBeGreaterThan(0);
  expect(getVisualOpacity(state, "france")).toBe(0);

  await germanyOption.click();
  await expect.poll(async () => (await globeState(page)).scopeId).toBe("germany");
  state = await globeState(page);
  expect(state.visualStates.filter(({ hovered }) => hovered)).toEqual([]);
  expect(state.visualStates.filter(({ selected }) => selected).map(({ id }) => id)).toEqual(["germany"]);
  expect(getVisualOpacity(state, "germany")).toBeGreaterThan(0);
  expect(getVisualOpacity(state, "france")).toBe(0);
});

test("world geometry makes countries across every represented continent honest geographic destinations", async ({ page }, testInfo) => {
  await startPrototype(page);

  if (testInfo.project.name.includes("desktop")) {
    await chooseMapScope(page, "south-america", { coordinate: [-60, -18] });
    await chooseMapScope(page, "country-per");
  } else {
    await chooseSearchScope(page, "Peru", "Peru", "country-per");
  }
  await expect(page.locator("#poc-title")).toHaveText("Peru");
  await expect(page.locator("#globe-navigation-status")).toHaveText("Learning content for Peru is coming later.");
  await expect(page.locator("#globe-navigation-learn-button")).toBeHidden();

  for (const [label, scopeId] of [
    ["Ghana", "country-gha"],
    ["Japan", "country-jpn"],
    ["Romania", "country-rou"],
    ["Mexico", "country-mex"],
    ["Fiji", "country-fji"]
  ]) {
    await chooseSearchScope(page, label, label, scopeId);
    const state = await globeState(page);
    expect(state.scopeId).toBe(scopeId);
    expect(state.learningAvailability).toBe("unavailable");
    await expect(page.locator("#globe-navigation-learn-button")).toBeHidden();
  }

  await chooseSearchScope(page, "Asia");
  await expect(page.locator("#poc-title")).toHaveText("Asia");
  await expect(page.locator("#globe-navigation-path")).toContainText("World");
});

test("every country that exposes Learn passes runtime curriculum and geometry validation", async ({ page }) => {
  await startPrototype(page);
  for (const label of ["United States", "Germany", "France", "Italy"]) {
    await chooseSearchScope(page, label);
    const state = await globeState(page);
    expect(state.learningAvailability).toBe("available");
    expect(state.learningReadiness?.ready).toBe(true);
    expect(state.learningReadiness?.invalidActivities || []).toEqual([]);
    await expect(page.locator("#globe-navigation-learn-button")).toBeVisible();
  }

  await chooseSearchScope(page, "Netherlands");
  expect((await globeState(page)).learningAvailability).toBe("unavailable");
  await expect(page.locator("#globe-navigation-learn-button")).toBeHidden();
});

test("Learn on each supported European country starts its validated learning experience immediately", async ({ page }) => {
  for (const [label, expectedActivityId] of [
    ["Germany", "germany-north-east-political-divisions"],
    ["France", "france-northern-eastern-regions-political-divisions"],
    ["Italy", "italy-northern-regions-political-divisions"]
  ]) {
    await startPrototype(page);
    await chooseSearchScope(page, label);
    await expect(page.getByRole("button", { name: new RegExp(`Learn ${label}`) })).toBeVisible();
    await expect(page.locator(".globe-navigation-primary-support")).toHaveText("Start learning this area");

    await page.getByRole("button", { name: new RegExp(`Learn ${label}`) }).click();
    await expect.poll(
      () => page.evaluate(() => window.__MAPPA_TEST_API__?.getCurrentActivity()?.id),
      { timeout: 20_000 }
    ).toBe(expectedActivityId);
    await expect(page.locator("#globe-navigation-panel")).toBeHidden();
    await expect(page.locator("#app-shell-screen")).toBeHidden();
  }
});

test("the rollback query restores the current menu and direct activity routes still bypass navigation", async ({ page }) => {
  await page.goto("/?test=1&globeNavigation=off");
  await page.locator("#launch-start-button").click();
  await page.evaluate(() => window.__mappaMundiLoadApp());
  if (await page.locator("#launch-screen").isVisible()) await page.locator("#launch-start-button").click();
  await expect(page.locator("#app-shell-title")).toHaveText("Main Menu");
  await expect(page.locator("#globe-navigation-panel")).toBeHidden();

  await page.goto("/?test=1&globeNavigation=on&activity=us-states-01");
  await expect.poll(
    () => page.evaluate(() => window.__MAPPA_TEST_API__?.getCurrentActivity()?.id),
    { timeout: 20_000 }
  ).toBe("us-states-01");
  await expect(page.locator("#globe-navigation-panel")).toBeHidden();
});
