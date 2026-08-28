import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  evaluateMapTargetSelection,
  isUsableRetrievalGeometry,
  validateMapRetrievalActivity,
  validateRetrievalTarget
} from "../src/maplibre/learning-integrity.js";
import { normalizeActivity } from "../src/map-engines/activity-normalizer.js";

const validPolygon = {
  type: "Polygon",
  coordinates: [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]]
};
const validFeature = { type: "Feature", properties: { id: "valid-region" }, geometry: validPolygon };
const validTarget = { id: "valid-region", name: "Valid Region", kind: "shape" };
const malformedTarget = { id: "missing-region", name: "Missing Region", kind: "shape" };
const resolver = (target) => target.id === validTarget.id ? validFeature : null;

assert.equal(isUsableRetrievalGeometry(validPolygon), true);
assert.equal(isUsableRetrievalGeometry({ type: "Polygon", coordinates: [] }), false);
assert.equal(isUsableRetrievalGeometry({ type: "Unsupported", coordinates: [[0, 0]] }), false);
assert.equal(validateRetrievalTarget({ name: "No identity", kind: "shape" }, { resolveShapeFeature: resolver }).reason, "missing-target-id");
assert.equal(validateRetrievalTarget(malformedTarget, { resolveShapeFeature: resolver }).reason, "missing-target-geometry");

const malformedActivity = {
  id: "malformed-activity-fixture",
  title: "Malformed fixture",
  targets: [validTarget, malformedTarget]
};
const malformedReadiness = validateMapRetrievalActivity(malformedActivity, { resolveShapeFeature: resolver });
assert.equal(malformedReadiness.ready, false, "An activity with one missing target geometry must not start retrieval.");
assert.deepEqual(malformedReadiness.invalidTargets.map(({ targetId }) => targetId), ["missing-region"]);
assert.equal(
  evaluateMapTargetSelection(malformedTarget, ["missing-region"], { resolveShapeFeature: resolver }).status,
  "blocked",
  "Even a matching candidate ID cannot score when its target geometry is absent."
);
assert.equal(evaluateMapTargetSelection(validTarget, ["somewhere-else"], { resolveShapeFeature: resolver }).status, "incorrect");
assert.equal(evaluateMapTargetSelection(validTarget, ["valid-region"], { resolveShapeFeature: resolver }).status, "correct");

const readJson = (path) => JSON.parse(readFileSync(new URL(path, import.meta.url), "utf8"));
for (const country of ["germany", "france", "italy"]) {
  const geometry = readJson(`../assets/maps/data/maplibre-${country}-admin1.geojson`);
  const sourceById = new Map(geometry.features.map((feature) => [feature.properties?.id, feature]));
  const activityPaths = {
    germany: [
      "germany-north-east-political-divisions.json",
      "germany-south-west-political-divisions.json"
    ],
    france: [
      "france-northern-eastern-regions-political-divisions.json",
      "france-southern-regions-political-divisions.json"
    ],
    italy: [
      "italy-northern-regions-political-divisions.json",
      "italy-central-southern-regions-political-divisions.json",
      "italy-islands-political-divisions.json"
    ]
  }[country];

  for (const activityPath of activityPaths) {
    const activity = normalizeActivity(readJson(`../assets/maps/data/${activityPath}`));
    const readiness = validateMapRetrievalActivity(activity, {
      resolveShapeFeature: (target) => sourceById.get(target.sourceFeatureId || target.id) || null
    });
    assert.equal(readiness.ready, true, `${activity.id} must have valid geometry for every target.`);
  }
}

console.log("Map-learning integrity blocks malformed retrieval and validates every globe-enabled European country activity.");
