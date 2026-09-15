export const UNITED_STATES_GUIDED_CORE_CAPSTONE_SESSION_TYPE = "guided-core-capstone";
export const UNITED_STATES_GUIDED_CORE_CAPSTONE_QUESTION_COUNT = 10;

const practiceStatuses = new Set(["introduced", "learning", "review", "mastered"]);
const reconstructionType = "reconstruction-checkpoint";

function uniqueStrings(values = []) {
  return [...new Set((Array.isArray(values) ? values : [])
    .map((value) => String(value || "").trim())
    .filter(Boolean))];
}

function isIntroduced(state, item) {
  const status = state?.itemProgress?.[item?.id]?.status;
  return practiceStatuses.has(status) || state?.introducedItemIds?.includes(item?.id);
}

export function getUnitedStatesGuidedCoreRequiredBlockIds(config = {}) {
  return uniqueStrings([
    ...(config.blocks || [])
      .filter((block) => block?.type === reconstructionType && block.repeatable !== true)
      .map((block) => block.id),
    ...(config.physicalFeatures || []).flatMap((feature) => [
      feature.introductionBlockId,
      feature.practiceBlockId || feature.completionBlockId
    ])
  ]);
}

export function getUnitedStatesGuidedCoreCurriculumStatus({
  trailState = {},
  politicalItems = [],
  orchestrationState = {},
  config = {}
} = {}) {
  const stateItems = politicalItems.filter((item) => item?.type === "state");
  const capitalItems = politicalItems.filter((item) => item?.type === "capital");
  const introducedStateItems = stateItems.filter((item) => isIntroduced(trailState, item));
  const introducedCapitalItems = capitalItems.filter((item) => isIntroduced(trailState, item));
  const completedBlockIds = new Set(uniqueStrings(orchestrationState.completedBlockIds));
  const requiredBlockIds = getUnitedStatesGuidedCoreRequiredBlockIds(config);
  const missingRequiredBlockIds = requiredBlockIds.filter((blockId) => !completedBlockIds.has(blockId));
  const inventoryValid = stateItems.length === 50
    && capitalItems.length === 50
    && new Set(stateItems.map((item) => item.targetId)).size === 50
    && new Set(capitalItems.map((item) => item.targetId)).size === 50;
  const coreComplete = inventoryValid
    && introducedStateItems.length === 50
    && introducedCapitalItems.length === 50
    && missingRequiredBlockIds.length === 0;
  const capstone = trailState.guidedCoreCapstone || {};

  return {
    inventoryValid,
    coreComplete,
    capstoneActive: capstone.status === "active",
    capstoneComplete: capstone.status === "completed",
    mode: coreComplete
      ? capstone.status === "completed" ? "post-state-curriculum" : "guided-core-capstone"
      : "guided-curriculum",
    stateItemCount: stateItems.length,
    capitalItemCount: capitalItems.length,
    learnedStateCount: introducedStateItems.length,
    learnedCapitalCount: introducedCapitalItems.length,
    learnedPoliticalCount: introducedStateItems.length + introducedCapitalItems.length,
    requiredBlockCount: requiredBlockIds.length,
    completedRequiredBlockCount: requiredBlockIds.length - missingRequiredBlockIds.length,
    missingStateItemIds: stateItems.filter((item) => !isIntroduced(trailState, item)).map((item) => item.id),
    missingCapitalItemIds: capitalItems.filter((item) => !isIntroduced(trailState, item)).map((item) => item.id),
    missingRequiredBlockIds
  };
}

function hashString(value) {
  return String(value || "").split("").reduce((hash, character) => (
    ((hash << 5) - hash + character.charCodeAt(0)) | 0
  ), 0);
}

function deterministicPick(items, count, seed) {
  return [...items]
    .sort((left, right) => (
      Math.abs(hashString(`${seed}:${left.id}`)) - Math.abs(hashString(`${seed}:${right.id}`))
      || String(left.id).localeCompare(String(right.id))
    ))
    .slice(0, count);
}

function politicalBand(item) {
  const section = Math.max(0, Number(item?.homeStepIndex) || 0);
  if (section >= 10) return "noncontiguous";
  if (section >= 7) return "west";
  if (section >= 3) return "south-central";
  return "east";
}

function physicalStage(feature, config) {
  return (config.physicalCohorts || [])
    .find((cohort) => cohort.id === feature.learningCohortId)?.regionalStage || 6;
}

function physicalBand(feature, config) {
  const stage = physicalStage(feature, config);
  if (stage >= 11) return "noncontiguous";
  if (stage >= 8) return "west";
  if (stage >= 5) return "central";
  return "east";
}

export function buildUnitedStatesGuidedPhysicalItems(config = {}) {
  return (config.physicalFeatures || []).map((feature, index) => ({
    id: `${feature.family}:${feature.targetId}`,
    type: feature.family,
    category: "physical",
    targetId: feature.targetId,
    targetKind: "shape",
    label: feature.name,
    sourceActivityId: feature.activityId,
    homeActivityId: feature.activityId,
    homeJourneyId: feature.journeyId || "united-states",
    homeStepId: feature.stepId || feature.activityId,
    homeStepIndex: physicalStage(feature, config),
    sectionId: feature.activityId,
    sectionIndex: physicalStage(feature, config),
    sectionTitle: "U.S. Physical Geography",
    activityTitle: "U.S. Physical Geography",
    cameraGroupId: feature.learningCohortId || feature.activityId,
    geographicBand: physicalBand(feature, config),
    order: 20000 + index
  }));
}

function pickAcrossBands(items, bands, seed) {
  const selected = [];
  bands.forEach((band) => {
    const pick = deterministicPick(items.filter((item) => (
      (item.geographicBand || politicalBand(item)) === band
      && !selected.some((candidate) => candidate.id === item.id)
    )), 1, `${seed}:${band}`)[0];
    if (pick) selected.push(pick);
  });
  deterministicPick(items.filter((item) => !selected.some(({ id }) => id === item.id)), bands.length - selected.length, `${seed}:fill`)
    .forEach((item) => selected.push(item));
  return selected;
}

export function planUnitedStatesGuidedCoreCapstone({
  trailState = {},
  politicalItems = [],
  orchestrationState = {},
  config = {},
  selectionVersion = 1
} = {}) {
  const status = getUnitedStatesGuidedCoreCurriculumStatus({ trailState, politicalItems, orchestrationState, config });
  if (!status.coreComplete || status.capstoneComplete || trailState.activeSession) return null;

  const physicalItems = buildUnitedStatesGuidedPhysicalItems(config);
  const states = politicalItems.filter((item) => item.type === "state" && isIntroduced(trailState, item));
  const capitals = politicalItems.filter((item) => item.type === "capital" && isIntroduced(trailState, item));
  const introducedPhysicalIds = new Set((config.physicalFeatures || [])
    .filter((feature) => orchestrationState.completedBlockIds?.includes(feature.introductionBlockId))
    .map((feature) => feature.targetId));
  const physical = physicalItems.filter((item) => introducedPhysicalIds.has(item.targetId));
  if (states.length !== 50 || capitals.length !== 50 || physical.length !== config.physicalFeatures?.length) return null;

  const seed = `us-guided-core-capstone:v${selectionVersion}`;
  const selectedStates = pickAcrossBands(states, ["east", "south-central", "west", "noncontiguous"], `${seed}:states`);
  const selectedCapitals = pickAcrossBands(capitals, ["east", "south-central", "west"], `${seed}:capitals`);
  const selectedPhysical = ["river", "lake", "mountain-range"].flatMap((family) => (
    deterministicPick(physical.filter((item) => item.type === family), 1, `${seed}:${family}`)
  ));
  const groups = [selectedStates, selectedCapitals, selectedPhysical];
  const playItems = [];
  for (let index = 0; index < 4; index += 1) {
    groups.forEach((group) => {
      if (group[index]) playItems.push(group[index]);
    });
  }
  if (playItems.length !== UNITED_STATES_GUIDED_CORE_CAPSTONE_QUESTION_COUNT) return null;

  const selectedCapitalIds = new Set(selectedCapitals.map((item) => item.id));
  const presentationItems = [
    ...politicalItems.filter((item) => item.type === "state" || selectedCapitalIds.has(item.id)),
    ...physicalItems
  ];
  return {
    trailId: "united-states-memory-trail",
    source: "united-states-trail",
    sessionId: `us-guided-core-capstone-v${selectionVersion}`,
    sessionType: UNITED_STATES_GUIDED_CORE_CAPSTONE_SESSION_TYPE,
    title: "United States Final Review",
    activeActivityId: selectedStates[0]?.homeActivityId || politicalItems[0]?.homeActivityId || "",
    activeSectionId: selectedStates[0]?.homeActivityId || politicalItems[0]?.homeActivityId || "",
    currentSessionNumber: Math.max(1, Number(trailState.currentSessionNumber) || 1),
    newItems: [],
    reviewItems: playItems,
    weakReviewItems: [],
    oldReviewItems: [],
    recentReviewItems: [],
    fairnessReviewItems: [],
    playItems,
    allItems: [...politicalItems, ...physicalItems],
    presentationItems,
    capstone: {
      selectionVersion,
      questionCount: playItems.length,
      targetOrder: playItems.map((item) => item.targetId),
      itemIds: playItems.map((item) => item.id),
      categoryCounts: {
        state: selectedStates.length,
        capital: selectedCapitals.length,
        physical: selectedPhysical.length
      },
      physicalFamilyCounts: Object.fromEntries(["river", "lake", "mountain-range"].map((family) => [
        family,
        selectedPhysical.filter((item) => item.type === family).length
      ])),
      geographicBands: uniqueStrings(playItems.map((item) => item.geographicBand || politicalBand(item))),
      introducedOnly: true,
      fixedAttempt: true
    }
  };
}
