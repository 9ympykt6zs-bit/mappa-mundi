import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { MapLibreActivityRunner } from "../src/maplibre/maplibre-activity-runner.js";

const runtimeSource = readFileSync(new URL("../src/maplibre-poc.js", import.meta.url), "utf8");
const runnerSource = readFileSync(new URL("../src/maplibre/maplibre-activity-runner.js", import.meta.url), "utf8");

function getFunctionSource(source, functionName, nextFunctionName) {
  const start = source.indexOf(`function ${functionName}(`);
  const end = source.indexOf(`function ${nextFunctionName}(`, start);
  assert.ok(start >= 0 && end > start, `Unable to inspect ${functionName}`);
  return source.slice(start, end);
}

const pointerUpSource = getFunctionSource(runtimeSource, "handleDocumentPointerUp", "showFloatingChip");
const noDropBranch = pointerUpSource.slice(
  pointerUpSource.indexOf("if (!shouldDrop)"),
  pointerUpSource.indexOf("const selectedFeature")
);
assert.ok(
  noDropBranch.includes("cancelGrabbedAnswer({ clearSelection: false });"),
  "An ordinary chip click must release the grabbed state without clearing selection"
);
assert.ok(
  !pointerUpSource.includes("us-mountain-ranges") && !pointerUpSource.includes("mountain-range"),
  "The interaction release must remain shared across mountain, river, lake, and other placement activities"
);
assert.ok(
  !noDropBranch.includes("placeGrabbedAnswer("),
  "Releasing a selected chip without dragging must not submit an answer"
);

const beginGrabSource = getFunctionSource(runtimeSource, "beginGrabbedAnswer", "handleDocumentPointerMove");
assert.ok(beginGrabSource.includes("runner.setMapDragEnabled(false);"), "Direct chip dragging must retain its existing map-drag lock");

const cancelGrabSource = getFunctionSource(runtimeSource, "cancelGrabbedAnswer", "updateProgress");
assert.ok(cancelGrabSource.includes("runner?.setMapDragEnabled(true);"), "Releasing the chip must restore map panning");
assert.ok(cancelGrabSource.includes("if (shouldClearSelection)"), "Map-drag restoration must support preserving the selected chip");

const targetClickSource = getFunctionSource(runtimeSource, "handleTargetClick", "tryShowFreePlaySelectedMapFeature");
assert.ok(
  targetClickSource.includes("placeGrabbedAnswer(resolvedTargetIds")
    && targetClickSource.includes("keepGrabbedOnIncorrect: true"),
  "Ordinary map clicks must remain placement attempts and retain incorrect selections"
);

const mapDragSourceStart = runnerSource.indexOf("  setMapDragEnabled(isEnabled) {");
const mapDragSourceEnd = runnerSource.indexOf("  setPlacementInteractionState", mapDragSourceStart);
const mapDragSource = runnerSource.slice(mapDragSourceStart, mapDragSourceEnd);
assert.ok(mapDragSource.includes("this.map.dragPan[method]();"), "The shared drag-pan handler must remain enabled after chip selection");
assert.ok(mapDragSource.includes("this.map.boxZoom[method]();"), "The shared box-zoom handler must remain paired with drag state");
assert.ok(!mapDragSource.includes("scrollZoom"), "Chip selection must not disable wheel or gesture zoom");

const horizontalWheelStart = runnerSource.indexOf("  installHorizontalWheelPan() {");
const horizontalWheelEnd = runnerSource.indexOf("  setPlacementInteractionState", horizontalWheelStart);
const horizontalWheelSource = runnerSource.slice(horizontalWheelStart, horizontalWheelEnd);
assert.ok(horizontalWheelStart >= 0 && horizontalWheelEnd > horizontalWheelStart, "Horizontal wheel handling must be installed on the map");
assert.ok(horizontalWheelSource.includes('addEventListener("wheel"'), "Horizontal navigation must use the standard wheel event");
assert.ok(horizontalWheelSource.includes("passive: false"), "Horizontal gestures must be cancelable before browser navigation");
assert.ok(horizontalWheelSource.includes("Math.abs(deltaX) <= Math.abs(deltaY)"), "Vertical and diagonal zoom gestures must remain with MapLibre");
assert.ok(horizontalWheelSource.includes("this.map.panBy([deltaX * deltaScale, 0]"), "Horizontal delta must pan the map without vertical movement");
assert.ok(!horizontalWheelSource.includes("placeGrabbedAnswer("), "Wheel gestures must never submit an answer");

const wheelPans = [];
const wheelRunner = new MapLibreActivityRunner({ maplibregl: null, container: null });
wheelRunner.map = {
  dragPan: { isEnabled: () => true },
  getContainer: () => ({ clientWidth: 800 }),
  panBy: (...args) => wheelPans.push(args)
};
const horizontalEvent = {
  deltaX: 12,
  deltaY: 2,
  deltaMode: 1,
  defaultPrevented: false,
  propagationStopped: false,
  preventDefault() { this.defaultPrevented = true; },
  stopPropagation() { this.propagationStopped = true; }
};
wheelRunner.handleHorizontalWheelPan(horizontalEvent);
assert.deepEqual(wheelPans, [[[192, 0], { duration: 0 }]]);
assert.equal(horizontalEvent.defaultPrevented, true);
assert.equal(horizontalEvent.propagationStopped, true);

const verticalEvent = {
  deltaX: 2,
  deltaY: 12,
  deltaMode: 0,
  defaultPrevented: false,
  preventDefault() { this.defaultPrevented = true; },
  stopPropagation() {}
};
wheelRunner.handleHorizontalWheelPan(verticalEvent);
assert.equal(wheelPans.length, 1, "Vertical wheel movement must remain available for MapLibre zoom");
assert.equal(verticalEvent.defaultPrevented, false);

console.log("Mountain-range placement interaction preserves selection, drag and wheel panning, click placement, drag/drop, and zoom.");
