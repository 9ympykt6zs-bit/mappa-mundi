import { mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import {
  buildCanonicalEvidenceParityReport,
  renderCanonicalEvidenceParityMarkdown
} from "./lib/canonical-evidence-parity.mjs";

const report = buildCanonicalEvidenceParityReport();
const reportsDirectory = new URL("../reports/", import.meta.url);
mkdirSync(fileURLToPath(reportsDirectory), { recursive: true });
writeFileSync(new URL("canonical-evidence-parity.json", reportsDirectory), `${JSON.stringify(report, null, 2)}\n`);
writeFileSync(new URL("canonical-evidence-parity.md", reportsDirectory), renderCanonicalEvidenceParityMarkdown(report));

console.log(`Canonical evidence parity report generated: ${report.executiveSummary.totalScenarios} scenarios, ${report.executiveSummary.defects} defects.`);
