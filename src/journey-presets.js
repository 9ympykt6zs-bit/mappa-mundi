export const journeyPresets = [
  {
    id: "world-geography-core",
    title: "World Geography Core",
    description: "Build a strong foundation in continents, oceans, U.S. states, and key countries around the world.",
    status: "available",
    recommended: true,
    badge: "Recommended",
    note: "Start here if you're new to Mappa Mundi.",
    steps: [
      {
        id: "continents-oceans",
        activityId: "continents-oceans",
        title: "Continents and Oceans",
        kind: "world"
      },
      {
        id: "us-states-01",
        activityId: "us-states-01",
        title: "New England States",
        kind: "states"
      },
      {
        id: "us-states-02",
        activityId: "us-states-02",
        title: "Northeast / Mid-Atlantic States",
        kind: "states"
      },
      {
        id: "us-states-03",
        activityId: "us-states-03",
        title: "Atlantic South States",
        kind: "states"
      },
      {
        id: "us-states-04",
        activityId: "us-states-04",
        title: "Southeast / Gulf States",
        kind: "states"
      },
      {
        id: "us-states-05",
        activityId: "us-states-05",
        title: "Great Lakes / Upper South States",
        kind: "states"
      },
      {
        id: "us-states-06",
        activityId: "us-states-06",
        title: "Midwest / Mississippi Valley States",
        kind: "states"
      },
      {
        id: "us-states-07",
        activityId: "us-states-07",
        title: "Northern Plains / Rockies States",
        kind: "states"
      },
      {
        id: "us-states-08",
        activityId: "us-states-08",
        title: "Southern Plains / Southwest States",
        kind: "states"
      },
      {
        id: "us-states-09",
        activityId: "us-states-09",
        title: "Far West / Pacific States",
        kind: "states"
      },
      {
        id: "us-states-10",
        activityId: "us-states-10",
        title: "Northwest / Alaska States",
        kind: "states"
      },
      {
        id: "world-core-americas-countries",
        activityId: "world-core-americas-countries",
        title: "Core Countries: Americas",
        kind: "countries"
      },
      {
        id: "world-core-europe-countries",
        activityId: "world-core-europe-countries",
        title: "Core Countries: Europe",
        kind: "countries"
      },
      {
        id: "world-core-africa-countries",
        activityId: "world-core-africa-countries",
        title: "Core Countries: Africa",
        kind: "countries"
      },
      {
        id: "world-core-west-central-south-asia-countries",
        activityId: "world-core-west-central-south-asia-countries",
        title: "Core Countries: West, Central, and South Asia",
        kind: "countries"
      },
      {
        id: "world-core-east-southeast-asia-oceania-countries",
        activityId: "world-core-east-southeast-asia-oceania-countries",
        title: "Core Countries: East Asia, Southeast Asia, and Oceania",
        kind: "countries"
      }
    ]
  },
  {
    id: "world-foundations",
    title: "Continents and Oceans",
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
    description: "Learn U.S. states by region.",
    status: "available",
    steps: [
      {
        id: "us-states-01",
        activityId: "us-states-01",
        title: "New England States",
        kind: "states"
      },
      {
        id: "us-states-02",
        activityId: "us-states-02",
        title: "Northeast / Mid-Atlantic States",
        kind: "states"
      },
      {
        id: "us-states-03",
        activityId: "us-states-03",
        title: "Atlantic South States",
        kind: "states"
      },
      {
        id: "us-states-04",
        activityId: "us-states-04",
        title: "Southeast / Gulf States",
        kind: "states"
      },
      {
        id: "us-states-05",
        activityId: "us-states-05",
        title: "Great Lakes / Upper South States",
        kind: "states"
      },
      {
        id: "us-states-06",
        activityId: "us-states-06",
        title: "Midwest / Mississippi Valley States",
        kind: "states"
      },
      {
        id: "us-states-07",
        activityId: "us-states-07",
        title: "Northern Plains / Rockies States",
        kind: "states"
      },
      {
        id: "us-states-08",
        activityId: "us-states-08",
        title: "Southern Plains / Southwest States",
        kind: "states"
      },
      {
        id: "us-states-09",
        activityId: "us-states-09",
        title: "Far West / Pacific States",
        kind: "states"
      },
      {
        id: "us-states-10",
        activityId: "us-states-10",
        title: "Northwest / Alaska States",
        kind: "states"
      }
      // TODO: Add U.S. physical feature activity IDs when those activities are playable in the MapLibre app.
    ]
  },
  {
    id: "us-capitals",
    title: "U.S. Capitals",
    description: "Learn the state capitals by region.",
    status: "available",
    steps: [
      {
        id: "us-capitals-01",
        activityId: "us-capitals-01",
        title: "New England Capitals",
        kind: "capitals"
      },
      {
        id: "us-capitals-02",
        activityId: "us-capitals-02",
        title: "Northeast / Mid-Atlantic Capitals",
        kind: "capitals"
      },
      {
        id: "us-capitals-03",
        activityId: "us-capitals-03",
        title: "Atlantic South Capitals",
        kind: "capitals"
      },
      {
        id: "us-capitals-04",
        activityId: "us-capitals-04",
        title: "Southeast / Gulf Capitals",
        kind: "capitals"
      },
      {
        id: "us-capitals-05",
        activityId: "us-capitals-05",
        title: "Great Lakes / Upper South Capitals",
        kind: "capitals"
      },
      {
        id: "us-capitals-06",
        activityId: "us-capitals-06",
        title: "Midwest / Mississippi Valley Capitals",
        kind: "capitals"
      },
      {
        id: "us-capitals-07",
        activityId: "us-capitals-07",
        title: "Northern Plains / Rockies Capitals",
        kind: "capitals"
      },
      {
        id: "us-capitals-08",
        activityId: "us-capitals-08",
        title: "Southern Plains / Southwest Capitals",
        kind: "capitals"
      },
      {
        id: "us-capitals-09",
        activityId: "us-capitals-09",
        title: "Far West / Pacific Capitals",
        kind: "capitals"
      },
      {
        id: "us-capitals-10",
        activityId: "us-capitals-10",
        title: "Northwest / Alaska Capitals",
        kind: "capitals"
      }
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
      },
      {
        id: "brazil-north-political-divisions",
        activityId: "brazil-north-political-divisions",
        title: "Brazil: North",
        kind: "political-divisions"
      },
      {
        id: "brazil-northeast-political-divisions",
        activityId: "brazil-northeast-political-divisions",
        title: "Brazil: Northeast",
        kind: "political-divisions"
      },
      {
        id: "brazil-central-west-political-divisions",
        activityId: "brazil-central-west-political-divisions",
        title: "Brazil: Central-West",
        kind: "political-divisions"
      },
      {
        id: "brazil-southeast-political-divisions",
        activityId: "brazil-southeast-political-divisions",
        title: "Brazil: Southeast",
        kind: "political-divisions"
      },
      {
        id: "brazil-south-political-divisions",
        activityId: "brazil-south-political-divisions",
        title: "Brazil: South",
        kind: "political-divisions"
      }
    ]
  },
  {
    id: "brazil",
    title: "Brazil",
    description: "Learn Brazil's states and Federal District by region.",
    status: "available",
    steps: [
      {
        id: "brazil-north-political-divisions",
        activityId: "brazil-north-political-divisions",
        title: "Brazil: North",
        kind: "political-divisions"
      },
      {
        id: "brazil-northeast-political-divisions",
        activityId: "brazil-northeast-political-divisions",
        title: "Brazil: Northeast",
        kind: "political-divisions"
      },
      {
        id: "brazil-central-west-political-divisions",
        activityId: "brazil-central-west-political-divisions",
        title: "Brazil: Central-West",
        kind: "political-divisions"
      },
      {
        id: "brazil-southeast-political-divisions",
        activityId: "brazil-southeast-political-divisions",
        title: "Brazil: Southeast",
        kind: "political-divisions"
      },
      {
        id: "brazil-south-political-divisions",
        activityId: "brazil-south-political-divisions",
        title: "Brazil: South",
        kind: "political-divisions"
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
        id: "germany-north-east-political-divisions",
        activityId: "germany-north-east-political-divisions",
        title: "Germany: North & East",
        kind: "political-divisions"
      },
      {
        id: "germany-south-west-political-divisions",
        activityId: "germany-south-west-political-divisions",
        title: "Germany: South & West",
        kind: "political-divisions"
      },
      {
        id: "france-northern-eastern-regions-political-divisions",
        activityId: "france-northern-eastern-regions-political-divisions",
        title: "France: Northern & Eastern Regions",
        kind: "political-divisions"
      },
      {
        id: "france-southern-regions-political-divisions",
        activityId: "france-southern-regions-political-divisions",
        title: "France: Southern Regions",
        kind: "political-divisions"
      },
      {
        id: "spain-northern-central-political-divisions",
        activityId: "spain-northern-central-political-divisions",
        title: "Spain: Northern & Central",
        kind: "political-divisions"
      },
      {
        id: "spain-southern-eastern-political-divisions",
        activityId: "spain-southern-eastern-political-divisions",
        title: "Spain: Southern & Eastern",
        kind: "political-divisions"
      },
      {
        id: "italy-northern-regions-political-divisions",
        activityId: "italy-northern-regions-political-divisions",
        title: "Italy: Northern Regions",
        kind: "political-divisions"
      },
      {
        id: "italy-central-southern-regions-political-divisions",
        activityId: "italy-central-southern-regions-political-divisions",
        title: "Italy: Central & Southern Regions",
        kind: "political-divisions"
      },
      {
        id: "italy-islands-political-divisions",
        activityId: "italy-islands-political-divisions",
        title: "Italy: Islands",
        kind: "political-divisions"
      },
      {
        id: "united-kingdom-countries-political-divisions",
        activityId: "united-kingdom-countries-political-divisions",
        title: "United Kingdom: Countries",
        kind: "political-divisions"
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
    id: "germany",
    title: "Germany",
    description: "Learn Germany's states by region.",
    status: "available",
    steps: [
      {
        id: "germany-north-east-political-divisions",
        activityId: "germany-north-east-political-divisions",
        title: "Germany: North & East",
        kind: "political-divisions"
      },
      {
        id: "germany-south-west-political-divisions",
        activityId: "germany-south-west-political-divisions",
        title: "Germany: South & West",
        kind: "political-divisions"
      }
    ]
  },
  {
    id: "france",
    title: "France",
    description: "Learn France's regions.",
    status: "available",
    steps: [
      {
        id: "france-northern-eastern-regions-political-divisions",
        activityId: "france-northern-eastern-regions-political-divisions",
        title: "France: Northern & Eastern Regions",
        kind: "political-divisions"
      },
      {
        id: "france-southern-regions-political-divisions",
        activityId: "france-southern-regions-political-divisions",
        title: "France: Southern Regions",
        kind: "political-divisions"
      }
      // TODO: Add France overseas regions as a special activity after overseas camera/fit handling is designed.
    ]
  },
  {
    id: "spain",
    title: "Spain",
    description: "Learn Spain's autonomous communities and cities.",
    status: "available",
    steps: [
      {
        id: "spain-northern-central-political-divisions",
        activityId: "spain-northern-central-political-divisions",
        title: "Spain: Northern & Central",
        kind: "political-divisions"
      },
      {
        id: "spain-southern-eastern-political-divisions",
        activityId: "spain-southern-eastern-political-divisions",
        title: "Spain: Southern & Eastern",
        kind: "political-divisions"
      }
    ]
  },
  {
    id: "italy",
    title: "Italy",
    description: "Learn Italy's regions.",
    status: "available",
    steps: [
      {
        id: "italy-northern-regions-political-divisions",
        activityId: "italy-northern-regions-political-divisions",
        title: "Italy: Northern Regions",
        kind: "political-divisions"
      },
      {
        id: "italy-central-southern-regions-political-divisions",
        activityId: "italy-central-southern-regions-political-divisions",
        title: "Italy: Central & Southern Regions",
        kind: "political-divisions"
      },
      {
        id: "italy-islands-political-divisions",
        activityId: "italy-islands-political-divisions",
        title: "Italy: Islands",
        kind: "political-divisions"
      }
    ]
  },
  {
    id: "united-kingdom",
    title: "United Kingdom",
    description: "Learn the countries of the United Kingdom.",
    status: "available",
    steps: [
      {
        id: "united-kingdom-countries-political-divisions",
        activityId: "united-kingdom-countries-political-divisions",
        title: "United Kingdom: Countries",
        kind: "political-divisions"
      }
    ]
  },
  {
    id: "russia",
    title: "Russia",
    description: "Learn Russia's federal subjects by region.",
    status: "available",
    steps: [
      {
        id: "russia-central-federal-subjects",
        activityId: "russia-central-federal-subjects",
        title: "Russia: Central",
        kind: "political-divisions"
      },
      {
        id: "russia-more-central-federal-subjects",
        activityId: "russia-more-central-federal-subjects",
        title: "Russia: More Central",
        kind: "political-divisions"
      },
      {
        id: "russia-northwest-federal-subjects",
        activityId: "russia-northwest-federal-subjects",
        title: "Russia: Northwest",
        kind: "political-divisions"
      },
      {
        id: "russia-more-northwest-federal-subjects",
        activityId: "russia-more-northwest-federal-subjects",
        title: "Russia: More Northwest",
        kind: "political-divisions"
      },
      {
        id: "russia-southern-federal-subjects",
        activityId: "russia-southern-federal-subjects",
        title: "Russia: Southern",
        kind: "political-divisions"
      },
      {
        id: "russia-north-caucasus-federal-subjects",
        activityId: "russia-north-caucasus-federal-subjects",
        title: "Russia: North Caucasus",
        kind: "political-divisions"
      },
      {
        id: "russia-volga-federal-subjects",
        activityId: "russia-volga-federal-subjects",
        title: "Russia: Volga",
        kind: "political-divisions"
      },
      {
        id: "russia-more-volga-federal-subjects",
        activityId: "russia-more-volga-federal-subjects",
        title: "Russia: More Volga",
        kind: "political-divisions"
      },
      {
        id: "russia-ural-federal-subjects",
        activityId: "russia-ural-federal-subjects",
        title: "Russia: Ural",
        kind: "political-divisions"
      },
      {
        id: "russia-siberia-federal-subjects",
        activityId: "russia-siberia-federal-subjects",
        title: "Russia: Siberia",
        kind: "political-divisions"
      },
      {
        id: "russia-far-east-federal-subjects",
        activityId: "russia-far-east-federal-subjects",
        title: "Russia: Far East",
        kind: "political-divisions"
      },
      {
        id: "russia-more-far-east-federal-subjects",
        activityId: "russia-more-far-east-federal-subjects",
        title: "Russia: More Far East",
        kind: "political-divisions"
      }
    ]
  },
  {
    id: "africa",
    title: "Africa",
    description: "Practice African countries in focused regional groups.",
    status: "available",
    steps: [
      {
        id: "north-africa-countries",
        activityId: "north-africa-countries",
        title: "North Africa",
        kind: "countries"
      },
      {
        id: "west-africa-countries",
        activityId: "west-africa-countries",
        title: "West Africa",
        kind: "countries"
      },
      {
        id: "more-west-africa-countries",
        activityId: "more-west-africa-countries",
        title: "More West Africa",
        kind: "countries"
      },
      {
        id: "central-africa-countries",
        activityId: "central-africa-countries",
        title: "Central Africa",
        kind: "countries"
      },
      {
        id: "east-africa-countries",
        activityId: "east-africa-countries",
        title: "East Africa",
        kind: "countries"
      },
      {
        id: "southern-africa-countries",
        activityId: "southern-africa-countries",
        title: "Southern Africa",
        kind: "countries"
      },
      {
        id: "more-southern-africa-countries",
        activityId: "more-southern-africa-countries",
        title: "More Southern Africa",
        kind: "countries"
      }
      // TODO: Add Cabo Verde, Sao Tome and Principe, Comoros, Mauritius, and Seychelles if the world country source supports them later.
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
        id: "india-north-political-divisions",
        activityId: "india-north-political-divisions",
        title: "India: North",
        kind: "political-divisions"
      },
      {
        id: "india-west-central-political-divisions",
        activityId: "india-west-central-political-divisions",
        title: "India: West & Central",
        kind: "political-divisions"
      },
      {
        id: "india-east-political-divisions",
        activityId: "india-east-political-divisions",
        title: "India: East",
        kind: "political-divisions"
      },
      {
        id: "india-northeast-political-divisions",
        activityId: "india-northeast-political-divisions",
        title: "India: Northeast",
        kind: "political-divisions"
      },
      {
        id: "india-south-political-divisions",
        activityId: "india-south-political-divisions",
        title: "India: South",
        kind: "political-divisions"
      },
      {
        id: "india-islands-political-divisions",
        activityId: "india-islands-political-divisions",
        title: "India: Islands",
        kind: "political-divisions"
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
        id: "japan-hokkaido-tohoku-political-divisions",
        activityId: "japan-hokkaido-tohoku-political-divisions",
        title: "Japan: Hokkaido & Tohoku",
        kind: "political-divisions"
      },
      {
        id: "japan-kanto-political-divisions",
        activityId: "japan-kanto-political-divisions",
        title: "Japan: Kanto",
        kind: "political-divisions"
      },
      {
        id: "japan-chubu-political-divisions",
        activityId: "japan-chubu-political-divisions",
        title: "Japan: Chubu",
        kind: "political-divisions"
      },
      {
        id: "japan-kansai-political-divisions",
        activityId: "japan-kansai-political-divisions",
        title: "Japan: Kansai",
        kind: "political-divisions"
      },
      {
        id: "japan-chugoku-shikoku-political-divisions",
        activityId: "japan-chugoku-shikoku-political-divisions",
        title: "Japan: Chugoku & Shikoku",
        kind: "political-divisions"
      },
      {
        id: "japan-kyushu-okinawa-political-divisions",
        activityId: "japan-kyushu-okinawa-political-divisions",
        title: "Japan: Kyushu & Okinawa",
        kind: "political-divisions"
      },
      {
        id: "china-north-northeast-political-divisions",
        activityId: "china-north-northeast-political-divisions",
        title: "China: North & Northeast",
        kind: "political-divisions"
      },
      {
        id: "china-east-political-divisions",
        activityId: "china-east-political-divisions",
        title: "China: East",
        kind: "political-divisions"
      },
      {
        id: "china-south-central-political-divisions",
        activityId: "china-south-central-political-divisions",
        title: "China: South Central",
        kind: "political-divisions"
      },
      {
        id: "china-southwest-political-divisions",
        activityId: "china-southwest-political-divisions",
        title: "China: Southwest",
        kind: "political-divisions"
      },
      {
        id: "china-northwest-political-divisions",
        activityId: "china-northwest-political-divisions",
        title: "China: Northwest",
        kind: "political-divisions"
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
    id: "india",
    title: "India",
    description: "Learn India's states and union territories by region.",
    status: "available",
    steps: [
      {
        id: "india-north-political-divisions",
        activityId: "india-north-political-divisions",
        title: "India: North",
        kind: "political-divisions"
      },
      {
        id: "india-west-central-political-divisions",
        activityId: "india-west-central-political-divisions",
        title: "India: West & Central",
        kind: "political-divisions"
      },
      {
        id: "india-east-political-divisions",
        activityId: "india-east-political-divisions",
        title: "India: East",
        kind: "political-divisions"
      },
      {
        id: "india-northeast-political-divisions",
        activityId: "india-northeast-political-divisions",
        title: "India: Northeast",
        kind: "political-divisions"
      },
      {
        id: "india-south-political-divisions",
        activityId: "india-south-political-divisions",
        title: "India: South",
        kind: "political-divisions"
      },
      {
        id: "india-islands-political-divisions",
        activityId: "india-islands-political-divisions",
        title: "India: Islands",
        kind: "political-divisions"
      }
    ]
  },
  {
    id: "japan",
    title: "Japan",
    description: "Learn Japan's prefectures by region.",
    status: "available",
    steps: [
      {
        id: "japan-hokkaido-tohoku-political-divisions",
        activityId: "japan-hokkaido-tohoku-political-divisions",
        title: "Japan: Hokkaido & Tohoku",
        kind: "political-divisions"
      },
      {
        id: "japan-kanto-political-divisions",
        activityId: "japan-kanto-political-divisions",
        title: "Japan: Kanto",
        kind: "political-divisions"
      },
      {
        id: "japan-chubu-political-divisions",
        activityId: "japan-chubu-political-divisions",
        title: "Japan: Chubu",
        kind: "political-divisions"
      },
      {
        id: "japan-kansai-political-divisions",
        activityId: "japan-kansai-political-divisions",
        title: "Japan: Kansai",
        kind: "political-divisions"
      },
      {
        id: "japan-chugoku-shikoku-political-divisions",
        activityId: "japan-chugoku-shikoku-political-divisions",
        title: "Japan: Chugoku & Shikoku",
        kind: "political-divisions"
      },
      {
        id: "japan-kyushu-okinawa-political-divisions",
        activityId: "japan-kyushu-okinawa-political-divisions",
        title: "Japan: Kyushu & Okinawa",
        kind: "political-divisions"
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
      },
      {
        id: "australia-states-territories",
        activityId: "australia-states-territories",
        title: "Australia States & Territories",
        kind: "political-divisions"
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
        id: "australia-states-territories",
        activityId: "australia-states-territories",
        title: "Australia States & Territories",
        kind: "political-divisions"
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
