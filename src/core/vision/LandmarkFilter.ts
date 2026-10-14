import type { HandLandmarks, LandmarkPoint } from '../types';

export interface LandmarkFilterOptions {
  /** Smoothing factor when hand is stationary (0 to 1). Higher = smoother, less jitter. */
  stationaryAlpha?: number;
  /** Smoothing factor during rapid movement (0 to 1). Lower = more responsive, less lag. */
  fastAlpha?: number;
  /** Velocity in normalized units/sec below which maximum smoothing is applied. */
  minVelocity?: number;
  /** Velocity in normalized units/sec above which minimum smoothing is applied. */
  maxVelocity?: number;
}

/**
 * Adaptive, velocity-aware filter for 21 3D hand landmarks.
 * - Suppresses high-frequency camera sensor jitter during stationary poses.
 * - Dynamically drops smoothing alpha during rapid hand sweeps to eliminate trailing lag.
 * - Resets cleanly on tracking loss to prevent position jumps.
 * - Operates independently per hand to avoid cross-hand contamination.
 */
export class LandmarkFilter {
  private prevLandmarks: HandLandmarks | null = null;
  private lastTime: number = 0;

  private stationaryAlpha: number;
  private fastAlpha: number;
  private minVelocity: number;
  private maxVelocity: number;

  constructor(options: LandmarkFilterOptions = {}) {
    this.stationaryAlpha = options.stationaryAlpha ?? 0.68;
    this.fastAlpha = options.fastAlpha ?? 0.10;
    this.minVelocity = options.minVelocity ?? 0.10;
    this.maxVelocity = options.maxVelocity ?? 0.75;
  }

  /**
   * Resets filter history (e.g. after tracking loss).
   * Ensures the next frame initializes immediately with raw coordinates and zero drag.
   */
  public reset(): void {
    this.prevLandmarks = null;
    this.lastTime = 0;
  }

  /**
   * Applies velocity-adaptive smoothing to a set of 21 raw hand landmarks.
   */
  public filter(rawLandmarks: HandLandmarks, timestamp: number = performance.now()): HandLandmarks {
    if (!rawLandmarks || rawLandmarks.length !== 21) {
      return rawLandmarks;
    }

    // Zero-lag immediate initialization on first detection or after tracking loss
    if (!this.prevLandmarks || this.lastTime === 0) {
      this.prevLandmarks = rawLandmarks.map((pt) => ({ ...pt }));
      this.lastTime = timestamp;
      return this.prevLandmarks.map((pt) => ({ ...pt }));
    }

    const dt = Math.max(0.001, (timestamp - this.lastTime) / 1000);
    this.lastTime = timestamp;

    const filtered: LandmarkPoint[] = new Array(21);

    for (let i = 0; i < 21; i++) {
      const raw = rawLandmarks[i];
      const prev = this.prevLandmarks[i];

      const dx = raw.x - prev.x;
      const dy = raw.y - prev.y;
      const dz = raw.z - prev.z;
      const displacement = Math.sqrt(dx * dx + dy * dy + dz * dz);
      const velocity = displacement / dt;

      // Compute dynamic alpha based on velocity
      let alpha: number;
      if (velocity <= this.minVelocity) {
        alpha = this.stationaryAlpha;
      } else if (velocity >= this.maxVelocity) {
        alpha = this.fastAlpha;
      } else {
        const factor = (velocity - this.minVelocity) / (this.maxVelocity - this.minVelocity);
        alpha = this.stationaryAlpha * (1 - factor) + this.fastAlpha * factor;
      }

      // Exponential moving average filter
      filtered[i] = {
        x: prev.x * alpha + raw.x * (1 - alpha),
        y: prev.y * alpha + raw.y * (1 - alpha),
        z: prev.z * alpha + raw.z * (1 - alpha),
      };
    }

    this.prevLandmarks = filtered;
    return filtered;
  }

  /**
   * Returns current smoothed landmarks without advancing time or state.
   */
  public getLatest(): HandLandmarks | null {
    return this.prevLandmarks ? this.prevLandmarks.map((pt) => ({ ...pt })) : null;
  }
}
