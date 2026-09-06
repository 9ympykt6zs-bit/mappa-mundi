export const hardContextPalette = Object.freeze([
  "#cfe8d5",
  "#f6d7c9",
  "#d7d9f2",
  "#f5e3a8",
  "#cbe1ed",
  "#e7cdec",
  "#dcecc8",
  "#f3c9ce",
  "#c9e7df",
  "#ead9bb"
]);

export function getHardContextColor(index) {
  return hardContextPalette[index % hardContextPalette.length];
}

export function getUsStateHardColorStops(featureCollection) {
  return featureCollection.features.flatMap((feature, index) => [
    feature.properties.id,
    getHardContextColor(index)
  ]);
}
