# Production Best Practices & Deployment Guide

> **Production Deployment, Security, and Reliability Guidelines for ZMotion — Gesture Lab**

---

## 1. Hosting & Deployment Configuration

### 1.1 HTTPS Requirement for MediaDevices
Modern web browsers mandate a Secure Context (`https://` or `http://localhost`) to access `navigator.mediaDevices.getUserMedia`.
- **Enforce Strict HTTPS**: All HTTP requests must redirect with a `301 Moved Permanently` to `https://`.
- **HSTS Headers**: Configure `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`.

### 1.2 Content Security Policy (CSP)
Because ZMotion executes WebAssembly and accesses external model weights from Google's static CDN, your hosting server or edge headers (e.g., Cloudflare, Vercel, Netlify) must provide an appropriate CSP:

```http
Content-Security-Policy: 
  default-src 'self';
  script-src 'self' 'unsafe-eval' 'wasm-unsafe-eval' https://cdn.jsdelivr.net;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  font-src 'self' https://fonts.gstatic.com data:;
  img-src 'self' data: blob:;
  media-src 'self' blob: mediastream:;
  connect-src 'self' https://cdn.jsdelivr.net https://storage.googleapis.com blob:;
  worker-src 'self' blob:;
  object-src 'none';
  frame-ancestors 'none';
  base-uri 'self';
```

> [!NOTE]
> `wasm-unsafe-eval` is required for `@mediapipe/tasks-vision` to compile WebAssembly modules in Chromium and WebKit.

---

## 2. Camera Lifecycle & Permission Management

### 2.1 Implemented Practices
- **Singleton Stream**: Managed strictly through `CameraManager.getInstance()`. Video capture streams are never duplicated.
- **Graceful Permission Denial Handling**: If `getUserMedia` rejects with `NotAllowedError` or `NotFoundError`, `CameraManager` transitions cleanly to an error status and does not lock up the UI.
- **Standby Fallback**: All three experiences (Studio, Particles, Runner) feature full mouse, wheel, keyboard, and on-screen touch controls that operate flawlessly when camera access is denied or disabled.
- **Stream Auto-Resume Watchdog**: Mobile and desktop browsers can pause detached video elements during DOM manipulation. `ensureActivePlayback()` runs periodic checks to trigger `.play()` on unpaused active streams.

### 2.2 Recommended Future Hardening
- **Dynamic Camera Switching**: Add an explicit UI select dropdown for multi-camera setups (e.g., switching between front-facing and rear ultra-wide cameras on mobile).

---

## 3. WebGL Resource Management & Memory Hygiene

### 3.1 Implemented Practices
- **Explicit Lifecycle Cleanup**: Every scene controller (`StudioSceneController`, `ParticleSceneController`, `RunnerSceneController`) exposes a dedicated `dispose()` method.
- **Buffer & Geometry Deallocation**: All `BufferGeometry`, `Material`, and `Mesh` instances are traversed and disposed when switching routes or unmounting.
- **Context Loss Induction**: Calling `renderer.forceContextLoss()` and `renderer.dispose()` ensures GPU memory handles are discarded by the browser graphics compositor immediately.
- **DPR Capping**: `Math.min(window.devicePixelRatio || 1, 2)` prevents out-of-memory crashes on high-DPI (3x/4x) mobile displays.
- **`preserveDrawingBuffer` Rationale**: Retained strictly to enable instant client-side photo snapshots and Canvas-to-MediaRecorder video clips without requiring an offscreen rendering twin.

---

## 4. Performance Budgets & Bundle Optimization

### Current Production Bundle Metrics (Vite 6)
- **Initial Landing Page (`dist/index.html` + `dist/assets/index-*.js`)**: ~86 kB gzipped.
- **3D Engine (`three-vendor-*.js`)**: 120 kB gzipped (Code-split; loaded only when navigating to an experience).
- **Vision Pipeline (`vision_bundle-*.js`)**: 40 kB gzipped (Code-split).
- **Chunk Warning Threshold**: Configured to 1,000 kB; all chunks remain below 500 kB.

---

## 5. Mobile Responsive UX Architecture

### 5.1 Dynamic Viewport Handling
- **Full Viewport Layout**: Uses `100dvh` (Dynamic Viewport Height) to prevent layout jumping when mobile URL bars expand or collapse.
- **Safe-Area Insets**: Uses `env(safe-area-inset-top)` and `env(safe-area-inset-bottom)` to account for mobile notches, island cutouts, and bottom navigation home indicators.
- **Progressive Disclosure Drawer**: Advanced settings (solid shapes, density selectors, wireframe toggles, hand skeleton toggles) are kept inside an accessible sliding bottom sheet drawer (`MobileControlDrawer.tsx`) below 768px.
- **Touch-First Controls**: All mobile buttons have minimum touch targets of 44 × 44 px.

---

## 6. Accessibility & Inclusivity

- **Semantic HTML & ARIA**: Sliders, modals, drawers, and buttons declare `aria-label`, `role="dialog"`, `aria-modal="true"`, and `role="region"`.
- **Keyboard Navigation**: The mobile drawer and modals trap focus and support closing via the `Escape` key.
- **Reduced Motion Support**: The landing-page cosmic background checks `@media (prefers-reduced-motion: reduce)` to disable continuous celestial orbital animations.

---

## 7. Testing & Quality Assurance Strategy

1. **Automated Unit & Integration Tests**: 90 passing tests via Vitest across 11 test suites covering core math, gesture classifiers, capture services, responsive HUD, skeleton rendering, and route hygiene.
2. **Headless Execution**: Vitest runs in JSDOM with mocked video, canvas 2D, and WebGL stubs for CI execution.
3. **Continuous Integration**: GitHub Actions executes linting, type checks (`tsc -b`), tests (`vitest run`), and production compilation (`vite build`) on every push and pull request.

---

## 8. Release & Rollback Procedures

1. **Branch Strategy**: `main` serves as the release branch. All features and fixes land via Pull Requests.
2. **Automated Verification**: Never merge without a green CI status.
3. **Semantic Versioning**: Tag releases according to SemVer conventions (`v1.0.0`, `v1.1.0`).
4. **Instant Rollback**: Static hosting (Vercel, Cloudflare Pages, Netlify) provides atomic instant rollbacks to previous immutable deployment hashes if a regression occurs in production.
