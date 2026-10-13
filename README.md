# ZMotion — Gesture Lab

> Production-quality browser-based interactive 3D platform combining gesture-controlled 3D studio, morphing particle universe, and endless runner powered by MediaPipe and Three.js.

[![React](https://img.shields.io/badge/React-19-blue.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6-purple.svg)](https://vitejs.dev/)
[![Three.js](https://img.shields.io/badge/Three.js-0.174-black.svg)](https://threejs.org/)
[![MediaPipe](https://img.shields.io/badge/MediaPipe-Tasks_Vision-00d2ff.svg)](https://developers.google.com/mediapipe)
[![Tests](https://img.shields.io/badge/Vitest-Passing-success.svg)](https://vitest.dev/)

---

## Overview

**ZMotion: Gesture Lab** turns any standard browser and webcam into a spatial computing controller. The system processes video frames 100% locally on the device using Google MediaPipe Tasks Vision WebAssembly, extracting 21 3D hand landmarks in real time and translating natural gestures into interactive 3D actions.

No video frames or images are ever uploaded to any cloud server or third-party service.

---

## Core Product Experiences

### A. Gesture Studio (`#studio`)
* Interactive 3D presets: **Sphere**, **Cube**, and **Torus**.
* Solid mesh with glowing wireframe overlays.
* Hand position mapping for yaw/pitch spatial rotation.
* Thumb-index pinch distance controls object scaling.
* Proximity and pointing gestures trigger neon color transitions.
* Mouse drag, touch, and keyboard fallbacks.

### B. Particle Universe (`#particles`)
* High-density 15,000-particle construct rendered in Three.js.
* Dynamic GPU buffer morphing between 5 mathematical constructs:
  1. **Sphere**: Parametric spherical dispersion.
  2. **Heart**: Parametric cardioid formula.
  3. **Saturn**: Central spherical core with planar ring disk.
  4. **Flower**: Multi-petal sinusoidal harmonic surface.
  5. **DNA Helix**: Dual intertwined helical strands with base pairings.
* Hand centroid position drives smooth rotational inertia.
* Thumb-index pinch controls particle expansion and bloom.
* Closed fist gesture cycles to the next construct with cooldown debouncing.
* Scalable quality tiers (5,000 / 15,000 / 30,000 particles) for GPU adaptability.

### C. Gesture Games — Endless Cyber Runner (`#runner`)
* Full-fledged 3D arcade runner on an infinite procedural cyber highway.
* Player cube movement with gravity, ground rebound, and obstacle collisions.
* Horizontal hand position steers the player across lanes.
* Closed-fist gesture triggers instant jump events.
* Full keyboard alternative: `A` / `D` or Arrow keys to steer, `Space` to jump, `Escape` to pause.
* Scoring engine with obstacle dodging multipliers, game over, and restart.

### D. Shared Control Center HUD
* Unified telemetry overlay across all experiences.
* Camera lifecycle toggle (`CameraManager`) and permission diagnostics.
* Live landmark tracking indicator and 21-point skeletal overlay toggle.
* Real-time gesture classification badge (`OPEN_PALM`, `PINCH`, `CLOSED_FIST`, `POINTING`).
* Exponential smoothing filter and sensitivity calibration sliders.
* Interactive Onboarding and Gesture Guide modal.

---

## Architecture & Pipeline

```text
Webcam Video Stream
        │
        ▼
[ CameraManager ] ──── Request permission, acquire stream, lifecycle teardown
        │
        ▼
[ HandLandmarkerService ] ── MediaPipe Tasks Vision WebAssembly (21 3D landmarks)
        │
        ▼
[ LandmarkNormalizer ] ──── Scale-invariant wrist normalization, mirror correction
        │
        ▼
[ GestureClassifier ] ───── Compute geometric angles, pinch delta, fist closure
        │
        ▼
[ GestureSmoother ] ─────── Low-pass exponential filtering, cooldown debouncing
        │
        ▼
[ Experience Adapters ] ─── Drive Three.js scenes (Studio, Particles, Runner)
```

---

## Tech Stack

* **Frontend**: React 19, TypeScript with strict type checking, Vite 6.
* **3D Rendering**: Three.js 0.174.
* **Vision ML**: `@mediapipe/tasks-vision`.
* **Design & Styling**: Custom cyber design system in vanilla CSS (Void black `#05070d`, Deep navy `#080d1a`, Electric blue `#00d2ff`, Electric cyan `#00f5d4`).
* **Icons**: `lucide-react`.
* **Testing**: Vitest, `@testing-library/react`, JSDOM.

---

## Getting Started

### Prerequisites
* Node.js `v18+` (Tested on `v24.12.0`)
* npm `v9+` (Tested on `v11.10.0`)
* Modern browser with WebGL 2.0 and WebAssembly support

### Installation
```bash
git clone https://github.com/Shameer28tm/zmotion-gesture-lab.git
cd zmotion-gesture-lab
npm install
```

### Development Server
```bash
npm run dev
```

### Run Tests
```bash
npm run test
```

### Production Build
```bash
npm run build
```

### Preview Production Build
```bash
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
│   │   ├── hud/
│   │   │   └── ControlCenter.tsx
│   │   ├── layout/
│   │   │   ├── Navbar.tsx
│   │   │   └── Footer.tsx
│   │   ├── onboarding/
│   │   │   └── OnboardingModal.tsx
│   │   └── ui/
│   │       ├── Badge.tsx
│   │       ├── Button.tsx
│   │       ├── Card.tsx
│   │       ├── Modal.tsx
│   │       └── Slider.tsx
│   ├── experiences/
│   │   ├── about/
│   │   │   └── AboutExperience.tsx
│   │   ├── home/
│   │   │   └── HomeLanding.tsx
│   │   ├── particles/
│   │   │   └── ParticleUniversePlaceholder.tsx
│   │   ├── runner/
│   │   │   └── GestureRunnerPlaceholder.tsx
│   │   └── studio/
│   │       └── GestureStudioPlaceholder.tsx
│   ├── styles/
│   │   ├── hud.css
│   │   └── index.css
│   ├── test/
│   │   └── foundation.test.tsx
│   ├── types/
│   │   └── navigation.ts
│   ├── App.tsx
│   └── main.tsx
├── vitest.config.ts
├── vite.config.ts
├── tsconfig.json
└── package.json
```

---

## License & Attribution

* Clean-room original TypeScript / Three.js implementation.
* Inspired by public interaction concepts in `harshooit/Hand-Gestures-Tracking`, `Jayanth0124/3D-gesture-control`, and `ronmacc/threejs-games`.
