(function attachChipSpeech(global) {
  const audioManifestUrl = "assets/audio/audio-manifest.json?v=20260621-washington-dc-audio-1";
  const audioMutedStorageKey = "atlasQuestAudioMuted";
  let audioManifestPromise = null;
  let audioManifestLookup = null;
  let currentAudio = null;
  let currentAudioCancel = null;
  let currentSpeechFinish = null;
  let sharedAudio = null;
  let speechQueue = Promise.resolve();
  const activeSpeechRequestsByKey = new Map();
  let isAudioMuted = loadAudioMuted();
  const localAudioMaxDurationMs = 6500;
  const pronunciationOverrides = Object.freeze({
    rondonia: {
      lang: "pt-BR",
      speakAs: "Rond\u00f4nia"
    },
    roraima: {
      lang: "pt-BR",
      speakAs: "Roraima"
    }
  });
  const audioLookupAliases = Object.freeze({
    "washington-d-c": "Washington D.C.",
    "washington-dc": "Washington D.C.",
    "district-of-columbia": "Washington D.C."
  });

  function isLocalAudioSupported() {
    return Boolean(global?.Audio && global?.fetch);
  }

  function isSpeechSupported() {
    return Boolean(global?.speechSynthesis && global?.SpeechSynthesisUtterance);
  }

  function isAudioOutputSupported() {
    return isLocalAudioSupported() || isSpeechSupported();
  }

  function loadAudioMuted() {
    try {
      return global.localStorage?.getItem(audioMutedStorageKey) === "true";
    } catch {
      return false;
    }
  }

  function getAudioMuted() {
    return isAudioMuted;
  }

  function setAudioMuted(nextMuted) {
    isAudioMuted = Boolean(nextMuted);

    try {
      global.localStorage?.setItem(audioMutedStorageKey, String(isAudioMuted));
    } catch {
      // Muting still works for this page session if localStorage is unavailable.
    }

    if (isAudioMuted) {
      stopAudio();
    }

    if (global.CustomEvent && global.dispatchEvent) {
      global.dispatchEvent(new global.CustomEvent("atlas-quest-audio-muted-change", {
        detail: { muted: isAudioMuted }
      }));
    }

    return isAudioMuted;
  }

  function toggleAudioMuted() {
    return setAudioMuted(!isAudioMuted);
  }

  function getSpeechFallbackDurationMs(labelText) {
    const text = String(labelText || "").trim();
    return Math.max(1200, Math.min(4200, 650 + text.length * 85));
  }

  function createUtterance(labelText, options = {}) {
    const text = normalizeSpokenText(options.speakAs || options.speakText || labelText);

    if (!text) {
      return null;
    }

    const utterance = new global.SpeechSynthesisUtterance(text);
    utterance.lang = options.lang || "en-US";
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

  function stripStateSuffixForSpeech(labelText) {
    const text = normalizeSpokenText(labelText);
    const match = text.match(/^(.+?)(?:,?\s+[A-Z]{2})$/);
    return match ? match[1].trim() : text;
  }

  function getSpokenPlaceName(labelText) {
    return stripStateSuffixForSpeech(labelText);
  }

  function getPronunciationOverride(labelText) {
    const key = sanitizeAudioLookupKey(getSpokenPlaceName(labelText));
    return key ? pronunciationOverrides[key] || null : null;
  }

  function resolveSpeechText(labelText) {
    const text = getSpokenPlaceName(labelText);
    const override = getPronunciationOverride(text);

    return {
      text,
      lookupText: text,
      speakText: override?.speakAs || text,
      lang: override?.lang || "en-US",
      preferBrowserSpeech: override?.preferBrowserSpeech === true,
      hasOverride: Boolean(override)
    };
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

    const canonicalText = audioLookupAliases[sanitizeAudioLookupKey(text)] || text;
    return lookup.exact.get(canonicalText)
      || lookup.sanitized.get(sanitizeAudioLookupKey(canonicalText))
      || lookup.exact.get(text)
      || lookup.sanitized.get(sanitizeAudioLookupKey(text))
      || null;
  }

  function normalizeSpeechDedupeKey(value) {
    return String(value || "").trim();
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
    currentAudioCancel?.();
    currentAudioCancel = null;
    currentAudio.pause();
    currentAudio.removeAttribute("src");
    currentAudio.load();
    currentAudio = null;
  }

  function getSharedAudio() {
    if (!sharedAudio && isLocalAudioSupported()) {
      sharedAudio = new global.Audio();
      sharedAudio.preload = "auto";
    }

    return sharedAudio;
  }

  function primeLocalAudio() {
    if (isAudioMuted) {
      return;
    }

    getSharedAudio();
  }

  function stopBrowserSpeech() {
    if (isSpeechSupported()) {
      currentSpeechFinish?.();
      currentSpeechFinish = null;
      global.speechSynthesis.cancel();
    }
  }

  function stopAudio() {
    stopCurrentAudio();
    stopBrowserSpeech();
  }

  function playLocalAudio(audioPath, options = {}) {
    return new Promise((resolve) => {
      if (!audioPath || !isLocalAudioSupported()) {
        resolve(false);
        return;
      }

      if (isAudioMuted) {
        resolve(false);
        return;
      }

      stopCurrentAudio();
      stopBrowserSpeech();

      const audio = getSharedAudio();

      if (!audio) {
        resolve(false);
        return;
      }

      audio.__atlasQuestCancelled = false;
      audio.__atlasQuestPlaybackStarted = false;
      audio.src = audioPath;
      currentAudio = audio;

      let isFinished = false;
      let timeoutId = null;
      const finish = (didPlay) => {
        if (isFinished) {
          return;
        }

        isFinished = true;
        global.clearTimeout(timeoutId);

        if (audio.__atlasQuestCancelled) {
          resolve(true);
          return;
        }

        if (currentAudio === audio) {
          currentAudio = null;
        }

        if (currentAudioCancel === cancelPlayback) {
          currentAudioCancel = null;
        }

        resolve(didPlay);
      };
      const cancelPlayback = () => {
        cleanup();
        finish(false);
      };

      const cleanup = () => {
        global.clearTimeout(timeoutId);
        audio.removeEventListener("playing", handlePlaying);
        audio.removeEventListener("ended", handleEnded);
        audio.removeEventListener("error", handleError);
      };
      const handlePlaying = () => {
        if (audio.__atlasQuestPlaybackStarted) {
          return;
        }

        audio.__atlasQuestPlaybackStarted = true;
        // A generated MP3 has claimed this narration event. Any queued browser
        // fallback would duplicate it, so stop it before the MP3 becomes audible.
        stopBrowserSpeech();
        logChipSpeechDebug("local-audio-started", { audioPath });
      };
      const handleEnded = () => {
        cleanup();
        finish(true);
      };
      const handleError = () => {
        cleanup();
        warnMemoryTrailAudioFailure(audioPath, "audio element error", options);
        // If playback already began, do not start browser speech for the same
        // narration event. It would overlap or repeat the generated voice.
        finish(audio.__atlasQuestPlaybackStarted === true);
      };

      audio.addEventListener("playing", handlePlaying);
      audio.addEventListener("ended", handleEnded);
      audio.addEventListener("error", handleError);
      currentAudioCancel = cancelPlayback;
      timeoutId = global.setTimeout(() => {
        cleanup();
        warnMemoryTrailAudioFailure(audioPath, "audio playback timed out", options);
        if (currentAudio === audio) {
          audio.pause();
          audio.removeAttribute("src");
          audio.load();
          currentAudio = null;
        }
        if (currentAudioCancel === cancelPlayback) {
          currentAudioCancel = null;
        }
        finish(audio.__atlasQuestPlaybackStarted === true);
      }, getAudioPlaybackTimeoutMs(audioPath, options));

      const playResult = audio.play();

      if (playResult?.then) {
        playResult.then(handlePlaying);
      }

      if (playResult?.catch) {
        playResult.catch((error) => {
          cleanup();
          warnMemoryTrailAudioFailure(audioPath, error, options);
          finish(audio.__atlasQuestPlaybackStarted === true);
        });
      }
    });
  }

  function getAudioPlaybackTimeoutMs(audioPath, options = {}) {
    const configuredTimeout = Number(options.timeoutMs);
    if (Number.isFinite(configuredTimeout) && configuredTimeout > 0) {
      return configuredTimeout;
    }

    const path = String(audioPath || "");
    const filename = path.split("/").pop() || path;
    const estimatedDuration = 900 + filename.length * 70;
    return Math.max(2400, Math.min(localAudioMaxDurationMs, estimatedDuration));
  }

  function warnMemoryTrailAudioFailure(audioPath, error, options = {}) {
    if (!options.warnOnAudioFailure) {
      return;
    }

    console.warn("[memory-trail-audio] Local audio playback failed; falling back to browser speech.", {
      audioPath,
      error
    });
  }

  function speakWithBrowserSpeech(labelText, speechOptions = {}) {
    if (!isSpeechSupported()) {
      return false;
    }

    if (isAudioMuted) {
      return false;
    }

    const resolved = resolveSpeechText(labelText);
    const utterance = createUtterance(resolved.text, {
      ...resolved,
      ...speechOptions
    });

    if (!utterance) {
      return false;
    }

    stopCurrentAudio();
    global.speechSynthesis.cancel();
    global.speechSynthesis.speak(utterance);
    return true;
  }

  function speakLabel(labelText) {
    const speech = resolveSpeechText(labelText);
    const text = speech.text;

    if (!text || !isAudioOutputSupported()) {
      return false;
    }

    if (isAudioMuted) {
      return false;
    }

    const playFromLookup = (lookup) => {
      const audioPath = lookup && !speech.preferBrowserSpeech ? findLocalAudioPath(speech.lookupText) : null;
      logChipSpeechDebug("speak-label-path", {
        labelText,
        lookupText: speech.lookupText,
        generatedAudioFound: Boolean(audioPath),
        audioPath: audioPath || "",
        fallback: audioPath ? "" : "browser-speech"
      });

      if (!audioPath) {
        warnMissingLocalAudio(speech.lookupText);
        speakWithBrowserSpeech(speech.text, speech);
        return;
      }

      playLocalAudio(audioPath).then((didPlay) => {
        if (!didPlay) {
          speakWithBrowserSpeech(speech.text, speech);
        }
      });
    };

    if (audioManifestLookup) {
      playFromLookup(audioManifestLookup);
    } else {
      getAudioManifest().then(playFromLookup);
    }

    return true;
  }

  function speakLabelWithCompletion(labelText, onComplete) {
    const text = getSpokenPlaceName(labelText);

    if (!text || !isAudioOutputSupported()) {
      return false;
    }

    if (isAudioMuted) {
      return false;
    }

    speakLabelAndWait(text).then(() => {
      onComplete?.();
    });

    return true;
  }

  async function speakLabelAndWait(labelText, options = {}) {
    const dedupeKey = normalizeSpeechDedupeKey(options.dedupeKey);
    const existingSpeech = dedupeKey ? activeSpeechRequestsByKey.get(dedupeKey) : null;

    if (existingSpeech) {
      logChipSpeechDebug("speech-deduped", { labelText, dedupeKey });
      return existingSpeech;
    }

    const playback = options.queue
      ? speechQueue
        .catch(() => false)
        .then(() => playLabelAndWait(labelText, options))
        .catch((error) => {
          warnQueuedSpeechFailure(labelText, error, options);
          return false;
        })
      : playLabelAndWait(labelText, options).catch((error) => {
        warnQueuedSpeechFailure(labelText, error, options);
        return false;
      });

    if (options.queue) {
      speechQueue = playback;
    }

    if (dedupeKey) {
      activeSpeechRequestsByKey.set(dedupeKey, playback);
      void playback.finally(() => {
        if (activeSpeechRequestsByKey.get(dedupeKey) === playback) {
          activeSpeechRequestsByKey.delete(dedupeKey);
        }
      });
    }

    return playback;
  }

  async function playLabelAndWait(labelText, options = {}) {
    const speech = resolveSpeechText(labelText);
    const text = speech.text;

    if (!text || !isAudioOutputSupported()) {
      return false;
    }

    if (isAudioMuted) {
      return false;
    }

    const lookup = await getAudioManifest();
    const audioPath = lookup && !speech.preferBrowserSpeech ? findLocalAudioPath(speech.lookupText) : null;
    logChipSpeechDebug("speak-label-and-wait-path", {
      labelText,
      lookupText: speech.lookupText,
      generatedAudioFound: Boolean(audioPath),
      audioPath: audioPath || "",
      queue: Boolean(options.queue),
      muted: isAudioMuted,
      fallback: audioPath ? "" : "browser-speech"
    });

    if (!audioPath) {
      warnMissingLocalAudio(speech.lookupText);
      const didUseBrowserSpeech = await waitForBrowserSpeech(speech.text, speech);
      logChipSpeechDebug("browser-speech-result", {
        labelText,
        didUseBrowserSpeech
      });
      if (!didUseBrowserSpeech) {
        await wait(getSpeechFallbackDurationMs(text));
      }
      return false;
    }

    const didPlay = await playLocalAudio(audioPath, {
      ...options,
      timeoutMs: options.timeoutMs || getSpeechFallbackDurationMs(text) + 2200
    });
    logChipSpeechDebug("local-audio-result", {
      labelText,
      audioPath,
      didPlay
    });

    if (didPlay) {
      return true;
    }

    const didUseBrowserSpeech = await waitForBrowserSpeech(speech.text, speech);
    logChipSpeechDebug("browser-speech-fallback-result", {
      labelText,
      audioPath,
      didUseBrowserSpeech
    });
    if (!didUseBrowserSpeech) {
      await wait(getSpeechFallbackDurationMs(text));
    }

    return false;
  }

  function wait(durationMs) {
    return new Promise((resolve) => {
      global.setTimeout(resolve, durationMs);
    });
  }

  function warnQueuedSpeechFailure(labelText, error, options = {}) {
    if (!options.warnOnAudioFailure) {
      return;
    }

    console.warn("[memory-trail-audio] Prompt audio failed; later prompts will continue.", {
      labelText,
      error
    });
  }

  function warnMissingLocalAudio(labelText) {
    if (!isChipSpeechDebugEnabled()) {
      return;
    }

    console.warn("[memory-trail-audio] Missing generated audio; using browser speech fallback.", {
      labelText
    });
  }

  function speakWithBrowserSpeechWithCompletion(labelText, onComplete, speechOptions = {}) {
    if (!isSpeechSupported()) {
      return false;
    }

    if (isAudioMuted) {
      return false;
    }

    const resolved = resolveSpeechText(labelText);
    const utterance = createUtterance(resolved.text, {
      ...resolved,
      ...speechOptions
    });

    if (!utterance) {
      return false;
    }

    let isFinished = false;
    const finish = () => {
      if (isFinished) {
        return;
      }

      isFinished = true;
      if (currentSpeechFinish === finish) {
        currentSpeechFinish = null;
      }
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
    currentSpeechFinish = finish;
    global.speechSynthesis.speak(utterance);
    return true;
  }

  function waitForBrowserSpeech(labelText, speechOptions = {}) {
    return new Promise((resolve) => {
      const didSpeak = speakWithBrowserSpeechWithCompletion(labelText, () => {
        resolve(true);
      }, speechOptions);

      if (!didSpeak) {
        resolve(false);
      }
    });
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

  function logChipSpeechDebug(eventType, details = {}) {
    if (!isChipSpeechDebugEnabled()) {
      return;
    }

    console.debug("[chip-speech]", eventType, details);
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

  function createChipSpeakerControl(labelText, options = {}) {
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
      options.onActivate?.(event);
      debugChipSpeech(labelText, event.type);
      primeLocalAudio();
      getAudioManifest();
      speakLabel(labelText);
    };

    const speakFromFallbackClick = (event) => {
      stopChipInteraction(event);

      if (Date.now() - lastSpeechGestureAt < 500) {
        return;
      }

      lastSpeechGestureAt = Date.now();
      options.onActivate?.(event);
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
    getAudioMuted,
    getSpokenPlaceName,
    isSpeechSupported,
    isLocalAudioSupported,
    primeLocalAudio,
    setAudioMuted,
    stopAudio,
    speakLabel,
    speakLabelWithCompletion,
    speakLabelAndWait,
    toggleAudioMuted,
    createChipSpeakerControl
  };

  getAudioManifest();
})(window);
