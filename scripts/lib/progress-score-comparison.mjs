import {
  EXPERIMENTAL_PROGRESS_MODELS,
  progressScoreBand,
  runAllExperimentalProgressModels,
  runExperimentalProgressModel,
  scoreCurrentSystemProxy
} from "./experimental-progress-score-models.mjs";
import { runUnitedStatesLearnerSimulation } from "./learner-simulation.mjs";

const correct = true;
const incorrect = false;
const longGap = Object.freeze({ type: "gap", days: 365 });

export const CANONICAL_PROGRESS_HISTORIES = Object.freeze([
  { id: "never-attempted", label: "Never attempted", evidence: [] },
  { id: "c", label: "✓", evidence: [correct] },
  { id: "cc", label: "✓ ✓", evidence: [correct, correct] },
  { id: "cccc", label: "✓ ✓ ✓ ✓", evidence: [correct, correct, correct, correct] },
  { id: "ci", label: "✓ ✗", evidence: [correct, incorrect] },
  { id: "ciii", label: "✓ ✗ ✗ ✗", evidence: [correct, incorrect, incorrect, incorrect] },
  { id: "ccccc-i", label: "✓ ✓ ✓ ✓ ✓ ✗", evidence: [correct, correct, correct, correct, correct, incorrect] },
  { id: "cccccccc", label: "✓ × 8", evidence: Array(8).fill(correct) },
  { id: "i", label: "✗", evidence: [incorrect] },
  { id: "iic", label: "✗ ✗ ✓", evidence: [incorrect, incorrect, correct] },
  { id: "iiccc", label: "✗ ✗ ✓ ✓ ✓", evidence: [incorrect, incorrect, correct, correct, correct] },
  { id: "ccc-gap-c", label: "✓ ✓ ✓, long absence, ✓", evidence: [correct, correct, correct, longGap, correct] },
  { id: "ccc-gap-i", label: "✓ ✓ ✓, long absence, ✗", evidence: [correct, correct, correct, longGap, incorrect] },
  { id: "ten-c-i", label: "✓ × 10, then ✗", evidence: [...Array(10).fill(correct), incorrect] },
  { id: "c-five-i", label: "✓, then ✗ × 5", evidence: [correct, ...Array(5).fill(incorrect)] },
  { id: "alternating", label: "✓ ✗ ✓ ✗ ✓ ✗", evidence: [correct, incorrect, correct, incorrect, correct, incorrect] }
]);

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function rounded(value) {
  return value === null ? null : Number(value.toFixed(4));
}

function canonicalResults() {
  return CANONICAL_PROGRESS_HISTORIES.map((history) => ({
    id: history.id,
    label: history.label,
    evidence: clone(history.evidence),
    models: Object.fromEntries(Object.entries(runAllExperimentalProgressModels(history.evidence)).map(([modelId, result]) => [modelId, {
      score: result.score,
      band: result.band,
      trajectory: result.trajectory.map((step) => ({ event: step.event, scoreAfter: step.scoreAfter, bandAfter: step.bandAfter }))
    }]))
  }));
}

function analysisForSequence(results, sequenceId) {
  const sequence = results.find((result) => result.id === sequenceId);
  return Object.fromEntries(EXPERIMENTAL_PROGRESS_MODELS.map((model) => [model.id, sequence.models[model.id].score]));
}

function recoveryAnalysis() {
  const evidence = [incorrect, incorrect, ...Array(12).fill(correct)];
  return Object.fromEntries(EXPERIMENTAL_PROGRESS_MODELS.map((model) => {
    const result = runExperimentalProgressModel(model.id, evidence);
    const responseSteps = result.trajectory.filter((step) => step.event.type === "response");
    const afterMisses = responseSteps[1].scoreAfter;
    const correctSteps = responseSteps.slice(2);
    const firstHigh = correctSteps.findIndex((step) => step.scoreAfter >= 0.65);
    const firstComplete = correctSteps.findIndex((step) => step.scoreAfter >= 0.9);
    return [model.id, {
      scoreAfterTwoMisses: afterMisses,
      correctAnswersToHigh: firstHigh < 0 ? null : firstHigh + 1,
      correctAnswersToComplete: firstComplete < 0 ? null : firstComplete + 1,
      trajectoryAfterMisses: correctSteps.map((step) => step.scoreAfter)
    }];
  }));
}

function perfectPassAnalysis() {
  return Object.fromEntries(EXPERIMENTAL_PROGRESS_MODELS.map((model) => {
    const oneCorrect = runExperimentalProgressModel(model.id, [correct]);
    const itemScores = Array.from({ length: 50 }, (_, index) => ({ itemId: `state-location-${index + 1}`, score: oneCorrect.score, band: oneCorrect.band }));
    const bandCounts = itemScores.reduce((counts, item) => {
      counts[item.band] = (counts[item.band] || 0) + 1;
      return counts;
    }, { unknown: 0, low: 0, medium: 0, high: 0, complete: 0 });
    return [model.id, {
      scorePerStateLocation: oneCorrect.score,
      bandPerStateLocation: oneCorrect.band,
      averageProgress: rounded(itemScores.reduce((sum, item) => sum + item.score, 0) / itemScores.length),
      bandCounts,
      interpretation: "One correct location response is acknowledged as demonstrated evidence, not durable mastery."
    }];
  }));
}

function evidenceByItem(simulation) {
  const histories = {};
  for (const transition of simulation.inspector.transitions) {
    const itemId = transition.event.itemId.value;
    if (!histories[itemId]) histories[itemId] = [];
    histories[itemId].push(Boolean(transition.event.result.value.correct));
  }
  return histories;
}

function modelScoresForItems(histories, items, modelId) {
  return Object.fromEntries(items.map((item) => {
    const history = histories[item.id] || [];
    const result = runExperimentalProgressModel(modelId, history);
    return [item.id, { score: result.score, band: result.band, observations: history.length }];
  }));
}

function bandCounts(scores) {
  return Object.values(scores).reduce((counts, item) => {
    counts[item.band] = (counts[item.band] || 0) + 1;
    return counts;
  }, { unknown: 0, low: 0, medium: 0, high: 0, complete: 0 });
}

function syntheticProfiles(items) {
  const profileIds = ["perfect", "single-weak-item", "regional-weakness", "mixed", "random"];
  const fixtureSnapshot = JSON.stringify(items);
  const outputs = profileIds.map((profileId) => {
    const simulation = runUnitedStatesLearnerSimulation({
      profileId,
      items,
      seed: `progress-score:${profileId}`,
      plannerSeed: "progress-score-shared-planner",
      answerSeed: "progress-score-shared-answers",
      sessionCount: 60,
      startTime: "2030-01-15T18:30:00.000Z"
    });
    const simulationSnapshot = JSON.stringify(simulation);
    const histories = evidenceByItem(simulation);
    const models = Object.fromEntries(EXPERIMENTAL_PROGRESS_MODELS.map((model) => {
      const scores = modelScoresForItems(histories, items, model.id);
      const attempted = Object.values(scores).filter((item) => item.score !== null);
      const diagnostics = Object.fromEntries(["state:ohio", "state:maine", "state:michigan"].map((itemId) => [itemId, {
        evidence: clone(histories[itemId] || []),
        ...scores[itemId],
        currentPlannerProgress: clone(simulation.finalState.itemProgress?.[itemId] || null),
        currentProxyMatchesPlannerCounters: model.id !== "current-system-proxy"
          ? null
          : scoreCurrentSystemProxy(simulation.finalState.itemProgress?.[itemId]) === scores[itemId].score
      }]));
      const regional = Object.fromEntries(["Northeast", "Midwest", "South", "West"].map((region) => {
        const regionItems = items.filter((item) => item.censusRegion === region).map((item) => scores[item.id]);
        const scored = regionItems.filter((item) => item.score !== null);
        return [region, {
          itemCount: regionItems.length,
          attemptedCount: scored.length,
          averageScoreAmongAttempted: scored.length ? rounded(scored.reduce((sum, item) => sum + item.score, 0) / scored.length) : null,
          bands: bandCounts(Object.fromEntries(regionItems.map((item, index) => [index, item])))
        }];
      }));
      return [model.id, {
        averageScoreAmongAttempted: attempted.length ? rounded(attempted.reduce((sum, item) => sum + item.score, 0) / attempted.length) : null,
        bands: bandCounts(scores),
        diagnostics,
        regional
      }];
    }));
    if (JSON.stringify(simulation) !== simulationSnapshot) throw new Error("Progress comparison mutated synthetic simulation output.");
    return {
      profileId,
      profileLabel: simulation.profile.label,
      deterministicContext: clone(simulation.deterministicContext),
      evidenceEvents: simulation.inspector.transitions.length,
      models
    };
  });
  if (JSON.stringify(items) !== fixtureSnapshot) throw new Error("Progress comparison mutated the production-derived fixture.");
  return outputs;
}

export function buildExperimentalProgressScoreComparison({ items }) {
  const fixtureSnapshot = JSON.stringify(items);
  const canonical = canonicalResults();
  const result = {
    schemaVersion: 1,
    kind: "experimental-progress-score-comparison",
    productionAuthoritative: false,
    scoreMeaning: "Experimental estimate of currently demonstrated skill; separate from scheduler mastery, retention priority, and due state.",
    scoreBands: { unknown: null, low: [0, 0.3], medium: [0.3, 0.65], high: [0.65, 0.9], complete: [0.9, 1] },
    models: clone(EXPERIMENTAL_PROGRESS_MODELS),
    canonicalSequences: canonical,
    focusedAnalysis: {
      luckyGuess: {
        firstCorrect: analysisForSequence(canonical, "c"),
        oneCorrectThreeMisses: analysisForSequence(canonical, "ciii"),
        oneCorrectFiveMisses: analysisForSequence(canonical, "c-five-i")
      },
      strongEvidence: {
        fiveCorrect: Object.fromEntries(EXPERIMENTAL_PROGRESS_MODELS.map((model) => [model.id, runExperimentalProgressModel(model.id, Array(5).fill(correct)).score])),
        fiveCorrectOneMiss: analysisForSequence(canonical, "ccccc-i"),
        tenCorrectOneMiss: analysisForSequence(canonical, "ten-c-i")
      },
      recoveryAfterTwoMisses: recoveryAnalysis(),
      longAbsence: Object.fromEntries(EXPERIMENTAL_PROGRESS_MODELS.map((model) => {
        const run = runExperimentalProgressModel(model.id, [correct, correct, correct, longGap]);
        const gap = run.trajectory.at(-1);
        return [model.id, { scoreBeforeGap: gap.scoreBefore, scoreAfterGap: gap.scoreAfter, changedWithoutResponse: gap.changedWithoutResponse }];
      }))
    },
    perfectFiftyStateLocationPass: perfectPassAnalysis(),
    syntheticProfiles: syntheticProfiles(items),
    criteriaEvaluation: {
      "weighted-evidence": {
        strengths: ["Immediate acknowledgement", "simple arithmetic", "quick reversal after repeated misses"],
        weaknesses: ["Clamp saturation discards accumulated evidence", "fixed increments are highly parameter-sensitive", "some failure-heavy recent-correct histories can recover to implausibly high values"]
      },
      "bayesian-evidence": {
        strengths: ["All evidence remains visible in the posterior", "lucky guesses reverse", "one miss has diminishing impact after extensive success", "prior and evidence weights are explainable"],
        weaknesses: ["Provisional prior is uncalibrated", "plain Beta evidence does not model response order or retention", "question-specific guessing needs an explicit extension"]
      },
      "bkt-inspired": {
        strengths: ["Explicit guess and slip assumptions", "fast recovery", "bounded latent probability"],
        weaknesses: ["No-forgetting and learning transitions rapidly saturate", "parameter interactions are less intuitive", "latent knowledge is not the same construct as demonstrated-progress"]
      },
      "current-system-proxy": {
        strengths: ["Uses existing counters", "easy to compute read-only", "acknowledges one successful demonstration"],
        weaknesses: ["Formula weights are invented", "streak reset creates a large one-miss drop", "excluding scheduler fields is honest but makes this only a partial projection"]
      }
    },
    recommendation: {
      furtherPrototype: "bayesian-evidence",
      rationale: "It best balances reversible lucky-guess evidence with resilience after many correct demonstrations, preserves the full evidence history, and remains explainable without conflating the score with retention scheduling.",
      rejectForVisibleBarInCurrentForm: ["bkt-inspired"],
      rejectionRationale: "The current BKT assumptions saturate rapidly and can show high latent knowledge for failure-heavy synthetic histories; its no-forgetting learning model answers a different question from currently demonstrated skill.",
      baselineOnly: "weighted-evidence",
      diagnosticOnly: "current-system-proxy",
      unresolved: [
        "Prior strength and whether it varies by question type",
        "How to incorporate multiple-choice guess probability without turning the score into scheduler mastery",
        "Whether evidence should be skill-specific and activity-weighted",
        "Whether a user-facing complete band should require breadth or only per-skill evidence",
        "How much recent evidence order should matter"
      ]
    },
    limitations: [
      "Parameters are provisional and are not fitted to learner-outcome data.",
      "Canonical responses omit question type, response time, confidence, and opportunity-specific guess rates.",
      "No candidate is written to production state or used by a planner.",
      "No time-decay model is included because demonstrated-progress and retention scheduling are intentionally separate in this experiment.",
      "The current-system proxy projects three existing counters but is not an existing production score.",
      "Synthetic U.S. Memory Trail histories are item/mode evidence streams, not an existing unified place-by-skill evidence architecture; each item history is treated only as a stand-in candidate skill stream."
    ],
    validation: {
      fixtureUnchanged: JSON.stringify(items) === fixtureSnapshot,
      allScoresBounded: canonical.every((sequence) => Object.values(sequence.models).every((model) => model.score === null || (model.score >= 0 && model.score <= 1))),
      longAbsenceChangesOnlyTimeSensitiveModels: null
    }
  };
  result.validation.longAbsenceChangesOnlyTimeSensitiveModels = Object.values(result.focusedAnalysis.longAbsence).every((analysis) => !analysis.changedWithoutResponse);
  return result;
}

export function summarizeProgressBands(scores) {
  return scores.reduce((counts, score) => {
    const band = progressScoreBand(score);
    counts[band] = (counts[band] || 0) + 1;
    return counts;
  }, { unknown: 0, low: 0, medium: 0, high: 0, complete: 0 });
}
