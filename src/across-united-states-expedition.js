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
      description: "Retrieve capitals, borders, coasts, and physical-feature relationships before seeing the atlas correction.",
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

export const acrossUnitedStatesNavigation = Object.freeze({
  tagline: "Learn the map. Use the map.",
  openAreasLabel: "All learning areas are open",
  objectives: Object.freeze([
    Object.freeze({
      id: "states-capitals",
      sequence: 1,
      title: "Learn States & Capitals",
      description: "Learn where the states are, what they're called, and their capitals.",
      primaryStepId: "learn-regions",
      primaryLabel: "Learn state locations & names",
      groups: Object.freeze([
        Object.freeze({
          title: "Learn",
          activities: Object.freeze([
            Object.freeze({
              id: "learn-state-locations",
              label: "Learn state locations & names",
              description: "Build the map region by region.",
              stepId: "learn-regions"
            }),
            Object.freeze({
              id: "learn-state-capitals",
              label: "Learn state capitals",
              description: "Connect every capital with its state.",
              stepId: "learn-capitals"
            })
          ])
        }),
        Object.freeze({
          title: "Build the map",
          activities: Object.freeze([
            Object.freeze({
              id: "build-regional-map",
              label: "Build a regional map",
              description: "Arrange state shapes to strengthen your mental map.",
              stepId: "rebuild-region"
            })
          ])
        }),
        Object.freeze({
          title: "Practice",
          activities: Object.freeze([
            Object.freeze({
              id: "practice-states-capitals",
              label: "Practice states & capitals",
              description: "Review a small set chosen from what you are learning.",
              stepId: "build-state-recall"
            })
          ])
        })
      ])
    }),
    Object.freeze({
      id: "physical-features",
      sequence: 2,
      title: "Learn Physical Features",
      description: "Learn the mountains, rivers, lakes, and coasts that shape the United States.",
      primaryStepId: "follow-landscape",
      primaryLabel: "Learn the physical landscape",
      groups: Object.freeze([
        Object.freeze({
          title: "Learn",
          activities: Object.freeze([
            Object.freeze({
              id: "learn-major-lakes",
              label: "Learn major lakes",
              description: "Locate the Great Lakes and other major U.S. lakes.",
              stepId: "follow-landscape",
              launch: Object.freeze({ kind: "journey", journeyId: "united-states", stepId: "us-physical-lakes" })
            }),
            Object.freeze({
              id: "learn-mountain-ranges",
              label: "Learn mountain ranges",
              description: "Follow the major mountain systems across the country.",
              stepId: "follow-landscape",
              launch: Object.freeze({ kind: "journey", journeyId: "united-states", stepId: "us-mountain-ranges" })
            }),
            Object.freeze({
              id: "learn-major-rivers",
              label: "Learn major rivers",
              description: "Trace the rivers that connect regions and landscapes.",
              stepId: "follow-landscape",
              launch: Object.freeze({ kind: "journey", journeyId: "united-states", stepId: "us-physical-rivers" })
            })
          ])
        })
      ])
    }),
    Object.freeze({
      id: "connections",
      sequence: 3,
      title: "Learn Connections",
      description: "See how states, capitals, borders, rivers, mountains, and other places relate to one another.",
      primaryStepId: "make-connections",
      primaryLabel: "Practice geographic connections",
      groups: Object.freeze([
        Object.freeze({
          title: "Practice relationships",
          activities: Object.freeze([
            Object.freeze({
              id: "practice-connections",
              label: "Practice geographic connections",
              description: "Connect states with capitals, borders, coasts, and physical features.",
              stepId: "make-connections"
            }),
            Object.freeze({
              id: "routes-spatial-reasoning",
              label: "Routes & spatial reasoning",
              description: "Reason about direction, order, adjacency, and routes.",
              stepId: "reason-without-map"
            })
          ])
        })
      ])
    }),
    Object.freeze({
      id: "explore",
      sequence: 4,
      title: "Explore the United States",
      description: "Use everything you've learned in combined geographic challenges.",
      primaryStepId: "lower-48-mission",
      primaryLabel: "Rebuild the Lower 48",
      groups: Object.freeze([
        Object.freeze({
          title: "Integrated challenges",
          activities: Object.freeze([
            Object.freeze({
              id: "rebuild-lower-48",
              label: "Rebuild the Lower 48",
              description: "Use your mental map in an advanced state-placement challenge.",
              stepId: "lower-48-mission"
            })
          ])
        })
      ])
    })
  ]),
  utilities: Object.freeze([
    Object.freeze({ id: "atlas", label: "Explore the U.S. Atlas", stepId: "open-atlas" }),
    Object.freeze({ id: "progress", label: "View Progress Report" })
  ])
});
