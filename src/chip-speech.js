(function attachChipSpeech(global) {
  const audioManifestUrl = "assets/audio/audio-manifest.json";
  let audioManifestPromise = null;
  let audioManifestLookup = null;
  let currentAudio = null;

  function isLocalAudioSupported() {
    return Boolean(global?.Audio && global?.fetch);
  }

  function isSpeechSupported() {
    return Boolean(global?.speechSynthesis && global?.SpeechSynthesisUtterance);
  }

  function isAudioOutputSupported() {
    return isLocalAudioSupported() || isSpeechSupported();
  }

  function getSpeechFallbackDurationMs(labelText) {
    const text = String(labelText || "").trim();
    return Math.max(1200, Math.min(4200, 650 + text.length * 85));
  }

  function createUtterance(labelText) {
    const text = String(labelText || "").trim();

    if (!text) {
      return null;
    }

    const utterance = new global.SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = 0.9;
    utterance.pitch = 1;
    return utterance;
  }

  function sanitizeAudioLookupKey(text) {
    return String(text || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  function normalizeSpokenText(value) {
    return String(value || "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function getAudioManifest() {
    if (!isLocalAudioSupported()) {
      return Promise.resolve(null);
    }

    if (!audioManifestPromise) {
      audioManifestPromise = global.fetch(audioManifestUrl)
        .then((response) => {
          if (!response.ok) {
            throw new Error(`Audio manifest request failed: ${response.status}`);
          }

          return response.json();
        })
        .then(createAudioManifestLookup)
        .catch((error) => {
          debugChipSpeech(error.message || "Audio manifest unavailable", "manifest");
          return null;
        });
    }

    return audioManifestPromise;
  }

  function createAudioManifestLookup(manifest) {
    const exact = new Map();
    const sanitized = new Map();
    const entries = [
      ...Object.entries(manifest?.chips || {}),
      ...Object.entries(manifest?.instructions || {})
    ];

    entries.forEach(([text, audioPath]) => {
      const normalizedText = normalizeSpokenText(text);
      const key = sanitizeAudioLookupKey(normalizedText);

      if (!normalizedText || !audioPath) {
        return;
      }

      exact.set(normalizedText, audioPath);

      if (key && !sanitized.has(key)) {
        sanitized.set(key, audioPath);
      }

      const pathKey = getAudioPathLookupKey(audioPath);
      if (pathKey && !sanitized.has(pathKey)) {
        sanitized.set(pathKey, audioPath);
      }
    });

    audioManifestLookup = { exact, sanitized };
    return audioManifestLookup;
  }

  function findLocalAudioPath(labelText) {
    const lookup = audioManifestLookup;
    const text = normalizeSpokenText(labelText);

    if (!lookup || !text) {
      return null;
    }

    return lookup.exact.get(text) || lookup.sanitized.get(sanitizeAudioLookupKey(text)) || null;
  }

  function getAudioPathLookupKey(audioPath) {
    return String(audioPath || "")
      .split("/")
      .pop()
      ?.replace(/\.mp3$/i, "") || "";
  }

  function stopCurrentAudio() {
    if (!currentAudio) {
      return;
    }

    currentAudio.__atlasQuestCancelled = true;
    currentAudio.pause();
    currentAudio.removeAttribute("src");
    currentAudio.load();
    currentAudio = null;
  }

  function stopBrowserSpeech() {
    if (isSpeechSupported()) {
      global.speechSynthesis.cancel();
    }
  }

  function playLocalAudio(audioPath, onComplete) {
    return new Promise((resolve) => {
      if (!audioPath || !isLocalAudioSupported()) {
        resolve(false);
        return;
      }

      stopCurrentAudio();
      stopBrowserSpeech();

      const audio = new global.Audio(audioPath);
      currentAudio = audio;

      let isFinished = false;
      const finish = (didPlay) => {
        if (isFinished) {
          return;
        }

        isFinished = true;

        if (audio.__atlasQuestCancelled) {
          resolve(true);
          return;
        }

        if (currentAudio === audio) {
          currentAudio = null;
        }

        if (didPlay) {
          onComplete?.();
        }
        resolve(didPlay);
      };

      audio.addEventListener("ended", () => finish(true), { once: true });
      audio.addEventListener("error", () => finish(false), { once: true });

      const playResult = audio.play();

      if (playResult?.catch) {
        playResult.catch(() => finish(false));
      }
    });
  }

  function scheduleCompletionFallback(labelText, onComplete) {
    global.setTimeout(() => {
      onComplete?.();
    }, getSpeechFallbackDurationMs(labelText));
  }

  function speakWithBrowserSpeech(labelText) {
    if (!isSpeechSupported()) {
      return false;
    }

    const utterance = createUtterance(labelText);

    if (!utterance) {
      return false;
    }

    stopCurrentAudio();
    global.speechSynthesis.cancel();
    global.speechSynthesis.speak(utterance);
    return true;
  }

  function speakLabel(labelText) {
    const text = normalizeSpokenText(labelText);

    if (!text || !isAudioOutputSupported()) {
      return false;
    }

    getAudioManifest().then((lookup) => {
      const audioPath = lookup ? findLocalAudioPath(text) : null;

      if (!audioPath) {
        speakWithBrowserSpeech(text);
        return;
      }

      playLocalAudio(audioPath).then((didPlay) => {
        if (!didPlay) {
          speakWithBrowserSpeech(text);
        }
      });
    });

    return true;
  }

  function speakLabelWithCompletion(labelText, onComplete) {
    const text = normalizeSpokenText(labelText);

    if (!text || !isAudioOutputSupported()) {
      return false;
    }

    getAudioManifest().then((lookup) => {
      const audioPath = lookup ? findLocalAudioPath(text) : null;

      if (!audioPath) {
        if (!speakWithBrowserSpeechWithCompletion(text, onComplete)) {
          scheduleCompletionFallback(text, onComplete);
        }
        return;
      }

      playLocalAudio(audioPath, onComplete).then((didPlay) => {
        if (!didPlay && !speakWithBrowserSpeechWithCompletion(text, onComplete)) {
          scheduleCompletionFallback(text, onComplete);
        }
      });
    });

    return true;
  }

  function speakWithBrowserSpeechWithCompletion(labelText, onComplete) {
    if (!isSpeechSupported()) {
      return false;
    }

    const utterance = createUtterance(labelText);

    if (!utterance) {
      return false;
    }

    let isFinished = false;
    const finish = () => {
      if (isFinished) {
        return;
      }

      isFinished = true;
      onComplete?.();
    };

    const fallbackTimer = global.setTimeout(finish, getSpeechFallbackDurationMs(labelText));
    utterance.onend = () => {
      global.clearTimeout(fallbackTimer);
      finish();
    };
    utterance.onerror = () => {
      global.clearTimeout(fallbackTimer);
      finish();
    };

    stopCurrentAudio();
    global.speechSynthesis.cancel();
    global.speechSynthesis.speak(utterance);
    return true;
  }

  function stopChipInteraction(event) {
    event.preventDefault();
    event.stopPropagation();
  }

  function stopChipGesture(event) {
    event.stopPropagation();
  }

  function isChipSpeechDebugEnabled() {
    try {
      return global.localStorage?.getItem("geography-memory-debug-chip-speech") === "true";
    } catch {
      return false;
    }
  }

  function debugChipSpeech(labelText, eventType) {
    if (!isChipSpeechDebugEnabled()) {
      return;
    }

    console.debug("[chip-speech]", eventType, labelText);
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
    if (!isAudioOutputSupported()) {
      return null;
    }

    const speaker = document.createElement("span");
    speaker.className = "chip-speaker-button";
    speaker.setAttribute("role", "button");
    speaker.setAttribute("tabindex", "0");
    speaker.setAttribute("aria-label", `Hear ${labelText}`);
    speaker.setAttribute("title", `Hear ${labelText}`);
    speaker.appendChild(createSpeakerIcon());

    let lastSpeechGestureAt = 0;
    const speakFromGesture = (event) => {
      stopChipInteraction(event);
      lastSpeechGestureAt = Date.now();
      debugChipSpeech(labelText, event.type);
      speakLabel(labelText);
    };

    const speakFromFallbackClick = (event) => {
      stopChipInteraction(event);

      if (Date.now() - lastSpeechGestureAt < 500) {
        return;
      }

      lastSpeechGestureAt = Date.now();
      debugChipSpeech(labelText, event.type);
      speakLabel(labelText);
    };

    speaker.addEventListener("pointerdown", stopChipGesture);
    speaker.addEventListener("pointerup", speakFromGesture);
    speaker.addEventListener("pointercancel", stopChipInteraction);
    speaker.addEventListener("mousedown", stopChipGesture);
    speaker.addEventListener("mouseup", stopChipGesture);
    speaker.addEventListener("touchstart", stopChipGesture, { passive: true });
    speaker.addEventListener("touchend", (event) => {
      if (global.PointerEvent && Date.now() - lastSpeechGestureAt < 500) {
        stopChipInteraction(event);
        return;
      }

      speakFromGesture(event);
    }, { passive: false });
    speaker.addEventListener("touchcancel", stopChipInteraction, { passive: false });
    speaker.addEventListener("dragstart", stopChipInteraction);
    speaker.addEventListener("click", speakFromFallbackClick);
    speaker.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") {
        return;
      }

      speakFromGesture(event);
    });

    return speaker;
  }

  global.GeographyChipSpeech = {
    getAudioManifest,
    isSpeechSupported,
    isLocalAudioSupported,
    speakLabel,
    speakLabelWithCompletion,
    createChipSpeakerControl
  };

  getAudioManifest();
})(window);
