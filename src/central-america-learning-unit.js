import { USER_FACING_PROGRESS_SKILLS } from "./progress-evidence-policy.js?v=20260829-physical-evidence-1";

export const CENTRAL_AMERICA_LEARNING_UNIT_ID = "central-america-countries";

const targets = Object.freeze([
  ["belize", "Belize"],
  ["guatemala", "Guatemala"],
  ["honduras", "Honduras"],
  ["el-salvador", "El Salvador"],
  ["nicaragua", "Nicaragua"],
  ["costa-rica", "Costa Rica"],
  ["panama", "Panama"]
].map(([id, label]) => Object.freeze({ id, label })));

function mapping(progressSkillId, conceptId, canonicalSkillId) {
  return {
    historyKey: `${progressSkillId}\u0000${conceptId}`,
    progressSkillId,
    conceptId,
    canonicalSkillId
  };
}

export const centralAmericaLearningUnit = Object.freeze({
  id: CENTRAL_AMERICA_LEARNING_UNIT_ID,
  title: "Central America Countries",
  description: "A compact path for locating and identifying seven Central American countries.",
  activityId: "central-america",
  journeyId: "north-america",
  journeyStepId: "central-america",
  entityType: "country",
  targets,
  evidenceMetrics: Object.freeze([
    Object.freeze({ id: "locationConceptCount", conceptPrefix: "country-location:", skillId: "locating" }),
    Object.freeze({ id: "identificationConceptCount", conceptPrefix: "country-naming:", skillId: "identifying" })
  ]),
  progressReport: Object.freeze({
    subtitle: "Your progress is based on country-location and country-identification answers recorded across Mappa Mundi.",
    howProgressWorks: Object.freeze([
      "Correct retrieval answers build progress. Mistakes identify countries that could use more practice.",
      "Location and identification remain separate skills even when they use the same country activity."
    ])
  }),
  progressReportCategories: Object.freeze([
    Object.freeze({
      id: "country-locations",
      label: "Country Locations",
      itemType: "country",
      getMappings: (item) => [mapping(
        USER_FACING_PROGRESS_SKILLS.COUNTRY_LOCATION,
        `country-location:${item.targetId}`,
        "locating"
      )]
    }),
    Object.freeze({
      id: "country-identification",
      label: "Country Identification",
      itemType: "country",
      getMappings: (item) => [mapping(
        USER_FACING_PROGRESS_SKILLS.COUNTRY_IDENTIFICATION,
        `country-naming:${item.targetId}`,
        "identifying"
      )]
    })
  ]),
  expedition: Object.freeze({
    id: CENTRAL_AMERICA_LEARNING_UNIT_ID,
    title: "Central America Countries",
    description: "Locate and identify seven countries using the same Journey, Guided Learning, evidence, and progress contracts as the U.S. reference path.",
    steps: Object.freeze([
      Object.freeze({
        id: "locate-countries",
        title: "Locate the seven countries",
        description: "Place each country name on the map in the existing North America Journey activity.",
        mechanicLabel: "Journey activity",
        launch: Object.freeze({ kind: "journey", journeyId: "north-america", stepId: "central-america" }),
        completionRules: Object.freeze([{ metric: "locationConceptCount", atLeast: 7 }]),
        progressRules: Object.freeze([{ metric: "locationConceptCount", atLeast: 1 }])
      }),
      Object.freeze({
        id: "identify-countries",
        title: "Identify the seven countries",
        description: "Use existing Guided Learning to name highlighted countries without seeing the answer first.",
        mechanicLabel: "Guided Learning",
        launch: Object.freeze({ kind: "memory-trail", journeyId: "north-america", stepId: "central-america" }),
        prerequisiteStepIds: Object.freeze(["locate-countries"]),
        completionRules: Object.freeze([{ metric: "identificationConceptCount", atLeast: 7 }]),
        progressRules: Object.freeze([{ metric: "identificationConceptCount", atLeast: 1 }])
      }),
      Object.freeze({
        id: "view-progress",
        title: "Review your evidence",
        description: "Open the shared canonical Progress Report for these two country skills.",
        mechanicLabel: "Progress Report · optional",
        launch: Object.freeze({ kind: "geography-progress-report" })
      })
    ])
  })
});
