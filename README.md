# ZMotion — Gesture Lab

> High-performance browser-based spatial computing and interactive 3D vision platform combining an interactive 3D studio, morphing particle universe, and an endless cyber runner powered by Google MediaPipe Tasks Vision and Three.js.

[![React](https://img.shields.io/badge/React-19-blue.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6-purple.svg)](https://vitejs.dev/)
[![Three.js](https://img.shields.io/badge/Three.js-0.174-black.svg)](https://threejs.org/)
[![MediaPipe](https://img.shields.io/badge/MediaPipe-Tasks_Vision-00d2ff.svg)](https://developers.google.com/mediapipe)
[![Tests](https://img.shields.io/badge/Vitest-67%20Passed-success.svg)](https://vitest.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

---

## Overview

**ZMotion: Gesture Lab** transforms standard consumer webcams into low-latency spatial controllers. The system executes computer vision inference 100% client-side via Google MediaPipe Tasks Vision WebAssembly and GPU shaders, tracking 21 3D hand landmarks in real time and translating natural gestures into interactive 3D actions.

**Privacy Guarantee**: No camera video, frames, or biometric data are ever sent over a network. All processing happens in local browser memory.

---

## Core Product Experiences

### 1. Gesture Studio (`/#studio`)
* **3D Parametric Solids**: **Sphere**, **Cube**, and **Torus** with glowing cybernetic wireframe overlays and dynamic directional lighting.
* **Spatial Tracking**: Direct palm yaw and pitch spatial rotation with smooth lerp responsiveness.
* **Pinch Zoom**: Continuous distance calculation between thumb tip (landmark 4) and index tip (landmark 8) for smooth radial scaling without flicker.
* **Discrete Pointing**: Index finger extension triggers neon palette cycles with latching cooldown to prevent accidental activations.
* **Open Palm Reset**: Instantly returns geometry to canonical orientation.
* **Full Viewport Transparency**: Live camera backdrop rendered behind transparent WebGL canvas with mirrored webcam orientation.
* **Manual Accessibility**: Full mouse drag, wheel zoom, touch drag, and keyboard shortcuts (`1`, `2`, `3`, `R`).

### 2. Particle Universe (`/#particles`)
* **Three.js `THREE.Points` GPU Engine**: High-density particle simulation with zero CPU garbage generation.
* **Dynamic Morphing Constructs**:
  1. **Sphere**: Parametric spherical Fibonacci distribution.
  2. **Heart**: Parametric 3D cardioid manifold.
  3. **Saturn**: Central planetary core encircled by a planar ring disk.
  4. **Flower**: Multi-petal sinusoidal harmonic torus surface.
  5. **DNA Helix**: Dual intertwined antiparallel helical strands with base rungs.
* **Responsive Hand Interaction**: Centroid position drives rotational momentum and kinetic tilt.
* **Pinch Dispersion**: Pinch gesture expands/contracts particle cloud radius.
* **Closed Fist Switch**: Fist closure switches to the next geometric construct with debounced cooldown.
* **Scalable Density**: Adaptive tiers (5,000 / 15,000 / 30,000 particles) for smooth performance across integrated and discrete GPUs.

### 3. Gesture Runner (`/#runner`) — Phase 5
* **Endless Cyber Runway**: Infinite neon track with animated grid ties, glowing lane markers, and bank-tilt hover drone.
* **Procedural Obstacles**:
  - **Barriers**: Low obstacles requiring a jump.
  - **Pylons**: Tall energy conduits requiring lane-switching evasion.
  - **Energy Orbs**: Rotating collectible power cores yielding score bonuses.
* **Gesture Navigation**:
  - Horizontal hand displacement smoothly steers between lanes (-2.2m, 0m, +2.2m).
  - Closed fist triggers snappy arcade jump with deterministic parabolic gravity.
* **Score & Progression**: Live score, distance counters, dynamic speed acceleration, and multiplier bonuses.
* **State Machine**: Complete `IDLE`, `PLAYING`, `PAUSED`, and `GAME_OVER` states with local high-score persistence (`zmotion_runner_high_score`) and celebratory record confetti.
* **Full Manual Fallbacks**: Keyboard (`A`/`D`/Arrows to steer, `Space`/`W`/`Up` to jump, `P`/`Esc` to pause), on-screen touch buttons for mobile/tablet.

### 4. Shared Control Center HUD
* **Unified Telemetry**: Real-time tracking latency in ms, vision FPS, acceleration backend (`GPU` / `CPU`), and detected gesture.
* **Fast Motion Anti-Lag Toggle**: Switches between velocity-aware adaptive smoothing and steady smoothing.
* **Camera Stream Re-use**: `CameraManager` singleton maintains the camera stream seamlessly across route transitions without reloading or re-requesting permissions.
* **21-Point Landmark Skeletal Overlay**: Real-time canvas visualization of tracked joints.
* **Sensitivity & Filter Calibration**: User-adjustable smoothing alpha and motion dead-zones.

---

## Hand Tracking Engine & Optimizations (Phase B)

1. **Decoupled Inference Loop**:
   - Webcams typically supply frames at 30 FPS, while modern displays refresh at 60–144 Hz.
   - Inference is throttled to ~30 FPS and skips frames when `video.currentTime === lastVideoTime`, preventing main-thread and GPU starvation while allowing Three.js render loops to run at full display refresh rate.
2. **Velocity-Aware Adaptive Smoothing**:
   - Stationary holding maintains higher filtering (`alpha ~ 0.55`) for jitter-free stability.
   - Fast hand sweeps automatically drop smoothing (`alpha ~ 0.12`), cutting tracking lag to near zero.
3. **GPU Delegate with CPU Fallback**:
   - Initializes `@mediapipe/tasks-vision` with WebGL GPU delegate for maximum inference throughput, with graceful automatic fallback to CPU if GPU delegate is unsupported.
4. **Parallelized Pipeline Startup**:
   - Camera media stream acquisition and MediaPipe model loading run concurrently via `Promise.all`, reducing startup latency to under 2 seconds.
5. **Calibrated Thresholds**:
   - Detection confidence: `0.45`, tracking confidence: `0.40`, motion dead-zone: `0.03`.

---

## Gesture Control Mapping Matrix

| Gesture | Studio (`/#studio`) | Particle Universe (`/#particles`) | Gesture Runner (`/#runner`) |
| :--- | :--- | :--- | :--- |
| **Hand Movement (X/Y)** | Rotates 3D Mesh (Yaw/Pitch) | Rotates Particle Swarm | Steers Drone Across Lanes |
| **Pinch (Thumb + Index)** | Scale / Zoom Mesh | Radial Expansion / Bloom | — |
| **Closed Fist** | — | Cycle to Next Construct | Jump Over Obstacles |
| **Pointing (Index Extended)** | Cycle Neon Color Palette | — | — |
| **Open Palm** | Reset Orientation to Origin | Normalize Rotation | — |
| **Hand Lost** | Inertial Drift to Neutral | Smooth Idle Orbit | Neutral Lane / Pause |

---

## Online / Offline Capability Matrix

| Feature | Online (First Load) | Offline (Cached / Subsequent) | Offline (Cold Start) |
| :--- | :---: | :---: | :---: |
| **Application Shell & UI** | Full | Full (Vite bundle) | Full |
| **Studio Manual 3D Controls** | Full | Full | Full |
| **Particle Universe Manual** | Full | Full | Full |
| **Runner Keyboard/Touch Mode** | Full | Full | Full |
| **MediaPipe WASM Engine** | Full | Cached by Browser | Requires Internet |
| **Hand Landmarker Model (.task)** | Full | Cached by Browser | Requires Internet |
| **Webcam Hardware Access** | Full | Full (Standard Local API) | Full (Standard Local API) |

*Note: In the event of network failure during model retrieval, the application automatically displays an informative fallback notice in the HUD while keeping all manual 3D interactions, particle morphs, and game controls 100% operational.*

---

## Tech Stack & Architecture

* **Framework**: React 19, TypeScript (Strict Mode), Vite 6.
* **3D Engine**: Three.js 0.174 (Modular tree-shaken imports, zero chunk warnings, all chunks < 500 kB).
* **Computer Vision**: `@mediapipe/tasks-vision` (WebAssembly & WebGL delegate).
* **Styling**: Vanilla CSS Design System with Cyber Glassmorphism (`#05070d`, `#080d1a`, `#00d2ff`, `#00f5d4`).
* **Icons**: `lucide-react`.
* **Testing**: Vitest, JSDOM, `@testing-library/react`.

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
# Run automated Vitest test suite
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

## Project Structure

```text
zmotion-gesture-lab/
├── public/
│   └── favicon.svg
├── src/
│   ├── components/
│   │   ├── camera/
│   │   │   ├── CameraBackdrop.tsx       # Mirrored live video backdrop
│   │   │   └── LandmarkOverlay.tsx      # 21-point skeletal canvas
│   │   ├── hud/
│   │   │   └── ControlCenter.tsx        # Telemetry & gesture calibration HUD
│   │   ├── layout/
│   │   │   ├── Navbar.tsx
│   │   │   └── Footer.tsx               # Social links & portfolio
│   │   ├── onboarding/
│   │   │   └── OnboardingModal.tsx      # Gesture onboarding tutorial
│   │   └── ui/
│   │       ├── Badge.tsx
│   │       ├── Button.tsx
│   │       ├── Card.tsx
│   │       ├── Modal.tsx
│   │       └── Slider.tsx
│   ├── core/
│   │   ├── camera/
│   │   │   └── CameraManager.ts         # Stream acquisition & device lifecycle
│   │   ├── engine/
│   │   │   ├── GestureContext.tsx       # React context provider
│   │   │   └── GestureEngine.ts         # Central pipeline orchestrator
│   │   ├── gestures/
│   │   │   ├── GestureClassifier.ts     # Geometric landmark analysis
│   │   │   ├── GestureSmoother.ts       # Adaptive velocity-aware filtering
│   │   │   └── LandmarkNormalizer.ts    # Wrist-invariant coordinate mapping
│   │   ├── vision/
│   │   │   └── HandLandmarkerService.ts # MediaPipe WASM service with GPU/CPU
│   │   └── types.ts                     # Core domain interfaces & telemetry
│   ├── experiences/
│   │   ├── about/
│   │   │   └── AboutExperience.tsx      # Architecture & system info
│   │   ├── home/
│   │   │   └── HomeLanding.tsx          # Minimal cyber landing page
│   │   ├── particles/
│   │   │   ├── ParticleSceneController.ts # Three.js GPU points controller
│   │   │   └── ParticleUniverse.tsx     # 5-construct particle experience
│   │   ├── runner/
│   │   │   ├── runnerEngine.ts          # Deterministic 3-lane physics & obstacles
│   │   │   ├── RunnerSceneController.ts # 3D cyber runway & obstacle meshes
│   │   │   └── GestureRunner.tsx        # Complete playable game experience
│   │   └── studio/
│   │       ├── StudioSceneController.ts # Three.js solid/wireframe mesh scene
│   │       └── GestureStudio.tsx        # Studio controls and viewport
│   ├── styles/
│   │   ├── hud.css
│   │   └── index.css
│   ├── test/
│   │   ├── foundation.test.tsx          # Route navigation & shell tests
│   │   ├── gestureAccuracy.test.ts      # Normalizer, pinch, & fist unit tests
│   │   ├── gestureEngine.test.ts        # Vision & pipeline lifecycle tests
│   │   ├── gestureRunner.test.ts        # Runner physics, obstacles, & scoring
│   │   ├── gestureStudio.test.tsx       # Studio presets & controls tests
│   │   └── particleUniverse.test.ts     # 5 particle presets & density tests
│   ├── types/
│   │   └── navigation.ts
│   ├── App.tsx                          # Route-level lazy loading & Suspense
│   └── main.tsx
├── LICENSE                              # MIT License
├── package.json
├── tsconfig.json
├── vite.config.ts                       # Manual chunk splitting & bundle config
└── vitest.config.ts
```

---

## Social Links & Portfolio

* **LinkedIn**: [https://www.linkedin.com/in/shameerion](https://www.linkedin.com/in/shameerion)
* **Instagram (Personal)**: [https://instagram.com/shameerion](https://instagram.com/shameerion)
* **Instagram (Zcloud Digitech)**: [https://instagram.com/zcloud_digitech](https://instagram.com/zcloud_digitech)
* **GitHub Repository**: [https://github.com/Shameer28tm/zmotion-gesture-lab](https://github.com/Shameer28tm/zmotion-gesture-lab)

---

## License

This project is licensed under the [MIT License](./LICENSE) — open and free for personal and commercial usage.
