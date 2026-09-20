import { isExcludedPhaseOneTargetId } from "./united-states-memory-trail-target-scope.js";

export const UNITED_STATES_ANSWER_CHOICE_CATEGORY_ACTIVITY_PREFIXES = Object.freeze({
  capital: "us-capitals-",
  state: "us-states-"
});

export function getUnitedStatesAnswerChoiceTargetCategory(target = {}) {
  if (target?.type === "capital") {
    return "capital";
  }

  if (target?.type === "state" || target?.type === "federal-district") {
    return "state";
  }

  return "";
}

export function collectUnitedStatesAnswerChoiceDistractors({
  activities = [],
  category = "",
  excludeTargetId = ""
} = {}) {
  const activityPrefix = UNITED_STATES_ANSWER_CHOICE_CATEGORY_ACTIVITY_PREFIXES[category] || "";
  if (!activityPrefix) {
    return [];
  }

  const seenTargetIds = new Set();
  return activities
    .filter((activity) => String(activity?.id || "").startsWith(activityPrefix))
    .flatMap((activity) => activity?.targets || [])
    .filter((target) => target?.id && target.id !== excludeTargetId)
    .filter((target) => !isExcludedPhaseOneTargetId(target.id))
    .filter((target) => getUnitedStatesAnswerChoiceTargetCategory(target) === category)
    .filter((target) => {
      if (seenTargetIds.has(target.id)) {
        return false;
      }
      seenTargetIds.add(target.id);
      return true;
    });
}
