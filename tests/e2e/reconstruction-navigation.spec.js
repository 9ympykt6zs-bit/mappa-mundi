import { test, expect } from '@playwright/test';
import { GUIDED_RECONSTRUCTION_CHECKPOINTS as checkpoints } from '../../src/guided-reconstruction.js';

// Exercise the production UI/geometry directly so camera checks can inspect world coordinates.
for (const index of [1, 9]) {
  const criticalPathTag = index === 1 ? " @us-critical-path" : "";
  test(`Reconstruction ${index + 1} framing and transformed placement${criticalPathTag}`, async ({page}) => {
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  const originalSize = page.viewportSize();
  await page.goto('/?test=1');
  await page.evaluate(async (index) => {
    const { getGuidedReconstructionRegion, prepareGuidedReconstructionGeometry, GUIDED_RECONSTRUCTION_CHECKPOINTS } = await import('/src/guided-reconstruction.js');
    const { createMapReconstructionActivity } = await import('/src/atlas/map-reconstruction-ui.js');
    const region = getGuidedReconstructionRegion(GUIDED_RECONSTRUCTION_CHECKPOINTS[index].regionId);
    const features = await fetch('/assets/maps/data/maplibre-us-states-atlas.geojson').then(r=>r.json());
    const geometry = prepareGuidedReconstructionGeometry(features, region);
    document.body.innerHTML = '<main id="camera-test" style="height:100dvh"></main>';
    window.cameraGeometry = geometry;
    window.cameraActivity = createMapReconstructionActivity(document.querySelector('main'), {region,geometry,lockedStateIds:region.lockedStateIds,random:()=>0.5});
  }, index);
  const svg = page.locator('.map-reconstruction-workspace');
  await expect(svg).toBeVisible();
  const view = () => svg.getAttribute('viewBox');
  for (const width of [390, 768, 1440]) {
    await page.setViewportSize({width,height:900});
    await expect.poll(()=>page.evaluate(()=> {
      const view = document.querySelector('.map-reconstruction-workspace').viewBox.baseVal;
      const b = window.cameraGeometry.combinedBounds;
      return view.x < b.minX && view.y < b.minY && view.x+view.width>b.maxX && view.y+view.height>b.maxY;
    })).toBe(true);
  }
  await page.setViewportSize(originalSize);
  await page.getByRole('button',{name:'Fit map',exact:true}).click();
  const home = await view();
  await page.getByRole('button',{name:'Zoom in',exact:true}).click();
  expect(await view()).not.toBe(home);
  const box = await svg.boundingBox();
  await page.mouse.move(box.x+8,box.y+8);
  await page.mouse.down();
  await page.mouse.move(box.x+50,box.y+35,{steps:5});
  await page.mouse.up();
  const panned = await view();
  const cdp = await page.context().newCDPSession(page);
  const touch = (type, points) => cdp.send('Input.dispatchTouchEvent', {type, touchPoints:points.map(([x,y],id)=>({x,y,id}))});
  await touch('touchStart', [[box.x+10,box.y+10],[box.x+100,box.y+10]]);
  await touch('touchMove', [[box.x+10,box.y+10],[box.x+150,box.y+20]]);
  await touch('touchEnd', []);
  expect(await view()).not.toBe(panned);
  await page.mouse.move(box.x+80,box.y+80);
  const pinched = await view();
  await page.mouse.wheel(0,150);
  await expect.poll(view).not.toBe(pinched);
  const navigated = await view();
  await page.locator('.map-reconstruction-bank-piece').first().press('Enter');
  expect(await view()).toBe(navigated);
  const group = page.locator('.map-reconstruction-learner-layer [data-map-reconstruction-state-id]').first();
  const before = await group.getAttribute('transform');
  // Resolve a guaranteed interior point, then convert through the actual transformed SVG CTM.
  const point = await group.evaluate(async node => {
    const {isPointInMapReconstructionPiece} = await import('/src/atlas/map-reconstruction-geometry.js');
    const piece=window.cameraGeometry.piecesById[node.dataset.mapReconstructionStateId];
    const b=piece.localBounds;
    for(let y=b.minY;y<b.maxY;y+=(b.maxY-b.minY)/30) for(let x=b.minX;x<b.maxX;x+=(b.maxX-b.minX)/30) {
      if(isPointInMapReconstructionPiece(piece,{x,y})) {
        const p=new DOMPoint(x,y).matrixTransform(node.getScreenCTM());
        const r=node.ownerSVGElement.getBoundingClientRect();
        if(p.x>r.left+10&&p.x<r.right-30&&p.y>r.top+10&&p.y<r.bottom-30)return {x:p.x,y:p.y};
      }
    }
  });
  expect(point).toBeTruthy();
  // A second finger over the map cannot take ownership of a piece gesture.
  await touch('touchStart', [[point.x,point.y]]);
  await touch('touchStart', [[point.x,point.y],[box.x+15,box.y+15]]);
  await touch('touchMove', [[point.x,point.y],[box.x+60,box.y+35]]);
  expect(await view()).toBe(navigated);
  await touch('touchEnd', []);
  await page.mouse.move(point.x,point.y);await page.mouse.down();
  await page.mouse.move(point.x+20,point.y+12,{steps:5});await page.mouse.up();
  expect(await group.getAttribute('transform')).not.toBe(before);
  expect(await view()).toBe(navigated);
  const thumbnail = page.locator('.map-reconstruction-bank-thumbnail').first();
  const bankBox = await thumbnail.boundingBox();
  await page.mouse.move(bankBox.x+bankBox.width/2, bankBox.y+bankBox.height/2);
  await page.mouse.down();
  await page.mouse.move(box.x+box.width*.6,box.y+box.height*.6,{steps:8});
  await page.mouse.up();
  await expect(page.locator('.map-reconstruction-learner-layer [data-map-reconstruction-state-id]')).toHaveCount(2);
  expect(await view()).toBe(navigated);
  await page.getByRole('button',{name:'Submit',exact:true}).click();
  // Mobile result controls change the SVG height: preserve center and horizontal span.
  const [x,y,width,height] = navigated.split(' ').map(Number);
  const resultView = (await view()).split(' ').map(Number);
  expect(resultView[0]).toBeCloseTo(x,5);
  expect(resultView[2]).toBeCloseTo(width,5);
  expect(resultView[1]+resultView[3]/2).toBeCloseTo(y+height/2,5);
  const state = await page.evaluate(()=>window.cameraActivity.getState());
  expect(state.phase).toBe('result');
  expect(Object.keys(state.evaluation.placements).sort()).toEqual([...checkpoints[index].stateIds].sort());
  await page.screenshot({path:`/tmp/reconstruction-navigation-${index+1}.png`});
  await page.evaluate(()=>window.cameraActivity.reset());
  expect(await view()).toBe(home);
  expect(errors).toEqual([]);
  });
}
