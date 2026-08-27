import { expect, test } from "@playwright/test";

async function startPrototype(page, query = "?test=1&globeNavigation=on") {
  await page.goto(`/${query}`);
  await expect(page.locator("#launch-screen")).toBeVisible();
  await page.locator("#launch-start-button").click();
  await page.evaluate(() => window.__mappaMundiLoadApp());
  if (await page.locator("#launch-screen").isVisible()) {
    await page.locator("#launch-start-button").click();
  }
  await expect(page.locator("#globe-navigation-panel")).toBeVisible({ timeout: 20_000 });
}

async function globeState(page) {
  return page.evaluate(() => window.__MAPPA_TEST_API__.getGlobeNavigationState());
}

async function chooseMapScope(page, scopeId, { checkHover = false } = {}) {
  const state = await globeState(page);
  const point = state.childMapPoints[scopeId];
  expect(point).toBeTruthy();
  const mapBox = await page.locator("#map").boundingBox();
  expect(mapBox).not.toBeNull();

  await page.mouse.move(mapBox.x + point.x, mapBox.y + point.y);
  if (checkHover) {
    const expectedLabel = scopeId === "north-america" ? "North America" : scopeId;
    await expect(page.locator("#globe-navigation-hover-name")).toHaveText(expectedLabel);
  }
  await page.mouse.click(mapBox.x + point.x, mapBox.y + point.y);
  await expect.poll(async () => (await globeState(page)).scopeId).toBe(scopeId);
}

async function chooseSearchScope(page, label, query = label) {
  const search = page.getByRole("combobox", { name: "Find a place" });
  await search.fill(query);
  await page.locator("#globe-navigation-find-options").getByRole("option", { name: label }).click();
  await expect.poll(async () => (await globeState(page)).scopeId).toBe(label.toLowerCase().replaceAll(" ", "-"));
}

test("globe-first launch drills from World to the existing U.S. objective screen and back", async ({ page }, testInfo) => {
  const runtimeErrors = [];
  page.on("pageerror", (error) => runtimeErrors.push(`pageerror: ${error.message}`));
  page.on("console", (message) => {
    if (message.type() === "error") runtimeErrors.push(`console: ${message.text()}`);
  });

  await startPrototype(page);
  await expect(page.locator("#poc-title")).toHaveText("Where do you want to learn?");
  await expect(page.locator("#poc-instruction")).toHaveText("Choose a continent on the globe.");
  await expect(page.getByRole("button", { name: "Learn the Continents" })).toBeVisible();
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
      actions: actions.getBoundingClientRect().toJSON()
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
  expect(new Set(worldState.renderedFeatureIds)).toEqual(new Set(worldState.childIds));

  await page.getByRole("button", { name: "Learn the Continents" }).click();
  await expect.poll(
    () => page.evaluate(() => window.__MAPPA_TEST_API__?.getCurrentActivity()?.id),
    { timeout: 20_000 }
  ).toBe("continents-oceans");
  await page.locator("#back-button").click();
  await expect(page.locator("#poc-title")).toHaveText("Where do you want to learn?");

  if (testInfo.project.name.includes("mobile")) {
    await chooseSearchScope(page, "North America", "north");
  } else {
    await chooseMapScope(page, "north-america", { checkHover: true });
  }
  await expect(page.locator("#poc-title")).toHaveText("North America");
  await expect(page.getByRole("button", { name: "Learn North America" })).toBeVisible();
  await expect(page.locator("#globe-navigation-path")).toContainText("World");
  await expect(page.locator("#globe-navigation-path")).toContainText("North America");

  if (testInfo.project.name.includes("mobile")) {
    await chooseSearchScope(page, "United States", "united");
  } else {
    await chooseMapScope(page, "united-states");
  }
  await expect(page.locator("#poc-title")).toHaveText("United States");
  await expect(page.getByRole("button", { name: "Learn the United States" })).toBeVisible();
  expect((await globeState(page)).path.map(({ label }) => label)).toEqual(["World", "North America", "United States"]);

  await page.getByRole("button", { name: "Learn the United States" }).click();
  await expect(page.locator("#app-shell-title")).toHaveText("Across the United States");
  await expect(page.locator(".us-objective-title")).toHaveText([
    "Learn States & Capitals",
    "Learn Physical Features",
    "Learn Connections",
    "Explore the United States"
  ]);

  await page.locator("#app-shell-back-button").click();
  await expect(page.locator("#poc-title")).toHaveText("United States");
  await page.locator("#back-button").click();
  await expect(page.locator("#poc-title")).toHaveText("North America");
  await page.locator("#back-button").click();
  await expect(page.locator("#poc-title")).toHaveText("Where do you want to learn?");
  expect(runtimeErrors).toEqual([]);
});

test("place search uses the same scopes as globe selection and keeps unsupported names honest", async ({ page }) => {
  await startPrototype(page);
  await chooseMapScope(page, "europe");
  await expect(page.locator("#poc-title")).toHaveText("Europe");
  const globeSelectedEurope = await globeState(page);
  expect(globeSelectedEurope.childIds).toEqual(["germany", "france", "italy", "netherlands"]);

  await page.locator("#globe-navigation-path").getByRole("button", { name: "World" }).click();
  const search = page.getByRole("combobox", { name: "Find a place" });
  await search.fill("EUR");
  await expect(page.locator("#globe-navigation-find-options").getByRole("option", { name: "Europe" })).toBeVisible();
  await page.locator("#globe-navigation-find-options").getByRole("option", { name: "Europe" }).click();
  await expect.poll(async () => (await globeState(page)).scopeId).toBe("europe");
  expect((await globeState(page)).childIds).toEqual(globeSelectedEurope.childIds);

  await search.fill("lands");
  await expect(page.locator("#globe-navigation-find-options").getByRole("option", { name: "Netherlands" })).toBeVisible();
  await page.locator("#globe-navigation-find-options").getByRole("option", { name: "Netherlands" }).click();
  await expect(page.locator("#poc-title")).toHaveText("Netherlands");
  await expect(page.locator("#globe-navigation-status")).toContainText("Learning content coming later");
  await expect(page.locator("#globe-navigation-learn-button")).toBeHidden();
  await expect(page.getByRole("button", { name: "Use current menu" })).toBeVisible();

  await search.fill("Atlantis");
  await expect(page.locator("#globe-navigation-find-options")).toContainText("No available learning area found.");
  await expect(page.locator("#globe-navigation-find-options").getByRole("option")).toHaveCount(0);
  expect((await globeState(page)).scopeId).toBe("netherlands");
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
