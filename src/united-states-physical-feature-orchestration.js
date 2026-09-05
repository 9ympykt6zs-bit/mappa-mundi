import {
  PHYSICAL_GEOMETRY_REPRESENTATIONS,
  unitedStatesAtlas
} from "./atlas/united-states-atlas-data.js";
import {
  getUnitedStatesRelationshipChallenges,
  UNITED_STATES_RELATIONSHIP_TYPES
} from "./atlas/united-states-relationship-challenges.js";

export const UNITED_STATES_PHYSICAL_FEATURE_FAMILIES = Object.freeze({
  RIVER: "river",
  LAKE: "lake",
  MOUNTAIN_RANGE: "mountain-range"
});

export const UNITED_STATES_PHYSICAL_LEARNING_COHORTS = Object.freeze([
  Object.freeze({
    id: "western-rivers",
    family: UNITED_STATES_PHYSICAL_FEATURE_FAMILIES.RIVER,
    source: "authored-memory-trail-section",
    sourceId: "western-rivers",
    authoredMemberTargetIds: Object.freeze(["colorado-river", "columbia-river", "rio-grande-river"]),
    minimumRetrievalSize: 2,
    preferredRetrievalSize: 3
  }),
  Object.freeze({
    id: "central-eastern-rivers",
    family: UNITED_STATES_PHYSICAL_FEATURE_FAMILIES.RIVER,
    source: "authored-memory-trail-section",
    sourceId: "central-eastern-rivers",
    authoredMemberTargetIds: Object.freeze([
      "arkansas-river",
      "mississippi-river",
      "missouri-river",
      "ohio-river",
      "st-lawrence-river"
    ]),
    minimumRetrievalSize: 2,
    preferredRetrievalSize: 3
  }),
  Object.freeze({
    id: "northeast-mountains",
    family: UNITED_STATES_PHYSICAL_FEATURE_FAMILIES.MOUNTAIN_RANGE,
    source: "product-approved-subgroup-of-authored-eastern-mountains",
    sourceId: "us-physical-eastern-mountains",
    authoredMemberTargetIds: Object.freeze([
      "white-mountains",
      "green-mountains",
      "adirondack-mountains"
    ]),
    minimumRetrievalSize: 2,
    preferredRetrievalSize: 3,
    camera: Object.freeze({ mode: "override", center: Object.freeze([-76.24, 40.39]), zoom: 5.16, bearing: 0, pitch: 0 })
  }),
  Object.freeze({
    id: "central-mountains",
    family: UNITED_STATES_PHYSICAL_FEATURE_FAMILIES.MOUNTAIN_RANGE,
    source: "authored-activity-section",
    sourceId: "us-physical-midwestern-mountains",
    authoredMemberTargetIds: Object.freeze(["ozark-mountains", "ouachita-mountains", "black-hills"]),
    minimumRetrievalSize: 2,
    preferredRetrievalSize: 3
  }),
  Object.freeze({
    id: "alaska-mountains",
    family: UNITED_STATES_PHYSICAL_FEATURE_FAMILIES.MOUNTAIN_RANGE,
    source: "authored-activity-section",
    sourceId: "us-physical-alaska-mountains",
    authoredMemberTargetIds: Object.freeze(["alaska-range", "brooks-range"]),
    minimumRetrievalSize: 2,
    preferredRetrievalSize: 2
  })
]);

export const UNITED_STATES_PHYSICAL_COHORT_DEFERRED_GROUPS = Object.freeze([
  Object.freeze({
    family: UNITED_STATES_PHYSICAL_FEATURE_FAMILIES.MOUNTAIN_RANGE,
    sourceId: "us-physical-western-mountains",
    reason: "authored-group-too-large-for-novice-cohort"
  }),
  Object.freeze({
    family: UNITED_STATES_PHYSICAL_FEATURE_FAMILIES.MOUNTAIN_RANGE,
    sourceId: "us-physical-eastern-mountains:remaining-members",
    reason: "no-authored-small-subgroup"
  }),
  Object.freeze({
    family: UNITED_STATES_PHYSICAL_FEATURE_FAMILIES.LAKE,
    sourceId: "us-physical-lakes",
    reason: "no-authored-small-cohort"
  })
]);

const familyConfigs = Object.freeze({
  [UNITED_STATES_PHYSICAL_FEATURE_FAMILIES.RIVER]: Object.freeze({
    activityId: "us-physical-rivers",
    journeyId: "united-states",
    relationshipTypes: Object.freeze(["flowsThrough", "bordersState"]),
    connectionRelationshipType: UNITED_STATES_RELATIONSHIP_TYPES.RIVER_THROUGH,
    conceptNamespace: "river",
    teachingVerb: "flows through or alongside"
  }),
  [UNITED_STATES_PHYSICAL_FEATURE_FAMILIES.LAKE]: Object.freeze({
    activityId: "us-physical-lakes",
    journeyId: "united-states",
    relationshipTypes: Object.freeze(["bordersState", "majorBordersState"]),
    connectionRelationshipType: UNITED_STATES_RELATIONSHIP_TYPES.MAJOR_LAKE_BORDER,
    conceptNamespace: "lake",
    teachingVerb: "borders"
  }),
  [UNITED_STATES_PHYSICAL_FEATURE_FAMILIES.MOUNTAIN_RANGE]: Object.freeze({
    activityId: "us-mountain-ranges",
    journeyId: "us-mountain-ranges",
    relationshipTypes: Object.freeze(["locatedIn"]),
    connectionRelationshipType: UNITED_STATES_RELATIONSHIP_TYPES.MOUNTAIN_RANGE,
    conceptNamespace: "mountain-range",
    teachingVerb: "extends across"
  })
});

function publicId(entityId = "") {
  return String(entityId).split(":").slice(1).join(":");
}

function uniqueStrings(values = []) {
  return [...new Set(values.map((value) => String(value || "").trim()).filter(Boolean))];
}

function getAuthoredStateIds(atlas, entity, familyConfig) {
  const relationshipTypes = new Set(familyConfig.relationshipTypes);
  return uniqueStrings((atlas.relationships || [])
    .filter(({ type, from, to }) => relationshipTypes.has(type) && from === entity.id && to?.startsWith("state:"))
    .map(({ to }) => publicId(to)));
}

function getAuthoredConnectionChallenges(challenges, entity, familyConfig) {
  return challenges.filter((challenge) => (
    challenge.relationshipType === familyConfig.connectionRelationshipType
    && challenge.relationship?.targetEntityId === entity.id
  ));
}

function validateIntroductionOverride(featureId, overrideStateIds, authoredStateIds) {
  const normalized = uniqueStrings(overrideStateIds);
  if (normalized.length === 0) {
    throw new TypeError(`${featureId} has an empty physical-feature introduction prerequisite override.`);
  }
  const authored = new Set(authoredStateIds);
  const invalid = normalized.filter((stateId) => !authored.has(stateId));
  if (invalid.length > 0) {
    throw new TypeError(`${featureId} introduction override references non-authored states: ${invalid.join(", ")}.`);
  }
  return normalized;
}

function normalizeCamera(camera = {}) {
  if (camera?.mode === "override") {
    const longitude = Number(camera.longitude ?? camera.center?.[0]);
    const latitude = Number(camera.latitude ?? camera.center?.[1]);
    const zoom = Number(camera.zoom);
    if (![longitude, latitude, zoom].every(Number.isFinite)) {
      throw new TypeError("A physical-feature camera override needs finite longitude, latitude, and zoom values.");
    }
    return Object.freeze({
      mode: "override",
      center: Object.freeze([longitude, latitude]),
      zoom,
      bearing: Number.isFinite(Number(camera.bearing)) ? Number(camera.bearing) : 0,
      pitch: Number.isFinite(Number(camera.pitch)) ? Number(camera.pitch) : 0
    });
  }
  return Object.freeze({ mode: "fit-feature" });
}

function createTeachingMessage(feature, stateNames) {
  const locations = stateNames.length <= 1
    ? stateNames[0] || "the United States"
    : `${stateNames.slice(0, -1).join(", ")} and ${stateNames.at(-1)}`;
  return `${feature.name} ${familyConfigs[feature.kind].teachingVerb} ${locations}.`;
}

export function buildUnitedStatesPhysicalFeatureOrchestrationInventory({
  atlas = unitedStatesAtlas,
  challenges = getUnitedStatesRelationshipChallenges(atlas),
  introductionPrerequisiteStateIdsByFeature = {},
  cameraOverridesByFeature = {},
  learningCohorts = UNITED_STATES_PHYSICAL_LEARNING_COHORTS
} = {}) {
  const statesById = new Map((atlas.entities || [])
    .filter(({ kind }) => kind === "state")
    .map((state) => [publicId(state.id), state]));
  const physicalEntities = (atlas.entities || []).filter(({ kind }) => familyConfigs[kind]);
  const cohortsByTargetId = new Map();
  learningCohorts.forEach((cohort) => {
    cohort.authoredMemberTargetIds.forEach((targetId) => {
      if (cohortsByTargetId.has(targetId)) {
        throw new TypeError(`${targetId} belongs to more than one physical learning cohort.`);
      }
      cohortsByTargetId.set(targetId, cohort);
    });
  });

  return physicalEntities.map((entity, authoredOrder) => {
    const featureId = publicId(entity.id);
    const familyConfig = familyConfigs[entity.kind];
    const authoredStateIds = getAuthoredStateIds(atlas, entity, familyConfig);
    const override = introductionPrerequisiteStateIdsByFeature[entity.id]
      ?? introductionPrerequisiteStateIdsByFeature[featureId];
    const introductionPrerequisiteStateIds = override
      ? validateIntroductionOverride(entity.id, override, authoredStateIds)
      : authoredStateIds;
    const connectionChallenges = getAuthoredConnectionChallenges(challenges, entity, familyConfig);
    const geometryRepresentation = entity.geometry?.representation || PHYSICAL_GEOMETRY_REPRESENTATIONS.INCOMPLETE;
    const supported = Boolean(
      entity.source?.featureId
      && entity.geometry?.asset
      && authoredStateIds.length > 0
      && geometryRepresentation !== PHYSICAL_GEOMETRY_REPRESENTATIONS.INCOMPLETE
    );
    const cameraOverride = cameraOverridesByFeature[entity.id] ?? cameraOverridesByFeature[featureId];
    const stateNames = introductionPrerequisiteStateIds
      .map((stateId) => statesById.get(stateId)?.name)
      .filter(Boolean);
    const learningCohort = cohortsByTargetId.get(featureId) || null;
    if (learningCohort && learningCohort.family !== entity.kind) {
      throw new TypeError(`${entity.id} has a physical learning cohort in the wrong family.`);
    }
    return Object.freeze({
      id: entity.id,
      targetId: featureId,
      conceptId: `${familyConfig.conceptNamespace}-location:${featureId}`,
      name: entity.name,
      family: entity.kind,
      authoredOrder,
      activityId: familyConfig.activityId,
      journeyId: familyConfig.journeyId,
      stepId: familyConfig.activityId,
      targetType: entity.kind,
      geometry: Object.freeze({
        asset: entity.geometry?.asset || "",
        featureId: entity.geometry?.featureId || entity.source?.featureId || featureId,
        representation: geometryRepresentation,
        crossesInternationalBorder: entity.geometry?.crossesInternationalBorder === true,
        hasCrossBorderVisualContinuation: entity.geometry?.hasCrossBorderVisualContinuation === true,
        reason: entity.geometry?.reason || ""
      }),
      supported,
      exclusionReason: supported
        ? null
        : geometryRepresentation === PHYSICAL_GEOMETRY_REPRESENTATIONS.INCOMPLETE
          ? "incomplete-geometry"
          : "missing-or-untrusted-learning-contract",
      prerequisiteSource: override ? "explicit-introduction-override" : "derived-authored-relationships",
      authoredStateIds: Object.freeze(authoredStateIds),
      introductionPrerequisiteStateIds: Object.freeze(introductionPrerequisiteStateIds),
      introductionPrerequisiteConceptIds: Object.freeze(introductionPrerequisiteStateIds.flatMap((stateId) => [
        `state-location:${stateId}`,
        `state-naming:${stateId}`
      ])),
      connectionChallengeIds: Object.freeze(connectionChallenges.map(({ id }) => id)),
      selectedConnectionChallengeId: connectionChallenges[0]?.id || null,
      selectedConnectionConceptId: connectionChallenges[0]?.canonicalConceptId || null,
      connectionAlternatives: Object.freeze(connectionChallenges.map((challenge) => Object.freeze({
        id: challenge.id,
        conceptId: challenge.canonicalConceptId,
        stateId: challenge.referenceStateId
      }))),
      camera: normalizeCamera(cameraOverride),
      teachingMessage: createTeachingMessage(entity, stateNames),
      learningCohortId: learningCohort?.id || null,
      retrievalGroupingStatus: learningCohort ? "cohort-authored" : "deferred-no-safe-small-cohort",
      retrievalGroupingReason: learningCohort ? null : "No safe authored small cohort is configured for this feature."
    });
  });
}

function collectCoordinates(value, coordinates = []) {
  if (!Array.isArray(value)) return coordinates;
  if (value.length >= 2 && Number.isFinite(value[0]) && Number.isFinite(value[1])) {
    coordinates.push([Number(value[0]), Number(value[1])]);
    return coordinates;
  }
  value.forEach((child) => collectCoordinates(child, coordinates));
  return coordinates;
}

export function getPhysicalFeatureGeometryExtent(feature = {}, { includeVisualContinuation = true } = {}) {
  const coordinates = collectCoordinates(feature?.geometry?.coordinates);
  if (includeVisualContinuation) {
    const visualArt = feature?.properties?.visualArt || {};
    collectCoordinates(visualArt.spines, coordinates);
    collectCoordinates(visualArt.visualOnlySpines, coordinates);
    collectCoordinates(feature?.properties?.symbolAnchors, coordinates);
  }
  if (coordinates.length === 0) return null;
  return [
    [Math.min(...coordinates.map(([longitude]) => longitude)), Math.min(...coordinates.map(([, latitude]) => latitude))],
    [Math.max(...coordinates.map(([longitude]) => longitude)), Math.max(...coordinates.map(([, latitude]) => latitude))]
  ];
}

export const UNITED_STATES_GUIDED_LOWER48_PHYSICAL_CAMERA = Object.freeze({
  mode: "override",
  center: Object.freeze([-97.76220, 39.30636]),
  zoom: 4.1407,
  bearing: 0,
  pitch: 0
});

// Keep disconnected geography in its own authored frame. Resolve the camera
// from the already-loaded activity so it shares the authored source of truth.
// Future regional presets can follow this contract without changing lower 48.
export const UNITED_STATES_GUIDED_PHYSICAL_REGIONAL_CAMERA_PRESETS = Object.freeze([
  Object.freeze({
    id: "alaska",
    source: "alaska-preset",
    authoredActivityId: "us-physical-alaska-mountains",
    cameraKey: "quizView",
    targetIds: Object.freeze(["alaska-range", "brooks-range"]),
    stateIds: Object.freeze(["alaska"])
  })
]);

function fixedPhysicalCameraDecision(camera, source) {
  const normalized = normalizeCamera({ ...camera, mode: "override" });
  return { ...normalized, center: [...normalized.center], source };
}

export function calculateGuidedLearningPhysicalFeatureCamera({
  feature,
  family,
  camera = { mode: "fit-feature" },
  cohortCamera = null,
  targetId = feature?.properties?.id || feature?.id || "",
  authoredStateIds = [],
  regionId = null,
  activityMap = null,
  regionalCameraPresets = UNITED_STATES_GUIDED_PHYSICAL_REGIONAL_CAMERA_PRESETS,
  cameraPhase = "teaching"
} = {}) {
  if (cameraPhase === "retrieval" && family === "mountain-range") {
    const regionalPreset = regionalCameraPresets.find((preset) => preset.targetIds?.includes(targetId));
    if (!regionalPreset) return {
      ...fixedPhysicalCameraDecision(UNITED_STATES_GUIDED_LOWER48_PHYSICAL_CAMERA, "lower48-physical-default"),
      cameraPhase,
      searchSpace: "lower48"
    };
    const activity = activityMap?.get?.(regionalPreset.authoredActivityId) || activityMap?.[regionalPreset.authoredActivityId];
    const presetCamera = regionalPreset.camera || activity?.map?.[regionalPreset.cameraKey];
    return presetCamera ? { ...fixedPhysicalCameraDecision(presetCamera, regionalPreset.source), cameraPhase, searchSpace: regionalPreset.id } : null;
  }
  if (camera?.mode === "override") {
    return fixedPhysicalCameraDecision(camera, camera.source || "authored-override");
  }
  if (cohortCamera?.mode === "override") {
    return fixedPhysicalCameraDecision(cohortCamera, cohortCamera.source || "authored-override");
  }
  if (!familyConfigs[family]) return null;
  const regionalPreset = regionalCameraPresets.find((preset) => (
    (regionId && preset.id === regionId)
    || preset.targetIds?.includes(targetId)
    || (authoredStateIds.length > 0 && authoredStateIds.every((stateId) => preset.stateIds?.includes(stateId)))
  ));
  if (regionalPreset) {
    const authoredActivity = activityMap?.get?.(regionalPreset.authoredActivityId)
      || activityMap?.[regionalPreset.authoredActivityId];
    const regionalCamera = regionalPreset.camera || authoredActivity?.map?.[regionalPreset.cameraKey];
    // A missing disconnected-geography source must never silently select lower 48.
    if (!regionalCamera) return null;
    return fixedPhysicalCameraDecision(regionalCamera, regionalPreset.source);
  }
  return fixedPhysicalCameraDecision(UNITED_STATES_GUIDED_LOWER48_PHYSICAL_CAMERA, "lower48-physical-default");
}

export const UNITED_STATES_PHYSICAL_FEATURE_ORCHESTRATION_INVENTORY = Object.freeze(
  buildUnitedStatesPhysicalFeatureOrchestrationInventory()
);

export const UNITED_STATES_PHYSICAL_FEATURE_DEFERRED_FAMILIES = Object.freeze([
  Object.freeze({ family: "coast", reason: "relationship-only-no-targeted-retrieval-path" })
]);
