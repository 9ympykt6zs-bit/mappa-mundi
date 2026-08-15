import { buildUnitedStatesEligibilityDelayReport } from "./eligibility-delay-report.mjs";
import { runUnitedStatesLearnerSimulation } from "./learner-simulation.mjs";
import { MATCHED_PROFILE_IDS, summarizeDistribution } from "./matched-seed-simulation-matrix.mjs";

export const LONG_HORIZON_CHECKPOINTS = Object.freeze([25, 50, 75, 100, 150, 200]);
export const LONG_HORIZON_DIAGNOSTIC_ITEMS = Object.freeze([
  "state:ohio",
  "state:wyoming",
  "state:maine",
  "state:hawaii",
  "capital:augusta-me"
]);

const milestonePercentages = Object.freeze([25, 50, 75, 90, 95, 100]);

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function rounded(value, digits = 3) {
  return Number(Number(value).toFixed(digits));
}

function average(values) {
  return values.length ? rounded(values.reduce((sum, value) => sum + value, 0) / values.length) : null;
}

function median(values) {
  return summarizeDistribution(values).median;
}

function numericSummary(values) {
  const numeric = values.filter(Number.isFinite);
  return {
    count: numeric.length,
    total: numeric.reduce((sum, value) => sum + value, 0),
    average: average(numeric),
    median: median(numeric),
    minimum: numeric.length ? Math.min(...numeric) : null,
    maximum: numeric.length ? Math.max(...numeric) : null
  };
}

function statusCounts(progressValues, totalItems) {
  const counts = { unseen: totalItems - progressValues.length, learning: 0, review: 0, relearning: 0, mastered: 0, other: 0 };
  for (const progress of progressValues) {
    if (["introduced", "learning"].includes(progress.status)) counts.learning += 1;
    else if (progress.status === "review") counts.review += 1;
    else if (progress.status === "relearning") counts.relearning += 1;
    else if (progress.status === "mastered") counts.mastered += 1;
    else counts.other += 1;
  }
  return counts;
}

export function calculateMasterySnapshot({ state, items, session }) {
  const progressById = state?.itemProgress || {};
  const progressValues = Object.values(progressById);
  const counts = statusCounts(progressValues, items.length);
  const itemIdsByStatus = { unseen: [], learning: [], review: [], relearning: [], mastered: [], other: [] };
  for (const item of items) {
    const status = progressById[item.id]?.status;
    if (!status) itemIdsByStatus.unseen.push(item.id);
    else if (["introduced", "learning"].includes(status)) itemIdsByStatus.learning.push(item.id);
    else if (itemIdsByStatus[status]) itemIdsByStatus[status].push(item.id);
    else itemIdsByStatus.other.push(item.id);
  }
  const totalCounted = Object.values(counts).reduce((sum, value) => sum + value, 0);
  const itemMetrics = items.map((item) => progressById[item.id] || {});
  const streakDistribution = { "0": 0, "1": 0, "2": 0, "3": 0, "4+": 0 };
  itemMetrics.forEach((progress) => {
    const streak = progress.correctStreak || 0;
    const key = streak >= 4 ? "4+" : String(streak);
    streakDistribution[key] += 1;
  });
  const regions = {};
  for (const item of items) {
    const region = item.censusRegion || "Unavailable";
    const progress = progressById[item.id];
    if (!regions[region]) regions[region] = { totalItems: 0, introduced: 0, mastered: 0, percentageMastered: 0 };
    regions[region].totalItems += 1;
    if (progress) regions[region].introduced += 1;
    if (progress?.status === "mastered") regions[region].mastered += 1;
  }
  Object.values(regions).forEach((region) => {
    region.percentageMastered = region.totalItems ? rounded((region.mastered / region.totalItems) * 100, 1) : 0;
  });

  return {
    session,
    totalCurriculumItems: items.length,
    itemsIntroduced: progressValues.length,
    ...counts,
    percentageMastered: items.length ? rounded((counts.mastered / items.length) * 100, 1) : 0,
    itemIdsByStatus,
    encountersPerItem: numericSummary(itemMetrics.map((progress) => progress.timesSeen || 0)),
    correctResponsesPerItem: numericSummary(itemMetrics.map((progress) => progress.correctCount || 0)),
    missesPerItem: numericSummary(itemMetrics.map((progress) => progress.missCount || 0)),
    currentStreakDistribution: streakDistribution,
    stability: numericSummary(progressValues.map((progress) => progress.stability)),
    retrievability: numericSummary(progressValues.map((progress) => progress.retrievability)),
    dueBacklog: progressValues.filter((progress) => Number.isFinite(progress.dueSession) && progress.dueSession <= session).length,
    reviewOrRelearningBacklog: counts.review + counts.relearning,
    masteredExcludingOhio: counts.mastered - Number(progressById["state:ohio"]?.status === "mastered"),
    regions,
    validation: {
      stateCountsSumToCurriculum: totalCounted === items.length,
      totalCounted
    }
  };
}

export function calculateMasteryMilestones(sessions, totalItems) {
  const firstForCount = (count) => sessions.find((session) => session.after.mastered >= count)?.session || null;
  return {
    firstMasteredItem: firstForCount(1),
    allCurriculumItemsIntroduced: sessions.find((session) => session.after.introduced >= totalItems)?.session || null,
    mastery: Object.fromEntries(milestonePercentages.map((percentage) => [percentage, {
      targetItemCount: Math.ceil((totalItems * percentage) / 100),
      firstSession: firstForCount(Math.ceil((totalItems * percentage) / 100)),
      reachedWithinHorizon: firstForCount(Math.ceil((totalItems * percentage) / 100)) !== null
    }]))
  };
}

function transitionsBySession(simulation) {
  const output = new Map();
  let offset = 0;
  for (const session of simulation.sessions) {
    output.set(session.session, simulation.inspector.transitions.slice(offset, offset + session.selected.length));
    offset += session.selected.length;
  }
  return output;
}

function reconstructSnapshots(simulation, items, targetSessions) {
  const wanted = new Set(targetSessions.filter(Number.isFinite));
  const progressById = {};
  const grouped = transitionsBySession(simulation);
  const snapshots = {};
  for (const session of simulation.sessions) {
    for (const transition of grouped.get(session.session) || []) {
      const itemId = transition.event.itemId.value;
      const progress = transition.after.learnerState.currentProgress.value;
      if (progress) progressById[itemId] = clone(progress);
    }
    if (wanted.has(session.session)) {
      snapshots[session.session] = calculateMasterySnapshot({
        state: { itemProgress: clone(progressById) },
        items,
        session: session.session
      });
    }
  }
  return snapshots;
}

function createDiagnosticHistories(simulation, itemIds) {
  const selected = new Set(itemIds);
  const grouped = transitionsBySession(simulation);
  const histories = Object.fromEntries(itemIds.map((itemId) => [itemId, {
    itemId,
    introductionSession: null,
    encounters: 0,
    correctResponses: 0,
    misses: 0,
    stateTransitions: [],
    firstMasterySession: null,
    masteryLapses: [],
    finalStatus: "unseen"
  }]));

  for (const session of simulation.sessions) {
    for (const transition of grouped.get(session.session) || []) {
      const itemId = transition.event.itemId.value;
      if (!selected.has(itemId)) continue;
      const history = histories[itemId];
      const beforeStatus = transition.before.learnerState.progressStatus.value;
      const afterStatus = transition.after.learnerState.progressStatus.value;
      const correct = transition.event.result.value.correct;
      const progress = transition.after.learnerState.currentProgress.value;
      history.introductionSession ??= progress?.introducedSession || session.session;
      history.encounters += 1;
      history.correctResponses += Number(correct);
      history.misses += Number(!correct);
      history.finalStatus = afterStatus;
      if (beforeStatus !== afterStatus) {
        history.stateTransitions.push({
          session: session.session,
          from: beforeStatus,
          to: afterStatus,
          answer: correct ? "correct" : "incorrect",
          correctCount: progress?.correctCount ?? null,
          missCount: progress?.missCount ?? null,
          correctStreak: progress?.correctStreak ?? null
        });
      }
      if (afterStatus === "mastered" && history.firstMasterySession === null) history.firstMasterySession = session.session;
      if (beforeStatus === "mastered" && afterStatus !== "mastered") {
        history.masteryLapses.push({ lapseSession: session.session, recoverySession: null });
      }
      const openLapse = history.masteryLapses.findLast((lapse) => lapse.recoverySession === null);
      if (openLapse && afterStatus === "mastered" && session.session > openLapse.lapseSession) {
        openLapse.recoverySession = session.session;
      }
    }
  }
  return histories;
}

function selectionReasonBySession(simulation) {
  const output = new Map();
  let offset = 0;
  for (const session of simulation.sessions) {
    const explanations = simulation.inspector.selections.slice(offset, offset + session.selected.length);
    offset += session.selected.length;
    output.set(session.session, explanations.map((explanation) => ({
      itemId: explanation.itemId.value,
      reason: explanation.selectionTrace?.reasonBucket?.value || "unavailable"
    })));
  }
  return output;
}

function reviewWindowSummary(sessions) {
  const reviewCounts = sessions.map((session) => session.reviewSelections);
  const competingCounts = sessions.map((session) => session.competingReviewItems);
  return {
    sessionCount: sessions.length,
    averageReviewSelectionsPerSession: average(reviewCounts),
    reviewSelectionsPerSession: numericSummary(reviewCounts),
    competingReviewItems: numericSummary(competingCounts)
  };
}

function createReviewLoadAnalysis(simulation, eligibility, allIntroducedSession, items) {
  if (!allIntroducedSession) {
    return {
      available: false,
      reason: "All curriculum items were not introduced within the simulation horizon."
    };
  }
  const itemsById = new Map(items.map((item) => [item.id, item]));
  const reasonsBySession = selectionReasonBySession(simulation);
  const postIntroduction = simulation.sessions.filter((session) => session.session >= allIntroducedSession).map((session) => {
    const selections = reasonsBySession.get(session.session) || [];
    const reasons = selections.map((selection) => selection.reason);
    const counts = {};
    reasons.forEach((reason) => { counts[reason] = (counts[reason] || 0) + 1; });
    const competingReviewItems = eligibility.items.filter((item) => (
      item.eligibleSessions.includes(session.session)
      && item.eligibilityBySession.find((entry) => entry.session === session.session)?.pools.some((pool) => pool !== "new")
    )).length;
    return {
      session: session.session,
      newItemSelections: counts.new || 0,
      weakReviewSelections: counts["weak-review"] || 0,
      olderReviewSelections: counts["older-review"] || 0,
      recentReviewSelections: counts["recent-review"] || 0,
      dueReviewSelections: counts["due-review"] || 0,
      otherReviewSelections: reasons.filter((reason) => !["new", "weak-review", "older-review", "recent-review", "due-review"].includes(reason)).length,
      reviewSelections: reasons.filter((reason) => reason !== "new").length,
      competingReviewItems,
      regionalSelections: selections.reduce((regions, selection) => {
        const region = itemsById.get(selection.itemId)?.censusRegion || "Unavailable";
        if (!regions[region]) regions[region] = { selections: 0, reviewSelections: 0, weakReviewSelections: 0 };
        regions[region].selections += 1;
        regions[region].reviewSelections += Number(selection.reason !== "new");
        regions[region].weakReviewSelections += Number(selection.reason === "weak-review");
        return regions;
      }, {})
    };
  });
  const totals = postIntroduction.reduce((result, session) => {
    for (const [key, value] of Object.entries(session)) {
      if (key !== "session" && key !== "competingReviewItems" && key !== "regionalSelections") result[key] = (result[key] || 0) + value;
    }
    return result;
  }, {});
  const firstWindow = reviewWindowSummary(postIntroduction.slice(0, 25));
  const lastWindow = reviewWindowSummary(postIntroduction.slice(-25));
  const regionalTotals = {};
  for (const session of postIntroduction) {
    for (const [region, values] of Object.entries(session.regionalSelections)) {
      if (!regionalTotals[region]) regionalTotals[region] = { selections: 0, reviewSelections: 0, weakReviewSelections: 0, candidateOpportunities: 0 };
      regionalTotals[region].selections += values.selections;
      regionalTotals[region].reviewSelections += values.reviewSelections;
      regionalTotals[region].weakReviewSelections += values.weakReviewSelections;
    }
  }
  for (const item of eligibility.items) {
    const region = item.censusRegion || "Unavailable";
    if (!regionalTotals[region]) regionalTotals[region] = { selections: 0, reviewSelections: 0, weakReviewSelections: 0, candidateOpportunities: 0 };
    regionalTotals[region].candidateOpportunities += item.eligibleSessions.filter((session) => session >= allIntroducedSession).length;
  }
  Object.values(regionalTotals).forEach((region) => {
    region.selectionRatePerCandidateOpportunity = region.candidateOpportunities
      ? rounded(region.selections / region.candidateOpportunities, 4)
      : null;
  });
  return {
    available: true,
    firstSession: allIntroducedSession,
    sessionsObserved: postIntroduction.length,
    totals,
    first25Sessions: firstWindow,
    last25Sessions: lastWindow,
    reviewPressureDeclined: lastWindow.averageReviewSelectionsPerSession < firstWindow.averageReviewSelectionsPerSession,
    regionalTotals,
    sessionDetails: postIntroduction
  };
}

function createPerfectRunAnalysis(milestones, snapshots, totalItems) {
  const introductionSession = milestones.allCurriculumItemsIntroduced;
  if (!introductionSession || !snapshots[introductionSession]) {
    return { available: false, reason: "All curriculum items were not introduced within the horizon." };
  }
  const snapshot = snapshots[introductionSession];
  const itemsWithCorrect = snapshot.correctResponsesPerItem.minimum > 0 ? totalItems : null;
  return {
    available: true,
    firstSessionAllItemsEncountered: introductionSession,
    fullErrorFreePass: {
      availability: "unavailable",
      value: null,
      note: "U.S. Memory Trail does not define or record a full-pass event over all introduced material."
    },
    proxyEvidence: {
      itemsWithAtLeastOneCorrectDemonstration: itemsWithCorrect,
      minimumCorrectDemonstrationsPerItem: snapshot.correctResponsesPerItem.minimum,
      itemsCurrentlyMastered: snapshot.mastered,
      percentageCurrentlyMastered: snapshot.percentageMastered,
      totalCorrectDemonstrations: snapshot.correctResponsesPerItem.total,
      totalMisses: snapshot.missesPerItem.total
    },
    domainCompletionState: {
      availability: "unavailable",
      value: null,
      note: "The U.S. Memory Trail state has no journey/domain-complete field separate from item status."
    }
  };
}

export function buildLongHorizonMasteryRun({ simulation, items }) {
  const milestones = calculateMasteryMilestones(simulation.sessions, items.length);
  const targetSessions = [...LONG_HORIZON_CHECKPOINTS, milestones.allCurriculumItemsIntroduced, milestones.firstMasteredItem]
    .filter(Number.isFinite);
  const snapshots = reconstructSnapshots(simulation, items, targetSessions);
  const eligibility = buildUnitedStatesEligibilityDelayReport({ simulation, items });
  const checkpoints = Object.fromEntries(LONG_HORIZON_CHECKPOINTS.map((session) => [session, snapshots[session]]));
  return {
    profile: clone(simulation.profile),
    deterministicContext: clone(simulation.deterministicContext),
    horizonSessions: simulation.sessions.length,
    checkpoints,
    milestones,
    diagnostics: createDiagnosticHistories(simulation, LONG_HORIZON_DIAGNOSTIC_ITEMS),
    perfectRunAnalysis: ["perfect"].includes(simulation.profile.id)
      ? createPerfectRunAnalysis(milestones, snapshots, items.length)
      : null,
    reviewLoadAfterIntroduction: createReviewLoadAnalysis(simulation, eligibility, milestones.allCurriculumItemsIntroduced, items),
    finalState: calculateMasterySnapshot({ state: simulation.finalState, items, session: simulation.sessions.length }),
    validation: {
      checkpointCountsValid: Object.values(checkpoints).every((snapshot) => snapshot.validation.stateCountsSumToCurriculum),
      diagnosticHistoriesOrdered: Object.values(createDiagnosticHistories(simulation, LONG_HORIZON_DIAGNOSTIC_ITEMS)).every((history) => (
        history.stateTransitions.every((transition, index, transitions) => index === 0 || transition.session >= transitions[index - 1].session)
      ))
    }
  };
}

function aggregateProfileRuns(runs) {
  const milestoneDistribution = (percentage) => summarizeDistribution(runs.map((run) => run.milestones.mastery[percentage].firstSession));
  return {
    runCount: runs.length,
    milestones: {
      firstMasteredItem: summarizeDistribution(runs.map((run) => run.milestones.firstMasteredItem)),
      allCurriculumItemsIntroduced: summarizeDistribution(runs.map((run) => run.milestones.allCurriculumItemsIntroduced)),
      mastery: Object.fromEntries(milestonePercentages.map((percentage) => [percentage, milestoneDistribution(percentage)]))
    },
    checkpoints: Object.fromEntries(LONG_HORIZON_CHECKPOINTS.map((session) => [session, {
      mastered: summarizeDistribution(runs.map((run) => run.checkpoints[session].mastered)),
      masteredExcludingOhio: summarizeDistribution(runs.map((run) => run.checkpoints[session].masteredExcludingOhio)),
      percentageMastered: summarizeDistribution(runs.map((run) => run.checkpoints[session].percentageMastered))
    }])),
    finalRegionalMastery: Object.fromEntries(["Northeast", "Midwest", "South", "West"].map((region) => [region, {
      mastered: summarizeDistribution(runs.map((run) => run.finalState.regions[region]?.mastered)),
      percentageMastered: summarizeDistribution(runs.map((run) => run.finalState.regions[region]?.percentageMastered))
    }])),
    reviewLoad: {
      first25Average: summarizeDistribution(runs.map((run) => run.reviewLoadAfterIntroduction.first25Sessions?.averageReviewSelectionsPerSession)),
      last25Average: summarizeDistribution(runs.map((run) => run.reviewLoadAfterIntroduction.last25Sessions?.averageReviewSelectionsPerSession)),
      declineObservedCount: runs.filter((run) => run.reviewLoadAfterIntroduction.reviewPressureDeclined).length
    },
    postIntroductionRegionalReview: Object.fromEntries(["Northeast", "Midwest", "South", "West"].map((region) => [region, {
      candidateOpportunities: summarizeDistribution(runs.map((run) => run.reviewLoadAfterIntroduction.regionalTotals?.[region]?.candidateOpportunities)),
      reviewSelections: summarizeDistribution(runs.map((run) => run.reviewLoadAfterIntroduction.regionalTotals?.[region]?.reviewSelections)),
      weakReviewSelections: summarizeDistribution(runs.map((run) => run.reviewLoadAfterIntroduction.regionalTotals?.[region]?.weakReviewSelections)),
      selectionRatePerCandidateOpportunity: summarizeDistribution(runs.map((run) => run.reviewLoadAfterIntroduction.regionalTotals?.[region]?.selectionRatePerCandidateOpportunity))
    }]))
  };
}

function classifySensitivity(distribution, totalSeeds) {
  if (!distribution.count) return "unreached";
  if (distribution.count < totalSeeds) return "strongly-seed-sensitive-or-censored";
  const width = distribution.max - distribution.min;
  if (width <= 2) return "highly-stable";
  if (width <= 10) return "moderately-seed-sensitive";
  return "strongly-seed-sensitive";
}

export function runLongHorizonMasteryMatrix({
  items,
  plannerSeeds,
  profileIds = MATCHED_PROFILE_IDS,
  sessionCount = 200,
  startTime = "2030-01-15T18:30:00.000Z"
}) {
  const fixtureSnapshot = JSON.stringify(items);
  const runs = [];
  for (const plannerSeed of plannerSeeds) {
    const answerSeed = `${plannerSeed}:long-horizon-answers`;
    for (const profileId of profileIds) {
      const simulation = runUnitedStatesLearnerSimulation({
        profileId,
        items,
        seed: `long-horizon:${plannerSeed}:${profileId}`,
        plannerSeed,
        answerSeed,
        sessionCount,
        startTime
      });
      runs.push(buildLongHorizonMasteryRun({ simulation, items }));
    }
  }
  if (JSON.stringify(items) !== fixtureSnapshot) throw new Error("Long-horizon report mutated the production-derived fixture.");
  const profiles = Object.fromEntries(profileIds.map((profileId) => {
    const profileRuns = runs.filter((run) => run.profile.id === profileId);
    return [profileId, aggregateProfileRuns(profileRuns)];
  }));
  const sensitivity = Object.fromEntries(profileIds.map((profileId) => [profileId, Object.fromEntries(
    milestonePercentages.map((percentage) => [percentage, classifySensitivity(profiles[profileId].milestones.mastery[percentage], plannerSeeds.length)])
  )]));
  return {
    schemaVersion: 1,
    kind: "us-memory-trail-long-horizon-mastery-report",
    experiment: {
      plannerSeeds: clone(plannerSeeds),
      profileIds: clone(profileIds),
      sessionCount,
      checkpoints: clone(LONG_HORIZON_CHECKPOINTS),
      startTime,
      masteryDefinition: "Observed production U.S. Memory Trail item status; thresholds and state transitions are not reimplemented by this reporter."
    },
    runs,
    aggregate: { profiles, milestoneSeedSensitivity: sensitivity },
    validation: {
      identicalPlannerSeedWithinMatchedGroups: plannerSeeds.every((plannerSeed) => runs.filter((run) => run.deterministicContext.plannerSeed === plannerSeed).length === profileIds.length),
      separateAnswerSeeds: runs.every((run) => run.deterministicContext.answerSeed !== run.deterministicContext.plannerSeed),
      stateCountsValid: runs.every((run) => run.validation.checkpointCountsValid && run.finalState.validation.stateCountsSumToCurriculum),
      historiesOrdered: runs.every((run) => run.validation.diagnosticHistoriesOrdered),
      fixtureUnchanged: JSON.stringify(items) === fixtureSnapshot
    }
  };
}
