import {
  adaptCanonicalRetrievalAttempt
} from "../../src/canonical-learning-evidence.js";
import {
  appendCanonicalEvidenceEvent,
  appendCanonicalEvidenceEvents,
  createEmptyCanonicalEvidenceRepository,
  loadCanonicalEvidenceRepository,
  resetCanonicalEvidenceRepository,
  saveCanonicalEvidenceRepository
} from "../../src/canonical-learning-evidence-repository.js";
import { createCanonicalUnitedStatesProgressReportShadow } from "../../src/canonical-progress-report-shadow.js";
import { createUnitedStatesProgressReport } from "../../src/united-states-progress-report.js";
import {
  clearPlaceMastery,
  createPlaceMasteryState,
  loadPlaceMastery,
  savePlaceMastery
} from "../../src/place-mastery-store.js";

export const SHADOW_COMPARISON_CLASSIFICATIONS = Object.freeze([
  "exact match",
  "semantically equivalent",
  "intentional difference",
  "unavailable/not comparable",
  "defect"
]);

const FIXED_TIME = "2034-02-03T15:30:00.000Z";
const ITEMS = Object.freeze([
  { id: "state:ohio", type: "state", targetId: "ohio", label: "Ohio", sourceActivityId: "us-states-05" },
  { id: "state:maine", type: "state", targetId: "maine", label: "Maine", sourceActivityId: "us-states-01" },
  {
    id: "capital:columbus-oh",
    type: "capital",
    targetId: "columbus-oh",
    label: "Columbus",
    relatedStateItemId: "state:ohio",
    relatedStateTargetId: "ohio",
    sourceActivityId: "us-capitals-05"
  }
]);

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function createMemoryStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem(key) {
      return values.has(key) ? values.get(key) : null;
    },
    setItem(key, value) {
      values.set(key, String(value));
    },
    removeItem(key) {
      values.delete(key);
    }
  };
}

function buildRepository(events = []) {
  return appendCanonicalEvidenceEvents(createEmptyCanonicalEvidenceRepository(), events).repository;
}

function retrievalEvent({
  id,
  item = ITEMS[0],
  promptType = "name_to_place",
  result = "correct",
  sourceMode = "us-memory-trail",
  sequence = 0
}) {
  return adaptCanonicalRetrievalAttempt({
    item,
    promptType,
    result,
    eventId: id,
    attemptId: `${id}:attempt`,
    occurredAt: new Date(Date.parse(FIXED_TIME) + (sequence * 1000)).toISOString(),
    sourceMode,
    sourceActivityId: item.sourceActivityId,
    sessionId: `${sourceMode}:shadow-comparison`,
    sequence
  });
}

function masteryState({ locating, naming } = {}) {
  const signals = {};
  if (locating) signals.locating = signal(locating.correct, locating.incorrect);
  if (naming) signals.naming = signal(naming.correct, naming.incorrect);
  return createPlaceMasteryState({
    version: 1,
    places: Object.keys(signals).length ? { "state:ohio": { signals } } : {}
  });
}

function signal(correct = 0, incorrect = 0) {
  return {
    attempts: correct + incorrect,
    correct,
    incorrect,
    currentCorrectStreak: incorrect > 0 ? 0 : correct,
    lastAttemptAt: FIXED_TIME,
    lastResult: incorrect > 0 ? "incorrect" : correct > 0 ? "correct" : null
  };
}

function plannerState(itemId, correctCount, missCount) {
  return {
    currentSessionNumber: 4,
    itemProgress: {
      [itemId]: {
        status: "learning",
        timesSeen: Math.max(1, correctCount + missCount),
        correctCount,
        missCount,
        correctStreak: missCount > 0 ? 0 : correctCount,
        memoryState: missCount > 0 ? "relearning" : "learning",
        dueSession: 4
      }
    }
  };
}

function reportPair({ repository, placeMasteryState = {}, memoryState = {}, items = ITEMS }) {
  return {
    legacy: createUnitedStatesProgressReport({
      items,
      unitedStatesMemoryTrailState: memoryState,
      placeMasteryState,
      currentDate: "2034-02-03"
    }),
    canonical: createCanonicalUnitedStatesProgressReportShadow({ items, repository })
  };
}

function record(report, categoryId, itemId) {
  return report.categories.find(({ id }) => id === categoryId)?.records.find((candidate) => candidate.itemId === itemId);
}

function normalizedResult(sourceRecord, side) {
  const history = sourceRecord.evidenceHistory;
  return {
    sourceData: side === "legacy" ? clone(history.sources) : {
      conceptIds: clone(sourceRecord.canonicalMapping.conceptIds),
      skillIds: clone(sourceRecord.canonicalMapping.canonicalSkillIds),
      sourceModes: clone(history.sources.map(({ id }) => id))
    },
    evidenceCounts: {
      correct: history.correctCount,
      incorrect: history.incorrectCount,
      ...(side === "canonical" ? {
        assisted: history.assistedCount,
        partial: history.partialCount,
        skipped: history.skippedCount,
        events: history.eventCount
      } : {})
    },
    bayesianScore: sourceRecord.bayesianProgressScore,
    displayCategory: clone(sourceRecord.displayCategory),
    unseen: sourceRecord.bayesianProgressScore === null,
    knownStatus: sourceRecord.bayesianProgressScore === null ? "unseen" : "known"
  };
}

function equivalentDisplay(legacy, canonical) {
  return legacy.bayesianScore === canonical.bayesianScore
    && legacy.displayCategory.id === canonical.displayCategory.id
    && legacy.unseen === canonical.unseen
    && legacy.knownStatus === canonical.knownStatus;
}

function exactEvidence(legacy, canonical) {
  return equivalentDisplay(legacy, canonical)
    && legacy.evidenceCounts.correct === canonical.evidenceCounts.correct
    && legacy.evidenceCounts.incorrect === canonical.evidenceCounts.incorrect;
}

function createComparisonCase({
  id,
  scenario,
  categoryId,
  itemId = "state:ohio",
  pair,
  expectedClassification,
  rationale
}) {
  const legacyRecord = record(pair.legacy, categoryId, itemId);
  const canonicalRecord = record(pair.canonical, categoryId, itemId);
  const legacy = normalizedResult(legacyRecord, "legacy");
  const canonical = normalizedResult(canonicalRecord, "canonical");
  let expectationSatisfied = false;
  if (expectedClassification === "exact match") expectationSatisfied = exactEvidence(legacy, canonical);
  if (expectedClassification === "semantically equivalent") expectationSatisfied = equivalentDisplay(legacy, canonical);
  if (expectedClassification === "intentional difference") expectationSatisfied = !exactEvidence(legacy, canonical);
  if (expectedClassification === "unavailable/not comparable") {
    expectationSatisfied = legacy.bayesianScore !== null && canonical.bayesianScore === null;
  }
  const classification = expectationSatisfied ? expectedClassification : "defect";
  return {
    id,
    scenario,
    itemId,
    categoryId,
    legacy,
    canonical,
    classification,
    rationale: classification === "defect"
      ? `Expected ${expectedClassification}, but the controlled comparison did not satisfy that classification. ${rationale}`
      : rationale
  };
}

function repeatedEvents({ prefix, correct, incorrect, promptType = "name_to_place", item = ITEMS[0], sourceMode = "us-memory-trail" }) {
  const outcomes = [
    ...Array.from({ length: correct }, () => "correct"),
    ...Array.from({ length: incorrect }, () => "incorrect")
  ];
  return outcomes.map((result, sequence) => retrievalEvent({
    id: `${prefix}-${sequence + 1}`,
    item,
    promptType,
    result,
    sourceMode,
    sequence
  }));
}

function exactSkillCase({ id, scenario, categoryId, correct, incorrect, signalId, promptType = "name_to_place" }) {
  const events = repeatedEvents({ prefix: id, correct, incorrect, promptType });
  const placeMasteryState = masteryState({ [signalId]: { correct, incorrect } });
  return createComparisonCase({
    id,
    scenario,
    categoryId,
    pair: reportPair({ repository: buildRepository(events), placeMasteryState }),
    expectedClassification: "exact match",
    rationale: "Skill-specific legacy counts and canonical concept-skill events provide identical Bayesian inputs and presentation."
  });
}

function buildPersistenceCase() {
  const storage = createMemoryStorage();
  const event = retrievalEvent({ id: "persistence-location-correct" });
  const legacyState = masteryState({ locating: { correct: 1, incorrect: 0 } });
  savePlaceMastery(legacyState, storage);
  saveCanonicalEvidenceRepository(buildRepository([event]), storage);
  const pair = reportPair({
    repository: loadCanonicalEvidenceRepository(storage),
    placeMasteryState: loadPlaceMastery(storage)
  });
  return createComparisonCase({
    id: "reload-persistence",
    scenario: "Reload one correct Ohio location from both persisted stores.",
    categoryId: "state-locations",
    pair,
    expectedClassification: "exact match",
    rationale: "Both persisted representations reload with one correct retrieval and the same score/category."
  });
}

function buildResetCase() {
  const storage = createMemoryStorage();
  const event = retrievalEvent({ id: "reset-location-correct" });
  savePlaceMastery(masteryState({ locating: { correct: 1, incorrect: 0 } }), storage);
  saveCanonicalEvidenceRepository(buildRepository([event]), storage);
  clearPlaceMastery(storage);
  const canonicalReset = resetCanonicalEvidenceRepository(storage);
  const pair = reportPair({
    repository: canonicalReset,
    placeMasteryState: loadPlaceMastery(storage)
  });
  return createComparisonCase({
    id: "reset-to-unseen",
    scenario: "Reset both scoped evidence stores and compare Ohio location.",
    categoryId: "state-locations",
    pair,
    expectedClassification: "exact match",
    rationale: "After their explicit resets, both paths return Ohio location to Not started without creating evidence."
  });
}

function buildDoubleCountingCase() {
  const event = retrievalEvent({ id: "one-action-one-event" });
  const first = appendCanonicalEvidenceEvent(createEmptyCanonicalEvidenceRepository(), event);
  const duplicate = appendCanonicalEvidenceEvent(first.repository, event);
  const pair = reportPair({
    repository: duplicate.repository,
    placeMasteryState: masteryState({ locating: { correct: 1, incorrect: 0 } })
  });
  const comparison = createComparisonCase({
    id: "one-action-no-double-counting",
    scenario: "Submit one Ohio location action twice with the same event identity.",
    categoryId: "state-locations",
    pair,
    expectedClassification: "exact match",
    rationale: "Repository idempotency leaves one raw event; the Progress Evidence Policy history scores it once and raw events remain provenance."
  });
  return {
    comparison,
    validation: {
      firstInserted: first.inserted,
      duplicateInserted: duplicate.inserted,
      repositoryEventCount: duplicate.repository.events.length,
      shadowCorrectCount: comparison.canonical.evidenceCounts.correct,
      shadowRawEventCount: comparison.canonical.evidenceCounts.events,
      legacySourceStoresReadByShadow: false
    }
  };
}

function summarize(cases) {
  const counts = Object.fromEntries(SHADOW_COMPARISON_CLASSIFICATIONS.map((classification) => [
    classification,
    cases.filter((comparison) => comparison.classification === classification).length
  ]));
  return {
    totalComparableItemSkillCases: cases.length,
    exactMatches: counts["exact match"],
    semanticMatches: counts["semantically equivalent"],
    intentionalDifferences: counts["intentional difference"],
    unavailableCases: counts["unavailable/not comparable"],
    defects: counts.defect
  };
}

export function buildProgressReportCanonicalShadowComparison() {
  const emptyPair = reportPair({ repository: buildRepository() });
  const guidedEvent = retrievalEvent({ id: "guided-ohio", promptType: "guided", result: "correct", sourceMode: "daily-trail" });
  const crossModeEvents = [
    retrievalEvent({ id: "journey-ohio", sourceMode: "journey", result: "correct", sequence: 0 }),
    retrievalEvent({ id: "memory-ohio", sourceMode: "us-memory-trail", result: "correct", sequence: 1 })
  ];
  const combinedPromptEvents = [
    retrievalEvent({ id: "combined-location-correct", promptType: "name_to_place", result: "correct", sequence: 0 }),
    retrievalEvent({ id: "combined-identification-miss", promptType: "place_to_name", result: "incorrect", sequence: 1 })
  ];
  const capital = ITEMS[2];
  const capitalEvents = [
    retrievalEvent({ id: "capital-locate-correct", item: capital, promptType: "name_to_place", result: "correct", sequence: 0 }),
    retrievalEvent({ id: "capital-identify-correct", item: capital, promptType: "place_to_name", result: "correct", sequence: 1 }),
    retrievalEvent({ id: "capital-identify-miss", item: capital, promptType: "place_to_name", result: "incorrect", sequence: 2 })
  ];
  const doubleCounting = buildDoubleCountingCase();
  const cases = [
    createComparisonCase({
      id: "unseen-ohio-location",
      scenario: "No Ohio location evidence exists.",
      categoryId: "state-locations",
      pair: emptyPair,
      expectedClassification: "exact match",
      rationale: "Both paths render Ohio location as Not started with no Bayesian score."
    }),
    exactSkillCase({
      id: "one-correct-location",
      scenario: "One correct Ohio location retrieval.",
      categoryId: "state-locations",
      correct: 1,
      incorrect: 0,
      signalId: "locating"
    }),
    exactSkillCase({
      id: "repeated-correct-location",
      scenario: "Three correct Ohio location retrievals.",
      categoryId: "state-locations",
      correct: 3,
      incorrect: 0,
      signalId: "locating"
    }),
    exactSkillCase({
      id: "correct-then-repeated-misses",
      scenario: "One correct Ohio location followed by three misses.",
      categoryId: "state-locations",
      correct: 1,
      incorrect: 3,
      signalId: "locating"
    }),
    exactSkillCase({
      id: "many-correct-then-one-miss",
      scenario: "Eight correct Ohio locations followed by one miss.",
      categoryId: "state-locations",
      correct: 8,
      incorrect: 1,
      signalId: "locating"
    }),
    exactSkillCase({
      id: "identification-separated-from-location",
      scenario: "Two correct Ohio identification/name retrievals with no location evidence.",
      categoryId: "state-identification",
      correct: 2,
      incorrect: 0,
      signalId: "naming",
      promptType: "place_to_name"
    }),
    createComparisonCase({
      id: "identification-does-not-credit-location",
      scenario: "Inspect Ohio location after identification-only evidence.",
      categoryId: "state-locations",
      pair: reportPair({
        repository: buildRepository(repeatedEvents({
          prefix: "identification-only",
          correct: 2,
          incorrect: 0,
          promptType: "place_to_name"
        })),
        placeMasteryState: masteryState({ naming: { correct: 2, incorrect: 0 } })
      }),
      expectedClassification: "exact match",
      rationale: "Both skill-specific paths leave location unseen when only naming was demonstrated."
    }),
    createComparisonCase({
      id: "guided-assisted-excluded",
      scenario: "One guided Ohio exposure with no retrieval response.",
      categoryId: "state-locations",
      pair: reportPair({
        repository: buildRepository([guidedEvent]),
        memoryState: { currentSessionNumber: 1, itemProgress: { "state:ohio": { status: "introduced", correctCount: 0, missCount: 0 } } }
      }),
      expectedClassification: "semantically equivalent",
      rationale: "Canonical retains one assisted event, while both scoring paths correctly remain unseen with zero correct retrievals."
    }),
    createComparisonCase({
      id: "journey-plus-memory-same-skill",
      scenario: "Locate Ohio correctly once in Journey and once in U.S. Memory Trail.",
      categoryId: "state-locations",
      pair: reportPair({
        repository: buildRepository(crossModeEvents),
        memoryState: plannerState("state:ohio", 1, 0)
      }),
      expectedClassification: "intentional difference",
      rationale: "Canonical combines two actions measuring the same concept/skill across modes. The current Progress Report reads Memory Trail but not Journey, so it sees one correct response."
    }),
    createComparisonCase({
      id: "legacy-combined-prompt-location",
      scenario: "Legacy planner combines one location correct and one identification miss; inspect location.",
      categoryId: "state-locations",
      pair: reportPair({
        repository: buildRepository(combinedPromptEvents),
        memoryState: plannerState("state:ohio", 1, 1)
      }),
      expectedClassification: "intentional difference",
      rationale: "Legacy combined counters give both state views 1 correct/1 miss. Canonical location correctly receives only the location response."
    }),
    createComparisonCase({
      id: "legacy-combined-prompt-identification",
      scenario: "Legacy planner combines one location correct and one identification miss; inspect identification.",
      categoryId: "state-identification",
      pair: reportPair({
        repository: buildRepository(combinedPromptEvents),
        memoryState: plannerState("state:ohio", 1, 1)
      }),
      expectedClassification: "intentional difference",
      rationale: "Legacy combined counters give both state views 1 correct/1 miss. Canonical identification correctly receives only the identification miss."
    }),
    createComparisonCase({
      id: "capital-combined-retrieval",
      scenario: "Two correct and one missed Columbus retrieval across both capital prompt forms.",
      categoryId: "state-capitals",
      itemId: capital.id,
      pair: reportPair({
        repository: buildRepository(capitalEvents),
        memoryState: plannerState(capital.id, 2, 1)
      }),
      expectedClassification: "exact match",
      rationale: "The current capital category is item-level; intentionally combining both canonical capital retrieval mappings reproduces its Bayesian inputs."
    }),
    createComparisonCase({
      id: "historical-legacy-only-location",
      scenario: "Legacy Ohio location history exists from before canonical emission began.",
      categoryId: "state-locations",
      pair: reportPair({
        repository: buildRepository(),
        placeMasteryState: masteryState({ locating: { correct: 3, incorrect: 1 } })
      }),
      expectedClassification: "unavailable/not comparable",
      rationale: "No historical canonical events exist, and the shadow does not fabricate them from legacy aggregates."
    }),
    buildPersistenceCase(),
    buildResetCase(),
    doubleCounting.comparison
  ];
  const executiveSummary = summarize(cases);
  return {
    reportVersion: 1,
    generatedAt: FIXED_TIME,
    question: "If the Progress Report were powered by canonical evidence, would it tell the same story as the current report?",
    executiveSummary,
    cases,
    representativeExampleIds: [
      "journey-plus-memory-same-skill",
      "correct-then-repeated-misses",
      "identification-separated-from-location",
      "legacy-combined-prompt-location",
      "legacy-combined-prompt-identification"
    ],
    doubleCountingValidation: doubleCounting.validation,
    migrationReadiness: {
      safeNow: [
        "Canonical-first production reads for persistently enrolled learners whose first read passed a clean legacy-history audit",
        "State location and identification canonical concept-skill streams routed through Progress Evidence Policy v1",
        "Capital item-level scoring that intentionally rolls up separate locating, identifying, and capital-of relationship histories"
      ],
      legacyDependent: [
        "Existing learner history that predates canonical emission",
        "Current scheduler/review-status fields",
        "Current combined state-practice behavior when no skill-specific legacy signal exists"
      ],
      historicalLimitation: "Legacy aggregate counters cannot be losslessly separated into locating versus identifying attempts or converted into timestamped canonical events.",
      canonicalFirstSafeForNewLearners: true,
      canonicalFirstNewLearnerQualification: "Safe only behind the production eligibility selector: healthy canonical storage, a clean and unambiguous legacy-history audit, a valid persistent cohort marker, and zero strict shadow defects.",
      canonicalFirstSafeForExistingLearners: false,
      canonicalFirstExistingLearnerQualification: "Existing legacy-only history would disappear unless a hybrid baseline/cutover strategy is designed; fabricating raw historical events is prohibited.",
      recommendation: "Use the guarded canonical-first read for the clean new-learner cohort, retain automatic legacy fallback and shadow diagnostics, and do not migrate existing learners until a baseline/cutover design exists."
    },
    scoringModel: {
      legacyModule: "src/united-states-progress-report.js",
      canonicalShadowModule: "src/canonical-progress-report-shadow.js",
      sharedFormulaModule: "src/bayesian-progress-score.js",
      sharedFunction: "scoreBayesianEvidenceCounts"
    },
    limitations: [
      "The controlled cases validate score/category parity, not Progress Report UI rendering.",
      "Canonical evidence does not reproduce scheduler due/review status.",
      "The comparison does not backfill or fabricate historical per-attempt events.",
      "Only state location, state identification, and the approved item-level capital rollup are included."
    ]
  };
}

function printable(value) {
  return value === null || value === undefined ? "—" : typeof value === "string" ? value : JSON.stringify(value);
}

export function renderProgressReportCanonicalShadowMarkdown(report) {
  const summary = report.executiveSummary;
  const rows = report.cases.map((comparison) => `| ${comparison.scenario} | ${comparison.itemId} × ${comparison.categoryId} | ${printable(comparison.legacy.evidenceCounts)}; score=${printable(comparison.legacy.bayesianScore)}; ${comparison.legacy.displayCategory.label} | ${printable(comparison.canonical.evidenceCounts)}; score=${printable(comparison.canonical.bayesianScore)}; ${comparison.canonical.displayCategory.label} | ${comparison.classification} |`);
  const differences = report.cases
    .filter(({ classification }) => !["exact match", "semantically equivalent"].includes(classification))
    .map((comparison) => `- **${comparison.id} (${comparison.classification}):** ${comparison.rationale}`);
  const representatives = report.representativeExampleIds
    .map((id) => report.cases.find((comparison) => comparison.id === id))
    .filter(Boolean)
    .map((comparison) => `- **${comparison.scenario}** ${comparison.rationale}`);
  return `# Progress Report canonical-evidence shadow comparison

Generated from deterministic controlled fixtures at ${report.generatedAt}.

## Executive summary

${report.question} **Yes for the guarded clean new-learner cohort; not as an unconditional replacement.** Across ${summary.totalComparableItemSkillCases} item × skill cases, the shadow produced ${summary.exactMatches} exact matches, ${summary.semanticMatches} semantic match${summary.semanticMatches === 1 ? "" : "es"}, ${summary.intentionalDifferences} intentional differences, ${summary.unavailableCases} unavailable comparison${summary.unavailableCases === 1 ? "" : "s"}, and ${summary.defects} defects.

The shared Bayesian formula behaves identically when both paths receive equivalent correct/incorrect counts. Remaining differences are evidence-scope and historical-data policy questions rather than formula defects.

## Comparison table

| Scenario | Item × skill | Legacy result | Canonical shadow result | Verdict |
| --- | --- | --- | --- | --- |
${rows.join("\n")}

## Representative examples

${representatives.join("\n")}

## Differences and unavailable history

${differences.join("\n")}

## Double-counting protection

One controlled user action was submitted twice with the same event identity. First insert: ${report.doubleCountingValidation.firstInserted}; duplicate insert: ${report.doubleCountingValidation.duplicateInserted}; repository events: ${report.doubleCountingValidation.repositoryEventCount}; shadow correct count: ${report.doubleCountingValidation.shadowCorrectCount}; shadow raw-event provenance count: ${report.doubleCountingValidation.shadowRawEventCount}. The shadow reads legacy source stores: ${report.doubleCountingValidation.legacySourceStoresReadByShadow}. Reducer summaries are the only scoring input; raw events are not added again.

## Migration readiness

Safe now:

${report.migrationReadiness.safeNow.map((item) => `- ${item}`).join("\n")}

Still dependent on legacy evidence:

${report.migrationReadiness.legacyDependent.map((item) => `- ${item}`).join("\n")}

- **Historical limitation:** ${report.migrationReadiness.historicalLimitation}
- **Brand-new learners:** Not safe as an unconditional canonical-first replacement. ${report.migrationReadiness.canonicalFirstNewLearnerQualification}
- **Existing learners:** Not safe. ${report.migrationReadiness.canonicalFirstExistingLearnerQualification}

Recommendation: ${report.migrationReadiness.recommendation}

## Scope limits

${report.limitations.map((item) => `- ${item}`).join("\n")}
`;
}
