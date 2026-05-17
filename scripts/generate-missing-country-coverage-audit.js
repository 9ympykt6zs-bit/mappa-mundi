const fs = require("fs");
const path = require("path");

const repoRoot = path.resolve(__dirname, "..");
const dataDir = path.join(repoRoot, "assets", "maps", "data");
const worldCountriesPath = path.join(dataDir, "maplibre-world-countries.geojson");
const outputJsonPath = path.join(repoRoot, "docs", "missing-country-coverage-audit.json");
const outputMarkdownPath = path.join(repoRoot, "docs", "missing-country-coverage-audit.md");

const notCodeValues = new Set(["", "-99", "-099", "null", "undefined"]);
const specialTypes = new Set(["Dependency", "Disputed", "Indeterminate"]);
const intentionallyUsedSpecialCases = new Set([
  "KOS",
  "PRI"
]);

const groupingTemplates = [
  {
    id: "west-africa-atlantic-review",
    title: "West Africa Atlantic Review",
    fileName: "west-africa-atlantic-countries.json",
    region: "West Africa",
    names: ["Senegal", "Gambia", "Guinea-Bissau", "Guinea", "Sierra Leone", "Liberia", "Ivory Coast"]
  },
  {
    id: "gulf-of-guinea-review",
    title: "Gulf of Guinea Review",
    fileName: "gulf-of-guinea-countries.json",
    region: "West / Central Africa",
    names: ["Ghana", "Togo", "Benin", "Nigeria", "Cameroon", "Equatorial Guinea", "Gabon"]
  },
  {
    id: "sahel-and-lake-chad-review",
    title: "Sahel and Lake Chad Review",
    fileName: "sahel-lake-chad-countries.json",
    region: "Africa",
    names: ["Mauritania", "Mali", "Burkina Faso", "Niger", "Chad", "Central African Republic"]
  },
  {
    id: "central-africa-review",
    title: "Central Africa Review",
    fileName: "central-africa-countries.json",
    region: "Central Africa",
    names: ["Republic of the Congo", "Democratic Republic of the Congo", "Angola", "Zambia", "Malawi"]
  },
  {
    id: "horn-and-upper-nile-review",
    title: "Horn and Upper Nile Review",
    fileName: "horn-upper-nile-countries.json",
    region: "East Africa",
    names: ["Sudan", "South Sudan", "Ethiopia", "Eritrea", "Djibouti", "Somalia"]
  },
  {
    id: "east-africa-great-lakes-review",
    title: "East Africa Great Lakes Review",
    fileName: "east-africa-great-lakes-countries.json",
    region: "East Africa",
    names: ["Uganda", "Rwanda", "Burundi", "Kenya", "Tanzania"]
  },
  {
    id: "island-western-indian-ocean-review",
    title: "Western Indian Ocean Islands Review",
    fileName: "western-indian-ocean-islands.json",
    region: "Indian Ocean",
    names: ["Madagascar", "Comoros", "Mauritius", "Seychelles"]
  },
  {
    id: "arabian-peninsula-review",
    title: "Arabian Peninsula Review",
    fileName: "arabian-peninsula-countries.json",
    region: "Southwest Asia",
    names: ["Saudi Arabia", "Yemen", "Oman", "United Arab Emirates", "Qatar", "Bahrain", "Kuwait"]
  },
  {
    id: "persian-plateau-review",
    title: "Persian Plateau and Afghanistan Review",
    fileName: "persian-plateau-afghanistan-countries.json",
    region: "Southwest / Central Asia",
    names: ["Iran", "Afghanistan", "Pakistan"]
  },
  {
    id: "levant-and-anatolia-review",
    title: "Levant and Anatolia Review",
    fileName: "levant-anatolia-countries.json",
    region: "Southwest Asia",
    names: ["Turkey", "Syria", "Lebanon", "Jordan", "Israel", "Cyprus"]
  },
  {
    id: "north-borneo-and-philippines-review",
    title: "Philippines and North Borneo Review",
    fileName: "philippines-north-borneo-countries.json",
    region: "Southeast Asia",
    names: ["Philippines", "Malaysia", "Brunei", "Indonesia", "Timor-Leste"]
  },
  {
    id: "east-asia-review",
    title: "East Asia Review",
    fileName: "east-asia-review-countries.json",
    region: "East Asia",
    names: ["China", "Mongolia", "North Korea", "South Korea", "Japan", "Taiwan"]
  },
  {
    id: "central-europe-review",
    title: "Central Europe Review",
    fileName: "central-europe-review-countries.json",
    region: "Europe",
    names: ["Germany", "Czechia", "Poland", "Slovakia", "Hungary", "Austria", "Switzerland"]
  },
  {
    id: "southern-europe-islands-review",
    title: "Southern Europe Islands Review",
    fileName: "southern-europe-islands-countries.json",
    region: "Europe",
    names: ["Malta", "Cyprus", "Greece", "Italy"]
  },
  {
    id: "northern-atlantic-review",
    title: "Northern Atlantic Review",
    fileName: "northern-atlantic-countries.json",
    region: "North Atlantic",
    names: ["Iceland", "Ireland", "United Kingdom", "Norway", "Denmark"]
  },
  {
    id: "central-caribbean-review",
    title: "Central Caribbean Review",
    fileName: "central-caribbean-countries.json",
    region: "Caribbean",
    names: ["Cuba", "Jamaica", "Haiti", "Dominican Republic", "Puerto Rico"]
  },
  {
    id: "lesser-antilles-review",
    title: "Lesser Antilles Review",
    fileName: "lesser-antilles-countries.json",
    region: "Caribbean",
    names: ["Bahamas", "Trinidad and Tobago"]
  },
  {
    id: "northern-south-america-review",
    title: "Northern South America Review",
    fileName: "northern-south-america-countries.json",
    region: "South America",
    names: ["Colombia", "Venezuela", "Guyana", "Suriname"]
  },
  {
    id: "pacific-islands-review",
    title: "Pacific Islands Review",
    fileName: "pacific-islands-countries.json",
    region: "Oceania",
    names: ["Fiji", "Vanuatu", "Solomon Islands", "Papua New Guinea", "New Caledonia"]
  }
];

function main() {
  const worldFeatures = loadWorldFeatures();
  const activityFiles = loadActivityFiles();
  const worldIndex = buildWorldIndex(worldFeatures);
  const activityTargets = collectActivityTargets(activityFiles, worldIndex);
  const matchesByWorldId = buildMatchesByWorldId(worldFeatures, activityTargets);
  const missingFeatures = worldFeatures.filter((feature) => !matchesByWorldId.has(feature.auditId));
  const playableCountries = worldFeatures
    .filter((feature) => matchesByWorldId.has(feature.auditId))
    .map((feature) => ({
      ...feature,
      matches: matchesByWorldId.get(feature.auditId)
    }));
  const duplicates = findDuplicatePlayableCountries(playableCountries);
  const territoryLikeFeatures = worldFeatures
    .filter(isTerritoryDisputedOrSpecial)
    .map((feature) => ({
      ...feature,
      coverageStatus: matchesByWorldId.has(feature.auditId) ? "playable" : "missing",
      matches: matchesByWorldId.get(feature.auditId) || []
    }));
  const activityTargetsNotInWorld = activityTargets.filter((target) => target.matches.length === 0);
  const suggestedGroupings = buildSuggestedGroupings(missingFeatures);
  const recommendedNextActions = buildRecommendedNextActions(missingFeatures, suggestedGroupings);
  const summary = buildSummary(worldFeatures, playableCountries, missingFeatures, duplicates, activityTargetsNotInWorld, activityFiles);
  const report = {
    generatedAt: new Date().toISOString(),
    sourceWorldMap: toRepoRelativePath(worldCountriesPath),
    inspectedActivityFiles: activityFiles.map((activity) => ({
      id: activity.id,
      title: activity.title,
      relativePath: activity.relativePath,
      targetCount: activity.targets.length,
      countryTargetCount: activity.countryTargets.length
    })),
    summary,
    recommendedNextActions,
    worldFeatures,
    playableCountries,
    missingCountries: missingFeatures,
    duplicatePlayableCountries: duplicates,
    territoryLikeFeatures,
    activityTargetsNotInWorld,
    suggestedGroupings
  };

  fs.writeFileSync(outputJsonPath, `${JSON.stringify(report, null, 2)}\n`);
  fs.writeFileSync(outputMarkdownPath, renderMarkdownReport(report));

  console.log(`Wrote ${toRepoRelativePath(outputJsonPath)}`);
  console.log(`Wrote ${toRepoRelativePath(outputMarkdownPath)}`);
}

function loadWorldFeatures() {
  const parsed = JSON.parse(fs.readFileSync(worldCountriesPath, "utf8"));

  return parsed.features.map((feature, index) => {
    const properties = feature.properties || {};
    const codes = unique([
      properties.ADM0_A3,
      properties.ISO_A3,
      properties.SOV_A3,
      properties.ADM0_ISO,
      properties.BRK_A3
    ].map(normalizeCode).filter(Boolean));
    const names = unique([
      properties.ADMIN,
      properties.NAME,
      properties.NAME_LONG,
      properties.NAME_EN,
      properties.BRK_NAME,
      properties.GEOUNIT,
      properties.SOVEREIGNT
    ].filter(Boolean));

    return {
      auditId: `${properties.ADM0_A3 || properties.ISO_A3 || properties.NAME || "feature"}-${index}`,
      mapIndex: index,
      name: properties.NAME_EN || properties.NAME_LONG || properties.ADMIN || properties.NAME,
      adminName: properties.ADMIN || null,
      displayName: properties.NAME || null,
      nameLong: properties.NAME_LONG || null,
      continent: properties.CONTINENT || null,
      subregion: properties.SUBREGION || null,
      type: properties.TYPE || null,
      sovereign: properties.SOVEREIGNT || null,
      adm0A3: properties.ADM0_A3 || null,
      isoA3: properties.ISO_A3 || null,
      sovA3: properties.SOV_A3 || null,
      adm0Iso: properties.ADM0_ISO || null,
      labelX: asNumber(properties.LABEL_X),
      labelY: asNumber(properties.LABEL_Y),
      bbox: Array.isArray(feature.bbox) ? feature.bbox : null,
      codes,
      names,
      normalizedNames: unique(names.map(normalizeName).filter(Boolean)),
      isTerritoryDisputedOrSpecial: false
    };
  }).map((feature) => ({
    ...feature,
    isTerritoryDisputedOrSpecial: isTerritoryDisputedOrSpecial(feature),
    specialCaseReason: getSpecialCaseReason(feature)
  }));
}

function loadActivityFiles() {
  return fs.readdirSync(dataDir)
    .filter((fileName) => fileName.toLowerCase().endsWith(".json"))
    .sort()
    .map((fileName) => {
      const absolutePath = path.join(dataDir, fileName);
      const parsed = JSON.parse(fs.readFileSync(absolutePath, "utf8"));
      const targets = Array.isArray(parsed.features)
        ? parsed.features
        : Array.isArray(parsed.targets)
          ? parsed.targets
          : [];
      const activity = {
        id: parsed.id || path.basename(fileName, ".json"),
        title: parsed.title || path.basename(fileName, ".json"),
        relativePath: toRepoRelativePath(absolutePath),
        targets,
        countryTargets: []
      };
      activity.countryTargets = targets
        .filter(isCountryTarget)
        .map((target, index) => buildActivityCountryTarget(activity, target, index));
      return activity;
    });
}

function collectActivityTargets(activityFiles, worldIndex) {
  return activityFiles.flatMap((activity) => activity.countryTargets.map((target) => ({
    ...target,
    matches: findWorldMatches(target, worldIndex)
  })));
}

function buildActivityCountryTarget(activity, target, index) {
  const codes = unique([
    target.isoA3,
    target.iso,
    target.countryCode,
    target.adm0A3
  ].map(normalizeCode).filter(Boolean));
  const names = unique([
    target.name,
    target.adminName,
    target.sourceName,
    target.id
  ].filter(Boolean));

  return {
    activityId: activity.id,
    activityTitle: activity.title,
    activityFile: activity.relativePath,
    targetIndex: index,
    id: target.id || null,
    name: target.name || null,
    type: target.type || null,
    isoA3: target.isoA3 || null,
    iso: target.iso || null,
    countryCode: target.countryCode || null,
    politicalStatus: target.politicalStatus || null,
    statusNote: target.statusNote || null,
    codes,
    names,
    normalizedNames: unique(names.map(normalizeName).filter(Boolean))
  };
}

function buildWorldIndex(worldFeatures) {
  const byCode = new Map();
  const byName = new Map();

  worldFeatures.forEach((feature) => {
    feature.codes.forEach((code) => pushMapArray(byCode, code, feature));
    feature.normalizedNames.forEach((name) => pushMapArray(byName, name, feature));
  });

  return { byCode, byName };
}

function findWorldMatches(target, worldIndex) {
  const codeMatches = uniqueFeatures(target.codes.flatMap((code) => worldIndex.byCode.get(code) || []));
  if (codeMatches.length > 0) {
    return codeMatches.map((feature) => buildWorldMatch(feature, "code"));
  }

  const nameMatches = uniqueFeatures(target.normalizedNames.flatMap((name) => worldIndex.byName.get(name) || []));
  return nameMatches.map((feature) => buildWorldMatch(feature, "name"));
}

function buildWorldMatch(feature, matchType) {
  return {
    auditId: feature.auditId,
    name: feature.name,
    adminName: feature.adminName,
    type: feature.type,
    continent: feature.continent,
    adm0A3: feature.adm0A3,
    isoA3: feature.isoA3,
    sovA3: feature.sovA3,
    matchType
  };
}

function buildMatchesByWorldId(worldFeatures, activityTargets) {
  const worldIds = new Set(worldFeatures.map((feature) => feature.auditId));
  const matchesByWorldId = new Map();

  activityTargets.forEach((target) => {
    target.matches.forEach((match) => {
      if (!worldIds.has(match.auditId)) {
        return;
      }

      pushMapArray(matchesByWorldId, match.auditId, {
        activityId: target.activityId,
        activityTitle: target.activityTitle,
        activityFile: target.activityFile,
        targetId: target.id,
        targetName: target.name,
        targetType: target.type,
        isoA3: target.isoA3,
        matchType: match.matchType,
        politicalStatus: target.politicalStatus,
        statusNote: target.statusNote
      });
    });
  });

  return matchesByWorldId;
}

function findDuplicatePlayableCountries(playableCountries) {
  return playableCountries
    .map((feature) => {
      const distinctActivities = uniqueBy(feature.matches, (match) => match.activityId);
      return {
        ...feature,
        duplicateCount: distinctActivities.length,
        matches: distinctActivities,
        duplicateKind: distinctActivities.some((match) => isReviewActivity(match.activityId, match.activityTitle))
          ? "review duplicate"
          : "possible accidental duplicate"
      };
    })
    .filter((feature) => feature.duplicateCount > 1)
    .sort(sortByContinentThenName);
}

function buildSuggestedGroupings(missingFeatures) {
  const missingByName = new Map();
  const missingNormalFeatures = missingFeatures.filter((feature) => !isTerritoryDisputedOrSpecial(feature));
  const missingSpecialFeatures = missingFeatures.filter(isTerritoryDisputedOrSpecial);

  missingNormalFeatures.forEach((feature) => {
    getFeatureLookupNames(feature).forEach((name) => missingByName.set(normalizeName(name), feature));
  });

  const usedAuditIds = new Set();
  const normalGroups = groupingTemplates.map((template) => {
    const targets = uniqueFeatures(template.names
      .map((name) => missingByName.get(normalizeName(name)))
      .filter(Boolean))
      .filter((feature) => !usedAuditIds.has(feature.auditId));

    targets.forEach((feature) => usedAuditIds.add(feature.auditId));

    return {
      id: template.id,
      title: template.title,
      suggestedFileName: template.fileName,
      region: template.region,
      recommendationType: "normal-country-activity",
      targets: targets.map(toSuggestionTarget),
      targetCount: targets.length,
      note: "Generated from missing non-special admin-0 countries only."
    };
  }).filter((group) => group.targetCount > 0);

  const leftovers = missingNormalFeatures.filter((feature) => !usedAuditIds.has(feature.auditId));
  const fallbackGroups = chunkFallbackGroups(leftovers);
  const specialGroup = {
    id: "territories-disputed-special-cases",
    title: "Territories / Disputed / Special Cases",
    suggestedFileName: "territories-disputed-special-cases-review.json",
    region: "World",
    recommendationType: "special-case-review",
    targets: missingSpecialFeatures.sort(sortByContinentThenName).map(toSuggestionTarget),
    targetCount: missingSpecialFeatures.length,
    note: "Keep these separate from normal country activities unless intentionally approved for a regional learning path."
  };

  return [
    ...normalGroups,
    ...fallbackGroups,
    specialGroup
  ].filter((group) => group.targetCount > 0);
}

function chunkFallbackGroups(features) {
  const groups = new Map();

  features.forEach((feature) => {
    const key = feature.subregion || feature.continent || "World";
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key).push(feature);
  });

  return [...groups.entries()].flatMap(([region, regionFeatures]) => {
    const sorted = regionFeatures.sort((left, right) => {
      const leftX = left.labelX ?? 0;
      const rightX = right.labelX ?? 0;
      return leftX - rightX || left.name.localeCompare(right.name);
    });
    const chunks = chunk(sorted, 8);
    return chunks.map((targets, index) => ({
      id: slugify(`${region}-missing-${index + 1}`),
      title: `${region} Missing Countries ${chunks.length > 1 ? index + 1 : ""}`.trim(),
      suggestedFileName: `${slugify(region)}-missing-countries${chunks.length > 1 ? `-${index + 1}` : ""}.json`,
      region,
      recommendationType: "normal-country-activity",
      targets: targets.map(toSuggestionTarget),
      targetCount: targets.length,
      note: "Fallback grouping by Natural Earth subregion; review for final learning-path naming."
    }));
  });
}

function buildRecommendedNextActions(missingFeatures, suggestedGroupings) {
  const highPriorityMissingSovereignCountries = missingFeatures
    .filter((feature) => !isTerritoryDisputedOrSpecial(feature))
    .sort(sortByContinentThenName)
    .slice(0, 20)
    .map(toSuggestionTarget);
  const lowPriorityTerritoriesDependencies = missingFeatures
    .filter(isTerritoryDisputedOrSpecial)
    .sort(sortByContinentThenName)
    .map(toSuggestionTarget);
  const suggestedFirstBatch = suggestedGroupings
    .filter((group) => group.recommendationType === "normal-country-activity")
    .filter((group) => group.targetCount >= 4)
    .sort((left, right) => priorityRegionScore(left.region) - priorityRegionScore(right.region) || right.targetCount - left.targetCount)
    .slice(0, 5)
    .map((group) => ({
      title: group.title,
      suggestedFileName: group.suggestedFileName,
      targetCount: group.targetCount,
      targets: group.targets.map((target) => target.name)
    }));

  return {
    highPriorityMissingSovereignCountries,
    lowPriorityTerritoriesDependencies,
    suggestedFirstBatch
  };
}

function buildSummary(worldFeatures, playableCountries, missingFeatures, duplicates, activityTargetsNotInWorld, activityFiles) {
  return {
    worldAdmin0FeatureCount: worldFeatures.length,
    inspectedActivityJsonFileCount: activityFiles.length,
    playableCountryCount: playableCountries.length,
    missingCountryCount: missingFeatures.length,
    duplicatePlayableCountryCount: duplicates.length,
    activityCountryTargetsNotInWorldCount: activityTargetsNotInWorld.length,
    territoryLikeFeatureCount: worldFeatures.filter(isTerritoryDisputedOrSpecial).length,
    countsByType: countBy(worldFeatures, (feature) => feature.type || "Unknown"),
    missingCountsByType: countBy(missingFeatures, (feature) => feature.type || "Unknown"),
    playableCountsByType: countBy(playableCountries, (feature) => feature.type || "Unknown")
  };
}

function renderMarkdownReport(report) {
  const lines = [];
  lines.push("# Missing-Country Coverage Audit");
  lines.push("");
  lines.push(`Generated: ${report.generatedAt}`);
  lines.push("");
  lines.push("## Recommended Next Actions");
  lines.push("");
  lines.push("### High-priority missing sovereign countries");
  appendCompactList(lines, report.recommendedNextActions.highPriorityMissingSovereignCountries, (target) => `${target.name} (${target.continent})`);
  lines.push("");
  lines.push("### Low-priority territories/dependencies");
  appendCompactList(lines, report.recommendedNextActions.lowPriorityTerritoriesDependencies, (target) => `${target.name} (${target.type}; ${target.continent})`);
  lines.push("");
  lines.push("### Suggested first batch of new activity files");
  appendCompactList(lines, report.recommendedNextActions.suggestedFirstBatch, (group) => `${group.suggestedFileName} - ${group.title}: ${group.targets.join(", ")}`);
  lines.push("");
  lines.push("## Summary");
  lines.push("");
  lines.push(`- Visible admin-0 features: ${report.summary.worldAdmin0FeatureCount}`);
  lines.push(`- Activity JSON files inspected: ${report.summary.inspectedActivityJsonFileCount}`);
  lines.push(`- Playable countries/features: ${report.summary.playableCountryCount}`);
  lines.push(`- Missing countries/features: ${report.summary.missingCountryCount}`);
  lines.push(`- Duplicate playable countries/features: ${report.summary.duplicatePlayableCountryCount}`);
  lines.push(`- Activity country targets not found in map source: ${report.summary.activityCountryTargetsNotInWorldCount}`);
  lines.push(`- Territory/disputed/special-case features: ${report.summary.territoryLikeFeatureCount}`);
  lines.push("");
  lines.push("### Counts by Natural Earth Type");
  lines.push("");
  lines.push("| Type | Total | Playable | Missing |");
  lines.push("| --- | ---: | ---: | ---: |");
  Object.keys(report.summary.countsByType).sort().forEach((type) => {
    lines.push(`| ${type} | ${report.summary.countsByType[type] || 0} | ${report.summary.playableCountsByType[type] || 0} | ${report.summary.missingCountsByType[type] || 0} |`);
  });
  lines.push("");
  lines.push("## Playable Countries");
  lines.push("");
  appendFeatureTable(lines, report.playableCountries, true);
  lines.push("");
  lines.push("## Missing Countries");
  lines.push("");
  appendFeatureTable(lines, report.missingCountries, false);
  lines.push("");
  lines.push("## Duplicate Playable Countries");
  lines.push("");
  if (report.duplicatePlayableCountries.length === 0) {
    lines.push("None.");
  } else {
    lines.push("| Country | Type | Duplicate Kind | Activity IDs |");
    lines.push("| --- | --- | --- | --- |");
    report.duplicatePlayableCountries.forEach((feature) => {
      lines.push(`| ${escapePipe(feature.name)} | ${feature.type} | ${feature.duplicateKind} | ${escapePipe(feature.matches.map((match) => match.activityId).join("; "))} |`);
    });
  }
  lines.push("");
  lines.push("## Territories / Disputed / Special Cases");
  lines.push("");
  lines.push("| Name | Type | Continent | Status | Reason | Activity IDs |");
  lines.push("| --- | --- | --- | --- | --- | --- |");
  report.territoryLikeFeatures.forEach((feature) => {
    const activityIds = feature.matches.length > 0 ? feature.matches.map((match) => match.activityId).join("; ") : "-";
    lines.push(`| ${escapePipe(feature.name)} | ${feature.type} | ${feature.continent || "-"} | ${feature.coverageStatus} | ${escapePipe(feature.specialCaseReason || "-")} | ${escapePipe(activityIds)} |`);
  });
  lines.push("");
  lines.push("## Activity Country Targets Not Found In Map Source");
  lines.push("");
  if (report.activityTargetsNotInWorld.length === 0) {
    lines.push("None.");
  } else {
    lines.push("| Target | Codes | Activity | File |");
    lines.push("| --- | --- | --- | --- |");
    report.activityTargetsNotInWorld.forEach((target) => {
      lines.push(`| ${escapePipe(target.name || target.id || "Unnamed target")} | ${target.codes.join(", ") || "-"} | ${escapePipe(target.activityId)} | ${target.activityFile} |`);
    });
  }
  lines.push("");
  lines.push("## Suggested Regional Groupings");
  lines.push("");
  report.suggestedGroupings.forEach((group) => {
    lines.push(`### ${group.title}`);
    lines.push("");
    lines.push(`- Suggested file: \`${group.suggestedFileName}\``);
    lines.push(`- Recommendation type: ${group.recommendationType}`);
    lines.push(`- Region: ${group.region}`);
    lines.push(`- Targets (${group.targetCount}): ${group.targets.map((target) => target.name).join(", ")}`);
    lines.push(`- Note: ${group.note}`);
    lines.push("");
  });

  return `${lines.join("\n")}\n`;
}

function appendFeatureTable(lines, features, includeMatches) {
  if (features.length === 0) {
    lines.push("None.");
    return;
  }

  lines.push(includeMatches
    ? "| Name | Admin Name | Type | Continent | ADM0_A3 | ISO_A3 | Activity IDs |"
    : "| Name | Admin Name | Type | Continent | ADM0_A3 | ISO_A3 | Suggested Group |");
  lines.push(includeMatches
    ? "| --- | --- | --- | --- | --- | --- | --- |"
    : "| --- | --- | --- | --- | --- | --- | --- |");

  const groupByAuditId = new Map();
  if (!includeMatches) {
    // Filled lazily from the report section by readers; keep the table simple.
  }

  features.sort(sortByContinentThenName).forEach((feature) => {
    if (includeMatches) {
      const activityIds = unique(feature.matches.map((match) => match.activityId)).join("; ");
      lines.push(`| ${escapePipe(feature.name)} | ${escapePipe(feature.adminName || "-")} | ${feature.type || "-"} | ${feature.continent || "-"} | ${feature.adm0A3 || "-"} | ${feature.isoA3 || "-"} | ${escapePipe(activityIds)} |`);
    } else {
      lines.push(`| ${escapePipe(feature.name)} | ${escapePipe(feature.adminName || "-")} | ${feature.type || "-"} | ${feature.continent || "-"} | ${feature.adm0A3 || "-"} | ${feature.isoA3 || "-"} | ${escapePipe(getSuggestedGroupLabel(feature))} |`);
    }
  });

  void groupByAuditId;
}

function getSuggestedGroupLabel(feature) {
  if (isTerritoryDisputedOrSpecial(feature)) {
    return "Territories / Disputed / Special Cases";
  }

  const template = groupingTemplates.find((group) => group.names.some((name) => normalizeName(name) === normalizeName(feature.name) || normalizeName(name) === normalizeName(feature.adminName)));
  if (template) {
    return template.title;
  }

  return feature.subregion || feature.continent || "World";
}

function appendCompactList(lines, items, formatter) {
  if (!items.length) {
    lines.push("- None.");
    return;
  }

  items.forEach((item) => lines.push(`- ${formatter(item)}`));
}

function isCountryTarget(target) {
  return target?.type === "country"
    || Boolean(target?.isoA3)
    || Boolean(target?.iso)
    || Boolean(target?.countryCode);
}

function isTerritoryDisputedOrSpecial(feature) {
  if (specialTypes.has(feature.type)) {
    return true;
  }

  if (feature.type === "Country" && feature.sovereign && feature.adminName && feature.sovereign !== feature.adminName) {
    return true;
  }

  if (feature.continent === "Antarctica" || feature.continent === "Seven seas (open ocean)") {
    return true;
  }

  return false;
}

function getSpecialCaseReason(feature) {
  if (specialTypes.has(feature.type)) {
    const usage = intentionallyUsedSpecialCases.has(feature.adm0A3) ? " Already intentionally used in an activity." : "";
    return `${feature.type} admin-0 feature.${usage}`.trim();
  }

  if (feature.type === "Country" && feature.sovereign && feature.adminName && feature.sovereign !== feature.adminName) {
    return `Country-type admin-0 under ${feature.sovereign}.`;
  }

  if (feature.continent === "Antarctica" || feature.continent === "Seven seas (open ocean)") {
    return "Non-standard continent/region admin-0 feature.";
  }

  return null;
}

function toSuggestionTarget(feature) {
  return {
    name: feature.name,
    adminName: feature.adminName,
    type: feature.type,
    continent: feature.continent,
    subregion: feature.subregion,
    adm0A3: feature.adm0A3,
    isoA3: feature.isoA3,
    specialCaseReason: feature.specialCaseReason
  };
}

function getFeatureLookupNames(feature) {
  return unique([
    feature.name,
    feature.adminName,
    feature.displayName,
    feature.nameLong
  ].filter(Boolean));
}

function priorityRegionScore(region) {
  const normalized = normalizeName(region);
  if (normalized.includes("africa")) {
    return 1;
  }
  if (normalized.includes("asia")) {
    return 2;
  }
  if (normalized.includes("europe")) {
    return 3;
  }
  if (normalized.includes("america")) {
    return 4;
  }
  return 5;
}

function isReviewActivity(activityId, activityTitle) {
  return /review/i.test(`${activityId || ""} ${activityTitle || ""}`);
}

function normalizeCode(value) {
  const normalized = String(value || "").trim().toUpperCase();
  return notCodeValues.has(normalized.toLowerCase()) ? null : normalized;
}

function normalizeName(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/['\u2019]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function slugify(value) {
  return normalizeName(value).replace(/\s+/g, "-");
}

function asNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function pushMapArray(map, key, value) {
  if (!map.has(key)) {
    map.set(key, []);
  }
  map.get(key).push(value);
}

function unique(values) {
  return [...new Set(values)];
}

function uniqueFeatures(features) {
  return uniqueBy(features, (feature) => feature.auditId);
}

function uniqueBy(items, getKey) {
  const seen = new Set();
  const result = [];

  items.forEach((item) => {
    const key = getKey(item);
    if (!seen.has(key)) {
      seen.add(key);
      result.push(item);
    }
  });

  return result;
}

function countBy(items, getKey) {
  return items.reduce((counts, item) => {
    const key = getKey(item);
    counts[key] = (counts[key] || 0) + 1;
    return counts;
  }, {});
}

function chunk(items, size) {
  const chunks = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}

function sortByContinentThenName(left, right) {
  return String(left.continent || "").localeCompare(String(right.continent || ""))
    || String(left.name || "").localeCompare(String(right.name || ""));
}

function toRepoRelativePath(absolutePath) {
  return path.relative(repoRoot, absolutePath).replace(/\\/g, "/");
}

function escapePipe(value) {
  return String(value).replace(/\|/g, "\\|");
}

main();
