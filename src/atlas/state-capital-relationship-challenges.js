import { unitedStatesAtlas } from "./united-states-atlas-data.js";
import { MENTAL_MAP_ANSWER_MODES } from "./mental-map-challenges.js?v=20260721-mental-map-consolidation-1";

export const STATE_CAPITAL_PROMPT_DIRECTIONS = Object.freeze({
  STATE_TO_CAPITAL: "state-to-capital",
  CAPITAL_TO_STATE: "capital-to-state"
});

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

export function getStateCapitalRelationshipPairs(atlas = unitedStatesAtlas) {
  const entitiesById = new Map((atlas?.entities || []).map((entity) => [entity.id, entity]));
  return (atlas?.relationships || [])
    .filter(({ type }) => type === "capitalOf")
    .map((relationship) => {
      const capital = entitiesById.get(relationship.from);
      const state = entitiesById.get(relationship.to);
      if (capital?.kind !== "capital" || state?.kind !== "state") return null;
      const stateId = state.id.replace("state:", "");
      const capitalId = capital.id.replace("capital:", "");
      return {
        stateId,
        stateEntityId: state.id,
        stateName: state.name,
        capitalId,
        capitalEntityId: capital.id,
        capitalName: capital.name,
        conceptId: `state-capital:${stateId}:${capitalId}`
      };
    })
    .filter(Boolean)
    .sort((left, right) => left.stateName.localeCompare(right.stateName));
}

export function validateStateCapitalRelationshipPairs(pairs = getStateCapitalRelationshipPairs()) {
  const errors = [];
  if (pairs.length !== 50) errors.push(`Expected 50 state-capital relationships, found ${pairs.length}.`);
  const uniqueCount = (key) => new Set(pairs.map((pair) => pair[key])).size;
  if (uniqueCount("stateId") !== pairs.length) errors.push("Every state must appear in exactly one capital relationship.");
  if (uniqueCount("capitalEntityId") !== pairs.length) errors.push("Every state capital must belong to exactly one state.");
  if (uniqueCount("conceptId") !== pairs.length) errors.push("Every state-capital relationship must have one unique canonical concept.");
  if (pairs.some(({ stateId, capitalId }) => stateId === "district-of-columbia" || capitalId === "washington-dc")) {
    errors.push("Washington, D.C. is outside the current 50-state relationship scope.");
  }
  return errors;
}

function distractorPairs(pairs, index) {
  const offsets = [7, 19, 31];
  return offsets.map((offset) => pairs[(index + offset) % pairs.length]);
}

function createChallenge(pair, distractors, direction) {
  const stateToCapital = direction === STATE_CAPITAL_PROMPT_DIRECTIONS.STATE_TO_CAPITAL;
  const choices = [pair, ...distractors];
  return {
    id: `state-capital-${pair.stateId}-${direction}`,
    title: "Capital Connections",
    prompt: stateToCapital
      ? `What is the capital of ${pair.stateName}?`
      : `${pair.capitalName} is the capital of which state?`,
    answerMode: MENTAL_MAP_ANSWER_MODES.SINGLE_SELECT,
    correctStateIds: [pair.stateId],
    distractorStateIds: distractors.map(({ stateId }) => stateId),
    answerLabelsByStateId: Object.fromEntries(choices.map((choice) => [
      choice.stateId,
      stateToCapital ? choice.capitalName : choice.stateName
    ])),
    explanation: `${pair.capitalName} is the capital of ${pair.stateName}.`,
    associatedFeatureIds: [pair.capitalEntityId],
    referenceStateId: pair.stateId,
    category: "capitals-and-regions",
    sourceModule: "state-capital-relationship-challenges",
    sourceActivityId: "us-state-capital-relationships",
    canonicalConceptId: pair.conceptId,
    canonicalSkillId: "relationship-recall",
    promptDirection: direction,
    relationship: clone(pair)
  };
}

export function getStateCapitalRelationshipChallenges(atlas = unitedStatesAtlas) {
  const pairs = getStateCapitalRelationshipPairs(atlas);
  const errors = validateStateCapitalRelationshipPairs(pairs);
  if (errors.length) throw new Error(`Invalid state-capital relationship source: ${errors.join(" ")}`);
  return pairs.flatMap((pair, index) => {
    const distractors = distractorPairs(pairs, index);
    return [
      createChallenge(pair, distractors, STATE_CAPITAL_PROMPT_DIRECTIONS.STATE_TO_CAPITAL),
      createChallenge(pair, distractors, STATE_CAPITAL_PROMPT_DIRECTIONS.CAPITAL_TO_STATE)
    ];
  });
}
