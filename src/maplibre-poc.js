import { normalizeActivity } from "./map-engines/activity-normalizer.js";
import { ActivitySession, studyModes } from "./maplibre/activity-session.js";
import { MapLibreActivityRunner } from "./maplibre/maplibre-activity-runner.js";

const activityDataPaths = [
  "assets/maps/data/western-european-countries.json",
  "assets/maps/data/european-cities.json",
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
  "assets/maps/data/southeastern-asia.json",
  "assets/maps/data/oceania.json",
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
const defaultActivityId = "us-states-capitals-10";
const defaultMapSet = "world-europe";
const completedActivitiesStorageKey = "geography-memory-completed-activities";
const mapSetOrder = ["us", "world-europe"];
const categoryOrder = [
  "States & Capitals",
  "Countries",
  "Cities",
  "Rivers",
  "Mountains",
  "Waters",
  "Physical Features",
  "Review"
];
const mapSetLabels = {
  us: "United States",
  "world-europe": "World / Europe"
};
const mapSetOverviewViews = {
  us: {
    center: [-101, 37],
    zoom: 2.55
  },
  "world-europe": {
    center: [-18, 18],
    zoom: 1.25
  }
};
const activityCatalogMetadata = {
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
  "southeastern-asia": {
    mapSet: "world-europe",
    category: "Countries",
    description: "East and western Pacific country/territory proof sheet.",
    sortOrder: 78,
    sectionNumber: 19
  },
  "oceania": {
    mapSet: "world-europe",
    category: "Countries",
    description: "Oceania country-only subset from the mixed proof sheet.",
    sortOrder: 79,
    sectionNumber: 22
  }
};
const supplementalOverviewEntries = [
  {
    id: "continents-oceans-legacy",
    title: "Continents / Oceans",
    mapSet: "world-europe",
    category: "Physical Features",
    sectionNumber: null,
    itemCount: null,
    baseMap: "world-map",
    previewBounds: [[-180, -60], [180, 82]],
    previewRegionId: "continents-oceans-legacy",
    description: "Open the legacy world outline activity for continents and oceans.",
    sortOrder: 90,
    launch: {
      type: "legacy",
      activityId: "world-map"
    }
  }
];
const usSectionDescriptions = {
  1: "First New England section.",
  2: "Second New England review section.",
  3: "Mid-Atlantic states and capitals.",
  4: "Southeast Atlantic states and capitals.",
  5: "Great Lakes states and capitals.",
  6: "Midwest states and capitals.",
  7: "Northern Plains states and capitals.",
  8: "Southwest states and capitals.",
  9: "Pacific coast plus Hawaii.",
  10: "Northwest plus Alaska cumulative capstone."
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
let activePreviewActivityId = null;
let selectedOverviewActivityId = null;
let grabbedAnswerId = null;
let grabbedPointerId = null;
let grabbedStartPoint = null;
let grabbedHasMoved = false;
let floatingChip = null;
let completedActivityIds = loadCompletedActivityIds();

const title = document.querySelector("#poc-title");
const instruction = document.querySelector("#poc-instruction");
const answerBank = document.querySelector("#answer-bank");
const progress = document.querySelector("#progress");
const feedback = document.querySelector("#feedback");
const resetButton = document.querySelector("#reset-button");
const homeButton = document.querySelector("#home-button");
const previousActivityButton = document.querySelector("#previous-activity-button");
const nextIncompleteButton = document.querySelector("#next-incomplete-button");
const activityNavControls = document.querySelector("#activity-nav-controls");
const fitMapButton = document.querySelector("#fit-map-button");
const zoomSlider = document.querySelector("#zoom-slider");
const studyCard = document.querySelector("#study-card");
const headerMapSetTabs = document.querySelector("#header-map-set-tabs");
const activityGroups = document.querySelector("#activity-groups");
const activityCount = document.querySelector("#activity-count");
const studyModeButtons = document.querySelectorAll("[data-study-mode]");

async function init() {
  const [loadedActivities, worldCountries, supplementalWorldCountries, usStatesAtlas, stateTargets] = await Promise.all([
    Promise.all(activityDataPaths.map((path) => fetchJson(path))),
    fetchJson(worldCountriesPath),
    Promise.all(worldCountrySupplements.map((path) => fetchJson(path))),
    fetchJson(usStatesAtlasPath),
    fetchJson(stateGeoJsonPath)
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
      selectActivity(activityId);
    }
  });
  runner.onTargetClick(handleTargetClick);

  await runner.load({
    activity: session.activity,
    worldCountries: mergedWorldCountries,
    usStatesAtlas,
    stateTargets
  });

  renderAnswerBank();
  updateProgress();
  updateStudyModeButtons();
  studyCard.hidden = true;
  runner.setOverviewMapSet(activeMapSet, mapSetOverviewViews[activeMapSet]);
  renderOverviewLibrary();
  updateOverviewPreview();
  bindUiEvents();
  bindZoomControls();
  updateActivityNavigationControls();
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
    "southeastern-asia": "southeastern-asia",
    "oceania": "oceania"
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
    "western-europe": {
      regionView: { center: [-2, 48], zoom: 3.4 },
      studyView: {
        bounds: [[-12.8, 35.1], [8.8, 59.4]],
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
    "southeastern-asia": {
      regionView: { center: [131, 24], zoom: 2.75 },
      studyView: {
        bounds: [[118.0, 7.0], [147.2, 45.5]],
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
    const button = event.target.closest("[data-map-set]");

    if (!button) {
      return;
    }

    setActiveMapSet(button.dataset.mapSet);
  });

  activityGroups.addEventListener("click", (event) => {
    const card = event.target.closest("[data-activity-id]");

    if (!card) {
      return;
    }

    if (card.dataset.launchType === "legacy") {
      openLegacyActivity(card.dataset.legacyActivityId);
      return;
    }

    selectActivity(card.dataset.activityId);
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
      session.setStudyMode(button.dataset.studyMode);
      runner.updateActivity(session.activity);
      renderAnswerBank();
      updateProgress();
      updateStudyModeButtons();
      updateStudyCardDetails();
      clearFeedback();
    });
  });

  homeButton?.addEventListener("click", showLaunchScreen);
  previousActivityButton?.addEventListener("click", openPreviousActivity);
  nextIncompleteButton?.addEventListener("click", openNextIncompleteActivity);
  resetButton.addEventListener("click", resetActivity);
  document.addEventListener("pointermove", handleDocumentPointerMove);
  document.addEventListener("pointerup", handleDocumentPointerUp);
  document.addEventListener("pointercancel", cancelGrabbedAnswer);
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      cancelGrabbedAnswer();
    }
  });
}

function renderOverviewLibrary() {
  renderMapSetTabs();
  renderActivityGroups();
  renderActivityNavControls(null);
}

function renderMapSetTabs() {
  headerMapSetTabs.innerHTML = "";

  mapSetOrder.forEach((mapSet) => {
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.mapSet = mapSet;
    button.className = "header-map-set-tab";
    button.setAttribute("role", "tab");
    button.setAttribute("aria-selected", String(activeMapSet === mapSet));
    button.classList.toggle("active", activeMapSet === mapSet);
    button.textContent = mapSetLabels[mapSet];
    headerMapSetTabs.appendChild(button);
  });
}

function renderActivityGroups() {
  activityGroups.innerHTML = "";

  const activitiesForSet = getOverviewEntriesForMapSet(activeMapSet);
  updateActivityCount(activitiesForSet.length);

  if (activitiesForSet.length === 0) {
    activityGroups.innerHTML = "<p>No activities are available for this map set yet.</p>";
    return;
  }

  categoryOrder.forEach((category) => {
    const groupedActivities = activitiesForSet
      .filter((activity) => activity.category === category)
      .sort((first, second) => {
        if (first.sortOrder !== second.sortOrder) {
          return first.sortOrder - second.sortOrder;
        }

        return first.title.localeCompare(second.title);
      });

    if (groupedActivities.length === 0) {
      return;
    }

    const section = document.createElement("section");
    section.className = "activity-group";

    const heading = document.createElement("div");
    heading.className = "activity-group-heading";
    heading.innerHTML = `<h3>${category}</h3><span>${groupedActivities.length} activit${groupedActivities.length === 1 ? "y" : "ies"}</span>`;
    section.appendChild(heading);

    const grid = document.createElement("div");
    grid.className = "activity-card-grid";

    groupedActivities.forEach((activity) => {
      const card = document.createElement("button");
      card.type = "button";
      card.className = "activity-card";
      card.dataset.activityId = activity.id;
      card.dataset.launchType = activity.launch?.type || "activity";

      if (activity.launch?.activityId) {
        card.dataset.legacyActivityId = activity.launch.activityId;
      }

      card.classList.toggle("active", getCurrentOverviewPreviewId() === activity.id);
      const cardCountMarkup = Number.isFinite(activity.itemCount)
        ? `<span class="activity-card-count">${activity.itemCount} items</span>`
        : "";

      card.innerHTML = `
        <div class="activity-card-topline">
          <span class="activity-card-category">${activity.category}</span>
          ${cardCountMarkup}
        </div>
        <strong>${activity.title}</strong>
        <div class="activity-card-meta">
          <span>${activity.sectionNumber ? `Section ${activity.sectionNumber}` : "Proof sheet"}</span>
          <span>${mapSetLabels[activity.mapSet]}</span>
        </div>
        <p>${activity.description || "Regional geography activity."}</p>
      `;
      card.setAttribute("aria-pressed", String(getCurrentOverviewPreviewId() === activity.id));
      grid.appendChild(card);
    });

    section.appendChild(grid);
    activityGroups.appendChild(section);
  });
}

function getActivitiesForMapSet(mapSet) {
  return activities.filter((activity) => activity.mapSet === mapSet);
}

function getOverviewEntriesForMapSet(mapSet) {
  return [...getActivitiesForMapSet(mapSet), ...supplementalOverviewEntries.filter((entry) => entry.mapSet === mapSet)];
}

function getSortedOverviewEntries(mapSet, options = {}) {
  const { includeSupplemental = true } = options;
  const entries = includeSupplemental ? getOverviewEntriesForMapSet(mapSet) : getActivitiesForMapSet(mapSet);

  return [...entries].sort((first, second) => {
    const firstCategoryIndex = categoryOrder.indexOf(first.category);
    const secondCategoryIndex = categoryOrder.indexOf(second.category);

    if (firstCategoryIndex !== secondCategoryIndex) {
      return firstCategoryIndex - secondCategoryIndex;
    }

    if (first.sortOrder !== second.sortOrder) {
      return first.sortOrder - second.sortOrder;
    }

    return first.title.localeCompare(second.title);
  });
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
  runner?.setOverviewPreview(previewActivity);
}

function setActiveMapSet(mapSet) {
  if (!mapSetLabels[mapSet]) {
    return;
  }

  activeMapSet = mapSet;
  selectedOverviewActivityId = null;
  activePreviewActivityId = null;
  renderOverviewLibrary();
  updateOverviewPreview();
  runner?.setOverviewMapSet(mapSet, mapSetOverviewViews[mapSet]);
}

function bindZoomControls() {
  if (!zoomSlider || !fitMapButton) {
    return;
  }

  zoomSlider.addEventListener("input", () => {
    runner.setZoom(Number(zoomSlider.value));
  });
  fitMapButton.addEventListener("click", () => {
    runner.fitCurrentView();
  });
  runner.onZoomChange((zoom) => {
    zoomSlider.value = String(Math.max(Number(zoomSlider.min), Math.min(Number(zoomSlider.max), zoom)));
  });
}

function updateActivityCount(count) {
  if (!activityCount) {
    return;
  }

  activityCount.textContent = `Showing ${count} activit${count === 1 ? "y" : "ies"}`;
}

function renderAnswerBank() {
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

function openActivity(activityId) {
  cancelGrabbedAnswer();
  selectedActivityId = activityId;
  session.setActivity(getSelectedActivity());
  activeMapSet = session.currentActivity.mapSet || activeMapSet;
  selectedOverviewActivityId = selectedActivityId;
  activePreviewActivityId = null;
  runner.updateActivity(session.activity);
  renderAnswerBank();
  updateProgress();
  clearFeedback();
  renderOverviewLibrary();
  enterStudy();
}

function selectActivity(activityId) {
  openActivity(activityId);
}

function enterStudy() {
  document.body.classList.remove("overview-mode");
  document.body.classList.add("study-mode");
  title.textContent = session.currentActivity.title;
  instruction.textContent = `Select a ${session.currentActivity.targetNoun} label, then click its target on the map.`;
  updateStudyCardDetails();
  studyCard.hidden = false;
  runner.enterStudyView();
  renderActivityNavControls(session.currentActivity.id);
}

function showLaunchScreen() {
  cancelGrabbedAnswer();
  session.clearSelection();
  syncAnswerBank();
  activeMapSet = session.currentActivity.mapSet || activeMapSet;
  selectedOverviewActivityId = selectedActivityId;
  activePreviewActivityId = null;
  renderOverviewLibrary();
  document.body.classList.add("overview-mode");
  document.body.classList.remove("study-mode");
  title.textContent = "World View";
  instruction.textContent = "Choose a study region from the globe or the list below.";
  studyCard.hidden = true;
  runner.setOverviewMapSet(activeMapSet, mapSetOverviewViews[activeMapSet]);
  runner.enterOverview();
  updateOverviewPreview();
  renderActivityNavControls(null);
}

function openLegacyActivity(activityId) {
  const nextUrl = new URL("legacy-svg-app.html", window.location.href);

  if (activityId) {
    nextUrl.searchParams.set("activity", activityId);
  }

  window.location.href = nextUrl.toString();
}

function handleTargetClick(targetIds) {
  placeGrabbedAnswer(targetIds, {
    keepGrabbedOnIncorrect: true
  });
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
    return;
  }

  if (result.status === "correct") {
    runner.setCompletedTargets(session.completedIds);
    cancelGrabbedAnswer({ clearSelection: false });
    renderAnswerBank();
    updateProgress();
    updateCompletedActivityState();
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
  clearFeedback();
  runner.setCompletedTargets(session.completedIds);
  renderAnswerBank();
  updateProgress();
  updateActivityNavigationControls();
}

function syncAnswerBank() {
  answerBank.querySelectorAll(".label-chip").forEach((chip) => {
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

  const targetIds = runner.getTargetIdsAtClientPoint(event.clientX, event.clientY);
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
  return getSortedOverviewEntries(mapSet, { includeSupplemental: false });
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

function renderActivityNavControls(activityId) {
  if (activityNavControls) {
    activityNavControls.hidden = !activityId;
    activityNavControls.style.display = activityId ? "flex" : "none";
    activityNavControls.style.visibility = activityId ? "visible" : "hidden";
    activityNavControls.style.opacity = activityId ? "1" : "0";
  }

  if (activityId) {
    window.requestAnimationFrame(() => {
      const styles = activityNavControls ? window.getComputedStyle(activityNavControls) : null;
      const rect = activityNavControls?.getBoundingClientRect?.();
      console.log(`Activity nav visible for: ${activityId}`);
      console.log("Activity nav diagnostics", {
        activityId,
        hidden: activityNavControls?.hidden ?? null,
        display: styles?.display ?? null,
        visibility: styles?.visibility ?? null,
        opacity: styles?.opacity ?? null,
        rect: rect
          ? {
              x: rect.x,
              y: rect.y,
              width: rect.width,
              height: rect.height
            }
          : null
      });
    });
  }

  updateActivityNavigationControls();
}

function updateStudyModeButtons() {
  studyModeButtons.forEach((button) => {
    const isActive = button.dataset.studyMode === session.studyMode;
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });
}

function updateStudyCardDetails() {
  studyCard.querySelector("strong").textContent = session.currentActivity.title;
  studyCard.querySelector("span").textContent = session.studyMode === studyModes.cumulative
    ? "Cumulative review"
    : "Current section only";
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
  title.textContent = "MapLibre prototype could not load";
  instruction.textContent = error.message;
});
