// Display/input context only. Distractors are not learning targets or evidence concepts.
// Selection: 2020 Census incorporated-place population, excluding the capital;
// Hawaii uses CDPs. See docs/us-capital-location-city-choices.md for derivation.

function deepFreeze(value) {
  if (value && typeof value === "object") {
    Object.values(value).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}

export const US_CAPITAL_LOCATION_CITY_CHOICES = deepFreeze([
  {
    stateId: "alabama",
    stateName: "Alabama",
    stateCode: "AL",
    capitalId: "montgomery",
    capitalActivityIds: ["capital-montgomery", "montgomery-al"],
    capital: {"id": "capital-montgomery", "name": "Montgomery", "lon": -86.3005639, "lat": 32.3777298},
    distractors: [
      {"name": "Huntsville", "lon": -86.5325989, "lat": 34.7822752, "population2020": 215006, "censusGeoid": "0137000", "censusName": "Huntsville city"},
      {"name": "Birmingham", "lon": -86.7970356, "lat": 33.5271744, "population2020": 200733, "censusGeoid": "0107000", "censusName": "Birmingham city"},
    ],
  },
  {
    stateId: "alaska",
    stateName: "Alaska",
    stateCode: "AK",
    capitalId: "juneau",
    capitalActivityIds: ["capital-juneau", "juneau-ak"],
    capital: {"id": "capital-juneau", "name": "Juneau", "lon": -134.4104388, "lat": 58.3020694},
    distractors: [
      {"name": "Anchorage", "lon": -149.2843294, "lat": 61.1742503, "population2020": 291247, "censusGeoid": "0203000", "censusName": "Anchorage municipality"},
      {"name": "Fairbanks", "lon": -147.6517447, "lat": 64.8365307, "population2020": 32515, "censusGeoid": "0224230", "censusName": "Fairbanks city"},
    ],
  },
  {
    stateId: "arizona",
    stateName: "Arizona",
    stateCode: "AZ",
    capitalId: "phoenix",
    capitalActivityIds: ["capital-phoenix", "phoenix-az"],
    capital: {"id": "capital-phoenix", "name": "Phoenix", "lon": -112.097065, "lat": 33.4482497},
    distractors: [
      {"name": "Tucson", "lon": -110.8707734, "lat": 32.1530357, "population2020": 542629, "censusGeoid": "0477000", "censusName": "Tucson city"},
      {"name": "Mesa", "lon": -111.7164869, "lat": 33.4006255, "population2020": 504258, "censusGeoid": "0446000", "censusName": "Mesa city"},
    ],
  },
  {
    stateId: "arkansas",
    stateName: "Arkansas",
    stateCode: "AR",
    capitalId: "little-rock",
    capitalActivityIds: ["capital-little-rock", "little-rock-ar"],
    capital: {"id": "capital-little-rock", "name": "Little Rock", "lon": -92.2892284, "lat": 34.746745},
    distractors: [
      {"name": "Fayetteville", "lon": -94.1665644, "lat": 36.0714549, "population2020": 93949, "censusGeoid": "0523290", "censusName": "Fayetteville city"},
      {"name": "Fort Smith", "lon": -94.370883, "lat": 35.3492757, "population2020": 89142, "censusGeoid": "0524550", "censusName": "Fort Smith city"},
    ],
  },
  {
    stateId: "california",
    stateName: "California",
    stateCode: "CA",
    capitalId: "sacramento",
    capitalActivityIds: ["capital-sacramento", "sacramento-ca"],
    capital: {"id": "capital-sacramento", "name": "Sacramento", "lon": -121.4935591, "lat": 38.5765854},
    distractors: [
      {"name": "Los Angeles", "lon": -118.4108248, "lat": 34.0193936, "population2020": 3898747, "censusGeoid": "0644000", "censusName": "Los Angeles city"},
      {"name": "San Diego", "lon": -117.1355615, "lat": 32.814977, "population2020": 1386932, "censusGeoid": "0666000", "censusName": "San Diego city"},
    ],
  },
  {
    stateId: "colorado",
    stateName: "Colorado",
    stateCode: "CO",
    capitalId: "denver",
    capitalActivityIds: ["capital-denver", "denver-co"],
    capital: {"id": "capital-denver", "name": "Denver", "lon": -104.9849779, "lat": 39.7392198},
    distractors: [
      {"name": "Colorado Springs", "lon": -104.760749, "lat": 38.8672553, "population2020": 478961, "censusGeoid": "0816000", "censusName": "Colorado Springs city"},
      {"name": "Aurora", "lon": -104.6894, "lat": 39.6882958, "population2020": 386261, "censusGeoid": "0804000", "censusName": "Aurora city"},
    ],
  },
  {
    stateId: "connecticut",
    stateName: "Connecticut",
    stateCode: "CT",
    capitalId: "hartford",
    capitalActivityIds: ["capital-hartford", "hartford-ct"],
    capital: {"id": "capital-hartford", "name": "Hartford", "lon": -72.6823164, "lat": 41.7642752},
    distractors: [
      {"name": "Bridgeport", "lon": -73.1957567, "lat": 41.1873933, "population2020": 148654, "censusGeoid": "0908000", "censusName": "Bridgeport city"},
      {"name": "Stamford", "lon": -73.5460803, "lat": 41.0796114, "population2020": 135470, "censusGeoid": "0973000", "censusName": "Stamford city"},
    ],
  },
  {
    stateId: "delaware",
    stateName: "Delaware",
    stateCode: "DE",
    capitalId: "dover",
    capitalActivityIds: ["capital-dover", "dover-de"],
    capital: {"id": "capital-dover", "name": "Dover", "lon": -75.5195811, "lat": 39.1572815},
    distractors: [
      {"name": "Wilmington", "lon": -75.5321041, "lat": 39.7356508, "population2020": 70898, "censusGeoid": "1077580", "censusName": "Wilmington city"},
      {"name": "Newark", "lon": -75.7575143, "lat": 39.6775372, "population2020": 30601, "censusGeoid": "1050670", "censusName": "Newark city"},
    ],
  },
  {
    stateId: "florida",
    stateName: "Florida",
    stateCode: "FL",
    capitalId: "tallahassee",
    capitalActivityIds: ["capital-tallahassee", "tallahassee-fl"],
    capital: {"id": "capital-tallahassee", "name": "Tallahassee", "lon": -84.2821265, "lat": 30.4381047},
    distractors: [
      {"name": "Jacksonville", "lon": -81.6616028, "lat": 30.3368643, "population2020": 949611, "censusGeoid": "1235000", "censusName": "Jacksonville city"},
      {"name": "Miami", "lon": -80.2086152, "lat": 25.775163, "population2020": 442241, "censusGeoid": "1245000", "censusName": "Miami city"},
    ],
  },
  {
    stateId: "georgia",
    stateName: "Georgia",
    stateCode: "GA",
    capitalId: "atlanta",
    capitalActivityIds: ["capital-atlanta", "atlanta-ga"],
    capital: {"id": "capital-atlanta", "name": "Atlanta", "lon": -84.3879614, "lat": 33.7490287},
    distractors: [
      {"name": "Columbus", "lon": -84.8749462, "lat": 32.5101909, "population2020": 206922, "censusGeoid": "1319000", "censusName": "Columbus city"},
      {"name": "Augusta", "lon": -82.0734218, "lat": 33.3655309, "population2020": 202081, "censusGeoid": "1304204", "censusName": "Augusta-Richmond County consolidated government (balance)"},
    ],
  },
  {
    stateId: "hawaii",
    stateName: "Hawaii",
    stateCode: "HI",
    capitalId: "honolulu",
    capitalActivityIds: ["capital-honolulu", "honolulu-hi"],
    capital: {"id": "capital-honolulu", "name": "Honolulu", "lon": -157.8573111, "lat": 21.3073439},
    distractors: [
      {"name": "East Honolulu", "lon": -157.7179003, "lat": 21.2884461, "population2020": 50922, "censusGeoid": "1506290", "censusName": "East Honolulu CDP"},
      {"name": "Pearl City", "lon": -157.9569068, "lat": 21.4026091, "population2020": 45295, "censusGeoid": "1562600", "censusName": "Pearl City CDP"},
    ],
  },
  {
    stateId: "idaho",
    stateName: "Idaho",
    stateCode: "ID",
    capitalId: "boise",
    capitalActivityIds: ["capital-boise", "boise-id"],
    capital: {"id": "capital-boise", "name": "Boise", "lon": -116.1998483, "lat": 43.6177948},
    distractors: [
      {"name": "Meridian", "lon": -116.3977634, "lat": 43.6114933, "population2020": 117635, "censusGeoid": "1652120", "censusName": "Meridian city"},
      {"name": "Nampa", "lon": -116.5639713, "lat": 43.5843206, "population2020": 100200, "censusGeoid": "1656260", "censusName": "Nampa city"},
    ],
  },
  {
    stateId: "illinois",
    stateName: "Illinois",
    stateCode: "IL",
    capitalId: "springfield",
    capitalActivityIds: ["capital-springfield", "springfield-il"],
    capital: {"id": "capital-springfield", "name": "Springfield", "lon": -89.6547203, "lat": 39.7983912},
    distractors: [
      {"name": "Chicago", "lon": -87.6849386, "lat": 41.8370453, "population2020": 2746388, "censusGeoid": "1714000", "censusName": "Chicago city"},
      {"name": "Aurora", "lon": -88.290099, "lat": 41.763455, "population2020": 180542, "censusGeoid": "1703012", "censusName": "Aurora city"},
    ],
  },
  {
    stateId: "indiana",
    stateName: "Indiana",
    stateCode: "IN",
    capitalId: "indianapolis",
    capitalActivityIds: ["capital-indianapolis", "indianapolis-in"],
    capital: {"id": "capital-indianapolis", "name": "Indianapolis", "lon": -86.1627697, "lat": 39.7683841},
    distractors: [
      {"name": "Fort Wayne", "lon": -85.1438998, "lat": 41.0891325, "population2020": 263886, "censusGeoid": "1825000", "censusName": "Fort Wayne city"},
      {"name": "Evansville", "lon": -87.5347053, "lat": 37.9877366, "population2020": 117298, "censusGeoid": "1822000", "censusName": "Evansville city"},
    ],
  },
  {
    stateId: "iowa",
    stateName: "Iowa",
    stateCode: "IA",
    capitalId: "des-moines",
    capitalActivityIds: ["capital-des-moines", "des-moines-ia"],
    capital: {"id": "capital-des-moines", "name": "Des Moines", "lon": -93.6038358, "lat": 41.5911079},
    distractors: [
      {"name": "Cedar Rapids", "lon": -91.6779406, "lat": 41.9660846, "population2020": 137710, "censusGeoid": "1912000", "censusName": "Cedar Rapids city"},
      {"name": "Davenport", "lon": -90.6039479, "lat": 41.5568204, "population2020": 101724, "censusGeoid": "1919000", "censusName": "Davenport city"},
    ],
  },
  {
    stateId: "kansas",
    stateName: "Kansas",
    stateCode: "KS",
    capitalId: "topeka",
    capitalActivityIds: ["capital-topeka", "topeka-ks"],
    capital: {"id": "capital-topeka", "name": "Topeka", "lon": -95.6780057, "lat": 39.0482389},
    distractors: [
      {"name": "Wichita", "lon": -97.3458362, "lat": 37.6906377, "population2020": 397532, "censusGeoid": "2079000", "censusName": "Wichita city"},
      {"name": "Overland Park", "lon": -94.6905839, "lat": 38.8890422, "population2020": 197238, "censusGeoid": "2053775", "censusName": "Overland Park city"},
    ],
  },
  {
    stateId: "kentucky",
    stateName: "Kentucky",
    stateCode: "KY",
    capitalId: "frankfort",
    capitalActivityIds: ["capital-frankfort", "frankfort-ky"],
    capital: {"id": "capital-frankfort", "name": "Frankfort", "lon": -84.8753598, "lat": 38.1866989},
    distractors: [
      {"name": "Louisville", "lon": -85.6473774, "lat": 38.1653759, "population2020": 386884, "censusGeoid": "2148006", "censusName": "Louisville/Jefferson County metro government (balance)"},
      {"name": "Lexington", "lon": -84.4582721, "lat": 38.0406777, "population2020": 322570, "censusGeoid": "2146027", "censusName": "Lexington-Fayette urban county"},
    ],
  },
  {
    stateId: "louisiana",
    stateName: "Louisiana",
    stateCode: "LA",
    capitalId: "baton-rouge",
    capitalActivityIds: ["capital-baton-rouge", "baton-rouge-la"],
    capital: {"id": "capital-baton-rouge", "name": "Baton Rouge", "lon": -91.1873935, "lat": 30.457024},
    distractors: [
      {"name": "New Orleans", "lon": -89.9345018, "lat": 30.0534195, "population2020": 383997, "censusGeoid": "2255000", "censusName": "New Orleans city"},
      {"name": "Shreveport", "lon": -93.792193, "lat": 32.466879, "population2020": 187593, "censusGeoid": "2270000", "censusName": "Shreveport city"},
    ],
  },
  {
    stateId: "maine",
    stateName: "Maine",
    stateCode: "ME",
    capitalId: "augusta",
    capitalActivityIds: ["capital-augusta", "augusta-me"],
    capital: {"id": "capital-augusta", "name": "Augusta", "lon": -69.7816228, "lat": 44.307213},
    distractors: [
      {"name": "Portland", "lon": -70.1853051, "lat": 43.6331574, "population2020": 68408, "censusGeoid": "2360545", "censusName": "Portland city"},
      {"name": "Lewiston", "lon": -70.172095, "lat": 44.0895127, "population2020": 37121, "censusGeoid": "2338740", "censusName": "Lewiston city"},
    ],
  },
  {
    stateId: "maryland",
    stateName: "Maryland",
    stateCode: "MD",
    capitalId: "annapolis",
    capitalActivityIds: ["capital-annapolis", "annapolis-md"],
    capital: {"id": "capital-annapolis", "name": "Annapolis", "lon": -76.491037, "lat": 38.9788927},
    distractors: [
      {"name": "Baltimore", "lon": -76.6104761, "lat": 39.3000324, "population2020": 585708, "censusGeoid": "2404000", "censusName": "Baltimore city"},
      {"name": "Frederick", "lon": -77.4145385, "lat": 39.4340892, "population2020": 78171, "censusGeoid": "2430325", "censusName": "Frederick city"},
    ],
  },
  {
    stateId: "massachusetts",
    stateName: "Massachusetts",
    stateCode: "MA",
    capitalId: "boston",
    capitalActivityIds: ["capital-boston", "boston-ma"],
    capital: {"id": "capital-boston", "name": "Boston", "lon": -71.0640129, "lat": 42.3587532},
    distractors: [
      {"name": "Worcester", "lon": -71.8077831, "lat": 42.2694781, "population2020": 206518, "censusGeoid": "2582000", "censusName": "Worcester city"},
      {"name": "Springfield", "lon": -72.5399783, "lat": 42.115454, "population2020": 155929, "censusGeoid": "2567000", "censusName": "Springfield city"},
    ],
  },
  {
    stateId: "michigan",
    stateName: "Michigan",
    stateCode: "MI",
    capitalId: "lansing",
    capitalActivityIds: ["capital-lansing", "lansing-mi"],
    capital: {"id": "capital-lansing", "name": "Lansing", "lon": -84.5555605, "lat": 42.7336193},
    distractors: [
      {"name": "Detroit", "lon": -83.1022365, "lat": 42.3830375, "population2020": 639111, "censusGeoid": "2622000", "censusName": "Detroit city"},
      {"name": "Grand Rapids", "lon": -85.6555701, "lat": 42.961156, "population2020": 198917, "censusGeoid": "2634000", "censusName": "Grand Rapids city"},
    ],
  },
  {
    stateId: "minnesota",
    stateName: "Minnesota",
    stateCode: "MN",
    capitalId: "saint-paul",
    capitalActivityIds: ["capital-saint-paul", "st-paul-mn"],
    capital: {"id": "capital-saint-paul", "name": "Saint Paul", "lon": -93.1021034, "lat": 44.9551063},
    distractors: [
      {"name": "Minneapolis", "lon": -93.2683198, "lat": 44.9633242, "population2020": 429954, "censusGeoid": "2743000", "censusName": "Minneapolis city"},
      {"name": "Rochester", "lon": -92.4772105, "lat": 44.0154424, "population2020": 121395, "censusGeoid": "2754880", "censusName": "Rochester city"},
    ],
  },
  {
    stateId: "mississippi",
    stateName: "Mississippi",
    stateCode: "MS",
    capitalId: "jackson",
    capitalActivityIds: ["capital-jackson", "jackson-ms"],
    capital: {"id": "capital-jackson", "name": "Jackson", "lon": -90.1820382, "lat": 32.303763},
    distractors: [
      {"name": "Gulfport", "lon": -89.069022, "lat": 30.4194872, "population2020": 72926, "censusGeoid": "2829700", "censusName": "Gulfport city"},
      {"name": "Southaven", "lon": -89.9776689, "lat": 34.9510049, "population2020": 54648, "censusGeoid": "2869280", "censusName": "Southaven city"},
    ],
  },
  {
    stateId: "missouri",
    stateName: "Missouri",
    stateCode: "MO",
    capitalId: "jefferson-city",
    capitalActivityIds: ["capital-jefferson-city", "jefferson-city-mo"],
    capital: {"id": "capital-jefferson-city", "name": "Jefferson City", "lon": -92.1728432, "lat": 38.5791852},
    distractors: [
      {"name": "Kansas City", "lon": -94.5551167, "lat": 39.1223613, "population2020": 508090, "censusGeoid": "2938000", "censusName": "Kansas City city"},
      {"name": "St. Louis", "lon": -90.2445816, "lat": 38.6356988, "population2020": 301578, "censusGeoid": "2965000", "censusName": "St. Louis city"},
    ],
  },
  {
    stateId: "montana",
    stateName: "Montana",
    stateCode: "MT",
    capitalId: "helena",
    capitalActivityIds: ["capital-helena", "helena-mt"],
    capital: {"id": "capital-helena", "name": "Helena", "lon": -112.0183427, "lat": 46.5857742},
    distractors: [
      {"name": "Billings", "lon": -108.55248, "lat": 45.7895258, "population2020": 117116, "censusGeoid": "3006550", "censusName": "Billings city"},
      {"name": "Missoula", "lon": -114.0261362, "lat": 46.8743587, "population2020": 73489, "censusGeoid": "3050200", "censusName": "Missoula city"},
    ],
  },
  {
    stateId: "nebraska",
    stateName: "Nebraska",
    stateCode: "NE",
    capitalId: "lincoln",
    capitalActivityIds: ["capital-lincoln", "lincoln-ne"],
    capital: {"id": "capital-lincoln", "name": "Lincoln", "lon": -96.6997467, "lat": 40.8080641},
    distractors: [
      {"name": "Omaha", "lon": -96.0534745, "lat": 41.2627048, "population2020": 486051, "censusGeoid": "3137000", "censusName": "Omaha city"},
      {"name": "Bellevue", "lon": -95.9425798, "lat": 41.1546473, "population2020": 64176, "censusGeoid": "3103950", "censusName": "Bellevue city"},
    ],
  },
  {
    stateId: "nevada",
    stateName: "Nevada",
    stateCode: "NV",
    capitalId: "carson-city",
    capitalActivityIds: ["capital-carson-city", "carson-city-nv"],
    capital: {"id": "capital-carson-city", "name": "Carson City", "lon": -119.7663053, "lat": 39.1640815},
    distractors: [
      {"name": "Las Vegas", "lon": -115.2640367, "lat": 36.2334989, "population2020": 641903, "censusGeoid": "3240000", "censusName": "Las Vegas city"},
      {"name": "Henderson", "lon": -115.0357508, "lat": 36.010155, "population2020": 317610, "censusGeoid": "3231900", "censusName": "Henderson city"},
    ],
  },
  {
    stateId: "new-hampshire",
    stateName: "New Hampshire",
    stateCode: "NH",
    capitalId: "concord",
    capitalActivityIds: ["capital-concord", "concord-nh"],
    capital: {"id": "capital-concord", "name": "Concord", "lon": -71.5382718, "lat": 43.2069054},
    distractors: [
      {"name": "Manchester", "lon": -71.4441315, "lat": 42.9849406, "population2020": 115644, "censusGeoid": "3345140", "censusName": "Manchester city"},
      {"name": "Nashua", "lon": -71.4905435, "lat": 42.7490744, "population2020": 91322, "censusGeoid": "3350260", "censusName": "Nashua city"},
    ],
  },
  {
    stateId: "new-jersey",
    stateName: "New Jersey",
    stateCode: "NJ",
    capitalId: "trenton",
    capitalActivityIds: ["capital-trenton", "trenton-nj"],
    capital: {"id": "capital-trenton", "name": "Trenton", "lon": -74.7699552, "lat": 40.2203572},
    distractors: [
      {"name": "Newark", "lon": -74.1725735, "lat": 40.7242204, "population2020": 311549, "censusGeoid": "3451000", "censusName": "Newark city"},
      {"name": "Jersey City", "lon": -74.0647599, "lat": 40.7114174, "population2020": 292449, "censusGeoid": "3436000", "censusName": "Jersey City city"},
    ],
  },
  {
    stateId: "new-mexico",
    stateName: "New Mexico",
    stateCode: "NM",
    capitalId: "santa-fe",
    capitalActivityIds: ["capital-santa-fe", "santa-fe-nm"],
    capital: {"id": "capital-santa-fe", "name": "Santa Fe", "lon": -105.9396043, "lat": 35.6823747},
    distractors: [
      {"name": "Albuquerque", "lon": -106.6468093, "lat": 35.1047797, "population2020": 564559, "censusGeoid": "3502000", "censusName": "Albuquerque city"},
      {"name": "Las Cruces", "lon": -106.7896951, "lat": 32.3264441, "population2020": 111385, "censusGeoid": "3539380", "censusName": "Las Cruces city"},
    ],
  },
  {
    stateId: "new-york",
    stateName: "New York",
    stateCode: "NY",
    capitalId: "albany",
    capitalActivityIds: ["capital-albany", "albany-ny"],
    capital: {"id": "capital-albany", "name": "Albany", "lon": -73.7575015, "lat": 42.6525086},
    distractors: [
      {"name": "New York City", "lon": -73.9386769, "lat": 40.6627117, "population2020": 8804190, "censusGeoid": "3651000", "censusName": "New York city"},
      {"name": "Buffalo", "lon": -78.8596862, "lat": 42.8924919, "population2020": 278349, "censusGeoid": "3611000", "censusName": "Buffalo city"},
    ],
  },
  {
    stateId: "north-carolina",
    stateName: "North Carolina",
    stateCode: "NC",
    capitalId: "raleigh",
    capitalActivityIds: ["capital-raleigh", "raleigh-nc"],
    capital: {"id": "capital-raleigh", "name": "Raleigh", "lon": -78.6391225, "lat": 35.7803724},
    distractors: [
      {"name": "Charlotte", "lon": -80.8309902, "lat": 35.2090447, "population2020": 874579, "censusGeoid": "3712000", "censusName": "Charlotte city"},
      {"name": "Greensboro", "lon": -79.8269963, "lat": 36.0951477, "population2020": 299035, "censusGeoid": "3728000", "censusName": "Greensboro city"},
    ],
  },
  {
    stateId: "north-dakota",
    stateName: "North Dakota",
    stateCode: "ND",
    capitalId: "bismarck",
    capitalActivityIds: ["capital-bismarck", "bismarck-nd"],
    capital: {"id": "capital-bismarck", "name": "Bismarck", "lon": -100.7827194, "lat": 46.8207637},
    distractors: [
      {"name": "Fargo", "lon": -96.8290805, "lat": 46.8647005, "population2020": 125990, "censusGeoid": "3825700", "censusName": "Fargo city"},
      {"name": "Grand Forks", "lon": -97.0893297, "lat": 47.9212905, "population2020": 59166, "censusGeoid": "3832060", "censusName": "Grand Forks city"},
    ],
  },
  {
    stateId: "ohio",
    stateName: "Ohio",
    stateCode: "OH",
    capitalId: "columbus",
    capitalActivityIds: ["capital-columbus", "columbus-oh"],
    capital: {"id": "capital-columbus", "name": "Columbus", "lon": -82.9987984, "lat": 39.961461},
    distractors: [
      {"name": "Cleveland", "lon": -81.6794351, "lat": 41.4784623, "population2020": 372624, "censusGeoid": "3916000", "censusName": "Cleveland city"},
      {"name": "Cincinnati", "lon": -84.5058289, "lat": 39.140183, "population2020": 309317, "censusGeoid": "3915000", "censusName": "Cincinnati city"},
    ],
  },
  {
    stateId: "oklahoma",
    stateName: "Oklahoma",
    stateCode: "OK",
    capitalId: "oklahoma-city",
    capitalActivityIds: ["capital-oklahoma-city", "oklahoma-city-ok"],
    capital: {"id": "capital-oklahoma-city", "name": "Oklahoma City", "lon": -97.5033801, "lat": 35.4922882},
    distractors: [
      {"name": "Tulsa", "lon": -95.9023162, "lat": 36.1279488, "population2020": 413066, "censusGeoid": "4075000", "censusName": "Tulsa city"},
      {"name": "Norman", "lon": -97.3452994, "lat": 35.240569, "population2020": 128026, "censusGeoid": "4052500", "censusName": "Norman city"},
    ],
  },
  {
    stateId: "oregon",
    stateName: "Oregon",
    stateCode: "OR",
    capitalId: "salem",
    capitalActivityIds: ["capital-salem", "salem-or"],
    capital: {"id": "capital-salem", "name": "Salem", "lon": -123.0301147, "lat": 44.938743},
    distractors: [
      {"name": "Portland", "lon": -122.649971, "lat": 45.5369506, "population2020": 652503, "censusGeoid": "4159000", "censusName": "Portland city"},
      {"name": "Eugene", "lon": -123.1174313, "lat": 44.055128, "population2020": 176654, "censusGeoid": "4123850", "censusName": "Eugene city"},
    ],
  },
  {
    stateId: "pennsylvania",
    stateName: "Pennsylvania",
    stateCode: "PA",
    capitalId: "harrisburg",
    capitalActivityIds: ["capital-harrisburg", "harrisburg-pa"],
    capital: {"id": "capital-harrisburg", "name": "Harrisburg", "lon": -76.8837835, "lat": 40.2644747},
    distractors: [
      {"name": "Philadelphia", "lon": -75.1333459, "lat": 40.0093755, "population2020": 1603797, "censusGeoid": "4260000", "censusName": "Philadelphia city"},
      {"name": "Pittsburgh", "lon": -79.9756758, "lat": 40.4399359, "population2020": 302971, "censusGeoid": "4261000", "censusName": "Pittsburgh city"},
    ],
  },
  {
    stateId: "rhode-island",
    stateName: "Rhode Island",
    stateCode: "RI",
    capitalId: "providence",
    capitalActivityIds: ["capital-providence", "providence-ri"],
    capital: {"id": "capital-providence", "name": "Providence", "lon": -71.414855, "lat": 41.8308218},
    distractors: [
      {"name": "Cranston", "lon": -71.4850489, "lat": 41.7697341, "population2020": 82934, "censusGeoid": "4419180", "censusName": "Cranston city"},
      {"name": "Warwick", "lon": -71.4203098, "lat": 41.7030847, "population2020": 82823, "censusGeoid": "4474300", "censusName": "Warwick city"},
    ],
  },
  {
    stateId: "south-carolina",
    stateName: "South Carolina",
    stateCode: "SC",
    capitalId: "columbia",
    capitalActivityIds: ["capital-columbia", "columbia-sc"],
    capital: {"id": "capital-columbia", "name": "Columbia", "lon": -81.0331509, "lat": 34.0004393},
    distractors: [
      {"name": "Charleston", "lon": -79.9728961, "lat": 32.828017, "population2020": 150227, "censusGeoid": "4513330", "censusName": "Charleston city"},
      {"name": "North Charleston", "lon": -80.065, "lat": 32.9178812, "population2020": 114852, "censusGeoid": "4550875", "censusName": "North Charleston city"},
    ],
  },
  {
    stateId: "south-dakota",
    stateName: "South Dakota",
    stateCode: "SD",
    capitalId: "pierre",
    capitalActivityIds: ["capital-pierre", "pierre-sd"],
    capital: {"id": "capital-pierre", "name": "Pierre", "lon": -100.3462286, "lat": 44.3671094},
    distractors: [
      {"name": "Sioux Falls", "lon": -96.730536, "lat": 43.5381962, "population2020": 192517, "censusGeoid": "4659020", "censusName": "Sioux Falls city"},
      {"name": "Rapid City", "lon": -103.2179242, "lat": 44.0710712, "population2020": 74703, "censusGeoid": "4652980", "censusName": "Rapid City city"},
    ],
  },
  {
    stateId: "tennessee",
    stateName: "Tennessee",
    stateCode: "TN",
    capitalId: "nashville",
    capitalActivityIds: ["capital-nashville", "nashville-tn"],
    capital: {"id": "capital-nashville", "name": "Nashville", "lon": -86.7841708, "lat": 36.1658985},
    distractors: [
      {"name": "Memphis", "lon": -89.9665654, "lat": 35.1090176, "population2020": 633104, "censusGeoid": "4748000", "censusName": "Memphis city"},
      {"name": "Knoxville", "lon": -83.9492703, "lat": 35.9706805, "population2020": 190740, "censusGeoid": "4740000", "censusName": "Knoxville city"},
    ],
  },
  {
    stateId: "texas",
    stateName: "Texas",
    stateCode: "TX",
    capitalId: "austin",
    capitalActivityIds: ["capital-austin", "austin-tx"],
    capital: {"id": "capital-austin", "name": "Austin", "lon": -97.7403271, "lat": 30.2746658},
    distractors: [
      {"name": "Houston", "lon": -95.3888059, "lat": 29.7857435, "population2020": 2304580, "censusGeoid": "4835000", "censusName": "Houston city"},
      {"name": "San Antonio", "lon": -98.5242867, "lat": 29.4634081, "population2020": 1434625, "censusGeoid": "4865000", "censusName": "San Antonio city"},
    ],
  },
  {
    stateId: "utah",
    stateName: "Utah",
    stateCode: "UT",
    capitalId: "salt-lake-city",
    capitalActivityIds: ["capital-salt-lake-city", "salt-lake-city-ut"],
    capital: {"id": "capital-salt-lake-city", "name": "Salt Lake City", "lon": -111.888132, "lat": 40.7773586},
    distractors: [
      {"name": "West Valley City", "lon": -112.0117586, "lat": 40.6884927, "population2020": 140230, "censusGeoid": "4983470", "censusName": "West Valley City city"},
      {"name": "West Jordan", "lon": -112.000762, "lat": 40.6024534, "population2020": 116961, "censusGeoid": "4982950", "censusName": "West Jordan city"},
    ],
  },
  {
    stateId: "vermont",
    stateName: "Vermont",
    stateCode: "VT",
    capitalId: "montpelier",
    capitalActivityIds: ["capital-montpelier", "montpelier-vt"],
    capital: {"id": "capital-montpelier", "name": "Montpelier", "lon": -72.5804725, "lat": 44.2624522},
    distractors: [
      {"name": "Burlington", "lon": -73.2388823, "lat": 44.491927, "population2020": 44743, "censusGeoid": "5010675", "censusName": "Burlington city"},
      {"name": "South Burlington", "lon": -73.1826228, "lat": 44.4364688, "population2020": 20292, "censusGeoid": "5066175", "censusName": "South Burlington city"},
    ],
  },
  {
    stateId: "virginia",
    stateName: "Virginia",
    stateCode: "VA",
    capitalId: "richmond",
    capitalActivityIds: ["capital-richmond", "richmond-va"],
    capital: {"id": "capital-richmond", "name": "Richmond", "lon": -77.4335963, "lat": 37.5387651},
    distractors: [
      {"name": "Virginia Beach", "lon": -76.0291418, "lat": 36.7795254, "population2020": 459470, "censusGeoid": "5182000", "censusName": "Virginia Beach city"},
      {"name": "Chesapeake", "lon": -76.3017884, "lat": 36.6793761, "population2020": 249422, "censusGeoid": "5116000", "censusName": "Chesapeake city"},
    ],
  },
  {
    stateId: "washington",
    stateName: "Washington",
    stateCode: "WA",
    capitalId: "olympia",
    capitalActivityIds: ["capital-olympia", "olympia-wa"],
    capital: {"id": "capital-olympia", "name": "Olympia", "lon": -122.9049162, "lat": 47.0357595},
    distractors: [
      {"name": "Seattle", "lon": -122.3515382, "lat": 47.6193352, "population2020": 737015, "censusGeoid": "5363000", "censusName": "Seattle city"},
      {"name": "Spokane", "lon": -117.433322, "lat": 47.6669347, "population2020": 228989, "censusGeoid": "5367000", "censusName": "Spokane city"},
    ],
  },
  {
    stateId: "west-virginia",
    stateName: "West Virginia",
    stateCode: "WV",
    capitalId: "charleston",
    capitalActivityIds: ["capital-charleston", "charleston-wv"],
    capital: {"id": "capital-charleston", "name": "Charleston", "lon": -81.6120072, "lat": 38.3364019},
    distractors: [
      {"name": "Huntington", "lon": -82.4346886, "lat": 38.4106509, "population2020": 46842, "censusGeoid": "5439460", "censusName": "Huntington city"},
      {"name": "Morgantown", "lon": -79.9468557, "lat": 39.637487, "population2020": 30347, "censusGeoid": "5455756", "censusName": "Morgantown city"},
    ],
  },
  {
    stateId: "wisconsin",
    stateName: "Wisconsin",
    stateCode: "WI",
    capitalId: "madison",
    capitalActivityIds: ["capital-madison", "madison-wi"],
    capital: {"id": "capital-madison", "name": "Madison", "lon": -89.3841797, "lat": 43.0746533},
    distractors: [
      {"name": "Milwaukee", "lon": -87.9666952, "lat": 43.0633484, "population2020": 577222, "censusGeoid": "5553000", "censusName": "Milwaukee city"},
      {"name": "Green Bay", "lon": -87.9865684, "lat": 44.5215424, "population2020": 107395, "censusGeoid": "5531000", "censusName": "Green Bay city"},
    ],
  },
  {
    stateId: "wyoming",
    stateName: "Wyoming",
    stateCode: "WY",
    capitalId: "cheyenne",
    capitalActivityIds: ["capital-cheyenne", "cheyenne-wy"],
    capital: {"id": "capital-cheyenne", "name": "Cheyenne", "lon": -104.8203092, "lat": 41.140301},
    distractors: [
      {"name": "Casper", "lon": -106.3205239, "lat": 42.8421007, "population2020": 59038, "censusGeoid": "5613150", "censusName": "Casper city"},
      {"name": "Gillette", "lon": -105.4989359, "lat": 44.2725799, "population2020": 33403, "censusGeoid": "5631855", "censusName": "Gillette city"},
    ],
  },
]);

const byStateId = new Map(US_CAPITAL_LOCATION_CITY_CHOICES.map((record) => [record.stateId, record]));
const byCapitalId = new Map(US_CAPITAL_LOCATION_CITY_CHOICES.flatMap((record) =>
  [record.capitalId, ...record.capitalActivityIds].map((id) => [id, record])
));

/** Return a deeply frozen record; an unknown or non-string state ID returns null. */
export function getUsCapitalLocationCityChoices(stateId) {
  return typeof stateId === "string" ? byStateId.get(stateId) || null : null;
}

/** Accept an atlas capital ID or an exact global/section activity capital ID. */
export function getUsCapitalLocationCityChoicesForCapital(capitalId) {
  return typeof capitalId === "string" ? byCapitalId.get(capitalId) || null : null;
}
