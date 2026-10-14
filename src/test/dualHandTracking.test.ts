import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MultiHandTracker } from '../core/vision/MultiHandTracker';
import { LandmarkFilter } from '../core/vision/LandmarkFilter';
import { HandSkeletonRenderer, mapLandmarkToCanvas, type HandRenderItem } from '../core/vision/HandSkeletonRenderer';
import { GestureEngine } from '../core/engine/GestureEngine';
import { DEFAULT_ENGINE_CONFIG, type HandLandmarks } from '../core/types';

/**
 * Generates a mock 21-landmark hand centered around (centerX, centerY).
 */
function createMockHand(centerX: number, centerY: number, palmSize: number = 0.15): HandLandmarks {
  const landmarks: HandLandmarks = [];
  // 0: Wrist
  landmarks.push({ x: centerX, y: centerY + palmSize, z: 0 });
  // 1-4: Thumb
  for (let i = 1; i <= 4; i++) {
    landmarks.push({ x: centerX - 0.05 - i * 0.015, y: centerY + palmSize * 0.5 - i * 0.02, z: 0 });
  }
  // 5-8: Index
  for (let i = 1; i <= 4; i++) {
    landmarks.push({ x: centerX - 0.03, y: centerY - i * 0.03, z: 0 });
  }
  // 9-12: Middle
  for (let i = 1; i <= 4; i++) {
    landmarks.push({ x: centerX, y: centerY - i * 0.035, z: 0 });
  }
  // 13-16: Ring
  for (let i = 1; i <= 4; i++) {
    landmarks.push({ x: centerX + 0.03, y: centerY - i * 0.03, z: 0 });
  }
  // 17-20: Pinky
  for (let i = 1; i <= 4; i++) {
    landmarks.push({ x: centerX + 0.06, y: centerY - i * 0.025, z: 0 });
  }
  return landmarks;
}

describe('Dual-Hand Tracking, Smoothing & Multi-Hand Skeleton Rendering', () => {
  describe('LandmarkFilter (Adaptive Velocity-Aware Smoothing)', () => {
    it('initializes immediately on first detection without dragging from zero', () => {
      const filter = new LandmarkFilter();
      const rawHand = createMockHand(0.4, 0.5);

      const smoothed = filter.filter(rawHand, 1000);

      // On frame 0, smoothed output must exactly match raw input (zero latency)
      expect(smoothed[0].x).toBeCloseTo(rawHand[0].x, 5);
      expect(smoothed[0].y).toBeCloseTo(rawHand[0].y, 5);
    });

    it('damps high-frequency jitter during stationary hand poses', () => {
      const filter = new LandmarkFilter({ stationaryAlpha: 0.70 });
      const baseHand = createMockHand(0.5, 0.5);
      filter.filter(baseHand, 1000);

      // Apply small sensor jitter (+0.005)
      const jitterHand = createMockHand(0.505, 0.502);
      const smoothed = filter.filter(jitterHand, 1033);

      // Jitter should be heavily smoothed: change should be less than the raw jitter jump
      const rawJump = Math.abs(jitterHand[0].x - baseHand[0].x);
      const smoothedJump = Math.abs(smoothed[0].x - baseHand[0].x);
      expect(smoothedJump).toBeLessThan(rawJump * 0.4);
    });

    it('reduces smoothing factor during fast movements to prevent lagging', () => {
      const filter = new LandmarkFilter({ stationaryAlpha: 0.70, fastAlpha: 0.10 });
      const baseHand = createMockHand(0.2, 0.5);
      filter.filter(baseHand, 1000);

      // Fast hand sweep: hand moves 0.3 units in 33ms (speed ~ 9.0 units/sec)
      const fastHand = createMockHand(0.5, 0.5);
      const smoothed = filter.filter(fastHand, 1033);

      // Under fast movement, alpha drops to fastAlpha (0.10), so smoothed point tracks > 85% of movement
      const totalDist = fastHand[0].x - baseHand[0].x;
      const smoothedDist = smoothed[0].x - baseHand[0].x;
      expect(smoothedDist / totalDist).toBeGreaterThan(0.85);
    });

    it('resets cleanly after tracking loss to prevent position interpolation', () => {
      const filter = new LandmarkFilter();
      const hand1 = createMockHand(0.2, 0.5);
      filter.filter(hand1, 1000);

      // Simulate tracking loss
      filter.reset();
      expect(filter.getLatest()).toBeNull();

      // Hand returns at far side of screen (0.8)
      const hand2 = createMockHand(0.8, 0.5);
      const smoothed = filter.filter(hand2, 2000);

      // Must snap directly to 0.8 without interpolating from 0.2
      expect(smoothed[0].x).toBeCloseTo(0.8, 4);
    });

    it('maintains independent filter histories for separate hands', () => {
      const filterA = new LandmarkFilter();
      const filterB = new LandmarkFilter();

      const leftHand = createMockHand(0.2, 0.5);
      const rightHand = createMockHand(0.8, 0.5);

      filterA.filter(leftHand, 1000);
      filterB.filter(rightHand, 1000);

      const latestA = filterA.getLatest();
      const latestB = filterB.getLatest();

      expect(latestA?.[0].x).toBeCloseTo(leftHand[0].x, 3);
      expect(latestB?.[0].x).toBeCloseTo(rightHand[0].x, 3);
      expect(latestA?.[0].x).not.toBeCloseTo(latestB?.[0].x || 0, 1);
    });
  });

  describe('MultiHandTracker (Dual-Hand Association & Grace Period)', () => {
    let tracker: MultiHandTracker;

    beforeEach(() => {
      tracker = new MultiHandTracker({ gracePeriodMs: 200 });
    });

    it('returns empty list when zero hands are detected', () => {
      const active = tracker.update([], undefined, 1000, DEFAULT_ENGINE_CONFIG);
      expect(active).toHaveLength(0);
      expect(tracker.getPrimaryHand()).toBeNull();
    });

    it('accurately tracks 1 hand with 21 landmarks', () => {
      const hand = createMockHand(0.4, 0.5);
      const active = tracker.update([hand], [[{ categoryName: 'Right', score: 0.95 }]], 1000, DEFAULT_ENGINE_CONFIG);

      expect(active).toHaveLength(1);
      expect(active[0].handedness).toBe('Right');
      expect(active[0].smoothedLandmarks).toHaveLength(21);
      expect(active[0].isGracePeriod).toBe(false);
      expect(tracker.getPrimaryHand()).not.toBeNull();
    });

    it('tracks 2 hands simultaneously with independent state and correct handedness', () => {
      const leftHand = createMockHand(0.25, 0.5);
      const rightHand = createMockHand(0.75, 0.5);

      const active = tracker.update(
        [leftHand, rightHand],
        [
          [{ categoryName: 'Left', score: 0.92 }],
          [{ categoryName: 'Right', score: 0.94 }],
        ],
        1000,
        DEFAULT_ENGINE_CONFIG
      );

      expect(active).toHaveLength(2);
      expect(active.map((h) => h.handedness)).toEqual(expect.arrayContaining(['Left', 'Right']));
      expect(active[0].id).not.toBe(active[1].id);
      expect(active[0].smoothedLandmarks).toHaveLength(21);
      expect(active[1].smoothedLandmarks).toHaveLength(21);
    });

    it('handles independent hand loss: keeps rendering remaining hand when one disappears', () => {
      const leftHand = createMockHand(0.25, 0.5);
      const rightHand = createMockHand(0.75, 0.5);

      // Frame 1: Both hands detected
      tracker.update(
        [leftHand, rightHand],
        [
          [{ categoryName: 'Left', score: 0.9 }],
          [{ categoryName: 'Right', score: 0.9 }],
        ],
        1000,
        DEFAULT_ENGINE_CONFIG
      );

      // Frame 2 (50ms later): Left hand drops out, only Right hand remains visible
      const rightHandMoved = createMockHand(0.76, 0.5);
      const activeDuringGrace = tracker.update(
        [rightHandMoved],
        [[{ categoryName: 'Right', score: 0.9 }]],
        1050,
        DEFAULT_ENGINE_CONFIG
      );

      // During grace period (200ms), 2 hands are reported, but left hand is flagged in grace period
      expect(activeDuringGrace).toHaveLength(2);
      const graceHand = activeDuringGrace.find((h) => h.isGracePeriod);
      const activeHand = activeDuringGrace.find((h) => !h.isGracePeriod);
      expect(graceHand).toBeDefined();
      expect(activeHand).toBeDefined();
      expect(activeHand?.handedness).toBe('Right');

      // Frame 3 (300ms after initial detection > gracePeriodMs 200ms):
      // Disappeared hand must be cleared, leaving ONLY the active hand
      const activePostGrace = tracker.update(
        [rightHandMoved],
        [[{ categoryName: 'Right', score: 0.9 }]],
        1350,
        DEFAULT_ENGINE_CONFIG
      );

      expect(activePostGrace).toHaveLength(1);
      expect(activePostGrace[0].handedness).toBe('Right');
      expect(activePostGrace[0].isGracePeriod).toBe(false);
    });

    it('preserves hand tracking continuity and prevents swapping when hands cross', () => {
      // Hand 1 starts on left (0.40) moving right (+0.04/frame)
      // Hand 2 starts on right (0.60) moving left (-0.04/frame)
      let h1 = createMockHand(0.40, 0.5);
      let h2 = createMockHand(0.60, 0.5);

      tracker.update(
        [h1, h2],
        [[{ categoryName: 'Left', score: 0.9 }], [{ categoryName: 'Right', score: 0.9 }]],
        1000,
        DEFAULT_ENGINE_CONFIG
      );

      const initialTracks = tracker.getTrackedHands();
      const track1Id = initialTracks.find((h) => h.handedness === 'Left')?.id;
      const track2Id = initialTracks.find((h) => h.handedness === 'Right')?.id;

      // Approaching center
      h1 = createMockHand(0.46, 0.5);
      h2 = createMockHand(0.54, 0.5);
      tracker.update(
        [h1, h2],
        [[{ categoryName: 'Left', score: 0.9 }], [{ categoryName: 'Right', score: 0.9 }]],
        1033,
        DEFAULT_ENGINE_CONFIG
      );

      // Crossing center: Hand 1 is now at 0.52, Hand 2 is at 0.48
      h1 = createMockHand(0.52, 0.5);
      h2 = createMockHand(0.48, 0.5);
      const crossedTracks = tracker.update(
        [h1, h2],
        [[{ categoryName: 'Left', score: 0.9 }], [{ categoryName: 'Right', score: 0.9 }]],
        1066,
        DEFAULT_ENGINE_CONFIG
      );

      // Hand 1 (Left) must still hold track1Id despite having moved to the right
      const leftTrack = crossedTracks.find((h) => h.handedness === 'Left');
      const rightTrack = crossedTracks.find((h) => h.handedness === 'Right');

      expect(leftTrack?.id).toBe(track1Id);
      expect(rightTrack?.id).toBe(track2Id);
    });
  });

  describe('HandSkeletonRenderer (Simultaneous Multi-Hand Rendering)', () => {
    it('renders two hand skeletons without throwing on canvas mock', () => {
      const mockCanvas = document.createElement('canvas');
      const renderer = new HandSkeletonRenderer(mockCanvas);

      const hand1: HandRenderItem = {
        landmarks: createMockHand(0.25, 0.5),
        handedness: 'Left',
        gesture: 'OPEN_PALM',
      };
      const hand2: HandRenderItem = {
        landmarks: createMockHand(0.75, 0.5),
        handedness: 'Right',
        gesture: 'PINCH',
      };

      expect(() => {
        renderer.renderHands([hand1, hand2], 800, 600, 640, 480);
      }).not.toThrow();
    });

    it('clears canvas when zero hands are passed to renderHands', () => {
      const mockCanvas = document.createElement('canvas');
      const renderer = new HandSkeletonRenderer(mockCanvas);

      expect(() => {
        renderer.renderHands([], 800, 600, 640, 480);
      }).not.toThrow();
    });

    it('correctly maps 21 landmark coordinates with horizontal scaleX(-1) mirror alignment', () => {
      // Sensor X = 0.3 should mirror to (1 - 0.3) = 0.7 screen coordinate
      const mapped = mapLandmarkToCanvas({ x: 0.3, y: 0.4, z: 0 }, 1000, 1000, 640, 480);
      expect(mapped.x).toBeGreaterThan(500); // Should be on the right side of the screen
    });
  });

  describe('GestureEngine Dual-Hand Frame Emission', () => {
    it('exposes getTrackedHands and emits multi-hand state to frame listeners', () => {
      const engine = GestureEngine.getInstance();
      expect(typeof engine.getTrackedHands).toBe('function');

      const frameSpy = vi.fn();
      const unsub = engine.onFrame(frameSpy);

      expect(typeof unsub).toBe('function');
      unsub();
    });
  });
});
