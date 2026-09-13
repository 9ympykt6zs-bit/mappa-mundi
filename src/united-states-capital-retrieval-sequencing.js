import { getCanonicalRetrievalMappings } from "./canonical-learning-evidence.js";

export function getSuccessfulCapitalNamingTargetIds(items = [], repository = {}) {
  const targetIdByNamingConceptId = new Map();

  items.filter((item) => item?.type === "capital").forEach((item) => {
    const naming = getCanonicalRetrievalMappings(item)
      .find(({ promptType }) => promptType === "place_to_name");
    if (naming?.conceptId) {
      targetIdByNamingConceptId.set(naming.conceptId, item.targetId);
    }
  });

  return [...new Set((repository?.events || [])
    .filter((event) => event?.outcome === "correct" && event?.skillId === "identifying")
    .map((event) => targetIdByNamingConceptId.get(event.conceptId))
    .filter(Boolean))];
}

export function chooseUnitedStatesCapitalRetrievalPromptType({
  stats = {},
  hasPriorNamingSuccess = false,
  preferEasier = false
} = {}) {
  const namingCorrect = Math.max(0, Number(stats.placeToNameCorrect) || 0)
    + Number(Boolean(hasPriorNamingSuccess));
  const locatingCorrect = Math.max(0, Number(stats.nameToPlaceCorrect) || 0);
  const namingIncorrect = Math.max(0, Number(stats.placeToNameIncorrect) || 0);
  const locatingIncorrect = Math.max(0, Number(stats.nameToPlaceIncorrect) || 0);

  if (namingCorrect < 1) {
    return "place_to_name";
  }
  if (preferEasier || locatingIncorrect > namingIncorrect + 1) {
    return "place_to_name";
  }
  if (locatingCorrect < 1) {
    return "name_to_place";
  }

  const namingAttempts = Math.max(0, Number(stats.placeToNameAttempts) || 0)
    + Number(Boolean(hasPriorNamingSuccess));
  const locatingAttempts = Math.max(0, Number(stats.nameToPlaceAttempts) || 0);
  return namingAttempts <= locatingAttempts ? "place_to_name" : "name_to_place";
}
