import assert from "node:assert/strict";
import {
  createDailyTrailInspectorItemView,
  createDailyTrailSelectionExplanation,
  createJourneyProgressInspectorItemView,
  createLearningInspectorDebugObject,
  createLearningInspectorTransition,
  createMapReconstructionInspectorItemView,
  createMentalMapInspectorItemView,
  createMentalMapSelectionExplanation,
  createPlaceMasteryInspectorItemView,
  createUnitedStatesMemoryTrailInspectorItemView,
  createUnitedStatesMemoryTrailSelectionExplanation,
  LEARNING_INSPECTOR_AVAILABILITY
} from "../src/learning-inspector.js";
import {
  applyPlaceMasteryAttempt,
  createPlaceMasteryState,
  placeMasteryVersion
} from "../src/place-mastery-store.js";
import {
  createDailyTrailState,
  planCompletedDailyTrailReviewSession
} from "../src/daily-trail-planner.js";

const fixedNow = () => new Date("2032-04-05T12:00:00.000Z");
const clone = (value) => JSON.parse(JSON.stringify(value));

const masteryState = createPlaceMasteryState({
  version: placeMasteryVersion,
  places: {
    "state:maine": {
      signals: {
        naming: {
          attempts: 3,
          correct: 2,
          incorrect: 1,
          currentCorrectStreak: 1,
          lastAttemptAt: "2032-04-04T10:00:00.000Z",
          lastResult: "correct"
        },
        locating: {
          attempts: 2,
          correct: 1,
          incorrect: 1,
          currentCorrectStreak: 0,
          lastAttemptAt: "2032-04-05T10:00:00.000Z",
          lastResult: "incorrect"
        }
      }
    }
  }
});
const masteryStateBefore = clone(masteryState);
const masteryView = createPlaceMasteryInspectorItemView({
  place: { placeId: "state:maine", label: "Maine" },
  masteryState,
  sourceActivity: "us-states-01",
  taxonomy: "state-identification"
});
assert.deepEqual(masteryState, masteryStateBefore, "The place-mastery adapter must not mutate source state.");
assert.equal(masteryView.identity.stableId.value, "state:maine");
assert.equal(masteryView.learnerState.masterySignals.availability, LEARNING_INSPECTOR_AVAILABILITY.OBSERVED);
assert.equal(masteryView.metrics.attempts.value, 5);
assert.equal(masteryView.metrics.attempts.availability, LEARNING_INSPECTOR_AVAILABILITY.INFERRED);
assert.equal(masteryView.metrics.lapses.availability, LEARNING_INSPECTOR_AVAILABILITY.UNAVAILABLE);
assert.equal(masteryView.metrics.lastSeen.value, "2032-04-05T10:00:00.000Z");

const missingMasteryView = createPlaceMasteryInspectorItemView({
  place: { placeId: "state:ohio", label: "Ohio" },
  masteryState
});
assert.equal(missingMasteryView.learnerState.masterySignals.availability, LEARNING_INSPECTOR_AVAILABILITY.UNAVAILABLE);
assert.equal(missingMasteryView.metrics.attempts.value, null, "Missing evidence must not be converted to a zero attempt count.");

const dailyItem = {
  id: "country:canada",
  targetId: "canada",
  label: "Canada",
  homeActivityId: "world-core-americas-countries",
  category: "country-location",
  order: 1
};
const dailyState = createDailyTrailState({
  hasStarted: true,
  currentSessionNumber: 9,
  introducedItemIds: [dailyItem.id],
  itemProgress: {
    [dailyItem.id]: {
      status: "review",
      timesSeen: 6,
      correctCount: 5,
      missCount: 1,
      lapseCount: 1,
      lastSeenSession: 8,
      lastReviewedSession: 8,
      lastReviewedDate: "2032-04-04",
      dueSession: 9,
      dueDate: "2032-04-05",
      memoryState: "review"
    }
  }
}, { now: fixedNow });
const dailyStateBefore = clone(dailyState);
const dailyView = createDailyTrailInspectorItemView({ item: dailyItem, state: dailyState });
assert.deepEqual(dailyState, dailyStateBefore, "The Daily Trail adapter must not mutate source state.");
assert.equal(dailyView.identity.sourceActivity.value, dailyItem.homeActivityId);
assert.equal(dailyView.identity.taxonomy.value, "country-location");
assert.equal(dailyView.metrics.attempts.value, 6);
assert.equal(dailyView.metrics.failures.value, 1);
assert.deepEqual(dailyView.metrics.nextReview.value, { session: 9, date: "2032-04-05" });
assert.equal(dailyView.learnerState.mastery.availability, LEARNING_INSPECTOR_AVAILABILITY.UNAVAILABLE);

const introducedOnlyView = createDailyTrailInspectorItemView({
  item: { ...dailyItem, id: "country:mexico", targetId: "mexico", label: "Mexico" },
  state: { introducedItemIds: ["country:mexico"], itemProgress: {} }
});
assert.equal(introducedOnlyView.learnerState.progressStatus.availability, LEARNING_INSPECTOR_AVAILABILITY.INFERRED);
assert.equal(introducedOnlyView.learnerState.progressStatus.value, "introduced");
assert.equal(introducedOnlyView.metrics.attempts.availability, LEARNING_INSPECTOR_AVAILABILITY.UNAVAILABLE);

const usItem = {
  id: "state:maine",
  targetId: "maine",
  label: "Maine",
  type: "state",
  sourceActivityId: "us-states-01",
  homeActivityId: "us-states-01",
  order: 0
};
const usState = {
  currentSessionNumber: 5,
  introducedItemIds: [usItem.id],
  itemProgress: {
    [usItem.id]: {
      status: "learning",
      timesSeen: 3,
      correctCount: 2,
      missCount: 1,
      lapseCount: 1,
      lastSeenSession: 4,
      dueSession: 5,
      memoryState: "relearning"
    }
  }
};
const usView = createUnitedStatesMemoryTrailInspectorItemView({ item: usItem, state: usState });
assert.equal(usView.metrics.successes.value, 2);
assert.equal(usView.metrics.nextReview.value.session, 5);
assert.equal(usView.identity.taxonomy.value, "state");
assert.match(usView.identity.taxonomy.note, /closest available category/);

const journeyView = createJourneyProgressInspectorItemView({
  journeyId: "united-states",
  stepId: "us-states-01",
  difficulty: "medium",
  progress: {
    journeys: {
      "united-states": {
        currentStepIndex: 1,
        completedSteps: { "us-states-01": { medium: true } },
        completedDifficulties: { medium: false }
      }
    }
  }
});
assert.equal(journeyView.learnerState.completion.value, true);
assert.equal(journeyView.learnerState.mastery.availability, LEARNING_INSPECTOR_AVAILABILITY.UNAVAILABLE);

const missingJourneyView = createJourneyProgressInspectorItemView({
  journeyId: "united-states",
  stepId: "us-states-02",
  difficulty: "medium",
  progress: { journeys: {} }
});
assert.equal(missingJourneyView.learnerState.completion.availability, LEARNING_INSPECTOR_AVAILABILITY.UNAVAILABLE);

const mentalChallenge = {
  id: "east-of-nevada",
  title: "East of Nevada",
  category: "cardinal-direction",
  answerMode: "single-select"
};
const mentalEvaluation = {
  isCorrect: false,
  selectedStateIds: ["arizona"],
  missingStateIds: ["utah"]
};
const mentalView = createMentalMapInspectorItemView({ challenge: mentalChallenge, evaluation: mentalEvaluation });
assert.deepEqual(mentalView.learnerState.currentResult.value, mentalEvaluation);
assert.equal(mentalView.metrics.attempts.availability, LEARNING_INSPECTOR_AVAILABILITY.UNAVAILABLE);
const unansweredMentalView = createMentalMapInspectorItemView({ challenge: mentalChallenge });
assert.equal(unansweredMentalView.learnerState.currentResult.availability, LEARNING_INSPECTOR_AVAILABILITY.UNAVAILABLE);

const reconstructionEvaluation = {
  isComplete: false,
  score: 72,
  placements: {
    maine: { stateId: "maine", status: "close", distanceRatio: 0.12 }
  }
};
const reconstructionView = createMapReconstructionInspectorItemView({
  region: { id: "new-england", title: "New England" },
  session: { phase: "result", viewMode: "learner", evaluation: reconstructionEvaluation },
  stateId: "maine"
});
assert.equal(reconstructionView.learnerState.placement.value.status, "close");
assert.equal(reconstructionView.learnerState.mastery.availability, LEARNING_INSPECTOR_AVAILABILITY.UNAVAILABLE);

const dailyPlan = {
  sessionType: "learning-session",
  newItems: [],
  reviewItems: [dailyItem],
  playItems: [dailyItem]
};
const dailySelection = createDailyTrailSelectionExplanation({
  state: dailyState,
  plan: dailyPlan,
  item: dailyItem,
  deterministicContext: { seed: "inspector-seed", now: fixedNow }
});
assert.equal(dailySelection.eligible.value, true);
assert.equal(dailySelection.reasonCode.value, "weak-review");
assert.equal(dailySelection.reasonCode.availability, LEARNING_INSPECTOR_AVAILABILITY.INFERRED);
assert.equal(dailySelection.whyWon.availability, LEARNING_INSPECTOR_AVAILABILITY.UNAVAILABLE);
assert.equal(dailySelection.deterministicContext.seed.value, "inspector-seed");
assert.equal(dailySelection.deterministicContext.time.value, "2032-04-05T12:00:00.000Z");

const usPlan = {
  sessionType: "learning-session",
  newItems: [],
  weakReviewItems: [usItem],
  oldReviewItems: [],
  recentReviewItems: [],
  reviewItems: [usItem],
  playItems: [usItem]
};
const usSelection = createUnitedStatesMemoryTrailSelectionExplanation({
  state: usState,
  plan: usPlan,
  item: usItem,
  deterministicContext: { seed: "us-inspector-seed", now: fixedNow }
});
assert.equal(usSelection.reasonCode.value, "weak-review");
assert.equal(usSelection.priorityFactors.value.memoryState, "relearning");
assert.equal(usSelection.whyWon.availability, LEARNING_INSPECTOR_AVAILABILITY.UNAVAILABLE);

const mentalSelectionA = createMentalMapSelectionExplanation({
  challenge: mentalChallenge,
  pool: [mentalChallenge],
  deterministicContext: { seed: "mental-inspector", now: fixedNow }
});
const mentalSelectionB = createMentalMapSelectionExplanation({
  challenge: clone(mentalChallenge),
  pool: [clone(mentalChallenge)],
  deterministicContext: { seed: "mental-inspector", now: fixedNow }
});
assert.deepEqual(mentalSelectionA, mentalSelectionB, "Equivalent deterministic selection inputs must produce equivalent Inspector output.");
assert.equal(mentalSelectionA.priorityFactors.availability, LEARNING_INSPECTOR_AVAILABILITY.UNAVAILABLE);

const afterMasteryState = applyPlaceMasteryAttempt(masteryState, "state:maine", "locating", {
  correct: true,
  attemptedAt: "2032-04-05T12:00:00.000Z"
});
const afterMasteryView = createPlaceMasteryInspectorItemView({
  place: { placeId: "state:maine", label: "Maine" },
  masteryState: afterMasteryState,
  sourceActivity: "us-states-01",
  taxonomy: "state-identification"
});
const transitionInputBefore = clone(masteryView);
const transitionInputAfter = clone(afterMasteryView);
const transition = createLearningInspectorTransition({
  before: masteryView,
  event: {
    itemId: "state:maine",
    sourceMode: "United States Memory Trail",
    answer: "Maine",
    result: { correct: true, signal: "locating" }
  },
  after: afterMasteryView
});
assert.deepEqual(masteryView, transitionInputBefore, "Transition creation must not mutate the before snapshot.");
assert.deepEqual(afterMasteryView, transitionInputAfter, "Transition creation must not mutate the after snapshot.");
assert.ok(transition.changes.value.some((change) => change.path === "metrics.attempts" && change.before === 5 && change.after === 6));
assert.deepEqual(
  transition,
  createLearningInspectorTransition({
    before: masteryView,
    event: {
      itemId: "state:maine",
      sourceMode: "United States Memory Trail",
      answer: "Maine",
      result: { correct: true, signal: "locating" }
    },
    after: afterMasteryView
  }),
  "Equivalent snapshots must produce a stable transition view."
);

const replayItems = Array.from({ length: 12 }, (_, index) => ({
  ...dailyItem,
  id: `country:replay-${index}`,
  targetId: `replay-${index}`,
  label: `Replay ${index}`,
  homeActivityId: `region-${index % 2}`,
  order: index
}));
const replayState = createDailyTrailState({
  hasStarted: true,
  currentSessionNumber: 12,
  introducedItemIds: replayItems.map((item) => item.id),
  itemProgress: Object.fromEntries(replayItems.map((item) => [item.id, {
    status: "review",
    timesSeen: 3,
    correctCount: 3,
    missCount: 0,
    lastSeenSession: 8,
    dueSession: 12,
    dueDate: "2032-04-05"
  }]))
}, { now: fixedNow });
const replayOptions = { seed: "inspector-plan-replay", now: fixedNow };
const replayPlanA = planCompletedDailyTrailReviewSession(replayState, replayItems, replayOptions);
const replayPlanB = planCompletedDailyTrailReviewSession(replayState, replayItems, replayOptions);
const replayExplanationA = createDailyTrailSelectionExplanation({
  state: replayState,
  plan: replayPlanA,
  item: replayPlanA.playItems[0],
  deterministicContext: replayOptions
});
const replayExplanationB = createDailyTrailSelectionExplanation({
  state: replayState,
  plan: replayPlanB,
  item: replayPlanB.playItems[0],
  deterministicContext: replayOptions
});
assert.deepEqual(replayPlanA, replayPlanB);
assert.deepEqual(replayExplanationA, replayExplanationB, "Deterministic planner replay must remain inspectably equivalent.");

const debugExport = createLearningInspectorDebugObject({
  context: { learnerId: null, note: "fixture" },
  items: [masteryView, dailyView, usView, mentalView, reconstructionView],
  selections: [dailySelection, usSelection, mentalSelectionA],
  transitions: [transition]
});
assert.doesNotThrow(() => JSON.stringify(debugExport));
assert.equal(debugExport.kind, "learning-inspector-export");
assert.equal(debugExport.items.length, 5);

console.log("Learning Inspector data-layer validation passed:", JSON.stringify({
  itemAdapters: debugExport.items.map((item) => item.adapter),
  selectionAdapters: debugExport.selections.map((selection) => selection.planner.value),
  transitionChanges: transition.changes.value.length,
  unavailableExample: missingMasteryView.learnerState.masterySignals.note
}));
