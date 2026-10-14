import type {
  HandLandmarker,
  HandLandmarkerResult,
} from '@mediapipe/tasks-vision';

const MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task';
const WASM_CDN_URL = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.21/wasm';

export interface HandLandmarkerConfig {
  detectionConfidence?: number;
  trackingConfidence?: number;
  numHands?: number;
}

export class HandLandmarkerService {
  private handLandmarker: HandLandmarker | null = null;
  private isInitializing = false;
  private isReady = false;
  private initError: string | null = null;
  private delegate: 'GPU' | 'CPU' = 'GPU';
  private isOfflineFallback = false;

  public async initialize(config: HandLandmarkerConfig = {}): Promise<void> {
    if (this.isReady && this.handLandmarker) return;
    if (this.isInitializing) return;

    this.isInitializing = true;
    this.initError = null;
    this.isOfflineFallback = false;

    const detectionConf = config.detectionConfidence ?? 0.45;
    const trackingConf = config.trackingConfidence ?? 0.40;
    const numHands = config.numHands ?? 2;

    const maxRetries = 2;
    let attempt = 0;

    while (attempt <= maxRetries) {
      try {
        // Dynamically import MediaPipe Tasks Vision on-demand to preserve light bundle size
        const { FilesetResolver, HandLandmarker } = await import('@mediapipe/tasks-vision');

        // 1. Resolve MediaPipe Vision WASM fileset
        const vision = await FilesetResolver.forVisionTasks(WASM_CDN_URL);

        // 2. Attempt GPU delegate first for high FPS, fall back to CPU if unsupported
        let landmarker: HandLandmarker | null = null;
        let usedDelegate: 'GPU' | 'CPU' = 'GPU';

        try {
          landmarker = await HandLandmarker.createFromOptions(vision, {
            baseOptions: {
              modelAssetPath: MODEL_URL,
              delegate: 'GPU',
            },
            runningMode: 'VIDEO',
            numHands,
            minHandDetectionConfidence: detectionConf,
            minHandPresenceConfidence: detectionConf,
            minTrackingConfidence: trackingConf,
          });
        } catch (gpuErr) {
          console.warn('GPU delegate unavailable for HandLandmarker, falling back to CPU:', gpuErr);
          usedDelegate = 'CPU';
          landmarker = await HandLandmarker.createFromOptions(vision, {
            baseOptions: {
              modelAssetPath: MODEL_URL,
              delegate: 'CPU',
            },
            runningMode: 'VIDEO',
            numHands,
            minHandDetectionConfidence: detectionConf,
            minHandPresenceConfidence: detectionConf,
            minTrackingConfidence: trackingConf,
          });
        }

        this.handLandmarker = landmarker;
        this.delegate = usedDelegate;
        this.isReady = true;
        this.isInitializing = false;
        return;
      } catch (err: unknown) {
        attempt++;
        const error = err as Error;
        const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;

        if (attempt <= maxRetries && !isOffline) {
          // Bounded backoff retry
          await new Promise((res) => setTimeout(res, attempt * 600));
        } else {
          this.isInitializing = false;
          this.isReady = false;
          this.isOfflineFallback = true;
          this.initError = isOffline
            ? 'Network offline. Hand tracking model cannot be downloaded. Manual keyboard/mouse controls active.'
            : error.message || 'Failed to load MediaPipe Vision model from CDN. Manual controls remain fully active.';
          throw new Error(this.initError);
        }
      }
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

  public getDelegate(): 'GPU' | 'CPU' {
    return this.delegate;
  }

  public isFallbackMode(): boolean {
    return this.isOfflineFallback;
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
