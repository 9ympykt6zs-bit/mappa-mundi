// Canonical relationship data for the U.S. playable-atlas foundation.
// Source feature IDs are normalized from the existing activity/GeoJSON inventories.

const SOURCE_ASSETS = Object.freeze({
  states: "assets/maps/data/us-states.json",
  capitals: "assets/maps/data/us-capitals.json",
  rivers: "assets/maps/data/us-physical-rivers.json",
  lakes: "assets/maps/data/us-physical-lakes.json",
  mountainRanges: "assets/data/physical-features/us-mountain-ranges.geojson"
});

const REGION_RECORDS = Object.freeze([
  { id: "northeast", name: "Northeast" },
  { id: "midwest", name: "Midwest" },
  { id: "south", name: "South" },
  { id: "west", name: "West" }
]);

const STATE_ABBREVIATIONS = Object.freeze({
  alabama: "AL", alaska: "AK", arizona: "AZ", arkansas: "AR", california: "CA",
  colorado: "CO", connecticut: "CT", delaware: "DE", florida: "FL", georgia: "GA",
  hawaii: "HI", idaho: "ID", illinois: "IL", indiana: "IN", iowa: "IA", kansas: "KS",
  kentucky: "KY", louisiana: "LA", maine: "ME", maryland: "MD", massachusetts: "MA",
  michigan: "MI", minnesota: "MN", mississippi: "MS", missouri: "MO", montana: "MT",
  nebraska: "NE", nevada: "NV", "new-hampshire": "NH", "new-jersey": "NJ", "new-mexico": "NM",
  "new-york": "NY", "north-carolina": "NC", "north-dakota": "ND", ohio: "OH", oklahoma: "OK",
  oregon: "OR", pennsylvania: "PA", "rhode-island": "RI", "south-carolina": "SC", "south-dakota": "SD",
  tennessee: "TN", texas: "TX", utah: "UT", vermont: "VT", virginia: "VA", washington: "WA",
  "west-virginia": "WV", wisconsin: "WI", wyoming: "WY"
});

// Regions follow the four U.S. Census regions. D.C. is intentionally excluded:
// this milestone models the 50 states only.
const STATE_RECORDS = Object.freeze([
  ["alabama", "Alabama", "montgomery", "capital-montgomery", "south", "florida georgia mississippi tennessee"],
  ["alaska", "Alaska", "juneau", "capital-juneau", "west", ""],
  ["arizona", "Arizona", "phoenix", "capital-phoenix", "west", "california colorado nevada new-mexico utah"],
  ["arkansas", "Arkansas", "little-rock", "capital-little-rock", "south", "louisiana mississippi missouri oklahoma tennessee texas"],
  ["california", "California", "sacramento", "capital-sacramento", "west", "arizona nevada oregon"],
  ["colorado", "Colorado", "denver", "capital-denver", "west", "arizona kansas nebraska new-mexico oklahoma utah wyoming"],
  ["connecticut", "Connecticut", "hartford", "capital-hartford", "northeast", "massachusetts new-york rhode-island"],
  ["delaware", "Delaware", "dover", "capital-dover", "south", "maryland pennsylvania"],
  ["florida", "Florida", "tallahassee", "capital-tallahassee", "south", "alabama georgia"],
  ["georgia", "Georgia", "atlanta", "capital-atlanta", "south", "alabama florida north-carolina south-carolina tennessee"],
  ["hawaii", "Hawaii", "honolulu", "capital-honolulu", "west", ""],
  ["idaho", "Idaho", "boise", "capital-boise", "west", "montana nevada oregon utah washington wyoming"],
  ["illinois", "Illinois", "springfield", "capital-springfield", "midwest", "indiana iowa kentucky missouri wisconsin"],
  ["indiana", "Indiana", "indianapolis", "capital-indianapolis", "midwest", "illinois kentucky michigan ohio"],
  ["iowa", "Iowa", "des-moines", "capital-des-moines", "midwest", "illinois minnesota missouri nebraska south-dakota wisconsin"],
  ["kansas", "Kansas", "topeka", "capital-topeka", "midwest", "colorado missouri nebraska oklahoma"],
  ["kentucky", "Kentucky", "frankfort", "capital-frankfort", "south", "illinois indiana missouri ohio tennessee virginia west-virginia"],
  ["louisiana", "Louisiana", "baton-rouge", "capital-baton-rouge", "south", "arkansas mississippi texas"],
  ["maine", "Maine", "augusta", "capital-augusta", "northeast", "new-hampshire"],
  ["maryland", "Maryland", "annapolis", "capital-annapolis", "south", "delaware pennsylvania virginia west-virginia"],
  ["massachusetts", "Massachusetts", "boston", "capital-boston", "northeast", "connecticut new-hampshire new-york rhode-island vermont"],
  ["michigan", "Michigan", "lansing", "capital-lansing", "midwest", "indiana ohio wisconsin"],
  ["minnesota", "Minnesota", "saint-paul", "capital-saint-paul", "midwest", "iowa north-dakota south-dakota wisconsin"],
  ["mississippi", "Mississippi", "jackson", "capital-jackson", "south", "alabama arkansas louisiana tennessee"],
  ["missouri", "Missouri", "jefferson-city", "capital-jefferson-city", "midwest", "arkansas illinois iowa kansas kentucky nebraska oklahoma tennessee"],
  ["montana", "Montana", "helena", "capital-helena", "west", "idaho north-dakota south-dakota wyoming"],
  ["nebraska", "Nebraska", "lincoln", "capital-lincoln", "midwest", "colorado iowa kansas missouri south-dakota wyoming"],
  ["nevada", "Nevada", "carson-city", "capital-carson-city", "west", "arizona california idaho oregon utah"],
  ["new-hampshire", "New Hampshire", "concord", "capital-concord", "northeast", "maine massachusetts vermont"],
  ["new-jersey", "New Jersey", "trenton", "capital-trenton", "northeast", "new-york pennsylvania"],
  ["new-mexico", "New Mexico", "santa-fe", "capital-santa-fe", "west", "arizona colorado oklahoma texas utah"],
  ["new-york", "New York", "albany", "capital-albany", "northeast", "connecticut massachusetts new-jersey pennsylvania vermont"],
  ["north-carolina", "North Carolina", "raleigh", "capital-raleigh", "south", "georgia south-carolina tennessee virginia"],
  ["north-dakota", "North Dakota", "bismarck", "capital-bismarck", "midwest", "minnesota montana south-dakota"],
  ["ohio", "Ohio", "columbus", "capital-columbus", "midwest", "indiana kentucky michigan pennsylvania west-virginia"],
  ["oklahoma", "Oklahoma", "oklahoma-city", "capital-oklahoma-city", "south", "arkansas colorado kansas missouri new-mexico texas"],
  ["oregon", "Oregon", "salem", "capital-salem", "west", "california idaho nevada washington"],
  ["pennsylvania", "Pennsylvania", "harrisburg", "capital-harrisburg", "northeast", "delaware maryland new-jersey new-york ohio west-virginia"],
  ["rhode-island", "Rhode Island", "providence", "capital-providence", "northeast", "connecticut massachusetts"],
  ["south-carolina", "South Carolina", "columbia", "capital-columbia", "south", "georgia north-carolina"],
  ["south-dakota", "South Dakota", "pierre", "capital-pierre", "midwest", "iowa minnesota montana nebraska north-dakota wyoming"],
  ["tennessee", "Tennessee", "nashville", "capital-nashville", "south", "alabama arkansas georgia kentucky mississippi missouri north-carolina virginia"],
  ["texas", "Texas", "austin", "capital-austin", "south", "arkansas louisiana new-mexico oklahoma"],
  ["utah", "Utah", "salt-lake-city", "capital-salt-lake-city", "west", "arizona colorado idaho nevada new-mexico wyoming"],
  ["vermont", "Vermont", "montpelier", "capital-montpelier", "northeast", "massachusetts new-hampshire new-york"],
  ["virginia", "Virginia", "richmond", "capital-richmond", "south", "kentucky maryland north-carolina tennessee west-virginia"],
  ["washington", "Washington", "olympia", "capital-olympia", "west", "idaho oregon"],
  ["west-virginia", "West Virginia", "charleston", "capital-charleston", "south", "kentucky maryland ohio pennsylvania virginia"],
  ["wisconsin", "Wisconsin", "madison", "capital-madison", "midwest", "illinois iowa michigan minnesota"],
  ["wyoming", "Wyoming", "cheyenne", "capital-cheyenne", "west", "colorado idaho montana nebraska south-dakota utah"]
]);

const RIVER_RECORDS = Object.freeze([
  ["arkansas-river", "Arkansas River", "arkansas-river", "colorado kansas oklahoma arkansas"],
  ["colorado-river", "Colorado River", "colorado-river", "arizona colorado utah", "arizona california nevada"],
  ["columbia-river", "Columbia River", "columbia-river", "oregon washington"],
  ["mississippi-river", "Mississippi River", "mississippi-river", "minnesota wisconsin iowa illinois missouri kentucky tennessee arkansas mississippi louisiana"],
  ["missouri-river", "Missouri River", "missouri-river", "montana north-dakota south-dakota nebraska iowa kansas missouri"],
  ["ohio-river", "Ohio River", "ohio-river", "pennsylvania ohio west-virginia kentucky indiana illinois"],
  ["rio-grande-river", "Rio Grande River", "rio-grande-river", "colorado new-mexico texas"],
  ["st-lawrence-river", "St. Lawrence River", "st-lawrence-river", "new-york"]
]);

const LAKE_RECORDS = Object.freeze([
  ["lake-superior", "Lake Superior", "lake-superior", "michigan minnesota wisconsin"],
  ["lake-michigan", "Lake Michigan", "lake-michigan", "illinois indiana michigan wisconsin"],
  ["lake-huron", "Lake Huron", "lake-huron", "michigan"],
  ["lake-erie", "Lake Erie", "lake-erie", "michigan new-york ohio pennsylvania"],
  ["lake-ontario", "Lake Ontario", "lake-ontario", "new-york"],
  ["great-salt-lake", "Great Salt Lake", "great-salt-lake", "utah"]
]);

const MOUNTAIN_RANGE_RECORDS = Object.freeze([
  ["rocky-mountains", "Rocky Mountains", "colorado idaho montana new-mexico utah wyoming"],
  ["cascade-mountains", "Cascade Mountains", "california oregon washington"],
  ["sierra-nevada", "Sierra Nevada", "california nevada"],
  ["white-mountains", "White Mountains", "maine new-hampshire"],
  ["green-mountains", "Green Mountains", "vermont"],
  ["adirondack-mountains", "Adirondack Mountains", "new-york"],
  ["allegheny-mountains", "Allegheny Mountains", "maryland pennsylvania virginia west-virginia"],
  ["blue-ridge-mountains", "Blue Ridge Mountains", "georgia maryland north-carolina pennsylvania south-carolina tennessee virginia west-virginia"],
  ["great-smoky-mountains", "Great Smoky Mountains", "north-carolina tennessee"],
  ["cumberland-mountains", "Cumberland Mountains", "kentucky tennessee virginia"],
  ["coast-ranges", "Coast Ranges", "california oregon washington"],
  ["olympic-mountains", "Olympic Mountains", "washington"],
  ["wasatch-range", "Wasatch Range", "utah"],
  ["teton-range", "Teton Range", "idaho wyoming"],
  ["alaska-range", "Alaska Range", "alaska"],
  ["brooks-range", "Brooks Range", "alaska"],
  ["appalachian-mountains", "Appalachian Mountains", "georgia kentucky maine maryland new-hampshire new-york north-carolina pennsylvania south-carolina tennessee vermont virginia west-virginia"],
  ["ozark-mountains", "Ozark Mountains", "arkansas missouri oklahoma"],
  ["ouachita-mountains", "Ouachita Mountains", "arkansas oklahoma"],
  ["black-hills", "Black Hills", "south-dakota wyoming"]
]);

const COUNTRY_RECORDS = Object.freeze([
  ["canada", "Canada"],
  ["mexico", "Mexico"],
  ["russia", "Russia"]
]);

const WATER_RECORDS = Object.freeze([
  ["atlantic-ocean", "Atlantic Ocean", "ocean"],
  ["pacific-ocean", "Pacific Ocean", "ocean"],
  ["arctic-ocean", "Arctic Ocean", "ocean"],
  ["gulf-of-mexico", "Gulf of Mexico", "gulf", ["Gulf of America"], "Officially called the Gulf of America by the U.S. federal government."],
  ["bering-strait", "Bering Strait", "strait"]
]);

const INTERNATIONAL_LAND_BORDER_RECORDS = Object.freeze([
  ["canada", "alaska idaho maine minnesota montana new-hampshire new-york north-dakota vermont washington"],
  ["mexico", "arizona california new-mexico texas"]
]);

const COAST_RECORDS = Object.freeze([
  ["atlantic-ocean", "connecticut delaware florida georgia maine maryland massachusetts new-hampshire new-jersey new-york north-carolina rhode-island south-carolina virginia"],
  ["pacific-ocean", "alaska california hawaii oregon washington"],
  ["arctic-ocean", "alaska"],
  ["gulf-of-mexico", "alabama florida louisiana mississippi texas"]
]);

function toIds(value) {
  return value ? value.split(" ") : [];
}

function entityId(kind, id) {
  return `${kind}:${id}`;
}

function displayNameFromId(id) {
  return id.split("-").map((word) => word[0].toUpperCase() + word.slice(1)).join(" ");
}

function assertNoDuplicateIds(entities) {
  const ids = new Set();
  for (const entity of entities) {
    if (ids.has(entity.id)) {
      throw new Error(`Duplicate atlas entity ID: ${entity.id}`);
    }
    ids.add(entity.id);
  }
}

function buildUnitedStatesAtlas({ states = STATE_RECORDS, rivers = RIVER_RECORDS, lakes = LAKE_RECORDS, mountainRanges = MOUNTAIN_RANGE_RECORDS } = {}) {
  const entities = [
    ...REGION_RECORDS.map((region) => ({ ...region, id: entityId("region", region.id), kind: "region" })),
    ...states.flatMap(([id, name, capitalId, capitalSourceId, regionId]) => [
      { id: entityId("state", id), kind: "state", name, abbreviation: STATE_ABBREVIATIONS[id], source: { asset: SOURCE_ASSETS.states, featureId: id } },
      { id: entityId("capital", capitalId), kind: "capital", name: displayNameFromId(capitalId), source: { asset: SOURCE_ASSETS.capitals, featureId: capitalSourceId } }
    ]),
    ...rivers.map(([id, name, sourceFeatureId]) => ({ id: entityId("river", id), kind: "river", name, source: { asset: SOURCE_ASSETS.rivers, featureId: sourceFeatureId } })),
    ...lakes.map(([id, name, sourceFeatureId]) => ({ id: entityId("lake", id), kind: "lake", name, source: { asset: SOURCE_ASSETS.lakes, featureId: sourceFeatureId } })),
    ...mountainRanges.map(([id, name]) => ({ id: entityId("mountain-range", id), kind: "mountain-range", name, source: { asset: SOURCE_ASSETS.mountainRanges, featureId: id } })),
    ...COUNTRY_RECORDS.map(([id, name]) => ({ id: entityId("country", id), kind: "country", name })),
    ...WATER_RECORDS.map(([id, name, waterType, alternateNames = [], namePolicyNote = ""]) => ({
      id: entityId("water", id),
      kind: "water",
      waterType,
      name,
      alternateNames: Object.freeze([...alternateNames]),
      namePolicyNote
    }))
  ];
  assertNoDuplicateIds(entities);

  const relationships = [];
  for (const [id, , capitalId, , regionId, borders] of states) {
    relationships.push({ type: "capitalOf", from: entityId("capital", capitalId), to: entityId("state", id) });
    relationships.push({ type: "belongsToRegion", from: entityId("state", id), to: entityId("region", regionId) });
    for (const neighborId of toIds(borders)) {
      relationships.push({ type: "borders", from: entityId("state", id), to: entityId("state", neighborId) });
    }
  }
  for (const [id, , , flowsThrough, bordersState = ""] of rivers) {
    for (const stateId of toIds(flowsThrough)) relationships.push({ type: "flowsThrough", from: entityId("river", id), to: entityId("state", stateId) });
    for (const stateId of toIds(bordersState)) relationships.push({ type: "bordersState", from: entityId("river", id), to: entityId("state", stateId) });
  }
  for (const [id, , , stateIds] of lakes) {
    for (const stateId of toIds(stateIds)) {
      relationships.push({ type: "bordersState", from: entityId("lake", id), to: entityId("state", stateId) });
      if (id !== "great-salt-lake") relationships.push({ type: "majorBordersState", from: entityId("lake", id), to: entityId("state", stateId) });
    }
  }
  for (const [id, , stateIds] of mountainRanges) {
    for (const stateId of toIds(stateIds)) relationships.push({ type: "locatedIn", from: entityId("mountain-range", id), to: entityId("state", stateId) });
  }
  for (const [countryId, stateIds] of INTERNATIONAL_LAND_BORDER_RECORDS) {
    for (const stateId of toIds(stateIds)) relationships.push({ type: "internationalBorder", from: entityId("state", stateId), to: entityId("country", countryId) });
  }
  for (const [waterId, stateIds] of COAST_RECORDS) {
    for (const stateId of toIds(stateIds)) relationships.push({ type: "coast", from: entityId("state", stateId), to: entityId("water", waterId) });
  }
  relationships.push({ type: "majorBordersState", from: entityId("water", "bering-strait"), to: entityId("state", "alaska") });
  relationships.push({ type: "maritimeNeighbor", from: entityId("state", "alaska"), to: entityId("country", "russia"), via: entityId("water", "bering-strait") });

  return Object.freeze({
    version: 2,
    sourceAssets: SOURCE_ASSETS,
    entities: Object.freeze(entities.map(Object.freeze)),
    relationships: Object.freeze(relationships.map(Object.freeze)),
    notes: Object.freeze([
      "State borders are land borders between the 50 states; water-only adjacency is excluded.",
      "Physical-feature associations are curated from the existing playable feature inventory and describe direct flow, state-border, or range-location relationships only.",
      "International neighbors are land-bordering countries only; Russia is represented solely as Alaska's maritime neighbor across the Bering Strait.",
      "Interstate water borders and broad mountain-system extents can be geographically nuanced; this foundation records only the named existing feature relationships listed here."
    ])
  });
}

function indexAtlas(atlas) {
  return new Map(atlas.entities.map((entity) => [entity.id, entity]));
}

function validateUnitedStatesAtlas(atlas) {
  const errors = [];
  const entitiesById = new Map();
  for (const entity of atlas.entities || []) {
    if (entitiesById.has(entity.id)) errors.push(`Duplicate entity ID: ${entity.id}`);
    entitiesById.set(entity.id, entity);
  }

  const states = atlas.entities.filter((entity) => entity.kind === "state");
  const capitals = atlas.entities.filter((entity) => entity.kind === "capital");
  if (states.length !== 50) errors.push(`Expected 50 states, found ${states.length}.`);
  if (new Set(states.map((state) => state.id)).size !== 50) errors.push("State IDs must be unique.");
  if (capitals.length !== 50) errors.push(`Expected 50 capitals, found ${capitals.length}.`);

  const outgoing = new Map();
  for (const relationship of atlas.relationships || []) {
    if (!entitiesById.has(relationship.from)) errors.push(`Invalid relationship source: ${relationship.from}`);
    if (!entitiesById.has(relationship.to)) errors.push(`Invalid relationship target: ${relationship.to}`);
    const key = `${relationship.type}:${relationship.from}`;
    outgoing.set(key, [...(outgoing.get(key) || []), relationship.to]);
  }
  for (const state of states) {
    if (!/^[A-Z]{2}$/.test(state.abbreviation || "")) errors.push(`${state.id} must have a two-letter postal abbreviation.`);
    if ((outgoing.get(`capitalOf:${state.id}`) || []).length !== 0) errors.push(`States must not point outward with capitalOf: ${state.id}`);
    const capitalRelationships = atlas.relationships.filter((relationship) => relationship.type === "capitalOf" && relationship.to === state.id);
    const regionRelationships = atlas.relationships.filter((relationship) => relationship.type === "belongsToRegion" && relationship.from === state.id);
    if (capitalRelationships.length !== 1) errors.push(`${state.id} must have exactly one capital.`);
    if (regionRelationships.length !== 1) errors.push(`${state.id} must have exactly one region.`);
  }
  for (const capital of capitals) {
    if ((outgoing.get(`capitalOf:${capital.id}`) || []).length !== 1) errors.push(`${capital.id} must belong to exactly one state.`);
  }
  for (const relationship of atlas.relationships) {
    if (relationship.type !== "borders") continue;
    const reciprocal = atlas.relationships.some((candidate) => candidate.type === "borders" && candidate.from === relationship.to && candidate.to === relationship.from);
    if (!reciprocal) errors.push(`Asymmetric border relationship: ${relationship.from} -> ${relationship.to}`);
  }
  for (const relationship of atlas.relationships) {
    if (relationship.type === "internationalBorder" && !relationship.to.startsWith("country:")) errors.push(`International border must reference a country: ${relationship.to}`);
    if (relationship.type === "internationalBorder" && relationship.to === entityId("country", "russia")) errors.push("Russia must not be recorded as a U.S. state land-bordering country.");
    if (relationship.type === "maritimeNeighbor" && !entitiesById.get(relationship.via)) errors.push(`Maritime neighbor requires a valid water context: ${relationship.via}`);
  }
  for (const entity of atlas.entities) {
    if (!["river", "lake", "mountain-range"].includes(entity.kind)) continue;
    if (!entity.source?.featureId) errors.push(`Physical feature lacks an existing source feature ID: ${entity.id}`);
  }
  return errors;
}

function assertValidUnitedStatesAtlas(atlas) {
  const errors = validateUnitedStatesAtlas(atlas);
  if (errors.length) throw new Error(`Invalid United States atlas:\n${errors.join("\n")}`);
  return atlas;
}

function getEntity(atlas, id) {
  return indexAtlas(atlas).get(id) || null;
}

function getRelatedEntities(atlas, entity, relationshipType, direction = "outgoing") {
  const entityIdValue = entity.includes(":") ? entity : entityId("state", entity);
  const relatedIds = atlas.relationships
    .filter((relationship) => relationship.type === relationshipType && (direction === "outgoing" ? relationship.from === entityIdValue : relationship.to === entityIdValue))
    .map((relationship) => direction === "outgoing" ? relationship.to : relationship.from);
  const entitiesById = indexAtlas(atlas);
  return relatedIds.map((id) => entitiesById.get(id)).filter(Boolean);
}

export const unitedStatesAtlas = assertValidUnitedStatesAtlas(buildUnitedStatesAtlas());

export {
  SOURCE_ASSETS,
  buildUnitedStatesAtlas,
  validateUnitedStatesAtlas,
  assertValidUnitedStatesAtlas,
  getEntity,
  getRelatedEntities
};
