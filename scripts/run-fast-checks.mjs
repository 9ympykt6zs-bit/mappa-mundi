import { readdirSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const scriptsDirectory = new URL("./", import.meta.url);
const checks = readdirSync(scriptsDirectory)
  .filter((name) => /^check-.*\.mjs$/.test(name))
  .sort();

let passed = 0;
const failed = [];

for (const check of checks) {
  const result = spawnSync(process.execPath, [fileURLToPath(new URL(check, scriptsDirectory))], {
    encoding: "utf8"
  });

  if (result.status === 0) {
    passed += 1;
    console.log(`PASS ${check}`);
    continue;
  }

  failed.push(check);
  console.error(`FAIL ${check}`);
  if (result.stdout) process.stderr.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  if (result.error) console.error(result.error);
}

console.log(`\nFast baseline: ${passed}/${checks.length} checks passed.`);

if (failed.length > 0) {
  console.error(`Failed checks: ${failed.join(", ")}`);
  process.exitCode = 1;
}
