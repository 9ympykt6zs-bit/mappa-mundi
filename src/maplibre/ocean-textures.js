export const baseWaterColor = "#173f63";
export const oceanZoneMutedColor = "#2f6f99";
export const oceanCompletedColor = "#244f8f";
export const oceanCompletedOutlineColor = "#c8def3";

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
  pacific: "#2f6f99",
  atlantic: "#34779e",
  indian: "#2d6f87",
  arctic: "#7fa7bf",
  southern: "#526f9b"
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
  gradient.addColorStop(0, "#225a80");
  gradient.addColorStop(0.46, baseWaterColor);
  gradient.addColorStop(1, "#0f2f4f");
  context.fillStyle = gradient;
  context.fillRect(0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/png");
}
