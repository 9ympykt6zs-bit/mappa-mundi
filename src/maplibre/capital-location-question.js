import {
  US_CAPITAL_LOCATION_CITY_CHOICES,
  getUsCapitalLocationCityChoicesForCapital
} from "../atlas/us-capital-location-city-choices.js?v=20260906-capital-location-choices-1";

const choiceId = (stateId, role, index = 0) => (
  `capital-location-choice:${stateId}:${role === "capital" ? "capital" : `city-${index + 1}`}`
);

export function createCapitalLocationQuestionState({
  capitalTargets = [],
  targetId = "",
  phase = "answering",
  selectedChoiceId = "",
  scope = "all",
  interaction = "all"
} = {}) {
  const targetRecord = getUsCapitalLocationCityChoicesForCapital(targetId);
  if (!targetRecord) return null;

  const targetByStateId = new Map();
  capitalTargets.forEach((target) => {
    const record = getUsCapitalLocationCityChoicesForCapital(target?.id);
    if (record && Number.isFinite(target?.lon) && Number.isFinite(target?.lat)) {
      targetByStateId.set(record.stateId, target);
    }
  });
  const reveal = phase !== "answering";
  const records = scope === "target-state"
    ? [targetRecord]
    : US_CAPITAL_LOCATION_CITY_CHOICES;
  const choices = records.flatMap((record) => {
    const authoredCapital = targetByStateId.get(record.stateId);
    const capital = authoredCapital
      ? { ...record.capital, id: authoredCapital.id, name: authoredCapital.city || authoredCapital.name,
          lon: authoredCapital.lon, lat: authoredCapital.lat }
      : record.capital;
    const stateChoices = [
      { source: capital, role: "capital", index: 0 },
      ...record.distractors.map((source, index) => ({ source, role: "distractor", index }))
    ];

    return stateChoices.map(({ source, role, index }) => {
      const id = role === "capital" && record.stateId === targetRecord.stateId
        ? targetId
        : choiceId(record.stateId, role, index);
      const inTargetState = record.stateId === targetRecord.stateId;
      const isSelected = id === selectedChoiceId;
      const isInteractive = interaction === "capital-only"
        ? role === "capital" && inTargetState
        : true;
      return Object.freeze({
        id,
        stateId: record.stateId,
        stateName: record.stateName,
        name: source.name,
        lon: source.lon,
        lat: source.lat,
        role,
        choiceIndex: index,
        inTargetState,
        revealLabel: reveal && (inTargetState || isSelected),
        revealCapital: reveal && inTargetState && role === "capital",
        isSelected,
        isInteractive,
        isTeaching: phase === "teaching"
      });
    });
  });

  return Object.freeze({
    active: true,
    targetId,
    targetStateId: targetRecord.stateId,
    phase,
    selectedChoiceId,
    scope,
    interaction,
    choices: Object.freeze(choices)
  });
}

export function getCapitalLocationQuestionChoice(question, id) {
  return question?.choices?.find((choice) => choice.id === id) || null;
}

export function getCapitalLocationQuestionGeoJson(question) {
  return {
    type: "FeatureCollection",
    features: (question?.choices || []).map((choice) => ({
      type: "Feature",
      properties: {
        id: choice.id,
        name: choice.name,
        stateId: choice.stateId,
        stateName: choice.stateName,
        capitalLocationChoice: true,
        capitalLocationRole: choice.role,
        capitalLocationChoiceIndex: choice.choiceIndex,
        revealLabel: choice.revealLabel,
        revealCapital: choice.revealCapital,
        isSelected: choice.isSelected,
        capitalLocationInteractive: choice.isInteractive,
        capitalLocationTeaching: choice.isTeaching
      },
      geometry: { type: "Point", coordinates: [choice.lon, choice.lat] }
    }))
  };
}
