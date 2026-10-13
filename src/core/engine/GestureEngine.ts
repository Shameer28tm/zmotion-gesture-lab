import { CameraManager } from '../camera/CameraManager';
import { HandLandmarkerService } from '../vision/HandLandmarkerService';
import { GestureClassifier } from '../gestures/GestureClassifier';
import { GestureSmoother } from '../gestures/GestureSmoother';
import {
  DEFAULT_ENGINE_CONFIG,
  type CameraStatus,
  type GestureEngineConfig,
  type GestureState,
  type GestureType,
  type HandLandmarks,
} from '../types';

export type GestureFrameListener = (
  state: GestureState,
  rawLandmarks: HandLandmarks | null
) => void;

export type GestureStateListener = (state: GestureState) => void;
export type FistTriggerListener = () => void;

export class GestureEngine {
  private static instance: GestureEngine | null = null;

  private cameraManager: CameraManager;
  private landmarkerService: HandLandmarkerService;
  private smoother: GestureSmoother;
  private config: GestureEngineConfig;

  private isRunning = false;
  private animationFrameId: number | null = null;

  private currentState: GestureState;
  private previousReportedGesture: GestureType = 'NONE';
  private previousHandDetected: boolean = false;

  private frameListeners: Set<GestureFrameListener> = new Set();
  private stateListeners: Set<GestureStateListener> = new Set();
  private fistListeners: Set<FistTriggerListener> = new Set();

  public constructor(config: GestureEngineConfig = DEFAULT_ENGINE_CONFIG) {
    this.config = { ...config };
    this.cameraManager = new CameraManager();
    this.landmarkerService = new HandLandmarkerService();
    this.smoother = new GestureSmoother(this.config);

    this.currentState = {
      activeGesture: 'NONE',
      metrics: GestureClassifier.createEmptyMetrics(),
      handDetected: false,
      handedness: 'Unknown',
    };

    this.processLoop = this.processLoop.bind(this);
  }

  public static getInstance(): GestureEngine {
    if (!GestureEngine.instance) {
      GestureEngine.instance = new GestureEngine();
    }
    return GestureEngine.instance;
  }

  public getConfig(): GestureEngineConfig {
    return { ...this.config };
  }

  public setConfig(update: Partial<GestureEngineConfig>): void {
    this.config = { ...this.config, ...update };
    this.smoother.updateConfig(this.config);
  }

  public getStatus(): CameraStatus {
    return this.cameraManager.getStatus();
  }

  public getState(): GestureState {
    return { ...this.currentState };
  }

  public getVideoElement(): HTMLVideoElement | null {
    return this.cameraManager.getVideoElement();
  }

  public onCameraStatusChange(listener: (status: CameraStatus, error?: string) => void): () => void {
    return this.cameraManager.onStatusChange(listener);
  }

  /**
   * High-frequency listener: runs per animation frame for 3D render loops.
   * Does NOT trigger React state updates.
   */
  public onFrame(listener: GestureFrameListener): () => void {
    this.frameListeners.add(listener);
    return () => {
      this.frameListeners.delete(listener);
    };
  }

  /**
   * Low-frequency listener: fires only when stable gesture or hand presence changes.
   * Safe for React state hooks.
   */
  public onStateChange(listener: GestureStateListener): () => void {
    this.stateListeners.add(listener);
    listener(this.currentState);
    return () => {
      this.stateListeners.delete(listener);
    };
  }

  /**
   * Discrete event listener for debounced fist triggers (shape cycle or runner jump).
   */
  public onFistTrigger(listener: FistTriggerListener): () => void {
    this.fistListeners.add(listener);
    return () => {
      this.fistListeners.delete(listener);
    };
  }

  public async start(customVideo?: HTMLVideoElement): Promise<void> {
    if (this.isRunning) return;

    // 1. Initialize HandLandmarker if needed
    if (!this.landmarkerService.isInitialized()) {
      await this.landmarkerService.initialize();
    }

    // 2. Start Camera stream
    await this.cameraManager.start(customVideo);

    // 3. Start RAF loop
    this.isRunning = true;
    this.smoother.reset();
    this.animationFrameId = requestAnimationFrame(this.processLoop);
  }

  public stop(): void {
    this.isRunning = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    this.cameraManager.stop();
    this.smoother.reset();

    this.currentState = {
      activeGesture: 'NONE',
      metrics: GestureClassifier.createEmptyMetrics(),
      handDetected: false,
      handedness: 'Unknown',
    };
    this.notifyStateChange();
  }

  private processLoop(now: number): void {
    if (!this.isRunning) return;

    const video = this.cameraManager.getVideoElement();
    if (video && video.readyState >= 2) {
      const result = this.landmarkerService.detectForVideo(video, now);

      if (result && result.landmarks && result.landmarks.length > 0) {
        const rawLandmarks = result.landmarks[0] as HandLandmarks;
        const handedness =
          result.handedness && result.handedness[0] && result.handedness[0][0]
            ? (result.handedness[0][0].categoryName as 'Left' | 'Right')
            : 'Unknown';

        // 1. Classify raw gesture
        const { gesture: rawGesture, metrics: rawMetrics } = GestureClassifier.classify(
          rawLandmarks,
          this.config
        );

        // 2. Smooth continuous metrics and filter state transitions
        const { stableGesture, smoothedMetrics, fistTriggered } = this.smoother.process(
          rawGesture,
          rawMetrics,
          now
        );

        this.currentState = {
          activeGesture: stableGesture,
          metrics: smoothedMetrics,
          handDetected: true,
          handedness,
        };

        // Notify discrete fist trigger listeners if fired
        if (fistTriggered) {
          this.fistListeners.forEach((listener) => {
            try {
              listener();
            } catch (err) {
              console.error('Error in fist trigger listener:', err);
            }
          });
        }

        // Notify 3D frame listeners with smoothed metrics
        this.frameListeners.forEach((listener) => {
          try {
            listener(this.currentState, rawLandmarks);
          } catch (err) {
            console.error('Error in frame listener:', err);
          }
        });
      } else {
        // Hand not in view
        const { stableGesture, smoothedMetrics } = this.smoother.process(
          'NONE',
          GestureClassifier.createEmptyMetrics(),
          now
        );

        this.currentState = {
          activeGesture: stableGesture,
          metrics: smoothedMetrics,
          handDetected: false,
          handedness: 'Unknown',
        };

        this.frameListeners.forEach((listener) => {
          try {
            listener(this.currentState, null);
          } catch (err) {
            console.error('Error in frame listener:', err);
          }
        });
      }

      // Check for low-frequency state changes to notify React
      if (
        this.currentState.activeGesture !== this.previousReportedGesture ||
        this.currentState.handDetected !== this.previousHandDetected
      ) {
        this.previousReportedGesture = this.currentState.activeGesture;
        this.previousHandDetected = this.currentState.handDetected;
        this.notifyStateChange();
      }
    }

    this.animationFrameId = requestAnimationFrame(this.processLoop);
  }

  private notifyStateChange(): void {
    const stateCopy = { ...this.currentState };
    this.stateListeners.forEach((listener) => {
      try {
        listener(stateCopy);
      } catch (err) {
        console.error('Error in state listener:', err);
      }
    });
  }

  public dispose(): void {
    this.stop();
    this.cameraManager.dispose();
    this.landmarkerService.dispose();
    this.frameListeners.clear();
    this.stateListeners.clear();
    this.fistListeners.clear();
    GestureEngine.instance = null;
  }
}
