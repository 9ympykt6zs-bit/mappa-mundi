import { expect, test } from "@playwright/test";

async function openMapActivity(page) {
  await page.goto("/?test=1&globeNavigation=off");
  const startButton = page.locator("#launch-start-button");
  await expect(startButton).toBeVisible();
  await startButton.click();
  await page.evaluate(() => window.__mappaMundiLoadApp());
  if (await page.locator("#launch-screen").isVisible()) {
    await startButton.click();
  }
  await expect(page.locator("#app-shell-title")).toHaveText("Main Menu");
  await page.evaluate(() => (
    window.__MAPPA_TEST_API__.openStandaloneActivity("us-states-01", "medium", "sectionOnly")
  ));
  await expect.poll(() => page.evaluate(() => (
    window.__MAPPA_TEST_API__?.getCurrentActivity()?.id
  )), { timeout: 20_000 }).toBe("us-states-01");
  await expect.poll(() => page.evaluate(() => Boolean(
    window.maplibrePocMap?.isStyleLoaded?.() && !window.maplibrePocMap?.isMoving?.()
  )), { timeout: 20_000 }).toBe(true);

  expect(await page.evaluate(() => window.maplibregl.getVersion())).toBe("5.18.0");

  // Let any one-shot activity camera correction finish before testing manual input.
  await page.waitForTimeout(1_200);
  await page.evaluate(() => window.maplibrePocMap.jumpTo({
    center: [-98, 38],
    zoom: 1.2,
    bearing: 0,
    pitch: 0
  }));
  await expect.poll(() => page.evaluate(() => !window.maplibrePocMap.isMoving())).toBe(true);
}

async function getAnchorState(page, clientPoint, coordinate = null) {
  return page.evaluate(({ clientPoint, coordinate }) => {
    const map = window.maplibrePocMap;
    const rect = map.getCanvas().getBoundingClientRect();
    const localPoint = [clientPoint.x - rect.left, clientPoint.y - rect.top];
    const anchorCoordinate = coordinate || map.unproject(localPoint).toArray();
    const projected = map.project(anchorCoordinate);
    return {
      center: map.getCenter().toArray(),
      coordinate: anchorCoordinate,
      point: [projected.x + rect.left, projected.y + rect.top],
      zoom: map.getZoom()
    };
  }, { clientPoint, coordinate });
}

async function getOffCenterMapPoint(page) {
  const box = await page.locator("#map").boundingBox();
  expect(box).not.toBeNull();
  return {
    x: box.x + box.width * 0.58,
    y: box.y + box.height * 0.5
  };
}

async function waitForZoomToSettle(page, initialZoom) {
  await expect.poll(() => page.evaluate(() => window.maplibrePocMap.getZoom()), {
    timeout: 5_000
  }).toBeGreaterThan(initialZoom + 0.05);
  await expect.poll(() => page.evaluate(() => !window.maplibrePocMap.isMoving()), {
    timeout: 5_000
  }).toBe(true);
}

function expectAnchorToRemainAtCursor(after, cursor) {
  expect(Math.hypot(after.point[0] - cursor.x, after.point[1] - cursor.y)).toBeLessThan(5);
}

test("mouse-wheel zoom stays anchored to the cursor on a zoomed-out globe", async ({ page }) => {
  await openMapActivity(page);
  const mapBox = await page.locator("#map").boundingBox();
  expect(mapBox).not.toBeNull();
  await page.mouse.move(mapBox.x + mapBox.width * 0.5, mapBox.y + mapBox.height * 0.5);
  const initialZoom = await page.evaluate(() => window.maplibrePocMap.getZoom());
  await page.mouse.wheel(0, 240);
  await expect.poll(() => page.evaluate(() => window.maplibrePocMap.getZoom()), {
    timeout: 5_000
  }).toBeLessThan(initialZoom - 0.05);
  await expect.poll(() => page.evaluate(() => !window.maplibrePocMap.isMoving()), {
    timeout: 5_000
  }).toBe(true);

  const cursor = await getOffCenterMapPoint(page);
  await page.mouse.move(cursor.x, cursor.y);
  const before = await getAnchorState(page, cursor);

  await page.mouse.wheel(0, -240);
  await waitForZoomToSettle(page, before.zoom);

  const after = await getAnchorState(page, cursor, before.coordinate);
  expectAnchorToRemainAtCursor(after, cursor);
  expect(Math.hypot(
    after.center[0] - before.center[0],
    after.center[1] - before.center[1]
  )).toBeGreaterThan(0.01);

  const centerAfterZoom = after.center;
  await page.waitForTimeout(1_200);
  const settledCenter = await page.evaluate(() => window.maplibrePocMap.getCenter().toArray());
  expect(Math.hypot(
    settledCenter[0] - centerAfterZoom[0],
    settledCenter[1] - centerAfterZoom[1]
  )).toBeLessThan(0.001);

  await page.mouse.move(cursor.x, cursor.y);
  await page.mouse.down();
  await page.mouse.move(cursor.x + 70, cursor.y + 12, { steps: 8 });
  await page.mouse.up();
  await expect.poll(() => page.evaluate(() => !window.maplibrePocMap.isMoving())).toBe(true);
  const centerAfterPan = await page.evaluate(() => window.maplibrePocMap.getCenter().toArray());
  expect(Math.hypot(
    centerAfterPan[0] - settledCenter[0],
    centerAfterPan[1] - settledCenter[1]
  )).toBeGreaterThan(0.01);
});

test("trackpad-like wheel deltas stay anchored without disabling native zoom", async ({ page }) => {
  await openMapActivity(page);
  const cursor = await getOffCenterMapPoint(page);
  await page.mouse.move(cursor.x, cursor.y);
  const before = await getAnchorState(page, cursor);

  for (let index = 0; index < 12; index += 1) {
    await page.mouse.wheel(0, -2);
    await page.waitForTimeout(8);
  }
  await waitForZoomToSettle(page, before.zoom);

  const after = await getAnchorState(page, cursor, before.coordinate);
  expectAnchorToRemainAtCursor(after, cursor);
  expect(await page.evaluate(() => window.maplibrePocMap.scrollZoom.isEnabled())).toBe(true);
  expect(await page.evaluate(() => window.maplibrePocMap.dragPan.isEnabled())).toBe(true);
  expect(await page.evaluate(() => window.maplibrePocMap.touchZoomRotate.isEnabled())).toBe(true);

  const zoomBeforePinchLikeGesture = after.zoom;
  for (let index = 0; index < 12; index += 1) {
    await page.locator("#map canvas").dispatchEvent("wheel", {
      bubbles: true,
      cancelable: true,
      clientX: cursor.x,
      clientY: cursor.y,
      ctrlKey: true,
      deltaMode: 0,
      deltaX: 3,
      deltaY: -2
    });
    await page.waitForTimeout(8);
  }
  await waitForZoomToSettle(page, zoomBeforePinchLikeGesture);
});

test("mobile two-finger pinch zoom remains enabled", async ({ page, context }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile-chromium", "Touch gesture coverage uses the mobile project.");
  await openMapActivity(page);
  const box = await page.locator("#map").boundingBox();
  expect(box).not.toBeNull();
  const center = {
    x: box.x + box.width * 0.5,
    y: box.y + box.height * 0.5
  };
  const zoomBefore = await page.evaluate(() => window.maplibrePocMap.getZoom());
  expect(await page.evaluate(() => window.maplibrePocMap.touchZoomRotate.isEnabled())).toBe(true);

  const cdp = await context.newCDPSession(page);
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [
      { id: 1, x: center.x - 28, y: center.y },
      { id: 2, x: center.x + 28, y: center.y }
    ]
  });
  for (let step = 1; step <= 6; step += 1) {
    const offset = 28 + step * 10;
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [
        { id: 1, x: center.x - offset, y: center.y },
        { id: 2, x: center.x + offset, y: center.y }
      ]
    });
    await page.waitForTimeout(20);
  }
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: []
  });

  await expect.poll(() => page.evaluate(() => window.maplibrePocMap.getZoom()), {
    timeout: 5_000
  }).toBeGreaterThan(zoomBefore + 0.1);
  await expect.poll(() => page.evaluate(() => !window.maplibrePocMap.isMoving()), {
    timeout: 5_000
  }).toBe(true);
});
