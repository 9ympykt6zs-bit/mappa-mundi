const ENABLE_SOUND_EFFECTS = true;
const masterVolume = 0.045;

let audioContext = null;

function isMuted() {
  return window.GeographyChipSpeech?.getAudioMuted?.() === true;
}

function getAudioContext() {
  if (!ENABLE_SOUND_EFFECTS || isMuted()) {
    return null;
  }

  const AudioContextClass = window.AudioContext || window.webkitAudioContext;

  if (!AudioContextClass) {
    return null;
  }

  if (!audioContext) {
    audioContext = new AudioContextClass();
  }

  if (audioContext.state === "suspended") {
    audioContext.resume().catch(() => {
      // Some browsers require a fresh user gesture; sound effects are optional.
    });
  }

  return audioContext;
}

function playTone({ frequency, duration, delay = 0, type = "sine", volume = 1 }) {
  const context = getAudioContext();

  if (!context) {
    return;
  }

  const startTime = context.currentTime + delay;
  const endTime = startTime + duration;
  const oscillator = context.createOscillator();
  const gain = context.createGain();

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, startTime);
  gain.gain.setValueAtTime(0.0001, startTime);
  gain.gain.exponentialRampToValueAtTime(masterVolume * volume, startTime + 0.025);
  gain.gain.exponentialRampToValueAtTime(0.0001, endTime);

  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start(startTime);
  oscillator.stop(endTime + 0.03);
}

export function playCorrectSound() {
  playTone({
    frequency: 660,
    duration: 0.18,
    type: "sine",
    volume: 0.8
  });
}

export function playIncorrectSound() {
  playTone({
    frequency: 220,
    duration: 0.16,
    type: "triangle",
    volume: 0.55
  });
}

export function playCompletionSound() {
  playTone({
    frequency: 523.25,
    duration: 0.16,
    type: "sine",
    volume: 0.65
  });
  playTone({
    frequency: 659.25,
    duration: 0.18,
    delay: 0.13,
    type: "sine",
    volume: 0.7
  });
  playTone({
    frequency: 783.99,
    duration: 0.22,
    delay: 0.27,
    type: "sine",
    volume: 0.72
  });
}
