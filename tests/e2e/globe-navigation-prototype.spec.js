import { expect, test } from "@playwright/test";

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
  await expect(page.getByRole("button", { name: /Learn North America/ })).toBeVisible();
  await expect(page.locator("#globe-navigation-path")).toContainText("World");
  await expect(page.locator("#globe-navigation-path")).toContainText("North America");

  await chooseMapScope(page, "united-states", { useTouch: testInfo.project.name.includes("mobile") });
  await expect(page.locator("#poc-title")).toHaveText("United States");
  await expect(page.getByRole("button", { name: /Learn the United States/ })).toBeVisible();
  await expect(page.getByRole("button", { name: "Choose what to learn" })).toBeVisible();
  expect((await globeState(page)).path.map(({ label }) => label)).toEqual(["World", "North America", "United States"]);

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
  await expect(page.locator("#app-shell-screen")).toBeHidden();
  expect(runtimeErrors).toEqual([]);
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
  expect(globeSelectedEurope.childIds).toHaveLength(39);
  expect(globeSelectedEurope.childIds).toEqual(expect.arrayContaining(["germany", "france", "italy", "netherlands"]));

  await chooseSearchScope(page, "France");
  await expect(page.locator("#poc-title")).toHaveText("France");

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
