export const journeyPresets = [
  {
    id: "world-foundations",
    title: "World Foundations",
    description: "Start with continents, oceans, and the big picture of the world.",
    status: "available",
    steps: [
      {
        id: "continents-oceans",
        activityId: "continents-oceans",
        title: "Continents and Oceans",
        kind: "world"
      }
    ]
  },
  {
    id: "united-states",
    title: "United States",
    description: "Learn U.S. states, capitals, regions, and major physical features.",
    status: "available",
    steps: [
      {
        id: "us-states-capitals-01",
        activityId: "us-states-capitals-01",
        title: "New England States & Capitals",
        kind: "states-capitals"
      },
      {
        id: "us-states-capitals-02",
        activityId: "us-states-capitals-02",
        title: "Northeast / Mid-Atlantic States & Capitals",
        kind: "states-capitals"
      },
      {
        id: "us-states-capitals-03",
        activityId: "us-states-capitals-03",
        title: "Atlantic South States & Capitals",
        kind: "states-capitals"
      },
      {
        id: "us-states-capitals-04",
        activityId: "us-states-capitals-04",
        title: "Southeast / Gulf States & Capitals",
        kind: "states-capitals"
      },
      {
        id: "us-states-capitals-05",
        activityId: "us-states-capitals-05",
        title: "Great Lakes / Upper South States & Capitals",
        kind: "states-capitals"
      },
      {
        id: "us-states-capitals-06",
        activityId: "us-states-capitals-06",
        title: "Midwest / Mississippi Valley States & Capitals",
        kind: "states-capitals"
      },
      {
        id: "us-states-capitals-07",
        activityId: "us-states-capitals-07",
        title: "Northern Plains / Rockies States & Capitals",
        kind: "states-capitals"
      },
      {
        id: "us-states-capitals-08",
        activityId: "us-states-capitals-08",
        title: "Southern Plains / Southwest States & Capitals",
        kind: "states-capitals"
      },
      {
        id: "us-states-capitals-09",
        activityId: "us-states-capitals-09",
        title: "Far West / Pacific States & Capitals",
        kind: "states-capitals"
      },
      {
        id: "us-states-capitals-10",
        activityId: "us-states-capitals-10",
        title: "Northwest / Alaska States & Capitals",
        kind: "states-capitals"
      }
      // TODO: Add U.S. physical feature activity IDs when those activities are playable in the MapLibre app.
    ]
  },
  {
    id: "the-americas",
    title: "The Americas",
    description: "Explore North America, Central America, the Caribbean, and South America.",
    status: "coming-soon",
    steps: []
    // TODO: Add curated Americas steps after the journey sequence is designed.
  },
  {
    id: "europe",
    title: "Europe",
    description: "Practice European countries, regions, and cities.",
    status: "available",
    steps: [
      {
        id: "western-european-countries",
        activityId: "western-european-countries",
        title: "Western Europe",
        kind: "countries"
      },
      {
        id: "nordic-countries",
        activityId: "nordic-countries",
        title: "Nordic Countries",
        kind: "countries"
      },
      {
        id: "baltic-countries",
        activityId: "baltic-countries",
        title: "Baltic Countries",
        kind: "countries"
      },
      {
        id: "eastern-europe-countries",
        activityId: "eastern-europe-countries",
        title: "Eastern Europe Countries",
        kind: "countries"
      },
      {
        id: "balkans",
        activityId: "balkans",
        title: "Western Balkans Countries",
        kind: "countries"
      },
      {
        id: "central-european-countries",
        activityId: "central-european-countries",
        title: "Central European Countries",
        kind: "countries"
      },
      {
        id: "more-central-european-countries",
        activityId: "more-central-european-countries",
        title: "More Central European Countries",
        kind: "countries"
      },
      {
        id: "european-cities",
        activityId: "european-cities",
        title: "European Cities",
        kind: "cities"
      },
      {
        id: "world-cities-europe-eastern-mediterranean",
        activityId: "world-cities-europe-eastern-mediterranean",
        title: "Europe & Eastern Mediterranean Cities",
        kind: "cities"
      }
    ]
  },
  {
    id: "asia",
    title: "Asia",
    description: "Explore Asia by region, countries, cities, and physical features.",
    status: "coming-soon",
    steps: []
    // TODO: Add curated Asia steps after the journey sequence is designed.
  }
];

export default journeyPresets;
