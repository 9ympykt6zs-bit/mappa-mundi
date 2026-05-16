import { normalizeActivity } from "./map-engines/activity-normalizer.js";
import { ActivitySession, studyModes } from "./maplibre/activity-session.js?v=progress-state";
import { difficultyModes, MapLibreActivityRunner } from "./maplibre/maplibre-activity-runner.js?v=north-america-admin1";

const activityDataPaths = [
  "assets/maps/data/continents-oceans.json",
  "assets/maps/data/western-european-countries.json",
  "assets/maps/data/european-cities.json",
  "assets/maps/data/former-soviet-republics.json",
  "assets/maps/data/world-cities-east-south-asia.json",
  "assets/maps/data/world-cities-europe-eastern-mediterranean.json",
  "assets/maps/data/world-cities-middle-east-north-africa.json",
  "assets/maps/data/world-cities-mesoamerica.json",
  "assets/maps/data/northern-european-countries.json",
  "assets/maps/data/baltic-europe-countries.json",
  "assets/maps/data/balkans-countries.json",
  "assets/maps/data/central-european-countries.json",
  "assets/maps/data/more-central-european-countries.json",
  "assets/maps/data/southern-africa-countries.json",
  "assets/maps/data/african-countries.json",
  "assets/maps/data/the-levant.json",
  "assets/maps/data/central-america.json",
  "assets/maps/data/central-asia.json",
  "assets/maps/data/south-america-west.json",
  "assets/maps/data/south-america-east.json",
  "assets/maps/data/caribbean.json",
  "assets/maps/data/southwest-asia.json",
  "assets/maps/data/europe-and-asia-countries.json",
  "assets/maps/data/remaining-modern-countries.json",
  "assets/maps/data/southeastern-asia.json",
  "assets/maps/data/south-central-asia.json",
  "assets/maps/data/oceania.json",
  "assets/maps/data/mexico-states.json",
  "assets/maps/data/canada-provinces-territories.json",
  "assets/maps/data/us-states-capitals-01.json",
  "assets/maps/data/us-states-capitals-02.json",
  "assets/maps/data/us-states-capitals-03.json",
  "assets/maps/data/us-states-capitals-04.json",
  "assets/maps/data/us-states-capitals-05.json",
  "assets/maps/data/us-states-capitals-06.json",
  "assets/maps/data/us-states-capitals-07.json",
  "assets/maps/data/us-states-capitals-08.json",
  "assets/maps/data/us-states-capitals-09.json",
  "assets/maps/data/us-states-capitals-10.json"
];
const worldCountriesPath = "assets/maps/data/maplibre-world-countries.geojson";
// Natural Earth map-unit supplements fill territory paths that are absent from
// the app's simplified admin-0 country layer.
const worldCountrySupplements = [
  "assets/maps/world/french-guiana-map-unit.geojson",
  "assets/maps/world/guam-map-unit.geojson"
];
const usStatesAtlasPath = "assets/maps/data/maplibre-us-states-atlas.geojson";
const stateGeoJsonPath = "assets/maps/data/maplibre-us-states-atlas.geojson";
const northAmericaAdmin1Path = "assets/maps/data/maplibre-north-america-admin1.geojson";
const defaultActivityId = "continents-oceans";
const defaultMenuRoot = "world";
const defaultMapSet = "world-europe";
const completedActivitiesStorageKey = "geography-memory-completed-activities";
const activityProgressStorageKey = "geography-memory-activity-progress";
const difficultyStorageKey = "geography-memory-difficulty-mode";
const mapSetLabels = {
  us: "United States",
  "world-europe": "World / Europe"
};
const US_STATE_CAPITAL_MENU_ITEMS = [
  { label: "New England States & Capitals", activityId: "us-states-capitals-01" },
  { label: "Northeast / Mid-Atlantic States & Capitals", activityId: "us-states-capitals-02" },
  { label: "Atlantic South States & Capitals", activityId: "us-states-capitals-03" },
  { label: "Southeast / Gulf States & Capitals", activityId: "us-states-capitals-04" },
  { label: "Great Lakes / Upper South States & Capitals", activityId: "us-states-capitals-05" },
  { label: "Midwest / Mississippi Valley States & Capitals", activityId: "us-states-capitals-06" },
  { label: "Northern Plains / Rockies States & Capitals", activityId: "us-states-capitals-07" },
  { label: "Southern Plains / Southwest States & Capitals", activityId: "us-states-capitals-08" },
  { label: "Far West / Pacific States & Capitals", activityId: "us-states-capitals-09" },
  { label: "Northwest / Alaska States & Capitals", activityId: "us-states-capitals-10" }
];
const US_PHYSICAL_FEATURE_MENU_ITEMS = [
  "Northern Appalachian Mountains",
  "Southern Appalachian Mountains",
  "Western Mountains",
  "Northwest Mountains",
  "Great Lakes",
  "Bays",
  "Rivers East",
  "Rivers West",
  "Trails",
  "Canals",
  "Native American Regions",
  "Deserts",
  "Prominent Features",
  "More Prominent Features"
].map((label) => ({ label, disabled: true, badge: "Coming soon" }));
const ACTIVITY_MENU = [
  {
    id: "world",
    label: "World",
    overviewView: { center: [-18, 18], zoom: 1.25 },
    children: [
      {
        label: "World",
        children: [
          { label: "Continents & Oceans", activityId: "continents-oceans" }
        ]
      },
      {
        label: "Political / Cultural Regions",
        children: [
          { label: "Former Soviet Republics", activityId: "former-soviet-republics" }
        ]
      }
    ]
  },
  {
    id: "africa",
    label: "Africa",
    overviewView: { center: [20, 0], zoom: 2.1 },
    children: [
      {
        label: "Africa",
        children: [
          { label: "Countries", title: "Selected African Countries", activityId: "african-countries" },
          { label: "Southern Africa Countries", activityId: "southern-africa-countries" },
          { label: "Cities", activityId: "world-cities-middle-east-north-africa" }
        ]
      }
    ]
  },
  {
    id: "europe",
    label: "Europe",
    overviewView: { center: [14, 52], zoom: 2.35 },
    children: [
      {
        label: "Scandinavia",
        children: [
          { label: "Countries", title: "Northern Europe", activityId: "northern-european-countries" }
        ]
      },
      {
        label: "Western Europe",
        children: [
          { label: "Countries", activityId: "western-european-countries" },
          { label: "Central European Countries", activityId: "central-european-countries" },
          { label: "More Central European Countries", activityId: "more-central-european-countries" }
        ]
      },
      {
        label: "Baltic Europe",
        children: [
          { label: "Countries", activityId: "baltic-europe" }
        ]
      },
      {
        label: "Balkans",
        children: [
          { label: "Countries", activityId: "balkans" }
        ]
      },
      {
        label: "Europe-wide",
        children: [
          { label: "Cities", activityId: "european-cities" },
          { label: "Europe & Eastern Mediterranean Cities", activityId: "world-cities-europe-eastern-mediterranean" }
        ]
      }
    ]
  },
  {
    id: "asia",
    label: "Asia",
    overviewView: { center: [88, 31], zoom: 1.55 },
    children: [
      {
        label: "Asia",
        children: [
          { label: "Countries", title: "Selected Asian Countries", activityId: "southwest-asia" },
          { label: "The Levant Countries", activityId: "the-levant" },
          { label: "Central Asia Countries", activityId: "central-asia" },
          { label: "Southeastern Asia Countries", activityId: "southeastern-asia" },
          { label: "South Central Asia Countries", activityId: "south-central-asia" },
          { label: "Cities", activityId: "world-cities-east-south-asia" }
        ]
      }
    ]
  },
  {
    id: "north-america",
    label: "North America",
    overviewView: { center: [-98, 37], zoom: 1.85 },
    children: [
      {
        label: "United States",
        children: [
          {
            label: "States & Capitals",
            children: US_STATE_CAPITAL_MENU_ITEMS
          },
          {
            label: "US Physical Features",
            children: US_PHYSICAL_FEATURE_MENU_ITEMS
          }
        ]
      },
      {
        label: "Mexico",
        children: [
          { label: "States", activityId: "mexico-states" }
        ]
      },
      {
        label: "Canada",
        children: [
          { label: "Provinces and Territories", activityId: "canada-provinces-territories" }
        ]
      },
      {
        label: "Regional Activities",
        children: [
          { label: "Countries", activityId: "central-america" },
          { label: "Caribbean Countries", activityId: "caribbean" },
          { label: "Cities", activityId: "world-cities-mesoamerica" }
        ]
      }
    ]
  },
  {
    id: "south-america",
    label: "South America",
    overviewView: { center: [-60, -18], zoom: 2.05 },
    children: [
      {
        label: "South America",
        children: [
          { label: "Countries", activityId: "south-america-west" },
          { label: "Eastern South America Countries", activityId: "south-america-east" },
          { label: "Cities", disabled: true, badge: "Coming soon" }
        ]
      }
    ]
  },
  {
    id: "oceania",
    label: "Australia / Oceania",
    overviewView: { center: [141, -18], zoom: 2.1 },
    children: [
      {
        label: "Australia / Oceania",
        children: [
          { label: "Countries", activityId: "oceania" },
          { label: "Cities", disabled: true, badge: "Coming soon" }
        ]
      }
    ]
  }
];
const US_STATE_CAPITAL_NAV_NODES = Object.fromEntries(
  US_STATE_CAPITAL_MENU_ITEMS.map((item) => [
    `nav-${item.activityId}`,
    {
      id: `nav-${item.activityId}`,
      label: item.label,
      parent: "us-states-capitals",
      activityId: item.activityId,
      activityLabel: item.label
    }
  ])
);
const US_PHYSICAL_FEATURE_NAV_NODES = Object.fromEntries(
  US_PHYSICAL_FEATURE_MENU_ITEMS.map((item, index) => [
    `us-physical-${index + 1}`,
    {
      id: `us-physical-${index + 1}`,
      label: item.label,
      parent: "us-physical-features",
      disabled: true,
      badge: item.badge || "Coming soon"
    }
  ])
);
const GEOGRAPHY_NAV_NODES = {
  world: {
    id: "world",
    label: "World",
    activityId: "continents-oceans",
    menuRoot: "world",
    view: { center: [-18, 18], zoom: 1.25 },
    childTargetIds: {
      "north-america": "north-america",
      "south-america": "south-america",
      europe: "europe",
      africa: "africa",
      asia: "asia",
      australia: "oceania"
    },
    children: ["north-america", "south-america", "europe", "africa", "asia", "oceania"]
  },
  africa: {
    id: "africa",
    label: "Africa",
    parent: "world",
    menuRoot: "africa",
    view: { center: [20, 0], zoom: 2.1 },
    children: ["africa-countries", "southern-africa", "africa-cities"]
  },
  "africa-countries": {
    id: "africa-countries",
    label: "Selected African Countries",
    parent: "africa",
    activityId: "african-countries",
    activityLabel: "Countries"
  },
  "southern-africa": {
    id: "southern-africa",
    label: "Southern Africa",
    parent: "africa",
    activityId: "southern-africa-countries",
    activityLabel: "Countries"
  },
  "africa-cities": {
    id: "africa-cities",
    label: "Cities",
    parent: "africa",
    activityId: "world-cities-middle-east-north-africa",
    activityLabel: "Cities"
  },
  europe: {
    id: "europe",
    label: "Europe",
    parent: "world",
    menuRoot: "europe",
    view: { center: [14, 52], zoom: 2.35 },
    children: ["europe-scandinavia", "europe-western", "europe-baltic", "europe-balkans", "europe-wide"]
  },
  "europe-scandinavia": {
    id: "europe-scandinavia",
    label: "Scandinavia",
    parent: "europe",
    activityId: "northern-european-countries",
    activityLabel: "Countries"
  },
  "europe-western": {
    id: "europe-western",
    label: "Western Europe",
    parent: "europe",
    activityId: "western-european-countries",
    activityLabel: "Countries"
  },
  "europe-baltic": {
    id: "europe-baltic",
    label: "Baltic Europe",
    parent: "europe",
    activityId: "baltic-europe",
    activityLabel: "Countries"
  },
  "europe-balkans": {
    id: "europe-balkans",
    label: "Balkans",
    parent: "europe",
    activityId: "balkans",
    activityLabel: "Countries"
  },
  "europe-wide": {
    id: "europe-wide",
    label: "Europe-wide",
    parent: "europe",
    activityId: "european-cities",
    activityLabel: "Cities"
  },
  asia: {
    id: "asia",
    label: "Asia",
    parent: "world",
    menuRoot: "asia",
    view: { center: [88, 31], zoom: 1.55 },
    children: ["asia-southwest", "asia-levant", "asia-central", "asia-southeastern", "asia-south-central", "asia-cities"]
  },
  "asia-southwest": {
    id: "asia-southwest",
    label: "Selected Asian Countries",
    parent: "asia",
    activityId: "southwest-asia",
    activityLabel: "Countries"
  },
  "asia-levant": {
    id: "asia-levant",
    label: "The Levant",
    parent: "asia",
    activityId: "the-levant",
    activityLabel: "Countries"
  },
  "asia-central": {
    id: "asia-central",
    label: "Central Asia",
    parent: "asia",
    activityId: "central-asia",
    activityLabel: "Countries"
  },
  "asia-southeastern": {
    id: "asia-southeastern",
    label: "Southeastern Asia",
    parent: "asia",
    activityId: "southeastern-asia",
    activityLabel: "Countries"
  },
  "asia-south-central": {
    id: "asia-south-central",
    label: "South Central Asia",
    parent: "asia",
    activityId: "south-central-asia",
    activityLabel: "Countries"
  },
  "asia-cities": {
    id: "asia-cities",
    label: "Cities",
    parent: "asia",
    activityId: "world-cities-east-south-asia",
    activityLabel: "Cities"
  },
  "north-america": {
    id: "north-america",
    label: "North America",
    parent: "world",
    menuRoot: "north-america",
    view: { center: [-98, 37], zoom: 1.85 },
    children: ["north-america-united-states", "north-america-mexico", "north-america-canada", "north-america-regional"]
  },
  "north-america-united-states": {
    id: "north-america-united-states",
    label: "United States",
    parent: "north-america",
    view: { center: [-98, 39], zoom: 3.1 },
    countryIsoA3: "USA",
    navigationAliases: {
      ids: ["united-states", "usa"],
      isoA3: ["USA", "US1"],
      names: ["United States", "United States of America", "USA"]
    },
    children: ["us-states-capitals", "us-physical-features"]
  },
  "north-america-mexico": {
    id: "north-america-mexico",
    label: "Mexico",
    parent: "north-america",
    view: { center: [-102, 23], zoom: 3.6 },
    countryIsoA3: "MEX",
    navigationAliases: {
      ids: ["mexico"],
      isoA3: ["MEX"],
      names: ["Mexico"]
    },
    children: ["mexico-states"]
  },
  "mexico-states": {
    id: "mexico-states",
    label: "States",
    parent: "north-america-mexico",
    activityId: "mexico-states"
  },
  "north-america-canada": {
    id: "north-america-canada",
    label: "Canada",
    parent: "north-america",
    view: { center: [-101, 58], zoom: 2.25 },
    countryIsoA3: "CAN",
    navigationAliases: {
      ids: ["canada"],
      isoA3: ["CAN"],
      names: ["Canada"]
    },
    children: ["canada-provinces-territories"]
  },
  "canada-provinces-territories": {
    id: "canada-provinces-territories",
    label: "Provinces and Territories",
    parent: "north-america-canada",
    activityId: "canada-provinces-territories"
  },
  "us-states-capitals": {
    id: "us-states-capitals",
    label: "States & Capitals",
    parent: "north-america-united-states",
    view: { center: [-98, 39], zoom: 3.1 },
    overviewCountryIsoA3: "USA",
    children: US_STATE_CAPITAL_MENU_ITEMS.map((item) => `nav-${item.activityId}`)
  },
  "us-physical-features": {
    id: "us-physical-features",
    label: "US Physical Features",
    parent: "north-america-united-states",
    view: { center: [-98, 39], zoom: 3.1 },
    children: US_PHYSICAL_FEATURE_MENU_ITEMS.map((item, index) => `us-physical-${index + 1}`)
  },
  "north-america-regional": {
    id: "north-america-regional",
    label: "Regional Activities",
    parent: "north-america",
    children: ["north-america-central-america", "north-america-caribbean", "north-america-cities"]
  },
  "north-america-central-america": {
    id: "north-america-central-america",
    label: "Central America",
    parent: "north-america-regional",
    activityId: "central-america",
    activityLabel: "Countries"
  },
  "north-america-caribbean": {
    id: "north-america-caribbean",
    label: "Caribbean",
    parent: "north-america-regional",
    activityId: "caribbean",
    activityLabel: "Countries"
  },
  "north-america-cities": {
    id: "north-america-cities",
    label: "Cities",
    parent: "north-america-regional",
    activityId: "world-cities-mesoamerica",
    activityLabel: "Cities"
  },
  "south-america": {
    id: "south-america",
    label: "South America",
    parent: "world",
    menuRoot: "south-america",
    view: { center: [-60, -18], zoom: 2.05 },
    children: ["south-america-west", "south-america-east"]
  },
  "south-america-west": {
    id: "south-america-west",
    label: "Western South America",
    parent: "south-america",
    activityId: "south-america-west",
    activityLabel: "Countries"
  },
  "south-america-east": {
    id: "south-america-east",
    label: "Eastern South America",
    parent: "south-america",
    activityId: "south-america-east",
    activityLabel: "Countries"
  },
  oceania: {
    id: "oceania",
    label: "Australia / Oceania",
    parent: "world",
    menuRoot: "oceania",
    view: { center: [141, -18], zoom: 2.1 },
    children: ["oceania-countries"]
  },
  "oceania-countries": {
    id: "oceania-countries",
    label: "Countries",
    parent: "oceania",
    activityId: "oceania",
    activityLabel: "Countries"
  },
  ...US_STATE_CAPITAL_NAV_NODES,
  ...US_PHYSICAL_FEATURE_NAV_NODES
};
const ACTIVITY_BACKLOG_BUCKETS = {
  africa: [
    {
      label: "Selected African Countries",
      sourceActivityId: "remaining-modern-countries",
      countryIds: ["egypt", "ivory-coast"]
    }
  ],
  asia: [
    {
      label: "Selected Asian Countries",
      sourceActivityId: "remaining-modern-countries",
      countryIds: ["israel", "mongolia"]
    }
  ],
  europe: [
    {
      label: "Northern Europe",
      sourceActivityId: "remaining-modern-countries",
      countryIds: ["iceland"]
    }
  ]
};
const activityCatalogMetadata = {
  "continents-oceans": {
    mapSet: "world-europe",
    category: "Physical Features",
    description: "Practice the continents and major oceans on the modern 3D globe.",
    sortOrder: 8
  },
  "western-european-countries": {
    mapSet: "world-europe",
    category: "Countries",
    description: "Atlantic-edge worksheet covering five Western Europe countries.",
    sortOrder: 10
  },
  "european-cities": {
    mapSet: "world-europe",
    category: "Cities",
    description: "Major European city placement with landmark-style point targets.",
    sortOrder: 15
  },
  "former-soviet-republics": {
    mapSet: "world-europe",
    category: "Countries",
    description: "Modern countries grouped by a shared recent political and cultural history.",
    sortOrder: 12
  },
  "world-cities-east-south-asia": {
    mapSet: "world-europe",
    category: "Cities",
    description: "East and South Asia city-only proof-sheet batch.",
    sortOrder: 16
  },
  "world-cities-europe-eastern-mediterranean": {
    mapSet: "world-europe",
    category: "Cities",
    description: "Europe and Eastern Mediterranean city-only proof-sheet batch.",
    sortOrder: 17
  },
  "world-cities-middle-east-north-africa": {
    mapSet: "world-europe",
    category: "Cities",
    description: "Middle East and North Africa city-only proof-sheet batch.",
    sortOrder: 18
  },
  "world-cities-mesoamerica": {
    mapSet: "world-europe",
    category: "Cities",
    description: "Mesoamerica city-only proof-sheet batch.",
    sortOrder: 19
  },
  "northern-european-countries": {
    mapSet: "world-europe",
    category: "Countries",
    description: "Scandinavia proof sheet with the four northern countries.",
    sortOrder: 13,
    sectionNumber: 13
  },
  "baltic-europe": {
    mapSet: "world-europe",
    category: "Countries",
    description: "Baltic and eastern-edge practice with five adjacent countries.",
    sortOrder: 14,
    sectionNumber: 14
  },
  "balkans": {
    mapSet: "world-europe",
    category: "Countries",
    description: "Southeastern Europe country review.",
    sortOrder: 16,
    sectionNumber: 16
  },
  "central-european-countries": {
    mapSet: "world-europe",
    category: "Countries",
    description: "Core Western and Central Europe country sheet.",
    sortOrder: 17,
    sectionNumber: 17
  },
  "more-central-european-countries": {
    mapSet: "world-europe",
    category: "Countries",
    description: "Alpine and east-central Europe follow-up sheet.",
    sortOrder: 18,
    sectionNumber: 18
  },
  "southern-africa-countries": {
    mapSet: "world-europe",
    category: "Countries",
    description: "Southern Africa proof sheet with five target countries.",
    sortOrder: 70
  },
  "african-countries": {
    mapSet: "world-europe",
    category: "Countries",
    description: "Cycle 1 African countries proof sheet with five modern countries.",
    sortOrder: 69,
    sectionNumber: 17
  },
  "the-levant": {
    mapSet: "world-europe",
    category: "Countries",
    description: "Eastern Mediterranean country sheet from the proof set.",
    sortOrder: 71,
    sectionNumber: 15
  },
  "central-america": {
    mapSet: "world-europe",
    category: "Countries",
    description: "Five-country Central America review sheet.",
    sortOrder: 72,
    sectionNumber: 21
  },
  "central-asia": {
    mapSet: "world-europe",
    category: "Countries",
    description: "Central Asia proof sheet with five inland countries.",
    sortOrder: 73,
    sectionNumber: 23
  },
  "south-america-west": {
    mapSet: "world-europe",
    category: "Countries",
    description: "Andes-side South America proof sheet.",
    sortOrder: 74,
    sectionNumber: 22
  },
  "south-america-east": {
    mapSet: "world-europe",
    category: "Countries",
    description: "Eastern South America and Guianas proof sheet.",
    sortOrder: 75,
    sectionNumber: 23
  },
  "caribbean": {
    mapSet: "world-europe",
    category: "Countries",
    description: "Caribbean islands proof sheet with country and territory targets.",
    sortOrder: 76,
    sectionNumber: 9
  },
  "southwest-asia": {
    mapSet: "world-europe",
    category: "Countries",
    description: "Southwest Asia country-only subset from the mixed proof sheet.",
    sortOrder: 77,
    sectionNumber: 10
  },
  "europe-and-asia-countries": {
    mapSet: "world-europe",
    category: "Countries",
    description: "Europe and Asia country-only subset: Russia and Ukraine.",
    sortOrder: 77.25,
    sectionNumber: 11
  },
  "remaining-modern-countries": {
    mapSet: "world-europe",
    category: "Countries",
    description: "Remaining modern sovereign countries from mixed proof sheets.",
    sortOrder: 77.5
  },
  "southeastern-asia": {
    mapSet: "world-europe",
    category: "Countries",
    description: "East and western Pacific country/territory proof sheet.",
    sortOrder: 78,
    sectionNumber: 19
  },
  "south-central-asia": {
    mapSet: "world-europe",
    category: "Countries",
    description: "Modern-country subset from the mixed South Central Asia proof sheet.",
    sortOrder: 78.5,
    sectionNumber: 20
  },
  "oceania": {
    mapSet: "world-europe",
    category: "Countries",
    description: "Oceania country-only subset from the mixed proof sheet.",
    sortOrder: 79,
    sectionNumber: 22
  },
  "mexico-states": {
    mapSet: "world-europe",
    category: "States",
    description: "Mexico federal entities practice with state and capital-district polygons.",
    sortOrder: 82
  },
  "canada-provinces-territories": {
    mapSet: "world-europe",
    category: "Provinces & Territories",
    description: "Canada provinces and territories polygon practice.",
    sortOrder: 83
  }
};
const supplementalOverviewEntries = [
  {
    id: "world-map",
    title: "Continents / Oceans",
    mapSet: "world-europe",
    category: "Physical Features",
    sectionNumber: null,
    itemCount: null,
    baseMap: "world-map",
    previewBounds: [[-180, -60], [180, 82]],
    previewRegionId: "continents-oceans-legacy",
    description: "Practice the continents and oceans on the world outline map.",
    sortOrder: 90,
    launch: {
      type: "legacy",
      activityId: "world-map"
    }
  }
];
const usSectionDescriptions = {
  1: "Maine, New Hampshire, Massachusetts, Rhode Island, Connecticut, and their capitals.",
  2: "Vermont, New York, New Jersey, Pennsylvania, Delaware, and their capitals.",
  3: "Maryland, Virginia, West Virginia, North Carolina, South Carolina, and Washington, DC.",
  4: "Georgia, Florida, Alabama, Mississippi, Louisiana, and their capitals.",
  5: "Michigan, Ohio, Indiana, Kentucky, Tennessee, and their capitals.",
  6: "Wisconsin, Illinois, Iowa, Missouri, Arkansas, and their capitals.",
  7: "Minnesota, North Dakota, South Dakota, Wyoming, Nebraska, and their capitals.",
  8: "Kansas, Oklahoma, Texas, Colorado, New Mexico, and their capitals.",
  9: "Utah, Arizona, Nevada, California, Hawaii, and their capitals.",
  10: "Montana, Idaho, Washington, Oregon, Alaska, and their capitals."
};

const stateLabelAnchors = {
  maine: [-69.2, 45.25],
  "new-hampshire": [-71.58, 43.75],
  massachusetts: [-71.85, 42.25],
  "rhode-island": [-71.55, 41.62],
  connecticut: [-72.72, 41.58],
  vermont: [-72.7, 44.05],
  "new-york": [-75.4, 43],
  "new-jersey": [-74.65, 40.25],
  pennsylvania: [-77.8, 40.8],
  delaware: [-75.5, 39.1],
  maryland: [-76.7, 39],
  virginia: [-78.5, 37.5],
  "west-virginia": [-80.6, 38.6],
  "north-carolina": [-79.4, 35.5],
  "south-carolina": [-80.9, 33.8],
  georgia: [-83.5, 32.7],
  florida: [-82.5, 28.4],
  alabama: [-86.8, 32.8],
  mississippi: [-89.7, 32.7],
  louisiana: [-91.9, 31],
  michigan: [-85.5, 44.3],
  ohio: [-82.8, 40.3],
  indiana: [-86.2, 40],
  kentucky: [-84.8, 37.8],
  tennessee: [-86.4, 35.8],
  wisconsin: [-89.8, 44.7],
  illinois: [-89.3, 40],
  iowa: [-93.5, 42.1],
  missouri: [-92.5, 38.5],
  arkansas: [-92.4, 34.8],
  minnesota: [-94.3, 46.3],
  "north-dakota": [-100.5, 47.5],
  "south-dakota": [-100.2, 44.5],
  wyoming: [-107.5, 43],
  nebraska: [-99.8, 41.5],
  kansas: [-98.3, 38.5],
  oklahoma: [-97.5, 35.5],
  texas: [-99.3, 31],
  colorado: [-105.5, 39],
  "new-mexico": [-106, 34.5],
  utah: [-111.5, 39.3],
  arizona: [-111.8, 34.2],
  nevada: [-117, 39],
  california: [-119.5, 37],
  hawaii: [-157.5, 20.8],
  montana: [-110.5, 47],
  idaho: [-114.3, 44.2],
  washington: [-120.5, 47.4],
  oregon: [-120.5, 44],
  alaska: [-150, 64]
};

let activities = [];
let selectedActivityId = defaultActivityId;
let session;
let runner;
let feedbackTimer;
let activeMapSet = defaultMapSet;
let activeMenuRoot = defaultMenuRoot;
let activeHierarchyNodeId = "world";
let isNavigationBrowseMode = false;
let isBrowseDrawerOpen = false;
let activePreviewActivityId = null;
let selectedOverviewActivityId = null;
let grabbedAnswerId = null;
let grabbedPointerId = null;
let grabbedStartPoint = null;
let grabbedHasMoved = false;
let floatingChip = null;
let completedActivityIds = loadCompletedActivityIds();
let activityProgress = loadActivityProgress();
let currentDifficulty = loadDifficultyMode();

const title = document.querySelector("#poc-title");
const instruction = document.querySelector("#poc-instruction");
const answerBank = document.querySelector("#answer-bank");
const progress = document.querySelector("#progress");
const feedback = document.querySelector("#feedback");
const resetButton = document.querySelector("#reset-button");
const backButton = document.querySelector("#back-button");
const homeButton = document.querySelector("#home-button");
const browseButton = document.querySelector("#browse-button");
const browseCloseButton = document.querySelector("#browse-close-button");
const settingsButton = document.querySelector("#settings-button");
const previousActivityButton = document.querySelector("#previous-activity-button");
const nextIncompleteButton = document.querySelector("#next-incomplete-button");
const activityNavControls = document.querySelector("#activity-nav-controls");
const fitMapButton = document.querySelector("#fit-map-button");
const zoomInButton = document.querySelector("#zoom-in-button");
const zoomOutButton = document.querySelector("#zoom-out-button");
const studyCard = document.querySelector("#study-card");
const regionPanel = document.querySelector("#region-panel");
const headerMapSetTabs = document.querySelector("#header-map-set-tabs");
const activityGroups = document.querySelector("#activity-groups");
const activityCount = document.querySelector("#activity-count");
const studyModeButtons = document.querySelectorAll("[data-study-mode]");
const studyModeControlGroup = document.querySelector("#study-mode-control-group");
const difficultyToggle = document.querySelector("#difficulty-toggle");
const difficultyControlGroup = document.querySelector("#difficulty-control-group");
const progressControlGroup = document.querySelector("#progress-control-group");
const difficultyButtons = document.querySelectorAll("[data-difficulty]");

async function init() {
  const [loadedActivities, worldCountries, supplementalWorldCountries, usStatesAtlas, stateTargets, northAmericaAdmin1] = await Promise.all([
    Promise.all(activityDataPaths.map((path) => fetchJson(path))),
    fetchJson(worldCountriesPath),
    Promise.all(worldCountrySupplements.map((path) => fetchJson(path))),
    fetchJson(usStatesAtlasPath),
    fetchJson(stateGeoJsonPath),
    fetchJson(northAmericaAdmin1Path)
  ]);

  const mergedWorldCountries = mergeFeatureCollections(worldCountries, supplementalWorldCountries);

  activities = loadedActivities.map((activity) => normalizeMapLibrePocActivity(activity));
  session = new ActivitySession(getSelectedActivity(), {
    activityCatalog: activities,
    studyMode: studyModes.cumulative
  });
  runner = new MapLibreActivityRunner({
    maplibregl: window.maplibregl,
    container: "map"
  });

  runner.onRegionSelect((activityId) => {
    if (activityId) {
      if (getHierarchyNode(activityId)) {
        drillToHierarchyNode(activityId);
        return;
      }

      const supplementalEntry = supplementalOverviewEntries.find((entry) => entry.id === activityId);

      if (supplementalEntry?.launch?.type === "legacy") {
        openLegacyActivity(supplementalEntry.launch.activityId);
        return;
      }

      const hierarchyNodeId = findHierarchyNodeForActivity(activityId);
      if (hierarchyNodeId) {
        drillToHierarchyNode(hierarchyNodeId);
      } else {
        selectActivity(activityId);
      }
    }
  });
  runner.onTargetClick(handleTargetClick);

  await runner.load({
    activity: session.activity,
    worldCountries: mergedWorldCountries,
    usStatesAtlas,
    stateTargets,
    northAmericaAdmin1
  });
  runner.setDifficulty(getEffectiveDifficulty(session.currentActivity));

  renderAnswerBank();
  updateProgress();
  updateStudyModeButtons();
  updateDifficultyControls();
  studyCard.hidden = true;
  runner.setOverviewMapSet(activeMenuRoot, getMenuOverviewView(activeMenuRoot));
  renderOverviewLibrary();
  updateOverviewPreview();
  bindUiEvents();
  bindZoomControls();
  setBrowseDrawerOpen(false);
  updateActivityNavigationControls();

  const initialActivityId = getInitialActivityFromUrl();

  if (initialActivityId) {
    openActivity(initialActivityId);
  } else {
    openHome();
  }
}

function normalizeMapLibrePocActivity(rawActivity) {
  const region = rawActivity.map?.region || inferActivityRegion(rawActivity.id);
  const mapDefaults = getMapDefaults(rawActivity, region);
  const metadata = getActivityMetadata(rawActivity, region, mapDefaults);
  const normalized = normalizeActivity(rawActivity, {
    schemaVersion: 2,
    engine: "maplibre",
    map: {
      ...mapDefaults,
      ...(rawActivity.map || {})
    },
    sources: [
      {
        id: "world-countries",
        type: "geojson",
        url: worldCountriesPath,
        attribution: "Natural Earth public domain"
      },
      {
        id: "us-states-atlas",
        type: "geojson",
        url: usStatesAtlasPath,
        attribution: "U.S. Census Bureau"
      },
      {
        id: "study-states",
        type: "geojson",
        url: stateGeoJsonPath,
        promoteId: "id",
        attribution: "U.S. Census Bureau"
      },
      {
        id: "north-america-admin1",
        type: "geojson",
        url: northAmericaAdmin1Path,
        promoteId: "id",
        attribution: "Natural Earth public domain"
      }
    ],
    targetLayers: [
      {
        id: "state-fill",
        kind: "shape",
        sourceId: "study-states",
        matchProperty: "id"
      },
      {
        id: "capital-hit",
        kind: "point",
        source: "targets"
      }
    ],
    labelAnchors: stateLabelAnchors
  });

  return {
    ...normalized,
    mapSet: metadata.mapSet,
    category: metadata.category,
    sectionNumber: metadata.sectionNumber,
    itemCount: metadata.itemCount,
    baseMap: metadata.baseMap,
    previewBounds: metadata.previewBounds,
    previewRegionId: metadata.previewRegionId,
    description: metadata.description,
    sortOrder: metadata.sortOrder
  };
}

function inferActivityRegion(activityId = "") {
  if (activityId.startsWith("us-")) {
    return "united-states";
  }

  const regionByActivityId = {
    "western-european-countries": "western-europe",
    "european-cities": "western-europe",
    "former-soviet-republics": "former-soviet-republics",
    "continents-oceans": "continents-oceans",
    "world-cities-east-south-asia": "world-cities-east-south-asia",
    "world-cities-europe-eastern-mediterranean": "world-cities-europe-eastern-mediterranean",
    "world-cities-middle-east-north-africa": "world-cities-middle-east-north-africa",
    "world-cities-mesoamerica": "world-cities-mesoamerica",
    "northern-european-countries": "northern-europe",
    "baltic-europe": "baltic-europe",
    "balkans": "balkans",
    "central-european-countries": "central-europe",
    "more-central-european-countries": "more-central-europe",
    "southern-africa-countries": "southern-africa",
    "african-countries": "african-countries",
    "the-levant": "levant",
    "central-america": "central-america",
    "central-asia": "central-asia",
    "south-america-west": "south-america-west",
    "south-america-east": "south-america-east",
    "caribbean": "caribbean",
    "southwest-asia": "southwest-asia",
    "europe-and-asia-countries": "europe-and-asia",
    "remaining-modern-countries": "remaining-modern-countries",
    "southeastern-asia": "southeastern-asia",
    "south-central-asia": "south-central-asia",
    "oceania": "oceania",
    "mexico-states": "mexico-states",
    "canada-provinces-territories": "canada-provinces-territories"
  };

  return regionByActivityId[activityId] || "world";
}

function getMapDefaults(rawActivity, region) {
  const commonDefaults = {
    kind: "globe-region",
    region,
    initialView: { center: [-18, 18], zoom: 1.25 }
  };

  if (region === "united-states") {
    const isFullUsActivity = Number(rawActivity.sequence) >= 9;

    return {
      ...commonDefaults,
      regionView: { center: [-98, 39], zoom: 3.1 },
      studyView: {
        bounds: isFullUsActivity
          ? [[-170, 18], [-66.75, 72]]
          : [[-108.5, 25.1], [-66.75, 49.2]],
        padding: { top: 55, right: 46, bottom: 78, left: 46 },
        duration: 1200
      }
    };
  }

  const regionViews = {
    "continents-oceans": {
      oceanRegions: true,
      regionView: { center: [-28, 18], zoom: 1.28 },
      studyView: {
        bounds: [[-179, -66], [179, 82]],
        padding: { top: 36, right: 36, bottom: 64, left: 36 },
        duration: 1050
      }
    },
    "western-europe": {
      regionView: { center: [-2, 48], zoom: 3.4 },
      studyView: {
        bounds: [[-12.8, 35.1], [8.8, 59.4]],
        padding: { top: 54, right: 54, bottom: 86, left: 54 },
        duration: 1050
      }
    },
    "former-soviet-republics": {
      regionView: { center: [59, 49], zoom: 2.0 },
      studyView: {
        bounds: [[18.0, 34.0], [180.0, 73.0]],
        padding: { top: 54, right: 54, bottom: 86, left: 54 },
        duration: 1050
      }
    },
    "world-cities-east-south-asia": {
      regionView: { center: [112, 31], zoom: 2.35 },
      studyView: {
        bounds: [[80.0, 17.0], [146.0, 43.0]],
        padding: { top: 54, right: 54, bottom: 86, left: 54 },
        duration: 1050
      }
    },
    "world-cities-europe-eastern-mediterranean": {
      regionView: { center: [22, 47], zoom: 2.75 },
      studyView: {
        bounds: [[-2.5, 35.0], [46.0, 58.5]],
        padding: { top: 54, right: 54, bottom: 86, left: 54 },
        duration: 1050
      }
    },
    "world-cities-middle-east-north-africa": {
      regionView: { center: [22, 29], zoom: 2.7 },
      studyView: {
        bounds: [[-12.0, 18.0], [49.0, 38.0]],
        padding: { top: 54, right: 54, bottom: 86, left: 54 },
        duration: 1050
      }
    },
    "world-cities-mesoamerica": {
      regionView: { center: [-98, 18.3], zoom: 4.7 },
      studyView: {
        bounds: [[-101.5, 15.2], [-94.8, 20.9]],
        padding: { top: 54, right: 54, bottom: 86, left: 54 },
        duration: 1050
      }
    },
    "northern-europe": {
      regionView: { center: [17, 62], zoom: 3.2 },
      studyView: {
        bounds: [[2.5, 54.1], [33.8, 72.2]],
        padding: { top: 54, right: 54, bottom: 86, left: 54 },
        duration: 1050
      }
    },
    "baltic-europe": {
      regionView: { center: [23.5, 54.6], zoom: 3.9 },
      studyView: {
        bounds: [[13, 48.5], [33.5, 60.5]],
        padding: { top: 54, right: 54, bottom: 86, left: 54 },
        duration: 1050
      }
    },
    "balkans": {
      regionView: { center: [22, 42], zoom: 3.8 },
      studyView: {
        bounds: [[12.5, 34], [30.5, 49]],
        padding: { top: 54, right: 54, bottom: 86, left: 54 },
        duration: 1050
      }
    },
    "central-europe": {
      regionView: { center: [8.8, 50.5], zoom: 4.2 },
      studyView: {
        bounds: [[1.8, 45.2], [16, 55.4]],
        padding: { top: 54, right: 54, bottom: 86, left: 54 },
        duration: 1050
      }
    },
    "more-central-europe": {
      regionView: { center: [14.8, 44.5], zoom: 3.8 },
      studyView: {
        bounds: [[6, 35.8], [23.5, 52]],
        padding: { top: 54, right: 54, bottom: 86, left: 54 },
        duration: 1050
      }
    },
    "southern-africa": {
      regionView: { center: [25, -23], zoom: 3.1 },
      studyView: {
        bounds: [[10, -36.5], [42, -9.7]],
        padding: { top: 54, right: 54, bottom: 86, left: 54 },
        duration: 1050
      }
    },
    "african-countries": {
      regionView: { center: [34, -11], zoom: 2.95 },
      studyView: {
        bounds: [[22.0, -31.8], [51.5, 15.2]],
        padding: { top: 54, right: 54, bottom: 86, left: 54 },
        duration: 1050
      }
    },
    "levant": {
      regionView: { center: [41.5, 35.4], zoom: 3.4 },
      studyView: {
        bounds: [[25.5, 28.2], [64.5, 42.8]],
        padding: { top: 54, right: 54, bottom: 86, left: 54 },
        duration: 1050
      }
    },
    "central-america": {
      regionView: { center: [-88.1, 14.6], zoom: 4.6 },
      studyView: {
        bounds: [[-93.7, 7.2], [-82.8, 18.9]],
        padding: { top: 54, right: 54, bottom: 86, left: 54 },
        duration: 1050
      }
    },
    "central-asia": {
      regionView: { center: [67.5, 42.2], zoom: 3.25 },
      studyView: {
        bounds: [[50, 35.3], [86.5, 56.8]],
        padding: { top: 54, right: 54, bottom: 86, left: 54 },
        duration: 1050
      }
    },
    "south-america-west": {
      regionView: { center: [-72, -10.5], zoom: 3.15 },
      studyView: {
        bounds: [[-82.5, -40.5], [-58.8, 13.8]],
        padding: { top: 54, right: 54, bottom: 86, left: 54 },
        duration: 1050
      }
    },
    "south-america-east": {
      regionView: { center: [-56.5, -15.8], zoom: 3.15 },
      studyView: {
        bounds: [[-74.5, -40.8], [-33.5, 9.8]],
        padding: { top: 54, right: 54, bottom: 86, left: 54 },
        duration: 1050
      }
    },
    "caribbean": {
      regionView: { center: [-74.5, 19.2], zoom: 4.25 },
      studyView: {
        bounds: [[-85.5, 16.4], [-63.8, 24.6]],
        padding: { top: 54, right: 54, bottom: 86, left: 54 },
        duration: 1050
      }
    },
    "southwest-asia": {
      regionView: { center: [73.5, 27], zoom: 3.35 },
      studyView: {
        bounds: [[58.5, 5.5], [92.5, 38.9]],
        padding: { top: 54, right: 54, bottom: 86, left: 54 },
        duration: 1050
      }
    },
    "europe-and-asia": {
      regionView: { center: [59, 56], zoom: 2.0 },
      studyView: {
        bounds: [[20.0, 43.0], [180.0, 82.5]],
        padding: { top: 54, right: 54, bottom: 86, left: 54 },
        duration: 1050
      }
    },
    "remaining-modern-countries": {
      regionView: { center: [36, 35], zoom: 1.45 },
      studyView: {
        bounds: [[-28.0, -1.0], [121.0, 72.5]],
        padding: { top: 54, right: 54, bottom: 86, left: 54 },
        duration: 1050
      }
    },
    "southeastern-asia": {
      regionView: { center: [131, 24], zoom: 2.75 },
      studyView: {
        bounds: [[118.0, 7.0], [147.2, 45.5]],
        padding: { top: 54, right: 54, bottom: 86, left: 54 },
        duration: 1050
      }
    },
    "south-central-asia": {
      regionView: { center: [102.8, 15.5], zoom: 4.0 },
      studyView: {
        bounds: [[96.8, 5.0], [108.8, 22.8]],
        padding: { top: 54, right: 54, bottom: 86, left: 54 },
        duration: 1050
      }
    },
    "oceania": {
      regionView: { center: [141, -18], zoom: 2.35 },
      studyView: {
        bounds: [[94.0, -49.5], [179.0, 8.5]],
        padding: { top: 54, right: 54, bottom: 86, left: 54 },
        duration: 1050
      }
    },
    "mexico-states": {
      regionView: { center: [-102, 23], zoom: 3.6 },
      studyView: {
        bounds: [[-118.5, 13.5], [-86.5, 33.8]],
        padding: { top: 54, right: 54, bottom: 86, left: 54 },
        duration: 1050
      }
    },
    "canada-provinces-territories": {
      regionView: { center: [-101, 58], zoom: 2.25 },
      studyView: {
        bounds: [[-141.5, 41.2], [-51.5, 83.5]],
        padding: { top: 54, right: 54, bottom: 86, left: 54 },
        duration: 1050
      }
    }
  };

  return {
    ...commonDefaults,
    ...(regionViews[region] || {
      regionView: { center: [0, 20], zoom: 2 },
      studyView: {
        bounds: [[-20, -40], [50, 75]],
        padding: { top: 54, right: 54, bottom: 86, left: 54 },
        duration: 1050
      }
    })
  };
}

function getActivityMetadata(rawActivity, region, mapDefaults) {
  const featureCount = (rawActivity.targets || rawActivity.features || []).length;

  if (rawActivity.id.startsWith("us-states-capitals-")) {
    const sectionNumber = Number(rawActivity.sequence);

    return {
      mapSet: "us",
      category: "States & Capitals",
      sectionNumber,
      itemCount: featureCount,
      baseMap: "usa-map",
      previewBounds: mapDefaults.studyView.bounds,
      previewRegionId: rawActivity.id,
      description: usSectionDescriptions[sectionNumber] || "United States section review.",
      sortOrder: sectionNumber
    };
  }

  const configured = activityCatalogMetadata[rawActivity.id] || {};

  return {
    mapSet: configured.mapSet || "world-europe",
    category: configured.category || "Countries",
    sectionNumber: configured.sectionNumber ?? rawActivity.sequence ?? null,
    itemCount: configured.itemCount || featureCount,
    baseMap: configured.baseMap || "world-countries",
    previewBounds: configured.previewBounds || mapDefaults.studyView.bounds,
    previewRegionId: configured.previewRegionId || rawActivity.id,
    description: configured.description || "Regional geography proof sheet.",
    sortOrder: configured.sortOrder ?? rawActivity.sequence ?? 999
  };
}

async function fetchJson(path) {
  const response = await fetch(path);

  if (!response.ok) {
    throw new Error(`${path} could not be loaded.`);
  }

  return response.json();
}

function getInitialActivityFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const requestedActivityId = params.get("activity");

  if (!requestedActivityId) {
    return null;
  }

  return activities.some((activity) => activity.id === requestedActivityId) ? requestedActivityId : null;
}

function mergeFeatureCollections(baseCollection, supplementalCollections = []) {
  return {
    ...baseCollection,
    features: [
      ...(baseCollection?.features || []),
      ...supplementalCollections.flatMap((collection) => collection?.features || [])
    ]
  };
}

function bindUiEvents() {
  headerMapSetTabs.addEventListener("click", (event) => {
    const button = event.target.closest("[data-menu-root]");

    if (!button) {
      return;
    }

    drillToHierarchyNode(button.dataset.menuRoot);
    closeBrowseDrawer();
  });

  activityGroups.addEventListener("click", (event) => {
    const card = event.target.closest("[data-activity-id]");

    if (!card) {
      return;
    }

    if (card.dataset.launchType === "legacy") {
      closeBrowseDrawer();
      openLegacyActivity(card.dataset.legacyActivityId);
      return;
    }

    const hierarchyNodeId = findHierarchyNodeForActivity(card.dataset.activityId);
    if (hierarchyNodeId) {
      drillToHierarchyNode(hierarchyNodeId);
    } else {
      selectActivity(card.dataset.activityId);
    }

    closeBrowseDrawer();
  });

  activityGroups.addEventListener("pointerover", (event) => {
    const card = event.target.closest("[data-activity-id]");

    if (!card) {
      return;
    }

    setOverviewPreviewActivity(card.dataset.activityId);
  });

  activityGroups.addEventListener("pointerout", (event) => {
    const card = event.target.closest("[data-activity-id]");

    if (!card || card.contains(event.relatedTarget)) {
      return;
    }

    restoreOverviewPreview();
  });

  activityGroups.addEventListener("focusin", (event) => {
    const card = event.target.closest("[data-activity-id]");

    if (card) {
      setOverviewPreviewActivity(card.dataset.activityId);
    }
  });

  activityGroups.addEventListener("focusout", (event) => {
    const card = event.target.closest("[data-activity-id]");

    if (!card || card.contains(event.relatedTarget)) {
      return;
    }

    restoreOverviewPreview();
  });

  studyModeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      cancelGrabbedAnswer();
      saveCurrentActivityProgress();
      session.setStudyMode(button.dataset.studyMode);
      session.setCompletedIds(getActivityProgress(session.currentActivity.id));
      runner.updateActivity(session.activity);
      runner.setCompletedTargets(session.completedIds);
      runner.setDifficulty(getEffectiveDifficulty(session.currentActivity));
      renderAnswerBank();
      updateProgress();
      updateStudyModeButtons();
      updateDifficultyControls();
      updateStudyCardDetails();
      ensureActivityNavControls();
      clearFeedback();
    });
  });

  difficultyButtons.forEach((button) => {
    button.addEventListener("click", () => {
      setDifficultyMode(button.dataset.difficulty);
    });
  });

  homeButton?.addEventListener("click", openHome);
  backButton?.addEventListener("click", goBack);
  browseButton?.addEventListener("click", toggleBrowseDrawer);
  browseCloseButton?.addEventListener("click", closeBrowseDrawer);
  settingsButton?.addEventListener("click", () => {
    showFeedback("Settings will be added here.");
  });
  previousActivityButton?.addEventListener("click", openPreviousActivity);
  nextIncompleteButton?.addEventListener("click", openNextIncompleteActivity);
  resetButton.addEventListener("click", resetActivity);
  document.addEventListener("pointermove", handleDocumentPointerMove);
  document.addEventListener("pointerup", handleDocumentPointerUp);
  document.addEventListener("pointercancel", cancelGrabbedAnswer);
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeBrowseDrawer();
      cancelGrabbedAnswer();
    }
  });
}

function renderOverviewLibrary() {
  renderMapSetTabs();
  renderActivityGroups();
  if (isStudyModeActive()) {
    ensureActivityNavControls();
    return;
  }

  renderActivityNavControls(null);
}

function toggleBrowseDrawer() {
  setBrowseDrawerOpen(!isBrowseDrawerOpen);
}

function closeBrowseDrawer() {
  setBrowseDrawerOpen(false);
}

function setBrowseDrawerOpen(isOpen) {
  isBrowseDrawerOpen = Boolean(isOpen);
  document.body.classList.toggle("browse-drawer-open", isBrowseDrawerOpen);
  browseButton?.setAttribute("aria-expanded", String(isBrowseDrawerOpen));
  browseButton?.classList.toggle("active", isBrowseDrawerOpen);
  regionPanel?.setAttribute("aria-hidden", String(!isBrowseDrawerOpen));

  if (regionPanel) {
    regionPanel.inert = !isBrowseDrawerOpen;
  }
}

function renderMapSetTabs() {
  headerMapSetTabs.innerHTML = "";

  ACTIVITY_MENU.forEach((root) => {
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.menuRoot = root.id;
    button.className = "header-map-set-tab";
    button.setAttribute("role", "tab");
    button.setAttribute("aria-selected", String(activeMenuRoot === root.id));
    button.classList.toggle("active", activeMenuRoot === root.id);
    button.textContent = root.label;
    headerMapSetTabs.appendChild(button);
  });
}

function saveCurrentActivityProgress() {
  if (!session?.currentActivity) {
    return;
  }

  setActivityProgress(session.currentActivity.id, session.completedIds, getEffectiveDifficulty(session.currentActivity));
}

function getActivityProgress(activityId, difficulty = currentDifficulty) {
  return activityProgress[getActivityProgressKey(activityId, difficulty)] || [];
}

function setActivityProgress(activityId, completedIds = [], difficulty = currentDifficulty) {
  if (!activityId) {
    return;
  }

  const key = getActivityProgressKey(activityId, difficulty);
  const uniqueIds = [...new Set(completedIds)];

  if (uniqueIds.length === 0) {
    delete activityProgress[key];
  } else {
    activityProgress[key] = uniqueIds;
  }

  saveActivityProgress();
}

function getActivityProgressKey(activityId, difficulty = currentDifficulty) {
  return `${activityId}:${difficulty}`;
}

function getProgressSummary(activity) {
  if (!activity || activity.launch) {
    return null;
  }

  const total = activity.targets?.length || activity.itemCount || 0;

  if (total <= 0) {
    return null;
  }

  const completedCount = getActivityProgress(activity.id, getEffectiveDifficulty(activity))
    .filter((id) => activity.targets.some((target) => target.id === id)).length;

  return {
    completedCount,
    total,
    isStarted: completedCount > 0,
    isComplete: completedCount >= total
  };
}

function isDifficultyApplicable(activity) {
  return Boolean(activity && !activity.launch);
}

function getAvailableDifficulties(activity = session?.currentActivity) {
  if (activity?.id === "continents-oceans") {
    return [difficultyModes.easy, difficultyModes.hard];
  }

  return Object.values(difficultyModes);
}

function normalizeDifficultyForActivity(difficulty, activity = session?.currentActivity) {
  const availableDifficulties = getAvailableDifficulties(activity);

  if (availableDifficulties.includes(difficulty)) {
    return difficulty;
  }

  return difficultyModes.easy;
}

function ensureCurrentDifficultyForActivity(activity = session?.currentActivity) {
  const normalizedDifficulty = normalizeDifficultyForActivity(currentDifficulty, activity);

  if (normalizedDifficulty === currentDifficulty) {
    return;
  }

  currentDifficulty = normalizedDifficulty;
  saveDifficultyMode();
}

function getEffectiveDifficulty(activity = session?.currentActivity) {
  return isDifficultyApplicable(activity) ? normalizeDifficultyForActivity(currentDifficulty, activity) : difficultyModes.easy;
}

function setDifficultyMode(difficulty) {
  const normalizedDifficulty = normalizeDifficultyForActivity(difficulty, session?.currentActivity);

  if (!getAvailableDifficulties(session?.currentActivity).includes(difficulty) || normalizedDifficulty === currentDifficulty) {
    return;
  }

  const hasProgress = session?.completedIds?.length > 0;

  if (isStudyModeActive() && isDifficultyApplicable(session.currentActivity) && hasProgress) {
    const shouldReset = window.confirm("Changing difficulty will reset progress for this activity mode. Continue?");

    if (!shouldReset) {
      updateDifficultyControls();
      return;
    }
  }

  if (isStudyModeActive() && isDifficultyApplicable(session.currentActivity)) {
    setActivityProgress(session.currentActivity.id, [], currentDifficulty);
    setActivityCompletedState(session.currentActivity.id, false);
    session.reset();
    runner.setCompletedTargets(session.completedIds);
  }

  currentDifficulty = normalizedDifficulty;
  saveDifficultyMode();

  if (isStudyModeActive() && isDifficultyApplicable(session.currentActivity)) {
    session.setCompletedIds(getActivityProgress(session.currentActivity.id, currentDifficulty));
    runner.setCompletedTargets(session.completedIds);
    runner.setDifficulty(getEffectiveDifficulty(session.currentActivity));
    renderAnswerBank();
    updateProgress();
    updateStudyCardDetails();
    clearFeedback();
  }

  updateDifficultyControls();
}

function renderActivityGroups() {
  activityGroups.innerHTML = "";

  const root = getMenuRoot(activeMenuRoot);
  const playableEntries = getPlayableMenuEntries(activeMenuRoot);
  updateActivityCount(playableEntries.length);

  if (!root || root.children.length === 0) {
    activityGroups.innerHTML = "<p>No activities are available for this map set yet.</p>";
    return;
  }

  root.children.forEach((region) => {
    const section = document.createElement("section");
    section.className = "activity-group";

    const heading = document.createElement("div");
    heading.className = "activity-group-heading";
    const regionCount = getMenuNodeItemCount(region);
    heading.innerHTML = `<h3>${region.label}</h3><span>${regionCount} item${regionCount === 1 ? "" : "s"}</span>`;
    section.appendChild(heading);
    section.appendChild(renderMenuChildren(region.children || [], region.label, 0));
    activityGroups.appendChild(section);
  });
}

function renderMenuChildren(nodes, regionLabel, depth = 0) {
  const wrapper = document.createElement("div");
  wrapper.className = depth === 0 ? "activity-group-stack" : "activity-subgroup-stack";

  nodes.forEach((menuItem) => {
    if (menuItem.children) {
      wrapper.appendChild(createMenuSubgroup(menuItem, regionLabel, depth + 1));
      return;
    }

    let grid = wrapper.lastElementChild;

    if (!grid || !grid.classList.contains("activity-card-grid")) {
      grid = document.createElement("div");
      grid.className = "activity-card-grid";
      wrapper.appendChild(grid);
    }

    grid.appendChild(createMenuCard(menuItem, regionLabel));
  });

  return wrapper;
}

function createMenuSubgroup(menuItem, regionLabel, depth) {
  const subgroup = document.createElement("section");
  subgroup.className = "activity-subgroup";

  const heading = document.createElement("div");
  heading.className = "activity-subgroup-heading";
  const itemCount = getMenuNodeItemCount(menuItem);
  heading.innerHTML = `<h4>${menuItem.label}</h4><span>${itemCount} item${itemCount === 1 ? "" : "s"}</span>`;
  subgroup.appendChild(heading);
  subgroup.appendChild(renderMenuChildren(menuItem.children || [], regionLabel, depth));

  return subgroup;
}

function createMenuCard(menuItem, regionLabel) {
  const activity = resolveMenuActivity(menuItem);
  const isDisabled = menuItem.disabled || !activity;
  const card = document.createElement("button");
  card.type = "button";
  card.className = "activity-card";
  card.classList.toggle("activity-card-disabled", isDisabled);
  card.disabled = isDisabled;

  if (activity) {
    card.dataset.activityId = activity.id;
    card.dataset.launchType = activity.launch?.type || "activity";
    card.classList.toggle("active", getCurrentOverviewPreviewId() === activity.id);
    card.setAttribute("aria-pressed", String(getCurrentOverviewPreviewId() === activity.id));

    if (activity.launch?.activityId) {
      card.dataset.legacyActivityId = activity.launch.activityId;
    }
  } else {
    card.setAttribute("aria-disabled", "true");
  }

  const cardCountMarkup = activity && Number.isFinite(activity.itemCount)
    ? `<span class="activity-card-count">${activity.itemCount} items</span>`
    : `<span class="activity-card-count">${activity ? "Activity" : menuItem.badge || "Coming soon"}</span>`;
  const progressSummary = getProgressSummary(activity);
  const progressBadgeMarkup = progressSummary?.isComplete
    ? `<span class="activity-card-progress complete">${progressSummary.total} of ${progressSummary.total} complete</span>`
    : progressSummary?.isStarted
      ? `<span class="activity-card-progress">${progressSummary.completedCount} of ${progressSummary.total} complete</span>`
      : "";
  const resumeMarkup = progressSummary?.isStarted && !progressSummary.isComplete
    ? `<span class="activity-card-resume">Resume</span>`
    : "";
  const titleText = menuItem.title || menuItem.label || activity?.title || "Coming soon";
  const description = isDisabled
    ? "Placeholder for a future activity."
    : activity.description || "Regional geography activity.";
  const metaLabel = activity?.sectionNumber ? `Section ${activity.sectionNumber}` : regionLabel;

  card.innerHTML = `
    <div class="activity-card-topline">
      <span class="activity-card-category">${titleText}</span>
      ${cardCountMarkup}
      ${progressBadgeMarkup}
    </div>
    <strong>${titleText}</strong>
    <div class="activity-card-meta">
      <span>${isDisabled ? "Coming soon" : metaLabel}</span>
      <span>${regionLabel}</span>
    </div>
    ${resumeMarkup}
    <p>${description}</p>
  `;

  return card;
}

function resolveMenuActivity(menuItem) {
  if (!menuItem.activityId) {
    return null;
  }

  return [...activities, ...supplementalOverviewEntries].find((activity) => activity.id === menuItem.activityId) || null;
}

function getHierarchyNode(nodeId) {
  return GEOGRAPHY_NAV_NODES[nodeId] || null;
}

function getHierarchyChildren(node) {
  return (node?.children || [])
    .map((childId) => getHierarchyNode(childId))
    .filter(Boolean);
}

function getHierarchyPath(nodeId) {
  const path = [];
  let node = getHierarchyNode(nodeId);
  const visited = new Set();

  while (node && !visited.has(node.id)) {
    visited.add(node.id);
    path.unshift(node);
    node = getHierarchyNode(node.parent);
  }

  return path;
}

function getHierarchyBreadcrumb(nodeId, options = {}) {
  const path = getHierarchyPath(nodeId);
  const labels = path.map((node) => node.label);

  if (options.activityLabel) {
    labels.push(options.activityLabel);
  }

  return labels.join(" -> ");
}

function getHierarchyView(node) {
  if (node?.view) {
    return node.view;
  }

  if (node?.menuRoot) {
    return getMenuOverviewView(node.menuRoot);
  }

  if (node?.activityId) {
    const activity = resolveMenuActivity({ activityId: node.activityId });
    return activity?.map?.regionView || activity?.map?.studyView || null;
  }

  if (node?.parent) {
    return getHierarchyView(getHierarchyNode(node.parent));
  }

  return getMenuOverviewView(defaultMenuRoot);
}

function getHierarchyMenuRoot(nodeId) {
  const path = getHierarchyPath(nodeId);

  for (let index = path.length - 1; index >= 0; index -= 1) {
    if (path[index].menuRoot) {
      return path[index].menuRoot;
    }
  }

  return defaultMenuRoot;
}

function findHierarchyNodeForActivity(activityId) {
  return Object.values(GEOGRAPHY_NAV_NODES)
    .find((node) => node.activityId === activityId)?.id || null;
}

function getMenuRoot(menuRootId) {
  return ACTIVITY_MENU.find((root) => root.id === menuRootId) || ACTIVITY_MENU[0];
}

function hasMenuRoot(menuRootId) {
  return ACTIVITY_MENU.some((root) => root.id === menuRootId);
}

function getMenuOverviewView(menuRootId) {
  return getMenuRoot(menuRootId)?.overviewView || getMenuRoot(defaultMenuRoot).overviewView;
}

function getPlayableMenuEntries(menuRootId) {
  return getPlayableMenuEntriesFromNodes(getMenuRoot(menuRootId)?.children || []);
}

function getPlayableMenuEntriesFromNodes(nodes) {
  const entries = [];

  nodes.forEach((node) => {
    if (node.children) {
      entries.push(...getPlayableMenuEntriesFromNodes(node.children));
      return;
    }

    if (node.disabled) {
      return;
    }

    const activity = resolveMenuActivity(node);

    if (activity) {
      entries.push(activity);
    }
  });

  return entries;
}

function getMenuNodeItemCount(node) {
  if (!node?.children) {
    return 1;
  }

  return node.children.reduce((count, child) => count + getMenuNodeItemCount(child), 0);
}

function getAllMenuActivityIds() {
  const ids = [];
  ACTIVITY_MENU.forEach((root) => {
    getPlayableMenuEntries(root.id).forEach((activity) => {
      if (!activity.launch && !ids.includes(activity.id)) {
        ids.push(activity.id);
      }
    });
  });
  return ids;
}

function findMenuRootForActivity(activityId) {
  return ACTIVITY_MENU.find((root) => getPlayableMenuEntries(root.id).some((activity) => activity.id === activityId))?.id || null;
}

function getCurrentOverviewPreviewId() {
  return activePreviewActivityId || selectedOverviewActivityId;
}

function setOverviewPreviewActivity(activityId) {
  activePreviewActivityId = activityId;
  highlightOverviewCard(activityId);
  updateOverviewPreview();
}

function restoreOverviewPreview() {
  activePreviewActivityId = null;
  highlightOverviewCard(selectedOverviewActivityId);
  updateOverviewPreview();
}

function highlightOverviewCard(activityId) {
  activityGroups.querySelectorAll("[data-activity-id]").forEach((card) => {
    const isActive = card.dataset.activityId === activityId;
    card.classList.toggle("active", isActive);
    card.setAttribute("aria-pressed", String(isActive));
  });
}

function updateOverviewPreview() {
  const previewActivity = [...activities, ...supplementalOverviewEntries]
    .find((activity) => activity.id === getCurrentOverviewPreviewId()) || null;

  if (previewActivity) {
    runner?.setOverviewPreview(previewActivity, getActivityProgress(previewActivity.id, getEffectiveDifficulty(previewActivity)));
    return;
  }

  if (isNavigationBrowseMode) {
    runner?.setOverviewFeatureCollection(getBrowseFeatureCollection(activeHierarchyNodeId));
    return;
  }

  runner?.setOverviewPreview(null);
}

function getBrowseFeatureCollection(nodeId) {
  if (!runner) {
    return {
      type: "FeatureCollection",
      features: []
    };
  }

  const features = getHierarchyChildren(getHierarchyNode(nodeId))
    .filter((child) => !child.disabled)
    .flatMap((child) => {
      const countryIsoA3 = child.countryIsoA3 || child.overviewCountryIsoA3;

      if (countryIsoA3 && runner.getOverviewGeoJsonForCountry) {
        return runner.getOverviewGeoJsonForCountry(countryIsoA3, {
          activityId: child.id,
          label: child.label
        }).features;
      }

      if (!runner.getOverviewGeoJsonForActivity) {
        return [];
      }

      const activity = resolveMenuActivity({ activityId: child.activityId || getFirstDescendantActivityId(child) });

      if (!activity) {
        return [];
      }

      return runner.getOverviewGeoJsonForActivity(activity, getActivityProgress(activity.id, getEffectiveDifficulty(activity)), {
        activityId: child.id,
        label: child.label
      }).features;
    });

  return {
    type: "FeatureCollection",
    features
  };
}

function getFirstDescendantActivityId(node) {
  if (node?.activityId) {
    return node.activityId;
  }

  for (const child of getHierarchyChildren(node)) {
    const activityId = getFirstDescendantActivityId(child);

    if (activityId) {
      return activityId;
    }
  }

  return null;
}

function setActiveMenuRoot(menuRootId) {
  drillToHierarchyNode(menuRootId);
}

function showMenuRoot(menuRootId = activeMenuRoot) {
  cancelGrabbedAnswer();
  document.body.classList.add("overview-mode");
  document.body.classList.remove("study-mode");
  title.textContent = "World View";
  instruction.textContent = "Choose a study region from the globe or the list below.";
  studyCard.hidden = true;
  renderOverviewLibrary();
  runner?.setOverviewMapSet(menuRootId, getMenuOverviewView(menuRootId));
  runner?.enterOverview();
  updateOverviewPreview();
  updateDifficultyControls();
  renderActivityNavControls(null);
}

function openHome() {
  closeBrowseDrawer();
  drillToHierarchyNode("world");
}

function goBack() {
  closeBrowseDrawer();
  const node = getHierarchyNode(activeHierarchyNodeId);

  if (!node?.parent) {
    openHome();
    return;
  }

  drillToHierarchyNode(node.parent);
}

function drillToHierarchyNode(nodeId) {
  const node = getHierarchyNode(nodeId);

  if (!node || node.disabled) {
    return;
  }

  saveCurrentActivityProgress();
  activeHierarchyNodeId = node.id;
  activeMenuRoot = getHierarchyMenuRoot(node.id) || activeMenuRoot;
  selectedOverviewActivityId = null;
  activePreviewActivityId = null;

  if (node.activityId) {
    openActivity(node.activityId, { hierarchyNodeId: node.id });
    return;
  }

  showHierarchyBrowseNode(node.id);
}

function showHierarchyBrowseNode(nodeId) {
  const node = getHierarchyNode(nodeId);

  if (!node) {
    return;
  }

  cancelGrabbedAnswer();
  isNavigationBrowseMode = true;
  document.body.classList.add("overview-mode", "browse-mode");
  document.body.classList.remove("study-mode");
  title.textContent = getHierarchyBreadcrumb(node.id);
  instruction.textContent = "Choose a place on the map or pick a label below.";
  studyCard.hidden = true;
  renderNavigationAnswerBank(node.id);
  renderOverviewLibrary();
  runner?.setOverviewMapSet(activeMenuRoot, getHierarchyView(node));
  runner?.enterOverview();
  updateOverviewPreview();
  updateDifficultyControls();
  renderActivityNavControls(null);
  updateTopBarNavigation();
}

function bindZoomControls() {
  if (!fitMapButton) {
    return;
  }

  zoomInButton?.addEventListener("click", () => {
    runner.setZoom(runner.getZoom() + 0.65);
  });
  zoomOutButton?.addEventListener("click", () => {
    runner.setZoom(runner.getZoom() - 0.65);
  });
  fitMapButton.addEventListener("click", () => {
    runner.fitCurrentView();
  });
}

function updateActivityCount(count) {
  if (!activityCount) {
    return;
  }

  activityCount.textContent = `Showing ${count} activit${count === 1 ? "y" : "ies"}`;
}

function renderAnswerBank() {
  setAnswerPanelMode("activity");
  answerBank.innerHTML = "";

  session.answerItems.forEach((feature) => {
    const chip = document.createElement("button");
    chip.className = "label-chip";
    chip.type = "button";
    chip.dataset.id = feature.id;
    chip.textContent = feature.name;
    chip.setAttribute("aria-pressed", "false");
    chip.addEventListener("pointerdown", (event) => {
      handleChipPointerDown(event, feature);
    });
    chip.addEventListener("click", (event) => {
      event.preventDefault();
    });
    answerBank.appendChild(chip);
  });
}

function renderNavigationAnswerBank(nodeId = activeHierarchyNodeId) {
  const node = getHierarchyNode(nodeId);
  setAnswerPanelMode("navigation");
  answerBank.innerHTML = "";

  getHierarchyChildren(node).forEach((child) => {
    const chip = document.createElement("button");
    chip.className = "label-chip navigation-chip";
    chip.type = "button";
    chip.dataset.nodeId = child.id;
    chip.textContent = child.badge ? `${child.label} (${child.badge})` : child.label;
    chip.disabled = Boolean(child.disabled);
    chip.addEventListener("click", () => {
      if (!child.disabled) {
        closeBrowseDrawer();
        drillToHierarchyNode(child.id);
      }
    });
    answerBank.appendChild(chip);
  });
}

function setAnswerPanelMode(mode) {
  const isNavigation = mode === "navigation";
  const isActivity = mode === "activity";
  const titleNode = document.querySelector(".answer-panel-title h2");

  if (titleNode) {
    titleNode.textContent = isNavigation ? "Choose Region" : "Word Bank";
  }

  if (studyModeControlGroup) {
    studyModeControlGroup.hidden = !isActivity;
  }

  if (progressControlGroup) {
    progressControlGroup.hidden = !isActivity;
  }

  if (difficultyControlGroup) {
    difficultyControlGroup.hidden = !isActivity || !isDifficultyApplicable(session?.currentActivity);
  }
}

function openActivity(activityId, options = {}) {
  saveCurrentActivityProgress();
  cancelGrabbedAnswer();
  selectedActivityId = activityId;
  const hierarchyNode = getHierarchyNode(options.hierarchyNodeId) || getHierarchyNode(findHierarchyNodeForActivity(activityId));
  activeHierarchyNodeId = hierarchyNode?.id || activeHierarchyNodeId;
  activeMenuRoot = getHierarchyMenuRoot(activeHierarchyNodeId) || findMenuRootForActivity(activityId) || activeMenuRoot;
  isNavigationBrowseMode = false;
  ensureCurrentDifficultyForActivity(getSelectedActivity());
  session.setActivity(getSelectedActivity());
  session.setCompletedIds(getActivityProgress(selectedActivityId, getEffectiveDifficulty(session.currentActivity)));
  selectedOverviewActivityId = selectedActivityId;
  activePreviewActivityId = null;
  runner.updateActivity(session.activity);
  runner.setDifficulty(getEffectiveDifficulty(session.currentActivity));
  runner.setCompletedTargets(session.completedIds);
  renderAnswerBank();
  updateProgress();
  updateDifficultyControls();
  clearFeedback();
  renderOverviewLibrary();
  enterStudy();
}

function selectActivity(activityId) {
  openActivity(activityId);
}

function enterStudy() {
  document.body.classList.remove("browse-mode");
  document.body.classList.remove("overview-mode");
  document.body.classList.add("study-mode");
  const node = getHierarchyNode(activeHierarchyNodeId);
  title.textContent = node ? getHierarchyBreadcrumb(node.id, { activityLabel: node.activityLabel }) : session.currentActivity.title;
  instruction.textContent = node?.id === "world"
    ? "Place a label, or click a continent with no label selected to explore."
    : `Select a ${session.currentActivity.targetNoun} label, then click its target on the map.`;
  updateStudyCardDetails();
  updateDifficultyControls();
  studyCard.hidden = false;
  runner.enterStudyView();
  renderActivityNavControls(session.currentActivity.id);
  updateTopBarNavigation();
}

function showLaunchScreen() {
  openHome();
}

function openLegacyActivity(activityId) {
  const nextUrl = new URL("legacy-svg-app.html", window.location.href);

  if (activityId) {
    nextUrl.searchParams.set("activity", activityId);
  }

  window.location.href = nextUrl.toString();
}

function handleTargetClick(targetIds) {
  const selectedFeature = session.getFeature(session.selectedId);
  const resolvedTargetIds = targetIds && !Array.isArray(targetIds) && typeof targetIds.x === "number"
    ? runner.getTargetIdsAtMapPoint(targetIds, selectedFeature)
    : targetIds;

  // With no answer chip selected, map clicks are navigation gestures. The app
  // resolves the clicked map feature through the hierarchy and never treats it
  // as a quiz placement attempt.
  if (!session.selectedId) {
    const navigationCandidates = targetIds && !Array.isArray(targetIds) && typeof targetIds.x === "number"
      ? runner.getNavigationCandidatesAtMapPoint(targetIds)
      : getNavigationCandidatesFromTargetIds(resolvedTargetIds);

    const navigationScopeNode = getNavigationScopeNode();
    const scopeHasAvailableChildren = getHierarchyChildren(navigationScopeNode).some((child) => !child.disabled);

    if (!tryDrillFromMapTargets(navigationCandidates) && !scopeHasAvailableChildren && (isNavigationBrowseMode || hasMapNavigationFeatureCandidate(navigationCandidates))) {
      showFeedback("No activities here yet.");
    }

    return;
  }

  // Once a chip is selected, map clicks are placement attempts only. Navigation
  // is intentionally bypassed so a selected answer cannot be lost by browsing.
  placeGrabbedAnswer(resolvedTargetIds, {
    keepGrabbedOnIncorrect: true
  });
}

function getNavigationCandidatesFromTargetIds(targetIds) {
  const candidateIds = Array.isArray(targetIds)
    ? targetIds
    : [targetIds].filter(Boolean);

  return candidateIds.map((targetId) => ({
    kind: "target",
    targetId
  }));
}

function hasMapNavigationFeatureCandidate(candidates) {
  return candidates.some((candidate) => ["overview", "world-country", "us-state"].includes(candidate?.kind));
}

function tryDrillFromMapTargets(targetIds) {
  const candidates = Array.isArray(targetIds)
    ? targetIds
    : getNavigationCandidatesFromTargetIds(targetIds);
  const navigationScopeNode = getNavigationScopeNode();
  const nextNodeId = candidates
    .map((candidate) => getNavigationNodeIdForCandidate(candidate, navigationScopeNode))
    .find((targetNodeId) => targetNodeId && targetNodeId !== activeHierarchyNodeId && getHierarchyNode(targetNodeId));

  if (!nextNodeId) {
    return false;
  }

  closeBrowseDrawer();
  navigateToNode(nextNodeId);
  return true;
}

function getNavigationScopeNode() {
  const currentNode = getHierarchyNode(activeHierarchyNodeId);
  const currentChildren = getHierarchyChildren(currentNode).filter((child) => !child.disabled);

  if (currentChildren.length > 0) {
    return currentNode;
  }

  return getHierarchyNode(currentNode?.parent) || currentNode;
}

function getNavigationNodeIdForCandidate(candidate, scopeNode = getNavigationScopeNode()) {
  const targetId = typeof candidate === "string" ? candidate : candidate?.targetId;
  const directChildNodeId = getDirectNavigationChildNodeId(scopeNode, targetId);

  if (directChildNodeId) {
    return directChildNodeId;
  }

  const aliasedNodeId = getHierarchyNodeIdForNavigationAliasCandidate(candidate, scopeNode);

  if (aliasedNodeId) {
    return aliasedNodeId;
  }

  const activityNodeId = getHierarchyNodeIdForActivityTargetCandidate(candidate, scopeNode);

  if (activityNodeId) {
    return activityNodeId;
  }

  const clickedBranchNodeId = getContinentNodeIdForCandidate(candidate);
  const currentBranchNodeId = getTopLevelHierarchyNodeId(activeHierarchyNodeId);

  if (clickedBranchNodeId && clickedBranchNodeId !== currentBranchNodeId) {
    return clickedBranchNodeId;
  }

  return null;
}

function getDirectNavigationChildNodeId(scopeNode, targetId) {
  if (!scopeNode || !targetId) {
    return null;
  }

  const directChildNodeId = scopeNode.childTargetIds?.[targetId] || null;

  if (getHierarchyNode(directChildNodeId)) {
    return directChildNodeId;
  }

  const targetNode = getHierarchyNode(targetId);

  if (!targetNode) {
    return null;
  }

  return getImmediateChildForDescendant(scopeNode.id, targetNode.id);
}

function getImmediateChildForDescendant(ancestorNodeId, descendantNodeId) {
  const path = getHierarchyPath(descendantNodeId);
  const ancestorIndex = path.findIndex((node) => node.id === ancestorNodeId);

  if (ancestorIndex < 0 || ancestorIndex >= path.length - 1) {
    return null;
  }

  const childNodeId = path[ancestorIndex + 1]?.id || null;

  return getHierarchyNode(childNodeId)?.disabled ? null : childNodeId;
}

function getHierarchyNodeIdForNavigationAliasCandidate(candidate, scopeNode) {
  if (!candidate) {
    return null;
  }

  const candidateIds = [
    candidate.targetId,
    candidate.sourceTargetId,
    candidate.stateId
  ].filter(Boolean).map(normalizeNavigationText);
  const candidateIsoCodes = [
    candidate.isoA3
  ].filter(Boolean).map((value) => String(value).toUpperCase());
  const candidateNames = (candidate.names || []).map(normalizeNavigationText);
  const searchNodes = getHierarchyChildren(scopeNode).filter((child) => !child.disabled);

  return searchNodes.find((node) => isNavigationAliasMatch(node, candidateIds, candidateIsoCodes, candidateNames))?.id || null;
}

function getHierarchyDescendants(node) {
  if (!node) {
    return [];
  }

  return getHierarchyChildren(node).flatMap((child) => [
    child,
    ...getHierarchyDescendants(child)
  ]);
}

function isNavigationAliasMatch(node, candidateIds, candidateIsoCodes, candidateNames) {
  const aliases = node?.navigationAliases;

  if (!aliases) {
    return false;
  }

  const aliasIds = (aliases.ids || []).map(normalizeNavigationText);
  const aliasIsoCodes = (aliases.isoA3 || []).map((value) => String(value).toUpperCase());
  const aliasNames = (aliases.names || []).map(normalizeNavigationText);

  return aliasIds.some((alias) => candidateIds.includes(alias))
    || aliasIsoCodes.some((alias) => candidateIsoCodes.includes(alias))
    || aliasNames.some((alias) => candidateNames.includes(alias));
}

function getHierarchyNodeIdForActivityTargetCandidate(candidate, scopeNode) {
  if (!candidate) {
    return null;
  }

  const candidateIds = [
    candidate.targetId,
    candidate.sourceTargetId,
    candidate.stateId,
    candidate.isoA3
  ].filter(Boolean).map((value) => String(value).toLowerCase());
  const candidateNames = (candidate.names || []).map(normalizeNavigationText);

  return activities
    .filter((activity) => activity.targets?.some((target) => isTargetNavigationMatch(target, candidateIds, candidateNames)))
    .map((activity) => findHierarchyNodeForActivity(activity.id))
    .map((nodeId) => getImmediateChildForDescendant(scopeNode?.id, nodeId))
    .find((nodeId) => getHierarchyNode(nodeId)) || null;
}

function isTargetNavigationMatch(target, candidateIds, candidateNames) {
  const targetIds = [
    target.id,
    target.sourceFeatureId,
    target.isoA3,
    target.iso,
    target.countryCode,
    target.adminName
  ].filter(Boolean).map((value) => String(value).toLowerCase());

  if (targetIds.some((targetId) => candidateIds.includes(targetId))) {
    return true;
  }

  return candidateNames.includes(normalizeNavigationText(target.name));
}

function getContinentNodeIdForCandidate(candidate) {
  const continentName = candidate?.continent;

  if (!continentName) {
    return null;
  }

  const normalizedContinent = normalizeNavigationText(continentName);
  const worldNode = getHierarchyNode("world");

  return getHierarchyChildren(worldNode)
    .find((child) => {
      const normalizedLabel = normalizeNavigationText(child.label);
      return child.id === normalizedContinent
        || normalizedLabel === normalizedContinent
        || normalizedLabel.split(" ").includes(normalizedContinent);
    })?.id || worldNode?.childTargetIds?.[normalizedContinent] || null;
}

function getTopLevelHierarchyNodeId(nodeId) {
  return getHierarchyPath(nodeId)[1]?.id || nodeId;
}

function getNearestCommonAncestor(currentNodeId, targetNodeId) {
  const currentPath = getHierarchyPath(currentNodeId);
  const targetPath = getHierarchyPath(targetNodeId);
  let ancestor = null;

  for (let index = 0; index < Math.min(currentPath.length, targetPath.length); index += 1) {
    if (currentPath[index].id !== targetPath[index].id) {
      break;
    }

    ancestor = currentPath[index];
  }

  return ancestor;
}

function navigateToNode(nodeId) {
  const commonAncestor = getNearestCommonAncestor(activeHierarchyNodeId, nodeId);

  if (!commonAncestor) {
    return;
  }

  drillToHierarchyNode(nodeId);
}

function normalizeNavigationText(value = "") {
  return String(value)
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function placeGrabbedAnswer(targetIds, options = {}) {
  const targetId = choosePlacementTarget(targetIds);
  const result = session.tryAnswer(targetId);

  if (result.status === "no-selection") {
    showFeedback("Select a label first.");
    return;
  }

  if (result.status === "incorrect") {
    showFeedback("Try again");
    if (!options.keepGrabbedOnIncorrect) {
      cancelGrabbedAnswer();
    }
    ensureActivityNavControls();
    return;
  }

  if (result.status === "correct") {
    runner.setCompletedTargets(session.completedIds);
    saveCurrentActivityProgress();
    cancelGrabbedAnswer({ clearSelection: false });
    renderAnswerBank();
    updateProgress();
    updateCompletedActivityState();
    ensureActivityNavControls();
    showFeedback(`Correct: ${result.feature.name}`, true);
  }
}

function choosePlacementTarget(targetIds) {
  const candidateIds = Array.isArray(targetIds)
    ? targetIds
    : [targetIds].filter(Boolean);

  if (session.selectedId && candidateIds.includes(session.selectedId)) {
    return session.selectedId;
  }

  return candidateIds[0] || null;
}

function resetActivity() {
  cancelGrabbedAnswer();
  session.reset();
  setActivityProgress(session.currentActivity.id, [], getEffectiveDifficulty(session.currentActivity));
  setActivityCompletedState(session.currentActivity.id, false);
  clearFeedback();
  runner.setCompletedTargets(session.completedIds);
  runner.setDifficulty(getEffectiveDifficulty(session.currentActivity));
  renderAnswerBank();
  updateProgress();
  ensureActivityNavControls();
}

function syncAnswerBank() {
  answerBank.querySelectorAll(".label-chip[data-id]").forEach((chip) => {
    const id = chip.dataset.id;
    const isSelected = session.selectedId === id;
    const isCompleted = session.isCompleted(id);

    chip.classList.toggle("selected", isSelected);
    chip.classList.toggle("used", isCompleted);
    chip.disabled = isCompleted;
    chip.setAttribute("aria-pressed", String(isSelected));
  });
}

function handleChipPointerDown(event, feature) {
  event.preventDefault();
  event.stopPropagation();

  if (grabbedAnswerId === feature.id) {
    cancelGrabbedAnswer();
    return;
  }

  beginGrabbedAnswer(feature.id, event.clientX, event.clientY, event.pointerId);
  event.currentTarget.setPointerCapture?.(event.pointerId);
}

function beginGrabbedAnswer(id, clientX, clientY, pointerId = null) {
  if (session.selectedId !== id) {
    session.toggleAnswer(id);
  }

  grabbedAnswerId = id;
  grabbedPointerId = pointerId;
  grabbedStartPoint = { x: clientX, y: clientY };
  grabbedHasMoved = false;
  runner.setMapDragEnabled(false);
  showFloatingChip(id, clientX, clientY);
  syncAnswerBank();
}

function handleDocumentPointerMove(event) {
  if (!grabbedAnswerId) {
    return;
  }

  updateFloatingChipPosition(event.clientX, event.clientY);

  if (grabbedPointerId === event.pointerId && grabbedStartPoint) {
    const distance = Math.hypot(event.clientX - grabbedStartPoint.x, event.clientY - grabbedStartPoint.y);
    grabbedHasMoved = grabbedHasMoved || distance > 6;
  }
}

function handleDocumentPointerUp(event) {
  if (!grabbedAnswerId || grabbedPointerId !== event.pointerId) {
    return;
  }

  const shouldDrop = grabbedHasMoved;
  grabbedPointerId = null;
  grabbedStartPoint = null;
  grabbedHasMoved = false;

  if (!shouldDrop) {
    return;
  }

  const selectedFeature = session.getFeature(grabbedAnswerId);
  const targetIds = runner.getTargetIdsAtClientPoint(event.clientX, event.clientY, selectedFeature);
  placeGrabbedAnswer(targetIds, {
    keepGrabbedOnIncorrect: false
  });
}

function showFloatingChip(id, clientX, clientY) {
  const feature = session.getFeature(id);

  if (!floatingChip) {
    floatingChip = document.createElement("div");
    floatingChip.className = "floating-label-chip";
    document.body.appendChild(floatingChip);
  }

  floatingChip.textContent = feature?.name || "";
  floatingChip.hidden = false;
  updateFloatingChipPosition(clientX, clientY);
}

function updateFloatingChipPosition(clientX, clientY) {
  if (!floatingChip) {
    return;
  }

  floatingChip.style.transform = `translate(${clientX + 14}px, ${clientY + 14}px)`;
}

function cancelGrabbedAnswer(options = {}) {
  const shouldClearSelection = options.clearSelection !== false;

  grabbedAnswerId = null;
  grabbedPointerId = null;
  grabbedStartPoint = null;
  grabbedHasMoved = false;
  runner?.setMapDragEnabled(true);

  if (floatingChip) {
    floatingChip.hidden = true;
  }

  if (shouldClearSelection) {
    session?.clearSelection();
  }

  syncAnswerBank();
}

function updateProgress() {
  progress.textContent = session.progressText;
}

function loadActivityProgress() {
  try {
    const saved = JSON.parse(localStorage.getItem(activityProgressStorageKey) || "{}");

    if (!saved || typeof saved !== "object" || Array.isArray(saved)) {
      return {};
    }

    return Object.fromEntries(
      Object.entries(saved)
        .filter(([, ids]) => Array.isArray(ids))
        .map(([activityId, ids]) => [activityId, ids.filter((id) => typeof id === "string")])
    );
  } catch {
    return {};
  }
}

function saveActivityProgress() {
  try {
    localStorage.setItem(activityProgressStorageKey, JSON.stringify(activityProgress));
  } catch {
    // Ignore localStorage write failures and keep the session going.
  }
}

function loadDifficultyMode() {
  try {
    const saved = localStorage.getItem(difficultyStorageKey);
    return Object.values(difficultyModes).includes(saved) ? saved : difficultyModes.easy;
  } catch {
    return difficultyModes.easy;
  }
}

function saveDifficultyMode() {
  try {
    localStorage.setItem(difficultyStorageKey, currentDifficulty);
  } catch {
    // Ignore localStorage write failures and keep the session going.
  }
}

function loadCompletedActivityIds() {
  try {
    const saved = JSON.parse(localStorage.getItem(completedActivitiesStorageKey) || "[]");
    return new Set(Array.isArray(saved) ? saved : []);
  } catch {
    return new Set();
  }
}

function saveCompletedActivityIds() {
  try {
    localStorage.setItem(completedActivitiesStorageKey, JSON.stringify([...completedActivityIds]));
  } catch {
    // Ignore localStorage write failures and keep the session going.
  }
}

function setActivityCompletedState(activityId, isComplete) {
  if (!activityId) {
    return;
  }

  if (isComplete) {
    completedActivityIds.add(activityId);
  } else {
    completedActivityIds.delete(activityId);
  }

  saveCompletedActivityIds();
  renderOverviewLibrary();
}

function updateCompletedActivityState() {
  const targetCount = session?.currentActivity?.targets?.length || 0;

  if (targetCount <= 0) {
    return;
  }

  const isComplete = session.completedIds.size >= targetCount;
  setActivityCompletedState(session.currentActivity.id, isComplete);
}

function getCurrentActivitySequence(mapSet = activeMapSet) {
  const menuActivityIds = getAllMenuActivityIds();

  return activities
    .filter((activity) => activity.mapSet === mapSet)
    .sort((first, second) => {
      const firstMenuIndex = menuActivityIds.indexOf(first.id);
      const secondMenuIndex = menuActivityIds.indexOf(second.id);

      if (firstMenuIndex !== -1 || secondMenuIndex !== -1) {
        if (firstMenuIndex === -1) {
          return 1;
        }

        if (secondMenuIndex === -1) {
          return -1;
        }

        return firstMenuIndex - secondMenuIndex;
      }

      if (first.sortOrder !== second.sortOrder) {
        return first.sortOrder - second.sortOrder;
      }

      return first.title.localeCompare(second.title);
    });
}

function openPreviousActivity() {
  const activitySequence = getCurrentActivitySequence(session.currentActivity.mapSet || activeMapSet);
  const currentIndex = activitySequence.findIndex((activity) => activity.id === selectedActivityId);

  if (currentIndex <= 0) {
    showFeedback("No previous region.");
    updateActivityNavigationControls();
    return;
  }

  openActivity(activitySequence[currentIndex - 1].id);
}

function openNextIncompleteActivity() {
  const activitySequence = getCurrentActivitySequence(session.currentActivity.mapSet || activeMapSet);
  const currentIndex = activitySequence.findIndex((activity) => activity.id === selectedActivityId);

  if (activitySequence.length === 0) {
    showFeedback("All regions complete.");
    return;
  }

  for (let offset = 1; offset < activitySequence.length; offset += 1) {
    const nextIndex = (currentIndex + offset + activitySequence.length) % activitySequence.length;
    const nextActivity = activitySequence[nextIndex];

    if (!completedActivityIds.has(nextActivity.id)) {
      openActivity(nextActivity.id);
      return;
    }
  }

  showFeedback("All regions complete.");
}

function updateActivityNavigationControls() {
  if (!session?.currentActivity) {
    return;
  }

  const activitySequence = getCurrentActivitySequence(session.currentActivity.mapSet || activeMapSet);
  const currentIndex = activitySequence.findIndex((activity) => activity.id === selectedActivityId);

  if (previousActivityButton) {
    previousActivityButton.disabled = currentIndex <= 0;
  }

  if (nextIncompleteButton) {
    nextIncompleteButton.disabled = false;
  }
}

function ensureActivityNavControls() {
  if (!session?.currentActivity || !isStudyModeActive()) {
    return;
  }

  renderActivityNavControls(session.currentActivity.id);
}

function isActivityNavPresent() {
  if (!activityNavControls) {
    return false;
  }

  const visibleNavGroups = [...document.querySelectorAll("#activity-nav-controls")]
    .filter((navGroup) => {
      const styles = window.getComputedStyle(navGroup);
      const rect = navGroup.getBoundingClientRect();

      return !navGroup.hidden
        && styles.display !== "none"
        && styles.visibility !== "hidden"
        && styles.opacity !== "0"
        && rect.width > 0
        && rect.height > 0;
    });

  return visibleNavGroups.length === 1;
}

function isStudyModeActive() {
  return document.body.classList.contains("study-mode");
}

function renderActivityNavControls(activityId) {
  if (activityNavControls) {
    activityNavControls.hidden = !activityId;
    activityNavControls.style.display = activityId ? "flex" : "none";
    activityNavControls.style.visibility = activityId ? "visible" : "hidden";
    activityNavControls.style.opacity = activityId ? "1" : "0";
  }

  updateActivityNavigationControls();
}

function updateTopBarNavigation() {
  const isHome = activeHierarchyNodeId === "world";

  if (backButton) {
    backButton.hidden = isHome;
  }

  if (homeButton) {
    homeButton.disabled = isHome && !isStudyModeActive();
    homeButton.setAttribute("aria-current", isHome ? "page" : "false");
  }
}

function updateStudyModeButtons() {
  studyModeButtons.forEach((button) => {
    const isActive = button.dataset.studyMode === session.studyMode;
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });
}

function updateDifficultyControls() {
  if (!difficultyToggle) {
    return;
  }

  const isApplicable = isStudyModeActive() && isDifficultyApplicable(session?.currentActivity);
  difficultyToggle.hidden = !isApplicable;

  if (difficultyControlGroup) {
    difficultyControlGroup.hidden = !isApplicable;
  }

  difficultyButtons.forEach((button) => {
    const isAvailable = getAvailableDifficulties(session?.currentActivity).includes(button.dataset.difficulty);
    const isActive = button.dataset.difficulty === getEffectiveDifficulty(session?.currentActivity);
    button.hidden = isApplicable && !isAvailable;
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
    button.disabled = isApplicable && !isAvailable;
  });
}

function updateStudyCardDetails() {
  studyCard.querySelector("strong").textContent = session.currentActivity.title;
  const difficultyLabel = isDifficultyApplicable(session.currentActivity)
    ? ` - ${getEffectiveDifficulty(session.currentActivity)[0].toUpperCase()}${getEffectiveDifficulty(session.currentActivity).slice(1)}`
    : "";
  studyCard.querySelector("span").textContent = `${session.studyMode === studyModes.cumulative
    ? "Cumulative review"
    : "Current section only"}${difficultyLabel}`;
}

function getSelectedActivity() {
  return activities.find((activity) => activity.id === selectedActivityId) || activities[0];
}

function showFeedback(message, isSuccess = false) {
  clearTimeout(feedbackTimer);
  feedback.textContent = message;
  feedback.classList.toggle("success", isSuccess);

  feedbackTimer = window.setTimeout(() => {
    feedback.textContent = "";
    feedback.classList.remove("success");
  }, 1400);
}

function clearFeedback() {
  clearTimeout(feedbackTimer);
  feedback.textContent = "";
  feedback.classList.remove("success");
}

init().catch((error) => {
  title.textContent = "Geography Memory could not load";
  instruction.textContent = error.message;
});
