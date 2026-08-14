function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function inferred(value, source, note = "") {
  return { availability: "inferred", value: clone(value), source, note };
}

function unavailable(note, source = "selection trace") {
  return { availability: "unavailable", value: null, source, note };
}

function uniqueSorted(values) {
  return [...new Set(values)].sort((left, right) => left - right);
}

function createItemHistory(item) {
  return {
    itemId: item.id,
    targetId: item.targetId || null,
    label: item.label || item.id,
    type: item.type || null,
    category: item.category || null,
    censusRegion: item.censusRegion || null,
    eligibilityEvidence: inferred(
      "planner-bucket reconstruction",
      "Selection Trace",
      "Eligibility is reconstructed from existing U.S. Memory Trail helpers; it is not a retained production event."
    ),
    eligibleSessions: [],
    selectedSessions: [],
    eligibleEvents: [],
    selectedEvents: []
  };
}

function addOpportunity(history, event) {
  if (!history.eligibleSessions.includes(event.session)) history.eligibleSessions.push(event.session);
  const existing = history.eligibleEvents.find((candidate) => candidate.session === event.session && candidate.poolKind === event.poolKind);
  if (!existing) history.eligibleEvents.push(event);
}

function addSelection(history, event) {
  history.selectedSessions.push(event.session);
  history.selectedEvents.push(event);
}

function calculateEpisodes(eligibleSessions, selectedSessions, sessionCount) {
  const eligible = new Set(eligibleSessions);
  const selected = new Set(selectedSessions);
  const resolved = [];
  const unresolved = [];
  let episode = null;

  for (let session = 1; session <= sessionCount; session += 1) {
    if (!eligible.has(session)) {
      if (episode) unresolved.push({ ...episode, endSession: session - 1, delay: episode.eligibleButNotSelectedSessions.length });
      episode = null;
      continue;
    }
    if (!episode) episode = { firstEligibleSession: session, eligibleButNotSelectedSessions: [] };
    if (selected.has(session)) {
      resolved.push({
        firstEligibleSession: episode.firstEligibleSession,
        selectedSession: session,
        delay: episode.eligibleButNotSelectedSessions.length,
        eligibleButNotSelectedSessions: [...episode.eligibleButNotSelectedSessions]
      });
      episode = null;
    } else {
      episode.eligibleButNotSelectedSessions.push(session);
    }
  }
  if (episode) unresolved.push({ ...episode, endSession: sessionCount, delay: episode.eligibleButNotSelectedSessions.length });
  return { resolved, unresolved };
}

function maxConsecutive(values) {
  const sessions = uniqueSorted(values);
  let best = 0;
  let current = 0;
  let previous = null;
  for (const session of sessions) {
    current = previous !== null && session === previous + 1 ? current + 1 : 1;
    best = Math.max(best, current);
    previous = session;
  }
  return best;
}

function finalizeHistory(history, sessionCount) {
  history.eligibleSessions = uniqueSorted(history.eligibleSessions);
  history.selectedSessions = uniqueSorted(history.selectedSessions);
  const selectedSet = new Set(history.selectedSessions);
  const deferredSessions = history.eligibleSessions.filter((session) => !selectedSet.has(session));
  const episodes = calculateEpisodes(history.eligibleSessions, history.selectedSessions, sessionCount);
  const resolvedDelays = episodes.resolved.map((episode) => episode.delay);
  const maximumUnresolvedDelay = Math.max(0, ...episodes.unresolved.map((episode) => episode.delay));
  const maximumResolvedDelay = Math.max(0, ...resolvedDelays);
  const bucketCounts = {};
  history.selectedEvents.forEach((event) => {
    bucketCounts[event.reasonBucket] = (bucketCounts[event.reasonBucket] || 0) + 1;
  });
  const eligibilityBySession = history.eligibleSessions.map((session) => {
    const events = history.eligibleEvents.filter((event) => event.session === session);
    return {
      session,
      pools: [...new Set(events.map((event) => event.poolKind))],
      weak: events.some((event) => event.weak),
      due: events.some((event) => event.due)
    };
  });

  return {
    ...history,
    eligibleEvents: undefined,
    eligibilityBySession,
    firstEligibleSession: history.eligibleSessions.length
      ? inferred(history.eligibleSessions[0], "Selection Trace candidate pools")
      : unavailable("No eligibility opportunity was reconstructed in this simulation window."),
    firstSelectedSession: history.selectedSessions.length
      ? inferred(history.selectedSessions[0], "emitted planner selections")
      : unavailable("The item was not selected in this simulation window."),
    eligibleSessionCount: history.eligibleSessions.length,
    selectedSessionCount: history.selectedSessions.length,
    eligibleButNotSelectedSessionCount: deferredSessions.length,
    maximumConsecutiveEligibleButNotSelectedSessions: maxConsecutive(deferredSessions),
    averageResolvedDelay: resolvedDelays.length
      ? Number((resolvedDelays.reduce((sum, value) => sum + value, 0) / resolvedDelays.length).toFixed(3))
      : null,
    averageDelayBetweenEligibilityAndSelection: resolvedDelays.length
      ? Number((resolvedDelays.reduce((sum, value) => sum + value, 0) / resolvedDelays.length).toFixed(3))
      : null,
    maximumResolvedDelay,
    maximumUnresolvedDelay,
    maximumObservedDeferral: Math.max(maximumResolvedDelay, maximumUnresolvedDelay),
    resolvedDelayEpisodes: episodes.resolved,
    unresolvedDelayEpisodes: episodes.unresolved,
    maximumConsecutiveSelectedSessions: maxConsecutive(history.selectedSessions),
    selectedReasonBuckets: bucketCounts,
    notes: [
      ...(episodes.unresolved.length ? [`${episodes.unresolved.length} eligibility episode(s) remained unresolved at the report boundary or ended without selection.`] : []),
      ...(history.eligibleSessions.length === 0 ? ["No eligibility was observed; curriculum or prerequisites may not have exposed this item in the report window."] : []),
      ...(history.selectedSessions.length === 0 && history.eligibleSessions.length > 0 ? ["Eligible at least once but never selected in the report window."] : []),
      ...(maxConsecutive(history.selectedSessions) >= 5 ? [`Selected in ${maxConsecutive(history.selectedSessions)} consecutive sessions.`] : [])
    ]
  };
}

function aggregateOpportunityEvents(events, keyForEvent) {
  const groups = new Map();
  for (const event of events) {
    const key = keyForEvent(event) || "Unavailable";
    const current = groups.get(key) || { eligibleOpportunities: 0, selections: 0, deferredOpportunities: 0 };
    current.eligibleOpportunities += 1;
    current.selections += Number(event.selected);
    current.deferredOpportunities += Number(!event.selected);
    groups.set(key, current);
  }
  return Object.fromEntries([...groups.entries()].map(([key, value]) => [key, {
    ...value,
    selectionRate: value.eligibleOpportunities
      ? Number((value.selections / value.eligibleOpportunities).toFixed(4))
      : null
  }]));
}

function classifyReason(event) {
  if (event.poolKind === "new") return "new-item";
  if (event.weak) return "weak-review";
  if (event.due) return "due-review";
  if (event.poolKind === "recent-review") return "recent-review";
  if (event.poolKind === "older-review") return "older-review";
  if (event.poolKind === "cumulative-review") return "cumulative-review";
  return "other-review";
}

function summarizeHistories(histories, sessionCount) {
  const observed = histories.filter((history) => history.eligibleSessionCount > 0 || history.selectedSessionCount > 0);
  const resolvedDelays = observed.flatMap((history) => history.resolvedDelayEpisodes.map((episode) => episode.delay));
  const allObservedEpisodeDelays = observed.flatMap((history) => [
    ...history.resolvedDelayEpisodes.map((episode) => episode.delay),
    ...history.unresolvedDelayEpisodes.map((episode) => episode.delay)
  ]);
  const highest = [...observed]
    .sort((left, right) => right.maximumObservedDeferral - left.maximumObservedDeferral
      || right.eligibleButNotSelectedSessionCount - left.eligibleButNotSelectedSessionCount
      || left.itemId.localeCompare(right.itemId))
    .slice(0, 15)
    .map((history) => ({
      itemId: history.itemId,
      label: history.label,
      type: history.type,
      region: history.censusRegion,
      maximumObservedDeferral: history.maximumObservedDeferral,
      eligibleButNotSelectedSessionCount: history.eligibleButNotSelectedSessionCount,
      selectedSessionCount: history.selectedSessionCount,
      unresolved: history.unresolvedDelayEpisodes.length > 0
    }));
  return {
    sessionsSimulated: sessionCount,
    itemsInFixture: histories.length,
    itemsObserved: observed.length,
    maximumObservedDeferral: Math.max(0, ...observed.map((history) => history.maximumObservedDeferral)),
    averageResolvedDelay: resolvedDelays.length
      ? Number((resolvedDelays.reduce((sum, value) => sum + value, 0) / resolvedDelays.length).toFixed(3))
      : null,
    averageObservedDeferral: allObservedEpisodeDelays.length
      ? Number((allObservedEpisodeDelays.reduce((sum, value) => sum + value, 0) / allObservedEpisodeDelays.length).toFixed(3))
      : null,
    resolvedSelectionEpisodes: resolvedDelays.length,
    itemsWithHighestDeferral: highest,
    neverSelectedDespiteEligibility: observed
      .filter((history) => history.selectedSessionCount === 0 && history.eligibleSessionCount > 0)
      .map((history) => history.itemId),
    unresolvedDeferralItems: observed
      .filter((history) => history.unresolvedDelayEpisodes.length > 0)
      .map((history) => history.itemId)
  };
}

export function buildUnitedStatesEligibilityDelayReport({ simulation, items }) {
  const fixtureSnapshot = JSON.stringify(items);
  const historiesById = new Map(items.map((item) => [item.id, createItemHistory(item)]));
  const opportunityEvents = [];
  let selectionOffset = 0;

  for (const session of simulation.sessions) {
    const explanations = simulation.inspector.selections.slice(selectionOffset, selectionOffset + session.selected.length);
    selectionOffset += session.selected.length;
    const sessionPools = new Map();

    for (const explanation of explanations) {
      const trace = explanation.selectionTrace;
      const poolKind = trace?.candidatePoolMetadata?.value?.kind;
      if (!poolKind || trace?.alternatives?.availability === "unavailable") continue;
      if (!sessionPools.has(poolKind)) sessionPools.set(poolKind, new Map());
      const pool = sessionPools.get(poolKind);
      const selectedId = explanation.itemId.value;
      const selectedFactors = trace.priorityFactors?.value || {};
      pool.set(selectedId, {
        itemId: selectedId,
        weak: Boolean(selectedFactors.weak),
        due: Boolean(selectedFactors.due),
        missCount: Number(selectedFactors.missCount) || 0
      });
      for (const alternative of trace.alternatives.value?.items || []) {
        pool.set(alternative.id, {
          itemId: alternative.id,
          weak: Boolean(alternative.weak),
          due: Boolean(alternative.due),
          missCount: Number(alternative.missCount) || 0
        });
      }
    }

    const selectedById = new Map(explanations.map((explanation) => [explanation.itemId.value, explanation]));
    for (const [poolKind, candidates] of sessionPools) {
      for (const candidate of candidates.values()) {
        const history = historiesById.get(candidate.itemId);
        if (!history) continue;
        const selection = selectedById.get(candidate.itemId) || null;
        const selectedPoolKind = selection?.selectionTrace?.candidatePoolMetadata?.value?.kind || null;
        const selectedInThisPool = Boolean(selection && selectedPoolKind === poolKind);
        const event = {
          session: session.session,
          poolKind,
          selected: selectedInThisPool,
          reasonBucket: selectedInThisPool ? selection.selectionTrace?.reasonBucket?.value || null : null,
          weak: candidate.weak,
          due: candidate.due,
          missCount: candidate.missCount,
          itemId: history.itemId,
          type: history.type,
          category: history.category,
          censusRegion: history.censusRegion
        };
        addOpportunity(history, event);
        opportunityEvents.push(event);
      }
    }

    for (const explanation of explanations) {
      const history = historiesById.get(explanation.itemId.value);
      if (!history) continue;
      addSelection(history, {
        session: session.session,
        reasonBucket: explanation.selectionTrace?.reasonBucket?.value || "unavailable",
        poolKind: explanation.selectionTrace?.candidatePoolMetadata?.value?.kind || "unavailable"
      });
    }
  }

  if (JSON.stringify(items) !== fixtureSnapshot) throw new Error("Eligibility-delay analysis mutated the production-derived fixture.");
  const histories = [...historiesById.values()].map((history) => finalizeHistory(history, simulation.sessions.length));
  const selectedWithoutEligibility = histories
    .filter((history) => history.selectedSessions.some((session) => !history.eligibleSessions.includes(session)))
    .map((history) => history.itemId);

  return {
    schemaVersion: 1,
    kind: "us-memory-trail-eligibility-delay-report",
    profile: clone(simulation.profile),
    deterministicContext: clone(simulation.deterministicContext),
    eligibilityDefinition: {
      availability: "inferred",
      source: "O5.5 Selection Trace reconstructed planner buckets",
      note: "An item is eligible only when it appears in a candidate pool for a slot the planner actually emitted. Unseen items outside the active curriculum pool are not counted as eligible."
    },
    summary: summarizeHistories(histories, simulation.sessions.length),
    reasonAnalysis: {
      byPlannerPool: aggregateOpportunityEvents(opportunityEvents, (event) => event.poolKind),
      byEligibilitySignal: aggregateOpportunityEvents(opportunityEvents, classifyReason)
    },
    regionalAnalysis: aggregateOpportunityEvents(opportunityEvents, (event) => event.censusRegion),
    categoryAnalysis: aggregateOpportunityEvents(opportunityEvents, (event) => event.type || event.category),
    validation: {
      selectedWithoutEligibility,
      eligibilityAndSelectionSeparated: selectedWithoutEligibility.length === 0,
      itemIdsStable: histories.every((history) => historiesById.has(history.itemId))
    },
    items: histories
  };
}
