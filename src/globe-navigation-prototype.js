export const GLOBE_NAVIGATION_PROTOTYPE_ENABLED = true;

export const GLOBE_NAVIGATION_QUERY_PARAMETER = "globeNavigation";

export const globeNavigationPrototype = Object.freeze({
  rootScopeId: "world",
  scopes: Object.freeze({
    world: {
      id: "world",
      geographicType: "world",
      label: "World",
      heading: "Where do you want to learn?",
      instruction: "Choose a continent on the globe.",
      view: { center: [-18, 18], zoom: 1.85 },
      children: ["north-america", "south-america", "europe", "africa", "asia", "oceania", "antarctica"],
      learningAction: { kind: "activity", activityId: "continents-oceans", label: "Learn the Continents" }
    },
    "north-america": {
      id: "north-america",
      geographicType: "continent",
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
      geographicType: "continent",
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
      geographicType: "continent",
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
      geographicType: "continent",
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
      geographicType: "continent",
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
      geographicType: "continent",
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
      geographicType: "continent-country",
      parentId: "world",
      label: "Antarctica",
      instruction: "This geographic path is not connected to learning content in the prototype yet.",
      view: { center: [20, -72], zoom: 1.25 },
      geometry: { kind: "country", isoA3: "ATA" },
      children: [],
      availability: "coming-later"
    },
    "united-states": {
      id: "united-states",
      geographicType: "country",
      parentId: "north-america",
      label: "United States",
      instruction: "Choose what you want to learn about this place.",
      view: { center: [-98, 39], zoom: 3.1 },
      geometry: { kind: "country", isoA3: "USA" },
      children: [],
      learningAction: { kind: "expedition", expeditionId: "across-united-states", label: "Learn the United States" },
      learningRequirements: { journeyIds: ["united-states", "us-capitals"] }
    },
    germany: {
      id: "germany",
      geographicType: "country",
      parentId: "europe",
      label: "Germany",
      instruction: "Choose what you want to learn about this place.",
      view: { center: [10.2, 51.1], zoom: 4.4 },
      geometry: { kind: "country", isoA3: "DEU" },
      children: [],
      learningAction: { kind: "journey", journeyId: "germany", label: "Learn Germany" },
      learningRequirements: { journeyIds: ["germany"] }
    },
    france: {
      id: "france",
      geographicType: "country",
      parentId: "europe",
      label: "France",
      instruction: "Choose what you want to learn about this place.",
      view: { center: [2.4, 46.8], zoom: 4.1 },
      geometry: { kind: "country", isoA3: "FRA" },
      children: [],
      learningAction: { kind: "journey", journeyId: "france", label: "Learn France" },
      learningRequirements: { journeyIds: ["france"] }
    },
    italy: {
      id: "italy",
      geographicType: "country",
      parentId: "europe",
      label: "Italy",
      instruction: "Choose what you want to learn about this place.",
      view: { center: [12.5, 42.7], zoom: 4.25 },
      geometry: { kind: "country", isoA3: "ITA" },
      children: [],
      learningAction: { kind: "journey", journeyId: "italy", label: "Learn Italy" },
      learningRequirements: { journeyIds: ["italy"] }
    },
    netherlands: {
      id: "netherlands",
      geographicType: "country",
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

const continentScopeIdBySourceLabel = Object.freeze({
  Africa: "africa",
  Antarctica: "antarctica",
  Asia: "asia",
  Europe: "europe",
  "North America": "north-america",
  Oceania: "oceania",
  "Seven seas (open ocean)": "antarctica",
  "South America": "south-america"
});

function getStableCountryCode(properties = {}) {
  return [properties.ISO_A3, properties.ADM0_A3, properties.SOV_A3]
    .map((value) => String(value || "").toUpperCase())
    .find((value) => /^[A-Z0-9]{3}$/.test(value) && value !== "-99") || "";
}

function getStableCountryIso2(properties = {}) {
  return [properties.ISO_A2, properties.ISO_A2_EH]
    .map((value) => String(value || "").toUpperCase())
    .find((value) => /^[A-Z]{2}$/.test(value)) || "";
}

function getCountryLabel(properties = {}) {
  const isMapUnit = String(properties.featurecla || "").toLowerCase().includes("map unit");
  if (isMapUnit && properties.GEOUNIT) return properties.GEOUNIT;
  return properties.NAME_LONG || properties.NAME || properties.ADMIN || properties.GEOUNIT || properties.SOVEREIGNT;
}

function visitCoordinates(value, visitor) {
  if (!Array.isArray(value)) return;
  if (value.length >= 2 && Number.isFinite(value[0]) && Number.isFinite(value[1])) {
    visitor(value);
    return;
  }
  value.forEach((item) => visitCoordinates(item, visitor));
}

function getCountryView(feature) {
  const properties = feature?.properties || {};
  let west = Infinity;
  let south = Infinity;
  let east = -Infinity;
  let north = -Infinity;
  visitCoordinates(feature?.geometry?.coordinates, ([longitude, latitude]) => {
    west = Math.min(west, longitude);
    south = Math.min(south, latitude);
    east = Math.max(east, longitude);
    north = Math.max(north, latitude);
  });
  const center = Number.isFinite(properties.LABEL_X) && Number.isFinite(properties.LABEL_Y)
    ? [properties.LABEL_X, properties.LABEL_Y]
    : Number.isFinite(west) ? [(west + east) / 2, (south + north) / 2] : [0, 0];
  const span = Math.max(east - west, (north - south) * 1.6, 0.5);
  const zoom = Math.max(1.6, Math.min(5.8, Math.log2(360 / span) + 0.35));
  return { center, zoom };
}

function cloneScope(scope) {
  return {
    ...scope,
    children: [...(scope.children || [])],
    view: scope.view ? { ...scope.view } : scope.view,
    geometry: scope.geometry ? { ...scope.geometry } : scope.geometry,
    learningAction: scope.learningAction ? { ...scope.learningAction } : scope.learningAction,
    learningRequirements: scope.learningRequirements ? {
      ...scope.learningRequirements,
      activityIds: [...(scope.learningRequirements.activityIds || [])],
      journeyIds: [...(scope.learningRequirements.journeyIds || [])]
    } : scope.learningRequirements
  };
}

export function createGlobeNavigationModel(worldCountries, options = {}) {
  const scopes = Object.fromEntries(
    Object.values(globeNavigationPrototype.scopes).map((scope) => [scope.id, cloneScope(scope)])
  );
  const countryScopeIdByIsoA3 = new Map(
    Object.values(scopes)
      .filter((scope) => scope.geometry?.kind === "country" && scope.geometry.isoA3)
      .map((scope) => [scope.geometry.isoA3, scope.id])
  );

  Object.values(scopes)
    .filter((scope) => scope.geographicType === "continent")
    .forEach((scope) => { scope.children = []; });
  scopes.antarctica.children = [];

  const countryScopeIds = [];
  (worldCountries?.features || []).forEach((feature) => {
    const properties = feature?.properties || {};
    const isoA3 = getStableCountryCode(properties);
    const label = getCountryLabel(properties);
    if (!isoA3 || !label) return;

    const existingScopeId = countryScopeIdByIsoA3.get(isoA3);
    const scopeId = existingScopeId || `country-${isoA3.toLowerCase()}`;
    const parentId = continentScopeIdBySourceLabel[properties.CONTINENT] || "world";
    const existingScope = scopes[scopeId];
    const learningAction = existingScope?.learningAction;
    const readiness = learningAction && options.getLearningReadiness
      ? options.getLearningReadiness(existingScope)
      : null;
    const isLearningReady = Boolean(learningAction) && (!readiness || readiness.ready);
    const learningUnavailableMessage = readiness && !readiness.ready
      ? `Learning for ${label} is temporarily unavailable because required map content could not be validated.`
      : `Learning content for ${label} is coming later.`;

    scopes[scopeId] = {
      ...(existingScope || {}),
      id: scopeId,
      parentId: scopeId === "antarctica" ? "world" : parentId,
      label,
      geographicType: scopeId === "antarctica" ? "continent-country" : "country",
      geographicIdentity: {
        kind: "country",
        stableId: `country:${isoA3}`,
        isoA3,
        isoA2: getStableCountryIso2(properties)
      },
      geometryAvailability: "available",
      navigationAvailability: "available",
      learningAvailability: isLearningReady ? "available" : "unavailable",
      learningUnavailableMessage,
      instruction: existingScope?.instruction || `Explore ${label} on the globe.`,
      view: existingScope?.view || getCountryView(feature),
      geometry: { kind: "country", isoA3 },
      children: [...(existingScope?.children || [])],
      learningAction: isLearningReady ? learningAction : undefined,
      learningReadiness: readiness || (learningAction ? { ready: true, reason: "configured" } : { ready: false, reason: "not-configured" })
    };
    countryScopeIds.push(scopeId);
    countryScopeIdByIsoA3.set(isoA3, scopeId);

    const actualParentId = scopes[scopeId].parentId;
    if (actualParentId !== scopeId && scopes[actualParentId] && !scopes[actualParentId].children.includes(scopeId)) {
      scopes[actualParentId].children.push(scopeId);
    }
  });

  Object.values(scopes).forEach((scope) => {
    if (scope.id === globeNavigationPrototype.rootScopeId) return;
    scope.children.sort((leftId, rightId) => (
      (scopes[leftId]?.label || leftId).localeCompare(scopes[rightId]?.label || rightId)
    ));
  });

  return {
    rootScopeId: globeNavigationPrototype.rootScopeId,
    scopes,
    countryScopeIds: [...new Set(countryScopeIds)],
    countryScopeIdByIsoA3
  };
}

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
