# Privacy Policy & Data Architecture

> **Privacy Statement for ZMotion — Gesture Lab**  
> Effective Date: October 2026

ZMotion is engineered with a strict **Privacy-First, Client-Side Only** architecture.

---

## 1. Camera & Video Stream Processing

1. **Local Media Stream**: When you grant camera permissions, `navigator.mediaDevices.getUserMedia` streams frames directly from your hardware sensor into a local HTML `<video>` element in your browser's memory.
2. **Zero Video Uploads**: Video frames are analyzed locally using Google's `@mediapipe/tasks-vision` WebAssembly pipeline.
3. **No Biometric Data Stored**: The vision model calculates 21 normalized 3D hand coordinates. These points represent relative spatial landmarks (e.g. wrist, finger joints). They are processed transiently in volatile RAM for spatial physics and are discarded on every frame. No facial, biometric, or personal identity profiles are extracted or retained.

---

## 2. In-Memory Photo & Video Capture

1. **Composite Generation**: Photos and video recordings are composited in volatile RAM on an offscreen HTML5 `<canvas>`.
2. **Local Blob URLs**: Captures are converted to in-memory `blob:` URLs (`blob:http://localhost:...` or `blob:https://...`).
3. **Direct File Download**: When you click **Download**, the file is transferred directly from your browser's RAM to your computer's local downloads folder using the standard HTML5 `download` attribute.
4. **Immediate Deallocation**: Closing the capture preview modal immediately calls `URL.revokeObjectURL()` to release RAM. Captured media is never transmitted to any cloud bucket or API.

---

## 3. Browser Storage & State Persistence

ZMotion uses your browser's `localStorage` for exactly one non-identifying metric:
- **`zmotion_runner_highscore`**: Stores your highest score achieved in the Gesture Runner game.
- No tracking cookies, advertising IDs, or session tracking tokens are ever written to browser storage.

---

## 4. External Network Requests

To be completely transparent, the application makes the following external network requests during initial load:
1. **Google Fonts CDN (`fonts.googleapis.com` / `fonts.gstatic.com`)**: Fetches typeface files (`Inter`, `Outfit`, `JetBrains Mono`).
2. **MediaPipe Model Assets (`cdn.jsdelivr.net` / `storage.googleapis.com`)**: Fetches the pre-trained `hand_landmarker.task` weights and WebAssembly runtime binaries on first load. Once fetched, these assets are cached locally by your browser.

No telemetry, analytics, user telemetry beacons, or tracking pixels exist in the codebase.
