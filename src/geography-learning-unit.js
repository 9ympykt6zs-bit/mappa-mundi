import { createCanonicalProgressReport } from "./canonical-progress-report.js";
import { getAllCanonicalEvidenceEvents } from "./canonical-learning-evidence-repository.js";
import { createExpeditionReadModel } from "./expedition-framework.js";

export function validateGeographyLearningUnitConfiguration(unit = {}) {
  const errors = [];
  if (!unit.id) errors.push("Learning unit requires an ID.");
  if (!unit.title) errors.push("Learning unit requires a title.");
  if (!unit.activityId) errors.push("Learning unit requires an activityId.");
  if (!unit.entityType) errors.push("Learning unit requires an entityType.");
  if (!Array.isArray(unit.targets) || unit.targets.length === 0) errors.push("Learning unit requires targets.");
  if (!Array.isArray(unit.evidenceMetrics) || unit.evidenceMetrics.length === 0) errors.push("Learning unit requires evidenceMetrics.");
  const ids = new Set();
  for (const target of unit.targets || []) {
    if (!target?.id || !target?.label) errors.push("Every learning-unit target requires an id and label.");
    if (ids.has(target?.id)) errors.push(`Duplicate learning-unit target: ${target.id}.`);
    if (target?.id) ids.add(target.id);
  }
  return errors;
}

export function createGeographyLearningUnitItems(unit = {}) {
  const errors = validateGeographyLearningUnitConfiguration(unit);
  if (errors.length) throw new Error(errors.join(" "));
  return unit.targets.map((target) => ({
    id: `${unit.entityType}:${target.id}`,
    targetId: target.id,
    label: target.label,
    type: unit.entityType,
    sourceActivityId: unit.activityId
  }));
}

export function createGeographyLearningUnitEvidence(unit = {}, repository) {
  const targetIds = new Set((unit.targets || []).map(({ id }) => id));
  const events = getAllCanonicalEvidenceEvents(repository).filter((event) => (
    event.sourceActivityId === unit.activityId
    && targetIds.has(event.conceptId.split(":").at(-1))
  ));
  return Object.fromEntries([
    ...(unit.evidenceMetrics || []).map(({ id, conceptPrefix, skillId }) => [
      id,
      new Set(events
        .filter((event) => event.conceptId.startsWith(conceptPrefix) && event.skillId === skillId)
        .map((event) => event.conceptId)).size
    ]),
    ["canonicalAttemptCount", new Set(events.map((event) => event.attemptId || event.eventId)).size]
  ]);
}

export function createGeographyLearningUnitExpeditionModel(unit = {}, repository) {
  return createExpeditionReadModel(unit.expedition, createGeographyLearningUnitEvidence(unit, repository));
}

export function createGeographyLearningUnitProgressReport(unit = {}, repository) {
  const items = createGeographyLearningUnitItems(unit);
  return createCanonicalProgressReport({
    kind: "geography-learning-unit-demonstrated-progress-report",
    title: "Progress Report",
    scopeTitle: unit.title,
    sectionTitle: "What you know",
    subtitle: unit.progressReport?.subtitle || "Your progress is based on retrieval answers recorded across Mappa Mundi.",
    howProgressWorks: unit.progressReport?.howProgressWorks || [],
    dataSources: ["Canonical evidence routed through the shared Progress Evidence Policy"],
    items,
    categoryDefinitions: unit.progressReportCategories.map((definition) => ({
      ...definition,
      getMappings: (item) => definition.getMappings(item)
    })),
    repository
  });
}
