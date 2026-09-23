import assert from "node:assert/strict";
import {
  createGlobeHubHistoryState,
  createGlobeHubNavigationController,
  readGlobeHubHistoryState,
  resolveGlobeHubContinueTarget,
  wrapGlobeHubHistoryState
} from "../src/globe-hub-navigation.js";

const globe = createGlobeHubHistoryState({ surface: "globe", globeScopeId: "united-states" });
assert.deepEqual(globe, {
  version: 1,
  surface: "globe",
  globeScopeId: "united-states",
  destinationId: "",
  returnScopeId: ""
});

const destination = createGlobeHubHistoryState({
  surface: "destination",
  globeScopeId: "united-states",
  destinationId: "atlas:united-states",
  returnScopeId: "united-states"
});
assert.equal(readGlobeHubHistoryState(wrapGlobeHubHistoryState(destination))?.destinationId, "atlas:united-states");
assert.equal(readGlobeHubHistoryState(wrapGlobeHubHistoryState(destination), {
  isDestinationValid: () => false
}), null);

assert.deepEqual(resolveGlobeHubContinueTarget({
  hasDurableGuidedChild: true,
  hasActiveGuidedSession: true,
  journeyTarget: { journeyId: "europe", label: "Europe" }
}), { kind: "united-states-guided", reason: "durable-guided-child" });
assert.deepEqual(resolveGlobeHubContinueTarget({
  hasActiveGuidedSession: true,
  journeyTarget: { journeyId: "europe", label: "Europe" }
}), { kind: "united-states-guided", reason: "active-guided-session" });
assert.deepEqual(resolveGlobeHubContinueTarget({
  hasStartedGuidedLearning: true,
  journeyTarget: { journeyId: "europe", label: "Europe" }
}), { kind: "united-states-guided", reason: "guided-started" });
assert.deepEqual(resolveGlobeHubContinueTarget({
  isGuidedPostCourse: true,
  journeyTarget: { journeyId: "europe", label: "Europe" }
}), { kind: "united-states-guided", reason: "guided-post-course" });
assert.deepEqual(resolveGlobeHubContinueTarget({
  journeyTarget: { journeyId: "europe", label: "Europe" }
}), {
  kind: "journey",
  reason: "active-incomplete-journey",
  journeyId: "europe",
  label: "Europe"
});
assert.equal(resolveGlobeHubContinueTarget(), null);

const events = [];
const fakeHistory = {
  state: null,
  pushState(state) {
    this.state = state;
    events.push("push");
  },
  replaceState(state) {
    this.state = state;
    events.push("replace");
  }
};
const listeners = new Map();
const fakeEventTarget = {
  addEventListener(name, listener) { listeners.set(name, listener); },
  removeEventListener(name) { listeners.delete(name); }
};
const navigations = [];
const controller = createGlobeHubNavigationController({
  history: fakeHistory,
  eventTarget: fakeEventTarget,
  isScopeValid: (scopeId) => ["world", "united-states"].includes(scopeId),
  isDestinationValid: (destinationId) => destinationId === "atlas:united-states",
  onNavigate: async (snapshot, metadata) => navigations.push([snapshot, metadata])
});
await controller.restore();
assert.deepEqual(events, ["replace"]);
await controller.showGlobe("united-states");
await controller.showDestination("atlas:united-states", {
  globeScopeId: "united-states",
  returnScopeId: "united-states"
});
assert.deepEqual(events, ["replace", "push", "push"]);
listeners.get("popstate")({ state: wrapGlobeHubHistoryState(globe) });
await new Promise((resolve) => setTimeout(resolve, 0));
assert.equal(navigations.at(-1)[0].surface, "globe");
assert.equal(navigations.at(-1)[1].source, "popstate");
controller.destroy();
assert.equal(listeners.has("popstate"), false);

console.log("Globe hub navigation checks passed.");
