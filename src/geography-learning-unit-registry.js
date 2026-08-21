import { centralAmericaLearningUnit } from "./central-america-learning-unit.js";

export const geographyLearningUnits = Object.freeze([
  centralAmericaLearningUnit
]);

export function getGeographyLearningUnit(unitId) {
  return geographyLearningUnits.find((unit) => unit.id === unitId || unit.expedition.id === unitId) || null;
}
