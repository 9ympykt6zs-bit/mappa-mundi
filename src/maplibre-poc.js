import { normalizeActivity } from "./map-engines/activity-normalizer.js";
import { ActivitySession, studyModes } from "./maplibre/activity-session.js?v=progress-state";
import "./chip-speech.js?v=tts-answer-chips";
import { difficultyModes, MapLibreActivityRunner } from "./maplibre/maplibre-activity-runner.js?v=polar-artifact-cleanup";
import { journeyPresets } from "./journey-presets.js?v=journey-presets-expanded";
import {
  clearActiveJourney,
  getJourneyProgress,
  loadProgress,
  markStepComplete,
  resetJourneyDifficulty,
  setActiveJourney
} from "./progress-store.js";

const APP_NAME = "Atlas Quest";
const activityDataPaths = [
  "assets/maps/data/continents-oceans.json",
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
const oceanZonesPath = "assets/maps/data/ocean-zones.geojson";
const inlandWatersPath = "assets/maps/data/inland-waters.geojson";
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
const defaultActivityId = "continents-oceans";
const defaultMenuRoot = "world";
const defaultMapSet = "world-europe";
const completedActivitiesStorageKey = "geography-memory-completed-activities";
const activityProgressStorageKey = "geography-memory-activity-progress";
const difficultyStorageKey = "geography-memory-difficulty-mode";
const appSettingsStorageKey = "atlasQuestSettings";
const legacyLayerSettingsStorageKey = "atlas-quest-layer-settings";
const onboardingSeenStorageKey = "atlasQuestOnboardingSeen";
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
    description: "Balanced Atlas Quest defaults.",
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
  targetSettings: {}
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
Washington, DC
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
  }
};
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
    children: ["asia-middle-east", "asia-south", "asia-india-political-divisions", "asia-central", "asia-caucasus", "asia-east", "asia-japan-political-divisions", "asia-china-political-divisions", "asia-mainland-southeast", "asia-maritime-southeast", "asia-cities"]
  },
  "asia-middle-east": {
    id: "asia-middle-east",
    label: "Middle East",
    parent: "asia",
    activityId: "middle-east-countries",
    activityLabel: "Countries"
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
let selectedJourneyPlayState = {
  journeyId: null,
  difficultyId: "medium"
};
let pendingFreePlayActivityId = null;
let pendingFreePlayHierarchyNodeId = null;
let selectedFreePlayDifficultyId = difficultyModes.easy;
let activeJourneySession = null;
let activeStudySession = null;
let activeStudyPracticeSession = null;
let journeyCompletionState = null;
let studyPracticeCompletionState = null;
let isJourneyTransitioning = false;
let journeyAutoAdvanceTimer = null;
let activityAttemptState = createActivityAttemptState();
let activeRetryReviewState = null;
let atlasProgress = loadProgress();
let mapLayerSettings = loadMapLayerSettings();
let studyTargetSettings = loadStudyTargetSettings();
let currentPresentationSettings = {};
let isCurrentActivityProgressDisabled = false;

const incorrectRevealThreshold = 3;
const activityRetryThreshold = 5;
const incorrectRevealDurationMs = 1700;

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
const launchScreen = document.querySelector("#launch-screen");
const launchTitle = document.querySelector("#launch-title");
const launchStartButton = document.querySelector("#launch-start-button");
const launchSettingsGear = document.querySelector("#launch-settings-gear");
const appShellScreen = document.querySelector("#app-shell-screen");
const appShellTitle = document.querySelector("#app-shell-title");
const appShellSubtitle = document.querySelector("#app-shell-subtitle");
const appShellBackButton = document.querySelector("#app-shell-back-button");
const appShellSettingsGear = document.querySelector("#app-shell-settings-gear");
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
const mainMenuFreePlayButton = document.querySelector("#main-menu-free-play-button");
const mainMenuSettingsButton = document.querySelector("#main-menu-settings-button");
const infoPopover = document.querySelector("#info-popover");

function isCompactTouchLayout() {
  return Boolean(window.matchMedia?.("(max-width: 760px), (max-width: 900px) and (max-height: 520px)")?.matches);
}

function isActiveGameplayScreen() {
  return currentAppScreen === "journey-gameplay"
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
  return Boolean(session?.currentActivity && isActiveGameplayScreen());
}

function updateResetControlVisibility() {
  if (!resetButton) {
    return;
  }

  const shouldShow = shouldShowResetControl();
  resetButton.hidden = !shouldShow;
  resetButton.disabled = !shouldShow;
  resetButton.tabIndex = shouldShow ? 0 : -1;
  resetButton.setAttribute("aria-hidden", String(!shouldShow));
}

function setHeaderTitle(fullTitle, options = {}) {
  if (!title) {
    return;
  }

  const normalizedTitle = String(fullTitle || "").trim();
  const shortTitle = options.shortTitle
    || normalizedTitle.split(" -> ").filter(Boolean).pop()
    || normalizedTitle
    || "Atlas Quest";

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
const activityRetryOverlay = document.querySelector("#activity-retry-overlay");
const activityRetryMessage = document.querySelector("#activity-retry-message");
const activityRetryStudyButton = document.querySelector("#activity-retry-study-button");
const activityRetryAgainButton = document.querySelector("#activity-retry-again-button");

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

const defaultQuickStartJourneyId = "world-foundations";
const defaultQuickStartDifficulty = difficultyModes.easy;

async function init() {
  document.title = APP_NAME;
  if (launchTitle) {
    launchTitle.textContent = APP_NAME;
  }

  const [loadedActivities, worldCountries, supplementalWorldCountries, oceanZones, inlandWaters, usStatesAtlas, stateTargets, northAmericaAdmin1, australiaAdmin1, chinaAdmin1, russiaAdmin1, indiaAdmin1, brazilAdmin1, japanAdmin1, germanyAdmin1, franceAdmin1, spainAdmin1, italyAdmin1, unitedKingdomAdmin1] = await Promise.all([
    Promise.all(activityDataPaths.map((path) => fetchJson(path))),
    fetchJson(worldCountriesPath),
    Promise.all(worldCountrySupplements.map((path) => fetchJson(path))),
    fetchJson(oceanZonesPath),
    fetchJson(inlandWatersPath),
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
    oceanZones,
    inlandWaters,
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
  runner.setDifficulty(getEffectiveDifficulty(session.currentActivity));

  renderAnswerBank();
  updateProgress();
  updateStudyModeButtons();
  updateDifficultyControls();
  updateResetControlVisibility();
  studyCard.hidden = true;
  runner.setOverviewMapSet(activeMenuRoot, getMenuOverviewView(activeMenuRoot));
  renderOverviewLibrary();
  updateOverviewPreview();
  bindLaunchScreenEvents();
  bindUiEvents();
  bindZoomControls();
  setBrowseDrawerOpen(false);
  updateActivityNavigationControls();

  const initialActivityId = getInitialActivityFromUrl();

  if (initialActivityId) {
    openActivity(initialActivityId, { forceGameplayVisible: true });
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
    sortOrder: metadata.sortOrder
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
    if (currentAppScreen === "study-explore") {
      exitStudyExplore();
      return;
    }

    if (currentAppScreen === "study-practice") {
      returnToStudyScreen();
      return;
    }

    showAppScreen("main-menu");
  });
  backButton?.addEventListener("click", () => {
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

    if (currentAppScreen === "free-play" && activeHierarchyNodeId === "world") {
      goBackAppScreen();
      return;
    }

    goBack();
  });
  browseButton?.addEventListener("click", toggleBrowseDrawer);
  browseCloseButton?.addEventListener("click", closeBrowseDrawer);
  settingsButton?.addEventListener("click", () => {
    showAppScreen("settings");
  });
  previousActivityButton?.addEventListener("click", openPreviousActivity);
  nextIncompleteButton?.addEventListener("click", openNextIncompleteActivity);
  resetButton.addEventListener("click", handleResetButtonClick);
  activityRetryStudyButton?.addEventListener("click", handleActivityRetryStudyChoice);
  activityRetryAgainButton?.addEventListener("click", handleActivityRetryAgainChoice);
  journeyCompletionPrimary?.addEventListener("click", handleJourneyCompletionPrimary);
  journeyCompletionSecondary?.addEventListener("click", handleJourneyCompletionSecondary);
  document.addEventListener("click", handleDocumentInfoClick);
  document.addEventListener("pointermove", handleDocumentPointerMove);
  document.addEventListener("pointerup", handleDocumentPointerUp);
  document.addEventListener("pointercancel", cancelGrabbedAnswer);
  window.addEventListener("resize", refreshHeaderTitleForLayout);
  window.addEventListener("orientationchange", refreshHeaderTitleForLayout);
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeInfoPopover();
      closeBrowseDrawer();
      cancelGrabbedAnswer();
    }
  });
}

function bindLaunchScreenEvents() {
  launchStartButton?.addEventListener("click", handleLaunchStart);

  launchSettingsGear?.addEventListener("click", () => showAppScreen("settings"));
  appShellBackButton?.addEventListener("click", goBackAppScreen);
  appShellSettingsGear?.addEventListener("click", () => {
    showAppScreen("settings");
  });
  mainMenuQuickStartButton?.addEventListener("click", startQuickStartJourney);
  mainMenuChooseButton?.addEventListener("click", () => {
    showAppScreen("choose-journey");
  });
  mainMenuFreePlayButton?.addEventListener("click", openFreePlay);
  mainMenuSettingsButton?.addEventListener("click", () => {
    showAppScreen("settings");
  });
  mainMenuLaunchButton?.addEventListener("click", () => {
    showAppScreen("launch", { pushHistory: false });
  });
}

function handleLaunchStart() {
  if (hasSeenOnboarding()) {
    showAppScreen("main-menu");
    return;
  }

  showAppScreen("onboarding");
}

function showAppScreen(screenId, options = {}) {
  const pushHistory = options.pushHistory !== false && currentAppScreen !== screenId;

  if (pushHistory) {
    appScreenHistory.push(currentAppScreen);
  }

  saveCurrentActivityProgress();
  hideStudyPracticeCompletionCard();
  activeStudyPracticeSession = null;
  isCurrentActivityProgressDisabled = false;
  currentAppScreen = screenId;
  closeInfoPopover();
  closeBrowseDrawer();
  cancelGrabbedAnswer();
  document.body.classList.toggle("launch-mode", screenId === "launch");
  document.body.classList.toggle("app-shell-mode", screenId !== "launch" && screenId !== "free-play");

  if (launchScreen) {
    launchScreen.hidden = screenId !== "launch";
  }

  if (appShellScreen) {
    appShellScreen.hidden = screenId === "launch" || screenId === "free-play";
  }

  updateResetControlVisibility();
  renderAppShellScreen(screenId);
}

function goBackAppScreen() {
  const previousScreen = appScreenHistory.pop() || "launch";
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
    appScreenHistory.push(currentAppScreen);
  }

  saveCurrentActivityProgress();
  hideStudyPracticeCompletionCard();
  activeStudyPracticeSession = null;
  isCurrentActivityProgressDisabled = false;
  currentAppScreen = "free-play";
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

function renderAppShellScreen(screenId) {
  const isMainMenu = screenId === "main-menu";
  const isChooseJourney = screenId === "choose-journey";
  const hasJourneyShellContent = isJourneyShellScreen(screenId);
  const content = getAppShellScreenContent(screenId);

  if (!content) {
    return;
  }

  if (appShellTitle) {
    appShellTitle.textContent = content.title;
  }

  if (appShellSubtitle) {
    appShellSubtitle.textContent = content.subtitle;
  }

  if (mainMenuActions) {
    if (isMainMenu && !mainMenuActions.isConnected && mainMenuActionsAnchor.parentNode) {
      mainMenuActionsAnchor.parentNode.insertBefore(mainMenuActions, mainMenuActionsAnchor.nextSibling);
    }

    mainMenuActions.querySelectorAll("button").forEach((button) => {
      button.disabled = !isMainMenu;
      button.tabIndex = isMainMenu ? 0 : -1;
    });

    mainMenuActions.hidden = !isMainMenu;
    mainMenuActions.style.display = isMainMenu ? "" : "none";
    mainMenuActions.setAttribute("aria-hidden", String(!isMainMenu));

    if (!isMainMenu && mainMenuActions.isConnected) {
      mainMenuActions.remove();
    }
  }

  renderQuickStartCard(isMainMenu);

  if (appShellPlaceholderCard) {
    appShellPlaceholderCard.hidden = isMainMenu || isChooseJourney || hasJourneyShellContent;
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
  const contentByScreen = {
    "main-menu": {
      title: "Main Menu",
      subtitle: "Choose how you want to explore today."
    },
    "choose-journey": {
      title: "Choose Journey",
      subtitle: "Pick a journey to study or play."
    },
    onboarding: {
      title: "Welcome to Atlas Quest",
      subtitle: "Learn geography by choosing a journey, placing labels on the map, and reviewing what you miss."
    },
    "journey-detail": {
      title: selectedJourneyTitle,
      subtitle: "Choose how you want to begin this journey."
    },
    study: {
      title: `Study: ${selectedJourneyTitle}`,
      subtitle: "Choose a section to explore calmly before playing."
    },
    "choose-difficulty": {
      title: "Choose Difficulty",
      subtitle: "Choose how much help you want during this journey."
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
      subtitle: "Adjust how Atlas Quest presents the map."
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
    "begin-journey-placeholder",
    "free-play-difficulty",
    "settings"
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

function getQuickStartTarget(progress = loadProgress()) {
  const activeJourney = journeyPresets.find((journey) => journey.id === progress.activeJourneyId);
  const activeDifficulty = normalizeJourneyDifficultyId(progress.activeDifficulty);

  if (activeJourney && isJourneyAvailable(activeJourney) && getValidJourneySteps(activeJourney).length > 0) {
    const activeStepIndex = getNextIncompleteJourneyStepIndex(activeJourney, activeDifficulty, progress);
    const validSteps = getValidJourneySteps(activeJourney);

    if (activeStepIndex >= 0) {
      return {
        isResume: true,
        journey: activeJourney,
        step: validSteps[activeStepIndex],
        stepIndex: activeStepIndex,
        difficultyId: activeDifficulty,
        preserveProgress: true
      };
    }
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

  if (!target) {
    quickStartKicker.textContent = "Start Learning";
    quickStartTitle.textContent = "Choose Journey";
    quickStartDetail.textContent = "Pick a journey to begin.";
    quickStartMeta.textContent = "Difficulty: Easy";
    quickStartAction.textContent = "Start";
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
  selectedJourneyId = journeyId;
  selectedJourneyPlayState = {
    journeyId,
    difficultyId: selectedJourneyPlayState.journeyId === journeyId
      ? selectedJourneyPlayState.difficultyId
      : "medium"
  };
  showAppScreen("journey-detail");
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
  showAppScreen("choose-journey");
}

function skipOnboarding() {
  markOnboardingSeen();
  showAppScreen("main-menu");
}

function startQuickStartJourney() {
  atlasProgress = loadProgress();
  const target = getQuickStartTarget(atlasProgress);

  if (!target) {
    showAppScreen("choose-journey");
    return;
  }

  selectedJourneyId = target.journey.id;
  selectedJourneyPlayState = {
    journeyId: target.journey.id,
    difficultyId: target.difficultyId
  };
  activeJourneySession = {
    journeyId: target.journey.id,
    currentStepIndex: target.stepIndex,
    difficulty: target.difficultyId,
    mode: "journey",
    incorrectPlacements: 0
  };
  atlasProgress = setActiveJourney(target.journey.id, target.stepIndex, target.difficultyId, atlasProgress);
  openJourneyStep(target.stepIndex, { preserveProgress: target.preserveProgress });
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
  openActivity(activityId, { hierarchyNodeId, difficultyId });
}

function getValidJourneySteps(journey) {
  return (journey?.steps || []).filter((step) => getActivityById(step.activityId));
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
  const journey = getSelectedJourney();
  const validSteps = getValidJourneySteps(journey);

  if (!journey || !isJourneyAvailable(journey) || validSteps.length === 0) {
    showAppScreen("begin-journey-placeholder");
    return;
  }

  activeJourneySession = {
    journeyId: journey.id,
    currentStepIndex: 0,
    difficulty: getSelectedJourneyDifficultyId(),
    mode: "journey",
    incorrectPlacements: 0
  };
  atlasProgress = setActiveJourney(journey.id, 0, activeJourneySession.difficulty, atlasProgress);
  openJourneyStep(0);
}

function openJourneyStep(stepIndex, options = {}) {
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
  atlasProgress = setActiveJourney(activeJourneySession.journeyId, stepIndex, stepDifficulty, atlasProgress);
  if (!options.preserveProgress) {
    setActivityProgress(step.activityId, [], stepDifficulty);
    setActivityCompletedState(step.activityId, false);
  }
  openActivity(step.activityId, {
    appScreen: "journey-gameplay",
    difficultyId: stepDifficulty,
    forceGameplayVisible: true,
    presentationSettings: getJourneyActivityPresentationSettings(step)
  });
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

function startStudyPreviewActivity(journeyId, stepId) {
  const { journey, step, activity } = getStudyStepContext(journeyId, stepId);

  if (!journey || !step || !activity) {
    showStudyStepNotReady();
    return;
  }

  selectedJourneyId = journey.id;
  openStudyExploreActivity(journey, step, activity);
}

function startStudyPracticeActivity(journeyId, stepId) {
  const { journey, step, activity } = getStudyStepContext(journeyId, stepId);

  if (!journey || !step || !activity) {
    showStudyStepNotReady();
    return;
  }

  selectedJourneyId = journey.id;
  activeJourneySession = null;
  activeStudyPracticeSession = {
    journeyId: journey.id,
    stepId: step.id,
    activityId: activity.id
  };

  openActivity(activity.id, {
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

function openStudyExploreActivity(journey, step, activity, options = {}) {
  saveCurrentActivityProgress();
  cancelGrabbedAnswer();
  clearJourneyAutoAdvanceTimer();
  activeStudySession = {
    journeyId: journey.id,
    stepId: step.id,
    activityId: activity.id,
    revealedTargetIds: options.revealAll ? activity.targets.map((target) => target.id) : [],
    retryReturnState: options.retryReturnState || null
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
  runner.setCompletedTargets(activeStudySession.revealedTargetIds);
  setHeaderTitle(`Study: ${step.title}`, { shortTitle: step.title });
  instruction.textContent = "Tap a target or name to show it. Tap it again to hide it.";
  studyCard.hidden = false;
  studyCard.querySelector("strong").textContent = step.title;
  studyCard.querySelector("span").textContent = "Study Mode";
  runner.enterStudyView();
  renderStudyExplorePanel();
  updateTopBarNavigation();
}

function revealStudyTarget(targetId) {
  if (currentAppScreen !== "study-explore" || !activeStudySession || !session.getFeature(targetId)) {
    return;
  }

  if (activeStudySession.revealedTargetIds.includes(targetId)) {
    activeStudySession.revealedTargetIds = activeStudySession.revealedTargetIds.filter((id) => id !== targetId);
  } else {
    activeStudySession.revealedTargetIds.push(targetId);
  }

  runner.setCompletedTargets(activeStudySession.revealedTargetIds);
  renderStudyExplorePanel();
}

function launchPracticeForStudySet() {
  if (!activeStudySession || activeStudySession.retryReturnState) {
    return;
  }

  const { journeyId, stepId } = activeStudySession;
  document.body.classList.remove("study-explore-mode");
  activeStudySession = null;
  runner.setStudyPreviewMode(false);
  startStudyPracticeActivity(journeyId, stepId);
}

function exitStudyExplore() {
  const retryReturnState = activeStudySession?.retryReturnState || null;
  activeStudySession = null;
  document.body.classList.remove("study-explore-mode");
  runner.setStudyPreviewMode(false);
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

  const controls = document.createElement("div");
  controls.className = "study-explore-controls";
  const controlDefinitions = activeStudySession?.retryReturnState
    ? [["Exit Study", exitStudyExplore]]
    : [
      ["Practice This Set", launchPracticeForStudySet],
      ["Exit Study", exitStudyExplore]
    ];

  controlDefinitions.forEach(([label, handler]) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = label;
    button.addEventListener("click", handler);
    controls.appendChild(button);
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

    const speaker = window.GeographyChipSpeech?.createChipSpeakerControl(target.name);
    if (speaker) {
      item.appendChild(speaker);
    }

    list.appendChild(item);
  });

  answerBank.append(controls, list);
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
      ...getRequiredTargetLayerOverrides(activity, requestedSettings)
    };
  }

  return {
    ...mapLayerSettings,
    ...getRequiredTargetLayerOverrides(activity, mapLayerSettings)
  };
}

function getRequiredTargetLayerOverrides(activity, settings = mapLayerSettings) {
  const overrides = {};

  if (isPointOnlyActivity(activity)) {
    overrides.showCities = true;
    overrides.showCapitals = true;
  }

  return overrides;
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
    ids: ["world-foundations", "united-states", "north-america", "europe"]
  },
  {
    title: "World",
    ids: ["world-foundations"]
  },
  {
    title: "Americas",
    ids: ["the-americas", "north-america", "united-states", "the-caribbean", "south-america", "brazil"]
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

function createJourneyPresetCard(journey) {
  const isAvailable = isJourneyAvailable(journey);
  const status = getEffectiveJourneyStatus(journey);
  const card = document.createElement("article");
  card.className = `journey-preset-card${isAvailable ? "" : ` journey-preset-card-${status}`}`;
  card.dataset.journeyId = journey.id;

  const header = document.createElement("div");
  header.className = "journey-preset-card-header";

  const heading = document.createElement("h3");
  heading.textContent = journey.title;

  const statusBadge = document.createElement("span");
  statusBadge.className = `journey-status journey-status-${status}`;
  statusBadge.textContent = getJourneyStatusLabel(journey);

  header.append(heading, statusBadge);

  const description = document.createElement("p");
  description.textContent = journey.description;

  const meta = document.createElement("p");
  meta.className = "journey-preset-meta";
  const progressText = isAvailable ? formatJourneyProgressText(journey) : "";
  const statusText = status === "locked" ? journey.lockedMessage : "";
  meta.textContent = statusText || (progressText
    ? `${formatJourneyStepCount(getValidJourneySteps(journey).length)} | ${progressText}`
    : formatJourneyStepCount(getValidJourneySteps(journey).length));

  const actions = document.createElement("div");
  actions.className = "journey-card-actions";

  const selectButton = document.createElement("button");
  selectButton.type = "button";
  selectButton.textContent = isAvailable ? "Select Journey" : "View Details";
  selectButton.addEventListener("click", () => {
    selectJourney(journey.id);
  });

  actions.append(selectButton);

  card.append(header, description, meta, actions);
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

  if (screenId === "onboarding") {
    renderOnboardingScreen();
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

  const intro = document.createElement("p");
  intro.className = "onboarding-copy";
  intro.textContent = "Learn geography by choosing a journey, placing labels on the map, and reviewing what you miss.";

  const cards = document.createElement("div");
  cards.className = "onboarding-card-grid";

  [
    ["Choose a Journey", "Follow a guided path through the world."],
    ["Tap a Label, Tap the Map", "Pick a label below, then tap where it belongs."],
    ["Study First Anytime", "Preview a set before you practice."]
  ].forEach(([titleText, copyText]) => {
    const card = document.createElement("article");
    card.className = "onboarding-card";

    const heading = document.createElement("h3");
    heading.textContent = titleText;

    const copy = document.createElement("p");
    copy.textContent = copyText;

    card.append(heading, copy);
    cards.appendChild(card);
  });

  const actions = document.createElement("div");
  actions.className = "onboarding-actions";

  const startButton = document.createElement("button");
  startButton.type = "button";
  startButton.className = "onboarding-primary-button";
  startButton.textContent = "Start World Foundations";
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
  panel.append(intro, cards, actions);
  journeyShellContent.appendChild(panel);
}

function renderJourneyDetail(journey) {
  const isAvailable = isJourneyAvailable(journey);
  const status = getEffectiveJourneyStatus(journey);
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
    actions.append(
      createJourneyPathCard({
        title: "Play Journey",
        description: "Complete the journey in order.",
        buttonLabel: "Play",
        variant: "play",
        onClick: () => showAppScreen("choose-difficulty")
      }),
      createJourneyPathCard({
        title: "Study",
        description: "Practice freely before playing the journey.",
        buttonLabel: "Open Study",
        variant: "study",
        onClick: () => showAppScreen("study"),
        infoText: "Preview or practice without changing journey progress."
      })
    );
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

  journeyShellContent.append(actions, summary);

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
  backButton.addEventListener("click", () => showAppScreen("choose-journey"));

  if (isAvailable) {
    secondaryActions.appendChild(restartButton);
  }

  secondaryActions.appendChild(backButton);
  journeyShellContent.appendChild(secondaryActions);
}

function createJourneyPathCard({ title, description, buttonLabel, variant, onClick, disabled = false, infoText = "" }) {
  const card = document.createElement("article");
  card.className = `journey-path-card journey-path-card-${variant}`;

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

  infoPopover.hidden = true;
  infoPopover.textContent = "";
  infoPopover.style.left = "";
  infoPopover.style.top = "";
  delete infoPopover.dataset.activeInfo;
}

function handleDocumentInfoClick(event) {
  const infoButton = event.target.closest?.(".info-button");

  if (infoButton) {
    event.preventDefault();
    event.stopPropagation();

    if (!infoPopover?.hidden && infoPopover?.dataset.activeInfo === infoButton.getAttribute("aria-label")) {
      closeInfoPopover();
      return;
    }

    showInfoPopover(infoButton);
    return;
  }

  if (infoPopover && !infoPopover.hidden && !event.target.closest?.(".info-popover")) {
    closeInfoPopover();
  }
}

function renderStudySelectionScreen(journey) {
  const panel = document.createElement("section");
  panel.className = "journey-mode-panel study-selection-panel";

  const message = document.createElement("p");
  message.className = "journey-mode-message";
  message.textContent = "Choose a section to study before playing the journey.";

  const stepList = document.createElement("div");
  stepList.className = "study-step-list";

  const validSteps = getValidJourneySteps(journey);
  validSteps.forEach((step, index) => {
    const activity = getActivityById(step.activityId);
    const card = document.createElement("article");
    card.className = "study-step-card";

    const titleNode = document.createElement("strong");
    titleNode.textContent = step.title;

    const meta = document.createElement("span");
    const targetCount = activity?.targets?.length || 0;
    meta.textContent = `Section ${index + 1} | ${targetCount} target${targetCount === 1 ? "" : "s"}`;

    const actions = document.createElement("div");
    actions.className = "study-step-actions";

    const previewButton = document.createElement("button");
    previewButton.type = "button";
    previewButton.textContent = "Study";
    previewButton.disabled = !activity;
    previewButton.addEventListener("click", () => {
      startStudyPreviewActivity(journey.id, step.id);
    });

    actions.append(previewButton);
    card.append(titleNode, meta, actions);
    stepList.appendChild(card);
  });

  const backButton = document.createElement("button");
  backButton.type = "button";
  backButton.className = "journey-begin-button";
  backButton.textContent = "Back to Journey";
  backButton.addEventListener("click", () => showAppScreen("journey-detail"));

  panel.append(message, stepList, backButton);
  journeyShellContent.appendChild(panel);
}

function renderJourneyDifficultyScreen(journey) {
  const panel = document.createElement("section");
  panel.className = "journey-difficulty-panel";

  const journeyName = document.createElement("h2");
  journeyName.textContent = journey.title;

  const headingRow = document.createElement("div");
  headingRow.className = "journey-section-heading-row";
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

  const beginButton = document.createElement("button");
  beginButton.type = "button";
  beginButton.className = "journey-begin-button";
  beginButton.textContent = "Begin Journey";
  beginButton.addEventListener("click", startSelectedJourney);

  panel.append(headingRow, message, context, options, beginButton);
  journeyShellContent.appendChild(panel);
}

function renderFreePlayDifficultyScreen() {
  const activity = getActivityById(pendingFreePlayActivityId);
  const panel = document.createElement("section");
  panel.className = "journey-difficulty-panel";

  const activityName = document.createElement("h2");
  activityName.textContent = activity?.title || "Free Play Activity";

  const headingRow = document.createElement("div");
  headingRow.className = "journey-section-heading-row";
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
  panel.className = "settings-panel";

  const heading = document.createElement("h2");
  heading.textContent = "Settings";

  const description = document.createElement("p");
  description.className = "settings-panel-copy";
  description.textContent = "Choose map detail and save study-target preferences. Required activity targets stay available during gameplay.";

  panel.append(heading, description);

  const mapLayersSection = createSettingsMenuSection("Map Layers", "Control which supported map details are shown. Presets also update saved study-target preferences.", true, "settings-menu-section", "map-layers");
  mapLayersSection.content.append(renderStudyPresetControl(), renderMapLayerSettings());

  const studyTargetsSection = createSettingsMenuSection("Study Targets", "Saved preferences for planning study sets. Gameplay filtering is not fully wired yet.", false, "settings-menu-section", "study-targets");
  studyTargetsSection.content.appendChild(renderStudyTargetHierarchy());

  const resetSection = createSettingsMenuSection("Reset / Defaults", "Restore the default map layer and study-target preferences.", false, "settings-menu-section", "reset-defaults");
  resetSection.content.appendChild(renderSettingsDefaultsControl());

  panel.append(mapLayersSection.details, studyTargetsSection.details, resetSection.details);

  journeyShellContent.appendChild(panel);
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
  if (!state || currentAppScreen !== "settings") {
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
  renderJourneyShellContent("settings");
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
  copy.textContent = "This resets map layers and saved study-target preferences to the default Atlas Quest settings.";

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
    .filter((activity) => activity.id.startsWith("us-states-capitals-"))
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
    .filter((activity) => activity.id.startsWith("us-states-capitals-"))
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
    .filter((activity) => activity.category === "Cities" && !activity.id.startsWith("us-states-capitals-"))
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
  targets
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
    if (currentAppScreen === "free-play") {
      showFreePlayDifficultyScreen(node.activityId);
      return;
    }

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
    const chip = document.createElement("button");
    chip.className = "label-chip";
    chip.type = "button";
    chip.dataset.id = feature.id;
    chip.setAttribute("aria-label", feature.name);
    chip.appendChild(createChipLabelText(feature.name));
    const speaker = window.GeographyChipSpeech?.createChipSpeakerControl(feature.name);
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

function openActivity(activityId, options = {}) {
  saveCurrentActivityProgress();
  cancelGrabbedAnswer();
  closeBrowseDrawer();
  clearJourneyAutoAdvanceTimer();
  hideStudyPracticeCompletionCard();
  resetActivityAttemptState();
  activeStudySession = null;
  runner?.setStudyPreviewMode(false);
  document.body.classList.remove("study-explore-mode");
  const baseActivity = getActivityById(activityId);
  currentPresentationSettings = getEffectivePresentationSettings(baseActivity, options);
  isCurrentActivityProgressDisabled = options.disableActivityProgress === true;
  session.setStudyMode(currentPresentationSettings.reviewMode);
  const shouldRevealGameplay = options.forceGameplayVisible || currentAppScreen !== "launch";
  if (shouldRevealGameplay) {
    currentAppScreen = options.appScreen || "free-play";
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
}

function getPresentedActivity(activity, presentationSettings = {}) {
  if (!activity || shouldShowPointMarkers(activity, currentAppScreen, presentationSettings)) {
    return activity;
  }

  const shapeTargets = activity.targets.filter((target) => target.kind !== "point");
  if (shapeTargets.length === 0) {
    return activity;
  }

  return {
    ...activity,
    targetNoun: activity.targetNoun?.replace(/\s+or\s+capital/i, "") || activity.targetNoun,
    targets: shapeTargets,
    answerBankItems: shapeTargets.map((target) => ({
      id: target.id,
      name: target.name
    }))
  };
}

function selectActivity(activityId, options = {}) {
  if (options.requireDifficulty) {
    showFreePlayDifficultyScreen(activityId);
    return;
  }

  openActivity(activityId, options);
}

function enterStudy() {
  document.body.classList.remove("browse-mode");
  document.body.classList.remove("overview-mode");
  document.body.classList.add("study-mode");
  const node = getHierarchyNode(activeHierarchyNodeId);
  const activityTitle = node?.activityLabel || session.currentActivity.title;
  setHeaderTitle(
    node ? getHierarchyBreadcrumb(node.id, { activityLabel: activityTitle }) : session.currentActivity.title,
    { shortTitle: activityTitle }
  );
  updateStudyInstruction();
  updateStudyCardDetails();
  updateProgress();
  updateDifficultyControls();
  studyCard.hidden = false;
  runner.enterStudyView();
  renderActivityNavControls(session.currentActivity.id);
  updateTopBarNavigation();
  updateResetControlVisibility();
}

function updateStudyInstruction() {
  if (!isStudyModeActive()) {
    return;
  }

  const node = getHierarchyNode(activeHierarchyNodeId);
  instruction.textContent = node?.id === "world"
    ? "Place a label, or click a continent with no label selected to explore."
    : `Select a ${session.currentActivity.targetNoun} label, then click its target on the map.`;
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
  if (isActivityInputLocked()) {
    return;
  }

  if (currentAppScreen === "study-explore") {
    const resolvedStudyTargetIds = targetIds && !Array.isArray(targetIds) && typeof targetIds.x === "number"
      ? runner.getTargetIdsAtMapPoint(targetIds)
      : targetIds;
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
    ensureActivityNavControls();
    showFeedback(`Correct: ${result.feature.name}`, true);
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

  showFeedback("Not quite — try again.");
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
    showFeedback("Not quite — try this one again.");
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

  openStudyExploreActivity(journey, step, activity, {
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
    openActivity(retryState.activityId, {
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
    openActivity(retryState.activityId, {
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
  openActivity(retryState.activityId, {
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

  answerBank.querySelectorAll(".label-chip[data-id]").forEach((chip) => {
    const id = chip.dataset.id;
    const isSelected = session.selectedId === id;
    const isCompleted = session.isCompleted(id);

    chip.classList.toggle("selected", isSelected);
    chip.classList.toggle("used", isCompleted);
    chip.disabled = isInputLocked || isCompleted;
    chip.setAttribute("aria-pressed", String(isSelected));
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
    return;
  }

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
      targetSettings: normalizeStudyTargetSettings(studyTargetSettings)
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
  if (currentAppScreen === "settings") {
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
  startStudyPracticeActivity(sessionToRepeat.journeyId, sessionToRepeat.stepId);
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
  openJourneyStep(nextStepIndex);
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

  syncAnswerBank();
}

function showJourneyStepNotReady() {
  activeJourneySession = null;
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
    openJourneyStep(0);
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
  showAppScreen(selectedJourneyId ? "journey-detail" : "main-menu");
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

  openActivity(activitySequence[currentIndex - 1].id);
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

  if (backButton) {
    backButton.hidden = isHome && !["free-play", "journey-gameplay", "study-explore", "study-practice"].includes(currentAppScreen);
  }

  if (homeButton) {
    homeButton.disabled = false;
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
