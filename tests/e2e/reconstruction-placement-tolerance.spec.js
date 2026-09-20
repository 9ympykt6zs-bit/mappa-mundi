import { expect, test } from "@playwright/test";

async function createRegionalFixture(page, { placeFirstPiece = true } = {}) {
  await page.goto("/?test=1");
  await page.evaluate(async () => {
    const {
      getGuidedReconstructionRegion,
      prepareGuidedReconstructionGeometry,
      GUIDED_RECONSTRUCTION_CHECKPOINTS
    } = await import("/src/guided-reconstruction.js");
    const { createMapReconstructionActivity } = await import(
      "/src/atlas/map-reconstruction-ui.js"
    );
    const region = getGuidedReconstructionRegion(
      GUIDED_RECONSTRUCTION_CHECKPOINTS[1].regionId
    );
    const features = await fetch(
      "/assets/maps/data/maplibre-us-states-atlas.geojson"
    ).then((response) => response.json());
    const geometry = prepareGuidedReconstructionGeometry(features, region);
    document.body.innerHTML = '<main id="placement-tolerance-test" style="height:100dvh"></main>';
    window.placementToleranceGeometry = geometry;
    window.placementToleranceActivity = createMapReconstructionActivity(
      document.querySelector("main"),
      {
        region,
        geometry,
        lockedStateIds: region.lockedStateIds,
        random: () => 0.5
      }
    );
  });
  await expect(page.locator(".map-reconstruction-workspace")).toBeVisible();
  if (placeFirstPiece) {
    await page.locator(".map-reconstruction-bank-piece").first().press("Enter");
  }
}

async function getBankPieceDragMetrics(page, offsetCssPixels = 0) {
  return page.locator(".map-reconstruction-bank-piece").first().evaluate(async (button, offset) => {
    const { isPointInMapReconstructionPiece } = await import(
      "/src/atlas/map-reconstruction-geometry.js"
    );
    const stateId = button.dataset.mapReconstructionBankStateId;
    const piece = window.placementToleranceGeometry.piecesById[stateId];
    const path = button.querySelector("path");
    const pathMatrix = path.getScreenCTM();
    const bounds = piece.localBounds;
    let localPoint = null;
    for (let row = 1; row < 30 && !localPoint; row += 1) {
      for (let column = 1; column < 30; column += 1) {
        const candidate = {
          x: bounds.minX + (bounds.maxX - bounds.minX) * column / 30,
          y: bounds.minY + (bounds.maxY - bounds.minY) * row / 30
        };
        const client = new DOMPoint(candidate.x, candidate.y).matrixTransform(pathMatrix);
        if (
          isPointInMapReconstructionPiece(piece, candidate)
          && document.elementFromPoint(client.x, client.y) === path
        ) {
          localPoint = candidate;
          break;
        }
      }
    }
    if (!localPoint) throw new Error(`No draggable point found for ${stateId}.`);
    const workspace = document.querySelector(".map-reconstruction-workspace");
    const transform = (matrix, point) => new DOMPoint(
      point.x,
      point.y
    ).matrixTransform(matrix);
    const target = transform(workspace.getScreenCTM(), {
      x: localPoint.x + piece.correctPosition.x,
      y: localPoint.y + piece.correctPosition.y
    });
    return {
      stateId,
      current: transform(pathMatrix, localPoint),
      target: { x: target.x + offset, y: target.y },
      correctPosition: piece.correctPosition
    };
  }, offsetCssPixels);
}

async function getPlacedPieceMetrics(page) {
  return page.locator(
    ".map-reconstruction-learner-layer [data-map-reconstruction-state-id]"
  ).first().evaluate(async (group) => {
    const { isPointInMapReconstructionPiece } = await import(
      "/src/atlas/map-reconstruction-geometry.js"
    );
    const workspace = group.ownerSVGElement;
    const stateId = group.dataset.mapReconstructionStateId;
    const piece = window.placementToleranceGeometry.piecesById[stateId];
    const pieceState = window.placementToleranceActivity.getState().piecesById[stateId];
    const bounds = piece.localBounds;
    let localPoint = null;
    for (let row = 1; row < 20 && !localPoint; row += 1) {
      for (let column = 1; column < 20; column += 1) {
        const point = {
          x: bounds.minX + (bounds.maxX - bounds.minX) * column / 20,
          y: bounds.minY + (bounds.maxY - bounds.minY) * row / 20
        };
        if (isPointInMapReconstructionPiece(piece, point)) {
          localPoint = point;
          break;
        }
      }
    }
    const matrix = workspace.getScreenCTM();
    const toClient = (position) => new DOMPoint(
      localPoint.x + position.x,
      localPoint.y + position.y
    ).matrixTransform(matrix);
    return {
      stateId,
      current: toClient(pieceState.position),
      correct: toClient(piece.correctPosition),
      correctPosition: piece.correctPosition,
      matrix: { a: matrix.a, b: matrix.b, c: matrix.c, d: matrix.d, e: matrix.e, f: matrix.f }
    };
  });
}

async function dragPiece(page, from, to) {
  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  await page.mouse.move(to.x, to.y, { steps: 6 });
  await page.mouse.up();
}

async function touchDrag(page, from, to) {
  const session = await page.context().newCDPSession(page);
  await session.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ x: from.x, y: from.y, id: 0 }]
  });
  await session.send("Input.dispatchTouchEvent", {
    type: "touchMove",
    touchPoints: [{ x: to.x, y: to.y, id: 0 }]
  });
  await session.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: []
  });
}

async function expectCanonicalPosition(page, stateId, correctPosition) {
  await expect.poll(() => page.evaluate((id) => (
    window.placementToleranceActivity.getState().piecesById[id].position
  ), stateId)).toEqual(correctPosition);
  await page.evaluate(() => new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(resolve));
  }));
  await page.waitForTimeout(120);
}

async function getCurrentErrorCssPixels(page, stateId) {
  return page.evaluate(async (id) => {
    const { getMapReconstructionTranslationErrorCssPixels } = await import(
      "/src/atlas/map-reconstruction-placement-tolerance.js"
    );
    const workspace = document.querySelector(".map-reconstruction-workspace");
    const piece = window.placementToleranceGeometry.piecesById[id];
    const position = window.placementToleranceActivity.getState().piecesById[id].position;
    return getMapReconstructionTranslationErrorCssPixels(
      position,
      piece.correctPosition,
      workspace.getScreenCTM()
    );
  }, stateId);
}

test("accepted placement commits canonical state before animation and survives teardown @us-critical-path", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === "mobile-chromium", "The lifecycle race is pointer-type independent.");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await createRegionalFixture(page, { placeFirstPiece: false });

  const metrics = await getBankPieceDragMetrics(page, 20);
  await dragPiece(page, metrics.current, metrics.target);

  const immediate = await page.evaluate((stateId) => (
    window.placementToleranceActivity.getState().piecesById[stateId]
  ), metrics.stateId);
  expect(immediate).toMatchObject({
    position: metrics.correctPosition,
    placementStatus: "placed"
  });

  await page.evaluate(() => window.placementToleranceActivity.destroy());
  await page.waitForTimeout(140);
  const afterTeardown = await page.evaluate((stateId) => (
    window.placementToleranceActivity.getState().piecesById[stateId]
  ), metrics.stateId);
  expect(afterTeardown.position).toEqual(metrics.correctPosition);
});

test("mouse placement tolerance stays in CSS pixels after map pan and zoom @us-critical-path", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === "mobile-chromium", "Mouse/trackpad tolerance uses the desktop pointer path.");
  await createRegionalFixture(page);

  let metrics = await getPlacedPieceMetrics(page);
  await dragPiece(page, metrics.current, {
    x: metrics.correct.x + 31.5,
    y: metrics.correct.y
  });
  await expectCanonicalPosition(page, metrics.stateId, metrics.correctPosition);

  metrics = await getPlacedPieceMetrics(page);
  await dragPiece(page, metrics.current, {
    x: metrics.correct.x + 32.5,
    y: metrics.correct.y
  });
  expect(await getCurrentErrorCssPixels(page, metrics.stateId)).toBeGreaterThan(32);

  metrics = await getPlacedPieceMetrics(page);
  await dragPiece(page, metrics.current, metrics.correct);
  await expectCanonicalPosition(page, metrics.stateId, metrics.correctPosition);

  const workspace = page.locator(".map-reconstruction-workspace");
  const metricsBeforeNavigation = await getPlacedPieceMetrics(page);
  const viewBeforeNavigation = await workspace.getAttribute("viewBox");
  await page.getByRole("button", { name: "Zoom in", exact: true }).click();
  await expect.poll(() => workspace.getAttribute("viewBox")).not.toBe(viewBeforeNavigation);
  const viewAfterZoom = await workspace.getAttribute("viewBox");
  const blankPoint = await workspace.evaluate((svg) => {
    const rect = svg.getBoundingClientRect();
    for (let row = 1; row < 10; row += 1) {
      for (let column = 1; column < 10; column += 1) {
        const x = rect.left + rect.width * column / 10;
        const y = rect.top + rect.height * row / 10;
        if (document.elementFromPoint(x, y) === svg) return { x, y };
      }
    }
    return null;
  });
  expect(blankPoint).toBeTruthy();
  await page.mouse.move(blankPoint.x, blankPoint.y);
  await page.mouse.down();
  await page.mouse.move(blankPoint.x + 45, blankPoint.y + 25, { steps: 5 });
  await page.mouse.up();
  await expect.poll(() => workspace.getAttribute("viewBox")).not.toBe(viewAfterZoom);
  const metricsAfterNavigation = await getPlacedPieceMetrics(page);
  expect(Math.hypot(
    metricsAfterNavigation.correct.x - metricsBeforeNavigation.correct.x,
    metricsAfterNavigation.correct.y - metricsBeforeNavigation.correct.y
  )).toBeGreaterThan(1);

  metrics = await getPlacedPieceMetrics(page);
  await dragPiece(page, metrics.current, {
    x: metrics.correct.x + 31.5,
    y: metrics.correct.y
  });
  await expectCanonicalPosition(page, metrics.stateId, metrics.correctPosition);

  metrics = await getPlacedPieceMetrics(page);
  await dragPiece(page, metrics.current, {
    x: metrics.correct.x + 32.5,
    y: metrics.correct.y
  });
  expect(await getCurrentErrorCssPixels(page, metrics.stateId)).toBeGreaterThan(32);

  const freshPiece = await getBankPieceDragMetrics(page, 20);
  await dragPiece(page, freshPiece.current, freshPiece.target);
  await expectCanonicalPosition(page, freshPiece.stateId, freshPiece.correctPosition);
});

test("touch placement uses the larger CSS-pixel tolerance", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile-chromium", "Touch tolerance uses the mobile pointer path.");
  await createRegionalFixture(page);
  await page.getByRole("button", { name: "Zoom in", exact: true }).click();

  let metrics = await getPlacedPieceMetrics(page);
  await touchDrag(page, metrics.current, {
    x: metrics.correct.x + 39.5,
    y: metrics.correct.y
  });
  await expectCanonicalPosition(page, metrics.stateId, metrics.correctPosition);

  metrics = await getPlacedPieceMetrics(page);
  await touchDrag(page, metrics.current, {
    x: metrics.correct.x + 40.5,
    y: metrics.correct.y
  });
  expect(await getCurrentErrorCssPixels(page, metrics.stateId)).toBeGreaterThan(40);
});
