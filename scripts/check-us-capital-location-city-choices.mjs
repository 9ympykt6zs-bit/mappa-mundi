import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import {
  US_CAPITAL_LOCATION_CITY_CHOICES,
  getUsCapitalLocationCityChoices,
  getUsCapitalLocationCityChoicesForCapital
} from "../src/atlas/us-capital-location-city-choices.js";
import { getStateCapitalRelationshipPairs } from "../src/atlas/state-capital-relationship-challenges.js";

const dataDirectory = fileURLToPath(new URL("../assets/maps/data/", import.meta.url));
const readData = (name) => JSON.parse(readFileSync(`${dataDirectory}/${name}`, "utf8"));
const canonicalCapitals = readData("us-capitals.json").features.filter((feature) => feature.state);
const pairs = getStateCapitalRelationshipPairs();
const records = US_CAPITAL_LOCATION_CITY_CHOICES;
assert.equal(records.length, 50);
assert.equal(canonicalCapitals.length, 50);
assert.deepEqual(records.map(({ stateId }) => stateId).sort(), pairs.map(({ stateId }) => stateId).sort());
assert.equal(new Set(records.map(({ stateCode }) => stateCode)).size, 50);
assert.equal(new Set(records.map(({ capitalId }) => capitalId)).size, 50);

const cityNames = {
  AL: ["Huntsville", "Birmingham"], AK: ["Anchorage", "Fairbanks"],
  AZ: ["Tucson", "Mesa"], AR: ["Fayetteville", "Fort Smith"],
  CA: ["Los Angeles", "San Diego"], CO: ["Colorado Springs", "Aurora"],
  CT: ["Bridgeport", "Stamford"], DE: ["Wilmington", "Newark"],
  FL: ["Jacksonville", "Miami"], GA: ["Columbus", "Augusta"],
  HI: ["East Honolulu", "Pearl City"], ID: ["Meridian", "Nampa"],
  IL: ["Chicago", "Aurora"], IN: ["Fort Wayne", "Evansville"],
  IA: ["Cedar Rapids", "Davenport"], KS: ["Wichita", "Overland Park"],
  KY: ["Louisville", "Lexington"], LA: ["New Orleans", "Shreveport"],
  ME: ["Portland", "Lewiston"], MD: ["Baltimore", "Frederick"],
  MA: ["Worcester", "Springfield"], MI: ["Detroit", "Grand Rapids"],
  MN: ["Minneapolis", "Rochester"], MS: ["Gulfport", "Southaven"],
  MO: ["Kansas City", "St. Louis"], MT: ["Billings", "Missoula"],
  NE: ["Omaha", "Bellevue"], NV: ["Las Vegas", "Henderson"],
  NH: ["Manchester", "Nashua"], NJ: ["Newark", "Jersey City"],
  NM: ["Albuquerque", "Las Cruces"], NY: ["New York City", "Buffalo"],
  NC: ["Charlotte", "Greensboro"], ND: ["Fargo", "Grand Forks"],
  OH: ["Cleveland", "Cincinnati"], OK: ["Tulsa", "Norman"],
  OR: ["Portland", "Eugene"], PA: ["Philadelphia", "Pittsburgh"],
  RI: ["Cranston", "Warwick"], SC: ["Charleston", "North Charleston"],
  SD: ["Sioux Falls", "Rapid City"], TN: ["Memphis", "Knoxville"],
  TX: ["Houston", "San Antonio"], UT: ["West Valley City", "West Jordan"],
  VT: ["Burlington", "South Burlington"], VA: ["Virginia Beach", "Chesapeake"],
  WA: ["Seattle", "Spokane"], WV: ["Huntington", "Morgantown"],
  WI: ["Milwaukee", "Green Bay"], WY: ["Casper", "Gillette"]
};

function assertFrozenTree(value) {
  if (!value || typeof value !== "object") return;
  assert.ok(Object.isFrozen(value));
  Object.values(value).forEach(assertFrozenTree);
}
assertFrozenTree(records);
const geoids = new Set();
for (const record of records) {
  const { stateId, stateName, capital, distractors } = record;
  const pair = pairs.find((candidate) => candidate.stateId === stateId);
  const canonical = canonicalCapitals.find((candidate) => candidate.state === stateName);
  assert.ok(canonical, stateId);
  assert.equal(record.capitalId, pair.capitalId);
  assert.deepEqual(capital, Object.fromEntries(["id", "name", "lon", "lat"].map((key) => [key, canonical[key]])));
  assert.equal(distractors.length, 2);
  assert.deepEqual(distractors.map(({ name }) => name), cityNames[record.stateCode]);
  assert.ok(distractors[0].population2020 >= distractors[1].population2020);
  assert.equal(new Set([capital, ...distractors].map(({ name }) => name)).size, 3);
  assert.equal(new Set([capital, ...distractors].map(({ lon, lat }) => `${lon},${lat}`)).size, 3);
  for (const city of [capital, ...distractors]) {
    assert.ok(Number.isFinite(city.lon) && city.lon >= -180 && city.lon <= 180);
    assert.ok(Number.isFinite(city.lat) && city.lat >= -90 && city.lat <= 90);
  }
  for (const city of distractors) {
    assert.match(city.censusGeoid, /^\d{7}$/);
    assert.ok(!geoids.has(city.censusGeoid));
    geoids.add(city.censusGeoid);
    assert.ok(Number.isInteger(city.population2020) && city.population2020 > 0);
    assert.ok(city.censusName.length > 0);
    for (const forbidden of ["id", "conceptId", "canonicalConceptId", "activityId", "targetId", "entityId"]) {
      assert.ok(!(forbidden in city), `${city.name} must remain display context only`);
    }
  }
  assert.equal(getUsCapitalLocationCityChoices(stateId), record);
  for (const id of [record.capitalId, ...record.capitalActivityIds]) {
    assert.equal(getUsCapitalLocationCityChoicesForCapital(id), record);
  }
}
assert.equal(geoids.size, 100);

let sectionCapitalCount = 0;
for (const name of readdirSync(dataDirectory).filter((name) => /^us-states-capitals-\d+\.json$/.test(name))) {
  for (const feature of readData(name).features.filter(({ type }) => type === "capital")) {
    const record = getUsCapitalLocationCityChoicesForCapital(feature.id);
    assert.ok(record, `Missing activity ID ${feature.id}`);
    assert.equal(record.stateCode, feature.state);
    assert.equal(record.capital.name.replace("Saint ", "St. "), feature.city);
    sectionCapitalCount += 1;
  }
}
assert.equal(sectionCapitalCount, 50);

const louisiana = getUsCapitalLocationCityChoices("louisiana");
assert.equal(louisiana.capital.name, "Baton Rouge");
assert.throws(() => { louisiana.distractors[0].lon = 0; }, TypeError);
assert.throws(() => { louisiana.distractors.push({ name: "Other" }); }, TypeError);
for (const invalid of [null, undefined, {}, "", "district-of-columbia", "washington-dc"]) {
  assert.equal(getUsCapitalLocationCityChoices(invalid), null);
  assert.equal(getUsCapitalLocationCityChoicesForCapital(invalid), null);
}
assert.equal(getUsCapitalLocationCityChoices("louisiana").distractors[0].name, "New Orleans");

console.log("Capital-location city choices passed: 50 canonical states/capitals, 100 city choices, all 50 section aliases, immutable lookups, and exclusion boundaries.");
