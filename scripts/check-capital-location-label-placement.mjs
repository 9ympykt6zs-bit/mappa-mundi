import assert from "node:assert/strict";

import { US_CAPITAL_LOCATION_CITY_CHOICES } from "../src/atlas/us-capital-location-city-choices.js";
import {
  capitalLocationLabelRectsOverlap,
  layoutCapitalLocationFeedbackLabels
} from "../src/maplibre/capital-location-feedback-labels.js";

const stateFixtures = ["colorado", "connecticut", "rhode-island", "delaware", "texas"];

function mercatorPoint(lon, lat, { center, zoom, width, height }) {
  const worldSize = 512 * (2 ** zoom);
  const project = ([longitude, latitude]) => {
    const x = (longitude + 180) / 360 * worldSize;
    const sin = Math.sin(latitude * Math.PI / 180);
    const y = (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * worldSize;
    return { x, y };
  };
  const projected = project([lon, lat]);
  const projectedCenter = project(center);
  return { x: width / 2 + projected.x - projectedCenter.x, y: height / 2 + projected.y - projectedCenter.y };
}

function createLayoutInput(stateId, viewport, zoom) {
  const record = US_CAPITAL_LOCATION_CITY_CHOICES.find((candidate) => candidate.stateId === stateId);
  assert.ok(record, stateId);
  const choices = [
    { ...record.capital, role: "capital", choiceIndex: 0, isSelected: false },
    ...record.distractors.map((choice, index) => ({ ...choice, id: `${stateId}:city-${index + 1}`, role: "distractor", choiceIndex: index, isSelected: false }))
  ];
  const center = [record.capital.lon, record.capital.lat];
  const labels = choices.map((choice) => ({
    ...choice,
    point: mercatorPoint(choice.lon, choice.lat, { center, zoom, ...viewport }),
    width: choice.name.length * 7.2 + 12,
    height: choice.role === "capital" ? 24 : 20,
    markerRadius: choice.role === "capital" ? 18 : 10
  }));
  return {
    labels,
    markerObstacles: labels.map((label) => ({
      id: label.id,
      revealed: true,
      rect: {
        x: label.point.x - label.markerRadius,
        y: label.point.y - label.markerRadius,
        width: label.markerRadius * 2,
        height: label.markerRadius * 2
      }
    })),
    viewport
  };
}

function assertCollisionFree(layout, expectedCount, markerObstacles = []) {
  assert.equal(layout.placements.length, expectedCount);
  assert.equal(layout.placements[0].role, "capital", "The capital is placed first.");
  layout.placements.forEach((placement, index) => {
    assert.ok(placement.box.x >= 10 && placement.box.y >= 10);
    assert.ok(placement.box.right <= layout.viewport.width - 10);
    assert.ok(placement.box.bottom <= layout.viewport.height - 10);
    if (placement.role !== "capital") {
      assert.equal(capitalLocationLabelRectsOverlap(placement.box, layout.capitalStarRect, 2), false);
    }
    layout.placements.slice(0, index).forEach((prior) => {
      assert.equal(capitalLocationLabelRectsOverlap(placement.box, prior.box, 4), false);
    });
    markerObstacles.filter(({ id }) => id !== placement.id).forEach((marker) => {
      assert.equal(
        capitalLocationLabelRectsOverlap(placement.box, marker.rect, marker.revealed ? 1 : 0),
        false,
        `${placement.id} label must clear ${marker.id} marker`
      );
    });
    if (placement.leader) {
      assert.ok(placement.gapPx >= layout.leaderGap);
      assert.ok([placement.leader.start.x, placement.leader.start.y, placement.leader.end.x, placement.leader.end.y].every(Number.isFinite));
    }
  });
}

for (const stateId of stateFixtures) {
  for (const fixture of [
    { viewport: { width: 1100, height: 680 }, zoom: 5.5 },
    { viewport: { width: 390, height: 620 }, zoom: 4.8 },
    { viewport: { width: 760, height: 520 }, zoom: 7.2 }
  ]) {
    const input = createLayoutInput(stateId, fixture.viewport, fixture.zoom);
    const immutableSnapshot = structuredClone(input.labels);
    const first = layoutCapitalLocationFeedbackLabels(input);
    const second = layoutCapitalLocationFeedbackLabels(input);
    assert.deepEqual(second, first, `${stateId} placement is deterministic.`);
    assert.deepEqual(input.labels, immutableSnapshot, `${stateId} coordinates and label inputs remain unchanged.`);
    assertCollisionFree(first, 3, input.markerObstacles);
  }
}

const denseInput = {
  viewport: { width: 390, height: 420 },
  labels: [
    { id: "capital", name: "Capital City", role: "capital", choiceIndex: 0, point: { x: 195, y: 210 }, width: 92, height: 24, markerRadius: 18 },
    { id: "selected", name: "Selected Wrong City", role: "distractor", choiceIndex: 0, isSelected: true, point: { x: 201, y: 211 }, width: 126, height: 20, markerRadius: 10 },
    { id: "city-1", name: "Nearby City One", role: "distractor", choiceIndex: 1, point: { x: 205, y: 216 }, width: 104, height: 20, markerRadius: 10 },
    { id: "city-2", name: "Nearby City Two", role: "distractor", choiceIndex: 2, point: { x: 189, y: 218 }, width: 104, height: 20, markerRadius: 10 }
  ]
};
denseInput.markerObstacles = denseInput.labels.map((label) => ({
  id: label.id,
  revealed: true,
  rect: { x: label.point.x - label.markerRadius, y: label.point.y - label.markerRadius, width: label.markerRadius * 2, height: label.markerRadius * 2 }
}));
const denseLayout = layoutCapitalLocationFeedbackLabels(denseInput);
assertCollisionFree(denseLayout, 4, denseInput.markerObstacles);
assert.equal(denseLayout.placements[1].id, "selected", "A selected wrong city receives second placement priority.");

const displacedLayout = layoutCapitalLocationFeedbackLabels({
  labels: [denseInput.labels[0]],
  markerObstacles: [denseInput.markerObstacles[0]],
  viewport: denseInput.viewport,
  controlRects: [
    { x: 149, y: 162, width: 92, height: 24 },
    { x: 219, y: 162, width: 92, height: 24 },
    { x: 51, y: 162, width: 92, height: 24 },
    { x: 219, y: 198, width: 92, height: 24 },
    { x: 51, y: 198, width: 92, height: 24 },
    { x: 149, y: 234, width: 92, height: 24 },
    { x: 219, y: 234, width: 92, height: 24 },
    { x: 51, y: 234, width: 92, height: 24 }
  ]
});
assert.ok(displacedLayout.placements[0].leader, "A label displaced beyond the first ring uses a leader.");

const wideInput = createLayoutInput("texas", { width: 1100, height: 680 }, 7.2);
const wideLayout = layoutCapitalLocationFeedbackLabels(wideInput);
assert.ok(wideLayout.placements.every(({ leader }) => !leader), "Widely separated labels do not add unnecessary leaders.");

console.log("Capital-location feedback label placement passed for Colorado, Connecticut, Rhode Island, Delaware, Texas, dense four-label feedback, responsive viewports, and multiple zoom levels.");
