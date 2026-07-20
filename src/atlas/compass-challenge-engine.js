import { getStateById } from "./united-states-atlas-queries.js";
import { COMPASS_QUESTION_TYPES, validateCompassChallenge } from "./compass-challenges.js";

function copy(value) {
  return JSON.parse(JSON.stringify(value));
}

function unique(values = []) {
  return [...new Set(values.filter(Boolean))];
}

function shuffle(values, random) {
  const result = [...values];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.min(index, Math.max(0, Math.floor(Number(random()) * (index + 1))));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}

export function buildCompassAnswerBank(challenge, { random = Math.random } = {}) {
  if (validateCompassChallenge(challenge).length) return [];
  const stateIds = challenge.questionType === COMPASS_QUESTION_TYPES.WEST_TO_EAST
    ? challenge.orderedStateIds
    : [challenge.correctStateId, ...(challenge.distractorStateIds || [])];
  let shuffled = shuffle(unique(stateIds), random);
  if (challenge.questionType === COMPASS_QUESTION_TYPES.WEST_TO_EAST
    && shuffled.every((stateId, index) => stateId === challenge.orderedStateIds[index])) {
    [shuffled[0], shuffled[1]] = [shuffled[1], shuffled[0]];
  }
  return shuffled.map((stateId) => ({ id: stateId, name: getStateById(stateId).name }));
}

export function createCompassChallengeState(challenge, options = {}) {
  if (validateCompassChallenge(challenge).length) return null;
  return {
    challengeId: challenge.id,
    questionType: challenge.questionType,
    phase: "answering",
    answerBank: buildCompassAnswerBank(challenge, options),
    selectedStateIds: [],
    evaluation: null
  };
}

export function selectCompassAnswer(state, stateId) {
  const next = copy(state);
  if (!next || next.phase !== "answering" || !next.answerBank.some((answer) => answer.id === stateId)) return next;
  if (next.questionType === COMPASS_QUESTION_TYPES.WEST_TO_EAST) {
    if (!next.selectedStateIds.includes(stateId)) next.selectedStateIds.push(stateId);
  } else {
    next.selectedStateIds = [stateId];
  }
  return next;
}

export function removeCompassAnswer(state, stateId) {
  const next = copy(state);
  if (!next || next.phase !== "answering") return next;
  next.selectedStateIds = next.selectedStateIds.filter((id) => id !== stateId);
  return next;
}

export function undoCompassAnswer(state) {
  const next = copy(state);
  if (!next || next.phase !== "answering" || !next.selectedStateIds.length) return next;
  next.selectedStateIds.pop();
  return next;
}

export function clearCompassAnswers(state) {
  const next = copy(state);
  if (!next || next.phase !== "answering") return next;
  next.selectedStateIds = [];
  return next;
}

export function moveCompassAnswer(state, stateId, direction) {
  const next = copy(state);
  const fromIndex = next?.selectedStateIds?.indexOf(stateId) ?? -1;
  const toIndex = direction === "up" ? fromIndex - 1 : fromIndex + 1;
  if (!next || next.phase !== "answering" || fromIndex < 0 || toIndex < 0 || toIndex >= next.selectedStateIds.length) return next;
  const [moved] = next.selectedStateIds.splice(fromIndex, 1);
  next.selectedStateIds.splice(toIndex, 0, moved);
  return next;
}

export function evaluateCompassAnswer(challenge, selectedStateIds = []) {
  const selected = unique(selectedStateIds);
  if (challenge.questionType !== COMPASS_QUESTION_TYPES.WEST_TO_EAST) {
    const selectedStateId = selected[0] || null;
    return {
      feedback: selectedStateId === challenge.correctStateId ? "correct" : "incorrect",
      isCorrect: selectedStateId === challenge.correctStateId,
      selectedStateIds: selectedStateId ? [selectedStateId] : [],
      selectedCorrectStateIds: selectedStateId === challenge.correctStateId ? [selectedStateId] : [],
      selectedIncorrectStateIds: selectedStateId && selectedStateId !== challenge.correctStateId ? [selectedStateId] : [],
      missingStateIds: selectedStateId === challenge.correctStateId ? [] : [challenge.correctStateId],
      expectedStateIds: [challenge.correctStateId],
      correctlyPositionedStateIds: [],
      misplacedStateIds: []
    };
  }

  const expected = challenge.orderedStateIds;
  const expectedSet = new Set(expected);
  const correctlyPositionedStateIds = selected.filter((stateId, index) => expected[index] === stateId);
  const misplacedStateIds = selected.filter((stateId, index) => expectedSet.has(stateId) && expected[index] !== stateId);
  const selectedIncorrectStateIds = selected.filter((stateId) => !expectedSet.has(stateId));
  const missingStateIds = expected.filter((stateId) => !selected.includes(stateId));
  const isCorrect = selected.length === expected.length && selected.every((stateId, index) => stateId === expected[index]);
  const hasPartialEvidence = correctlyPositionedStateIds.length > 0 || misplacedStateIds.length > 0;
  return {
    feedback: isCorrect ? "correct" : hasPartialEvidence ? "partial" : "incorrect",
    isCorrect,
    selectedStateIds: selected,
    selectedCorrectStateIds: correctlyPositionedStateIds,
    selectedIncorrectStateIds,
    missingStateIds,
    expectedStateIds: [...expected],
    correctlyPositionedStateIds,
    misplacedStateIds
  };
}

export function submitCompassAnswer(state, challenge) {
  const next = copy(state);
  if (!next || next.phase !== "answering" || next.challengeId !== challenge?.id) return next;
  next.phase = "result";
  next.evaluation = evaluateCompassAnswer(challenge, next.selectedStateIds);
  return next;
}

export function getCompassResultVisualState(challenge, evaluation) {
  const correctStateIds = challenge.questionType === COMPASS_QUESTION_TYPES.WEST_TO_EAST
    ? [...challenge.orderedStateIds]
    : [challenge.correctStateId];
  const directionArrows = challenge.directionRelationships?.length
    ? challenge.directionRelationships
    : [{
        fromStateId: correctStateIds[0],
        toStateId: correctStateIds[correctStateIds.length - 1]
      }];
  return {
    correctStateIds,
    selectedCorrectStateIds: [...evaluation.selectedCorrectStateIds],
    selectedIncorrectStateIds: [...evaluation.selectedIncorrectStateIds],
    missingStateIds: [...evaluation.missingStateIds],
    misplacedStateIds: [...evaluation.misplacedStateIds],
    expectedSequenceStateIds: challenge.questionType === COMPASS_QUESTION_TYPES.WEST_TO_EAST ? correctStateIds : [],
    learnerStateIds: [...evaluation.selectedStateIds],
    contextStateIds: [...new Set(directionArrows.flatMap(({ fromStateId, toStateId }) => [fromStateId, toStateId]))],
    routeRenderingMode: "feature-only",
    directionArrows: directionArrows.map(({ fromStateId, toStateId }) => ({ fromStateId, toStateId }))
  };
}
