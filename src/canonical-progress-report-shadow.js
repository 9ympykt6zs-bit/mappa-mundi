import { createCanonicalProgressReport } from "./canonical-progress-report.js";
import {
  createEmptyCanonicalEvidenceRepository,
  getAllCanonicalEvidenceEvents
} from "./canonical-learning-evidence-repository.js";
import {
  applyProgressEvidencePolicy,
  PROGRESS_REPORT_ROLLUP_POLICIES,
  USER_FACING_PROGRESS_SKILLS
} from "./progress-evidence-policy.js?v=20260821-central-america-graduation-1";
import {
  createUnitedStatesProgressReport,
  UNITED_STATES_PROGRESS_REPORT_CATEGORY_DEFINITIONS
} from "./united-states-progress-report.js";
import { getStateCapitalRelationshipPairs } from "./atlas/state-capital-relationship-challenges.js";
import { getUnifiedMentalMapChallenges } from "./atlas/mental-map-challenge-registry.js";
import { getCanonicalMentalMapConceptId } from "./canonical-learning-evidence.js";

const capitalRelationshipConceptByStateId = new Map(
  getStateCapitalRelationshipPairs().map(({ stateId, conceptId }) => [stateId, conceptId])
);

const GEOGRAPHIC_RELATIONSHIPS_CATEGORY = Object.freeze({
  id: "geographic-relationships",
  label: "Geographic Relationships",
  itemType: "state",
  signalId: "relationships"
});

function relationshipChallengeStateIds(challenge) {
  return [...new Set([
    ...(challenge.correctStateIds || []),
    ...(challenge.orderedStateIds || []),
    ...(challenge.referenceStateIds || []),
    challenge.correctStateId,
    challenge.referenceStateId,
    challenge.routeStartStateId,
    challenge.routeDestinationStateId
  ].filter(Boolean))];
}

const geographicRelationshipHistoriesByStateId = (() => {
  const byStateId = new Map();
  for (const challenge of getUnifiedMentalMapChallenges({
    includeGenerated: false,
    includeUnitedStatesRelationships: true
  })) {
    const conceptId = getCanonicalMentalMapConceptId(challenge);
    if (!conceptId?.startsWith("relationship:")) continue;
    const canonicalSkillId = challenge.canonicalSkillId
      || (challenge.answerMode === "ordered-sequence" ? "sequencing" : "relationship-recall");
    for (const stateId of relationshipChallengeStateIds(challenge)) {
      const entries = byStateId.get(stateId) || [];
      if (!entries.some((entry) => entry.conceptId === conceptId && entry.canonicalSkillId === canonicalSkillId)) {
        entries.push({
          historyKey: `${USER_FACING_PROGRESS_SKILLS.GEOGRAPHIC_RELATIONSHIPS}\u0000${conceptId}`,
          conceptId,
          canonicalSkillId,
          progressSkillId: USER_FACING_PROGRESS_SKILLS.GEOGRAPHIC_RELATIONSHIPS
        });
      }
      byStateId.set(stateId, entries);
    }
  }
  return byStateId;
})();

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function itemLabel(item, itemsById) {
  if (item.type !== "capital") return item.label;
  const state = itemsById.get(item.relatedStateItemId);
  return state ? `${state.label} — ${item.label}` : item.label;
}

function approvedHistoryKeys(item, category, itemsById) {
  if (item.type === "state" && category.id === "state-locations") {
    return [{
      historyKey: `${USER_FACING_PROGRESS_SKILLS.STATE_LOCATION}\u0000state-location:${item.targetId}`,
      conceptId: `state-location:${item.targetId}`,
      canonicalSkillId: "locating",
      progressSkillId: USER_FACING_PROGRESS_SKILLS.STATE_LOCATION
    }];
  }
  if (item.type === "state" && category.id === "state-identification") {
    return [{
      historyKey: `${USER_FACING_PROGRESS_SKILLS.STATE_IDENTIFICATION}\u0000state-naming:${item.targetId}`,
      conceptId: `state-naming:${item.targetId}`,
      canonicalSkillId: "identifying",
      progressSkillId: USER_FACING_PROGRESS_SKILLS.STATE_IDENTIFICATION
    }];
  }
  if (item.type === "capital" && category.id === "state-capitals") {
    const state = itemsById.get(item.relatedStateItemId);
    const stateId = item.relatedStateTargetId || state?.targetId;
    if (!stateId) return [];
    const capitalRelationshipConceptId = capitalRelationshipConceptByStateId.get(stateId);
    return [
      {
        historyKey: `${USER_FACING_PROGRESS_SKILLS.CAPITAL_LOCATION}\u0000capital-location:${stateId}:${item.targetId}`,
        conceptId: `capital-location:${stateId}:${item.targetId}`,
        canonicalSkillId: "locating",
        progressSkillId: USER_FACING_PROGRESS_SKILLS.CAPITAL_LOCATION
      },
      {
        historyKey: `${USER_FACING_PROGRESS_SKILLS.CAPITAL_IDENTIFICATION}\u0000capital-naming:${stateId}:${item.targetId}`,
        conceptId: `capital-naming:${stateId}:${item.targetId}`,
        canonicalSkillId: "identifying",
        progressSkillId: USER_FACING_PROGRESS_SKILLS.CAPITAL_IDENTIFICATION
      },
      ...(capitalRelationshipConceptId ? [{
        historyKey: `${USER_FACING_PROGRESS_SKILLS.CAPITAL_OF_RELATIONSHIP}\u0000${capitalRelationshipConceptId}`,
        conceptId: capitalRelationshipConceptId,
        canonicalSkillId: "relationship-recall",
        progressSkillId: USER_FACING_PROGRESS_SKILLS.CAPITAL_OF_RELATIONSHIP
      }] : [])
    ];
  }
  if (item.type === "state" && category.id === GEOGRAPHIC_RELATIONSHIPS_CATEGORY.id) {
    return geographicRelationshipHistoriesByStateId.get(item.targetId) || [];
  }
  return [];
}

export function createCanonicalUnitedStatesProgressReport({
  items = [],
  repository,
  legacyPresentationReport
} = {}) {
  const inputSnapshot = JSON.stringify({ items, repository, legacyPresentationReport });
  const resolvedRepository = repository || createEmptyCanonicalEvidenceRepository();
  const safeItems = clone(items).filter((item) => ["state", "capital"].includes(item.type));
  const itemsById = new Map(safeItems.map((item) => [item.id, item]));
  const emptyPresentation = createUnitedStatesProgressReport({ items: safeItems });
  const baseReport = legacyPresentationReport ? clone(legacyPresentationReport) : emptyPresentation;
  const events = getAllCanonicalEvidenceEvents(resolvedRepository);
  const policyResult = applyProgressEvidencePolicy(events);
  const baseCategories = new Map(baseReport.categories.map((category) => [category.id, category]));
  const emptyCategories = new Map(emptyPresentation.categories.map((category) => [category.id, category]));
  const emptyStateRecords = new Map((emptyCategories.get("state-locations")?.records || []).map((record) => [record.itemId, record]));
  const hasGeographicRelationshipHistory = policyResult.histories.some(
    ({ progressSkillId }) => progressSkillId === USER_FACING_PROGRESS_SKILLS.GEOGRAPHIC_RELATIONSHIPS
  );
  const canonicalDefinitions = [
    ...UNITED_STATES_PROGRESS_REPORT_CATEGORY_DEFINITIONS,
    ...(hasGeographicRelationshipHistory ? [GEOGRAPHIC_RELATIONSHIPS_CATEGORY] : [])
  ];
  const presentationCategories = canonicalDefinitions.map((definition) => ({
    ...(baseCategories.get(definition.id) || emptyCategories.get(definition.id) || {}),
    id: definition.id,
    label: definition.label,
    records: safeItems
      .filter((item) => item.type === definition.itemType)
      .map((item) => {
        const baseRecords = new Map((baseCategories.get(definition.id)?.records || []).map((record) => [record.itemId, record]));
        const emptyRecords = new Map((emptyCategories.get(definition.id)?.records || []).map((record) => [record.itemId, record]));
        return clone(baseRecords.get(item.id) || emptyRecords.get(item.id) || emptyStateRecords.get(item.id));
      })
  }));
  const coreReport = createCanonicalProgressReport({
    kind: "united-states-demonstrated-progress-report-canonical-first",
    title: baseReport.title,
    scopeTitle: baseReport.scopeTitle,
    sectionTitle: baseReport.sectionTitle,
    subtitle: baseReport.subtitle,
    howProgressWorks: baseReport.howProgressWorks,
    dataSources: [
      "Canonical evidence routed through Progress Evidence Policy v1",
      "Existing scheduler status shown separately from demonstrated progress when available"
    ],
    items: safeItems.map((item) => ({ ...item, label: itemLabel(item, itemsById) })),
    categoryDefinitions: canonicalDefinitions.map((definition) => ({
      ...definition,
      getMappings: (item) => approvedHistoryKeys(item, definition, itemsById)
    })),
    repository: resolvedRepository,
    baseReport: { ...baseReport, categories: presentationCategories }
  });
  const canonicalCategories = coreReport.categories;
  const supportedCategoryIds = new Set(canonicalDefinitions.map(({ id }) => id));
  const categories = [
    ...canonicalCategories,
    ...baseReport.categories.filter(({ id }) => !supportedCategoryIds.has(id)).map(clone)
  ];
  const report = {
    ...coreReport,
    categories,
    readPath: {
      ...coreReport.readPath,
      supportedCategoryIds: canonicalDefinitions.map(({ id }) => id),
      capitalRollup: clone(PROGRESS_REPORT_ROLLUP_POLICIES["state-capitals"])
    }
  };
  if (JSON.stringify({ items, repository, legacyPresentationReport }) !== inputSnapshot) {
    throw new Error("Canonical Progress Report adapter mutated its inputs.");
  }
  return report;
}

export function createCanonicalUnitedStatesProgressReportShadow(options = {}) {
  const report = createCanonicalUnitedStatesProgressReport(options);
  return {
    ...report,
    kind: "united-states-demonstrated-progress-report-canonical-shadow",
    developerOnly: true,
    scoringModel: {
      module: "src/bayesian-progress-score.js",
      function: "scoreBayesianEvidenceCounts"
    },
    scoringInputPolicy: "Progress Evidence Policy histories only; raw events are provenance only",
    limitations: [
      "Canonical events cover new emission only and do not reconstruct legacy history.",
      "Scheduler review status remains source-specific and separate from canonical demonstrated progress.",
      "The current State Capitals rollup combines three separate policy histories: locating, identifying, and capital-of relationship recall."
    ]
  };
}
