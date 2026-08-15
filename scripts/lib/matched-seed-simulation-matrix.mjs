import { buildUnitedStatesEligibilityDelayReport } from "./eligibility-delay-report.mjs";
import { runUnitedStatesLearnerSimulation } from "./learner-simulation.mjs";

export const MATCHED_PROFILE_IDS = Object.freeze([
  "perfect",
  "single-weak-item",
  "regional-weakness",
  "mixed",
  "random"
]);

export const DIAGNOSTIC_ITEM_IDS = Object.freeze([
  "state:ohio",
  "state:wyoming",
  "state:massachusetts",
  "state:georgia"
]);

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function rounded(value, digits = 3) {
  return Number(Number(value).toFixed(digits));
}

export function summarizeDistribution(values) {
  const numeric = values.filter((value) => Number.isFinite(value)).sort((left, right) => left - right);
  if (!numeric.length) return { count: 0, median: null, min: null, max: null };
  const middle = Math.floor(numeric.length / 2);
  const median = numeric.length % 2
    ? numeric[middle]
    : (numeric[middle - 1] + numeric[middle]) / 2;
  return {
    count: numeric.length,
    median: rounded(median),
    min: numeric[0],
    max: numeric[numeric.length - 1]
  };
}

function increment(record, key, amount = 1) {
  record[key] = (record[key] || 0) + amount;
}

function createRegionRecord() {
  return {
    introducedItems: 0,
    candidateOpportunities: 0,
    selections: 0,
    reviewSelections: 0,
    weakReviewSelections: 0,
    correct: 0,
    incorrect: 0,
    errorRate: null,
    selectionRatePerCandidateOpportunity: null
  };
}

function firstSessionMatching(sessions, predicate) {
  const match = sessions.find(predicate);
  return match ? match.session : null;
}

function checkpointSessions(sessionCount) {
  return [...new Set([12, 24, 36, sessionCount].filter((session) => session <= sessionCount))];
}

function maxConsecutiveSessions(sessions) {
  const ordered = [...new Set(sessions)].sort((left, right) => left - right);
  let maximum = 0;
  let current = 0;
  let prior = null;
  for (const session of ordered) {
    current = prior !== null && session === prior + 1 ? current + 1 : 1;
    maximum = Math.max(maximum, current);
    prior = session;
  }
  return maximum;
}

function summarizeRun(simulation, eligibility, items) {
  const itemsById = new Map(items.map((item) => [item.id, item]));
  const regions = {};
  const reasonBuckets = {};
  const selectedSessionsByItem = {};
  let selectionOffset = 0;

  for (const itemId of simulation.finalState.introducedItemIds || []) {
    const region = itemsById.get(itemId)?.censusRegion || "Unavailable";
    if (!regions[region]) regions[region] = createRegionRecord();
    regions[region].introducedItems += 1;
  }

  for (const session of simulation.sessions) {
    const explanations = simulation.inspector.selections.slice(selectionOffset, selectionOffset + session.selected.length);
    const transitions = simulation.inspector.transitions.slice(selectionOffset, selectionOffset + session.selected.length);
    selectionOffset += session.selected.length;
    explanations.forEach((explanation, index) => {
      const itemId = explanation.itemId.value;
      const item = itemsById.get(itemId);
      const region = item?.censusRegion || "Unavailable";
      const bucket = explanation.selectionTrace?.reasonBucket?.value || "unavailable";
      const correct = transitions[index]?.event?.result?.value?.correct;
      if (!regions[region]) regions[region] = createRegionRecord();
      regions[region].selections += 1;
      if (bucket !== "new") regions[region].reviewSelections += 1;
      if (bucket === "weak-review") regions[region].weakReviewSelections += 1;
      if (correct === true) regions[region].correct += 1;
      if (correct === false) regions[region].incorrect += 1;
      increment(reasonBuckets, bucket);
      if (!selectedSessionsByItem[itemId]) selectedSessionsByItem[itemId] = [];
      selectedSessionsByItem[itemId].push(session.session);
    });
  }

  for (const [region, analysis] of Object.entries(eligibility.regionalAnalysis)) {
    if (!regions[region]) regions[region] = createRegionRecord();
    regions[region].candidateOpportunities = analysis.eligibleOpportunities;
    regions[region].selectionRatePerCandidateOpportunity = analysis.selectionRate;
  }
  Object.values(regions).forEach((region) => {
    const answers = region.correct + region.incorrect;
    region.errorRate = answers ? rounded(region.incorrect / answers, 4) : null;
    if (region.candidateOpportunities && region.selectionRatePerCandidateOpportunity === null) {
      region.selectionRatePerCandidateOpportunity = rounded(region.selections / region.candidateOpportunities, 4);
    }
  });

  const checkpoints = Object.fromEntries(checkpointSessions(simulation.sessions.length).map((sessionNumber) => {
    const session = simulation.sessions[sessionNumber - 1];
    return [sessionNumber, {
      introduced: session?.after.introduced ?? null,
      mastered: session?.after.mastered ?? null
    }];
  }));

  const diagnosticItems = Object.fromEntries(DIAGNOSTIC_ITEM_IDS.map((itemId) => {
    const history = eligibility.items.find((item) => item.itemId === itemId);
    const progress = simulation.finalState.itemProgress?.[itemId] || null;
    const selectedSessions = selectedSessionsByItem[itemId] || [];
    return [itemId, {
      encounters: selectedSessions.length,
      selectedSessions,
      maximumConsecutiveSelections: maxConsecutiveSessions(selectedSessions),
      correct: progress?.correctCount ?? 0,
      incorrect: progress?.missCount ?? 0,
      finalStatus: progress?.status || "unseen",
      maximumEligibilityDeferral: history?.maximumObservedDeferral ?? null,
      unresolvedEligibilityEpisodes: history?.unresolvedDelayEpisodes.length ?? null
    }];
  }));

  return {
    profileId: simulation.profile.id,
    profileLabel: simulation.profile.label,
    plannerSeed: simulation.deterministicContext.plannerSeed,
    answerSeed: simulation.deterministicContext.answerSeed,
    startTime: simulation.deterministicContext.startTime,
    progression: {
      sessionsSimulated: simulation.summary.sessionsSimulated,
      itemsIntroduced: simulation.summary.finalState.introduced,
      uniqueItemsEncountered: simulation.summary.itemsEncountered,
      totalSelections: simulation.summary.encounters,
      correct: simulation.summary.correct,
      incorrect: simulation.summary.incorrect,
      firstSessionAllCurriculumIntroduced: firstSessionMatching(
        simulation.sessions,
        (session) => session.after.introduced === items.length
      ),
      firstMasterySession: firstSessionMatching(simulation.sessions, (session) => session.after.mastered > 0),
      finalMasteredCount: simulation.summary.finalState.mastered,
      masteredAtCheckpoints: checkpoints
    },
    adaptation: {
      newSelections: simulation.selectionBehavior.newSelections,
      reviewSelections: simulation.selectionBehavior.reviewSelections,
      reasonBuckets,
      weakReviewSelections: reasonBuckets["weak-review"] || 0,
      dueReviewSelections: reasonBuckets["due-review"] || 0,
      olderReviewSelections: reasonBuckets["older-review"] || 0,
      recentReviewSelections: reasonBuckets["recent-review"] || 0,
      maximumEligibilityDeferral: eligibility.summary.maximumObservedDeferral,
      unresolvedEligibleDeferralItems: eligibility.summary.unresolvedDeferralItems.length,
      neverSelectedDespiteEligibility: clone(eligibility.summary.neverSelectedDespiteEligibility),
      repeatedlySelectedItems: Object.entries(selectedSessionsByItem)
        .map(([itemId, sessions]) => ({ itemId, consecutiveSessions: maxConsecutiveSessions(sessions), selections: sessions.length }))
        .filter((item) => item.consecutiveSessions >= 5)
        .sort((left, right) => right.consecutiveSessions - left.consecutiveSessions || left.itemId.localeCompare(right.itemId))
    },
    regions,
    diagnosticItems
  };
}

function metric(run, path) {
  return path.split(".").reduce((value, key) => value?.[key], run);
}

const aggregateMetricPaths = Object.freeze([
  "progression.itemsIntroduced",
  "progression.uniqueItemsEncountered",
  "progression.totalSelections",
  "progression.correct",
  "progression.incorrect",
  "progression.firstSessionAllCurriculumIntroduced",
  "progression.firstMasterySession",
  "progression.finalMasteredCount",
  "adaptation.reviewSelections",
  "adaptation.weakReviewSelections",
  "adaptation.newSelections",
  "adaptation.maximumEligibilityDeferral",
  "adaptation.unresolvedEligibleDeferralItems",
  "regions.Midwest.selections",
  "regions.Midwest.reviewSelections",
  "regions.Midwest.weakReviewSelections",
  "regions.West.selections",
  "regions.West.candidateOpportunities",
  "diagnosticItems.state:ohio.encounters",
  "diagnosticItems.state:wyoming.maximumEligibilityDeferral"
]);

function aggregateProfiles(runs, profileIds) {
  return Object.fromEntries(profileIds.map((profileId) => {
    const profileRuns = runs.filter((run) => run.profileId === profileId);
    return [profileId, {
      runCount: profileRuns.length,
      metrics: Object.fromEntries(aggregateMetricPaths.map((path) => [
        path,
        summarizeDistribution(profileRuns.map((run) => metric(run, path)))
      ]))
    }];
  }));
}

function createPairwiseComparison(left, right) {
  const delta = (path) => {
    const leftValue = metric(left, path);
    const rightValue = metric(right, path);
    return Number.isFinite(leftValue) && Number.isFinite(rightValue) ? rounded(rightValue - leftValue) : null;
  };
  return {
    plannerSeed: left.plannerSeed,
    baselineProfile: left.profileId,
    comparisonProfile: right.profileId,
    deltas: {
      totalSelections: delta("progression.totalSelections"),
      itemsIntroduced: delta("progression.itemsIntroduced"),
      finalMasteredCount: delta("progression.finalMasteredCount"),
      reviewSelections: delta("adaptation.reviewSelections"),
      weakReviewSelections: delta("adaptation.weakReviewSelections"),
      MidwestReviewSelections: delta("regions.Midwest.reviewSelections"),
      MidwestWeakReviewSelections: delta("regions.Midwest.weakReviewSelections"),
      WestSelections: delta("regions.West.selections"),
      OhioEncounters: delta("diagnosticItems.state:ohio.encounters"),
      WyomingMaximumDeferral: delta("diagnosticItems.state:wyoming.maximumEligibilityDeferral")
    }
  };
}

function aggregatePairwise(comparisons) {
  const grouped = {};
  for (const comparison of comparisons) {
    const key = `${comparison.baselineProfile}-vs-${comparison.comparisonProfile}`;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(comparison);
  }
  return Object.fromEntries(Object.entries(grouped).map(([key, values]) => {
    const deltaNames = Object.keys(values[0]?.deltas || {});
    return [key, {
      matchedSeedCount: values.length,
      deltas: Object.fromEntries(deltaNames.map((name) => [name, summarizeDistribution(values.map((value) => value.deltas[name]))])),
      positiveEffectCounts: Object.fromEntries(deltaNames.map((name) => [
        name,
        values.filter((value) => Number.isFinite(value.deltas[name]) && value.deltas[name] > 0).length
      ]))
    }];
  }));
}

export function runMatchedSeedSimulationMatrix({
  items,
  plannerSeeds,
  profileIds = MATCHED_PROFILE_IDS,
  sessionCount = 60,
  startTime = "2030-01-15T18:30:00.000Z"
}) {
  if (!Array.isArray(plannerSeeds) || plannerSeeds.length < 1) throw new Error("At least one planner seed is required.");
  const fixtureSnapshot = JSON.stringify(items);
  const runs = [];

  for (const plannerSeed of plannerSeeds) {
    const answerSeed = `${plannerSeed}:matched-answers`;
    for (const profileId of profileIds) {
      const simulation = runUnitedStatesLearnerSimulation({
        profileId,
        items,
        seed: `matched:${plannerSeed}:${profileId}`,
        plannerSeed,
        answerSeed,
        sessionCount,
        startTime
      });
      const eligibility = buildUnitedStatesEligibilityDelayReport({ simulation, items });
      runs.push(summarizeRun(simulation, eligibility, items));
    }
  }

  if (JSON.stringify(items) !== fixtureSnapshot) throw new Error("Matched-seed simulation mutated the production-derived fixture.");
  const pairwiseComparisons = [];
  for (const plannerSeed of plannerSeeds) {
    const seedRuns = runs.filter((run) => run.plannerSeed === plannerSeed);
    const perfect = seedRuns.find((run) => run.profileId === "perfect");
    for (const profileId of ["single-weak-item", "regional-weakness", "mixed"]) {
      const comparison = seedRuns.find((run) => run.profileId === profileId);
      if (perfect && comparison) pairwiseComparisons.push(createPairwiseComparison(perfect, comparison));
    }
  }

  return {
    schemaVersion: 1,
    kind: "us-memory-trail-matched-seed-simulation-matrix",
    experiment: {
      plannerSeeds: clone(plannerSeeds),
      plannerSeedCount: plannerSeeds.length,
      profileIds: clone(profileIds),
      sessionCount,
      startTime,
      answerSeedPolicy: "One deterministic answer seed is shared by all profiles within a planner-seed group and is distinct from the planner seed. Profiles that do not consume randomness ignore it."
    },
    runs,
    pairwiseComparisons,
    aggregate: {
      profiles: aggregateProfiles(runs, profileIds),
      pairwise: aggregatePairwise(pairwiseComparisons)
    },
    validation: {
      samePlannerSeedWithinGroups: plannerSeeds.every((plannerSeed) => (
        runs.filter((run) => run.plannerSeed === plannerSeed).every((run) => run.plannerSeed === plannerSeed)
      )),
      answerSeedSeparateFromPlannerSeed: runs.every((run) => run.answerSeed !== run.plannerSeed),
      answerSeedSharedWithinGroups: plannerSeeds.every((plannerSeed) => (
        new Set(runs.filter((run) => run.plannerSeed === plannerSeed).map((run) => run.answerSeed)).size === 1
      )),
      fixtureUnchanged: JSON.stringify(items) === fixtureSnapshot
    }
  };
}
