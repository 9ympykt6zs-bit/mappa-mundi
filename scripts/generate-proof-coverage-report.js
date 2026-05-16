const fs = require("fs");
const path = require("path");

const repoRoot = path.resolve(__dirname, "..");
const proofSheetsDir = path.join(repoRoot, "docs", "proof-sheets");
const dataDir = path.join(repoRoot, "assets", "maps", "data");
const worldDir = path.join(repoRoot, "assets", "maps", "world");
const outputJsonPath = path.join(repoRoot, "docs", "proof-coverage-report.json");
const outputMarkdownPath = path.join(repoRoot, "docs", "proof-coverage-report.md");
const registryFiles = [
  path.join(repoRoot, "src", "maplibre-poc.js"),
  path.join(repoRoot, "src", "app.js")
];

function main() {
  const proofActivities = loadProofActivities();
  const implementedActivities = loadImplementedActivities();
  const registries = loadRegistrySignals();
  const analyzedActivities = proofActivities.map((proofActivity) => analyzeProofActivity(proofActivity, implementedActivities, registries));
  const orphanedActivities = findOrphanedActivities(implementedActivities, analyzedActivities);
  const summary = buildSummary(analyzedActivities, orphanedActivities);
  const report = {
    generatedAt: new Date().toISOString(),
    sourceOfTruth: "docs/proof-sheets/*.txt",
    proofSheets: proofActivities,
    implementedActivities,
    analyzedActivities,
    orphanedActivities,
    summary
  };

  fs.writeFileSync(outputJsonPath, JSON.stringify(report, null, 2));
  fs.writeFileSync(outputMarkdownPath, renderMarkdownReport(report));

  console.log(`Wrote ${path.relative(repoRoot, outputJsonPath)}`);
  console.log(`Wrote ${path.relative(repoRoot, outputMarkdownPath)}`);
}

function loadProofActivities() {
  const files = fs.readdirSync(proofSheetsDir)
    .filter((fileName) => fileName.toLowerCase().endsWith(".txt"))
    .sort();

  return files.flatMap((fileName) => parseProofSheet(fileName, fs.readFileSync(path.join(proofSheetsDir, fileName), "utf8")));
}

function parseProofSheet(fileName, contents) {
  const lines = contents.split(/\r?\n/);
  const activities = [];
  let currentActivity = null;

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!line) {
      continue;
    }

    const sectionMatch = line.match(/^(\d+)\.\s+(.+)$/);
    if (sectionMatch) {
      if (currentActivity) {
        activities.push(currentActivity);
      }

      currentActivity = {
        proofSheetFile: fileName,
        cycle: inferCycleNumber(fileName),
        sectionNumber: Number(sectionMatch[1]),
        title: sectionMatch[2].trim(),
        items: [],
        normalizedItems: []
      };
      continue;
    }

    const itemMatch = line.match(/^-+\s+(.+)$/);
    if (itemMatch && currentActivity) {
      const itemName = itemMatch[1].trim();
      currentActivity.items.push(itemName);
      continue;
    }
  }

  if (currentActivity) {
    activities.push(currentActivity);
  }

  activities.forEach((activity) => {
    activity.normalizedTitle = normalizeText(activity.title);
    activity.normalizedItems = activity.items.map(normalizeText);
  });

  return activities;
}

function inferCycleNumber(fileName) {
  const match = fileName.match(/Cycle-(\d+)/i);
  return match ? Number(match[1]) : null;
}

function loadImplementedActivities() {
  const jsonFiles = [
    ...fs.readdirSync(dataDir).filter((fileName) => fileName.toLowerCase().endsWith(".json")).map((fileName) => path.join(dataDir, fileName)),
    ...fs.readdirSync(worldDir).filter((fileName) => fileName.toLowerCase().endsWith(".json")).map((fileName) => path.join(worldDir, fileName))
  ].sort();

  return jsonFiles.map((absolutePath) => parseImplementedActivity(absolutePath));
}

function parseImplementedActivity(absolutePath) {
  const parsed = JSON.parse(fs.readFileSync(absolutePath, "utf8"));
  const features = Array.isArray(parsed.features) ? parsed.features : Array.isArray(parsed.targets) ? parsed.targets : [];
  const itemNames = features
    .map((feature) => feature?.name)
    .filter(Boolean);
  const searchableItemNames = features
    .flatMap((feature) => [feature?.name, ...(Array.isArray(feature?.aliases) ? feature.aliases : [])])
    .filter(Boolean);

  return {
    id: parsed.id || null,
    title: parsed.title || path.basename(absolutePath, ".json"),
    sequence: Number.isFinite(parsed.sequence) ? parsed.sequence : null,
    cumulativeGroup: parsed.cumulativeGroup || null,
    baseMap: parsed.baseMap || null,
    baseMapPath: parsed.baseMapPath || null,
    hideAnswerBank: Boolean(parsed.hideAnswerBank),
    itemCount: itemNames.length,
    items: itemNames,
    normalizedItems: searchableItemNames.map(normalizeText),
    normalizedTitle: normalizeText(parsed.title || path.basename(absolutePath, ".json")),
    relativePath: toRepoRelativePath(absolutePath)
  };
}

function loadRegistrySignals() {
  const signals = {};

  registryFiles.forEach((filePath) => {
    signals[toRepoRelativePath(filePath)] = fs.readFileSync(filePath, "utf8");
  });

  return signals;
}

function analyzeProofActivity(proofActivity, implementedActivities, registries) {
  const rankedCandidates = implementedActivities
    .map((candidate) => scoreCandidate(proofActivity, candidate, registries))
    .filter((candidate) => isMeaningfulMatch(proofActivity, candidate))
    .sort((left, right) => right.score - left.score);

  const bestMatch = rankedCandidates[0] || null;
  const matchedItems = bestMatch ? intersect(proofActivity.normalizedItems, bestMatch.activity.normalizedItems) : [];
  const missingItems = proofActivity.items.filter((item) => !matchedItems.includes(normalizeText(item)));
  const extraItems = bestMatch
    ? bestMatch.activity.items.filter((item) => !proofActivity.normalizedItems.includes(normalizeText(item)))
    : [];
  const registration = bestMatch ? getRegistrationDetails(bestMatch.activity, registries) : emptyRegistration();
  const status = determineStatus(proofActivity, bestMatch, matchedItems, missingItems, registration);

  return {
    proofSheetFile: proofActivity.proofSheetFile,
    cycle: proofActivity.cycle,
    sectionNumber: proofActivity.sectionNumber,
    proofTitle: proofActivity.title,
    proofItems: proofActivity.items,
    status,
    matchScore: bestMatch?.score ?? 0,
    matchedActivityId: bestMatch?.activity.id ?? null,
    matchedActivityTitle: bestMatch?.activity.title ?? null,
    matchedActivityFile: bestMatch?.activity.relativePath ?? null,
    matchedItemCount: matchedItems.length,
    missingItems,
    extraItems,
    registration,
    notes: buildNotes(proofActivity, bestMatch, missingItems, extraItems, registration)
  };
}

function scoreCandidate(proofActivity, candidate, registries) {
  const matchedNormalizedItems = intersect(proofActivity.normalizedItems, candidate.normalizedItems);
  const itemOverlapCount = matchedNormalizedItems.length;
  const itemRecall = proofActivity.normalizedItems.length > 0 ? itemOverlapCount / proofActivity.normalizedItems.length : 0;
  const titleSimilarity = jaccardSimilarity(tokenize(proofActivity.normalizedTitle), tokenize(candidate.normalizedTitle));
  const sequenceBonus = candidate.sequence && candidate.sequence === proofActivity.sectionNumber ? 2 : 0;
  const registration = getRegistrationDetails(candidate, registries);
  const registrationBonus = registration.isRegistered ? 0.5 : 0;
  const score = itemOverlapCount * 10 + itemRecall * 5 + titleSimilarity * 4 + sequenceBonus + registrationBonus;

  return {
    activity: candidate,
    score,
    matchedNormalizedItems,
    itemOverlapCount,
    titleSimilarity
  };
}

function isMeaningfulMatch(proofActivity, candidate) {
  if (candidate.itemOverlapCount > 0) {
    return true;
  }

  if (candidate.titleSimilarity >= 0.6) {
    return true;
  }

  if (candidate.activity.sequence && candidate.activity.sequence === proofActivity.sectionNumber && candidate.titleSimilarity >= 0.35) {
    return true;
  }

  return false;
}

function determineStatus(proofActivity, bestMatch, matchedItems, missingItems, registration) {
  if (!bestMatch) {
    return "missing";
  }

  const hasAllItems = missingItems.length === 0;

  if (hasAllItems && registration.isRegistered) {
    return "covered";
  }

  if (hasAllItems && !registration.isRegistered) {
    return "data-only";
  }

  if (matchedItems.length > 0) {
    return "partial";
  }

  return "missing";
}

function buildNotes(proofActivity, bestMatch, missingItems, extraItems, registration) {
  const notes = [];

  if (!bestMatch) {
    notes.push("No matching data activity found.");
    return notes;
  }

  if (missingItems.length > 0) {
    notes.push(`Missing proof-sheet items: ${missingItems.join(", ")}.`);
  }

  if (extraItems.length > 0) {
    notes.push(`Implemented activity has extra items: ${extraItems.join(", ")}.`);
  }

  if (!registration.maplibreReferenced && !registration.legacyReferenced) {
    notes.push("Data file is not referenced by either the MapLibre or legacy registry.");
  } else if (!registration.maplibreReferenced) {
    notes.push("Not referenced by the MapLibre registry.");
  } else if (!registration.legacyReferenced) {
    notes.push("Not referenced by the legacy registry.");
  }

  if (bestMatch.activity.id !== null && normalizeText(bestMatch.activity.title) !== proofActivity.normalizedTitle) {
    notes.push(`Title differs: proof sheet uses "${proofActivity.title}", implementation uses "${bestMatch.activity.title}".`);
  }

  return notes;
}

function getRegistrationDetails(activity, registries) {
  const maplibreSource = registries["src/maplibre-poc.js"];
  const legacySource = registries["src/app.js"];
  const filePath = activity.relativePath;
  const activityId = activity.id || "";

  const maplibreReferenced = Boolean(
    maplibreSource.includes(filePath.replace(/\\/g, "/"))
    || maplibreSource.includes(`"${activityId}"`)
    || maplibreSource.includes(`'${activityId}'`)
  );
  const legacyReferenced = Boolean(
    legacySource.includes(filePath.replace(/\\/g, "/"))
    || legacySource.includes(`"${activityId}"`)
    || legacySource.includes(`'${activityId}'`)
  );

  return {
    maplibreReferenced,
    legacyReferenced,
    isRegistered: maplibreReferenced || legacyReferenced
  };
}

function emptyRegistration() {
  return {
    maplibreReferenced: false,
    legacyReferenced: false,
    isRegistered: false
  };
}

function findOrphanedActivities(implementedActivities, analyzedActivities) {
  const matchedIds = new Set(analyzedActivities.map((activity) => activity.matchedActivityId).filter(Boolean));
  return implementedActivities
    .filter((activity) => !matchedIds.has(activity.id))
    .map((activity) => ({
      id: activity.id,
      title: activity.title,
      relativePath: activity.relativePath,
      itemCount: activity.itemCount
    }));
}

function buildSummary(analyzedActivities, orphanedActivities) {
  const counts = analyzedActivities.reduce((summary, activity) => {
    summary.totalProofActivities += 1;
    summary[activity.status] = (summary[activity.status] || 0) + 1;
    return summary;
  }, {
    totalProofActivities: 0,
    covered: 0,
    partial: 0,
    "data-only": 0,
    missing: 0
  });

  return {
    ...counts,
    orphanedImplementedActivities: orphanedActivities.length
  };
}

function renderMarkdownReport(report) {
  const lines = [];
  lines.push("# Proof Coverage Report");
  lines.push("");
  lines.push(`Generated: ${report.generatedAt}`);
  lines.push("");
  lines.push("## Summary");
  lines.push("");
  lines.push(`- Total proof-sheet activities: ${report.summary.totalProofActivities}`);
  lines.push(`- Covered: ${report.summary.covered}`);
  lines.push(`- Partial: ${report.summary.partial}`);
  lines.push(`- Data-only: ${report.summary["data-only"]}`);
  lines.push(`- Missing: ${report.summary.missing}`);
  lines.push(`- Orphaned implemented activities: ${report.summary.orphanedImplementedActivities}`);
  lines.push("");
  lines.push("## Activity Coverage");
  lines.push("");
  lines.push("| Proof Sheet | Section | Title | Status | Matched Activity | Registry | Missing Items | Extra Items |");
  lines.push("| --- | ---: | --- | --- | --- | --- | --- | --- |");

  report.analyzedActivities.forEach((activity) => {
    const registrySummary = activity.registration.isRegistered
      ? [activity.registration.maplibreReferenced ? "MapLibre" : null, activity.registration.legacyReferenced ? "Legacy" : null].filter(Boolean).join(", ")
      : "None";
    const missingSummary = activity.missingItems.length > 0 ? activity.missingItems.join("; ") : "—";
    const extraSummary = activity.extraItems.length > 0 ? activity.extraItems.join("; ") : "—";
    const matchedSummary = activity.matchedActivityTitle
      ? `${activity.matchedActivityTitle} \`${activity.matchedActivityId}\``
      : "—";

    lines.push(`| ${activity.proofSheetFile} | ${activity.sectionNumber} | ${escapePipe(activity.proofTitle)} | ${activity.status} | ${escapePipe(matchedSummary)} | ${registrySummary} | ${escapePipe(missingSummary)} | ${escapePipe(extraSummary)} |`);
  });

  lines.push("");
  lines.push("## Notes");
  lines.push("");

  report.analyzedActivities
    .filter((activity) => activity.notes.length > 0)
    .forEach((activity) => {
      lines.push(`### ${activity.proofSheetFile} / ${activity.sectionNumber}. ${activity.proofTitle}`);
      activity.notes.forEach((note) => lines.push(`- ${note}`));
      lines.push("");
    });

  lines.push("## Orphaned Implemented Activities");
  lines.push("");

  if (report.orphanedActivities.length === 0) {
    lines.push("None.");
  } else {
    report.orphanedActivities.forEach((activity) => {
      lines.push(`- \`${activity.id}\` — ${activity.title} (${activity.relativePath})`);
    });
  }

  lines.push("");
  return `${lines.join("\n")}\n`;
}

function tokenize(value) {
  return value.split(/\s+/).filter(Boolean);
}

function intersect(left, right) {
  const rightSet = new Set(right);
  return [...new Set(left.filter((item) => rightSet.has(item)))];
}

function jaccardSimilarity(leftTokens, rightTokens) {
  const leftSet = new Set(leftTokens);
  const rightSet = new Set(rightTokens);
  const union = new Set([...leftSet, ...rightSet]);

  if (union.size === 0) {
    return 0;
  }

  let intersectionCount = 0;
  leftSet.forEach((token) => {
    if (rightSet.has(token)) {
      intersectionCount += 1;
    }
  });

  return intersectionCount / union.size;
}

function normalizeText(value) {
  return value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[\/,.:;()]/g, " ")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function toRepoRelativePath(absolutePath) {
  return path.relative(repoRoot, absolutePath).replace(/\\/g, "/");
}

function escapePipe(value) {
  return String(value).replace(/\|/g, "\\|");
}

main();
