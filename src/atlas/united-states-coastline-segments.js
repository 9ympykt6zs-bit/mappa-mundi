const FLORIDA_GULF_OF_MEXICO_COORDINATES = Object.freeze([
  [-87.6348, 30.8661], [-87.3962, 30.6505], [-87.4477, 30.5105], [-87.3666, 30.4366],
  [-87.5183, 30.2804], [-86.7131, 30.3948], [-86.1887, 30.3342], [-85.4051, 29.9385],
  [-85.3028, 29.8089], [-85.3608, 29.6787], [-85.4118, 29.8598], [-85.3515, 29.6667],
  [-84.8706, 29.7971], [-84.888, 29.7224], [-84.5218, 29.9141], [-84.3491, 29.8968],
  [-84.4376, 29.9881], [-84.3418, 29.9703], [-84.2056, 30.1143], [-84.0068, 30.0976],
  [-83.6808, 29.9216], [-83.5842, 29.7585], [-83.4086, 29.6673], [-83.4003, 29.5172],
  [-83.0773, 29.2553], [-83.0565, 29.1299], [-82.8139, 29.1625], [-82.696, 28.9308],
  [-82.7387, 28.8248], [-82.6443, 28.5842], [-82.7835, 28.0526], [-82.8362, 28.0919],
  [-82.7861, 28.0479], [-82.8491, 27.8632], [-82.7347, 27.6119], [-82.5876, 27.819],
  [-82.7259, 27.9362], [-82.6867, 28.0302], [-82.5442, 27.9562], [-82.5339, 27.8329],
  [-82.4724, 27.8226], [-82.4619, 27.9386], [-82.3859, 27.8197], [-82.6413, 27.5255],
  [-82.7457, 27.5388], [-82.2619, 26.7171], [-82.1463, 26.7829], [-82.1831, 26.9358],
  [-82.0538, 26.9398], [-82.0821, 26.6536], [-82.1838, 26.6878], [-82.1057, 26.4839],
  [-81.9981, 26.5327], [-81.8825, 26.4027], [-81.7295, 25.9094], [-81.2903, 25.6875],
  [-81.123, 25.3791], [-81.172, 25.2223], [-81.0879, 25.1162], [-80.4655, 25.2118],
  [-80.4333, 25.1078], [-80.6577, 24.8974]
]);

const FLORIDA_ATLANTIC_OCEAN_COORDINATES = Object.freeze([
  [-80.6577, 24.8974], [-80.3582, 25.1532], [-80.253, 25.3383], [-80.4167, 25.1987],
  [-80.3054, 25.3877], [-80.3067, 25.6128], [-80.2026, 25.7482], [-80.1563, 25.6662],
  [-80.121, 25.8132], [-80.0314, 26.7963], [-80.572, 28.1116], [-80.5742, 28.5853],
  [-80.9662, 29.148], [-81.2539, 29.7769], [-81.4559, 30.5134], [-81.4258, 30.7005],
  [-81.9495, 30.8279]
]);

const COASTLINE_SEGMENTS = Object.freeze([
  Object.freeze({
    stateId: "florida",
    waterFeatureId: "gulf-of-mexico",
    geometry: Object.freeze({ type: "LineString", coordinates: FLORIDA_GULF_OF_MEXICO_COORDINATES })
  }),
  Object.freeze({
    stateId: "florida",
    waterFeatureId: "atlantic-ocean",
    geometry: Object.freeze({ type: "LineString", coordinates: FLORIDA_ATLANTIC_OCEAN_COORDINATES })
  })
]);

export function getUnitedStatesCoastlineSegmentGeometry(stateId, waterFeatureId) {
  const segment = COASTLINE_SEGMENTS.find((candidate) => (
    candidate.stateId === stateId && candidate.waterFeatureId === waterFeatureId
  ));
  return segment ? {
    type: segment.geometry.type,
    coordinates: segment.geometry.coordinates.map((point) => [...point])
  } : null;
}

export function listUnitedStatesCoastlineSegments() {
  return COASTLINE_SEGMENTS.map((segment) => ({
    stateId: segment.stateId,
    waterFeatureId: segment.waterFeatureId,
    geometry: getUnitedStatesCoastlineSegmentGeometry(segment.stateId, segment.waterFeatureId)
  }));
}
