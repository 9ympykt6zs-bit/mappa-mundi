import {
  oceanRegionColors,
  oceanTextureSize
} from "./ocean-textures.js?v=ocean-geojson-regions";

const preview = document.querySelector("#texture-preview");
const legend = document.querySelector("#legend");
const rawSvgLink = document.querySelector("#raw-svg-link");
const oceanZonesPath = "assets/maps/data/ocean-zones.geojson";

const notice = document.createElement("p");
notice.className = "texture-preview-note";
notice.textContent = `The retired ${oceanTextureSize.width} by ${oceanTextureSize.height} ocean PNG is no longer used. Ocean regions now render directly from ${oceanZonesPath}.`;
preview.append(notice);

rawSvgLink.href = oceanZonesPath;

const regionLabels = {
  pacific: "Pacific Ocean",
  atlantic: "Atlantic Ocean",
  indian: "Indian Ocean",
  arctic: "Arctic Ocean",
  southern: "Southern Ocean"
};

Object.entries(oceanRegionColors).forEach(([region, color]) => {
  const card = document.createElement("article");
  card.className = "region";

  const swatch = document.createElement("span");
  swatch.className = "swatch";
  swatch.style.backgroundColor = color;
  swatch.setAttribute("aria-hidden", "true");

  const copy = document.createElement("div");
  const name = document.createElement("strong");
  const detail = document.createElement("span");

  name.textContent = regionLabels[region];
  detail.textContent = "Rendered from ocean-zones.geojson";

  copy.append(name, detail);
  card.append(swatch, copy);
  legend.append(card);
});
