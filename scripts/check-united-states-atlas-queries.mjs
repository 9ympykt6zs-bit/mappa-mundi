import assert from "node:assert/strict";
import {
  getBorderingStates,
  getConnectedMountainRanges,
  getConnectedRivers,
  getInternationalNeighbors,
  getMajorBorderingWaters,
  getMaritimeNeighbors,
  getStateCoasts,
  getStateById,
  getStateCapital,
  getStateProfile,
  getStateRegion,
  searchStates
} from "../src/atlas/united-states-atlas-queries.js";

assert.deepEqual(
  getBorderingStates("tennessee").map((state) => state.name),
  ["Alabama", "Arkansas", "Georgia", "Kentucky", "Mississippi", "Missouri", "North Carolina", "Virginia"]
);
assert.deepEqual(getStateCapital("louisiana"), { id: "baton-rouge", name: "Baton Rouge" });
assert.deepEqual(getStateRegion("maine"), { id: "northeast", name: "Northeast" });
assert.ok(getConnectedMountainRanges("colorado").some((range) => range.name === "Rocky Mountains"));
assert.deepEqual(getConnectedRivers("mississippi"), [{ id: "mississippi-river", name: "Mississippi River" }]);
assert.deepEqual(getInternationalNeighbors("texas").map((country) => country.name), ["Mexico"]);
assert.deepEqual(getInternationalNeighbors("maine").map((country) => country.name), ["Canada"]);
assert.deepEqual(getStateCoasts("florida").map((water) => water.name), ["Atlantic Ocean", "Gulf of Mexico"]);
assert.deepEqual(getStateCoasts("california").map((water) => water.name), ["Pacific Ocean"]);
assert.deepEqual(getStateCoasts("alaska").map((water) => water.name), ["Arctic Ocean", "Pacific Ocean"]);
assert.deepEqual(getInternationalNeighbors("alaska").map((country) => country.name), ["Canada"]);
assert.deepEqual(getMaritimeNeighbors("alaska").map((country) => ({ name: country.name, context: country.context })), [{ name: "Russia", context: "Across the Bering Strait" }]);
assert.deepEqual(getMajorBorderingWaters("michigan").map((water) => water.name), ["Lake Erie", "Lake Huron", "Lake Michigan", "Lake Superior"]);
assert.deepEqual(getStateCoasts("colorado"), []);
assert.deepEqual(getInternationalNeighbors("colorado"), []);
assert.deepEqual(searchStates("tn"), [{ id: "tennessee", name: "Tennessee", abbreviation: "TN" }]);
assert.equal(getStateById("unknown-state"), null);
assert.equal(getStateProfile("unknown-state"), null);
assert.deepEqual(getBorderingStates("unknown-state"), []);
assert.deepEqual(getInternationalNeighbors("unknown-state"), []);
assert.deepEqual(getMaritimeNeighbors("unknown-state"), []);
assert.deepEqual(getStateCoasts("unknown-state"), []);
assert.deepEqual(getMajorBorderingWaters("unknown-state"), []);

const profile = getStateProfile("maine");
profile.name = "Changed";
profile.borderingStates.push({ id: "example", name: "Example" });
profile.region.name = "Changed region";
getStateCoasts("florida")[1].alternateNames.push("Changed");
const freshProfile = getStateProfile("maine");
assert.equal(freshProfile.name, "Maine");
assert.equal(freshProfile.region.name, "Northeast");
assert.equal(freshProfile.borderingStates.length, 1);
assert.deepEqual(getStateCoasts("florida")[1].alternateNames, ["Gulf of America"]);

console.log("United States atlas query adapter check passed:", JSON.stringify({
  tennesseeBorders: getBorderingStates("tennessee").length,
  coloradoMountainRanges: getConnectedMountainRanges("colorado").length,
  mississippiRivers: getConnectedRivers("mississippi").length,
  alaskaMaritimeNeighbors: getMaritimeNeighbors("alaska").length
}));
