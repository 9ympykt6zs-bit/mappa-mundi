import { journeyPresets } from "./journey-presets.js?v=20260621-us-rivers-menu-1";
import { readUnitedStatesAtlasProgress } from "./atlas/united-states-atlas-progress.js";
import { renderUnitedStatesAtlasOverview, renderUnitedStatesAtlasProfile } from "./atlas/united-states-atlas-ui.js";
import { trackEvent } from "./analytics.js?v=20260601-instruction-target-nouns";
import {
  clearActiveJourney,
  getJourneyProgress,
  loadProgress,
  markStepComplete,
  resetJourneyDifficulty,
  setActiveJourney
} from "./progress-store.js?v=20260601-instruction-target-nouns";
import {
  applyDailyTrailSessionResults,
  applyDailyTrailSessionStart,
  applyDailyTrailTeachingProgress,
  buildDailyTrailGoalItems,
  buildWorldCoreDailyTrailItems,
  DAILY_TRAIL_AFK_RESPONSE_MS,
  DAILY_TRAIL_CONFIG,
  DAILY_TRAIL_DEBUG_REASONS,
  dailyTrailGoals,
  dailyTrailStorageKey,
  DAILY_TRAIL_SLOW_CORRECT_MS,
  dailyTrailUsCapitalsGoalId,
  getDailyTrailGoal,
  getDailyTrailGoalOptions,
  getNextDailyTrailGoal,
  hasDailyTrailProgress,
  isDailyTrailCheckpointReviewPlan,
  loadDailyTrailState,
  planCompletedDailyTrailReviewSession,
  planDailyTrailDevSession,
  planDailyTrailSession,
  selectDailyTrailGoal,
  startNextDailyTrailGoal,
  shouldShowDailyTrailGoalChoice,
  syncCompletedDailyTrailGoals
} from "./daily-trail-planner.js?v=20260624-daily-trail-curriculum-progression-1";
import {
  applyUnitedStatesMemoryTrailSessionResults,
  applyUnitedStatesMemoryTrailSessionSnapshot,
  applyUnitedStatesMemoryTrailSessionStart,
  buildUnitedStatesMemoryTrailItems,
  createUnitedStatesMemoryTrailState,
  hasUnitedStatesMemoryTrailProgress,
  isUnitedStatesMemoryTrailItemUnseen,
  isUnitedStatesMemoryTrailWeakReviewItem,
  loadUnitedStatesMemoryTrailProgress,
  planUnitedStatesMemoryTrailSession,
  resetUnitedStatesMemoryTrailProgress as resetUnitedStatesMemoryTrailPersistedProgress,
  saveUnitedStatesMemoryTrailProgress,
  unitedStatesMemoryTrailJourneyId,
  unitedStatesMemoryTrailStorageKey,
  UNITED_STATES_MEMORY_TRAIL_SOURCE
} from "./united-states-memory-trail-planner.js?v=20260708-us-trail-capitals-phase2a-4";
import { resolveMemoryTrailNewTargetLimit } from "./memory-trail-new-target-limit.js?v=20260621-daily-trail-co-progression-2";

const APP_NAME = "Mappa Mundi";
const LANDING_PAGE_TITLE = "Mappa Mundi \u2013 Geography Game for Learning the World";
const dailyTrailCheckpointRuntimeFingerprint = "daily-trail-checkpoint-outline-20260622-3";
const dailyTrailPlannerModuleSpecifier = "./daily-trail-planner.js?v=20260624-daily-trail-curriculum-progression-1";
const mapLibreScriptUrl = "https://unpkg.com/maplibre-gl@5.18.0/dist/maplibre-gl.js";
const mapLibreStylesheetUrl = "https://unpkg.com/maplibre-gl@5.18.0/dist/maplibre-gl.css";
const difficultyModes = Object.freeze({
  easy: "easy",
  medium: "medium",
  hard: "hard"
});
const studyModes = Object.freeze({
  cumulative: "cumulative",
  sectionOnly: "sectionOnly"
});
const activityDataPaths = [
  "assets/maps/data/continents-oceans.json",
  "assets/maps/data/world-core-americas-countries.json?v=20260621-americas-learn-cameras-7",
  "assets/maps/data/world-core-europe-countries.json?v=20260622-europe-russia-learn-camera-1",
  "assets/maps/data/world-core-africa-countries.json?v=20260622-africa-algeria-learn-camera-6",
  "assets/maps/data/world-core-west-central-south-asia-countries.json?v=20260623-west-central-south-asia-bangladesh-learn-camera-9",
  "assets/maps/data/world-core-east-southeast-asia-oceania-countries.json?v=20260623-east-southeast-asia-oceania-regional-camera-9",
  "assets/maps/data/western-european-countries.json",
  "assets/maps/data/european-cities.json",
  "assets/maps/data/former-soviet-republics-review.json",
  "assets/maps/data/russia-central-federal-subjects.json",
  "assets/maps/data/russia-more-central-federal-subjects.json",
  "assets/maps/data/russia-northwest-federal-subjects.json",
  "assets/maps/data/russia-more-northwest-federal-subjects.json",
  "assets/maps/data/russia-southern-federal-subjects.json",
  "assets/maps/data/russia-north-caucasus-federal-subjects.json",
  "assets/maps/data/russia-volga-federal-subjects.json",
  "assets/maps/data/russia-more-volga-federal-subjects.json",
  "assets/maps/data/russia-ural-federal-subjects.json",
  "assets/maps/data/russia-siberia-federal-subjects.json",
  "assets/maps/data/russia-far-east-federal-subjects.json",
  "assets/maps/data/russia-more-far-east-federal-subjects.json",
  "assets/maps/data/world-cities-east-south-asia.json",
  "assets/maps/data/world-cities-europe-eastern-mediterranean.json",
  "assets/maps/data/world-cities-middle-east-north-africa.json",
  "assets/maps/data/world-cities-mesoamerica.json",
  "assets/maps/data/nordic-countries.json",
  "assets/maps/data/baltic-countries.json",
  "assets/maps/data/balkans-countries.json",
  "assets/maps/data/central-european-countries.json",
  "assets/maps/data/more-central-european-countries.json",
  "assets/maps/data/germany-north-east-political-divisions.json",
  "assets/maps/data/germany-south-west-political-divisions.json",
  "assets/maps/data/france-northern-eastern-regions-political-divisions.json",
  "assets/maps/data/france-southern-regions-political-divisions.json",
  "assets/maps/data/spain-northern-central-political-divisions.json",
  "assets/maps/data/spain-southern-eastern-political-divisions.json",
  "assets/maps/data/italy-northern-regions-political-divisions.json",
  "assets/maps/data/italy-central-southern-regions-political-divisions.json",
  "assets/maps/data/italy-islands-political-divisions.json",
  "assets/maps/data/united-kingdom-countries-political-divisions.json",
  "assets/maps/data/eastern-europe-countries.json",
  "assets/maps/data/southern-africa-countries.json",
  "assets/maps/data/more-southern-africa-countries.json",
  "assets/maps/data/north-africa-countries.json",
  "assets/maps/data/west-africa-countries.json",
  "assets/maps/data/more-west-africa-countries.json",
  "assets/maps/data/central-africa-countries.json",
  "assets/maps/data/east-africa-countries.json",
  "assets/maps/data/middle-east-countries.json",
  "assets/maps/data/central-america.json",
  "assets/maps/data/central-asia.json",
  "assets/maps/data/caucasus-countries.json",
  "assets/maps/data/south-america-west.json",
  "assets/maps/data/south-america-east.json",
  "assets/maps/data/brazil-north-political-divisions.json",
  "assets/maps/data/brazil-northeast-political-divisions.json",
  "assets/maps/data/brazil-central-west-political-divisions.json",
  "assets/maps/data/brazil-southeast-political-divisions.json",
  "assets/maps/data/brazil-south-political-divisions.json",
  "assets/maps/data/caribbean.json",
  "assets/maps/data/south-asia-countries.json",
  "assets/maps/data/india-north-political-divisions.json",
  "assets/maps/data/india-west-central-political-divisions.json",
  "assets/maps/data/india-east-political-divisions.json",
  "assets/maps/data/india-northeast-political-divisions.json",
  "assets/maps/data/india-south-political-divisions.json",
  "assets/maps/data/india-islands-political-divisions.json",
  "assets/maps/data/east-asia-countries.json",
  "assets/maps/data/japan-hokkaido-tohoku-political-divisions.json",
  "assets/maps/data/japan-kanto-political-divisions.json",
  "assets/maps/data/japan-chubu-political-divisions.json",
  "assets/maps/data/japan-kansai-political-divisions.json",
  "assets/maps/data/japan-chugoku-shikoku-political-divisions.json",
  "assets/maps/data/japan-kyushu-okinawa-political-divisions.json",
  "assets/maps/data/china-north-northeast-political-divisions.json",
  "assets/maps/data/china-east-political-divisions.json",
  "assets/maps/data/china-south-central-political-divisions.json",
  "assets/maps/data/china-southwest-political-divisions.json",
  "assets/maps/data/china-northwest-political-divisions.json",
  "assets/maps/data/mainland-southeast-asia-countries.json",
  "assets/maps/data/maritime-southeast-asia-countries.json",
  "assets/maps/data/oceania-pacific-countries.json",
  "assets/maps/data/australia-states-territories.json",
  "assets/maps/data/canada-atlantic-provinces.json",
  "assets/maps/data/canada-central-canada.json",
  "assets/maps/data/canada-prairie-provinces.json",
  "assets/maps/data/canada-western-northern.json",
  "assets/maps/data/mexico-northwest.json",
  "assets/maps/data/mexico-northeast.json",
  "assets/maps/data/mexico-west-bajio.json",
  "assets/maps/data/mexico-central.json",
  "assets/maps/data/mexico-south-gulf-yucatan.json",
  "assets/maps/data/mexico-states.json",
  "assets/maps/data/canada-provinces-territories.json",
  "assets/maps/data/us-states-capitals-01.json?v=20260621-us-states-01-camera-1",
  "assets/maps/data/us-states-capitals-02.json",
  "assets/maps/data/us-states-capitals-03.json?v=20260621-us-states-03-camera-1",
  "assets/maps/data/us-states-capitals-04.json",
  "assets/maps/data/us-states-capitals-05.json?v=20260621-us-states-05-camera-2",
  "assets/maps/data/us-states-capitals-06.json?v=20260621-us-states-06-camera-2",
  "assets/maps/data/us-states-capitals-07.json?v=20260621-us-states-07-camera-1",
  "assets/maps/data/us-states-capitals-08.json?v=20260621-us-states-08-camera-2",
  "assets/maps/data/us-states-capitals-09.json?v=20260621-us-states-09-camera-1",
  "assets/maps/data/us-states-capitals-10.json",
  "assets/maps/data/us-states-capitals-11.json?v=20260621-us-states-11-camera-5",
  "assets/maps/data/us-physical-lakes.json",
  "assets/maps/data/us-physical-rivers.json",
  "assets/maps/data/us-physical-eastern-mountains.json",
  "assets/maps/data/us-physical-midwestern-mountains.json",
  "assets/maps/data/us-physical-western-mountains.json",
  "assets/maps/data/us-physical-alaska-mountains.json",
  "assets/maps/data/north-america-physical-canadian-lakes.json",
  "assets/maps/data/africa-physical-african-lakes.json",
  "assets/maps/data/asia-physical-middle-east-waters.json",
  "assets/maps/data/asia-physical-eurasian-inland-waters.json"
];
const worldCountriesPath = "assets/maps/data/maplibre-world-countries.geojson";
// Natural Earth map-unit supplements fill territory paths that are absent from
// the app's simplified admin-0 country layer.
const worldCountrySupplements = [
  "assets/maps/world/french-guiana-map-unit.geojson",
  "assets/maps/world/guam-map-unit.geojson"
];
const oceanZonesPath = "assets/maps/data/ocean-zones.geojson";
const coContinentOverridesPath = "assets/data/co-continent-overrides.json";
const coContinentLandPath = "assets/maps/data/continents-oceans-land.geojson";
const inlandWatersPath = "assets/maps/data/inland-waters.geojson";
const coastalWaterMaskPath = "assets/maps/data/coastal-water-mask.geojson?v=20260623-coastal-water-mask-tiled-1";
const mountainRangesPath = "assets/data/physical-features/us-mountain-ranges.geojson?v=20260618-us-mountain-ranges";
const riverLinesPath = "assets/data/physical-features/proof-sheet-rivers.geojson?v=20260620-us-rivers-continuity-assembly-1";
const riverCartographicRepairsPath = "assets/data/physical-features/us-river-cartographic-repairs.json?v=20260621-cartographic-repairs-1";
const usStatesAtlasPath = "assets/maps/data/maplibre-us-states-atlas.geojson";
const stateGeoJsonPath = "assets/maps/data/maplibre-us-states-atlas.geojson";
const northAmericaAdmin1Path = "assets/maps/data/maplibre-north-america-admin1.geojson";
const australiaAdmin1Path = "assets/maps/data/maplibre-australia-admin1.geojson";
const chinaAdmin1Path = "assets/maps/data/maplibre-china-admin1.geojson";
const russiaAdmin1Path = "assets/maps/data/maplibre-russia-admin1.geojson";
const indiaAdmin1Path = "assets/maps/data/maplibre-india-admin1.geojson";
const brazilAdmin1Path = "assets/maps/data/maplibre-brazil-admin1.geojson";
const japanAdmin1Path = "assets/maps/data/maplibre-japan-admin1.geojson";
const germanyAdmin1Path = "assets/maps/data/maplibre-germany-admin1.geojson";
const franceAdmin1Path = "assets/maps/data/maplibre-france-admin1.geojson";
const spainAdmin1Path = "assets/maps/data/maplibre-spain-admin1.geojson";
const italyAdmin1Path = "assets/maps/data/maplibre-italy-admin1.geojson";
const unitedKingdomAdmin1Path = "assets/maps/data/maplibre-united-kingdom-admin1.geojson";
const continentsOceansActivityId = "continents-oceans";
const usMountainRangesActivityId = "us-mountain-ranges";
const usPhysicalRiversActivityId = "us-physical-rivers";
const defaultActivityId = continentsOceansActivityId;
const continentsOceansLearnFocusProfiles = Object.freeze({
  "north-america": { delayMs: 920, forceOnPromptStart: true },
  asia: { forceOnPromptStart: true },
  "atlantic-ocean": { forceOnPromptStart: true },
  "indian-ocean": { forceOnPromptStart: true },
  "southern-ocean": { forceOnPromptStart: true }
});
const continentsOceansMobileLearnCameraOverrides = Object.freeze({
  antarctica: Object.freeze({
    center: [59.55067, -85.05113],
    zoom: -1.2394,
    bearing: 0,
    pitch: 0,
    cameraContext: "c&o-learn-focus",
    source: "c&o-learn-target-focus"
  })
});
const continentsOceansNamePromptFocusProfiles = Object.freeze({
  africa: { forceOnPromptStart: true },
  asia: { forceOnPromptStart: true },
  australia: { forceOnPromptStart: true },
  oceania: { forceOnPromptStart: true },
  "arctic-ocean": { forceOnPromptStart: true },
  "pacific-ocean": { forceOnPromptStart: true },
  "southern-ocean": { forceOnPromptStart: true }
});
const defaultMenuRoot = "world";
const defaultMapSet = "world-europe";
const completedActivitiesStorageKey = "geography-memory-completed-activities";
const activityProgressStorageKey = "geography-memory-activity-progress";
const difficultyStorageKey = "geography-memory-difficulty-mode";
const appSettingsStorageKey = "atlasQuestSettings";
const legacyLayerSettingsStorageKey = "atlas-quest-layer-settings";
const onboardingSeenStorageKey = "atlasQuestOnboardingSeen";
const gameplayIntroSpeechSessionKey = "atlasQuestGameplayIntroSpokenThisSession";
const dailyTrailDevOverrideStorageKey = "mappaDailyTrailDevOverride";
const dailyTrailDevCheatCode = "dailytraildev";
const cameraDevOverridesStorageKey = "mappaCameraDevOverrides";
const cameraDevCheatCode = "cameradev";
const riverPreviewSourceId = "mappa-dev-river-preview-source";
const riverPreviewStateBorderLayerId = "mappa-dev-river-preview-state-borders";
const riverPreviewBaseLayerId = "mappa-dev-river-preview-base";
const riverPreviewTargetLayerId = "mappa-dev-river-preview-target";
const riverPreviewFallbackTargetId = "__no-river-preview-target__";
let riverPreviewActive = false;
let riverPreviewTarget = null;
let riverPreviewRepairSummary = [];
const feedbackFormUrl = "https://docs.google.com/forms/d/e/1FAIpQLSf3w51Tbeetre-iS4maV8X0UDRBhvueuuAreQFoGObCG3VFKA/viewform?usp=header";
const appShellScreenIds = new Set([
  "launch",
  "main-menu",
  "main-menu-more-ways",
  "learn-menu",
  "challenge-menu",
  "onboarding",
  "choose-journey",
  "journey-detail",
  "study",
  "choose-difficulty",
  "daily-trail-dev",
  "daily-trail-goal-choice",
  "daily-trail-intro",
  "daily-trail-summary",
  "united-states-trail-summary",
  "begin-journey-placeholder",
  "free-play-difficulty",
  "settings",
  "customize",
  "free-play",
  "journey-gameplay",
  "study-practice",
  "study-explore"
]);
const defaultMapLayerSettings = Object.freeze({
  showContinents: true,
  showOceans: true,
  showCountries: true,
  showStates: true,
  showProvinces: true,
  showTerritories: true,
  // Cities and capitals currently share the same point-marker rendering path.
  // Future layers can follow this shape: showRivers, showMountains, showLakes,
  // showBays, showTrails, showDeserts, showPhysicalFeatures.
  showCities: true,
  showCapitals: true
});
const mapLayerPresets = [
  {
    id: "default",
    label: "Default",
    description: "Balanced Mappa Mundi defaults.",
    settings: {
      ...defaultMapLayerSettings
    }
  },
  {
    id: "classical-memory",
    label: "Classical Memory Geography",
    description: "Supported targets for a proof-sheet-style geography sequence.",
    settings: {
      showContinents: true,
      showOceans: true,
      showCountries: true,
      showStates: true,
      showProvinces: true,
      showTerritories: true,
      showCities: false,
      showCapitals: false
    }
  }
];
const defaultAppSettings = Object.freeze({
  version: 1,
  mapLayers: defaultMapLayerSettings,
  targetSettings: {},
  audio: {
    speakMemoryTrailInstructions: true,
    speakMemoryTrailInstructionsUserSet: false
  }
});
const canadianTerritoryNames = new Set(["Northwest Territories", "Nunavut", "Yukon"]);
const classicalMemoryProofSheetTargetNames = new Set(`
Adirondack Mountains
Adriatic Sea
Aegean Sea
Afghanistan
Africa
Albania
Albany, NY
Alexandria
Allegheny Mountains
Alps
Ancient Ghana
Ancient Mali
Annapolis, MD
Antarctica
Antioch
Apennine Peninsula
Arabian Desert
Arabian Sea
Aral Sea
Arctic Ocean
Argentina
Arkansas River
Asia
Asia Minor
Athens
Atlanta, GA
Atlantic Ocean
Augusta, ME
Austin, TX
Australia
Austria
Aztec Civilization
Babylon
Baffin Bay
Baghdad
Balkan Peninsula
Baltic Sea
Barcelona
Barents Sea
Baton Rouge, LA
Bay of Bengal
Beijing
Belarus
Belgium
Belize
Bismarck, ND
Black Hills
Black Sea
Blue Ridge Mountains
Boise, ID
Bolivia
Boston, MA
Botswana
Brazil
Bulgaria
Cairo
California
California Trail
Cambodia
Canary Islands
Cape of Good Hope
Carpathians
Carson City, NV
Carthage
Cascade Mountains
Caspian Sea
Caucasus
Charleston, WV
Chesapeake and Ohio Canal
Chesapeake Bay
Cheyenne, WY
Chichen Itza
Chile
Colombia
Colorado Desert
Colorado River
Columbia River
Columbia, SC
Columbus, OH
Concord, NH
Congo River
Constantinople
Crete
Cuba
Cumberland Mountains
Cumberland Road
Cyprus
Czechia
Damascus
Danube River
Davis Strait
Dead Sea
Death Valley
Denali
Denmark
Denmark Strait
Denver, CO
Des Moines, IA
Dominican Republic
Dover, DE
Eastern Woodlands
Ecuador
Egypt
El Salvador
Elbe River
England
English Channel
Ephesus
Erie
Erie Canal
Estonia
Ethiopia
Euphrates River
Europe
Fez
Finland
France
Frankfort, KY
French Guiana
Ganges River
Gaul
Gaza Strip
Germania
Germany
Gila Trail
Grand Canyon
Great Barrier Reef
Great Basin
Great Bear Lake
Great Indian Desert
Great Salt Lake
Great Salt Lake Desert
Great Slave Lake
Great Smoky Mountains
Greece
Green Mountains
Greenland
Guam
Guatemala
Gulf of Mexico
Guyana
Haiti
Harrisburg, PA
Hartford, CT
Hattusa
Helena, MT
Himalayas
Hispania
Honduras
Honolulu, HI
Hudson Bay
Hungary
Huron
Iberian Peninsula
Iceland
India
Indian Ocean
Indianapolis, IN
Indonesia
Iran
Iraq
Ireland
Israel
Italy
Ivory Coast
Jackson, MS
Jamaica
Jefferson City, MO
Jordan River
Judah
Juneau, AK
Kazakhstan
Kiev
Kolkata
Kyoto
Kyrgyzstan
Labrador Sea
Lake Texcoco
Lake Victoria
Lansing, MI
Laos
Latvia
Lesotho
Lincoln, NE
Lithuania
Little Rock, AR
London
Luxembourg
Macedonia
Madagascar
Madison, WI
Mammoth Cave
Matterhorn
Maya Civilization
Mayapan
Mecca
Medina
Mediterranean Sea
Mesopotamia
Mexico City
Miami and Erie Canal
Michigan
Mississippi River
Mississippi River Delta
Missouri River
Mojave Desert
Mongolia
Montgomery, AL
Montpelier, VT
Mormon Trail
Moscow
Mozambique
Mt. Elbert
Mt. Fuji
Mt. Mitchell
Mt. Rainier
Mt. St. Helens
Mt. Whitney
Namibia
Nashville, TN
Netherlands
New Brunswick
New Zealand
Niagara Falls
Nicaragua
Niger River
Nile River
Nile River Delta
North America
North Korea
North Sea
North Vietnam
Northwest Coast
Norway
Nova Scotia
Oaxaca
Ohio and Erie Canal
Ohio River
Okefenokee Swamp
Oklahoma City, OK
Old Spanish Trail
Olmec Civilization
Olympia, WA
Olympic rainforests
Ontario
Orange River
Oregon Trail
Orleans
Ozark Highlands
Pacific Ocean
Painted Desert
Pakistan
Pamlico Sound
Papua New Guinea
Paraguay
Paris
Pennsylvania Canal
Persian Gulf
Peru
Philippines
Phoenicia
Phoenix, AZ
Pierre, SD
Pikes Peak
Plains
Plateau
Po River
Poland
Portugal
Providence, RI
Puerto Rico
Puget Sound
Pyrenees
Quebec
Raleigh, NC
Red River
Red Sea
Rhine River
Rhodes
Richmond, VA
Rio Grande River
Rocky Mountains
Romania
Rome
Russia
Sacramento, CA
Sahara Desert
Salem, OR
Salt Lake City, UT
San Andreas Fault
San Francisco Bay
Santa Fe Trail
Santa Fe, NM
Scandinavian Peninsula
Sea of Galilee
Sea of Japan
Seine River
Senegal River
Siberia
Sierra Nevadas
Sinai Peninsula
Slovakia
Slovenia
Sonoran Desert
South Africa
South America
South Korea
South Vietnam
Southern Ocean
Southwest
Spain
Springfield, IL
St. Lawrence River
St. Paul, MN
Strait of Magellan
Suez Canal
Sumer
Superior
Suriname
Sweden
Switzerland
Syria
Taiwan
Tajikistan
Tallahassee, FL
Tangier
Thailand
The Great Valley
Tigris River
Tokyo
Topeka, KS
Tours
Treaty of Tordesillas
Trenton, NJ
Turkey
Turkmenistan
Ukraine
Upper/Lower Egypt
Ural
Uruguay
Uzbekistan
Venezuela
Volga River
Washington, D.C.
Western Sahara
White Mountains
White Sea
Yangtze River
Yellow River
Yellow Sea
Yucatan Peninsula
Zambezi River
Zimbabwe
`.trim().split("\n").map(normalizeProofSheetTargetName));
const mapSetLabels = {
  us: "United States",
  "world-europe": "World"
};
const US_STATE_CAPITAL_SECTIONS = [
  { number: 1, id: "01", label: "New England" },
  { number: 2, id: "02", label: "Northeast / Mid-Atlantic" },
  { number: 3, id: "03", label: "Atlantic South" },
  { number: 4, id: "04", label: "Southeast / Gulf" },
  { number: 5, id: "05", label: "Great Lakes / Upper South" },
  { number: 6, id: "06", label: "Midwest / Mississippi Valley" },
  { number: 7, id: "07", label: "Northern Plains / Rockies" },
  { number: 8, id: "08", label: "Southern Plains / Southwest" },
  { number: 9, id: "09", label: "Southwest / Pacific" },
  { number: 10, id: "10", label: "Northwest" },
  { number: 11, id: "11", label: "Alaska and Hawaii" }
];
const US_STATE_CAPITAL_MENU_ITEMS = US_STATE_CAPITAL_SECTIONS.flatMap((section) => [
  { label: `${section.label} States`, activityId: `us-states-${section.id}` },
  { label: `${section.label} Capitals`, activityId: `us-capitals-${section.id}` }
]);
const US_STATE_CAPITAL_SECTION_VIEWS = {
  1: {
    regionView: { center: [-70.7, 43.6], zoom: 5.25 },
    studyView: {
      bounds: [[-74.2, 40.7], [-66.6, 47.7]],
      padding: { top: 58, right: 58, bottom: 96, left: 58 },
      duration: 1050
    }
  },
  2: {
    regionView: { center: [-75.2, 42.0], zoom: 4.55 },
    studyView: {
      bounds: [[-80.8, 38.5], [-71.5, 45.3]],
      padding: { top: 58, right: 58, bottom: 96, left: 58 },
      duration: 1050
    }
  },
  3: {
    regionView: { center: [-80.2, 36.4], zoom: 4.35 },
    studyView: {
      bounds: [[-86.0, 31.8], [-74.0, 39.8]],
      padding: { top: 58, right: 58, bottom: 96, left: 58 },
      duration: 1050
    }
  },
  4: {
    regionView: { center: [-85.4, 31.1], zoom: 4.65 },
    studyView: {
      bounds: [[-93.2, 24.1], [-79.0, 35.6]],
      padding: { top: 58, right: 58, bottom: 96, left: 58 },
      duration: 1050
    }
  },
  5: {
    regionView: { center: [-85.3, 41.3], zoom: 4.15 },
    studyView: {
      bounds: [[-91.0, 34.5], [-80.0, 48.8]],
      padding: { top: 58, right: 58, bottom: 96, left: 58 },
      duration: 1050
    }
  },
  6: {
    regionView: { center: [-91.4, 40.1], zoom: 4.1 },
    studyView: {
      bounds: [[-97.2, 33.0], [-86.3, 47.5]],
      padding: { top: 58, right: 58, bottom: 96, left: 58 },
      duration: 1050
    }
  },
  7: {
    regionView: { center: [-100.4, 44.4], zoom: 3.75 },
    studyView: {
      bounds: [[-111.4, 39.7], [-89.0, 49.6]],
      padding: { top: 58, right: 58, bottom: 96, left: 58 },
      duration: 1050
    }
  },
  8: {
    regionView: { center: [-101.4, 34.3], zoom: 3.85 },
    studyView: {
      bounds: [[-109.6, 25.4], [-93.0, 41.2]],
      padding: { top: 58, right: 58, bottom: 96, left: 58 },
      duration: 1050
    }
  },
  9: {
    regionView: { center: [-124.5, 32.0], zoom: 2.65 },
    studyView: {
      bounds: [[-160.8, 18.2], [-109.0, 43.2]],
      padding: { top: 58, right: 58, bottom: 96, left: 58 },
      duration: 1050
    }
  },
  10: {
    regionView: { center: [-136.5, 56.5], zoom: 2.2 },
    studyView: {
      bounds: [[-170.5, 42.0], [-103.8, 72.1]],
      padding: { top: 58, right: 58, bottom: 96, left: 58 },
      duration: 1050
    }
  }
};
const US_PHYSICAL_FEATURE_MENU_ITEMS = [
  { label: "U.S. Mountain Ranges", activityId: "us-mountain-ranges" },
  { label: "U.S. Lakes", activityId: "us-physical-lakes" },
  { label: "Bays", disabled: true, badge: "Coming soon" },
  { label: "Rivers East", disabled: true, badge: "Coming soon" },
  { label: "Rivers West", disabled: true, badge: "Coming soon" },
  { label: "Trails", disabled: true, badge: "Coming soon" },
  { label: "Canals", disabled: true, badge: "Coming soon" },
  { label: "Native American Regions", disabled: true, badge: "Coming soon" },
  { label: "Deserts", disabled: true, badge: "Coming soon" },
  { label: "Prominent Features", disabled: true, badge: "Coming soon" },
  { label: "More Prominent Features", disabled: true, badge: "Coming soon" }
];
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
          { label: "North Africa Countries", activityId: "north-africa-countries" },
          { label: "West Africa Countries", activityId: "west-africa-countries" },
          { label: "More West Africa Countries", activityId: "more-west-africa-countries" },
          { label: "Central Africa Countries", activityId: "central-africa-countries" },
          { label: "East Africa Countries", activityId: "east-africa-countries" },
          { label: "Southern Africa Countries", activityId: "southern-africa-countries" },
          { label: "More Southern Africa Countries", activityId: "more-southern-africa-countries" },
          { label: "African Lakes", activityId: "africa-physical-african-lakes" },
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
        label: "Nordic Countries",
        children: [
          { label: "Countries", activityId: "nordic-countries" }
        ]
      },
      {
        label: "Western Europe",
        children: [
          { label: "Countries", activityId: "western-european-countries" },
          { label: "Central European Countries", activityId: "central-european-countries" },
          { label: "More Central European Countries", activityId: "more-central-european-countries" },
          {
            label: "Germany: States / Länder",
            children: [
              { label: "North & East", activityId: "germany-north-east-political-divisions" },
              { label: "South & West", activityId: "germany-south-west-political-divisions" }
            ]
          },
          {
            label: "France: Regions",
            children: [
              { label: "Northern & Eastern Regions", activityId: "france-northern-eastern-regions-political-divisions" },
              { label: "Southern Regions", activityId: "france-southern-regions-political-divisions" },
              { label: "Overseas Regions", disabled: true, badge: "Coming soon" }
            ]
          },
          {
            label: "Spain: Autonomous Communities & Cities",
            children: [
              { label: "Northern & Central", activityId: "spain-northern-central-political-divisions" },
              { label: "Southern & Eastern", activityId: "spain-southern-eastern-political-divisions" }
            ]
          },
          {
            label: "Italy: Regions",
            children: [
              { label: "Northern Regions", activityId: "italy-northern-regions-political-divisions" },
              { label: "Central & Southern Regions", activityId: "italy-central-southern-regions-political-divisions" },
              { label: "Islands", activityId: "italy-islands-political-divisions" }
            ]
          },
          {
            label: "United Kingdom: Countries",
            children: [
              { label: "Countries", activityId: "united-kingdom-countries-political-divisions" }
            ]
          }
        ]
      },
      {
        label: "Baltic Countries",
        children: [
          { label: "Countries", activityId: "baltic-countries" }
        ]
      },
      {
        label: "Eastern Europe",
        children: [
          { label: "Eastern Europe Countries", activityId: "eastern-europe-countries" }
        ]
      },
      {
        label: "Balkans",
        children: [
          { label: "Western Balkans Countries", activityId: "balkans" }
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
          { label: "Middle East Countries", activityId: "middle-east-countries" },
          { label: "Middle East Waters", activityId: "asia-physical-middle-east-waters" },
          { label: "South Asia Countries", activityId: "south-asia-countries" },
          {
            label: "India: States & Union Territories",
            children: [
              { label: "North", activityId: "india-north-political-divisions" },
              { label: "West & Central", activityId: "india-west-central-political-divisions" },
              { label: "East", activityId: "india-east-political-divisions" },
              { label: "Northeast", activityId: "india-northeast-political-divisions" },
              { label: "South", activityId: "india-south-political-divisions" },
              { label: "Islands", activityId: "india-islands-political-divisions" }
            ]
          },
          { label: "Central Asia Countries", activityId: "central-asia" },
          { label: "Eurasian Inland Waters", activityId: "asia-physical-eurasian-inland-waters" },
          { label: "Caucasus Countries", activityId: "caucasus-countries" },
          { label: "East Asia Countries", activityId: "east-asia-countries" },
          {
            label: "Japan: Prefectures",
            children: [
              { label: "Hokkaido & Tohoku", activityId: "japan-hokkaido-tohoku-political-divisions" },
              { label: "Kanto", activityId: "japan-kanto-political-divisions" },
              { label: "Chubu", activityId: "japan-chubu-political-divisions" },
              { label: "Kansai", activityId: "japan-kansai-political-divisions" },
              { label: "Chugoku & Shikoku", activityId: "japan-chugoku-shikoku-political-divisions" },
              { label: "Kyushu & Okinawa", activityId: "japan-kyushu-okinawa-political-divisions" }
            ]
          },
          {
            label: "China: Provinces, Regions, Municipalities & SARs",
            children: [
              { label: "North & Northeast", activityId: "china-north-northeast-political-divisions" },
              { label: "East", activityId: "china-east-political-divisions" },
              { label: "South Central", activityId: "china-south-central-political-divisions" },
              { label: "Southwest", activityId: "china-southwest-political-divisions" },
              { label: "Northwest", activityId: "china-northwest-political-divisions" }
            ]
          },
          { label: "Mainland Southeast Asia Countries", activityId: "mainland-southeast-asia-countries" },
          { label: "Maritime Southeast Asia Countries", activityId: "maritime-southeast-asia-countries" },
          { label: "Cities", activityId: "world-cities-east-south-asia" }
        ]
      }
    ]
  },
  {
    id: "russia",
    label: "Russia",
    overviewView: { center: [82, 58], zoom: 1.5 },
    children: [
      {
        label: "Russia: Federal Subjects",
        children: [
          { label: "Central", activityId: "russia-central-federal-subjects" },
          { label: "More Central", activityId: "russia-more-central-federal-subjects" },
          { label: "Northwest", activityId: "russia-northwest-federal-subjects" },
          { label: "More Northwest", activityId: "russia-more-northwest-federal-subjects" },
          { label: "Southern", activityId: "russia-southern-federal-subjects" },
          { label: "North Caucasus", activityId: "russia-north-caucasus-federal-subjects" },
          { label: "Volga", activityId: "russia-volga-federal-subjects" },
          { label: "More Volga", activityId: "russia-more-volga-federal-subjects" },
          { label: "Ural", activityId: "russia-ural-federal-subjects" },
          { label: "Siberia", activityId: "russia-siberia-federal-subjects" },
          { label: "Far East", activityId: "russia-far-east-federal-subjects" },
          { label: "More Far East", activityId: "russia-more-far-east-federal-subjects" }
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
          { label: "Northwest", activityId: "mexico-northwest" },
          { label: "Northeast", activityId: "mexico-northeast" },
          { label: "West / Bajío", activityId: "mexico-west-bajio" },
          { label: "Central", activityId: "mexico-central" },
          { label: "South / Gulf / Yucatán", activityId: "mexico-south-gulf-yucatan" },
          { label: "All Mexico States Review", activityId: "mexico-states" }
        ]
      },
      {
        label: "Canada",
        children: [
          { label: "Atlantic Provinces", activityId: "canada-atlantic-provinces" },
          { label: "Central Canada", activityId: "canada-central-canada" },
          { label: "Prairie Provinces", activityId: "canada-prairie-provinces" },
          { label: "Western and Northern Canada", activityId: "canada-western-northern" },
          { label: "All Canada Provinces & Territories Review", activityId: "canada-provinces-territories" }
        ]
      },
      {
        label: "Physical Features",
        children: [
          { label: "Canadian Lakes", activityId: "north-america-physical-canadian-lakes" }
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
          {
            label: "Brazil: States & Federal District",
            children: [
              { label: "North", activityId: "brazil-north-political-divisions" },
              { label: "Northeast", activityId: "brazil-northeast-political-divisions" },
              { label: "Central-West", activityId: "brazil-central-west-political-divisions" },
              { label: "Southeast", activityId: "brazil-southeast-political-divisions" },
              { label: "South", activityId: "brazil-south-political-divisions" }
            ]
          },
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
          { label: "Oceania and Pacific Countries", activityId: "oceania-pacific-countries" },
          { label: "Australia States & Territories", activityId: "australia-states-territories" },
          { label: "Cities", disabled: true, badge: "Coming soon" }
        ]
      }
    ]
  },
  {
    id: "review",
    label: "Review",
    overviewView: { center: [48, 49], zoom: 1.75 },
    children: [
      {
        label: "Review / Themed Activities",
        children: [
          { label: "Former Soviet Republics Review", activityId: "former-soviet-republics-review" }
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
function buildUsPhysicalFeatureNavNodes(items, parentId = "us-physical-features", prefix = "us-physical") {
  const entries = [];

  items.forEach((item, index) => {
    const id = `${prefix}-${index + 1}`;
    const childIds = item.children?.map((_, childIndex) => `${id}-${childIndex + 1}`) || [];
    entries.push([
      id,
      {
        id,
        label: item.label,
        parent: parentId,
        activityId: item.activityId,
        activityLabel: item.activityId ? item.label : undefined,
        journeyId: item.journeyId,
        memoryTrailLaunch: item.memoryTrailLaunch === true,
        disabled: !item.activityId && childIds.length === 0,
        badge: item.activityId || childIds.length ? undefined : (item.badge || "Coming soon"),
        children: childIds.length ? childIds : undefined
      }
    ]);

    if (item.children?.length) {
      entries.push(...Object.entries(buildUsPhysicalFeatureNavNodes(item.children, id, id)));
    }
  });

  return Object.fromEntries(entries);
}
const US_PHYSICAL_FEATURE_NAV_NODES = buildUsPhysicalFeatureNavNodes(US_PHYSICAL_FEATURE_MENU_ITEMS);
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
      russia: "russia",
      australia: "oceania"
    },
    children: ["north-america", "south-america", "europe", "africa", "asia", "russia", "oceania"]
  },
  africa: {
    id: "africa",
    label: "Africa",
    parent: "world",
    menuRoot: "africa",
    view: { center: [20, 0], zoom: 2.1 },
    children: [
      "africa-north",
      "africa-west",
      "africa-more-west",
      "africa-central",
      "africa-east",
      "southern-africa",
      "more-southern-africa",
      "africa-physical-african-lakes",
      "africa-cities"
    ]
  },
  "africa-north": {
    id: "africa-north",
    label: "North Africa",
    parent: "africa",
    activityId: "north-africa-countries",
    activityLabel: "Countries"
  },
  "africa-west": {
    id: "africa-west",
    label: "West Africa",
    parent: "africa",
    activityId: "west-africa-countries",
    activityLabel: "Countries"
  },
  "africa-more-west": {
    id: "africa-more-west",
    label: "More West Africa",
    parent: "africa",
    activityId: "more-west-africa-countries",
    activityLabel: "Countries"
  },
  "africa-central": {
    id: "africa-central",
    label: "Central Africa",
    parent: "africa",
    activityId: "central-africa-countries",
    activityLabel: "Countries"
  },
  "africa-east": {
    id: "africa-east",
    label: "East Africa",
    parent: "africa",
    activityId: "east-africa-countries",
    activityLabel: "Countries"
  },
  "southern-africa": {
    id: "southern-africa",
    label: "Southern Africa",
    parent: "africa",
    activityId: "southern-africa-countries",
    activityLabel: "Countries"
  },
  "more-southern-africa": {
    id: "more-southern-africa",
    label: "More Southern Africa",
    parent: "africa",
    activityId: "more-southern-africa-countries",
    activityLabel: "Countries"
  },
  "africa-physical-african-lakes": {
    id: "africa-physical-african-lakes",
    label: "African Lakes",
    parent: "africa",
    activityId: "africa-physical-african-lakes",
    activityLabel: "Physical Features"
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
    children: ["europe-nordic", "europe-western", "europe-germany-political-divisions", "europe-france-political-divisions", "europe-spain-political-divisions", "europe-italy-political-divisions", "europe-united-kingdom-political-divisions", "europe-baltic", "europe-eastern", "europe-balkans", "europe-wide"]
  },
  "europe-nordic": {
    id: "europe-nordic",
    label: "Nordic Countries",
    parent: "europe",
    activityId: "nordic-countries",
    activityLabel: "Countries"
  },
  "europe-western": {
    id: "europe-western",
    label: "Western Europe",
    parent: "europe",
    activityId: "western-european-countries",
    activityLabel: "Countries"
  },
  "europe-germany-political-divisions": {
    id: "europe-germany-political-divisions",
    label: "Germany: States / Länder",
    parent: "europe",
    view: { center: [10.2, 51.1], zoom: 4.4 },
    children: [
      "germany-north-east-political-divisions",
      "germany-south-west-political-divisions"
    ]
  },
  "germany-north-east-political-divisions": {
    id: "germany-north-east-political-divisions",
    label: "North & East",
    parent: "europe-germany-political-divisions",
    activityId: "germany-north-east-political-divisions",
    activityLabel: "Political Divisions"
  },
  "germany-south-west-political-divisions": {
    id: "germany-south-west-political-divisions",
    label: "South & West",
    parent: "europe-germany-political-divisions",
    activityId: "germany-south-west-political-divisions",
    activityLabel: "Political Divisions"
  },
  "europe-france-political-divisions": {
    id: "europe-france-political-divisions",
    label: "France: Regions",
    parent: "europe",
    view: { center: [2.4, 46.8], zoom: 4.1 },
    children: [
      "france-northern-eastern-regions-political-divisions",
      "france-southern-regions-political-divisions"
    ]
  },
  "france-northern-eastern-regions-political-divisions": {
    id: "france-northern-eastern-regions-political-divisions",
    label: "Northern & Eastern Regions",
    parent: "europe-france-political-divisions",
    activityId: "france-northern-eastern-regions-political-divisions",
    activityLabel: "Political Divisions"
  },
  "france-southern-regions-political-divisions": {
    id: "france-southern-regions-political-divisions",
    label: "Southern Regions",
    parent: "europe-france-political-divisions",
    activityId: "france-southern-regions-political-divisions",
    activityLabel: "Political Divisions"
  },
  "europe-spain-political-divisions": {
    id: "europe-spain-political-divisions",
    label: "Spain: Autonomous Communities & Cities",
    parent: "europe",
    view: { center: [-3.7, 39.6], zoom: 4.2 },
    children: [
      "spain-northern-central-political-divisions",
      "spain-southern-eastern-political-divisions"
    ]
  },
  "spain-northern-central-political-divisions": {
    id: "spain-northern-central-political-divisions",
    label: "Northern & Central",
    parent: "europe-spain-political-divisions",
    activityId: "spain-northern-central-political-divisions",
    activityLabel: "Political Divisions"
  },
  "spain-southern-eastern-political-divisions": {
    id: "spain-southern-eastern-political-divisions",
    label: "Southern & Eastern",
    parent: "europe-spain-political-divisions",
    activityId: "spain-southern-eastern-political-divisions",
    activityLabel: "Political Divisions"
  },
  "europe-italy-political-divisions": {
    id: "europe-italy-political-divisions",
    label: "Italy: Regions",
    parent: "europe",
    view: { center: [12.5, 42.7], zoom: 4.25 },
    children: [
      "italy-northern-regions-political-divisions",
      "italy-central-southern-regions-political-divisions",
      "italy-islands-political-divisions"
    ]
  },
  "italy-northern-regions-political-divisions": {
    id: "italy-northern-regions-political-divisions",
    label: "Northern Regions",
    parent: "europe-italy-political-divisions",
    activityId: "italy-northern-regions-political-divisions",
    activityLabel: "Political Divisions"
  },
  "italy-central-southern-regions-political-divisions": {
    id: "italy-central-southern-regions-political-divisions",
    label: "Central & Southern Regions",
    parent: "europe-italy-political-divisions",
    activityId: "italy-central-southern-regions-political-divisions",
    activityLabel: "Political Divisions"
  },
  "italy-islands-political-divisions": {
    id: "italy-islands-political-divisions",
    label: "Islands",
    parent: "europe-italy-political-divisions",
    activityId: "italy-islands-political-divisions",
    activityLabel: "Political Divisions"
  },
  "europe-united-kingdom-political-divisions": {
    id: "europe-united-kingdom-political-divisions",
    label: "United Kingdom: Countries",
    parent: "europe",
    view: { center: [-3.2, 54.8], zoom: 4.0 },
    children: ["united-kingdom-countries-political-divisions"]
  },
  "united-kingdom-countries-political-divisions": {
    id: "united-kingdom-countries-political-divisions",
    label: "Countries",
    parent: "europe-united-kingdom-political-divisions",
    activityId: "united-kingdom-countries-political-divisions",
    activityLabel: "Political Divisions"
  },
  "europe-baltic": {
    id: "europe-baltic",
    label: "Baltic Countries",
    parent: "europe",
    activityId: "baltic-countries",
    activityLabel: "Countries"
  },
  "europe-eastern": {
    id: "europe-eastern",
    label: "Eastern Europe",
    parent: "europe",
    activityId: "eastern-europe-countries",
    activityLabel: "Countries"
  },
  "europe-balkans": {
    id: "europe-balkans",
    label: "Balkans",
    parent: "europe",
    activityId: "balkans",
    activityLabel: "Western Balkans Countries"
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
    children: ["asia-middle-east", "asia-physical-middle-east-waters", "asia-south", "asia-india-political-divisions", "asia-central", "asia-physical-eurasian-inland-waters", "asia-caucasus", "asia-east", "asia-japan-political-divisions", "asia-china-political-divisions", "asia-mainland-southeast", "asia-maritime-southeast", "asia-cities"]
  },
  "asia-middle-east": {
    id: "asia-middle-east",
    label: "Middle East",
    parent: "asia",
    activityId: "middle-east-countries",
    activityLabel: "Countries"
  },
  "asia-physical-middle-east-waters": {
    id: "asia-physical-middle-east-waters",
    label: "Middle East Waters",
    parent: "asia",
    activityId: "asia-physical-middle-east-waters",
    activityLabel: "Physical Features"
  },
  "asia-south": {
    id: "asia-south",
    label: "South Asia",
    parent: "asia",
    activityId: "south-asia-countries",
    activityLabel: "Countries"
  },
  "asia-india-political-divisions": {
    id: "asia-india-political-divisions",
    label: "India: States & Union Territories",
    parent: "asia",
    view: { center: [79, 22], zoom: 3.1 },
    children: [
      "india-north-political-divisions",
      "india-west-central-political-divisions",
      "india-east-political-divisions",
      "india-northeast-political-divisions",
      "india-south-political-divisions",
      "india-islands-political-divisions"
    ]
  },
  "india-north-political-divisions": {
    id: "india-north-political-divisions",
    label: "North",
    parent: "asia-india-political-divisions",
    activityId: "india-north-political-divisions",
    activityLabel: "Political Divisions"
  },
  "india-west-central-political-divisions": {
    id: "india-west-central-political-divisions",
    label: "West & Central",
    parent: "asia-india-political-divisions",
    activityId: "india-west-central-political-divisions",
    activityLabel: "Political Divisions"
  },
  "india-east-political-divisions": {
    id: "india-east-political-divisions",
    label: "East",
    parent: "asia-india-political-divisions",
    activityId: "india-east-political-divisions",
    activityLabel: "Political Divisions"
  },
  "india-northeast-political-divisions": {
    id: "india-northeast-political-divisions",
    label: "Northeast",
    parent: "asia-india-political-divisions",
    activityId: "india-northeast-political-divisions",
    activityLabel: "Political Divisions"
  },
  "india-south-political-divisions": {
    id: "india-south-political-divisions",
    label: "South",
    parent: "asia-india-political-divisions",
    activityId: "india-south-political-divisions",
    activityLabel: "Political Divisions"
  },
  "india-islands-political-divisions": {
    id: "india-islands-political-divisions",
    label: "Islands",
    parent: "asia-india-political-divisions",
    activityId: "india-islands-political-divisions",
    activityLabel: "Political Divisions"
  },
  "asia-central": {
    id: "asia-central",
    label: "Central Asia",
    parent: "asia",
    activityId: "central-asia",
    activityLabel: "Countries"
  },
  "asia-physical-eurasian-inland-waters": {
    id: "asia-physical-eurasian-inland-waters",
    label: "Eurasian Inland Waters",
    parent: "asia",
    activityId: "asia-physical-eurasian-inland-waters",
    activityLabel: "Physical Features"
  },
  "asia-caucasus": {
    id: "asia-caucasus",
    label: "Caucasus",
    parent: "asia",
    activityId: "caucasus-countries",
    activityLabel: "Countries"
  },
  "asia-east": {
    id: "asia-east",
    label: "East Asia",
    parent: "asia",
    activityId: "east-asia-countries",
    activityLabel: "Countries"
  },
  "asia-japan-political-divisions": {
    id: "asia-japan-political-divisions",
    label: "Japan: Prefectures",
    parent: "asia",
    view: { center: [137.5, 37.0], zoom: 3.2 },
    children: [
      "japan-hokkaido-tohoku-political-divisions",
      "japan-kanto-political-divisions",
      "japan-chubu-political-divisions",
      "japan-kansai-political-divisions",
      "japan-chugoku-shikoku-political-divisions",
      "japan-kyushu-okinawa-political-divisions"
    ]
  },
  "japan-hokkaido-tohoku-political-divisions": {
    id: "japan-hokkaido-tohoku-political-divisions",
    label: "Hokkaido & Tohoku",
    parent: "asia-japan-political-divisions",
    activityId: "japan-hokkaido-tohoku-political-divisions",
    activityLabel: "Political Divisions"
  },
  "japan-kanto-political-divisions": {
    id: "japan-kanto-political-divisions",
    label: "Kanto",
    parent: "asia-japan-political-divisions",
    activityId: "japan-kanto-political-divisions",
    activityLabel: "Political Divisions"
  },
  "japan-chubu-political-divisions": {
    id: "japan-chubu-political-divisions",
    label: "Chubu",
    parent: "asia-japan-political-divisions",
    activityId: "japan-chubu-political-divisions",
    activityLabel: "Political Divisions"
  },
  "japan-kansai-political-divisions": {
    id: "japan-kansai-political-divisions",
    label: "Kansai",
    parent: "asia-japan-political-divisions",
    activityId: "japan-kansai-political-divisions",
    activityLabel: "Political Divisions"
  },
  "japan-chugoku-shikoku-political-divisions": {
    id: "japan-chugoku-shikoku-political-divisions",
    label: "Chugoku & Shikoku",
    parent: "asia-japan-political-divisions",
    activityId: "japan-chugoku-shikoku-political-divisions",
    activityLabel: "Political Divisions"
  },
  "japan-kyushu-okinawa-political-divisions": {
    id: "japan-kyushu-okinawa-political-divisions",
    label: "Kyushu & Okinawa",
    parent: "asia-japan-political-divisions",
    activityId: "japan-kyushu-okinawa-political-divisions",
    activityLabel: "Political Divisions"
  },
  "asia-china-political-divisions": {
    id: "asia-china-political-divisions",
    label: "China: Provinces, Regions, Municipalities & SARs",
    parent: "asia",
    view: { center: [105, 35], zoom: 2.6 },
    children: [
      "china-north-northeast-political-divisions",
      "china-east-political-divisions",
      "china-south-central-political-divisions",
      "china-southwest-political-divisions",
      "china-northwest-political-divisions"
    ]
  },
  "china-north-northeast-political-divisions": {
    id: "china-north-northeast-political-divisions",
    label: "North & Northeast",
    parent: "asia-china-political-divisions",
    activityId: "china-north-northeast-political-divisions",
    activityLabel: "Political Divisions"
  },
  "china-east-political-divisions": {
    id: "china-east-political-divisions",
    label: "East",
    parent: "asia-china-political-divisions",
    activityId: "china-east-political-divisions",
    activityLabel: "Political Divisions"
  },
  "china-south-central-political-divisions": {
    id: "china-south-central-political-divisions",
    label: "South Central",
    parent: "asia-china-political-divisions",
    activityId: "china-south-central-political-divisions",
    activityLabel: "Political Divisions"
  },
  "china-southwest-political-divisions": {
    id: "china-southwest-political-divisions",
    label: "Southwest",
    parent: "asia-china-political-divisions",
    activityId: "china-southwest-political-divisions",
    activityLabel: "Political Divisions"
  },
  "china-northwest-political-divisions": {
    id: "china-northwest-political-divisions",
    label: "Northwest",
    parent: "asia-china-political-divisions",
    activityId: "china-northwest-political-divisions",
    activityLabel: "Political Divisions"
  },
  "asia-mainland-southeast": {
    id: "asia-mainland-southeast",
    label: "Mainland Southeast Asia",
    parent: "asia",
    activityId: "mainland-southeast-asia-countries",
    activityLabel: "Countries"
  },
  "asia-maritime-southeast": {
    id: "asia-maritime-southeast",
    label: "Maritime Southeast Asia",
    parent: "asia",
    activityId: "maritime-southeast-asia-countries",
    activityLabel: "Countries"
  },
  "asia-cities": {
    id: "asia-cities",
    label: "Cities",
    parent: "asia",
    activityId: "world-cities-east-south-asia",
    activityLabel: "Cities"
  },
  russia: {
    id: "russia",
    label: "Russia",
    parent: "world",
    menuRoot: "russia",
    view: { center: [82, 58], zoom: 1.5 },
    children: [
      "russia-central-federal-subjects",
      "russia-more-central-federal-subjects",
      "russia-northwest-federal-subjects",
      "russia-more-northwest-federal-subjects",
      "russia-southern-federal-subjects",
      "russia-north-caucasus-federal-subjects",
      "russia-volga-federal-subjects",
      "russia-more-volga-federal-subjects",
      "russia-ural-federal-subjects",
      "russia-siberia-federal-subjects",
      "russia-far-east-federal-subjects",
      "russia-more-far-east-federal-subjects"
    ]
  },
  "russia-central-federal-subjects": {
    id: "russia-central-federal-subjects",
    label: "Central",
    parent: "russia",
    activityId: "russia-central-federal-subjects",
    activityLabel: "Federal Subjects"
  },
  "russia-more-central-federal-subjects": {
    id: "russia-more-central-federal-subjects",
    label: "More Central",
    parent: "russia",
    activityId: "russia-more-central-federal-subjects",
    activityLabel: "Federal Subjects"
  },
  "russia-northwest-federal-subjects": {
    id: "russia-northwest-federal-subjects",
    label: "Northwest",
    parent: "russia",
    activityId: "russia-northwest-federal-subjects",
    activityLabel: "Federal Subjects"
  },
  "russia-more-northwest-federal-subjects": {
    id: "russia-more-northwest-federal-subjects",
    label: "More Northwest",
    parent: "russia",
    activityId: "russia-more-northwest-federal-subjects",
    activityLabel: "Federal Subjects"
  },
  "russia-southern-federal-subjects": {
    id: "russia-southern-federal-subjects",
    label: "Southern",
    parent: "russia",
    activityId: "russia-southern-federal-subjects",
    activityLabel: "Federal Subjects"
  },
  "russia-north-caucasus-federal-subjects": {
    id: "russia-north-caucasus-federal-subjects",
    label: "North Caucasus",
    parent: "russia",
    activityId: "russia-north-caucasus-federal-subjects",
    activityLabel: "Federal Subjects"
  },
  "russia-volga-federal-subjects": {
    id: "russia-volga-federal-subjects",
    label: "Volga",
    parent: "russia",
    activityId: "russia-volga-federal-subjects",
    activityLabel: "Federal Subjects"
  },
  "russia-more-volga-federal-subjects": {
    id: "russia-more-volga-federal-subjects",
    label: "More Volga",
    parent: "russia",
    activityId: "russia-more-volga-federal-subjects",
    activityLabel: "Federal Subjects"
  },
  "russia-ural-federal-subjects": {
    id: "russia-ural-federal-subjects",
    label: "Ural",
    parent: "russia",
    activityId: "russia-ural-federal-subjects",
    activityLabel: "Federal Subjects"
  },
  "russia-siberia-federal-subjects": {
    id: "russia-siberia-federal-subjects",
    label: "Siberia",
    parent: "russia",
    activityId: "russia-siberia-federal-subjects",
    activityLabel: "Federal Subjects"
  },
  "russia-far-east-federal-subjects": {
    id: "russia-far-east-federal-subjects",
    label: "Far East",
    parent: "russia",
    activityId: "russia-far-east-federal-subjects",
    activityLabel: "Federal Subjects"
  },
  "russia-more-far-east-federal-subjects": {
    id: "russia-more-far-east-federal-subjects",
    label: "More Far East",
    parent: "russia",
    activityId: "russia-more-far-east-federal-subjects",
    activityLabel: "Federal Subjects"
  },
  "north-america": {
    id: "north-america",
    label: "North America",
    parent: "world",
    menuRoot: "north-america",
    view: { center: [-98, 37], zoom: 1.85 },
    children: ["north-america-united-states", "north-america-mexico", "north-america-canada", "north-america-physical-features", "north-america-regional"]
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
    children: ["mexico-northwest", "mexico-northeast", "mexico-west-bajio", "mexico-central", "mexico-south-gulf-yucatan", "mexico-states"]
  },
  "mexico-northwest": {
    id: "mexico-northwest",
    label: "Northwest",
    parent: "north-america-mexico",
    activityId: "mexico-northwest"
  },
  "mexico-northeast": {
    id: "mexico-northeast",
    label: "Northeast",
    parent: "north-america-mexico",
    activityId: "mexico-northeast"
  },
  "mexico-west-bajio": {
    id: "mexico-west-bajio",
    label: "West / Bajío",
    parent: "north-america-mexico",
    activityId: "mexico-west-bajio"
  },
  "mexico-central": {
    id: "mexico-central",
    label: "Central",
    parent: "north-america-mexico",
    activityId: "mexico-central"
  },
  "mexico-south-gulf-yucatan": {
    id: "mexico-south-gulf-yucatan",
    label: "South / Gulf / Yucatán",
    parent: "north-america-mexico",
    activityId: "mexico-south-gulf-yucatan"
  },
  "mexico-states": {
    id: "mexico-states",
    label: "All Mexico States Review",
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
    children: ["canada-atlantic-provinces", "canada-central-canada", "canada-prairie-provinces", "canada-western-northern", "canada-provinces-territories"]
  },
  "canada-atlantic-provinces": {
    id: "canada-atlantic-provinces",
    label: "Atlantic Provinces",
    parent: "north-america-canada",
    activityId: "canada-atlantic-provinces"
  },
  "canada-central-canada": {
    id: "canada-central-canada",
    label: "Central Canada",
    parent: "north-america-canada",
    activityId: "canada-central-canada"
  },
  "canada-prairie-provinces": {
    id: "canada-prairie-provinces",
    label: "Prairie Provinces",
    parent: "north-america-canada",
    activityId: "canada-prairie-provinces"
  },
  "canada-western-northern": {
    id: "canada-western-northern",
    label: "Western and Northern Canada",
    parent: "north-america-canada",
    activityId: "canada-western-northern"
  },
  "canada-provinces-territories": {
    id: "canada-provinces-territories",
    label: "All Canada Provinces & Territories Review",
    parent: "north-america-canada",
    activityId: "canada-provinces-territories"
  },
  "north-america-physical-features": {
    id: "north-america-physical-features",
    label: "Physical Features",
    parent: "north-america",
    view: { center: [-106, 57], zoom: 2.4 },
    children: ["north-america-physical-canadian-lakes"]
  },
  "north-america-physical-canadian-lakes": {
    id: "north-america-physical-canadian-lakes",
    label: "Canadian Lakes",
    parent: "north-america-physical-features",
    activityId: "north-america-physical-canadian-lakes",
    activityLabel: "Physical Features"
  },
  "us-states-capitals": {
    id: "us-states-capitals",
    label: "States & Capitals",
    parent: "north-america-united-states",
    view: { center: [-98, 39], zoom: 3.1 },
    overviewCountryIsoA3: "USA",
    mapClickDisabled: true,
    children: US_STATE_CAPITAL_MENU_ITEMS.map((item) => `nav-${item.activityId}`)
  },
  "us-physical-features": {
    id: "us-physical-features",
    label: "US Physical Features",
    parent: "north-america-united-states",
    view: { center: [-98, 39], zoom: 3.1 },
    mapClickDisabled: true,
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
    children: ["south-america-west", "south-america-east", "south-america-brazil-political-divisions"]
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
  "south-america-brazil-political-divisions": {
    id: "south-america-brazil-political-divisions",
    label: "Brazil: States & Federal District",
    parent: "south-america",
    view: { center: [-53, -14], zoom: 3.0 },
    children: [
      "brazil-north-political-divisions",
      "brazil-northeast-political-divisions",
      "brazil-central-west-political-divisions",
      "brazil-southeast-political-divisions",
      "brazil-south-political-divisions"
    ]
  },
  "brazil-north-political-divisions": {
    id: "brazil-north-political-divisions",
    label: "North",
    parent: "south-america-brazil-political-divisions",
    activityId: "brazil-north-political-divisions",
    activityLabel: "Political Divisions"
  },
  "brazil-northeast-political-divisions": {
    id: "brazil-northeast-political-divisions",
    label: "Northeast",
    parent: "south-america-brazil-political-divisions",
    activityId: "brazil-northeast-political-divisions",
    activityLabel: "Political Divisions"
  },
  "brazil-central-west-political-divisions": {
    id: "brazil-central-west-political-divisions",
    label: "Central-West",
    parent: "south-america-brazil-political-divisions",
    activityId: "brazil-central-west-political-divisions",
    activityLabel: "Political Divisions"
  },
  "brazil-southeast-political-divisions": {
    id: "brazil-southeast-political-divisions",
    label: "Southeast",
    parent: "south-america-brazil-political-divisions",
    activityId: "brazil-southeast-political-divisions",
    activityLabel: "Political Divisions"
  },
  "brazil-south-political-divisions": {
    id: "brazil-south-political-divisions",
    label: "South",
    parent: "south-america-brazil-political-divisions",
    activityId: "brazil-south-political-divisions",
    activityLabel: "Political Divisions"
  },
  oceania: {
    id: "oceania",
    label: "Australia / Oceania",
    parent: "world",
    menuRoot: "oceania",
    view: { center: [141, -18], zoom: 2.1 },
    children: ["oceania-countries", "australia-political-divisions"]
  },
  "oceania-countries": {
    id: "oceania-countries",
    label: "Countries",
    parent: "oceania",
    activityId: "oceania-pacific-countries",
    activityLabel: "Countries"
  },
  "australia-political-divisions": {
    id: "australia-political-divisions",
    label: "Australia States & Territories",
    parent: "oceania",
    activityId: "australia-states-territories",
    activityLabel: "Political Divisions"
  },
  review: {
    id: "review",
    label: "Review / Themed Activities",
    menuRoot: "review",
    view: { center: [48, 49], zoom: 1.75 },
    children: ["review-former-soviet-republics"]
  },
  "review-former-soviet-republics": {
    id: "review-former-soviet-republics",
    label: "Former Soviet Republics Review",
    parent: "review",
    activityId: "former-soviet-republics-review",
    activityLabel: "Review"
  },
  ...US_STATE_CAPITAL_NAV_NODES,
  ...US_PHYSICAL_FEATURE_NAV_NODES
};
const activityCatalogMetadata = {
  "continents-oceans": {
    mapSet: "world-europe",
    category: "Physical Features",
    description: "Practice the continents and major oceans on the modern 3D globe.",
    sortOrder: 8
  },
  "us-physical-lakes": {
    mapSet: "north-america",
    category: "Physical Features",
    description: "Practice U.S. lake targets using existing inland-water polygons.",
    sortOrder: 7.6,
    sectionNumber: 60
  },
  "us-physical-rivers": {
    mapSet: "north-america",
    category: "Physical Features",
    description: "Learn major U.S. rivers with section-aware Memory Trail practice.",
    sortOrder: 7.62,
    sectionNumber: 60.5
  },
  "us-mountain-ranges": {
    mapSet: "north-america",
    category: "Physical Features",
    description: "Learn U.S. mountain ranges with section-aware Memory Trail practice.",
    sortOrder: 7.63,
    sectionNumber: 61
  },
  "us-physical-eastern-mountains": {
    mapSet: "north-america",
    category: "Physical Features",
    description: "Practice the Eastern Mountains section of U.S. Mountain Ranges.",
    sortOrder: 7.64,
    sectionNumber: 60.5,
    hideFromActivityCatalog: true
  },
  "us-physical-midwestern-mountains": {
    mapSet: "north-america",
    category: "Physical Features",
    description: "Practice the Central Mountains section of U.S. Mountain Ranges.",
    sortOrder: 7.645,
    sectionNumber: 60.75,
    hideFromActivityCatalog: true
  },
  "us-physical-western-mountains": {
    mapSet: "north-america",
    category: "Physical Features",
    description: "Practice the Western Lower 48 section of U.S. Mountain Ranges.",
    sortOrder: 7.65,
    sectionNumber: 61,
    hideFromActivityCatalog: true
  },
  "us-physical-alaska-mountains": {
    mapSet: "north-america",
    category: "Physical Features",
    description: "Practice the Alaska Mountains section of U.S. Mountain Ranges.",
    sortOrder: 7.655,
    sectionNumber: 61.25,
    hideFromActivityCatalog: true
  },
  "north-america-physical-canadian-lakes": {
    mapSet: "north-america",
    category: "Physical Features",
    description: "Practice Canadian lake targets using existing inland-water polygons.",
    sortOrder: 7.62,
    sectionNumber: 62
  },
  "africa-physical-african-lakes": {
    mapSet: "world-europe",
    category: "Physical Features",
    description: "Practice major African lake targets using existing inland-water polygons.",
    sortOrder: 8.61,
    sectionNumber: 63
  },
  "asia-physical-middle-east-waters": {
    mapSet: "world-europe",
    category: "Physical Features",
    description: "Practice Middle East inland water targets using existing inland-water polygons.",
    sortOrder: 8.62,
    sectionNumber: 64
  },
  "asia-physical-eurasian-inland-waters": {
    mapSet: "world-europe",
    category: "Physical Features",
    description: "Practice Eurasian inland water targets using existing inland-water polygons.",
    sortOrder: 8.63,
    sectionNumber: 65
  },
  "world-core-americas-countries": {
    mapSet: "world-europe",
    category: "Countries",
    description: "Core country practice across the Americas.",
    sortOrder: 8.1,
    sectionNumber: 30
  },
  "world-core-europe-countries": {
    mapSet: "world-europe",
    category: "Countries",
    description: "Core country practice across Europe.",
    sortOrder: 8.2,
    sectionNumber: 31
  },
  "world-core-africa-countries": {
    mapSet: "world-europe",
    category: "Countries",
    description: "Core country practice across Africa.",
    sortOrder: 8.3,
    sectionNumber: 32
  },
  "world-core-west-central-south-asia-countries": {
    mapSet: "world-europe",
    category: "Countries",
    description: "Core country practice across West, Central, and South Asia.",
    sortOrder: 8.4,
    sectionNumber: 33
  },
  "world-core-east-southeast-asia-oceania-countries": {
    mapSet: "world-europe",
    category: "Countries",
    description: "Core country practice across East Asia, Southeast Asia, and Oceania.",
    sortOrder: 8.5,
    sectionNumber: 34
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
  "former-soviet-republics-review": {
    mapSet: "world-europe",
    category: "Review",
    description: "Review activity for modern countries that share former Soviet history.",
    sortOrder: 200
  },
  "russia-central-federal-subjects": {
    mapSet: "world-europe",
    category: "Political Divisions",
    description: "Russia central federal subjects.",
    sortOrder: 84,
    sectionNumber: 84
  },
  "russia-more-central-federal-subjects": {
    mapSet: "world-europe",
    category: "Political Divisions",
    description: "More Russia central federal subjects.",
    sortOrder: 85,
    sectionNumber: 85
  },
  "russia-northwest-federal-subjects": {
    mapSet: "world-europe",
    category: "Political Divisions",
    description: "Russia northwest federal subjects.",
    sortOrder: 86,
    sectionNumber: 86
  },
  "russia-more-northwest-federal-subjects": {
    mapSet: "world-europe",
    category: "Political Divisions",
    description: "More Russia northwest federal subjects.",
    sortOrder: 87,
    sectionNumber: 87
  },
  "russia-southern-federal-subjects": {
    mapSet: "world-europe",
    category: "Political Divisions",
    description: "Russia southern federal subjects.",
    sortOrder: 88,
    sectionNumber: 88
  },
  "russia-north-caucasus-federal-subjects": {
    mapSet: "world-europe",
    category: "Political Divisions",
    description: "Russia north Caucasus federal subjects.",
    sortOrder: 89,
    sectionNumber: 89
  },
  "russia-volga-federal-subjects": {
    mapSet: "world-europe",
    category: "Political Divisions",
    description: "Russia Volga federal subjects.",
    sortOrder: 90,
    sectionNumber: 90
  },
  "russia-more-volga-federal-subjects": {
    mapSet: "world-europe",
    category: "Political Divisions",
    description: "More Russia Volga federal subjects.",
    sortOrder: 91,
    sectionNumber: 91
  },
  "russia-ural-federal-subjects": {
    mapSet: "world-europe",
    category: "Political Divisions",
    description: "Russia Ural federal subjects.",
    sortOrder: 92,
    sectionNumber: 92
  },
  "russia-siberia-federal-subjects": {
    mapSet: "world-europe",
    category: "Political Divisions",
    description: "Russia Siberia federal subjects.",
    sortOrder: 93,
    sectionNumber: 93
  },
  "russia-far-east-federal-subjects": {
    mapSet: "world-europe",
    category: "Political Divisions",
    description: "Russia Far East federal subjects.",
    sortOrder: 94,
    sectionNumber: 94
  },
  "russia-more-far-east-federal-subjects": {
    mapSet: "world-europe",
    category: "Political Divisions",
    description: "More Russia Far East federal subjects.",
    sortOrder: 95,
    sectionNumber: 95
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
  "nordic-countries": {
    mapSet: "world-europe",
    category: "Countries",
    description: "Nordic countries practice with Iceland included.",
    sortOrder: 13,
    sectionNumber: 13
  },
  "baltic-countries": {
    mapSet: "world-europe",
    category: "Countries",
    description: "Baltic countries practice.",
    sortOrder: 14,
    sectionNumber: 14
  },
  "eastern-europe-countries": {
    mapSet: "world-europe",
    category: "Countries",
    description: "Eastern Europe regional country practice without Russia.",
    sortOrder: 15,
    sectionNumber: 15
  },
  "balkans": {
    mapSet: "world-europe",
    category: "Countries",
    description: "Western Balkans country practice.",
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
  "germany-north-east-political-divisions": {
    mapSet: "world-europe",
    category: "Political Divisions",
    description: "Germany north and east states.",
    sortOrder: 18.1,
    sectionNumber: 18.1
  },
  "germany-south-west-political-divisions": {
    mapSet: "world-europe",
    category: "Political Divisions",
    description: "Germany south and west states.",
    sortOrder: 18.2,
    sectionNumber: 18.2
  },
  "france-northern-eastern-regions-political-divisions": {
    mapSet: "world-europe",
    category: "Political Divisions",
    description: "France northern and eastern regions.",
    sortOrder: 18.3,
    sectionNumber: 18.3
  },
  "france-southern-regions-political-divisions": {
    mapSet: "world-europe",
    category: "Political Divisions",
    description: "France southern regions.",
    sortOrder: 18.4,
    sectionNumber: 18.4
  },
  "spain-northern-central-political-divisions": {
    mapSet: "world-europe",
    category: "Political Divisions",
    description: "Spain northern and central autonomous communities.",
    sortOrder: 18.5,
    sectionNumber: 18.5
  },
  "spain-southern-eastern-political-divisions": {
    mapSet: "world-europe",
    category: "Political Divisions",
    description: "Spain southern and eastern autonomous communities and cities.",
    sortOrder: 18.6,
    sectionNumber: 18.6
  },
  "italy-northern-regions-political-divisions": {
    mapSet: "world-europe",
    category: "Political Divisions",
    description: "Italy northern regions.",
    sortOrder: 18.7,
    sectionNumber: 18.7
  },
  "italy-central-southern-regions-political-divisions": {
    mapSet: "world-europe",
    category: "Political Divisions",
    description: "Italy central and southern regions.",
    sortOrder: 18.8,
    sectionNumber: 18.8
  },
  "italy-islands-political-divisions": {
    mapSet: "world-europe",
    category: "Political Divisions",
    description: "Italy island regions.",
    sortOrder: 18.9,
    sectionNumber: 18.9
  },
  "united-kingdom-countries-political-divisions": {
    mapSet: "world-europe",
    category: "Political Divisions",
    description: "Countries of the United Kingdom.",
    sortOrder: 18.95,
    sectionNumber: 18.95
  },
  "southern-africa-countries": {
    mapSet: "world-europe",
    category: "Countries",
    description: "Southern Africa country practice.",
    sortOrder: 75,
    sectionNumber: 75
  },
  "more-southern-africa-countries": {
    mapSet: "world-europe",
    category: "Countries",
    description: "More Southern Africa country practice.",
    sortOrder: 76,
    sectionNumber: 76
  },
  "north-africa-countries": {
    mapSet: "world-europe",
    category: "Countries",
    description: "North Africa country practice.",
    sortOrder: 69,
    sectionNumber: 69
  },
  "west-africa-countries": {
    mapSet: "world-europe",
    category: "Countries",
    description: "West Africa country practice.",
    sortOrder: 70,
    sectionNumber: 71
  },
  "more-west-africa-countries": {
    mapSet: "world-europe",
    category: "Countries",
    description: "More West Africa country practice.",
    sortOrder: 71,
    sectionNumber: 72
  },
  "central-africa-countries": {
    mapSet: "world-europe",
    category: "Countries",
    description: "Central Africa country practice.",
    sortOrder: 72,
    sectionNumber: 73
  },
  "east-africa-countries": {
    mapSet: "world-europe",
    category: "Countries",
    description: "East Africa country practice.",
    sortOrder: 73,
    sectionNumber: 74
  },
  "middle-east-countries": {
    mapSet: "world-europe",
    category: "Countries",
    description: "Middle East country practice.",
    sortOrder: 60,
    sectionNumber: 60
  },
  "central-america": {
    mapSet: "world-europe",
    category: "Countries",
    description: "Central America country review sheet.",
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
  "caucasus-countries": {
    mapSet: "world-europe",
    category: "Countries",
    description: "Caucasus country practice.",
    sortOrder: 73.5,
    sectionNumber: 24
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
  "brazil-north-political-divisions": {
    mapSet: "world-europe",
    category: "Political Divisions",
    description: "Brazil north states.",
    sortOrder: 75.1,
    sectionNumber: 23.1
  },
  "brazil-northeast-political-divisions": {
    mapSet: "world-europe",
    category: "Political Divisions",
    description: "Brazil northeast states.",
    sortOrder: 75.2,
    sectionNumber: 23.2
  },
  "brazil-central-west-political-divisions": {
    mapSet: "world-europe",
    category: "Political Divisions",
    description: "Brazil central-west states and Federal District.",
    sortOrder: 75.3,
    sectionNumber: 23.3
  },
  "brazil-southeast-political-divisions": {
    mapSet: "world-europe",
    category: "Political Divisions",
    description: "Brazil southeast states.",
    sortOrder: 75.4,
    sectionNumber: 23.4
  },
  "brazil-south-political-divisions": {
    mapSet: "world-europe",
    category: "Political Divisions",
    description: "Brazil south states.",
    sortOrder: 75.5,
    sectionNumber: 23.5
  },
  "caribbean": {
    mapSet: "world-europe",
    category: "Countries",
    description: "Caribbean islands proof sheet with country and territory targets.",
    sortOrder: 76,
    sectionNumber: 9
  },
  "south-asia-countries": {
    mapSet: "world-europe",
    category: "Countries",
    description: "South Asia country practice.",
    sortOrder: 77,
    sectionNumber: 10
  },
  "india-north-political-divisions": {
    mapSet: "world-europe",
    category: "Political Divisions",
    description: "India north states and union territories.",
    sortOrder: 77.1,
    sectionNumber: 10.1
  },
  "india-west-central-political-divisions": {
    mapSet: "world-europe",
    category: "Political Divisions",
    description: "India west and central states and union territories.",
    sortOrder: 77.2,
    sectionNumber: 10.2
  },
  "india-east-political-divisions": {
    mapSet: "world-europe",
    category: "Political Divisions",
    description: "India east states.",
    sortOrder: 77.3,
    sectionNumber: 10.3
  },
  "india-northeast-political-divisions": {
    mapSet: "world-europe",
    category: "Political Divisions",
    description: "India northeast states.",
    sortOrder: 77.4,
    sectionNumber: 10.4
  },
  "india-south-political-divisions": {
    mapSet: "world-europe",
    category: "Political Divisions",
    description: "India south states and union territories.",
    sortOrder: 77.5,
    sectionNumber: 10.5
  },
  "india-islands-political-divisions": {
    mapSet: "world-europe",
    category: "Political Divisions",
    description: "India island union territories.",
    sortOrder: 77.6,
    sectionNumber: 10.6
  },
  "east-asia-countries": {
    mapSet: "world-europe",
    category: "Countries",
    description: "East Asia country practice.",
    sortOrder: 78,
    sectionNumber: 19
  },
  "japan-hokkaido-tohoku-political-divisions": {
    mapSet: "world-europe",
    category: "Political Divisions",
    description: "Japan Hokkaido and Tohoku prefectures.",
    sortOrder: 78.01,
    sectionNumber: 19.01
  },
  "japan-kanto-political-divisions": {
    mapSet: "world-europe",
    category: "Political Divisions",
    description: "Japan Kanto prefectures.",
    sortOrder: 78.02,
    sectionNumber: 19.02
  },
  "japan-chubu-political-divisions": {
    mapSet: "world-europe",
    category: "Political Divisions",
    description: "Japan Chubu prefectures.",
    sortOrder: 78.03,
    sectionNumber: 19.03
  },
  "japan-kansai-political-divisions": {
    mapSet: "world-europe",
    category: "Political Divisions",
    description: "Japan Kansai prefectures.",
    sortOrder: 78.04,
    sectionNumber: 19.04
  },
  "japan-chugoku-shikoku-political-divisions": {
    mapSet: "world-europe",
    category: "Political Divisions",
    description: "Japan Chugoku and Shikoku prefectures.",
    sortOrder: 78.05,
    sectionNumber: 19.05
  },
  "japan-kyushu-okinawa-political-divisions": {
    mapSet: "world-europe",
    category: "Political Divisions",
    description: "Japan Kyushu and Okinawa prefectures.",
    sortOrder: 78.06,
    sectionNumber: 19.06
  },
  "china-north-northeast-political-divisions": {
    mapSet: "world-europe",
    category: "Political Divisions",
    description: "China north and northeast provincial-level political divisions.",
    sortOrder: 78.1,
    sectionNumber: 19.1
  },
  "china-east-political-divisions": {
    mapSet: "world-europe",
    category: "Political Divisions",
    description: "China east provincial-level political divisions.",
    sortOrder: 78.2,
    sectionNumber: 19.2
  },
  "china-south-central-political-divisions": {
    mapSet: "world-europe",
    category: "Political Divisions",
    description: "China south central provincial-level political divisions and SARs.",
    sortOrder: 78.3,
    sectionNumber: 19.3
  },
  "china-southwest-political-divisions": {
    mapSet: "world-europe",
    category: "Political Divisions",
    description: "China southwest provincial-level political divisions.",
    sortOrder: 78.4,
    sectionNumber: 19.4
  },
  "china-northwest-political-divisions": {
    mapSet: "world-europe",
    category: "Political Divisions",
    description: "China northwest provincial-level political divisions.",
    sortOrder: 78.5,
    sectionNumber: 19.5
  },
  "mainland-southeast-asia-countries": {
    mapSet: "world-europe",
    category: "Countries",
    description: "Mainland Southeast Asia country practice.",
    sortOrder: 78.5,
    sectionNumber: 20
  },
  "maritime-southeast-asia-countries": {
    mapSet: "world-europe",
    category: "Countries",
    description: "Maritime Southeast Asia country practice.",
    sortOrder: 78.75,
    sectionNumber: 21
  },
  "oceania-pacific-countries": {
    mapSet: "world-europe",
    category: "Countries",
    description: "Oceania and Pacific country practice.",
    sortOrder: 79,
    sectionNumber: 22
  },
  "australia-states-territories": {
    mapSet: "world-europe",
    category: "Political Divisions",
    description: "Australia states and mainland territories practice.",
    sortOrder: 79.5,
    sectionNumber: 23
  },
  "canada-atlantic-provinces": {
    mapSet: "world-europe",
    category: "Political Divisions",
    description: "Atlantic Canada province practice.",
    sortOrder: 80.1
  },
  "canada-central-canada": {
    mapSet: "world-europe",
    category: "Political Divisions",
    description: "Quebec and Ontario province practice.",
    sortOrder: 80.2
  },
  "canada-prairie-provinces": {
    mapSet: "world-europe",
    category: "Political Divisions",
    description: "Prairie Provinces practice.",
    sortOrder: 80.3
  },
  "canada-western-northern": {
    mapSet: "world-europe",
    category: "Political Divisions",
    description: "Western and northern Canada province and territory practice.",
    sortOrder: 80.4
  },
  "mexico-states": {
    mapSet: "world-europe",
    category: "Political Divisions",
    description: "Full Mexico states review with state and capital-district polygons.",
    sortOrder: 82
  },
  "mexico-northwest": {
    mapSet: "world-europe",
    category: "Political Divisions",
    description: "Northwest Mexico state practice.",
    sortOrder: 81.1
  },
  "mexico-northeast": {
    mapSet: "world-europe",
    category: "Political Divisions",
    description: "Northeast Mexico state practice.",
    sortOrder: 81.2
  },
  "mexico-west-bajio": {
    mapSet: "world-europe",
    category: "Political Divisions",
    description: "West and Bajío Mexico state practice.",
    sortOrder: 81.3
  },
  "mexico-central": {
    mapSet: "world-europe",
    category: "Political Divisions",
    description: "Central Mexico state and federal entity practice.",
    sortOrder: 81.4
  },
  "mexico-south-gulf-yucatan": {
    mapSet: "world-europe",
    category: "Political Divisions",
    description: "South, Gulf, and Yucatán Mexico state practice.",
    sortOrder: 81.5
  },
  "canada-provinces-territories": {
    mapSet: "world-europe",
    category: "Political Divisions",
    description: "Full Canada provinces and territories review.",
    sortOrder: 83
  }
};
const supplementalOverviewEntries = [];
const usSectionDescriptions = {
  1: "Maine, New Hampshire, Massachusetts, Rhode Island, Connecticut, and their capitals.",
  2: "Vermont, New York, New Jersey, Pennsylvania, Delaware, and their capitals.",
  3: "Maryland, Virginia, West Virginia, North Carolina, South Carolina, and Washington, D.C.",
  4: "Georgia, Florida, Alabama, Mississippi, Louisiana, and their capitals.",
  5: "Michigan, Ohio, Indiana, Kentucky, Tennessee, and their capitals.",
  6: "Wisconsin, Illinois, Iowa, Missouri, Arkansas, and their capitals.",
  7: "Minnesota, North Dakota, South Dakota, Wyoming, Nebraska, and their capitals.",
  8: "Kansas, Oklahoma, Texas, Colorado, New Mexico, and their capitals.",
  9: "Utah, Arizona, Nevada, California, and their capitals.",
  10: "Montana, Idaho, Washington, Oregon, and their capitals.",
  11: "Alaska, Hawaii, and their capitals."
};

function getUsSectionDescription(sectionNumber, activityId = "") {
  const baseDescription = usSectionDescriptions[sectionNumber] || "United States section review.";

  if (activityId.startsWith("us-states-")) {
    return baseDescription
      .replace(/, and their capitals\.?$/i, ".")
      .replace(/, their capitals\.?$/i, ".")
      .replace(/, and Washington, D\.?C\.?$/i, ".")
      .replace(/\band their capitals\b/gi, "states")
      .replace(/\bstate, capital, or location\b/gi, "state");
  }

  if (activityId.startsWith("us-capitals-")) {
    return baseDescription
      .replace(/^(.+?), and their capitals\.?$/i, "Capital cities for $1.")
      .replace(/^(.+?), their capitals\.?$/i, "Capital cities for $1.")
      .replace(/^(.+?), and Washington, D\.?C\.?$/i, "Capital cities for $1.");
  }

  return baseDescription;
}

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

let activities = createActivityShellCatalog();
let selectedActivityId = defaultActivityId;
let session;
let runner;
let ActivitySessionClass = null;
let normalizeActivityData = null;
let MapLibreActivityRunnerClass = null;
let mapRuntimePromise = null;
let activityDataPromise = null;
let mapReadyPromise = null;
let mapRuntimeReady = false;
let activityDataReady = false;
let feedbackTimer;
let activeMapSet = defaultMapSet;
let activeMenuRoot = defaultMenuRoot;
let activeHierarchyNodeId = "world";
let isNavigationBrowseMode = false;
let isBrowseDrawerOpen = false;
let activePreviewActivityId = null;
let selectedOverviewActivityId = null;
// Selected Free Play country/card state is separate from activity sessions so browsing stays non-scored.
let freePlaySelectedMapFeature = null;
let grabbedAnswerId = null;
let grabbedPointerId = null;
let grabbedStartPoint = null;
let grabbedHasMoved = false;
let floatingChip = null;
let completedActivityIds = loadCompletedActivityIds();
let activityProgress = loadActivityProgress();
let currentDifficulty = loadDifficultyMode();
let currentAppScreen = "launch";
let appScreenHistory = [];
let selectedJourneyId = null;
let journeyPickerIntent = "neutral";
let selectedJourneyDetailIntent = "neutral";
let selectedJourneyPlayState = {
  journeyId: null,
  difficultyId: "medium"
};
let pendingFreePlayActivityId = null;
let pendingFreePlayHierarchyNodeId = null;
let selectedFreePlayDifficultyId = difficultyModes.easy;
let activeJourneySession = null;
let activeDailyTrailSession = null;
let pendingDailyTrailPlan = null;
let lastDailyTrailSummary = null;
let pendingDailyTrailGameplaySettingsReturn = false;
let activeUnitedStatesMemoryTrailSession = null;
let pendingUnitedStatesMemoryTrailPlan = null;
let lastUnitedStatesMemoryTrailSummary = null;
let pendingUnitedStatesMemoryTrailGameplaySettingsReturn = false;
let unitedStatesMemoryTrailResetConfirmationVisible = false;
let dailyTrailDevReplayCursor = null;
let dailyTrailResetConfirmationVisible = false;
let dailyTrailDevSelectedGoalId = "";
let dailyTrailDevSearchQuery = "";
let dailyTrailDevCheatBuffer = "";
let dailyTrailDevCheatListenerBound = false;
let cameraDevCheatBuffer = "";
let cameraDevCheatListenerBound = false;
let cameraDevPanel = null;
let cameraDevPanelBody = null;
let cameraDevPanelCollapseButton = null;
let cameraDevPanelCollapsed = false;
let cameraDevViewportListenerBound = false;
let cameraDevSnapshotValues = null;
let cameraDevStatusEl = null;
let cameraDevZoomInput = null;
let cameraDevLngInput = null;
let cameraDevLatInput = null;
let cameraDevBearingInput = null;
let cameraDevPitchInput = null;
let cameraDevScopeSelect = null;
let cameraDevExportOutput = null;
let cameraDevTraceStatusEl = null;
let cameraDevTraceOutput = null;
let cameraDevMemoryTrailSkipButton = null;
let cameraDevMemoryTrailSectionButton = null;
let cameraDevMemoryTrailBackSectionButton = null;
let cameraDevMemoryTrailStatusEl = null;
let cameraDevStylesInjected = false;
let cameraDevMapEventSource = null;
const cameraDevTraceEventLimit = 80;
let cameraDevTraceEvents = [];
let cameraDevTraceSequence = 0;
let cameraDevTraceStartedAtMs = 0;
let mountainFindDevSessionActive = false;
let mountainFindDevPanel = null;
let activeStudySession = null;
let activeStudyPracticeSession = null;
let journeyCompletionState = null;
let studyPracticeCompletionState = null;
let isJourneyTransitioning = false;
let journeyAutoAdvanceTimer = null;
let activityAttemptState = createActivityAttemptState();
let activeRetryReviewState = null;
let memoryTrailOverlayMode = null;
let pendingJourneyMemoryTrailRecommendation = null;
const dismissedJourneyMemoryTrailRecommendations = new Set();
let lastTrackedMainMenuVisibility = false;
let activityAttemptAnalyticsSequence = 0;
let currentActivityAttemptAnalyticsKey = "";
let completedActivityAttemptAnalyticsKey = "";
let currentMemoryTrailAnalyticsKey = "";
let completedMemoryTrailAnalyticsKey = "";
let launchStartEventsBound = false;
let launchScreenEventsBound = false;
let audioInstructionState = createAudioInstructionState("app");
let audioInstructionHideTimer = null;
let memoryTrailInstructionBannerTimer = null;
let dailyTrailTransitionNoticeTimer = null;
let lastMemoryTrailInstructionKey = "";
let lastSpokenMemoryTrailInstructionKey = "";
let memoryTrailAudioSessionSequence = 0;
let journeyGameplayInstructionKeys = new Set();
let atlasProgress = loadProgress();
let mapLayerSettings = loadMapLayerSettings();
let studyTargetSettings = loadStudyTargetSettings();
let audioSettings = loadAudioSettings();
let currentPresentationSettings = {};
let isCurrentActivityProgressDisabled = false;

const incorrectRevealThreshold = 3;
const activityRetryThreshold = 5;
const incorrectRevealDurationMs = 1700;
const ENABLE_MEMORY_TRAIL_DEBUG = false;
const ENABLE_DAILY_TRAIL_DEBUG = false;
const DEFAULT_SESSION_SECONDS = 300;
const SHORT_SESSION_SECONDS = 180;
const LONG_SESSION_SECONDS = 600;
const ACTIVE_CHUNK_SIZE = 4;
const MIN_ACTIVE_CHUNK_SIZE = 3;
const MAX_ACTIVE_CHUNK_SIZE = 5;
const MIN_NEW_TARGETS_PER_SESSION = 4;
const MAX_NEW_TARGETS_PER_SESSION = 6;
const MIN_TOTAL_TARGET_POOL = 12;
const MAX_TOTAL_TARGET_POOL = 20;
const TARGET_SUCCESS_RATE = 0.85;
const SESSION_PROMPT_CAP = 45;
const BASE_SESSION_CORRECT_TARGET = 4;
const WEAK_SESSION_CORRECT_TARGET = 6;
const DAILY_TRAIL_SESSION_CORRECT_TARGET = 2;
const DAILY_TRAIL_WEAK_CORRECT_TARGET = 1;
const DAILY_TRAIL_SECTION_MAX_CORRECT_REPEATS = 2;
const DAILY_TRAIL_SECTION_MAX_REMEDIATION_PROMPTS = 5;
const DAILY_TRAIL_TARGET_MAX_REMEDIATION_PROMPTS = 2;
const DAILY_TRAIL_TERMINAL_US_STATES_REVIEW_CAMERA = {
  center: [-100.26878, 38.67918],
  zoom: 3.9446,
  bearing: 0,
  pitch: 0
};
const SESSION_LEARNED_MIN_CORRECT = 3;
const MIN_GAP_AFTER_CORRECT = 3;
const MIN_GAP_AFTER_MISS = 1;
const MEMORY_TRAIL_ANSWER_CHOICE_COUNT = 4;
const MEMORY_TRAIL_INSTRUCTION_BANNER_MS = 2200;
const memoryTrailCorrectPauseMs = 520;
const dailyTrailRetrievalCorrectPauseMs = 360;
const memoryTrailReplayPauseMs = 900;
const audioInstructionVisibleDurationMs = 5200;
const audioInstructionPhrases = {
  chooseLabel: "Choose a label.",
  tapMatchingPlace: "Tap the matching place on the map.",
  studyPreview: "Study the places, then try the challenge."
};

const title = document.querySelector("#poc-title");
const instruction = document.querySelector("#poc-instruction");
const answerBank = document.querySelector("#answer-bank");
const progress = document.querySelector("#progress");
const feedback = document.querySelector("#feedback");
const resetButton = document.querySelector("#reset-button");
const journeyMemoryTrailButton = document.querySelector("#journey-memory-trail-button");
const backButton = document.querySelector("#back-button");
const homeButton = document.querySelector("#home-button");
const browseButton = document.querySelector("#browse-button");
const browseCloseButton = document.querySelector("#browse-close-button");
const settingsButton = document.querySelector("#settings-button");
const audioMuteButton = document.querySelector("#audio-mute-button");
const audioInstructionBanner = document.querySelector("#audio-instruction-banner");
const memoryTrailCorrectionCallout = document.querySelector("#memory-trail-correction-callout");
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
const launchScreen = document.querySelector("#launch-screen");
const launchTitle = document.querySelector("#launch-title");
const launchStartButton = document.querySelector("#launch-start-button");
const launchSettingsGear = document.querySelector("#launch-settings-gear");
const appShellScreen = document.querySelector("#app-shell-screen");
const appShellTitle = document.querySelector("#app-shell-title");
const appShellSubtitle = document.querySelector("#app-shell-subtitle");
const appShellBackButton = document.querySelector("#app-shell-back-button");
const appShellSettingsGear = document.querySelector("#app-shell-settings-gear");
const mainMenuDailyTrailSection = document.querySelector("#main-menu-daily-trail-section");
const mainMenuForkSection = document.querySelector("#main-menu-fork-section");
const mainMenuLearnButton = document.querySelector("#main-menu-learn-button");
const mainMenuChallengeButton = document.querySelector("#main-menu-challenge-button");
const mainMenuDailyTrailButton = document.querySelector("#main-menu-daily-trail-button");
const mainMenuUnitedStatesMemoryTrailButton = document.querySelector("#main-menu-us-memory-trail-button");
const mainMenuUnitedStatesAtlasButton = document.querySelector("#main-menu-united-states-atlas-button");
const mainMenuMoreWaysButton = document.querySelector("#main-menu-more-ways-button");
const mainMenuDailyTrailAction = document.querySelector("#main-menu-daily-trail-action");
const mainMenuUnitedStatesMemoryTrailAction = document.querySelector("#main-menu-us-memory-trail-action");
const mainMenuLearnSection = document.querySelector("#main-menu-learn-section");
const mainMenuChallengeSection = document.querySelector("#main-menu-challenge-section");
const mainMenuUtilityArea = document.querySelector("#main-menu-utility-area");
const mainMenuQuickStartRow = document.querySelector("#main-menu-quick-start-row");
const mainMenuQuickStartButton = document.querySelector("#main-menu-quick-start-button");
const quickStartKicker = document.querySelector("#quick-start-kicker");
const quickStartTitle = document.querySelector("#quick-start-title");
const quickStartDetail = document.querySelector("#quick-start-detail");
const quickStartMeta = document.querySelector("#quick-start-meta");
const quickStartAction = document.querySelector("#quick-start-action");
const mainMenuActions = document.querySelector("#main-menu-actions");
const mainMenuActionsAnchor = document.createComment("main-menu-actions");
mainMenuActions?.parentNode?.insertBefore(mainMenuActionsAnchor, mainMenuActions);
const mainMenuChooseButton = document.querySelector("#main-menu-choose-button");
const challengeMenuChooseButton = document.querySelector("#challenge-menu-choose-button");
const mainMenuSettingsButton = document.querySelector("#main-menu-settings-button");
const mainMenuFeedback = document.querySelector("#main-menu-feedback");
const mainMenuFeedbackLink = document.querySelector("#main-menu-feedback-link");
const infoPopover = document.querySelector("#info-popover");
let infoPopoverCloseTimer = null;
let lastInfoPointerType = "";

function isCompactTouchLayout() {
  return Boolean(window.matchMedia?.("(max-width: 760px), (max-width: 900px) and (max-height: 520px)")?.matches);
}

function isActiveGameplayScreen() {
  return currentAppScreen === "journey-gameplay"
    || currentAppScreen === "daily-trail-gameplay"
    || currentAppScreen === "united-states-trail-gameplay"
    || currentAppScreen === "study-practice"
    || (currentAppScreen === "free-play" && isStudyModeActive());
}

function isCurrentActivityComplete() {
  const { completedCount, targetCount } = getSessionCompletionSummary();
  return targetCount > 0 && completedCount >= targetCount;
}

function isGameplayNavigationLocked() {
  return isActiveGameplayScreen() && !isCurrentActivityComplete();
}

function shouldShowResetControl() {
  return Boolean(
    session?.currentActivity
    && isActiveGameplayScreen()
    && currentAppScreen !== "daily-trail-gameplay"
    && currentAppScreen !== "united-states-trail-gameplay"
  );
}

function updateResetControlVisibility() {
  if (!resetButton) {
    updateJourneyMemoryTrailControlVisibility();
    return;
  }

  const shouldShow = shouldShowResetControl();
  resetButton.hidden = !shouldShow;
  resetButton.disabled = !shouldShow;
  resetButton.tabIndex = shouldShow ? 0 : -1;
  resetButton.setAttribute("aria-hidden", String(!shouldShow));
  updateJourneyMemoryTrailControlVisibility();
}

function shouldShowJourneyMemoryTrailControl() {
  const difficultyId = getEffectiveDifficulty(session?.currentActivity);

  return Boolean(
    currentAppScreen === "journey-gameplay"
    && activeJourneySession?.mode === "journey"
    && session?.currentActivity
    && isMemoryTrailEligible(session.currentActivity)
    && [difficultyModes.easy, difficultyModes.medium].includes(difficultyId)
    && !isCurrentActivityComplete()
    && !isJourneyTransitioning
    && !journeyCompletionState?.isVisible
    && !journeyAutoAdvanceTimer
    && !isActivityInputLocked()
  );
}

function updateJourneyMemoryTrailControlVisibility() {
  if (!journeyMemoryTrailButton) {
    return;
  }

  const shouldShow = shouldShowJourneyMemoryTrailControl();
  journeyMemoryTrailButton.hidden = !shouldShow;
  journeyMemoryTrailButton.disabled = !shouldShow;
  journeyMemoryTrailButton.tabIndex = shouldShow ? 0 : -1;
  journeyMemoryTrailButton.setAttribute("aria-hidden", String(!shouldShow));
}

function createAudioInstructionState(scope) {
  return {
    scope,
    playedKeys: new Set()
  };
}

function resetAudioInstructionState(scope) {
  audioInstructionState = createAudioInstructionState(scope);
  hideAudioInstructionBanner();
}

function resetJourneyGameplayInstructionSession() {
  journeyGameplayInstructionKeys = new Set();
}

function readGameplayIntroSpeechSessionKeys() {
  try {
    const storedValue = window.sessionStorage?.getItem(gameplayIntroSpeechSessionKey);
    const storedKeys = storedValue ? JSON.parse(storedValue) : [];
    return new Set(Array.isArray(storedKeys) ? storedKeys.filter(Boolean) : []);
  } catch (error) {
    return new Set();
  }
}

function writeGameplayIntroSpeechSessionKeys(playedKeys) {
  try {
    window.sessionStorage?.setItem(gameplayIntroSpeechSessionKey, JSON.stringify([...playedKeys]));
  } catch (error) {
    // Session storage is a convenience guard; in-memory gating still prevents local repeats.
  }
}

function shouldPlayGameplayIntroSpeech(instructionKey) {
  if (!instructionKey) {
    return false;
  }

  return !journeyGameplayInstructionKeys.has(instructionKey)
    && !readGameplayIntroSpeechSessionKeys().has(instructionKey);
}

function markGameplayIntroSpeechPlayed(instructionKey) {
  if (!instructionKey) {
    return;
  }

  journeyGameplayInstructionKeys.add(instructionKey);
  const playedKeys = readGameplayIntroSpeechSessionKeys();
  playedKeys.add(instructionKey);
  writeGameplayIntroSpeechSessionKeys(playedKeys);
}

function playGameplayInstructionOnce(instructionKey, phrase, options = {}) {
  if (currentAppScreen === "journey-gameplay") {
    if (!shouldPlayGameplayIntroSpeech(instructionKey)) {
      return Promise.resolve(false);
    }

    markGameplayIntroSpeechPlayed(instructionKey);
  }

  return playInstructionOnce(instructionKey, phrase, options);
}

function updateAudioMuteControl() {
  if (!audioMuteButton) {
    updateSettingsAudioToggleControl();
    return;
  }

  const isMuted = getAudioMutedSetting();
  audioMuteButton.classList.toggle("muted", isMuted);
  audioMuteButton.setAttribute("aria-pressed", String(isMuted));
  audioMuteButton.setAttribute("aria-label", isMuted ? "Unmute audio" : "Mute audio");
  audioMuteButton.setAttribute("title", isMuted ? "Unmute audio" : "Mute audio");

  const label = audioMuteButton.querySelector(".audio-mute-label");
  if (label) {
    label.textContent = isMuted ? "Muted" : "Audio";
  }

  updateSettingsAudioToggleControl();
}

function getAudioMutedSetting() {
  if (window.GeographyChipSpeech?.getAudioMuted) {
    return window.GeographyChipSpeech.getAudioMuted() === true;
  }

  try {
    return localStorage.getItem("atlasQuestAudioMuted") === "true";
  } catch {
    return false;
  }
}

function updateSettingsAudioToggleControl() {
  const checkbox = document.querySelector("[data-settings-control=\"audio-muted\"]");
  if (!checkbox) {
    return;
  }

  checkbox.checked = !getAudioMutedSetting();
  const label = document.querySelector("[data-settings-audio-state]");
  if (label) {
    label.textContent = checkbox.checked ? "On" : "Off";
  }
}

function ensureChipSpeechLoaded() {
  if (window.GeographyChipSpeech?.setAudioMuted) {
    return Promise.resolve(window.GeographyChipSpeech);
  }

  return import("./chip-speech.js?v=20260708-us-trail-capitals-phase2a-audio-1")
    .then(() => window.GeographyChipSpeech || null);
}

function setAudioMutedSetting(isMuted) {
  return ensureChipSpeechLoaded()
    .then((chipSpeech) => {
      if (chipSpeech?.setAudioMuted) {
        chipSpeech.setAudioMuted(isMuted);
      } else {
        try {
          localStorage.setItem("atlasQuestAudioMuted", String(Boolean(isMuted)));
        } catch {
          // Keep the visible control in sync even if storage is unavailable.
        }
      }
      updateAudioMuteControl();
    });
}

function toggleAudioMute() {
  void setAudioMutedSetting(!getAudioMutedSetting());
  updateAudioMuteControl();
}

function showAudioInstructionText(message) {
  const text = String(message || "").trim();

  if (!audioInstructionBanner || !text) {
    return;
  }

  window.clearTimeout(audioInstructionHideTimer);
  window.clearTimeout(dailyTrailTransitionNoticeTimer);
  dailyTrailTransitionNoticeTimer = null;
  audioInstructionBanner.textContent = text;
  audioInstructionBanner.hidden = false;
  audioInstructionBanner.classList.remove("daily-trail-transition-banner");

  audioInstructionHideTimer = window.setTimeout(() => {
    hideAudioInstructionBanner();
  }, audioInstructionVisibleDurationMs);
}

function hideAudioInstructionBanner() {
  window.clearTimeout(audioInstructionHideTimer);
  audioInstructionHideTimer = null;
  window.clearTimeout(memoryTrailInstructionBannerTimer);
  memoryTrailInstructionBannerTimer = null;
  window.clearTimeout(dailyTrailTransitionNoticeTimer);
  dailyTrailTransitionNoticeTimer = null;

  if (audioInstructionBanner) {
    audioInstructionBanner.hidden = true;
    audioInstructionBanner.textContent = "";
    audioInstructionBanner.classList.remove("memory-trail-instruction-banner", "daily-trail-transition-banner");
  }
}

function playInstructionOnce(instructionKey, phrase, options = {}) {
  if (!instructionKey || audioInstructionState.playedKeys.has(instructionKey)) {
    return Promise.resolve(false);
  }

  audioInstructionState.playedKeys.add(instructionKey);
  showAudioInstructionText(phrase);

  return ensureChipSpeechLoaded().then((chipSpeech) => {
    const speech = chipSpeech || window.GeographyChipSpeech;

    if (speech?.getAudioMuted?.()) {
      return false;
    }

    if (options.awaitCompletion && speech?.speakLabelAndWait) {
      return speech.speakLabelAndWait(phrase, {
        queue: true,
        warnOnAudioFailure: options.warnOnAudioFailure === true
      }).catch((error) => {
        if (options.warnOnAudioFailure) {
          console.warn("[atlas-quest-instruction-audio] Instruction playback failed.", error);
        }
        return false;
      });
    }

    return speech?.speakLabel?.(phrase) || false;
  }).catch((error) => {
    if (options.warnOnAudioFailure) {
      console.warn("[atlas-quest-instruction-audio] Instruction playback failed.", error);
    }
    return false;
  });
}

function playFirstChipInstructionIfNeeded() {
  if (!isActiveGameplayScreen() || isCurrentActivityComplete()) {
    return;
  }

  playGameplayInstructionOnce("tap-matching-place", audioInstructionPhrases.tapMatchingPlace);
}

function setHeaderTitle(fullTitle, options = {}) {
  if (!title) {
    return;
  }

  const normalizedTitle = String(fullTitle || "").trim();
  const shortTitle = options.shortTitle
    || normalizedTitle.split(" -> ").filter(Boolean).pop()
    || normalizedTitle
    || APP_NAME;

  title.textContent = isCompactTouchLayout() ? shortTitle : normalizedTitle;
  title.title = normalizedTitle;
  title.dataset.shortTitle = shortTitle;
}

function refreshHeaderTitleForLayout() {
  if (!title?.title) {
    return;
  }

  title.textContent = isCompactTouchLayout()
    ? title.dataset.shortTitle || title.title.split(" -> ").filter(Boolean).pop() || title.title
    : title.title;

  if (session) {
    updateProgress();
  }
}

function setActiveActivityHeaderTitle(activity = session?.currentActivity, options = {}) {
  const activityTitle = getActivityHeaderDisplayName(activity);
  setHeaderTitle(activityTitle, {
    shortTitle: activityTitle,
    ...options
  });
}

function getDailyTrailHeaderLabel(dailyTrailSession = activeDailyTrailSession) {
  const goal = getDailyTrailGoal(dailyTrailSession?.trailId || dailyTrailSession?.plan?.trailGoalId || "");
  const journey = journeyPresets.find((candidate) => candidate.id === (goal?.journeyId || dailyTrailSession?.journeyId)) || null;
  const labelSource = [
    goal?.title,
    journey?.title,
    goal?.id,
    journey?.id
  ].filter(Boolean).join(" ").toLowerCase();

  if (/\b(u\.?s\.?|united states|us-capitals)\b/.test(labelSource)) {
    return "United States";
  }

  if (/\b(world|continents|oceans|geography)\b/.test(labelSource)) {
    return "World Geography";
  }

  return "Daily Trail";
}

function setDailyTrailGameplayHeaderTitle(dailyTrailSession = activeDailyTrailSession) {
  const label = getDailyTrailHeaderLabel(dailyTrailSession);
  setHeaderTitle(label, { shortTitle: label });
}

function getActivityHeaderDisplayName(activity = session?.currentActivity) {
  const hierarchyNode = getHierarchyNode(activeHierarchyNodeId);
  const hierarchyActivityLabel = hierarchyNode?.activityId === activity?.id
    ? hierarchyNode.activityLabel || hierarchyNode.label
    : "";
  const title = hierarchyActivityLabel
    || getActivitySectionDisplayName(activity)
    || activity?.title
    || selectedActivityId
    || "Activity";

  return String(title).trim() || "Activity";
}

function getActivitySectionDisplayName(activity = session?.currentActivity) {
  const id = String(activity?.id || "");
  const usCombinedMatch = id.match(/^us-states-capitals-(\d{2})$/);
  if (usCombinedMatch) {
    const section = US_STATE_CAPITAL_SECTIONS.find((item) => item.id === usCombinedMatch[1]);
    return section ? `${section.label} States` : "";
  }

  return "";
}

const mainMenuLaunchButton = document.querySelector("#main-menu-launch-button");
const appShellPlaceholderCard = document.querySelector("#app-shell-placeholder-card");
const appShellPlaceholderTitle = document.querySelector("#app-shell-placeholder-title");
const appShellPlaceholderMessage = document.querySelector("#app-shell-placeholder-message");
const journeyPresetList = document.querySelector("#journey-preset-list");
const journeyShellContent = document.querySelector("#journey-shell-content");
const journeyCompletionOverlay = document.querySelector("#journey-completion-overlay");
const journeyCompletionCard = document.querySelector(".journey-completion-card");
const journeyCompletionKicker = document.querySelector("#journey-completion-kicker");
const journeyCompletionTitle = document.querySelector("#journey-completion-title");
const journeyCompletionMessage = document.querySelector("#journey-completion-message");
const journeyCompletionNext = document.querySelector("#journey-completion-next");
const journeyCompletionPrimary = document.querySelector("#journey-completion-primary");
const journeyCompletionSecondary = document.querySelector("#journey-completion-secondary");
const journeyCompletionFeedback = document.querySelector("#journey-completion-feedback");
const activityRetryOverlay = document.querySelector("#activity-retry-overlay");
const activityRetryMessage = document.querySelector("#activity-retry-message");
const activityRetryStudyButton = document.querySelector("#activity-retry-study-button");
const activityRetryAgainButton = document.querySelector("#activity-retry-again-button");
const memoryTrailOverlay = document.querySelector("#memory-trail-overlay");
const memoryTrailTitle = document.querySelector("#memory-trail-title");
const memoryTrailMessage = document.querySelector("#memory-trail-message");
const memoryTrailInfoButton = document.querySelector("#memory-trail-info-button");
const memoryTrailInfoCopy = document.querySelector("#memory-trail-info-copy");
const memoryTrailPrimaryButton = document.querySelector("#memory-trail-primary-button");
const memoryTrailSecondaryButton = document.querySelector("#memory-trail-secondary-button");
const unitedStatesAtlasProfile = document.querySelector("#united-states-atlas-profile");
const unitedStatesAtlasOverview = document.querySelector("#united-states-atlas-overview");
let unitedStatesAtlasProgress = null;

const journeyDifficultyOptions = [
  {
    id: "easy",
    title: "Easy",
    mode: "Learn",
    bullets: [
      "Most visual help",
      "Best for first exposure",
      "Hints and supportive feedback"
    ]
  },
  {
    id: "medium",
    title: "Medium",
    mode: "Practice",
    bullets: [
      "Less help",
      "Good default challenge",
      "Still supportive"
    ]
  },
  {
    id: "hard",
    title: "Hard",
    mode: "Challenge",
    bullets: [
      "Minimal help",
      "Best for confident review",
      "Later this will be the main trophy-run mode"
    ]
  }
];

const defaultQuickStartJourneyId = "world-geography-core";
const defaultQuickStartDifficulty = difficultyModes.easy;

function createActivityShellCatalog() {
  const shellActivities = activityDataPaths.map((path, index) => {
    const id = path.split("/").pop().replace(/\.json$/i, "");
    const node = getHierarchyNode(findHierarchyNodeForActivity(id));

    return {
      id,
      sequence: Number(id.match(/-(\d+)$/)?.[1]) || index + 1,
      title: node?.activityLabel || formatActivityShellTitle(id),
      targets: [],
      itemCount: 0,
      mapSet: getHierarchyMenuRoot(node?.id)?.id || defaultMapSet,
      sortOrder: index + 1,
      category: node?.category || ""
    };
  });

  return expandDerivedActivityData(shellActivities);
}

function formatActivityShellTitle(activityId = "") {
  return activityId
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getPerformanceDebugEnabled() {
  try {
    const params = new URLSearchParams(window.location.search);
    return params.has("perfDebug") || localStorage.getItem("mappa-mundi-perf-debug") === "true";
  } catch {
    return false;
  }
}

function markPerf(name) {
  if (!getPerformanceDebugEnabled()) {
    return;
  }

  try {
    performance.mark(name);
  } catch {
    // Performance marks are optional diagnostics.
  }
}

function logPerfMeasure(label, startMark, endMark) {
  if (!getPerformanceDebugEnabled()) {
    return;
  }

  try {
    performance.measure(label, startMark, endMark);
    const measure = performance.getEntriesByName(label).at(-1);
    console.info(`[mappa-perf] ${label}: ${Math.round(measure.duration)}ms`);
  } catch {
    // Keep debug logging best-effort only.
  }
}

function loadStylesheetOnce(href) {
  if (document.querySelector(`link[href="${href}"]`)) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    link.onload = () => resolve();
    link.onerror = () => reject(new Error(`Could not load stylesheet: ${href}`));
    document.head.appendChild(link);
  });
}

function loadScriptOnce(src, globalName) {
  if (globalName && window[globalName]) {
    return Promise.resolve(window[globalName]);
  }

  const existing = document.querySelector(`script[src="${src}"]`);
  if (existing) {
    return new Promise((resolve, reject) => {
      existing.addEventListener("load", () => resolve(globalName ? window[globalName] : undefined), { once: true });
      existing.addEventListener("error", () => reject(new Error(`Could not load script: ${src}`)), { once: true });
    });
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.onload = () => resolve(globalName ? window[globalName] : undefined);
    script.onerror = () => reject(new Error(`Could not load script: ${src}`));
    document.head.appendChild(script);
  });
}

async function ensureMapRuntimeLoaded() {
  if (mapRuntimeReady) {
    return;
  }

  if (!mapRuntimePromise) {
    markPerf("mappa-map-runtime-start");
    mapRuntimePromise = Promise.all([
      loadStylesheetOnce(mapLibreStylesheetUrl),
      loadScriptOnce(mapLibreScriptUrl, "maplibregl"),
      import("./map-engines/activity-normalizer.js?v=20260601-instruction-target-nouns"),
      import("./maplibre/activity-session.js?v=20260601-instruction-target-nouns"),
      import("./maplibre/maplibre-activity-runner.js?v=20260711-us-atlas-2c-1"),
      import("./chip-speech.js?v=20260708-us-trail-capitals-phase2a-audio-1")
    ]).then(([
      ,
      ,
      normalizerModule,
      sessionModule,
      runnerModule
    ]) => {
      normalizeActivityData = normalizerModule.normalizeActivity;
      ActivitySessionClass = sessionModule.ActivitySession;
      MapLibreActivityRunnerClass = runnerModule.MapLibreActivityRunner;
      mapRuntimeReady = true;
      markPerf("mappa-map-runtime-end");
      logPerfMeasure("initial JS load time", "mappa-map-runtime-start", "mappa-map-runtime-end");
    });
  }

  await mapRuntimePromise;
}

async function ensureActivityDataLoaded() {
  if (activityDataReady) {
    return;
  }

  if (!activityDataPromise) {
    markPerf("mappa-activity-data-start");
    activityDataPromise = Promise.all(activityDataPaths.map((path) => fetchJson(path)))
      .then((loadedActivities) => {
        activities = expandDerivedActivityData(loadedActivities).map((activity) => normalizeMapLibrePocActivity(activity));
        activityDataReady = true;
        markPerf("mappa-activity-data-end");
        logPerfMeasure("activity data load time", "mappa-activity-data-start", "mappa-activity-data-end");
      });
  }

  await activityDataPromise;
}

async function ensureMapReady() {
  if (runner && session) {
    return;
  }

  if (!mapReadyPromise) {
    markPerf("mappa-map-init-start");
    mapReadyPromise = (async () => {
      await ensureMapRuntimeLoaded();
      await ensureActivityDataLoaded();

      const [worldCountries, supplementalWorldCountries, oceanZones, coContinentOverrides, coContinentLand, inlandWaters, coastalWaterMask, mountainRanges, riverLines, usStatesAtlas, stateTargets, northAmericaAdmin1, australiaAdmin1, chinaAdmin1, russiaAdmin1, indiaAdmin1, brazilAdmin1, japanAdmin1, germanyAdmin1, franceAdmin1, spainAdmin1, italyAdmin1, unitedKingdomAdmin1] = await Promise.all([
        fetchJson(worldCountriesPath),
        Promise.all(worldCountrySupplements.map((path) => fetchJson(path))),
        fetchJson(oceanZonesPath),
        fetchOptionalJson(coContinentOverridesPath, { overrides: [] }),
        fetchOptionalJson(coContinentLandPath, null),
        fetchJson(inlandWatersPath),
        fetchJson(coastalWaterMaskPath),
        fetchJson(mountainRangesPath),
        fetchJson(riverLinesPath),
        fetchJson(usStatesAtlasPath),
        fetchJson(stateGeoJsonPath),
        fetchJson(northAmericaAdmin1Path),
        fetchJson(australiaAdmin1Path),
        fetchJson(chinaAdmin1Path),
        fetchJson(russiaAdmin1Path),
        fetchJson(indiaAdmin1Path),
        fetchJson(brazilAdmin1Path),
        fetchJson(japanAdmin1Path),
        fetchJson(germanyAdmin1Path),
        fetchJson(franceAdmin1Path),
        fetchJson(spainAdmin1Path),
        fetchJson(italyAdmin1Path),
        fetchJson(unitedKingdomAdmin1Path)
      ]);
      const mergedWorldCountries = mergeFeatureCollections(worldCountries, supplementalWorldCountries);

      session = new ActivitySessionClass(getSelectedActivity(), {
        activityCatalog: activities,
        studyMode: studyModes.cumulative
      });
      runner = new MapLibreActivityRunnerClass({
        maplibregl: window.maplibregl,
        container: "map"
      });

      runner.setCameraDevOverrideProvider?.(getCameraDevOverrideForRequest);
      runner.onCameraDevStateChange?.(() => {
        updateCameraDevPanel();
      });
      runner.onCameraTraceEvent?.((event) => {
        recordCameraDevTraceEvent(event);
      });
      runner.onRegionSelect(handleRunnerRegionSelect);
      runner.onTargetClick(handleTargetClick);
      await runner.load({
        activity: session.activity,
        worldCountries: mergedWorldCountries,
        oceanZones,
        coContinentOverrides,
        coContinentLand,
        inlandWaters,
        coastalWaterMask,
        mountainRanges,
        riverLines,
        usStatesAtlas,
        stateTargets,
        northAmericaAdmin1,
        australiaAdmin1,
        chinaAdmin1,
        russiaAdmin1,
        indiaAdmin1,
        brazilAdmin1,
        japanAdmin1,
        germanyAdmin1,
        franceAdmin1,
        spainAdmin1,
        italyAdmin1,
        unitedKingdomAdmin1
      });
      bindCameraDevMapEvents();
      runner.setDifficulty(getEffectiveDifficulty(session.currentActivity));
      markPerf("mappa-map-init-end");
      logPerfMeasure("map initialization time", "mappa-map-init-start", "mappa-map-init-end");
    })();
  }

  await mapReadyPromise;
}

function handleRunnerRegionSelect(activityId) {
  if (!activityId) {
    return;
  }

  if (getHierarchyNode(activityId)) {
    drillToHierarchyNode(activityId);
    return;
  }

  const supplementalEntry = supplementalOverviewEntries.find((entry) => entry.id === activityId);

  if (supplementalEntry?.launch?.type === "legacy") {
    openLegacyActivity(supplementalEntry.launch.activityId);
    return;
  }

  if (supplementalEntry?.launch?.type === "journey") {
    openJourneyFromOverview(supplementalEntry.launch.journeyId);
    return;
  }

  const hierarchyNodeId = findHierarchyNodeForActivity(activityId);
  if (hierarchyNodeId) {
    drillToHierarchyNode(hierarchyNodeId);
  } else {
    selectActivity(activityId);
  }
}

function scheduleIdleWork(callback) {
  if (typeof window.requestIdleCallback === "function") {
    window.requestIdleCallback(callback, { timeout: 2500 });
    return;
  }

  window.setTimeout(callback, 500);
}

async function init() {
  document.title = document.body.classList.contains("launch-mode") ? LANDING_PAGE_TITLE : APP_NAME;
  if (launchTitle) {
    launchTitle.textContent = APP_NAME;
  }

  bindLaunchStartEvents();

  bindLaunchScreenEvents();
  bindDailyTrailDevCheatListener();
  bindCameraDevCheatListener();
  bindUiEvents();
  bindZoomControls();
  configureFeedbackLinks();
  setBrowseDrawerOpen(false);
  updateActivityNavigationControls();
  updateAudioMuteControl();

  const riverPreviewOptions = getRiverPreviewUrlOptions();
  if (riverPreviewOptions) {
    showRiverPreviewSurface();
    await openRiverPreview(riverPreviewOptions);
    return;
  }

  const mountainFindDevOptions = getMountainFindDevUrlOptions();
  if (mountainFindDevOptions) {
    await startMountainFindDev(mountainFindDevOptions);
    return;
  }

  if (getMemoryTrailDebugUrlMode() === "old-review-outline") {
    await startDailyTrailOldReviewOutlineDebugFixture();
    return;
  }

  const initialActivityId = getInitialActivityFromUrl();

  if (initialActivityId) {
    void openActivity(initialActivityId, { forceGameplayVisible: true });
  } else if (window.__mappaMundiSettingsRequested) {
    showSettingsScreen({ track: false });
  } else if (window.__mappaMundiLaunchRequested) {
    trackEvent("launch_start_pressed");
    showAppScreen("main-menu", { pushHistory: false });
  } else {
    showAppScreen("launch", { pushHistory: false });
  }
}

function configureFeedbackLinks() {
  [mainMenuFeedbackLink, journeyCompletionFeedback].forEach((link) => {
    if (!link) {
      return;
    }

    link.href = feedbackFormUrl;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.addEventListener("click", () => {
      trackEvent("feedback_clicked", {
        source_screen: currentAppScreen
      });
    });
  });
}

function expandDerivedActivityData(rawActivities) {
  const expandedActivities = rawActivities.flatMap((activity) => {
    if (!activity?.id?.startsWith("us-states-capitals-")) {
      return [activity];
    }

    return [
      activity,
      ...createDerivedUsStateCapitalActivities(activity)
    ];
  });

  return appendDerivedUsMountainRangesActivity(expandedActivities);
}

function appendDerivedUsMountainRangesActivity(activitiesToExpand) {
  if (activitiesToExpand.some((activity) => activity?.id === "us-mountain-ranges")) {
    return activitiesToExpand;
  }

  const sectionActivityIds = [
    "us-physical-western-mountains",
    "us-physical-eastern-mountains",
    "us-physical-midwestern-mountains",
    "us-physical-alaska-mountains"
  ];
  const sectionActivities = sectionActivityIds
    .map((activityId) => activitiesToExpand.find((activity) => activity?.id === activityId))
    .filter(Boolean);

  if (sectionActivities.length !== sectionActivityIds.length) {
    return activitiesToExpand;
  }

  const sectionTargets = sectionActivities.map((activity) => activity.targets || activity.features || []);
  const targets = sectionTargets.flat();
  const firstSection = sectionActivities[0];

  return [
    ...activitiesToExpand,
    {
      ...firstSection,
      id: "us-mountain-ranges",
      title: "U.S. Mountain Ranges",
      targetNoun: "mountain range",
      promptText: "Name these mountain ranges",
      visibleAnswerLimit: 8,
      memoryTrailNewTargetLimit: 8,
      memoryTrailRequireAllTargets: true,
      memoryTrailAutoStart: true,
      map: {
        ...(firstSection.map || {}),
        regionView: firstSection.map?.regionView || { center: [-114.8, 41.2], zoom: 3.2 },
        studyView: firstSection.map?.studyView || {
          bounds: [[-125.5, 31.4], [-103.2, 49.3]],
          padding: { top: 58, right: 58, bottom: 96, left: 58 },
          duration: 1050
        }
      },
      memoryTrailSections: sectionActivities.map((activity, index) => {
        const activityTargets = sectionTargets[index] || [];

        return {
          id: activity.id,
          title: activity.title,
          targetIds: activityTargets.map((target) => target.id).filter(Boolean),
          map: activity.map || null
        };
      }),
      features: targets,
      targets: undefined
    }
  ];
}

function createDerivedUsStateCapitalActivities(activity) {
  const sectionId = activity.id.replace("us-states-capitals-", "");
  const section = US_STATE_CAPITAL_SECTIONS.find((candidate) => candidate.id === sectionId);
  const sectionLabel = section?.label || `Section ${Number(activity.sequence) || sectionId}`;
  const stateTargets = (activity.features || activity.targets || []).filter((target) => (
    target.type === "state" || target.type === "federal-district"
  ));
  const stateTargetsByAbbreviation = new Map(stateTargets.map((target) => [target.state, target]));
  const capitalTargets = (activity.features || activity.targets || [])
    .filter((target) => target.type === "capital")
    .map((target) => {
      const stateTarget = stateTargetsByAbbreviation.get(target.state);

      return {
        ...target,
        name: target.city || target.name,
        completedLabelName: target.name,
        easyAcceptShapeTargetId: stateTarget?.id || null,
        easyHitRadius: Math.max(target.hitRadius || 14, 24),
        mediumHitRadius: 16,
        hardHitRadius: 12
      };
    });

  return [
    {
      ...activity,
      id: `us-states-${sectionId}`,
      title: `${sectionLabel} States`,
      cumulativeGroup: "us-states",
      targetNoun: stateTargets.some((target) => target.type === "federal-district")
        ? "state or federal district"
        : "state",
      features: stateTargets,
      targets: undefined
    },
    {
      ...activity,
      id: `us-capitals-${sectionId}`,
      title: `${sectionLabel} Capitals`,
      cumulativeGroup: "us-capitals",
      targetNoun: "capital city",
      features: capitalTargets,
      targets: undefined
    }
  ];
}

function normalizeMapLibrePocActivity(rawActivity) {
  const region = rawActivity.map?.region || inferActivityRegion(rawActivity.id);
  const mapDefaults = getMapDefaults(rawActivity, region);
  const metadata = getActivityMetadata(rawActivity, region, mapDefaults);
  const normalized = normalizeActivityData(rawActivity, {
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
      },
      {
        id: "australia-admin1",
        type: "geojson",
        url: australiaAdmin1Path,
        promoteId: "id",
        attribution: "Natural Earth public domain"
      },
      {
        id: "china-admin1",
        type: "geojson",
        url: chinaAdmin1Path,
        promoteId: "id",
        attribution: "Natural Earth public domain"
      },
      {
        id: "russia-admin1",
        type: "geojson",
        url: russiaAdmin1Path,
        promoteId: "id",
        attribution: "Natural Earth public domain"
      },
      {
        id: "india-admin1",
        type: "geojson",
        url: indiaAdmin1Path,
        promoteId: "id",
        attribution: "Natural Earth public domain"
      },
      {
        id: "brazil-admin1",
        type: "geojson",
        url: brazilAdmin1Path,
        promoteId: "id",
        attribution: "Natural Earth public domain"
      },
      {
        id: "japan-admin1",
        type: "geojson",
        url: japanAdmin1Path,
        promoteId: "id",
        attribution: "Natural Earth public domain"
      },
      {
        id: "germany-admin1",
        type: "geojson",
        url: germanyAdmin1Path,
        promoteId: "id",
        attribution: "Natural Earth public domain"
      },
      {
        id: "france-admin1",
        type: "geojson",
        url: franceAdmin1Path,
        promoteId: "id",
        attribution: "Natural Earth public domain"
      },
      {
        id: "spain-admin1",
        type: "geojson",
        url: spainAdmin1Path,
        promoteId: "id",
        attribution: "Natural Earth public domain"
      },
      {
        id: "italy-admin1",
        type: "geojson",
        url: italyAdmin1Path,
        promoteId: "id",
        attribution: "Natural Earth public domain"
      },
      {
        id: "united-kingdom-admin1",
        type: "geojson",
        url: unitedKingdomAdmin1Path,
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
    sortOrder: metadata.sortOrder,
    hideFromActivityCatalog: metadata.hideFromActivityCatalog
  };
}

function inferActivityRegion(activityId = "") {
  if (activityId.startsWith("us-")) {
    return "united-states";
  }

  if (activityId.startsWith("russia-") && activityId.endsWith("-federal-subjects")) {
    return activityId;
  }

  if (activityId.startsWith("india-") && activityId.endsWith("-political-divisions")) {
    return activityId;
  }

  if (activityId.startsWith("brazil-") && activityId.endsWith("-political-divisions")) {
    return activityId;
  }

  if (activityId.startsWith("japan-") && activityId.endsWith("-political-divisions")) {
    return activityId;
  }

  if (activityId.startsWith("germany-") && activityId.endsWith("-political-divisions")) {
    return activityId;
  }

  if (activityId.startsWith("france-") && activityId.endsWith("-political-divisions")) {
    return activityId;
  }

  if (activityId.startsWith("spain-") && activityId.endsWith("-political-divisions")) {
    return activityId;
  }

  if (activityId.startsWith("italy-") && activityId.endsWith("-political-divisions")) {
    return activityId;
  }

  if (activityId.startsWith("united-kingdom-") && activityId.endsWith("-political-divisions")) {
    return activityId;
  }

  const regionByActivityId = {
    "western-european-countries": "western-europe",
    "world-core-americas-countries": "world-core-americas",
    "world-core-europe-countries": "world-core-europe",
    "world-core-africa-countries": "world-core-africa",
    "world-core-west-central-south-asia-countries": "world-core-west-central-south-asia",
    "world-core-east-southeast-asia-oceania-countries": "world-core-east-southeast-asia-oceania",
    "european-cities": "western-europe",
    "former-soviet-republics-review": "former-soviet-republics-review",
    "continents-oceans": "continents-oceans",
    "world-cities-east-south-asia": "world-cities-east-south-asia",
    "world-cities-europe-eastern-mediterranean": "world-cities-europe-eastern-mediterranean",
    "world-cities-middle-east-north-africa": "world-cities-middle-east-north-africa",
    "world-cities-mesoamerica": "world-cities-mesoamerica",
    "nordic-countries": "nordic-countries",
    "baltic-countries": "baltic-countries",
    "balkans": "balkans",
    "central-european-countries": "central-europe",
    "more-central-european-countries": "more-central-europe",
    "eastern-europe-countries": "eastern-europe",
    "southern-africa-countries": "southern-africa",
    "more-southern-africa-countries": "more-southern-africa",
    "north-africa-countries": "north-africa",
    "west-africa-countries": "west-africa",
    "more-west-africa-countries": "more-west-africa",
    "central-africa-countries": "central-africa",
    "east-africa-countries": "east-africa",
    "middle-east-countries": "middle-east",
    "central-america": "central-america",
    "central-asia": "central-asia",
    "caucasus-countries": "caucasus",
    "south-america-west": "south-america-west",
    "south-america-east": "south-america-east",
    "caribbean": "caribbean",
    "south-asia-countries": "south-asia",
    "east-asia-countries": "east-asia",
    "china-north-northeast-political-divisions": "china-north-northeast-political-divisions",
    "china-east-political-divisions": "china-east-political-divisions",
    "china-south-central-political-divisions": "china-south-central-political-divisions",
    "china-southwest-political-divisions": "china-southwest-political-divisions",
    "china-northwest-political-divisions": "china-northwest-political-divisions",
    "mainland-southeast-asia-countries": "mainland-southeast-asia",
    "maritime-southeast-asia-countries": "maritime-southeast-asia",
    "oceania-pacific-countries": "oceania-pacific",
    "australia-states-territories": "australia-states-territories",
    "canada-atlantic-provinces": "canada-atlantic-provinces",
    "canada-central-canada": "canada-central-canada",
    "canada-prairie-provinces": "canada-prairie-provinces",
    "canada-western-northern": "canada-western-northern",
    "mexico-northwest": "mexico-northwest",
    "mexico-northeast": "mexico-northeast",
    "mexico-west-bajio": "mexico-west-bajio",
    "mexico-central": "mexico-central",
    "mexico-south-gulf-yucatan": "mexico-south-gulf-yucatan",
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
    const sectionView = US_STATE_CAPITAL_SECTION_VIEWS[Number(rawActivity.sequence)];

    return {
      ...commonDefaults,
      regionView: sectionView?.regionView || { center: [-98, 39], zoom: 3.1 },
      studyView: sectionView?.studyView || {
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
    "world-core-americas": {
      regionView: { center: [-82, 16], zoom: 1.55 },
      studyView: {
        bounds: [[-168, -58], [-34, 72]],
        padding: { top: 54, right: 54, bottom: 86, left: 54 },
        duration: 1050
      }
    },
    "world-core-europe": {
      regionView: { center: [28, 55], zoom: 2.0 },
      studyView: {
        bounds: [[-13, 34], [103, 72]],
        padding: { top: 54, right: 54, bottom: 86, left: 54 },
        duration: 1050
      }
    },
    "world-core-africa": {
      regionView: { center: [19, 2], zoom: 2.1 },
      studyView: {
        bounds: [[-18, -36], [53, 38]],
        padding: { top: 54, right: 54, bottom: 86, left: 54 },
        duration: 1050
      }
    },
    "world-core-west-central-south-asia": {
      regionView: { center: [61, 28], zoom: 2.25 },
      studyView: {
        bounds: [[25, 5], [96, 56]],
        padding: { top: 54, right: 54, bottom: 86, left: 54 },
        duration: 1050
      }
    },
    "world-core-east-southeast-asia-oceania": {
      regionView: { center: [132, 1], zoom: 1.75 },
      studyView: {
        bounds: [[93, -49], [180, 49]],
        padding: { top: 54, right: 54, bottom: 86, left: 54 },
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
    "former-soviet-republics-review": {
      regionView: { center: [59, 49], zoom: 2.0 },
      studyView: {
        bounds: [[18.0, 34.0], [180.0, 73.0]],
        padding: { top: 54, right: 54, bottom: 86, left: 54 },
        duration: 1050
      }
    },
    "russia-central-federal-subjects": {
      regionView: { center: [38.0, 55.7], zoom: 5.0 },
      studyView: {
        bounds: [[29.0, 51.0], [43.5, 59.5]],
        padding: { top: 54, right: 54, bottom: 86, left: 54 },
        duration: 1050
      }
    },
    "russia-more-central-federal-subjects": {
      regionView: { center: [37.5, 52.4], zoom: 4.7 },
      studyView: {
        bounds: [[30.0, 49.0], [43.0, 56.5]],
        padding: { top: 54, right: 54, bottom: 86, left: 54 },
        duration: 1050
      }
    },
    "russia-northwest-federal-subjects": {
      regionView: { center: [32.0, 58.0], zoom: 3.85 },
      studyView: {
        bounds: [[18.0, 53.0], [61.0, 62.5]],
        padding: { top: 54, right: 54, bottom: 86, left: 54 },
        duration: 1050
      }
    },
    "russia-more-northwest-federal-subjects": {
      regionView: { center: [45.0, 64.8], zoom: 3.1 },
      studyView: {
        bounds: [[27.0, 58.5], [69.0, 70.5]],
        padding: { top: 54, right: 54, bottom: 86, left: 54 },
        duration: 1050
      }
    },
    "russia-southern-federal-subjects": {
      regionView: { center: [43.5, 46.2], zoom: 4.6 },
      studyView: {
        bounds: [[36.0, 43.0], [50.0, 50.0]],
        padding: { top: 54, right: 54, bottom: 86, left: 54 },
        duration: 1050
      }
    },
    "russia-north-caucasus-federal-subjects": {
      regionView: { center: [43.8, 43.5], zoom: 5.6 },
      studyView: {
        bounds: [[39.5, 41.0], [48.5, 45.5]],
        padding: { top: 54, right: 54, bottom: 86, left: 54 },
        duration: 1050
      }
    },
    "russia-volga-federal-subjects": {
      regionView: { center: [49.5, 56.2], zoom: 4.45 },
      studyView: {
        bounds: [[42.0, 53.0], [58.5, 60.0]],
        padding: { top: 54, right: 54, bottom: 86, left: 54 },
        duration: 1050
      }
    },
    "russia-more-volga-federal-subjects": {
      regionView: { center: [53.5, 53.5], zoom: 4.0 },
      studyView: {
        bounds: [[44.0, 50.0], [61.5, 59.5]],
        padding: { top: 54, right: 54, bottom: 86, left: 54 },
        duration: 1050
      }
    },
    "russia-ural-federal-subjects": {
      regionView: { center: [65.5, 60.0], zoom: 3.2 },
      studyView: {
        bounds: [[54.0, 53.0], [79.0, 68.5]],
        padding: { top: 54, right: 54, bottom: 86, left: 54 },
        duration: 1050
      }
    },
    "russia-siberia-federal-subjects": {
      regionView: { center: [91.0, 55.0], zoom: 2.7 },
      studyView: {
        bounds: [[74.0, 48.0], [107.5, 62.5]],
        padding: { top: 54, right: 54, bottom: 86, left: 54 },
        duration: 1050
      }
    },
    "russia-far-east-federal-subjects": {
      regionView: { center: [139.0, 53.5], zoom: 2.65 },
      studyView: {
        bounds: [[127.0, 42.0], [156.0, 64.5]],
        padding: { top: 54, right: 54, bottom: 86, left: 54 },
        duration: 1050
      }
    },
    "russia-more-far-east-federal-subjects": {
      regionView: { center: [132.0, 61.0], zoom: 1.75 },
      studyView: {
        bounds: [[101.0, 45.0], [180.0, 74.5]],
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
    "nordic-countries": {
      regionView: { center: [7, 62.5], zoom: 2.9 },
      studyView: {
        bounds: [[-25.5, 54.1], [33.8, 72.2]],
        padding: { top: 54, right: 54, bottom: 86, left: 54 },
        duration: 1050
      }
    },
    "baltic-countries": {
      regionView: { center: [24.8, 56.8], zoom: 4.4 },
      studyView: {
        bounds: [[20.5, 53.6], [28.5, 59.8]],
        padding: { top: 54, right: 54, bottom: 86, left: 54 },
        duration: 1050
      }
    },
    "balkans": {
      regionView: { center: [19.2, 43.5], zoom: 4.5 },
      studyView: {
        bounds: [[13.0, 39.2], [23.5, 47.1]],
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
    "germany-north-east-political-divisions": {
      regionView: { center: [11.2, 52.5], zoom: 5.0 },
      studyView: {
        bounds: [[6.5, 50.0], [15.5, 55.2]],
        padding: { top: 54, right: 54, bottom: 86, left: 54 },
        duration: 1050
      }
    },
    "germany-south-west-political-divisions": {
      regionView: { center: [8.9, 49.3], zoom: 5.0 },
      studyView: {
        bounds: [[5.5, 47.0], [13.8, 52.6]],
        padding: { top: 54, right: 54, bottom: 86, left: 54 },
        duration: 1050
      }
    },
    "france-northern-eastern-regions-political-divisions": {
      regionView: { center: [1.9, 48.0], zoom: 5.0 },
      studyView: {
        bounds: [[-5.6, 46.0], [8.5, 51.5]],
        padding: { top: 54, right: 54, bottom: 86, left: 54 },
        duration: 1050
      }
    },
    "france-southern-regions-political-divisions": {
      regionView: { center: [3.3, 44.3], zoom: 4.65 },
      studyView: {
        bounds: [[-2.0, 41.0], [9.8, 47.6]],
        padding: { top: 54, right: 54, bottom: 86, left: 54 },
        duration: 1050
      }
    },
    "spain-northern-central-political-divisions": {
      regionView: { center: [-3.9, 41.8], zoom: 5.0 },
      studyView: {
        bounds: [[-9.8, 39.0], [3.6, 43.9]],
        padding: { top: 54, right: 54, bottom: 86, left: 54 },
        duration: 1050
      }
    },
    "spain-southern-eastern-political-divisions": {
      regionView: { center: [-4.0, 35.6], zoom: 3.45 },
      studyView: {
        bounds: [[-18.5, 27.0], [5.0, 42.8]],
        padding: { top: 54, right: 54, bottom: 86, left: 54 },
        duration: 1050
      }
    },
    "italy-northern-regions-political-divisions": {
      regionView: { center: [10.6, 44.8], zoom: 5.2 },
      studyView: {
        bounds: [[6.2, 43.1], [14.4, 47.2]],
        padding: { top: 54, right: 54, bottom: 86, left: 54 },
        duration: 1050
      }
    },
    "italy-central-southern-regions-political-divisions": {
      regionView: { center: [13.2, 41.0], zoom: 4.6 },
      studyView: {
        bounds: [[8.8, 37.5], [18.7, 44.5]],
        padding: { top: 54, right: 54, bottom: 86, left: 54 },
        duration: 1050
      }
    },
    "italy-islands-political-divisions": {
      regionView: { center: [11.9, 39.0], zoom: 4.5 },
      studyView: {
        bounds: [[8.0, 35.3], [15.8, 41.5]],
        padding: { top: 54, right: 54, bottom: 86, left: 54 },
        duration: 1050
      }
    },
    "united-kingdom-countries-political-divisions": {
      regionView: { center: [-3.2, 54.7], zoom: 4.0 },
      studyView: {
        bounds: [[-8.7, 49.7], [2.0, 59.2]],
        padding: { top: 54, right: 54, bottom: 86, left: 54 },
        duration: 1050
      }
    },
    "eastern-europe": {
      regionView: { center: [26.5, 50.5], zoom: 3.35 },
      studyView: {
        bounds: [[13.5, 43.0], [41.5, 57.0]],
        padding: { top: 54, right: 54, bottom: 86, left: 54 },
        duration: 1050
      }
    },
    "southern-africa": {
      regionView: { center: [25.5, -17.6], zoom: 3.55 },
      studyView: {
        bounds: [[10.5, -25.5], [42, -8.0]],
        padding: { top: 54, right: 54, bottom: 86, left: 54 },
        duration: 1050
      }
    },
    "more-southern-africa": {
      regionView: { center: [34.5, -24.0], zoom: 3.0 },
      studyView: {
        bounds: [[15.0, -36.5], [51.0, -11.0]],
        padding: { top: 54, right: 54, bottom: 86, left: 54 },
        duration: 1050
      }
    },
    "north-africa": {
      regionView: { center: [12, 27], zoom: 2.55 },
      studyView: {
        bounds: [[-18.5, 12.0], [38.5, 37.8]],
        padding: { top: 54, right: 54, bottom: 86, left: 54 },
        duration: 1050
      }
    },
    "west-africa": {
      regionView: { center: [-10.2, 12.6], zoom: 3.55 },
      studyView: {
        bounds: [[-18.6, 5.0], [4.5, 22.0]],
        padding: { top: 54, right: 54, bottom: 86, left: 54 },
        duration: 1050
      }
    },
    "more-west-africa": {
      regionView: { center: [3.4, 10.5], zoom: 3.8 },
      studyView: {
        bounds: [[-9.5, 3.5], [15.0, 20.8]],
        padding: { top: 54, right: 54, bottom: 86, left: 54 },
        duration: 1050
      }
    },
    "central-africa": {
      regionView: { center: [18.8, 3.5], zoom: 3.3 },
      studyView: {
        bounds: [[7.0, -7.5], [32.8, 18.8]],
        padding: { top: 54, right: 54, bottom: 86, left: 54 },
        duration: 1050
      }
    },
    "east-africa": {
      regionView: { center: [37.0, 4.0], zoom: 3.3 },
      studyView: {
        bounds: [[28.0, -12.5], [52.5, 18.5]],
        padding: { top: 54, right: 54, bottom: 86, left: 54 },
        duration: 1050
      }
    },
    "middle-east": {
      regionView: { center: [43.5, 32.5], zoom: 3.0 },
      studyView: {
        bounds: [[25.5, 12.0], [64.5, 42.8]],
        padding: { top: 54, right: 54, bottom: 86, left: 54 },
        duration: 1050
      }
    },
    "central-america": {
      regionView: { center: [-85.2, 13.2], zoom: 4.25 },
      studyView: {
        bounds: [[-93.7, 7.0], [-77.0, 18.9]],
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
    "caucasus": {
      regionView: { center: [45, 41], zoom: 4.4 },
      studyView: {
        bounds: [[39.5, 38.0], [50.8, 43.8]],
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
    "brazil-north-political-divisions": {
      regionView: { center: [-58.5, -4.0], zoom: 3.25 },
      studyView: {
        bounds: [[-74.5, -13.8], [-45.0, 6.0]],
        padding: { top: 54, right: 54, bottom: 86, left: 54 },
        duration: 1050
      }
    },
    "brazil-northeast-political-divisions": {
      regionView: { center: [-40.0, -8.0], zoom: 4.15 },
      studyView: {
        bounds: [[-48.8, -18.5], [-34.5, -1.0]],
        padding: { top: 54, right: 54, bottom: 86, left: 54 },
        duration: 1050
      }
    },
    "brazil-central-west-political-divisions": {
      regionView: { center: [-53.5, -15.5], zoom: 4.0 },
      studyView: {
        bounds: [[-61.0, -24.5], [-45.0, -7.0]],
        padding: { top: 54, right: 54, bottom: 86, left: 54 },
        duration: 1050
      }
    },
    "brazil-southeast-political-divisions": {
      regionView: { center: [-45.5, -20.5], zoom: 4.6 },
      studyView: {
        bounds: [[-52.0, -25.0], [-39.0, -14.0]],
        padding: { top: 54, right: 54, bottom: 86, left: 54 },
        duration: 1050
      }
    },
    "brazil-south-political-divisions": {
      regionView: { center: [-51.5, -27.0], zoom: 5.0 },
      studyView: {
        bounds: [[-58.8, -34.2], [-47.0, -22.0]],
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
    "south-asia": {
      regionView: { center: [78, 24], zoom: 3.15 },
      studyView: {
        bounds: [[58.5, 5.5], [92.8, 38.9]],
        padding: { top: 54, right: 54, bottom: 86, left: 54 },
        duration: 1050
      }
    },
    "india-north-political-divisions": {
      regionView: { center: [77.0, 29.8], zoom: 4.25 },
      studyView: {
        bounds: [[68.0, 23.5], [82.5, 36.8]],
        padding: { top: 54, right: 54, bottom: 86, left: 54 },
        duration: 1050
      }
    },
    "india-west-central-political-divisions": {
      regionView: { center: [75.5, 20.8], zoom: 4.0 },
      studyView: {
        bounds: [[68.0, 14.5], [84.5, 27.2]],
        padding: { top: 54, right: 54, bottom: 86, left: 54 },
        duration: 1050
      }
    },
    "india-east-political-divisions": {
      regionView: { center: [85.8, 23.6], zoom: 4.7 },
      studyView: {
        bounds: [[82.0, 20.0], [90.5, 28.5]],
        padding: { top: 54, right: 54, bottom: 86, left: 54 },
        duration: 1050
      }
    },
    "india-northeast-political-divisions": {
      regionView: { center: [93.5, 25.5], zoom: 5.1 },
      studyView: {
        bounds: [[88.0, 21.5], [98.5, 29.8]],
        padding: { top: 54, right: 54, bottom: 86, left: 54 },
        duration: 1050
      }
    },
    "india-south-political-divisions": {
      regionView: { center: [78.4, 13.1], zoom: 4.4 },
      studyView: {
        bounds: [[73.0, 7.2], [84.8, 19.8]],
        padding: { top: 54, right: 54, bottom: 86, left: 54 },
        duration: 1050
      }
    },
    "india-islands-political-divisions": {
      regionView: { center: [82.0, 10.5], zoom: 3.1 },
      studyView: {
        bounds: [[71.0, 6.0], [94.5, 14.5]],
        padding: { top: 54, right: 54, bottom: 86, left: 54 },
        duration: 1050
      }
    },
    "east-asia": {
      regionView: { center: [113, 38], zoom: 2.25 },
      studyView: {
        bounds: [[73.0, 17.0], [146.5, 54.5]],
        padding: { top: 54, right: 54, bottom: 86, left: 54 },
        duration: 1050
      }
    },
    "japan-hokkaido-tohoku-political-divisions": {
      regionView: { center: [141.0, 40.5], zoom: 4.2 },
      studyView: {
        bounds: [[138.0, 36.5], [146.5, 45.8]],
        padding: { top: 54, right: 54, bottom: 86, left: 54 },
        duration: 1050
      }
    },
    "japan-kanto-political-divisions": {
      regionView: { center: [139.6, 35.9], zoom: 6.0 },
      studyView: {
        bounds: [[138.0, 34.8], [141.2, 37.2]],
        padding: { top: 54, right: 54, bottom: 86, left: 54 },
        duration: 1050
      }
    },
    "japan-chubu-political-divisions": {
      regionView: { center: [137.5, 36.1], zoom: 5.0 },
      studyView: {
        bounds: [[135.0, 34.2], [140.2, 38.6]],
        padding: { top: 54, right: 54, bottom: 86, left: 54 },
        duration: 1050
      }
    },
    "japan-kansai-political-divisions": {
      regionView: { center: [135.6, 34.7], zoom: 5.9 },
      studyView: {
        bounds: [[134.0, 33.3], [137.2, 35.9]],
        padding: { top: 54, right: 54, bottom: 86, left: 54 },
        duration: 1050
      }
    },
    "japan-chugoku-shikoku-political-divisions": {
      regionView: { center: [133.2, 34.3], zoom: 5.0 },
      studyView: {
        bounds: [[130.5, 32.6], [136.3, 35.9]],
        padding: { top: 54, right: 54, bottom: 86, left: 54 },
        duration: 1050
      }
    },
    "japan-kyushu-okinawa-political-divisions": {
      regionView: { center: [130.5, 29.8], zoom: 4.2 },
      studyView: {
        bounds: [[122.5, 23.5], [132.5, 34.0]],
        padding: { top: 54, right: 54, bottom: 86, left: 54 },
        duration: 1050
      }
    },
    "china-north-northeast-political-divisions": {
      regionView: { center: [117.0, 42.6], zoom: 3.0 },
      studyView: {
        bounds: [[96.0, 34.0], [135.5, 54.5]],
        padding: { top: 54, right: 54, bottom: 86, left: 54 },
        duration: 1050
      }
    },
    "china-east-political-divisions": {
      regionView: { center: [118.5, 31.5], zoom: 4.15 },
      studyView: {
        bounds: [[113.0, 23.0], [123.8, 39.5]],
        padding: { top: 54, right: 54, bottom: 86, left: 54 },
        duration: 1050
      }
    },
    "china-south-central-political-divisions": {
      regionView: { center: [111.6, 25.9], zoom: 4.0 },
      studyView: {
        bounds: [[104.0, 17.5], [116.5, 35.5]],
        padding: { top: 54, right: 54, bottom: 86, left: 54 },
        duration: 1050
      }
    },
    "china-southwest-political-divisions": {
      regionView: { center: [94.5, 29.0], zoom: 3.05 },
      studyView: {
        bounds: [[77.0, 20.5], [110.5, 34.8]],
        padding: { top: 54, right: 54, bottom: 86, left: 54 },
        duration: 1050
      }
    },
    "china-northwest-political-divisions": {
      regionView: { center: [91.5, 39.5], zoom: 2.75 },
      studyView: {
        bounds: [[73.0, 30.5], [111.5, 49.5]],
        padding: { top: 54, right: 54, bottom: 86, left: 54 },
        duration: 1050
      }
    },
    "mainland-southeast-asia": {
      regionView: { center: [101.8, 15.5], zoom: 3.7 },
      studyView: {
        bounds: [[92.0, 5.0], [110.8, 28.7]],
        padding: { top: 54, right: 54, bottom: 86, left: 54 },
        duration: 1050
      }
    },
    "maritime-southeast-asia": {
      regionView: { center: [115.5, 0.5], zoom: 3.1 },
      studyView: {
        bounds: [[94.0, -12.5], [127.8, 21.5]],
        padding: { top: 54, right: 54, bottom: 86, left: 54 },
        duration: 1050
      }
    },
    "oceania-pacific": {
      regionView: { center: [151, -18], zoom: 2.2 },
      studyView: {
        bounds: [[112.0, -49.5], [180.0, 15.5]],
        padding: { top: 54, right: 54, bottom: 86, left: 54 },
        duration: 1050
      }
    },
    "australia-states-territories": {
      regionView: { center: [134.5, -25.0], zoom: 3.35 },
      studyView: {
        bounds: [[112.0, -44.5], [154.5, -9.0]],
        padding: { top: 54, right: 54, bottom: 86, left: 54 },
        duration: 1050
      }
    },
    "canada-atlantic-provinces": {
      regionView: { center: [-60, 51], zoom: 3.05 },
      studyView: {
        bounds: [[-69.8, 43.0], [-51.5, 61.0]],
        padding: { top: 54, right: 54, bottom: 86, left: 54 },
        duration: 1050
      }
    },
    "canada-central-canada": {
      regionView: { center: [-77, 52], zoom: 2.65 },
      studyView: {
        bounds: [[-96.0, 41.0], [-56.5, 63.2]],
        padding: { top: 54, right: 54, bottom: 86, left: 54 },
        duration: 1050
      }
    },
    "canada-prairie-provinces": {
      regionView: { center: [-105, 54.5], zoom: 3.15 },
      studyView: {
        bounds: [[-121.0, 48.0], [-88.0, 61.0]],
        padding: { top: 54, right: 54, bottom: 86, left: 54 },
        duration: 1050
      }
    },
    "canada-western-northern": {
      regionView: { center: [-108, 66], zoom: 2.05 },
      studyView: {
        bounds: [[-142.0, 47.5], [-60.0, 83.8]],
        padding: { top: 54, right: 54, bottom: 86, left: 54 },
        duration: 1050
      }
    },
    "mexico-northwest": {
      regionView: { center: [-109.5, 27.5], zoom: 3.95 },
      studyView: {
        bounds: [[-119.0, 21.8], [-102.0, 33.2]],
        padding: { top: 54, right: 54, bottom: 86, left: 54 },
        duration: 1050
      }
    },
    "mexico-northeast": {
      regionView: { center: [-101, 25], zoom: 4.15 },
      studyView: {
        bounds: [[-104.8, 20.5], [-96.8, 30.2]],
        padding: { top: 54, right: 54, bottom: 86, left: 54 },
        duration: 1050
      }
    },
    "mexico-west-bajio": {
      regionView: { center: [-102.8, 20.5], zoom: 4.55 },
      studyView: {
        bounds: [[-107.2, 17.7], [-98.8, 23.4]],
        padding: { top: 54, right: 54, bottom: 86, left: 54 },
        duration: 1050
      }
    },
    "mexico-central": {
      regionView: { center: [-98.7, 19.4], zoom: 5.25 },
      studyView: {
        bounds: [[-100.9, 17.6], [-96.4, 21.1]],
        padding: { top: 54, right: 54, bottom: 86, left: 54 },
        duration: 1050
      }
    },
    "mexico-south-gulf-yucatan": {
      regionView: { center: [-94, 18.3], zoom: 4.05 },
      studyView: {
        bounds: [[-102.6, 14.2], [-86.3, 22.9]],
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

  if (rawActivity.id.startsWith("us-states-capitals-") || rawActivity.id.startsWith("us-states-") || rawActivity.id.startsWith("us-capitals-")) {
    const sectionNumber = Number(rawActivity.sequence);
    const isStateOnly = rawActivity.id.startsWith("us-states-");
    const isCapitalOnly = rawActivity.id.startsWith("us-capitals-");

    return {
      mapSet: "us",
      category: isCapitalOnly ? "Capitals" : isStateOnly ? "States" : "States & Capitals",
      sectionNumber,
      itemCount: featureCount,
      baseMap: "usa-map",
      previewBounds: mapDefaults.studyView.bounds,
      previewRegionId: rawActivity.id,
      description: getUsSectionDescription(sectionNumber, rawActivity.id),
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
    sortOrder: configured.sortOrder ?? rawActivity.sequence ?? 999,
    hideFromActivityCatalog: Boolean(configured.hideFromActivityCatalog)
  };
}

async function fetchJson(path) {
  const response = await fetch(path);

  if (!response.ok) {
    throw new Error(`${path} could not be loaded.`);
  }

  return response.json();
}

async function fetchOptionalJson(path, fallback = null) {
  try {
    const response = await fetch(path);

    if (!response.ok) {
      return fallback;
    }

    return response.json();
  } catch (error) {
    return fallback;
  }
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

    if (isGameplayNavigationLocked()) {
      showFeedback("Finish this activity first.");
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

    if (isGameplayNavigationLocked()) {
      showFeedback("Finish this activity first.");
      return;
    }

    if (card.dataset.launchType === "legacy") {
      closeBrowseDrawer();
      openLegacyActivity(card.dataset.legacyActivityId);
      return;
    }

    if (card.dataset.launchType === "journey") {
      closeBrowseDrawer();
      openJourneyFromOverview(card.dataset.journeyId || card.dataset.activityId);
      return;
    }

    const hierarchyNodeId = findHierarchyNodeForActivity(card.dataset.activityId);
    if (hierarchyNodeId) {
      drillToHierarchyNode(hierarchyNodeId);
    } else {
      selectActivity(card.dataset.activityId, { requireDifficulty: true });
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

  homeButton?.addEventListener("click", () => {
    if (currentAppScreen === "united-states-atlas") {
      exitUnitedStatesAtlas();
      return;
    }

    if (currentAppScreen === "daily-trail-gameplay") {
      exitDailyTrailGameplay();
      return;
    }

    if (currentAppScreen === "united-states-trail-gameplay") {
      exitUnitedStatesMemoryTrailGameplay();
      return;
    }

    if (currentAppScreen === "study-explore") {
      exitStudyExplore();
      return;
    }

    if (currentAppScreen === "study-practice") {
      returnToStudyScreen();
      return;
    }

    if (currentAppScreen === "journey-gameplay") {
      resetJourneyGameplayInstructionSession();
    }

    showAppScreen("main-menu");
  });
  backButton?.addEventListener("click", () => {
    if (currentAppScreen === "united-states-atlas") {
      exitUnitedStatesAtlas();
      return;
    }

    if (currentAppScreen === "study-explore") {
      exitStudyExplore();
      return;
    }

    if (currentAppScreen === "study-practice") {
      returnToStudyScreen();
      return;
    }

    if (activeJourneySession?.mode === "journey") {
      exitJourney();
      return;
    }

    if (currentAppScreen === "daily-trail-gameplay") {
      exitDailyTrailGameplay();
      return;
    }

    if (currentAppScreen === "united-states-trail-gameplay") {
      exitUnitedStatesMemoryTrailGameplay();
      return;
    }

    if (currentAppScreen === "free-play" && activeHierarchyNodeId === "world") {
      goBackAppScreen();
      return;
    }

    goBack();
  });
  browseButton?.addEventListener("click", toggleBrowseDrawer);
  browseCloseButton?.addEventListener("click", closeBrowseDrawer);
  journeyMemoryTrailButton?.addEventListener("click", startMemoryTrailFromJourneyGameplay);
  mainMenuDailyTrailButton?.addEventListener("click", openDailyTrailIntro);
  mainMenuUnitedStatesMemoryTrailButton?.addEventListener("click", startOrContinueUnitedStatesMemoryTrail);
  mainMenuUnitedStatesAtlasButton?.addEventListener("click", () => { void openUnitedStatesAtlas(); });
  mainMenuMoreWaysButton?.addEventListener("click", () => showAppScreen("main-menu-more-ways"));
  audioMuteButton?.addEventListener("click", toggleAudioMute);
  window.addEventListener("atlas-quest-audio-muted-change", updateAudioMuteControl);
  settingsButton?.addEventListener("click", () => {
    showSettingsScreen();
  });
  previousActivityButton?.addEventListener("click", openPreviousActivity);
  nextIncompleteButton?.addEventListener("click", openNextIncompleteActivity);
  resetButton.addEventListener("click", handleResetButtonClick);
  activityRetryStudyButton?.addEventListener("click", handleActivityRetryStudyChoice);
  activityRetryAgainButton?.addEventListener("click", handleActivityRetryAgainChoice);
  journeyCompletionPrimary?.addEventListener("click", handleJourneyCompletionPrimary);
  journeyCompletionSecondary?.addEventListener("click", handleJourneyCompletionSecondary);
  memoryTrailPrimaryButton?.addEventListener("click", handleMemoryTrailOverlayPrimary);
  memoryTrailSecondaryButton?.addEventListener("click", handleMemoryTrailOverlaySecondary);
  memoryTrailInfoButton?.addEventListener("click", toggleMemoryTrailInfo);
  document.addEventListener("pointerdown", handleDocumentInfoPointerDown, true);
  document.addEventListener("pointerover", handleDocumentInfoPointerOver);
  document.addEventListener("pointerout", handleDocumentInfoPointerOut);
  document.addEventListener("focusin", handleDocumentInfoFocusIn);
  document.addEventListener("focusout", handleDocumentInfoFocusOut);
  document.addEventListener("click", handleDocumentInfoClick);
  document.addEventListener("pointermove", handleDocumentPointerMove);
  document.addEventListener("pointerup", handleDocumentPointerUp);

  if (isContinentsOceansLearnCameraDebugEnabled()) {
    window.mappaDebugCoLearnCamera = {
      openDailyTrailIntro,
      startDailyTrailSession,
      getState: () => ({
        currentAppScreen,
        activityId: session?.currentActivity?.id || "",
        activeDailyTrailActivityId: activeDailyTrailSession?.activityId || "",
        memoryTrail: activeStudySession?.memoryTrail
          ? getMemoryTrailSessionStats(activeStudySession.memoryTrail)
          : null
      })
    };
  }

  document.addEventListener("pointercancel", cancelGrabbedAnswer);
  window.addEventListener("resize", refreshHeaderTitleForLayout);
  window.addEventListener("orientationchange", refreshHeaderTitleForLayout);
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      if (!memoryTrailOverlay?.hidden) {
        handleMemoryTrailOverlaySecondary();
        return;
      }

      closeInfoPopover();
      closeBrowseDrawer();
      cancelGrabbedAnswer();
    }
  });
}

function bindLaunchStartEvents() {
  if (launchStartEventsBound) {
    return;
  }

  launchStartEventsBound = true;
  launchStartButton?.addEventListener("click", handleLaunchStart);

  launchSettingsGear?.addEventListener("click", () => showSettingsScreen());
}

function bindLaunchScreenEvents() {
  if (launchScreenEventsBound) {
    return;
  }

  launchScreenEventsBound = true;
  bindLaunchStartEvents();

  appShellBackButton?.addEventListener("click", goBackAppScreen);
  appShellSettingsGear?.addEventListener("click", () => {
    showSettingsScreen();
  });
  mainMenuLearnButton?.addEventListener("click", () => {
    journeyPickerIntent = "learn";
    showAppScreen("choose-journey");
  });
  mainMenuChallengeButton?.addEventListener("click", () => {
    journeyPickerIntent = "challenge";
    showAppScreen("choose-journey");
  });
  mainMenuQuickStartButton?.addEventListener("click", startQuickStartJourney);
  mainMenuChooseButton?.addEventListener("click", () => {
    journeyPickerIntent = "learn";
    showAppScreen("choose-journey");
  });
  challengeMenuChooseButton?.addEventListener("click", () => {
    journeyPickerIntent = "challenge";
    showAppScreen("choose-journey");
  });
  mainMenuSettingsButton?.addEventListener("click", () => {
    showCustomizeScreen();
  });
  mainMenuLaunchButton?.addEventListener("click", () => {
    appScreenHistory = [];
    showAppScreen("launch", { pushHistory: false });
  });
}

function handleLaunchStart() {
  trackEvent("launch_start_pressed");
  showAppScreen("main-menu");
}

function normalizeJourneyDetailIntent(intent) {
  return intent === "learn" || intent === "challenge" ? intent : "neutral";
}

function showSettingsScreen(options = {}) {
  const shouldReturnToDailyTrailGameplay = currentAppScreen === "daily-trail-gameplay"
    && activeDailyTrailSession
    && activeStudySession?.memoryTrail?.source === "daily-trail";
  const shouldReturnToUnitedStatesMemoryTrailGameplay = currentAppScreen === "united-states-trail-gameplay"
    && activeUnitedStatesMemoryTrailSession
    && activeStudySession?.memoryTrail?.source === UNITED_STATES_MEMORY_TRAIL_SOURCE;

  if (options.track !== false) {
    trackEvent("settings_opened", {
      source_screen: currentAppScreen
    });
  }

  pendingDailyTrailGameplaySettingsReturn = shouldReturnToDailyTrailGameplay;
  pendingUnitedStatesMemoryTrailGameplaySettingsReturn = shouldReturnToUnitedStatesMemoryTrailGameplay;
  showAppScreen("settings", {
    pushHistory: !shouldReturnToDailyTrailGameplay && !shouldReturnToUnitedStatesMemoryTrailGameplay
  });
}

function showCustomizeScreen(options = {}) {
  if (options.track !== false) {
    trackEvent("settings_opened", {
      source_screen: currentAppScreen,
      settings_area: "customize"
    });
  }
  showAppScreen("customize");
}

function restoreDailyTrailGameplayFromSettings() {
  if (
    !pendingDailyTrailGameplaySettingsReturn
    || !activeDailyTrailSession
    || activeStudySession?.memoryTrail?.source !== "daily-trail"
  ) {
    return false;
  }

  pendingDailyTrailGameplaySettingsReturn = false;
  currentAppScreen = "daily-trail-gameplay";
  isCurrentActivityProgressDisabled = true;
  lastTrackedMainMenuVisibility = false;
  document.body.classList.remove("launch-mode", "app-shell-mode", "browse-mode", "overview-mode");
  document.body.classList.add("study-mode");
  document.title = APP_NAME;

  if (launchScreen) {
    launchScreen.hidden = true;
  }

  if (appShellScreen) {
    appShellScreen.hidden = true;
  }

  setDailyTrailGameplayHeaderTitle(activeDailyTrailSession);
  updateStudyInstruction();
  updateStudyCardDetails();
  updateProgress();
  updateDifficultyControls();
  renderStudyExplorePanel();
  renderActivityNavControls(session.currentActivity?.id);
  updateTopBarNavigation();
  updateResetControlVisibility();
  return true;
}

function restoreUnitedStatesMemoryTrailGameplayFromSettings() {
  if (
    !pendingUnitedStatesMemoryTrailGameplaySettingsReturn
    || !activeUnitedStatesMemoryTrailSession
    || activeStudySession?.memoryTrail?.source !== UNITED_STATES_MEMORY_TRAIL_SOURCE
  ) {
    return false;
  }

  pendingUnitedStatesMemoryTrailGameplaySettingsReturn = false;
  currentAppScreen = "united-states-trail-gameplay";
  isCurrentActivityProgressDisabled = true;
  lastTrackedMainMenuVisibility = false;
  document.body.classList.remove("launch-mode", "app-shell-mode", "browse-mode", "overview-mode");
  document.body.classList.add("study-mode");
  document.title = APP_NAME;

  if (launchScreen) {
    launchScreen.hidden = true;
  }

  if (appShellScreen) {
    appShellScreen.hidden = true;
  }

  setUnitedStatesMemoryTrailGameplayHeaderTitle();
  updateStudyInstruction();
  updateStudyCardDetails();
  updateProgress();
  updateDifficultyControls();
  renderStudyExplorePanel();
  renderActivityNavControls(session.currentActivity?.id);
  updateTopBarNavigation();
  updateResetControlVisibility();
  return true;
}

function normalizeAppShellScreenId(screenId) {
  return appShellScreenIds.has(screenId) ? screenId : "main-menu";
}

function getAppScreenSnapshotScreenId(snapshot) {
  const screenId = typeof snapshot === "string" ? snapshot : snapshot?.screenId;
  return appShellScreenIds.has(screenId) ? screenId : null;
}

function cloneSelectedJourneyPlayState() {
  return {
    journeyId: selectedJourneyPlayState?.journeyId || null,
    difficultyId: normalizeJourneyDifficultyId(selectedJourneyPlayState?.difficultyId)
  };
}

function createAppScreenSnapshot(screenId = currentAppScreen) {
  return {
    screenId: normalizeAppShellScreenId(screenId),
    selectedJourneyId,
    journeyPickerIntent: normalizeJourneyDetailIntent(journeyPickerIntent),
    selectedJourneyDetailIntent: normalizeJourneyDetailIntent(selectedJourneyDetailIntent),
    selectedJourneyPlayState: cloneSelectedJourneyPlayState(),
    pendingFreePlayActivityId,
    pendingFreePlayHierarchyNodeId
  };
}

function restoreAppScreenSnapshot(snapshot) {
  if (!snapshot || typeof snapshot === "string") {
    return;
  }

  selectedJourneyId = snapshot.selectedJourneyId || null;
  journeyPickerIntent = normalizeJourneyDetailIntent(snapshot.journeyPickerIntent);
  selectedJourneyDetailIntent = normalizeJourneyDetailIntent(snapshot.selectedJourneyDetailIntent);
  selectedJourneyPlayState = {
    journeyId: snapshot.selectedJourneyPlayState?.journeyId || null,
    difficultyId: normalizeJourneyDifficultyId(snapshot.selectedJourneyPlayState?.difficultyId)
  };
  pendingFreePlayActivityId = snapshot.pendingFreePlayActivityId || null;
  pendingFreePlayHierarchyNodeId = snapshot.pendingFreePlayHierarchyNodeId || null;
}

function pushAppScreenHistory(screenId) {
  const snapshot = createAppScreenSnapshot(screenId);
  const normalizedScreenId = getAppScreenSnapshotScreenId(snapshot);

  if (!normalizedScreenId) {
    return;
  }

  const lastScreenId = getAppScreenSnapshotScreenId(appScreenHistory[appScreenHistory.length - 1]);
  if (lastScreenId === normalizedScreenId) {
    return;
  }

  appScreenHistory.push(snapshot);
}

function popAppScreenHistory() {
  while (appScreenHistory.length > 0) {
    const snapshot = appScreenHistory.pop();
    const screenId = getAppScreenSnapshotScreenId(snapshot);

    if (!screenId) {
      continue;
    }

    if (screenId === "main-menu" && getAppScreenSnapshotScreenId(appScreenHistory[appScreenHistory.length - 1]) === "main-menu") {
      continue;
    }

    return snapshot;
  }

  return createAppScreenSnapshot("launch");
}

function showAppScreen(screenId, options = {}) {
  const normalizedScreenId = normalizeAppShellScreenId(screenId);
  const pushHistory = options.pushHistory !== false && currentAppScreen !== normalizedScreenId;

  if (normalizedScreenId === "main-menu" || normalizedScreenId === "learn-menu" || normalizedScreenId === "challenge-menu") {
    journeyPickerIntent = "neutral";
    selectedJourneyDetailIntent = "neutral";
  }

  if (pushHistory) {
    pushAppScreenHistory(currentAppScreen);
  }

  saveCurrentActivityProgress();
  hideStudyPracticeCompletionCard();
  activeStudyPracticeSession = null;
  isCurrentActivityProgressDisabled = false;
  currentAppScreen = normalizedScreenId;
  closeInfoPopover();
  closeBrowseDrawer();
  cancelGrabbedAnswer();
  document.body.classList.toggle("launch-mode", normalizedScreenId === "launch");
  document.body.classList.toggle("app-shell-mode", normalizedScreenId !== "launch" && normalizedScreenId !== "free-play");
  document.title = normalizedScreenId === "launch" ? LANDING_PAGE_TITLE : APP_NAME;

  if (launchScreen) {
    launchScreen.hidden = normalizedScreenId !== "launch";
  }

  if (appShellScreen) {
    appShellScreen.hidden = normalizedScreenId === "launch" || normalizedScreenId === "free-play";
  }

  updateResetControlVisibility();
  renderAppShellScreen(normalizedScreenId);
  trackAppScreenShown(normalizedScreenId);
}

function trackAppScreenShown(screenId) {
  const isMainMenu = screenId === "main-menu";

  if (isMainMenu && !lastTrackedMainMenuVisibility) {
    trackEvent("main_menu_shown");
  }

  lastTrackedMainMenuVisibility = isMainMenu;
}

function goBackAppScreen() {
  if (currentAppScreen === "settings" && restoreDailyTrailGameplayFromSettings()) {
    return;
  }

  if (currentAppScreen === "settings" && restoreUnitedStatesMemoryTrailGameplayFromSettings()) {
    return;
  }

  const previousSnapshot = popAppScreenHistory();
  const previousScreen = getAppScreenSnapshotScreenId(previousSnapshot);

  restoreAppScreenSnapshot(previousSnapshot);

  if (previousScreen === "free-play") {
    openFreePlay({
      pushHistory: false,
      hierarchyNodeId: pendingFreePlayHierarchyNodeId || activeHierarchyNodeId
    });
    return;
  }

  showAppScreen(previousScreen, { pushHistory: false });
}

function openFreePlay(options = {}) {
  const pushHistory = options.pushHistory !== false;
  if (pushHistory && currentAppScreen !== "free-play") {
    pushAppScreenHistory(currentAppScreen);
  }

  saveCurrentActivityProgress();
  hideStudyPracticeCompletionCard();
  activeStudyPracticeSession = null;
  isCurrentActivityProgressDisabled = false;
  currentAppScreen = "free-play";
  lastTrackedMainMenuVisibility = false;
  runner?.setStudyPreviewMode(false);
  freePlaySelectedMapFeature = null;
  activePreviewActivityId = null;
  selectedOverviewActivityId = null;
  document.body.classList.remove("launch-mode", "app-shell-mode");

  if (launchScreen) {
    launchScreen.hidden = true;
  }

  if (appShellScreen) {
    appShellScreen.hidden = true;
  }

  updateResetControlVisibility();
  showHierarchyBrowseNode(options.hierarchyNodeId || "world");
  setBrowseDrawerOpen(!isCompactTouchLayout());
}

function toggleMenuSection(section, isVisible) {
  if (!section) {
    return;
  }

  section.hidden = !isVisible;
  section.style.display = isVisible ? "" : "none";
  section.setAttribute("aria-hidden", String(!isVisible));
}

function renderAppShellScreen(screenId) {
  const normalizedScreenId = normalizeAppShellScreenId(screenId);
  const isMainMenu = normalizedScreenId === "main-menu";
  const isMoreWaysMenu = normalizedScreenId === "main-menu-more-ways";
  const isLearnMenu = normalizedScreenId === "learn-menu";
  const isChallengeMenu = normalizedScreenId === "challenge-menu";
  const isMenuHub = isMainMenu || isMoreWaysMenu || isLearnMenu || isChallengeMenu;
  const isChooseJourney = normalizedScreenId === "choose-journey";
  const hasJourneyShellContent = isJourneyShellScreen(normalizedScreenId);
  const content = getAppShellScreenContent(normalizedScreenId);

  if (!content) {
    return;
  }

  if (appShellTitle) {
    appShellTitle.textContent = content.title;
  }

  if (appShellSubtitle) {
    appShellSubtitle.textContent = content.subtitle;
  }

  if (appShellSettingsGear) {
    const shouldShowSettingsGear = normalizedScreenId !== "settings" && normalizedScreenId !== "customize";
    appShellSettingsGear.hidden = !shouldShowSettingsGear;
    appShellSettingsGear.tabIndex = shouldShowSettingsGear ? 0 : -1;
  }

  toggleMenuSection(mainMenuDailyTrailSection, isMainMenu);
  toggleMenuSection(mainMenuForkSection, isMoreWaysMenu);
  toggleMenuSection(mainMenuLearnSection, isLearnMenu);
  toggleMenuSection(mainMenuChallengeSection, isChallengeMenu);
  toggleMenuSection(mainMenuUtilityArea, isMenuHub);

  [mainMenuLearnButton, mainMenuChallengeButton].forEach((button) => {
    if (!button) {
      return;
    }

    button.disabled = !isMoreWaysMenu;
    button.tabIndex = isMoreWaysMenu ? 0 : -1;
  });

  updateDailyTrailMainMenuButton(isMainMenu);

  if (mainMenuMoreWaysButton) {
    mainMenuMoreWaysButton.disabled = !isMainMenu;
    mainMenuMoreWaysButton.tabIndex = isMainMenu ? 0 : -1;
    mainMenuMoreWaysButton.setAttribute("aria-hidden", String(!isMainMenu));
  }

  if (mainMenuUtilityArea) {
    mainMenuUtilityArea.querySelectorAll("button, a").forEach((control) => {
      control.tabIndex = isMenuHub ? 0 : -1;
      if (control.tagName === "BUTTON") {
        control.disabled = !isMenuHub;
      }
    });
  }

  if (mainMenuActions) {
    if (isLearnMenu && !mainMenuActions.isConnected && mainMenuActionsAnchor.parentNode) {
      mainMenuActionsAnchor.parentNode.insertBefore(mainMenuActions, mainMenuActionsAnchor.nextSibling);
    }

    mainMenuActions.querySelectorAll("button").forEach((button) => {
      button.disabled = !isLearnMenu;
      button.tabIndex = isLearnMenu ? 0 : -1;
    });

    mainMenuActions.hidden = !isLearnMenu;
    mainMenuActions.style.display = isLearnMenu ? "" : "none";
    mainMenuActions.setAttribute("aria-hidden", String(!isLearnMenu));

    if (!isLearnMenu && mainMenuActions.isConnected) {
      mainMenuActions.remove();
    }
  }

  if (challengeMenuChooseButton) {
    challengeMenuChooseButton.disabled = !isChallengeMenu;
    challengeMenuChooseButton.tabIndex = isChallengeMenu ? 0 : -1;
  }

  if (mainMenuFeedback) {
    mainMenuFeedback.hidden = !isMenuHub;
    mainMenuFeedback.style.display = isMenuHub ? "" : "none";
    mainMenuFeedback.setAttribute("aria-hidden", String(!isMenuHub));
  }

  if (mainMenuFeedbackLink) {
    mainMenuFeedbackLink.tabIndex = isMenuHub ? 0 : -1;
  }

  renderMainMenuDailyTrailHero(isMainMenu);
  renderQuickStartCard(isChallengeMenu);

  if (appShellPlaceholderCard) {
    appShellPlaceholderCard.hidden = isMenuHub || isChooseJourney || hasJourneyShellContent;
  }

  if (appShellPlaceholderTitle) {
    appShellPlaceholderTitle.textContent = content.placeholderTitle || content.title;
  }

  if (appShellPlaceholderMessage) {
    appShellPlaceholderMessage.textContent = content.placeholderMessage || content.subtitle;
  }

  renderJourneyPresetList(isChooseJourney);
  renderJourneyShellContent(screenId);
}

function getAppShellScreenContent(screenId) {
  const selectedJourney = getSelectedJourney();
  const selectedJourneyTitle = selectedJourney?.title || "Journey";
  const detailIntent = normalizeJourneyDetailIntent(selectedJourneyDetailIntent);
  const pickerIntent = normalizeJourneyDetailIntent(journeyPickerIntent);
  const contentByScreen = {
    "main-menu": {
      title: "Main Menu",
      subtitle: "Know the world by heart."
    },
    "main-menu-more-ways": {
      title: "More Ways to Learn",
      subtitle: "Choose another path when you want a different starting point."
    },
    "learn-menu": {
      title: "Learn Your World",
      subtitle: "Practice places, build memory, and study at your own pace."
    },
    "challenge-menu": {
      title: "Challenge Yourself",
      subtitle: "Follow journeys, test your progress, and earn achievements."
    },
    "choose-journey": {
      title: "Choose Journey",
      subtitle: pickerIntent === "learn"
        ? "Pick a journey to learn."
        : pickerIntent === "challenge"
          ? "Pick a journey to challenge yourself."
          : "Pick a journey to learn, study, and play."
    },
    onboarding: {
      title: "How Mappa Mundi Works",
      subtitle: "Start with a journey, then place each label on the map."
    },
    "journey-detail": {
      title: selectedJourneyTitle,
      subtitle: getJourneyDetailSubtitle(selectedJourney)
    },
    study: {
      title: `Study: ${selectedJourneyTitle}`,
      subtitle: getJourneyStudySubtitle(selectedJourney, detailIntent)
    },
    "choose-difficulty": {
      title: "Choose Difficulty",
      subtitle: "Choose how much help you want during this journey."
    },
    "daily-trail-dev": {
      title: "Daily Trail Dev",
      subtitle: "Hidden testing tools for jumping to Daily Trail content."
    },
    "daily-trail-goal-choice": {
      title: "Daily Trail",
      subtitle: "Choose your next goal."
    },
    "daily-trail-intro": {
      title: "Daily Trail",
      subtitle: getDailyTrailIntroSubtitle()
    },
    "daily-trail-summary": {
      title: "Daily Trail",
      subtitle: "Today's trail is complete."
    },
    "united-states-trail-summary": {
      title: "United States Memory Trail",
      subtitle: "This session is complete."
    },
    "begin-journey-placeholder": {
      title: `Play: ${selectedJourneyTitle}`,
      subtitle: "Journey gameplay is coming next.",
      placeholderTitle: "Journey gameplay is coming next.",
      placeholderMessage: "Journey gameplay is coming next."
    },
    "free-play-difficulty": {
      title: "Choose Difficulty",
      subtitle: "Choose how much help you want for this activity."
    },
    settings: {
      title: "Settings",
      subtitle: "Quick controls for Mappa Mundi."
    },
    customize: {
      title: "Customize",
      subtitle: "Adjust how Mappa Mundi presents the map."
    }
  };

  return contentByScreen[screenId] || contentByScreen["main-menu"];
}

function getEffectiveJourneyStatus(journey) {
  if (!journey) {
    return "coming-soon";
  }

  if (journey.id === "world-tour") {
    return isWorldTourUnlocked(journey) && getValidJourneySteps(journey).length > 0
      ? "available"
      : "locked";
  }

  if (journey.status === "available" && getValidJourneySteps(journey).length === 0) {
    return "coming-soon";
  }

  return journey.status || "coming-soon";
}

function isJourneyAvailable(journey) {
  return getEffectiveJourneyStatus(journey) === "available";
}

function isJourneyShellScreen(screenId) {
  return [
    "journey-detail",
    "onboarding",
    "study",
    "choose-difficulty",
    "daily-trail-dev",
    "daily-trail-goal-choice",
    "daily-trail-intro",
    "daily-trail-summary",
    "united-states-trail-summary",
    "begin-journey-placeholder",
    "free-play-difficulty",
    "settings",
    "customize"
  ].includes(screenId);
}

function getJourneyStatusLabel(journey) {
  const status = getEffectiveJourneyStatus(journey);
  if (status === "available") {
    return "Available";
  }

  if (status === "locked") {
    return "Locked";
  }

  return "Coming Soon";
}

function isWorldTourUnlocked(worldTourJourney) {
  const requiredJourneyIds = getWorldTourRequiredJourneyIds(worldTourJourney);
  return requiredJourneyIds.length > 0 && requiredJourneyIds.every((journeyId) => (
    isJourneyCompleteForAnyDifficulty(journeyPresets.find((journey) => journey.id === journeyId))
  ));
}

function getWorldTourRequiredJourneyIds(worldTourJourney) {
  return (worldTourJourney?.unlock?.requires || []).filter((journeyId) => {
    const journey = journeyPresets.find((candidate) => candidate.id === journeyId);
    return journey?.status === "available" && getValidJourneySteps(journey).length > 0;
  });
}

function isJourneyCompleteForAnyDifficulty(journey) {
  const summary = getJourneyProgressSummary(journey);
  return summary.total > 0 && (
    Object.values(summary.completedDifficulties).some(Boolean)
    || summary.bestCompletedCount >= summary.total
  );
}

function getJourneyProgressSummary(journey) {
  const validSteps = getValidJourneySteps(journey);
  const progress = getJourneyProgress(journey.id, atlasProgress);
  const counts = Object.fromEntries(
    journeyDifficultyOptions.map((difficulty) => [
      difficulty.id,
      validSteps.filter((step) => progress.completedSteps?.[step.id]?.[difficulty.id]).length
    ])
  );
  const bestCompletedCount = Math.max(0, ...Object.values(counts));

  return {
    total: validSteps.length,
    bestCompletedCount,
    counts,
    completedDifficulties: progress.completedDifficulties || {}
  };
}

function formatJourneyProgressText(journey) {
  const summary = getJourneyProgressSummary(journey);

  if (summary.total <= 0 || summary.bestCompletedCount <= 0) {
    return "";
  }

  return `${summary.bestCompletedCount} / ${summary.total} complete`;
}

function getJourneyDifficultyLabel(difficultyId) {
  return journeyDifficultyOptions.find((option) => option.id === difficultyId)?.title || "Easy";
}

function normalizeJourneyDifficultyId(difficultyId) {
  return journeyDifficultyOptions.some((option) => option.id === difficultyId)
    ? difficultyId
    : defaultQuickStartDifficulty;
}

function getDefaultQuickStartJourney() {
  return journeyPresets.find((journey) => (
    journey.id === defaultQuickStartJourneyId
    && isJourneyAvailable(journey)
    && getValidJourneySteps(journey).length > 0
  )) || journeyPresets.find((journey) => isJourneyAvailable(journey) && getValidJourneySteps(journey).length > 0) || null;
}

function getNextIncompleteJourneyStepIndex(journey, difficultyId, progress) {
  const validSteps = getValidJourneySteps(journey);
  const journeyProgress = getJourneyProgress(journey?.id, progress);
  const nextIncompleteIndex = validSteps.findIndex((step) => !journeyProgress.completedSteps?.[step.id]?.[difficultyId]);

  return nextIncompleteIndex;
}

function getJourneyProgressState(journey, difficultyId, progress = atlasProgress) {
  const validSteps = getValidJourneySteps(journey);
  const safeDifficultyId = normalizeJourneyDifficultyId(difficultyId);
  const journeyProgress = getJourneyProgress(journey?.id, progress);
  const completedCount = validSteps.filter((step) => journeyProgress.completedSteps?.[step.id]?.[safeDifficultyId]).length;
  const nextIncompleteIndex = getNextIncompleteJourneyStepIndex(journey, safeDifficultyId, progress);
  const isActiveJourneyDifficulty = progress.activeJourneyId === journey?.id && normalizeJourneyDifficultyId(progress.activeDifficulty) === safeDifficultyId;
  const activeStepIndex = isActiveJourneyDifficulty && Number.isInteger(progress.activeStepIndex)
    ? Math.min(Math.max(progress.activeStepIndex, 0), Math.max(validSteps.length - 1, 0))
    : null;
  const isComplete = validSteps.length > 0 && (
    Boolean(journeyProgress.completedDifficulties?.[safeDifficultyId])
    || completedCount >= validSteps.length
  );
  const hasPartialProgress = !isComplete && (
    completedCount > 0
    || (activeStepIndex !== null && activeStepIndex > 0)
  );
  const activeStep = activeStepIndex !== null ? validSteps[activeStepIndex] : null;
  const canResumeActiveStep = Boolean(activeStep && !journeyProgress.completedSteps?.[activeStep.id]?.[safeDifficultyId]);
  const resumeStepIndex = isComplete
    ? 0
    : canResumeActiveStep
      ? activeStepIndex
      : nextIncompleteIndex >= 0
      ? nextIncompleteIndex
      : activeStepIndex || 0;

  return {
    difficultyId: safeDifficultyId,
    completedCount,
    total: validSteps.length,
    isComplete,
    hasPartialProgress,
    resumeStepIndex
  };
}

function getPreferredJourneyDifficultyId(journey, progress = atlasProgress) {
  const selectedDifficultyId = selectedJourneyPlayState.journeyId === journey?.id
    ? normalizeJourneyDifficultyId(selectedJourneyPlayState.difficultyId)
    : null;
  const activeDifficultyId = progress.activeJourneyId === journey?.id
    ? normalizeJourneyDifficultyId(progress.activeDifficulty)
    : null;
  const states = journeyDifficultyOptions.map((difficulty) => getJourneyProgressState(journey, difficulty.id, progress));
  const partialState = states
    .filter((state) => state.hasPartialProgress)
    .sort((first, second) => second.completedCount - first.completedCount)[0];
  const completeState = states
    .filter((state) => state.isComplete)
    .sort((first, second) => second.completedCount - first.completedCount)[0];

  return activeDifficultyId
    || partialState?.difficultyId
    || completeState?.difficultyId
    || selectedDifficultyId
    || "medium";
}

function getSelectedJourneyProgressState(journey = getSelectedJourney()) {
  return getJourneyProgressState(journey, getSelectedJourneyDifficultyId(), atlasProgress);
}

function createQuickStartResumeTarget(journey, difficultyId, progress, options = {}) {
  if (!journey || !isJourneyAvailable(journey) || getValidJourneySteps(journey).length === 0) {
    return null;
  }

  const state = getJourneyProgressState(journey, difficultyId, progress);
  const validSteps = getValidJourneySteps(journey);
  const step = validSteps[state.resumeStepIndex];

  if (!step || state.isComplete || (!options.allowStartedJourney && state.completedCount <= 0)) {
    return null;
  }

  return {
    isResume: true,
    journey,
    step,
    stepIndex: state.resumeStepIndex,
    difficultyId: state.difficultyId,
    preserveProgress: true
  };
}

function hasAnyJourneyProgress(progress) {
  return journeyPresets.some((journey) => {
    const validSteps = getValidJourneySteps(journey);

    if (!validSteps.length) {
      return false;
    }

    return journeyDifficultyOptions.some((difficulty) => {
      const state = getJourneyProgressState(journey, difficulty.id, progress);
      return state.completedCount > 0 || state.isComplete;
    });
  });
}

function getFallbackSavedJourneyTarget(progress) {
  const recentJourney = journeyPresets.find((journey) => journey.id === progress.recentJourneyId);
  const recentDifficulty = normalizeJourneyDifficultyId(progress.recentDifficulty || progress.activeDifficulty);
  const recentTarget = createQuickStartResumeTarget(recentJourney, recentDifficulty, progress, {
    allowStartedJourney: Boolean(progress.recentJourneyId)
  });

  if (recentTarget) {
    return recentTarget;
  }

  for (const journey of journeyPresets) {
    for (const difficulty of journeyDifficultyOptions) {
      const target = createQuickStartResumeTarget(journey, difficulty.id, progress);

      if (target) {
        return target;
      }
    }
  }

  return null;
}

function getQuickStartTarget(progress = loadProgress()) {
  const activeJourney = journeyPresets.find((journey) => journey.id === progress.activeJourneyId);
  const activeDifficulty = normalizeJourneyDifficultyId(progress.activeDifficulty);
  const activeTarget = createQuickStartResumeTarget(activeJourney, activeDifficulty, progress, {
    allowStartedJourney: Boolean(progress.activeJourneyId)
  });

  if (activeTarget) {
    return activeTarget;
  }

  const savedTarget = getFallbackSavedJourneyTarget(progress);

  if (savedTarget) {
    return savedTarget;
  }

  if (hasAnyJourneyProgress(progress)) {
    return {
      isChooseJourney: true,
      isResume: false,
      journey: null,
      step: null,
      stepIndex: 0,
      difficultyId: defaultQuickStartDifficulty,
      preserveProgress: false
    };
  }

  const fallbackJourney = getDefaultQuickStartJourney();
  const fallbackStep = getValidJourneySteps(fallbackJourney)[0];

  if (!fallbackJourney || !fallbackStep) {
    return null;
  }

  return {
    isResume: false,
    journey: fallbackJourney,
    step: fallbackStep,
    stepIndex: 0,
    difficultyId: defaultQuickStartDifficulty,
    preserveProgress: false
  };
}

function renderMainMenuDailyTrailHero(isMainMenu) {
  if (!mainMenuDailyTrailButton) {
    return;
  }

  if (mainMenuDailyTrailSection) {
    mainMenuDailyTrailSection.hidden = !isMainMenu;
    mainMenuDailyTrailSection.setAttribute("aria-hidden", String(!isMainMenu));
  }

  mainMenuDailyTrailButton.hidden = !isMainMenu;
  mainMenuDailyTrailButton.disabled = !isMainMenu;
  mainMenuDailyTrailButton.tabIndex = isMainMenu ? 0 : -1;
  mainMenuDailyTrailButton.setAttribute("aria-hidden", String(!isMainMenu));

  if (!isMainMenu) {
    return;
  }

  const dailyTrailTitle = mainMenuDailyTrailButton.querySelector(".main-menu-daily-trail-title");
  const dailyTrailDescription = mainMenuDailyTrailButton.querySelector(".main-menu-daily-trail-description");
  if (dailyTrailTitle) {
    dailyTrailTitle.textContent = "Daily Trail";
  }
  if (dailyTrailDescription) {
    dailyTrailDescription.textContent = "A short daily path that teaches, reviews, and keeps your memory fresh.";
  }
}

function renderQuickStartCard(isMainMenu) {
  if (!mainMenuQuickStartButton) {
    return;
  }

  if (mainMenuQuickStartRow) {
    mainMenuQuickStartRow.hidden = !isMainMenu;
    mainMenuQuickStartRow.setAttribute("aria-hidden", String(!isMainMenu));
  }

  mainMenuQuickStartButton.hidden = !isMainMenu;
  mainMenuQuickStartButton.disabled = !isMainMenu;
  mainMenuQuickStartButton.tabIndex = isMainMenu ? 0 : -1;
  mainMenuQuickStartButton.setAttribute("aria-hidden", String(!isMainMenu));

  if (!isMainMenu) {
    return;
  }

  atlasProgress = loadProgress();
  const target = getQuickStartTarget(atlasProgress);

  if (!target || target.isChooseJourney) {
    quickStartKicker.textContent = "Start Learning";
    quickStartTitle.textContent = "Choose Journey";
    quickStartDetail.textContent = target?.isChooseJourney
      ? "All saved journeys are complete. Pick one to review or start another."
      : "Pick a journey to begin.";
    quickStartMeta.textContent = "Difficulty: Easy";
    quickStartAction.textContent = "Choose";
    return;
  }

  quickStartKicker.textContent = target.isResume ? "Continue Journey" : "Start Learning";
  quickStartTitle.textContent = target.journey.title;
  quickStartDetail.textContent = target.isResume ? `Next: ${target.step.title}` : target.step.title;
  quickStartMeta.textContent = `Difficulty: ${getJourneyDifficultyLabel(target.difficultyId)}`;
  quickStartAction.textContent = "Start";
}

function getSelectedJourney() {
  return journeyPresets.find((journey) => journey.id === selectedJourneyId) || null;
}

function selectJourney(journeyId) {
  atlasProgress = loadProgress();
  const journey = journeyPresets.find((candidate) => candidate.id === journeyId) || null;
  if (journey) {
    trackEvent("select_content", {
      content_type: "journey",
      content_id: journey.id,
      journey_title: journey.title
    });
  }
  selectedJourneyId = journeyId;
  selectedJourneyDetailIntent = normalizeJourneyDetailIntent(journeyPickerIntent);
  selectedJourneyPlayState = {
    journeyId,
    difficultyId: selectedJourneyPlayState.journeyId === journeyId
      ? selectedJourneyPlayState.difficultyId
      : getPreferredJourneyDifficultyId(journey, atlasProgress)
  };
  showAppScreen(selectedJourneyDetailIntent === "learn" ? "study" : "journey-detail");
}

function trackJourneyStarted(journey, difficultyId, stepIndex = 0) {
  if (!journey) {
    return;
  }

  trackEvent("journey_started", {
    journey_id: journey.id,
    journey_title: journey.title,
    difficulty: difficultyId,
    step_index: stepIndex
  });
}

function hasSeenOnboarding() {
  try {
    return localStorage.getItem(onboardingSeenStorageKey) === "true";
  } catch {
    return false;
  }
}

function markOnboardingSeen() {
  try {
    localStorage.setItem(onboardingSeenStorageKey, "true");
  } catch {
    // localStorage can be unavailable in private or embedded contexts.
  }
}

function startWorldFoundationsFromOnboarding() {
  const journey = journeyPresets.find((candidate) => candidate.id === defaultQuickStartJourneyId);

  markOnboardingSeen();

  if (!journey || !isJourneyAvailable(journey)) {
    showAppScreen("choose-journey");
    return;
  }

  selectedJourneyId = journey.id;
  selectedJourneyPlayState = {
    journeyId: journey.id,
    difficultyId: defaultQuickStartDifficulty
  };
  showAppScreen("choose-difficulty");
}

function chooseJourneyFromOnboarding() {
  markOnboardingSeen();
  journeyPickerIntent = "neutral";
  showAppScreen("choose-journey");
}

function skipOnboarding() {
  markOnboardingSeen();
  showAppScreen("main-menu");
}

function startQuickStartJourney() {
  atlasProgress = loadProgress();
  const target = getQuickStartTarget(atlasProgress);

  if (!target || target.isChooseJourney) {
    journeyPickerIntent = "challenge";
    showAppScreen("choose-journey");
    return;
  }

  selectedJourneyId = target.journey.id;
  selectedJourneyPlayState = {
    journeyId: target.journey.id,
    difficultyId: target.difficultyId
  };
  resetJourneyGameplayInstructionSession();
  activeJourneySession = {
    journeyId: target.journey.id,
    currentStepIndex: target.stepIndex,
    difficulty: target.difficultyId,
    mode: "journey",
    incorrectPlacements: 0
  };
  trackJourneyStarted(target.journey, target.difficultyId, target.stepIndex);
  atlasProgress = setActiveJourney(target.journey.id, target.stepIndex, target.difficultyId, atlasProgress);
  void openJourneyStep(target.stepIndex, { preserveProgress: target.preserveProgress });
}

function getSelectedJourneyDifficultyId() {
  if (selectedJourneyPlayState.journeyId !== selectedJourneyId) {
    return "medium";
  }

  return selectedJourneyPlayState.difficultyId || "medium";
}

function setSelectedJourneyDifficulty(difficultyId) {
  selectedJourneyPlayState = {
    journeyId: selectedJourneyId,
    difficultyId
  };
  renderJourneyShellContent("choose-difficulty");
}

function restartSelectedJourneyDifficulty() {
  const journey = getSelectedJourney();

  if (!journey) {
    return;
  }

  const difficulty = getSelectedJourneyDifficultyId();
  const difficultyLabel = journeyDifficultyOptions.find((option) => option.id === difficulty)?.title || "Easy";
  const shouldRestart = window.confirm(`Restart ${journey.title} progress on ${difficultyLabel}?`);

  if (!shouldRestart) {
    return;
  }

  atlasProgress = resetJourneyDifficulty(journey.id, difficulty, atlasProgress);
  renderJourneyShellContent("journey-detail");
  renderJourneyPresetList(false);
}

function getSelectedFreePlayDifficultyId() {
  const activity = getActivityById(pendingFreePlayActivityId);
  return normalizeDifficultyForActivity(selectedFreePlayDifficultyId, activity);
}

function setSelectedFreePlayDifficulty(difficultyId) {
  const activity = getActivityById(pendingFreePlayActivityId);
  selectedFreePlayDifficultyId = normalizeDifficultyForActivity(difficultyId, activity);
  renderJourneyShellContent("free-play-difficulty");
}

function setPreGameDifficulty(difficultyId, activity) {
  currentDifficulty = normalizeDifficultyForActivity(difficultyId, activity);
  saveDifficultyMode();
  updateDifficultyControls();
}

function showFreePlayDifficultyScreen(activityId) {
  pendingFreePlayActivityId = activityId;
  pendingFreePlayHierarchyNodeId = findHierarchyNodeForActivity(activityId) || activeHierarchyNodeId;
  selectedFreePlayDifficultyId = normalizeDifficultyForActivity(difficultyModes.easy, getActivityById(activityId));
  showAppScreen("free-play-difficulty");
}

function startPendingFreePlayActivity() {
  if (!pendingFreePlayActivityId) {
    goBackAppScreen();
    return;
  }

  const activityId = pendingFreePlayActivityId;
  const hierarchyNodeId = pendingFreePlayHierarchyNodeId;
  const difficultyId = getSelectedFreePlayDifficultyId();
  pendingFreePlayActivityId = null;
  pendingFreePlayHierarchyNodeId = null;
  void openActivity(activityId, { hierarchyNodeId, difficultyId });
}

function getValidJourneySteps(journey) {
  return (journey?.steps || []).filter((step) => getActivityById(step.activityId));
}

function getStudySelectionSteps(journey) {
  return (journey?.steps || []).filter((step) => (
    getActivityById(step.activityId)
    || (step.journeyId && journeyPresets.some((candidate) => candidate.id === step.journeyId))
  ));
}

function getJourneyLinkStepTargetCount(step) {
  const linkedJourney = journeyPresets.find((candidate) => candidate.id === step?.journeyId);

  if (!linkedJourney) {
    return 0;
  }

  return linkedJourney.steps.reduce((count, childStep) => {
    const activity = getActivityById(childStep.activityId);
    return count + (activity?.targets?.length || activity?.itemCount || 0);
  }, 0);
}

function openJourneyLinkStep(step) {
  if (!step?.journeyId) {
    return false;
  }

  const linkedJourney = journeyPresets.find((candidate) => candidate.id === step.journeyId);

  if (!linkedJourney) {
    return false;
  }

  journeyPickerIntent = "learn";
  selectJourney(linkedJourney.id);
  return true;
}

function getJourneyStepCameraTarget(step) {
  const activity = getActivityById(step?.activityId);
  const regionView = activity?.map?.regionView;

  if (Array.isArray(regionView?.center) && typeof regionView.zoom === "number") {
    return {
      center: regionView.center,
      zoom: regionView.zoom,
      duration: 1150
    };
  }

  return null;
}

async function transitionToJourneyStep(step) {
  const target = getJourneyStepCameraTarget(step);

  if (!target || typeof runner?.flyToCameraTarget !== "function") {
    return false;
  }

  if (prefersReducedMotion()) {
    return false;
  }

  try {
    return await runner.flyToCameraTarget(target);
  } catch {
    return false;
  }
}

function prefersReducedMotion() {
  try {
    return window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches || false;
  } catch {
    // TODO: fold reduced-motion handling into a broader accessibility settings service.
    return false;
  }
}

function startSelectedJourney() {
  startSelectedJourneyFromBeginning();
}

function startSelectedJourneyFromBeginning() {
  beginSelectedJourneyAtStep(0, { preserveProgress: false });
}

function resumeSelectedJourney() {
  const journey = getSelectedJourney();
  const state = getSelectedJourneyProgressState(journey);
  beginSelectedJourneyAtStep(state.resumeStepIndex, { preserveProgress: true });
}

function beginSelectedJourneyAtStep(stepIndex, options = {}) {
  const journey = getSelectedJourney();
  const validSteps = getValidJourneySteps(journey);

  if (!journey || !isJourneyAvailable(journey) || validSteps.length === 0) {
    showAppScreen("begin-journey-placeholder");
    return;
  }

  const safeStepIndex = Math.min(Math.max(Number.isInteger(stepIndex) ? stepIndex : 0, 0), validSteps.length - 1);

  activeJourneySession = {
    journeyId: journey.id,
    currentStepIndex: safeStepIndex,
    difficulty: getSelectedJourneyDifficultyId(),
    mode: "journey",
    incorrectPlacements: 0
  };
  trackJourneyStarted(journey, activeJourneySession.difficulty, safeStepIndex);
  resetJourneyGameplayInstructionSession();
  atlasProgress = setActiveJourney(journey.id, safeStepIndex, activeJourneySession.difficulty, atlasProgress);
  void openJourneyStep(safeStepIndex, { preserveProgress: Boolean(options.preserveProgress) });
}

async function openJourneyStep(stepIndex, options = {}) {
  await ensureMapReady();
  const journey = journeyPresets.find((preset) => preset.id === activeJourneySession?.journeyId);
  const validSteps = getValidJourneySteps(journey);
  const step = validSteps[stepIndex];

  if (!journey || !step) {
    showAppScreen("begin-journey-placeholder");
    return;
  }

  activeJourneySession.currentStepIndex = stepIndex;
  activeJourneySession.incorrectPlacements = 0;
  const stepActivity = getActivityById(step.activityId);
  const stepDifficulty = normalizeDifficultyForActivity(activeJourneySession.difficulty, stepActivity);
  activeJourneySession.difficulty = stepDifficulty;

  const launchContext = {
    journeyId: journey.id,
    stepIndex,
    difficultyId: stepDifficulty,
    preserveProgress: Boolean(options.preserveProgress)
  };
  if (!options.skipMemoryTrailRecommendation && shouldShowJourneyMemoryTrailRecommendation(launchContext)) {
    showJourneyMemoryTrailRecommendation(launchContext);
    return;
  }

  atlasProgress = setActiveJourney(activeJourneySession.journeyId, stepIndex, stepDifficulty, atlasProgress);
  if (!options.preserveProgress) {
    setActivityProgress(step.activityId, [], stepDifficulty);
    setActivityCompletedState(step.activityId, false);
  }
  await openActivity(step.activityId, {
    appScreen: "journey-gameplay",
    difficultyId: stepDifficulty,
    forceGameplayVisible: true,
    presentationSettings: getJourneyActivityPresentationSettings(step)
  });
}

function getJourneyLaunchContextParts(context) {
  const journey = journeyPresets.find((preset) => preset.id === context?.journeyId);
  const validSteps = getValidJourneySteps(journey);
  const stepIndex = Number.isInteger(context?.stepIndex)
    ? Math.min(Math.max(context.stepIndex, 0), Math.max(validSteps.length - 1, 0))
    : 0;
  const step = validSteps[stepIndex];
  const activity = getActivityById(step?.activityId);

  return { journey, step, activity, stepIndex };
}

function getJourneyMemoryTrailRecommendationKey(context) {
  const { journey, step } = getJourneyLaunchContextParts(context);
  const difficultyId = normalizeJourneyDifficultyId(context?.difficultyId);

  return journey && step ? `${journey.id}:${step.id}:${difficultyId}` : "";
}

function isJourneyLaunchStepComplete(context) {
  const { journey, step } = getJourneyLaunchContextParts(context);
  const difficultyId = normalizeJourneyDifficultyId(context?.difficultyId);
  const journeyProgress = getJourneyProgress(journey?.id, atlasProgress);

  return Boolean(step && journeyProgress.completedSteps?.[step.id]?.[difficultyId]);
}

function hasSavedJourneyActivityProgress(context) {
  const { step } = getJourneyLaunchContextParts(context);

  if (!step) {
    return false;
  }

  return getActivityProgress(step.activityId, context.difficultyId).length > 0;
}

function isMemoryTrailEligible(activity) {
  return Boolean(activity?.id && activity.id !== "continents-oceans");
}

function getJourneyMemoryTrailEligibleSteps(journey) {
  return getValidJourneySteps(journey)
    .filter((step) => isMemoryTrailEligible(getActivityById(step.activityId)));
}

function getJourneyDetailSubtitle(journey) {
  const detailIntent = normalizeJourneyDetailIntent(selectedJourneyDetailIntent);
  if (detailIntent === "learn") {
    return "Learn each section with Memory Trail, then play when you are ready.";
  }

  if (detailIntent === "challenge") {
    return "Choose your difficulty, then start the journey.";
  }

  const validSteps = getValidJourneySteps(journey);
  const eligibleCount = getJourneyMemoryTrailEligibleSteps(journey).length;

  if (eligibleCount === 0) {
    return "Study the places, then play when you are ready.";
  }

  if (eligibleCount === validSteps.length) {
    return "Learn each section with Memory Trail, then play when you are ready.";
  }

  return "Use Memory Trail for focused sections, then play when you are ready.";
}

function getJourneyStudySubtitle(journey, intent = normalizeJourneyDetailIntent(selectedJourneyDetailIntent)) {
  if (intent === "learn") {
    return "Choose a section to learn with Memory Trail.";
  }

  return getJourneyMemoryTrailEligibleSteps(journey).length > 0
    ? "Memory Trail is available for focused regional sets."
    : "Study the places before playing.";
}

function shouldShowJourneyMemoryTrailRecommendation(context) {
  const { journey, step, activity } = getJourneyLaunchContextParts(context);
  const key = getJourneyMemoryTrailRecommendationKey(context);

  return Boolean(
    journey
    && step
    && activity
    && key
    && isMemoryTrailEligible(activity)
    && !context.preserveProgress
    && !dismissedJourneyMemoryTrailRecommendations.has(key)
    && !isJourneyLaunchStepComplete(context)
    && !hasSavedJourneyActivityProgress(context)
  );
}

function dismissJourneyMemoryTrailRecommendation(context) {
  const key = getJourneyMemoryTrailRecommendationKey(context);

  if (key) {
    dismissedJourneyMemoryTrailRecommendations.add(key);
  }
}

function showJourneyMemoryTrailRecommendation(context) {
  pendingJourneyMemoryTrailRecommendation = { ...context };
  const { journey, activity } = getJourneyLaunchContextParts(context);
  setJourneyPreviewHeader(activity);
  trackEvent("memory_trail_prompt_shown", {
    activity_id: activity?.id || "",
    activity_title: activity?.title || "",
    journey_id: journey?.id || "",
    journey_title: journey?.title || "",
    difficulty: normalizeJourneyDifficultyId(context?.difficultyId),
    sequence_length: Math.min(ACTIVE_CHUNK_SIZE, activity?.targets?.length || 0),
    round_count: 0
  });
  configureMemoryTrailOverlay({
    mode: "journey-recommendation",
    titleText: "Learn this set first?",
    messageText: "Memory Trail gives you a short adaptive practice session before playing.",
    primaryText: "Start Memory Trail",
    secondaryText: "Play Now",
    showInfo: false
  });
}

function setJourneyPreviewHeader(activity) {
  if (!activity) {
    return;
  }

  const hierarchyNode = getHierarchyNode(findHierarchyNodeForActivity(activity.id));
  if (hierarchyNode) {
    activeHierarchyNodeId = hierarchyNode.id;
    activeMenuRoot = getHierarchyMenuRoot(activeHierarchyNodeId) || activeMenuRoot;
  }

  setActiveActivityHeaderTitle(activity);
}

function startJourneyGameplayFromLaunchContext(context) {
  const { journey, step, stepIndex } = getJourneyLaunchContextParts(context);

  if (!journey || !step) {
    showJourneyStepNotReady();
    return;
  }

  selectedJourneyId = journey.id;
  activeJourneySession = {
    journeyId: journey.id,
    currentStepIndex: stepIndex,
    difficulty: context.difficultyId,
    mode: "journey",
    incorrectPlacements: 0
  };
  resetJourneyGameplayInstructionSession();
  trackJourneyStarted(journey, context.difficultyId, stepIndex);
  atlasProgress = setActiveJourney(journey.id, stepIndex, context.difficultyId, atlasProgress);
  void openJourneyStep(stepIndex, {
    preserveProgress: Boolean(context.preserveProgress),
    skipMemoryTrailRecommendation: true
  });
}

function startJourneyMemoryTrailFromRecommendation(context) {
  const { journey, step, activity } = getJourneyLaunchContextParts(context);

  if (!journey || !step || !activity) {
    showStudyStepNotReady();
    return;
  }

  if (!isMemoryTrailEligible(activity)) {
    void openStudyExploreActivity(journey, step, activity, {
      journeyPlayReturn: { ...context, preserveProgress: false }
    });
    return;
  }

  activeJourneySession = null;
  resetJourneyGameplayInstructionSession();
  atlasProgress = clearActiveJourney(atlasProgress);
  selectedJourneyId = journey.id;
  void openStudyExploreActivity(journey, step, activity, {
    autoStartMemoryTrail: true,
    journeyPlayReturn: { ...context, preserveProgress: false }
  });
}

function createJourneyActivityReturnState() {
  if (currentAppScreen !== "journey-gameplay" || activeJourneySession?.mode !== "journey" || !session?.currentActivity) {
    return null;
  }

  return {
    journeyId: activeJourneySession.journeyId,
    stepIndex: activeJourneySession.currentStepIndex,
    activityId: session.currentActivity.id,
    difficultyId: getEffectiveDifficulty(session.currentActivity),
    hierarchyNodeId: activeHierarchyNodeId,
    menuRootId: activeMenuRoot?.id || activeMenuRoot || null,
    presentationSettings: { ...currentPresentationSettings },
    incorrectPlacements: activeJourneySession.incorrectPlacements || 0
  };
}

function startMemoryTrailFromJourneyGameplay() {
  if (!shouldShowJourneyMemoryTrailControl()) {
    return;
  }

  const returnState = createJourneyActivityReturnState();
  const journey = journeyPresets.find((preset) => preset.id === returnState?.journeyId);
  const validSteps = getValidJourneySteps(journey);
  const stepIndex = Number.isInteger(returnState?.stepIndex)
    ? Math.min(Math.max(returnState.stepIndex, 0), Math.max(validSteps.length - 1, 0))
    : 0;
  const step = validSteps[stepIndex];
  const activity = getActivityById(returnState?.activityId || step?.activityId);

  if (!returnState || !journey || !step || !activity || !isMemoryTrailEligible(activity)) {
    return;
  }

  saveCurrentActivityProgress();
  cancelGrabbedAnswer();
  openStudyExploreActivity(journey, step, activity, {
    autoStartMemoryTrail: true,
    journeyActivityReturnState: {
      ...returnState,
      stepIndex,
      activityId: activity.id
    }
  });
}

async function returnToJourneyActivityFromStudy(returnState = activeStudySession?.journeyActivityReturnState || null) {
  if (!returnState?.journeyId || !returnState?.activityId) {
    showAppScreen(selectedJourneyId ? "journey-detail" : "choose-journey", { pushHistory: false });
    return;
  }

  const journey = journeyPresets.find((preset) => preset.id === returnState.journeyId);
  const validSteps = getValidJourneySteps(journey);
  const stepIndex = Number.isInteger(returnState.stepIndex)
    ? Math.min(Math.max(returnState.stepIndex, 0), Math.max(validSteps.length - 1, 0))
    : 0;
  const step = validSteps[stepIndex];
  const activity = getActivityById(returnState.activityId || step?.activityId);

  if (!journey || !step || !activity) {
    showJourneyStepNotReady();
    return;
  }

  hideMemoryTrailOverlay();
  clearMemoryTrailState({ restoreReveals: false });
  activeStudySession = null;
  activeStudyPracticeSession = null;
  document.body.classList.remove("study-explore-mode");
  runner?.setStudyPreviewMode(false);
  runner?.setMemoryTrailHighlight([]);
  runner?.setCompletedTargets([]);

  const difficultyId = normalizeDifficultyForActivity(returnState.difficultyId, activity);
  selectedJourneyId = journey.id;
  activeHierarchyNodeId = returnState.hierarchyNodeId || activeHierarchyNodeId;
  activeMenuRoot = getHierarchyMenuRoot(activeHierarchyNodeId) || returnState.menuRootId || activeMenuRoot;
  activeJourneySession = {
    journeyId: journey.id,
    currentStepIndex: stepIndex,
    difficulty: difficultyId,
    mode: "journey",
    incorrectPlacements: returnState.incorrectPlacements || 0
  };
  atlasProgress = setActiveJourney(journey.id, stepIndex, difficultyId, atlasProgress);
  await openActivity(activity.id, {
    appScreen: "journey-gameplay",
    difficultyId,
    forceGameplayVisible: true,
    hierarchyNodeId: returnState.hierarchyNodeId,
    presentationSettings: returnState.presentationSettings || getJourneyActivityPresentationSettings(step)
  });

  if (activeJourneySession) {
    activeJourneySession.incorrectPlacements = returnState.incorrectPlacements || 0;
  }
  showFeedback("Back to your activity.", true);
}

function getJourneyActivityPresentationSettings() {
  return {
    reviewMode: studyModes.sectionOnly,
    showCities: false,
    showCapitals: false
  };
}

function getStudyStepContext(journeyId, stepId) {
  const journey = journeyPresets.find((preset) => preset.id === journeyId);
  const step = getValidJourneySteps(journey).find((candidate) => candidate.id === stepId);
  const activity = getActivityById(step?.activityId);

  return { journey, step, activity };
}

async function startStudyPreviewActivity(journeyId, stepId, options = {}) {
  await ensureMapReady();
  const { journey, step, activity } = getStudyStepContext(journeyId, stepId);

  if (!journey || !step || !activity) {
    showStudyStepNotReady();
    return;
  }

  selectedJourneyId = journey.id;
  await openStudyExploreActivity(journey, step, activity, {
    autoStartMemoryTrail: Boolean(options.autoStartMemoryTrail)
  });
}

async function startStudyPracticeActivity(journeyId, stepId) {
  await ensureMapReady();
  const { journey, step, activity } = getStudyStepContext(journeyId, stepId);

  if (!journey || !step || !activity) {
    showStudyStepNotReady();
    return;
  }

  selectedJourneyId = journey.id;
  activeJourneySession = null;
  trackEvent("study_practice_started", {
    activity_id: activity.id,
    activity_title: activity.title,
    journey_id: journey.id,
    journey_title: journey.title,
    difficulty: difficultyModes.easy
  });
  activeStudyPracticeSession = {
    journeyId: journey.id,
    stepId: step.id,
    activityId: activity.id
  };

  await openActivity(activity.id, {
    appScreen: "study-practice",
    difficultyId: difficultyModes.easy,
    disableActivityProgress: true,
    forceGameplayVisible: true,
    hierarchyNodeId: findHierarchyNodeForActivity(activity.id),
    presentationSettings: {
      reviewMode: studyModes.sectionOnly
    }
  });
}

function showStudyStepNotReady() {
  showFeedback("This study section is not ready yet.");
}

async function openStudyExploreActivity(journey, step, activity, options = {}) {
  await ensureMapReady();
  closeRiverPreview({ restoreActivityUi: true });
  activity = getActivityById(activity?.id) || activity;
  saveCurrentActivityProgress();
  trackEvent("study_preview_opened", {
    activity_id: activity.id,
    activity_title: activity.title,
    journey_id: journey.id,
    journey_title: journey.title,
    difficulty: difficultyModes.easy
  });
  cancelGrabbedAnswer();
  clearJourneyAutoAdvanceTimer();
  resetAudioInstructionState(`study-preview:${journey.id}:${step.id}:${activity.id}`);
  activeStudySession = {
    journeyId: journey.id,
    stepId: step.id,
    activityId: activity.id,
    revealedTargetIds: options.revealAll ? activity.targets.map((target) => target.id) : [],
    memoryTrail: null,
    retryReturnState: options.retryReturnState || null,
    journeyPlayReturn: options.journeyPlayReturn || null,
    journeyActivityReturnState: options.journeyActivityReturnState || null,
    memoryTrailSectionIndex: getMemoryTrailSections(activity).length ? 0 : null
  };
  activeStudyPracticeSession = null;
  hideStudyPracticeCompletionCard();
  isCurrentActivityProgressDisabled = true;
  currentAppScreen = "study-explore";
  document.body.classList.remove("launch-mode", "app-shell-mode", "browse-mode", "overview-mode");
  document.body.classList.add("study-mode", "study-explore-mode");

  if (launchScreen) {
    launchScreen.hidden = true;
  }

  if (appShellScreen) {
    appShellScreen.hidden = true;
  }

  selectedActivityId = activity.id;
  const hierarchyNode = getHierarchyNode(findHierarchyNodeForActivity(activity.id));
  activeHierarchyNodeId = hierarchyNode?.id || activeHierarchyNodeId;
  activeMenuRoot = getHierarchyMenuRoot(activeHierarchyNodeId) || activeMenuRoot;
  currentPresentationSettings = getEffectivePresentationSettings(activity, {
    presentationSettings: {
      reviewMode: studyModes.sectionOnly
    }
  });
  // TODO: Apply granular studyTargetSettings here once target filtering is
  // safe for every activity family. For v1, required activity targets stay
  // intact so Study Mode cannot open an empty or broken map.
  const presentedActivity = getPresentedActivity(activity, currentPresentationSettings);

  session.setStudyMode(studyModes.sectionOnly);
  session.setActivity(presentedActivity);
  session.setCompletedIds([]);
  runner.updateActivity(session.activity);
  runner.setPresentationSettings(currentPresentationSettings);
  runner.setDifficulty(difficultyModes.easy);
  runner.setStudyPreviewMode(true);
  runner.setMemoryTrailHighlight([]);
  runner.setCompletedTargets(activeStudySession.revealedTargetIds);
  setActiveActivityHeaderTitle(presentedActivity);
  instruction.textContent = "Tap a target or name to show it. Tap it again to hide it.";
  studyCard.hidden = false;
  studyCard.querySelector("strong").textContent = step.title;
  studyCard.querySelector("span").textContent = "Study Mode";
  runner.enterStudyView();
  renderStudyExplorePanel();
  updateTopBarNavigation();
  const canUseMemoryTrail = isMemoryTrailEligible(session.currentActivity);
  if (options.autoStartMemoryTrail && canUseMemoryTrail) {
    startMemoryTrail();
  } else if (canUseMemoryTrail) {
    showMemoryTrailOfferOverlay();
    playInstructionOnce("study-preview", audioInstructionPhrases.studyPreview);
  } else {
    playInstructionOnce("study-preview", audioInstructionPhrases.studyPreview);
  }
}

function revealStudyTarget(targetId) {
  if (currentAppScreen !== "study-explore" || !activeStudySession || !session.getFeature(targetId)) {
    return;
  }

  if (isMemoryTrailActive()) {
    return;
  }

  speakStudyPreviewTarget(targetId);

  if (activeStudySession.revealedTargetIds.includes(targetId)) {
    activeStudySession.revealedTargetIds = activeStudySession.revealedTargetIds.filter((id) => id !== targetId);
  } else {
    activeStudySession.revealedTargetIds.push(targetId);
  }

  runner.setCompletedTargets(activeStudySession.revealedTargetIds);
  renderStudyExplorePanel();
}

function launchPracticeForStudySet() {
  if (!activeStudySession || activeStudySession.retryReturnState || activeStudySession.journeyActivityReturnState) {
    return;
  }

  const { journeyId, stepId } = activeStudySession;
  hideMemoryTrailOverlay();
  clearMemoryTrailState({ restoreReveals: false });
  document.body.classList.remove("study-explore-mode");
  activeStudySession = null;
  runner.setStudyPreviewMode(false);
  runner.setMemoryTrailHighlight([]);
  void startStudyPracticeActivity(journeyId, stepId);
}

function startJourneyFromStudyRecommendation() {
  const launchContext = activeStudySession?.journeyPlayReturn;

  if (!launchContext) {
    return;
  }

  hideMemoryTrailOverlay();
  clearMemoryTrailState({ restoreReveals: false });
  activeStudySession = null;
  document.body.classList.remove("study-explore-mode");
  runner.setStudyPreviewMode(false);
  runner.setMemoryTrailHighlight([]);
  runner.setCompletedTargets([]);
  startJourneyGameplayFromLaunchContext({
    ...launchContext,
    preserveProgress: false
  });
}

function exitStudyExplore() {
  const journeyActivityReturnState = activeStudySession?.journeyActivityReturnState || null;
  const retryReturnState = activeStudySession?.retryReturnState || null;

  if (journeyActivityReturnState) {
    void returnToJourneyActivityFromStudy(journeyActivityReturnState);
    return;
  }

  hideMemoryTrailOverlay();
  clearMemoryTrailState({ restoreReveals: false });
  activeStudySession = null;
  document.body.classList.remove("study-explore-mode");
  runner.setStudyPreviewMode(false);
  runner.setMemoryTrailHighlight([]);
  runner.setCompletedTargets([]);

  if (retryReturnState) {
    returnToRetryReviewActivity(retryReturnState);
    return;
  }

  showAppScreen(selectedJourneyId ? "study" : "main-menu", { pushHistory: false });
}

function renderStudyExplorePanel() {
  setAnswerPanelMode("study-explore");
  answerBank.innerHTML = "";
  updateMemoryTrailCorrectionCallout();

  if (isMemoryTrailActive()) {
    renderMemoryTrailPanel();
    return;
  }

  const controls = document.createElement("div");
  controls.className = "study-explore-controls";
  const controlDefinitions = activeStudySession?.retryReturnState
    ? [["Exit Study", exitStudyExplore, "Exit"]]
    : activeStudySession?.journeyActivityReturnState
      ? [["Return to Activity", () => { void returnToJourneyActivityFromStudy(); }, "Return"]]
    : activeStudySession?.journeyPlayReturn
      ? [
          ["Play Journey", startJourneyFromStudyRecommendation, "Play"],
          ["Exit Study", exitStudyExplore, "Exit"]
        ]
    : [
      ["Practice This Set", launchPracticeForStudySet, "Practice"],
      ["Exit Study", exitStudyExplore, "Exit"]
    ];

  controlDefinitions.forEach(([label, handler, mobileLabel]) => {
    appendStudyControlButton(controls, label, handler, mobileLabel);
  });

  const list = document.createElement("div");
  list.className = "study-target-list";
  session.currentActivity.targets.forEach((target) => {
    const item = document.createElement("button");
    item.type = "button";
    item.className = "study-target-list-item";
    item.classList.toggle("revealed", activeStudySession?.revealedTargetIds.includes(target.id));
    item.addEventListener("click", () => revealStudyTarget(target.id));

    const name = document.createElement("span");
    name.textContent = target.name;
    item.appendChild(name);

    const speaker = window.GeographyChipSpeech?.createChipSpeakerControl(getStudyPreviewSpeechLabel(target));
    if (speaker) {
      item.appendChild(speaker);
    }

    list.appendChild(item);
  });

  answerBank.append(list, controls);
  ensureActiveTrayContentVisible();
}

function getStudyPreviewSpeechLabel(targetOrId) {
  const target = typeof targetOrId === "string"
    ? session.getFeature(targetOrId)
    : targetOrId;

  if (!target) {
    return "";
  }

  return target.completedLabelName || target.name || "";
}

function getTargetChipLabel(targetOrId) {
  const target = typeof targetOrId === "string"
    ? session.getFeature(targetOrId)
    : targetOrId;

  if (!target) {
    return "";
  }

  if (target.city && target.type !== "federal-district") {
    return target.city;
  }

  const label = target.name || target.completedLabelName || target.id || "";
  const state = target.state || "";
  if (
    label
    && state
    && /^[A-Z]{2}$/.test(state)
    && (target.type === "capital" || target.type === "city" || target.kind === "point" || target.shape === "circle")
  ) {
    return label
      .replace(new RegExp(`,?\\s+${state}$`), "")
      .trim();
  }

  return label;
}

function getInstructionNoun(activity = session.currentActivity) {
  if (activity?.id === "continents-oceans") {
    return "continent or ocean";
  }

  const noun = String(activity?.targetNoun || "").trim();
  if (noun) {
    return noun;
  }

  const targets = activity?.targets || activity?.features || [];
  if (targets.length > 0 && targets.every((target) => target?.type === "capital")) {
    return "capital";
  }

  if (targets.length > 0 && targets.every((target) => target?.type === "city" || target?.shape === "circle")) {
    return "city";
  }

  if (targets.length > 0 && targets.every((target) => target?.type === "zone" || /ocean/i.test(target?.name || ""))) {
    return "ocean";
  }

  if (targets.length > 0 && targets.every((target) => target?.type === "region")) {
    return "continent";
  }

  return "place";
}

function getInstructionNounPlural(activity = session.currentActivity) {
  return pluralizeInstructionNounPhrase(getInstructionNoun(activity));
}

function pluralizeInstructionNounPhrase(nounPhrase = "place") {
  const parts = String(nounPhrase || "place")
    .split(/\s*,\s*|\s+or\s+/i)
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length > 1) {
    const pluralParts = parts.map(pluralizeInstructionNoun);
    return pluralParts.length === 2
      ? `${pluralParts[0]} or ${pluralParts[1]}`
      : `${pluralParts.slice(0, -1).join(", ")}, or ${pluralParts.at(-1)}`;
  }

  return pluralizeInstructionNoun(nounPhrase);
}

function pluralizeInstructionNoun(noun = "place") {
  const normalized = String(noun || "place").trim();
  const lower = normalized.toLowerCase();
  const overrides = {
    country: "countries",
    city: "cities",
    "capital city": "capital cities",
    capital: "capitals",
    state: "states",
    province: "provinces",
    territory: "territories",
    continent: "continents",
    ocean: "oceans",
    place: "places",
    region: "regions",
    prefecture: "prefectures",
    "federal subject": "federal subjects",
    "political division": "political divisions",
    "federal entity": "federal entities",
    "federal district": "federal districts",
    "union territory": "union territories",
    "autonomous community": "autonomous communities",
    "body of water": "bodies of water",
    "mountain range": "mountain ranges"
  };

  if (overrides[lower]) {
    return overrides[lower];
  }

  if (lower.endsWith("y") && !/[aeiou]y$/i.test(lower)) {
    return `${normalized.slice(0, -1)}ies`;
  }

  if (/(s|x|z|ch|sh)$/i.test(lower)) {
    return `${normalized}es`;
  }

  return `${normalized}s`;
}

function getIndefiniteArticle(nounPhrase = "place") {
  return /^[aeiou]/i.test(String(nounPhrase).trim()) ? "an" : "a";
}

function speakStudyPreviewTarget(targetOrId) {
  const text = getStudyPreviewSpeechLabel(targetOrId);

  if (!text) {
    return false;
  }

  return window.GeographyChipSpeech?.speakLabel(text) || false;
}

function configureMemoryTrailOverlay({ mode, titleText, messageText, primaryText, secondaryText, showInfo }) {
  if (!memoryTrailOverlay) {
    return;
  }

  memoryTrailOverlayMode = mode;
  memoryTrailTitle.textContent = titleText;
  memoryTrailMessage.textContent = messageText;
  memoryTrailPrimaryButton.textContent = primaryText;
  memoryTrailSecondaryButton.textContent = secondaryText;
  memoryTrailOverlay.hidden = false;

  if (memoryTrailInfoButton) {
    memoryTrailInfoButton.hidden = !showInfo;
    memoryTrailInfoButton.setAttribute("aria-expanded", "false");
  }

  if (memoryTrailInfoCopy) {
    memoryTrailInfoCopy.hidden = true;
  }

  window.requestAnimationFrame(() => {
    memoryTrailPrimaryButton?.focus();
  });
}

function showMemoryTrailOfferOverlay() {
  if (
    currentAppScreen !== "study-explore"
    || !activeStudySession
    || isMemoryTrailActive()
    || !isMemoryTrailEligible(session.currentActivity)
  ) {
    return;
  }

  trackEvent("memory_trail_prompt_shown", getMemoryTrailAnalyticsContext());
  configureMemoryTrailOverlay({
    mode: "offer",
    titleText: "Try Memory Trail?",
    messageText: "First, learn a small group of places. Then practice finding them and naming them from memory.",
    primaryText: "Start Memory Trail",
    secondaryText: "Study Normally",
    showInfo: true
  });
}

function showMemoryTrailCompletionOverlay() {
  if (currentAppScreen !== "study-explore" || !activeStudySession) {
    return;
  }

  const canPlayJourney = Boolean(activeStudySession.journeyPlayReturn);
  const canReturnToActivity = Boolean(activeStudySession.journeyActivityReturnState);
  const memoryTrail = activeStudySession.memoryTrail;
  const nextSection = getNextMemoryTrailSection(session.currentActivity);
  const hasNextSection = Boolean(nextSection);
  configureMemoryTrailOverlay({
    mode: "complete",
    titleText: hasNextSection && memoryTrail?.sectionTitle
      ? `${memoryTrail.sectionTitle} Complete`
      : "Memory Trail Complete",
    messageText: hasNextSection
      ? `Next: ${nextSection.title}`
      : "Do you want to repeat this exercise?",
    primaryText: hasNextSection
      ? `Continue: ${nextSection.title}`
      : "Do Memory Trail Again",
    secondaryText: canReturnToActivity ? "Return to Activity" : canPlayJourney ? "Play Journey" : "Return to Study",
    showInfo: false
  });
}

function startNextMemoryTrailSection() {
  const nextSection = getNextMemoryTrailSection(session.currentActivity);

  if (!nextSection || !activeStudySession) {
    return false;
  }

  activeStudySession.memoryTrailSectionIndex = nextSection.sectionIndex;
  startMemoryTrail();
  return true;
}

function advanceMemoryTrailAfterDevCompletion(memoryTrail) {
  if (!isCurrentMemoryTrailState(memoryTrail)) {
    return false;
  }

  if (shouldEndMemoryTrailSession(memoryTrail) && startNextMemoryTrailSection()) {
    return true;
  }

  promptNextMemoryTrailTarget(memoryTrail);
  return true;
}

function hideMemoryTrailOverlay() {
  memoryTrailOverlayMode = null;

  if (memoryTrailOverlay) {
    memoryTrailOverlay.hidden = true;
  }

  if (memoryTrailInfoCopy) {
    memoryTrailInfoCopy.hidden = true;
  }

  if (memoryTrailInfoButton) {
    memoryTrailInfoButton.setAttribute("aria-expanded", "false");
  }
}

function handleMemoryTrailOverlayPrimary() {
  if (memoryTrailOverlayMode === "journey-recommendation") {
    const context = pendingJourneyMemoryTrailRecommendation;
    pendingJourneyMemoryTrailRecommendation = null;
    hideMemoryTrailOverlay();
    dismissJourneyMemoryTrailRecommendation(context);
    startJourneyMemoryTrailFromRecommendation(context);
    return;
  }

  if (memoryTrailOverlayMode === "offer") {
    hideMemoryTrailOverlay();
    startMemoryTrail();
    return;
  }

  if (memoryTrailOverlayMode === "complete") {
    hideMemoryTrailOverlay();
    if (startNextMemoryTrailSection()) {
      return;
    }

    restartMemoryTrail();
  }
}

function handleMemoryTrailOverlaySecondary() {
  if (memoryTrailOverlayMode === "journey-recommendation") {
    const context = pendingJourneyMemoryTrailRecommendation;
    pendingJourneyMemoryTrailRecommendation = null;
    hideMemoryTrailOverlay();
    dismissJourneyMemoryTrailRecommendation(context);
    startJourneyGameplayFromLaunchContext(context);
    return;
  }

  if (memoryTrailOverlayMode === "complete") {
    if (activeStudySession?.journeyActivityReturnState) {
      hideMemoryTrailOverlay();
      void returnToJourneyActivityFromStudy();
      return;
    }

    if (activeStudySession?.journeyPlayReturn) {
      hideMemoryTrailOverlay();
      startJourneyFromStudyRecommendation();
      return;
    }

    hideMemoryTrailOverlay();
    exitMemoryTrail();
    return;
  }

  hideMemoryTrailOverlay();
}

function toggleMemoryTrailInfo() {
  if (!memoryTrailInfoButton || !memoryTrailInfoCopy) {
    return;
  }

  const isExpanded = memoryTrailInfoButton.getAttribute("aria-expanded") === "true";
  memoryTrailInfoButton.setAttribute("aria-expanded", String(!isExpanded));
  memoryTrailInfoCopy.hidden = isExpanded;
}

function isMemoryTrailActive() {
  return Boolean(activeStudySession?.memoryTrail?.active);
}

function getActiveMemoryTrail() {
  return isMemoryTrailActive() ? activeStudySession.memoryTrail : null;
}

async function openUnitedStatesAtlas() {
  await ensureMapReady();
  saveCurrentActivityProgress();
  cancelGrabbedAnswer();
  clearFeedback();
  closeBrowseDrawer();
  activeStudySession = null;
  activeStudyPracticeSession = null;
  isCurrentActivityProgressDisabled = false;
  currentAppScreen = "united-states-atlas";
  activeHierarchyNodeId = "north-america-united-states";
  activeMenuRoot = "north-america";
  isNavigationBrowseMode = false;
  document.body.classList.remove("launch-mode", "app-shell-mode", "study-mode", "browse-mode");
  document.body.classList.add("overview-mode", "united-states-atlas-mode");

  if (launchScreen) launchScreen.hidden = true;
  if (appShellScreen) appShellScreen.hidden = true;

  studyCard.hidden = true;
  runner.setStudyPreviewMode(false);
  runner.setMemoryTrailHighlight([]);
  runner.setCompletedTargets([]);
  unitedStatesAtlasProgress = readUnitedStatesAtlasProgress();
  runner.setUnitedStatesAtlasLearningStatuses(unitedStatesAtlasProgress.statesById
    ? Object.fromEntries(Object.entries(unitedStatesAtlasProgress.statesById).map(([stateId, status]) => [stateId, status.status]))
    : {});
  runner.enterUnitedStatesAtlas();
  setHeaderTitle("United States Atlas", { shortTitle: "U.S. Atlas" });
  instruction.textContent = "Select a state to explore its geographic profile.";
  if (unitedStatesAtlasOverview) {
    unitedStatesAtlasOverview.hidden = false;
    renderUnitedStatesAtlasOverview(unitedStatesAtlasOverview, unitedStatesAtlasProgress);
  }
  renderUnitedStatesAtlasPanel();
  renderActivityNavControls(null);
  updateTopBarNavigation();
}

function selectUnitedStatesAtlasState(stateId) {
  const normalizedStateId = String(stateId || "").trim().toLowerCase();
  const profile = renderUnitedStatesAtlasPanel(normalizedStateId);
  runner?.setUnitedStatesAtlasSelection(profile ? normalizedStateId : "");
}

function renderUnitedStatesAtlasPanel(stateId = "") {
  if (!unitedStatesAtlasProfile) return null;
  unitedStatesAtlasProfile.hidden = false;
  return renderUnitedStatesAtlasProfile(unitedStatesAtlasProfile, stateId, {
    atlasProgress: unitedStatesAtlasProgress,
    onClearSelection: () => selectUnitedStatesAtlasState("")
  });
}

function exitUnitedStatesAtlas() {
  unitedStatesAtlasProfile.hidden = true;
  if (unitedStatesAtlasOverview) unitedStatesAtlasOverview.hidden = true;
  runner?.setUnitedStatesAtlasSelection("");
  runner?.setUnitedStatesAtlasLearningStatuses({});
  unitedStatesAtlasProgress = null;
  document.body.classList.remove("united-states-atlas-mode", "overview-mode", "browse-mode");
  showAppScreen("main-menu", { pushHistory: false });
}

function isDailyTrailCheckpointPlan(plan = activeDailyTrailSession?.plan) {
  return isDailyTrailCheckpointReviewPlan(plan);
}

function isSegmentedCompletedDailyTrailReviewPlan(plan = activeDailyTrailSession?.plan) {
  return Boolean(
    plan?.sessionType === "completed-trail-review"
    && plan.completedTrailReviewMixed === true
    && (plan.activityGroups?.length || 0) > 1
  );
}

function getDailyTrailCheckpointCameraDebug(memoryTrail, selection = {}) {
  if (!memoryTrail?.checkpointReview) {
    return {
      mode: "normal-memory-trail",
      source: "normal-memory-trail",
      camera: null,
      usesTargetLearnCamera: false
    };
  }

  const { source, camera: configuredCamera } = getMixedDailyTrailCheckpointCameraConfig(memoryTrail, selection);
  return {
    mode: configuredCamera ? "activity-regional-camera" : "activity-context-fit",
    source: configuredCamera ? "daily-trail-checkpoint-context" : "activity-context-fit",
    configurationSource: source,
    cameraContext: configuredCamera ? "daily-trail-checkpoint-context" : "activity-context-fit",
    camera: normalizeMemoryTrailSectionQuizView(configuredCamera),
    usesTargetLearnCamera: false
  };
}

function getDailyTrailCheckpointRuntimeSnapshot(memoryTrail = getActiveMemoryTrail(), details = {}) {
  const plan = activeDailyTrailSession?.plan || null;
  const queueTargetIds = [...(memoryTrail?.checkpointTargetQueue || [])];
  const duplicateTargetIds = queueTargetIds.filter((targetId, index) => queueTargetIds.indexOf(targetId) !== index);
  const activeHighlightIds = runner?.getMemoryTrailActiveHighlightIds?.() || [];
  const currentTargetId = memoryTrail?.currentPromptTargetId || "";
  const selection = details.selection || {
    targetId: currentTargetId,
    promptType: memoryTrail?.currentPromptType || ""
  };
  const selectedCamera = getDailyTrailCheckpointCameraDebug(memoryTrail, selection);
  const promptVisualState = runner?.getMemoryTrailPromptVisualState?.() || null;

  return {
    fingerprint: dailyTrailCheckpointRuntimeFingerprint,
    mapModuleUrl: import.meta.url,
    plannerModuleSpecifier: dailyTrailPlannerModuleSpecifier,
    stage: details.stage || "snapshot",
    planSessionType: plan?.sessionType || "",
    checkpointMixedReview: plan?.checkpointMixedReview === true,
    checkpointReview: memoryTrail?.checkpointReview === true,
    queueTargetIds,
    queueHasDuplicates: duplicateTargetIds.length > 0,
    duplicateTargetIds: [...new Set(duplicateTargetIds)],
    currentTargetId,
    currentPromptType: memoryTrail?.currentPromptType || "",
    currentPromptMode: memoryTrail?.currentPromptMode || "",
    currentSessionPhase: memoryTrail?.sessionPhase || "",
    preAnswerHighlightEnabled: Boolean(details.preAnswerHighlightEnabled),
    activeHighlightIds,
    promptVisualState,
    selectedCamera,
    cameraSnapshot: getMemoryTrailCameraSnapshot(),
    serviceWorkerController: typeof navigator !== "undefined"
      ? navigator.serviceWorker?.controller?.scriptURL || null
      : null
  };
}

function publishDailyTrailCheckpointRuntimeSnapshot(memoryTrail = getActiveMemoryTrail(), details = {}) {
  const plan = activeDailyTrailSession?.plan;
  if (!memoryTrail?.checkpointReview && !isDailyTrailCheckpointPlan(plan)) {
    return null;
  }

  const snapshot = getDailyTrailCheckpointRuntimeSnapshot(memoryTrail, details);
  if (typeof window !== "undefined") {
    window.mappaDailyTrailCheckpointDebug = {
      fingerprint: dailyTrailCheckpointRuntimeFingerprint,
      getSnapshot: () => getDailyTrailCheckpointRuntimeSnapshot(getActiveMemoryTrail()),
      log: () => {
        const current = getDailyTrailCheckpointRuntimeSnapshot(getActiveMemoryTrail());
        console.info("[daily-trail-checkpoint]", current);
        return current;
      },
      getServiceWorkerState: async () => {
        if (!navigator.serviceWorker?.getRegistrations) {
          return { controller: null, registrations: [] };
        }
        const registrations = await navigator.serviceWorker.getRegistrations();
        return {
          controller: navigator.serviceWorker.controller?.scriptURL || null,
          registrations: registrations.map((registration) => registration.active?.scriptURL || registration.scope)
        };
      }
    };
  }
  console.info("[daily-trail-checkpoint]", snapshot);
  return snapshot;
}

function getMemoryTrailSections(activity = session.currentActivity) {
  return Array.isArray(activity?.memoryTrailSections)
    ? activity.memoryTrailSections.filter((section) => Array.isArray(section.targetIds) && section.targetIds.length > 0)
    : [];
}

function getActiveMemoryTrailSection(activity = session.currentActivity) {
  const sections = getMemoryTrailSections(activity);

  if (!sections.length || !activeStudySession) {
    return null;
  }

  const sectionIndex = Math.min(
    Math.max(Number(activeStudySession.memoryTrailSectionIndex) || 0, 0),
    sections.length - 1
  );

  return {
    ...sections[sectionIndex],
    sectionIndex,
    sectionCount: sections.length
  };
}

function getNextMemoryTrailSection(activity = session.currentActivity) {
  const sections = getMemoryTrailSections(activity);

  if (!sections.length || !activeStudySession) {
    return null;
  }

  const nextIndex = (Number(activeStudySession.memoryTrailSectionIndex) || 0) + 1;

  if (nextIndex >= sections.length) {
    return null;
  }

  return {
    ...sections[nextIndex],
    sectionIndex: nextIndex,
    sectionCount: sections.length
  };
}

function createMemoryTrailSession(activity = session.currentActivity, options = {}) {
  const targetIdSet = new Set(Array.isArray(options.targetIds) ? options.targetIds.filter(Boolean) : []);
  const hasExplicitNewTargetIds = Array.isArray(options.newTargetIds);
  const newTargetIdSet = new Set(Array.isArray(options.newTargetIds) ? options.newTargetIds.filter(Boolean) : []);
  const insertedReviewTargetIds = [...new Set((Array.isArray(options.insertedReviewTargetIds) ? options.insertedReviewTargetIds : [])
    .filter(Boolean))];
  const weakReviewTargetIds = [...new Set((Array.isArray(options.weakReviewTargetIds) ? options.weakReviewTargetIds : [])
    .filter(Boolean))];
  const targets = (activity?.targets || [])
    .filter((target) => target?.id)
    .filter((target) => targetIdSet.size === 0 || targetIdSet.has(target.id));
  const targetPool = chooseMemoryTrailTargetPool(targets);
  const practiceWindows = buildPracticeWindows(targetPool);
  const currentPracticeWindow = chooseInitialPracticeWindow(practiceWindows);
  const targetStats = Object.fromEntries(targetPool.map((target) => [target.id, createMemoryTrailTargetStats(target)]));
  const initiallyIntroducedTargetIds = [];
  targetPool.forEach((target) => {
    if (hasExplicitNewTargetIds && !newTargetIdSet.has(target.id) && targetStats[target.id]) {
      targetStats[target.id].exposedCount = 1;
      targetStats[target.id].guidedTapCount = 1;
      targetStats[target.id].isIntroduced = true;
      targetStats[target.id].introducedAtPrompt = 0;
      initiallyIntroducedTargetIds.push(target.id);
    }
  });
  const sessionSeconds = options.sessionSeconds || DEFAULT_SESSION_SECONDS;
  const dailyTrailFixedCamera = normalizeDailyTrailFixedCamera(options.dailyTrailFixedCamera);
  const memoryTrail = {
    active: true,
    adaptive: true,
    audioSessionId: `memory-trail-audio-${++memoryTrailAudioSessionSequence}`,
    source: options.source || "memory-trail",
    activityId: activity?.id || "",
    maxNewTargets: resolveMemoryTrailNewTargetLimit(options, activity),
    requireAllTargets: Boolean(activity?.memoryTrailRequireAllTargets),
    sessionSeconds,
    startedAt: Date.now(),
    sessionPhase: "learn",
    phase: "idle",
    message: "First, learn a small group of places. Then practice from memory.",
    promptName: "",
    responseChipTargetId: null,
    correction: null,
    currentPromptTargetId: null,
    currentPromptTargetLabel: "",
    currentPromptKey: "",
    currentPromptType: "guided",
    currentPromptMode: "introducing",
    currentPromptReason: "",
    currentPromptStartedAtMs: null,
    instructionLabel: "Tap the highlighted place.",
    visibleInstructionText: "Tap the highlighted place.",
    currentInstructionKey: "",
    lastSpokenTargetPromptKey: "",
    answerChoices: [],
    trayFeedback: null,
    targetPool,
    targetPoolIds: targetPool.map((target) => target.id),
    practiceWindows,
    currentWindowIndex: 0,
    currentPracticeWindow,
    introducedTargetIds: initiallyIntroducedTargetIds,
    dailyTrailNewTargetIds: [...newTargetIdSet],
    dailyTrailSessionNumber: Number(options.dailyTrailSessionNumber) || 0,
    sectionTitle: options.sectionTitle || "",
    sectionIndex: Number.isInteger(options.sectionIndex) ? options.sectionIndex : null,
    sectionCount: Number.isInteger(options.sectionCount) ? options.sectionCount : null,
    sectionQuizView: normalizeMemoryTrailSectionQuizView(options.sectionQuizView),
    dailyTrailFixedCamera,
    dailyTrailFixedCameraLocked: false,
    dailyTrailMobileSectionQuizCamera: normalizeMemoryTrailSectionQuizView(options.dailyTrailMobileSectionQuizCamera),
    lastMobileSectionQuizCameraKey: "",
    lastAuthoritativeSectionQuizCameraKey: "",
    lastAuthoritativeSectionQuizCameraMode: "",
    lastAuthoritativeSectionQuizCameraSectionIndex: null,
    lastDailyTrailMobileLearnCameraKey: "",
    lastDailyTrailMobileLearnCameraPromptKey: "",
    lastDailyTrailMobileLearnCameraTargetId: "",
    dailyTrailNonLearnCamera: normalizeMemoryTrailSectionQuizView(options.dailyTrailNonLearnCamera),
    dailyTrailQuizCamera: normalizeDailyTrailTargetQuizCamera(options.dailyTrailQuizCamera),
    lastDailyTrailQuizCameraKey: "",
    checkpointReview: options.checkpointReview === true,
    completedTrailReview: options.completedTrailReview === true,
    checkpointTargetQueue: options.checkpointReview === true
      ? getCheckpointMemoryTrailTargetQueue(targetPool)
      : [],
    completedTrailReviewTargetQueue: options.completedTrailReview === true
      ? targetPool.map((target) => target.id).filter(Boolean)
      : [],
    dailyTrailPracticeRoundOrders: {},
    lastDailyTrailPracticeRoundOrder: [],
    dailyTrailInsertedReviewBatchKeys: [],
    dailyTrailInsertedReviewTargetIds: insertedReviewTargetIds,
    dailyTrailWeakReviewTargetIds: weakReviewTargetIds,
    dailyTrailMissedNewRetryTargetIds: [],
    dailyTrailRetriedNewTargetIds: [],
    targetStats,
    promptCount: 0,
    retrievalPromptCount: 0,
    correctCount: 0,
    incorrectCount: 0,
    slowCorrectMsByTargetId: {},
    recentResults: [],
    recentRetrievalResults: [],
    promptHistory: [],
    lastPromptedTargetId: null,
    lastCameraWindowKey: "",
    lastSectionQuizCameraKey: "",
    lastCheckpointCameraKey: "",
    timers: [],
    previousRevealedTargetIds: [...(activeStudySession?.revealedTargetIds || [])]
  };

  introducePracticeWindow(memoryTrail, currentPracticeWindow);
  updateMemoryTrailDebugObject(memoryTrail);
  return memoryTrail;
}

function normalizeMemoryTrailSectionQuizView(quizView = null) {
  const center = Array.isArray(quizView?.center) && quizView.center.length >= 2
    ? [Number(quizView.center[0]), Number(quizView.center[1])]
    : null;
  const zoom = Number(quizView?.zoom);

  if (!center || !center.every(Number.isFinite) || !Number.isFinite(zoom)) {
    return null;
  }

  return {
    center,
    zoom,
    bearing: Number.isFinite(Number(quizView.bearing)) ? Number(quizView.bearing) : 0,
    pitch: Number.isFinite(Number(quizView.pitch)) ? Number(quizView.pitch) : 0,
    duration: Number.isFinite(Number(quizView.duration)) ? Number(quizView.duration) : 850
  };
}

function normalizeDailyTrailTargetQuizCamera(config = null) {
  const camera = normalizeMemoryTrailSectionQuizView(config);
  const targetIds = [...new Set((Array.isArray(config?.targetIds) ? config.targetIds : [])
    .map((targetId) => String(targetId || "").trim())
    .filter(Boolean))];

  return camera && targetIds.length > 0 ? {
    ...camera,
    targetIds,
    cameraContext: String(config?.cameraContext || "daily-trail-target-quiz").trim(),
    source: String(config?.source || "daily-trail-target-quiz-camera").trim()
  } : null;
}

function normalizeDailyTrailMobileLearnCamera(config = null) {
  const camera = normalizeMemoryTrailSectionQuizView(config);

  return camera ? {
    ...camera,
    cameraContext: String(config?.cameraContext || "learn-target-focus").trim(),
    source: String(config?.source || "daily-trail-mobile-learn-fit").trim()
  } : null;
}

function getPreviousMemoryTrailSection(activity = session.currentActivity) {
  const sections = getMemoryTrailSections(activity);

  if (!sections.length || !activeStudySession) {
    return null;
  }

  const previousIndex = (Number(activeStudySession.memoryTrailSectionIndex) || 0) - 1;
  if (previousIndex < 0) {
    return null;
  }

  return {
    ...sections[previousIndex],
    sectionIndex: previousIndex,
    sectionCount: sections.length
  };
}

function normalizeDailyTrailFixedCamera(config = null) {
  const camera = normalizeMemoryTrailSectionQuizView(config);
  const afterLearnTargetId = String(config?.afterLearnTargetId || "").trim();

  return camera && afterLearnTargetId ? { afterLearnTargetId, camera } : null;
}

function isUsMountainRangesMemoryTrail(memoryTrail = getActiveMemoryTrail()) {
  const activityId = memoryTrail?.activityId || session.currentActivity?.id || "";
  return activityId === usMountainRangesActivityId
    || /^us-physical-(western|eastern|midwestern|alaska)-mountains$/.test(activityId);
}

function usesFixedSectionMemoryTrailCamera(memoryTrail = getActiveMemoryTrail()) {
  const activityId = memoryTrail?.activityId || session.currentActivity?.id || "";
  return isUsMountainRangesMemoryTrail(memoryTrail)
    || activityId === usPhysicalRiversActivityId
    || Boolean(memoryTrail?.dailyTrailFixedCameraLocked)
    || Boolean(getActiveDailyTrailNonLearnCamera(memoryTrail));
}

function getActiveDailyTrailFixedCamera(memoryTrail) {
  return isAdaptiveTrailMemoryTrail(memoryTrail) && memoryTrail?.dailyTrailFixedCameraLocked
    ? memoryTrail.dailyTrailFixedCamera?.camera || null
    : null;
}

function getActiveDailyTrailNonLearnCamera(memoryTrail) {
  return isAdaptiveTrailMemoryTrail(memoryTrail)
    && memoryTrail?.sessionPhase !== "learn"
    && !isGuidedMemoryTrailPrompt(memoryTrail)
    ? memoryTrail.dailyTrailNonLearnCamera || null
    : null;
}

function getActiveDailyTrailTargetQuizCamera(memoryTrail, selection = {}) {
  const quizCamera = memoryTrail?.dailyTrailQuizCamera;
  const targetId = String(selection?.targetId || memoryTrail?.currentPromptTargetId || "").trim();
  return memoryTrail?.source === "daily-trail"
    && !isMixedDailyTrailCheckpointMemoryTrail(memoryTrail)
    && memoryTrail?.sessionPhase === "practice"
    && selection?.promptType === "name_to_place"
    && targetId
    && quizCamera?.targetIds?.includes(targetId)
    ? quizCamera
    : null;
}

function getActiveDailyTrailMobileSectionQuizCamera(memoryTrail) {
  return isAdaptiveTrailMemoryTrail(memoryTrail)
    && memoryTrail?.sessionPhase !== "learn"
    && !isGuidedMemoryTrailPrompt(memoryTrail)
    && isCompactTouchLayout()
    ? memoryTrail.dailyTrailMobileSectionQuizCamera || null
    : null;
}

const memoryTrailSectionQuizCameraContext = "section-quiz-view";
const memoryTrailSectionQuizCameraSource = "memory-trail-section-quiz-camera";
const genericMobileSectionQuizMaxLongitudeSpan = 72;
const genericMobileSectionQuizMaxLatitudeSpan = 58;
const genericMobileSectionQuizAntimeridianSpan = 170;

function shouldUseGenericMobileSectionQuizCamera(memoryTrail = getActiveMemoryTrail()) {
  const viewportWidth = window.innerWidth || document.documentElement?.clientWidth || 0;
  const viewportHeight = window.innerHeight || document.documentElement?.clientHeight || 0;
  const shortLandscape = viewportHeight > 0 && viewportWidth > viewportHeight && viewportHeight < 520;
  return isAdaptiveTrailMemoryTrail(memoryTrail)
    && isCompactTouchLayout()
    && !shortLandscape
    && memoryTrail?.sessionPhase !== "learn"
    && !isGuidedMemoryTrailPrompt(memoryTrail)
    && !isCompletedDailyTrailReviewMemoryTrail(memoryTrail);
}

function recordSectionQuizCameraTrace(memoryTrail, status, details = {}) {
  recordCameraDevTraceEvent({
    eventType: "section-quiz-camera",
    status,
    activityId: memoryTrail?.activityId || session?.currentActivity?.id || "",
    activityTitle: session?.currentActivity?.title || "",
    sectionIndex: memoryTrail?.sectionIndex ?? null,
    sectionTitle: memoryTrail?.sectionTitle || "",
    targetId: details.targetId || memoryTrail?.currentPromptTargetId || "",
    targetLabel: details.targetLabel || memoryTrail?.currentPromptTargetLabel || "",
    targetIds: Array.isArray(details.targetIds) ? details.targetIds : [],
    targetLabels: Array.isArray(details.targetLabels) ? details.targetLabels : [],
    cameraContext: details.cameraContext || memoryTrailSectionQuizCameraContext,
    cameraSource: details.cameraSource || memoryTrailSectionQuizCameraSource,
    requestType: details.requestType || "",
    requestedCamera: details.requestedCamera || null,
    resultingCamera: details.resultingCamera || null,
    sectionBounds: details.sectionBounds || null,
    padding: details.padding || null,
    offset: details.offset || null,
    reason: details.reason || ""
  });
}

function getMemoryTrailSectionQuizCameraKey(memoryTrail, quizView) {
  return [
    memoryTrail?.activityId || "",
    memoryTrail?.sectionIndex ?? "section",
    quizView.center.map((value) => value.toFixed(5)).join(","),
    quizView.zoom.toFixed(4),
    quizView.bearing.toFixed(2),
    quizView.pitch.toFixed(2)
  ].join(":");
}

function isMapAtMemoryTrailSectionQuizCamera(quizView) {
  try {
    const center = runner?.map?.getCenter?.();
    const zoom = runner?.map?.getZoom?.();
    const bearing = runner?.map?.getBearing?.();
    const pitch = runner?.map?.getPitch?.();

    if (!center || !Array.isArray(quizView?.center)) {
      return false;
    }

    return Math.abs(center.lng - quizView.center[0]) <= 0.05
      && Math.abs(center.lat - quizView.center[1]) <= 0.05
      && Math.abs((Number(zoom) || 0) - quizView.zoom) <= 0.025
      && Math.abs((Number(bearing) || 0) - quizView.bearing) <= 0.1
      && Math.abs((Number(pitch) || 0) - quizView.pitch) <= 0.1;
  } catch {
    return false;
  }
}

function getMemoryTrailSectionTargetSet(memoryTrail = getActiveMemoryTrail()) {
  const targets = Array.isArray(memoryTrail?.targetPool)
    ? memoryTrail.targetPool
    : [];
  return targets.filter((target) => target?.id);
}

function getCameraDevSectionQuizSnapshot() {
  return runner?.getCameraDevSnapshot?.() || {};
}

function isCameraDevSnapshotSectionQuizCamera(memoryTrail, snapshot = getCameraDevSectionQuizSnapshot()) {
  return snapshot?.cameraContext === memoryTrailSectionQuizCameraContext
    && snapshot?.cameraSource === memoryTrailSectionQuizCameraSource
    && (!memoryTrail?.activityId || snapshot.activityId === memoryTrail.activityId)
    && (
      snapshot.sectionIndex == null
      || memoryTrail?.sectionIndex == null
      || snapshot.sectionIndex === memoryTrail.sectionIndex
    );
}

function isAuthoritativeSectionQuizCameraCurrent(memoryTrail, cameraKey = memoryTrail?.lastAuthoritativeSectionQuizCameraKey) {
  return Boolean(
    memoryTrail
    && cameraKey
    && memoryTrail.lastAuthoritativeSectionQuizCameraKey === cameraKey
    && isCameraDevSnapshotSectionQuizCamera(memoryTrail)
  );
}

function markAuthoritativeSectionQuizCameraApplied(memoryTrail, cameraKey, mode, details = {}) {
  if (!memoryTrail || !cameraKey) {
    return;
  }

  memoryTrail.lastAuthoritativeSectionQuizCameraKey = cameraKey;
  memoryTrail.lastAuthoritativeSectionQuizCameraMode = mode || "";
  memoryTrail.lastAuthoritativeSectionQuizCameraSectionIndex = memoryTrail.sectionIndex;
  recordSectionQuizCameraTrace(memoryTrail, "applied", {
    ...details,
    reason: mode ? `${mode} section quiz camera applied` : "section quiz camera applied"
  });
}

function getGenericMobileSectionQuizFitDecision(memoryTrail = getActiveMemoryTrail()) {
  const targets = getMemoryTrailSectionTargetSet(memoryTrail);
  const targetIds = targets.map((target) => target.id).filter(Boolean);
  const targetLabels = targets.map((target) => target.name).filter(Boolean);
  const reject = (reason, extra = {}) => ({
    ok: false,
    reason,
    targets,
    targetIds,
    targetLabels,
    ...extra
  });

  if (!shouldUseGenericMobileSectionQuizCamera(memoryTrail)) {
    return reject("generic mobile section quiz camera inactive");
  }

  if (isMixedDailyTrailCheckpointMemoryTrail(memoryTrail)) {
    return reject("checkpoint camera has higher precedence");
  }

  if (getActiveDailyTrailFixedCamera(memoryTrail) || getActiveDailyTrailNonLearnCamera(memoryTrail)) {
    return reject("fixed regional camera has higher precedence");
  }

  if (targets.length === 0) {
    return reject("section has no target geometry");
  }

  if (typeof runner?.getCombinedTargetBounds !== "function") {
    return reject("runner combined bounds helper unavailable");
  }

  const bounds = runner.getCombinedTargetBounds(targets);
  if (
    !Array.isArray(bounds)
    || bounds.length < 2
    || !Array.isArray(bounds[0])
    || !Array.isArray(bounds[1])
  ) {
    return reject("section target bounds unavailable", { bounds: null });
  }

  const longitudeSpan = bounds[1][0] - bounds[0][0];
  const latitudeSpan = bounds[1][1] - bounds[0][1];
  const touchesWorldWrap = bounds[0][0] <= -179 || bounds[1][0] >= 179;

  if (
    touchesWorldWrap
    || longitudeSpan >= genericMobileSectionQuizAntimeridianSpan
  ) {
    return reject("section bounds cross world wrap or antimeridian", { bounds, longitudeSpan, latitudeSpan });
  }

  if (longitudeSpan > genericMobileSectionQuizMaxLongitudeSpan) {
    return reject("section longitude span is too broad for generic mobile fit", { bounds, longitudeSpan, latitudeSpan });
  }

  if (latitudeSpan > genericMobileSectionQuizMaxLatitudeSpan) {
    return reject("section latitude span is too broad for generic mobile fit", { bounds, longitudeSpan, latitudeSpan });
  }

  return {
    ok: true,
    reason: "safe compact section bounds",
    targets,
    targetIds,
    targetLabels,
    bounds,
    longitudeSpan,
    latitudeSpan
  };
}

function getMobileSectionQuizFitPadding() {
  const canvas = runner?.map?.getCanvas?.();
  const mapRect = canvas?.getBoundingClientRect?.();
  const viewportWidth = window.innerWidth || document.documentElement?.clientWidth || 0;
  const viewportHeight = window.innerHeight || document.documentElement?.clientHeight || 0;
  const fallbackRect = {
    left: 0,
    top: 0,
    right: viewportWidth,
    bottom: viewportHeight,
    width: viewportWidth,
    height: viewportHeight
  };
  const rect = mapRect?.width && mapRect?.height ? mapRect : fallbackRect;
  const headerRect = document.querySelector(".poc-header")?.getBoundingClientRect?.();
  const trayRect = document.querySelector("#answer-panel")?.getBoundingClientRect?.();
  const leftInset = Math.max(12, 16 - Math.max(0, rect.left));
  const rightInset = Math.max(12, 16 - Math.max(0, viewportWidth - rect.right));
  const headerBottom = headerRect && headerRect.bottom > rect.top
    ? Math.min(headerRect.bottom, rect.bottom)
    : rect.top;
  const trayTop = trayRect && trayRect.top < rect.bottom
    ? Math.max(trayRect.top, rect.top)
    : rect.bottom;

  const padding = {
    top: Math.max(24, Math.ceil(headerBottom - rect.top + 12)),
    right: Math.max(12, Math.ceil(rightInset)),
    bottom: Math.max(20, Math.ceil(rect.bottom - trayTop > 0 ? 20 : 24)),
    left: Math.max(12, Math.ceil(leftInset))
  };

  const minUsableWidth = Math.min(220, Math.max(80, rect.width * 0.42));
  const minUsableHeight = Math.min(220, Math.max(80, rect.height * 0.42));
  const maxHorizontalPadding = Math.max(24, rect.width - minUsableWidth);
  const maxVerticalPadding = Math.max(32, rect.height - minUsableHeight);
  const horizontalTotal = padding.left + padding.right;
  const verticalTotal = padding.top + padding.bottom;

  if (horizontalTotal > maxHorizontalPadding) {
    const scale = maxHorizontalPadding / horizontalTotal;
    padding.left = Math.max(8, Math.floor(padding.left * scale));
    padding.right = Math.max(8, Math.floor(padding.right * scale));
  }

  if (verticalTotal > maxVerticalPadding) {
    const scale = maxVerticalPadding / verticalTotal;
    padding.top = Math.max(12, Math.floor(padding.top * scale));
    padding.bottom = Math.max(16, Math.floor(padding.bottom * scale));
  }

  return padding;
}

function getMobileSectionQuizFitOffset() {
  const canvas = runner?.map?.getCanvas?.();
  const mapRect = canvas?.getBoundingClientRect?.();
  const viewportHeight = window.innerHeight || document.documentElement?.clientHeight || 0;
  const rect = mapRect?.width && mapRect?.height
    ? mapRect
    : {
        top: 0,
        bottom: viewportHeight,
        height: viewportHeight
      };
  const headerRect = document.querySelector(".poc-header")?.getBoundingClientRect?.();
  const trayRect = document.querySelector("#answer-panel")?.getBoundingClientRect?.();
  const headerBottom = headerRect && headerRect.bottom > rect.top
    ? Math.min(headerRect.bottom, rect.bottom)
    : rect.top;
  const trayTop = trayRect && trayRect.top < rect.bottom
    ? Math.max(trayRect.top, rect.top)
    : rect.bottom;
  const usableTop = Math.min(rect.bottom, Math.max(rect.top, headerBottom + 12));
  const usableBottom = Math.max(usableTop + 80, Math.min(rect.bottom, trayTop - 18));
  const mapCenterY = rect.top + rect.height / 2;
  const usableCenterY = (usableTop + usableBottom) / 2;
  const rawOffsetY = usableCenterY - mapCenterY;
  const maxOffset = Math.max(0, Math.min(150, rect.height * 0.22));
  const offsetY = Math.max(-maxOffset, Math.min(maxOffset, rawOffsetY));

  return [0, Math.round(offsetY)];
}

function getMobileSectionQuizCameraKey(memoryTrail, targets = [], padding = {}, offset = [0, 0]) {
  const canvas = runner?.map?.getCanvas?.();
  return [
    "mobile-section-fit",
    memoryTrail?.activityId || "",
    memoryTrail?.sectionIndex ?? "section",
    targets.map((target) => target.id).filter(Boolean).join(","),
    Math.round(canvas?.clientWidth || window.innerWidth || 0),
    Math.round(canvas?.clientHeight || window.innerHeight || 0),
    Math.round(padding.top || 0),
    Math.round(padding.right || 0),
    Math.round(padding.bottom || 0),
    Math.round(padding.left || 0),
    Math.round(offset[0] || 0),
    Math.round(offset[1] || 0)
  ].join(":");
}

function applyGenericMobileSectionQuizCamera(memoryTrail, selection = {}, options = {}) {
  if (typeof runner?.fitTargets !== "function") {
    return false;
  }

  const fitDecision = getGenericMobileSectionQuizFitDecision(memoryTrail);
  if (!fitDecision.ok) {
    recordSectionQuizCameraTrace(memoryTrail, "rejected", {
      reason: fitDecision.reason,
      targetIds: fitDecision.targetIds,
      targetLabels: fitDecision.targetLabels,
      sectionBounds: fitDecision.bounds || null
    });
    return false;
  }

  recordSectionQuizCameraTrace(memoryTrail, "accepted", {
    reason: fitDecision.reason,
    targetIds: fitDecision.targetIds,
    targetLabels: fitDecision.targetLabels,
    sectionBounds: fitDecision.bounds
  });

  const targets = fitDecision.targets;
  const padding = getMobileSectionQuizFitPadding();
  const offset = getMobileSectionQuizFitOffset();
  const cameraKey = getMobileSectionQuizCameraKey(memoryTrail, targets, padding, offset);
  if (memoryTrail.lastMobileSectionQuizCameraKey === cameraKey) {
    if (isAuthoritativeSectionQuizCameraCurrent(memoryTrail, cameraKey)) {
      return false;
    }
    recordSectionQuizCameraTrace(memoryTrail, "reapply", {
      reason: "cached generic section camera key no longer matches active camera context",
      targetIds: fitDecision.targetIds,
      targetLabels: fitDecision.targetLabels,
      sectionBounds: fitDecision.bounds,
      padding,
      offset
    });
  }

  if (targets.length === 0) {
    return false;
  }

  const didMove = runner.fitTargets(targets, {
    padding,
    offset,
    maxZoom: 7.25,
    duration: Number.isFinite(Number(options.duration)) ? Number(options.duration) : 850,
    cameraContext: memoryTrailSectionQuizCameraContext,
    source: memoryTrailSectionQuizCameraSource,
    sectionIndex: memoryTrail.sectionIndex,
    sectionTitle: memoryTrail.sectionTitle || "",
    skipCameraDevOverride: Boolean(options.skipCameraDevOverride)
  });

  if (didMove) {
    memoryTrail.lastMobileSectionQuizCameraKey = cameraKey;
    memoryTrail.lastSectionQuizCameraKey = cameraKey;
    markAuthoritativeSectionQuizCameraApplied(memoryTrail, cameraKey, "generic", {
      targetIds: fitDecision.targetIds,
      targetLabels: fitDecision.targetLabels,
      sectionBounds: fitDecision.bounds,
      padding,
      offset
    });
  }

  debugMemoryTrail("mobile section quiz camera", {
    didMove,
    sectionTitle: memoryTrail.sectionTitle,
    sectionIndex: memoryTrail.sectionIndex,
    targetIds: targets.map((target) => target.id),
    padding,
    offset,
    targetId: selection?.targetId || memoryTrail.currentPromptTargetId || "",
    promptType: selection?.promptType || memoryTrail.currentPromptType || ""
  });
  return didMove;
}

function getDailyTrailMobileLearnCameraOverride(target) {
  return normalizeDailyTrailMobileLearnCamera(target?.mobileDailyTrailLearnCamera);
}

function isGenericMobileDailyTrailLearnTarget(memoryTrail, selection = {}, target = null) {
  return memoryTrail?.source === "daily-trail"
    && currentAppScreen === "daily-trail-gameplay"
    && isCompactTouchLayout()
    && session.currentActivity?.id !== continentsOceansActivityId
    && !isMixedDailyTrailCheckpointMemoryTrail(memoryTrail)
    && !isCompletedDailyTrailReviewMemoryTrail(memoryTrail)
    && selection?.promptType === "guided"
    && selection?.mode === "learn"
    && memoryTrail?.sessionPhase === "learn"
    && memoryTrail.currentPromptTargetId === selection?.targetId
    && target?.id === selection?.targetId
    && target?.kind === "shape"
    && !getActiveDailyTrailFixedCamera(memoryTrail);
}

function getMobileDailyTrailLearnFitPadding() {
  const canvas = runner?.map?.getCanvas?.();
  const mapRect = canvas?.getBoundingClientRect?.();
  const viewportWidth = window.innerWidth || document.documentElement?.clientWidth || 0;
  const viewportHeight = window.innerHeight || document.documentElement?.clientHeight || 0;
  const rect = mapRect?.width && mapRect?.height
    ? mapRect
    : {
        left: 0,
        top: 0,
        right: viewportWidth,
        bottom: viewportHeight,
        width: viewportWidth,
        height: viewportHeight
      };
  const headerRect = document.querySelector(".poc-header")?.getBoundingClientRect?.();
  const trayRect = document.querySelector("#answer-panel")?.getBoundingClientRect?.();
  const headerBottom = headerRect && headerRect.bottom > rect.top
    ? Math.min(headerRect.bottom, rect.bottom)
    : rect.top;
  const trayTop = trayRect && trayRect.top < rect.bottom
    ? Math.max(trayRect.top, rect.top)
    : rect.bottom;
  const usableTop = Math.min(rect.bottom, Math.max(rect.top, headerBottom + 12));
  const usableBottom = Math.max(usableTop + 96, Math.min(rect.bottom, trayTop - 18));
  const usableHeight = Math.max(96, usableBottom - usableTop);
  const maxFocusWidth = Math.max(96, rect.width - 24);
  const maxFocusHeight = Math.max(96, usableHeight - 12);
  const focusWidth = Math.min(maxFocusWidth, Math.min(210, Math.max(180, rect.width * 0.58)));
  const focusHeight = Math.min(maxFocusHeight, Math.min(210, Math.max(180, usableHeight * 0.52)));
  const desiredCenterY = usableTop + usableHeight * 0.415;
  const minCenterY = usableTop + focusHeight / 2;
  const maxCenterY = usableBottom - focusHeight / 2;
  const centerY = Math.max(minCenterY, Math.min(maxCenterY, desiredCenterY));
  const horizontalPadding = Math.max(12, Math.round((rect.width - focusWidth) / 2));

  return {
    top: Math.max(12, Math.round(centerY - focusHeight / 2 - rect.top)),
    right: horizontalPadding,
    bottom: Math.max(20, Math.round(rect.bottom - (centerY + focusHeight / 2))),
    left: horizontalPadding
  };
}

function getDailyTrailMobileLearnCameraKey(memoryTrail, target, padding = {}, camera = null) {
  const canvas = runner?.map?.getCanvas?.();
  return [
    "daily-trail-mobile-learn",
    memoryTrail?.activityId || "",
    memoryTrail?.currentPromptKey || "",
    target?.id || "",
    Math.round(canvas?.clientWidth || window.innerWidth || 0),
    Math.round(canvas?.clientHeight || window.innerHeight || 0),
    Math.round(padding.top || 0),
    Math.round(padding.right || 0),
    Math.round(padding.bottom || 0),
    Math.round(padding.left || 0),
    camera ? camera.center.map((value) => value.toFixed(5)).join(",") : "fit",
    camera ? camera.zoom.toFixed(4) : "fit"
  ].join(":");
}

function hasAppliedDailyTrailMobileLearnCameraForPrompt(memoryTrail, selection = {}) {
  return Boolean(
    memoryTrail?.lastDailyTrailMobileLearnCameraPromptKey
    && memoryTrail.lastDailyTrailMobileLearnCameraPromptKey === memoryTrail.currentPromptKey
    && memoryTrail.lastDailyTrailMobileLearnCameraTargetId === selection?.targetId
  );
}

function applyMemoryTrailSectionQuizCamera(memoryTrail, selection = {}, options = {}) {
  if (isMixedDailyTrailCheckpointMemoryTrail(memoryTrail)) {
    return false;
  }

  const mobileSectionQuizCamera = getActiveDailyTrailMobileSectionQuizCamera(memoryTrail);
  if (mobileSectionQuizCamera) {
    if (typeof runner?.moveCamera !== "function") {
      return false;
    }

    const cameraKey = getMemoryTrailSectionQuizCameraKey(memoryTrail, mobileSectionQuizCamera);
    if (
      memoryTrail.lastSectionQuizCameraKey === cameraKey
      && isMapAtMemoryTrailSectionQuizCamera(mobileSectionQuizCamera)
      && isAuthoritativeSectionQuizCameraCurrent(memoryTrail, cameraKey)
    ) {
      return false;
    }

    if (memoryTrail.lastSectionQuizCameraKey === cameraKey) {
      recordSectionQuizCameraTrace(memoryTrail, "reapply", {
        reason: "cached explicit section camera key no longer matches active camera context",
        requestedCamera: mobileSectionQuizCamera
      });
    } else {
      recordSectionQuizCameraTrace(memoryTrail, "selected", {
        reason: "explicit mobile section quiz override selected",
        requestedCamera: mobileSectionQuizCamera
      });
    }

    const didMove = runner.moveCamera({
      center: mobileSectionQuizCamera.center,
      zoom: mobileSectionQuizCamera.zoom,
      bearing: mobileSectionQuizCamera.bearing,
      pitch: mobileSectionQuizCamera.pitch,
      padding: mobileSectionQuizCamera.padding || { top: 0, right: 0, bottom: 0, left: 0 },
      duration: Number.isFinite(Number(options.duration)) ? Number(options.duration) : mobileSectionQuizCamera.duration,
      retainPadding: false,
      essential: true
    }, {
      cameraContext: memoryTrailSectionQuizCameraContext,
      source: memoryTrailSectionQuizCameraSource,
      requestType: "easeTo",
      activityId: memoryTrail.activityId,
      sectionIndex: memoryTrail.sectionIndex,
      sectionTitle: memoryTrail.sectionTitle || ""
    }, "easeTo");

    if (didMove) {
      memoryTrail.lastSectionQuizCameraKey = cameraKey;
      markAuthoritativeSectionQuizCameraApplied(memoryTrail, cameraKey, "explicit", {
        requestedCamera: mobileSectionQuizCamera
      });
    }
    return didMove;
  }

  if (applyGenericMobileSectionQuizCamera(memoryTrail, selection, options)) {
    return true;
  }

  const dailyTrailFixedCamera = getActiveDailyTrailFixedCamera(memoryTrail)
    || getActiveDailyTrailNonLearnCamera(memoryTrail);
  if (
    !usesFixedSectionMemoryTrailCamera(memoryTrail)
    || (!memoryTrail?.sectionQuizView && !dailyTrailFixedCamera)
    || typeof runner?.moveCamera !== "function"
  ) {
    return false;
  }

  if (!dailyTrailFixedCamera && (selection?.promptType === "guided" || memoryTrail.sessionPhase === "learn")) {
    memoryTrail.lastSectionQuizCameraKey = "";
    return false;
  }

  const quizView = dailyTrailFixedCamera || memoryTrail.sectionQuizView;
  const cameraKey = getMemoryTrailSectionQuizCameraKey(memoryTrail, quizView);
  if (
    memoryTrail.lastSectionQuizCameraKey === cameraKey
    && isMapAtMemoryTrailSectionQuizCamera(quizView)
    && isAuthoritativeSectionQuizCameraCurrent(memoryTrail, cameraKey)
  ) {
    return false;
  }

  if (memoryTrail.lastSectionQuizCameraKey === cameraKey) {
    recordSectionQuizCameraTrace(memoryTrail, "reapply", {
      reason: "cached fallback section camera key no longer matches active camera context",
      requestedCamera: quizView
    });
  } else {
    recordSectionQuizCameraTrace(memoryTrail, "selected", {
      reason: dailyTrailFixedCamera
        ? "fixed regional section quiz camera selected"
        : "configured section quiz camera selected",
      requestedCamera: quizView
    });
  }

  // A late practice-window or study-view movement must not win over recall.
  const didMove = runner.moveCamera({
    center: quizView.center,
    zoom: quizView.zoom,
    bearing: quizView.bearing,
    pitch: quizView.pitch,
    padding: quizView.padding || { top: 0, right: 0, bottom: 0, left: 0 },
    duration: Number.isFinite(Number(options.duration)) ? Number(options.duration) : quizView.duration,
    retainPadding: false,
    essential: true
  }, {
    cameraContext: memoryTrailSectionQuizCameraContext,
    source: memoryTrailSectionQuizCameraSource,
    requestType: "easeTo",
    activityId: memoryTrail.activityId,
    sectionIndex: memoryTrail.sectionIndex,
    sectionTitle: memoryTrail.sectionTitle || ""
  }, "easeTo");

  if (didMove) {
    memoryTrail.lastSectionQuizCameraKey = cameraKey;
    markAuthoritativeSectionQuizCameraApplied(memoryTrail, cameraKey, dailyTrailFixedCamera ? "fixed" : "configured", {
      requestedCamera: quizView
    });
  }

  debugMemoryTrail("section quiz camera", {
    didMove,
    sectionTitle: memoryTrail.sectionTitle,
    sectionIndex: memoryTrail.sectionIndex,
    quizView,
    targetId: selection?.targetId || memoryTrail.currentPromptTargetId || "",
    promptType: selection?.promptType || memoryTrail.currentPromptType || ""
  });
  return didMove;
}

function applyDailyTrailTargetQuizCamera(memoryTrail, selection = {}, options = {}) {
  const quizCamera = getActiveDailyTrailTargetQuizCamera(memoryTrail, selection);
  const targetId = String(selection?.targetId || memoryTrail?.currentPromptTargetId || "").trim();
  if (!quizCamera || !targetId || typeof runner?.moveCamera !== "function") {
    return false;
  }

  if (isCompactTouchLayout() && isAuthoritativeSectionQuizCameraCurrent(memoryTrail)) {
    recordSectionQuizCameraTrace(memoryTrail, "suppressed", {
      reason: "target quiz camera suppressed while authoritative mobile section quiz camera is active",
      targetId,
      cameraContext: quizCamera.cameraContext,
      cameraSource: quizCamera.source,
      requestedCamera: quizCamera
    });
    return false;
  }

  const cameraKey = `${targetId}:${getMemoryTrailSectionQuizCameraKey(memoryTrail, quizCamera)}`;
  if (
    memoryTrail.lastDailyTrailQuizCameraKey === cameraKey
    && isMapAtMemoryTrailSectionQuizCamera(quizCamera)
  ) {
    return false;
  }

  const didMove = runner.moveCamera({
    center: quizCamera.center,
    zoom: quizCamera.zoom,
    bearing: quizCamera.bearing,
    pitch: quizCamera.pitch,
    padding: quizCamera.padding || { top: 0, right: 0, bottom: 0, left: 0 },
    duration: Number.isFinite(Number(options.duration)) ? Number(options.duration) : quizCamera.duration,
    retainPadding: false,
    essential: true
  }, {
    cameraContext: quizCamera.cameraContext,
    source: quizCamera.source,
    requestType: "easeTo",
    activityId: memoryTrail.activityId,
    targetId
  }, "easeTo");

  if (didMove) {
    memoryTrail.lastDailyTrailQuizCameraKey = cameraKey;
  }
  return didMove;
}

function scheduleMemoryTrailSectionQuizCameraCheck(memoryTrail, selection = {}) {
  if (isMixedDailyTrailCheckpointMemoryTrail(memoryTrail)) {
    return false;
  }

  const mobileSectionQuizCamera = getActiveDailyTrailMobileSectionQuizCamera(memoryTrail);
  const shouldUseGenericMobileCamera = shouldUseGenericMobileSectionQuizCamera(memoryTrail)
    && !mobileSectionQuizCamera
    && !isMixedDailyTrailCheckpointMemoryTrail(memoryTrail);
  const dailyTrailFixedCamera = getActiveDailyTrailFixedCamera(memoryTrail)
    || getActiveDailyTrailNonLearnCamera(memoryTrail);
  const quizView = mobileSectionQuizCamera || dailyTrailFixedCamera || memoryTrail?.sectionQuizView;
  if (
    (!shouldUseGenericMobileCamera && (!usesFixedSectionMemoryTrailCamera(memoryTrail) || !quizView))
    || (!mobileSectionQuizCamera && !shouldUseGenericMobileCamera && !dailyTrailFixedCamera && (selection?.promptType === "guided" || memoryTrail.sessionPhase === "learn"))
  ) {
    return false;
  }

  const promptKey = memoryTrail.currentPromptKey;
  const targetId = selection?.targetId || memoryTrail.currentPromptTargetId || "";
  const timeoutId = window.setTimeout(() => {
    if (
      !isCurrentMemoryTrailState(memoryTrail)
      || memoryTrail.currentPromptKey !== promptKey
      || memoryTrail.currentPromptTargetId !== targetId
      || (!getActiveDailyTrailFixedCamera(memoryTrail)
        && !getActiveDailyTrailNonLearnCamera(memoryTrail)
        && memoryTrail.sessionPhase === "learn")
    ) {
      return;
    }

    applyMemoryTrailSectionQuizCamera(memoryTrail, selection, { duration: 260 });
  }, Math.max(900, (quizView?.duration || 850) + 140));
  memoryTrail.timers.push(timeoutId);
  return true;
}

function lockDailyTrailFixedCameraAfterLearn(memoryTrail, targetId) {
  const fixedCamera = memoryTrail?.dailyTrailFixedCamera;
  if (
    memoryTrail?.source !== "daily-trail"
    || !fixedCamera
    || memoryTrail.dailyTrailFixedCameraLocked
    || !isGuidedMemoryTrailPrompt(memoryTrail)
    || targetId !== fixedCamera.afterLearnTargetId
  ) {
    return false;
  }

  memoryTrail.dailyTrailFixedCameraLocked = true;
  memoryTrail.lastSectionQuizCameraKey = "";
  return applyMemoryTrailSectionQuizCamera(memoryTrail, { targetId, promptType: "fixed-camera" });
}

function createMemoryTrailTargetStats(target) {
  return {
    targetId: target.id,
    displayName: getTargetChipLabel(target) || target.completedLabelName || target.name || target.id,
    exposedCount: 0,
    guidedTapCount: 0,
    nameToPlaceAttempts: 0,
    nameToPlaceCorrect: 0,
    nameToPlaceIncorrect: 0,
    placeToNameAttempts: 0,
    placeToNameCorrect: 0,
    placeToNameIncorrect: 0,
    totalRetrievalAttempts: 0,
    totalRetrievalCorrect: 0,
    totalRetrievalIncorrect: 0,
    currentCorrectStreak: 0,
    currentWrongStreak: 0,
    recentMisses: 0,
    immediateRemediationAttempts: 0,
    introducedAtPrompt: null,
    lastPromptedAt: null,
    lastResult: null,
    isWeak: false,
    isIntroduced: false,
    isSessionLearned: false,
    nextDuePrompt: 0,
    lastMissPrompt: null
  };
}

function chooseMemoryTrailTargetPool(targets = []) {
  if (targets.length <= MAX_TOTAL_TARGET_POOL) {
    return [...targets];
  }

  return [...targets].slice(0, Math.max(MIN_TOTAL_TARGET_POOL, Math.min(MAX_TOTAL_TARGET_POOL, targets.length)));
}

function buildPracticeWindows(targets = []) {
  if (targets.length === 0) {
    return [];
  }

  const remaining = [...targets];
  const windows = [];

  while (remaining.length > 0) {
    const seed = remaining.shift();
    const chunkSize = Math.min(MAX_ACTIVE_CHUNK_SIZE, Math.max(MIN_ACTIVE_CHUNK_SIZE, Math.min(ACTIVE_CHUNK_SIZE, remaining.length + 1)));
    const seedCentroid = getTargetCentroid(seed);
    const chunk = [seed];

    remaining
      .map((target) => ({
        target,
        distance: seedCentroid ? getTargetDistance(seedCentroid, getTargetCentroid(target)) : Number.POSITIVE_INFINITY
      }))
      .sort((left, right) => left.distance - right.distance)
      .slice(0, chunkSize - 1)
      .forEach(({ target }) => {
        const index = remaining.findIndex((item) => item.id === target.id);
        if (index >= 0) {
          chunk.push(...remaining.splice(index, 1));
        }
      });

    windows.push(chunk);
  }

  while (
    windows.length > 1
    && windows.at(-1).length < MIN_ACTIVE_CHUNK_SIZE
    && windows.at(-2).length > MIN_ACTIVE_CHUNK_SIZE
  ) {
    windows.at(-1).unshift(windows.at(-2).pop());
  }

  return windows;
}

function getTargetCentroid(target = {}) {
  if (Number.isFinite(target.lon) && Number.isFinite(target.lat)) {
    return { x: target.lon, y: target.lat, type: "lonlat" };
  }

  if (Array.isArray(target.labelAnchor) && target.labelAnchor.length >= 2) {
    const [lon, lat] = target.labelAnchor;
    if (Number.isFinite(lon) && Number.isFinite(lat)) {
      return { x: lon, y: lat, type: "lonlat" };
    }
  }

  if (Number.isFinite(target.focusLon) && Number.isFinite(target.focusLat)) {
    return { x: target.focusLon, y: target.focusLat, type: "lonlat" };
  }

  if (target.labelPosition && Number.isFinite(target.labelPosition.x) && Number.isFinite(target.labelPosition.y)) {
    return { x: target.labelPosition.x, y: target.labelPosition.y, type: "screen" };
  }

  return null;
}

function getTargetDistance(left, right) {
  if (!left || !right) {
    return Number.POSITIVE_INFINITY;
  }

  const scaleX = left.type === "lonlat" && right.type === "lonlat"
    ? Math.cos(((left.y + right.y) / 2) * Math.PI / 180)
    : 1;
  return Math.hypot((left.x - right.x) * scaleX, left.y - right.y);
}

function chooseInitialPracticeWindow(practiceWindows = []) {
  return practiceWindows[0] || [];
}

function introducePracticeWindow(memoryTrail, practiceWindow = [], newTargets = practiceWindow) {
  memoryTrail.currentPracticeWindow = practiceWindow;
  newTargets.forEach((target) => {
    const stats = memoryTrail.targetStats[target.id];
    if (!stats?.isIntroduced) {
      stats.isIntroduced = true;
      stats.introducedAtPrompt = memoryTrail.promptCount;
      memoryTrail.introducedTargetIds.push(target.id);
    }
  });
}

function getMaxNewTargetsForSession(memoryTrail) {
  const targetPoolCount = memoryTrail?.targetPoolIds?.length || 0;
  const configuredLimit = Number.isFinite(memoryTrail?.maxNewTargets)
    ? memoryTrail.maxNewTargets
    : MAX_NEW_TARGETS_PER_SESSION;
  return Math.min(configuredLimit, targetPoolCount);
}

function getTargetById(memoryTrail, targetId) {
  return memoryTrail?.targetPool?.find((target) => target.id === targetId) || session.getFeature(targetId);
}

function composeNextPracticeWindow(memoryTrail, nextWindow = []) {
  const maxNewTargets = getMaxNewTargetsForSession(memoryTrail);
  const availableNewSlots = Math.max(0, maxNewTargets - memoryTrail.introducedTargetIds.length);
  const nextNewTargets = nextWindow
    .filter((target) => target?.id && !memoryTrail.targetStats[target.id]?.isIntroduced)
    .slice(0, availableNewSlots);
  const reviewTargets = getIntroducedMemoryTrailStats(memoryTrail)
    .sort((left, right) => left.lastPromptedAt - right.lastPromptedAt || left.totalRetrievalCorrect - right.totalRetrievalCorrect)
    .map((stats) => getTargetById(memoryTrail, stats.targetId))
    .filter(Boolean);
  const byId = new Map();

  [...nextNewTargets, ...reviewTargets, ...memoryTrail.currentPracticeWindow].forEach((target) => {
    if (target?.id && !byId.has(target.id) && byId.size < MAX_ACTIVE_CHUNK_SIZE) {
      byId.set(target.id, target);
    }
  });

  return {
    practiceWindow: [...byId.values()],
    newTargets: nextNewTargets
  };
}

function isGuidedMemoryTrailPrompt(memoryTrail) {
  return memoryTrail?.currentPromptType === "guided";
}

function isNameToPlaceMemoryTrailPrompt(memoryTrail) {
  return memoryTrail?.currentPromptType === "name_to_place";
}

function isPlaceToNameMemoryTrailPrompt(memoryTrail) {
  return memoryTrail?.currentPromptType === "place_to_name";
}

function hasTargetCompletedGuidedExposure(stats) {
  return Boolean(stats?.exposedCount > 0 && stats.guidedTapCount > 0);
}

function hasTargetMetSessionLearnedRule(stats) {
  return Boolean(
    stats
    && stats.totalRetrievalCorrect >= SESSION_LEARNED_MIN_CORRECT
    && stats.nameToPlaceCorrect >= 1
    && stats.placeToNameCorrect >= 1
    && stats.recentMisses < 2
  );
}

function isDailyTrailMemoryTrail(memoryTrail) {
  return memoryTrail?.source === "daily-trail";
}

function isUnitedStatesMemoryTrail(memoryTrail) {
  return memoryTrail?.source === UNITED_STATES_MEMORY_TRAIL_SOURCE;
}

function isAdaptiveTrailMemoryTrail(memoryTrail) {
  return isDailyTrailMemoryTrail(memoryTrail) || isUnitedStatesMemoryTrail(memoryTrail);
}

function getAdaptiveTrailGameplayScreen(memoryTrail) {
  return isUnitedStatesMemoryTrail(memoryTrail) ? "united-states-trail-gameplay" : "daily-trail-gameplay";
}

function isActiveAdaptiveTrailMemoryTrailVisualState(memoryTrail, selection = {}) {
  if (!isAdaptiveTrailMemoryTrail(memoryTrail) || memoryTrail?.active === false) {
    return false;
  }

  const promptType = selection.promptType || memoryTrail?.currentPromptType || "";
  const phase = memoryTrail?.phase || "";
  return Boolean(
    promptType
    && phase !== "idle"
    && phase !== "complete"
    && currentAppScreen === getAdaptiveTrailGameplayScreen(memoryTrail)
  );
}

function shouldSuppressDailyTrailStudyTargetEmphasis(memoryTrail, selection = {}) {
  return isActiveAdaptiveTrailMemoryTrailVisualState(memoryTrail, selection);
}

function getStatsRetrievalCorrectTarget(stats, memoryTrail = null) {
  if (isAdaptiveTrailMemoryTrail(memoryTrail)) {
    return getDailyTrailRetrievalCorrectTarget(stats, memoryTrail);
  }

  return stats?.isWeak || stats?.totalRetrievalIncorrect > 1
    ? WEAK_SESSION_CORRECT_TARGET
    : BASE_SESSION_CORRECT_TARGET;
}

function getDailyTrailRetrievalCorrectTarget(stats, memoryTrail = null) {
  if (isCompletedDailyTrailReviewMemoryTrail(memoryTrail)) {
    return 1;
  }

  if (!stats) {
    return DAILY_TRAIL_SESSION_CORRECT_TARGET;
  }

  if (stats.isWeak || stats.totalRetrievalIncorrect > 0) {
    const remainingPostMissCorrect = Math.max(0, DAILY_TRAIL_WEAK_CORRECT_TARGET - stats.currentCorrectStreak);
    return Math.max(DAILY_TRAIL_WEAK_CORRECT_TARGET, stats.totalRetrievalCorrect + remainingPostMissCorrect);
  }

  return DAILY_TRAIL_SESSION_CORRECT_TARGET;
}

function hasDailyTrailStatsMetRecallRequirement(stats, memoryTrail = null) {
  if (!stats || !hasTargetCompletedGuidedExposure(stats)) {
    return false;
  }

  if (isCompletedDailyTrailReviewMemoryTrail(memoryTrail)) {
    return stats.totalRetrievalCorrect >= 1;
  }

  if (stats.isWeak || stats.totalRetrievalIncorrect > 0) {
    return stats.currentCorrectStreak >= DAILY_TRAIL_WEAK_CORRECT_TARGET
      && stats.totalRetrievalCorrect >= DAILY_TRAIL_WEAK_CORRECT_TARGET;
  }

  return stats.totalRetrievalCorrect >= DAILY_TRAIL_SESSION_CORRECT_TARGET
    && stats.nameToPlaceCorrect >= 1;
}

function getMemoryTrailTargetLabel(targetOrId, memoryTrail = getActiveMemoryTrail()) {
  const target = typeof targetOrId === "string"
    ? getTargetById(memoryTrail, targetOrId)
    : targetOrId;

  return getTargetChipLabel(target) || target?.completedLabelName || target?.name || "";
}

function getMemoryTrailActivePromptTarget(memoryTrail = getActiveMemoryTrail()) {
  return memoryTrail?.currentPromptTargetId
    ? getTargetById(memoryTrail, memoryTrail.currentPromptTargetId)
    : null;
}

function getMemoryTrailActivePromptLabel(memoryTrail = getActiveMemoryTrail()) {
  const targetLabel = getMemoryTrailTargetLabel(getMemoryTrailActivePromptTarget(memoryTrail), memoryTrail);
  return targetLabel || memoryTrail?.currentPromptTargetLabel || memoryTrail?.promptName || "";
}

function sanitizeMemoryTrailAudioLookupKey(text) {
  return String(text || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function getMemoryTrailAudioLookupDebug(text) {
  const normalizedText = String(text || "").replace(/\s+/g, " ").trim();
  if (!normalizedText) {
    return {
      text: "",
      generatedAudioFound: false,
      audioPath: "",
      fallback: "missing text"
    };
  }

  try {
    const lookup = await window.GeographyChipSpeech?.getAudioManifest?.();
    const sanitizedKey = sanitizeMemoryTrailAudioLookupKey(normalizedText);
    const audioPath = lookup?.exact?.get?.(normalizedText) || lookup?.sanitized?.get?.(sanitizedKey) || "";
    return {
      text: normalizedText,
      generatedAudioFound: Boolean(audioPath),
      audioPath,
      fallback: audioPath ? "" : "browser speech or silent fallback if muted/unavailable"
    };
  } catch (error) {
    return {
      text: normalizedText,
      generatedAudioFound: false,
      audioPath: "",
      fallback: error?.message || "audio lookup failed"
    };
  }
}

function getRenderedMemoryTrailFindPromptDebug() {
  const prompt = document.querySelector(".memory-trail-recall-target")
    || document.querySelector(".memory-trail-prompt");
  return {
    message: document.querySelector(".memory-trail-message")?.textContent?.trim() || "",
    prompt: prompt?.textContent?.trim() || "",
    instruction: document.querySelector(".memory-trail-visible-instruction")?.textContent?.trim() || "",
    actionLabel: document.querySelector(".memory-trail-instruction-label")?.textContent?.trim() || ""
  };
}

function getMemoryTrailCameraSnapshot() {
  try {
    const center = runner?.map?.getCenter?.();
    return {
      center: center ? [Number(center.lng.toFixed(5)), Number(center.lat.toFixed(5))] : null,
      zoom: Number.isFinite(runner?.map?.getZoom?.()) ? Number(runner.map.getZoom().toFixed(4)) : null,
      bearing: Number.isFinite(runner?.map?.getBearing?.()) ? Number(runner.map.getBearing().toFixed(2)) : null,
      pitch: Number.isFinite(runner?.map?.getPitch?.()) ? Number(runner.map.getPitch().toFixed(2)) : null,
      isMoving: Boolean(runner?.map?.isMoving?.()),
      isEasing: Boolean(runner?.map?.isEasing?.())
    };
  } catch {
    return { center: null, zoom: null, bearing: null, pitch: null, isMoving: false, isEasing: false };
  }
}

function getMemoryTrailFindPromptDebugSnapshot(memoryTrail = getActiveMemoryTrail(), details = {}) {
  const selection = details.selection || {};
  const target = details.target || getMemoryTrailActivePromptTarget(memoryTrail);
  const promptType = selection.promptType || memoryTrail?.currentPromptType || "";
  const phase = promptType === "guided" ? "learn" : "practice";
  const instructionText = getMemoryTrailInstructionText(
    promptType,
    phase,
    selection.mode || memoryTrail?.currentPromptMode || "",
    session.currentActivity,
    memoryTrail
  );
  const activeTargetLabel = getMemoryTrailActivePromptLabel(memoryTrail);
  const targetSpeechLabel = getStudyPreviewSpeechLabel(target);

  return {
    stage: details.stage || "",
    memoryTrailPhase: memoryTrail?.phase || "",
    sessionPhase: memoryTrail?.sessionPhase || "",
    promptType,
    promptMode: selection.mode || memoryTrail?.currentPromptMode || "",
    activeTargetId: selection.targetId || memoryTrail?.currentPromptTargetId || "",
    activeTargetLabel,
    promptName: memoryTrail?.promptName || "",
    currentPromptTargetId: memoryTrail?.currentPromptTargetId || "",
    currentPromptTargetLabel: memoryTrail?.currentPromptTargetLabel || "",
    visiblePromptText: getRenderedMemoryTrailFindPromptDebug(),
    audioMuted: Boolean(window.GeographyChipSpeech?.getAudioMuted?.()),
    instructionAudioPhrase: instructionText?.banner || "",
    targetNameAudioPhrase: targetSpeechLabel,
    camera: getMemoryTrailCameraSnapshot(),
    expectedSectionQuizCamera: memoryTrail?.sectionQuizView || null
  };
}

function ensureMountainFindDevPanel() {
  if (!isLocalDevAccessAllowed() || !mountainFindDevSessionActive) {
    return null;
  }

  if (mountainFindDevPanel?.isConnected) {
    mountainFindDevPanel.hidden = false;
    return mountainFindDevPanel;
  }

  const panel = document.createElement("section");
  panel.className = "mountain-find-dev-panel";
  panel.setAttribute("aria-label", "Mountain Find dev diagnostics");
  Object.assign(panel.style, {
    position: "fixed",
    right: "12px",
    bottom: "12px",
    zIndex: "9999",
    width: "min(520px, calc(100vw - 24px))",
    maxHeight: "42vh",
    overflow: "auto",
    padding: "10px",
    borderRadius: "8px",
    border: "1px solid rgba(148, 163, 184, 0.55)",
    background: "rgba(15, 23, 42, 0.94)",
    color: "#e5edf7",
    font: "12px/1.4 ui-monospace, SFMono-Regular, Consolas, monospace",
    boxShadow: "0 14px 40px rgba(15, 23, 42, 0.35)",
    whiteSpace: "pre-wrap"
  });

  const title = document.createElement("div");
  title.textContent = "Mountain Find dev";
  title.style.fontWeight = "700";
  title.style.marginBottom = "6px";

  const status = document.createElement("pre");
  status.id = "mountain-find-dev-status";
  status.style.margin = "0";
  status.style.whiteSpace = "pre-wrap";

  panel.append(title, status);
  document.body.appendChild(panel);
  mountainFindDevPanel = panel;
  return panel;
}

function updateMountainFindDevPanel(snapshot, extra = {}) {
  const panel = ensureMountainFindDevPanel();
  const status = panel?.querySelector("#mountain-find-dev-status");
  if (!status) {
    return;
  }

  status.textContent = JSON.stringify({
    ...snapshot,
    ...extra
  }, null, 2);
}

function logMemoryTrailFindPromptDebug(memoryTrail, selection = {}, target = null, stage = "unknown") {
  if (
    !isLocalDevAccessAllowed()
    || !isUsMountainRangesMemoryTrail(memoryTrail)
    || (selection.promptType || memoryTrail?.currentPromptType) !== "name_to_place"
  ) {
    return;
  }

  const snapshot = getMemoryTrailFindPromptDebugSnapshot(memoryTrail, { selection, target, stage });
  console.info("[mountain-find-dev]", stage, snapshot);
  updateMountainFindDevPanel(snapshot);
  Promise.all([
    getMemoryTrailAudioLookupDebug(snapshot.instructionAudioPhrase),
    getMemoryTrailAudioLookupDebug(snapshot.targetNameAudioPhrase)
  ]).then(([instructionAudio, targetAudio]) => {
    const audioLookup = {
      stage,
      promptKey: memoryTrail?.currentPromptKey || "",
      instructionAudio,
      targetAudio,
      audioMuted: snapshot.audioMuted
    };
    console.info("[mountain-find-dev] audio lookup", audioLookup);
    updateMountainFindDevPanel(snapshot, { audioLookup });
  });
}

function shuffleMemoryTrailChoices(items = []) {
  const shuffled = [...items];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  return shuffled;
}

function buildMemoryTrailAnswerChoices(memoryTrail, correctTargetId, promptKey = memoryTrail?.currentPromptKey || "") {
  const correctTarget = getTargetById(memoryTrail, correctTargetId);
  if (!correctTarget) {
    return [];
  }

  const choiceCategory = getUnitedStatesMemoryTrailAnswerChoiceCategory(memoryTrail, correctTarget);
  const byId = new Map([[correctTarget.id, correctTarget]]);
  const currentWindowDistractors = memoryTrail.currentPracticeWindow
    .filter((target) => target.id !== correctTargetId)
    .filter((target) => isMemoryTrailAnswerChoiceDistractorAllowed(memoryTrail, target, choiceCategory));
  const introducedDistractors = getIntroducedMemoryTrailStats(memoryTrail)
    .map((stats) => getTargetById(memoryTrail, stats.targetId))
    .filter((target) => target?.id && target.id !== correctTargetId)
    .filter((target) => isMemoryTrailAnswerChoiceDistractorAllowed(memoryTrail, target, choiceCategory));
  const poolDistractors = memoryTrail.targetPool
    .filter((target) => target?.id && target.id !== correctTargetId)
    .filter((target) => isMemoryTrailAnswerChoiceDistractorAllowed(memoryTrail, target, choiceCategory))
    .map((target) => ({
      target,
      distance: getTargetDistance(getTargetCentroid(correctTarget), getTargetCentroid(target))
    }))
    .sort((left, right) => left.distance - right.distance)
    .map(({ target }) => target);

  [...currentWindowDistractors, ...introducedDistractors, ...poolDistractors].forEach((target) => {
    if (target?.id && !byId.has(target.id) && byId.size < MEMORY_TRAIL_ANSWER_CHOICE_COUNT) {
      byId.set(target.id, target);
    }
  });

  return shuffleMemoryTrailChoices([...byId.values()])
    .slice(0, Math.max(2, Math.min(MEMORY_TRAIL_ANSWER_CHOICE_COUNT, byId.size)))
    .map((target) => ({
      id: target.id,
      label: getMemoryTrailTargetLabel(target, memoryTrail) || target.name || target.id,
      promptTargetId: correctTargetId,
      promptKey
    }));
}

function getUnitedStatesMemoryTrailAnswerChoiceCategory(memoryTrail, target) {
  if (!isUnitedStatesMemoryTrail(memoryTrail)) {
    return "";
  }

  if (target?.type === "capital") {
    return "capital";
  }

  if (target?.type === "state" || target?.type === "federal-district") {
    return "state";
  }

  return "";
}

function isMemoryTrailAnswerChoiceDistractorAllowed(memoryTrail, target, category = "") {
  if (!category || !isUnitedStatesMemoryTrail(memoryTrail)) {
    return true;
  }

  return getUnitedStatesMemoryTrailAnswerChoiceCategory(memoryTrail, target) === category;
}

function getMemoryTrailInstructionText(promptType, phase, mode = "", activity = session.currentActivity, memoryTrail = getActiveMemoryTrail()) {
  const singularNoun = getMemoryTrailInstructionNoun(activity, memoryTrail);
  const pluralNoun = pluralizeInstructionNounPhrase(singularNoun);
  if (promptType === "guided" || phase === "learn") {
    if (activity?.id === continentsOceansActivityId) {
      const oceanInstruction = getContinentsOceansOceanLearnInstruction(
        memoryTrail,
        getMemoryTrailActivePromptTarget(memoryTrail)
      );
      if (oceanInstruction) {
        return {
          banner: oceanInstruction,
          label: oceanInstruction
        };
      }

      return {
        banner: "Tap the highlighted place. Then repeat its name.",
        label: "Tap the highlighted place. Then repeat its name."
      };
    }

    const learnCount = getMemoryTrailLearnPromptCount(memoryTrail);
    if (isUnitedStatesMemoryTrail(memoryTrail) && getMemoryTrailActivePromptTarget(memoryTrail)?.type === "capital") {
      return {
        banner: learnCount === 1 ? "Learn this capital" : "Learn these capitals",
        label: "Tap the highlighted capital."
      };
    }

    return {
      banner: learnCount === 1
        ? `Learn this ${singularNoun || "place"}`
        : `Learn these ${pluralNoun || "places"}`,
      label: singularNoun === "mountain range"
        ? "Tap the highlighted mountain range."
        : "Tap the highlighted place."
    };
  }

  if (promptType === "place_to_name") {
    return {
      banner: singularNoun === "body of water"
        ? "Name the highlighted bodies of water"
        : `Name the highlighted ${pluralNoun}.`,
      label: `Choose the matching ${singularNoun}.`
    };
  }

  if (promptType === "drag_match") {
    return {
      banner: "Match each name to its place.",
      label: "Drag each label to the matching place."
    };
  }

  return {
    banner: singularNoun === "body of water"
      ? "Find the named body of water"
      : `Find the named ${singularNoun}.`,
    label: `Tap the ${singularNoun} named below.`
  };
}

function getMemoryTrailInstructionKey(promptType, phase) {
  return `${phase}:${promptType}`;
}

function getMemoryTrailLearnPromptCount(memoryTrail) {
  if (!memoryTrail?.targetStats) {
    return 0;
  }

  const unintroducedCount = Object.values(memoryTrail.targetStats)
    .filter((stats) => !stats.isIntroduced)
    .length;
  return unintroducedCount || memoryTrail.currentPracticeWindow?.length || 0;
}

function isContinentsOceansOceanLearnTarget(memoryTrail, target) {
  const activityId = memoryTrail?.activityId || session.currentActivity?.id || "";
  return activityId === continentsOceansActivityId && target?.type === "zone";
}

function getContinentsOceansOceanLearnInstruction(memoryTrail, target) {
  if (!isContinentsOceansOceanLearnTarget(memoryTrail, target)) {
    return "";
  }

  const targetLabel = getMemoryTrailTargetLabel(target, memoryTrail)
    || getStudyPreviewSpeechLabel(target);
  return targetLabel ? `Now tap the ${targetLabel}.` : "";
}

function getContinentsOceansOceanLearnInstructionForSelection(memoryTrail, selection = {}) {
  const promptType = selection?.promptType || memoryTrail?.currentPromptType || "";
  const mode = selection?.mode || memoryTrail?.currentPromptMode || "";
  if (promptType !== "guided" || mode !== "learn") {
    return "";
  }

  const target = getTargetById(memoryTrail, selection?.targetId || memoryTrail?.currentPromptTargetId);
  return getContinentsOceansOceanLearnInstruction(memoryTrail, target);
}

function showMemoryTrailInstructionBanner(text) {
  const message = String(text || "").trim();

  if (!audioInstructionBanner || !message) {
    return;
  }

  window.clearTimeout(memoryTrailInstructionBannerTimer);
  window.clearTimeout(dailyTrailTransitionNoticeTimer);
  dailyTrailTransitionNoticeTimer = null;
  audioInstructionBanner.textContent = message;
  audioInstructionBanner.hidden = false;
  audioInstructionBanner.classList.remove("daily-trail-transition-banner");
  audioInstructionBanner.classList.add("memory-trail-instruction-banner");

  memoryTrailInstructionBannerTimer = window.setTimeout(() => {
    audioInstructionBanner.classList.remove("memory-trail-instruction-banner");
    hideAudioInstructionBanner();
  }, MEMORY_TRAIL_INSTRUCTION_BANNER_MS);
}

function isMemoryTrailInstructionSpeechEnabled() {
  return audioSettings.speakMemoryTrailInstructions === true;
}

function maybeSpeakMemoryTrailInstruction(text, promptType, phase, instructionKey, options = {}) {
  const message = String(text || "").trim();
  const key = instructionKey || getMemoryTrailInstructionKey(promptType, phase);
  const skipped = (reason) => {
    debugMemoryTrail("instruction speech skipped", {
      phase,
      promptType,
      instructionText: message,
      speechAttempted: false,
      speechSuppressed: true,
      reason
    });
    return Promise.resolve(false);
  };

  if (!message || !isMemoryTrailInstructionSpeechEnabled()) {
    return skipped("setting disabled");
  }

  if (lastSpokenMemoryTrailInstructionKey === key) {
    return skipped("recently spoken");
  }

  lastSpokenMemoryTrailInstructionKey = key;
  debugMemoryTrail("instruction speech", {
    phase,
    promptType,
    instructionText: message,
    speechAttempted: true,
    speechSuppressed: false
  });

  return ensureChipSpeechLoaded().then((chipSpeech) => {
    const speech = chipSpeech || window.GeographyChipSpeech;

    if (speech?.getAudioMuted?.()) {
      return skipped("audio muted");
    }

    if (speech?.speakLabelAndWait) {
      return speech.speakLabelAndWait(message, {
        queue: true,
        dedupeKey: options.dedupeKey || "",
        warnOnAudioFailure: false
      }).then(Boolean);
    }

    return Boolean(speech?.speakLabel?.(message));
  }).catch((error) => {
      debugMemoryTrail("instruction speech failed", {
        phase,
        promptType,
        instructionText: message,
        speechAttempted: true,
        speechSuppressed: true,
        reason: error?.message || "speech failed"
      });
      return false;
  });
}

function setMemoryTrailInstruction({ memoryTrail, phase, promptType, mode = "", text = null, speakKey = "" } = {}) {
  if (!memoryTrail) {
    return Promise.resolve(false);
  }

  const instruction = text
    ? { banner: text, label: text }
    : getMemoryTrailInstructionText(promptType, phase, mode, session.currentActivity, memoryTrail);
  const instructionKey = speakKey || getMemoryTrailInstructionKey(promptType, phase, mode);
  const isModeChange = lastMemoryTrailInstructionKey !== instructionKey;
  let speechPromise = Promise.resolve(false);

  memoryTrail.instructionLabel = instruction.label;
  memoryTrail.visibleInstructionText = instruction.banner;
  memoryTrail.currentInstructionKey = instructionKey;

  if (isModeChange) {
    showMemoryTrailInstructionBanner(instruction.banner);
    speechPromise = maybeSpeakMemoryTrailInstruction(instruction.banner, promptType, phase, instructionKey, {
      dedupeKey: `${memoryTrail.audioSessionId || "memory-trail"}:${memoryTrail.currentPromptKey || instructionKey}:instruction:${instructionKey}`
    });
    lastMemoryTrailInstructionKey = instructionKey;
  }

  debugMemoryTrail("instruction cue", {
    phase,
    promptType,
    instructionText: instruction.banner,
    persistentLabel: instruction.label,
    bannerShown: isModeChange,
    speechAttempted: isModeChange && isMemoryTrailInstructionSpeechEnabled() && !window.GeographyChipSpeech?.getAudioMuted?.(),
    speechSuppressed: !isModeChange || !isMemoryTrailInstructionSpeechEnabled() || window.GeographyChipSpeech?.getAudioMuted?.(),
    suppressReason: !isModeChange
      ? "same mode"
      : !isMemoryTrailInstructionSpeechEnabled()
        ? "setting disabled"
        : window.GeographyChipSpeech?.getAudioMuted?.()
          ? "audio muted"
          : ""
  });

  return speechPromise;
}

function updateMemoryTrailInstructionCue(memoryTrail, selection) {
  const promptType = selection?.promptType || memoryTrail.currentPromptType;
  const phase = promptType === "guided" ? "learn" : "practice";
  const mode = selection?.mode || memoryTrail.currentPromptMode;
  const oceanLearnInstruction = getContinentsOceansOceanLearnInstructionForSelection(memoryTrail, selection);
  const targetSpecificSpeakKey = oceanLearnInstruction
    ? `${getMemoryTrailInstructionKey(promptType, phase)}:${selection?.targetId || memoryTrail.currentPromptTargetId}:ocean-learn`
    : "";
  return setMemoryTrailInstruction({
    memoryTrail,
    phase,
    promptType,
    mode,
    speakKey: targetSpecificSpeakKey
  });
}

function isCurrentMemoryTrailState(memoryTrail) {
  return Boolean(memoryTrail && activeStudySession?.memoryTrail === memoryTrail && memoryTrail.active);
}

function clearMemoryTrailTimers(memoryTrail = getActiveMemoryTrail()) {
  if (!memoryTrail?.timers?.length) {
    return;
  }

  memoryTrail.timers.forEach((timer) => window.clearTimeout(timer));
  memoryTrail.timers = [];
}

function scheduleMemoryTrailStep(memoryTrail, callback, delay) {
  const timer = window.setTimeout(() => {
    memoryTrail.timers = memoryTrail.timers.filter((item) => item !== timer);

    if (isCurrentMemoryTrailState(memoryTrail)) {
      callback();
    }
  }, delay);

  memoryTrail.timers.push(timer);
}

function clearMemoryTrailState({ restoreReveals = true, render = false } = {}) {
  const memoryTrail = getActiveMemoryTrail();

  if (!memoryTrail) {
    return;
  }

  clearMemoryTrailTimers(memoryTrail);
  try {
    window.GeographyChipSpeech?.stopAudio?.();
    window.speechSynthesis?.cancel();
  } catch {
    // Speech cleanup is best-effort; visual state is still cleared below.
  }
  runner?.setMemoryTrailHighlight([]);
  runner?.setMemoryTrailCheckpointPreAnswerStyle?.(false);
  runner?.setMemoryTrailStudyTargetEmphasisSuppressed?.(false);

  if (restoreReveals && activeStudySession) {
    activeStudySession.revealedTargetIds = [...memoryTrail.previousRevealedTargetIds];
    runner?.setCompletedTargets(activeStudySession.revealedTargetIds);
  }

  if (activeStudySession) {
    activeStudySession.memoryTrail = null;
  }

  updateMemoryTrailCorrectionCallout(null);

  if (render) {
    instruction.textContent = "Tap a target or name to show it. Tap it again to hide it.";
    renderStudyExplorePanel();
  }
}

function shouldSuppressStudyIntroCameraForSmallTargetLearn(memoryTrail = getActiveMemoryTrail()) {
  if (
    !memoryTrail?.currentPracticeWindow?.length
    || typeof runner?.shouldFocusSmallTargetInLearnMode !== "function"
  ) {
    return false;
  }

  return memoryTrail.currentPracticeWindow.some((target) => (
    target?.kind === "shape"
    && runner.shouldFocusSmallTargetInLearnMode(target, { mobile: true })
  ));
}

function getDailyTrailMemoryTrailNonLearnCamera(activity, options = {}) {
  if (options.source !== "daily-trail" && options.source !== UNITED_STATES_MEMORY_TRAIL_SOURCE) {
    return null;
  }

  if (options.source === "daily-trail" && options.completedTrailReview === true && activity?.id?.startsWith("us-states-")) {
    return DAILY_TRAIL_TERMINAL_US_STATES_REVIEW_CAMERA;
  }

  return activity?.map?.dailyTrailNonLearnCamera || null;
}

function startMemoryTrail(options = {}) {
  const isDailyTrail = options.source === "daily-trail";
  const isUnitedStatesTrail = options.source === UNITED_STATES_MEMORY_TRAIL_SOURCE;
  // A Daily Trail checkpoint can reach this boundary through a grouped plan or
  // a remediation plan. Derive the session behavior here so a caller cannot
  // accidentally create a normal Memory Trail session for a checkpoint.
  const checkpointReview = Boolean(
    isDailyTrail
    && (options.checkpointReview === true || isDailyTrailCheckpointPlan(activeDailyTrailSession?.plan))
  );
  if (
    !activeStudySession
    || (!isDailyTrail && !isUnitedStatesTrail && currentAppScreen !== "study-explore")
    || (isUnitedStatesTrail && currentAppScreen !== "united-states-trail-gameplay")
    || (isDailyTrail && currentAppScreen !== "daily-trail-gameplay")
    || !session.currentActivity.targets.length
  ) {
    return false;
  }

  if (!isDailyTrail && !isMemoryTrailEligible(session.currentActivity)) {
    if (isUnitedStatesTrail) {
      return false;
    }
    hideMemoryTrailOverlay();
    clearMemoryTrailState({ restoreReveals: true });
    instruction.textContent = "Tap a target or name to show it. Tap it again to hide it.";
    renderStudyExplorePanel();
    return false;
  }

  hideMemoryTrailOverlay();
  clearMemoryTrailState({ restoreReveals: false });
  lastMemoryTrailInstructionKey = "";
  lastSpokenMemoryTrailInstructionKey = "";
  resetAudioInstructionState(`memory-trail:${activeStudySession.activityId}:${Date.now()}`);
  window.GeographyChipSpeech?.primeLocalAudio?.();
  const memoryTrailSection = !isDailyTrail && !isUnitedStatesTrail ? getActiveMemoryTrailSection(session.currentActivity) : null;
  const sectionTargetIds = memoryTrailSection?.targetIds || null;
  activeStudySession.memoryTrail = createMemoryTrailSession(session.currentActivity, {
    newTargetIds: options.newTargetIds,
    source: options.source,
    targetIds: options.targetIds || sectionTargetIds,
    dailyTrailSessionNumber: isDailyTrail
      ? activeDailyTrailSession?.state?.currentSessionNumber
      : isUnitedStatesTrail
        ? activeUnitedStatesMemoryTrailSession?.state?.currentSessionNumber
        : 0,
    maxNewTargets: memoryTrailSection?.targetIds?.length,
    sectionTitle: memoryTrailSection?.title,
    sectionIndex: memoryTrailSection?.sectionIndex,
    sectionCount: memoryTrailSection?.sectionCount,
    sectionQuizView: memoryTrailSection?.map?.quizView || session.currentActivity?.map?.quizView || null,
    dailyTrailFixedCamera: (isDailyTrail || isUnitedStatesTrail) ? session.currentActivity?.map?.dailyTrailFixedCamera || null : null,
    dailyTrailMobileSectionQuizCamera: (isDailyTrail || isUnitedStatesTrail) ? session.currentActivity?.map?.dailyTrailMobileSectionQuizCamera || null : null,
    dailyTrailNonLearnCamera: getDailyTrailMemoryTrailNonLearnCamera(session.currentActivity, options),
    dailyTrailQuizCamera: isDailyTrail ? session.currentActivity?.map?.dailyTrailQuizCamera || null : null,
    checkpointReview,
    completedTrailReview: options.completedTrailReview === true
  });
  publishDailyTrailCheckpointRuntimeSnapshot(activeStudySession.memoryTrail, {
    stage: "memory-trail-created"
  });
  currentMemoryTrailAnalyticsKey = [
    activeStudySession.journeyId,
    activeStudySession.stepId,
    session.currentActivity?.id || "",
    Date.now()
  ].join(":");
  completedMemoryTrailAnalyticsKey = "";
  trackEvent("memory_trail_started", getMemoryTrailAnalyticsContext());
  activeStudySession.revealedTargetIds = [];
  runner.setStudyPreviewMode(true);
  runner?.setMemoryTrailStudyTargetEmphasisSuppressed?.(false);
  if (session.currentActivity?.id === continentsOceansActivityId) {
    runner.suppressStudyIntroCameraOnce?.("c&o-learn-target-focus", 5000);
  } else if (shouldSuppressStudyIntroCameraForSmallTargetLearn(activeStudySession.memoryTrail)) {
    runner.suppressStudyIntroCameraOnce?.("small-target-learn-focus", 5000);
  }
  runner.setCompletedTargets([]);
  instruction.textContent = "First learn the small group, then practice from memory.";
  fitMapToPracticeWindow(activeStudySession.memoryTrail.currentPracticeWindow, "start");
  renderStudyExplorePanel();
  if (!options.suppressInitialPrompt) {
    promptNextMemoryTrailTarget(activeStudySession?.memoryTrail);
  }
  return true;
}

function updateDailyTrailMainMenuButton(isMainMenu = currentAppScreen === "main-menu") {
  if (!mainMenuDailyTrailButton) {
    updateUnitedStatesMemoryTrailMainMenuButton(isMainMenu);
    return;
  }

  const state = loadDailyTrailState();
  const hasProgress = hasDailyTrailProgress(state);
  if (mainMenuDailyTrailAction) {
    mainMenuDailyTrailAction.textContent = state.pathCompleted && getNextDailyTrailGoal(state)
      ? "Start Next Daily Trail"
      : hasProgress
        ? "Continue Daily Trail"
        : "Start Daily Trail";
  }
  mainMenuDailyTrailButton.disabled = !isMainMenu;
  mainMenuDailyTrailButton.tabIndex = isMainMenu ? 0 : -1;
  mainMenuDailyTrailButton.setAttribute("aria-hidden", String(!isMainMenu));
  updateUnitedStatesMemoryTrailMainMenuButton(isMainMenu);
}

function updateUnitedStatesMemoryTrailMainMenuButton(isMainMenu = currentAppScreen === "main-menu") {
  if (!mainMenuUnitedStatesMemoryTrailButton) {
    return;
  }

  const items = activityDataReady ? getUnitedStatesMemoryTrailItems() : [];
  const state = createUnitedStatesMemoryTrailState(loadUnitedStatesMemoryTrailProgress(items), items);
  const hasProgress = hasUnitedStatesMemoryTrailProgress(state);
  const stateIntroducedCount = countUnitedStatesMemoryTrailIntroducedItems(state, items.filter((item) => item.type === "state"));
  const capitalIntroducedCount = countUnitedStatesMemoryTrailIntroducedItems(state, items.filter((item) => item.type === "capital"));
  const weakCount = countUnitedStatesMemoryTrailWeakItems(state, items);

  if (mainMenuUnitedStatesMemoryTrailAction) {
    mainMenuUnitedStatesMemoryTrailAction.textContent = hasProgress ? "Continue" : "Start";
  }

  const description = mainMenuUnitedStatesMemoryTrailButton.querySelector(".main-menu-daily-trail-description");
  if (description) {
    description.textContent = hasProgress
      ? `${stateIntroducedCount}/50 states | ${capitalIntroducedCount}/50 capitals | ${weakCount} review`
      : "A continuous path through all 50 states and capitals with cumulative review.";
  }

  mainMenuUnitedStatesMemoryTrailButton.hidden = !isMainMenu;
  mainMenuUnitedStatesMemoryTrailButton.disabled = !isMainMenu;
  mainMenuUnitedStatesMemoryTrailButton.tabIndex = isMainMenu ? 0 : -1;
  mainMenuUnitedStatesMemoryTrailButton.setAttribute("aria-hidden", String(!isMainMenu));
}

function restartMemoryTrail() {
  if (!activeStudySession) {
    return;
  }

  if (!isMemoryTrailEligible(session.currentActivity)) {
    hideMemoryTrailOverlay();
    clearMemoryTrailState({ restoreReveals: true, render: true });
    return;
  }

  hideMemoryTrailOverlay();
  const previousRevealedTargetIds = [...(activeStudySession.memoryTrail?.previousRevealedTargetIds || activeStudySession.revealedTargetIds || [])];
  clearMemoryTrailState({ restoreReveals: false });
  lastMemoryTrailInstructionKey = "";
  lastSpokenMemoryTrailInstructionKey = "";
  resetAudioInstructionState(`memory-trail:${activeStudySession.activityId}:${Date.now()}`);
  window.GeographyChipSpeech?.primeLocalAudio?.();
  const memoryTrailSection = getActiveMemoryTrailSection(session.currentActivity);
  activeStudySession.memoryTrail = createMemoryTrailSession(session.currentActivity, {
    targetIds: memoryTrailSection?.targetIds,
    maxNewTargets: memoryTrailSection?.targetIds?.length,
    sectionTitle: memoryTrailSection?.title,
    sectionIndex: memoryTrailSection?.sectionIndex,
    sectionCount: memoryTrailSection?.sectionCount,
    sectionQuizView: memoryTrailSection?.map?.quizView || session.currentActivity?.map?.quizView || null,
    dailyTrailMobileSectionQuizCamera: session.currentActivity?.map?.dailyTrailMobileSectionQuizCamera || null
  });
  activeStudySession.memoryTrail.previousRevealedTargetIds = previousRevealedTargetIds;
  currentMemoryTrailAnalyticsKey = [
    activeStudySession.journeyId,
    activeStudySession.stepId,
    session.currentActivity?.id || "",
    Date.now()
  ].join(":");
  completedMemoryTrailAnalyticsKey = "";
  trackEvent("memory_trail_started", getMemoryTrailAnalyticsContext());
  activeStudySession.revealedTargetIds = [];
  if (session.currentActivity?.id === continentsOceansActivityId) {
    runner.suppressStudyIntroCameraOnce?.("c&o-learn-target-focus", 5000);
  } else if (shouldSuppressStudyIntroCameraForSmallTargetLearn(activeStudySession.memoryTrail)) {
    runner.suppressStudyIntroCameraOnce?.("small-target-learn-focus", 5000);
  }
  runner.setCompletedTargets([]);
  instruction.textContent = "First learn the small group, then practice from memory.";
  fitMapToPracticeWindow(activeStudySession.memoryTrail.currentPracticeWindow, "restart");
  renderStudyExplorePanel();
  promptNextMemoryTrailTarget(activeStudySession?.memoryTrail);
}

function exitMemoryTrail() {
  trackMemoryTrailAbandoned();
  hideMemoryTrailOverlay();
  clearMemoryTrailState({ restoreReveals: true, render: true });
}

function trackMemoryTrailAbandoned() {
  const memoryTrail = getActiveMemoryTrail();

  if (!memoryTrail || memoryTrail.phase === "complete" || completedMemoryTrailAnalyticsKey === currentMemoryTrailAnalyticsKey) {
    return;
  }

  trackEvent("memory_trail_abandoned", getMemoryTrailAnalyticsContext());
}

function promptNextMemoryTrailTarget(memoryTrail = getActiveMemoryTrail()) {
  if (!isCurrentMemoryTrailState(memoryTrail)) {
    return;
  }

  if (shouldEndMemoryTrailSession(memoryTrail)) {
    completeMemoryTrailSession(memoryTrail);
    return;
  }

  clearMemoryTrailTimers(memoryTrail);
  advancePracticeWindow(memoryTrail);
  const selection = chooseNextPrompt(memoryTrail);

  if (!selection?.targetId) {
    completeMemoryTrailSession(memoryTrail);
    return;
  }

  applyMemoryTrailPromptSelection(memoryTrail, selection);
}

function applyMemoryTrailPromptSelection(memoryTrail, selection = {}) {
  if (!isCurrentMemoryTrailState(memoryTrail) || !selection?.targetId) {
    return false;
  }

  const target = getTargetById(memoryTrail, selection.targetId);
  const stats = memoryTrail.targetStats[selection.targetId];
  if (!target || !stats) {
    return false;
  }

  const speechLabel = getMemoryTrailTargetLabel(target, memoryTrail);
  const promptKey = `${memoryTrail.promptCount + 1}:${selection.promptType || "name_to_place"}:${selection.targetId}:${memoryTrail.promptHistory.length}`;
  memoryTrail.phase = "playing";
  memoryTrail.currentPromptTargetId = selection.targetId;
  memoryTrail.currentPromptTargetLabel = speechLabel || target?.name || "";
  memoryTrail.currentPromptKey = promptKey;
  memoryTrail.currentPromptType = selection.promptType || "name_to_place";
  memoryTrail.currentPromptMode = selection.mode;
  memoryTrail.currentPromptReason = selection.reason;
  memoryTrail.sessionPhase = selection.promptType === "guided" ? "learn" : "practice";
  memoryTrail.correction = null;
  memoryTrail.promptName = selection.promptType === "place_to_name" ? "" : memoryTrail.currentPromptTargetLabel;
  memoryTrail.responseChipTargetId = null;
  memoryTrail.answerChoices = selection.promptType === "place_to_name"
    ? buildMemoryTrailAnswerChoices(memoryTrail, selection.targetId, promptKey)
    : [];
  memoryTrail.message = getMemoryTrailPromptMessage(memoryTrail, target, selection);
  const instructionSpeechPromise = updateMemoryTrailInstructionCue(memoryTrail, selection);
  if (!selection.devSkip) {
    stats.lastPromptedAt = memoryTrail.promptCount;
    memoryTrail.lastPromptedTargetId = selection.targetId;
  }
  memoryTrail.promptHistory.push({
    promptNumber: memoryTrail.promptCount + 1,
    promptKey,
    targetId: selection.targetId,
    promptType: memoryTrail.currentPromptType,
    sessionPhase: memoryTrail.sessionPhase,
    mode: selection.mode,
    reason: selection.reason,
    devSkipped: selection.devSkip === true
  });
  if (selection.promptType === "guided" && !selection.devSkip) {
    stats.exposedCount += 1;
  }
  memoryTrail.phase = "answering";
  memoryTrail.currentPromptStartedAtMs = null;
  const lastHistory = memoryTrail.promptHistory.at(-1);
  if (lastHistory) {
    delete lastHistory.answerableStartedAtMs;
  }
  memoryTrail.message = getMemoryTrailAnsweringMessage(memoryTrail);
  if (memoryTrail.trayFeedback) {
    debugMemoryTrail("tray feedback retained", {
      reason: "next prompt prepared",
      feedback: memoryTrail.trayFeedback
    });
  }
  debugMemoryTrail("selected prompt", {
    targetId: selection.targetId,
    phase: memoryTrail.sessionPhase,
    promptType: memoryTrail.currentPromptType,
    mode: selection.mode,
    reason: selection.reason,
    answerChoices: memoryTrail.answerChoices,
    stats
  });
  logDailyTrailRuntimeDebug("prompt-selected", createDailyTrailPromptSelectedDebug(memoryTrail, selection, stats));
  const shouldHighlightPromptTarget = !isMixedDailyTrailCheckpointMemoryTrail(memoryTrail)
    && (selection.promptType === "guided" || selection.promptType === "place_to_name");
  const checkpointPreAnswerStyle = isMixedDailyTrailCheckpointMemoryTrail(memoryTrail)
    && memoryTrail.phase === "answering";
  runner?.setMemoryTrailStudyTargetEmphasisSuppressed?.(
    shouldSuppressDailyTrailStudyTargetEmphasis(memoryTrail, selection),
    "daily-trail-active-prompt"
  );
  runner?.setMemoryTrailCheckpointPreAnswerStyle?.(checkpointPreAnswerStyle);
  if (isMixedDailyTrailCheckpointMemoryTrail(memoryTrail)) {
    runner.setMemoryTrailHighlight([]);
  } else {
    runner.setMemoryTrailHighlight(shouldHighlightPromptTarget ? selection.targetId : []);
  }
  const didApplyCheckpointCamera = applyMixedDailyTrailCheckpointCamera(memoryTrail, { selection, duration: 820 });
  const didApplySectionQuizCamera = applyMemoryTrailSectionQuizCamera(memoryTrail, selection);
  const didApplyTargetQuizCamera = applyDailyTrailTargetQuizCamera(memoryTrail, selection);
  scheduleMemoryTrailSectionQuizCameraCheck(memoryTrail, selection);
  const dailyTrailLearnCameraPromise = scheduleDailyTrailTargetLearnCamera(memoryTrail, selection, target);
  const continentsOceansLearnCameraPromise = scheduleContinentsOceansLearnFocusCheck(memoryTrail, selection, target);
  const smallTargetLearnCameraPromise = scheduleSmallTargetLearnFocusCheck(memoryTrail, selection, target);
  const learnCameraReadyPromise = Promise.all([
    dailyTrailLearnCameraPromise,
    continentsOceansLearnCameraPromise,
    smallTargetLearnCameraPromise
  ]);
  maybeFocusContinentsOceansNamePrompt(selection, target);
  publishDailyTrailCheckpointRuntimeSnapshot(memoryTrail, {
    stage: "checkpoint-prompt-rendered",
    selection,
    preAnswerHighlightEnabled: shouldHighlightPromptTarget,
    checkpointPreAnswerStyle,
    didApplyCheckpointCamera,
    didApplySectionQuizCamera,
    didApplyTargetQuizCamera
  });
  renderStudyExplorePanel();
  logMemoryTrailFindPromptDebug(memoryTrail, selection, target, "rendered");

  let targetSpeechPromise = Promise.resolve(false);
  if (shouldSpeakMemoryTrailTargetAtPromptStart(memoryTrail, target, selection)) {
    targetSpeechPromise = speakMemoryTrailPromptTargetAfterInstruction(
      memoryTrail,
      target,
      selection,
      instructionSpeechPromise,
      learnCameraReadyPromise
    );
  }

  const promptActionablePromise = getMemoryTrailPromptActionablePromise(memoryTrail, selection, {
    didApplyCheckpointCamera,
    didApplySectionQuizCamera,
    didApplyTargetQuizCamera,
    instructionSpeechPromise,
    learnCameraReadyPromise,
    targetSpeechPromise
  });
  scheduleMemoryTrailPromptResponseTimer(memoryTrail, selection, promptKey, promptActionablePromise);
  persistActiveUnitedStatesMemoryTrailSnapshot(memoryTrail, "prompt");

  return true;
}

function getMemoryTrailPromptActionablePromise(memoryTrail, selection = {}, waits = {}) {
  const promptKey = memoryTrail?.currentPromptKey || "";
  const targetId = selection?.targetId || "";
  const pending = [];
  const cameraSettleMs = getMemoryTrailPromptStartCameraSettleMs(memoryTrail, selection, waits);

  if (cameraSettleMs > 0) {
    pending.push(waitForCurrentMemoryTrailPrompt(memoryTrail, promptKey, targetId, cameraSettleMs));
  }

  if (isAdaptiveTrailMemoryTrail(memoryTrail)) {
    pending.push(waits.instructionSpeechPromise);
    pending.push(waits.learnCameraReadyPromise);
    pending.push(waits.targetSpeechPromise);
  }

  const activeWaits = pending.filter((promise) => promise?.then);
  return activeWaits.length ? Promise.allSettled(activeWaits) : Promise.resolve();
}

function getMemoryTrailPromptStartCameraSettleMs(memoryTrail, selection = {}, waits = {}) {
  if (!isAdaptiveTrailMemoryTrail(memoryTrail) || isCompletedDailyTrailReviewMemoryTrail(memoryTrail)) {
    return 0;
  }

  const settleBufferMs = 100;
  const durations = [];
  if (waits.didApplySectionQuizCamera) {
    const quizView = getActiveDailyTrailFixedCamera(memoryTrail)
      || getActiveDailyTrailNonLearnCamera(memoryTrail)
      || memoryTrail?.sectionQuizView;
    durations.push(Number(quizView?.duration) || 850);
  }
  if (waits.didApplyTargetQuizCamera) {
    const quizCamera = getActiveDailyTrailTargetQuizCamera(memoryTrail, selection);
    durations.push(Number(quizCamera?.duration) || 720);
  }
  if (waits.didApplyCheckpointCamera) {
    durations.push(820);
  }

  const maxDuration = Math.max(0, ...durations.filter((duration) => Number.isFinite(duration)));
  return maxDuration > 0 ? maxDuration + settleBufferMs : 0;
}

function waitForCurrentMemoryTrailPrompt(memoryTrail, promptKey, targetId, delayMs) {
  return new Promise((resolve) => {
    const timeoutId = window.setTimeout(() => {
      if (memoryTrail?.timers) {
        memoryTrail.timers = memoryTrail.timers.filter((timer) => timer !== timeoutId);
      }
      resolve(
        isCurrentMemoryTrailState(memoryTrail)
        && memoryTrail.currentPromptKey === promptKey
        && memoryTrail.currentPromptTargetId === targetId
      );
    }, Math.max(0, delayMs));
    memoryTrail?.timers?.push(timeoutId);
  });
}

function scheduleMemoryTrailPromptResponseTimer(memoryTrail, selection = {}, promptKey = "", readyPromise = Promise.resolve()) {
  const targetId = selection?.targetId || "";
  Promise.resolve(readyPromise).finally(() => {
    if (
      !isCurrentMemoryTrailState(memoryTrail)
      || memoryTrail.currentPromptKey !== promptKey
      || memoryTrail.currentPromptTargetId !== targetId
      || memoryTrail.phase !== "answering"
      || Number.isFinite(Number(memoryTrail.currentPromptStartedAtMs))
    ) {
      return;
    }

    memoryTrail.currentPromptStartedAtMs = getMonotonicNowMs();
    const lastHistory = memoryTrail.promptHistory.at(-1);
    if (lastHistory && lastHistory.targetId === targetId && lastHistory.promptKey === promptKey) {
      lastHistory.answerableStartedAtMs = memoryTrail.currentPromptStartedAtMs;
    }
  });
}

function shouldSpeakMemoryTrailTargetAtPromptStart(memoryTrail, target, selection = {}) {
  const promptType = selection?.promptType || memoryTrail?.currentPromptType || "";
  const targetLabel = getStudyPreviewSpeechLabel(target);
  const skip = (reason) => {
    debugMemoryTrail("target label speech skipped", {
      reason,
      promptType,
      activeTargetId: selection?.targetId || memoryTrail?.currentPromptTargetId || "",
      activeTargetLabel: targetLabel,
      instructionText: getMemoryTrailInstructionText(promptType, promptType === "guided" ? "learn" : "practice", selection?.mode, session.currentActivity, memoryTrail)?.banner || "",
      source: memoryTrail?.source || "",
      activityId: memoryTrail?.activityId || "",
      sessionType: activeDailyTrailSession?.plan?.sessionType || "",
      continentsOceansReviewType: activeDailyTrailSession?.plan?.continentsOceansReviewType || ""
    });
    return false;
  };

  if (!memoryTrail || !target) {
    return skip("missing memory trail or target");
  }

  if (!targetLabel) {
    return skip("missing target label");
  }

  if (promptType === "guided") {
    if (getContinentsOceansOceanLearnInstructionForSelection(memoryTrail, selection)) {
      return skip("target already included in ocean learn instruction");
    }

    return true;
  }

  if (promptType !== "place_to_name") {
    return true;
  }

  const isDailyTrailContinentsOceansGuidedLearn = memoryTrail.source === "daily-trail"
    && memoryTrail.activityId === continentsOceansActivityId
    && selection?.mode === "learn";

  return isDailyTrailContinentsOceansGuidedLearn
    ? true
    : skip("place-to-name answer would be revealed outside C&O learn");
}

function speakMemoryTrailPromptTargetAfterInstruction(
  memoryTrail,
  target,
  selection,
  instructionSpeechPromise = Promise.resolve(false),
  learnCameraReadyPromise = Promise.resolve(false)
) {
  const promptKey = memoryTrail?.currentPromptKey || "";
  let didAttempt = false;
  return new Promise((resolve) => {
    const attempt = (trigger) => {
      if (didAttempt) {
        return;
      }

      didAttempt = true;

      if (
        isCurrentMemoryTrailState(memoryTrail)
        && memoryTrail.currentPromptTargetId === selection?.targetId
        && memoryTrail.currentPromptKey === promptKey
        && memoryTrail.phase === "answering"
      ) {
        const activeTarget = getMemoryTrailActivePromptTarget(memoryTrail) || target;
        const targetLabel = getStudyPreviewSpeechLabel(activeTarget);
        const speechPromise = speakMemoryTrailTargetOnce(memoryTrail, activeTarget, promptKey);
        const attempted = Boolean(speechPromise);
        logMemoryTrailFindPromptDebug(memoryTrail, selection, activeTarget, "audio-attempt");
        debugMemoryTrail("target label speech attempt", {
          trigger,
          promptType: selection?.promptType || memoryTrail.currentPromptType || "",
          activeTargetId: selection?.targetId || "",
          activeTargetLabel: targetLabel,
          targetLabelText: targetLabel,
          instructionText: getMemoryTrailInstructionText(selection?.promptType || memoryTrail.currentPromptType, memoryTrail.sessionPhase, selection?.mode, session.currentActivity, memoryTrail)?.banner || "",
          speechAttempted: attempted,
          speechSkipped: !attempted,
          skipReason: attempted ? "" : "already spoken or missing prompt key"
        });
        if (attempted && speechPromise?.finally) {
          speechPromise.finally(() => resolve(true));
        } else {
          resolve(false);
        }
        return;
      }

      debugMemoryTrail("target label speech skipped", {
        trigger,
        reason: "prompt changed before speech",
        promptType: selection?.promptType || "",
        activeTargetId: selection?.targetId || "",
        activeTargetLabel: getStudyPreviewSpeechLabel(target),
        currentPromptTargetId: memoryTrail?.currentPromptTargetId || "",
        currentPromptKey: memoryTrail?.currentPromptKey || "",
        expectedPromptKey: promptKey
      });
      resolve(false);
    };

    Promise.allSettled([instructionSpeechPromise, learnCameraReadyPromise])
      .finally(() => attempt("instruction-and-learn-camera-ready"));
    if (shouldUseMemoryTrailTargetSpeechFallback(memoryTrail, selection)) {
      window.setTimeout(() => {
        Promise.resolve(learnCameraReadyPromise)
          .finally(() => attempt("instruction-fallback-after-learn-camera"));
      }, 1800);
    }
  });
}

function shouldUseMemoryTrailTargetSpeechFallback(memoryTrail, selection = {}) {
  if (!memoryTrail || !selection?.promptType) {
    return false;
  }

  if (selection.promptType === "name_to_place" || selection.promptType === "guided") {
    return true;
  }

  return Boolean(
    memoryTrail.source === "daily-trail"
    && memoryTrail.activityId === continentsOceansActivityId
    && selection.promptType === "place_to_name"
  );
}

function isContinentsOceansLearnCameraDebugEnabled() {
  try {
    return typeof window !== "undefined"
      && new URLSearchParams(window.location.search).has("debugCoLearnCamera");
  } catch {
    return false;
  }
}

function getContinentsOceansLearnCameraDebugContext(memoryTrail = getActiveMemoryTrail()) {
  const activeTargetId = memoryTrail?.currentPromptTargetId || "";
  const activeTarget = activeTargetId ? getTargetById(memoryTrail, activeTargetId) : null;
  return {
    timestamp: typeof performance !== "undefined" ? Math.round(performance.now()) : Date.now(),
    activityId: session.currentActivity?.id || "",
    memoryTrailSource: memoryTrail?.source || "",
    phase: memoryTrail?.sessionPhase || "",
    promptType: memoryTrail?.currentPromptType || "",
    promptKey: memoryTrail?.currentPromptKey || "",
    activeTargetId,
    activeTargetLabel: activeTarget?.name || activeTarget?.label || activeTarget?.completedLabelName || ""
  };
}

function debugContinentsOceansLearnCamera(label, details = {}, memoryTrail = getActiveMemoryTrail()) {
  if (
    !isContinentsOceansLearnCameraDebugEnabled()
    || session.currentActivity?.id !== continentsOceansActivityId
  ) {
    return;
  }

  const payload = {
    ...getContinentsOceansLearnCameraDebugContext(memoryTrail),
    ...details
  };
  console.warn("[C&O Learn camera]", label, JSON.stringify(payload));
}

function scheduleSmallTargetLearnFocusCheck(memoryTrail, selection, target) {
  if (
    session.currentActivity?.id === continentsOceansActivityId
    || selection?.promptType !== "guided"
    || memoryTrail?.sessionPhase !== "learn"
    || getActiveDailyTrailFixedCamera(memoryTrail)
    || memoryTrail.currentPromptTargetId !== selection?.targetId
    || !target
    || (memoryTrail?.source === "daily-trail" && target?.learnCamera)
    || hasAppliedDailyTrailMobileLearnCameraForPrompt(memoryTrail, selection)
    || target.kind !== "shape"
    || typeof runner?.shouldFocusSmallTargetInLearnMode !== "function"
    || typeof runner?.focusTargetIfNeeded !== "function"
  ) {
    return Promise.resolve(false);
  }

  const promptKey = memoryTrail.currentPromptKey;
  const isFirstPromptInChunk = memoryTrail.promptHistory?.length <= 1;
  const mapState = runner.getMapInteractionState?.();
  const needsFocusAtSchedule = runner.shouldFocusSmallTargetInLearnMode(target, { mobile: true });
  const delayMs = (isFirstPromptInChunk || mapState?.isMoving || mapState?.isEasing) ? 980 : 120;
  return new Promise((resolve) => {
    const attemptFocus = (remainingSettleChecks = 6) => {
      if (
        !isCurrentMemoryTrailState(memoryTrail)
        || memoryTrail.currentPromptKey !== promptKey
        || memoryTrail.currentPromptTargetId !== selection.targetId
        || memoryTrail.currentPromptType !== "guided"
        || memoryTrail.sessionPhase !== "learn"
        || getActiveDailyTrailFixedCamera(memoryTrail)
      ) {
        debugMemoryTrail("small target learn focus canceled", {
          targetId: target.id,
          targetName: target.name,
          reason: "prompt changed before deferred focus"
        });
        resolve(false);
        return;
      }

      const currentMapState = runner.getMapInteractionState?.();
      if ((currentMapState?.isMoving || currentMapState?.isEasing) && remainingSettleChecks > 0) {
        const settleTimeoutId = window.setTimeout(() => attemptFocus(remainingSettleChecks - 1), 180);
        memoryTrail.timers.push(settleTimeoutId);
        return;
      }

      const needsFocusNow = runner.shouldFocusSmallTargetInLearnMode(target, { mobile: true });
      if (!needsFocusAtSchedule && !needsFocusNow) {
        debugMemoryTrail("small target learn focus skipped", {
          targetId: target.id,
          targetName: target.name,
          reason: "target is already comfortably playable"
        });
        resolve(false);
        return;
      }

      const focusOptions = typeof runner.getSmallTargetLearnFocusOptions === "function"
        ? runner.getSmallTargetLearnFocusOptions(target)
        : {
          duration: 720,
          force: true,
          maxZoom: 7.8,
          zoomTolerance: 0.35,
          padding: { top: 98, right: 34, bottom: 214, left: 34 },
          comfortPadding: { top: 104, right: 34, bottom: 214, left: 34 }
        };
      focusOptions.cameraContext = "small-target-focus";
      focusOptions.source = "small-target-learn";
      const focusTarget = typeof runner.getSmallTargetLearnFocusTarget === "function"
        ? runner.getSmallTargetLearnFocusTarget(target)
        : target;
      const didFocus = runner.focusTargetIfNeeded(focusTarget, focusOptions);
      debugMemoryTrail("small target learn focus", {
        targetId: target.id,
        targetName: target.name,
        didFocus,
        focusOptions
      });

      if (!didFocus) {
        resolve(false);
        return;
      }

      const settleTimeoutId = window.setTimeout(() => resolve(true), (focusOptions.duration || 720) + 100);
      memoryTrail.timers.push(settleTimeoutId);
    };
    const timeoutId = window.setTimeout(() => attemptFocus(), delayMs);
    memoryTrail.timers.push(timeoutId);
  });
}

function scheduleContinentsOceansLearnFocusCheck(memoryTrail, selection, target) {
  if (
    session.currentActivity?.id !== continentsOceansActivityId
    || selection?.promptType !== "guided"
    || memoryTrail?.activityId !== continentsOceansActivityId
    || memoryTrail.sessionPhase !== "learn"
    || memoryTrail.currentPromptTargetId !== selection?.targetId
    || !target
    || typeof runner?.focusTargetIfNeeded !== "function"
  ) {
    return false;
  }

  const focusProfile = getContinentsOceansLearnFocusProfile(target, memoryTrail);
  const promptKey = memoryTrail.currentPromptKey;
  debugContinentsOceansLearnCamera("target focus scheduled", {
    source: "c&o-learn-target-focus",
    requestType: "focusTargetIfNeeded",
    targetId: target.id,
    targetLabel: target.name,
    targetFocus: {
      center: Number.isFinite(target.focusLon) && Number.isFinite(target.focusLat)
        ? [target.focusLon, target.focusLat]
        : null,
      zoom: Number.isFinite(target.focusZoom) ? target.focusZoom : null,
      bounds: target.focusBounds || null
    },
    delayMs: focusProfile.delayMs,
    force: focusProfile.forceOnPromptStart
  }, memoryTrail);
  return new Promise((resolve) => {
    const timeoutId = window.setTimeout(() => {
      if (
        !isCurrentMemoryTrailState(memoryTrail)
        || memoryTrail.currentPromptKey !== promptKey
        || memoryTrail.currentPromptTargetId !== selection.targetId
      ) {
        debugContinentsOceansLearnCamera("target focus canceled", {
          source: "c&o-learn-target-focus",
          requestType: "focusTargetIfNeeded",
          targetId: target.id,
          targetLabel: target.name,
          expectedPromptKey: promptKey,
          reason: "prompt changed before deferred focus"
        }, memoryTrail);
        resolve(false);
        return;
      }

      const didFocus = maybeFocusContinentsOceansLearnPrompt(memoryTrail, target, focusProfile);
      if (!didFocus) {
        resolve(false);
        return;
      }

      const settleTimeoutId = window.setTimeout(() => resolve(true), 800);
      memoryTrail.timers.push(settleTimeoutId);
    }, focusProfile.delayMs);
    memoryTrail.timers.push(timeoutId);
  });
}

function getContinentsOceansLearnFocusProfile(target, memoryTrail) {
  const profile = continentsOceansLearnFocusProfiles[target?.id] || {};
  const stats = target?.id ? memoryTrail?.targetStats?.[target.id] : null;
  const isFirstPrompt = memoryTrail?.promptHistory?.length === 1 && memoryTrail.promptCount === 0;
  const isFirstPromptInLearnSection = Boolean(
    stats
    && stats.introducedAtPrompt === memoryTrail?.promptCount
    && stats.exposedCount <= 1
    && stats.guidedTapCount === 0
  );
  return {
    delayMs: Number.isFinite(profile.delayMs)
      ? profile.delayMs
      : ((isFirstPrompt || isFirstPromptInLearnSection) ? 980 : 80),
    forceOnPromptStart: Boolean(profile.forceOnPromptStart || isFirstPrompt || isFirstPromptInLearnSection)
  };
}

function getContinentsOceansMobileLearnCameraOverride(target) {
  if (
    session.currentActivity?.id !== continentsOceansActivityId
    || !isCompactTouchLayout()
    || !target?.id
  ) {
    return null;
  }

  return continentsOceansMobileLearnCameraOverrides[target.id] || null;
}

function maybeFocusContinentsOceansLearnPrompt(memoryTrail, target, focusProfile = {}) {
  if (
    session.currentActivity?.id !== continentsOceansActivityId
    || memoryTrail?.activityId !== continentsOceansActivityId
    || memoryTrail.sessionPhase !== "learn"
    || memoryTrail.currentPromptType !== "guided"
    || memoryTrail.currentPromptTargetId !== target?.id
    || !target
    || typeof runner?.focusTargetIfNeeded !== "function"
  ) {
    return false;
  }

  const isOcean = target.type === "zone";
  const mobileLearnCameraOverride = getContinentsOceansMobileLearnCameraOverride(target);
  const focusTarget = mobileLearnCameraOverride
    ? {
        ...target,
        focusCenter: mobileLearnCameraOverride.center,
        focusZoom: mobileLearnCameraOverride.zoom,
        focusMaxZoom: mobileLearnCameraOverride.zoom
      }
    : target;
  debugContinentsOceansLearnCamera("target focus requested", {
    source: "c&o-learn-target-focus",
    requestType: "focusTargetIfNeeded",
    targetId: target.id,
    targetLabel: target.name,
    requestedCamera: {
      center: mobileLearnCameraOverride?.center
        || (Number.isFinite(target.focusLon) && Number.isFinite(target.focusLat)
        ? [target.focusLon, target.focusLat]
        : null),
      zoom: Number.isFinite(mobileLearnCameraOverride?.zoom)
        ? mobileLearnCameraOverride.zoom
        : (Number.isFinite(target.focusZoom) ? target.focusZoom : null),
      bounds: target.focusBounds || null
    },
    mobileLearnCameraOverride: Boolean(mobileLearnCameraOverride),
    force: Boolean(focusProfile.forceOnPromptStart || mobileLearnCameraOverride)
  }, memoryTrail);
  const didFocus = runner.focusTargetIfNeeded(focusTarget, {
    duration: 700,
    force: Boolean(focusProfile.forceOnPromptStart || mobileLearnCameraOverride),
    zoomTolerance: isOcean ? 0.35 : 0.7,
    comfortPadding: {
      top: isOcean ? 130 : 110,
      right: isOcean ? 120 : 48,
      bottom: isOcean ? 235 : 220,
      left: isOcean ? 120 : 48
    },
    cameraContext: mobileLearnCameraOverride?.cameraContext || "c&o-learn-focus",
    source: mobileLearnCameraOverride?.source || "c&o-learn-target-focus"
  });
  debugContinentsOceansLearnCamera("target focus result", {
    source: "c&o-learn-target-focus",
    requestType: "focusTargetIfNeeded",
    targetId: target.id,
    targetLabel: target.name,
    didFocus
  }, memoryTrail);

  debugMemoryTrail("C&O learn focus", {
    targetId: target.id,
    targetName: target.name,
    targetType: target.type,
    didFocus
  });

  return didFocus;
}

function maybeFocusContinentsOceansNamePrompt(selection, target) {
  const memoryTrail = getActiveMemoryTrail();
  debugContinentsOceansNamePromptFocus("prompt-start hook entered", {
    selection,
    target,
    promptInstanceId: memoryTrail?.currentPromptKey || "",
    autoFlyHelperReached: true
  }, memoryTrail);

  if (
    session.currentActivity?.id !== continentsOceansActivityId
    || selection?.promptType !== "place_to_name"
    || memoryTrail?.activityId !== continentsOceansActivityId
    || getActiveDailyTrailNonLearnCamera(memoryTrail)
    || memoryTrail.sessionPhase !== "practice"
    || selection?.mode === "learn"
    || !target
    || typeof runner?.focusTargetIfNeeded !== "function"
  ) {
    debugContinentsOceansNamePromptFocus("skipped before scheduling", {
      selection,
      target,
      reason: getContinentsOceansNamePromptFocusSkipReason(selection, target, memoryTrail)
    }, memoryTrail);
    return false;
  }

  const promptKey = memoryTrail.currentPromptKey;
  const delayMs = memoryTrail.promptHistory?.length <= 1 ? 220 : 80;
  debugContinentsOceansNamePromptFocus("scheduled", {
    selection,
    target,
    delayMs,
    promptInstanceId: promptKey
  }, memoryTrail);
  const timeoutId = window.setTimeout(() => {
    if (
      !isCurrentMemoryTrailState(memoryTrail)
      || memoryTrail.currentPromptKey !== promptKey
      || memoryTrail.currentPromptTargetId !== selection.targetId
      || memoryTrail.currentPromptType !== "place_to_name"
      || memoryTrail.currentPromptMode === "learn"
    ) {
      debugMemoryTrail("C&O place-to-name focus canceled", {
        targetId: target.id,
        targetName: target.name,
        reason: "prompt changed before deferred focus"
      });
      debugContinentsOceansNamePromptFocus("canceled before request", {
        selection,
        target,
        expectedPromptKey: promptKey,
        reason: "prompt changed before deferred focus"
      }, memoryTrail);
      return;
    }

    debugContinentsOceansNamePromptFocus("deferred request fired", {
      selection,
      target,
      promptInstanceId: promptKey,
      cameraBeforeRequest: getMapCameraDebugState()
    }, memoryTrail);
    focusContinentsOceansNamePromptTarget(memoryTrail, target);
  }, delayMs);
  memoryTrail.timers.push(timeoutId);
  return true;
}

function getContinentsOceansNamePromptFocusSkipReason(selection, target, memoryTrail) {
  if (session.currentActivity?.id !== continentsOceansActivityId) {
    return "not C&O activity";
  }
  if (selection?.promptType !== "place_to_name") {
    return "not place_to_name";
  }
  if (memoryTrail?.activityId !== continentsOceansActivityId) {
    return "memory trail is not C&O";
  }
  if (memoryTrail.sessionPhase !== "practice") {
    return "not practice phase";
  }
  if (selection?.mode === "learn") {
    return "learn mode excluded";
  }
  if (!target) {
    return "missing target";
  }
  if (typeof runner?.focusTargetIfNeeded !== "function") {
    return "missing focusTargetIfNeeded";
  }
  return "";
}

function isContinentsOceansNamePromptFocusDebugEnabled() {
  try {
    return typeof window !== "undefined"
      && new URLSearchParams(window.location.search).has("debugCoNameCamera");
  } catch {
    return false;
  }
}

function getMapCameraDebugState() {
  try {
    const center = runner?.map?.getCenter?.();
    const canvas = runner?.map?.getCanvas?.();
    return {
      center: center ? [Number(center.lng.toFixed(4)), Number(center.lat.toFixed(4))] : null,
      zoom: Number.isFinite(runner?.map?.getZoom?.()) ? Number(runner.map.getZoom().toFixed(3)) : null,
      isMoving: Boolean(runner?.map?.isMoving?.()),
      isEasing: Boolean(runner?.map?.isEasing?.()),
      canvas: canvas
        ? { width: canvas.clientWidth || 0, height: canvas.clientHeight || 0 }
        : null
    };
  } catch {
    return { center: null, zoom: null, isMoving: false, isEasing: false, canvas: null };
  }
}

function isMapCameraTransitioning() {
  return Boolean(runner?.map?.isMoving?.() || runner?.map?.isEasing?.());
}

function getTargetCameraDebugSummary(camera = null) {
  if (!camera) {
    return null;
  }

  return {
    center: Array.isArray(camera.center) ? camera.center : null,
    zoom: Number.isFinite(camera.zoom) ? camera.zoom : null,
    bounds: camera.bounds || null,
    maxZoom: Number.isFinite(camera.maxZoom) ? camera.maxZoom : null,
    padding: camera.padding || null,
    duration: Number.isFinite(camera.duration) ? camera.duration : null
  };
}

function getContinentsOceansNamePromptVisibilityDebug(target, focusOptions = {}) {
  try {
    const focusTarget = {
      ...target,
      focusDuration: Number.isFinite(focusOptions.duration) ? focusOptions.duration : target?.focusDuration,
      focusPadding: focusOptions.padding || target?.focusPadding
    };
    const camera = runner?.getTargetFocusCamera?.(focusTarget) || null;
    const comfortablyVisible = camera
      ? Boolean(runner?.isTargetFocusComfortablyVisible?.(focusTarget, camera, focusOptions))
      : false;

    return {
      hasCamera: Boolean(camera),
      comfortablyVisible,
      camera: getTargetCameraDebugSummary(camera)
    };
  } catch (error) {
    return {
      hasCamera: false,
      comfortablyVisible: false,
      error: error?.message || String(error)
    };
  }
}

function getContinentsOceansNamePromptFocusDebugContext(selection = {}, target = null, memoryTrail = getActiveMemoryTrail()) {
  const stats = target?.id ? memoryTrail?.targetStats?.[target.id] : null;
  const profile = getContinentsOceansNamePromptFocusProfile(target);
  const currentPromptKey = memoryTrail?.currentPromptKey || "";
  return {
    timestamp: typeof performance !== "undefined" ? Math.round(performance.now()) : Date.now(),
    promptKey: currentPromptKey,
    promptNumber: memoryTrail?.promptHistory?.length || 0,
    source: memoryTrail?.source || "",
    sessionPhase: memoryTrail?.sessionPhase || "",
    promptType: selection?.promptType || memoryTrail?.currentPromptType || "",
    promptMode: selection?.mode || memoryTrail?.currentPromptMode || "",
    promptReason: selection?.reason || memoryTrail?.currentPromptReason || "",
    targetId: target?.id || selection?.targetId || memoryTrail?.currentPromptTargetId || "",
    targetLabel: target?.name || target?.label || "",
    targetType: target?.type || "",
    appearedEarlier: Boolean(stats && (stats.placeToNameAttempts > 0 || stats.totalRetrievalAttempts > 0)),
    placeToNameAttempts: stats?.placeToNameAttempts || 0,
    totalRetrievalAttempts: stats?.totalRetrievalAttempts || 0,
    lastFocusedPromptKey: memoryTrail?.lastContinentsOceansNameFocusPromptKey || "",
    lastFocusedTargetId: memoryTrail?.lastContinentsOceansNameFocusTargetId || "",
    forceProfile: Boolean(profile.forceOnPromptStart),
    cameraBefore: getMapCameraDebugState()
  };
}

function debugContinentsOceansNamePromptFocus(label, details = {}, memoryTrail = getActiveMemoryTrail()) {
  if (!isContinentsOceansNamePromptFocusDebugEnabled()) {
    return;
  }

  const payload = {
    ...getContinentsOceansNamePromptFocusDebugContext(details.selection, details.target, memoryTrail),
    ...details
  };
  delete payload.selection;
  delete payload.target;
  console.warn("[C&O Name camera]", label, JSON.stringify(payload));
}

function scheduleContinentsOceansNamePromptFocusFollowUp(memoryTrail, target, focusOptions, requestId) {
  if (!isContinentsOceansNamePromptFocusDebugEnabled() || !runner?.map || !memoryTrail || !target) {
    return;
  }

  const promptKey = memoryTrail.currentPromptKey || "";
  const targetId = target.id || "";
  let sawMoveEnd = false;
  const onMoveEnd = () => {
    sawMoveEnd = true;
    debugContinentsOceansNamePromptFocus("camera moveend", {
      requestId,
      target,
      expectedPromptKey: promptKey,
      promptStillCurrent: memoryTrail.currentPromptKey === promptKey,
      targetStillCurrent: memoryTrail.currentPromptTargetId === targetId,
      visibilityCheckResult: getContinentsOceansNamePromptVisibilityDebug(target, focusOptions),
      cameraAfterMoveEnd: getMapCameraDebugState()
    }, memoryTrail);
  };

  runner.map.once("moveend", onMoveEnd);

  const duration = Number.isFinite(focusOptions?.duration) ? focusOptions.duration : 700;
  const expectedCheckId = window.setTimeout(() => {
    debugContinentsOceansNamePromptFocus("camera expected-complete check", {
      requestId,
      target,
      expectedPromptKey: promptKey,
      sawMoveEnd,
      promptStillCurrent: memoryTrail.currentPromptKey === promptKey,
      targetStillCurrent: memoryTrail.currentPromptTargetId === targetId,
      visibilityCheckResult: getContinentsOceansNamePromptVisibilityDebug(target, focusOptions),
      cameraAfterExpectedDuration: getMapCameraDebugState()
    }, memoryTrail);
  }, duration + 180);

  const followUpCheckId = window.setTimeout(() => {
    runner?.map?.off?.("moveend", onMoveEnd);
    debugContinentsOceansNamePromptFocus("camera follow-up check", {
      requestId,
      target,
      expectedPromptKey: promptKey,
      sawMoveEnd,
      promptStillCurrent: memoryTrail.currentPromptKey === promptKey,
      targetStillCurrent: memoryTrail.currentPromptTargetId === targetId,
      visibilityCheckResult: getContinentsOceansNamePromptVisibilityDebug(target, focusOptions),
      cameraAfterFollowUp: getMapCameraDebugState()
    }, memoryTrail);
  }, duration + 1250);

  memoryTrail.timers.push(expectedCheckId, followUpCheckId);
}

function getContinentsOceansNamePromptFocusProfile(target) {
  return continentsOceansNamePromptFocusProfiles[target?.id] || {};
}

function shouldForceContinentsOceansNamePromptFocus(memoryTrail, target, focusProfile = {}) {
  if (focusProfile.forceOnPromptStart) {
    return true;
  }

  const stats = target?.id ? memoryTrail?.targetStats?.[target.id] : null;
  return Boolean(
    target?.type === "zone"
    && stats
    && stats.placeToNameAttempts > 0
  );
}

function focusContinentsOceansNamePromptTarget(memoryTrail, target) {
  const focusProfile = getContinentsOceansNamePromptFocusProfile(target);
  const isOcean = target.type === "zone";
  const cameraWasTransitioning = isMapCameraTransitioning();
  const forceFocus = shouldForceContinentsOceansNamePromptFocus(memoryTrail, target, focusProfile)
    || cameraWasTransitioning;
  const focusOptions = {
    duration: 700,
    force: forceFocus,
    zoomTolerance: isOcean ? 0.55 : 0.75,
    comfortPadding: {
      top: isOcean ? 130 : 110,
      right: isOcean ? 120 : 48,
      bottom: isOcean ? 235 : 220,
      left: isOcean ? 120 : 48
    },
    cameraContext: "c&o-name-focus",
    source: "c&o-name-target-focus"
  };
  const promptInstanceId = memoryTrail?.currentPromptKey || "";
  const requestId = `${promptInstanceId}:${target?.id || "target"}:${Math.round(typeof performance !== "undefined" ? performance.now() : Date.now())}`;
  const visibilityCheckResult = getContinentsOceansNamePromptVisibilityDebug(target, focusOptions);
  debugContinentsOceansNamePromptFocus("requesting focus", {
    target,
    requestId,
    promptInstanceId,
    force: forceFocus,
    forceReason: cameraWasTransitioning ? "camera transition in progress" : "",
    visibilityCheckResult,
    skippedByAlreadyFocusedGuard: false,
    requestedCamera: {
      center: Number.isFinite(target.focusLon) && Number.isFinite(target.focusLat)
        ? [target.focusLon, target.focusLat]
        : null,
      zoom: Number.isFinite(target.focusZoom) ? target.focusZoom : null,
      bounds: target.focusBounds || null
    }
  }, memoryTrail);
  const didFocus = runner.focusTargetIfNeeded(target, focusOptions);

  debugMemoryTrail("C&O place-to-name focus", {
    source: memoryTrail?.source || "",
    targetId: target.id,
    targetName: target.name,
    targetType: target.type,
    force: forceFocus,
    didFocus
  });
  memoryTrail.lastContinentsOceansNameFocusPromptKey = memoryTrail.currentPromptKey;
  memoryTrail.lastContinentsOceansNameFocusTargetId = target.id;
  debugContinentsOceansNamePromptFocus("focus result", {
    target,
    requestId,
    promptInstanceId,
    force: forceFocus,
    forceReason: cameraWasTransitioning ? "camera transition in progress" : "",
    didFocus,
    skipReason: didFocus
      ? ""
      : (visibilityCheckResult.hasCamera && visibilityCheckResult.comfortablyVisible ? "comfortably visible" : "missing camera or runner skipped"),
    cameraAfterDecision: getMapCameraDebugState()
  }, memoryTrail);
  if (didFocus) {
    scheduleContinentsOceansNamePromptFocusFollowUp(memoryTrail, target, focusOptions, requestId);
  }

  return didFocus;
}

function getMemoryTrailPromptMessage(memoryTrail, target, selection) {
  const label = getMemoryTrailTargetLabel(target);
  const singularNoun = getInstructionNoun();
  const oldReviewPrefix = isDailyTrailInsertedOldReviewPrompt(memoryTrail, selection)
    ? "Remember this one? "
    : "";

  if (selection.promptType === "guided") {
    return label ? `Learn: ${label}.` : "Learn this place.";
  }

  if (selection.promptType === "place_to_name") {
    return `${oldReviewPrefix}Practice: what ${singularNoun} is this?`;
  }

  if (selection.mode === "weak-review") {
    return label ? `Practice: let's review ${label}.` : "Practice: let's review this one.";
  }

  return label ? `${oldReviewPrefix}Practice: find ${label}.` : `${oldReviewPrefix}Practice: find the matching place.`;
}

function getMemoryTrailAnsweringMessage(memoryTrail) {
  const singularNoun = getInstructionNoun();
  const oldReviewPrefix = isDailyTrailInsertedOldReviewPrompt(memoryTrail)
    ? "Remember this one? "
    : "";

  if (isGuidedMemoryTrailPrompt(memoryTrail)) {
    const oceanInstruction = getContinentsOceansOceanLearnInstruction(
      memoryTrail,
      getMemoryTrailActivePromptTarget(memoryTrail)
    );
    if (oceanInstruction) {
      return oceanInstruction;
    }

    return memoryTrail.promptName
      ? `Tap the highlighted place: ${memoryTrail.promptName}.`
      : "Tap the highlighted place.";
  }

  if (isPlaceToNameMemoryTrailPrompt(memoryTrail)) {
    return `${oldReviewPrefix}What ${singularNoun} is this?`;
  }

  if (isNameToPlaceMemoryTrailPrompt(memoryTrail)) {
    return getMemoryTrailActivePromptLabel(memoryTrail)
      ? `${oldReviewPrefix}Tap the ${singularNoun} named below:`
      : `${oldReviewPrefix}Find the named ${singularNoun}.`;
  }

  return `${oldReviewPrefix}Find the matching place.`;
}

function isDailyTrailInsertedOldReviewPrompt(memoryTrail, selection = {}) {
  if (
    !isDailyTrailMemoryTrail(memoryTrail)
    || isMixedDailyTrailCheckpointMemoryTrail(memoryTrail)
    || isCompletedDailyTrailReviewMemoryTrail(memoryTrail)
  ) {
    return false;
  }

  const targetId = selection.targetId || memoryTrail?.currentPromptTargetId || "";
  if (!targetId) {
    return false;
  }

  const promptType = selection.promptType || memoryTrail?.currentPromptType || "";
  const promptMode = selection.mode || memoryTrail?.currentPromptMode || "";
  const promptReason = selection.reason || memoryTrail?.currentPromptReason || "";
  return promptType !== "guided"
    && promptMode !== "learn"
    && promptMode !== "weak-review"
    && promptReason !== "missed new item retry"
    && memoryTrail?.dailyTrailInsertedReviewTargetIds?.includes(targetId)
    && !memoryTrail?.dailyTrailWeakReviewTargetIds?.includes(targetId);
}

function getMemoryTrailFallbackSpeechDurationMs(labelText) {
  const text = String(labelText || "").trim();
  return Math.max(1200, Math.min(4200, 650 + text.length * 85));
}

function speakMemoryTrailTargetOnce(memoryTrail, target, promptKey = memoryTrail?.currentPromptKey || "") {
  if (!memoryTrail || !target || !promptKey || memoryTrail.lastSpokenTargetPromptKey === promptKey) {
    return false;
  }

  memoryTrail.lastSpokenTargetPromptKey = promptKey;
  return speakMemoryTrailTarget(target);
}

function speakMemoryTrailTarget(target, onComplete) {
  return new Promise((resolve) => {
    let labelText = "";
    let didFinish = false;
    const finish = (didSpeak = false) => {
      if (didFinish) {
        return;
      }

      didFinish = true;
      onComplete?.();
      resolve(Boolean(didSpeak));
    };

    try {
      labelText = getStudyPreviewSpeechLabel(target);
      if (!labelText) {
        finish(false);
        return;
      }

      if (window.GeographyChipSpeech?.speakLabelAndWait) {
        window.GeographyChipSpeech.speakLabelAndWait(labelText, {
          queue: true,
          warnOnAudioFailure: true
        }).then(finish).catch((error) => {
          console.warn("[memory-trail-audio] Speech sequence failed; continuing Memory Trail.", error);
          window.setTimeout(() => finish(false), getMemoryTrailFallbackSpeechDurationMs(labelText));
        });
        return;
      }

      const didSpeak = window.GeographyChipSpeech?.speakLabelWithCompletion?.(labelText, () => finish(true));

      if (didSpeak) {
        return;
      }
    } catch (error) {
      debugMemoryTrail("target speech failed before playback", {
        targetId: target?.id || "",
        error: error?.message || String(error)
      });
      // Speech is an enhancement; the visible prompt carries the exercise.
    }

    window.setTimeout(() => finish(false), getMemoryTrailFallbackSpeechDurationMs(labelText));
  });
}

function chooseNextPrompt(memoryTrail) {
  if (isMixedDailyTrailCheckpointMemoryTrail(memoryTrail)) {
    return chooseNextCheckpointReviewPrompt(memoryTrail);
  }

  if (isCompletedDailyTrailReviewMemoryTrail(memoryTrail)) {
    return chooseNextCompletedDailyTrailReviewPrompt(memoryTrail);
  }

  const introducedStats = getIntroducedMemoryTrailStats(memoryTrail);
  const avoidLast = (stats) => stats.targetId !== memoryTrail.lastPromptedTargetId || introducedStats.length === 1;
  const due = (stats) => stats.nextDuePrompt <= memoryTrail.promptCount;
  const dueIntroduced = introducedStats.filter((stats) => due(stats) && avoidLast(stats));
  const unguidedCurrentTarget = memoryTrail.currentPracticeWindow
    .map((target) => memoryTrail.targetStats[target.id])
    .find((stats) => stats && !hasTargetCompletedGuidedExposure(stats) && avoidLast(stats));

  if (unguidedCurrentTarget) {
    return {
      targetId: unguidedCurrentTarget.targetId,
      promptType: "guided",
      mode: "learn",
      reason: "new chunk target needs guided exposure"
    };
  }

  const missedNewRetry = getDailyTrailMissedNewItemRetry(memoryTrail, introducedStats, avoidLast);
  if (missedNewRetry) {
    return {
      targetId: missedNewRetry.targetId,
      promptType: chooseRetrievalPromptType(memoryTrail, missedNewRetry, { earlyChunk: true }),
      mode: "practice",
      reason: "missed new item retry"
    };
  }

  if (shouldReduceDifficulty(memoryTrail)) {
    const easier = dueIntroduced
      .filter((stats) => stats.totalRetrievalCorrect > 0 && !stats.isWeak)
      .sort((left, right) => left.totalRetrievalCorrect - right.totalRetrievalCorrect || left.totalRetrievalAttempts - right.totalRetrievalAttempts)[0];

    if (easier) {
      return {
        targetId: easier.targetId,
        promptType: "name_to_place",
        mode: "reducing-difficulty",
        reason: "recent retrieval misses were high"
      };
    }
  }

  const weak = getWeakTargets(memoryTrail)
    .filter((stats) => due(stats) && avoidLast(stats) && shouldPromptDailyTrailWeakStats(memoryTrail, stats))
    .filter((stats) => !shouldSkipDailyTrailWeakPromptForRetriedNewItem(memoryTrail, stats))
    .sort((left, right) => (
      right.totalRetrievalIncorrect - left.totalRetrievalIncorrect
      || left.lastPromptedAt - right.lastPromptedAt
      || compareDailyTrailPracticeOrder(left, right, memoryTrail)
    ))[0];

  if (weak) {
    const needsGuidedReset = weak.totalRetrievalIncorrect >= 3 && weak.currentWrongStreak >= 2;
    return {
      targetId: weak.targetId,
      promptType: needsGuidedReset ? "guided" : chooseRetrievalPromptType(memoryTrail, weak, { preferEasier: weak.totalRetrievalIncorrect >= 2 }),
      mode: "weak-review",
      reason: needsGuidedReset ? "weak target needs guided reset" : "weak target is due"
    };
  }

  const dailyTrailBatchReview = getDailyTrailNewBatchInsertedReview(memoryTrail, dueIntroduced);
  if (dailyTrailBatchReview) {
    return {
      targetId: dailyTrailBatchReview.targetId,
      promptType: chooseRetrievalPromptType(memoryTrail, dailyTrailBatchReview),
      mode: "review",
      reason: "recent review after new batch recall"
    };
  }

  const currentWindowNeed = memoryTrail.currentPracticeWindow
    .map((target) => memoryTrail.targetStats[target.id])
    .filter((stats) => (
      stats
      && due(stats)
      && avoidLast(stats)
      && !shouldDeferDailyTrailInsertedReviewTarget(memoryTrail, stats)
      && stats.totalRetrievalCorrect < getStatsRetrievalCorrectTarget(stats, memoryTrail)
      && (!isDailyTrailPacingCapEnabled(memoryTrail) || !hasDailyTrailStatsSettledForCurrentSection(memoryTrail, stats))
    ))
    .sort((left, right) => (
      left.totalRetrievalCorrect - right.totalRetrievalCorrect
      || left.totalRetrievalAttempts - right.totalRetrievalAttempts
      || compareDailyTrailPracticeOrder(left, right, memoryTrail)
    ))[0];

  if (currentWindowNeed) {
    return {
      targetId: currentWindowNeed.targetId,
      promptType: chooseRetrievalPromptType(memoryTrail, currentWindowNeed, { earlyChunk: true }),
      mode: "practice",
      reason: "current chunk needs retrieval practice"
    };
  }

  const review = getReviewTargets(memoryTrail)
    .filter((stats) => due(stats) && avoidLast(stats) && !shouldDeferDailyTrailInsertedReviewTarget(memoryTrail, stats))
    .sort((left, right) => left.totalRetrievalCorrect - right.totalRetrievalCorrect || left.lastPromptedAt - right.lastPromptedAt)[0];

  if (review && memoryTrail.promptCount % 4 === 3) {
    return {
      targetId: review.targetId,
      promptType: chooseRetrievalPromptType(memoryTrail, review),
      mode: "review",
      reason: "spaced review from earlier chunk"
    };
  }

  const learningTarget = dueIntroduced
    .filter((stats) => (
      !shouldDeferDailyTrailInsertedReviewTarget(memoryTrail, stats)
      && stats.totalRetrievalCorrect < getStatsRetrievalCorrectTarget(stats, memoryTrail)
      && (!isDailyTrailPacingCapEnabled(memoryTrail) || !hasDailyTrailStatsSettledForCurrentSection(memoryTrail, stats))
    ))
    .sort((left, right) => (
      left.totalRetrievalCorrect - right.totalRetrievalCorrect
      || left.totalRetrievalAttempts - right.totalRetrievalAttempts
      || compareDailyTrailPracticeOrder(left, right, memoryTrail)
    ))[0];

  if (learningTarget) {
    return {
      targetId: learningTarget.targetId,
      promptType: chooseRetrievalPromptType(memoryTrail, learningTarget),
      mode: "practice",
      reason: "target still needs retrieval practice"
    };
  }

  const fallback = dueIntroduced
    .filter((stats) => !shouldDeferDailyTrailInsertedReviewTarget(memoryTrail, stats))
    .sort((left, right) => left.lastPromptedAt - right.lastPromptedAt)[0]
    || introducedStats
      .filter((stats) => avoidLast(stats) && !shouldDeferDailyTrailInsertedReviewTarget(memoryTrail, stats))
      .sort((left, right) => left.nextDuePrompt - right.nextDuePrompt)[0]
    || introducedStats.find((stats) => !shouldDeferDailyTrailInsertedReviewTarget(memoryTrail, stats))
    || introducedStats[0];

  return fallback ? {
    targetId: fallback.targetId,
    promptType: chooseRetrievalPromptType(memoryTrail, fallback),
    mode: "review",
    reason: "fallback due review"
  } : null;
}

function chooseRetrievalPromptType(memoryTrail, stats, options = {}) {
  if (isDailyTrailMemoryTrail(memoryTrail)) {
    return "name_to_place";
  }

  if (options.preferEasier || stats.placeToNameIncorrect > stats.nameToPlaceIncorrect + 1) {
    return "name_to_place";
  }

  if (stats.nameToPlaceCorrect < 1) {
    return "name_to_place";
  }

  if (stats.placeToNameCorrect < 1) {
    return "place_to_name";
  }

  const retrievalCount = Math.max(1, memoryTrail.retrievalPromptCount);
  const placeToNameCount = getIntroducedMemoryTrailStats(memoryTrail)
    .reduce((count, item) => count + item.placeToNameAttempts, 0);
  const placeToNameRatio = placeToNameCount / retrievalCount;

  if (options.earlyChunk) {
    return placeToNameRatio < 0.3 ? "place_to_name" : "name_to_place";
  }

  return placeToNameRatio < 0.5 ? "place_to_name" : "name_to_place";
}

function hashMemoryTrailString(value) {
  return String(value || "").split("").reduce((hash, char) => (
    ((hash << 5) - hash + char.charCodeAt(0)) | 0
  ), 0);
}

function areTargetOrdersEqual(left = [], right = []) {
  return left.length === right.length && left.every((targetId, index) => targetId === right[index]);
}

function rotateTargetOrder(targetIds = []) {
  return targetIds.length > 1 ? [...targetIds.slice(1), targetIds[0]] : [...targetIds];
}

function countMatchingTargetOrderPositions(left = [], right = []) {
  return left.reduce((count, targetId, index) => count + (targetId === right[index] ? 1 : 0), 0);
}

function reduceMatchingTargetOrderPositions(targetIds = [], referenceOrder = []) {
  if (targetIds.length <= 1 || referenceOrder.length <= 1) {
    return [...targetIds];
  }

  let bestOrder = [...targetIds];
  let bestMatchCount = countMatchingTargetOrderPositions(bestOrder, referenceOrder);
  for (let offset = 1; offset < targetIds.length; offset += 1) {
    const candidate = [...targetIds.slice(offset), ...targetIds.slice(0, offset)];
    const candidateMatchCount = countMatchingTargetOrderPositions(candidate, referenceOrder);
    if (candidateMatchCount < bestMatchCount) {
      bestOrder = candidate;
      bestMatchCount = candidateMatchCount;
    }
    if (bestMatchCount === 0) {
      break;
    }
  }

  return bestOrder;
}

function getDailyTrailPracticeRoundKey(stats) {
  if (stats?.isWeak || stats?.totalRetrievalIncorrect > 0) {
    return `weak:${stats.currentCorrectStreak || 0}`;
  }

  return `recall:${stats?.totalRetrievalCorrect || 0}`;
}

function getDailyTrailNewBatchInsertedReview(memoryTrail, dueIntroduced = []) {
  const batchTargetIds = getDailyTrailNewItemBatchTargetIds(memoryTrail);
  const batchKey = batchTargetIds.join("|");
  const insertedReviewTargetIds = new Set(memoryTrail?.dailyTrailInsertedReviewTargetIds || []);
  if (
    !isDailyTrailNewItemBatchPractice(memoryTrail)
    || !batchKey
    || insertedReviewTargetIds.size === 0
    || memoryTrail.dailyTrailInsertedReviewBatchKeys?.includes(batchKey)
  ) {
    return null;
  }

  const newTargetIds = new Set(memoryTrail.dailyTrailNewTargetIds.filter(Boolean));
  const newBatchStats = batchTargetIds
    .map((targetId) => memoryTrail?.targetStats?.[targetId])
    .filter(Boolean);

  if (
    newBatchStats.length === 0
    || newBatchStats.some((stats) => (stats.totalRetrievalCorrect || 0) < 1)
  ) {
    return null;
  }

  const review = dueIntroduced
    .filter((stats) => insertedReviewTargetIds.has(stats.targetId))
    .filter((stats) => !newTargetIds.has(stats.targetId))
    .filter((stats) => hasTargetCompletedGuidedExposure(stats))
    .filter((stats) => !stats.isWeak && (stats.totalRetrievalIncorrect || 0) <= 0)
    .sort((left, right) => (
      getDailyTrailWeakReviewRank(memoryTrail, right) - getDailyTrailWeakReviewRank(memoryTrail, left)
      || (left.lastPromptedAt || 0) - (right.lastPromptedAt || 0)
      || (left.totalRetrievalCorrect || 0) - (right.totalRetrievalCorrect || 0)
      || left.targetId.localeCompare(right.targetId)
    ))[0] || null;

  if (review) {
    memoryTrail.dailyTrailInsertedReviewBatchKeys = [
      ...(memoryTrail.dailyTrailInsertedReviewBatchKeys || []),
      batchKey
    ];
  }

  return review;
}

function getDailyTrailWeakReviewRank(memoryTrail, stats) {
  return memoryTrail?.dailyTrailWeakReviewTargetIds?.includes(stats?.targetId) ? 1 : 0;
}

function shouldDeferDailyTrailInsertedReviewTarget(memoryTrail, stats) {
  if (!isDailyTrailNewItemBatchPractice(memoryTrail) || !stats?.targetId) {
    return false;
  }

  const insertedReviewTargetIds = new Set(memoryTrail.dailyTrailInsertedReviewTargetIds || []);
  if (!insertedReviewTargetIds.has(stats.targetId)) {
    return false;
  }

  if ((stats.totalRetrievalIncorrect || 0) > 0 || stats.isWeak) {
    return false;
  }

  return (stats.totalRetrievalCorrect || 0) >= 1
    || !hasDailyTrailInsertedReviewForCurrentBatch(memoryTrail);
}

function hasDailyTrailInsertedReviewForCurrentBatch(memoryTrail) {
  const batchTargetIds = getDailyTrailNewItemBatchTargetIds(memoryTrail);
  const batchKey = batchTargetIds.join("|");
  return Boolean(batchKey && memoryTrail?.dailyTrailInsertedReviewBatchKeys?.includes(batchKey));
}

function isDailyTrailNewItemBatchPractice(memoryTrail) {
  return Boolean(
    isDailyTrailMemoryTrail(memoryTrail)
    && !isMixedDailyTrailCheckpointMemoryTrail(memoryTrail)
    && Array.isArray(memoryTrail?.dailyTrailNewTargetIds)
    && memoryTrail.dailyTrailNewTargetIds.length > 0
  );
}

function getDailyTrailNewItemBatchTargetIds(memoryTrail) {
  if (!isDailyTrailNewItemBatchPractice(memoryTrail)) {
    return [];
  }

  const newTargetIds = new Set(memoryTrail.dailyTrailNewTargetIds.filter(Boolean));
  return (memoryTrail.currentPracticeWindow || [])
    .map((target) => target?.id)
    .filter((targetId) => targetId && newTargetIds.has(targetId));
}

function isDailyTrailCurrentNewBatchTarget(memoryTrail, targetId) {
  return Boolean(targetId && getDailyTrailNewItemBatchTargetIds(memoryTrail).includes(targetId));
}

function queueDailyTrailMissedNewItemRetry(memoryTrail, stats) {
  const targetId = stats?.targetId || "";
  if (
    !isDailyTrailCurrentNewBatchTarget(memoryTrail, targetId)
    || memoryTrail?.dailyTrailRetriedNewTargetIds?.includes(targetId)
    || memoryTrail?.dailyTrailMissedNewRetryTargetIds?.includes(targetId)
  ) {
    return;
  }

  memoryTrail.dailyTrailMissedNewRetryTargetIds = [
    ...(memoryTrail.dailyTrailMissedNewRetryTargetIds || []),
    targetId
  ];
}

function getDailyTrailMissedNewItemRetry(memoryTrail, dueIntroduced = [], avoidLast = () => true) {
  if (
    !isDailyTrailNewItemBatchPractice(memoryTrail)
    || !hasDailyTrailNewItemBatchRecallPass(memoryTrail)
  ) {
    return null;
  }

  const pendingRetryIds = memoryTrail.dailyTrailMissedNewRetryTargetIds || [];
  const retriedIds = new Set(memoryTrail.dailyTrailRetriedNewTargetIds || []);
  const retryCount = Math.max(1, Number(DAILY_TRAIL_CONFIG.missedNewRetryCount) || 1);
  const retry = dueIntroduced
    .filter((stats) => pendingRetryIds.includes(stats.targetId))
    .filter((stats) => !retriedIds.has(stats.targetId))
    .filter((stats) => isDailyTrailCurrentNewBatchTarget(memoryTrail, stats.targetId))
    .sort((left, right) => (
      Number(avoidLast(right)) - Number(avoidLast(left))
      || (left.lastMissPrompt || 0) - (right.lastMissPrompt || 0)
      || compareDailyTrailPracticeOrder(left, right, memoryTrail)
    ))
    .slice(0, retryCount)[0] || null;

  if (retry) {
    memoryTrail.dailyTrailMissedNewRetryTargetIds = pendingRetryIds.filter((targetId) => targetId !== retry.targetId);
    memoryTrail.dailyTrailRetriedNewTargetIds = [
      ...(memoryTrail.dailyTrailRetriedNewTargetIds || []),
      retry.targetId
    ];
  }

  return retry;
}

function hasDailyTrailNewItemBatchRecallPass(memoryTrail) {
  const batchStats = getDailyTrailNewItemBatchTargetIds(memoryTrail)
    .map((targetId) => memoryTrail?.targetStats?.[targetId])
    .filter(Boolean);

  return batchStats.length > 0
    && batchStats.every((stats) => (stats.totalRetrievalAttempts || 0) >= 1);
}

function hasDailyTrailPendingMissedNewItemRetry(memoryTrail) {
  if (!isDailyTrailNewItemBatchPractice(memoryTrail)) {
    return false;
  }

  const retriedIds = new Set(memoryTrail.dailyTrailRetriedNewTargetIds || []);
  return (memoryTrail.dailyTrailMissedNewRetryTargetIds || []).some((targetId) => (
    !retriedIds.has(targetId)
    && isDailyTrailCurrentNewBatchTarget(memoryTrail, targetId)
  ));
}

function shouldSkipDailyTrailWeakPromptForRetriedNewItem(memoryTrail, stats) {
  return Boolean(
    isDailyTrailCurrentNewBatchTarget(memoryTrail, stats?.targetId)
    && (
      memoryTrail?.dailyTrailMissedNewRetryTargetIds?.includes(stats.targetId)
      || memoryTrail?.dailyTrailRetriedNewTargetIds?.includes(stats.targetId)
    )
  );
}

function isDailyTrailRetriedNewItemTarget(memoryTrail, targetId) {
  return Boolean(
    isDailyTrailCurrentNewBatchTarget(memoryTrail, targetId)
    && memoryTrail?.dailyTrailRetriedNewTargetIds?.includes(targetId)
  );
}

function getDailyTrailNewItemBatchPracticeRoundKey(memoryTrail) {
  const batchTargetIds = getDailyTrailNewItemBatchTargetIds(memoryTrail);
  if (batchTargetIds.length === 0) {
    return "";
  }

  const batchStats = batchTargetIds
    .map((targetId) => memoryTrail?.targetStats?.[targetId])
    .filter(Boolean);

  if (batchStats.length === 0) {
    return "";
  }

  const batchPassIndex = Math.max(0, Math.min(...batchStats.map((stats) => Math.max(0, Number(stats.totalRetrievalCorrect) || 0))));
  return [
    "new-batch",
    memoryTrail.source || "daily-trail",
    memoryTrail.activityId || "",
    memoryTrail.dailyTrailSessionNumber || 0,
    batchTargetIds.join("|"),
    `pass:${batchPassIndex}`
  ].join(":");
}

function getDailyTrailNewItemBatchPracticeRoundOrder(memoryTrail) {
  const batchTargetIds = getDailyTrailNewItemBatchTargetIds(memoryTrail);
  if (batchTargetIds.length === 0) {
    return [];
  }

  memoryTrail.dailyTrailPracticeRoundOrders ||= {};
  const roundKey = getDailyTrailNewItemBatchPracticeRoundKey(memoryTrail);
  if (roundKey && memoryTrail.dailyTrailPracticeRoundOrders[roundKey]) {
    return memoryTrail.dailyTrailPracticeRoundOrders[roundKey];
  }

  const seed = [
    memoryTrail.source,
    memoryTrail.activityId,
    memoryTrail.dailyTrailSessionNumber,
    roundKey || batchTargetIds.join("|")
  ].join(":");
  let ordered = [...batchTargetIds].sort((left, right) => (
    Math.abs(hashMemoryTrailString(`${seed}:${left}`)) - Math.abs(hashMemoryTrailString(`${seed}:${right}`))
    || left.localeCompare(right)
  ));

  if (ordered.length > 1 && areTargetOrdersEqual(ordered, batchTargetIds)) {
    ordered = rotateTargetOrder(ordered);
  }

  ordered = reduceMatchingTargetOrderPositions(ordered, batchTargetIds);

  if (ordered.length > 1 && areTargetOrdersEqual(ordered, memoryTrail.lastDailyTrailPracticeRoundOrder)) {
    ordered = rotateTargetOrder(ordered);
  }

  if (roundKey) {
    memoryTrail.dailyTrailPracticeRoundOrders[roundKey] = ordered;
  }
  memoryTrail.lastDailyTrailPracticeRoundOrder = ordered;
  return ordered;
}

function getDailyTrailPracticeRoundOrder(memoryTrail, roundKey) {
  if (!isDailyTrailMemoryTrail(memoryTrail)) {
    return [];
  }

  memoryTrail.dailyTrailPracticeRoundOrders ||= {};
  if (memoryTrail.dailyTrailPracticeRoundOrders[roundKey]) {
    return memoryTrail.dailyTrailPracticeRoundOrders[roundKey];
  }

  const learnOrder = memoryTrail.currentPracticeWindow
    .map((target) => target?.id)
    .filter(Boolean);
  const seed = [
    memoryTrail.source,
    memoryTrail.activityId,
    memoryTrail.dailyTrailSessionNumber,
    roundKey
  ].join(":");
  let ordered = [...learnOrder].sort((left, right) => (
    Math.abs(hashMemoryTrailString(`${seed}:${left}`)) - Math.abs(hashMemoryTrailString(`${seed}:${right}`))
    || left.localeCompare(right)
  ));

  if (ordered.length > 1 && areTargetOrdersEqual(ordered, learnOrder)) {
    ordered = rotateTargetOrder(ordered);
  }
  ordered = reduceMatchingTargetOrderPositions(ordered, learnOrder);

  if (ordered.length > 1 && areTargetOrdersEqual(ordered, memoryTrail.lastDailyTrailPracticeRoundOrder)) {
    ordered = rotateTargetOrder(ordered);
  }

  memoryTrail.dailyTrailPracticeRoundOrders[roundKey] = ordered;
  memoryTrail.lastDailyTrailPracticeRoundOrder = ordered;
  return ordered;
}

function compareDailyTrailPracticeOrder(left, right, memoryTrail) {
  if (!isDailyTrailMemoryTrail(memoryTrail)) {
    return 0;
  }

  const leftIsNewBatchTarget = isDailyTrailNewItemBatchPractice(memoryTrail) && memoryTrail.dailyTrailNewTargetIds.includes(left.targetId);
  const rightIsNewBatchTarget = isDailyTrailNewItemBatchPractice(memoryTrail) && memoryTrail.dailyTrailNewTargetIds.includes(right.targetId);

  if (leftIsNewBatchTarget && rightIsNewBatchTarget) {
    const newBatchOrder = getDailyTrailNewItemBatchPracticeRoundOrder(memoryTrail);
    const leftIndex = newBatchOrder.indexOf(left.targetId);
    const rightIndex = newBatchOrder.indexOf(right.targetId);
    const safeLeftIndex = leftIndex >= 0 ? leftIndex : Number.MAX_SAFE_INTEGER;
    const safeRightIndex = rightIndex >= 0 ? rightIndex : Number.MAX_SAFE_INTEGER;
    return safeLeftIndex - safeRightIndex || left.targetId.localeCompare(right.targetId);
  }

  const leftOrder = getDailyTrailPracticeRoundOrder(memoryTrail, getDailyTrailPracticeRoundKey(left));
  const rightOrder = getDailyTrailPracticeRoundOrder(memoryTrail, getDailyTrailPracticeRoundKey(right));
  const leftIndex = leftOrder.indexOf(left.targetId);
  const rightIndex = rightOrder.indexOf(right.targetId);
  const safeLeftIndex = leftIndex >= 0 ? leftIndex : Number.MAX_SAFE_INTEGER;
  const safeRightIndex = rightIndex >= 0 ? rightIndex : Number.MAX_SAFE_INTEGER;
  return safeLeftIndex - safeRightIndex || left.targetId.localeCompare(right.targetId);
}

function updateMemoryTrailStats(memoryTrail, targetId, result, options = {}) {
  const stats = memoryTrail.targetStats[targetId];
  if (!stats) {
    return;
  }

  const isCorrect = result === "correct";
  const promptType = options.promptType || memoryTrail.currentPromptType || "name_to_place";
  const isGuided = promptType === "guided";
  const hadRetrievalMissBeforeAttempt = !isGuided && (stats.totalRetrievalIncorrect || 0) > 0;
  stats.lastResult = result;
  stats.lastPromptedAt = memoryTrail.promptCount;
  memoryTrail.promptCount += 1;

  if (isGuided) {
    if (isCorrect) {
      stats.guidedTapCount += 1;
      stats.currentWrongStreak = 0;
      stats.recentMisses = Math.max(0, stats.recentMisses - 1);
    }
    stats.nextDuePrompt = memoryTrail.promptCount + 1;
    const lastHistory = memoryTrail.promptHistory.at(-1);
    if (lastHistory) {
      lastHistory.result = result;
      lastHistory.guided = true;
    }
    debugMemoryTrail("updated guided stats", {
      targetId,
      result,
      stats
    });
    updateMemoryTrailDebugObject(memoryTrail);
    return;
  }

  stats.totalRetrievalAttempts += 1;
  memoryTrail.retrievalPromptCount += 1;
  if (isDailyTrailPacingCapEnabled(memoryTrail) && hadRetrievalMissBeforeAttempt) {
    stats.immediateRemediationAttempts = (stats.immediateRemediationAttempts || 0) + 1;
  }

  if (promptType === "place_to_name") {
    stats.placeToNameAttempts += 1;
  } else {
    stats.nameToPlaceAttempts += 1;
  }

  if (isCorrect) {
    stats.totalRetrievalCorrect += 1;
    if (promptType === "place_to_name") {
      stats.placeToNameCorrect += 1;
    } else {
      stats.nameToPlaceCorrect += 1;
    }
    stats.currentCorrectStreak += 1;
    stats.currentWrongStreak = 0;
    stats.recentMisses = Math.max(0, stats.recentMisses - 1);
    stats.nextDuePrompt = memoryTrail.promptCount + MIN_GAP_AFTER_CORRECT;
    stats.isSessionLearned = hasTargetMetSessionLearnedRule(stats);
    if (stats.currentCorrectStreak >= 2 && stats.totalRetrievalIncorrect <= 1) {
      stats.isWeak = false;
    }
    memoryTrail.correctCount += 1;
    memoryTrail.recentResults.push("correct");
    memoryTrail.recentRetrievalResults.push("correct");
  } else {
    stats.totalRetrievalIncorrect += 1;
    if (promptType === "place_to_name") {
      stats.placeToNameIncorrect += 1;
    } else {
      stats.nameToPlaceIncorrect += 1;
    }
    stats.currentWrongStreak += 1;
    stats.currentCorrectStreak = 0;
    stats.recentMisses += 1;
    stats.lastMissPrompt = memoryTrail.promptCount;
    stats.isWeak = true;
    stats.nextDuePrompt = memoryTrail.promptCount + MIN_GAP_AFTER_MISS;
    queueDailyTrailMissedNewItemRetry(memoryTrail, stats);
    memoryTrail.incorrectCount += 1;
    memoryTrail.recentResults.push("incorrect");
    memoryTrail.recentRetrievalResults.push("incorrect");
  }

  memoryTrail.recentResults = memoryTrail.recentResults.slice(-8);
  memoryTrail.recentRetrievalResults = memoryTrail.recentRetrievalResults.slice(-8);
  const lastHistory = memoryTrail.promptHistory.at(-1);
  if (lastHistory) {
    lastHistory.result = result;
    lastHistory.guided = false;
  }
  debugMemoryTrail("updated stats", {
    targetId,
    result,
    promptType,
    stats,
    accuracy: getMemoryTrailAccuracySummary(memoryTrail),
    successRate: getMemoryTrailSuccessRate(memoryTrail)
  });
  updateMemoryTrailDebugObject(memoryTrail);
}

function getMemoryTrailAccuracySummary(memoryTrail) {
  const stats = getIntroducedMemoryTrailStats(memoryTrail);
  const totals = stats.reduce((summary, item) => {
    summary.nameToPlaceAttempts += item.nameToPlaceAttempts;
    summary.nameToPlaceCorrect += item.nameToPlaceCorrect;
    summary.placeToNameAttempts += item.placeToNameAttempts;
    summary.placeToNameCorrect += item.placeToNameCorrect;
    return summary;
  }, {
    nameToPlaceAttempts: 0,
    nameToPlaceCorrect: 0,
    placeToNameAttempts: 0,
    placeToNameCorrect: 0
  });

  return {
    ...totals,
    nameToPlaceAccuracy: totals.nameToPlaceAttempts > 0 ? totals.nameToPlaceCorrect / totals.nameToPlaceAttempts : null,
    placeToNameAccuracy: totals.placeToNameAttempts > 0 ? totals.placeToNameCorrect / totals.placeToNameAttempts : null
  };
}

function getIntroducedMemoryTrailStats(memoryTrail) {
  return memoryTrail.introducedTargetIds
    .map((targetId) => memoryTrail.targetStats[targetId])
    .filter(Boolean);
}

function getWeakTargets(memoryTrail) {
  return getIntroducedMemoryTrailStats(memoryTrail)
    .filter((stats) => stats.isWeak || stats.totalRetrievalIncorrect > 0);
}

function getReviewTargets(memoryTrail) {
  const currentIds = new Set(memoryTrail.currentPracticeWindow.map((target) => target.id));
  return getIntroducedMemoryTrailStats(memoryTrail)
    .filter((stats) => !currentIds.has(stats.targetId));
}

function isDailyTrailPacingCapEnabled(memoryTrail) {
  return isAdaptiveTrailMemoryTrail(memoryTrail) && memoryTrail?.activityId !== continentsOceansActivityId;
}

function getCurrentPracticeWindowStats(memoryTrail) {
  return (memoryTrail?.currentPracticeWindow || [])
    .map((target) => memoryTrail?.targetStats?.[target.id])
    .filter(Boolean);
}

function getDailyTrailCurrentSectionRetrievalPromptCount(memoryTrail) {
  return getCurrentPracticeWindowStats(memoryTrail)
    .reduce((count, stats) => count + (stats.totalRetrievalAttempts || 0), 0);
}

function getDailyTrailCurrentSectionRemediationPromptCount(memoryTrail) {
  return getCurrentPracticeWindowStats(memoryTrail)
    .reduce((count, stats) => count + (stats.immediateRemediationAttempts || 0), 0);
}

function getDailyTrailSectionSoftPromptCap(memoryTrail) {
  const targetCount = Math.max(1, memoryTrail?.currentPracticeWindow?.length || 0);
  return Math.max(targetCount, targetCount * DAILY_TRAIL_SECTION_MAX_CORRECT_REPEATS);
}

function getDailyTrailSectionHardPromptCap(memoryTrail) {
  const targetCount = Math.max(1, memoryTrail?.currentPracticeWindow?.length || 0);
  return Math.min(16, Math.max(14, targetCount * 3));
}

function getDailyTrailSectionRemediationCap(memoryTrail) {
  const targetCount = Math.max(1, memoryTrail?.currentPracticeWindow?.length || 0);
  return Math.min(DAILY_TRAIL_SECTION_MAX_REMEDIATION_PROMPTS, Math.max(3, Math.ceil(targetCount * 0.8)));
}

function hasDailyTrailSectionRemediationCapReached(memoryTrail) {
  return getDailyTrailCurrentSectionRemediationPromptCount(memoryTrail) >= getDailyTrailSectionRemediationCap(memoryTrail);
}

function hasDailyTrailWeakStatsSettledForNow(stats, memoryTrail) {
  if (!stats || (stats.totalRetrievalIncorrect || 0) <= 0) {
    return true;
  }

  if (isDailyTrailRetriedNewItemTarget(memoryTrail, stats.targetId)) {
    return true;
  }

  return stats.currentCorrectStreak >= DAILY_TRAIL_WEAK_CORRECT_TARGET
    || (stats.immediateRemediationAttempts || 0) >= DAILY_TRAIL_TARGET_MAX_REMEDIATION_PROMPTS
    || hasDailyTrailSectionRemediationCapReached(memoryTrail);
}

function shouldPromptDailyTrailWeakStats(memoryTrail, stats) {
  if (!isDailyTrailPacingCapEnabled(memoryTrail)) {
    return true;
  }

  return !hasDailyTrailWeakStatsSettledForNow(stats, memoryTrail);
}

function hasDailyTrailStatsSettledForCurrentSection(memoryTrail, stats) {
  if (!stats || !hasTargetCompletedGuidedExposure(stats) || (stats.totalRetrievalAttempts || 0) < 1) {
    return false;
  }

  if ((stats.totalRetrievalIncorrect || 0) > 0 || stats.isWeak) {
    return hasDailyTrailWeakStatsSettledForNow(stats, memoryTrail);
  }

  return hasDailyTrailStatsMetRecallRequirement(stats, memoryTrail)
    || (
      hasDailyTrailCurrentSectionHitSoftCap(memoryTrail)
      && (stats.totalRetrievalCorrect || 0) >= 1
    )
    || hasDailyTrailCurrentSectionHitHardCap(memoryTrail);
}

function hasDailyTrailCurrentSectionHitSoftCap(memoryTrail) {
  return getDailyTrailCurrentSectionRetrievalPromptCount(memoryTrail) >= getDailyTrailSectionSoftPromptCap(memoryTrail);
}

function hasDailyTrailCurrentSectionHitHardCap(memoryTrail) {
  return getDailyTrailCurrentSectionRetrievalPromptCount(memoryTrail) >= getDailyTrailSectionHardPromptCap(memoryTrail);
}

function hasDailyTrailCurrentSectionMetExitRule(memoryTrail) {
  if (!isDailyTrailPacingCapEnabled(memoryTrail)) {
    return false;
  }

  const currentStats = getCurrentPracticeWindowStats(memoryTrail);
  if (currentStats.length === 0) {
    return false;
  }

  const allTaughtAndPracticed = currentStats.every((stats) => (
    hasTargetCompletedGuidedExposure(stats) && (stats.totalRetrievalAttempts || 0) >= 1
  ));
  const allSettled = currentStats.every((stats) => hasDailyTrailStatsSettledForCurrentSection(memoryTrail, stats));
  const sectionStableEnough = getMemoryTrailSuccessRate(memoryTrail) >= TARGET_SUCCESS_RATE
    || hasDailyTrailCurrentSectionHitSoftCap(memoryTrail)
    || getWeakTargets(memoryTrail).every((stats) => hasDailyTrailWeakStatsSettledForNow(stats, memoryTrail));

  return allTaughtAndPracticed
    && allSettled
    && sectionStableEnough;
}

function shouldIntroduceNewTarget(memoryTrail) {
  if (hasDailyTrailPendingMissedNewItemRetry(memoryTrail)) {
    return false;
  }

  if (memoryTrail.currentWindowIndex >= memoryTrail.practiceWindows.length - 1) {
    return false;
  }

  if (memoryTrail.introducedTargetIds.length >= getMaxNewTargetsForSession(memoryTrail)) {
    return false;
  }

  if (memoryTrail.recentRetrievalResults.slice(-6).filter((result) => result === "incorrect").length >= 3) {
    return false;
  }

  const currentStats = memoryTrail.currentPracticeWindow.map((target) => memoryTrail.targetStats[target.id]).filter(Boolean);
  const currentWindowReady = currentStats.length > 0 && currentStats.every((stats) => {
    if (isAdaptiveTrailMemoryTrail(memoryTrail)) {
      return hasDailyTrailStatsMetRecallRequirement(stats, memoryTrail)
        || (isDailyTrailPacingCapEnabled(memoryTrail) && hasDailyTrailStatsSettledForCurrentSection(memoryTrail, stats));
    }

    return hasTargetCompletedGuidedExposure(stats)
      && (
        stats.totalRetrievalCorrect >= getStatsRetrievalCorrectTarget(stats, memoryTrail)
        || stats.totalRetrievalAttempts >= 4
        || stats.isSessionLearned
      );
  });
  const fiveCorrect = memoryTrail.recentRetrievalResults.slice(-5).length === 5
    && memoryTrail.recentRetrievalResults.slice(-5).every((result) => result === "correct");

  if (isAdaptiveTrailMemoryTrail(memoryTrail)) {
    return currentWindowReady || hasDailyTrailCurrentSectionMetExitRule(memoryTrail);
  }

  return currentWindowReady || fiveCorrect;
}

function shouldReduceDifficulty(memoryTrail) {
  const lastFour = memoryTrail.recentRetrievalResults.slice(-4);
  const lastSix = memoryTrail.recentRetrievalResults.slice(-6);
  return lastFour.filter((result) => result === "incorrect").length >= 2
    || lastSix.filter((result) => result === "incorrect").length >= 3
    || (memoryTrail.retrievalPromptCount >= 4 && getMemoryTrailSuccessRate(memoryTrail) < TARGET_SUCCESS_RATE - 0.18);
}

function advancePracticeWindow(memoryTrail) {
  if (!shouldIntroduceNewTarget(memoryTrail)) {
    return false;
  }

  memoryTrail.currentWindowIndex += 1;
  const nextWindow = memoryTrail.practiceWindows[memoryTrail.currentWindowIndex] || [];
  const { practiceWindow, newTargets } = composeNextPracticeWindow(memoryTrail, nextWindow);

  if (newTargets.length === 0 || practiceWindow.length === 0) {
    memoryTrail.currentWindowIndex -= 1;
    return false;
  }

  introducePracticeWindow(memoryTrail, practiceWindow, newTargets);
  fitMapToPracticeWindow(practiceWindow, "advance");
  debugMemoryTrail("advanced practice window", {
    currentWindowIndex: memoryTrail.currentWindowIndex,
    currentPracticeWindow: practiceWindow.map((target) => target.id),
    newTargets: newTargets.map((target) => target.id)
  });
  return true;
}

function shouldEndMemoryTrailSession(memoryTrail) {
  if (getMemoryTrailElapsedSeconds(memoryTrail) >= memoryTrail.sessionSeconds) {
    return true;
  }

  if (memoryTrail.promptCount >= SESSION_PROMPT_CAP) {
    return true;
  }

  if (isAdaptiveTrailMemoryTrail(memoryTrail)) {
    return shouldEndDailyTrailMemoryTrailSession(memoryTrail);
  }

  const introducedStats = getIntroducedMemoryTrailStats(memoryTrail);
  const requiredIntroducedCount = memoryTrail.requireAllTargets
    ? memoryTrail.targetPoolIds.length
    : Math.min(MIN_NEW_TARGETS_PER_SESSION, memoryTrail.targetPoolIds.length);
  return introducedStats.length >= requiredIntroducedCount
    && introducedStats.every((stats) => stats.isSessionLearned || stats.totalRetrievalCorrect >= getStatsRetrievalCorrectTarget(stats, memoryTrail))
    && getWeakTargets(memoryTrail).every((stats) => stats.currentCorrectStreak > 0);
}

function shouldEndDailyTrailMemoryTrailSession(memoryTrail) {
  if (isMixedDailyTrailCheckpointMemoryTrail(memoryTrail)) {
    const promptedTargetIds = new Set((memoryTrail.promptHistory || [])
      .map((entry) => entry?.targetId)
      .filter(Boolean));
    return memoryTrail.checkpointTargetQueue.length > 0
      && memoryTrail.checkpointTargetQueue.every((targetId) => promptedTargetIds.has(targetId));
  }

  if (isCompletedDailyTrailReviewMemoryTrail(memoryTrail)) {
    const promptedTargetIds = new Set((memoryTrail.promptHistory || [])
      .map((entry) => entry?.targetId)
      .filter(Boolean));
    return memoryTrail.completedTrailReviewTargetQueue.length > 0
      && memoryTrail.completedTrailReviewTargetQueue.every((targetId) => promptedTargetIds.has(targetId));
  }

  const requiredStats = getDailyTrailRequiredMemoryTrailStats(memoryTrail);

  if (requiredStats.length === 0) {
    return memoryTrail.retrievalPromptCount > 0;
  }

  if (hasDailyTrailPendingMissedNewItemRetry(memoryTrail)) {
    return false;
  }

  if (
    isDailyTrailPacingCapEnabled(memoryTrail)
    && (hasDailyTrailCurrentSectionMetExitRule(memoryTrail) || hasDailyTrailCurrentSectionHitHardCap(memoryTrail))
  ) {
    return !shouldIntroduceNewTarget(memoryTrail);
  }

  const allRequiredItemsTaught = requiredStats.every(hasTargetCompletedGuidedExposure);
  const allRequiredItemsRecalled = requiredStats.every((stats) => hasDailyTrailStatsMetRecallRequirement(stats, memoryTrail));
  const weakItemsSettled = getWeakTargets(memoryTrail).every((stats) => hasDailyTrailWeakStatsSettledForNow(stats, memoryTrail));

  return allRequiredItemsTaught
    && allRequiredItemsRecalled
    && memoryTrail.retrievalPromptCount >= requiredStats.length
    && getMemoryTrailSuccessRate(memoryTrail) >= TARGET_SUCCESS_RATE
    && weakItemsSettled;
}

function getDailyTrailRequiredMemoryTrailStats(memoryTrail) {
  const introducedStats = getIntroducedMemoryTrailStats(memoryTrail);
  const newTargetIds = new Set(memoryTrail.dailyTrailNewTargetIds || []);

  if (newTargetIds.size > 0) {
    const requiredNewStats = [...newTargetIds]
      .map((targetId) => memoryTrail.targetStats[targetId])
      .filter(Boolean);
    const weakReviewStats = getWeakTargets(memoryTrail).filter((stats) => !newTargetIds.has(stats.targetId));
    return [...requiredNewStats, ...weakReviewStats];
  }

  return introducedStats;
}

function completeMemoryTrailSession(memoryTrail) {
  memoryTrail.phase = "complete";
  memoryTrail.sessionPhase = "practice";
  memoryTrail.promptName = "";
  memoryTrail.currentPromptTargetLabel = "";
  memoryTrail.responseChipTargetId = null;
  memoryTrail.correction = null;
  memoryTrail.currentPromptTargetId = null;
  memoryTrail.currentPromptKey = "";
  memoryTrail.answerChoices = [];
  memoryTrail.message = `Great session: ${memoryTrail.correctCount} retrieval correct, ${memoryTrail.incorrectCount} to review.`;
  runner.setMemoryTrailHighlight([]);
  runner?.setMemoryTrailStudyTargetEmphasisSuppressed?.(false);
  renderStudyExplorePanel();
  if (completedMemoryTrailAnalyticsKey !== currentMemoryTrailAnalyticsKey) {
    completedMemoryTrailAnalyticsKey = currentMemoryTrailAnalyticsKey;
    trackEvent("memory_trail_completed", getMemoryTrailAnalyticsContext());
  }
  if (activeDailyTrailSession && currentAppScreen === "daily-trail-gameplay") {
    completeDailyTrailMemoryTrailSession(memoryTrail);
    return;
  }
  if (activeUnitedStatesMemoryTrailSession && currentAppScreen === "united-states-trail-gameplay") {
    completeUnitedStatesMemoryTrailSession(memoryTrail);
    return;
  }
  showMemoryTrailCompletionOverlay();
}

function completeUnitedStatesMemoryTrailSession(memoryTrail) {
  if (!activeUnitedStatesMemoryTrailSession) {
    return;
  }

  const items = getUnitedStatesMemoryTrailItems();
  const result = getDailyTrailMemoryTrailResult(memoryTrail);
  const nextState = applyUnitedStatesMemoryTrailSessionResults(
    activeUnitedStatesMemoryTrailSession.state,
    activeUnitedStatesMemoryTrailSession.plan,
    result
  );
  const savedState = saveUnitedStatesMemoryTrailProgress(nextState, items);
  lastUnitedStatesMemoryTrailSummary = savedState.lastSessionSummary;
  activeUnitedStatesMemoryTrailSession = null;
  clearMemoryTrailState({ restoreReveals: false });
  activeStudySession = null;
  runner?.setStudyPreviewMode(false);
  runner?.setMemoryTrailHighlight([]);
  runner?.setMemoryTrailStudyTargetEmphasisSuppressed?.(false);
  resetActivityAttemptState();
  showAppScreen("united-states-trail-summary", { pushHistory: false });
}

function completeDailyTrailMemoryTrailSession(memoryTrail) {
  if (!activeDailyTrailSession) {
    return;
  }

  if (activeDailyTrailSession.devReplay) {
    completeDailyTrailDevReplaySession(memoryTrail);
    return;
  }

  const result = getDailyTrailMemoryTrailResult(memoryTrail);
  if (isMixedDailyTrailCheckpointSession()) {
    mergeDailyTrailCheckpointResult(activeDailyTrailSession, result);
    if (advanceMixedDailyTrailCheckpoint()) {
      return;
    }
    finalizeDailyTrailMemoryTrailSession(activeDailyTrailSession.checkpointResult);
    return;
  }

  if (isSegmentedCompletedDailyTrailReviewSession()) {
    mergeDailyTrailCompletedReviewResult(activeDailyTrailSession, result);
    if (advanceSegmentedCompletedDailyTrailReview()) {
      return;
    }
    finalizeDailyTrailMemoryTrailSession(activeDailyTrailSession.completedReviewResult);
    return;
  }

  finalizeDailyTrailMemoryTrailSession(result);
}

function getCheckpointMemoryTrailTargetQueue(targetPool = []) {
  const targetIdsByCanonicalId = new Map();
  targetPool.filter(Boolean).forEach((target) => {
    const targetId = String(target?.id || "").trim();
    const targetKind = String(target?.kind || target?.type || "target").trim();
    const canonicalTargetId = targetId ? `${targetKind}:${targetId}` : "";
    if (canonicalTargetId && !targetIdsByCanonicalId.has(canonicalTargetId)) {
      targetIdsByCanonicalId.set(canonicalTargetId, targetId);
    }
  });
  return [...targetIdsByCanonicalId.values()];
}

function chooseNextCheckpointReviewPrompt(memoryTrail) {
  const promptedTargetIds = new Set((memoryTrail?.promptHistory || [])
    .map((entry) => entry?.targetId)
    .filter(Boolean));
  const targetId = (memoryTrail?.checkpointTargetQueue || [])
    .find((candidateTargetId) => !promptedTargetIds.has(candidateTargetId));

  return targetId ? {
    targetId,
    promptType: "name_to_place",
    mode: "checkpoint-review",
    reason: "one-pass mixed checkpoint queue"
  } : null;
}

function chooseNextCompletedDailyTrailReviewPrompt(memoryTrail) {
  const promptedTargetIds = new Set((memoryTrail?.promptHistory || [])
    .map((entry) => entry?.targetId)
    .filter(Boolean));
  const targetId = (memoryTrail?.completedTrailReviewTargetQueue || [])
    .find((candidateTargetId) => !promptedTargetIds.has(candidateTargetId));

  return targetId ? {
    targetId,
    promptType: "name_to_place",
    mode: "review",
    reason: "one-pass completed trail review"
  } : null;
}

function isMixedDailyTrailCheckpointMemoryTrail(memoryTrail = getActiveMemoryTrail()) {
  return Boolean(
    memoryTrail?.source === "daily-trail"
    && memoryTrail?.checkpointReview === true
  );
}

function isCompletedDailyTrailReviewMemoryTrail(memoryTrail = getActiveMemoryTrail()) {
  return Boolean(
    memoryTrail?.source === "daily-trail"
    && memoryTrail?.completedTrailReview === true
  );
}

function getMixedDailyTrailCheckpointCameraConfig(memoryTrail, selection = {}) {
  const activity = getActivityById(memoryTrail?.activityId || "");
  const targetId = String(selection?.targetId || memoryTrail?.currentPromptTargetId || "").trim();
  const quizCamera = activity?.map?.dailyTrailQuizCamera;
  const quizCameraMatchesTarget = targetId
    && Array.isArray(quizCamera?.targetIds)
    && quizCamera.targetIds.includes(targetId);
  const cameraSources = [
    ["dailyTrailNonLearnCamera", activity?.map?.dailyTrailNonLearnCamera],
    ["dailyTrailFixedCamera", activity?.map?.dailyTrailFixedCamera],
    ["checkpointCamera", activity?.map?.checkpointCamera],
    ["dailyTrailQuizCamera", quizCameraMatchesTarget ? quizCamera : null],
    ["regionView", activity?.map?.regionView],
    ["initialView", activity?.map?.initialView]
  ];
  const [source, configuredCamera] = cameraSources.find(([, camera]) => Boolean(camera)) || ["activity-context-fit", null];
  return {
    source,
    camera: normalizeMemoryTrailSectionQuizView(configuredCamera)
  };
}

function getMemoryTrailInstructionNoun(activity = session.currentActivity, memoryTrail = getActiveMemoryTrail()) {
  const target = getMemoryTrailActivePromptTarget(memoryTrail);
  if (isUnitedStatesMemoryTrail(memoryTrail) && target) {
    return getUnitedStatesMemoryTrailInstructionNounForTarget(target) || getInstructionNoun(activity);
  }

  if (isDailyTrailMemoryTrail(memoryTrail) && target) {
    return getInstructionNounForTarget(target) || getInstructionNoun(activity);
  }

  return getInstructionNoun(activity);
}

function getUnitedStatesMemoryTrailInstructionNounForTarget(target) {
  if (target?.type === "capital") {
    return "capital";
  }

  if (target?.type === "state" || target?.type === "federal-district") {
    return "state";
  }

  return getInstructionNounForTarget(target);
}

function getInstructionNounForTarget(target) {
  if (!target) {
    return "";
  }

  if (target.type === "capital") {
    return "capital city";
  }

  if (target.type === "country") {
    return "country";
  }

  if (target.type === "state" || target.type === "federal-district") {
    return "state";
  }

  if (target.type === "zone" || /ocean/i.test(target.name || "")) {
    return "ocean";
  }

  if (target.type === "region") {
    return "continent";
  }

  return "";
}

function getMixedDailyTrailCheckpointCamera(memoryTrail, selection = {}) {
  return getMixedDailyTrailCheckpointCameraConfig(memoryTrail, selection).camera;
}

function applyMixedDailyTrailCheckpointCamera(memoryTrail, options = {}) {
  if (!isMixedDailyTrailCheckpointMemoryTrail(memoryTrail) || typeof runner?.moveCamera !== "function") {
    return false;
  }

  const activity = getActivityById(memoryTrail.activityId);
  const checkpointCameraConfig = getMixedDailyTrailCheckpointCameraConfig(memoryTrail, options.selection);
  const checkpointCamera = checkpointCameraConfig.camera;
  const contextTargets = (activity?.targets || []).filter((target) => target?.id);
  const cameraKey = checkpointCamera
    ? `${memoryTrail.activityId}:${checkpointCamera.center.join(",")}:${checkpointCamera.zoom}`
    : `${memoryTrail.activityId}:context:${contextTargets.map((target) => target.id).join("|")}`;

  if (memoryTrail.lastCheckpointCameraKey === cameraKey) {
    return false;
  }

  let didMove = false;
  if (checkpointCamera) {
    didMove = runner.moveCamera({
      center: checkpointCamera.center,
      zoom: checkpointCamera.zoom,
      bearing: checkpointCamera.bearing,
      pitch: checkpointCamera.pitch,
      padding: checkpointCamera.padding || { top: 72, right: 72, bottom: 170, left: 72 },
      duration: Number.isFinite(Number(options.duration)) ? Number(options.duration) : 820,
      retainPadding: false,
      essential: true
    }, {
      cameraContext: "daily-trail-checkpoint-context",
      source: "daily-trail-checkpoint-context",
      requestType: "easeTo",
      activityId: memoryTrail.activityId
    }, "easeTo");
  } else if (contextTargets.length > 0 && typeof runner?.fitTargets === "function") {
    didMove = runner.fitTargets(contextTargets, {
      duration: Number.isFinite(Number(options.duration)) ? Number(options.duration) : 820,
      maxZoom: 4.1,
      padding: { top: 86, right: 86, bottom: 192, left: 86 }
    });
  }

  if (didMove) {
    memoryTrail.lastCheckpointCameraKey = cameraKey;
  }
  publishDailyTrailCheckpointRuntimeSnapshot(memoryTrail, {
    stage: "checkpoint-camera-applied",
    selectedCamera: {
      mode: checkpointCamera ? "activity-regional-camera" : "activity-context-fit",
      source: checkpointCamera ? "daily-trail-checkpoint-context" : "activity-context-fit",
      configurationSource: checkpointCameraConfig.source,
      camera: checkpointCamera
    },
    didMove
  });
  return didMove;
}

function getDailyTrailMemoryTrailResult(memoryTrail) {
  const targetStats = Object.values(memoryTrail?.targetStats || {});
  const completedTargetIds = [...new Set((memoryTrail?.promptHistory || [])
    .filter((entry) => entry.result === "correct" && entry.guided !== true)
    .map((entry) => entry.targetId)
    .filter(Boolean))];
  const taughtTargetIds = [...new Set([
    ...(memoryTrail?.introducedTargetIds || []),
    ...completedTargetIds
  ].filter(Boolean))];
  const missedTargetIds = new Set((memoryTrail?.promptHistory || [])
    .filter((entry) => entry.result === "incorrect")
    .map((entry) => entry.targetId)
    .filter(Boolean));
  const missesByTargetId = Object.fromEntries(
    targetStats
      .filter((stats) => missedTargetIds.has(stats.targetId) && (stats.totalRetrievalIncorrect || 0) > 0)
      .map((stats) => [stats.targetId, stats.totalRetrievalIncorrect])
  );
  const retriedNewTargetIds = [...new Set(memoryTrail?.dailyTrailRetriedNewTargetIds || [])].filter(Boolean);

  return {
    completedTargetIds,
    taughtTargetIds,
    correctCount: memoryTrail.correctCount,
    incorrectCount: memoryTrail.incorrectCount,
    missesByTargetId,
    retriedNewTargetIds,
    missedNewRetryCount: retriedNewTargetIds.length,
    slowCorrectMsByTargetId: { ...(memoryTrail?.slowCorrectMsByTargetId || {}) }
  };
}

function isMixedDailyTrailCheckpointSession() {
  return Boolean(
    activeDailyTrailSession?.plan?.checkpointMixedReview
    && activeDailyTrailSession?.checkpointActivityGroups?.length > 1
  );
}

function isSegmentedCompletedDailyTrailReviewSession() {
  return Boolean(
    isSegmentedCompletedDailyTrailReviewPlan(activeDailyTrailSession?.plan)
    && activeDailyTrailSession?.completedReviewActivityGroups?.length > 1
  );
}

function mergeDailyTrailCheckpointResult(dailyTrailSession, result) {
  const aggregate = dailyTrailSession.checkpointResult || {
    completedTargetIds: new Set(),
    taughtTargetIds: new Set(),
    correctCount: 0,
    incorrectCount: 0,
    missesByTargetId: {},
    retriedNewTargetIds: new Set(),
    missedNewRetryCount: 0
  };

  result.completedTargetIds.forEach((targetId) => aggregate.completedTargetIds.add(targetId));
  result.taughtTargetIds.forEach((targetId) => aggregate.taughtTargetIds.add(targetId));
  aggregate.correctCount += result.correctCount;
  aggregate.incorrectCount += result.incorrectCount;
  (result.retriedNewTargetIds || []).forEach((targetId) => aggregate.retriedNewTargetIds.add(targetId));
  aggregate.missedNewRetryCount = aggregate.retriedNewTargetIds.size;
  Object.entries(result.missesByTargetId).forEach(([targetId, missCount]) => {
    aggregate.missesByTargetId[targetId] = (aggregate.missesByTargetId[targetId] || 0) + missCount;
  });
  dailyTrailSession.checkpointResult = aggregate;
}

function advanceMixedDailyTrailCheckpoint() {
  const dailyTrailSession = activeDailyTrailSession;
  const nextIndex = (dailyTrailSession?.checkpointActivityIndex || 0) + 1;
  const nextGroup = dailyTrailSession?.checkpointActivityGroups?.[nextIndex];

  if (!dailyTrailSession || !nextGroup?.homeActivityId) {
    return false;
  }

  const previousActivityId = dailyTrailSession.activityId;
  dailyTrailSession.checkpointActivityIndex = nextIndex;
  dailyTrailSession.activityId = nextGroup.homeActivityId;
  dailyTrailSession.checkpointTransitionInProgress = true;
  void startDailyTrailActivity(nextGroup.homeActivityId, { previousActivityId })
    .catch(() => showFeedback("Checkpoint transition could not start."))
    .finally(() => {
      if (activeDailyTrailSession === dailyTrailSession) {
        dailyTrailSession.checkpointTransitionInProgress = false;
      }
  });
  return true;
}

function getMonotonicNowMs() {
  return typeof performance !== "undefined" && typeof performance.now === "function"
    ? performance.now()
    : Date.now();
}

function mergeDailyTrailCompletedReviewResult(dailyTrailSession, result) {
  const aggregate = dailyTrailSession.completedReviewResult || {
    completedTargetIds: new Set(),
    taughtTargetIds: new Set(),
    correctCount: 0,
    incorrectCount: 0,
    missesByTargetId: {},
    retriedNewTargetIds: new Set(),
    missedNewRetryCount: 0
  };

  result.completedTargetIds.forEach((targetId) => aggregate.completedTargetIds.add(targetId));
  result.taughtTargetIds.forEach((targetId) => aggregate.taughtTargetIds.add(targetId));
  aggregate.correctCount += result.correctCount;
  aggregate.incorrectCount += result.incorrectCount;
  (result.retriedNewTargetIds || []).forEach((targetId) => aggregate.retriedNewTargetIds.add(targetId));
  aggregate.missedNewRetryCount = aggregate.retriedNewTargetIds.size;
  Object.entries(result.missesByTargetId).forEach(([targetId, missCount]) => {
    aggregate.missesByTargetId[targetId] = (aggregate.missesByTargetId[targetId] || 0) + missCount;
  });
  dailyTrailSession.completedReviewResult = aggregate;
}

function advanceSegmentedCompletedDailyTrailReview() {
  const dailyTrailSession = activeDailyTrailSession;
  const nextIndex = (dailyTrailSession?.completedReviewActivityIndex || 0) + 1;
  const nextGroup = dailyTrailSession?.completedReviewActivityGroups?.[nextIndex];

  if (!dailyTrailSession || !nextGroup?.homeActivityId) {
    return false;
  }

  const previousActivityId = dailyTrailSession.activityId;
  dailyTrailSession.completedReviewActivityIndex = nextIndex;
  dailyTrailSession.activityId = nextGroup.homeActivityId;
  void startDailyTrailActivity(nextGroup.homeActivityId, { previousActivityId })
    .catch(() => showFeedback("Daily Trail review could not continue."));
  return true;
}

function getDailyTrailSegmentCompleteMessage(plan = {}, summary = {}) {
  const newCount = Math.max(0, Number(summary.newCount ?? plan?.newItems?.length) || 0);
  if (
    summary?.trailCompleted
    || plan?.sessionType !== "learning-session"
    || plan?.continentsOceansReviewType
    || newCount <= 0
  ) {
    return "";
  }

  return `${newCount} new ${newCount === 1 ? "place" : "places"} learned`;
}

function finalizeDailyTrailMemoryTrailSession(result) {
  if (!activeDailyTrailSession) {
    return;
  }

  const completedPlan = activeDailyTrailSession.plan;
  let nextState = activeDailyTrailSession.state;
  result.taughtTargetIds.forEach((targetId) => {
    nextState = applyDailyTrailTeachingProgress(nextState, completedPlan, targetId);
  });

  nextState = applyDailyTrailSessionResults(nextState, completedPlan, {
    completedTargetIds: [...result.completedTargetIds],
    correctCount: result.correctCount,
    incorrectCount: result.incorrectCount,
    missesByTargetId: result.missesByTargetId,
    slowCorrectMsByTargetId: result.slowCorrectMsByTargetId
  });

  lastDailyTrailSummary = nextState.lastSessionSummary;
  const segmentCompleteMessage = getDailyTrailSegmentCompleteMessage(completedPlan, lastDailyTrailSummary);
  activeDailyTrailSession = null;
  activeStudySession = null;
  runner.setStudyPreviewMode(false);
  runner.setMemoryTrailHighlight([]);
  runner.setCompletedTargets([]);
  hideMemoryTrailOverlay();
  showAppScreen("daily-trail-summary", { pushHistory: false });
  if (segmentCompleteMessage) {
    showFeedback(segmentCompleteMessage, true);
  }
}

function scheduleDailyTrailTargetLearnCamera(memoryTrail, selection, target) {
  const camera = normalizeMemoryTrailSectionQuizView(target?.learnCamera);
  if (
    memoryTrail?.source !== "daily-trail"
    || isMixedDailyTrailCheckpointMemoryTrail(memoryTrail)
    || selection?.promptType !== "guided"
    || memoryTrail?.sessionPhase !== "learn"
    || memoryTrail.currentPromptTargetId !== selection?.targetId
    || !target
  ) {
    recordCameraDevTraceEvent({
      eventType: "daily-trail-learn-camera",
      status: "skipped",
      reason: "not current Daily Trail guided Learn target",
      activityId: memoryTrail?.activityId || session?.currentActivity?.id || "",
      targetId: selection?.targetId || target?.id || "",
      targetLabel: target?.name || target?.label || "",
      cameraContext: target?.learnCamera?.cameraContext || "learn-target-focus",
      cameraSource: target?.learnCamera?.source || "daily-trail-target-learn-camera"
    });
    return Promise.resolve(false);
  }

  if (camera && typeof runner?.moveCamera === "function") {
    const promptKey = memoryTrail.currentPromptKey;
    const duration = camera.duration || 720;
    const source = target.learnCamera?.source || "daily-trail-target-learn-camera";
    runner.suppressStudyIntroCameraOnce?.(source, 5000);
    const didMove = runner.moveCamera({
        center: camera.center,
        zoom: camera.zoom,
        bearing: camera.bearing,
        pitch: camera.pitch,
        padding: camera.padding || { top: 0, right: 0, bottom: 0, left: 0 },
        duration,
        essential: true
      }, {
        cameraContext: target.learnCamera?.cameraContext || "learn-target-focus",
        source: target.learnCamera?.source || "daily-trail-target-learn-camera",
        requestType: "flyTo",
        activityId: memoryTrail.activityId,
        targetId: target.id,
        targetLabel: target.name || ""
      }, "flyTo");

    if (!didMove) {
      recordCameraDevTraceEvent({
        eventType: "daily-trail-learn-camera",
        status: "skipped",
        reason: "explicit Learn camera request was not applied",
        activityId: memoryTrail.activityId,
        targetId: target.id,
        targetLabel: target.name || "",
        cameraContext: target.learnCamera?.cameraContext || "learn-target-focus",
        cameraSource: source,
        requestedCamera: {
          center: camera.center,
          zoom: camera.zoom,
          bearing: camera.bearing,
          pitch: camera.pitch,
          padding: camera.padding || { top: 0, right: 0, bottom: 0, left: 0 },
          duration
        }
      });
      return Promise.resolve(false);
    }

    // MapLibre completion events can be preempted by a later camera request. A
    // bounded settle delay guarantees target narration never gets ahead of this
    // Learn fly-to while keeping the prompt resilient to those interruptions.
    return new Promise((resolve) => {
      const timeoutId = window.setTimeout(() => {
        const promptIsStillCurrent = isCurrentMemoryTrailState(memoryTrail)
          && memoryTrail.currentPromptKey === promptKey
          && memoryTrail.currentPromptTargetId === selection.targetId
          && memoryTrail.currentPromptType === "guided"
          && memoryTrail.sessionPhase === "learn";
        resolve(promptIsStillCurrent);
      }, duration + 100);
      memoryTrail.timers.push(timeoutId);
    });
  }

  if (
    !isGenericMobileDailyTrailLearnTarget(memoryTrail, selection, target)
    || typeof runner?.fitTargets !== "function"
  ) {
    recordCameraDevTraceEvent({
      eventType: "daily-trail-mobile-learn-camera",
      status: "skipped",
      reason: typeof runner?.fitTargets !== "function" ? "runner fitTargets unavailable" : "not a generic mobile Daily Trail Learn target",
      activityId: memoryTrail.activityId,
      targetId: target.id,
      targetLabel: target.name || "",
      cameraContext: "learn-target-focus",
      cameraSource: "daily-trail-mobile-learn-fit"
    });
    return Promise.resolve(false);
  }

  const mobileCamera = getDailyTrailMobileLearnCameraOverride(target);
  const padding = getMobileDailyTrailLearnFitPadding();
  const cameraKey = getDailyTrailMobileLearnCameraKey(memoryTrail, target, padding, mobileCamera);
  if (memoryTrail.lastDailyTrailMobileLearnCameraKey === cameraKey) {
    recordCameraDevTraceEvent({
      eventType: "daily-trail-mobile-learn-camera",
      status: "skipped",
      reason: "duplicate mobile Learn camera key",
      activityId: memoryTrail.activityId,
      targetId: target.id,
      targetLabel: target.name || "",
      cameraContext: mobileCamera?.cameraContext || "learn-target-focus",
      cameraSource: mobileCamera?.source || "daily-trail-mobile-learn-fit",
      padding
    });
    return Promise.resolve(false);
  }

  const promptKey = memoryTrail.currentPromptKey;
  const duration = mobileCamera?.duration || 720;
  const cameraContext = mobileCamera?.cameraContext || "learn-target-focus";
  const source = mobileCamera?.source || "daily-trail-mobile-learn-fit";
  runner.suppressStudyIntroCameraOnce?.(source, 5000);
  const didMove = mobileCamera && typeof runner?.moveCamera === "function"
    ? runner.moveCamera({
      center: mobileCamera.center,
      zoom: mobileCamera.zoom,
      bearing: mobileCamera.bearing,
      pitch: mobileCamera.pitch,
      padding: mobileCamera.padding || { top: 0, right: 0, bottom: 0, left: 0 },
      duration,
      essential: true
    }, {
      cameraContext,
      source,
      requestType: "flyTo",
      activityId: memoryTrail.activityId,
      targetId: target.id,
      targetLabel: target.name || ""
    }, "flyTo")
    : runner.fitTargets([target], {
      padding,
      maxZoom: 7.25,
      duration,
      cameraContext,
      source,
      skipCameraDevOverride: false
    });

  if (!didMove) {
    return Promise.resolve(false);
  }

  memoryTrail.lastDailyTrailMobileLearnCameraKey = cameraKey;
  memoryTrail.lastDailyTrailMobileLearnCameraPromptKey = promptKey;
  memoryTrail.lastDailyTrailMobileLearnCameraTargetId = target.id;
  debugMemoryTrail("daily trail mobile learn camera", {
    targetId: target.id,
    targetName: target.name,
    source,
    cameraContext,
    padding,
    explicitMobileOverride: Boolean(mobileCamera)
  });

  return new Promise((resolve) => {
    const timeoutId = window.setTimeout(() => {
      const promptIsStillCurrent = isCurrentMemoryTrailState(memoryTrail)
        && memoryTrail.currentPromptKey === promptKey
        && memoryTrail.currentPromptTargetId === selection.targetId
        && memoryTrail.currentPromptType === "guided"
        && memoryTrail.sessionPhase === "learn";
      resolve(promptIsStillCurrent);
    }, duration + 100);
    memoryTrail.timers.push(timeoutId);
  });
}

function completeDailyTrailDevReplaySession(memoryTrail) {
  lastDailyTrailSummary = {
    sessionType: "daily-trail-dev-replay",
    practicedCount: new Set((memoryTrail?.promptHistory || []).map((entry) => entry.targetId).filter(Boolean)).size,
    newCount: 0,
    reviewCount: 0,
    weakItems: [],
    sessionsUntilNextCheckpoint: 0
  };
  activeDailyTrailSession = null;
  activeStudySession = null;
  runner.setStudyPreviewMode(false);
  runner.setMemoryTrailHighlight([]);
  runner.setCompletedTargets([]);
  hideMemoryTrailOverlay();
  showAppScreen("daily-trail-summary", { pushHistory: false });
}

function getMemoryTrailElapsedSeconds(memoryTrail) {
  return Math.max(0, Math.floor((Date.now() - memoryTrail.startedAt) / 1000));
}

function getMemoryTrailSuccessRate(memoryTrail) {
  return memoryTrail.retrievalPromptCount > 0 ? memoryTrail.correctCount / memoryTrail.retrievalPromptCount : 1;
}

function getMemoryTrailSessionStats(memoryTrail = getActiveMemoryTrail()) {
  if (!memoryTrail) {
    return null;
  }

  return {
    startedAt: memoryTrail.startedAt,
    elapsedSeconds: getMemoryTrailElapsedSeconds(memoryTrail),
    sessionPhase: memoryTrail.sessionPhase,
    currentPromptType: memoryTrail.currentPromptType,
    promptCount: memoryTrail.promptCount,
    retrievalPromptCount: memoryTrail.retrievalPromptCount,
    correctCount: memoryTrail.correctCount,
    incorrectCount: memoryTrail.incorrectCount,
    recentResults: [...memoryTrail.recentResults],
    recentRetrievalResults: [...memoryTrail.recentRetrievalResults],
    currentPracticeWindow: memoryTrail.currentPracticeWindow.map((target) => target.id),
    introducedTargets: [...memoryTrail.introducedTargetIds],
    weakTargets: getWeakTargets(memoryTrail).map((stats) => stats.targetId),
    sessionLearnedTargets: getIntroducedMemoryTrailStats(memoryTrail)
      .filter((stats) => stats.isSessionLearned)
      .map((stats) => stats.targetId),
    sessionSuccessRate: getMemoryTrailSuccessRate(memoryTrail),
    accuracy: getMemoryTrailAccuracySummary(memoryTrail),
    targetStats: memoryTrail.targetStats
  };
}

function fitMapToPracticeWindow(targets = [], reason = "practice-window") {
  if (!targets.length || !runner?.fitTargets) {
    return false;
  }

  const memoryTrail = getActiveMemoryTrail();
  if (isMixedDailyTrailCheckpointMemoryTrail(memoryTrail)) {
    return applyMixedDailyTrailCheckpointCamera(memoryTrail, { duration: 820 });
  }
  if (getActiveDailyTrailFixedCamera(memoryTrail) || getActiveDailyTrailNonLearnCamera(memoryTrail)) {
    return applyMemoryTrailSectionQuizCamera(memoryTrail, { promptType: "fixed-camera" }, { duration: 260 });
  }
  const windowKey = targets.map((target) => target.id).join("|");
  if (memoryTrail && memoryTrail.lastCameraWindowKey === windowKey) {
    return false;
  }

  if (shouldSuppressContinentsOceansLearnWindowFit(memoryTrail, reason)) {
    debugContinentsOceansLearnCamera("section window fit suppressed", {
      source: "fitMapToPracticeWindow",
      requestType: "fitBounds",
      reason,
      targetIds: targets.map((target) => target.id)
    }, memoryTrail);
    return false;
  }

  const didFit = runner.fitTargets(targets, {
    duration: 850,
    maxZoom: targets.length <= 3 ? 5.75 : 5.35,
    cameraContext: reason,
    source: "fitMapToPracticeWindow"
  });

  if (didFit && memoryTrail) {
    memoryTrail.lastCameraWindowKey = windowKey;
  }

  debugMemoryTrail("fit practice window", {
    reason,
    targetIds: targets.map((target) => target.id),
    didFit
  });
  return didFit;
}

function shouldSuppressContinentsOceansLearnWindowFit(memoryTrail, reason = "") {
  return Boolean(
    memoryTrail?.activityId === continentsOceansActivityId
    && (reason === "start" || reason === "advance")
  );
}

function debugMemoryTrail(label, details = {}) {
  if (!ENABLE_MEMORY_TRAIL_DEBUG) {
    return;
  }

  console.debug("[memory-trail]", label, details);
}

function logDailyTrailRuntimeDebug(eventName, details = {}) {
  if (!ENABLE_DAILY_TRAIL_DEBUG || typeof console === "undefined") {
    return;
  }

  console.log(`[DailyTrail] ${eventName}`, details);
}

function createDailyTrailPromptSelectedDebug(memoryTrail, selection = {}, stats = null) {
  const targetId = selection.targetId || memoryTrail?.currentPromptTargetId || "";
  const targetStats = stats || memoryTrail?.targetStats?.[targetId] || {};
  const newTargetIds = new Set(memoryTrail?.dailyTrailNewTargetIds || []);
  return {
    targetId,
    reason: getDailyTrailPromptDebugReason(memoryTrail, selection, targetStats),
    promptType: selection.promptType || memoryTrail?.currentPromptType || "",
    promptMode: selection.mode || memoryTrail?.currentPromptMode || "",
    practiceWindowIds: (memoryTrail?.currentPracticeWindow || []).map((target) => target?.id).filter(Boolean),
    isNew: newTargetIds.has(targetId),
    isReview: !newTargetIds.has(targetId),
    retrievalCorrect: Math.max(0, Number(targetStats.totalRetrievalCorrect) || 0),
    retrievalIncorrect: Math.max(0, Number(targetStats.totalRetrievalIncorrect) || 0)
  };
}

function getDailyTrailPromptDebugReason(memoryTrail, selection = {}, stats = {}) {
  if (isMixedDailyTrailCheckpointMemoryTrail(memoryTrail)) {
    return activeDailyTrailSession?.plan?.sessionType === "remediationCheckpoint"
      ? DAILY_TRAIL_DEBUG_REASONS.CHECKPOINT_REMEDIATION
      : DAILY_TRAIL_DEBUG_REASONS.CHECKPOINT;
  }

  if (isCompletedDailyTrailReviewMemoryTrail(memoryTrail)) {
    return DAILY_TRAIL_DEBUG_REASONS.TERMINAL_REVIEW;
  }

  const reasonText = String(selection.reason || "").toLowerCase();
  if (reasonText.includes("missed new item retry")) {
    return DAILY_TRAIL_DEBUG_REASONS.MISSED_NEW_RETRY;
  }

  if (selection.promptType === "guided" || selection.mode === "learn") {
    return memoryTrail?.activityId === continentsOceansActivityId
      ? DAILY_TRAIL_DEBUG_REASONS.CO_FOUNDATION
      : DAILY_TRAIL_DEBUG_REASONS.NEW;
  }

  if (selection.mode === "weak-review" || stats?.isWeak || (stats?.totalRetrievalIncorrect || 0) > 0) {
    return DAILY_TRAIL_DEBUG_REASONS.WEAK_REVIEW;
  }

  if (selection.mode === "review" || reasonText.includes("review")) {
    return memoryTrail?.activityId === continentsOceansActivityId
      ? DAILY_TRAIL_DEBUG_REASONS.CO_REVIEW
      : DAILY_TRAIL_DEBUG_REASONS.RECENT_REVIEW;
  }

  if (memoryTrail?.dailyTrailNewTargetIds?.includes(selection.targetId)) {
    return DAILY_TRAIL_DEBUG_REASONS.NEW;
  }

  return DAILY_TRAIL_DEBUG_REASONS.UNKNOWN;
}

function updateMemoryTrailDebugObject(memoryTrail = getActiveMemoryTrail()) {
  if (!ENABLE_MEMORY_TRAIL_DEBUG || typeof window === "undefined") {
    return;
  }

  window.mappaMemoryTrailDebug = {
    getStats: () => getMemoryTrailSessionStats(memoryTrail),
    forceNextPracticeWindow: () => {
      if (!memoryTrail || memoryTrail.currentWindowIndex >= memoryTrail.practiceWindows.length - 1) {
        return null;
      }
      memoryTrail.currentWindowIndex += 1;
      introducePracticeWindow(memoryTrail, memoryTrail.practiceWindows[memoryTrail.currentWindowIndex]);
      fitMapToPracticeWindow(memoryTrail.currentPracticeWindow, "debug-force");
      return memoryTrail.currentPracticeWindow.map((target) => target.id);
    },
    clearSessionStats: () => {
      if (!memoryTrail) {
        return null;
      }
      Object.values(memoryTrail.targetStats).forEach((stats) => {
        Object.assign(stats, createMemoryTrailTargetStats({ id: stats.targetId, name: stats.displayName }));
      });
      memoryTrail.promptCount = 0;
      memoryTrail.retrievalPromptCount = 0;
      memoryTrail.correctCount = 0;
      memoryTrail.incorrectCount = 0;
      memoryTrail.recentResults = [];
      memoryTrail.recentRetrievalResults = [];
      memoryTrail.promptHistory = [];
      return getMemoryTrailSessionStats(memoryTrail);
    },
    printWeakTargets: () => getWeakTargets(memoryTrail).map((stats) => ({ ...stats })),
    printPromptHistory: () => [...(memoryTrail?.promptHistory || [])]
  };
}

function getMemoryTrailClickDebugContext(memoryTrail, clickedTargetIds = [], extra = {}) {
  return {
    promptType: memoryTrail?.currentPromptType || "",
    phase: memoryTrail?.sessionPhase || "",
    interactionPhase: memoryTrail?.phase || "",
    correction: memoryTrail?.correction || null,
    clickedTargetIds,
    expectedTargetId: memoryTrail?.currentPromptTargetId || "",
    selectedTargetId: session?.selectedId || "",
    highlightedTargetId: memoryTrail?.responseChipTargetId || memoryTrail?.currentPromptTargetId || "",
    mapState: runner?.getMapInteractionState?.() || null,
    ...extra
  };
}

function handleMemoryTrailTargetTap(targetIds, mapPoint = null) {
  const memoryTrail = getActiveMemoryTrail();
  const candidateIds = Array.isArray(targetIds)
    ? targetIds
    : [targetIds].filter(Boolean);
  recordOldReviewOutlineDebugVisualTrace("map-tap-received", { candidateIds });

  if (!memoryTrail) {
    debugMemoryTrail("map click ignored", {
      clickedTargetIds: candidateIds,
      reason: "no active memory trail",
      mapState: runner?.getMapInteractionState?.() || null
    });
    return;
  }

  if (memoryTrail.phase === "correction") {
    handleMemoryTrailCorrectionTap(memoryTrail, candidateIds, mapPoint);
    return;
  }

  if (candidateIds.length > 0 || mapPoint) {
    clearMemoryTrailTrayFeedback(memoryTrail, "map selection");
  }

  if (memoryTrail.phase === "playing") {
    debugMemoryTrail("map click ignored", getMemoryTrailClickDebugContext(memoryTrail, candidateIds, {
      reason: "prompt is not accepting answers yet"
    }));
    return;
  }

  if (memoryTrail.phase !== "answering") {
    debugMemoryTrail("map click ignored", getMemoryTrailClickDebugContext(memoryTrail, candidateIds, {
      reason: "memory trail is not in answering state"
    }));
    return;
  }

  if (isPlaceToNameMemoryTrailPrompt(memoryTrail)) {
    memoryTrail.message = `Choose the matching ${getInstructionNoun()} from the chips.`;
    debugMemoryTrail("map click ignored", getMemoryTrailClickDebugContext(memoryTrail, candidateIds, {
      reason: "place-to-name prompt expects an answer chip"
    }));
    renderStudyExplorePanel();
    return;
  }

  const expectedTargetId = memoryTrail.currentPromptTargetId;

  if (candidateIds.includes(expectedTargetId)) {
    debugMemoryTrail("map click accepted", getMemoryTrailClickDebugContext(memoryTrail, candidateIds, {
      result: "correct"
    }));
    recordOldReviewOutlineDebugVisualTrace("map-tap-correct", { candidateIds, expectedTargetId });
    handleCorrectMemoryTrailAnswer(memoryTrail, expectedTargetId);
  } else if (runner?.isTargetNearMapPoint?.(expectedTargetId, mapPoint)) {
    debugMemoryTrail("map click accepted", getMemoryTrailClickDebugContext(memoryTrail, candidateIds, {
      result: "near-miss"
    }));
    recordOldReviewOutlineDebugVisualTrace("map-tap-near-miss", { candidateIds, expectedTargetId });
    handleIncorrectMemoryTrailAnswer(memoryTrail, expectedTargetId, {
      nearMiss: true,
      selectedTargetId: candidateIds[0] || ""
    });
  } else {
    debugMemoryTrail("map click accepted", getMemoryTrailClickDebugContext(memoryTrail, candidateIds, {
      result: "incorrect"
    }));
    recordOldReviewOutlineDebugVisualTrace("map-tap-incorrect", { candidateIds, expectedTargetId });
    handleIncorrectMemoryTrailAnswer(memoryTrail, expectedTargetId, {
      selectedTargetId: candidateIds[0] || ""
    });
  }
}

function handleMemoryTrailNameChoice(targetId, options = {}) {
  const memoryTrail = getActiveMemoryTrail();

  if (!memoryTrail || memoryTrail.phase !== "answering" || !isPlaceToNameMemoryTrailPrompt(memoryTrail)) {
    return;
  }

  if (
    (options.promptKey && options.promptKey !== memoryTrail.currentPromptKey)
    || (options.promptTargetId && options.promptTargetId !== memoryTrail.currentPromptTargetId)
  ) {
    debugMemoryTrail("stale answer chip ignored", {
      selectedTargetId: targetId,
      chipPromptKey: options.promptKey || "",
      activePromptKey: memoryTrail.currentPromptKey || "",
      chipPromptTargetId: options.promptTargetId || "",
      activePromptTargetId: memoryTrail.currentPromptTargetId || ""
    });
    renderStudyExplorePanel();
    return;
  }

  clearMemoryTrailTrayFeedback(memoryTrail, "answer chip selection");

  const answerCameFromSpeaker = options.fromSpeaker === true;

  if (targetId === memoryTrail.currentPromptTargetId) {
    handleCorrectMemoryTrailAnswer(memoryTrail, targetId, {
      suppressTargetSpeech: answerCameFromSpeaker
    });
  } else {
    handleIncorrectMemoryTrailAnswer(memoryTrail, memoryTrail.currentPromptTargetId, {
      selectedTargetId: targetId
    });
  }
}

function handleMemoryTrailCorrectionTap(memoryTrail, candidateIds = [], mapPoint = null) {
  const expectedTargetId = memoryTrail?.correction?.expectedTargetId || memoryTrail?.currentPromptTargetId;
  if (!expectedTargetId) {
    return;
  }

  if (candidateIds.includes(expectedTargetId)) {
    debugMemoryTrail("correction tap accepted", getMemoryTrailClickDebugContext(memoryTrail, candidateIds, {
      result: "correction-complete"
    }));
    completeMemoryTrailCorrection(memoryTrail, expectedTargetId);
    return;
  }

  const selectedTargetId = candidateIds[0] || memoryTrail.correction?.selectedTargetId || "";
  memoryTrail.correction = {
    ...(memoryTrail.correction || {}),
    expectedTargetId,
    selectedTargetId,
    updatedAt: Date.now()
  };
  memoryTrail.message = "Not quite. Tap the correct place to continue.";
  memoryTrail.responseChipTargetId = expectedTargetId;
  setMemoryTrailTrayFeedback(memoryTrail, createMemoryTrailCorrectionFeedback(memoryTrail, expectedTargetId, { selectedTargetId }));
  runner.setMemoryTrailCorrectionHighlight({
    correctTargetId: expectedTargetId,
    wrongTargetId: selectedTargetId
  });
  debugMemoryTrail("correction tap rejected", getMemoryTrailClickDebugContext(memoryTrail, candidateIds, {
    reason: "still waiting for correct target",
    mapPoint
  }));
  renderStudyExplorePanel();
  persistActiveUnitedStatesMemoryTrailSnapshot(memoryTrail, "correction");
}

function completeMemoryTrailCorrection(memoryTrail, expectedTargetId) {
  clearMemoryTrailTrayFeedback(memoryTrail, "correction complete");
  const stats = memoryTrail.targetStats?.[expectedTargetId];
  if (stats) {
    stats.lastPromptedAt = memoryTrail.promptCount;
    stats.nextDuePrompt = Math.max(stats.nextDuePrompt || 0, memoryTrail.promptCount + MIN_GAP_AFTER_MISS);
  }
  memoryTrail.phase = "feedback";
  memoryTrail.correction = null;
  memoryTrail.responseChipTargetId = expectedTargetId;
  memoryTrail.answerChoices = [];
  memoryTrail.promptName = getMemoryTrailTargetLabel(expectedTargetId);
  memoryTrail.message = "Good. That's the correct place.";
  runner.setMemoryTrailCorrectionHighlight({
    correctTargetId: expectedTargetId,
    wrongTargetId: ""
  });
  showFeedback(memoryTrail.message, true);
  renderStudyExplorePanel();
  persistActiveUnitedStatesMemoryTrailSnapshot(memoryTrail, "feedback");

  scheduleMemoryTrailStep(memoryTrail, () => {
    runner.setMemoryTrailHighlight([]);
    promptNextMemoryTrailTarget(memoryTrail);
  }, memoryTrailCorrectPauseMs);
}

function getDailyTrailCorrectResponseElapsedMs(memoryTrail, targetId) {
  if (
    !memoryTrail
    || memoryTrail.phase !== "answering"
    || memoryTrail.currentPromptTargetId !== targetId
    || !Number.isFinite(Number(memoryTrail.currentPromptStartedAtMs))
  ) {
    return null;
  }

  return Math.max(0, getMonotonicNowMs() - Number(memoryTrail.currentPromptStartedAtMs));
}

function shouldRecordDailyTrailSlowCorrect(memoryTrail, targetId, elapsedMs) {
  return Boolean(
    isDailyTrailMemoryTrail(memoryTrail)
    && !isMixedDailyTrailCheckpointMemoryTrail(memoryTrail)
    && !isCompletedDailyTrailReviewMemoryTrail(memoryTrail)
    && targetId
    && memoryTrail?.targetStats?.[targetId]
    && memoryTrail.currentPromptType !== "guided"
    && memoryTrail.currentPromptMode !== "learn"
    && Number.isFinite(Number(elapsedMs))
    && elapsedMs >= DAILY_TRAIL_SLOW_CORRECT_MS
    && elapsedMs < DAILY_TRAIL_AFK_RESPONSE_MS
  );
}

function recordDailyTrailSlowCorrect(memoryTrail, targetId, elapsedMs) {
  if (!shouldRecordDailyTrailSlowCorrect(memoryTrail, targetId, elapsedMs)) {
    return false;
  }

  const roundedElapsedMs = Math.max(0, Math.round(elapsedMs));
  memoryTrail.slowCorrectMsByTargetId ||= {};
  memoryTrail.slowCorrectMsByTargetId[targetId] = Math.max(
    Number(memoryTrail.slowCorrectMsByTargetId[targetId]) || 0,
    roundedElapsedMs
  );
  const lastHistory = memoryTrail.promptHistory.at(-1);
  if (lastHistory && lastHistory.targetId === targetId && lastHistory.promptKey === memoryTrail.currentPromptKey) {
    lastHistory.slowCorrectMs = roundedElapsedMs;
  }
  return true;
}

function showDailyTrailCorrectAnswerSuccessVisual(memoryTrail, targetId) {
  if (
    !isDailyTrailMemoryTrail(memoryTrail)
    || isCompletedDailyTrailReviewMemoryTrail(memoryTrail)
    || !targetId
  ) {
    return false;
  }

  runner.setMemoryTrailCorrectionHighlight({
    correctTargetId: targetId,
    wrongTargetId: ""
  });
  return true;
}

function getMemoryTrailCorrectAnswerPauseMs(memoryTrail) {
  return isDailyTrailMemoryTrail(memoryTrail)
    && !isGuidedMemoryTrailPrompt(memoryTrail)
    && !isMixedDailyTrailCheckpointMemoryTrail(memoryTrail)
    && !isCompletedDailyTrailReviewMemoryTrail(memoryTrail)
    ? dailyTrailRetrievalCorrectPauseMs
    : memoryTrailCorrectPauseMs;
}

function handleCorrectMemoryTrailAnswer(memoryTrail, targetId, options = {}) {
  recordOldReviewOutlineDebugVisualTrace("correct-answer:start", { targetId });
  clearMemoryTrailTrayFeedback(memoryTrail, "correct answer");
  const responseElapsedMs = getDailyTrailCorrectResponseElapsedMs(memoryTrail, targetId);
  const isSlowCorrect = options.devSkip ? false : recordDailyTrailSlowCorrect(memoryTrail, targetId, responseElapsedMs);
  const stats = memoryTrail.targetStats?.[targetId];
  if (options.devSkip && isGuidedMemoryTrailPrompt(memoryTrail) && stats) {
    stats.exposedCount = Math.max(stats.exposedCount || 0, 1);
  }
  memoryTrail.responseChipTargetId = targetId;
  recordOldReviewOutlineDebugVisualTrace("correct-answer:suppression-preserved", { targetId });
  runner.setMemoryTrailHighlight(targetId);
  recordOldReviewOutlineDebugVisualTrace("correct-answer:after-set-highlight", { targetId });
  updateMemoryTrailStats(memoryTrail, targetId, "correct", { promptType: memoryTrail.currentPromptType });
  recordOldReviewOutlineDebugVisualTrace("correct-answer:after-update-stats", { targetId });
  refreshDailyTrailCapitalProgressMarkers(memoryTrail);
  lockDailyTrailFixedCameraAfterLearn(memoryTrail, targetId);

  if (options.devSkip) {
    const lastHistory = memoryTrail.promptHistory.at(-1);
    if (lastHistory) {
      lastHistory.devSkipped = true;
    }
    memoryTrail.phase = "feedback";
    memoryTrail.answerChoices = [];
    memoryTrail.promptName = getMemoryTrailTargetLabel(targetId);
    memoryTrail.message = "Dev prompt complete.";
    runner.setMemoryTrailHighlight([]);
    advanceMemoryTrailAfterDevCompletion(memoryTrail);
    return;
  }

  showFeedback("Yes.", true);
  showDailyTrailCorrectAnswerSuccessVisual(memoryTrail, targetId);
  recordOldReviewOutlineDebugVisualTrace("correct-answer:after-success-visual", { targetId });

  memoryTrail.phase = "feedback";
  memoryTrail.answerChoices = [];
  memoryTrail.promptName = getMemoryTrailTargetLabel(targetId);
  memoryTrail.message = isGuidedMemoryTrailPrompt(memoryTrail)
    ? "Good. Now you have seen this one."
    : "Nice. Keep going.";
  renderStudyExplorePanel();

  scheduleMemoryTrailStep(memoryTrail, () => {
    recordOldReviewOutlineDebugVisualTrace("correct-answer:scheduled-step-start", { targetId });
    runner.setMemoryTrailHighlight([]);
    recordOldReviewOutlineDebugVisualTrace("correct-answer:after-clear-highlight", { targetId });
    promptNextMemoryTrailTarget(memoryTrail);
    recordOldReviewOutlineDebugVisualTrace("correct-answer:after-next-prompt", { targetId });
  }, getMemoryTrailCorrectAnswerPauseMs(memoryTrail));

  maybeSpeakPlaceToNameFeedbackTarget(memoryTrail, targetId, options);

  if (isSlowCorrect) {
    debugMemoryTrail("daily trail slow correct recorded", {
      targetId,
      elapsedMs: Math.round(responseElapsedMs)
    });
  }
}

function handleIncorrectMemoryTrailAnswer(memoryTrail, expectedTargetId, options = {}) {
  recordOldReviewOutlineDebugVisualTrace("incorrect-answer:start", { expectedTargetId, selectedTargetId: options.selectedTargetId || "" });
  updateMemoryTrailStats(memoryTrail, expectedTargetId, "incorrect", { promptType: memoryTrail.currentPromptType });
  recordOldReviewOutlineDebugVisualTrace("incorrect-answer:after-update-stats", { expectedTargetId, selectedTargetId: options.selectedTargetId || "" });
  const selectedTargetId = options.selectedTargetId || "";
  recordOldReviewOutlineDebugVisualTrace("incorrect-answer:suppression-preserved", { expectedTargetId, selectedTargetId });
  memoryTrail.phase = "correction";
  memoryTrail.promptName = getMemoryTrailTargetLabel(expectedTargetId);
  memoryTrail.responseChipTargetId = expectedTargetId;
  memoryTrail.answerChoices = [];
  memoryTrail.message = "Not quite. Tap the correct place to continue.";
  memoryTrail.correction = {
    expectedTargetId,
    selectedTargetId,
    nearMiss: Boolean(options.nearMiss),
    promptType: memoryTrail.currentPromptType,
    startedAt: Date.now()
  };
  setMemoryTrailTrayFeedback(memoryTrail, createMemoryTrailCorrectionFeedback(memoryTrail, expectedTargetId, {
    ...options,
    selectedTargetId
  }));
  runner.setMemoryTrailCorrectionHighlight({
    correctTargetId: expectedTargetId,
    wrongTargetId: selectedTargetId
  });
  recordOldReviewOutlineDebugVisualTrace("incorrect-answer:after-correction-highlight", { expectedTargetId, selectedTargetId });
  showFeedback(memoryTrail.message);
  renderStudyExplorePanel();
  persistActiveUnitedStatesMemoryTrailSnapshot(memoryTrail, "correction");
  debugMemoryTrail("correction step started", getMemoryTrailClickDebugContext(memoryTrail, [selectedTargetId].filter(Boolean), {
    reason: "missed answer"
  }));
  maybeSpeakPlaceToNameFeedbackTarget(memoryTrail, expectedTargetId);
}

function maybeSpeakPlaceToNameFeedbackTarget(memoryTrail, targetId, options = {}) {
  if (
    options.suppressTargetSpeech
    || !memoryTrail
    || memoryTrail.activityId !== continentsOceansActivityId
    || !isPlaceToNameMemoryTrailPrompt(memoryTrail)
    || memoryTrail.currentPromptMode !== "learn"
    || memoryTrail.lastSpokenTargetPromptKey === memoryTrail.currentPromptKey
  ) {
    return;
  }

  const target = getTargetById(memoryTrail, targetId);
  if (target) {
    speakMemoryTrailTarget(target);
  }
}

function createMemoryTrailCorrectionFeedback(memoryTrail, expectedTargetId, options = {}) {
  const selectedTargetId = options.selectedTargetId || "";
  const expectedName = getMemoryTrailTargetLabel(expectedTargetId);
  const selectedName = selectedTargetId ? getMemoryTrailTargetLabel(selectedTargetId) : "";
  const message = selectedName
    ? `Not quite - that was ${selectedName}. Tap ${expectedName} to continue.`
    : `Not quite. Tap ${expectedName} to continue.`;

  return {
    type: "incorrect",
    message,
    expectedTargetId,
    selectedTargetId,
    createdAt: Date.now(),
    persistUntilNextAction: false,
    correction: true
  };
}

function createMemoryTrailMissFeedback(memoryTrail, expectedTargetId, options = {}) {
  const expectedName = getMemoryTrailTargetLabel(expectedTargetId) || "the answer";
  const selectedTargetId = options.selectedTargetId || "";
  const selectedName = selectedTargetId ? getMemoryTrailTargetLabel(selectedTargetId) : "";
  let message;

  if (isPlaceToNameMemoryTrailPrompt(memoryTrail)) {
    message = selectedName
      ? `Not quite - this is ${expectedName}, not ${selectedName}. We'll review it again.`
      : `Not quite - this is ${expectedName}. We'll review it again.`;
  } else if (selectedName) {
    message = `Not quite - that was ${selectedName}. ${expectedName} is here. We'll review it again.`;
  } else {
    message = `Not quite - ${expectedName} is here. We'll review it again.`;
  }

  return {
    type: "incorrect",
    message,
    expectedTargetId,
    selectedTargetId,
    createdAt: Date.now(),
    persistUntilNextAction: true
  };
}

function setMemoryTrailTrayFeedback(memoryTrail, feedback) {
  if (!memoryTrail || !feedback) {
    return;
  }

  memoryTrail.trayFeedback = feedback;
  debugMemoryTrail("tray feedback created", feedback);
}

function clearMemoryTrailTrayFeedback(memoryTrail, action = "unknown") {
  if (!memoryTrail?.trayFeedback) {
    return;
  }

  debugMemoryTrail("tray feedback cleared", {
    action,
    feedback: memoryTrail.trayFeedback
  });
  memoryTrail.trayFeedback = null;
}

function updateMemoryTrailCorrectionCallout(memoryTrail = getActiveMemoryTrail()) {
  if (!memoryTrailCorrectionCallout) {
    return;
  }

  const isCorrectionActive = Boolean(memoryTrail?.active && memoryTrail.phase === "correction");
  memoryTrailCorrectionCallout.hidden = !isCorrectionActive;
  memoryTrailCorrectionCallout.setAttribute("aria-hidden", String(!isCorrectionActive));

  if (!isCorrectionActive) {
    memoryTrailCorrectionCallout.textContent = "";
    return;
  }

  const prefersTouchCopy = window.matchMedia?.("(pointer: coarse)")?.matches;
  memoryTrailCorrectionCallout.textContent = prefersTouchCopy
    ? "Tap the correct answer to continue"
    : "Click the correct answer to continue";
}

function getDailyTrailPromptPanelInstruction(memoryTrail) {
  const target = getMemoryTrailActivePromptTarget(memoryTrail);
  const singularNoun = getMemoryTrailInstructionNoun(session.currentActivity, memoryTrail) || "place";
  const isUnitedStatesTrail = isUnitedStatesMemoryTrail(memoryTrail);

  if (isGuidedMemoryTrailPrompt(memoryTrail)) {
    if (isUnitedStatesTrail && target?.type === "capital") {
      return "Tap the highlighted capital.";
    }

    return isContinentsOceansOceanLearnTarget(memoryTrail, target)
      ? "Tap the named place."
      : "Tap the highlighted place.";
  }

  if (isPlaceToNameMemoryTrailPrompt(memoryTrail)) {
    if (isUnitedStatesTrail) {
      return singularNoun === "state" ? "What state is this?" : `What ${singularNoun} is this?`;
    }
    return "Name the highlighted place.";
  }

  if (isNameToPlaceMemoryTrailPrompt(memoryTrail)) {
    if (isUnitedStatesTrail) {
      return singularNoun === "body of water"
        ? "Tap the named body of water."
        : `Tap the named ${singularNoun}.`;
    }
    return singularNoun === "body of water"
      ? "Find the named body of water."
      : `Find the named ${singularNoun}.`;
  }

  return memoryTrail.instructionLabel || memoryTrail.visibleInstructionText || "Choose the correct answer.";
}

function shouldShowDailyTrailPromptTargetChip(memoryTrail) {
  return Boolean(
    memoryTrail
    && memoryTrail.phase !== "complete"
    && memoryTrail.currentPromptTargetId
    && !isPlaceToNameMemoryTrailPrompt(memoryTrail)
  );
}

function createDailyTrailPromptTargetChip(memoryTrail) {
  if (!shouldShowDailyTrailPromptTargetChip(memoryTrail)) {
    return null;
  }

  const target = getMemoryTrailActivePromptTarget(memoryTrail);
  const labelText = getMemoryTrailTargetLabel(target, memoryTrail) || memoryTrail.currentPromptTargetLabel || "";
  if (!labelText) {
    return null;
  }

  const chip = document.createElement("div");
  chip.className = "label-chip memory-trail-response-chip daily-trail-prompt-target-chip";
  chip.setAttribute("role", "status");
  chip.setAttribute("aria-label", `Memory Trail target: ${labelText}`);
  chip.appendChild(createChipLabelText(labelText));

  const speaker = window.GeographyChipSpeech?.createChipSpeakerControl(labelText);
  if (speaker) {
    chip.appendChild(speaker);
  }

  return chip;
}

function renderMemoryTrailPanel() {
  const memoryTrail = getActiveMemoryTrail();

  if (!memoryTrail) {
    return;
  }

  const panel = document.createElement("div");
  panel.className = "memory-trail-panel";
  const usesCompactAdaptivePrompt = isAdaptiveTrailMemoryTrail(memoryTrail);
  if (usesCompactAdaptivePrompt) {
    panel.classList.add("daily-trail-memory-trail-panel");
  }

  const status = document.createElement("div");
  status.className = "memory-trail-status";
  const isAnswerChoicePrompt = isPlaceToNameMemoryTrailPrompt(memoryTrail);
  if (isAnswerChoicePrompt) {
    status.classList.add("memory-trail-status-choice-prompt");
  }

  const promptGroup = document.createElement("div");
  promptGroup.className = "memory-trail-active-prompt";

  if (usesCompactAdaptivePrompt && memoryTrail.phase !== "complete") {
    const instructionLabel = document.createElement("p");
    instructionLabel.className = "memory-trail-instruction-label daily-trail-primary-instruction";
    instructionLabel.textContent = getDailyTrailPromptPanelInstruction(memoryTrail);
    promptGroup.appendChild(instructionLabel);

    const targetChip = createDailyTrailPromptTargetChip(memoryTrail);
    if (targetChip) {
      promptGroup.appendChild(targetChip);
    }

    status.appendChild(promptGroup);
  } else {
    const kicker = document.createElement("span");
    kicker.className = "memory-trail-kicker";
    kicker.textContent = "Memory Trail";

    const title = document.createElement("strong");
    const phaseLabel = memoryTrail.sessionPhase === "learn" ? "Learn" : "Practice";
    const sectionPrefix = memoryTrail.sectionTitle ? `${memoryTrail.sectionTitle} | ` : "";
    title.textContent = memoryTrail.phase === "complete"
      ? "Session complete"
      : `${sectionPrefix}${phaseLabel} | Prompt ${memoryTrail.promptCount + 1} of ${SESSION_PROMPT_CAP}`;

    const message = document.createElement("p");
    message.className = "memory-trail-message";
    message.textContent = memoryTrail.message;
    promptGroup.appendChild(message);

    const activeRecallPromptLabel = isNameToPlaceMemoryTrailPrompt(memoryTrail) && memoryTrail.phase === "answering"
      ? getMemoryTrailActivePromptLabel(memoryTrail)
      : "";
    const promptLabel = activeRecallPromptLabel || memoryTrail.promptName;

    if (promptLabel) {
      const prompt = document.createElement("p");
      prompt.className = "memory-trail-prompt";
      if (activeRecallPromptLabel) {
        prompt.classList.add("memory-trail-recall-target");
        prompt.textContent = `Find: ${activeRecallPromptLabel}`;
      } else {
        prompt.textContent = promptLabel;
      }
      promptGroup.appendChild(prompt);
    }

    if (memoryTrail.visibleInstructionText && memoryTrail.phase !== "complete") {
      const visibleInstruction = document.createElement("p");
      visibleInstruction.className = "memory-trail-visible-instruction";
      visibleInstruction.textContent = memoryTrail.visibleInstructionText;
      promptGroup.appendChild(visibleInstruction);
    }

    if (memoryTrail.instructionLabel && memoryTrail.phase !== "complete") {
      const instructionLabel = document.createElement("p");
      instructionLabel.className = "memory-trail-instruction-label";
      instructionLabel.textContent = memoryTrail.instructionLabel;
      promptGroup.appendChild(instructionLabel);
    }

    status.append(kicker, title, promptGroup);
  }

  const choiceList = createMemoryTrailAnswerChoiceList(memoryTrail);
  if (choiceList && isAnswerChoicePrompt) {
    status.appendChild(choiceList);
  }

  const trayFeedback = createMemoryTrailTrayFeedback(memoryTrail);
  if (trayFeedback) {
    status.appendChild(trayFeedback);
  }

  const responseChip = usesCompactAdaptivePrompt && shouldShowDailyTrailPromptTargetChip(memoryTrail)
    ? null
    : createMemoryTrailResponseChip(memoryTrail);
  if (responseChip) {
    status.appendChild(responseChip);
  }

  if (choiceList && !isAnswerChoicePrompt) {
    status.appendChild(choiceList);
  }

  if (!usesCompactAdaptivePrompt || memoryTrail.phase === "complete") {
    const stats = document.createElement("p");
    stats.className = "memory-trail-session-stats";
    stats.textContent = `${memoryTrail.correctCount} retrieval correct | ${getWeakTargets(memoryTrail).length} review`;
    status.appendChild(stats);
  }

  const controls = document.createElement("div");
  controls.className = "study-explore-controls memory-trail-controls";

  if (memoryTrail.phase !== "complete" && !usesCompactAdaptivePrompt && currentAppScreen === "study-explore") {
    appendStudyControlButton(controls, "Exit Memory Trail", exitMemoryTrail, "Exit Trail");
  }

  panel.appendChild(status);
  if (controls.childElementCount > 0) {
    panel.appendChild(controls);
  }
  answerBank.appendChild(panel);
  ensureActiveTrayContentVisible(memoryTrail);
}

function ensureActiveTrayContentVisible(memoryTrail = getActiveMemoryTrail()) {
  requestAnimationFrame(() => {
    if (!answerBank) {
      return;
    }

    const activeContent = answerBank.querySelector(".memory-trail-active-prompt")
      || answerBank.querySelector(".memory-trail-choice-list")
      || answerBank.querySelector(".study-target-list")
      || answerBank.querySelector(".label-chip");
    const scrollContainer = answerBank.scrollHeight > answerBank.clientHeight
      ? answerBank
      : answerBank.closest(".answer-panel") || answerBank;

    if (!activeContent || !scrollContainer || !("scrollTop" in scrollContainer)) {
      return;
    }

    const containerBounds = scrollContainer.getBoundingClientRect?.();
    const contentBounds = activeContent.getBoundingClientRect?.();
    const targetTop = containerBounds && contentBounds
      ? Math.max(0, scrollContainer.scrollTop + contentBounds.top - containerBounds.top - 8)
      : Math.max(0, activeContent.offsetTop - 8);
    scrollContainer.scrollTop = targetTop;
    answerBank.scrollLeft = 0;
  });
}

function createMemoryTrailTrayFeedback(memoryTrail) {
  const feedback = memoryTrail?.trayFeedback;
  if (!feedback?.message) {
    return null;
  }

  debugMemoryTrail("tray feedback rendered", feedback);

  const feedbackElement = document.createElement("p");
  feedbackElement.className = `memory-trail-tray-feedback memory-trail-tray-feedback-${feedback.type || "info"}`;
  feedbackElement.setAttribute("role", "status");
  feedbackElement.textContent = feedback.message;
  return feedbackElement;
}

function createMemoryTrailAnswerChoiceList(memoryTrail) {
  if (
    !memoryTrail
    || memoryTrail.phase !== "answering"
    || !isPlaceToNameMemoryTrailPrompt(memoryTrail)
    || !memoryTrail.answerChoices?.length
  ) {
    return null;
  }

  const list = document.createElement("div");
  list.className = "memory-trail-choice-list";

  memoryTrail.answerChoices.forEach((choice) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "label-chip memory-trail-choice-chip";
    button.dataset.id = choice.id;
    button.dataset.promptTargetId = choice.promptTargetId || "";
    button.dataset.promptKey = choice.promptKey || "";
    button.setAttribute("aria-label", choice.label);
    button.appendChild(createChipLabelText(choice.label));
    const choose = () => handleMemoryTrailNameChoice(choice.id, {
      promptTargetId: choice.promptTargetId,
      promptKey: choice.promptKey
    });
    const speaker = window.GeographyChipSpeech?.createChipSpeakerControl(choice.label);
    if (speaker) {
      button.appendChild(speaker);
    }
    button.addEventListener("click", choose);
    list.appendChild(button);
  });

  return list;
}

function createMemoryTrailResponseChip(memoryTrail) {
  if (!memoryTrail || (memoryTrail.phase !== "answering" && memoryTrail.phase !== "feedback" && memoryTrail.phase !== "correction")) {
    return null;
  }

  const target = getTargetById(memoryTrail, memoryTrail.responseChipTargetId);
  const labelText = getTargetChipLabel(target) || target?.name || "";

  if (!labelText) {
    return null;
  }

  const chip = document.createElement("div");
  chip.className = "label-chip memory-trail-response-chip";
  chip.setAttribute("role", "status");
  chip.setAttribute("aria-label", `Memory Trail target: ${labelText}`);
  chip.appendChild(createChipLabelText(labelText));

  const speaker = window.GeographyChipSpeech?.createChipSpeakerControl(labelText);
  if (speaker) {
    chip.appendChild(speaker);
  }

  return chip;
}

function appendStudyControlButton(container, label, handler, mobileLabel = label) {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = label;
  button.dataset.mobileLabel = mobileLabel;
  button.addEventListener("click", handler);
  container.appendChild(button);
  return button;
}

function getEffectivePresentationSettings(activity, options = {}) {
  const requestedPresentationSettings = options.presentationSettings || {};

  return {
    reviewMode: requestedPresentationSettings.reviewMode || studyModes.cumulative,
    ...requestedPresentationSettings,
    ...getEffectiveLayerSettings(activity, options)
  };
}

function getEffectiveLayerSettings(activity, options = {}) {
  const requestedShowCities = options.presentationSettings?.showCities;
  const requestedShowCapitals = options.presentationSettings?.showCapitals;

  if (typeof requestedShowCities === "boolean" || typeof requestedShowCapitals === "boolean") {
    const requestedSettings = {
      ...mapLayerSettings,
      ...(typeof requestedShowCities === "boolean" ? { showCities: requestedShowCities } : {}),
      ...(typeof requestedShowCapitals === "boolean" ? { showCapitals: requestedShowCapitals } : {})
    };

    return {
      ...requestedSettings,
      ...getRequiredTargetLayerOverrides(activity, requestedSettings, options.presentationSettings)
    };
  }

  return {
    ...mapLayerSettings,
    ...getRequiredTargetLayerOverrides(activity, mapLayerSettings, options.presentationSettings)
  };
}

function getRequiredTargetLayerOverrides(activity, settings = mapLayerSettings, presentationSettings = {}) {
  const overrides = {};

  if (isPointOnlyActivity(activity) || hasRequiredPointTargets(presentationSettings)) {
    overrides.showCities = true;
    overrides.showCapitals = true;
  }

  return overrides;
}

function hasRequiredPointTargets(presentationSettings = {}) {
  const targetItems = Array.isArray(presentationSettings.adaptiveTrailTargetItems)
    ? presentationSettings.adaptiveTrailTargetItems
    : Array.isArray(presentationSettings.dailyTrailTargetItems)
      ? presentationSettings.dailyTrailTargetItems
      : [];

  return targetItems.some((item) => (
    item?.targetKind === "point"
    || item?.type === "capital"
    || item?.category === "capitals"
  ));
}

function shouldShowCityCapitalLayer(settings = mapLayerSettings) {
  return settings.showCities !== false || settings.showCapitals !== false;
}

function shouldShowPointMarkers(activity, mode = currentAppScreen, settings = mapLayerSettings) {
  if (isPointOnlyActivity(activity)) {
    return true;
  }

  // Journey Mode treats mixed state/capital activities as state sections first;
  // city/capital point targets stay hidden unless the activity is point-only or
  // an explicit layer setting enables optional point markers.
  if (mode === "journey-gameplay") {
    return shouldShowCityCapitalLayer(settings);
  }

  return shouldShowCityCapitalLayer(settings);
}

function isPointOnlyActivity(activity) {
  return Boolean(activity?.targets?.length)
    && activity.targets.every((target) => target.kind === "point");
}

function formatJourneyStepCount(count) {
  if (count === 1) {
    return "1 activity";
  }

  if (count > 1) {
    return `${count} activities`;
  }

  return "No activities yet";
}

const journeyPresetSections = [
  {
    title: "Start Here",
    ids: ["world-geography-core", "world-foundations", "united-states", "us-mountain-ranges", "north-america", "europe"]
  },
  {
    title: "World",
    ids: ["world-geography-core", "world-foundations"]
  },
  {
    title: "Americas",
    ids: ["the-americas", "north-america", "united-states", "us-mountain-ranges", "us-capitals", "the-caribbean", "south-america", "brazil"]
  },
  {
    title: "Europe",
    ids: ["europe", "germany", "france", "spain", "italy", "united-kingdom", "russia"]
  },
  {
    title: "Africa",
    ids: ["africa"]
  },
  {
    title: "Asia",
    ids: ["asia", "india", "japan"]
  },
  {
    title: "Oceania",
    ids: ["oceania"]
  },
  {
    title: "Capstone",
    ids: ["world-tour"]
  }
];

// Choose Journey card artwork is decorative and mapped separately from journey
// ids so display-name changes do not break saved progress or activity data.
const JOURNEY_THUMBNAILS = {
  "world-geography-core": "assets/journey-thumbnails/world-geography-core-card.png",
  "World Geography Core": "assets/journey-thumbnails/world-geography-core-card.png",
  "world-foundations": "assets/journey-thumbnails/continents-and oceans-card.png",
  "Continents and Oceans": "assets/journey-thumbnails/continents-and oceans-card.png",
  "World Foundations": "assets/journey-thumbnails/continents-and oceans-card.png",
  "united-states": "assets/journey-thumbnails/united-states-card.png",
  "United States": "assets/journey-thumbnails/united-states-card.png",
  "us-mountain-ranges": "assets/journey-thumbnails/united-states-card.png",
  "U.S. Mountain Ranges": "assets/journey-thumbnails/united-states-card.png",
  "us-capitals": "assets/journey-thumbnails/united-states-capitals-card.png",
  "U.S. Capitals": "assets/journey-thumbnails/united-states-capitals-card.png",
  "north-america": "assets/journey-thumbnails/north-america-card.png",
  "North America": "assets/journey-thumbnails/north-america-card.png",
  "the-americas": "assets/journey-thumbnails/the-americas-card.png",
  "The Americas": "assets/journey-thumbnails/the-americas-card.png",
  "the-caribbean": "assets/journey-thumbnails/the-caribbean-card.png",
  "The Caribbean": "assets/journey-thumbnails/the-caribbean-card.png",
  Caribbean: "assets/journey-thumbnails/the-caribbean-card.png",
  "south-america": "assets/journey-thumbnails/south-america-card.png",
  "South America": "assets/journey-thumbnails/south-america-card.png",
  brazil: "assets/journey-thumbnails/brazil-card.png",
  Brazil: "assets/journey-thumbnails/brazil-card.png",
  europe: "assets/journey-thumbnails/europe-card.png",
  Europe: "assets/journey-thumbnails/europe-card.png",
  germany: "assets/journey-thumbnails/germany-card.png",
  Germany: "assets/journey-thumbnails/germany-card.png",
  france: "assets/journey-thumbnails/france-card.png",
  France: "assets/journey-thumbnails/france-card.png",
  spain: "assets/journey-thumbnails/spain-card.png",
  Spain: "assets/journey-thumbnails/spain-card.png",
  italy: "assets/journey-thumbnails/italy-card.png",
  Italy: "assets/journey-thumbnails/italy-card.png",
  "united-kingdom": "assets/journey-thumbnails/united-kingdom-card.png",
  "United Kingdom": "assets/journey-thumbnails/united-kingdom-card.png",
  UK: "assets/journey-thumbnails/united-kingdom-card.png",
  russia: "assets/journey-thumbnails/russia-card.png",
  Russia: "assets/journey-thumbnails/russia-card.png",
  africa: "assets/journey-thumbnails/africa-card.png",
  Africa: "assets/journey-thumbnails/africa-card.png",
  asia: "assets/journey-thumbnails/asia-card.png",
  Asia: "assets/journey-thumbnails/asia-card.png",
  india: "assets/journey-thumbnails/india-card.png",
  India: "assets/journey-thumbnails/india-card.png",
  japan: "assets/journey-thumbnails/japan-card.png",
  Japan: "assets/journey-thumbnails/japan-card.png",
  oceania: "assets/journey-thumbnails/oceania-card.png",
  Oceania: "assets/journey-thumbnails/oceania-card.png",
  "world-tour": "assets/journey-thumbnails/world-tour-card.png",
  "World Tour": "assets/journey-thumbnails/world-tour-card.png"
};

const JOURNEY_THUMBNAIL_ASSET_VERSION = "20260531-journey-thumbnail-refresh";

function versionJourneyThumbnailSrc(src) {
  if (!src || src.includes("?")) {
    return src || "";
  }

  return `${src}?v=${JOURNEY_THUMBNAIL_ASSET_VERSION}`;
}

function getJourneyThumbnailSrc(journey) {
  return versionJourneyThumbnailSrc(
    JOURNEY_THUMBNAILS[journey?.id] || JOURNEY_THUMBNAILS[journey?.title] || journey?.thumbnailSrc || ""
  );
}

function createJourneyPresetCard(journey) {
  const isAvailable = isJourneyAvailable(journey);
  const status = getEffectiveJourneyStatus(journey);
  const thumbnailSrc = getJourneyThumbnailSrc(journey);
  const activateJourneyCard = () => selectJourney(journey.id);
  const card = document.createElement("article");
  card.className = [
    "journey-preset-card",
    isAvailable ? "journey-preset-card-clickable" : "",
    thumbnailSrc ? "journey-preset-card-with-thumbnail" : "",
    thumbnailSrc ? `journey-preset-card-${journey.id}` : "",
    isAvailable ? "" : `journey-preset-card-${status}`,
    journey.recommended ? "journey-preset-card-recommended" : ""
  ].filter(Boolean).join(" ");
  card.dataset.journeyId = journey.id;

  if (isAvailable) {
    card.setAttribute("role", "button");
    card.tabIndex = 0;
    card.setAttribute("aria-label", `${journey.recommended ? "Start" : "Select"} ${journey.title}`);
    card.addEventListener("click", activateJourneyCard);
    card.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") {
        return;
      }

      event.preventDefault();
      activateJourneyCard();
    });
  }

  const header = document.createElement("div");
  header.className = "journey-preset-card-header";

  const heading = document.createElement("h3");
  heading.textContent = journey.title;

  const statusBadge = document.createElement("span");
  statusBadge.className = `journey-status journey-status-${journey.recommended ? "recommended" : status}`;
  statusBadge.textContent = journey.recommended ? (journey.badge || "Recommended") : getJourneyStatusLabel(journey);

  header.append(heading, statusBadge);

  const description = document.createElement("p");
  description.textContent = journey.description;

  const note = document.createElement("p");
  note.className = "journey-preset-note";
  note.textContent = journey.note || "";

  const meta = document.createElement("p");
  meta.className = "journey-preset-meta";
  const progressText = isAvailable ? formatJourneyProgressText(journey) : "";
  const statusText = status === "locked" ? journey.lockedMessage : "";
  meta.textContent = statusText || (progressText
    ? `${formatJourneyStepCount(getValidJourneySteps(journey).length)} | ${progressText}`
    : formatJourneyStepCount(getValidJourneySteps(journey).length));

  const actions = document.createElement("div");
  actions.className = "journey-card-actions";

  const actionControl = document.createElement(isAvailable ? "span" : "button");
  actionControl.className = "journey-card-action-control";
  actionControl.textContent = journey.recommended && isAvailable ? "Start Learning" : isAvailable ? "Select Journey" : "View Details";

  if (!isAvailable) {
    actionControl.type = "button";
    actionControl.addEventListener("click", activateJourneyCard);
  }

  actions.append(actionControl);

  card.append(header, description);
  if (journey.note) {
    card.append(note);
  }
  card.append(meta, actions);

  if (thumbnailSrc) {
    // Decorative journey thumbnail; card text and actions remain the interactive surface.
    const thumbnail = document.createElement("div");
    thumbnail.className = "journey-preset-card-thumbnail";
    thumbnail.setAttribute("aria-hidden", "true");

    const picture = document.createElement("picture");
    const thumbnailImage = document.createElement("img");
    thumbnailImage.src = thumbnailSrc;
    thumbnailImage.alt = "";
    thumbnailImage.loading = "lazy";
    thumbnailImage.decoding = "async";
    thumbnailImage.width = 960;
    thumbnailImage.height = 540;

    picture.appendChild(thumbnailImage);
    thumbnail.append(picture);
    card.append(thumbnail);
  }

  return card;
}

function renderJourneyPresetList(isVisible) {
  if (!journeyPresetList) {
    return;
  }

  journeyPresetList.hidden = !isVisible;

  if (!isVisible) {
    journeyPresetList.innerHTML = "";
    return;
  }

  journeyPresetList.innerHTML = "";

  const pickerToolbar = document.createElement("div");
  pickerToolbar.className = "journey-picker-toolbar";

  const customizeButton = document.createElement("button");
  customizeButton.type = "button";
  customizeButton.className = "journey-picker-customize-button";
  customizeButton.textContent = "Customize";
  customizeButton.addEventListener("click", () => showCustomizeScreen());

  pickerToolbar.appendChild(customizeButton);
  journeyPresetList.appendChild(pickerToolbar);

  const journeysById = new Map(journeyPresets.map((journey) => [journey.id, journey]));

  journeyPresetSections.forEach((sectionDefinition) => {
    const sectionJourneys = sectionDefinition.ids
      .map((journeyId) => journeysById.get(journeyId))
      .filter(Boolean);

    if (!sectionJourneys.length) {
      return;
    }

    const section = document.createElement("section");
    section.className = "journey-preset-section";
    section.dataset.journeySection = sectionDefinition.title.toLowerCase().replace(/\s+/g, "-");

    const sectionHeading = document.createElement("h3");
    sectionHeading.className = "journey-preset-section-title";
    sectionHeading.textContent = sectionDefinition.title;

    const sectionGrid = document.createElement("div");
    sectionGrid.className = "journey-preset-section-grid";

    sectionJourneys.forEach((journey) => {
      sectionGrid.appendChild(createJourneyPresetCard(journey));
    });

    section.append(sectionHeading, sectionGrid);
    journeyPresetList.appendChild(section);
  });
}

function renderJourneyShellContent(screenId) {
  if (!journeyShellContent) {
    return;
  }

  const selectedJourney = getSelectedJourney();
  const isJourneyScreen = isJourneyShellScreen(screenId);
  journeyShellContent.hidden = !isJourneyScreen;
  journeyShellContent.innerHTML = "";

  if (!isJourneyScreen) {
    return;
  }

  if (screenId === "free-play-difficulty") {
    renderFreePlayDifficultyScreen();
    return;
  }

  if (screenId === "settings") {
    renderSettingsScreen();
    return;
  }

  if (screenId === "customize") {
    renderCustomizeScreen();
    return;
  }

  if (screenId === "onboarding") {
    renderOnboardingScreen();
    return;
  }

  if (screenId === "daily-trail-intro") {
    renderDailyTrailIntroScreen();
    return;
  }

  if (screenId === "daily-trail-dev") {
    renderDailyTrailDevScreen();
    return;
  }

  if (screenId === "daily-trail-goal-choice") {
    renderDailyTrailGoalChoiceScreen();
    return;
  }

  if (screenId === "daily-trail-summary") {
    renderDailyTrailSummaryScreen();
    return;
  }

  if (screenId === "united-states-trail-summary") {
    renderUnitedStatesMemoryTrailSummary();
    return;
  }

  if (!selectedJourney) {
    const missingCard = document.createElement("div");
    missingCard.className = "app-shell-placeholder-card";
    missingCard.setAttribute("role", "status");
    missingCard.textContent = "Choose an available journey first.";
    journeyShellContent.appendChild(missingCard);
    return;
  }

  if (screenId === "journey-detail") {
    renderJourneyDetail(selectedJourney);
    return;
  }

  if (!isJourneyAvailable(selectedJourney)) {
    const unavailableCard = document.createElement("div");
    unavailableCard.className = "app-shell-placeholder-card";
    unavailableCard.setAttribute("role", "status");
    unavailableCard.textContent = getUnavailableJourneyMessage(selectedJourney);
    journeyShellContent.appendChild(unavailableCard);
    return;
  }

  if (screenId === "study") {
    renderStudySelectionScreen(selectedJourney);
    return;
  }

  if (screenId === "choose-difficulty") {
    renderJourneyDifficultyScreen(selectedJourney);
    return;
  }

  renderBeginJourneyPlaceholder(selectedJourney);
}

function renderOnboardingScreen() {
  const panel = document.createElement("section");
  panel.className = "onboarding-panel";

  const cards = document.createElement("div");
  cards.className = "onboarding-card-grid";

  [
    ["1.", "Pick a Journey", "Choose a guided path like Continents and Oceans."],
    ["2.", "Select a Label", "Tap one of the answer chips at the bottom of the screen."],
    ["3.", "Tap the Map", "Tap the matching place on the globe. Correct answers stay on the map."],
    ["4.", "Study When Needed", "Use Study to preview or practice without changing journey progress."]
  ].forEach(([stepText, titleText, copyText]) => {
    const card = document.createElement("article");
    card.className = "onboarding-card";

    const step = document.createElement("span");
    step.className = "onboarding-step-number";
    step.textContent = stepText;

    const heading = document.createElement("h3");
    heading.textContent = titleText;

    const copy = document.createElement("p");
    copy.textContent = copyText;

    card.append(step, heading, copy);
    cards.appendChild(card);
  });

  const actions = document.createElement("div");
  actions.className = "onboarding-actions";

  const startButton = document.createElement("button");
  startButton.type = "button";
  startButton.className = "onboarding-primary-button";
  startButton.textContent = "Start Continents and Oceans";
  startButton.addEventListener("click", startWorldFoundationsFromOnboarding);

  const chooseButton = document.createElement("button");
  chooseButton.type = "button";
  chooseButton.textContent = "Choose Journey";
  chooseButton.addEventListener("click", chooseJourneyFromOnboarding);

  const skipButton = document.createElement("button");
  skipButton.type = "button";
  skipButton.className = "onboarding-skip-button";
  skipButton.textContent = "Skip";
  skipButton.addEventListener("click", skipOnboarding);

  actions.append(startButton, chooseButton, skipButton);
  panel.append(cards, actions);
  journeyShellContent.appendChild(panel);
}

async function openDailyTrailIntro() {
  await ensureMapRuntimeLoaded();
  await ensureActivityDataLoaded();

  const devOverride = getDailyTrailDevOverride();
  const items = getDailyTrailItems({ devOverride });
  const state = syncCompletedDailyTrailGoals(loadDailyTrailState(), items);

  if (!devOverride && shouldShowDailyTrailGoalChoice(state, items)) {
    pendingDailyTrailPlan = null;
    showAppScreen("daily-trail-goal-choice");
    return;
  }

  pendingDailyTrailPlan = getDailyTrailPlanForState(state, items, devOverride);
  showAppScreen("daily-trail-intro");
}

function getDailyTrailItems(options = {}) {
  const state = loadDailyTrailState();
  const goal = getDailyTrailGoal(options.goalId || options.devOverride?.dailyTrailDevOverrideGoalId || state.activeTrailGoal);
  const journey = journeyPresets.find((candidate) => candidate.id === goal.journeyId);
  const items = dedupeDailyTrailDevItems([
    ...getDailyTrailGoalItems(goal, journey),
    ...getCompletedDailyTrailGoalReviewItems(state, goal)
  ]);

  return options.devOverride
    ? dedupeDailyTrailDevItems([...items, ...getDailyTrailDevOverrideItems(options.devOverride, items)])
    : items;
}

function getCompletedDailyTrailGoalReviewItems(state, activeGoal) {
  return dailyTrailGoals
    .filter((goal) => goal.id !== activeGoal?.id)
    .filter((goal) => state.completedGoalIds.includes(goal.id))
    .flatMap((goal) => {
      const journey = journeyPresets.find((candidate) => candidate.id === goal.journeyId);
      return getDailyTrailGoalItems(goal, journey);
    });
}

function getDailyTrailGoalItems(goal, journey) {
  if (!goal || !journey) {
    return [];
  }

  if (goal.id === "world-core") {
    return buildWorldCoreDailyTrailItems(journey, activities, {
      goalId: goal.id,
      activityIds: goal.activityIds
    });
  }

  return buildDailyTrailGoalItems(journey, activities, {
    goalId: goal.id,
    homeJourneyId: journey.id,
    activityIds: goal.activityIds
  });
}

function getDailyTrailPlanForState(state, items, devOverride = getDailyTrailDevOverride()) {
  return devOverride
    ? planDailyTrailDevSession(state, items, devOverride)
    : planDailyTrailSession(state, items);
}

function getDailyTrailDevOverrideItems(devOverride, existingItems = []) {
  const activity = getActivityById(devOverride?.dailyTrailDevOverrideActivityId);

  if (!activity?.targets?.length) {
    return [];
  }

  const existingIds = new Set(existingItems.map((item) => item.id));
  const requestedIds = new Set(devOverride.dailyTrailDevOverrideItemIds || []);
  return activity.targets
    .map((target, targetIndex) => createDailyTrailDevItem(activity, target, targetIndex))
    .filter((item) => item && !existingIds.has(item.id))
    .filter((item) => requestedIds.size === 0 || requestedIds.has(item.id));
}

function createDailyTrailDevItem(activity, target, targetIndex = 0) {
  if (!activity || !target) {
    return null;
  }

  const type = getDailyTrailDevItemType(activity, target);
  return {
    id: `${type}:${target.id}`,
    targetId: target.id,
    label: target.name,
    type,
    homeActivityId: activity.id,
    homeJourneyId: "daily-trail-dev",
    homeStepId: activity.id,
    homeStepIndex: 9999,
    activityTitle: activity.title,
    cameraGroupId: activity.map?.region || activity.id,
    order: 9999000 + targetIndex
  };
}

function getDailyTrailDevItemType(activity, target) {
  if (target.type === "federal-district") {
    return "federal-district";
  }

  if (target.type === "zone") {
    return "ocean";
  }

  if (target.type === "region") {
    return "continent";
  }

  if (target.type === "capital") {
    return "capital";
  }

  if (target.type === "city") {
    return "city";
  }

  if (target.type === "water-body") {
    return "water-body";
  }

  if (target.type === "mountain-range") {
    return "mountain-range";
  }

  if (target.type === "territory") {
    return "territory";
  }

  if (/state/i.test(activity?.targetNoun || "")) {
    return "state";
  }

  return "country";
}

function dedupeDailyTrailDevItems(items) {
  const byId = new Map();
  items.filter(Boolean).forEach((item) => {
    if (!byId.has(item.id)) {
      byId.set(item.id, item);
    }
  });
  return Array.from(byId.values()).sort((left, right) => left.order - right.order);
}

function isDailyTrailDevAccessAllowed() {
  return isLocalDevAccessAllowed();
}

function isLocalDevAccessAllowed() {
  const hostname = window.location?.hostname || "";
  return hostname === "localhost"
    || hostname === "127.0.0.1"
    || hostname === "::1"
    || hostname === "";
}

function getMemoryTrailDebugUrlMode() {
  if (!isLocalDevAccessAllowed()) {
    return "";
  }

  const params = new URLSearchParams(window.location.search || "");
  return String(params.get("memoryTrailDebug") || params.get("memory-trail-debug") || "").trim();
}

function getMemoryTrailDebugFixtureMode() {
  if (!isLocalDevAccessAllowed()) {
    return "";
  }

  const params = new URLSearchParams(window.location.search || "");
  return String(
    params.get("memoryTrailDebugFixture")
      || params.get("memory-trail-debug-fixture")
      || params.get("fixture")
      || "name-to-place"
  ).trim();
}

function getOldReviewOutlineDebugFixtureConfig() {
  const mode = getMemoryTrailDebugFixtureMode().toLowerCase();
  const configs = {
    "name-to-place": {
      id: "name-to-place",
      currentActivityId: "us-states-04",
      currentSectionTargetIds: ["georgia", "florida", "alabama", "mississippi", "louisiana"],
      reviewTargets: [{ targetId: "maine", activityId: "us-states-01" }],
      prompt: {
        targetId: "maine",
        promptType: "name_to_place",
        mode: "review",
        reason: "debug old review outline fixture"
      },
      completedTargetIds: ["maine"],
      backgroundTargetIds: ["tennessee"]
    },
    "learn-review-outline": {
      id: "learn-review-outline",
      currentActivityId: "us-states-10",
      currentSectionTargetIds: ["montana", "idaho", "washington", "oregon"],
      reviewTargets: [
        { targetId: "iowa", activityId: "us-states-06" },
        { targetId: "maryland", activityId: "us-states-03" }
      ],
      prompt: {
        targetId: "oregon",
        promptType: "guided",
        mode: "learn",
        reason: "debug guided learn with future review targets"
      },
      completedTargetIds: [],
      backgroundTargetIds: ["nevada"]
    },
    "answer-flash": {
      id: "answer-flash",
      currentActivityId: "us-states-04",
      currentSectionTargetIds: ["georgia", "florida", "alabama", "mississippi", "louisiana"],
      reviewTargets: [],
      prompt: {
        targetId: "georgia",
        promptType: "name_to_place",
        mode: "practice",
        reason: "debug answer visual transition"
      },
      completedTargetIds: [],
      backgroundTargetIds: ["tennessee"]
    }
  };

  return configs[mode] || configs["name-to-place"];
}

async function startDailyTrailOldReviewOutlineDebugFixture() {
  if (!isLocalDevAccessAllowed()) {
    showAppScreen("launch", { pushHistory: false });
    return false;
  }

  await ensureMapRuntimeLoaded();
  await ensureActivityDataLoaded();

  const config = getOldReviewOutlineDebugFixtureConfig();
  const currentActivity = getActivityById(config.currentActivityId);
  const reviewTargetRefs = (config.reviewTargets || [])
    .map((item) => ({
      ...item,
      activity: getActivityById(item.activityId),
      target: getActivityById(item.activityId)?.targets?.find((target) => target.id === item.targetId)
    }));
  if (
    !currentActivity
    || reviewTargetRefs.some((item) => !item.activity || !item.target)
    || !(config.currentSectionTargetIds || []).every((targetId) => currentActivity.targets?.some((target) => target.id === targetId))
  ) {
    showFeedback("Old-review outline debug fixture could not be built.");
    showAppScreen("launch", { pushHistory: false });
    return false;
  }

  const playItems = [
    ...config.currentSectionTargetIds.map((targetId, index) => createOldReviewOutlineDebugPlanItem({
      targetId,
      activity: currentActivity,
      order: index,
      isReview: false
    })),
    ...reviewTargetRefs.map((item, index) => createOldReviewOutlineDebugPlanItem({
      targetId: item.targetId,
      activity: item.activity,
      order: config.currentSectionTargetIds.length + index,
      isReview: true
    }))
  ].filter(Boolean);
  const targetIds = playItems.map((item) => item.targetId);

  activeDailyTrailSession = {
    trailId: "debug-old-review-outline",
    journeyId: "debug-old-review-outline",
    state: {
      activeTrailGoal: "debug-old-review-outline",
      currentSessionNumber: 1,
      progressByTarget: {}
    },
    plan: {
      sessionType: "debug-old-review-outline",
      trailGoalId: "debug-old-review-outline",
      activeActivityId: config.currentActivityId,
      playItems,
      allItems: playItems,
      newItems: playItems.filter((item) => !item.isReview),
      reviewItems: playItems.filter((item) => item.isReview),
      debugFixture: "old-review-outline",
      debugFixtureMode: config.id
    },
    activityId: config.currentActivityId,
    devReplay: true,
    debugFixture: "old-review-outline",
    debugFixtureMode: config.id,
    checkpointActivityGroups: [],
    checkpointActivityIndex: 0,
    checkpointResult: null,
    completedReviewActivityGroups: [],
    completedReviewActivityIndex: 0,
    completedReviewResult: null,
    checkpointTransitionInProgress: false
  };
  pendingDailyTrailPlan = null;

  const presentationSettings = getEffectivePresentationSettings(currentActivity, {
    presentationSettings: {
      reviewMode: studyModes.sectionOnly,
      dailyTrailTargetIds: targetIds,
      dailyTrailTargetItems: playItems.map((item) => ({
        targetId: item.targetId,
        homeActivityId: item.homeActivityId
      })),
      dailyTrailVisualContextTargetIds: []
    }
  });

  await openActivity(config.currentActivityId, {
    appScreen: "daily-trail-gameplay",
    difficultyId: difficultyModes.easy,
    disableActivityProgress: true,
    forceGameplayVisible: true,
    hierarchyNodeId: findHierarchyNodeForActivity(config.currentActivityId),
    presentationSettings
  });

  activeStudySession = {
    journeyId: "debug-old-review-outline",
    stepId: config.id,
    activityId: config.currentActivityId,
    dailyTrail: true,
    memoryTrailSectionIndex: 0,
    revealedTargetIds: []
  };

  const didStartMemoryTrail = startMemoryTrail({
    source: "daily-trail",
    newTargetIds: config.currentSectionTargetIds,
    targetIds,
    insertedReviewTargetIds: reviewTargetRefs.map((item) => item.targetId),
    suppressInitialPrompt: true
  });
  const memoryTrail = activeStudySession?.memoryTrail;
  if (!didStartMemoryTrail || !memoryTrail) {
    showFeedback("Old-review outline debug fixture could not start.");
    return false;
  }

  const currentWindow = config.currentSectionTargetIds
    .map((targetId) => getTargetById(memoryTrail, targetId))
    .filter(Boolean);
  if (currentWindow.length > 0) {
    memoryTrail.currentPracticeWindow = currentWindow;
  }
  config.currentSectionTargetIds.forEach((targetId) => {
    markOldReviewOutlineDebugTargetIntroduced(memoryTrail, targetId);
  });
  reviewTargetRefs.forEach((item) => {
    markOldReviewOutlineDebugTargetIntroduced(memoryTrail, item.targetId, { retrievalCorrect: 1 });
  });

  const fixture = {
    mode: config.id,
    currentActivityId: config.currentActivityId,
    currentActivityTitle: currentActivity.title,
    currentSectionId: config.currentActivityId,
    currentSectionTargetIds: config.currentSectionTargetIds,
    currentLearnTargetIds: config.currentSectionTargetIds,
    oldReviewActivityId: reviewTargetRefs[0]?.activityId || "",
    oldReviewTargetId: reviewTargetRefs[0]?.targetId || config.prompt.targetId,
    oldReviewTargetIds: reviewTargetRefs.map((item) => item.targetId),
    oldReviewTargetOrigins: Object.fromEntries(reviewTargetRefs.map((item) => [item.targetId, item.activityId])),
    oldReviewTargetLabel: reviewTargetRefs[0]?.target?.name || reviewTargetRefs[0]?.targetId || "",
    reviewClassification: reviewTargetRefs.length > 0 ? "inserted-old-review" : "none",
    promptTargetId: config.prompt.targetId,
    inspectTargetIds: [
      ...config.currentSectionTargetIds,
      ...reviewTargetRefs.map((item) => item.targetId),
      ...(config.backgroundTargetIds || [])
    ],
    expectedClickTargetId: config.id === "answer-flash" ? config.prompt.targetId : ""
  };
  if (typeof window !== "undefined") {
    window.__oldReviewOutlineDebugTrace = {
      sequence: 0,
      startedAtMs: getMonotonicNowMs(),
      events: []
    };
  }
  installOldReviewOutlineDebugTrace(memoryTrail, fixture);
  runner?.setCompletedTargets?.(config.completedTargetIds || []);
  recordOldReviewOutlineDebugVisualTrace("fixture-before-prompt", { fixtureMode: config.id });
  applyMemoryTrailPromptSelection(memoryTrail, config.prompt);
  recordOldReviewOutlineDebugVisualTrace("fixture-after-prompt", { fixtureMode: config.id });
  renderOldReviewOutlineDebugPanel(memoryTrail, fixture);
  runner?.map?.once?.("idle", () => renderOldReviewOutlineDebugPanel(memoryTrail, fixture));
  runner?.map?.on?.("idle", () => {
    if (activeDailyTrailSession?.debugFixture === "old-review-outline" && isCurrentMemoryTrailState(memoryTrail)) {
      renderOldReviewOutlineDebugPanel(memoryTrail, fixture);
    }
  });
  window.setTimeout(() => renderOldReviewOutlineDebugPanel(memoryTrail, fixture), 800);
  return true;
}

function markOldReviewOutlineDebugTargetIntroduced(memoryTrail, targetId, options = {}) {
  const stats = memoryTrail?.targetStats?.[targetId];
  if (!stats) {
    return false;
  }

  stats.isIntroduced = true;
  stats.guidedTapCount = Math.max(1, Number(stats.guidedTapCount) || 0);
  stats.exposedCount = Math.max(1, Number(stats.exposedCount) || 0);
  if (options.retrievalCorrect) {
    stats.totalRetrievalAttempts = Math.max(1, Number(stats.totalRetrievalAttempts) || 0);
    stats.totalRetrievalCorrect = Math.max(Number(options.retrievalCorrect), Number(stats.totalRetrievalCorrect) || 0);
  }
  if (!memoryTrail.introducedTargetIds.includes(targetId)) {
    memoryTrail.introducedTargetIds.push(targetId);
  }
  return true;
}

function createOldReviewOutlineDebugPlanItem({ targetId, activity, order = 0, isReview = false } = {}) {
  const target = activity?.targets?.find((candidate) => candidate.id === targetId);
  if (!target) {
    return null;
  }

  return {
    id: `${activity.id}:${targetId}`,
    targetId,
    label: target.name || targetId,
    activityId: activity.id,
    activityTitle: activity.title || activity.id,
    homeActivityId: activity.id,
    order,
    type: target.type || "",
    kind: target.kind || "",
    isReview
  };
}

function getOldReviewOutlineDebugTrace() {
  if (typeof window === "undefined") {
    return null;
  }

  window.__oldReviewOutlineDebugTrace ||= {
    sequence: 0,
    startedAtMs: getMonotonicNowMs(),
    events: []
  };
  return window.__oldReviewOutlineDebugTrace;
}

function installOldReviewOutlineDebugTrace(memoryTrail, fixture) {
  if (!runner) {
    return;
  }

  runner.__oldReviewOutlineDebugFixture = fixture;
  if (runner.__oldReviewOutlineDebugTraceInstalled) {
    return;
  }

  runner.__oldReviewOutlineDebugTraceInstalled = true;
  [
    "setStudyPreviewMode",
    "setCompletedTargets",
    "setMemoryTrailStudyTargetEmphasisSuppressed",
    "setMemoryTrailHighlight",
    "setMemoryTrailCorrectionHighlight",
    "setMemoryTrailCheckpointPreAnswerStyle",
    "refreshDifficultyVisuals",
    "refreshMapRender"
  ].forEach((methodName) => {
    const original = runner[methodName];
    if (typeof original !== "function") {
      return;
    }

    runner[methodName] = function wrappedOldReviewOutlineDebugTrace(...args) {
      recordOldReviewOutlineDebugVisualTrace(`${methodName}:before`, { args });
      const result = original.apply(this, args);
      recordOldReviewOutlineDebugVisualTrace(`${methodName}:after`, { args });
      return result;
    };
  });

  const originalTriggerRepaint = runner.map?.triggerRepaint;
  if (typeof originalTriggerRepaint === "function" && !runner.map.__oldReviewOutlineDebugTraceInstalled) {
    runner.map.__oldReviewOutlineDebugTraceInstalled = true;
    runner.map.triggerRepaint = function wrappedOldReviewOutlineTriggerRepaint(...args) {
      recordOldReviewOutlineDebugVisualTrace("map.triggerRepaint", { args });
      return originalTriggerRepaint.apply(this, args);
    };
  }

  recordOldReviewOutlineDebugVisualTrace("trace-installed", {
    fixtureMode: fixture?.mode || "",
    promptTargetId: fixture?.promptTargetId || "",
    targetIds: fixture?.inspectTargetIds || []
  });
}

function recordOldReviewOutlineDebugVisualTrace(eventType, details = {}) {
  if (activeDailyTrailSession?.debugFixture !== "old-review-outline") {
    return;
  }

  const trace = getOldReviewOutlineDebugTrace();
  if (!trace) {
    return;
  }

  const now = getMonotonicNowMs();
  if (eventType === "map.triggerRepaint") {
    const elapsedSinceStart = now - trace.startedAtMs;
    if (Number.isFinite(trace.lastRepaintEventAtMs) && elapsedSinceStart - trace.lastRepaintEventAtMs < 80) {
      return;
    }
    trace.lastRepaintEventAtMs = elapsedSinceStart;
  }

  const memoryTrail = getActiveMemoryTrail();
  const visualDebugState = runner?.getMemoryTrailVisualDebugState?.() || {};
  const promptVisualState = runner?.getMemoryTrailPromptVisualState?.() || {};
  const fixture = runner?.__oldReviewOutlineDebugFixture || {};
  const event = {
    sequence: ++trace.sequence,
    elapsedMs: Math.round(now - trace.startedAtMs),
    eventType,
    activityId: memoryTrail?.activityId || session?.currentActivity?.id || "",
    sectionId: fixture.currentSectionId || "",
    promptType: memoryTrail?.currentPromptType || "",
    phase: memoryTrail?.phase || "",
    sessionPhase: memoryTrail?.sessionPhase || "",
    currentTarget: memoryTrail?.currentPromptTargetId || "",
    completedIds: visualDebugState.completedIds || [],
    introducedIds: memoryTrail?.introducedTargetIds || [],
    memoryTrailHighlightIds: visualDebugState.memoryTrailHighlightIds || [],
    memoryTrailCorrectHighlightIds: visualDebugState.memoryTrailCorrectHighlightIds || [],
    memoryTrailWrongHighlightIds: visualDebugState.memoryTrailWrongHighlightIds || [],
    correctionIds: [
      memoryTrail?.correction?.expectedTargetId || "",
      memoryTrail?.correction?.selectedTargetId || ""
    ].filter(Boolean),
    selectedTargetId: visualDebugState.selectedTargetId || "",
    suppressStudyTargetEmphasis: Boolean(promptVisualState.suppressStudyTargetEmphasis),
    suppressStudyTargetEmphasisReason: promptVisualState.suppressStudyTargetEmphasisReason || "",
    feedbackState: memoryTrail?.trayFeedback?.tone || memoryTrail?.phase || "",
    stateFillBranches: getOldReviewOutlineDebugTargetRows(memoryTrail, fixture, visualDebugState)
      .map((row) => [row.targetId, row.fillExpressionBranch]),
    stateLineBranches: getOldReviewOutlineDebugTargetRows(memoryTrail, fixture, visualDebugState)
      .map((row) => [row.targetId, row.lineExpressionBranch]),
    paintUpdated: /:after$/.test(eventType) || eventType === "map.triggerRepaint",
    triggerRepaint: eventType === "map.triggerRepaint" || eventType === "refreshMapRender:after",
    asyncBoundary: /prompt|fixture/.test(eventType) ? "same task" : "",
    details: sanitizeOldReviewOutlineDebugTraceDetails(details)
  };

  trace.events.push(event);
  if (trace.events.length > 140) {
    trace.events.splice(0, trace.events.length - 140);
  }
}

function sanitizeOldReviewOutlineDebugTraceDetails(details = {}) {
  if (!details || typeof details !== "object") {
    return {};
  }

  return Object.fromEntries(Object.entries(details).map(([key, value]) => {
    if (Array.isArray(value)) {
      return [key, value.map((item) => (
        typeof item === "object" && item !== null
          ? JSON.stringify(item)
          : item
      ))];
    }

    if (typeof value === "object" && value !== null) {
      return [key, JSON.stringify(value)];
    }

    return [key, value];
  }));
}

function renderOldReviewOutlineDebugPanel(memoryTrail, fixture) {
  if (!memoryTrail || !fixture?.inspectTargetIds?.length || typeof document === "undefined") {
    return;
  }

  const snapshot = getOldReviewOutlineDebugSnapshot(memoryTrail, fixture);
  let panel = document.querySelector("#old-review-outline-debug");
  if (!panel) {
    panel = document.createElement("pre");
    panel.id = "old-review-outline-debug";
    panel.setAttribute("aria-live", "polite");
    panel.style.position = "fixed";
    panel.style.left = "8px";
    panel.style.top = "64px";
    panel.style.zIndex = "80";
    panel.style.maxWidth = "min(360px, calc(100vw - 16px))";
    panel.style.maxHeight = "30vh";
    panel.style.overflow = "auto";
    panel.style.margin = "0";
    panel.style.padding = "8px";
    panel.style.border = "1px solid rgba(15, 23, 42, 0.28)";
    panel.style.borderRadius = "6px";
    panel.style.background = "rgba(255, 255, 255, 0.9)";
    panel.style.color = "#172033";
    panel.style.font = "11px/1.35 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";
    panel.style.whiteSpace = "pre-wrap";
    panel.style.pointerEvents = "none";
    document.body.appendChild(panel);
  }

  panel.textContent = JSON.stringify(snapshot, null, 2);
}

function getOldReviewOutlineDebugSnapshot(memoryTrail, fixture) {
  const promptVisualState = runner?.getMemoryTrailPromptVisualState?.() || {};
  const visualDebugState = runner?.getMemoryTrailVisualDebugState?.() || {};
  const candidateLayerPaintByTarget = Object.fromEntries((fixture.inspectTargetIds || [])
    .map((targetId) => [targetId, getOldReviewOutlineCandidateLayerPaint(targetId, visualDebugState)]));
  const trace = getOldReviewOutlineDebugTrace();
  return {
    fixture: "old-review-outline",
    fixtureMode: fixture.mode || "name-to-place",
    activityId: fixture.currentActivityId,
    activityTitle: fixture.currentActivityTitle,
    currentSectionId: fixture.currentSectionId,
    currentSectionTargetIds: fixture.currentSectionTargetIds,
    currentLearnTargetIds: fixture.currentLearnTargetIds || [],
    oldReviewActivityId: fixture.oldReviewActivityId,
    oldReviewTargetId: fixture.oldReviewTargetId,
    oldReviewTargetIds: fixture.oldReviewTargetIds || [],
    oldReviewTargetLabel: fixture.oldReviewTargetLabel,
    reviewClassification: fixture.reviewClassification,
    promptTargetId: fixture.promptTargetId,
    expectedClickTargetId: fixture.expectedClickTargetId || "",
    promptType: memoryTrail.currentPromptType,
    promptMode: memoryTrail.currentPromptMode,
    promptText: memoryTrail.message || memoryTrail.visibleInstructionText || "",
    suppressStudyTargetEmphasis: Boolean(promptVisualState.suppressStudyTargetEmphasis),
    suppressStudyTargetEmphasisReason: promptVisualState.suppressStudyTargetEmphasisReason || "",
    memoryTrailHighlightIds: visualDebugState.memoryTrailHighlightIds || [],
    memoryTrailCorrectHighlightIds: visualDebugState.memoryTrailCorrectHighlightIds || [],
    memoryTrailWrongHighlightIds: visualDebugState.memoryTrailWrongHighlightIds || [],
    completedIds: visualDebugState.completedIds || [],
    correction: memoryTrail.correction || null,
    phase: memoryTrail.phase,
    sessionPhase: memoryTrail.sessionPhase,
    promptVisualState,
    visualDebugState,
    targetRows: getOldReviewOutlineDebugTargetRows(memoryTrail, fixture, visualDebugState),
    candidateLayerPaintByTarget,
    layerSummaryByTarget: Object.fromEntries(Object.entries(candidateLayerPaintByTarget).map(([targetId, entries]) => [
      targetId,
      entries.map((entry) => ({
        layerId: entry.layerId,
        type: entry.type,
        branch: entry.branch,
        lineColor: entry.paint?.["line-color"],
        lineWidth: entry.paint?.["line-width"],
        lineOpacity: entry.paint?.["line-opacity"],
        fillColor: entry.paint?.["fill-color"],
        fillOpacity: entry.paint?.["fill-opacity"],
        fillOutlineColor: entry.paint?.["fill-outline-color"]
      }))
    ])),
    visualTraceTail: (trace?.events || []).slice(-40),
    visualTraceKeyEvents: (trace?.events || [])
      .filter((event) => event.eventType !== "map.triggerRepaint")
      .slice(-80)
  };
}

function getOldReviewOutlineDebugTargetRows(memoryTrail, fixture, visualDebugState = {}) {
  const promptVisualState = runner?.getMemoryTrailPromptVisualState?.() || {};
  const currentSectionIds = new Set(fixture?.currentSectionTargetIds || []);
  const learnIds = new Set(fixture?.currentLearnTargetIds || []);
  const oldReviewIds = new Set(fixture?.oldReviewTargetIds || []);
  const activityTargetIds = new Set((session?.currentActivity?.targets || []).map((target) => target.id).filter(Boolean));
  const introducedIds = new Set(memoryTrail?.introducedTargetIds || []);
  const completedIds = new Set(visualDebugState.completedIds || []);
  const highlightIds = new Set(visualDebugState.memoryTrailHighlightIds || []);
  const correctIds = new Set(visualDebugState.memoryTrailCorrectHighlightIds || []);
  const wrongIds = new Set(visualDebugState.memoryTrailWrongHighlightIds || []);
  const correctionIds = new Set([
    memoryTrail?.correction?.expectedTargetId || "",
    memoryTrail?.correction?.selectedTargetId || ""
  ].filter(Boolean));

  return (fixture?.inspectTargetIds || []).map((targetId) => {
    const target = findOldReviewOutlineDebugTarget(targetId);
    const feature = {
      id: targetId,
      properties: {
        id: targetId,
        targetId,
        physicalFeatureType: target?.physicalFeatureType || ""
      }
    };
    const fillExpressionBranch = describeOldReviewOutlineStyleBranch("state-fill", feature, visualDebugState);
    const lineExpressionBranch = describeOldReviewOutlineStyleBranch("state-line", feature, visualDebugState);
    return {
      targetId,
      label: target?.name || targetId,
      originActivityId: findOldReviewOutlineDebugTargetActivityId(targetId, fixture),
      currentSectionMember: currentSectionIds.has(targetId),
      currentLearnSetMember: learnIds.has(targetId),
      olderReviewMember: oldReviewIds.has(targetId),
      activePromptTarget: memoryTrail?.currentPromptTargetId === targetId,
      activityTargetsMember: activityTargetIds.has(targetId),
      introducedMember: introducedIds.has(targetId),
      completedMember: completedIds.has(targetId),
      explicitMemoryTrailHighlightMember: highlightIds.has(targetId),
      correctFeedbackMember: correctIds.has(targetId),
      wrongFeedbackMember: wrongIds.has(targetId),
      correctionMember: correctionIds.has(targetId),
      selectedOrHoveredMember: visualDebugState.selectedTargetId === targetId,
      suppressStudyTargetEmphasis: Boolean(promptVisualState.suppressStudyTargetEmphasis),
      promptType: memoryTrail?.currentPromptType || "",
      promptPhase: memoryTrail?.phase || "",
      fillExpressionBranch,
      lineExpressionBranch,
      resultingFill: describeOldReviewOutlineDebugFillResult(targetId, fillExpressionBranch, visualDebugState),
      resultingLine: describeOldReviewOutlineDebugLineResult(targetId, lineExpressionBranch, visualDebugState),
      screenPoint: getOldReviewOutlineDebugTargetScreenPoint(target)
    };
  });
}

function findOldReviewOutlineDebugTarget(targetId) {
  return session?.currentActivity?.targets?.find((target) => target.id === targetId)
    || activities.flatMap((activity) => activity.targets || []).find((target) => target.id === targetId)
    || null;
}

function findOldReviewOutlineDebugTargetActivityId(targetId, fixture = {}) {
  if ((fixture.currentSectionTargetIds || []).includes(targetId)) {
    return fixture.currentActivityId || "";
  }

  if (fixture.oldReviewTargetOrigins?.[targetId]) {
    return fixture.oldReviewTargetOrigins[targetId];
  }

  const activity = activities.find((candidate) => (candidate.targets || []).some((target) => target.id === targetId));
  return activity?.id || "";
}

function getOldReviewOutlineDebugTargetScreenPoint(target) {
  if (!target || !runner?.map?.project) {
    return null;
  }

  let centroid = getTargetCentroid(target);
  if ((!centroid || centroid.type !== "lonlat") && stateLabelAnchors[target.id]) {
    const [longitude, latitude] = stateLabelAnchors[target.id];
    centroid = { x: longitude, y: latitude, type: "lonlat" };
  }
  if (!centroid || centroid.type !== "lonlat") {
    return null;
  }

  try {
    const point = runner.map.project([centroid.x, centroid.y]);
    return point ? {
      x: Math.round(point.x),
      y: Math.round(point.y)
    } : null;
  } catch (error) {
    return null;
  }
}

function describeOldReviewOutlineDebugFillResult(targetId, branch, visualDebugState = {}) {
  if (visualDebugState.memoryTrailWrongHighlightIds?.includes(targetId)) {
    return { color: "memoryTrailWrongFill", opacity: 0.98 };
  }
  if (visualDebugState.memoryTrailCorrectHighlightIds?.includes(targetId)) {
    return { color: "memoryTrailCorrectFill", opacity: 0.98 };
  }
  if (visualDebugState.memoryTrailHighlightIds?.includes(targetId)) {
    return { color: "memoryTrailFill", opacity: 0.98 };
  }
  if (/suppression/.test(branch)) {
    return { color: "muted target color", opacity: 0 };
  }
  if (/completedIds/.test(branch)) {
    return { color: "target color match", opacity: 0.96 };
  }
  if (/study-preview/.test(branch)) {
    return { color: "studyTargetFill", opacity: 0.52 };
  }
  return { color: "ordinary map fill", opacity: null };
}

function describeOldReviewOutlineDebugLineResult(targetId, branch, visualDebugState = {}) {
  if (visualDebugState.memoryTrailWrongHighlightIds?.includes(targetId)) {
    return { color: "memoryTrailWrongLine", opacity: 1, width: 3 };
  }
  if (visualDebugState.memoryTrailCorrectHighlightIds?.includes(targetId)) {
    return { color: "memoryTrailCorrectLine", opacity: 1, width: 3 };
  }
  if (visualDebugState.memoryTrailHighlightIds?.includes(targetId)) {
    return { color: "memoryTrailLine", opacity: 1, width: 3 };
  }
  if (/suppression/.test(branch)) {
    return { color: "targetStroke", opacity: 0, width: 1.7 };
  }
  if (/completedIds/.test(branch)) {
    return { color: "targetStroke", opacity: 1, width: 2.15 };
  }
  if (/study-preview/.test(branch)) {
    return { color: "studyTargetLine", opacity: 0.86, width: 1.7 };
  }
  return { color: "ordinary boundary", opacity: null, width: null };
}

function getOldReviewOutlineCandidateLayerPaint(targetId, visualDebugState = {}) {
  const map = runner?.map;
  if (!map?.getLayer) {
    return [];
  }

  return ["state-fill", "state-line", "target-hit-fill", "us-state-context-fill", "us-state-context-line"]
    .filter((layerId) => map.getLayer(layerId))
    .map((layerId) => {
      const layer = map.getLayer(layerId);
      return {
        layerId,
        type: layer?.type || "",
        source: layer?.source || "",
        sourceLayer: layer?.["source-layer"] || "",
        filter: layer?.filter || null,
        paint: getOldReviewOutlineLayerPaint(map, layer),
        branch: describeOldReviewOutlineStyleBranch(layerId, {
          id: targetId,
          properties: { id: targetId, targetId }
        }, visualDebugState)
      };
    });
}

function getOldReviewOutlineLayerPaint(map, layer) {
  if (!map || !layer?.id) {
    return {};
  }

  const paintPropertiesByType = {
    fill: ["fill-color", "fill-opacity", "fill-outline-color"],
    line: ["line-color", "line-width", "line-opacity"],
    circle: ["circle-color", "circle-opacity", "circle-radius", "circle-stroke-color", "circle-stroke-width", "circle-stroke-opacity"],
    symbol: ["icon-opacity", "icon-size", "text-opacity"],
    raster: ["raster-opacity"]
  };
  const paint = {};
  (paintPropertiesByType[layer.type] || []).forEach((property) => {
    const value = map.getPaintProperty(layer.id, property);
    if (value !== undefined) {
      paint[property] = value;
    }
  });
  return paint;
}

function describeOldReviewOutlineStyleBranch(layerId, feature, visualDebugState = {}) {
  const properties = feature?.properties || {};
  const targetId = String(properties.id || properties.targetId || feature?.id || "");
  const activeHighlightIds = visualDebugState.activeMemoryTrailHighlightIds || [];
  const correctHighlightIds = visualDebugState.memoryTrailCorrectHighlightIds || [];
  const wrongHighlightIds = visualDebugState.memoryTrailWrongHighlightIds || [];
  const completedIds = visualDebugState.completedIds || [];
  const suppressionActive = Boolean(visualDebugState.memoryTrailSuppressStudyTargetEmphasis);

  if (wrongHighlightIds.includes(targetId)) {
    return "wrong feedback highlight branch";
  }

  if (correctHighlightIds.includes(targetId)) {
    return "correct feedback highlight branch";
  }

  if (activeHighlightIds.includes(targetId)) {
    return "explicit Memory Trail highlight branch";
  }

  if (suppressionActive && (layerId === "state-fill" || layerId === "state-line")) {
    return "Daily Trail active-prompt suppression branch before completedIds";
  }

  if (completedIds.includes(targetId)) {
    return suppressionActive
      ? "completedIds branch while suppression is active"
      : "completedIds branch";
  }

  if (layerId === "us-state-context-line") {
    return "ordinary United States context boundary";
  }

  if (layerId === "target-hit-fill") {
    return "transparent hit-test layer";
  }

  if (visualDebugState.studyPreviewMode && (layerId === "state-fill" || layerId === "state-line")) {
    return "baseline study-preview target styling branch";
  }

  return "ordinary map/style branch";
}

function getRiverPreviewUrlOptions() {
  if (!isLocalDevAccessAllowed()) {
    return null;
  }

  const params = new URLSearchParams(window.location.search || "");
  if (!params.has("riverPreview") && !params.has("river-preview")) {
    return null;
  }

  return {
    targetId: params.get("riverPreview") || params.get("river-preview") || "colorado-river"
  };
}

function getRiverPreviewFeatureBounds(feature) {
  const lines = feature?.geometry?.type === "LineString"
    ? [feature.geometry.coordinates]
    : feature?.geometry?.type === "MultiLineString"
      ? feature.geometry.coordinates
      : [];
  const points = lines.flat();

  if (!points.length) {
    return null;
  }

  const longitudes = points.map(([longitude]) => longitude);
  const latitudes = points.map(([, latitude]) => latitude);
  return [
    [Math.min(...longitudes), Math.min(...latitudes)],
    [Math.max(...longitudes), Math.max(...latitudes)]
  ];
}

function getRiverPreviewLines(geometry) {
  if (geometry?.type === "LineString") {
    return [geometry.coordinates];
  }

  return geometry?.type === "MultiLineString" ? geometry.coordinates : [];
}

function cloneRiverPreviewLine(line) {
  return line.map(([longitude, latitude]) => [longitude, latitude]);
}

function applyRiverCartographicRepairs(riverData, repairData) {
  const repairs = Array.isArray(repairData?.repairs) ? repairData.repairs : [];
  const repairsByRiverId = repairs.reduce((byRiverId, repair) => {
    const riverId = String(repair?.riverId || "");
    if (riverId) {
      const riverRepairs = byRiverId.get(riverId) || [];
      riverRepairs.push(repair);
      byRiverId.set(riverId, riverRepairs);
    }
    return byRiverId;
  }, new Map());
  const appliedRepairs = [];
  const features = (riverData?.features || []).map((feature) => {
    const featureId = feature.properties?.id || "";
    const featureRepairs = repairsByRiverId.get(featureId) || [];
    let lines = getRiverPreviewLines(feature.geometry).map(cloneRiverPreviewLine);

    featureRepairs.forEach((repair) => {
      if (repair.repairType === "endpoint-trim") {
        const omittedParts = new Set(repair.omitOriginalParts || []);
        lines = lines.filter((_, index) => !omittedParts.has(index + 1));
      } else if (repair.geometry?.type === "LineString" && Array.isArray(repair.geometry.coordinates)) {
        lines.push(cloneRiverPreviewLine(repair.geometry.coordinates));
      }
      appliedRepairs.push({
        id: repair.id,
        riverId: repair.riverId,
        repairType: repair.repairType
      });
    });

    return {
      ...feature,
      properties: {
        ...feature.properties,
        cartographicRepairIds: featureRepairs.map((repair) => repair.id)
      },
      geometry: lines.length === 1
        ? { type: "LineString", coordinates: lines[0] }
        : { type: "MultiLineString", coordinates: lines }
    };
  });

  return {
    data: { ...riverData, features },
    appliedRepairs
  };
}

function showRiverPreviewSurface() {
  currentAppScreen = "river-preview-dev";
  document.body.classList.remove("launch-mode", "app-shell-mode", "browse-mode", "overview-mode", "study-mode", "study-explore-mode");
  if (launchScreen) {
    launchScreen.hidden = true;
  }

  if (appShellScreen) {
    appShellScreen.hidden = true;
  }
  studyCard.hidden = true;
  document.querySelector("#answer-panel")?.setAttribute("hidden", "");
  setBrowseDrawerOpen(false);
  setHeaderTitle("U.S. River Preview", { shortTitle: "River Preview" });
}

function getRiverPreviewSnapshot() {
  const map = runner?.map;
  const source = map?.getSource?.(riverPreviewSourceId);

  return {
    enabled: Boolean(source && map?.getLayer?.(riverPreviewBaseLayerId)),
    stateBordersEnabled: Boolean(map?.getLayer?.(riverPreviewStateBorderLayerId)),
    active: riverPreviewActive,
    targetId: riverPreviewTarget?.id || "",
    targetLabel: riverPreviewTarget?.label || "",
    cartographicRepairs: riverPreviewRepairSummary,
    camera: map ? {
      center: [Number(map.getCenter().lng.toFixed(5)), Number(map.getCenter().lat.toFixed(5))],
      zoom: Number(map.getZoom().toFixed(4)),
      bearing: Number(map.getBearing().toFixed(2)),
      pitch: Number(map.getPitch().toFixed(2))
    } : null
  };
}

async function openRiverPreview(options = {}) {
  if (!isLocalDevAccessAllowed()) {
    console.warn("River preview is only available on localhost or file URLs.");
    return null;
  }

  await ensureMapReady();
  const [riverData, repairData] = await Promise.all([
    fetchJson(riverLinesPath),
    fetchJson(riverCartographicRepairsPath)
  ]);
  const features = Array.isArray(riverData?.features) ? riverData.features : [];

  if (features.length === 0) {
    console.warn("River preview requires validated river GeoJSON with at least one line feature.");
    return null;
  }

  const map = runner?.map;
  if (!map) {
    return null;
  }

  closeRiverPreview({ silent: true });

  const requestedTargetId = String(options.targetId || options.target || "colorado-river").trim();
  const target = features.find((feature) => (
    feature.properties?.id === requestedTargetId
    || feature.properties?.label?.toLowerCase() === requestedTargetId.toLowerCase()
  )) || null;
  const targetId = target?.properties?.id || riverPreviewFallbackTargetId;
  const displayData = applyRiverCartographicRepairs(riverData, repairData);
  const source = map.getSource(riverPreviewSourceId);

  if (source) {
    source.setData(displayData.data);
  } else {
    map.addSource(riverPreviewSourceId, {
      type: "geojson",
      data: displayData.data
    });
  }

  if (!map.getLayer(riverPreviewStateBorderLayerId)) {
    map.addLayer({
      id: riverPreviewStateBorderLayerId,
      type: "line",
      source: "us-states-atlas",
      layout: {
        "line-join": "round"
      },
      paint: {
        "line-color": "#64748b",
        "line-width": 0.9,
        "line-opacity": 0.58
      }
    });
  }

  if (!map.getLayer(riverPreviewBaseLayerId)) {
    map.addLayer({
      id: riverPreviewBaseLayerId,
      type: "line",
      source: riverPreviewSourceId,
      layout: {
        "line-cap": "round",
        "line-join": "round"
      },
      paint: {
        "line-color": "#2384c6",
        "line-width": 3.5,
        "line-opacity": 0.92
      }
    });
  }

  if (!map.getLayer(riverPreviewTargetLayerId)) {
    map.addLayer({
      id: riverPreviewTargetLayerId,
      type: "line",
      source: riverPreviewSourceId,
      filter: ["==", ["get", "id"], targetId],
      layout: {
        "line-cap": "round",
        "line-join": "round"
      },
      paint: {
        "line-color": "#fbbf24",
        "line-width": 7,
        "line-opacity": 1
      }
    });
  } else {
    map.setFilter(riverPreviewTargetLayerId, ["==", ["get", "id"], targetId]);
  }

  map.setLayoutProperty(riverPreviewBaseLayerId, "visibility", "visible");
  map.setLayoutProperty(riverPreviewTargetLayerId, "visibility", target ? "visible" : "none");

  const bounds = target ? getRiverPreviewFeatureBounds(target) : [[-126, 24], [-66, 53]];
  if (bounds) {
    map.fitBounds(bounds, {
      padding: { top: 96, right: 96, bottom: 124, left: 96 },
      maxZoom: target ? 5.2 : 3.2,
      duration: 700
    });
  }

  riverPreviewActive = true;
  riverPreviewTarget = target
    ? { id: target.properties?.id || "", label: target.properties?.label || "" }
    : null;
  riverPreviewRepairSummary = displayData.appliedRepairs;

  const snapshot = {
    ...getRiverPreviewSnapshot(),
    targetId: target?.properties?.id || "",
    targetLabel: target?.properties?.label || "",
    featureCount: features.length,
    cartographicRepairs: displayData.appliedRepairs
  };
  console.info("[river-preview] open", snapshot);
  return snapshot;
}

function closeRiverPreview(options = {}) {
  const map = runner?.map;
  const wasActive = riverPreviewActive || Boolean(map?.getSource?.(riverPreviewSourceId));

  [riverPreviewTargetLayerId, riverPreviewBaseLayerId, riverPreviewStateBorderLayerId].forEach((layerId) => {
    if (map?.getLayer?.(layerId)) {
      map.removeLayer(layerId);
    }
  });

  if (map?.getSource?.(riverPreviewSourceId)) {
    map.removeSource(riverPreviewSourceId);
  }

  riverPreviewActive = false;
  riverPreviewTarget = null;
  riverPreviewRepairSummary = [];

  if (options.restoreActivityUi) {
    document.querySelector("#answer-panel")?.removeAttribute("hidden");
  }

  const snapshot = getRiverPreviewSnapshot();
  if (wasActive && !options.silent) {
    console.info("[river-preview] closed", snapshot);
  }
  return snapshot;
}

function normalizeDailyTrailDevOverride(value) {
  if (!value || typeof value !== "object") {
    return null;
  }

  const mode = value.dailyTrailDevMode === "item" ? "item" : value.dailyTrailDevMode === "section" ? "section" : "";
  const goalId = String(value.dailyTrailDevOverrideGoalId || "").trim();
  const activityId = String(value.dailyTrailDevOverrideActivityId || "").trim();
  const itemIds = Array.isArray(value.dailyTrailDevOverrideItemIds)
    ? value.dailyTrailDevOverrideItemIds.map((itemId) => String(itemId || "").trim()).filter(Boolean)
    : [];

  if (!mode || !goalId || (!activityId && itemIds.length === 0)) {
    return null;
  }

  return {
    dailyTrailDevOverrideGoalId: goalId,
    dailyTrailDevOverrideActivityId: activityId,
    dailyTrailDevOverrideItemIds: itemIds,
    dailyTrailDevMode: mode
  };
}

function getDailyTrailDevOverride() {
  if (!isDailyTrailDevAccessAllowed()) {
    return null;
  }

  try {
    return normalizeDailyTrailDevOverride(JSON.parse(localStorage.getItem(dailyTrailDevOverrideStorageKey) || "null"));
  } catch {
    return null;
  }
}

function setDailyTrailDevOverride(override) {
  const normalized = normalizeDailyTrailDevOverride(override);

  if (!normalized || !isDailyTrailDevAccessAllowed()) {
    return null;
  }

  try {
    localStorage.setItem(dailyTrailDevOverrideStorageKey, JSON.stringify(normalized));
  } catch {
    // Dev override remains best-effort; normal Daily Trail is unaffected.
  }

  return normalized;
}

function clearDailyTrailDevOverride(options = {}) {
  try {
    localStorage.removeItem(dailyTrailDevOverrideStorageKey);
  } catch {
    // Nothing to clear if storage is unavailable.
  }

  pendingDailyTrailPlan = null;

  if (!options.silent) {
    clearDailyTrailDevReplayCursor();
    showFeedback("Daily Trail dev override cleared.", true);
  }
}

function getDailyTrailDevGoalModels() {
  return dailyTrailGoals.map((goal) => {
    const journey = journeyPresets.find((candidate) => candidate.id === goal.journeyId);
    const goalItems = getDailyTrailGoalItems(goal, journey);
    const sections = (journey?.steps || []).map((step, stepIndex) => {
      const activity = getActivityById(step.activityId);
      const items = goalItems.filter((item) => item.homeActivityId === step.activityId);

      return {
        id: `${goal.id}:${step.id || step.activityId}`,
        goal,
        journey,
        step,
        stepIndex,
        activity,
        activityId: step.activityId,
        title: step.title || activity?.title || step.activityId,
        subtitle: activity?.title && activity.title !== step.title ? activity.title : step.kind || "",
        items
      };
    }).filter((section) => section.items.length > 0);

    return {
      goal,
      journey,
      sections
    };
  }).filter((model) => model.journey && model.sections.length > 0);
}

function getDailyTrailDevSearchResults(goalModels, query) {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return [];
  }

  const dailyTrailResults = goalModels.flatMap((model) => (
    model.sections.flatMap((section) => (
      section.items
        .filter((item) => item.label.toLowerCase().includes(normalizedQuery) || item.id.toLowerCase().includes(normalizedQuery))
        .map((item) => ({
          goal: model.goal,
          journey: model.journey,
          section,
          item
        }))
    ))
  ));

  return [
    ...dailyTrailResults,
    ...getDailyTrailDevLoadedActivitySearchResults(goalModels, normalizedQuery)
  ].slice(0, 40);
}

function getDailyTrailDevLoadedActivitySearchResults(goalModels, normalizedQuery) {
  const dailyTrailItemIds = new Set(goalModels.flatMap((model) => (
    model.sections.flatMap((section) => section.items.map((item) => item.id))
  )));
  const fallbackGoal = dailyTrailGoals[0] || { id: "world-core", title: "World Core" };
  const fallbackJourney = journeyPresets.find((candidate) => candidate.id === fallbackGoal.journeyId) || null;
  const loadedActivityGoal = {
    id: "daily-trail-dev-loaded-activities",
    title: "Loaded Activities",
    description: "Dev-only access to loaded activity targets.",
    journeyId: fallbackGoal.journeyId
  };

  return activities.flatMap((activity) => (
    (activity.targets || [])
      .map((target, targetIndex) => createDailyTrailDevItem(activity, target, targetIndex))
      .filter((item) => item && !dailyTrailItemIds.has(item.id))
      .filter((item) => item.label.toLowerCase().includes(normalizedQuery) || item.id.toLowerCase().includes(normalizedQuery))
      .map((item) => ({
        goal: loadedActivityGoal,
        journey: fallbackJourney,
        section: {
          id: `loaded-activity:${activity.id}`,
          goal: loadedActivityGoal,
          journey: fallbackJourney,
          step: null,
          stepIndex: 9999,
          activity,
          activityId: activity.id,
          title: activity.title || activity.id,
          subtitle: "Loaded activity",
          items: [item]
        },
        item
      }))
  ));
}

async function openDailyTrailDevMenu() {
  if (!isDailyTrailDevAccessAllowed()) {
    console.warn("Daily Trail dev menu is only available on localhost.");
    return false;
  }

  await ensureMapRuntimeLoaded();
  await ensureActivityDataLoaded();

  const goalModels = getDailyTrailDevGoalModels();
  dailyTrailDevSelectedGoalId ||= goalModels[0]?.goal?.id || "";
  showAppScreen("daily-trail-dev");
  return true;
}

window.openDailyTrailDevMenu = openDailyTrailDevMenu;

function bindDailyTrailDevCheatListener() {
  if (dailyTrailDevCheatListenerBound) {
    return;
  }

  dailyTrailDevCheatListenerBound = true;
  window.addEventListener("keydown", handleDailyTrailDevCheatKeydown, true);
}

function isDailyTrailDevCheatEditableTarget(target) {
  if (!target?.closest) {
    return false;
  }

  return Boolean(target.closest("input, textarea, select, [contenteditable]:not([contenteditable='false'])"));
}

function handleDailyTrailDevCheatKeydown(event) {
  if (
    !isDailyTrailDevAccessAllowed()
    || event.ctrlKey
    || event.metaKey
    || event.altKey
    || event.isComposing
    || event.key.length !== 1
  ) {
    return;
  }

  if (isDailyTrailDevCheatEditableTarget(event.target)) {
    return;
  }

  dailyTrailDevCheatBuffer = `${dailyTrailDevCheatBuffer}${event.key.toLowerCase()}`.slice(-dailyTrailDevCheatCode.length);

  if (dailyTrailDevCheatBuffer === dailyTrailDevCheatCode) {
    dailyTrailDevCheatBuffer = "";
    openDailyTrailDevMenu();
  }
}

function bindCameraDevCheatListener() {
  if (cameraDevCheatListenerBound) {
    return;
  }

  cameraDevCheatListenerBound = true;
  window.addEventListener("keydown", handleCameraDevCheatKeydown, true);
}

function isCameraDevAccessAllowed() {
  return isLocalDevAccessAllowed();
}

function handleCameraDevCheatKeydown(event) {
  if (
    !isCameraDevAccessAllowed()
    || event.ctrlKey
    || event.metaKey
    || event.altKey
    || event.isComposing
    || event.key.length !== 1
  ) {
    return;
  }

  if (isDailyTrailDevCheatEditableTarget(event.target)) {
    return;
  }

  cameraDevCheatBuffer = `${cameraDevCheatBuffer}${event.key.toLowerCase()}`.slice(-cameraDevCheatCode.length);

  if (cameraDevCheatBuffer === cameraDevCheatCode) {
    cameraDevCheatBuffer = "";
    openCameraDevMenu();
  }
}

async function openCameraDevMenu() {
  if (!isCameraDevAccessAllowed()) {
    console.warn("Camera dev menu is only available on localhost.");
    return false;
  }

  await ensureMapReady();
  bindCameraDevMapEvents();
  ensureCameraDevPanel();
  updateCameraDevPanel({ syncInputs: true });
  return true;
}

window.openCameraDevMenu = openCameraDevMenu;

const mountainFindDevSections = Object.freeze({
  western: { index: 0, title: "Western Lower 48" },
  "western-lower-48": { index: 0, title: "Western Lower 48" },
  east: { index: 1, title: "Eastern Mountains" },
  eastern: { index: 1, title: "Eastern Mountains" },
  central: { index: 2, title: "Central Mountains" },
  midwestern: { index: 2, title: "Central Mountains" },
  alaska: { index: 3, title: "Alaska Mountains" }
});

function normalizeMountainFindDevSection(value = "western") {
  const key = String(value || "western").trim().toLowerCase().replace(/\s+/g, "-");
  return mountainFindDevSections[key] || mountainFindDevSections.western;
}

function getMountainFindDevUrlOptions() {
  if (!isLocalDevAccessAllowed()) {
    return null;
  }

  const params = new URLSearchParams(window.location.search || "");
  if (!params.has("mountainFindDev") && !params.has("mountain-find-dev")) {
    return null;
  }

  return {
    section: params.get("section") || params.get("mountainFindSection") || "western",
    target: params.get("target") || params.get("mountainFindTarget") || "Teton Range"
  };
}

function resolveMountainFindDevTarget(memoryTrail, targetRef = "") {
  const requested = String(targetRef || "").trim();
  const normalized = requested.toLowerCase();
  return memoryTrail?.targetPool?.find((target) => (
    target.id === requested
    || target.id.toLowerCase() === normalized
    || getMemoryTrailTargetLabel(target, memoryTrail).toLowerCase() === normalized
    || target.name?.toLowerCase?.() === normalized
  )) || memoryTrail?.targetPool?.[0] || null;
}

function prepareMountainFindDevMemoryTrail(memoryTrail) {
  if (!memoryTrail) {
    return;
  }

  memoryTrail.introducedTargetIds = [...memoryTrail.targetPoolIds];
  memoryTrail.currentPracticeWindow = memoryTrail.targetPool.slice(0, Math.min(MAX_ACTIVE_CHUNK_SIZE, memoryTrail.targetPool.length));
  Object.values(memoryTrail.targetStats || {}).forEach((stats) => {
    stats.isIntroduced = true;
    stats.exposedCount = Math.max(stats.exposedCount || 0, 1);
    stats.guidedTapCount = Math.max(stats.guidedTapCount || 0, 1);
    stats.nextDuePrompt = 0;
  });
}

async function startMountainFindDev(options = {}) {
  if (!isLocalDevAccessAllowed()) {
    console.warn("Mountain Find dev helper is only available on localhost or file URLs.");
    return null;
  }

  mountainFindDevSessionActive = true;
  updateMountainFindDevPanel({
    stage: "starting",
    requestedSection: options.section || options.sectionId || "western",
    requestedTarget: options.target || "Teton Range"
  });

  await ensureMapReady();
  try {
    localStorage.setItem("geography-memory-debug-chip-speech", "true");
  } catch {
    // Debug speech logging is best-effort.
  }

  const journey = journeyPresets.find((candidate) => candidate.id === usMountainRangesActivityId);
  const step = getValidJourneySteps(journey).find((candidate) => candidate.activityId === usMountainRangesActivityId);
  const activity = getActivityById(usMountainRangesActivityId);
  if (!journey || !step || !activity) {
    console.warn("U.S. Mountain Ranges is not loaded yet.");
    return null;
  }

  const section = normalizeMountainFindDevSection(options.section || options.sectionId || "western");
  selectedJourneyId = journey.id;
  await openStudyExploreActivity(journey, step, activity, { autoStartMemoryTrail: false });
  activeStudySession.memoryTrailSectionIndex = section.index;
  startMemoryTrail({ suppressInitialPrompt: true });

  const memoryTrail = getActiveMemoryTrail();
  prepareMountainFindDevMemoryTrail(memoryTrail);
  const snapshot = forceMountainFindDevPrompt(options.target || "Teton Range");
  console.info("[mountain-find-dev] started", {
    section: section.title,
    target: options.target || "Teton Range",
    snapshot
  });
  return snapshot;
}

function forceMountainFindDevPrompt(targetRef = "Teton Range") {
  if (!isLocalDevAccessAllowed()) {
    console.warn("Mountain Find dev helper is only available on localhost or file URLs.");
    return null;
  }

  mountainFindDevSessionActive = true;
  const memoryTrail = getActiveMemoryTrail();
  if (!memoryTrail) {
    console.warn("No active Memory Trail. Run window.mappaMountainFindDev.start() first.");
    return null;
  }

  prepareMountainFindDevMemoryTrail(memoryTrail);
  clearMemoryTrailTimers(memoryTrail);
  clearMemoryTrailTrayFeedback(memoryTrail, "mountain find dev prompt");
  updateMemoryTrailCorrectionCallout(null);
  runner?.setMemoryTrailCorrectionHighlight?.({ correctTargetId: "", wrongTargetId: "" });
  window.GeographyChipSpeech?.stopAudio?.();
  window.speechSynthesis?.cancel();
  memoryTrail.correction = null;
  memoryTrail.trayFeedback = null;
  memoryTrail.responseChipTargetId = null;
  memoryTrail.answerChoices = [];
  memoryTrail.lastSpokenTargetPromptKey = "";

  const target = resolveMountainFindDevTarget(memoryTrail, targetRef);
  if (!target) {
    console.warn("Target not found for Mountain Find dev prompt.", { targetRef });
    return null;
  }

  const didApply = applyMemoryTrailPromptSelection(memoryTrail, {
    targetId: target.id,
    promptType: "name_to_place",
    mode: "dev-find",
    reason: "dev-direct-find-test"
  });
  const snapshot = getMemoryTrailFindPromptDebugSnapshot(memoryTrail, {
    stage: "dev-forced",
    selection: { targetId: target.id, promptType: "name_to_place", mode: "dev-find" },
    target
  });
  console.info("[mountain-find-dev] forced prompt", { didApply, snapshot });
  return snapshot;
}

function getMountainFindDevSnapshot() {
  const memoryTrail = getActiveMemoryTrail();
  const snapshot = getMemoryTrailFindPromptDebugSnapshot(memoryTrail, {
    stage: "dev-snapshot",
    selection: {
      targetId: memoryTrail?.currentPromptTargetId || "",
      promptType: memoryTrail?.currentPromptType || "",
      mode: memoryTrail?.currentPromptMode || ""
    },
    target: getMemoryTrailActivePromptTarget(memoryTrail)
  });
  console.info("[mountain-find-dev] snapshot", snapshot);
  return snapshot;
}

function getMemoryTrailDevExpectedCamera(memoryTrail, target) {
  if (!memoryTrail || !target) {
    return null;
  }

  if (memoryTrail.currentPromptType !== "guided" && memoryTrail.sectionQuizView) {
    return {
      context: "section-quiz-view",
      source: "memory-trail-section-quiz-camera",
      camera: memoryTrail.sectionQuizView
    };
  }

  if (
    memoryTrail.currentPromptType === "guided"
    && runner?.shouldFocusSmallTargetInLearnMode?.(target, { mobile: true })
    && typeof runner?.getSmallTargetLearnFocusTarget === "function"
    && typeof runner?.getTargetFocusCamera === "function"
  ) {
    const focusTarget = runner.getSmallTargetLearnFocusTarget(target);
    return {
      context: "small-target-focus",
      source: "small-target-learn",
      camera: runner.getTargetFocusCamera(focusTarget)
    };
  }

  return null;
}

function getMemoryTrailDevSnapshot() {
  const memoryTrail = getActiveMemoryTrail();
  const target = getMemoryTrailActivePromptTarget(memoryTrail);
  const expectedCamera = getMemoryTrailDevExpectedCamera(memoryTrail, target);
  const nextSection = getNextMemoryTrailSection(session.currentActivity);

  return {
    activity: {
      id: session?.currentActivity?.id || "",
      title: session?.currentActivity?.title || ""
    },
    memoryTrail: memoryTrail ? {
      phase: memoryTrail.phase || "",
      sessionPhase: memoryTrail.sessionPhase || "",
      promptType: memoryTrail.currentPromptType || "",
      promptMode: memoryTrail.currentPromptMode || "",
      section: memoryTrail.sectionTitle || "",
      sectionIndex: memoryTrail.sectionIndex,
      nextSection: nextSection ? {
        title: nextSection.title || "",
        index: nextSection.sectionIndex
      } : null,
      targetId: target?.id || memoryTrail.currentPromptTargetId || "",
      targetLabel: getMemoryTrailActivePromptLabel(memoryTrail),
      expectedCamera
    } : null,
    camera: getMemoryTrailCameraSnapshot(),
    audioMuted: Boolean(window.GeographyChipSpeech?.getAudioMuted?.())
  };
}

function completeMemoryTrailSectionForDev(memoryTrail) {
  clearMemoryTrailTimers(memoryTrail);
  memoryTrail.phase = "complete";
  memoryTrail.sessionPhase = "practice";
  memoryTrail.promptName = "";
  memoryTrail.currentPromptTargetLabel = "";
  memoryTrail.currentPromptTargetId = null;
  memoryTrail.currentPromptKey = "";
  memoryTrail.answerChoices = [];
  memoryTrail.correction = null;
  memoryTrail.message = "Dev section skip complete.";
  runner?.setMemoryTrailHighlight?.([]);
  runner?.setMemoryTrailCorrectionHighlight?.({ correctTargetId: "", wrongTargetId: "" });
  renderStudyExplorePanel();
  showMemoryTrailCompletionOverlay();
}

function skipMemoryTrailSectionForDev() {
  if (!isLocalDevAccessAllowed()) {
    return null;
  }

  if (activeDailyTrailSession && currentAppScreen === "daily-trail-gameplay") {
    return skipDailyTrailSectionForDev();
  }

  const memoryTrail = getActiveMemoryTrail();
  if (!memoryTrail) {
    console.warn("No active Memory Trail section to skip.");
    updateCameraDevPanel();
    return null;
  }

  clearMemoryTrailTimers(memoryTrail);
  clearMemoryTrailTrayFeedback(memoryTrail, "dev skip section");
  updateMemoryTrailCorrectionCallout(null);
  runner?.setMemoryTrailCorrectionHighlight?.({ correctTargetId: "", wrongTargetId: "" });
  runner?.setMemoryTrailHighlight?.([]);
  window.GeographyChipSpeech?.stopAudio?.();
  window.speechSynthesis?.cancel();

  const advanced = startNextMemoryTrailSection();
  if (!advanced) {
    completeMemoryTrailSectionForDev(memoryTrail);
  }

  const snapshot = getMemoryTrailDevSnapshot();
  console.info("[memory-trail-dev] skipped section", { advanced, snapshot });
  updateCameraDevPanel({ syncInputs: true });
  return snapshot;
}

function getPreviousDailyTrailDevSection() {
  if (!activeDailyTrailSession?.journeyId || !activeDailyTrailSession?.activityId) {
    return null;
  }

  const journey = journeyPresets.find((candidate) => candidate.id === activeDailyTrailSession.journeyId);
  const currentStepIndex = journey?.steps?.findIndex((step) => step.activityId === activeDailyTrailSession.activityId) ?? -1;
  const previousStep = currentStepIndex > 0 ? journey.steps[currentStepIndex - 1] : null;

  return previousStep ? { journey, step: previousStep, stepIndex: currentStepIndex - 1 } : null;
}

function getNextDailyTrailDevSection() {
  if (!activeDailyTrailSession?.journeyId || !activeDailyTrailSession?.activityId) {
    return null;
  }

  const journey = journeyPresets.find((candidate) => candidate.id === activeDailyTrailSession.journeyId);
  const currentStepIndex = journey?.steps?.findIndex((step) => step.activityId === activeDailyTrailSession.activityId) ?? -1;
  const nextStep = currentStepIndex >= 0 && currentStepIndex < journey.steps.length - 1
    ? journey.steps[currentStepIndex + 1]
    : null;

  return nextStep ? { journey, step: nextStep, stepIndex: currentStepIndex + 1 } : null;
}

function clearDailyTrailDevReplayCursor() {
  dailyTrailDevReplayCursor = null;
}

function getDailyTrailDevReplayStep(cursor = dailyTrailDevReplayCursor) {
  const journey = cursor?.journeyId
    ? journeyPresets.find((candidate) => candidate.id === cursor.journeyId)
    : null;
  const step = journey?.steps?.[cursor.stepIndex] || null;
  return journey && step ? { journey, step, stepIndex: cursor.stepIndex } : null;
}

async function startDailyTrailDevReplayCursor() {
  const replayStep = getDailyTrailDevReplayStep();
  if (!replayStep) {
    clearDailyTrailDevReplayCursor();
    return false;
  }

  setDailyTrailDevOverride({
    dailyTrailDevOverrideGoalId: dailyTrailDevReplayCursor.trailId,
    dailyTrailDevOverrideActivityId: replayStep.step.activityId,
    dailyTrailDevOverrideItemIds: [],
    dailyTrailDevMode: "section"
  });
  pendingDailyTrailPlan = null;
  await startDailyTrailSession();
  return true;
}

function clearDailyTrailSectionSkipRuntimeStateForDev(memoryTrail = getActiveMemoryTrail()) {
  if (memoryTrail) {
    clearMemoryTrailTimers(memoryTrail);
    clearMemoryTrailTrayFeedback(memoryTrail, "dev skip daily trail section");
  }
  updateMemoryTrailCorrectionCallout(null);
  hideMemoryTrailOverlay();
  runner?.setMemoryTrailCorrectionHighlight?.({ correctTargetId: "", wrongTargetId: "" });
  runner?.setMemoryTrailHighlight?.([]);
  runner?.setCompletedTargets?.([]);
  try {
    window.GeographyChipSpeech?.stopAudio?.();
    window.speechSynthesis?.cancel();
  } catch {
    // Dev-only cleanup must not block section navigation.
  }
  clearMemoryTrailState({ restoreReveals: false });
}

async function skipDailyTrailSectionForDev() {
  const memoryTrail = getActiveMemoryTrail();
  const nextSection = getNextDailyTrailDevSection();
  const trailId = activeDailyTrailSession?.trailId || dailyTrailGoals[0]?.id || "world-core";
  const currentSectionSnapshot = {
    activityId: activeDailyTrailSession?.activityId || "",
    title: session?.currentActivity?.title || activeDailyTrailSession?.activityId || ""
  };

  try {
    clearDailyTrailSectionSkipRuntimeStateForDev(memoryTrail);

    if (!nextSection) {
      console.info("[camera-dev] Final Daily Trail section skipped.", currentSectionSnapshot);
      completeDailyTrailDevReplaySession(memoryTrail);
      return {
        ...currentSectionSnapshot,
        finalSection: true
      };
    }

    dailyTrailDevReplayCursor = {
      trailId,
      journeyId: nextSection.journey.id,
      stepIndex: nextSection.stepIndex
    };
    exitDailyTrailGameplay({ preserveDevReplay: true });
    const didStart = await startDailyTrailDevReplayCursor();

    const snapshot = {
      activityId: nextSection.step.activityId,
      stepIndex: nextSection.stepIndex,
      title: nextSection.step.title || nextSection.step.activityId,
      didStart
    };
    console.info("[camera-dev] Skipped to next Daily Trail section.", snapshot);
    return snapshot;
  } catch (error) {
    console.warn("[camera-dev] Daily Trail section skip failed.", error);
    updateCameraDevPanel({ syncInputs: true });
    return null;
  } finally {
    updateCameraDevPanel({ syncInputs: true });
  }
}

async function backOneDailyTrailSectionForDev() {
  const previousSection = getPreviousDailyTrailDevSection();
  if (!previousSection) {
    console.info("[camera-dev] No previous Daily Trail section is available.");
    updateCameraDevPanel();
    return null;
  }

  const trailId = activeDailyTrailSession?.trailId || dailyTrailGoals[0]?.id || "world-core";
  dailyTrailDevReplayCursor = {
    trailId,
    journeyId: previousSection.journey.id,
    stepIndex: previousSection.stepIndex
  };
  exitDailyTrailGameplay({ preserveDevReplay: true });
  await startDailyTrailDevReplayCursor();

  const snapshot = {
    activityId: previousSection.step.activityId,
    stepIndex: previousSection.stepIndex,
    title: previousSection.step.title || previousSection.step.activityId
  };
  console.info("[camera-dev] Returned to previous Daily Trail section.", snapshot);
  return snapshot;
}

async function backOneMemoryTrailSectionForDev() {
  const previousSection = getPreviousMemoryTrailSection(session.currentActivity);
  if (!previousSection || !activeStudySession) {
    console.info("[camera-dev] No previous Memory Trail section is available.");
    updateCameraDevPanel();
    return null;
  }

  clearMemoryTrailState({ restoreReveals: false });
  activeStudySession.memoryTrailSectionIndex = previousSection.sectionIndex;
  startMemoryTrail();

  const snapshot = getMemoryTrailDevSnapshot();
  console.info("[camera-dev] Returned to previous Memory Trail section.", snapshot);
  updateCameraDevPanel({ syncInputs: true });
  return snapshot;
}

async function backOneSectionForDev() {
  if (!isLocalDevAccessAllowed()) {
    return null;
  }

  if (activeDailyTrailSession && currentAppScreen === "daily-trail-gameplay") {
    return backOneDailyTrailSectionForDev();
  }

  return backOneMemoryTrailSectionForDev();
}

function skipMemoryTrailPromptForDev() {
  if (!isLocalDevAccessAllowed()) {
    return null;
  }

  const memoryTrail = getActiveMemoryTrail();
  const target = getMemoryTrailActivePromptTarget(memoryTrail);
  if (!memoryTrail || !target) {
    console.warn("No active Memory Trail prompt to skip.");
    updateCameraDevPanel();
    return null;
  }

  clearMemoryTrailTimers(memoryTrail);
  clearMemoryTrailTrayFeedback(memoryTrail, "dev skip prompt");
  updateMemoryTrailCorrectionCallout(null);
  runner?.setMemoryTrailCorrectionHighlight?.({ correctTargetId: "", wrongTargetId: "" });
  runner?.setMemoryTrailHighlight?.([]);
  window.GeographyChipSpeech?.stopAudio?.();
  window.speechSynthesis?.cancel();
  memoryTrail.correction = null;
  memoryTrail.trayFeedback = null;
  memoryTrail.responseChipTargetId = null;
  memoryTrail.answerChoices = [];
  handleCorrectMemoryTrailAnswer(memoryTrail, target.id, {
    devSkip: true,
    suppressTargetSpeech: true
  });
  const snapshot = getMemoryTrailDevSnapshot();
  console.info("[memory-trail-dev] completed prompt", { snapshot });
  updateCameraDevPanel({ syncInputs: true });
  return snapshot;
}

if (isLocalDevAccessAllowed()) {
  window.mappaRiverPreview = {
    open: openRiverPreview,
    close: closeRiverPreview,
    snapshot: getRiverPreviewSnapshot
  };
  window.mappaMountainFindDev = {
    start: startMountainFindDev,
    next: forceMountainFindDevPrompt,
    snapshot: getMountainFindDevSnapshot
  };
  window.mappaMemoryTrailDev = {
    skip: skipMemoryTrailPromptForDev,
    skipSection: skipMemoryTrailSectionForDev,
    snapshot: getMemoryTrailDevSnapshot
  };
}

function bindCameraDevMapEvents() {
  const map = runner?.map;

  if (!map || cameraDevMapEventSource === map) {
    return;
  }

  if (cameraDevMapEventSource?.off) {
    cameraDevMapEventSource.off("moveend", handleCameraDevMapMoveEnd);
  }

  cameraDevMapEventSource = map;
  map.on("moveend", handleCameraDevMapMoveEnd);
}

function handleCameraDevMapMoveEnd() {
  updateCameraDevPanel();
}

function ensureCameraDevPanel() {
  ensureCameraDevStyles();
  bindCameraDevViewportListener();

  if (cameraDevPanel?.isConnected) {
    cameraDevPanel.hidden = false;
    setCameraDevPanelCollapsed(isCameraDevMobileViewport());
    return cameraDevPanel;
  }

  const panel = document.createElement("section");
  panel.className = "camera-dev-panel";
  panel.setAttribute("aria-label", "Camera dev tuning panel");

  const header = document.createElement("div");
  header.className = "camera-dev-header";

  const title = document.createElement("h2");
  title.textContent = "Camera Dev";

  const headerActions = document.createElement("div");
  headerActions.className = "camera-dev-header-actions";

  const collapseButton = document.createElement("button");
  collapseButton.type = "button";
  collapseButton.className = "camera-dev-collapse";
  collapseButton.textContent = "Collapse";
  collapseButton.setAttribute("aria-controls", "camera-dev-panel-body");
  collapseButton.addEventListener("click", () => {
    setCameraDevPanelCollapsed(!cameraDevPanelCollapsed);
  });
  cameraDevPanelCollapseButton = collapseButton;

  const closeButton = document.createElement("button");
  closeButton.type = "button";
  closeButton.className = "camera-dev-close";
  closeButton.textContent = "Close";
  closeButton.addEventListener("click", () => {
    panel.hidden = true;
  });

  headerActions.append(collapseButton, closeButton);
  header.append(title, headerActions);

  const intro = document.createElement("p");
  intro.className = "camera-dev-copy";
  intro.textContent = "Local-only camera tuning for temporary auto-fly zoom/center overrides.";

  cameraDevStatusEl = document.createElement("dl");
  cameraDevStatusEl.className = "camera-dev-status";

  const fieldGrid = document.createElement("div");
  fieldGrid.className = "camera-dev-field-grid";

  cameraDevZoomInput = createCameraDevNumberInput("Zoom", "camera-dev-zoom", 0.05);
  cameraDevLngInput = createCameraDevNumberInput("Lng", "camera-dev-lng", 0.0001);
  cameraDevLatInput = createCameraDevNumberInput("Lat", "camera-dev-lat", 0.0001);
  cameraDevBearingInput = createCameraDevNumberInput("Bearing", "camera-dev-bearing", 0.1);
  cameraDevPitchInput = createCameraDevNumberInput("Pitch", "camera-dev-pitch", 0.1);
  fieldGrid.append(
    cameraDevZoomInput.label,
    cameraDevLngInput.label,
    cameraDevLatInput.label,
    cameraDevBearingInput.label,
    cameraDevPitchInput.label
  );

  const scopeLabel = document.createElement("label");
  scopeLabel.className = "camera-dev-field camera-dev-field-wide";
  const scopeText = document.createElement("span");
  scopeText.textContent = "Override scope";
  cameraDevScopeSelect = document.createElement("select");
  [
    ["target-context", "Target + context"],
    ["activity-context", "Activity + context"],
    ["target", "Target"],
    ["activity", "Activity"]
  ].forEach(([value, label]) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = label;
    cameraDevScopeSelect.appendChild(option);
  });
  cameraDevScopeSelect.addEventListener("change", () => {
    updateCameraDevExport();
  });
  scopeLabel.append(scopeText, cameraDevScopeSelect);
  fieldGrid.append(scopeLabel);

  const controls = document.createElement("div");
  controls.className = "camera-dev-actions";

  [
    ["-1 zoom", -1],
    ["-0.5 zoom", -0.5],
    ["Zoom -", -0.1],
    ["Zoom +", 0.1],
    ["+0.5 zoom", 0.5],
    ["+1 zoom", 1]
  ].forEach(([label, delta]) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = label;
    button.addEventListener("click", () => {
      adjustCameraDevZoom(delta);
    });
    controls.appendChild(button);
  });

  const primaryActions = document.createElement("div");
  primaryActions.className = "camera-dev-actions";

  const applyButton = createCameraDevButton("Apply Camera", () => applyCameraDevInputs());
  const useCurrentButton = createCameraDevButton("Use Current Camera", () => updateCameraDevPanel({ syncInputs: true }));
  const saveButton = createCameraDevButton("Save Temporary Override", () => saveCameraDevOverrideFromPanel());
  const resetButton = createCameraDevButton("Reset Dev Camera Override", () => resetCameraDevOverrideForPanel());
  const clearAllButton = createCameraDevButton("Clear All Overrides", () => clearAllCameraDevOverrides());
  primaryActions.append(applyButton, useCurrentButton, saveButton, resetButton, clearAllButton);

  const fitActions = document.createElement("div");
  fitActions.className = "camera-dev-actions";
  fitActions.append(
    createCameraDevButton("Fit Current Target", () => {
      const snapshot = getCameraDevSnapshot();
      runner?.fitCameraDevCurrentTarget?.(snapshot.targetId);
      window.setTimeout(() => updateCameraDevPanel({ syncInputs: true }), 300);
    }),
    createCameraDevButton("Fit Current Section", () => {
      runner?.fitCameraDevCurrentActivity?.();
      window.setTimeout(() => updateCameraDevPanel({ syncInputs: true }), 300);
    })
  );

  const memoryTrailDev = document.createElement("section");
  memoryTrailDev.className = "camera-dev-memory-trail";
  const memoryTrailDevTitle = document.createElement("strong");
  memoryTrailDevTitle.textContent = "Memory Trail QA";
  cameraDevMemoryTrailStatusEl = document.createElement("p");
  cameraDevMemoryTrailStatusEl.className = "camera-dev-memory-trail-status";
  cameraDevMemoryTrailSkipButton = createCameraDevButton("Dev: Next Prompt", () => skipMemoryTrailPromptForDev());
  cameraDevMemoryTrailSectionButton = createCameraDevButton("Dev: Next Section", () => skipMemoryTrailSectionForDev());
  cameraDevMemoryTrailBackSectionButton = createCameraDevButton("Back One Section", () => backOneSectionForDev());
  cameraDevMemoryTrailSkipButton.disabled = true;
  cameraDevMemoryTrailSectionButton.disabled = true;
  cameraDevMemoryTrailBackSectionButton.disabled = true;
  memoryTrailDev.append(
    memoryTrailDevTitle,
    cameraDevMemoryTrailStatusEl,
    cameraDevMemoryTrailSkipButton,
    cameraDevMemoryTrailSectionButton,
    cameraDevMemoryTrailBackSectionButton
  );

  const traceDev = document.createElement("section");
  traceDev.className = "camera-dev-memory-trail";
  const traceDevTitle = document.createElement("strong");
  traceDevTitle.textContent = "Camera Trace";
  cameraDevTraceStatusEl = document.createElement("p");
  cameraDevTraceStatusEl.className = "camera-dev-memory-trail-status";
  const traceActions = document.createElement("div");
  traceActions.className = "camera-dev-actions";
  traceActions.append(
    createCameraDevButton("Copy Trace", () => copyCameraDevTrace()),
    createCameraDevButton("Clear Trace", () => clearCameraDevTrace())
  );
  cameraDevTraceOutput = document.createElement("textarea");
  cameraDevTraceOutput.className = "camera-dev-export";
  cameraDevTraceOutput.readOnly = true;
  cameraDevTraceOutput.rows = 7;
  traceDev.append(traceDevTitle, cameraDevTraceStatusEl, traceActions, cameraDevTraceOutput);

  const exportHeader = document.createElement("div");
  exportHeader.className = "camera-dev-export-header";
  const exportTitle = document.createElement("strong");
  exportTitle.textContent = "Export";
  const copyButton = createCameraDevButton("Copy JSON", () => copyCameraDevExport());
  exportHeader.append(exportTitle, copyButton);

  cameraDevExportOutput = document.createElement("textarea");
  cameraDevExportOutput.className = "camera-dev-export";
  cameraDevExportOutput.readOnly = true;
  cameraDevExportOutput.rows = 9;

  const panelBody = document.createElement("div");
  panelBody.id = "camera-dev-panel-body";
  panelBody.className = "camera-dev-body";
  panelBody.append(intro, cameraDevStatusEl, fieldGrid, controls, primaryActions, fitActions, memoryTrailDev, traceDev, exportHeader, cameraDevExportOutput);

  panel.append(header, panelBody);
  cameraDevPanel = panel;
  cameraDevPanelBody = panelBody;
  setCameraDevPanelCollapsed(isCameraDevMobileViewport());
  document.body.appendChild(panel);
  return panel;
}

function isCameraDevMobileViewport() {
  return Boolean(
    window.matchMedia?.("(max-width: 760px), (max-height: 520px)")?.matches
    || window.innerWidth <= 760
    || window.innerHeight <= 520
  );
}

function setCameraDevPanelCollapsed(collapsed) {
  cameraDevPanelCollapsed = Boolean(collapsed);

  if (!cameraDevPanel) {
    return;
  }

  cameraDevPanel.classList.toggle("is-collapsed", cameraDevPanelCollapsed);
  if (cameraDevPanelBody) {
    cameraDevPanelBody.hidden = cameraDevPanelCollapsed;
    cameraDevPanelBody.setAttribute("aria-hidden", String(cameraDevPanelCollapsed));
  }
  if (cameraDevPanelCollapseButton) {
    cameraDevPanelCollapseButton.textContent = cameraDevPanelCollapsed ? "Camera Dev" : "Collapse";
    cameraDevPanelCollapseButton.setAttribute("aria-label", cameraDevPanelCollapsed ? "Expand Camera Dev" : "Collapse Camera Dev");
    cameraDevPanelCollapseButton.setAttribute("aria-expanded", String(!cameraDevPanelCollapsed));
  }
}

function bindCameraDevViewportListener() {
  if (cameraDevViewportListenerBound) {
    return;
  }

  cameraDevViewportListenerBound = true;
  window.addEventListener("resize", () => {
    if (!cameraDevPanel?.isConnected || cameraDevPanel.hidden || isCameraDevMobileViewport()) {
      return;
    }

    setCameraDevPanelCollapsed(false);
  });
}

function createCameraDevNumberInput(labelText, id, step) {
  const label = document.createElement("label");
  label.className = "camera-dev-field";
  const text = document.createElement("span");
  text.textContent = labelText;
  const input = document.createElement("input");
  input.id = id;
  input.type = "number";
  input.step = String(step);
  input.addEventListener("input", updateCameraDevExport);
  label.append(text, input);
  return { label, input };
}

function createCameraDevButton(label, handler) {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = label;
  button.addEventListener("click", handler);
  return button;
}

function ensureCameraDevStyles() {
  if (cameraDevStylesInjected) {
    return;
  }

  const style = document.createElement("style");
  style.textContent = `
    .camera-dev-panel {
      position: fixed;
      z-index: 10000;
      right: 14px;
      bottom: 14px;
      width: min(420px, calc(100vw - 28px));
      max-height: calc(100vh - 28px);
      overflow: auto;
      padding: 16px;
      border: 1px solid rgba(23, 32, 51, 0.18);
      border-radius: 18px;
      background: rgba(252, 248, 239, 0.97);
      box-shadow: 0 18px 45px rgba(23, 32, 51, 0.22);
      color: #172033;
      font-family: inherit;
    }

    .camera-dev-panel[hidden] {
      display: none;
    }

    .camera-dev-header,
    .camera-dev-export-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }

    .camera-dev-header-actions {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .camera-dev-header h2 {
      margin: 0;
      font-size: 1.25rem;
    }

    .camera-dev-body {
      display: contents;
    }

    .camera-dev-body[hidden] {
      display: none;
    }

    .camera-dev-copy {
      margin: 8px 0 12px;
      font-size: 0.88rem;
      line-height: 1.35;
    }

    .camera-dev-status {
      display: grid;
      grid-template-columns: minmax(96px, max-content) 1fr;
      gap: 5px 10px;
      margin: 0 0 12px;
      font-size: 0.8rem;
    }

    .camera-dev-status dt {
      font-weight: 700;
    }

    .camera-dev-status dd {
      margin: 0;
      overflow-wrap: anywhere;
    }

    .camera-dev-field-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 10px;
      margin-bottom: 12px;
    }

    .camera-dev-field {
      display: grid;
      gap: 4px;
      font-size: 0.78rem;
      font-weight: 700;
    }

    .camera-dev-field-wide {
      grid-column: 1 / -1;
    }

    .camera-dev-field input,
    .camera-dev-field select,
    .camera-dev-export {
      width: 100%;
      box-sizing: border-box;
      border: 1px solid rgba(23, 32, 51, 0.22);
      border-radius: 10px;
      padding: 8px 9px;
      background: #fffdf7;
      color: #172033;
      font: inherit;
    }

    .camera-dev-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin: 8px 0;
    }

    .camera-dev-actions button,
    .camera-dev-collapse,
    .camera-dev-close,
    .camera-dev-export-header button {
      border: 1px solid rgba(23, 32, 51, 0.2);
      border-radius: 999px;
      padding: 7px 11px;
      background: #fff7d6;
      color: #172033;
      font: inherit;
      font-weight: 700;
      cursor: pointer;
    }

    .camera-dev-collapse {
      display: none;
    }

    .camera-dev-actions button:hover,
    .camera-dev-collapse:hover,
    .camera-dev-close:hover,
    .camera-dev-export-header button:hover {
      background: #f7eab5;
    }

    .camera-dev-memory-trail {
      display: grid;
      gap: 6px;
      margin: 12px 0;
      padding: 10px;
      border: 1px solid rgba(23, 32, 51, 0.16);
      border-radius: 10px;
      background: rgba(255, 247, 214, 0.46);
    }

    .camera-dev-memory-trail-status {
      margin: 0;
      font-size: 0.8rem;
      line-height: 1.35;
    }

    .camera-dev-export-header {
      margin-top: 12px;
    }

    .camera-dev-export {
      margin-top: 8px;
      min-height: 150px;
      font-family: Consolas, "Liberation Mono", monospace;
      font-size: 0.76rem;
      resize: vertical;
    }

    @media (max-width: 760px), (max-height: 520px) {
      .camera-dev-panel {
        left: 8px;
        right: 8px;
        top: auto;
        bottom: calc(8px + env(safe-area-inset-bottom, 0px));
        width: auto;
        height: auto;
        max-height: 45vh;
        max-height: 45dvh;
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        padding: 0;
        border-radius: 16px 16px 10px 10px;
      }

      .camera-dev-panel.is-collapsed {
        left: auto;
        right: env(safe-area-inset-right, 0px);
        top: 44%;
        bottom: auto;
        width: 42px;
        height: 108px;
        max-height: none;
        transform: translateY(-50%);
        border-radius: 12px 0 0 12px;
      }

      .camera-dev-header {
        position: sticky;
        top: 0;
        z-index: 1;
        padding: 10px 12px;
        border-bottom: 1px solid rgba(23, 32, 51, 0.14);
        background: rgba(252, 248, 239, 0.98);
      }

      .camera-dev-panel.is-collapsed .camera-dev-header {
        width: 100%;
        height: 100%;
        justify-content: center;
        padding: 0;
        border-bottom: 0;
      }

      .camera-dev-panel.is-collapsed .camera-dev-header h2,
      .camera-dev-panel.is-collapsed .camera-dev-close {
        display: none;
      }

      .camera-dev-panel.is-collapsed .camera-dev-header-actions {
        width: 100%;
        height: 100%;
      }

      .camera-dev-header h2 {
        font-size: 1.05rem;
      }

      .camera-dev-collapse {
        display: inline-flex;
        align-items: center;
        justify-content: center;
      }

      .camera-dev-panel.is-collapsed .camera-dev-collapse {
        width: 100%;
        height: 100%;
        min-width: 42px;
        min-height: 108px;
        border: 0;
        border-radius: 12px 0 0 12px;
        padding: 0;
        writing-mode: vertical-rl;
        text-orientation: mixed;
      }

      .camera-dev-body {
        display: block;
        box-sizing: border-box;
        flex: 1 1 auto;
        min-height: 0;
        overflow-y: auto;
        overscroll-behavior: contain;
        padding: 10px 12px 12px;
      }

      .camera-dev-panel.is-collapsed .camera-dev-body {
        display: none;
      }
    }
  `;
  document.head.appendChild(style);
  cameraDevStylesInjected = true;
}

function getCameraDevSnapshot() {
  const runnerSnapshot = runner?.getCameraDevSnapshot?.() || {};
  const center = runnerSnapshot.center || getMapCameraDebugState()?.center || null;
  const memoryTrail = activeStudySession?.memoryTrail || null;
  const activeTargetId = memoryTrail?.currentPromptTargetId || runnerSnapshot.targetId || "";
  const activeTarget = activeTargetId ? getTargetById(memoryTrail, activeTargetId) : null;

  return {
    ...runnerSnapshot,
    screen: currentAppScreen,
    mode: activeDailyTrailSession ? "daily-trail" : activeJourneySession ? "journey" : activeStudySession ? "study" : currentAppScreen,
    activityId: session?.currentActivity?.id || runnerSnapshot.activityId || "",
    activityTitle: session?.currentActivity?.title || runnerSnapshot.activityTitle || "",
    targetId: activeTarget?.id || runnerSnapshot.targetId || "",
    targetLabel: activeTarget?.name || activeTarget?.label || runnerSnapshot.targetLabel || "",
    cameraContext: runnerSnapshot.cameraContext || "",
    cameraSource: runnerSnapshot.cameraSource || "",
    requestType: runnerSnapshot.requestType || "",
    zoom: runnerSnapshot.zoom,
    center,
    bearing: runnerSnapshot.bearing,
    pitch: runnerSnapshot.pitch
  };
}

function getCameraDevTraceNowMs() {
  return typeof performance !== "undefined" && typeof performance.now === "function"
    ? performance.now()
    : Date.now();
}

function hasCameraDevTraceFlag() {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    const params = new URLSearchParams(window.location.search);
    if (params.has("cameraTrace") || params.has("debugCameraTrace")) {
      return true;
    }
  } catch {
    // Debug-only best effort.
  }

  try {
    return localStorage.getItem("mappa-mundi-camera-trace") === "true";
  } catch {
    return false;
  }
}

function isCameraDevTraceEnabled() {
  return isCameraDevAccessAllowed()
    && (ENABLE_MEMORY_TRAIL_DEBUG || hasCameraDevTraceFlag() || Boolean(cameraDevPanel?.isConnected));
}

function cloneCameraDevTraceJson(value) {
  if (value == null) {
    return null;
  }

  try {
    return JSON.parse(JSON.stringify(value));
  } catch {
    return null;
  }
}

function normalizeCameraDevTraceNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? Number(number.toFixed(5)) : null;
}

function normalizeCameraDevTraceCenter(center) {
  return Array.isArray(center) && center.length >= 2
    ? [normalizeCameraDevTraceNumber(center[0]), normalizeCameraDevTraceNumber(center[1])]
    : null;
}

function normalizeCameraDevTraceCamera(camera = null) {
  if (!camera || typeof camera !== "object") {
    return null;
  }

  const center = normalizeCameraDevTraceCenter(camera.center);
  return {
    center: center?.every(Number.isFinite) ? center : null,
    zoom: normalizeCameraDevTraceNumber(camera.zoom),
    bearing: normalizeCameraDevTraceNumber(camera.bearing),
    pitch: normalizeCameraDevTraceNumber(camera.pitch),
    bounds: normalizeCameraDevTraceBounds(camera.bounds),
    maxZoom: normalizeCameraDevTraceNumber(camera.maxZoom),
    padding: normalizeCameraDevTracePadding(camera.padding),
    offset: normalizeCameraDevTraceOffset(camera.offset),
    duration: normalizeCameraDevTraceNumber(camera.duration)
  };
}

function normalizeCameraDevTraceBounds(bounds) {
  if (
    !Array.isArray(bounds)
    || bounds.length < 2
    || !Array.isArray(bounds[0])
    || !Array.isArray(bounds[1])
  ) {
    return null;
  }

  const normalized = [
    [normalizeCameraDevTraceNumber(bounds[0][0]), normalizeCameraDevTraceNumber(bounds[0][1])],
    [normalizeCameraDevTraceNumber(bounds[1][0]), normalizeCameraDevTraceNumber(bounds[1][1])]
  ];
  return normalized.flat().every(Number.isFinite) ? normalized : null;
}

function normalizeCameraDevTracePadding(padding = null) {
  if (!padding || typeof padding !== "object") {
    return null;
  }

  return {
    top: normalizeCameraDevTraceNumber(padding.top) ?? 0,
    right: normalizeCameraDevTraceNumber(padding.right) ?? 0,
    bottom: normalizeCameraDevTraceNumber(padding.bottom) ?? 0,
    left: normalizeCameraDevTraceNumber(padding.left) ?? 0
  };
}

function normalizeCameraDevTraceOffset(offset = null) {
  if (!offset || typeof offset !== "object") {
    return null;
  }

  const x = normalizeCameraDevTraceNumber(Array.isArray(offset) ? offset[0] : offset.x);
  const y = normalizeCameraDevTraceNumber(Array.isArray(offset) ? offset[1] : offset.y);
  return Number.isFinite(x) && Number.isFinite(y) ? { x, y } : null;
}

function getCameraDevTraceLayoutSnapshot(event = {}) {
  const viewportWidth = window.innerWidth || document.documentElement?.clientWidth || 0;
  const viewportHeight = window.innerHeight || document.documentElement?.clientHeight || 0;
  const canvas = runner?.map?.getCanvas?.();
  const canvasRect = canvas?.getBoundingClientRect?.();
  const rect = canvasRect?.width && canvasRect?.height
    ? canvasRect
    : {
        left: 0,
        top: 0,
        right: viewportWidth,
        bottom: viewportHeight,
        width: viewportWidth,
        height: viewportHeight
      };
  const headerRect = document.querySelector(".poc-header")?.getBoundingClientRect?.();
  const trayRect = document.querySelector("#answer-panel")?.getBoundingClientRect?.();
  const headerBottom = headerRect && headerRect.bottom > rect.top
    ? Math.min(headerRect.bottom, rect.bottom)
    : rect.top;
  const chipTrayTop = trayRect && trayRect.top < rect.bottom
    ? Math.max(trayRect.top, rect.top)
    : rect.bottom;
  const chipTrayHeight = trayRect ? Math.max(0, Math.min(rect.bottom, trayRect.bottom) - Math.max(rect.top, trayRect.top)) : 0;
  const usableTop = Math.min(rect.bottom, Math.max(rect.top, headerBottom));
  const usableBottom = Math.max(usableTop, Math.min(rect.bottom, chipTrayTop));
  const padding = normalizeCameraDevTracePadding(event.padding || event.appliedCamera?.padding || event.requestedCamera?.padding);
  const focusRect = event.layout?.focusRect
    ? cloneCameraDevTraceJson(event.layout.focusRect)
    : padding
      ? {
          left: normalizeCameraDevTraceNumber(padding.left),
          top: normalizeCameraDevTraceNumber(padding.top),
          right: normalizeCameraDevTraceNumber(rect.width - padding.right),
          bottom: normalizeCameraDevTraceNumber(rect.height - padding.bottom),
          width: normalizeCameraDevTraceNumber(rect.width - padding.left - padding.right),
          height: normalizeCameraDevTraceNumber(rect.height - padding.top - padding.bottom)
        }
      : null;

  return {
    viewport: {
      width: Math.round(viewportWidth),
      height: Math.round(viewportHeight)
    },
    mapCanvas: {
      width: Math.round(rect.width || 0),
      height: Math.round(rect.height || 0)
    },
    layout: {
      headerBottom: normalizeCameraDevTraceNumber(headerBottom - rect.top),
      chipTrayTop: normalizeCameraDevTraceNumber(chipTrayTop - rect.top),
      chipTrayHeight: normalizeCameraDevTraceNumber(chipTrayHeight),
      usableTop: normalizeCameraDevTraceNumber(usableTop - rect.top),
      usableBottom: normalizeCameraDevTraceNumber(usableBottom - rect.top),
      usableWidth: normalizeCameraDevTraceNumber(rect.width),
      usableHeight: normalizeCameraDevTraceNumber(usableBottom - usableTop),
      focusRect
    }
  };
}

function getCameraDevTracePromptContext() {
  const memoryTrail = getActiveMemoryTrail();
  const activeTarget = getMemoryTrailActivePromptTarget(memoryTrail);
  const promptPhase = [
    memoryTrail?.sessionPhase,
    memoryTrail?.currentPromptType,
    memoryTrail?.currentPromptMode
  ].filter(Boolean).join("/");

  return {
    promptId: memoryTrail?.currentPromptKey || "",
    promptPhase,
    targetId: activeTarget?.id || memoryTrail?.currentPromptTargetId || "",
    targetLabel: activeTarget?.name || activeTarget?.label || ""
  };
}

function getCameraDevTraceResultingCamera(event = {}) {
  const direct = normalizeCameraDevTraceCamera(event.resultingCamera);
  if (direct) {
    return direct;
  }

  const snapshot = getCameraDevSnapshot();
  return normalizeCameraDevTraceCamera({
    center: snapshot.center,
    zoom: snapshot.zoom,
    bearing: snapshot.bearing,
    pitch: snapshot.pitch
  });
}

function updateCameraDevTraceGlobal(latestEvent = null) {
  if (typeof window === "undefined" || !isCameraDevAccessAllowed()) {
    return;
  }

  window.__mappaCameraTrace = {
    version: 1,
    limit: cameraDevTraceEventLimit,
    count: cameraDevTraceEvents.length,
    latest: latestEvent,
    events: cameraDevTraceEvents.slice()
  };
}

function recordCameraDevTraceEvent(event = {}) {
  if (!isCameraDevTraceEnabled()) {
    return;
  }

  const now = getCameraDevTraceNowMs();
  if (!cameraDevTraceStartedAtMs) {
    cameraDevTraceStartedAtMs = now;
  }

  const snapshot = getCameraDevSnapshot();
  const promptContext = getCameraDevTracePromptContext();
  const layoutSnapshot = getCameraDevTraceLayoutSnapshot(event);
  const requestedCamera = normalizeCameraDevTraceCamera(event.requestedCamera);
  const appliedCamera = normalizeCameraDevTraceCamera(event.appliedCamera);
  const traceEvent = {
    sequence: ++cameraDevTraceSequence,
    timestamp: new Date().toISOString(),
    elapsedMs: Math.round(now - cameraDevTraceStartedAtMs),
    eventType: event.eventType || "camera-event",
    status: event.status || "",
    screen: currentAppScreen || snapshot.screen || "",
    appMode: snapshot.mode || "",
    activityId: event.activityId || snapshot.activityId || "",
    activityTitle: event.activityTitle || snapshot.activityTitle || "",
    sectionIndex: event.sectionIndex ?? snapshot.sectionIndex ?? null,
    sectionTitle: event.sectionTitle || snapshot.sectionTitle || "",
    targetId: event.targetId || promptContext.targetId || snapshot.targetId || "",
    targetLabel: event.targetLabel || promptContext.targetLabel || snapshot.targetLabel || "",
    targetIds: Array.isArray(event.targetIds) ? event.targetIds.slice() : [],
    targetLabels: Array.isArray(event.targetLabels) ? event.targetLabels.slice() : [],
    promptId: event.promptId || promptContext.promptId || "",
    promptPhase: event.promptPhase || promptContext.promptPhase || "",
    cameraContext: event.cameraContext || event.context || snapshot.cameraContext || "",
    cameraSource: event.cameraSource || event.source || snapshot.cameraSource || "",
    requestType: event.requestType || snapshot.requestType || "",
    requestedCamera,
    appliedCamera,
    resultingCamera: getCameraDevTraceResultingCamera(event),
    targetBounds: normalizeCameraDevTraceBounds(event.targetBounds || requestedCamera?.bounds || null),
    sectionBounds: normalizeCameraDevTraceBounds(event.sectionBounds || null),
    viewport: layoutSnapshot.viewport,
    mapCanvas: layoutSnapshot.mapCanvas,
    layout: layoutSnapshot.layout,
    padding: normalizeCameraDevTracePadding(event.padding || appliedCamera?.padding || requestedCamera?.padding),
    offset: normalizeCameraDevTraceOffset(event.offset || appliedCamera?.offset || requestedCamera?.offset),
    requestToken: event.requestToken || "",
    reason: event.reason || ""
  };

  cameraDevTraceEvents.push(traceEvent);
  if (cameraDevTraceEvents.length > cameraDevTraceEventLimit) {
    cameraDevTraceEvents = cameraDevTraceEvents.slice(-cameraDevTraceEventLimit);
  }

  updateCameraDevTraceGlobal(traceEvent);
  updateCameraDevTracePanel();
}

function getCameraDevTraceExport() {
  return {
    version: 1,
    limit: cameraDevTraceEventLimit,
    count: cameraDevTraceEvents.length,
    events: cameraDevTraceEvents
  };
}

function updateCameraDevTracePanel() {
  if (!cameraDevTraceStatusEl || !cameraDevTraceOutput) {
    return;
  }

  const latest = cameraDevTraceEvents[cameraDevTraceEvents.length - 1] || null;
  cameraDevTraceStatusEl.textContent = latest
    ? `${cameraDevTraceEvents.length} events | #${latest.sequence} ${latest.eventType} ${latest.status || ""} ${latest.cameraContext || ""}`.trim()
    : hasCameraDevTraceFlag() || cameraDevPanel?.isConnected
      ? "Trace is armed. Camera requests will appear here."
      : "Open Camera Dev or add ?cameraTrace to capture camera requests.";
  cameraDevTraceOutput.value = JSON.stringify(getCameraDevTraceExport(), null, 2);
}

async function copyCameraDevTrace() {
  updateCameraDevTracePanel();
  const text = cameraDevTraceOutput?.value || JSON.stringify(getCameraDevTraceExport(), null, 2);

  try {
    await navigator.clipboard?.writeText(text);
    showFeedback("Camera trace JSON copied.", true);
  } catch {
    cameraDevTraceOutput?.select();
    showFeedback("Camera trace JSON is selected.");
  }
}

function clearCameraDevTrace() {
  cameraDevTraceEvents = [];
  cameraDevTraceSequence = 0;
  cameraDevTraceStartedAtMs = 0;
  updateCameraDevTraceGlobal(null);
  updateCameraDevTracePanel();
  showFeedback("Camera trace cleared.", true);
}

function updateCameraDevPanel(options = {}) {
  if (!cameraDevPanel?.isConnected || cameraDevPanel.hidden) {
    return;
  }

  const snapshot = getCameraDevSnapshot();
  cameraDevSnapshotValues = snapshot;

  renderCameraDevStatus(snapshot);
  updateCameraDevMemoryTrailControls();

  if (options.syncInputs) {
    syncCameraDevInputs(snapshot);
  }

  if (!cameraDevScopeSelect.value) {
    cameraDevScopeSelect.value = getDefaultCameraDevScope(snapshot);
  }

  updateCameraDevExport();
  updateCameraDevTracePanel();
}

function updateCameraDevMemoryTrailControls() {
  if (
    !cameraDevMemoryTrailSkipButton
    || !cameraDevMemoryTrailSectionButton
    || !cameraDevMemoryTrailBackSectionButton
    || !cameraDevMemoryTrailStatusEl
  ) {
    return;
  }

  const memoryTrail = getActiveMemoryTrail();
  const target = getMemoryTrailActivePromptTarget(memoryTrail);
  const canSkip = Boolean(memoryTrail?.active && target?.id);
  const nextSection = getNextMemoryTrailSection(session.currentActivity);
  const previousSection = activeDailyTrailSession && currentAppScreen === "daily-trail-gameplay"
    ? getPreviousDailyTrailDevSection()
    : getPreviousMemoryTrailSection(session.currentActivity);
  cameraDevMemoryTrailSkipButton.disabled = !canSkip;
  cameraDevMemoryTrailSectionButton.disabled = !memoryTrail?.active;
  cameraDevMemoryTrailBackSectionButton.disabled = !previousSection;
  cameraDevMemoryTrailStatusEl.textContent = canSkip
    ? `${memoryTrail.sectionTitle || "Memory Trail"} | ${memoryTrail.sessionPhase || ""} | ${target.name || target.id}${previousSection ? ` | Previous: ${previousSection.title || previousSection.step?.title || previousSection.step?.activityId}` : " | First section"}${nextSection ? ` | Next: ${nextSection.title}` : " | Final section"}`
    : activeDailyTrailSession
      ? previousSection ? `Previous: ${previousSection.title || previousSection.step?.title || previousSection.step?.activityId}` : "First Daily Trail section."
      : "Start a Memory Trail to enable skipping.";
}

function renderCameraDevStatus(snapshot) {
  if (!cameraDevStatusEl) {
    return;
  }

  const rows = [
    ["Screen/mode", `${snapshot.screen || "unknown"} / ${snapshot.mode || "unknown"}`],
    ["Activity", `${snapshot.activityTitle || "unknown"} (${snapshot.activityId || "none"})`],
    ["Target", snapshot.targetId ? `${snapshot.targetLabel || snapshot.targetId} (${snapshot.targetId})` : "none"],
    ["Context", snapshot.cameraContext || "none"],
    ["Source", snapshot.cameraSource || snapshot.requestType || "none"],
    ["Zoom", formatCameraDevNumber(snapshot.zoom, 4)],
    ["Center", Array.isArray(snapshot.center) ? `${formatCameraDevNumber(snapshot.center[0], 5)}, ${formatCameraDevNumber(snapshot.center[1], 5)}` : "none"],
    ["Bearing", formatCameraDevNumber(snapshot.bearing, 2)],
    ["Pitch", formatCameraDevNumber(snapshot.pitch, 2)]
  ];

  cameraDevStatusEl.innerHTML = "";
  rows.forEach(([label, value]) => {
    const term = document.createElement("dt");
    term.textContent = label;
    const detail = document.createElement("dd");
    detail.textContent = String(value ?? "none");
    cameraDevStatusEl.append(term, detail);
  });
}

function syncCameraDevInputs(snapshot) {
  const center = Array.isArray(snapshot.center) ? snapshot.center : [];
  cameraDevZoomInput.input.value = Number.isFinite(snapshot.zoom) ? snapshot.zoom.toFixed(4) : "";
  cameraDevLngInput.input.value = Number.isFinite(center[0]) ? center[0].toFixed(5) : "";
  cameraDevLatInput.input.value = Number.isFinite(center[1]) ? center[1].toFixed(5) : "";
  cameraDevBearingInput.input.value = Number.isFinite(snapshot.bearing) ? snapshot.bearing.toFixed(2) : "0";
  cameraDevPitchInput.input.value = Number.isFinite(snapshot.pitch) ? snapshot.pitch.toFixed(2) : "0";
  cameraDevScopeSelect.value = getDefaultCameraDevScope(snapshot);
}

function formatCameraDevNumber(value, digits) {
  return Number.isFinite(value) ? value.toFixed(digits) : "none";
}

function getDefaultCameraDevScope(snapshot) {
  if (snapshot.targetId && snapshot.cameraContext) {
    return "target-context";
  }

  if (snapshot.activityId && snapshot.cameraContext) {
    return "activity-context";
  }

  if (snapshot.targetId) {
    return "target";
  }

  return "activity";
}

function getCameraDevInputCamera() {
  const zoom = Number(cameraDevZoomInput?.input.value);
  const lng = Number(cameraDevLngInput?.input.value);
  const lat = Number(cameraDevLatInput?.input.value);
  const bearing = Number(cameraDevBearingInput?.input.value);
  const pitch = Number(cameraDevPitchInput?.input.value);

  return {
    zoom: Number.isFinite(zoom) ? zoom : undefined,
    center: Number.isFinite(lng) && Number.isFinite(lat) ? [lng, lat] : undefined,
    bearing: Number.isFinite(bearing) ? bearing : 0,
    pitch: Number.isFinite(pitch) ? pitch : 0
  };
}

function applyCameraDevInputs() {
  runner?.applyCameraDevCamera?.(getCameraDevInputCamera());
  window.setTimeout(() => updateCameraDevPanel({ syncInputs: true }), 300);
}

function adjustCameraDevZoom(delta) {
  const currentZoom = Number(cameraDevZoomInput?.input.value);
  const fallbackZoom = Number(cameraDevSnapshotValues?.zoom);
  const nextZoom = (Number.isFinite(currentZoom) ? currentZoom : Number.isFinite(fallbackZoom) ? fallbackZoom : 0) + delta;
  cameraDevZoomInput.input.value = nextZoom.toFixed(4);
  applyCameraDevInputs();
}

function normalizeCameraDevOverridesStore(value) {
  if (!value || typeof value !== "object") {
    return { version: 1, overrides: {} };
  }

  return {
    version: 1,
    overrides: value.overrides && typeof value.overrides === "object" ? value.overrides : {}
  };
}

function readCameraDevOverrides() {
  if (!isCameraDevAccessAllowed()) {
    return { version: 1, overrides: {} };
  }

  try {
    return normalizeCameraDevOverridesStore(JSON.parse(localStorage.getItem(cameraDevOverridesStorageKey) || "null"));
  } catch {
    return { version: 1, overrides: {} };
  }
}

function writeCameraDevOverrides(store) {
  if (!isCameraDevAccessAllowed()) {
    return;
  }

  try {
    localStorage.setItem(cameraDevOverridesStorageKey, JSON.stringify(normalizeCameraDevOverridesStore(store), null, 2));
  } catch {
    showFeedback("Camera dev override could not be saved.");
  }
}

function getCameraDevOverrideKey(snapshot, scope) {
  const activityId = String(snapshot.activityId || "").trim();
  const targetId = String(snapshot.targetId || "").trim();
  const cameraContext = String(snapshot.cameraContext || "").trim();

  if (scope === "target-context" && activityId && targetId && cameraContext) {
    return `${activityId}::target:${targetId}::context:${cameraContext}`;
  }

  if (scope === "activity-context" && activityId && cameraContext) {
    return `${activityId}::context:${cameraContext}`;
  }

  if (scope === "target" && activityId && targetId) {
    return `${activityId}::target:${targetId}`;
  }

  if (scope === "activity" && activityId) {
    return activityId;
  }

  return "";
}

function getCameraDevOverrideCandidateKeys(metadata = {}) {
  return [
    getCameraDevOverrideKey(metadata, "target-context"),
    getCameraDevOverrideKey(metadata, "activity-context"),
    getCameraDevOverrideKey(metadata, "target"),
    getCameraDevOverrideKey(metadata, "activity")
  ].filter(Boolean);
}

function getCameraDevOverrideForRequest(metadata = {}) {
  if (!isCameraDevAccessAllowed()) {
    return null;
  }

  const overrides = readCameraDevOverrides().overrides;
  const key = getCameraDevOverrideCandidateKeys(metadata).find((candidateKey) => overrides[candidateKey]);
  return key ? overrides[key] : null;
}

function buildCameraDevOverrideFromPanel() {
  const snapshot = getCameraDevSnapshot();
  const scope = cameraDevScopeSelect?.value || getDefaultCameraDevScope(snapshot);
  const key = getCameraDevOverrideKey(snapshot, scope);
  const camera = getCameraDevInputCamera();

  return {
    key,
    scope,
    override: {
      activityId: snapshot.activityId || "",
      targetId: snapshot.targetId || "",
      label: snapshot.targetLabel || "",
      cameraContext: snapshot.cameraContext || "",
      scope,
      zoom: camera.zoom,
      center: camera.center,
      bearing: camera.bearing,
      pitch: camera.pitch,
      updatedAt: new Date().toISOString()
    }
  };
}

function saveCameraDevOverrideFromPanel() {
  const { key, override } = buildCameraDevOverrideFromPanel();

  if (!key) {
    showFeedback("Camera override needs an activity, target, or context.");
    return;
  }

  const store = readCameraDevOverrides();
  store.overrides[key] = override;
  writeCameraDevOverrides(store);
  updateCameraDevExport();
  showFeedback("Temporary camera override saved.", true);
}

function resetCameraDevOverrideForPanel() {
  const { key } = buildCameraDevOverrideFromPanel();

  if (!key) {
    showFeedback("No camera override scope is selected.");
    return;
  }

  const store = readCameraDevOverrides();
  delete store.overrides[key];
  writeCameraDevOverrides(store);
  updateCameraDevExport();
  showFeedback("Camera dev override reset.", true);
}

function clearAllCameraDevOverrides() {
  writeCameraDevOverrides({ version: 1, overrides: {} });
  updateCameraDevExport();
  showFeedback("All camera dev overrides cleared.", true);
}

function updateCameraDevExport() {
  if (!cameraDevExportOutput) {
    return;
  }

  const { key, override } = buildCameraDevOverrideFromPanel();
  cameraDevExportOutput.value = JSON.stringify({
    key,
    ...override
  }, null, 2);
}

async function copyCameraDevExport() {
  updateCameraDevExport();
  const text = cameraDevExportOutput?.value || "";

  try {
    await navigator.clipboard?.writeText(text);
    showFeedback("Camera override JSON copied.", true);
  } catch {
    cameraDevExportOutput?.select();
    showFeedback("Camera override JSON is selected.");
  }
}

function renderDailyTrailDevScreen() {
  const goalModels = getDailyTrailDevGoalModels();
  const activeOverride = getDailyTrailDevOverride();

  if (!dailyTrailDevSelectedGoalId || !goalModels.some((model) => model.goal.id === dailyTrailDevSelectedGoalId)) {
    dailyTrailDevSelectedGoalId = goalModels[0]?.goal?.id || "";
  }

  const selectedModel = goalModels.find((model) => model.goal.id === dailyTrailDevSelectedGoalId) || goalModels[0] || null;

  const panel = document.createElement("section");
  panel.className = "daily-trail-panel daily-trail-dev-panel";

  const heading = document.createElement("h2");
  heading.textContent = "Daily Trail Dev Menu";

  const copy = document.createElement("p");
  copy.textContent = "Hidden localhost-only controls for jumping into real Daily Trail sections and items without altering progress first.";

  const status = document.createElement("p");
  status.className = activeOverride ? "daily-trail-dev-status daily-trail-dev-status-active" : "daily-trail-dev-status";
  status.textContent = activeOverride
    ? `Active override: ${activeOverride.dailyTrailDevMode} | ${activeOverride.dailyTrailDevOverrideActivityId || "item"}`
    : "No active dev override.";

  const goalLabel = document.createElement("label");
  goalLabel.className = "daily-trail-dev-field";
  const goalText = document.createElement("span");
  goalText.textContent = "Daily Trail goal";
  const goalSelect = document.createElement("select");
  goalSelect.value = dailyTrailDevSelectedGoalId;
  goalModels.forEach((model) => {
    const option = document.createElement("option");
    option.value = model.goal.id;
    option.textContent = model.goal.title;
    goalSelect.appendChild(option);
  });
  goalSelect.addEventListener("change", () => {
    dailyTrailDevSelectedGoalId = goalSelect.value;
    showAppScreen("daily-trail-dev", { pushHistory: false });
  });
  goalLabel.append(goalText, goalSelect);

  const sectionList = document.createElement("div");
  sectionList.className = "daily-trail-dev-section-list";

  if (selectedModel) {
    selectedModel.sections.forEach((section) => {
      sectionList.appendChild(createDailyTrailDevSectionCard(section));
    });
  }

  const searchLabel = document.createElement("label");
  searchLabel.className = "daily-trail-dev-field";
  const searchText = document.createElement("span");
  searchText.textContent = "Search item label or id";
  const searchInput = document.createElement("input");
  searchInput.type = "search";
  searchInput.placeholder = "Cuba";
  searchInput.value = dailyTrailDevSearchQuery;
  searchLabel.append(searchText, searchInput);

  const searchResults = document.createElement("div");
  searchResults.className = "daily-trail-dev-search-results";
  const renderSearchResults = () => {
    dailyTrailDevSearchQuery = searchInput.value;
    searchResults.innerHTML = "";
    const results = getDailyTrailDevSearchResults(goalModels, dailyTrailDevSearchQuery);

    if (!dailyTrailDevSearchQuery.trim()) {
      searchResults.textContent = "Type a label, such as Cuba, to find a Daily Trail item.";
      return;
    }

    if (results.length === 0) {
      searchResults.textContent = "No matching Daily Trail items found.";
      return;
    }

    results.forEach((result) => {
      searchResults.appendChild(createDailyTrailDevSearchResult(result));
    });
  };
  searchInput.addEventListener("input", renderSearchResults);
  renderSearchResults();

  const actions = document.createElement("div");
  actions.className = "daily-trail-actions";

  const resetButton = document.createElement("button");
  resetButton.type = "button";
  resetButton.className = "main-menu-button main-menu-button-quiet";
  resetButton.textContent = "Reset Daily Trail Progress";
  resetButton.addEventListener("click", () => {
    resetDailyTrailProgress();
    clearDailyTrailDevOverride({ silent: true });
    showFeedback("Daily Trail progress reset.", true);
    showAppScreen("daily-trail-dev", { pushHistory: false });
  });

  const clearButton = document.createElement("button");
  clearButton.type = "button";
  clearButton.className = "main-menu-button main-menu-button-quiet";
  clearButton.textContent = "Clear Dev Override";
  clearButton.addEventListener("click", () => {
    clearDailyTrailDevOverride();
    showAppScreen("daily-trail-dev", { pushHistory: false });
  });

  const backButton = document.createElement("button");
  backButton.type = "button";
  backButton.className = "main-menu-button main-menu-button-quiet";
  backButton.textContent = "Main Menu";
  backButton.addEventListener("click", () => showAppScreen("main-menu"));

  actions.append(resetButton, clearButton, backButton);
  panel.append(heading, copy, status, goalLabel, sectionList, searchLabel, searchResults, actions);
  journeyShellContent.appendChild(panel);
}

function createDailyTrailDevSectionCard(section) {
  const card = document.createElement("article");
  card.className = "daily-trail-dev-card";

  const heading = document.createElement("h3");
  heading.textContent = section.title;

  const meta = document.createElement("p");
  meta.textContent = `${section.goal.title} | ${section.activityId} | ${section.items.length} items`;

  const sample = document.createElement("p");
  sample.className = "daily-trail-dev-sample";
  sample.textContent = section.items.slice(0, 8).map((item) => item.label).join(", ");

  const button = document.createElement("button");
  button.type = "button";
  button.className = "main-menu-button main-menu-button-green";
  button.textContent = "Jump to Section";
  button.addEventListener("click", async () => {
    setDailyTrailDevOverride({
      dailyTrailDevOverrideGoalId: section.goal.id,
      dailyTrailDevOverrideActivityId: section.activityId,
      dailyTrailDevOverrideItemIds: [],
      dailyTrailDevMode: "section"
    });
    pendingDailyTrailPlan = null;
    await openDailyTrailIntro();
  });

  card.append(heading, meta, sample, button);
  return card;
}

function createDailyTrailDevSearchResult(result) {
  const row = document.createElement("article");
  row.className = "daily-trail-dev-card daily-trail-dev-result";

  const heading = document.createElement("h3");
  heading.textContent = result.item.label;

  const meta = document.createElement("p");
  meta.textContent = `${result.item.id} | ${result.goal.title} | ${result.section.title} (${result.section.activityId})`;

  const actions = document.createElement("div");
  actions.className = "daily-trail-actions";

  const jumpButton = document.createElement("button");
  jumpButton.type = "button";
  jumpButton.className = "main-menu-button main-menu-button-quiet";
  jumpButton.textContent = "Jump to Section";
  jumpButton.addEventListener("click", async () => {
    setDailyTrailDevOverride({
      dailyTrailDevOverrideGoalId: result.goal.id,
      dailyTrailDevOverrideActivityId: result.section.activityId,
      dailyTrailDevOverrideItemIds: [],
      dailyTrailDevMode: "section"
    });
    pendingDailyTrailPlan = null;
    await openDailyTrailIntro();
  });

  const testButton = document.createElement("button");
  testButton.type = "button";
  testButton.className = "main-menu-button main-menu-button-green";
  testButton.textContent = "Test Item";
  testButton.addEventListener("click", async () => {
    setDailyTrailDevOverride({
      dailyTrailDevOverrideGoalId: result.goal.id,
      dailyTrailDevOverrideActivityId: result.section.activityId,
      dailyTrailDevOverrideItemIds: [result.item.id],
      dailyTrailDevMode: "item"
    });
    pendingDailyTrailPlan = null;
    await startDailyTrailSession();
  });

  actions.append(jumpButton, testButton);
  row.append(heading, meta, actions);
  return row;
}

function renderDailyTrailIntroScreen() {
  const devOverride = getDailyTrailDevOverride();
  const items = getDailyTrailItems({ devOverride });
  const state = syncCompletedDailyTrailGoals(loadDailyTrailState(), items);

  if (!devOverride && shouldShowDailyTrailGoalChoice(state, items)) {
    renderDailyTrailGoalChoiceScreen();
    return;
  }

  const plan = pendingDailyTrailPlan || getDailyTrailPlanForState(state, items, devOverride);
  pendingDailyTrailPlan = plan;

  if (plan.trailCompleted) {
    renderDailyTrailFinishedPanel();
    return;
  }

  const panel = document.createElement("section");
  panel.className = "daily-trail-panel";

  const heading = document.createElement("h2");
  heading.textContent = plan.title || "Daily Trail";

  const stats = document.createElement("div");
  stats.className = "daily-trail-stat-grid";

  [
    ["New today", plan.intro.newCount],
    ["Review", plan.intro.reviewCount],
    ["Next checkpoint", `${plan.intro.sessionsUntilNextCheckpoint} sessions`]
  ].forEach(([label, value]) => {
    const stat = document.createElement("p");
    stat.className = "daily-trail-stat";
    stat.textContent = `${label}: ${value}`;
    stats.appendChild(stat);
  });

  const copy = document.createElement("p");
  copy.textContent = getDailyTrailIntroCopy(plan);

  const focus = document.createElement("p");
  focus.className = "daily-trail-focus";
  focus.textContent = getDailyTrailFocusText(plan);

  const actions = document.createElement("div");
  actions.className = "daily-trail-actions";

  const beginButton = document.createElement("button");
  beginButton.type = "button";
  beginButton.className = "main-menu-button main-menu-button-green";
  const beginButtonLabel = getDailyTrailIntroPrimaryActionLabel(state);
  beginButton.textContent = beginButtonLabel;
  beginButton.setAttribute("aria-label", beginButtonLabel);
  beginButton.title = beginButtonLabel;
  beginButton.addEventListener("click", startDailyTrailSession);

  const backButton = document.createElement("button");
  backButton.type = "button";
  backButton.className = "main-menu-button main-menu-button-quiet";
  backButton.textContent = "Back";
  backButton.addEventListener("click", () => showAppScreen("main-menu"));

  actions.append(beginButton, backButton);
  panel.append(heading, stats, copy, focus, actions);
  journeyShellContent.appendChild(panel);
}

function getDailyTrailIntroPrimaryActionLabel(state = loadDailyTrailState()) {
  return hasDailyTrailProgress(state)
    ? "CONTINUE DAILY TRAIL"
    : "BEGIN DAILY TRAIL";
}

function renderDailyTrailGoalChoiceScreen() {
  const items = getDailyTrailItems();
  const state = syncCompletedDailyTrailGoals(loadDailyTrailState(), items);
  const options = getDailyTrailGoalOptions(state, items);

  const panel = document.createElement("section");
  panel.className = "daily-trail-panel daily-trail-goal-choice-panel";

  const heading = document.createElement("h2");
  heading.textContent = "Choose your next Daily Trail";

  const copy = document.createElement("p");
  copy.textContent = "You finished World Core. Pick where to explore next.";

  const optionList = document.createElement("div");
  optionList.className = "daily-trail-goal-options";

  options.forEach((goal) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "daily-trail-goal-option";
    button.dataset.dailyTrailGoal = goal.id;

    const label = document.createElement("span");
    label.className = "daily-trail-goal-option-title";
    label.textContent = goal.recommended ? `Recommended: ${goal.title}` : goal.title;

    const description = document.createElement("span");
    description.className = "daily-trail-goal-option-copy";
    description.textContent = goal.description;

    button.append(label, description);
    button.addEventListener("click", async () => {
      selectDailyTrailGoal(state, goal.id, items);
      pendingDailyTrailPlan = null;
      await openDailyTrailIntro();
    });

    optionList.appendChild(button);
  });

  const actions = document.createElement("div");
  actions.className = "daily-trail-actions";

  const mainMenuButton = document.createElement("button");
  mainMenuButton.type = "button";
  mainMenuButton.className = "main-menu-button main-menu-button-quiet";
  mainMenuButton.textContent = "Main Menu";
  mainMenuButton.addEventListener("click", () => showAppScreen("main-menu"));

  actions.appendChild(mainMenuButton);
  panel.append(heading, copy, optionList, actions);
  journeyShellContent.appendChild(panel);
}

function getDailyTrailIntroCopy(plan) {
  if (plan.sessionType === "completed-trail-review") {
    return "A short review will revisit places from the trail you completed.";
  }

  if (plan.continentsOceansReviewType === "small") {
    return "A quick Continents and Oceans review will keep the world map fresh.";
  }

  if (plan.continentsOceansReviewType === "full") {
    return "Today revisits Continents and Oceans because it needs more practice.";
  }

  if (plan.sessionType === "checkpoint") {
    return plan.checkpointMixedReview
      ? "A short checkpoint will mix places from the journey so far."
      : "A short checkpoint will check what you have learned recently.";
  }

  if (plan.sessionType === "remediation-session") {
    return "Today focuses on places that need a little more practice.";
  }

  if (plan.sessionType === "remediationCheckpoint") {
    return "A quick check will revisit the places from your review.";
  }

  if (plan.sessionType === "daily-trail-dev-section") {
    return "Dev jump: this one-time Daily Trail session starts at the selected section.";
  }

  if (plan.sessionType === "daily-trail-dev-item") {
    return "Dev test: this one-time Daily Trail session starts with the selected item.";
  }

  return "Warm up with review, learn a few new places, then mix them into practice.";
}

function getDailyTrailFocusText(plan) {
  if (plan.checkpointMixedReview && (plan.activityGroups?.length || 0) > 1) {
    return `Checkpoint across ${plan.activityGroups.length} regions.`;
  }

  const group = plan.cameraGroups?.[0];
  const activityTitle = plan.playItems?.find((item) => item.homeActivityId === plan.activeActivityId)?.activityTitle;

  if (!group && !activityTitle) {
    return "World Core";
  }

  return `Today starts in ${activityTitle || group.cameraGroupId}.`;
}

function getDailyTrailIntroSubtitle() {
  const state = loadDailyTrailState();
  const goal = getDailyTrailGoal(state.activeTrailGoal);
  return `A short guided path through ${goal.title}.`;
}

async function startDailyTrailSession() {
  await ensureMapReady();

  const devOverride = getDailyTrailDevOverride();
  const items = getDailyTrailItems({ devOverride });
  const state = syncCompletedDailyTrailGoals(loadDailyTrailState(), items);
  const plan = pendingDailyTrailPlan || getDailyTrailPlanForState(state, items, devOverride);
  const goal = getDailyTrailGoal(plan.trailGoalId || state.activeTrailGoal);
  const journey = journeyPresets.find((candidate) => candidate.id === goal.journeyId);
  const checkpointActivityGroups = plan.checkpointMixedReview
    ? (plan.activityGroups || []).filter((group) => group?.homeActivityId)
    : [];
  const completedReviewActivityGroups = isSegmentedCompletedDailyTrailReviewPlan(plan)
    ? (plan.activityGroups || []).filter((group) => group?.homeActivityId)
    : [];
  const initialActivityId = checkpointActivityGroups[0]?.homeActivityId
    || completedReviewActivityGroups[0]?.homeActivityId
    || plan.activeActivityId;
  const activity = getActivityById(initialActivityId);

  if (!journey || !activity) {
    showFeedback("Daily Trail is not ready yet.");
    return;
  }

  const isDevReplayStart = Boolean(
    dailyTrailDevReplayCursor
    && dailyTrailDevReplayCursor.journeyId === journey.id
    && dailyTrailDevReplayCursor.stepIndex === journey.steps.findIndex((step) => step.activityId === activity.id)
  );
  const startedState = isDevReplayStart ? state : applyDailyTrailSessionStart(state, plan);
  if (devOverride || plan.devOverride) {
    clearDailyTrailDevOverride({ silent: true });
  }

  activeDailyTrailSession = {
    trailId: plan.trailGoalId || goal.id,
    journeyId: journey.id,
    state: startedState,
    plan,
    activityId: activity.id,
    devReplay: isDevReplayStart,
    checkpointActivityGroups,
    checkpointActivityIndex: 0,
    checkpointResult: null,
    completedReviewActivityGroups,
    completedReviewActivityIndex: 0,
    completedReviewResult: null,
    checkpointTransitionInProgress: false
  };
  publishDailyTrailCheckpointRuntimeSnapshot(null, {
    stage: "daily-trail-session-created"
  });
  pendingDailyTrailPlan = null;
  selectedJourneyId = journey.id;
  await startDailyTrailActivity(activity.id);
}

async function startDailyTrailActivity(activityId) {
  const options = arguments[1] || {};
  const dailyTrailSession = activeDailyTrailSession;
  const activity = getActivityById(activityId);
  if (!dailyTrailSession || !activity) {
    return false;
  }

  const plannedItemsForActivity = getDailyTrailPlannedItemsForActivity(activity, dailyTrailSession.plan);
  const plannedTargetIds = plannedItemsForActivity.map((item) => item.targetId);
  if (plannedTargetIds.length === 0) {
    return false;
  }
  const presentationItemsForActivity = getDailyTrailPresentationItemsForActivity(activity, dailyTrailSession.plan, dailyTrailSession.state, plannedItemsForActivity);
  const presentationTargetIds = presentationItemsForActivity.map((item) => item.targetId).filter(Boolean);

  dailyTrailSession.activityId = activity.id;
  if (isDailyTrailCheckpointPlan(dailyTrailSession.plan)) {
    runner.suppressStudyIntroCameraOnce?.("daily-trail-mixed-checkpoint-context", 5000);
  }
  currentPresentationSettings = getEffectivePresentationSettings(activity, {
    presentationSettings: {
      reviewMode: studyModes.sectionOnly,
      dailyTrailTargetIds: presentationTargetIds.length > 0 ? presentationTargetIds : plannedTargetIds,
      dailyTrailTargetItems: presentationItemsForActivity.map((item) => ({
        targetId: item.targetId,
        homeActivityId: item.homeActivityId
      })),
      dailyTrailVisualContextTargetIds: getDailyTrailVisualContextTargetIds(activity)
    }
  });

  await openActivity(activity.id, {
    appScreen: "daily-trail-gameplay",
    difficultyId: difficultyModes.easy,
    disableActivityProgress: true,
    forceGameplayVisible: true,
    hierarchyNodeId: findHierarchyNodeForActivity(activity.id),
    presentationSettings: currentPresentationSettings
  });

  runner?.setMemoryTrailPreAnswerOutlinesSuppressed?.(dailyTrailSession.plan?.sessionType === "completed-trail-review");
  maybeShowDailyTrailActivityTransitionCue(dailyTrailSession, activity, options.previousActivityId);

  if (activeDailyTrailSession === dailyTrailSession) {
    startDailyTrailMemoryTrailStepIfNeeded();
  }
  return true;
}

function maybeShowDailyTrailActivityTransitionCue(dailyTrailSession, activity, previousActivityId = "") {
  if (
    !dailyTrailSession
    || !activity?.id
    || !previousActivityId
    || previousActivityId === activity.id
    || dailyTrailSession.plan?.sessionType === "completed-trail-review"
  ) {
    return false;
  }

  showDailyTrailTransitionNotice(getDailyTrailActivityTransitionCueText(activity));
  return true;
}

function getDailyTrailActivityTransitionCueText(activity) {
  const title = String(activity?.title || "").trim();
  return title ? `Next stop: ${title}` : "Next stop";
}

function showDailyTrailTransitionNotice(text) {
  const message = String(text || "").trim();
  if (!audioInstructionBanner || !message) {
    return false;
  }

  window.clearTimeout(audioInstructionHideTimer);
  audioInstructionHideTimer = null;
  window.clearTimeout(memoryTrailInstructionBannerTimer);
  memoryTrailInstructionBannerTimer = null;
  window.clearTimeout(dailyTrailTransitionNoticeTimer);
  audioInstructionBanner.textContent = message;
  audioInstructionBanner.hidden = false;
  audioInstructionBanner.classList.remove("memory-trail-instruction-banner");
  audioInstructionBanner.classList.add("daily-trail-transition-banner");

  dailyTrailTransitionNoticeTimer = window.setTimeout(() => {
    if (!audioInstructionBanner?.classList.contains("daily-trail-transition-banner")) {
      return;
    }

    audioInstructionBanner.classList.remove("daily-trail-transition-banner");
    hideAudioInstructionBanner();
  }, 1400);
  return true;
}

function getDailyTrailPlannedItemsForActivity(activity, plan) {
  const playItems = Array.isArray(plan?.playItems) ? plan.playItems.filter(Boolean) : [];
  const directItems = playItems.filter((item) => item.homeActivityId === activity?.id);

  if (!activity || isDailyTrailCheckpointPlan(plan) || isSegmentedCompletedDailyTrailReviewPlan(plan)) {
    return directItems;
  }

  const cumulativeItems = playItems.filter((item) => (
    item.homeActivityId !== activity.id
    && isDailyTrailRenderableActivityItem(activity, item)
  ));

  return dedupeDailyTrailPlannedItems([...directItems, ...cumulativeItems]);
}

function getDailyTrailPresentationItemsForActivity(activity, plan, state, fallbackItems = []) {
  if (!activity || plan?.sessionType !== "completed-trail-review") {
    return fallbackItems;
  }

  const completedActivityItems = (Array.isArray(plan?.allItems) ? plan.allItems : [])
    .filter((item) => item?.homeActivityId === activity.id)
    .filter((item) => !isDailyTrailItemUnseen(state, item));

  return completedActivityItems.length > 0
    ? dedupeDailyTrailPlannedItems(completedActivityItems)
    : fallbackItems;
}

function isDailyTrailRenderableActivityItem(activeActivity, item) {
  if (!activeActivity?.cumulativeGroup || !item?.homeActivityId) {
    return isDailyTrailGlobalShapeReviewItem(activeActivity, item);
  }

  return isDailyTrailCumulativeActivityItem(activeActivity, item)
    || isDailyTrailGlobalShapeReviewItem(activeActivity, item);
}

function isDailyTrailCumulativeActivityItem(activeActivity, item) {
  if (!activeActivity?.cumulativeGroup || !item?.homeActivityId) {
    return false;
  }

  const itemActivity = getActivityById(item.homeActivityId);
  const activeSequence = Number(activeActivity.sequence);
  const itemSequence = Number(itemActivity?.sequence);

  return Boolean(
    itemActivity
    && itemActivity.cumulativeGroup === activeActivity.cumulativeGroup
    && Number.isFinite(activeSequence)
    && Number.isFinite(itemSequence)
    && itemSequence < activeSequence
  );
}

function isDailyTrailGlobalShapeReviewItem(activeActivity, item) {
  const itemActivity = getActivityById(item?.homeActivityId);
  const itemTarget = itemActivity?.targets?.find((target) => target.id === item?.targetId);

  if (
    !itemActivity
    || !itemTarget
    || activeActivity?.id === continentsOceansActivityId
    || itemActivity.id === continentsOceansActivityId
    || itemTarget.kind !== "shape"
  ) {
    return false;
  }

  return isDailyTrailSafeGlobalShapeReviewTarget(itemTarget);
}

function isDailyTrailSafeGlobalShapeReviewTarget(target) {
  return target?.kind === "shape" && target.type === "country";
}

function getDailyTrailVisualContextTargetIds(activity, memoryTrail = null) {
  if (!isDailyTrailStateCapitalsActivity(activity)) {
    return [];
  }

  const state = activeDailyTrailSession?.state || loadDailyTrailState();
  const planItems = activeDailyTrailSession?.plan?.allItems || [];
  const introducedTargetIds = planItems
    .filter((item) => item.trailGoalId === dailyTrailUsCapitalsGoalId)
    .filter((item) => item.type === "capital")
    .filter((item) => (
      !isDailyTrailItemUnseen(state, item)
      || hasDailyTrailMemoryTrailIntroducedTarget(memoryTrail, item.targetId)
    ))
    .map((item) => item.targetId)
    .filter(Boolean);
  const activeSectionTargetIds = (activity.targets || [])
    .filter((target) => target.kind === "point" && target.type === "capital")
    .map((target) => target.id)
    .filter(Boolean);

  return [...new Set([...introducedTargetIds, ...activeSectionTargetIds])];
}

function isDailyTrailStateCapitalsActivity(activity) {
  return Boolean(
    activity?.id?.startsWith("us-capitals-")
    && (activity.targets || []).some((target) => target.kind === "point" && target.type === "capital")
  );
}

function hasDailyTrailMemoryTrailIntroducedTarget(memoryTrail, targetId) {
  const stats = targetId ? memoryTrail?.targetStats?.[targetId] : null;
  return Boolean(stats && hasTargetCompletedGuidedExposure(stats));
}

function refreshDailyTrailCapitalProgressMarkers(memoryTrail = getActiveMemoryTrail()) {
  const activity = getActivityById(activeDailyTrailSession?.activityId);
  if (
    !activeDailyTrailSession
    || currentAppScreen !== "daily-trail-gameplay"
    || !isDailyTrailStateCapitalsActivity(activity)
    || typeof runner?.setVisualPointTargets !== "function"
  ) {
    return false;
  }

  currentPresentationSettings = {
    ...currentPresentationSettings,
    dailyTrailVisualContextTargetIds: getDailyTrailVisualContextTargetIds(activity, memoryTrail)
  };
  const presentedActivity = getPresentedActivity(activity, currentPresentationSettings);
  runner.setVisualPointTargets(presentedActivity?.visualPointTargets || [], presentedActivity?.targets || []);
  return true;
}

function dedupeDailyTrailPlannedItems(items = []) {
  const byTargetId = new Map();

  items.filter(Boolean).forEach((item) => {
    if (item.targetId && !byTargetId.has(item.targetId)) {
      byTargetId.set(item.targetId, item);
    }
  });

  return Array.from(byTargetId.values());
}

function handleDailyTrailActivityCompletion() {
  if (!activeDailyTrailSession || currentAppScreen !== "daily-trail-gameplay") {
    return;
  }

  const { completedCount, targetCount } = getSessionCompletionSummary();
  if (targetCount <= 0 || completedCount !== targetCount) {
    return;
  }

  trackActivityEnd({
    mode: "daily-trail"
  });

  if (activeDailyTrailSession.devReplay) {
    completeDailyTrailDevReplaySession(null);
    return;
  }

  const nextState = applyDailyTrailSessionResults(activeDailyTrailSession.state, activeDailyTrailSession.plan, {
    completedTargetIds: session.completedIds,
    correctCount: session.completedIds.length,
    incorrectCount: Object.values(activityAttemptState.missesByTargetId || {}).reduce((sum, count) => sum + Number(count || 0), 0),
    missesByTargetId: activityAttemptState.missesByTargetId || {}
  });

  lastDailyTrailSummary = nextState.lastSessionSummary;
  activeDailyTrailSession = null;
  showAppScreen("daily-trail-summary", { pushHistory: false });
}

function exitDailyTrailGameplay(options = {}) {
  trackMemoryTrailAbandoned();
  if (!options.preserveDevReplay) {
    clearDailyTrailDevReplayCursor();
  }
  clearMemoryTrailState({ restoreReveals: false });
  activeStudySession = null;
  activeDailyTrailSession = null;
  document.body.classList.remove("study-mode", "study-explore-mode");
  runner?.setStudyPreviewMode(false);
  runner?.setMemoryTrailHighlight([]);
  if (studyCard) {
    studyCard.hidden = true;
  }
  if (answerBank) {
    answerBank.innerHTML = "";
  }
  resetActivityAttemptState();
  showAppScreen("main-menu", { pushHistory: false });
}

function resetDailyTrailProgress() {
  try {
    localStorage.removeItem(dailyTrailStorageKey);
  } catch (error) {
    // localStorage can be unavailable in private or embedded contexts.
  }

  activeDailyTrailSession = null;
  clearDailyTrailDevReplayCursor();
  if (activeStudySession?.dailyTrail) {
    activeStudySession = null;
    runner?.setStudyPreviewMode(false);
    runner?.setMemoryTrailHighlight([]);
    resetActivityAttemptState();
    if (studyCard) {
      studyCard.hidden = true;
    }
    if (answerBank) {
      answerBank.innerHTML = "";
    }
  }
  pendingDailyTrailPlan = null;
  lastDailyTrailSummary = null;
  updateDailyTrailMainMenuButton();
}

async function continueDailyTrailFromSummary() {
  if (dailyTrailDevReplayCursor) {
    dailyTrailDevReplayCursor.stepIndex += 1;
    if (await startDailyTrailDevReplayCursor()) {
      lastDailyTrailSummary = null;
      return;
    }
  }

  pendingDailyTrailPlan = null;
  lastDailyTrailSummary = null;
  await openDailyTrailIntro();
}

async function startCompletedDailyTrailReview() {
  await ensureMapRuntimeLoaded();
  await ensureActivityDataLoaded();

  const items = getDailyTrailItems();
  const state = syncCompletedDailyTrailGoals(loadDailyTrailState(), items);
  const plan = planCompletedDailyTrailReviewSession(state, items);

  if (plan.playItems.length === 0) {
    showFeedback("There is no completed Daily Trail material ready to review yet.");
    return;
  }

  pendingDailyTrailPlan = plan;
  lastDailyTrailSummary = null;
  await startDailyTrailSession();
}

async function startNextDailyTrail() {
  const currentState = loadDailyTrailState();
  const nextGoal = getNextDailyTrailGoal(currentState);

  if (!nextGoal) {
    showFeedback("There is no next Daily Trail available yet.");
    return;
  }

  startNextDailyTrailGoal(currentState, nextGoal.id);
  pendingDailyTrailPlan = null;
  lastDailyTrailSummary = null;
  await openDailyTrailIntro();
}

function startDailyTrailMemoryTrailStepIfNeeded() {
  if (!activeDailyTrailSession || currentAppScreen !== "daily-trail-gameplay") {
    return false;
  }

  const activity = getActivityById(activeDailyTrailSession.activityId);
  const latestState = loadDailyTrailState();

  if (!activity) {
    return false;
  }

  const plannedItemsForActivity = getDailyTrailPlannedItemsForActivity(activity, activeDailyTrailSession.plan);
  const targetIds = plannedItemsForActivity
    .map((item) => item.targetId)
    .filter(Boolean);
  // Camera Dev replays should exercise a section's Learn phase even when its
  // targets are already introduced in persisted Daily Trail progress. This
  // only changes the in-memory Memory Trail session for the dev replay.
  const forceDevReplayLearn = activeDailyTrailSession.devReplay === true;
  const completedTrailReview = activeDailyTrailSession.plan?.sessionType === "completed-trail-review";
  const newTargetIds = forceDevReplayLearn
    ? targetIds
    : completedTrailReview
      ? []
      : plannedItemsForActivity
      .filter((item) => isDailyTrailItemUnseen(latestState, item))
      .map((item) => item.targetId)
      .filter(Boolean);
  const weakReviewTargetIds = plannedItemsForActivity
    .filter((item) => isDailyTrailPlannedWeakReviewItem(activeDailyTrailSession.state, item))
    .map((item) => item.targetId)
    .filter(Boolean);

  if (targetIds.length === 0) {
    return false;
  }

  activeStudySession = {
    journeyId: activeDailyTrailSession.journeyId,
    stepId: "daily-trail",
    activityId: activity.id,
    revealedTargetIds: [],
    memoryTrail: null,
    dailyTrail: true,
    retryReturnState: null,
    journeyPlayReturn: null,
    journeyActivityReturnState: null
  };
  setDailyTrailGameplayHeaderTitle(activeDailyTrailSession);
  if (studyCard) {
    studyCard.hidden = true;
  }
  return startMemoryTrail({
    newTargetIds,
    source: "daily-trail",
    targetIds,
    insertedReviewTargetIds: [
      ...plannedItemsForActivity
        .filter((item) => item.homeActivityId && item.homeActivityId !== activity.id)
        .map((item) => item.targetId)
        .filter(Boolean),
      ...weakReviewTargetIds
    ],
    weakReviewTargetIds,
    checkpointReview: isDailyTrailCheckpointPlan(activeDailyTrailSession.plan),
    completedTrailReview
  });
}

function getUnitedStatesMemoryTrailItems() {
  const journey = journeyPresets.find((candidate) => candidate.id === unitedStatesMemoryTrailJourneyId);
  return buildUnitedStatesMemoryTrailItems(journey, activities);
}

function countUnitedStatesMemoryTrailIntroducedItems(state, items = getUnitedStatesMemoryTrailItems()) {
  return items.filter((item) => state?.itemProgress?.[item.id]?.status && state.itemProgress[item.id].status !== "unseen"
    || state?.introducedItemIds?.includes(item.id)).length;
}

function countUnitedStatesMemoryTrailMasteredItems(state, items = getUnitedStatesMemoryTrailItems()) {
  return items.filter((item) => state?.itemProgress?.[item.id]?.status === "mastered").length;
}

function countUnitedStatesMemoryTrailWeakItems(state, items = getUnitedStatesMemoryTrailItems()) {
  return items.filter((item) => isUnitedStatesMemoryTrailWeakReviewItem(state, item)).length;
}

async function startOrContinueUnitedStatesMemoryTrail() {
  await ensureMapRuntimeLoaded();
  await ensureActivityDataLoaded();

  const items = getUnitedStatesMemoryTrailItems();
  const state = loadUnitedStatesMemoryTrailProgress(items);
  if (state.activeSession?.plan) {
    await resumeUnitedStatesMemoryTrailSession(state);
    return;
  }

  pendingUnitedStatesMemoryTrailPlan = null;
  await startUnitedStatesMemoryTrailSession();
}

async function startUnitedStatesMemoryTrailSession() {
  await ensureMapReady();

  const items = getUnitedStatesMemoryTrailItems();
  const baseState = loadUnitedStatesMemoryTrailProgress(items);
  const plan = pendingUnitedStatesMemoryTrailPlan || planUnitedStatesMemoryTrailSession(baseState, items);
  const activity = getActivityById(plan.activeActivityId);

  if (!activity || plan.playItems.length === 0) {
    showFeedback("United States Memory Trail is not ready yet.");
    return false;
  }

  const startedState = applyUnitedStatesMemoryTrailSessionStart(baseState, plan);
  const savedState = saveUnitedStatesMemoryTrailProgress(startedState, items);
  activeUnitedStatesMemoryTrailSession = {
    trailId: "united-states-memory-trail",
    journeyId: unitedStatesMemoryTrailJourneyId,
    state: savedState,
    plan,
    activityId: activity.id
  };
  pendingUnitedStatesMemoryTrailPlan = null;
  selectedJourneyId = unitedStatesMemoryTrailJourneyId;
  return startUnitedStatesMemoryTrailActivity(activity.id);
}

async function resumeUnitedStatesMemoryTrailSession(state = null) {
  await ensureMapReady();

  const items = getUnitedStatesMemoryTrailItems();
  const normalized = createUnitedStatesMemoryTrailState(state || loadUnitedStatesMemoryTrailProgress(items), items);
  const activeSession = normalized.activeSession;
  const plan = activeSession?.plan;
  const activity = getActivityById(plan?.activeActivityId || plan?.activeSectionId || "");

  if (!plan || !activity || !plan.playItems?.length) {
    const recoveredState = {
      ...normalized,
      activeSession: null
    };
    saveUnitedStatesMemoryTrailProgress(recoveredState, items);
    return startUnitedStatesMemoryTrailSession();
  }

  activeUnitedStatesMemoryTrailSession = {
    trailId: "united-states-memory-trail",
    journeyId: unitedStatesMemoryTrailJourneyId,
    state: normalized,
    plan,
    activityId: activity.id
  };
  selectedJourneyId = unitedStatesMemoryTrailJourneyId;
  return startUnitedStatesMemoryTrailActivity(activity.id, {
    resumeSnapshot: activeSession.memoryTrailSnapshot || activeSession.promptSnapshot || null
  });
}

async function startUnitedStatesMemoryTrailActivity(activityId, options = {}) {
  const trailSession = activeUnitedStatesMemoryTrailSession;
  const activity = getActivityById(activityId);
  if (!trailSession || !activity) {
    return false;
  }

  const plannedItems = getUnitedStatesMemoryTrailPlannedItemsForActivity(activity, trailSession.plan);
  const targetIds = plannedItems.map((item) => item.targetId).filter(Boolean);
  if (targetIds.length === 0) {
    return false;
  }

  trailSession.activityId = activity.id;
  currentPresentationSettings = getEffectivePresentationSettings(activity, {
    presentationSettings: {
      reviewMode: studyModes.sectionOnly,
      adaptiveTrailTargetIds: targetIds,
      adaptiveTrailTargetItems: plannedItems.map((item) => ({
        targetId: item.targetId,
        targetKind: item.targetKind || "",
        type: item.type || "",
        category: item.category || "",
        homeActivityId: item.homeActivityId,
        sourceActivityId: item.sourceActivityId || item.homeActivityId,
        relatedStateTargetId: item.relatedStateTargetId || "",
        relatedStateItemId: item.relatedStateItemId || ""
      })),
      adaptiveTrailVisualContextTargetIds: []
    }
  });

  await openActivity(activity.id, {
    appScreen: "united-states-trail-gameplay",
    difficultyId: difficultyModes.easy,
    disableActivityProgress: true,
    forceGameplayVisible: true,
    hierarchyNodeId: findHierarchyNodeForActivity(activity.id),
    presentationSettings: currentPresentationSettings
  });

  setUnitedStatesMemoryTrailGameplayHeaderTitle();
  if (activeUnitedStatesMemoryTrailSession === trailSession) {
    startUnitedStatesMemoryTrailStepIfNeeded(options.resumeSnapshot);
  }
  return true;
}

function getUnitedStatesMemoryTrailPlannedItemsForActivity(activity, plan) {
  const playItems = Array.isArray(plan?.playItems) ? plan.playItems.filter(Boolean) : [];
  const directItems = playItems.filter((item) => item.homeActivityId === activity?.id);
  const cumulativeItems = playItems.filter((item) => item.homeActivityId !== activity?.id);
  return [...new Map([...directItems, ...cumulativeItems].map((item) => [item.id, item])).values()];
}

function startUnitedStatesMemoryTrailStepIfNeeded(resumeSnapshot = null) {
  if (!activeUnitedStatesMemoryTrailSession || currentAppScreen !== "united-states-trail-gameplay") {
    return false;
  }

  const activity = getActivityById(activeUnitedStatesMemoryTrailSession.activityId);
  if (!activity) {
    return false;
  }

  const plannedItems = getUnitedStatesMemoryTrailPlannedItemsForActivity(activity, activeUnitedStatesMemoryTrailSession.plan);
  const targetIds = plannedItems.map((item) => item.targetId).filter(Boolean);
  const newTargetIds = plannedItems
    .filter((item) => isUnitedStatesMemoryTrailItemUnseen(activeUnitedStatesMemoryTrailSession.state, item))
    .map((item) => item.targetId)
    .filter(Boolean);
  const weakReviewTargetIds = plannedItems
    .filter((item) => isUnitedStatesMemoryTrailWeakReviewItem(activeUnitedStatesMemoryTrailSession.state, item))
    .map((item) => item.targetId)
    .filter(Boolean);

  activeStudySession = {
    journeyId: unitedStatesMemoryTrailJourneyId,
    stepId: "united-states-memory-trail",
    activityId: activity.id,
    revealedTargetIds: [],
    memoryTrail: null,
    unitedStatesMemoryTrail: true,
    retryReturnState: null,
    journeyPlayReturn: null,
    journeyActivityReturnState: null
  };
  setUnitedStatesMemoryTrailGameplayHeaderTitle();
  if (studyCard) {
    studyCard.hidden = true;
  }

  const hasUsTrailResumeSnapshot = resumeSnapshot?.source === UNITED_STATES_MEMORY_TRAIL_SOURCE
    && Boolean(resumeSnapshot.currentPromptTargetId);
  const didStart = startMemoryTrail({
    newTargetIds,
    maxNewTargets: targetIds.length,
    source: UNITED_STATES_MEMORY_TRAIL_SOURCE,
    targetIds,
    insertedReviewTargetIds: plannedItems
      .filter((item) => item.homeActivityId && item.homeActivityId !== activity.id)
      .map((item) => item.targetId)
      .filter(Boolean),
    weakReviewTargetIds,
    sectionTitle: activity.title || "",
    sectionIndex: Number.isFinite(Number(activity.sequence)) ? Number(activity.sequence) - 1 : null,
    sectionQuizView: activity.map?.regionView || null,
    suppressInitialPrompt: hasUsTrailResumeSnapshot
  });

  if (didStart && hasUsTrailResumeSnapshot) {
    const didRestore = restoreUnitedStatesMemoryTrailMemoryTrailSnapshot(activeStudySession.memoryTrail, resumeSnapshot);
    if (!didRestore) {
      promptNextMemoryTrailTarget(activeStudySession?.memoryTrail);
    }
  }

  if (didStart) {
    persistActiveUnitedStatesMemoryTrailSnapshot(activeStudySession.memoryTrail, "active");
  }

  return didStart;
}

function setUnitedStatesMemoryTrailGameplayHeaderTitle() {
  setHeaderTitle("United States", { shortTitle: "United States" });
}

function createUnitedStatesMemoryTrailSnapshot(memoryTrail) {
  if (!memoryTrail || memoryTrail.source !== UNITED_STATES_MEMORY_TRAIL_SOURCE) {
    return null;
  }

  return {
    source: memoryTrail.source,
    activityId: memoryTrail.activityId,
    phase: memoryTrail.phase,
    sessionPhase: memoryTrail.sessionPhase,
    currentPromptTargetId: memoryTrail.currentPromptTargetId,
    currentPromptTargetLabel: memoryTrail.currentPromptTargetLabel,
    currentPromptKey: memoryTrail.currentPromptKey,
    currentPromptType: memoryTrail.currentPromptType,
    currentPromptMode: memoryTrail.currentPromptMode,
    currentPromptReason: memoryTrail.currentPromptReason,
    promptName: memoryTrail.promptName,
    message: memoryTrail.message,
    responseChipTargetId: memoryTrail.responseChipTargetId,
    correction: memoryTrail.correction,
    answerChoices: memoryTrail.answerChoices,
    introducedTargetIds: memoryTrail.introducedTargetIds,
    currentWindowIndex: memoryTrail.currentWindowIndex,
    currentPracticeWindowIds: (memoryTrail.currentPracticeWindow || []).map((target) => target.id),
    promptCount: memoryTrail.promptCount,
    retrievalPromptCount: memoryTrail.retrievalPromptCount,
    correctCount: memoryTrail.correctCount,
    incorrectCount: memoryTrail.incorrectCount,
    recentResults: memoryTrail.recentResults,
    recentRetrievalResults: memoryTrail.recentRetrievalResults,
    promptHistory: memoryTrail.promptHistory,
    targetStats: memoryTrail.targetStats,
    lastPromptedTargetId: memoryTrail.lastPromptedTargetId,
    trayFeedback: memoryTrail.trayFeedback || null
  };
}

function restoreUnitedStatesMemoryTrailMemoryTrailSnapshot(memoryTrail, snapshot = {}) {
  if (!memoryTrail || snapshot?.source !== UNITED_STATES_MEMORY_TRAIL_SOURCE) {
    return false;
  }

  const byId = new Map((memoryTrail.targetPool || []).map((target) => [target.id, target]));
  Object.assign(memoryTrail, {
    phase: snapshot.phase || "answering",
    sessionPhase: snapshot.sessionPhase || "practice",
    currentPromptTargetId: snapshot.currentPromptTargetId || "",
    currentPromptTargetLabel: snapshot.currentPromptTargetLabel || "",
    currentPromptKey: snapshot.currentPromptKey || "",
    currentPromptType: snapshot.currentPromptType || "name_to_place",
    currentPromptMode: snapshot.currentPromptMode || "review",
    currentPromptReason: snapshot.currentPromptReason || "restored prompt",
    promptName: snapshot.promptName || "",
    message: snapshot.message || "",
    responseChipTargetId: snapshot.responseChipTargetId || null,
    correction: snapshot.correction || null,
    answerChoices: Array.isArray(snapshot.answerChoices) ? snapshot.answerChoices : [],
    introducedTargetIds: Array.isArray(snapshot.introducedTargetIds) ? snapshot.introducedTargetIds : memoryTrail.introducedTargetIds,
    currentWindowIndex: Math.max(0, Number(snapshot.currentWindowIndex) || 0),
    promptCount: Math.max(0, Number(snapshot.promptCount) || 0),
    retrievalPromptCount: Math.max(0, Number(snapshot.retrievalPromptCount) || 0),
    correctCount: Math.max(0, Number(snapshot.correctCount) || 0),
    incorrectCount: Math.max(0, Number(snapshot.incorrectCount) || 0),
    recentResults: Array.isArray(snapshot.recentResults) ? snapshot.recentResults : [],
    recentRetrievalResults: Array.isArray(snapshot.recentRetrievalResults) ? snapshot.recentRetrievalResults : [],
    promptHistory: Array.isArray(snapshot.promptHistory) ? snapshot.promptHistory : [],
    targetStats: snapshot.targetStats && typeof snapshot.targetStats === "object" ? snapshot.targetStats : memoryTrail.targetStats,
    lastPromptedTargetId: snapshot.lastPromptedTargetId || null,
    trayFeedback: snapshot.trayFeedback || null
  });
  memoryTrail.currentPracticeWindow = Array.isArray(snapshot.currentPracticeWindowIds)
    ? snapshot.currentPracticeWindowIds.map((targetId) => byId.get(targetId)).filter(Boolean)
    : memoryTrail.currentPracticeWindow;
  memoryTrail.currentPromptStartedAtMs = null;
  runner?.setMemoryTrailStudyTargetEmphasisSuppressed?.(
    shouldSuppressDailyTrailStudyTargetEmphasis(memoryTrail),
    "united-states-trail-restored-prompt"
  );
  runner?.setMemoryTrailHighlight(
    memoryTrail.currentPromptType === "guided" || memoryTrail.currentPromptType === "place_to_name"
      ? memoryTrail.currentPromptTargetId
      : []
  );
  if (memoryTrail.currentPromptType === "guided") {
    fitMapToPracticeWindow(memoryTrail.currentPracticeWindow, "united-states-trail-restore");
  } else {
    applyMemoryTrailSectionQuizCamera(memoryTrail, {
      targetId: memoryTrail.currentPromptTargetId,
      promptType: memoryTrail.currentPromptType,
      mode: memoryTrail.currentPromptMode,
      reason: memoryTrail.currentPromptReason
    }, { duration: 0 });
  }
  renderStudyExplorePanel();
  const resumeAudioPromise = replayCurrentMemoryTrailPromptInstructionOnResume(memoryTrail);
  scheduleMemoryTrailPromptResponseTimer(
    memoryTrail,
    { targetId: memoryTrail.currentPromptTargetId, promptType: memoryTrail.currentPromptType },
    memoryTrail.currentPromptKey,
    resumeAudioPromise
  );

  if (memoryTrail.phase === "feedback") {
    scheduleMemoryTrailStep(memoryTrail, () => {
      runner.setMemoryTrailHighlight([]);
      promptNextMemoryTrailTarget(memoryTrail);
    }, getMemoryTrailCorrectAnswerPauseMs(memoryTrail));
  }

  return true;
}

function isCurrentUnitedStatesMemoryTrailResumePrompt(memoryTrail, promptKey, targetId) {
  return Boolean(
    activeUnitedStatesMemoryTrailSession
    && memoryTrail?.source === UNITED_STATES_MEMORY_TRAIL_SOURCE
    && currentAppScreen === "united-states-trail-gameplay"
    && isCurrentMemoryTrailState(memoryTrail)
    && memoryTrail.currentPromptKey === promptKey
    && memoryTrail.currentPromptTargetId === targetId
  );
}

function getRestoredMemoryTrailPromptSelection(memoryTrail) {
  return {
    targetId: memoryTrail?.currentPromptTargetId || "",
    promptType: memoryTrail?.currentPromptType || "name_to_place",
    mode: memoryTrail?.currentPromptMode || "review",
    reason: memoryTrail?.currentPromptReason || "restored prompt"
  };
}

function replayCurrentMemoryTrailPromptInstructionOnResume(memoryTrail) {
  const promptKey = memoryTrail?.currentPromptKey || "";
  const targetId = memoryTrail?.currentPromptTargetId || "";

  if (!promptKey || !targetId || !isCurrentUnitedStatesMemoryTrailResumePrompt(memoryTrail, promptKey, targetId)) {
    return Promise.resolve(false);
  }

  const selection = getRestoredMemoryTrailPromptSelection(memoryTrail);

  if (memoryTrail.phase === "correction") {
    const correctionMessage = String(
      memoryTrail.trayFeedback?.message
      || memoryTrail.message
      || "Not quite. Tap the correct place to continue."
    ).trim();
    memoryTrail.visibleInstructionText = correctionMessage;
    memoryTrail.instructionLabel = correctionMessage;
    return maybeSpeakMemoryTrailInstruction(
      correctionMessage,
      selection.promptType,
      "correction",
      `correction:${promptKey}`,
      {
        dedupeKey: `${memoryTrail.audioSessionId || "memory-trail"}:${promptKey}:resume-correction`
      }
    ).catch(() => false);
  }

  if (memoryTrail.phase !== "answering") {
    return Promise.resolve(false);
  }

  const target = getTargetById(memoryTrail, targetId);
  if (!target || !isCurrentUnitedStatesMemoryTrailResumePrompt(memoryTrail, promptKey, targetId)) {
    return Promise.resolve(false);
  }

  const instructionSpeechPromise = updateMemoryTrailInstructionCue(memoryTrail, selection);
  let targetSpeechPromise = Promise.resolve(false);

  if (
    isCurrentUnitedStatesMemoryTrailResumePrompt(memoryTrail, promptKey, targetId)
    && shouldSpeakMemoryTrailTargetAtPromptStart(memoryTrail, target, selection)
  ) {
    targetSpeechPromise = speakMemoryTrailPromptTargetAfterInstruction(
      memoryTrail,
      target,
      selection,
      instructionSpeechPromise,
      Promise.resolve(true)
    );
  }

  return Promise.allSettled([instructionSpeechPromise, targetSpeechPromise])
    .then(() => isCurrentUnitedStatesMemoryTrailResumePrompt(memoryTrail, promptKey, targetId))
    .catch(() => false);
}

function persistActiveUnitedStatesMemoryTrailSnapshot(memoryTrail = getActiveMemoryTrail(), status = "active") {
  if (!activeUnitedStatesMemoryTrailSession || !memoryTrail || memoryTrail.source !== UNITED_STATES_MEMORY_TRAIL_SOURCE) {
    return null;
  }

  const items = getUnitedStatesMemoryTrailItems();
  const snapshot = createUnitedStatesMemoryTrailSnapshot(memoryTrail);
  const nextState = applyUnitedStatesMemoryTrailSessionSnapshot(
    activeUnitedStatesMemoryTrailSession.state,
    activeUnitedStatesMemoryTrailSession.plan,
    {
      sessionId: activeUnitedStatesMemoryTrailSession.plan?.sessionId,
      status,
      promptSnapshot: snapshot,
      memoryTrailSnapshot: snapshot
    }
  );
  activeUnitedStatesMemoryTrailSession.state = saveUnitedStatesMemoryTrailProgress(nextState, items);
  return activeUnitedStatesMemoryTrailSession.state;
}

function exitUnitedStatesMemoryTrailGameplay() {
  persistActiveUnitedStatesMemoryTrailSnapshot(getActiveMemoryTrail(), "exited");
  trackMemoryTrailAbandoned();
  clearMemoryTrailState({ restoreReveals: false });
  activeStudySession = null;
  activeUnitedStatesMemoryTrailSession = null;
  document.body.classList.remove("study-mode", "study-explore-mode");
  runner?.setStudyPreviewMode(false);
  runner?.setMemoryTrailHighlight([]);
  if (studyCard) {
    studyCard.hidden = true;
  }
  if (answerBank) {
    answerBank.innerHTML = "";
  }
  resetActivityAttemptState();
  showAppScreen("main-menu", { pushHistory: false });
}

function resetUnitedStatesMemoryTrailProgress() {
  resetUnitedStatesMemoryTrailPersistedProgress();
  activeUnitedStatesMemoryTrailSession = null;
  pendingUnitedStatesMemoryTrailPlan = null;
  lastUnitedStatesMemoryTrailSummary = null;
  unitedStatesMemoryTrailResetConfirmationVisible = false;
  if (activeStudySession?.unitedStatesMemoryTrail) {
    clearMemoryTrailState({ restoreReveals: false });
    activeStudySession = null;
    runner?.setStudyPreviewMode(false);
    runner?.setMemoryTrailHighlight([]);
    resetActivityAttemptState();
  }
  updateUnitedStatesMemoryTrailMainMenuButton();
}

async function continueUnitedStatesMemoryTrailFromSummary() {
  pendingUnitedStatesMemoryTrailPlan = null;
  lastUnitedStatesMemoryTrailSummary = null;
  await startUnitedStatesMemoryTrailSession();
}

function finishUnitedStatesMemoryTrailFromSummary() {
  lastUnitedStatesMemoryTrailSummary = null;
  showAppScreen("main-menu", { pushHistory: false });
}

function renderUnitedStatesMemoryTrailSummary() {
  const items = getUnitedStatesMemoryTrailItems();
  const summary = lastUnitedStatesMemoryTrailSummary
    || loadUnitedStatesMemoryTrailProgress(items).lastSessionSummary
    || {
      newCount: 0,
      reviewCorrectCount: 0,
      weakItems: [],
      introducedCount: 0,
      masteredCount: 0,
      practicedCount: 0
    };
  const panel = document.createElement("section");
  panel.className = "daily-trail-panel";

  const heading = document.createElement("h2");
  heading.textContent = "United States session complete";

  const practiced = document.createElement("p");
  practiced.textContent = `You practiced ${summary.practicedCount || 0} places.`;

  const stats = document.createElement("div");
  stats.className = "daily-trail-stat-grid";
  [
    ["New states introduced", summary.newStateCount ?? summary.newCount ?? 0],
    ["New capitals introduced", summary.newCapitalCount || 0],
    ["Review correct", summary.reviewCorrectCount || 0],
    ["States introduced", `${summary.stateIntroducedCount ?? summary.introducedCount ?? 0}/50`],
    ["Capitals introduced", `${summary.capitalIntroducedCount || 0}/50`],
    ["Total mastered", summary.masteredCount || 0]
  ].forEach(([label, value]) => {
    const stat = document.createElement("p");
    stat.className = "daily-trail-stat";
    stat.textContent = `${label}: ${value}`;
    stats.appendChild(stat);
  });

  const weak = document.createElement("p");
  const weakLabels = (summary.weakItems || []).map((item) => item.label).filter(Boolean);
  weak.textContent = weakLabels.length
    ? `Needs practice: ${weakLabels.join(", ")}`
    : "Needs practice: none this session";

  const actions = document.createElement("div");
  actions.className = "daily-trail-actions";

  const keepGoingButton = document.createElement("button");
  keepGoingButton.type = "button";
  keepGoingButton.className = "main-menu-button main-menu-button-green";
  keepGoingButton.textContent = "Keep Going";
  keepGoingButton.addEventListener("click", continueUnitedStatesMemoryTrailFromSummary);

  const finishButton = document.createElement("button");
  finishButton.type = "button";
  finishButton.className = "main-menu-button main-menu-button-quiet";
  finishButton.textContent = "Finish";
  finishButton.addEventListener("click", finishUnitedStatesMemoryTrailFromSummary);

  actions.append(keepGoingButton, finishButton);
  panel.append(heading, practiced, stats, weak, actions);
  journeyShellContent.appendChild(panel);
}

function isDailyTrailPlannedWeakReviewItem(state, item) {
  if (!item?.id || isDailyTrailItemUnseen(state, item)) {
    return false;
  }

  const progress = state?.itemProgress?.[item.id] || {};
  return (Number(progress.missCount) || 0) > 0
    || (Number(progress.lapseCount) || 0) > 0
    || progress.memoryState === "relearning";
}

function isDailyTrailItemUnseen(state, item) {
  if (!item?.id) {
    return false;
  }

  const progress = state?.itemProgress?.[item.id];
  if (progress?.status) {
    return progress.status === "unseen";
  }

  return !state?.introducedItemIds?.includes(item.id);
}

function renderDailyTrailSummaryScreen() {
  const summary = lastDailyTrailSummary || loadDailyTrailState().lastSessionSummary || {
    practicedCount: 0,
    newCount: 0,
    reviewCount: 0,
    missedNewRetryCount: 0,
    weakItems: [],
    sessionsUntilNextCheckpoint: 3
  };

  const panel = document.createElement("section");
  panel.className = "daily-trail-panel";

  if (summary.trailCompleted) {
    renderDailyTrailFinishedPanel();
    return;
  }

  const heading = document.createElement("h2");
  heading.textContent = summary.sessionType === "checkpoint" && summary.checkpointPassed === false
    ? "Checkpoint Needs Review"
    : "Daily Trail Complete";

  const practiced = document.createElement("p");
  practiced.textContent = `Today you practiced ${summary.practicedCount} places.`;

  const stats = document.createElement("div");
  stats.className = "daily-trail-stat-grid";

  getDailyTrailSummaryMetricRows(summary).forEach(([label, value]) => {
    const stat = document.createElement("p");
    stat.className = "daily-trail-stat";
    stat.textContent = `${label}: ${value}`;
    stats.appendChild(stat);
  });

  const weak = document.createElement("p");
  const weakLabels = (summary.weakItems || []).map((item) => item.label).filter(Boolean);
  weak.textContent = weakLabels.length
    ? `Needs practice: ${weakLabels.join(", ")}`
    : "Needs practice: none today";

  const actions = document.createElement("div");
  actions.className = "daily-trail-actions";

  const continueButton = document.createElement("button");
  continueButton.type = "button";
  continueButton.className = "main-menu-button main-menu-button-green";
  continueButton.textContent = "Continue Trail";
  continueButton.addEventListener("click", continueDailyTrailFromSummary);

  actions.appendChild(continueButton);
  panel.append(heading, practiced, stats, weak, actions);
  journeyShellContent.appendChild(panel);
}

function getDailyTrailSummaryMetricRows(summary = {}) {
  const rows = [];
  const sessionType = summary.sessionType || "learning-session";
  const isCheckpoint = sessionType === "checkpoint" || sessionType === "remediationCheckpoint";
  const newCount = Math.max(0, Number(summary.newCount) || 0);
  const reviewCount = Math.max(0, Number(summary.reviewCount) || 0);
  const missedNewRetryCount = Math.max(0, Number(summary.missedNewRetryCount) || 0);
  const sessionsUntilNextCheckpoint = Math.max(0, Number(summary.sessionsUntilNextCheckpoint) || 0);

  if (isCheckpoint) {
    rows.push(["Checkpoint", summary.checkpointPassed === false ? "Review needed" : "Passed"]);
    const correct = Number(summary.checkpointCorrectCount);
    const incorrect = Number(summary.checkpointIncorrectCount);
    if (Number.isFinite(correct) && Number.isFinite(incorrect)) {
      rows.push(["Checkpoint result", `${Math.max(0, correct)} / ${Math.max(0, correct + incorrect)} correct`]);
    }
  }

  if (newCount > 0) {
    rows.push(["New places learned", newCount]);
  }

  if (reviewCount > 0) {
    rows.push(["Review items strengthened", reviewCount]);
  }

  if (missedNewRetryCount > 0) {
    rows.push(["Missed items retried", missedNewRetryCount]);
  }

  if (!isCheckpoint || summary.checkpointPassed !== false) {
    rows.push(["Next checkpoint", `${sessionsUntilNextCheckpoint} ${sessionsUntilNextCheckpoint === 1 ? "segment" : "segments"}`]);
  }

  return rows;
}

function renderDailyTrailFinishedPanel() {
  const items = getDailyTrailItems();
  const state = syncCompletedDailyTrailGoals(loadDailyTrailState(), items);
  const activeGoal = getDailyTrailGoal(state.activeTrailGoal);
  const nextGoal = getNextDailyTrailGoal(state);
  const reviewPlan = planCompletedDailyTrailReviewSession(state, items);
  const panel = document.createElement("section");
  panel.className = "daily-trail-panel";

  const heading = document.createElement("h2");
  heading.textContent = "Daily Trail complete";

  const copy = document.createElement("p");
  copy.textContent = nextGoal
    ? `You finished ${activeGoal.title}. Start the next trail or review what you've learned.`
    : "You've finished the available Daily Trail content. You can review what you've learned or choose another activity.";

  const actions = document.createElement("div");
  actions.className = "daily-trail-actions";

  if (nextGoal) {
    const nextButton = document.createElement("button");
    nextButton.type = "button";
    nextButton.className = "main-menu-button main-menu-button-green";
    nextButton.textContent = "Start Next Daily Trail";
    nextButton.addEventListener("click", startNextDailyTrail);
    actions.appendChild(nextButton);
  }

  if (reviewPlan.playItems.length > 0) {
    const reviewButton = document.createElement("button");
    reviewButton.type = "button";
    reviewButton.className = "main-menu-button main-menu-button-quiet";
    reviewButton.textContent = "Review Completed Trail";
    reviewButton.addEventListener("click", startCompletedDailyTrailReview);
    actions.appendChild(reviewButton);
  }

  const mainMenuButton = document.createElement("button");
  mainMenuButton.type = "button";
  mainMenuButton.className = "main-menu-button main-menu-button-quiet";
  mainMenuButton.textContent = "Choose Another Activity";
  mainMenuButton.addEventListener("click", () => showAppScreen("main-menu"));

  actions.appendChild(mainMenuButton);
  panel.append(heading, copy, actions);
  journeyShellContent.appendChild(panel);
}

function renderJourneyDetail(journey) {
  const isAvailable = isJourneyAvailable(journey);
  const status = getEffectiveJourneyStatus(journey);
  const hasMemoryTrailEligibleStep = getJourneyMemoryTrailEligibleSteps(journey).length > 0;
  const detailIntent = normalizeJourneyDetailIntent(selectedJourneyDetailIntent);
  const isLearnIntent = detailIntent === "learn";
  const isChallengeIntent = detailIntent === "challenge";
  const thumbnailSrc = getJourneyThumbnailSrc(journey);
  const summary = document.createElement("section");
  summary.className = "journey-detail-summary";

  const heading = document.createElement("h2");
  heading.textContent = journey.title;

  const description = document.createElement("p");
  description.textContent = journey.description;

  const meta = document.createElement("p");
  meta.className = "journey-preset-meta";
  meta.textContent = formatJourneyStepCount(getValidJourneySteps(journey).length);

  summary.append(heading, description, meta);

  if (isLearnIntent || isChallengeIntent) {
    const pathMessage = document.createElement("p");
    pathMessage.className = "journey-detail-progress";
    pathMessage.textContent = isLearnIntent
      ? "Learn each section with Memory Trail, then play when you are ready."
      : "Choose your difficulty, then start the journey.";
    summary.appendChild(pathMessage);
  }

  if (!isAvailable) {
    const statusMessage = document.createElement("p");
    statusMessage.className = "journey-detail-progress";
    statusMessage.textContent = getUnavailableJourneyMessage(journey);
    summary.appendChild(statusMessage);
  }

  const progressSummary = getJourneyProgressSummary(journey);
  if (progressSummary.total > 0 && progressSummary.bestCompletedCount > 0) {
    const progress = document.createElement("p");
    progress.className = "journey-detail-progress";
    progress.textContent = `Progress: ${progressSummary.bestCompletedCount} of ${progressSummary.total} activities completed`;
    summary.appendChild(progress);

    const difficultyProgress = document.createElement("p");
    difficultyProgress.className = "journey-preset-meta";
    difficultyProgress.textContent = journeyDifficultyOptions
      .map((difficulty) => `${difficulty.title}: ${progressSummary.counts[difficulty.id]} / ${progressSummary.total}`)
      .join(" | ");
    summary.appendChild(difficultyProgress);
  }

  if (getValidJourneySteps(journey).length > 0) {
    const stepList = document.createElement("ol");
    stepList.className = "journey-step-list";

    getValidJourneySteps(journey).forEach((step) => {
      const item = document.createElement("li");
      item.textContent = step.title;
      stepList.appendChild(item);
    });

    summary.appendChild(stepList);
  }

  const actions = document.createElement("div");
  actions.className = "journey-path-actions";

  if (isAvailable) {
    const showStudyAction = !isChallengeIntent;
    const showPlayAction = !isLearnIntent;
    const playState = getSelectedJourneyProgressState(journey);
    const difficultyLabel = getJourneyDifficultyLabel(playState.difficultyId);
    const playAction = playState.isComplete
      ? {
          title: "Play Again",
          description: `${difficultyLabel} is complete. Review this journey from the beginning without deleting your progress.`,
          buttonLabel: "Review From Beginning",
          onClick: startSelectedJourneyFromBeginning
        }
      : playState.hasPartialProgress
        ? {
            title: "Continue or Replay",
            description: `${difficultyLabel}: ${playState.completedCount} of ${playState.total} complete.`,
            buttonLabel: "Pick Up Where You Left Off",
            onClick: resumeSelectedJourney,
            secondaryButtonLabel: "Start From Beginning",
            onSecondaryClick: startSelectedJourneyFromBeginning
          }
        : {
            title: "Start Journey",
            description: `Start ${journey.title} on ${difficultyLabel}.`,
            buttonLabel: "Start Journey",
            onClick: startSelectedJourneyFromBeginning
          };

    const studyAction = hasMemoryTrailEligibleStep
      ? {
          title: "Learn with Memory Trail",
          description: "Study a section with guided map memory before playing.",
          buttonLabel: "Learn with Memory Trail",
          infoText: "Learn a few places, then practice finding and naming them from memory. Missed places come back for review, and the session adjusts as you play."
        }
      : {
          title: "Study This Journey",
          description: "Preview the places before playing.",
          buttonLabel: "Study This Journey",
          infoText: ""
        };

    if (showStudyAction) {
      actions.appendChild(createJourneyPathCard({
        title: studyAction.title,
        description: studyAction.description,
        buttonLabel: studyAction.buttonLabel,
        variant: "study",
        onClick: () => showAppScreen("study"),
        infoText: studyAction.infoText
      }));
    }

    if (showPlayAction) {
      actions.appendChild(createJourneyPathCard({
        title: playAction.title,
        description: playAction.description,
        buttonLabel: playAction.buttonLabel,
        variant: "play",
        onClick: playAction.onClick,
        secondaryButtonLabel: playAction.secondaryButtonLabel,
        onSecondaryClick: playAction.onSecondaryClick,
        tertiaryButtonLabel: "Choose Difficulty",
        onTertiaryClick: () => showAppScreen("choose-difficulty")
      }));
    }
  } else {
    actions.append(createJourneyPathCard({
      title: status === "locked" ? "Locked" : "Coming Soon",
      description: getUnavailableJourneyMessage(journey),
      buttonLabel: status === "locked" ? "Locked" : "Coming soon",
      variant: "locked",
      disabled: true,
      onClick: () => {}
    }));
  }

  if (thumbnailSrc) {
    const hero = document.createElement("section");
    hero.className = "journey-detail-hero";

    const art = document.createElement("div");
    art.className = "journey-detail-art";
    art.setAttribute("aria-hidden", "true");

    const image = document.createElement("img");
    image.src = thumbnailSrc;
    image.alt = "";
    image.loading = "lazy";
    image.decoding = "async";
    image.width = 960;
    image.height = 540;
    art.appendChild(image);

    hero.append(art, actions);
    journeyShellContent.append(hero, summary);
  } else {
    journeyShellContent.append(actions, summary);
  }

  const secondaryActions = document.createElement("div");
  secondaryActions.className = "journey-secondary-actions";

  const restartButton = document.createElement("button");
  restartButton.type = "button";
  restartButton.className = "journey-restart-button";
  restartButton.textContent = "Restart Journey";
  restartButton.addEventListener("click", restartSelectedJourneyDifficulty);

  const backButton = document.createElement("button");
  backButton.type = "button";
  backButton.className = "journey-restart-button journey-back-button";
  backButton.textContent = "Back to Journeys";
  backButton.addEventListener("click", () => {
    journeyPickerIntent = detailIntent;
    showAppScreen("choose-journey");
  });

  if (isAvailable && !isLearnIntent) {
    secondaryActions.appendChild(restartButton);
  }

  secondaryActions.appendChild(backButton);
  journeyShellContent.appendChild(secondaryActions);
}

function createJourneyPathCard({
  title,
  description,
  buttonLabel,
  variant,
  onClick,
  disabled = false,
  infoText = "",
  secondaryButtonLabel = "",
  onSecondaryClick = null,
  tertiaryButtonLabel = "",
  onTertiaryClick = null
}) {
  const card = document.createElement("article");
  card.className = `journey-path-card journey-path-card-${variant}${infoText ? " info-anchor" : ""}`;

  const header = document.createElement("div");
  header.className = "journey-path-card-header";

  const heading = document.createElement("h3");
  heading.textContent = title;

  header.appendChild(heading);

  if (infoText) {
    header.appendChild(createInfoButton(infoText, `More info about ${title}`));
  }

  const copy = document.createElement("p");
  copy.textContent = description;

  const button = document.createElement("button");
  button.type = "button";
  button.textContent = buttonLabel;
  button.disabled = disabled;
  button.addEventListener("click", onClick);

  card.append(header, copy, button);

  if (secondaryButtonLabel && typeof onSecondaryClick === "function") {
    const secondaryButton = document.createElement("button");
    secondaryButton.type = "button";
    secondaryButton.className = "journey-path-secondary-button";
    secondaryButton.textContent = secondaryButtonLabel;
    secondaryButton.disabled = disabled;
    secondaryButton.addEventListener("click", onSecondaryClick);
    card.appendChild(secondaryButton);
  }

  if (tertiaryButtonLabel && typeof onTertiaryClick === "function") {
    const tertiaryButton = document.createElement("button");
    tertiaryButton.type = "button";
    tertiaryButton.className = "journey-path-tertiary-button";
    tertiaryButton.textContent = tertiaryButtonLabel;
    tertiaryButton.disabled = disabled;
    tertiaryButton.addEventListener("click", onTertiaryClick);
    card.appendChild(tertiaryButton);
  }

  return card;
}

function getUnavailableJourneyMessage(journey) {
  const status = getEffectiveJourneyStatus(journey);

  if (status === "locked") {
    return journey.lockedMessage || "Complete the regional journeys to unlock this journey.";
  }

  return "Activities are still being added for this journey.";
}

function createInfoButton(infoText, labelText) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "info-button";
  button.textContent = "i";
  button.dataset.infoText = infoText;
  button.setAttribute("aria-label", labelText);
  return button;
}

function showInfoPopover(button) {
  if (!infoPopover || !button?.dataset?.infoText) {
    return;
  }

  clearInfoPopoverCloseTimer();
  const rect = button.getBoundingClientRect();
  infoPopover.textContent = button.dataset.infoText;
  infoPopover.hidden = false;
  infoPopover.dataset.activeInfo = button.getAttribute("aria-label") || "";

  const margin = 12;
  const popoverRect = infoPopover.getBoundingClientRect();
  const left = Math.min(
    window.innerWidth - popoverRect.width - margin,
    Math.max(margin, rect.left + (rect.width / 2) - (popoverRect.width / 2))
  );
  const top = Math.min(
    window.innerHeight - popoverRect.height - margin,
    Math.max(margin, rect.bottom + 8)
  );

  infoPopover.style.left = `${left}px`;
  infoPopover.style.top = `${top}px`;
}

function closeInfoPopover() {
  if (!infoPopover) {
    return;
  }

  clearInfoPopoverCloseTimer();
  infoPopover.hidden = true;
  infoPopover.textContent = "";
  infoPopover.style.left = "";
  infoPopover.style.top = "";
  delete infoPopover.dataset.activeInfo;
}

function clearInfoPopoverCloseTimer() {
  if (infoPopoverCloseTimer) {
    window.clearTimeout(infoPopoverCloseTimer);
    infoPopoverCloseTimer = null;
  }
}

function scheduleInfoPopoverClose() {
  clearInfoPopoverCloseTimer();
  infoPopoverCloseTimer = window.setTimeout(() => {
    closeInfoPopover();
  }, 180);
}

function isInfoPopoverElement(element) {
  return Boolean(element?.closest?.(".info-popover"));
}

function handleDocumentInfoPointerDown(event) {
  const infoButton = event.target.closest?.(".info-button");

  if (infoButton) {
    lastInfoPointerType = event.pointerType || "mouse";
  }
}

function handleDocumentInfoPointerOver(event) {
  const infoButton = event.target.closest?.(".info-button");

  if (infoButton && event.pointerType === "mouse") {
    showInfoPopover(infoButton);
    return;
  }

  if (isInfoPopoverElement(event.target)) {
    clearInfoPopoverCloseTimer();
  }
}

function handleDocumentInfoPointerOut(event) {
  const leftInfoButton = event.target.closest?.(".info-button");
  const leftPopover = isInfoPopoverElement(event.target);

  if (!leftInfoButton && !leftPopover) {
    return;
  }

  const nextTarget = event.relatedTarget;
  if (nextTarget?.closest?.(".info-button") || isInfoPopoverElement(nextTarget)) {
    return;
  }

  if (event.pointerType === "mouse") {
    scheduleInfoPopoverClose();
  }
}

function handleDocumentInfoFocusIn(event) {
  const infoButton = event.target.closest?.(".info-button");

  if (infoButton) {
    showInfoPopover(infoButton);
  }
}

function handleDocumentInfoFocusOut(event) {
  const infoButton = event.target.closest?.(".info-button");

  if (infoButton) {
    scheduleInfoPopoverClose();
  }
}

function handleDocumentInfoClick(event) {
  const infoButton = event.target.closest?.(".info-button");

  if (infoButton) {
    event.preventDefault();
    event.stopPropagation();

    if (!infoPopover?.hidden && infoPopover?.dataset.activeInfo === infoButton.getAttribute("aria-label")) {
      const isTouchActivation = event.detail !== 0 && (lastInfoPointerType === "touch" || lastInfoPointerType === "pen");

      if (isTouchActivation) {
        closeInfoPopover();
      } else {
        showInfoPopover(infoButton);
      }

      lastInfoPointerType = "";
      return;
    }

    showInfoPopover(infoButton);
    lastInfoPointerType = "";
    return;
  }

  if (infoPopover && !infoPopover.hidden && !event.target.closest?.(".info-popover")) {
    closeInfoPopover();
  }
}

function renderStudySelectionScreen(journey) {
  const panel = document.createElement("section");
  panel.className = "journey-mode-panel study-selection-panel";
  const validSteps = getStudySelectionSteps(journey);
  const eligibleMemoryTrailCount = getJourneyMemoryTrailEligibleSteps(journey).length;
  const isLearnIntent = normalizeJourneyDetailIntent(selectedJourneyDetailIntent) === "learn";

  const message = document.createElement("p");
  message.className = "journey-mode-message";
  message.textContent = isLearnIntent
    ? "Choose a section to learn with Memory Trail."
    : eligibleMemoryTrailCount > 0
    ? "Study a section, then practice it when you're ready. Memory Trail is available for focused regional sets."
    : "Study the places, then practice when you're ready.";

  const stepList = document.createElement("div");
  stepList.className = "study-step-list";

  validSteps.forEach((step, index) => {
    const activity = getActivityById(step.activityId);
    const isJourneyLink = !activity && Boolean(step.journeyId);
    const card = document.createElement("article");
    card.className = "study-step-card";

    const titleNode = document.createElement("strong");
    titleNode.textContent = step.title;

    const meta = document.createElement("span");
    const targetCount = isJourneyLink
      ? getJourneyLinkStepTargetCount(step)
      : activity?.targets?.length || activity?.itemCount || 0;
    meta.textContent = targetCount > 0
      ? `Section ${index + 1} | ${targetCount} target${targetCount === 1 ? "" : "s"}`
      : `Section ${index + 1}`;

    const actions = document.createElement("div");
    actions.className = "study-step-actions";

    const previewButton = document.createElement("button");
    previewButton.type = "button";
    previewButton.textContent = isJourneyLink
      ? "Open"
      : isLearnIntent && isMemoryTrailEligible(activity)
      ? "Memory Trail"
      : "Learn";
    previewButton.disabled = !activity && !isJourneyLink;
    previewButton.addEventListener("click", () => {
      if (openJourneyLinkStep(step)) {
        return;
      }

      void startStudyPreviewActivity(journey.id, step.id, {
        autoStartMemoryTrail: Boolean(isLearnIntent && activity?.memoryTrailAutoStart && isMemoryTrailEligible(activity))
      });
    });

    actions.append(previewButton);
    card.append(titleNode, meta, actions);
    stepList.appendChild(card);
  });

  const backButton = document.createElement("button");
  backButton.type = "button";
  backButton.className = "journey-begin-button";
  backButton.textContent = isLearnIntent ? "Back to Journeys" : "Back to Journey";
  backButton.addEventListener("click", () => {
    if (isLearnIntent) {
      journeyPickerIntent = "learn";
      showAppScreen("choose-journey");
      return;
    }

    showAppScreen("journey-detail");
  });

  panel.append(message, stepList, backButton);
  journeyShellContent.appendChild(panel);
}

function renderJourneyDifficultyScreen(journey) {
  const panel = document.createElement("section");
  panel.className = "journey-difficulty-panel";

  const journeyName = document.createElement("h2");
  journeyName.textContent = journey.title;

  const headingRow = document.createElement("div");
  headingRow.className = "journey-section-heading-row info-anchor";
  headingRow.append(
    journeyName,
    createInfoButton(
      "Difficulty changes how much visual help you get. It does not change the places you learn.",
      "More info about Difficulty"
    )
  );

  const message = document.createElement("p");
  message.className = "journey-mode-message";
  message.textContent = "Choose how much help you want during this journey.";

  const context = document.createElement("p");
  context.className = "journey-preset-meta";
  context.textContent = `${journey.title} | ${formatJourneyStepCount(journey.steps.length)}`;

  const options = document.createElement("div");
  options.className = "journey-difficulty-options";

  const selectedDifficultyId = getSelectedJourneyDifficultyId();
  journeyDifficultyOptions.forEach((difficulty) => {
    options.appendChild(createDifficultyCard(difficulty, {
      isSelected: difficulty.id === selectedDifficultyId,
      onSelect: () => setSelectedJourneyDifficulty(difficulty.id)
    }));
  });

  const progressState = getSelectedJourneyProgressState(journey);
  const actionRow = document.createElement("div");
  actionRow.className = "journey-difficulty-actions";

  const beginButton = document.createElement("button");
  beginButton.type = "button";
  beginButton.className = "journey-begin-button";

  if (progressState.isComplete) {
    beginButton.textContent = "Review From Beginning";
    beginButton.addEventListener("click", startSelectedJourneyFromBeginning);
    actionRow.appendChild(beginButton);
  } else if (progressState.hasPartialProgress) {
    beginButton.textContent = "Pick Up Where You Left Off";
    beginButton.addEventListener("click", resumeSelectedJourney);

    const startOverButton = document.createElement("button");
    startOverButton.type = "button";
    startOverButton.className = "journey-begin-button journey-begin-secondary-button";
    startOverButton.textContent = "Start From Beginning";
    startOverButton.addEventListener("click", startSelectedJourneyFromBeginning);
    actionRow.append(beginButton, startOverButton);
  } else {
    beginButton.textContent = "Start Journey";
    beginButton.addEventListener("click", startSelectedJourneyFromBeginning);
    actionRow.appendChild(beginButton);
  }

  panel.append(headingRow, message, context, options, actionRow);
  journeyShellContent.appendChild(panel);
}

function renderFreePlayDifficultyScreen() {
  const activity = getActivityById(pendingFreePlayActivityId);
  const panel = document.createElement("section");
  panel.className = "journey-difficulty-panel";

  const activityName = document.createElement("h2");
  activityName.textContent = activity?.title || "Free Play Activity";

  const headingRow = document.createElement("div");
  headingRow.className = "journey-section-heading-row info-anchor";
  headingRow.append(
    activityName,
    createInfoButton(
      "Difficulty changes how much visual help you get. It does not change the places you learn.",
      "More info about Difficulty"
    )
  );

  const message = document.createElement("p");
  message.className = "journey-mode-message";
  message.textContent = "Choose how much help you want for this activity.";

  const context = document.createElement("p");
  context.className = "journey-preset-meta";
  const targetCount = activity?.targets?.length || activity?.itemCount || 0;
  context.textContent = activity
    ? `${activity.title} | ${targetCount} target${targetCount === 1 ? "" : "s"}`
    : "Choose an activity";

  const options = document.createElement("div");
  options.className = "journey-difficulty-options";

  const selectedDifficultyId = getSelectedFreePlayDifficultyId();
  const availableDifficulties = getAvailableDifficulties(activity);
  journeyDifficultyOptions.forEach((difficulty) => {
    options.appendChild(createDifficultyCard(difficulty, {
      isAvailable: availableDifficulties.includes(difficulty.id),
      isSelected: difficulty.id === selectedDifficultyId,
      onSelect: () => setSelectedFreePlayDifficulty(difficulty.id)
    }));
  });

  const startButton = document.createElement("button");
  startButton.type = "button";
  startButton.className = "journey-begin-button";
  startButton.textContent = "Start Activity";
  startButton.disabled = !activity;
  startButton.addEventListener("click", startPendingFreePlayActivity);

  panel.append(headingRow, message, context, options, startButton);
  journeyShellContent.appendChild(panel);
}

function renderSettingsScreen() {
  const panel = document.createElement("section");
  panel.className = "settings-panel settings-hub-panel";

  const heading = document.createElement("h2");
  heading.textContent = "Settings";

  const description = document.createElement("p");
  description.className = "settings-panel-copy";
  description.textContent = "Quick controls for Mappa Mundi.";

  const controls = document.createElement("div");
  controls.className = "settings-hub-actions";

  const customizeButton = document.createElement("button");
  customizeButton.type = "button";
  customizeButton.className = "settings-reset-button settings-hub-button";
  customizeButton.textContent = "Customize";
  customizeButton.addEventListener("click", () => showCustomizeScreen({ track: false }));

  const audioToggle = createSettingsAudioMuteToggle();

  const feedbackLink = createSettingsFeedbackLink();
  feedbackLink.classList.add("settings-hub-button");

  const memoryTrailExitControl = createSettingsMemoryTrailExitControl();

  controls.append(customizeButton, audioToggle, feedbackLink);
  if (memoryTrailExitControl) {
    controls.appendChild(memoryTrailExitControl);
  }
  panel.append(heading, description, controls, renderDataSourcesCreditsSection());
  journeyShellContent.appendChild(panel);
  updateSettingsAudioToggleControl();
}

function renderDataSourcesCreditsSection() {
  const section = document.createElement("section");
  section.className = "settings-data-sources";

  const heading = document.createElement("h3");
  heading.textContent = "Data Sources & Credits";

  const description = document.createElement("p");
  description.className = "settings-panel-copy";
  description.textContent = "Map data and rendering credits used by Mappa Mundi.";

  const list = document.createElement("ul");
  getDataSourcesCreditEntries().forEach((entry) => {
    list.appendChild(createDataSourcesCreditItem(entry));
  });

  section.append(heading, description, list);
  return section;
}

function getDataSourcesCreditEntries() {
  return [
    {
      label: "United States geography",
      text: "U.S. Census Bureau cartographic boundary data via us-atlas, with display cleanup for map presentation.",
      href: "https://cdn.jsdelivr.net/npm/us-atlas@3/states-albers-10m.json",
      linkText: "us-atlas source"
    },
    {
      label: "World and regional geography",
      text: "Natural Earth public-domain data for countries, administrative regions, oceans, coastal display layers, and river source geometry.",
      href: "https://www.naturalearthdata.com/",
      linkText: "Natural Earth"
    },
    {
      label: "Physical-feature learning regions",
      text: "Project-authored approximate learning regions for U.S. mountain ranges and curated display repairs for selected U.S. river previews."
    },
    {
      label: "Map rendering",
      text: "MapLibre GL JS renders the interactive map.",
      href: "https://maplibre.org/maplibre-gl-js/docs/",
      linkText: "MapLibre GL JS"
    }
  ];
}

function createDataSourcesCreditItem({ label, text, href, linkText }) {
  const item = document.createElement("li");
  const title = document.createElement("strong");
  title.textContent = `${label}: `;
  item.append(title, document.createTextNode(text));

  if (href) {
    item.appendChild(document.createTextNode(" "));
    const link = document.createElement("a");
    link.href = href;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = linkText || "Source";
    item.appendChild(link);
  }

  return item;
}

function createSettingsMemoryTrailExitControl() {
  if (
    !pendingUnitedStatesMemoryTrailGameplaySettingsReturn
    || !activeUnitedStatesMemoryTrailSession
    || activeStudySession?.memoryTrail?.source !== UNITED_STATES_MEMORY_TRAIL_SOURCE
  ) {
    return null;
  }

  const exitButton = document.createElement("button");
  exitButton.type = "button";
  exitButton.className = "settings-reset-button settings-hub-button";
  exitButton.textContent = "Exit United States Memory Trail";
  exitButton.dataset.settingsControl = "exit-us-memory-trail";
  exitButton.addEventListener("click", () => {
    pendingUnitedStatesMemoryTrailGameplaySettingsReturn = false;
    exitUnitedStatesMemoryTrailGameplay();
  });
  return exitButton;
}

function renderCustomizeScreen() {
  const panel = document.createElement("section");
  panel.className = "settings-panel";

  const heading = document.createElement("h2");
  heading.textContent = "Customize";

  const description = document.createElement("p");
  description.className = "settings-panel-copy";
  description.textContent = "Choose map detail and save study-target preferences. Required activity targets stay available during gameplay.";

  const feedbackLink = createSettingsFeedbackLink();

  panel.append(heading, description, feedbackLink);

  const mapLayersSection = createSettingsMenuSection("Map Layers", "Control which supported map details are shown. Presets also update saved study-target preferences.", true, "settings-menu-section", "map-layers");
  mapLayersSection.content.append(renderStudyPresetControl(), renderMapLayerSettings());

  const audioSection = createSettingsMenuSection("Audio", "Control optional spoken directions separately from place-name pronunciation.", false, "settings-menu-section", "audio");
  audioSection.content.appendChild(renderAudioSettings());

  const studyTargetsSection = createSettingsMenuSection("Study Targets", "Saved preferences for planning study sets. Gameplay filtering is not fully wired yet.", false, "settings-menu-section", "study-targets");
  studyTargetsSection.content.appendChild(renderStudyTargetHierarchy());

  const resetSection = createSettingsMenuSection("Reset / Defaults", "Restore the default map layer and study-target preferences.", false, "settings-menu-section", "reset-defaults");
  resetSection.content.append(
    renderSettingsDefaultsControl(),
    renderDailyTrailResetControl(),
    renderUnitedStatesMemoryTrailResetControl()
  );

  panel.append(mapLayersSection.details, audioSection.details, studyTargetsSection.details, resetSection.details);

  journeyShellContent.appendChild(panel);
}

function createSettingsFeedbackLink() {
  const feedbackLink = document.createElement("a");
  feedbackLink.className = "settings-feedback-link";
  feedbackLink.href = feedbackFormUrl;
  feedbackLink.target = "_blank";
  feedbackLink.rel = "noopener noreferrer";
  feedbackLink.textContent = "Feedback";
  feedbackLink.addEventListener("click", () => {
    trackEvent("feedback_clicked", {
      source_screen: currentAppScreen
    });
  });
  return feedbackLink;
}

function createSettingsAudioMuteToggle() {
  const option = document.createElement("label");
  option.className = "settings-layer-toggle settings-audio-toggle";

  const copy = document.createElement("span");
  copy.className = "settings-layer-copy";

  const labelText = document.createElement("strong");
  labelText.textContent = "Audio";

  const helper = document.createElement("span");
  helper.textContent = "Sound and spoken prompts are ";
  const stateText = document.createElement("strong");
  stateText.dataset.settingsAudioState = "true";
  stateText.textContent = getAudioMutedSetting() ? "Off" : "On";
  helper.appendChild(stateText);

  copy.append(labelText, helper);

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.checked = !getAudioMutedSetting();
  checkbox.dataset.settingsControl = "audio-muted";
  checkbox.addEventListener("change", () => {
    void setAudioMutedSetting(!checkbox.checked);
  });

  const switchTrack = document.createElement("span");
  switchTrack.className = "settings-switch";
  switchTrack.setAttribute("aria-hidden", "true");

  option.append(copy, checkbox, switchTrack);
  return option;
}

function getSettingsUiState() {
  const panel = document.querySelector(".settings-panel");
  const shell = document.querySelector("#app-shell-screen");
  const activeControl = document.activeElement?.dataset?.settingsControl || "";

  return {
    panelScrollTop: panel?.scrollTop || 0,
    shellScrollTop: shell?.scrollTop || 0,
    openKeys: new Set(
      [...document.querySelectorAll(".settings-panel details[data-settings-key]")]
        .filter((details) => details.open)
        .map((details) => details.dataset.settingsKey)
    ),
    activeControl
  };
}

function restoreSettingsUiState(state = {}) {
  if (!state || currentAppScreen !== "customize") {
    return;
  }

  const panel = document.querySelector(".settings-panel");
  const shell = document.querySelector("#app-shell-screen");

  if (state.openKeys instanceof Set) {
    document.querySelectorAll(".settings-panel details[data-settings-key]").forEach((details) => {
      details.open = state.openKeys.has(details.dataset.settingsKey);
    });
  }

  const restorePosition = () => {
    if (panel) {
      panel.scrollTop = state.panelScrollTop || 0;
    }

    if (shell) {
      shell.scrollTop = state.shellScrollTop || 0;
    }

    if (state.activeControl) {
      document.querySelector(`[data-settings-control="${CSS.escape(state.activeControl)}"]`)?.focus?.({ preventScroll: true });
    }
  };

  requestAnimationFrame(() => {
    restorePosition();
    requestAnimationFrame(restorePosition);
  });
}

function rerenderSettingsPreservingUiState(focusControl = "") {
  const settingsState = getSettingsUiState();
  settingsState.activeControl = focusControl || settingsState.activeControl;
  renderJourneyShellContent("customize");
  restoreSettingsUiState(settingsState);
}

function createSettingsMenuSection(titleText, copyText, isOpen = false, className = "settings-menu-section", settingsKey = "") {
  const details = document.createElement("details");
  details.className = className;
  details.open = isOpen;
  details.dataset.settingsKey = settingsKey || normalizeSettingKey(titleText);

  const summary = document.createElement("summary");
  summary.textContent = titleText;

  const content = document.createElement("div");
  content.className = "settings-menu-content";

  if (copyText) {
    const copy = document.createElement("p");
    copy.className = "settings-panel-copy";
    copy.textContent = copyText;
    content.appendChild(copy);
  }

  details.append(summary, content);
  return { details, content };
}

function renderStudyPresetControl() {
  const wrapper = document.createElement("div");
  wrapper.className = "settings-preset-control";

  const label = document.createElement("label");
  label.className = "settings-preset-label";
  label.textContent = "Preset";

  const select = document.createElement("select");

  const customOption = document.createElement("option");
  customOption.value = "custom";
  customOption.textContent = "Custom";
  select.appendChild(customOption);

  mapLayerPresets.forEach((preset) => {
    const option = document.createElement("option");
    option.value = preset.id;
    option.textContent = preset.label;
    select.appendChild(option);
  });

  select.value = getCurrentStudyPresetId();
  select.dataset.settingsControl = "preset-select";
  select.addEventListener("change", () => {
    if (select.value !== "custom") {
      applyStudyPreset(select.value);
    }
  });

  const helper = document.createElement("p");
  helper.className = "settings-panel-copy";
  const activePreset = mapLayerPresets.find((preset) => preset.id === select.value);
  helper.textContent = activePreset?.description || "Manual layer and target choices.";

  label.appendChild(select);
  wrapper.append(label, helper);
  return wrapper;
}

function renderMapLayerSettings() {
  const layerGroup = document.createElement("section");
  layerGroup.className = "settings-layer-group";

  const heading = document.createElement("h3");
  heading.textContent = "Basic Layer Toggles";

  const layerGrid = document.createElement("div");
  layerGrid.className = "settings-layer-grid";
  getMapLayerOptions().forEach((option) => {
    layerGrid.appendChild(createMapLayerToggle(option));
  });

  layerGroup.append(heading, layerGrid);
  return layerGroup;
}

function renderAudioSettings() {
  const audioGroup = document.createElement("section");
  audioGroup.className = "settings-layer-group";

  const heading = document.createElement("h3");
  heading.textContent = "Memory Trail";

  const audioGrid = document.createElement("div");
  audioGrid.className = "settings-layer-grid";
  audioGrid.appendChild(createMemoryTrailInstructionSpeechToggle());

  audioGroup.append(heading, audioGrid);
  return audioGroup;
}

function createMemoryTrailInstructionSpeechToggle() {
  const option = document.createElement("label");
  option.className = "settings-layer-toggle";

  const copy = document.createElement("span");
  copy.className = "settings-layer-copy";

  const labelText = document.createElement("strong");
  labelText.textContent = "Speak Memory Trail Instructions";

  const helper = document.createElement("span");
  helper.textContent = "Speak task directions when Memory Trail changes phase or prompt type.";

  copy.append(labelText, helper);

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.checked = audioSettings.speakMemoryTrailInstructions === true;
  checkbox.dataset.settingsControl = "audio-memory-trail-instructions";
  checkbox.addEventListener("change", () => {
    setAudioSettings({
      speakMemoryTrailInstructions: checkbox.checked
    }, checkbox.dataset.settingsControl);
  });

  const switchTrack = document.createElement("span");
  switchTrack.className = "settings-switch";
  switchTrack.setAttribute("aria-hidden", "true");

  option.append(copy, checkbox, switchTrack);
  return option;
}

function getMapLayerOptions() {
  return [
    {
      id: "showContinents",
      label: "Continents",
      helper: "Show continent targets where the activity supports them."
    },
    {
      id: "showOceans",
      label: "Oceans",
      helper: "Show ocean targets and ocean-zone context."
    },
    {
      id: "showCountries",
      label: "Countries",
      helper: "Show country and region shapes."
    },
    {
      id: "showStates",
      label: "States",
      helper: "Show state and comparable political division shapes."
    },
    {
      id: "showProvinces",
      label: "Provinces",
      helper: "Show province-level targets where available."
    },
    {
      id: "showTerritories",
      label: "Territories",
      helper: "Show territory-level targets where available."
    },
    {
      id: "showCities",
      label: "Cities",
      helper: "Show city point markers when available."
    },
    {
      id: "showCapitals",
      label: "Capitals",
      helper: "Show capital point markers when available."
    }
  ];
}

function createMapLayerToggle(option) {
  const layerOption = document.createElement("label");
  layerOption.className = "settings-layer-toggle";

  const copy = document.createElement("span");
  copy.className = "settings-layer-copy";

  const labelText = document.createElement("strong");
  labelText.textContent = option.label;

  const helper = document.createElement("span");
  helper.textContent = option.helper;

  copy.append(labelText, helper);

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.checked = mapLayerSettings[option.id] !== false;
  checkbox.dataset.settingsControl = `map-layer-${option.id}`;
  checkbox.addEventListener("change", () => {
    setMapLayerSettings({
      [option.id]: checkbox.checked
    }, checkbox.dataset.settingsControl);
  });

  const switchTrack = document.createElement("span");
  switchTrack.className = "settings-switch";
  switchTrack.setAttribute("aria-hidden", "true");

  layerOption.append(copy, checkbox, switchTrack);
  return layerOption;
}

function renderStudyTargetHierarchy() {
  const wrapper = document.createElement("div");
  wrapper.className = "settings-target-hierarchy";
  const groups = getStudyTargetGroups();
  const usedGroupIds = new Set();

  getStudyTargetHierarchySections().forEach((section) => {
    const renderedSection = renderStudyTargetHierarchySection(section, groups, usedGroupIds);

    if (renderedSection) {
      wrapper.appendChild(renderedSection);
    }
  });

  const remainingGroups = groups.filter((group) => !usedGroupIds.has(group.id));
  if (remainingGroups.length > 0) {
    const otherSection = createSettingsMenuSection("Other Available Targets", "", false, "settings-target-region", "target-region-other");
    remainingGroups.forEach((group) => {
      usedGroupIds.add(group.id);
      otherSection.content.appendChild(renderStudyTargetGroup(group));
    });
    wrapper.appendChild(otherSection.details);
  }

  return wrapper;
}

function renderStudyTargetHierarchySection(section, groups, usedGroupIds) {
  const renderedGroups = groups.filter((group) => section.matches(group));

  if (renderedGroups.length === 0) {
    return null;
  }

  const region = createSettingsMenuSection(
    section.title,
    section.copy || "",
    Boolean(section.defaultOpen),
    "settings-target-region",
    `target-region-${normalizeSettingKey(section.title)}`
  );

  if (section.children?.length) {
    section.children.forEach((child) => {
      const childGroups = renderedGroups.filter((group) => child.matches(group));

      if (childGroups.length === 0) {
        return;
      }

      const childSection = createSettingsMenuSection(
        child.title,
        child.copy || "",
        false,
        "settings-target-subregion",
        `target-subregion-${normalizeSettingKey(section.title)}-${normalizeSettingKey(child.title)}`
      );
      childGroups.forEach((group) => {
        usedGroupIds.add(group.id);
        childSection.content.appendChild(renderStudyTargetGroup(group));
      });
      region.content.appendChild(childSection.details);
    });

    const uncategorizedGroups = renderedGroups.filter((group) => !usedGroupIds.has(group.id));
    uncategorizedGroups.forEach((group) => {
      usedGroupIds.add(group.id);
      region.content.appendChild(renderStudyTargetGroup(group));
    });
  } else {
    renderedGroups.forEach((group) => {
      usedGroupIds.add(group.id);
      region.content.appendChild(renderStudyTargetGroup(group));
    });
  }

  return region.content.children.length > 0 ? region.details : null;
}

function getStudyTargetHierarchySections() {
  return [
    {
      title: "World",
      defaultOpen: true,
      matches: (group) => group.id === "world-continents" || group.id === "world-oceans",
      children: [
        {
          title: "Continents",
          matches: (group) => group.id === "world-continents"
        },
        {
          title: "Oceans",
          matches: (group) => group.id === "world-oceans"
        }
      ]
    },
    {
      title: "North America",
      defaultOpen: true,
      matches: (group) => group.id === "countries-north-america"
        || group.id.startsWith("canada-")
        || group.id.startsWith("us-")
        || group.id.startsWith("mexico-"),
      children: [
        {
          title: "Countries",
          copy: "Includes North America, Central America, and Caribbean country targets currently represented in activities.",
          matches: (group) => group.id === "countries-north-america"
        },
        {
          title: "Canada",
          matches: (group) => group.id.startsWith("canada-")
        },
        {
          title: "United States",
          matches: (group) => group.id.startsWith("us-")
        },
        {
          title: "Mexico",
          matches: (group) => group.id.startsWith("mexico-")
        }
      ]
    },
    {
      title: "South America",
      matches: (group) => group.id === "countries-south-america" || group.id.startsWith("brazil-"),
      children: [
        {
          title: "Countries",
          matches: (group) => group.id === "countries-south-america"
        },
        {
          title: "Brazil",
          matches: (group) => group.id.startsWith("brazil-")
        }
      ]
    },
    {
      title: "Europe",
      matches: (group) => group.id === "countries-europe"
        || group.id.startsWith("germany-")
        || group.id.startsWith("france-")
        || group.id.startsWith("spain-")
        || group.id.startsWith("italy-")
        || group.id.startsWith("united-kingdom-")
        || group.id.startsWith("cities-europe-"),
      children: [
        {
          title: "Countries",
          matches: (group) => group.id === "countries-europe"
        },
        {
          title: "Germany",
          matches: (group) => group.id.startsWith("germany-")
        },
        {
          title: "France",
          matches: (group) => group.id.startsWith("france-")
        },
        {
          title: "Spain",
          matches: (group) => group.id.startsWith("spain-")
        },
        {
          title: "Italy",
          matches: (group) => group.id.startsWith("italy-")
        },
        {
          title: "United Kingdom",
          matches: (group) => group.id.startsWith("united-kingdom-")
        },
        {
          title: "Cities",
          matches: (group) => group.id.startsWith("cities-europe-")
        }
      ]
    },
    {
      title: "Africa",
      matches: (group) => group.id === "countries-africa"
    },
    {
      title: "Asia",
      matches: (group) => group.id === "countries-asia"
        || group.id.startsWith("india-")
        || group.id.startsWith("japan-")
        || group.id.startsWith("china-"),
      children: [
        {
          title: "Countries",
          matches: (group) => group.id === "countries-asia"
        },
        {
          title: "India",
          matches: (group) => group.id.startsWith("india-")
        },
        {
          title: "Japan",
          matches: (group) => group.id.startsWith("japan-")
        },
        {
          title: "China",
          matches: (group) => group.id.startsWith("china-")
        }
      ]
    },
    {
      title: "Russia",
      matches: (group) => group.id.startsWith("russia-")
    },
    {
      title: "Australia / Oceania",
      matches: (group) => group.id === "countries-australia"
        || group.id === "countries-oceania"
        || group.id.startsWith("australia-")
    }
  ];
}

function renderSettingsDefaultsControl() {
  const wrapper = document.createElement("div");
  wrapper.className = "settings-defaults-control";

  const copy = document.createElement("p");
  copy.className = "settings-panel-copy";
  copy.textContent = "This resets map layers and saved study-target preferences to the default Mappa Mundi settings.";

  const resetButton = document.createElement("button");
  resetButton.type = "button";
  resetButton.className = "settings-reset-button";
  resetButton.textContent = "Reset to Default";
  resetButton.dataset.settingsControl = "reset-defaults";
  resetButton.addEventListener("click", () => {
    applyStudyPreset("default");
  });

  wrapper.append(copy, resetButton);
  return wrapper;
}

function renderDailyTrailResetControl() {
  const wrapper = document.createElement("div");
  wrapper.className = "settings-defaults-control settings-daily-trail-reset-control";

  const copy = document.createElement("p");
  copy.className = "settings-panel-copy";
  copy.textContent = "Erase all Daily Trail goal progress and learning history. Journeys, settings, and preferences stay as they are.";

  const resetButton = document.createElement("button");
  resetButton.type = "button";
  resetButton.className = "settings-reset-button";
  resetButton.textContent = "Reset All Daily Trail Progress";
  resetButton.dataset.settingsControl = "reset-daily-trail-progress";
  resetButton.addEventListener("click", () => {
    dailyTrailResetConfirmationVisible = true;
    rerenderSettingsPreservingUiState("reset-daily-trail-cancel");
  });

  wrapper.append(copy, resetButton);

  if (dailyTrailResetConfirmationVisible) {
    wrapper.appendChild(renderDailyTrailResetConfirmation());
  }

  return wrapper;
}

function renderDailyTrailResetConfirmation() {
  const confirmation = document.createElement("section");
  confirmation.className = "settings-reset-confirmation";
  confirmation.setAttribute("role", "alertdialog");
  confirmation.setAttribute("aria-labelledby", "daily-trail-reset-title");
  confirmation.setAttribute("aria-describedby", "daily-trail-reset-copy");

  const title = document.createElement("h3");
  title.id = "daily-trail-reset-title";
  title.textContent = "Reset all Daily Trail progress?";

  const body = document.createElement("p");
  body.id = "daily-trail-reset-copy";
  body.textContent = "This will erase every Daily Trail goal, completion, and learning record, then return you to World Core. Your regular journey progress will not be affected.";

  const actions = document.createElement("div");
  actions.className = "settings-reset-confirmation-actions";

  const cancelButton = document.createElement("button");
  cancelButton.type = "button";
  cancelButton.className = "settings-reset-button";
  cancelButton.textContent = "Cancel";
  cancelButton.dataset.settingsControl = "reset-daily-trail-cancel";
  cancelButton.addEventListener("click", () => {
    dailyTrailResetConfirmationVisible = false;
    rerenderSettingsPreservingUiState("reset-daily-trail-progress");
  });

  const confirmButton = document.createElement("button");
  confirmButton.type = "button";
  confirmButton.className = "settings-reset-button settings-reset-button-danger";
  confirmButton.textContent = "Reset All Daily Trail";
  confirmButton.dataset.settingsControl = "reset-daily-trail-confirm";
  confirmButton.addEventListener("click", () => {
    resetDailyTrailProgress();
    dailyTrailResetConfirmationVisible = false;
    rerenderSettingsPreservingUiState("reset-daily-trail-progress");
    showFeedback("Daily Trail progress reset.", true);
  });

  actions.append(cancelButton, confirmButton);
  confirmation.append(title, body, actions);
  return confirmation;
}

function renderUnitedStatesMemoryTrailResetControl() {
  const wrapper = document.createElement("div");
  wrapper.className = "settings-defaults-control settings-us-memory-trail-reset-control";

  const copy = document.createElement("p");
  copy.className = "settings-panel-copy";
  copy.textContent = "Erase United States Memory Trail progress only. Daily Trail, journeys, regional activities, settings, and preferences stay as they are.";

  const resetButton = document.createElement("button");
  resetButton.type = "button";
  resetButton.className = "settings-reset-button";
  resetButton.textContent = "Reset United States Memory Trail";
  resetButton.dataset.settingsControl = "reset-us-memory-trail-progress";
  resetButton.addEventListener("click", () => {
    unitedStatesMemoryTrailResetConfirmationVisible = true;
    rerenderSettingsPreservingUiState("reset-us-memory-trail-cancel");
  });

  wrapper.append(copy, resetButton);

  if (unitedStatesMemoryTrailResetConfirmationVisible) {
    wrapper.appendChild(renderUnitedStatesMemoryTrailResetConfirmation());
  }

  return wrapper;
}

function renderUnitedStatesMemoryTrailResetConfirmation() {
  const confirmation = document.createElement("section");
  confirmation.className = "settings-reset-confirmation";
  confirmation.setAttribute("role", "alertdialog");
  confirmation.setAttribute("aria-labelledby", "us-memory-trail-reset-title");
  confirmation.setAttribute("aria-describedby", "us-memory-trail-reset-copy");

  const title = document.createElement("h3");
  title.id = "us-memory-trail-reset-title";
  title.textContent = "Reset United States Memory Trail?";

  const body = document.createElement("p");
  body.id = "us-memory-trail-reset-copy";
  body.textContent = "This only clears the continuous United States trail. Daily Trail and regional journey progress are not affected.";

  const actions = document.createElement("div");
  actions.className = "settings-reset-confirmation-actions";

  const cancelButton = document.createElement("button");
  cancelButton.type = "button";
  cancelButton.className = "settings-reset-button";
  cancelButton.textContent = "Cancel";
  cancelButton.dataset.settingsControl = "reset-us-memory-trail-cancel";
  cancelButton.addEventListener("click", () => {
    unitedStatesMemoryTrailResetConfirmationVisible = false;
    rerenderSettingsPreservingUiState("reset-us-memory-trail-progress");
  });

  const confirmButton = document.createElement("button");
  confirmButton.type = "button";
  confirmButton.className = "settings-reset-button settings-reset-button-danger";
  confirmButton.textContent = "Reset United States Trail";
  confirmButton.dataset.settingsControl = "reset-us-memory-trail-confirm";
  confirmButton.addEventListener("click", () => {
    resetUnitedStatesMemoryTrailProgress();
    unitedStatesMemoryTrailResetConfirmationVisible = false;
    rerenderSettingsPreservingUiState("reset-us-memory-trail-progress");
    showFeedback("United States Memory Trail reset.", true);
  });

  actions.append(cancelButton, confirmButton);
  confirmation.append(title, body, actions);
  return confirmation;
}

function renderStudyTargetGroup(group) {
  const details = document.createElement("details");
  details.className = "settings-target-group";
  details.open = group.defaultOpen;
  details.dataset.settingsKey = `target-group-${group.id}`;

  const summary = document.createElement("summary");
  const selectedCount = group.targets.filter((target) => isStudyTargetEnabled(group.settingKey, target.id)).length;

  const title = document.createElement("span");
  title.className = "settings-target-group-title";
  title.textContent = group.title;

  const count = document.createElement("span");
  count.className = "settings-target-group-count";
  count.textContent = `${selectedCount} / ${group.targets.length} selected`;

  summary.append(title, count);

  const controls = document.createElement("div");
  controls.className = "settings-target-group-actions";

  const selectAllButton = document.createElement("button");
  selectAllButton.type = "button";
  selectAllButton.textContent = "Select All";
  selectAllButton.dataset.settingsControl = `target-group-select-all-${group.id}`;
  selectAllButton.addEventListener("click", () => {
    toggleTargetGroup(group.settingKey, group.targets, true, selectAllButton.dataset.settingsControl);
  });

  const deselectAllButton = document.createElement("button");
  deselectAllButton.type = "button";
  deselectAllButton.textContent = "Deselect All";
  deselectAllButton.dataset.settingsControl = `target-group-deselect-all-${group.id}`;
  deselectAllButton.addEventListener("click", () => {
    toggleTargetGroup(group.settingKey, group.targets, false, deselectAllButton.dataset.settingsControl);
  });

  controls.append(selectAllButton, deselectAllButton);

  const targetGrid = document.createElement("div");
  targetGrid.className = "settings-target-grid";
  group.targets.forEach((target) => {
    targetGrid.appendChild(createStudyTargetToggle(group.settingKey, target));
  });

  details.append(summary, controls, targetGrid);
  return details;
}

function createStudyTargetToggle(settingKey, target) {
  const layerOption = document.createElement("label");
  layerOption.className = "settings-layer-toggle";

  const copy = document.createElement("span");
  copy.className = "settings-layer-copy";

  const labelText = document.createElement("strong");
  labelText.textContent = target.label;

  const helper = document.createElement("span");
  helper.textContent = target.sourceTitle || "Available target";

  copy.append(labelText, helper);

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.checked = isStudyTargetEnabled(settingKey, target.id);
  checkbox.dataset.settingsControl = `target-${settingKey}-${target.id}`;
  checkbox.addEventListener("change", () => {
    toggleTarget(settingKey, target.id, checkbox.checked, checkbox.dataset.settingsControl);
  });

  const switchTrack = document.createElement("span");
  switchTrack.className = "settings-switch";
  switchTrack.setAttribute("aria-hidden", "true");

  layerOption.append(copy, checkbox, switchTrack);
  return layerOption;
}

function getStudyTargetGroups() {
  const groups = [
    ...getWorldStudyTargetGroups(),
    ...getCountryStudyTargetGroups(),
    ...getStateProvinceTerritoryStudyTargetGroups(),
    ...getCityCapitalStudyTargetGroups()
  ];

  return groups.filter((group) => group.targets.length > 0);
}

function getWorldStudyTargetGroups() {
  const activity = getActivityById("continents-oceans");
  const targets = activity?.targets || [];

  return [
    {
      id: "world-continents",
      title: "World / Continents",
      settingKey: "continents",
      defaultOpen: true,
      targets: targets
        .filter((target) => !/ocean/i.test(target.name))
        .map((target) => toStudyTargetOption(target, activity))
    },
    {
      id: "world-oceans",
      title: "World / Oceans",
      settingKey: "oceans",
      defaultOpen: true,
      targets: targets
        .filter((target) => /ocean/i.test(target.name))
        .map((target) => toStudyTargetOption(target, activity))
    }
  ];
}

function getCountryStudyTargetGroups() {
  const groups = new Map();

  activities
    .filter((activity) => activity.category === "Countries")
    .forEach((activity) => {
      const continentLabel = getActivityContinentLabel(activity) || "Other";
      const groupId = `countries-${normalizeSettingKey(continentLabel)}`;
      const group = getOrCreateStudyGroup(groups, groupId, {
        id: groupId,
        title: `Countries / ${continentLabel}`,
        settingKey: "countries",
        defaultOpen: continentLabel === "North America" || continentLabel === "Europe",
        targets: []
      });

      addStudyTargets(group.targets, activity.targets, activity, (target) => target.kind === "shape");
    });

  return [...groups.values()].map(sortStudyGroupTargets);
}

function getStateProvinceTerritoryStudyTargetGroups() {
  const groups = new Map();

  activities
    .filter((activity) => activity.id.startsWith("us-states-"))
    .forEach((activity) => {
      const group = getOrCreateStudyGroup(groups, "us-states", {
        id: "us-states",
        title: "Political Divisions / United States",
        settingKey: "states",
        defaultOpen: true,
        targets: []
      });
      addStudyTargets(group.targets, activity.targets, activity, (target) => target.kind === "shape");
    });

  activities
    .filter((activity) => activity.id.startsWith("canada-"))
    .forEach((activity) => {
      const provinceGroup = getOrCreateStudyGroup(groups, "canada-provinces", {
        id: "canada-provinces",
        title: "Political Divisions / Canada Provinces",
        settingKey: "provinces",
        defaultOpen: false,
        targets: []
      });
      const territoryGroup = getOrCreateStudyGroup(groups, "canada-territories", {
        id: "canada-territories",
        title: "Political Divisions / Canada Territories",
        settingKey: "territories",
        defaultOpen: false,
        targets: []
      });

      addStudyTargets(provinceGroup.targets, activity.targets, activity, (target) => target.kind === "shape" && !canadianTerritoryNames.has(target.name));
      addStudyTargets(territoryGroup.targets, activity.targets, activity, (target) => target.kind === "shape" && canadianTerritoryNames.has(target.name));
    });

  activities
    .filter((activity) => activity.id.startsWith("mexico-"))
    .forEach((activity) => {
      const group = getOrCreateStudyGroup(groups, "mexico-states", {
        id: "mexico-states",
        title: "Political Divisions / Mexico",
        settingKey: "states",
        defaultOpen: false,
        targets: []
      });
      addStudyTargets(group.targets, activity.targets, activity, (target) => target.kind === "shape");
    });

  activities
    .filter((activity) => activity.id === "australia-states-territories")
    .forEach((activity) => {
      const group = getOrCreateStudyGroup(groups, "australia-political-divisions", {
        id: "australia-political-divisions",
        title: "Political Divisions / Australia",
        settingKey: "politicalDivisions",
        defaultOpen: false,
        targets: []
      });
      addStudyTargets(group.targets, activity.targets, activity, (target) => target.kind === "shape");
    });

  activities
    .filter((activity) => activity.id.startsWith("china-") && activity.id.endsWith("-political-divisions"))
    .forEach((activity) => {
      const regionLabel = activity.title.replace(/^China:\s*/, "");
      const group = getOrCreateStudyGroup(groups, activity.id, {
        id: activity.id,
        title: `Political Divisions / China / ${regionLabel}`,
        settingKey: "politicalDivisions",
        defaultOpen: false,
        targets: []
      });
      addStudyTargets(group.targets, activity.targets, activity, (target) => target.kind === "shape");
    });

  activities
    .filter((activity) => activity.id.startsWith("japan-") && activity.id.endsWith("-political-divisions"))
    .forEach((activity) => {
      const regionLabel = activity.title.replace(/^Japan:\s*/, "");
      const group = getOrCreateStudyGroup(groups, activity.id, {
        id: activity.id,
        title: `Political Divisions / Japan / ${regionLabel}`,
        settingKey: "politicalDivisions",
        defaultOpen: false,
        targets: []
      });
      addStudyTargets(group.targets, activity.targets, activity, (target) => target.kind === "shape");
    });

  activities
    .filter((activity) => activity.id.startsWith("germany-") && activity.id.endsWith("-political-divisions"))
    .forEach((activity) => {
      const regionLabel = activity.title.replace(/^Germany:\s*/, "");
      const group = getOrCreateStudyGroup(groups, activity.id, {
        id: activity.id,
        title: `Political Divisions / Germany / ${regionLabel}`,
        settingKey: "politicalDivisions",
        defaultOpen: false,
        targets: []
      });
      addStudyTargets(group.targets, activity.targets, activity, (target) => target.kind === "shape");
    });

  activities
    .filter((activity) => activity.id.startsWith("france-") && activity.id.endsWith("-political-divisions"))
    .forEach((activity) => {
      const regionLabel = activity.title.replace(/^France:\s*/, "");
      const group = getOrCreateStudyGroup(groups, activity.id, {
        id: activity.id,
        title: `Political Divisions / France / ${regionLabel}`,
        settingKey: "politicalDivisions",
        defaultOpen: false,
        targets: []
      });
      addStudyTargets(group.targets, activity.targets, activity, (target) => target.kind === "shape");
    });

  activities
    .filter((activity) => activity.id.startsWith("spain-") && activity.id.endsWith("-political-divisions"))
    .forEach((activity) => {
      const regionLabel = activity.title.replace(/^Spain:\s*/, "");
      const group = getOrCreateStudyGroup(groups, activity.id, {
        id: activity.id,
        title: `Political Divisions / Spain / ${regionLabel}`,
        settingKey: "politicalDivisions",
        defaultOpen: false,
        targets: []
      });
      addStudyTargets(group.targets, activity.targets, activity, (target) => target.kind === "shape");
    });

  activities
    .filter((activity) => activity.id.startsWith("italy-") && activity.id.endsWith("-political-divisions"))
    .forEach((activity) => {
      const regionLabel = activity.title.replace(/^Italy:\s*/, "");
      const group = getOrCreateStudyGroup(groups, activity.id, {
        id: activity.id,
        title: `Political Divisions / Italy / ${regionLabel}`,
        settingKey: "politicalDivisions",
        defaultOpen: false,
        targets: []
      });
      addStudyTargets(group.targets, activity.targets, activity, (target) => target.kind === "shape");
    });

  activities
    .filter((activity) => activity.id === "united-kingdom-countries-political-divisions")
    .forEach((activity) => {
      const group = getOrCreateStudyGroup(groups, activity.id, {
        id: activity.id,
        title: "Political Divisions / United Kingdom / Countries",
        settingKey: "politicalDivisions",
        defaultOpen: false,
        targets: []
      });
      addStudyTargets(group.targets, activity.targets, activity, (target) => target.kind === "shape");
    });

  activities
    .filter((activity) => activity.id.startsWith("india-") && activity.id.endsWith("-political-divisions"))
    .forEach((activity) => {
      const regionLabel = activity.title.replace(/^India:\s*/, "");
      const group = getOrCreateStudyGroup(groups, activity.id, {
        id: activity.id,
        title: `Political Divisions / India / ${regionLabel}`,
        settingKey: "politicalDivisions",
        defaultOpen: false,
        targets: []
      });
      addStudyTargets(group.targets, activity.targets, activity, (target) => target.kind === "shape");
    });

  activities
    .filter((activity) => activity.id.startsWith("russia-") && activity.id.endsWith("-federal-subjects"))
    .forEach((activity) => {
      const regionLabel = activity.title.replace(/^Russia:\s*/, "");
      const group = getOrCreateStudyGroup(groups, activity.id, {
        id: activity.id,
        title: `Political Divisions / Russia / ${regionLabel}`,
        settingKey: "politicalDivisions",
        defaultOpen: false,
        targets: []
      });
      addStudyTargets(group.targets, activity.targets, activity, (target) => target.kind === "shape");
    });

  activities
    .filter((activity) => activity.id.startsWith("brazil-") && activity.id.endsWith("-political-divisions"))
    .forEach((activity) => {
      const regionLabel = activity.title.replace(/^Brazil:\s*/, "");
      const group = getOrCreateStudyGroup(groups, activity.id, {
        id: activity.id,
        title: `Political Divisions / Brazil / ${regionLabel}`,
        settingKey: "politicalDivisions",
        defaultOpen: false,
        targets: []
      });
      addStudyTargets(group.targets, activity.targets, activity, (target) => target.kind === "shape");
    });

  return [...groups.values()].map(sortStudyGroupTargets);
}

function getCityCapitalStudyTargetGroups() {
  const groups = new Map();

  activities
    .filter((activity) => activity.id.startsWith("us-capitals-"))
    .forEach((activity) => {
      const group = getOrCreateStudyGroup(groups, "us-capitals", {
        id: "us-capitals",
        title: "Cities & Capitals / United States Capitals",
        settingKey: "capitals",
        defaultOpen: false,
        targets: []
      });
      addStudyTargets(group.targets, activity.targets, activity, (target) => target.kind === "point");
    });

  activities
    .filter((activity) => activity.category === "Cities" && !activity.id.startsWith("us-capitals-"))
    .forEach((activity) => {
      const continentLabel = getActivityContinentLabel(activity) || "World";
      const groupId = `cities-${normalizeSettingKey(continentLabel)}-${activity.id}`;
      const group = getOrCreateStudyGroup(groups, groupId, {
        id: groupId,
        title: `Cities & Capitals / ${activity.title}`,
        settingKey: "cities",
        defaultOpen: activity.id === "european-cities",
        targets: []
      });
      addStudyTargets(group.targets, activity.targets, activity, (target) => target.kind === "point");
    });

  return [...groups.values()].map(sortStudyGroupTargets);
}

function getOrCreateStudyGroup(groups, groupId, factory) {
  if (!groups.has(groupId)) {
    groups.set(groupId, factory);
  }

  return groups.get(groupId);
}

function addStudyTargets(targetList, targets, activity, predicate) {
  (targets || [])
    .filter(predicate)
    .forEach((target) => {
      const option = toStudyTargetOption(target, activity);
      const existing = targetList.find((candidate) => candidate.id === option.id);

      if (existing) {
        existing.sourceTitle = mergeStudyTargetSources(existing.sourceTitle, option.sourceTitle);
        return;
      }

      targetList.push(option);
    });
}

function toStudyTargetOption(target, activity) {
  return {
    id: target.id,
    label: target.name,
    sourceTitle: activity?.title || "Available target"
  };
}

function mergeStudyTargetSources(existingSource, nextSource) {
  if (!existingSource || existingSource === nextSource) {
    return nextSource || existingSource;
  }

  return "Multiple activities";
}

function sortStudyGroupTargets(group) {
  group.targets.sort((left, right) => left.label.localeCompare(right.label));
  return group;
}

function getActivityContinentLabel(activity) {
  const hierarchyNodeId = findHierarchyNodeForActivity(activity.id);
  const path = getHierarchyPath(hierarchyNodeId);
  const continentNode = path.find((node) => getHierarchyNode(node.parent)?.id === "world");

  return continentNode?.label || null;
}

function normalizeSettingKey(value = "") {
  return String(value)
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function createDifficultyCard(difficulty, options = {}) {
  const isSelected = Boolean(options.isSelected);
  const isAvailable = options.isAvailable !== false;
  const card = document.createElement("button");
  card.type = "button";
  card.className = `journey-difficulty-card${isSelected ? " selected" : ""}`;
  card.setAttribute("aria-pressed", String(isSelected));
  card.dataset.difficultyId = difficulty.id;
  card.disabled = !isAvailable;
  card.addEventListener("click", () => {
    if (isAvailable) {
      options.onSelect?.();
    }
  });

  const selectedMarker = document.createElement("span");
  selectedMarker.className = "journey-difficulty-selected-marker";
  selectedMarker.textContent = isAvailable
    ? (isSelected ? "Selected" : "Select")
    : "Unavailable";

  const heading = document.createElement("strong");
  heading.textContent = difficulty.title;

  const mode = document.createElement("span");
  mode.className = "journey-difficulty-mode";
  mode.textContent = difficulty.mode;

  const list = document.createElement("ul");
  difficulty.bullets.forEach((bullet) => {
    const item = document.createElement("li");
    item.textContent = bullet;
    list.appendChild(item);
  });

  card.append(selectedMarker, heading, mode, list);
  return card;
}

function renderBeginJourneyPlaceholder(journey) {
  const panel = document.createElement("section");
  panel.className = "journey-mode-panel";

  const message = document.createElement("p");
  message.className = "journey-mode-message";
  message.textContent = "This journey is coming soon.";

  const context = document.createElement("p");
  context.className = "journey-preset-meta";
  context.textContent = `${journey.title} | ${formatJourneyStepCount(journey.steps.length)}`;

  panel.append(message, context);
  journeyShellContent.appendChild(panel);
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
  if (isGameplayNavigationLocked()) {
    showFeedback("Finish this activity first.");
    return;
  }

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
  if (!session?.currentActivity || isCurrentActivityProgressDisabled) {
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

    if (activity.launch?.journeyId || menuItem.journeyId) {
      card.dataset.journeyId = activity.launch?.journeyId || menuItem.journeyId;
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

function openJourneyFromOverview(journeyId) {
  const journey = journeyPresets.find((candidate) => candidate.id === journeyId);

  if (!journey) {
    return;
  }

  journeyPickerIntent = "learn";
  selectJourney(journey.id);
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
  freePlaySelectedMapFeature = null;
  activePreviewActivityId = activityId;
  highlightOverviewCard(activityId);
  updateOverviewPreview();
}

function restoreOverviewPreview() {
  freePlaySelectedMapFeature = null;
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
  if (freePlaySelectedMapFeature) {
    runner?.setOverviewFeatureCollection(getFreePlaySelectedFeatureCollection(freePlaySelectedMapFeature));
    return;
  }

  const previewActivity = [...activities, ...supplementalOverviewEntries]
    .find((activity) => activity.id === getCurrentOverviewPreviewId()) || null;

  if (previewActivity) {
    runner?.setOverviewPreview(previewActivity, getActivityProgress(previewActivity.id, getEffectiveDifficulty(previewActivity)));
    return;
  }

  if (isNeutralFreePlayRootExplore()) {
    runner?.setOverviewFeatureCollection({
      type: "FeatureCollection",
      features: []
    });
    return;
  }

  if (isNavigationBrowseMode) {
    runner?.setOverviewFeatureCollection(getBrowseFeatureCollection(activeHierarchyNodeId));
    return;
  }

  runner?.setOverviewPreview(null);
}

function isNeutralFreePlayRootExplore() {
  return isFreePlayRootExplore()
    && !freePlaySelectedMapFeature;
}

function isFreePlayRootExplore() {
  return currentAppScreen === "free-play"
    && isNavigationBrowseMode
    && activeHierarchyNodeId === "world"
    && !activePreviewActivityId
    && !selectedOverviewActivityId;
}

function getFreePlaySelectedFeatureCollection(candidate) {
  if (!runner || !candidate) {
    return {
      type: "FeatureCollection",
      features: []
    };
  }

  if (candidate.kind === "world-country" && candidate.isoA3 && runner.getOverviewGeoJsonForCountry) {
    return runner.getOverviewGeoJsonForCountry(candidate.isoA3, {
      activityId: candidate.targetId,
      label: getNavigationCandidateDisplayName(candidate)
    });
  }

  return {
    type: "FeatureCollection",
    features: []
  };
}

function getNavigationCandidateDisplayName(candidate) {
  return candidate?.names?.find(Boolean)
    || candidate?.targetId
    || "Selected place";
}

// Converts a Natural Earth ISO_A2 country code into a flag emoji for Free Play country info cards.
function iso2ToFlagEmoji(iso2) {
  const normalizedIso2 = String(iso2 || "").trim().toUpperCase();

  if (!/^[A-Z]{2}$/.test(normalizedIso2)) {
    return "";
  }

  return Array.from(normalizedIso2)
    .map((letter) => String.fromCodePoint(0x1f1e6 + letter.charCodeAt(0) - 65))
    .join("");
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
  setHeaderTitle("World View", { shortTitle: "World" });
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
    const activity = resolveMenuActivity({ activityId: node.activityId });

    if (activity?.launch?.type === "journey") {
      openJourneyFromOverview(activity.launch.journeyId || node.journeyId || node.activityId);
      return;
    }

    if (node.memoryTrailLaunch) {
      void openDirectMemoryTrailActivity(node.activityId);
      return;
    }

    if (currentAppScreen === "free-play") {
      showFreePlayDifficultyScreen(node.activityId);
      return;
    }

    void openActivity(node.activityId, { hierarchyNodeId: node.id });
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
  freePlaySelectedMapFeature = null;
  activeHierarchyNodeId = node.id;
  isNavigationBrowseMode = true;
  document.body.classList.add("overview-mode", "browse-mode");
  document.body.classList.remove("study-mode");
  setHeaderTitle(getHierarchyBreadcrumb(node.id), { shortTitle: node.label });
  instruction.textContent = isNeutralFreePlayRootExplore()
    ? "Tap a place on the globe to explore."
    : "Choose a place on the map or pick a label below.";
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

  getCurrentAnswerItems().forEach((feature) => {
    const chipLabel = getTargetChipLabel(feature) || feature.name;
    const chip = document.createElement("button");
    chip.className = "label-chip";
    chip.type = "button";
    chip.dataset.id = feature.id;
    chip.setAttribute("aria-label", chipLabel);
    chip.appendChild(createChipLabelText(chipLabel));
    const speaker = window.GeographyChipSpeech?.createChipSpeakerControl(chipLabel, {
      onActivate: () => selectAnswerChipFromSpeaker(feature)
    });
    if (speaker) {
      chip.appendChild(speaker);
    }
    chip.setAttribute("aria-pressed", "false");
    chip.addEventListener("pointerdown", (event) => {
      handleChipPointerDown(event, feature);
    });
    chip.addEventListener("pointerup", (event) => {
      handleChipPointerUp(event, feature);
    });
    chip.addEventListener("click", (event) => {
      event.preventDefault();
    });
    answerBank.appendChild(chip);
  });
  ensureActiveTrayContentVisible();
}

function getCurrentAnswerItems() {
  return session.answerItems;
}

function createChipLabelText(labelText) {
  const label = document.createElement("span");
  label.className = "chip-label-text";
  label.textContent = labelText;
  return label;
}

function renderNavigationAnswerBank(nodeId = activeHierarchyNodeId) {
  const node = getHierarchyNode(nodeId);
  setAnswerPanelMode("navigation");
  answerBank.innerHTML = "";
  answerBank.appendChild(createMobileBrowseChip());

  // Free Play country browsing keeps the clicked country card in the existing control area.
  if (currentAppScreen === "free-play" && freePlaySelectedMapFeature) {
    answerBank.appendChild(renderFreePlaySelectedTargetCard(freePlaySelectedMapFeature));
  }

  getHierarchyChildren(node).forEach((child) => {
    const chip = document.createElement("button");
    chip.className = "label-chip navigation-chip";
    chip.type = "button";
    chip.dataset.nodeId = child.id;
    chip.textContent = child.badge ? `${child.label} (${child.badge})` : child.label;
    chip.disabled = Boolean(child.disabled);
    chip.addEventListener("click", () => {
      if (isGameplayNavigationLocked()) {
        showFeedback("Finish this activity first.");
        return;
      }

      if (!child.disabled) {
        closeBrowseDrawer();
        drillToHierarchyNode(child.id);
      }
    });
    answerBank.appendChild(chip);
  });
}

function createMobileBrowseChip() {
  const chip = document.createElement("button");
  chip.className = "label-chip navigation-chip mobile-browse-chip";
  chip.type = "button";
  chip.textContent = "Browse";
  chip.addEventListener("click", toggleBrowseDrawer);
  return chip;
}

function renderFreePlaySelectedTargetCard(candidate) {
  const details = getFreePlaySelectedTargetDetails(candidate);
  const card = document.createElement("section");
  card.className = "free-play-selected-card free-play-country-card";
  card.setAttribute("aria-label", `Selected: ${details.name}`);
  if (details.normalizedId) {
    card.dataset.countryId = details.normalizedId;
  }

  if (details.flagEmoji) {
    const flag = document.createElement("span");
    flag.className = "free-play-country-flag";
    flag.setAttribute("aria-hidden", "true");
    flag.textContent = details.flagEmoji;
    card.appendChild(flag);
  }

  const label = document.createElement("span");
  label.className = "free-play-selected-label";
  label.textContent = "Selected";

  const name = document.createElement("strong");
  name.className = "free-play-selected-name";
  name.textContent = details.name;

  const nameRow = document.createElement("div");
  nameRow.className = "free-play-selected-name-row";
  nameRow.appendChild(name);

  const speaker = window.GeographyChipSpeech?.createChipSpeakerControl(details.name);
  if (speaker) {
    speaker.classList.add("free-play-selected-speaker");
    speaker.setAttribute("aria-label", `Hear pronunciation of ${details.name}`);
    speaker.setAttribute("title", `Hear pronunciation of ${details.name}`);
    nameRow.appendChild(speaker);
  }

  const path = document.createElement("span");
  path.className = "free-play-selected-path";
  path.textContent = details.pathLabels.join(" -> ");

  const audioRow = document.createElement("span");
  audioRow.className = "free-play-country-audio-row";
  audioRow.textContent = "Pronunciation and audio tools coming soon.";

  const facts = document.createElement("span");
  facts.className = "free-play-country-facts";
  facts.textContent = "More country facts coming soon.";

  const clearButton = document.createElement("button");
  clearButton.className = "free-play-selected-clear";
  clearButton.type = "button";
  clearButton.textContent = "Clear";
  clearButton.addEventListener("click", () => {
    freePlaySelectedMapFeature = null;
    instruction.textContent = "Tap a place on the globe to explore.";
    updateOverviewPreview();
    renderNavigationAnswerBank(activeHierarchyNodeId);
    clearFeedback();
  });

  const textWrap = document.createElement("div");
  textWrap.className = "free-play-selected-copy free-play-country-copy";
  textWrap.append(label, nameRow, path, audioRow, facts);
  card.append(textWrap, clearButton);

  return card;
}

function getFreePlaySelectedTargetDetails(candidate) {
  const name = getNavigationCandidateDisplayName(candidate);
  const isoA2 = getNavigationCandidateIsoA2(candidate);
  const normalizedId = getNavigationCandidateNormalizedId(candidate);
  const flagEmoji = iso2ToFlagEmoji(isoA2);
  const contentPath = getKnownContentPathForNavigationCandidate(candidate);

  if (contentPath.length > 0) {
    return {
      name,
      isoA2,
      normalizedId,
      flagEmoji,
      pathLabels: [...contentPath, name]
    };
  }

  const continentNodeId = getContinentNodeIdForCandidate(candidate);
  const fallbackPath = continentNodeId
    ? getHierarchyPath(continentNodeId).map((node) => node.label)
    : ["World"];

  return {
    name,
    isoA2,
    normalizedId,
    flagEmoji,
    pathLabels: [...fallbackPath, name]
  };
}

function getNavigationCandidateIsoA2(candidate) {
  return [
    candidate?.isoA2,
    candidate?.sourceProperties?.ISO_A2,
    candidate?.sourceProperties?.ISO_A2_EH,
    candidate?.properties?.ISO_A2,
    candidate?.properties?.ISO_A2_EH
  ].find((value) => /^[A-Z]{2}$/i.test(String(value || ""))) || "";
}

function getNavigationCandidateNormalizedId(candidate) {
  return [
    candidate?.normalizedCountryId,
    candidate?.targetId,
    candidate?.sourceTargetId,
    candidate?.id
  ].find(Boolean) || "";
}

function getKnownContentPathForNavigationCandidate(candidate) {
  const matchingNodeIds = getHierarchyNodeIdsForActivityTargetCandidate(candidate)
    .filter((nodeId) => nodeId && !getHierarchyNode(nodeId)?.disabled);

  if (matchingNodeIds.length === 0) {
    return [];
  }

  const preferredNodeId = matchingNodeIds
    .sort(compareFreePlayContentPathCandidates)[0];

  return getHierarchyPath(preferredNodeId).map((node) => node.label);
}

function compareFreePlayContentPathCandidates(leftNodeId, rightNodeId) {
  const leftPath = getHierarchyPath(leftNodeId);
  const rightPath = getHierarchyPath(rightNodeId);
  const leftIsReview = leftPath.some((node) => node.id === "review");
  const rightIsReview = rightPath.some((node) => node.id === "review");

  if (leftIsReview !== rightIsReview) {
    return leftIsReview ? 1 : -1;
  }

  return leftPath.length - rightPath.length
    || leftPath.map((node) => node.label).join(" ").localeCompare(rightPath.map((node) => node.label).join(" "));
}

function setAnswerPanelMode(mode) {
  const isNavigation = mode === "navigation";
  const isActivity = mode === "activity";
  const isStudyExplore = mode === "study-explore";
  const titleNode = document.querySelector(".answer-panel-title h2");

  if (titleNode) {
    titleNode.textContent = isNavigation
      ? "Choose Region"
      : isStudyExplore
        ? "Study Targets"
        : "Word Bank";
  }

  if (studyModeControlGroup) {
    studyModeControlGroup.hidden = true;
  }

  if (progressControlGroup) {
    progressControlGroup.hidden = !isActivity;
  }

  if (difficultyControlGroup) {
    difficultyControlGroup.hidden = true;
  }

}

function getJourneyAnalyticsContext(journeyId = activeJourneySession?.journeyId || selectedJourneyId) {
  const journey = journeyPresets.find((preset) => preset.id === journeyId);

  return journey
    ? {
        journey_id: journey.id,
        journey_title: journey.title
      }
    : {};
}

function getActivityAnalyticsContext(activity = session?.currentActivity, options = {}) {
  const journeyContext = getJourneyAnalyticsContext(options.journeyId);
  const difficulty = options.difficulty || getEffectiveDifficulty(activity);

  return {
    level_name: activity?.title || "",
    activity_id: activity?.id || "",
    ...journeyContext,
    mode: options.mode || activeJourneySession?.mode || currentAppScreen || "",
    difficulty
  };
}

function getCurrentActivityAttemptKey(activity = session?.currentActivity) {
  const journeyId = activeJourneySession?.journeyId || activeStudyPracticeSession?.journeyId || "";
  const stepId = activeStudyPracticeSession?.stepId || (activeJourneySession?.currentStepIndex ?? "");

  return [
    currentAppScreen,
    activeJourneySession?.mode || currentAppScreen,
    journeyId,
    stepId,
    activity?.id || "",
    getEffectiveDifficulty(activity),
    activityAttemptAnalyticsSequence
  ].join(":");
}

function trackActivityStart(options = {}) {
  const activity = session?.currentActivity;
  if (!activity?.id || !isActiveGameplayScreen()) {
    return;
  }

  const attemptKey = getCurrentActivityAttemptKey(activity);
  if (!attemptKey || currentActivityAttemptAnalyticsKey === attemptKey) {
    return;
  }

  currentActivityAttemptAnalyticsKey = attemptKey;
  completedActivityAttemptAnalyticsKey = "";
  trackEvent("level_start", getActivityAnalyticsContext(activity, options));
}

function trackActivityEnd(options = {}) {
  const activity = session?.currentActivity;
  const attemptKey = getCurrentActivityAttemptKey(activity);

  if (!activity?.id || !attemptKey || completedActivityAttemptAnalyticsKey === attemptKey) {
    return;
  }

  completedActivityAttemptAnalyticsKey = attemptKey;
  const { completedCount, targetCount } = getSessionCompletionSummary();

  trackEvent("level_end", {
    ...getActivityAnalyticsContext(activity, options),
    success: true,
    incorrect_placements: getCurrentJourneyStepIncorrectPlacements(),
    completed_count: completedCount,
    target_count: targetCount
  });
}

function getMemoryTrailAnalyticsContext() {
  const activity = session?.currentActivity;
  const memoryTrail = getActiveMemoryTrail();

  return {
    activity_id: activity?.id || activeStudySession?.activityId || "",
    activity_title: activity?.title || "",
    ...getJourneyAnalyticsContext(activeStudySession?.journeyId),
    difficulty: getEffectiveDifficulty(activity),
    sequence_length: memoryTrail?.currentPracticeWindow?.length || activity?.targets?.length || 0,
    round_count: memoryTrail?.retrievalPromptCount || memoryTrail?.promptCount || 0
  };
}

async function openActivity(activityId, options = {}) {
  markPerf("mappa-first-activity-start");
  await ensureMapReady();
  closeRiverPreview({ restoreActivityUi: true });
  saveCurrentActivityProgress();
  cancelGrabbedAnswer();
  closeBrowseDrawer();
  clearJourneyAutoAdvanceTimer();
  hideStudyPracticeCompletionCard();
  resetActivityAttemptState();
  activityAttemptAnalyticsSequence += 1;
  hideMemoryTrailOverlay();
  clearMemoryTrailState({ restoreReveals: false });
  resetAudioInstructionState(`activity:${options.appScreen || currentAppScreen}:${activityId}:${Date.now()}`);
  activeStudySession = null;
  runner?.setStudyPreviewMode(false);
  runner?.setMemoryTrailHighlight([]);
  document.body.classList.remove("study-explore-mode");
  const baseActivity = getActivityById(activityId);
  currentPresentationSettings = getEffectivePresentationSettings(baseActivity, options);
  isCurrentActivityProgressDisabled = options.disableActivityProgress === true;
  session.setStudyMode(currentPresentationSettings.reviewMode);
  const shouldRevealGameplay = options.forceGameplayVisible || currentAppScreen !== "launch";
  if (shouldRevealGameplay) {
    currentAppScreen = options.appScreen || "free-play";
    lastTrackedMainMenuVisibility = false;
    document.body.classList.remove("launch-mode", "app-shell-mode");
    if (launchScreen) {
      launchScreen.hidden = true;
    }
    if (appShellScreen) {
      appShellScreen.hidden = true;
    }
  }
  if (options.difficultyId) {
    setPreGameDifficulty(options.difficultyId, getActivityById(activityId));
  }
  selectedActivityId = activityId;
  const hierarchyNode = getHierarchyNode(options.hierarchyNodeId) || getHierarchyNode(findHierarchyNodeForActivity(activityId));
  activeHierarchyNodeId = hierarchyNode?.id || activeHierarchyNodeId;
  activeMenuRoot = getHierarchyMenuRoot(activeHierarchyNodeId) || findMenuRootForActivity(activityId) || activeMenuRoot;
  isNavigationBrowseMode = false;
  const presentedActivity = getPresentedActivity(baseActivity, currentPresentationSettings);
  ensureCurrentDifficultyForActivity(presentedActivity);
  session.setActivity(presentedActivity);
  session.setCompletedIds(isCurrentActivityProgressDisabled ? [] : getActivityProgress(selectedActivityId, getEffectiveDifficulty(session.currentActivity)));
  selectedOverviewActivityId = selectedActivityId;
  activePreviewActivityId = null;
  runner.updateActivity(session.activity);
  runner.setPresentationSettings(currentPresentationSettings);
  runner.setDifficulty(getEffectiveDifficulty(session.currentActivity));
  runner.setCompletedTargets(session.completedIds);
  renderAnswerBank();
  updateProgress();
  updateDifficultyControls();
  clearFeedback();
  renderOverviewLibrary();
  updateResetControlVisibility();
  enterStudy();
  trackActivityStart({
    mode: options.appScreen === "journey-gameplay" ? "journey" : options.appScreen || currentAppScreen,
    difficulty: getEffectiveDifficulty(session.currentActivity)
  });

  if (
    isActiveGameplayScreen()
    && options.appScreen !== "daily-trail-gameplay"
    && options.appScreen !== "united-states-trail-gameplay"
  ) {
    playGameplayInstructionOnce("choose-label", audioInstructionPhrases.chooseLabel);
  }

  markPerf("mappa-first-activity-ready");
  logPerfMeasure("first activity-ready time", "mappa-first-activity-start", "mappa-first-activity-ready");
}

async function openDirectMemoryTrailActivity(activityId) {
  await ensureMapReady();
  const activity = getActivityById(activityId);

  if (!activity || !isMemoryTrailEligible(activity)) {
    showStudyStepNotReady();
    return;
  }

  // Reuse the normal Study/Memory Trail surface without turning this menu item
  // into a Journey. Colorado and Mississippi use accepted Natural Earth source
  // geometry here; their minor endpoint/coastline imperfections are accepted for now.
  await openStudyExploreActivity(
    { id: `${activity.id}-memory-trail`, title: activity.title },
    { id: activity.id, activityId: activity.id, title: activity.title },
    activity,
    { autoStartMemoryTrail: true }
  );
}

function getPresentedActivity(activity, presentationSettings = {}) {
  if (!activity) {
    return activity;
  }

  let presentedActivity = activity;

  if (!shouldShowPointMarkers(activity, currentAppScreen, presentationSettings)) {
    const shapeTargets = activity.targets.filter((target) => target.kind !== "point");
    if (shapeTargets.length > 0) {
      presentedActivity = {
        ...activity,
        targetNoun: activity.targetNoun?.replace(/\s+or\s+capital/i, "") || activity.targetNoun,
        targets: shapeTargets,
        answerBankItems: shapeTargets.map((target) => ({
          id: target.id,
          name: target.name
        }))
      };
    }
  }

  return getDailyTrailPresentedActivity(presentedActivity, presentationSettings);
}

function selectAnswerChipFromSpeaker(feature) {
  if (!feature?.id || isActivityInputLocked()) {
    return;
  }

  if (session.selectedId !== feature.id) {
    cancelGrabbedAnswer({ clearSelection: false });
    session.toggleAnswer(feature.id);
    syncAnswerBank();
  }
}

function getDailyTrailPresentedActivity(activity, presentationSettings = {}) {
  const targetIds = Array.isArray(presentationSettings.adaptiveTrailTargetIds)
    ? presentationSettings.adaptiveTrailTargetIds.filter(Boolean)
    : Array.isArray(presentationSettings.dailyTrailTargetIds)
      ? presentationSettings.dailyTrailTargetIds.filter(Boolean)
    : [];
  const targetItems = Array.isArray(presentationSettings.adaptiveTrailTargetItems)
    ? presentationSettings.adaptiveTrailTargetItems.filter(Boolean)
    : Array.isArray(presentationSettings.dailyTrailTargetItems)
      ? presentationSettings.dailyTrailTargetItems.filter(Boolean)
    : [];
  const visualContextTargetIds = Array.isArray(presentationSettings.adaptiveTrailVisualContextTargetIds)
    ? presentationSettings.adaptiveTrailVisualContextTargetIds.filter(Boolean)
    : Array.isArray(presentationSettings.dailyTrailVisualContextTargetIds)
      ? presentationSettings.dailyTrailVisualContextTargetIds.filter(Boolean)
    : [];

  if (!activity || targetIds.length === 0) {
    return activity;
  }

  const allowedTargetIds = new Set(targetIds);
  const candidates = getDailyTrailPresentationTargetCandidates(activity, targetItems);
  const targetsById = new Map(candidates
    .filter((target) => allowedTargetIds.has(target.id))
    .map((target) => [target.id, target]));
  const targets = targetIds
    .map((targetId) => targetsById.get(targetId))
    .filter(Boolean)
    .map((target) => getDailyTrailCapitalProgressTarget(target, visualContextTargetIds));

  if (targets.length === 0) {
    return activity;
  }

  return {
    ...activity,
    targets,
    visualPointTargets: visualContextTargetIds
      .map((targetId) => candidates.find((target) => target.id === targetId))
      .filter((target) => target?.kind === "point" && !allowedTargetIds.has(target.id))
      .map((target) => getDailyTrailCapitalProgressTarget(target, visualContextTargetIds)),
    answerBankItems: targets.map((target) => ({
      id: target.id,
      name: target.name
    }))
  };
}

function getDailyTrailPresentationTargetCandidates(activity, targetItems = []) {
  const candidates = [...(activity?.targets || [])];

  const sequence = Number(activity.sequence);
  if (activity?.cumulativeGroup && Number.isFinite(sequence)) {
    activities
      .filter((candidate) => candidate.cumulativeGroup === activity.cumulativeGroup)
      .filter((candidate) => Number.isFinite(Number(candidate.sequence)))
      .filter((candidate) => Number(candidate.sequence) <= sequence)
      .sort((left, right) => Number(left.sequence) - Number(right.sequence))
      .flatMap((candidate) => candidate.targets || [])
      .forEach((target) => candidates.push(target));
  }

  if ((activity?.targets || []).every((target) => target.kind === "shape" && target.type === "country")) {
    activities
      .filter((candidate) => candidate.id !== activity.id)
      .filter((candidate) => (candidate.targets || []).every((target) => target.kind === "shape" && target.type === "country"))
      .flatMap((candidate) => candidate.targets || [])
      .forEach((target) => candidates.push(target));
  }

  targetItems.forEach((item) => {
    const itemActivity = getActivityById(item.sourceActivityId || item.homeActivityId);
    const target = itemActivity?.targets?.find((candidate) => candidate.id === item.targetId);
    if (target) {
      candidates.push({
        ...target,
        unitedStatesMemoryTrailItemType: item.type || item.category || "",
        unitedStatesMemoryTrailHomeActivityId: item.homeActivityId || "",
        unitedStatesMemoryTrailSourceActivityId: item.sourceActivityId || item.homeActivityId || "",
        relatedStateTargetId: item.relatedStateTargetId || target.relatedStateTargetId || target.easyAcceptShapeTargetId || ""
      });
    }
  });

  const byId = new Map();
  candidates.filter(Boolean).forEach((target) => {
    if (target.id && !byId.has(target.id)) {
      byId.set(target.id, target);
    }
  });

  return Array.from(byId.values());
}

function getDailyTrailCapitalProgressTarget(target, progressTargetIds = []) {
  if (target?.kind !== "point" || target.type !== "capital") {
    return target;
  }

  const isProgressTarget = progressTargetIds.includes(target.id);
  return {
    ...target,
    dailyTrailCapitalProgressStar: isProgressTarget,
    dailyTrailCapitalProgressStarOpacity: isProgressTarget ? 0.48 : 1
  };
}

function selectActivity(activityId, options = {}) {
  if (options.requireDifficulty) {
    showFreePlayDifficultyScreen(activityId);
    return;
  }

  void openActivity(activityId, options);
}

function enterStudy() {
  document.body.classList.remove("browse-mode");
  document.body.classList.remove("overview-mode");
  document.body.classList.add("study-mode");
  if (currentAppScreen === "daily-trail-gameplay") {
    setDailyTrailGameplayHeaderTitle(activeDailyTrailSession);
  } else {
    setActiveActivityHeaderTitle();
  }
  updateStudyInstruction();
  updateStudyCardDetails();
  updateProgress();
  updateDifficultyControls();
  studyCard.hidden = currentAppScreen === "daily-trail-gameplay";
  runner.enterStudyView();
  renderActivityNavControls(session.currentActivity.id);
  updateTopBarNavigation();
  updateResetControlVisibility();
}

function updateStudyInstruction() {
  if (!isStudyModeActive()) {
    return;
  }

  if (currentAppScreen === "daily-trail-gameplay") {
    instruction.hidden = true;
    instruction.textContent = "";
    return;
  }

  instruction.hidden = false;
  const node = getHierarchyNode(activeHierarchyNodeId);
  const targetNoun = getInstructionNoun();
  instruction.textContent = node?.id === "world"
    ? "Place a label, or click a continent with no label selected to explore."
    : `Select ${getIndefiniteArticle(targetNoun)} ${targetNoun} label, then click its target on the map.`;
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

function getMemoryTrailMapTapPriorityTarget(memoryTrail = getActiveMemoryTrail()) {
  if (
    !memoryTrail
    || isPlaceToNameMemoryTrailPrompt(memoryTrail)
    || !["answering", "correction"].includes(memoryTrail.phase)
  ) {
    return null;
  }

  const targetId = memoryTrail.correction?.expectedTargetId || memoryTrail.currentPromptTargetId;
  return targetId ? getTargetById(memoryTrail, targetId) : null;
}

function isActiveAdaptiveTrailMapResponseScreen(memoryTrail = getActiveMemoryTrail()) {
  return Boolean(
    memoryTrail
    && isAdaptiveTrailMemoryTrail(memoryTrail)
    && currentAppScreen === getAdaptiveTrailGameplayScreen(memoryTrail)
  );
}

function handleTargetClick(targetIds) {
  if (currentAppScreen === "united-states-atlas") {
    const mapPoint = targetIds && !Array.isArray(targetIds) && typeof targetIds.x === "number" ? targetIds : null;
    const stateCandidate = mapPoint
      ? runner.getNavigationCandidatesAtMapPoint(mapPoint).find((candidate) => candidate.kind === "us-state")
      : null;
    selectUnitedStatesAtlasState(stateCandidate?.stateId || stateCandidate?.targetId || "");
    return;
  }

  const activeMemoryTrail = getActiveMemoryTrail();

  if (isActiveAdaptiveTrailMapResponseScreen(activeMemoryTrail)) {
    const memoryTrailMapPoint = targetIds && !Array.isArray(targetIds) && typeof targetIds.x === "number"
      ? targetIds
      : null;
    const priorityTarget = memoryTrailMapPoint ? getMemoryTrailMapTapPriorityTarget() : null;
    const resolvedMemoryTrailTargetIds = memoryTrailMapPoint
      ? runner.getTargetIdsAtMapPoint(targetIds, null, { priorityTarget })
      : targetIds;

    handleMemoryTrailTargetTap(resolvedMemoryTrailTargetIds, memoryTrailMapPoint);
    return;
  }

  if (isActivityInputLocked()) {
    return;
  }

  if (currentAppScreen === "study-explore") {
    const studyMapPoint = targetIds && !Array.isArray(targetIds) && typeof targetIds.x === "number"
      ? targetIds
      : null;
    const priorityTarget = studyMapPoint && isMemoryTrailActive() ? getMemoryTrailMapTapPriorityTarget() : null;
    const resolvedStudyTargetIds = targetIds && !Array.isArray(targetIds) && typeof targetIds.x === "number"
      ? runner.getTargetIdsAtMapPoint(targetIds, null, { priorityTarget })
      : targetIds;

    if (isMemoryTrailActive()) {
      handleMemoryTrailTargetTap(resolvedStudyTargetIds, studyMapPoint);
      return;
    }

    const targetId = Array.isArray(resolvedStudyTargetIds)
      ? resolvedStudyTargetIds[0]
      : resolvedStudyTargetIds;

    if (targetId) {
      revealStudyTarget(targetId);
    }
    return;
  }

  const selectedFeature = session.getFeature(session.selectedId);
  const resolvedTargetIds = targetIds && !Array.isArray(targetIds) && typeof targetIds.x === "number"
    ? runner.getTargetIdsAtMapPoint(targetIds, selectedFeature)
    : targetIds;

  // No-chip map clicks are navigation gestures only outside locked gameplay.
  // During gameplay they must not drill away from the current activity.
  if (!session.selectedId) {
    if (isGameplayNavigationLocked()) {
      showFeedback("Choose a label first.");
      return;
    }

    const navigationCandidates = targetIds && !Array.isArray(targetIds) && typeof targetIds.x === "number"
      ? runner.getNavigationCandidatesAtMapPoint(targetIds)
      : getNavigationCandidatesFromTargetIds(resolvedTargetIds);

    const navigationScopeNode = getNavigationScopeNode();
    const scopeHasAvailableChildren = getHierarchyChildren(navigationScopeNode).some((child) => !child.disabled);

    if (tryShowFreePlaySelectedMapFeature(navigationCandidates)) {
      return;
    }

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

function tryShowFreePlaySelectedMapFeature(navigationCandidates) {
  if (!isFreePlayRootExplore()) {
    return false;
  }

  const candidate = navigationCandidates.find((item) => item?.kind === "world-country" && item.isoA3)
    || navigationCandidates.find((item) => item?.kind === "world-country");

  if (!candidate) {
    return false;
  }

  freePlaySelectedMapFeature = candidate;
  updateOverviewPreview();
  renderNavigationAnswerBank(activeHierarchyNodeId);

  const placeName = getNavigationCandidateDisplayName(candidate);
  const details = getFreePlaySelectedTargetDetails(candidate);
  instruction.textContent = `${placeName} | ${details.pathLabels.join(" -> ")}`;
  showFeedback(placeName, true);

  return true;
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
  const nextNodeId = resolveMapClickNavigationTarget(candidates, activeHierarchyNodeId);

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

function getImmediateChildForDescendant(ancestorNodeId, descendantNodeId) {
  const path = getHierarchyPath(descendantNodeId);
  const ancestorIndex = path.findIndex((node) => node.id === ancestorNodeId);

  if (ancestorIndex < 0 || ancestorIndex >= path.length - 1) {
    return null;
  }

  const childNodeId = path[ancestorIndex + 1]?.id || null;

  return getHierarchyNode(childNodeId)?.disabled ? null : childNodeId;
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

function resolveMapClickNavigationTarget(clickedFeatures, currentNodeId = activeHierarchyNodeId) {
  const currentNode = getHierarchyNode(currentNodeId);
  const candidates = Array.isArray(clickedFeatures)
    ? clickedFeatures
    : getNavigationCandidatesFromTargetIds(clickedFeatures);

  if (!currentNode || candidates.length === 0) {
    debugMapClickResolution({
      currentNodeId,
      clickedFeatures: candidates,
      evaluations: [],
      finalNodeId: null
    });
    return null;
  }

  const evaluations = candidates.flatMap((candidate) => (
    getHierarchyMatchesForNavigationCandidate(candidate)
      .map((match) => evaluateNavigationMatch(match, currentNode.id))
  ));
  const chosen = evaluations
    .filter((evaluation) => evaluation.nodeId && !evaluation.rejected)
    .sort(compareNavigationEvaluations)[0] || null;

  debugMapClickResolution({
    currentNodeId: currentNode.id,
    clickedFeatures: candidates,
    evaluations,
    finalNodeId: chosen?.nodeId || null
  });

  return chosen?.nodeId || null;
}

function getHierarchyMatchesForNavigationCandidate(candidate) {
  if (!candidate) {
    return [];
  }

  const targetId = typeof candidate === "string" ? candidate : candidate.targetId;
  const matches = [];
  const seen = new Set();
  const addMatch = (nodeId, source) => {
    const node = getHierarchyNode(nodeId);
    const key = `${source}:${nodeId}`;

    if (!node || node.disabled || seen.has(key)) {
      return;
    }

    seen.add(key);
    matches.push({
      candidate,
      nodeId: node.id,
      source
    });
  };

  if (targetId) {
    addMatch(targetId, "direct-node");
    getHierarchyNodeIdsForChildTargetAlias(targetId).forEach((nodeId) => {
      addMatch(nodeId, "child-target-alias");
    });
  }

  getHierarchyNodeIdsForNavigationAliasCandidate(candidate).forEach((nodeId) => {
    addMatch(nodeId, "navigation-alias");
  });

  getHierarchyNodeIdsForActivityTargetCandidate(candidate).forEach((nodeId) => {
    addMatch(nodeId, "activity-target");
  });

  addMatch(getContinentNodeIdForCandidate(candidate), "continent");

  return matches;
}

function getHierarchyNodeIdsForChildTargetAlias(targetId) {
  if (!targetId) {
    return [];
  }

  return Object.values(GEOGRAPHY_NAV_NODES)
    .map((node) => node.childTargetIds?.[targetId])
    .filter((nodeId, index, nodeIds) => nodeId && nodeIds.indexOf(nodeId) === index);
}

function getHierarchyNodeIdsForNavigationAliasCandidate(candidate) {
  if (!candidate || typeof candidate === "string") {
    return [];
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

  return Object.values(GEOGRAPHY_NAV_NODES)
    .filter((node) => !node.disabled && isNavigationAliasMatch(node, candidateIds, candidateIsoCodes, candidateNames))
    .map((node) => node.id);
}

function getHierarchyNodeIdsForActivityTargetCandidate(candidate) {
  if (!candidate || typeof candidate === "string") {
    return [];
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
    .filter((nodeId, index, nodeIds) => nodeId && nodeIds.indexOf(nodeId) === index);
}

function evaluateNavigationMatch(match, currentNodeId) {
  const targetNode = getHierarchyNode(match.nodeId);
  const currentNode = getHierarchyNode(currentNodeId);

  if (!targetNode || targetNode.disabled || !currentNode) {
    return rejectNavigationMatch(match, "invalid-node");
  }

  if (targetNode.id === currentNode.id) {
    return rejectNavigationMatch(match, "current-node");
  }

  const childNodeId = getImmediateChildForDescendant(currentNode.id, targetNode.id);

  if (childNodeId) {
    if (targetNode.id === childNodeId) {
      return acceptNavigationMatch(match, childNodeId, "child", 1);
    }

    if (match.source === "activity-target") {
      return rejectNavigationMatch(match, "activity-target-deeper-descendant");
    }

    return acceptNavigationMatch(match, childNodeId, "child-branch", 2);
  }

  const parentNode = getParentNode(currentNode.id);

  if (parentNode) {
    const siblingNodeId = getImmediateChildForDescendant(parentNode.id, targetNode.id);

    if (siblingNodeId && siblingNodeId !== currentNode.id) {
      return acceptNavigationMatch(match, siblingNodeId, targetNode.id === siblingNodeId ? "sibling" : "sibling-branch", targetNode.id === siblingNodeId ? 3 : 4);
    }
  }

  const commonAncestor = getNearestCommonAncestor(currentNode.id, targetNode.id);
  const branchNodeId = commonAncestor
    ? getImmediateChildForDescendant(commonAncestor.id, targetNode.id)
    : null;
  const currentBranchNodeId = commonAncestor
    ? getImmediateChildForDescendant(commonAncestor.id, currentNode.id)
    : null;

  if (branchNodeId && branchNodeId !== currentBranchNodeId && branchNodeId !== currentNode.id) {
    return acceptNavigationMatch(match, branchNodeId, "ancestor-branch", 5);
  }

  return rejectNavigationMatch(match, "outside-navigation-scope");
}

function acceptNavigationMatch(match, nodeId, relation, relationRank) {
  const node = getHierarchyNode(nodeId);

  if (!node || node.disabled || node.mapClickDisabled) {
    return rejectNavigationMatch(match, "disabled-target");
  }

  return {
    ...match,
    matchNodeId: match.nodeId,
    nodeId,
    relation,
    relationRank,
    sourceRank: getNavigationMatchSourceRank(match.source)
  };
}

function rejectNavigationMatch(match, reason) {
  return {
    ...match,
    matchNodeId: match.nodeId,
    nodeId: null,
    relation: null,
    relationRank: Number.POSITIVE_INFINITY,
    sourceRank: getNavigationMatchSourceRank(match.source),
    rejected: true,
    reason
  };
}

function compareNavigationEvaluations(left, right) {
  return left.relationRank - right.relationRank
    || left.sourceRank - right.sourceRank;
}

function debugMapClickResolution(details) {
  if (!isMapClickResolutionDebugEnabled()) {
    return;
  }

  const rows = details.evaluations.map((evaluation) => ({
    source: evaluation.source,
    relation: evaluation.relation || "rejected",
    nodeId: evaluation.nodeId || evaluation.matchNodeId || evaluation.reason || "",
    matchNodeId: evaluation.nodeId ? evaluation.nodeId : evaluation.matchNodeId,
    reason: evaluation.reason || ""
  }));

  console.groupCollapsed("[map-click-resolution]", details.currentNodeId, "->", details.finalNodeId || "none");
  console.log("clicked features", details.clickedFeatures);
  console.table(rows);
  console.groupEnd();
}

function isMapClickResolutionDebugEnabled() {
  try {
    return new URLSearchParams(window.location.search).has("debugMapNavigation")
      || localStorage.getItem("geography-memory-debug-map-navigation") === "true";
  } catch {
    return false;
  }
}

function getNavigationMatchSourceRank(source) {
  const ranks = {
    "direct-node": 1,
    "child-target-alias": 2,
    "navigation-alias": 3,
    continent: 4,
    "activity-target": 5
  };

  return ranks[source] || 99;
}

function getParentNode(nodeId) {
  return getHierarchyNode(getHierarchyNode(nodeId)?.parent);
}

function getSiblingNodes(nodeId) {
  return getHierarchyChildren(getParentNode(nodeId)).filter((node) => node.id !== nodeId && !node.disabled);
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
  if (isActivityInputLocked()) {
    return;
  }

  const targetId = choosePlacementTarget(targetIds);
  const result = session.tryAnswer(targetId);

  if (result.status === "no-selection") {
    showFeedback("Select a label first.");
    return;
  }

  if (result.status === "incorrect") {
    handleIncorrectPlacement(result);
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
    handleJourneyActivityCompletion();
    handleStudyPracticeCompletion();
    handleDailyTrailActivityCompletion();
    ensureActivityNavControls();
    showFeedback(`Correct: ${getTargetChipLabel(result.feature) || result.feature.name}`, true);
  }
}

function recordJourneyIncorrectPlacement() {
  if (activeJourneySession?.mode !== "journey" || currentAppScreen !== "journey-gameplay") {
    return;
  }

  if (journeyCompletionState?.isVisible || isJourneyTransitioning) {
    return;
  }

  activeJourneySession.incorrectPlacements = (activeJourneySession.incorrectPlacements || 0) + 1;
}

function getCurrentJourneyStepIncorrectPlacements() {
  return activityAttemptState?.incorrectPlacements ?? activeJourneySession?.incorrectPlacements ?? 0;
}

function createActivityAttemptState() {
  return {
    incorrectPlacements: 0,
    missesByTargetId: {},
    isRevealing: false,
    isReviewingRetry: false,
    revealTimer: null
  };
}

function resetActivityAttemptState() {
  clearActivityAttemptTimers();
  hideActivityRetryOverlay();
  activeRetryReviewState = null;
  activityAttemptState = createActivityAttemptState();
  if (activeJourneySession?.mode === "journey") {
    activeJourneySession.incorrectPlacements = 0;
  }
}

function clearActivityAttemptTimers() {
  if (activityAttemptState?.revealTimer) {
    window.clearTimeout(activityAttemptState.revealTimer);
  }
}

function isActivityInputLocked() {
  return isJourneyAdvanceInputLocked()
    || studyPracticeCompletionState?.isVisible
    || activityAttemptState?.isRevealing
    || activityAttemptState?.isReviewingRetry;
}

function handleIncorrectPlacement(result) {
  const missedTargetId = result?.selectedId;
  const missCountForTarget = recordIncorrectPlacementAttempt(missedTargetId);

  if (activityAttemptState.incorrectPlacements >= activityRetryThreshold) {
    beginActivityRetryReview();
    return;
  }

  if (missedTargetId && missCountForTarget >= incorrectRevealThreshold) {
    revealCorrectPlacementForRetry(missedTargetId);
    return;
  }

  showFeedback("Not quite - try again.");
}

function recordIncorrectPlacementAttempt(targetId) {
  activityAttemptState.incorrectPlacements += 1;

  if (activeJourneySession?.mode === "journey") {
    recordJourneyIncorrectPlacement();
  }

  if (!targetId) {
    return 0;
  }

  const missesByTargetId = activityAttemptState.missesByTargetId;
  missesByTargetId[targetId] = (missesByTargetId[targetId] || 0) + 1;

  return missesByTargetId[targetId];
}

function revealCorrectPlacementForRetry(targetId) {
  if (!targetId || activityAttemptState.isRevealing || activityAttemptState.isReviewingRetry) {
    return;
  }

  activityAttemptState.isRevealing = true;
  cancelGrabbedAnswer();
  showFeedback("Here it is. Try again.");
  revealTemporaryTargets([targetId]);
  syncAnswerBank();

  activityAttemptState.revealTimer = window.setTimeout(() => {
    activityAttemptState.revealTimer = null;
    activityAttemptState.isRevealing = false;
    restoreTemporaryReveals();
    syncAnswerBank();
    showFeedback("Not quite - try this one again.");
  }, incorrectRevealDurationMs);
}

function revealTemporaryTargets(targetIds = []) {
  const revealIds = targetIds.filter(Boolean);
  const completedIds = new Set(session.completedIds);
  revealIds.forEach((targetId) => completedIds.add(targetId));
  runner.setCompletedTargets(Array.from(completedIds));
}

function restoreTemporaryReveals() {
  runner.setCompletedTargets(session.completedIds);
}

function beginActivityRetryReview() {
  if (activityAttemptState.isReviewingRetry) {
    return;
  }

  activeRetryReviewState = createRetryReviewState();
  activityAttemptState.isReviewingRetry = true;
  activityAttemptState.isRevealing = false;
  if (activityAttemptState.revealTimer) {
    window.clearTimeout(activityAttemptState.revealTimer);
    activityAttemptState.revealTimer = null;
  }

  cancelGrabbedAnswer();
  showFeedback("Quick review: choose how to continue.");
  showActivityRetryOverlay();
  revealTemporaryTargets(session.activity.targets.map((target) => target.id));
  syncAnswerBank();
}

function showActivityRetryOverlay() {
  if (activityRetryMessage) {
    activityRetryMessage.textContent = "This set needs a little more practice.";
  }

  if (activityRetryOverlay) {
    activityRetryOverlay.hidden = false;
  }

  activityRetryStudyButton?.focus();
}

function hideActivityRetryOverlay() {
  if (activityRetryOverlay) {
    activityRetryOverlay.hidden = true;
  }
}

function handleActivityRetryAgainChoice() {
  restartActivityAfterRetryReview();
}

function handleActivityRetryStudyChoice() {
  const retryState = activeRetryReviewState;

  if (!retryState) {
    restartActivityAfterRetryReview();
    return;
  }

  hideActivityRetryOverlay();
  restoreTemporaryReveals();
  resetCurrentActivityProgress();
  activityAttemptState = createActivityAttemptState();
  activeRetryReviewState = null;
  openStudyExploreForRetryReview(retryState);
}

function restartActivityAfterRetryReview() {
  hideActivityRetryOverlay();
  restoreTemporaryReveals();
  activeRetryReviewState = null;
  resetActivityAttemptState();
  resetCurrentActivityProgress();
  showFeedback("Fresh start. You've got this.");
}

function createRetryReviewState() {
  return {
    sourceScreen: currentAppScreen,
    activityId: selectedActivityId || session.currentActivity?.id || null,
    difficultyId: getEffectiveDifficulty(session.currentActivity),
    hierarchyNodeId: activeHierarchyNodeId,
    menuRootId: activeMenuRoot?.id || activeMenuRoot || null,
    selectedJourneyId,
    presentationSettings: { ...currentPresentationSettings },
    isProgressDisabled: isCurrentActivityProgressDisabled,
    journeySession: activeJourneySession ? { ...activeJourneySession } : null,
    studyPracticeSession: activeStudyPracticeSession ? { ...activeStudyPracticeSession } : null
  };
}

function getRetryReviewStudyContext(retryState) {
  const activity = getActivityById(retryState?.activityId) || session.currentActivity;
  const journey = retryState?.journeySession
    ? journeyPresets.find((preset) => preset.id === retryState.journeySession.journeyId)
    : retryState?.studyPracticeSession
      ? journeyPresets.find((preset) => preset.id === retryState.studyPracticeSession.journeyId)
      : null;
  const validSteps = getValidJourneySteps(journey);
  const step = retryState?.journeySession
    ? validSteps[retryState.journeySession.currentStepIndex]
    : retryState?.studyPracticeSession
      ? validSteps.find((candidate) => candidate.id === retryState.studyPracticeSession.stepId)
      : null;

  return {
    journey: journey || {
      id: "retry-review",
      title: "Quick Review"
    },
    step: step || {
      id: retryState?.activityId || activity?.id || "retry-review",
      activityId: activity?.id || retryState?.activityId,
      title: activity?.title || "Current Activity"
    },
    activity
  };
}

function openStudyExploreForRetryReview(retryState) {
  const { journey, step, activity } = getRetryReviewStudyContext(retryState);

  if (!activity) {
    returnToRetryReviewActivity(retryState);
    return;
  }

  void openStudyExploreActivity(journey, step, activity, {
    retryReturnState: retryState
  });
}

function returnToRetryReviewActivity(retryState) {
  if (!retryState?.activityId) {
    showAppScreen("main-menu", { pushHistory: false });
    return;
  }

  selectedJourneyId = retryState.selectedJourneyId || selectedJourneyId;
  activeHierarchyNodeId = retryState.hierarchyNodeId || activeHierarchyNodeId;
  activeMenuRoot = getHierarchyMenuRoot(activeHierarchyNodeId) || retryState.menuRootId || activeMenuRoot;

  if (retryState.sourceScreen === "journey-gameplay" && retryState.journeySession) {
    activeJourneySession = {
      ...retryState.journeySession,
      incorrectPlacements: 0
    };
    activeStudyPracticeSession = null;
    void openActivity(retryState.activityId, {
      appScreen: "journey-gameplay",
      difficultyId: retryState.difficultyId,
      forceGameplayVisible: true,
      hierarchyNodeId: retryState.hierarchyNodeId,
      presentationSettings: retryState.presentationSettings
    });
    showFeedback("Fresh start. You've got this.");
    return;
  }

  if (retryState.sourceScreen === "study-practice" && retryState.studyPracticeSession) {
    activeJourneySession = null;
    activeStudyPracticeSession = { ...retryState.studyPracticeSession };
    void openActivity(retryState.activityId, {
      appScreen: "study-practice",
      difficultyId: retryState.difficultyId,
      disableActivityProgress: true,
      forceGameplayVisible: true,
      hierarchyNodeId: retryState.hierarchyNodeId,
      presentationSettings: retryState.presentationSettings
    });
    showFeedback("Fresh start. You've got this.");
    return;
  }

  activeJourneySession = null;
  activeStudyPracticeSession = null;
  void openActivity(retryState.activityId, {
    appScreen: "free-play",
    difficultyId: retryState.difficultyId,
    disableActivityProgress: retryState.isProgressDisabled,
    forceGameplayVisible: true,
    hierarchyNodeId: retryState.hierarchyNodeId,
    presentationSettings: retryState.presentationSettings
  });
  showFeedback("Fresh start. You've got this.");
}

function resetCurrentActivityProgress() {
  cancelGrabbedAnswer();
  session.reset();
  if (!isCurrentActivityProgressDisabled) {
    setActivityProgress(session.currentActivity.id, [], getEffectiveDifficulty(session.currentActivity));
    setActivityCompletedState(session.currentActivity.id, false);
  }
  runner.setCompletedTargets(session.completedIds);
  runner.setDifficulty(getEffectiveDifficulty(session.currentActivity));
  renderAnswerBank();
  updateProgress();
  updateCompletedActivityState();
  ensureActivityNavControls();
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
  resetActivityAttemptState();
  cancelGrabbedAnswer();
  session.reset();
  if (!isCurrentActivityProgressDisabled) {
    setActivityProgress(session.currentActivity.id, [], getEffectiveDifficulty(session.currentActivity));
    setActivityCompletedState(session.currentActivity.id, false);
  }
  clearFeedback();
  runner.setCompletedTargets(session.completedIds);
  runner.setDifficulty(getEffectiveDifficulty(session.currentActivity));
  renderAnswerBank();
  updateProgress();
  ensureActivityNavControls();
  updateResetControlVisibility();
}

function handleResetButtonClick() {
  if (!shouldShowResetControl()) {
    return;
  }

  const shouldReset = window.confirm("Reset this activity? Your current progress will be cleared.");

  if (!shouldReset) {
    return;
  }

  resetActivity();
}

function syncAnswerBank() {
  const isInputLocked = isActivityInputLocked();

  runner?.setSelectedTarget?.(session?.selectedId || "");

  answerBank.querySelectorAll(".label-chip[data-id]").forEach((chip) => {
    const id = chip.dataset.id;
    const isSelected = session.selectedId === id;
    const isCompleted = session.isCompleted(id);

    chip.classList.toggle("selected", isSelected);
    chip.classList.toggle("used", isCompleted);
    chip.disabled = isInputLocked || isCompleted;
    chip.setAttribute("aria-pressed", String(isSelected));
  });

  updatePlacementCursorState();
}

function updatePlacementCursorState() {
  const active = isActiveGameplayScreen() && Boolean(session?.selectedId || grabbedAnswerId);
  runner?.setPlacementInteractionState?.({
    active,
    dragging: active && Boolean(grabbedAnswerId)
  });
}

function handleChipPointerUp(event, feature) {
  // Pointer-up is intentionally unused for answer selection. Chips select on
  // pointer-down, and placement happens only when the user taps the map.
}

function handleChipPointerDown(event, feature) {
  event.stopPropagation();

  if (isActivityInputLocked()) {
    return;
  }

  event.preventDefault();

  if (isCompactTouchLayout()) {
    if (session.selectedId === feature.id) {
      session.clearSelection();
    } else {
      session.toggleAnswer(feature.id);
    }

    cancelGrabbedAnswer({ clearSelection: false });
    syncAnswerBank();

    if (session.selectedId === feature.id) {
      playFirstChipInstructionIfNeeded();
    }
    return;
  }

  if (grabbedAnswerId === feature.id) {
    cancelGrabbedAnswer();
    return;
  }

  beginGrabbedAnswer(feature.id, event.clientX, event.clientY, event.pointerId);
  playFirstChipInstructionIfNeeded();
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

  floatingChip.textContent = getTargetChipLabel(feature) || feature?.name || "";
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
  const completed = session?.completedIds?.length || 0;
  const total = session?.allAvailableTargets?.length || 0;
  progress.textContent = isCompactTouchLayout() && isStudyModeActive()
    ? `${completed}/${total}`
    : session.progressText;
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

function getDefaultLayerSettings() {
  return { ...defaultMapLayerSettings };
}

function applyLayerPreset(presetId) {
  const preset = mapLayerPresets.find((candidate) => candidate.id === presetId) || mapLayerPresets[0];
  setMapLayerSettings(preset.settings);
}

function applyStudyPreset(presetId) {
  const preset = mapLayerPresets.find((candidate) => candidate.id === presetId) || mapLayerPresets[0];
  const groups = getStudyTargetGroups();
  const nextTargetSettings = {};

  groups.forEach((group) => {
    nextTargetSettings[group.settingKey] = {
      ...(nextTargetSettings[group.settingKey] || {})
    };

    group.targets.forEach((target) => {
      nextTargetSettings[group.settingKey][target.id] = isPresetTargetEnabled(preset, group, target);
    });
  });

  mapLayerSettings = normalizeMapLayerSettings(preset.settings);
  studyTargetSettings = normalizeStudyTargetSettings(nextTargetSettings);
  saveAppSettings();
  refreshCurrentActivityLayerPresentation();
  rerenderSettingsPreservingUiState();
}

function getCurrentLayerPresetId() {
  const matchingPreset = mapLayerPresets.find((preset) => areLayerSettingsEqual(mapLayerSettings, preset.settings));
  return matchingPreset?.id || "custom";
}

function getCurrentStudyPresetId() {
  const matchingPreset = mapLayerPresets.find((preset) => {
    if (!areLayerSettingsEqual(mapLayerSettings, preset.settings)) {
      return false;
    }

    return getStudyTargetGroups().every((group) => {
      return group.targets.every((target) => (
        isStudyTargetEnabled(group.settingKey, target.id) === isPresetTargetEnabled(preset, group, target)
      ));
    });
  });

  return matchingPreset?.id || "custom";
}

function isPresetTargetEnabled(preset, group, target) {
  if (preset.id === "classical-memory") {
    return isClassicalMemoryPresetTarget(group, target);
  }

  return getPresetCategoryEnabled(preset.settings, group.settingKey);
}

function isClassicalMemoryPresetTarget(group, target) {
  if (group.id === "us-states" || group.id === "us-capitals") {
    return true;
  }

  return classicalMemoryProofSheetTargetNames.has(normalizeProofSheetTargetName(target.label));
}

function normalizeProofSheetTargetName(value = "") {
  return String(value)
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function areLayerSettingsEqual(leftSettings = {}, rightSettings = {}) {
  return Object.keys(defaultMapLayerSettings).every((settingId) => (
    leftSettings[settingId] !== false
  ) === (
    rightSettings[settingId] !== false
  ));
}

function getPresetCategoryEnabled(settings = {}, settingKey) {
  const settingByTargetKey = {
    continents: "showContinents",
    oceans: "showOceans",
    countries: "showCountries",
    states: "showStates",
    provinces: "showProvinces",
    territories: "showTerritories",
    politicalDivisions: "showStates",
    cities: "showCities",
    capitals: "showCapitals"
  };
  const settingId = settingByTargetKey[settingKey];

  return settingId ? settings[settingId] !== false : true;
}

function normalizeMapLayerSettings(settings = {}) {
  return Object.fromEntries(
    Object.entries(defaultMapLayerSettings).map(([settingId, defaultValue]) => [
      settingId,
      typeof settings[settingId] === "boolean" ? settings[settingId] : defaultValue
    ])
  );
}

function normalizeStudyTargetSettings(settings = {}) {
  if (!settings || typeof settings !== "object" || Array.isArray(settings)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(settings)
      .filter(([, targets]) => targets && typeof targets === "object" && !Array.isArray(targets))
      .map(([settingKey, targets]) => [
        settingKey,
        Object.fromEntries(
          Object.entries(targets)
            .filter(([targetId, value]) => typeof targetId === "string" && typeof value === "boolean")
        )
      ])
  );
}

function isStudyTargetEnabled(settingKey, targetId) {
  return studyTargetSettings?.[settingKey]?.[targetId] !== false;
}

function toggleTarget(settingKey, targetId, enabled, focusControl = "") {
  studyTargetSettings = normalizeStudyTargetSettings({
    ...studyTargetSettings,
    [settingKey]: {
      ...(studyTargetSettings[settingKey] || {}),
      [targetId]: enabled
    }
  });
  saveAppSettings();
  rerenderSettingsPreservingUiState(focusControl);
}

function toggleTargetGroup(settingKey, targets, enabled, focusControl = "") {
  studyTargetSettings = normalizeStudyTargetSettings({
    ...studyTargetSettings,
    [settingKey]: {
      ...(studyTargetSettings[settingKey] || {}),
      ...Object.fromEntries(targets.map((target) => [target.id, enabled]))
    }
  });
  saveAppSettings();
  rerenderSettingsPreservingUiState(focusControl);
}

function loadMapLayerSettings() {
  try {
    const saved = loadStoredAppSettings();

    if (saved?.version === 1 && saved.mapLayers && typeof saved.mapLayers === "object" && !Array.isArray(saved.mapLayers)) {
      return normalizeMapLayerSettings(saved.mapLayers);
    }

    const legacySaved = JSON.parse(localStorage.getItem(legacyLayerSettingsStorageKey) || "{}");
    return normalizeMapLayerSettings({
      ...legacySaved,
      showCapitals: typeof legacySaved.showCities === "boolean"
        ? legacySaved.showCities
        : legacySaved.showCapitals
    });
  } catch {
    return getDefaultLayerSettings();
  }
}

function loadStudyTargetSettings() {
  try {
    const saved = loadStoredAppSettings();
    return normalizeStudyTargetSettings(saved?.targetSettings);
  } catch {
    return {};
  }
}

function normalizeAudioSettings(settings = {}) {
  const hasExplicitInstructionChoice = settings?.speakMemoryTrailInstructionsUserSet === true;

  return {
    speakMemoryTrailInstructions: hasExplicitInstructionChoice
      ? settings?.speakMemoryTrailInstructions !== false
      : true,
    speakMemoryTrailInstructionsUserSet: hasExplicitInstructionChoice
  };
}

function loadAudioSettings() {
  try {
    return normalizeAudioSettings(loadStoredAppSettings()?.audio);
  } catch {
    return normalizeAudioSettings();
  }
}

function loadStoredAppSettings() {
  try {
    return JSON.parse(localStorage.getItem(appSettingsStorageKey) || "{}");
  } catch {
    return {};
  }
}

function saveAppSettings() {
  try {
    localStorage.setItem(appSettingsStorageKey, JSON.stringify({
      version: defaultAppSettings.version,
      mapLayers: normalizeMapLayerSettings(mapLayerSettings),
      targetSettings: normalizeStudyTargetSettings(studyTargetSettings),
      audio: normalizeAudioSettings(audioSettings)
    }));
  } catch {
    // Ignore localStorage write failures and keep the session going.
  }
}

function saveMapLayerSettings() {
  saveAppSettings();
}

function setMapLayerSettings(nextSettings = {}, focusControl = "") {
  mapLayerSettings = normalizeMapLayerSettings({
    ...mapLayerSettings,
    ...nextSettings
  });
  saveMapLayerSettings();
  refreshCurrentActivityLayerPresentation();
  if (currentAppScreen === "customize") {
    rerenderSettingsPreservingUiState(focusControl);
  }
}

function setAudioSettings(nextSettings = {}, focusControl = "") {
  audioSettings = normalizeAudioSettings({
    ...audioSettings,
    ...nextSettings,
    speakMemoryTrailInstructionsUserSet: Object.prototype.hasOwnProperty.call(nextSettings, "speakMemoryTrailInstructions")
      ? true
      : audioSettings.speakMemoryTrailInstructionsUserSet === true
  });
  saveAppSettings();

  if (currentAppScreen === "customize") {
    rerenderSettingsPreservingUiState(focusControl);
  }
}

function refreshCurrentActivityLayerPresentation() {
  if (!selectedActivityId) {
    return;
  }

  const baseActivity = getSelectedActivity();

  if (!baseActivity || activeJourneySession?.mode === "journey") {
    return;
  }

  currentPresentationSettings = getEffectivePresentationSettings(baseActivity, {
    presentationSettings: {
      reviewMode: currentPresentationSettings.reviewMode
    }
  });

  const presentedActivity = getPresentedActivity(baseActivity, currentPresentationSettings);
  const retainedCompletedIds = session.completedIds.filter((id) => (
    presentedActivity.targets.some((target) => target.id === id)
  ));
  session.setStudyMode(currentPresentationSettings.reviewMode);
  session.setActivity(presentedActivity);
  session.setCompletedIds(retainedCompletedIds);
  runner.updateActivity(session.activity);
  runner.setPresentationSettings(currentPresentationSettings);
  runner.setDifficulty(getEffectiveDifficulty(session.currentActivity));
  runner.setCompletedTargets(session.completedIds);
  renderAnswerBank();
  updateProgress();
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
  if (isCurrentActivityProgressDisabled) {
    return;
  }

  const { completedCount, targetCount } = getSessionCompletionSummary();

  if (targetCount <= 0) {
    return;
  }

  const isComplete = completedCount === targetCount;
  setActivityCompletedState(session.currentActivity.id, isComplete);
}

function handleStudyPracticeCompletion() {
  if (currentAppScreen !== "study-practice" || !activeStudyPracticeSession || studyPracticeCompletionState?.isVisible) {
    return;
  }

  const { completedCount, targetCount } = getSessionCompletionSummary();
  if (targetCount <= 0 || completedCount !== targetCount) {
    return;
  }

  trackActivityEnd({
    mode: "study"
  });
  trackEvent("study_practice_completed", {
    activity_id: activeStudyPracticeSession.activityId,
    ...getJourneyAnalyticsContext(activeStudyPracticeSession.journeyId),
    difficulty: getEffectiveDifficulty(session.currentActivity),
    completed_count: completedCount,
    target_count: targetCount
  });
  showStudyPracticeCompletionCard();
}

function showStudyPracticeCompletionCard() {
  cancelGrabbedAnswer({ clearSelection: false });
  studyPracticeCompletionState = {
    isVisible: true
  };

  if (journeyCompletionOverlay) {
    journeyCompletionOverlay.hidden = false;
    journeyCompletionOverlay.classList.remove("journey-celebration-overlay");
  }

  if (journeyCompletionCard) {
    journeyCompletionCard.classList.remove("journey-celebration-card");
  }

  if (journeyCompletionKicker) {
    journeyCompletionKicker.textContent = "Study Practice";
  }

  if (journeyCompletionTitle) {
    journeyCompletionTitle.textContent = "Great job!";
  }

  if (journeyCompletionMessage) {
    journeyCompletionMessage.textContent = "You practiced this activity.";
  }

  if (journeyCompletionNext) {
    journeyCompletionNext.textContent = "Ready to review it again or head back to Study.";
  }

  if (journeyCompletionPrimary) {
    journeyCompletionPrimary.hidden = false;
    journeyCompletionPrimary.disabled = false;
    journeyCompletionPrimary.textContent = "Practice Again";
  }

  if (journeyCompletionSecondary) {
    journeyCompletionSecondary.hidden = false;
    journeyCompletionSecondary.disabled = false;
    journeyCompletionSecondary.textContent = "Back to Study";
  }

  if (journeyCompletionFeedback) {
    journeyCompletionFeedback.hidden = true;
  }

  syncAnswerBank();
}

function hideStudyPracticeCompletionCard() {
  if (!studyPracticeCompletionState?.isVisible) {
    studyPracticeCompletionState = null;
    return;
  }

  studyPracticeCompletionState = null;

  if (journeyCompletionOverlay && !journeyCompletionState?.isVisible) {
    journeyCompletionOverlay.hidden = true;
    journeyCompletionOverlay.classList.remove("journey-celebration-overlay");
  }

  if (journeyCompletionCard && !journeyCompletionState?.isVisible) {
    journeyCompletionCard.classList.remove("journey-celebration-card");
  }
}

function handleStudyPracticePrimary() {
  const sessionToRepeat = activeStudyPracticeSession;
  if (!sessionToRepeat) {
    hideStudyPracticeCompletionCard();
    returnToStudyScreen();
    return;
  }

  hideStudyPracticeCompletionCard();
  void startStudyPracticeActivity(sessionToRepeat.journeyId, sessionToRepeat.stepId);
}

function handleStudyPracticeSecondary() {
  hideStudyPracticeCompletionCard();
  returnToStudyScreen();
}

function returnToStudyScreen() {
  activeStudyPracticeSession = null;
  resetActivityAttemptState();
  showAppScreen(selectedJourneyId ? "study" : "main-menu", { pushHistory: false });
}

function handleJourneyActivityCompletion() {
  if (activeJourneySession?.mode !== "journey" || journeyCompletionState?.isVisible || isJourneyTransitioning) {
    return;
  }

  const { completedCount, targetCount } = getSessionCompletionSummary();
  if (targetCount <= 0 || completedCount !== targetCount) {
    return;
  }

  trackActivityEnd({
    mode: "journey"
  });
  saveCompletedJourneyStep();
  showJourneyCompletionCard();
}

function isJourneyAdvanceInputLocked() {
  return Boolean(activeJourneySession?.mode === "journey" && (
    isJourneyTransitioning || journeyCompletionState?.isVisible
  ));
}

function getSessionCompletionSummary() {
  const completedCount = session?.completedIds?.length || 0;
  const targetCount = session?.activity?.targets?.length || 0;

  return {
    completedCount,
    targetCount
  };
}

function saveCompletedJourneyStep() {
  const journey = journeyPresets.find((preset) => preset.id === activeJourneySession?.journeyId);
  const validSteps = getValidJourneySteps(journey);
  const stepIndex = activeJourneySession?.currentStepIndex || 0;
  const currentStep = validSteps[stepIndex];
  const nextStep = validSteps[stepIndex + 1];

  if (!journey || !currentStep) {
    return;
  }

  atlasProgress = markStepComplete(journey.id, currentStep.id, activeJourneySession.difficulty, {
    nextStepIndex: nextStep ? stepIndex + 1 : null,
    isJourneyComplete: !nextStep
  }, atlasProgress);
}

function showJourneyCompletionCard() {
  const journey = journeyPresets.find((preset) => preset.id === activeJourneySession?.journeyId);
  const validSteps = getValidJourneySteps(journey);
  const nextStep = validSteps[(activeJourneySession?.currentStepIndex || 0) + 1];
  const isFinalStep = !nextStep;

  clearJourneyAutoAdvanceTimer();
  cancelGrabbedAnswer({ clearSelection: false });
  journeyCompletionState = {
    isVisible: true,
    isFinalStep,
    nextStepIndex: isFinalStep ? null : (activeJourneySession?.currentStepIndex || 0) + 1,
    autoAdvanceScheduled: !isFinalStep,
    isPerfect: getCurrentJourneyStepIncorrectPlacements() === 0
  };

  if (isFinalStep && journey) {
    trackEvent("journey_completed", {
      journey_id: journey.id,
      journey_title: journey.title,
      difficulty: activeJourneySession?.difficulty,
      incorrect_placements: getCurrentJourneyStepIncorrectPlacements()
    });
  }

  if (journeyCompletionOverlay) {
    journeyCompletionOverlay.hidden = false;
    journeyCompletionOverlay.classList.toggle("journey-celebration-overlay", !isFinalStep);
  }

  if (journeyCompletionCard) {
    journeyCompletionCard.classList.toggle("journey-celebration-card", !isFinalStep);
  }

  if (journeyCompletionKicker) {
    journeyCompletionKicker.textContent = isFinalStep ? "Journey Complete" : "On to the Next Stop!";
  }

  if (journeyCompletionTitle) {
    journeyCompletionTitle.textContent = isFinalStep
      ? "Journey Complete!"
      : journeyCompletionState.isPerfect
        ? "PERFECT!"
        : "GREAT JOB!";
  }

  if (journeyCompletionMessage) {
    journeyCompletionMessage.textContent = isFinalStep
      ? `You finished ${journey?.title || "this journey"}.`
      : "Flying to your next destination...";
  }

  if (journeyCompletionNext) {
    journeyCompletionNext.textContent = isFinalStep
      ? "Nice work. You made it through every step in this journey."
      : `Next stop: ${nextStep.title}`;
  }

  if (journeyCompletionPrimary) {
    journeyCompletionPrimary.hidden = !isFinalStep;
    journeyCompletionPrimary.disabled = false;
    journeyCompletionPrimary.textContent = "Back to Journeys";
  }

  if (journeyCompletionSecondary) {
    journeyCompletionSecondary.hidden = !isFinalStep;
    journeyCompletionSecondary.disabled = false;
    journeyCompletionSecondary.textContent = "Play Again";
  }

  if (journeyCompletionFeedback) {
    journeyCompletionFeedback.hidden = !isFinalStep;
  }

  updateJourneyMemoryTrailControlVisibility();
  syncAnswerBank();

  if (!isFinalStep) {
    scheduleJourneyAutoAdvance(journeyCompletionState.nextStepIndex);
  }
}

function hideJourneyCompletionCard() {
  clearJourneyAutoAdvanceTimer();
  journeyCompletionState = null;

  if (journeyCompletionOverlay) {
    journeyCompletionOverlay.hidden = true;
    journeyCompletionOverlay.classList.remove("journey-celebration-overlay");
  }

  if (journeyCompletionCard) {
    journeyCompletionCard.classList.remove("journey-celebration-card");
  }

  if (journeyCompletionPrimary) {
    journeyCompletionPrimary.hidden = false;
  }

  if (journeyCompletionSecondary) {
    journeyCompletionSecondary.hidden = false;
  }

  if (journeyCompletionFeedback) {
    journeyCompletionFeedback.hidden = true;
  }

  updateJourneyMemoryTrailControlVisibility();
}

function scheduleJourneyAutoAdvance(nextStepIndex) {
  if (!Number.isInteger(nextStepIndex) || isJourneyTransitioning) {
    return;
  }

  journeyAutoAdvanceTimer = window.setTimeout(() => {
    journeyAutoAdvanceTimer = null;

    if (!journeyCompletionState?.isVisible || journeyCompletionState?.isFinalStep || isJourneyTransitioning) {
      return;
    }

    void advanceToJourneyStep(nextStepIndex);
  }, 1500);
}

function clearJourneyAutoAdvanceTimer() {
  if (!journeyAutoAdvanceTimer) {
    return;
  }

  window.clearTimeout(journeyAutoAdvanceTimer);
  journeyAutoAdvanceTimer = null;
}

function handleJourneyCompletionPrimary() {
  if (studyPracticeCompletionState?.isVisible) {
    handleStudyPracticePrimary();
    return;
  }

  if (isJourneyTransitioning) {
    return;
  }

  if (!activeJourneySession) {
    hideJourneyCompletionCard();
    showAppScreen("choose-journey");
    return;
  }

  const journey = journeyPresets.find((preset) => preset.id === activeJourneySession.journeyId);
  const validSteps = getValidJourneySteps(journey);
  const nextStepIndex = activeJourneySession.currentStepIndex + 1;

  hideJourneyCompletionCard();

  if (nextStepIndex < validSteps.length) {
    void advanceToJourneyStep(nextStepIndex);
    return;
  }

  atlasProgress = clearActiveJourney(atlasProgress);
  activeJourneySession = null;
  resetJourneyGameplayInstructionSession();
  showAppScreen("choose-journey");
}

async function advanceToJourneyStep(nextStepIndex) {
  const journey = journeyPresets.find((preset) => preset.id === activeJourneySession?.journeyId);
  const validSteps = getValidJourneySteps(journey);
  const nextStep = validSteps[nextStepIndex];

  if (!nextStep) {
    hideJourneyCompletionCard();
    showJourneyStepNotReady();
    return;
  }

  isJourneyTransitioning = true;
  setJourneyCompletionTransitionState(nextStep);
  playJourneyTransitionSound();

  await transitionToJourneyStep(nextStep);

  hideJourneyCompletionCard();
  isJourneyTransitioning = false;
  await openJourneyStep(nextStepIndex);
}

function playJourneyTransitionSound() {
  playJourneyWhooshSound();
}

function playJourneyWhooshSound() {
  // TODO: add a short whoosh sound asset later, routed through mute/settings.
}

function setJourneyCompletionTransitionState(nextStep) {
  if (journeyCompletionState) {
    journeyCompletionState.autoAdvanceScheduled = false;
    journeyCompletionState.isTransitioning = true;
  }

  if (journeyCompletionMessage) {
    journeyCompletionMessage.textContent = "Flying to your next destination...";
  }

  if (journeyCompletionNext) {
    journeyCompletionNext.textContent = `Next stop: ${nextStep.title}`;
  }

  if (journeyCompletionPrimary) {
    journeyCompletionPrimary.hidden = true;
    journeyCompletionPrimary.disabled = true;
    journeyCompletionPrimary.textContent = `Flying to ${nextStep.title}...`;
  }

  if (journeyCompletionSecondary) {
    journeyCompletionSecondary.hidden = true;
    journeyCompletionSecondary.disabled = true;
  }

  if (journeyCompletionFeedback) {
    journeyCompletionFeedback.hidden = true;
  }

  updateJourneyMemoryTrailControlVisibility();
  syncAnswerBank();
}

function showJourneyStepNotReady() {
  activeJourneySession = null;
  resetJourneyGameplayInstructionSession();
  showAppScreen(selectedJourneyId ? "journey-detail" : "choose-journey");
  showFeedback("This journey step is not ready yet.");
}

function handleJourneyCompletionSecondary() {
  if (studyPracticeCompletionState?.isVisible) {
    handleStudyPracticeSecondary();
    return;
  }

  if (isJourneyTransitioning) {
    return;
  }

  if (journeyCompletionState?.isFinalStep && activeJourneySession) {
    hideJourneyCompletionCard();
    activeJourneySession.currentStepIndex = 0;
    activeJourneySession.incorrectPlacements = 0;
    atlasProgress = setActiveJourney(activeJourneySession.journeyId, 0, activeJourneySession.difficulty, atlasProgress);
    void openJourneyStep(0);
    return;
  }

  exitJourney();
}

function exitJourney() {
  if (isJourneyTransitioning) {
    return;
  }

  clearJourneyAutoAdvanceTimer();
  hideJourneyCompletionCard();
  atlasProgress = clearActiveJourney(atlasProgress);
  activeJourneySession = null;
  resetJourneyGameplayInstructionSession();
  showAppScreen(selectedJourneyId ? "journey-detail" : "main-menu", { pushHistory: false });
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
  if (isGameplayNavigationLocked()) {
    showFeedback("Finish this activity first.");
    updateActivityNavigationControls();
    return;
  }

  const activitySequence = getCurrentActivitySequence(session.currentActivity.mapSet || activeMapSet);
  const currentIndex = activitySequence.findIndex((activity) => activity.id === selectedActivityId);

  if (currentIndex <= 0) {
    showFeedback("No previous region.");
    updateActivityNavigationControls();
    return;
  }

  void openActivity(activitySequence[currentIndex - 1].id);
}

function openNextIncompleteActivity() {
  if (isGameplayNavigationLocked()) {
    showFeedback("Finish this activity first.");
    updateActivityNavigationControls();
    return;
  }

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
      void openActivity(nextActivity.id);
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
    previousActivityButton.disabled = isGameplayNavigationLocked() || currentIndex <= 0;
  }

  if (nextIncompleteButton) {
    nextIncompleteButton.disabled = isGameplayNavigationLocked();
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
  const shouldShow = Boolean(activityId) && !isGameplayNavigationLocked();

  if (activityNavControls) {
    activityNavControls.hidden = !shouldShow;
    activityNavControls.style.display = shouldShow ? "flex" : "none";
    activityNavControls.style.visibility = shouldShow ? "visible" : "hidden";
    activityNavControls.style.opacity = shouldShow ? "1" : "0";
  }

  updateActivityNavigationControls();
}

function updateTopBarNavigation() {
  const isHome = activeHierarchyNodeId === "world";
  const isDailyTrailGameplay = currentAppScreen === "daily-trail-gameplay";
  const isUnitedStatesAtlas = currentAppScreen === "united-states-atlas";

  if (backButton) {
    backButton.hidden = !isUnitedStatesAtlas && !isDailyTrailGameplay
      && isHome
      && !["free-play", "journey-gameplay", "study-explore", "study-practice"].includes(currentAppScreen);
    backButton.textContent = isDailyTrailGameplay ? "Exit" : "Back";
    backButton.setAttribute("aria-label", isDailyTrailGameplay ? "Exit Daily Trail" : "Back");
    backButton.title = isDailyTrailGameplay ? "Exit Daily Trail" : "Back";
  }

  if (homeButton) {
    homeButton.hidden = isDailyTrailGameplay;
    homeButton.disabled = false;
    homeButton.tabIndex = isDailyTrailGameplay ? -1 : 0;
    homeButton.setAttribute("aria-hidden", String(isDailyTrailGameplay));
    homeButton.setAttribute("aria-current", isHome ? "page" : "false");
  }

  updateResetControlVisibility();
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

  const isApplicable = false;
  difficultyToggle.hidden = true;

  if (difficultyControlGroup) {
    difficultyControlGroup.hidden = true;
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
  if (currentAppScreen === "daily-trail-gameplay") {
    if (studyCard) {
      studyCard.hidden = true;
    }
    return;
  }

  studyCard.querySelector("strong").textContent = getActivityHeaderDisplayName(session.currentActivity);
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

function getActivityById(activityId) {
  return activities.find((activity) => activity.id === activityId) || null;
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
  setHeaderTitle("Geography Memory could not load", { shortTitle: "Load Error" });
  instruction.textContent = error.message;
});
