import type { HandLandmarks, LandmarkPoint, GestureState } from '../types';

/**
 * Standard 21 MediaPipe Hand Landmark Canonical Connections
 * Pairs define anatomical links between joint indices.
 */
export const HAND_CONNECTIONS: [number, number][] = [
  // Thumb
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 4],
  // Index finger
  [0, 5],
  [5, 6],
  [6, 7],
  [7, 8],
  // Middle finger
  [9, 10],
  [10, 11],
  [11, 12],
  // Ring finger
  [13, 14],
  [14, 15],
  [15, 16],
  // Pinky finger
  [0, 17],
  [17, 18],
  [18, 19],
  [19, 20],
  // Palm base & knuckles
  [5, 9],
  [9, 13],
  [13, 17],
];

/**
 * Maps normalized [0, 1] MediaPipe landmark coordinates to screen pixel coordinates,
 * taking into account object-fit: cover scaling, centering offset, and horizontal mirroring (scaleX(-1)).
 */
export function mapLandmarkToCanvas(
  lm: LandmarkPoint,
  containerWidth: number,
  containerHeight: number,
  videoWidth = 640,
  videoHeight = 480
): { x: number; y: number } {
  const vw = videoWidth > 0 ? videoWidth : 640;
  const vh = videoHeight > 0 ? videoHeight : 480;

  // Compute object-fit: cover scale factor
  const scale = Math.max(containerWidth / vw, containerHeight / vh);
  const rw = vw * scale;
  const rh = vh * scale;

  // Center alignment offsets
  const ox = (containerWidth - rw) / 2;
  const oy = (containerHeight - rh) / 2;

  // Mirrored horizontal coordinate to align with camera CSS scaleX(-1)
  const mirroredX = 1 - lm.x;

  return {
    x: ox + mirroredX * rw,
    y: oy + lm.y * rh,
  };
}

export class HandSkeletonRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D | null;
  private dpr = 1;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    try {
      this.ctx = canvas.getContext('2d');
    } catch {
      this.ctx = null;
    }
  }

  public resize(width: number, height: number): void {
    if (width <= 0 || height <= 0) return;
    this.dpr = Math.min(typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1, 2);
    this.canvas.width = Math.round(width * this.dpr);
    this.canvas.height = Math.round(height * this.dpr);
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;
  }

  public clear(): void {
    if (!this.ctx) return;
    this.ctx.save();
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.restore();
  }

  public render(
    landmarks: HandLandmarks | null,
    containerWidth: number,
    containerHeight: number,
    videoWidth: number,
    videoHeight: number,
    gestureState?: GestureState
  ): void {
    if (!this.ctx) return;
    this.clear();

    if (!landmarks || landmarks.length < 21 || containerWidth <= 0 || containerHeight <= 0) {
      return;
    }

    const ctx = this.ctx;
    ctx.save();
    ctx.scale(this.dpr, this.dpr);

    // Map all 21 points to canvas space
    const mapped = landmarks.map((lm) =>
      mapLandmarkToCanvas(lm, containerWidth, containerHeight, videoWidth, videoHeight)
    );

    const isPinching =
      gestureState?.activeGesture === 'PINCH' ||
      (gestureState?.metrics ? gestureState.metrics.pinchStrength > 0.35 : false);

    // 1. Draw thin cyan/blue anatomical connecting lines
    ctx.lineWidth = 2.2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = 'rgba(0, 210, 255, 0.78)';
    ctx.shadowColor = '#00d2ff';
    ctx.shadowBlur = 8;

    ctx.beginPath();
    for (const [startIdx, endIdx] of HAND_CONNECTIONS) {
      const p1 = mapped[startIdx];
      const p2 = mapped[endIdx];
      if (p1 && p2) {
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
      }
    }
    ctx.stroke();

    // 2. Pinch connection highlight if engaged (Thumb tip 4 to Index tip 8)
    if (isPinching && mapped[4] && mapped[8]) {
      ctx.beginPath();
      ctx.lineWidth = 3.2;
      ctx.strokeStyle = '#00f5d4';
      ctx.shadowColor = '#00f5d4';
      ctx.shadowBlur = 12;
      ctx.moveTo(mapped[4].x, mapped[4].y);
      ctx.lineTo(mapped[8].x, mapped[8].y);
      ctx.stroke();

      // Pulsing pinch rings
      for (const idx of [4, 8]) {
        const pt = mapped[idx];
        if (!pt) continue;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 8, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(0, 245, 212, 0.85)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    }

    // 3. Small glowing landmark dots
    for (let i = 0; i < mapped.length; i++) {
      const pt = mapped[i];
      if (!pt) continue;

      const isTip = [4, 8, 12, 16, 20].includes(i);
      const isWrist = i === 0;

      ctx.beginPath();
      let radius = 3.5;
      let fillColor = '#ffffff';
      let strokeColor = 'rgba(0, 210, 255, 0.9)';

      if (isWrist) {
        radius = 5.0;
        fillColor = '#00d2ff';
        strokeColor = '#ffffff';
      } else if (isTip) {
        radius = isPinching && (i === 4 || i === 8) ? 5.5 : 4.5;
        fillColor = '#00f5d4';
        strokeColor = '#ffffff';
      }

      ctx.arc(pt.x, pt.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = fillColor;
      ctx.shadowColor = isTip ? '#00f5d4' : '#00d2ff';
      ctx.shadowBlur = 6;
      ctx.fill();
      ctx.lineWidth = 1.2;
      ctx.strokeStyle = strokeColor;
      ctx.stroke();
    }

    // 4. Restrained tracking indicator near the wrist
    const wrist = mapped[0];
    if (wrist) {
      const labelX = Math.max(10, Math.min(containerWidth - 110, wrist.x - 45));
      const labelY = Math.max(20, Math.min(containerHeight - 10, wrist.y + 24));

      ctx.shadowBlur = 0;
      ctx.fillStyle = 'rgba(5, 7, 13, 0.8)';
      ctx.strokeStyle = 'rgba(0, 210, 255, 0.35)';
      ctx.lineWidth = 1;

      const text =
        gestureState?.activeGesture && gestureState.activeGesture !== 'NONE'
          ? `● ${gestureState.activeGesture}`
          : '● 21 LANDMARKS';
      ctx.font = '10px "JetBrains Mono", monospace';
      const textMetrics = ctx.measureText(text);
      const bgWidth = textMetrics.width + 12;
      const bgHeight = 18;

      ctx.beginPath();
      if (typeof ctx.roundRect === 'function') {
        ctx.roundRect(labelX, labelY - 12, bgWidth, bgHeight, 4);
      } else {
        ctx.rect(labelX, labelY - 12, bgWidth, bgHeight);
      }
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = isPinching ? '#00f5d4' : 'var(--electric-cyan, #00d2ff)';
      ctx.fillText(text, labelX + 6, labelY + 1);
    }

    ctx.restore();
  }
}
