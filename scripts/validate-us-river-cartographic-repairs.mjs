#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "..");
const repairPath = path.join(repoRoot, "assets", "data", "physical-features", "us-river-cartographic-repairs.json");

const expectedRepairs = [
  { id: "colorado-river-gulf-extension", riverId: "colorado-river", repairType: "endpoint-extension" },
  { id: "columbia-river-mainstem-gap-bridge", riverId: "columbia-river", repairType: "gap-bridge" },
  { id: "columbia-river-pacific-extension", riverId: "columbia-river", repairType: "endpoint-extension" },
  { id: "mississippi-river-delta-trim", riverId: "mississippi-river", repairType: "endpoint-trim" }
];

main().catch((error) => {
  console.error(error?.stack || error);
  process.exitCode = 1;
});

async function main() {
  const source = JSON.parse(await readFile(repairPath, "utf8"));
  const errors = [];

  if (source.scope !== "dev-preview-only") {
    errors.push("repair source must be scoped to dev-preview-only");
  }

  const repairs = Array.isArray(source.repairs) ? source.repairs : [];
  const byId = new Map();
  repairs.forEach((repair) => {
    if (!repair?.id || byId.has(repair.id)) {
      errors.push(`repair id is missing or duplicated: ${repair?.id || "<missing>"}`);
      return;
    }
    byId.set(repair.id, repair);

    ["riverId", "repairType", "reason", "explanation"].forEach((field) => {
      if (!String(repair[field] || "").trim()) {
        errors.push(`${repair.id} is missing ${field}`);
      }
    });

    if (!Array.isArray(repair.approximateCoordinates) || repair.approximateCoordinates.length < 2 || !repair.approximateCoordinates.every(isCoordinate)) {
      errors.push(`${repair.id} must declare at least two valid approximateCoordinates`);
    }

    if (["endpoint-extension", "gap-bridge"].includes(repair.repairType)) {
      if (repair.geometry?.type !== "LineString" || !Array.isArray(repair.geometry.coordinates) || repair.geometry.coordinates.length < 2 || !repair.geometry.coordinates.every(isCoordinate)) {
        errors.push(`${repair.id} must include a valid LineString display geometry`);
      }
    }

    if (repair.repairType === "endpoint-trim" && (!Array.isArray(repair.omitOriginalParts) || repair.omitOriginalParts.some((part) => !Number.isInteger(part) || part < 1))) {
      errors.push(`${repair.id} must declare positive integer omitOriginalParts`);
    }
  });

  expectedRepairs.forEach((expected) => {
    const repair = byId.get(expected.id);
    if (!repair) {
      errors.push(`missing expected repair ${expected.id}`);
      return;
    }
    if (repair.riverId !== expected.riverId || repair.repairType !== expected.repairType) {
      errors.push(`${expected.id} has the wrong river id or repair type`);
    }
  });

  if (errors.length > 0) {
    errors.forEach((error) => console.error(`Cartographic repair validation failed: ${error}`));
    process.exitCode = 1;
    return;
  }

  console.log(`Validated ${repairs.length} documented dev-preview cartographic river repairs.`);
  repairs.forEach((repair) => {
    console.log(JSON.stringify({
      id: repair.id,
      riverId: repair.riverId,
      repairType: repair.repairType,
      approximateCoordinates: repair.approximateCoordinates,
      omitOriginalParts: repair.omitOriginalParts || []
    }));
  });
}

function isCoordinate(value) {
  return Array.isArray(value)
    && value.length >= 2
    && Number.isFinite(value[0])
    && Number.isFinite(value[1])
    && value[0] >= -180
    && value[0] <= 180
    && value[1] >= -90
    && value[1] <= 90;
}
