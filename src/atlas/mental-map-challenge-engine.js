import { getStateById } from "./united-states-atlas-queries.js";
import { getEntity, unitedStatesAtlas } from "./united-states-atlas-data.js";
import { findAllShortestBorderPaths, validateBorderRoute } from "./border-chain.js";
import {
  getMentalMapRouteRenderingMode,
  isMentalMapBorderRouteChallenge,
  isMentalMapRecallAllChallenge,
  MENTAL_MAP_ANSWER_MODES,
  MENTAL_MAP_COUNT_RULES,
  validateMentalMapChallenge
} from "./mental-map-challenges.js?v=20260721-mental-map-consolidation-1";

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
  if (isMentalMapBorderRouteChallenge(challenge)) {
    return unique(findAllShortestBorderPaths(
      challenge.routeStartStateId,
      challenge.routeDestinationStateId
    ).flatMap((path) => path.slice(1, -1)));
  }
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
    && !isMentalMapBorderRouteChallenge(challenge)
    && challenge.orderedStateIds.length > 1
    && appearsInExpectedRelativeOrder(shuffled, challenge.orderedStateIds)) {
    const firstIndex = shuffled.indexOf(challenge.orderedStateIds[0]);
    const secondIndex = shuffled.indexOf(challenge.orderedStateIds[1]);
    [shuffled[firstIndex], shuffled[secondIndex]] = [shuffled[secondIndex], shuffled[firstIndex]];
  }

  return shuffled.map((stateId) => ({
    id: stateId,
    name: challenge.answerLabelsByStateId?.[stateId] || getStateById(stateId).name
  }));
}

export function createMentalMapChallengeState(challenge, options = {}) {
  if (validateMentalMapChallenge(challenge).length) return null;
  const maxSelections = challenge.answerMode === MENTAL_MAP_ANSWER_MODES.SELECT_COUNT
    ? challenge.countRule === MENTAL_MAP_COUNT_RULES.MINIMUM
      ? challenge.correctStateIds.length
      : challenge.requiredSelectionCount
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

export function isMentalMapAnswerChoiceDisabled(state, stateId) {
  const isSelected = Boolean(state?.selectedStateIds?.includes(stateId));
  const selectionLimitReached = Number.isInteger(state?.maxSelections)
    && state.selectedStateIds.length >= state.maxSelections;
  return isSelected || selectionLimitReached;
}

export function selectMentalMapAnswer(state, stateId) {
  const next = copy(state);
  if (!next || next.phase !== "answering") return next;
  if (!next.answerBank.some((item) => item.id === stateId)) return next;
  if (next.answerMode === MENTAL_MAP_ANSWER_MODES.SINGLE_SELECT) {
    next.selectedStateIds = [stateId];
    return next;
  }
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

export function moveSelectedAnswer(selectedStateIds, fromIndex, toIndex) {
  const next = Array.isArray(selectedStateIds) ? [...selectedStateIds] : [];
  if (!Number.isInteger(fromIndex)
    || !Number.isInteger(toIndex)
    || fromIndex < 0
    || toIndex < 0
    || fromIndex >= next.length
    || toIndex >= next.length
    || fromIndex === toIndex) return next;
  const [movedStateId] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, movedStateId);
  return next;
}

export function reorderMentalMapAnswers(state, fromIndex, toIndex) {
  const next = copy(state);
  if (!next
    || next.phase !== "answering"
    || next.answerMode !== MENTAL_MAP_ANSWER_MODES.ORDERED_SEQUENCE) return next;
  next.selectedStateIds = moveSelectedAnswer(next.selectedStateIds, fromIndex, toIndex);
  return next;
}

export function moveMentalMapAnswer(state, stateId, direction) {
  const index = state?.selectedStateIds?.indexOf(stateId) ?? -1;
  const targetIndex = direction === "up" ? index - 1 : index + 1;
  return reorderMentalMapAnswers(state, index, targetIndex);
}

export function evaluateMentalMapAnswer(challenge, selectedStateIds = []) {
  const selected = isMentalMapBorderRouteChallenge(challenge)
    ? (selectedStateIds || []).filter(Boolean)
    : unique(selectedStateIds);
  if (challenge.answerMode === MENTAL_MAP_ANSWER_MODES.SINGLE_SELECT) {
    const correctStateId = challenge.correctStateIds[0];
    const selectedStateId = selected[0] || null;
    const isCorrect = selectedStateId === correctStateId;
    return {
      isCorrect,
      score: isCorrect ? 1 : 0,
      maxScore: 1,
      selectedStateIds: selectedStateId ? [selectedStateId] : [],
      selectedValidStateIds: isCorrect ? [selectedStateId] : [],
      selectedInvalidStateIds: selectedStateId && !isCorrect ? [selectedStateId] : [],
      requestedCountMet: Boolean(selectedStateId),
      completeEligibleStateIds: [correctStateId],
      missingStateIds: isCorrect ? [] : [correctStateId],
      unnecessaryStateIds: [],
      correctlyPositionedStateIds: [],
      misplacedStateIds: [],
      expectedSequence: []
    };
  }

  if (challenge.answerMode === MENTAL_MAP_ANSWER_MODES.SELECT_COUNT) {
    const eligible = new Set(challenge.correctStateIds);
    const selectedValidStateIds = selected.filter((stateId) => eligible.has(stateId));
    const selectedInvalidStateIds = selected.filter((stateId) => !eligible.has(stateId));
    const requestedCountMet = challenge.countRule === MENTAL_MAP_COUNT_RULES.MINIMUM
      ? selectedValidStateIds.length >= challenge.requiredSelectionCount
      : selected.length === challenge.requiredSelectionCount;
    const maxScore = challenge.countRule === MENTAL_MAP_COUNT_RULES.MINIMUM
      ? challenge.correctStateIds.length
      : challenge.requiredSelectionCount;
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

  if (isMentalMapRecallAllChallenge(challenge)) {
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

  if (isMentalMapBorderRouteChallenge(challenge)) {
    const routeEvaluation = validateBorderRoute([
      challenge.routeStartStateId,
      ...selected,
      challenge.routeDestinationStateId
    ], {
      startStateId: challenge.routeStartStateId,
      destinationStateId: challenge.routeDestinationStateId
    });
    const validSelectedIds = unique(routeEvaluation.validTransitions
      .map((transition) => transition.toStateId)
      .filter((stateId) => selected.includes(stateId)));
    const invalidSelectedStateIds = unique([
      routeEvaluation.firstInvalidTransition?.toStateId,
      routeEvaluation.repeatedStateId
    ].filter((stateId) => selected.includes(stateId)));
    return {
      isCorrect: routeEvaluation.isValid,
      isBorderRoute: true,
      isShortestRoute: routeEvaluation.isShortest,
      selectedStateIds: [...selected],
      selectedValidStateIds: routeEvaluation.isValid ? unique(selected) : validSelectedIds,
      selectedInvalidStateIds: invalidSelectedStateIds,
      requestedCountMet: routeEvaluation.isValid,
      completeEligibleStateIds: [],
      missingStateIds: [],
      unnecessaryStateIds: [],
      correctlyPositionedStateIds: [],
      misplacedStateIds: [],
      expectedSequence: [],
      routeStateIds: routeEvaluation.routeStateIds,
      validTransitions: routeEvaluation.validTransitions,
      firstInvalidTransition: routeEvaluation.firstInvalidTransition,
      repeatedStateId: routeEvaluation.repeatedStateId,
      playerTransitionCount: routeEvaluation.playerTransitionCount,
      shortestTransitionCount: routeEvaluation.shortestTransitionCount
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
  const borderRouteStateIds = evaluation.isBorderRoute ? evaluation.routeStateIds || [] : [];
  const orderedCorrectIds = challenge.answerMode === MENTAL_MAP_ANSWER_MODES.ORDERED_SEQUENCE
    && !evaluation.isBorderRoute
    ? evaluation.expectedSequence
    : [];
  const routeStateIds = evaluation.isBorderRoute
    ? borderRouteStateIds
    : unique([challenge.routeStartStateId, ...orderedCorrectIds, challenge.routeDestinationStateId]);
  const correctStateIds = challenge.answerMode === MENTAL_MAP_ANSWER_MODES.ORDERED_SEQUENCE
    ? routeStateIds
    : [...challenge.correctStateIds];
  const referenceStateIds = challenge.referenceStateId
    ? [challenge.referenceStateId]
    : [...(challenge.referenceStateIds || [])];
  const directionArrows = (challenge.directionRelationships || [])
    .map(({ fromStateId, toStateId }) => ({ fromStateId, toStateId }));
  const associatedFeatures = (challenge.associatedFeatureIds || []).map((entityId) => {
    const entity = getEntity(unitedStatesAtlas, entityId);
    const coastStateIds = entity?.kind === "water"
      ? correctStateIds.filter((stateId) => unitedStatesAtlas.relationships.some((relationship) => (
        relationship.type === "coast"
        && relationship.from === `state:${stateId}`
        && relationship.to === entity.id
      )))
      : [];
    const exclusiveCoastStateIds = coastStateIds.filter((stateId) => (
      unitedStatesAtlas.relationships.filter((relationship) => (
        relationship.type === "coast" && relationship.from === `state:${stateId}`
      )).length === 1
    ));
    return entity ? {
      entityId: entity.id,
      id: entity.id.split(":").slice(1).join(":"),
      kind: entity.kind,
      name: entity.name,
      sourceFeatureId: entity.source?.featureId || "",
      relationshipType: coastStateIds.length ? "coast" : "",
      coastStateIds,
      exclusiveCoastStateIds
    } : null;
  }).filter(Boolean);
  return {
    correctStateIds,
    selectedCorrectStateIds: [...evaluation.selectedValidStateIds],
    selectedIncorrectStateIds: [...evaluation.selectedInvalidStateIds],
    missingStateIds: [...evaluation.missingStateIds],
    misplacedStateIds: [...evaluation.misplacedStateIds],
    expectedSequenceStateIds: routeStateIds,
    learnerStateIds: evaluation.isBorderRoute ? routeStateIds : [...evaluation.selectedStateIds],
    referenceStateIds,
    contextStateIds: unique([
      ...referenceStateIds,
      ...directionArrows.flatMap(({ fromStateId, toStateId }) => [fromStateId, toStateId])
    ]),
    associatedFeatures,
    routeRenderingMode: getMentalMapRouteRenderingMode(challenge),
    explicitRouteGeometry: challenge.explicitRouteGeometry || null,
    directionArrows
  };
}
