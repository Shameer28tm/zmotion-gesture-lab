import { CameraManager } from '../camera/CameraManager';
import { HandLandmarkerService } from '../vision/HandLandmarkerService';
import { GestureClassifier } from '../gestures/GestureClassifier';
import { GestureSmoother } from '../gestures/GestureSmoother';
import {
  DEFAULT_ENGINE_CONFIG,
  type CameraStatus,
  type EngineDiagnostics,
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
export type PointingTriggerListener = () => void;
export type DiagnosticsListener = (diagnostics: EngineDiagnostics) => void;

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
  private pointingListeners: Set<PointingTriggerListener> = new Set();
  private diagnosticsListeners: Set<DiagnosticsListener> = new Set();

  // Inference optimization & telemetry tracking
  private lastInferenceTime = 0;
  private lastVideoTime = -1;
  private lastRawLandmarks: HandLandmarks | null = null;
  private inferenceFrameCount = 0;
  private lastFpsCalcTime = performance.now();
  private currentInferenceFps = 0;

  private diagnostics: EngineDiagnostics = {
    inferenceDurationMs: 0,
    inferenceFps: 0,
    cameraFps: 0,
    trackingConfidence: 0,
    handDetected: false,
    activeGesture: 'NONE',
    modelReady: false,
    delegate: 'GPU',
    isOfflineFallback: false,
  };

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

  public getDiagnostics(): EngineDiagnostics {
    return {
      ...this.diagnostics,
      modelReady: this.landmarkerService.isInitialized(),
      delegate: this.landmarkerService.getDelegate(),
      isOfflineFallback: this.landmarkerService.isFallbackMode(),
    };
  }

  public getVideoElement(): HTMLVideoElement | null {
    return this.cameraManager.getVideoElement();
  }

  public onCameraStatusChange(listener: (status: CameraStatus, error?: string) => void): () => void {
    return this.cameraManager.onStatusChange(listener);
  }

  public onDiagnostics(listener: DiagnosticsListener): () => void {
    this.diagnosticsListeners.add(listener);
    listener(this.getDiagnostics());
    return () => {
      this.diagnosticsListeners.delete(listener);
    };
  }

  /**
   * High-frequency listener: runs per animation frame for 3D render loops.
   * Decoupled from inference rate to keep rendering at full display Hz.
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

  public onFistTrigger(listener: FistTriggerListener): () => void {
    this.fistListeners.add(listener);
    return () => {
      this.fistListeners.delete(listener);
    };
  }

  public onPointingTrigger(listener: PointingTriggerListener): () => void {
    this.pointingListeners.add(listener);
    return () => {
      this.pointingListeners.delete(listener);
    };
  }

  public attachCameraToContainer(container: HTMLElement): void {
    this.cameraManager.attachToContainer(container);
  }

  public detachCameraFromContainer(container?: HTMLElement): void {
    this.cameraManager.detachFromContainer(container);
  }

  /**
   * High-efficiency parallel startup:
   * Acquires camera stream and downloads/initializes vision model concurrently.
   */
  public async start(customVideo?: HTMLVideoElement): Promise<void> {
    if (this.isRunning) return;

    // 1. Concurrently initialize HandLandmarker and request Camera stream
    const modelPromise = !this.landmarkerService.isInitialized()
      ? this.landmarkerService.initialize({
          detectionConfidence: this.config.detectionConfidence,
          trackingConfidence: this.config.trackingConfidence,
        })
      : Promise.resolve();

    const cameraPromise = this.cameraManager.start(customVideo);

    // Run both in parallel to minimize startup latency
    await Promise.all([modelPromise, cameraPromise]);

    // 2. Start high-performance decoupled loop
    this.isRunning = true;
    this.smoother.reset();
    this.lastInferenceTime = 0;
    this.lastVideoTime = -1;
    this.lastFpsCalcTime = performance.now();
    this.inferenceFrameCount = 0;
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
    this.lastRawLandmarks = null;
    this.notifyStateChange();
  }

  /**
   * High-Performance Process Loop:
   * Throttles inference to match video frame availability (~30 FPS),
   * preventing redundant computation while keeping 3D transforms smooth.
   */
  private processLoop(now: number): void {
    if (!this.isRunning) return;

    const video = this.cameraManager.getVideoElement();
    if (video && video.readyState >= 2) {
      const minInterval = 1000 / (this.config.maxInferenceFps || 30);
      const isNewFrame = video.currentTime !== this.lastVideoTime;
      const elapsedSinceInference = now - this.lastInferenceTime;

      // Only execute heavy MediaPipe inference when a fresh video frame has arrived
      // and minimum interval has elapsed
      if (isNewFrame && elapsedSinceInference >= minInterval) {
        const infStart = performance.now();
        const result = this.landmarkerService.detectForVideo(video, now);
        const infDuration = performance.now() - infStart;

        this.lastVideoTime = video.currentTime;
        this.lastInferenceTime = now;
        this.inferenceFrameCount++;

        // Calculate approximate inference FPS over 1-second rolling windows
        if (now - this.lastFpsCalcTime >= 1000) {
          this.currentInferenceFps = Math.round(
            (this.inferenceFrameCount * 1000) / (now - this.lastFpsCalcTime)
          );
          this.inferenceFrameCount = 0;
          this.lastFpsCalcTime = now;
        }

        if (result && result.landmarks && result.landmarks.length > 0) {
          const rawLandmarks = result.landmarks[0] as HandLandmarks;
          this.lastRawLandmarks = rawLandmarks;
          const handedness =
            result.handedness && result.handedness[0] && result.handedness[0][0]
              ? (result.handedness[0][0].categoryName as 'Left' | 'Right')
              : 'Unknown';

          // 1. Classify raw gesture
          const { gesture: rawGesture, metrics: rawMetrics } = GestureClassifier.classify(
            rawLandmarks,
            this.config
          );

          // 2. Adaptive velocity-aware smoothing
          const { stableGesture, smoothedMetrics, fistTriggered, pointingTriggered } =
            this.smoother.process(rawGesture, rawMetrics, now);

          this.currentState = {
            activeGesture: stableGesture,
            metrics: smoothedMetrics,
            handDetected: true,
            handedness,
          };

          // Update diagnostics
          this.diagnostics = {
            inferenceDurationMs: Math.round(infDuration),
            inferenceFps: this.currentInferenceFps || 30,
            cameraFps: 30,
            trackingConfidence: Number((smoothedMetrics.confidence || 0.95).toFixed(2)),
            handDetected: true,
            activeGesture: stableGesture,
            modelReady: true,
            delegate: this.landmarkerService.getDelegate(),
            isOfflineFallback: this.landmarkerService.isFallbackMode(),
          };

          // Trigger discrete fist callbacks
          if (fistTriggered) {
            this.fistListeners.forEach((listener) => {
              try {
                listener();
              } catch (err) {
                console.error('Error in fist trigger listener:', err);
              }
            });
          }

          // Trigger discrete pointing callbacks
          if (pointingTriggered) {
            this.pointingListeners.forEach((listener) => {
              try {
                listener();
              } catch (err) {
                console.error('Error in pointing trigger listener:', err);
              }
            });
          }
        } else {
          // Hand not in view
          this.lastRawLandmarks = null;
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

          this.diagnostics = {
            inferenceDurationMs: Math.round(infDuration),
            inferenceFps: this.currentInferenceFps || 30,
            cameraFps: 30,
            trackingConfidence: 0,
            handDetected: false,
            activeGesture: 'NONE',
            modelReady: true,
            delegate: this.landmarkerService.getDelegate(),
            isOfflineFallback: this.landmarkerService.isFallbackMode(),
          };
        }

        // Notify low-frequency React state listeners only on meaningful transitions
        if (
          this.currentState.activeGesture !== this.previousReportedGesture ||
          this.currentState.handDetected !== this.previousHandDetected
        ) {
          this.previousReportedGesture = this.currentState.activeGesture;
          this.previousHandDetected = this.currentState.handDetected;
          this.notifyStateChange();
        }

        // Broadcast telemetry diagnostics if listeners are registered
        if (this.diagnosticsListeners.size > 0) {
          const diagCopy = { ...this.diagnostics };
          this.diagnosticsListeners.forEach((listener) => {
            try {
              listener(diagCopy);
            } catch (err) {
              console.error('Error in diagnostics listener:', err);
            }
          });
        }
      }

      // Always deliver smoothed 3D frame updates to renderers on every RAF tick
      this.frameListeners.forEach((listener) => {
        try {
          listener(this.currentState, this.lastRawLandmarks);
        } catch (err) {
          console.error('Error in frame listener:', err);
        }
      });
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
    this.pointingListeners.clear();
    this.diagnosticsListeners.clear();
    GestureEngine.instance = null;
  }
}
