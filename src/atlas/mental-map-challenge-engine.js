import { getStateById } from "./united-states-atlas-queries.js";
import { getEntity, unitedStatesAtlas } from "./united-states-atlas-data.js";
import { MENTAL_MAP_ANSWER_MODES, validateMentalMapChallenge } from "./mental-map-challenges.js";

function copy(value) {
  return JSON.parse(JSON.stringify(value));
}

function unique(values = []) {
  return [...new Set(values.filter(Boolean))];
}

function arraysEqual(left = [], right = []) {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function shuffle(values, random) {
  const shuffled = [...values];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.min(index, Math.max(0, Math.floor(Number(random()) * (index + 1))));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  return shuffled;
}

function appearsInExpectedRelativeOrder(bankIds, expectedIds) {
  const positions = expectedIds.map((stateId) => bankIds.indexOf(stateId));
  return positions.every((position, index) => index === 0 || positions[index - 1] < position);
}

export function getMentalMapRequiredStateIds(challenge) {
  if (challenge?.answerMode === MENTAL_MAP_ANSWER_MODES.ORDERED_SEQUENCE) {
    return unique([
      ...(challenge.orderedStateIds || []),
      ...(challenge.acceptedAlternatives || []).flat()
    ]);
  }
  return unique(challenge?.correctStateIds || []);
}

export function buildMentalMapAnswerBank(challenge, { random = Math.random } = {}) {
  if (validateMentalMapChallenge(challenge).length) return [];
  const requiredIds = getMentalMapRequiredStateIds(challenge);
  const bankIds = unique([...requiredIds, ...(challenge.distractorStateIds || [])]);
  let shuffled = shuffle(bankIds, random);

  if (challenge.answerMode === MENTAL_MAP_ANSWER_MODES.ORDERED_SEQUENCE
    && challenge.orderedStateIds.length > 1
    && appearsInExpectedRelativeOrder(shuffled, challenge.orderedStateIds)) {
    const firstIndex = shuffled.indexOf(challenge.orderedStateIds[0]);
    const secondIndex = shuffled.indexOf(challenge.orderedStateIds[1]);
    [shuffled[firstIndex], shuffled[secondIndex]] = [shuffled[secondIndex], shuffled[firstIndex]];
  }

  return shuffled.map((stateId) => ({
    id: stateId,
    name: getStateById(stateId).name
  }));
}

export function createMentalMapChallengeState(challenge, options = {}) {
  if (validateMentalMapChallenge(challenge).length) return null;
  const maxSelections = challenge.answerMode === MENTAL_MAP_ANSWER_MODES.SELECT_COUNT
    ? challenge.requiredSelectionCount
    : challenge.answerMode === MENTAL_MAP_ANSWER_MODES.SELECT_ALL
      ? challenge.correctStateIds.length
      : null;
  return {
    challengeId: challenge.id,
    answerMode: challenge.answerMode,
    phase: "answering",
    answerBank: buildMentalMapAnswerBank(challenge, options),
    selectedStateIds: [],
    maxSelections,
    evaluation: null
  };
}

export function selectMentalMapAnswer(state, stateId) {
  const next = copy(state);
  if (!next || next.phase !== "answering") return next;
  if (!next.answerBank.some((item) => item.id === stateId)) return next;
  if (Number.isInteger(next.maxSelections) && next.selectedStateIds.length >= next.maxSelections) return next;
  if (!next.selectedStateIds.includes(stateId)) next.selectedStateIds.push(stateId);
  return next;
}

export function removeMentalMapAnswer(state, stateId) {
  const next = copy(state);
  if (!next || next.phase !== "answering") return next;
  next.selectedStateIds = next.selectedStateIds.filter((id) => id !== stateId);
  return next;
}

export function undoMentalMapAnswer(state) {
  const next = copy(state);
  if (!next || next.phase !== "answering" || !next.selectedStateIds.length) return next;
  next.selectedStateIds.pop();
  return next;
}

export function clearMentalMapAnswers(state) {
  const next = copy(state);
  if (!next || next.phase !== "answering") return next;
  next.selectedStateIds = [];
  return next;
}

export function moveMentalMapAnswer(state, stateId, direction) {
  const next = copy(state);
  if (!next || next.phase !== "answering" || next.answerMode !== MENTAL_MAP_ANSWER_MODES.ORDERED_SEQUENCE) return next;
  const index = next.selectedStateIds.indexOf(stateId);
  const targetIndex = direction === "up" ? index - 1 : index + 1;
  if (index < 0 || targetIndex < 0 || targetIndex >= next.selectedStateIds.length) return next;
  [next.selectedStateIds[index], next.selectedStateIds[targetIndex]] = [next.selectedStateIds[targetIndex], next.selectedStateIds[index]];
  return next;
}

export function evaluateMentalMapAnswer(challenge, selectedStateIds = []) {
  const selected = unique(selectedStateIds);
  if (challenge.answerMode === MENTAL_MAP_ANSWER_MODES.SELECT_COUNT) {
    const eligible = new Set(challenge.correctStateIds);
    const selectedValidStateIds = selected.filter((stateId) => eligible.has(stateId));
    const selectedInvalidStateIds = selected.filter((stateId) => !eligible.has(stateId));
    const requestedCountMet = selected.length === challenge.requiredSelectionCount;
    const maxScore = challenge.requiredSelectionCount;
    const score = Math.min(selectedValidStateIds.length, maxScore);
    return {
      isCorrect: requestedCountMet && selectedInvalidStateIds.length === 0,
      score,
      maxScore,
      selectedStateIds: selected,
      selectedValidStateIds,
      selectedInvalidStateIds,
      requestedCountMet,
      completeEligibleStateIds: [...challenge.correctStateIds],
      missingStateIds: [],
      unnecessaryStateIds: selectedInvalidStateIds,
      correctlyPositionedStateIds: [],
      misplacedStateIds: [],
      expectedSequence: []
    };
  }

  if (challenge.answerMode === MENTAL_MAP_ANSWER_MODES.SELECT_ALL) {
    const correct = new Set(challenge.correctStateIds);
    const selectedSet = new Set(selected);
    const selectedValidStateIds = selected.filter((stateId) => correct.has(stateId));
    const unnecessaryStateIds = selected.filter((stateId) => !correct.has(stateId));
    const missingStateIds = challenge.correctStateIds.filter((stateId) => !selectedSet.has(stateId));
    const score = selectedValidStateIds.length;
    const maxScore = challenge.correctStateIds.length;
    return {
      isCorrect: missingStateIds.length === 0 && unnecessaryStateIds.length === 0,
      score,
      maxScore,
      selectedStateIds: selected,
      selectedValidStateIds,
      selectedInvalidStateIds: unnecessaryStateIds,
      requestedCountMet: true,
      completeEligibleStateIds: [...challenge.correctStateIds],
      missingStateIds,
      unnecessaryStateIds,
      correctlyPositionedStateIds: [],
      misplacedStateIds: [],
      expectedSequence: []
    };
  }

  const sequences = [challenge.orderedStateIds, ...(challenge.acceptedAlternatives || [])];
  const matchedSequenceIndex = sequences.findIndex((sequence) => arraysEqual(selected, sequence));
  const expectedSequence = matchedSequenceIndex >= 0 ? sequences[matchedSequenceIndex] : challenge.orderedStateIds;
  const expectedSet = new Set(expectedSequence);
  const selectedSet = new Set(selected);
  const correctlyPositionedStateIds = selected.filter((stateId, index) => expectedSequence[index] === stateId);
  const misplacedStateIds = selected.filter((stateId, index) => expectedSet.has(stateId) && expectedSequence[index] !== stateId);
  const missingStateIds = expectedSequence.filter((stateId) => !selectedSet.has(stateId));
  const unnecessaryStateIds = selected.filter((stateId) => !expectedSet.has(stateId));
  return {
    isCorrect: matchedSequenceIndex >= 0,
    acceptedAlternativeIndex: matchedSequenceIndex > 0 ? matchedSequenceIndex - 1 : null,
    selectedStateIds: selected,
    selectedValidStateIds: correctlyPositionedStateIds,
    selectedInvalidStateIds: unnecessaryStateIds,
    requestedCountMet: selected.length === expectedSequence.length,
    completeEligibleStateIds: [...expectedSequence],
    missingStateIds,
    unnecessaryStateIds,
    correctlyPositionedStateIds,
    misplacedStateIds,
    expectedSequence: [...expectedSequence]
  };
}

export function getMentalMapScoreLabel(evaluation = {}) {
  const score = Number(evaluation.score);
  const maxScore = Number(evaluation.maxScore);
  return Number.isInteger(score) && Number.isInteger(maxScore) && maxScore > 0
    ? `${score} of ${maxScore} correct`
    : "";
}

export function submitMentalMapAnswer(state, challenge) {
  const next = copy(state);
  if (!next || next.phase !== "answering" || next.challengeId !== challenge?.id) return next;
  next.phase = "result";
  next.evaluation = evaluateMentalMapAnswer(challenge, next.selectedStateIds);
  return next;
}

export function getMentalMapResultVisualState(challenge, evaluation) {
  const orderedCorrectIds = challenge.answerMode === MENTAL_MAP_ANSWER_MODES.ORDERED_SEQUENCE
    ? evaluation.expectedSequence
    : [];
  const correctStateIds = challenge.answerMode === MENTAL_MAP_ANSWER_MODES.ORDERED_SEQUENCE
    ? unique([challenge.routeStartStateId, ...orderedCorrectIds, challenge.routeDestinationStateId])
    : [...challenge.correctStateIds];
  const associatedFeatures = (challenge.associatedFeatureIds || []).map((entityId) => {
    const entity = getEntity(unitedStatesAtlas, entityId);
    return entity ? {
      entityId: entity.id,
      id: entity.id.split(":").slice(1).join(":"),
      kind: entity.kind,
      name: entity.name,
      sourceFeatureId: entity.source?.featureId || ""
    } : null;
  }).filter(Boolean);
  return {
    correctStateIds,
    selectedCorrectStateIds: [...evaluation.selectedValidStateIds],
    selectedIncorrectStateIds: [...evaluation.selectedInvalidStateIds],
    missingStateIds: [...evaluation.missingStateIds],
    misplacedStateIds: [...evaluation.misplacedStateIds],
    expectedSequenceStateIds: unique([challenge.routeStartStateId, ...orderedCorrectIds, challenge.routeDestinationStateId]),
    learnerStateIds: [...evaluation.selectedStateIds],
    associatedFeatures
  };
}
