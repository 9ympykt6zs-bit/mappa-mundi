export const baseWaterColor = "#1168b7";

export const globeTextureBounds = [
  [-180, 85],
  [180, 85],
  [180, -85],
  [-180, -85]
];

export const oceanTextureSize = {
  width: 2048,
  height: 1024
};

export const oceanRegionColors = {
  pacific: "#1f62bc",
  atlantic: "#33b2db",
  indian: "#1a96a8",
  arctic: "#c4ebf9",
  southern: "#5c71b5"
};

export function createBaseWaterImage() {
  if (typeof document === "undefined") {
    return "";
  }

  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 32;
  const context = canvas.getContext("2d");
  const gradient = context.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, "#1f8de2");
  gradient.addColorStop(0.46, baseWaterColor);
  gradient.addColorStop(1, "#074b94");
  context.fillStyle = gradient;
  context.fillRect(0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/png");
}
