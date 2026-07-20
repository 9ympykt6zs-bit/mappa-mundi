import { getStateById } from "./united-states-atlas-queries.js";

export const COMPASS_QUESTION_TYPES = Object.freeze({
  SINGLE_DIRECTION: "single-direction",
  RELATIVE_POSITION: "relative-position",
  WEST_TO_EAST: "west-to-east"
});

const challenges = Object.freeze([
  {
    id: "west-of-arkansas",
    title: "Single Direction",
    prompt: "Which state lies immediately west of Arkansas?",
    questionType: COMPASS_QUESTION_TYPES.SINGLE_DIRECTION,
    correctStateId: "oklahoma",
    distractorStateIds: ["louisiana", "missouri", "tennessee"],
    directionRelationships: [{ fromStateId: "arkansas", toStateId: "oklahoma", direction: "west" }],
    explanation: "Oklahoma lies directly west of Arkansas along most of Arkansas's western border."
  },
  {
    id: "north-of-oklahoma",
    title: "Single Direction",
    prompt: "Which state lies directly north of Oklahoma?",
    questionType: COMPASS_QUESTION_TYPES.SINGLE_DIRECTION,
    correctStateId: "kansas",
    distractorStateIds: ["arkansas", "colorado", "texas"],
    directionRelationships: [{ fromStateId: "oklahoma", toStateId: "kansas", direction: "north" }],
    explanation: "Kansas lies directly north of Oklahoma across Oklahoma's northern border."
  },
  {
    id: "east-of-nevada",
    title: "Single Direction",
    prompt: "Which state lies directly east of Nevada?",
    questionType: COMPASS_QUESTION_TYPES.SINGLE_DIRECTION,
    correctStateId: "utah",
    distractorStateIds: ["arizona", "california", "oregon"],
    directionRelationships: [{ fromStateId: "nevada", toStateId: "utah", direction: "east" }],
    explanation: "Utah lies directly east of Nevada along Nevada's eastern border."
  },
  {
    id: "west-tennessee-north-louisiana",
    title: "Relative Position",
    prompt: "Which state is west of Tennessee and north of Louisiana?",
    questionType: COMPASS_QUESTION_TYPES.RELATIVE_POSITION,
    correctStateId: "arkansas",
    distractorStateIds: ["alabama", "mississippi", "missouri"],
    directionRelationships: [
      { fromStateId: "tennessee", toStateId: "arkansas", direction: "west" },
      { fromStateId: "louisiana", toStateId: "arkansas", direction: "north" }
    ],
    explanation: "Arkansas is west of Tennessee and directly north of Louisiana."
  },
  {
    id: "south-virginia-east-tennessee",
    title: "Relative Position",
    prompt: "Which state is south of Virginia and east of Tennessee?",
    questionType: COMPASS_QUESTION_TYPES.RELATIVE_POSITION,
    correctStateId: "north-carolina",
    distractorStateIds: ["georgia", "kentucky", "west-virginia"],
    directionRelationships: [
      { fromStateId: "virginia", toStateId: "north-carolina", direction: "south" },
      { fromStateId: "tennessee", toStateId: "north-carolina", direction: "east" }
    ],
    explanation: "North Carolina lies south of Virginia and east of Tennessee."
  },
  {
    id: "east-arizona-south-colorado",
    title: "Relative Position",
    prompt: "Which state is east of Arizona and south of Colorado?",
    questionType: COMPASS_QUESTION_TYPES.RELATIVE_POSITION,
    correctStateId: "new-mexico",
    distractorStateIds: ["nevada", "texas", "utah"],
    directionRelationships: [
      { fromStateId: "arizona", toStateId: "new-mexico", direction: "east" },
      { fromStateId: "colorado", toStateId: "new-mexico", direction: "south" }
    ],
    explanation: "New Mexico lies east of Arizona and directly south of Colorado."
  },
  {
    id: "southwest-west-to-east",
    title: "West To East",
    prompt: "Put California, Nevada, Utah, and Colorado in west-to-east order.",
    secondaryInstruction: "Choose the states in order, starting with the westernmost.",
    questionType: COMPASS_QUESTION_TYPES.WEST_TO_EAST,
    orderedStateIds: ["california", "nevada", "utah", "colorado"],
    explanation: "From west to east, the sequence is California, Nevada, Utah, then Colorado."
  },
  {
    id: "northern-us-west-to-east",
    title: "West To East",
    prompt: "Put Washington, Montana, Minnesota, and Maine in west-to-east order.",
    secondaryInstruction: "Choose the states in order, starting with the westernmost.",
    questionType: COMPASS_QUESTION_TYPES.WEST_TO_EAST,
    orderedStateIds: ["washington", "montana", "minnesota", "maine"],
    explanation: "From west to east, the sequence is Washington, Montana, Minnesota, then Maine."
  },
  {
    id: "gulf-states-west-to-east",
    title: "West To East",
    prompt: "Put Texas, Louisiana, Mississippi, Alabama, and Florida in west-to-east order.",
    secondaryInstruction: "Choose the states in order, starting with the westernmost.",
    questionType: COMPASS_QUESTION_TYPES.WEST_TO_EAST,
    orderedStateIds: ["texas", "louisiana", "mississippi", "alabama", "florida"],
    explanation: "From west to east, the sequence is Texas, Louisiana, Mississippi, Alabama, then Florida."
  }
]);

function copy(value) {
  return JSON.parse(JSON.stringify(value));
}

export function getCompassChallenges() {
  return challenges.map(copy);
}

export function validateCompassChallenge(challenge) {
  const errors = [];
  if (!challenge?.id || !challenge?.title || !challenge?.prompt || !challenge?.explanation) {
    errors.push("Challenge identity, prompt, and explanation are required.");
  }
  if (!Object.values(COMPASS_QUESTION_TYPES).includes(challenge?.questionType)) {
    errors.push(`Unknown Compass question type: ${challenge?.questionType}`);
  }

  const answerIds = challenge?.questionType === COMPASS_QUESTION_TYPES.WEST_TO_EAST
    ? challenge?.orderedStateIds || []
    : [challenge?.correctStateId, ...(challenge?.distractorStateIds || [])].filter(Boolean);
  const relationshipIds = (challenge?.directionRelationships || [])
    .flatMap((relationship) => [relationship.fromStateId, relationship.toStateId]);
  [...answerIds, ...relationshipIds].forEach((stateId) => {
    if (!getStateById(stateId)) errors.push(`Unknown state ID: ${stateId}`);
  });
  if (new Set(answerIds).size !== answerIds.length) errors.push("Answer-bank state IDs must be unique.");

  if (challenge?.questionType === COMPASS_QUESTION_TYPES.WEST_TO_EAST) {
    if ((challenge.orderedStateIds || []).length < 3) errors.push("West-to-east questions need at least three states.");
  } else {
    if (!challenge?.correctStateId) errors.push("Single-answer Compass questions need a correct state.");
    if (!(challenge?.directionRelationships || []).length) errors.push("Directional relationships are required.");
    if ((challenge.directionRelationships || []).some((relationship) => relationship.toStateId !== challenge.correctStateId)) {
      errors.push("Every directional relationship must point to the correct answer state.");
    }
  }
  return errors;
}
