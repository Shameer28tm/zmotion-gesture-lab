# Changelog

All notable changes to **ZMotion — Gesture Lab** are documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
