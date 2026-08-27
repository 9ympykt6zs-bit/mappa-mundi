export const GLOBE_NAVIGATION_PROTOTYPE_ENABLED = true;

export const GLOBE_NAVIGATION_QUERY_PARAMETER = "globeNavigation";

export const globeNavigationPrototype = Object.freeze({
  rootScopeId: "world",
  scopes: Object.freeze({
    world: {
      id: "world",
      label: "World",
      heading: "Where do you want to learn?",
      instruction: "Choose a continent on the globe.",
      view: { center: [-18, 18], zoom: 1.85 },
      children: ["north-america", "south-america", "europe", "africa", "asia", "oceania", "antarctica"],
      learningAction: { kind: "activity", activityId: "continents-oceans", label: "Learn the Continents" }
    },
    "north-america": {
      id: "north-america",
      parentId: "world",
      label: "North America",
      instruction: "Choose a country or region to explore further.",
      view: { center: [-98, 37], zoom: 1.85 },
      geometry: { kind: "activity-target", activityId: "continents-oceans", targetId: "north-america" },
      children: ["united-states"],
      learningAction: { kind: "journey", journeyId: "north-america", label: "Learn North America" }
    },
    "south-america": {
      id: "south-america",
      parentId: "world",
      label: "South America",
      instruction: "This geographic path is not connected to learning content in the prototype yet.",
      view: { center: [-60, -18], zoom: 2.25 },
      geometry: { kind: "activity-target", activityId: "continents-oceans", targetId: "south-america" },
      children: [],
      availability: "coming-later"
    },
    europe: {
      id: "europe",
      parentId: "world",
      label: "Europe",
      instruction: "Choose a country or region to explore further.",
      view: { center: [14, 52], zoom: 2.35 },
      geometry: { kind: "activity-target", activityId: "continents-oceans", targetId: "europe" },
      children: ["germany", "france", "italy", "netherlands"],
      learningAction: { kind: "journey", journeyId: "europe", label: "Learn Europe" }
    },
    africa: {
      id: "africa",
      parentId: "world",
      label: "Africa",
      instruction: "This geographic path is not connected to learning content in the prototype yet.",
      view: { center: [20, 2], zoom: 2.25 },
      geometry: { kind: "activity-target", activityId: "continents-oceans", targetId: "africa" },
      children: [],
      availability: "coming-later"
    },
    asia: {
      id: "asia",
      parentId: "world",
      label: "Asia",
      instruction: "This geographic path is not connected to learning content in the prototype yet.",
      view: { center: [86, 36], zoom: 1.75 },
      geometry: { kind: "activity-target", activityId: "continents-oceans", targetId: "asia" },
      children: [],
      availability: "coming-later"
    },
    oceania: {
      id: "oceania",
      parentId: "world",
      label: "Oceania",
      instruction: "This geographic path is not connected to learning content in the prototype yet.",
      view: { center: [135, -25], zoom: 2.7 },
      geometry: { kind: "activity-target", activityId: "continents-oceans", targetId: "australia" },
      children: [],
      availability: "coming-later"
    },
    antarctica: {
      id: "antarctica",
      parentId: "world",
      label: "Antarctica",
      instruction: "This geographic path is not connected to learning content in the prototype yet.",
      view: { center: [20, -72], zoom: 1.25 },
      geometry: { kind: "activity-target", activityId: "continents-oceans", targetId: "antarctica" },
      children: [],
      availability: "coming-later"
    },
    "united-states": {
      id: "united-states",
      parentId: "north-america",
      label: "United States",
      instruction: "Choose what you want to learn about this place.",
      view: { center: [-98, 39], zoom: 3.1 },
      geometry: { kind: "country", isoA3: "USA" },
      children: [],
      learningAction: { kind: "expedition", expeditionId: "across-united-states", label: "Learn the United States" }
    },
    germany: {
      id: "germany",
      parentId: "europe",
      label: "Germany",
      instruction: "Choose what you want to learn about this place.",
      view: { center: [10.2, 51.1], zoom: 4.4 },
      geometry: { kind: "country", isoA3: "DEU" },
      children: [],
      learningAction: { kind: "journey", journeyId: "germany", label: "Learn Germany" }
    },
    france: {
      id: "france",
      parentId: "europe",
      label: "France",
      instruction: "Choose what you want to learn about this place.",
      view: { center: [2.4, 46.8], zoom: 4.1 },
      geometry: { kind: "country", isoA3: "FRA" },
      children: [],
      learningAction: { kind: "journey", journeyId: "france", label: "Learn France" }
    },
    italy: {
      id: "italy",
      parentId: "europe",
      label: "Italy",
      instruction: "Choose what you want to learn about this place.",
      view: { center: [12.5, 42.7], zoom: 4.25 },
      geometry: { kind: "country", isoA3: "ITA" },
      children: [],
      learningAction: { kind: "journey", journeyId: "italy", label: "Learn Italy" }
    },
    netherlands: {
      id: "netherlands",
      parentId: "europe",
      label: "Netherlands",
      instruction: "A Netherlands learning path is not connected in this prototype yet.",
      view: { center: [5.4, 52.2], zoom: 5.25 },
      geometry: { kind: "country", isoA3: "NLD" },
      children: [],
      availability: "coming-later"
    }
  })
});

export function isGlobeNavigationPrototypeEnabled(search = "") {
  const value = new URLSearchParams(search).get(GLOBE_NAVIGATION_QUERY_PARAMETER)?.trim().toLowerCase();

  if (["off", "0", "false", "legacy"].includes(value)) {
    return false;
  }

  if (["on", "1", "true", "prototype"].includes(value)) {
    return true;
  }

  return GLOBE_NAVIGATION_PROTOTYPE_ENABLED;
}

export function getGlobeNavigationScope(scopeId, model = globeNavigationPrototype) {
  return model.scopes[scopeId] || null;
}

export function getGlobeNavigationChildren(scopeId, model = globeNavigationPrototype) {
  const scope = getGlobeNavigationScope(scopeId, model);
  return (scope?.children || []).map((childId) => getGlobeNavigationScope(childId, model)).filter(Boolean);
}

export function getGlobeNavigationSelectableScopes(model = globeNavigationPrototype) {
  return Object.values(model.scopes).filter((scope) => Boolean(scope.geometry));
}

export function getGlobeNavigationPath(scopeId, model = globeNavigationPrototype) {
  const path = [];
  const visited = new Set();
  let scope = getGlobeNavigationScope(scopeId, model);

  while (scope && !visited.has(scope.id)) {
    visited.add(scope.id);
    path.unshift(scope);
    scope = getGlobeNavigationScope(scope.parentId, model);
  }

  return path;
}

export function findGlobeNavigationScopes(query, model = globeNavigationPrototype) {
  const normalizedQuery = String(query || "").trim().toLowerCase();
  if (!normalizedQuery) return [];

  return Object.values(model.scopes)
    .filter((scope) => scope.label.toLowerCase().includes(normalizedQuery))
    .sort((left, right) => {
      const leftLabel = left.label.toLowerCase();
      const rightLabel = right.label.toLowerCase();
      const prefixDifference = Number(!leftLabel.startsWith(normalizedQuery))
        - Number(!rightLabel.startsWith(normalizedQuery));
      return prefixDifference || left.label.localeCompare(right.label);
    });
}
