import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { MapLibreActivityRunner, difficultyModes } from "../src/maplibre/maplibre-activity-runner.js";

const mountainRanges = JSON.parse(readFileSync(
  new URL("../assets/data/physical-features/us-mountain-ranges.geojson", import.meta.url),
  "utf8"
));
const rockyMountainsFeature = mountainRanges.features.find(({ properties }) => properties?.id === "rocky-mountains");
assert.ok(rockyMountainsFeature, "Rocky Mountains source feature must remain available");

function createRunner({ studyPreviewMode = false, selectedTargetId = "", completedIds = [] } = {}) {
  const runner = Object.create(MapLibreActivityRunner.prototype);
  const rockyMountainsTarget = {
    id: "rocky-mountains",
    name: "Rocky Mountains",
    type: "mountain-range",
    kind: "shape",
    label: { anchor: [-109.2, 41.1] }
  };

  Object.assign(runner, {
    activity: {
      id: "us-mountain-ranges",
      targets: [rockyMountainsTarget]
    },
    shapeTargets: [rockyMountainsTarget],
    mountainRanges,
    difficulty: difficultyModes.medium,
    studyPreviewMode,
    selectedTargetId,
    completedIds,
    memoryTrailHighlightIds: [],
    memoryTrailCorrectHighlightIds: [],
    memoryTrailWrongHighlightIds: [],
    memoryTrailCheckpointPreAnswerStyle: false,
    memoryTrailSuppressStudyTargetEmphasis: false
  });

  return runner;
}

function evaluateExpression(expression, properties = {}) {
  if (!Array.isArray(expression)) return expression;

  const [operator, ...args] = expression;
  if (operator === "literal") return args[0];
  if (operator === "get") return properties[args[0]];
  if (operator === "boolean") return Boolean(evaluateExpression(args[0], properties) ?? args[1]);
  if (operator === "in") return evaluateExpression(args[1], properties).includes(evaluateExpression(args[0], properties));
  if (operator === "==") return evaluateExpression(args[0], properties) === evaluateExpression(args[1], properties);
  if (operator === "coalesce") {
    for (const value of args) {
      const evaluated = evaluateExpression(value, properties);
      if (evaluated !== null && evaluated !== undefined) return evaluated;
    }
    return null;
  }
  if (operator === "*") return args.reduce((product, value) => product * evaluateExpression(value, properties), 1);
  if (operator === "+") return args.reduce((sum, value) => sum + evaluateExpression(value, properties), 0);
  if (operator === "min") return Math.min(...args.map((value) => evaluateExpression(value, properties)));
  if (operator === "case") {
    for (let index = 0; index < args.length - 1; index += 2) {
      if (evaluateExpression(args[index], properties)) return evaluateExpression(args[index + 1], properties);
    }
    return evaluateExpression(args.at(-1), properties);
  }

  throw new Error(`Unsupported expression operator: ${operator}`);
}

const locatingRunner = createRunner({ selectedTargetId: "rocky-mountains" });
assert.deepEqual(
  locatingRunner.getActiveTargetVisualIds(),
  ["rocky-mountains"],
  "generic physical-feature selection state must remain available"
);
assert.deepEqual(
  locatingRunner.getMountainRangeActiveTargetVisualIds(),
  [],
  "picking up a mountain-range chip must not expose its map target"
);
assert.ok(
  evaluateExpression(locatingRunner.getMountainRangeSymbolOpacityExpression(), {
    targetId: "rocky-mountains",
    symbolOpacity: 0.62,
    visualOnlyContinuation: false
  }) < 1,
  "selected mountain artwork must retain its ordinary locating opacity"
);

const studyRunner = createRunner({ studyPreviewMode: true, selectedTargetId: "rocky-mountains" });
assert.deepEqual(
  studyRunner.getMountainRangeActiveTargetVisualIds(),
  ["rocky-mountains"],
  "Study preview must retain intentional selected-target highlighting"
);
assert.equal(
  evaluateExpression(studyRunner.getMountainRangeSymbolOpacityExpression(), {
    targetId: "rocky-mountains",
    symbolOpacity: 0.62,
    visualOnlyContinuation: false
  }),
  1,
  "Study preview must retain its emphasized mountain artwork"
);

const completedRunner = createRunner({ completedIds: ["rocky-mountains", "other-completed-shape"] });
assert.equal(
  evaluateExpression(completedRunner.getShapeFillOpacityExpression(), {
    id: "rocky-mountains",
    physicalFeatureType: "mountain-range",
    hasStylizedMountainRangeArt: true,
    isOceanZone: false
  }),
  0,
  "completed stylized mountains must not receive the generic solid target overlay"
);
assert.equal(
  evaluateExpression(completedRunner.getShapeFillOpacityExpression(), {
    id: "other-completed-shape",
    physicalFeatureType: "lake",
    hasStylizedMountainRangeArt: false,
    isOceanZone: false
  }),
  0.96,
  "unrelated completed physical-feature styling must remain unchanged"
);

const mountainSymbols = completedRunner.getMountainRangeSymbolGeoJson().features;
const mountainCorridors = completedRunner.getMountainRangeCorridorGeoJson().features;
assert.ok(mountainSymbols.length > 0, "stylized mountain symbols must remain present");
assert.ok(mountainCorridors.length > 0, "stylized mountain corridors must remain present");
assert.ok(
  mountainSymbols.every(({ properties }) => properties.targetId === "rocky-mountains"),
  "generated mountain artwork must remain associated with the scored target"
);
assert.deepEqual(
  completedRunner.getCompletedLabelGeoJson().features.map(({ properties }) => properties.name),
  ["Rocky Mountains"],
  "completed mountain labels must remain present"
);

console.log("Mountain-range locating visuals preserve retrieval, Study highlighting, artwork, and completed labels.");
