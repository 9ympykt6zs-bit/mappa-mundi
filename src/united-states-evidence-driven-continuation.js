import { CONTINUATION_CLASSIFICATION_POLICY } from "./continuation-readiness.js";

export const UNITED_STATES_CONTINUATION_DESTINATIONS = Object.freeze({
  "physical-rivers": Object.freeze({
    kind: "journey-step",
    journeyId: "united-states",
    stepId: "us-physical-rivers"
  }),
  "physical-lakes": Object.freeze({
    kind: "journey-step",
    journeyId: "united-states",
    stepId: "us-physical-lakes"
  }),
  "physical-mountain-ranges": Object.freeze({
    kind: "journey-step",
    journeyId: "united-states",
    stepId: "us-mountain-ranges"
  })
});

const objectiveOrder = Object.freeze([
  "learn-states-and-capitals",
  "learn-physical-features",
  "learn-connections"
]);

const stateFamilyConfig = Object.freeze({
  "state-locations": Object.freeze({ itemType: "state", skillId: "state-location" }),
  "state-identification": Object.freeze({ itemType: "state", skillId: "state-identification" }),
  "state-capitals": Object.freeze({ itemType: "capital", skillId: "state-capitals" })
});

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function classification(id = "unseen") {
  const resolved = CONTINUATION_CLASSIFICATION_POLICY[id] || CONTINUATION_CLASSIFICATION_POLICY.unseen;
  return { id, ...resolved };
}

function compareCandidates(left, right) {
  return left.classification.priority - right.classification.priority
    || left.item.order - right.item.order
    || left.item.id.localeCompare(right.item.id);
}

function summarizeSectionAlternatives(candidates = []) {
  const sections = new Map();
  for (const candidate of candidates) {
    const sectionId = candidate.item.homeActivityId || candidate.item.sectionId || candidate.item.sourceActivityId;
    const existing = sections.get(sectionId);
    if (!existing || compareCandidates(candidate, existing) < 0) {
      sections.set(sectionId, candidate);
    }
  }
  return [...sections.entries()]
    .map(([sectionId, candidate]) => ({
      sectionId,
      sectionLabel: candidate.item.sectionTitle || sectionId,
      classification: candidate.classification.id,
      priorityReason: candidate.classification.reason
    }))
    .sort((left, right) => (
      classification(left.classification).priority - classification(right.classification).priority
      || left.sectionId.localeCompare(right.sectionId)
    ));
}

function selectStateAndCapitalDestination(objective, progressReport, memoryTrailItems) {
  const familyId = objective.blockingFamily?.id || objective.families?.find(({ classification: value }) => !value.sufficient)?.id;
  const familyConfig = stateFamilyConfig[familyId] || stateFamilyConfig["state-locations"];
  const category = (progressReport.categories || []).find(({ id }) => id === familyId);
  const recordByItemId = new Map((category?.records || []).map((record) => [record.itemId, record]));
  const familyItems = (memoryTrailItems || [])
    .filter((item) => item.type === familyConfig.itemType)
    .sort((left, right) => left.order - right.order || left.id.localeCompare(right.id));
  const candidates = familyItems.map((item) => {
    const record = recordByItemId.get(item.id);
    return {
      item,
      record,
      classification: classification(record?.displayCategory?.id || "unseen")
    };
  }).filter(({ classification: value }) => !value.sufficient).sort(compareCandidates);
  const selected = candidates[0] || {
    item: familyItems[0],
    record: null,
    classification: classification(objective.blockingFamily?.classification || "unseen")
  };
  const targetSectionId = selected.item?.sourceActivityId || selected.item?.homeActivityId || "";
  const resolvedSectionId = selected.item?.homeActivityId || selected.item?.sectionId || targetSectionId;

  return {
    selectedFamily: familyId,
    selectedSkill: familyConfig.skillId,
    selectedItem: selected.item ? {
      id: selected.item.id,
      label: selected.item.label,
      classification: selected.classification.id
    } : null,
    selectedSection: resolvedSectionId || null,
    reason: selected.classification.reason,
    alternatives: summarizeSectionAlternatives(candidates),
    destination: {
      kind: "united-states-guided-learning",
      targetSectionId: targetSectionId || null,
      expectedSectionId: resolvedSectionId || null
    }
  };
}

function selectPhysicalDestination(objective) {
  const familyId = objective.blockingFamily?.id;
  const destination = UNITED_STATES_CONTINUATION_DESTINATIONS[familyId];
  if (!destination) {
    throw new Error(`No authored U.S. physical learning destination exists for ${String(familyId)}.`);
  }
  return {
    selectedFamily: familyId,
    selectedSkill: familyId,
    selectedItem: null,
    selectedSection: destination.stepId,
    reason: objective.blockingFamily?.priorityReason || "not-started",
    alternatives: (objective.families || []).map((family) => ({
      familyId: family.id,
      familyLabel: family.label,
      classification: family.classification.id,
      priorityReason: family.classification.reason
    })),
    destination: clone(destination)
  };
}

export function selectUnitedStatesEvidenceDrivenContinuation({
  continuationFoundation = {},
  progressReport = {},
  memoryTrailItems = []
} = {}) {
  const objectives = continuationFoundation.objectives || [];
  const objectiveById = new Map(objectives.map((objective) => [objective.id, objective]));
  const selectedObjective = objectiveOrder
    .map((objectiveId) => objectiveById.get(objectiveId))
    .find((objective) => objective && !objective.ready)
    || objectiveById.get("explore-united-states");

  if (!selectedObjective) {
    throw new Error("U.S. continuation readiness is missing the configured objectives.");
  }

  let decision;
  if (selectedObjective.id === "learn-states-and-capitals") {
    decision = selectStateAndCapitalDestination(selectedObjective, progressReport, memoryTrailItems);
  } else if (selectedObjective.id === "learn-physical-features") {
    decision = selectPhysicalDestination(selectedObjective);
  } else if (selectedObjective.id === "learn-connections") {
    decision = {
      selectedFamily: "geographic-relationships",
      selectedSkill: "geographic-relationships",
      selectedItem: null,
      selectedSection: "us-connections",
      reason: selectedObjective.blockingFamily?.priorityReason || "not-started",
      alternatives: (selectedObjective.families || []).map((family) => ({
        familyId: family.id,
        familyLabel: family.label,
        classification: family.classification.id,
        priorityReason: family.classification.reason
      })),
      destination: { kind: "united-states-connections" }
    };
  } else {
    decision = {
      selectedFamily: null,
      selectedSkill: "integrated-geographic-reasoning",
      selectedItem: null,
      selectedSection: "rebuild-lower-48",
      reason: "all-prerequisite-objectives-ready",
      alternatives: [],
      destination: {
        kind: "expedition-step",
        stepId: "lower-48-mission"
      }
    };
  }

  return {
    schemaVersion: 1,
    kind: "evidence-driven-united-states-continuation",
    deterministic: true,
    selectedObjective: selectedObjective.id,
    selectedObjectiveLabel: selectedObjective.label,
    ...decision,
    objectiveClassifications: objectives.map((objective) => ({
      id: objective.id,
      label: objective.label,
      readiness: objective.readiness,
      blockingFamily: objective.blockingFamily?.id || null
    })),
    targetedEntry: null
  };
}
