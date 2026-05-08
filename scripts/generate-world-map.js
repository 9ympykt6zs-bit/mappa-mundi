const fs = require("fs");
const https = require("https");

const sourceUrl = "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson";
const outputPath = "assets/maps/world/world-map.svg";
const viewBox = { x: 0, y: 0, width: 1440, height: 720 };
const projection = {
  type: "equirectangular",
  lon0: 0,
  lat0: 0,
  scaleX: 4,
  scaleY: -4,
  translateX: 720,
  translateY: 360
};

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

function projectLonLat(lon, lat) {
  return {
    x: lon * projection.scaleX + projection.translateX,
    y: lat * projection.scaleY + projection.translateY
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
  const countryPaths = [];

  geojson.features.forEach((feature) => {
    const props = feature.properties || {};
    const name = props.NAME_LONG || props.ADMIN || props.NAME || "Country";
    const d = geometryToPath(feature.geometry);

    if (!d) {
      return;
    }

    countryPaths.push(`    <path id="world-${slugify(name)}" class="country-path context-path" data-source-name="${escapeAttribute(name)}" d="${d}" />`);
  });

  const metadata = [
    "World map generated from Natural Earth Admin 0 country data, 1:110m, public domain.",
    `Source: ${sourceUrl}.`,
    "Projection: equirectangular, lon0 0, lat0 0, scaleX 4, scaleY -4, translateX 720, translateY 360.",
    "This map keeps real longitude/latitude coordinates intact so future locations can be projected directly."
  ].join(" ");

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}" role="img" aria-label="World map">
  <metadata>${escapeAttribute(metadata)}</metadata>
  <rect class="map-background" x="${viewBox.x}" y="${viewBox.y}" width="${viewBox.width}" height="${viewBox.height}" />
  <g id="world-countries">
${countryPaths.join("\n")}
  </g>
</svg>
`;

  fs.writeFileSync(outputPath, svg, "utf8");
  console.log(JSON.stringify({ sourceUrl, outputPath, countryCount: countryPaths.length }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
