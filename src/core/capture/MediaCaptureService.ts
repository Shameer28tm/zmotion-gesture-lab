/**
 * ZMotion Privacy-First Media Capture Service
 * 100% In-Memory Client-Side Photo and Video Capture
 * Never transmits or stores images/video outside the user's browser.
 */

export class MediaCaptureService {
  private static instance: MediaCaptureService | null = null;

  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  private recordingCanvas: HTMLCanvasElement | null = null;
  private recordingIntervalId: number | null = null;
  private recordingTimerId: number | null = null;
  private recordingSeconds = 0;
  private isRecording = false;

  public static getInstance(): MediaCaptureService {
    if (!MediaCaptureService.instance) {
      MediaCaptureService.instance = new MediaCaptureService();
    }
    return MediaCaptureService.instance;
  }

  /**
   * Captures a high-resolution snapshot combining the mirrored webcam video
   * and the transparent Three.js WebGL canvas.
   */
  public async capturePhoto(
    video: HTMLVideoElement | null,
    canvas: HTMLCanvasElement | null
  ): Promise<string> {
    const width = canvas?.clientWidth || video?.videoWidth || 1280;
    const height = canvas?.clientHeight || video?.videoHeight || 720;

    const offscreen = document.createElement('canvas');
    offscreen.width = width;
    offscreen.height = height;
    const ctx = offscreen.getContext('2d');

    if (!ctx) {
      throw new Error('Could not create 2D canvas context for photo capture');
    }

    // 1. Draw live camera backdrop with horizontal mirror correction
    if (video && video.readyState >= 2) {
      ctx.save();
      ctx.translate(width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0, width, height);
      ctx.restore();
    } else {
      // Void cyber backdrop fallback if camera is offline
      ctx.fillStyle = '#05070d';
      ctx.fillRect(0, 0, width, height);
    }

    // 2. Composite the Three.js WebGL scene directly on top
    if (canvas) {
      ctx.drawImage(canvas, 0, 0, width, height);
    }

    // 3. Generate in-memory PNG blob URL
    return new Promise((resolve, reject) => {
      offscreen.toBlob(
        (blob) => {
          if (!blob) {
            return reject(new Error('Canvas blob generation failed'));
          }
          const blobUrl = URL.createObjectURL(blob);
          resolve(blobUrl);
        },
        'image/png',
        0.95
      );
    });
  }

  /**
   * Starts video recording using MediaRecorder on a composite 30 FPS canvas.
   */
  public startVideoRecording(
    video: HTMLVideoElement | null,
    canvas: HTMLCanvasElement | null,
    onTick?: (seconds: number) => void
  ): boolean {
    if (this.isRecording) return false;
    if (typeof MediaRecorder === 'undefined') {
      throw new Error('MediaRecorder API is not supported in this browser.');
    }

    const width = canvas?.clientWidth || 1280;
    const height = canvas?.clientHeight || 720;

    const recordCanvas = document.createElement('canvas');
    recordCanvas.width = width;
    recordCanvas.height = height;
    const ctx = recordCanvas.getContext('2d');
    if (!ctx) return false;

    this.recordingCanvas = recordCanvas;
    this.recordedChunks = [];
    this.recordingSeconds = 0;

    // Detect optimal supported mimeType
    const mimeTypes = [
      'video/webm;codecs=vp9',
      'video/webm;codecs=vp8',
      'video/webm',
      'video/mp4',
    ];
    let selectedMime = '';
    for (const mime of mimeTypes) {
      if (MediaRecorder.isTypeSupported(mime)) {
        selectedMime = mime;
        break;
      }
    }

    if (!selectedMime) {
      throw new Error('No supported video MIME type found for MediaRecorder.');
    }

    // Capture 30 FPS stream from composite canvas
    const stream = recordCanvas.captureStream(30);
    this.mediaRecorder = new MediaRecorder(stream, { mimeType: selectedMime });

    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        this.recordedChunks.push(event.data);
      }
    };

    // Composite render loop at ~30 FPS (33ms)
    this.recordingIntervalId = window.setInterval(() => {
      if (!this.recordingCanvas || !ctx) return;

      // Draw mirrored webcam
      if (video && video.readyState >= 2) {
        ctx.save();
        ctx.translate(width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(video, 0, 0, width, height);
        ctx.restore();
      } else {
        ctx.fillStyle = '#05070d';
        ctx.fillRect(0, 0, width, height);
      }

      // Draw 3D scene
      if (canvas) {
        ctx.drawImage(canvas, 0, 0, width, height);
      }
    }, 33);

    // Recording duration timer
    this.recordingTimerId = window.setInterval(() => {
      this.recordingSeconds++;
      onTick?.(this.recordingSeconds);
      // Auto-cap recording at 60 seconds to prevent memory overflow
      if (this.recordingSeconds >= 60) {
        this.stopVideoRecording();
      }
    }, 1000);

    this.mediaRecorder.start(250); // Slice data every 250ms
    this.isRecording = true;
    return true;
  }

  /**
   * Stops video recording and returns an in-memory blob URL.
   */
  public async stopVideoRecording(): Promise<string> {
    if (!this.isRecording || !this.mediaRecorder) {
      throw new Error('No active video recording to stop');
    }

    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) return reject(new Error('Recorder missing'));

      this.mediaRecorder.onstop = () => {
        this.cleanupRecording();
        if (this.recordedChunks.length === 0) {
          return reject(new Error('No video data chunks were recorded'));
        }
        const mimeType = this.recordedChunks[0]?.type || 'video/webm';
        const blob = new Blob(this.recordedChunks, { type: mimeType });
        const videoUrl = URL.createObjectURL(blob);
        resolve(videoUrl);
      };

      try {
        this.mediaRecorder.stop();
      } catch (err) {
        this.cleanupRecording();
        reject(err);
      }
    });
  }

  public getIsRecording(): boolean {
    return this.isRecording;
  }

  public getDurationSeconds(): number {
    return this.recordingSeconds;
  }

  private cleanupRecording(): void {
    if (this.recordingIntervalId !== null) {
      clearInterval(this.recordingIntervalId);
      this.recordingIntervalId = null;
    }
    if (this.recordingTimerId !== null) {
      clearInterval(this.recordingTimerId);
      this.recordingTimerId = null;
    }
    this.isRecording = false;
    this.recordingCanvas = null;
  }

  /**
   * Triggers an explicit user download with a safe filename.
   */
  public downloadMedia(blobUrl: string, filename: string): void {
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  /**
   * Releases in-memory object URL to prevent memory leaks.
   */
  public revokeMedia(blobUrl: string): void {
    if (blobUrl && blobUrl.startsWith('blob:')) {
      URL.revokeObjectURL(blobUrl);
    }
  }
}
