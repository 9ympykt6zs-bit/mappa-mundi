const fs = require("fs");
const path = require("path");
const https = require("https");

const sourceUrl = "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_admin_1_states_provinces.geojson";
const repoRoot = path.resolve(__dirname, "..");
const outputDir = path.join(repoRoot, "assets", "maps", "data");
const sourceCachePath = path.join(repoRoot, ".tmp", "ne_10m_admin_1_states_provinces.geojson");
const admin1OutputPath = path.join(outputDir, "maplibre-north-america-admin1.geojson");
const mexicoActivityPath = path.join(outputDir, "mexico-states.json");
const canadaActivityPath = path.join(outputDir, "canada-provinces-territories.json");

const colors = [
  "#4f83cc",
  "#d65a8c",
  "#d9b48f",
  "#7aa35a",
  "#7a5aa6",
  "#d88052",
  "#54a6a6",
  "#b7a74a",
  "#8d9fd6",
  "#cc6f9f",
  "#7eb36a",
  "#c9935a"
];

const mexicoEntities = [
  ["aguascalientes", "Aguascalientes", "MX-AGU"],
  ["baja-california", "Baja California", "MX-BCN"],
  ["baja-california-sur", "Baja California Sur", "MX-BCS"],
  ["campeche", "Campeche", "MX-CAM"],
  ["chiapas", "Chiapas", "MX-CHP"],
  ["chihuahua", "Chihuahua", "MX-CHH"],
  ["coahuila", "Coahuila", "MX-COA"],
  ["colima", "Colima", "MX-COL"],
  ["durango", "Durango", "MX-DUR"],
  ["guanajuato", "Guanajuato", "MX-GUA"],
  ["guerrero", "Guerrero", "MX-GRO"],
  ["hidalgo", "Hidalgo", "MX-HID"],
  ["jalisco", "Jalisco", "MX-JAL"],
  ["mexico-city", "Mexico City", "MX-DIF"],
  ["mexico-state", "Mexico State", "MX-MEX"],
  ["michoacan", "Michoacán", "MX-MIC"],
  ["morelos", "Morelos", "MX-MOR"],
  ["nayarit", "Nayarit", "MX-NAY"],
  ["nuevo-leon", "Nuevo León", "MX-NLE"],
  ["oaxaca", "Oaxaca", "MX-OAX"],
  ["puebla", "Puebla", "MX-PUE"],
  ["queretaro", "Querétaro", "MX-QUE"],
  ["quintana-roo", "Quintana Roo", "MX-ROO"],
  ["san-luis-potosi", "San Luis Potosí", "MX-SLP"],
  ["sinaloa", "Sinaloa", "MX-SIN"],
  ["sonora", "Sonora", "MX-SON"],
  ["tabasco", "Tabasco", "MX-TAB"],
  ["tamaulipas", "Tamaulipas", "MX-TAM"],
  ["tlaxcala", "Tlaxcala", "MX-TLA"],
  ["veracruz", "Veracruz", "MX-VER"],
  ["yucatan", "Yucatán", "MX-YUC"],
  ["zacatecas", "Zacatecas", "MX-ZAC"]
];

const canadaEntities = [
  ["alberta", "Alberta", "CA-AB"],
  ["british-columbia", "British Columbia", "CA-BC"],
  ["manitoba", "Manitoba", "CA-MB"],
  ["new-brunswick", "New Brunswick", "CA-NB"],
  ["newfoundland-and-labrador", "Newfoundland and Labrador", "CA-NL"],
  ["nova-scotia", "Nova Scotia", "CA-NS"],
  ["ontario", "Ontario", "CA-ON"],
  ["prince-edward-island", "Prince Edward Island", "CA-PE"],
  ["quebec", "Quebec", "CA-QC"],
  ["saskatchewan", "Saskatchewan", "CA-SK"],
  ["northwest-territories", "Northwest Territories", "CA-NT"],
  ["nunavut", "Nunavut", "CA-NU"],
  ["yukon", "Yukon", "CA-YT"]
];

async function main() {
  fs.mkdirSync(path.dirname(sourceCachePath), { recursive: true });
  fs.mkdirSync(outputDir, { recursive: true });

  if (!fs.existsSync(sourceCachePath)) {
    await download(sourceUrl, sourceCachePath);
  }

  const source = JSON.parse(fs.readFileSync(sourceCachePath, "utf8"));
  const sourceByIso = new Map(source.features.map((feature) => [feature.properties?.iso_3166_2, feature]));
  const admin1Features = [
    ...buildAdmin1Features(sourceByIso, mexicoEntities, "Mexico"),
    ...buildAdmin1Features(sourceByIso, canadaEntities, "Canada")
  ];

  fs.writeFileSync(admin1OutputPath, `${JSON.stringify({
    type: "FeatureCollection",
    name: "maplibre-north-america-admin1",
    source: "Natural Earth ne_10m_admin_1_states_provinces, public domain",
    sourceUrl,
    features: admin1Features
  })}\n`);

  fs.writeFileSync(mexicoActivityPath, `${JSON.stringify(buildActivity({
    id: "mexico-states",
    title: "Mexico States",
    targetNoun: "state or federal entity",
    region: "mexico-states",
    entities: mexicoEntities,
    visibleAnswerLimit: 32
  }), null, 2)}\n`);

  fs.writeFileSync(canadaActivityPath, `${JSON.stringify(buildActivity({
    id: "canada-provinces-territories",
    title: "Canada Provinces and Territories",
    targetNoun: "province or territory",
    region: "canada-provinces-territories",
    entities: canadaEntities,
    visibleAnswerLimit: 13
  }), null, 2)}\n`);

  console.log(`Wrote ${admin1Features.length} admin-1 features.`);
}

function buildAdmin1Features(sourceByIso, entities, country) {
  return entities.map(([id, displayName, isoCode]) => {
    const sourceFeature = sourceByIso.get(isoCode);

    if (!sourceFeature) {
      throw new Error(`Missing ${displayName} (${isoCode})`);
    }

    const properties = sourceFeature.properties || {};

    return {
      type: "Feature",
      properties: {
        id,
        name: displayName,
        country,
        iso_3166_2: isoCode,
        postal: properties.postal || null,
        adm1_code: properties.adm1_code || null,
        sourceName: properties.name || null,
        sourceNameEn: properties.name_en || null,
        sourceGnName: properties.gn_name || null,
        sourceType: properties.type_en || properties.type || null,
        longitude: Number(properties.longitude),
        latitude: Number(properties.latitude)
      },
      geometry: sourceFeature.geometry
    };
  });
}

function buildActivity({ id, title, targetNoun, region, entities, visibleAnswerLimit }) {
  return {
    id,
    title,
    targetNoun,
    visibleAnswerLimit,
    map: {
      region,
      admin1Source: "north-america-admin1"
    },
    features: entities.map(([entityId, name, isoCode], index) => {
      const feature = JSON.parse(fs.readFileSync(admin1OutputPath, "utf8"))
        .features.find((item) => item.properties.id === entityId);

      return {
        id: entityId,
        name,
        type: "admin1",
        shape: "path",
        sourceFeatureId: entityId,
        iso_3166_2: isoCode,
        color: colors[index % colors.length],
        labelAnchor: [feature.properties.longitude, feature.properties.latitude],
        labelFontSize: 12,
        labelRotation: 0
      };
    })
  };
}

function download(url, destination) {
  return new Promise((resolve, reject) => {
    const request = https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download ${url}: ${response.statusCode}`));
        response.resume();
        return;
      }

      const file = fs.createWriteStream(destination);
      response.pipe(file);
      file.on("finish", () => {
        file.close(resolve);
      });
    });

    request.on("error", reject);
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
