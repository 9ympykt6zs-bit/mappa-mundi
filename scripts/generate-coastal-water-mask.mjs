import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import polygonClipping from "polygon-clipping";

const sourceUrl = "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_ocean.geojson";
// Keep individual fills bounded. The Natural Earth ocean source has one
// near-global polygon with thousands of land holes, which is unsafe for a
// single MapLibre fill tessellation at broad zoom levels.
const tileWidthDegrees = 45;
const tileHeightDegrees = 30;
const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const outputPath = path.resolve(scriptDirectory, "../assets/maps/data/coastal-water-mask.geojson");

const sourceArgumentIndex = process.argv.indexOf("--source");
const outputArgumentIndex = process.argv.indexOf("--out");
const requestedSource = sourceArgumentIndex >= 0 ? process.argv[sourceArgumentIndex + 1] : sourceUrl;
const requestedOutput = outputArgumentIndex >= 0 ? process.argv[outputArgumentIndex + 1] : outputPath;

const source = await loadGeoJson(requestedSource);
const beforeValidation = validateFeatureCollection(source);
const beforeCoordinates = countCoordinates(source);
const tiledMask = createTiledCoastalWaterMask(source);
const afterValidation = validateFeatureCollection(tiledMask);
const afterCoordinates = countCoordinates(tiledMask);
if (afterValidation.invalidGeometryCount > 0) {
  throw new Error(`Generated coastal water mask contains ${afterValidation.invalidGeometryCount} invalid polygon(s).`);
}

const output = {
  ...tiledMask,
  properties: {
    source: requestedSource,
    license: "Natural Earth public domain",
    generatedBy: "scripts/generate-coastal-water-mask.mjs",
    tiling: {
      widthDegrees: tileWidthDegrees,
      heightDegrees: tileHeightDegrees,
      topologyPreserving: true
    }
  }
};
const serialized = `${JSON.stringify(output)}\n`;

fs.mkdirSync(path.dirname(requestedOutput), { recursive: true });
fs.writeFileSync(requestedOutput, serialized, "utf8");

console.log("Generated coastal water mask:", JSON.stringify({
  source: requestedSource,
  output: path.relative(process.cwd(), requestedOutput),
  beforeFeatureCount: source.features?.length || 0,
  afterFeatureCount: output.features?.length || 0,
  beforeCoordinateCount: beforeCoordinates,
  afterCoordinateCount: afterCoordinates,
  invalidGeometryCountBeforeRepair: beforeValidation.invalidGeometryCount,
  invalidGeometryCountAfterRepair: afterValidation.invalidGeometryCount,
  maxFeatureCoordinateCount: afterValidation.maxFeatureCoordinateCount,
  tileWidthDegrees,
  tileHeightDegrees,
  outputBytes: Buffer.byteLength(serialized)
}));

async function loadGeoJson(sourcePathOrUrl) {
  if (/^https?:\/\//i.test(sourcePathOrUrl)) {
    const response = await fetch(sourcePathOrUrl);
    if (!response.ok) {
      throw new Error(`Could not fetch coastal water source: ${response.status} ${response.statusText}`);
    }
    return response.json();
  }

  return JSON.parse(fs.readFileSync(path.resolve(process.cwd(), sourcePathOrUrl), "utf8").replace(/^\uFEFF/, ""));
}

function createTiledCoastalWaterMask(source) {
  const features = [];
  const oceanMultiPolygons = (source.features || [])
    .map((feature) => toMultiPolygon(feature.geometry))
    .filter(Boolean);

  for (let south = -90, row = 0; south < 90; south += tileHeightDegrees, row += 1) {
    const north = Math.min(90, south + tileHeightDegrees);
    for (let west = -180, column = 0; west < 180; west += tileWidthDegrees, column += 1) {
      const east = Math.min(180, west + tileWidthDegrees);
      const clipTile = [[[
        [west, south],
        [east, south],
        [east, north],
        [west, north],
        [west, south]
      ]]];
      const clipped = oceanMultiPolygons.flatMap((multiPolygon) => polygonClipping.intersection(multiPolygon, clipTile));

      clipped.forEach((polygon, part) => {
        const normalized = normalizePolygon(polygon);
        if (!normalized) {
          return;
        }
        features.push({
          type: "Feature",
          properties: {
            displayOnly: true,
            tileColumn: column,
            tileRow: row,
            tilePart: part
          },
          geometry: {
            type: "Polygon",
            coordinates: normalized
          }
        });
      });
    }
  }

  return { type: "FeatureCollection", features };
}

function toMultiPolygon(geometry) {
  if (!geometry) {
    return null;
  }
  if (geometry.type === "Polygon") {
    return [geometry.coordinates];
  }
  return geometry.type === "MultiPolygon" ? geometry.coordinates : null;
}

function normalizePolygon(polygon) {
  const rings = (polygon || []).map((ring, index) => normalizeRing(ring, index === 0)).filter(Boolean);
  return rings.length > 0 ? rings : null;
}

function normalizeRing(ring, isExterior) {
  const coordinates = (ring || [])
    .filter(isCoordinate)
    .map(([longitude, latitude]) => [longitude, latitude]);
  if (coordinates.length < 4) {
    return null;
  }
  if (!samePoint(coordinates[0], coordinates.at(-1))) {
    coordinates.push([...coordinates[0]]);
  }
  if (coordinates.length < 4 || Math.abs(signedArea(coordinates)) < 1e-12) {
    return null;
  }

  const isCounterClockwise = signedArea(coordinates) > 0;
  if (isExterior !== isCounterClockwise) {
    coordinates.reverse();
  }
  return coordinates;
}

function validateFeatureCollection(featureCollection) {
  let invalidGeometryCount = 0;
  let maxFeatureCoordinateCount = 0;
  (featureCollection.features || []).forEach((feature) => {
    const polygonCount = validateGeometry(feature.geometry);
    invalidGeometryCount += polygonCount.invalid;
    maxFeatureCoordinateCount = Math.max(maxFeatureCoordinateCount, polygonCount.coordinates);
  });
  return { invalidGeometryCount, maxFeatureCoordinateCount };
}

function validateGeometry(geometry) {
  const polygons = geometry?.type === "Polygon"
    ? [geometry.coordinates]
    : geometry?.type === "MultiPolygon"
      ? geometry.coordinates
      : [];
  let invalid = geometry && polygons.length === 0 ? 1 : 0;
  let coordinates = 0;
  polygons.forEach((polygon) => {
    const isValidPolygon = polygon.length > 0 && polygon.every((ring) => isValidRing(ring));
    invalid += isValidPolygon ? 0 : 1;
    coordinates += countCoordinates(polygon);
  });
  return { invalid, coordinates };
}

function isValidRing(ring) {
  return Array.isArray(ring)
    && ring.length >= 4
    && samePoint(ring[0], ring.at(-1))
    && ring.every((coordinate) => isCoordinate(coordinate) && coordinate[0] >= -180 && coordinate[0] <= 180 && coordinate[1] >= -90 && coordinate[1] <= 90)
    && Math.abs(signedArea(ring)) >= 1e-12;
}

function signedArea(ring) {
  return ring.slice(1).reduce((area, [longitude, latitude], index) => {
    const [previousLongitude, previousLatitude] = ring[index];
    return area + ((previousLongitude * latitude) - (longitude * previousLatitude));
  }, 0) / 2;
}

function countCoordinates(value) {
  if (!value) {
    return 0;
  }
  if (Array.isArray(value)) {
    return value.length > 0 && typeof value[0] === "number"
      ? 1
      : value.reduce((sum, entry) => sum + countCoordinates(entry), 0);
  }
  if (value.type === "FeatureCollection") {
    return countCoordinates(value.features || []);
  }
  if (value.type === "Feature") {
    return countCoordinates(value.geometry);
  }
  return countCoordinates(value.coordinates || value.geometries || []);
}

function isCoordinate(value) {
  return Array.isArray(value) && Number.isFinite(value[0]) && Number.isFinite(value[1]);
}

function samePoint(left, right) {
  return left?.[0] === right?.[0] && left?.[1] === right?.[1];
}
