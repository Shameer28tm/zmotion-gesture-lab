import { describe, it, expect } from 'vitest';
import { LandmarkNormalizer } from '../core/vision/LandmarkNormalizer';
import { GestureClassifier } from '../core/gestures/GestureClassifier';
import { GestureSmoother } from '../core/gestures/GestureSmoother';
import { DEFAULT_ENGINE_CONFIG, HAND_LANDMARK, type HandLandmarks } from '../core/types';

/**
 * Generates synthetic 21 hand landmarks for test scenarios
 */
function createSyntheticHand(type: 'OPEN_PALM' | 'CLOSED_FIST' | 'PINCH' | 'POINTING', scale = 1.0): HandLandmarks {
  const points: HandLandmarks = [];
  // Landmark 0: Wrist at base
  points[HAND_LANDMARK.WRIST] = { x: 0.5, y: 0.8, z: 0 };

  // Landmark 1-4: Thumb
  points[HAND_LANDMARK.THUMB_CMC] = { x: 0.45 * scale, y: 0.75 * scale, z: 0 };
  points[HAND_LANDMARK.THUMB_MCP] = { x: 0.42 * scale, y: 0.70 * scale, z: 0 };
  points[HAND_LANDMARK.THUMB_IP] = { x: 0.40 * scale, y: 0.65 * scale, z: 0 };

  if (type === 'PINCH') {
    // Thumb tip touching Index tip
    points[HAND_LANDMARK.THUMB_TIP] = { x: 0.48 * scale, y: 0.46 * scale, z: 0 };
  } else if (type === 'CLOSED_FIST') {
    // Thumb tucked into palm
    points[HAND_LANDMARK.THUMB_TIP] = { x: 0.48 * scale, y: 0.68 * scale, z: 0 };
  } else {
    // Thumb spread open
    points[HAND_LANDMARK.THUMB_TIP] = { x: 0.35 * scale, y: 0.60 * scale, z: 0 };
  }

  // Landmark 5-8: Index finger
  points[HAND_LANDMARK.INDEX_FINGER_MCP] = { x: 0.46 * scale, y: 0.60 * scale, z: 0 };
  points[HAND_LANDMARK.INDEX_FINGER_PIP] = { x: 0.46 * scale, y: 0.52 * scale, z: 0 };
  points[HAND_LANDMARK.INDEX_FINGER_DIP] = { x: 0.46 * scale, y: 0.46 * scale, z: 0 };

  if (type === 'PINCH') {
    // Index tip touching Thumb tip
    points[HAND_LANDMARK.INDEX_FINGER_TIP] = { x: 0.48 * scale, y: 0.45 * scale, z: 0 };
  } else if (type === 'CLOSED_FIST') {
    // Index curled: tip closer to wrist than PIP
    points[HAND_LANDMARK.INDEX_FINGER_TIP] = { x: 0.47 * scale, y: 0.65 * scale, z: 0 };
  } else {
    // Extended (Pointing or Open Palm)
    points[HAND_LANDMARK.INDEX_FINGER_TIP] = { x: 0.46 * scale, y: 0.40 * scale, z: 0 };
  }

  // Landmark 9-12: Middle finger
  points[HAND_LANDMARK.MIDDLE_FINGER_MCP] = { x: 0.50 * scale, y: 0.58 * scale, z: 0 };
  points[HAND_LANDMARK.MIDDLE_FINGER_PIP] = { x: 0.50 * scale, y: 0.50 * scale, z: 0 };
  points[HAND_LANDMARK.MIDDLE_FINGER_DIP] = { x: 0.50 * scale, y: 0.44 * scale, z: 0 };

  if (type === 'CLOSED_FIST' || type === 'POINTING' || type === 'PINCH') {
    // Curled middle finger
    points[HAND_LANDMARK.MIDDLE_FINGER_TIP] = { x: 0.50 * scale, y: 0.66 * scale, z: 0 };
  } else {
    // Extended
    points[HAND_LANDMARK.MIDDLE_FINGER_TIP] = { x: 0.50 * scale, y: 0.38 * scale, z: 0 };
  }

  // Landmark 13-16: Ring finger
  points[HAND_LANDMARK.RING_FINGER_MCP] = { x: 0.54 * scale, y: 0.60 * scale, z: 0 };
  points[HAND_LANDMARK.RING_FINGER_PIP] = { x: 0.54 * scale, y: 0.53 * scale, z: 0 };
  points[HAND_LANDMARK.RING_FINGER_DIP] = { x: 0.54 * scale, y: 0.47 * scale, z: 0 };

  if (type === 'CLOSED_FIST' || type === 'POINTING' || type === 'PINCH') {
    // Curled ring finger
    points[HAND_LANDMARK.RING_FINGER_TIP] = { x: 0.54 * scale, y: 0.67 * scale, z: 0 };
  } else {
    // Extended
    points[HAND_LANDMARK.RING_FINGER_TIP] = { x: 0.54 * scale, y: 0.41 * scale, z: 0 };
  }

  // Landmark 17-20: Pinky finger
  points[HAND_LANDMARK.PINKY_MCP] = { x: 0.58 * scale, y: 0.63 * scale, z: 0 };
  points[HAND_LANDMARK.PINKY_PIP] = { x: 0.58 * scale, y: 0.57 * scale, z: 0 };
  points[HAND_LANDMARK.PINKY_DIP] = { x: 0.58 * scale, y: 0.52 * scale, z: 0 };

  if (type === 'CLOSED_FIST' || type === 'POINTING' || type === 'PINCH') {
    // Curled pinky finger
    points[HAND_LANDMARK.PINKY_TIP] = { x: 0.58 * scale, y: 0.69 * scale, z: 0 };
  } else {
    // Extended
    points[HAND_LANDMARK.PINKY_TIP] = { x: 0.58 * scale, y: 0.46 * scale, z: 0 };
  }

  return points;
}

describe('LandmarkNormalizer', () => {
  it('correctly calculates 2D and 3D Euclidean distances', () => {
    const p1 = { x: 0, y: 0, z: 0 };
    const p2 = { x: 3, y: 4, z: 0 };
    const p3 = { x: 0, y: 0, z: 5 };

    expect(LandmarkNormalizer.distance2D(p1, p2)).toBeCloseTo(5.0, 5);
    expect(LandmarkNormalizer.distance3D(p1, p2)).toBeCloseTo(5.0, 5);
    expect(LandmarkNormalizer.distance3D(p1, p3)).toBeCloseTo(5.0, 5);
  });

  it('maps raw coordinates to mirrored centered 3D space', () => {
    // Center point (0.5, 0.5) should map to (0, 0)
    const center = LandmarkNormalizer.toMirroredCentered({ x: 0.5, y: 0.5, z: 0 });
    expect(center.x).toBeCloseTo(0, 5);
    expect(center.y).toBeCloseTo(0, 5);

    // Left raw X (0.2) in mirror becomes positive rightward X (+0.6)
    const leftPoint = LandmarkNormalizer.toMirroredCentered({ x: 0.2, y: 0.5, z: 0 });
    expect(leftPoint.x).toBeCloseTo(0.6, 5);

    // High raw Y (0.8) becomes downward Y (-0.6)
    const downPoint = LandmarkNormalizer.toMirroredCentered({ x: 0.5, y: 0.8, z: 0 });
    expect(downPoint.y).toBeCloseTo(-0.6, 5);
  });

  it('calculates palm size and scale-relative distances', () => {
    const hand = createSyntheticHand('OPEN_PALM');
    const palmSize = LandmarkNormalizer.getPalmSize(hand);
    expect(palmSize).toBeGreaterThan(0.1);

    const thumbTip = hand[HAND_LANDMARK.THUMB_TIP];
    const indexTip = hand[HAND_LANDMARK.INDEX_FINGER_TIP];
    const relDist = LandmarkNormalizer.getPalmRelativeDistance(thumbTip, indexTip, palmSize);
    expect(relDist).toBeGreaterThan(0);
  });
});

describe('GestureClassifier', () => {
  it('classifies an OPEN_PALM gesture correctly', () => {
    const hand = createSyntheticHand('OPEN_PALM');
    const { gesture, metrics } = GestureClassifier.classify(hand, DEFAULT_ENGINE_CONFIG);

    expect(gesture).toBe('OPEN_PALM');
    expect(metrics.pinchStrength).toBeLessThan(0.3);
  });

  it('classifies a CLOSED_FIST gesture correctly', () => {
    const hand = createSyntheticHand('CLOSED_FIST');
    const { gesture, metrics } = GestureClassifier.classify(hand, DEFAULT_ENGINE_CONFIG);

    expect(gesture).toBe('CLOSED_FIST');
    expect(metrics.fingerCurls[1]).toBeGreaterThan(0.65); // Index curled
    expect(metrics.fingerCurls[2]).toBeGreaterThan(0.65); // Middle curled
  });

  it('classifies a PINCH gesture correctly', () => {
    const hand = createSyntheticHand('PINCH');
    const { gesture, metrics } = GestureClassifier.classify(hand, DEFAULT_ENGINE_CONFIG);

    expect(gesture).toBe('PINCH');
    expect(metrics.pinchStrength).toBeGreaterThan(0.7);
  });

  it('classifies an index POINTING gesture correctly', () => {
    const hand = createSyntheticHand('POINTING');
    const { gesture, metrics } = GestureClassifier.classify(hand, DEFAULT_ENGINE_CONFIG);

    expect(gesture).toBe('POINTING');
    expect(metrics.fingerCurls[1]).toBeLessThan(0.35); // Index extended
    expect(metrics.fingerCurls[2]).toBeGreaterThan(0.6); // Middle curled
  });

  it('handles null, undefined, or empty landmarks safely', () => {
    const emptyResult = GestureClassifier.classify([], DEFAULT_ENGINE_CONFIG);
    expect(emptyResult.gesture).toBe('NONE');
    expect(emptyResult.metrics.confidence).toBe(0);

    const nullResult = GestureClassifier.classify(null, DEFAULT_ENGINE_CONFIG);
    expect(nullResult.gesture).toBe('NONE');

    const truncatedResult = GestureClassifier.classify(
      [{ x: 0, y: 0, z: 0 }],
      DEFAULT_ENGINE_CONFIG
    );
    expect(truncatedResult.gesture).toBe('NONE');
  });
});

describe('GestureSmoother', () => {
  it('smooths high-frequency positional jitter', () => {
    const smoother = new GestureSmoother(DEFAULT_ENGINE_CONFIG);
    const hand = createSyntheticHand('OPEN_PALM');
    const { metrics: initialMetrics } = GestureClassifier.classify(hand, DEFAULT_ENGINE_CONFIG);

    // Initial frame
    smoother.process('OPEN_PALM', initialMetrics);

    // Jittered sudden spike
    const jitteredMetrics = {
      ...initialMetrics,
      handCenter: { x: initialMetrics.handCenter.x + 0.8, y: initialMetrics.handCenter.y, z: 0 },
    };

    const { smoothedMetrics } = smoother.process('OPEN_PALM', jitteredMetrics);

    // Smoothed position should filter the sudden 0.8 jump significantly
    expect(smoothedMetrics.handCenter.x).toBeLessThan(jitteredMetrics.handCenter.x);
  });

  it('debounces CLOSED_FIST triggers and enforces cooldown', () => {
    const smoother = new GestureSmoother({ ...DEFAULT_ENGINE_CONFIG, fistCooldownMs: 500 });
    const hand = createSyntheticHand('CLOSED_FIST');
    const { metrics } = GestureClassifier.classify(hand, DEFAULT_ENGINE_CONFIG);

    // First frame: fist detected and triggered
    smoother.process('CLOSED_FIST', metrics, 1000);
    // Requires stable transition (2 frames)
    const frame2 = smoother.process('CLOSED_FIST', metrics, 1016);
    expect(frame2.fistTriggered).toBe(true);

    // Frame 3 (only 50ms later, fist still held): should NOT re-trigger
    const frame3 = smoother.process('CLOSED_FIST', metrics, 1066);
    expect(frame3.fistTriggered).toBe(false);

    // Frame 4 (600ms later, but fist was NEVER released): should NOT re-trigger without latch reset
    const frame4 = smoother.process('CLOSED_FIST', metrics, 1700);
    expect(frame4.fistTriggered).toBe(false);

    // Release fist
    const openHand = createSyntheticHand('OPEN_PALM');
    const { metrics: openMetrics } = GestureClassifier.classify(openHand, DEFAULT_ENGINE_CONFIG);
    smoother.process('OPEN_PALM', openMetrics, 1800);
    smoother.process('OPEN_PALM', openMetrics, 1816);

    // Form fist again after cooldown: should trigger anew!
    smoother.process('CLOSED_FIST', metrics, 2400);
    const frameNew = smoother.process('CLOSED_FIST', metrics, 2416);
    expect(frameNew.fistTriggered).toBe(true);
  });
});
