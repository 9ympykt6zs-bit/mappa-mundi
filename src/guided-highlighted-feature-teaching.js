const FAMILY_COPY = Object.freeze({
  state: Object.freeze({ singular: "state", plural: "states" }),
  "mountain-range": Object.freeze({ singular: "mountain range", plural: "mountain ranges" }),
  river: Object.freeze({ singular: "river", plural: "rivers" }),
  lake: Object.freeze({ singular: "lake", plural: "lakes" })
});

function normalizeFamily(family = "") {
  return String(family || "").trim().toLowerCase();
}

function fallbackFamilyCopy(family = "") {
  const singular = normalizeFamily(family).replace(/-/g, " ") || "place";
  return {
    singular,
    plural: singular.endsWith("s") ? singular : `${singular}s`
  };
}

export function getGuidedHighlightedFeatureTeachingCopy({
  family = "place",
  targetName = "",
  targetCount = 2
} = {}) {
  const normalizedFamily = normalizeFamily(family);
  const descriptor = FAMILY_COPY[normalizedFamily] || fallbackFamilyCopy(normalizedFamily);
  const normalizedTargetName = String(targetName || "").trim();
  const familyInstruction = Number(targetCount) === 1
    ? `Learn this ${descriptor.singular}.`
    : `Learn these ${descriptor.plural}.`;
  const actionInstruction = `Tap the highlighted ${descriptor.singular}.`;

  return Object.freeze({
    family: normalizedFamily || "place",
    singular: descriptor.singular,
    plural: descriptor.plural,
    familyInstruction,
    actionInstruction,
    targetInstruction: normalizedTargetName
      ? `Tap the highlighted ${descriptor.singular}: ${normalizedTargetName}.`
      : actionInstruction
  });
}
