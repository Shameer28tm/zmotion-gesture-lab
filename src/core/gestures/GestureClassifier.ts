import {
  HAND_LANDMARK,
  type GestureEngineConfig,
  type GestureMetrics,
  type GestureType,
  type HandLandmarks,
} from '../types';
import { LandmarkNormalizer } from '../vision/LandmarkNormalizer';

export class GestureClassifier {
  /**
   * Evaluates hand landmarks and returns computed gesture metrics and classification.
   */
  public static classify(
    landmarks: HandLandmarks | null | undefined,
    config: GestureEngineConfig
  ): { gesture: GestureType; metrics: GestureMetrics } {
    if (!landmarks || landmarks.length < 21) {
      return {
        gesture: 'NONE',
        metrics: this.createEmptyMetrics(),
      };
    }

    const wrist = landmarks[HAND_LANDMARK.WRIST];
    const palmSize = LandmarkNormalizer.getPalmSize(landmarks);
    const middleMcp = landmarks[HAND_LANDMARK.MIDDLE_FINGER_MCP];
    const handCenter = LandmarkNormalizer.toMirroredCentered(middleMcp);

    // 1. Calculate finger curls
    const thumbCurl = this.calculateThumbCurl(landmarks, palmSize);
    const indexCurl = this.calculateFingerCurl(
      landmarks[HAND_LANDMARK.INDEX_FINGER_TIP],
      landmarks[HAND_LANDMARK.INDEX_FINGER_PIP],
      landmarks[HAND_LANDMARK.INDEX_FINGER_MCP],
      wrist
    );
    const middleCurl = this.calculateFingerCurl(
      landmarks[HAND_LANDMARK.MIDDLE_FINGER_TIP],
      landmarks[HAND_LANDMARK.MIDDLE_FINGER_PIP],
      landmarks[HAND_LANDMARK.MIDDLE_FINGER_MCP],
      wrist
    );
    const ringCurl = this.calculateFingerCurl(
      landmarks[HAND_LANDMARK.RING_FINGER_TIP],
      landmarks[HAND_LANDMARK.RING_FINGER_PIP],
      landmarks[HAND_LANDMARK.RING_FINGER_MCP],
      wrist
    );
    const pinkyCurl = this.calculateFingerCurl(
      landmarks[HAND_LANDMARK.PINKY_TIP],
      landmarks[HAND_LANDMARK.PINKY_PIP],
      landmarks[HAND_LANDMARK.PINKY_MCP],
      wrist
    );

    const fingerCurls: [number, number, number, number, number] = [
      thumbCurl,
      indexCurl,
      middleCurl,
      ringCurl,
      pinkyCurl,
    ];

    // 2. Pinch Calculation (Thumb Tip 4 to Index Tip 8)
    const thumbTip = landmarks[HAND_LANDMARK.THUMB_TIP];
    const indexTip = landmarks[HAND_LANDMARK.INDEX_FINGER_TIP];
    const rawPinchDistance = LandmarkNormalizer.getPalmRelativeDistance(
      thumbTip,
      indexTip,
      palmSize
    );

    let pinchStrength = 0;
    if (rawPinchDistance <= config.pinchThresholdMin) {
      pinchStrength = 1.0;
    } else if (rawPinchDistance >= config.pinchThresholdMax) {
      pinchStrength = 0.0;
    } else {
      const range = config.pinchThresholdMax - config.pinchThresholdMin;
      pinchStrength = Math.max(
        0,
        Math.min(1, 1 - (rawPinchDistance - config.pinchThresholdMin) / range)
      );
    }

    const metrics: GestureMetrics = {
      rawPinchDistance,
      pinchStrength,
      handCenter,
      palmSize,
      fingerCurls,
      confidence: 0.95,
    };

    // 3. Gesture State Discrimination
    // A. Pinch Gesture: thumb and index in contact, while other fingers are not fully closed into fist
    const isPinching = pinchStrength > 0.65;

    // B. Closed Fist: all 4 fingers curled
    const isFist =
      indexCurl > 0.65 &&
      middleCurl > 0.65 &&
      ringCurl > 0.65 &&
      pinkyCurl > 0.65;

    // C. Pointing: index finger extended, middle/ring/pinky curled
    const isPointing =
      indexCurl < 0.35 &&
      middleCurl > 0.6 &&
      ringCurl > 0.6 &&
      pinkyCurl > 0.6 &&
      !isPinching;

    // D. Open Palm: all 4 fingers extended
    const isOpenPalm =
      indexCurl < 0.35 &&
      middleCurl < 0.35 &&
      ringCurl < 0.35 &&
      pinkyCurl < 0.35 &&
      !isPinching;

    let gesture: GestureType = 'NONE';
    if (isFist) {
      gesture = 'CLOSED_FIST';
    } else if (isPinching) {
      gesture = 'PINCH';
    } else if (isPointing) {
      gesture = 'POINTING';
    } else if (isOpenPalm) {
      gesture = 'OPEN_PALM';
    }

    return { gesture, metrics };
  }

  private static calculateFingerCurl(
    tip: { x: number; y: number; z: number },
    pip: { x: number; y: number; z: number },
    mcp: { x: number; y: number; z: number },
    wrist: { x: number; y: number; z: number }
  ): number {
    const tipToWrist = LandmarkNormalizer.distance3D(tip, wrist);
    const pipToWrist = LandmarkNormalizer.distance3D(pip, wrist);
    const mcpToWrist = LandmarkNormalizer.distance3D(mcp, wrist);

    // If tip is closer to wrist than PIP joint, it is deeply curled
    if (tipToWrist < pipToWrist * 0.9) return 1.0;
    if (tipToWrist < mcpToWrist * 1.1) return 0.85;

    // Proportion extended vs curled
    const span = pipToWrist - mcpToWrist;
    if (span <= 0) return 0.5;

    const extension = (tipToWrist - pipToWrist) / span;
    return Math.max(0, Math.min(1, 1 - extension));
  }

  private static calculateThumbCurl(landmarks: HandLandmarks, palmSize: number): number {
    const thumbTip = landmarks[HAND_LANDMARK.THUMB_TIP];
    const indexMcp = landmarks[HAND_LANDMARK.INDEX_FINGER_MCP];
    const distToPalm = LandmarkNormalizer.getPalmRelativeDistance(thumbTip, indexMcp, palmSize);
    return distToPalm < 0.5 ? 0.8 : 0.2;
  }

  public static createEmptyMetrics(): GestureMetrics {
    return {
      rawPinchDistance: 1.0,
      pinchStrength: 0,
      handCenter: { x: 0, y: 0, z: 0 },
      palmSize: 0.15,
      fingerCurls: [0, 0, 0, 0, 0],
      confidence: 0,
    };
  }
}
