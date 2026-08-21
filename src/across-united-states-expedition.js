export const ACROSS_UNITED_STATES_EXPEDITION_ID = "across-united-states";

export const acrossUnitedStatesExpedition = Object.freeze({
  id: ACROSS_UNITED_STATES_EXPEDITION_ID,
  title: "Across the United States",
  description: "Explore the atlas, learn states and capitals, connect the landscape, and rebuild the map.",
  steps: Object.freeze([
    {
      id: "open-atlas",
      title: "Open your U.S. Atlas",
      description: "Explore states, regions, neighbors, capitals, and physical features before you test your memory.",
      mechanicLabel: "Atlas exploration · optional",
      launch: { kind: "united-states-atlas" },
      startLabel: "Explore"
    },
    {
      id: "learn-regions",
      title: "Meet the states by region",
      description: "Use the existing United States Journey to learn the shape and location of states in manageable regional groups.",
      mechanicLabel: "Journey",
      launch: { kind: "journey", journeyId: "united-states" },
      completionRules: [{ metric: "usJourneyStateStepsCompleted", atLeast: 2 }],
      progressRules: [{ metric: "usJourneyStateStepsCompleted", atLeast: 1 }]
    },
    {
      id: "build-state-recall",
      title: "Build state recall",
      description: "Let U.S. Memory Trail introduce a small active set and bring weak or due states back for retrieval.",
      mechanicLabel: "U.S. Memory Trail",
      launch: { kind: "united-states-memory-trail" },
      prerequisiteStepIds: ["learn-regions"],
      completionRules: [{ metric: "usTrailIntroducedCount", atLeast: 8 }],
      progressRules: [{ metric: "usTrailHasStarted", atLeast: 1 }]
    },
    {
      id: "learn-capitals",
      title: "Add state capitals",
      description: "Keep state and capital learning connected while preserving the capital Journey's own teaching and quiz mechanics.",
      mechanicLabel: "Journey",
      launch: { kind: "journey", journeyId: "us-capitals" },
      prerequisiteStepIds: ["build-state-recall"],
      completionRules: [{ metric: "usCapitalJourneyStepsCompleted", atLeast: 2 }],
      progressRules: [{ metric: "usCapitalJourneyStepsCompleted", atLeast: 1 }]
    },
    {
      id: "follow-landscape",
      title: "Follow rivers, lakes, and mountains",
      description: "Return to the United States Journey for the physical features that tie regions together.",
      mechanicLabel: "Journey",
      launch: { kind: "journey", journeyId: "united-states" },
      prerequisiteStepIds: ["learn-capitals"],
      completionRules: [{ metric: "usJourneyPhysicalStepsCompleted", atLeast: 1 }],
      progressRules: [{ metric: "usJourneyPhysicalStepsCompleted", atLeast: 1 }]
    },
    {
      id: "make-connections",
      title: "Make U.S. connections",
      description: "Retrieve capitals, borders, coasts, regions, and physical-feature relationships before seeing the atlas correction.",
      mechanicLabel: "U.S. Connections",
      launch: { kind: "united-states-connections" },
      prerequisiteStepIds: ["follow-landscape"],
      completionRules: [{ metric: "usConnectionsAttempts", atLeast: 3 }],
      progressRules: [{ metric: "usConnectionsAttempts", atLeast: 1 }]
    },
    {
      id: "reason-without-map",
      title: "Reason with your mental map",
      description: "Use directional, ordering, adjacency, and route questions without geographic hints before feedback appears.",
      mechanicLabel: "Mental Map",
      launch: { kind: "mental-map" },
      prerequisiteStepIds: ["make-connections"],
      completionRules: [{ metric: "mentalMapAttempts", atLeast: 2 }],
      progressRules: [{ metric: "mentalMapAttempts", atLeast: 1 }]
    },
    {
      id: "rebuild-region",
      title: "Rebuild a region",
      description: "Arrange state pieces from memory, then compare your structure with the real map.",
      mechanicLabel: "Map Reconstruction · checkpoint",
      launch: { kind: "map-reconstruction" },
      prerequisiteStepIds: ["reason-without-map"],
      completionRules: [{ metric: "regionalReconstructionAttempts", atLeast: 1 }],
      progressRules: [{ metric: "regionalReconstructionAttempts", atLeast: 1 }]
    },
    {
      id: "lower-48-mission",
      title: "Final mission: rebuild the Lower 48",
      description: "Use the existing advanced capstone to assemble the contiguous United States and test the structure you have built.",
      mechanicLabel: "Map Reconstruction · final mission",
      launch: { kind: "map-reconstruction-capstone", capstoneId: "rebuild-lower-48" },
      prerequisiteStepIds: ["rebuild-region"],
      completionRules: [{ metric: "lower48ReconstructionAttempts", atLeast: 1 }],
      progressRules: [{ metric: "lower48ReconstructionAttempts", atLeast: 1 }]
    }
  ])
});
