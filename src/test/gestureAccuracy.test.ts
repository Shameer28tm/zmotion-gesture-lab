import { describe, it, expect } from 'vitest';
import { LandmarkNormalizer } from '../core/vision/LandmarkNormalizer';
import { GestureClassifier } from '../core/gestures/GestureClassifier';
import { GestureSmoother } from '../core/gestures/GestureSmoother';
import { DEFAULT_ENGINE_CONFIG, HAND_LANDMARK, type HandLandmarks } from '../core/types';

/**
 * Helper to build synthetic hand landmarks
 */
function createSyntheticHand(
  type: 'OPEN_PALM' | 'CLOSED_FIST' | 'PINCH' | 'POINTING',
  wristOffset = { x: 0.5, y: 0.8 }
): HandLandmarks {
  const points: HandLandmarks = [];
  points[HAND_LANDMARK.WRIST] = { x: wristOffset.x, y: wristOffset.y, z: 0 };

  // Thumb
  points[HAND_LANDMARK.THUMB_CMC] = { x: wristOffset.x - 0.05, y: wristOffset.y - 0.05, z: 0 };
  points[HAND_LANDMARK.THUMB_MCP] = { x: wristOffset.x - 0.08, y: wristOffset.y - 0.10, z: 0 };
  points[HAND_LANDMARK.THUMB_IP] = { x: wristOffset.x - 0.10, y: wristOffset.y - 0.15, z: 0 };
  points[HAND_LANDMARK.THUMB_TIP] =
    type === 'PINCH'
      ? { x: wristOffset.x - 0.02, y: wristOffset.y - 0.35, z: 0 }
      : type === 'CLOSED_FIST'
      ? { x: wristOffset.x - 0.02, y: wristOffset.y - 0.12, z: 0 }
      : { x: wristOffset.x - 0.15, y: wristOffset.y - 0.20, z: 0 };

  // Index
  points[HAND_LANDMARK.INDEX_FINGER_MCP] = { x: wristOffset.x - 0.04, y: wristOffset.y - 0.20, z: 0 };
  points[HAND_LANDMARK.INDEX_FINGER_PIP] = { x: wristOffset.x - 0.04, y: wristOffset.y - 0.28, z: 0 };
  points[HAND_LANDMARK.INDEX_FINGER_DIP] = { x: wristOffset.x - 0.04, y: wristOffset.y - 0.34, z: 0 };
  points[HAND_LANDMARK.INDEX_FINGER_TIP] =
    type === 'PINCH'
      ? { x: wristOffset.x - 0.02, y: wristOffset.y - 0.35, z: 0 }
      : type === 'CLOSED_FIST'
      ? { x: wristOffset.x - 0.03, y: wristOffset.y - 0.15, z: 0 }
      : { x: wristOffset.x - 0.04, y: wristOffset.y - 0.40, z: 0 };

  // Middle
  points[HAND_LANDMARK.MIDDLE_FINGER_MCP] = { x: wristOffset.x, y: wristOffset.y - 0.22, z: 0 };
  points[HAND_LANDMARK.MIDDLE_FINGER_PIP] = { x: wristOffset.x, y: wristOffset.y - 0.30, z: 0 };
  points[HAND_LANDMARK.MIDDLE_FINGER_DIP] = { x: wristOffset.x, y: wristOffset.y - 0.36, z: 0 };
  points[HAND_LANDMARK.MIDDLE_FINGER_TIP] =
    type === 'OPEN_PALM'
      ? { x: wristOffset.x, y: wristOffset.y - 0.42, z: 0 }
      : { x: wristOffset.x, y: wristOffset.y - 0.14, z: 0 };

  // Ring
  points[HAND_LANDMARK.RING_FINGER_MCP] = { x: wristOffset.x + 0.04, y: wristOffset.y - 0.20, z: 0 };
  points[HAND_LANDMARK.RING_FINGER_PIP] = { x: wristOffset.x + 0.04, y: wristOffset.y - 0.27, z: 0 };
  points[HAND_LANDMARK.RING_FINGER_DIP] = { x: wristOffset.x + 0.04, y: wristOffset.y - 0.33, z: 0 };
  points[HAND_LANDMARK.RING_FINGER_TIP] =
    type === 'OPEN_PALM'
      ? { x: wristOffset.x + 0.04, y: wristOffset.y - 0.39, z: 0 }
      : { x: wristOffset.x + 0.04, y: wristOffset.y - 0.13, z: 0 };

  // Pinky
  points[HAND_LANDMARK.PINKY_MCP] = { x: wristOffset.x + 0.08, y: wristOffset.y - 0.17, z: 0 };
  points[HAND_LANDMARK.PINKY_PIP] = { x: wristOffset.x + 0.08, y: wristOffset.y - 0.23, z: 0 };
  points[HAND_LANDMARK.PINKY_DIP] = { x: wristOffset.x + 0.08, y: wristOffset.y - 0.28, z: 0 };
  points[HAND_LANDMARK.PINKY_TIP] =
    type === 'OPEN_PALM'
      ? { x: wristOffset.x + 0.08, y: wristOffset.y - 0.34, z: 0 }
      : { x: wristOffset.x + 0.08, y: wristOffset.y - 0.11, z: 0 };

  return points;
}

describe('Gesture Tracking Accuracy & Palm Centroid', () => {
  it('calculates palm center from Wrist, Index MCP, and Pinky MCP triangle', () => {
    const hand = createSyntheticHand('OPEN_PALM', { x: 0.5, y: 0.8 });
    const palmCenter = LandmarkNormalizer.getPalmCenter(hand);

    // Expected centroid: (wrist + indexMcp + pinkyMcp) / 3
    const wrist = hand[HAND_LANDMARK.WRIST];
    const indexMcp = hand[HAND_LANDMARK.INDEX_FINGER_MCP];
    const pinkyMcp = hand[HAND_LANDMARK.PINKY_MCP];

    const expectedX = (wrist.x + indexMcp.x + pinkyMcp.x) / 3;
    const expectedY = (wrist.y + indexMcp.y + pinkyMcp.y) / 3;

    expect(palmCenter.x).toBeCloseTo(expectedX, 4);
    expect(palmCenter.y).toBeCloseTo(expectedY, 4);
  });

  it('keeps palm center stable regardless of finger curl articulation', () => {
    // When a hand curls fingers into a fist or pointing without moving the wrist/MCP base,
    // the palm centroid must remain stable
    const openHand = createSyntheticHand('OPEN_PALM', { x: 0.5, y: 0.8 });
    const fistHand = createSyntheticHand('CLOSED_FIST', { x: 0.5, y: 0.8 });

    const openCenter = LandmarkNormalizer.getPalmCenter(openHand);
    const fistCenter = LandmarkNormalizer.getPalmCenter(fistHand);

    // Palm centers should match exactly since Wrist and MCPs have not shifted
    expect(openCenter.x).toBeCloseTo(fistCenter.x, 4);
    expect(openCenter.y).toBeCloseTo(fistCenter.y, 4);
  });
});

describe('Dead Zone and Sensitivity Scaling', () => {
  it('suppresses micro-jitter inside dead zone around screen center', () => {
    // Raw normalized center is 0.5, 0.5. Slight offset of 0.005 translates to -0.01 centered (inside 0.04 dead zone)
    const centeredPoint = LandmarkNormalizer.toMirroredCentered({ x: 0.505, y: 0.505, z: 0 });
    const scaled = LandmarkNormalizer.applyDeadZoneAndSensitivity(
      centeredPoint,
      DEFAULT_ENGINE_CONFIG.deadZone,
      DEFAULT_ENGINE_CONFIG.sensitivity
    );

    // Should snap to 0 inside dead zone
    expect(scaled.x).toBe(0);
    expect(scaled.y).toBe(0);
  });

  it('smoothly scales coordinates outside dead zone with sensitivity factor', () => {
    const centeredPoint = LandmarkNormalizer.toMirroredCentered({ x: 0.2, y: 0.8, z: 0 }); // significant displacement (0.6, -0.6)
    const sensitivity = 1.5;
    const scaled = LandmarkNormalizer.applyDeadZoneAndSensitivity(
      centeredPoint,
      DEFAULT_ENGINE_CONFIG.deadZone,
      sensitivity
    );

    expect(Math.abs(scaled.x)).toBeGreaterThan(0.2);
    expect(Math.abs(scaled.y)).toBeGreaterThan(0.2);
  });
});

describe('Pinch Detection Hysteresis', () => {
  it('applies hysteresis to prevent rapid flickering around threshold', () => {
    const smoother = new GestureSmoother({
      ...DEFAULT_ENGINE_CONFIG,
      smoothingAlpha: 0.2,
    });

    const pinchHand = createSyntheticHand('PINCH');
    const { metrics: pinchMetrics } = GestureClassifier.classify(pinchHand, DEFAULT_ENGINE_CONFIG);

    // Initial state: not pinched
    expect(smoother.getPinchState()).toBe(false);

    // Frame 1 & 2: Strong pinch -> stable transition into PINCH
    smoother.process('PINCH', { ...pinchMetrics, pinchStrength: 0.90 }, 1000);
    smoother.process('PINCH', { ...pinchMetrics, pinchStrength: 0.90 }, 1016);
    expect(smoother.getPinchState()).toBe(true);

    // Boundary noise: pinchStrength drops to 0.50 (below enter threshold 0.65, but above release threshold 0.40)
    // Due to hysteresis, pinch should REMAIN active!
    smoother.process('PINCH', { ...pinchMetrics, pinchStrength: 0.50 }, 1032);
    expect(smoother.getPinchState()).toBe(true);

    // Released pinch: pinchStrength drops below 0.40.
    // Exponential smoothing (alpha = 0.5) and 2-frame stability filter transition smoothly to OPEN_PALM.
    smoother.process('OPEN_PALM', { ...pinchMetrics, pinchStrength: 0.10 }, 1048);
    smoother.process('OPEN_PALM', { ...pinchMetrics, pinchStrength: 0.10 }, 1064);
    smoother.process('OPEN_PALM', { ...pinchMetrics, pinchStrength: 0.10 }, 1080);
    expect(smoother.getPinchState()).toBe(false);
  });
});

describe('Pointing Discrete Trigger & Latching', () => {
  it('fires pointing trigger only once while pointing is held continuously', () => {
    const smoother = new GestureSmoother({
      ...DEFAULT_ENGINE_CONFIG,
      pointingCooldownMs: 700,
    });

    const pointingHand = createSyntheticHand('POINTING');
    const { metrics } = GestureClassifier.classify(pointingHand, DEFAULT_ENGINE_CONFIG);

    // Frame 1: pointing initial frame
    smoother.process('POINTING', metrics, 1000);
    // Frame 2: stable transition -> fires trigger
    const f2 = smoother.process('POINTING', metrics, 1016);
    expect(f2.pointingTriggered).toBe(true);

    // Frame 3 (50ms later, pointing still held): MUST NOT re-trigger
    const f3 = smoother.process('POINTING', metrics, 1066);
    expect(f3.pointingTriggered).toBe(false);

    // Frame 4 (800ms later, past cooldown, BUT pointing was held continuously without release):
    // MUST NOT re-trigger!
    const f4 = smoother.process('POINTING', metrics, 1820);
    expect(f4.pointingTriggered).toBe(false);

    // Release pointing (open hand)
    const openHand = createSyntheticHand('OPEN_PALM');
    const { metrics: openMetrics } = GestureClassifier.classify(openHand, DEFAULT_ENGINE_CONFIG);
    smoother.process('OPEN_PALM', openMetrics, 1900);
    smoother.process('OPEN_PALM', openMetrics, 1916);

    // Now point again after cooldown: fires trigger anew!
    smoother.process('POINTING', metrics, 2600);
    const fNew = smoother.process('POINTING', metrics, 2616);
    expect(fNew.pointingTriggered).toBe(true);
  });
});

describe('Hand Loss and Zero-Jump Reacquisition', () => {
  it('resets internal tracking state smoothly when hand is lost and reacquired', () => {
    const smoother = new GestureSmoother(DEFAULT_ENGINE_CONFIG);
    const hand1 = createSyntheticHand('OPEN_PALM', { x: 0.2, y: 0.3 });
    const { metrics: m1 } = GestureClassifier.classify(hand1, DEFAULT_ENGINE_CONFIG);

    // Frame with hand present
    const res1 = smoother.process('OPEN_PALM', m1, 1000);
    expect(res1.smoothedMetrics.confidence).toBeGreaterThan(0.5);

    // Hand leaves frame
    smoother.resetTracking();

    // Hand reacquires on the opposite side of the screen
    const hand2 = createSyntheticHand('OPEN_PALM', { x: 0.8, y: 0.7 });
    const { metrics: m2 } = GestureClassifier.classify(hand2, DEFAULT_ENGINE_CONFIG);

    const res2 = smoother.process('OPEN_PALM', m2, 2000);

    // On reacquisition, first frame seeds the smoother without dragging history from hand1
    expect(res2.smoothedMetrics.handCenter.x).toBeCloseTo(m2.handCenter.x, 1);
    expect(res2.smoothedMetrics.handCenter.y).toBeCloseTo(m2.handCenter.y, 1);
  });
});
