import assert from 'node:assert/strict';
import { fitReconstructionViewport as fit, zoomReconstructionViewport as zoom, panReconstructionViewport as pan } from '../src/atlas/map-reconstruction-viewport.js';
for (const viewport of [{width:320,height:400},{width:700,height:500},{width:1200,height:600}]) {
  for (const bounds of [{minX:100,minY:70,maxX:250,maxY:450},{minX:-80,minY:20,maxX:1100,maxY:700}]) {
    const home = fit(bounds, viewport);
    assert.ok(home.x < bounds.minX && home.y < bounds.minY);
    assert.ok(home.x + home.width > bounds.maxX && home.y + home.height > bounds.maxY);
    assert.ok(Math.abs(home.width / home.height - viewport.width / viewport.height) < 1e-10);
    const anchor = {x:home.x + home.width * .3,y:home.y + home.height * .6};
    const close = zoom(home,2,anchor,home);
    assert.ok(Math.abs((anchor.x-close.x)/close.width-.3)<1e-10);
    assert.ok(Math.abs((anchor.y-close.y)/close.height-.6)<1e-10);
    const moved = pan(close,30,-20,viewport);
    assert.equal(moved.x, close.x-30*close.width/viewport.width);
    assert.equal(moved.y, close.y+20*close.height/viewport.height);
    assert.equal(zoom(home,1e10,anchor,home).width,home.width/8);
    assert.equal(zoom(home,1e-10,anchor,home).width,home.width*4);
  }
}
console.log('Reconstruction viewport fit, zoom anchors, limits and pan checks passed.');
