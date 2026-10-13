import { HAND_LANDMARK, type HandLandmarks, type LandmarkPoint } from '../types';

export class LandmarkNormalizer {
  /**
   * Calculates 3D Euclidean distance between two landmark points
   */
  public static distance3D(p1: LandmarkPoint, p2: LandmarkPoint): number {
    const dx = p1.x - p2.x;
    const dy = p1.y - p2.y;
    const dz = p1.z - p2.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  /**
   * Calculates 2D Euclidean distance (ignoring depth)
   */
  public static distance2D(p1: LandmarkPoint, p2: LandmarkPoint): number {
    const dx = p1.x - p2.x;
    const dy = p1.y - p2.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Computes the scale reference: distance from WRIST (0) to MIDDLE_FINGER_MCP (9).
   * Used to normalize hand size regardless of distance from webcam.
   */
  public static getPalmSize(landmarks: HandLandmarks): number {
    if (!landmarks || landmarks.length <= HAND_LANDMARK.MIDDLE_FINGER_MCP) {
      return 0.15; // default fallback scale
    }
    const wrist = landmarks[HAND_LANDMARK.WRIST];
    const middleMcp = landmarks[HAND_LANDMARK.MIDDLE_FINGER_MCP];
    const dist = this.distance3D(wrist, middleMcp);
    return Math.max(dist, 0.04);
  }

  /**
   * Computes scale-invariant distance relative to palm size.
   */
  public static getPalmRelativeDistance(
    p1: LandmarkPoint,
    p2: LandmarkPoint,
    palmSize: number
  ): number {
    const safePalmSize = Math.max(palmSize, 0.04);
    return this.distance3D(p1, p2) / safePalmSize;
  }

  /**
   * Calculates stable palm centroid from Wrist (0), Index MCP (5), and Pinky MCP (17).
   * Unlike a single finger MCP, this is anchored to the palm base and does not swing when fingers articulate.
   */
  public static getPalmCenter(landmarks: HandLandmarks): LandmarkPoint {
    if (!landmarks || landmarks.length < 21) {
      return { x: 0.5, y: 0.5, z: 0 };
    }
    const wrist = landmarks[HAND_LANDMARK.WRIST];
    const indexMcp = landmarks[HAND_LANDMARK.INDEX_FINGER_MCP];
    const pinkyMcp = landmarks[HAND_LANDMARK.PINKY_MCP];
    return {
      x: (wrist.x + indexMcp.x + pinkyMcp.x) / 3,
      y: (wrist.y + indexMcp.y + pinkyMcp.y) / 3,
      z: (wrist.z + indexMcp.z + pinkyMcp.z) / 3,
    };
  }

  /**
   * Converts raw landmark point (0 to 1) into mirrored centered 3D coordinates (-1 to 1).
   * Upward hand movement maps to positive Y; Rightward movement maps to positive X.
   */
  public static toMirroredCentered(point: LandmarkPoint): LandmarkPoint {
    return {
      x: (point.x - 0.5) * -2,
      y: (point.y - 0.5) * -2,
      z: point.z,
    };
  }

  /**
   * Applies configurable dead zone filtering and sensitivity scaling to centered coordinates.
   */
  public static applyDeadZoneAndSensitivity(
    centeredPoint: LandmarkPoint,
    deadZone: number = 0.04,
    sensitivity: number = 1.0
  ): LandmarkPoint {
    const filter = (val: number): number => {
      if (Math.abs(val) < deadZone) return 0;
      const sign = Math.sign(val);
      return sign * ((Math.abs(val) - deadZone) / (1 - deadZone));
    };

    return {
      x: Math.max(-1, Math.min(1, filter(centeredPoint.x) * sensitivity)),
      y: Math.max(-1, Math.min(1, filter(centeredPoint.y) * sensitivity)),
      z: centeredPoint.z,
    };
  }

  /**
   * Normalizes entire hand landmark set:
   * Returns mirrored coordinates for consistent rendering.
   */
  public static normalizeSet(landmarks: HandLandmarks): HandLandmarks {
    return landmarks.map((pt) => ({
      x: 1 - pt.x,
      y: pt.y,
      z: pt.z,
    }));
  }
}
