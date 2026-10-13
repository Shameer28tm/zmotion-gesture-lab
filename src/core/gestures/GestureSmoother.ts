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
  private isPointingLatched: boolean = false;

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
    this.isPointingLatched = false;
  }

  public resetTracking(): void {
    this.reset();
  }

  public getPinchState(): boolean {
    return this.currentStableGesture === 'PINCH';
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
    pointingTriggered: boolean;
  } {
    // If hand was lost completely, clear discrete latches and reset
    if (rawGesture === 'NONE' && rawMetrics.confidence === 0) {
      this.currentStableGesture = 'NONE';
      this.gestureCandidates.clear();
      this.isFistLatched = false;
      this.isPointingLatched = false;
      this.smoothedMetrics = { ...rawMetrics };
      return {
        stableGesture: 'NONE',
        smoothedMetrics: this.smoothedMetrics,
        fistTriggered: false,
        pointingTriggered: false,
      };
    }

    // 1. Adaptive Velocity-Aware Smoothing:
    // When the hand moves quickly, reduce smoothing alpha so controls respond immediately without lag.
    // When the hand is stationary, maintain higher alpha to eliminate micro-jitter.
    let posAlpha = Math.max(0, Math.min(0.99, this.config.smoothingAlpha));
    let pinchAlpha = posAlpha;

    if (this.config.adaptiveSmoothing && this.smoothedMetrics && this.smoothedMetrics.confidence > 0) {
      const dx = rawMetrics.handCenter.x - this.smoothedMetrics.handCenter.x;
      const dy = rawMetrics.handCenter.y - this.smoothedMetrics.handCenter.y;
      const moveDistance = Math.sqrt(dx * dx + dy * dy);

      // Fast movement factor between 0 (stationary) and 1 (fast sweep)
      const speedFactor = Math.min(1.0, Math.max(0.0, (moveDistance - 0.02) / 0.18));
      const minFastAlpha = 0.12;
      posAlpha = this.config.smoothingAlpha * (1.0 - speedFactor) + minFastAlpha * speedFactor;

      // Pinch velocity responsiveness
      const dPinch = Math.abs(rawMetrics.pinchStrength - this.smoothedMetrics.pinchStrength);
      const pinchSpeedFactor = Math.min(1.0, Math.max(0.0, dPinch / 0.25));
      pinchAlpha = this.config.smoothingAlpha * (1.0 - pinchSpeedFactor) + 0.15 * pinchSpeedFactor;
    }

    // 2. Smooth continuous metrics with zero-jump reacquisition
    if (!this.smoothedMetrics || this.smoothedMetrics.confidence === 0) {
      this.smoothedMetrics = { ...rawMetrics };
    } else {
      this.smoothedMetrics = {
        rawPinchDistance:
          this.smoothedMetrics.rawPinchDistance * pinchAlpha +
          rawMetrics.rawPinchDistance * (1 - pinchAlpha),
        pinchStrength:
          this.smoothedMetrics.pinchStrength * pinchAlpha +
          rawMetrics.pinchStrength * (1 - pinchAlpha),
        handCenter: {
          x:
            this.smoothedMetrics.handCenter.x * posAlpha +
            rawMetrics.handCenter.x * (1 - posAlpha),
          y:
            this.smoothedMetrics.handCenter.y * posAlpha +
            rawMetrics.handCenter.y * (1 - posAlpha),
          z:
            this.smoothedMetrics.handCenter.z * posAlpha +
            rawMetrics.handCenter.z * (1 - posAlpha),
        },
        palmSize:
          this.smoothedMetrics.palmSize * 0.8 +
          rawMetrics.palmSize * 0.2, // Stable palm scale
        fingerCurls: [
          this.smoothedMetrics.fingerCurls[0] * posAlpha + rawMetrics.fingerCurls[0] * (1 - posAlpha),
          this.smoothedMetrics.fingerCurls[1] * posAlpha + rawMetrics.fingerCurls[1] * (1 - posAlpha),
          this.smoothedMetrics.fingerCurls[2] * posAlpha + rawMetrics.fingerCurls[2] * (1 - posAlpha),
          this.smoothedMetrics.fingerCurls[3] * posAlpha + rawMetrics.fingerCurls[3] * (1 - posAlpha),
          this.smoothedMetrics.fingerCurls[4] * posAlpha + rawMetrics.fingerCurls[4] * (1 - posAlpha),
        ],
        confidence: rawMetrics.confidence,
      };
    }

    // 2. Hysteresis on pinch gesture
    let effectiveGesture = rawGesture;
    if (this.currentStableGesture === 'PINCH') {
      // Stay in PINCH until strength drops below release threshold
      if (this.smoothedMetrics.pinchStrength > 0.40) {
        effectiveGesture = 'PINCH';
      }
    } else if (rawGesture === 'PINCH') {
      // Enter PINCH only if smoothed strength exceeds engagement threshold
      if (this.smoothedMetrics.pinchStrength < 0.65) {
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

    // 4. Fist Trigger Debouncing and Cooldown (Fires once upon entry, requires release)
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

    // 5. Pointing Trigger Debouncing and Cooldown (Fires once upon entry, requires release)
    let pointingTriggered = false;
    if (this.currentStableGesture === 'POINTING') {
      const lastTrigger = this.lastDiscreteTriggerTimes.get('POINTING') ?? 0;
      const elapsed = timestamp - lastTrigger;

      if (!this.isPointingLatched && elapsed >= this.config.pointingCooldownMs) {
        pointingTriggered = true;
        this.isPointingLatched = true;
        this.lastDiscreteTriggerTimes.set('POINTING', timestamp);
      }
    } else {
      // Release latch when hand is no longer pointing
      this.isPointingLatched = false;
    }

    return {
      stableGesture: this.currentStableGesture,
      smoothedMetrics: this.smoothedMetrics,
      fistTriggered,
      pointingTriggered,
    };
  }
}
