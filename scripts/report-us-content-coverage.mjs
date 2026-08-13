#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

import {
  buildRepositoryCoverage,
  renderCoverageMarkdown
} from "./lib/us-content-coverage.mjs";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(scriptDir, "..");
const outputDir = path.join(rootDir, "docs/generated");
const markdownPath = path.join(outputDir, "us-content-coverage-report.md");
const jsonPath = path.join(outputDir, "us-content-coverage-report.json");

const report = buildRepositoryCoverage(rootDir);
try {
  report.repositoryRevision = execFileSync("git", ["rev-parse", "HEAD"], {
    cwd: rootDir,
    encoding: "utf8"
  }).trim();
} catch {
  report.repositoryRevision = null;
}

fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(markdownPath, renderCoverageMarkdown(report), "utf8");
fs.writeFileSync(jsonPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

const { summary, gaps } = report;
console.log("U.S. content coverage report generated");
console.log(`  Markdown: ${path.relative(rootDir, markdownPath)}`);
console.log(`  JSON: ${path.relative(rootDir, jsonPath)}`);
console.log(`  Fixed assessed concepts: ${summary.fixedAssessedConcepts}`);
console.log(`  State location / naming: ${summary.statesWithLocation}/50 / ${summary.statesWithNaming}/50`);
console.log(`  Capital relationships: ${summary.statesWithExplicitCapitalRelationshipData}/50 data, ${summary.statesWithAssessedCapitalRelationship}/50 assessed`);
console.log(`  Assessed curated relationships: ${summary.statesWithAssessedCuratedRelationship}/50`);
console.log(`  Assessed non-capital context: ${summary.statesWithNonCapitalContextual}/50`);
console.log(`  Dynamic route capacity: ${summary.dynamicRouteEndpointPairs} endpoint pairs`);
console.log(`  Missing assessed relationships: ${gaps.missingAssessedCuratedRelationship.join(", ") || "none"}`);
console.log(`  Missing non-capital context: ${gaps.missingNonCapitalContextual.join(", ") || "none"}`);
