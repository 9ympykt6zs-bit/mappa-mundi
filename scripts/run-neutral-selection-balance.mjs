import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { loadUnitedStatesSimulationFixture } from "./lib/us-simulation-fixture.mjs";
import { runNeutralUnitedStatesSelectionBalance } from "./lib/neutral-selection-balance.mjs";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputDirectory = path.join(repositoryRoot, "reports");
const fixture = loadUnitedStatesSimulationFixture(repositoryRoot);
const report = runNeutralUnitedStatesSelectionBalance({ items: fixture.items });
const percent = (value) => `${(value * 100).toFixed(2)}%`;
const rows = (values) => values.map((value) => (
  `| ${value.id} | ${value.eligible} | ${percent(value.eligibleShare)} | ${value.selected} | ${percent(value.selectionShare)} | ${value.relativeDifference >= 0 ? "+" : ""}${percent(value.relativeDifference)} | ${value.withinTwentyPercent ? "Yes" : "No"} |`
)).join("\n");
const markdown = `# Neutral U.S. selection balance report

This deterministic report holds all 100 U.S. Memory Trail items at identical mastery and scheduling state, then performs ${report.planCount.toLocaleString("en-US")} independent seeded cumulative-review plans for ${report.selections.toLocaleString("en-US")} selections. It measures the production planner without updating learner state or changing selection behavior.

## Census-region balance

| Region | Eligible items | Eligible share | Selections | Selection share | Relative difference | Within ±20% |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
${rows(report.regions)}

## Item-type balance

| Item type | Eligible items | Eligible share | Selections | Selection share | Relative difference | Within ±20% |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
${rows(report.itemTypes)}

## Starvation and reproducibility

- Per-item selection range: ${report.itemSelectionRange.minimum}–${report.itemSelectionRange.maximum}.
- Eligible items never selected: ${report.itemSelectionRange.neverSelectedItemIds.length ? report.itemSelectionRange.neverSelectedItemIds.join(", ") : "none"}.
- All region shares within ±20% of eligible share: ${report.checks.noRegionOutsideTwentyPercent ? "yes" : "no"}.
- All item-type shares within ±20% of eligible share: ${report.checks.noItemTypeOutsideTwentyPercent ? "yes" : "no"}.
- Same seed and state replay exactly in the focused automated check.

## Scope limit

${report.limitation}
`;

fs.mkdirSync(outputDirectory, { recursive: true });
fs.writeFileSync(path.join(outputDirectory, "us-neutral-selection-balance.json"), `${JSON.stringify(report, null, 2)}\n`);
fs.writeFileSync(path.join(outputDirectory, "us-neutral-selection-balance.md"), markdown);
console.log(`Generated neutral U.S. balance report with ${report.selections} selections.`);
