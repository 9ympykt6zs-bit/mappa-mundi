import assert from "node:assert/strict";
import fs from "node:fs";
import { coastlineDisplayCleanup, createCoastlineDisplayGeoJson } from "../src/maplibre/coastline-display-geometry.js";

const source = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: { id: "coast" },
      geometry: {
        type: "MultiPolygon",
        coordinates: [
          [[[-70, 40], [-69.8, 40], [-69.6, 40], [-69.6, 40.4], [-70, 40.4], [-70, 40]]],
          [[[-65, 45], [-64.995, 45], [-64.995, 45.005], [-65, 45.005], [-65, 45]]]
        ]
      }
    },
    {
      type: "Feature",
      properties: { id: "river", physicalFeatureType: "river" },
      geometry: {
        type: "Polygon",
        coordinates: [[[-80, 30], [-79, 30], [-79, 31], [-80, 31], [-80, 30]]]
      }
    }
  ]
};
const authoritativeBefore = JSON.stringify(source);
const display = createCoastlineDisplayGeoJson(source);

assert.equal(JSON.stringify(source), authoritativeBefore, "Display cleanup must not mutate authoritative geometry.");
assert.equal(display.features.length, 2);
assert.equal(display.features[0].geometry.coordinates.length, 1, "Tiny exterior display slivers must be removed.");
assert.equal(
  display.features[1],
  source.features[1],
  "Physical-feature geometry must bypass coastline display cleanup."
);

const smallSinglePolygon = {
  type: "FeatureCollection",
  features: [{
    type: "Feature",
    properties: { id: "small-island-country" },
    geometry: {
      type: "Polygon",
      coordinates: [[[10, 10], [10.002, 10], [10.002, 10.002], [10, 10.002], [10, 10]]]
    }
  }]
};
assert.equal(
  createCoastlineDisplayGeoJson(smallSinglePolygon).features.length,
  1,
  "A standalone small country or island must not be removed by display cleanup."
);

const runnerSource = fs.readFileSync(new URL("../src/maplibre/maplibre-activity-runner.js", import.meta.url), "utf8");
[
  'this.map.addSource("world-countries-display",',
  'this.map.addSource("us-states-atlas-display",',
  'this.map.addSource("target-shapes-display",',
  'source: "world-countries-display",',
  'source: "target-shapes-display",',
  'id: "world-land",',
  '"fill-opacity": 0.01,',
  'layers: ["target-hit-fill", "river-hit-line"]',
  'getRenderedNavigationFeatures(queryPoint, "world-land", "world-country")'
].forEach((hook) => assert.ok(runnerSource.includes(hook), `Missing visual/hit separation hook: ${hook}`));
assert.match(
  runnerSource,
  /id: "target-hit-fill",\s+type: "fill",\s+source: "target-shapes"/,
  "Target hit testing must retain the authoritative target-shapes source."
);
assert.match(
  runnerSource,
  /id: "us-state-context-fill",\s+type: "fill",\s+source: "us-states-atlas-display"/,
  "U.S. state context fills must use display-only state geometry."
);
assert.match(
  runnerSource,
  /id: "us-state-context-line",\s+type: "line",\s+source: "us-states-atlas-display"/,
  "U.S. state context borders must match the cleaned display geometry."
);
assert.match(
  runnerSource,
  /id: "us-state-context-hit",\s+type: "fill",\s+source: "us-states-atlas"/,
  "U.S. state navigation must retain authoritative geometry."
);
assert.ok(
  runnerSource.includes('getRenderedNavigationFeatures(queryPoint, "us-state-context-hit", "us-state")'),
  "State navigation must query the authoritative hit layer instead of a visual-only layer."
);
assert.ok(
  !runnerSource.includes('getRenderedNavigationFeatures(queryPoint, "us-state-context-fill", "us-state")'),
  "State navigation must not query the cleaned display layer."
);

const stateFillLayerIndex = runnerSource.indexOf('id: "state-fill"');
const waterMaskLayerIndex = runnerSource.indexOf('id: "coastal-water-mask-fill"');
const countryBorderLayerIndex = runnerSource.indexOf('id: "country-borders"');
const parentOutlineLayerIndex = runnerSource.indexOf('id: "parent-country-outline-halo"', waterMaskLayerIndex);
const stateLineLayerIndex = runnerSource.indexOf('id: "state-line"', waterMaskLayerIndex);
assert.ok(runnerSource.includes('this.map.addSource("coastal-water-mask",'), "Missing display-only coastal water source.");
assert.ok(stateFillLayerIndex >= 0 && waterMaskLayerIndex > stateFillLayerIndex, "Coastal water mask must render after state fills.");
assert.ok(countryBorderLayerIndex >= 0 && countryBorderLayerIndex < waterMaskLayerIndex, "Coastal water mask must cover neutral country-border exteriors at the coastline.");
assert.ok(parentOutlineLayerIndex > waterMaskLayerIndex, "Coastal water mask must render below parent outlines.");
assert.ok(stateLineLayerIndex > waterMaskLayerIndex, "Coastal water mask must render below target outlines.");
assert.ok(!runnerSource.includes('this.map.moveLayer("country-borders", "parent-country-outline-halo")'), "Neutral country borders must remain below the water mask so they do not create a coastline seam.");
assert.ok(!runnerSource.includes('layers: ["coastal-water-mask-fill"]'), "Click/tap queries must not include the coastal water mask.");
assert.ok(!runnerSource.includes('layers: ["coastal-water-mask"]'), "Click/tap queries must not include the coastal water source.");

const coastalWaterMask = JSON.parse(fs.readFileSync(
  new URL("../assets/maps/data/coastal-water-mask.geojson", import.meta.url),
  "utf8"
));
assert.equal(coastalWaterMask.type, "FeatureCollection");
assert.ok(coastalWaterMask.features.length > 1, "Coastal water mask must split the global ocean into bounded render-safe features.");
assert.equal(
  coastalWaterMask.properties?.source,
  "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_ocean.geojson",
  "Coastal water mask must identify its reproducible Natural Earth source."
);
assert.deepEqual(coastalWaterMask.properties?.tiling, {
  widthDegrees: 45,
  heightDegrees: 30,
  topologyPreserving: true
}, "Coastal water mask must identify its topology-preserving regional tiling.");
assert.ok(countCoordinates(coastalWaterMask) > 0, "Coastal water mask must contain polygon coordinates.");
assert.ok(
  coastalWaterMask.features.every((feature) => !feature.properties?.id && !feature.properties?.targetId),
  "Visual coastal water geometry must not introduce answer target ids."
);
assert.ok(
  coastalWaterMask.features.every((feature) => feature.geometry?.type === "Polygon" && isValidPolygon(feature.geometry.coordinates)),
  "Every render-safe coastal water feature must have closed, in-range, consistently wound polygon rings."
);
assert.ok(
  Math.max(...coastalWaterMask.features.map((feature) => countCoordinates(feature.geometry))) < 50_000,
  "No individual coastal water feature may retain the unsafe near-global tessellation size."
);
[
  ["Maine / Penobscot Bay", [-68.85, 44.30]],
  ["Gulf Coast", [-89, 27]],
  ["Pacific Northwest / Puget Sound", [-122.50, 47.65]],
  ["Indonesia", [123, -2]]
].forEach(([name, point]) => {
  assert.ok(pointInFeatureCollection(point, coastalWaterMask), `${name} must be present in the visual coastal water mask.`);
});
[
  ["Texas", [-99, 31]],
  ["Louisiana", [-92, 31]],
  ["Mexico", [-100, 25]]
].forEach(([name, point]) => {
  assert.ok(!pointInFeatureCollection(point, coastalWaterMask), `${name} must not be covered by the coastal water mask.`);
});

const worldCountries = JSON.parse(fs.readFileSync(
  new URL("../assets/maps/data/maplibre-world-countries.geojson", import.meta.url),
  "utf8"
));
const worldDisplay = createCoastlineDisplayGeoJson(worldCountries);
assert.equal(worldDisplay.features.length, worldCountries.features.length, "Display cleanup must retain every country feature.");
[
  "USA", // Maine / Northeast, Gulf Coast, and Pacific Northwest context
  "CAN", // irregular North Atlantic / Pacific coastline
  "IDN" // international archipelago coastline
].forEach((isoA3) => {
  const original = worldCountries.features.find((feature) => feature.properties?.ADM0_A3 === isoA3);
  const cleaned = worldDisplay.features.find((feature) => feature.properties?.ADM0_A3 === isoA3);
  assert.ok(original && cleaned, `Missing ${isoA3} visual coastline fixture.`);
  assert.equal(cleaned.geometry.type, original.geometry.type, `${isoA3} display geometry type changed.`);
  assert.ok(countVertices(cleaned.geometry) <= countVertices(original.geometry), `${isoA3} display geometry added coastline noise.`);
});

const stateAtlas = JSON.parse(fs.readFileSync(
  new URL("../assets/maps/data/maplibre-us-states-atlas.geojson", import.meta.url),
  "utf8"
).replace(/^\uFEFF/, ""));
const stateDisplay = createCoastlineDisplayGeoJson(stateAtlas);
["maine", "alabama", "washington"].forEach((stateId) => {
  const original = stateAtlas.features.find((feature) => feature.properties?.id === stateId);
  const cleaned = stateDisplay.features.find((feature) => feature.properties?.id === stateId);
  assert.ok(original && cleaned, `Missing ${stateId} coastline fixture.`);
  assert.equal(cleaned.geometry.type, original.geometry.type, `${stateId} display geometry type changed.`);
  assert.ok(countVertices(cleaned.geometry) <= countVertices(original.geometry), `${stateId} display geometry added coastline noise.`);
});
assert.ok(
  stateDisplay.features.every((feature, index) => (
    JSON.stringify(feature.properties) === JSON.stringify(stateAtlas.features[index]?.properties)
  )),
  "Display cleanup must retain state fill-owner properties exactly."
);
stateDisplay.features.forEach((feature) => {
  if (feature.geometry?.type !== "MultiPolygon") {
    return;
  }

  const polygonAreas = feature.geometry.coordinates.map((polygon) => ringArea(polygon[0]));
  const largestArea = Math.max(...polygonAreas);
  const minimumArea = feature.geometry.coordinates.length >= coastlineDisplayCleanup.denseMultipartComponentCount
    ? coastlineDisplayCleanup.denseMultipartMinExteriorAreaDegrees
    : coastlineDisplayCleanup.minExteriorAreaDegrees;

  polygonAreas.forEach((area) => {
    assert.ok(
      area === largestArea || area >= minimumArea,
      "Display-only state geometry must not retain detached sub-threshold fragments."
    );
  });
});
const maineSource = stateAtlas.features.find((feature) => feature.properties?.id === "maine");
const maineDisplay = stateDisplay.features.find((feature) => feature.properties?.id === "maine");
assert.ok(
  countPolygonParts(maineDisplay.geometry) < countPolygonParts(maineSource.geometry),
  "Maine display geometry must suppress tiny coastal slivers."
);
assert.equal(
  countPolygonParts(maineDisplay.geometry),
  1,
  "Maine's dense multipart display geometry must retain its mainland while returning coastal fragments to water."
);

console.log("Coastline visual-layer separation check passed:", JSON.stringify({
  authoritativeFeatures: source.features.length,
  displayFeatures: display.features.length,
  displayPolygonsAfterSliverFilter: display.features[0].geometry.coordinates.length,
  representativeCoastlines: ["Maine / Northeast", "Alabama / Gulf Coast", "Washington / Pacific Northwest", "Indonesia"],
  coastalWaterMaskCoordinates: countCoordinates(coastalWaterMask),
  authoritativeHitLayers: ["world-land", "target-hit-fill", "river-hit-line"]
}));

function countVertices(geometry) {
  if (geometry.type === "Polygon") {
    return geometry.coordinates.flat().length;
  }

  if (geometry.type === "MultiPolygon") {
    return geometry.coordinates.flat(2).length;
  }

  return 0;
}

function countPolygonParts(geometry) {
  return geometry.type === "MultiPolygon" ? geometry.coordinates.length : 1;
}

function countCoordinates(value) {
  if (!value) {
    return 0;
  }
  if (Array.isArray(value)) {
    return value.length > 0 && typeof value[0] === "number"
      ? 1
      : value.reduce((sum, entry) => sum + countCoordinates(entry), 0);
  }
  if (value.type === "FeatureCollection") {
    return countCoordinates(value.features);
  }
  if (value.type === "Feature") {
    return countCoordinates(value.geometry);
  }
  return countCoordinates(value.coordinates);
}

function pointInGeometry(point, geometry) {
  const polygons = geometry.type === "Polygon" ? [geometry.coordinates] : geometry.coordinates;
  return polygons.some((polygon) => pointInRing(point, polygon[0]) && !polygon.slice(1).some((ring) => pointInRing(point, ring)));
}

function pointInFeatureCollection(point, featureCollection) {
  return featureCollection.features.some((feature) => pointInGeometry(point, feature.geometry));
}

function pointInRing(point, ring) {
  let inside = false;
  for (let index = 0, previous = ring.length - 1; index < ring.length; previous = index++) {
    const [longitude, latitude] = ring[index];
    const [previousLongitude, previousLatitude] = ring[previous];
    const crossesLatitude = (latitude > point[1]) !== (previousLatitude > point[1]);
    if (crossesLatitude && point[0] < ((previousLongitude - longitude) * (point[1] - latitude) / (previousLatitude - latitude)) + longitude) {
      inside = !inside;
    }
  }
  return inside;
}

function isValidPolygon(polygon) {
  return Array.isArray(polygon)
    && polygon.length > 0
    && polygon.every((ring, index) => {
      const area = signedArea(ring);
      return Array.isArray(ring)
        && ring.length >= 4
        && ring[0][0] === ring.at(-1)[0]
        && ring[0][1] === ring.at(-1)[1]
        && ring.every(([longitude, latitude]) => Number.isFinite(longitude) && Number.isFinite(latitude) && longitude >= -180 && longitude <= 180 && latitude >= -90 && latitude <= 90)
        && Math.abs(area) >= 1e-12
        && (index === 0 ? area > 0 : area < 0);
    });
}

function signedArea(ring) {
  return ring.slice(1).reduce((area, [longitude, latitude], index) => {
    const [previousLongitude, previousLatitude] = ring[index];
    return area + ((previousLongitude * latitude) - (longitude * previousLatitude));
  }, 0) / 2;
}

function ringArea(ring) {
  return Math.abs(signedArea(ring));
}
