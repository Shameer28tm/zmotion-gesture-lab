# Engineering Architecture & System Design

> **ZMotion — Gesture Lab**  
> High-performance client-side spatial computing and real-time computer vision platform.

For the visual topology diagram, see [System Architecture Diagram](./diagrams/system-architecture.md).

---

## 1. Core Architecture Principles

1. **100% In-Browser Execution**: All neural network inference, frame decoding, geometric transformations, and rendering run strictly within the client device's browser memory (WebAssembly + WebGL). Zero camera streams, frames, or biometric features ever leave the device.
2. **Resource Singleton Sharing**: The hardware camera stream (`MediaStream`) and MediaPipe Vision model are unified as persistent singletons. Navigating between routes re-parents the video layer without interrupting hardware capture or re-allocating GPU contexts.
3. **Decoupled Asynchronous Loops**:
   - **Vision Inference Loop**: Driven at ~30 FPS synchronized to the camera sensor's frame presentation timestamps via `detectForVideo()`.
   - **Render Loop**: Three.js WebGL scenes render at the device's native display refresh rate (60 Hz to 144 Hz) via `requestAnimationFrame`.
   - **Skeleton Overlay**: Direct 2D canvas drawing hooked to inference callbacks without triggering React state updates or virtual DOM reconciliation.
4. **Resilient Touch & Manual Fallbacks**: Every experience remains 100% usable via mouse, touch controls, or keyboard if the camera is disabled, unsupported, or ungranted.

---

## 2. Computer Vision Pipeline

```
[Webcam Hardware]
       │
       ▼ (MediaStream 640x480 @ 30fps)
[CameraManager Singleton]
       │
       ▼ (HTMLVideoElement)
[MediaPipe Hand Landmarker (WASM)]
       │
       ▼ (Raw 21 3D Normalized Landmarks + Handedness)
[Shared GestureEngine]
       │
       ├──► [HandSkeletonRenderer (Direct 2D Canvas)]
       │
       ▼ (Timestamp & Raw Landmarks)
[GestureSmoother & Classifier]
       │
       ▼ (Active Gesture, Confidence, Euler Angles)
[GestureContext (React State Store)]
       │
       ├──► Gesture Studio (Rotation & Pinch Scale)
       ├──► Particle Universe (Kinetic Swarm & Morph)
       └──► Gesture Runner (Lane Position & Fist Jump)
```

### 2.1 MediaPipe Tasks Vision Configuration
- **Model Asset**: `hand_landmarker.task` loaded from Google's static CDN.
- **Delegate**: WebAssembly (`CPU` delegate for broad compatibility; hardware accelerated via SIMD when available).
- **Running Mode**: `VIDEO`. Frames are supplied using monotonic timestamps (`performance.now()`), avoiding frame drops or timestamp collisions.
- **Detection Bounds**: `numHands: 1` (configured for low-latency single-hand spatial control), `minHandDetectionConfidence: 0.5`, `minHandPresenceConfidence: 0.5`, `minTrackingConfidence: 0.5`.

### 2.2 Gesture Classification & Smoothing
- **Exponential Smoothing**: Landmark coordinates are filtered using an exponential moving average (`alpha = 0.35`) to prevent high-frequency jitter while preserving immediate responsiveness.
- **Palm Normalization**: Distances between landmarks (such as thumb tip #4 and index tip #8) are normalized against palm span (distance between wrist #0 and middle MCP #9). This ensures gestures are invariant to hand distance from the lens.
- **Pinch Detection**: Continuous pinch scale is computed between normalized bounds ($[0.15, 0.70]$), with curled-finger checks preventing false pinches when making a fist or resting on the chin.
- **Fist & Jump Latching**: Strict state machines require a full fist clench to trigger a jump or shape morph, requiring an open-palm release before a subsequent trigger can register.

---

## 3. Real-Time Hand Landmark Skeleton Overlay

The hand skeleton overlay (`HandSkeletonOverlay` & `HandSkeletonRenderer`) projects a 21-node anatomical skeleton over the live camera backdrop.

### 3.1 Coordinate Mapping Mathematics
The camera video is styled with `object-fit: cover` and horizontally mirrored (`transform: scaleX(-1)`):
1. **Mirroring Correction**: Because the video feed is horizontally mirrored for natural mirror interaction, normalized landmark coordinates are horizontally inverted:
   $$x_{\text{mirrored}} = 1 - x$$
2. **Object-Fit: Cover Crop Calculation**:
   Given video dimensions $(w_v, h_v)$ and viewport display dimensions $(w_c, h_c)$:
   $$\text{scale} = \max\left(\frac{w_c}{w_v}, \frac{h_c}{h_v}\right)$$
   $$\text{renderedWidth} = w_v \cdot \text{scale}, \quad \text{renderedHeight} = h_v \cdot \text{scale}$$
   $$\text{offsetX} = \frac{w_c - \text{renderedWidth}}{2}, \quad \text{offsetY} = \frac{h_c - \text{renderedHeight}}{2}$$
   $$X_{\text{screen}} = \text{offsetX} + x_{\text{mirrored}} \cdot \text{renderedWidth}$$
   $$Y_{\text{screen}} = \text{offsetY} + y \cdot \text{renderedHeight}$$
3. **High-DPI Alignment**: Internal canvas dimensions are scaled by $\min(\text{devicePixelRatio}, 2)$ to ensure razor-sharp lines on Retina/OLED mobile screens without excess fill-rate overhead.

### 3.2 Canonical MediaPipe Hand Connections
The skeleton renders the 21 standard anatomical joints:
- **Wrist Anchor**: Node 0
- **Thumb**: 0 → 1 → 2 → 3 → 4
- **Index**: 0 → 5 → 6 → 7 → 8
- **Middle**: 0 → 9 → 10 → 11 → 12
- **Ring**: 0 → 13 → 14 → 15 → 16
- **Pinky**: 0 → 17 → 18 → 19 → 20
- **Palm Base Ring**: 5 → 9 → 13 → 17

---

## 4. Route & Resource Lifecycle Management

```
User Action: Navigate from Studio to Particle Universe
  │
  ├── 1. StudioSceneController.dispose()
  │      ├── Cancel RAF animation loop
  │      ├── Disconnect ResizeObserver
  │      ├── Dispose geometries & materials
  │      └── Dispose WebGLRenderer & forceContextLoss()
  │
  ├── 2. CameraManager maintains MediaStream (Zero permission prompt)
  │
  ├── 3. ParticleUniverse mounts
  │      ├── Re-parents shared video element
  │      ├── Mounts ParticleSceneController
  │      └── Subscribes to shared GestureEngine.onFrame
  │
  └── 4. HandSkeletonOverlay clears and rebinds to same engine stream
```

### Route Hygiene & Hash Navigation
The application uses hash-based client routing (`#studio`, `#particles`, `#runner`, `#home`). If an obsolete route (such as `#about`) or unrecognized hash is loaded, `App.tsx` intercepts the event and cleanly resets navigation to `#home`.

---

## 5. WebGL Rendering & Memory Management

### 5.1 Three.js Optimization
- **`devicePixelRatio` Capping**: Capped at `Math.min(window.devicePixelRatio || 1, 2)`. This prevents 3x/4x scaling on high-density mobile devices from starving the mobile GPU.
- **Buffer Reuse**: In `ParticleSceneController`, particle morphing interpolates Float32Array position and color buffers directly in-place (`attribute.needsUpdate = true`) without reallocating vertex buffers.
- **Explicit WebGL Cleanup**: Every scene controller implements a complete `dispose()` protocol:
  - Cancels `requestAnimationFrame`.
  - Disconnects `ResizeObserver`.
  - Disposes all `BufferGeometry` and `Material` instances.
  - Calls `renderer.dispose()` and `renderer.forceContextLoss()`.

### 5.2 Rationale for `preserveDrawingBuffer: true`
In WebGL, when a canvas buffer is composited by the browser compositor, its contents are discarded unless `preserveDrawingBuffer` is enabled. Because ZMotion features in-browser photo snapshots and client-side video recording (compositing the video feed with the 3D scene on user click), `preserveDrawingBuffer: true` is strictly required. Profiling confirms that for these lightweight scenes (single mesh / 15K particles), GPU memory and frame timing remain well within 60 FPS budgets.

---

## 6. Privacy & In-Memory Media Capture

1. **Composite Canvas**: When the user triggers photo capture, an offscreen 2D canvas composites the mirrored camera video frame and the transparent 3D WebGL canvas.
2. **In-Memory Blob**: The composite is converted to a local `image/png` Blob via `canvas.toBlob()`.
3. **Local URL**: An `URL.createObjectURL(blob)` is generated for preview and user-initiated download.
4. **Immediate Cleanup**: Once the preview modal is closed or a new capture begins, `URL.revokeObjectURL()` is called to release heap memory.
5. **Video Encoding**: Client-side video recording uses `canvas.captureStream(30)` fed into `MediaRecorder`. When stopped, chunks are joined into a `video/webm` or `video/mp4` Blob locally.
