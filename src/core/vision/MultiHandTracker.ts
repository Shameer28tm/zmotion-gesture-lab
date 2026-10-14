import {
  HAND_LANDMARK,
  type GestureEngineConfig,
  type GestureMetrics,
  type GestureType,
  type HandLandmarks,
  type LandmarkPoint,
} from '../types';
import { LandmarkNormalizer } from './LandmarkNormalizer';
import { LandmarkFilter } from './LandmarkFilter';
import { GestureClassifier } from '../gestures/GestureClassifier';

export interface TrackedHand {
  /** Stable identifier for the hand track */
  id: string;
  /** Inferred handedness from MediaPipe or tracking context */
  handedness: 'Left' | 'Right' | 'Unknown';
  /** Handedness detection confidence score (0 to 1) */
  handednessScore: number;
  /** Raw 21 landmarks direct from MediaPipe (authoritative for gestures) */
  rawLandmarks: HandLandmarks;
  /** Dynamically smoothed 21 landmarks for responsive visual skeleton rendering */
  smoothedLandmarks: HandLandmarks;
  /** Centroid of the palm in normalized [0, 1] coordinate space */
  palmCenter: LandmarkPoint;
  /** Wrist point in normalized [0, 1] coordinate space */
  wrist: LandmarkPoint;
  /** Current discrete gesture state for this hand */
  gesture: GestureType;
  /** Continuous metrics for this hand (pinch, curls, handCenter) */
  metrics: GestureMetrics;
  /** Timestamp when this hand was last detected in a physical camera frame */
  lastSeenTimestamp: number;
  /** Whether this hand is currently in a temporary occlusion/loss grace period */
  isGracePeriod: boolean;
}

interface HandTrackSlot {
  id: string;
  hand: TrackedHand | null;
  filter: LandmarkFilter;
  velocity: { x: number; y: number; z: number };
}

export interface MultiHandTrackerOptions {
  /** Grace period in milliseconds before dropping an occluded hand (default: 200ms) */
  gracePeriodMs?: number;
  /** Maximum distance in normalized coords between consecutive frames to maintain identity */
  maxMatchDistance?: number;
}

/**
 * MultiHandTracker manages simultaneous tracking of up to two hands.
 *
 * Safe Association Strategy & API Limitations:
 * - MediaPipe Tasks Vision does not provide persistent tracking IDs across video frames,
 *   and landmark array ordering ([0] vs [1]) is non-deterministic.
 * - Handedness prediction can momentarily fluctuate when hands cross or orient sideways.
 * - To solve this safely, MultiHandTracker implements an association strategy combining:
 *   1. Spatial Euclidean proximity of palm centroids between frames.
 *   2. Velocity vector projection to resolve ambiguous crossings.
 *   3. Soft handedness affinity weighting.
 *   4. Independent per-hand landmark smoothing filters.
 *   5. Independent grace periods so disappearing one hand never clears or interrupts the other.
 */
export class MultiHandTracker {
  private slots: HandTrackSlot[];
  private gracePeriodMs: number;
  private maxMatchDistance: number;
  private nextHandCounter = 1;

  constructor(options: MultiHandTrackerOptions = {}) {
    this.gracePeriodMs = options.gracePeriodMs ?? 200;
    this.maxMatchDistance = options.maxMatchDistance ?? 0.40;

    this.slots = [
      { id: 'hand-1', hand: null, filter: new LandmarkFilter(), velocity: { x: 0, y: 0, z: 0 } },
      { id: 'hand-2', hand: null, filter: new LandmarkFilter(), velocity: { x: 0, y: 0, z: 0 } },
    ];
  }

  /**
   * Resets all tracking history and clears active hand slots.
   */
  public reset(): void {
    for (const slot of this.slots) {
      slot.hand = null;
      slot.filter.reset();
      slot.velocity = { x: 0, y: 0, z: 0 };
    }
  }

  /**
   * Updates tracking state with fresh MediaPipe detection results.
   *
   * @param rawLandmarksList List of detected hands (each having 21 landmarks)
   * @param handednessList List of handedness categories from MediaPipe
   * @param timestamp Monotonic frame timestamp in ms
   * @param config Engine configuration for classification & smoothing
   * @returns List of active tracked hands (including those in justified grace period)
   */
  public update(
    rawLandmarksList: HandLandmarks[],
    handednessList: Array<Array<{ categoryName?: string; score?: number }>> | undefined,
    timestamp: number,
    config: GestureEngineConfig
  ): TrackedHand[] {
    const detections = (rawLandmarksList || [])
      .filter((lms) => lms && lms.length === 21)
      .slice(0, 2)
      .map((lms, idx) => {
        const handednessCategory = handednessList?.[idx]?.[0];
        const categoryName = handednessCategory?.categoryName;
        const handedness: 'Left' | 'Right' | 'Unknown' =
          categoryName === 'Left' || categoryName === 'Right' ? categoryName : 'Unknown';
        const handednessScore = handednessCategory?.score ?? 0.8;
        const palmCenter = LandmarkNormalizer.getPalmCenter(lms);
        const wrist = lms[HAND_LANDMARK.WRIST];

        return {
          rawLandmarks: lms,
          handedness,
          handednessScore,
          palmCenter,
          wrist,
        };
      });

    // 1. Evict slots whose grace period has expired
    for (const slot of this.slots) {
      if (slot.hand && timestamp - slot.hand.lastSeenTimestamp > this.gracePeriodMs) {
        slot.hand = null;
        slot.filter.reset();
        slot.velocity = { x: 0, y: 0, z: 0 };
      }
    }

    const activeSlots = this.slots.filter((s) => s.hand !== null);

    // 2. Associate detections with slots
    if (detections.length === 0) {
      // No hands detected in current camera frame
      for (const slot of this.slots) {
        if (slot.hand) {
          slot.hand.isGracePeriod = true;
        }
      }
    } else if (activeSlots.length === 0) {
      // Cold start / re-acquisition: assign detections to empty slots
      for (let i = 0; i < detections.length; i++) {
        const det = detections[i];
        const slot = this.slots[i];
        this.assignDetectionToSlot(slot, det, timestamp, config);
      }
    } else {
      // Perform optimal association between active slots and incoming detections
      this.matchDetectionsToSlots(detections, timestamp, config);
    }

    // 3. Collect all active hands (including valid grace period hands)
    const activeHands: TrackedHand[] = [];
    for (const slot of this.slots) {
      if (slot.hand) {
        activeHands.push({ ...slot.hand });
      }
    }

    return activeHands;
  }

  private calculateMatchCost(
    slot: HandTrackSlot,
    det: {
      rawLandmarks: HandLandmarks;
      handedness: 'Left' | 'Right' | 'Unknown';
      palmCenter: LandmarkPoint;
    },
    dtSeconds: number
  ): number {
    if (!slot.hand) return 999;

    // Projected position using estimated velocity
    const projectedCenter = {
      x: slot.hand.palmCenter.x + slot.velocity.x * Math.min(dtSeconds, 0.1),
      y: slot.hand.palmCenter.y + slot.velocity.y * Math.min(dtSeconds, 0.1),
      z: slot.hand.palmCenter.z + slot.velocity.z * Math.min(dtSeconds, 0.1),
    };

    const dx = det.palmCenter.x - projectedCenter.x;
    const dy = det.palmCenter.y - projectedCenter.y;
    const dz = det.palmCenter.z - projectedCenter.z;
    const spatialDistance = Math.sqrt(dx * dx + dy * dy + dz * dz);

    // Handedness penalty: helps maintain identity when hands cross near the center
    let handednessPenalty = 0;
    if (
      slot.hand.handedness !== 'Unknown' &&
      det.handedness !== 'Unknown' &&
      slot.hand.handedness !== det.handedness
    ) {
      handednessPenalty = 0.22;
    }

    return spatialDistance + handednessPenalty;
  }

  private matchDetectionsToSlots(
    detections: Array<{
      rawLandmarks: HandLandmarks;
      handedness: 'Left' | 'Right' | 'Unknown';
      handednessScore: number;
      palmCenter: LandmarkPoint;
      wrist: LandmarkPoint;
    }>,
    timestamp: number,
    config: GestureEngineConfig
  ): void {
    const slot0 = this.slots[0];
    const slot1 = this.slots[1];

    if (slot0.hand && slot1.hand && detections.length === 2) {
      // 2 active slots, 2 detections: compare (0->0, 1->1) vs (0->1, 1->0)
      const dt0 = Math.max(0.001, (timestamp - slot0.hand.lastSeenTimestamp) / 1000);
      const dt1 = Math.max(0.001, (timestamp - slot1.hand.lastSeenTimestamp) / 1000);

      const costA =
        this.calculateMatchCost(slot0, detections[0], dt0) +
        this.calculateMatchCost(slot1, detections[1], dt1);
      const costB =
        this.calculateMatchCost(slot0, detections[1], dt0) +
        this.calculateMatchCost(slot1, detections[0], dt1);

      if (costA <= costB) {
        this.assignDetectionToSlot(slot0, detections[0], timestamp, config);
        this.assignDetectionToSlot(slot1, detections[1], timestamp, config);
      } else {
        this.assignDetectionToSlot(slot0, detections[1], timestamp, config);
        this.assignDetectionToSlot(slot1, detections[0], timestamp, config);
      }
    } else if (slot0.hand && slot1.hand && detections.length === 1) {
      // 2 active slots, 1 detection: match to closest, place other in grace period
      const dt0 = Math.max(0.001, (timestamp - slot0.hand.lastSeenTimestamp) / 1000);
      const dt1 = Math.max(0.001, (timestamp - slot1.hand.lastSeenTimestamp) / 1000);

      const cost0 = this.calculateMatchCost(slot0, detections[0], dt0);
      const cost1 = this.calculateMatchCost(slot1, detections[0], dt1);

      if (cost0 <= cost1) {
        this.assignDetectionToSlot(slot0, detections[0], timestamp, config);
        slot1.hand.isGracePeriod = true;
      } else {
        this.assignDetectionToSlot(slot1, detections[0], timestamp, config);
        slot0.hand.isGracePeriod = true;
      }
    } else {
      // General 1 active slot, or 1 empty slot
      const matchedDetections = new Set<number>();
      const matchedSlots = new Set<HandTrackSlot>();

      // First pass: match active slots to closest detection below threshold
      for (const slot of this.slots) {
        if (!slot.hand) continue;
        const dt = Math.max(0.001, (timestamp - slot.hand.lastSeenTimestamp) / 1000);

        let bestIdx = -1;
        let minCost = this.maxMatchDistance;

        for (let i = 0; i < detections.length; i++) {
          if (matchedDetections.has(i)) continue;
          const cost = this.calculateMatchCost(slot, detections[i], dt);
          if (cost < minCost) {
            minCost = cost;
            bestIdx = i;
          }
        }

        if (bestIdx !== -1) {
          this.assignDetectionToSlot(slot, detections[bestIdx], timestamp, config);
          matchedDetections.add(bestIdx);
          matchedSlots.add(slot);
        } else {
          slot.hand.isGracePeriod = true;
        }
      }

      // Second pass: assign unmatched detections to free slots
      for (let i = 0; i < detections.length; i++) {
        if (matchedDetections.has(i)) continue;
        const freeSlot = this.slots.find((s) => s.hand === null);
        if (freeSlot) {
          this.assignDetectionToSlot(freeSlot, detections[i], timestamp, config);
          matchedDetections.add(i);
        }
      }
    }
  }

  private assignDetectionToSlot(
    slot: HandTrackSlot,
    det: {
      rawLandmarks: HandLandmarks;
      handedness: 'Left' | 'Right' | 'Unknown';
      handednessScore: number;
      palmCenter: LandmarkPoint;
      wrist: LandmarkPoint;
    },
    timestamp: number,
    config: GestureEngineConfig
  ): void {
    // 1. Authoritative gesture classification on raw coordinates
    const { gesture, metrics } = GestureClassifier.classify(det.rawLandmarks, config);

    // 2. Update velocity estimate
    if (slot.hand) {
      const dt = Math.max(0.001, (timestamp - slot.hand.lastSeenTimestamp) / 1000);
      slot.velocity = {
        x: (det.palmCenter.x - slot.hand.palmCenter.x) / dt,
        y: (det.palmCenter.y - slot.hand.palmCenter.y) / dt,
        z: (det.palmCenter.z - slot.hand.palmCenter.z) / dt,
      };
    } else {
      slot.velocity = { x: 0, y: 0, z: 0 };
      if (!slot.id) {
        slot.id = `hand-${this.nextHandCounter++}`;
      }
    }

    // 3. Adaptive landmark smoothing for skeleton overlay
    const smoothedLandmarks = slot.filter.filter(det.rawLandmarks, timestamp);

    // 4. Stable handedness: preserve existing if new is Unknown, or update if confident
    let handedness = det.handedness;
    let handednessScore = det.handednessScore;
    if (handedness === 'Unknown' && slot.hand && slot.hand.handedness !== 'Unknown') {
      handedness = slot.hand.handedness;
      handednessScore = slot.hand.handednessScore;
    }

    slot.hand = {
      id: slot.id,
      handedness,
      handednessScore,
      rawLandmarks: det.rawLandmarks,
      smoothedLandmarks,
      palmCenter: det.palmCenter,
      wrist: det.wrist,
      gesture,
      metrics,
      lastSeenTimestamp: timestamp,
      isGracePeriod: false,
    };
  }

  /**
   * Returns primary hand (Right hand preferred, or highest confidence/first detected).
   * Ensures backwards compatibility for single-hand experience interactions.
   */
  public getPrimaryHand(): TrackedHand | null {
    const active = this.slots.filter((s) => s.hand !== null).map((s) => s.hand!);
    if (active.length === 0) return null;
    if (active.length === 1) return active[0];

    // Prefer Right hand if identified, otherwise primary slot
    const rightHand = active.find((h) => h.handedness === 'Right');
    return rightHand ?? active[0];
  }

  /**
   * Returns current active tracked hands list.
   */
  public getTrackedHands(): TrackedHand[] {
    return this.slots.filter((s) => s.hand !== null).map((s) => ({ ...s.hand! }));
  }
}
