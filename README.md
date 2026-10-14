# ZMotion — Gesture Lab

> High-performance browser-based spatial computing and interactive 3D vision platform combining an interactive 3D studio, morphing particle universe, and an endless cyber runner powered by Google MediaPipe Tasks Vision and Three.js.

[![React](https://img.shields.io/badge/React-19-blue.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6-purple.svg)](https://vitejs.dev/)
[![Three.js](https://img.shields.io/badge/Three.js-0.174-black.svg)](https://threejs.org/)
[![MediaPipe](https://img.shields.io/badge/MediaPipe-Tasks_Vision-00d2ff.svg)](https://developers.google.com/mediapipe)
[![Tests](https://img.shields.io/badge/Vitest-119%20Passed-success.svg)](https://vitest.dev/)
[![CI](https://github.com/Shameer28tm/zmotion-gesture-lab/actions/workflows/ci.yml/badge.svg)](https://github.com/Shameer28tm/zmotion-gesture-lab/actions/workflows/ci.yml)
[![Privacy: 100% Client-Side](https://img.shields.io/badge/Privacy-100%25%20Client--Side-brightgreen.svg)](#100-user-side-privacy-guarantee)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

---

## 100% USER-SIDE PRIVACY GUARANTEE

> **"Your camera is yours. Explore, create, capture, and download — without uploading your photos or videos to our servers."**

* **Zero Cloud Streaming**: Webcam frames are analyzed directly in volatile browser memory via WebAssembly and WebGL shaders.
* **Zero Remote Uploads**: Captured snapshots and recorded interaction videos are composited and encoded in-memory via client-side canvas and browser `MediaRecorder`.
* **Zero Tracking / Telemetry**: No third-party trackers, no analytics beacons, and no storage of biometric or facial data.
* **Full Privacy Architecture**: Read our complete disclosure in [`docs/privacy.md`](./docs/privacy.md).

---

## Dual-Hand Tracking & Vision Architecture

### 1. Simultaneous Dual-Hand Detection & Skeleton Rendering
* **MediaPipe `numHands: 2`**: Automatically infers and tracks both hands simultaneously when present in the camera viewport.
* **`MultiHandTracker`**: Robust hand association engine maintaining continuous tracking state for up to two hands:
  - **Safe Association Strategy**: Resolves MediaPipe's non-deterministic hand array ordering (`[0]` vs `[1]`) and handedness noise by matching detected hands to active tracks using Euclidean centroid proximity, trajectory projection, and soft handedness affinity.
  - **Independent Grace Period**: When one hand disappears, a ~200ms grace period holds its skeleton before fading it out. *The remaining hand continues tracking and rendering seamlessly without stutter or identity swapping*.
  - **Zero Contamination**: Each hand maintains independent smoothed landmark states; coordinates are never averaged across hands.
* **`HandSkeletonRenderer` (`renderHands`)**:
  - Renders 21 anatomical landmarks and canonical connections per hand.
  - Color differentiation: **Electric Blue** (`#00d2ff`) for Left Hand / Hand 1, and **Electric Cyan** (`#00f5d4`) for Right Hand / Hand 2.
  - Dynamic pinch connection highlight and wrist telemetry badges (`● L · GESTURE` / `● R · GESTURE`).
  - High-performance Canvas 2D layer decoupled from React renders.

### 2. Adaptive Velocity-Aware Landmark Filter (`LandmarkFilter`)
* **Stationary Jitter Suppression**: Applies strong smoothing ($\alpha \approx 0.68$) during stationary poses to eliminate webcam sensor noise and landmark micro-jitter.
* **Velocity-Aware Responsiveness**: Dynamically scales down smoothing alpha ($\alpha \approx 0.10$) during rapid hand movements, preventing trailing lag behind the physical hand.
* **Zero-Jump Reacquisition**: Resets filter history on tracking loss; initial frame snaps directly to raw physical coordinates.

---

## Core Product Experiences

### 1. Minimalist Cosmic Landing Page (`/#home`)
* **Minimal Hero**: Focuses on core creative expression without clutter:
  - **H1**: *"ZMotion: Real-Time Hand Gesture Control in 3D"*
  - **Description**: *"Turn your webcam into a touch-free creative space. Move, shape, and play with hand gestures — privately, right in your browser."*
  - **Brand Signature Slogan**: *"Leverage Early. Move Differently. Sky Is the Limit."*
  - **Developer Credit**: Elegant editorial credit to creator [Shameer TM](https://www.linkedin.com/in/shameerion).
* **2D CSS Cosmic Space Background**: Ultra-lightweight cosmic canvas featuring layered starfields, orbiting sapphire planet, distant moon, and shooting stars without WebGL or Three.js overhead. Fully respects `@media (prefers-reduced-motion: reduce)`.
* **Direct Experience Doorways**: Streamlined cards linking directly to Studio, Particle Universe, and Endless Cyber Runner.

### 2. Gesture Studio (`/#studio`)
* **3D Parametric Solids**: **Sphere**, **Cube**, and **Torus** with glowing wireframe overlays and dynamic directional lighting.
* **Spatial Tracking**: Direct palm yaw and pitch spatial rotation with smooth lerp responsiveness.
* **Calibrated Pinch Zoom**: Continuous distance calculation between thumb tip (landmark 4) and index tip (landmark 8) with palm-size normalization. Disallows false pinches when fingers are curled into a fist or resting on the chin.
* **Discrete Pointing**: Index finger extension triggers neon palette cycles with latching cooldown.
* **Real-Time Hand Skeleton**: Live 21-node anatomical tracking skeleton projected over camera feed with glowing pinch indicators.

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
* **Fist Morph Trigger**: Fist closure cycles to the next geometric construct with debounced cooldown.
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
  - Complete manual keyboard fallback (`A`/`D`/Arrows to steer, `Space`/`W`/`Up` to jump, `P`/`Esc` to pause).
  - Dedicated mobile on-screen touch bar (`LEFT`, `JUMP`, `RIGHT`) placed safely outside obstacle view.
* **Visual Impact Feedback**: Full-viewport red collision flash border on hazard impact.
* **Local High Score**: Persisted safely in `localStorage` under `zmotion_runner_highscore`.

---

## Real-Time 21-Landmark Hand Skeleton Overlay

ZMotion features a high-performance Canvas 2D overlay layer (`HandSkeletonOverlay`) that visualizes the canonical 21 anatomical joints detected by MediaPipe:
* **Canonical Anatomical Graph**: Renders wrist anchor (#0), thumb (#1–#4), index (#5–#8), middle (#9–#12), ring (#13–#16), pinky (#17–#20), and palm base loop (#5–#9–#13–#17).
* **Zero React Rerender Overhead**: Bypasses React state cycles during animation frames, subscribing directly to `GestureEngine.onFrame`.
* **Precise Coordinate Mapping**: Mathematically projects normalized coordinates through `object-fit: cover` aspect ratio scaling, centering offset, horizontal mirroring (`1 - x`), and Retina/OLED device pixel ratio capping ($\le 2$).
* **Dynamic Pinch Feedback**: Highlights landmarks #4 and #8 with distinct neon colors when a pinch gesture is engaged.
* **Stale Landmark Clearing**: Immediately clears the canvas when hand presence is lost; never leaves a frozen skeleton on screen.
* **Show/Hide Toggle**: Accessible toggle in advanced settings (enabled by default when tracking is active).

---

## Mobile Responsive UX & Drawer Architecture

On viewports below 768px (mobile phones and small tablets), ZMotion transforms into a camera-first layout:
* **Compact Top Bar (`MobileExperienceBar`)**: Displays only essential tools (Camera toggle, Photo snapshot, Record, Tracking badge, and More settings button).
* **Sliding Bottom Sheet (`MobileControlDrawer`)**: Secondary controls (mesh solid/wireframe, color palette, particle density, difficulty modes, reset buttons, telemetry diagnostics) are neatly housed in an accessible bottom drawer.
* **Dismissal Support**: Dismissable via explicit Done button, background backdrop tap, or `Escape` key.
* **Safe-Area Insets**: Full support for `100dvh` (Dynamic Viewport Height), mobile notches, and home indicator bars.
* **Touch-Friendly Controls**: Touch targets are sized $\ge 44 \times 44\text{ px}$.

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

## System Architecture Overview

```
[Webcam] ──► [CameraManager (Singleton)] ──► [MediaPipe Hand Landmarker (WASM)]
                                                        │
                      ┌─────────────────────────────────┴──────────────────────────────┐
                      ▼                                                                ▼
             [HandSkeletonOverlay]                                            [Shared GestureEngine]
           (Direct Canvas 2D Layer)                                                    │
                                                                                       ▼
                                                                             [GestureSmoother & State]
                                                                                       │
                                   ┌───────────────────────────────────────────────────┼─────────────────────────────────┐
                                   ▼                                                   ▼                                 ▼
                          [Gesture Studio]                                    [Particle Universe]                 [Gesture Runner]
                       (Parametric 3D Meshes)                               (15K Points GPU Engine)             (3-Lane Cyber Runway)
```

For complete architectural documentation and detailed Mermaid diagrams, consult:
* **System Architecture Document**: [`docs/architecture.md`](./docs/architecture.md)
* **Mermaid Topology Diagram**: [`docs/diagrams/system-architecture.md`](./docs/diagrams/system-architecture.md)
* **Production Best Practices**: [`docs/production-best-practices.md`](./docs/production-best-practices.md)
* **Performance Benchmarks**: [`docs/benchmarks.md`](./docs/benchmarks.md)

---

## Tech Stack

* **Frontend Framework**: React 19, TypeScript (Strict Mode), Vite 6.
* **3D Graphics Engine**: Three.js 0.174 (Modular tree-shaken imports, zero chunk warnings).
* **Computer Vision**: `@mediapipe/tasks-vision` (WebAssembly & WebGL delegate).
* **Styling**: Vanilla CSS Design System with Cyber Glassmorphism (`#05070d`, `#080d1a`, `#00d2ff`, `#00f5d4`).
* **Icons**: `lucide-react`.
* **Testing & QA**: Vitest, JSDOM, `@testing-library/react` (109 passing automated tests across 13 test suites).

---

## Installation & Local Development

### Prerequisites
* **Node.js**: `18+` (Tested on `v20.x` and `v22.x`)
* **npm**: `9+`
* Modern browser supporting WebGL 2.0 and WebAssembly (Chrome, Edge, Firefox, Safari)

### Setup
```bash
# Clone the repository
git clone https://github.com/Shameer28tm/zmotion-gesture-lab.git
cd zmotion-gesture-lab

# Install dependencies cleanly
npm install

# Start local development server
npm run dev
```

Visit `http://localhost:5173` in your browser.

### Automated Testing
```bash
# Run Vitest test suite (109 passing unit, integration, and regression tests across 13 suites)
npm test -- --run
```

### Production Build
```bash
# Compile TypeScript and build optimized distribution bundles
npm run build

# Preview production build locally
npm run preview
```

---

## Vercel Production Deployment

ZMotion is pre-configured for zero-friction Vercel deployment via `vercel.json`:
* **Framework Preset**: Vite
* **Build Command**: `npm run build`
* **Output Directory**: `dist`
* **Routing**: Automatic SPA rewrites (`/(.*) -> /index.html`) with hash router fallback (`#studio`, `#particles`, `#runner`).
* **Permissions Policy**: `camera=(self)` pre-authorized for HTTPS webcam spatial tracking.
* **Asset Caching**: 1-year immutable caching for Three.js and MediaPipe code-split chunks.

### Deploying to Vercel (1-Click or CLI):
1. **GitHub Integration (Recommended)**:
   - Import `https://github.com/Shameer28tm/zmotion-gesture-lab` in the [Vercel Dashboard](https://vercel.com/new).
   - Vercel automatically detects the Vite framework and `vercel.json` configuration.
   - Click **Deploy**. Continuous deployment triggers on every git push to `main`.
2. **Vercel CLI**:
   ```bash
   npm i -g vercel
   vercel
   vercel --prod
   ```

---

## Known Browser & Hardware Notes

* **Camera Permissions**: Browsers require explicit user consent and an HTTPS or `localhost` origin to access `getUserMedia`.
* **MediaRecorder Codecs**: Chromium browsers (Chrome, Edge, Brave) support VP8/VP9 WebM. Safari on iOS/macOS supports MP4 H.264. `MediaCaptureService` dynamically selects the best codec supported by the client browser.
* **WebGL Acceleration**: Ensure hardware acceleration is enabled in your browser settings for 60 FPS performance.
* **Constrained Mobile Devices**: High-density mobile screens have device pixel ratio capped at 2.0 to conserve GPU memory and thermal headroom.

---

## Troubleshooting

| Issue | Cause | Solution |
| :--- | :--- | :--- |
| **"Camera Access Denied"** | Browser permission blocked or non-HTTPS origin. | Grant camera permission in browser URL lock icon; ensure site is accessed via `https://` or `localhost`. |
| **"Hand Lost" persists** | Insufficient room lighting or hand too close/far. | Ensure hand is 0.5m – 1.5m from camera with reasonable ambient lighting. |
| **Stuttering on high-res displays** | Excessive DPR rendering. | ZMotion automatically clamps DPR to 2.0. In Particle Universe, switch density to 5K particles. |
| **Black photo snapshot** | WebGL buffer clearing. | `preserveDrawingBuffer: true` is enabled by default to ensure composite snapshots capture 3D content. |

---

## Contributing

We welcome community contributions! Please review [`CONTRIBUTING.md`](./CONTRIBUTING.md) for code guidelines, branch naming conventions, and local testing procedures.

---

## Developer Attribution

**Developed by Shameer TM**  
- **LinkedIn**: [https://www.linkedin.com/in/shameerion](https://www.linkedin.com/in/shameerion)  
- **Instagram**: [https://instagram.com/shameerion](https://instagram.com/shameerion)  
- **Organization**: [Zcloud Digitech](https://instagram.com/zcloud_digitech)  
- **Repository**: [https://github.com/Shameer28tm/zmotion-gesture-lab](https://github.com/Shameer28tm/zmotion-gesture-lab)

---

## License

This project is licensed under the [MIT License](./LICENSE) — open and free for personal and commercial usage.
