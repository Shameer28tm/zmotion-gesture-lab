import type { CameraStatus } from '../types';

export type CameraStatusListener = (status: CameraStatus, error?: string) => void;

export class CameraManager {
  private videoElement: HTMLVideoElement | null = null;
  private stream: MediaStream | null = null;
  private status: CameraStatus = 'idle';
  private listeners: Set<CameraStatusListener> = new Set();
  private lastErrorMessage: string | null = null;
  private attachedContainer: HTMLElement | null = null;

  constructor() {
    this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', this.handleVisibilityChange);
    }
  }

  public getStatus(): CameraStatus {
    return this.status;
  }

  public getErrorMessage(): string | null {
    return this.lastErrorMessage;
  }

  public getVideoElement(): HTMLVideoElement | null {
    return this.videoElement;
  }

  public getStream(): MediaStream | null {
    return this.stream;
  }

  public isActive(): boolean {
    return this.status === 'streaming' && !!this.stream && this.stream.active;
  }

  public attachToContainer(container: HTMLElement): void {
    this.attachedContainer = container;
    if (this.videoElement && container) {
      if (this.videoElement.parentElement !== container) {
        container.appendChild(this.videoElement);
      }
      // Guarantee video continues playing across route transitions
      if (this.videoElement.paused) {
        this.videoElement.play().catch((err) => {
          console.warn('Video resume on attach failed:', err);
        });
      }
    }
  }

  public detachFromContainer(container?: HTMLElement): void {
    if (!container || this.attachedContainer === container) {
      if (this.videoElement && this.videoElement.parentElement) {
        try {
          this.videoElement.parentElement.removeChild(this.videoElement);
        } catch {
          // Ignore if already detached
        }
      }
      this.attachedContainer = null;
    }
  }

  public ensureActivePlayback(): void {
    if (this.videoElement && this.isActive() && this.videoElement.paused) {
      this.videoElement.play().catch(() => {});
    }
  }

  public onStatusChange(listener: CameraStatusListener): () => void {
    this.listeners.add(listener);
    listener(this.status, this.lastErrorMessage ?? undefined);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private setStatus(status: CameraStatus, error?: string): void {
    this.status = status;
    this.lastErrorMessage = error ?? null;
    this.listeners.forEach((listener) => listener(status, error));
  }

  public async start(customVideoElement?: HTMLVideoElement): Promise<HTMLVideoElement> {
    if (this.isActive() && this.videoElement) {
      return this.videoElement;
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      const err = 'Webcam access is not supported by your browser or environment.';
      this.setStatus('not_found', err);
      throw new Error(err);
    }

    this.setStatus('requesting');

    try {
      // Create video element if not provided
      if (!this.videoElement) {
        this.videoElement = customVideoElement ?? document.createElement('video');
        this.videoElement.className = 'live-camera-feed';
        this.videoElement.setAttribute('playsinline', 'true');
        this.videoElement.setAttribute('autoplay', 'true');
        this.videoElement.muted = true;
      } else if (customVideoElement && this.videoElement !== customVideoElement) {
        this.videoElement = customVideoElement;
      }
      this.videoElement.className = 'live-camera-feed';

      const constraints: MediaStreamConstraints = {
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user',
          frameRate: { ideal: 30, max: 60 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      this.stream = stream;
      this.videoElement.srcObject = stream;

      // Attach to active container if registered
      if (this.attachedContainer && this.videoElement.parentElement !== this.attachedContainer) {
        this.attachedContainer.appendChild(this.videoElement);
      }

      // Wait for video metadata to load and video to start playing
      await new Promise<void>((resolve, reject) => {
        if (!this.videoElement) return reject(new Error('Video element missing'));
        
        const onLoaded = () => {
          this.videoElement?.removeEventListener('loadeddata', onLoaded);
          this.videoElement?.play().then(() => resolve()).catch(reject);
        };

        if (this.videoElement.readyState >= 2) {
          this.videoElement.play().then(() => resolve()).catch(reject);
        } else {
          this.videoElement.addEventListener('loadeddata', onLoaded);
        }
      });

      this.setStatus('streaming');
      return this.videoElement;
    } catch (err: unknown) {
      const error = err as Error;
      let status: CameraStatus = 'error';

      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        status = 'permission_denied';
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        status = 'not_found';
      }

      const message = error.message || 'Failed to acquire webcam stream';
      this.setStatus(status, message);
      this.cleanup();
      throw error;
    }
  }

  public stop(): void {
    this.cleanup();
    this.setStatus('stopped');
  }

  private cleanup(): void {
    if (this.stream) {
      this.stream.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {
          // Ignore track stop exceptions
        }
      });
      this.stream = null;
    }

    if (this.videoElement) {
      try {
        this.videoElement.pause();
        this.videoElement.srcObject = null;
        if (this.videoElement.parentElement) {
          this.videoElement.parentElement.removeChild(this.videoElement);
        }
      } catch {
        // Ignore video pause exceptions
      }
    }
  }

  private handleVisibilityChange(): void {
    if (typeof document === 'undefined') return;
    if (document.visibilityState === 'hidden' && this.isActive()) {
      // Pause tracks to conserve system resources
      this.stream?.getVideoTracks().forEach((track) => {
        track.enabled = false;
      });
    } else if (document.visibilityState === 'visible' && this.isActive()) {
      this.stream?.getVideoTracks().forEach((track) => {
        track.enabled = true;
      });
    }
  }

  public dispose(): void {
    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    }
    this.cleanup();
    this.listeners.clear();
    this.videoElement = null;
    this.status = 'idle';
  }
}
