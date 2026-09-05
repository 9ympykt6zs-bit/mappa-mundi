export const GUIDED_PHYSICAL_PULSE_PERIOD_MS = 1800;
export const GUIDED_PHYSICAL_PULSE_INTERVAL_MS = 90;

// The visible feature never fades: only its supplemental halo breathes gently.
export function guidedPhysicalPulseProgress(elapsedMs) {
  return (1 - Math.cos((elapsedMs / GUIDED_PHYSICAL_PULSE_PERIOD_MS) * Math.PI * 2)) / 2;
}

export class GuidedPhysicalTeachingPulse {
  constructor(onFrame, environment = globalThis) {
    this.onFrame = onFrame;
    this.environment = environment;
    this.timer = null;
    this.media = null;
    this.handleMotionChange = () => this.configureMotion();
    this.state = { animated: false, reducedMotion: false, progress: 0.5 };
  }

  start() {
    this.stop();
    this.media = this.environment.matchMedia?.("(prefers-reduced-motion: reduce)") || null;
    this.media?.addEventListener?.("change", this.handleMotionChange);
    this.configureMotion();
  }

  configureMotion() {
    if (this.timer !== null) this.environment.clearInterval(this.timer);
    this.timer = null;
    const reducedMotion = Boolean(this.media?.matches);
    this.state = { animated: !reducedMotion, reducedMotion, progress: reducedMotion ? 0.5 : 0 };
    this.onFrame(this.state);
    if (reducedMotion) return;

    const startedAt = this.environment.performance?.now?.() ?? Date.now();
    this.timer = this.environment.setInterval(() => {
      // Hidden tabs need no map paint work. There are no source/geometry updates.
      if (this.environment.document?.hidden) return;
      const now = this.environment.performance?.now?.() ?? Date.now();
      this.state = { ...this.state, progress: guidedPhysicalPulseProgress(now - startedAt) };
      this.onFrame(this.state);
    }, GUIDED_PHYSICAL_PULSE_INTERVAL_MS);
  }

  stop() {
    if (this.timer !== null) this.environment.clearInterval(this.timer);
    this.timer = null;
    this.media?.removeEventListener?.("change", this.handleMotionChange);
    this.media = null;
    this.state = { ...this.state, animated: false };
  }
}
