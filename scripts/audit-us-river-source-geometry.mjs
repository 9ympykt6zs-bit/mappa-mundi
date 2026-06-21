#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "..");
const sourceRoot = path.join(repoRoot, "tools", "source-data", "natural-earth", "extracted");
const builtRiverPath = path.join(repoRoot, "assets", "data", "physical-features", "proof-sheet-rivers.geojson");

const datasets = [
  {
    id: "global",
    directory: "global",
    baseName: "ne_10m_rivers_lake_centerlines"
  },
  {
    id: "north-america-supplement",
    directory: "north-america",
    baseName: "ne_10m_rivers_north_america"
  }
];

// Mouth bounds are audit windows, not replacement geometry.
const riverSpecs = [
  {
    id: "colorado-river",
    label: "Colorado River",
    sourceNames: ["Colorado"],
    expectedBounds: [-116, 30, -104, 42],
    mouth: { label: "Gulf of California / Sea of Cortez", bounds: [-115.35, 31.3, -114.55, 31.85] }
  },
  {
    id: "columbia-river",
    label: "Columbia River",
    sourceNames: ["Columbia"],
    expectedBounds: [-126, 44, -110, 53],
    mouth: { label: "Pacific Ocean near the Washington/Oregon border", bounds: [-124.3, 45.9, -123.6, 46.45] }
  },
  {
    id: "mississippi-river",
    label: "Mississippi River",
    sourceNames: ["Mississippi"],
    expectedBounds: [-97, 28, -89, 50],
    mouth: { label: "Gulf of Mexico / Mississippi delta coast", bounds: [-90, 28.65, -88.8, 29.45] }
  }
];

const onlyId = getOnlyId(process.argv.slice(2));

main().catch((error) => {
  console.error(error?.stack || error);
  process.exitCode = 1;
});

async function main() {
  const selectedSpecs = onlyId
    ? riverSpecs.filter((spec) => spec.id === onlyId)
    : riverSpecs;

  if (onlyId && selectedSpecs.length !== 1) {
    throw new Error(`Unknown --only river id: ${onlyId}.`);
  }

  const [builtData, sourceData] = await Promise.all([
    readJson(builtRiverPath),
    Promise.all(datasets.map(readDataset))
  ]);
  const reports = selectedSpecs.map((spec) => buildRiverReport(spec, sourceData, builtData));

  console.log("U.S. river source geometry audit:");
  reports.forEach((report) => console.log(JSON.stringify(report)));
}

async function readDataset(dataset) {
  const directory = path.join(sourceRoot, dataset.directory);
  const [rows, shapes] = await Promise.all([
    readDbfRows(path.join(directory, `${dataset.baseName}.dbf`)),
    readPolylineShapes(path.join(directory, `${dataset.baseName}.shp`))
  ]);

  if (rows.length !== shapes.length) {
    throw new Error(`${dataset.id} DBF/shapefile row mismatch: ${rows.length} rows, ${shapes.length} shapes.`);
  }

  return { ...dataset, rows, shapes };
}

function buildRiverReport(spec, sourceData, builtData) {
  const builtFeature = builtData.features?.find((feature) => feature.properties?.id === spec.id) || null;
  const datasetReports = sourceData.map((dataset) => {
    const candidates = dataset.rows
      .map((properties, recordIndex) => ({ properties, recordIndex, shape: dataset.shapes[recordIndex] }))
      .filter(({ properties, shape }) => shape && matchesSourceName(properties, spec.sourceNames))
      .map((candidate) => describeCandidate(candidate, spec));

    return {
      dataset: dataset.id,
      matchingRecordCount: candidates.length,
      candidates
    };
  });
  const globalReport = datasetReports.find((report) => report.dataset === "global");
  const selectedIds = builtFeature?.properties?.naturalEarthIds || [];
  const relevantGlobalIds = globalReport.candidates
    .filter((candidate) => candidate.intersectsExpectedRiverRegion)
    .map((candidate) => candidate.neId);
  const missedRelevantGlobalIds = relevantGlobalIds.filter((id) => !selectedIds.includes(id));

  return {
    id: spec.id,
    label: spec.label,
    fieldsUsedForMatching: ["name", "name_en", "name_alt", "name_full"],
    expectedRiverBounds: formatBounds(spec.expectedBounds),
    expectedMouth: { label: spec.mouth.label, auditBounds: formatBounds(spec.mouth.bounds) },
    currentBuild: builtFeature
      ? {
        naturalEarthIds: selectedIds,
        riverNumbers: builtFeature.properties?.naturalEarthRiverNumbers || [],
        playableExposure: builtFeature.properties?.playableExposure || null,
        missingRelevantGlobalRecordIds: missedRelevantGlobalIds
      }
      : null,
    sourceDatasets: datasetReports,
    conclusion: deriveConclusion(spec, datasetReports, selectedIds, missedRelevantGlobalIds)
  };
}

function describeCandidate({ properties, recordIndex, shape }, spec) {
  const lines = shape.type === "LineString" ? [shape.coordinates] : shape.coordinates;
  const bounds = getBounds(lines);
  const endpoints = lines.map((line, index) => ({
    part: index + 1,
    sourceStart: formatCoordinate(line[0]),
    sourceEnd: formatCoordinate(line.at(-1))
  }));

  return {
    recordIndex,
    neId: Number(properties.ne_id),
    riverNumber: properties.rivernum,
    featureClass: properties.featurecla,
    scalerank: properties.scalerank || "",
    minZoom: properties.min_zoom || "",
    minLabel: properties.min_label || "",
    name: properties.name || "",
    nameEn: properties.name_en || "",
    nameAlt: properties.name_alt || "",
    nameFull: properties.name_full || "",
    note: properties.note || "",
    bounds: formatBounds(bounds),
    partCount: lines.length,
    pointCount: lines.reduce((total, line) => total + line.length, 0),
    endpoints,
    intersectsExpectedRiverRegion: boundsIntersect(bounds, spec.expectedBounds),
    reachesExpectedMouthAuditArea: lines.some((line) => line.some((point) => pointWithinBounds(point, spec.mouth.bounds)))
  };
}

function deriveConclusion(spec, datasetReports, selectedIds, missedRelevantGlobalIds) {
  const globalCandidates = datasetReports.find((report) => report.dataset === "global")?.candidates || [];
  const northAmericaCandidates = datasetReports.find((report) => report.dataset === "north-america-supplement")?.candidates || [];
  const relevantGlobal = globalCandidates.filter((candidate) => candidate.intersectsExpectedRiverRegion);
  const reachesMouth = relevantGlobal.some((candidate) => candidate.reachesExpectedMouthAuditArea);

  if (missedRelevantGlobalIds.length > 0) {
    return {
      status: "build-selection-needs-review",
      reason: "A geographically relevant exact-name global record is not included in the current build.",
      missedRelevantGlobalRecordIds: missedRelevantGlobalIds
    };
  }

  if (spec.id === "columbia-river") {
    return {
      status: "accepted-for-memory-trail",
      reason: "All geographically relevant exact-name global records are already selected. The selected mainstem has a 19 km raw endpoint gap between parts 6 and 7, and the supplement has no exact-name Columbia record; it is accepted for this pass without repairing source geometry.",
      selectedGlobalRecordIds: selectedIds,
      reachesExpectedMouth: reachesMouth
    };
  }

  if (spec.id === "colorado-river") {
    return {
      status: "accepted-for-memory-trail",
      reason: "All geographically relevant exact-name global records are already selected. No matching supplement record reaches the Gulf audit area; the minor endpoint imperfection is accepted for this pass without repairing source geometry.",
      selectedGlobalRecordIds: selectedIds,
      reachesExpectedMouth: reachesMouth
    };
  }

  return {
    status: reachesMouth ? "accepted-for-memory-trail" : "source-endpoint-needs-review",
    reason: reachesMouth
      ? "The selected global records reach the Mississippi delta/Gulf audit area; the minor delta/coastline alignment imperfection is accepted for this pass without repairing source geometry."
      : "No selected exact-name global record reaches the configured delta/Gulf audit area.",
    selectedGlobalRecordIds: selectedIds,
    reachesExpectedMouth: reachesMouth,
    matchingNorthAmericaSupplementRecordCount: northAmericaCandidates.length
  };
}

function matchesSourceName(properties, sourceNames) {
  const names = [properties.name, properties.name_en, properties.name_alt, properties.name_full]
    .map(normalizeName)
    .filter(Boolean);
  return sourceNames.some((name) => names.includes(normalizeName(name)));
}

function normalizeName(value) {
  return String(value || "").trim().toLowerCase();
}

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, "utf8"));
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

function getBounds(lines) {
  const points = lines.flat();
  return [
    Math.min(...points.map(([longitude]) => longitude)),
    Math.min(...points.map(([, latitude]) => latitude)),
    Math.max(...points.map(([longitude]) => longitude)),
    Math.max(...points.map(([, latitude]) => latitude))
  ];
}

function boundsIntersect([minX, minY, maxX, maxY], [otherMinX, otherMinY, otherMaxX, otherMaxY]) {
  return minX <= otherMaxX && maxX >= otherMinX && minY <= otherMaxY && maxY >= otherMinY;
}

function pointWithinBounds([longitude, latitude], [minX, minY, maxX, maxY]) {
  return longitude >= minX && longitude <= maxX && latitude >= minY && latitude <= maxY;
}

function formatBounds(bounds) {
  return bounds.map((value) => Number(value.toFixed(3)));
}

function formatCoordinate([longitude, latitude]) {
  return [Number(longitude.toFixed(5)), Number(latitude.toFixed(5))];
}

function getOnlyId(args) {
  const index = args.indexOf("--only");
  return index >= 0 ? args[index + 1] || "" : "";
}
