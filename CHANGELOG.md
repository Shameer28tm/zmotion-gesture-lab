# Changelog

All notable changes to **ZMotion — Gesture Lab** are documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.3.0] - 2026-10-14

### Added
- **Production Vercel Configuration (`vercel.json`)**:
  - Pre-configured Vite SPA build settings (`buildCommand: "npm run build"`, `outputDirectory: "dist"`).
  - Single-page application wildcard rewrites (`/(.*) -> /index.html`) ensuring clean direct URL and hash navigation.
  - Strict security and privacy headers, including `Permissions-Policy: camera=(self)` for HTTPS webcam authorization.
  - Immutable 1-year caching for static asset bundles (`/assets/(.*)`).
- **Steering Direction Calibration Setting**:
  - Accessible Normal / Inverted horizontal steering selector added to `MobileControlDrawer` in Gesture Runner.
  - Preserves user preference in `localStorage` (`zmotion_runner_invert_controls`).
- **New Automated Test Suite (`runnerDirectionFix.test.ts`)**:
  - Mathematically validates 3D camera projection into NDC screen space (Left moves to negative NDC X, Right moves to positive NDC X).
  - Validates physical hand left/right translation to game lane transition.
  - Validates hysteresis deadbands, sustained fist latching, fair obstacle generation, and scene controller reset.
  - Expands total passing test coverage to **119 automated tests** across 14 test files.

### Changed & Fixed
- **Fixed Reversed Left/Right Game Movement in Gesture Runner**:
  - **Root Cause**: The Three.js chase camera is positioned behind the player at `z = -5.2` and looks forward along the positive Z axis (`z = +9.0`). In standard right-handed 3D coordinates, looking down $+Z$ means world $+X$ projects to screen LEFT and world $-X$ projects to screen RIGHT. `RunnerSceneController` was setting `mesh.position.x = player.x` and `obs.lane * 2.2`, causing player movement and obstacle rendering to be horizontally mirrored on screen.
  - **Fix**: Inverted the visual X mapping in `RunnerSceneController` (`this.playerGroup.position.x = -player.x;` and `mesh.position.set(-obs.lane * 2.2, ...)`), perfectly aligning screen Left with physical Left and screen Right with physical Right.
  - **Banking Tilt Alignment**: Aligned drone banking tilt (`this.playerGroup.rotation.z = -player.tilt`) so the drone banks realistically into turns (tilting left when moving left, and right when moving right).
  - **Keyboard & Mobile Touch Consistency**: Verified that keyboard ('A' / ArrowLeft) and touch "Left" buttons steer the player to screen Left, and ('D' / ArrowRight / "Right") steer to screen Right.
- **Improved Runner Gameplay**:
  - **Jitter-Free Steering with Hysteresis**: Added hysteresis deadbands in `setNormalizedHandX` ($\pm 0.22$ transition, $\pm 0.14$ inward return) to eliminate lane chattering when hand hovers near boundary thresholds.
  - **Sustained Fist Jump Prevention**: Fixed issue where sustained fist or 1-frame tracking drops caused repeated jumps. Required grounded state, minimum 350ms cooldown, and explicit hand release (`OPEN_PALM` or non-fist finger curls) before unlatching.
  - **Fair Obstacle Spawning**: Ensured that in `EASY` mode, whenever two lanes are blocked simultaneously, jumpable `BARRIER`s are spawned, eliminating unavoidable double-pylon traps.
  - **Dual-Hand Steering Priority**: When both hands are in view, the primary tracked hand maintains authoritative steering to prevent conflicting inputs.
  - **Scene Controller Reset**: Added `controller.reset()` on game start/restart to clear residual obstacle meshes and return drone transforms to origin.
- **Mobile Responsiveness Refinement**:
  - Added `.mobile-runner-score-badge` class and suppressed it on ultra-narrow viewports ($\le 360px$) in `hud.css` to prevent horizontal header wrapping.
  - Added descriptive `aria-label`s to compact Photo and Record buttons in `CaptureControls.tsx`.

---

## [1.2.0] - 2026-10-14

### Added
- **Simultaneous Dual-Hand Tracking & Skeleton Rendering**:
  - Configured MediaPipe Tasks Vision to `numHands: 2` across both GPU and CPU delegates.
  - Implemented `MultiHandTracker` engine tracking up to two hands simultaneously with independent IDs and metrics.
  - Safe association strategy combining Euclidean centroid proximity, velocity trajectory projection, and soft handedness affinity to resolve MediaPipe's non-deterministic hand array ordering and prevent identity swapping when hands cross.
  - Independent grace period management: when one hand temporarily drops out of frame, a ~200ms grace period holds its skeleton before cleanly removing it, while the remaining hand continues tracking and rendering seamlessly.
  - Upgraded `HandSkeletonRenderer.renderHands`: simultaneous 21-node anatomical skeleton rendering per hand with distinct color styling (Electric Blue `#00d2ff` for Hand 1 / Left Hand, and Electric Cyan `#00f5d4` for Hand 2 / Right Hand) and wrist telemetry badges (`● L · GESTURE` / `● R · GESTURE`).
  - Decoupled `HandSkeletonOverlay` subscribed to high-frequency animation frames without React state re-render overhead.
- **Adaptive Velocity-Aware Landmark Filter (`LandmarkFilter`)**:
  - Implemented per-hand `LandmarkFilter` with dynamic velocity adaptation.
  - Stationary jitter suppression ($\alpha \approx 0.68$) eliminating webcam sensor micro-fluctuations.
  - Fast-sweep responsiveness ($\alpha \approx 0.10$) preventing trailing lag behind fast physical hand movements.
  - Zero-jump tracking reacquisition on first detection and after tracking loss.
  - Independent filter instances ensuring coordinates between Hand 1 and Hand 2 are never averaged together.
- **Mobile Responsiveness & Viewport Refinement**:
  - Audited layouts across 320px, 360px, 390px, 430px, tablet, and desktop viewports.
  - Added ultra-compact mobile rules in `hud.css` (`@media (max-width: 380px)`) preventing horizontal overflow on 320px screens.
  - Added `touch-action: manipulation` and `-webkit-tap-highlight-color: transparent` across interactive HUD controls, eliminating the 300ms mobile browser tap delay.
  - Dynamic viewport height fallback (`min(88dvh, 88vh)`) and safe-area insets (`env(safe-area-inset-bottom)`) in `MobileControlDrawer`.
  - Added `@media (prefers-reduced-motion: reduce)` support across HUD, drawer transitions, and pulse indicators.
- **Dual-Hand & Viewport Automated Test Suites**:
  - Added `src/test/dualHandTracking.test.ts` (0, 1, 2 hands, independent hand loss, hand crossing, adaptive velocity smoothing, and simultaneous skeleton rendering).
  - Added `src/test/mobileViewports.test.ts` (CSS media queries, safe areas, touch optimization, reduced motion, and horizontal overflow prevention).
  - Test suite expanded to 109 passing automated tests across 13 test suites.

---

## [1.1.0] - 2026-10-14

### Added
- **Real-Time Hand Landmark Skeleton Overlay**:
  - Implemented 21-node anatomical skeleton overlay (`HandSkeletonRenderer` and `HandSkeletonOverlay`).
  - Canonical MediaPipe hand connection graph (wrist, thumb, index, middle, ring, pinky, and palm ring).
  - Accurate coordinate mapping accounting for `object-fit: cover` aspect ratio scaling, centering offset, horizontal mirroring (`1 - x`), and device pixel ratio capping.
  - Glowing nodes, cyan/blue connection strokes, and dynamic pinch highlight on landmarks #4 & #8.
  - Restrained hand tracking status badge.
  - Decoupled Canvas 2D layer subscribed to `engine.onFrame` without React re-renders on RAF.
  - Added Show/Hide Hand Skeleton toggle in advanced controls, enabled by default when tracking is active.
- **Mobile Responsive Architecture**:
  - Compact `MobileExperienceBar` for mobile screens (< 768px) with essential controls: Photo, Record, Camera Toggle, Tracking Indicator, and More/Settings.
  - Accessible `MobileControlDrawer` progressive disclosure bottom sheet with Done button, backdrop tap, and Escape key dismissal.
  - Mobile touch control bar in Gesture Runner (`mobile-runner-bar`) providing Left, Jump, and Right touch buttons without obstructing obstacles or player craft.
  - Responsive layout media queries in `hud.css` and dynamic viewport height (`100dvh`) handling.
- **Developer Credit**:
  - Added editorial typography credit `"Developed by Shameer TM"` linking to [https://www.linkedin.com/in/shameerion](https://www.linkedin.com/in/shameerion) on the landing page brand section.
- **Engineering Documentation**:
  - Added `docs/architecture.md` and `docs/diagrams/system-architecture.md` with full Mermaid diagram.
  - Added `docs/benchmarks.md` with repeatable measurement methodology.
  - Added `docs/production-best-practices.md` covering HTTPS, CSP, WebGL cleanup, and release workflows.
  - Added `docs/privacy.md` and `SECURITY.md`.
  - Added GitHub Actions CI workflow (`.github/workflows/ci.yml`), issue templates, and PR template.
- **Automated Regression Test Suites**:
  - Added `src/test/handSkeleton.test.ts` (skeleton coordinate projection, connection graphs, and lifecycle).
  - Added `src/test/mobileResponsiveUx.test.tsx` (mobile bar, drawer open/close, essential controls, runner touch bar).
  - Added `src/test/routeHygiene.test.tsx` (obsolete route redirection and developer credit validation).

### Changed
- Capped device pixel ratio to `Math.min(window.devicePixelRatio || 1, 2)` across Three.js scene controllers and skeleton overlay to prevent GPU fill-rate starvation on high-density mobile screens.
- Enhanced WebGL resource deallocation in `RunnerSceneController.dispose()` to explicitly traverse and clean up obstacle meshes, player group, and track geometry.
- Added `@media (prefers-reduced-motion: reduce)` support in `spaceBackground.css` to respect user motion preferences.

### Removed
- **Tech & Architecture Website Route**:
  - Completely removed `#about` route and obsolete page code (`AboutExperience.tsx`).
  - Removed navigation entry and landing page links.
  - Added safe hash fallback in `App.tsx` redirecting unknown hashes and `#about` directly to `#home`.
  - Architecture documentation preserved and expanded within the GitHub repository (`docs/architecture.md`).

---

## [1.0.0] - 2026-10-10

### Added
- Initial baseline release of ZMotion Gesture Lab.
- Three.js 3D Gesture Studio, Particle Universe, and Endless Cyber Runner.
- MediaPipe Tasks Vision WebAssembly single-stream integration.
- 100% in-browser client-side photo snapshot and video recording (`MediaRecorder`).
- 2D CSS Cosmic Space Background on home landing page.
