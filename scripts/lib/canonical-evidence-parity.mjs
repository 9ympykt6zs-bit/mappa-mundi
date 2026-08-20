import {
  adaptCanonicalMapReconstructionEvaluation,
  adaptCanonicalMentalMapEvaluation,
  adaptCanonicalRetrievalAttempt,
  getCanonicalMentalMapConceptId
} from "../../src/canonical-learning-evidence.js";
import {
  appendCanonicalEvidenceEvent,
  createEmptyCanonicalEvidenceRepository,
  getCanonicalEvidenceConceptSkillSummaries,
  loadCanonicalEvidenceRepository,
  recordCanonicalEvidenceEvents,
  saveCanonicalEvidenceRepository
} from "../../src/canonical-learning-evidence-repository.js";
import { ActivitySession } from "../../src/maplibre/activity-session.js";
import { evaluateMentalMapAnswer } from "../../src/atlas/mental-map-challenge-engine.js";
import { getMentalMapChallenges } from "../../src/atlas/mental-map-challenges.js";
import {
  applyUnitedStatesMemoryTrailSessionResults,
  createUnitedStatesMemoryTrailState,
  loadUnitedStatesMemoryTrailProgress,
  saveUnitedStatesMemoryTrailProgress
} from "../../src/united-states-memory-trail-planner.js";
import {
  applyDailyTrailSessionResults,
  createDailyTrailState
} from "../../src/daily-trail-planner.js";

export const PARITY_CLASSIFICATIONS = Object.freeze([
  "match",
  "intentional difference",
  "unavailable/not comparable",
  "defect"
]);

const FIXED_TIME = "2034-02-03T15:30:00.000Z";
const OHIO_ITEM = Object.freeze({
  id: "state:ohio",
  type: "state",
  category: "states",
  targetId: "ohio",
  label: "Ohio",
  sourceActivityId: "us-states-05",
  homeActivityId: "us-states-05",
  homeStepIndex: 4,
  order: 0
});

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

export function createMemoryStorage(initial = {}) {
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
    },
    snapshot() {
      return Object.fromEntries(values);
    }
  };
}

function comparable(field, legacyValue, canonicalValue, explanation = "Equivalent measurements agree.") {
  return {
    field,
    legacyValue: clone(legacyValue),
    canonicalValue: clone(canonicalValue),
    classification: JSON.stringify(legacyValue) === JSON.stringify(canonicalValue) ? "match" : "defect",
    explanation
  };
}

function classified(field, legacyValue, canonicalValue, classification, explanation) {
  if (!PARITY_CLASSIFICATIONS.includes(classification)) {
    throw new TypeError(`Unknown parity classification: ${classification}`);
  }
  return { field, legacyValue: clone(legacyValue), canonicalValue: clone(canonicalValue), classification, explanation };
}

function scenarioVerdict(comparisons) {
  if (comparisons.some(({ classification }) => classification === "defect")) return "defect";
  if (comparisons.some(({ classification }) => classification === "intentional difference")) return "intentional difference";
  if (comparisons.every(({ classification }) => classification === "unavailable/not comparable")) {
    return "unavailable/not comparable";
  }
  return "match";
}

export function validateEvidenceParityScenario({
  id,
  mode,
  action,
  legacy,
  canonicalEvents = [],
  comparisons = [],
  expectedCanonicalEventCount
}) {
  const safeEvents = clone(canonicalEvents);
  const eventCountComparison = expectedCanonicalEventCount === undefined
    ? []
    : [comparable(
      "evidence event count",
      expectedCanonicalEventCount,
      safeEvents.length,
      safeEvents.length < expectedCanonicalEventCount
        ? "Legacy state changed for an evidence-bearing action, but canonical evidence is missing."
        : safeEvents.length > expectedCanonicalEventCount
          ? "More than one canonical event was emitted for a single expected evidence unit."
          : "The canonical stream contains exactly one event per expected evidence unit."
    )];
  const allComparisons = [...eventCountComparison, ...clone(comparisons)];
  return {
    id,
    mode,
    action,
    legacy: clone(legacy),
    canonical: {
      eventCount: safeEvents.length,
      events: safeEvents,
      derivedSummary: getCanonicalEvidenceConceptSkillSummaries({
        ...createEmptyCanonicalEvidenceRepository(),
        events: safeEvents
      })
    },
    comparisons: allComparisons,
    verdict: scenarioVerdict(allComparisons)
  };
}

function retrievalEvent({ id, sourceMode, result, promptType = "name_to_place", sequence = 0, item = OHIO_ITEM }) {
  return adaptCanonicalRetrievalAttempt({
    item,
    promptType,
    result,
    eventId: id,
    attemptId: `${id}:attempt`,
    occurredAt: new Date(Date.parse(FIXED_TIME) + (sequence * 1000)).toISOString(),
    sourceMode,
    sourceActivityId: item.sourceActivityId,
    sessionId: `${sourceMode}:parity-session`,
    sequence
  });
}

function buildJourneyScenarios() {
  const activity = {
    id: OHIO_ITEM.sourceActivityId,
    sequence: 5,
    visibleAnswerLimit: 1,
    targets: [{ id: "ohio", name: "Ohio" }]
  };

  const correctSession = new ActivitySession(activity);
  correctSession.toggleAnswer("ohio");
  const correctResult = correctSession.tryAnswer("ohio");
  const correctEvent = retrievalEvent({ id: "journey-ohio-correct", sourceMode: "journey", result: correctResult.status });
  const correct = validateEvidenceParityScenario({
    id: "journey-locate-ohio-correct",
    mode: "Journey",
    action: "Select Ohio, then place it on Ohio.",
    legacy: {
      source: "src/maplibre/activity-session.js (ActivitySession)",
      itemId: correctResult.completedId,
      behavior: "locate Ohio",
      attempts: 1,
      correct: 1,
      incorrect: 0,
      completedIds: correctResult.completedIds
    },
    canonicalEvents: [correctEvent],
    expectedCanonicalEventCount: 1,
    comparisons: [
      comparable("item ID", correctResult.completedId, correctEvent.conceptId.replace("state-location:", "")),
      comparable("skill/behavior", "locating", correctEvent.skillId),
      comparable("correct", 1, Number(correctEvent.outcome === "correct"))
    ]
  });

  const incorrectSession = new ActivitySession(activity);
  incorrectSession.toggleAnswer("ohio");
  const incorrectResult = incorrectSession.tryAnswer("michigan");
  const incorrectEvent = retrievalEvent({ id: "journey-ohio-incorrect", sourceMode: "journey", result: incorrectResult.status });
  const incorrect = validateEvidenceParityScenario({
    id: "journey-locate-ohio-incorrect",
    mode: "Journey",
    action: "Select Ohio, then place it on Michigan.",
    legacy: {
      source: "src/maplibre/activity-session.js (ActivitySession)",
      itemId: incorrectResult.selectedId,
      behavior: "locate Ohio",
      attempts: 1,
      correct: 0,
      incorrect: 1,
      selectedTargetId: incorrectResult.targetId
    },
    canonicalEvents: [incorrectEvent],
    expectedCanonicalEventCount: 1,
    comparisons: [
      comparable("item ID", incorrectResult.selectedId, incorrectEvent.conceptId.replace("state-location:", "")),
      comparable("skill/behavior", "locating", incorrectEvent.skillId),
      comparable("incorrect", 1, Number(incorrectEvent.outcome === "incorrect"))
    ]
  });
  return [correct, incorrect];
}

function buildMemoryTrailScenario() {
  const item = clone(OHIO_ITEM);
  const plan = {
    sessionId: "us-memory-trail:parity-session",
    sessionType: "learning-session",
    newItems: [item],
    reviewItems: [],
    playItems: [item],
    allItems: [item]
  };
  const before = createUnitedStatesMemoryTrailState({}, plan.allItems, { now: FIXED_TIME });
  const beforeSnapshot = clone(before);
  const legacyState = applyUnitedStatesMemoryTrailSessionResults(before, plan, {
    completedTargetIds: ["ohio"],
    missesByTargetId: { ohio: 2 },
    correctCount: 1,
    incorrectCount: 2
  });
  const progress = legacyState.itemProgress[item.id];
  const events = [
    retrievalEvent({ id: "memory-ohio-miss-1", sourceMode: "us-memory-trail", result: "incorrect", sequence: 0 }),
    retrievalEvent({ id: "memory-ohio-miss-2", sourceMode: "us-memory-trail", result: "incorrect", sequence: 1 }),
    retrievalEvent({ id: "memory-ohio-correct-1", sourceMode: "us-memory-trail", result: "correct", sequence: 2 })
  ];
  return {
    scenario: validateEvidenceParityScenario({
      id: "memory-trail-locate-ohio-repeated-misses",
      mode: "U.S. Memory Trail",
      action: "Miss Ohio twice, then locate Ohio correctly.",
      legacy: {
        source: "src/united-states-memory-trail-planner.js (itemProgress + lastSessionSummary)",
        itemId: item.id,
        behavior: "combined session result for Ohio",
        attempts: progress.correctCount + progress.missCount,
        correct: progress.correctCount,
        incorrect: progress.missCount,
        timesSeen: progress.timesSeen,
        sessionId: plan.sessionId
      },
      canonicalEvents: events,
      expectedCanonicalEventCount: 3,
      comparisons: [
        comparable("concept ID", "state-location:ohio", events[0].conceptId),
        comparable("skill ID", "locating", events[0].skillId),
        comparable("correct", progress.correctCount, events.filter(({ outcome }) => outcome === "correct").length),
        comparable("incorrect/misses", progress.missCount, events.filter(({ outcome }) => outcome === "incorrect").length),
        classified(
          "times seen vs raw attempts",
          progress.timesSeen,
          events.length,
          "intentional difference",
          "The legacy planner increments timesSeen once per practiced item per completed session; canonical evidence retains each response."
        ),
        classified(
          "timestamp",
          null,
          events.at(-1).occurredAt,
          "unavailable/not comparable",
          "This legacy planner stores session numbers rather than per-response timestamps."
        )
      ]
    }),
    fixtureUnchanged: JSON.stringify(before) === JSON.stringify(beforeSnapshot)
  };
}

function buildRepeatedCorrectScenario() {
  const item = clone(OHIO_ITEM);
  const plan = {
    sessionId: "us-memory-trail:repeated-correct",
    sessionType: "review-session",
    newItems: [],
    reviewItems: [item],
    playItems: [item],
    allItems: [item]
  };
  const first = applyUnitedStatesMemoryTrailSessionResults(
    createUnitedStatesMemoryTrailState({}, [item], { now: FIXED_TIME }),
    plan,
    { completedTargetIds: ["ohio"], correctCount: 1, incorrectCount: 0 }
  );
  const legacyState = applyUnitedStatesMemoryTrailSessionResults(
    first,
    plan,
    { completedTargetIds: ["ohio"], correctCount: 1, incorrectCount: 0 }
  );
  const progress = legacyState.itemProgress[item.id];
  const events = [
    retrievalEvent({ id: "memory-ohio-repeat-correct-1", sourceMode: "us-memory-trail", result: "correct", sequence: 0 }),
    retrievalEvent({ id: "memory-ohio-repeat-correct-2", sourceMode: "us-memory-trail", result: "correct", sequence: 1 })
  ];
  return validateEvidenceParityScenario({
    id: "memory-trail-locate-ohio-repeated-correct",
    mode: "U.S. Memory Trail",
    action: "Locate Ohio correctly in two consecutive sessions.",
    legacy: {
      source: "src/united-states-memory-trail-planner.js (itemProgress)",
      itemId: item.id,
      attempts: progress.correctCount + progress.missCount,
      correct: progress.correctCount,
      incorrect: progress.missCount,
      timesSeen: progress.timesSeen
    },
    canonicalEvents: events,
    expectedCanonicalEventCount: 2,
    comparisons: [
      comparable("concept ID", "state-location:ohio", events[0].conceptId),
      comparable("skill ID", "locating", events[0].skillId),
      comparable("attempts", progress.correctCount + progress.missCount, events.length),
      comparable("correct", progress.correctCount, events.filter(({ outcome }) => outcome === "correct").length),
      comparable("incorrect", progress.missCount, events.filter(({ outcome }) => outcome === "incorrect").length)
    ]
  });
}

function buildDailyTrailScenarios() {
  const item = { ...clone(OHIO_ITEM), id: "world-core:state:ohio", trailGoalId: "world-core" };
  const plan = {
    trailGoalId: "world-core",
    sessionType: "learning-session",
    newItems: [item],
    reviewItems: [],
    playItems: [item],
    allItems: [item]
  };
  const before = createDailyTrailState({}, { now: FIXED_TIME });
  const beforeSnapshot = clone(before);
  const legacyState = applyDailyTrailSessionResults(before, plan, {
    completedTargetIds: ["ohio"],
    missesByTargetId: { ohio: 1 },
    correctCount: 1,
    incorrectCount: 1
  }, { now: FIXED_TIME });
  const progress = legacyState.itemProgress[item.id];
  const events = [
    retrievalEvent({ id: "daily-ohio-miss", sourceMode: "daily-trail", result: "incorrect", sequence: 0, item }),
    retrievalEvent({ id: "daily-ohio-correct", sourceMode: "daily-trail", result: "correct", sequence: 1, item })
  ];
  const retrieval = validateEvidenceParityScenario({
    id: "daily-trail-locate-ohio",
    mode: "Daily Trail",
    action: "Miss Ohio once, then locate Ohio correctly.",
    legacy: {
      source: "src/daily-trail-planner.js (itemProgress)",
      itemId: item.id,
      behavior: "combined session result for Ohio",
      attempts: progress.correctCount + progress.missCount,
      correct: progress.correctCount,
      incorrect: progress.missCount,
      timesSeen: progress.timesSeen
    },
    canonicalEvents: events,
    expectedCanonicalEventCount: 2,
    comparisons: [
      comparable("concept ID", "state-location:ohio", events[0].conceptId),
      comparable("skill ID", "locating", events[0].skillId),
      comparable("correct", progress.correctCount, events.filter(({ outcome }) => outcome === "correct").length),
      comparable("incorrect/misses", progress.missCount, events.filter(({ outcome }) => outcome === "incorrect").length),
      classified(
        "times seen vs raw attempts",
        progress.timesSeen,
        events.length,
        "intentional difference",
        "Daily Trail persists one timesSeen increment per practiced item per session, while canonical evidence retains both responses."
      )
    ]
  });

  const assistedEvent = retrievalEvent({
    id: "daily-ohio-guided",
    sourceMode: "daily-trail",
    result: "correct",
    promptType: "guided",
    sequence: 2,
    item
  });
  const assisted = validateEvidenceParityScenario({
    id: "daily-trail-guided-ohio",
    mode: "Daily Trail",
    action: "Use the guided Ohio exposure.",
    legacy: {
      source: "src/maplibre-poc.js (updateMemoryTrailStats guided branch)",
      itemId: item.id,
      behavior: "guided exposure",
      retrievalAttempts: 0,
      retrievalCorrect: 0,
      guidedTapCount: 1
    },
    canonicalEvents: [assistedEvent],
    expectedCanonicalEventCount: 1,
    comparisons: [
      comparable("canonical correct retrieval", 0, Number(assistedEvent.outcome === "correct")),
      comparable("assisted exposure", 1, Number(assistedEvent.outcome === "assisted")),
      classified(
        "legacy persisted raw attempt",
        "runtime-only guided counter",
        "durable assisted event",
        "intentional difference",
        "The planner aggregate records introduction separately; the canonical repository durably preserves the assisted exposure without retrieval credit."
      )
    ]
  });
  return { scenarios: [retrieval, assisted], fixtureUnchanged: JSON.stringify(before) === JSON.stringify(beforeSnapshot) };
}

function buildSkillSeparationScenario() {
  const locating = retrievalEvent({ id: "skill-locate-ohio", sourceMode: "us-memory-trail", result: "correct" });
  const identifying = retrievalEvent({
    id: "skill-identify-ohio",
    sourceMode: "us-memory-trail",
    result: "correct",
    promptType: "place_to_name",
    sequence: 1
  });
  return validateEvidenceParityScenario({
    id: "ohio-skill-separation",
    mode: "U.S. Memory Trail",
    action: "Answer one locate prompt and one identify/name prompt for Ohio.",
    legacy: {
      source: "src/maplibre-poc.js (nameToPlace*/placeToName* targetStats)",
      itemId: OHIO_ITEM.id,
      locatingAttempts: 1,
      identifyingAttempts: 1
    },
    canonicalEvents: [locating, identifying],
    expectedCanonicalEventCount: 2,
    comparisons: [
      comparable("locating concept", "state-location:ohio", locating.conceptId),
      comparable("locating skill", "locating", locating.skillId),
      comparable("identifying concept", "state-naming:ohio", identifying.conceptId),
      comparable("identifying skill", "identifying", identifying.skillId),
      comparable("concepts remain distinct", true, locating.conceptId !== identifying.conceptId)
    ]
  });
}

function buildMentalMapScenario() {
  const challenge = getMentalMapChallenges({ includeGenerated: false })
    .find(({ id }) => id === "lake-erie-all");
  const partialEvaluation = evaluateMentalMapAnswer(challenge, ["ohio", "pennsylvania"]);
  const correctEvaluation = evaluateMentalMapAnswer(challenge, challenge.correctStateIds);
  const partialEvent = adaptCanonicalMentalMapEvaluation({
    challenge,
    evaluation: partialEvaluation,
    conceptId: getCanonicalMentalMapConceptId(challenge),
    eventId: "mental-map-lake-erie-partial",
    attemptId: "mental-map-lake-erie-partial:attempt",
    occurredAt: FIXED_TIME,
    sourceMode: "mental-map",
    sourceActivityId: challenge.id
  });
  const correctEvent = adaptCanonicalMentalMapEvaluation({
    challenge,
    evaluation: correctEvaluation,
    conceptId: getCanonicalMentalMapConceptId(challenge),
    eventId: "mental-map-lake-erie-correct",
    attemptId: "mental-map-lake-erie-correct:attempt",
    occurredAt: new Date(Date.parse(FIXED_TIME) + 1000).toISOString(),
    sourceMode: "mental-map",
    sourceActivityId: challenge.id
  });
  return validateEvidenceParityScenario({
    id: "mental-map-lake-erie-relationship",
    mode: "Mental Map",
    action: "Submit a partial Lake Erie set, then the complete correct set.",
    legacy: {
      source: "src/atlas/mental-map-challenge-engine.js (evaluateMentalMapAnswer)",
      itemId: challenge.id,
      behavior: "relationship recall",
      outcomes: [partialEvaluation.isCorrect ? "correct" : "partial", correctEvaluation.isCorrect ? "correct" : "partial"],
      credit: [
        { earned: partialEvaluation.score, possible: partialEvaluation.maxScore },
        { earned: correctEvaluation.score, possible: correctEvaluation.maxScore }
      ]
    },
    canonicalEvents: [partialEvent, correctEvent],
    expectedCanonicalEventCount: 2,
    comparisons: [
      comparable("skill ID", "relationship-recall", partialEvent.skillId),
      comparable("outcomes", ["partial", "correct"], [partialEvent.outcome, correctEvent.outcome]),
      comparable("partial credit", { earned: partialEvaluation.score, possible: partialEvaluation.maxScore }, partialEvent.credit),
      comparable("source activity", challenge.id, partialEvent.sourceActivityId)
    ]
  });
}

function buildReconstructionScenario() {
  const evaluation = {
    regionId: "rebuild-great-lakes",
    placements: {
      ohio: { status: "close", distanceRatio: 0.31, vectorErrorRatio: 0.28, adjacencyRatio: 0.12 },
      michigan: { status: "well-placed", distanceRatio: 0.11, vectorErrorRatio: 0.1, adjacencyRatio: 0.05 }
    }
  };
  const events = adaptCanonicalMapReconstructionEvaluation({
    evaluation,
    eventIdPrefix: "reconstruction-great-lakes-parity",
    attemptId: "reconstruction-great-lakes-parity:attempt",
    occurredAt: FIXED_TIME,
    sourceMode: "map-reconstruction",
    sourceActivityId: evaluation.regionId
  });
  return validateEvidenceParityScenario({
    id: "reconstruction-partial-and-correct",
    mode: "Map Reconstruction",
    action: "Submit Ohio close and Michigan well placed.",
    legacy: {
      source: "src/atlas/map-reconstruction-evaluation.js (evaluation.placements)",
      itemIds: Object.keys(evaluation.placements),
      behavior: "spatial reconstruction",
      placementStatuses: Object.values(evaluation.placements).map(({ status }) => status)
    },
    canonicalEvents: events,
    expectedCanonicalEventCount: 2,
    comparisons: [
      comparable("concept IDs", ["state-reconstruction:ohio", "state-reconstruction:michigan"], events.map(({ conceptId }) => conceptId)),
      comparable("skill IDs", ["spatial-reconstruction", "spatial-reconstruction"], events.map(({ skillId }) => skillId)),
      comparable("outcomes", ["partial", "correct"], events.map(({ outcome }) => outcome)),
      comparable("source activity", evaluation.regionId, events[0].sourceActivityId)
    ]
  });
}

function buildDuplicateScenario() {
  const event = retrievalEvent({ id: "duplicate-ohio-action", sourceMode: "journey", result: "correct" });
  const first = appendCanonicalEvidenceEvent(createEmptyCanonicalEvidenceRepository(), event);
  const second = appendCanonicalEvidenceEvent(first.repository, event);
  return validateEvidenceParityScenario({
    id: "duplicate-protection-single-action",
    mode: "Canonical repository",
    action: "Submit the same action event through overlapping wiring twice.",
    legacy: {
      source: "controlled action fixture",
      itemId: OHIO_ITEM.id,
      evidenceBearingActions: 1
    },
    canonicalEvents: second.repository.events,
    expectedCanonicalEventCount: 1,
    comparisons: [
      comparable("first write inserted", true, first.inserted),
      comparable("second write rejected as duplicate", false, second.inserted),
      comparable("durable event count", 1, second.repository.events.length)
    ]
  });
}

function buildPersistenceScenario() {
  const storage = createMemoryStorage();
  const priorLocalStorage = globalThis.localStorage;
  globalThis.localStorage = storage;
  try {
    const item = clone(OHIO_ITEM);
    const plan = {
      sessionId: "us-memory-trail:persistence",
      sessionType: "learning-session",
      newItems: [item],
      reviewItems: [],
      playItems: [item],
      allItems: [item]
    };
    const legacyState = applyUnitedStatesMemoryTrailSessionResults(
      createUnitedStatesMemoryTrailState({}, [item], { now: FIXED_TIME }),
      plan,
      { completedTargetIds: ["ohio"], correctCount: 1, incorrectCount: 0 }
    );
    saveUnitedStatesMemoryTrailProgress(legacyState, [item]);
    const event = retrievalEvent({ id: "persistence-ohio", sourceMode: "us-memory-trail", result: "correct" });
    const repository = createEmptyCanonicalEvidenceRepository();
    const inserted = appendCanonicalEvidenceEvent(repository, event).repository;
    saveCanonicalEvidenceRepository(inserted, storage);

    const legacyReloaded = loadUnitedStatesMemoryTrailProgress([item]);
    const canonicalReloaded = loadCanonicalEvidenceRepository(storage);
    const progress = legacyReloaded.itemProgress[item.id];
    return validateEvidenceParityScenario({
      id: "reload-persistence-parity",
      mode: "U.S. Memory Trail + canonical repository",
      action: "Record correct Ohio evidence, persist both stores, and reload.",
      legacy: {
        source: "mappaUnitedStatesMemoryTrailProgress",
        itemId: item.id,
        correct: progress.correctCount,
        incorrect: progress.missCount,
        currentSessionNumber: legacyReloaded.currentSessionNumber
      },
      canonicalEvents: canonicalReloaded.events,
      expectedCanonicalEventCount: 1,
      comparisons: [
        comparable("correct after reload", progress.correctCount, canonicalReloaded.events.filter(({ outcome }) => outcome === "correct").length),
        comparable("incorrect after reload", progress.missCount, canonicalReloaded.events.filter(({ outcome }) => outcome === "incorrect").length),
        comparable("concept after reload", "state-location:ohio", canonicalReloaded.events[0]?.conceptId),
        comparable("canonical repository status", "ready", canonicalReloaded.status.code)
      ]
    });
  } finally {
    if (priorLocalStorage === undefined) delete globalThis.localStorage;
    else globalThis.localStorage = priorLocalStorage;
  }
}

function summarizeScenarios(scenarios) {
  const comparisons = scenarios.flatMap(({ comparisons: values }) => values);
  const comparisonResults = Object.fromEntries(PARITY_CLASSIFICATIONS.map((classification) => [
    classification,
    comparisons.filter((comparison) => comparison.classification === classification).length
  ]));
  const scenarioVerdicts = Object.fromEntries(PARITY_CLASSIFICATIONS.map((classification) => [
    classification,
    scenarios.filter(({ verdict }) => verdict === classification).length
  ]));
  return {
    totalScenarios: scenarios.length,
    matches: comparisonResults.match,
    intentionalDifferences: comparisonResults["intentional difference"],
    unavailableComparisons: comparisonResults["unavailable/not comparable"],
    defects: comparisonResults.defect,
    scenarioVerdicts
  };
}

export function buildCanonicalEvidenceParityReport() {
  const journeyScenarios = buildJourneyScenarios();
  const memory = buildMemoryTrailScenario();
  const daily = buildDailyTrailScenarios();
  const scenarios = [
    ...journeyScenarios,
    memory.scenario,
    buildRepeatedCorrectScenario(),
    ...daily.scenarios,
    buildSkillSeparationScenario(),
    buildMentalMapScenario(),
    buildReconstructionScenario(),
    buildDuplicateScenario(),
    buildPersistenceScenario()
  ];
  const executiveSummary = summarizeScenarios(scenarios);
  return {
    reportVersion: 1,
    generatedAt: FIXED_TIME,
    question: "Where canonical evidence and legacy state describe the same learner behavior, do they agree?",
    executiveSummary,
    scenarios,
    fixtureIntegrity: {
      memoryTrailInputUnchanged: memory.fixtureUnchanged,
      dailyTrailInputUnchanged: daily.fixtureUnchanged
    },
    coverage: {
      validated: [
        "Journey U.S. state location correct and incorrect actions",
        "U.S. Memory Trail Ohio location with repeated misses and recovery",
        "U.S. Memory Trail repeated correct Ohio retrieval across sessions",
        "Daily Trail Ohio location and guided exposure",
        "Ohio locating versus identifying skill separation",
        "Mental Map relationship partial and correct results",
        "Map Reconstruction state-level partial and correct placements",
        "repository duplicate protection",
        "legacy and canonical reload/persistence round-trip"
      ],
      untested: [
        "non-U.S. Journey canonical emission",
        "capital retrieval parity beyond the shared state/capital adapter contract",
        "every generated Mental Map challenge form",
        "every reconstruction region and Lower 48 capstone",
        "browser-level localStorage failures and cross-tab concurrency",
        "historical interactions that occurred before canonical emission was installed"
      ]
    },
    risks: [
      {
        name: "Double-writing risk",
        finding: "Repository eventId idempotency prevents duplicate durable events when overlapping wiring submits the same action identity. Distinct accidental identities for one UI action remain a wiring risk."
      },
      {
        name: "Mode-specific ambiguity",
        finding: "Legacy trail planners combine prompt forms in session aggregates; raw canonical events preserve locating versus identifying. Aggregate-to-skill parity is therefore unavailable historically."
      },
      {
        name: "Partial-result semantics",
        finding: "Mental Map score-bearing incomplete answers and reconstruction close placements remain partial. Other legacy modes without partial semantics cannot be compared as partial."
      },
      {
        name: "Session/timestamp differences",
        finding: "Canonical events have per-attempt timestamps and session IDs. Some legacy stores retain only session numbers or completion state."
      },
      {
        name: "Historical aggregate limitations",
        finding: "Canonical history covers new emission only. Legacy aggregates cannot be losslessly converted into prompt-specific events and are not backfilled."
      }
    ],
    conclusion: {
      canonicalRepositoryTrustedForNewReadOnlyEvidence: executiveSummary.defects === 0,
      progressReportMigrationSafeToBegin: executiveSummary.defects === 0,
      qualification: "Safe to begin a separate, shadow/read-only Progress Report migration slice for newly emitted evidence; not safe to replace legacy scoring or infer historical prompt-specific evidence yet."
    }
  };
}

function printable(value) {
  if (value === null || value === undefined) return "—";
  if (typeof value === "string") return value;
  return JSON.stringify(value);
}

function scenarioLegacySummary(scenario) {
  const { source, ...result } = scenario.legacy;
  return `${source}; ${printable(result)}`;
}

function scenarioCanonicalSummary(scenario) {
  const events = scenario.canonical.events;
  const concepts = [...new Set(events.map(({ conceptId }) => conceptId))];
  const skills = [...new Set(events.map(({ skillId }) => skillId))];
  const outcomes = events.map(({ outcome }) => outcome);
  return `${events.length} event(s); concepts=${concepts.join(", ")}; skills=${skills.join(", ")}; outcomes=${outcomes.join(", ")}`;
}

export function renderCanonicalEvidenceParityMarkdown(report) {
  const summary = report.executiveSummary;
  const scenarioRows = report.scenarios.map((scenario) => (
    `| ${scenario.mode} | ${scenario.action} | ${scenarioLegacySummary(scenario)} | ${scenarioCanonicalSummary(scenario)} | ${scenario.verdict} |`
  ));
  const differences = report.scenarios.flatMap((scenario) => scenario.comparisons
    .filter(({ classification }) => classification !== "match")
    .map((comparison) => `- **${scenario.id} — ${comparison.field} (${comparison.classification}):** ${comparison.explanation} Legacy: \`${printable(comparison.legacyValue)}\`; canonical: \`${printable(comparison.canonicalValue)}\`.`));
  return `# Canonical vs legacy evidence parity validation

Generated from deterministic controlled fixtures at ${report.generatedAt}.

## Executive summary

${report.question} **Yes, for the comparable new-evidence paths covered here.** The report found ${summary.defects} defects across ${summary.totalScenarios} scenarios. It recorded ${summary.matches} matching field comparisons, ${summary.intentionalDifferences} intentional differences, and ${summary.unavailableComparisons} unavailable/not-comparable fields.

This validates the canonical repository as a faithful read-only record of newly emitted evidence in the covered paths. It does not validate mastery formulas, adaptive selection, Progress Report scoring, historical backfill, or every gameplay path.

## Scenario table

| Mode | Action | Legacy result | Canonical result | Verdict |
| --- | --- | --- | --- | --- |
${scenarioRows.join("\n")}

## Field-level differences

${differences.length ? differences.join("\n") : "No differences were found."}

## Coverage

Validated:

${report.coverage.validated.map((item) => `- ${item}`).join("\n")}

Not yet tested:

${report.coverage.untested.map((item) => `- ${item}`).join("\n")}

## Risks

${report.risks.map(({ name, finding }) => `- **${name}:** ${finding}`).join("\n")}

## Migration assessment

${report.conclusion.qualification}
`;
}
