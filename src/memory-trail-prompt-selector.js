export function chooseMemoryTrailRetrievalPromptType(context = {}, stats = {}, options = {}) {
  if (context.isDailyTrail) return "name_to_place";
  if (options.preferEasier || (stats.placeToNameIncorrect || 0) > (stats.nameToPlaceIncorrect || 0) + 1) {
    return "name_to_place";
  }
  if ((stats.nameToPlaceCorrect || 0) < 1) return "name_to_place";
  if ((stats.placeToNameCorrect || 0) < 1) return "place_to_name";

  const retrievalCount = Math.max(1, Number(context.retrievalPromptCount) || 0);
  const placeToNameCount = (context.introducedStats || [])
    .reduce((count, item) => count + (Number(item.placeToNameAttempts) || 0), 0);
  const placeToNameRatio = placeToNameCount / retrievalCount;
  const targetRatio = options.earlyChunk ? 0.3 : 0.5;
  return placeToNameRatio < targetRatio ? "place_to_name" : "name_to_place";
}
