const fs = require("fs");
const path = require("path");

const outputSvgPath = path.join("assets", "maps", "usa.svg");
const statesOutputPath = path.join("assets", "maps", "data", "us-states.json");
const capitalsOutputPath = path.join("assets", "maps", "data", "us-capitals.json");
const featuresOutputPath = path.join("assets", "maps", "data", "us-features.json");

const stateSourceUrls = [
  "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_1_states_provinces.geojson",
  "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_admin_1_states_provinces.geojson"
];

const capitalSourceUrls = [
  "https://vega.github.io/vega-datasets/data/us-state-capitals.json",
  "https://raw.githubusercontent.com/vega/vega-datasets/main/data/us-state-capitals.json"
];

const stateNames = new Set([
  "Alabama",
  "Alaska",
  "Arizona",
  "Arkansas",
  "California",
  "Colorado",
  "Connecticut",
  "Delaware",
  "District of Columbia",
  "Florida",
  "Georgia",
  "Hawaii",
  "Idaho",
  "Illinois",
  "Indiana",
  "Iowa",
  "Kansas",
  "Kentucky",
  "Louisiana",
  "Maine",
  "Maryland",
  "Massachusetts",
  "Michigan",
  "Minnesota",
  "Mississippi",
  "Missouri",
  "Montana",
  "Nebraska",
  "Nevada",
  "New Hampshire",
  "New Jersey",
  "New Mexico",
  "New York",
  "North Carolina",
  "North Dakota",
  "Ohio",
  "Oklahoma",
  "Oregon",
  "Pennsylvania",
  "Rhode Island",
  "South Carolina",
  "South Dakota",
  "Tennessee",
  "Texas",
  "Utah",
  "Vermont",
  "Virginia",
  "Washington",
  "West Virginia",
  "Wisconsin",
  "Wyoming"
]);

const regionSpecs = {
  lower48: {
    box: { x: 125, y: 64, width: 835, height: 418 },
    params: { lon0: -96, lat0: 37.5, standardParallel1: 29.5, standardParallel2: 45.5 }
  },
  alaska: {
    box: { x: 16, y: 377, width: 246, height: 205 },
    params: { lon0: -160, lat0: 60, standardParallel1: 55, standardParallel2: 65 }
  },
  hawaii: {
    box: { x: 254, y: 492, width: 182, height: 94 },
    params: { lon0: -157, lat0: 20, standardParallel1: 8, standardParallel2: 18 }
  }
};

const alaskaPostalCodes = new Set(["AK"]);
const hawaiiPostalCodes = new Set(["HI"]);

const viewport = { width: 975, height: 610 };
const stateFill = "#dbeafe";

function degToRad(value) {
  return (value * Math.PI) / 180;
}

function radToDeg(value) {
  return (value * 180) / Math.PI;
}

function createAlbersRawProjection({ lon0, lat0, standardParallel1, standardParallel2 }) {
  const phi1 = degToRad(standardParallel1);
  const phi2 = degToRad(standardParallel2);
  const phi0 = degToRad(lat0);
  const n = 0.5 * (Math.sin(phi1) + Math.sin(phi2));
  const c = Math.cos(phi1) ** 2 + 2 * n * Math.sin(phi1);
  const rho0 = Math.sqrt(c - 2 * n * Math.sin(phi0)) / n;
  const lambda0 = degToRad(lon0);

  return {
    forward(lon, lat) {
      const phi = degToRad(lat);
      const lambda = degToRad(lon);
      const theta = n * (lambda - lambda0);
      const rho = Math.sqrt(Math.max(0, c - 2 * n * Math.sin(phi))) / n;

      return {
        x: rho * Math.sin(theta),
        y: rho0 - rho * Math.cos(theta)
      };
    },
    inverse(x, y) {
      const theta = Math.atan2(x, rho0 - y);
      const rho = Math.sqrt(x * x + (rho0 - y) * (rho0 - y));

      if (!Number.isFinite(theta) || !Number.isFinite(rho) || rho === 0) {
        return null;
      }

      const lon = lon0 + radToDeg(theta / n);
      const lat = radToDeg(2 * Math.atan(Math.pow((c / (rho * rho)) ** 0.5, 1 / n)) - Math.PI / 2);

      return { lon, lat };
    }
  };
}

function collectCoordinates(geometry, callback) {
  if (!geometry) {
    return;
  }

  const { type, coordinates } = geometry;

  if (type === "Polygon") {
    coordinates.forEach((ring) => {
      ring.forEach(([lon, lat]) => callback(lon, lat));
    });
    return;
  }

  if (type === "MultiPolygon") {
    coordinates.forEach((polygon) => {
      polygon.forEach((ring) => {
        ring.forEach(([lon, lat]) => callback(lon, lat));
      });
    });
  }
}

function geometryToPath(geometry, project) {
  if (!geometry) {
    return "";
  }

  const { type, coordinates } = geometry;

  const ringToPath = (ring) => {
    if (!ring.length) {
      return "";
    }

    const commands = [];
    ring.forEach(([lon, lat], index) => {
      const point = project(lon, lat);
      if (!point) {
        return;
      }
      commands.push(`${index === 0 ? "M" : "L"} ${point.x.toFixed(1)} ${point.y.toFixed(1)}`);
    });
    commands.push("Z");
    return commands.join(" ");
  };

  if (type === "Polygon") {
    return coordinates.map(ringToPath).filter(Boolean).join(" ");
  }

  if (type === "MultiPolygon") {
    return coordinates
      .map((polygon) => polygon.map(ringToPath).filter(Boolean).join(" "))
      .filter(Boolean)
      .join(" ");
  }

  return "";
}

function computeBounds(points) {
  const bounds = {
    minX: Infinity,
    minY: Infinity,
    maxX: -Infinity,
    maxY: -Infinity
  };

  points.forEach((point) => {
    bounds.minX = Math.min(bounds.minX, point.x);
    bounds.minY = Math.min(bounds.minY, point.y);
    bounds.maxX = Math.max(bounds.maxX, point.x);
    bounds.maxY = Math.max(bounds.maxY, point.y);
  });

  return bounds;
}

function fitProjection(rawPoints, targetBox) {
  const bounds = computeBounds(rawPoints);
  const fitPoints = rawPoints.map((point) => ({ x: point.x, y: -point.y }));
  const fitBounds = computeBounds(fitPoints);
  const padding = 0.04;
  const width = Math.max(1, fitBounds.maxX - fitBounds.minX);
  const height = Math.max(1, fitBounds.maxY - fitBounds.minY);
  const scale = Math.min(
    (targetBox.width * (1 - padding * 2)) / width,
    (targetBox.height * (1 - padding * 2)) / height
  );

  return {
    scaleX: scale,
    scaleY: -scale,
    translateX: targetBox.x + (targetBox.width - width * scale) / 2 - fitBounds.minX * scale,
    translateY: targetBox.y + (targetBox.height - height * scale) / 2 - fitBounds.minY * scale,
    bounds
  };
}

function detectRegion(feature) {
  const props = feature.properties || {};
  const name = props.name || props.name_en || props.name_1 || "";
  const postal = (props.postal || props.iso_3166_2 || "").replace(/^US-/, "");

  if (alaskaPostalCodes.has(postal) || name === "Alaska") {
    return "alaska";
  }

  if (hawaiiPostalCodes.has(postal) || name === "Hawaii") {
    return "hawaii";
  }

  return "lower48";
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

function makePathId(name) {
  return `state-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`;
}

function makeLabelPositionFromPath(pathPoints) {
  const bounds = computeBounds(pathPoints);
  return {
    x: Math.round((bounds.minX + bounds.maxX) / 2),
    y: Math.round((bounds.minY + bounds.maxY) / 2)
  };
}

function buildStateDataset(states) {
  const regions = {
    lower48: { ...regionSpecs.lower48.params },
    alaska: { ...regionSpecs.alaska.params },
    hawaii: { ...regionSpecs.hawaii.params }
  };

  const regionProjectionSets = {
    lower48: createAlbersRawProjection(regionSpecs.lower48.params),
    alaska: createAlbersRawProjection(regionSpecs.alaska.params),
    hawaii: createAlbersRawProjection(regionSpecs.hawaii.params)
  };

  const regionRawPoints = {
    lower48: [],
    alaska: [],
    hawaii: []
  };

  states.forEach((feature) => {
    const region = detectRegion(feature);
    collectCoordinates(feature.geometry, (lon, lat) => {
      const raw = regionProjectionSets[region].forward(lon, lat);
      regionRawPoints[region].push(raw);
    });
  });

  const regionTransforms = {};
  Object.entries(regionSpecs).forEach(([region, spec]) => {
    const fit = fitProjection(regionRawPoints[region], spec.box);
    regionTransforms[region] = {
      type: "albers",
      lon0: spec.params.lon0,
      lat0: spec.params.lat0,
      standardParallel1: spec.params.standardParallel1,
      standardParallel2: spec.params.standardParallel2,
      scaleX: fit.scaleX,
      scaleY: fit.scaleY,
      translateX: fit.translateX,
      translateY: fit.translateY
    };
  });

  const project = (lon, lat) => {
    let region = "lower48";
    if (lat >= 50 && lon <= -130) {
      region = "alaska";
    } else if (lat >= 18 && lat <= 23.5 && lon <= -154 && lon >= -162) {
      region = "hawaii";
    }

    const proj = createAlbersRawProjection(regionSpecs[region].params);
    const raw = proj.forward(lon, lat);
    const transform = regionTransforms[region];

    return {
      x: raw.x * transform.scaleX + transform.translateX,
      y: raw.y * transform.scaleY + transform.translateY
    };
  };

  const pathFeatures = [];
  const capitalFeatures = [];

  states.forEach((feature) => {
    const props = feature.properties || {};
    const name = props.name || props.name_en || props.name_1;
    const postal = (props.postal || props.iso_3166_2 || "").replace(/^US-/, "");

    if (!name || !stateNames.has(name) || name === "District of Columbia") {
      return;
    }

    const id = makePathId(name);
    const region = detectRegion(feature);
    const stateProject = (lon, lat) => {
      const raw = regionProjectionSets[region].forward(lon, lat);
      const transform = regionTransforms[region];
      return {
        x: raw.x * transform.scaleX + transform.translateX,
        y: raw.y * transform.scaleY + transform.translateY
      };
    };

    const projectedPathPoints = [];
    collectCoordinates(feature.geometry, (lon, lat) => {
      projectedPathPoints.push(stateProject(lon, lat));
    });

    pathFeatures.push({
      id,
      name,
      type: "state",
      color: stateFill,
      labelPosition: makeLabelPositionFromPath(projectedPathPoints),
      labelFontSize: 10,
      labelRotation: 0,
      sourcePostal: postal
    });
  });

  return { pathFeatures, capitalFeatures, regionTransforms };
}

function formatPoint(point) {
  return `${point.x.toFixed(1)} ${point.y.toFixed(1)}`;
}

async function main() {
  const geojson = await fetchWithFallback(stateSourceUrls);
  const features = geojson.features || [];
  const states = features.filter((feature) => {
    const props = feature.properties || {};
    const name = props.name || props.name_en || props.name_1;
    const postal = (props.postal || props.iso_3166_2 || "").replace(/^US-/, "");
    return feature.geometry && stateNames.has(name) && (postal || name === "District of Columbia");
  });

  const { pathFeatures, regionTransforms } = buildStateDataset(states);

  const svgProjectors = {
    lower48: createAlbersRawProjection(regionSpecs.lower48.params),
    alaska: createAlbersRawProjection(regionSpecs.alaska.params),
    hawaii: createAlbersRawProjection(regionSpecs.hawaii.params)
  };

  const project = (lon, lat) => {
    let region = "lower48";
    if (lat >= 50 && lon <= -130) {
      region = "alaska";
    } else if (lat >= 18 && lat <= 23.5 && lon <= -154 && lon >= -162) {
      region = "hawaii";
    }

    const raw = svgProjectors[region].forward(lon, lat);
    const transform = regionTransforms[region];
    return {
      x: raw.x * transform.scaleX + transform.translateX,
      y: raw.y * transform.scaleY + transform.translateY
    };
  };

  const stateSvgPaths = states
    .filter((feature) => {
    const props = feature.properties || {};
    const name = props.name || props.name_en || props.name_1;
      return name && stateNames.has(name) && name !== "District of Columbia";
    })
    .map((feature) => {
      const props = feature.properties || {};
      const name = props.name || props.name_en || props.name_1;
      const id = makePathId(name);
      const pathData = geometryToPath(feature.geometry, project);
      return `    <path id="${id}" class="country-path context-path state-path" data-source-name="${name}" d="${pathData}" />`;
    })
    .join("\n");

  const svg = [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${viewport.width} ${viewport.height}" role="img" aria-label="United States map">`,
    `  <metadata>United States map generated from Natural Earth Admin 1 states/provinces data, public domain. Source: ${stateSourceUrls[0]}. Projection: Albers USA-style composite with lower 48, Alaska, and Hawaii insets; see us-states.json for region transforms. This SVG keeps real longitude/latitude coordinates intact for future state, capital, and feature placement.</metadata>`,
    `  <rect class="map-background" x="0" y="0" width="${viewport.width}" height="${viewport.height}" />`,
    `  <g id="usa-states">`,
    stateSvgPaths,
    `  </g>`,
    `</svg>`
  ].join("\n");

  const capitalData = await fetchWithFallback(capitalSourceUrls).catch(() => []);
  const capitalFeatures = (Array.isArray(capitalData) ? capitalData : []).map((entry) => ({
    id: `capital-${String(entry.city || entry.name || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`,
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

  capitalFeatures.push({
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

  const statesJson = {
    id: "us-states",
    title: "United States",
    baseMap: "usa",
    baseMapPath: "assets/maps/usa.svg",
    projection: {
      type: "albers-usa",
      regions: regionTransforms
    },
    targetNoun: "state",
    defaultMode: "click-reveal",
    hideAnswerBank: true,
    features: pathFeatures.concat(capitalFeatures.find((feature) => feature.id === "washington-dc") ? [capitalFeatures.find((feature) => feature.id === "washington-dc")] : [])
  };

  const capitalsJson = {
    id: "us-capitals",
    title: "U.S. Capitals",
    baseMap: "usa",
    baseMapPath: "assets/maps/usa.svg",
    projection: {
      type: "albers-usa",
      regions: regionTransforms
    },
    targetNoun: "capital",
    hideAnswerBank: true,
    features: capitalFeatures
  };

  const featuresJson = {
    id: "us-features",
    title: "United States Features",
    baseMap: "usa",
    baseMapPath: "assets/maps/usa.svg",
    projection: {
      type: "albers-usa",
      regions: regionTransforms
    },
    hideAnswerBank: true,
    features: []
  };

  fs.mkdirSync(path.dirname(outputSvgPath), { recursive: true });
  fs.writeFileSync(outputSvgPath, `${svg}\n`, "utf8");
  fs.writeFileSync(statesOutputPath, `${JSON.stringify(statesJson, null, 2)}\n`, "utf8");
  fs.writeFileSync(capitalsOutputPath, `${JSON.stringify(capitalsJson, null, 2)}\n`, "utf8");
  fs.writeFileSync(featuresOutputPath, `${JSON.stringify(featuresJson, null, 2)}\n`, "utf8");

  console.log(`Wrote ${outputSvgPath}`);
  console.log(`Wrote ${statesOutputPath}`);
  console.log(`Wrote ${capitalsOutputPath}`);
  console.log(`Wrote ${featuresOutputPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
