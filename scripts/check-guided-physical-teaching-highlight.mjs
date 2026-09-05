import assert from "node:assert/strict";
import { GuidedPhysicalTeachingPulse, guidedPhysicalPulseProgress } from "../src/maplibre/guided-physical-teaching-highlight.js";
import { MapLibreActivityRunner } from "../src/maplibre/maplibre-activity-runner.js";

let now = 0;
let callback = null;
const listeners = new Set();
const media = {
  matches: false,
  addEventListener: (_, listener) => listeners.add(listener),
  removeEventListener: (_, listener) => listeners.delete(listener)
};
const environment = {
  matchMedia: () => media,
  performance: { now: () => now },
  document: { hidden: false },
  setInterval: (fn, interval) => { assert.equal(interval, 90); callback = fn; return 1; },
  clearInterval: () => { callback = null; }
};
const frames = [];
const pulse = new GuidedPhysicalTeachingPulse((state) => frames.push({ ...state }), environment);
pulse.start();
assert.equal(listeners.size, 1);
assert.equal(frames.at(-1).animated, true);
for (now = 90; now <= 1800; now += 90) callback();
assert.equal(guidedPhysicalPulseProgress(0), 0);
assert.equal(guidedPhysicalPulseProgress(900), 1);
assert.equal(guidedPhysicalPulseProgress(1800), 0);
assert.ok(frames.every(({ progress }) => progress >= 0 && progress <= 1));
assert.ok(frames.slice(1).every((frame, index) => Math.abs(frame.progress - frames[index].progress) < 0.16), "The halo changes smoothly rather than blinking.");
environment.document.hidden = true;
const hiddenFrameCount = frames.length;
callback();
assert.equal(frames.length, hiddenFrameCount, "Hidden tabs do no paint work.");
media.matches = true;
listeners.forEach((listener) => listener());
assert.equal(callback, null);
assert.deepEqual(frames.at(-1), { animated: false, reducedMotion: true, progress: 0.5 });
media.matches = false;
listeners.forEach((listener) => listener());
assert.equal(typeof callback, "function");
pulse.stop();
assert.equal(callback, null);
assert.equal(listeners.size, 0);
pulse.start();
pulse.start();
assert.equal(listeners.size, 1, "Changing targets cannot duplicate the media listener.");
pulse.stop();

function evaluate(expression, properties) {
  if (!Array.isArray(expression)) return expression;
  const [op, ...args] = expression;
  const values = () => args.map((arg) => evaluate(arg, properties));
  if (op === "get") return properties[args[0]];
  if (op === "==") return evaluate(args[0], properties) === evaluate(args[1], properties);
  if (op === "coalesce") return values().find((value) => value !== undefined && value !== null);
  if (op === "*") return values().reduce((a, b) => a * b, 1);
  if (op === "max") return Math.max(...values());
  if (op === "case") {
    for (let i = 0; i < args.length - 1; i += 2) if (evaluate(args[i], properties)) return evaluate(args[i + 1], properties);
    return evaluate(args.at(-1), properties);
  }
  throw new Error(`Unexpected expression: ${op}`);
}
const runner = Object.create(MapLibreActivityRunner.prototype);
runner.guidedPhysicalTeachingPulseState = { progress: 0 };
for (const family of ["mountain-range", "river", "lake"]) {
  runner.guidedPhysicalTeachingHighlight = { targetId: "target", family };
  const opacity = family === "mountain-range" ? runner.getMountainRangeSymbolOpacityExpression()
    : family === "river" ? runner.getRiverLineOpacityExpression() : runner.getShapeFillOpacityExpression();
  const target = { id: "target", targetId: "target" };
  const other = { id: "other", targetId: "other" };
  assert.ok(evaluate(opacity, target) >= 0.9, `${family} remains strongly visible without animation.`);
  assert.ok(evaluate(opacity, other) <= 0.3, `${family} context remains secondary.`);
  if (family === "mountain-range") {
    assert.equal(evaluate(runner.getMountainRangeSymbolGlowOpacityExpression(), target), 0.72);
    runner.guidedPhysicalTeachingPulseState.progress = 1;
    assert.equal(evaluate(runner.getMountainRangeSymbolGlowOpacityExpression(), target), 0.72, "Authored glow remains static; only the outer halo pulses.");
    assert.equal(evaluate(runner.getMountainRangeSymbolOpacityExpression(), target), 1, "The target itself never pulses off.");
  }
}
const transitioningRunner = Object.create(MapLibreActivityRunner.prototype);
Object.assign(transitioningRunner, {
  activity: { targets: [{ id: "black-hills", type: "mountain-range" }] },
  currentView: "study",
  guidedPhysicalStudyReady: false,
  refreshStudyPaint() {},
  refreshGuidedPhysicalTeachingHaloLayers() {},
  refreshGuidedPhysicalTeachingPulsePaint() {}
});
transitioningRunner.setGuidedPhysicalTeachingHighlight({ targetId: "black-hills" });
assert.equal(transitioningRunner.guidedPhysicalTeachingPulse.timer, null, "An old study view cannot start the next activity pulse before its layers are ready.");
transitioningRunner.clearGuidedPhysicalTeachingHighlight();
transitioningRunner.guidedPhysicalStudyReady = true;
transitioningRunner.setGuidedPhysicalTeachingHighlight({ targetId: "black-hills" });
assert.equal(transitioningRunner.getGuidedPhysicalTeachingHighlightState().animated, true);
transitioningRunner.clearGuidedPhysicalTeachingHighlight();
assert.equal(transitioningRunner.getGuidedPhysicalTeachingHighlightState().animated, false);
let haloInstalled = false;
let onHaloIdle;
transitioningRunner.map = {
  getLayer: () => haloInstalled,
  addLayer: (layer, before) => {
    assert.equal(layer.id, "guided-physical-mountain-halo");
    assert.equal(before, "mountain-range-symbol-glow");
    haloInstalled = true;
  },
  once: (event, callback) => { assert.equal(event, "idle"); onHaloIdle = callback; }
};
transitioningRunner.setGuidedPhysicalTeachingHighlight({ targetId: "black-hills" });
assert.equal(haloInstalled, true);
assert.equal(transitioningRunner.guidedPhysicalTeachingPulse.timer, null, "A newly installed halo must settle before animation starts.");
onHaloIdle();
assert.notEqual(transitioningRunner.guidedPhysicalTeachingPulse.timer, null);
transitioningRunner.clearGuidedPhysicalTeachingHighlight();
onHaloIdle();
assert.equal(transitioningRunner.guidedPhysicalTeachingPulse, null, "A stale layer-ready callback cannot restart a cleared pulse.");
const paints = {};
runner.map = {
  getLayer: () => true,
  setPaintProperty: (id, property, value) => { paints[`${id}:${property}`] = value; }
};
runner.guidedPhysicalTeachingHighlight = { targetId: "target", family: "mountain-range" };
runner.guidedPhysicalTeachingPulseState.progress = 0;
runner.refreshGuidedPhysicalTeachingPulsePaint();
assert.equal(paints["guided-physical-mountain-halo:circle-radius"], 14);
assert.equal(paints["guided-physical-mountain-halo:circle-opacity"], 0.12);
runner.guidedPhysicalTeachingPulseState.progress = 1;
runner.refreshGuidedPhysicalTeachingPulsePaint();
assert.equal(paints["guided-physical-mountain-halo:circle-radius"], 34);
assert.equal(paints["guided-physical-mountain-halo:circle-opacity"], 0.7);
assert.equal(paints["mountain-range-symbol:icon-opacity"], undefined, "Animation never changes the geographic glyph itself.");
console.log("Guided physical teaching highlight and pulse lifecycle validation passed.");
