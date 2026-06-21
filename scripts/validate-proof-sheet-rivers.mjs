#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "..");
const riverDataPath = path.join(repoRoot, "assets", "data", "physical-features", "proof-sheet-rivers.geojson");

const requiredUsRivers = [
  { id: "arkansas-river", label: "Arkansas River", riverNumber: 131, sourceIds: [1159112219], expectedBounds: [-112, 32, -88, 42], playableExposure: "memory-trail" },
  {
    id: "colorado-river",
    label: "Colorado River",
    riverNumber: 163,
    sourceIds: [1159112855, 1159112837],
    expectedBounds: [-116, 30, -104, 42],
    downstreamMouthAudit: {
      target: "Gulf of California / Sea of Cortez",
      sourceRecordId: 1159112855,
      sourcePart: 7,
      sourceEndpoint: "-115.035, 31.966",
      conclusion: "No additional verified Colorado main-stem or mouth segment was found in the local Natural Earth global or North America datasets."
    },
    playableExposure: "memory-trail"
  },
  {
    id: "columbia-river",
    label: "Columbia River",
    riverNumber: 64,
    sourceIds: [1159124377, 1159124363],
    expectedBounds: [-126, 44, -110, 53],
    downstreamMouthAudit: {
      target: "Pacific Ocean near the Washington/Oregon border",
      sourceRecordId: 1159124377,
      sourcePart: 8,
      sourceEndpoint: "-123.180, 46.179",
      conclusion: "No additional verified Columbia main-stem or estuary segment was found in the local Natural Earth global or North America datasets."
    },
    playableExposure: "memory-trail"
  },
  { id: "mississippi-river", label: "Mississippi River", riverNumbers: [3, 156], sourceIds: [1159119147, 1159112621, 1159112609], expectedBounds: [-97, 28, -89, 50], playableExposure: "memory-trail" },
  { id: "missouri-river", label: "Missouri River", riverNumber: 8, sourceIds: [1159128481, 1159128475], expectedBounds: [-114, 35, -88, 51], playableExposure: "memory-trail" },
  { id: "ohio-river", label: "Ohio River", riverNumber: 92, sourceIds: [1159128673], expectedBounds: [-91, 35, -79, 43], playableExposure: "memory-trail" },
  {
    id: "red-river",
    label: "Red River",
    deferredReason: "Natural Earth's available Red of the South record does not match the requested southern U.S. river geometry."
  },
  { id: "rio-grande-river", label: "Rio Grande River", riverNumber: 110, sourceIds: [1159111317, 1159111297], expectedBounds: [-108, 24, -96, 38], playableExposure: "memory-trail" },
  { id: "st-lawrence-river", label: "St. Lawrence River", riverNumber: 23, sourceIds: [1159114637], expectedBounds: [-85, 42, -64, 48], playableExposure: "memory-trail" }
];

main().catch((error) => {
  console.error(error?.stack || error);
  process.exitCode = 1;
});

async function main() {
  const source = JSON.parse(await readFile(riverDataPath, "utf8"));
  const errors = validateRiverSource(source);

  if (errors.length > 0) {
    errors.forEach((error) => console.error(`River validation failed: ${error}`));
    process.exitCode = 1;
    return;
  }

  const implementedCount = requiredUsRivers.filter((river) => !river.deferredReason).length;
  const deferredCount = requiredUsRivers.length - implementedCount;
  console.log(`Validated ${implementedCount} verified U.S. proof-sheet river features with ${deferredCount} documented deferral.`);

  const continuityAudit = source.features.map((feature) => getContinuityAudit(feature));
  console.log("River continuity audit:");
  continuityAudit.forEach((audit) => {
    console.log(JSON.stringify(audit));
  });

  const downstreamMouthAudits = requiredUsRivers
    .filter((river) => river.downstreamMouthAudit)
    .map(({ id, label, downstreamMouthAudit }) => ({ id, label, ...downstreamMouthAudit }));
  console.log("River downstream-mouth audit:");
  downstreamMouthAudits.forEach((audit) => {
    console.log(JSON.stringify(audit));
  });

  console.log("River endpoint exposure audit:");
  requiredUsRivers
    .filter((river) => !river.deferredReason)
    .map((river) => getEndpointExposureAudit(source.features.find((feature) => feature.properties?.id === river.id), river))
    .forEach((audit) => console.log(JSON.stringify(audit)));
}

function validateRiverSource(source) {
  const errors = [];

  if (source?.type !== "FeatureCollection") {
    return ["source must be a GeoJSON FeatureCollection"];
  }

  if (!Array.isArray(source.features) || source.features.length === 0) {
    return ["source must contain verified non-empty river features"];
  }

  const featuresById = new Map();

  source.features.forEach((feature, index) => {
    const properties = feature?.properties || {};
    const id = String(properties.id || "").trim();
    const label = String(properties.label || "").trim();

    if (!id) {
      errors.push(`feature ${index + 1} is missing properties.id`);
      return;
    }

    if (featuresById.has(id)) {
      errors.push(`${id} appears more than once; combine intentional multipart geometry into one feature`);
      return;
    }

    featuresById.set(id, feature);

    if (!label) {
      errors.push(`${id} is missing properties.label`);
    }

    if (properties.type !== "river" || properties.kind !== "river") {
      errors.push(`${id} must declare properties.type and properties.kind as river`);
    }

    if (!hasValidRiverGeometry(feature.geometry)) {
      errors.push(`${id} must have non-empty LineString or MultiLineString geometry`);
    }
  });

  requiredUsRivers.filter((river) => !river.deferredReason).forEach(({ id, label, riverNumber, riverNumbers, sourceIds, expectedBounds, playableExposure }) => {
    const feature = featuresById.get(id);

    if (!feature) {
      errors.push(`missing required U.S. river ${label}`);
      return;
    }

    if (feature.properties?.label !== label) {
      errors.push(`${id} must use the exact label ${label}`);
    }

    if (feature.properties?.naturalEarthFeatureClass !== "River") {
      errors.push(`${id} must be sourced from a Natural Earth River record`);
    }

    const expectedRiverNumbers = riverNumbers || [riverNumber];
    const sourceRiverNumbers = feature.properties?.naturalEarthRiverNumbers || [feature.properties?.naturalEarthRiverNumber];
    if (JSON.stringify(sourceRiverNumbers) !== JSON.stringify(expectedRiverNumbers)) {
      errors.push(`${id} must use Natural Earth rivernum ${expectedRiverNumbers.join(", ")}`);
    }

    if (JSON.stringify(feature.properties?.naturalEarthIds) !== JSON.stringify(sourceIds)) {
      errors.push(`${id} must use the verified Natural Earth source ids ${sourceIds.join(", ")}`);
    }

    if (!Array.isArray(feature.properties?.sourceRecords) || feature.properties.sourceRecords.length !== sourceIds.length) {
      errors.push(`${id} must include provenance for every verified source record`);
    }

    if (playableExposure && feature.properties?.playableExposure?.status !== playableExposure) {
      errors.push(`${id} must declare playableExposure.status as ${playableExposure}`);
    }

    const bounds = getGeometryBounds(feature.geometry);
    if (!isWithinExpectedBounds(bounds, expectedBounds)) {
      errors.push(`${id} has geographically suspicious bounds ${formatBounds(bounds)} outside ${formatBounds(expectedBounds)}`);
    }
  });

  requiredUsRivers.filter((river) => river.deferredReason).forEach(({ id, label }) => {
    if (featuresById.has(id)) {
      errors.push(`${label} is marked deferred and must not be exposed as a playable feature`);
    }

    const documented = source.deferredFeatures?.find((feature) => feature?.id === id && feature?.label === label);
    if (!documented?.reason) {
      errors.push(`${label} is deferred but missing a documented source-data reason`);
    }
  });

  return errors;
}

function hasValidRiverGeometry(geometry) {
  if (!geometry || !["LineString", "MultiLineString"].includes(geometry.type)) {
    return false;
  }

  const lines = geometry.type === "LineString" ? [geometry.coordinates] : geometry.coordinates;

  return Array.isArray(lines)
    && lines.length > 0
    && lines.every((line) => (
      Array.isArray(line)
      && line.length >= 2
      && line.every((coordinate) => (
        Array.isArray(coordinate)
        && coordinate.length >= 2
        && Number.isFinite(coordinate[0])
        && Number.isFinite(coordinate[1])
        && coordinate[0] >= -180
        && coordinate[0] <= 180
        && coordinate[1] >= -90
        && coordinate[1] <= 90
      ))
    ));
}

function getGeometryBounds(geometry) {
  const lines = geometry.type === "LineString" ? [geometry.coordinates] : geometry.coordinates;
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

function getContinuityAudit(feature, thresholdKm = 60) {
  const lines = feature.geometry?.type === "LineString" ? [feature.geometry.coordinates] : feature.geometry?.coordinates || [];
  const bounds = getGeometryBounds(feature.geometry);
  const sourceRecords = feature.properties?.sourceRecords || [];
  const components = getConnectedPartComponents(lines);
  const endpoints = lines.flatMap((line, partIndex) => [
    { point: line[0], partIndex, endpoint: "start" },
    { point: line.at(-1), partIndex, endpoint: "end" }
  ]);
  const unresolvedInteriorGaps = [];
  const terminalCandidates = [];

  endpoints.forEach((endpoint) => {
    const nearest = endpoints
      .filter((candidate) => candidate.partIndex !== endpoint.partIndex)
      .reduce((best, candidate) => {
        const distanceKm = getHaversineDistanceKm(endpoint.point, candidate.point);
        return !best || distanceKm < best.distanceKm ? { ...candidate, distanceKm } : best;
      }, null);

    if (!nearest || nearest.distanceKm <= thresholdKm) {
      return;
    }

    if (isLikelyTerminalEndpoint(endpoint.point, bounds)) {
      terminalCandidates.push({
        part: endpoint.partIndex + 1,
        endpoint: endpoint.endpoint,
        coordinate: formatCoordinate(endpoint.point),
        reason: "At the outer extent of this verified target geometry; may be a source, ocean outlet, lake boundary, or confluence."
      });
      return;
    }

    const sourceRecord = findSourceRecordForPart(sourceRecords, endpoint.partIndex);
    const nearestRecord = findSourceRecordForPart(sourceRecords, nearest.partIndex);
    const touchesLakeCenterline = [sourceRecord, nearestRecord].some((record) => record?.featureClass === "Lake Centerline");
    unresolvedInteriorGaps.push({
      from: { part: endpoint.partIndex + 1, endpoint: endpoint.endpoint, coordinate: formatCoordinate(endpoint.point) },
      to: { part: nearest.partIndex + 1, endpoint: nearest.endpoint, coordinate: formatCoordinate(nearest.point) },
      distanceKm: Number(nearest.distanceKm.toFixed(1)),
      explanation: touchesLakeCenterline
        ? "A Natural Earth lake-centerline record is adjacent, but the verified source still does not bridge this interval."
        : "No verified matching connector was found in the selected global or North America source records."
    });
  });

  return {
    id: feature.properties?.id || "",
    label: feature.properties?.label || "",
    sourceRecords: sourceRecords.map((record) => ({
      naturalEarthId: record.naturalEarthId,
      riverNumber: record.naturalEarthRiverNumber,
      featureClass: record.featureClass,
      partCount: record.partCount
    })),
    partCount: lines.length,
    partEndpoints: lines.map((line, partIndex) => {
      const sourceRecord = findSourceRecordForPart(sourceRecords, partIndex);
      return {
        part: partIndex + 1,
        sourceRecordId: sourceRecord?.naturalEarthId || null,
        featureClass: sourceRecord?.featureClass || "",
        start: formatCoordinate(line[0]),
        end: formatCoordinate(line.at(-1))
      };
    }),
    connectedComponentCount: components.length,
    detachedComponents: getDetachedComponentAudit(components, lines, sourceRecords),
    unresolvedInteriorGaps,
    terminalCandidates
  };
}

function getEndpointExposureAudit(feature, definition) {
  const lines = feature.geometry?.type === "LineString" ? [feature.geometry.coordinates] : feature.geometry?.coordinates || [];
  const endpoint = (part, side) => {
    const line = lines[part - 1];
    return side === "start" ? line?.[0] || null : line?.at(-1) || null;
  };
  const audit = {
    id: definition.id,
    label: definition.label,
    playableExposure: feature.properties?.playableExposure || null,
    flags: []
  };

  if (definition.id === "colorado-river") {
    audit.flags.push({
      type: "downstream-endpoint-before-gulf",
      target: "Gulf of California / Sea of Cortez",
      endpoint: formatCoordinate(endpoint(7, "start")),
      conclusion: "No verified Natural Earth downstream mouth record is available locally."
    });
  }

  if (definition.id === "columbia-river") {
    const from = endpoint(6, "end");
    const to = endpoint(7, "start");
    audit.flags.push({
      type: "suspicious-mainstem-gap",
      from: { part: 6, endpoint: "end", coordinate: formatCoordinate(from) },
      to: { part: 7, endpoint: "start", coordinate: formatCoordinate(to) },
      distanceKm: Number(getHaversineDistanceKm(from, to).toFixed(1)),
      conclusion: "No verified Natural Earth mainstem or lake-centerline connector is available locally."
    });
    audit.flags.push({
      type: "downstream-endpoint-before-pacific",
      target: "Pacific Ocean near the Washington/Oregon border",
      endpoint: formatCoordinate(endpoint(8, "start")),
      conclusion: "No verified Natural Earth estuary or mouth record is available locally."
    });
  }

  if (definition.id === "mississippi-river") {
    audit.flags.push({
      type: "delta-outlet-beyond-simplified-coastline",
      endpoint: formatCoordinate(endpoint(4, "end")),
      conclusion: "Retained: this is a verified Natural Earth Mississippi delta outlet branch, not an invented ocean extension."
    });
  }

  return audit;
}

function getConnectedPartComponents(lines, connectionThresholdKm = 20) {
  const parents = lines.map((_, index) => index);
  const find = (index) => {
    while (parents[index] !== index) {
      parents[index] = parents[parents[index]];
      index = parents[index];
    }
    return index;
  };
  const union = (left, right) => {
    const leftRoot = find(left);
    const rightRoot = find(right);
    if (leftRoot !== rightRoot) {
      parents[rightRoot] = leftRoot;
    }
  };

  lines.forEach((line, index) => {
    lines.slice(index + 1).forEach((otherLine, offset) => {
      const otherIndex = index + offset + 1;
      const closestDistance = Math.min(
        ...[line[0], line.at(-1)].flatMap((endpoint) => (
          [otherLine[0], otherLine.at(-1)].map((otherEndpoint) => getHaversineDistanceKm(endpoint, otherEndpoint))
        ))
      );

      if (closestDistance <= connectionThresholdKm) {
        union(index, otherIndex);
      }
    });
  });

  const components = new Map();
  lines.forEach((_, index) => {
    const root = find(index);
    const component = components.get(root) || [];
    component.push(index);
    components.set(root, component);
  });

  return Array.from(components.values());
}

function getDetachedComponentAudit(components, lines, sourceRecords) {
  if (components.length <= 1) {
    return [];
  }

  return components.map((component) => {
    const componentEndpoints = component.flatMap((partIndex) => [
      { point: lines[partIndex][0], partIndex },
      { point: lines[partIndex].at(-1), partIndex }
    ]);
    const otherEndpoints = components
      .filter((otherComponent) => otherComponent !== component)
      .flatMap((otherComponent) => otherComponent.flatMap((partIndex) => [
        { point: lines[partIndex][0], partIndex },
        { point: lines[partIndex].at(-1), partIndex }
      ]));
    const nearest = componentEndpoints.flatMap((endpoint) => (
      otherEndpoints.map((otherEndpoint) => ({
        from: endpoint,
        to: otherEndpoint,
        distanceKm: getHaversineDistanceKm(endpoint.point, otherEndpoint.point)
      }))
    )).sort((left, right) => left.distanceKm - right.distanceKm)[0];
    const partRecords = component
      .map((partIndex) => findSourceRecordForPart(sourceRecords, partIndex))
      .filter(Boolean);
    const hasLakeCenterline = partRecords.some((record) => record.featureClass === "Lake Centerline");

    return {
      parts: component.map((partIndex) => partIndex + 1),
      nearestOtherComponentGapKm: Number(nearest.distanceKm.toFixed(1)),
      explanation: hasLakeCenterline
        ? "Detached component includes a verified Natural Earth lake-centerline; no additional matching connector was found."
        : "Detached verified source component; no additional matching connector was found in the global or North America datasets."
    };
  });
}

function findSourceRecordForPart(sourceRecords, partIndex) {
  return sourceRecords.find((record) => (
    partIndex >= record.partStart && partIndex < record.partStart + record.partCount
  )) || null;
}

function isLikelyTerminalEndpoint([longitude, latitude], [minLongitude, minLatitude, maxLongitude, maxLatitude]) {
  const longitudeMargin = Math.max(0.1, (maxLongitude - minLongitude) * 0.02);
  const latitudeMargin = Math.max(0.1, (maxLatitude - minLatitude) * 0.02);

  return Math.abs(longitude - minLongitude) <= longitudeMargin
    || Math.abs(longitude - maxLongitude) <= longitudeMargin
    || Math.abs(latitude - minLatitude) <= latitudeMargin
    || Math.abs(latitude - maxLatitude) <= latitudeMargin;
}

function getHaversineDistanceKm([longitudeA, latitudeA], [longitudeB, latitudeB]) {
  const radians = Math.PI / 180;
  const latitudeDelta = (latitudeB - latitudeA) * radians;
  const longitudeDelta = (longitudeB - longitudeA) * radians;
  const latitudeARadians = latitudeA * radians;
  const latitudeBRadians = latitudeB * radians;
  const a = Math.sin(latitudeDelta / 2) ** 2
    + Math.cos(latitudeARadians) * Math.cos(latitudeBRadians) * Math.sin(longitudeDelta / 2) ** 2;

  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatCoordinate([longitude, latitude]) {
  return `${longitude.toFixed(3)}, ${latitude.toFixed(3)}`;
}
