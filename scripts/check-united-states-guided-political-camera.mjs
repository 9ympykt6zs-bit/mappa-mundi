import assert from "node:assert/strict";
import fs from "node:fs";

import {
  createUnitedStatesGuidedStateFocusDecision,
  createUnitedStatesGuidedPoliticalCameraDecision,
  isManagedUnitedStatesGuidedPoliticalCamera,
  UNITED_STATES_GUIDED_DISTANT_SECTION_ZOOM_THRESHOLD,
  UNITED_STATES_GUIDED_STATE_FOCUS_MIN_ZOOM_GAIN
} from "../src/united-states-guided-political-camera.js";

const utahArizonaActivity = JSON.parse(fs.readFileSync(
  new URL("../assets/maps/data/us-states-capitals-09.json", import.meta.url),
  "utf8"
));
const approvedUtahArizonaCamera = {
  center: [-109.01691, 37.55051],
  zoom: 4.7034,
  bearing: 0,
  pitch: 0,
  duration: 650
};

function learningPlan(sectionId, items) {
  return {
    sessionType: "learning-session",
    newItems: items.map((item) => ({ homeActivityId: sectionId, ...item })),
    playItems: [
      ...items.map((item) => ({ homeActivityId: sectionId, ...item })),
      { homeActivityId: "us-states-01", type: "state", targetId: "maine" }
    ]
  };
}

const utahArizonaStates = createUnitedStatesGuidedPoliticalCameraDecision({
  activityId: "us-states-09",
  plan: learningPlan("us-states-09", [
    { type: "state", targetId: "utah" },
    { type: "state", targetId: "arizona" }
  ]),
  activityMap: utahArizonaActivity.map
});
assert.equal(utahArizonaStates.mode, "override");
assert.equal(utahArizonaStates.cameraSource, "authored-override");
assert.equal(utahArizonaStates.overrideId, "utah-arizona");
assert.deepEqual(utahArizonaStates.camera, approvedUtahArizonaCamera);
assert.deepEqual(utahArizonaStates.activeStateIds, ["utah", "arizona"]);
assert.equal(utahArizonaStates.focusTargetIds.includes("maine"), false, "Distant cumulative review cannot broaden the learning camera.");

const utahArizonaCapitals = createUnitedStatesGuidedPoliticalCameraDecision({
  activityId: "us-states-09",
  plan: learningPlan("us-states-09", [
    { type: "capital", targetId: "salt-lake-city-ut", relatedStateTargetId: "utah" },
    { type: "capital", targetId: "phoenix-az", relatedStateTargetId: "arizona" }
  ]),
  activityMap: utahArizonaActivity.map
});
assert.equal(utahArizonaCapitals.mode, "override");
assert.deepEqual(utahArizonaCapitals.camera, approvedUtahArizonaCamera);
assert.deepEqual(
  utahArizonaCapitals.focusTargetIds,
  ["utah", "arizona", "salt-lake-city-ut", "phoenix-az"]
);

for (const sectionNumber of [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]) {
  const sectionId = `us-states-${String(sectionNumber).padStart(2, "0")}`;
  const decision = createUnitedStatesGuidedPoliticalCameraDecision({
    activityId: sectionId,
    plan: learningPlan(sectionId, [
      { type: "state", targetId: `section-${sectionNumber}-a` },
      { type: "state", targetId: `section-${sectionNumber}-b` }
    ]),
    activityMap: sectionNumber === 9 ? utahArizonaActivity.map : {}
  });
  assert.equal(decision.mode, "fit", `${sectionId} should use section fit without a matching authored override.`);
  assert.equal(decision.cameraSource, "section-fit");
  assert.equal(isManagedUnitedStatesGuidedPoliticalCamera(decision), true);
}

const alaskaHawaii = createUnitedStatesGuidedPoliticalCameraDecision({
  activityId: "us-states-11",
  plan: learningPlan("us-states-11", [
    { type: "state", targetId: "alaska" },
    { type: "state", targetId: "hawaii" }
  ])
});
assert.equal(alaskaHawaii.mode, "preserve-special");
assert.equal(alaskaHawaii.cameraSource, "existing-alaska-hawaii-handling");
assert.equal(isManagedUnitedStatesGuidedPoliticalCamera(alaskaHawaii), false);

const stateFocus = createUnitedStatesGuidedStateFocusDecision({
  guidedPoliticalCamera: utahArizonaStates,
  selection: { targetId: "utah", promptType: "guided" },
  item: { type: "state", targetId: "utah" }
});
assert.equal(stateFocus, null, "The authored Utah/Arizona camera remains authoritative.");
const distantSectionCamera = {
  ...utahArizonaStates,
  mode: "fit",
  cameraSource: "section-fit",
  sectionFittedCamera: { center: [-112, 40], zoom: 3.8 }
};
const distantStateFocus = createUnitedStatesGuidedStateFocusDecision({
  guidedPoliticalCamera: distantSectionCamera,
  selection: { targetId: "utah", promptType: "guided" },
  item: { type: "state", targetId: "utah" }
});
assert.deepEqual(distantStateFocus, {
  stateTargetId: "utah",
  promptTargetId: "utah",
  promptType: "guided",
  zoomThreshold: UNITED_STATES_GUIDED_DISTANT_SECTION_ZOOM_THRESHOLD,
  minZoomGain: UNITED_STATES_GUIDED_STATE_FOCUS_MIN_ZOOM_GAIN,
  sectionZoom: 3.8,
  cameraContext: "guided-political-state-focus",
  cameraSource: "guided-political-distant-section-correction"
});
assert.equal(createUnitedStatesGuidedStateFocusDecision({
  guidedPoliticalCamera: distantSectionCamera,
  selection: { targetId: "utah", promptType: "name_to_place" },
  item: { type: "state", targetId: "utah" }
}), null, "A locating prompt must retain its broader search area instead of focusing the answer.");
assert.equal(createUnitedStatesGuidedStateFocusDecision({
  guidedPoliticalCamera: {
    ...distantSectionCamera,
    sectionFittedCamera: { center: [-112, 40], zoom: 4.7 }
  },
  selection: { targetId: "utah", promptType: "guided" },
  item: { type: "state", targetId: "utah" }
}), null, "A reasonable contextual section camera must not be replaced by a complete-state fit.");
assert.equal(createUnitedStatesGuidedStateFocusDecision({
  guidedPoliticalCamera: alaskaHawaii,
  selection: { targetId: "alaska", promptType: "guided" },
  item: { type: "state", targetId: "alaska" }
}), null, "Alaska and Hawaii retain their authored disconnected-geography cameras.");
assert.equal(createUnitedStatesGuidedStateFocusDecision({
  guidedPoliticalCamera: {
    ...distantSectionCamera,
    activeTargetIds: utahArizonaCapitals.activeTargetIds,
    activeStateIds: utahArizonaCapitals.activeStateIds
  },
  selection: { targetId: "salt-lake-city-ut", promptType: "place_to_name" },
  item: { type: "capital", targetId: "salt-lake-city-ut", relatedStateTargetId: "utah" }
})?.stateTargetId, "utah", "Capital teaching and visible identification focus the related state.");

assert.equal(createUnitedStatesGuidedPoliticalCameraDecision({
  activityId: "us-states-09",
  plan: { sessionType: "cumulative-review", newItems: [], playItems: [] },
  activityMap: utahArizonaActivity.map
}), null, "Cumulative review cameras remain under existing review behavior.");
assert.equal(createUnitedStatesGuidedPoliticalCameraDecision({
  activityId: "us-physical-lakes",
  plan: learningPlan("us-physical-lakes", [{ type: "lake", targetId: "superior" }])
}), null, "Physical-feature cameras are outside the political camera contract.");

const runtimeSource = fs.readFileSync(new URL("../src/maplibre-poc.js", import.meta.url), "utf8");
assert.match(runtimeSource, /applyUnitedStatesGuidedPoliticalCamera\(activeStudySession\.memoryTrail\)/);
assert.match(runtimeSource, /isManagedUnitedStatesGuidedPoliticalCamera\(memoryTrail\?\.guidedPoliticalCamera\)/);
assert.match(runtimeSource, /scheduleUnitedStatesGuidedStateFocusCheck\(memoryTrail, selection\)/);

console.log("United States Guided political camera validation passed.");
