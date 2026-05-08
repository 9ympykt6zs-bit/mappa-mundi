const fs = require("fs");
const https = require("https");

const sourceUrl = "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_admin_0_countries.geojson";
const outputPath = "assets/maps/svg/europe-base.svg";
const viewBox = { x: 120, y: 180, width: 1185, height: 670 };
const projection = {
  type: "lambert-conformal-conic",
  lon0: 20,
  lat0: 52,
  standardParallel1: 35,
  standardParallel2: 65,
  extent: { west: -31, south: 30, east: 70, north: 73.5 },
  graticule: { west: -30, east: 70, south: 30, north: 70, step: 10, segmentStep: 1 }
};
const targetCountries = new Map([
  ["IRL", "ireland"],
  ["GBR", "united-kingdom"],
  ["PRT", "portugal"],
  ["ESP", "spain"],
  ["FRA", "france"]
]);
const includeExtent = { west: -38, south: 20, east: 86, north: 78 };

function fetchText(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        fetchText(response.headers.location).then(resolve, reject);
        return;
      }

      if (response.statusCode !== 200) {
        reject(new Error(`Fetch failed: ${response.statusCode}`));
        return;
      }

      let data = "";
      response.setEncoding("utf8");
      response.on("data", (chunk) => {
        data += chunk;
      });
      response.on("end", () => resolve(data));
    }).on("error", reject);
  });
}

function toRadians(value) {
  return (value * Math.PI) / 180;
}

function getProjectionConstants() {
  const phi1 = toRadians(projection.standardParallel1);
  const phi2 = toRadians(projection.standardParallel2);
  const phi0 = toRadians(projection.lat0);
  const n = Math.log(Math.cos(phi1) / Math.cos(phi2)) /
    Math.log(Math.tan(Math.PI / 4 + phi2 / 2) / Math.tan(Math.PI / 4 + phi1 / 2));
  const f = (Math.cos(phi1) * Math.pow(Math.tan(Math.PI / 4 + phi1 / 2), n)) / n;
  const rho0 = f / Math.pow(Math.tan(Math.PI / 4 + phi0 / 2), n);

  return { n, f, rho0 };
}

const constants = getProjectionConstants();

function rawProject(lon, lat) {
  const lambda = toRadians(lon);
  const lambda0 = toRadians(projection.lon0);
  const phi = toRadians(lat);
  const theta = constants.n * (lambda - lambda0);
  const rho = constants.f / Math.pow(Math.tan(Math.PI / 4 + phi / 2), constants.n);

  return {
    x: rho * Math.sin(theta),
    y: constants.rho0 - rho * Math.cos(theta)
  };
}

function sampleExtent() {
  const points = [];
  const { west, south, east, north } = projection.extent;

  for (let lon = west; lon <= east; lon += 1) {
    points.push(rawProject(lon, south), rawProject(lon, north));
  }

  for (let lat = south; lat <= north; lat += 1) {
    points.push(rawProject(west, lat), rawProject(east, lat));
  }

  return points;
}

function fitProjection() {
  const points = sampleExtent();
  const minX = Math.min(...points.map((point) => point.x));
  const maxX = Math.max(...points.map((point) => point.x));
  const minY = Math.min(...points.map((point) => point.y));
  const maxY = Math.max(...points.map((point) => point.y));
  const padding = 12;
  const scale = Math.min(
    (viewBox.width - padding * 2) / (maxX - minX),
    (viewBox.height - padding * 2) / (maxY - minY)
  );

  return {
    scaleX: scale,
    scaleY: -scale,
    translateX: viewBox.x + (viewBox.width - (maxX - minX) * scale) / 2 - minX * scale,
    translateY: viewBox.y + (viewBox.height + (maxY - minY) * scale) / 2 + minY * scale
  };
}

const fit = fitProjection();

function projectLonLat(lon, lat) {
  const raw = rawProject(lon, lat);

  return {
    x: raw.x * fit.scaleX + fit.translateX,
    y: raw.y * fit.scaleY + fit.translateY
  };
}

function formatNumber(value) {
  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

function ringToPath(ring) {
  const commands = ring.map((coordinate, index) => {
    const point = projectLonLat(coordinate[0], coordinate[1]);
    return `${index === 0 ? "M" : "L"} ${formatNumber(point.x)} ${formatNumber(point.y)}`;
  });

  commands.push("Z");
  return commands.join(" ");
}

function geometryToPath(geometry) {
  if (!geometry) {
    return "";
  }

  if (geometry.type === "Polygon") {
    return geometry.coordinates.map(ringToPath).join(" ");
  }

  if (geometry.type === "MultiPolygon") {
    return geometry.coordinates.flatMap((polygon) => polygon.map(ringToPath)).join(" ");
  }

  return "";
}

function geometryBounds(geometry) {
  const bounds = { west: Infinity, south: Infinity, east: -Infinity, north: -Infinity };

  function visit(value) {
    if (typeof value[0] === "number") {
      bounds.west = Math.min(bounds.west, value[0]);
      bounds.south = Math.min(bounds.south, value[1]);
      bounds.east = Math.max(bounds.east, value[0]);
      bounds.north = Math.max(bounds.north, value[1]);
      return;
    }

    value.forEach(visit);
  }

  visit(geometry.coordinates);
  return bounds;
}

function intersects(a, b) {
  return a.west <= b.east && a.east >= b.west && a.south <= b.north && a.north >= b.south;
}

function escapeAttribute(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;");
}

function slugify(value) {
  return String(value).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "country";
}

async function main() {
  const geojson = JSON.parse(await fetchText(sourceUrl));
  const contextPaths = [];
  const targetPaths = [];

  geojson.features.forEach((feature) => {
    const props = feature.properties || {};
    const a3 = props.ADM0_A3 || props.SOV_A3 || props.ISO_A3 || "";
    const id = targetCountries.get(a3);
    const bounds = geometryBounds(feature.geometry);

    if (!id && !intersects(bounds, includeExtent)) {
      return;
    }

    const d = geometryToPath(feature.geometry);

    if (!d) {
      return;
    }

    const sourceName = props.NAME_LONG || props.ADMIN || props.NAME || id;
    const path = id
      ? `    <path id="${id}" class="country-path" data-source-name="${escapeAttribute(sourceName)}" d="${d}" />`
      : `    <path id="context-${slugify(sourceName)}" class="context-path" data-source-name="${escapeAttribute(sourceName)}" d="${d}" />`;

    if (id) {
      targetPaths.push(path);
    } else {
      contextPaths.push(path);
    }
  });

  const metadata = [
    "Reusable Europe base map generated from Natural Earth Admin 0 Countries, 1:10m, public domain.",
    `Source: ${sourceUrl}.`,
    `Projection generated in code: Lambert conformal conic, lon0 ${projection.lon0}, lat0 ${projection.lat0}, standard parallels ${projection.standardParallel1}/${projection.standardParallel2}, source extent west ${projection.extent.west}, south ${projection.extent.south}, east ${projection.extent.east}, north ${projection.extent.north}, viewBox ${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}.`,
    `Projection fit: scaleX ${fit.scaleX}, scaleY ${fit.scaleY}, translateX ${fit.translateX}, translateY ${fit.translateY}.`
  ].join(" ");

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}" role="img" aria-label="Europe base map">
  <metadata>${escapeAttribute(metadata)}</metadata>
  <rect class="map-background" x="${viewBox.x}" y="${viewBox.y}" width="${viewBox.width}" height="${viewBox.height}" />
  <g id="context-countries">
${contextPaths.join("\n")}
  </g>
  <g id="target-countries">
${targetPaths.join("\n")}
  </g>
</svg>
`;

  fs.writeFileSync(outputPath, svg, "utf8");
  console.log(JSON.stringify({ projection, fit, targetCount: targetPaths.length, contextCount: contextPaths.length }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
