export const UNLABELED_US_MAP_HINT_ID = "unlabeled-us-map";
export const UNLABELED_US_MAP_SOURCE = "assets/maps/usa/usa-map.svg#usa-states";

export function createUnlabeledMapHintState({ available = false } = {}) {
  return {
    available: available === true,
    visible: false,
    used: false
  };
}

export function toggleUnlabeledMapHint(state = {}) {
  if (state.available !== true) return createUnlabeledMapHintState();
  const visible = state.visible !== true;
  return {
    available: true,
    visible,
    used: state.used === true || visible
  };
}

export function wasUnlabeledMapHintUsed(state = {}) {
  return state.available === true && state.used === true;
}
