import assert from "node:assert/strict";

import {
  chooseUnitedStatesCapitalRetrievalPromptType,
  getSuccessfulCapitalNamingTargetIds
} from "../src/united-states-capital-retrieval-sequencing.js";

const capitalItem = {
  id: "capital:denver-co",
  type: "capital",
  targetId: "denver-co",
  relatedStateTargetId: "colorado"
};
const event = (overrides = {}) => ({
  conceptId: "capital-naming:colorado:denver-co",
  skillId: "identifying",
  outcome: "correct",
  ...overrides
});

assert.deepEqual(
  getSuccessfulCapitalNamingTargetIds([capitalItem], { events: [
    event({ conceptId: "capital-location:colorado:denver-co", skillId: "locating", outcome: "assisted" }),
    event({ outcome: "incorrect" })
  ] }),
  [],
  "Teaching exposure and an incorrect naming answer must not unlock capital locating."
);
assert.deepEqual(
  getSuccessfulCapitalNamingTargetIds([capitalItem], { events: [event(), event()] }),
  ["denver-co"],
  "A persisted correct naming event unlocks the harder locating form without duplicating the target."
);

const freshStats = {
  placeToNameAttempts: 0,
  placeToNameCorrect: 0,
  placeToNameIncorrect: 0,
  nameToPlaceAttempts: 0,
  nameToPlaceCorrect: 0,
  nameToPlaceIncorrect: 0
};
assert.equal(
  chooseUnitedStatesCapitalRetrievalPromptType({ stats: freshStats }),
  "place_to_name",
  "A newly taught capital starts with highlighted-place naming."
);
assert.equal(
  chooseUnitedStatesCapitalRetrievalPromptType({ stats: freshStats, hasPriorNamingSuccess: true }),
  "name_to_place",
  "Persisted successful naming evidence allows later map locating."
);
assert.equal(
  chooseUnitedStatesCapitalRetrievalPromptType({
    stats: { ...freshStats, placeToNameAttempts: 1, placeToNameCorrect: 1 }
  }),
  "name_to_place",
  "A successful in-session naming answer allows later map locating."
);
assert.equal(
  chooseUnitedStatesCapitalRetrievalPromptType({
    stats: {
      ...freshStats,
      placeToNameAttempts: 2,
      placeToNameCorrect: 1,
      nameToPlaceAttempts: 2,
      nameToPlaceIncorrect: 2
    }
  }),
  "place_to_name",
  "Repeated locating misses return a capital to the simpler naming form."
);
assert.equal(
  chooseUnitedStatesCapitalRetrievalPromptType({
    stats: { ...freshStats, placeToNameCorrect: 1 },
    preferEasier: true
  }),
  "place_to_name",
  "Difficulty reduction uses naming as the easier capital prompt."
);

console.log("Guided capital retrieval sequencing requires real naming success before map locating.");
