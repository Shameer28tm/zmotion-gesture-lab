import { describe, it, expect } from 'vitest';
import {
  HAND_CONNECTIONS,
  mapLandmarkToCanvas,
} from '../core/vision/HandSkeletonRenderer';

describe('Hand Skeleton Landmark & Coordinate Mapping Tests (Task 2)', () => {
  it('defines canonical MediaPipe hand skeleton connections (21 points)', () => {
    // MediaPipe Hand Landmarker canonical connections
    expect(HAND_CONNECTIONS.length).toBe(21);

    // Verify palm knuckle connections
    expect(HAND_CONNECTIONS).toContainEqual([5, 9]);
    expect(HAND_CONNECTIONS).toContainEqual([9, 13]);
    expect(HAND_CONNECTIONS).toContainEqual([13, 17]);

    // Verify finger chains
    // Thumb
    expect(HAND_CONNECTIONS).toContainEqual([0, 1]);
    expect(HAND_CONNECTIONS).toContainEqual([1, 2]);
    expect(HAND_CONNECTIONS).toContainEqual([2, 3]);
    expect(HAND_CONNECTIONS).toContainEqual([3, 4]);

    // Index
    expect(HAND_CONNECTIONS).toContainEqual([0, 5]);
    expect(HAND_CONNECTIONS).toContainEqual([5, 6]);
    expect(HAND_CONNECTIONS).toContainEqual([6, 7]);
    expect(HAND_CONNECTIONS).toContainEqual([7, 8]);

    // Middle
    expect(HAND_CONNECTIONS).toContainEqual([9, 10]);
    expect(HAND_CONNECTIONS).toContainEqual([10, 11]);
    expect(HAND_CONNECTIONS).toContainEqual([11, 12]);

    // Ring
    expect(HAND_CONNECTIONS).toContainEqual([13, 14]);
    expect(HAND_CONNECTIONS).toContainEqual([14, 15]);
    expect(HAND_CONNECTIONS).toContainEqual([15, 16]);

    // Pinky
    expect(HAND_CONNECTIONS).toContainEqual([0, 17]);
    expect(HAND_CONNECTIONS).toContainEqual([17, 18]);
    expect(HAND_CONNECTIONS).toContainEqual([18, 19]);
    expect(HAND_CONNECTIONS).toContainEqual([19, 20]);
  });

  it('mirrors horizontal X coordinate to align with CSS transform: scaleX(-1)', () => {
    // Landmark at left side of camera sensor (x = 0.2) should map to right side of screen (0.8)
    const containerW = 640;
    const containerH = 480;
    const videoW = 640;
    const videoH = 480;

    const leftSensorPoint = { x: 0.2, y: 0.5, z: 0 };
    const mappedLeft = mapLandmarkToCanvas(leftSensorPoint, containerW, containerH, videoW, videoH);

    // Mirrored X = (1 - 0.2) * 640 = 0.8 * 640 = 512
    expect(mappedLeft.x).toBeCloseTo(512, 1);
    expect(mappedLeft.y).toBeCloseTo(240, 1);

    const rightSensorPoint = { x: 0.8, y: 0.5, z: 0 };
    const mappedRight = mapLandmarkToCanvas(rightSensorPoint, containerW, containerH, videoW, videoH);

    // Mirrored X = (1 - 0.8) * 640 = 0.2 * 640 = 128
    expect(mappedRight.x).toBeCloseTo(128, 1);
  });

  it('handles object-fit: cover scaling on mobile portrait screen (e.g. 390x844)', () => {
    const containerW = 390;
    const containerH = 844;
    const videoW = 640;
    const videoH = 480;

    // Center point of video (x = 0.5, y = 0.5)
    const centerPoint = { x: 0.5, y: 0.5, z: 0 };
    const mappedCenter = mapLandmarkToCanvas(centerPoint, containerW, containerH, videoW, videoH);

    // The center of video should map exactly to center of the portrait screen: 390 / 2 = 195, 844 / 2 = 422
    expect(mappedCenter.x).toBeCloseTo(195, 1);
    expect(mappedCenter.y).toBeCloseTo(422, 1);
  });

  it('handles wide desktop aspect ratio correctly (e.g. 1920x1080)', () => {
    const containerW = 1920;
    const containerH = 1080;
    const videoW = 640;
    const videoH = 480;

    const centerPoint = { x: 0.5, y: 0.5, z: 0 };
    const mappedCenter = mapLandmarkToCanvas(centerPoint, containerW, containerH, videoW, videoH);

    // Centered horizontally and vertically
    expect(mappedCenter.x).toBeCloseTo(1920 / 2, 1);
    expect(mappedCenter.y).toBeCloseTo(1080 / 2, 1);
  });
});
