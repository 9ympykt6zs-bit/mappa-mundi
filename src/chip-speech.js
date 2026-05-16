(function attachChipSpeech(global) {
  function isSpeechSupported() {
    return Boolean(global?.speechSynthesis && global?.SpeechSynthesisUtterance);
  }

  function speakLabel(labelText) {
    if (!isSpeechSupported()) {
      return false;
    }

    const text = String(labelText || "").trim();

    if (!text) {
      return false;
    }

    const utterance = new global.SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = 0.9;
    utterance.pitch = 1;

    global.speechSynthesis.cancel();
    global.speechSynthesis.speak(utterance);
    return true;
  }

  function stopChipInteraction(event) {
    event.preventDefault();
    event.stopPropagation();
  }

  function createSpeakerIcon() {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("focusable", "false");

    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", "M4 9v6h4l5 4V5L8 9H4z M16.5 8.5a5 5 0 0 1 0 7 M19 6a9 9 0 0 1 0 12");
    svg.appendChild(path);

    return svg;
  }

  function createChipSpeakerControl(labelText) {
    if (!isSpeechSupported()) {
      return null;
    }

    const speaker = document.createElement("span");
    speaker.className = "chip-speaker-button";
    speaker.setAttribute("role", "button");
    speaker.setAttribute("tabindex", "0");
    speaker.setAttribute("aria-label", `Hear ${labelText}`);
    speaker.setAttribute("title", `Hear ${labelText}`);
    speaker.appendChild(createSpeakerIcon());

    speaker.addEventListener("pointerdown", stopChipInteraction);
    speaker.addEventListener("mousedown", stopChipInteraction);
    speaker.addEventListener("touchstart", stopChipInteraction, { passive: false });
    speaker.addEventListener("dragstart", stopChipInteraction);
    speaker.addEventListener("click", (event) => {
      stopChipInteraction(event);
      speakLabel(labelText);
    });
    speaker.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") {
        return;
      }

      stopChipInteraction(event);
      speakLabel(labelText);
    });

    return speaker;
  }

  global.GeographyChipSpeech = {
    isSpeechSupported,
    speakLabel,
    createChipSpeakerControl
  };
})(window);
