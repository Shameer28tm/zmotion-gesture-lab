/**
 * ZMotion Gesture Engine Core Types & Landmark Indices
 */

export interface LandmarkPoint {
  x: number;
  y: number;
  z: number;
}

export type HandLandmarks = LandmarkPoint[];

/** Standard 21 MediaPipe Hand Landmark Indices */
export const HAND_LANDMARK = {
  WRIST: 0,
  THUMB_CMC: 1,
  THUMB_MCP: 2,
  THUMB_IP: 3,
  THUMB_TIP: 4,
  INDEX_FINGER_MCP: 5,
  INDEX_FINGER_PIP: 6,
  INDEX_FINGER_DIP: 7,
  INDEX_FINGER_TIP: 8,
  MIDDLE_FINGER_MCP: 9,
  MIDDLE_FINGER_PIP: 10,
  MIDDLE_FINGER_DIP: 11,
  MIDDLE_FINGER_TIP: 12,
  RING_FINGER_MCP: 13,
  RING_FINGER_PIP: 14,
  RING_FINGER_DIP: 15,
  RING_FINGER_TIP: 16,
  PINKY_MCP: 17,
  PINKY_PIP: 18,
  PINKY_DIP: 19,
  PINKY_TIP: 20,
} as const;

export type GestureType = 'NONE' | 'OPEN_PALM' | 'CLOSED_FIST' | 'PINCH' | 'POINTING';

export interface GestureMetrics {
  /** Relative thumb-index pinch distance normalized to palm size */
  rawPinchDistance: number;
  /** Normalized pinch strength from 0.0 (open) to 1.0 (pinched) */
  pinchStrength: number;
  /** Mirrored hand center coordinate in range [-1, 1] */
  handCenter: LandmarkPoint;
  /** Normalized palm scale reference (distance between WRIST and MIDDLE_MCP) */
  palmSize: number;
  /** Curl ratio per finger (0 = fully extended, 1 = fully curled) [thumb, index, middle, ring, pinky] */
  fingerCurls: [number, number, number, number, number];
  /** Confidence score between 0 and 1 */
  confidence: number;
}

export interface GestureState {
  activeGesture: GestureType;
  metrics: GestureMetrics;
  handDetected: boolean;
  handedness: 'Left' | 'Right' | 'Unknown';
}

export type CameraStatus =
  | 'idle'
  | 'requesting'
  | 'streaming'
  | 'stopped'
  | 'permission_denied'
  | 'not_found'
  | 'error';

export interface GestureEngineConfig {
  sensitivity: number;
  smoothingAlpha: number;
  pinchThresholdMin: number;
  pinchThresholdMax: number;
  fistCooldownMs: number;
  pointingThreshold: number;
}

export const DEFAULT_ENGINE_CONFIG: GestureEngineConfig = {
  sensitivity: 1.2,
  smoothingAlpha: 0.75, // 0 = raw, 1 = maximum smooth
  pinchThresholdMin: 0.28, // Scaled relative to palmSize
  pinchThresholdMax: 0.65,
  fistCooldownMs: 800,
  pointingThreshold: 1.35,
};
