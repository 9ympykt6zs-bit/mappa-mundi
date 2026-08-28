import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { normalizeActivity } from "../src/map-engines/activity-normalizer.js";
import { MapLibreActivityRunner } from "../src/maplibre/maplibre-activity-runner.js";
import { validateRetrievalTarget } from "../src/maplibre/learning-integrity.js";

const readJson = (path) => JSON.parse(readFileSync(new URL(path, import.meta.url), "utf8"));
const fixtures = [
  {
    country: "france",
    activity: "france-southern-regions-political-divisions.json",
    collectionProperty: "franceAdmin1",
    contextCount: 13,
    eligibleCount: 5,
    highlightId: "nouvelle-aquitaine",
    nonCurrentId: "brittany",
    alternateEligibleCount: 8
  },
  {
    country: "italy",
    activity: "italy-northern-regions-political-divisions.json",
    collectionProperty: "italyAdmin1",
    contextCount: 20,
    eligibleCount: 8,
    highlightId: "aosta-valley",
    nonCurrentId: "sicily",
    alternateEligibleCount: 10
  },
  {
    country: "germany",
    activity: "germany-north-east-political-divisions.json",
    collectionProperty: "germanyAdmin1",
    contextCount: 16,
    eligibleCount: 10,
    highlightId: "schleswig-holstein",
    nonCurrentId: "bavaria",
    alternateEligibleCount: 6
  }
];

for (const fixture of fixtures) {
  const activity = normalizeActivity(readJson(`../assets/maps/data/${fixture.activity}`));
  const runner = new MapLibreActivityRunner({ maplibregl: {}, container: null });
  runner.activity = activity;
  runner.shapeTargets = activity.targets.filter((target) => target.kind === "shape");
  runner[fixture.collectionProperty] = readJson(`../assets/maps/data/maplibre-${fixture.country}-admin1.geojson`);

  const context = runner.getPoliticalDivisionContextGeoJson();
  const eligible = runner.getTargetShapeGeoJson();
  assert.equal(context.features.length, fixture.contextCount, `${fixture.country} must render every subdivision as context.`);
  assert.equal(eligible.features.length, fixture.eligibleCount, `${fixture.country} eligibility must remain section-scoped.`);
  assert.equal(
    context.features.some((feature) => feature.properties.id === fixture.nonCurrentId),
    true,
    `${fixture.country} must retain non-current subdivisions as visible context.`
  );
  assert.equal(
    eligible.features.some((feature) => feature.properties.id === fixture.nonCurrentId),
    false,
    `${fixture.country} non-current subdivisions must not enter the hit-test source.`
  );

  runner.memoryTrailHighlightIds = [fixture.highlightId];
  const highlight = runner.getPoliticalDivisionGuidedHighlightGeoJson();
  const authoritativeFeature = runner[fixture.collectionProperty].features
    .find((feature) => feature.properties.id === fixture.highlightId);
  assert.deepEqual(
    highlight.features.map((feature) => feature.properties.id),
    [fixture.highlightId],
    `${fixture.highlightId} must have one authoritative guided-highlight feature.`
  );
  assert.deepEqual(
    highlight.features[0].geometry,
    authoritativeFeature.geometry,
    `${fixture.highlightId} must render its own authoritative source geometry.`
  );
  assert.equal(runner.getGuidedHighlightReadiness(
    activity.targets.find((target) => target.id === fixture.highlightId)
  ).ready, true);

  const visualState = runner.getPoliticalDivisionVisualState();
  assert.equal(visualState.highlightFillColor, "#f5c542");
  assert.equal(visualState.highlightLineColor, "#9a5f05");
  assert.ok(visualState.highlightFillOpacity >= 0.8);
  assert.ok(visualState.highlightLineWidth >= 4);

  const cameraBounds = runner.getEffectiveStudyView().bounds;
  const sectionBounds = runner.getFeatureCollectionBounds(eligible);
  assert.deepEqual(cameraBounds, sectionBounds, `${fixture.country} study framing must include the full active section.`);

  const staleTargetId = fixture.highlightId;
  const alternateActivityName = fixture.country === "france"
    ? "france-northern-eastern-regions-political-divisions.json"
    : fixture.country === "italy"
      ? "italy-central-southern-regions-political-divisions.json"
      : "germany-south-west-political-divisions.json";
  runner.activity = normalizeActivity(readJson(`../assets/maps/data/${alternateActivityName}`));
  runner.shapeTargets = runner.activity.targets.filter((target) => target.kind === "shape");
  const alternateContext = runner.getPoliticalDivisionContextGeoJson();
  const alternateEligible = runner.getTargetShapeGeoJson();
  assert.equal(alternateContext.features.length, fixture.contextCount);
  assert.equal(alternateEligible.features.length, fixture.alternateEligibleCount);
  assert.deepEqual(
    runner.getEffectiveStudyView().bounds,
    runner.getFeatureCollectionBounds(alternateEligible),
    `${fixture.country} alternate-section framing must include every active target.`
  );
  assert.equal(
    runner.getPoliticalDivisionGuidedHighlightGeoJson([staleTargetId]).features.length,
    0,
    `${fixture.country} must not render a stale highlight after changing sections.`
  );
}

const geometry = { type: "Polygon", coordinates: [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]] };
const target = { id: "render-check", name: "Render Check", kind: "shape" };
const missingHighlight = validateRetrievalTarget(target, {
  resolveShapeFeature: () => ({ type: "Feature", properties: { id: target.id }, geometry }),
  resolveEligibleFeature: () => ({ type: "Feature", properties: { id: target.id }, geometry }),
  requiresRenderedHighlight: true,
  resolveRenderedHighlight: () => null
});
assert.equal(missingHighlight.ready, false);
assert.equal(missingHighlight.reason, "missing-rendered-highlight-geometry");

const missingEligibleHit = validateRetrievalTarget(target, {
  resolveShapeFeature: () => ({ type: "Feature", properties: { id: target.id }, geometry }),
  resolveEligibleFeature: () => null
});
assert.equal(missingEligibleHit.ready, false);
assert.equal(missingEligibleHit.reason, "missing-eligible-hit-geometry");
assert.equal(missingEligibleHit.sourceReady, true);
assert.equal(missingEligibleHit.eligibleHitReady, false);

const missingSourceGeometry = validateRetrievalTarget(target, {
  resolveShapeFeature: () => null
});
assert.equal(missingSourceGeometry.ready, false);
assert.equal(missingSourceGeometry.reason, "missing-target-geometry");
assert.equal(missingSourceGeometry.sourceReady, false);

console.log("Political-division context, section eligibility, guided highlights, framing, and render integrity are structurally valid.");
