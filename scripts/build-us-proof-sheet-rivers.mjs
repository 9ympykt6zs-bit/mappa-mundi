#!/usr/bin/env node

import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "..");
const sourceDirectory = path.join(repoRoot, "tools", "source-data", "natural-earth", "extracted", "global");
const sourceBaseName = "ne_10m_rivers_lake_centerlines";
const sourceDbfPath = path.join(sourceDirectory, `${sourceBaseName}.dbf`);
const sourceShpPath = path.join(sourceDirectory, `${sourceBaseName}.shp`);
const stLawrenceSourcePath = path.join(repoRoot, "tools", "source-data", "openstreetmap", "st-lawrence-river-main-stream.geojson");
const outputPath = path.join(repoRoot, "assets", "data", "physical-features", "proof-sheet-rivers.geojson");

const naturalEarthSourceUrl = "https://naciscdn.org/naturalearth/10m/physical/ne_10m_rivers_lake_centerlines.zip";
const openStreetMapCopyrightUrl = "https://www.openstreetmap.org/copyright";

const requiredUsRivers = [
  { id: "arkansas-river", label: "Arkansas River", riverNumber: "131", nameField: "name_en", expectedName: "Arkansas", expectedBounds: [-112, 32, -88, 42] },
  {
    id: "colorado-river",
    label: "Colorado River",
    riverNumber: "163",
    nameField: "name_en",
    expectedName: "Colorado",
    includeLakeCenterlines: true,
    expectedBounds: [-116, 30, -104, 42],
    playableExposure: {
      status: "memory-trail",
      reason: "Accepted for this Memory Trail pass. The verified Natural Earth mainstem has a minor Gulf of California endpoint imperfection; do not repair source geometry here."
    }
  },
  {
    id: "columbia-river",
    label: "Columbia River",
    riverNumber: "64",
    nameField: "name_en",
    expectedName: "Columbia",
    includeLakeCenterlines: true,
    expectedBounds: [-126, 44, -110, 53],
    playableExposure: {
      status: "memory-trail",
      reason: "Accepted for this Memory Trail pass using the verified Natural Earth mainstem; dev-preview-only display repairs remain isolated from normal activity geometry."
    }
  },
  {
    id: "mississippi-river",
    label: "Mississippi River",
    riverNumbers: ["3", "156"],
    nameField: "name_en",
    expectedName: "Mississippi",
    includeLakeCenterlines: true,
    expectedBounds: [-97, 28, -89, 50],
    playableExposure: {
      status: "memory-trail",
      reason: "Accepted for this Memory Trail pass. Delta/coastline alignment is imperfect against the simplified app coastline; do not repair source geometry here."
    }
  },
  { id: "missouri-river", label: "Missouri River", riverNumber: "8", nameField: "name_en", expectedName: "Missouri", includeLakeCenterlines: true, expectedBounds: [-114, 35, -88, 51] },
  { id: "ohio-river", label: "Ohio River", riverNumber: "92", nameField: "name_en", expectedName: "Ohio", expectedBounds: [-91, 35, -79, 43] },
  {
    id: "red-river",
    label: "Red River",
    deferredReason: "Natural Earth's record 409 is named Red of the South but its geometry is around 46-50 degrees north; the North America supplement has no verified main-stem Red River of the South feature."
  },
  { id: "rio-grande-river", label: "Rio Grande River", riverNumber: "110", nameField: "name", expectedName: "Rio Grande", includeLakeCenterlines: true, expectedBounds: [-108, 24, -96, 38] },
  {
    id: "st-lawrence-river",
    label: "St. Lawrence River",
    sourceType: "openstreetmap-waterway-relation",
    expectedBounds: [-77, 44, -64, 50],
    requiredCoverage: [
      { label: "Lake Ontario outlet", bounds: [-76.3, 44.1, -75.9, 44.45] },
      { label: "New York–Ontario boundary reach", bounds: [-75.9, 44.35, -74.7, 45.1] },
      { label: "Montreal reach", bounds: [-74.0, 45.25, -73.25, 45.9] },
      { label: "Quebec City reach", bounds: [-71.5, 46.6, -70.9, 47.0] },
      { label: "lower estuary and Gulf transition", bounds: [-67.2, 48.8, -64.0, 50.0] }
    ]
  }
];

main().catch((error) => {
  console.error(error?.stack || error);
  process.exitCode = 1;
});

async function main() {
  const [rows, shapes, stLawrenceSource] = await Promise.all([
    readDbfRows(sourceDbfPath),
    readPolylineShapes(sourceShpPath),
    readJson(stLawrenceSourcePath)
  ]);

  if (rows.length !== shapes.length) {
    throw new Error(`Natural Earth row/shape mismatch: ${rows.length} DBF rows and ${shapes.length} shapes.`);
  }

  const deferredFeatures = requiredUsRivers
    .filter((river) => river.deferredReason)
    .map(({ id, label, deferredReason }) => ({ id, label, reason: deferredReason }));
  const features = requiredUsRivers.filter((river) => !river.deferredReason).map((river) => {
    if (river.sourceType === "openstreetmap-waterway-relation") {
      return buildOpenStreetMapRiverFeature(river, stLawrenceSource);
    }

    const riverNumbers = river.riverNumbers || [river.riverNumber];
    const matches = riverNumbers.flatMap((riverNumber) => {
      const riverMatches = rows
        .map((properties, index) => ({ properties, shape: shapes[index], index }))
        .filter(({ properties }) => (
          properties.rivernum === riverNumber
          && properties.featurecla === "River"
        ));

      if (riverMatches.length !== 1) {
        throw new Error(`${river.label} expected one Natural Earth River record for rivernum ${riverNumber}, found ${riverMatches.length}.`);
      }

      const lakeMatches = river.includeLakeCenterlines
        ? rows
          .map((properties, index) => ({ properties, shape: shapes[index], index }))
          .filter(({ properties }) => (
            properties.rivernum === riverNumber
            && properties.featurecla === "Lake Centerline"
          ))
        : [];

      if (lakeMatches.length > 1) {
        throw new Error(`${river.label} expected at most one Natural Earth Lake Centerline record for rivernum ${riverNumber}, found ${lakeMatches.length}.`);
      }

      return [...riverMatches, ...lakeMatches];
    });

    matches.forEach((match) => {
      const sourceName = match.properties[river.nameField];
      if (sourceName !== river.expectedName) {
        throw new Error(`${river.label} matched ${JSON.stringify(sourceName)} instead of ${JSON.stringify(river.expectedName)}.`);
      }

      if (!match.shape || !hasLineCoordinates(match.shape.coordinates)) {
        throw new Error(`${river.label} has no usable line geometry in Natural Earth.`);
      }
    });

    const geometry = combineLineGeometries(matches.map((match) => match.shape));
    const bounds = getGeometryBounds(geometry.coordinates);
    if (!isWithinExpectedBounds(bounds, river.expectedBounds)) {
      throw new Error(`${river.label} geometry bounds ${formatBounds(bounds)} fall outside its expected U.S. region ${formatBounds(river.expectedBounds)}.`);
    }

    const primaryMatch = matches[0];
    const sourceRecords = createSourceRecords(matches);

    return {
      type: "Feature",
      properties: {
        id: river.id,
        label: river.label,
        name: river.label,
        sourceName: primaryMatch.properties[river.nameField],
        type: "river",
        kind: "river",
        sourceDataset: "Natural Earth 10m Rivers, lake centerlines",
        sourceFile: `${sourceBaseName}.shp`,
        sourceUrl: naturalEarthSourceUrl,
        naturalEarthFeatureClass: primaryMatch.properties.featurecla,
        naturalEarthRiverNumber: Number(primaryMatch.properties.rivernum),
        naturalEarthRiverNumbers: riverNumbers.map(Number),
        naturalEarthId: Number(primaryMatch.properties.ne_id),
        naturalEarthIds: matches.map((match) => Number(match.properties.ne_id)),
        sourceRecords,
        playableExposure: river.playableExposure || { status: "memory-trail", reason: "Verified Natural Earth geometry is accepted for normal Memory Trail use." },
        lineWidthPx: 2,
        highlightWidthPx: 5,
        hitWidthPx: 30
      },
      geometry
    };
  });

  const output = {
    type: "FeatureCollection",
    name: "proof-sheet-rivers",
    sourceStatus: "verified-composite-river-sources",
    sourceDatasets: [
      { name: "Natural Earth 10m Rivers, lake centerlines", url: naturalEarthSourceUrl, license: "Public domain" },
      { name: "OpenStreetMap waterway relations", url: openStreetMapCopyrightUrl, license: "ODbL 1.0" }
    ],
    deferredFeatures,
    features
  };

  await writeFile(outputPath, `${JSON.stringify(output, null, 2)}\n`, "utf8");
  console.log(`Wrote ${features.length} verified U.S. proof-sheet rivers and deferred ${deferredFeatures.length} to ${path.relative(repoRoot, outputPath)}.`);
}

function buildOpenStreetMapRiverFeature(river, source) {
  const sourceFeature = source?.features?.find(({ properties }) => properties?.id === river.id);
  if (!sourceFeature || !hasLineCoordinates(sourceFeature.geometry?.coordinates)) {
    throw new Error(`${river.label} is missing usable checked-in OpenStreetMap main-stream geometry.`);
  }
  if (sourceFeature.properties?.relationId !== source?.source?.relationId) {
    throw new Error(`${river.label} source relation metadata is inconsistent.`);
  }

  const bounds = getGeometryBounds(sourceFeature.geometry.coordinates);
  if (!isWithinExpectedBounds(bounds, river.expectedBounds)) {
    throw new Error(`${river.label} geometry bounds ${formatBounds(bounds)} fall outside ${formatBounds(river.expectedBounds)}.`);
  }
  for (const checkpoint of river.requiredCoverage || []) {
    if (!geometryVisitsBounds(sourceFeature.geometry, checkpoint.bounds)) {
      throw new Error(`${river.label} geometry does not reach the required ${checkpoint.label} coverage window ${formatBounds(checkpoint.bounds)}.`);
    }
  }

  return {
    type: "Feature",
    properties: {
      id: river.id,
      label: river.label,
      name: river.label,
      sourceName: sourceFeature.properties.nameEn,
      type: "river",
      kind: "river",
      sourceDataset: source.source.dataset,
      sourceFile: path.relative(repoRoot, stLawrenceSourcePath),
      sourceUrl: source.source.sourceUrl,
      sourceCopyright: source.source.copyright,
      sourceLicense: source.source.license,
      sourceLicenseUrl: source.source.licenseUrl,
      openStreetMapRelationId: source.source.relationId,
      openStreetMapRelationVersion: source.source.relationVersion,
      openStreetMapRelationTimestamp: source.source.relationTimestamp,
      sourceRecords: [{
        relationId: source.source.relationId,
        relationVersion: source.source.relationVersion,
        sourceName: sourceFeature.properties.nameEn,
        partStart: 0,
        partCount: 1,
        memberWayIds: sourceFeature.properties.memberWayIds,
        sourceNodeCount: sourceFeature.properties.sourceNodeCount,
        simplifiedNodeCount: sourceFeature.properties.simplifiedNodeCount,
        simplificationToleranceDegrees: sourceFeature.properties.simplificationToleranceDegrees,
        bounds
      }],
      playableExposure: {
        status: "memory-trail",
        reason: "The named main-stream relation is accepted for normal Memory Trail and Guided Learning use from the eastern Lake Ontario outlet through the Gulf transition without country clipping."
      },
      lineWidthPx: 2,
      highlightWidthPx: 5,
      hitWidthPx: 30
    },
    geometry: sourceFeature.geometry
  };
}

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, "utf8"));
}

function geometryVisitsBounds(geometry, bounds) {
  const lines = geometry.type === "LineString" ? [geometry.coordinates] : geometry.coordinates;
  return lines.some((line) => line.some(([longitude, latitude]) => (
    longitude >= bounds[0]
    && latitude >= bounds[1]
    && longitude <= bounds[2]
    && latitude <= bounds[3]
  )));
}

async function readDbfRows(filePath) {
  const data = await readFile(filePath);
  const recordCount = data.readUInt32LE(4);
  const headerLength = data.readUInt16LE(8);
  const recordLength = data.readUInt16LE(10);
  const fields = [];

  for (let offset = 32; data[offset] !== 0x0d; offset += 32) {
    fields.push({
      name: data.subarray(offset, offset + 11).toString("ascii").replace(/\0.*$/, "").trim(),
      length: data[offset + 16]
    });
  }

  return Array.from({ length: recordCount }, (_, index) => {
    const row = {};
    let offset = headerLength + index * recordLength + 1;

    fields.forEach((field) => {
      row[field.name] = data.subarray(offset, offset + field.length).toString("utf8").replace(/\0/g, "").trim();
      offset += field.length;
    });

    return row;
  });
}

async function readPolylineShapes(filePath) {
  const data = await readFile(filePath);
  const shapes = [];
  let offset = 100;

  while (offset < data.length) {
    const contentLengthBytes = data.readInt32BE(offset + 4) * 2;
    const contentOffset = offset + 8;
    const shapeType = data.readInt32LE(contentOffset);

    if (shapeType === 0) {
      shapes.push(null);
    } else if ([3, 13, 23].includes(shapeType)) {
      const partCount = data.readInt32LE(contentOffset + 36);
      const pointCount = data.readInt32LE(contentOffset + 40);
      const partsOffset = contentOffset + 44;
      const pointsOffset = partsOffset + partCount * 4;
      const partStarts = Array.from({ length: partCount }, (_, index) => data.readInt32LE(partsOffset + index * 4));
      const points = Array.from({ length: pointCount }, (_, index) => [
        data.readDoubleLE(pointsOffset + index * 16),
        data.readDoubleLE(pointsOffset + index * 16 + 8)
      ]);
      const lines = partStarts.map((start, index) => points.slice(start, partStarts[index + 1] || pointCount));
      shapes.push(lines.length === 1
        ? { type: "LineString", coordinates: lines[0] }
        : { type: "MultiLineString", coordinates: lines });
    } else {
      throw new Error(`Unsupported Natural Earth shape type ${shapeType}.`);
    }

    offset = contentOffset + contentLengthBytes;
  }

  return shapes;
}

function hasLineCoordinates(coordinates) {
  const lines = Array.isArray(coordinates?.[0]?.[0]) ? coordinates : [coordinates];

  return lines.length > 0
    && lines.every((line) => line.length >= 2 && line.every(([lon, lat]) => (
      Number.isFinite(lon)
      && Number.isFinite(lat)
      && lon >= -180
      && lon <= 180
      && lat >= -90
      && lat <= 90
    )));
}

function combineLineGeometries(shapes) {
  const lines = shapes.flatMap((shape) => (
    shape.type === "LineString" ? [shape.coordinates] : shape.coordinates
  ));

  return lines.length === 1
    ? { type: "LineString", coordinates: lines[0] }
    : { type: "MultiLineString", coordinates: lines };
}

function createSourceRecords(matches) {
  let partStart = 0;

  return matches.map((match) => {
    const lines = match.shape.type === "LineString" ? [match.shape.coordinates] : match.shape.coordinates;
    const record = {
      naturalEarthId: Number(match.properties.ne_id),
      naturalEarthRiverNumber: Number(match.properties.rivernum),
      featureClass: match.properties.featurecla,
      sourceName: match.properties.name_en || match.properties.name || "",
      partStart,
      partCount: lines.length,
      bounds: getGeometryBounds(match.shape.coordinates)
    };

    partStart += lines.length;
    return record;
  });
}

function getGeometryBounds(coordinates) {
  const lines = Array.isArray(coordinates?.[0]?.[0]) ? coordinates : [coordinates];
  const points = lines.flat();
  const longitudes = points.map(([lon]) => lon);
  const latitudes = points.map(([, lat]) => lat);

  return [
    Math.min(...longitudes),
    Math.min(...latitudes),
    Math.max(...longitudes),
    Math.max(...latitudes)
  ];
}

function isWithinExpectedBounds(bounds, expectedBounds) {
  return bounds[0] >= expectedBounds[0]
    && bounds[1] >= expectedBounds[1]
    && bounds[2] <= expectedBounds[2]
    && bounds[3] <= expectedBounds[3];
}

function formatBounds(bounds) {
  return `[${bounds.map((value) => Number(value.toFixed(3))).join(", ")}]`;
}
