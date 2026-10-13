import type { LandmarkPoint } from '../../core/types';

export interface RotationTarget {
  rotX: number;
  rotY: number;
}

export interface StudioGestureMathConfig {
  minScale: number;
  maxScale: number;
  defaultScale: number;
  maxRotX: number;
  maxRotY: number;
  pointingCooldownMs: number;
}

export const DEFAULT_STUDIO_CONFIG: StudioGestureMathConfig = {
  minScale: 0.4,
  maxScale: 2.4,
  defaultScale: 1.0,
  maxRotX: Math.PI * 0.85,
  maxRotY: Math.PI * 1.25,
  pointingCooldownMs: 700,
};

export class GestureStudioMath {
  /**
   * Computes target rotation (pitch rotX, yaw rotY) from centered mirrored hand position.
   * Clamps output to avoid extreme or inverted orientations.
   */
  public static calculateRotation(
    handCenter: LandmarkPoint | null | undefined,
    config: StudioGestureMathConfig = DEFAULT_STUDIO_CONFIG
  ): RotationTarget {
    if (!handCenter || isNaN(handCenter.x) || isNaN(handCenter.y)) {
      return { rotX: 0, rotY: 0 };
    }

    // handCenter is in range [-1, 1]
    // Horizontal hand position maps to Y-axis rotation (yaw)
    const rawRotY = handCenter.x * config.maxRotY;
    // Vertical hand position maps to X-axis rotation (pitch)
    const rawRotX = -handCenter.y * config.maxRotX;

    const rotX = Math.max(-config.maxRotX, Math.min(config.maxRotX, rawRotX));
    const rotY = Math.max(-config.maxRotY, Math.min(config.maxRotY, rawRotY));

    return {
      rotX: rotX === 0 ? 0 : rotX,
      rotY: rotY === 0 ? 0 : rotY,
    };
  }

  /**
   * Maps continuous pinch strength (0.0 to 1.0) to smooth object scale.
   * When fingers close together (strength -> 1.0), object compresses down toward minScale.
   * When fingers spread open (strength -> 0.0), object expands toward maxScale.
   * Clamped strictly between minScale and maxScale.
   */
  public static calculateScale(
    pinchStrength: number,
    baseScale: number = 1.0,
    config: StudioGestureMathConfig = DEFAULT_STUDIO_CONFIG
  ): number {
    if (isNaN(pinchStrength)) return baseScale;

    const clampedStrength = Math.max(0, Math.min(1, pinchStrength));

    // Dynamic scale range influenced by pinch closure:
    // pinchStrength = 1.0 -> minScale (compressed)
    // pinchStrength = 0.0 -> maxScale (fully expanded)
    // Midpoint (0.5) -> default base scale
    const target = config.minScale + (1.0 - clampedStrength) * (config.maxScale - config.minScale);
    return Math.max(config.minScale, Math.min(config.maxScale, target));
  }

  /**
   * Checks whether a pointing gesture should trigger a color change based on cooldown.
   */
  public static shouldTriggerColorChange(
    lastTriggerTimestamp: number,
    currentTimestamp: number,
    cooldownMs: number = DEFAULT_STUDIO_CONFIG.pointingCooldownMs
  ): boolean {
    if (isNaN(lastTriggerTimestamp) || isNaN(currentTimestamp)) return false;
    return currentTimestamp - lastTriggerTimestamp >= cooldownMs;
  }
}
