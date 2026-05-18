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
    id: "north-america",
    title: "North America",
    description: "Explore North America by countries, regions, states, provinces, territories, and capitals.",
    status: "available",
    steps: [
      {
        id: "central-america",
        activityId: "central-america",
        title: "Central America",
        kind: "countries"
      },
      {
        id: "mexico-northwest",
        activityId: "mexico-northwest",
        title: "Northwest Mexico States",
        kind: "states"
      },
      {
        id: "mexico-northeast",
        activityId: "mexico-northeast",
        title: "Northeast Mexico States",
        kind: "states"
      },
      {
        id: "mexico-west-bajio",
        activityId: "mexico-west-bajio",
        title: "West / Bajio Mexico States",
        kind: "states"
      },
      {
        id: "mexico-central",
        activityId: "mexico-central",
        title: "Central Mexico States",
        kind: "states"
      },
      {
        id: "mexico-south-gulf-yucatan",
        activityId: "mexico-south-gulf-yucatan",
        title: "South, Gulf, and Yucatan Mexico States",
        kind: "states"
      },
      {
        id: "canada-atlantic-provinces",
        activityId: "canada-atlantic-provinces",
        title: "Atlantic Canada Provinces",
        kind: "provinces-territories"
      },
      {
        id: "canada-central-canada",
        activityId: "canada-central-canada",
        title: "Quebec and Ontario",
        kind: "provinces-territories"
      },
      {
        id: "canada-prairie-provinces",
        activityId: "canada-prairie-provinces",
        title: "Prairie Provinces",
        kind: "provinces-territories"
      },
      {
        id: "canada-western-northern",
        activityId: "canada-western-northern",
        title: "Western and Northern Canada",
        kind: "provinces-territories"
      }
      // TODO: Add a North America countries activity if one is added later.
    ]
  },
  {
    id: "south-america",
    title: "South America",
    description: "Learn the countries and major regions of South America.",
    status: "available",
    steps: [
      {
        id: "south-america-west",
        activityId: "south-america-west",
        title: "Western South America Countries",
        kind: "countries"
      },
      {
        id: "south-america-east",
        activityId: "south-america-east",
        title: "Eastern South America Countries",
        kind: "countries"
      }
    ]
  },
  {
    id: "the-caribbean",
    title: "The Caribbean",
    description: "Practice the islands and countries of the Caribbean.",
    status: "available",
    steps: [
      {
        id: "caribbean",
        activityId: "caribbean",
        title: "Caribbean",
        kind: "countries"
      }
    ]
  },
  {
    id: "the-americas",
    title: "The Americas",
    description: "Explore North America, Central America, the Caribbean, and South America.",
    status: "available",
    steps: [
      {
        id: "central-america",
        activityId: "central-america",
        title: "Central America",
        kind: "countries"
      },
      {
        id: "caribbean",
        activityId: "caribbean",
        title: "Caribbean",
        kind: "countries"
      },
      {
        id: "south-america-west",
        activityId: "south-america-west",
        title: "Western South America Countries",
        kind: "countries"
      },
      {
        id: "south-america-east",
        activityId: "south-america-east",
        title: "Eastern South America Countries",
        kind: "countries"
      }
    ]
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
    description: "Explore Asia by region, countries, and major cities.",
    status: "available",
    steps: [
      {
        id: "middle-east-countries",
        activityId: "middle-east-countries",
        title: "Middle East Countries",
        kind: "countries"
      },
      {
        id: "south-asia-countries",
        activityId: "south-asia-countries",
        title: "South Asia Countries",
        kind: "countries"
      },
      {
        id: "central-asia",
        activityId: "central-asia",
        title: "Central Asia Countries",
        kind: "countries"
      },
      {
        id: "caucasus-countries",
        activityId: "caucasus-countries",
        title: "Caucasus Countries",
        kind: "countries"
      },
      {
        id: "east-asia-countries",
        activityId: "east-asia-countries",
        title: "East Asia Countries",
        kind: "countries"
      },
      {
        id: "mainland-southeast-asia-countries",
        activityId: "mainland-southeast-asia-countries",
        title: "Mainland Southeast Asia Countries",
        kind: "countries"
      },
      {
        id: "maritime-southeast-asia-countries",
        activityId: "maritime-southeast-asia-countries",
        title: "Maritime Southeast Asia Countries",
        kind: "countries"
      },
      {
        id: "world-cities-east-south-asia",
        activityId: "world-cities-east-south-asia",
        title: "East and South Asia Cities",
        kind: "cities"
      }
    ]
  },
  {
    id: "oceania",
    title: "Oceania",
    description: "Learn Australia, New Zealand, Pacific islands, and nearby territories.",
    status: "available",
    steps: [
      {
        id: "oceania-pacific-countries",
        activityId: "oceania-pacific-countries",
        title: "Oceania and Pacific Countries",
        kind: "countries"
      }
    ]
  },
  {
    id: "world-tour",
    title: "World Tour",
    description: "Complete a grand review across the world.",
    status: "locked",
    lockedMessage: "Complete the regional journeys to unlock World Tour.",
    unlock: {
      requires: [
        "world-foundations",
        "north-america",
        "south-america",
        "europe",
        "asia",
        "oceania"
      ]
    },
    steps: [
      {
        id: "continents-oceans",
        activityId: "continents-oceans",
        title: "Continents and Oceans",
        kind: "world"
      },
      {
        id: "central-america",
        activityId: "central-america",
        title: "Central America",
        kind: "countries"
      },
      {
        id: "south-america-west",
        activityId: "south-america-west",
        title: "Western South America Countries",
        kind: "countries"
      },
      {
        id: "western-european-countries",
        activityId: "western-european-countries",
        title: "Western Europe",
        kind: "countries"
      },
      {
        id: "south-asia-countries",
        activityId: "south-asia-countries",
        title: "South Asia Countries",
        kind: "countries"
      },
      {
        id: "east-asia-countries",
        activityId: "east-asia-countries",
        title: "East Asia Countries",
        kind: "countries"
      },
      {
        id: "oceania-pacific-countries",
        activityId: "oceania-pacific-countries",
        title: "Oceania and Pacific Countries",
        kind: "countries"
      },
      {
        id: "caribbean",
        activityId: "caribbean",
        title: "Caribbean",
        kind: "countries"
      }
    ]
  }
];

export default journeyPresets;
