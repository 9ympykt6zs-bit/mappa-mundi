import {
  clearPlaceMastery,
  getPlaceMastery,
  loadPlaceMastery,
  placeMasterySignalIds,
  recordPlaceMasteryAttempt
} from "./place-mastery-store.js";

const signalLabels = Object.freeze({
  recognition: "Recognition",
  naming: "Naming",
  locating: "Locating",
  relationships: "Relationships"
});

export function isMasteryDebugLocalHost(location = globalThis.location) {
  const hostname = String(location?.hostname || "").toLowerCase();
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
}

export function getMasterySignalForPromptType(promptType) {
  if (promptType === "name_to_place") return "locating";
  if (promptType === "place_to_name") return "naming";
  return null;
}

export function createMasteryDebugViewModel(place, state) {
  if (!place?.placeId) {
    return {
      placeId: "",
      placeLabel: "No current place",
      signals: placeMasterySignalIds.map((signalId) => ({
        signalId,
        label: signalLabels[signalId],
        attempts: 0,
        correct: 0,
        incorrect: 0,
        currentCorrectStreak: 0,
        lastAttemptAt: null,
        lastResult: null
      }))
    };
  }

  const mastery = getPlaceMastery(place.placeId, state);
  return {
    placeId: mastery.placeId,
    placeLabel: place.label || mastery.placeId,
    signals: placeMasterySignalIds.map((signalId) => ({
      signalId,
      label: signalLabels[signalId],
      ...mastery.signals[signalId]
    }))
  };
}

export function resetMasteryDebugData(storage, confirmReset) {
  const confirmed = confirmReset?.("Reset only local Meaningful Mastery test data?") === true;
  if (!confirmed) return false;
  clearPlaceMastery(storage);
  return true;
}

export function createMasteryDebugController(options = {}) {
  const location = options.location || globalThis.location;
  if (!isMasteryDebugLocalHost(location)) {
    return createInactiveController();
  }

  const document = options.document || globalThis.document;
  const storage = options.storage || globalThis.localStorage;
  if (!document?.body) return createInactiveController();

  let currentPlace = null;
  const button = document.createElement("button");
  button.id = "mastery-debug-toggle";
  button.className = "mastery-debug-toggle";
  button.type = "button";
  button.textContent = "Mastery Debug";
  button.setAttribute("aria-expanded", "false");
  button.setAttribute("aria-controls", "mastery-debug-panel");

  const panel = document.createElement("section");
  panel.id = "mastery-debug-panel";
  panel.className = "mastery-debug-panel";
  panel.setAttribute("aria-label", "Meaningful Mastery debug data");
  panel.hidden = true;
  panel.innerHTML = `
    <div class="mastery-debug-header">
      <div>
        <span class="mastery-debug-kicker">Local development only</span>
        <h2>Mastery Debug</h2>
      </div>
      <button class="mastery-debug-close" type="button" aria-label="Close Mastery Debug">Close</button>
    </div>
    <div class="mastery-debug-place">
      <strong data-mastery-place-label>No current place</strong>
      <code data-mastery-place-id>Start a Memory Trail prompt or select a place in Free Play.</code>
    </div>
    <div class="mastery-debug-signals" data-mastery-signals></div>
    <p class="mastery-debug-note">Memory Trail find prompts update Locating. Name prompts update Naming. Guided prompts do not count.</p>
    <div class="mastery-debug-footer">
      <button class="mastery-debug-reset" type="button">Reset mastery test data</button>
      <span class="mastery-debug-status" role="status" aria-live="polite"></span>
    </div>
    <div class="mastery-debug-confirm" hidden>
      <span>Reset only local mastery test data?</span>
      <div>
        <button class="mastery-debug-cancel-reset" type="button">Cancel</button>
        <button class="mastery-debug-confirm-reset" type="button">Confirm reset</button>
      </div>
    </div>
  `;

  const closeButton = panel.querySelector(".mastery-debug-close");
  const resetButton = panel.querySelector(".mastery-debug-reset");
  const resetConfirmation = panel.querySelector(".mastery-debug-confirm");
  const cancelResetButton = panel.querySelector(".mastery-debug-cancel-reset");
  const confirmResetButton = panel.querySelector(".mastery-debug-confirm-reset");
  const status = panel.querySelector(".mastery-debug-status");

  function setOpen(isOpen) {
    panel.hidden = !isOpen;
    button.setAttribute("aria-expanded", String(isOpen));
    if (isOpen) refresh();
  }

  function refresh() {
    const view = createMasteryDebugViewModel(currentPlace, loadPlaceMastery(storage));
    panel.querySelector("[data-mastery-place-label]").textContent = view.placeLabel;
    panel.querySelector("[data-mastery-place-id]").textContent = view.placeId
      || "Start a Memory Trail prompt or select a place in Free Play.";
    const signalList = panel.querySelector("[data-mastery-signals]");
    signalList.replaceChildren(...view.signals.map(createSignalCard));
    return view;
  }

  function createSignalCard(signal) {
    const card = document.createElement("article");
    card.className = "mastery-debug-signal";
    const lastAttempt = signal.lastAttemptAt
      ? new Date(signal.lastAttemptAt).toLocaleString()
      : "Never";
    card.innerHTML = `
      <h3></h3>
      <dl>
        <div><dt>Attempts</dt><dd data-value="attempts"></dd></div>
        <div><dt>Correct</dt><dd data-value="correct"></dd></div>
        <div><dt>Incorrect</dt><dd data-value="incorrect"></dd></div>
        <div><dt>Streak</dt><dd data-value="streak"></dd></div>
      </dl>
      <small></small>
    `;
    card.querySelector("h3").textContent = signal.label;
    card.querySelector('[data-value="attempts"]').textContent = String(signal.attempts);
    card.querySelector('[data-value="correct"]').textContent = String(signal.correct);
    card.querySelector('[data-value="incorrect"]').textContent = String(signal.incorrect);
    card.querySelector('[data-value="streak"]').textContent = String(signal.currentCorrectStreak);
    card.querySelector("small").textContent = signal.lastResult
      ? `Last: ${signal.lastResult} | ${lastAttempt}`
      : "No retrieval evidence yet";
    return card;
  }

  button.addEventListener("click", () => setOpen(panel.hidden));
  closeButton.addEventListener("click", () => setOpen(false));
  resetButton.addEventListener("click", () => {
    status.textContent = "";
    resetButton.hidden = true;
    resetConfirmation.hidden = false;
    cancelResetButton.focus();
  });
  cancelResetButton.addEventListener("click", () => {
    resetConfirmation.hidden = true;
    resetButton.hidden = false;
    resetButton.focus();
  });
  confirmResetButton.addEventListener("click", () => {
    resetMasteryDebugData(storage, () => true);
    resetConfirmation.hidden = true;
    resetButton.hidden = false;
    status.textContent = "Mastery test data cleared.";
    refresh();
  });

  document.body.append(button, panel);
  refresh();

  return {
    active: true,
    setCurrentPlace(place) {
      currentPlace = place?.placeId ? { placeId: place.placeId, label: place.label || place.placeId } : null;
      refresh();
    },
    recordAttempt(place, promptType, correct) {
      const signalId = getMasterySignalForPromptType(promptType);
      if (!place?.placeId || !signalId || typeof correct !== "boolean") return false;
      currentPlace = { placeId: place.placeId, label: place.label || place.placeId };
      recordPlaceMasteryAttempt(place.placeId, signalId, { correct }, storage);
      refresh();
      return true;
    },
    refresh,
    setOpen
  };
}

function createInactiveController() {
  return {
    active: false,
    setCurrentPlace: () => {},
    recordAttempt: () => false,
    refresh: () => null,
    setOpen: () => {}
  };
}
