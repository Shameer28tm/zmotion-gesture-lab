import type {
  HandLandmarker,
  HandLandmarkerResult,
} from '@mediapipe/tasks-vision';

export class HandLandmarkerService {
  private handLandmarker: HandLandmarker | null = null;
  private isInitializing = false;
  private isReady = false;
  private initError: string | null = null;

  public async initialize(): Promise<void> {
    if (this.isReady && this.handLandmarker) return;
    if (this.isInitializing) return;

    this.isInitializing = true;
    this.initError = null;

    try {
      // Dynamically import MediaPipe Tasks Vision on-demand
      const { FilesetResolver, HandLandmarker } = await import('@mediapipe/tasks-vision');

      // 1. Resolve MediaPipe Vision WASM fileset
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.21/wasm'
      );

      // 2. Instantiate HandLandmarker with float16 task bundle
      this.handLandmarker = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
          delegate: 'GPU',
        },
        runningMode: 'VIDEO',
        numHands: 1,
        minHandDetectionConfidence: 0.5,
        minHandPresenceConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

      this.isReady = true;
    } catch (err: unknown) {
      const error = err as Error;
      this.initError =
        error.message ||
        'Failed to load MediaPipe HandLandmarker. Check network connection to Google Storage/jsDelivr.';
      this.isReady = false;
      throw new Error(this.initError);
    } finally {
      this.isInitializing = false;
    }
  }

  public detectForVideo(
    video: HTMLVideoElement,
    timestampMs: number
  ): HandLandmarkerResult | null {
    if (!this.handLandmarker || !this.isReady) {
      return null;
    }

    try {
      if (video.readyState < 2) return null;
      return this.handLandmarker.detectForVideo(video, timestampMs);
    } catch (err) {
      console.warn('Landmark detection frame dropped:', err);
      return null;
    }
  }

  public isInitialized(): boolean {
    return this.isReady;
  }

  public getError(): string | null {
    return this.initError;
  }

  public dispose(): void {
    if (this.handLandmarker) {
      try {
        this.handLandmarker.close();
      } catch {
        // ignore close error
      }
      this.handLandmarker = null;
    }
    this.isReady = false;
    this.isInitializing = false;
    this.initError = null;
  }
}
