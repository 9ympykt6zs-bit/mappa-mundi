import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import polygonClipping from "polygon-clipping";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const dataDir = path.join(rootDir, "assets", "maps", "data");
const worldCountriesPath = path.join(dataDir, "maplibre-world-countries.geojson");
const supplementPaths = [
  path.join(rootDir, "assets", "maps", "world", "french-guiana-map-unit.geojson"),
  path.join(rootDir, "assets", "maps", "world", "guam-map-unit.geojson")
];
const europeRussiaMaskPath = path.join(dataDir, "co-split-masks", "europe-russia-mask.geojson");
const asiaRussiaMaskPath = path.join(dataDir, "co-split-masks", "asia-russia-mask.geojson");
const outputPath = path.join(dataDir, "continents-oceans-land.geojson");

const continentOrder = [
  "north-america",
  "south-america",
  "europe",
  "africa",
  "asia",
  "australia",
  "antarctica"
];

const continentNames = {
  "north-america": "North America",
  "south-america": "South America",
  europe: "Europe",
  africa: "Africa",
  asia: "Asia",
  australia: "Australia",
  antarctica: "Antarctica"
};

const europeGeographicExtent = {
  west: -31,
  south: 30,
  east: 70,
  north: 73.5
};

async function readJson(filePath) {
  return JSON.parse(await fs.readFile(filePath, "utf8"));
}

function toMultiPolygonCoordinates(geometry) {
  if (!geometry) {
    return [];
  }

  if (geometry.type === "Polygon") {
    return [geometry.coordinates];
  }

  if (geometry.type === "MultiPolygon") {
    return geometry.coordinates || [];
  }

  return [];
}

function toGeometryCoordinates(featureCollectionOrFeature) {
  const feature = featureCollectionOrFeature?.type === "FeatureCollection"
    ? featureCollectionOrFeature.features?.[0]
    : featureCollectionOrFeature;
  return toMultiPolygonCoordinates(feature?.geometry);
}

function getCoordinateBounds(coordinates, bounds = [Infinity, Infinity, -Infinity, -Infinity]) {
  if (typeof coordinates?.[0] === "number") {
    const [lon, lat] = coordinates;
    bounds[0] = Math.min(bounds[0], lon);
    bounds[1] = Math.min(bounds[1], lat);
    bounds[2] = Math.max(bounds[2], lon);
    bounds[3] = Math.max(bounds[3], lat);
    return bounds;
  }

  coordinates?.forEach((coordinate) => getCoordinateBounds(coordinate, bounds));
  return bounds;
}

function isPolygonInExtent(polygon, extent) {
  const [west, south, east, north] = getCoordinateBounds(polygon);
  return east >= extent.west
    && west <= extent.east
    && north >= extent.south
    && south <= extent.north;
}

function isIdentity(feature, value) {
  const normalized = String(value).toLowerCase();
  const properties = feature?.properties || {};
  return [
    properties.NAME,
    properties.NAME_LONG,
    properties.ADMIN,
    properties.GEOUNIT,
    properties.SUBUNIT,
    properties.BRK_NAME
  ].some((candidate) => String(candidate || "").trim().toLowerCase() === normalized);
}

function isRussia(feature) {
  return isIdentity(feature, "russia") || feature?.properties?.ISO_A3 === "RUS";
}

function isNorway(feature) {
  return isIdentity(feature, "norway");
}

function isFrenchSouthernAntarcticLands(feature) {
  return isIdentity(feature, "fr. s. antarctic lands")
    || isIdentity(feature, "french southern and antarctic lands");
}

function getContinentId(feature) {
  if (isFrenchSouthernAntarcticLands(feature)) {
    return "antarctica";
  }

  const continent = feature?.properties?.CONTINENT;

  if (continent === "North America") {
    return "north-america";
  }

  if (continent === "South America") {
    return "south-america";
  }

  if (continent === "Europe") {
    return "europe";
  }

  if (continent === "Africa") {
    return "africa";
  }

  if (continent === "Asia") {
    return "asia";
  }

  if (continent === "Oceania") {
    return "australia";
  }

  if (continent === "Antarctica") {
    return "antarctica";
  }

  return null;
}

function getFeaturePieces(feature) {
  const polygons = toMultiPolygonCoordinates(feature.geometry);

  if (getContinentId(feature) !== "europe" || isNorway(feature)) {
    return polygons;
  }

  return polygons.filter((polygon) => isPolygonInExtent(polygon, europeGeographicExtent));
}

function addPiece(store, continentId, coordinates) {
  if (!continentId || !coordinates?.length) {
    return;
  }

  store[continentId].push(coordinates);
}

function unionPieces(pieces) {
  if (!pieces.length) {
    return [];
  }

  return pieces.reduce((merged, piece) => (
    merged.length ? polygonClipping.union(merged, piece) : piece
  ), []);
}

function getRussiaSplitPieces(russiaFeature, europeMask, asiaMask) {
  const russia = toMultiPolygonCoordinates(russiaFeature.geometry);
  const europe = polygonClipping.intersection(russia, europeMask);
  const rawAsia = polygonClipping.intersection(russia, asiaMask);
  const asia = europe.length && rawAsia.length
    ? polygonClipping.difference(rawAsia, europe)
    : rawAsia;

  return { europe, asia };
}

function buildOutputFeature(continentId, coordinates) {
  return {
    type: "Feature",
    id: continentId,
    properties: {
      id: continentId,
      name: continentNames[continentId],
      source: "continents-oceans-land",
      generatedFor: "continents-oceans"
    },
    geometry: {
      type: "MultiPolygon",
      coordinates
    }
  };
}

function assertValidOutput(collection) {
  if (collection.type !== "FeatureCollection") {
    throw new Error("Output is not a FeatureCollection.");
  }

  const ids = collection.features.map((feature) => feature.properties?.id);
  const missing = continentOrder.filter((id) => !ids.includes(id));

  if (missing.length) {
    throw new Error(`Missing continent feature(s): ${missing.join(", ")}`);
  }

  if (collection.features.length !== continentOrder.length) {
    throw new Error(`Expected ${continentOrder.length} features, found ${collection.features.length}.`);
  }

  collection.features.forEach((feature) => {
    if (feature.geometry?.type !== "MultiPolygon") {
      throw new Error(`${feature.properties?.id} is not a MultiPolygon.`);
    }

    if (!feature.geometry.coordinates?.length) {
      throw new Error(`${feature.properties?.id} has no polygon coordinates.`);
    }
  });
}

const worldCountries = await readJson(worldCountriesPath);
const supplements = await Promise.all(supplementPaths.map(readJson));
const europeRussiaMask = toGeometryCoordinates(await readJson(europeRussiaMaskPath));
const asiaRussiaMask = toGeometryCoordinates(await readJson(asiaRussiaMaskPath));
const features = [
  ...(worldCountries.features || []),
  ...supplements.flatMap((collection) => collection.features || [])
];
const piecesByContinent = Object.fromEntries(continentOrder.map((id) => [id, []]));
const russiaFeature = features.find(isRussia);

if (!russiaFeature) {
  throw new Error("Russia feature was not found in the world countries source.");
}

features.forEach((feature) => {
  if (isRussia(feature)) {
    return;
  }

  const continentId = getContinentId(feature);

  getFeaturePieces(feature).forEach((polygon) => {
    addPiece(piecesByContinent, continentId, [polygon]);
  });
});

const russiaSplit = getRussiaSplitPieces(russiaFeature, europeRussiaMask, asiaRussiaMask);
addPiece(piecesByContinent, "europe", russiaSplit.europe);
addPiece(piecesByContinent, "asia", russiaSplit.asia);

const output = {
  type: "FeatureCollection",
  name: "continents-oceans-land",
  metadata: {
    generatedBy: "scripts/generate-co-continent-land.mjs",
    purpose: "C&O-only simplified educational continent land targets",
    russiaSplit: "Russia is clipped with C&O-specific European Russia and Asian Russia polygon masks."
  },
  features: continentOrder.map((continentId) => (
    buildOutputFeature(continentId, unionPieces(piecesByContinent[continentId]))
  ))
};

assertValidOutput(output);
await fs.writeFile(outputPath, `${JSON.stringify(output)}\n`);

console.log(`Generated ${path.relative(rootDir, outputPath)} with ${output.features.length} continent features.`);
output.features.forEach((feature) => {
  console.log(`${feature.properties.id}: ${feature.geometry.coordinates.length} polygon part(s)`);
});
