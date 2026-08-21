import { mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import {
  buildProgressReportCanonicalShadowComparison,
  renderProgressReportCanonicalShadowMarkdown
} from "./lib/progress-report-canonical-shadow-comparison.mjs";

const report = buildProgressReportCanonicalShadowComparison();
const reportsDirectory = new URL("../reports/", import.meta.url);
mkdirSync(fileURLToPath(reportsDirectory), { recursive: true });
writeFileSync(new URL("progress-report-canonical-shadow.json", reportsDirectory), `${JSON.stringify(report, null, 2)}\n`);
writeFileSync(new URL("progress-report-canonical-shadow.md", reportsDirectory), renderProgressReportCanonicalShadowMarkdown(report));

console.log(`Progress Report canonical shadow generated: ${report.executiveSummary.totalComparableItemSkillCases} cases, ${report.executiveSummary.defects} defects.`);
