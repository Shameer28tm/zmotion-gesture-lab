# ZMotion — Gesture Lab

> High-performance browser-based spatial computing and interactive 3D vision platform combining an interactive 3D studio, morphing particle universe, and an endless cyber runner powered by Google MediaPipe Tasks Vision and Three.js.

[![React](https://img.shields.io/badge/React-19-blue.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6-purple.svg)](https://vitejs.dev/)
[![Three.js](https://img.shields.io/badge/Three.js-0.174-black.svg)](https://threejs.org/)
[![MediaPipe](https://img.shields.io/badge/MediaPipe-Tasks_Vision-00d2ff.svg)](https://developers.google.com/mediapipe)
[![Tests](https://img.shields.io/badge/Vitest-80%20Passed-success.svg)](https://vitest.dev/)
[![Privacy: 100% Client-Side](https://img.shields.io/badge/Privacy-100%25%20Client--Side-brightgreen.svg)](#100-user-side-privacy-guarantee)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

---

## 100% USER-SIDE PRIVACY GUARANTEE

> **"Your camera is yours. Explore, create, capture, and download — without uploading your photos or videos to our servers."**

* **Zero Cloud Streaming**: Webcam frames are analyzed directly in volatile browser memory via WebAssembly and WebGL shaders.
* **Zero Remote Uploads**: Captured snapshots and recorded interaction videos are composited and encoded in-memory via client-side canvas and browser `MediaRecorder`.
* **Zero Tracking / Telemetry**: No third-party trackers, no analytics beacons, and no storage of biometric or facial data.

---

## Core Product Experiences

### 1. Minimalist Cosmic Landing Page (`/`)
* **Minimal Hero**: Focuses on core creative expression without clutter:
  - **H1**: *"ZMotion: Real-Time Hand Gesture Control in 3D"*
  - **Description**: *"Turn your webcam into a touch-free creative space. Move, shape, and play with hand gestures — privately, right in your browser."*
  - **Brand Signature Slogan**: *"Leverage Early. Move Differently. Sky Is the Limit."*
* **2D CSS Cosmic Space Background**: Lightweight, responsive cosmic environment featuring layered starfields, orbiting sapphire planet, distant moon, and shooting star trails without any Three.js or WebGL overhead. Fully respects `prefers-reduced-motion`.
* **Direct Experience Doorways**: Streamlined cards linking directly to Studio, Particle Universe, and Endless Cyber Runner.
* **Direct Social Profiles**: Immediate access to creator LinkedIn and Instagram channels directly on the landing page.

### 2. Gesture Studio (`/#studio`)
* **3D Parametric Solids**: **Sphere**, **Cube**, and **Torus** with glowing wireframe overlays and dynamic directional lighting.
* **Spatial Tracking**: Direct palm yaw and pitch spatial rotation with smooth lerp responsiveness.
* **Calibrated Pinch Zoom**: Continuous distance calculation between thumb tip (landmark 4) and index tip (landmark 8) with palm-size normalization. Disallows false pinches when fingers are curled into a fist or resting on the chin.
* **Discrete Pointing**: Index finger extension triggers neon palette cycles with latching cooldown.
* **In-Memory Capture**: Instant composite photo snapshot and video recording controls directly in the top HUD.

### 3. Particle Universe (`/#particles`)
* **Three.js `THREE.Points` GPU Engine**: High-density particle simulation with zero CPU garbage generation.
* **Dynamic Morphing Constructs**:
  1. **Sphere**: Parametric spherical Fibonacci distribution.
  2. **Heart**: Parametric 3D cardioid manifold.
  3. **Saturn**: Central planetary core encircled by a planar ring disk.
  4. **Flower**: Multi-petal sinusoidal harmonic torus surface.
  5. **DNA Helix**: Dual intertwined antiparallel helical strands with base rungs.
* **Responsive Hand Interaction**: Centroid position drives rotational momentum and kinetic tilt.
* **Pinch & Spread**: Pinch gesture contracts the particle swarm; spreading to an open palm blooms the cloud up to 2.2x.
* **Fist Morph Trigger**: Fist closure switches to the next geometric construct with debounced cooldown.
* **Scalable Density**: Adaptive tiers (5,000 / 15,000 / 30,000 particles) for smooth performance across integrated and discrete GPUs.

### 4. Endless Cyber Runner (`/#runner`)
* **Accessible Onboarding**: Visual control mapping card before starting run explaining steering, jumping, and bonus mechanics.
* **Difficulty Modes**:
  - **EASY (Default & Recommended)**: Slower initial speed (14 m/s), generous collision boundary (0.45m), longer obstacle spacing (26m), floaty forgiving jump trajectory.
  - **NORMAL**: Balanced pace (19 m/s) with standard obstacle intervals (19m).
  - **HARD**: Fast arcade rush (25 m/s) with demanding obstacles (14m spacing).
* **Controls & Latching**:
  - Continuous horizontal hand tracking maps to 3 predictable lanes (`LEFT`, `CENTER`, `RIGHT`) with deadbands.
  - Strict jump latching: exactly 1 jump per fist clench; releasing the fist unlatches the jump.
  - Complete manual keyboard fallback (`A`/`D`/Arrows to steer, `Space`/`W`/`Up` to jump, `P`/`Esc` to pause) and on-screen touch arrows.
* **Visual Impact Feedback**: Full-viewport red collision flash border on hazard impact.

---

## Shared Camera & Vision Engine Lifecycle

1. **Unified Stream Singleton**:
   - `CameraManager` manages a single persistent `MediaStream`. When navigating between Studio, Particles, and Runner, the video element is safely re-parented without re-requesting browser camera permissions or tearing down the media stream.
   - `ensureActivePlayback()` watchdog auto-resumes video playback if Chromium pauses the stream during DOM re-attachment.
2. **Decoupled Inference & Render Loops**:
   - Camera video inference runs at ~30 FPS using monotonic `performance.now()` timestamps.
   - Three.js render loops run independently at full monitor refresh rate (60–144 Hz).
3. **Accurate Latency Telemetry**:
   - Inference latency measures the actual duration of `detectForVideo()`.
   - Uses an exponential moving average (`alpha = 0.2`) and filters initial shader compilation warmup spikes to eliminate transient latency artifacts.
4. **Hand-Loss Watchdog**:
   - If no valid landmarks arrive for >280ms, the engine cleanly transitions to `NO_HAND` and resets pinch/fist latches, preventing stuck states.
5. **State Clarification**:
   - Hand presence reports `TRACKING (${handedness})` rather than ambiguous `LOCKED`.
   - Detected gesture displays `NEUTRAL` when a hand is present without an active trigger gesture.

---

## Privacy-First Photo & Video Capture

* **Composite Rendering**: Simultaneously captures the mirrored webcam feed and the transparent Three.js WebGL canvas onto an offscreen canvas (`preserveDrawingBuffer: true`).
* **Client-Side MediaRecorder**: Encodes 30 FPS video locally using browser-supported codecs (`video/webm;codecs=vp9`, `video/webm;codecs=vp8`, or `video/mp4`).
* **In-Memory Preview Modal**: Users can preview their photo or video, download the file directly to their local filesystem, or retake without uploading anything.
* **Auto-Cap Safety**: Video recordings automatically cap at 60 seconds to prevent client-side memory exhaustion.

---

## Gesture Control Mapping Matrix

| Gesture | Studio (`/#studio`) | Particle Universe (`/#particles`) | Gesture Runner (`/#runner`) |
| :--- | :--- | :--- | :--- |
| **Hand Movement (X/Y)** | Rotates 3D Mesh (Yaw/Pitch) | Rotates Particle Swarm | Steers Across Lanes (Left/Center/Right) |
| **Pinch (Thumb + Index)** | Scale / Zoom Mesh | Radial Contraction | — |
| **Open Palm (Spread)** | Reset Orientation to Origin | Radial Bloom Expansion (up to 2.2x) | — |
| **Closed Fist** | — | Cycle to Next Construct | Jump Barrier (1 Jump per Clench) |
| **Pointing (Index Extended)** | Cycle Neon Color Palette | — | — |
| **Hand Lost** | Inertial Drift to Neutral | Smooth Idle Orbit | Maintains Current Lane |

---

## Online / Offline Capability Matrix

| Feature | Online (First Load) | Offline (Cached / Subsequent) | Offline (Cold Start) |
| :--- | :---: | :---: | :---: |
| **Application Shell & UI** | Full | Full (Vite bundle) | Full |
| **Studio Manual 3D Controls** | Full | Full | Full |
| **Particle Universe Manual** | Full | Full | Full |
| **Runner Keyboard/Touch Mode** | Full | Full | Full |
| **Photo & Video Local Capture** | Full | Full | Full |
| **MediaPipe WASM Engine** | Full | Cached by Browser | Requires Internet |
| **Hand Landmarker Model (.task)** | Full | Cached by Browser | Requires Internet |
| **Webcam Hardware Access** | Full | Full (Standard Local API) | Full (Standard Local API) |

---

## Tech Stack & Architecture

* **Framework**: React 19, TypeScript (Strict Mode), Vite 6.
* **3D Engine**: Three.js 0.174 (Modular tree-shaken imports, zero chunk warnings, all chunks < 500 kB).
* **Computer Vision**: `@mediapipe/tasks-vision` (WebAssembly & WebGL delegate).
* **Styling**: Vanilla CSS Design System with Cyber Glassmorphism (`#05070d`, `#080d1a`, `#00d2ff`, `#00f5d4`).
* **Icons**: `lucide-react`.
* **Testing**: Vitest, JSDOM, `@testing-library/react` (80 passing automated tests).

---

## Installation & Local Development

### Prerequisites
* Node.js `18+` (Tested on `v24.12.0`)
* npm `9+` (Tested on `v11.10.0`)
* Webcam and browser with WebGL 2.0 and WebAssembly support (Chrome, Edge, Firefox, Safari)

### Setup
```bash
# Clone the repository
git clone https://github.com/Shameer28tm/zmotion-gesture-lab.git
cd zmotion-gesture-lab

# Install dependencies
npm install

# Start development server
npm run dev
```

Visit `http://localhost:5173` in your browser.

### Testing
```bash
# Run automated Vitest test suite (80 unit & regression tests)
npm run test
```

### Production Build
```bash
# Compile TypeScript and build optimized distribution bundle
npm run build

# Preview production build locally
npm run preview
```

---

## Known Browser & Hardware Notes

* **Camera Permissions**: Browsers require explicit user consent and an HTTPS or localhost origin to access media devices.
* **MediaRecorder Codecs**: Chromium browsers (Chrome, Edge, Brave) support VP8/VP9 WebM. Safari on iOS/macOS supports MP4 H.264. `MediaCaptureService` dynamically selects the best codec supported by the client browser.
* **WebGL Acceleration**: For optimal performance, ensure hardware acceleration is enabled in your browser settings.

---

## Social Links & Portfolio

* **LinkedIn**: [https://www.linkedin.com/in/shameerion](https://www.linkedin.com/in/shameerion)
* **Instagram (Personal)**: [https://instagram.com/shameerion](https://instagram.com/shameerion)
* **Instagram (Zcloud Digitech)**: [https://instagram.com/zcloud_digitech](https://instagram.com/zcloud_digitech)
* **GitHub Repository**: [https://github.com/Shameer28tm/zmotion-gesture-lab](https://github.com/Shameer28tm/zmotion-gesture-lab)

---

## License

This project is licensed under the [MIT License](./LICENSE) — open and free for personal and commercial usage.
