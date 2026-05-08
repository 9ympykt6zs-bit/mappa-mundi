const fs = require("fs");
const path = require("path");

const usAtlasUrl = "https://cdn.jsdelivr.net/npm/us-atlas@3/states-albers-10m.json";
const usAtlasPath = path.join("assets", "maps", "usa", "states-albers-10m.json");
const outputSvgPath = path.join("assets", "maps", "usa", "usa-map.svg");
const statesOutputPath = path.join("assets", "maps", "data", "us-states.json");
const capitalsOutputPath = path.join("assets", "maps", "data", "us-capitals.json");
const featuresOutputPath = path.join("assets", "maps", "data", "us-features.json");
const statesCapitalsOutputPath = path.join("assets", "maps", "data", "us-states-capitals-01.json");

const capitalSourceUrls = [
  "https://vega.github.io/vega-datasets/data/us-state-capitals.json",
  "https://raw.githubusercontent.com/vega/vega-datasets/main/data/us-state-capitals.json"
];

const viewBox = { x: -60, y: 10, width: 1020, height: 600 };
const stateFill = "#dbeafe";
const projection = {
  type: "albers-usa-d3",
  scale: 1300,
  translateX: 487.5,
  translateY: 305
};

const postalByName = {
  Alabama: "AL",
  Alaska: "AK",
  Arizona: "AZ",
  Arkansas: "AR",
  California: "CA",
  Colorado: "CO",
  Connecticut: "CT",
  Delaware: "DE",
  "District of Columbia": "DC",
  Florida: "FL",
  Georgia: "GA",
  Hawaii: "HI",
  Idaho: "ID",
  Illinois: "IL",
  Indiana: "IN",
  Iowa: "IA",
  Kansas: "KS",
  Kentucky: "KY",
  Louisiana: "LA",
  Maine: "ME",
  Maryland: "MD",
  Massachusetts: "MA",
  Michigan: "MI",
  Minnesota: "MN",
  Mississippi: "MS",
  Missouri: "MO",
  Montana: "MT",
  Nebraska: "NE",
  Nevada: "NV",
  "New Hampshire": "NH",
  "New Jersey": "NJ",
  "New Mexico": "NM",
  "New York": "NY",
  "North Carolina": "NC",
  "North Dakota": "ND",
  Ohio: "OH",
  Oklahoma: "OK",
  Oregon: "OR",
  Pennsylvania: "PA",
  "Rhode Island": "RI",
  "South Carolina": "SC",
  "South Dakota": "SD",
  Tennessee: "TN",
  Texas: "TX",
  Utah: "UT",
  Vermont: "VT",
  Virginia: "VA",
  Washington: "WA",
  "West Virginia": "WV",
  Wisconsin: "WI",
  Wyoming: "WY"
};

function slugify(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}`);
  }
  return response.json();
}

async function fetchWithFallback(urls) {
  let lastError;

  for (const url of urls) {
    try {
      return await fetchJson(url);
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError;
}

async function loadUsAtlas() {
  try {
    const topology = await fetchJson(usAtlasUrl);
    fs.mkdirSync(path.dirname(usAtlasPath), { recursive: true });
    fs.writeFileSync(usAtlasPath, `${JSON.stringify(topology)}\n`, "utf8");
    return topology;
  } catch (error) {
    if (!fs.existsSync(usAtlasPath)) {
      throw error;
    }
    return JSON.parse(fs.readFileSync(usAtlasPath, "utf8"));
  }
}

function decodeArcs(topology) {
  const [scaleX, scaleY] = topology.transform?.scale || [1, 1];
  const [translateX, translateY] = topology.transform?.translate || [0, 0];

  return topology.arcs.map((arc) => {
    let x = 0;
    let y = 0;

    return arc.map(([dx, dy]) => {
      x += dx;
      y += dy;

      return {
        x: x * scaleX + translateX,
        y: y * scaleY + translateY
      };
    });
  });
}

function getArc(decodedArcs, arcIndex) {
  if (arcIndex >= 0) {
    return decodedArcs[arcIndex];
  }

  return [...decodedArcs[~arcIndex]].reverse();
}

function formatPoint(point) {
  return `${Number(point.x.toFixed(1))} ${Number(point.y.toFixed(1))}`;
}

function ringToPoints(decodedArcs, ring) {
  const points = [];

  ring.forEach((arcIndex) => {
    const arc = getArc(decodedArcs, arcIndex);
    arc.forEach((point, pointIndex) => {
      const previous = points[points.length - 1];

      if (pointIndex === 0 && previous && previous.x === point.x && previous.y === point.y) {
        return;
      }

      points.push(point);
    });
  });

  return points;
}

function ringToPath(decodedArcs, ring) {
  const points = ringToPoints(decodedArcs, ring);

  if (points.length === 0) {
    return "";
  }

  const [first, ...rest] = points;
  return [`M ${formatPoint(first)}`, ...rest.map((point) => `L ${formatPoint(point)}`), "Z"].join(" ");
}

function geometryToPath(decodedArcs, geometry) {
  if (geometry.type === "Polygon") {
    return geometry.arcs.map((ring) => ringToPath(decodedArcs, ring)).filter(Boolean).join(" ");
  }

  if (geometry.type === "MultiPolygon") {
    return geometry.arcs
      .flatMap((polygon) => polygon.map((ring) => ringToPath(decodedArcs, ring)))
      .filter(Boolean)
      .join(" ");
  }

  return "";
}

function geometryToPoints(decodedArcs, geometry) {
  if (geometry.type === "Polygon") {
    return geometry.arcs.flatMap((ring) => ringToPoints(decodedArcs, ring));
  }

  if (geometry.type === "MultiPolygon") {
    return geometry.arcs.flatMap((polygon) => polygon.flatMap((ring) => ringToPoints(decodedArcs, ring)));
  }

  return [];
}

function computeBounds(points) {
  return points.reduce((bounds, point) => ({
    minX: Math.min(bounds.minX, point.x),
    minY: Math.min(bounds.minY, point.y),
    maxX: Math.max(bounds.maxX, point.x),
    maxY: Math.max(bounds.maxY, point.y)
  }), {
    minX: Infinity,
    minY: Infinity,
    maxX: -Infinity,
    maxY: -Infinity
  });
}

function makeLabelPosition(points) {
  const bounds = computeBounds(points);
  return {
    x: Math.round((bounds.minX + bounds.maxX) / 2),
    y: Math.round((bounds.minY + bounds.maxY) / 2)
  };
}

function buildStateFeatures(decodedArcs, stateGeometries) {
  return stateGeometries.map((geometry) => {
    const name = geometry.properties?.name;
    const id = slugify(name);
    const postal = postalByName[name] || "";

    return {
      id,
      name,
      type: "state",
      color: stateFill,
      labelPosition: makeLabelPosition(geometryToPoints(decodedArcs, geometry)),
      labelFontSize: 10,
      labelRotation: 0,
      sourcePostal: postal
    };
  });
}

function buildCapitalFeatures(capitalData) {
  const features = (Array.isArray(capitalData) ? capitalData : []).map((entry) => ({
    id: `capital-${slugify(entry.city || entry.name || "")}`,
    name: entry.city || entry.name,
    state: entry.state,
    type: "city",
    shape: "circle",
    lon: entry.lon,
    lat: entry.lat,
    hitRadius: 10,
    color: "#7aa5d6",
    icon: "capitol",
    iconScale: 1.1,
    labelOffset: { x: 10, y: 12 },
    iconOffset: { x: 0, y: 0 },
    labelFontSize: 10,
    labelRotation: 0
  })).filter((entry) => Number.isFinite(entry.lon) && Number.isFinite(entry.lat) && entry.name);

  features.push({
    id: "washington-dc",
    name: "Washington, DC",
    type: "city",
    shape: "circle",
    lon: -77.0369,
    lat: 38.9072,
    hitRadius: 12,
    color: "#7aa5d6",
    icon: "capitol",
    iconScale: 1.18,
    labelOffset: { x: 12, y: 13 },
    iconOffset: { x: 0, y: 0 },
    labelFontSize: 10,
    labelRotation: 0
  });

  return features;
}

function buildProofSheetFeatures(pathFeatures) {
  const colorsByPostal = {
    ME: "#4f83cc",
    NH: "#d65a8c",
    MA: "#d9b48f",
    RI: "#7aa35a",
    CT: "#7a5aa6"
  };
  const proofSheetPostals = ["ME", "NH", "MA", "RI", "CT"];
  const proofSheetStates = proofSheetPostals.map((postal) => {
    const state = pathFeatures.find((feature) => feature.sourcePostal === postal);
    return {
      id: state.id,
      name: state.name,
      type: "state",
      state: postal,
      shape: "path",
      mapShapeId: state.id,
      color: colorsByPostal[postal],
      labelPosition: state.labelPosition,
      labelFontSize: 12,
      labelRotation: 0
    };
  });
  const proofSheetCapitals = [
    ["augusta-me", "Augusta, ME", "Augusta", "ME", -69.7795, 44.3106, { x: -24, y: 14 }],
    ["concord-nh", "Concord, NH", "Concord", "NH", -71.5376, 43.2081, { x: -28, y: 14 }],
    ["boston-ma", "Boston, MA", "Boston", "MA", -71.0589, 42.3601, { x: -24, y: 14 }],
    ["providence-ri", "Providence, RI", "Providence", "RI", -71.4128, 41.824, { x: -36, y: 14 }],
    ["hartford-ct", "Hartford, CT", "Hartford", "CT", -72.6851, 41.7658, { x: -28, y: 14 }]
  ].map(([id, name, city, postal, lon, lat, labelOffset]) => ({
    id,
    name,
    city,
    state: postal,
    type: "capital",
    shape: "circle",
    lon,
    lat,
    hitRadius: 14,
    color: colorsByPostal[postal],
    icon: "capitol",
    iconScale: 1.1,
    labelOffset,
    iconOffset: { x: 0, y: 0 },
    labelFontSize: 11,
    labelRotation: 0
  }));

  return proofSheetStates.concat(proofSheetCapitals);
}

function makeProjectionJson() {
  return { ...projection };
}

async function main() {
  const topology = await loadUsAtlas();
  const decodedArcs = decodeArcs(topology);
  const stateGeometries = topology.objects.states.geometries
    .filter((geometry) => geometry.properties?.name)
    .sort((a, b) => a.properties.name.localeCompare(b.properties.name));
  const pathFeatures = buildStateFeatures(decodedArcs, stateGeometries);
  const stateSvgPaths = stateGeometries.map((geometry) => {
    const name = geometry.properties.name;
    const id = slugify(name);
    const pathData = geometryToPath(decodedArcs, geometry);
    return `    <path id="${id}" class="country-path context-path state-path" data-source-name="${name}" d="${pathData}" />`;
  }).join("\n");

  const svg = [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}" role="img" aria-label="United States map">`,
    `  <metadata>United States map generated from us-atlas states-albers-10m TopoJSON, derived from U.S. Census Bureau cartographic boundary files. Census boundary data is public domain. Projection/layout: D3 Albers USA composite with Alaska and Hawaii insets. Source: ${usAtlasUrl}.</metadata>`,
    `  <rect class="map-background" x="${viewBox.x}" y="${viewBox.y}" width="${viewBox.width}" height="${viewBox.height}" />`,
    `  <g id="usa-states">`,
    stateSvgPaths,
    `  </g>`,
    `</svg>`
  ].join("\n");

  const capitalData = await fetchWithFallback(capitalSourceUrls).catch(() => []);
  const capitalFeatures = buildCapitalFeatures(capitalData);
  const statesJson = {
    id: "us-states",
    title: "United States",
    baseMap: "usa-map",
    baseMapPath: "assets/maps/usa/usa-map.svg",
    projection: makeProjectionJson(),
    targetNoun: "state",
    defaultMode: "click-reveal",
    hideAnswerBank: true,
    features: pathFeatures.concat(capitalFeatures.find((feature) => feature.id === "washington-dc") || [])
  };
  const capitalsJson = {
    id: "us-capitals",
    title: "U.S. Capitals",
    baseMap: "usa-map",
    baseMapPath: "assets/maps/usa/usa-map.svg",
    projection: makeProjectionJson(),
    targetNoun: "capital",
    hideAnswerBank: true,
    features: capitalFeatures
  };
  const featuresJson = {
    id: "us-features",
    title: "United States Features",
    baseMap: "usa-map",
    baseMapPath: "assets/maps/usa/usa-map.svg",
    projection: makeProjectionJson(),
    hideAnswerBank: true,
    features: []
  };
  const statesCapitalsJson = {
    id: "us-states-capitals-01",
    title: "States and Capitals 1",
    baseMap: "usa-map",
    baseMapPath: "assets/maps/usa/usa-map.svg",
    projection: makeProjectionJson(),
    targetNoun: "state or capital",
    features: buildProofSheetFeatures(pathFeatures)
  };

  fs.mkdirSync(path.dirname(outputSvgPath), { recursive: true });
  fs.writeFileSync(outputSvgPath, `${svg}\n`, "utf8");
  fs.writeFileSync(statesOutputPath, `${JSON.stringify(statesJson, null, 2)}\n`, "utf8");
  fs.writeFileSync(capitalsOutputPath, `${JSON.stringify(capitalsJson, null, 2)}\n`, "utf8");
  fs.writeFileSync(featuresOutputPath, `${JSON.stringify(featuresJson, null, 2)}\n`, "utf8");
  fs.writeFileSync(statesCapitalsOutputPath, `${JSON.stringify(statesCapitalsJson, null, 2)}\n`, "utf8");

  console.log(`Wrote ${outputSvgPath}`);
  console.log(`Wrote ${statesOutputPath}`);
  console.log(`Wrote ${capitalsOutputPath}`);
  console.log(`Wrote ${featuresOutputPath}`);
  console.log(`Wrote ${statesCapitalsOutputPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
