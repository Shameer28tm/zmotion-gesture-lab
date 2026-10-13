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
    const rawPalmCenter = LandmarkNormalizer.getPalmCenter(landmarks);
    const rawCentered = LandmarkNormalizer.toMirroredCentered(rawPalmCenter);

    // Apply configurable dead zone and sensitivity scaling to handCenter
    const deadZone = config.deadZone ?? 0.04;
    const sensitivity = config.sensitivity ?? 1.2;
    const handCenter = LandmarkNormalizer.applyDeadZoneAndSensitivity(rawCentered, deadZone, sensitivity);

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

    // Disallow pinch if index finger itself is curled into palm (fist or resting hand on chin)
    const isIndexCurled = indexCurl > 0.58;
    const isFist = isIndexCurled && middleCurl > 0.65 && ringCurl > 0.65 && pinkyCurl > 0.65;

    let pinchStrength = 0;
    if (!isFist && !isIndexCurled) {
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
    }

    const confidence = Math.max(0.6, Math.min(0.99, (palmSize / 0.15) * 0.95));

    const metrics: GestureMetrics = {
      rawPinchDistance,
      pinchStrength,
      handCenter,
      palmSize,
      fingerCurls,
      confidence,
    };

    // 3. Gesture State Discrimination
    // A. Closed Fist: all 4 fingers curled
    // B. Pinch Gesture: thumb and index close together, index extended toward thumb
    const isPinching = pinchStrength > 0.55 && !isFist && !isIndexCurled;

    // C. Pointing: index finger extended, middle/ring/pinky curled, not pinching
    const isPointing =
      indexCurl < 0.35 &&
      middleCurl > 0.6 &&
      ringCurl > 0.6 &&
      pinkyCurl > 0.6 &&
      !isPinching &&
      !isFist;

    // D. Open Palm: all 4 fingers extended, not pinching
    const isOpenPalm =
      indexCurl < 0.38 &&
      middleCurl < 0.38 &&
      ringCurl < 0.38 &&
      pinkyCurl < 0.38 &&
      !isPinching &&
      !isFist;

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
