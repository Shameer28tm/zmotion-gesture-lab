import {
  type GestureEngineConfig,
  type GestureMetrics,
  type GestureType,
} from '../types';

export class GestureSmoother {
  private config: GestureEngineConfig;
  private smoothedMetrics: GestureMetrics | null = null;
  private currentStableGesture: GestureType = 'NONE';
  private gestureCandidates: Map<GestureType, number> = new Map();
  private lastDiscreteTriggerTimes: Map<string, number> = new Map();
  private isFistLatched: boolean = false;

  constructor(config: GestureEngineConfig) {
    this.config = config;
  }

  public updateConfig(config: Partial<GestureEngineConfig>): void {
    this.config = { ...this.config, ...config };
  }

  public reset(): void {
    this.smoothedMetrics = null;
    this.currentStableGesture = 'NONE';
    this.gestureCandidates.clear();
    this.lastDiscreteTriggerTimes.clear();
    this.isFistLatched = false;
  }

  /**
   * Applies exponential low-pass filter to continuous metrics
   * and hysteresis/cooldown to discrete gesture states.
   */
  public process(
    rawGesture: GestureType,
    rawMetrics: GestureMetrics,
    timestamp: number = Date.now()
  ): {
    stableGesture: GestureType;
    smoothedMetrics: GestureMetrics;
    fistTriggered: boolean;
  } {
    const alpha = Math.max(0, Math.min(0.99, this.config.smoothingAlpha));

    // 1. Smooth continuous metrics
    if (!this.smoothedMetrics) {
      this.smoothedMetrics = { ...rawMetrics };
    } else {
      this.smoothedMetrics = {
        rawPinchDistance:
          this.smoothedMetrics.rawPinchDistance * alpha +
          rawMetrics.rawPinchDistance * (1 - alpha),
        pinchStrength:
          this.smoothedMetrics.pinchStrength * alpha +
          rawMetrics.pinchStrength * (1 - alpha),
        handCenter: {
          x:
            this.smoothedMetrics.handCenter.x * alpha +
            rawMetrics.handCenter.x * (1 - alpha),
          y:
            this.smoothedMetrics.handCenter.y * alpha +
            rawMetrics.handCenter.y * (1 - alpha),
          z:
            this.smoothedMetrics.handCenter.z * alpha +
            rawMetrics.handCenter.z * (1 - alpha),
        },
        palmSize:
          this.smoothedMetrics.palmSize * alpha +
          rawMetrics.palmSize * (1 - alpha),
        fingerCurls: [
          this.smoothedMetrics.fingerCurls[0] * alpha + rawMetrics.fingerCurls[0] * (1 - alpha),
          this.smoothedMetrics.fingerCurls[1] * alpha + rawMetrics.fingerCurls[1] * (1 - alpha),
          this.smoothedMetrics.fingerCurls[2] * alpha + rawMetrics.fingerCurls[2] * (1 - alpha),
          this.smoothedMetrics.fingerCurls[3] * alpha + rawMetrics.fingerCurls[3] * (1 - alpha),
          this.smoothedMetrics.fingerCurls[4] * alpha + rawMetrics.fingerCurls[4] * (1 - alpha),
        ],
        confidence: rawMetrics.confidence,
      };
    }

    // 2. Hysteresis on pinch gesture
    let effectiveGesture = rawGesture;
    if (this.currentStableGesture === 'PINCH') {
      // Stay in PINCH until strength drops below release threshold
      if (this.smoothedMetrics.pinchStrength > 0.45) {
        effectiveGesture = 'PINCH';
      }
    } else if (rawGesture === 'PINCH') {
      // Enter PINCH only if smoothed strength exceeds engagement threshold
      if (this.smoothedMetrics.pinchStrength < 0.6) {
        effectiveGesture = this.currentStableGesture;
      }
    }

    // 3. State transition stability filter (require 2 consecutive frames for non-pinch changes)
    if (effectiveGesture !== this.currentStableGesture) {
      const candidateCount = (this.gestureCandidates.get(effectiveGesture) ?? 0) + 1;
      this.gestureCandidates.set(effectiveGesture, candidateCount);

      if (candidateCount >= 2 || effectiveGesture === 'NONE') {
        this.currentStableGesture = effectiveGesture;
        this.gestureCandidates.clear();
      }
    } else {
      this.gestureCandidates.clear();
    }

    // 4. Fist Trigger Debouncing and Cooldown
    let fistTriggered = false;
    if (this.currentStableGesture === 'CLOSED_FIST') {
      const lastTrigger = this.lastDiscreteTriggerTimes.get('CLOSED_FIST') ?? 0;
      const elapsed = timestamp - lastTrigger;

      if (!this.isFistLatched && elapsed >= this.config.fistCooldownMs) {
        fistTriggered = true;
        this.isFistLatched = true;
        this.lastDiscreteTriggerTimes.set('CLOSED_FIST', timestamp);
      }
    } else {
      // Release latch when hand opens up from fist
      this.isFistLatched = false;
    }

    return {
      stableGesture: this.currentStableGesture,
      smoothedMetrics: this.smoothedMetrics,
      fistTriggered,
    };
  }
}
