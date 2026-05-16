import {
  oceanRegionColors,
  oceanRegionTextureUrl,
  oceanTextureSize
} from "./ocean-textures.js?v=global-ocean-png";

const preview = document.querySelector("#texture-preview");
const legend = document.querySelector("#legend");
const rawSvgLink = document.querySelector("#raw-svg-link");

const image = document.createElement("img");
image.id = "ocean-region-texture-image";
image.src = oceanRegionTextureUrl;
image.alt = `${oceanTextureSize.width} by ${oceanTextureSize.height} ocean region PNG texture`;
preview.append(image);

rawSvgLink.href = oceanRegionTextureUrl;

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
  detail.textContent = region === "pacific" ? "Full-background base layer" : "Painted into the PNG texture";

  copy.append(name, detail);
  card.append(swatch, copy);
  legend.append(card);
});
