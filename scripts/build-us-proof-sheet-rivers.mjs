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
const outputPath = path.join(repoRoot, "assets", "data", "physical-features", "proof-sheet-rivers.geojson");

const naturalEarthSourceUrl = "https://naciscdn.org/naturalearth/10m/physical/ne_10m_rivers_lake_centerlines.zip";

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
  { id: "st-lawrence-river", label: "St. Lawrence River", riverNumber: "23", nameField: "name_en", expectedName: "St. Lawrence", expectedBounds: [-85, 42, -64, 48] }
];

main().catch((error) => {
  console.error(error?.stack || error);
  process.exitCode = 1;
});

async function main() {
  const [rows, shapes] = await Promise.all([
    readDbfRows(sourceDbfPath),
    readPolylineShapes(sourceShpPath)
  ]);

  if (rows.length !== shapes.length) {
    throw new Error(`Natural Earth row/shape mismatch: ${rows.length} DBF rows and ${shapes.length} shapes.`);
  }

  const deferredFeatures = requiredUsRivers
    .filter((river) => river.deferredReason)
    .map(({ id, label, deferredReason }) => ({ id, label, reason: deferredReason }));
  const features = requiredUsRivers.filter((river) => !river.deferredReason).map((river) => {
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
    sourceStatus: "verified-natural-earth-10m",
    sourceDataset: "Natural Earth 10m Rivers, lake centerlines",
    sourceUrl: naturalEarthSourceUrl,
    deferredFeatures,
    features
  };

  await writeFile(outputPath, `${JSON.stringify(output, null, 2)}\n`, "utf8");
  console.log(`Wrote ${features.length} verified U.S. proof-sheet rivers and deferred ${deferredFeatures.length} to ${path.relative(repoRoot, outputPath)}.`);
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
